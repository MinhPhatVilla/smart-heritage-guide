# 4. Đặc tả REST API Endpoints (`/api/v1`)

Toàn bộ API của Backend tuân thủ chuẩn RESTful với tiền tố `/api/v1`, được định nghĩa tại `backend/app/routers/` và kiểm tra hợp đồng dữ liệu bằng Pydantic v2 tại [`backend/app/schemas/dto.py`](../backend/app/schemas/dto.py).

- **Swagger UI tương tác:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI Schema JSON:** `http://localhost:8000/openapi.json` (tổng cộng **23 API paths**)

---

## 4.1. Cơ chế Xác thực & Phân quyền

Hệ thống hỗ trợ 3 mức quyền qua `Authorization: Bearer <access_token>`:
- **`Public`**: Khách vãng lai (Guest) gọi trực tiếp không cần đăng nhập.
- **`Public / User`**: Khách dùng được ngay; nếu có gửi kèm JWT sẽ tự động cá nhân hóa theo lịch sử hành trình và sở thích của tài khoản đó.
- **`User`**: Yêu cầu đăng nhập (Supabase GoTrue JWT hoặc Local JWT fallback).
- **`Admin`**: Yêu cầu tài khoản có `role = "admin"` trong bảng `profiles`.

### Tài khoản Demo mặc định (Swagger `/docs` & Mobile)

| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| **Admin** (CRUD Di tích & Quán ăn) | `admin@smartheritage.vn` | `AdminHeritage@2026` |
| **User Demo** (Có sẵn 3 hành trình & 2 huy hiệu) | `demo@smartheritage.vn` | `DemoHeritage@2026` |

> **Cách test trên Swagger:** Gọi `POST /api/v1/auth/login` → copy giá trị `access_token` → nhấn nút **Authorize** ở góc trên bên phải Swagger UI và dán token vào.

---

## 4.2. Danh mục Đầy đủ Các API Endpoints

### 1. System & Health (`app/routers/health.py`)
| Method | Endpoint | Quyền | Chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/v1/health` | Public | Kiểm tra trạng thái FastAPI, kết nối DB (`sqlite`/`postgresql`), PostGIS/pgvector, trạng thái Gemini API & Routing Proxy. |

### 2. Auth & Profile (`app/routers/auth.py`)
| Method | Endpoint | Quyền | Chức năng |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | Public | Đăng ký tài khoản mới và tự động tạo bản ghi trong `profiles`. |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập bằng Email/Mật khẩu, trả về `access_token`, `refresh_token` và `profile`. |
| `GET` | `/api/v1/auth/me` | User | Lấy thông tin hồ sơ, sở thích danh mục và tổng số liệu đi bộ đã xác thực. |
| `PATCH` | `/api/v1/auth/me` | User | Cập nhật tên hiển thị (`display_name`), ngôn ngữ mặc định (`preferred_language`) và danh mục yêu thích. |

### 3. Heritage Sites & Restaurants (`app/routers/sites.py`)
| Method | Endpoint | Quyền | Chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/v1/sites` | Public | Truy vấn danh sách di tích theo `lat`, `lng`, `radius_m`, `category`, `district`, từ khóa `q` và ngôn ngữ `lang`. |
| `GET` | `/api/v1/sites/{site_id}` | Public | Lấy hồ sơ chi tiết 1 di tích kèm `translations` 5 ngôn ngữ, `media_gallery` và danh sách quán ăn lân cận. |
| `GET` | `/api/v1/sites/{site_id}/restaurants` | Public | Lấy danh sách quán ăn gần di tích, hỗ trợ lọc theo `min_rating` và khung giờ `meal_slot`. |

### 4. Admin CRUD (`app/routers/admin.py`)
| Method | Endpoint | Quyền | Chức năng |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/v1/admin/sites` | Admin | Tạo mới di tích và **tự động phân đoạn/lập chỉ mục tri thức RAG**. |
| `PUT` | `/api/v1/admin/sites/{site_id}` | Admin | Cập nhật di tích và **tự động re-index tri thức RAG**. |
| `DELETE` | `/api/v1/admin/sites/{site_id}` | Admin | Xóa di tích (cascade xóa quán ăn và knowledge chunks liên quan). |
| `POST` | `/api/v1/admin/restaurants` | Admin | Thêm quán ăn đặc sản mới gắn với một `site_id`. |
| `PUT` | `/api/v1/admin/restaurants/{restaurant_id}` | Admin | Cập nhật thông tin quán ăn. |
| `DELETE` | `/api/v1/admin/restaurants/{restaurant_id}` | Admin | Xóa quán ăn khỏi hệ thống. |

### 5. Smart AI — 3 Trụ cột Thông minh (`app/routers/ai.py`)
| Method | Endpoint | Quyền | Chức năng |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/v1/ai/recommendations` | Public / User | Gợi ý Top di tích & quán ăn theo ngữ cảnh kèm điểm `score` và mảng lý do `reasons[]`. |
| `POST` | `/api/v1/ai/tour-plan` | Public / User | Lập lịch trình đi bộ tối ưu nhiều điểm (**Nearest-Neighbor + 2-Opt**) theo `max_minutes`, `start_hour` và tự chèn điểm ăn uống. |
| `POST` | `/api/v1/ai/chat` | Public / User | Trợ lý AI Hướng dẫn viên **Hybrid RAG 5 ngôn ngữ** kèm `citations[]` và `suggested_questions[]`. |
| `POST` | `/api/v1/ai/vision/identify` | Public / User | Nhận diện di tích từ ảnh chụp Camera (tiền lọc GPS Top-8 + Gemini Vision + GPS fallback). |

### 6. Walking Routing Proxy (`app/routers/routing.py`)
| Method | Endpoint | Quyền | Chức năng |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/v1/routing/walking` | Public | Proxy chỉ đường đi bộ theo chuỗi ưu tiên: **DB Cache (TTL 7 ngày) → FOSSGIS OSRM (`foot`) → Goong Direction → Offline Fallback**. |

### 7. Journeys & Check-in (`app/routers/journeys.py`)
| Method | Endpoint | Quyền | Chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/v1/journeys/me` | User | Lấy toàn bộ nhật ký hành trình đi bộ và album ảnh của tài khoản hiện tại. |
| `POST` | `/api/v1/journeys/check-in` | User | Ghi nhận hành trình, chạy **Anti-Fake Walk Verifier** (0–100 điểm) và tự động xét mở khóa **Badges**. |
| `POST` | `/api/v1/journeys/{journey_id}/photos` | User | Tải ảnh kỷ niệm lên Supabase Storage (`heritage-photos`) hoặc `/uploads` cục bộ và gắn vào nhật ký. |
| `POST` | `/api/v1/journeys/sync` | User | Đồng bộ hàng loạt hành trình đã lưu offline trên `AsyncStorage` khi Khách chuyển sang Đăng nhập. |

### 8. Leaderboard & Badges (`app/routers/leaderboard.py`)
| Method | Endpoint | Quyền | Chức năng |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/v1/leaderboard/global` | Public | Bảng xếp hạng Cộng đồng (chỉ tính hành trình `verified`), sắp xếp theo thời gian đi bộ / quãng đường / số di tích. |
| `GET` | `/api/v1/leaderboard/me` | User | Xem thứ hạng cá nhân hiện tại và tiến độ mở khóa huy hiệu. |
| `GET` | `/api/v1/badges` | Public / User | Lấy danh mục 6 huy hiệu thành tựu kèm trạng thái đã mở khóa nếu có đăng nhập. |

---

## 4.3. Ví dụ Hợp đồng Request (Smart Tour & Anti-Fake Check-in)

```json
// POST /api/v1/ai/tour-plan
{
  "lat": 10.7775,
  "lng": 106.6990,
  "max_minutes": 150,
  "language": "vi",
  "preferred_categories": ["monument", "museum"],
  "include_dining": true,
  "start_hour": 11
}
```

```json
// POST /api/v1/journeys/check-in
{
  "site_id": "dinh-doc-lap",
  "walking_duration_seconds": 840,
  "walking_distance_meters": 980,
  "checkin_lat": 10.7770,
  "checkin_lng": 106.6953,
  "route_coordinates": [[10.7725, 106.6980], [10.7750, 106.6965], [10.7770, 106.6953]],
  "is_simulated": false,
  "user_note": "Đi bộ từ Chợ Bến Thành sang Dinh Độc Lập",
  "user_rating": 5
}
```
