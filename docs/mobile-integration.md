# 5. Lộ trình Tích hợp Mobile & Kế hoạch Kiểm thử (Verification Plan)

Tài liệu này trình bày kiến trúc tích hợp của ứng dụng di động `mobile/` (React Native / Expo SDK 58 + TypeScript) theo nguyên tắc **Offline-First, Tự động cập nhật thông minh & Non-Breaking**, cùng bộ tiêu chí kiểm thử tự động trong CI/CD.

---

## 5.1. Kiến trúc Ứng dụng & Tích hợp Mobile (`mobile/`)

Mọi tính năng kết nối mạng đều đảm bảo: khi điện thoại mất 4G/Wi-Fi hoặc Backend chưa chạy, ứng dụng tự động vận hành trơn tru trên **kho dữ liệu nội bộ 97 địa điểm TP.HCM mở rộng** (`mobile/src/data/`, 18 cụm khu vực `CITY_PRESETS`, **291 ảnh Wikimedia Commons**, **246 quán ăn Overture Maps**, ranh giới biển Việt Nam & TP.HCM) cùng bộ đệm `AsyncStorage` mà **không bao giờ crash hay hiện màn hình trắng**.

### 6 Lớp Kiến trúc & Tích hợp Chính

1. **Header Dùng chung & Điều hướng 5 Tab Taskbar (`App.tsx`):**
   - **Header luôn hiển thị trên cả Bản đồ & mọi tab:** gồm **Pill Thời tiết trực tiếp (`☀️ 30°`)** (chạm mở Bottom Sheet chi tiết nhiệt độ, cảm nhận, độ ẩm `%`, khả năng mưa `%`, gió, dự báo 4 giờ tới & nút lập tour AI theo thời tiết), **nút Tự động thuyết minh 1 chạm (`🔊`/`🔇`)**, **Ngôn ngữ (`VI/EN/FR/ZH/JA`)** và **Tài khoản**.
   - **5 Tab dưới Taskbar tách bạch, không dồn cụm:**
     1. **Khám phá:** Thẻ thời tiết 1 dòng thu gọn/mở rộng (`WeatherWidgetCard.tsx`), chuyển đổi nhanh **`Địa điểm | Ẩm thực`**, thanh phím tắt AI 1 hàng và danh sách thẻ thoáng rõ (`SiteCard.tsx`).
     2. **Bản đồ 3D WebGL (`MapExplorer.tsx`):** Mapbox GL JS `v3.10.0` (`theme: 'faded'`, Warm-Editorial palette, đồng màu toàn bộ đường & cầu, không còn cầu vàng) + MapLibre OSM 3D fallback; 100% ghim di sản/cụm/quán ăn render trên GPU WebGL (60–120fps); ranh giới cắt theo **biên giới biển Việt Nam (Overture `maritime`)** & bờ biển OSM; áp dụng **Keep-Alive + Background Pre-Warm (650ms)** giữ sống WebGL context và tạm ngưng bridge khi ẩn (`isVisible`) giúp chuyển tab **0ms không lag**.
     3. **Hành trình (`JourneyAndRankingView.tsx` — chế độ `journey`):** Nhật ký đi bộ, Album ảnh (có Lightbox xem ảnh nội tuyến không lỗi nested modal) và Top 5 địa điểm gần nhất chưa khám phá.
     4. **Xếp hạng (`JourneyAndRankingView.tsx` — chế độ `ranking`):** Bảng xếp hạng Cộng đồng xác thực (`verified` / `simulated` / `flagged`), tiến độ cá nhân và bộ sưu tập **6 Huy hiệu thành tựu**.
     5. **Quản trị (`AdminDashboardView.tsx` + `AdminMapPickerModal.tsx`):** Chỉ hiện với tài khoản `role = "admin"`, hỗ trợ thêm/sửa/xóa di tích & quán ăn, chạm hoặc kéo ghim trên bản đồ để chọn tọa độ chính xác và xem trước ảnh bìa.

2. **Tự động Cập nhật Thông minh (Zero Manual Friction):**
   - **Thời tiết (`weatherService.ts`):** Tự động lấy từ Open-Meteo và làm mới mỗi **5 phút**, khi tọa độ GPS thay đổi đáng kể, hoặc khi người dùng quay lại ứng dụng (`AppState` / `visibilitychange`).
   - **Hành trình Cloud & Bảng xếp hạng:** Tự động đồng bộ hành trình offline lên Cloud khi đã đăng nhập; tự động làm mới Bảng xếp hạng Cộng đồng & Huy hiệu mỗi **60 giây**, khi quay lại app và ngay sau mỗi lượt check-in.

3. **Tầng API Client & Xác thực tùy chọn (`apiClient.ts`, `authService.ts`, `adminService.ts`):**
   - Đọc địa chỉ máy chủ qua `EXPO_PUBLIC_API_BASE_URL` và Mapbox token công khai qua `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`.
   - Mọi request đi qua `apiClient.ts` có `AbortController` timeout và trả về kiểu an toàn `ApiResult<T>`.
   - Lưu phiên đăng nhập vào `AsyncStorage`; giao diện `AuthModal.tsx` hỗ trợ Khách chuyển sang Đăng nhập bất cứ lúc nào mà không chặn trải nghiệm.

4. **Dẫn đường Đi bộ 3D & Lưu trữ Hành trình (`routingService.ts`, `locationService.ts`, `journeyStorage.ts`):**
   - `routingService.ts` ưu tiên gọi `POST /api/v1/routing/walking` qua Backend Proxy (hưởng Route Cache 7 ngày & ẩn `GOONG_API_KEY`); khi mất mạng tự fallback sang FOSSGIS OSRM hoặc nội suy.
   - Hỗ trợ **dẫn đường đi bộ 3D Heading-Up** có la bàn bám hướng di chuyển trên `MapExplorer.tsx`.
   - `journeyStorage.ts` đồng bộ check-in lên `POST /api/v1/journeys/check-in`, tải ảnh lên Storage, nhận kết quả **Anti-Fake** và thông báo **Huy hiệu mới mở khóa**.

5. **Thuyết minh AI Neural TTS & Modal Chi tiết Di tích (`speechService.ts`, `AudioGuidePlayer.tsx`, `HeritageDetailModal.tsx`):**
   - Phát giọng đọc **AI Neural MP3** (Hoài My / Nam Minh + 5 ngôn ngữ) từ `/api/v1/ai/tts` kèm prefetch đoạn tiếp theo, thanh tiến độ thời gian thực `0–100%` và fallback offline `expo-speech` đã chuẩn hóa văn bản tiếng Việt (`speechTextUtils.ts`).
   - `HeritageDetailModal.tsx` tích hợp thanh điều hướng dính (`← Quay lại | Tiêu đề | ✕`), portal `position: fixed; zIndex: 9999` trên Web, Lightbox ảnh nội tuyến không dùng nested `<Modal>`, bản đồ mini `SiteMiniMap.tsx` và bọc an toàn `speechService.stop()` khi đóng.

6. **Giao diện 3 Tính năng Thông minh AI trên Mobile:**
   - **Lập Tour AI (`SmartTourModal.tsx`):** Chọn quỹ thời gian (`90 / 120 / 180 phút`), sở thích danh mục, giờ xuất phát và tự đính kèm **`weather_context`** thời tiết thực tế để sinh lịch trình `2-Opt` kèm quán ăn theo khung giờ.
   - **Hỏi–Đáp RAG (`AiChatModal.tsx`):** Mở từ thanh Khám phá hoặc ngay trong chi tiết di tích, hỗ trợ 5 ngôn ngữ kèm `citations[]` và `suggested_questions[]`.
   - **Quét Vision AI (`PhotoCaptureModal.tsx`):** Chụp công trình thực tế để nhận diện di tích và tự động gợi ý phát thuyết minh âm thanh.

---

## 5.2. Kế hoạch Thực thi & Kiểm thử Tự động (Verification Plan)

| Giai đoạn | Hạng mục & Tiêu chí Nghiệm thu |
| :--- | :--- |
| **Giai đoạn 1: Cơ sở dữ liệu & Prisma** | Chạy [`backend/supabase/migrations/001_initial_schema.sql`](../backend/supabase/migrations/001_initial_schema.sql) (bật `postgis`, `vector`, `pgcrypto`, tạo 9 bảng, chỉ mục `GIST`/`HNSW`/`GIN`, bucket `heritage-photos` và RLS) hoặc `npm run db:setup` với Prisma; chạy `python -m scripts.seed_supabase` nạp **50 di tích (5 ngôn ngữ 1-1)**, **56 quán ăn**, **850 RAG chunks** và **6 huy hiệu**. |
| **Giai đoạn 2: Backend FastAPI, AI & Neural TTS** | Hoàn thiện Core, Auth Guard (`Guest/User/Admin`), truy vấn PostGIS, Admin CRUD (tự re-index RAG), 3 trụ cột AI, Neural TTS (`edge-tts` + MP3 cache), Routing Proxy + Cache, Leaderboard & Badges, đóng gói `Dockerfile` và `render.yaml`. |
| **Giai đoạn 3: Kiểm thử Backend (`pytest`)** | **7 bộ test (40+ test cases)** trong `backend/tests/` pass 100%:<br>- `test_recommendation.py`: Tổng thời gian tour $\le T_{\max}$, `2-Opt` rút ngắn quãng đường, chèn đúng quán ăn theo khung giờ.<br>- `test_antifake.py`: GPS $> 200\text{m}$ bị `flagged`, tốc độ xe máy ($40\text{ km/h}$) bị `flagged`, đi bộ hợp lệ đạt `verified`.<br>- `test_rag_fallback.py`: Hybrid RRF retrieval & chế độ Fallback hoạt động không cần `GEMINI_API_KEY`.<br>- `test_tts.py`: Kiểm tra danh sách giọng Neural 5 ngôn ngữ, cache MP3 và validate input `/api/v1/ai/tts`.<br>- `test_vision.py`: Tiền lọc Top-8 GPS và `gps_fallback`.<br>- `test_routing_proxy.py`: Cache hit/miss & chuỗi fallback routing.<br>- `test_api_smoke.py`: Kiểm tra đầy đủ phân quyền Guest / User / Admin & luồng check-in. |
| **Giai đoạn 4: Kiểm thử Mobile & CI/CD** | Toàn bộ 3 cổng GitHub Actions CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) báo xanh:<br>1. **Standards & Security**: Không commit `.env`/DB/build artifacts; 100% dùng `Times New Roman`, không dùng `Georgia`.<br>2. **Backend CI**: `pytest -v` pass 100% và kiểm tra OpenAPI schema (**25 paths** $\ge 18$).<br>3. **Mobile CI**: `npm run typecheck` (0 lỗi), `npm run test` (**4 files / 17 Vitest tests** pass gồm `geoUtils`, `routingService`, `speechService`, `weatherService`) và `npm run export:web` xuất bundle thành công (**2053 modules** → `dist`). |

---

## 5.3. Bộ Lệnh Kiểm tra Nhanh Trước khi Mở Pull Request

```bash
# 1. Kiểm thử Backend (tại thư mục backend/)
.venv\Scripts\python.exe -m pytest -v
.venv\Scripts\python.exe -c "from app.main import app; print('OpenAPI paths:', len(app.openapi()['paths']))"

# 2. Kiểm thử Mobile (tại thư mục mobile/)
npm run typecheck
npm run test
npm run export:web
```
