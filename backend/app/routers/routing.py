"""Walking Route Proxy router (`POST /api/v1/routing/walking`)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.dto import WalkingRouteRequest, WalkingRouteResponse
from app.services.routing_service import get_walking_route

router = APIRouter(prefix="/routing", tags=["Routing"])


@router.post(
    "/walking",
    response_model=WalkingRouteResponse,
    summary="Chỉ đường đi bộ qua Backend Proxy (DB Cache → OSRM → Goong → Fallback)",
)
async def calculate_walking_route(
    payload: WalkingRouteRequest,
    db: AsyncSession = Depends(get_db),
) -> WalkingRouteResponse:
    """Compute or retrieve a cached walking route matching the Mobile `WalkingRouteResult` contract."""
    return await get_walking_route(db, payload)
