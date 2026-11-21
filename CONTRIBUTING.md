# Bộ Quy Tắc Phát Triển Ứng Dụng & Làm Việc Nhóm (CONTRIBUTING)

Tài liệu này quy định các **luật bắt buộc** khi phát triển dự án **Smart Heritage Guide** để mọi thành viên trong nhóm làm việc đồng bộ, không đụng độ code, không lộ khóa bảo mật và luôn giữ ứng dụng chạy mượt trên cả **iOS, Android và Expo Web**.

---

## 1. Cấu trúc Monorepo Chuẩn (1 Nguồn Duy Nhất)

Toàn bộ dự án sử dụng kiến trúc **Monorepo** tại thư mục gốc `smart-heritage-guide/`:

```text
smart-heritage-guide/
├── .github/workflows/ci.yml   # Kiểm tra tự động mỗi khi Push / mở Pull Request
├── mobile/                    # Ứng dụng di động React Native (Expo SDK 58 + TypeScript)
├── backend/                   # Máy chủ API thông minh (Python 3.12 + FastAPI + Supabase)
├── docs/                      # Tài liệu kiến trúc & báo cáo (.docx)
├── CONTRIBUTING.md            # Bộ quy tắc phát triển & làm việc nhóm (file này)
└── README.md                  # Hướng dẫn cài đặt và chạy nhanh
```

- **Tuyệt đối không** trộn file của Python Backend ra ngoài thư mục gốc hoặc nhét lẫn vào `mobile/`.
- **Tuyệt đối không** đẩy các thư mục/tệp sinh tự động lên Git: `node_modules/`, `.venv/`, `dist/`, `.expo/`, `*.db`, `uploads/`, `__pycache__/`.

---

## 2. Quy tắc Kiến trúc Ứng dụng Mobile (`mobile/`)

1. **Phân tầng rõ ràng (Separation of Concerns):**
   - `mobile/src/types/`: Định nghĩa TypeScript interfaces/DTOs dùng chung.
   - `mobile/src/data/`: Dữ liệu di tích nội bộ (phục vụ chạy ngay & chế độ Offline).
   - `mobile/src/utils/`: Hàm tính toán thuần túy (khoảng cách Haversine, xếp hạng...) — phải có Unit Test đi kèm (`.test.ts`).
   - `mobile/src/services/`: Gọi API (`apiClient`, `aiService`, `authService`), định vị (`locationService`), giọng nói (`speechService`), lưu trữ (`journeyStorage`), bản đồ (`routingService`, `mapTiles`).
   - `mobile/src/components/` & `mobile/App.tsx`: Chỉ xử lý giao diện & tương tác người dùng; **không** viết trực tiếp logic gọi `fetch` thô hay xử lý lưu trữ phức tạp trong component.

2. **Luật Offline-First & Chống Crash Mạng:**
   - Điện thoại di chuyển ngoài thực địa dễ mất kết nối 4G/Wi-Fi hoặc Backend chưa bật.
   - Mọi lời gọi mạng phải đi qua `src/services/apiClient.ts` (có `AbortController` timeout và trả về `ApiResult<T>`), luôn có chế độ dự phòng (fallback) về dữ liệu cục bộ / `AsyncStorage` để **không bao giờ văng màn hình trắng**.

3. **Luật Typography Đồng Nhất (Chống Lỗi Dấu Tiếng Việt):**
   - Toàn bộ ứng dụng sử dụng **duy nhất 1 font chữ `Times New Roman`** (khai báo tại `mobile/src/theme.ts` -> `APP_FONT` và áp dụng toàn cục tại `mobile/index.ts`, bao gồm cả HTML bản đồ trong `MapExplorer.tsx` & `SiteMiniMap.tsx`).
   - **Cấm sử dụng** các font thiếu glyph tiếng Việt tổ hợp như `Georgia` gây lỗi tách dấu (`ề`, `ấ`, `ộ`, `ữ`...).

4. **Luật Trải nghiệm Di động (Mobile-First UX):**
   - Luôn bọc màn hình trong `SafeAreaProvider` / `SafeAreaView`.
   - Khi dùng API phần cứng (`expo-location`, `expo-camera`, `expo-image-picker`, `expo-speech`, `expo-haptics`), bắt buộc kiểm tra quyền (permissions), hiển thị thông báo tiếng Việt thân thiện khi bị từ chối và có fallback khi chạy trên `Platform.OS === 'web'`.

---

## 3. Quy tắc Kiến trúc Backend & Bảo mật (`backend/`)

1. **Zero Secret on Client (Không đặt khóa bí mật ở Mobile):**
   - Các khóa nhạy cảm (`GEMINI_API_KEY`, `GOONG_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `JWT_SECRET_KEY`) **chỉ được phép nằm trong `backend/.env`** (không bao giờ commit `.env` lên Git; chỉ cập nhật mẫu tên biến trong `.env.example`).
   - Mobile chỉ nhận các biến công khai có tiền tố `EXPO_PUBLIC_*` (như `EXPO_PUBLIC_API_BASE_URL`).

2. **Tương thích Kép (Supabase Cloud + Local Dev/Test):**
   - Mọi tính năng mới ở `backend/` phải đảm bảo chạy tốt với **Supabase PostgreSQL (PostGIS + `pgvector`)** trên Cloud lẫn **SQLite async** khi chạy kiểm thử `pytest` cục bộ.
   - Các tính năng AI (`RAG`, `Vision`) phải luôn có **Graceful Fallback** để không làm sập API khi môi trường dev chưa điền `GEMINI_API_KEY`.

3. **Đồng bộ Hợp đồng API (API Contract Sync):**
   - Khi thay đổi schema Pydantic trong `backend/app/schemas/dto.py`, bắt buộc kiểm tra và cập nhật tương ứng interface TypeScript bên `mobile/src/services/` trong cùng Pull Request.

---

## 4. Quy trình Làm Việc Nhóm với Git (GitHub Flow)

1. **Không code trực tiếp trên nhánh `main`:**
   - Luôn kéo code mới nhất từ `main` rồi tạo nhánh riêng theo đúng phạm vi task:
     ```bash
     git checkout main
     git pull origin main
     git checkout -b feat/ten-tinh-nang     # hoặc: fix/ten-loi, docs/..., chore/...
     ```
2. **Quy tắc An toàn Nhóm (Team Safe Coding):**
   - Chỉ sửa đúng file thuộc phạm vi task của mình; không tự ý format lại toàn bộ file hoặc sửa code phần người khác khi chưa trao đổi.
   - Nếu cần thay đổi file cấu hình chung (`mobile/package.json`, `mobile/tsconfig.json`, `backend/requirements.txt`, `001_initial_schema.sql`, `.github/workflows/ci.yml`), phải thông báo với nhóm trước.
   - Tuyệt đối không dùng các lệnh phá hủy lịch sử chung như `git push --force` lên `main` hoặc `git reset --hard` trên nhánh dùng chung.
3. **Kiểm tra bắt buộc trước khi Commit & Mở Pull Request:**
   - **Nếu sửa `backend/`:**
     ```bash
     cd backend
     .venv\Scripts\python.exe -m pytest -v
     ```
   - **Nếu sửa `mobile/`:**
     ```bash
     cd mobile
     npm run typecheck
     npm run test
     npm run export:web
     ```
   - Kiểm tra `git status` và `git diff` để chắc chắn không lọt file rác hoặc `.env`.
4. **Chuẩn Commit Message (Conventional Commits):**
   - `feat(mobile): thêm bộ lọc quận huyện trên bản đồ`
   - `feat(backend): bổ sung bộ nhớ đệm cho gợi ý di tích`
   - `fix(mobile): xử lý khi người dùng từ chối quyền GPS`
   - `docs: cập nhật hướng dẫn cấu hình Supabase`
5. **Merge vào `main`:**
   - Đẩy nhánh lên GitHub (`git push -u origin feat/...`), tạo **Pull Request (PR)** vào `main`, đợi **GitHub Actions CI** báo xanh toàn bộ 3 cổng kiểm tra rồi mới bấm **Merge**.
