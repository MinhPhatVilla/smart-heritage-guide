# Smart Heritage Guide — Prisma Database Package

Quản lý toàn bộ schema PostgreSQL (khớp 100% với **Supabase PostgreSQL** & **FastAPI Backend**), đồng bộ bảng tự động và nạp sẵn dữ liệu mẫu (20 di sản TP.HCM, 5 ngôn ngữ, ẩm thực, RAG chunks, 6 huy hiệu) bằng **Prisma ORM**.

## Khởi tạo nhanh trong 3 bước

```bash
cd database
npm install
```

1. Tạo file `.env` từ mẫu:
   ```bash
   cp .env.example .env
   ```
2. Mở `database/.env` và dán 2 biến kết nối từ **Supabase -> Connect -> ORMs -> Prisma** (nhớ thay `[YOUR-PASSWORD]` bằng mật khẩu database thật của bạn):
   ```env
   DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
   ```
3. Đẩy toàn bộ 9 bảng lên DB và nạp sẵn dữ liệu mẫu bằng **1 lệnh duy nhất**:
   ```bash
   npm run db:setup
   ```

## Danh sách lệnh hữu ích

| Lệnh | Chức năng |
| --- | --- |
| `npm run db:setup` | Chạy trọn gói: `prisma generate` + `prisma db push` + `seed` dữ liệu mẫu |
| `npm run db:validate` | Kiểm tra cú pháp `prisma/schema.prisma` |
| `npm run db:generate` | Sinh `@prisma/client` TypeScript types |
| `npm run db:push` | Đồng bộ schema lên PostgreSQL ngay lập tức (không cần tạo file migration) |
| `npm run db:migrate` | Tạo migration có lịch sử phiên bản (`prisma migrate dev`) |
| `npm run db:seed` | Nạp lại dữ liệu mẫu (idempotent — chạy nhiều lần an toàn) |
| `npm run db:studio` | Mở giao diện quản trị dữ liệu trực quan **Prisma Studio** trên trình duyệt |

## 9 bảng dữ liệu trong Schema

- `profiles` — Hồ sơ người dùng & thống kê bảng xếp hạng đi bộ
- `heritage_sites` — 20 di tích & di sản TP.HCM (JSONB đa ngôn ngữ `vi/en/fr/zh/ja`)
- `restaurants` — Quán ăn đặc sản lân cận từng di tích
- `heritage_knowledge_chunks` — Mảnh tri thức RAG đa ngôn ngữ
- `visited_journeys` — Nhật ký đi bộ & chấm điểm chống gian lận GPS
- `journey_photos` — Ảnh kỷ niệm check-in & kết quả Vision AI
- `badges` — Danh mục 6 huy hiệu thành tựu
- `user_badges` — Huy hiệu người dùng đã mở khóa
- `route_cache` — Cache lộ trình đi bộ OSRM/Goong
