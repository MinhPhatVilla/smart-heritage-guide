"""Community Leaderboard & Achievement Badges router (`/api/v1/leaderboard/*`, `/api/v1/badges`)."""

from __future__ import annotations

from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, get_optional_user
from app.models.entities import Profile, UserBadge
from app.schemas.dto import (
    BadgeOut,
    GlobalLeaderboardResponse,
    LeaderboardEntryOut,
    MyLeaderboardResponse,
    ProfileOut,
)
from app.services.badge_service import list_badges_for_user

router = APIRouter(tags=["Leaderboard & Badges"])

SortMetric = Literal["walking_time", "walking_distance", "sites_count"]


def _compute_effort_score(walking_seconds: int, walking_meters: int, sites_count: int) -> int:
    return int(round((walking_seconds / 10.0) + (walking_meters / 20.0) + (sites_count * 100)))


async def _build_ranked_entries(
    db: AsyncSession,
    sort_by: SortMetric,
) -> list[LeaderboardEntryOut]:
    """Build verified-only global leaderboard sorted by the requested metric."""
    profiles = (
        await db.execute(
            select(Profile).where(
                or_(
                    Profile.verified_sites_count > 0,
                    Profile.total_verified_walking_seconds > 0,
                    Profile.total_verified_walking_meters > 0,
                )
            )
        )
    ).scalars().all()

    badge_counts_rows = (
        await db.execute(
            select(UserBadge.user_id, func.count(UserBadge.id)).group_by(UserBadge.user_id)
        )
    ).all()
    badge_counts = {str(uid): int(cnt) for uid, cnt in badge_counts_rows}

    def _sort_key(p: Profile) -> tuple[int, int, int, str]:
        if sort_by == "walking_distance":
            return (
                int(p.total_verified_walking_meters),
                int(p.verified_sites_count),
                int(p.total_verified_walking_seconds),
                p.id,
            )
        if sort_by == "sites_count":
            return (
                int(p.verified_sites_count),
                int(p.total_verified_walking_meters),
                int(p.total_verified_walking_seconds),
                p.id,
            )
        return (
            int(p.total_verified_walking_seconds),
            int(p.total_verified_walking_meters),
            int(p.verified_sites_count),
            p.id,
        )

    profiles_sorted = sorted(profiles, key=_sort_key, reverse=True)

    entries: list[LeaderboardEntryOut] = []
    for idx, profile in enumerate(profiles_sorted, start=1):
        entries.append(
            LeaderboardEntryOut(
                rank=idx,
                user_id=profile.id,
                display_name=profile.display_name,
                avatar_url=profile.avatar_url,
                total_verified_walking_seconds=int(profile.total_verified_walking_seconds),
                total_verified_walking_meters=int(profile.total_verified_walking_meters),
                verified_sites_count=int(profile.verified_sites_count),
                badges_count=badge_counts.get(profile.id, 0),
                effort_score=_compute_effort_score(
                    int(profile.total_verified_walking_seconds),
                    int(profile.total_verified_walking_meters),
                    int(profile.verified_sites_count),
                ),
            )
        )
    return entries


@router.get(
    "/leaderboard/global",
    response_model=GlobalLeaderboardResponse,
    summary="Bảng xếp hạng Cộng đồng (chỉ tính hành trình đi bộ đã xác thực)",
)
async def get_global_leaderboard(
    sort_by: SortMetric = Query(
        default="walking_time",
        description="Tiêu chí xếp hạng: walking_time | walking_distance | sites_count",
    ),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> GlobalLeaderboardResponse:
    """Return global community leaderboard strictly aggregated from verified walking journeys."""
    entries = await _build_ranked_entries(db, sort_by)
    return GlobalLeaderboardResponse(
        sort_by=sort_by,
        total_users=len(entries),
        entries=entries[:limit],
    )


@router.get(
    "/leaderboard/me",
    response_model=MyLeaderboardResponse,
    summary="Xếp hạng cá nhân & danh sách Huy hiệu đã mở khóa / sắp đạt",
)
async def get_my_leaderboard(
    sort_by: SortMetric = Query(default="walking_time"),
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MyLeaderboardResponse:
    """Return the current user's global rank and unlocked vs upcoming badges."""
    entries = await _build_ranked_entries(db, sort_by)
    my_rank: Optional[int] = None
    for entry in entries:
        if entry.user_id == current_user.id:
            my_rank = entry.rank
            break

    all_badges = await list_badges_for_user(db, current_user.id)
    unlocked_badges = [b for b in all_badges if b.unlocked]
    upcoming_badges = sorted(
        [b for b in all_badges if not b.unlocked],
        key=lambda b: b.progress_percent,
        reverse=True,
    )

    return MyLeaderboardResponse(
        profile=ProfileOut.model_validate(current_user),
        rank=my_rank,
        total_users=len(entries),
        unlocked_badges=unlocked_badges,
        upcoming_badges=upcoming_badges,
    )


@router.get(
    "/badges",
    response_model=list[BadgeOut],
    summary="Danh mục toàn bộ 6 huy hiệu thành tựu của hệ thống",
)
async def list_badges(
    current_user: Optional[Profile] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> list[BadgeOut]:
    """Return all achievement badge definitions (with progress if authenticated)."""
    return await list_badges_for_user(db, current_user.id if current_user else None)
