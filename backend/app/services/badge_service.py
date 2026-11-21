"""Automatic Achievement Badge Engine (6 HCMC Heritage Explorer Badges)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import Badge, HeritageSite, JourneyPhoto, UserBadge, VisitedJourney
from app.schemas.dto import BadgeOut

DEFAULT_BADGES: list[dict[str, Any]] = [
    {
        "code": "first_step",
        "title_vi": "Bước Chân Đầu Tiên",
        "title_en": "First Step",
        "description_vi": "Hoàn thành hành trình đi bộ và check-in xác thực tại di tích đầu tiên.",
        "icon_name": "footprints",
        "rule_config": {"metric": "verified_sites_count", "target": 1},
    },
    {
        "code": "district1_master",
        "title_vi": "Thổ Địa Quận 1",
        "title_en": "District 1 Master",
        "description_vi": "Khám phá ít nhất 3 di tích được xác thực tại khu vực Quận 1.",
        "icon_name": "map-pin",
        "rule_config": {"metric": "district1_sites_count", "target": 3},
    },
    {
        "code": "museum_lover",
        "title_vi": "Người Yêu Bảo Tàng",
        "title_en": "Museum Lover",
        "description_vi": "Ghé thăm ít nhất 2 bảo tàng lịch sử - văn hóa được xác thực.",
        "icon_name": "landmark",
        "rule_config": {"metric": "museum_sites_count", "target": 2},
    },
    {
        "code": "heritage_photographer",
        "title_vi": "Nhiếp Ảnh Gia Di Sản",
        "title_en": "Heritage Photographer",
        "description_vi": "Lưu giữ ít nhất 3 bức ảnh kỷ niệm trong các hành trình khám phá.",
        "icon_name": "camera",
        "rule_config": {"metric": "photos_count", "target": 3},
    },
    {
        "code": "walking_marathon",
        "title_vi": "Chinh Phục 5KM Di Sản",
        "title_en": "5KM Heritage Walker",
        "description_vi": "Tích lũy tổng quãng đường đi bộ được xác thực đạt ít nhất 5.000 mét.",
        "icon_name": "trophy",
        "rule_config": {"metric": "total_verified_walking_meters", "target": 5000},
    },
    {
        "code": "saigon_explorer",
        "title_vi": "Nhà Thám Hiểm Sài Gòn",
        "title_en": "Saigon Explorer",
        "description_vi": "Check-in xác thực tại ít nhất 5 di tích khác nhau ở TP. Hồ Chí Minh.",
        "icon_name": "compass",
        "rule_config": {"metric": "verified_sites_count", "target": 5},
    },
]

_CODE_RULE_FALLBACKS: dict[str, tuple[str, int]] = {
    "first_step": ("verified_sites_count", 1),
    "district1_master": ("district1_sites_count", 3),
    "museum_lover": ("museum_sites_count", 2),
    "heritage_photographer": ("photos_count", 3),
    "walking_marathon": ("total_verified_walking_meters", 5000),
    "saigon_explorer": ("verified_sites_count", 5),
}


def _is_district_1(site: HeritageSite) -> bool:
    haystack = f"{site.district or ''} {site.city or ''} {site.address or ''}".lower()
    return (
        "quận 1" in haystack
        or "quan 1" in haystack
        or "district 1" in haystack
        or "q.1" in haystack
        or "q1" in haystack
    )


async def ensure_default_badges(db: AsyncSession) -> list[Badge]:
    """Ensure the 6 canonical badges exist in the DB and return all badges."""
    existing = (await db.execute(select(Badge))).scalars().all()
    existing_codes = {b.code for b in existing}
    added = False
    for spec in DEFAULT_BADGES:
        if spec["code"] not in existing_codes:
            db.add(Badge(**spec))
            added = True
    if added:
        await db.commit()
        existing = (await db.execute(select(Badge))).scalars().all()
    return list(existing)


async def get_user_badge_metrics(db: AsyncSession, user_id: str) -> dict[str, int]:
    """Compute verified journey & photo metrics for a user."""
    journey_rows = (
        await db.execute(
            select(VisitedJourney, HeritageSite)
            .join(HeritageSite, VisitedJourney.site_id == HeritageSite.id)
            .where(
                VisitedJourney.user_id == user_id,
                VisitedJourney.verification_status == "verified",
            )
        )
    ).all()

    unique_site_ids: set[str] = set()
    district1_site_ids: set[str] = set()
    museum_site_ids: set[str] = set()
    total_meters = 0
    total_seconds = 0

    for journey, site in journey_rows:
        unique_site_ids.add(site.id)
        if _is_district_1(site):
            district1_site_ids.add(site.id)
        if site.category == "museum":
            museum_site_ids.add(site.id)
        total_meters += int(journey.walking_distance_meters or 0)
        total_seconds += int(journey.walking_duration_seconds or 0)

    photos_count = int(
        (
            await db.execute(
                select(func.count(JourneyPhoto.id)).where(JourneyPhoto.user_id == user_id)
            )
        ).scalar()
        or 0
    )

    return {
        "verified_journeys_count": len(journey_rows),
        "verified_sites_count": len(unique_site_ids),
        "district1_sites_count": len(district1_site_ids),
        "museum_sites_count": len(museum_site_ids),
        "photos_count": photos_count,
        "total_verified_walking_meters": total_meters,
        "total_verified_walking_seconds": total_seconds,
    }


def _resolve_rule(badge: Badge) -> tuple[str, int]:
    cfg = badge.rule_config or {}
    metric_aliases = {
        "verified_sites_count": "verified_sites_count",
        "district_sites_count": "district1_sites_count",
        "district1_sites_count": "district1_sites_count",
        "category_sites_count": "museum_sites_count",
        "museum_sites_count": "museum_sites_count",
        "photos_count": "photos_count",
        "verified_walking_meters": "total_verified_walking_meters",
        "total_verified_walking_meters": "total_verified_walking_meters",
    }

    threshold = int(
        cfg.get("threshold")
        or cfg.get("target")
        or cfg.get("min_count")
        or cfg.get("min_meters")
        or 0
    )
    raw_metric = str(cfg.get("metric") or "").lower()
    if raw_metric in metric_aliases and threshold > 0:
        return metric_aliases[raw_metric], max(1, threshold)

    rule_type = str(cfg.get("type") or "").lower()
    if rule_type in ("verified_sites", "unique_sites", "sites_count") and threshold > 0:
        return "verified_sites_count", threshold
    if rule_type in ("district_sites", "district1_sites") and threshold > 0:
        return "district1_sites_count", threshold
    if rule_type in ("category_sites", "museum_sites") and threshold > 0:
        return "museum_sites_count", threshold
    if rule_type in ("photos", "photo_count", "photos_count") and threshold > 0:
        return "photos_count", threshold
    if rule_type in ("walking_meters", "distance_meters", "total_distance") and threshold > 0:
        return "total_verified_walking_meters", threshold

    return _CODE_RULE_FALLBACKS.get(badge.code, ("verified_sites_count", 1))


def compute_badge_progress(badge: Badge, metrics: dict[str, int]) -> tuple[bool, int]:
    """Return `(is_qualified, progress_percent)` for a badge given user metrics."""
    metric_key, target = _resolve_rule(badge)
    current = int(metrics.get(metric_key, 0))
    if target <= 0:
        return True, 100
    progress = min(100, int(round((current / target) * 100)))
    return current >= target, progress


async def evaluate_and_award_badges(db: AsyncSession, user_id: str) -> list[BadgeOut]:
    """Evaluate all badges for `user_id`, award newly unlocked ones, and return them."""
    badges = await ensure_default_badges(db)
    metrics = await get_user_badge_metrics(db, user_id)

    owned_rows = (
        await db.execute(select(UserBadge).where(UserBadge.user_id == user_id))
    ).scalars().all()
    owned_codes = {ub.badge_code for ub in owned_rows}

    newly_unlocked: list[BadgeOut] = []
    now_utc = datetime.now(timezone.utc)

    for badge in badges:
        if badge.code in owned_codes:
            continue
        qualified, _ = compute_badge_progress(badge, metrics)
        if qualified:
            ub = UserBadge(
                user_id=user_id,
                badge_code=badge.code,
                unlocked_at=now_utc,
            )
            db.add(ub)
            newly_unlocked.append(
                BadgeOut(
                    code=badge.code,
                    title_vi=badge.title_vi,
                    title_en=badge.title_en,
                    description_vi=badge.description_vi,
                    icon_name=badge.icon_name,
                    rule_config=badge.rule_config or {},
                    unlocked=True,
                    unlocked_at=now_utc,
                    progress_percent=100,
                )
            )

    if newly_unlocked:
        await db.commit()

    return newly_unlocked


async def list_badges_for_user(
    db: AsyncSession,
    user_id: Optional[str] = None,
) -> list[BadgeOut]:
    """Return all badge definitions with optional per-user unlocked status and progress."""
    badges = await ensure_default_badges(db)

    owned_map: dict[str, datetime] = {}
    metrics: dict[str, int] = {}
    if user_id:
        owned_rows = (
            await db.execute(select(UserBadge).where(UserBadge.user_id == user_id))
        ).scalars().all()
        owned_map = {ub.badge_code: ub.unlocked_at for ub in owned_rows}
        metrics = await get_user_badge_metrics(db, user_id)

    order_index = {spec["code"]: idx for idx, spec in enumerate(DEFAULT_BADGES)}
    badges.sort(key=lambda b: order_index.get(b.code, 999))

    results: list[BadgeOut] = []
    for badge in badges:
        if badge.code in owned_map:
            unlocked = True
            unlocked_at = owned_map[badge.code]
            progress = 100
        elif user_id:
            _, progress = compute_badge_progress(badge, metrics)
            unlocked = False
            unlocked_at = None
        else:
            unlocked = False
            unlocked_at = None
            progress = 0

        results.append(
            BadgeOut(
                code=badge.code,
                title_vi=badge.title_vi,
                title_en=badge.title_en,
                description_vi=badge.description_vi,
                icon_name=badge.icon_name,
                rule_config=badge.rule_config or {},
                unlocked=unlocked,
                unlocked_at=unlocked_at,
                progress_percent=progress,
            )
        )
    return results
