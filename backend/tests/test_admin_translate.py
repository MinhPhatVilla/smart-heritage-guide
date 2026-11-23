"""Unit & integration tests for Admin 5-language AI translation & multilingual CRUD."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.core import config as config_module
from app.schemas.dto import AdminTranslateSiteRequest, LocalizedSiteContentDTO
from app.services.translation_service import translate_site_content


@pytest.mark.asyncio
async def test_translate_site_fallback_generates_all_four_target_languages() -> None:
    orig_key = config_module.settings.GEMINI_API_KEY
    config_module.settings.GEMINI_API_KEY = ""
    try:
        req = AdminTranslateSiteRequest(
            source_language="vi",
            source_content=LocalizedSiteContentDTO(
                name="Bảo tàng Áo Dài TP.HCM",
                shortSummary="Không gian lưu giữ lịch sử và nghệ thuật áo dài Việt Nam.",
                historicalEra="Thế kỷ XX – Hiện đại",
                openingHours="08:30 – 17:30 Hàng ngày",
                architecturalHighlights=["Kiến trúc nhà rường truyền thống", "Vườn sen thanh bình"],
                audioScript=["Chào mừng đến Bảo tàng Áo Dài tại TP. Thủ Đức."],
            ),
            city="TP. Thủ Đức · TP.HCM",
            address="206/19/30 Long Thuận, TP. Thủ Đức",
        )
        res = await translate_site_content(req)
        assert res.mode == "fallback"
        assert res.source_language == "vi"
        assert set(res.translations.keys()) == {"en", "fr", "zh", "ja"}
        assert "Daily" in res.translations["en"].openingHours
        assert "Tous les jours" in res.translations["fr"].openingHours
        assert "每日开放" in res.translations["zh"].openingHours
        assert "毎日" in res.translations["ja"].openingHours
        assert "Century" in res.translations["en"].historicalEra
        assert len(res.translations["ja"].audioScript) >= 1
    finally:
        config_module.settings.GEMINI_API_KEY = orig_key


@pytest.mark.asyncio
async def test_translate_site_gemini_parses_structured_json_response() -> None:
    orig_key = config_module.settings.GEMINI_API_KEY
    config_module.settings.GEMINI_API_KEY = "test-gemini-key"

    fake_json = """```json
    {
      "en": {
        "name": "Ao Dai Museum",
        "shortSummary": "A serene cultural space honoring Vietnam's traditional dress.",
        "historicalEra": "20th Century - Present",
        "openingHours": "08:30 - 17:30 Daily",
        "architecturalHighlights": ["Traditional wooden house", "Lotus pond garden"],
        "audioScript": ["Welcome to the Ao Dai Museum in Thu Duc City."]
      },
      "fr": {
        "name": "Musée de l'Áo Dài",
        "shortSummary": "Un espace culturel dédié à la tunique traditionnelle vietnamienne.",
        "historicalEra": "XXe siècle - Présent",
        "openingHours": "08h30 - 17h30 Tous les jours",
        "architecturalHighlights": ["Maison traditionnelle en bois", "Jardin de lotus"],
        "audioScript": ["Bienvenue au Musée de l'Áo Dài à Thu Duc."]
      }
    }
    ```"""

    mock_resp = MagicMock()
    mock_resp.text = fake_json
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_resp

    try:
        with patch("google.genai.Client", return_value=mock_client):
            req = AdminTranslateSiteRequest(
                source_language="vi",
                target_languages=["en", "fr"],
                source_content=LocalizedSiteContentDTO(
                    name="Bảo tàng Áo Dài",
                    shortSummary="Không gian văn hóa tôn vinh áo dài Việt Nam.",
                    historicalEra="Thế kỷ XX – Hiện đại",
                    openingHours="08:30 – 17:30 Hàng ngày",
                    architecturalHighlights=["Nhà gỗ truyền thống", "Hồ sen"],
                    audioScript=["Chào mừng quý khách đến Bảo tàng Áo Dài."],
                ),
            )
            res = await translate_site_content(req)

        assert res.mode == "gemini"
        assert set(res.translations.keys()) == {"en", "fr"}
        assert res.translations["en"].name == "Ao Dai Museum"
        assert res.translations["fr"].name == "Musée de l'Áo Dài"
        assert res.translations["en"].architecturalHighlights == [
            "Traditional wooden house",
            "Lotus pond garden",
        ]
        assert res.translations["fr"].audioScript == [
            "Bienvenue au Musée de l'Áo Dài à Thu Duc."
        ]
    finally:
        config_module.settings.GEMINI_API_KEY = orig_key
