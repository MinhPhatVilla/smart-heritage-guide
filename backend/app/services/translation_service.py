"""Multilingual Heritage Content Translation Service for Admin Studio.

Translates a heritage site's structured localized text bundle
(`name`, `shortSummary`, `historicalEra`, `openingHours`,
`architecturalHighlights`, `audioScript`) across all 5 supported languages:
`vi`, `en`, `fr`, `zh`, `ja`.

- Primary engine: Google Gemini (`settings.GEMINI_CHAT_MODEL`) with strict JSON schema output.
- Offline / Quota fallback: Deterministic multilingual normalizer translating common
  heritage metadata (opening hours, historical eras, intro scripts) so Admin always gets
  clean editable drafts for all 5 languages even without `GEMINI_API_KEY`.
"""

from __future__ import annotations

import asyncio
import json
import re
from typing import Any

from app.core.config import settings
from app.schemas.dto import (
    AdminTranslateSiteRequest,
    AdminTranslateSiteResponse,
    LocalizedSiteContentDTO,
    SupportedLanguage,
)

ALL_SUPPORTED_LANGUAGES: tuple[SupportedLanguage, ...] = ("vi", "en", "fr", "zh", "ja")

LANGUAGE_LABELS: dict[SupportedLanguage, str] = {
    "vi": "Vietnamese (Tiếng Việt)",
    "en": "English",
    "fr": "French (Français)",
    "zh": "Simplified Chinese (简体中文)",
    "ja": "Japanese (日本語)",
}

_OPENING_HOURS_REPLACEMENTS: dict[SupportedLanguage, list[tuple[str, str]]] = {
    "vi": [
        (r"\bDaily\b", "Hàng ngày"),
        (r"\bEvery day\b", "Hàng ngày"),
        (r"\bOpen 24/7\b", "Mở cửa 24/7"),
    ],
    "en": [
        (r"(?i)Hàng ngày", "Daily"),
        (r"(?i)Mỗi ngày", "Daily"),
        (r"(?i)Cả ngày", "All day"),
        (r"(?i)Mở cửa tự do", "Open access"),
        (r"(?i)Mở cửa", "Open"),
        (r"(?i)Thứ\s*2", "Mon"),
        (r"(?i)Thứ\s*3", "Tue"),
        (r"(?i)Thứ\s*4", "Wed"),
        (r"(?i)Thứ\s*5", "Thu"),
        (r"(?i)Thứ\s*6", "Fri"),
        (r"(?i)Thứ\s*7", "Sat"),
        (r"(?i)Chủ nhật", "Sun"),
    ],
    "fr": [
        (r"(?i)Hàng ngày", "Tous les jours"),
        (r"(?i)Mỗi ngày", "Tous les jours"),
        (r"(?i)Daily", "Tous les jours"),
        (r"(?i)Cả ngày", "Toute la journée"),
        (r"(?i)Mở cửa tự do", "Accès libre"),
        (r"(?i)Mở cửa", "Ouvert"),
    ],
    "zh": [
        (r"(?i)Hàng ngày", "每日开放"),
        (r"(?i)Mỗi ngày", "每日开放"),
        (r"(?i)Daily", "每日开放"),
        (r"(?i)Cả ngày", "全天开放"),
        (r"(?i)Mở cửa tự do", "全天免费开放"),
        (r"(?i)Mở cửa", "开放"),
    ],
    "ja": [
        (r"(?i)Hàng ngày", "毎日"),
        (r"(?i)Mỗi ngày", "毎日"),
        (r"(?i)Daily", "毎日"),
        (r"(?i)Cả ngày", "終日"),
        (r"(?i)Mở cửa tự do", "終日開放"),
        (r"(?i)Mở cửa", "開館"),
    ],
}

_ERA_REPLACEMENTS: dict[SupportedLanguage, list[tuple[str, str]]] = {
    "vi": [],
    "en": [
        (r"(?i)Thế kỷ", "Century"),
        (r"(?i)Thời Pháp thuộc", "French Colonial Era"),
        (r"(?i)Thời Nguyễn", "Nguyen Dynasty"),
        (r"(?i)Hiện đại", "Modern Era"),
        (r"(?i)Khởi công", "Constructed"),
        (r"(?i)Năm", "Year"),
    ],
    "fr": [
        (r"(?i)Thế kỷ", "Siècle"),
        (r"(?i)Thời Pháp thuộc", "Époque coloniale française"),
        (r"(?i)Thời Nguyễn", "Dynastie des Nguyễn"),
        (r"(?i)Hiện đại", "Époque moderne"),
        (r"(?i)Năm", "Année"),
    ],
    "zh": [
        (r"(?i)Thế kỷ", "世纪"),
        (r"(?i)Thời Pháp thuộc", "法属时期"),
        (r"(?i)Thời Nguyễn", "阮朝时期"),
        (r"(?i)Hiện đại", "现代"),
        (r"(?i)Năm", "年"),
    ],
    "ja": [
        (r"(?i)Thế kỷ", "世紀"),
        (r"(?i)Thời Pháp thuộc", "フランス植民地時代"),
        (r"(?i)Thời Nguyễn", "グエン朝時代"),
        (r"(?i)Hiện đại", "現代"),
        (r"(?i)Năm", "年"),
    ],
}

_FALLBACK_HIGHLIGHT_TEMPLATES: dict[SupportedLanguage, str] = {
    "vi": "Công trình văn hóa – lịch sử tiêu biểu tại {location}",
    "en": "Notable cultural and historical landmark in {location}",
    "fr": "Site culturel et historique emblématique à {location}",
    "zh": "{location}具有代表性的历史文化地标",
    "ja": "{location}を代表する歴史文化スポット",
}

_FALLBACK_AUDIO_INTRO_TEMPLATES: dict[SupportedLanguage, str] = {
    "vi": "Chào mừng quý khách đến với {name}, tọa lạc tại {location}. {summary}",
    "en": "Welcome to {name}, located in {location}. {summary}",
    "fr": "Bienvenue à {name}, situé à {location}. {summary}",
    "zh": "欢迎来到位于{location}的{name}。{summary}",
    "ja": "{location}にある{name}へようこそ。{summary}",
}


def _apply_replacements(text: str, rules: list[tuple[str, str]]) -> str:
    result = text.strip()
    for pattern, repl in rules:
        result = re.sub(pattern, repl, result)
    return result


def _clean_string_list(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    out: list[str] = []
    for item in values:
        text = str(item or "").strip()
        if text:
            out.append(text)
    return out


def _normalize_target_languages(
    source_language: SupportedLanguage,
    requested: list[SupportedLanguage] | None,
) -> list[SupportedLanguage]:
    if not requested:
        return [lang for lang in ALL_SUPPORTED_LANGUAGES if lang != source_language]
    seen: set[SupportedLanguage] = set()
    ordered: list[SupportedLanguage] = []
    for lang in requested:
        if lang == source_language or lang in seen:
            continue
        seen.add(lang)
        ordered.append(lang)
    return ordered


def _build_fallback_translation(
    source: LocalizedSiteContentDTO,
    target_lang: SupportedLanguage,
    city: str,
    address: str,
) -> LocalizedSiteContentDTO:
    location = (address or city or "TP. Hồ Chí Minh").strip()
    name = source.name.strip() or "Heritage Site"
    summary = source.shortSummary.strip() or f"{name} ({location})."
    era = _apply_replacements(
        source.historicalEra or "",
        _ERA_REPLACEMENTS.get(target_lang, []),
    ) or source.historicalEra.strip()
    hours = _apply_replacements(
        source.openingHours or "",
        _OPENING_HOURS_REPLACEMENTS.get(target_lang, []),
    ) or source.openingHours.strip()

    highlights = [h.strip() for h in source.architecturalHighlights if h.strip()]
    if not highlights:
        highlights = [
            _FALLBACK_HIGHLIGHT_TEMPLATES[target_lang].format(location=location)
        ]

    audio_script = [p.strip() for p in source.audioScript if p.strip()]
    if not audio_script:
        audio_script = [
            _FALLBACK_AUDIO_INTRO_TEMPLATES[target_lang].format(
                name=name,
                location=location,
                summary=summary,
            )
        ]

    return LocalizedSiteContentDTO(
        name=name,
        shortSummary=summary,
        historicalEra=era,
        openingHours=hours,
        architecturalHighlights=highlights,
        audioScript=audio_script,
    )


async def _translate_with_gemini(
    source_language: SupportedLanguage,
    source: LocalizedSiteContentDTO,
    target_languages: list[SupportedLanguage],
    city: str,
    address: str,
) -> dict[SupportedLanguage, LocalizedSiteContentDTO] | None:
    if not settings.has_gemini or not target_languages:
        return None

    source_label = LANGUAGE_LABELS[source_language]
    targets_desc = ", ".join(f'"{lang}" ({LANGUAGE_LABELS[lang]})' for lang in target_languages)

    system_instruction = (
        "You are an expert cultural heritage museum curator and professional translator for "
        "Smart Heritage Guide (Ho Chi Minh City, Vietnam).\n"
        f"Translate the heritage site content from {source_label} into these target languages: {targets_desc}.\n"
        "RULES:\n"
        "1. Preserve historical accuracy, dates, numbers, and proper Vietnamese place names (use standard international exonyms where natural, e.g., Independence Palace / Palais de la Réunification / 独立宫 / 統一会堂).\n"
        "2. Make `audioScript` sound warm, natural, and pleasant when read aloud by a Text-to-Speech tour guide; keep the same number of paragraphs as the source.\n"
        "3. Keep `architecturalHighlights` concise bullet phrases with the same item count as the source.\n"
        "4. Return strictly valid JSON ONLY: an object whose top-level keys are the exact target language codes "
        f"{json.dumps(list(target_languages))}. Each value MUST have keys: "
        '"name" (string), "shortSummary" (string), "historicalEra" (string), '
        '"openingHours" (string), "architecturalHighlights" (string[]), "audioScript" (string[]).'
    )

    source_payload = {
        "source_language": source_language,
        "city": city,
        "address": address,
        "content": source.model_dump(),
    }

    try:
        from google import genai
        from google.genai import types

        def _call() -> str:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            resp = client.models.generate_content(
                model=settings.GEMINI_CHAT_MODEL,
                contents=json.dumps(source_payload, ensure_ascii=False),
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2,
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
        if not isinstance(parsed, dict):
            return None

        translated_map: dict[SupportedLanguage, LocalizedSiteContentDTO] = {}
        for lang in target_languages:
            entry = parsed.get(lang)
            if not isinstance(entry, dict):
                translated_map[lang] = _build_fallback_translation(source, lang, city, address)
                continue

            fallback = _build_fallback_translation(source, lang, city, address)
            highlights = _clean_string_list(entry.get("architecturalHighlights"))
            scripts = _clean_string_list(entry.get("audioScript"))

            translated_map[lang] = LocalizedSiteContentDTO(
                name=str(entry.get("name") or "").strip() or fallback.name,
                shortSummary=str(entry.get("shortSummary") or "").strip() or fallback.shortSummary,
                historicalEra=str(entry.get("historicalEra") or "").strip() or fallback.historicalEra,
                openingHours=str(entry.get("openingHours") or "").strip() or fallback.openingHours,
                architecturalHighlights=highlights or fallback.architecturalHighlights,
                audioScript=scripts or fallback.audioScript,
            )
        return translated_map
    except Exception:
        return None


async def translate_site_content(
    payload: AdminTranslateSiteRequest,
) -> AdminTranslateSiteResponse:
    """Translate heritage site content across requested languages with Gemini + smart fallback."""
    target_languages = _normalize_target_languages(
        payload.source_language,
        payload.target_languages,
    )

    if not target_languages:
        return AdminTranslateSiteResponse(
            source_language=payload.source_language,
            translations={},
            mode="fallback",
            note="Không có ngôn ngữ đích nào cần dịch.",
        )

    gemini_translations = await _translate_with_gemini(
        source_language=payload.source_language,
        source=payload.source_content,
        target_languages=target_languages,
        city=payload.city,
        address=payload.address,
    )
    if gemini_translations is not None:
        return AdminTranslateSiteResponse(
            source_language=payload.source_language,
            translations=gemini_translations,
            mode="gemini",
            note=f"Đã dịch tự động sang {len(gemini_translations)} ngôn ngữ bằng {settings.GEMINI_CHAT_MODEL}.",
        )

    fallback_translations: dict[SupportedLanguage, LocalizedSiteContentDTO] = {
        lang: _build_fallback_translation(
            payload.source_content,
            lang,
            payload.city,
            payload.address,
        )
        for lang in target_languages
    }
    return AdminTranslateSiteResponse(
        source_language=payload.source_language,
        translations=fallback_translations,
        mode="fallback",
        note=(
            "Chưa cấu hình GEMINI_API_KEY hoặc Gemini tạm gián đoạn — "
            "đã khởi tạo bản nháp chuẩn hóa đa ngôn ngữ để Admin chỉnh sửa nhanh."
        ),
    )
