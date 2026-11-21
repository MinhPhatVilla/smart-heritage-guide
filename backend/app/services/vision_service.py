"""Vision AI Heritage Site Recognition Service (Pillar 3).

Pipeline:
1. Decode base64 / raw image bytes cleanly.
2. Pre-filter Top-8 candidate heritage sites nearest to optional `(lat, lng)`
   (or up to 20 sites when GPS is unavailable) to maximize accuracy and minimize tokens.
3. Call `google-genai` Vision (`gemini-2.5-flash`) with structured JSON output returning
   `{ matched_site_id, matched_site_name, confidence, architectural_cues, auto_open_audio, mode }`.
4. Clean GPS proximity fallback (`mode="gps_fallback"`) when `GEMINI_API_KEY` is unset or quota fails.
"""

from __future__ import annotations

import asyncio
import binascii
import json
import re
from typing import Any, Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.entities import HeritageSite
from app.schemas.dto import SupportedLanguage, VisionIdentifyRequest, VisionIdentifyResponse
from app.services.geo_service import haversine_meters, query_site_distances_postgis
from app.services.recommendation_service import get_localized_site_field, get_localized_site_name
from app.services.storage_service import decode_base64_image

MAX_GPS_CANDIDATES = 8
MAX_NO_GPS_CANDIDATES = 20
AUTO_OPEN_AUDIO_THRESHOLD = 0.70


def select_vision_candidates(
    sites: Sequence[Any],
    *,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    postgis_distances: Optional[dict[str, float]] = None,
) -> list[tuple[Any, Optional[float]]]:
    """Pre-filter top-8 nearest sites when GPS is provided, or up to 20 sites otherwise."""
    if not sites:
        return []

    if lat is not None and lng is not None:
        with_dist: list[tuple[Any, float]] = []
        for site in sites:
            sid = str(getattr(site, "id"))
            if postgis_distances and sid in postgis_distances:
                dist = float(postgis_distances[sid])
            else:
                dist = haversine_meters(lat, lng, float(site.lat), float(site.lng))
            with_dist.append((site, round(dist, 2)))
        with_dist.sort(key=lambda pair: pair[1])
        return [(s, d) for s, d in with_dist[:MAX_GPS_CANDIDATES]]

    return [(s, None) for s in list(sites)[:MAX_NO_GPS_CANDIDATES]]


def _build_gps_fallback_response(
    candidates: list[tuple[Any, Optional[float]]],
    *,
    lat: Optional[float],
    lng: Optional[float],
    language: SupportedLanguage,
    reason_note: str = "",
) -> VisionIdentifyResponse:
    """Clean proximity-based fallback when Gemini Vision API key is unset or unavailable."""
    cand_count = len(candidates)
    if lat is None or lng is None or not candidates:
        msg = {
            "vi": "Chế độ GPS Fallback: chưa cấu hình GEMINI_API_KEY và không có tọa độ GPS để gợi ý di tích gần nhất.",
            "en": "GPS Fallback mode: GEMINI_API_KEY is not configured and no GPS coordinates were provided.",
            "fr": "Mode secours GPS : GEMINI_API_KEY n'est pas configuré et aucune position GPS n'est fournie.",
            "zh": "GPS 回退模式：未配置 GEMINI_API_KEY 且未提供 GPS 坐标，无法定位最近景点。",
            "ja": "GPSフォールバックモード：GEMINI_API_KEYが未設定で、GPS座標も指定されていません。",
        }[language]
        return VisionIdentifyResponse(
            matched_site_id=None,
            matched_site_name=None,
            confidence=0.0,
            architectural_cues=[],
            auto_open_audio=False,
            candidate_count=cand_count,
            mode="gps_fallback",
            message=msg,
        )

    nearest_site, dist_m = candidates[0]
    dist_val = float(dist_m or 0.0)
    site_name = get_localized_site_name(nearest_site, language)
    highlights = get_localized_site_field(nearest_site, language, "architecturalHighlights", [])
    cues = [str(h) for h in highlights[:3]] if isinstance(highlights, list) else []

    if dist_val <= 80.0:
        confidence = 0.86
    elif dist_val <= 200.0:
        confidence = 0.76
    elif dist_val <= 500.0:
        confidence = 0.62
    elif dist_val <= 1500.0:
        confidence = 0.45
    else:
        confidence = 0.25

    auto_open = confidence >= AUTO_OPEN_AUDIO_THRESHOLD
    dist_label = f"{int(round(dist_val))}m" if dist_val < 1000 else f"{dist_val / 1000.0:.1f}km"

    msg = {
        "vi": f"Chế độ GPS Fallback: Gợi ý di tích gần bạn nhất là {site_name} (cách {dist_label}).",
        "en": f"GPS Fallback mode: Nearest heritage site is {site_name} ({dist_label} away).",
        "fr": f"Mode secours GPS : Site patrimonial le plus proche — {site_name} (à {dist_label}).",
        "zh": f"GPS 回退模式：距离您最近的历史景点为「{site_name}」（相距 {dist_label}）。",
        "ja": f"GPSフォールバックモード：最寄りの歴史スポットは「{site_name}」（距離 {dist_label}）です。",
    }[language]
    if reason_note:
        msg = f"{msg} ({reason_note})"

    return VisionIdentifyResponse(
        matched_site_id=str(nearest_site.id),
        matched_site_name=site_name,
        confidence=confidence,
        architectural_cues=cues,
        auto_open_audio=auto_open,
        candidate_count=cand_count,
        mode="gps_fallback",
        message=msg,
    )


async def _call_gemini_vision(
    *,
    image_bytes: bytes,
    mime_type: str,
    candidates: list[tuple[Any, Optional[float]]],
    language: SupportedLanguage,
) -> Optional[VisionIdentifyResponse]:
    """Identify a heritage site using `google-genai` (`gemini-2.5-flash`) with structured JSON."""
    if not settings.has_gemini or not candidates:
        return None

    candidate_lines = []
    candidate_map: dict[str, Any] = {}
    for site, dist_m in candidates:
        sid = str(site.id)
        candidate_map[sid] = site
        name_vi = get_localized_site_name(site, "vi")
        name_en = get_localized_site_name(site, "en")
        highlights = get_localized_site_field(site, "en", "architecturalHighlights", []) or []
        arch_str = "; ".join(str(h) for h in highlights[:3]) if isinstance(highlights, list) else ""
        dist_txt = f", distance={int(round(dist_m))}m" if dist_m is not None else ""
        candidate_lines.append(
            f"- id: \"{sid}\" | name_vi: \"{name_vi}\" | name_en: \"{name_en}\" | "
            f"category: {site.category}{dist_txt} | cues: {arch_str}"
        )

    lang_hint = {
        "vi": "Vietnamese",
        "en": "English",
        "fr": "French",
        "zh": "Simplified Chinese",
        "ja": "Japanese",
    }.get(language, "Vietnamese")

    prompt = (
        "You are a Ho Chi Minh City heritage landmark visual recognition system.\n"
        "Inspect the provided photograph and determine whether it depicts one of the following candidate heritage sites:\n"
        + "\n".join(candidate_lines)
        + "\n\nRules:\n"
        "1. If the photo clearly matches one candidate site, set `matched_site_id` to its exact `id`.\n"
        "2. If the photo does NOT show any of these heritage landmarks, set `matched_site_id` to null and `confidence` <= 0.35.\n"
        f"3. Write `architectural_cues` (2-4 concise visual cues seen in the image) and `message` in {lang_hint}.\n"
        "4. Return STRICT JSON ONLY matching schema:\n"
        '{"matched_site_id": "<id or null>", "confidence": 0.0, "architectural_cues": ["..."], "message": "..."}'
    )

    try:
        from google import genai
        from google.genai import types

        def _call() -> str:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            resp = client.models.generate_content(
                model=settings.GEMINI_VISION_MODEL,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt,
                ],
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json",
                ),
            )
            return getattr(resp, "text", "") or ""

        raw_text = await asyncio.to_thread(_call)
        if not raw_text.strip():
            return None

        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.DOTALL).strip()

        parsed = json.loads(cleaned)
        matched_id = parsed.get("matched_site_id")
        if matched_id is not None:
            matched_id = str(matched_id).strip() or None
        if matched_id and matched_id not in candidate_map:
            matched_id = None

        confidence = float(parsed.get("confidence", 0.0))
        confidence = round(max(0.0, min(1.0, confidence)), 3)

        raw_cues = parsed.get("architectural_cues")
        cues = [str(c).strip() for c in raw_cues if str(c).strip()][:5] if isinstance(raw_cues, list) else []

        matched_name = (
            get_localized_site_name(candidate_map[matched_id], language)
            if matched_id and matched_id in candidate_map
            else None
        )
        auto_open = bool(matched_id and confidence >= AUTO_OPEN_AUDIO_THRESHOLD)
        msg = str(parsed.get("message") or "").strip()
        if not msg:
            msg = (
                f"Nhận diện {matched_name} ({int(round(confidence * 100))}%)"
                if matched_name
                else "Không nhận diện được di tích trong danh sách ứng viên."
            )

        return VisionIdentifyResponse(
            matched_site_id=matched_id,
            matched_site_name=matched_name,
            confidence=confidence,
            architectural_cues=cues,
            auto_open_audio=auto_open,
            candidate_count=len(candidates),
            mode="gemini_vision",
            message=msg,
        )
    except Exception:
        return None


async def identify_site_from_bytes(
    db: AsyncSession,
    *,
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    language: SupportedLanguage = "vi",
) -> VisionIdentifyResponse:
    """Identify a heritage site from raw image bytes + optional GPS coordinates."""
    sites_res = await db.execute(select(HeritageSite))
    sites = list(sites_res.scalars().all())

    postgis_dists = (
        await query_site_distances_postgis(db, lat, lng, None)
        if lat is not None and lng is not None
        else None
    )
    candidates = select_vision_candidates(
        sites, lat=lat, lng=lng, postgis_distances=postgis_dists
    )

    # Attempt Gemini Vision when API key is configured
    if settings.has_gemini and image_bytes:
        gemini_resp = await _call_gemini_vision(
            image_bytes=image_bytes,
            mime_type=mime_type,
            candidates=candidates,
            language=language,
        )
        if gemini_resp is not None:
            return gemini_resp
        return _build_gps_fallback_response(
            candidates,
            lat=lat,
            lng=lng,
            language=language,
            reason_note="Gemini Vision unavailable",
        )

    return _build_gps_fallback_response(
        candidates,
        lat=lat,
        lng=lng,
        language=language,
    )


async def identify_site_from_request(
    db: AsyncSession,
    req: VisionIdentifyRequest,
) -> VisionIdentifyResponse:
    """Identify a heritage site from a `VisionIdentifyRequest` (base64 image + optional GPS)."""
    try:
        image_bytes, detected_mime = decode_base64_image(req.image_base64, req.mime_type)
    except (binascii.Error, ValueError) as exc:
        raise ValueError(f"Invalid base64 image payload: {exc}") from exc

    if not image_bytes:
        raise ValueError("Decoded image payload is empty.")

    return await identify_site_from_bytes(
        db,
        image_bytes=image_bytes,
        mime_type=detected_mime,
        lat=req.lat,
        lng=req.lng,
        language=req.language,
    )
