"""FastAPI Application Entrypoint for Smart Heritage Guide Backend."""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import close_db, init_db
from app.routers import admin, ai, auth, health, journeys, leaderboard, routing, sites
from app.services.tts_service import warmup_tts_in_background
from scripts.seed_supabase import ensure_seeded_if_empty

OPENAPI_DESCRIPTION = """
## Smart Heritage Guide — Intelligent Tourism Backend API (TP. Hồ Chí Minh)

Hệ thống Backend FastAPI + Supabase (PostgreSQL + PostGIS + `pgvector` + Auth + Storage) phục vụ ứng dụng di động **Smart Heritage Guide** với **3 Trụ cột Hệ thống Thông minh**:

1. **Gợi ý Ngữ cảnh Giải thích được & Lập Lịch trình Đi bộ Tối ưu (2-Opt Tour Planner)**:
   - Chấm điểm đa tiêu chí giải thích được (`distance`, `novelty`, `category`, `rating`, `status`).
   - Tối ưu tuyến đi bộ nhiều điểm bằng **Nearest-Neighbor + 2-Opt Local Search** và tự động chèn điểm dừng ẩm thực theo khung giờ ăn.
2. **Trợ lý AI Hỏi–Đáp RAG Đa ngôn ngữ (`vi | en | fr | zh | ja`)**:
   - Truy xuất lai **Hybrid Retrieval (pgvector Cosine + BM25/Trigram RRF)** + sinh câu trả lời chống bịa đặt qua **Gemini 2.5 Flash** kèm cơ chế fallback có cấu trúc khi thiếu API key.
3. **Vision AI Nhận diện Di tích & Anti-Fake GPS/Walking Verifier**:
   - Lọc ứng viên GPS gần nhất + Gemini Vision nhận diện kiến trúc di tích.
   - Chấm điểm xác thực hành trình đi bộ (0–100) theo Geofence, vận tốc đi bộ vật lý, tính liên tục quỹ đạo & thưởng ảnh Vision AI.

### Hướng dẫn dùng nút **Authorize** trên Swagger UI (`/docs`)
- Gọi `POST /api/v1/auth/login` với tài khoản mặc định:
  - **Admin CRUD**: `admin@smartheritage.vn` / `AdminHeritage@2026`
  - **Demo Explorer**: `demo@smartheritage.vn` / `DemoHeritage@2026`
- Sao chép `access_token` và dán vào nút **Authorize (BearerAuth)** ở góc trên bên phải.
"""

TAGS_METADATA = [
    {"name": "System", "description": "Kiểm tra tình trạng Server, DB PostGIS/pgvector & kết nối AI."},
    {"name": "Auth", "description": "Đăng ký, đăng nhập JWT (Supabase Auth / Local fallback) & quản lý hồ sơ."},
    {"name": "Heritage Sites", "description": "Truy vấn 50 di tích lịch sử, điểm tham quan TP.HCM & quán ăn đặc sản lân cận."},
    {"name": "Admin CRUD", "description": "Quản trị di tích & quán ăn (Admin only), tự động cập nhật tri thức RAG."},
    {"name": "Smart AI", "description": "3 Trụ cột Thông minh: Gợi ý ngữ cảnh, Tour 2-Opt, RAG Chatbot & Vision AI."},
    {"name": "Routing", "description": "Proxy chỉ đường đi bộ (DB Cache 7 ngày → FOSSGIS OSRM → Goong → Fallback)."},
    {"name": "Journeys", "description": "Nhật ký đi bộ, Check-in chống gian lận, tải ảnh & đồng bộ offline."},
    {"name": "Leaderboard & Badges", "description": "Bảng xếp hạng Cộng đồng xác thực & 6 Huy hiệu thành tựu tự động."},
]


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Initialize upload directory, database tables, auto-seed, and background TTS warmup."""
    settings.upload_dir_path.mkdir(parents=True, exist_ok=True)
    await init_db()
    if settings.is_sqlite or settings.APP_ENV.lower() in ("development", "local", "test"):
        await ensure_seeded_if_empty()
    tts_warmup_task = asyncio.create_task(warmup_tts_in_background())
    yield
    if not tts_warmup_task.done():
        tts_warmup_task.cancel()
    await close_db()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    settings.upload_dir_path.mkdir(parents=True, exist_ok=True)

    application = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=OPENAPI_DESCRIPTION,
        openapi_tags=TAGS_METADATA,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    cors_origins = settings.cors_origins_list
    application.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=cors_origins != ["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Local storage fallback static mount (`/uploads/{user_id}/{journey_id}/{file}`)
    application.mount(
        "/uploads",
        StaticFiles(directory=str(settings.upload_dir_path)),
        name="uploads",
    )

    api_prefix = settings.API_V1_PREFIX.rstrip("/")
    application.include_router(health.router, prefix=api_prefix)
    application.include_router(auth.router, prefix=api_prefix)
    application.include_router(sites.router, prefix=api_prefix)
    application.include_router(admin.router, prefix=api_prefix)
    application.include_router(ai.router, prefix=api_prefix)
    application.include_router(routing.router, prefix=api_prefix)
    application.include_router(journeys.router, prefix=api_prefix)
    application.include_router(leaderboard.router, prefix=api_prefix)

    @application.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "health": f"{api_prefix}/health",
        }

    return application


app = create_app()
