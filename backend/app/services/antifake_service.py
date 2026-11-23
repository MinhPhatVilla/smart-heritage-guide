"""Anti-Fake GPS & Walking Speed Verifier for Smart Heritage Guide check-ins.

Applies 4 deterministic rules (0-100 score) to protect the Global Leaderboard:
  1. GPS Geofence <= 200m (+40 pts)
  2. Physical walking speed 0.3-2.5 m/s (+35 pts; flags > 4.0 m/s motorized/teleport)
  3. Route trajectory continuity without teleport jumps (+15 pts)
  4. Optional Vision AI confirmation matching target site (+10 pts bonus)
"""

from __future__ import annotations

from typing import Any, Optional, Sequence

from app.models.entities import HeritageSite
from app.schemas.dto import (
    JourneyCheckInRequest,
    TravelMode,
    VerificationResult,
    VerificationStatus,
)
from app.services.geo_service import haversine_meters, polyline_metrics

# Rule thresholds (walking baseline + multi-modal thresholds for motorbike & car)
GEOFENCE_MAX_METERS = 200.0
MIN_WALKING_SPEED_MPS = 0.3
MAX_WALKING_SPEED_MPS = 2.5
MOTORIZED_SPEED_THRESHOLD_MPS = 4.0
MAX_NORMAL_SEGMENT_JUMP_METERS = 500.0
SEVERE_TELEPORT_JUMP_METERS = 1000.0
MAX_ENDPOINT_DRIFT_METERS = 300.0
MIN_VISION_CONFIDENCE = 0.70
VERIFIED_SCORE_THRESHOLD = 70.0

MODE_SPEED_LIMITS: dict[str, tuple[float, float, float]] = {
    # (min_normal_mps, max_normal_mps, flag_teleport_mps)
    "walking": (MIN_WALKING_SPEED_MPS, MAX_WALKING_SPEED_MPS, MOTORIZED_SPEED_THRESHOLD_MPS),
    "motorbike": (0.8, 22.2, 28.0),   # up to ~80 km/h normal, >100 km/h flagged
    "car": (0.8, 33.3, 42.0),         # up to ~120 km/h normal, >151 km/h flagged
}

MODE_JUMP_LIMITS: dict[str, tuple[float, float]] = {
    # (normal_jump_m, severe_teleport_m)
    "walking": (MAX_NORMAL_SEGMENT_JUMP_METERS, SEVERE_TELEPORT_JUMP_METERS),
    "motorbike": (1500.0, 3500.0),
    "car": (2500.0, 6000.0),
}


def verify_walking_checkin(
    *,
    target_site_id: str,
    target_lat: float,
    target_lng: float,
    checkin_lat: float,
    checkin_lng: float,
    walking_duration_seconds: int = 0,
    walking_distance_meters: int = 0,
    route_coordinates: Optional[Sequence[Sequence[float]]] = None,
    is_simulated: bool = False,
    travel_mode: TravelMode = "walking",
    vision_verified_site_id: Optional[str] = None,
    vision_confidence: Optional[float] = None,
) -> VerificationResult:
    """Evaluate a check-in against the 4 deterministic anti-fake rules (mode-aware)."""
    coords = list(route_coordinates or [])
    flags: list[str] = []
    mode: TravelMode = travel_mode if travel_mode in MODE_SPEED_LIMITS else "walking"
    min_mps, max_mps, flag_mps = MODE_SPEED_LIMITS[mode]
    normal_jump_m, severe_jump_m = MODE_JUMP_LIMITS[mode]

    # ------------------------------------------------------------------
    # Rule 1: GPS Geofence <= 200m (+40 pts)
    # ------------------------------------------------------------------
    geofence_distance = round(
        haversine_meters(checkin_lat, checkin_lng, target_lat, target_lng), 2
    )
    geofence_passed = geofence_distance <= GEOFENCE_MAX_METERS
    if geofence_passed:
        geofence_pts = 40.0
    else:
        geofence_pts = 0.0
        flags.append("geofence_out_of_range")

    # Compute polyline metrics once for Rules 2 & 3
    polyline_distance, max_jump = polyline_metrics(coords)
    polyline_distance = round(polyline_distance, 2)
    max_jump = round(max_jump, 2)

    # ------------------------------------------------------------------
    # Rule 2: Physical Speed according to selected `travel_mode` (+35 pts)
    # ------------------------------------------------------------------
    effective_distance = float(walking_distance_meters) if walking_distance_meters > 0 else polyline_distance
    if walking_duration_seconds > 0 and effective_distance > 0:
        avg_speed_mps = round(effective_distance / float(walking_duration_seconds), 3)
        if min_mps <= avg_speed_mps <= max_mps:
            speed_pts = 35.0
            speed_status = f"normal_{mode}"
        elif avg_speed_mps > flag_mps:
            speed_pts = 0.0
            speed_status = "motorized_or_teleport" if mode == "walking" else "overspeed_or_teleport"
            flags.append("motorized_or_teleport_speed")
        elif avg_speed_mps > max_mps:
            speed_pts = 20.0
            speed_status = "fast_jogging" if mode == "walking" else f"fast_{mode}"
            flags.append("speed_above_walking" if mode == "walking" else "speed_above_expected")
        else:
            speed_pts = 20.0
            speed_status = "slow_stroll" if mode == "walking" else "slow_traffic"
            flags.append("speed_below_walking" if mode == "walking" else "slow_traffic_pace")
    elif effective_distance > 0 and walking_duration_seconds <= 0:
        avg_speed_mps = round(effective_distance, 3)
        speed_pts = 0.0
        speed_status = "zero_duration_teleport"
        flags.append("motorized_or_teleport_speed")
    else:
        avg_speed_mps = 0.0
        # For motorized arrival (motorbike/car) right inside Geofence, allow partial score if no live timer was run
        if mode != "walking" and geofence_passed:
            speed_pts = 25.0
            speed_status = f"direct_{mode}_arrival"
        else:
            speed_pts = 0.0
            speed_status = "missing_telemetry"
            flags.append("insufficient_walking_telemetry")

    # ------------------------------------------------------------------
    # Rule 3: Route Trajectory Continuity (+15 pts)
    # ------------------------------------------------------------------
    endpoint_drift = 0.0
    if len(coords) >= 2:
        last_pt = coords[-1]
        if len(last_pt) >= 2:
            endpoint_drift = round(
                haversine_meters(float(last_pt[0]), float(last_pt[1]), checkin_lat, checkin_lng), 2
            )

        if max_jump > severe_jump_m:
            trajectory_pts = 0.0
            trajectory_status = "severe_teleport_jump"
            flags.append("trajectory_teleport_jump")
            flags.append("severe_teleport_anomaly")
        elif max_jump > normal_jump_m:
            trajectory_pts = 0.0
            trajectory_status = "teleport_jump"
            flags.append("trajectory_teleport_jump")
        elif endpoint_drift > MAX_ENDPOINT_DRIFT_METERS:
            trajectory_pts = 0.0
            trajectory_status = "endpoint_mismatch"
            flags.append("trajectory_endpoint_mismatch")
        else:
            trajectory_pts = 15.0
            trajectory_status = "continuous"
    else:
        trajectory_pts = 10.0
        trajectory_status = "sparse_trajectory"

    # ------------------------------------------------------------------
    # Rule 4: Optional Vision AI Confirmation (+10 pts bonus)
    # ------------------------------------------------------------------
    vision_matched = (
        bool(vision_verified_site_id)
        and vision_verified_site_id == target_site_id
        and (vision_confidence is None or vision_confidence >= MIN_VISION_CONFIDENCE)
    )
    vision_pts = 10.0 if vision_matched else 0.0

    # ------------------------------------------------------------------
    # Aggregate Score & Classification
    # ------------------------------------------------------------------
    total_score = round(min(100.0, geofence_pts + speed_pts + trajectory_pts + vision_pts), 2)

    critical_flags = {
        "geofence_out_of_range",
        "motorized_or_teleport_speed",
        "severe_teleport_anomaly",
    }
    has_critical_flag = any(flag in critical_flags for flag in flags)

    status: VerificationStatus
    if is_simulated:
        status = "simulated"
        if "simulated_walk_mode" not in flags:
            flags.append("simulated_walk_mode")
    elif total_score >= VERIFIED_SCORE_THRESHOLD and not has_critical_flag:
        status = "verified"
    else:
        status = "flagged"

    details: dict[str, Any] = {
        "travel_mode": mode,
        "counts_for_walking_leaderboard": mode == "walking" and status == "verified",
        "geofence": {
            "passed": geofence_passed,
            "distance_meters": geofence_distance,
            "threshold_meters": GEOFENCE_MAX_METERS,
            "points": geofence_pts,
            "max_points": 40.0,
        },
        "walking_speed": {
            "status": speed_status,
            "travel_mode": mode,
            "average_speed_mps": avg_speed_mps,
            "average_speed_kmh": round(avg_speed_mps * 3.6, 2),
            "valid_range_mps": [min_mps, max_mps],
            "motorized_threshold_mps": flag_mps,
            "points": speed_pts,
            "max_points": 35.0,
        },
        "trajectory": {
            "status": trajectory_status,
            "point_count": len(coords),
            "polyline_distance_meters": polyline_distance,
            "max_segment_jump_meters": max_jump,
            "endpoint_drift_meters": endpoint_drift,
            "points": trajectory_pts,
            "max_points": 15.0,
        },
        "vision_bonus": {
            "matched": vision_matched,
            "detected_site_id": vision_verified_site_id,
            "confidence": vision_confidence,
            "points": vision_pts,
            "max_points": 10.0,
        },
        "summary_vi": _build_summary_vi(status, total_score, geofence_distance, avg_speed_mps, flags, mode),
        "summary_en": _build_summary_en(status, total_score, geofence_distance, avg_speed_mps, flags, mode),
    }

    return VerificationResult(
        status=status,
        score=total_score,
        geofence_distance_meters=geofence_distance,
        average_speed_mps=avg_speed_mps,
        max_segment_jump_meters=max_jump,
        flags=flags,
        details=details,
    )


def verify_checkin_request(
    req: JourneyCheckInRequest,
    site: HeritageSite,
) -> VerificationResult:
    """Convenience wrapper verifying a `JourneyCheckInRequest` against a `HeritageSite` ORM entity."""
    return verify_walking_checkin(
        target_site_id=site.id,
        target_lat=float(site.lat),
        target_lng=float(site.lng),
        checkin_lat=req.checkin_lat,
        checkin_lng=req.checkin_lng,
        walking_duration_seconds=req.walking_duration_seconds,
        walking_distance_meters=req.walking_distance_meters,
        route_coordinates=req.route_coordinates,
        is_simulated=req.is_simulated,
        travel_mode=req.travel_mode,
        vision_verified_site_id=req.vision_verified_site_id,
        vision_confidence=req.vision_confidence,
    )


def _build_summary_vi(
    status: VerificationStatus,
    score: float,
    geofence_m: float,
    speed_mps: float,
    flags: list[str],
    travel_mode: TravelMode = "walking",
) -> str:
    mode_label = {
        "walking": "đi bộ",
        "motorbike": "xe máy",
        "car": "ô tô",
    }.get(travel_mode, "đi bộ")

    if status == "simulated":
        return f"Chế độ mô phỏng {mode_label} (điểm kỹ thuật {score:.0f}/100) — lưu nhật ký demo, không tính vào Bảng xếp hạng thật."
    if status == "verified":
        if travel_mode == "walking":
            return (
                f"Đã xác thực đi bộ thật ({score:.0f}/100): cách di tích {geofence_m:.0f}m, "
                f"tốc độ trung bình {speed_mps * 3.6:.1f} km/h."
            )
        return (
            f"Đã xác thực đến di tích bằng {mode_label} ({score:.0f}/100): cách di tích {geofence_m:.0f}m "
            "(tính điểm di tích & huy hiệu; không cộng vào BXH bộ hành)."
        )
    reasons = []
    if "geofence_out_of_range" in flags:
        reasons.append(f"tọa độ cách di tích {geofence_m:.0f}m (>200m)")
    if "motorized_or_teleport_speed" in flags:
        limit_kmh = MODE_SPEED_LIMITS[travel_mode][2] * 3.6
        reasons.append(f"tốc độ bất thường {speed_mps * 3.6:.1f} km/h (>{limit_kmh:.1f} km/h)")
    if "trajectory_teleport_jump" in flags or "severe_teleport_anomaly" in flags:
        reasons.append("phát hiện bước nhảy GPS bất thường trên lộ trình")
    if "insufficient_walking_telemetry" in flags:
        reasons.append("thiếu dữ liệu quãng đường/thời gian đi bộ")
    reason_text = "; ".join(reasons) if reasons else "không đạt ngưỡng xác thực 70/100"
    return f"Cảnh báo gian lận ({score:.0f}/100): {reason_text}. Không cộng điểm Bảng xếp hạng."


def _build_summary_en(
    status: VerificationStatus,
    score: float,
    geofence_m: float,
    speed_mps: float,
    flags: list[str],
    travel_mode: TravelMode = "walking",
) -> str:
    if status == "simulated":
        return f"Simulated demo {travel_mode} ({score:.0f}/100) — saved to personal log, excluded from Global Leaderboard."
    if status == "verified":
        return (
            f"Verified real {travel_mode} check-in ({score:.0f}/100): {geofence_m:.0f}m from site, "
            f"average speed {speed_mps * 3.6:.1f} km/h."
        )
    return (
        f"Flagged anomaly ({score:.0f}/100): flags={', '.join(flags) or 'below_threshold'}. "
        f"Excluded from Global Leaderboard."
    )
