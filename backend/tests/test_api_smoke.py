"""End-to-end FastAPI TestClient smoke & integration tests for Smart Heritage Guide Backend."""

from __future__ import annotations

import base64
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core import config as config_module
from app.core import database as db_module
from app.core.database import Base, get_db
from app.main import create_app
from app.models.entities import HeritageKnowledgeChunk
from scripts.seed_supabase import seed_database

# Minimal valid 1x1 PNG bytes for photo upload & vision tests
TINY_PNG_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)
TINY_PNG_B64 = base64.b64encode(TINY_PNG_BYTES).decode("ascii")


@pytest.fixture(scope="module")
def api_client(tmp_path_factory: pytest.TempPathFactory):
    """Create an isolated FastAPI TestClient backed by a fresh seeded temporary SQLite DB."""
    tmp_dir: Path = tmp_path_factory.mktemp("smoke_backend")
    db_file = tmp_dir / "test_smoke.db"
    upload_dir = tmp_dir / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    test_engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_file.as_posix()}",
        future=True,
        connect_args={"check_same_thread": False},
    )
    test_session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

    async def _override_get_db():
        async with test_session_factory() as session:
            try:
                yield session
            finally:
                await session.close()

    async def _init_and_seed() -> None:
        import app.models.entities  # noqa: F401

        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with test_session_factory() as session:
            await seed_database(session=session, generate_embeddings=False, seed_demo_users=True)

    orig_engine = db_module.engine
    orig_session_local = db_module.AsyncSessionLocal
    orig_upload_dir = config_module.settings.LOCAL_UPLOAD_DIR
    orig_gemini_key = config_module.settings.GEMINI_API_KEY
    orig_supabase_url = config_module.settings.SUPABASE_URL
    orig_supabase_anon = config_module.settings.SUPABASE_ANON_KEY

    db_module.engine = test_engine
    db_module.AsyncSessionLocal = test_session_factory
    config_module.settings.LOCAL_UPLOAD_DIR = str(upload_dir)
    config_module.settings.GEMINI_API_KEY = ""
    config_module.settings.SUPABASE_URL = ""
    config_module.settings.SUPABASE_ANON_KEY = ""

    test_app = create_app()
    test_app.dependency_overrides[get_db] = _override_get_db

    with (
        patch("app.main.init_db", side_effect=_init_and_seed),
        patch("app.main.ensure_seeded_if_empty", new=AsyncMock(return_value={"skipped": 1})),
        patch("app.main.close_db", side_effect=test_engine.dispose),
    ):
        with TestClient(test_app) as client:
            yield client, test_session_factory

    db_module.engine = orig_engine
    db_module.AsyncSessionLocal = orig_session_local
    config_module.settings.LOCAL_UPLOAD_DIR = orig_upload_dir
    config_module.settings.GEMINI_API_KEY = orig_gemini_key
    config_module.settings.SUPABASE_URL = orig_supabase_url
    config_module.settings.SUPABASE_ANON_KEY = orig_supabase_anon


def _auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_openapi_schema_exposes_all_required_endpoints(api_client) -> None:
    client, _ = api_client
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    paths = resp.json()["paths"]

    expected_paths = [
        "/api/v1/health",
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/auth/me",
        "/api/v1/sites",
        "/api/v1/sites/{site_id}",
        "/api/v1/sites/{site_id}/restaurants",
        "/api/v1/admin/sites",
        "/api/v1/admin/sites/{site_id}",
        "/api/v1/admin/restaurants",
        "/api/v1/admin/restaurants/{restaurant_id}",
        "/api/v1/ai/recommendations",
        "/api/v1/ai/tour-plan",
        "/api/v1/ai/chat",
        "/api/v1/ai/vision/identify",
        "/api/v1/routing/walking",
        "/api/v1/journeys/me",
        "/api/v1/journeys/check-in",
        "/api/v1/journeys/{journey_id}/photos",
        "/api/v1/journeys/sync",
        "/api/v1/leaderboard/global",
        "/api/v1/leaderboard/me",
        "/api/v1/badges",
    ]
    for path in expected_paths:
        assert path in paths, f"Missing endpoint in OpenAPI schema: {path}"


def test_health_endpoint(api_client) -> None:
    client, _ = api_client
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["database"]["connected"] is True


def test_auth_register_login_and_me_flow(api_client) -> None:
    client, _ = api_client

    reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "explorer1@test.vn",
            "password": "Password123!",
            "display_name": "Nguyen Van A",
            "preferred_language": "vi",
            "preferred_categories": ["museum", "monument"],
        },
    )
    assert reg.status_code == 201, reg.text
    reg_data = reg.json()
    assert reg_data["token_type"] == "bearer"
    assert reg_data["profile"]["role"] == "user"
    token = reg_data["access_token"]

    me = client.get("/api/v1/auth/me", headers=_auth_header(token))
    assert me.status_code == 200
    assert me.json()["display_name"] == "Nguyen Van A"

    patched = client.patch(
        "/api/v1/auth/me",
        headers=_auth_header(token),
        json={"display_name": "Nguyen Van B", "preferred_language": "en"},
    )
    assert patched.status_code == 200
    assert patched.json()["display_name"] == "Nguyen Van B"
    assert patched.json()["preferred_language"] == "en"

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "explorer1@test.vn", "password": "Password123!"},
    )
    assert login.status_code == 200
    assert login.json()["access_token"]


def test_sites_spatial_filter_detail_and_restaurants(api_client) -> None:
    client, _ = api_client

    all_sites = client.get("/api/v1/sites")
    assert all_sites.status_code == 200
    assert all_sites.json()["total"] == 20

    # Spatial filter around Dinh Doc Lap (10.777, 106.6953) within 1500m
    nearby = client.get(
        "/api/v1/sites",
        params={"lat": 10.777, "lng": 106.6953, "radius_m": 1500},
    )
    assert nearby.status_code == 200
    items = nearby.json()["items"]
    assert len(items) >= 3
    dists = [it["distance_meters"] for it in items]
    assert all(d is not None and d <= 1500 for d in dists)
    assert dists == sorted(dists)
    assert items[0]["id"] == "dinh-doc-lap"

    # Category + search filter
    museums = client.get("/api/v1/sites", params={"category": "museum", "q": "Bảo tàng"})
    assert museums.status_code == 200
    assert museums.json()["total"] >= 1
    assert all(it["category"] == "museum" for it in museums.json()["items"])

    # Site detail + restaurants filter
    detail = client.get("/api/v1/sites/dinh-doc-lap")
    assert detail.status_code == 200
    assert detail.json()["id"] == "dinh-doc-lap"
    assert len(detail.json()["nearby_restaurants"]) >= 1

    rests = client.get(
        "/api/v1/sites/dinh-doc-lap/restaurants",
        params={"min_rating": 4.5, "meal_slot": "lunch"},
    )
    assert rests.status_code == 200
    assert len(rests.json()) >= 1
    assert all(r["rating"] >= 4.5 and "lunch" in r["meal_slots"] for r in rests.json())


def test_admin_crud_rbac_and_rag_reindex(api_client) -> None:
    client, session_factory = api_client

    # Regular user -> 403 Forbidden
    user_login = client.post(
        "/api/v1/auth/login",
        json={"email": "demo@smartheritage.vn", "password": "DemoHeritage@2026"},
    )
    assert user_login.status_code == 200
    user_token = user_login.json()["access_token"]

    forbidden = client.post(
        "/api/v1/admin/sites",
        headers=_auth_header(user_token),
        json={
            "id": "forbidden-site",
            "city": "Quận 1 · TP.HCM",
            "lat": 10.77,
            "lng": 106.70,
            "category": "monument",
        },
    )
    assert forbidden.status_code == 403

    # Admin login -> full CRUD lifecycle
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@smartheritage.vn", "password": "AdminHeritage@2026"},
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]

    created = client.post(
        "/api/v1/admin/sites",
        headers=_auth_header(admin_token),
        json={
            "id": "test-heritage-tower",
            "city": "Quận 1 · TP.HCM",
            "district": "Quận 1",
            "lat": 10.7735,
            "lng": 106.7030,
            "category": "monument",
            "rating": 4.7,
            "ticket_price": "20.000đ",
            "address": "01 Đồng Khởi, Quận 1, TP.HCM",
            "translations": {
                "vi": {
                    "name": "Tháp Di Sản Thử Nghiệm",
                    "shortSummary": "Công trình thử nghiệm kiến trúc Sài Gòn cổ điển.",
                    "historicalEra": "1920",
                    "openingHours": "08:00 – 17:00",
                    "architecturalHighlights": ["Mái vòm đồng xanh"],
                    "audioScript": ["Chào mừng tới Tháp Di Sản Thử Nghiệm."],
                }
            },
        },
    )
    assert created.status_code == 201, created.text
    assert created.json()["id"] == "test-heritage-tower"

    # Update site
    updated = client.put(
        "/api/v1/admin/sites/test-heritage-tower",
        headers=_auth_header(admin_token),
        json={"ticket_price": "Miễn phí", "rating": 4.9},
    )
    assert updated.status_code == 200
    assert updated.json()["ticket_price"] == "Miễn phí"
    assert updated.json()["rating"] == 4.9

    # Create, update, delete restaurant under the test site
    rest_create = client.post(
        "/api/v1/admin/restaurants",
        headers=_auth_header(admin_token),
        json={
            "id": "res-test-tower-1",
            "site_id": "test-heritage-tower",
            "name": "Cà Phê Đồng Khởi Cổ",
            "cuisine": "Cà phê & Điểm tâm",
            "specialty_dishes": ["Cà phê sữa đá", "Bánh mì chảo"],
            "rating": 4.8,
            "lat": 10.7736,
            "lng": 106.7031,
            "meal_slots": ["breakfast", "cafe"],
        },
    )
    assert rest_create.status_code == 201, rest_create.text
    assert rest_create.json()["id"] == "res-test-tower-1"

    rest_update = client.put(
        "/api/v1/admin/restaurants/res-test-tower-1",
        headers=_auth_header(admin_token),
        json={"rating": 4.9},
    )
    assert rest_update.status_code == 200
    assert rest_update.json()["rating"] == 4.9

    # Verify RAG chunks were auto-indexed for the new site
    async def _count_chunks() -> int:
        async with session_factory() as s:
            rows = (
                await s.execute(
                    select(HeritageKnowledgeChunk).where(
                        HeritageKnowledgeChunk.site_id == "test-heritage-tower"
                    )
                )
            ).scalars().all()
            return len(rows)

    import asyncio

    assert asyncio.run(_count_chunks()) >= 3

    rest_del = client.delete(
        "/api/v1/admin/restaurants/res-test-tower-1",
        headers=_auth_header(admin_token),
    )
    assert rest_del.status_code == 200
    assert rest_del.json()["deleted"] is True

    site_del = client.delete(
        "/api/v1/admin/sites/test-heritage-tower",
        headers=_auth_header(admin_token),
    )
    assert site_del.status_code == 200
    assert client.get("/api/v1/sites/test-heritage-tower").status_code == 404


def test_checkin_photos_sync_badges_and_leaderboard(api_client) -> None:
    client, _ = api_client

    # Register fresh user for deterministic badge & stats checks
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "walker@test.vn",
            "password": "Password123!",
            "display_name": "Saigon Walker",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["access_token"]

    # 1. Valid real walking check-in at Dinh Doc Lap (~1.25 m/s, geofence < 20m)
    verified_checkin = client.post(
        "/api/v1/journeys/check-in",
        headers=_auth_header(token),
        json={
            "site_id": "dinh-doc-lap",
            "checkin_lat": 10.7770,
            "checkin_lng": 106.6953,
            "walking_duration_seconds": 1000,
            "walking_distance_meters": 1250,
            "route_coordinates": [
                [10.7718, 106.6983],
                [10.7735, 106.6974],
                [10.7752, 106.6964],
                [10.7770, 106.6953],
            ],
            "user_note": "Đi bộ buổi sáng rất mát!",
            "user_rating": 5,
            "is_simulated": False,
        },
    )
    assert verified_checkin.status_code == 201, verified_checkin.text
    vc_data = verified_checkin.json()
    assert vc_data["verification"]["status"] == "verified"
    assert vc_data["verification"]["score"] >= 70
    assert vc_data["profile_stats"]["verified_sites_count"] == 1
    assert vc_data["profile_stats"]["total_verified_walking_meters"] == 1250
    unlocked_codes = [b["code"] for b in vc_data["newly_unlocked_badges"]]
    assert "first_step" in unlocked_codes
    journey_id = vc_data["journey"]["id"]

    # 2. Simulated check-in must NOT inflate verified stats
    sim_checkin = client.post(
        "/api/v1/journeys/check-in",
        headers=_auth_header(token),
        json={
            "site_id": "nha-tho-duc-ba-sai-gon",
            "checkin_lat": 10.7798,
            "checkin_lng": 106.6990,
            "walking_duration_seconds": 600,
            "walking_distance_meters": 800,
            "is_simulated": True,
        },
    )
    assert sim_checkin.status_code == 201
    assert sim_checkin.json()["verification"]["status"] == "simulated"
    assert sim_checkin.json()["profile_stats"]["verified_sites_count"] == 1

    # 3. Flagged check-in (far GPS + motorized speed) must NOT inflate verified stats
    flagged_checkin = client.post(
        "/api/v1/journeys/check-in",
        headers=_auth_header(token),
        json={
            "site_id": "cho-ben-thanh",
            "checkin_lat": 10.8500,
            "checkin_lng": 106.7500,
            "walking_duration_seconds": 100,
            "walking_distance_meters": 2000,
            "is_simulated": False,
        },
    )
    assert flagged_checkin.status_code == 201
    assert flagged_checkin.json()["verification"]["status"] == "flagged"
    assert flagged_checkin.json()["profile_stats"]["verified_sites_count"] == 1

    # 4. Upload 3 photos (2 JSON base64 + 1 multipart) -> unlocks `heritage_photographer`
    for idx in range(2):
        photo_resp = client.post(
            f"/api/v1/journeys/{journey_id}/photos",
            headers=_auth_header(token),
            json={
                "image_base64": f"data:image/png;base64,{TINY_PNG_B64}",
                "caption": f"Ảnh kỷ niệm #{idx + 1}",
                "lat": 10.777,
                "lng": 106.6953,
                "walking_duration_seconds_at_capture": 500 + idx * 100,
            },
        )
        assert photo_resp.status_code == 201, photo_resp.text
        assert "/uploads/" in photo_resp.json()["public_url"]

    multipart_resp = client.post(
        f"/api/v1/journeys/{journey_id}/photos",
        headers=_auth_header(token),
        files={"file": ("heritage.png", TINY_PNG_BYTES, "image/png")},
        data={"caption": "Ảnh multipart #3", "lat": "10.777", "lng": "106.6953"},
    )
    assert multipart_resp.status_code == 201, multipart_resp.text

    # 5. Bulk offline sync
    sync_resp = client.post(
        "/api/v1/journeys/sync",
        headers=_auth_header(token),
        json={
            "journeys": [
                {
                    "site_id": "nha-tho-duc-ba-sai-gon",
                    "checkin_lat": 10.7798,
                    "checkin_lng": 106.6990,
                    "walking_duration_seconds": 700,
                    "walking_distance_meters": 900,
                    "route_coordinates": [[10.7770, 106.6953], [10.7785, 106.6972], [10.7798, 106.6990]],
                    "user_note": "Offline sync test",
                }
            ]
        },
    )
    assert sync_resp.status_code == 200, sync_resp.text
    assert sync_resp.json()["synced_count"] == 1

    # 6. GET /journeys/me includes photos
    my_journeys = client.get("/api/v1/journeys/me", headers=_auth_header(token))
    assert my_journeys.status_code == 200
    assert len(my_journeys.json()) == 4
    matching = [j for j in my_journeys.json() if j["id"] == journey_id][0]
    assert len(matching["photos"]) == 3

    # 7. Leaderboard & Badges
    lb_global = client.get("/api/v1/leaderboard/global", params={"sort_by": "walking_distance"})
    assert lb_global.status_code == 200
    assert lb_global.json()["total_users"] >= 2

    lb_me = client.get("/api/v1/leaderboard/me", headers=_auth_header(token))
    assert lb_me.status_code == 200
    lb_me_data = lb_me.json()
    assert lb_me_data["rank"] is not None
    my_unlocked_codes = {b["code"] for b in lb_me_data["unlocked_badges"]}
    assert "first_step" in my_unlocked_codes
    assert "heritage_photographer" in my_unlocked_codes

    all_badges = client.get("/api/v1/badges", headers=_auth_header(token))
    assert all_badges.status_code == 200
    assert len(all_badges.json()) == 6


def test_routing_and_ai_endpoints_smoke(api_client) -> None:
    client, _ = api_client

    # Routing proxy (with mocked external failure -> offline fallback)
    with (
        patch("app.services.routing_service.fetch_from_osrm", AsyncMock(return_value=None)),
        patch("app.services.routing_service.fetch_from_goong", AsyncMock(return_value=None)),
    ):
        route_resp = client.post(
            "/api/v1/routing/walking",
            json={
                "origin_lat": 10.7769,
                "origin_lng": 106.6953,
                "dest_lat": 10.7798,
                "dest_lng": 106.6990,
                "target_id": "nha-tho-duc-ba-sai-gon",
                "target_name": "Nhà Thờ Đức Bà",
                "target_type": "heritage",
            },
        )
        assert route_resp.status_code == 200, route_resp.text
        r_data = route_resp.json()
        assert r_data["provider"] == "fallback"
        assert len(r_data["coordinates"]) == 9

    # AI Pillar 1: Recommendations
    rec_resp = client.post(
        "/api/v1/ai/recommendations",
        json={"lat": 10.777, "lng": 106.6953, "language": "vi", "max_results": 5},
    )
    assert rec_resp.status_code == 200, rec_resp.text
    assert len(rec_resp.json()["items"]) == 5

    # AI Pillar 1: 2-Opt Tour Plan
    tour_resp = client.post(
        "/api/v1/ai/tour-plan",
        json={
            "lat": 10.777,
            "lng": 106.6953,
            "available_minutes": 150,
            "start_hour": 10,
            "include_meal_stop": True,
            "language": "vi",
        },
    )
    assert tour_resp.status_code == 200, tour_resp.text
    t_data = tour_resp.json()
    assert t_data["total_sites"] >= 1
    assert t_data["total_duration_minutes"] <= 150

    # AI Pillar 2: Multilingual RAG Chat (fallback mode without GEMINI_API_KEY)
    chat_resp = client.post(
        "/api/v1/ai/chat",
        json={
            "question": "Dinh Độc Lập mở cửa mấy giờ và giá vé bao nhiêu?",
            "language": "vi",
            "site_id": "dinh-doc-lap",
        },
    )
    assert chat_resp.status_code == 200, chat_resp.text
    c_data = chat_resp.json()
    assert c_data["mode"] == "fallback"
    assert len(c_data["citations"]) >= 1
    assert len(c_data["suggested_questions"]) == 3

    # AI Pillar 3: Vision Identify (GPS fallback mode without GEMINI_API_KEY)
    vision_resp = client.post(
        "/api/v1/ai/vision/identify",
        json={
            "image_base64": TINY_PNG_B64,
            "mime_type": "image/png",
            "lat": 10.777,
            "lng": 106.6953,
            "language": "vi",
        },
    )
    assert vision_resp.status_code == 200, vision_resp.text
    v_data = vision_resp.json()
    assert v_data["mode"] == "gps_fallback"
    assert v_data["matched_site_id"] == "dinh-doc-lap"
