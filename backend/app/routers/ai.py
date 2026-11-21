"""Smart AI Router (`/api/v1/ai/*`) exposing the 3 Intelligent System Pillars.

Endpoints:
  - POST /api/v1/ai/recommendations   — Explainable Context-Aware Site & Food Ranking
  - POST /api/v1/ai/tour-plan         — Time-Constrained 2-Opt Walking Tour + Meal Stop Planner
  - POST /api/v1/ai/chat              — Multilingual Hybrid RAG Assistant (5 languages + fallback)
  - POST /api/v1/ai/vision/identify   — Gemini Vision Landmark Recognition + GPS Fallback
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
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
    VisionIdentifyRequest,
    VisionIdentifyResponse,
)
from app.services.rag_service import answer_heritage_question
from app.services.recommendation_service import get_recommendations, plan_walking_tour
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
