"""Unit tests for Pillar 3B: Anti-Fake GPS & Walking Speed Check-in Verifier."""

from __future__ import annotations

from types import SimpleNamespace

from app.schemas.dto import JourneyCheckInRequest
from app.services.antifake_service import verify_checkin_request, verify_walking_checkin


TARGET_LAT = 10.7769
TARGET_LNG = 106.6953


def _smooth_walk_route() -> list[list[float]]:
    """Realistic ~500m walking trajectory ending right at Independence Palace."""
    return [
        [10.7730, 106.6953],
        [10.7740, 106.6953],
        [10.7750, 106.6953],
        [10.7760, 106.6953],
        [10.7768, 106.6953],
    ]


def test_real_walking_checkin_is_verified():
    res = verify_walking_checkin(
        target_site_id="dinh-doc-lap",
        target_lat=TARGET_LAT,
        target_lng=TARGET_LNG,
        checkin_lat=10.7768,
        checkin_lng=106.6953,  # ~11m from site (<= 200m)
        walking_duration_seconds=380,
        walking_distance_meters=480,  # 1.26 m/s (normal walking)
        route_coordinates=_smooth_walk_route(),
        is_simulated=False,
    )
    assert res.status == "verified"
    assert res.score == 90.0  # 40 + 35 + 15 + 0
    assert res.geofence_distance_meters <= 200.0
    assert 0.3 <= res.average_speed_mps <= 2.5
    assert res.flags == []


def test_vision_confirmation_adds_10_point_bonus():
    res = verify_walking_checkin(
        target_site_id="dinh-doc-lap",
        target_lat=TARGET_LAT,
        target_lng=TARGET_LNG,
        checkin_lat=10.7768,
        checkin_lng=106.6953,
        walking_duration_seconds=400,
        walking_distance_meters=520,
        route_coordinates=_smooth_walk_route(),
        is_simulated=False,
        vision_verified_site_id="dinh-doc-lap",
        vision_confidence=0.91,
    )
    assert res.status == "verified"
    assert res.score == 100.0
    assert res.details["vision_bonus"]["matched"] is True
    assert res.details["vision_bonus"]["points"] == 10.0


def test_geofence_far_away_is_flagged():
    # ~1.1 km north of target site
    res = verify_walking_checkin(
        target_site_id="dinh-doc-lap",
        target_lat=TARGET_LAT,
        target_lng=TARGET_LNG,
        checkin_lat=10.7869,
        checkin_lng=106.6953,
        walking_duration_seconds=400,
        walking_distance_meters=500,
        route_coordinates=[[10.7840, 106.6953], [10.7869, 106.6953]],
        is_simulated=False,
    )
    assert res.status == "flagged"
    assert res.geofence_distance_meters > 200.0
    assert "geofence_out_of_range" in res.flags
    assert res.score < 70.0


def test_motorbike_speed_is_flagged():
    # 2000m in 180s = 11.11 m/s (~40 km/h motorbike)
    res = verify_walking_checkin(
        target_site_id="dinh-doc-lap",
        target_lat=TARGET_LAT,
        target_lng=TARGET_LNG,
        checkin_lat=10.7769,
        checkin_lng=106.6953,
        walking_duration_seconds=180,
        walking_distance_meters=2000,
        route_coordinates=_smooth_walk_route(),
        is_simulated=False,
    )
    assert res.status == "flagged"
    assert res.average_speed_mps > 4.0
    assert "motorized_or_teleport_speed" in res.flags
    assert res.score < 70.0


def test_route_teleport_jump_is_flagged():
    # Consecutive GPS jump > 2.2 km (teleport fake GPS)
    teleport_route = [
        [10.7500, 106.6953],
        [10.7768, 106.6953],
    ]
    res = verify_walking_checkin(
        target_site_id="dinh-doc-lap",
        target_lat=TARGET_LAT,
        target_lng=TARGET_LNG,
        checkin_lat=10.7768,
        checkin_lng=106.6953,
        walking_duration_seconds=1800,
        walking_distance_meters=2500,  # Looks like normal speed overall, but route teleports!
        route_coordinates=teleport_route,
        is_simulated=False,
    )
    assert res.status == "flagged"
    assert res.max_segment_jump_meters > 1000.0
    assert "trajectory_teleport_jump" in res.flags
    assert "severe_teleport_anomaly" in res.flags


def test_simulated_demo_walk_is_classified_simulated():
    res = verify_walking_checkin(
        target_site_id="dinh-doc-lap",
        target_lat=TARGET_LAT,
        target_lng=TARGET_LNG,
        checkin_lat=10.7769,
        checkin_lng=106.6953,
        walking_duration_seconds=360,
        walking_distance_meters=500,
        route_coordinates=_smooth_walk_route(),
        is_simulated=True,
    )
    assert res.status == "simulated"
    assert "simulated_walk_mode" in res.flags


def test_verify_checkin_request_wrapper():
    site = SimpleNamespace(id="dinh-doc-lap", lat=TARGET_LAT, lng=TARGET_LNG)
    req = JourneyCheckInRequest(
        site_id="dinh-doc-lap",
        checkin_lat=10.7769,
        checkin_lng=106.6953,
        walking_duration_seconds=300,
        walking_distance_meters=420,
        route_coordinates=_smooth_walk_route(),
        is_simulated=False,
    )
    res = verify_checkin_request(req, site)  # type: ignore[arg-type]
    assert res.status == "verified"
    assert res.score >= 70.0


def test_motorbike_travel_mode_is_verified_without_walking_leaderboard_credit():
    # 5 km in 500s = 10 m/s (36 km/h motorbike pace) -> valid for motorbike!
    res = verify_walking_checkin(
        target_site_id="dinh-doc-lap",
        target_lat=TARGET_LAT,
        target_lng=TARGET_LNG,
        checkin_lat=10.7769,
        checkin_lng=106.6953,
        walking_duration_seconds=500,
        walking_distance_meters=5000,
        route_coordinates=_smooth_walk_route(),
        is_simulated=False,
        travel_mode="motorbike",
    )
    assert res.status == "verified"
    assert res.score >= 85.0
    assert res.details["travel_mode"] == "motorbike"
    assert res.details["counts_for_walking_leaderboard"] is False


def test_car_extreme_teleport_speed_is_still_flagged():
    # 20 km in 100s = 200 m/s (720 km/h) -> still flagged even in car mode
    res = verify_walking_checkin(
        target_site_id="dinh-doc-lap",
        target_lat=TARGET_LAT,
        target_lng=TARGET_LNG,
        checkin_lat=10.7769,
        checkin_lng=106.6953,
        walking_duration_seconds=100,
        walking_distance_meters=20000,
        route_coordinates=_smooth_walk_route(),
        is_simulated=False,
        travel_mode="car",
    )
    assert res.status == "flagged"
    assert "motorized_or_teleport_speed" in res.flags
