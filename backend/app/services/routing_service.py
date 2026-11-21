"""Walking Route Proxy Service with DB Cache -> FOSSGIS OSRM -> Goong -> Offline Fallback."""

from __future__ import annotations

import math
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.entities import RouteCache
from app.schemas.dto import RouteStepDTO, WalkingRouteRequest, WalkingRouteResponse
from app.services.geo_service import estimate_walking_seconds, haversine_meters

GOONG_DIRECTION_URL = "https://rsapi.goong.io/v2/direction"
REQUEST_TIMEOUT_SECONDS = 6.0
GRID_PRECISION = 4  # ~11m grid snapping for higher cache hit rate

_HTML_TAG_RE = re.compile(r"<[^>]*>")
_WHITESPACE_RE = re.compile(r"\s+")


def build_route_cache_key(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> str:
    """Create a deterministic grid-rounded cache key for walking route lookups."""
    return (
        f"walk:{round(origin_lat, GRID_PRECISION):.{GRID_PRECISION}f},"
        f"{round(origin_lng, GRID_PRECISION):.{GRID_PRECISION}f}->"
        f"{round(dest_lat, GRID_PRECISION):.{GRID_PRECISION}f},"
        f"{round(dest_lng, GRID_PRECISION):.{GRID_PRECISION}f}"
    )


def decode_polyline(encoded: str) -> list[list[float]]:
    """Decode a Google Encoded Polyline (precision 5) into `[[lat, lng], ...]`."""
    coords: list[list[float]] = []
    index = 0
    lat = 0
    lng = 0
    length = len(encoded)

    while index < length:
        for axis in (0, 1):
            result = 0
            shift = 0
            while index < length:
                byte = ord(encoded[index]) - 63
                index += 1
                result |= (byte & 0x1F) << shift
                shift += 5
                if byte < 0x20:
                    break
            delta = ~(result >> 1) if (result & 1) else (result >> 1)
            if axis == 0:
                lat += delta
            else:
                lng += delta
        coords.append([lat / 1e5, lng / 1e5])
    return coords


def _strip_html(raw: str) -> str:
    return _WHITESPACE_RE.sub(" ", _HTML_TAG_RE.sub(" ", raw or "")).strip()


def _maneuver_from_modifier(modifier: str) -> str:
    lower = (modifier or "").lower()
    if "left" in lower:
        return "turn-left"
    if "right" in lower:
        return "turn-right"
    return "straight"


def _is_not_expired(expires_at: datetime, now_utc: datetime) -> bool:
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at > now_utc


async def fetch_from_osrm(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    target_name: str,
) -> Optional[dict[str, Any]]:
    """Fetch true pedestrian walking route from FOSSGIS OSRM (`routed-foot`)."""
    base = settings.OSRM_BASE_URL.rstrip("/")
    url = (
        f"{base}/route/v1/foot/{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
        "?overview=full&geometries=geojson&steps=true"
    )
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            data = resp.json()
    except Exception:
        return None

    routes = data.get("routes") or []
    if not routes:
        return None
    route = routes[0]
    raw_coords = (route.get("geometry") or {}).get("coordinates") or []
    if not raw_coords:
        return None

    # GeoJSON is [lng, lat] -> Mobile expects [lat, lng]
    coordinates = [[float(c[1]), float(c[0])] for c in raw_coords if len(c) >= 2]
    if len(coordinates) < 2:
        return None

    legs = route.get("legs") or []
    raw_steps = legs[0].get("steps") or [] if legs else []
    filtered_steps = [
        s
        for s in raw_steps
        if (s.get("distance") or 0) > 0 or (s.get("maneuver") or {}).get("type") == "arrive"
    ][:8]

    steps: list[dict[str, Any]] = []
    dest_label = target_name or "điểm đến"
    total_step_count = len(filtered_steps)
    for idx, step in enumerate(filtered_steps):
        name = (step.get("name") or "").strip()
        road = f" đường {name}" if name else " tuyến phố tiếp theo"
        maneuver = step.get("maneuver") or {}
        modifier = str(maneuver.get("modifier") or "")
        is_first = idx == 0
        is_last = idx == total_step_count - 1 or maneuver.get("type") == "arrive"

        maneuver_type = _maneuver_from_modifier(modifier)
        instruction = f"Đi tiếp theo{road}"
        if is_first:
            maneuver_type = "depart"
            instruction = f"Bắt đầu đi bộ vào{road}"
        elif is_last:
            maneuver_type = "arrive"
            instruction = f"Đến nơi: {dest_label}"
        elif maneuver_type == "turn-left":
            instruction = f"Rẽ trái vào{road}"
        elif maneuver_type == "turn-right":
            instruction = f"Rẽ phải vào{road}"

        steps.append(
            {
                "instruction": instruction,
                "distance_meters": float(max(5, round(step.get("distance") or 0))),
                "duration_seconds": float(max(5, round(step.get("duration") or 0))),
                "maneuver_type": maneuver_type,
            }
        )

    return {
        "coordinates": coordinates,
        "total_distance_meters": float(round(route.get("distance") or 0)),
        "estimated_duration_seconds": float(round(route.get("duration") or 0)),
        "steps": steps,
        "provider": "osrm",
    }


async def fetch_from_goong(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    target_name: str,
) -> Optional[dict[str, Any]]:
    """Fallback route via Goong Direction API (server-side API key, walking speed adjusted)."""
    if not settings.has_goong:
        return None

    params = {
        "origin": f"{origin_lat},{origin_lng}",
        "destination": f"{dest_lat},{dest_lng}",
        "vehicle": "bike",
        "api_key": settings.GOONG_API_KEY.strip(),
    }
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            resp = await client.get(GOONG_DIRECTION_URL, params=params)
            if resp.status_code != 200:
                return None
            data = resp.json()
    except Exception:
        return None

    routes = data.get("routes") or []
    if not routes:
        return None
    route = routes[0]
    legs = route.get("legs") or []
    if not legs:
        return None
    leg = legs[0]

    encoded = (route.get("overview_polyline") or {}).get("points") or ""
    coordinates = decode_polyline(encoded) if encoded else []
    if len(coordinates) < 2:
        return None

    total_distance = float(round((leg.get("distance") or {}).get("value") or 0))
    if total_distance <= 0:
        return None

    # Convert bike route distance to realistic pedestrian pace (~1.25 m/s)
    estimated_duration = float(round(total_distance / 1.25))
    raw_steps = (leg.get("steps") or [])[:8]
    dest_label = target_name or "điểm đến"
    steps: list[dict[str, Any]] = []
    for idx, step in enumerate(raw_steps):
        dist_m = float(max(5, round((step.get("distance") or {}).get("value") or 0)))
        text = _strip_html(step.get("html_instructions") or "") or "Đi tiếp theo tuyến phố"
        if idx == 0:
            mtype = "depart"
        elif idx == len(raw_steps) - 1:
            mtype = "arrive"
        else:
            mtype = _maneuver_from_modifier(str(step.get("maneuver") or ""))
        instruction = f"{text} · Đến nơi: {dest_label}" if idx == len(raw_steps) - 1 else text
        steps.append(
            {
                "instruction": instruction,
                "distance_meters": dist_m,
                "duration_seconds": float(round(dist_m / 1.25)),
                "maneuver_type": mtype,
            }
        )

    return {
        "coordinates": coordinates,
        "total_distance_meters": total_distance,
        "estimated_duration_seconds": estimated_duration,
        "steps": steps,
        "provider": "goong",
    }


def build_fallback_route(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    target_name: str,
) -> dict[str, Any]:
    """Build a realistic curved offline Haversine walking route when external providers fail."""
    straight_dist = haversine_meters(origin_lat, origin_lng, dest_lat, dest_lng)
    total_distance_meters = float(max(50, round(straight_dist * 1.25)))
    estimated_duration_seconds = float(estimate_walking_seconds(straight_dist))

    segments = 8
    coordinates: list[list[float]] = []
    for i in range(segments + 1):
        t = i / segments
        curve_offset = math.sin(t * math.pi) * 0.00045
        coordinates.append(
            [
                round(origin_lat + (dest_lat - origin_lat) * t + curve_offset, 6),
                round(origin_lng + (dest_lng - origin_lng) * t - curve_offset * 0.6, 6),
            ]
        )

    dest_label = target_name or "điểm đến"
    steps = [
        {
            "instruction": f"Đi bộ theo hướng {dest_label} (tuyến nội suy dự phòng)",
            "distance_meters": total_distance_meters,
            "duration_seconds": estimated_duration_seconds,
            "maneuver_type": "depart",
        },
        {
            "instruction": f"Đến nơi: {dest_label}",
            "distance_meters": 0.0,
            "duration_seconds": 0.0,
            "maneuver_type": "arrive",
        },
    ]

    return {
        "coordinates": coordinates,
        "total_distance_meters": total_distance_meters,
        "estimated_duration_seconds": estimated_duration_seconds,
        "steps": steps,
        "provider": "fallback",
    }


async def get_walking_route(
    db: AsyncSession,
    request: WalkingRouteRequest,
) -> WalkingRouteResponse:
    """Resolve walking route via DB cache -> FOSSGIS OSRM -> Goong -> Offline fallback."""
    cache_key = build_route_cache_key(
        request.origin_lat,
        request.origin_lng,
        request.dest_lat,
        request.dest_lng,
    )
    now_utc = datetime.now(timezone.utc)

    # 1. Check DB cache
    existing_res = await db.execute(select(RouteCache).where(RouteCache.cache_key == cache_key))
    cached_row = existing_res.scalar_one_or_none()
    if cached_row is not None and _is_not_expired(cached_row.expires_at, now_utc):
        payload = cached_row.route_payload or {}
        steps = [RouteStepDTO(**s) for s in (payload.get("steps") or [])]
        return WalkingRouteResponse(
            origin=[request.origin_lat, request.origin_lng],
            destination=[request.dest_lat, request.dest_lng],
            target_id=request.target_id,
            target_name=request.target_name,
            target_type=request.target_type,
            coordinates=payload.get("coordinates") or [],
            total_distance_meters=float(payload.get("total_distance_meters") or 0.0),
            estimated_duration_seconds=float(payload.get("estimated_duration_seconds") or 0.0),
            steps=steps,
            provider=cached_row.provider if cached_row.provider in ("osrm", "goong", "fallback") else "osrm",
            cached=True,
        )

    # 2. Try FOSSGIS OSRM -> Goong -> Fallback
    route_data = await fetch_from_osrm(
        request.origin_lat,
        request.origin_lng,
        request.dest_lat,
        request.dest_lng,
        request.target_name,
    )
    if route_data is None:
        route_data = await fetch_from_goong(
            request.origin_lat,
            request.origin_lng,
            request.dest_lat,
            request.dest_lng,
            request.target_name,
        )
    if route_data is None:
        route_data = build_fallback_route(
            request.origin_lat,
            request.origin_lng,
            request.dest_lat,
            request.dest_lng,
            request.target_name,
        )

    provider = route_data["provider"]
    # 3. Cache only non-fallback routes (7-day TTL)
    if provider != "fallback":
        expires_at = now_utc + timedelta(days=settings.ROUTE_CACHE_TTL_DAYS)
        cache_payload = {
            "coordinates": route_data["coordinates"],
            "total_distance_meters": route_data["total_distance_meters"],
            "estimated_duration_seconds": route_data["estimated_duration_seconds"],
            "steps": route_data["steps"],
        }
        if cached_row is not None:
            cached_row.origin_lat = request.origin_lat
            cached_row.origin_lng = request.origin_lng
            cached_row.dest_lat = request.dest_lat
            cached_row.dest_lng = request.dest_lng
            cached_row.provider = provider
            cached_row.route_payload = cache_payload
            cached_row.expires_at = expires_at
        else:
            db.add(
                RouteCache(
                    cache_key=cache_key,
                    origin_lat=request.origin_lat,
                    origin_lng=request.origin_lng,
                    dest_lat=request.dest_lat,
                    dest_lng=request.dest_lng,
                    provider=provider,
                    route_payload=cache_payload,
                    expires_at=expires_at,
                )
            )
        await db.commit()

    return WalkingRouteResponse(
        origin=[request.origin_lat, request.origin_lng],
        destination=[request.dest_lat, request.dest_lng],
        target_id=request.target_id,
        target_name=request.target_name,
        target_type=request.target_type,
        coordinates=route_data["coordinates"],
        total_distance_meters=route_data["total_distance_meters"],
        estimated_duration_seconds=route_data["estimated_duration_seconds"],
        steps=[RouteStepDTO(**s) for s in route_data["steps"]],
        provider=provider,
        cached=False,
    )
