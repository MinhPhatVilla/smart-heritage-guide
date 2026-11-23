"""CLI helper to download open-source offline `sherpa-onnx` TTS models on demand.

Usage (from `backend/`):
  python -m scripts.download_tts_models --list
  python -m scripts.download_tts_models --langs vi
  python -m scripts.download_tts_models --langs vi en fr zh
  python -m scripts.download_tts_models --langs vi kokoro   # vi + EN/FR/ZH/JA/ES/IT/PT/HI (all offline!)

Downloaded models live in `backend/models/tts/` (gitignored).
"""

from __future__ import annotations

import argparse
import io
from pathlib import Path
import tarfile
import urllib.request

from app.core.config import settings
from app.services.tts_service import OFFLINE_ONNX_CATALOG, list_installed_offline_models


def download_and_extract(key: str, target_root: Path) -> Path:
    entry = OFFLINE_ONNX_CATALOG.get(key)
    if not entry:
        valid = ", ".join(sorted(OFFLINE_ONNX_CATALOG.keys()))
        raise SystemExit(f"Không tìm thấy gói '{key}'. Các gói hỗ trợ: {valid}")

    dest_dir = target_root / str(entry["name"])
    if dest_dir.is_dir() and list(dest_dir.glob("*.onnx")) and (dest_dir / "tokens.txt").is_file():
        print(f"[SKIP] Đã có sẵn model offline: {dest_dir}")
        return dest_dir

    url = str(entry["url"])
    print(f"[DOWNLOAD] {entry['label']} (~{entry['size_mb']} MB) từ:\n  {url}")
    target_root.mkdir(parents=True, exist_ok=True)

    req = urllib.request.Request(url, headers={"User-Agent": "SmartHeritageGuide/1.0"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        raw = resp.read()

    print(f"[EXTRACT] Giải nén {len(raw) / (1024 * 1024):.1f} MB vào {target_root} ...")
    with tarfile.open(fileobj=io.BytesIO(raw), mode="r:bz2") as tar:
        tar.extractall(path=target_root)

    if not dest_dir.is_dir():
        raise RuntimeError(f"Giải nén xong nhưng không thấy thư mục {dest_dir}")

    print(f"[OK] Sẵn sàng chạy offline 100%: {dest_dir}")
    return dest_dir


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Tải mô hình giọng nói Open-Source Offline (sherpa-onnx) vào backend/models/tts/"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="Hiển thị danh sách model có thể tải và model đã cài sẵn",
    )
    parser.add_argument(
        "--langs",
        nargs="+",
        default=[],
        help="Danh sách mã gói cần tải (ví dụ: vi en fr zh de es ru kokoro)",
    )
    args = parser.parse_args()
    target_root = settings.tts_models_dir_path

    if args.list or not args.langs:
        print("=== DANH MỤC MODEL OFFLINE OPEN-SOURCE (sherpa-onnx) ===")
        for k, meta in OFFLINE_ONNX_CATALOG.items():
            print(f"  {k:7s} | ~{meta['size_mb']:3d} MB | {meta['label']}")
        installed = list_installed_offline_models()
        print(f"\nĐã cài sẵn trong {target_root}: {list(installed.keys()) or '(chưa có)'}")
        if not args.langs:
            print("\nVí dụ tải tiếng Việt + đa ngôn ngữ Kokoro:")
            print("  python -m scripts.download_tts_models --langs vi kokoro")
        return

    for lang_key in args.langs:
        download_and_extract(lang_key.strip().lower(), target_root)


if __name__ == "__main__":
    main()
