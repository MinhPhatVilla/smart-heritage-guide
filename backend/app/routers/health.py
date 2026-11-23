"""System health check router (`GET /api/v1/health`)."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import settings
from app.core.database import check_db_health
from app.schemas.dto import HealthResponse
from app.services.tts_service import (
    is_offline_onnx_available,
    list_installed_offline_models,
)

router = APIRouter(tags=["System"])


@router.get("/health", response_model=HealthResponse, summary="Kiểm tra trạng thái Server, DB & AI")
async def health_check() -> HealthResponse:
    """Return server liveness, database/PostGIS/pgvector status, and active external providers."""
    db_info = await check_db_health()
    status_val = "ok" if db_info.get("connected") else "degraded"
    return HealthResponse(
        status=status_val,
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        database=db_info,
        services={
            "auth_provider": "supabase" if settings.has_supabase_auth else "local_jwt",
            "storage_provider": "supabase" if settings.has_supabase_storage else "local_uploads",
            "gemini_enabled": settings.has_gemini,
            "gemini_chat_model": settings.GEMINI_CHAT_MODEL,
            "routing_primary": "osrm",
            "routing_goong_fallback": settings.has_goong,
            "tts_provider": settings.TTS_DEFAULT_PROVIDER,
            "tts_storage_mode": "ram_stream_only",
            "tts_offline_engine_ready": is_offline_onnx_available(),
            "tts_offline_models": list(list_installed_offline_models().keys()),
        },
        timestamp=datetime.now(timezone.utc),
    )
