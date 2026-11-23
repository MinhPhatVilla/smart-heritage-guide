"""Natural Neural Text-to-Speech (TTS) service with persistent MP3 caching.

Uses Microsoft Azure Neural voices via `edge-tts` (free, zero API key required)
with curated warm storytelling voices across all 5 supported languages
(`vi`, `en`, `fr`, `zh`, `ja`) in both Female and Male personas, plus natural
Vietnamese/multilingual speech text preprocessing so abbreviations, years, and
punctuation sound effortless and human-like.
"""

from __future__ import annotations

import asyncio
import hashlib
import re
from pathlib import Path
from typing import Literal

from app.core.config import settings
from app.schemas.dto import SupportedLanguage

VoiceGender = Literal["female", "male"]

MAX_TTS_TEXT_LENGTH = 1800

NEURAL_VOICES: dict[str, dict[str, dict[str, str]]] = {
    "vi": {
        "female": {
            "id": "vi-VN-HoaiMyNeural",
            "label": "Hoài My (Nữ · Truyền cảm)",
            "rate": "+0%",
            "pitch": "+0Hz",
        },
        "male": {
            "id": "vi-VN-NamMinhNeural",
            "label": "Nam Minh (Nam · Trầm ấm)",
            "rate": "+0%",
            "pitch": "+0Hz",
        },
    },
    "en": {
        "female": {
            "id": "en-US-AriaNeural",
            "label": "Aria (Female · Expressive)",
            "rate": "+0%",
            "pitch": "+0Hz",
        },
        "male": {
            "id": "en-US-GuyNeural",
            "label": "Guy (Male · Warm)",
            "rate": "+0%",
            "pitch": "+0Hz",
        },
    },
    "fr": {
        "female": {
            "id": "fr-FR-DeniseNeural",
            "label": "Denise (Femme · Naturelle)",
            "rate": "+0%",
            "pitch": "+0Hz",
        },
        "male": {
            "id": "fr-FR-HenriNeural",
            "label": "Henri (Homme · Posé)",
            "rate": "+0%",
            "pitch": "+0Hz",
        },
    },
    "zh": {
        "female": {
            "id": "zh-CN-XiaoxiaoNeural",
            "label": "晓晓 (女声 · 自然)",
            "rate": "+0%",
            "pitch": "+0Hz",
        },
        "male": {
            "id": "zh-CN-YunxiNeural",
            "label": "云希 (男声 · 沉稳)",
            "rate": "+0%",
            "pitch": "+0Hz",
        },
    },
    "ja": {
        "female": {
            "id": "ja-JP-NanamiNeural",
            "label": "七海 (女性 · 丁寧)",
            "rate": "+0%",
            "pitch": "+0Hz",
        },
        "male": {
            "id": "ja-JP-KeitaNeural",
            "label": "圭太 (男性 · 落ち着き)",
            "rate": "+0%",
            "pitch": "+0Hz",
        },
    },
}

_synthesis_locks: dict[str, asyncio.Lock] = {}


def _get_lock(key: str) -> asyncio.Lock:
    lock = _synthesis_locks.get(key)
    if lock is None:
        lock = asyncio.Lock()
        _synthesis_locks[key] = lock
    return lock


def get_tts_cache_dir() -> Path:
    cache_dir = settings.upload_dir_path / "tts_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir


def resolve_neural_voice(
    language: SupportedLanguage,
    gender: VoiceGender = "female",
) -> dict[str, str]:
    lang_map = NEURAL_VOICES.get(language, NEURAL_VOICES["vi"])
    return lang_map.get(gender, lang_map["female"])


def normalize_text_for_speech(text: str, language: SupportedLanguage = "vi") -> str:
    """Preprocess heritage script text so TTS speaks naturally with clear pauses."""
    cleaned = (text or "").strip()
    if not cleaned:
        return ""

    # Strip markdown emphasis/links
    cleaned = re.sub(r"[*_`#]+", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)

    if language == "vi":
        replacements = [
            (r"\bTP\.?\s*HCM\b", "Thành phố Hồ Chí Minh"),
            (r"\bTP\.?\s*Thủ Đức\b", "Thành phố Thủ Đức"),
            (r"\bUBND\b", "Ủy ban nhân dân"),
            (r"\bKTS\.?\s*", "Kiến trúc sư "),
            (r"\bHSSV\b", "học sinh, sinh viên"),
            (r"\bQ\.\s*(\d+)\b", r"Quận \1"),
            (r"\bP\.\s*(\d+)\b", r"Phường \1"),
            (r"(\d+)\s*ha\b", r"\1 héc ta"),
            (r"(\d+)\s*km\b", r"\1 ki lô mét"),
            (r"(\d+)\s*m\b", r"\1 mét"),
            (r"(\d[\d\.]*)\s*đ\b", r"\1 đồng"),
            # Year & time ranges: "1880 – 1891" -> "1880 đến 1891"
            (r"(\d{3,4})\s*[–—-]\s*(\d{3,4})", r"\1 đến \2"),
            (r"(\d{1,2}):00\s*[–—-]\s*(\d{1,2}):00", r"\1 giờ đến \2 giờ"),
            (r"(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})", r"\1 giờ \2 đến \3 giờ \4"),
        ]
        for pattern, repl in replacements:
            cleaned = re.sub(pattern, repl, cleaned, flags=re.IGNORECASE)
    elif language == "en":
        cleaned = re.sub(r"(\d{3,4})\s*[–—-]\s*(\d{3,4})", r"\1 to \2", cleaned)

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


async def synthesize_speech_mp3(
    *,
    text: str,
    language: SupportedLanguage = "vi",
    gender: VoiceGender = "female",
) -> tuple[bytes, str, bool]:
    """Return `(mp3_bytes, voice_id, cache_hit)` using cached Microsoft Neural TTS."""
    normalized = normalize_text_for_speech(text, language)
    if not normalized:
        raise ValueError("Nội dung thuyết minh không được để trống.")

    voice_cfg = resolve_neural_voice(language, gender)
    voice_id = voice_cfg["id"]
    rate = voice_cfg["rate"]
    pitch = voice_cfg["pitch"]

    cache_key = hashlib.sha256(
        f"v2|{voice_id}|{rate}|{pitch}|{normalized}".encode("utf-8")
    ).hexdigest()[:28]
    cache_path = get_tts_cache_dir() / f"{cache_key}.mp3"

    if cache_path.is_file() and cache_path.stat().st_size > 256:
        return cache_path.read_bytes(), voice_id, True

    lock = _get_lock(cache_key)
    async with lock:
        if cache_path.is_file() and cache_path.stat().st_size > 256:
            return cache_path.read_bytes(), voice_id, True

        try:
            import edge_tts
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError("Thư viện edge-tts chưa được cài đặt trên máy chủ.") from exc

        async def _stream_once(target_text: str) -> bytes:
            # Dùng tham số mặc định của Microsoft Neural TTS (tránh lỗi NoAudioReceived khi gửi custom rate/pitch SSML)
            communicator = edge_tts.Communicate(
                text=target_text,
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
                audio_bytes = await _stream_once(normalized)
                if len(audio_bytes) >= 256:
                    break
            except Exception as exc:
                last_error = exc
                if attempt == 0:
                    await asyncio.sleep(0.25)

        if len(audio_bytes) < 256:
            detail = f" ({type(last_error).__name__}: {last_error})" if last_error else ""
            raise RuntimeError(
                f"Không thể tạo âm thanh Neural TTS cho đoạn văn bản này.{detail}"
            ) from last_error

        tmp_path = cache_path.with_suffix(".tmp")
        tmp_path.write_bytes(audio_bytes)
        tmp_path.replace(cache_path)
        return audio_bytes, voice_id, False
