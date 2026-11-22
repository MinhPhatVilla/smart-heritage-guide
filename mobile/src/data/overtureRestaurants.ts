/**
 * Dữ liệu hàng quán & quán cà phê thực tế quanh 20 di tích TP. Hồ Chí Minh
 * được đồng bộ tự động từ Overture Maps Foundation (theme=places, GeoParquet).
 *
 * - Release: 2026-11-18.0
 * - Synced at: 2026-11-22T06:27:54Z
 * - Tổng cộng: 96 địa điểm ẩm thực quanh 20/20 di tích
 *
 * Cập nhật lại bằng lệnh: `cd backend && python -m scripts.sync_overture_places`
 */

import { NearbyRestaurant } from '../types/heritage';

export const OVERTURE_PLACES_RELEASE = '2026-11-18.0';
export const OVERTURE_PLACES_SYNCED_AT = '2026-11-22T06:27:54Z';

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
  ]
};
