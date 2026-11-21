"""Unit & async DB tests for Pillar 3A: Vision AI Landmark Recognition & GPS Fallback."""

from __future__ import annotations

import base64
from dataclasses import dataclass

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base
from app.schemas.dto import VisionIdentifyRequest, VisionIdentifyResponse
from app.services import vision_service
from app.services.vision_service import (
    identify_site_from_request,
    select_vision_candidates,
)

# Valid tiny 1x1 JPEG-like base64 payload for testing
SAMPLE_IMAGE_B64 = base64.b64encode(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xd9").decode(
    "ascii"
)


@dataclass
class MockGeoSite:
    id: str
    lat: float
    lng: float


def test_select_vision_candidates_prefilters_top_8_with_gps_and_20_without():
    sites = [MockGeoSite(id=f"site-{i}", lat=10.77 + i * 0.002, lng=106.69 + i * 0.002) for i in range(25)]

    with_gps = select_vision_candidates(sites, lat=10.7701, lng=106.6901)
    assert len(with_gps) == 8
    assert with_gps[0][0].id == "site-0"
    assert with_gps[0][1] is not None and with_gps[0][1] < with_gps[1][1]

    without_gps = select_vision_candidates(sites, lat=None, lng=None)
    assert len(without_gps) == 20
    assert all(dist is None for _, dist in without_gps)


async def test_vision_gps_fallback_near_site_auto_opens_audio(monkeypatch: pytest.MonkeyPatch):
    from scripts.seed_supabase import seed_database

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        await seed_database(session=db, generate_embeddings=False, seed_demo_users=False)

        # Standing right next to Independence Palace (10.7769, 106.6953)
        resp = await identify_site_from_request(
            db,
            VisionIdentifyRequest(
                image_base64=SAMPLE_IMAGE_B64,
                mime_type="image/jpeg",
                lat=10.7769,
                lng=106.6953,
                language="vi",
            ),
        )
        assert resp.mode == "gps_fallback"
        assert resp.candidate_count == 8
        assert resp.matched_site_id == "dinh-doc-lap"
        assert resp.confidence >= 0.70
        assert resp.auto_open_audio is True
        assert len(resp.architectural_cues) >= 1

        # Without GPS and without GEMINI_API_KEY -> graceful unmatched gps_fallback
        no_gps_resp = await identify_site_from_request(
            db,
            VisionIdentifyRequest(
                image_base64=SAMPLE_IMAGE_B64,
                mime_type="image/jpeg",
                lat=None,
                lng=None,
                language="en",
            ),
        )
        assert no_gps_resp.mode == "gps_fallback"
        assert no_gps_resp.candidate_count == 20
        assert no_gps_resp.matched_site_id is None
        assert no_gps_resp.auto_open_audio is False

    await engine.dispose()


async def test_vision_invalid_base64_raises_value_error():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        with pytest.raises(ValueError):
            await identify_site_from_request(
                db,
                VisionIdentifyRequest(
                    image_base64="!!!not-valid-base64-payload!!!",
                    mime_type="image/jpeg",
                    language="vi",
                ),
            )

    await engine.dispose()


async def test_vision_gemini_mode_mocked_and_fallback_on_error(monkeypatch: pytest.MonkeyPatch):
    from scripts.seed_supabase import seed_database

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-mock-key")

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        await seed_database(session=db, generate_embeddings=False, seed_demo_users=False)

        async def _fake_gemini_ok(**kwargs) -> VisionIdentifyResponse:
            return VisionIdentifyResponse(
                matched_site_id="nha-tho-duc-ba-sai-gon",
                matched_site_name="Nhà thờ Đức Bà Sài Gòn",
                confidence=0.93,
                architectural_cues=["Hai tháp chuông cao", "Gạch đỏ Marseille"],
                auto_open_audio=True,
                candidate_count=len(kwargs["candidates"]),
                mode="gemini_vision",
                message="Nhận diện Nhà thờ Đức Bà Sài Gòn (93%)",
            )

        monkeypatch.setattr(vision_service, "_call_gemini_vision", _fake_gemini_ok)

        resp = await identify_site_from_request(
            db,
            VisionIdentifyRequest(
                image_base64=SAMPLE_IMAGE_B64,
                mime_type="image/jpeg",
                lat=10.7798,
                lng=106.6990,
                language="vi",
            ),
        )
        assert resp.mode == "gemini_vision"
        assert resp.matched_site_id == "nha-tho-duc-ba-sai-gon"
        assert resp.auto_open_audio is True
        assert resp.candidate_count == 8

        # If Gemini fails (returns None), cleanly falls back to GPS fallback
        async def _fake_gemini_fail(**kwargs):
            return None

        monkeypatch.setattr(vision_service, "_call_gemini_vision", _fake_gemini_fail)
        fb = await identify_site_from_request(
            db,
            VisionIdentifyRequest(
                image_base64=SAMPLE_IMAGE_B64,
                mime_type="image/jpeg",
                lat=10.7798,
                lng=106.6990,
                language="vi",
            ),
        )
        assert fb.mode == "gps_fallback"
        assert fb.matched_site_id == "nha-tho-duc-ba-sai-gon"

    await engine.dispose()


async def test_ai_router_all_four_endpoints_http(monkeypatch: pytest.MonkeyPatch):
    """Smoke-test all 4 HTTP endpoints exposed by `app.routers.ai.router`."""
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.core.database import get_db
    from app.routers.ai import router as ai_router
    from scripts.seed_supabase import seed_database

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as seed_db:
        await seed_database(session=seed_db, generate_embeddings=False, seed_demo_users=False)

    async def _override_get_db():
        async with session_factory() as session:
            yield session

    test_app = FastAPI()
    test_app.include_router(ai_router, prefix="/api/v1")
    test_app.dependency_overrides[get_db] = _override_get_db

    with TestClient(test_app) as client:
        r1 = client.post(
            "/api/v1/ai/recommendations",
            json={"lat": 10.7769, "lng": 106.6953, "language": "vi", "max_results": 4},
        )
        assert r1.status_code == 200
        assert len(r1.json()["items"]) == 4

        r2 = client.post(
            "/api/v1/ai/tour-plan",
            json={
                "lat": 10.7769,
                "lng": 106.6953,
                "available_minutes": 120,
                "start_hour": 11,
                "include_meal_stop": True,
                "language": "vi",
            },
        )
        assert r2.status_code == 200
        assert r2.json()["total_duration_minutes"] <= 120

        r3 = client.post(
            "/api/v1/ai/chat",
            json={"question": "Dinh Độc Lập mở cửa mấy giờ?", "language": "vi", "site_id": "dinh-doc-lap"},
        )
        assert r3.status_code == 200
        assert r3.json()["mode"] == "fallback"
        assert len(r3.json()["suggested_questions"]) == 3

        r4 = client.post(
            "/api/v1/ai/vision/identify",
            json={"image_base64": SAMPLE_IMAGE_B64, "lat": 10.7769, "lng": 106.6953, "language": "vi"},
        )
        assert r4.status_code == 200
        assert r4.json()["matched_site_id"] == "dinh-doc-lap"
        assert r4.json()["mode"] == "gps_fallback"

        r4_bad = client.post(
            "/api/v1/ai/vision/identify",
            json={"image_base64": "!!!bad-base64-string!!!", "language": "vi"},
        )
        assert r4_bad.status_code == 400

    await engine.dispose()
