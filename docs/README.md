# Tài liệu Kỹ thuật & Kiến trúc Hệ thống — Smart Heritage Guide

> **Học viện Công nghệ Bưu chính Viễn thông**  
> **Môn học:** Phát triển các Hệ thống Thông minh (HK1 - Năm 4)  
> **Cập nhật:** 22/11/2026

Thư mục `docs/` chứa toàn bộ tài liệu thiết kế kiến trúc, cơ sở dữ liệu, thuật toán AI, đặc tả API và lộ trình tích hợp cho hệ thống **Smart Heritage Guide (TP. Hồ Chí Minh)** được chuyển đổi và mở rộng chi tiết sang định dạng Markdown (`.md`) để dễ đọc trực tiếp trên GitHub, theo dõi thay đổi qua Git diff và phối hợp làm việc nhóm.

---

## Mục lục Tài liệu

| Tài liệu | Nội dung chính |
| :--- | :--- |
| [1. Kiến trúc Tổng thể (`architecture.md`)](./architecture.md) | Quyết định thiết kế, sơ đồ kiến trúc phân lớp 4 tầng (Mobile Expo · FastAPI · Supabase · External AI/Routing), nguyên tắc Offline-First và phân tách trách nhiệm. |
| [2. Thiết kế Cơ sở Dữ liệu (`database-schema.md`)](./database-schema.md) | Sơ đồ ER, các extension Supabase (`postgis`, `pgvector`, `pgcrypto`), đặc tả chi tiết 9 bảng ORM, chỉ mục `GIST`/`HNSW`/`GIN`, Storage bucket `heritage-photos` & chính sách RLS. |
| [3. Ba Trụ cột Hệ thống Thông minh (`ai-pillars.md`)](./ai-pillars.md) | Công thức chấm điểm đa tiêu chí giải thích được, thuật toán lập tour đi bộ **Nearest-Neighbor + 2-Opt**, **Hybrid RAG + RRF** 5 ngôn ngữ, **Vision AI** & **Anti-Fake GPS Verifier** cùng 6 Huy hiệu thành tựu. |
| [4. Đặc tả REST API (`api-specification.md`)](./api-specification.md) | Danh mục 23 endpoints `/api/v1`, phân quyền `Public / User / Admin`, cơ chế Bearer JWT trên Swagger `/docs`, tài khoản demo và cấu trúc DTO. |
| [5. Tích hợp Mobile & Kiểm thử (`mobile-integration.md`)](./mobile-integration.md) | Lộ trình tích hợp vào `mobile/` (Expo SDK 58), xử lý Offline Fallback, kế hoạch kiểm thử tự động (`pytest`, `vitest`, `tsc`, `expo export`) và tiêu chí nghiệm thu. |

---

## Thông tin Tổng quan Dự án

| Hạng mục | Thông tin chi tiết |
| :--- | :--- |
| **Tên dự án Monorepo** | `smart-heritage-guide` |
| **Ứng dụng di động** | `mobile/` — React Native / Expo SDK 58 + TypeScript (Android, iOS, Expo Web) |
| **Máy chủ Backend & AI** | `backend/` — Python 3.12 + FastAPI (Async) + Uvicorn |
| **Cơ sở dữ liệu & Cloud** | Supabase Cloud (`PostgreSQL` + `PostGIS` + `pgvector` + `Auth` + `Storage`) kèm chế độ chạy Local SQLite + Fallback |
| **3 Trụ cột Hệ thống Thông minh** | 1. Gợi ý ngữ cảnh giải thích được & Lập tour đi bộ tối ưu (`2-Opt`)<br>2. Trợ lý AI Hướng dẫn viên RAG đa ngôn ngữ (`vi / en / fr / zh / ja`)<br>3. Vision AI nhận diện di tích & Chống gian lận GPS/Check-in (`Anti-Fake`) |
| **Quy chuẩn làm việc nhóm** | Xem chi tiết tại [CONTRIBUTING.md](../CONTRIBUTING.md) |
