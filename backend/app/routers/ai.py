"""Smart AI Router (`/api/v1/ai/*`) exposing the 3 Intelligent System Pillars & Dual-Engine TTS.

Endpoints:
  - POST /api/v1/ai/recommendations   — Explainable Context-Aware Site & Food Ranking
  - POST /api/v1/ai/tour-plan         — Time-Constrained 2-Opt Walking Tour + Meal Stop Planner
  - POST /api/v1/ai/chat              — Multilingual Hybrid RAG Assistant (5 languages + fallback)
  - POST /api/v1/ai/vision/identify   — Gemini Vision Landmark Recognition + GPS Fallback
  - GET  /api/v1/ai/tts/voices        — Curated & 140+ Dynamic Neural + Offline ONNX Voice Catalog
  - POST /api/v1/ai/tts               — Zero-Disk RAM Streaming TTS (140+ Neural + Offline ONNX)
  - GET  /api/v1/ai/tts               — Direct Audio Stream URL for Native/Web Players
"""

from __future__ import annotations

import io
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_optional_user
from app.models.entities import Profile
from app.schemas.dto import (
    AiChatRequest,
    AiChatResponse,
    RecommendationRequest,
    RecommendationResponse,
    TourPlanRequest,
    TourPlanResponse,
    TtsProviderMode,
    TtsSynthesizeRequest,
    VisionIdentifyRequest,
    VisionIdentifyResponse,
)
from app.services.rag_service import answer_heritage_question
from app.services.recommendation_service import get_recommendations, plan_walking_tour
from app.services.tts_service import (
    get_tts_voices_catalog,
    synthesize_speech_stream,
)
from app.services.vision_service import identify_site_from_request

router = APIRouter(prefix="/ai", tags=["Smart AI"])


@router.post(
    "/recommendations",
    response_model=RecommendationResponse,
    summary="Gợi ý di tích & quán ăn theo ngữ cảnh (Explainable Context-Aware Scoring)",
)
async def ai_recommendations(
    payload: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_optional_user),
) -> RecommendationResponse:
    """Rank heritage sites using the 5-factor explainable scoring model S(i) and return localized reasons."""
    return await get_recommendations(db, payload, user=current_user)


@router.post(
    "/tour-plan",
    response_model=TourPlanResponse,
    summary="Lập lịch trình đi bộ tối ưu nhiều điểm (Nearest-Neighbor + 2-Opt + Điểm dừng ẩm thực)",
)
async def ai_tour_plan(
    payload: TourPlanRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_optional_user),
) -> TourPlanResponse:
    """Build a time-constrained 2-Opt optimized walking itinerary with optional automatic meal stop."""
    return await plan_walking_tour(db, payload, user=current_user)


@router.post(
    "/chat",
    response_model=AiChatResponse,
    summary="Trợ lý AI Hướng dẫn viên RAG đa ngôn ngữ (VI/EN/FR/ZH/JA)",
)
async def ai_chat(
    payload: AiChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_optional_user),
) -> AiChatResponse:
    """Answer heritage & culinary questions using Hybrid RRF retrieval + Gemini Flash (with smart fallback)."""
    _ = current_user  # Available for future personalization; Guests are fully supported
    return await answer_heritage_question(db, payload)


@router.post(
    "/vision/identify",
    response_model=VisionIdentifyResponse,
    summary="Nhận diện di tích qua ảnh Camera (Gemini Vision + GPS Fallback)",
)
async def ai_vision_identify(
    payload: VisionIdentifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_optional_user),
) -> VisionIdentifyResponse:
    """Identify a heritage landmark from a base64 photo, pre-filtering Top-8 nearest sites via GPS."""
    _ = current_user
    try:
        return await identify_site_from_request(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/tts/voices",
    summary="Danh mục giọng đọc TTS (5 ngôn ngữ chuẩn · 140+ ngôn ngữ động · Offline ONNX)",
)
async def ai_tts_voices(
    all_languages: bool = Query(
        default=False,
        description="Bật true để trả về toàn bộ 140+ ngôn ngữ Neural và danh mục model offline sherpa-onnx",
    ),
) -> dict[str, Any]:
    """Return curated voices or the full 140+ dynamic languages + offline sherpa-onnx catalog."""
    return await get_tts_voices_catalog(include_all_languages=all_languages)


@router.post(
    "/tts",
    summary="Stream âm thanh thuyết minh trực tiếp trong RAM (0 file đĩa · 140+ ngôn ngữ & Offline ONNX)",
    responses={
        200: {
            "content": {
                "audio/mpeg": {},
                "audio/wav": {},
            }
        }
    },
)
async def ai_tts_post(payload: TtsSynthesizeRequest) -> StreamingResponse:
    """Stream natural speech directly from RAM with zero disk files (auto / neural / offline ONNX)."""
    try:
        result = await synthesize_speech_stream(
            text=payload.text,
            language=payload.language,
            gender=payload.voice_gender,
            provider=payload.provider,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return StreamingResponse(
        io.BytesIO(result.audio_bytes),
        media_type=result.media_type,
        headers={
            "Cache-Control": "public, max-age=3600",
            "Content-Length": str(len(result.audio_bytes)),
            "X-TTS-Provider": result.provider,
            "X-TTS-Voice": result.voice_id,
            "X-TTS-Cache": "hit" if result.cache_hit else "miss",
            "X-TTS-Disk-Files": "0",
        },
    )


@router.get(
    "/tts",
    summary="Stream trực tiếp âm thanh thuyết minh qua URL (cho Native Audio & Web)",
    responses={
        200: {
            "content": {
                "audio/mpeg": {},
                "audio/wav": {},
            }
        }
    },
)
async def ai_tts_get(
    text: str = Query(..., min_length=1, max_length=1800),
    language: str = Query(default="vi", min_length=2, max_length=16),
    voice_gender: Literal["female", "male"] = Query(default="female"),
    provider: TtsProviderMode = Query(default="auto"),
) -> StreamingResponse:
    """GET variant allowing direct audio player URL streaming on iOS/Android/Web."""
    return await ai_tts_post(
        TtsSynthesizeRequest(
            text=text,
            language=language,
            voice_gender=voice_gender,
            provider=provider,
        )
    )
