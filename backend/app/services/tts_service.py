"""Dual-Engine Zero-Disk Streaming Text-to-Speech (TTS) Service.

Thiết kế theo 2 hướng song song — **KHÔNG sinh / KHÔNG lưu bất kỳ file `.mp3` nào ra ổ đĩa**:

1. **Engine 1 — Universal RAM Streaming (`edge-neural`, 140+ ngôn ngữ, >300 giọng Neural):**
   - Ánh xạ tức thì 5 ngôn ngữ cốt lõi (`vi`, `en`, `fr`, `zh`, `ja`) và tự động tra cứu
     mọi ngôn ngữ khác trên thế giới (`ko`, `th`, `de`, `es`, `ru`, `it`, `pt`, `id`, `ar`, `hi`...)
     qua danh mục giọng động `edge_tts.list_voices()`.
   - Stream trực tiếp trong RAM kèm bộ đệm LRU giới hạn nhẹ trong RAM (tắt server = 0 file rác).

2. **Engine 2 — Open-Source 100% Offline ONNX (`sherpa-onnx`, WAV thuần trong RAM):**
   - Chạy mô hình mã nguồn mở cục bộ trên CPU không cần Internet, không cần API key:
     - Piper VITS ONNX (`vits-piper-vi_VN-vais1000-medium`, `en`, `fr`, `zh`, `de`, `es`, `ru`...)
     - Kokoro-82M Multi-Lang ONNX (`kokoro-multi-lang-v1_0` cho `en/fr/zh/ja/es/it/pt/hi`)
     - Tự động nhận diện mọi thư mục model `.onnx` + `tokens.txt` đặt trong `backend/models/tts/<lang>/`.
   - Tổng hợp PCM và đóng gói `audio/wav` hoàn toàn trong `io.BytesIO` (0 file tạm trên đĩa).

Chế độ `provider="auto"` (mặc định):
- Ưu tiên Engine 1 (`edge-neural` 140+ ngôn ngữ trong RAM) → nếu mất mạng hoặc bị chặn,
  tự động chuyển sang Engine 2 (`sherpa-onnx` offline ONNX trong RAM).
- Hỗ trợ chỉ định tường minh `provider="offline"` (ép chạy 100% open-source cục bộ)
  hoặc `provider="neural"` (ép chạy Neural RAM stream).
"""

from __future__ import annotations

import array
import asyncio
from collections import OrderedDict
from dataclasses import dataclass
import hashlib
import io
import logging
import os
from pathlib import Path
import re
import tarfile
import threading
from typing import Any, Literal
import urllib.request
import wave

from app.core.config import settings

logger = logging.getLogger(__name__)

VoiceGender = Literal["female", "male"]
TtsProviderMode = Literal["auto", "neural", "offline"]

MAX_TTS_TEXT_LENGTH = 4000
EDGE_TTS_ATTEMPT_TIMEOUT_SECONDS = 5.0

_ROMAN_NUMERALS_MAP: dict[str, int] = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7,
    "VIII": 8, "IX": 9, "X": 10, "XI": 11, "XII": 12, "XIII": 13,
    "XIV": 14, "XV": 15, "XVI": 16, "XVII": 17, "XVIII": 18,
    "XIX": 19, "XX": 20, "XXI": 21, "XXII": 22,
}

_VI_FOREIGN_PRONUNCIATION_MAP: list[tuple[str, str]] = [
    (r"\bAlfred\s+Foulhoux\b", "An phờ rét Phu lu"),
    (r"\bMarie-Alfred\s+Foulhoux\b", "Ma ri An phờ rét Phu lu"),
    (r"\bGustave\s+Eiffel\b", "Gút xờ táp Ép phen"),
    (r"\bJules\s+Bourard\b", "Giuyn Bu ra"),
    (r"\bEug[eè]ne\s+Ferret\b", "Ơ gien Phê rê"),
    (r"\bPaul\s+Gard[eè]s\b", "Pôn Gác đét"),
    (r"\bPaul\s+Doumer\b", "Pôn Đu me"),
    (r"\bAlexandre\s+de\s+Rhodes\b", "A lếch xăng đờ Rốt"),
    (r"\bPigneau\s+de\s+B[eé]haine\b", "Pi nhô đờ Bê hen"),
    (r"\bH[oô]tel\s+de\s+Ville\b", "Ô ten đờ Vin"),
    (r"\bVilla\s+Blanche\b", "Vi la Blăng"),
    (r"\bNotre[- ]Dame\b", "Nốt tơ Đam"),
    (r"\bArt\s+Deco\b", "Ạc Đê cô"),
    (r"\bArt\s+Nouveau\b", "Ạc Nu vô"),
    (r"\bCable\s+Car\b", "cáp treo"),
    (r"\bLandmark\s*81\b", "Len mác 81"),
    (r"\bVũng\s+Tàu\s+Marina\b", "Vũng Tàu Ma ri na"),
    (r"\bCheck-in\b", "chếch in"),
    (r"\bUNESCO\b", "U nét cô"),
    (r"\bRomanesque\b", "Rô ma nét"),
    (r"\bNeoclassical\b", "tân cổ điển"),
    (r"\bRenaissance\b", "Rơ ne xăng"),
    (r"\bGothic\b", "Gô tích"),
    (r"\bBaroque\b", "Ba rốc"),
    (r"\bRoman\b", "Rô măng"),
    (r"\bIndochine\b", "In đô sin"),
    (r"\bIndochina\b", "Đông Dương"),
    (r"\bFoulhoux\b", "Phu lu"),
    (r"\bVilledieu\b", "Vin điơ"),
    (r"\bEiffel\b", "Ép phen"),
    (r"\bBourard\b", "Bu ra"),
    (r"\bFerret\b", "Phê rê"),
    (r"\bGard[eè]s\b", "Gác đét"),
    (r"\bPasteur\b", "Pát xờ tơ"),
    (r"\bYersin\b", "Y éc xanh"),
    (r"\bCalmette\b", "Can mét"),
    (r"\bNorodom\b", "Nô rô đôm"),
    (r"\bMarseille\b", "Mác xây"),
    (r"\bParis\b", "Pa ri"),
    (r"\bBitexco\b", "Bi tếch cô"),
    (r"\bContinental\b", "Côn ti nen tồ"),
    (r"\bMajestic\b", "Ma gét tích"),
    (r"\bCaravelle\b", "Ca ra ven"),
    (r"\bOpera\b", "Ô pê ra"),
    (r"\bMarina\b", "Ma ri na"),
    (r"\bBoulevard\b", "đại lộ"),
    (r"\bPlaza\b", "Pờ la da"),
    (r"\bResort\b", "khu nghỉ dưỡng"),
    (r"\bSafari\b", "Sa pha ri"),
    (r"\bSaigon\b", "Sài Gòn"),
    (r"\bview\b", "tầm nhìn"),
    (r"\b3D\b", "ba đê"),
    (r"\b4D\b", "bốn đê"),
    (r"\bGPS\b", "Gờ Pê Ét"),
]

# 5 ngôn ngữ cốt lõi của ứng dụng được ánh xạ sẵn (0ms lookup)
NEURAL_VOICES: dict[str, dict[str, dict[str, str]]] = {
    "vi": {
        "female": {
            "id": "vi-VN-HoaiMyNeural",
            "label": "Hoài My (Nữ · Truyền cảm)",
            "locale": "vi-VN",
        },
        "male": {
            "id": "vi-VN-NamMinhNeural",
            "label": "Nam Minh (Nam · Trầm ấm)",
            "locale": "vi-VN",
        },
    },
    "en": {
        "female": {
            "id": "en-US-AriaNeural",
            "label": "Aria (Female · Expressive)",
            "locale": "en-US",
        },
        "male": {
            "id": "en-US-GuyNeural",
            "label": "Guy (Male · Warm)",
            "locale": "en-US",
        },
    },
    "fr": {
        "female": {
            "id": "fr-FR-DeniseNeural",
            "label": "Denise (Femme · Naturelle)",
            "locale": "fr-FR",
        },
        "male": {
            "id": "fr-FR-HenriNeural",
            "label": "Henri (Homme · Posé)",
            "locale": "fr-FR",
        },
    },
    "zh": {
        "female": {
            "id": "zh-CN-XiaoxiaoNeural",
            "label": "晓晓 (女声 · 自然)",
            "locale": "zh-CN",
        },
        "male": {
            "id": "zh-CN-YunxiNeural",
            "label": "云希 (男声 · 沉稳)",
            "locale": "zh-CN",
        },
    },
    "ja": {
        "female": {
            "id": "ja-JP-NanamiNeural",
            "label": "七海 (女性 · 丁寧)",
            "locale": "ja-JP",
        },
        "male": {
            "id": "ja-JP-KeitaNeural",
            "label": "圭太 (男性 · 落ち着き)",
            "locale": "ja-JP",
        },
    },
}

# Danh mục model Open-Source Offline (k2-fsa/sherpa-onnx) — tải bằng `python -m scripts.download_tts_models`
OFFLINE_ONNX_CATALOG: dict[str, dict[str, Any]] = {
    "vi": {
        "name": "vits-piper-vi_VN-vais1000-medium",
        "kind": "vits",
        "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-vi_VN-vais1000-medium.tar.bz2",
        "size_mb": 63,
        "languages": ["vi"],
        "label": "Piper VITS Tiếng Việt (VAIS1000 · Offline)",
    },
    "en": {
        "name": "vits-piper-en_US-lessac-medium",
        "kind": "vits",
        "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-lessac-medium.tar.bz2",
        "size_mb": 63,
        "languages": ["en"],
        "label": "Piper VITS English US (Lessac · Offline)",
    },
    "fr": {
        "name": "vits-piper-fr_FR-siwis-medium",
        "kind": "vits",
        "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-fr_FR-siwis-medium.tar.bz2",
        "size_mb": 63,
        "languages": ["fr"],
        "label": "Piper VITS Français (Siwis · Offline)",
    },
    "zh": {
        "name": "vits-piper-zh_CN-huayan-medium",
        "kind": "vits",
        "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-zh_CN-huayan-medium.tar.bz2",
        "size_mb": 63,
        "languages": ["zh"],
        "label": "Piper VITS 中文 (Huayan · Offline)",
    },
    "de": {
        "name": "vits-piper-de_DE-thorsten-medium",
        "kind": "vits",
        "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-de_DE-thorsten-medium.tar.bz2",
        "size_mb": 63,
        "languages": ["de"],
        "label": "Piper VITS Deutsch (Thorsten · Offline)",
    },
    "es": {
        "name": "vits-piper-es_ES-davefx-medium",
        "kind": "vits",
        "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-es_ES-davefx-medium.tar.bz2",
        "size_mb": 63,
        "languages": ["es"],
        "label": "Piper VITS Español (DaveFX · Offline)",
    },
    "ru": {
        "name": "vits-piper-ru_RU-ruslan-medium",
        "kind": "vits",
        "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-ru_RU-ruslan-medium.tar.bz2",
        "size_mb": 63,
        "languages": ["ru"],
        "label": "Piper VITS Русский (Ruslan · Offline)",
    },
    "kokoro": {
        "name": "kokoro-multi-lang-v1_0",
        "kind": "kokoro",
        "url": "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2",
        "size_mb": 330,
        "languages": ["en", "fr", "zh", "ja", "es", "it", "pt", "hi"],
        "label": "Kokoro-82M Multi-Lang (EN/FR/ZH/JA/ES/IT/PT/HI · Offline)",
    },
}

# Ánh xạ speaker ID mặc định cho Kokoro-82M Multi-Lang v1.0 (53 speakers)
_KOKORO_SPEAKER_IDS: dict[str, dict[str, int]] = {
    "en": {"female": 0, "male": 11},
    "ja": {"female": 37, "male": 41},
    "zh": {"female": 45, "male": 49},
    "fr": {"female": 30, "male": 30},
    "es": {"female": 28, "male": 29},
    "it": {"female": 35, "male": 36},
    "pt": {"female": 42, "male": 43},
    "hi": {"female": 31, "male": 33},
}


@dataclass(frozen=True)
class TtsSynthesisResult:
    audio_bytes: bytes
    media_type: str
    voice_id: str
    provider: Literal["edge-neural", "sherpa-onnx"]
    cache_hit: bool


# Bounded LRU RAM Cache (0 file rác trên ổ đĩa!)
_ram_audio_cache: OrderedDict[str, tuple[bytes, str, str, Literal["edge-neural", "sherpa-onnx"]]] = OrderedDict()
_synthesis_locks: dict[str, asyncio.Lock] = {}
_dynamic_voices_cache: list[dict[str, Any]] | None = None
_dynamic_voices_lock = asyncio.Lock()
_offline_tts_instances: dict[str, Any] = {}
_model_download_lock = threading.Lock()


def _resolve_catalog_key_for_language(language: str) -> str | None:
    base = _base_lang(language)
    if base in OFFLINE_ONNX_CATALOG:
        return base
    if base in OFFLINE_ONNX_CATALOG["kokoro"]["languages"]:
        return "kokoro"
    return None


def ensure_offline_model_installed_sync(catalog_or_lang_key: str) -> Path:
    """Download & extract an open-source ONNX model directly inside Backend (idempotent, thread-safe)."""
    key = _base_lang(catalog_or_lang_key)
    resolved_key = key if key in OFFLINE_ONNX_CATALOG else _resolve_catalog_key_for_language(key)
    if not resolved_key:
        valid = ", ".join(sorted(OFFLINE_ONNX_CATALOG.keys()))
        raise RuntimeError(f"Không có model offline cho '{catalog_or_lang_key}'. Hỗ trợ: {valid}")

    entry = OFFLINE_ONNX_CATALOG[resolved_key]
    target_root = settings.tts_models_dir_path
    dest_dir = target_root / str(entry["name"])

    def _is_ready(d: Path) -> bool:
        if not d.is_dir():
            return False
        onnx_files = list(d.glob("*.onnx"))
        if not onnx_files:
            return False
        if entry["kind"] == "kokoro":
            return (d / "tokens.txt").is_file() and (d / "voices.bin").is_file()
        return Path(f"{onnx_files[0]}.json").is_file() or (d / "tokens.txt").is_file()

    if _is_ready(dest_dir):
        return dest_dir

    with _model_download_lock:
        if _is_ready(dest_dir):
            return dest_dir

        url = str(entry["url"])
        logger.info("Downloading offline ONNX TTS model '%s' (~%s MB)...", entry["name"], entry["size_mb"])
        target_root.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "SmartHeritageGuide/1.0"})
        with urllib.request.urlopen(req, timeout=180) as resp:
            raw = resp.read()

        with tarfile.open(fileobj=io.BytesIO(raw), mode="r:bz2") as tar:
            tar.extractall(path=target_root)

        if not _is_ready(dest_dir):
            raise RuntimeError(f"Tải model offline '{entry['name']}' hoàn tất nhưng thiếu file ONNX trong {dest_dir}.")

        logger.info("Offline ONNX TTS model ready: %s", dest_dir)
        return dest_dir


def preload_offline_models_sync(langs_csv: str | None = None) -> list[str]:
    """Preload configured offline ONNX models (used by Dockerfile build & Backend startup warmup)."""
    raw = langs_csv if langs_csv is not None else settings.TTS_PRELOAD_OFFLINE_LANGS
    keys = [item.strip().lower() for item in (raw or "").split(",") if item.strip()]
    loaded: list[str] = []
    for k in keys:
        try:
            dest = ensure_offline_model_installed_sync(k)
            loaded.append(dest.name)
        except Exception as exc:
            logger.warning("Skipping offline TTS preload for '%s': %s", k, exc)
    return loaded


async def warmup_tts_in_background() -> None:
    """Non-blocking startup warmup executed by FastAPI lifespan (skipped during pytest)."""
    if os.environ.get("PYTEST_CURRENT_TEST") or settings.APP_ENV.lower() == "test":
        return
    if not settings.TTS_AUTO_DOWNLOAD_OFFLINE or not is_offline_onnx_available():
        return
    raw = (settings.TTS_PRELOAD_OFFLINE_LANGS or "").strip()
    if not raw:
        return
    await asyncio.to_thread(preload_offline_models_sync, raw)


def clear_ram_cache() -> None:
    """Clear in-memory LRU TTS audio cache (useful for tests)."""
    _ram_audio_cache.clear()


def _get_lock(key: str) -> asyncio.Lock:
    lock = _synthesis_locks.get(key)
    if lock is None:
        lock = asyncio.Lock()
        _synthesis_locks[key] = lock
    return lock


def _normalize_lang_code(language: str) -> str:
    clean = (language or "vi").strip().lower().replace("_", "-")
    return clean or "vi"


def _base_lang(language: str) -> str:
    return _normalize_lang_code(language).split("-", 1)[0]


def _cache_get(
    key: str,
) -> tuple[bytes, str, str, Literal["edge-neural", "sherpa-onnx"]] | None:
    entry = _ram_audio_cache.get(key)
    if entry is not None:
        _ram_audio_cache.move_to_end(key)
    return entry


def _cache_put(
    key: str,
    audio_bytes: bytes,
    media_type: str,
    voice_id: str,
    provider: Literal["edge-neural", "sherpa-onnx"],
) -> None:
    max_items = max(8, int(getattr(settings, "TTS_RAM_CACHE_MAX_ITEMS", 64)))
    _ram_audio_cache[key] = (audio_bytes, media_type, voice_id, provider)
    _ram_audio_cache.move_to_end(key)
    while len(_ram_audio_cache) > max_items:
        _ram_audio_cache.popitem(last=False)


def resolve_neural_voice(
    language: str,
    gender: VoiceGender = "female",
) -> dict[str, str]:
    """Resolve curated neural voice synchronously (for core 5 languages)."""
    base = _base_lang(language)
    lang_map = NEURAL_VOICES.get(base, NEURAL_VOICES["vi"])
    return lang_map.get(gender, lang_map["female"])


async def _load_all_edge_voices() -> list[dict[str, Any]]:
    """Fetch and cache the full 140+ language / 300+ voice catalog from edge-tts in RAM."""
    global _dynamic_voices_cache
    if _dynamic_voices_cache is not None:
        return _dynamic_voices_cache
    async with _dynamic_voices_lock:
        if _dynamic_voices_cache is not None:
            return _dynamic_voices_cache
        try:
            import edge_tts

            if hasattr(edge_tts, "list_voices"):
                voices = await edge_tts.list_voices()
                if isinstance(voices, list):
                    _dynamic_voices_cache = voices
                    return voices
        except Exception:
            pass
    return []


async def resolve_dynamic_neural_voice(
    language: str,
    gender: VoiceGender = "female",
) -> dict[str, str]:
    """Resolve ANY language code (e.g. `vi`, `ko`, `th`, `de`, `es`, `ar`, `ko-KR`, `pt-BR`)."""
    norm = _normalize_lang_code(language)
    base = _base_lang(norm)

    # Ưu tiên danh mục chuẩn 5 ngôn ngữ cốt lõi (tránh network call list_voices)
    if base in NEURAL_VOICES and "-" not in norm:
        return NEURAL_VOICES[base].get(gender, NEURAL_VOICES[base]["female"])

    # Tra cứu động trên toàn bộ 140+ ngôn ngữ của Microsoft Neural TTS
    voices = await _load_all_edge_voices()
    want_gender = "Female" if gender == "female" else "Male"

    exact_locale: list[dict[str, Any]] = []
    prefix_lang: list[dict[str, Any]] = []
    for v in voices:
        locale = str(v.get("Locale", "")).lower()
        short_name = str(v.get("ShortName", ""))
        if not short_name:
            continue
        if locale == norm:
            exact_locale.append(v)
        elif locale.startswith(f"{base}-") or locale == base:
            prefix_lang.append(v)

    pool = exact_locale or prefix_lang
    if pool:
        gender_matched = [v for v in pool if str(v.get("Gender", "")).lower() == want_gender.lower()]
        chosen = (gender_matched or pool)[0]
        short_name = str(chosen["ShortName"])
        friendly = str(chosen.get("FriendlyName") or short_name)
        return {
            "id": short_name,
            "label": friendly,
            "locale": str(chosen.get("Locale", norm)),
        }

    # Fallback về ngôn ngữ cốt lõi nếu có
    if base in NEURAL_VOICES:
        return NEURAL_VOICES[base].get(gender, NEURAL_VOICES[base]["female"])
    return NEURAL_VOICES["en"].get(gender, NEURAL_VOICES["en"]["female"])


def normalize_text_for_speech(text: str, language: str = "vi") -> str:
    """Preprocess heritage script text so TTS speaks naturally with clear pauses."""
    cleaned = (text or "").strip()
    if not cleaned:
        return ""

    base = _base_lang(language)

    # Strip markdown emphasis/links
    cleaned = re.sub(r"[*_`#]+", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)

    if base == "vi":
        # 1. Ngày tháng dd/mm/yyyy & ngày lễ lịch sử (xử lý trước khi thay dấu `/`)
        cleaned = re.sub(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b", r"\1 tháng \2 năm \3", cleaned)
        cleaned = re.sub(
            r"\b(ngày|mùng|đêm|sáng|chiều|tối|lễ|chiến thắng|giải phóng|kỷ niệm)\s+(\d{1,2})/(\d{1,2})\b",
            r"\1 \2 tháng \3",
            cleaned,
            flags=re.IGNORECASE,
        )
        for date_pat, date_repl in (
            (r"\b(?:30/4|30/04)\b", "30 tháng 4"),
            (r"\b(?:2/9|02/09)\b", "2 tháng 9"),
            (r"\b(?:19/8|19/08)\b", "19 tháng 8"),
            (r"\b(?:19/5|19/05)\b", "19 tháng 5"),
            (r"\b(?:7/5|07/05)\b", "7 tháng 5"),
            (r"\b(?:1/5|01/05)\b", "1 tháng 5"),
            (r"\b20/11\b", "20 tháng 11"),
        ):
            cleaned = re.sub(date_pat, date_repl, cleaned)

        # 2. Số La Mã sau thế kỷ / giai đoạn / khu / thứ
        def _repl_roman_range(m: re.Match[str]) -> str:
            r1 = _ROMAN_NUMERALS_MAP.get(m.group(2).upper())
            r2 = _ROMAN_NUMERALS_MAP.get(m.group(3).upper())
            if r1 and r2:
                return f"{m.group(1)} {r1} đến {r2}"
            return m.group(0)

        def _repl_roman_single(m: re.Match[str]) -> str:
            r1 = _ROMAN_NUMERALS_MAP.get(m.group(2).upper())
            return f"{m.group(1)} {r1}" if r1 else m.group(0)

        cleaned = re.sub(
            r"\b(thế kỷ|giai đoạn|khu|phần|đợt|cấp|tầng|hạng|thứ)\s+([IVX]{1,5})\s*[–—-]\s*([IVX]{1,5})\b",
            _repl_roman_range,
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(
            r"\b(thế kỷ|giai đoạn|khu|phần|đợt|cấp|tầng|hạng|thứ)\s+([IVX]{1,5})\b",
            _repl_roman_single,
            cleaned,
            flags=re.IGNORECASE,
        )

        # 3. Từ viết tắt, đơn vị đo, tiền tệ, giờ, khoảng năm và số thập phân
        replacements = [
            (r"\bTP\.?\s*HCM\b", "Thành phố Hồ Chí Minh"),
            (r"\bTP\.?\s*Thủ Đức\b", "Thành phố Thủ Đức"),
            (r"\bTP\.?\s*Vũng Tàu\b", "Thành phố Vũng Tàu"),
            (r"\bUBND\b", "Ủy ban nhân dân"),
            (r"\bKTS\.?\s*", "Kiến trúc sư "),
            (r"\bHSSV\b", "học sinh, sinh viên"),
            (r"\bQ\.\s*(\d+)\b", r"Quận \1"),
            (r"\bP\.\s*(\d+)\b", r"Phường \1"),
            (r"\bQL\.?\s*(\d+[A-Z]?)\b", r"Quốc lộ \1"),
            (r"(\d+(?:[.,]\d+)?)\s*km²", r"\1 ki lô mét vuông"),
            (r"(\d+(?:[.,]\d+)?)\s*m²", r"\1 mét vuông"),
            (r"(\d+(?:[.,]\d+)?)\s*km/h", r"\1 ki lô mét mỗi giờ"),
            (r"(\d+(?:[.,]\d+)?)\s*ha\b", r"\1 héc ta"),
            (r"(\d+(?:[.,]\d+)?)\s*km\b", r"\1 ki lô mét"),
            (r"(\d+(?:[.,]\d+)?)\s*cm\b", r"\1 xăng ti mét"),
            (r"(\d+(?:[.,]\d+)?)\s*mm\b", r"\1 mi li mét"),
            (r"(\d+(?:[.,]\d+)?)\s*m\b", r"\1 mét"),
            (r"(\d+(?:[.,]\d+)?)\s*°\s*C", r"\1 độ Cê"),
            (r"(\d+(?:[.,]\d+)?)\s*°", r"\1 độ"),
            (r"(\d+(?:[.,]\d+)?)\s*%", r"\1 phần trăm"),
            (r"(\d[\d\.]*)\s*(?:VNĐ|VND|đ)(?=$|[\s,.;:!?)/])", r"\1 đồng"),
            (r"(\d[\d\.]*)\s*USD\b", r"\1 đô la Mỹ"),
            (r"(\d{1,2}):00\s*[–—-]\s*(\d{1,2}):00", r"\1 giờ đến \2 giờ"),
            (r"(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})", r"\1 giờ \2 đến \3 giờ \4"),
            (r"\b(\d{1,2}):00\b", r"\1 giờ"),
            (r"\b(\d{1,2}):(\d{2})\b", r"\1 giờ \2"),
            (r"(\d{1,4})\s*[–—-]\s*(\d{1,4})", r"\1 đến \2"),
            (r"(\d+),(\d+)", r"\1 phẩy \2"),
        ]
        for pattern, repl in replacements:
            cleaned = re.sub(pattern, repl, cleaned, flags=re.IGNORECASE)

        # 4. Phiên âm tên riêng nước ngoài & thuật ngữ kiến trúc
        for pattern, repl in _VI_FOREIGN_PRONUNCIATION_MAP:
            cleaned = re.sub(pattern, repl, cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\bAI\b", "ây ai", cleaned)
    elif base == "en":
        cleaned = re.sub(r"(\d{3,4})\s*[–—-]\s*(\d{3,4})", r"\1 to \2", cleaned)
        cleaned = re.sub(r"(\d+(?:\.\d+)?)\s*m²", r"\1 square meters", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"(\d+(?:\.\d+)?)\s*km²", r"\1 square kilometers", cleaned, flags=re.IGNORECASE)

    # Convert awkward separators into natural vocal pauses
    cleaned = re.sub(r"\s*[–—]\s*", ", ", cleaned)
    cleaned = re.sub(r"\s*·\s*", ", ", cleaned)
    cleaned = re.sub(r"\s*/\s*", ", ", cleaned)
    cleaned = re.sub(r"\s*\|\s*", ", ", cleaned)
    cleaned = re.sub(r",\s*,+", ", ", cleaned)
    cleaned = re.sub(r"\s+([,.;:!?])", r"\1", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if len(cleaned) > MAX_TTS_TEXT_LENGTH:
        cleaned = cleaned[:MAX_TTS_TEXT_LENGTH].rsplit(" ", 1)[0].strip()

    return cleaned


# ---------------------------------------------------------------------------
# Engine 2: Open-Source Offline ONNX TTS (sherpa-onnx, Pure WAV in RAM)
# ---------------------------------------------------------------------------
def is_piper_tts_available() -> bool:
    try:
        from piper.voice import PiperVoice  # noqa: F401

        return True
    except ImportError:
        return False


def is_sherpa_onnx_available() -> bool:
    try:
        import sherpa_onnx  # noqa: F401

        return True
    except ImportError:
        return False


def is_offline_onnx_available() -> bool:
    return is_piper_tts_available() or is_sherpa_onnx_available()


def _find_offline_model_dir(language: str) -> tuple[Path, str] | None:
    """Locate an installed sherpa-onnx model folder inside `backend/models/tts/`."""
    models_root = settings.tts_models_dir_path
    if not models_root.is_dir():
        return None

    base = _base_lang(language)
    candidates: list[tuple[Path, str]] = []

    # 1. Thư mục đặt trực tiếp theo mã ngôn ngữ: models/tts/<lang>/
    direct_dir = models_root / base
    if direct_dir.is_dir():
        candidates.append((direct_dir, "vits"))

    # 2. Thư mục chuẩn theo tên archive trong OFFLINE_ONNX_CATALOG
    cat = OFFLINE_ONNX_CATALOG.get(base)
    if cat:
        named_dir = models_root / str(cat["name"])
        if named_dir.is_dir():
            candidates.append((named_dir, str(cat["kind"])))

    # 3. Quét bất kỳ thư mục nào bắt đầu bằng `vits-piper-<base>` hoặc `vits-<base>`
    for child in sorted(models_root.iterdir()):
        if not child.is_dir():
            continue
        lower = child.name.lower()
        if f"-{base}_" in lower or f"-{base}-" in lower or lower.startswith(f"{base}_"):
            candidates.append((child, "vits"))

    # 4. Kokoro-82M Multi-Lang (hỗ trợ en/fr/zh/ja/es/it/pt/hi trong 1 model duy nhất)
    kokoro_langs = OFFLINE_ONNX_CATALOG["kokoro"]["languages"]
    if base in kokoro_langs:
        kokoro_dir = models_root / str(OFFLINE_ONNX_CATALOG["kokoro"]["name"])
        if kokoro_dir.is_dir():
            candidates.append((kokoro_dir, "kokoro"))
        alt_kokoro = models_root / "kokoro"
        if alt_kokoro.is_dir():
            candidates.append((alt_kokoro, "kokoro"))

    for model_dir, kind in candidates:
        onnx_files = list(model_dir.glob("*.onnx"))
        if not onnx_files:
            continue
        onnx_json = Path(f"{onnx_files[0]}.json")
        tokens_file = model_dir / "tokens.txt"
        if kind == "kokoro":
            if tokens_file.is_file() and (model_dir / "voices.bin").is_file():
                return model_dir, "kokoro"
            continue
        if onnx_json.is_file() or tokens_file.is_file():
            return model_dir, kind
    return None


def list_installed_offline_models() -> dict[str, dict[str, str]]:
    """Report all installed local open-source ONNX models available offline."""
    installed: dict[str, dict[str, str]] = {}
    models_root = settings.tts_models_dir_path
    if not models_root.is_dir():
        return installed

    for child in sorted(models_root.iterdir()):
        if not child.is_dir():
            continue
        onnx_files = list(child.glob("*.onnx"))
        if not onnx_files:
            continue
        onnx_json = Path(f"{onnx_files[0]}.json")
        if onnx_json.is_file() or (child / "tokens.txt").is_file():
            kind = "kokoro" if (child / "voices.bin").is_file() else ("piper" if onnx_json.is_file() else "vits")
            installed[child.name] = {
                "path": child.name,
                "model_file": onnx_files[0].name,
                "kind": kind,
            }
    return installed


def _samples_to_wav_bytes(samples: Any, sample_rate: int) -> bytes:
    """Encode float32 PCM samples [-1.0, 1.0] into 16-bit mono WAV bytes completely in RAM."""
    pcm16 = array.array("h")
    for s in samples:
        val = float(s)
        if val > 1.0:
            val = 1.0
        elif val < -1.0:
            val = -1.0
        pcm16.append(int(val * 32767.0))

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(int(sample_rate))
        wf.writeframes(pcm16.tobytes())
    return buf.getvalue()


def _get_or_create_offline_tts(model_dir: Path, kind: str) -> Any:
    cache_id = f"{kind}:{model_dir.resolve()}"
    if cache_id in _offline_tts_instances:
        return _offline_tts_instances[cache_id]

    import sherpa_onnx

    onnx_file = sorted(model_dir.glob("*.onnx"))[0]
    tokens_file = model_dir / "tokens.txt"
    data_dir = model_dir / "espeak-ng-data"
    dict_dir = model_dir / "dict"
    lexicon_files = sorted(model_dir.glob("lexicon*.txt"))
    lexicon_arg = ",".join(str(p) for p in lexicon_files) if lexicon_files else ""

    if kind == "kokoro":
        voices_file = model_dir / "voices.bin"
        kokoro_cfg = sherpa_onnx.OfflineTtsKokoroModelConfig(
            model=str(onnx_file),
            voices=str(voices_file),
            tokens=str(tokens_file),
            lexicon=lexicon_arg,
            data_dir=str(data_dir) if data_dir.is_dir() else "",
            dict_dir=str(dict_dir) if dict_dir.is_dir() else "",
        )
        model_cfg = sherpa_onnx.OfflineTtsModelConfig(
            kokoro=kokoro_cfg,
            num_threads=2,
            provider="cpu",
        )
    else:
        vits_cfg = sherpa_onnx.OfflineTtsVitsModelConfig(
            model=str(onnx_file),
            lexicon=lexicon_arg,
            tokens=str(tokens_file),
            data_dir=str(data_dir) if data_dir.is_dir() else "",
            dict_dir=str(dict_dir) if dict_dir.is_dir() else "",
        )
        model_cfg = sherpa_onnx.OfflineTtsModelConfig(
            vits=vits_cfg,
            num_threads=2,
            provider="cpu",
        )

    tts_cfg = sherpa_onnx.OfflineTtsConfig(model=model_cfg)
    instance = sherpa_onnx.OfflineTts(tts_cfg)
    _offline_tts_instances[cache_id] = instance
    return instance


def _get_or_create_piper_voice(onnx_file: Path) -> Any:
    cache_id = f"piper:{onnx_file.resolve()}"
    if cache_id in _offline_tts_instances:
        return _offline_tts_instances[cache_id]
    from piper.voice import PiperVoice

    voice = PiperVoice.load(str(onnx_file))
    _offline_tts_instances[cache_id] = voice
    return voice


def _synthesize_offline_sync(
    normalized_text: str,
    language: str,
    gender: VoiceGender,
) -> tuple[bytes, str]:
    found = _find_offline_model_dir(language)
    if (
        not found
        and settings.TTS_AUTO_DOWNLOAD_OFFLINE
        and not os.environ.get("PYTEST_CURRENT_TEST")
        and settings.APP_ENV.lower() != "test"
        and _resolve_catalog_key_for_language(language) is not None
    ):
        # Tự động tải model offline theo yêu cầu ngay trong Backend khi deploy lên Cloud
        ensure_offline_model_installed_sync(language)
        found = _find_offline_model_dir(language)

    if not found:
        base = _base_lang(language)
        raise RuntimeError(
            f"Chưa có model offline ONNX cho ngôn ngữ '{base}'."
        )
    model_dir, kind = found
    onnx_file = sorted(model_dir.glob("*.onnx"))[0]
    onnx_json = Path(f"{onnx_file}.json")

    # Ưu tiên PiperVoice trực tiếp trong RAM nếu là model Piper (có .onnx.json & cài piper-tts)
    if kind != "kokoro" and onnx_json.is_file() and is_piper_tts_available():
        piper_voice = _get_or_create_piper_voice(onnx_file)
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            piper_voice.synthesize_wav(normalized_text, wf)
        wav_bytes = buf.getvalue()
        if len(wav_bytes) < 256:
            raise RuntimeError("Model offline Piper ONNX không sinh được dữ liệu WAV.")
        return wav_bytes, model_dir.name

    tts = _get_or_create_offline_tts(model_dir, kind)

    sid = 0
    if kind == "kokoro":
        base = _base_lang(language)
        sid = _KOKORO_SPEAKER_IDS.get(base, _KOKORO_SPEAKER_IDS["en"]).get(gender, 0)

    audio = tts.generate(normalized_text, sid=sid, speed=1.0)
    samples = getattr(audio, "samples", None)
    sample_rate = int(getattr(audio, "sample_rate", 22050))
    if samples is None or len(samples) == 0:
        raise RuntimeError("Model offline ONNX không sinh được mẫu âm thanh.")

    wav_bytes = _samples_to_wav_bytes(samples, sample_rate)
    if len(wav_bytes) < 256:
        raise RuntimeError("Dữ liệu WAV offline quá ngắn.")
    return wav_bytes, f"{model_dir.name} (sid={sid})"


# ---------------------------------------------------------------------------
# Engine 1: Universal 140+ Languages RAM Stream (edge-tts, 0 disk files)
# ---------------------------------------------------------------------------
async def _synthesize_edge_neural_ram(
    normalized_text: str,
    language: str,
    gender: VoiceGender,
) -> tuple[bytes, str]:
    try:
        import edge_tts
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("Thư viện edge-tts chưa được cài đặt trên máy chủ.") from exc

    voice_cfg = await resolve_dynamic_neural_voice(language, gender)
    voice_id = voice_cfg["id"]

    async def _stream_once() -> bytes:
        communicator = edge_tts.Communicate(
            text=normalized_text,
            voice=voice_id,
        )
        chunks: list[bytes] = []
        async for chunk in communicator.stream():
            if chunk.get("type") == "audio" and chunk.get("data"):
                chunks.append(chunk["data"])
        return b"".join(chunks)

    audio_bytes = b""
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            audio_bytes = await asyncio.wait_for(
                _stream_once(),
                timeout=EDGE_TTS_ATTEMPT_TIMEOUT_SECONDS,
            )
            if len(audio_bytes) >= 256:
                break
        except Exception as exc:
            last_error = exc
            if attempt == 0:
                await asyncio.sleep(0.15)

    if len(audio_bytes) < 256:
        detail = f" ({type(last_error).__name__}: {last_error})" if last_error else ""
        raise RuntimeError(f"Không thể stream giọng AI Neural cho '{language}'.{detail}") from last_error

    return audio_bytes, voice_id


# ---------------------------------------------------------------------------
# Unified Public API (Zero Disk Files, Dual-Engine Auto Fallback)
# ---------------------------------------------------------------------------
async def synthesize_speech_stream(
    *,
    text: str,
    language: str = "vi",
    gender: VoiceGender = "female",
    provider: TtsProviderMode | None = None,
) -> TtsSynthesisResult:
    """Synthesize speech completely in RAM (0 disk files) across 140+ languages + offline ONNX."""
    normalized = normalize_text_for_speech(text, language)
    if not normalized:
        raise ValueError("Nội dung thuyết minh không được để trống.")

    effective_provider: TtsProviderMode = provider or (
        settings.TTS_DEFAULT_PROVIDER
        if settings.TTS_DEFAULT_PROVIDER in ("auto", "neural", "offline")
        else "auto"
    )
    norm_lang = _normalize_lang_code(language)
    cache_key = hashlib.sha256(
        f"ram-v1|{effective_provider}|{norm_lang}|{gender}|{normalized}".encode("utf-8")
    ).hexdigest()[:28]

    cached = _cache_get(cache_key)
    if cached is not None:
        audio_bytes, media_type, voice_id, used_provider = cached
        return TtsSynthesisResult(
            audio_bytes=audio_bytes,
            media_type=media_type,
            voice_id=voice_id,
            provider=used_provider,
            cache_hit=True,
        )

    lock = _get_lock(cache_key)
    async with lock:
        cached = _cache_get(cache_key)
        if cached is not None:
            audio_bytes, media_type, voice_id, used_provider = cached
            return TtsSynthesisResult(
                audio_bytes=audio_bytes,
                media_type=media_type,
                voice_id=voice_id,
                provider=used_provider,
                cache_hit=True,
            )

        if effective_provider == "offline":
            wav_bytes, voice_id = await asyncio.to_thread(
                _synthesize_offline_sync, normalized, norm_lang, gender
            )
            _cache_put(cache_key, wav_bytes, "audio/wav", voice_id, "sherpa-onnx")
            return TtsSynthesisResult(
                audio_bytes=wav_bytes,
                media_type="audio/wav",
                voice_id=voice_id,
                provider="sherpa-onnx",
                cache_hit=False,
            )

        # `neural` hoặc `auto`: thử Engine 1 (140+ ngôn ngữ RAM stream) trước
        neural_err: Exception | None = None
        try:
            mp3_bytes, voice_id = await _synthesize_edge_neural_ram(
                normalized, norm_lang, gender
            )
            _cache_put(cache_key, mp3_bytes, "audio/mpeg", voice_id, "edge-neural")
            return TtsSynthesisResult(
                audio_bytes=mp3_bytes,
                media_type="audio/mpeg",
                voice_id=voice_id,
                provider="edge-neural",
                cache_hit=False,
            )
        except Exception as exc:
            neural_err = exc
            if effective_provider == "neural":
                raise RuntimeError(str(exc)) from exc

        # Chế độ `auto`: chỉ fallback sang Engine 2 nếu model ONNX ĐÃ cài sẵn trên đĩa (không chặn request tải 63MB!)
        if is_offline_onnx_available() and _find_offline_model_dir(norm_lang) is not None:
            wav_bytes, voice_id = await asyncio.to_thread(
                _synthesize_offline_sync, normalized, norm_lang, gender
            )
            _cache_put(cache_key, wav_bytes, "audio/wav", voice_id, "sherpa-onnx")
            return TtsSynthesisResult(
                audio_bytes=wav_bytes,
                media_type="audio/wav",
                voice_id=voice_id,
                provider="sherpa-onnx",
                cache_hit=False,
            )

        # Nếu thiếu model offline & bật auto-download: tải ngầm trong background thread cho các lần sau
        if (
            is_offline_onnx_available()
            and settings.TTS_AUTO_DOWNLOAD_OFFLINE
            and not os.environ.get("PYTEST_CURRENT_TEST")
            and settings.APP_ENV.lower() != "test"
            and _resolve_catalog_key_for_language(norm_lang) is not None
        ):
            threading.Thread(
                target=ensure_offline_model_installed_sync,
                args=(norm_lang,),
                daemon=True,
            ).start()

        raise RuntimeError(
            f"Cả hai engine TTS đều chưa sẵn sàng cho '{norm_lang}': {neural_err}"
        ) from neural_err


async def get_tts_voices_catalog(*, include_all_languages: bool = False) -> dict[str, Any]:
    """Return curated voices (default) or full 140+ dynamic languages + offline ONNX catalog."""
    if not include_all_languages:
        return NEURAL_VOICES

    all_edge = await _load_all_edge_voices()
    grouped: dict[str, list[dict[str, str]]] = {}
    for v in all_edge:
        locale = str(v.get("Locale", ""))
        short_name = str(v.get("ShortName", ""))
        if not locale or not short_name:
            continue
        grouped.setdefault(locale, []).append(
            {
                "id": short_name,
                "gender": str(v.get("Gender", "")).lower(),
                "label": str(v.get("FriendlyName") or short_name),
            }
        )

    return {
        "curated_voices": NEURAL_VOICES,
        "all_neural_locales_count": len(grouped),
        "all_neural_voices": grouped,
        "offline_engine": {
            "provider": "piper+sherpa-onnx",
            "available": is_offline_onnx_available(),
            "piper_available": is_piper_tts_available(),
            "sherpa_onnx_available": is_sherpa_onnx_available(),
            "models_dir": str(settings.TTS_MODELS_DIR),
            "installed_models": list_installed_offline_models(),
            "downloadable_catalog": OFFLINE_ONNX_CATALOG,
        },
        "storage_mode": "ram_stream_only (0 disk files)",
    }


async def synthesize_speech_mp3(
    *,
    text: str,
    language: str = "vi",
    gender: VoiceGender = "female",
) -> tuple[bytes, str, bool]:
    """Backward-compatible helper returning `(audio_bytes, voice_id, cache_hit)` from RAM."""
    res = await synthesize_speech_stream(
        text=text,
        language=language,
        gender=gender,
        provider="auto",
    )
    return res.audio_bytes, res.voice_id, res.cache_hit
