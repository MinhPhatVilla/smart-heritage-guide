"""Admin CRUD router for Heritage Sites & Restaurants with automatic RAG chunk re-indexing."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import require_admin
from app.models.entities import HeritageSite, Profile, Restaurant
from app.routers.sites import _serialize_restaurant, _serialize_site
from app.schemas.dto import (
    AdminTranslateSiteRequest,
    AdminTranslateSiteResponse,
    HeritageSiteCreateRequest,
    HeritageSiteOut,
    HeritageSiteUpdateRequest,
    RestaurantCreateRequest,
    RestaurantOut,
    RestaurantUpdateRequest,
)
from app.services.rag_service import reindex_site_chunks
from app.services.translation_service import translate_site_content

router = APIRouter(
    prefix="/admin",
    tags=["Admin CRUD"],
    dependencies=[Depends(require_admin)],
)


async def _reindex_site_knowledge_chunks(db: AsyncSession, site_id: str) -> int:
    """Rebuild multilingual RAG knowledge chunks for a site and its nearby restaurants."""
    stmt = (
        select(HeritageSite)
        .options(selectinload(HeritageSite.restaurants))
        .where(HeritageSite.id == site_id)
    )
    site = (await db.execute(stmt)).scalar_one_or_none()
    if site is None:
        return 0
    return await reindex_site_chunks(db, site, list(site.restaurants or []))


# ---------------------------------------------------------------------------
# Admin Heritage Sites CRUD
# ---------------------------------------------------------------------------
@router.post(
    "/sites",
    response_model=HeritageSiteOut,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Thêm mới di tích lịch sử & tự động lập chỉ mục tri thức RAG",
)
async def create_site(
    payload: HeritageSiteCreateRequest,
    _admin: Profile = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> HeritageSiteOut:
    """Create a new heritage site and automatically index its multilingual RAG knowledge chunks."""
    existing = await db.get(HeritageSite, payload.id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Di tích với mã '{payload.id}' đã tồn tại.",
        )

    site = HeritageSite(
        id=payload.id.strip(),
        city=payload.city.strip(),
        district=payload.district.strip() if payload.district else None,
        lat=payload.lat,
        lng=payload.lng,
        category=payload.category,
        unesco_recognized=payload.unesco_recognized,
        national_special_monument=payload.national_special_monument,
        rating=payload.rating,
        review_count=payload.review_count,
        ticket_price=payload.ticket_price,
        address=payload.address,
        cover_image=payload.cover_image,
        recommended_visit_minutes=payload.recommended_visit_minutes,
        translations=dict(payload.translations or {}),
        media_gallery=list(payload.media_gallery or []),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(site)
    await db.flush()
    await _reindex_site_knowledge_chunks(db, site.id)
    await db.commit()

    refreshed = (
        await db.execute(
            select(HeritageSite)
            .options(selectinload(HeritageSite.restaurants))
            .where(HeritageSite.id == site.id)
        )
    ).scalar_one()
    return _serialize_site(refreshed)


@router.put(
    "/sites/{site_id}",
    response_model=HeritageSiteOut,
    summary="[Admin] Cập nhật thông tin di tích & tự động re-index tri thức RAG",
)
async def update_site(
    site_id: str,
    payload: HeritageSiteUpdateRequest,
    _admin: Profile = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> HeritageSiteOut:
    """Update an existing heritage site and automatically rebuild its RAG knowledge chunks."""
    stmt = (
        select(HeritageSite)
        .options(selectinload(HeritageSite.restaurants))
        .where(HeritageSite.id == site_id)
    )
    site = (await db.execute(stmt)).scalar_one_or_none()
    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy di tích với mã '{site_id}'.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(site, field, value)
    site.updated_at = datetime.now(timezone.utc)

    db.add(site)
    await db.flush()
    await _reindex_site_knowledge_chunks(db, site.id)
    await db.commit()

    refreshed = (
        await db.execute(
            select(HeritageSite)
            .options(selectinload(HeritageSite.restaurants))
            .where(HeritageSite.id == site.id)
        )
    ).scalar_one()
    return _serialize_site(refreshed)


@router.delete(
    "/sites/{site_id}",
    summary="[Admin] Xóa di tích lịch sử (tự động xóa quán ăn & RAG chunks liên quan)",
)
async def delete_site(
    site_id: str,
    _admin: Profile = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    """Delete a heritage site and cascade-delete its dependent restaurants and knowledge chunks."""
    site = await db.get(HeritageSite, site_id)
    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy di tích với mã '{site_id}'.",
        )
    await db.delete(site)
    await db.commit()
    return {"deleted": True, "site_id": site_id}


# ---------------------------------------------------------------------------
# Admin AI 5-Language Content Translation Helper
# ---------------------------------------------------------------------------
@router.post(
    "/translate-site",
    response_model=AdminTranslateSiteResponse,
    summary="[Admin] AI tự động dịch nội dung di tích sang đủ 5 ngôn ngữ (VI/EN/FR/ZH/JA)",
)
async def translate_site(
    payload: AdminTranslateSiteRequest,
    _admin: Profile = Depends(require_admin),
) -> AdminTranslateSiteResponse:
    """Translate site texts (name, summary, era, hours, highlights, audio script) across VI/EN/FR/ZH/JA."""
    return await translate_site_content(payload)


# ---------------------------------------------------------------------------
# Admin Restaurants CRUD
# ---------------------------------------------------------------------------
@router.post(
    "/restaurants",
    response_model=RestaurantOut,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Thêm mới quán ăn gần di tích & cập nhật RAG chunks",
)
async def create_restaurant(
    payload: RestaurantCreateRequest,
    _admin: Profile = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> RestaurantOut:
    """Create a nearby restaurant linked to an existing heritage site."""
    site = await db.get(HeritageSite, payload.site_id)
    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy di tích cha '{payload.site_id}'.",
        )

    rest_id = (payload.id or f"res-{uuid.uuid4().hex[:10]}").strip()
    if await db.get(Restaurant, rest_id) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Quán ăn với mã '{rest_id}' đã tồn tại.",
        )

    restaurant = Restaurant(
        id=rest_id,
        site_id=payload.site_id,
        name=payload.name.strip(),
        cuisine=payload.cuisine,
        specialty_dishes=list(payload.specialty_dishes or []),
        rating=payload.rating,
        review_count=payload.review_count,
        price_range=payload.price_range,
        lat=payload.lat,
        lng=payload.lng,
        address=payload.address,
        open_hours=payload.open_hours,
        meal_slots=list(payload.meal_slots or ["lunch", "dinner"]),
        image_url=payload.image_url,
    )
    db.add(restaurant)
    await db.flush()
    await _reindex_site_knowledge_chunks(db, payload.site_id)
    await db.commit()
    await db.refresh(restaurant)
    return _serialize_restaurant(restaurant, site.lat, site.lng)


@router.put(
    "/restaurants/{restaurant_id}",
    response_model=RestaurantOut,
    summary="[Admin] Cập nhật thông tin quán ăn & cập nhật RAG chunks",
)
async def update_restaurant(
    restaurant_id: str,
    payload: RestaurantUpdateRequest,
    _admin: Profile = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> RestaurantOut:
    """Update an existing nearby restaurant and refresh its site's RAG chunks."""
    restaurant = await db.get(Restaurant, restaurant_id)
    if restaurant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy quán ăn với mã '{restaurant_id}'.",
        )

    old_site_id = restaurant.site_id
    update_data = payload.model_dump(exclude_unset=True)
    if "site_id" in update_data and update_data["site_id"] is not None:
        target_site = await db.get(HeritageSite, update_data["site_id"])
        if target_site is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy di tích cha '{update_data['site_id']}'.",
            )

    for field, value in update_data.items():
        setattr(restaurant, field, value)

    db.add(restaurant)
    await db.flush()
    await _reindex_site_knowledge_chunks(db, restaurant.site_id)
    if old_site_id != restaurant.site_id:
        await _reindex_site_knowledge_chunks(db, old_site_id)
    await db.commit()
    await db.refresh(restaurant)

    parent_site = await db.get(HeritageSite, restaurant.site_id)
    ref_lat = parent_site.lat if parent_site else None
    ref_lng = parent_site.lng if parent_site else None
    return _serialize_restaurant(restaurant, ref_lat, ref_lng)


@router.delete(
    "/restaurants/{restaurant_id}",
    summary="[Admin] Xóa quán ăn khỏi di tích & cập nhật RAG chunks",
)
async def delete_restaurant(
    restaurant_id: str,
    _admin: Profile = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    """Delete a restaurant and refresh its parent site's RAG chunks."""
    restaurant = await db.get(Restaurant, restaurant_id)
    if restaurant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy quán ăn với mã '{restaurant_id}'.",
        )
    site_id = restaurant.site_id
    await db.delete(restaurant)
    await db.flush()
    await _reindex_site_knowledge_chunks(db, site_id)
    await db.commit()
    return {"deleted": True, "restaurant_id": restaurant_id}
