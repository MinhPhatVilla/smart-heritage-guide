"""Geospatial helpers & dual-DB PostGIS / Haversine spatial query utilities."""

from __future__ import annotations

import math
from typing import Iterable, Optional, Sequence

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings

EARTH_RADIUS_METERS = 6_371_000.0
DEFAULT_WALKING_SPEED_MPS = 1.35  # ~4.86 km/h comfortable sightseeing walk
TRAVEL_MODE_SPEED_MPS: dict[str, float] = {
    "walking": DEFAULT_WALKING_SPEED_MPS,  # ~4.9 km/h
    "motorbike": 8.5,                      # ~30.6 km/h urban + suburban motorbike
    "car": 11.0,                           # ~39.6 km/h urban + intercity car
}


def haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Compute great-circle distance in meters between two WGS84 coordinates."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lam = math.radians(lng2 - lng1)

    a = (
        math.sin(d_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lam / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return EARTH_RADIUS_METERS * c


def estimate_walking_seconds(distance_meters: float, speed_mps: float = DEFAULT_WALKING_SPEED_MPS) -> int:
    """Estimate walking duration in seconds (applies 1.2x street-grid factor for straight-line)."""
    if distance_meters <= 0:
        return 0
    return max(1, int(round((distance_meters * 1.2) / max(speed_mps, 0.5))))


def estimate_walking_minutes(distance_meters: float, speed_mps: float = DEFAULT_WALKING_SPEED_MPS) -> int:
    """Estimate walking duration in whole minutes (minimum 1 min if distance > 0)."""
    if distance_meters <= 0:
        return 0
    return max(1, int(math.ceil(estimate_walking_seconds(distance_meters, speed_mps) / 60.0)))


def estimate_travel_seconds(distance_meters: float, travel_mode: str = "walking") -> int:
    """Estimate travel duration in seconds for walking, motorbike, or car."""
    if distance_meters <= 0:
        return 0
    speed = TRAVEL_MODE_SPEED_MPS.get(travel_mode, DEFAULT_WALKING_SPEED_MPS)
    road_factor = 1.2 if travel_mode == "walking" else 1.28
    return max(1, int(round((distance_meters * road_factor) / max(speed, 0.5))))


def estimate_travel_minutes(distance_meters: float, travel_mode: str = "walking") -> int:
    """Estimate travel duration in whole minutes (minimum 1 min if distance > 0)."""
    if distance_meters <= 0:
        return 0
    return max(1, int(math.ceil(estimate_travel_seconds(distance_meters, travel_mode) / 60.0)))


def polyline_metrics(coordinates: Sequence[Sequence[float]]) -> tuple[float, float]:
    """Return `(total_distance_meters, max_segment_jump_meters)` for a `[[lat, lng], ...]` path."""
    if not coordinates or len(coordinates) < 2:
        return 0.0, 0.0
    total = 0.0
    max_jump = 0.0
    for idx in range(1, len(coordinates)):
        prev_pt = coordinates[idx - 1]
        curr_pt = coordinates[idx]
        if len(prev_pt) < 2 or len(curr_pt) < 2:
            continue
        seg = haversine_meters(float(prev_pt[0]), float(prev_pt[1]), float(curr_pt[0]), float(curr_pt[1]))
        total += seg
        if seg > max_jump:
            max_jump = seg
    return total, max_jump


def bounding_box(lat: float, lng: float, radius_meters: float) -> tuple[float, float, float, float]:
    """Return `(min_lat, max_lat, min_lng, max_lng)` bounding box around a center point."""
    lat_delta = radius_meters / 111_320.0
    cos_lat = max(0.01, math.cos(math.radians(lat)))
    lng_delta = radius_meters / (111_320.0 * cos_lat)
    return lat - lat_delta, lat + lat_delta, lng - lng_delta, lng + lng_delta


async def query_site_distances_postgis(
    db: AsyncSession,
    lat: float,
    lng: float,
    radius_m: Optional[float] = None,
) -> Optional[dict[str, float]]:
    """Run native PostGIS `ST_Distance` / `ST_DWithin` when connected to Supabase Postgres.

    Returns `{site_id: distance_meters}` on Postgres+PostGIS, or `None` when running on SQLite
    (or if PostGIS column is unavailable), signaling callers to use portable Haversine filtering.
    """
    if not settings.is_postgres:
        return None
    try:
        if radius_m is not None and radius_m > 0:
            sql = text(
                """
                SELECT id,
                       ST_Distance(
                           location,
                           ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
                       ) AS dist_m
                FROM heritage_sites
                WHERE ST_DWithin(
                    location,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :radius_m
                )
                ORDER BY dist_m ASC
                """
            )
            res = await db.execute(sql, {"lat": lat, "lng": lng, "radius_m": radius_m})
        else:
            sql = text(
                """
                SELECT id,
                       ST_Distance(
                           location,
                           ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
                       ) AS dist_m
                FROM heritage_sites
                ORDER BY dist_m ASC
                """
            )
            res = await db.execute(sql, {"lat": lat, "lng": lng})
        return {str(row[0]): float(row[1]) for row in res.fetchall()}
    except Exception:
        return None


def filter_and_sort_by_distance(
    items: Iterable[object],
    lat: float,
    lng: float,
    radius_m: Optional[float] = None,
    postgis_distances: Optional[dict[str, float]] = None,
) -> list[tuple[object, float]]:
    """Portable distance computation & optional radius filter for ORM entities with `.id, .lat, .lng`."""
    results: list[tuple[object, float]] = []
    for item in items:
        item_id = getattr(item, "id", None)
        if postgis_distances is not None and item_id in postgis_distances:
            dist = postgis_distances[item_id]
        else:
            if postgis_distances is not None and radius_m is not None and radius_m > 0:
                # Already filtered out by PostGIS ST_DWithin
                continue
            dist = haversine_meters(lat, lng, float(getattr(item, "lat")), float(getattr(item, "lng")))
        if radius_m is not None and radius_m > 0 and dist > radius_m:
            continue
        results.append((item, round(dist, 2)))
    results.sort(key=lambda pair: pair[1])
    return results
