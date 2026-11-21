"""Authentication & user profile router (`/api/v1/auth/*`)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    supabase_sign_in,
    supabase_sign_up,
    verify_password,
)
from app.models.entities import Profile
from app.schemas.dto import (
    AuthTokenResponse,
    LoginRequest,
    ProfileOut,
    ProfileUpdateRequest,
    RegisterRequest,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Đăng ký tài khoản mới (Supabase Auth hoặc Local JWT)",
)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthTokenResponse:
    """Register a new explorer account, create its `profiles` record, and return JWT tokens."""
    normalized_email = payload.email.strip().lower()

    existing = await db.execute(select(Profile).where(Profile.email == normalized_email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email này đã được đăng ký. Vui lòng đăng nhập.",
        )

    access_token: str
    refresh_token: str | None = None
    expires_in: int
    auth_provider = "local"
    user_id = str(uuid.uuid4())

    if settings.has_supabase_auth:
        supa_data = await supabase_sign_up(
            email=normalized_email,
            password=payload.password,
            display_name=payload.display_name,
            preferred_language=payload.preferred_language,
        )
        assert supa_data is not None
        supa_user = supa_data.get("user") or supa_data
        if supa_user.get("id"):
            user_id = str(supa_user["id"])
        if supa_data.get("access_token"):
            access_token = str(supa_data["access_token"])
            refresh_token = supa_data.get("refresh_token")
            expires_in = int(supa_data.get("expires_in", 3600))
            auth_provider = "supabase"
        else:
            # Supabase project may require email confirmation; issue local app token for immediate UX
            access_token, expires_in = create_access_token(user_id=user_id, email=normalized_email, role="user")
            auth_provider = "supabase"
        password_hash = None
    else:
        password_hash = hash_password(payload.password)
        access_token, expires_in = create_access_token(user_id=user_id, email=normalized_email, role="user")

    profile = await db.get(Profile, user_id)
    if profile is not None:
        # Row may already be auto-provisioned by Supabase `on_auth_user_created` trigger
        profile.email = normalized_email
        profile.display_name = payload.display_name.strip()
        profile.preferred_language = payload.preferred_language
        profile.preferred_categories = list(payload.preferred_categories)
        if password_hash is not None:
            profile.password_hash = password_hash
        db.add(profile)
    else:
        profile = Profile(
            id=user_id,
            email=normalized_email,
            password_hash=password_hash,
            display_name=payload.display_name.strip(),
            role="user",
            preferred_language=payload.preferred_language,
            preferred_categories=list(payload.preferred_categories),
        )
        db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return AuthTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=expires_in,
        auth_provider=auth_provider,
        profile=ProfileOut.model_validate(profile),
    )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    summary="Đăng nhập lấy JWT Access Token (dùng cho nút Authorize trên Swagger)",
)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthTokenResponse:
    """Authenticate an existing account via Supabase GoTrue or local PBKDF2 + JWT."""
    normalized_email = payload.email.strip().lower()

    if settings.has_supabase_auth:
        supa_data = await supabase_sign_in(normalized_email, payload.password)
        assert supa_data is not None
        supa_user = supa_data.get("user") or {}
        user_id = str(supa_user.get("id") or "")
        result = await db.execute(select(Profile).where(Profile.id == user_id))
        profile = result.scalar_one_or_none()
        if profile is None:
            meta = supa_user.get("user_metadata") or {}
            profile = Profile(
                id=user_id or str(uuid.uuid4()),
                email=normalized_email,
                display_name=meta.get("display_name") or normalized_email.split("@")[0],
                preferred_language=meta.get("preferred_language", "vi"),
                preferred_categories=[],
                role="user",
            )
            db.add(profile)
            await db.commit()
            await db.refresh(profile)
        return AuthTokenResponse(
            access_token=str(supa_data["access_token"]),
            refresh_token=supa_data.get("refresh_token"),
            token_type="bearer",
            expires_in=int(supa_data.get("expires_in", 3600)),
            auth_provider="supabase",
            profile=ProfileOut.model_validate(profile),
        )

    result = await db.execute(select(Profile).where(Profile.email == normalized_email))
    profile = result.scalar_one_or_none()
    if profile is None or not verify_password(payload.password, profile.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng.",
        )

    access_token, expires_in = create_access_token(
        user_id=profile.id,
        email=profile.email,
        role=profile.role,
    )
    return AuthTokenResponse(
        access_token=access_token,
        refresh_token=None,
        token_type="bearer",
        expires_in=expires_in,
        auth_provider="local",
        profile=ProfileOut.model_validate(profile),
    )


@router.get("/me", response_model=ProfileOut, summary="Lấy hồ sơ, thống kê đi bộ & sở thích hiện tại")
async def get_me(current_user: Profile = Depends(get_current_user)) -> ProfileOut:
    """Return the authenticated user's profile and verified walking statistics."""
    return ProfileOut.model_validate(current_user)


@router.patch("/me", response_model=ProfileOut, summary="Cập nhật tên hiển thị, ngôn ngữ & danh mục yêu thích")
async def update_me(
    payload: ProfileUpdateRequest,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileOut:
    """Update profile display name, avatar URL, preferred language, or preferred categories."""
    if payload.display_name is not None:
        current_user.display_name = payload.display_name.strip()
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url.strip() or None
    if payload.preferred_language is not None:
        current_user.preferred_language = payload.preferred_language
    if payload.preferred_categories is not None:
        current_user.preferred_categories = list(payload.preferred_categories)

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return ProfileOut.model_validate(current_user)
