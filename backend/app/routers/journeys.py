"""Walking Journeys, Anti-Fake Check-In, Photo Upload & Offline Bulk Sync router (`/api/v1/journeys/*`)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import ValidationError
from sqlalchemy import inspect as sa_inspect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import HeritageSite, JourneyPhoto, Profile, VisitedJourney
from app.schemas.dto import (
    JourneyBulkSyncRequest,
    JourneyBulkSyncResponse,
    JourneyCheckInRequest,
    JourneyCheckInResponse,
    JourneyOut,
    JourneyPhotoBase64Request,
    JourneyPhotoOut,
)
from app.services.antifake_service import verify_checkin_request
from app.services.badge_service import evaluate_and_award_badges
from app.services.storage_service import decode_base64_image, upload_journey_photo

router = APIRouter(prefix="/journeys", tags=["Journeys"])


def _extract_site_name(site: Optional[HeritageSite], fallback_id: str) -> str:
    if site is None:
        return fallback_id
    translations = site.translations or {}
    for lang in ("vi", "en", "fr", "zh", "ja"):
        loc = translations.get(lang)
        if isinstance(loc, dict) and loc.get("name"):
            return str(loc["name"])
    return site.id


def _serialize_photo(photo: JourneyPhoto) -> JourneyPhotoOut:
    return JourneyPhotoOut(
        id=photo.id,
        journey_id=photo.journey_id,
        site_id=photo.site_id,
        storage_path=photo.storage_path,
        public_url=photo.public_url,
        caption=photo.caption or "",
        lat=float(photo.lat or 0.0),
        lng=float(photo.lng or 0.0),
        walking_duration_seconds_at_capture=int(photo.walking_duration_seconds_at_capture or 0),
        vision_detected_site_id=photo.vision_detected_site_id,
        vision_confidence=photo.vision_confidence,
        taken_at=photo.taken_at,
    )


def _serialize_journey(
    journey: VisitedJourney,
    site: Optional[HeritageSite] = None,
    photos: Optional[list[JourneyPhoto]] = None,
) -> JourneyOut:
    unloaded = sa_inspect(journey).unloaded
    site_obj = site if site is not None else (None if "site" in unloaded else journey.site)
    raw_photos = (
        photos
        if photos is not None
        else ([] if "photos" in unloaded else list(journey.photos or []))
    )
    sorted_photos = sorted(raw_photos, key=lambda p: p.taken_at, reverse=True)
    return JourneyOut(
        id=journey.id,
        user_id=journey.user_id,
        site_id=journey.site_id,
        site_name=_extract_site_name(site_obj, journey.site_id),
        city=site_obj.city if site_obj else "",
        cover_image=site_obj.cover_image if site_obj else "",
        visited_at=journey.visited_at,
        walking_duration_seconds=int(journey.walking_duration_seconds or 0),
        walking_distance_meters=int(journey.walking_distance_meters or 0),
        route_coordinates=list(journey.route_coordinates or []),
        user_note=journey.user_note or "",
        user_rating=int(journey.user_rating or 5),
        verification_status=journey.verification_status,  # type: ignore[arg-type]
        verification_score=float(journey.verification_score or 0.0),
        verification_details=dict(journey.verification_details or {}),
        photos=[_serialize_photo(p) for p in sorted_photos],
    )


async def _recompute_profile_verified_stats(db: AsyncSession, profile: Profile) -> dict[str, int]:
    """Recompute Profile's verified walking aggregates strictly from `verified` journeys."""
    verified_rows = (
        await db.execute(
            select(VisitedJourney).where(
                VisitedJourney.user_id == profile.id,
                VisitedJourney.verification_status == "verified",
            )
        )
    ).scalars().all()

    total_seconds = sum(int(j.walking_duration_seconds or 0) for j in verified_rows)
    total_meters = sum(int(j.walking_distance_meters or 0) for j in verified_rows)
    unique_sites = len({j.site_id for j in verified_rows})

    profile.total_verified_walking_seconds = total_seconds
    profile.total_verified_walking_meters = total_meters
    profile.verified_sites_count = unique_sites
    db.add(profile)
    await db.flush()

    return {
        "total_verified_walking_seconds": total_seconds,
        "total_verified_walking_meters": total_meters,
        "verified_sites_count": unique_sites,
    }


@router.get(
    "/me",
    response_model=list[JourneyOut],
    summary="Lấy toàn bộ nhật ký hành trình & album ảnh đã đồng bộ của tài khoản hiện tại",
)
async def get_my_journeys(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[JourneyOut]:
    """Return all walking journeys and attached photos for the authenticated user."""
    stmt = (
        select(VisitedJourney)
        .options(
            selectinload(VisitedJourney.photos),
            selectinload(VisitedJourney.site),
        )
        .where(VisitedJourney.user_id == current_user.id)
        .order_by(VisitedJourney.visited_at.desc())
    )
    journeys = list((await db.execute(stmt)).scalars().all())
    return [_serialize_journey(j) for j in journeys]


@router.post(
    "/check-in",
    response_model=JourneyCheckInResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ghi nhận check-in đi bộ + chạy Anti-Fake Verifier + tự động xét mở khóa Huy hiệu",
)
async def check_in_journey(
    payload: JourneyCheckInRequest,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JourneyCheckInResponse:
    """Verify a walking check-in via Anti-Fake rules, update verified stats, and award badges."""
    site = await db.get(HeritageSite, payload.site_id)
    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy di tích với mã '{payload.site_id}'.",
        )

    verification = verify_checkin_request(payload, site)
    details: dict[str, Any] = dict(verification.details or {})
    details.setdefault("geofence_distance_meters", verification.geofence_distance_meters)
    details.setdefault("average_speed_mps", verification.average_speed_mps)
    details.setdefault("max_segment_jump_meters", verification.max_segment_jump_meters)
    details.setdefault("flags", list(verification.flags))

    journey = VisitedJourney(
        user_id=current_user.id,
        site_id=site.id,
        visited_at=payload.visited_at or datetime.now(timezone.utc),
        walking_duration_seconds=payload.walking_duration_seconds,
        walking_distance_meters=payload.walking_distance_meters,
        route_coordinates=list(payload.route_coordinates or []),
        user_note=payload.user_note.strip(),
        user_rating=payload.user_rating,
        verification_status=verification.status,
        verification_score=verification.score,
        verification_details=details,
    )
    db.add(journey)
    await db.flush()

    profile_stats = await _recompute_profile_verified_stats(db, current_user)
    await db.commit()

    newly_unlocked = await evaluate_and_award_badges(db, current_user.id)

    loaded_journey = (
        await db.execute(
            select(VisitedJourney)
            .options(
                selectinload(VisitedJourney.photos),
                selectinload(VisitedJourney.site),
            )
            .where(VisitedJourney.id == journey.id)
        )
    ).scalar_one()

    return JourneyCheckInResponse(
        journey=_serialize_journey(loaded_journey, site=site),
        verification=verification,
        newly_unlocked_badges=newly_unlocked,
        profile_stats=profile_stats,
    )


@router.post(
    "/{journey_id}/photos",
    response_model=JourneyPhotoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Tải ảnh hành trình lên Supabase Storage / Local Uploads (hỗ trợ JSON base64 hoặc multipart/form-data)",
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": JourneyPhotoBase64Request.model_json_schema(),
                },
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "file": {"type": "string", "format": "binary"},
                            "caption": {"type": "string"},
                            "lat": {"type": "number"},
                            "lng": {"type": "number"},
                            "walking_duration_seconds_at_capture": {"type": "integer"},
                            "vision_detected_site_id": {"type": "string"},
                            "vision_confidence": {"type": "number"},
                        },
                        "required": ["file"],
                    }
                },
            },
        }
    },
)
async def upload_photo_to_journey(
    journey_id: str,
    request: Request,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JourneyPhotoOut:
    """Attach a captured photo (JSON base64 or multipart file) to a journey and re-evaluate badges."""
    journey = await db.get(VisitedJourney, journey_id)
    if journey is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy hành trình '{journey_id}'.",
        )
    if journey.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền tải ảnh lên hành trình của người dùng khác.",
        )

    content_type = (request.headers.get("content-type") or "").lower()
    raw_bytes: bytes
    mime_type = "image/jpeg"
    filename: Optional[str] = None
    caption = ""
    lat = 0.0
    lng = 0.0
    walking_sec = 0
    vision_site_id: Optional[str] = None
    vision_conf: Optional[float] = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        upload_file = form.get("file")
        if upload_file is not None and hasattr(upload_file, "read"):
            raw_bytes = await upload_file.read()  # type: ignore[union-attr]
            mime_type = getattr(upload_file, "content_type", None) or "image/jpeg"
            filename = getattr(upload_file, "filename", None)
        elif form.get("image_base64"):
            try:
                raw_bytes, mime_type = decode_base64_image(
                    str(form.get("image_base64")),
                    str(form.get("mime_type") or "image/jpeg"),
                )
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Dữ liệu ảnh base64 không hợp lệ: {exc}",
                ) from exc
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Thiếu trường 'file' hoặc 'image_base64' trong multipart form.",
            )

        if not raw_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tệp ảnh tải lên đang rỗng.",
            )
        caption = str(form.get("caption") or "")[:500]
        try:
            lat = float(form.get("lat") or 0.0)
            lng = float(form.get("lng") or 0.0)
            walking_sec = max(0, int(form.get("walking_duration_seconds_at_capture") or 0))
            if form.get("vision_detected_site_id"):
                vision_site_id = str(form.get("vision_detected_site_id"))
            if form.get("vision_confidence") not in (None, ""):
                vision_conf = float(form.get("vision_confidence"))  # type: ignore[arg-type]
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Tham số metadata ảnh không hợp lệ: {exc}",
            ) from exc
    else:
        try:
            body_json = await request.json()
            dto = JourneyPhotoBase64Request.model_validate(body_json)
        except ValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=exc.errors(),
            ) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payload JSON không hợp lệ: {exc}",
            ) from exc

        try:
            raw_bytes, mime_type = decode_base64_image(dto.image_base64, dto.mime_type)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dữ liệu ảnh base64 không hợp lệ: {exc}",
            ) from exc

        caption = dto.caption
        lat = dto.lat
        lng = dto.lng
        walking_sec = dto.walking_duration_seconds_at_capture
        vision_site_id = dto.vision_detected_site_id
        vision_conf = dto.vision_confidence

    stored = await upload_journey_photo(
        user_id=current_user.id,
        journey_id=journey.id,
        content=raw_bytes,
        mime_type=mime_type,
        filename=filename,
    )

    photo = JourneyPhoto(
        journey_id=journey.id,
        user_id=current_user.id,
        site_id=journey.site_id,
        storage_path=stored.storage_path,
        public_url=stored.public_url,
        caption=caption.strip(),
        lat=lat,
        lng=lng,
        walking_duration_seconds_at_capture=walking_sec,
        vision_detected_site_id=vision_site_id,
        vision_confidence=vision_conf,
        taken_at=datetime.now(timezone.utc),
    )
    db.add(photo)
    await db.commit()
    await db.refresh(photo)

    # Re-evaluate badges (specifically unlocks `heritage_photographer` at >= 3 photos)
    await evaluate_and_award_badges(db, current_user.id)

    return _serialize_photo(photo)


@router.post(
    "/sync",
    response_model=JourneyBulkSyncResponse,
    summary="Đồng bộ hàng loạt hành trình offline khi Khách đăng nhập lên Cloud",
)
async def bulk_sync_journeys(
    payload: JourneyBulkSyncRequest,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JourneyBulkSyncResponse:
    """Bulk-sync offline guest walking journeys upon login with anti-fake verification & badges."""
    site_ids = list({item.site_id for item in payload.journeys})
    sites = (
        await db.execute(select(HeritageSite).where(HeritageSite.id.in_(site_ids)))
    ).scalars().all()
    site_map = {s.id: s for s in sites}

    created_journeys: list[VisitedJourney] = []
    for item in payload.journeys:
        site = site_map.get(item.site_id)
        if site is None:
            continue

        visited_ts = item.visited_at or datetime.now(timezone.utc)
        verification = verify_checkin_request(item, site)
        details: dict[str, Any] = dict(verification.details or {})
        details.setdefault("geofence_distance_meters", verification.geofence_distance_meters)
        details.setdefault("average_speed_mps", verification.average_speed_mps)
        details.setdefault("max_segment_jump_meters", verification.max_segment_jump_meters)
        details.setdefault("flags", list(verification.flags))
        details["synced_from_offline"] = True

        journey = VisitedJourney(
            user_id=current_user.id,
            site_id=site.id,
            visited_at=visited_ts,
            walking_duration_seconds=item.walking_duration_seconds,
            walking_distance_meters=item.walking_distance_meters,
            route_coordinates=list(item.route_coordinates or []),
            user_note=item.user_note.strip(),
            user_rating=item.user_rating,
            verification_status=verification.status,
            verification_score=verification.score,
            verification_details=details,
        )
        db.add(journey)
        created_journeys.append(journey)

    await db.flush()
    await _recompute_profile_verified_stats(db, current_user)
    await db.commit()

    newly_unlocked = await evaluate_and_award_badges(db, current_user.id)

    serialized = [
        _serialize_journey(j, site=site_map.get(j.site_id))
        for j in created_journeys
    ]
    return JourneyBulkSyncResponse(
        synced_count=len(serialized),
        journeys=serialized,
        newly_unlocked_badges=newly_unlocked,
    )
