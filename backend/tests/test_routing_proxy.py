"""Unit & integration tests for Walking Route Proxy + Cache Service."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base
from app.models.entities import RouteCache
from app.schemas.dto import WalkingRouteRequest
from app.services.routing_service import (
    build_fallback_route,
    build_route_cache_key,
    decode_polyline,
    get_walking_route,
)


@pytest.fixture
async def async_db() -> AsyncSession:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    await engine.dispose()


def test_decode_polyline_standard_google_sample() -> None:
    """Google's canonical polyline encoding example decodes accurately."""
    coords = decode_polyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")
    assert len(coords) == 3
    assert pytest.approx(coords[0][0], abs=1e-4) == 38.5
    assert pytest.approx(coords[0][1], abs=1e-4) == -120.2
    assert pytest.approx(coords[1][0], abs=1e-4) == 40.7
    assert pytest.approx(coords[1][1], abs=1e-4) == -120.95


def test_grid_cache_key_snaps_nearby_gps() -> None:
    """Two GPS readings within ~3m snap to the same rounded grid cache key."""
    key1 = build_route_cache_key(10.77691, 106.69531, 10.77978, 106.69901)
    key2 = build_route_cache_key(10.77694, 106.69534, 10.77982, 106.69899)
    assert key1 == key2


def test_build_fallback_route_returns_valid_geometry_and_steps() -> None:
    route = build_fallback_route(10.7769, 106.6953, 10.7798, 106.6990, "Nhà Thờ Đức Bà")
    assert route["provider"] == "fallback"
    assert len(route["coordinates"]) == 9
    assert route["total_distance_meters"] >= 50
    assert route["estimated_duration_seconds"] > 0
    assert len(route["steps"]) == 2
    assert route["steps"][0]["maneuver_type"] == "depart"
    assert route["steps"][-1]["maneuver_type"] == "arrive"


@pytest.mark.asyncio
async def test_osrm_success_caches_route_and_serves_second_call_from_cache(
    async_db: AsyncSession,
) -> None:
    fake_osrm: dict[str, Any] = {
        "coordinates": [[10.7769, 106.6953], [10.7785, 106.6972], [10.7798, 106.6990]],
        "total_distance_meters": 540.0,
        "estimated_duration_seconds": 410.0,
        "steps": [
            {
                "instruction": "Bắt đầu đi bộ vào đường Lê Duẩn",
                "distance_meters": 540.0,
                "duration_seconds": 410.0,
                "maneuver_type": "depart",
            },
            {
                "instruction": "Đến nơi: Nhà Thờ Đức Bà",
                "distance_meters": 5.0,
                "duration_seconds": 5.0,
                "maneuver_type": "arrive",
            },
        ],
        "provider": "osrm",
    }

    req = WalkingRouteRequest(
        origin_lat=10.7769,
        origin_lng=106.6953,
        dest_lat=10.7798,
        dest_lng=106.6990,
        target_id="notre-dame-saigon",
        target_name="Nhà Thờ Đức Bà",
        target_type="heritage",
    )

    mock_osrm = AsyncMock(return_value=fake_osrm)
    with patch("app.services.routing_service.fetch_from_osrm", mock_osrm):
        first = await get_walking_route(async_db, req)
        assert first.provider == "osrm"
        assert first.cached is False
        assert first.total_distance_meters == 540.0
        assert mock_osrm.await_count == 1

        # Second call within grid tolerance hits DB cache without calling OSRM again
        second = await get_walking_route(async_db, req)
        assert second.provider == "osrm"
        assert second.cached is True
        assert second.total_distance_meters == 540.0
        assert mock_osrm.await_count == 1


@pytest.mark.asyncio
async def test_goong_fallback_when_osrm_fails_is_cached(async_db: AsyncSession) -> None:
    fake_goong: dict[str, Any] = {
        "coordinates": [[10.7769, 106.6953], [10.7798, 106.6990]],
        "total_distance_meters": 620.0,
        "estimated_duration_seconds": 496.0,
        "steps": [
            {
                "instruction": "Đi thẳng đường Nam Kỳ Khởi Nghĩa",
                "distance_meters": 620.0,
                "duration_seconds": 496.0,
                "maneuver_type": "depart",
            }
        ],
        "provider": "goong",
    }

    req = WalkingRouteRequest(
        origin_lat=10.7710,
        origin_lng=106.6980,
        dest_lat=10.7755,
        dest_lng=106.7010,
        target_id="ben-thanh-market",
        target_name="Chợ Bến Thành",
    )

    with (
        patch("app.services.routing_service.fetch_from_osrm", AsyncMock(return_value=None)),
        patch("app.services.routing_service.fetch_from_goong", AsyncMock(return_value=fake_goong)),
    ):
        res = await get_walking_route(async_db, req)
        assert res.provider == "goong"
        assert res.cached is False
        assert res.total_distance_meters == 620.0

    count = (await async_db.execute(select(func.count(RouteCache.cache_key)))).scalar()
    assert count == 1


@pytest.mark.asyncio
async def test_offline_fallback_is_not_cached(async_db: AsyncSession) -> None:
    req = WalkingRouteRequest(
        origin_lat=10.7769,
        origin_lng=106.6953,
        dest_lat=10.7850,
        dest_lng=106.7050,
        target_id="independence-palace",
        target_name="Dinh Độc Lập",
    )

    with (
        patch("app.services.routing_service.fetch_from_osrm", AsyncMock(return_value=None)),
        patch("app.services.routing_service.fetch_from_goong", AsyncMock(return_value=None)),
    ):
        res = await get_walking_route(async_db, req)
        assert res.provider == "fallback"
        assert res.cached is False
        assert len(res.coordinates) == 9
        assert res.total_distance_meters > 0

    count = (await async_db.execute(select(func.count(RouteCache.cache_key)))).scalar()
    assert count == 0


@pytest.mark.asyncio
async def test_expired_cache_entry_is_refreshed(async_db: AsyncSession) -> None:
    req = WalkingRouteRequest(
        origin_lat=10.7700,
        origin_lng=106.6900,
        dest_lat=10.7740,
        dest_lng=106.6940,
        target_id="war-remnants-museum",
        target_name="Bảo Tàng Chứng Tích Chiến Tranh",
    )
    key = build_route_cache_key(req.origin_lat, req.origin_lng, req.dest_lat, req.dest_lng)
    async_db.add(
        RouteCache(
            cache_key=key,
            origin_lat=req.origin_lat,
            origin_lng=req.origin_lng,
            dest_lat=req.dest_lat,
            dest_lng=req.dest_lng,
            provider="osrm",
            route_payload={
                "coordinates": [[10.77, 106.69], [10.774, 106.694]],
                "total_distance_meters": 999.0,
                "estimated_duration_seconds": 800.0,
                "steps": [],
            },
            expires_at=datetime.now(timezone.utc) - timedelta(days=1),
        )
    )
    await async_db.commit()

    refreshed_osrm = {
        "coordinates": [[10.77, 106.69], [10.774, 106.694]],
        "total_distance_meters": 710.0,
        "estimated_duration_seconds": 550.0,
        "steps": [],
        "provider": "osrm",
    }
    with patch("app.services.routing_service.fetch_from_osrm", AsyncMock(return_value=refreshed_osrm)):
        res = await get_walking_route(async_db, req)
        assert res.cached is False
        assert res.total_distance_meters == 710.0


def test_multimodal_cache_keys_and_fallback_durations() -> None:
    k_walk = build_route_cache_key(10.7769, 106.6953, 10.3460, 107.0843, "walking")
    k_moto = build_route_cache_key(10.7769, 106.6953, 10.3460, 107.0843, "motorbike")
    k_car = build_route_cache_key(10.7769, 106.6953, 10.3460, 107.0843, "car")
    assert len({k_walk, k_moto, k_car}) == 3

    r_walk = build_fallback_route(10.7769, 106.6953, 10.8069, 106.7253, "Điểm A", "walking")
    r_moto = build_fallback_route(10.7769, 106.6953, 10.8069, 106.7253, "Điểm A", "motorbike")
    r_car = build_fallback_route(10.7769, 106.6953, 10.8069, 106.7253, "Điểm A", "car")
    assert r_car["estimated_duration_seconds"] < r_moto["estimated_duration_seconds"] < r_walk["estimated_duration_seconds"]
