"""SQLAlchemy 2.0 Async ORM entities for Smart Heritage Guide.

Portable across both Supabase PostgreSQL (with PostGIS/pgvector SQL migration)
and local SQLite (`sqlite+aiosqlite`) fallback for zero-friction local dev & pytest.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid_str() -> str:
    return str(uuid.uuid4())


class Profile(Base):
    """User profile linked to Supabase `auth.users.id` (or local JWT auth fallback)."""

    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=_uuid_str)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False, default="Khách Du Lịch")
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="user", index=True)
    preferred_language: Mapped[str] = mapped_column(String(8), nullable=False, default="vi")
    preferred_categories: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    total_verified_walking_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_verified_walking_meters: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    verified_sites_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)

    journeys: Mapped[list["VisitedJourney"]] = relationship(
        "VisitedJourney", back_populates="user", cascade="all, delete-orphan"
    )
    photos: Mapped[list["JourneyPhoto"]] = relationship(
        "JourneyPhoto", back_populates="user", cascade="all, delete-orphan"
    )
    user_badges: Mapped[list["UserBadge"]] = relationship(
        "UserBadge", back_populates="user", cascade="all, delete-orphan"
    )


class HeritageSite(Base):
    """Heritage site catalog entity matching Mobile `HeritageSite` schema."""

    __tablename__ = "heritage_sites"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    district: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    unesco_recognized: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    national_special_monument: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=4.5)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ticket_price: Mapped[str] = mapped_column(String(255), nullable=False, default="Miễn phí tham quan")
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cover_image: Mapped[str] = mapped_column(Text, nullable=False, default="")
    recommended_visit_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=45)
    translations: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    media_gallery: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    restaurants: Mapped[list["Restaurant"]] = relationship(
        "Restaurant", back_populates="site", cascade="all, delete-orphan"
    )
    knowledge_chunks: Mapped[list["HeritageKnowledgeChunk"]] = relationship(
        "HeritageKnowledgeChunk", back_populates="site", cascade="all, delete-orphan"
    )
    journeys: Mapped[list["VisitedJourney"]] = relationship(
        "VisitedJourney", back_populates="site", cascade="all, delete-orphan"
    )


class Restaurant(Base):
    """Nearby culinary / restaurant entity linked to a heritage site."""

    __tablename__ = "restaurants"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    site_id: Mapped[str] = mapped_column(
        String(128), ForeignKey("heritage_sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cuisine: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    specialty_dishes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=4.5)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    price_range: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    open_hours: Mapped[str] = mapped_column(String(128), nullable=False, default="07:00 – 21:00")
    meal_slots: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    image_url: Mapped[str] = mapped_column(Text, nullable=False, default="")

    site: Mapped["HeritageSite"] = relationship("HeritageSite", back_populates="restaurants")


class HeritageKnowledgeChunk(Base):
    """Chunked multilingual knowledge base for Hybrid RAG retrieval."""

    __tablename__ = "heritage_knowledge_chunks"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=_uuid_str)
    site_id: Mapped[str] = mapped_column(
        String(128), ForeignKey("heritage_sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    language: Mapped[str] = mapped_column(String(8), nullable=False, default="vi", index=True)
    source_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default="summary", index=True
    )  # summary | script | architecture | restaurant
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding_json: Mapped[Optional[list[float]]] = mapped_column(JSON, nullable=True)

    site: Mapped["HeritageSite"] = relationship("HeritageSite", back_populates="knowledge_chunks")


class VisitedJourney(Base):
    """Completed walking journey & check-in record with anti-fake verification."""

    __tablename__ = "visited_journeys"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=_uuid_str)
    user_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    site_id: Mapped[str] = mapped_column(
        String(128), ForeignKey("heritage_sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    visited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    walking_duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    walking_distance_meters: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    route_coordinates: Mapped[list[list[float]]] = mapped_column(JSON, nullable=False, default=list)
    user_note: Mapped[str] = mapped_column(Text, nullable=False, default="")
    user_rating: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    verification_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="verified", index=True
    )  # verified | simulated | flagged
    verification_score: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    verification_details: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

    user: Mapped["Profile"] = relationship("Profile", back_populates="journeys")
    site: Mapped["HeritageSite"] = relationship("HeritageSite", back_populates="journeys")
    photos: Mapped[list["JourneyPhoto"]] = relationship(
        "JourneyPhoto", back_populates="journey", cascade="all, delete-orphan"
    )


class JourneyPhoto(Base):
    """Photo attached to a visited journey, stored in Supabase Storage or local uploads."""

    __tablename__ = "journey_photos"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=_uuid_str)
    journey_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=False),
        ForeignKey("visited_journeys.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    site_id: Mapped[str] = mapped_column(
        String(128), ForeignKey("heritage_sites.id", ondelete="CASCADE"), nullable=False, index=True
    )
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    public_url: Mapped[str] = mapped_column(Text, nullable=False, default="")
    caption: Mapped[str] = mapped_column(Text, nullable=False, default="")
    lat: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    lng: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    walking_duration_seconds_at_capture: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    vision_detected_site_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    vision_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    taken_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)

    journey: Mapped["VisitedJourney"] = relationship("VisitedJourney", back_populates="photos")
    user: Mapped["Profile"] = relationship("Profile", back_populates="photos")
    site: Mapped["HeritageSite"] = relationship("HeritageSite")


class Badge(Base):
    """Achievement badge definition."""

    __tablename__ = "badges"

    code: Mapped[str] = mapped_column(String(64), primary_key=True)
    title_vi: Mapped[str] = mapped_column(String(128), nullable=False)
    title_en: Mapped[str] = mapped_column(String(128), nullable=False)
    description_vi: Mapped[str] = mapped_column(Text, nullable=False)
    icon_name: Mapped[str] = mapped_column(String(64), nullable=False, default="award")
    rule_config: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

    user_badges: Mapped[list["UserBadge"]] = relationship(
        "UserBadge", back_populates="badge", cascade="all, delete-orphan"
    )


class UserBadge(Base):
    """Unlocked badge award for a specific user."""

    __tablename__ = "user_badges"
    __table_args__ = (UniqueConstraint("user_id", "badge_code", name="uq_user_badge"),)

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=_uuid_str)
    user_id: Mapped[str] = mapped_column(
        Uuid(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    badge_code: Mapped[str] = mapped_column(
        String(64), ForeignKey("badges.code", ondelete="CASCADE"), nullable=False, index=True
    )
    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)

    user: Mapped["Profile"] = relationship("Profile", back_populates="user_badges")
    badge: Mapped["Badge"] = relationship("Badge", back_populates="user_badges")


class RouteCache(Base):
    """Cached walking route payload for Backend Routing Proxy."""

    __tablename__ = "route_cache"

    cache_key: Mapped[str] = mapped_column(String(128), primary_key=True)
    origin_lat: Mapped[float] = mapped_column(Float, nullable=False)
    origin_lng: Mapped[float] = mapped_column(Float, nullable=False)
    dest_lat: Mapped[float] = mapped_column(Float, nullable=False)
    dest_lng: Mapped[float] = mapped_column(Float, nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False, default="osrm")
    route_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
