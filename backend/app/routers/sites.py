"""Heritage sites & nearby restaurants query router (`/api/v1/sites/*`)."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.entities import HeritageSite, Restaurant
from app.schemas.dto import (
    HeritageSiteListResponse,
    HeritageSiteOut,
    RestaurantOut,
    SupportedLanguage,
)
from app.services.geo_service import (
    filter_and_sort_by_distance,
    haversine_meters,
    query_site_distances_postgis,
)

router = APIRouter(prefix="/sites", tags=["Heritage Sites"])


def _serialize_restaurant(
    restaurant: Restaurant,
    ref_lat: Optional[float] = None,
    ref_lng: Optional[float] = None,
) -> RestaurantOut:
    dist: Optional[float] = None
    if ref_lat is not None and ref_lng is not None:
        dist = round(haversine_meters(ref_lat, ref_lng, restaurant.lat, restaurant.lng), 2)
    return RestaurantOut(
        id=restaurant.id,
        site_id=restaurant.site_id,
        name=restaurant.name,
        cuisine=restaurant.cuisine,
        specialty_dishes=list(restaurant.specialty_dishes or []),
        rating=float(restaurant.rating),
        review_count=int(restaurant.review_count),
        price_range=restaurant.price_range,
        lat=float(restaurant.lat),
        lng=float(restaurant.lng),
        address=restaurant.address,
        open_hours=restaurant.open_hours,
        meal_slots=list(restaurant.meal_slots or []),
        image_url=restaurant.image_url,
        distance_meters=dist,
    )


def _serialize_site(
    site: HeritageSite,
    distance_meters: Optional[float] = None,
) -> HeritageSiteOut:
    nearby = [
        _serialize_restaurant(r, site.lat, site.lng)
        for r in (site.restaurants or [])
    ]
    nearby.sort(key=lambda r: (-r.rating, r.distance_meters or 0.0))
    return HeritageSiteOut(
        id=site.id,
        city=site.city,
        district=site.district,
        lat=float(site.lat),
        lng=float(site.lng),
        category=site.category,
        unesco_recognized=bool(site.unesco_recognized),
        national_special_monument=bool(site.national_special_monument),
        rating=float(site.rating),
        review_count=int(site.review_count),
        ticket_price=site.ticket_price,
        address=site.address,
        cover_image=site.cover_image,
        recommended_visit_minutes=int(site.recommended_visit_minutes),
        translations=dict(site.translations or {}),
        media_gallery=list(site.media_gallery or []),
        nearby_restaurants=nearby,
        distance_meters=distance_meters,
        updated_at=site.updated_at,
    )


def _matches_query(site: HeritageSite, query_text: str, lang: str) -> bool:
    needle = query_text.strip().lower()
    if not needle:
        return True

    parts = [
        site.id or "",
        site.city or "",
        site.district or "",
        site.address or "",
        site.category or "",
    ]
    translations = site.translations or {}
    # Prioritize requested language, also search across all languages for convenience
    for code in [lang, *[k for k in translations.keys() if k != lang]]:
        loc = translations.get(code)
        if isinstance(loc, dict):
            parts.append(str(loc.get("name") or ""))
            parts.append(str(loc.get("shortSummary") or ""))
            parts.append(str(loc.get("historicalEra") or ""))

    haystack = " ".join(parts).lower()
    return needle in haystack


@router.get(
    "",
    response_model=HeritageSiteListResponse,
    summary="Danh sách di tích TP.HCM hỗ trợ lọc không gian (PostGIS/Haversine), danh mục & tìm kiếm",
)
async def list_sites(
    lat: Optional[float] = Query(default=None, ge=-90.0, le=90.0),
    lng: Optional[float] = Query(default=None, ge=-180.0, le=180.0),
    radius_m: Optional[float] = Query(default=None, gt=0.0),
    category: Optional[str] = Query(default=None),
    district: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None, description="Từ khóa tìm kiếm tên, mô tả, quận"),
    lang: SupportedLanguage = Query(default="vi"),
    db: AsyncSession = Depends(get_db),
) -> HeritageSiteListResponse:
    """List heritage sites with spatial filtering, category/district filtering, and keyword search."""
    stmt = select(HeritageSite).options(selectinload(HeritageSite.restaurants))
    if category:
        stmt = stmt.where(HeritageSite.category == category.strip())

    sites = list((await db.execute(stmt)).scalars().all())

    if district:
        dist_needle = district.strip().lower()
        sites = [
            s
            for s in sites
            if dist_needle in f"{s.district or ''} {s.city or ''}".lower()
        ]

    if q:
        sites = [s for s in sites if _matches_query(s, q, lang)]

    items: list[HeritageSiteOut] = []
    if lat is not None and lng is not None:
        postgis_dists = await query_site_distances_postgis(db, lat, lng, radius_m)
        ranked = filter_and_sort_by_distance(
            sites,
            lat=lat,
            lng=lng,
            radius_m=radius_m,
            postgis_distances=postgis_dists,
        )
        items = [_serialize_site(site, distance_meters=dist) for site, dist in ranked]  # type: ignore[arg-type]
    else:
        sites.sort(key=lambda s: (-float(s.rating), -int(s.review_count), s.id))
        items = [_serialize_site(site) for site in sites]

    return HeritageSiteListResponse(total=len(items), items=items)


@router.get(
    "/{site_id}",
    response_model=HeritageSiteOut,
    summary="Chi tiết 1 di tích lịch sử cùng tư liệu media & quán ăn gần đó",
)
async def get_site_detail(
    site_id: str,
    lat: Optional[float] = Query(default=None, ge=-90.0, le=90.0),
    lng: Optional[float] = Query(default=None, ge=-180.0, le=180.0),
    db: AsyncSession = Depends(get_db),
) -> HeritageSiteOut:
    """Return full details for a single heritage site including its nearby restaurants."""
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
    distance_m: Optional[float] = None
    if lat is not None and lng is not None:
        distance_m = round(haversine_meters(lat, lng, site.lat, site.lng), 2)
    return _serialize_site(site, distance_meters=distance_m)


@router.get(
    "/{site_id}/restaurants",
    response_model=list[RestaurantOut],
    summary="Danh sách quán ăn đặc sản gần di tích (lọc theo min_rating & meal_slot)",
)
async def list_site_restaurants(
    site_id: str,
    min_rating: Optional[float] = Query(default=None, ge=0.0, le=5.0),
    meal_slot: Optional[str] = Query(
        default=None,
        description="Khung giờ ăn: breakfast | lunch | dinner | cafe",
    ),
    lat: Optional[float] = Query(default=None, ge=-90.0, le=90.0),
    lng: Optional[float] = Query(default=None, ge=-180.0, le=180.0),
    db: AsyncSession = Depends(get_db),
) -> list[RestaurantOut]:
    """Return nearby restaurants for a heritage site filtered by rating and meal slot."""
    site = (await db.execute(select(HeritageSite).where(HeritageSite.id == site_id))).scalar_one_or_none()
    if site is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy di tích với mã '{site_id}'.",
        )

    stmt = select(Restaurant).where(Restaurant.site_id == site_id)
    if min_rating is not None:
        stmt = stmt.where(Restaurant.rating >= min_rating)

    restaurants = list((await db.execute(stmt)).scalars().all())
    if meal_slot:
        slot_needle = meal_slot.strip().lower()
        restaurants = [
            r
            for r in restaurants
            if slot_needle in [str(slot).lower() for slot in (r.meal_slots or [])]
        ]

    ref_lat = lat if lat is not None else site.lat
    ref_lng = lng if lng is not None else site.lng
    out = [_serialize_restaurant(r, ref_lat, ref_lng) for r in restaurants]
    out.sort(key=lambda r: (-r.rating, r.distance_meters or 0.0))
    return out
