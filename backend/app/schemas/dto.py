"""Pydantic v2 DTO definitions shared across all FastAPI routers and services."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

SupportedLanguage = Literal["vi", "en", "fr", "zh", "ja"]
HeritageCategory = Literal["imperial", "temple", "museum", "monument", "ancient_town"]
MealSlot = Literal["breakfast", "lunch", "dinner", "cafe"]
VerificationStatus = Literal["verified", "simulated", "flagged"]
UserRole = Literal["user", "admin"]
TravelMode = Literal["walking", "motorbike", "car"]


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# ---------------------------------------------------------------------------
# System / Health
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    app_name: str
    version: str
    environment: str
    database: dict[str, Any]
    services: dict[str, Any]
    timestamp: datetime


# ---------------------------------------------------------------------------
# Auth & Profile
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    display_name: str = Field(default="Khách Du Lịch", min_length=1, max_length=128)
    preferred_language: SupportedLanguage = "vi"
    preferred_categories: list[HeritageCategory] = Field(default_factory=list)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    avatar_url: Optional[str] = Field(default=None, max_length=1000)
    preferred_language: Optional[SupportedLanguage] = None
    preferred_categories: Optional[list[HeritageCategory]] = None


class ProfileOut(ORMBase):
    id: str
    email: Optional[str] = None
    display_name: str
    avatar_url: Optional[str] = None
    role: str = "user"
    preferred_language: str = "vi"
    preferred_categories: list[str] = Field(default_factory=list)
    total_verified_walking_seconds: int = 0
    total_verified_walking_meters: int = 0
    verified_sites_count: int = 0
    created_at: datetime


class AuthTokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    auth_provider: Literal["supabase", "local"] = "local"
    profile: ProfileOut


# ---------------------------------------------------------------------------
# Heritage Sites & Nearby Restaurants
# ---------------------------------------------------------------------------
class RestaurantOut(ORMBase):
    id: str
    site_id: str
    name: str
    cuisine: str
    specialty_dishes: list[str] = Field(default_factory=list)
    rating: float
    review_count: int
    price_range: str
    lat: float
    lng: float
    address: str
    open_hours: str
    meal_slots: list[str] = Field(default_factory=list)
    image_url: str
    distance_meters: Optional[float] = None


class RestaurantCreateRequest(BaseModel):
    id: Optional[str] = Field(default=None, max_length=128)
    site_id: str = Field(..., min_length=1, max_length=128)
    name: str = Field(..., min_length=1, max_length=255)
    cuisine: str = Field(default="Ẩm thực Sài Gòn", max_length=255)
    specialty_dishes: list[str] = Field(default_factory=list)
    rating: float = Field(default=4.5, ge=0.0, le=5.0)
    review_count: int = Field(default=0, ge=0)
    price_range: str = Field(default="35.000đ – 120.000đ", max_length=128)
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    address: str = Field(default="", max_length=500)
    open_hours: str = Field(default="07:00 – 21:00", max_length=128)
    meal_slots: list[MealSlot] = Field(default_factory=lambda: ["lunch", "dinner"])
    image_url: str = ""


class RestaurantUpdateRequest(BaseModel):
    site_id: Optional[str] = Field(default=None, max_length=128)
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    cuisine: Optional[str] = Field(default=None, max_length=255)
    specialty_dishes: Optional[list[str]] = None
    rating: Optional[float] = Field(default=None, ge=0.0, le=5.0)
    review_count: Optional[int] = Field(default=None, ge=0)
    price_range: Optional[str] = Field(default=None, max_length=128)
    lat: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    lng: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    address: Optional[str] = Field(default=None, max_length=500)
    open_hours: Optional[str] = Field(default=None, max_length=128)
    meal_slots: Optional[list[MealSlot]] = None
    image_url: Optional[str] = None


class HeritageSiteOut(ORMBase):
    id: str
    city: str
    district: Optional[str] = None
    lat: float
    lng: float
    category: str
    unesco_recognized: bool = False
    national_special_monument: bool = False
    rating: float
    review_count: int
    ticket_price: str
    address: Optional[str] = None
    cover_image: str
    recommended_visit_minutes: int = 45
    translations: dict[str, Any] = Field(default_factory=dict)
    media_gallery: list[dict[str, Any]] = Field(default_factory=list)
    nearby_restaurants: list[RestaurantOut] = Field(default_factory=list)
    distance_meters: Optional[float] = None
    updated_at: Optional[datetime] = None


class HeritageSiteListResponse(BaseModel):
    total: int
    items: list[HeritageSiteOut]


class HeritageSiteCreateRequest(BaseModel):
    id: str = Field(..., min_length=2, max_length=128)
    city: str = Field(..., min_length=1, max_length=128)
    district: Optional[str] = Field(default=None, max_length=128)
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    category: HeritageCategory
    unesco_recognized: bool = False
    national_special_monument: bool = False
    rating: float = Field(default=4.6, ge=0.0, le=5.0)
    review_count: int = Field(default=0, ge=0)
    ticket_price: str = Field(default="Miễn phí tham quan", max_length=255)
    address: Optional[str] = Field(default=None, max_length=500)
    cover_image: str = ""
    recommended_visit_minutes: int = Field(default=45, ge=10, le=300)
    translations: dict[str, Any] = Field(default_factory=dict)
    media_gallery: list[dict[str, Any]] = Field(default_factory=list)


class HeritageSiteUpdateRequest(BaseModel):
    city: Optional[str] = Field(default=None, max_length=128)
    district: Optional[str] = Field(default=None, max_length=128)
    lat: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    lng: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    category: Optional[HeritageCategory] = None
    unesco_recognized: Optional[bool] = None
    national_special_monument: Optional[bool] = None
    rating: Optional[float] = Field(default=None, ge=0.0, le=5.0)
    review_count: Optional[int] = Field(default=None, ge=0)
    ticket_price: Optional[str] = Field(default=None, max_length=255)
    address: Optional[str] = Field(default=None, max_length=500)
    cover_image: Optional[str] = None
    recommended_visit_minutes: Optional[int] = Field(default=None, ge=10, le=300)
    translations: Optional[dict[str, Any]] = None
    media_gallery: Optional[list[dict[str, Any]]] = None


class LocalizedSiteContentDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    shortSummary: str = Field(default="", max_length=4000)
    historicalEra: str = Field(default="", max_length=255)
    openingHours: str = Field(default="", max_length=255)
    architecturalHighlights: list[str] = Field(default_factory=list)
    audioScript: list[str] = Field(default_factory=list)


class AdminTranslateSiteRequest(BaseModel):
    source_language: SupportedLanguage = "vi"
    target_languages: list[SupportedLanguage] = Field(default_factory=list)
    source_content: LocalizedSiteContentDTO
    city: str = Field(default="TP. Hồ Chí Minh", max_length=255)
    address: str = Field(default="", max_length=500)


class AdminTranslateSiteResponse(BaseModel):
    source_language: SupportedLanguage
    translations: dict[SupportedLanguage, LocalizedSiteContentDTO] = Field(default_factory=dict)
    mode: Literal["gemini", "fallback"] = "fallback"
    note: str = ""


# ---------------------------------------------------------------------------
# Smart AI Pillar 1: Explainable Recommendations & 2-Opt Walking Tour Planner
# ---------------------------------------------------------------------------
class RecommendationRequest(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    language: SupportedLanguage = "vi"
    preferred_categories: list[HeritageCategory] = Field(default_factory=list)
    visited_site_ids: list[str] = Field(default_factory=list)
    max_results: int = Field(default=6, ge=1, le=50)
    current_hour: Optional[int] = Field(default=None, ge=0, le=23)
    radius_m: Optional[float] = Field(default=None, ge=100.0)


class ScoreBreakdown(BaseModel):
    distance_score: float
    novelty_score: float
    category_score: float
    rating_score: float
    status_score: float


class RecommendedSiteItem(BaseModel):
    site_id: str
    site_name: str
    city: str
    district: Optional[str] = None
    category: str
    lat: float
    lng: float
    cover_image: str = ""
    rating: float
    review_count: int
    distance_meters: float
    estimated_walk_minutes: int
    recommended_visit_minutes: int
    score: float
    score_breakdown: ScoreBreakdown
    reasons: list[str] = Field(default_factory=list)
    nearest_restaurant: Optional[RestaurantOut] = None


class RecommendationResponse(BaseModel):
    items: list[RecommendedSiteItem]
    recommended_restaurants: list[RestaurantOut] = Field(default_factory=list)
    context_summary: str


class TourPlanRequest(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    available_minutes: int = Field(default=120, ge=30, le=720)
    start_hour: int = Field(default=9, ge=0, le=23)
    preferred_categories: list[HeritageCategory] = Field(default_factory=list)
    visited_site_ids: list[str] = Field(default_factory=list)
    include_meal_stop: bool = True
    language: SupportedLanguage = "vi"
    max_stops: int = Field(default=5, ge=1, le=10)
    travel_mode: TravelMode = "walking"


class TourStopItem(BaseModel):
    order: int
    stop_type: Literal["heritage", "meal"]
    site_id: str
    name: str
    category: str
    lat: float
    lng: float
    cover_image: str = ""
    arrival_time: str
    departure_time: str
    stay_minutes: int
    walk_from_prev_meters: float
    walk_from_prev_minutes: int
    score: float = 0.0
    reasons: list[str] = Field(default_factory=list)
    meal_slot: Optional[str] = None
    specialty_dishes: list[str] = Field(default_factory=list)


class TourPlanResponse(BaseModel):
    stops: list[TourStopItem]
    total_sites: int
    total_walking_meters: float
    total_walking_minutes: int
    total_visit_minutes: int
    total_duration_minutes: int
    distance_saved_meters: float
    initial_distance_meters: float
    optimized_distance_meters: float
    optimization_method: str = "nearest_neighbor_2opt"
    route_polyline: list[list[float]] = Field(default_factory=list)
    meal_stop_included: bool = False
    travel_mode: TravelMode = "walking"
    summary: str


# ---------------------------------------------------------------------------
# Smart AI Pillar 2: Multilingual RAG Heritage Chatbot
# ---------------------------------------------------------------------------
class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AiChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    language: SupportedLanguage = "vi"
    site_id: Optional[str] = None
    lat: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    lng: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    history: list[ChatHistoryMessage] = Field(default_factory=list)


class ChatCitation(BaseModel):
    site_id: str
    site_name: str
    source_type: str
    snippet: str
    score: float


class AiChatResponse(BaseModel):
    answer: str
    language: SupportedLanguage
    citations: list[ChatCitation] = Field(default_factory=list)
    suggested_questions: list[str] = Field(default_factory=list)
    mode: Literal["gemini", "fallback"]


TtsProviderMode = Literal["auto", "neural", "offline"]


class TtsSynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4500)
    language: str = Field(default="vi", min_length=2, max_length=16)
    voice_gender: Literal["female", "male"] = "female"
    provider: TtsProviderMode = "auto"


# ---------------------------------------------------------------------------
# Smart AI Pillar 3: Vision AI & Anti-Fake Verifier
# ---------------------------------------------------------------------------
class VisionIdentifyRequest(BaseModel):
    image_base64: str = Field(..., min_length=16)
    mime_type: str = "image/jpeg"
    lat: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    lng: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    language: SupportedLanguage = "vi"


class VisionIdentifyResponse(BaseModel):
    matched_site_id: Optional[str] = None
    matched_site_name: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    architectural_cues: list[str] = Field(default_factory=list)
    auto_open_audio: bool = False
    candidate_count: int = 0
    mode: Literal["gemini_vision", "gps_fallback"]
    message: str = ""


class VerificationResult(BaseModel):
    status: VerificationStatus
    score: float = Field(..., ge=0.0, le=100.0)
    geofence_distance_meters: float
    average_speed_mps: float
    max_segment_jump_meters: float
    flags: list[str] = Field(default_factory=list)
    details: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Routing Proxy
# ---------------------------------------------------------------------------
class WalkingRouteRequest(BaseModel):
    origin_lat: float = Field(..., ge=-90.0, le=90.0)
    origin_lng: float = Field(..., ge=-180.0, le=180.0)
    dest_lat: float = Field(..., ge=-90.0, le=90.0)
    dest_lng: float = Field(..., ge=-180.0, le=180.0)
    target_id: str = ""
    target_name: str = ""
    target_type: Literal["heritage", "restaurant"] = "heritage"
    language: SupportedLanguage = "vi"
    travel_mode: TravelMode = "walking"


class RouteStepDTO(BaseModel):
    instruction: str
    distance_meters: float
    duration_seconds: float
    maneuver_type: Literal["depart", "turn-left", "turn-right", "straight", "arrive"] = "straight"


class WalkingRouteResponse(BaseModel):
    origin: list[float]
    destination: list[float]
    target_id: str
    target_name: str
    target_type: Literal["heritage", "restaurant"]
    coordinates: list[list[float]]
    total_distance_meters: float
    estimated_duration_seconds: float
    steps: list[RouteStepDTO]
    provider: Literal["osrm", "goong", "fallback"]
    cached: bool = False
    travel_mode: TravelMode = "walking"


# ---------------------------------------------------------------------------
# Journeys, Photos, Check-in & Badges
# ---------------------------------------------------------------------------
class JourneyPhotoOut(ORMBase):
    id: str
    journey_id: str
    site_id: str
    storage_path: str
    public_url: str
    caption: str = ""
    lat: float = 0.0
    lng: float = 0.0
    walking_duration_seconds_at_capture: int = 0
    vision_detected_site_id: Optional[str] = None
    vision_confidence: Optional[float] = None
    taken_at: datetime


class JourneyCheckInRequest(BaseModel):
    site_id: str = Field(..., min_length=1, max_length=128)
    checkin_lat: float = Field(..., ge=-90.0, le=90.0)
    checkin_lng: float = Field(..., ge=-180.0, le=180.0)
    walking_duration_seconds: int = Field(default=0, ge=0)
    walking_distance_meters: int = Field(default=0, ge=0)
    route_coordinates: list[list[float]] = Field(default_factory=list)
    user_note: str = Field(default="", max_length=2000)
    user_rating: int = Field(default=5, ge=1, le=5)
    is_simulated: bool = False
    travel_mode: TravelMode = "walking"
    vision_verified_site_id: Optional[str] = None
    vision_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    visited_at: Optional[datetime] = None


class JourneyOut(ORMBase):
    id: str
    user_id: str
    site_id: str
    site_name: str = ""
    city: str = ""
    cover_image: str = ""
    visited_at: datetime
    walking_duration_seconds: int
    walking_distance_meters: int
    route_coordinates: list[list[float]] = Field(default_factory=list)
    user_note: str = ""
    user_rating: int = 5
    travel_mode: TravelMode = "walking"
    verification_status: VerificationStatus = "verified"
    verification_score: float = 100.0
    verification_details: dict[str, Any] = Field(default_factory=dict)
    photos: list[JourneyPhotoOut] = Field(default_factory=list)


class BadgeOut(ORMBase):
    code: str
    title_vi: str
    title_en: str
    description_vi: str
    icon_name: str
    rule_config: dict[str, Any] = Field(default_factory=dict)
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None
    progress_percent: int = Field(default=0, ge=0, le=100)


class JourneyCheckInResponse(BaseModel):
    journey: JourneyOut
    verification: VerificationResult
    newly_unlocked_badges: list[BadgeOut] = Field(default_factory=list)
    profile_stats: dict[str, int] = Field(default_factory=dict)


class JourneyPhotoBase64Request(BaseModel):
    image_base64: str = Field(..., min_length=16)
    mime_type: str = "image/jpeg"
    caption: str = Field(default="", max_length=500)
    lat: float = 0.0
    lng: float = 0.0
    walking_duration_seconds_at_capture: int = Field(default=0, ge=0)
    vision_detected_site_id: Optional[str] = None
    vision_confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class JourneyBulkSyncRequest(BaseModel):
    journeys: list[JourneyCheckInRequest] = Field(..., min_length=1, max_length=50)


class JourneyBulkSyncResponse(BaseModel):
    synced_count: int
    journeys: list[JourneyOut]
    newly_unlocked_badges: list[BadgeOut] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------
class LeaderboardEntryOut(BaseModel):
    rank: int
    user_id: str
    display_name: str
    avatar_url: Optional[str] = None
    total_verified_walking_seconds: int
    total_verified_walking_meters: int
    verified_sites_count: int
    badges_count: int = 0
    effort_score: int = 0


class GlobalLeaderboardResponse(BaseModel):
    sort_by: Literal["walking_time", "walking_distance", "sites_count"]
    total_users: int
    entries: list[LeaderboardEntryOut]


class MyLeaderboardResponse(BaseModel):
    profile: ProfileOut
    rank: Optional[int] = None
    total_users: int
    unlocked_badges: list[BadgeOut] = Field(default_factory=list)
    upcoming_badges: list[BadgeOut] = Field(default_factory=list)
