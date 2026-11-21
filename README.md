# Smart Heritage Guide — Mobile App (React Native / Expo) & AI Backend (FastAPI + Supabase)

Hệ thống hướng dẫn viên di sản thông minh TP.HCM (20 di tích lịch sử, thuyết minh 5 ngôn ngữ `VI/EN/FR/ZH/JA`, định vị GPS, bản đồ & dẫn đường đi bộ, chụp ảnh lưu niệm, bảng xếp hạng thời gian đi bộ và 3 trụ cột AI).

## Cấu trúc dự án

```text
smart-heritage-guide/
├── .github/workflows/ci.yml   # GitHub Actions CI kiểm tra tự động (Standards, Backend, Mobile)
├── mobile/                    # Ứng dụng di động React Native (Expo SDK 58 + TypeScript)
├── backend/                   # Máy chủ FastAPI + Supabase (PostgreSQL/PostGIS/pgvector/Auth/Storage) + Gemini AI
├── docs/                      # Tài liệu thiết kế kiến trúc hệ thống (.docx)
└── CONTRIBUTING.md            # Bộ quy tắc kiến trúc, font chữ, bảo mật & làm việc nhóm (GitHub Flow)
```

> 📌 **Dành cho thành viên trong nhóm:** Vui lòng đọc kỹ [CONTRIBUTING.md](./CONTRIBUTING.md) trước khi tạo nhánh mới hoặc mở Pull Request.

## Tính năng nổi bật

- **Ứng dụng Mobile (`mobile/`)**: Chạy mượt trên **Expo Go (Android/iOS)** và **Expo Web**, hoạt động **Offline-first**.
  - 20 di tích lịch sử TP.HCM + quán ăn đặc sản gần đó có đánh giá cao.
  - Thuyết minh giọng nói 5 ngôn ngữ (`expo-speech`) đồng bộ phụ đề.
  - Định vị GPS (`expo-location`), cảnh báo & tự đọc khi đến gần `< 150m`, bản đồ 4 chế độ + dẫn đường đi bộ.
  - Camera chụp ảnh lưu niệm có dấu tem di sản (`expo-camera` / `expo-image-picker`), nhật ký hành trình & bảng xếp hạng thời gian đi bộ.
- **Backend Thông minh (`backend/`)**:
  1. **Gợi ý ngữ cảnh & Lập lịch trình đi bộ tối ưu (Nearest-Neighbor + 2-Opt)** có giải thích lý do và tự chèn điểm ăn uống theo khung giờ.
  2. **Trợ lý AI Hướng dẫn viên Hỏi–Đáp RAG 5 ngôn ngữ** (Hybrid Retrieval + Gemini 2.5 Flash + fallback cục bộ).
  3. **Vision AI nhận diện di tích qua Camera** & **Xác thực chống gian lận GPS/tốc độ đi bộ (Anti-Fake Check-in)** cho Bảng xếp hạng Cộng đồng & 6 Huy hiệu thành tựu tự động.
  4. **Routing Proxy + Cache** (OSRM → Goong Direction → Fallback) và **Admin CRUD** trên Swagger `/docs`.

## Hướng dẫn chạy nhanh

### 1. Chạy Backend (FastAPI)
```bash
cd backend
py -m venv .venv
.venv\Scripts\pip.exe install -r requirements.txt
.venv\Scripts\uvicorn.exe app.main:app --reload --host 0.0.0.0 --port 8000
```
- Swagger UI: `http://localhost:8000/docs`
- Kiểm thử: `.venv\Scripts\python.exe -m pytest -v` (40/40 tests)

### 2. Chạy Mobile App (Expo)
```bash
cd mobile
npm install
npx expo start        # Quét QR bằng ứng dụng Expo Go (Android/iOS)
# Hoặc chạy thử trên trình duyệt:
npm run web
```
- Kiểm thử: `npm run typecheck && npm run test`
