"""Unit & endpoint tests for Dual-Engine Zero-Disk Streaming TTS (`/api/v1/ai/tts`)."""

from __future__ import annotations

import sys
import types
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.services import tts_service


def test_normalize_text_for_vietnamese_speech() -> None:
    raw = "Chào mừng tới TP.HCM – Q.1! Công trình do KTS. Ngô Viết Thụ xây 1880 – 1891, mở cửa 07:00 – 17:00, vé 40.000đ."
    out = tts_service.normalize_text_for_speech(raw, "vi")
    assert "Thành phố Hồ Chí Minh" in out
    assert "Quận 1" in out
    assert "Kiến trúc sư" in out
    assert "1880 đến 1891" in out
    assert "7 giờ đến 17 giờ" in out or "07 giờ đến 17 giờ" in out
    assert "40.000 đồng" in out
    assert "–" not in out


def test_resolve_neural_voice_all_languages() -> None:
    for lang in ("vi", "en", "fr", "zh", "ja"):
        female = tts_service.resolve_neural_voice(lang, "female")
        male = tts_service.resolve_neural_voice(lang, "male")
        assert female["id"].endswith("Neural")
        assert male["id"].endswith("Neural")
        assert female["id"] != male["id"]


def test_tts_ram_streaming_and_universal_languages(monkeypatch, tmp_path: Path) -> None:
    tts_service.clear_ram_cache()
    monkeypatch.setattr(tts_service, "_dynamic_voices_cache", None)
    calls: list[dict[str, str]] = []

    class FakeCommunicate:
        def __init__(self, text: str, voice: str) -> None:
            calls.append({"text": text, "voice": voice})

        async def stream(self):
            yield {"type": "audio", "data": b"ID3" + (b"\xaa" * 512)}

    async def fake_list_voices():
        return [
            {"ShortName": "ko-KR-SunHiNeural", "Locale": "ko-KR", "Gender": "Female", "FriendlyName": "SunHi (Korean)"},
            {"ShortName": "ko-KR-InJoonNeural", "Locale": "ko-KR", "Gender": "Male", "FriendlyName": "InJoon (Korean)"},
            {"ShortName": "th-TH-PremwadeeNeural", "Locale": "th-TH", "Gender": "Female", "FriendlyName": "Premwadee (Thai)"},
        ]

    fake_module = types.SimpleNamespace(Communicate=FakeCommunicate, list_voices=fake_list_voices)
    monkeypatch.setitem(sys.modules, "edge_tts", fake_module)

    client = TestClient(app)

    # Curated voices catalog (backward compatible)
    voices_res = client.get("/api/v1/ai/tts/voices")
    assert voices_res.status_code == 200
    assert voices_res.json()["vi"]["female"]["id"] == "vi-VN-HoaiMyNeural"

    # Full 140+ languages + offline engine catalog
    all_voices_res = client.get("/api/v1/ai/tts/voices", params={"all_languages": "true"})
    assert all_voices_res.status_code == 200
    body = all_voices_res.json()
    assert body["all_neural_locales_count"] == 2
    assert "offline_engine" in body
    assert body["storage_mode"].startswith("ram_stream_only")

    # First POST (Vietnamese) -> RAM stream miss, 0 disk files created
    r1 = client.post(
        "/api/v1/ai/tts",
        json={
            "text": "Chào mừng đến Dinh Độc Lập TP.HCM.",
            "language": "vi",
            "voice_gender": "female",
        },
    )
    assert r1.status_code == 200
    assert r1.headers["content-type"].startswith("audio/mpeg")
    assert r1.headers["x-tts-provider"] == "edge-neural"
    assert r1.headers["x-tts-voice"] == "vi-VN-HoaiMyNeural"
    assert r1.headers["x-tts-cache"] == "miss"
    assert r1.headers["x-tts-disk-files"] == "0"
    assert len(r1.content) > 256
    assert len(calls) == 1
    assert "Thành phố Hồ Chí Minh" in calls[0]["text"]
    assert list(tmp_path.glob("*")) == []

    # Second identical GET -> RAM LRU cache hit (no extra synthesis call)
    r2 = client.get(
        "/api/v1/ai/tts",
        params={
            "text": "Chào mừng đến Dinh Độc Lập TP.HCM.",
            "language": "vi",
            "voice_gender": "female",
        },
    )
    assert r2.status_code == 200
    assert r2.headers["x-tts-cache"] == "hit"
    assert r2.content == r1.content
    assert len(calls) == 1

    # Universal dynamic language test (Korean `ko` — outside the 5 core languages!)
    r_ko = client.post(
        "/api/v1/ai/tts",
        json={
            "text": "호치민시 통일궁에 오신 것을 환영합니다.",
            "language": "ko",
            "voice_gender": "male",
        },
    )
    assert r_ko.status_code == 200
    assert r_ko.headers["x-tts-voice"] == "ko-KR-InJoonNeural"
    assert len(calls) == 2


def test_tts_offline_sherpa_onnx_and_auto_fallback(monkeypatch, tmp_path: Path) -> None:
    tts_service.clear_ram_cache()

    # Fake installed offline ONNX model folder
    vi_model_dir = tmp_path / "vits-piper-vi_VN-vais1000-medium"
    vi_model_dir.mkdir(parents=True)
    (vi_model_dir / "vi_VN-vais1000-medium.onnx").write_bytes(b"fake-onnx")
    (vi_model_dir / "tokens.txt").write_text("a 1\n", encoding="utf-8")

    monkeypatch.setattr(tts_service.settings, "TTS_MODELS_DIR", str(tmp_path))
    monkeypatch.setattr(tts_service, "is_sherpa_onnx_available", lambda: True)

    class FakeOfflineTts:
        def generate(self, text: str, sid: int = 0, speed: float = 1.0):
            return types.SimpleNamespace(samples=[0.0, 0.25, -0.25, 0.5] * 64, sample_rate=22050)

    monkeypatch.setattr(tts_service, "_get_or_create_offline_tts", lambda d, k: FakeOfflineTts())

    # Simulate edge-tts failing (offline/no internet)
    class FailingCommunicate:
        def __init__(self, text: str, voice: str) -> None:
            pass

        async def stream(self):
            raise RuntimeError("No internet connection")
            yield {}  # pragma: no cover

    monkeypatch.setitem(
        sys.modules,
        "edge_tts",
        types.SimpleNamespace(Communicate=FailingCommunicate),
    )

    client = TestClient(app)

    # 1. Explicit provider="offline" -> sherpa-onnx WAV in RAM
    r_off = client.post(
        "/api/v1/ai/tts",
        json={
            "text": "Xin chào từ bộ đọc offline ONNX.",
            "language": "vi",
            "provider": "offline",
        },
    )
    assert r_off.status_code == 200
    assert r_off.headers["content-type"].startswith("audio/wav")
    assert r_off.headers["x-tts-provider"] == "sherpa-onnx"
    assert r_off.headers["x-tts-disk-files"] == "0"
    assert r_off.content[:4] == b"RIFF"
    assert r_off.content[8:12] == b"WAVE"

    # 2. provider="auto" when internet is down -> seamlessly falls back to sherpa-onnx WAV!
    r_auto = client.post(
        "/api/v1/ai/tts",
        json={
            "text": "Tự động chuyển sang giọng offline khi mất mạng.",
            "language": "vi",
            "provider": "auto",
        },
    )
    assert r_auto.status_code == 200
    assert r_auto.headers["content-type"].startswith("audio/wav")
    assert r_auto.headers["x-tts-provider"] == "sherpa-onnx"
    assert r_auto.content[:4] == b"RIFF"
