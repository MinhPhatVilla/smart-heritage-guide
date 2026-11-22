"""Application settings powered by Pydantic Settings."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]
_PRISMA_ONLY_QUERY_PARAMS = {"pgbouncer", "schema", "connection_limit", "pool_timeout"}


class Settings(BaseSettings):
    """Typed environment configuration with safe local development defaults."""

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    APP_NAME: str = "Smart Heritage Guide API"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database: Supabase PostgreSQL (dùng chung cho cả Prisma ORM và FastAPI SQLAlchemy) hoặc SQLite fallback
    DATABASE_URL: str = f"sqlite+aiosqlite:///{(BACKEND_ROOT / 'local_dev.db').as_posix()}"
    DIRECT_URL: str = ""

    # Supabase Cloud (optional in local dev)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_STORAGE_BUCKET: str = "heritage-photos"

    # Local JWT fallback (used when SUPABASE_JWT_SECRET is unset)
    JWT_SECRET_KEY: str = "dev-smart-heritage-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days

    # Google Gemini API (optional — RAG & Vision provide smart fallbacks without it)
    GEMINI_API_KEY: str = ""
    GEMINI_CHAT_MODEL: str = "gemini-2.5-flash"
    GEMINI_VISION_MODEL: str = "gemini-2.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "text-embedding-004"

    # Routing proxy (OSRM -> Goong -> Offline Haversine)
    GOONG_API_KEY: str = ""
    OSRM_BASE_URL: str = "https://routing.openstreetmap.de/routed-foot"
    ROUTE_CACHE_TTL_DAYS: int = 7

    # CORS & Static Uploads
    CORS_ORIGINS: str = "*"
    LOCAL_UPLOAD_DIR: str = "uploads"
    PUBLIC_BASE_URL: str = "http://localhost:8000"

    # Seed default accounts
    DEFAULT_ADMIN_EMAIL: str = "admin@smartheritage.vn"
    DEFAULT_ADMIN_PASSWORD: str = "AdminHeritage@2026"
    DEFAULT_DEMO_EMAIL: str = "demo@smartheritage.vn"
    DEFAULT_DEMO_PASSWORD: str = "DemoHeritage@2026"

    @property
    def async_database_url(self) -> str:
        fallback_sqlite = f"sqlite+aiosqlite:///{(BACKEND_ROOT / 'local_dev.db').as_posix()}"
        url = (self.DATABASE_URL or "").strip()
        if not url or "[YOUR-PASSWORD]" in url or "<password>" in url:
            return fallback_sqlite
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://") :]
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = "postgresql+asyncpg://" + url[len("postgresql://") :]

        # Loại bỏ các query params chỉ dành riêng cho Prisma/PgBouncer (?pgbouncer=true, ?schema=public...)
        # để asyncpg không báo lỗi unexpected keyword argument khi dùng chung backend/.env với Prisma.
        if url.startswith("postgresql") and "?" in url:
            try:
                parts = urlsplit(url)
                filtered = [
                    (k, v)
                    for k, v in parse_qsl(parts.query, keep_blank_values=True)
                    if k.lower() not in _PRISMA_ONLY_QUERY_PARAMS
                ]
                url = urlunsplit(
                    (parts.scheme, parts.netloc, parts.path, urlencode(filtered), parts.fragment)
                )
            except ValueError:
                return fallback_sqlite
        return url

    @property
    def is_postgres(self) -> bool:
        return self.async_database_url.startswith("postgresql")

    @property
    def is_sqlite(self) -> bool:
        return self.async_database_url.startswith("sqlite")

    @property
    def has_supabase_auth(self) -> bool:
        return bool(self.SUPABASE_URL.strip() and self.SUPABASE_ANON_KEY.strip())

    @property
    def has_supabase_storage(self) -> bool:
        return bool(
            self.SUPABASE_URL.strip()
            and (self.SUPABASE_SERVICE_ROLE_KEY.strip() or self.SUPABASE_ANON_KEY.strip())
        )

    @property
    def has_gemini(self) -> bool:
        return bool(self.GEMINI_API_KEY.strip())

    @property
    def has_goong(self) -> bool:
        return bool(self.GOONG_API_KEY.strip())

    @property
    def effective_jwt_secret(self) -> str:
        return self.SUPABASE_JWT_SECRET.strip() or self.JWT_SECRET_KEY

    @property
    def cors_origins_list(self) -> List[str]:
        raw = (self.CORS_ORIGINS or "*").strip()
        if raw == "*":
            return ["*"]
        return [item.strip() for item in raw.split(",") if item.strip()]

    @property
    def upload_dir_path(self) -> Path:
        p = Path(self.LOCAL_UPLOAD_DIR)
        if not p.is_absolute():
            p = BACKEND_ROOT / p
        return p


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
