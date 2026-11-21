# Smart Heritage Guide Mobile (TP. Hồ Chí Minh)

Ứng dụng di động **React Native (Expo)** đóng vai trò hướng dẫn viên du lịch di sản thông minh tại Thành phố Hồ Chí Minh, hỗ trợ chạy trực tiếp trên **Expo Go (Android / iOS)** và **Expo Web**.

## Tính năng chính

- **20 điểm di sản & di tích tiêu biểu TP. Hồ Chí Minh** (Quận 1, Quận 3, Quận 4, Quận 5 · Chợ Lớn, Bình Thạnh, Tân Bình, TP. Thủ Đức, Củ Chi, Cần Giờ).
- **Định vị GPS thực & Mô phỏng khu vực**: sử dụng `expo-location` kèm bộ khu vực mẫu tại TP.HCM, tự động cảnh báo và gợi ý bật thuyết minh khi đến gần di tích (`< 150m`).
- **Thuyết minh âm thanh đa ngôn ngữ (5 ngôn ngữ)**: Tiếng Việt (`VI`), English (`EN`), Français (`FR`), 中文 (`ZH`), 日本語 (`JA`) dùng `expo-speech`, hỗ trợ điều chỉnh tốc độ (`0.75x`, `1.0x`, `1.25x`, `1.5x`), chuyển đoạn và tô sáng câu đang đọc.
- **Tư liệu ảnh & video + Đề xuất ẩm thực gần di tích**: xem ảnh toàn màn hình, video tư liệu và danh sách quán ăn đánh giá cao kèm khoảng cách đi bộ.
- **Bản đồ & Dẫn đường đi bộ tương tác**: hỗ trợ bản đồ nền Goong Maps, CARTO, OpenStreetMap và Vệ tinh; chỉ đường từng bước (OSRM Foot -> Goong Direction API -> dự phòng ngoại tuyến), đồng hồ đo thời gian đi bộ thực tế và chế độ mô phỏng đi bộ.
- **Chụp ảnh lưu niệm & Bảng xếp hạng hành trình**: chụp ảnh bằng `expo-camera` hoặc chọn từ thư viện `expo-image-picker` có đóng dấu tên di tích, thời gian và tọa độ GPS; lưu trữ cục bộ bằng `AsyncStorage` và xếp hạng theo thời gian đi bộ.

## Yêu cầu môi trường

- **Node.js** >= 18 (khuyến nghị Node.js LTS hoặc 20+) và **npm**
- Trên điện thoại: cài đặt ứng dụng **Expo Go** từ Google Play (Android) hoặc App Store (iOS)

## Cài đặt

```bash
cd smart-heritage-guide-mobile
npm install
```

## Cấu hình biến môi trường (Goong Maps - Tùy chọn)

Ứng dụng hoạt động ngay mà **không bắt buộc** có API key (tự động dùng bản đồ CARTO/OpenStreetMap và máy chủ dẫn đường đi bộ FOSSGIS OSRM miễn phí).

Nếu muốn bật bản đồ nền Việt Nam **Goong Maps** và API chỉ đường dự phòng của Goong:

1. Sao chép file mẫu:
   ```bash
   cp .env.example .env
   ```
2. Đăng ký khóa miễn phí tại [https://account.goong.io](https://account.goong.io) và điền vào `.env`:
   ```env
   EXPO_PUBLIC_GOONG_MAPTILES_KEY=your_goong_maptiles_key
   EXPO_PUBLIC_GOONG_API_KEY=your_goong_rest_api_key
   ```

> **Lưu ý:** Mọi biến bắt đầu bằng `EXPO_PUBLIC_` sẽ được Expo nhúng trực tiếp vào ứng dụng khi chạy và build. Không commit file `.env` lên Git.

## Chạy ứng dụng

### 1. Chạy trên điện thoại bằng Expo Go (Android / iOS)

```bash
npm start
# hoặc:
npx expo start
```

- **Android**: mở ứng dụng **Expo Go** và quét mã QR hiển thị trên terminal.
- **iOS**: mở ứng dụng **Camera** mặc định, quét mã QR và bấm mở bằng **Expo Go**.
- Nếu điện thoại và máy tính không cùng mạng Wi-Fi hoặc bị chặn tường lửa, chạy chế độ tunnel:
  ```bash
  npx expo start --tunnel
  ```

### 2. Chạy trên trình duyệt (Expo Web)

```bash
npm run web
# hoặc:
npx expo start --web
```

Để kiểm tra đóng gói bản Web tĩnh:

```bash
npm run export:web
# hoặc:
npx expo export --platform web
```

## Kiểm thử & Kiểm tra kiểu TypeScript

```bash
# Kiểm tra kiểu TypeScript (strict mode)
npm run typecheck
# hoặc: npx tsc --noEmit

# Chạy unit test (Vitest cho geoUtils và routingService)
npm run test
```

## Cấu trúc thư mục

```text
smart-heritage-guide-mobile/
├── App.tsx                     # Shell chính, bottom tabs, trạng thái GPS & hành trình
├── index.ts                    # Điểm khởi chạy Expo (registerRootComponent)
├── app.json                    # Cấu hình Expo, quyền GPS / Camera / Thư viện ảnh
├── package.json                # Dependencies & scripts
├── tsconfig.json               # Cấu hình TypeScript
├── babel.config.js             # Cấu hình Babel (babel-preset-expo)
├── .env.example                # Mẫu biến môi trường Goong Maps
└── src/
    ├── theme.ts                # Hệ thống màu sắc, typography, spacing
    ├── types/
    │   └── heritage.ts         # Kiểu dữ liệu dùng chung (HeritageSite, WalkingRouteResult...)
    ├── data/
    │   ├── hcmCentralSites.ts  # Di tích khu vực trung tâm TP.HCM
    │   ├── hcmExtendedSites.ts # Di tích mở rộng (Chợ Lớn, Bình Thạnh, Củ Chi, Cần Giờ...)
    │   └── heritageSites.ts    # Tổng hợp 20 di sản & danh sách khu vực mẫu CITY_PRESETS
    ├── utils/
    │   ├── geoUtils.ts         # Tính khoảng cách Haversine, ước tính đi bộ, xếp hạng
    │   └── geoUtils.test.ts    # Unit test cho geoUtils
    ├── services/
    │   ├── locationService.ts  # Wrapper GPS thực tế (expo-location)
    │   ├── speechService.ts    # Thuyết minh đa ngôn ngữ (expo-speech)
    │   ├── routingService.ts   # Dẫn đường đi bộ (OSRM / Goong / fallback)
    │   ├── mapTiles.ts         # Cấu hình lớp bản đồ Goong / CARTO / OSM / Vệ tinh
    │   └── journeyStorage.ts   # Lưu trữ lịch sử hành trình & ảnh (AsyncStorage)
    └── components/
        ├── SiteCard.tsx        # Thẻ di tích trên màn hình Khám phá
        ├── MapExplorer.tsx     # Bản đồ tương tác toàn màn hình & HUD dẫn đường
        ├── SiteMiniMap.tsx     # Bản đồ thu nhỏ trong chi tiết di tích
        ├── AudioGuidePlayer.tsx
        ├── HeritageDetailModal.tsx
        ├── PhotoCaptureModal.tsx
        └── JourneyAndRankingView.tsx
```
