# Tài liệu Kỹ thuật & Kiến trúc Hệ thống — Smart Heritage Guide

> **Học viện Công nghệ Bưu chính Viễn thông**  
> **Môn học:** Phát triển các Hệ thống Thông minh (HK1 - Năm 4)  
> **Cập nhật:** 22/11/2026

Thư mục `docs/` chứa toàn bộ tài liệu thiết kế kiến trúc, cơ sở dữ liệu, thuật toán AI, đặc tả API và lộ trình tích hợp cho hệ thống **Smart Heritage Guide (TP. Hồ Chí Minh mở rộng)** ở định dạng Markdown (`.md`) để dễ đọc trực tiếp trên GitHub, theo dõi thay đổi qua Git diff và phối hợp làm việc nhóm.

---

## Mục lục Tài liệu

| Tài liệu | Nội dung chính |
| :--- | :--- |
| [1. Kiến trúc Tổng thể (`architecture.md`)](./architecture.md) | Quyết định thiết kế, sơ đồ kiến trúc phân lớp 4 tầng (Mobile Expo 3D WebGL · FastAPI & Neural TTS · Supabase/Prisma · External AI/Routing/Weather), nguyên tắc Offline-First và cấu trúc Monorepo hiện tại. |
| [2. Thiết kế Cơ sở Dữ liệu (`database-schema.md`)](./database-schema.md) | Sơ đồ ER, các extension Supabase (`postgis`, `pgvector`, `pgcrypto`), đặc tả chi tiết 9 bảng ORM (đồng bộ cả **SQLAlchemy** & **Prisma ORM**), chỉ mục `GIST`/`HNSW`/`GIN`, Storage bucket `heritage-photos`, RLS và bộ 4 script đồng bộ dữ liệu (`seed`, `wikipedia`, `overture`, `multilingual`). |
| [3. Ba Trụ cột Hệ thống Thông minh (`ai-pillars.md`)](./ai-pillars.md) | Công thức chấm điểm đa tiêu chí giải thích được, thuật toán lập tour đi bộ **Nearest-Neighbor + 2-Opt** kết hợp ngữ cảnh **Thời tiết trực tiếp (Open-Meteo)**, **Hybrid RAG + RRF** 5 ngôn ngữ, **AI Neural TTS (`edge-tts`)**, **Vision AI** & **Anti-Fake GPS Verifier** cùng 6 Huy hiệu thành tựu. |
| [4. Đặc tả REST API (`api-specification.md`)](./api-specification.md) | Danh mục **25 OpenAPI paths (29 operations)** thuộc `/api/v1` (bao gồm các endpoint Neural TTS `/ai/tts`), phân quyền `Public / User / Admin`, cơ chế Bearer JWT trên Swagger `/docs`, tài khoản demo và cấu trúc DTO chuẩn theo `dto.py`. |
| [5. Tích hợp Mobile & Kiểm thử (`mobile-integration.md`)](./mobile-integration.md) | Kiến trúc Mobile Offline-First (**97 địa điểm**, **291 ảnh Wikimedia**, **246 quán ăn Overture**), bản đồ 3D WebGL 60–120fps (**Keep-Alive 0ms**), giao diện 5 tab Taskbar & Header Thời tiết/Thuyết minh 1 chạm, Admin Dashboard + Map Picker và kế hoạch kiểm thử CI/CD (`pytest`, `vitest`, `tsc`, `expo export`). |

---

## Thông tin Tổng quan Dự án

| Hạng mục | Thông tin chi tiết |
| :--- | :--- |
| **Tên dự án Monorepo** | `smart-heritage-guide` |
| **Ứng dụng di động** | `mobile/` — React Native / Expo SDK 58 + TypeScript (Android, iOS, Expo Web) với bản đồ 3D WebGL (Mapbox GL JS `v3.10.0` / MapLibre OSM 3D) |
| **Máy chủ Backend & AI** | `backend/` — Python 3.12 + FastAPI (Async) + Uvicorn + Microsoft Neural TTS (`edge-tts`) |
| **Cơ sở dữ liệu & ORM** | Supabase Cloud (`PostgreSQL` + `PostGIS` + `pgvector` + `Auth` + `Storage`) hỗ trợ song song **SQLAlchemy Async** & **Prisma ORM** (`backend/prisma/`), kèm chế độ chạy Local SQLite + Fallback |
| **Quy mô Dữ liệu** | **Mobile Offline-First:** 97 địa điểm TP.HCM hợp nhất (Sài Gòn, Bình Dương, Bà Rịa – Vũng Tàu, Hồ Tràm, Đặc khu Côn Đảo), 18 cụm khu vực, 291 ảnh thực tế Wikimedia Commons, 246 quán ăn Overture Maps.<br>**Supabase Seed:** 50 địa điểm (đồng bộ 1-1 đủ 5 ngôn ngữ), 56 quán ăn tuyển chọn, 850 RAG chunks, 6 huy hiệu. |
| **3 Trụ cột Hệ thống Thông minh** | 1. Gợi ý ngữ cảnh giải thích được & Lập tour đi bộ tối ưu (`2-Opt`) tích hợp **Thời tiết trực tiếp**<br>2. Trợ lý AI Hướng dẫn viên **Hybrid RAG** 5 ngôn ngữ (`vi / en / fr / zh / ja`) & **AI Neural TTS**<br>3. **Vision AI** nhận diện di tích & Chống gian lận GPS/Check-in (`Anti-Fake`) |
| **Quy chuẩn làm việc nhóm** | Xem chi tiết tại [CONTRIBUTING.md](../CONTRIBUTING.md) |
