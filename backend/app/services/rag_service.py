"""Multilingual Hybrid RAG Heritage Assistant Service (Pillar 2).

Combines:
1. Semantic cosine similarity over stored chunk embeddings (`embedding_json` / Gemini `text-embedding-004`)
2. Lexical BM25 + accent-insensitive & character-trigram scoring (supports VI/EN/FR/ZH/JA)
3. Reciprocal Rank Fusion (RRF, k=60) prioritizing `site_id`, requested `language`, and optional GPS proximity
4. Grounded generation via `google-genai` (`gemini-2.5-flash`) strictly grounded in retrieved chunks
5. Smart structured fallback (`mode="fallback"`) when `GEMINI_API_KEY` is unset or quota fails
6. Admin re-indexing helper (`reindex_site_chunks`) used on site create/update.
"""

from __future__ import annotations

import asyncio
import json
import math
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass
from typing import Any, Optional, Sequence

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.entities import HeritageKnowledgeChunk, HeritageSite, Restaurant
from app.schemas.dto import AiChatRequest, AiChatResponse, ChatCitation, SupportedLanguage
from app.services.geo_service import haversine_meters
from app.services.recommendation_service import get_localized_site_field, get_localized_site_name

RRF_K = 60
TOP_K_CHUNKS = 5

LANGUAGE_NAMES: dict[str, str] = {
    "vi": "Vietnamese (Tiếng Việt)",
    "en": "English",
    "fr": "French (Français)",
    "zh": "Simplified Chinese (简体中文)",
    "ja": "Japanese (日本語)",
}

FOOD_QUERY_KEYWORDS = {
    "an", "quan", "nha hang", "mon", "am thuc", "pho", "bun", "com", "ca phe", "cafe", "coffee",
    "food", "eat", "restaurant", "dining", "dish", "lunch", "dinner", "breakfast",
    "manger", "cuisine", "repas", "dejeuner", "diner",
    "吃", "餐厅", "美食", "小吃", "咖啡",
    "食べ", "レストラン", "グルメ", "料理", "カフェ",
}

HOURS_PRICE_KEYWORDS = {
    "gio", "mo cua", "dong cua", "ve", "gia", "phi", "mien phi", "dia chi",
    "hour", "open", "close", "ticket", "price", "fee", "free", "address",
    "horaire", "ouvert", "billet", "tarif", "prix", "adresse",
    "时间", "开放", "门票", "价格", "地址",
    "時間", "開館", "料金", "チケット", "住所",
}


@dataclass
class RetrievedChunk:
    chunk_id: str
    site_id: str
    site_name: str
    language: str
    source_type: str
    content: str
    rrf_score: float
    lexical_score: float
    semantic_score: float


# ---------------------------------------------------------------------------
# Text Normalization, Tokenization, BM25, Trigrams, Cosine & RRF
# ---------------------------------------------------------------------------
def strip_accents(text: str) -> str:
    """Fold diacritics (including Vietnamese đ/Đ) for accent-insensitive matching."""
    text = text.replace("đ", "d").replace("Đ", "D")
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")


def tokenize(text: str) -> list[str]:
    """Tokenize multilingual text into normalized words plus CJK bigrams."""
    if not text:
        return []
    folded = strip_accents(text.lower())
    # Latin/numeric tokens
    words = re.findall(r"[a-z0-9]+", folded)
    # CJK / Kana sequences split into characters + bigrams
    cjk_runs = re.findall(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]+", text)
    cjk_tokens: list[str] = []
    for run in cjk_runs:
        if len(run) == 1:
            cjk_tokens.append(run)
        else:
            cjk_tokens.extend(list(run))
            cjk_tokens.extend(run[i : i + 2] for i in range(len(run) - 1))
    return words + cjk_tokens


def char_trigrams(text: str) -> set[str]:
    cleaned = re.sub(r"\s+", " ", strip_accents(text.lower())).strip()
    if len(cleaned) < 3:
        return {cleaned} if cleaned else set()
    return {cleaned[i : i + 3] for i in range(len(cleaned) - 2)}


def cosine_similarity(vec_a: Sequence[float], vec_b: Sequence[float]) -> float:
    """Compute cosine similarity in [-1, 1] between two float vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = 0.0
    norm_a = 0.0
    norm_b = 0.0
    for a, b in zip(vec_a, vec_b):
        fa = float(a)
        fb = float(b)
        dot += fa * fb
        norm_a += fa * fa
        norm_b += fb * fb
    if norm_a <= 0.0 or norm_b <= 0.0:
        return 0.0
    return dot / (math.sqrt(norm_a) * math.sqrt(norm_b))


def compute_bm25_and_trigram_scores(
    query: str,
    documents: Sequence[str],
    *,
    k1: float = 1.5,
    b: float = 0.75,
) -> list[float]:
    """Compute BM25 + character-trigram lexical similarity for each document."""
    n_docs = len(documents)
    if n_docs == 0:
        return []

    q_tokens = tokenize(query)
    q_trigrams = char_trigrams(query)
    doc_tokens_list = [tokenize(doc) for doc in documents]
    doc_lengths = [len(toks) for toks in doc_tokens_list]
    avgdl = sum(doc_lengths) / max(1, n_docs)

    # Document frequency for query terms
    df: Counter[str] = Counter()
    unique_q_tokens = set(q_tokens)
    for toks in doc_tokens_list:
        tok_set = set(toks)
        for qt in unique_q_tokens:
            if qt in tok_set:
                df[qt] += 1

    scores: list[float] = []
    for doc_text, toks, dl in zip(documents, doc_tokens_list, doc_lengths):
        tf_counter = Counter(toks)
        bm25 = 0.0
        for qt in unique_q_tokens:
            tf = tf_counter.get(qt, 0)
            if tf <= 0:
                continue
            idf = math.log(1.0 + (n_docs - df[qt] + 0.5) / (df[qt] + 0.5))
            denom = tf + k1 * (1.0 - b + b * (dl / max(1.0, avgdl)))
            bm25 += idf * ((tf * (k1 + 1.0)) / max(1e-9, denom))

        # Character trigram overlap bonus (helps CJK & typos)
        d_trigrams = char_trigrams(doc_text)
        trigram_overlap = 0.0
        if q_trigrams and d_trigrams:
            inter = len(q_trigrams & d_trigrams)
            trigram_overlap = inter / max(1, len(q_trigrams))

        scores.append(bm25 + 1.25 * trigram_overlap)
    return scores


def hybrid_rrf_rank(
    chunks: Sequence[Any],
    *,
    query: str,
    language: str,
    site_map: dict[str, Any],
    site_id: Optional[str] = None,
    query_embedding: Optional[Sequence[float]] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    top_k: int = TOP_K_CHUNKS,
) -> list[RetrievedChunk]:
    """Hybrid retrieval fusing semantic cosine similarity + lexical BM25/trigram via RRF."""
    if not chunks:
        return []

    contents = [str(getattr(ch, "content", "")) for ch in chunks]
    lexical_raw = compute_bm25_and_trigram_scores(query, contents)

    # Compute semantic cosine scores when query_embedding and stored embeddings exist
    semantic_raw: list[float] = []
    has_any_semantic = False
    for ch in chunks:
        emb = getattr(ch, "embedding_json", None)
        if query_embedding and isinstance(emb, list) and len(emb) == len(query_embedding):
            sim = cosine_similarity(query_embedding, emb)
            semantic_raw.append(sim)
            if sim > 0.0:
                has_any_semantic = True
        else:
            semantic_raw.append(0.0)

    # Build rank maps (1-indexed ranks)
    lex_order = sorted(range(len(chunks)), key=lambda i: -lexical_raw[i])
    lex_rank = {idx: rank for rank, idx in enumerate(lex_order, start=1)}

    sem_rank: dict[int, int] = {}
    if has_any_semantic:
        sem_order = sorted(range(len(chunks)), key=lambda i: -semantic_raw[i])
        sem_rank = {idx: rank for rank, idx in enumerate(sem_order, start=1)}

    q_folded = strip_accents(query.lower())
    is_food_query = any(kw in q_folded or kw in query.lower() for kw in FOOD_QUERY_KEYWORDS)

    scored: list[RetrievedChunk] = []
    for idx, ch in enumerate(chunks):
        lex_s = lexical_raw[idx]
        sem_s = semantic_raw[idx]

        # Standard Reciprocal Rank Fusion
        rrf = (1.0 / (RRF_K + lex_rank[idx]))
        if has_any_semantic and sem_s > 0.0:
            rrf += 1.15 * (1.0 / (RRF_K + sem_rank[idx]))

        # Contextual prioritization multipliers (preserve RRF semantics while prioritizing scope)
        ch_site_id = str(getattr(ch, "site_id", ""))
        ch_lang = str(getattr(ch, "language", "vi"))
        ch_source = str(getattr(ch, "source_type", "summary"))

        if site_id and ch_site_id == site_id:
            rrf *= 2.4
        if ch_lang == language:
            rrf *= 1.35
        elif ch_lang == "vi":
            rrf *= 1.05

        if is_food_query and ch_source == "restaurant":
            rrf *= 1.45

        if lat is not None and lng is not None and ch_site_id in site_map:
            site_obj = site_map[ch_site_id]
            dist_m = haversine_meters(lat, lng, float(site_obj.lat), float(site_obj.lng))
            if dist_m <= 1500.0:
                rrf *= 1.20

        # Tiny tie-breaker from raw lexical/semantic strength
        rrf += min(0.005, lex_s * 0.0005 + max(0.0, sem_s) * 0.002)

        site_obj = site_map.get(ch_site_id)
        s_name = get_localized_site_name(site_obj, language) if site_obj else ch_site_id

        scored.append(
            RetrievedChunk(
                chunk_id=str(getattr(ch, "id", idx)),
                site_id=ch_site_id,
                site_name=s_name,
                language=ch_lang,
                source_type=ch_source,
                content=contents[idx],
                rrf_score=round(rrf, 6),
                lexical_score=round(lex_s, 4),
                semantic_score=round(sem_s, 4),
            )
        )

    scored.sort(key=lambda item: -item.rrf_score)

    # Deduplicate near-identical snippets while keeping diversity
    selected: list[RetrievedChunk] = []
    seen_prefixes: set[str] = set()
    for item in scored:
        sig = f"{item.site_id}:{item.source_type}:{item.content[:80]}"
        if sig in seen_prefixes:
            continue
        seen_prefixes.add(sig)
        selected.append(item)
        if len(selected) >= top_k:
            break
    return selected


# ---------------------------------------------------------------------------
# Chunk Builder & Admin Re-Indexing Helper
# ---------------------------------------------------------------------------
def build_chunks_for_site(
    site: HeritageSite,
    restaurants: Optional[Sequence[Restaurant]] = None,
) -> list[dict[str, Any]]:
    """Build multilingual knowledge chunks (`summary`, `script`, `architecture`, `restaurant`) for a site."""
    chunks: list[dict[str, Any]] = []
    translations = site.translations or {}
    rest_list = list(restaurants) if restaurants is not None else list(getattr(site, "restaurants", []) or [])

    for lang, loc in translations.items():
        if not isinstance(loc, dict):
            continue
        name = str(loc.get("name") or site.id)
        short_summary = str(loc.get("shortSummary") or "").strip()
        era = str(loc.get("historicalEra") or "").strip()
        hours = str(loc.get("openingHours") or "").strip()
        highlights = loc.get("architecturalHighlights") or []
        audio_script = loc.get("audioScript") or []

        # 1. Summary chunk
        summary_parts = [
            f"{name} ({site.city}).",
            short_summary,
            f"Era: {era}." if era else "",
            f"Opening hours: {hours}." if hours else "",
            f"Ticket price: {site.ticket_price}." if site.ticket_price else "",
            f"Address: {site.address}." if site.address else "",
        ]
        summary_text = " ".join(p for p in summary_parts if p).strip()
        if summary_text:
            chunks.append(
                {
                    "site_id": site.id,
                    "language": lang,
                    "source_type": "summary",
                    "content": summary_text,
                }
            )

        # 2. Audio guide script chunk
        if isinstance(audio_script, list) and audio_script:
            script_text = f"{name} — " + " ".join(str(p).strip() for p in audio_script if p)
            chunks.append(
                {
                    "site_id": site.id,
                    "language": lang,
                    "source_type": "script",
                    "content": script_text.strip(),
                }
            )

        # 3. Architectural highlights chunk
        if isinstance(highlights, list) and highlights:
            arch_text = f"{name} architectural highlights: " + "; ".join(str(h).strip() for h in highlights if h)
            chunks.append(
                {
                    "site_id": site.id,
                    "language": lang,
                    "source_type": "architecture",
                    "content": arch_text.strip(),
                }
            )

    # 4. Nearby restaurant chunk (Vietnamese + English friendly)
    if rest_list:
        rest_lines = []
        for r in rest_list:
            dishes = ", ".join(r.specialty_dishes or [])
            slots = ", ".join(r.meal_slots or [])
            rest_lines.append(
                f"{r.name} ({r.cuisine}, {r.rating:.1f}★, {r.price_range}, {r.open_hours}, "
                f"dishes: {dishes}, meals: {slots}, address: {r.address})"
            )
        site_vi_name = get_localized_site_name(site, "vi")
        site_en_name = get_localized_site_name(site, "en")
        rest_content = f"Quán ăn & ẩm thực gần {site_vi_name} ({site_en_name}): " + " | ".join(rest_lines)
        chunks.append(
            {
                "site_id": site.id,
                "language": "vi",
                "source_type": "restaurant",
                "content": rest_content,
            }
        )

    return chunks


async def generate_embedding(text: str) -> Optional[list[float]]:
    """Generate a dense embedding vector via `google-genai` when `GEMINI_API_KEY` is configured."""
    if not settings.has_gemini or not text.strip():
        return None
    try:
        from google import genai

        def _call() -> Optional[list[float]]:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            resp = client.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=text[:3000],
            )
            if getattr(resp, "embeddings", None) and len(resp.embeddings) > 0:
                values = getattr(resp.embeddings[0], "values", None)
                if values:
                    return [float(v) for v in values]
            return None

        return await asyncio.to_thread(_call)
    except Exception:
        return None


async def reindex_site_chunks(
    db: AsyncSession,
    site: HeritageSite,
    restaurants: Optional[Sequence[Restaurant]] = None,
    *,
    generate_embeddings: bool = False,
) -> int:
    """Delete and rebuild `HeritageKnowledgeChunk` rows for a site (called by Admin CRUD)."""
    await db.execute(
        delete(HeritageKnowledgeChunk).where(HeritageKnowledgeChunk.site_id == site.id)
    )

    if restaurants is None:
        r_res = await db.execute(select(Restaurant).where(Restaurant.site_id == site.id))
        restaurants = list(r_res.scalars().all())

    chunk_dicts = build_chunks_for_site(site, restaurants)
    created = 0
    for item in chunk_dicts:
        emb = None
        if generate_embeddings and settings.has_gemini:
            emb = await generate_embedding(item["content"])
        db.add(
            HeritageKnowledgeChunk(
                site_id=item["site_id"],
                language=item["language"],
                source_type=item["source_type"],
                content=item["content"],
                embedding_json=emb,
            )
        )
        created += 1

    await db.flush()
    return created


# ---------------------------------------------------------------------------
# Gemini Grounded Generation & Smart Multilingual Fallback
# ---------------------------------------------------------------------------
def _default_suggested_questions(
    language: SupportedLanguage,
    primary_site_name: Optional[str] = None,
) -> list[str]:
    if primary_site_name:
        return {
            "vi": [
                f"Kiến trúc của {primary_site_name} có điểm gì đặc sắc nhất?",
                f"Giờ mở cửa và giá vé tham quan {primary_site_name} như thế nào?",
                f"Gần {primary_site_name} có quán ăn đặc sản Sài Gòn nào ngon?",
            ],
            "en": [
                f"What are the most notable architectural highlights of {primary_site_name}?",
                f"What are the opening hours and ticket prices for {primary_site_name}?",
                f"Which local restaurants are recommended near {primary_site_name}?",
            ],
            "fr": [
                f"Quels sont les éléments architecturaux remarquables de {primary_site_name} ?",
                f"Quels sont les horaires d'ouverture et tarifs de {primary_site_name} ?",
                f"Quels restaurants locaux recommandez-vous près de {primary_site_name} ?",
            ],
            "zh": [
                f"{primary_site_name}最具特色的建筑亮点有哪些？",
                f"{primary_site_name}的开放时间和门票价格是多少？",
                f"{primary_site_name}附近有哪些值得推荐的地道美食？",
            ],
            "ja": [
                f"{primary_site_name}の建築的な見どころは何ですか？",
                f"{primary_site_name}の開館時間と入場料を教えてください。",
                f"{primary_site_name}周辺のおすすめローカルグルメはありますか？",
            ],
        }[language]

    return {
        "vi": [
            "Gần Quận 1 có những di tích lịch sử nào nổi bật nhất?",
            "Gợi ý quán ăn đặc sản ngon gần Dinh Độc Lập hoặc Chợ Bến Thành?",
            "Bảo tàng nào ở TP.HCM có giá trị lịch sử đặc sắc để đi bộ tham quan?",
        ],
        "en": [
            "What are the top historical landmarks in District 1, Ho Chi Minh City?",
            "Which local Saigon restaurants are near Independence Palace?",
            "Which museums are best for a 2-hour walking tour?",
        ],
        "fr": [
            "Quels sont les monuments incontournables du 1er arrondissement ?",
            "Quels restaurants typiques recommandez-vous près du Palais de la Réunification ?",
            "Quels musées visiter lors d'une promenade à pied ?",
        ],
        "zh": [
            "胡志明市第一郡有哪些最值得参观的历史地标？",
            "统一宫附近有哪些地道西贡美食餐厅？",
            "有哪些适合步行参观的历史博物馆？",
        ],
        "ja": [
            "ホーチミン市1区で最も有名な歴史スポットはどこですか？",
            "統一会堂の近くにあるおすすめのサイゴングルメは？",
            "徒歩観光にぴったりの博物館を教えてください。",
        ],
    }[language]


async def _generate_with_gemini(
    req: AiChatRequest,
    retrieved: list[RetrievedChunk],
    primary_site: Optional[HeritageSite],
    primary_restaurants: list[Restaurant],
) -> Optional[tuple[str, list[str]]]:
    """Call `google-genai` (`gemini-2.5-flash`) with strict context grounding."""
    if not settings.has_gemini:
        return None

    context_blocks = []
    for i, ch in enumerate(retrieved, start=1):
        context_blocks.append(
            f"[{i}] Site: {ch.site_name} (id={ch.site_id}, type={ch.source_type}, lang={ch.language})\n{ch.content}"
        )

    if primary_site is not None:
        hours = get_localized_site_field(primary_site, req.language, "openingHours", "")
        era = get_localized_site_field(primary_site, req.language, "historicalEra", "")
        context_blocks.append(
            f"[METADATA] Site={get_localized_site_name(primary_site, req.language)}, "
            f"Address={primary_site.address or primary_site.city}, Ticket={primary_site.ticket_price}, "
            f"Hours={hours}, Era={era}, Rating={primary_site.rating}"
        )
    if primary_restaurants:
        r_str = "; ".join(
            f"{r.name} ({r.cuisine}, {r.rating}★, {r.price_range}, {', '.join(r.specialty_dishes or [])})"
            for r in primary_restaurants[:3]
        )
        context_blocks.append(f"[NEARBY_FOOD] {r_str}")

    history_lines = []
    for msg in req.history[-4:]:
        history_lines.append(f"{msg.role.upper()}: {msg.content}")
    history_block = "\n".join(history_lines) if history_lines else "(none)"

    target_lang_name = LANGUAGE_NAMES.get(req.language, "Vietnamese")
    system_instruction = (
        "You are Smart Heritage Guide AI, an expert Ho Chi Minh City cultural & heritage tour guide.\n"
        f"You MUST respond strictly in {target_lang_name} (`{req.language}`).\n"
        "STRICT GROUNDING RULES:\n"
        "1. Answer ONLY using facts present in the PROVIDED CONTEXT below. Never invent dates, ticket prices, or restaurant names.\n"
        "2. If the context does not contain a specific detail, politely state what IS known from the context.\n"
        "3. Keep the answer concise, engaging, and well-structured (2-5 sentences or clean bullet points).\n"
        "4. Return valid JSON ONLY with schema: "
        '{"answer": "<grounded response>", "suggested_questions": ["q1", "q2", "q3"]}'
    )

    user_prompt = (
        f"CONVERSATION HISTORY:\n{history_block}\n\n"
        f"PROVIDED CONTEXT:\n" + "\n\n".join(context_blocks) + "\n\n"
        f"USER QUESTION ({req.language}): {req.question}"
    )

    try:
        from google import genai
        from google.genai import types

        def _call() -> str:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            resp = client.models.generate_content(
                model=settings.GEMINI_CHAT_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.25,
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
        answer = str(parsed.get("answer") or "").strip()
        suggested = parsed.get("suggested_questions")
        if not answer:
            return None
        if isinstance(suggested, list):
            clean_sugg = [str(q).strip() for q in suggested if str(q).strip()][:3]
        else:
            clean_sugg = []
        return answer, clean_sugg
    except Exception:
        return None


def build_structured_fallback_answer(
    *,
    question: str,
    language: SupportedLanguage,
    retrieved: list[RetrievedChunk],
    primary_site: Optional[HeritageSite],
    primary_restaurants: list[Restaurant],
) -> tuple[str, list[str]]:
    """Synthesize a clean, accurate, multilingual answer from Top-3 chunks + structured metadata."""
    site_name = get_localized_site_name(primary_site, language) if primary_site else None
    suggested = _default_suggested_questions(language, site_name)

    if not retrieved and primary_site is None:
        empty_msg = {
            "vi": "Hiện chưa có dữ liệu chi tiết phù hợp cho câu hỏi này trong kho tri thức 20 di tích TP.HCM. Bạn có thể hỏi về Dinh Độc Lập, Nhà thờ Đức Bà, Bưu điện Trung tâm, Chợ Bến Thành hoặc quán ăn gần đó.",
            "en": "No matching entry was found in the 20 HCMC heritage sites knowledge base. Try asking about Independence Palace, Notre-Dame Cathedral, Central Post Office, Ben Thanh Market, or nearby food.",
            "fr": "Aucune information correspondante n'a été trouvée dans la base des 20 sites patrimoniaux. Essayez une question sur le Palais de la Réunification, la Cathédrale Notre-Dame ou le Marché Ben Thanh.",
            "zh": "在胡志明市20处历史遗产知识库中暂未找到直接匹配内容。您可以询问统一宫、红教堂、中央邮局或周边美食。",
            "ja": "ホーチミン市20か所の歴史遺産データベースに一致する情報が見つかりませんでした。統一会堂、サイゴン大教会、中央郵便局などについてご質問ください。",
        }[language]
        return empty_msg, suggested

    q_folded = strip_accents(question.lower())
    wants_food = any(kw in q_folded or kw in question.lower() for kw in FOOD_QUERY_KEYWORDS)

    lines: list[str] = []
    if primary_site is not None and site_name:
        summary = str(get_localized_site_field(primary_site, language, "shortSummary", "")).strip()
        hours = str(get_localized_site_field(primary_site, language, "openingHours", "")).strip()
        era = str(get_localized_site_field(primary_site, language, "historicalEra", "")).strip()
        highlights = get_localized_site_field(primary_site, language, "architecturalHighlights", []) or []

        header = {
            "vi": f"**{site_name}** ({primary_site.city}):",
            "en": f"**{site_name}** ({primary_site.city}):",
            "fr": f"**{site_name}** ({primary_site.city}) :",
            "zh": f"**{site_name}**（{primary_site.city}）：",
            "ja": f"**{site_name}**（{primary_site.city}）：",
        }[language]
        lines.append(header)

        if summary:
            lines.append(summary)

        # Include top retrieved snippet if it adds info beyond summary
        top_extra = [
            ch.content
            for ch in retrieved[:3]
            if ch.source_type in ("script", "architecture", "summary")
            and ch.content[:40] not in (summary or "")
        ]
        if top_extra and not wants_food:
            snippet = top_extra[0][:280].rstrip()
            if len(top_extra[0]) > 280:
                snippet += "..."
            lines.append(snippet)

        # Key metadata bullets (opening hours, ticket price, era, highlights)
        meta_labels = {
            "vi": ("Giờ mở cửa", "Giá vé", "Giai đoạn lịch sử", "Điểm nhấn kiến trúc", "Ẩm thực gợi ý gần đây"),
            "en": ("Opening hours", "Ticket price", "Historical era", "Architectural highlights", "Recommended nearby food"),
            "fr": ("Horaires", "Tarif", "Époque historique", "Points forts architecturaux", "Gastronomie à proximité"),
            "zh": ("开放时间", "门票价格", "历史时期", "建筑亮点", "附近美食推荐"),
            "ja": ("開館時間", "入場料", "歴史時代", "建築の見どころ", "周辺のおすすめグルメ"),
        }[language]

        if hours:
            lines.append(f"• {meta_labels[0]}: {hours}")
        if primary_site.ticket_price:
            lines.append(f"• {meta_labels[1]}: {primary_site.ticket_price}")
        if era:
            lines.append(f"• {meta_labels[2]}: {era}")
        if highlights and isinstance(highlights, list):
            lines.append(f"• {meta_labels[3]}: " + "; ".join(str(h) for h in highlights[:3]))

        if primary_restaurants:
            rest_bullets = []
            for r in primary_restaurants[:2]:
                dishes = ", ".join((r.specialty_dishes or [])[:2])
                dish_part = f" — {dishes}" if dishes else ""
                rest_bullets.append(f"{r.name} ({r.rating:.1f}★, {r.price_range}{dish_part})")
            lines.append(f"• {meta_labels[4]}: " + " | ".join(rest_bullets))
    else:
        # Multi-site synthesis from top-3 chunks
        intro = {
            "vi": "Dựa trên dữ liệu di tích TP.HCM, dưới đây là thông tin phù hợp nhất:",
            "en": "Based on the Ho Chi Minh City heritage knowledge base, here are the closest matches:",
            "fr": "Selon la base de connaissances patrimoniales de Hô Chi Minh-Ville :",
            "zh": "根据胡志明市历史遗产知识库，为您整理最相关信息：",
            "ja": "ホーチミン市歴史遺産データベースに基づく最も関連性の高い情報です：",
        }[language]
        lines.append(intro)
        for ch in retrieved[:3]:
            snippet = ch.content[:240].rstrip()
            if len(ch.content) > 240:
                snippet += "..."
            lines.append(f"• **{ch.site_name}**: {snippet}")

    return "\n".join(lines), suggested


# ---------------------------------------------------------------------------
# Main Async RAG Entry Point
# ---------------------------------------------------------------------------
async def answer_heritage_question(
    db: AsyncSession,
    req: AiChatRequest,
) -> AiChatResponse:
    """Execute Hybrid RAG (semantic + lexical RRF) and grounded generation with smart fallback."""
    sites_res = await db.execute(select(HeritageSite).options(selectinload(HeritageSite.restaurants)))
    sites = list(sites_res.scalars().all())
    site_map: dict[str, HeritageSite] = {s.id: s for s in sites}

    chunks_stmt = select(HeritageKnowledgeChunk)
    chunks_res = await db.execute(chunks_stmt)
    chunks: list[Any] = list(chunks_res.scalars().all())

    # If knowledge chunks table hasn't been seeded yet, synthesize in-memory chunks seamlessly
    if not chunks and sites:
        ephemeral: list[Any] = []
        for s in sites:
            for idx, item in enumerate(build_chunks_for_site(s, s.restaurants)):
                ephemeral.append(
                    HeritageKnowledgeChunk(
                        id=f"ephemeral-{s.id}-{idx}",
                        site_id=item["site_id"],
                        language=item["language"],
                        source_type=item["source_type"],
                        content=item["content"],
                        embedding_json=None,
                    )
                )
        chunks = ephemeral

    # Compute query embedding only if Gemini is enabled AND at least one chunk has stored embeddings
    query_embedding: Optional[list[float]] = None
    if settings.has_gemini and any(getattr(c, "embedding_json", None) for c in chunks):
        query_embedding = await generate_embedding(req.question)

    retrieved = hybrid_rrf_rank(
        chunks,
        query=req.question,
        language=req.language,
        site_map=site_map,
        site_id=req.site_id,
        query_embedding=query_embedding,
        lat=req.lat,
        lng=req.lng,
        top_k=TOP_K_CHUNKS,
    )

    # Identify primary site & nearby restaurants for grounding and fallback metadata
    primary_site: Optional[HeritageSite] = None
    if req.site_id and req.site_id in site_map:
        primary_site = site_map[req.site_id]
    elif retrieved and retrieved[0].site_id in site_map:
        primary_site = site_map[retrieved[0].site_id]

    primary_restaurants: list[Restaurant] = []
    if primary_site is not None:
        primary_restaurants = sorted(
            list(primary_site.restaurants or []),
            key=lambda r: -float(r.rating),
        )

    citations = [
        ChatCitation(
            site_id=ch.site_id,
            site_name=ch.site_name,
            source_type=ch.source_type,
            snippet=ch.content[:220] + ("..." if len(ch.content) > 220 else ""),
            score=ch.rrf_score,
        )
        for ch in retrieved[:3]
    ]

    # Try Gemini grounded generation first when API key is configured
    gemini_result = await _generate_with_gemini(req, retrieved, primary_site, primary_restaurants)
    if gemini_result is not None:
        answer_text, suggested = gemini_result
        if not suggested:
            s_name = get_localized_site_name(primary_site, req.language) if primary_site else None
            suggested = _default_suggested_questions(req.language, s_name)
        return AiChatResponse(
            answer=answer_text,
            language=req.language,
            citations=citations,
            suggested_questions=suggested,
            mode="gemini",
        )

    # Smart structured fallback (always reliable without API key / quota)
    fallback_answer, suggested = build_structured_fallback_answer(
        question=req.question,
        language=req.language,
        retrieved=retrieved,
        primary_site=primary_site,
        primary_restaurants=primary_restaurants,
    )
    return AiChatResponse(
        answer=fallback_answer,
        language=req.language,
        citations=citations,
        suggested_questions=suggested,
        mode="fallback",
    )
