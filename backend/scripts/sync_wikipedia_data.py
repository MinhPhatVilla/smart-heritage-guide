"""Fetch authentic Wikipedia descriptions & Wikimedia Commons real photographs
for all 50 Ho Chi Minh City heritage sites & attractions.

Generates:
    mobile/src/data/wikipediaEnrichment.ts
And updates:
    backend/scripts/seed_supabase.py (SEED_SITES_DATA with real photos & enriched Wikipedia details)

Usage:
    cd backend
    python -m scripts.sync_wikipedia_data
"""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

OUTPUT_TS_PATH = REPO_ROOT / "mobile" / "src" / "data" / "wikipediaEnrichment.ts"
SEED_PY_PATH = BACKEND_ROOT / "scripts" / "seed_supabase.py"

USER_AGENT = "SmartHeritageGuide/2.0 (https://github.com/smart-heritage-guide; educational-tourism-app)"

# Curated Wikipedia (vi, en) article titles & Wikimedia Commons search terms for all 50 HCMC sites
WIKI_MAPPING: dict[str, dict[str, Any]] = {
    "dinh-doc-lap": {
        "vi": "Dinh Độc Lập",
        "en": "Independence Palace",
        "commons": ["Independence Palace Ho Chi Minh City", "Reunification Palace Saigon"],
    },
    "nha-tho-duc-ba-sai-gon": {
        "vi": "Nhà thờ chính tòa Đức Bà Sài Gòn",
        "en": "Notre-Dame Cathedral Basilica of Saigon",
        "commons": ["Notre-Dame Cathedral Basilica of Saigon", "Saigon Notre Dame Cathedral"],
    },
    "buu-dien-trung-tam-sai-gon": {
        "vi": "Bưu điện trung tâm Sài Gòn",
        "en": "Saigon Central Post Office",
        "commons": ["Saigon Central Post Office", "Central Post Office Ho Chi Minh City"],
    },
    "ben-nha-rong": {
        "vi": "Bến Nhà Rồng",
        "en": "Ho Chi Minh Museum, Ho Chi Minh City",
        "commons": ["Ben Nha Rong", "Ho Chi Minh Museum Ho Chi Minh City"],
    },
    "nha-hat-thanh-pho-hcm": {
        "vi": "Nhà hát Thành phố Hồ Chí Minh",
        "en": "Municipal Theatre of Ho Chi Minh City",
        "commons": ["Saigon Opera House", "Municipal Theatre Ho Chi Minh City"],
    },
    "tru-so-ubnd-tphcm-dinh-xa-tay": {
        "vi": "Trụ sở Ủy ban nhân dân Thành phố Hồ Chí Minh",
        "en": "Ho Chi Minh City Hall",
        "commons": ["Ho Chi Minh City Hall", "People's Committee Building Ho Chi Minh City"],
    },
    "cho-ben-thanh": {
        "vi": "Chợ Bến Thành",
        "en": "Bến Thành Market",
        "commons": ["Ben Thanh Market", "Chợ Bến Thành"],
    },
    "bao-tang-chung-tich-chien-tranh": {
        "vi": "Bảo tàng Chứng tích chiến tranh",
        "en": "War Remnants Museum",
        "commons": ["War Remnants Museum Ho Chi Minh City"],
    },
    "bao-tang-lich-su-thao-cam-vien": {
        "vi": "Bảo tàng Lịch sử Thành phố Hồ Chí Minh",
        "en": "Museum of Vietnamese History",
        "commons": ["Museum of Vietnamese History Ho Chi Minh City", "Saigon Zoo and Botanical Gardens"],
    },
    "bao-tang-my-thuat-tphcm-dinh-chu-hoa": {
        "vi": "Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh",
        "en": "Ho Chi Minh City Museum of Fine Arts",
        "commons": ["Ho Chi Minh City Museum of Fine Arts"],
    },
    "bao-tang-tphcm-dinh-gia-long": {
        "vi": "Bảo tàng Thành phố Hồ Chí Minh",
        "en": "Ho Chi Minh City Museum",
        "commons": ["Ho Chi Minh City Museum Gia Long Palace"],
    },
    "chua-ngoc-hoang-phuoc-hai-tu": {
        "vi": "Chùa Ngọc Hoàng",
        "en": "Jade Emperor Pagoda",
        "commons": ["Jade Emperor Pagoda Ho Chi Minh City"],
    },
    "lang-ong-ba-chieu-le-van-duyet": {
        "vi": "Lăng Ông (Bà Chiểu)",
        "en": "Tomb of Lê Văn Duyệt",
        "commons": ["Lang Ong Ba Chieu", "Tomb of Le Van Duyet"],
    },
    "chua-ba-thien-hau-cho-lon": {
        "vi": "Hội quán Tuệ Thành",
        "en": "Thiên Hậu Temple, Ho Chi Minh City",
        "commons": ["Thien Hau Temple Ho Chi Minh City"],
    },
    "ham-chua-vu-khi-biet-dong-sai-gon": {
        "vi": "Biệt động Sài Gòn",
        "en": "Saigon Rangers",
        "commons": ["Nguyen Dinh Chieu Ho Chi Minh City", "Saigon Commando", "287/70 Nguyen Dinh Chieu"],
    },
    "dia-dao-cu-chi-ben-duoc": {
        "vi": "Địa đạo Củ Chi",
        "en": "Củ Chi tunnels",
        "commons": ["Cu Chi tunnels", "Ben Duoc Cu Chi"],
    },
    "khu-du-tru-sinh-quyen-rung-sac-can-gio": {
        "vi": "Khu dự trữ sinh quyển rừng ngập mặn Cần Giờ",
        "en": "Cần Giờ Mangrove Forest",
        "commons": ["Can Gio Mangrove Forest", "Can Gio Ho Chi Minh City"],
    },
    "chua-giac-lam-tan-binh": {
        "vi": "Chùa Giác Lâm",
        "en": "Giác Lâm Pagoda",
        "commons": ["Giac Lam Pagoda"],
    },
    "chua-vinh-nghiem-quan-3": {
        "vi": "Chùa Vĩnh Nghiêm (Thành phố Hồ Chí Minh)",
        "en": "Vĩnh Nghiêm Pagoda, Ho Chi Minh City",
        "commons": ["Vinh Nghiem Pagoda Ho Chi Minh City"],
    },
    "den-tuong-niem-cac-vua-hung-thu-duc": {
        "vi": "Công viên Lịch sử – Văn hóa Dân tộc",
        "en": "National Historical and Cultural Park",
        "commons": ["Hung Kings Temple Ho Chi Minh City", "Đền tưởng niệm các Vua Hùng Thành phố Hồ Chí Minh"],
    },
    "nha-tho-tan-dinh": {
        "vi": "Nhà thờ Tân Định",
        "en": "Tân Định Church",
        "commons": ["Tan Dinh Church", "Nhà thờ Tân Định"],
    },
    "pho-di-bo-nguyen-hue-chung-cu-42": {
        "vi": "Đường Nguyễn Huệ, Thành phố Hồ Chí Minh",
        "en": "Nguyễn Huệ Boulevard",
        "commons": ["Nguyen Hue Walking Street", "42 Nguyen Hue", "Nguyen Hue Street Ho Chi Minh City"],
    },
    "ben-bach-dang-cau-ba-son": {
        "vi": "Bến Bạch Đằng",
        "en": "Bạch Đằng Quay",
        "commons": ["Bach Dang Wharf", "Ba Son Bridge", "Cau Ba Son"],
    },
    "cot-co-thu-ngu": {
        "vi": "Cột cờ Thủ Ngữ",
        "en": "Thủ Ngữ Flagpole",
        "commons": ["Thu Ngu Flagpole", "Cột cờ Thủ Ngữ"],
    },
    "cau-mong-sai-gon": {
        "vi": "Cầu Mống",
        "en": "Mống Bridge",
        "commons": ["Mong Bridge Ho Chi Minh City", "Cầu Mống"],
    },
    "ho-con-rua-cong-truong-quoc-te": {
        "vi": "Công trường Quốc tế",
        "en": "Turtle Lake, Ho Chi Minh City",
        "commons": ["Turtle Lake Ho Chi Minh City", "Hồ Con Rùa"],
    },
    "thap-bitexco-saigon-skydeck": {
        "vi": "Bitexco Financial Tower",
        "en": "Bitexco Financial Tower",
        "commons": ["Bitexco Financial Tower"],
    },
    "landmark-81-central-park": {
        "vi": "Landmark 81",
        "en": "Landmark 81",
        "commons": ["Landmark 81", "Vinhomes Central Park"],
    },
    "cau-anh-sao-ho-ban-nguyet": {
        "vi": "Khu đô thị Phú Mỹ Hưng",
        "en": "Phú Mỹ Hưng urban area",
        "commons": ["Starlight Bridge Ho Chi Minh City", "Cầu Ánh Sao", "Crescent Lake Phu My Hung"],
    },
    "den-hindu-mariamman": {
        "vi": "Đền Bà Ấn (Thành phố Hồ Chí Minh)",
        "en": "Mariamman Temple, Ho Chi Minh City",
        "commons": ["Mariamman Temple Ho Chi Minh City"],
    },
    "thanh-duong-hoi-giao-saigon": {
        "vi": "Thánh đường Hồi giáo Trung tâm Sài Gòn",
        "en": "Saigon Central Mosque",
        "commons": ["Saigon Central Mosque", "Jamia Al-Musulman Mosque"],
    },
    "nha-tho-huyen-sy": {
        "vi": "Nhà thờ Huyện Sỹ",
        "en": "Huyện Sỹ Church",
        "commons": ["Huyen Sy Church", "Nhà thờ Huyện Sỹ"],
    },
    "bao-tang-ton-duc-thang": {
        "vi": "Bảo tàng Tôn Đức Thắng",
        "en": "Tôn Đức Thắng Museum",
        "commons": ["Ton Duc Thang Museum", "Bảo tàng Tôn Đức Thắng"],
    },
    "bao-tang-phu-nu-nam-bo": {
        "vi": "Bảo tàng Phụ nữ Nam Bộ",
        "en": "Southern Women's Museum",
        "commons": ["Bao tang Phu nu Nam Bo", "Southern Women's Museum Ho Chi Minh City"],
    },
    "bao-tang-biet-dong-sai-gon-145": {
        "vi": "Bảo tàng Biệt động Sài Gòn",
        "en": "Saigon Commando Museum",
        "commons": ["Tran Quang Khai Ho Chi Minh City", "Saigon museum interior", "Heritage Saigon architecture"],
    },
    "hoi-quan-nghia-an-chua-ong": {
        "vi": "Hội quán Nghĩa An",
        "en": "Nghĩa An Assembly Hall",
        "commons": ["Nghia An Assembly Hall", "Quan Am Nghia An Ho Chi Minh City"],
    },
    "hoi-quan-on-lang-chua-quan-am": {
        "vi": "Hội quán Ôn Lăng",
        "en": "Quan Âm Pagoda, Ho Chi Minh City",
        "commons": ["Quan Am Pagoda Ho Chi Minh City", "On Lang Assembly Hall"],
    },
    "chua-van-phat-quan-5": {
        "vi": "Chùa Vạn Phật",
        "en": "Vạn Phật Pagoda",
        "commons": ["Van Phat Pagoda Ho Chi Minh City", "Chùa Vạn Phật"],
    },
    "nha-tho-cho-quan": {
        "vi": "Nhà thờ Chợ Quán",
        "en": "Chợ Quán Church",
        "commons": ["Cho Quan Church", "Nhà thờ Chợ Quán"],
    },
    "lang-du-lich-binh-quoi": {
        "vi": "Bình Quới – Thanh Đa",
        "en": "Bình Quới Village",
        "commons": ["Binh Quoi Village", "Binh Quoi Tourist Village", "Thanh Da peninsula"],
    },
    "hem-hao-si-phuong-cho-lon": {
        "vi": "Chợ Lớn",
        "en": "Chợ Lớn",
        "commons": ["Hao Si Phuong", "Cho Lon Ho Chi Minh City", "Tran Hung Dao District 5"],
    },
    "cho-binh-tay-cho-lon": {
        "vi": "Chợ Bình Tây",
        "en": "Bình Tây Market",
        "commons": ["Binh Tay Market", "Chợ Bình Tây"],
    },
    "bao-tang-y-hoc-co-truyen-fito": {
        "vi": "Bảo tàng Y học cổ truyền Việt Nam",
        "en": "Museum of Traditional Vietnamese Medicine",
        "commons": ["FITO Museum Ho Chi Minh", "Vietnamese traditional medicine Ho Chi Minh"],
    },
    "cho-hoa-pho-am-thuc-ho-thi-ky": {
        "vi": "Chợ hoa Hồ Thị Kỷ",
        "en": "Hồ Thị Kỷ Flower Market",
        "commons": ["Ho Thi Ky Flower Market", "Chợ hoa Hồ Thị Kỷ", "Ho Thi Ky Street"],
    },
    "pho-di-bo-bui-vien": {
        "vi": "Phố Tây Bùi Viện",
        "en": "Phạm Ngũ Lão, District 1",
        "commons": ["Bui Vien Street", "Bui Vien Walking Street"],
    },
    "cong-vien-bo-song-sai-gon-thu-thiem": {
        "vi": "Thủ Thiêm",
        "en": "Thủ Thiêm",
        "commons": ["Thu Thiem Ho Chi Minh City", "Saigon River Thu Thiem", "Ba Son Bridge skyline"],
    },
    "chua-buu-long-thu-duc": {
        "vi": "Chùa Bửu Long",
        "en": "Bửu Long Pagoda",
        "commons": ["Chua Buu Long", "Buu Long Pagoda", "District 9 Ho Chi Minh City pagoda"],
    },
    "bao-tang-ao-dai-thu-duc": {
        "vi": "Áo dài",
        "en": "Áo dài",
        "commons": ["Ao Dai Museum", "Vietnamese Ao Dai", "Long Phuoc Ho Chi Minh"],
    },
    "bao-tang-nghe-thuat-quang-san": {
        "vi": "Thảo Điền",
        "en": "Thảo Điền",
        "commons": ["Thao Dien Ho Chi Minh City", "Saigon River District 2", "Ho Chi Minh City art gallery"],
    },
    "tu-vien-khanh-an-quan-12": {
        "vi": "Tu viện Khánh An",
        "en": "District 12, Ho Chi Minh City",
        "commons": ["Tu vien Khanh An", "District 12 Ho Chi Minh City", "Pagoda Ho Chi Minh City"],
    },
    # Binh Duong (Merged HCMC)
    "chua-hoi-khanh-thu-dau-mot": {
        "vi": "Chùa Hội Khánh",
        "en": "Hội Khánh Temple",
        "commons": ["Hoi Khanh Pagoda Binh Duong", "Reclining Buddha Hoi Khanh Temple"],
    },
    "chua-ba-thien-hau-thu-dau-mot": {
        "vi": "Miếu Bà Thiên Hậu (Thủ Dầu Một)",
        "en": "Thủ Dầu Một",
        "commons": ["Chùa Bà Bình Dương", "Miếu Bà Thiên Hậu Thủ Dầu Một"],
    },
    "nha-tu-phu-loi-thu-dau-mot": {
        "vi": "Nhà tù Phú Lợi",
        "en": "Phú Lợi prison",
        "commons": ["Nha tu Phu Loi", "Nhà tù Phú Lợi"],
    },
    "khu-du-lich-dai-nam-binh-duong": {
        "vi": "Khu du lịch Đại Nam",
        "en": "Đại Nam Văn Hiến",
        "commons": ["Dai Nam Van Hien", "Khu Du lịch Đại Nam"],
    },
    "nha-co-tran-van-ho-thu-dau-mot": {
        "vi": "Thủ Dầu Một",
        "en": "Thủ Dầu Một",
        "commons": ["Nhà cổ Đốc phủ Đẩu", "Chợ Thủ Dầu Một"],
    },
    "lang-gom-lai-thieu-thuan-an": {
        "vi": "Lái Thiêu",
        "en": "Lái Thiêu",
        "commons": ["Lái Thiêu Thuận An", "Chợ Lái Thiêu"],
    },
    "chua-chau-thoi-di-an": {
        "vi": "Chùa Châu Thới",
        "en": "Dĩ An",
        "commons": ["Núi Châu Thới", "Chùa Châu Thới"],
    },
    "dia-dao-tam-giac-sat-ben-cat": {
        "vi": "Địa đạo Tây Nam Bến Cát",
        "en": "Bến Cát",
        "commons": ["Bến Cát Bình Dương", "Bình Dương"],
    },
    # Ba Ria - Vung Tau & Con Dao (Merged HCMC)
    "tuong-chua-kito-vua-vung-tau": {
        "vi": "Tượng Chúa Kitô Vua (Vũng Tàu)",
        "en": "Christ of Vũng Tàu",
        "commons": ["Christ of Vung Tau", "Statue of Jesus in Vung Tau"],
    },
    "bach-dinh-vung-tau": {
        "vi": "Bạch Dinh",
        "en": "Bạch Dinh",
        "commons": ["Vung Tau Bach Dinh", "Villa Blanche Vung Tau"],
    },
    "hai-dang-vung-tau": {
        "vi": "Hải đăng Vũng Tàu",
        "en": "Vũng Tàu Lighthouse",
        "commons": ["Vung Tau lighthouse", "Hải đăng Vũng Tàu"],
    },
    "thich-ca-phat-dai-vung-tau": {
        "vi": "Thích Ca Phật Đài",
        "en": "Vũng Tàu",
        "commons": ["Thích Ca Phật Đài", "Chùa Thiền Lâm Tự Vũng Tàu"],
    },
    "mieu-hon-ba-vung-tau": {
        "vi": "Hòn Bà (Vũng Tàu)",
        "en": "Vũng Tàu",
        "commons": ["Vung Tau Hon Ba", "Mũi Nghinh Phong"],
    },
    "dinh-than-thang-tam-vung-tau": {
        "vi": "Đình Thắng Tam",
        "en": "Vũng Tàu",
        "commons": ["Đình Thắng Tam", "Lăng Ông Nam Hải Vũng Tàu"],
    },
    "linh-son-co-tu-vung-tau": {
        "vi": "Linh Sơn Cổ Tự",
        "en": "Vũng Tàu",
        "commons": ["Linh Sơn Cổ Tự Vũng Tàu", "Vung Tau pagoda"],
    },
    "niet-ban-tinh-xa-vung-tau": {
        "vi": "Niết Bàn Tịnh Xá",
        "en": "Vũng Tàu",
        "commons": ["Vung Tau Niet Ban Tinh Xa"],
    },
    "bao-tang-vu-khi-co-robert-taylor": {
        "vi": "Bảo tàng Vũ khí cổ Robert Taylor",
        "en": "Worldwide Arms Museum",
        "commons": ["Worldwide Arms Museum Vung Tau", "Ba Ria Vung Tau museum"],
    },
    "mui-nghinh-phong-cong-troi": {
        "vi": "Mũi Nghinh Phong",
        "en": "Vũng Tàu",
        "commons": ["Mũi Nghinh Phong", "Vung Tau Hon Ba"],
    },
    "ho-may-park-nui-lon-vung-tau": {
        "vi": "Núi Lớn",
        "en": "Vũng Tàu",
        "commons": ["Cáp treo Vũng Tàu", "Hồ Mây Vũng Tàu"],
    },
    "bao-tang-ba-ria-vung-tau": {
        "vi": "Bãi Trước",
        "en": "Bà Rịa–Vũng Tàu province",
        "commons": ["Ba Ria - Vung Tau museum", "Bai Truoc Vung Tau"],
    },
    "nha-lon-long-son-den-ong-tran": {
        "vi": "Nhà Lớn Long Sơn",
        "en": "Long Sơn Island",
        "commons": ["Nhà Lớn Long Sơn", "Long Son Vung Tau"],
    },
    "thap-tam-thang-quang-truong-bai-sau": {
        "vi": "Tháp Tam Thắng",
        "en": "Vũng Tàu",
        "commons": ["Tháp Tam Thắng", "Sau Beach in Vungtau"],
    },
    "doi-con-heo-vung-tau": {
        "vi": "Núi Nhỏ",
        "en": "Vũng Tàu",
        "commons": ["Bờ biển Vũng Tàu", "Sau Beach in Vungtau"],
    },
    "bai-sau-thuy-van-vung-tau": {
        "vi": "Bãi Sau",
        "en": "Vũng Tàu",
        "commons": ["Sau Beach in Vungtau", "Bãi biển Vũng Tàu"],
    },
    "cong-vien-bai-truoc-vung-tau": {
        "vi": "Bãi Trước",
        "en": "Vũng Tàu",
        "commons": ["Bai Truoc Vung Tau", "Công Viên Bãi Trước"],
    },
    "bai-dua-lang-du-vung-tau": {
        "vi": "Bãi Dứa",
        "en": "Vũng Tàu",
        "commons": ["Ha Long Road in Vungtau", "Vung Tau Niet Ban Tinh Xa"],
    },
    "hem-107-tran-phu-vung-tau": {
        "vi": "Vũng Tàu",
        "en": "Vũng Tàu",
        "commons": ["Trần Phú Vũng Tàu", "Bai Truoc Vung Tau"],
    },
    "den-thanh-duc-me-bai-dau": {
        "vi": "Đền Thánh Đức Mẹ Bãi Dâu",
        "en": "Vũng Tàu",
        "commons": ["Đức Mẹ Bãi Dâu"],
    },
    "cho-hai-san-xom-luoi-vung-tau": {
        "vi": "Vũng Tàu",
        "en": "Vũng Tàu",
        "commons": ["Vung Tau Beach", "Bai Truoc Vung Tau"],
    },
    "ben-du-thuyen-vung-tau-marina": {
        "vi": "Sông Dinh (Bà Rịa – Vũng Tàu)",
        "en": "Vũng Tàu",
        "commons": ["Vung Tau harbour", "Long Son Vung Tau"],
    },
    "nha-tron-ba-ria": {
        "vi": "Nhà Tròn Bà Rịa",
        "en": "Bà Rịa",
        "commons": ["Nhà tròn Bà Rịa"],
    },
    "dia-dao-long-phuoc-ba-ria": {
        "vi": "Địa đạo Long Phước",
        "en": "Bà Rịa",
        "commons": ["Long Hai hills", "Núi Dinh Bà Rịa"],
    },
    "can-cu-minh-dam-long-hai": {
        "vi": "Căn cứ Minh Đạm",
        "en": "Long Hải",
        "commons": ["Long Hai hills", "Bãi biển Long Hải"],
    },
    "nha-luu-niem-vo-thi-sau-dat-do": {
        "vi": "Võ Thị Sáu",
        "en": "Võ Thị Sáu",
        "commons": ["Vo Thi Sau memorial", "Mộ Võ Thị Sáu"],
    },
    "nui-dinh-chua-hang-phu-my": {
        "vi": "Núi Dinh",
        "en": "Phú Mỹ, Bà Rịa–Vũng Tàu",
        "commons": ["Suối Đá núi Dinh Bà Rịa", "Núi Dinh Bà Rịa"],
    },
    "ho-da-xanh-phu-my": {
        "vi": "Núi Dinh",
        "en": "Phú Mỹ, Bà Rịa–Vũng Tàu",
        "commons": ["Suối Đá 5 hồ núi Dinh", "Suối Đá núi Dinh Bà Rịa"],
    },
    "doi-cuu-suoi-nghe-chau-duc": {
        "vi": "Suối Nghệ",
        "en": "Châu Đức district",
        "commons": ["Phước Bửu Xuyên Mộc", "Núi Dinh Bà Rịa"],
    },
    "dinh-co-long-hai": {
        "vi": "Dinh Cô",
        "en": "Long Hải",
        "commons": ["Dinh Cô", "Bãi biển Long Hải"],
    },
    "deo-nuoc-ngot-phuoc-hai": {
        "vi": "Phước Hải (thị trấn)",
        "en": "Long Hải",
        "commons": ["Biển Long Hải", "Long Hải Bà Rịa"],
    },
    "ben-tau-khong-so-loc-an": {
        "vi": "Đường Hồ Chí Minh trên biển",
        "en": "Xuyên Mộc district",
        "commons": ["Ho Tram Beach", "Biển ở Hồ Cóc"],
    },
    "bien-ho-tram-hamptons-pier": {
        "vi": "Hồ Tràm",
        "en": "Hồ Tràm",
        "commons": ["Ho Tram Beach", "The Grand Ho Tram Strip"],
    },
    "bien-ho-coc-xuyen-moc": {
        "vi": "Hồ Cốc",
        "en": "Hồ Cốc",
        "commons": ["Biển ở Hồ Cóc", "Ho coc beach"],
    },
    "suoi-khoang-nong-binh-chau": {
        "vi": "Khu bảo tồn thiên nhiên Bình Châu – Phước Bửu",
        "en": "Bình Châu-Phước Bửu Nature Reserve",
        "commons": ["Phước Bửu Xuyên Mộc", "Bình Châu"],
    },
    "nha-tu-con-dao": {
        "vi": "Nhà tù Côn Đảo",
        "en": "Côn Đảo Prison",
        "commons": ["Nhà tù Côn Đảo", "Con Dao prison"],
    },
    "nghia-trang-hang-duong-con-dao": {
        "vi": "Nghĩa trang Hàng Dương",
        "en": "Hàng Dương Cemetery",
        "commons": ["Mộ Võ Thị Sáu", "Nhà tù Côn Đảo"],
    },
    "chua-nui-mot-van-son-tu-con-dao": {
        "vi": "Vân Sơn Tự",
        "en": "Côn Đảo",
        "commons": ["Chùa Vân Sơn ở Côn Đảo", "An Sơn Miếu ở Côn Đảo"],
    },
    "bai-dam-trau-vuon-quoc-gia-con-dao": {
        "vi": "Vườn quốc gia Côn Đảo",
        "en": "Côn Đảo National Park",
        "commons": ["ConDao park dam", "Six Senses Côn Đảo"],
    },
}

BAD_IMAGE_PATTERNS = (
    ".svg",
    ".tif",
    ".tiff",
    ".pdf",
    ".ogv",
    ".webm",
    ".gif",
    "logo",
    "icon",
    "map",
    "locator",
    "flag_of",
    "coat_of_arms",
    "emblem",
    "seal",
    "diagram",
    "plan_",
    "blank",
    "stub",
    "commons-logo",
    "wiki",
    "portrait",
    "signature",
    "stamp",
    "banknote",
    "coin",
    "symbol",
    "pano_icon",
    "ambox",
    "crystal_",
    "nuvola",
    "question_book",
    "padlock",
)


def http_get_json(url: str, timeout: int = 15) -> dict[str, Any]:
    last_err: Exception | None = None
    for attempt in range(4):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as exc:
            last_err = exc
            if "429" in str(exc) or "503" in str(exc):
                time.sleep(1.2 * (attempt + 1))
                continue
            break
    if last_err:
        raise last_err
    return {}


def is_good_photo_file(title: str, width: int, height: int, mime: str) -> bool:
    lower = title.lower()
    if not (mime.startswith("image/jpeg") or mime.startswith("image/png") or mime.startswith("image/webp")):
        return False
    if any(bad in lower for bad in BAD_IMAGE_PATTERNS):
        return False
    if width < 500 or height < 320:
        return False
    ratio = width / max(height, 1)
    if ratio < 0.55 or ratio > 2.8:
        return False
    return True


def clean_wiki_extract(text: str, max_paragraphs: int = 2, max_chars: int = 750) -> list[str]:
    if not text:
        return []
    # Remove heading markers and citation artifacts
    cleaned = re.sub(r"==+[^=]+==+", "\n", text)
    cleaned = re.sub(r"\[\d+\]", "", cleaned)
    raw_paras = [re.sub(r"\s+", " ", p).strip() for p in cleaned.split("\n")]
    good: list[str] = []
    total_len = 0
    for p in raw_paras:
        if len(p) < 65:
            continue
        if p.lower().startswith(("xem thêm", "tham khảo", "liên kết ngoài", "chú thích", "see also", "references")):
            break
        if total_len + len(p) > max_chars and good:
            break
        if len(p) > 460:
            # Trim at sentence boundary
            cut = p[:460]
            last_dot = max(cut.rfind(". "), cut.rfind("。"))
            p = cut[: last_dot + 1].strip() if last_dot > 180 else cut.strip() + "…"
        good.append(p)
        total_len += len(p)
        if len(good) >= max_paragraphs:
            break
    return good


def fetch_wikipedia_page(lang: str, title: str) -> dict[str, Any]:
    """Fetch extract, full URL, main pageimage, and article image titles from Wikipedia."""
    if not title:
        return {}
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "redirects": "1",
            "titles": title,
            "prop": "extracts|pageimages|info|images",
            "explaintext": "1",
            "exchars": "1800",
            "piprop": "thumbnail|name",
            "pithumbsize": "1200",
            "inprop": "url",
            "imlimit": "15",
        }
    )
    url = f"https://{lang}.wikipedia.org/w/api.php?{params}"
    try:
        data = http_get_json(url)
    except Exception:
        return {}

    pages = data.get("query", {}).get("pages", {})
    for pid, page in pages.items():
        if str(pid) == "-1" or page.get("missing") is not None:
            return {}
        thumb = page.get("thumbnail", {})
        img_titles = [
            im["title"]
            for im in page.get("images", [])
            if isinstance(im, dict) and im.get("title")
        ]
        return {
            "title": page.get("title", title),
            "url": page.get("fullurl", ""),
            "extract": page.get("extract", ""),
            "mainImageUrl": thumb.get("source", ""),
            "mainImageWidth": thumb.get("width", 0),
            "mainImageHeight": thumb.get("height", 0),
            "mainImageName": page.get("pageimage", ""),
            "imageTitles": img_titles,
        }
    return {}


def resolve_commons_images_by_titles(titles: list[str], lang_api: str = "commons.wikimedia.org") -> list[dict[str, Any]]:
    """Resolve File:... titles into verified 1200px thumbnail URLs + dimensions."""
    filtered = [
        t for t in titles
        if not any(bad in t.lower() for bad in BAD_IMAGE_PATTERNS)
        and any(t.lower().endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp"))
    ][:10]
    if not filtered:
        return []
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "titles": "|".join(filtered),
            "prop": "imageinfo",
            "iiprop": "url|size|mime",
            "iiurlwidth": "1200",
        }
    )
    url = f"https://{lang_api}/w/api.php?{params}"
    try:
        data = http_get_json(url)
    except Exception:
        return []

    out: list[dict[str, Any]] = []
    for _pid, page in data.get("query", {}).get("pages", {}).items():
        title = page.get("title", "")
        infos = page.get("imageinfo") or []
        if not infos:
            continue
        info = infos[0]
        w = int(info.get("width") or 0)
        h = int(info.get("height") or 0)
        mime = str(info.get("mime") or "")
        thumb_url = info.get("thumburl") or info.get("url") or ""
        if thumb_url and is_good_photo_file(title, w, h, mime):
            out.append(
                {
                    "title": title,
                    "url": thumb_url,
                    "width": w,
                    "height": h,
                }
            )
    return out


def search_commons_photos(query: str, limit: int = 8) -> list[dict[str, Any]]:
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrnamespace": "6",
            "gsrsearch": f"{query} filetype:bitmap",
            "gsrlimit": str(limit),
            "prop": "imageinfo",
            "iiprop": "url|size|mime",
            "iiurlwidth": "1200",
        }
    )
    url = f"https://commons.wikimedia.org/w/api.php?{params}"
    try:
        data = http_get_json(url)
    except Exception:
        return []

    out: list[dict[str, Any]] = []
    pages = data.get("query", {}).get("pages", {})
    # Preserve search ranking by index
    ordered = sorted(pages.values(), key=lambda p: p.get("index", 999))
    for page in ordered:
        title = page.get("title", "")
        infos = page.get("imageinfo") or []
        if not infos:
            continue
        info = infos[0]
        w = int(info.get("width") or 0)
        h = int(info.get("height") or 0)
        mime = str(info.get("mime") or "")
        thumb_url = info.get("thumburl") or info.get("url") or ""
        if thumb_url and is_good_photo_file(title, w, h, mime):
            out.append(
                {
                    "title": title,
                    "url": thumb_url,
                    "width": w,
                    "height": h,
                }
            )
    return out


def fetch_site_wikipedia_bundle(site: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    sid = site["id"]
    cfg = WIKI_MAPPING.get(sid, {})
    vi_title = cfg.get("vi", "")
    en_title = cfg.get("en", "")
    commons_queries = cfg.get("commons", [])

    vi_page = fetch_wikipedia_page("vi", vi_title)
    en_page = fetch_wikipedia_page("en", en_title)

    # Collect candidate real photos in priority order:
    # 1. Main pageimage from vi.wiki & en.wiki
    # 2. Article images from en.wiki & vi.wiki
    # 3. Direct Wikimedia Commons search queries
    candidates: list[dict[str, Any]] = []
    seen_urls: set[str] = set()

    def add_candidate(item: dict[str, Any]) -> None:
        u = item.get("url", "")
        if not u or u in seen_urls:
            return
        # Deduplicate by base filename in URL
        seen_urls.add(u)
        candidates.append(item)

    for page, lang_code in ((en_page, "en"), (vi_page, "vi")):
        main_url = page.get("mainImageUrl", "")
        main_name = page.get("mainImageName", "")
        mw = int(page.get("mainImageWidth") or 0)
        mh = int(page.get("mainImageHeight") or 0)
        if main_url and main_name and is_good_photo_file(main_name, max(mw, 800), max(mh, 500), "image/jpeg"):
            add_candidate({"title": f"File:{main_name}", "url": main_url, "width": mw, "height": mh})

    # Resolve article images if we need more
    if len(candidates) < 3 and en_page.get("imageTitles"):
        for img in resolve_commons_images_by_titles(en_page["imageTitles"], "en.wikipedia.org"):
            add_candidate(img)
    if len(candidates) < 3 and vi_page.get("imageTitles"):
        for img in resolve_commons_images_by_titles(vi_page["imageTitles"], "vi.wikipedia.org"):
            add_candidate(img)

    # Search Wikimedia Commons until we have at least 3 high-quality real photos
    for q in commons_queries:
        if len(candidates) >= 4:
            break
        for img in search_commons_photos(q, limit=6):
            add_candidate(img)

    # Final fallback: search Commons using English name
    if len(candidates) < 2:
        en_name = site["translations"]["en"]["name"]
        for img in search_commons_photos(f"{en_name} Ho Chi Minh City", limit=6):
            add_candidate(img)

    vi_paras = clean_wiki_extract(vi_page.get("extract", ""), max_paragraphs=2, max_chars=780)
    en_paras = clean_wiki_extract(en_page.get("extract", ""), max_paragraphs=2, max_chars=720)

    return sid, {
        "wikiUrlVi": vi_page.get("url", ""),
        "wikiUrlEn": en_page.get("url", ""),
        "wikiTitleVi": vi_page.get("title", ""),
        "wikiTitleEn": en_page.get("title", ""),
        "viParas": vi_paras,
        "enParas": en_paras,
        "photos": candidates[:4],
    }


def make_photo_caption(site: dict[str, Any], photo_idx: int, raw_title: str) -> dict[str, str]:
    vi_name = site["translations"]["vi"]["name"]
    en_name = site["translations"]["en"]["name"]
    fr_name = site["translations"]["fr"]["name"]
    zh_name = site["translations"]["zh"]["name"]
    ja_name = site["translations"]["ja"]["name"]

    if photo_idx == 0:
        return {
            "vi": f"Ảnh thực tế toàn cảnh {vi_name} (Wikimedia Commons)",
            "en": f"Real view of {en_name} (Wikimedia Commons)",
            "fr": f"Vue réelle de {fr_name} (Wikimedia Commons)",
            "zh": f"{zh_name}实景照片（维基共享资源）",
            "ja": f"{ja_name}の実景写真（ウィキメディア・コモンズ）",
        }
    return {
        "vi": f"Góc nhìn kiến trúc & không gian tại {vi_name} (Ảnh {photo_idx + 1})",
        "en": f"Architecture & atmosphere at {en_name} (Photo {photo_idx + 1})",
        "fr": f"Architecture et ambiance à {fr_name} (Photo {photo_idx + 1})",
        "zh": f"{zh_name}建筑与实景细节（图 {photo_idx + 1}）",
        "ja": f"{ja_name}の建築と風景（写真 {photo_idx + 1}）",
    }


def main() -> None:
    from scripts.seed_supabase import SEED_SITES_DATA

    print(f"🌐 Đang truy vấn Wikipedia (VI/EN) & Wikimedia Commons cho {len(SEED_SITES_DATA)} địa điểm TP.HCM...")
    t0 = time.time()
    fetched: dict[str, dict[str, Any]] = {}

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(fetch_site_wikipedia_bundle, site) for site in SEED_SITES_DATA]
        for fut in as_completed(futures):
            sid, result = fut.result()
            fetched[sid] = result
            time.sleep(0.12)

    # Deduplicate coverImage across all 50 sites so every site gets a distinct real photo
    used_covers: set[str] = set()
    enrichment_map: dict[str, dict[str, Any]] = {}
    enriched_seed_sites: list[dict[str, Any]] = []

    sites_with_real_photos = 0
    total_real_photos = 0
    sites_with_wiki_text = 0
    missing_photos: list[str] = []

    for site in SEED_SITES_DATA:
        sid = site["id"]
        bundle = fetched.get(sid, {})
        photos = bundle.get("photos", [])

        # Pick first unused photo as coverImage if possible
        chosen_cover = ""
        ordered_photos = list(photos)
        for idx, p in enumerate(ordered_photos):
            if p["url"] not in used_covers:
                chosen_cover = p["url"]
                # Move chosen cover to front
                if idx != 0:
                    ordered_photos.insert(0, ordered_photos.pop(idx))
                break
        if not chosen_cover and ordered_photos:
            chosen_cover = ordered_photos[0]["url"]

        if chosen_cover:
            used_covers.add(chosen_cover)
            sites_with_real_photos += 1
        else:
            missing_photos.append(sid)

        gallery_items: list[dict[str, Any]] = []
        for idx, p in enumerate(ordered_photos[:3]):
            short_id = re.sub(r"[^a-z0-9]", "", sid)[:12]
            gallery_items.append(
                {
                    "id": f"wk-{short_id}-{idx + 1}",
                    "type": "image",
                    "url": p["url"],
                    "caption": make_photo_caption(site, idx, p["title"]),
                    "yearOrSource": "Wikipedia · Wikimedia Commons",
                }
            )
        total_real_photos += len(gallery_items)

        vi_paras = bundle.get("viParas", [])
        en_paras = bundle.get("enParas", [])
        if vi_paras or en_paras:
            sites_with_wiki_text += 1

        # Build enriched site copy for seed_supabase.py
        site_copy = json.loads(json.dumps(site))
        entry: dict[str, Any] = {}

        if chosen_cover:
            site_copy["coverImage"] = chosen_cover
            entry["coverImage"] = chosen_cover
        if gallery_items:
            site_copy["mediaGallery"] = gallery_items
            entry["mediaGallery"] = gallery_items

        wiki_url_vi = bundle.get("wikiUrlVi", "")
        wiki_url_en = bundle.get("wikiUrlEn", "")
        if wiki_url_vi or wiki_url_en:
            entry["wikipediaUrl"] = wiki_url_vi or wiki_url_en

        # Enrich VI audioScript (append concise verified Wikipedia detail if not already present)
        if vi_paras:
            entry["viWikiSummary"] = vi_paras[0]
            entry["viWikiParagraphs"] = vi_paras
            cur_vi_script = list(site_copy["translations"]["vi"].get("audioScript", []))
            wiki_note = f"Theo tư liệu bách khoa Wikipedia: {vi_paras[0]}"
            if len(vi_paras) > 1 and len(wiki_note) < 420:
                wiki_note = f"{wiki_note} {vi_paras[1]}"
            if not any("Wikipedia" in s for s in cur_vi_script):
                cur_vi_script.append(wiki_note)
            site_copy["translations"]["vi"]["audioScript"] = cur_vi_script

        if en_paras:
            entry["enWikiSummary"] = en_paras[0]
            entry["enWikiParagraphs"] = en_paras
            cur_en_script = list(site_copy["translations"]["en"].get("audioScript", []))
            wiki_note_en = f"Historical context from Wikipedia: {en_paras[0]}"
            if not any("Wikipedia" in s for s in cur_en_script):
                cur_en_script.append(wiki_note_en)
            site_copy["translations"]["en"]["audioScript"] = cur_en_script

        enrichment_map[sid] = entry
        enriched_seed_sites.append(site_copy)

    # 1. Write mobile/src/data/wikipediaEnrichment.ts
    synced_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    ts_body = json.dumps(enrichment_map, ensure_ascii=False, indent=2)
    ts_content = f"""/**
 * Ảnh thực tế (Wikimedia Commons) & tư liệu chi tiết từ Wikipedia (VI/EN)
 * cho toàn bộ {len(SEED_SITES_DATA)} di tích & điểm tham quan TP. Hồ Chí Minh.
 *
 * - Synced at: {synced_at}
 * - Ảnh thực tế: {total_real_photos} ảnh phủ {sites_with_real_photos}/{len(SEED_SITES_DATA)} địa điểm
 * - Tư liệu Wikipedia: {sites_with_wiki_text}/{len(SEED_SITES_DATA)} địa điểm
 *
 * Cập nhật lại bằng lệnh: `cd backend && python -m scripts.sync_wikipedia_data`
 */

import {{ DocumentaryMedia }} from '../types/heritage';

export interface WikipediaSiteEnrichment {{
  coverImage?: string;
  mediaGallery?: DocumentaryMedia[];
  wikipediaUrl?: string;
  viWikiSummary?: string;
  viWikiParagraphs?: string[];
  enWikiSummary?: string;
  enWikiParagraphs?: string[];
}}

export const WIKIPEDIA_ENRICHMENT_SYNCED_AT = '{synced_at}';

export const WIKIPEDIA_ENRICHMENT_BY_SITE: Record<string, WikipediaSiteEnrichment> = {ts_body};
"""
    OUTPUT_TS_PATH.write_text(ts_content, encoding="utf-8")

    # 2. Update backend/scripts/seed_supabase.py SEED_SITES_DATA directly
    seed_src = SEED_PY_PATH.read_text(encoding="utf-8")
    eol = "\r\n" if "\r\n" in seed_src else "\n"
    src_lf = seed_src.replace("\r\n", "\n")
    start_marker = 'SEED_SITES_DATA: list[dict[str, Any]] = json.loads(\n    r"""'
    end_marker = '"""\n)'
    start_idx = src_lf.index(start_marker)
    json_start = start_idx + len(start_marker)
    end_idx = src_lf.index(end_marker, json_start)
    new_json_str = json.dumps(enriched_seed_sites, ensure_ascii=False, indent=2)
    assert '"""' not in new_json_str, "Unexpected triple quote in enriched JSON!"
    updated_lf = src_lf[:json_start] + new_json_str + src_lf[end_idx:]
    SEED_PY_PATH.write_text(updated_lf.replace("\n", eol), encoding="utf-8")

    elapsed = time.time() - t0
    print(f"✅ Hoàn thành trong {elapsed:.1f}s!")
    print(f"   - Ảnh thật Wikimedia Commons: {total_real_photos} ảnh phủ {sites_with_real_photos}/{len(SEED_SITES_DATA)} địa điểm")
    print(f"   - Tư liệu Wikipedia VI/EN: {sites_with_wiki_text}/{len(SEED_SITES_DATA)} địa điểm")
    if missing_photos:
        print(f"   ⚠️ Chưa có ảnh Commons: {missing_photos}")
    for sid, entry in enrichment_map.items():
        n_img = len(entry.get("mediaGallery", []))
        has_vi = "VI" if entry.get("viWikiParagraphs") else "--"
        has_en = "EN" if entry.get("enWikiParagraphs") else "--"
        print(f"   - {sid}: {n_img} ảnh | Wiki [{has_vi}/{has_en}] | {entry.get('coverImage', '')[:75]}")


if __name__ == "__main__":
    main()
