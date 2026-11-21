"""Unit & async DB tests for Pillar 2: Multilingual Hybrid RAG Retrieval & Smart Fallback."""

from __future__ import annotations

from dataclasses import dataclass

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base
from app.models.entities import HeritageKnowledgeChunk, HeritageSite
from app.schemas.dto import AiChatRequest
from app.services.rag_service import (
    answer_heritage_question,
    compute_bm25_and_trigram_scores,
    cosine_similarity,
    hybrid_rrf_rank,
    reindex_site_chunks,
)


@dataclass
class MockChunk:
    id: str
    site_id: str
    language: str
    source_type: str
    content: str
    embedding_json: list[float] | None = None


@dataclass
class MockSiteLite:
    id: str
    lat: float
    lng: float
    translations: dict


def test_cosine_similarity_and_bm25_accent_insensitive():
    assert cosine_similarity([1.0, 0.0], [1.0, 0.0]) == pytest.approx(1.0)
    assert cosine_similarity([1.0, 0.0], [0.0, 1.0]) == pytest.approx(0.0)
    assert cosine_similarity([], [1.0]) == 0.0

    docs = [
        "Dinh Độc Lập là Di tích Quốc gia Đặc biệt tại Quận 1 TP.HCM do kiến trúc sư Ngô Viết Thụ thiết kế.",
        "Chợ Bến Thành nổi tiếng với tháp đồng hồ biểu tượng và ẩm thực đường phố.",
    ]
    # Accent-free Vietnamese query must strongly match doc 0
    scores = compute_bm25_and_trigram_scores("kien truc su Ngo Viet Thu Dinh Doc Lap", docs)
    assert scores[0] > scores[1]


def test_hybrid_rrf_rank_fuses_semantic_and_lexical_and_prioritizes_site_id():
    site_map = {
        "dinh-doc-lap": MockSiteLite(
            id="dinh-doc-lap",
            lat=10.7769,
            lng=106.6953,
            translations={"vi": {"name": "Dinh Độc Lập"}},
        ),
        "buu-dien-trung-tam": MockSiteLite(
            id="buu-dien-trung-tam",
            lat=10.7800,
            lng=106.7000,
            translations={"vi": {"name": "Bưu điện Trung tâm"}},
        ),
    }
    chunks = [
        MockChunk(
            id="c1",
            site_id="dinh-doc-lap",
            language="vi",
            source_type="architecture",
            content="Dinh Độc Lập có bức rèm hoa đá hình đốt trúc độc đáo.",
            embedding_json=[0.1, 0.9, 0.0],
        ),
        MockChunk(
            id="c2",
            site_id="buu-dien-trung-tam",
            language="vi",
            source_type="architecture",
            content="Bưu điện Trung tâm có mái vòm sắt kiểu Pháp và bản đồ Sài Gòn cổ.",
            embedding_json=[0.95, 0.05, 0.0],
        ),
    ]

    # Semantic query vector aligns with c2, lexical mentions mái vòm -> c2 ranks #1
    ranked = hybrid_rrf_rank(
        chunks,
        query="mái vòm kiểu Pháp",
        language="vi",
        site_map=site_map,
        query_embedding=[0.98, 0.02, 0.0],
    )
    assert ranked[0].site_id == "buu-dien-trung-tam"
    assert ranked[0].semantic_score > 0.9

    # Explicit site_id scope boosts dinh-doc-lap to #1 for general question
    scoped = hybrid_rrf_rank(
        chunks,
        query="kiến trúc có gì nổi bật",
        language="vi",
        site_map=site_map,
        site_id="dinh-doc-lap",
    )
    assert scoped[0].site_id == "dinh-doc-lap"


async def test_rag_fallback_works_across_5_languages_without_gemini_key(monkeypatch: pytest.MonkeyPatch):
    from scripts.seed_supabase import seed_database

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        await seed_database(session=db, generate_embeddings=False, seed_demo_users=False)

        questions = {
            "vi": "Dinh Độc Lập mở cửa mấy giờ và giá vé bao nhiêu?",
            "en": "What are the opening hours and architecture of Independence Palace?",
            "fr": "Quels sont les horaires du Palais de la Réunification ?",
            "zh": "统一宫的开放时间和门票价格是多少？",
            "ja": "統一会堂の開館時間と建築の見どころを教えてください。",
        }

        for lang, q in questions.items():
            resp = await answer_heritage_question(
                db,
                AiChatRequest(
                    question=q,
                    language=lang,  # type: ignore[arg-type]
                    site_id="dinh-doc-lap",
                ),
            )
            assert resp.mode == "fallback"
            assert resp.language == lang
            assert len(resp.answer) > 30
            assert len(resp.citations) >= 1
            assert resp.citations[0].site_id == "dinh-doc-lap"
            assert len(resp.suggested_questions) == 3

        # Food query near District 1 returns grounded culinary info
        food_resp = await answer_heritage_question(
            db,
            AiChatRequest(
                question="Gần Dinh Độc Lập có quán ăn đặc sản nào ngon?",
                language="vi",
                site_id="dinh-doc-lap",
            ),
        )
        assert food_resp.mode == "fallback"
        assert len(food_resp.answer) > 30
        assert len(food_resp.citations) >= 1

    await engine.dispose()


async def test_reindex_site_chunks_rebuilds_cleanly():
    from scripts.seed_supabase import seed_database

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        await seed_database(session=db, generate_embeddings=False, seed_demo_users=False)
        site = await db.get(HeritageSite, "dinh-doc-lap")
        assert site is not None

        count = await reindex_site_chunks(db, site, generate_embeddings=False)
        assert count >= 5

        rows = (
            await db.execute(
                select(HeritageKnowledgeChunk).where(HeritageKnowledgeChunk.site_id == "dinh-doc-lap")
            )
        ).scalars().all()
        assert len(rows) == count

    await engine.dispose()
