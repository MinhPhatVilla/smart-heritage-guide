# 5. Lộ trình Tích hợp Mobile & Kế hoạch Kiểm thử (Verification Plan)

Tài liệu này trình bày cách ứng dụng di động `mobile/` (React Native / Expo SDK 58) tích hợp với Backend FastAPI theo nguyên tắc **Offline-First & Non-Breaking**, cùng bộ tiêu chí kiểm thử tự động trong CI/CD.

---

## 5.1. Kiến trúc Tích hợp Mobile (`mobile/`)

Mọi tính năng kết nối mạng đều phải đảm bảo: khi điện thoại mất 4G/Wi-Fi hoặc Backend chưa chạy, ứng dụng tự động quay về dữ liệu 20 di tích nội bộ (`mobile/src/data/`) và lưu trữ cục bộ `AsyncStorage` mà **không bao giờ crash hay hiện màn hình trắng**.

### 4 Lớp Tích hợp Chính
1. **Tầng API Client & Xác thực tùy chọn (`apiClient.ts`, `authService.ts`):**
   - Đọc địa chỉ máy chủ qua biến công khai `EXPO_PUBLIC_API_BASE_URL` (mặc định tự nhận diện hoặc kết nối Local/Cloud).
   - Mọi request đi qua wrapper `apiClient.ts` có `AbortController` timeout và trả về kiểu an toàn `ApiResult<T>`.
   - Lưu phiên đăng nhập vào `AsyncStorage`; giao diện Đăng nhập / Đăng ký (`AuthModal.tsx`) nằm gọn trong tab Hành trình để Khách vẫn trải nghiệm ngay không bị chặn.
2. **Nâng cấp Dẫn đường & Lưu trữ Hành trình (`routingService.ts`, `journeyStorage.ts`):**
   - `routingService.ts` ưu tiên gọi `POST /api/v1/routing/walking` qua Backend Proxy (hưởng lợi từ Route Cache 7 ngày và ẩn `GOONG_API_KEY`); khi mất mạng tự fallback sang FOSSGIS OSRM trực tiếp hoặc lộ trình nội suy.
   - `journeyStorage.ts` đồng bộ hành trình check-in lên `POST /api/v1/journeys/check-in`, tải ảnh lên Storage, nhận kết quả **Anti-Fake** và thông báo **Huy hiệu mới mở khóa**.
3. **Giao diện 3 Tính năng Thông minh AI trên Mobile:**
   - **Lập Tour AI (`SmartTourModal.tsx`):** Chọn quỹ thời gian (`90 / 120 / 180 phút`), sở thích danh mục và giờ xuất phát để sinh lịch trình đi bộ tối ưu `2-Opt` kèm quán ăn theo khung giờ.
   - **Hỏi–Đáp RAG (`AiChatModal.tsx`):** Mở ngay trong chi tiết di tích (`HeritageDetailModal.tsx`), hỗ trợ 5 ngôn ngữ kèm trích dẫn nguồn (`citations`) và câu hỏi gợi ý.
   - **Quét Vision AI (`PhotoCaptureModal.tsx`):** Chụp công trình thực tế để nhận diện di tích và tự động gợi ý phát thuyết minh âm thanh (`expo-speech`).
4. **Bảng xếp hạng Cộng đồng & Huy hiệu (`JourneyAndRankingView.tsx`):**
   - Mở rộng tab Hành trình với bảng xếp hạng cá nhân, **Bảng xếp hạng Cộng đồng (Global)**, nhãn trạng thái xác thực (`verified` / `simulated` / `flagged`) và bộ sưu tập **6 Huy hiệu thành tựu**.

---

## 5.2. Kế hoạch Thực thi & Kiểm thử Tự động (Verification Plan)

| Giai đoạn | Hạng mục & Tiêu chí Nghiệm thu |
| :--- | :--- |
| **Giai đoạn 1: Cơ sở dữ liệu Supabase** | Chạy [`backend/supabase/migrations/001_initial_schema.sql`](../backend/supabase/migrations/001_initial_schema.sql) (bật `postgis`, `vector`, `pgcrypto`, tạo 9 bảng, chỉ mục `GIST`/`HNSW`/`GIN`, bucket `heritage-photos` và RLS); chạy `python -m scripts.seed_supabase` nạp 20 di tích, 26 quán ăn, 340 RAG chunks và 6 huy hiệu. |
| **Giai đoạn 2: Backend FastAPI & AI** | Hoàn thiện Core, Auth Guard (`Guest/User/Admin`), truy vấn PostGIS, Admin CRUD (tự re-index RAG), 3 trụ cột AI, Routing Proxy + Cache, Leaderboard & Badges, đóng gói `Dockerfile` và `render.yaml`. |
| **Giai đoạn 3: Kiểm thử Backend (`pytest`)** | 40 bài test tự động trong `backend/tests/` phải pass 100%:<br>- `test_recommendation.py`: Tổng thời gian tour $\le T_{\max}$, `2-Opt` rút ngắn quãng đường, chèn đúng quán ăn theo khung giờ.<br>- `test_antifake.py`: GPS $> 200\text{m}$ bị `flagged`, tốc độ xe máy ($40\text{ km/h}$) bị `flagged`, đi bộ hợp lệ đạt `verified`.<br>- `test_rag_fallback.py`: Hybrid RRF retrieval & chế độ Fallback hoạt động không cần `GEMINI_API_KEY`.<br>- `test_vision.py`: Tiền lọc Top-8 GPS và `gps_fallback`.<br>- `test_routing_proxy.py`: Cache hit/miss & chuỗi fallback routing.<br>- `test_api_smoke.py`: Kiểm tra đầy đủ phân quyền Guest / User / Admin & luồng check-in. |
| **Giai đoạn 4: Kiểm thử Mobile & CI/CD** | Toàn bộ 3 cổng GitHub Actions CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) báo xanh:<br>1. **Standards & Security**: Không commit `.env`/DB/build artifacts; 100% dùng `Times New Roman`, không dùng `Georgia`.<br>2. **Backend CI**: `python -m pytest -v` (40/40 pass) và kiểm tra OpenAPI schema $\ge 18$ paths.<br>3. **Mobile CI**: `npm run typecheck` (0 lỗi), `npm run test` (10/10 Vitest pass) và `npm run export:web` xuất bundle thành công. |

---

## 5.3. Bộ Lệnh Kiểm tra Nhanh Trước khi Mở Pull Request

```bash
# 1. Kiểm thử Backend (tại thư mục backend/)
.venv\Scripts\python.exe -m pytest -v
.venv\Scripts\python.exe -c "from app.main import app; print(len(app.openapi()['paths']))"

# 2. Kiểm thử Mobile (tại thư mục mobile/)
npm run typecheck
npm run test
npm run export:web
```
