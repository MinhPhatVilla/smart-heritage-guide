"""Optional CLI wrapper around `app.services.tts_service` for pre-fetching offline ONNX models.

Lưu ý: Khi deploy bằng Docker / Render (`Dockerfile` + `main.py` lifespan),
Backend đã **tự động** tải sẵn model cấu hình trong `TTS_PRELOAD_OFFLINE_LANGS` (mặc định `vi`)
và tự tải theo yêu cầu (lazy-download) khi có request offline. Script này chỉ dùng nếu bạn
muốn chủ động tải trước thêm các gói ngôn ngữ khác trên máy local.
"""

from __future__ import annotations

import argparse

from app.core.config import settings
from app.services.tts_service import (
    OFFLINE_ONNX_CATALOG,
    ensure_offline_model_installed_sync,
    list_installed_offline_models,
)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Tải trước model giọng nói Open-Source Offline vào backend/models/tts/"
    )
    parser.add_argument("--list", action="store_true", help="Xem danh sách model hỗ trợ & đã cài")
    parser.add_argument("--langs", nargs="+", default=[], help="Mã gói cần tải (vd: vi en fr zh kokoro)")
    args = parser.parse_args()

    if args.list or not args.langs:
        print("=== DANH MỤC MODEL OFFLINE OPEN-SOURCE ===")
        for k, meta in OFFLINE_ONNX_CATALOG.items():
            print(f"  {k:7s} | ~{meta['size_mb']:3d} MB | {meta['label']}")
        installed = list_installed_offline_models()
        print(f"\nĐã cài trong {settings.tts_models_dir_path}: {list(installed.keys()) or '(chưa có)'}")
        return

    for key in args.langs:
        dest = ensure_offline_model_installed_sync(key)
        print(f"[OK] Sẵn sàng offline: {dest}")


if __name__ == "__main__":
    main()
