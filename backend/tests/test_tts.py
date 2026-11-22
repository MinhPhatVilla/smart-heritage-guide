"""Unit & endpoint tests for Neural TTS service and `/api/v1/ai/tts`."""

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


def test_tts_endpoints_and_disk_cache(monkeypatch, tmp_path: Path) -> None:
    calls: list[dict[str, str]] = []

    class FakeCommunicate:
        def __init__(self, text: str, voice: str, rate: str = "+0%", pitch: str = "+0Hz") -> None:
            calls.append({"text": text, "voice": voice, "rate": rate, "pitch": pitch})

        async def stream(self):
            yield {"type": "audio", "data": b"ID3" + (b"\xaa" * 512)}

    fake_module = types.SimpleNamespace(Communicate=FakeCommunicate)
    monkeypatch.setitem(sys.modules, "edge_tts", fake_module)
    monkeypatch.setattr(tts_service, "get_tts_cache_dir", lambda: tmp_path)

    client = TestClient(app)

    # Voices catalog endpoint
    voices_res = client.get("/api/v1/ai/tts/voices")
    assert voices_res.status_code == 200
    assert voices_res.json()["vi"]["female"]["id"] == "vi-VN-HoaiMyNeural"

    # First POST -> cache miss
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
    assert len(r1.content) > 256
    assert len(calls) == 1
    assert "Thành phố Hồ Chí Minh" in calls[0]["text"]

    # Second identical GET -> cache hit (no extra synthesis call)
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
