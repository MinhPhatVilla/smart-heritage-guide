"""Photo storage service: Supabase Storage (`heritage-photos`) + local `uploads/` fallback."""

from __future__ import annotations

import base64
import mimetypes
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import httpx

from app.core.config import settings


@dataclass
class StoredPhotoResult:
    storage_path: str
    public_url: str
    provider: str  # "supabase" | "local"
    size_bytes: int
    mime_type: str


def decode_base64_image(image_base64: str, fallback_mime: str = "image/jpeg") -> tuple[bytes, str]:
    """Decode raw base64 or `data:image/...;base64,...` string into `(raw_bytes, mime_type)`."""
    mime_type = fallback_mime
    payload = image_base64.strip()
    if payload.startswith("data:") and "," in payload:
        header, payload = payload.split(",", 1)
        if ";" in header:
            mime_candidate = header[5:].split(";", 1)[0].strip()
            if mime_candidate:
                mime_type = mime_candidate
    raw = base64.b64decode(payload)
    return raw, mime_type


def _extension_for_mime(mime_type: str, filename: Optional[str] = None) -> str:
    if filename and "." in filename:
        ext = "." + filename.rsplit(".", 1)[-1].lower()
        if len(ext) <= 6:
            return ext
    guessed = mimetypes.guess_extension(mime_type) or ".jpg"
    if guessed == ".jpe":
        return ".jpg"
    return guessed


async def upload_journey_photo(
    *,
    user_id: str,
    journey_id: str,
    content: bytes,
    mime_type: str = "image/jpeg",
    filename: Optional[str] = None,
) -> StoredPhotoResult:
    """Upload a photo to Supabase Storage bucket `heritage-photos`, falling back to local `uploads/`."""
    ext = _extension_for_mime(mime_type, filename)
    unique_name = f"{uuid.uuid4().hex}{ext}"
    storage_path = f"{user_id}/{journey_id}/{unique_name}"

    if settings.has_supabase_storage:
        bucket = settings.SUPABASE_STORAGE_BUCKET
        api_key = settings.SUPABASE_SERVICE_ROLE_KEY.strip() or settings.SUPABASE_ANON_KEY.strip()
        base_url = settings.SUPABASE_URL.rstrip("/")
        upload_url = f"{base_url}/storage/v1/object/{bucket}/{storage_path}"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "apikey": api_key,
            "Content-Type": mime_type,
            "x-upsert": "true",
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(upload_url, headers=headers, content=content)
                if resp.status_code in (200, 201):
                    public_url = f"{base_url}/storage/v1/object/public/{bucket}/{storage_path}"
                    return StoredPhotoResult(
                        storage_path=storage_path,
                        public_url=public_url,
                        provider="supabase",
                        size_bytes=len(content),
                        mime_type=mime_type,
                    )
        except Exception:
            # Fall through cleanly to local storage so uploads never crash during demo
            pass

    # Local fallback: save under `<backend>/uploads/<user_id>/<journey_id>/<file>`
    target_path: Path = settings.upload_dir_path / storage_path
    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_bytes(content)

    public_base = settings.PUBLIC_BASE_URL.rstrip("/")
    public_url = f"{public_base}/uploads/{storage_path}"
    return StoredPhotoResult(
        storage_path=storage_path,
        public_url=public_url,
        provider="local",
        size_bytes=len(content),
        mime_type=mime_type,
    )
