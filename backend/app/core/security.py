"""Authentication & Authorization security layer.

Supports:
1. Supabase Auth (GoTrue HTTP API) when SUPABASE_URL & SUPABASE_ANON_KEY are configured.
2. Local JWT + PBKDF2-SHA256 password hashing fallback when running locally without Supabase keys.
3. Swagger UI HTTPBearer Authorize support with Guest / User / Admin dependencies:
   - `get_optional_user` -> Optional[Profile] (Guest mode allowed)
   - `get_current_user`  -> Profile (401 if unauthenticated)
   - `require_admin`     -> Profile (403 if role != 'admin')
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.entities import Profile

bearer_scheme = HTTPBearer(
    scheme_name="BearerAuth",
    description="JWT Access Token from POST /api/v1/auth/login or /auth/register",
    auto_error=False,
)

_PBKDF2_ITERATIONS = 120_000


def hash_password(password: str) -> str:
    """Hash a plaintext password using PBKDF2-HMAC-SHA256 with a random 16-byte salt."""
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), _PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${_PBKDF2_ITERATIONS}${salt}${dk.hex()}"


def verify_password(password: str, stored_hash: Optional[str]) -> bool:
    """Verify a plaintext password against a stored PBKDF2 hash."""
    if not stored_hash or "$" not in stored_hash:
        return False
    parts = stored_hash.split("$")
    if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
        return False
    _, iter_str, salt, expected_hex = parts
    try:
        iterations = int(iter_str)
    except ValueError:
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return hmac.compare_digest(dk.hex(), expected_hex)


def create_access_token(
    user_id: str,
    email: Optional[str] = None,
    role: str = "user",
    expires_minutes: Optional[int] = None,
) -> tuple[str, int]:
    """Create a signed HS256 JWT access token and return (token, expires_in_seconds)."""
    exp_minutes = expires_minutes or settings.JWT_EXPIRE_MINUTES
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=exp_minutes)
    payload: dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "role": role,
        "aud": "authenticated",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "iss": "smart-heritage-guide",
    }
    token = jwt.encode(payload, settings.effective_jwt_secret, algorithm=settings.JWT_ALGORITHM)
    return token, exp_minutes * 60


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """Decode and validate JWT signature & expiration using configured secret(s)."""
    secrets_to_try = [settings.effective_jwt_secret]
    if settings.JWT_SECRET_KEY not in secrets_to_try:
        secrets_to_try.append(settings.JWT_SECRET_KEY)

    for secret in secrets_to_try:
        if not secret:
            continue
        try:
            return jwt.decode(
                token,
                secret,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_aud": False},
            )
        except jwt.PyJWTError:
            continue
    return None


async def _verify_with_supabase_gotrue(token: str) -> Optional[dict[str, Any]]:
    """Fallback token verification via Supabase GoTrue /auth/v1/user when JWT secret isn't local."""
    if not settings.has_supabase_auth:
        return None
    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": settings.SUPABASE_ANON_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "sub": data.get("id"),
                    "email": data.get("email"),
                    "user_metadata": data.get("user_metadata") or {},
                }
    except Exception:
        return None
    return None


async def supabase_sign_up(
    email: str,
    password: str,
    display_name: str,
    preferred_language: str = "vi",
) -> Optional[dict[str, Any]]:
    """Register a user via Supabase Auth (GoTrue). Returns payload or None if not configured."""
    if not settings.has_supabase_auth:
        return None
    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/signup"
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    body = {
        "email": email,
        "password": password,
        "data": {
            "display_name": display_name,
            "preferred_language": preferred_language,
        },
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, headers=headers, json=body)
        if resp.status_code >= 400:
            detail = resp.json().get("msg") or resp.json().get("error_description") or resp.text
            raise HTTPException(status_code=resp.status_code, detail=f"Supabase Auth signup error: {detail}")
        return resp.json()


async def supabase_sign_in(email: str, password: str) -> Optional[dict[str, Any]]:
    """Authenticate a user via Supabase Auth (GoTrue password grant)."""
    if not settings.has_supabase_auth:
        return None
    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    body = {"email": email, "password": password}
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, headers=headers, json=body)
        if resp.status_code >= 400:
            detail = resp.json().get("error_description") or resp.json().get("msg") or "Invalid credentials"
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)
        return resp.json()


async def _resolve_profile_from_token(token: str, db: AsyncSession) -> Optional[Profile]:
    """Decode Bearer token and load (or auto-provision for Supabase users) the Profile."""
    payload = decode_access_token(token)
    if payload is None:
        payload = await _verify_with_supabase_gotrue(token)
    if not payload or not payload.get("sub"):
        return None

    user_id = str(payload["sub"])
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()

    if profile is None and settings.has_supabase_auth:
        # Auto-provision local profile row for newly verified Supabase Auth user
        meta = payload.get("user_metadata") or {}
        email = payload.get("email")
        profile = Profile(
            id=user_id,
            email=email,
            display_name=meta.get("display_name") or (email.split("@")[0] if email else "Khách Du Lịch"),
            preferred_language=meta.get("preferred_language", "vi"),
            preferred_categories=[],
            role="user",
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[Profile]:
    """FastAPI dependency: returns authenticated Profile or None for Guest mode."""
    if not credentials or not credentials.credentials:
        return None
    return await _resolve_profile_from_token(credentials.credentials, db)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    """FastAPI dependency: requires a valid Bearer JWT and returns the user's Profile."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please login via /api/v1/auth/login.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    profile = await _resolve_profile_from_token(credentials.credentials, db)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return profile


async def require_admin(
    current_user: Profile = Depends(get_current_user),
) -> Profile:
    """FastAPI dependency: enforces `role == 'admin'` for Admin CRUD routes."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required for this operation.",
        )
    return current_user
