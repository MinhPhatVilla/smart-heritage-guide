"""Explainable Context-Aware Recommendation Engine & 2-Opt Smart Walking Tour Planner.

Pillar 1 of Smart Heritage Guide:
1. Multi-criteria explainable scoring:
     S(i) = 0.30*S_dist + 0.25*S_novelty + 0.20*S_category + 0.15*S_rating + 0.10*S_status
   producing ranked heritage sites, nearby restaurants, and localized human-readable `reasons[]`
   in `vi | en | fr | zh | ja`.
2. Time-constrained Smart Walking Tour Planner (`plan_walking_tour`):
   - Value-density greedy selection respecting `available_minutes`
   - Nearest-Neighbor initialization + 2-Opt Local Search minimizing walking distance
   - Automatic meal-stop insertion for Breakfast (06:00-10:00), Lunch (11:00-14:00),
     and Dinner (17:30-21:00) using highest-rated matching `meal_slots` restaurant nearby.
"""

from __future__ import annotations

import math
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable, Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.entities import HeritageSite, Profile, Restaurant, VisitedJourney
from app.schemas.dto import (
    RecommendationRequest,
    RecommendationResponse,
    RecommendedSiteItem,
    RestaurantOut,
    ScoreBreakdown,
    SupportedLanguage,
    TourPlanRequest,
    TourPlanResponse,
    TourStopItem,
)
from app.services.geo_service import (
    estimate_walking_minutes,
    filter_and_sort_by_distance,
    haversine_meters,
    query_site_distances_postgis,
)

# Scoring weights (sum = 1.00)
WEIGHT_DISTANCE = 0.30
WEIGHT_NOVELTY = 0.25
WEIGHT_CATEGORY = 0.20
WEIGHT_RATING = 0.15
WEIGHT_STATUS = 0.10

# Distance decay radius (meters)
DISTANCE_DECAY_RADIUS_M = 3000.0

# Bayesian rating prior
BAYESIAN_PRIOR_MEAN = 4.5
BAYESIAN_PRIOR_WEIGHT = 50.0

# Meal windows in fractional hours [start_hour, end_hour]
MEAL_WINDOWS: list[tuple[str, float, float]] = [
    ("breakfast", 6.0, 10.0),
    ("lunch", 11.0, 14.0),
    ("dinner", 17.5, 21.0),
]
DEFAULT_MEAL_STAY_MINUTES = 35
MIN_MEAL_STAY_MINUTES = 20

CATEGORY_LABELS: dict[str, dict[str, str]] = {
    "imperial": {
        "vi": "Di tích Lịch sử / Dinh thự",
        "en": "Imperial & Historic Palace",
        "fr": "Palais historique",
        "zh": "历史宫殿",
        "ja": "歴史的宮殿",
    },
    "temple": {
        "vi": "Chùa / Miếu / Nhà thờ",
        "en": "Temple & Religious Site",
        "fr": "Temple et édifice religieux",
        "zh": "寺庙与宗教建筑",
        "ja": "寺院・宗教建築",
    },
    "museum": {
        "vi": "Bảo tàng",
        "en": "Museum",
        "fr": "Musée",
        "zh": "博物馆",
        "ja": "博物館",
    },
    "monument": {
        "vi": "Tượng đài / Kiến trúc biểu tượng",
        "en": "Monument & Landmark",
        "fr": "Monument emblématique",
        "zh": "地标纪念建筑",
        "ja": "記念碑・ランドマーク",
    },
    "ancient_town": {
        "vi": "Phố cổ / Khu di sản",
        "en": "Historic Quarter",
        "fr": "Quartier historique",
        "zh": "历史古街区",
        "ja": "歴史地区",
    },
}

MEAL_SLOT_LABELS: dict[str, dict[str, str]] = {
    "breakfast": {
        "vi": "bữa sáng",
        "en": "breakfast",
        "fr": "petit-déjeuner",
        "zh": "早餐",
        "ja": "朝食",
    },
    "lunch": {
        "vi": "bữa trưa",
        "en": "lunch",
        "fr": "déjeuner",
        "zh": "午餐",
        "ja": "昼食",
    },
    "dinner": {
        "vi": "bữa tối",
        "en": "dinner",
        "fr": "dîner",
        "zh": "晚餐",
        "ja": "夕食",
    },
}


def get_localized_site_field(
    site: Any,
    language: str,
    field: str,
    default: Any = "",
) -> Any:
    """Safely extract a localized field from `site.translations` with `vi`/`en` fallback."""
    translations = getattr(site, "translations", None) or {}
    for lang_key in (language, "vi", "en"):
        entry = translations.get(lang_key)
        if isinstance(entry, dict) and entry.get(field) not in (None, "", []):
            return entry[field]
    return default


def get_localized_site_name(site: Any, language: str = "vi") -> str:
    return str(get_localized_site_field(site, language, "name", getattr(site, "id", "Heritage Site")))


def is_site_open_at_hour(opening_hours: str, hour: float) -> bool:
    """Parse common opening-hours strings (e.g. '07:30 - 17:00', '07:30–11:00, 13:00–16:00', '24/7')."""
    if not opening_hours:
        return True
    lower = opening_hours.lower()
    if any(token in lower for token in ("24/7", "24h", "cả ngày", "all day", "toujours", "全天", "終日")):
        return True

    ranges = re.findall(r"(\d{1,2})[:h](\d{2})\s*[-–—~]\s*(\d{1,2})[:h](\d{2})", opening_hours)
    if not ranges:
        # Assume standard daytime heritage hours (07:30 - 17:30) if unparseable
        return 7.5 <= hour <= 17.5

    for h1, m1, h2, m2 in ranges:
        start = int(h1) + int(m1) / 60.0
        end = int(h2) + int(m2) / 60.0
        if end < start:
            # Overnight range
            if hour >= start or hour <= end:
                return True
        elif start <= hour <= end:
            return True
    return False


def _format_distance(distance_m: float, lang: str) -> str:
    if distance_m < 1000:
        return f"{int(round(distance_m))}m"
    km = distance_m / 1000.0
    if lang == "fr":
        return f"{km:.1f} km".replace(".", ",")
    return f"{km:.1f} km"


def _build_site_reasons(
    *,
    site: Any,
    distance_m: float,
    walk_minutes: int,
    is_unvisited: bool,
    category_matched: bool,
    category_inferred: bool,
    is_open: bool,
    language: SupportedLanguage,
) -> list[str]:
    reasons: list[str] = []
    dist_str = _format_distance(distance_m, language)
    cat_label = CATEGORY_LABELS.get(getattr(site, "category", ""), {}).get(
        language, getattr(site, "category", "")
    )
    rating = float(getattr(site, "rating", 4.5))
    unesco = bool(getattr(site, "unesco_recognized", False))
    national = bool(getattr(site, "national_special_monument", False))

    # 1. Distance reason
    if distance_m <= 600:
        reasons.append(
            {
                "vi": f"Cách bạn chỉ {dist_str} (đi bộ ~{walk_minutes} phút)",
                "en": f"Only {dist_str} away (~{walk_minutes} min walk)",
                "fr": f"À seulement {dist_str} (~{walk_minutes} min à pied)",
                "zh": f"距离您仅 {dist_str}（步行约 {walk_minutes} 分钟）",
                "ja": f"現在地からわずか {dist_str}（徒歩約 {walk_minutes} 分）",
            }[language]
        )
    elif distance_m <= 2500:
        reasons.append(
            {
                "vi": f"Gần vị trí hiện tại ({dist_str}, ~{walk_minutes} phút đi bộ)",
                "en": f"Close to your location ({dist_str}, ~{walk_minutes} min walk)",
                "fr": f"Proche de votre position ({dist_str}, ~{walk_minutes} min à pied)",
                "zh": f"靠近当前位置（{dist_str}，步行约 {walk_minutes} 分钟）",
                "ja": f"現在地から近い立地（{dist_str}、徒歩約 {walk_minutes} 分）",
            }[language]
        )

    # 2. Novelty reason
    if is_unvisited:
        reasons.append(
            {
                "vi": "Bạn chưa ghé thăm di tích này",
                "en": "New heritage site you haven't visited yet",
                "fr": "Nouveau site patrimonial que vous n'avez pas encore visité",
                "zh": "您尚未造访的新景点",
                "ja": "まだ訪れていない新しい歴史スポット",
            }[language]
        )

    # 3. Category match reason
    if category_matched:
        reasons.append(
            {
                "vi": f"Phù hợp sở thích {cat_label}",
                "en": f"Matches your interest in {cat_label}",
                "fr": f"Correspond à votre intérêt : {cat_label}",
                "zh": f"符合您的兴趣偏好：{cat_label}",
                "ja": f"お好みのジャンル「{cat_label}」に一致",
            }[language]
        )
    elif category_inferred:
        reasons.append(
            {
                "vi": f"Cùng chủ đề {cat_label} bạn thường khám phá",
                "en": f"Matches {cat_label} from your visit history",
                "fr": f"Similaire aux sites ({cat_label}) que vous appréciez",
                "zh": f"与您历史偏好主题「{cat_label}」一致",
                "ja": f"これまでの訪問履歴（{cat_label}）に合致",
            }[language]
        )

    # 4. Recognition status reason
    if unesco:
        reasons.append(
            {
                "vi": "Di sản được UNESCO công nhận",
                "en": "UNESCO-recognized heritage",
                "fr": "Patrimoine reconnu par l'UNESCO",
                "zh": "联合国教科文组织认证遗产",
                "ja": "ユネスコ認定遺産",
            }[language]
        )
    elif national:
        reasons.append(
            {
                "vi": "Di tích Quốc gia Đặc biệt nổi bật",
                "en": "National Special Monument",
                "fr": "Monument National Spécial",
                "zh": "国家级特别历史遗迹",
                "ja": "国家特別記念物",
            }[language]
        )

    # 5. High rating reason
    if rating >= 4.7 and len(reasons) < 4:
        reasons.append(
            {
                "vi": f"Được du khách đánh giá cao ({rating:.1f}★)",
                "en": f"Highly rated by visitors ({rating:.1f}★)",
                "fr": f"Très bien noté par les visiteurs ({rating:.1f}★)",
                "zh": f"游客高分好评（{rating:.1f}★）",
                "ja": f"訪問者から高評価（{rating:.1f}★）",
            }[language]
        )

    # 6. Opening hours reason
    if is_open and len(reasons) < 4:
        reasons.append(
            {
                "vi": "Đang mở cửa phù hợp khung giờ hiện tại",
                "en": "Open during your planned time window",
                "fr": "Ouvert sur le créneau horaire actuel",
                "zh": "当前时段正常开放",
                "ja": "現在の時間帯に見学可能",
            }[language]
        )

    if not reasons:
        reasons.append(
            {
                "vi": f"Điểm đến tiêu biểu tại {getattr(site, 'city', 'TP.HCM')}",
                "en": f"Featured heritage destination in {getattr(site, 'city', 'HCMC')}",
                "fr": f"Site incontournable à {getattr(site, 'city', 'Hô Chi Minh-Ville')}",
                "zh": f"{getattr(site, 'city', '胡志明市')}精选历史地标",
                "ja": f"{getattr(site, 'city', 'ホーチミン市')}の定番歴史スポット",
            }[language]
        )

    return reasons[:4]


def _restaurant_to_out(rest: Any, distance_m: Optional[float] = None) -> RestaurantOut:
    return RestaurantOut(
        id=str(getattr(rest, "id")),
        site_id=str(getattr(rest, "site_id")),
        name=str(getattr(rest, "name")),
        cuisine=str(getattr(rest, "cuisine", "")),
        specialty_dishes=list(getattr(rest, "specialty_dishes", []) or []),
        rating=float(getattr(rest, "rating", 4.5)),
        review_count=int(getattr(rest, "review_count", 0)),
        price_range=str(getattr(rest, "price_range", "")),
        lat=float(getattr(rest, "lat")),
        lng=float(getattr(rest, "lng")),
        address=str(getattr(rest, "address", "")),
        open_hours=str(getattr(rest, "open_hours", "07:00 – 21:00")),
        meal_slots=list(getattr(rest, "meal_slots", []) or []),
        image_url=str(getattr(rest, "image_url", "")),
        distance_meters=round(distance_m, 2) if distance_m is not None else None,
    )


def score_heritage_site(
    site: Any,
    *,
    distance_meters: float,
    visited_site_ids: set[str],
    preferred_categories: set[str],
    inferred_categories: set[str],
    current_hour: float,
    language: SupportedLanguage = "vi",
    nearest_restaurant: Optional[RestaurantOut] = None,
) -> RecommendedSiteItem:
    """Compute explainable context-aware score S(i) in [0, 1] for a single heritage site."""
    # 1. Distance decay S_dist = exp(-d / R)
    s_dist = math.exp(-max(0.0, distance_meters) / DISTANCE_DECAY_RADIUS_M)

    # 2. Novelty S_novelty
    is_unvisited = getattr(site, "id") not in visited_site_ids
    s_novelty = 1.0 if is_unvisited else 0.25

    # 3. Category preference S_category
    site_category = str(getattr(site, "category", ""))
    category_matched = bool(preferred_categories and site_category in preferred_categories)
    category_inferred = bool(
        not preferred_categories and inferred_categories and site_category in inferred_categories
    )
    if preferred_categories:
        s_category = 1.0 if category_matched else 0.35
    elif inferred_categories:
        s_category = 0.90 if category_inferred else 0.50
    else:
        s_category = 0.65

    # 4. Bayesian rating S_rating
    raw_rating = float(getattr(site, "rating", 4.5))
    reviews = max(0, int(getattr(site, "review_count", 0)))
    bayesian_rating = (
        BAYESIAN_PRIOR_WEIGHT * BAYESIAN_PRIOR_MEAN + reviews * raw_rating
    ) / (BAYESIAN_PRIOR_WEIGHT + reviews)
    s_rating = max(0.0, min(1.0, (bayesian_rating - 3.0) / 2.0))

    # 5. Status & Opening Hours S_status
    opening_hours = str(get_localized_site_field(site, language, "openingHours", ""))
    is_open = is_site_open_at_hour(opening_hours, current_hour)
    s_status = 0.40
    if getattr(site, "unesco_recognized", False):
        s_status += 0.35
    elif getattr(site, "national_special_monument", False):
        s_status += 0.30
    if is_open:
        s_status += 0.25
    s_status = max(0.0, min(1.0, s_status))

    total_score = (
        WEIGHT_DISTANCE * s_dist
        + WEIGHT_NOVELTY * s_novelty
        + WEIGHT_CATEGORY * s_category
        + WEIGHT_RATING * s_rating
        + WEIGHT_STATUS * s_status
    )
    total_score = round(max(0.0, min(1.0, total_score)), 4)

    walk_minutes = estimate_walking_minutes(distance_meters)
    reasons = _build_site_reasons(
        site=site,
        distance_m=distance_meters,
        walk_minutes=walk_minutes,
        is_unvisited=is_unvisited,
        category_matched=category_matched,
        category_inferred=category_inferred,
        is_open=is_open,
        language=language,
    )

    return RecommendedSiteItem(
        site_id=str(getattr(site, "id")),
        site_name=get_localized_site_name(site, language),
        city=str(getattr(site, "city", "")),
        district=getattr(site, "district", None),
        category=site_category,
        lat=float(getattr(site, "lat")),
        lng=float(getattr(site, "lng")),
        cover_image=str(getattr(site, "cover_image", "")),
        rating=raw_rating,
        review_count=reviews,
        distance_meters=round(distance_meters, 2),
        estimated_walk_minutes=walk_minutes,
        recommended_visit_minutes=int(getattr(site, "recommended_visit_minutes", 45) or 45),
        score=total_score,
        score_breakdown=ScoreBreakdown(
            distance_score=round(s_dist, 4),
            novelty_score=round(s_novelty, 4),
            category_score=round(s_category, 4),
            rating_score=round(s_rating, 4),
            status_score=round(s_status, 4),
        ),
        reasons=reasons,
        nearest_restaurant=nearest_restaurant,
    )


def rank_heritage_sites(
    sites: Sequence[Any],
    restaurants: Sequence[Any],
    *,
    lat: float,
    lng: float,
    language: SupportedLanguage = "vi",
    preferred_categories: Sequence[str] = (),
    visited_site_ids: Sequence[str] = (),
    max_results: int = 6,
    current_hour: Optional[float] = None,
    radius_m: Optional[float] = None,
    postgis_distances: Optional[dict[str, float]] = None,
) -> RecommendationResponse:
    """Pure-Python ranking & explanation pipeline operating over loaded sites & restaurants."""
    if current_hour is None:
        # Default to Vietnam local hour (UTC+7)
        vn_now = datetime.now(timezone(timedelta(hours=7)))
        hour_val = vn_now.hour + vn_now.minute / 60.0
    else:
        hour_val = float(current_hour)

    visited_set = set(visited_site_ids)
    pref_set = set(preferred_categories)

    # Infer preferred categories from visited history if explicit preferences are empty
    inferred_cats: set[str] = set()
    if not pref_set and visited_set:
        for site in sites:
            if getattr(site, "id") in visited_set:
                inferred_cats.add(str(getattr(site, "category", "")))

    # Group restaurants by site_id
    rests_by_site: dict[str, list[Any]] = {}
    for rest in restaurants:
        sid = str(getattr(rest, "site_id", ""))
        rests_by_site.setdefault(sid, []).append(rest)

    # Distance calculation & optional radius filter
    site_dist_pairs = filter_and_sort_by_distance(
        sites,
        lat=lat,
        lng=lng,
        radius_m=radius_m,
        postgis_distances=postgis_distances,
    )

    scored_items: list[RecommendedSiteItem] = []
    for site, dist_m in site_dist_pairs:
        sid = str(getattr(site, "id"))
        site_rests = rests_by_site.get(sid, [])
        nearest_rest_out: Optional[RestaurantOut] = None
        if site_rests:
            best_rest = min(
                site_rests,
                key=lambda r: (
                    haversine_meters(float(getattr(site, "lat")), float(getattr(site, "lng")), float(r.lat), float(r.lng))
                    - float(getattr(r, "rating", 4.5)) * 60.0
                ),
            )
            r_dist = haversine_meters(lat, lng, float(best_rest.lat), float(best_rest.lng))
            nearest_rest_out = _restaurant_to_out(best_rest, r_dist)

        item = score_heritage_site(
            site,
            distance_meters=dist_m,
            visited_site_ids=visited_set,
            preferred_categories=pref_set,
            inferred_categories=inferred_cats,
            current_hour=hour_val,
            language=language,
            nearest_restaurant=nearest_rest_out,
        )
        scored_items.append(item)

    scored_items.sort(key=lambda x: (-x.score, x.distance_meters))
    top_items = scored_items[:max_results]

    # Recommend top nearby restaurants tied to top recommended sites or close to origin
    top_site_ids = {item.site_id for item in top_items}
    candidate_rests: list[tuple[float, RestaurantOut]] = []
    seen_rest_ids: set[str] = set()
    for rest in restaurants:
        rid = str(getattr(rest, "id"))
        if rid in seen_rest_ids:
            continue
        r_dist = haversine_meters(lat, lng, float(rest.lat), float(rest.lng))
        if getattr(rest, "site_id") in top_site_ids or r_dist <= 2000.0:
            seen_rest_ids.add(rid)
            r_score = float(getattr(rest, "rating", 4.5)) * 0.65 + math.exp(-r_dist / 2000.0) * 1.5
            candidate_rests.append((r_score, _restaurant_to_out(rest, r_dist)))
    candidate_rests.sort(key=lambda pair: -pair[0])
    recommended_restaurants = [pair[1] for pair in candidate_rests[:5]]

    context_summary = _build_recommendation_summary(
        count=len(top_items),
        preferred_categories=list(pref_set),
        hour_val=hour_val,
        language=language,
    )

    return RecommendationResponse(
        items=top_items,
        recommended_restaurants=recommended_restaurants,
        context_summary=context_summary,
    )


def _build_recommendation_summary(
    *,
    count: int,
    preferred_categories: list[str],
    hour_val: float,
    language: SupportedLanguage,
) -> str:
    hh = int(hour_val) % 24
    mm = int(round((hour_val - int(hour_val)) * 60)) % 60
    time_str = f"{hh:02d}:{mm:02d}"
    if preferred_categories:
        cats = ", ".join(
            CATEGORY_LABELS.get(c, {}).get(language, c) for c in preferred_categories
        )
        return {
            "vi": f"Đã xếp hạng {count} di tích phù hợp nhất lúc {time_str} ưu tiên nhóm {cats}.",
            "en": f"Ranked {count} top heritage sites for {time_str}, prioritizing {cats}.",
            "fr": f"Classement des {count} meilleurs sites à {time_str} selon vos thèmes ({cats}).",
            "zh": f"已根据 {time_str} 与偏好类型（{cats}）为您智能推荐 {count} 个景点。",
            "ja": f"{time_str} 時点で好みのジャンル（{cats}）を優先し {count} 件を推薦しました。",
        }[language]

    return {
        "vi": f"Đã chấm điểm ngữ cảnh {count} di tích gần bạn nhất lúc {time_str} (ưu tiên điểm chưa đi & đang mở cửa).",
        "en": f"Context-scored {count} nearby heritage sites for {time_str} (prioritizing unvisited & open sites).",
        "fr": f"Sélection contextuelle de {count} sites proches à {time_str} (priorité aux sites non visités et ouverts).",
        "zh": f"已结合 {time_str} 的位置与开放状态智能排序 {count} 个附近遗产景点。",
        "ja": f"{time_str} の現在地と開館状況に基づき {count} 件のスポットをランキングしました。",
    }[language]


# ---------------------------------------------------------------------------
# Smart Walking Tour Planner: Nearest-Neighbor + 2-Opt Local Search + Meal Stop
# ---------------------------------------------------------------------------
def _open_path_distance(origin: tuple[float, float], ordered_points: Sequence[tuple[float, float]]) -> float:
    """Total open walking path distance from fixed origin through ordered stops."""
    if not ordered_points:
        return 0.0
    total = haversine_meters(origin[0], origin[1], ordered_points[0][0], ordered_points[0][1])
    for idx in range(1, len(ordered_points)):
        total += haversine_meters(
            ordered_points[idx - 1][0],
            ordered_points[idx - 1][1],
            ordered_points[idx][0],
            ordered_points[idx][1],
        )
    return total


def nearest_neighbor_order(
    origin: tuple[float, float],
    items: Sequence[Any],
) -> list[Any]:
    """Build an initial open walking tour ordering via Greedy Nearest-Neighbor from `origin`."""
    remaining = list(items)
    ordered: list[Any] = []
    curr_lat, curr_lng = origin
    while remaining:
        best_idx = min(
            range(len(remaining)),
            key=lambda i: haversine_meters(
                curr_lat, curr_lng, float(remaining[i].lat), float(remaining[i].lng)
            ),
        )
        chosen = remaining.pop(best_idx)
        ordered.append(chosen)
        curr_lat, curr_lng = float(chosen.lat), float(chosen.lng)
    return ordered


def two_opt_optimize(
    origin: tuple[float, float],
    ordered_items: Sequence[Any],
    max_iterations: int = 200,
) -> tuple[list[Any], float]:
    """Improve an open walking tour ordering using iterative 2-Opt Local Search.

    Reverses sub-segments `route[i : j+1]` whenever doing so strictly reduces the total
    open-path distance from `origin` through every stop.
    """
    route = list(ordered_items)
    n = len(route)
    if n <= 1:
        pts = [(float(x.lat), float(x.lng)) for x in route]
        return route, round(_open_path_distance(origin, pts), 2)

    def _dist(seq: Sequence[Any]) -> float:
        return _open_path_distance(origin, [(float(x.lat), float(x.lng)) for x in seq])

    best_distance = _dist(route)
    improved = True
    iterations = 0

    while improved and iterations < max_iterations:
        improved = False
        iterations += 1
        for i in range(0, n - 1):
            for j in range(i + 1, n):
                candidate = route[:i] + list(reversed(route[i : j + 1])) + route[j + 1 :]
                cand_dist = _dist(candidate)
                if cand_dist + 1e-6 < best_distance:
                    route = candidate
                    best_distance = cand_dist
                    improved = True
                    break
            if improved:
                break

    return route, round(best_distance, 2)


def _detect_overlapping_meal_slot(start_min: float, end_min: float) -> Optional[str]:
    """Return the first meal slot (`breakfast` | `lunch` | `dinner`) overlapping [start_min, end_min]."""
    start_h = start_min / 60.0
    end_h = end_min / 60.0
    for slot, win_start, win_end in MEAL_WINDOWS:
        if start_h <= win_end and end_h >= win_start:
            return slot
    return None


def _hour_in_meal_slot(hour_val: float) -> Optional[str]:
    for slot, win_start, win_end in MEAL_WINDOWS:
        if win_start <= hour_val <= win_end:
            return slot
    return None


def _restaurant_matches_slot(rest: Any, meal_slot: str) -> bool:
    slots = [str(s).lower() for s in (getattr(rest, "meal_slots", None) or [])]
    if slots:
        return meal_slot in slots
    # Fallback heuristic from open_hours when meal_slots is unspecified
    open_hours = str(getattr(rest, "open_hours", ""))
    mid_hours = {"breakfast": 8.0, "lunch": 12.0, "dinner": 19.0}
    return is_site_open_at_hour(open_hours, mid_hours.get(meal_slot, 12.0))


def _format_clock(total_minutes: float) -> str:
    mins = int(round(total_minutes)) % (24 * 60)
    return f"{mins // 60:02d}:{mins % 60:02d}"


def _simulate_tour_minutes(
    origin: tuple[float, float],
    stops: Sequence[Any],
    stay_overrides: Optional[dict[str, int]] = None,
) -> tuple[int, int, float]:
    """Return `(total_walk_minutes, total_visit_minutes, total_walk_meters)` for a stop sequence."""
    curr_lat, curr_lng = origin
    walk_m_total = 0.0
    walk_min_total = 0
    visit_min_total = 0
    overrides = stay_overrides or {}
    for stop in stops:
        d = haversine_meters(curr_lat, curr_lng, float(stop.lat), float(stop.lng))
        walk_m_total += d
        walk_min_total += estimate_walking_minutes(d)
        sid = str(getattr(stop, "site_id", getattr(stop, "id", "")))
        visit_min_total += overrides.get(sid, int(getattr(stop, "recommended_visit_minutes", 45) or 45))
        curr_lat, curr_lng = float(stop.lat), float(stop.lng)
    return walk_min_total, visit_min_total, walk_m_total


def _pick_best_meal_restaurant(
    restaurants: Sequence[Any],
    *,
    anchor_site_id: str,
    anchor_lat: float,
    anchor_lng: float,
    meal_slot: str,
    max_distance_m: float = 1500.0,
) -> Optional[Any]:
    """Choose the highest-rated matching `meal_slots` restaurant near the anchor heritage stop."""
    matching: list[tuple[float, Any]] = []
    for rest in restaurants:
        if not _restaurant_matches_slot(rest, meal_slot):
            continue
        dist = haversine_meters(anchor_lat, anchor_lng, float(rest.lat), float(rest.lng))
        if dist > max_distance_m and getattr(rest, "site_id", None) != anchor_site_id:
            continue
        same_site_bonus = 0.35 if getattr(rest, "site_id", None) == anchor_site_id else 0.0
        # Prioritize high rating while keeping walking detour short
        rank_val = float(getattr(rest, "rating", 4.5)) + same_site_bonus - (dist / 1000.0) * 0.45
        matching.append((rank_val, rest))

    if not matching:
        return None
    matching.sort(key=lambda pair: -pair[0])
    return matching[0][1]


def build_walking_tour(
    sites: Sequence[Any],
    restaurants: Sequence[Any],
    req: TourPlanRequest,
    *,
    postgis_distances: Optional[dict[str, float]] = None,
) -> TourPlanResponse:
    """Pure-Python Smart Walking Tour Planner:
    1. Context-score all sites.
    2. Time-constrained greedy selection (`walking + visit <= available_minutes`).
    3. Nearest-Neighbor + 2-Opt Local Search optimization minimizing total walking distance.
    4. Automatic meal-stop insertion when overlapping Breakfast/Lunch/Dinner.
    """
    origin = (float(req.lat), float(req.lng))
    language: SupportedLanguage = req.language
    budget = int(req.available_minutes)
    start_min = float(req.start_hour * 60)

    # Step 1: Score all sites using Pillar 1 explainable scorer
    rec_resp = rank_heritage_sites(
        sites,
        restaurants,
        lat=req.lat,
        lng=req.lng,
        language=language,
        preferred_categories=req.preferred_categories,
        visited_site_ids=req.visited_site_ids,
        max_results=max(20, len(sites)),
        current_hour=float(req.start_hour),
        postgis_distances=postgis_distances,
    )
    scored_candidates = rec_resp.items

    if not scored_candidates:
        return TourPlanResponse(
            stops=[],
            total_sites=0,
            total_walking_meters=0.0,
            total_walking_minutes=0,
            total_visit_minutes=0,
            total_duration_minutes=0,
            distance_saved_meters=0.0,
            initial_distance_meters=0.0,
            optimized_distance_meters=0.0,
            optimization_method="nearest_neighbor_2opt",
            route_polyline=[[req.lat, req.lng]],
            meal_stop_included=False,
            summary=_build_tour_summary(0, 0, 0.0, 0.0, False, language),
        )

    # Check if meal stop is requested AND time window overlaps a meal window with matching restaurants
    overlap_slot = _detect_overlapping_meal_slot(start_min, start_min + budget)
    can_have_meal = (
        req.include_meal_stop
        and overlap_slot is not None
        and budget >= 75
        and any(_restaurant_matches_slot(r, overlap_slot) for r in restaurants)
    )
    reserved_meal_budget = DEFAULT_MEAL_STAY_MINUTES + 6 if can_have_meal else 0
    heritage_budget = max(30, budget - reserved_meal_budget)

    # Step 2: Time-constrained greedy selection of highest-value nearby candidates
    selected: list[RecommendedSiteItem] = []
    remaining = list(scored_candidates)
    stay_overrides: dict[str, int] = {}

    curr_lat, curr_lng = origin
    used_minutes = 0

    while remaining and len(selected) < req.max_stops:
        best_choice: Optional[tuple[float, RecommendedSiteItem, int]] = None
        for cand in remaining:
            d = haversine_meters(curr_lat, curr_lng, cand.lat, cand.lng)
            w_min = estimate_walking_minutes(d)
            v_min = cand.recommended_visit_minutes
            step_cost = w_min + v_min
            if used_minutes + step_cost > heritage_budget:
                continue
            # Value-density utility balancing explainable score and time compactness
            utility = cand.score / ((max(10, step_cost) / 30.0) ** 0.45)
            if best_choice is None or utility > best_choice[0]:
                best_choice = (utility, cand, step_cost)

        if best_choice is None:
            break
        _, chosen, step_cost = best_choice
        selected.append(chosen)
        remaining.remove(chosen)
        used_minutes += step_cost
        curr_lat, curr_lng = chosen.lat, chosen.lng

    # If budget is very tight and nothing fit with default visit time (e.g. 30-40 min),
    # select the closest high-scoring site and cap its visit duration to fit strictly within budget.
    if not selected:
        closest = min(scored_candidates, key=lambda c: (c.estimated_walk_minutes, -c.score))
        walk_m = closest.distance_meters
        walk_min = estimate_walking_minutes(walk_m)
        if walk_min < budget:
            stay_overrides[closest.site_id] = max(10, min(closest.recommended_visit_minutes, budget - walk_min))
            selected.append(closest)

    # Step 3: Nearest-Neighbor initial tour + 2-Opt Local Search optimization
    score_ranked_order = sorted(selected, key=lambda x: -x.score)
    score_order_dist = round(
        _open_path_distance(origin, [(s.lat, s.lng) for s in score_ranked_order]), 2
    )

    nn_route = nearest_neighbor_order(origin, selected)
    nn_dist = round(_open_path_distance(origin, [(s.lat, s.lng) for s in nn_route]), 2)

    opt_route, opt_dist = two_opt_optimize(origin, nn_route)

    # Ensure optimized heritage route strictly fits within total `budget`
    while len(opt_route) > 1:
        w_min, v_min, _ = _simulate_tour_minutes(origin, opt_route, stay_overrides)
        if w_min + v_min <= budget:
            break
        opt_route.pop()
        opt_route, opt_dist = two_opt_optimize(origin, opt_route)

    # Recompute baseline initial distance for the final set of stops (score-ranked order vs optimized)
    final_ids = {s.site_id for s in opt_route}
    final_score_order = [s for s in score_ranked_order if s.site_id in final_ids]
    initial_dist = round(
        max(
            _open_path_distance(origin, [(s.lat, s.lng) for s in final_score_order]),
            nn_dist if len(final_ids) == len(selected) else opt_dist,
            opt_dist,
        ),
        2,
    )
    distance_saved = round(max(0.0, initial_dist - opt_dist), 2)

    # Step 4: Build stop timeline & optionally insert meal stop
    # Represent mixed stops as tuples: ("heritage", RecommendedSiteItem, stay_min) or ("meal", Restaurant, stay_min, meal_slot)
    mixed_plan: list[tuple[str, Any, int, Optional[str]]] = [
        ("heritage", s, stay_overrides.get(s.site_id, s.recommended_visit_minutes), None)
        for s in opt_route
    ]

    meal_included = False
    if req.include_meal_stop and mixed_plan and restaurants:
        # Walk timeline to find where the tour overlaps a meal window
        curr_clock = start_min
        prev_lat, prev_lng = origin
        insert_idx: Optional[int] = None
        chosen_slot: Optional[str] = None
        anchor_site: Optional[RecommendedSiteItem] = None

        for idx, (_, site_obj, stay_min, _) in enumerate(mixed_plan):
            leg_d = haversine_meters(prev_lat, prev_lng, site_obj.lat, site_obj.lng)
            arrival = curr_clock + estimate_walking_minutes(leg_d)
            departure = arrival + stay_min

            # Check if arrival or departure lands inside a meal window
            slot_here = _hour_in_meal_slot(departure / 60.0) or _hour_in_meal_slot(arrival / 60.0)
            if slot_here is None:
                slot_here = _detect_overlapping_meal_slot(arrival, departure)

            if slot_here is not None:
                insert_idx = idx + 1
                chosen_slot = slot_here
                anchor_site = site_obj
                break

            curr_clock = departure
            prev_lat, prev_lng = site_obj.lat, site_obj.lng

        if insert_idx is not None and chosen_slot is not None and anchor_site is not None:
            meal_rest = _pick_best_meal_restaurant(
                restaurants,
                anchor_site_id=anchor_site.site_id,
                anchor_lat=anchor_site.lat,
                anchor_lng=anchor_site.lng,
                meal_slot=chosen_slot,
            )
            if meal_rest is not None:
                # Try inserting meal stop while strictly respecting `budget`
                for meal_stay in (DEFAULT_MEAL_STAY_MINUTES, 25, MIN_MEAL_STAY_MINUTES):
                    trial_plan = (
                        mixed_plan[:insert_idx]
                        + [("meal", meal_rest, meal_stay, chosen_slot)]
                        + mixed_plan[insert_idx:]
                    )
                    trial_dur = _compute_mixed_plan_duration(origin, trial_plan)
                    if trial_dur <= budget:
                        mixed_plan = trial_plan
                        meal_included = True
                        break

    # Step 5: Emit structured TourStopItem list & polyline
    stops_out: list[TourStopItem] = []
    polyline: list[list[float]] = [[round(req.lat, 6), round(req.lng, 6)]]
    curr_clock = start_min
    prev_lat, prev_lng = origin
    total_walk_m = 0.0
    total_walk_min = 0
    total_visit_min = 0
    total_heritage_sites = 0

    for order_idx, (stop_type, obj, stay_min, slot_name) in enumerate(mixed_plan, start=1):
        stop_lat = float(obj.lat)
        stop_lng = float(obj.lng)
        leg_m = round(haversine_meters(prev_lat, prev_lng, stop_lat, stop_lng), 2)
        leg_min = estimate_walking_minutes(leg_m)

        arrival_min = curr_clock + leg_min
        departure_min = arrival_min + stay_min

        total_walk_m += leg_m
        total_walk_min += leg_min
        total_visit_min += stay_min
        polyline.append([round(stop_lat, 6), round(stop_lng, 6)])

        if stop_type == "heritage":
            total_heritage_sites += 1
            stops_out.append(
                TourStopItem(
                    order=order_idx,
                    stop_type="heritage",
                    site_id=obj.site_id,
                    name=obj.site_name,
                    category=obj.category,
                    lat=stop_lat,
                    lng=stop_lng,
                    cover_image=obj.cover_image,
                    arrival_time=_format_clock(arrival_min),
                    departure_time=_format_clock(departure_min),
                    stay_minutes=stay_min,
                    walk_from_prev_meters=leg_m,
                    walk_from_prev_minutes=leg_min,
                    score=obj.score,
                    reasons=obj.reasons,
                    meal_slot=None,
                    specialty_dishes=[],
                )
            )
        else:
            slot_label = MEAL_SLOT_LABELS.get(slot_name or "lunch", {}).get(language, slot_name or "lunch")
            meal_reason = {
                "vi": f"Tự động chèn điểm dừng {slot_label} đánh giá cao ({float(obj.rating):.1f}★) ngay gần lộ trình",
                "en": f"Auto-inserted top-rated {slot_label} stop ({float(obj.rating):.1f}★) along your route",
                "fr": f"Pause {slot_label} insérée automatiquement ({float(obj.rating):.1f}★) sur votre parcours",
                "zh": f"沿途自动安排高评分{slot_label}站点（{float(obj.rating):.1f}★）",
                "ja": f"ルート上の高評価{slot_label}スポット（{float(obj.rating):.1f}★）を自動組み込み",
            }[language]
            stops_out.append(
                TourStopItem(
                    order=order_idx,
                    stop_type="meal",
                    site_id=str(obj.id),
                    name=str(obj.name),
                    category=str(getattr(obj, "cuisine", "cuisine")),
                    lat=stop_lat,
                    lng=stop_lng,
                    cover_image=str(getattr(obj, "image_url", "")),
                    arrival_time=_format_clock(arrival_min),
                    departure_time=_format_clock(departure_min),
                    stay_minutes=stay_min,
                    walk_from_prev_meters=leg_m,
                    walk_from_prev_minutes=leg_min,
                    score=round(min(1.0, float(getattr(obj, "rating", 4.5)) / 5.0), 4),
                    reasons=[meal_reason],
                    meal_slot=slot_name,
                    specialty_dishes=list(getattr(obj, "specialty_dishes", []) or []),
                )
            )

        curr_clock = departure_min
        prev_lat, prev_lng = stop_lat, stop_lng

    total_walk_m = round(total_walk_m, 2)
    total_duration = total_walk_min + total_visit_min
    summary = _build_tour_summary(
        total_heritage_sites,
        total_duration,
        total_walk_m,
        distance_saved,
        meal_included,
        language,
    )

    return TourPlanResponse(
        stops=stops_out,
        total_sites=total_heritage_sites,
        total_walking_meters=total_walk_m,
        total_walking_minutes=total_walk_min,
        total_visit_minutes=total_visit_min,
        total_duration_minutes=total_duration,
        distance_saved_meters=distance_saved,
        initial_distance_meters=initial_dist,
        optimized_distance_meters=opt_dist,
        optimization_method="nearest_neighbor_2opt",
        route_polyline=polyline,
        meal_stop_included=meal_included,
        summary=summary,
    )


def _compute_mixed_plan_duration(
    origin: tuple[float, float],
    mixed_plan: Sequence[tuple[str, Any, int, Optional[str]]],
) -> int:
    prev_lat, prev_lng = origin
    total_min = 0
    for _, obj, stay_min, _ in mixed_plan:
        d = haversine_meters(prev_lat, prev_lng, float(obj.lat), float(obj.lng))
        total_min += estimate_walking_minutes(d) + stay_min
        prev_lat, prev_lng = float(obj.lat), float(obj.lng)
    return total_min


def _build_tour_summary(
    site_count: int,
    duration_min: int,
    walk_m: float,
    saved_m: float,
    meal_included: bool,
    language: SupportedLanguage,
) -> str:
    if site_count == 0:
        return {
            "vi": "Chưa tìm thấy điểm di tích phù hợp trong quỹ thời gian này.",
            "en": "No heritage stops fit within the requested time budget.",
            "fr": "Aucun site patrimonial ne correspond au temps disponible.",
            "zh": "在所选时间预算内未找到合适的遗产景点。",
            "ja": "指定された所要時間内に収まるスポットが見つかりませんでした。",
        }[language]

    dist_str = _format_distance(walk_m, language)
    saved_str = _format_distance(saved_m, language)
    if language == "vi":
        meal_txt = " (đã chèn điểm dừng ẩm thực)" if meal_included else ""
        save_txt = f", thuật toán 2-Opt giúp rút ngắn {saved_str}" if saved_m >= 10 else ""
        return f"Lịch trình {site_count} di tích trong {duration_min} phút{meal_txt} — tổng đi bộ {dist_str}{save_txt}."
    if language == "en":
        meal_txt = " including a curated meal stop" if meal_included else ""
        save_txt = f" (2-Opt saved {saved_str})" if saved_m >= 10 else ""
        return f"Optimized {site_count}-site walking tour ({duration_min} min{meal_txt}) — {dist_str} walking{save_txt}."
    if language == "fr":
        meal_txt = " avec pause gourmande" if meal_included else ""
        save_txt = f" (2-Opt économise {saved_str})" if saved_m >= 10 else ""
        return f"Circuit optimisé de {site_count} sites en {duration_min} min{meal_txt} — {dist_str} à pied{save_txt}."
    if language == "zh":
        meal_txt = "（含美食停靠站）" if meal_included else ""
        save_txt = f"，2-Opt 优化节省 {saved_str}" if saved_m >= 10 else ""
        return f"已规划 {site_count} 个景点的 {duration_min} 分钟步行路线{meal_txt}，总步行 {dist_str}{save_txt}。"
    meal_txt = "（グルメ休憩付き）" if meal_included else ""
    save_txt = f"（2-Optで {saved_str} 短縮）" if saved_m >= 10 else ""
    return f"{site_count} か所の歴史スポットを巡る {duration_min} 分の最適徒歩ルート{meal_txt}（徒歩 {dist_str}{save_txt}）。"


# ---------------------------------------------------------------------------
# Async DB-backed Service Entry Points
# ---------------------------------------------------------------------------
async def _load_sites_and_restaurants(
    db: AsyncSession,
) -> tuple[list[HeritageSite], list[Restaurant]]:
    sites_res = await db.execute(select(HeritageSite).options(selectinload(HeritageSite.restaurants)))
    sites = list(sites_res.scalars().all())
    rests_res = await db.execute(select(Restaurant))
    restaurants = list(rests_res.scalars().all())
    return sites, restaurants


async def _merge_user_context(
    db: AsyncSession,
    user: Optional[Profile],
    preferred_categories: list[str],
    visited_site_ids: list[str],
) -> tuple[list[str], list[str]]:
    merged_cats = list(preferred_categories)
    merged_visited = list(visited_site_ids)
    if user is None:
        return merged_cats, merged_visited

    if not merged_cats and user.preferred_categories:
        merged_cats = list(user.preferred_categories)

    if not merged_visited:
        j_res = await db.execute(
            select(VisitedJourney.site_id).where(VisitedJourney.user_id == user.id)
        )
        merged_visited = list({str(row[0]) for row in j_res.fetchall()})
    return merged_cats, merged_visited


async def get_recommendations(
    db: AsyncSession,
    req: RecommendationRequest,
    user: Optional[Profile] = None,
) -> RecommendationResponse:
    """Async DB service for `POST /api/v1/ai/recommendations`."""
    sites, restaurants = await _load_sites_and_restaurants(db)
    preferred_cats, visited_ids = await _merge_user_context(
        db, user, list(req.preferred_categories), list(req.visited_site_ids)
    )
    postgis_dists = await query_site_distances_postgis(db, req.lat, req.lng, req.radius_m)

    return rank_heritage_sites(
        sites,
        restaurants,
        lat=req.lat,
        lng=req.lng,
        language=req.language,
        preferred_categories=preferred_cats,
        visited_site_ids=visited_ids,
        max_results=req.max_results,
        current_hour=req.current_hour,
        radius_m=req.radius_m,
        postgis_distances=postgis_dists,
    )


async def plan_walking_tour(
    db: AsyncSession,
    req: TourPlanRequest,
    user: Optional[Profile] = None,
) -> TourPlanResponse:
    """Async DB service for `POST /api/v1/ai/tour-plan`."""
    sites, restaurants = await _load_sites_and_restaurants(db)
    preferred_cats, visited_ids = await _merge_user_context(
        db, user, list(req.preferred_categories), list(req.visited_site_ids)
    )
    effective_req = req.model_copy(
        update={
            "preferred_categories": preferred_cats,
            "visited_site_ids": visited_ids,
        }
    )
    postgis_dists = await query_site_distances_postgis(db, req.lat, req.lng, None)
    return build_walking_tour(
        sites,
        restaurants,
        effective_req,
        postgis_distances=postgis_dists,
    )
