# Smart Heritage Guide — FastAPI + Supabase Backend

Hệ thống Backend cho ứng dụng di động **Smart Heritage Guide (TP. Hồ Chí Minh)** — đồ án môn *Phát triển các hệ thống thông minh*.

Backend tích hợp **FastAPI (Async)** + **Supabase Cloud (PostgreSQL + PostGIS + `pgvector` + Auth + Storage)**, đồng thời hỗ trợ **Dual-DB & Smart Fallback** (tự động chạy cục bộ với SQLite + Local JWT + Local Uploads + RAG/Vision/Routing fallback khi chưa cấu hình API key) để quá trình phát triển, kiểm thử `pytest` và demo bảo vệ không bao giờ bị gián đoạn.

---

## 1. Các Trụ cột Hệ thống Thông minh

1. **Gợi ý ngữ cảnh giải thích được (Explainable Context-Aware Scoring) & Lập lịch trình đi bộ tối ưu (2-Opt Walking Tour Planner):**
   - Chấm điểm đa tiêu chí $S(i) = 0.30 S_{\text{dist}} + 0.25 S_{\text{novelty}} + 0.20 S_{\text{category}} + 0.15 S_{\text{rating}} + 0.10 S_{\text{status}}$ kèm mảng lý do giải thích `reasons[]` đa ngôn ngữ (`vi/en/fr/zh/ja`).
   - Lập lịch trình đi bộ nhiều điểm trong quỹ thời gian ($T_{\max}$), tối ưu quãng đường bằng **Nearest-Neighbor + 2-Opt Local Search** (báo cáo số mét tiết kiệm được) và tự động chèn điểm dừng ẩm thực theo khung giờ ăn (`breakfast | lunch | dinner | cafe`).
2. **Trợ lý AI Hướng dẫn viên Hỏi–Đáp RAG (5 Ngôn ngữ):**
   - Truy xuất lai (Hybrid Retrieval) kết hợp **Vector Cosine Similarity** + **Lexical/Full-Text Search** qua **Reciprocal Rank Fusion (RRF)** trên 340 đoạn tri thức của 20 di tích & 26 quán ăn TP.HCM.
   - Sinh câu trả lời chống bịa đặt bằng **Google Gemini 2.5 Flash** (`google-genai`) kèm `citations` và `suggested_questions`; tự động chuyển sang chế độ **Smart Structured Fallback** khi không có `GEMINI_API_KEY` hoặc hết quota.
3. **Vision AI Nhận diện Di tích & Chống Gian lận Check-in (Anti-Fake Verifier):**
   - Lọc trước Top-8 di tích gần GPS nhất rồi gọi **Gemini Vision** trả về `matched_site_id`, `confidence`, `architectural_cues` và cờ `auto_open_audio` (có chế độ `gps_fallback` khi không có key).
   - Xác thực hành trình check-in bằng 4 quy tắc vật lý (GPS Geofence $\le 200\text{m}$, tốc độ đi bộ thực tế $0.3 - 2.5\text{ m/s}$, tính liên tục lộ trình chống teleport, điểm cộng Vision AI) để phân loại `verified | simulated | flagged` cho Bảng xếp hạng Cộng đồng & 6 Huy hiệu thành tựu tự động.

---

## 2. Cấu trúc Thư mục

```text
smart-heritage-guide-backend/
├── app/
│   ├── main.py                      # Khởi tạo FastAPI, CORS, Swagger /docs, lifespan auto-seed
│   ├── core/
│   │   ├── config.py                # Pydantic Settings (.env)
│   │   ├── database.py              # Async SQLAlchemy (Supabase Postgres & SQLite fallback)
│   │   └── security.py              # Supabase GoTrue + Local JWT, Guest/User/Admin guards
│   ├── models/entities.py           # 9 bảng ORM (Profile, HeritageSite, Restaurant, ...)
│   ├── schemas/dto.py               # Pydantic v2 Request/Response DTOs
│   ├── routers/                     # health, auth, sites, admin, ai, routing, journeys, leaderboard
│   └── services/                    # geo, storage, recommendation, rag, vision, antifake, routing, badge
├── supabase/migrations/
│   └── 001_initial_schema.sql       # PostGIS, pgvector, 9 bảng, GIST/HNSW/GIN, bucket heritage-photos & RLS
├── scripts/
│   └── seed_supabase.py             # Seed idempotent 20 di tích, 26 quán ăn, 340 RAG chunks, 6 huy hiệu
├── tests/                           # Bộ test tự động pytest (AI, Anti-Fake, RAG, Routing, API Smoke)
├── Dockerfile                       # Multi-stage slim Python 3.12
├── docker-compose.yml               # Chạy container cục bộ
└── render.yaml                      # Deploy 1 chạm lên Render
```

---

## 3. Cài đặt & Chạy Local (Nhanh trong 1 phút)

Yêu cầu: **Python 3.12+**

```bash
cd smart-heritage-guide-backend

# 1. Tạo môi trường ảo & cài đặt thư viện
py -m venv .venv
.venv\Scripts\activate      # Windows PowerShell/CMD
# source .venv/bin/activate # macOS/Linux
pip install -r requirements.txt

# 2. Tạo file cấu hình môi trường (có thể giữ mặc định để chạy SQLite local ngay)
copy .env.example .env

# 3. Seed dữ liệu 20 di tích TP.HCM, 26 quán ăn, 340 RAG chunks, 6 huy hiệu & tài khoản demo
python -m scripts.seed_supabase

# 4. Khởi động API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Truy cập tài liệu tương tác **Swagger UI**:
- Swagger `/docs`: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`
- Health Check: `http://localhost:8000/api/v1/health`

### Tài khoản mặc định để Demo trên Swagger / Mobile

| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| **Admin** (CRUD Di tích & Quán ăn) | `admin@smartheritage.vn` | `AdminHeritage@2026` |
| **User Demo** (Có sẵn 3 hành trình & 2 huy hiệu) | `demo@smartheritage.vn` | `DemoHeritage@2026` |

> Bấm `POST /api/v1/auth/login` trên Swagger, copy `access_token` rồi dán vào nút **Authorize** góc trên bên phải để test các API cần quyền `User` hoặc `Admin`.

---

## 4. Kết nối Supabase Cloud (PostgreSQL + PostGIS + `pgvector` + Storage)

1. Tạo project mới trên [Supabase](https://supabase.com/).
2. Mở **SQL Editor** và chạy toàn bộ nội dung file `supabase/migrations/001_initial_schema.sql`:
   - Bật extension `postgis`, `vector`, `pgcrypto`.
   - Tạo 9 bảng + cột PostGIS `geography(Point, 4326)` tự sinh + chỉ mục `GIST`, `HNSW`, `GIN`.
   - Tạo Storage bucket `heritage-photos` (public read) và toàn bộ chính sách **RLS**.
3. Điền thông tin vào file `.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   SUPABASE_JWT_SECRET=<your-jwt-secret>
   GEMINI_API_KEY=<your-gemini-api-key>
   GOONG_API_KEY=<optional-goong-api-key>
   ```
4. Chạy seed lên Supabase (thêm `--embeddings` nếu muốn sinh vector `text-embedding-004`):
   ```bash
   python -m scripts.seed_supabase --embeddings
   ```

---

## 5. Danh sách API Endpoints (`/api/v1`)

- **System:** `GET /api/v1/health`
- **Auth:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `PATCH /api/v1/auth/me`
- **Heritage Sites:** `GET /api/v1/sites`, `GET /api/v1/sites/{site_id}`, `GET /api/v1/sites/{site_id}/restaurants`
- **Admin CRUD (`role=admin`):** `POST/PUT/DELETE /api/v1/admin/sites`, `POST/PUT/DELETE /api/v1/admin/restaurants`
- **Smart AI:** `POST /api/v1/ai/recommendations`, `POST /api/v1/ai/tour-plan`, `POST /api/v1/ai/chat`, `POST /api/v1/ai/vision/identify`
- **Routing Proxy:** `POST /api/v1/routing/walking`
- **Journeys & Check-in:** `GET /api/v1/journeys/me`, `POST /api/v1/journeys/check-in`, `POST /api/v1/journeys/{journey_id}/photos`, `POST /api/v1/journeys/sync`
- **Leaderboard & Badges:** `GET /api/v1/leaderboard/global`, `GET /api/v1/leaderboard/me`, `GET /api/v1/badges`

---

## 6. Kiểm thử tự động (`pytest`)

```bash
.venv\Scripts\python.exe -m pytest -v
```

---

## 7. Chạy bằng Docker & Deploy lên Render

### Local Docker Compose
```bash
docker compose up --build
```

### Deploy 1 chạm lên Render
1. Push thư mục `smart-heritage-guide-backend/` lên GitHub.
2. Trên Render, chọn **New → Blueprint** và trỏ tới file `render.yaml`.
3. Điền các biến bí mật (`DATABASE_URL`, `SUPABASE_*`, `GEMINI_API_KEY`, `GOONG_API_KEY`) rồi bấm **Apply**.
