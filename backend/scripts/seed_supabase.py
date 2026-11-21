"""Idempotent database seeder for Smart Heritage Guide (Supabase Postgres & Local SQLite).

Seeds:
- All 20 Ho Chi Minh City heritage sites & 26 nearby restaurants (extracted from mobile dataset)
- Multilingual RAG knowledge chunks (`vi`, `en`, `fr`, `zh`, `ja`) across summary/script/architecture/restaurant
- 6 automatic achievement badges (`first_step`, `district1_master`, `museum_lover`,
  `heritage_photographer`, `walking_marathon`, `saigon_explorer`)
- Default Admin & Demo Explorer accounts (for instant Swagger & Mobile demo)

Usage:
    python -m scripts.seed_supabase
    python -m scripts.seed_supabase --embeddings
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

# Ensure backend root is on sys.path when invoked directly as `python scripts/seed_supabase.py`
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import AsyncSessionLocal, init_db
from app.core.security import hash_password
from app.models.entities import (
    Badge,
    HeritageKnowledgeChunk,
    HeritageSite,
    Profile,
    Restaurant,
    UserBadge,
    VisitedJourney,
)

# ---------------------------------------------------------------------------
# 6 Achievement Badges Definition
# ---------------------------------------------------------------------------
BADGE_DEFINITIONS: list[dict[str, Any]] = [
    {
        "code": "first_step",
        "title_vi": "Bước Chân Đầu Tiên",
        "title_en": "First Step",
        "description_vi": "Hoàn thành hành trình đi bộ và check-in được xác thực GPS đầu tiên.",
        "icon_name": "footprints",
        "rule_config": {"metric": "verified_sites_count", "threshold": 1},
    },
    {
        "code": "district1_master",
        "title_vi": "Chinh Phục Quận 1",
        "title_en": "District 1 Master",
        "description_vi": "Ghé thăm và check-in ít nhất 3 di tích lịch sử tại Quận 1.",
        "icon_name": "landmark",
        "rule_config": {"metric": "district_sites_count", "district": "Quận 1", "threshold": 3},
    },
    {
        "code": "museum_lover",
        "title_vi": "Người Yêu Bảo Tàng",
        "title_en": "Museum Lover",
        "description_vi": "Khám phá ít nhất 2 bảo tàng lịch sử – văn hóa – mỹ thuật tại TP.HCM.",
        "icon_name": "book-open",
        "rule_config": {"metric": "category_sites_count", "category": "museum", "threshold": 2},
    },
    {
        "code": "heritage_photographer",
        "title_vi": "Nhiếp Ảnh Gia Di Sản",
        "title_en": "Heritage Photographer",
        "description_vi": "Chụp và lưu giữ ít nhất 3 bức ảnh hành trình tại các điểm di tích.",
        "icon_name": "camera",
        "rule_config": {"metric": "photos_count", "threshold": 3},
    },
    {
        "code": "walking_marathon",
        "title_vi": "Bước Chân Bền Bỉ",
        "title_en": "Walking Marathon",
        "description_vi": "Tích lũy tối thiểu 5.000 mét (5 km) đi bộ khám phá được xác thực.",
        "icon_name": "flame",
        "rule_config": {"metric": "verified_walking_meters", "threshold": 5000},
    },
    {
        "code": "saigon_explorer",
        "title_vi": "Nhà Thám Hiểm Sài Gòn",
        "title_en": "Saigon Explorer",
        "description_vi": "Chinh phục ít nhất 5 điểm di sản TP.HCM khác nhau được xác thực GPS.",
        "icon_name": "compass",
        "rule_config": {"metric": "verified_sites_count", "threshold": 5},
    },
]

# ---------------------------------------------------------------------------
# Authentic 20 HCMC Heritage Sites & 26 Nearby Restaurants (Standalone JSON)
# ---------------------------------------------------------------------------
SEED_SITES_DATA: list[dict[str, Any]] = json.loads(
    r"""[
  {
    "id": "dinh-doc-lap",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.777,
    "lng": 106.6953,
    "category": "monument",
    "nationalSpecialMonument": true,
    "rating": 4.9,
    "reviewCount": 14850,
    "ticketPrice": "40.000đ – 65.000đ",
    "address": "135 Nam Kỳ Khởi Nghĩa, Phường Bến Thành, Quận 1, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Di tích Quốc gia Đặc biệt Dinh Độc Lập (Hội trường Thống Nhất)",
        "shortSummary": "Di tích quốc gia đặc biệt gắn liền với thời khắc lịch sử thống nhất đất nước 30/4/1975 và là kiệt tác kiến trúc hiện đại Á Đông của KTS Ngô Viết Thụ.",
        "historicalEra": "1868 – 1966 – 1975",
        "openingHours": "08:00 – 15:30 Hàng ngày",
        "architecturalHighlights": [
          "Mặt tiền rèm hoa đá cách điệu đốt trúc truyền thống phương Đông của KTS Ngô Viết Thụ",
          "Hơn 100 phòng chức năng: Phòng Khánh Tiết, Phòng Nội Các, Phòng Trình Quốc Thư",
          "Hệ thống hầm ngầm chỉ huy tác chiến và thông tin liên lạc kiên cố dưới lòng đất",
          "Hiện vật Bảo vật Quốc gia xe tăng 843 và 390 trong khuôn viên công viên 18ha"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Di tích Quốc gia Đặc biệt Dinh Độc Lập, còn gọi là Hội trường Thống Nhất, tọa lạc tại số 135 Nam Kỳ Khởi Nghĩa, trung tâm Quận 1, Thành phố Hồ Chí Minh.",
          "Tiền thân công trình là Dinh Norodom xây dựng từ năm 1868. Tòa dinh thự hiện nay được khởi công năm 1962 và khánh thành năm 1966 theo đồ án của Kiến trúc sư Ngô Viết Thụ – người châu Á đầu tiên đạt giải Khôi nguyên La Mã.",
          "Kiến trúc Dinh Độc Lập kết hợp hài hòa giữa nghệ thuật hiện đại phương Tây và triết lý phương Đông thông qua bình đồ chữ Cát mang ý nghĩa tốt lành, cùng hệ rèm hoa đá trắng mô phỏng những đốt trúc thanh tao.",
          "Đúng 11 giờ 30 phút ngày 30 tháng 4 năm 1975, nơi đây đã ghi dấu mốc son chói lọi khi xe tăng Quân Giải phóng tiến qua cổng chính, kết thúc chiến tranh và thống nhất non sông Việt Nam."
        ]
      },
      "en": {
        "name": "Independence Palace (Reunification Palace)",
        "shortSummary": "A Special National Historical Monument marking the reunification of Vietnam on April 30, 1975, and a modernist architectural masterpiece by Ngo Viet Thu.",
        "historicalEra": "1868 – 1966 – 1975",
        "openingHours": "08:00 – 15:30 Daily",
        "architecturalHighlights": [
          "Bamboo-inspired stone brise-soleil facade by Prix de Rome architect Ngo Viet Thu",
          "Over 100 preserved state rooms including the Cabinet Room and Banquet Hall",
          "Reinforced underground command bunker and radio communications center",
          "Original historic Tanks 843 and 390 displayed on the front lawn"
        ],
        "audioScript": [
          "Welcome to the Independence Palace, also known as Reunification Hall, a Special National Monument in the heart of District 1, Ho Chi Minh City.",
          "Designed by renowned Vietnamese architect Ngo Viet Thu and completed in 1966 on the site of the former 1868 Norodom Palace, this building is an icon of tropical modernist architecture.",
          "Its layout forms the auspicious Chinese character Cat, meaning good fortune, while the exterior stone screen evokes traditional bamboo segments that filter the tropical sun.",
          "On April 30, 1975, tanks rolled through its main iron gates, marking the end of the Vietnam War and the reunification of the country."
        ]
      },
      "fr": {
        "name": "Palais de la Réunification (Palais de l’Indépendance)",
        "shortSummary": "Monument historique national spécial au cœur de Hô Chi Minh-Ville, chef-d’œuvre moderniste conçu par l’architecte Ngo Viet Thu.",
        "historicalEra": "1868 – 1966 – 1975",
        "openingHours": "08h00 – 15h30 tous les jours",
        "architecturalHighlights": [
          "Façade brise-soleil en pierre inspirée du bambou par Ngo Viet Thu (Prix de Rome)",
          "Salles du Conseil, salle des banquets et bunker souterrain de commandement",
          "Chars historiques 843 et 390 exposés dans les jardins"
        ],
        "audioScript": [
          "Bienvenue au Palais de la Réunification, monument historique majeur situé au cœur du 1er arrondissement de Hô Chi Minh-Ville.",
          "Édifié en 1966 sur l’emplacement de l’ancien Palais Norodom selon les plans de l’architecte Ngo Viet Thu, il allie modernisme occidental et symbolisme oriental.",
          "Le 30 avril 1975, ce lieu est entré dans l’histoire en marquant la fin de la guerre et la réunification du Vietnam."
        ]
      },
      "zh": {
        "name": "胡志明市独立宫（统一宫）",
        "shortSummary": "越南特别国家级历史遗迹，由著名建筑师吴日树设计，见证1975年4月30日越南南北统一的历史性时刻。",
        "historicalEra": "1868 – 1966 – 1975",
        "openingHours": "08:00 – 15:30",
        "architecturalHighlights": [
          "竹节造型现代主义遮阳石幕墙（建筑师吴日树作品）",
          "内阁会议厅、国书呈递厅、宴会厅与地下军事指挥掩体",
          "前庭草坪陈列的843号与390号功勋坦克"
        ],
        "audioScript": [
          "欢迎来到位于胡志明市第一郡中心的特别国家级历史遗迹——独立宫，又称统一会堂。",
          "现在的建筑由曾荣获罗马大奖的越南建筑大师吴日树设计，于1966年落成，平面呈汉字“吉”字形，外立面采用象征东方竹节的石雕百叶窗。",
          "1975年4月30日中午，坦克冲入独立宫正门，标志着战争结束与越南南北正式统一。"
        ]
      },
      "ja": {
        "name": "統一会堂（旧独立宮殿）",
        "shortSummary": "1975年4月30日のベトナム南北統一の歴史的舞台となった特別国家遺跡であり、建築家ゴ・ヴィエット・トゥーの代表作です。",
        "historicalEra": "1868年 – 1966年 – 1975年",
        "openingHours": "08:00 – 15:30",
        "architecturalHighlights": [
          "竹の節をモチーフにした優美な石造りファサード",
          "内閣会議室、大宴会場、地下司令室バンカー",
          "庭園に展示されている歴史的な843号・390号戦車"
        ],
        "audioScript": [
          "ホーチミン市1区の中心に位置する特別国家歴史遺跡、統一会堂へようこそ。",
          "ローマ賞を受賞した建築家ゴ・ヴィエット・トゥーの設計により1966年に完成したこの宮殿は、東洋の伝統思想と近代建築が調和した名建築です。",
          "1975年4月30日、戦車が正門を突破し、ベトナム戦争の終結と南北統一が達成された歴史的瞬間を今に伝えています。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "ddl-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Mặt tiền Dinh Độc Lập nhìn từ trục đại lộ Lê Duẩn rợp bóng cây cổ thụ",
          "en": "Front facade of Independence Palace viewed from Le Duan Boulevard",
          "fr": "Façade principale du Palais de la Réunification depuis le boulevard Le Duan",
          "zh": "从黎笋大道眺望独立宫正立面",
          "ja": "レズアン通りから望む統一会堂の正面全景"
        },
        "yearOrSource": "Hội trường Thống Nhất · Di tích Quốc gia Đặc biệt"
      },
      {
        "id": "ddl-vid-1",
        "type": "video",
        "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "thumbnailUrl": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80",
        "caption": {
          "vi": "Phim tư liệu: Kiến trúc Ngô Viết Thụ & Sự kiện lịch sử 30/4/1975 tại Dinh Độc Lập",
          "en": "Documentary: Architecture of Ngo Viet Thu & April 30, 1975 at Independence Palace",
          "fr": "Documentaire : L’architecture de Ngo Viet Thu et le 30 avril 1975",
          "zh": "纪录片：独立宫建筑艺术与1975年4月30日历史时刻",
          "ja": "ドキュメンタリー：統一会堂の建築美と1975年4月30日の歴史"
        },
        "yearOrSource": "Tư liệu Lịch sử TP.HCM",
        "durationLabel": "03:15"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-ddl-1",
        "name": "Nhà hàng Ngon (Pasteur – Sát công viên 30/4)",
        "cuisine": "Ẩm thực 3 miền & Đặc sản Sài Gòn",
        "specialtyDishes": [
          "Bánh xèo miền Nam giòn rụm",
          "Gỏi cuốn tôm thịt",
          "Bún thịt nướng chả giò"
        ],
        "rating": 4.7,
        "reviewCount": 5640,
        "priceRange": "90.000đ – 220.000đ",
        "lat": 10.7775,
        "lng": 106.6989,
        "address": "160 Pasteur, Phường Bến Nghé, Quận 1, TP.HCM",
        "openHours": "07:00 – 22:30",
        "imageUrl": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      },
      {
        "id": "res-ddl-2",
        "name": "Hum Garden & Vegetarian Dining (Võ Văn Tần)",
        "cuisine": "Ẩm thực Thực dưỡng & Việt Đương đại (Michelin Selected)",
        "specialtyDishes": [
          "Gỏi củ hủ dừa tươi",
          "Cơm gạo lứt hấp lá sen",
          "Canh nấm tiềm thảo mộc"
        ],
        "rating": 4.9,
        "reviewCount": 2890,
        "priceRange": "150.000đ – 320.000đ",
        "lat": 10.7779,
        "lng": 106.6908,
        "address": "32 Võ Văn Tần, Phường Võ Thị Sáu, Quận 3, TP.HCM",
        "openHours": "10:00 – 22:00",
        "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 60
  },
  {
    "id": "nha-tho-duc-ba-sai-gon",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7798,
    "lng": 106.699,
    "category": "monument",
    "rating": 4.8,
    "reviewCount": 18420,
    "ticketPrice": "Miễn phí tham quan khuôn viên",
    "address": "01 Công xã Paris, Phường Bến Nghé, Quận 1, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Nhà thờ Chính tòa Đức Bà Sài Gòn",
        "shortSummary": "Biểu tượng kiến trúc Roman kết hợp Gothic hoàn thành năm 1880 tại trung tâm Công xã Paris với toàn bộ gạch đỏ Marseille nguyên bản nhập từ Pháp.",
        "historicalEra": "1877 – 1880 (KTS J. Bourard)",
        "openingHours": "Khuôn viên mở cửa cả ngày",
        "architecturalHighlights": [
          "Tường gạch trần màu đỏ hồng nhập khẩu từ Marseille (Pháp) không tô trát, không bám rêu",
          "Hai tháp chuông vươn cao 57 mét với bộ 6 chuông đồng âm hưởng trầm hùng",
          "Cửa sổ hoa hồng (Rose Window) và hệ thống kính màu sản xuất tại Chartres",
          "Tượng Đức Mẹ Hòa Bình bằng đá cẩm thạch trắng Carrara (Ý) trước quảng trường"
        ],
        "audioScript": [
          "Quý khách đang đứng tại Quảng trường Công xã Paris, trước Vương cung Thánh đường Chính tòa Đức Bà Sài Gòn – một trong những biểu tượng kiến trúc lâu đời và nổi tiếng nhất của Thành phố Hồ Chí Minh.",
          "Được khởi công ngày 7 tháng 10 năm 1877 và khánh thành vào dịp lễ Phục sinh năm 1880 theo thiết kế của kiến trúc sư J. Bourard, công trình mang phong cách Roman cải biên pha trộn nét thanh thoát của kiến trúc Gothic.",
          "Toàn bộ vật liệu xây dựng từ xi măng, sắt thép cho đến hàng triệu viên gạch đỏ ốp mặt ngoài đều được vận chuyển trực tiếp từ Marseille, Pháp, giữ nguyên sắc đỏ ấm áp suốt hơn 145 năm qua.",
          "Năm 1895, hai tháp chuông nhọn cao hơn 57 mét được xây thêm, bên trong treo sáu quả chuông đồng lớn nặng tổng cộng gần 30 tấn."
        ]
      },
      "en": {
        "name": "Saigon Notre-Dame Cathedral Basilica",
        "shortSummary": "Completed in 1880 with original red terracotta bricks imported from Marseille, standing at the heart of Paris Commune Square.",
        "historicalEra": "1877 – 1880 (Architect J. Bourard)",
        "openingHours": "Exterior square open 24/7",
        "architecturalHighlights": [
          "Unplastered red bricks imported from Marseille that resist moss for over a century",
          "Twin 57-meter bell towers housing six bronze bells weighing nearly 30 tons",
          "Stained-glass rose windows crafted in Chartres, France",
          "Carrara marble statue of Our Lady of Peace in the front square"
        ],
        "audioScript": [
          "Welcome to the Saigon Notre-Dame Cathedral Basilica, standing proudly at the center of Paris Commune Square in District 1.",
          "Constructed between 1877 and 1880 by French architect J. Bourard, the cathedral blends Neo-Romanesque solidity with Gothic verticality.",
          "Every brick on its exterior was shipped from Marseille, France, retaining its warm terracotta hue without plaster or moss for more than a century."
        ]
      },
      "fr": {
        "name": "Cathédrale Notre-Dame de Saïgon",
        "shortSummary": "Chef-d’œuvre néo-roman achevé en 1880 sur la place de la Commune de Paris, bâti en briques rouges de Marseille.",
        "historicalEra": "1877 – 1880 (Architecte J. Bourard)",
        "openingHours": "Parvis accessible toute la journée",
        "architecturalHighlights": [
          "Briques rouges apparentes importées de Marseille",
          "Deux clochers de 57 mètres abritant six cloches de bronze",
          "Vitraux réalisés dans les ateliers de Chartres"
        ],
        "audioScript": [
          "Bienvenue devant la Cathédrale Notre-Dame de Saïgon, joyau architectural érigé entre 1877 et 1880 selon les plans de l’architecte J. Bourard.",
          "Ses briques rouges importées de Marseille et ses deux flèches culminant à 57 mètres en font l’un des monuments les plus emblématiques de la ville."
        ]
      },
      "zh": {
        "name": "西贡圣母大教堂（红教堂）",
        "shortSummary": "1880年落成的罗马与哥特式红砖建筑杰作，全部采用法国马赛进口红砖砌成。",
        "historicalEra": "1877 – 1880年",
        "openingHours": "广场全天开放",
        "architecturalHighlights": [
          "法国马赛进口的百年不长青苔红砖外墙",
          "高达57米的双尖顶钟楼与六口巨型铜钟",
          "广场前方的意大利大理石和平圣母像"
        ],
        "audioScript": [
          "欢迎来到位于巴黎公社广场的西贡圣母大教堂，因其鲜艳的砖红色外墙而被亲切地称为“红教堂”。",
          "教堂建于1877年至1880年间，所有红砖均从法国马赛海运而来，历经百余年风雨依然色泽温润。"
        ]
      },
      "ja": {
        "name": "サイゴン大教会（聖母マリア教会）",
        "shortSummary": "1880年に完成したフランス・マルセイユ産の赤レンガ造りのネオロマネスク様式大聖堂。ホーチミン市の象徴です。",
        "historicalEra": "1877年 – 1880年",
        "openingHours": "広場は終日開放",
        "architecturalHighlights": [
          "マルセイユから運ばれた赤レンガの外벽",
          "高さ57メートルの双塔と6つの青銅の鐘",
          "広場中央に立つ平和の聖母マリア像"
        ],
        "audioScript": [
          "パリ・コミューン広場の中央にそびえるサイゴン大教会へようこそ。",
          "1877年から1880年にかけて建設され、フランス・マルセイユから取り寄せた赤レンガが140年以上経った今も美しい色彩を保っています。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "ntdb-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Quảng trường Công xã Paris và kiến trúc cổ kính trung tâm Quận 1",
          "en": "Paris Commune Square and historic architecture in District 1",
          "fr": "La place de la Commune de Paris au cœur du 1er arrondissement",
          "zh": "第一郡巴黎公社广场历史建筑群",
          "ja": "1区パリ・コミューン広場の歴史的街並み"
        },
        "yearOrSource": "Di sản Kiến trúc Đô thị Sài Gòn"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-ntdb-1",
        "name": "Cà Phê Bệt & Highlands Bưu Điện Công Xã Paris",
        "cuisine": "Cà phê Sài Gòn & Bánh ngọt",
        "specialtyDishes": [
          "Cà phê sữa đá Sài Gòn",
          "Trà sen vàng",
          "Bánh mì que pate"
        ],
        "rating": 4.7,
        "reviewCount": 3120,
        "priceRange": "35.000đ – 75.000đ",
        "lat": 10.7802,
        "lng": 106.6995,
        "address": "02 Công xã Paris, Quận 1, TP.HCM",
        "openHours": "07:00 – 22:30",
        "imageUrl": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast",
          "lunch",
          "dinner"
        ]
      },
      {
        "id": "res-ntdb-2",
        "name": "Pizza 4P’s Hai Bà Trưng",
        "cuisine": "Ẩm thực Ý – Nhật Thủ công",
        "specialtyDishes": [
          "Pizza phô mai Burrata tự làm",
          "Mì Ý cua sốt kem cà chua"
        ],
        "rating": 4.9,
        "reviewCount": 4980,
        "priceRange": "180.000đ – 350.000đ",
        "lat": 10.7828,
        "lng": 106.6958,
        "address": "151B Hai Bà Trưng, Quận 3, TP.HCM",
        "openHours": "10:00 – 23:00",
        "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "buu-dien-trung-tam-sai-gon",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.78,
    "lng": 106.6999,
    "category": "monument",
    "rating": 4.9,
    "reviewCount": 21340,
    "ticketPrice": "Miễn phí tham quan",
    "address": "02 Công xã Paris, Phường Bến Nghé, Quận 1, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Bưu điện Trung tâm Sài Gòn & Đường sách Nguyễn Văn Bình",
        "shortSummary": "Tuyệt tác kiến trúc Tân cổ điển kết hợp kết cấu vòm thép công nghiệp thế kỷ 19 (1886 – 1891) của KTS Alfred Foulhoux và Villedieu.",
        "historicalEra": "1886 – 1891",
        "openingHours": "07:30 – 18:00 Hàng ngày",
        "architecturalHighlights": [
          "Mái vòm kết cấu khung thép uốn cong tinh xảo dọc đại sảnh chính",
          "Hai bức bản đồ lịch sử vẽ tay trên vòm tường: \"Saigon et ses environs 1892\" và bản đồ đường dây điện báo Nam Kỳ",
          "Mặt tiền trang trí danh nhân khoa học điện tín và chiếc đồng hồ lớn শত năm tuổi",
          "Sát cạnh Đường sách TP.HCM Nguyễn Văn Bình rợp bóng cây xanh"
        ],
        "audioScript": [
          "Chào mừng quý khách bước vào Bưu điện Trung tâm Sài Gòn, công trình bưu chính hơn 130 năm tuổi vẫn đang hoạt động nhộn nhịp mỗi ngày tại số 2 Công xã Paris.",
          "Được xây dựng từ năm 1886 đến năm 1891 dưới sự chủ trì của kiến trúc sư Auguste Villedieu và Alfred Foulhoux, tòa nhà gây ấn tượng mạnh với mặt tiền vàng rực rỡ và chiếc đồng hồ cổ chính giữa.",
          "Khi bước qua sảnh chính, quý khách sẽ choáng ngợp trước hệ mái vòm khung sắt cao rộng gợi nhớ các nhà ga châu Âu cuối thế kỷ 19, cùng hai bức bản đồ cổ vẽ tay từ năm 1892 trên tường vòm.",
          "Ngay bên hông Bưu điện là Đường sách Nguyễn Văn Bình – không gian văn hóa đọc yên bình bậc nhất trung tâm thành phố."
        ]
      },
      "en": {
        "name": "Saigon Central Post Office & Book Street",
        "shortSummary": "An 1891 architectural gem featuring a soaring wrought-iron vaulted hall, hand-painted 1892 maps, and adjacent Nguyen Van Binh Book Street.",
        "historicalEra": "1886 – 1891 (Villedieu & Foulhoux)",
        "openingHours": "07:30 – 18:00 Daily",
        "architecturalHighlights": [
          "Grand arched ironwork concourse inspired by 19th-century European railway halls",
          "Two historic 1892 hand-painted murals of Saigon and telegraph lines of Indochina",
          "Antique wooden telephone booths and mosaic tile floors",
          "Adjacent Nguyen Van Binh pedestrian Book Street"
        ],
        "audioScript": [
          "Welcome to the Saigon Central Post Office, built between 1886 and 1891 and designed by architects Villedieu and Alfred Foulhoux.",
          "Inside the grand concourse, look up to admire the green wrought-iron vaulted ceiling and the two original 1892 cartographic murals depicting historic Saigon and Indochinese telegraph networks."
        ]
      },
      "fr": {
        "name": "Poste Centrale de Saïgon & Rue du Livre",
        "shortSummary": "Joyau architectural de 1891 célèbre pour sa nef métallique voûtée, ses cartes murales de 1892 et la rue piétonne du Livre adjacente.",
        "historicalEra": "1886 – 1891 (Villedieu & Foulhoux)",
        "openingHours": "07h30 – 18h00",
        "architecturalHighlights": [
          "Grande verrière et charpente métallique du XIXe siècle",
          "Fresques cartographiques historiques de 1892 (« Saigon et ses environs »)",
          "Cabines téléphoniques anciennes en bois sculpté"
        ],
        "audioScript": [
          "Bienvenue à la Poste Centrale de Saïgon, inaugurée en 1891 selon les plans des architectes Villedieu et Foulhoux.",
          "Sous sa vaste voûte métallique, admirez les deux grandes cartes murales peintes en 1892 ainsi que les anciennes cabines téléphoniques en bois."
        ]
      },
      "zh": {
        "name": "西贡中央邮局与阮文平书街",
        "shortSummary": "建于1891年的法式古典建筑瑰宝，拥有宏伟的钢铁拱顶大厅、1892年手绘历史地图与毗邻的文化书街。",
        "historicalEra": "1886 – 1891年",
        "openingHours": "07:30 – 18:00",
        "architecturalHighlights": [
          "十九世纪欧式火车站风格的绿色钢铁拱顶",
          "1892年手绘《西贡及周边地图》与电报线路图",
          "复古实木电话亭与花砖地面"
        ],
        "audioScript": [
          "欢迎来到西贡中央邮局，这座始建于1886年、落成于1891年的历史建筑至今仍正常办理邮政业务。",
          "步入大厅，抬头可见宏伟的拱形金属屋顶，两侧墙壁上保存着1892年绘制的西贡历史地图。邮局旁便是绿树成荫的阮文平书街。"
        ]
      },
      "ja": {
        "name": "サイゴン中央郵便局とグエン・ヴァン・ビン本通り",
        "shortSummary": "1891年に完成した壮麗な鉄骨アーチ天井を持つ歴史的郵便局。1892年の手描き古地図や隣接するブックストリートが見どころです。",
        "historicalEra": "1886年 – 1891年",
        "openingHours": "07:30 – 18:00",
        "architecturalHighlights": [
          "19世紀ヨーロッパの駅舎を思わせる美しい鉄骨アーチ天井",
          "1892年に描かれたサイゴン周辺の古地図壁画",
          "レトロな木製電話ボックスと隣接するブックストリート"
        ],
        "audioScript": [
          "1891年に完成したサイゴン中央郵便局へようこそ。現在も現役の郵便局として市民や旅行者に愛されています。",
          "開放感あふれるアーチ天井のホールには、1892年に描かれた歴史的な地図が残されており、すぐ隣には緑豊かなブックストリートが広がっています。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "bd-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Vòm thép cổ điển bên trong Bưu điện Trung tâm Sài Gòn",
          "en": "Historic vaulted concourse inside Saigon Central Post Office",
          "fr": "La grande nef voûtée de la Poste Centrale de Saïgon",
          "zh": "西贡中央邮局内部拱顶大厅",
          "ja": "サイゴン中央郵便局のアーチ天井ホール"
        },
        "yearOrSource": "Tư liệu Kiến trúc Sài Gòn 1891"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-bd-1",
        "name": "Bếp Nhà Lục Tỉnh (Nam Kỳ Khởi Nghĩa)",
        "cuisine": "Ẩm thực Miền Tây Nam Bộ",
        "specialtyDishes": [
          "Bánh khọt cốt dừa tôm tươi",
          "Cá lóc nướng trui",
          "Lẩu mắm miền Tây"
        ],
        "rating": 4.8,
        "reviewCount": 2410,
        "priceRange": "120.000đ – 260.000đ",
        "lat": 10.7792,
        "lng": 106.6978,
        "address": "37 Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM",
        "openHours": "10:00 – 22:00",
        "imageUrl": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "ben-nha-rong",
    "city": "Quận 4 · TP.HCM",
    "district": "Quận 4",
    "lat": 10.7683,
    "lng": 106.7068,
    "category": "museum",
    "rating": 4.9,
    "reviewCount": 11240,
    "ticketPrice": "20.000đ",
    "address": "01 Nguyễn Tất Thành, Phường 13, Quận 4, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Di tích Lịch sử Bến Nhà Rồng (Bảo tàng Hồ Chí Minh)",
        "shortSummary": "Nơi người thanh niên Nguyễn Tất Thành rời Tổ quốc trên con tàu Amiral Latouche-Tréville ngày 5/6/1911 ra đi tìm đường cứu nước.",
        "historicalEra": "1863 – 1911 – Nay",
        "openingHours": "07:30 – 11:30 & 13:30 – 17:00 (Thứ Ba – Chủ Nhật)",
        "architecturalHighlights": [
          "Kiến trúc Tây Âu kết hợp mái ngói Á Đông gắn đôi rồng chầu mặt trăng bằng gốm men xanh (\"Lưỡng long chầu nguyệt\")",
          "Hơn 11.000 tư liệu, hiện vật và mô hình tàu buôn Amiral Latouche-Tréville",
          "Tầm nhìn toàn cảnh ngã ba sông Sài Gòn – Kênh Tàu Hủ và Cầu Móng cổ kính"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Bến Nhà Rồng – Bảo tàng Hồ Chí Minh chi nhánh Thành phố Hồ Chí Minh, tọa lạc ngay ngã ba sông Sài Gòn lịch sử.",
          "Tòa nhà được xây dựng từ năm 1863 làm trụ sở hãng vận tải biển Messageries Maritimes. Trên đỉnh mái gắn đôi rồng lớn bằng đất nung tráng men xanh hướng về mặt trăng, vì thế nhân dân quen gọi là Nhà Rồng và bến cảng trước mặt là Bến Nhà Rồng.",
          "Ngày 5 tháng 6 năm 1911, từ chính bến cảng này, người thanh niên Nguyễn Tất Thành với tên gọi Văn Ba đã lên con tàu Amiral Latouche-Tréville, bắt đầu hành trình 30 năm bôn ba tìm đường cứu nước."
        ]
      },
      "en": {
        "name": "Nha Rong Wharf (Ho Chi Minh Museum)",
        "shortSummary": "Historic riverside wharf built in 1863 where young Nguyen Tat Thanh (President Ho Chi Minh) embarked on June 5, 1911 on his 30-year journey for national independence.",
        "historicalEra": "1863 – 1911 – Present",
        "openingHours": "07:30 – 11:30 & 13:30 – 17:00 (Tue – Sun)",
        "architecturalHighlights": [
          "Unique fusion of French colonial arcades and an Asian roof crowned by two glazed ceramic dragons",
          "Scale model of the French steamer Amiral Latouche-Tréville and over 11,000 historical artifacts",
          "Panoramic view of the Saigon River and historic Mong Bridge"
        ],
        "audioScript": [
          "Welcome to Nha Rong Wharf, literally the Dragon House Wharf, located at the confluence of the Saigon River and Ben Nghe Canal.",
          "Built in 1863 as the headquarters of the Messageries Maritimes shipping company, the building takes its name from the two ceramic dragons flanking a moon emblem atop its roof.",
          "On June 5, 1911, young Nguyen Tat Thanh, who later became President Ho Chi Minh, boarded the steamer Amiral Latouche-Tréville from this pier to begin his thirty-year quest for national liberation."
        ]
      },
      "fr": {
        "name": "Quai Nha Rong (Musée Hô Chi Minh)",
        "shortSummary": "Ancien siège des Messageries Maritimes bâti en 1863, d’où le jeune Nguyen Tat Thanh s’embarqua le 5 juin 1911 sur l’Amiral Latouche-Tréville.",
        "historicalEra": "1863 – 1911 – Présent",
        "openingHours": "07h30 – 11h30 & 13h30 – 17h00 (Mar – Dim)",
        "architecturalHighlights": [
          "Toiture ornée de deux dragons en céramique encadrant la lune",
          "Maquette du paquebot Amiral Latouche-Tréville et salles d’archives historiques"
        ],
        "audioScript": [
          "Bienvenue au Quai Nha Rong, édifié en 1863 au bord de la rivière de Saïgon pour la compagnie des Messageries Maritimes.",
          "C’est d’ici que le 5 juin 1911, le jeune Nguyen Tat Thanh prit place à bord du navire Amiral Latouche-Tréville."
        ]
      },
      "zh": {
        "name": "龙屋港历史遗迹（胡志明博物馆）",
        "shortSummary": "建于1863年的西贡河畔历史建筑，1911年6月5日青年阮必成（胡志明主席）在此登上法国商船踏上救国之路。",
        "historicalEra": "1863 – 1911年至今",
        "openingHours": "07:30 – 11:30 & 13:30 – 17:00（周二至周日）",
        "architecturalHighlights": [
          "中西合璧建筑屋顶上的“双龙朝月”琉璃陶塑",
          "拉图什·特雷维尔号轮船模型与上万件珍贵历史文物"
        ],
        "audioScript": [
          "欢迎来到位于西贡河畔的龙屋港——胡志明博物馆胡志明市分馆。",
          "因1863年落成的建筑屋顶饰有双龙朝月陶塑，当地民众称之为“龙屋”。1911年6月5日，青年阮必成在此登船远航，开启了三十年的寻道救国征程。"
        ]
      },
      "ja": {
        "name": "ニャロン港（ホーチミン博物館）",
        "shortSummary": "1863年に建てられたサイゴン川沿いの歴史的建造物。1911年6月5日、若きグエン・タット・タン（ホー・チ・ミン主席）が祖国解放の旅へと出항した場所です。",
        "historicalEra": "1863年 – 1911年 – 現在",
        "openingHours": "07:30 – 11:30 / 13:30 – 17:00（火曜〜日曜）",
        "architecturalHighlights": [
          "屋根の上に飾られた二頭の龍の陶磁器装飾（龍の家）",
          "アミラル・ラトゥーシュ・トレヴィル号の模型と歴史資料"
        ],
        "audioScript": [
          "サイゴン川のほとりに佇むニャロン港・ホーチミン博物館へようこそ。",
          "1863年に海運会社の社屋として建てられ、屋根に二頭の龍が飾られていることから「龍の家（ニャロン）」と呼ばれました。1911年6月5日、若き日のホー・チ・ミン主席がここから世界へと旅立ちました。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "bnr-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Kiến trúc mái ngói gắn đôi rồng đặc trưng tại Bến Nhà Rồng bên sông Sài Gòn",
          "en": "Distinctive dragon-crowned roof of Nha Rong Wharf by the Saigon River",
          "fr": "Toiture aux deux dragons du Quai Nha Rong",
          "zh": "西贡河畔龙屋港建筑风貌",
          "ja": "サイゴン川沿いのニャロン港の歴史的建築"
        },
        "yearOrSource": "Bảo tàng Hồ Chí Minh – Chi nhánh TP.HCM"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-bnr-1",
        "name": "Phố Ẩm Thực Vĩnh Khánh & Hải Sản Quận 4",
        "cuisine": "Hải sản & Ẩm thực đêm Sài Gòn",
        "specialtyDishes": [
          "Ốc hương xào bơ tỏi",
          "Sò điệp nướng mỡ hành",
          "Bạch tuộc nướng muối ớt"
        ],
        "rating": 4.8,
        "reviewCount": 3420,
        "priceRange": "70.000đ – 180.000đ",
        "lat": 10.7615,
        "lng": 106.7028,
        "address": "Đường Vĩnh Khánh, Phường 8, Quận 4, TP.HCM",
        "openHours": "15:00 – 23:30",
        "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "dinner"
        ]
      },
      {
        "id": "res-bnr-2",
        "name": "Phở Lệ & Cơm Tấm Bến Nghé (Gần Cầu Khánh Hội)",
        "cuisine": "Đặc sản Sài Gòn",
        "specialtyDishes": [
          "Cơm tấm sườn bì chả trứng",
          "Phở bò viên gân tái"
        ],
        "rating": 4.7,
        "reviewCount": 1850,
        "priceRange": "55.000đ – 95.000đ",
        "lat": 10.7705,
        "lng": 106.7042,
        "address": "Đường Hàm Nghi, Quận 1, TP.HCM",
        "openHours": "06:30 – 21:30",
        "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 50
  },
  {
    "id": "nha-hat-thanh-pho-hcm",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7766,
    "lng": 106.7032,
    "category": "monument",
    "rating": 4.8,
    "reviewCount": 9240,
    "ticketPrice": "Tham quan bên ngoài miễn phí (Vé xem À Ố Show từ 700.000đ)",
    "address": "07 Công trường Lam Sơn, Phường Bến Nghé, Quận 1, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Nhà hát Thành phố Hồ Chí Minh (Saigon Opera House)",
        "shortSummary": "Di tích Kiến trúc Nghệ thuật cấp Quốc gia khánh thành năm 1900 theo phong cách Flamboyant Đệ tam Cộng hòa Pháp tại Công trường Lam Sơn.",
        "historicalEra": "1898 – 1900 (KTS Félix Olivier)",
        "openingHours": "09:00 – 21:00 (Theo lịch biểu diễn)",
        "architecturalHighlights": [
          "Mặt tiền chạm nổi phù điêu nữ thần nghệ thuật lấy cảm hứng từ Bảo tàng Petit Palais (Paris)",
          "Khán phòng 500 chỗ ngồi với hệ thống âm học chuẩn mực và đèn chùm pha lê cổ điển",
          "Nằm ngay tâm điểm đường Đồng Khởi và Ga ngầm Metro Nhà hát Thành phố"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Nhà hát Thành phố Hồ Chí Minh tại số 7 Công trường Lam Sơn, một trong những công trình kiến trúc nghệ thuật tiêu biểu nhất của Sài Gòn đầu thế kỷ 20.",
          "Được khởi công năm 1898 và khánh thành vào ngày 1 tháng 1 năm 1900 theo đồ án của nhóm kiến trúc sư Félix Olivier, Ernest Guichard và Eugène Ferret, tòa nhà mang đậm phong cách Flamboyant rực rỡ của thời kỳ Đệ tam Cộng hòa Pháp.",
          "Toàn bộ phù điêu mặt tiền, tượng nữ thần Caryatids nâng đỡ mái vòm và đá lát sảnh đều được chế tác tại Pháp rồi vận chuyển bằng đường biển sang Sài Gòn."
        ]
      },
      "en": {
        "name": "Saigon Opera House (Municipal Theatre)",
        "shortSummary": "Inaugurated on January 1, 1900 in the French Third Republic Flamboyant style on historic Lam Son Square and Dong Khoi Street.",
        "historicalEra": "1898 – 1900 (Architect Félix Olivier)",
        "openingHours": "09:00 – 21:00",
        "architecturalHighlights": [
          "Ornate facade modeled after the Petit Palais in Paris with carved stone Caryatids",
          "500-seat auditorium with classical acoustics and crystal chandeliers",
          "Home to contemporary Vietnamese cultural performances such as the A O Show"
        ],
        "audioScript": [
          "Welcome to the Saigon Opera House at Lam Son Square, inaugurated on New Year’s Day in 1900.",
          "Designed by French architect Félix Olivier in the flamboyant style of the French Third Republic, its facade echoes the Petit Palais in Paris with intricate stone reliefs and statues of muses."
        ]
      },
      "fr": {
        "name": "Opéra de Saïgon (Théâtre Municipal)",
        "shortSummary": "Monument national d’architecture inauguré en 1900 dans le style flamboyant de la IIIe République française, inspiré du Petit Palais à Paris.",
        "historicalEra": "1898 – 1900 (Félix Olivier)",
        "openingHours": "09h00 – 21h00",
        "architecturalHighlights": [
          "Façade ornée de cariatides et de bas-reliefs importés de France",
          "Salle de spectacle à l’italienne au cœur de la rue Dong Khoi"
        ],
        "audioScript": [
          "Bienvenue devant l’Opéra de Saïgon, inauguré le 1er janvier 1900 sur la place Lam Son.",
          "Conçu par l’architecte Félix Olivier dans le style de la Troisième République, son fronton rappelle le Petit Palais de Paris."
        ]
      },
      "zh": {
        "name": "胡志明市大剧院（西贡歌剧院）",
        "shortSummary": "1900年元旦落成的法兰西第三共和国华丽风格剧院，国家级建筑艺术遗迹。",
        "historicalEra": "1898 – 1900年",
        "openingHours": "09:00 – 21:00",
        "architecturalHighlights": [
          "仿照巴黎小皇宫设计的精雕石刻外立面与女神柱",
          "位于同起街与蓝山广场核心地带"
        ],
        "audioScript": [
          "欢迎来到位于蓝山广场的胡志明市大剧院，这座落成于1900年的歌剧院展现了法兰西第三共和国时期的古典浮雕艺术。"
        ]
      },
      "ja": {
        "name": "サイゴン・オペラハウス（市民劇場）",
        "shortSummary": "1900年に開場したフランス第三共和政様式の美しい歌劇場。パリのプティ・パレをモデルにした精緻な彫刻ファサードが特徴です。",
        "historicalEra": "1898年 – 1900年",
        "openingHours": "09:00 – 21:00",
        "architecturalHighlights": [
          "パリのプティ・パレに着想を得た華麗な正面彫刻",
          "ドンコイ通りとラムソン広場の中心に位置する国家建築遺産"
        ],
        "audioScript": [
          "ラムソン広場に建つサイゴン・オペラハウスへようこそ。1900年の元日に開場したこの劇場は、優美なレリーフと音響を誇る国家建築芸術遺産です。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "nhtp-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Nhà hát Thành phố lung linh ánh đèn tại Công trường Lam Sơn – Đồng Khởi",
          "en": "Saigon Opera House illuminated at Lam Son Square",
          "fr": "L’Opéra de Saïgon illuminé sur la place Lam Son",
          "zh": "蓝山广场流光溢彩的胡志明市大剧院",
          "ja": "ラムソン広場でライトアップされたサイゴン・オペラハウス"
        },
        "yearOrSource": "Di tích Kiến trúc Nghệ thuật Quốc gia"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-nh-1",
        "name": "Anan Saigon (Nhà hàng 1 Sao Michelin gần Đồng Khởi)",
        "cuisine": "Ẩm thực Việt Đương đại (1 Michelin Star)",
        "specialtyDishes": [
          "Bánh xèo Taco tôm thịt",
          "Phở bò Wagyu tủy xương",
          "Chả giò gan ngỗng"
        ],
        "rating": 4.9,
        "reviewCount": 2150,
        "priceRange": "250.000đ – 650.000đ",
        "lat": 10.7726,
        "lng": 106.7042,
        "address": "89 Tôn Thất Đạm, Phường Bến Nghé, Quận 1, TP.HCM",
        "openHours": "17:00 – 23:00",
        "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "tru-so-ubnd-tphcm-dinh-xa-tay",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.776,
    "lng": 106.701,
    "category": "imperial",
    "rating": 4.9,
    "reviewCount": 8420,
    "ticketPrice": "Mở cửa tham quan theo đợt lễ (Check-in phố đi bộ Nguyễn Huệ 24/7)",
    "address": "86 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Trụ sở HĐND & UBND TP.HCM (Dinh Xã Tây) & Phố đi bộ Nguyễn Huệ",
        "shortSummary": "Di tích Kiến trúc Nghệ thuật cấp Quốc gia xây dựng từ 1898 – 1909 theo nguyên mẫu Tòa thị chính Paris, tọa lạc đầu trục Phố đi bộ Nguyễn Huệ.",
        "historicalEra": "1898 – 1909 (KTS Femand Gardès)",
        "openingHours": "Phố đi bộ Nguyễn Huệ mở cửa 24/7 (Tham quan bên trong vào dịp lễ)",
        "architecturalHighlights": [
          "Tháp chuông cao vút mô phỏng kiến trúc Phục hưng Bắc Pháp của KTS Femand Gardès",
          "Nghệ thuật điêu khắc mặt tiền và trần thạch cao tinh xảo của họa sĩ - điêu khắc gia Ruffier",
          "Tượng đài Chủ tịch Hồ Chí Minh và quảng trường nhạc nước Phố đi bộ Nguyễn Huệ phía trước"
        ],
        "audioScript": [
          "Quý khách đang đứng tại đầu đại lộ Phố đi bộ Nguyễn Huệ, trước tòa nhà Trụ sở Hội đồng Nhân dân và Ủy ban Nhân dân Thành phố Hồ Chí Minh – xưa kia người dân Sài Gòn quen gọi là Dinh Xã Tây.",
          "Được xây dựng từ năm 1898 đến năm 1909 theo thiết kế của kiến trúc sư Femand Gardès và trang trí bởi nhà điêu khắc Ruffier, công trình lấy cảm hứng từ những tòa thị chính miền Bắc nước Pháp với tháp chuông chính giữa và các dải phù điêu hoa lá tinh xảo.",
          "Năm 2020, tòa nhà đã được Bộ Văn hóa, Thể thao và Du lịch xếp hạng là Di tích Kiến trúc Nghệ thuật cấp Quốc gia và mở cửa đón du khách tham quan vào các dịp lễ lớn."
        ]
      },
      "en": {
        "name": "Ho Chi Minh City Hall (People’s Committee Building) & Nguyen Hue Promenade",
        "shortSummary": "A National Architectural Heritage landmark built between 1898 and 1909 at the head of Nguyen Hue Walking Street.",
        "historicalEra": "1898 – 1909 (Architect Fernand Gardès)",
        "openingHours": "Exterior & Nguyen Hue Walking Street open 24/7",
        "architecturalHighlights": [
          "French Renaissance bell-tower facade designed by Fernand Gardès",
          "Sculptural reliefs and ornate stucco ceilings by artist Louis-Lucien Ruffier",
          "Overlooking the monumental Nguyen Hue Pedestrian Boulevard"
        ],
        "audioScript": [
          "Welcome to the Ho Chi Minh City People’s Committee Building, historically known as the Hôtel de Ville or Dinh Xa Tay, standing at the head of Nguyen Hue Walking Street.",
          "Constructed between 1898 and 1909 by architect Fernand Gardès, this National Architectural Monument shines especially bright when illuminated at night."
        ]
      },
      "fr": {
        "name": "Hôtel de Ville de Hô Chi Minh-Ville & Promenade Nguyen Hue",
        "shortSummary": "Ancien Hôtel de Ville édifié entre 1898 et 1909 par Fernand Gardès et Louis-Lucien Ruffier, classé monument national d’architecture.",
        "historicalEra": "1898 – 1909",
        "openingHours": "Esplanade piétonne ouverte 24h/24",
        "architecturalHighlights": [
          "Beffroi central inspiré de la Renaissance française",
          "Décors sculptés de Ruffier et perspective sur l’avenue piétonne Nguyen Hue"
        ],
        "audioScript": [
          "Bienvenue devant l’ancien Hôtel de Ville de Saïgon, construit de 1898 à 1909 par l’architecte Fernand Gardès au sommet de la grande promenade Nguyen Hue."
        ]
      },
      "zh": {
        "name": "胡志明市人民委员会总部（市政厅）与阮惠步行街",
        "shortSummary": "建于1898至1909年的法国文艺复兴风格国家级建筑艺术遗迹，坐落于阮惠步行街北端。",
        "historicalEra": "1898 – 1909年",
        "openingHours": "步行街全天开放",
        "architecturalHighlights": [
          "法式钟楼与精致石雕立面",
          "胡志明主席雕像广场与阮惠步行街核心景观"
        ],
        "audioScript": [
          "欢迎来到位于阮惠步行街起点的胡志明市人民委员会总部大楼（昔日俗称“西社宫”），这座1909年竣工的建筑已被列为国家级建筑艺术遗迹。"
        ]
      },
      "ja": {
        "name": "ホーチミン市人民委員会庁舎とグエンフエ歩行者天国",
        "shortSummary": "1898年から1909年にかけて建設されたフレンチ・ルネサンス様式の国家建築芸術遺産。グエンフエ通りの正面にそびえます。",
        "historicalEra": "1898年 – 1909年",
        "openingHours": "グエンフエ歩行者天国は終日開放",
        "architecturalHighlights": [
          "北フランスの市庁舎を模した美しい時計塔と彫刻",
          "夜景が美しいグエンフエ通り広場"
        ],
        "audioScript": [
          "グエンフエ歩行者天国の正面に輝くホーチミン市人民委員会庁舎へようこそ。1909年に完成した、市内屈指の国家建築芸術遺産です。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "ubnd-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Trụ sở UBND TP.HCM và trục Phố đi bộ Nguyễn Huệ",
          "en": "Ho Chi Minh City Hall and Nguyen Hue Walking Street",
          "fr": "L’Hôtel de Ville et la promenade piétonne Nguyen Hue",
          "zh": "胡志明市市政厅与阮惠步行街",
          "ja": "ホーチミン市人民委員会庁舎とグエンフエ通り"
        },
        "yearOrSource": "Di tích Kiến trúc Nghệ thuật Quốc gia (2020)"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-ubnd-1",
        "name": "Chung Cư Cà Phê 42 Nguyễn Huệ & Bếp Mẹ Ỉn",
        "cuisine": "Cà phê & Ẩm thực Gia đình Sài Gòn (Michelin Bib Gourmand)",
        "specialtyDishes": [
          "Cơm tấm sườn nướng mật ong",
          "Bánh xèo tôm nhảy",
          "Cà phê muối ban công"
        ],
        "rating": 4.8,
        "reviewCount": 4120,
        "priceRange": "60.000đ – 160.000đ",
        "lat": 10.7746,
        "lng": 106.7035,
        "address": "136/9 Lê Thánh Tôn & 42 Nguyễn Huệ, Quận 1, TP.HCM",
        "openHours": "08:00 – 22:30",
        "imageUrl": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "cho-ben-thanh",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7725,
    "lng": 106.698,
    "category": "ancient_town",
    "rating": 4.7,
    "reviewCount": 24500,
    "ticketPrice": "Miễn phí vào cổng",
    "address": "Công trường Quách Thị Trang, Phường Bến Thành, Quận 1, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Chợ Bến Thành – Biểu tượng Giao thương 110 Năm Sài Gòn",
        "shortSummary": "Ngôi chợ lịch sử khánh thành năm 1914 với tháp đồng hồ 3 mặt ở Cửa Nam và bức phù điêu gốm Biên Hòa ở 4 cổng chính.",
        "historicalEra": "1859 – 1912 – 1914",
        "openingHours": "06:00 – 19:00 (Chợ đêm: 19:00 – 23:00)",
        "architecturalHighlights": [
          "Tháp đồng hồ 3 mặt biểu tượng tại Cửa Nam hướng ra quảng trường Quách Thị Trang",
          "Bốn cổng chính Đông – Tây – Nam – Bắc gắn phù điêu gốm Biên Hòa năm 1952 của nghệ nhân Lê Văn Mậu",
          "Thiên đường ẩm thực truyền thống Nam Bộ với hơn 1.400 sạp hàng"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Chợ Bến Thành, trái tim giao thương sầm uất và là biểu tượng văn hóa hơn một thế kỷ của Sài Gòn – Thành phố Hồ Chí Minh.",
          "Khởi nguồn từ ngôi chợ cổ bên bờ sông Bến Nghé gần thành Gia Định từ trước năm 1859, ngôi chợ tại vị trí hiện nay được khởi công năm 1912 và mở cửa đón khách vào tháng 3 năm 1914.",
          "Điểm nhấn kiến trúc nổi tiếng nhất là tháp đồng hồ ba mặt tại Cửa Nam, cùng những bức phù điêu gốm Biên Hòa đắp nổi hình bò, cá đuối, chuối gắn trên bốn cổng chợ từ năm 1952."
        ]
      },
      "en": {
        "name": "Ben Thanh Market",
        "shortSummary": "Opened in 1914 with its iconic three-faced clock tower and Bien Hoa ceramic reliefs, serving as the vibrant culinary and cultural hub of Saigon.",
        "historicalEra": "1859 – 1914",
        "openingHours": "06:00 – 23:00 Daily",
        "architecturalHighlights": [
          "Iconic South Gate three-faced clock tower built in 1914",
          "1952 Bien Hoa ceramic reliefs decorating the North, South, East, and West gates",
          "Traditional Southern Vietnamese street food hall inside the market"
        ],
        "audioScript": [
          "Welcome to Ben Thanh Market, the most recognizable symbol of commerce and street culture in Ho Chi Minh City since 1914.",
          "Above the four main entrances, look for the historic 1952 Bien Hoa ceramic reliefs depicting traditional produce and livestock."
        ]
      },
      "fr": {
        "name": "Marché Ben Thanh",
        "shortSummary": "Marché historique inauguré en 1914, célèbre pour sa tour de l’horloge à la porte Sud et ses bas-reliefs en céramique de Bien Hoa.",
        "historicalEra": "1912 – 1914",
        "openingHours": "06h00 – 23h00",
        "architecturalHighlights": [
          "Tour de l’horloge emblématique de la porte Sud",
          "Bas-reliefs en céramique de Bien Hoa (1952) aux quatre entrées"
        ],
        "audioScript": [
          "Bienvenue au marché Ben Thanh, inauguré en mars 1914 et reconnaissable entre tous grâce au beffroi de son entrée principale."
        ]
      },
      "zh": {
        "name": "滨城市场（西贡百年市集地标）",
        "shortSummary": "1914年落成的胡志明市商业与美食象征，以南门三面钟楼和1952年边和陶瓷浮雕闻名。",
        "historicalEra": "1912 – 1914年",
        "openingHours": "06:00 – 23:00",
        "architecturalHighlights": [
          "南门标志性的三面复古钟楼",
          "四座大门上方的1952年边和彩陶浮雕",
          "汇聚南越特色小吃与手工艺品的百年市集"
        ],
        "audioScript": [
          "欢迎来到滨城市场，这座落成于1914年的百年市集以其南门钟楼成为胡志明市最具代表性的城市符号。"
        ]
      },
      "ja": {
        "name": "ベンタイン市場",
        "shortSummary": "1914年に開業したホーチミン市最大のシンボル市場。南門の時計塔とビエンホア焼きの陶磁器レリーフで知られています。",
        "historicalEra": "1912年 – 1914年",
        "openingHours": "06:00 – 23:00",
        "architecturalHighlights": [
          "南門にそびえる象徴的な時計塔",
          "1952年に制作された四つの門のビエンホア陶器レリーフ",
          "南部ベトナムの屋台料理が集まるグルメエリア"
        ],
        "audioScript": [
          "1914年の開業以来、サイゴンの暮らしと食文化の中心であり続けるベンタイン市場へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "cbt-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Cửa Nam Chợ Bến Thành với tháp đồng hồ biểu tượng của Sài Gòn",
          "en": "South Gate of Ben Thanh Market with its iconic clock tower",
          "fr": "La porte Sud du marché Ben Thanh et son horloge",
          "zh": "滨城市场南门标志性钟楼",
          "ja": "ベンタイン市場・南門の時計塔"
        },
        "yearOrSource": "Di tích Lịch sử Văn hóa cấp Thành phố"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cbt-1",
        "name": "Bánh Mì Huỳnh Hoa (Gần Ngã 6 Phù Đổng – Bến Thành)",
        "cuisine": "Đặc sản Bánh mì Sài Gòn",
        "specialtyDishes": [
          "Bánh mì đặc biệt 12 lớp nhân pate chả lụa bơ"
        ],
        "rating": 4.8,
        "reviewCount": 7820,
        "priceRange": "65.000đ",
        "lat": 10.7712,
        "lng": 106.6931,
        "address": "26 Lê Thị Riêng, Phường Bến Thành, Quận 1, TP.HCM",
        "openHours": "06:00 – 22:00",
        "imageUrl": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      },
      {
        "id": "res-cbt-2",
        "name": "Bún Riêu Gánh Chợ Bến Thành (Phan Bội Châu)",
        "cuisine": "Ẩm thực gia truyền Sài Gòn hơn 40 năm",
        "specialtyDishes": [
          "Bún riêu cua đồng giò heo",
          "Canh bún huyết đậu hũ"
        ],
        "rating": 4.7,
        "reviewCount": 1940,
        "priceRange": "55.000đ – 75.000đ",
        "lat": 10.7731,
        "lng": 106.6987,
        "address": "4 Phan Bội Châu (Cửa Đông Chợ Bến Thành), Quận 1, TP.HCM",
        "openHours": "07:00 – 19:00",
        "imageUrl": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 45
  },
  {
    "id": "bao-tang-chung-tich-chien-tranh",
    "city": "Quận 3 · TP.HCM",
    "district": "Quận 3",
    "lat": 10.7795,
    "lng": 106.6921,
    "category": "museum",
    "rating": 4.9,
    "reviewCount": 31200,
    "ticketPrice": "40.000đ",
    "address": "28 Võ Văn Tần, Phường Võ Thị Sáu, Quận 3, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Bảo tàng Chứng tích Chiến tranh (War Remnants Museum)",
        "shortSummary": "Bảo tàng thành viên Hệ thống Bảo tàng vì Hòa bình Thế giới (INMP) lưu giữ hơn 20.000 tài liệu, phim ảnh và hiện vật lịch sử quý giá.",
        "historicalEra": "Thành lập ngày 4/9/1975",
        "openingHours": "07:30 – 17:30 Hàng ngày",
        "architecturalHighlights": [
          "Khu trưng bày ngoài trời các khí tài quân sự: trực thăng UH-1, máy bay F-5A, xe tăng M48",
          "Bộ sưu tập ảnh phóng sự chiến trường \"Hồi niệm\" của 134 phóng viên quốc tế",
          "Không gian tái hiện \"Chuồng Cọp\" Côn Đảo và phòng giáo dục Vì Hòa Bình"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Bảo tàng Chứng tích Chiến tranh tại số 28 Võ Văn Tần, Quận 3 – một trong những bảo tàng thu hút đông đảo du khách trong nước và quốc tế nhất tại Việt Nam.",
          "Được thành lập ngày 4 tháng 9 năm 1975 và là thành viên của Mạng lưới Quốc tế các Bảo tàng vì Hòa bình thuộc UNESCO, nơi đây lưu giữ hơn 20.000 tài liệu, hiện vật và phim ảnh chân thực.",
          "Đặc biệt, phòng trưng bày \"Hồi niệm\" trên tầng lầu giới thiệu hàng trăm tác phẩm nhiếp ảnh của 134 phóng viên chiến trường từ 11 quốc gia, gửi gắm thông điệp nhân văn sâu sắc về giá trị của hòa bình."
        ]
      },
      "en": {
        "name": "War Remnants Museum",
        "shortSummary": "One of Southeast Asia’s most visited museums and a member of the International Network of Museums for Peace, preserving over 20,000 historical artifacts and photojournalism archives.",
        "historicalEra": "Established September 4, 1975",
        "openingHours": "07:30 – 17:30 Daily",
        "architecturalHighlights": [
          "Outdoor courtyard of historic aircraft, helicopters, and artillery",
          "“Requiem” exhibition featuring works by 134 international war photojournalists",
          "Thematic galleries dedicated to global peace and post-war recovery"
        ],
        "audioScript": [
          "Welcome to the War Remnants Museum in District 3, Ho Chi Minh City, a member of the International Network of Museums for Peace.",
          "Through more than 20,000 historical artifacts and the acclaimed Requiem photojournalism collection, the museum conveys a powerful message of remembrance and peace."
        ]
      },
      "fr": {
        "name": "Musée des Vestiges de la Guerre",
        "shortSummary": "Membre du Réseau international des musées pour la paix, conservant plus de 20 000 documents, photographies de reporters et objets historiques.",
        "historicalEra": "Fondé en 1975",
        "openingHours": "07h30 – 17h30 tous les jours",
        "architecturalHighlights": [
          "Exposition photographique « Requiem » réunissant 134 photojournalistes internationaux",
          "Cour extérieure d’équipements historiques et salles dédiées à la paix"
        ],
        "audioScript": [
          "Bienvenue au Musée des Vestiges de la Guerre dans le 3e arrondissement de Hô Chi Minh-Ville, haut lieu de mémoire et de réflexion pour la paix."
        ]
      },
      "zh": {
        "name": "战争遗迹博物馆",
        "shortSummary": "世界和平博物馆网络成员，珍藏逾两万件历史文物与134位国际战地记者纪实摄影作品。",
        "historicalEra": "成立于1975年9月4日",
        "openingHours": "07:30 – 17:30",
        "architecturalHighlights": [
          "户外历史战机与装备展区",
          "《安魂曲》国际战地摄影特展",
          "传递和平价值的主题展厅"
        ],
        "audioScript": [
          "欢迎来到位于第三郡武文频街28号的战争遗迹博物馆，这里通过两万余件真实史料与纪实影像向世界传递珍爱和平的信念。"
        ]
      },
      "ja": {
        "name": "戦争証跡博物館",
        "shortSummary": "世界平和博物館ネットワークに加盟するホーチミン市屈指の博物館。2万点以上の歴史資料や国際報道写真家の作品を収蔵しています。",
        "historicalEra": "1975年9月4日設立",
        "openingHours": "07:30 – 17:30（年中無休）",
        "architecturalHighlights": [
          "沢田教一やロバート・キャパら134名の報道写真家を特集した「レクイエム」展",
          "屋外展示広場と平和へのメッセージを伝える常設展示室"
        ],
        "audioScript": [
          "ホーチミン市3区にある戦争証跡博物館へようこそ。2万点以上の貴重な資料や報道写真を通じて、平和の尊さを世界に訴えかけています。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "btct-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Không gian trưng bày và lưu trữ lịch sử tại Quận 3, TP.HCM",
          "en": "Historical exhibition space in District 3, Ho Chi Minh City",
          "fr": "Espace d’exposition historique dans le 3e arrondissement",
          "zh": "第三郡历史展览空间",
          "ja": "3区の歴史展示スペース"
        },
        "yearOrSource": "Bảo tàng Chứng tích Chiến tranh"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-btct-1",
        "name": "Bánh Xèo 46A Đinh Công Tráng & Phở Hòa Pasteur",
        "cuisine": "Đặc sản Sài Gòn (Michelin Selected)",
        "specialtyDishes": [
          "Phở bò truyền thống Pasteur",
          "Bánh xèo tôm thịt chảo gang"
        ],
        "rating": 4.8,
        "reviewCount": 3890,
        "priceRange": "70.000đ – 140.000đ",
        "lat": 10.7862,
        "lng": 106.6885,
        "address": "260C Pasteur, Phường Võ Thị Sáu, Quận 3, TP.HCM",
        "openHours": "06:00 – 22:00",
        "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 60
  },
  {
    "id": "bao-tang-lich-su-thao-cam-vien",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7878,
    "lng": 106.7052,
    "category": "museum",
    "rating": 4.9,
    "reviewCount": 10450,
    "ticketPrice": "30.000đ – 60.000đ",
    "address": "02 Nguyễn Bỉnh Khiêm, Phường Bến Nghé, Quận 1, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Bảo tàng Lịch sử TP.HCM, Đền thờ Vua Hùng & Thảo Cầm Viên Sài Gòn",
        "shortSummary": "Quần thể di sản kiến trúc Đông Dương (1929) của KTS Ernest Hébrard nằm trong khuôn viên Thảo Cầm Viên Sài Gòn lập từ năm 1864 – một trong 8 vườn bách thảo lâu đời nhất thế giới.",
        "historicalEra": "1864 – 1929",
        "openingHours": "07:00 – 17:30 Hàng ngày",
        "architecturalHighlights": [
          "Tòa nhà Bảo tàng Lịch sử (Bảo tàng Blanchard de la Brosse 1929) với tháp bát giác phong cách Đông Dương của KTS Ernest Hébrard",
          "Lưu giữ 12 Bảo vật Quốc gia (Tượng Phật Đồng Dương, Tượng thần Vishnu, Sưu tập vàng văn hóa Óc Eo – Chăm Pa)",
          "Đền thờ Vua Hùng cổ kính (1926) với các cột gỗ chạm rồng phượng sơn son thếp vàng",
          "Thảo Cầm Viên Sài Gòn (1864) do nhà thực vật học J.B. Louis Pierre quy hoạch"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Quần thể Bảo tàng Lịch sử Thành phố Hồ Chí Minh, Đền thờ Vua Hùng và Thảo Cầm Viên Sài Gòn tại số 2 Nguyễn Bỉnh Khiêm, Quận 1.",
          "Thảo Cầm Viên Sài Gòn được khởi lập từ tháng 3 năm 1864 dưới sự dẫn dắt của nhà thực vật học Jean Baptiste Louis Pierre, hiện là một trong tám vườn động thực vật hoạt động liên tục lâu đời nhất trên thế giới.",
          "Ngay cổng chính là Bảo tàng Lịch sử khánh thành năm 1929 theo thiết kế phong cách Đông Dương (Indochine) kinh điển của kiến trúc sư Ernest Hébrard, nơi đang bảo tồn hơn 43.000 hiện vật cùng 12 Bảo vật Quốc gia từ văn hóa Đông Sơn, Óc Eo, Chăm Pa đến triều Nguyễn."
        ]
      },
      "en": {
        "name": "Museum of Vietnamese History & Saigon Zoo and Botanical Gardens",
        "shortSummary": "An iconic 1929 Indochine architectural landmark by Ernest Hébrard housing 12 National Treasures, set within the 1864 Saigon Botanical Gardens.",
        "historicalEra": "1864 – 1929",
        "openingHours": "07:00 – 17:30 Daily",
        "architecturalHighlights": [
          "1929 octagonal Indochine tower designed by architect Ernest Hébrard",
          "12 National Treasures from Dong Son, Oc Eo, and Champa civilizations",
          "1926 Temple of the Hung Kings with lacquered wooden dragon columns",
          "Saigon Zoo & Botanical Gardens founded in 1864 – one of the world’s oldest zoos"
        ],
        "audioScript": [
          "Welcome to the Museum of Vietnamese History and the Saigon Botanical Gardens, established in 1864 as one of the oldest continuously operating botanical gardens in the world.",
          "Designed in 1929 by French architect Ernest Hébrard, the museum building is a masterpiece of Indochine architecture and houses over 43,000 artifacts including twelve National Treasures."
        ]
      },
      "fr": {
        "name": "Musée d’Histoire du Vietnam & Jardin Botanique de Saïgon",
        "shortSummary": "Chef-d’œuvre du style indochinois conçu en 1929 par Ernest Hébrard au sein du Jardin botanique fondé en 1864 par J.-B. Louis Pierre.",
        "historicalEra": "1864 – 1929",
        "openingHours": "07h00 – 17h30",
        "architecturalHighlights": [
          "Pavillon octogonal de style indochinois (Ernest Hébrard, 1929)",
          "Trésors nationaux des civilisations Dong Son, Oc Eo et Champa",
          "Jardin botanique centenaire fondé en 1864"
        ],
        "audioScript": [
          "Bienvenue au Musée d’Histoire et au Jardin botanique de Saïgon, fondé dès 1864 par le botaniste Jean-Baptiste Louis Pierre.",
          "L’édifice du musée, inauguré en 1929 sur les plans d’Ernest Hébrard, abrite d’exceptionnelles collections archéologiques."
        ]
      },
      "zh": {
        "name": "胡志明市历史博物馆、雄王庙与西贡动植物园",
        "shortSummary": "坐落于1864年建立的世界上最古老动植物园之一内，1929年印度支那风格建筑珍藏12件越南国宝。",
        "historicalEra": "1864 – 1929年",
        "openingHours": "07:00 – 17:30",
        "architecturalHighlights": [
          "1929年建筑师赫布拉德设计的八角塔楼",
          "东山文化、奥厄文化与占婆文明的12件国家级国宝",
          "始建于1864年的百年古树植物园与1926年雄王古庙"
        ],
        "audioScript": [
          "欢迎来到胡志明市历史博物馆与西贡动植物园。动植物园始建于1864年，是全球历史最悠久的八座动植物园之一；博物馆则珍藏着四万余件文物与十二件国宝。"
        ]
      },
      "ja": {
        "name": "ベトナム歴史博物館・フン王廟・サイゴン動植物園",
        "shortSummary": "1864年開園の世界最古級の動植物園内に佇む、1929年完成のインドシナ様式博物館。12点の国宝を収蔵しています。",
        "historicalEra": "1864年 – 1929年",
        "openingHours": "07:00 – 17:30",
        "architecturalHighlights": [
          "エルネスト・エブラール設計の八角塔が印象的なインドシナ建築（1929年）",
          "ドンソン文化・オケオ文化・チャンパ王国の国宝コレクション",
          "1864年に創設された緑豊かなサイゴン動植物園とフン王廟"
        ],
        "audioScript": [
          "1864年に開園したサイゴン動植物園と、その入口に建つベトナム歴史博物館へようこそ。1929年に設計された優美な建物には、4万点を超える歴史遺産が収蔵されています。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "btls-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Tháp bát giác cổ kính của Bảo tàng Lịch sử TP.HCM trong khuôn viên Thảo Cầm Viên",
          "en": "Octagonal tower of the Museum of Vietnamese History inside Saigon Botanical Gardens",
          "fr": "La tour octogonale du Musée d’Histoire de Hô Chi Minh-Ville",
          "zh": "胡志明市历史博物馆八角古塔",
          "ja": "ベトナム歴史博物館の八角塔"
        },
        "yearOrSource": "Di tích Kiến trúc Nghệ thuật cấp Quốc gia"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-btls-1",
        "name": "Hoa Túc & Khu Ẩm Thực Nguyễn Siêu – Đa Kao",
        "cuisine": "Ẩm thực Việt Đương đại & Đặc sản Đa Kao",
        "specialtyDishes": [
          "Gỏi bưởi tôm sú nướng",
          "Bò nướng lá lốt",
          "Bún mọc Đa Kao"
        ],
        "rating": 4.8,
        "reviewCount": 1620,
        "priceRange": "90.000đ – 240.000đ",
        "lat": 10.7852,
        "lng": 106.7018,
        "address": "Đường Nguyễn Bỉnh Khiêm – Lê Duẩn, Quận 1, TP.HCM",
        "openHours": "08:00 – 22:00",
        "imageUrl": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 60
  },
  {
    "id": "bao-tang-my-thuat-tphcm-dinh-chu-hoa",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7699,
    "lng": 106.6991,
    "category": "museum",
    "rating": 4.9,
    "reviewCount": 9840,
    "ticketPrice": "30.000đ",
    "address": "97A Phó Đức Chính, Phường Nguyễn Thái Bình, Quận 1, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Bảo tàng Mỹ thuật TP.HCM (Dinh thự Chú Hỏa)",
        "shortSummary": "Dinh thự cổ Art Deco kết hợp Á Đông xây dựng năm 1929 của gia tộc Hứa Bổn Hòa (Chú Hỏa), nơi lưu giữ Bảo vật Quốc gia \"Vườn xuân Bắc Trung Nam\" của danh họa Nguyễn Gia Trí.",
        "historicalEra": "1929 – 1934 (KTS Rivera)",
        "openingHours": "08:00 – 17:00 Hàng ngày",
        "architecturalHighlights": [
          "Tòa dinh thự vàng 99 cánh cửa kết hợp kiến trúc Art Deco Pháp và mái ngói lưu ly Á Đông",
          "Chiếc thang máy gỗ cổ nhất Sài Gòn lắp đặt từ năm 1929 vẫn còn nguyên bản",
          "Lưu giữ Bảo vật Quốc gia tranh sơn mài \"Vườn xuân Bắc Trung Nam\" (Nguyễn Gia Trí) và \"Thanh niên thành đồng\" (Nguyễn Sáng)"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh tại số 97A Phó Đức Chính, Quận 1 – tòa dinh thự từng thuộc về gia tộc thương nhân Hứa Bổn Hòa, tức Chú Hỏa.",
          "Được thiết kế bởi kiến trúc sư người Pháp Rivera vào năm 1929 và hoàn thành năm 1934, dinh thự là sự giao thoa tuyệt mỹ giữa phong cách Art Deco châu Âu và mái ngói lưu ly, gốm hoa văn truyền thống Á Đông.",
          "Đây cũng là tòa nhà tư nhân đầu tiên tại Sài Gòn trang bị thang máy buồng gỗ chạm khắc tinh xảo, đồng thời lưu giữ hơn 22.000 tác phẩm mỹ thuật cùng các Bảo vật Quốc gia vô giá."
        ]
      },
      "en": {
        "name": "Ho Chi Minh City Museum of Fine Arts (Hua Bon Hoa Mansion)",
        "shortSummary": "A magnificent 1929 Art Deco and Asian mansion housing over 22,000 artworks, Saigon’s first wooden elevator, and National Treasure lacquer paintings.",
        "historicalEra": "1929 – 1934 (Architect Rivera)",
        "openingHours": "08:00 – 17:00 Daily",
        "architecturalHighlights": [
          "99-door yellow mansion blending French Art Deco stained glass with Asian ceramic roofs",
          "Saigon’s oldest preserved antique wooden elevator from 1929",
          "Home to Nguyen Gia Tri’s National Treasure lacquer masterpiece “Spring Garden of North, Central, and South”"
        ],
        "audioScript": [
          "Welcome to the Ho Chi Minh City Museum of Fine Arts, housed in the historic 1929 mansion of the Hua Bon Hoa family.",
          "Combining French Art Deco stained-glass corridors with traditional Chinese-Vietnamese tiled roofs, the museum safeguards over 22,000 fine art pieces and National Treasures."
        ]
      },
      "fr": {
        "name": "Musée des Beaux-Arts de Hô Chi Minh-Ville (Villa Hua Bon Hoa)",
        "shortSummary": "Somptueuse demeure Art déco et asiatique de 1929 abritant le premier ascenseur en bois de Saïgon et des trésors nationaux de la peinture sur laque.",
        "historicalEra": "1929 – 1934 (Architecte Rivera)",
        "openingHours": "08h00 – 17h00",
        "architecturalHighlights": [
          "Verrières Art déco, carreaux de ciment anciens et toitures vernissées",
          "Chef-d’œuvre en laque de Nguyen Gia Tri classé Trésor National"
        ],
        "audioScript": [
          "Bienvenue au Musée des Beaux-Arts de Hô Chi Minh-Ville, installé dans l’ancienne demeure de la famille Hua Bon Hoa bâtie en 1929 par l’architecte Rivera."
        ]
      },
      "zh": {
        "name": "胡志明市美术馆（华本和家族古宅）",
        "shortSummary": "1929年落成的中西合璧装饰艺术（Art Deco）豪宅，拥有西贡最早的木制电梯与国宝级磨漆画。",
        "historicalEra": "1929 – 1934年",
        "openingHours": "08:00 – 17:00",
        "architecturalHighlights": [
          "99扇门的明黄色古宅与彩色玻璃长廊",
          "1929年保存至今的雕花木制古董电梯",
          "阮嘉智国宝级磨漆画《北中南春园》"
        ],
        "audioScript": [
          "欢迎来到胡志明市美术馆，这座建于1929年的建筑原为西贡巨商华本和家族宅邸，馆内珍藏逾两万件艺术品与越南国宝级磨漆画。"
        ]
      },
      "ja": {
        "name": "ホーチミン市美術博物館（フア・ボン・ホア邸）",
        "shortSummary": "1929年に建てられたアール・デコと東洋建築が融合した美しい洋館。サイゴン最古の木製エレベーターや国宝の漆絵を展示しています。",
        "historicalEra": "1929年 – 1934年",
        "openingHours": "08:00 – 17:00",
        "architecturalHighlights": [
          "ステンドグラスと黄色い回廊が美しいアール・デコ様式",
          "1929年設置のサイゴン最古の木製エレベーター",
          "グエン・ザー・チーの国宝漆絵『北中南の春の庭』"
        ],
        "audioScript": [
          "1929年に富豪フア・ボン・ホア一族の邸宅として建てられたホーチミン市美術博物館へようこそ。美しいステンドグラスの回廊とベトナム近代美術の傑作をご鑑賞いただけます。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "btmt-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Hành lang gạch bông cổ và khung cửa kính màu tại Bảo tàng Mỹ thuật TP.HCM",
          "en": "Vintage patterned tiles and stained-glass corridors of the Fine Arts Museum",
          "fr": "Couloirs aux vitraux Art déco du Musée des Beaux-Arts",
          "zh": "胡志明市美术馆复古花砖与彩窗长廊",
          "ja": "美術博物館のレトロな床タイルとステンドグラスの回廊"
        },
        "yearOrSource": "Di tích Kiến trúc Nghệ thuật cấp Thành phố"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-btmt-1",
        "name": "Phở Việt Nam (Phạm Hồng Thái – Michelin Selected)",
        "cuisine": "Phở Bát Đá & Phở Truyền thống",
        "specialtyDishes": [
          "Phở bò bát đá nóng hổi",
          "Bánh phở tráng tay tươi mỗi ngày"
        ],
        "rating": 4.8,
        "reviewCount": 2310,
        "priceRange": "65.000đ – 110.000đ",
        "lat": 10.7718,
        "lng": 106.6962,
        "address": "14 Phạm Hồng Thái, Phường Bến Thành, Quận 1, TP.HCM",
        "openHours": "06:00 – 22:00",
        "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 50
  },
  {
    "id": "bao-tang-tphcm-dinh-gia-long",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7759,
    "lng": 106.6996,
    "category": "museum",
    "rating": 4.8,
    "reviewCount": 6820,
    "ticketPrice": "30.000đ",
    "address": "65 Lý Tự Trọng, Phường Bến Nghé, Quận 1, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Bảo tàng Thành phố Hồ Chí Minh (Dinh Gia Long)",
        "shortSummary": "Di tích Kiến trúc Nghệ thuật cấp Quốc gia xây dựng từ 1885 – 1890 theo thiết kế của KTS Alfred Foulhoux, tái hiện toàn diện 300 năm lịch sử Sài Gòn – Gia Định – TP.HCM.",
        "historicalEra": "1885 – 1890 (KTS Alfred Foulhoux)",
        "openingHours": "08:00 – 17:00 Hàng ngày",
        "architecturalHighlights": [
          "Cầu thang đại sảnh bằng đá cẩm thạch trắng và mái vòm Tân cổ điển Pháp",
          "9 phòng trưng bày chuyên đề về địa chất, khảo cổ, thương cảng Sài Gòn, tiền tệ và đấu tranh cách mạng",
          "Hệ thống đường hầm bí mật và khuôn viên vườn cổ thụ rộng 2 hecta giữa trung tâm Quận 1"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Bảo tàng Thành phố Hồ Chí Minh tại số 65 Lý Tự Trọng, công trình từng được biết đến với tên gọi Dinh Gia Long.",
          "Được khởi công năm 1885 và hoàn thành năm 1890 theo thiết kế của kiến trúc sư Alfred Foulhoux, tòa dinh thự mang vẻ đẹp Tân cổ điển uy nghi, kết hợp cùng hệ thống hầm ngầm kiên cố bên dưới.",
          "Tại đây, quý khách sẽ được ngược dòng thời gian khám phá hơn 300 năm hình thành và phát triển của vùng đất Sài Gòn – Gia Định – Thành phố Hồ Chí Minh."
        ]
      },
      "en": {
        "name": "Museum of Ho Chi Minh City (Former Gia Long Palace)",
        "shortSummary": "An 1890 Neoclassical palace designed by Alfred Foulhoux chronicling over 300 years of Saigon – Gia Dinh – Ho Chi Minh City history.",
        "historicalEra": "1885 – 1890 (Architect Alfred Foulhoux)",
        "openingHours": "08:00 – 17:00 Daily",
        "architecturalHighlights": [
          "Grand Neoclassical staircase and colonnaded galleries by Alfred Foulhoux",
          "Nine permanent galleries tracing 300 years of urban, trade, and cultural history",
          "Historic underground bunker complex and 2-hectare heritage gardens"
        ],
        "audioScript": [
          "Welcome to the Museum of Ho Chi Minh City, housed in the former Gia Long Palace built between 1885 and 1890 by architect Alfred Foulhoux.",
          "Its nine galleries tell the story of Saigon’s evolution from an ancient riverine settlement to Vietnam’s largest metropolis."
        ]
      },
      "fr": {
        "name": "Musée de Hô Chi Minh-Ville (Ancien Palais Gia Long)",
        "shortSummary": "Palais néoclassique édifié entre 1885 et 1890 par Alfred Foulhoux, retraçant plus de trois siècles d’histoire de Saïgon – Gia Dinh.",
        "historicalEra": "1885 – 1890 (Alfred Foulhoux)",
        "openingHours": "08h00 – 17h00",
        "architecturalHighlights": [
          "Escalier d’honneur et colonnades néoclassiques",
          "Neuf salles thématiques sur l’histoire et le patrimoine de Saïgon"
        ],
        "audioScript": [
          "Bienvenue au Musée de Hô Chi Minh-Ville, installé dans l’ancien Palais Gia Long conçu en 1885 par l’architecte Alfred Foulhoux."
        ]
      },
      "zh": {
        "name": "胡志明市博物馆（原嘉隆宫）",
        "shortSummary": "建于1885至1890年的新古典主义宫殿，全景展现西贡—嘉定—胡志明市三百余年的城市发展史。",
        "historicalEra": "1885 – 1890年",
        "openingHours": "08:00 – 17:00",
        "architecturalHighlights": [
          "气势恢宏的法式新古典主义旋转楼梯与柱廊",
          "九大主题展厅讲述西贡三百年历史变迁"
        ],
        "audioScript": [
          "欢迎来到位于李自重街65号的胡志明市博物馆（原嘉隆宫），通过九大展厅深入了解西贡三百余年的历史与民俗文化。"
        ]
      },
      "ja": {
        "name": "ホーチミン市博物館（旧ザーロン宮殿）",
        "shortSummary": "1890年に完成したネオクラシック様式の宮殿建築。サイゴン・ザーディン300年の都市史と民俗文化を展示しています。",
        "historicalEra": "1885年 – 1890年",
        "openingHours": "08:00 – 17:00",
        "architecturalHighlights": [
          "優美な大階段と回廊を備えた旧ザーロン宮殿",
          "サイゴン300年の歴史を辿る9つの常設展示室"
        ],
        "audioScript": [
          "1890年に完成した旧ザーロン宮殿を利用したホーチミン市博物館へようこそ。サイゴン300年の歴史と文化の歩みを詳しく紹介しています。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "bttphcm-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Mặt tiền cổ điển của Bảo tàng TP.HCM (Dinh Gia Long)",
          "en": "Neoclassical facade of the Museum of Ho Chi Minh City",
          "fr": "Façade néoclassique du Musée de Hô Chi Minh-Ville",
          "zh": "胡志明市博物馆（嘉隆宫）古典立面",
          "ja": "ホーチミン市博物館の正面外観"
        },
        "yearOrSource": "Di tích Kiến trúc Nghệ thuật Quốc gia"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-bttphcm-1",
        "name": "Secret Garden (Sân Thượng Chung Cư Cổ Pasteur)",
        "cuisine": "Cơm nhà Nam Bộ trên sân thượng",
        "specialtyDishes": [
          "Thịt luộc cà pháo mắm tôm",
          "Cá hú kho tộ",
          "Rau luộc kho quẹt"
        ],
        "rating": 4.7,
        "reviewCount": 2450,
        "priceRange": "90.000đ – 200.000đ",
        "lat": 10.7772,
        "lng": 106.7001,
        "address": "158 Pasteur, Phường Bến Nghé, Quận 1, TP.HCM",
        "openHours": "11:00 – 22:00",
        "imageUrl": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 45
  },
  {
    "id": "chua-ngoc-hoang-phuoc-hai-tu",
    "city": "Đa Kao · Quận 1",
    "district": "Quận 1",
    "lat": 10.792,
    "lng": 106.6981,
    "category": "temple",
    "rating": 4.9,
    "reviewCount": 11850,
    "ticketPrice": "Miễn phí tham quan & lễ bái",
    "address": "73 Mai Thị Lựu, Phường Đa Kao, Quận 1, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Chùa Ngọc Hoàng (Phước Hải Tự – Di tích Quốc gia)",
        "shortSummary": "Di tích Kiến trúc Nghệ thuật cấp Quốc gia xây dựng từ năm 1892 – 1906 với hơn 300 bức tượng cổ làm bằng giấy bồi (papier-mâché), gỗ và gốm sứ độc nhất vô nhị.",
        "historicalEra": "1892 – 1906",
        "openingHours": "07:00 – 18:00 Hàng ngày",
        "architecturalHighlights": [
          "Quần thể tượng Ngọc Hoàng Đại Đế, Thập Điện Diêm Vương và 12 Bà Mụ chế tác từ giấy bồi, gỗ chạm và đất nung",
          "Mái ngói âm dương trang trí quần thể tượng gốm men màu rực rỡ trên bờ nóc",
          "Điểm đến văn hóa từng đón Tổng thống Mỹ Barack Obama đến thăm vào tháng 5/2016"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Chùa Ngọc Hoàng, tên chữ là Phước Hải Tự, tọa lạc tại số 73 đường Mai Thị Lựu, phường Đa Kao, Quận 1.",
          "Ngôi cổ tự được khởi dựng từ cuối thế kỷ 19 và hoàn thiện năm 1906, đã được công nhận là Di tích Kiến trúc Nghệ thuật cấp Quốc gia năm 1994.",
          "Giá trị nghệ thuật đặc sắc nhất của chùa là bộ sưu tập hơn 300 bức tượng thần phật, đặc biệt là các pho tượng làm bằng chất liệu giấy bồi (papier-mâché) rất hiếm gặp tại Việt Nam, cùng bức phù điêu gỗ chạm khắc cảnh Thập Điện Diêm Vương và điện thờ Kim Hoa Thánh Mẫu – 12 Bà Mụ."
        ]
      },
      "en": {
        "name": "Jade Emperor Pagoda (Phuoc Hai Tu)",
        "shortSummary": "A National Architectural Monument built between 1892 and 1906, renowned for its rare papier-mâché statues, carved wood reliefs, and atmospheric incense halls.",
        "historicalEra": "1892 – 1906",
        "openingHours": "07:00 – 18:00 Daily",
        "architecturalHighlights": [
          "Over 300 antique statues crafted from papier-mâché, terracotta, and carved wood",
          "Hall of the Twelve Midwives (Kim Hoa Thanh Mau) and the Ten Courts of Hell wood reliefs",
          "Visited by U.S. President Barack Obama during his official trip to Vietnam in May 2016"
        ],
        "audioScript": [
          "Welcome to the Jade Emperor Pagoda, officially known as Phuoc Hai Tu, one of the most atmospheric and artistically rich temples in Ho Chi Minh City.",
          "Completed in 1906 and designated a National Architectural Monument, the pagoda houses over 300 antique figures crafted from papier-mâché, wood, and glazed ceramic."
        ]
      },
      "fr": {
        "name": "Pagode de l’Empereur de Jade (Phuoc Hai Tu)",
        "shortSummary": "Monument national d’architecture édifié entre 1892 et 1906, célèbre pour ses statues anciennes en papier mâché et ses reliefs en bois sculpté.",
        "historicalEra": "1892 – 1906",
        "openingHours": "07h00 – 18h00",
        "architecturalHighlights": [
          "Collection unique de plus de 300 statues en papier mâché, bois et céramique",
          "Sanctuaire de Kim Hoa Thanh Mau et des Douze Sages-Femmes célestes"
        ],
        "audioScript": [
          "Bienvenue à la Pagode de l’Empereur de Jade dans le quartier de Da Kao, classée monument national pour ses remarquables statues en papier mâché du début du XXe siècle."
        ]
      },
      "zh": {
        "name": "玉皇殿（福海寺 · 国家级建筑艺术遗迹）",
        "shortSummary": "建于1892至1906年的百年古刹，以三百余尊罕见的纸胎泥塑、木雕十殿阎罗与十二婆姐殿闻名。",
        "historicalEra": "1892 – 1906年",
        "openingHours": "07:00 – 18:00",
        "architecturalHighlights": [
          "罕见的百年纸扎泥塑玉皇大帝与诸神造像",
          "金花圣母与十二婆姐祈子殿、十殿阎王木雕壁画",
          "2016年美国总统奥巴马访问胡志明市时曾专程参访"
        ],
        "audioScript": [
          "欢迎来到位于第一郡多高坊的玉皇殿（福海寺），这座落成于1906年的古庙保存着三百多尊纸塑、木雕与陶塑神像，是国家级建筑艺术遗迹。"
        ]
      },
      "ja": {
        "name": "玉皇殿（フックハイ寺・国家建築芸術遺跡）",
        "shortSummary": "1892年から1906年に建てられた道教・仏教習合の古刹。張り子（パピエ・マシェ）で作られた300体以上の神像と荘厳な香煙で知られています。",
        "historicalEra": "1892年 – 1906年",
        "openingHours": "07:00 – 18:00",
        "architecturalHighlights": [
          "希少な張り子細工の神像群と十王の木彫レリーフ",
          "子宝と安産を祈願する金花聖母と十二婆姐の祠"
        ],
        "audioScript": [
          "ダカオ地区に佇む玉皇殿（フックハイ寺）へようこそ。1906年に完成したこの寺院には、珍しい張り子細工の像を含む300体以上の歴史的な彫像が祀られています。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "cnh-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Không gian cổ kính trầm mặc tại Chùa Ngọc Hoàng (Phước Hải Tự)",
          "en": "Atmospheric courtyard and roof carvings of the Jade Emperor Pagoda",
          "fr": "Cour intérieure de la Pagode de l’Empereur de Jade",
          "zh": "玉皇殿（福海寺）古朴庭院与琉璃屋脊",
          "ja": "玉皇殿の荘厳な境内と屋根装飾"
        },
        "yearOrSource": "Di tích Kiến trúc Nghệ thuật Quốc gia (1994)"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cnh-1",
        "name": "Cục Gạch Quán (Đặng Tất – Michelin Selected)",
        "cuisine": "Ẩm thực Đồng quê Việt Nam trong Biệt thự Cổ",
        "specialtyDishes": [
          "Đậu hũ chiên sả ớt giòn",
          "Cá bông lau kho tộ",
          "Canh chua bông điên điển"
        ],
        "rating": 4.8,
        "reviewCount": 3420,
        "priceRange": "150.000đ – 320.000đ",
        "lat": 10.7918,
        "lng": 106.6912,
        "address": "10 Đặng Tất, Phường Tân Định, Quận 1, TP.HCM",
        "openHours": "09:00 – 23:00",
        "imageUrl": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      },
      {
        "id": "res-cnh-2",
        "name": "Bánh Xèo Đinh Công Tráng & Chè Hiển Khánh Đa Kao",
        "cuisine": "Quà chiều & Ẩm thực truyền thống Sài Gòn",
        "specialtyDishes": [
          "Chè thập cẩm thạch hoa lài",
          "Bánh xèo tôm thịt rau rừng"
        ],
        "rating": 4.7,
        "reviewCount": 1840,
        "priceRange": "35.000đ – 110.000đ",
        "lat": 10.7895,
        "lng": 106.6952,
        "address": "718 Nguyễn Đình Chiểu / Khu Đa Kao, Quận 1, TP.HCM",
        "openHours": "09:00 – 21:30",
        "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "lang-ong-ba-chieu-le-van-duyet",
    "city": "Bình Thạnh · TP.HCM",
    "district": "Bình Thạnh",
    "lat": 10.8023,
    "lng": 106.697,
    "category": "imperial",
    "rating": 4.9,
    "reviewCount": 7450,
    "ticketPrice": "Miễn phí tham quan",
    "address": "01 Vũ Tùng, Phường 1, Quận Bình Thạnh, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Di tích Quốc gia Lăng Tả quân Lê Văn Duyệt (Lăng Ông Bà Chiểu)",
        "shortSummary": "Quần thể kiến trúc lăng mộ và miếu thờ Tổng trấn Gia Định thành Lê Văn Duyệt (1764 – 1832), mang đậm nghệ thuật cung đình triều Nguyễn và khảm sành sứ Nam Bộ.",
        "historicalEra": "1832 – 1848 – 1949",
        "openingHours": "07:00 – 17:30 Hàng ngày",
        "architecturalHighlights": [
          "Cổng Tam quan Thượng Công Miếu xây dựng năm 1949 từng là biểu tượng văn hóa của vùng Gia Định xưa",
          "Khu mộ song táng Tả quân Lê Văn Duyệt và phu nhân Đỗ Thị Phẫn theo hình quy (lưng rùa)",
          "Nhà võ ca, Chính điện trùng thiềm điệp ốc và nghệ thuật khảm sành sứ tinh xảo"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Di tích Lịch sử Văn hóa cấp Quốc gia Lăng Tả quân Lê Văn Duyệt, thường được người dân gọi thân thuộc là Lăng Ông Bà Chiểu tại quận Bình Thạnh.",
          "Nơi đây an táng và phụng thờ Đức Thượng công Tả quân Lê Văn Duyệt – vị Tổng trấn Gia Định thành có công lớn trong việc mở mang bờ cõi, đào kênh Vĩnh Tế và phát triển kinh tế vùng đất Nam Bộ đầu thế kỷ 19.",
          "Quần thể kiến trúc gồm Cổng Tam quan Thượng Công Miếu uy nghiêm, khu mộ hình lưng rùa, Vườn Bia, Nhà Võ Ca và Chính điện chạm trổ rồng phượng sơn son thếp vàng theo thức kiến trúc cung đình Huế kết hợp dân gian Nam Bộ."
        ]
      },
      "en": {
        "name": "Mausoleum of General Le Van Duyet (Lang Ong Ba Chieu)",
        "shortSummary": "A National Historical-Cultural Monument honoring Viceroy Le Van Duyet (1764–1832), showcasing Nguyen Dynasty royal architecture and ceramic mosaic art.",
        "historicalEra": "1832 – 1848 – 1949",
        "openingHours": "07:00 – 17:30 Daily",
        "architecturalHighlights": [
          "Iconic 1949 Three-Arched Gate (Tam Quan) inscribed “Thuong Cong Mieu”",
          "Tortoise-shell shaped tombs of General Le Van Duyet and his wife",
          "Traditional Southern Vietnamese ceremonial theater stage (Vo Ca) and main sanctuary"
        ],
        "audioScript": [
          "Welcome to Lang Ong Ba Chieu, the Mausoleum of General Le Van Duyet in Binh Thanh District, recognized as a National Historical and Cultural Monument.",
          "General Le Van Duyet served twice as Viceroy of Gia Dinh Citadel in the early 19th century, transforming Southern Vietnam into a prosperous region."
        ]
      },
      "fr": {
        "name": "Mausolée du Général Le Van Duyet (Lang Ong Ba Chieu)",
        "shortSummary": "Monument historique national dédié au vice-roi de Gia Dinh Le Van Duyet (1764–1832), joyau de l’architecture traditionnelle du Sud.",
        "historicalEra": "1832 – 1949",
        "openingHours": "07h00 – 17h30",
        "architecturalHighlights": [
          "Portique monumental à trois arches « Thuong Cong Mieu » (1949)",
          "Tombeaux en forme de carapace de tortue et sanctuaire décoré de mosaïques de porcelaine"
        ],
        "audioScript": [
          "Bienvenue au Mausolée du général Le Van Duyet à Binh Thanh, haut lieu de l’histoire de l’ancienne citadelle de Gia Dinh."
        ]
      },
      "zh": {
        "name": "黎文悦将军陵（巴沼翁陵 · 国家级历史文化遗迹）",
        "shortSummary": "纪念十九世纪初嘉定城总镇黎文悦的宏伟陵庙建筑群，展现阮朝宫廷木构与南越嵌瓷艺术。",
        "historicalEra": "1832 – 1848 – 1949年",
        "openingHours": "07:00 – 17:30",
        "architecturalHighlights": [
          "1949年建造的“上公庙”三关牌楼（昔日嘉定文化标志）",
          "龟背形双人合葬陵墓与重檐叠屋正殿"
        ],
        "audioScript": [
          "欢迎来到位于平盛郡的国家级历史文化遗迹——左军黎文悦将军陵（俗称巴沼翁陵），这里是南越最具代表性的传统陵庙建筑群。"
        ]
      },
      "ja": {
        "name": "レ・ヴァン・ズエット将軍廟（バーチエウ廟）",
        "shortSummary": "19世紀初頭のザーディン総鎮レ・ヴァン・ズエット将軍を祀る国家歴史文化遺跡。美しい三関門と陶磁器モザイク装飾が見どころです。",
        "historicalEra": "1832年 – 1949年",
        "openingHours": "07:00 – 17:30",
        "architecturalHighlights": [
          "ザーディンの象徴として知られる1949年建立の三関門「上公廟」",
          "亀甲型の墳墓と伝統劇（ハットボイ）の舞台"
        ],
        "audioScript": [
          "ビンタイン区にあるレ・ヴァン・ズエット将軍廟（ラン・オン・バー・チエウ）へようこそ。南部ベトナムの発展に大きく貢献した名将を祀る国家歴史文化遺跡です。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "lobc-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Kiến trúc cổ kính và nghệ thuật khảm sành sứ tại Lăng Ông Bà Chiểu",
          "en": "Traditional architecture and ceramic mosaics at Lang Ong Ba Chieu",
          "fr": "Architecture traditionnelle du Mausolée de Le Van Duyet",
          "zh": "黎文悦将军陵传统嵌瓷建筑艺术",
          "ja": "レ・ヴァン・ズエット将軍廟の伝統建築と装飾"
        },
        "yearOrSource": "Di tích Lịch sử Văn hóa Quốc gia (1988)"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-lobc-1",
        "name": "Xôi Gà Bà Chiểu & Ẩm thực Chợ Bà Chiểu",
        "cuisine": "Đặc sản Gia truyền Bình Thạnh",
        "specialtyDishes": [
          "Xôi gà xá xíu trứng non lòng đào",
          "Phá lấu bò Chợ Bà Chiểu",
          "Ốc tô Vạn Kiếp"
        ],
        "rating": 4.8,
        "reviewCount": 4210,
        "priceRange": "30.000đ – 75.000đ",
        "lat": 10.8012,
        "lng": 106.6989,
        "address": "318 Bùi Hữu Nghĩa (Góc Chợ Bà Chiểu), Quận Bình Thạnh, TP.HCM",
        "openHours": "15:00 – 23:00",
        "imageUrl": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "chua-ba-thien-hau-cho-lon",
    "city": "Quận 5 · Chợ Lớn",
    "district": "Quận 5",
    "lat": 10.7533,
    "lng": 106.6612,
    "category": "temple",
    "rating": 4.9,
    "reviewCount": 13640,
    "ticketPrice": "Miễn phí tham quan",
    "address": "710 Nguyễn Trãi, Phường 11, Quận 5, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Hội quán Tuệ Thành – Chùa Bà Thiên Hậu Chợ Lớn",
        "shortSummary": "Ngôi miếu cổ hơn 260 năm tuổi (khởi dựng năm 1760) tại trung tâm Chợ Lớn, Di tích Kiến trúc Nghệ thuật cấp Quốc gia đầu tiên của khu vực người Hoa tại TP.HCM.",
        "historicalEra": "Khởi dựng năm 1760",
        "openingHours": "06:00 – 17:30 Hàng ngày",
        "architecturalHighlights": [
          "Bố cục \"Nội công ngoại quốc\" với sân Thiên Tỉnh treo hàng trăm vòng nhang xoắn tỏa khói huyền ảo",
          "Quần thể phù điêu gốm sứ Cây Mai cổ (thế kỷ 19 – đầu thế kỷ 20) chạy dọc diềm mái",
          "Đại hồng chung đúc năm Càn Long thứ 60 (1796) và đỉnh trầm đồng năm Đạo Quang (1830)"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Hội quán Tuệ Thành, thường gọi là Chùa Bà Thiên Hậu, tọa lạc tại số 710 đường Nguyễn Trãi, trung tâm vùng đất Chợ Lớn lịch sử, Quận 5.",
          "Được cộng đồng người Hoa nhóm ngôn ngữ Quảng Đông (nhóm Tuệ Thành) góp công xây dựng từ năm 1760, đây là một trong những ngôi miếu cổ nhất của Sài Gòn – Chợ Lớn và được xếp hạng Di tích Kiến trúc Nghệ thuật cấp Quốc gia từ năm 1993.",
          "Ngước nhìn lên khoảng sân Thiên Tỉnh đón nắng, quý khách sẽ thấy hàng trăm vòng nhang xoắn ốc treo lơ lửng tỏa hương trầm ấm áp, phía trên mái ngói là những quần thể tượng gốm Cây Mai cổ xưa vô cùng tinh xảo."
        ]
      },
      "en": {
        "name": "Thien Hau Temple (Tue Thanh Assembly Hall – Cho Lon)",
        "shortSummary": "Founded in 1760 in the heart of Cho Lon (District 5), famous for its spiraling incense coils, 1796 bronze bell, and antique Cay Mai ceramic roof dioramas.",
        "historicalEra": "Founded in 1760",
        "openingHours": "06:00 – 17:30 Daily",
        "architecturalHighlights": [
          "Open-air central courtyard (Thien Tinh) hung with hundreds of glowing spiral incense coils",
          "19th-century Cay Mai glazed ceramic roof figurines depicting classical legends",
          "Antique bronze bell cast in 1796 and incense burners from 1830"
        ],
        "audioScript": [
          "Welcome to Thien Hau Temple, officially the Tue Thanh Assembly Hall, established in 1760 in the historic Chinatown of Cho Lon, District 5.",
          "Look up in the open courtyard to see hundreds of suspended spiral incense coils carrying the prayers of visitors, framed by antique Cay Mai ceramic dioramas along the roof ridges."
        ]
      },
      "fr": {
        "name": "Temple de la Dame Céleste Thien Hau (Congrégation Tue Thanh – Cho Lon)",
        "shortSummary": "Sanctuaire historique fondé en 1760 au cœur de Cho Lon (5e arrondissement), célèbre pour ses spirales d’encens et ses céramiques anciennes de Cay Mai.",
        "historicalEra": "Fondé en 1760",
        "openingHours": "06h00 – 17h30",
        "architecturalHighlights": [
          "Cour céleste suspendue de centaines de cônes d’encens en spirale",
          "Frises en céramique vernissée de Cay Mai sur les toitures"
        ],
        "audioScript": [
          "Bienvenue au temple de la déesse Thien Hau à Cho Lon, édifié dès 1760 et classé monument national d’architecture dès 1993."
        ]
      },
      "zh": {
        "name": "堤岸穗城会馆（天后宫 · 国家级建筑艺术遗迹）",
        "shortSummary": "始建于乾隆二十五年（1760年）的堤岸最古老华人会馆，以满堂盘香、嘉庆古钟与梅树窑陶塑屋脊闻名。",
        "historicalEra": "始建于1760年（清乾隆二十五年）",
        "openingHours": "06:00 – 17:30",
        "architecturalHighlights": [
          "天井上方悬挂的数百圈祈福盘香",
          "乾隆六十年（1796年）铜钟与道光年间古铜炉",
          "屋脊上精美的十九世纪西贡梅树窑（Cây Mai）交趾陶人物群像"
        ],
        "audioScript": [
          "欢迎来到位于第五郡堤岸核心区的穗城会馆（天后宫）。会馆始建于公元1760年，是胡志明市历史最悠久的华人庙宇之一，于1993年被列为国家级建筑艺术遗迹。"
        ]
      },
      "ja": {
        "name": "ティエンハウ廟（穂城会館・チョロン中華街）",
        "shortSummary": "1760年に創建されたチョロン（5区）最古級の華人廟。天井から吊るされた無数の渦巻き線香と屋根のカイマイ陶器装飾が幻想的です。",
        "historicalEra": "1760年創建",
        "openingHours": "06:00 – 17:30",
        "architecturalHighlights": [
          "吹き抜けの中庭に吊るされた渦巻き線香と立ち上る香煙",
          "1796年鋳造の梵鐘と屋根を彩るカイマイ焼きの陶磁器ジオラマ"
        ],
        "audioScript": [
          "チョロン地区の中心にあるティエンハウ廟（穂城会館）へようこそ。1760年に航海の安全を守る媽祖（天上聖母）を祀るために建てられた国家建築芸術遺跡です。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "cbth-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Không gian nhang vòng huyền ảo và kiến trúc cổ tại Chùa Bà Thiên Hậu Chợ Lớn",
          "en": "Spiral incense coils and antique roof carvings at Thien Hau Temple in Cho Lon",
          "fr": "Cônes d’encens en spirale au temple Thien Hau de Cho Lon",
          "zh": "堤岸穗城会馆（天后宫）祈福盘香",
          "ja": "チョロン・ティエンハウ廟の渦巻き線香"
        },
        "yearOrSource": "Di tích Kiến trúc Nghệ thuật Quốc gia (1993)"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cbth-1",
        "name": "Dimsum Tiến Phát & Mì Vịt Tiềm Thiêm Huy (Chợ Lớn)",
        "cuisine": "Tinh hoa Ẩm thực Người Hoa Chợ Lớn",
        "specialtyDishes": [
          "Há cảo tôm tươi",
          "Mì vịt tiềm thuốc bắc da giòn",
          "Bánh bao kim sa"
        ],
        "rating": 4.8,
        "reviewCount": 4120,
        "priceRange": "60.000đ – 160.000đ",
        "lat": 10.7548,
        "lng": 106.6635,
        "address": "455 Nguyễn Trãi, Phường 7, Quận 5, TP.HCM",
        "openHours": "06:00 – 22:00",
        "imageUrl": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      },
      {
        "id": "res-cbth-2",
        "name": "Chè Hà Ký Chợ Lớn (Hơn 70 năm tuổi)",
        "cuisine": "Chè Hoa Truyền thống Quận 5",
        "specialtyDishes": [
          "Chè hột gà trà",
          "Chè mè đen nguyên chất",
          "Đậu hũ hạnh nhân"
        ],
        "rating": 4.7,
        "reviewCount": 2650,
        "priceRange": "30.000đ – 55.000đ",
        "lat": 10.7525,
        "lng": 106.6628,
        "address": "138 Châu Văn Liêm, Phường 11, Quận 5, TP.HCM",
        "openHours": "10:00 – 23:00",
        "imageUrl": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "ham-chua-vu-khi-biet-dong-sai-gon",
    "city": "Quận 3 · TP.HCM",
    "district": "Quận 3",
    "lat": 10.7751,
    "lng": 106.6852,
    "category": "monument",
    "rating": 4.9,
    "reviewCount": 4120,
    "ticketPrice": "Miễn phí / 20.000đ thuyết minh chuyên đề",
    "address": "287/70 Nguyễn Đình Chiểu, Phường 5, Quận 3, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Di tích Lịch sử Quốc gia Hầm chứa Vũ khí Biệt động Sài Gòn",
        "shortSummary": "Căn hầm bí mật dưới nền nhà dân giữa lòng Quận 3 từng cất giấu gần 3 tấn vũ khí phục vụ lực lượng Biệt động Sài Gòn tấn công Dinh Độc Lập xuân Mậu Thân 1968.",
        "historicalEra": "1966 – 1968 (Di tích Quốc gia 1988)",
        "openingHours": "07:30 – 17:00 Hàng ngày",
        "architecturalHighlights": [
          "Nắp hầm ngụy trang bằng gạch bông mở bằng chốt khóa bí mật ngay trong căn nhà nhỏ",
          "Căn hầm ngầm dài hơn 8m, rộng 2m, sâu 2,5m đào hoàn toàn thủ công trong 7 tháng",
          "Bốn ống thông hơi ngụy trang và cửa thoát hiểm thông ra hệ thống cống ngầm thành phố"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Di tích Lịch sử cấp Quốc gia Hầm chứa Vũ khí của Biệt động Sài Gòn tại hẻm 287 Nguyễn Đình Chiểu, Quận 3.",
          "Năm 1966, chiến sĩ biệt động Trần Văn Lai (tức Mai Hồng Quế) đã mua căn nhà nhỏ này và bí mật đào căn hầm dưới nền nhà suốt 7 tháng ròng rã để cất giấu hơn hai tấn rưỡi vũ khí, thuốc nổ.",
          "Từ chính căn hầm bí mật ngay giữa trung tâm đô thị này, Đội 5 Biệt động Sài Gòn đã nhận vũ khí xuất kích tiến đánh Dinh Độc Lập trong đêm giao thừa Tết Mậu Thân 1968."
        ]
      },
      "en": {
        "name": "Saigon Commando Secret Weapons Bunker (District 3)",
        "shortSummary": "A National Historical Monument hidden beneath a modest alley house in District 3, where nearly 3 tons of weapons were secretly stored for the 1968 Tet Offensive.",
        "historicalEra": "1966 – 1968",
        "openingHours": "07:30 – 17:00 Daily",
        "architecturalHighlights": [
          "Camouflaged floor-tile trapdoor opening into an 8-meter underground vault",
          "Secret escape tunnel connected to the city’s drainage network",
          "Authentic Saigon Commando weapons, vehicles, and archival artifacts"
        ],
        "audioScript": [
          "Welcome to the Saigon Commando Secret Weapons Bunker tucked inside Alley 287 on Nguyen Dinh Chieu Street, District 3.",
          "Hand-dug in secret over seven months in 1966 beneath an ordinary family home, this underground vault concealed nearly three tons of ordnance right in the center of the city."
        ]
      },
      "fr": {
        "name": "Cache d’Armes Secrète des Commandos de Saïgon (3e Arr.)",
        "shortSummary": "Monument historique national dissimulé sous une maison de ruelle du 3e arrondissement, ayant abrité près de 3 tonnes d’armes en 1968.",
        "historicalEra": "1966 – 1968",
        "openingHours": "07h30 – 17h00",
        "architecturalHighlights": [
          "Trappe secrète camouflée dans le carrelage du sol",
          "Souterrain de 8 mètres de long creusé à la main en 1966"
        ],
        "audioScript": [
          "Bienvenue dans la cache d’armes secrète des commandos de Saïgon, monument national préservé intact au cœur d’une ruelle du 3e arrondissement."
        ]
      },
      "zh": {
        "name": "西贡别动队秘密军火地窖国家遗迹",
        "shortSummary": "隐藏在第三郡普通民居地板下的国家级历史遗迹，曾秘密储藏近3吨武器装备。",
        "historicalEra": "1966 – 1968年",
        "openingHours": "07:30 – 17:00",
        "architecturalHighlights": [
          "与客厅花砖融为一体的秘密活板门",
          "手工挖掘长达8米的地下防潮秘室与逃生暗道"
        ],
        "audioScript": [
          "欢迎来到位于第三郡阮庭照街287巷的西贡别动队秘密军火地窖，这里完整保留了1966年秘密挖掘的地下军火库原貌。"
        ]
      },
      "ja": {
        "name": "サイゴン別動隊の秘密武器地下壕（国家歴史遺跡）",
        "shortSummary": "3区の路地裏の民家の床下に秘密裏に掘られた地下武器庫。約3トンの武器を隠匿した驚異的な国家歴史遺跡です。",
        "historicalEra": "1966年 – 1968年",
        "openingHours": "07:30 – 17:00",
        "architecturalHighlights": [
          "床タイルに精巧にカモフラージュされた秘密の入り口",
          "7ヶ月かけて手掘りされた深さ2.5m・長さ8mの地下室"
        ],
        "audioScript": [
          "3区の静かな路地裏にあるサイゴン別動隊の秘密武器地下壕へようこそ。普通の民家の床下に約3トンの武器が隠されていた歴史的現場を見学できます。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "bd-sg-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Di tích Hầm chứa vũ khí Biệt động Sài Gòn tại Nguyễn Đình Chiểu, Quận 3",
          "en": "Saigon Commando Secret Bunker in District 3",
          "fr": "Cache secrète des commandos de Saïgon",
          "zh": "西贡别动队秘密地下室遗迹",
          "ja": "サイゴン別動隊の秘密地下壕"
        },
        "yearOrSource": "Di tích Lịch sử Quốc gia (1988)"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-bdsg-1",
        "name": "Cà Phê Vợt Phan Đình Phùng & Bún Bò Vườn Chuối",
        "cuisine": "Cà phê Sài Gòn xưa hơn 70 năm & Đặc sản Quận 3",
        "specialtyDishes": [
          "Cà phê vợt truyền thống pha siêu đất",
          "Bún bò giò heo Quận 3"
        ],
        "rating": 4.8,
        "reviewCount": 2890,
        "priceRange": "25.000đ – 65.000đ",
        "lat": 10.7732,
        "lng": 106.6838,
        "address": "Hẻm 330 Phan Đình Phùng, Quận Phú Nhuận / Giáp Quận 3, TP.HCM",
        "openHours": "06:00 – 22:00",
        "imageUrl": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "dia-dao-cu-chi-ben-duoc",
    "city": "Củ Chi · TP.HCM",
    "district": "Củ Chi",
    "lat": 11.1419,
    "lng": 106.4624,
    "category": "monument",
    "nationalSpecialMonument": true,
    "rating": 4.9,
    "reviewCount": 28400,
    "ticketPrice": "35.000đ – 125.000đ",
    "address": "Ấp Phú Hiệp, Xã Phú Mỹ Hưng, Huyện Củ Chi, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Di tích Quốc gia Đặc biệt Địa đạo Củ Chi & Đền Tưởng niệm Bến Dược",
        "shortSummary": "Kỳ quan quân sự dưới lòng đất dài hơn 250km với 3 tầng sâu của vùng \"Đất thép thành đồng\", được xếp hạng Di tích Quốc gia Đặc biệt năm 2015.",
        "historicalEra": "1948 – 1975",
        "openingHours": "07:00 – 17:00 Hàng ngày",
        "architecturalHighlights": [
          "Mạng lưới đường hầm 3 tầng dài 250km gồm hầm họp, hầm quân y, bếp Hoàng Cầm giấu khói",
          "Đền Tưởng niệm Liệt sĩ Bến Dược với tháp 9 tầng và bức tranh gốm lớn nhất Việt Nam",
          "Khu tái hiện vùng giải phóng Củ Chi và trải nghiệm thưởng thức khoai mì chấm muối mè"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Di tích Quốc gia Đặc biệt Địa đạo Củ Chi – kỳ quan công trình phòng thủ và sinh hoạt dưới lòng đất có một không hai trên thế giới.",
          "Khởi đào từ năm 1948 bằng những dụng cụ thô sơ như cuốc lưỡi cùn và ki xúc đất đan bằng tre, quân và dân Củ Chi đã kiến tạo nên một thành phố ngầm dài tới 250 kilômét gồm ba tầng sâu từ 3 mét đến hơn 10 mét dưới lòng đất sét cứng.",
          "Bên trong địa đạo có đầy đủ phòng họp chỉ huy, trạm phẫu thuật quân y, kho lương thực, giếng nước và đặc biệt là hệ thống bếp Hoàng Cầm dẫn khói tan là là trên mặt đất."
        ]
      },
      "en": {
        "name": "Cu Chi Tunnels & Ben Duoc Memorial Temple (Special National Monument)",
        "shortSummary": "A legendary 250-kilometer, three-level underground network hand-dug between 1948 and 1975, designated a Special National Monument of Vietnam.",
        "historicalEra": "1948 – 1975",
        "openingHours": "07:00 – 17:00 Daily",
        "architecturalHighlights": [
          "250-km three-level subterranean network with command rooms, field hospitals, and air vents",
          "Ingenious smokeless Hoang Cam underground kitchen",
          "Ben Duoc Memorial Temple featuring a 9-story tower and monumental ceramic murals"
        ],
        "audioScript": [
          "Welcome to the Cu Chi Tunnels, a Special National Historical Monument located northwest of central Ho Chi Minh City.",
          "Spanning more than 250 kilometers across three subterranean levels, this hand-dug underground village contained living quarters, hospitals, workshops, and smokeless Hoang Cam kitchens."
        ]
      },
      "fr": {
        "name": "Tunnels de Cu Chi & Temple Mémorial de Ben Duoc",
        "shortSummary": "Monument national spécial constitué d’un réseau souterrain de 250 km sur trois niveaux, creusé à la main entre 1948 et 1975.",
        "historicalEra": "1948 – 1975",
        "openingHours": "07h00 – 17h00",
        "architecturalHighlights": [
          "250 km de galeries souterraines sur trois niveaux de profondeur",
          "Cuisines sans fumée Hoang Cam et Temple commémoratif de Ben Duoc"
        ],
        "audioScript": [
          "Bienvenue aux Tunnels de Cu Chi, véritable ville souterraine de 250 kilomètres classée Monument National Spécial du Vietnam."
        ]
      },
      "zh": {
        "name": "古芝地道与本药纪念祠（越南特别国家级历史遗迹）",
        "shortSummary": "全长逾250公里的三层地下防御工程奇迹，包含地下会议室、战地医院与无烟黄琴灶。",
        "historicalEra": "1948 – 1975年",
        "openingHours": "07:00 – 17:00",
        "architecturalHighlights": [
          "全长250公里的三层地下迷宫网络",
          "消散炊烟的黄琴灶与伪装通气孔",
          "本药烈士纪念祠九层宝塔与巨型陶瓷壁画"
        ],
        "audioScript": [
          "欢迎来到位于胡志明市西北郊的特别国家级历史遗迹——古芝地道。这座全长250公里的地下网络展现了两代人坚韧不拔的智慧与毅力。"
        ]
      },
      "ja": {
        "name": "クチトンネルとベンズオック慰霊神殿（特別国家歴史遺跡）",
        "shortSummary": "総延長250km・地下3層におよぶ世界的に有名な地下トンネル網。会議室、野戦病院、煙を消すホアンカム竈などを備えた特別国家遺跡です。",
        "historicalEra": "1948年 – 1975年",
        "openingHours": "07:00 – 17:00",
        "architecturalHighlights": [
          "手掘りで築かれた総延長250kmの3層地下ネットワーク",
          "煙を地表で拡散させるホアンカム式の炊事場とタピオカ芋の試食体験"
        ],
        "audioScript": [
          "特別国家歴史遺跡・クチトンネルへようこそ。総延長250キロメートルにおよぶ地下3層のトンネル網は、病院や炊事場まで備えた驚異の地下都市です。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "ddcc-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Khu di tích lịch sử Địa đạo Củ Chi & Đền Bến Dược dưới tán rừng xanh",
          "en": "Cu Chi Tunnels & Ben Duoc Memorial Temple",
          "fr": "Site historique des Tunnels de Cu Chi",
          "zh": "古芝地道历史遗迹景区",
          "ja": "クチトンネル歴史遺跡"
        },
        "yearOrSource": "Di tích Quốc gia Đặc biệt (2015)"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cc-1",
        "name": "Bò Tơ Xuân Đào Củ Chi & Nhà hàng Bến Dược Ven Sông",
        "cuisine": "Đặc sản Củ Chi Truyền thống",
        "specialtyDishes": [
          "Bò tơ Củ Chi cuốn bánh tráng rau rừng",
          "Cháo dựng bò đậu xanh",
          "Khoai mì hấp nước cốt dừa"
        ],
        "rating": 4.8,
        "reviewCount": 3890,
        "priceRange": "120.000đ – 250.000đ",
        "lat": 11.1385,
        "lng": 106.4682,
        "address": "Đường Tỉnh lộ 15 / Quốc lộ 22, Huyện Củ Chi, TP.HCM",
        "openHours": "07:30 – 21:00",
        "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 120
  },
  {
    "id": "khu-du-tru-sinh-quyen-rung-sac-can-gio",
    "city": "Cần Giờ · TP.HCM",
    "district": "Cần Giờ",
    "lat": 10.5065,
    "lng": 106.8835,
    "category": "ancient_town",
    "unescoRecognized": true,
    "rating": 4.8,
    "reviewCount": 6420,
    "ticketPrice": "35.000đ – 70.000đ",
    "address": "Đường Rừng Sác, Xã Long Hòa, Huyện Cần Giờ, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Khu Dự trữ Sinh quyển Thế giới Cần Giờ (UNESCO) & Di tích Căn cứ Rừng Sác",
        "shortSummary": "Khu Dự trữ Sinh quyển Thế giới đầu tiên tại Việt Nam được UNESCO công nhận năm 2000 (\"Lá phổi xanh\" của TP.HCM) gắn liền với Di tích Quốc gia Căn cứ Đặc công Rừng Sác.",
        "historicalEra": "1966 – 1975 & UNESCO 2000",
        "openingHours": "07:30 – 17:00 Hàng ngày",
        "architecturalHighlights": [
          "Hệ sinh thái rừng ngập mặn 75.000 hecta được UNESCO công nhận là Khu Dự trữ Sinh quyển Thế giới",
          "Di tích Lịch sử Quốc gia Chiến khu Rừng Sác (Đoàn 10 Đặc công anh hùng)",
          "Lăng Cá Ông (Lễ hội Nghinh Ông Cần Giờ – Di sản Văn hóa Phi vật thể Quốc gia)"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Khu Dự trữ Sinh quyển Thế giới Rừng ngập mặn Cần Giờ và Di tích Lịch sử Quốc gia Căn cứ Rừng Sác ở phía Đông Nam Thành phố Hồ Chí Minh.",
          "Ngày 21 tháng 1 năm 2000, UNESCO đã công nhận Cần Giờ là Khu Dự trữ Sinh quyển Thế giới đầu tiên tại Việt Nam với hơn 75.000 hecta rừng đước, bần, mắm phong phú.",
          "Giữa lòng rừng ngập mặn chằng chịt sông rạch này là Căn cứ Rừng Sác – nơi tái hiện sinh động cuộc sống và chiến đấu quả cảm của các chiến sĩ Đoàn 10 Đặc công Rừng Sác."
        ]
      },
      "en": {
        "name": "Can Gio Mangrove Biosphere Reserve (UNESCO) & Rung Sac Historic Base",
        "shortSummary": "Vietnam’s first UNESCO World Biosphere Reserve (2000), combining 75,000 hectares of pristine mangrove forest with the National Historical Monument of Rung Sac Base.",
        "historicalEra": "1966 – 1975 & UNESCO 2000",
        "openingHours": "07:30 – 17:00 Daily",
        "architecturalHighlights": [
          "75,000-hectare UNESCO Mangrove Biosphere Reserve (“Green Lungs of Ho Chi Minh City”)",
          "Rung Sac Amphibious Commando Historic Base reconstructed inside the mangroves",
          "Whale Temple (Lang Ca Ong) & National Intangible Cultural Heritage Nghinh Ong Festival"
        ],
        "audioScript": [
          "Welcome to Can Gio Mangrove Biosphere Reserve, recognized by UNESCO in 2000 as Vietnam’s first World Biosphere Reserve and home to the historic Rung Sac Base."
        ]
      },
      "fr": {
        "name": "Réserve de Biosphère de la Mangrove de Can Gio (UNESCO) & Base de Rung Sac",
        "shortSummary": "Première réserve mondiale de biosphère de l’UNESCO au Vietnam (2000) et site historique national de la base de Rung Sac.",
        "historicalEra": "UNESCO 2000",
        "openingHours": "07h30 – 17h00",
        "architecturalHighlights": [
          "Forêt de mangrove de 75 000 hectares classée par l’UNESCO",
          "Site historique de la base amphibie de Rung Sac"
        ],
        "audioScript": [
          "Bienvenue dans la Réserve de biosphère de la mangrove de Can Gio, le poumon vert de Hô Chi Minh-Ville classé par l’UNESCO en l’an 2000."
        ]
      },
      "zh": {
        "name": "芹椰红树林世界生物圈保护区（UNESCO）与森林萨革命根据地",
        "shortSummary": "2000年获联合国教科文组织认定的越南首个世界生物圈保护区，被称为胡志明市的“绿肺”。",
        "historicalEra": "1966 – 1975 & UNESCO 2000",
        "openingHours": "07:30 – 17:00",
        "architecturalHighlights": [
          "7.5万公顷的世界级红树林生态系统",
          "国家级历史遗迹——森林萨水陆特工根据地",
          "芹椰迎翁节（国家级非物质文化遗产）"
        ],
        "audioScript": [
          "欢迎来到芹椰红树林世界生物圈保护区与森林萨历史根据地，这里拥有7.5万公顷红树林，是胡志明市珍贵的自然与历史遗产。"
        ]
      },
      "ja": {
        "name": "カンザー・マングローブ生物圏保存地域（ユネスコ）とルンサック基地遺跡",
        "shortSummary": "2000年にベトナムで初めてユネスコ生物圏保存地域（エコパーク）に登録された75,000ヘクタールのマングローブ林と国家歴史遺跡です。",
        "historicalEra": "ユネスコ登録 2000年",
        "openingHours": "07:30 – 17:00",
        "architecturalHighlights": [
          "ホーチミン市の「緑の肺」と呼ばれる広大なマングローブ原生林",
          "湿地帯の中に再現されたルンサック特攻基地の歴史遺跡"
        ],
        "audioScript": [
          "ユネスコの生物圏保存地域に登録されているカンザーのマングローブ林とルンサック歴史基地へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "cg-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Hệ sinh thái rừng ngập mặn Cần Giờ và Căn cứ lịch sử Rừng Sác",
          "en": "Can Gio Mangrove Biosphere Reserve & Rung Sac Historic Base",
          "fr": "La mangrove de Can Gio classée par l’UNESCO",
          "zh": "芹椰红树林生物圈保护区",
          "ja": "カンザーのマングローブ林と歴史基地"
        },
        "yearOrSource": "Khu Dự trữ Sinh quyển Thế giới UNESCO (2000)"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cg-1",
        "name": "Chợ Hải Sản Hàng Dương & Quán Gió Lộng Cần Giờ",
        "cuisine": "Hải sản tươi sống & Đặc sản Cần Giờ",
        "specialtyDishes": [
          "Cá dứa một nắng Cần Giờ chiên giòn",
          "Tôm tít cháy tỏi",
          "Gỏi lá lìm kìm rừng ngập mặn"
        ],
        "rating": 4.8,
        "reviewCount": 2940,
        "priceRange": "100.000đ – 280.000đ",
        "lat": 10.4152,
        "lng": 106.9215,
        "address": "Khu 30/4 – Chợ Hàng Dương, Xã Long Hòa, Huyện Cần Giờ, TP.HCM",
        "openHours": "07:00 – 21:00",
        "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 120
  },
  {
    "id": "chua-giac-lam-tan-binh",
    "city": "Tân Bình · TP.HCM",
    "district": "Tân Bình",
    "lat": 10.7785,
    "lng": 106.6494,
    "category": "temple",
    "rating": 4.9,
    "reviewCount": 5420,
    "ticketPrice": "Miễn phí tham quan",
    "address": "565 Lạc Long Quân, Phường 10, Quận Tân Bình, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Tổ đình Giác Lâm (Ngôi chùa cổ nhất TP.HCM – 1744)",
        "shortSummary": "Di tích Lịch sử – Văn hóa cấp Quốc gia khởi dựng năm 1744 đời chúa Nguyễn Phúc Khoát, lưu giữ 118 pho tượng cổ và hàng ngàn đĩa gốm trang trí kiến trúc chữ Tam Nam Bộ.",
        "historicalEra": "Khởi dựng năm 1744 (Hơn 280 năm tuổi)",
        "openingHours": "06:00 – 19:00 Hàng ngày",
        "architecturalHighlights": [
          "Kiến trúc chữ Tam truyền thống Nam Bộ gồm Chính điện, Giảng đường và Nhà trai gắn 98 cột gỗ quý khắc câu đối thếp vàng",
          "118 pho tượng cổ bằng gỗ mít và đồng, nổi bật với bộ tượng Thập Bát La Hán thế kỷ 18 – 19",
          " hơn 7.000 chiếc đĩa gốm cổ trang trí dọc bờ nóc, vách chùa và tháp Tổ"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Tổ đình Giác Lâm tại quận Tân Bình – ngôi chùa cổ nhất của Thành phố Hồ Chí Minh được cư sĩ Lý Thụy Long khởi dựng vào mùa xuân năm Giáp Tý 1744.",
          "Đã được công nhận là Di tích Lịch sử Văn hóa cấp Quốc gia từ năm 1988, chùa Giác Lâm giữ nguyên kiến trúc chữ Tam cổ truyền của miền Nam với 98 cây cột gỗ lớn chạm khắc câu đối tinh xảo.",
          "Bên trong chùa hiện bảo tồn 118 pho tượng cổ từ thế kỷ 18 – 19 cùng hơn 7.000 chiếc đĩa gốm cổ gắn dọc theo bờ mái và các ngôi bảo tháp."
        ]
      },
      "en": {
        "name": "Giac Lam Pagoda (Oldest Temple in Ho Chi Minh City – 1744)",
        "shortSummary": "Founded in 1744 in Tan Binh District, recognized as a National Historical-Cultural Monument with 118 antique statues and over 7,000 decorative ceramic plates.",
        "historicalEra": "Founded in 1744",
        "openingHours": "06:00 – 19:00 Daily",
        "architecturalHighlights": [
          "Traditional Southern Vietnamese three-hall timber layout supported by 98 carved hardwood pillars",
          "118 antique wooden and bronze statues dating back to the 18th and 19th centuries",
          "Over 7,000 antique porcelain plates embedded across roof ridges and stupas"
        ],
        "audioScript": [
          "Welcome to Giac Lam Pagoda in Tan Binh District, founded in 1744 and celebrated as the oldest surviving Buddhist temple in Ho Chi Minh City."
        ]
      },
      "fr": {
        "name": "Pagode Giac Lam (La plus ancienne pagode de Saïgon – 1744)",
        "shortSummary": "Monument historique national fondé en 1744, abritant 118 statues anciennes et plus de 7 000 assiettes en porcelaine décorative.",
        "historicalEra": "Fondée en 1744",
        "openingHours": "06h00 – 19h00",
        "architecturalHighlights": [
          "Architecture traditionnelle à 98 colonnes en bois précieux",
          "118 statues bouddhiques anciennes des XVIIIe et XIXe siècles"
        ],
        "audioScript": [
          "Bienvenue à la pagode Giac Lam, fondée en 1744 et reconnue comme le plus ancien sanctuaire bouddhique de Hô Chi Minh-Ville."
        ]
      },
      "zh": {
        "name": "觉林寺（胡志明市最古老佛寺 · 1744年）",
        "shortSummary": "始建于1744年的西贡最古老寺院，国家级历史文化遗迹，珍藏118尊古佛像与七千余件嵌瓷古盘。",
        "historicalEra": "始建于1744年",
        "openingHours": "06:00 – 19:00",
        "architecturalHighlights": [
          "98根名贵硬木楹联柱支撑的南越传统三进殿堂",
          "118尊十八至十九世纪菠萝蜜木雕古佛像",
          "镶嵌在屋脊与佛塔上的七千余只古瓷盘"
        ],
        "audioScript": [
          "欢迎来到位于新平郡的觉林祖庭，这座始建于1744年的古刹是胡志明市历史最悠久的佛教寺院。"
        ]
      },
      "ja": {
        "name": "ザックラム寺（覚林寺・ホーチミン市最古の寺院 1744年）",
        "shortSummary": "1744年に創建されたホーチミン市最古の仏教寺院。118体の古仏像と7,000枚以上の古陶磁器皿による装飾で知られる国家歴史文化遺跡です。",
        "historicalEra": "1744年創建",
        "openingHours": "06:00 – 19:00",
        "architecturalHighlights": [
          "98本の銘木柱が支える南部伝統建築",
          "18〜19世紀の118体の木彫仏像群と七重の仏塔"
        ],
        "audioScript": [
          "1744年に創建されたホーチミン市最古の寺院、ザックラム寺へようこそ。国家歴史文化遺跡に指定されています。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "cgl-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Bảo tháp Xá Lợi 7 tầng và mái chùa cổ kính tại Tổ đình Giác Lâm (1744)",
          "en": "Seven-story stupa and historic halls of Giac Lam Pagoda (1744)",
          "fr": "Stupa à sept étages de la pagode Giac Lam",
          "zh": "觉林寺七层舍利宝塔与古殿",
          "ja": "ザックラム寺の七重塔と本堂"
        },
        "yearOrSource": "Di tích Lịch sử Văn hóa Quốc gia (1988)"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cgl-1",
        "name": "Nhà hàng Chay Giác Lâm & Hủ Tiếu Nam Vang Lạc Long Quân",
        "cuisine": "Ẩm thực Chay & Đặc sản Sài Gòn",
        "specialtyDishes": [
          "Bún huế chay nấm mối",
          "Gỏi ngó sen chay",
          "Hủ tiếu khô tôm thịt"
        ],
        "rating": 4.7,
        "reviewCount": 1580,
        "priceRange": "35.000đ – 85.000đ",
        "lat": 10.7798,
        "lng": 106.6512,
        "address": "Lạc Long Quân, Phường 10, Quận Tân Bình, TP.HCM",
        "openHours": "06:30 – 21:00",
        "imageUrl": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "chua-vinh-nghiem-quan-3",
    "city": "Quận 3 · TP.HCM",
    "district": "Quận 3",
    "lat": 10.7891,
    "lng": 106.6835,
    "category": "temple",
    "rating": 4.9,
    "reviewCount": 8920,
    "ticketPrice": "Miễn phí tham quan",
    "address": "339 Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, Quận 3, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Chùa Vĩnh Nghiêm & Bảo tháp Đá Quán Thế Âm (Quận 3)",
        "shortSummary": "Danh lam cổ tự kết hợp kiến trúc Phật giáo Bắc tông truyền thống và kỹ thuật bê tông hiện đại của KTS Nguyễn Bá Lăng (1964 – 1971), sở hữu Bảo tháp Đá cao nhất Việt Nam.",
        "historicalEra": "1964 – 1971 (KTS Nguyễn Bá Lăng)",
        "openingHours": "06:00 – 20:00 Hàng ngày",
        "architecturalHighlights": [
          "Tháp Quán Thế Âm 7 tầng cao 40m và Tháp Đá Vĩnh Nghiêm chạm khắc hoàn toàn bằng đá granit nguyên khối",
          "Mái đao cong vút theo phong cách chùa cổ miền Bắc tái hiện bằng kết cấu bê tông cốt thép của KTS Nguyễn Bá Lăng",
          "Chiếc chuông đồng \"Đại hồng chung Hòa Bình\" do Phật giáo Nhật Bản cúng dường"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Chùa Vĩnh Nghiêm trên trục đường Nam Kỳ Khởi Nghĩa, Quận 3 – một trong những công trình kiến trúc Phật giáo tiêu biểu nhất thế kỷ 20 tại Thành phố Hồ Chí Minh.",
          "Được khởi công năm 1964 và hoàn thành năm 1971 theo đồ án của Kiến trúc sư Nguyễn Bá Lăng, ngôi chùa lấy nguyên mẫu từ chốn tổ Vĩnh Nghiêm thời Trần ở Bắc Giang nhưng được thi công bằng kỹ thuật bê tông cốt thép hiện đại.",
          "Nổi bật trong khuôn viên là Tháp Quán Thế Âm 7 tầng cao 40 mét và Tháp Đá Vĩnh Nghiêm chạm trổ kỳ công từ đá granit nguyên khối."
        ]
      },
      "en": {
        "name": "Vinh Nghiem Pagoda & Stone Stupa (District 3)",
        "shortSummary": "Designed by architect Nguyen Ba Lang (1964–1971), blending Northern Vietnamese Buddhist roofs with modern engineering and Vietnam’s tallest carved granite stupa.",
        "historicalEra": "1964 – 1971 (Architect Nguyen Ba Lang)",
        "openingHours": "06:00 – 20:00 Daily",
        "architecturalHighlights": [
          "40-meter seven-story Avalokitesvara Tower and monumental carved granite Stone Stupa",
          "Soaring upturned eaves inspired by Tran Dynasty Northern pagodas",
          "Peace Bronze Bell gifted by the Japanese Buddhist Sangha"
        ],
        "audioScript": [
          "Welcome to Vinh Nghiem Pagoda on Nam Ky Khoi Nghia Boulevard in District 3, designed by renowned architect Nguyen Ba Lang between 1964 and 1971."
        ]
      },
      "fr": {
        "name": "Pagode Vinh Nghiem (3e Arrondissement)",
        "shortSummary": "Chef-d’œuvre d’architecture bouddhique moderne conçu par Nguyen Ba Lang (1964–1971), célèbre pour sa tour de 40 mètres et son stupa en granit sculpté.",
        "historicalEra": "1964 – 1971",
        "openingHours": "06h00 – 20h00",
        "architecturalHighlights": [
          "Tour Quan The Am de 7 étages (40 mètres) et grand stupa en pierre",
          "Cloche de la Paix offerte par la communauté bouddhiste japonaise"
        ],
        "audioScript": [
          "Bienvenue à la pagode Vinh Nghiem, édifiée entre 1964 et 1971 selon les plans de l’architecte Nguyen Ba Lang."
        ]
      },
      "zh": {
        "name": "永严寺与石造宝塔（第三郡）",
        "shortSummary": "由建筑师阮伯陵设计（1964–1971），融合北越古刹飞檐与现代建筑技术，拥有40米七层观音塔与全石雕宝塔。",
        "historicalEra": "1964 – 1971年",
        "openingHours": "06:00 – 20:00",
        "architecturalHighlights": [
          "高达40米的七层观世音宝塔与整石雕刻的永严石塔",
          "日本佛教界赠送的“和平大洪钟”"
        ],
        "audioScript": [
          "欢迎来到位于第三郡南圻起义大道的永严寺，寺内耸立着40米高的七层观音宝塔与精湛的花岗岩雕石塔。"
        ]
      },
      "ja": {
        "name": "ヴィンギエム寺（永厳寺・3区）",
        "shortSummary": "建築家グエン・バー・ランの設計により1971年に完成した大寺院。高さ40mの七重塔、石造宝塔、日本の仏教界から寄贈された平和の梵鐘で有名です。",
        "historicalEra": "1964年 – 1971年",
        "openingHours": "06:00 – 20:00",
        "architecturalHighlights": [
          "高さ40メートルの七重の観音塔と花崗岩の石塔",
          "日本の仏教徒から寄贈された「平和の梵鐘」"
        ],
        "audioScript": [
          "3区のナムキーコイギア通りに建つヴィンギエム寺（永厳寺）へようこそ。日本の仏教界から贈られた平和の鐘や高さ40メートルの七重塔が見どころです。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "cvn-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Quần thể Chùa Vĩnh Nghiêm và Bảo tháp 7 tầng tại Quận 3, TP.HCM",
          "en": "Vinh Nghiem Pagoda and its 7-story tower in District 3",
          "fr": "La pagode Vinh Nghiem et sa tour à sept étages",
          "zh": "第三郡永严寺与七层宝塔",
          "ja": "3区のヴィンギエム寺と七重塔"
        },
        "yearOrSource": "Di sản Kiến trúc Phật giáo TP.HCM"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cvn-1",
        "name": "Bún Mọc Ròm Mập & Nhà hàng Chay Vĩnh Nghiêm",
        "cuisine": "Ẩm thực Chay Thanh Tịnh & Đặc sản Nam Kỳ Khởi Nghĩa",
        "specialtyDishes": [
          "Lẩu nấm thảo mộc chay",
          "Cơm sen chay Vĩnh Nghiêm",
          "Bún mọc sườn non"
        ],
        "rating": 4.8,
        "reviewCount": 2340,
        "priceRange": "55.000đ – 150.000đ",
        "lat": 10.7885,
        "lng": 106.6842,
        "address": "339 Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, Quận 3, TP.HCM",
        "openHours": "07:00 – 21:30",
        "imageUrl": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "den-tuong-niem-cac-vua-hung-thu-duc",
    "city": "TP. Thủ Đức · TP.HCM",
    "district": "TP. Thủ Đức",
    "lat": 10.8795,
    "lng": 106.8195,
    "category": "imperial",
    "rating": 4.9,
    "reviewCount": 6150,
    "ticketPrice": "Miễn phí tham quan",
    "address": "Công viên Lịch sử – Văn hóa Dân tộc, Phường Long Bình, TP. Thủ Đức, TP.HCM",
    "coverImage": "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80",
    "translations": {
      "vi": {
        "name": "Đền Tưởng niệm các Vua Hùng & Công viên Lịch sử Văn hóa Dân tộc (TP. Thủ Đức)",
        "shortSummary": "Quần thể kiến trúc văn hóa tâm linh rộng hơn 400 hecta tại Đồi Công nghệ – TP. Thủ Đức, thiết kế theo hình tượng Trống đồng Đông Sơn, Bánh chưng – Bánh giầy và Cửu Long.",
        "historicalEra": "Khánh thành năm 2009",
        "openingHours": "07:00 – 17:00 Hàng ngày",
        "architecturalHighlights": [
          "Quảng trường Thái Dương mô phỏng mặt Trống đồng Ngọc Lũ với 18 cánh cung tượng trưng 18 đời Vua Hùng",
          "Con đường Tre dài 400m dẫn lên Đền Thượng tọa lạc trên đỉnh đồi cao thoáng đãng",
          "Cột đá thề của An Dương Vương và Bảo tàng Gốm cổ sông Đồng Nai"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Đền Tưởng niệm các Vua Hùng nằm trong Công viên Lịch sử – Văn hóa Dân tộc rộng hơn 400 hecta tại phường Long Bình, Thành phố Thủ Đức.",
          "Công trình được thiết kế theo triết lý Trời tròn Đất vuông (Bánh chưng – Bánh giầy), nổi bật với Quảng trường Thái Dương mang họa tiết mặt trống đồng Đông Sơn và 54 cột đá tượng trưng cho 54 dân tộc anh em.",
          "Lối đi bộ rợp bóng tre xanh mát dẫn thẳng lên Đền Thượng là một trong những cung đường tản bộ văn hóa đẹp nhất tại khu Đông Thành phố Hồ Chí Minh."
        ]
      },
      "en": {
        "name": "Hung Kings Memorial Temple & National Historical-Cultural Park (Thu Duc City)",
        "shortSummary": "A monumental 400-hectare cultural complex in Thu Duc City inspired by Dong Son bronze drums and the legend of Square Earth and Round Sky.",
        "historicalEra": "Inaugurated in 2009",
        "openingHours": "07:00 – 17:00 Daily",
        "architecturalHighlights": [
          "Sun Square modeled after the Dong Son bronze drum with 54 stone pillars representing Vietnam’s 54 ethnic groups",
          "400-meter bamboo-lined ceremonial walking avenue",
          "Upper Sanctuary honoring the 18 Hung King dynasties and Emperor An Duong Vuong’s Oath Stone"
        ],
        "audioScript": [
          "Welcome to the Hung Kings Memorial Temple inside the 400-hectare National Historical and Cultural Park in Thu Duc City, eastern Ho Chi Minh City."
        ]
      },
      "fr": {
        "name": "Temple Mémorial des Rois Hung & Parc Historique National (Thu Duc)",
        "shortSummary": "Vaste complexe culturel de 400 hectares à Thu Duc inspiré des tambours de bronze de Dong Son et bordé d’une allée de bambous.",
        "historicalEra": "Inauguré en 2009",
        "openingHours": "07h00 – 17h00",
        "architecturalHighlights": [
          "Esplanade du tambour de bronze de Dong Son et 54 colonnes de pierre",
          "Allée piétonne bordée de bambous menant au sanctuaire supérieur"
        ],
        "audioScript": [
          "Bienvenue au Temple commémoratif des Rois Hung au cœur du Parc historique et culturel national de la ville de Thu Duc."
        ]
      },
      "zh": {
        "name": "守德市雄王纪念圣殿与民族历史文化公园",
        "shortSummary": "占地逾400公顷的宏伟历史文化建筑群，融合东山铜鼓图腾、天圆地方理念与400米翠竹步道。",
        "historicalEra": "2009年落成",
        "openingHours": "07:00 – 17:00",
        "architecturalHighlights": [
          "东山铜鼓造型太阳广场与象征54个民族的54根石柱",
          "长达400米的翠竹参道"
        ],
        "audioScript": [
          "欢迎来到位于胡志明市守德市的雄王纪念圣殿与民族历史文化公园。"
        ]
      },
      "ja": {
        "name": "フン王記念神殿と民族歴史文化公園（トゥードゥック市）",
        "shortSummary": "トゥードゥック市の400ヘクタールにおよぶ広大な歴史公園内に建つ神殿。ドンソン銅鼓を模した広場と美しい竹林の参道が魅力です。",
        "historicalEra": "2009年完成",
        "openingHours": "07:00 – 17:00",
        "architecturalHighlights": [
          "ドンソン銅鼓の文様を配した太陽広場と54民族の石柱",
          "400メートル続く緑豊かな竹林の遊歩道"
        ],
        "audioScript": [
          "トゥードゥック市にあるフン王記念神殿へようこそ。ドンソン銅鼓をモチーフにした壮大な建築と竹林の参道が広がっています。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "dvh-img-1",
        "type": "image",
        "url": "https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80",
        "caption": {
          "vi": "Đền Tưởng niệm các Vua Hùng và đường tre xanh tại TP. Thủ Đức",
          "en": "Hung Kings Memorial Temple and bamboo avenue in Thu Duc City",
          "fr": "Le Temple des Rois Hung à Thu Duc",
          "zh": "守德市雄王纪念圣殿",
          "ja": "トゥードゥック市のフン王記念神殿"
        },
        "yearOrSource": "Công viên Lịch sử – Văn hóa Dân tộc TP.HCM"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-td-1",
        "name": "Làng Nướng Gió Biển & Nem Nướng Thủ Đức",
        "cuisine": "Đặc sản Thủ Đức & Nam Bộ",
        "specialtyDishes": [
          "Nem nướng Thủ Đức cuốn bánh hỏi",
          "Gà nướng cơm lam",
          "Lẩu cá lăng măng chua"
        ],
        "rating": 4.7,
        "reviewCount": 1920,
        "priceRange": "70.000đ – 180.000đ",
        "lat": 10.8712,
        "lng": 106.8095,
        "address": "Xa lộ Hà Nội / Phường Long Bình, TP. Thủ Đức, TP.HCM",
        "openHours": "08:00 – 21:30",
        "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 50
  }
]"""
)


def build_chunks_for_site(
    site: HeritageSite,
    restaurants: Optional[list[Restaurant]] = None,
) -> list[HeritageKnowledgeChunk]:
    """Build multilingual RAG knowledge chunks for a heritage site and its nearby restaurants.

    Reusable by Admin CRUD (`POST /admin/sites`, `PUT /admin/sites/{id}`) for auto re-indexing.
    """
    chunks: list[HeritageKnowledgeChunk] = []
    translations = site.translations or {}

    for lang in ("vi", "en", "fr", "zh", "ja"):
        loc = translations.get(lang)
        if not isinstance(loc, dict):
            continue
        name = str(loc.get("name") or site.id)
        summary = str(loc.get("shortSummary") or loc.get("short_summary") or "")
        era = str(loc.get("historicalEra") or loc.get("historical_era") or "")
        hours = str(loc.get("openingHours") or loc.get("opening_hours") or "")
        highlights = loc.get("architecturalHighlights") or loc.get("architectural_highlights") or []
        audio_script = loc.get("audioScript") or loc.get("audio_script") or []

        summary_parts = [f"{name} ({site.city})."]
        if era:
            summary_parts.append(f"Giai đoạn/Era: {era}.")
        if summary:
            summary_parts.append(summary)
        if hours:
            summary_parts.append(f"Giờ mở cửa/Hours: {hours}.")
        if site.ticket_price:
            summary_parts.append(f"Giá vé/Ticket: {site.ticket_price}.")
        if site.address:
            summary_parts.append(f"Địa chỉ/Address: {site.address}.")

        chunks.append(
            HeritageKnowledgeChunk(
                id=str(uuid.uuid4()),
                site_id=site.id,
                language=lang,
                source_type="summary",
                content=" ".join(summary_parts).strip(),
                embedding_json=None,
            )
        )

        if audio_script:
            script_text = f"{name}: " + " ".join(str(s) for s in audio_script if s)
            chunks.append(
                HeritageKnowledgeChunk(
                    id=str(uuid.uuid4()),
                    site_id=site.id,
                    language=lang,
                    source_type="script",
                    content=script_text.strip(),
                    embedding_json=None,
                )
            )

        if highlights:
            arch_text = f"{name} — Kiến trúc / Architecture: " + "; ".join(str(h) for h in highlights if h)
            chunks.append(
                HeritageKnowledgeChunk(
                    id=str(uuid.uuid4()),
                    site_id=site.id,
                    language=lang,
                    source_type="architecture",
                    content=arch_text.strip(),
                    embedding_json=None,
                )
            )

    rest_list = restaurants if restaurants is not None else []
    if rest_list:
        vi_name = str((translations.get("vi") or {}).get("name") or site.id)
        en_name = str((translations.get("en") or {}).get("name") or vi_name)
        vi_lines = []
        en_lines = []
        for r in rest_list:
            dishes = ", ".join(r.specialty_dishes or [])
            slots = ", ".join(r.meal_slots or [])
            vi_lines.append(
                f"{r.name} ({r.cuisine}, đánh giá {r.rating}/5, giá {r.price_range}, mở cửa {r.open_hours}, khung giờ {slots}, món nổi bật: {dishes}, địa chỉ: {r.address})"
            )
            en_lines.append(
                f"{r.name} ({r.cuisine}, rating {r.rating}/5, price {r.price_range}, hours {r.open_hours}, meals {slots}, specialties: {dishes}, address: {r.address})"
            )
        chunks.append(
            HeritageKnowledgeChunk(
                id=str(uuid.uuid4()),
                site_id=site.id,
                language="vi",
                source_type="restaurant",
                content=f"Quán ăn ngon gần {vi_name} ({site.district or site.city}): " + " | ".join(vi_lines),
                embedding_json=None,
            )
        )
        chunks.append(
            HeritageKnowledgeChunk(
                id=str(uuid.uuid4()),
                site_id=site.id,
                language="en",
                source_type="restaurant",
                content=f"Recommended food & restaurants near {en_name} ({site.district or site.city}): "
                + " | ".join(en_lines),
                embedding_json=None,
            )
        )

    return chunks


async def _try_generate_gemini_embeddings(chunks: list[HeritageKnowledgeChunk]) -> int:
    """Optionally compute Gemini `text-embedding-004` vectors when GEMINI_API_KEY is configured."""
    if not settings.has_gemini:
        return 0
    try:
        from google import genai  # type: ignore

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        updated = 0
        for chunk in chunks:
            try:
                res = client.models.embed_content(
                    model=settings.GEMINI_EMBEDDING_MODEL,
                    contents=chunk.content[:2000],
                )
                emb = None
                if hasattr(res, "embeddings") and res.embeddings:
                    emb = list(res.embeddings[0].values)
                elif hasattr(res, "embedding") and res.embedding:
                    emb = list(res.embedding.values)
                if emb:
                    chunk.embedding_json = emb
                    updated += 1
            except Exception:
                continue
        return updated
    except Exception:
        return 0


async def _seed_default_accounts(session: AsyncSession) -> int:
    """Seed idempotent Admin + Demo Explorer accounts (with 3 verified HCMC journeys)."""
    created_accounts = 0

    # 1. Admin account
    admin_email = settings.DEFAULT_ADMIN_EMAIL.strip().lower()
    res = await session.execute(select(Profile).where(Profile.email == admin_email))
    admin = res.scalar_one_or_none()
    if admin is None:
        admin = Profile(
            id=str(uuid.uuid5(uuid.NAMESPACE_DNS, "admin.smartheritage.vn")),
            email=admin_email,
            password_hash=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
            display_name="Quản Trị Viên Di Sản",
            role="admin",
            preferred_language="vi",
            preferred_categories=["museum", "monument", "imperial"],
        )
        session.add(admin)
        created_accounts += 1

    # 2. Demo explorer account with realistic verified HCMC journeys for instant Leaderboard demo
    demo_email = settings.DEFAULT_DEMO_EMAIL.strip().lower()
    res = await session.execute(select(Profile).where(Profile.email == demo_email))
    demo = res.scalar_one_or_none()
    if demo is None:
        demo_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, "demo.smartheritage.vn"))
        demo = Profile(
            id=demo_id,
            email=demo_email,
            password_hash=hash_password(settings.DEFAULT_DEMO_PASSWORD),
            display_name="Minh Anh · Explorer",
            role="user",
            preferred_language="vi",
            preferred_categories=["monument", "museum", "ancient_town"],
            total_verified_walking_seconds=3780,
            total_verified_walking_meters=4280,
            verified_sites_count=3,
        )
        session.add(demo)
        await session.flush()
        created_accounts += 1

        now = datetime.now(timezone.utc)
        sample_journeys = [
            {
                "site_id": "dinh-doc-lap",
                "visited_at": now - timedelta(days=3),
                "walking_duration_seconds": 1560,
                "walking_distance_meters": 1820,
                "route_coordinates": [[10.7718, 106.6983], [10.7751, 106.6966], [10.7769, 106.6953]],
                "user_note": "Đi bộ từ Chợ Bến Thành tới Dinh Độc Lập, khuôn viên rợp bóng cây cổ thụ.",
                "user_rating": 5,
            },
            {
                "site_id": "nha-tho-duc-ba-sai-gon",
                "visited_at": now - timedelta(days=2),
                "walking_duration_seconds": 1140,
                "walking_distance_meters": 1280,
                "route_coordinates": [[10.7769, 106.6953], [10.7798, 106.6990]],
                "user_note": "Kiến trúc gạch đỏ Marseille nổi bật ngay trung tâm Quận 1.",
                "user_rating": 5,
            },
            {
                "site_id": "buu-dien-trung-tam-sai-gon",
                "visited_at": now - timedelta(days=1),
                "walking_duration_seconds": 1080,
                "walking_distance_meters": 1180,
                "route_coordinates": [[10.7798, 106.6990], [10.7800, 106.7000]],
                "user_note": "Mái vòm thép và bản đồ Sài Gòn cổ bên trong cực kỳ ấn tượng.",
                "user_rating": 5,
            },
        ]
        for j in sample_journeys:
            session.add(
                VisitedJourney(
                    id=str(uuid.uuid4()),
                    user_id=demo.id,
                    site_id=j["site_id"],
                    visited_at=j["visited_at"],
                    walking_duration_seconds=j["walking_duration_seconds"],
                    walking_distance_meters=j["walking_distance_meters"],
                    route_coordinates=j["route_coordinates"],
                    user_note=j["user_note"],
                    user_rating=j["user_rating"],
                    verification_status="verified",
                    verification_score=90.0,
                    verification_details={
                        "geofence_ok": True,
                        "speed_ok": True,
                        "continuity_ok": True,
                        "seed_record": True,
                    },
                )
            )
        for badge_code in ("first_step", "district1_master"):
            session.add(
                UserBadge(
                    id=str(uuid.uuid4()),
                    user_id=demo.id,
                    badge_code=badge_code,
                    unlocked_at=now - timedelta(days=1),
                )
            )

    return created_accounts


async def seed_database(
    session: Optional[AsyncSession] = None,
    *,
    generate_embeddings: bool = False,
    seed_demo_users: bool = True,
) -> dict[str, int]:
    """Idempotently seed all 20 HCMC sites, 26 restaurants, RAG chunks, 6 badges, and demo accounts."""
    owns_session = session is None
    if owns_session:
        await init_db()
        session = AsyncSessionLocal()

    assert session is not None
    stats = {
        "sites_upserted": 0,
        "restaurants_upserted": 0,
        "chunks_created": 0,
        "embeddings_generated": 0,
        "badges_upserted": 0,
        "accounts_created": 0,
    }

    try:
        # 1. Upsert 6 Badges
        for b in BADGE_DEFINITIONS:
            existing_badge = await session.get(Badge, b["code"])
            if existing_badge is None:
                session.add(Badge(**b))
            else:
                existing_badge.title_vi = b["title_vi"]
                existing_badge.title_en = b["title_en"]
                existing_badge.description_vi = b["description_vi"]
                existing_badge.icon_name = b["icon_name"]
                existing_badge.rule_config = b["rule_config"]
            stats["badges_upserted"] += 1

        # 2. Upsert 20 Heritage Sites + 26 Nearby Restaurants + Multilingual Chunks
        all_new_chunks: list[HeritageKnowledgeChunk] = []

        for raw in SEED_SITES_DATA:
            site = await session.get(HeritageSite, raw["id"])
            if site is None:
                site = HeritageSite(id=raw["id"])
                session.add(site)

            site.city = raw["city"]
            site.district = raw.get("district")
            site.lat = float(raw["lat"])
            site.lng = float(raw["lng"])
            site.category = raw["category"]
            site.unesco_recognized = bool(raw.get("unescoRecognized", False))
            site.national_special_monument = bool(raw.get("nationalSpecialMonument", False))
            site.rating = float(raw.get("rating", 4.5))
            site.review_count = int(raw.get("reviewCount", 0))
            site.ticket_price = raw.get("ticketPrice", "Miễn phí tham quan")
            site.address = raw.get("address")
            site.cover_image = raw.get("coverImage", "")
            site.recommended_visit_minutes = int(raw.get("recommendedVisitMinutes", 45))
            site.translations = raw.get("translations", {})
            site.media_gallery = raw.get("mediaGallery", [])
            stats["sites_upserted"] += 1

            site_restaurants: list[Restaurant] = []
            for raw_r in raw.get("nearbyRestaurants", []):
                rest = await session.get(Restaurant, raw_r["id"])
                if rest is None:
                    rest = Restaurant(id=raw_r["id"], site_id=site.id)
                    session.add(rest)
                rest.site_id = site.id
                rest.name = raw_r["name"]
                rest.cuisine = raw_r.get("cuisine", "")
                rest.specialty_dishes = list(raw_r.get("specialtyDishes", []))
                rest.rating = float(raw_r.get("rating", 4.5))
                rest.review_count = int(raw_r.get("reviewCount", 0))
                rest.price_range = raw_r.get("priceRange", "")
                rest.lat = float(raw_r["lat"])
                rest.lng = float(raw_r["lng"])
                rest.address = raw_r.get("address", "")
                rest.open_hours = raw_r.get("openHours", "07:00 – 21:00")
                rest.meal_slots = list(raw_r.get("mealSlots", ["lunch", "dinner"]))
                rest.image_url = raw_r.get("imageUrl", "")
                site_restaurants.append(rest)
                stats["restaurants_upserted"] += 1

            # Rebuild knowledge chunks cleanly for this site (idempotent)
            await session.execute(
                delete(HeritageKnowledgeChunk).where(HeritageKnowledgeChunk.site_id == site.id)
            )
            site_chunks = build_chunks_for_site(site, site_restaurants)
            for ch in site_chunks:
                session.add(ch)
            all_new_chunks.extend(site_chunks)
            stats["chunks_created"] += len(site_chunks)

        await session.flush()

        if generate_embeddings:
            stats["embeddings_generated"] = await _try_generate_gemini_embeddings(all_new_chunks)

        if seed_demo_users:
            stats["accounts_created"] = await _seed_default_accounts(session)

        await session.commit()
        return stats
    finally:
        if owns_session:
            await session.close()


async def ensure_seeded_if_empty(session: Optional[AsyncSession] = None) -> dict[str, int]:
    """Fast startup hook for `app/main.py` lifespan: seeds DB only if sites or badges are empty."""
    owns_session = session is None
    if owns_session:
        session = AsyncSessionLocal()
    assert session is not None
    try:
        site_count = (await session.execute(select(func.count(HeritageSite.id)))).scalar() or 0
        badge_count = (await session.execute(select(func.count(Badge.code)))).scalar() or 0
        if site_count >= 20 and badge_count >= 6:
            return {"skipped": 1, "sites_existing": int(site_count), "badges_existing": int(badge_count)}
        return await seed_database(session=session, generate_embeddings=False, seed_demo_users=True)
    finally:
        if owns_session:
            await session.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Smart Heritage Guide database.")
    parser.add_argument(
        "--embeddings",
        action="store_true",
        help="Generate Gemini text-embedding-004 vectors when GEMINI_API_KEY is configured.",
    )
    parser.add_argument(
        "--no-demo-users",
        action="store_true",
        help="Skip creating default admin and demo explorer accounts.",
    )
    args = parser.parse_args()
    stats = asyncio.run(
        seed_database(
            generate_embeddings=args.embeddings,
            seed_demo_users=not args.no_demo_users,
        )
    )
    print("Smart Heritage Guide Seed Completed:", json.dumps(stats, ensure_ascii=False))


if __name__ == "__main__":
    main()
