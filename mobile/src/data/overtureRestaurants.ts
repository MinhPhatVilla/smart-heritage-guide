/**
 * Dữ liệu hàng quán & quán cà phê thực tế quanh 50 di tích & điểm tham quan TP. Hồ Chí Minh
 * được đồng bộ tự động từ Overture Maps Foundation (theme=places, GeoParquet).
 *
 * - Release: 2026-11-18.0
 * - Synced at: 2026-11-22T07:07:37Z
 * - Tổng cộng: 246 địa điểm ẩm thực quanh 50/50 di tích
 *
 * Cập nhật lại bằng lệnh: `cd backend && python -m scripts.sync_overture_places`
 */

import { NearbyRestaurant } from '../types/heritage';

export const OVERTURE_PLACES_RELEASE = '2026-11-18.0';
export const OVERTURE_PLACES_SYNCED_AT = '2026-11-22T07:07:37Z';

export const OVERTURE_RESTAURANTS_BY_SITE: Record<string, NearbyRestaurant[]> = {
  "dinh-doc-lap": [
    {
      "id": "ovt-dinh-doc-lap-f11cbb07",
      "name": "5 Muoi",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 406,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.778708,
      "lng": 106.693495,
      "address": "7 Le Quy Don, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "597460d9-2a7f-41bd-88a0-21b08616d0d0",
      "confidence": 0.955
    },
    {
      "id": "ovt-dinh-doc-lap-7f22348e",
      "name": "Đoàn Viên Restaurant",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.776784,
      "lng": 106.693674,
      "address": "6 Huyền Trân Công Chúa, Quận 1",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "b69525ae-6dcb-4c6b-b414-8fd2560d975e",
      "confidence": 0.991
    },
    {
      "id": "ovt-dinh-doc-lap-eafe4b90",
      "name": "Bún bò Huế Đông Ba",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.7,
      "reviewCount": 423,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.77438,
      "lng": 106.695419,
      "address": "110A Đường Nguyễn Du, Quận 1",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "64f38ba5-1a37-415d-91ce-a9a9cbd24f81",
      "confidence": 0.967
    },
    {
      "id": "ovt-dinh-doc-lap-c615b998",
      "name": "Quan Ngon 138",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.6,
      "reviewCount": 366,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.777519,
      "lng": 106.69749,
      "address": "138 Nam Kỳ Khởi Nghĩa, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "cdb1191e-dda0-46d8-8cd3-851d49d1da26",
      "confidence": 0.926
    },
    {
      "id": "ovt-dinh-doc-lap-38e6f121",
      "name": "Cơm Tấm Mộc",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 454,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.774514,
      "lng": 106.697925,
      "address": "85 Lý Tự Trọng, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "3c309714-3900-4494-9702-bc2844396a31",
      "confidence": 0.989
    }
  ],
  "nha-tho-duc-ba-sai-gon": [
    {
      "id": "ovt-nha-tho-duc-ba-c06aad37",
      "name": "Ngon Restaurant",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.777415,
      "lng": 106.69966,
      "address": "160 Pasteur, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "f428dc3a-d1a8-47a7-b7a3-8c0e901b8a8d",
      "confidence": 0.99
    },
    {
      "id": "ovt-nha-tho-duc-ba-1c349563",
      "name": "My Banh Mi",
      "cuisine": "Tiệm bánh & Tráng miệng",
      "specialtyDishes": [
        "Bánh mì Sài Gòn",
        "Bánh ngọt thủ công",
        "Chè & tráng miệng"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "25.000đ – 80.000đ",
      "lat": 10.77926,
      "lng": 106.700297,
      "address": "57 Nguyễn Du, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "528db9b8-5377-40ed-b377-94b9a015dd2e",
      "confidence": 0.995
    },
    {
      "id": "ovt-nha-tho-duc-ba-91a7f6a2",
      "name": "Lotteria",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 451,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.780604,
      "lng": 106.698713,
      "address": "34 Lê Duẫn, Hồ Chí Minh",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "86dea6dd-4dfd-4ee0-9733-240c513f7f7c",
      "confidence": 0.987
    },
    {
      "id": "ovt-nha-tho-duc-ba-75f42da8",
      "name": "Wrap&Roll",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 412,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.781114,
      "lng": 106.70085,
      "address": "39 Lê Duẩn, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e2707b51-53f5-49e0-83ab-bf8ae41b6be8",
      "confidence": 0.959
    },
    {
      "id": "ovt-nha-tho-duc-ba-b62a5d80",
      "name": "Au Parc Café",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.778767,
      "lng": 106.698059,
      "address": "23 Đ. Hàn Thuyên, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "bcc8212b-2d91-414b-8849-ea6aae3c72c0",
      "confidence": 0.995
    }
  ],
  "buu-dien-trung-tam-sai-gon": [
    {
      "id": "ovt-buu-dien-trung-5e790ce9",
      "name": "Nha Hang Di Mai",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 376,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.781194,
      "lng": 106.700394,
      "address": "TTTM Mplaza, 39 Lê Duẩn, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "7a0abe75-1c2b-4d39-9dba-ba08db6ad479",
      "confidence": 0.933
    },
    {
      "id": "ovt-buu-dien-trung-220a5291",
      "name": "Kids acoustic coffee and tea",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 433,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.78052,
      "lng": 106.69966,
      "address": "50 Phạm Đôn, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "f416e9a2-ea56-4de0-8fd6-ae33454d3ba2",
      "confidence": 0.974
    },
    {
      "id": "ovt-buu-dien-trung-40ce0f98",
      "name": "Trung Nguyen Legend Coffee World",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 436,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.77964,
      "lng": 106.700425,
      "address": "80 Nguyễn Du, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "eb7a8735-1298-4560-90c4-1c861a81e670",
      "confidence": 0.976
    },
    {
      "id": "ovt-buu-dien-trung-f46642f5",
      "name": "Đẹp Café",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 423,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.780254,
      "lng": 106.699516,
      "address": "Bưu điện, Trung Tâm, 3 Đ. Nguyễn Văn Bình, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "1c634990-4cb8-4350-8739-52d18237fda2",
      "confidence": 0.967
    },
    {
      "id": "ovt-buu-dien-trung-f584be39",
      "name": "Katinat Saigon Kafe",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 454,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.779123,
      "lng": 106.700206,
      "address": "59b Nguyễn Du, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "ce69a623-a666-4ee2-92b5-7499b35ff991",
      "confidence": 0.989
    }
  ],
  "ben-nha-rong": [
    {
      "id": "ovt-ben-nha-rong-bfe5ea5b",
      "name": "Elisa Floating Restaurant",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.767899,
      "lng": 106.707569,
      "address": "5 Đ. Nguyễn Tất Thành, Quận 4",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "3eb552a6-328f-4b25-a331-0acbd28c088a",
      "confidence": 0.993
    },
    {
      "id": "ovt-ben-nha-rong-0e787553",
      "name": "Indochina Junk",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.7,
      "reviewCount": 391,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.768219,
      "lng": 106.707562,
      "address": "Số 5 Nguyễn Tất Thành, Quận 4",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "5b67065c-ce7c-40af-bc48-13ba04ebb285",
      "confidence": 0.944
    },
    {
      "id": "ovt-ben-nha-rong-2da8660d",
      "name": "Tàu Bến Nghé",
      "cuisine": "Hải sản tươi sống",
      "specialtyDishes": [
        "Ốc & hải sản nướng",
        "Lẩu hải sản",
        "Tôm cua rang me"
      ],
      "rating": 4.7,
      "reviewCount": 408,
      "priceRange": "120.000đ – 350.000đ",
      "lat": 10.766928,
      "lng": 106.708176,
      "address": "5 Đường Nguyễn Khoái, Quận 4",
      "openHours": "10:00 – 22:30",
      "imageUrl": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e36fc08b-d088-4c9d-8aa6-e8de12d66a77",
      "confidence": 0.956
    },
    {
      "id": "ovt-ben-nha-rong-2b21617c",
      "name": "Saigon Princess",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.7,
      "reviewCount": 374,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.767499,
      "lng": 106.707842,
      "address": "Saigon Port 05, Đ. Nguyễn Tất Thành, Quận 4",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "11d0d3b2-4a9e-4474-ac99-5845954ae9f9",
      "confidence": 0.932
    },
    {
      "id": "ovt-ben-nha-rong-258d4663",
      "name": "Tealands Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.6,
      "reviewCount": 352,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.767304,
      "lng": 106.707705,
      "address": "5 Đ. Nguyễn Tất Thành, Quận 4",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "6d48fbac-e448-44d1-b546-5d50abb0892e",
      "confidence": 0.916
    }
  ],
  "nha-hat-thanh-pho-hcm": [
    {
      "id": "ovt-nha-hat-thanh--62538d31",
      "name": "Wrap and Roll",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 439,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.777251,
      "lng": 106.704096,
      "address": "62 Hai Bà Trưng, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "a63dcad6-6bcb-45b8-a4f9-4275600e8914",
      "confidence": 0.978
    },
    {
      "id": "ovt-nha-hat-thanh--9db7c03a",
      "name": "Nhà Hàng Cỏ Nội",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 440,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.77687,
      "lng": 106.70453,
      "address": "61-63 Hai Bà Trưng, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "8cde48d4-be86-49bd-b92f-cf1b45671949",
      "confidence": 0.979
    },
    {
      "id": "ovt-nha-hat-thanh--c1d2e229",
      "name": "Vietnam House Restaurant Đồng Khởi",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.774922,
      "lng": 106.704149,
      "address": "93-95-97 Đồng Khởi, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "92f38ba4-02d5-4384-8348-33bcf3584583",
      "confidence": 0.996
    },
    {
      "id": "ovt-nha-hat-thanh--0cd1da87",
      "name": "Li Bai",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.77566,
      "lng": 106.703959,
      "address": "Sheraton Saigon Grand Opera Hotel, 88 Đồng Khởi, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "a4c37d10-5c0e-4f05-a90d-0923c4b5f99d",
      "confidence": 0.996
    },
    {
      "id": "ovt-nha-hat-thanh--7caaac33",
      "name": "The Trieu Institute",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.775814,
      "lng": 106.705083,
      "address": "10 Mạc Thị Bưởi, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "57fe521b-5793-4a16-9339-6b2d1f70b3a7",
      "confidence": 0.995
    }
  ],
  "tru-so-ubnd-tphcm-dinh-xa-tay": [
    {
      "id": "ovt-tru-so-ubnd-tp-3f2d350d",
      "name": "Bún Đậu Ngõ Nhỏ Phố Nhỏ",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.8,
      "reviewCount": 444,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.777181,
      "lng": 106.699864,
      "address": "158 Pasteur, Quận 1",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "268a84b5-09fc-4b2c-beb3-c211b2baf04b",
      "confidence": 0.982
    },
    {
      "id": "ovt-tru-so-ubnd-tp-b5928ed5",
      "name": "Eddie's New York Deli & Diner",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.775103,
      "lng": 106.700574,
      "address": "73 Pasteur, Quận 1",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "fb02390a-082c-40c6-abfd-ac7e07bc9e51",
      "confidence": 0.996
    },
    {
      "id": "ovt-tru-so-ubnd-tp-edec301a",
      "name": "Starbucks",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 412,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.775704,
      "lng": 106.700543,
      "address": "146 - 148 Pasteur St, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "185d0ff6-813e-4cdb-add8-400bf7e12754",
      "confidence": 0.959
    },
    {
      "id": "ovt-tru-so-ubnd-tp-22b66c98",
      "name": "Mang's Mania Vegetarian Restaurant",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.8,
      "reviewCount": 451,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.775254,
      "lng": 106.702831,
      "address": "86 Nguyễn Huệ, Quận 1",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "983566a9-ac83-40ca-924d-8af1621088a2",
      "confidence": 0.987
    },
    {
      "id": "ovt-tru-so-ubnd-tp-3b521573",
      "name": "HuongLai Restaurant",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 370,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.77764,
      "lng": 106.70067,
      "address": "Floor2, 161A Vo Van Tan,  Dist3, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c38ed498-f9e9-497d-b150-1131643d812a",
      "confidence": 0.929
    }
  ],
  "cho-ben-thanh": [
    {
      "id": "ovt-cho-ben-thanh-c9d21ac9",
      "name": "Soul Ben Thanh",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 442,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.773277,
      "lng": 106.69751,
      "address": "7 Thủ Khoa Huân, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "7b12cbec-c95b-49ca-a1ea-8e2c445b3cbd",
      "confidence": 0.98
    },
    {
      "id": "ovt-cho-ben-thanh-25352e37",
      "name": "Nam Giao",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 447,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.773625,
      "lng": 106.698397,
      "address": "136/15 Lê Thánh Tôn, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "82f2d532-9cec-446f-b2e8-b6e564cec467",
      "confidence": 0.984
    },
    {
      "id": "ovt-cho-ben-thanh-90dacd8f",
      "name": "Pho 2000",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.8,
      "reviewCount": 444,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.772682,
      "lng": 106.696739,
      "address": "210 Lê Thánh Tôn, Quận 1",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "710306b2-84fd-45bb-8a84-1b680b2c2b12",
      "confidence": 0.982
    },
    {
      "id": "ovt-cho-ben-thanh-a994f8e6",
      "name": "Shamballa Vegetarian",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.8,
      "reviewCount": 453,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.771561,
      "lng": 106.697293,
      "address": "20 Lê Lai, Quận 1",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "728b1c96-a6c0-4a0d-bd90-e6ba65f9fc29",
      "confidence": 0.988
    },
    {
      "id": "ovt-cho-ben-thanh-87fcbc56",
      "name": "Vy Da Quan",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 429,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.774599,
      "lng": 106.698063,
      "address": "62 Ly Tu Trong st D1, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "857d1803-2eae-4273-b323-06f31e6e3795",
      "confidence": 0.971
    }
  ],
  "bao-tang-chung-tich-chien-tranh": [
    {
      "id": "ovt-bao-tang-chung-0d44fb3b",
      "name": "Hum Lounge",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.8,
      "reviewCount": 446,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.778618,
      "lng": 106.692062,
      "address": "34 Võ Văn Tần, Quận 3",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "f024f7ed-0cce-4317-a295-a04da7137b37",
      "confidence": 0.983
    },
    {
      "id": "ovt-bao-tang-chung-0c8f692a",
      "name": "Cơm quê Mười Khó",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 392,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.778866,
      "lng": 106.690849,
      "address": "27 Trần Quốc Thảo, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e935a08a-5aec-4dcc-8a54-bc6a66810ea5",
      "confidence": 0.945
    },
    {
      "id": "ovt-bao-tang-chung-188391ba",
      "name": "The Crab Shack",
      "cuisine": "Hải sản tươi sống",
      "specialtyDishes": [
        "Ốc & hải sản nướng",
        "Lẩu hải sản",
        "Tôm cua rang me"
      ],
      "rating": 4.7,
      "reviewCount": 383,
      "priceRange": "120.000đ – 350.000đ",
      "lat": 10.780044,
      "lng": 106.692086,
      "address": "11B Lê Quý Đôn, Quận 1",
      "openHours": "10:00 – 22:30",
      "imageUrl": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "ebfc8615-889f-4425-9d64-2242b0f0e9a1",
      "confidence": 0.938
    },
    {
      "id": "ovt-bao-tang-chung-47659352",
      "name": "Stix",
      "cuisine": "Ẩm thực Á Đông",
      "specialtyDishes": [
        "Món nướng & lẩu Á",
        "Cơm phần đặc biệt",
        "Món khai vị"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "80.000đ – 240.000đ",
      "lat": 10.780333,
      "lng": 106.691734,
      "address": "15 Le Quy Don, Quận 1",
      "openHours": "10:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "23b0d932-0e98-4fc0-8dfa-2764ff22552f",
      "confidence": 0.999
    },
    {
      "id": "ovt-bao-tang-chung-71bc364f",
      "name": "YEN Sushi & Sake Pub",
      "cuisine": "Ẩm thực Á Đông",
      "specialtyDishes": [
        "Món nướng & lẩu Á",
        "Cơm phần đặc biệt",
        "Món khai vị"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "80.000đ – 240.000đ",
      "lat": 10.78052,
      "lng": 106.691527,
      "address": "15A Lê Quý Đôn, Quận 1",
      "openHours": "10:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "2cc8a89f-a8aa-44fd-a47c-054f8b1fba65",
      "confidence": 0.995
    }
  ],
  "bao-tang-lich-su-thao-cam-vien": [
    {
      "id": "ovt-bao-tang-lich--a4424679",
      "name": "Nhà Hàng Tiệc Cưới Hoàng Long Quận 1",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 432,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.786727,
      "lng": 106.704056,
      "address": "2 Đường Lê Duẩn, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "18d232c5-bb99-4bf9-abb9-aa011abfaea6",
      "confidence": 0.973
    },
    {
      "id": "ovt-bao-tang-lich--78da57d2",
      "name": "Katinat",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.788094,
      "lng": 106.703946,
      "address": "25L Nguyễn Bỉnh Khiêm, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "b54e9c85-c04e-487d-b753-e552e893876b",
      "confidence": 0.994
    },
    {
      "id": "ovt-bao-tang-lich--ab7b4c47",
      "name": "Lá Chanh Thuần Vị Bắc",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 390,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.788105,
      "lng": 106.702782,
      "address": "12Q Nguyễn Thị Minh Khai, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "b68e67b2-78c9-4a11-926f-ff805fdebb75",
      "confidence": 0.943
    },
    {
      "id": "ovt-bao-tang-lich--59bd7f8e",
      "name": "Bloom Saigon Restaurant",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 450,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.790997,
      "lng": 106.70455,
      "address": "3/5 Hoang Sa, Quận Bình Thạnh",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "ed189b4b-7284-4d3b-bc6b-d50abb3e8049",
      "confidence": 0.986
    },
    {
      "id": "ovt-bao-tang-lich--7428acfd",
      "name": "Lets cafe - 01 Lê Duẩn",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 411,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.786682,
      "lng": 106.705264,
      "address": "Let's Café - 01 Lê Duẩn, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "d69b8606-9d09-4a3c-aaa5-8c24815f0b67",
      "confidence": 0.958
    }
  ],
  "bao-tang-my-thuat-tphcm-dinh-chu-hoa": [
    {
      "id": "ovt-bao-tang-my-th-2d6232f4",
      "name": "Secret Garden",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 413,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.770362,
      "lng": 106.699666,
      "address": "17-19 Lê Công Kiều, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "f6a92d15-61d8-42d4-9f72-e3488ffc3901",
      "confidence": 0.96
    },
    {
      "id": "ovt-bao-tang-my-th-ac196457",
      "name": "Bếp Mẹ Ỉn - Nguyễn Thái Bình",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.767665,
      "lng": 106.698569,
      "address": "165/43 Đường Nguyễn Thái Bình, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "432f761b-cb36-448e-bae5-43d13b72cfff",
      "confidence": 0.998
    },
    {
      "id": "ovt-bao-tang-my-th-de6e40ac",
      "name": "Sen Vegan House",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.7,
      "reviewCount": 405,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.769094,
      "lng": 106.700078,
      "address": "93-95 Phó Đức Chính, Quận 1",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "dfe35ac1-5b39-426e-a1a8-c6cdf2080a0e",
      "confidence": 0.954
    },
    {
      "id": "ovt-bao-tang-my-th-f86c1c16",
      "name": "Rau Oi Vegetarian",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.7,
      "reviewCount": 425,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.768548,
      "lng": 106.698028,
      "address": "55/15 Lê Thị Hồng Gấm, Quận 1",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "8462fe59-f772-4627-9858-439eb8eaba34",
      "confidence": 0.968
    },
    {
      "id": "ovt-bao-tang-my-th-0dfbf8b7",
      "name": "Kai Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.768405,
      "lng": 106.698941,
      "address": "139 Nguyễn Thái Bình, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "9ecd42d8-5a62-4c76-895c-f1ab5af26af9",
      "confidence": 0.995
    }
  ],
  "bao-tang-tphcm-dinh-gia-long": [
    {
      "id": "ovt-bao-tang-tphcm-2687e3f0",
      "name": "Pho 24",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.7,
      "reviewCount": 374,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.777137,
      "lng": 106.699629,
      "address": "158D Pasteur, Quận 1",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "8cbde1fd-02df-4172-a881-062ae3654152",
      "confidence": 0.932
    },
    {
      "id": "ovt-bao-tang-tphcm-f2cccae0",
      "name": "Phở Minh Pasteur Saigon",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.6,
      "reviewCount": 365,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.774868,
      "lng": 106.700354,
      "address": "1 Đường Pasteur, Quận 1",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "7e2c9bd3-50e6-4d6b-a1e7-d0d557d5f1ea",
      "confidence": 0.925
    },
    {
      "id": "ovt-bao-tang-tphcm-63c26169",
      "name": "Tách Coffee and Drinks",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 412,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.776904,
      "lng": 106.699277,
      "address": "91 Pasteur, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "65d110a0-608e-4e70-b9eb-463b46ce4c72",
      "confidence": 0.959
    },
    {
      "id": "ovt-bao-tang-tphcm-069a73c5",
      "name": "The Old Compass Cafe and Bar",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 433,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.774913,
      "lng": 106.700638,
      "address": "63/11 Pasteur, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "a18691bb-7453-4854-8cc8-8fc2b355c39a",
      "confidence": 0.974
    },
    {
      "id": "ovt-bao-tang-tphcm-2af0767d",
      "name": "Highlands Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.774722,
      "lng": 106.698186,
      "address": "71 Đường Lý Tự Trọng, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "22c761b1-7212-4b81-b0be-e6000b0dec8c",
      "confidence": 0.994
    }
  ],
  "chua-ngoc-hoang-phuoc-hai-tu": [
    {
      "id": "ovt-chua-ngoc-hoan-a79cbbf5",
      "name": "Bánh Cuốn Tây Hồ 127",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 453,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.790707,
      "lng": 106.696954,
      "address": "127 Đinh Tiên Hoàng, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "6c0999bb-c9d8-4afe-9096-6fa395865a1a",
      "confidence": 0.988
    },
    {
      "id": "ovt-chua-ngoc-hoan-b8e67878",
      "name": "Phước Duyên Chay",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.7,
      "reviewCount": 423,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.792359,
      "lng": 106.697718,
      "address": "95 Mai Thị Lựu, Quận 1",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "6d11ef09-cd8c-4f6e-b026-a5e496fd1099",
      "confidence": 0.967
    },
    {
      "id": "ovt-chua-ngoc-hoan-b56fb699",
      "name": "Quán 94 - Đặc Sản Cua Biển",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 443,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.790324,
      "lng": 106.697807,
      "address": "94 Đường Đinh Tiên Hoàng, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "9adba910-bf0c-44ce-b422-1e29f1ee31b0",
      "confidence": 0.981
    },
    {
      "id": "ovt-chua-ngoc-hoan-30d2a7f1",
      "name": "Oc Hai Nam Seafood Restaurant",
      "cuisine": "Hải sản tươi sống",
      "specialtyDishes": [
        "Ốc & hải sản nướng",
        "Lẩu hải sản",
        "Tôm cua rang me"
      ],
      "rating": 4.7,
      "reviewCount": 422,
      "priceRange": "120.000đ – 350.000đ",
      "lat": 10.791702,
      "lng": 106.697294,
      "address": "47 Nguyễn Văn Giai, Quận 1",
      "openHours": "10:00 – 22:30",
      "imageUrl": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "0fc52bb3-4c67-4d9f-a13c-0a3d5305feb8",
      "confidence": 0.966
    },
    {
      "id": "ovt-chua-ngoc-hoan-7fed8349",
      "name": "Chay Tuệ Nhà Hàng Buffet",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.6,
      "reviewCount": 356,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.791976,
      "lng": 106.698393,
      "address": "76 Mai Thị Lựu, Quận 1",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "48e5e0ab-020c-4404-9208-904b11f96dfe",
      "confidence": 0.919
    }
  ],
  "lang-ong-ba-chieu-le-van-duyet": [
    {
      "id": "ovt-lang-ong-ba-ch-b1087d19",
      "name": "Bún BBQ House",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.8,
      "reviewCount": 447,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.805132,
      "lng": 106.696613,
      "address": "22 Nguyễn An Ninh, Quận Bình Thạnh",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e4fc8b9c-5096-4cdd-b2ab-c1f3bdaf3aa6",
      "confidence": 0.984
    },
    {
      "id": "ovt-lang-ong-ba-ch-6466798c",
      "name": "Trà Sữa Ty Hí",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 436,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.804256,
      "lng": 106.6963,
      "address": "114A Trần Văn Kỷ, Quận Bình Thạnh",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "7fe5742b-58ee-49c5-99df-6fc2826a8d05",
      "confidence": 0.976
    },
    {
      "id": "ovt-lang-ong-ba-ch-79d44e4c",
      "name": "Nhà Hàng Chay Hoa Vô Ưu",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.6,
      "reviewCount": 351,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.803165,
      "lng": 106.698534,
      "address": "16 Lê Quang Định, P. 14, Q. Bình Thạnh, Quận Bình Thạnh",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "cf8d0b89-ff14-4814-9452-00d39354ef2d",
      "confidence": 0.915
    },
    {
      "id": "ovt-lang-ong-ba-ch-94eb67cb",
      "name": "Cơm Tấm Thuận Kiều",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 398,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.805531,
      "lng": 106.696026,
      "address": "43 Nguyễn Huy Lượng, Quận Bình Thạnh",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "8b5cd6dd-d4cd-4996-90aa-e6a659c05a28",
      "confidence": 0.949
    },
    {
      "id": "ovt-lang-ong-ba-ch-ce65a2e4",
      "name": "Quán 45-Phan Đăng Lưu",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.6,
      "reviewCount": 363,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.80259,
      "lng": 106.6959,
      "address": "49I Đường Cư Xá Phan Đăng Lưu, Quận Bình Thạnh",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "39b348ae-2adb-4acd-b91f-177d3cbe137e",
      "confidence": 0.924
    }
  ],
  "chua-ba-thien-hau-cho-lon": [
    {
      "id": "ovt-chua-ba-thien--99c21424",
      "name": "Hải Dương Quán - 118A Triệu Quang Phục",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.6,
      "reviewCount": 327,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.752828,
      "lng": 106.661669,
      "address": "118A Đường Triệu Quang Phục, Quận 5",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e0aca265-89f9-4225-b7e3-01628caed437",
      "confidence": 0.898
    },
    {
      "id": "ovt-chua-ba-thien--04f699dd",
      "name": "Tiến Phát - Điểm tâm Hồng Kông",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.8,
      "reviewCount": 433,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.754476,
      "lng": 106.662294,
      "address": "18 Đ. Ký Hoà, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e73e7bfc-3648-44b0-adbe-146edfba51f6",
      "confidence": 0.974
    },
    {
      "id": "ovt-chua-ba-thien--e4d3192c",
      "name": "Cielo Tea and Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 391,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.753439,
      "lng": 106.661565,
      "address": "130 Đ. Triệu Quang Phục, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "320ee8c5-3fbc-4cac-acea-491b9a394a51",
      "confidence": 0.944
    },
    {
      "id": "ovt-chua-ba-thien--f03ec3e8",
      "name": "Ẩm Thực Bà Ba Khéo",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 412,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.752277,
      "lng": 106.658686,
      "address": "57 Đ. Châu Văn Liêm, Quận 5",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "dc578cda-5708-4291-8ed8-f0ca15063a2b",
      "confidence": 0.959
    },
    {
      "id": "ovt-chua-ba-thien--56766f2f",
      "name": "Laha Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 446,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.754863,
      "lng": 106.660809,
      "address": "579 Đ. Hồng Bàng, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "d12465f6-4235-4fb9-8b29-7506a0ebd3dc",
      "confidence": 0.983
    }
  ],
  "ham-chua-vu-khi-biet-dong-sai-gon": [
    {
      "id": "ovt-ham-chua-vu-kh-69a0bd1f",
      "name": "Dong Pho Restaurant",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.7764,
      "lng": 106.687496,
      "address": "57 Hồ Xuân Hương, Quận 3",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c9dfb19d-05ee-47d9-a006-0ce0dee5b29c",
      "confidence": 0.993
    },
    {
      "id": "ovt-ham-chua-vu-kh-e542c57f",
      "name": "Tân Cà Phê - Cách Mạng Tháng 8",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 387,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.775631,
      "lng": 106.685558,
      "address": "199 Cách Mạng Tháng Tám, Quận 3",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "ab391f70-0ea9-4431-bcfe-3562e52bd74a",
      "confidence": 0.941
    },
    {
      "id": "ovt-ham-chua-vu-kh-c003f68d",
      "name": "Bún Bò Viên Cô Hoa Vườn Chuối",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.8,
      "reviewCount": 433,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.774104,
      "lng": 106.682858,
      "address": "116/1 Đ. Vườn Chuối, Quận 3",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "bc6bf9a3-b0e5-4a1c-abe2-a2177a229579",
      "confidence": 0.974
    },
    {
      "id": "ovt-ham-chua-vu-kh-b1db45b8",
      "name": "HuongLai Restaurant",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.774498,
      "lng": 106.688547,
      "address": "Floor2, 161A Vo Van Tan,  Dist3, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "71cc3712-8d2b-4ba0-a5c0-e5afee693bf2",
      "confidence": 0.99
    },
    {
      "id": "ovt-ham-chua-vu-kh-0c58e084",
      "name": "Starbucks",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.776493,
      "lng": 106.683786,
      "address": "241 Bis Cach Mang Thang Tam St 241Bis Cách Mạng Tháng Tám, Quận 3, Quận 3",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "82cf14a4-c70a-43a0-bc89-6aedef09cbd4",
      "confidence": 0.998
    }
  ],
  "dia-dao-cu-chi-ben-duoc": [
    {
      "id": "ovt-dia-dao-cu-chi-57b2c079",
      "name": "Ben Duoc Restaurant",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.4,
      "reviewCount": 236,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 11.148304,
      "lng": 106.458517,
      "address": "Phu Hiep Hamlet - Phu My Hung Commune, Huyện Củ Chi",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "15278cf8-964c-429b-84af-8cffd8cdb6e5",
      "confidence": 0.833
    },
    {
      "id": "ovt-dia-dao-cu-chi-73bd7e26",
      "name": "Bò Tơ Trường Lạc",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.5,
      "reviewCount": 302,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 11.127416,
      "lng": 106.448586,
      "address": "Trung Lập, Hưng Thuận, Trảng Bàng, Huyện Củ Chi",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "0a34280a-57fe-4e2c-9db2-33b55309cb2d",
      "confidence": 0.88
    },
    {
      "id": "ovt-dia-dao-cu-chi-a50700a2",
      "name": "Nhà Hàng Trường Lạc",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.4,
      "reviewCount": 226,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 11.13084,
      "lng": 106.47951,
      "address": "1 Đường Phú Thuận, Huyện Củ Chi",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "8837d03e-70a2-4a74-b772-4330b8c16812",
      "confidence": 0.826
    },
    {
      "id": "ovt-dia-dao-cu-chi-8874e388",
      "name": "Trà My Decor Wedding",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.6,
      "reviewCount": 320,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 11.131383,
      "lng": 106.479472,
      "address": "1742B Đ. Tỉnh Lộ 15, Huyện Củ Chi",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "ac4e3bb2-1f04-4809-a44b-f3b2394d12b7",
      "confidence": 0.893
    },
    {
      "id": "ovt-dia-dao-cu-chi-4ff05d13",
      "name": "Edelweiss Saigon",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.5,
      "reviewCount": 275,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 11.13168,
      "lng": 106.4801,
      "address": "29-31 Phạm Thái Bường, Phú Mỹ Hưng, Huyện Củ Chi",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "a7f59c1c-3265-452c-9263-15cd5a86cec1",
      "confidence": 0.861
    }
  ],
  "khu-du-tru-sinh-quyen-rung-sac-can-gio": [
    {
      "id": "ovt-khu-du-tru-sin-17488435",
      "name": "Jean Paul Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.4,
      "reviewCount": 234,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.487812,
      "lng": 106.875,
      "address": "33/11 Hẻm 33 Đường Lý Văn Phức, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "5d6ea7bb-280b-464c-9b3f-ccc670951eee",
      "confidence": 0.832
    }
  ],
  "chua-giac-lam-tan-binh": [
    {
      "id": "ovt-chua-giac-lam--f268b6d6",
      "name": "Quán Chay Phước Hòa",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.6,
      "reviewCount": 341,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.778238,
      "lng": 106.649885,
      "address": "794 Lạc Long Quân, Quận Tân Bình",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "d8a41750-2bff-4e7a-b3ba-69652f41aaf9",
      "confidence": 0.908
    },
    {
      "id": "ovt-chua-giac-lam--c2332160",
      "name": "Quán Chay Đức Hạnh",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.5,
      "reviewCount": 300,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.779167,
      "lng": 106.649767,
      "address": "619 Lạc Long Quân, Quận Tân Bình",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e1f13078-6f27-42b4-8644-ef239642c372",
      "confidence": 0.879
    },
    {
      "id": "ovt-chua-giac-lam--bc8c64b3",
      "name": "Queen Coffee and Tea",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.6,
      "reviewCount": 330,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.77858,
      "lng": 106.649822,
      "address": "615b Lạc Long Quân, Quận Tân Bình",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "0c618dc3-6fc5-4067-b94b-96d4dd848c88",
      "confidence": 0.9
    },
    {
      "id": "ovt-chua-giac-lam--c4fe3465",
      "name": "Myn Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 432,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.780415,
      "lng": 106.650019,
      "address": "884 Lạc Long Quân, Quận Tân Bình",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "2fd58a98-323e-491b-9421-6f4eae7de643",
      "confidence": 0.973
    },
    {
      "id": "ovt-chua-giac-lam--849abcef",
      "name": "Cháo Sá Sùng Tư Ký",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.6,
      "reviewCount": 339,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.77693,
      "lng": 106.646606,
      "address": "338/3 Âu Cơ, Phường 10, Tân Bình, Quận Tân Bình",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "b635f880-28fc-4658-ba9e-ce42441639e0",
      "confidence": 0.907
    }
  ],
  "chua-vinh-nghiem-quan-3": [
    {
      "id": "ovt-chua-vinh-nghi-92bdf430",
      "name": "Việt Chay",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.790109,
      "lng": 106.684179,
      "address": "290/21A Nam Kỳ Khởi Nghĩa, Quận 3",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "a34976a1-c610-4df9-a22d-e3201a9f0e61",
      "confidence": 0.99
    },
    {
      "id": "ovt-chua-vinh-nghi-8fd62026",
      "name": "Bún Bò Gánh",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.8,
      "reviewCount": 427,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.789071,
      "lng": 106.685376,
      "address": "110 Lý Chính Thắng, Quận 3",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "a5e5ae61-83fe-42b3-a75d-81a00f510cd7",
      "confidence": 0.97
    },
    {
      "id": "ovt-chua-vinh-nghi-f1372630",
      "name": "Cay Cot Dien",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 408,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.788685,
      "lng": 106.683528,
      "address": "627 Hoàng Sa, Quận 3",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e3ee4818-ee61-46f2-90af-2bfe4d2ad576",
      "confidence": 0.956
    },
    {
      "id": "ovt-chua-vinh-nghi-ac8f7664",
      "name": "Pho Dau",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.7,
      "reviewCount": 405,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.789805,
      "lng": 106.68506,
      "address": "288 M1, 288J1 Nam Kỳ Khởi Nghĩa, Quận 3",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "39178889-184d-4cee-93ec-5cbd320fe527",
      "confidence": 0.954
    },
    {
      "id": "ovt-chua-vinh-nghi-ee45cea9",
      "name": "Món ngon Sài Gòn",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 440,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.78656,
      "lng": 106.68459,
      "address": "2 Đường Nguyễn Đình Chiểu, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "87010e4a-e614-4cf5-8543-5bab1634302a",
      "confidence": 0.979
    }
  ],
  "den-tuong-niem-cac-vua-hung-thu-duc": [
    {
      "id": "ovt-den-tuong-niem-8c4e2518",
      "name": "Bún Bò Huế Ngọc Dung",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.8,
      "reviewCount": 446,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.87405,
      "lng": 106.815207,
      "address": "506 Hoàng Hữu Nam, Thủ Đức",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c8dc8f0e-894f-437d-b071-d1218d671091",
      "confidence": 0.983
    },
    {
      "id": "ovt-den-tuong-niem-52c2766c",
      "name": "Cafe Võng Giao Lộ (My My)",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.5,
      "reviewCount": 275,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.876897,
      "lng": 106.815799,
      "address": "552-556 Hoàng Hữu Nam, Thủ Đức",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "d3bde0e7-65a1-425d-b2ab-680ed84824af",
      "confidence": 0.861
    },
    {
      "id": "ovt-den-tuong-niem-039ae512",
      "name": "Kaizen Café",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.4,
      "reviewCount": 233,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.883695,
      "lng": 106.819931,
      "address": "28 Đường 16, Thủ Đức",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "fe422b33-063d-44d0-929e-83566c518716",
      "confidence": 0.831
    },
    {
      "id": "ovt-den-tuong-niem-4895920f",
      "name": "Ngôi Nhà Yến",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 370,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.872896,
      "lng": 106.815191,
      "address": "488 Đường Hoàng Hữu Nam, Thủ Đức",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "d3960ea5-5e89-4182-b1f3-39dd58e7fe16",
      "confidence": 0.929
    },
    {
      "id": "ovt-den-tuong-niem-c712da32",
      "name": "𝐀𝐧 𝐎𝐫𝐚𝐧𝐠𝐞 𝐂𝐮𝐩 𝐎𝐟 𝐌𝐞𝐦𝐨𝐫𝐢𝐞𝐬",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 383,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.879473,
      "lng": 106.811823,
      "address": "Sài Gòn, Dĩ An",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "94d3105a-94c7-436c-bd9e-d2207da5b3bc",
      "confidence": 0.938
    }
  ],
  "nha-tho-tan-dinh": [
    {
      "id": "ovt-nha-tho-tan-di-2030a480",
      "name": "Nấm Vegetarian Bistro",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.78887,
      "lng": 106.691657,
      "address": "67C Đinh Công Tráng, Quận 1",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "41190f10-01b1-44ed-a8a1-ce6c4412e409",
      "confidence": 0.992
    },
    {
      "id": "ovt-nha-tho-tan-di-39a5cb5d",
      "name": "Cộng Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 450,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.788952,
      "lng": 106.690839,
      "address": "274 Hai Bà Trưng, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "9dbb2029-a2e6-4dcc-b795-a5a2988be676",
      "confidence": 0.986
    },
    {
      "id": "ovt-nha-tho-tan-di-08f59279",
      "name": "Banh Xeo 46A",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 376,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.789554,
      "lng": 106.691364,
      "address": "46A Đinh Công Tráng, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c89215f0-24b0-41f7-9d14-3078503ac12c",
      "confidence": 0.933
    },
    {
      "id": "ovt-nha-tho-tan-di-d8c31b6d",
      "name": "Nhà hàng chay Phương Mai",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.8,
      "reviewCount": 430,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.789132,
      "lng": 106.692012,
      "address": "86F Võ Thị Sáu, Quận 1",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "972704c4-1844-4192-ba3b-1de813ad5727",
      "confidence": 0.972
    },
    {
      "id": "ovt-nha-tho-tan-di-ee5337b8",
      "name": "Cơm Tấm Bụi Sài Gòn",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 415,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.790926,
      "lng": 106.691476,
      "address": "100 Thạch Thị Thanh, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "606fdb64-ace2-42ce-938c-368644e98e94",
      "confidence": 0.961
    }
  ],
  "pho-di-bo-nguyen-hue-chung-cu-42": [
    {
      "id": "ovt-pho-di-bo-nguy-caced556",
      "name": "Cơm Tấm Cali",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 443,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.774123,
      "lng": 106.703983,
      "address": "48 Nguyễn Huệ, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "228991b7-e864-408d-9151-a67a64693c1c",
      "confidence": 0.981
    },
    {
      "id": "ovt-pho-di-bo-nguy-d3edf7b5",
      "name": "Cỏ Nội Vegetarian",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.8,
      "reviewCount": 439,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.775161,
      "lng": 106.703801,
      "address": "Khách sạn Bông Sen Sài Gòn, Tầng 7, 123 Đồng Khởi, Quận 1",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e40f89c7-4ecf-4539-88cb-36942faaa58e",
      "confidence": 0.978
    },
    {
      "id": "ovt-pho-di-bo-nguy-f8d80981",
      "name": "Dim Tu Tac Dong Du",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.775583,
      "lng": 106.704271,
      "address": "55 Đông Du, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "1e1bec84-9d96-43a9-8b43-01c948bcd2ba",
      "confidence": 0.995
    },
    {
      "id": "ovt-pho-di-bo-nguy-4b9b15e6",
      "name": "Nhà hàng Long Triều",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.8,
      "reviewCount": 450,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.773921,
      "lng": 106.705009,
      "address": "22 – 36 Nguyễn Huệ &, 57 – 69F Đồng Khởi, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "31352521-3200-4706-b5b7-64ed06c1627a",
      "confidence": 0.986
    },
    {
      "id": "ovt-pho-di-bo-nguy-d5cbaa97",
      "name": "Hoang Yen Buffet",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.77415,
      "lng": 106.705999,
      "address": "7 Ngô Đức Kế, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "f49692cf-67f3-42a6-976d-8c92e86d7ce4",
      "confidence": 0.992
    }
  ],
  "ben-bach-dang-cau-ba-son": [
    {
      "id": "ovt-ben-bach-dang--0b134edb",
      "name": "Starbucks Me Linh Point",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.7745,
      "lng": 106.705902,
      "address": "nhà Mê Linh Point, 2 Ngô Đức Kế, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "87a777bf-b968-495c-90b9-a4a345059a1a",
      "confidence": 0.998
    },
    {
      "id": "ovt-ben-bach-dang--da96d490",
      "name": "The Workshop Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 447,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.773496,
      "lng": 106.705582,
      "address": "27 Ngô Đức Kế, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "7a646885-cf81-4844-a502-4f29c9c919ab",
      "confidence": 0.984
    },
    {
      "id": "ovt-ben-bach-dang--eb4c3183",
      "name": "Viet Kitchen - International Vietnamese Restaurant",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 439,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.77448,
      "lng": 106.706394,
      "address": "8 15 Tôn Đức Thắng, Quận 1",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "87f23668-01d1-4d10-b756-1bbeaa2e28f5",
      "confidence": 0.978
    },
    {
      "id": "ovt-ben-bach-dang--87257f13",
      "name": "Pho Ha",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.8,
      "reviewCount": 432,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.771988,
      "lng": 106.705209,
      "address": "31 Hải Triều, Quận 1",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "ad56e691-cd85-406c-915d-2a5bc3635839",
      "confidence": 0.973
    },
    {
      "id": "ovt-ben-bach-dang--a8b0e019",
      "name": "Dynasty House",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.6,
      "reviewCount": 366,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.773684,
      "lng": 106.705772,
      "address": "2 Đồng Khởi, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c76ecd9a-ae3e-4665-ac51-b1f95fdaa17f",
      "confidence": 0.926
    }
  ],
  "cot-co-thu-ngu": [
    {
      "id": "ovt-cot-co-thu-ngu-106034c1",
      "name": "Matsuri Japanese Restaurant - Nguyễn Huệ",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.771642,
      "lng": 106.705887,
      "address": "3 Nguyễn Huệ, Quận 1",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c48f45ab-fea2-473a-a2bf-8c1027dbf283",
      "confidence": 0.996
    },
    {
      "id": "ovt-cot-co-thu-ngu-4e71f992",
      "name": "Cơm Tấm Mộc Bitexco Icon 68",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 373,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.771624,
      "lng": 106.70468,
      "address": "2 Đ. Hải Triều, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "b1c349f6-8eb7-4e33-832b-a975cfec49f5",
      "confidence": 0.931
    },
    {
      "id": "ovt-cot-co-thu-ngu-bc4f3a35",
      "name": "Ann Quán",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 416,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.772361,
      "lng": 106.704346,
      "address": "64 Đường Ngô Đức Kế, Quận Bình Thạnh",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "558c23f2-7fed-424a-ad85-d868f594aeb9",
      "confidence": 0.962
    },
    {
      "id": "ovt-cot-co-thu-ngu-7617dab2",
      "name": "Wainosuke",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.771744,
      "lng": 106.704996,
      "address": "29 Đ. Hải Triều, Quận 1",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e090bbf0-cb8a-4080-beaf-940f91bd4c5f",
      "confidence": 0.996
    },
    {
      "id": "ovt-cot-co-thu-ngu-4d766c50",
      "name": "Anan Saigon",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.771758,
      "lng": 106.702942,
      "address": "89 Tôn Thất Đạm, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "fe56135b-0571-45f1-a4ac-e26992e52167",
      "confidence": 0.991
    }
  ],
  "cau-mong-sai-gon": [
    {
      "id": "ovt-cau-mong-sai-g-c9450a07",
      "name": "Refined Saigon",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 446,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.769521,
      "lng": 106.704094,
      "address": "14 Tôn Thất Đạm, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "3f08ea0c-b02e-441d-975d-49e4dafbe58c",
      "confidence": 0.983
    },
    {
      "id": "ovt-cau-mong-sai-g-ae252017",
      "name": "Starbucks",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.767181,
      "lng": 106.703789,
      "address": "35 Ben Van Don, Dist. 4, Quận 4",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "f24afb91-f156-46f9-84ca-41a61e4eacdc",
      "confidence": 0.996
    },
    {
      "id": "ovt-cau-mong-sai-g-988fa535",
      "name": "Bếp Nhà Lục Tỉnh",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 413,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.76965,
      "lng": 106.701606,
      "address": "37 Nam Kỳ Khởi Nghĩa, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "1fe5e391-583d-4b17-9510-e2dde9b56d72",
      "confidence": 0.96
    },
    {
      "id": "ovt-cau-mong-sai-g-9c8cec15",
      "name": "The Coffee Plus",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 423,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.767461,
      "lng": 106.704172,
      "address": "33B Bến Vân Đồn, Quận 4",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "8d81be80-262a-4010-8418-3cae9a60fa4e",
      "confidence": 0.967
    },
    {
      "id": "ovt-cau-mong-sai-g-77ac61a4",
      "name": "Amigo café",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 450,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.769419,
      "lng": 106.702459,
      "address": "104 Nguyễn Công Trứ, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "18ff7c10-0cf0-4c7d-a4dd-16375de21e09",
      "confidence": 0.986
    }
  ],
  "ho-con-rua-cong-truong-quoc-te": [
    {
      "id": "ovt-ho-con-rua-con-fa9b19d5",
      "name": "Thiên Vương Tửu",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 401,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.781951,
      "lng": 106.696588,
      "address": "5 Đường Phạm Ngọc Thạch, Quận 3",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "6bba4103-c6c6-4b01-bafb-2ed7a0610124",
      "confidence": 0.951
    },
    {
      "id": "ovt-ho-con-rua-con-8f15d2c2",
      "name": "Ốc Bà Cô Lốc Cốc",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 380,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.783384,
      "lng": 106.696405,
      "address": "Hẻm 28 40A Trần Cao Vân, Quận 3",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "9b7fddd3-423d-4d74-a395-b6deb899fe67",
      "confidence": 0.936
    },
    {
      "id": "ovt-ho-con-rua-con-b746dcc7",
      "name": "Hoang Yen Vietnamese Cuisine",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.784809,
      "lng": 106.695943,
      "address": "148 Hai Bà Trưng, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "76167801-68dd-402a-bfe3-876b7a59f356",
      "confidence": 0.999
    },
    {
      "id": "ovt-ho-con-rua-con-e604f03b",
      "name": "Cộng Cà Phê",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 440,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.78314,
      "lng": 106.695819,
      "address": "08 BIS Công trường Quốc Tế, Quận 3",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "a5b99fe7-9cc0-484f-8137-fd17399314cd",
      "confidence": 0.979
    },
    {
      "id": "ovt-ho-con-rua-con-a54573fa",
      "name": "Bún Bò Thành Nội",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.7,
      "reviewCount": 374,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.783131,
      "lng": 106.696483,
      "address": "47 Trần Cao Vân, Quận 3",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "202bbe69-d5f3-4a02-bf81-a8bb34311b04",
      "confidence": 0.932
    }
  ],
  "thap-bitexco-saigon-skydeck": [
    {
      "id": "ovt-thap-bitexco-s-cf11efd3",
      "name": "Rice Field",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 397,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.772019,
      "lng": 106.703759,
      "address": "75 77 Hồ Tùng Mậu, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "a785d34c-dd31-4568-8662-91ecfd0101b3",
      "confidence": 0.948
    },
    {
      "id": "ovt-thap-bitexco-s-4a2304c5",
      "name": "Tiệm cơm thố Chuyên Ký",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.6,
      "reviewCount": 367,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.771414,
      "lng": 106.703116,
      "address": "65-67 Tôn Thất Đạm, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "dc20521d-2fa5-44a8-86e7-021c6bc81e5b",
      "confidence": 0.927
    },
    {
      "id": "ovt-thap-bitexco-s-3bb66ab5",
      "name": "RuNam",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 391,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.771885,
      "lng": 106.704183,
      "address": "45 Ngô Đức Kế, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e2e42e9a-7a8f-4f57-9cfe-e8d904092a46",
      "confidence": 0.944
    },
    {
      "id": "ovt-thap-bitexco-s-a2fdd73d",
      "name": "Nhân Sushi",
      "cuisine": "Ẩm thực Á Đông",
      "specialtyDishes": [
        "Món nướng & lẩu Á",
        "Cơm phần đặc biệt",
        "Món khai vị"
      ],
      "rating": 4.8,
      "reviewCount": 447,
      "priceRange": "80.000đ – 240.000đ",
      "lat": 10.77244,
      "lng": 106.704424,
      "address": "62 Ngô Đức Kế, Quận 1",
      "openHours": "10:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "f8cdc6ec-4108-48fe-b7b0-f70c8d646144",
      "confidence": 0.984
    },
    {
      "id": "ovt-thap-bitexco-s-dab41991",
      "name": "Amigo Grill Restaurant",
      "cuisine": "Nhà hàng & Bistro",
      "specialtyDishes": [
        "Món Âu – Á tuyển chọn",
        "Đồ nướng & salad",
        "Đồ uống pha chế"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "110.000đ – 320.000đ",
      "lat": 10.772972,
      "lng": 106.704426,
      "address": "Nguyễn Huệ/55 Ward, Quận 1",
      "openHours": "10:00 – 22:30",
      "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c35ac9ce-4e37-4b91-8af5-e1e912d748aa",
      "confidence": 0.995
    }
  ],
  "landmark-81-central-park": [
    {
      "id": "ovt-landmark-81-ce-d942a881",
      "name": "Oriental Pearl Restaurant",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 387,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.79499,
      "lng": 106.72218,
      "address": "720A Điện Biên Phủ, Quận Bình Thạnh",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "13adfc27-90de-4734-bb3e-59152452f563",
      "confidence": 0.941
    },
    {
      "id": "ovt-landmark-81-ce-3ff517e4",
      "name": "Bún Bò Huế An Hoà",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.8,
      "reviewCount": 433,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.795692,
      "lng": 106.721305,
      "address": "Landmark 6, Thủ Đức",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "933725c2-6268-4bb4-8ba8-c57a8995316b",
      "confidence": 0.974
    },
    {
      "id": "ovt-landmark-81-ce-6f201b28",
      "name": "Matsuri Japanese Restaurant - Vincom Center Landmark 81",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.795102,
      "lng": 106.721522,
      "address": "Vincom Center Landmark, 81 772 Điện Biên Phủ, Quận Bình Thạnh",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "1265ab74-6e01-4c1d-b8d9-f4e39fe59be0",
      "confidence": 0.993
    },
    {
      "id": "ovt-landmark-81-ce-0d0abcc7",
      "name": "Cơm tấm Cali",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 376,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.794593,
      "lng": 106.72083,
      "address": "Quận Bình Thạnh",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "285c615c-d90d-4b93-a3b1-3f3ecc3362cd",
      "confidence": 0.933
    },
    {
      "id": "ovt-landmark-81-ce-e6acebd5",
      "name": "Highlands Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 426,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.794867,
      "lng": 106.721636,
      "address": "Thủ Đức",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "9ece47d2-c8dd-4da6-8fbb-8440f753b669",
      "confidence": 0.969
    }
  ],
  "cau-anh-sao-ho-ban-nguyet": [
    {
      "id": "ovt-cau-anh-sao-ho-5ccce7e5",
      "name": "Hoang Yen Vietnamese Cuisine",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.727499,
      "lng": 106.719551,
      "address": "Hồ Bán Nguyệt/Đ. Tôn Dật Tiên/103 Phú Mỹ Hưng, Quận 7",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "d5d4fbf6-4a96-494f-8473-2ad0cd493331",
      "confidence": 0.994
    },
    {
      "id": "ovt-cau-anh-sao-ho-ea328dc7",
      "name": "Starbucks",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.728048,
      "lng": 106.718614,
      "address": "Cr1 02, Crescent Residence 1 CR1-02, Crescent Residence 1, 103 Tôn Dật Tiên, Quận 7, Quận 7",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c25a1b5b-d8ba-47e1-863f-5d51732a08f0",
      "confidence": 0.997
    },
    {
      "id": "ovt-cau-anh-sao-ho-7be53968",
      "name": "San Fu Lou",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.8,
      "reviewCount": 439,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.728149,
      "lng": 106.717923,
      "address": "TTTM, 101 Đ. Tôn Dật Tiên, Quận 7",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "582aa80d-1fc4-4f01-a2cb-f2bf990d307d",
      "confidence": 0.978
    },
    {
      "id": "ovt-cau-anh-sao-ho-68fa3d4d",
      "name": "Nhà hàng Ngõ",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 429,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.729656,
      "lng": 106.719203,
      "address": "Tầng 5, TTTM Crescent Mall, 101 Tôn Dật Tiên, P. Tân Phú, Quận 7, TP.HCM, Quận 7",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "5545a4ad-3fea-4993-af2f-55572429229d",
      "confidence": 0.971
    },
    {
      "id": "ovt-cau-anh-sao-ho-211cca76",
      "name": "KFC",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 440,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.728442,
      "lng": 106.718332,
      "address": "101 Tôn Dật Tiên, Quận 7",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "a92185a7-537d-4478-b76f-f735643bc170",
      "confidence": 0.979
    }
  ],
  "den-hindu-mariamman": [
    {
      "id": "ovt-den-hindu-mari-f7405ab1",
      "name": "Nhà Hàng Phương Cua",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 426,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.772412,
      "lng": 106.694801,
      "address": "228 Lý Tự Trọng, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "f107f3c3-ddf0-4f33-b75d-6c429771e3e9",
      "confidence": 0.969
    },
    {
      "id": "ovt-den-hindu-mari-2cc1130b",
      "name": "Trung Nguyên Legend Café",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.772683,
      "lng": 106.695417,
      "address": "219 Lý Tự Trọng, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "dd12a867-3162-405e-8e99-dce46fdb4a0e",
      "confidence": 0.999
    },
    {
      "id": "ovt-den-hindu-mari-7ce6afb3",
      "name": "CoCo Ichibanya",
      "cuisine": "Ẩm thực Á Đông",
      "specialtyDishes": [
        "Món nướng & lẩu Á",
        "Cơm phần đặc biệt",
        "Món khai vị"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "80.000đ – 240.000đ",
      "lat": 10.77214,
      "lng": 106.695829,
      "address": "256 Lê Thánh Tôn, Quận 1",
      "openHours": "10:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "312595dc-e12c-4b9e-8025-c248d0127c22",
      "confidence": 0.994
    },
    {
      "id": "ovt-den-hindu-mari-fa124d94",
      "name": "Chanh Bistro Rooftop Saigon",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.772815,
      "lng": 106.695619,
      "address": "Rooftop level, 215 Lý Tự Trọng, Quận 1",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "62be5b3f-70db-4c0e-87e7-3470bda774c4",
      "confidence": 0.995
    },
    {
      "id": "ovt-den-hindu-mari-437f3ef1",
      "name": "La Siesta Premium Saigon",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.773071,
      "lng": 106.695752,
      "address": "180 - 188 Lý Tự Trọng, Quận 1",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e99e40d5-21ad-4668-a9be-e309d52192a1",
      "confidence": 0.999
    }
  ],
  "thanh-duong-hoi-giao-saigon": [
    {
      "id": "ovt-thanh-duong-ho-49fda824",
      "name": "The Ox not only Ox",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.776951,
      "lng": 106.705349,
      "address": "24 Đông Du, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "63dd1cb5-586a-4b84-aaf4-620e860eb3db",
      "confidence": 0.99
    },
    {
      "id": "ovt-thanh-duong-ho-f1793aab",
      "name": "MANA Station - Tiệm Ăn Món Việt",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 391,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.776721,
      "lng": 106.70483,
      "address": "Hai Bà Trưng/57 Ward, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "696033f3-10d3-4104-a731-15477d6c547b",
      "confidence": 0.944
    },
    {
      "id": "ovt-thanh-duong-ho-a7924e24",
      "name": "Ciao Bella",
      "cuisine": "Nhà hàng & Bistro",
      "specialtyDishes": [
        "Món Âu – Á tuyển chọn",
        "Đồ nướng & salad",
        "Đồ uống pha chế"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "110.000đ – 320.000đ",
      "lat": 10.776372,
      "lng": 106.704829,
      "address": "11 Đông Du, Quận 1",
      "openHours": "10:00 – 22:30",
      "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "72a81398-4cbb-4bb1-ac78-d96a263ae1d1",
      "confidence": 0.991
    },
    {
      "id": "ovt-thanh-duong-ho-e82faae1",
      "name": "Geylang Lor 9, Singapore",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.7,
      "reviewCount": 394,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.776033,
      "lng": 106.70466,
      "address": "Dong Du, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "0647cbab-c374-40a0-a8af-35fba0f2e32d",
      "confidence": 0.946
    },
    {
      "id": "ovt-thanh-duong-ho-fab8d4da",
      "name": "Xu Restaurant Lounge",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.777015,
      "lng": 106.704425,
      "address": "71-73-75 Hai Bà Trưng, Quận 1",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "2da6f78b-78ce-4362-812d-5c0fc50cd3de",
      "confidence": 0.995
    }
  ],
  "nha-tho-huyen-sy": [
    {
      "id": "ovt-nha-tho-huyen--babdde36",
      "name": "Nhà Hàng Ngọc Sương 3",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 399,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.771805,
      "lng": 106.688504,
      "address": "106 Sương Nguyệt Anh, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c8e2f772-fa6c-477f-bb2f-adce5cadb8ec",
      "confidence": 0.95
    },
    {
      "id": "ovt-nha-tho-huyen--ecce8319",
      "name": "Con Ốc Quán",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 405,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.770191,
      "lng": 106.689847,
      "address": "150/39 Nguyễn Trãi, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "59ecdb1c-2ebe-4c21-993f-4a7b605eb7a2",
      "confidence": 0.954
    },
    {
      "id": "ovt-nha-tho-huyen--d558c073",
      "name": "Nhà hàng Trung Hoa SHANG GARDEN DYNASTY",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.769351,
      "lng": 106.688978,
      "address": "1A Tôn Thất Tùng, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e9dfcae1-a69c-44b5-888a-cabade304cdd",
      "confidence": 0.99
    },
    {
      "id": "ovt-nha-tho-huyen--2040f4c0",
      "name": "Den Long",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 443,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.769669,
      "lng": 106.690798,
      "address": "130 Nguyễn Trãi, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "28afb5ee-94ef-4ec4-bc43-f25d5985d293",
      "confidence": 0.981
    },
    {
      "id": "ovt-nha-tho-huyen--c980d656",
      "name": "Cong Cafe",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.770755,
      "lng": 106.687934,
      "address": "136 Sương Nguyệt Anh, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "9e316c70-d2d4-403b-a59c-5b0689030c70",
      "confidence": 0.996
    }
  ],
  "bao-tang-ton-duc-thang": [
    {
      "id": "ovt-bao-tang-ton-d-65fde956",
      "name": "Bún Chả Hà Nội 26",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.8,
      "reviewCount": 440,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.779236,
      "lng": 106.705099,
      "address": "8A/9C2 Thái Văn Lung, Quận 1",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "929386eb-ff7f-4047-897a-78580835c919",
      "confidence": 0.979
    },
    {
      "id": "ovt-bao-tang-ton-d-09a1d579",
      "name": "Ngoc Suong Seafood and Bar",
      "cuisine": "Hải sản tươi sống",
      "specialtyDishes": [
        "Ốc & hải sản nướng",
        "Lẩu hải sản",
        "Tôm cua rang me"
      ],
      "rating": 4.8,
      "reviewCount": 443,
      "priceRange": "120.000đ – 350.000đ",
      "lat": 10.778925,
      "lng": 106.705302,
      "address": "8 Nguyễn Siêu, Quận 1",
      "openHours": "10:00 – 22:30",
      "imageUrl": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "b6029ae1-e828-493c-8c11-a9cb6f0fce60",
      "confidence": 0.981
    },
    {
      "id": "ovt-bao-tang-ton-d-daf84d3a",
      "name": "Lebanhmi",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 446,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.779971,
      "lng": 106.704238,
      "address": "17.11 Lê Thánh Tôn, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "29921998-1959-45b7-b8ac-ec5370656779",
      "confidence": 0.983
    },
    {
      "id": "ovt-bao-tang-ton-d-c8c7f40a",
      "name": "Quan Bui",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.781321,
      "lng": 106.705919,
      "address": "19 Ngô Văn Năm, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "d52fa965-13c4-49ba-b725-dfd012740a16",
      "confidence": 0.997
    },
    {
      "id": "ovt-bao-tang-ton-d-fd12b6f5",
      "name": "Mandarine - Finest Vietnamese Cuisine",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 440,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.781133,
      "lng": 106.706112,
      "address": "11a Ngô Văn Năm, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e46ead0a-c2a3-4186-82f3-c2d9b270bb67",
      "confidence": 0.979
    }
  ],
  "bao-tang-phu-nu-nam-bo": [
    {
      "id": "ovt-bao-tang-phu-n-3ed892dd",
      "name": "Trung Nguyên Legend",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 454,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.786543,
      "lng": 106.687583,
      "address": "256 Nam Kỳ Khởi Nghĩa, Quận 3",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "827b6e5a-b9be-4d6f-9383-306e519563a6",
      "confidence": 0.989
    },
    {
      "id": "ovt-bao-tang-phu-n-442d11ed",
      "name": "Rạn Biển Seafood Mart",
      "cuisine": "Hải sản tươi sống",
      "specialtyDishes": [
        "Ốc & hải sản nướng",
        "Lẩu hải sản",
        "Tôm cua rang me"
      ],
      "rating": 4.7,
      "reviewCount": 404,
      "priceRange": "120.000đ – 350.000đ",
      "lat": 10.786892,
      "lng": 106.686738,
      "address": "195B Đường Nam Kỳ Khởi Nghĩa, Quận 3",
      "openHours": "10:00 – 22:30",
      "imageUrl": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "8730e040-7fe1-419c-a6f0-dc4709108b53",
      "confidence": 0.953
    },
    {
      "id": "ovt-bao-tang-phu-n-5b8494d5",
      "name": "Phở Hòa Pasteur",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.8,
      "reviewCount": 427,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.786652,
      "lng": 106.689232,
      "address": "260C Pasteur, Quận 1",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "83d7c47b-6a06-4e96-8adb-23f9fd5d3df7",
      "confidence": 0.97
    },
    {
      "id": "ovt-bao-tang-phu-n-1ac90749",
      "name": "Nhà Hàng Tiệc Cưới Callary",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 427,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.786812,
      "lng": 106.684824,
      "address": "123 Lý Chính Thắng, Quận 3",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "932c8a2e-5b1d-4ad5-bdf6-22afee0bea74",
      "confidence": 0.97
    },
    {
      "id": "ovt-bao-tang-phu-n-12a38503",
      "name": "Tân Cà Phê - Trần Quốc Toản",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 404,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.785937,
      "lng": 106.6873,
      "address": "Trần Quốc Toản/100 Võ Thị Sáu, Quận 3",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "1fbf6556-cf54-4490-8c6b-eabb93a21526",
      "confidence": 0.953
    }
  ],
  "bao-tang-biet-dong-sai-gon-145": [
    {
      "id": "ovt-bao-tang-biet--4256a14c",
      "name": "Lá Dong Riềng Restaurant",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 420,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.791769,
      "lng": 106.689999,
      "address": "172 Trần Quang Khải, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "45c2dfe1-17d4-4feb-bb47-8a9a38aeabad",
      "confidence": 0.965
    },
    {
      "id": "ovt-bao-tang-biet--f5d3f7a2",
      "name": "Mì A Quý",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.7,
      "reviewCount": 398,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.791685,
      "lng": 106.69051,
      "address": "151C Đ. Trần Quang Khải, Quận 1",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "cf1cabd7-258b-4b07-9bf7-6462e42b7271",
      "confidence": 0.949
    },
    {
      "id": "ovt-bao-tang-biet--f24c12d8",
      "name": "Quán Ăn Huế O Xuân",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 444,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.791447,
      "lng": 106.691273,
      "address": "22 Nguyễn Hữu Cầu, Quận 1",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "879409a4-8074-4ea8-9da5-9f2af1d4ed1b",
      "confidence": 0.982
    },
    {
      "id": "ovt-bao-tang-biet--b1884009",
      "name": "Cục Gạch Chay",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.6,
      "reviewCount": 323,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.790827,
      "lng": 106.691813,
      "address": "92B Thạch Thị Thanh, Quận 1",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "4d7f8fad-040c-42a9-9ad8-c3172b255787",
      "confidence": 0.895
    },
    {
      "id": "ovt-bao-tang-biet--804378c1",
      "name": "Gờ cafe - Thạch Thị Thanh",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 439,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.790312,
      "lng": 106.692613,
      "address": "27C Thạch Thị Thanh, Quận 1",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "ada3ea7a-98d6-4a8c-bdcb-2004ac3be45b",
      "confidence": 0.978
    }
  ],
  "hoi-quan-nghia-an-chua-ong": [
    {
      "id": "ovt-hoi-quan-nghia-a3bf4581",
      "name": "Nhà hàng Hai Lúa",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 433,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.75366,
      "lng": 106.66429,
      "address": "648 Đường Nguyễn Trãi, Quận 5",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e4a144ca-0d77-4652-a626-36d59fd90c81",
      "confidence": 0.974
    },
    {
      "id": "ovt-hoi-quan-nghia-3b8af0de",
      "name": "Diem Tâm Sáng Tân Tiên Phát",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.6,
      "reviewCount": 351,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.754446,
      "lng": 106.662317,
      "address": "18 Đường Ký Hòa, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "fa374a66-50a5-434b-9e52-d10ac51ba7e5",
      "confidence": 0.915
    },
    {
      "id": "ovt-hoi-quan-nghia-9877cc82",
      "name": "Nha Hang Ai Hue 2",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.6,
      "reviewCount": 351,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.752136,
      "lng": 106.662012,
      "address": "338 Trần Hưng Đạo, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "1ccb7038-88a1-425c-a080-5f98b541f27b",
      "confidence": 0.915
    },
    {
      "id": "ovt-hoi-quan-nghia-4bb31858",
      "name": "Starbucks",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.75597,
      "lng": 106.662605,
      "address": "Duong Hong Bang, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "eb62fea1-d3c9-4949-8254-c324c5ef4e28",
      "confidence": 0.992
    },
    {
      "id": "ovt-hoi-quan-nghia-d6d9b6b3",
      "name": "Bánh Xèo Ngọc Sơn",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 447,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.754469,
      "lng": 106.666417,
      "address": "103 Đ. Ngô Quyền, Quận 5",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "df62c654-ef4f-4b8f-97a6-88e7b1980ef4",
      "confidence": 0.984
    }
  ],
  "hoi-quan-on-lang-chua-quan-am": [
    {
      "id": "ovt-hoi-quan-on-la-6571635e",
      "name": "Milk tea Tien Huong",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 443,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.75238,
      "lng": 106.664484,
      "address": "60A Đ. Tản Đà, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "38a3de48-0c76-4dbd-b012-95ad9de62cc5",
      "confidence": 0.981
    },
    {
      "id": "ovt-hoi-quan-on-la-94f51de0",
      "name": "Van Hoa Restaurant",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 443,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.752667,
      "lng": 106.664432,
      "address": "68-76 Đ. Tản Đà, Quận 5",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "a4776387-6a35-4915-a553-acc14d54fcfb",
      "confidence": 0.981
    },
    {
      "id": "ovt-hoi-quan-on-la-e70906b8",
      "name": "Viva Star Coffee Tản Đà",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 446,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.75144,
      "lng": 106.664518,
      "address": "41 Đ. Tản Đà, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "08775fc3-7183-4623-b661-953f2074cc6b",
      "confidence": 0.983
    },
    {
      "id": "ovt-hoi-quan-on-la-6378abb2",
      "name": "Nhà Hàng Tiệc Cưới Thiên Hồng",
      "cuisine": "Ẩm thực Á Đông",
      "specialtyDishes": [
        "Món nướng & lẩu Á",
        "Cơm phần đặc biệt",
        "Món khai vị"
      ],
      "rating": 4.8,
      "reviewCount": 442,
      "priceRange": "80.000đ – 240.000đ",
      "lat": 10.752072,
      "lng": 106.664556,
      "address": "52 - 56 Tản Đà, Quận 5",
      "openHours": "10:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "044a7da3-d5ac-4bde-8614-dc409da59434",
      "confidence": 0.98
    },
    {
      "id": "ovt-hoi-quan-on-la-8292d4aa",
      "name": "Quan An Maika",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.8,
      "reviewCount": 440,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.751257,
      "lng": 106.664854,
      "address": "26 - 28 Đ. Tản Đà, Quận 5",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "67525421-adfb-4b2b-8705-3f348ae01756",
      "confidence": 0.979
    }
  ],
  "chua-van-phat-quan-5": [
    {
      "id": "ovt-chua-van-phat--d811d71f",
      "name": "Quán Cơm Chay Lục Diệp",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.7,
      "reviewCount": 423,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.755413,
      "lng": 106.669036,
      "address": "149/19 Nguyễn Tri Phương, Quận 5",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c60293b6-9b63-4894-bfab-f7dfee05459e",
      "confidence": 0.967
    },
    {
      "id": "ovt-chua-van-phat--46c9692f",
      "name": "BreadTalk Nguyễn Tri Phương",
      "cuisine": "Tiệm bánh & Tráng miệng",
      "specialtyDishes": [
        "Bánh mì Sài Gòn",
        "Bánh ngọt thủ công",
        "Chè & tráng miệng"
      ],
      "rating": 4.8,
      "reviewCount": 436,
      "priceRange": "25.000đ – 80.000đ",
      "lat": 10.755283,
      "lng": 106.66944,
      "address": "143 Nguyễn Tri Phương, Quận 5",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "b33686a2-e3f4-4805-8db8-a11723b44551",
      "confidence": 0.976
    },
    {
      "id": "ovt-chua-van-phat--490b773d",
      "name": "Ốc Win",
      "cuisine": "Hải sản tươi sống",
      "specialtyDishes": [
        "Ốc & hải sản nướng",
        "Lẩu hải sản",
        "Tôm cua rang me"
      ],
      "rating": 4.7,
      "reviewCount": 405,
      "priceRange": "120.000đ – 350.000đ",
      "lat": 10.75777,
      "lng": 106.669552,
      "address": "335 Đường Hùng Vương, Quận 5",
      "openHours": "10:00 – 22:30",
      "imageUrl": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "2286b464-1f80-4390-aa95-466d0e56429a",
      "confidence": 0.954
    },
    {
      "id": "ovt-chua-van-phat--f187c823",
      "name": "Starbucks",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 456,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.753752,
      "lng": 106.669659,
      "address": "98 126 Nguyen Tri Phuong St, Dist 5, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "b4c389fc-eda6-4a27-b3f7-7402b9bf4f69",
      "confidence": 0.997
    },
    {
      "id": "ovt-chua-van-phat--a0c53846",
      "name": "Baoz Dimsum",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.8,
      "reviewCount": 454,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.753102,
      "lng": 106.669586,
      "address": "82 - 84 - 86 - 88 Nguyễn Tri Phương, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "be44a56c-37f2-4fc4-9a0c-1ae5dc2d1ca0",
      "confidence": 0.989
    }
  ],
  "nha-tho-cho-quan": [
    {
      "id": "ovt-nha-tho-cho-qu-a45cc387",
      "name": "Hu Tieu A Hoa",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.7,
      "reviewCount": 425,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.757102,
      "lng": 106.682851,
      "address": "95 Phan Văn Trị, Quận 5",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "a5a1379e-445a-439c-9ee8-9e1b71e304e4",
      "confidence": 0.968
    },
    {
      "id": "ovt-nha-tho-cho-qu-54c0b0dc",
      "name": "Coconino Tea&Cheese",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 436,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.757056,
      "lng": 106.682553,
      "address": "127 Đường Phan Văn Trị, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "b59defc3-e239-4b22-9783-9f9994c8836c",
      "confidence": 0.976
    },
    {
      "id": "ovt-nha-tho-cho-qu-c615c52f",
      "name": "Oval Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 443,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.755553,
      "lng": 106.682429,
      "address": "747 Trần Hưng Đạo, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "ac8afd48-bc58-4c97-97e8-6863095e29e5",
      "confidence": 0.981
    },
    {
      "id": "ovt-nha-tho-cho-qu-b16369ce",
      "name": "Cơm Tấm Sà Bì Chưởng",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 392,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.758582,
      "lng": 106.680529,
      "address": "179 Trần Bình Trọng, Quận 5",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "86737d4a-91cd-4a02-bf1c-5c6586c45117",
      "confidence": 0.945
    },
    {
      "id": "ovt-nha-tho-cho-qu-b575a320",
      "name": "Langfarm Buffet",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.6,
      "reviewCount": 311,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.755379,
      "lng": 106.681879,
      "address": "1 Đường Trần Hưng Đạo, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e4db9a3b-3706-427e-ae4a-36cb712de4b0",
      "confidence": 0.887
    }
  ],
  "lang-du-lich-binh-quoi": [
    {
      "id": "ovt-lang-du-lich-b-96ea8990",
      "name": "Hồ Câu Tôm Giải Trí Thanh Đa",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.7,
      "reviewCount": 405,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.825501,
      "lng": 106.734997,
      "address": "428 Bình Quới, Quận Bình Thạnh",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "0df08261-7100-4bd8-92ec-a5f030211093",
      "confidence": 0.954
    },
    {
      "id": "ovt-lang-du-lich-b-543a5a79",
      "name": "Trung Nguyên E-Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.6,
      "reviewCount": 313,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.82646,
      "lng": 106.73587,
      "address": "355 Đường Binh Quoi, Quận Bình Thạnh",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "8b14ff44-266d-4d8d-a485-ff3bf26471fc",
      "confidence": 0.888
    },
    {
      "id": "ovt-lang-du-lich-b-cb327ce7",
      "name": "Café Xôm Bình Quới",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.5,
      "reviewCount": 285,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.828646,
      "lng": 106.738081,
      "address": "1143 Bình Quới, Quận Bình Thạnh",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c6f15e64-ab66-4f62-a0b4-408ef0b868a7",
      "confidence": 0.868
    },
    {
      "id": "ovt-lang-du-lich-b-22d4da18",
      "name": "Bảy Đực",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.4,
      "reviewCount": 247,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.82608,
      "lng": 106.739027,
      "address": "26/4 Xô Viết Nghệ Tĩnh (hẻm 480 Bình Quới), Quận Bình Thạnh",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "70ba6079-fefb-42fe-8c4e-130bbd9fe53b",
      "confidence": 0.841
    },
    {
      "id": "ovt-lang-du-lich-b-0a4b7d34",
      "name": "Quán Nông Trại Dê - CN Bình Quới",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.6,
      "reviewCount": 334,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.826262,
      "lng": 106.733634,
      "address": "319 Đường Bình Quới, Quận Bình Thạnh",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "45b9e13f-3ccf-41d2-9c23-a279ddd80a33",
      "confidence": 0.903
    }
  ],
  "hem-hao-si-phuong-cho-lon": [
    {
      "id": "ovt-hem-hao-si-phu-f98ac453",
      "name": "Nhà Hàng Chay Bà Xã",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.7,
      "reviewCount": 418,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.754178,
      "lng": 106.666889,
      "address": "636 Nguyễn Trãi, Quận 5",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "49da54da-5734-4104-aafe-93bbb6768345",
      "confidence": 0.963
    },
    {
      "id": "ovt-hem-hao-si-phu-24634737",
      "name": "Hi-End Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 406,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.754523,
      "lng": 106.666618,
      "address": "110b Đ. Ngô Quyền, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "4ff659c7-77ee-42e5-a9f7-5920e6f30e6e",
      "confidence": 0.955
    },
    {
      "id": "ovt-hem-hao-si-phu-64ef351a",
      "name": "Tokori Japanese BBQ",
      "cuisine": "Ẩm thực Á Đông",
      "specialtyDishes": [
        "Món nướng & lẩu Á",
        "Cơm phần đặc biệt",
        "Món khai vị"
      ],
      "rating": 4.7,
      "reviewCount": 409,
      "priceRange": "80.000đ – 240.000đ",
      "lat": 10.754679,
      "lng": 106.666423,
      "address": "105 Đ. Ngô Quyền, Quận 5",
      "openHours": "10:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "470239dc-50b4-4eff-ba8a-c9d75ee2f596",
      "confidence": 0.957
    },
    {
      "id": "ovt-hem-hao-si-phu-048c2260",
      "name": "Double Tap Tea and Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 415,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.752857,
      "lng": 106.666142,
      "address": "206/3 Trần Hưng Đạo, Quận 5",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "231fe7c3-819a-4e9e-aec5-28d9d564b041",
      "confidence": 0.961
    },
    {
      "id": "ovt-hem-hao-si-phu-f1b6770d",
      "name": "Vua Bít Tết Tawaza 台灣仔牛排",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.7,
      "reviewCount": 387,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.755092,
      "lng": 106.6665,
      "address": "116 Đường Ngô Quyền, Quận 5",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "fe00a315-d71f-464f-8de4-cf614ca88764",
      "confidence": 0.941
    }
  ],
  "cho-binh-tay-cho-lon": [
    {
      "id": "ovt-cho-binh-tay-c-80e0233b",
      "name": "Bún Nước Mì Trộn Út Tiêu",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.7,
      "reviewCount": 388,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.74965,
      "lng": 106.64919,
      "address": "297/2 Hẻm 297 Đường Hậu Giang, Quận 6",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "76119ae9-6aa4-4e4d-9c80-5b03bd08bf8b",
      "confidence": 0.942
    },
    {
      "id": "ovt-cho-binh-tay-c-2003c720",
      "name": "Highlands Coffee Phạm Đình Hổ",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 426,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.750644,
      "lng": 106.649581,
      "address": "Tp, 92 Đ. Phạm Đình Hổ, Quận 6",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "cd839598-c990-476c-8f58-0077eef37f5e",
      "confidence": 0.969
    },
    {
      "id": "ovt-cho-binh-tay-c-6525f448",
      "name": "Phở Chợ Lớn",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.7,
      "reviewCount": 390,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.752659,
      "lng": 106.650538,
      "address": "63 Nguyễn Thị Nhỏ, Quận 6",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "8a310767-1f5b-4fac-a1cf-06d915520084",
      "confidence": 0.943
    },
    {
      "id": "ovt-cho-binh-tay-c-acb1fe48",
      "name": "Trung Nguyên E-Coffee",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 394,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.747735,
      "lng": 106.649915,
      "address": "117 Đ. Bãi Sậy, Quận 6",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "1feffb6f-b8dc-475c-b7e1-104cb6e8cbbd",
      "confidence": 0.946
    },
    {
      "id": "ovt-cho-binh-tay-c-37f45a31",
      "name": "CuKen Food",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.6,
      "reviewCount": 345,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.74999,
      "lng": 106.652941,
      "address": "13/10 Đường Tháp Mười, Quận 6",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "741e5f22-bb80-4ca6-9459-3699bf4c72f4",
      "confidence": 0.911
    }
  ],
  "bao-tang-y-hoc-co-truyen-fito": [
    {
      "id": "ovt-bao-tang-y-hoc-f885e790",
      "name": "Tealive Tốc Trà Cao Thắng",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 418,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.774695,
      "lng": 106.674676,
      "address": "181 Cao Thắng, Quận 10",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "523387db-2e26-467a-a37a-5c97a895de44",
      "confidence": 0.963
    },
    {
      "id": "ovt-bao-tang-y-hoc-db750a50",
      "name": "Quan Oc T2",
      "cuisine": "Hải sản tươi sống",
      "specialtyDishes": [
        "Ốc & hải sản nướng",
        "Lẩu hải sản",
        "Tôm cua rang me"
      ],
      "rating": 4.7,
      "reviewCount": 411,
      "priceRange": "120.000đ – 350.000đ",
      "lat": 10.77575,
      "lng": 106.674531,
      "address": "392/20/58, Cao Thắng, Quận 10",
      "openHours": "10:00 – 22:30",
      "imageUrl": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "5449c5ad-f1e8-4585-b580-a5c36ee9d50f",
      "confidence": 0.958
    },
    {
      "id": "ovt-bao-tang-y-hoc-0cb6f87d",
      "name": "Bánh Cuốn Thiên Hương",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 425,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.772172,
      "lng": 106.675309,
      "address": "179A 3 Tháng 2, Quận 10",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "f320c568-4d13-4d0e-8524-3aee7eee3ca2",
      "confidence": 0.968
    },
    {
      "id": "ovt-bao-tang-y-hoc-1e138645",
      "name": "Phi Phố Biển",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.8,
      "reviewCount": 443,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.775058,
      "lng": 106.671848,
      "address": "16 Đường Lê Hồng Phong, Quận 10",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "1ec65546-2640-4f73-9da2-b76a0619b3e7",
      "confidence": 0.981
    },
    {
      "id": "ovt-bao-tang-y-hoc-a6ca99a9",
      "name": "Bò Kho Niêu Ông Gánh-CN Sài Gòn",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.5,
      "reviewCount": 260,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.774859,
      "lng": 106.673886,
      "address": "352 Đường Cao Thắng, Quận 10",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "63e3a8f2-af5c-4373-a5a8-59f45957e408",
      "confidence": 0.85
    }
  ],
  "cho-hoa-pho-am-thuc-ho-thi-ky": [
    {
      "id": "ovt-cho-hoa-pho-am-c685aac2",
      "name": "Peach Tea Trà Đào Dầm",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 401,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.764584,
      "lng": 106.676616,
      "address": "Unnamed, Quận 10",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "172e5002-07d3-48ea-a8d8-ed4b16fa6ad3",
      "confidence": 0.951
    },
    {
      "id": "ovt-cho-hoa-pho-am-20762bed",
      "name": "Horizon Kids Academy",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 412,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.76506,
      "lng": 106.67588,
      "address": "41 Đường Lê Hồng Phong, Quận 10",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "95e48a48-3b59-419a-9016-60533272a519",
      "confidence": 0.959
    },
    {
      "id": "ovt-cho-hoa-pho-am-5a217421",
      "name": "Hủ tiếu Sườn Sụn Liên",
      "cuisine": "Phở, Bún & Mì",
      "specialtyDishes": [
        "Phở bò truyền thống",
        "Bún thịt nướng",
        "Mì gia truyền"
      ],
      "rating": 4.6,
      "reviewCount": 355,
      "priceRange": "45.000đ – 90.000đ",
      "lat": 10.766069,
      "lng": 106.676387,
      "address": "103/13 Hồ Thị Kỷ, Quận 10",
      "openHours": "06:30 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "564b6255-4b14-4d9a-a26f-c6c245f25d0d",
      "confidence": 0.918
    },
    {
      "id": "ovt-cho-hoa-pho-am-1eb86b22",
      "name": "Lẩu bò Cô Thảo",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.7,
      "reviewCount": 383,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.766241,
      "lng": 106.677047,
      "address": "84/10 Hẻm 84 Hồ Thị Kỷ, Quận 10",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "636faa1f-3442-48bc-9b09-4ad61bbfaf9d",
      "confidence": 0.938
    },
    {
      "id": "ovt-cho-hoa-pho-am-956f597e",
      "name": "Bếp 3 Con Cua",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 376,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.762951,
      "lng": 106.674587,
      "address": "165 Đường Trần Nhân Tôn, Quận 10",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "6cf03e1e-d8b7-4495-b036-c74eb1662d86",
      "confidence": 0.933
    }
  ],
  "pho-di-bo-bui-vien": [
    {
      "id": "ovt-pho-di-bo-bui--c04d19e8",
      "name": "Home Saigon Restaurant",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.8,
      "reviewCount": 444,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.768286,
      "lng": 106.694012,
      "address": "185/28 Phạm Ngũ Lão, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "ced4c5ac-ed0d-4700-9470-7b774fcb78e0",
      "confidence": 0.982
    },
    {
      "id": "ovt-pho-di-bo-bui--23c28959",
      "name": "CẬU ỐC Seafood & Beer",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 411,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.766216,
      "lng": 106.693838,
      "address": "86 Đường Trần Hưng Đạo, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "cad3cc5f-5a71-40a1-b5cb-8dd170d41e6e",
      "confidence": 0.958
    },
    {
      "id": "ovt-pho-di-bo-bui--f0f02b36",
      "name": "Nhà Hàng Chay Ngọc Thọ",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.8,
      "reviewCount": 447,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.76864,
      "lng": 106.694324,
      "address": "175/9 Phạm Ngũ Lão, Quận 1",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "0a2747c9-c046-4541-a875-c7e436f2989e",
      "confidence": 0.984
    },
    {
      "id": "ovt-pho-di-bo-bui--fcf8e3ba",
      "name": "Vua Chả Cá - Số 42-44-46 Trần Hưng Đạo, Q.1, TP. HCM",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.6,
      "reviewCount": 355,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.766739,
      "lng": 106.694022,
      "address": "42 Trần Hưng Đạo, Quận 1",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "3e4cc656-adc6-4a14-8744-77c34f7743fc",
      "confidence": 0.918
    },
    {
      "id": "ovt-pho-di-bo-bui--0bffd51a",
      "name": "Xích Lô quán",
      "cuisine": "Hải sản tươi sống",
      "specialtyDishes": [
        "Ốc & hải sản nướng",
        "Lẩu hải sản",
        "Tôm cua rang me"
      ],
      "rating": 4.8,
      "reviewCount": 432,
      "priceRange": "120.000đ – 350.000đ",
      "lat": 10.766812,
      "lng": 106.694544,
      "address": "147A Trần Hưng Đạo, Quận 1",
      "openHours": "10:00 – 22:30",
      "imageUrl": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "df4d708a-4cd5-42cd-8ed4-4b0ef6ec8067",
      "confidence": 0.973
    }
  ],
  "cong-vien-bo-song-sai-gon-thu-thiem": [
    {
      "id": "ovt-cong-vien-bo-s-0cd2cdc3",
      "name": "C.Tao Chinese Restaurant",
      "cuisine": "Ẩm thực Hoa – Sài Gòn",
      "specialtyDishes": [
        "Dimsum hấp nóng",
        "Mì vịt tiềm",
        "Hủ tiếu xào"
      ],
      "rating": 4.8,
      "reviewCount": 436,
      "priceRange": "60.000đ – 190.000đ",
      "lat": 10.778386,
      "lng": 106.713788,
      "address": "Nguyễn Thiện Thành/20 Thủ Thiêm, Thủ Đức",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "9f261e48-e600-4a33-bf70-dacb273b7cab",
      "confidence": 0.976
    },
    {
      "id": "ovt-cong-vien-bo-s-c5ead837",
      "name": "Hải Sản Ngon Quận 2",
      "cuisine": "Hải sản tươi sống",
      "specialtyDishes": [
        "Ốc & hải sản nướng",
        "Lẩu hải sản",
        "Tôm cua rang me"
      ],
      "rating": 4.6,
      "reviewCount": 345,
      "priceRange": "120.000đ – 350.000đ",
      "lat": 10.77505,
      "lng": 106.71045,
      "address": "3/8 Đường Lương Định Của, Thủ Đức",
      "openHours": "10:00 – 22:30",
      "imageUrl": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "8d6fe7f8-46ea-4c30-b61a-0b1d2736d44f",
      "confidence": 0.911
    },
    {
      "id": "ovt-cong-vien-bo-s-aa4ddf25",
      "name": "NOIRE Cafe & Bistro - The Mett",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.6,
      "reviewCount": 344,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.778168,
      "lng": 106.713973,
      "address": "Tòa nhà The Mett, 15 Đ. Trần Bạch Đằng, Thủ Đức",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c8a98474-bfae-40f4-9d28-b4d0374fbabe",
      "confidence": 0.91
    },
    {
      "id": "ovt-cong-vien-bo-s-bee0ce02",
      "name": "Trung Nguyen Legend Coffee Thu Thiem",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.6,
      "reviewCount": 330,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.778847,
      "lng": 106.713608,
      "address": "B1.12 20 Nguyễn Thiện Thành, Thủ Đức",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "065d4af5-4fa1-43af-9a17-a2da6a1bd544",
      "confidence": 0.9
    },
    {
      "id": "ovt-cong-vien-bo-s-1b8b0b38",
      "name": "G.Cup Cafe & Bistro - METROPOLE",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.5,
      "reviewCount": 268,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.779243,
      "lng": 106.713001,
      "address": "Chung cư The Galleria Residence, B1.28, Tháp B/20 Nguyễn Thiện Thành, Thủ Đức",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "95aa0d45-a71c-480c-8ab2-5309248ae45d",
      "confidence": 0.856
    }
  ],
  "chua-buu-long-thu-duc": [
    {
      "id": "ovt-chua-buu-long--ba6d85ef",
      "name": "Chị Tư Vịt",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 412,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.866293,
      "lng": 106.842968,
      "address": "33/8 Mạc Hiển Tích, Thủ Đức",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "2b3e1e54-984e-4d0d-995e-e04643dc4bd3",
      "confidence": 0.959
    },
    {
      "id": "ovt-chua-buu-long--84e9b045",
      "name": "Quán Bến Đò Cây Me Q9 - Cô Phúc",
      "cuisine": "Hải sản tươi sống",
      "specialtyDishes": [
        "Ốc & hải sản nướng",
        "Lẩu hải sản",
        "Tôm cua rang me"
      ],
      "rating": 4.6,
      "reviewCount": 338,
      "priceRange": "120.000đ – 350.000đ",
      "lat": 10.865488,
      "lng": 106.842781,
      "address": "9 Hẻm 1 Mạc Hiển Tích, Thủ Đức",
      "openHours": "10:00 – 22:30",
      "imageUrl": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "0400491b-acd8-4003-8851-779ba5a0d814",
      "confidence": 0.906
    },
    {
      "id": "ovt-chua-buu-long--8dad7912",
      "name": "Phúc Long Kiosk",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.3,
      "reviewCount": 181,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.86004,
      "lng": 106.836664,
      "address": "1033 Nguyễn Xiển, Thủ Đức",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "4f6f5cc2-219b-4be9-882e-78f189359a6b",
      "confidence": 0.794
    },
    {
      "id": "ovt-chua-buu-long--74372682",
      "name": "Hoa Vien 979",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.7,
      "reviewCount": 381,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.857162,
      "lng": 106.834144,
      "address": "979 Nguyễn Xiển, Thủ Đức",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "f517f241-184a-4c6d-b697-f0e12aabd643",
      "confidence": 0.937
    },
    {
      "id": "ovt-chua-buu-long--6ba1eeba",
      "name": "Ăn Vặt MyMy TĐC",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 369,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.890629,
      "lng": 106.831793,
      "address": "155 Đường B, Thủ Đức",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "08f00792-155a-446d-98db-3a2fdacff060",
      "confidence": 0.928
    }
  ],
  "bao-tang-ao-dai-thu-duc": [
    {
      "id": "ovt-bao-tang-ao-da-c814c022",
      "name": "Lẩu mắm Phong Lan cầu Sài Gòn",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.7,
      "reviewCount": 412,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.813696,
      "lng": 106.835656,
      "address": "26 Đường Long Thuận, Thủ Đức",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "85301a32-1ccb-4e90-baf8-204181f71d98",
      "confidence": 0.959
    },
    {
      "id": "ovt-bao-tang-ao-da-3ff3d8bb",
      "name": "Hồ Nhà - Câu cá giải trí & Ẩm thực đồng quê",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.6,
      "reviewCount": 310,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.808057,
      "lng": 106.832793,
      "address": "233/22 Đường Tam Đa, Phường Trường Thạnh, Quận 9, TP.HCM, Thủ Đức",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "ef343942-f3a9-4fea-b732-7b92b3f67d2e",
      "confidence": 0.886
    },
    {
      "id": "ovt-bao-tang-ao-da-415cd89a",
      "name": "Quán Ốc Đảo Q9_Cafe Nhà Đất Q9",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.4,
      "reviewCount": 234,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.81403,
      "lng": 106.83908,
      "address": "69/2/37 Đường Nguyễn Gia Trí, Quận Bình Thạnh",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c58d1128-6df5-434d-b68c-235cb1e2080a",
      "confidence": 0.832
    },
    {
      "id": "ovt-bao-tang-ao-da-25ac7235",
      "name": "Paradise Garden Cafe",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 423,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.81172,
      "lng": 106.853663,
      "address": "203 Long Thuận, Thủ Đức",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "74c94f66-5c38-4744-9107-9ee95fcb5d32",
      "confidence": 0.967
    },
    {
      "id": "ovt-bao-tang-ao-da-8f365f7d",
      "name": "Quán Ăn Tôm Sông Cây Dừa",
      "cuisine": "Ẩm thực Việt Nam",
      "specialtyDishes": [
        "Cơm tấm sườn bì",
        "Gỏi cuốn tôm thịt",
        "Món đặc sản Nam Bộ"
      ],
      "rating": 4.5,
      "reviewCount": 304,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.801099,
      "lng": 106.85607,
      "address": "48 Đường Hòa Bình, Quận 11",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "dae74d4e-b53e-4d3d-ba59-1bf70f740fba",
      "confidence": 0.882
    }
  ],
  "bao-tang-nghe-thuat-quang-san": [
    {
      "id": "ovt-bao-tang-nghe--fb463ed2",
      "name": "The Windsor Tea House",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 443,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.810116,
      "lng": 106.734323,
      "address": "44 Trúc Đường, Thủ Đức",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e2bdd701-32f3-42e5-ba73-ecd42436aaab",
      "confidence": 0.981
    },
    {
      "id": "ovt-bao-tang-nghe--be8477f8",
      "name": "L'Herbanyste",
      "cuisine": "Ẩm thực Chay thanh tịnh",
      "specialtyDishes": [
        "Cơm chay thập cẩm",
        "Lẩu nấm chay",
        "Gỏi cuốn chay"
      ],
      "rating": 4.7,
      "reviewCount": 416,
      "priceRange": "45.000đ – 130.000đ",
      "lat": 10.811421,
      "lng": 106.733133,
      "address": "215E4 Nguyễn Văn Hưởng, Thủ Đức",
      "openHours": "07:30 – 21:00",
      "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c33d6071-4b63-42fc-b292-ab8974377488",
      "confidence": 0.962
    },
    {
      "id": "ovt-bao-tang-nghe--a8b68192",
      "name": "A dough Saigon",
      "cuisine": "Tiệm bánh & Tráng miệng",
      "specialtyDishes": [
        "Bánh mì Sài Gòn",
        "Bánh ngọt thủ công",
        "Chè & tráng miệng"
      ],
      "rating": 4.6,
      "reviewCount": 346,
      "priceRange": "25.000đ – 80.000đ",
      "lat": 10.80966,
      "lng": 106.734234,
      "address": "36 Đ. Số 2, Thủ Đức",
      "openHours": "07:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "7b7ce575-6c64-41c3-86c6-8721bd021c2b",
      "confidence": 0.912
    },
    {
      "id": "ovt-bao-tang-nghe--cfd0cf3c",
      "name": "Bluish Cafe",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.7,
      "reviewCount": 412,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.809161,
      "lng": 106.733427,
      "address": "15A Trúc Đường, Thủ Đức",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "90fd5524-f746-49bc-8527-fa8ae9a6d619",
      "confidence": 0.959
    },
    {
      "id": "ovt-bao-tang-nghe--151317ba",
      "name": "Le Petit Musee Bistro Thao Dien",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.6,
      "reviewCount": 310,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.810243,
      "lng": 106.734071,
      "address": "40 Đường Số 4, Thủ Đức",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "3ef22d93-25a3-4a79-b562-b5a1a5616aa4",
      "confidence": 0.886
    }
  ],
  "tu-vien-khanh-an-quan-12": [
    {
      "id": "ovt-tu-vien-khanh--a917e3c7",
      "name": "Lẩu Gà Lá É Tao Ngộ",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.4,
      "reviewCount": 245,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.86427,
      "lng": 106.689872,
      "address": "80A Vườn Lài Nối Dài, Quận 12",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "c01abb5b-192e-4b6a-9ecd-d21103cb996d",
      "confidence": 0.84
    },
    {
      "id": "ovt-tu-vien-khanh--d9842fd3",
      "name": "Cafe & trà sữa Gác Nhỏ _ vườn lài ND , an phú đông, q12",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.6,
      "reviewCount": 318,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.861852,
      "lng": 106.691405,
      "address": "142 Vườn Lài Nối Dài, Quận 12",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "e9c79b90-058d-4f29-85f9-b9a39f0e40f8",
      "confidence": 0.892
    },
    {
      "id": "ovt-tu-vien-khanh--ab4e5bed",
      "name": "Tỉnh Café",
      "cuisine": "Cà phê & Đồ uống",
      "specialtyDishes": [
        "Cà phê sữa đá Sài Gòn",
        "Trà trái cây",
        "Bánh ngọt"
      ],
      "rating": 4.8,
      "reviewCount": 426,
      "priceRange": "35.000đ – 75.000đ",
      "lat": 10.869877,
      "lng": 106.692638,
      "address": "454 Đường Thạnh Lộc 31, Quận 12",
      "openHours": "07:00 – 22:00",
      "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "92c8d804-0049-4236-9f84-dd7eaa1c79b6",
      "confidence": 0.969
    },
    {
      "id": "ovt-tu-vien-khanh--c10d69a3",
      "name": "Dê Vườn Xoài",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.4,
      "reviewCount": 197,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.862431,
      "lng": 106.691063,
      "address": "1420/1c Vườn Lài, Quận 12",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "5b685c00-e28e-402a-bf15-b8dee19d8ecf",
      "confidence": 0.805
    },
    {
      "id": "ovt-tu-vien-khanh--67b01fe3",
      "name": "Heo Quay Thành Phát",
      "cuisine": "Quán ăn địa phương",
      "specialtyDishes": [
        "Món ăn đặc trưng Sài Gòn",
        "Cơm & món nước",
        "Đồ uống giải khát"
      ],
      "rating": 4.5,
      "reviewCount": 264,
      "priceRange": "45.000đ – 140.000đ",
      "lat": 10.86633,
      "lng": 106.68816,
      "address": "cầu Võ Rồng phường Thạnh Xuân quận 12, Quận 12",
      "openHours": "08:00 – 21:30",
      "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
      "source": "overture",
      "overtureId": "a3234733-1209-4afe-b0f1-3fadfd71d3cd",
      "confidence": 0.853
    }
  ]
};
