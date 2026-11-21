"""Unit & async DB tests for Pillar 1: Explainable Recommendation Engine & 2-Opt Walking Tour Planner."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base
from app.schemas.dto import RecommendationRequest, TourPlanRequest
from app.services.geo_service import haversine_meters
from app.services.recommendation_service import (
    WEIGHT_CATEGORY,
    WEIGHT_DISTANCE,
    WEIGHT_NOVELTY,
    WEIGHT_RATING,
    WEIGHT_STATUS,
    build_walking_tour,
    get_recommendations,
    plan_walking_tour,
    rank_heritage_sites,
    score_heritage_site,
    two_opt_optimize,
)


@dataclass
class MockSite:
    id: str
    city: str
    district: str
    lat: float
    lng: float
    category: str
    rating: float = 4.7
    review_count: int = 1200
    unesco_recognized: bool = False
    national_special_monument: bool = False
    recommended_visit_minutes: int = 35
    cover_image: str = ""
    translations: dict[str, Any] = field(default_factory=dict)


@dataclass
class MockRestaurant:
    id: str
    site_id: str
    name: str
    cuisine: str
    specialty_dishes: list[str]
    rating: float
    review_count: int
    price_range: str
    lat: float
    lng: float
    address: str
    open_hours: str
    meal_slots: list[str]
    image_url: str = ""


def _sample_sites() -> list[MockSite]:
    return [
        MockSite(
            id="dinh-doc-lap",
            city="Quận 1 · TP.HCM",
            district="Quận 1",
            lat=10.7769,
            lng=106.6953,
            category="imperial",
            rating=4.8,
            review_count=5200,
            national_special_monument=True,
            recommended_visit_minutes=40,
            translations={
                "vi": {"name": "Dinh Độc Lập", "openingHours": "08:00 – 16:30"},
                "en": {"name": "Independence Palace", "openingHours": "08:00 - 16:30"},
                "fr": {"name": "Palais de la Réunification", "openingHours": "08:00 - 16:30"},
                "zh": {"name": "统一宫", "openingHours": "08:00 - 16:30"},
                "ja": {"name": "統一会堂", "openingHours": "08:00 - 16:30"},
            },
        ),
        MockSite(
            id="nha-tho-duc-ba",
            city="Quận 1 · TP.HCM",
            district="Quận 1",
            lat=10.7798,
            lng=106.6990,
            category="temple",
            rating=4.7,
            review_count=4100,
            recommended_visit_minutes=25,
            translations={
                "vi": {"name": "Nhà thờ Đức Bà Sài Gòn", "openingHours": "08:00 – 17:00"},
                "en": {"name": "Notre-Dame Cathedral of Saigon", "openingHours": "08:00 - 17:00"},
            },
        ),
        MockSite(
            id="buu-dien-trung-tam",
            city="Quận 1 · TP.HCM",
            district="Quận 1",
            lat=10.7800,
            lng=106.7000,
            category="monument",
            rating=4.7,
            review_count=3800,
            recommended_visit_minutes=25,
            translations={
                "vi": {"name": "Bưu điện Trung tâm Sài Gòn", "openingHours": "07:30 – 18:00"},
                "en": {"name": "Saigon Central Post Office", "openingHours": "07:30 - 18:00"},
            },
        ),
        MockSite(
            id="bao-tang-chung-tich-chien-tranh",
            city="Quận 3 · TP.HCM",
            district="Quận 3",
            lat=10.7795,
            lng=106.6921,
            category="museum",
            rating=4.8,
            review_count=8500,
            recommended_visit_minutes=45,
            translations={
                "vi": {"name": "Bảo tàng Chứng tích Chiến tranh", "openingHours": "07:30 – 17:30"},
                "en": {"name": "War Remnants Museum", "openingHours": "07:30 - 17:30"},
            },
        ),
        MockSite(
            id="cho-ben-thanh",
            city="Quận 1 · TP.HCM",
            district="Quận 1",
            lat=10.7725,
            lng=106.6980,
            category="ancient_town",
            rating=4.5,
            review_count=6000,
            recommended_visit_minutes=30,
            translations={
                "vi": {"name": "Chợ Bến Thành", "openingHours": "06:00 – 22:00"},
                "en": {"name": "Ben Thanh Market", "openingHours": "06:00 - 22:00"},
            },
        ),
    ]


def _sample_restaurants() -> list[MockRestaurant]:
    return [
        MockRestaurant(
            id="pho-hoa-morning",
            site_id="dinh-doc-lap",
            name="Phở Sáng Sài Gòn",
            cuisine="Phở truyền thống",
            specialty_dishes=["Phở tái nạm", "Quẩy nóng"],
            rating=4.6,
            review_count=900,
            price_range="55.000đ – 85.000đ",
            lat=10.7772,
            lng=106.6956,
            address="Quận 1, TP.HCM",
            open_hours="06:00 – 11:00",
            meal_slots=["breakfast"],
        ),
        MockRestaurant(
            id="nha-hang-ngon-lunch",
            site_id="dinh-doc-lap",
            name="Quán Ăn Ngon Pasteur",
            cuisine="Ẩm thực Việt Nam",
            specialty_dishes=["Bánh xèo", "Bún thịt nướng"],
            rating=4.8,
            review_count=2400,
            price_range="80.000đ – 220.000đ",
            lat=10.7776,
            lng=106.6974,
            address="160 Pasteur, Quận 1",
            open_hours="10:30 – 22:00",
            meal_slots=["lunch", "dinner"],
        ),
        MockRestaurant(
            id="com-tam-lower-rating",
            site_id="dinh-doc-lap",
            name="Cơm Tấm Bình Dân",
            cuisine="Cơm tấm",
            specialty_dishes=["Cơm tấm sườn bì"],
            rating=4.1,
            review_count=120,
            price_range="45.000đ – 65.000đ",
            lat=10.7770,
            lng=106.6955,
            address="Quận 1, TP.HCM",
            open_hours="10:00 – 21:00",
            meal_slots=["lunch", "dinner"],
        ),
    ]


def test_explainable_scoring_formula_and_multilingual_reasons():
    sites = _sample_sites()
    palace = sites[0]

    unvisited_item = score_heritage_site(
        palace,
        distance_meters=250.0,
        visited_site_ids=set(),
        preferred_categories={"imperial"},
        inferred_categories=set(),
        current_hour=10.0,
        language="vi",
    )
    visited_item = score_heritage_site(
        palace,
        distance_meters=250.0,
        visited_site_ids={"dinh-doc-lap"},
        preferred_categories={"imperial"},
        inferred_categories=set(),
        current_hour=10.0,
        language="vi",
    )

    # Exact weighted sum check
    bd = unvisited_item.score_breakdown
    expected = round(
        WEIGHT_DISTANCE * bd.distance_score
        + WEIGHT_NOVELTY * bd.novelty_score
        + WEIGHT_CATEGORY * bd.category_score
        + WEIGHT_RATING * bd.rating_score
        + WEIGHT_STATUS * bd.status_score,
        4,
    )
    assert abs(unvisited_item.score - expected) <= 0.0002
    assert 0.0 <= unvisited_item.score <= 1.0
    assert bd.novelty_score == 1.0
    assert visited_item.score_breakdown.novelty_score == 0.25
    assert unvisited_item.score > visited_item.score
    assert len(unvisited_item.reasons) >= 2

    # Check all 5 languages return localized names & reasons
    for lang in ("vi", "en", "fr", "zh", "ja"):
        item = score_heritage_site(
            palace,
            distance_meters=300.0,
            visited_site_ids=set(),
            preferred_categories={"imperial"},
            inferred_categories=set(),
            current_hour=10.0,
            language=lang,
        )
        assert item.reasons
        assert item.site_name


def test_category_preference_boosts_matching_sites():
    sites = _sample_sites()
    restaurants = _sample_restaurants()
    resp = rank_heritage_sites(
        sites,
        restaurants,
        lat=10.7770,
        lng=106.6955,
        language="en",
        preferred_categories=["museum"],
        current_hour=10.0,
    )
    museum_item = next(i for i in resp.items if i.site_id == "bao-tang-chung-tich-chien-tranh")
    assert museum_item.score_breakdown.category_score == 1.0
    assert any("Museum" in r for r in museum_item.reasons)


def test_two_opt_strictly_reduces_crossing_path_distance():
    origin = (10.7700, 106.6900)
    # Deliberately zigzagging / crossing order: A -> D -> B -> C -> E
    stops = [
        MockSite("p1", "Q1", "Q1", 10.7710, 106.6910, "monument"),  # near origin
        MockSite("p4", "Q1", "Q1", 10.7900, 106.7100, "monument"),  # far NE
        MockSite("p2", "Q1", "Q1", 10.7720, 106.6940, "monument"),  # near origin
        MockSite("p5", "Q1", "Q1", 10.7890, 106.7090, "monument"),  # far NE
        MockSite("p3", "Q1", "Q1", 10.7750, 106.6980, "monument"),  # middle
    ]

    def _path_len(seq: list[MockSite]) -> float:
        total = haversine_meters(origin[0], origin[1], seq[0].lat, seq[0].lng)
        for i in range(1, len(seq)):
            total += haversine_meters(seq[i - 1].lat, seq[i - 1].lng, seq[i].lat, seq[i].lng)
        return total

    initial_dist = _path_len(stops)
    optimized, opt_dist = two_opt_optimize(origin, stops)
    assert len(optimized) == len(stops)
    assert opt_dist < initial_dist
    assert (initial_dist - opt_dist) > 1000.0  # Significant zigzag eliminated


@pytest.mark.parametrize("budget_minutes", [60, 90, 120, 180])
def test_tour_planner_strictly_respects_time_budget(budget_minutes: int):
    sites = _sample_sites()
    restaurants = _sample_restaurants()
    req = TourPlanRequest(
        lat=10.7769,
        lng=106.6953,
        available_minutes=budget_minutes,
        start_hour=9,
        include_meal_stop=True,
        language="vi",
    )
    plan = build_walking_tour(sites, restaurants, req)
    assert plan.total_sites >= 1
    assert plan.total_duration_minutes <= budget_minutes
    assert plan.total_duration_minutes == plan.total_walking_minutes + plan.total_visit_minutes
    assert plan.optimized_distance_meters <= plan.initial_distance_meters
    assert plan.distance_saved_meters >= 0.0
    assert len(plan.route_polyline) == len(plan.stops) + 1


def test_tour_planner_inserts_highest_rated_lunch_stop_during_lunch_window():
    sites = _sample_sites()
    restaurants = _sample_restaurants()
    req = TourPlanRequest(
        lat=10.7769,
        lng=106.6953,
        available_minutes=150,
        start_hour=11,  # Overlaps Lunch 11:00 - 14:00
        include_meal_stop=True,
        language="vi",
    )
    plan = build_walking_tour(sites, restaurants, req)
    assert plan.meal_stop_included is True
    meal_stops = [s for s in plan.stops if s.stop_type == "meal"]
    assert len(meal_stops) == 1
    assert meal_stops[0].meal_slot == "lunch"
    # Should pick higher-rated "Quán Ăn Ngon Pasteur" (4.8★) over "Cơm Tấm Bình Dân" (4.1★)
    assert meal_stops[0].site_id == "nha-hang-ngon-lunch"
    assert plan.total_duration_minutes <= 150


def test_tour_planner_omits_meal_stop_when_disabled():
    sites = _sample_sites()
    restaurants = _sample_restaurants()
    req = TourPlanRequest(
        lat=10.7769,
        lng=106.6953,
        available_minutes=150,
        start_hour=12,
        include_meal_stop=False,
        language="en",
    )
    plan = build_walking_tour(sites, restaurants, req)
    assert plan.meal_stop_included is False
    assert all(s.stop_type == "heritage" for s in plan.stops)


async def test_async_db_recommendations_and_tour_plan_with_seeded_20_sites():
    from scripts.seed_supabase import seed_database

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        await seed_database(session=db, generate_embeddings=False, seed_demo_users=False)

        rec = await get_recommendations(
            db,
            RecommendationRequest(
                lat=10.7769,
                lng=106.6953,
                language="vi",
                preferred_categories=["museum", "imperial"],
                max_results=5,
                current_hour=10,
            ),
        )
        assert len(rec.items) == 5
        assert rec.items[0].score >= rec.items[-1].score
        assert len(rec.recommended_restaurants) >= 1

        tour = await plan_walking_tour(
            db,
            TourPlanRequest(
                lat=10.7769,
                lng=106.6953,
                available_minutes=120,
                start_hour=11,
                include_meal_stop=True,
                language="vi",
            ),
        )
        assert tour.total_sites >= 1
        assert tour.total_duration_minutes <= 120
        assert tour.meal_stop_included is True

    await engine.dispose()
