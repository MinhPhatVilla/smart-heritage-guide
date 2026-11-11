# 🏛️ Smart Heritage Guide — Hệ thống Hướng dẫn viên Di sản Thông minh

**Smart Heritage Guide** là ứng dụng Web / Mobile PWA hướng dẫn viên du lịch thông minh, sử dụng **định vị GPS** của khách hàng để phát hiện các **danh lam thắng cảnh & di tích lịch sử ở gần**, cung cấp **thuyết minh giọng nói đa ngôn ngữ**, tổng hợp **hình ảnh & video tài liệu lịch sử**, kết hợp **đề xuất các tiệm ăn uống đặc sản đánh giá tốt gần đó**, **dẫn đường đi bộ trực tiếp**, đồng thời **ghi lại hành trình, lưu ảnh chụp kỷ niệm tại di tích** và **xếp hạng những nơi đã đi thông qua thời gian đi bộ**.

---

## ✨ Tính năng Cốt lõi (Core Features)

### 1. 📍 Định vị GPS & Phát hiện Danh lam Thắng cảnh ở gần
- Xác định vị trí hiện tại của người dùng qua GPS thời gian thực (`navigator.geolocation`) kèm **Chế độ Giả lập GPS (Demo Simulator)** tại các trung tâm di sản (Hà Nội, Huế, Hội An, TP.HCM).
- Tự động tính khoảng cách và thời gian đi bộ ước tính đến từng danh lam thắng cảnh trong bán kính quét (`500m – 10km` hoặc toàn quốc).
- **Tự động nhận diện khi đến gần (`< 150m`)** để gợi ý mở thuyết minh giọng nói ngay lập tức.

### 2. 🎙️ Thuyết minh Giọng nói Đa ngôn ngữ (Multi-language Audio Guide)
- Hỗ trợ **5 ngôn ngữ**:
  - 🇻🇳 **Tiếng Việt** (`vi-VN`)
  - 🇬🇧 **English** (`en-US`)
  - 🇫🇷 **Français** (`fr-FR`)
  - 🇨🇳 **中文** (`zh-CN`)
  - 🇯🇵 **日本語** (`ja-JP`)
- Tích hợp **Web Speech Synthesis API** với trình phát chuyên nghiệp: Play/Pause, chuyển câu trước/sau, điều chỉnh tốc độ đọc (`0.75x`, `1.0x`, `1.25x`, `1.5x`) và **highlight phụ đề đồng bộ theo từng đoạn đang đọc**.

### 3. 🖼️ Tư liệu Đa phương tiện (Hình ảnh & Video Tài liệu)
- Bộ sưu tập hình ảnh lịch sử, kiến trúc cổ và hiện vật của từng di tích kèm chú thích đa ngôn ngữ và chế độ xem phóng to (**Lightbox**).
- Tích hợp trình phát **Video tài liệu lịch sử** ngay trong hồ sơ di tích.

### 4. 🍜 Đề xuất Tiệm Ăn uống Gần đó có Đánh giá Tốt
- Gợi ý các nhà hàng, quán ăn truyền thống nằm ngay xung quanh danh lam thắng cảnh.
- Lọc và sắp xếp theo **điểm đánh giá (`Rating 4.5⭐ – 4.9⭐`)**, hiển thị số lượng đánh giá, món ăn đặc trưng, mức giá, khoảng cách đi bộ từ di tích và nút **Dẫn đường tới quán**.

### 5. 🧭 Dẫn đường Đi bộ Trực tiếp (Turn-by-Turn Walking Navigation)
- Bản đồ nền **Goong Maps** (bản đồ Việt Nam, render vector bằng MapLibre GL trong Leaflet); chưa có key thì tự dùng **CARTO/OpenStreetMap** miễn phí.
- Chỉ đường **đi bộ thật** qua máy chủ OSRM của FOSSGIS (`routing.openstreetmap.de`, profile `foot`), dự phòng bằng **Goong Direction API**.
- Vẽ lộ trình đi bộ thực tế trên đường phố, hiển thị khoảng cách, thời gian đi bộ dự kiến và danh sách các bước rẽ chi tiết.
- Hỗ trợ **Bấm giờ đi bộ thực tế (Active Walking Timer)** và nút **Mô phỏng bước đi dọc lộ trình (Simulate Walk)** để kiểm thử nhanh quá trình di chuyển tới điểm danh lam thắng cảnh.

### 6. 📸 Ghi lại Hành trình, Lưu Ảnh Chụp & Xếp hạng theo Thời gian Đi bộ
- **Lưu ảnh chụp tại di tích lịch sử**: Tích hợp chụp ảnh trực tiếp từ **Camera (WebRTC)** hoặc tải ảnh lên từ thiết bị, đóng dấu tem di sản (tên di tích, thời gian, tọa độ GPS) và lưu bền vững vào bộ nhớ trình duyệt (`LocalStorage` / `IndexedDB`).
- **Ghi lại hành trình người sử dụng**: Lưu nhật ký các di tích đã đi qua kèm lộ trình di chuyển, quãng đường (m), thời gian đi bộ thực tế (`walkingDurationSeconds`) và ghi chú cảm nhận.
- **Bảng xếp hạng nơi đã đi qua thời gian đi bộ (Walking Time Leaderboard)**:
  - Xếp hạng các danh lam thắng cảnh người dùng đã chinh phục dựa trên **thời gian đi bộ tới điểm danh lam thắng cảnh đó** (trao huy chương 🥇 Hạng 1, 🥈 Hạng 2, 🥉 Hạng 3 và danh hiệu *Nhà Thám Hiểm Bộ Hành*).
  - Hỗ trợ xem xếp hạng theo cả hai chiều: **Thời gian đi bộ thực tế đã đi (Journey Effort Ranking)** và **Thời gian đi bộ ước tính từ vị trí hiện tại (Proximity Walking Ranking)**.

---

## 🏗️ Kiến trúc & Cấu trúc Thư mục (Project Scaffold)

```text
smart-heritage-guide/
├── public/
│   └── manifest.json                  # Cấu hình Progressive Web App (PWA)
├── src/
│   ├── types/
│   │   └── heritage.ts                # Định nghĩa TypeScript Interfaces (Di tích, Ngôn ngữ, Ẩm thực, Hành trình, Ảnh)
│   ├── data/
│   │   └── heritageSites.ts           # Dữ liệu danh lam thắng cảnh, 5 ngôn ngữ thuyết minh, ảnh/video & quán ăn
│   ├── utils/
│   │   ├── geoUtils.ts                # Tính khoảng cách Haversine, thời gian đi bộ & thuật toán xếp hạng
│   │   └── geoUtils.test.ts           # Unit tests kiểm증 thuật toán định vị, lọc quán ăn & xếp hạng đi bộ
│   ├── services/
│   │   ├── routingService.ts          # Chỉ đường đi bộ: FOSSGIS OSRM (foot) → Goong Direction → tuyến offline
│   │   ├── mapTiles.ts                # Bản đồ nền Goong (MapLibre) với cơ chế tự chuyển sang CARTO/OSM
│   │   ├── speechService.ts           # Engine giọng nói đa ngôn ngữ (Web Speech Synthesis API)
│   │   └── journeyStorage.ts          # Lưu trữ hành trình, thời gian đi bộ & album ảnh chụp tại di tích
│   ├── components/
│   │   ├── MapExplorer.tsx            # Bản đồ Leaflet, marker di tích/quán ăn, vẽ lộ trình & thanh dẫn đường
│   │   ├── AudioGuidePlayer.tsx       # Trình phát thuyết minh đa ngôn ngữ & đồng bộ phụ đề
│   │   ├── HeritageDetailModal.tsx    # Chi tiết di tích: Thuyết minh, Ảnh & Video tài liệu, Quán ăn gần đó
│   │   ├── PhotoCaptureModal.tsx      # Chụp ảnh Camera trực tiếp / tải ảnh lưu niệm tại di tích lịch sử
│   │   └── JourneyAndRankingView.tsx  # Nhật ký hành trình, Album ảnh & Bảng xếp hạng theo thời gian đi bộ
│   ├── App.tsx                        # Khung ứng dụng chính, quản lý trạng thái GPS, Dẫn đường & Đa ngôn ngữ
│   ├── main.tsx                       # Điểm khởi chạy React DOM
│   └── index.css                      # Cấu hình giao diện Tailwind CSS & tuỳ chỉnh bản đồ Leaflet
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy Dự án (Getting Started)

### Yêu cầu Hệ thống
- **Node.js** `>= 18.x` (Khuyến nghị `v20+` hoặc `v24+`)
- **npm** `>= 9.x`
- Trình duyệt hiện đại (Chrome, Edge, Safari, Firefox trên máy tính hoặc điện thoại) hỗ trợ Web Speech API & Geolocation.

### 1. Cài đặt thư viện (Install Dependencies)
```bash
cd smart-heritage-guide
npm install
```

### 2. Cấu hình bản đồ Goong (không bắt buộc)
1. Đăng ký tài khoản tại [account.goong.io](https://account.goong.io), tạo **Map Tiles key** và **REST API key**.
2. Sao chép `.env.example` thành `.env.local` rồi điền key:
   ```bash
   VITE_GOONG_MAPTILES_KEY=your_map_tiles_key
   VITE_GOONG_API_KEY=your_rest_api_key
   ```
3. Khởi động lại `npm run dev`. Góc bản đồ sẽ hiện nhãn **GOONG** (chưa có key hoặc key lỗi thì hiện **OSM**).

> Gói free của Goong giới hạn số lượt tải bản đồ mỗi tháng. Để tiết kiệm quota, bản đồ phụ trong cửa sổ chi tiết di tích luôn dùng CARTO; chỉ bản đồ chính và bản đồ hành trình dùng Goong. Biến `VITE_*` được nhúng vào mã chạy trên trình duyệt nên ai cũng xem được key.

### 3. Chạy môi trường phát triển (Development Server)
```bash
npm run dev
```
Sau đó mở trình duyệt tại địa chỉ: `http://localhost:5173`

### 4. Chạy kiểm thử tự động (Run Unit Tests)
```bash
npm run test
```

### 5. Đóng gói bản Production (Build for Production)
```bash
npm run build
npm run preview
```

---

## 💡 Hướng dẫn Trải nghiệm Nhanh (Quick Demo Walkthrough)

1. **Chọn Vị trí GPS / Thành phố**:
   - Nhấn nút **"Định vị GPS Thực tế"** trên thanh công cụ hoặc chọn nhanh các khu vực mẫu (**Hà Nội**, **Cố đô Huế**, **Phố cổ Hội An**, **TP. Hồ Chí Minh**) để xem các danh lam thắng cảnh ở gần.
2. **Nghe Thuyết minh Đa ngôn ngữ**:
   - Chọn một danh lam thắng cảnh bất kỳ -> Nhấn **"Nghe thuyết minh"** và đổi ngôn ngữ (`🇻🇳 VI`, `🇬🇧 EN`, `🇫🇷 FR`, `🇨🇳 ZH`, `🇯🇵 JA`) để nghe giọng đọc tự động kèm phụ đề sáng theo từng câu.
3. **Xem Hình ảnh, Video Tài liệu & Quán ăn Đánh giá Tốt**:
   - Trong chi tiết di tích, chuyển qua tab **"Tư liệu Ảnh & Video"** để xem tư liệu lịch sử, hoặc tab **"Ẩm thực Gần đó (Rating cao)"** để tìm quán ăn đặc sản xung quanh.
4. **Dẫn đường Đi bộ & Ghi nhận Thời gian Đi bộ**:
   - Nhấn **"Dẫn đường tới đây"** trên một di tích -> Bản đồ sẽ vẽ tuyến đường đi bộ kèm đồng hồ bấm giờ.
   - Nhấn **"Mô phỏng đi bộ tới đích"** (hoặc đi bộ thực tế) -> Khi tới nơi, ứng dụng tự động kích hoạt thuyết minh và mở cửa sổ **Check-in & Chụp ảnh lưu niệm**.
5. **Xem Bảng Xếp hạng Thời gian Đi bộ & Nhật ký Hành trình**:
   - Mở tab **"Hành trình & Xếp hạng"** trên thanh điều hướng để xem bảng xếp hạng các di tích bạn đã đi qua được xếp hạng theo **thời gian đi bộ**, cùng bộ sưu tập ảnh chụp tại từng di tích.

---

## 🛠️ Công nghệ Sử dụng (Tech Stack)
- **Giao diện & Quản lý trạng thái**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Bản đồ & Dẫn đường**: Leaflet, Goong Maps (MapLibre GL), CARTO/OpenStreetMap, FOSSGIS OSRM (foot), Goong Direction API
- **Thuyết minh Giọng nói**: Web Speech API (`SpeechSynthesis` & `SpeechSynthesisUtterance`)
- **Camera & Lưu trữ**: MediaDevices WebRTC API, HTML5 Canvas (đóng dấu tem ảnh di tích), LocalStorage / IndexedDB
- **Kiểm thử & Đóng gói**: Vite 6, Vitest
