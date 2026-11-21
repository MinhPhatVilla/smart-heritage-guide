"""Async SQLAlchemy engine, session factory, and dual-DB lifecycle helpers."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """Base declarative class for all ORM entities."""


def _build_engine() -> AsyncEngine:
    db_url = settings.async_database_url
    kwargs: dict[str, Any] = {
        "echo": False,
        "future": True,
        "pool_pre_ping": True,
    }
    if settings.is_postgres:
        # Compatible with Supabase PgBouncer transaction pooling (port 6543)
        kwargs["connect_args"] = {"statement_cache_size": 0}
    else:
        kwargs["connect_args"] = {"check_same_thread": False}
    return create_async_engine(db_url, **kwargs)


engine: AsyncEngine = _build_engine()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Create all ORM tables cleanly (idempotent for SQLite local dev and Postgres)."""
    # Import entities so all models register on Base.metadata
    import app.models.entities  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Dispose database connection pool gracefully on shutdown."""
    await engine.dispose()


async def check_db_health() -> dict[str, Any]:
    """Check DB connectivity and PostGIS / pgvector extension availability."""
    info: dict[str, Any] = {
        "connected": False,
        "dialect": "postgresql" if settings.is_postgres else "sqlite",
        "postgis_enabled": False,
        "pgvector_enabled": False,
    }
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            info["connected"] = True
            if settings.is_postgres:
                res = await session.execute(
                    text(
                        "SELECT extname FROM pg_extension "
                        "WHERE extname IN ('postgis', 'vector')"
                    )
                )
                exts = {row[0] for row in res.fetchall()}
                info["postgis_enabled"] = "postgis" in exts
                info["pgvector_enabled"] = "vector" in exts
    except Exception as exc:  # pragma: no cover - defensive health check
        info["error"] = str(exc)
    return info
