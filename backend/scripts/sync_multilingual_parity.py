"""Synchronize all 5 languages (vi, en, fr, zh, ja) to 1-to-1 parity across all 50 HCMC sites.

Uses Vietnamese (`vi`) as the single authoritative source of truth so that:
- `shortSummary` has equivalent richness in all 5 languages
- `architecturalHighlights` has the EXACT same number of bullet items (1-to-1) in all 5 languages
- `audioScript` has the EXACT same number of narration paragraphs (1-to-1) in all 5 languages
- Curated localized `name`, `historicalEra`, and `openingHours` per language are preserved

Updates:
  1. mobile/src/data/wikipediaEnrichment.ts (adds full `translations` parity per site)
  2. backend/scripts/seed_supabase.py (`SEED_SITES_DATA` with full 5-language parity)

Usage:
    cd backend
    python -m scripts.sync_multilingual_parity
"""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

ENRICH_TS = REPO_ROOT / "mobile" / "src" / "data" / "wikipediaEnrichment.ts"
SEED_PY = BACKEND_ROOT / "scripts" / "seed_supabase.py"

TARGET_LANGS: list[tuple[str, str]] = [
    ("en", "en"),
    ("fr", "fr"),
    ("zh", "zh-CN"),
    ("ja", "ja"),
]

HDR = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}


def translate_batch_vi(texts: list[str], target_google_code: str) -> list[str]:
    """Translate a list of Vietnamese strings to target language preserving 1-to-1 alignment."""
    if not texts:
        return []
    # Use a rare sentinel delimiter unlikely to be altered by translation
    delimiter = "\n[[[SHG_SEP]]]\n"
    joined = delimiter.join(texts)

    # Chunk if joined exceeds ~3200 chars to stay well within URL limits
    if len(joined) > 2600:
        out: list[str] = []
        for t in texts:
            out.extend(translate_batch_vi([t], target_google_code))
        return out

    url = (
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi"
        f"&tl={urllib.parse.quote(target_google_code)}&dt=t&q={urllib.parse.quote(joined)}"
    )
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers=HDR)
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            translated = "".join(seg[0] for seg in data[0] if seg and seg[0])
            # Split robustly around delimiter (allowing minor whitespace/bracket variation)
            parts = re.split(r"\s*\[+\s*SHG_SEP\s*\]+\s*", translated)
            if len(parts) == len(texts):
                return [p.strip() for p in parts]
            # Fallback to per-item translation if delimiter count shifted
            break
        except Exception as exc:
            if "429" in str(exc) or "503" in str(exc):
                time.sleep(1.0 * (attempt + 1))
                continue
            break

    # Safe per-item fallback guaranteeing 1-to-1 length
    results: list[str] = []
    for t in texts:
        u = (
            "https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi"
            f"&tl={urllib.parse.quote(target_google_code)}&dt=t&q={urllib.parse.quote(t)}"
        )
        translated_item = t
        for attempt in range(3):
            try:
                req = urllib.request.Request(u, headers=HDR)
                with urllib.request.urlopen(req, timeout=12) as resp:
                    d = json.loads(resp.read().decode("utf-8"))
                translated_item = "".join(seg[0] for seg in d[0] if seg and seg[0]).strip()
                break
            except Exception:
                time.sleep(0.8 * (attempt + 1))
        results.append(translated_item)
    return results


def equalize_site(site: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    sid = site["id"]
    vi = site["translations"]["vi"]

    vi_summary = str(vi.get("shortSummary", "")).strip()
    vi_highlights = [str(h).strip() for h in vi.get("architecturalHighlights", []) if str(h).strip()]
    vi_script = [str(p).strip() for p in vi.get("audioScript", []) if str(p).strip()]

    # Pack [shortSummary, ...highlights, ...audioScript] into a single batch per language
    packed = [vi_summary] + vi_highlights + vi_script
    n_hl = len(vi_highlights)

    synced_translations: dict[str, Any] = {
        "vi": {
            "name": vi["name"],
            "shortSummary": vi_summary,
            "historicalEra": vi.get("historicalEra", ""),
            "openingHours": vi.get("openingHours", ""),
            "architecturalHighlights": vi_highlights,
            "audioScript": vi_script,
        }
    }

    for lang_code, google_code in TARGET_LANGS:
        existing = site["translations"].get(lang_code, {})
        translated = translate_batch_vi(packed, google_code)
        assert len(translated) == len(packed), f"Parity mismatch on {sid}/{lang_code}"

        new_summary = translated[0] or existing.get("shortSummary", vi_summary)
        new_highlights = translated[1 : 1 + n_hl]
        new_script = translated[1 + n_hl :]

        synced_translations[lang_code] = {
            "name": existing.get("name") or vi["name"],
            "shortSummary": new_summary,
            "historicalEra": existing.get("historicalEra") or vi.get("historicalEra", ""),
            "openingHours": existing.get("openingHours") or vi.get("openingHours", ""),
            "architecturalHighlights": new_highlights,
            "audioScript": new_script,
        }

    return sid, synced_translations


def main() -> None:
    from scripts.seed_supabase import SEED_SITES_DATA

    print(f"🌍 Đang đồng bộ 1-1 nội dung 5 ngôn ngữ (VI/EN/FR/ZH/JA) cho {len(SEED_SITES_DATA)} địa điểm...")
    t0 = time.time()
    translated_by_site: dict[str, dict[str, Any]] = {}

    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = [pool.submit(equalize_site, site) for site in SEED_SITES_DATA]
        done_count = 0
        for fut in as_completed(futures):
            sid, trans = fut.result()
            translated_by_site[sid] = trans
            done_count += 1
            if done_count % 10 == 0 or done_count == len(SEED_SITES_DATA):
                print(f"   ... hoàn thành {done_count}/{len(SEED_SITES_DATA)} địa điểm ({time.time() - t0:.1f}s)")

    # 1. Update SEED_SITES_DATA in backend/scripts/seed_supabase.py
    updated_sites: list[dict[str, Any]] = []
    for site in SEED_SITES_DATA:
        s_copy = json.loads(json.dumps(site))
        s_copy["translations"] = translated_by_site[site["id"]]
        updated_sites.append(s_copy)

    seed_src = SEED_PY.read_text(encoding="utf-8")
    eol = "\r\n" if "\r\n" in seed_src else "\n"
    src_lf = seed_src.replace("\r\n", "\n")
    s_mark = 'SEED_SITES_DATA: list[dict[str, Any]] = json.loads(\n    r"""'
    e_mark = '"""\n)'
    si = src_lf.index(s_mark) + len(s_mark)
    ei = src_lf.index(e_mark, si)
    new_seed_json = json.dumps(updated_sites, ensure_ascii=False, indent=2)
    assert '"""' not in new_seed_json
    SEED_PY.write_text((src_lf[:si] + new_seed_json + src_lf[ei:]).replace("\n", eol), encoding="utf-8")

    # 2. Update mobile/src/data/wikipediaEnrichment.ts to store full synced 5-language `translations`
    ts_text = ENRICH_TS.read_text(encoding="utf-8")
    marker = "export const WIKIPEDIA_ENRICHMENT_BY_SITE: Record<string, WikipediaSiteEnrichment> = "
    idx = ts_text.index(marker) + len(marker)
    end_idx = ts_text.rindex(";")
    enrichment = json.loads(ts_text[idx:end_idx])

    for sid, trans in translated_by_site.items():
        entry = enrichment.setdefault(sid, {})
        entry["translations"] = trans

    # Ensure TS interface declares optional `translations?: Record<SupportedLanguage, LocalizedContent>`
    header = ts_text[:idx]
    if "LocalizedContent" not in header:
        header = header.replace(
            "import { DocumentaryMedia } from '../types/heritage';",
            "import { DocumentaryMedia, LocalizedContent, SupportedLanguage } from '../types/heritage';",
        )
    if "translations?:" not in header:
        header = header.replace(
            "  enWikiParagraphs?: string[];\n}",
            "  enWikiParagraphs?: string[];\n  translations?: Record<SupportedLanguage, LocalizedContent>;\n}",
        )

    new_ts = header + json.dumps(enrichment, ensure_ascii=False, indent=2) + ts_text[end_idx:]
    ENRICH_TS.write_text(new_ts, encoding="utf-8")

    # Verify strict 1-to-1 parity across all 5 languages
    for l in ("vi", "en", "fr", "zh", "ja"):
        segs = [len(s["translations"][l]["audioScript"]) for s in updated_sites]
        hls = [len(s["translations"][l]["architecturalHighlights"]) for s in updated_sites]
        chars = [sum(len(x) for x in s["translations"][l]["audioScript"]) for s in updated_sites]
        print(
            f"✅ {l.upper()}: avg_segments={sum(segs)/len(segs):.2f} (min={min(segs)}, max={max(segs)}) | "
            f"avg_highlights={sum(hls)/len(hls):.2f} | avg_script_chars={sum(chars)/len(chars):.0f}"
        )


if __name__ == "__main__":
    main()
