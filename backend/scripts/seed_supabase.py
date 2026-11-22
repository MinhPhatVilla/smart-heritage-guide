"""Idempotent database seeder for Smart Heritage Guide (Supabase Postgres & Local SQLite).

Seeds:
- All 50 Ho Chi Minh City heritage sites & 56 nearby curated restaurants (extracted from mobile dataset)
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
# Authentic 50 HCMC Heritage Sites & 56 Curated Nearby Restaurants (Standalone JSON)
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/20190923_Independence_Palace-10.jpg/1280px-20190923_Independence_Palace-10.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Đúng 11 giờ 30 phút ngày 30 tháng 4 năm 1975, nơi đây đã ghi dấu mốc son chói lọi khi xe tăng Quân Giải phóng tiến qua cổng chính, kết thúc chiến tranh và thống nhất non sông Việt Nam.",
          "Theo tư liệu bách khoa Wikipedia: Dinh Độc Lập là một tòa dinh thự tại Thành phố Hồ Chí Minh, từng là nơi ở và làm việc của Tổng thống Việt Nam Cộng hòa trước Sự kiện 30 tháng 4 năm 1975. Hiện nay, Dinh Độc Lập đã được Chính phủ Việt Nam xếp hạng là di tích quốc gia đặc biệt. Cơ quan quản lý di tích văn hóa Dinh Độc Lập có tên là Hội trường Thống Nhất thuộc Văn phòng Chính phủ. Dinh Độc Lập được Tổng thống Ngô Đình Diệm cho khởi công xây dựng ngày 1 tháng 7 năm 1962, sau khi dinh cũ từ thời Pháp thuộc bị hư hại do vụ đánh bom của hai phi công. Dinh được xây theo bản thiết kế của kiến trúc sư Ngô Viết Thụ, người Việt Nam đầu tiên đạt giải Khôi nguyên La Mã."
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
          "On April 30, 1975, tanks rolled through its main iron gates, marking the end of the Vietnam War and the reunification of the country.",
          "Historical context from Wikipedia: The Independence Palace (Vietnamese: Dinh Độc Lập), also publicly and officially known as the Reunification Convention Hall or simply Reunification Hall (Vietnamese: Hội trường Thống Nhất), is a historic landmark and government-owned public hall in Ho Chi Minh City (formerly known as Saigon), Vietnam. It was designed by architect Ngô Viết Thụ and was the presidential palace, home and workplace of the president of the Republic of Vietnam (South Vietnam)."
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
        "id": "wk-dinhdoclap-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/20190923_Independence_Palace-10.jpg/1280px-20190923_Independence_Palace-10.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Di tích Quốc gia Đặc biệt Dinh Độc Lập (Hội trường Thống Nhất) (Wikimedia Commons)",
          "en": "Real view of Independence Palace (Reunification Palace) (Wikimedia Commons)",
          "fr": "Vue réelle de Palais de la Réunification (Palais de l’Indépendance) (Wikimedia Commons)",
          "zh": "胡志明市独立宫（统一宫）实景照片（维基共享资源）",
          "ja": "統一会堂（旧独立宮殿）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-dinhdoclap-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Dinh_%C4%90%E1%BB%99c_L%E1%BA%ADp_v%C3%A0o_n%C3%A0m_2024.jpg/1280px-Dinh_%C4%90%E1%BB%99c_L%E1%BA%ADp_v%C3%A0o_n%C3%A0m_2024.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Di tích Quốc gia Đặc biệt Dinh Độc Lập (Hội trường Thống Nhất) (Ảnh 2)",
          "en": "Architecture & atmosphere at Independence Palace (Reunification Palace) (Photo 2)",
          "fr": "Architecture et ambiance à Palais de la Réunification (Palais de l’Indépendance) (Photo 2)",
          "zh": "胡志明市独立宫（统一宫）建筑与实景细节（图 2）",
          "ja": "統一会堂（旧独立宮殿）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-dinhdoclap-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/20190923_Independence_Palace-10.jpg/1280px-20190923_Independence_Palace-10.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Di tích Quốc gia Đặc biệt Dinh Độc Lập (Hội trường Thống Nhất) (Ảnh 3)",
          "en": "Architecture & atmosphere at Independence Palace (Reunification Palace) (Photo 3)",
          "fr": "Architecture et ambiance à Palais de la Réunification (Palais de l’Indépendance) (Photo 3)",
          "zh": "胡志明市独立宫（统一宫）建筑与实景细节（图 3）",
          "ja": "統一会堂（旧独立宮殿）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_07.JPG/1280px-Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_07.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Năm 1895, hai tháp chuông nhọn cao hơn 57 mét được xây thêm, bên trong treo sáu quả chuông đồng lớn nặng tổng cộng gần 30 tấn.",
          "Theo tư liệu bách khoa Wikipedia: Nhà thờ Chánh tòa Đức Bà Sài Gòn (hay Vương cung thánh đường chánh tòa Đức Mẹ Vô nhiễm Nguyên tội, tiếng Anh: Immaculate Conception Cathedral Basilica, tiếng Pháp: Cathédrale Notre-Dame de Saïgon, tiếng Latinh: Basilica Immaculatae Conceptionis), thường được gọi tắt là Nhà thờ Đức Bà, là nhà thờ chính tòa của Tổng giáo phận Sài Gòn. Nhà thờ không chỉ là biểu tượng của Công giáo ở Việt Nam, mà còn là một trong những công trình kiến trúc độc đáo của Thành phố Hồ Chí Minh và điểm đến nổi tiếng với du khách. Tên gọi ban đầu của nhà thờ là Nhà thờ Sài Gòn (tiếng Pháp: l'eglise de Saïgon), tên gọi Nhà thờ Đức Bà bắt đầu được sử dụng từ năm 1959 bằng việc đặt Tượng Đức Bà Hòa Bình trước khuôn viên."
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
          "Every brick on its exterior was shipped from Marseille, France, retaining its warm terracotta hue without plaster or moss for more than a century.",
          "Historical context from Wikipedia: The Cathedral Basilica of Our Lady of the Immaculate Conception in Saigon (Vietnamese: Vương cung thánh đường Chính tòa Đức Mẹ Vô nhiễm Nguyên tội Bà Sài Gòn) is a Roman Catholic minor basilica and cathedral located in Saigon, Vietnam. The cathedral was originally established by French Catholic priests who originally named it the Church of Saigon (French: l'Église de Saïgon), was constructed between 1877 and 1880."
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
        "id": "wk-nhathoducbas-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_07.JPG/1280px-Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_07.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Nhà thờ Chính tòa Đức Bà Sài Gòn (Wikimedia Commons)",
          "en": "Real view of Saigon Notre-Dame Cathedral Basilica (Wikimedia Commons)",
          "fr": "Vue réelle de Cathédrale Notre-Dame de Saïgon (Wikimedia Commons)",
          "zh": "西贡圣母大教堂（红教堂）实景照片（维基共享资源）",
          "ja": "サイゴン大教会（聖母マリア教会）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-nhathoducbas-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_07.JPG/1280px-Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_07.JPG?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Nhà thờ Chính tòa Đức Bà Sài Gòn (Ảnh 2)",
          "en": "Architecture & atmosphere at Saigon Notre-Dame Cathedral Basilica (Photo 2)",
          "fr": "Architecture et ambiance à Cathédrale Notre-Dame de Saïgon (Photo 2)",
          "zh": "西贡圣母大教堂（红教堂）建筑与实景细节（图 2）",
          "ja": "サイゴン大教会（聖母マリア教会）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-nhathoducbas-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_11.JPG/1280px-Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_11.JPG?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Nhà thờ Chính tòa Đức Bà Sài Gòn (Ảnh 3)",
          "en": "Architecture & atmosphere at Saigon Notre-Dame Cathedral Basilica (Photo 3)",
          "fr": "Architecture et ambiance à Cathédrale Notre-Dame de Saïgon (Photo 3)",
          "zh": "西贡圣母大教堂（红教堂）建筑与实景细节（图 3）",
          "ja": "サイゴン大教会（聖母マリア教会）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Saigon_Central_Post_Office_%2852681461470%29.jpg/1280px-Saigon_Central_Post_Office_%2852681461470%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Ngay bên hông Bưu điện là Đường sách Nguyễn Văn Bình – không gian văn hóa đọc yên bình bậc nhất trung tâm thành phố.",
          "Theo tư liệu bách khoa Wikipedia: Bưu điện Trung tâm Sài Gòn, còn gọi là Tòa nhà Bưu điện Thành phố Hồ Chí Minh, là một trong những công trình kiến trúc tiêu biểu tại Thành phố Hồ Chí Minh, tọa lạc tại số 2, Công trường Công xã Paris, phường Sài Gòn. Đây là tòa nhà được người Pháp xây dựng trong khoảng năm 1886–1891 với phong cách chiết trung theo đồ án thiết kế của kiến trúc sư Marie-Alfred Foulhoux. Nằm cạnh Nhà thờ Đức Bà, đây cũng là điểm tham quan cho khách du lịch khi đến Thành phố Hồ Chí Minh."
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
          "Inside the grand concourse, look up to admire the green wrought-iron vaulted ceiling and the two original 1892 cartographic murals depicting historic Saigon and Indochinese telegraph networks.",
          "Historical context from Wikipedia: The Saigon Central Post Office (Vietnamese: Bưu điện Trung tâm Sài Gòn, French: Poste centrale de Saïgon) is a post office in Paris Commune Square, Saigon ward, Ho Chi Minh City, next to the Saigon Notre-Dame Basilica, the city's cathedral."
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
        "id": "wk-buudientrung-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Saigon_Central_Post_Office_%2852681461470%29.jpg/1280px-Saigon_Central_Post_Office_%2852681461470%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Bưu điện Trung tâm Sài Gòn & Đường sách Nguyễn Văn Bình (Wikimedia Commons)",
          "en": "Real view of Saigon Central Post Office & Book Street (Wikimedia Commons)",
          "fr": "Vue réelle de Poste Centrale de Saïgon & Rue du Livre (Wikimedia Commons)",
          "zh": "西贡中央邮局与阮文平书街实景照片（维基共享资源）",
          "ja": "サイゴン中央郵便局とグエン・ヴァン・ビン本通りの実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-buudientrung-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Saigon_Central_Post_Office_2022.jpg/1280px-Saigon_Central_Post_Office_2022.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bưu điện Trung tâm Sài Gòn & Đường sách Nguyễn Văn Bình (Ảnh 2)",
          "en": "Architecture & atmosphere at Saigon Central Post Office & Book Street (Photo 2)",
          "fr": "Architecture et ambiance à Poste Centrale de Saïgon & Rue du Livre (Photo 2)",
          "zh": "西贡中央邮局与阮文平书街建筑与实景细节（图 2）",
          "ja": "サイゴン中央郵便局とグエン・ヴァン・ビン本通りの建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-buudientrung-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Cochinchine_Sa%C3%AFgon_La_poste_-_%28...%29Salles_Andr%C3%A9_btv1b530132026.jpg/1280px-Cochinchine_Sa%C3%AFgon_La_poste_-_%28...%29Salles_Andr%C3%A9_btv1b530132026.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bưu điện Trung tâm Sài Gòn & Đường sách Nguyễn Văn Bình (Ảnh 3)",
          "en": "Architecture & atmosphere at Saigon Central Post Office & Book Street (Photo 3)",
          "fr": "Architecture et ambiance à Poste Centrale de Saïgon & Rue du Livre (Photo 3)",
          "zh": "西贡中央邮局与阮文平书街建筑与实景细节（图 3）",
          "ja": "サイゴン中央郵便局とグエン・ヴァン・ビン本通りの建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Ho_Chi_Minh_Museum%2C_Saigon.jpg/1280px-Ho_Chi_Minh_Museum%2C_Saigon.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Ngày 5 tháng 6 năm 1911, từ chính bến cảng này, người thanh niên Nguyễn Tất Thành với tên gọi Văn Ba đã lên con tàu Amiral Latouche-Tréville, bắt đầu hành trình 30 năm bôn ba tìm đường cứu nước.",
          "Theo tư liệu bách khoa Wikipedia: Bến Nhà Rồng, tên chính thức là Bảo tàng Hồ Chí Minh - Chi nhánh Thành phố Hồ Chí Minh, là cụm di tích kiến trúc - bảo tàng nằm bên sông Sài Gòn, thuộc phường Xóm Chiếu (xưa là Quận 4), Thành phố Hồ Chí Minh. Nơi đây từng là trụ sở của hãng vận tải Messageries maritimes tại Sài Gòn từ năm 1864 đến năm 1955. Ủy ban nhân dân Thành phố Hồ Chí Minh chỉ đạo Sở Văn hóa, Thể thao và Du lịch đưa Bến Nhà Rồng vào danh sách danh thắng biểu trưng của thành phố."
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
        "id": "wk-bennharong-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Ho_Chi_Minh_Museum%2C_Saigon.jpg/1280px-Ho_Chi_Minh_Museum%2C_Saigon.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Di tích Lịch sử Bến Nhà Rồng (Bảo tàng Hồ Chí Minh) (Wikimedia Commons)",
          "en": "Real view of Nha Rong Wharf (Ho Chi Minh Museum) (Wikimedia Commons)",
          "fr": "Vue réelle de Quai Nha Rong (Musée Hô Chi Minh) (Wikimedia Commons)",
          "zh": "龙屋港历史遗迹（胡志明博物馆）实景照片（维基共享资源）",
          "ja": "ニャロン港（ホーチミン博物館）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-bennharong-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/20190923_Independence_Palace-13.jpg/1280px-20190923_Independence_Palace-13.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Di tích Lịch sử Bến Nhà Rồng (Bảo tàng Hồ Chí Minh) (Ảnh 2)",
          "en": "Architecture & atmosphere at Nha Rong Wharf (Ho Chi Minh Museum) (Photo 2)",
          "fr": "Architecture et ambiance à Quai Nha Rong (Musée Hô Chi Minh) (Photo 2)",
          "zh": "龙屋港历史遗迹（胡志明博物馆）建筑与实景细节（图 2）",
          "ja": "ニャロン港（ホーチミン博物館）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-bennharong-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Ben_Nha_Rong_ve_dem.JPG/1280px-Ben_Nha_Rong_ve_dem.JPG?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Di tích Lịch sử Bến Nhà Rồng (Bảo tàng Hồ Chí Minh) (Ảnh 3)",
          "en": "Architecture & atmosphere at Nha Rong Wharf (Ho Chi Minh Museum) (Photo 3)",
          "fr": "Architecture et ambiance à Quai Nha Rong (Musée Hô Chi Minh) (Photo 3)",
          "zh": "龙屋港历史遗迹（胡志明博物馆）建筑与实景细节（图 3）",
          "ja": "ニャロン港（ホーチミン博物館）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Lascar_Municipal_Theatre_%284608017466%29.jpg/1280px-Lascar_Municipal_Theatre_%284608017466%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Toàn bộ phù điêu mặt tiền, tượng nữ thần Caryatids nâng đỡ mái vòm và đá lát sảnh đều được chế tác tại Pháp rồi vận chuyển bằng đường biển sang Sài Gòn.",
          "Theo tư liệu bách khoa Wikipedia: Nhà hát Sài Gòn (Tiếng Anh: Saigon Opera House), thường được gọi ngắn gọn là Nhà hát Thành phố, là một nhà hát có mặt tiền hướng ra Công trường Lam Sơn và đường Đồng Khởi, phường Sài Gòn, Thành phố Hồ Chí Minh. được quản lý trực tiếp bởi Trung tâm Tổ chức Biểu diễn và Điện ảnh Thành phố (Saigon Concert) - đơn vị trực thuộc Sở Văn hóa và Thể thao Thành phố Hồ Chí Minh."
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
          "Designed by French architect Félix Olivier in the flamboyant style of the French Third Republic, its facade echoes the Petit Palais in Paris with intricate stone reliefs and statues of muses.",
          "Historical context from Wikipedia: Saigon Opera House (Vietnamese: Nhà hát Thành phố, French: Théâtre Municipal de Saïgon) is a municipal opera house in downtown Saigon, now Ho Chi Minh City, Vietnam. Like other French-built opera houses during French colonial period, including the ones in Hanoi and Haiphong, it is an example of French colonial architecture in Vietnam."
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
        "id": "wk-nhahatthanhp-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Lascar_Municipal_Theatre_%284608017466%29.jpg/1280px-Lascar_Municipal_Theatre_%284608017466%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Nhà hát Thành phố Hồ Chí Minh (Saigon Opera House) (Wikimedia Commons)",
          "en": "Real view of Saigon Opera House (Municipal Theatre) (Wikimedia Commons)",
          "fr": "Vue réelle de Opéra de Saïgon (Théâtre Municipal) (Wikimedia Commons)",
          "zh": "胡志明市大剧院（西贡歌剧院）实景照片（维基共享资源）",
          "ja": "サイゴン・オペラハウス（市民劇場）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-nhahatthanhp-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/23/%C3%93pera%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_02.JPG/1280px-%C3%93pera%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_02.JPG?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Nhà hát Thành phố Hồ Chí Minh (Saigon Opera House) (Ảnh 2)",
          "en": "Architecture & atmosphere at Saigon Opera House (Municipal Theatre) (Photo 2)",
          "fr": "Architecture et ambiance à Opéra de Saïgon (Théâtre Municipal) (Photo 2)",
          "zh": "胡志明市大剧院（西贡歌剧院）建筑与实景细节（图 2）",
          "ja": "サイゴン・オペラハウス（市民劇場）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-nhahatthanhp-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/Bi%E1%BB%83u_di%E1%BB%85n_t%E1%BA%A1i_nh%C3%A0_h%C3%A1t_l%E1%BB%9Bn_tp_HCM.jpg/1280px-Bi%E1%BB%83u_di%E1%BB%85n_t%E1%BA%A1i_nh%C3%A0_h%C3%A1t_l%E1%BB%9Bn_tp_HCM.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Nhà hát Thành phố Hồ Chí Minh (Saigon Opera House) (Ảnh 3)",
          "en": "Architecture & atmosphere at Saigon Opera House (Municipal Theatre) (Photo 3)",
          "fr": "Architecture et ambiance à Opéra de Saïgon (Théâtre Municipal) (Photo 3)",
          "zh": "胡志明市大剧院（西贡歌剧院）建筑与实景细节（图 3）",
          "ja": "サイゴン・オペラハウス（市民劇場）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Ho_Chi_Minh_City%2C_City_Hall%2C_2020-01_CN-02.jpg/1280px-Ho_Chi_Minh_City%2C_City_Hall%2C_2020-01_CN-02.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Năm 2020, tòa nhà đã được Bộ Văn hóa, Thể thao và Du lịch xếp hạng là Di tích Kiến trúc Nghệ thuật cấp Quốc gia và mở cửa đón du khách tham quan vào các dịp lễ lớn.",
          "Theo tư liệu bách khoa Wikipedia: Trụ sở Ủy ban nhân dân Thành phố Hồ Chí Minh là một trong những công trình kiến trúc cổ điển ở Thành phố Hồ Chí Minh, được xây dựng từ năm 1898 đến 1908, khánh thành năm 1909. Thời Pháp thuộc, tòa nhà này có tên là Hôtel de ville trong tiếng Pháp hay Dinh xã Tây trong tiếng Việt. Đến thời Việt Nam Cộng hòa, nó được gọi là Tòa đô chánh Sài Gòn vì là nơi làm việc và hội họp của chính quyền thủ đô."
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
          "Constructed between 1898 and 1909 by architect Fernand Gardès, this National Architectural Monument shines especially bright when illuminated at night.",
          "Historical context from Wikipedia: Ho Chi Minh City Hall, officially called the Ho Chi Minh City People's Council and People's Committee Head Office (Vietnamese: Trụ sở Hội đồng Nhân dân và Ủy ban Nhân dân Thành phố Hồ Chí Minh), is a city hall and the seat of the government of Ho Chi Minh City, Vietnam. It is located in downtown Ho Chi Minh City's Saigon ward, between Pasteur, Lý Tự Trọng, Đồng Khởi, and Lê Thánh Tôn Street, with its front facade facing Nguyễn Huệ Boulevard."
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
        "id": "wk-trusoubndtph-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Ho_Chi_Minh_City%2C_City_Hall%2C_2020-01_CN-02.jpg/1280px-Ho_Chi_Minh_City%2C_City_Hall%2C_2020-01_CN-02.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Trụ sở HĐND & UBND TP.HCM (Dinh Xã Tây) & Phố đi bộ Nguyễn Huệ (Wikimedia Commons)",
          "en": "Real view of Ho Chi Minh City Hall (People’s Committee Building) & Nguyen Hue Promenade (Wikimedia Commons)",
          "fr": "Vue réelle de Hôtel de Ville de Hô Chi Minh-Ville & Promenade Nguyen Hue (Wikimedia Commons)",
          "zh": "胡志明市人民委员会总部（市政厅）与阮惠步行街实景照片（维基共享资源）",
          "ja": "ホーチミン市人民委員会庁舎とグエンフエ歩行者天国の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-trusoubndtph-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4a/Ayuntamiento%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_01.JPG/1280px-Ayuntamiento%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_01.JPG?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Trụ sở HĐND & UBND TP.HCM (Dinh Xã Tây) & Phố đi bộ Nguyễn Huệ (Ảnh 2)",
          "en": "Architecture & atmosphere at Ho Chi Minh City Hall (People’s Committee Building) & Nguyen Hue Promenade (Photo 2)",
          "fr": "Architecture et ambiance à Hôtel de Ville de Hô Chi Minh-Ville & Promenade Nguyen Hue (Photo 2)",
          "zh": "胡志明市人民委员会总部（市政厅）与阮惠步行街建筑与实景细节（图 2）",
          "ja": "ホーチミン市人民委員会庁舎とグエンフエ歩行者天国の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-trusoubndtph-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Ayuntamiento%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_09.JPG/1280px-Ayuntamiento%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_09.JPG?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Trụ sở HĐND & UBND TP.HCM (Dinh Xã Tây) & Phố đi bộ Nguyễn Huệ (Ảnh 3)",
          "en": "Architecture & atmosphere at Ho Chi Minh City Hall (People’s Committee Building) & Nguyen Hue Promenade (Photo 3)",
          "fr": "Architecture et ambiance à Hôtel de Ville de Hô Chi Minh-Ville & Promenade Nguyen Hue (Photo 3)",
          "zh": "胡志明市人民委员会总部（市政厅）与阮惠步行街建筑与实景细节（图 3）",
          "ja": "ホーチミン市人民委員会庁舎とグエンフエ歩行者天国の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Ben_Thanh%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_01.JPG/1280px-Ben_Thanh%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_01.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Điểm nhấn kiến trúc nổi tiếng nhất là tháp đồng hồ ba mặt tại Cửa Nam, cùng những bức phù điêu gốm Biên Hòa đắp nổi hình bò, cá đuối, chuối gắn trên bốn cổng chợ từ năm 1952.",
          "Theo tư liệu bách khoa Wikipedia: Chợ Bến Thành là một ngôi chợ nằm tại phường Bến Thành, Thành phố Hồ Chí Minh. Chợ được khởi công xây dựng từ năm 1912, hình ảnh đồng hồ ở cửa nam của ngôi chợ này được xem là biểu tượng không chính thức của Thành phố Hồ Chí Minh. Chợ nằm giữa các đường Phan Bội Châu - Phan Chu Trinh - Lê Thánh Tôn - Công trường Quách Thị Trang tại phường Bến Thành với diện tích 13.056 m². Các ngành hàng kinh doanh chủ yếu ở đây bao gồm: quần áo, vải sợi, giày dép, thời trang, hàng thủ công mỹ nghệ, thực phẩm tươi sống, trái cây, hoa tươi,..."
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
          "Above the four main entrances, look for the historic 1952 Bien Hoa ceramic reliefs depicting traditional produce and livestock.",
          "Historical context from Wikipedia: Bến Thành Market (Vietnamese: Chợ Bến Thành) is located in the center of Ho Chi Minh City (Saigon), Vietnam in District 1. The market is one of the earliest surviving structures in the city and an important symbol of the city. Ben Thanh Market is a famous destination for many local and foreign tourists from all around the world. The market operates all year round and opens at around 6am every day until the official closing time at 6pm."
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
        "id": "wk-chobenthanh-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Ben_Thanh%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_01.JPG/1280px-Ben_Thanh%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_01.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Chợ Bến Thành – Biểu tượng Giao thương 110 Năm Sài Gòn (Wikimedia Commons)",
          "en": "Real view of Ben Thanh Market (Wikimedia Commons)",
          "fr": "Vue réelle de Marché Ben Thanh (Wikimedia Commons)",
          "zh": "滨城市场（西贡百年市集地标）实景照片（维基共享资源）",
          "ja": "ベンタイン市場の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chobenthanh-2",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/91/Ben_Thanh_market_2.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chợ Bến Thành – Biểu tượng Giao thương 110 Năm Sài Gòn (Ảnh 2)",
          "en": "Architecture & atmosphere at Ben Thanh Market (Photo 2)",
          "fr": "Architecture et ambiance à Marché Ben Thanh (Photo 2)",
          "zh": "滨城市场（西贡百年市集地标）建筑与实景细节（图 2）",
          "ja": "ベンタイン市場の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chobenthanh-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Ben_Thanh%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_01.JPG/1280px-Ben_Thanh%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_01.JPG?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chợ Bến Thành – Biểu tượng Giao thương 110 Năm Sài Gòn (Ảnh 3)",
          "en": "Architecture & atmosphere at Ben Thanh Market (Photo 3)",
          "fr": "Architecture et ambiance à Marché Ben Thanh (Photo 3)",
          "zh": "滨城市场（西贡百年市集地标）建筑与实景细节（图 3）",
          "ja": "ベンタイン市場の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/War_Remnants_Museum%2C_HCMC%2C_front.JPG/1280px-War_Remnants_Museum%2C_HCMC%2C_front.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Đặc biệt, phòng trưng bày \"Hồi niệm\" trên tầng lầu giới thiệu hàng trăm tác phẩm nhiếp ảnh của 134 phóng viên chiến trường từ 11 quốc gia, gửi gắm thông điệp nhân văn sâu sắc về giá trị của hòa bình.",
          "Theo tư liệu bách khoa Wikipedia: Bảo tàng Chứng tích Chiến tranh (War Remnants Museum) là một bảo tàng vì hòa bình ở số 28 đường Võ Văn Tần, phường Xuân Hòa, Thành phố Hồ Chí Minh. Bảo tàng Chứng tích Chiến tranh trực thuộc Sở Văn hóa và Thể thao Thành phố Hồ Chí Minh, là thành viên của hệ thống Bảo tàng vì hòa bình thế giới và Hội đồng các bảo tàng thế giới (ICOM). Từ nhiều năm qua, Bảo tàng Chứng tích Chiến tranh là một trong những điểm tham quan thu hút lượng khách đông nhất ở TPHCM và cả nước. Qua 50 năm hình thành và phát triển (1975 - 2025), Bảo tàng đã đón tiếp hơn 23 triệu lượt khách tham…"
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
          "Through more than 20,000 historical artifacts and the acclaimed Requiem photojournalism collection, the museum conveys a powerful message of remembrance and peace.",
          "Historical context from Wikipedia: The War Remnants Museum (Vietnamese: Bảo tàng chứng tích chiến tranh, IPA: [ɓâw tàŋ cɯ̌ŋ tǐʲc cǐən ʈ͡ʂāɲ]) is a war museum at 28 Võ Văn Tần Street, Xuân Hòa, Ho Chi Minh City, Vietnam. It contains exhibits relating to the First Indochina War and the Vietnam War."
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
        "id": "wk-baotangchung-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/War_Remnants_Museum%2C_HCMC%2C_front.JPG/1280px-War_Remnants_Museum%2C_HCMC%2C_front.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Bảo tàng Chứng tích Chiến tranh (War Remnants Museum) (Wikimedia Commons)",
          "en": "Real view of War Remnants Museum (Wikimedia Commons)",
          "fr": "Vue réelle de Musée des Vestiges de la Guerre (Wikimedia Commons)",
          "zh": "战争遗迹博物馆实景照片（维基共享资源）",
          "ja": "戦争証跡博物館の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangchung-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/War_Remnants_Museum%2C_HCMC%2C_front.JPG/1280px-War_Remnants_Museum%2C_HCMC%2C_front.JPG?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Chứng tích Chiến tranh (War Remnants Museum) (Ảnh 2)",
          "en": "Architecture & atmosphere at War Remnants Museum (Photo 2)",
          "fr": "Architecture et ambiance à Musée des Vestiges de la Guerre (Photo 2)",
          "zh": "战争遗迹博物馆建筑与实景细节（图 2）",
          "ja": "戦争証跡博物館の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangchung-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/Ho_Chi_Minh_City%2C_Vietnam%2C_M41_Walker_Bulldog.jpg/1280px-Ho_Chi_Minh_City%2C_Vietnam%2C_M41_Walker_Bulldog.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Chứng tích Chiến tranh (War Remnants Museum) (Ảnh 3)",
          "en": "Architecture & atmosphere at War Remnants Museum (Photo 3)",
          "fr": "Architecture et ambiance à Musée des Vestiges de la Guerre (Photo 3)",
          "zh": "战争遗迹博物馆建筑与实景细节（图 3）",
          "ja": "戦争証跡博物館の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/Vietnam_National_Museum_of_History%2C_Hanoi%2C_Vietnam.jpg/1280px-Vietnam_National_Museum_of_History%2C_Hanoi%2C_Vietnam.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Ngay cổng chính là Bảo tàng Lịch sử khánh thành năm 1929 theo thiết kế phong cách Đông Dương (Indochine) kinh điển của kiến trúc sư Ernest Hébrard, nơi đang bảo tồn hơn 43.000 hiện vật cùng 12 Bảo vật Quốc gia từ văn hóa Đông Sơn, Óc Eo, Chăm Pa đến triều Nguyễn.",
          "Theo tư liệu bách khoa Wikipedia: Bảo tàng Lịch sử Thành phố Hồ Chí Minh tọa lạc tại số 2 đường Nguyễn Bỉnh Khiêm, phường Sài Gòn, trong khuôn viên Thảo Cầm Viên Sài Gòn. Đây là nơi bảo tồn và trưng bày hàng chục ngàn hiện vật quý được sưu tầm trong và ngoài nước Việt Nam."
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
          "Designed in 1929 by French architect Ernest Hébrard, the museum building is a masterpiece of Indochine architecture and houses over 43,000 artifacts including twelve National Treasures.",
          "Historical context from Wikipedia: The Vietnam National Museum of History (Vietnamese: Viện Bảo tàng Lịch sử Việt Nam; French: Musée National d'Histoire du Viêt Nam) is in the Hoan Kiem district of Hanoi, Vietnam. The museum building was originally a museum of the French School of the Far East during French colonial rule. It was acquired by the government of North Vietnam in 1958 and the collections were expanded to cover eastern arts and national history."
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
        "id": "wk-baotanglichs-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/Vietnam_National_Museum_of_History%2C_Hanoi%2C_Vietnam.jpg/1280px-Vietnam_National_Museum_of_History%2C_Hanoi%2C_Vietnam.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Bảo tàng Lịch sử TP.HCM, Đền thờ Vua Hùng & Thảo Cầm Viên Sài Gòn (Wikimedia Commons)",
          "en": "Real view of Museum of Vietnamese History & Saigon Zoo and Botanical Gardens (Wikimedia Commons)",
          "fr": "Vue réelle de Musée d’Histoire du Vietnam & Jardin Botanique de Saïgon (Wikimedia Commons)",
          "zh": "胡志明市历史博物馆、雄王庙与西贡动植物园实景照片（维基共享资源）",
          "ja": "ベトナム歴史博物館・フン王廟・サイゴン動植物園の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotanglichs-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/57/Vietnam_History_Museum_HCMC.JPG/1280px-Vietnam_History_Museum_HCMC.JPG?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Lịch sử TP.HCM, Đền thờ Vua Hùng & Thảo Cầm Viên Sài Gòn (Ảnh 2)",
          "en": "Architecture & atmosphere at Museum of Vietnamese History & Saigon Zoo and Botanical Gardens (Photo 2)",
          "fr": "Architecture et ambiance à Musée d’Histoire du Vietnam & Jardin Botanique de Saïgon (Photo 2)",
          "zh": "胡志明市历史博物馆、雄王庙与西贡动植物园建筑与实景细节（图 2）",
          "ja": "ベトナム歴史博物館・フン王廟・サイゴン動植物園の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotanglichs-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/4G4A7248A_HDR.jpg/1280px-4G4A7248A_HDR.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Lịch sử TP.HCM, Đền thờ Vua Hùng & Thảo Cầm Viên Sài Gòn (Ảnh 3)",
          "en": "Architecture & atmosphere at Museum of Vietnamese History & Saigon Zoo and Botanical Gardens (Photo 3)",
          "fr": "Architecture et ambiance à Musée d’Histoire du Vietnam & Jardin Botanique de Saïgon (Photo 3)",
          "zh": "胡志明市历史博物馆、雄王庙与西贡动植物园建筑与实景细节（图 3）",
          "ja": "ベトナム歴史博物館・フン王廟・サイゴン動植物園の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/B%E1%BA%A3o_t%C3%A0ng_M%E1%BB%B9_thu%E1%BA%ADt_Tp_%28ki%E1%BA%BFn_tr%C3%BAc_t%E1%BB%95ng_th%E1%BB%83%29_%282%29.jpg/1280px-B%E1%BA%A3o_t%C3%A0ng_M%E1%BB%B9_thu%E1%BA%ADt_Tp_%28ki%E1%BA%BFn_tr%C3%BAc_t%E1%BB%95ng_th%E1%BB%83%29_%282%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Đây cũng là tòa nhà tư nhân đầu tiên tại Sài Gòn trang bị thang máy buồng gỗ chạm khắc tinh xảo, đồng thời lưu giữ hơn 22.000 tác phẩm mỹ thuật cùng các Bảo vật Quốc gia vô giá.",
          "Theo tư liệu bách khoa Wikipedia: Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh tọa lạc tại số 97 Phó Đức Chính, phường Bến Thành, Thành phố Hồ Chí Minh, Việt Nam; được thành lập năm 1987 và đi vào hoạt động năm 1991. Tòa nhà bao gồm 3 tầng, trưng bày các tác phẩm hội họa, điêu khắc, cổ vật có giá trị mỹ thuật cao. Đây là một trong những trung tâm mỹ thuật lớn nhất cả nước."
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
          "Combining French Art Deco stained-glass corridors with traditional Chinese-Vietnamese tiled roofs, the museum safeguards over 22,000 fine art pieces and National Treasures.",
          "Historical context from Wikipedia: Ho Chi Minh City Museum of Fine Arts (Vietnamese: Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh) is the major art museum of Ho Chi Minh City, Vietnam, and second in the country only to the Vietnam National Museum of Fine Arts in Hanoi."
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
        "id": "wk-baotangmythu-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/B%E1%BA%A3o_t%C3%A0ng_M%E1%BB%B9_thu%E1%BA%ADt_Tp_%28ki%E1%BA%BFn_tr%C3%BAc_t%E1%BB%95ng_th%E1%BB%83%29_%282%29.jpg/1280px-B%E1%BA%A3o_t%C3%A0ng_M%E1%BB%B9_thu%E1%BA%ADt_Tp_%28ki%E1%BA%BFn_tr%C3%BAc_t%E1%BB%95ng_th%E1%BB%83%29_%282%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Bảo tàng Mỹ thuật TP.HCM (Dinh thự Chú Hỏa) (Wikimedia Commons)",
          "en": "Real view of Ho Chi Minh City Museum of Fine Arts (Hua Bon Hoa Mansion) (Wikimedia Commons)",
          "fr": "Vue réelle de Musée des Beaux-Arts de Hô Chi Minh-Ville (Villa Hua Bon Hoa) (Wikimedia Commons)",
          "zh": "胡志明市美术馆（华本和家族古宅）实景照片（维基共享资源）",
          "ja": "ホーチミン市美術博物館（フア・ボン・ホア邸）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangmythu-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/B%E1%BA%A3o_t%C3%A0ng_M%E1%BB%B9_thu%E1%BA%ADt_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg/1280px-B%E1%BA%A3o_t%C3%A0ng_M%E1%BB%B9_thu%E1%BA%ADt_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Mỹ thuật TP.HCM (Dinh thự Chú Hỏa) (Ảnh 2)",
          "en": "Architecture & atmosphere at Ho Chi Minh City Museum of Fine Arts (Hua Bon Hoa Mansion) (Photo 2)",
          "fr": "Architecture et ambiance à Musée des Beaux-Arts de Hô Chi Minh-Ville (Villa Hua Bon Hoa) (Photo 2)",
          "zh": "胡志明市美术馆（华本和家族古宅）建筑与实景细节（图 2）",
          "ja": "ホーチミン市美術博物館（フア・ボン・ホア邸）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangmythu-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/B%E1%BA%A3o_t%C3%A0ng_M%E1%BB%B9_thu%E1%BA%ADt_TP.jpg/1280px-B%E1%BA%A3o_t%C3%A0ng_M%E1%BB%B9_thu%E1%BA%ADt_TP.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Mỹ thuật TP.HCM (Dinh thự Chú Hỏa) (Ảnh 3)",
          "en": "Architecture & atmosphere at Ho Chi Minh City Museum of Fine Arts (Hua Bon Hoa Mansion) (Photo 3)",
          "fr": "Architecture et ambiance à Musée des Beaux-Arts de Hô Chi Minh-Ville (Villa Hua Bon Hoa) (Photo 3)",
          "zh": "胡志明市美术馆（华本和家族古宅）建筑与实景细节（图 3）",
          "ja": "ホーチミン市美術博物館（フア・ボン・ホア邸）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/B%E1%BA%A3o_t%C3%A0ng_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh_7.jpg/1280px-B%E1%BA%A3o_t%C3%A0ng_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh_7.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Tại đây, quý khách sẽ được ngược dòng thời gian khám phá hơn 300 năm hình thành và phát triển của vùng đất Sài Gòn – Gia Định – Thành phố Hồ Chí Minh.",
          "Theo tư liệu bách khoa Wikipedia: Bảo tàng Thành phố Hồ Chí Minh là một bảo tàng ở Thành phố Hồ Chí Minh, Việt Nam, lạc tại số 65 Lý Tự Trọng, Phường Sài Gòn, Thành phố Hồ Chí Minh, trên một khu đất rộng gần 2 ha, giới hạn bởi các con đường Lý Tự Trọng, Pasteur, Lê Thánh Tôn và Nam Kỳ Khởi Nghĩa."
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
          "Its nine galleries tell the story of Saigon’s evolution from an ancient riverine settlement to Vietnam’s largest metropolis.",
          "Historical context from Wikipedia: Museum of Ho Chi Minh City (Vietnamese: Bảo tàng Thành phố Hồ Chí Minh), formerly known as Gia Long Palace (Vietnamese: Dinh Gia Long), is a historical site and museum in Ho Chi Minh City, Vietnam. The museum is situated at the corner of Lý Tự Trọng and Nam Kỳ Khởi Nghĩa streets, located on a 2-hectare block near the Independence Palace."
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
        "id": "wk-baotangtphcm-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/B%E1%BA%A3o_t%C3%A0ng_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh_7.jpg/1280px-B%E1%BA%A3o_t%C3%A0ng_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh_7.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Bảo tàng Thành phố Hồ Chí Minh (Dinh Gia Long) (Wikimedia Commons)",
          "en": "Real view of Museum of Ho Chi Minh City (Former Gia Long Palace) (Wikimedia Commons)",
          "fr": "Vue réelle de Musée de Hô Chi Minh-Ville (Ancien Palais Gia Long) (Wikimedia Commons)",
          "zh": "胡志明市博物馆（原嘉隆宫）实景照片（维基共享资源）",
          "ja": "ホーチミン市博物館（旧ザーロン宮殿）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangtphcm-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/B%E1%BA%A3o_t%C3%A0ng_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh_7.jpg/1280px-B%E1%BA%A3o_t%C3%A0ng_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh_7.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Thành phố Hồ Chí Minh (Dinh Gia Long) (Ảnh 2)",
          "en": "Architecture & atmosphere at Museum of Ho Chi Minh City (Former Gia Long Palace) (Photo 2)",
          "fr": "Architecture et ambiance à Musée de Hô Chi Minh-Ville (Ancien Palais Gia Long) (Photo 2)",
          "zh": "胡志明市博物馆（原嘉隆宫）建筑与实景细节（图 2）",
          "ja": "ホーチミン市博物館（旧ザーロン宮殿）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangtphcm-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/68/Bao_tang_5a.jpg/1280px-Bao_tang_5a.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Thành phố Hồ Chí Minh (Dinh Gia Long) (Ảnh 3)",
          "en": "Architecture & atmosphere at Museum of Ho Chi Minh City (Former Gia Long Palace) (Photo 3)",
          "fr": "Architecture et ambiance à Musée de Hô Chi Minh-Ville (Ancien Palais Gia Long) (Photo 3)",
          "zh": "胡志明市博物馆（原嘉隆宫）建筑与实景细节（图 3）",
          "ja": "ホーチミン市博物館（旧ザーロン宮殿）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Jade_Emperor_Pagoda_Saigon.jpg/1280px-Jade_Emperor_Pagoda_Saigon.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Giá trị nghệ thuật đặc sắc nhất của chùa là bộ sưu tập hơn 300 bức tượng thần phật, đặc biệt là các pho tượng làm bằng chất liệu giấy bồi (papier-mâché) rất hiếm gặp tại Việt Nam, cùng bức phù điêu gỗ chạm khắc cảnh Thập Điện Diêm Vương và điện thờ Kim Hoa Thánh Mẫu – 12 Bà Mụ.",
          "Theo tư liệu bách khoa Wikipedia: Chùa Ngọc Hoàng hay Chùa Phước Hải là tên thường gọi của Điện Ngọc Hoàng, tên chữ là Phước Hải Tự (người Pháp thì gọi là chùa Đa Kao); hiện tọa lạc tại số 73 đường Mai Thị Lựu, phường Tân Định, Thành phố Hồ Chí Minh, Việt Nam. Ngôi chùa vốn là điện thờ Ngọc Hoàng Thượng đế do một người tên Lưu Minh (pháp danh là Lưu Đạo Nguyên, người Quảng Đông, Trung Quốc) xây dựng vào khoảng đầu thế kỷ 20. Theo học giả Vương Hồng Sển, thì Lưu Minh là người \"ăn chay ròng, giữ đạo Minh Sư, lập chí quyết lật đổ nhà Mãn Thanh, xuất tiền tạo lập chùa vừa để thờ phượng vừa để làm nơi hội kín\"..."
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
          "Completed in 1906 and designated a National Architectural Monument, the pagoda houses over 300 antique figures crafted from papier-mâché, wood, and glazed ceramic.",
          "Historical context from Wikipedia: The Jade Emperor Pagoda (Vietnamese: Chùa Ngọc Hoàng; name: Ngọc Hoàng Điện, 玉皇殿, \"Jade Emperor Hall\", French: Temple Đa Kao, Pagode de l'Empereur de Jade) also known as the Phước Hải Tự (Vietnamese: Chùa Phước Hải; 福海寺, \"Luck Sea Temple\") is a Taoist, Buddhist, Confucian pagoda located at District 1, Ho Chi Minh City, Vietnam. It was founded by a Chinese merchant named Liu Daoyuan (劉道源, Lưu Minh or Lưu Đạo Nguyên), a Cantonese migrant."
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
        "id": "wk-chuangochoan-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Jade_Emperor_Pagoda_Saigon.jpg/1280px-Jade_Emperor_Pagoda_Saigon.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Chùa Ngọc Hoàng (Phước Hải Tự – Di tích Quốc gia) (Wikimedia Commons)",
          "en": "Real view of Jade Emperor Pagoda (Phuoc Hai Tu) (Wikimedia Commons)",
          "fr": "Vue réelle de Pagode de l’Empereur de Jade (Phuoc Hai Tu) (Wikimedia Commons)",
          "zh": "玉皇殿（福海寺 · 国家级建筑艺术遗迹）实景照片（维基共享资源）",
          "ja": "玉皇殿（フックハイ寺・国家建築芸術遺跡）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chuangochoan-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Ph%C6%B0%E1%BB%9Bc_H%E1%BA%A3i_T%E1%BB%B1.jpg/1280px-Ph%C6%B0%E1%BB%9Bc_H%E1%BA%A3i_T%E1%BB%B1.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chùa Ngọc Hoàng (Phước Hải Tự – Di tích Quốc gia) (Ảnh 2)",
          "en": "Architecture & atmosphere at Jade Emperor Pagoda (Phuoc Hai Tu) (Photo 2)",
          "fr": "Architecture et ambiance à Pagode de l’Empereur de Jade (Phuoc Hai Tu) (Photo 2)",
          "zh": "玉皇殿（福海寺 · 国家级建筑艺术遗迹）建筑与实景细节（图 2）",
          "ja": "玉皇殿（フックハイ寺・国家建築芸術遺跡）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chuangochoan-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Jade_Emperor_Pagoda_Saigon.jpg/1280px-Jade_Emperor_Pagoda_Saigon.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chùa Ngọc Hoàng (Phước Hải Tự – Di tích Quốc gia) (Ảnh 3)",
          "en": "Architecture & atmosphere at Jade Emperor Pagoda (Phuoc Hai Tu) (Photo 3)",
          "fr": "Architecture et ambiance à Pagode de l’Empereur de Jade (Phuoc Hai Tu) (Photo 3)",
          "zh": "玉皇殿（福海寺 · 国家级建筑艺术遗迹）建筑与实景细节（图 3）",
          "ja": "玉皇殿（フックハイ寺・国家建築芸術遺跡）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Mi%E1%BA%BFu_th%E1%BB%9D_L%C3%AA_V%C4%83n_Duy%E1%BB%87t.jpg/1280px-Mi%E1%BA%BFu_th%E1%BB%9D_L%C3%AA_V%C4%83n_Duy%E1%BB%87t.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Quần thể kiến trúc gồm Cổng Tam quan Thượng Công Miếu uy nghiêm, khu mộ hình lưng rùa, Vườn Bia, Nhà Võ Ca và Chính điện chạm trổ rồng phượng sơn son thếp vàng theo thức kiến trúc cung đình Huế kết hợp dân gian Nam Bộ.",
          "Theo tư liệu bách khoa Wikipedia: Lăng Tả quân Lê Văn Duyệt (tên chữ: Thượng Công Miếu, chữ Hán: 上公廟, tục gọi: Lăng Ông - Bà Chiểu) là quần thể lăng mộ và miếu thờ Tả quân Lê Văn Duyệt (1764–1832), kèm phần mộ song táng của phu nhân Đỗ Thị Phẫn. Di tích nằm tại số 1 đường Vũ Tùng, phường Gia Định, Thành phố Hồ Chí Minh, Việt Nam. Cổng phía tây của khu lăng mở ra số 126 đường Lê Văn Duyệt. Quần thể có bố cục theo trục chính: từ tam quan (ghi \"Thượng Công Miếu\") qua nhà bia, khu mộ song táng, rồi đến miếu thờ (tiền điện – trung điện – chính điện); hai dãy Đông lang và Tây lang bố trí đối xứng theo trục. Nhiều chi tiết kiến trúc và trang trí gắn với phong cách mỹ thuật triều Nguyễn, trong đó có các mảng khảm sành sứ."
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
          "General Le Van Duyet served twice as Viceroy of Gia Dinh Citadel in the early 19th century, transforming Southern Vietnam into a prosperous region.",
          "Historical context from Wikipedia: Tomb of Lê Văn Duyệt (Vietnamese: Lăng Tả quân Lê Văn Duyệt), also known as Tomb of the Marshal in Ba Chieu (Lăng Ông - Bà Chiểu), is a Vietnamese tomb located in Bình Thạnh District, Ho Chi Minh City, Vietnam. The tomb was originally built for Marshal Lê Văn Duyệt and his wife but later became some other Nguyễn dynasty's mandarins worship house."
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
        "id": "wk-langongbachi-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Mi%E1%BA%BFu_th%E1%BB%9D_L%C3%AA_V%C4%83n_Duy%E1%BB%87t.jpg/1280px-Mi%E1%BA%BFu_th%E1%BB%9D_L%C3%AA_V%C4%83n_Duy%E1%BB%87t.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Di tích Quốc gia Lăng Tả quân Lê Văn Duyệt (Lăng Ông Bà Chiểu) (Wikimedia Commons)",
          "en": "Real view of Mausoleum of General Le Van Duyet (Lang Ong Ba Chieu) (Wikimedia Commons)",
          "fr": "Vue réelle de Mausolée du Général Le Van Duyet (Lang Ong Ba Chieu) (Wikimedia Commons)",
          "zh": "黎文悦将军陵（巴沼翁陵 · 国家级历史文化遗迹）实景照片（维基共享资源）",
          "ja": "レ・ヴァン・ズエット将軍廟（バーチエウ廟）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-langongbachi-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/vi/thumb/0/03/C%E1%BB%95ng_ch%C3%ADnh_L%C4%83ng_%C3%94ng_B%C3%A0_Chi%E1%BB%83u_n%C4%83m_2015.jpg/1280px-C%E1%BB%95ng_ch%C3%ADnh_L%C4%83ng_%C3%94ng_B%C3%A0_Chi%E1%BB%83u_n%C4%83m_2015.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Di tích Quốc gia Lăng Tả quân Lê Văn Duyệt (Lăng Ông Bà Chiểu) (Ảnh 2)",
          "en": "Architecture & atmosphere at Mausoleum of General Le Van Duyet (Lang Ong Ba Chieu) (Photo 2)",
          "fr": "Architecture et ambiance à Mausolée du Général Le Van Duyet (Lang Ong Ba Chieu) (Photo 2)",
          "zh": "黎文悦将军陵（巴沼翁陵 · 国家级历史文化遗迹）建筑与实景细节（图 2）",
          "ja": "レ・ヴァン・ズエット将軍廟（バーチエウ廟）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-langongbachi-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/L%C4%83ng_L%C3%AA_V%C4%83n_Duy%E1%BB%87t.jpg/1280px-L%C4%83ng_L%C3%AA_V%C4%83n_Duy%E1%BB%87t.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Di tích Quốc gia Lăng Tả quân Lê Văn Duyệt (Lăng Ông Bà Chiểu) (Ảnh 3)",
          "en": "Architecture & atmosphere at Mausoleum of General Le Van Duyet (Lang Ong Ba Chieu) (Photo 3)",
          "fr": "Architecture et ambiance à Mausolée du Général Le Van Duyet (Lang Ong Ba Chieu) (Photo 3)",
          "zh": "黎文悦将军陵（巴沼翁陵 · 国家级历史文化遗迹）建筑与实景细节（图 3）",
          "ja": "レ・ヴァン・ズエット将軍廟（バーチエウ廟）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/Thien_Hau_Pagoda_%2810017896294%29.jpg/1280px-Thien_Hau_Pagoda_%2810017896294%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Ngước nhìn lên khoảng sân Thiên Tỉnh đón nắng, quý khách sẽ thấy hàng trăm vòng nhang xoắn ốc treo lơ lửng tỏa hương trầm ấm áp, phía trên mái ngói là những quần thể tượng gốm Cây Mai cổ xưa vô cùng tinh xảo.",
          "Theo tư liệu bách khoa Wikipedia: Hội quán Tuệ Thành (chữ Hán: 穗城會館), thường được gọi là Miếu Thiên Hậu hay Chùa Bà Chợ Lớn, là một cơ sở tín ngưỡng thờ Thiên Hậu Thánh mẫu tọa lạc tại số 710 đường Nguyễn Trãi, phường Chợ Lớn (Quận 5 cũ), Thành phố Hồ Chí Minh. Đây là một trong những nơi thờ tự cổ nhất của người Hoa đã gây dựng trên đất Chợ Lớn xưa."
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
          "Look up in the open courtyard to see hundreds of suspended spiral incense coils carrying the prayers of visitors, framed by antique Cay Mai ceramic dioramas along the roof ridges.",
          "Historical context from Wikipedia: This is a list of Mazu temples, dedicated to Mazu (媽祖) also known as Tian Shang Sheng Mu (天上聖母) or Tian Hou (天后) Chinese Goddess of Sea and Patron Deity of fishermen, sailors and any occupations related to sea/ocean, also regarded as Ancestral Deity for the Lin (林) Clan."
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
        "id": "wk-chuabathienh-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/Thien_Hau_Pagoda_%2810017896294%29.jpg/1280px-Thien_Hau_Pagoda_%2810017896294%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Hội quán Tuệ Thành – Chùa Bà Thiên Hậu Chợ Lớn (Wikimedia Commons)",
          "en": "Real view of Thien Hau Temple (Tue Thanh Assembly Hall – Cho Lon) (Wikimedia Commons)",
          "fr": "Vue réelle de Temple de la Dame Céleste Thien Hau (Congrégation Tue Thanh – Cho Lon) (Wikimedia Commons)",
          "zh": "堤岸穗城会馆（天后宫 · 国家级建筑艺术遗迹）实景照片（维基共享资源）",
          "ja": "ティエンハウ廟（穂城会館・チョロン中華街）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chuabathienh-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/59/2014-10-14_Chinatown_SF_CA_USA_002.JPG/1280px-2014-10-14_Chinatown_SF_CA_USA_002.JPG?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Hội quán Tuệ Thành – Chùa Bà Thiên Hậu Chợ Lớn (Ảnh 2)",
          "en": "Architecture & atmosphere at Thien Hau Temple (Tue Thanh Assembly Hall – Cho Lon) (Photo 2)",
          "fr": "Architecture et ambiance à Temple de la Dame Céleste Thien Hau (Congrégation Tue Thanh – Cho Lon) (Photo 2)",
          "zh": "堤岸穗城会馆（天后宫 · 国家级建筑艺术遗迹）建筑与实景细节（图 2）",
          "ja": "ティエンハウ廟（穂城会館・チョロン中華街）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chuabathienh-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/A_Ma_Temple_200907.jpg/1280px-A_Ma_Temple_200907.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Hội quán Tuệ Thành – Chùa Bà Thiên Hậu Chợ Lớn (Ảnh 3)",
          "en": "Architecture & atmosphere at Thien Hau Temple (Tue Thanh Assembly Hall – Cho Lon) (Photo 3)",
          "fr": "Architecture et ambiance à Temple de la Dame Céleste Thien Hau (Congrégation Tue Thanh – Cho Lon) (Photo 3)",
          "zh": "堤岸穗城会馆（天后宫 · 国家级建筑艺术遗迹）建筑与实景细节（图 3）",
          "ja": "ティエンハウ廟（穂城会館・チョロン中華街）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/1/17/US_Embassy%2C_Saigon%2C_January_1968_%28Colorized%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
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
          "Từ chính căn hầm bí mật ngay giữa trung tâm đô thị này, Đội 5 Biệt động Sài Gòn đã nhận vũ khí xuất kích tiến đánh Dinh Độc Lập trong đêm giao thừa Tết Mậu Thân 1968.",
          "Theo tư liệu bách khoa Wikipedia: Biệt động Sài Gòn là danh xưng của lực lượng đặc công quân Giải phóng miền Nam, chuyên làm nhiệm vụ tập kích nhằm vào các cơ sở của quân đội Hoa Kỳ và Việt Nam Cộng hòa cũng như các công trình công cộng trong môi trường đô thị tại Sài Gòn trong thời kỳ Chiến tranh Việt Nam."
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
        "id": "wk-hamchuavukhi-1",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/17/US_Embassy%2C_Saigon%2C_January_1968_%28Colorized%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Di tích Lịch sử Quốc gia Hầm chứa Vũ khí Biệt động Sài Gòn (Wikimedia Commons)",
          "en": "Real view of Saigon Commando Secret Weapons Bunker (District 3) (Wikimedia Commons)",
          "fr": "Vue réelle de Cache d’Armes Secrète des Commandos de Saïgon (3e Arr.) (Wikimedia Commons)",
          "zh": "西贡别动队秘密军火地窖国家遗迹实景照片（维基共享资源）",
          "ja": "サイゴン別動隊の秘密武器地下壕（国家歴史遺跡）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-hamchuavukhi-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Nga_tu_Truong_Dinh%2C_nguyen_dinh_chieu-_ph%C6%B0%E1%BB%9Dng_6%2C_Qu%E1%BA%ADn_3%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg/1280px-Nga_tu_Truong_Dinh%2C_nguyen_dinh_chieu-_ph%C6%B0%E1%BB%9Dng_6%2C_Qu%E1%BA%ADn_3%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Di tích Lịch sử Quốc gia Hầm chứa Vũ khí Biệt động Sài Gòn (Ảnh 2)",
          "en": "Architecture & atmosphere at Saigon Commando Secret Weapons Bunker (District 3) (Photo 2)",
          "fr": "Architecture et ambiance à Cache d’Armes Secrète des Commandos de Saïgon (3e Arr.) (Photo 2)",
          "zh": "西贡别动队秘密军火地窖国家遗迹建筑与实景细节（图 2）",
          "ja": "サイゴン別動隊の秘密武器地下壕（国家歴史遺跡）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-hamchuavukhi-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Nga_tu_truong_Dinh_va_Ng_dinh_Chieu%2C_Chung_cu_Nguyen_Dinh_Chieu%2C_q3%2C_hcmvn_-_panoramio.jpg/1280px-Nga_tu_truong_Dinh_va_Ng_dinh_Chieu%2C_Chung_cu_Nguyen_Dinh_Chieu%2C_q3%2C_hcmvn_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Di tích Lịch sử Quốc gia Hầm chứa Vũ khí Biệt động Sài Gòn (Ảnh 3)",
          "en": "Architecture & atmosphere at Saigon Commando Secret Weapons Bunker (District 3) (Photo 3)",
          "fr": "Architecture et ambiance à Cache d’Armes Secrète des Commandos de Saïgon (3e Arr.) (Photo 3)",
          "zh": "西贡别动队秘密军火地窖国家遗迹建筑与实景细节（图 3）",
          "ja": "サイゴン別動隊の秘密武器地下壕（国家歴史遺跡）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/C%E1%BB%A7_Chi_tunnels_entrance.JPG/1280px-C%E1%BB%A7_Chi_tunnels_entrance.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Bên trong địa đạo có đầy đủ phòng họp chỉ huy, trạm phẫu thuật quân y, kho lương thực, giếng nước và đặc biệt là hệ thống bếp Hoàng Cầm dẫn khói tan là là trên mặt đất.",
          "Theo tư liệu bách khoa Wikipedia: Địa đạo Củ Chi là một hệ thống phòng thủ trong lòng đất ở xã An Nhơn Tây, cách trung tâm Thành phố Hồ Chí Minh 69 km về hướng Tây-Bắc. Hệ thống này được quân kháng chiến Việt Minh và Mặt trận Dân tộc Giải phóng miền Nam Việt Nam đào trong thời kỳ Chiến tranh Đông Dương và Chiến tranh Việt Nam. Sau chiến tranh, khu địa đạo Củ Chi trở thành di tích lịch sử cấp quốc gia. Năm 2015, khu di tích lịch sử địa đạo Củ Chi đón nhận danh hiệu Anh hùng Lao động do có thành tích đặc biệt xuất sắc trong lao động, sáng tạo. Trong 20 năm hoạt động, khu di tích đón hơn 20 triệu lượt khách trong và ngoài nước tới tham quan, tìm hiểu. Ngày 12 tháng 2 năm 2016, khu di tích đón nhận Bằng xếp hạng Di tích quốc gia đặc biệt.…"
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
          "Spanning more than 250 kilometers across three subterranean levels, this hand-dug underground village contained living quarters, hospitals, workshops, and smokeless Hoang Cam kitchens.",
          "Historical context from Wikipedia: The tunnels of Củ Chi (Vietnamese: Địa đạo Củ Chi) are an immense network of connecting tunnels located in the Củ Chi District of Ho Chi Minh City (Saigon), Vietnam, and are part of a much larger network of tunnels that underlie much of the country. The Củ Chi tunnels were the location of several military campaigns during the Vietnam War, and were the Viet Cong's base of operations for the Tết Offensive in 1968."
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
        "id": "wk-diadaocuchib-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/C%E1%BB%A7_Chi_tunnels_entrance.JPG/1280px-C%E1%BB%A7_Chi_tunnels_entrance.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Di tích Quốc gia Đặc biệt Địa đạo Củ Chi & Đền Tưởng niệm Bến Dược (Wikimedia Commons)",
          "en": "Real view of Cu Chi Tunnels & Ben Duoc Memorial Temple (Special National Monument) (Wikimedia Commons)",
          "fr": "Vue réelle de Tunnels de Cu Chi & Temple Mémorial de Ben Duoc (Wikimedia Commons)",
          "zh": "古芝地道与本药纪念祠（越南特别国家级历史遗迹）实景照片（维基共享资源）",
          "ja": "クチトンネルとベンズオック慰霊神殿（特別国家歴史遺跡）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-diadaocuchib-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/W_C%E1%BB%A7_Chi_%C4%90%E1%BB%8Ba_%C4%91%E1%BA%A1o_C%E1%BB%A7_Chi_ng%E1%BB%A5y_trang.JPG/1280px-W_C%E1%BB%A7_Chi_%C4%90%E1%BB%8Ba_%C4%91%E1%BA%A1o_C%E1%BB%A7_Chi_ng%E1%BB%A5y_trang.JPG?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Di tích Quốc gia Đặc biệt Địa đạo Củ Chi & Đền Tưởng niệm Bến Dược (Ảnh 2)",
          "en": "Architecture & atmosphere at Cu Chi Tunnels & Ben Duoc Memorial Temple (Special National Monument) (Photo 2)",
          "fr": "Architecture et ambiance à Tunnels de Cu Chi & Temple Mémorial de Ben Duoc (Photo 2)",
          "zh": "古芝地道与本药纪念祠（越南特别国家级历史遗迹）建筑与实景细节（图 2）",
          "ja": "クチトンネルとベンズオック慰霊神殿（特別国家歴史遺跡）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-diadaocuchib-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/A_few_rounds_in_an_M60._%2812110611696%29.jpg/1280px-A_few_rounds_in_an_M60._%2812110611696%29.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Di tích Quốc gia Đặc biệt Địa đạo Củ Chi & Đền Tưởng niệm Bến Dược (Ảnh 3)",
          "en": "Architecture & atmosphere at Cu Chi Tunnels & Ben Duoc Memorial Temple (Special National Monument) (Photo 3)",
          "fr": "Architecture et ambiance à Tunnels de Cu Chi & Temple Mémorial de Ben Duoc (Photo 3)",
          "zh": "古芝地道与本药纪念祠（越南特别国家级历史遗迹）建筑与实景细节（图 3）",
          "ja": "クチトンネルとベンズオック慰霊神殿（特別国家歴史遺跡）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/e/e5/Mangrove_in_Can_Gio_forest.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
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
          "Giữa lòng rừng ngập mặn chằng chịt sông rạch này là Căn cứ Rừng Sác – nơi tái hiện sinh động cuộc sống và chiến đấu quả cảm của các chiến sĩ Đoàn 10 Đặc công Rừng Sác.",
          "Theo tư liệu bách khoa Wikipedia: Khu dự trữ sinh quyển Cần Giờ còn gọi là Rừng Sác là một quần thể gồm các loài động, thực vật rừng trên cạn và thủy sinh, được hình thành trên vùng châu thổ rộng lớn của các cửa sông Đồng Nai, sông Sài Gòn và sông Vàm Cỏ. UNESCO đã công nhận đây là khu dự trữ sinh quyển thế giới vào ngày 21/1/2000 với hệ động thực vật đa dạng độc đáo điển hình của vùng ngập mặn. Nơi đây được công nhận là một khu du lịch trọng điểm quốc gia Việt Nam"
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
          "Welcome to Can Gio Mangrove Biosphere Reserve, recognized by UNESCO in 2000 as Vietnam’s first World Biosphere Reserve and home to the historic Rung Sac Base.",
          "Historical context from Wikipedia: Cần Giờ Biosphere Reserve (Vietnamese: Khu dự trữ sinh quyển rừng ngập mặn Cần Giờ) or simply known as Mangrove Forest (Rừng Sác) is a wetland located at the eponymous coastal district that 40 km southeast away from the centre of Ho Chi Minh City. This reserve has been listed as a biosphere reserve by UNESCO. The site is an important wildlife sanctuary in Vietnam as it is characterized by a wetland biosystem dominated by mangrove and many rare species."
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
        "id": "wk-khudutrusinh-1",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e5/Mangrove_in_Can_Gio_forest.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Khu Dự trữ Sinh quyển Thế giới Cần Giờ (UNESCO) & Di tích Căn cứ Rừng Sác (Wikimedia Commons)",
          "en": "Real view of Can Gio Mangrove Biosphere Reserve (UNESCO) & Rung Sac Historic Base (Wikimedia Commons)",
          "fr": "Vue réelle de Réserve de Biosphère de la Mangrove de Can Gio (UNESCO) & Base de Rung Sac (Wikimedia Commons)",
          "zh": "芹椰红树林世界生物圈保护区（UNESCO）与森林萨革命根据地实景照片（维基共享资源）",
          "ja": "カンザー・マングローブ生物圏保存地域（ユネスコ）とルンサック基地遺跡の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-khudutrusinh-2",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/97/Lo_ren_river.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Khu Dự trữ Sinh quyển Thế giới Cần Giờ (UNESCO) & Di tích Căn cứ Rừng Sác (Ảnh 2)",
          "en": "Architecture & atmosphere at Can Gio Mangrove Biosphere Reserve (UNESCO) & Rung Sac Historic Base (Photo 2)",
          "fr": "Architecture et ambiance à Réserve de Biosphère de la Mangrove de Can Gio (UNESCO) & Base de Rung Sac (Photo 2)",
          "zh": "芹椰红树林世界生物圈保护区（UNESCO）与森林萨革命根据地建筑与实景细节（图 2）",
          "ja": "カンザー・マングローブ生物圏保存地域（ユネスコ）とルンサック基地遺跡の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-khudutrusinh-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e5/Mangrove_in_Can_Gio_forest.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Khu Dự trữ Sinh quyển Thế giới Cần Giờ (UNESCO) & Di tích Căn cứ Rừng Sác (Ảnh 3)",
          "en": "Architecture & atmosphere at Can Gio Mangrove Biosphere Reserve (UNESCO) & Rung Sac Historic Base (Photo 3)",
          "fr": "Architecture et ambiance à Réserve de Biosphère de la Mangrove de Can Gio (UNESCO) & Base de Rung Sac (Photo 3)",
          "zh": "芹椰红树林世界生物圈保护区（UNESCO）与森林萨革命根据地建筑与实景细节（图 3）",
          "ja": "カンザー・マングローブ生物圏保存地域（ユネスコ）とルンサック基地遺跡の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/ChuaGiacLam02.jpg/1280px-ChuaGiacLam02.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Bên trong chùa hiện bảo tồn 118 pho tượng cổ từ thế kỷ 18 – 19 cùng hơn 7.000 chiếc đĩa gốm cổ gắn dọc theo bờ mái và các ngôi bảo tháp.",
          "Theo tư liệu bách khoa Wikipedia: Chùa Giác Lâm (tiếng Trung: 覺林寺:; Hán-Việt: Giác Lâm tự) còn có các tên khác: Cẩm Sơn, Sơn Can hay Cẩm Đệm; là một trong những ngôi chùa cổ nhất của Thành phố Hồ Chí Minh. Đây chính là tổ đình của phái Thiền Lâm Tế tông ở Nam Bộ. Chùa Giác Lâm được cư sĩ Lý Thụy Long, người Minh Hương, quyên tiền xây dựng vào mùa xuân năm Giáp Tý (1744) đời chúa Nguyễn Phúc Khoát. Ban đầu chùa có tên là Sơn Can (sơn là núi, can là gò nông), về sau còn được gọi là Cẩm Sơn do chùa tọa lạc trên gò Cẩm Sơn. Ngoài ra, chùa còn có tên là Cẩm Đệm vì cư sĩ Thụy Long có tên riêng là Cẩm, chuyên nghề đan đệm bán, người địa phương gọi là ông Cẩm Đệm."
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
          "Welcome to Giac Lam Pagoda in Tan Binh District, founded in 1744 and celebrated as the oldest surviving Buddhist temple in Ho Chi Minh City.",
          "Historical context from Wikipedia: Giác Lâm Temple (Vietnamese: Chùa Giác Lâm; chữ Hán: 覺林寺, Giác Lâm tự) is a historic Buddhist temple in Ho Chi Minh City (Saigon), the largest city in Vietnam. Built in 1744, it is one of the oldest temples in the city. It was officially listed as a state-cultural and historical site by the Ministry of Culture, Sports and Tourism in Vietnam on November 16, 1988, under Decision 1288VH/QĐ."
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
        "id": "wk-chuagiaclamt-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/ChuaGiacLam02.jpg/1280px-ChuaGiacLam02.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Tổ đình Giác Lâm (Ngôi chùa cổ nhất TP.HCM – 1744) (Wikimedia Commons)",
          "en": "Real view of Giac Lam Pagoda (Oldest Temple in Ho Chi Minh City – 1744) (Wikimedia Commons)",
          "fr": "Vue réelle de Pagode Giac Lam (La plus ancienne pagode de Saïgon – 1744) (Wikimedia Commons)",
          "zh": "觉林寺（胡志明市最古老佛寺 · 1744年）实景照片（维基共享资源）",
          "ja": "ザックラム寺（覚林寺・ホーチミン市最古の寺院 1744年）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chuagiaclamt-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/ChuaGiacLam01.jpg/1280px-ChuaGiacLam01.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Tổ đình Giác Lâm (Ngôi chùa cổ nhất TP.HCM – 1744) (Ảnh 2)",
          "en": "Architecture & atmosphere at Giac Lam Pagoda (Oldest Temple in Ho Chi Minh City – 1744) (Photo 2)",
          "fr": "Architecture et ambiance à Pagode Giac Lam (La plus ancienne pagode de Saïgon – 1744) (Photo 2)",
          "zh": "觉林寺（胡志明市最古老佛寺 · 1744年）建筑与实景细节（图 2）",
          "ja": "ザックラム寺（覚林寺・ホーチミン市最古の寺院 1744年）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chuagiaclamt-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/32/Bodhi_tree.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Tổ đình Giác Lâm (Ngôi chùa cổ nhất TP.HCM – 1744) (Ảnh 3)",
          "en": "Architecture & atmosphere at Giac Lam Pagoda (Oldest Temple in Ho Chi Minh City – 1744) (Photo 3)",
          "fr": "Architecture et ambiance à Pagode Giac Lam (La plus ancienne pagode de Saïgon – 1744) (Photo 3)",
          "zh": "觉林寺（胡志明市最古老佛寺 · 1744年）建筑与实景细节（图 3）",
          "ja": "ザックラム寺（覚林寺・ホーチミン市最古の寺院 1744年）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/C%E1%BB%95ng_ch%C3%B9a_V%C4%A9nh_Nghi%C3%AAm.jpg/1280px-C%E1%BB%95ng_ch%C3%B9a_V%C4%A9nh_Nghi%C3%AAm.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Nổi bật trong khuôn viên là Tháp Quán Thế Âm 7 tầng cao 40 mét và Tháp Đá Vĩnh Nghiêm chạm trổ kỳ công từ đá granit nguyên khối.",
          "Theo tư liệu bách khoa Wikipedia: Chùa Vĩnh Nghiêm (chữ Hán: 永嚴寺) là một danh lam, hiện tọa lạc tại số 339 Nam Kỳ Khởi Nghĩa (gần cầu Công Lý), thuộc phường Xuân Hoà, Thành phố Hồ Chí Minh, Việt Nam. Từ miền Bắc, hai Hòa thượng là Thích Tâm Giác và Thích Thanh Kiểm vào miền Nam truyền bá đạo Phật, và sau đó đã cho xây dựng chùa Vĩnh Nghiêm. Họ lấy nguyên mẫu thiết kế từ một ngôi chùa gỗ cùng tên ở làng Đức La, xã Trí Yên, huyện Yên Dũng, tỉnh Bắc Giang; kiến lập từ đời vua Lý Thái Tổ, vốn là trung tâm truyền bá Phật giáo của Thiền phái Trúc Lâm."
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
          "Welcome to Vinh Nghiem Pagoda on Nam Ky Khoi Nghia Boulevard in District 3, designed by renowned architect Nguyen Ba Lang between 1964 and 1971.",
          "Historical context from Wikipedia: Vĩnh Nghiêm Pagoda (Chùa Vĩnh Nghiêm; literally Ever Solemn) is a pagoda in an area of 6,000 square metres (65,000 sq ft) at 339, Nam Kỳ Khởi Nghĩa street, Ward 7, District 3 Ho Chi Minh City. This is the first pagoda in Vietnam to be built in Vietnamese traditional architecture style but with concrete. The highest structure in this pagoda is the 7-story, 40-metre-high (130 ft) tower."
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
        "id": "wk-chuavinhnghi-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/C%E1%BB%95ng_ch%C3%B9a_V%C4%A9nh_Nghi%C3%AAm.jpg/1280px-C%E1%BB%95ng_ch%C3%B9a_V%C4%A9nh_Nghi%C3%AAm.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Chùa Vĩnh Nghiêm & Bảo tháp Đá Quán Thế Âm (Quận 3) (Wikimedia Commons)",
          "en": "Real view of Vinh Nghiem Pagoda & Stone Stupa (District 3) (Wikimedia Commons)",
          "fr": "Vue réelle de Pagode Vinh Nghiem (3e Arrondissement) (Wikimedia Commons)",
          "zh": "永严寺与石造宝塔（第三郡）实景照片（维基共享资源）",
          "ja": "ヴィンギエム寺（永厳寺・3区）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chuavinhnghi-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/C%E1%BB%95ng_ch%C3%B9a_V%C4%A9nh_Nghi%C3%AAm.jpg/1280px-C%E1%BB%95ng_ch%C3%B9a_V%C4%A9nh_Nghi%C3%AAm.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chùa Vĩnh Nghiêm & Bảo tháp Đá Quán Thế Âm (Quận 3) (Ảnh 2)",
          "en": "Architecture & atmosphere at Vinh Nghiem Pagoda & Stone Stupa (District 3) (Photo 2)",
          "fr": "Architecture et ambiance à Pagode Vinh Nghiem (3e Arrondissement) (Photo 2)",
          "zh": "永严寺与石造宝塔（第三郡）建筑与实景细节（图 2）",
          "ja": "ヴィンギエム寺（永厳寺・3区）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chuavinhnghi-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Chua_Vinh_nghiem%2C_tphcm_vietnam_-_panoramio_%281%29.jpg/1280px-Chua_Vinh_nghiem%2C_tphcm_vietnam_-_panoramio_%281%29.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chùa Vĩnh Nghiêm & Bảo tháp Đá Quán Thế Âm (Quận 3) (Ảnh 3)",
          "en": "Architecture & atmosphere at Vinh Nghiem Pagoda & Stone Stupa (District 3) (Photo 3)",
          "fr": "Architecture et ambiance à Pagode Vinh Nghiem (3e Arrondissement) (Photo 3)",
          "zh": "永严寺与石造宝塔（第三郡）建筑与实景细节（图 3）",
          "ja": "ヴィンギエム寺（永厳寺・3区）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/C%C3%B4ng_vi%C3%AAn_V%C4%83n_h%C3%B3a_l%E1%BB%8Bch_s%E1%BB%AD_d%C3%A2n_t%E1%BB%99c_qu%E1%BA%ADn_9.JPG/1280px-C%C3%B4ng_vi%C3%AAn_V%C4%83n_h%C3%B3a_l%E1%BB%8Bch_s%E1%BB%AD_d%C3%A2n_t%E1%BB%99c_qu%E1%BA%ADn_9.JPG?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
          "Lối đi bộ rợp bóng tre xanh mát dẫn thẳng lên Đền Thượng là một trong những cung đường tản bộ văn hóa đẹp nhất tại khu Đông Thành phố Hồ Chí Minh.",
          "Theo tư liệu bách khoa Wikipedia: Công viên Lịch sử Văn hóa Dân tộc là một công trình kiến trúc quy mô lớn được xây cất tại phường Long Bình và một phần phường Đông Hòa, Thành phố Hồ Chí Minh với chức năng là một công viên, điểm tham quan với chủ đề lịch sử và văn hóa của dân tộc Việt Nam. Đây được coi là công trình tiêu biểu của khu vực phía Nam và là nơi tôn vinh các giá trị văn hóa dân tộc Việt Nam."
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
        "id": "wk-dentuongniem-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/C%C3%B4ng_vi%C3%AAn_V%C4%83n_h%C3%B3a_l%E1%BB%8Bch_s%E1%BB%AD_d%C3%A2n_t%E1%BB%99c_qu%E1%BA%ADn_9.JPG/1280px-C%C3%B4ng_vi%C3%AAn_V%C4%83n_h%C3%B3a_l%E1%BB%8Bch_s%E1%BB%AD_d%C3%A2n_t%E1%BB%99c_qu%E1%BA%ADn_9.JPG?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Đền Tưởng niệm các Vua Hùng & Công viên Lịch sử Văn hóa Dân tộc (TP. Thủ Đức) (Wikimedia Commons)",
          "en": "Real view of Hung Kings Memorial Temple & National Historical-Cultural Park (Thu Duc City) (Wikimedia Commons)",
          "fr": "Vue réelle de Temple Mémorial des Rois Hung & Parc Historique National (Thu Duc) (Wikimedia Commons)",
          "zh": "守德市雄王纪念圣殿与民族历史文化公园实景照片（维基共享资源）",
          "ja": "フン王記念神殿と民族歴史文化公園（トゥードゥック市）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-dentuongniem-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/20190923_Independence_Palace-13.jpg/1280px-20190923_Independence_Palace-13.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Đền Tưởng niệm các Vua Hùng & Công viên Lịch sử Văn hóa Dân tộc (TP. Thủ Đức) (Ảnh 2)",
          "en": "Architecture & atmosphere at Hung Kings Memorial Temple & National Historical-Cultural Park (Thu Duc City) (Photo 2)",
          "fr": "Architecture et ambiance à Temple Mémorial des Rois Hung & Parc Historique National (Thu Duc) (Photo 2)",
          "zh": "守德市雄王纪念圣殿与民族历史文化公园建筑与实景细节（图 2）",
          "ja": "フン王記念神殿と民族歴史文化公園（トゥードゥック市）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-dentuongniem-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/91/Ben_Thanh_market_2.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Đền Tưởng niệm các Vua Hùng & Công viên Lịch sử Văn hóa Dân tộc (TP. Thủ Đức) (Ảnh 3)",
          "en": "Architecture & atmosphere at Hung Kings Memorial Temple & National Historical-Cultural Park (Thu Duc City) (Photo 3)",
          "fr": "Architecture et ambiance à Temple Mémorial des Rois Hung & Parc Historique National (Thu Duc) (Photo 3)",
          "zh": "守德市雄王纪念圣殿与民族历史文化公园建筑与实景细节（图 3）",
          "ja": "フン王記念神殿と民族歴史文化公園（トゥードゥック市）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
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
  },
  {
    "id": "nha-tho-tan-dinh",
    "city": "Quận 3 · TP.HCM",
    "district": "Quận 3",
    "lat": 10.7889,
    "lng": 106.6907,
    "category": "temple",
    "rating": 4.8,
    "reviewCount": 16420,
    "ticketPrice": "Miễn phí tham quan",
    "address": "289 Hai Bà Trưng, Phường Võ Thị Sáu, Quận 3, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/T%C3%A2n_%C4%90%E1%BB%8Bnh_Church_20190922.jpg/1280px-T%C3%A2n_%C4%90%E1%BB%8Bnh_Church_20190922.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Nhà thờ Tân Định (Nhà thờ Màu Hồng · 1876)",
        "shortSummary": "Ngôi nhà thờ Công giáo nổi tiếng toàn cầu với sắc hồng pastel rực rỡ, kết hợp kiến trúc Gothic, Roman và Baroque xây dựng từ năm 1876.",
        "historicalEra": "1870 – 1876 (Sơn hồng năm 1957)",
        "openingHours": "08:00 – 11:00, 14:00 – 17:00 (Thứ 2 – Thứ 7)",
        "architecturalHighlights": [
          "Mặt tiền màu hồng san hô kết hợp viền trắng tinh xảo, là điểm check-in hàng đầu TP.HCM",
          "Tháp chuông chính cao 52,6m với đỉnh chóp bát giác và 5 quả chuông đúc tại Pháp",
          "Bên trong lòng nhà thờ gồm hai hàng cột Gothic vòm cong và bàn thờ đá cẩm thạch Ý"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Nhà thờ Tân Định trên đường Hai Bà Trưng, Quận 3 – một trong những nhà thờ cổ kính và nổi tiếng nhất Thành phố Hồ Chí Minh.",
          "Khởi công năm 1870 và khánh thành năm 1876, công trình mang kiến trúc Gothic kết hợp chi tiết Roman và Baroque. Từ năm 1957, nhà thờ khoác lên sắc hồng pastel đặc trưng và trở thành biểu tượng nhiếp ảnh của du khách khắp thế giới.",
          "Góc chụp lưu niệm đẹp nhất là từ ban công các quán cà phê đối diện bên kia đường Hai Bà Trưng vào buổi sáng sớm khi nắng chiếu xiên lên tháp chuông cao hơn 52 mét.",
          "Theo tư liệu bách khoa Wikipedia: Nhà thờ Tân Định (tên chính thức: Nhà thờ Thánh Tâm Chúa Giêsu, Tân Định) là một nhà thờ Công giáo tại Thành phố Hồ Chí Minh, thuộc giáo xứ Tân Định. Nhà thờ Tân Định cùng với Nhà thờ Đức Bà Sài Gòn là hai nhà thờ được xây dựng từ rất sớm và có quy mô lớn nhất tại thành phố này. Nhà thờ tọa lạc tại số 289 đường Hai Bà Trưng, phường Xuân Hòa, Thành phố Hồ Chí Minh, được khởi công vào năm 1870 và khánh thành vào ngày 16 tháng 12 năm 1876. Tổng thể mang phong cách kiến trúc Roman. Nhà thờ được sơn màu hồng phấn cả bên ngoài và bên trong từ năm 1957, khiến nhà thờ có biệt danh là \"nhà thờ màu hồng.\""
        ]
      },
      "en": {
        "name": "Tan Dinh Church (The Pink Church · 1876)",
        "shortSummary": "A world-famous pastel-pink Roman Catholic church built in 1876, blending Gothic spires with Romanesque and Baroque accents.",
        "historicalEra": "1870 – 1876 (Painted pink in 1957)",
        "openingHours": "08:00 – 11:00, 14:00 – 17:00 (Mon – Sat)",
        "architecturalHighlights": [
          "Iconic pastel-pink facade with crisp white Gothic tracery",
          "52.6-meter main bell tower housing five French-cast bells",
          "Italian marble altars framed by tall arched colonnades"
        ],
        "audioScript": [
          "Welcome to Tan Dinh Church on Hai Ba Trung Street, famously known worldwide as Saigon’s Pink Church.",
          "Completed in 1876 in Gothic-Romanesque style and painted pastel pink in 1957, it is one of Ho Chi Minh City’s most photographed landmarks.",
          "Historical context from Wikipedia: Tân Định Church or Tân Định Parish Church (Vietnamese: Nhà thờ Tân Định, Giáo xứ Tân Định) is a Roman Catholic church in Ho Chi Minh City, Vietnam. Its formal name is the Church of the Sacred Heart of Jesus (Vietnamese: Nhà thờ Thánh Tâm Chúa Giêsu). Even though it is in District 3, the parish shares its name with neighbouring District 1's Tân Định ward as of Tân Định was the place name of a former village that the church was also included."
        ]
      },
      "fr": {
        "name": "Église Tan Dinh (L’Église Rose · 1876)",
        "shortSummary": "Célèbre église catholique rose pastel édifiée en 1876 mêlant style gothique, roman et baroque, incontournable pour la photographie.",
        "historicalEra": "1870 – 1876",
        "openingHours": "08h00 – 11h00, 14h00 – 17h00",
        "architecturalHighlights": [
          "Façade rose pastel unique ornée de moulures blanches",
          "Clocher principal de 52,6 mètres et autels en marbre d’Italie"
        ],
        "audioScript": [
          "Bienvenue à l’église Tan Dinh, surnommée l’Église Rose de Saïgon, achevée en 1876."
        ]
      },
      "zh": {
        "name": "新定教堂（西贡粉红教堂 · 1876年）",
        "shortSummary": "建于1876年的梦幻粉红色天主教堂，融合哥特式与罗马式建筑美学，是胡志明市最具人气的网红打卡地标。",
        "historicalEra": "1870 – 1876年",
        "openingHours": "08:00 – 11:00, 14:00 – 17:00",
        "architecturalHighlights": [
          "标志性粉红与纯白相间的哥特式外墙",
          "高52.6米的主钟楼与意大利大理石祭坛"
        ],
        "audioScript": [
          "欢迎来到第三郡的新定教堂，这座建于1876年的粉红教堂是胡志明市最受欢迎的拍照地标之一。"
        ]
      },
      "ja": {
        "name": "タンディン教会（ピンクの教会・1876年）",
        "shortSummary": "1876年に完成した鮮やかなパステルピンクのカトリック教会。ゴシックとロマネスク様式が融合した市内屈指のフォトスポットです。",
        "historicalEra": "1870年 – 1876年",
        "openingHours": "08:00 – 11:00, 14:00 – 17:00",
        "architecturalHighlights": [
          "パステルピンクの外壁と白い繊細な装飾",
          "高さ52.6mの主鐘楼とイタリア産大理石の祭壇"
        ],
        "audioScript": [
          "ピンクの教会として世界的に人気のタンディン教会へようこそ。1876年に完成した歴史ある聖堂です。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-nhathotandin-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/T%C3%A2n_%C4%90%E1%BB%8Bnh_Church_20190922.jpg/1280px-T%C3%A2n_%C4%90%E1%BB%8Bnh_Church_20190922.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Nhà thờ Tân Định (Nhà thờ Màu Hồng · 1876) (Wikimedia Commons)",
          "en": "Real view of Tan Dinh Church (The Pink Church · 1876) (Wikimedia Commons)",
          "fr": "Vue réelle de Église Tan Dinh (L’Église Rose · 1876) (Wikimedia Commons)",
          "zh": "新定教堂（西贡粉红教堂 · 1876年）实景照片（维基共享资源）",
          "ja": "タンディン教会（ピンクの教会・1876年）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-nhathotandin-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/T%C3%A2n_%C4%90%E1%BB%8Bnh_Church_20190922.jpg/1280px-T%C3%A2n_%C4%90%E1%BB%8Bnh_Church_20190922.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Nhà thờ Tân Định (Nhà thờ Màu Hồng · 1876) (Ảnh 2)",
          "en": "Architecture & atmosphere at Tan Dinh Church (The Pink Church · 1876) (Photo 2)",
          "fr": "Architecture et ambiance à Église Tan Dinh (L’Église Rose · 1876) (Photo 2)",
          "zh": "新定教堂（西贡粉红教堂 · 1876年）建筑与实景细节（图 2）",
          "ja": "タンディン教会（ピンクの教会・1876年）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-nhathotandin-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/C_051.jpg/1280px-C_051.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Nhà thờ Tân Định (Nhà thờ Màu Hồng · 1876) (Ảnh 3)",
          "en": "Architecture & atmosphere at Tan Dinh Church (The Pink Church · 1876) (Photo 3)",
          "fr": "Architecture et ambiance à Église Tan Dinh (L’Église Rose · 1876) (Photo 3)",
          "zh": "新定教堂（西贡粉红教堂 · 1876年）建筑与实景细节（图 3）",
          "ja": "タンディン教会（ピンクの教会・1876年）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-nttd-1",
        "name": "Cộng Cà Phê Tân Định (View Nhà thờ Hồng)",
        "cuisine": "Cà phê Sài Gòn & Điểm check-in",
        "specialtyDishes": [
          "Cà phê cốt dừa",
          "Bạc xỉu đá",
          "Cà phê sữa đá"
        ],
        "rating": 4.7,
        "reviewCount": 4120,
        "priceRange": "45.000đ – 75.000đ",
        "lat": 10.7891,
        "lng": 106.6902,
        "address": "274 Hai Bà Trưng, Phường Tân Định, Quận 1, TP.HCM",
        "openHours": "07:00 – 22:30",
        "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 35
  },
  {
    "id": "pho-di-bo-nguyen-hue-chung-cu-42",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7743,
    "lng": 106.7037,
    "category": "ancient_town",
    "rating": 4.8,
    "reviewCount": 28500,
    "ticketPrice": "Miễn phí tham quan",
    "address": "42 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Nguyen_Hue_Street_2020.jpg/1280px-Nguyen_Hue_Street_2020.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Phố đi bộ Nguyễn Huệ & Chung cư 42 Nguyễn Huệ",
        "shortSummary": "Đại lộ đi bộ sôi động bậc nhất TP.HCM nối UBND Thành phố ra sông Sài Gòn, nổi bật với tổ hợp 9 tầng quán cà phê – boutique tại Chung cư 42 Nguyễn Huệ.",
        "historicalEra": "Kênh Charner (1887) – Phố đi bộ (2015)",
        "openingHours": "Mở cửa 24/7 (Đẹp nhất 17:30 – 22:30)",
        "architecturalHighlights": [
          "Quảng trường đi bộ dài 670m lát đá granit kèm đài phun nước nghệ thuật & tượng đài Chủ tịch Hồ Chí Minh",
          "Chung cư 42 Nguyễn Huệ (xây thập niên 1960) với hàng chục ban công cà phê sáng đèn rực rỡ như tổ ong hiện đại",
          "Kết nối trực tiếp Nhà hát Thành phố, UBND TP.HCM, Tháp Bitexco và Bến Bạch Đằng"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Phố đi bộ Nguyễn Huệ và Chung cư 42 Nguyễn Huệ – trái tim nhịp sống trẻ trung của Sài Gòn.",
          "Xưa kia đại lộ này từng là con kênh Lớn dẫn thuyền buôn vào thành Gia Định, được lấp cuối thế kỷ 19 và trở thành phố đi bộ hiện đại từ năm 2015.",
          "Ngay bên cạnh là Chung cư 42 Nguyễn Huệ xây từ thập niên 1960, nơi các căn hộ cũ đã hóa thân thành hàng chục quán cà phê và cửa hiệu sáng tạo, tạo nên khung cảnh lên đèn tuyệt đẹp mỗi buổi tối.",
          "Theo tư liệu bách khoa Wikipedia: Đường Nguyễn Huệ là một tuyến đường tại phường Sài Gòn (Quận 1 cũ), trung tâm Thành phố Hồ Chí Minh, chạy từ Trụ sở Ủy ban nhân dân Thành phố đến Bến Bạch Đằng, bờ sông Sài Gòn. Hiện nay chính giữa con đường này là một quảng trường đi bộ rộng 27 m được đưa vào sử dụng từ năm 2015, là quảng trường đi bộ đầu tiên của Việt Nam. Đường Nguyễn Huệ bắt đầu từ đường Lê Thánh Tôn ngay đối diện Trụ sở Ủy ban nhân dân Thành phố Hồ Chí Minh, cắt qua các con đường Lê Lợi, Nguyễn Thiệp, Tôn Thất Thiệp, Mạc Thị Bưởi, Huỳnh Thúc Kháng, Ngô Đức Kế, Hải Triều và kết thúc tại đường Tôn Đức Thắng đối diện với công viên Bến Bạch Đằng."
        ]
      },
      "en": {
        "name": "Nguyen Hue Walking Street & 42 Cafe Apartments",
        "shortSummary": "Ho Chi Minh City’s premier pedestrian boulevard linking City Hall to the Saigon River, anchored by the iconic nine-story 42 Cafe Apartments.",
        "historicalEra": "1887 Boulevard – 2015 Pedestrian Plaza",
        "openingHours": "Open 24/7 (Best 17:30 – 22:30)",
        "architecturalHighlights": [
          "670-meter granite-paved promenade with musical fountains and evening street life",
          "1960s 42 Nguyen Hue concrete block transformed into stacked boutique cafes glowing at night",
          "Direct walking axis between City Hall, Opera House, Bitexco, and Bach Dang Wharf"
        ],
        "audioScript": [
          "Welcome to Nguyen Hue Walking Street and the famous 42 Nguyen Hue Cafe Apartments in central District 1.",
          "From a 19th-century canal to today’s lively granite promenade, this avenue showcases Saigon’s vibrant blend of heritage facades and modern cafe culture.",
          "Historical context from Wikipedia: Nguyễn Huệ Boulevard (Vietnamese: Đường Nguyễn Huệ) is a boulevard in District 1, downtown Ho Chi Minh City, Vietnam. Being one of Saigon's oldest thoroughfares, the boulevard has undergone several transformations; it is currently a famous pedestrian street in the city."
        ]
      },
      "fr": {
        "name": "Rue piétonne Nguyen Hue & Immeuble Café 42",
        "shortSummary": "Grande promenade piétonne reliant l’Hôtel de Ville au fleuve Saïgon, célèbre pour l’immeuble 42 Nguyen Hue transformé en dizaines de cafés.",
        "historicalEra": "1887 – 2015",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "Esplanade de 670m animée chaque soir par des spectacles de rue",
          "Immeuble rétro des années 1960 aux balcons illuminés de cafés indépendants"
        ],
        "audioScript": [
          "Bienvenue sur la rue piétonne Nguyen Hue et devant le célèbre immeuble des cafés au numéro 42."
        ]
      },
      "zh": {
        "name": "阮惠步行街与42号咖啡公寓",
        "shortSummary": "胡志明市最繁华的中心步行大道，标志性的九层42号咖啡公寓汇集数十家创意咖啡馆与买手店，夜景迷人。",
        "historicalEra": "1887年大道 – 2015年步行街",
        "openingHours": "全天开放（17:30 – 22:30最佳）",
        "architecturalHighlights": [
          "长670米的花岗岩步行广场与音乐喷泉",
          "夜幕下灯光璀璨的九层42号复古咖啡公寓外立面"
        ],
        "audioScript": [
          "欢迎来到胡志明市中心的阮惠步行街与网红地标42号咖啡公寓，夜晚阳台灯光极为出片。"
        ]
      },
      "ja": {
        "name": "グエンフエ歩行者天国とカフェアパートメント42",
        "shortSummary": "人民委員会庁舎からサイゴン川へ延びる大通り。古い集合住宅を改装した9階建てのカフェアパートメント42番地が夜景スポットとして大人気。",
        "historicalEra": "1887年 – 2015年歩行者天国化",
        "openingHours": "24時間開放（夕方〜夜がおすすめ）",
        "architecturalHighlights": [
          "全長670mの御影石プロムナードと夜の噴水ライトアップ",
          "個性豊かなカフェが集まる1960年代の42番地ビル"
        ],
        "audioScript": [
          "ホーチミン市の中心、グエンフエ通りと名物カフェアパートメント42番地へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-phodibonguye-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Nguyen_Hue_Street_2020.jpg/1280px-Nguyen_Hue_Street_2020.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Phố đi bộ Nguyễn Huệ & Chung cư 42 Nguyễn Huệ (Wikimedia Commons)",
          "en": "Real view of Nguyen Hue Walking Street & 42 Cafe Apartments (Wikimedia Commons)",
          "fr": "Vue réelle de Rue piétonne Nguyen Hue & Immeuble Café 42 (Wikimedia Commons)",
          "zh": "阮惠步行街与42号咖啡公寓实景照片（维基共享资源）",
          "ja": "グエンフエ歩行者天国とカフェアパートメント42の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-phodibonguye-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Ho_Chi_Minh_City%2C_Saigon%2C_Vietnam_%2849579818542%29.jpg/1280px-Ho_Chi_Minh_City%2C_Saigon%2C_Vietnam_%2849579818542%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Phố đi bộ Nguyễn Huệ & Chung cư 42 Nguyễn Huệ (Ảnh 2)",
          "en": "Architecture & atmosphere at Nguyen Hue Walking Street & 42 Cafe Apartments (Photo 2)",
          "fr": "Architecture et ambiance à Rue piétonne Nguyen Hue & Immeuble Café 42 (Photo 2)",
          "zh": "阮惠步行街与42号咖啡公寓建筑与实景细节（图 2）",
          "ja": "グエンフエ歩行者天国とカフェアパートメント42の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-phodibonguye-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/fa/%27Bitexco_Financial_Tower%27_as_seen_from_Bach_Dang_wharf..JPG?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Phố đi bộ Nguyễn Huệ & Chung cư 42 Nguyễn Huệ (Ảnh 3)",
          "en": "Architecture & atmosphere at Nguyen Hue Walking Street & 42 Cafe Apartments (Photo 3)",
          "fr": "Architecture et ambiance à Rue piétonne Nguyen Hue & Immeuble Café 42 (Photo 3)",
          "zh": "阮惠步行街与42号咖啡公寓建筑与实景细节（图 3）",
          "ja": "グエンフエ歩行者天国とカフェアパートメント42の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-nh42-1",
        "name": "Partea – English Tearoom (Tầng 4 Chung cư 42)",
        "cuisine": "Trà chiều & Cà phê View Phố đi bộ",
        "specialtyDishes": [
          "Trà hoa anh quốc",
          "Bánh scones kem tươi",
          "Cà phê sữa Sài Gòn"
        ],
        "rating": 4.7,
        "reviewCount": 2850,
        "priceRange": "60.000đ – 140.000đ",
        "lat": 10.7744,
        "lng": 106.7039,
        "address": "Tầng 4, 42 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
        "openHours": "09:00 – 22:00",
        "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 50
  },
  {
    "id": "ben-bach-dang-cau-ba-son",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7736,
    "lng": 106.7069,
    "category": "monument",
    "rating": 4.8,
    "reviewCount": 19200,
    "ticketPrice": "Miễn phí (Waterbus 15.000đ/lượt)",
    "address": "Công viên Bến Bạch Đằng, Đường Tôn Đức Thắng, Quận 1, TP.HCM",
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/5/58/Saigon_Skyline.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
    "translations": {
      "vi": {
        "name": "Công viên Bến Bạch Đằng & Cầu Ba Son (Saigon Waterbus)",
        "shortSummary": "Không gian công viên ven sông Sài Gòn tuyệt đẹp ngay trung tâm Quận 1, nơi đón buýt đường sông Saigon Waterbus và ngắm trọn Cầu dây văng Ba Son lúc hoàng hôn.",
        "historicalEra": "Bến cảng lịch sử Sài Gòn – Chỉnh trang 2022",
        "openingHours": "Mở cửa 24/7 (Waterbus 07:00 – 21:00)",
        "architecturalHighlights": [
          "Cầu dây văng Ba Son (Thủ Thiêm 2) với trụ tháp nghiêng 113m biểu tượng mới của sông Sài Gòn",
          "Bến tàu Saigon Waterbus nối Quận 1 đi Thanh Đa – Bình An – Linh Đông chỉ 15.000đ",
          "Lối đi bộ thoáng mát nhìn toàn cảnh bán đảo Thủ Thiêm và tòa tháp Landmark 81"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Công viên Bến Bạch Đằng bên bờ Tây sông Sài Gòn – điểm dạo mát, ngắm hoàng hôn và chụp ảnh đường chân trời đẹp bậc nhất thành phố.",
          "Từ đây, quý khách có thể thu trọn vào ống kính cây Cầu dây văng Ba Son cao 113 mét vươn mình qua sông, hoặc lên chuyến buýt đường sông Saigon Waterbus để ngắm Sài Gòn từ mặt nước.",
          "Theo tư liệu bách khoa Wikipedia: Bến Bạch Đằng là tên của khu vực công viên và bến sông bên bờ sông Sài Gòn tại Sài Gòn, trung tâm Thành phố Hồ Chí Minh, Việt Nam. Đây là nơi người dân thành phố và du khách tới vui chơi và là địa điểm ngắm pháo hoa mỗi dịp lễ, Tết. Bến Bạch Đằng ở địa chỉ số 2 đường Tôn Đức Thắng, nằm bên bờ tây sông Sài Gòn, gồm bến cảng và công viên dài 1,3 km, rộng 23.400 m²."
        ]
      },
      "en": {
        "name": "Bach Dang Wharf Park & Ba Son Bridge (Saigon Waterbus)",
        "shortSummary": "A breezy Saigon Riverfront promenade in District 1 featuring the Saigon Waterbus pier and panoramic sunset views of the cable-stayed Ba Son Bridge.",
        "historicalEra": "Historic Saigon Waterfront – Revamped 2022",
        "openingHours": "Open 24/7 (Waterbus 07:00 – 21:00)",
        "architecturalHighlights": [
          "113-meter asymmetrical cable-stayed Ba Son Bridge spanning the Saigon River",
          "Saigon Waterbus terminal offering scenic 15,000 VND river rides",
          "Unobstructed skyline views toward Thu Thiem and Landmark 81"
        ],
        "audioScript": [
          "Welcome to Bach Dang Wharf Park along the Saigon River, the departure point for the Saigon Waterbus and a favorite sunset spot overlooking Ba Son Bridge.",
          "Historical context from Wikipedia: Bạch Đằng Quay (Vietnamese: Bến Bạch Đằng) is a wharf and park with an address No.2 Tôn Đức Thắng Boulevard, Bến Nghé (now is Saigon ward), Ho Chi Minh City, Vietnam. It stretches along about 1.3 kilometres (0.81 mi) of the Saigon River from the Thủ Ngữ flagpole (Three-way junction of Bến Nghé Channel and Saigon River) to the site of the former Ba Son Shipyard (now the Saigon – Ba Son complex) and covers an area of 23,400 square metres (252,000 sq ft)."
        ]
      },
      "fr": {
        "name": "Quai Bach Dang & Pont Ba Son (Saigon Waterbus)",
        "shortSummary": "Promenade verdoyante au bord du fleuve Saïgon avec embarcadère du Waterbus et vue imprenable sur le pont à haubans Ba Son.",
        "historicalEra": "Quai historique – Rénové en 2022",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "Pont à haubans Ba Son haut de 113 mètres",
          "Départ du bateau-bus Saigon Waterbus au coucher du soleil"
        ],
        "audioScript": [
          "Bienvenue au parc du quai Bach Dang, point de départ du Saigon Waterbus face au pont Ba Son."
        ]
      },
      "zh": {
        "name": "白藤码头公园与巴松大桥（西贡水上巴士）",
        "shortSummary": "位于第一郡西贡河畔的绝美滨水公园，可乘坐西贡水上巴士并拍摄巴松斜拉桥与守添天际线的日落美景。",
        "historicalEra": "历史码头 – 2022年焕新开放",
        "openingHours": "全天开放（水上巴士 07:00 – 21:00）",
        "architecturalHighlights": [
          "高达113米的巴松斜拉桥现代地标",
          "仅需15,000越南盾的西贡河水上巴士体验"
        ],
        "audioScript": [
          "欢迎来到西贡河畔的白藤码头公园，在这里可以搭乘水上巴士并欣赏巴松大桥迷人日落。"
        ]
      },
      "ja": {
        "name": "バクダン公園・バーソン橋（サイゴン水上バス）",
        "shortSummary": "サイゴン川沿いの開放的な公園。15,000ドンで乗れる水上バス乗り場があり、美しい斜張橋バーソン橋の夕景スポットとして人気です。",
        "historicalEra": "歴史的船着場 – 2022年リニューアル",
        "openingHours": "24時間開放（水上バス 07:00 – 21:00）",
        "architecturalHighlights": [
          "高さ113mの近代的な斜張橋バーソン橋",
          "サイゴン川をクルーズできる水上バス発着所"
        ],
        "audioScript": [
          "サイゴン川沿いのバクダン公園へようこそ。バーソン橋の夕景や水上バスの乗船が楽しめます。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-benbachdangc-1",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/5/58/Saigon_Skyline.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Công viên Bến Bạch Đằng & Cầu Ba Son (Saigon Waterbus) (Wikimedia Commons)",
          "en": "Real view of Bach Dang Wharf Park & Ba Son Bridge (Saigon Waterbus) (Wikimedia Commons)",
          "fr": "Vue réelle de Quai Bach Dang & Pont Ba Son (Saigon Waterbus) (Wikimedia Commons)",
          "zh": "白藤码头公园与巴松大桥（西贡水上巴士）实景照片（维基共享资源）",
          "ja": "バクダン公園・バーソン橋（サイゴン水上バス）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-benbachdangc-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Bach_Dang_Quay_%2852681304130%29.jpg/1280px-Bach_Dang_Quay_%2852681304130%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Công viên Bến Bạch Đằng & Cầu Ba Son (Saigon Waterbus) (Ảnh 2)",
          "en": "Architecture & atmosphere at Bach Dang Wharf Park & Ba Son Bridge (Saigon Waterbus) (Photo 2)",
          "fr": "Architecture et ambiance à Quai Bach Dang & Pont Ba Son (Saigon Waterbus) (Photo 2)",
          "zh": "白藤码头公园与巴松大桥（西贡水上巴士）建筑与实景细节（图 2）",
          "ja": "バクダン公園・バーソン橋（サイゴン水上バス）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-benbachdangc-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/fd/Bach_Dang_Station_-_Sai_Gon_Water_Bus.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Công viên Bến Bạch Đằng & Cầu Ba Son (Saigon Waterbus) (Ảnh 3)",
          "en": "Architecture & atmosphere at Bach Dang Wharf Park & Ba Son Bridge (Saigon Waterbus) (Photo 3)",
          "fr": "Architecture et ambiance à Quai Bach Dang & Pont Ba Son (Saigon Waterbus) (Photo 3)",
          "zh": "白藤码头公园与巴松大桥（西贡水上巴士）建筑与实景细节（图 3）",
          "ja": "バクダン公園・バーソン橋（サイゴン水上バス）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-bbd-1",
        "name": "Katinat Bến Bạch Đằng (Saigon Waterbus)",
        "cuisine": "Cà phê & Trà trái cây ven sông",
        "specialtyDishes": [
          "Trà sữa chôm chôm",
          "Cà phê sữa đá",
          "Bánh croissant bơ"
        ],
        "rating": 4.6,
        "reviewCount": 3250,
        "priceRange": "45.000đ – 80.000đ",
        "lat": 10.7734,
        "lng": 106.7067,
        "address": "10B Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP.HCM",
        "openHours": "07:00 – 23:00",
        "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "cot-co-thu-ngu",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7706,
    "lng": 106.7061,
    "category": "monument",
    "rating": 4.7,
    "reviewCount": 3420,
    "ticketPrice": "Miễn phí tham quan",
    "address": "Công viên Bến Bạch Đằng, Ngã ba sông Sài Gòn – Kênh Bến Nghé, Quận 1",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/C%E1%BB%99t_c%E1%BB%9D_Th%E1%BB%A7_Ng%E1%BB%AF.JPG/1280px-C%E1%BB%99t_c%E1%BB%9D_Th%E1%BB%A7_Ng%E1%BB%AF.JPG?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Di tích Cột cờ Thủ Ngữ (1865)",
        "shortSummary": "Một trong những công trình cổ nhất Sài Gòn xây dựng năm 1865 ngay ngã ba sông Sài Gòn – kênh Bến Nghé, từng làm cột tín hiệu cho tàu thuyền ra vào cảng.",
        "historicalEra": "Khởi dựng năm 1865 (Hơn 160 năm tuổi)",
        "openingHours": "Mở cửa 24/7",
        "architecturalHighlights": [
          "Kiến trúc bát giác cổ điển sơn trắng – mái ngói đỏ nổi bật bên công viên ven sông",
          "Cột cờ cao vút từng treo cờ hiệu hướng dẫn hải hành cho thương cảng Sài Gòn thế kỷ 19",
          "Nằm trên trục đi bộ ven sông nối Bến Bạch Đằng, Cầu Mống và Bến Nhà Rồng"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Di tích Cột cờ Thủ Ngữ – công trình lịch sử hơn 160 năm tuổi tọa lạc ngay mũi ngã ba sông Sài Gòn và rạch Bến Nghé.",
          "Được xây dựng vào tháng 10 năm 1865, Cột cờ Thủ Ngữ xưa kia làm nhiệm vụ treo cờ tín hiệu điều phối tàu thuyền quốc tế ra vào thương cảng Sài Gòn, đồng thời ghi dấu tinh thần chiến đấu anh dũng của nhân dân Nam Bộ năm 1945.",
          "Theo tư liệu bách khoa Wikipedia: Cột cờ Thủ Ngữ là một công trình nằm tại đường Tôn Đức Thắng, phường Sài Gòn, Thành phố Hồ Chí Minh, Việt Nam. Cột cờ được người Pháp xây dựng vào tháng 10 năm 1865 trên nền cũ của dinh quan thủ ngự chuyên chăm lo thương chính của nhà Nguyễn. Tính đến nay nó đã hơn 159 năm tuổi. Năm 2016, cột cờ Thủ Ngữ được thành phố xếp hạng là di tích lịch sử cấp TP.HCM. Cột cờ Thủ Ngữ được người Pháp xây dựng vào tháng 10 năm 1865 với tên gọi lúc đầu là Mât des signaux, có nghĩa là Cột tín hiệu. Đúng như cái tên lúc đầu của nó, chức năng ban đầu của cột cờ là làm cột tín hiệu cho tàu bè ra vào luồng lạch khu vực Sài Gòn - Gia Định. Từ đó đến nay, cột cờ đã trải qua 159 tuổi với nhiều lần xuống cấp và trùng tu."
        ]
      },
      "en": {
        "name": "Thu Ngu Flagpole Historic Monument (1865)",
        "shortSummary": "Built in 1865 at the confluence of the Saigon River and Ben Nghe Canal, one of the oldest surviving maritime landmarks of historic Saigon.",
        "historicalEra": "Built in 1865",
        "openingHours": "Open 24/7",
        "architecturalHighlights": [
          "Restored octagonal white pavilion with terracotta tile roof on the riverfront",
          "19th-century maritime signal mast guiding ships into Saigon Port",
          "Scenic riverside walk connecting Bach Dang Wharf and Mong Bridge"
        ],
        "audioScript": [
          "Welcome to the Thu Ngu Flagpole, constructed in 1865 as a maritime signal station at the entrance to historic Saigon Port."
        ]
      },
      "fr": {
        "name": "Mât de Pavillon Thu Ngu (1865)",
        "shortSummary": "Édifié en 1865 au confluent du fleuve Saïgon et du canal Ben Nghe, l’un des plus anciens vestiges portuaires de la ville.",
        "historicalEra": "1865",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "Pavillon octogonal blanc au toit de tuiles rouges face au fleuve",
          "Ancien poste de signalisation maritime du port de Saïgon"
        ],
        "audioScript": [
          "Bienvenue au mât Thu Ngu, érigé en 1865 pour guider les navires entrant dans le port de Saïgon."
        ]
      },
      "zh": {
        "name": "守御旗杆历史遗迹（1865年）",
        "shortSummary": "建于1865年的西贡最古老海事建筑之一，坐落于西贡河与滨艺涌交汇处，曾为进出西贡港的船只悬挂信号旗。",
        "historicalEra": "始建于1865年",
        "openingHours": "全天开放",
        "architecturalHighlights": [
          "白墙红瓦八角亭与高耸信号旗杆",
          "串联白藤码头、彩虹桥与龙屋码头的滨水历史步道"
        ],
        "audioScript": [
          "欢迎来到建于1865年的守御旗杆遗迹，它曾是十九世纪西贡商港重要的航运信号站。"
        ]
      },
      "ja": {
        "name": "トゥーグー旗竿遺跡（1865年）",
        "shortSummary": "1865年にサイゴン川とベンゲー運河の合流点に建てられた市内最古級の海事遺跡。かつて港に出入りする船の信号所でした。",
        "historicalEra": "1865年建造",
        "openingHours": "24時間開放",
        "architecturalHighlights": [
          "川沿いに映える白壁と赤瓦の八角形パビリオン",
          "バクダン公園とモン橋を結ぶ絶好の散策フォトスポット"
        ],
        "audioScript": [
          "1865年建造のトゥーグー旗竿へようこそ。サイゴン港の歴史を見守り続けてきた由緒ある遺跡です。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-cotcothungu-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/C%E1%BB%99t_c%E1%BB%9D_Th%E1%BB%A7_Ng%E1%BB%AF.JPG/1280px-C%E1%BB%99t_c%E1%BB%9D_Th%E1%BB%A7_Ng%E1%BB%AF.JPG?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Di tích Cột cờ Thủ Ngữ (1865) (Wikimedia Commons)",
          "en": "Real view of Thu Ngu Flagpole Historic Monument (1865) (Wikimedia Commons)",
          "fr": "Vue réelle de Mât de Pavillon Thu Ngu (1865) (Wikimedia Commons)",
          "zh": "守御旗杆历史遗迹（1865年）实景照片（维基共享资源）",
          "ja": "トゥーグー旗竿遺跡（1865年）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-cotcothungu-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/C%E1%BB%99t_c%E1%BB%9D_Th%E1%BB%A7_Ng%E1%BB%AF.JPG/1280px-C%E1%BB%99t_c%E1%BB%9D_Th%E1%BB%A7_Ng%E1%BB%AF.JPG?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Di tích Cột cờ Thủ Ngữ (1865) (Ảnh 2)",
          "en": "Architecture & atmosphere at Thu Ngu Flagpole Historic Monument (1865) (Photo 2)",
          "fr": "Architecture et ambiance à Mât de Pavillon Thu Ngu (1865) (Photo 2)",
          "zh": "守御旗杆历史遗迹（1865年）建筑与实景细节（图 2）",
          "ja": "トゥーグー旗竿遺跡（1865年）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-cotcothungu-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Tramway_Saigon--Cholon_%281905%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Di tích Cột cờ Thủ Ngữ (1865) (Ảnh 3)",
          "en": "Architecture & atmosphere at Thu Ngu Flagpole Historic Monument (1865) (Photo 3)",
          "fr": "Architecture et ambiance à Mât de Pavillon Thu Ngu (1865) (Photo 3)",
          "zh": "守御旗杆历史遗迹（1865年）建筑与实景细节（图 3）",
          "ja": "トゥーグー旗竿遺跡（1865年）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cctn-1",
        "name": "Bánh Mì Chảo & Cà Phê Bến Chương Dương",
        "cuisine": "Điểm tâm & Cà phê Sài Gòn",
        "specialtyDishes": [
          "Bánh mì chảo ốp la pate",
          "Cà phê sữa đá",
          "Hủ tiếu nam vang"
        ],
        "rating": 4.5,
        "reviewCount": 780,
        "priceRange": "40.000đ – 85.000đ",
        "lat": 10.7704,
        "lng": 106.7048,
        "address": "Võ Văn Kiệt – Hàm Nghi, Phường Nguyễn Thái Bình, Quận 1, TP.HCM",
        "openHours": "06:30 – 21:00",
        "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "cau-mong-sai-gon",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7685,
    "lng": 106.7039,
    "category": "monument",
    "rating": 4.7,
    "reviewCount": 6840,
    "ticketPrice": "Miễn phí tham quan",
    "address": "Kênh Bến Nghé, nối đường Võ Văn Kiệt (Q.1) & Bến Vân Đồn (Q.4)",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/M%E1%BB%91ng_Bridge_Ho_Chi_Minh_City.JPG/1280px-M%E1%BB%91ng_Bridge_Ho_Chi_Minh_City.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Cầu Mống Sài Gòn (Di tích Kiến trúc 1894)",
        "shortSummary": "Cây cầu bộ hành bằng thép màu xanh ngọc xây năm 1893–1894 bởi công ty Levallois-Perret (công ty của Gustave Eiffel), mang dáng cầu vồng cổ điển cực ăn ảnh.",
        "historicalEra": "1893 – 1894 (Hơn 130 năm tuổi)",
        "openingHours": "Mở cửa 24/7",
        "architecturalHighlights": [
          "Kết cấu vòm thép tán đinh thế kỷ 19 dài 128m, sơn màu xanh ngọc bích đặc trưng",
          "Thiết kế uốn cong như cầu vồng – góc chụp ảnh vintage tuyệt đẹp với nền Tháp Bitexco phía sau",
          "Nằm ngay cạnh Tòa nhà Ngân hàng Nhà nước kiến trúc Art Deco 1929"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Cầu Mống – một trong những cây cầu thép cổ nhất Sài Gòn được xây dựng năm 1893 đến 1894 bởi hãng xây dựng Levallois-Perret của kỹ sư Gustave Eiffel.",
          "Ngày nay Cầu Mống dành riêng cho người đi bộ, là tọa độ hóng gió, ngắm hoàng hôn và chụp ảnh lưu niệm đối lập cực kỳ thú vị giữa nét sắt thép trăm tuổi và Tháp Bitexco hiện đại.",
          "Theo tư liệu bách khoa Wikipedia: Cầu Mống hay cầu Arc-en-ciel là một cây cầu bắc qua kênh Bến Nghé, nối liền giữa Quận 1 và Quận 4, Thành phố Hồ Chí Minh, Việt Nam. Đây được coi là một trong những cây cầu cổ xưa nhất tại thành phố này. Cầu do Công ty vận chuyển hàng hải Messageries Maritimes của Pháp bỏ vốn xây dựng vào năm 1881-1883, dài 128 mét, rộng 5,2 mét, lề bộ hành rộng 0,5 mét, xây bằng thép kiên cố."
        ]
      },
      "en": {
        "name": "Mong Bridge (Historic 1894 Eiffel Iron Footbridge)",
        "shortSummary": "A turquoise riveted-steel pedestrian bridge built in 1893–1894 by Gustave Eiffel’s firm, spanning Ben Nghe Canal between District 1 and District 4.",
        "historicalEra": "1893 – 1894",
        "openingHours": "Open 24/7",
        "architecturalHighlights": [
          "128-meter rainbow-arched turquoise iron truss from the late 19th century",
          "Iconic photo angle framing vintage ironwork against the modern Bitexco Tower",
          "Steps away from the 1929 Art Deco State Bank Building"
        ],
        "audioScript": [
          "Welcome to Mong Bridge, a turquoise iron pedestrian bridge built in 1894 by Gustave Eiffel’s engineering company, offering classic skyline photo angles.",
          "Historical context from Wikipedia: The Mong Bridge (Cầu Mống in Vietnamese, \"Rainbow bridge\") is a steel bridge across the Bến Nghé Channel, connecting District 1 and District 4 of Ho Chi Minh City. It is one of the oldest bridges in that city. Originally named Pont des Messageries maritimes, it was built in 1882 by Gustave Eiffel for the merchant shipping company Messageries maritimes, replacing a ferry route."
        ]
      },
      "fr": {
        "name": "Pont Mong (Passerelle Eiffel · 1894)",
        "shortSummary": "Passerelle métallique turquoise construite en 1893–1894 par la société de Gustave Eiffel au-dessus du canal Ben Nghe.",
        "historicalEra": "1893 – 1894",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "Arche métallique en fer riveté longue de 128 mètres",
          "Contraste photogénique avec la tour Bitexco"
        ],
        "audioScript": [
          "Bienvenue sur le pont Mong, passerelle piétonne construite en 1894 par les ateliers Eiffel."
        ]
      },
      "zh": {
        "name": "彩虹桥（西贡百年铁桥 · 1894年）",
        "shortSummary": "建于1893–1894年的薄荷绿铆接铁艺步行桥，由埃菲尔公司承建，与现代金融塔同框极具复古电影感。",
        "historicalEra": "1893 – 1894年",
        "openingHours": "全天开放",
        "architecturalHighlights": [
          "长128米的十九世纪复古薄荷绿拱形钢架桥",
          "夕阳下拍摄金融塔与运河倒影的绝佳机位"
        ],
        "audioScript": [
          "欢迎来到建于1894年的彩虹步行桥，这座薄荷绿百年铁桥是西贡最具复古气息的拍照地之一。"
        ]
      },
      "ja": {
        "name": "モン橋（1894年エッフェル社建造の歩道橋）",
        "shortSummary": "1894年にエッフェル社が建設したターコイズブルーの歴史的鉄橋。レトロな鉄骨と近代的なビテクスコタワーの対比が絶好の撮影スポットです。",
        "historicalEra": "1893年 – 1894年",
        "openingHours": "24時間開放",
        "architecturalHighlights": [
          "全長128mの虹形アーチを持つ19世紀の鉄製歩道橋",
          "夕暮れ時の運河とスカイラインの絶景ポイント"
        ],
        "audioScript": [
          "1894年に建造された歴史ある歩道橋、モン橋へようこそ。レトロな造形と高層ビルの対比が魅力です。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-caumongsaigo-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/M%E1%BB%91ng_Bridge_Ho_Chi_Minh_City.JPG/1280px-M%E1%BB%91ng_Bridge_Ho_Chi_Minh_City.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Cầu Mống Sài Gòn (Di tích Kiến trúc 1894) (Wikimedia Commons)",
          "en": "Real view of Mong Bridge (Historic 1894 Eiffel Iron Footbridge) (Wikimedia Commons)",
          "fr": "Vue réelle de Pont Mong (Passerelle Eiffel · 1894) (Wikimedia Commons)",
          "zh": "彩虹桥（西贡百年铁桥 · 1894年）实景照片（维基共享资源）",
          "ja": "モン橋（1894年エッフェル社建造の歩道橋）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-caumongsaigo-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/M%E1%BB%91ng_Bridge_Ho_Chi_Minh_City.JPG/1280px-M%E1%BB%91ng_Bridge_Ho_Chi_Minh_City.JPG?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Cầu Mống Sài Gòn (Di tích Kiến trúc 1894) (Ảnh 2)",
          "en": "Architecture & atmosphere at Mong Bridge (Historic 1894 Eiffel Iron Footbridge) (Photo 2)",
          "fr": "Architecture et ambiance à Pont Mong (Passerelle Eiffel · 1894) (Photo 2)",
          "zh": "彩虹桥（西贡百年铁桥 · 1894年）建筑与实景细节（图 2）",
          "ja": "モン橋（1894年エッフェル社建造の歩道橋）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-caumongsaigo-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/M%E1%BB%91ng_Bridge_Ho_Chi_Minh_City.JPG/1280px-M%E1%BB%91ng_Bridge_Ho_Chi_Minh_City.JPG?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Cầu Mống Sài Gòn (Di tích Kiến trúc 1894) (Ảnh 3)",
          "en": "Architecture & atmosphere at Mong Bridge (Historic 1894 Eiffel Iron Footbridge) (Photo 3)",
          "fr": "Architecture et ambiance à Pont Mong (Passerelle Eiffel · 1894) (Photo 3)",
          "zh": "彩虹桥（西贡百年铁桥 · 1894年）建筑与实景细节（图 3）",
          "ja": "モン橋（1894年エッフェル社建造の歩道橋）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cm-1",
        "name": "Phố Ốc & Bún Đậu Bến Vân Đồn (Đầu Cầu Mống Q.4)",
        "cuisine": "Ẩm thực Đường phố Quận 4",
        "specialtyDishes": [
          "Ốc hương rang muối ớt",
          "Sò điệp nướng mỡ hành",
          "Nước mía sầu riêng"
        ],
        "rating": 4.6,
        "reviewCount": 1620,
        "priceRange": "45.000đ – 150.000đ",
        "lat": 10.7676,
        "lng": 106.7034,
        "address": "Bến Vân Đồn, Phường 12, Quận 4, TP.HCM",
        "openHours": "15:00 – 23:00",
        "imageUrl": "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "ho-con-rua-cong-truong-quoc-te",
    "city": "Quận 3 · TP.HCM",
    "district": "Quận 3",
    "lat": 10.7827,
    "lng": 106.6959,
    "category": "monument",
    "rating": 4.6,
    "reviewCount": 15800,
    "ticketPrice": "Miễn phí tham quan",
    "address": "Công trường Quốc tế (Giao lộ Võ Văn Tần – Phạm Ngọc Thạch – Trần Cao Vân), Q.3",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Cong_truong_con_rua.jpg/1280px-Cong_truong_con_rua.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Hồ Con Rùa (Công trường Quốc tế · 1967)",
        "shortSummary": "Vòng xoay di sản đô thị nổi tiếng nhất Sài Gòn với đài tháp bát giác 5 cột trắng vươn cao, điểm hẹn ăn vặt bánh tráng trộn và cảm nhận nhịp sống trẻ Quận 3.",
        "historicalEra": "1965 – 1967 (KTS Nguyễn Kỳ)",
        "openingHours": "Mở cửa 24/7 (Nhộn nhịp nhất 17:00 – 22:30)",
        "architecturalHighlights": [
          "Hồ nước hình bát giác với 4 lối đi bộ xoắn ốc dẫn lên đài trung tâm và 5 cột bê tông cách điệu bàn tay",
          "Nằm tại nút giao 3 trục đường rợp bóng cây cổ thụ đẹp nhất khu trung tâm",
          "Bao quanh là chuỗi quán cà phê sân vườn, bánh tráng nướng, trà đào đậm chất sinh viên Sài Gòn"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Hồ Con Rùa – Công trường Quốc tế tại Quận 3, công trình kiến trúc đô thị mang dấu ấn thập niên 1960 do Kiến trúc sư Nguyễn Kỳ thiết kế.",
          "Không chỉ là một nút giao thông cổ thụ xanh mát cách Nhà thờ Đức Bà chưa đầy 5 phút đi bộ, Hồ Con Rùa còn là ký ức ẩm thực đường phố khó quên với bánh tráng trộn, bắp xào và những buổi chiều hóng mát của người dân thành phố.",
          "Theo tư liệu bách khoa Wikipedia: Hồ Con Rùa là tên gọi dân gian của một hồ phun nước nhân tạo nằm giữa nơi giao nhau của ba con đường Võ Văn Tần, Phạm Ngọc Thạch và Trần Cao Vân, phường Xuân Hòa (Quận 3 cũ), Thành phố Hồ Chí Minh, tạo thành một nút giao thông cùng mức kiểu bùng binh. Khu vực này có tên chính thức là Công trường Quốc tế, hiện nay là một trong những nơi hoạt động ẩm thực gần như từ sáng đến đêm, với rất nhiều tiệm cà phê và hàng quán xung quanh."
        ]
      },
      "en": {
        "name": "Turtle Lake (International Square · 1967)",
        "shortSummary": "A beloved 1960s octagonal water plaza and roundabout in District 3, famous for its modernist five-pillar tower and lively evening street-snack culture.",
        "historicalEra": "1965 – 1967",
        "openingHours": "Open 24/7 (Liveliest 17:00 – 22:30)",
        "architecturalHighlights": [
          "Octagonal fountain basin with spiral walkways and five soaring modernist pillars",
          "Shaded intersection linking leafy District 3 boulevards near Notre-Dame Cathedral",
          "Hub of Saigon youth snack culture: rice paper salad, grilled rice paper, and iced tea"
        ],
        "audioScript": [
          "Welcome to Turtle Lake in District 3, an iconic 1960s roundabout fountain and one of Saigon’s favorite evening gathering spots for street snacks and coffee."
        ]
      },
      "fr": {
        "name": "Lac de la Tortue (Place Internationale · 1967)",
        "shortSummary": "Place octogonale emblématique des années 1960 au cœur du 3e arrondissement, célèbre pour son ambiance conviviale et sa street-food en soirée.",
        "historicalEra": "1965 – 1967",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "Bassin octogonal et tour moderniste à cinq colonnes",
          "Rendez-vous incontournable de la jeunesse saïgonnaise à la tombée du jour"
        ],
        "audioScript": [
          "Bienvenue au Lac de la Tortue, lieu de rencontre emblématique et convivial du 3e arrondissement."
        ]
      },
      "zh": {
        "name": "乌龟湖（国际广场 · 1967年）",
        "shortSummary": "第三郡最具西贡青春气息的八角形喷泉广场，以现代主义五柱纪念塔与傍晚热闹的街头小吃闻名。",
        "historicalEra": "1965 – 1967年",
        "openingHours": "全天开放（17:00 – 22:30最热闹）",
        "architecturalHighlights": [
          "八角形水池与螺旋步道中央五柱造型塔",
          "体验西贡地道拌米纸、烤米纸与街边咖啡的绝佳地点"
        ],
        "audioScript": [
          "欢迎来到第三郡的乌龟湖广场，这里既是复古地标，也是体验胡志明市年轻人夜生活与街头美食的热门地。"
        ]
      },
      "ja": {
        "name": "亀湖（国際広場・1967年）",
        "shortSummary": "1960年代のモダニズム塔が立つ3区の八角形ロータリー広場。夕方は若者たちが集まり、バインチャンチョンなど屋台グルメを楽しめます。",
        "historicalEra": "1965年 – 1967年",
        "openingHours": "24時間開放（夕方〜夜が賑やか）",
        "architecturalHighlights": [
          "八角形の噴水池と5本の柱が伸びるレトロなモニュメント",
          "サイゴン名物のストリートスナックとカフェが集う広場"
        ],
        "audioScript": [
          "3区のランドマーク、亀湖（ホーコンルア）へようこそ。夕暮れ時の屋台グルメと市民の憩いの風景が魅力です。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-hoconruacong-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Cong_truong_con_rua.jpg/1280px-Cong_truong_con_rua.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Hồ Con Rùa (Công trường Quốc tế · 1967) (Wikimedia Commons)",
          "en": "Real view of Turtle Lake (International Square · 1967) (Wikimedia Commons)",
          "fr": "Vue réelle de Lac de la Tortue (Place Internationale · 1967) (Wikimedia Commons)",
          "zh": "乌龟湖（国际广场 · 1967年）实景照片（维基共享资源）",
          "ja": "亀湖（国際広場・1967年）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-hoconruacong-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/20190923_Independence_Palace-13.jpg/1280px-20190923_Independence_Palace-13.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Hồ Con Rùa (Công trường Quốc tế · 1967) (Ảnh 2)",
          "en": "Architecture & atmosphere at Turtle Lake (International Square · 1967) (Photo 2)",
          "fr": "Architecture et ambiance à Lac de la Tortue (Place Internationale · 1967) (Photo 2)",
          "zh": "乌龟湖（国际广场 · 1967年）建筑与实景细节（图 2）",
          "ja": "亀湖（国際広場・1967年）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-hoconruacong-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/91/Ben_Thanh_market_2.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Hồ Con Rùa (Công trường Quốc tế · 1967) (Ảnh 3)",
          "en": "Architecture & atmosphere at Turtle Lake (International Square · 1967) (Photo 3)",
          "fr": "Architecture et ambiance à Lac de la Tortue (Place Internationale · 1967) (Photo 3)",
          "zh": "乌龟湖（国际广场 · 1967年）建筑与实景细节（图 3）",
          "ja": "亀湖（国際広場・1967年）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-hcr-1",
        "name": "Bánh Tráng Nướng & Trà Đào Hồ Con Rùa",
        "cuisine": "Ăn vặt Đường phố Sài Gòn",
        "specialtyDishes": [
          "Bánh tráng nướng Đà Lạt",
          "Bánh tráng trộn",
          "Trà đào cam sả"
        ],
        "rating": 4.6,
        "reviewCount": 2650,
        "priceRange": "20.000đ – 50.000đ",
        "lat": 10.7829,
        "lng": 106.6962,
        "address": "Công trường Quốc tế, Phường Võ Thị Sáu, Quận 3, TP.HCM",
        "openHours": "15:30 – 22:30",
        "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "thap-bitexco-saigon-skydeck",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7717,
    "lng": 106.7044,
    "category": "monument",
    "rating": 4.7,
    "reviewCount": 22400,
    "ticketPrice": "240.000đ (Saigon Skydeck tầng 49)",
    "address": "02 Hải Triều, Phường Bến Nghé, Quận 1, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/DJI_0550-HDR-Pano_Bitexco_Financial_Tower.jpg/1280px-DJI_0550-HDR-Pano_Bitexco_Financial_Tower.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Tháp Tài chính Bitexco & Đài quan sát Saigon Skydeck",
        "shortSummary": "Tòa tháp 68 tầng cao 262m lấy cảm hứng từ búp sen vươn lên trời xanh, sở hữu sân đỗ trực thăng tầng 52 và đài quan sát 360° Saigon Skydeck ở tầng 49.",
        "historicalEra": "Khánh thành năm 2010 (KTS Carlos Zapata)",
        "openingHours": "09:30 – 21:30 Hàng ngày",
        "architecturalHighlights": [
          "Hình khối búp hoa sen vươn cao – biểu tượng chuyển mình hiện đại của TP.HCM",
          "Đài quan sát Saigon Skydeck tầng 49 (cao 178m) với ống nhòm toàn cảnh 360° & Bảo tàng Áo dài mini",
          "Sân đỗ trực thăng vươn dài 22m ra ngoài không trung tại tầng 52 độc nhất Việt Nam"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Tháp Tài chính Bitexco tại số 2 Hải Triều, Quận 1 – công trình kiến trúc 68 tầng lấy cảm hứng từ đóa hoa sen Việt Nam do kiến trúc sư Carlos Zapata thiết kế.",
          "Từ Đài quan sát Saigon Skydeck ở tầng 49, quý khách có thể phóng tầm mắt 360 độ ngắm toàn bộ các di tích lịch sử Quận 1, dòng sông Sài Gòn uốn lượn và khung cảnh thành phố rực rỡ ánh đèn lúc hoàng hôn.",
          "Theo tư liệu bách khoa Wikipedia: Bitexco Financial Tower hay Tháp Tài chính Bitexco là một tòa nhà chọc trời được xây dựng tại phường Sài Gòn, Thành phố Hồ Chí Minh. Tòa nhà được xây dựng trên diện tích gần 6.100 m². Tổng vốn đầu tư ước tính khoảng 220 triệu USD, được tập đoàn Bitexco Group có trụ sở tại Hà Nội đầu tư xây dựng."
        ]
      },
      "en": {
        "name": "Bitexco Financial Tower & Saigon Skydeck",
        "shortSummary": "A 68-story lotus-inspired skyscraper in District 1 featuring a cantilevered 52nd-floor helipad and the 360-degree Saigon Skydeck observatory on floor 49.",
        "historicalEra": "Completed in 2010 (Carlos Zapata)",
        "openingHours": "09:30 – 21:30 Daily",
        "architecturalHighlights": [
          "262-meter lotus-bud glass tower symbolizing Ho Chi Minh City’s modern dynamism",
          "49th-floor Saigon Skydeck (178m high) with 360-degree skyline views & mini Ao Dai display",
          "Signature 22-meter cantilevered helipad jutting out from the 52nd floor"
        ],
        "audioScript": [
          "Welcome to Bitexco Financial Tower, Ho Chi Minh City’s lotus-shaped architectural icon featuring the 49th-floor Saigon Skydeck observatory.",
          "Historical context from Wikipedia: Bitexco Financial Tower (Vietnamese: Tháp Tài chính Bitexco) is a skyscraper in Financial District, Saigon, Ho Chi Minh City, Vietnam (next to the city's state treasury). At its completion in 2010, it became the tallest building in Vietnam and kept this status until January 2011, when it was surpassed by Keangnam Hanoi Landmark Tower."
        ]
      },
      "fr": {
        "name": "Tour Bitexco & Observatoire Saigon Skydeck",
        "shortSummary": "Gratte-ciel de 68 étages inspiré du bouton de lotus avec héliport en porte-à-faux et observatoire panoramique à 360° au 49e étage.",
        "historicalEra": "Inaugurée en 2010",
        "openingHours": "09h30 – 21h30",
        "architecturalHighlights": [
          "Silhouette en bouton de lotus haute de 262 mètres",
          "Observatoire Saigon Skydeck au 49e étage avec vue sur le fleuve Saïgon"
        ],
        "audioScript": [
          "Bienvenue à la tour Bitexco, gratte-ciel emblématique en forme de lotus offrant une vue panoramique depuis le 49e étage."
        ]
      },
      "zh": {
        "name": "金融塔（Bitexco）与西贡观景台",
        "shortSummary": "高262米的68层莲花造型摩天大楼，拥有标志性52层悬挑停机坪与49层360度西贡全景玻璃观景台。",
        "historicalEra": "2010年落成",
        "openingHours": "09:30 – 21:30",
        "architecturalHighlights": [
          "以越南国花莲花为灵感的现代玻璃幕墙大厦",
          "49层西贡观景台俯瞰第一郡历史城区与西贡河"
        ],
        "audioScript": [
          "欢迎来到第一郡的Bitexco金融塔，登上49层观景台即可360度饱览胡志明市日落与夜景。"
        ]
      },
      "ja": {
        "name": "ビテクスコ・フィナンシャルタワー＆サイゴン・スカイデック",
        "shortSummary": "蓮のつぼみをモチーフにした高さ262mの超高層ビル。49階の360度展望台「サイゴン・スカイデック」から市内を一望できます。",
        "historicalEra": "2010年完成",
        "openingHours": "09:30 – 21:30",
        "architecturalHighlights": [
          "52階から突き出す象徴的なヘリポートと蓮形ガラスファサード",
          "49階展望台からの360度パノラマ夜景とアオザイ展示"
        ],
        "audioScript": [
          "蓮のつぼみを模したホーチミン市の象徴、ビテクスコタワーへようこそ。49階展望台からの絶景が人気です。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-thapbitexcos-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/DJI_0550-HDR-Pano_Bitexco_Financial_Tower.jpg/1280px-DJI_0550-HDR-Pano_Bitexco_Financial_Tower.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Tháp Tài chính Bitexco & Đài quan sát Saigon Skydeck (Wikimedia Commons)",
          "en": "Real view of Bitexco Financial Tower & Saigon Skydeck (Wikimedia Commons)",
          "fr": "Vue réelle de Tour Bitexco & Observatoire Saigon Skydeck (Wikimedia Commons)",
          "zh": "金融塔（Bitexco）与西贡观景台实景照片（维基共享资源）",
          "ja": "ビテクスコ・フィナンシャルタワー＆サイゴン・スカイデックの実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-thapbitexcos-2",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/fa/%27Bitexco_Financial_Tower%27_as_seen_from_Bach_Dang_wharf..JPG?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Tháp Tài chính Bitexco & Đài quan sát Saigon Skydeck (Ảnh 2)",
          "en": "Architecture & atmosphere at Bitexco Financial Tower & Saigon Skydeck (Photo 2)",
          "fr": "Architecture et ambiance à Tour Bitexco & Observatoire Saigon Skydeck (Photo 2)",
          "zh": "金融塔（Bitexco）与西贡观景台建筑与实景细节（图 2）",
          "ja": "ビテクスコ・フィナンシャルタワー＆サイゴン・スカイデックの建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-thapbitexcos-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ca/BFTlookingup.jpg/1280px-BFTlookingup.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Tháp Tài chính Bitexco & Đài quan sát Saigon Skydeck (Ảnh 3)",
          "en": "Architecture & atmosphere at Bitexco Financial Tower & Saigon Skydeck (Photo 3)",
          "fr": "Architecture et ambiance à Tour Bitexco & Observatoire Saigon Skydeck (Photo 3)",
          "zh": "金融塔（Bitexco）与西贡观景台建筑与实景细节（图 3）",
          "ja": "ビテクスコ・フィナンシャルタワー＆サイゴン・スカイデックの建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-btx-1",
        "name": "EON51 Fine Dining & Cafe (Tầng 50–51 Bitexco)",
        "cuisine": "Ẩm thực Âu – Á & Sky Lounge",
        "specialtyDishes": [
          "Bò Wagyu nướng",
          "Trà chiều trên mây",
          "Cocktail hoàng hôn Sài Gòn"
        ],
        "rating": 4.7,
        "reviewCount": 2430,
        "priceRange": "120.000đ – 550.000đ",
        "lat": 10.7718,
        "lng": 106.7045,
        "address": "Tầng 50–51, Tháp Bitexco, 02 Hải Triều, Quận 1, TP.HCM",
        "openHours": "08:00 – 23:00",
        "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "landmark-81-central-park",
    "city": "Bình Thạnh · TP.HCM",
    "district": "Bình Thạnh",
    "lat": 10.7949,
    "lng": 106.7218,
    "category": "monument",
    "rating": 4.8,
    "reviewCount": 38900,
    "ticketPrice": "Miễn phí công viên (SkyView từ 405.000đ)",
    "address": "720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Ho_Chi_Minh_City_panorama_2019_%28cropped%29.jpg/1280px-Ho_Chi_Minh_City_panorama_2019_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Landmark 81 SkyView & Công viên Vinhomes Central Park",
        "shortSummary": "Tòa nhà cao nhất Việt Nam (461,2m) lấy cảm hứng từ bó tre truyền thống, đi kèm công viên ven sông 14 hecta với cầu đỏ, vườn Nhật và góc chụp toàn thân tháp tuyệt đẹp.",
        "historicalEra": "Khánh thành năm 2018 (Cao 461,2m)",
        "openingHours": "09:30 – 22:00 (Công viên 05:00 – 21:30)",
        "architecturalHighlights": [
          "Thiết kế 25 ống trụ mô phỏng bó tre Việt Nam vươn cao 461,2m – cao nhất Đông Nam Á khi khánh thành",
          "Đài quan sát Landmark 81 SkyView tầng 79–81 với cầu kính SkyTouch và trải nghiệm thực tế ảo",
          "Công viên Central Park 14ha ven sông Sài Gòn có vườn cá Koi, cầu gỗ đỏ kiểu Nhật & bãi cỏ ngắm hoàng hôn"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Landmark 81 và Công viên Vinhomes Central Park bên bờ sông Sài Gòn, quận Bình Thạnh.",
          "Với chiều cao 461,2 mét gồm 81 tầng lấy ý tưởng từ hình ảnh bó tre truyền thống đoàn kết của dân tộc Việt Nam, Landmark 81 là nóc nhà của Việt Nam và là điểm ngắm toàn cảnh thành phố ngoạn mục nhất từ tầng 79 đến 81.",
          "Theo tư liệu bách khoa Wikipedia: Vincom Landmark 81, hay đơn giản là Landmark 81 hoặc còn được gọi là The Landmark 81, là tòa nhà chọc trời siêu cao ở Thành phố Hồ Chí Minh thuộc tổ hợp dự án Vinhomes Central Park trị giá 1,4 tỷ USD do Công ty Cổ phần Đầu tư xây dựng Tân Liên Phát thuộc Vingroup làm chủ đầu tư. Landmark 81 là tòa nhà cao nhất Việt Nam, tòa nhà cao thứ hai Đông Nam Á (bị phá kỉ lục là tòa nhà cao nhất bởi Merdeka 118 vào năm 2022), và là tòa nhà cao thứ 17 trên thế giới."
        ]
      },
      "en": {
        "name": "Landmark 81 SkyView & Vinhomes Central Park",
        "shortSummary": "Vietnam’s tallest skyscraper (461.2m) inspired by a traditional bundle of bamboo, paired with a 14-hectare riverside park featuring a Japanese garden and skyline lawns.",
        "historicalEra": "Completed in 2018 (461.2m)",
        "openingHours": "09:30 – 22:00 (Park 05:00 – 21:30)",
        "architecturalHighlights": [
          "461.2-meter bamboo-bundle silhouette visible across Ho Chi Minh City",
          "Landmark 81 SkyView observation deck across floors 79–81",
          "14-hectare Saigon riverside park with Japanese koi garden, red bridge, and photo lawns"
        ],
        "audioScript": [
          "Welcome to Landmark 81, Vietnam’s tallest tower at 461.2 meters, overlooking the lush 14-hectare Vinhomes Central Park along the Saigon River.",
          "Historical context from Wikipedia: Landmark 81 is a supertall skyscraper in Ho Chi Minh City, Vietnam. It is primarily invested in and developed by Vinhomes, the largest Vietnamese real-estate developer. Landmark 81 holds the position of the tallest building in Vietnam, the second-tallest building in Southeast Asia, as well as the seventeenth-tallest building in the world overall."
        ]
      },
      "fr": {
        "name": "Landmark 81 SkyView & Parc Central Park",
        "shortSummary": "Plus haut gratte-ciel du Vietnam (461,2 m) inspiré d’un faisceau de bambous, bordé par un grand parc fluvial de 14 hectares.",
        "historicalEra": "2018",
        "openingHours": "09h30 – 22h00",
        "architecturalHighlights": [
          "Tour de 81 étages et observatoire SkyView aux étages 79–81",
          "Parc de 14 hectares avec jardin japonais et pont rouge"
        ],
        "audioScript": [
          "Bienvenue à Landmark 81, la plus haute tour du Vietnam, bordée par le grand parc fluvial Central Park."
        ]
      },
      "zh": {
        "name": "地标81大厦（Landmark 81）与中央公园",
        "shortSummary": "越南第一高楼（461.2米），造型灵感源自竹束，楼下14公顷西贡河畔公园拥有日式红桥与大草坪，极适合拍照。",
        "historicalEra": "2018年落成",
        "openingHours": "09:30 – 22:00（公园 05:00 – 21:30）",
        "architecturalHighlights": [
          "高461.2米、81层的越南最高建筑与79–81层云端观景台",
          "14公顷滨江公园、日式锦鲤池与草坪机位"
        ],
        "audioScript": [
          "欢迎来到越南最高建筑地标81大厦及滨江中央公园，无论登顶俯瞰还是在草坪拍全景都极为震撼。"
        ]
      },
      "ja": {
        "name": "ランドマーク81 スカイビュー＆セントラルパーク",
        "shortSummary": "ベトナム最高層（461.2m）の超高層タワーとサイゴン川沿い14ヘクタールの緑豊かな公園。日本庭園や79〜81階展望台が見どころです。",
        "historicalEra": "2018年開業",
        "openingHours": "09:30 – 22:00（公園 05:00 – 21:30）",
        "architecturalHighlights": [
          "竹の束をモチーフにした高さ461.2m・81階建てのシンボルタワー",
          "79〜81階スカイビュー展望台と川沿いの日本庭園・赤い橋"
        ],
        "audioScript": [
          "ベトナム一の高さを誇るランドマーク81とセントラルパークへようこそ。展望台と川沿いの公園散策が楽しめます。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-landmark81ce-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Ho_Chi_Minh_City_panorama_2019_%28cropped%29.jpg/1280px-Ho_Chi_Minh_City_panorama_2019_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Landmark 81 SkyView & Công viên Vinhomes Central Park (Wikimedia Commons)",
          "en": "Real view of Landmark 81 SkyView & Vinhomes Central Park (Wikimedia Commons)",
          "fr": "Vue réelle de Landmark 81 SkyView & Parc Central Park (Wikimedia Commons)",
          "zh": "地标81大厦（Landmark 81）与中央公园实景照片（维基共享资源）",
          "ja": "ランドマーク81 スカイビュー＆セントラルパークの実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-landmark81ce-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Landmark_81_%282%29.jpg/1280px-Landmark_81_%282%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Landmark 81 SkyView & Công viên Vinhomes Central Park (Ảnh 2)",
          "en": "Architecture & atmosphere at Landmark 81 SkyView & Vinhomes Central Park (Photo 2)",
          "fr": "Architecture et ambiance à Landmark 81 SkyView & Parc Central Park (Photo 2)",
          "zh": "地标81大厦（Landmark 81）与中央公园建筑与实景细节（图 2）",
          "ja": "ランドマーク81 スカイビュー＆セントラルパークの建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-landmark81ce-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/75/A_huge_superstructure_in_Ho_Chi_Minh_City_%2837806415345%29.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Landmark 81 SkyView & Công viên Vinhomes Central Park (Ảnh 3)",
          "en": "Architecture & atmosphere at Landmark 81 SkyView & Vinhomes Central Park (Photo 3)",
          "fr": "Architecture et ambiance à Landmark 81 SkyView & Parc Central Park (Photo 3)",
          "zh": "地标81大厦（Landmark 81）与中央公园建筑与实景细节（图 3）",
          "ja": "ランドマーク81 スカイビュー＆セントラルパークの建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-lm81-1",
        "name": "Nhà hàng Dì Mai – Landmark 81",
        "cuisine": "Ẩm thực Việt Nam Truyền thống",
        "specialtyDishes": [
          "Gỏi cuốn tôm thịt",
          "Cơm niêu Sài Gòn",
          "Bánh xèo miền Nam"
        ],
        "rating": 4.6,
        "reviewCount": 2890,
        "priceRange": "95.000đ – 240.000đ",
        "lat": 10.7951,
        "lng": 106.7219,
        "address": "Tầng L02, Vincom Center Landmark 81, Bình Thạnh, TP.HCM",
        "openHours": "10:00 – 22:00",
        "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 75
  },
  {
    "id": "cau-anh-sao-ho-ban-nguyet",
    "city": "Quận 7 · TP.HCM",
    "district": "Quận 7",
    "lat": 10.7279,
    "lng": 106.7186,
    "category": "monument",
    "rating": 4.7,
    "reviewCount": 14600,
    "ticketPrice": "Miễn phí tham quan",
    "address": "Khu đô thị Phú Mỹ Hưng, Phường Tân Phú, Quận 7, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Khu_%C4%91%C3%B4_th%E1%BB%8B_Ph%C3%BA_M%E1%BB%B9_H%C6%B0ng_Qu%E1%BA%ADn_7_Th%C3%A0nh_Ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg/1280px-Khu_%C4%91%C3%B4_th%E1%BB%8B_Ph%C3%BA_M%E1%BB%B9_H%C6%B0ng_Qu%E1%BA%ADn_7_Th%C3%A0nh_Ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Cầu Ánh Sao & Hồ Bán Nguyệt (Phú Mỹ Hưng)",
        "shortSummary": "Cây cầu đi bộ hiện đại đầu tiên tại TP.HCM dài 170m bắc qua Hồ Bán Nguyệt, rực rỡ hệ thống đèn LED bảy sắc cầu vồng và thác nước nhân tạo mỗi tối cuối tuần.",
        "historicalEra": "Khánh thành năm 2010",
        "openingHours": "Mở cửa 24/7 (Đèn LED & phun nước 18:00 – 21:30)",
        "architecturalHighlights": [
          "Mặt cầu lát hệ thống đèn LED mô phỏng dải ngân hà lấp lánh dưới bước chân người đi bộ",
          "Hai đầu cầu thiết kế quảng trường Mặt Trăng và Mặt Trời rộng thoáng",
          "Không gian công viên ven Hồ Bán Nguyệt thanh bình, lý tưởng dạo bộ buổi chiều tối"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Cầu Ánh Sao và Hồ Bán Nguyệt tại khu đô thị Phú Mỹ Hưng, Quận 7.",
          "Với chiều dài 170 mét uốn cong mềm mại bắc qua mặt hồ rộng lớn, Cầu Ánh Sao nổi bật mỗi tối với hàng nghìn bóng đèn LED đổi màu tựa dải sao và màn phun nước nghệ thuật hai bên thành cầu.",
          "Theo tư liệu bách khoa Wikipedia: Khu đô thị Phú Mỹ Hưng là một khu đô thị thuộc các phường Tân Hưng và Tân Mỹ toạ lạc ở phía Nam Thành phố Hồ Chí Minh. Đây là nơi tập trung sinh sống của những người có thu nhập cao, do Công ty TNHH Phát triển Phú Mỹ Hưng (tên cũ: Công ty TNHH Liên doanh Phú Mỹ Hưng) quản lý. Ngày 26 tháng 6 năm 2008, Bộ Xây dựng và Uỷ ban nhân dân Thành phố Hồ Chí Minh công nhận đô thị Phú Mỹ Hưng là \"Khu đô thị kiểu mẫu\" của Việt Nam."
        ]
      },
      "en": {
        "name": "Starlight Bridge & Crescent Lake (Phu My Hung)",
        "shortSummary": "A romantic 170-meter pedestrian bridge spanning Crescent Lake in District 7, famous for its starry LED walkway and colorful waterfall light shows at night.",
        "historicalEra": "Opened in 2010",
        "openingHours": "Open 24/7 (Lights 18:00 – 21:30)",
        "architecturalHighlights": [
          "Curved 170m pedestrian bridge embedded with twinkling star-like LED lights",
          "Sun and Moon themed plazas at opposite ends of Crescent Lake",
          "Waterfront promenade lined with cafes and Crescent Mall"
        ],
        "audioScript": [
          "Welcome to Starlight Bridge and Crescent Lake in Phu My Hung, District 7—one of Saigon’s most scenic evening walks and night photography spots.",
          "Historical context from Wikipedia: Phú Mỹ Hưng Urban Area (Vietnamese: Khu đô thị Phú Mỹ Hưng) or Saigon South Urban Development (Khu đô thị Nam Sài Gòn, Khu đô thị Nam Thành phố) is a planned community in District 7, District 8 and Bình Chánh district, Ho Chi Minh City. The area is managed by the Phu My Hung Development Corporation."
        ]
      },
      "fr": {
        "name": "Pont Starlight & Lac du Croissant (Phu My Hung)",
        "shortSummary": "Passerelle piétonne lumineuse de 170 mètres enjambant le lac du Croissant dans le 7e arrondissement, illuminée chaque soir.",
        "historicalEra": "2010",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "Allée piétonne constellée de lumières LED et cascades colorées",
          "Promenade calme autour du lac du Croissant"
        ],
        "audioScript": [
          "Bienvenue au pont Starlight dans le quartier moderne de Phu My Hung, idéal pour une promenade nocturne."
        ]
      },
      "zh": {
        "name": "星光桥与半月湖（富美兴 · 第七郡）",
        "shortSummary": "横跨第七郡半月湖的170米浪漫步行桥，夜晚桥面星光LED与七彩瀑布水幕交相辉映，是极佳的夜景打卡地。",
        "historicalEra": "2010年落成",
        "openingHours": "全天开放（18:00 – 21:30亮灯）",
        "architecturalHighlights": [
          "如银河般闪烁的星光LED步行桥面与彩虹喷泉",
          "环绕半月湖的现代化滨水广场与咖啡街区"
        ],
        "audioScript": [
          "欢迎来到第七郡富美兴的星光桥与半月湖，夜晚漫步在星光闪烁的桥面上十分浪漫。"
        ]
      },
      "ja": {
        "name": "スターライトブリッジ＆クレセント湖（7区フーミーフン）",
        "shortSummary": "7区フーミーフンの半月湖に架かる全長170mの歩行者専用橋。夜には橋面が星空のように輝き、噴水ライトアップが幻想的です。",
        "historicalEra": "2010年開通",
        "openingHours": "24時間開放（ライトアップ 18:00 – 21:30）",
        "architecturalHighlights": [
          "足元に星空が広がるLED歩道とカラフルな噴水ショー",
          "落ち着いた湖畔プロムナードとカフェエリア"
        ],
        "audioScript": [
          "7区フーミーフンの名所、スターライトブリッジと半月湖へようこそ。夜のライトアップ散歩におすすめです。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-cauanhsaohob-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Khu_%C4%91%C3%B4_th%E1%BB%8B_Ph%C3%BA_M%E1%BB%B9_H%C6%B0ng_Qu%E1%BA%ADn_7_Th%C3%A0nh_Ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg/1280px-Khu_%C4%91%C3%B4_th%E1%BB%8B_Ph%C3%BA_M%E1%BB%B9_H%C6%B0ng_Qu%E1%BA%ADn_7_Th%C3%A0nh_Ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Cầu Ánh Sao & Hồ Bán Nguyệt (Phú Mỹ Hưng) (Wikimedia Commons)",
          "en": "Real view of Starlight Bridge & Crescent Lake (Phu My Hung) (Wikimedia Commons)",
          "fr": "Vue réelle de Pont Starlight & Lac du Croissant (Phu My Hung) (Wikimedia Commons)",
          "zh": "星光桥与半月湖（富美兴 · 第七郡）实景照片（维基共享资源）",
          "ja": "スターライトブリッジ＆クレセント湖（7区フーミーフン）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-cauanhsaohob-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/Khu_%C4%90%C3%B4_TH%E1%BB%8B_Ph%C3%BA_M%E1%BB%B9_H%C6%B0ng.jpg/1280px-Khu_%C4%90%C3%B4_TH%E1%BB%8B_Ph%C3%BA_M%E1%BB%B9_H%C6%B0ng.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Cầu Ánh Sao & Hồ Bán Nguyệt (Phú Mỹ Hưng) (Ảnh 2)",
          "en": "Architecture & atmosphere at Starlight Bridge & Crescent Lake (Phu My Hung) (Photo 2)",
          "fr": "Architecture et ambiance à Pont Starlight & Lac du Croissant (Phu My Hung) (Photo 2)",
          "zh": "星光桥与半月湖（富美兴 · 第七郡）建筑与实景细节（图 2）",
          "ja": "スターライトブリッジ＆クレセント湖（7区フーミーフン）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-cauanhsaohob-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Khu_%C4%91%C3%B4_th%E1%BB%8B_Ph%C3%BA_M%E1%BB%B9_H%C6%B0ng_Qu%E1%BA%ADn_7_Th%C3%A0nh_Ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg/1280px-Khu_%C4%91%C3%B4_th%E1%BB%8B_Ph%C3%BA_M%E1%BB%B9_H%C6%B0ng_Qu%E1%BA%ADn_7_Th%C3%A0nh_Ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Cầu Ánh Sao & Hồ Bán Nguyệt (Phú Mỹ Hưng) (Ảnh 3)",
          "en": "Architecture & atmosphere at Starlight Bridge & Crescent Lake (Phu My Hung) (Photo 3)",
          "fr": "Architecture et ambiance à Pont Starlight & Lac du Croissant (Phu My Hung) (Photo 3)",
          "zh": "星光桥与半月湖（富美兴 · 第七郡）建筑与实景细节（图 3）",
          "ja": "スターライトブリッジ＆クレセント湖（7区フーミーフン）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cas-1",
        "name": "Boomarang Bistro Saigon (Ven Hồ Bán Nguyệt)",
        "cuisine": "Bistro Âu – Á & View Hồ",
        "specialtyDishes": [
          "Sườn nướng BBQ",
          "Bánh mì bơ tỏi hải sản",
          "Salad cá hồi"
        ],
        "rating": 4.6,
        "reviewCount": 1940,
        "priceRange": "120.000đ – 320.000đ",
        "lat": 10.7289,
        "lng": 106.7189,
        "address": "107 Tôn Dật Tiên, Phú Mỹ Hưng, Quận 7, TP.HCM",
        "openHours": "07:00 – 22:30",
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
    "id": "den-hindu-mariamman",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7722,
    "lng": 106.6956,
    "category": "temple",
    "rating": 4.6,
    "reviewCount": 5420,
    "ticketPrice": "Miễn phí tham quan",
    "address": "45 Trương Định, Phường Bến Thành, Quận 1, TP.HCM",
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/4/48/Mariamman_Temple%2C_HCMC.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
    "translations": {
      "vi": {
        "name": "Đền Ấn Độ giáo Mariamman (Chùa Bà Ấn · 1885)",
        "shortSummary": "Ngôi đền Hindu giáo cổ kính và linh thiêng nhất TP.HCM xây dựng cuối thế kỷ 19 ngay gần Chợ Bến Thành, nổi bật với tháp cổng Gopuram rực rỡ điêu khắc Nam Ấn.",
        "historicalEra": "Cuối thế kỷ 19 (Khoảng 1885)",
        "openingHours": "07:00 – 19:00 Hàng ngày",
        "architecturalHighlights": [
          "Tháp cổng Gopuram cao 12m chạm trổ hàng chục pho tượng thần linh Ấn Độ giáo đa sắc màu",
          "Chánh điện thờ Nữ thần Mariamman cùng hai vị thần bảo hộ Maduraiveeran và Pechiamman",
          "Tường đá ốp phù điêu 18 vị thần Ấn Độ và không gian trầm hương đậm chất Nam Á giữa Quận 1"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Đền Ấn Độ giáo Mariamman tại số 45 Trương Định, chỉ cách Chợ Bến Thành vài phút đi bộ.",
          "Được cộng đồng người Tamil gốc Ấn xây dựng vào cuối thế kỷ 19, ngôi đền là minh chứng sinh động cho bản sắc đa văn hóa của Sài Gòn với tháp cổng Gopuram chạm khắc sống động và không gian tín ngưỡng rực rỡ sắc màu Nam Ấn.",
          "Theo tư liệu bách khoa Wikipedia: Đền Bà Ấn còn gọi là Đền Bà Mariamman là một ngôi đền thờ nữ thần Mariamman của Ấn Độ giáo ở Thành phố Hồ Chí Minh, Việt Nam. Đền này được Palaniappa Thevar từ Pattukkottai, huyện Thanjavur, một cộng đồng thương mại xứ Tamil Nadu, Ấn Độ xây dựng vào cuối thế kỷ 19."
        ]
      },
      "en": {
        "name": "Mariamman Hindu Temple (Saigon · 1885)",
        "shortSummary": "Ho Chi Minh City’s most prominent 19th-century South Indian Hindu temple near Ben Thanh Market, famed for its colorful sculpted Gopuram tower.",
        "historicalEra": "Late 19th Century (~1885)",
        "openingHours": "07:00 – 19:00 Daily",
        "architecturalHighlights": [
          "12-meter colorful Gopuram gate tower adorned with intricate Hindu deity sculptures",
          "Inner sanctum dedicated to Goddess Mariamman with stone carvings imported from Tamil Nadu",
          "Fragrant jasmine garlands and serene multicultural heritage steps from Ben Thanh Market"
        ],
        "audioScript": [
          "Welcome to Mariamman Hindu Temple on Truong Dinh Street, built by the Tamil community in the late 19th century and celebrated for its vivid South Indian architecture.",
          "Historical context from Wikipedia: The Mariamman Temple in Ho Chi Minh City, Vietnam, is a temple dedicated to the Hindu goddess Mariamman. It was built in the late 19th century by the Nagarathar a trade community from Tamil Nadu, India."
        ]
      },
      "fr": {
        "name": "Temple Hindou Mariamman (1885)",
        "shortSummary": "Temple hindou du XIXe siècle au cœur du 1er arrondissement, remarquable par sa tour Gopuram colorée et ses sculptures tamoules.",
        "historicalEra": "Fin XIXe siècle",
        "openingHours": "07h00 – 19h00",
        "architecturalHighlights": [
          "Tour-portail Gopuram sculptée de 12 mètres aux couleurs vives",
          "Sanctuaire dédié à la déesse Mariamman près du marché Ben Thanh"
        ],
        "audioScript": [
          "Bienvenue au temple hindou Mariamman, joyau du patrimoine multiculturel de Saïgon depuis le XIXe siècle."
        ]
      },
      "zh": {
        "name": "马里安曼印度教神庙（1885年）",
        "shortSummary": "坐落于滨城市场附近的百年南印度风格印度教寺庙，以色彩绚丽、神像雕刻精美的门塔闻名。",
        "historicalEra": "19世纪末（约1885年）",
        "openingHours": "07:00 – 19:00",
        "architecturalHighlights": [
          "12米高南印度彩绘门塔与精雕神像浮雕",
          "供奉雨神与丰收女神马里安曼，展现西贡多元文化"
        ],
        "audioScript": [
          "欢迎来到靠近滨城市场的马里安曼印度庙，这里色彩斑斓的南印度雕塑令人过目难忘。"
        ]
      },
      "ja": {
        "name": "マリアマン・ヒンドゥー寺院（1885年）",
        "shortSummary": "ベンタイン市場近くの19世紀末建立のヒンドゥー教寺院。極彩色の南インド様式ゴープラム（塔門）が目を引く多文化遺産です。",
        "historicalEra": "19世紀末（1885年頃）",
        "openingHours": "07:00 – 19:00",
        "architecturalHighlights": [
          "神々の彫刻が連なる色鮮やかな高さ12mの塔門",
          "南インド・タミル文化が息づく香煙たなびく礼拝堂"
        ],
        "audioScript": [
          "19世紀末に建てられたサイゴン随一のヒンドゥー寺院、マリアマン寺院へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-denhindumari-1",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/48/Mariamman_Temple%2C_HCMC.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Đền Ấn Độ giáo Mariamman (Chùa Bà Ấn · 1885) (Wikimedia Commons)",
          "en": "Real view of Mariamman Hindu Temple (Saigon · 1885) (Wikimedia Commons)",
          "fr": "Vue réelle de Temple Hindou Mariamman (1885) (Wikimedia Commons)",
          "zh": "马里安曼印度教神庙（1885年）实景照片（维基共享资源）",
          "ja": "マリアマン・ヒンドゥー寺院（1885年）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-denhindumari-2",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/4/48/Mariamman_Temple%2C_HCMC.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Đền Ấn Độ giáo Mariamman (Chùa Bà Ấn · 1885) (Ảnh 2)",
          "en": "Architecture & atmosphere at Mariamman Hindu Temple (Saigon · 1885) (Photo 2)",
          "fr": "Architecture et ambiance à Temple Hindou Mariamman (1885) (Photo 2)",
          "zh": "马里安曼印度教神庙（1885年）建筑与实景细节（图 2）",
          "ja": "マリアマン・ヒンドゥー寺院（1885年）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-denhindumari-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/2/26/Hanoi_temple_de_la_litterature_1.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Đền Ấn Độ giáo Mariamman (Chùa Bà Ấn · 1885) (Ảnh 3)",
          "en": "Architecture & atmosphere at Mariamman Hindu Temple (Saigon · 1885) (Photo 3)",
          "fr": "Architecture et ambiance à Temple Hindou Mariamman (1885) (Photo 3)",
          "zh": "马里安曼印度教神庙（1885年）建筑与实景细节（图 3）",
          "ja": "マリアマン・ヒンドゥー寺院（1885年）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-mrm-1",
        "name": "Tandoor Indian Restaurant (Gần Đền Mariamman)",
        "cuisine": "Ẩm thực Ấn Độ Truyền thống",
        "specialtyDishes": [
          "Cà ri gà bơ Butter Chicken",
          "Bánh Naan tỏi",
          "Cơm Biryani"
        ],
        "rating": 4.7,
        "reviewCount": 2150,
        "priceRange": "90.000đ – 240.000đ",
        "lat": 10.7731,
        "lng": 106.6976,
        "address": "39A–39B Ngô Đức Kế / Khu Bến Thành, Quận 1, TP.HCM",
        "openHours": "11:00 – 22:30",
        "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 35
  },
  {
    "id": "thanh-duong-hoi-giao-saigon",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7765,
    "lng": 106.7047,
    "category": "temple",
    "rating": 4.7,
    "reviewCount": 4280,
    "ticketPrice": "Miễn phí tham quan (Trang phục lịch sự)",
    "address": "66 Đông Du, Phường Bến Nghé, Quận 1, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Mosque_in_Ho_Chi_Minh_City.jpg/1280px-Mosque_in_Ho_Chi_Minh_City.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Thánh đường Hồi giáo Jamia Al-Musulman (Saigon Central Mosque · 1935)",
        "shortSummary": "Thánh đường Hồi giáo trung tâm xây dựng năm 1935 trên phố Đông Du với kiến trúc vòm cung trắng – xanh ngọc tinh khôi và sân hồ nước tĩnh lặng giữa lòng Quận 1.",
        "historicalEra": "Khởi dựng năm 1935 (Trùng tu 1999)",
        "openingHours": "08:00 – 20:00 Hàng ngày",
        "architecturalHighlights": [
          "Cổng vòm bán nguyệt, hàng cột tròn thanh thoát và 4 tháp bút mang đậm mỹ thuật Hồi giáo cổ điển",
          "Bảng màu trắng tinh khôi điểm xanh ngọc tạo nên không gian chụp ảnh tối giản, thanh bình",
          "Bao quanh là nhiều quán ăn Halal chuẩn vị Ấn Độ – Malaysia ngay giữa phố Đồng Khởi – Đông Du"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Thánh đường Hồi giáo Jamia Al-Musulman tại số 66 Đông Du – ốc đảo yên bình giữa khu phố Đồng Khởi nhộn nhịp của Quận 1.",
          "Xây dựng năm 1935 bởi cộng đồng người Hồi giáo gốc Nam Ấn, thánh đường gây ấn tượng bằng kiến trúc vòm cong màu trắng – xanh ngọc và hồ nước thanh tịnh, mở cửa thân thiện đón du khách mặc trang phục lịch sự."
        ]
      },
      "en": {
        "name": "Saigon Central Mosque (Jamia Al-Musulman · 1935)",
        "shortSummary": "A serene 1935 white-and-turquoise Islamic mosque tucked along Dong Du Street in District 1, featuring graceful arches, minarets, and a courtyard reflection pool.",
        "historicalEra": "Built in 1935",
        "openingHours": "08:00 – 20:00 Daily",
        "architecturalHighlights": [
          "Graceful white and pastel-green Islamic arches with four slender minarets",
          "Peaceful courtyard ablution pool contrasting with bustling Dong Khoi nearby",
          "Surrounded by popular Halal Malaysian and Indian eateries"
        ],
        "audioScript": [
          "Welcome to Saigon Central Mosque on Dong Du Street, built in 1935 in serene white and turquoise Islamic architecture right in central District 1.",
          "Historical context from Wikipedia: The Saigon Central Mosque (Vietnamese: Nhà thờ Hồi giáo Musulman) is a mosque in Ho Chi Minh City, Vietnam and it is one of the ancient and historic Mosque in the region. It was completed in the Year 1935 since the construction began in 1934 December 21 and was led by JM Mohamed Ismael, Chief of the Muslims Congregations, Head of British Indian Muslims Community."
        ]
      },
      "fr": {
        "name": "Mosquée Centrale de Saïgon (Jamia Al-Musulman · 1935)",
        "shortSummary": "Havre de paix de 1935 aux arches blanches et vert turquoise au cœur du 1er arrondissement, près de la rue Dong Khoi.",
        "historicalEra": "1935",
        "openingHours": "08h00 – 20h00",
        "architecturalHighlights": [
          "Arches islamiques blanches et vert pastel avec quatre minarets",
          "Cour paisible dotée d’un bassin d’ablutions"
        ],
        "audioScript": [
          "Bienvenue à la Grande Mosquée de Saïgon, édifiée en 1935 rue Dong Du."
        ]
      },
      "zh": {
        "name": "西贡中央清真寺（1935年）",
        "shortSummary": "建于1935年的白色与薄荷绿拱门清真寺，藏身繁华的同起街旁，庭院静谧素雅，极具建筑摄影美感。",
        "historicalEra": "建于1935年",
        "openingHours": "08:00 – 20:00",
        "architecturalHighlights": [
          "优雅的伊斯兰拱廊、白绿配色与四座宣礼尖塔",
          "周边汇聚胡志明市最地道的清真餐厅"
        ],
        "audioScript": [
          "欢迎来到东游街66号的西贡中央清真寺，这座1935年的清雅建筑是市中心的一片宁静绿洲。"
        ]
      },
      "ja": {
        "name": "サイゴン・セントラル・モスク（1935年）",
        "shortSummary": "ドンコイ通り近くに佇む1935年建立の白とターコイズブルーのモスク。美しいアーチと静かな中庭が都会の喧騒を忘れさせます。",
        "historicalEra": "1935年建立",
        "openingHours": "08:00 – 20:00",
        "architecturalHighlights": [
          "白と淡いグリーンが映えるイスラム様式のアーチと尖塔",
          "周辺にはハラル料理の人気レストランも充実"
        ],
        "audioScript": [
          "1935年に建てられたサイゴン・セントラル・モスクへようこそ。白と緑の清らかな建築が見どころです。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-thanhduongho-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Mosque_in_Ho_Chi_Minh_City.jpg/1280px-Mosque_in_Ho_Chi_Minh_City.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Thánh đường Hồi giáo Jamia Al-Musulman (Saigon Central Mosque · 1935) (Wikimedia Commons)",
          "en": "Real view of Saigon Central Mosque (Jamia Al-Musulman · 1935) (Wikimedia Commons)",
          "fr": "Vue réelle de Mosquée Centrale de Saïgon (Jamia Al-Musulman · 1935) (Wikimedia Commons)",
          "zh": "西贡中央清真寺（1935年）实景照片（维基共享资源）",
          "ja": "サイゴン・セントラル・モスク（1935年）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-thanhduongho-2",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/37/Indian_mosque_in_Saigon_1911.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Thánh đường Hồi giáo Jamia Al-Musulman (Saigon Central Mosque · 1935) (Ảnh 2)",
          "en": "Architecture & atmosphere at Saigon Central Mosque (Jamia Al-Musulman · 1935) (Photo 2)",
          "fr": "Architecture et ambiance à Mosquée Centrale de Saïgon (Jamia Al-Musulman · 1935) (Photo 2)",
          "zh": "西贡中央清真寺（1935年）建筑与实景细节（图 2）",
          "ja": "サイゴン・セントラル・モスク（1935年）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-thanhduongho-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Mosque_in_Ho_Chi_Minh_City.jpg/1280px-Mosque_in_Ho_Chi_Minh_City.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Thánh đường Hồi giáo Jamia Al-Musulman (Saigon Central Mosque · 1935) (Ảnh 3)",
          "en": "Architecture & atmosphere at Saigon Central Mosque (Jamia Al-Musulman · 1935) (Photo 3)",
          "fr": "Architecture et ambiance à Mosquée Centrale de Saïgon (Jamia Al-Musulman · 1935) (Photo 3)",
          "zh": "西贡中央清真寺（1935年）建筑与实景细节（图 3）",
          "ja": "サイゴン・セントラル・モスク（1935年）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-tdhg-1",
        "name": "Halal@Saigon Restaurant (Đối diện Thánh đường)",
        "cuisine": "Ẩm thực Việt – Mã Halal",
        "specialtyDishes": [
          "Phở bò Halal",
          "Cơm gà Hải Nam Halal",
          "Gỏi cuốn tôm"
        ],
        "rating": 4.6,
        "reviewCount": 1850,
        "priceRange": "70.000đ – 180.000đ",
        "lat": 10.7764,
        "lng": 106.7044,
        "address": "31 Đông Du, Phường Bến Nghé, Quận 1, TP.HCM",
        "openHours": "10:30 – 21:30",
        "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 35
  },
  {
    "id": "nha-tho-huyen-sy",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7709,
    "lng": 106.6889,
    "category": "temple",
    "rating": 4.7,
    "reviewCount": 3180,
    "ticketPrice": "Miễn phí tham quan",
    "address": "01 Tôn Thất Tùng, Phường Phạm Ngũ Lão, Quận 1, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Nh%C3%A0_th%E1%BB%9D_huy%E1%BB%87n_S%E1%BB%B9_%E1%BB%9F_HCM.jpg/1280px-Nh%C3%A0_th%E1%BB%9D_huy%E1%BB%87n_S%E1%BB%B9_%E1%BB%9F_HCM.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Nhà thờ Huyện Sỹ (Thánh Phi-líp-phê · 1902)",
        "shortSummary": "Công trình kiến trúc Gothic cổ điển xây dựng hoàn toàn bằng đá hoa cương Biên Hòa năm 1902–1905, mang vẻ đẹp trầm mặc, uy nghiêm dưới tán cây cổ thụ.",
        "historicalEra": "1902 – 1905 (KTS Bouttier)",
        "openingHours": "05:00 – 11:00, 14:00 – 19:00 Hàng ngày",
        "architecturalHighlights": [
          "Mặt tiền và tường ốp đá hoa cương Biên Hòa nguyên khối hiếm có tại Sài Gòn",
          "Tháp chuông nhọn cao 57m đính tượng gà trống Gô-loa bằng đồng trên đỉnh",
          "Khuôn viên yên tĩnh rợp bóng cây xanh và lưu giữ lăng mộ cẩm thạch của gia đình ông Huyện Sỹ"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Nhà thờ Huyện Sỹ tại số 1 Tôn Thất Tùng, Quận 1 – một kiệt tác kiến trúc Neo-Gothic bằng đá hoa cương Biên Hòa xây dựng từ năm 1902 đến 1905.",
          "Ngôi nhà thờ mang tên người hiến đất và kinh phí xây dựng là ông Lê Phát Đạt – tức Huyện Sỹ, ông ngoại của Hoàng hậu Nam Phương. Vẻ trầm mặc của bức tường đá xám cổ kính tạo nên phông nền chụp ảnh châu Âu tuyệt đẹp.",
          "Theo tư liệu bách khoa Wikipedia: Nhà thờ Huyện Sỹ (tên chính thức là: Nhà thờ Thánh Philipphê Tông đồ) là một nhà thờ Công giáo cổ hơn 100 tuổi, tọa lạc tại số 1 đường Tôn Thất Tùng, phường Bến Thành, Thành phố Hồ Chí Minh, Việt Nam. Đây là nhà thờ của giáo xứ Chợ Đũi thuộc Tổng giáo phận Thành phố Hồ Chí Minh. Nhà thờ do ông bà Lê Phát Đạt, tức Huyện Sỹ, hiến đất và xuất 1/7 gia tài để xây dựng, thời giá lúc bấy giờ là khoảng trên 30 muôn (mười ngàn) đồng bạc Đông Dương. Khởi công xây dựng năm 1902 theo thiết kế của linh mục Bouttier, đến 1905 thì được khánh thành. Nhà thờ tọa lạc trên một khu đất cao và rộng hơn một mẫu, nằm ở góc đường Frère Louis (nay là đường Nguyễn Trãi) và Frère Guilleraut (nay là đường Tôn Thất Tùng)."
        ]
      },
      "en": {
        "name": "Huyen Sy Church (St. Philip Church · 1902)",
        "shortSummary": "A majestic Neo-Gothic church constructed from Bien Hoa granite between 1902 and 1905, renowned for its 57-meter spire and tranquil tree-shaded courtyard.",
        "historicalEra": "1902 – 1905",
        "openingHours": "05:00 – 11:00, 14:00 – 19:00 Daily",
        "architecturalHighlights": [
          "Rare Bien Hoa granite facade giving an authentic European Neo-Gothic character",
          "57-meter steeple topped with a bronze Gallic rooster and four French bells",
          "Connected to the historic family of Empress Nam Phuong"
        ],
        "audioScript": [
          "Welcome to Huyen Sy Church in District 1, built between 1902 and 1905 using local Bien Hoa granite in classic Neo-Gothic style."
        ]
      },
      "fr": {
        "name": "Église Huyen Sy (Saint-Philippe · 1902)",
        "shortSummary": "Édifice néo-gothique en granit de Bien Hoa bâti entre 1902 et 1905, surmonté d’une flèche de 57 mètres.",
        "historicalEra": "1902 – 1905",
        "openingHours": "05h00 – 11h00, 14h00 – 19h00",
        "architecturalHighlights": [
          "Façade en granit gris de Bien Hoa et clocher de 57 mètres",
          "Cour ombragée empreinte de sérénité au centre-ville"
        ],
        "audioScript": [
          "Bienvenue à l’église Huyen Sy, joyau néo-gothique en granit construit au début du XXe siècle."
        ]
      },
      "zh": {
        "name": "县士教堂（圣斐理伯堂 · 1902年）",
        "shortSummary": "1902至1905年以边和花岗岩建成的新哥特式古教堂，57米尖塔庄严肃穆，极具欧洲复古气息。",
        "historicalEra": "1902 – 1905年",
        "openingHours": "05:00 – 11:00, 14:00 – 19:00",
        "architecturalHighlights": [
          "罕见的边和花岗岩外墙与57米高哥特式尖顶",
          "与越南末代皇后南芳皇后家族渊源深厚"
        ],
        "audioScript": [
          "欢迎来到第一郡的县士教堂，这座1905年完工的花岗岩新哥特式教堂静谧而典雅。"
        ]
      },
      "ja": {
        "name": "フエンシー教会（1902年）",
        "shortSummary": "1902〜1905年にビエンホア産花崗岩で造られたネオゴシック様式の古聖堂。57mの尖塔と木陰の静かな境内が魅力です。",
        "historicalEra": "1902年 – 1905年",
        "openingHours": "05:00 – 11:00, 14:00 – 19:00",
        "architecturalHighlights": [
          "重厚な花崗岩のファサードと高さ57mの尖塔",
          "ナムフオン皇后の祖父ゆかりの歴史的建築"
        ],
        "audioScript": [
          "花崗岩の重厚な姿が美しい1902年着工のフエンシー教会へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-nhathohuyens-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Nh%C3%A0_th%E1%BB%9D_huy%E1%BB%87n_S%E1%BB%B9_%E1%BB%9F_HCM.jpg/1280px-Nh%C3%A0_th%E1%BB%9D_huy%E1%BB%87n_S%E1%BB%B9_%E1%BB%9F_HCM.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Nhà thờ Huyện Sỹ (Thánh Phi-líp-phê · 1902) (Wikimedia Commons)",
          "en": "Real view of Huyen Sy Church (St. Philip Church · 1902) (Wikimedia Commons)",
          "fr": "Vue réelle de Église Huyen Sy (Saint-Philippe · 1902) (Wikimedia Commons)",
          "zh": "县士教堂（圣斐理伯堂 · 1902年）实景照片（维基共享资源）",
          "ja": "フエンシー教会（1902年）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-nhathohuyens-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/20190923_Independence_Palace-13.jpg/1280px-20190923_Independence_Palace-13.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Nhà thờ Huyện Sỹ (Thánh Phi-líp-phê · 1902) (Ảnh 2)",
          "en": "Architecture & atmosphere at Huyen Sy Church (St. Philip Church · 1902) (Photo 2)",
          "fr": "Architecture et ambiance à Église Huyen Sy (Saint-Philippe · 1902) (Photo 2)",
          "zh": "县士教堂（圣斐理伯堂 · 1902年）建筑与实景细节（图 2）",
          "ja": "フエンシー教会（1902年）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-nhathohuyens-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/91/Ben_Thanh_market_2.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Nhà thờ Huyện Sỹ (Thánh Phi-líp-phê · 1902) (Ảnh 3)",
          "en": "Architecture & atmosphere at Huyen Sy Church (St. Philip Church · 1902) (Photo 3)",
          "fr": "Architecture et ambiance à Église Huyen Sy (Saint-Philippe · 1902) (Photo 3)",
          "zh": "县士教堂（圣斐理伯堂 · 1902年）建筑与实景细节（图 3）",
          "ja": "フエンシー教会（1902年）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-nths-1",
        "name": "Bánh Mì Huỳnh Hoa (Gần Nhà thờ Huyện Sỹ)",
        "cuisine": "Bánh mì Đặc sản Sài Gòn",
        "specialtyDishes": [
          "Bánh mì thập cẩm pate chả lụa",
          "Chà bông & thịt nguội truyền thống"
        ],
        "rating": 4.6,
        "reviewCount": 9850,
        "priceRange": "65.000đ – 75.000đ",
        "lat": 10.7712,
        "lng": 106.6904,
        "address": "26 Lê Thị Riêng, Phường Bến Thành, Quận 1, TP.HCM",
        "openHours": "06:00 – 22:00",
        "imageUrl": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 35
  },
  {
    "id": "bao-tang-ton-duc-thang",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7782,
    "lng": 106.7061,
    "category": "museum",
    "rating": 4.8,
    "reviewCount": 2890,
    "ticketPrice": "Miễn phí tham quan",
    "address": "05 Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/B%E1%BA%BFn_Ngh%C3%A9%2C_Qu%E1%BA%ADn_1%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_B%E1%BA%A3o_t%C3%A0ng_T%C3%B4n_%C4%90%E1%BB%A9c_Th%E1%BA%AFng_-_panoramio.jpg/1280px-B%E1%BA%BFn_Ngh%C3%A9%2C_Qu%E1%BA%ADn_1%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_B%E1%BA%A3o_t%C3%A0ng_T%C3%B4n_%C4%90%E1%BB%A9c_Th%E1%BA%AFng_-_panoramio.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Bảo tàng Tôn Đức Thắng",
        "shortSummary": "Bảo tàng hiện đại ven sông Sài Gòn (miễn phí vé) trưng bày đa phương tiện về cuộc đời Chủ tịch Tôn Đức Thắng, lịch sử xưởng tàu Ba Son và phong trào công nhân Sài Gòn.",
        "historicalEra": "Thành lập năm 1988 – Không gian mới 2024",
        "openingHours": "07:30 – 11:30, 13:00 – 17:00 (Thứ 3 – Chủ nhật)",
        "architecturalHighlights": [
          "Tòa nhà bảo tàng mới khang trang ngay trục Tôn Đức Thắng – Cầu Ba Son, thiết kế tối giản sang trọng",
          "Trưng bày tương tác số hiện đại gồm 5 chuyên đề lớn về Bác Tôn và công nhân Ba Son",
          "Không gian máy lạnh rộng rãi, miễn phí vé vào cổng cho mọi du khách trong và ngoài nước"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Bảo tàng Tôn Đức Thắng tại số 5 đường Tôn Đức Thắng, Quận 1 – ngay bên bờ sông Sài Gòn và khu xưởng tàu Ba Son lịch sử.",
          "Với tòa nhà trưng bày mới hiện đại cùng công nghệ tương tác đa phương tiện, bảo tàng tái hiện sinh động hành trình cuộc đời bình dị mà vĩ đại của Chủ tịch Tôn Đức Thắng và lịch sử công nhân Sài Gòn.",
          "Theo tư liệu bách khoa Wikipedia: Bảo tàng Tôn Đức Thắng là một bảo tàng lưu niệm danh nhân ở Việt Nam, tọa lạc tại địa chỉ số 5 đường Tôn Đức Thắng, phường Sài Gòn, Thành phố Hồ Chí Minh. Bảo tàng có nhiệm vụ nghiên cứu, sưu tầm, kiểm kê, bảo quản trưng bày, nơi lưu giữ và giới thiệu với khách tham quan những tài liệu, hiện vật có liên quan đến cuộc đời và sự nghiệp cách mạng của Chủ tịch Tôn Đức Thắng, tình cảm của nhân dân cả nước và bè bạn quốc tế đối với ông, nhằm mục đích là nơi giáo…"
        ]
      },
      "en": {
        "name": "Ton Duc Thang Museum",
        "shortSummary": "A newly rebuilt, free-admission riverside museum in District 1 presenting multimedia exhibits on President Ton Duc Thang and the historic Ba Son Shipyard.",
        "historicalEra": "Founded 1988 – New Building 2024",
        "openingHours": "07:30 – 11:30, 13:00 – 17:00 (Tue – Sun)",
        "architecturalHighlights": [
          "Sleek contemporary museum architecture overlooking the Saigon River and Ba Son Bridge",
          "Five interactive thematic galleries chronicling President Ton Duc Thang and Saigon’s labor heritage",
          "Complimentary admission for domestic and international visitors"
        ],
        "audioScript": [
          "Welcome to the Ton Duc Thang Museum on Saigon’s riverfront, offering free admission and modern interactive galleries on President Ton Duc Thang and Ba Son Shipyard."
        ]
      },
      "fr": {
        "name": "Musée Ton Duc Thang",
        "shortSummary": "Musée moderne et gratuit au bord du fleuve Saïgon retraçant la vie du président Ton Duc Thang et l’histoire des chantiers navals Ba Son.",
        "historicalEra": "1988 – Nouvel édifice 2024",
        "openingHours": "07h30 – 11h30, 13h00 – 17h00 (Mar – Dim)",
        "architecturalHighlights": [
          "Architecture muséale contemporaine face au pont Ba Son",
          "Salles multimédias interactives et entrée gratuite"
        ],
        "audioScript": [
          "Bienvenue au musée Ton Duc Thang, espace muséal moderne gratuit situé au bord du fleuve Saïgon."
        ]
      },
      "zh": {
        "name": "孙德胜博物馆",
        "shortSummary": "位于第一郡西贡河畔的现代化免费博物馆，以多媒体互动展陈讲述孙德胜主席生平与百年巴松船厂历史。",
        "historicalEra": "1988年建馆 – 2024年新馆",
        "openingHours": "07:30 – 11:30, 13:00 – 17:00（周二至周日）",
        "architecturalHighlights": [
          "毗邻巴松大桥的全新现代建筑空间",
          "免费开放，五大互动专题展厅内容丰富"
        ],
        "audioScript": [
          "欢迎来到西贡河畔的孙德胜博物馆，全馆免费参观，现代化展陈生动再现巴松船厂与历史记忆。"
        ]
      },
      "ja": {
        "name": "トン・ドゥック・タン博物館",
        "shortSummary": "サイゴン川沿いに建つ入場無料の近代的博物館。トン・ドゥック・タン主席の生涯と歴史あるバーソン造船所の歩みを展示しています。",
        "historicalEra": "1988年開館 – 2024年新館",
        "openingHours": "07:30 – 11:30, 13:00 – 17:00（火〜日）",
        "architecturalHighlights": [
          "バーソン橋すぐそばの洗練された新建築",
          "インタラクティブな最新展示が無料で鑑賞可能"
        ],
        "audioScript": [
          "入場無料で最新の展示が楽しめるサイゴン川沿いのトン・ドゥック・タン博物館へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-baotangtondu-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/B%E1%BA%BFn_Ngh%C3%A9%2C_Qu%E1%BA%ADn_1%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_B%E1%BA%A3o_t%C3%A0ng_T%C3%B4n_%C4%90%E1%BB%A9c_Th%E1%BA%AFng_-_panoramio.jpg/1280px-B%E1%BA%BFn_Ngh%C3%A9%2C_Qu%E1%BA%ADn_1%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_B%E1%BA%A3o_t%C3%A0ng_T%C3%B4n_%C4%90%E1%BB%A9c_Th%E1%BA%AFng_-_panoramio.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Bảo tàng Tôn Đức Thắng (Wikimedia Commons)",
          "en": "Real view of Ton Duc Thang Museum (Wikimedia Commons)",
          "fr": "Vue réelle de Musée Ton Duc Thang (Wikimedia Commons)",
          "zh": "孙德胜博物馆实景照片（维基共享资源）",
          "ja": "トン・ドゥック・タン博物館の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangtondu-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/20190923_Independence_Palace-13.jpg/1280px-20190923_Independence_Palace-13.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Tôn Đức Thắng (Ảnh 2)",
          "en": "Architecture & atmosphere at Ton Duc Thang Museum (Photo 2)",
          "fr": "Architecture et ambiance à Musée Ton Duc Thang (Photo 2)",
          "zh": "孙德胜博物馆建筑与实景细节（图 2）",
          "ja": "トン・ドゥック・タン博物館の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangtondu-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/91/Ben_Thanh_market_2.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Tôn Đức Thắng (Ảnh 3)",
          "en": "Architecture & atmosphere at Ton Duc Thang Museum (Photo 3)",
          "fr": "Architecture et ambiance à Musée Ton Duc Thang (Photo 3)",
          "zh": "孙德胜博物馆建筑与实景细节（图 3）",
          "ja": "トン・ドゥック・タン博物館の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-bttdt-1",
        "name": "Pizza 4P’s Lê Thánh Tôn (Phố Nhật gần Bảo tàng)",
        "cuisine": "Pizza Thủ công Nhật – Ý",
        "specialtyDishes": [
          "Pizza Burrata Parma Ham",
          "Mì cua sốt kem cà chua",
          "Phô mai tươi nhà làm"
        ],
        "rating": 4.8,
        "reviewCount": 7420,
        "priceRange": "180.000đ – 380.000đ",
        "lat": 10.7791,
        "lng": 106.7047,
        "address": "8/15 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP.HCM",
        "openHours": "10:30 – 23:00",
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
    "id": "bao-tang-phu-nu-nam-bo",
    "city": "Quận 3 · TP.HCM",
    "district": "Quận 3",
    "lat": 10.7866,
    "lng": 106.6873,
    "category": "museum",
    "rating": 4.7,
    "reviewCount": 3450,
    "ticketPrice": "Miễn phí tham quan",
    "address": "202 Võ Thị Sáu, Phường Võ Thị Sáu, Quận 3, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/Mission_letter_from_the_southern_Vietnamese_Communist_Party_to_Ho_Thi_Bi%2C_who_led_the_economic_affairs_of_a_resistance_group%2C_Saigon%2C_1951_-_Vietnamese_Women%27s_Museum_-_Hanoi%2C_Vietnam_-_DSC04202.JPG/1280px-thumbnail.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Bảo tàng Phụ nữ Nam Bộ",
        "shortSummary": "Không gian văn hóa giàu cảm xúc tại Quận 3 lưu giữ hơn 30.000 hiện vật về trang phục áo dài, áo bà ba, trang sức cổ, nghề thủ công và truyền thống anh hùng của phụ nữ Nam Bộ.",
        "historicalEra": "Thành lập năm 1985",
        "openingHours": "07:30 – 11:30, 13:30 – 17:00 Hàng ngày",
        "architecturalHighlights": [
          "Phòng trưng bày chuyên đề Áo dài Việt Nam và trang phục truyền thống các dân tộc phía Nam rực rỡ sắc màu",
          "Ứng dụng trình chiếu 3D Hologram và tương tác thông minh kể chuyện lịch sử sống động",
          "Miễn phí vé vào cửa, cách Nhà thờ Tân Định và Chùa Vĩnh Nghiêm chỉ vài phút đi bộ"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Bảo tàng Phụ nữ Nam Bộ tại số 202 Võ Thị Sáu, Quận 3.",
          "Nơi đây lưu giữ hơn 30.000 tư liệu và hiện vật quý giá, từ bộ sưu tập áo dài – áo bà ba truyền thống, nghệ thuật làm gốm dệt chiếu đến những câu chuyện kiên trung của phụ nữ miền Nam qua hai cuộc kháng chiến.",
          "Theo tư liệu bách khoa Wikipedia: Bảo tàng Phụ nữ Nam Bộ ngụ tại 202 Võ Thị Sáu, Xuân Hòa, Thành phố Hồ Chí Minh. Bảo tàng có diện tích trưng bày 2000 m² bao gồm 10 phòng trưng bày về truyền thống xây dựng và bảo vệ tổ quốc của phụ nữ Nam Bộ. Tòa nhà của bảo tàng hiện nay có 4 tầng lầu. Hội trường có khả năng chứa gần 1.000 người và được xây dựng trên diện tích sử dụng 5.410,5m2. Hệ thống kho bảo quản có diện tích trên 700m2."
        ]
      },
      "en": {
        "name": "Southern Women’s Museum",
        "shortSummary": "A free-entry District 3 museum showcasing over 30,000 artifacts of Southern Vietnamese women’s heritage, traditional Ao Dai & Ba Ba fashion, jewelry, and history.",
        "historicalEra": "Founded in 1985",
        "openingHours": "07:30 – 11:30, 13:30 – 17:00 Daily",
        "architecturalHighlights": [
          "Vivid galleries dedicated to traditional Ao Dai, Ba Ba tunics, and ethnic textiles",
          "Interactive 3D hologram exhibits and modern curatorial storytelling",
          "Free admission within walking distance of Tan Dinh Church"
        ],
        "audioScript": [
          "Welcome to the Southern Women’s Museum in District 3, celebrating traditional Vietnamese dress, crafts, and the vital role of Southern women in history.",
          "Historical context from Wikipedia: The Southern Women's Museum (Vietnamese: Bảo tàng Phụ nữ Nam Bộ) is a history museum in Ho Chi Minh City, Vietnam, dedicated to the contributions of women in southern Vietnam to national building, defense, and cultural preservation. Established in 1985, it houses over 31,000 artifacts, focusing on revolutionary struggles, traditional crafts, and ethnographic elements."
        ]
      },
      "fr": {
        "name": "Musée des Femmes du Sud",
        "shortSummary": "Musée gratuit du 3e arrondissement consacré aux costumes traditionnels (Ao Dai, Ao Ba Ba), à l’artisanat et au rôle historique des femmes du Sud-Vietnam.",
        "historicalEra": "Fondé en 1985",
        "openingHours": "07h30 – 11h30, 13h30 – 17h00",
        "architecturalHighlights": [
          "Collections riches d’Ao Dai anciens et de bijoux traditionnels",
          "Installations numériques et hologrammes 3D modernes"
        ],
        "audioScript": [
          "Bienvenue au musée des Femmes du Sud, dédié au patrimoine vestimentaire et historique du Sud-Vietnam."
        ]
      },
      "zh": {
        "name": "南部妇女博物馆",
        "shortSummary": "位于第三郡的免费文化博物馆，珍藏逾三万件越南奥黛、传统服饰、古董首饰与南部女性历史文物。",
        "historicalEra": "1985年建馆",
        "openingHours": "07:30 – 11:30, 13:30 – 17:00",
        "architecturalHighlights": [
          "色彩丰富的越南奥黛与南方少数民族服饰专题展",
          "结合3D全息互动展示，免费向游客开放"
        ],
        "audioScript": [
          "欢迎来到第三郡的南部妇女博物馆，馆内免费开放并展示精美的越南奥黛与南方传统文化。"
        ]
      },
      "ja": {
        "name": "南部女性博物館",
        "shortSummary": "3区にある入場無料の博物館。アオザイやアオババなど伝統衣装、装身具、歴史を伝える3万点以上の資料を収蔵しています。",
        "historicalEra": "1985年開館",
        "openingHours": "07:30 – 11:30, 13:30 – 17:00",
        "architecturalHighlights": [
          "華やかなアオザイ・民族衣装の常設コレクション",
          "3Dホログラムを活用したわかりやすい現代的展示"
        ],
        "audioScript": [
          "ベトナム伝統衣装アオザイや南部女性の歩みを無料で学べる南部女性博物館へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-baotangphunu-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/Mission_letter_from_the_southern_Vietnamese_Communist_Party_to_Ho_Thi_Bi%2C_who_led_the_economic_affairs_of_a_resistance_group%2C_Saigon%2C_1951_-_Vietnamese_Women%27s_Museum_-_Hanoi%2C_Vietnam_-_DSC04202.JPG/1280px-thumbnail.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Bảo tàng Phụ nữ Nam Bộ (Wikimedia Commons)",
          "en": "Real view of Southern Women’s Museum (Wikimedia Commons)",
          "fr": "Vue réelle de Musée des Femmes du Sud (Wikimedia Commons)",
          "zh": "南部妇女博物馆实景照片（维基共享资源）",
          "ja": "南部女性博物館の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangphunu-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/Mari%2C_Mordva_female_clothes_-_State_Historical_Museum_of_the_Southern_Urals.jpg/1280px-Mari%2C_Mordva_female_clothes_-_State_Historical_Museum_of_the_Southern_Urals.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Bảo tàng Phụ nữ Nam Bộ (Wikimedia Commons)",
          "en": "Real view of Southern Women’s Museum (Wikimedia Commons)",
          "fr": "Vue réelle de Musée des Femmes du Sud (Wikimedia Commons)",
          "zh": "南部妇女博物馆实景照片（维基共享资源）",
          "ja": "南部女性博物館の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangphunu-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Bashkir%2C_Tatar_female_clothes_-_State_Historical_Museum_of_the_Southern_Urals.jpg/1280px-Bashkir%2C_Tatar_female_clothes_-_State_Historical_Museum_of_the_Southern_Urals.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Bảo tàng Phụ nữ Nam Bộ (Wikimedia Commons)",
          "en": "Real view of Southern Women’s Museum (Wikimedia Commons)",
          "fr": "Vue réelle de Musée des Femmes du Sud (Wikimedia Commons)",
          "zh": "南部妇女博物馆实景照片（维基共享资源）",
          "ja": "南部女性博物館の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-btpn-1",
        "name": "Phở Hòa Pasteur (Thương hiệu Phở lâu đời Q.3)",
        "cuisine": "Phở bò Sài Gòn Truyền thống",
        "specialtyDishes": [
          "Phở tái nạm gầu",
          "Chả giò giòn",
          "Quẩy nóng"
        ],
        "rating": 4.5,
        "reviewCount": 6180,
        "priceRange": "75.000đ – 110.000đ",
        "lat": 10.7859,
        "lng": 106.6896,
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
    "id": "bao-tang-biet-dong-sai-gon-145",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7908,
    "lng": 106.6915,
    "category": "museum",
    "rating": 4.8,
    "reviewCount": 2740,
    "ticketPrice": "50.000đ (Có kết hợp Cà phê Đỗ Phủ cổ)",
    "address": "145 Trần Quang Khải, Phường Tân Định, Quận 1, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Tran_quang_khai-T%C3%A2n_%C4%90%E1%BB%8Bnh%2C_Qu%E1%BA%ADn_1%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg/1280px-Tran_quang_khai-T%C3%A2n_%C4%90%E1%BB%8Bnh%2C_Qu%E1%BA%ADn_1%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Bảo tàng Biệt động Sài Gòn – Gia Định (145 Trần Quang Khải)",
        "shortSummary": "Bảo tàng tư nhân độc đáo đặt trong ngôi nhà di tích năm 1963 của chiến sĩ Trần Văn Lai, trưng bày hầm nổi bí mật, hộp thư mật, xe cổ và trải nghiệm cà phê bơ sữa Sài Gòn xưa.",
        "historicalEra": "1963 – Mở cửa Bảo tàng năm 2019",
        "openingHours": "07:30 – 19:00 Hàng ngày",
        "architecturalHighlights": [
          "Thang máy gỗ cổ nhỏ gọn và các vách tường – trần nhà hai lớp từng dùng làm hầm bí mật giữa lòng đô thị",
          "Hơn 300 hiện vật gốc: máy đánh chữ, radio liên lạc, xe máy cổ và bản đồ tác chiến Biệt động Sài Gòn",
          "Kết hợp không gian Cà phê Đỗ Phủ – Cơm tấm Đại Hàn đậm chất hoài cổ Sài Gòn thập niên 1960"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Bảo tàng Biệt động Sài Gòn – Gia Định tại số 145 Trần Quang Khải, phường Tân Định, Quận 1.",
          "Ngôi nhà cổ xây dựng từ năm 1963 này từng là cơ sở hoạt động bí mật của lực lượng Biệt động Sài Gòn. Quý khách sẽ được tận mắt chứng kiến những vách hầm ngụy trang tài tình, bộ sưu tập hiện vật nguyên bản và thưởng thức ly cà phê vợt đậm chất Sài Gòn xưa."
        ]
      },
      "en": {
        "name": "Saigon Commando Museum (145 Tran Quang Khai)",
        "shortSummary": "A fascinating heritage-house museum from 1963 showcasing secret wall bunkers, vintage motorbikes, coded mail drops, and nostalgic 1960s Saigon coffee culture.",
        "historicalEra": "1963 House – Museum opened 2019",
        "openingHours": "07:30 – 19:00 Daily",
        "architecturalHighlights": [
          "Concealed wall compartments, secret loft hatches, and an antique wooden lift",
          "Over 300 original artifacts of the Saigon Special Forces",
          "Paired with retro Do Phu Coffee & broken rice dining downstairs"
        ],
        "audioScript": [
          "Welcome to the Saigon Commando Museum at 145 Tran Quang Khai, a preserved 1963 safehouse packed with hidden bunkers, historical artifacts, and vintage Saigon atmosphere."
        ]
      },
      "fr": {
        "name": "Musée des Commandos de Saïgon (145 Tran Quang Khai)",
        "shortSummary": "Maison historique de 1963 transformée en musée présentant caches secrètes, objets d’époque et café rétro saïgonnais.",
        "historicalEra": "1963 – 2019",
        "openingHours": "07h30 – 19h00",
        "architecturalHighlights": [
          "Cloisons secrètes et objets authentiques des commandos de Saïgon",
          "Ambiance vintage des années 1960 avec café traditionnel"
        ],
        "audioScript": [
          "Bienvenue au musée des Commandos de Saïgon, installé dans une maison secrète historique de 1963."
        ]
      },
      "zh": {
        "name": "西贡别动队博物馆（陈光启街145号）",
        "shortSummary": "设于1963年老宅内的特色历史博物馆，完整保留秘密夹层暗室、复古木电梯与300余件别动队真品文物，楼下可品尝怀旧西贡咖啡。",
        "historicalEra": "1963年老宅 – 2019年开馆",
        "openingHours": "07:30 – 19:00",
        "architecturalHighlights": [
          "巧夺天工的夹层暗室与复古手拉木电梯",
          "融合怀旧杜府咖啡与大韩碎米饭体验"
        ],
        "audioScript": [
          "欢迎来到陈光启街145号的西贡别动队博物馆，在这里可以近距离探索秘密暗室并品尝怀旧滤布咖啡。"
        ]
      },
      "ja": {
        "name": "サイゴン特攻隊博物館（チャンクアンカイ通り145番地）",
        "shortSummary": "1963年の秘密基地だった町家を公開した個性派博物館。隠し部屋やアンティークの木製エレベーター、レトロなサイゴン喫茶が体験できます。",
        "historicalEra": "1963年建築 – 2019年開館",
        "openingHours": "07:30 – 19:00",
        "architecturalHighlights": [
          "二重壁の隠し部屋や300点以上の歴史的実物資料",
          "1960年代の雰囲気を残すレトロ喫茶と名物コムタム"
        ],
        "audioScript": [
          "1963年の歴史ある町家を利用したサイゴン特攻隊博物館へようこそ。秘密の仕掛けとレトロな喫茶文化が魅力です。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-baotangbietd-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Tran_quang_khai-T%C3%A2n_%C4%90%E1%BB%8Bnh%2C_Qu%E1%BA%ADn_1%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg/1280px-Tran_quang_khai-T%C3%A2n_%C4%90%E1%BB%8Bnh%2C_Qu%E1%BA%ADn_1%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Bảo tàng Biệt động Sài Gòn – Gia Định (145 Trần Quang Khải) (Wikimedia Commons)",
          "en": "Real view of Saigon Commando Museum (145 Tran Quang Khai) (Wikimedia Commons)",
          "fr": "Vue réelle de Musée des Commandos de Saïgon (145 Tran Quang Khai) (Wikimedia Commons)",
          "zh": "西贡别动队博物馆（陈光启街145号）实景照片（维基共享资源）",
          "ja": "サイゴン特攻隊博物館（チャンクアンカイ通り145番地）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangbietd-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Hai_Ba_trung_va_Tran_quang_khai-Qu%E1%BA%ADn_3%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg/1280px-Hai_Ba_trung_va_Tran_quang_khai-Qu%E1%BA%ADn_3%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Biệt động Sài Gòn – Gia Định (145 Trần Quang Khải) (Ảnh 2)",
          "en": "Architecture & atmosphere at Saigon Commando Museum (145 Tran Quang Khai) (Photo 2)",
          "fr": "Architecture et ambiance à Musée des Commandos de Saïgon (145 Tran Quang Khai) (Photo 2)",
          "zh": "西贡别动队博物馆（陈光启街145号）建筑与实景细节（图 2）",
          "ja": "サイゴン特攻隊博物館（チャンクアンカイ通り145番地）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangbietd-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/TRan_Quang_khai_q1%2C_saigon_2011_-_panoramio.jpg/1280px-TRan_Quang_khai_q1%2C_saigon_2011_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Biệt động Sài Gòn – Gia Định (145 Trần Quang Khải) (Ảnh 3)",
          "en": "Architecture & atmosphere at Saigon Commando Museum (145 Tran Quang Khai) (Photo 3)",
          "fr": "Architecture et ambiance à Musée des Commandos de Saïgon (145 Tran Quang Khai) (Photo 3)",
          "zh": "西贡别动队博物馆（陈光启街145号）建筑与实景细节（图 3）",
          "ja": "サイゴン特攻隊博物館（チャンクアンカイ通り145番地）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-btbd-1",
        "name": "Cà Phê Đỗ Phủ – Cơm Tấm Đại Hàn (113A Đặng Dung)",
        "cuisine": "Cơm tấm cổ & Cà phê vợt Sài Gòn",
        "specialtyDishes": [
          "Cơm tấm sườn bì chả kim chi",
          "Cà phê bơ sữa",
          "Bánh quẩy nóng"
        ],
        "rating": 4.7,
        "reviewCount": 2940,
        "priceRange": "45.000đ – 85.000đ",
        "lat": 10.7911,
        "lng": 106.6908,
        "address": "113A Đặng Dung, Phường Tân Định, Quận 1, TP.HCM",
        "openHours": "07:00 – 21:00",
        "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 60
  },
  {
    "id": "hoi-quan-nghia-an-chua-ong",
    "city": "Quận 5 · Chợ Lớn",
    "district": "Quận 5",
    "lat": 10.7536,
    "lng": 106.6626,
    "category": "temple",
    "rating": 4.8,
    "reviewCount": 4680,
    "ticketPrice": "Miễn phí tham quan",
    "address": "678 Nguyễn Trãi, Phường 11, Quận 5, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Nghia_An_Hoi_Quan_Pagoda_%2810018256906%29.jpg/1280px-Nghia_An_Hoi_Quan_Pagoda_%2810018256906%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Hội quán Nghĩa An (Chùa Ông – Chợ Lớn)",
        "shortSummary": "Di tích Kiến trúc Nghệ thuật cấp Quốc gia của cộng đồng người Hoa Triều Châu xây từ đầu thế kỷ 19, nổi tiếng với nghệ thuật chạm gỗ sơn son thếp vàng lộng lẫy và tượng ngựa Xích Thố.",
        "historicalEra": "Đầu thế kỷ 19 (Công nhận Di tích QG 1993)",
        "openingHours": "06:00 – 17:30 Hàng ngày",
        "architecturalHighlights": [
          "Hệ thống bao lam, hoành phi và liễn đối chạm khắc gỗ sơn son thếp vàng tinh xảo bậc nhất Chợ Lớn",
          "Bức tượng ngựa Xích Thố bằng gỗ cao lớn đặt trang trọng ngay tiền điện",
          "Nằm trên trục di sản đường Nguyễn Trãi, chỉ cách Chùa Bà Thiên Hậu 2 phút đi bộ"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Hội quán Nghĩa An – thường gọi là Chùa Ông – tại số 678 Nguyễn Trãi, trung tâm khu phố cổ Chợ Lớn, Quận 5.",
          "Được cộng đồng người Triều Châu xây dựng từ đầu thế kỷ 19 để thờ Quan Thánh Đế Quân, hội quán được công nhận là Di tích Kiến trúc Nghệ thuật cấp Quốc gia nhờ những kiệt tác chạm gỗ sơn son thếp vàng và tiểu tượng gốm sứ trên mái ngói âm dương.",
          "Theo tư liệu bách khoa Wikipedia: Hội quán Nghĩa An (chữ Hán: 義安會館), thường được gọi là Miếu Quan Đế hay Chùa Ông, là một cơ sở tín ngưỡng của người Tiều tại 678 đường Nguyễn Trãi, thuộc Phường Chợ Lớn, Thành phố Hồ Chí Minh, Việt Nam. Đây không chỉ là nơi chiêm bái của người Tiều tại Sài Gòn, mà còn là một công trình có giá trị về kiến trúc và nghệ thuật ở nửa cuối thế kỷ 19 - đầu thế kỷ 20. Vì vậy, ngày 7 tháng 11 năm 1993, Bộ Văn hóa - Thông tin đã ký quyết định số 43-VH/QĐ công nhận ngôi miếu là di tích kiến trúc nghệ thuật cấp quốc gia."
        ]
      },
      "en": {
        "name": "Nghia An Assembly Hall (Quan Cong Temple · Cho Lon)",
        "shortSummary": "A National Architectural Monument built by the Teochew Chinese community in early 19th-century Cho Lon, celebrated for gilded wood carvings and the Red Hare horse statue.",
        "historicalEra": "Early 19th Century",
        "openingHours": "06:00 – 17:30 Daily",
        "architecturalHighlights": [
          "Lavish red-and-gold lacquered woodcarvings and calligraphic plaques",
          "Iconic wooden statue of General Guan Yu’s Red Hare steed at the entrance",
          "Two-minute walk from Thien Hau Temple along historic Nguyen Trai Street"
        ],
        "audioScript": [
          "Welcome to Nghia An Assembly Hall in Cho Lon, an ornate early 19th-century Teochew temple renowned for gilded timber carvings and traditional incense coils."
        ]
      },
      "fr": {
        "name": "Salle d’Assemblée Nghia An (Pagode de Quan Cong)",
        "shortSummary": "Monument national du XIXe siècle fondé par la communauté Teochew à Cho Lon, célèbre pour ses boiseries dorées à la feuille.",
        "historicalEra": "Début XIXe siècle",
        "openingHours": "06h00 – 17h30",
        "architecturalHighlights": [
          "Boiseries sculptées laquées rouge et or d’une finesse exceptionnelle",
          "Statue en bois du cheval Lièvre Rouge à l’entrée du sanctuaire"
        ],
        "audioScript": [
          "Bienvenue à la salle d’assemblée Nghia An à Cho Lon, chef-d’œuvre d’art sino-vietnamien du XIXe siècle."
        ]
      },
      "zh": {
        "name": "义安会馆（堤岸关帝庙）",
        "shortSummary": "十九世纪初潮州先民兴建的国家级建筑艺术遗迹，以金碧辉煌的潮州木雕、彩瓷屋脊与赤兔马木像著称。",
        "historicalEra": "19世纪初（1993年列为国家级遗迹）",
        "openingHours": "06:00 – 17:30",
        "architecturalHighlights": [
          "堤岸最为精美的贴金木雕匾额与彩瓷剪黏屋脊",
          "大殿前庄严的赤兔马木雕与盘香天井"
        ],
        "audioScript": [
          "欢迎来到堤岸阮廌街的义安会馆，这座潮州关帝庙以精湛的贴金木雕闻名南越。"
        ]
      },
      "ja": {
        "name": "義安会館（チョロン関帝廟）",
        "shortSummary": "19世紀初頭に潮州系華人が建てた国家建築遺産。豪華な金箔木彫りと赤兎馬の木像が見事なチョロン屈指の名所です。",
        "historicalEra": "19世紀初頭",
        "openingHours": "06:00 – 17:30",
        "architecturalHighlights": [
          "絢爛豪華な朱塗り・金箔の潮州木彫装飾",
          "天后宮から徒歩2分のチョロン歴史散策ルート"
        ],
        "audioScript": [
          "チョロンの中心に建つ国家遺産、義安会館へようこそ。壮麗な金箔木彫りが見どころです。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-hoiquannghia-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Nghia_An_Hoi_Quan_Pagoda_%2810018256906%29.jpg/1280px-Nghia_An_Hoi_Quan_Pagoda_%2810018256906%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Hội quán Nghĩa An (Chùa Ông – Chợ Lớn) (Wikimedia Commons)",
          "en": "Real view of Nghia An Assembly Hall (Quan Cong Temple · Cho Lon) (Wikimedia Commons)",
          "fr": "Vue réelle de Salle d’Assemblée Nghia An (Pagode de Quan Cong) (Wikimedia Commons)",
          "zh": "义安会馆（堤岸关帝庙）实景照片（维基共享资源）",
          "ja": "義安会館（チョロン関帝廟）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-hoiquannghia-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/20190923_Independence_Palace-13.jpg/1280px-20190923_Independence_Palace-13.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Hội quán Nghĩa An (Chùa Ông – Chợ Lớn) (Ảnh 2)",
          "en": "Architecture & atmosphere at Nghia An Assembly Hall (Quan Cong Temple · Cho Lon) (Photo 2)",
          "fr": "Architecture et ambiance à Salle d’Assemblée Nghia An (Pagode de Quan Cong) (Photo 2)",
          "zh": "义安会馆（堤岸关帝庙）建筑与实景细节（图 2）",
          "ja": "義安会館（チョロン関帝廟）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-hoiquannghia-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/91/Ben_Thanh_market_2.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Hội quán Nghĩa An (Chùa Ông – Chợ Lớn) (Ảnh 3)",
          "en": "Architecture & atmosphere at Nghia An Assembly Hall (Quan Cong Temple · Cho Lon) (Photo 3)",
          "fr": "Architecture et ambiance à Salle d’Assemblée Nghia An (Pagode de Quan Cong) (Photo 3)",
          "zh": "义安会馆（堤岸关帝庙）建筑与实景细节（图 3）",
          "ja": "義安会館（チョロン関帝廟）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-hqna-1",
        "name": "Chè Hà Ký (Tráng miệng Hoa cổ truyền Q.5)",
        "cuisine": "Chè Hoa & Tráng miệng Chợ Lớn",
        "specialtyDishes": [
          "Chè hột gà trà",
          "Quy linh cao mật ong",
          "Chè đậu phộng mè đen"
        ],
        "rating": 4.7,
        "reviewCount": 3850,
        "priceRange": "30.000đ – 55.000đ",
        "lat": 10.7539,
        "lng": 106.6645,
        "address": "138 Châu Văn Liêm, Phường 11, Quận 5, TP.HCM",
        "openHours": "10:00 – 22:30",
        "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 35
  },
  {
    "id": "hoi-quan-on-lang-chua-quan-am",
    "city": "Quận 5 · Chợ Lớn",
    "district": "Quận 5",
    "lat": 10.7524,
    "lng": 106.6637,
    "category": "temple",
    "rating": 4.7,
    "reviewCount": 3120,
    "ticketPrice": "Miễn phí tham quan",
    "address": "12 Lão Tử, Phường 11, Quận 5, TP.HCM",
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Quan_%C3%82m_Pagoda_-_Front_entrance_edited.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
    "translations": {
      "vi": {
        "name": "Hội quán Ôn Lăng (Chùa Quan Âm · 1740)",
        "shortSummary": "Ngôi chùa cổ nhất khu Chợ Lớn do người Hoa gốc Phúc Kiến xây dựng từ năm 1740, nổi tiếng với mái ngói cong rực rỡ tượng gốm Cây Mai và giàn đèn lồng đỏ huyền ảo.",
        "historicalEra": "Khởi dựng năm 1740 (Di tích QG 2007)",
        "openingHours": "06:00 – 17:30 Hàng ngày",
        "architecturalHighlights": [
          "Mái ngói âm dương uốn cong trang trí hàng trăm tiểu tượng gốm men xanh – vàng cổ điển",
          "Sân giếng trời treo đèn lồng đỏ và nhang vòng tạo hiệu ứng ánh sáng chụp ảnh cực kỳ điện ảnh",
          "Nơi bảo tồn nhiều phong tục tín ngưỡng Phúc Kiến đặc sắc như lễ cầu an, cầu duyên"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Hội quán Ôn Lăng trên đường Lão Tử, Quận 5 – một trong những ngôi chùa cổ xưa nhất của cộng đồng người Hoa Phúc Kiến tại Chợ Lớn từ năm 1740.",
          "Nơi đây kết hợp hài hòa tín ngưỡng thờ Quan Thế Âm Bồ Tát và Thiên Hậu Thánh Mẫu trong không gian sân đèn lồng đỏ thâm nghiêm và mái gốm men cổ đầy màu sắc.",
          "Theo tư liệu bách khoa Wikipedia: Hội quán Ôn Lăng (chữ Hán: 溫陵會館, hay Ôn Lăng hội quán) còn được gọi là chùa Ôn Lăng, chùa Quan Âm hay chùa Ông Lào; là một ngôi chùa của người Việt gốc Hoa, hiện tọa lạc tại số 12 đường Lão Tử, Phường Chợ Lớn, Thành phố Hồ Chí Minh (Việt Nam). Ôn Lăng là tên cổ của phủ Tuyền Châu ở Phúc Kiến – vì hội quán này nguyên do người Hoa gốc Phúc Kiến ở Tuyền Châu lập nên nên người ta dùng cái tên Ôn Lăng để đặt cho hội quán. Trong tiếng Hoa, \"Ôn\" (溫) có nghĩa là ấm (vừa phải, dễ chịu), nhu hòa; còn \"Lăng\" (陵) có nghĩa là gò đất, đồi – cái tên này được cho có từ thời nhà Đường hoặc sớm hơn. Tại thành phố Tuyền Châu, cái tên Ôn Lăng có thể được dễ dàng nhìn thất ở trên nhiều công trình cổ."
        ]
      },
      "en": {
        "name": "On Lang Assembly Hall (Quan Am Pagoda · 1740)",
        "shortSummary": "Founded in 1740 by Fujian settlers in Cho Lon, beloved for its dramatic glazed ceramic roof figurines, glowing red lanterns, and photogenic incense-lit courtyard.",
        "historicalEra": "Founded in 1740",
        "openingHours": "06:00 – 17:30 Daily",
        "architecturalHighlights": [
          "Curved Fujian roofs topped with intricate glazed porcelain dioramas",
          "Atmospheric courtyard draped in crimson lanterns and spiral incense",
          "Recognized as a National Architectural & Artistic Heritage Monument"
        ],
        "audioScript": [
          "Welcome to Quan Am Pagoda, also known as On Lang Assembly Hall, founded in 1740 by the Fujian community in Cho Lon.",
          "Historical context from Wikipedia: The Ôn Lăng Assembly Hall (Hội quán Ôn Lăng / 溫陵會館), also known as the Quan Âm Temple (Chùa Quân Âm), is a Chinese-style Buddhist temple located on Lão Tử Street in Chợ Lớn ward, Ho Chi Minh City, Vietnam. Founded in the 19th century, it is dedicated to Guanyin (Vietnamese: Quan Âm), the Chinese goddess of mercy and the Chinese form of the Indian bodhisattva Avalokiteshvara."
        ]
      },
      "fr": {
        "name": "Pagode Quan Am (Salle Ôn Lăng · 1740)",
        "shortSummary": "Fondée en 1740 par la communauté du Fujian à Cho Lon, célèbre pour ses toits en céramique émaillée et sa cour aux lanternes rouges.",
        "historicalEra": "1740",
        "openingHours": "06h00 – 17h30",
        "architecturalHighlights": [
          "Toits courbes ornés de scènes en porcelaine émaillée",
          "Cour illuminée de lanternes rouges et spirales d’encens"
        ],
        "audioScript": [
          "Bienvenue à la pagode Quan Am, sanctuaire historique fondé en 1740 au cœur de Cho Lon."
        ]
      },
      "zh": {
        "name": "温陵会馆（堤岸观音庙 · 1740年）",
        "shortSummary": "始建于1740年的福建泉州会馆，以飞檐嵌瓷雕塑、红灯笼天井与传统民俗祈福文化闻名堤岸。",
        "historicalEra": "始建于1740年",
        "openingHours": "06:00 – 17:30",
        "architecturalHighlights": [
          "闽南传统燕尾脊与精美彩瓷人物雕饰",
          "红灯笼与盘香交织的绝美古寺光影"
        ],
        "audioScript": [
          "欢迎来到建于1740年的温陵会馆（观音庙），这里是堤岸最古老的福建籍古庙之一。"
        ]
      },
      "ja": {
        "name": "温陵会館（観音寺・1740年）",
        "shortSummary": "1740年に福建系華人が建立したチョロン最古級の寺院。色鮮やかな陶磁器装飾の屋根と赤い提灯の中庭が幻想的です。",
        "historicalEra": "1740年創建",
        "openingHours": "06:00 – 17:30",
        "architecturalHighlights": [
          "曲線美あふれる福建様式の屋根と陶磁器細工",
          "赤い提灯と渦巻き線香が織りなすフォトジェニックな空間"
        ],
        "audioScript": [
          "1740年創建の歴史を誇るチョロンの観音寺（温陵会館）へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-hoiquanonlan-1",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Quan_%C3%82m_Pagoda_-_Front_entrance_edited.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Hội quán Ôn Lăng (Chùa Quan Âm · 1740) (Wikimedia Commons)",
          "en": "Real view of On Lang Assembly Hall (Quan Am Pagoda · 1740) (Wikimedia Commons)",
          "fr": "Vue réelle de Pagode Quan Am (Salle Ôn Lăng · 1740) (Wikimedia Commons)",
          "zh": "温陵会馆（堤岸观音庙 · 1740年）实景照片（维基共享资源）",
          "ja": "温陵会館（観音寺・1740年）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-hoiquanonlan-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Ch%C3%B9a_%C3%94n_L%C4%83ng.jpg/1280px-Ch%C3%B9a_%C3%94n_L%C4%83ng.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Hội quán Ôn Lăng (Chùa Quan Âm · 1740) (Ảnh 2)",
          "en": "Architecture & atmosphere at On Lang Assembly Hall (Quan Am Pagoda · 1740) (Photo 2)",
          "fr": "Architecture et ambiance à Pagode Quan Am (Salle Ôn Lăng · 1740) (Photo 2)",
          "zh": "温陵会馆（堤岸观音庙 · 1740年）建筑与实景细节（图 2）",
          "ja": "温陵会館（観音寺・1740年）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-hoiquanonlan-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f1/Altar_of_Thien_Hau_and_Dragon.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Hội quán Ôn Lăng (Chùa Quan Âm · 1740) (Ảnh 3)",
          "en": "Architecture & atmosphere at On Lang Assembly Hall (Quan Am Pagoda · 1740) (Photo 3)",
          "fr": "Architecture et ambiance à Pagode Quan Am (Salle Ôn Lăng · 1740) (Photo 3)",
          "zh": "温陵会馆（堤岸观音庙 · 1740年）建筑与实景细节（图 3）",
          "ja": "温陵会館（観音寺・1740年）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-hqol-1",
        "name": "Dimsum Tiến Phát (Ký Hòa – Chợ Lớn)",
        "cuisine": "Dimsum & Ẩm thực Quảng Đông",
        "specialtyDishes": [
          "Há cảo tôm tươi",
          "Xíu mại trứng cua",
          "Bánh bao kim sa"
        ],
        "rating": 4.6,
        "reviewCount": 2760,
        "priceRange": "55.000đ – 160.000đ",
        "lat": 10.7549,
        "lng": 106.6682,
        "address": "18 Kỳ Hòa, Phường 11, Quận 5, TP.HCM",
        "openHours": "06:00 – 12:30",
        "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch"
        ]
      }
    ],
    "recommendedVisitMinutes": 35
  },
  {
    "id": "chua-van-phat-quan-5",
    "city": "Quận 5 · Chợ Lớn",
    "district": "Quận 5",
    "lat": 10.7559,
    "lng": 106.6696,
    "category": "temple",
    "rating": 4.8,
    "reviewCount": 4150,
    "ticketPrice": "Miễn phí tham quan",
    "address": "66/14 Nghĩa Thục, Phường 5, Quận 5, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Ten_Thousand_Buddha_Pagoda_in_HCMC.jpg/1280px-Ten_Thousand_Buddha_Pagoda_in_HCMC.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Chùa Vạn Phật (Chùa 10.000 Tượng Phật · Quận 5)",
        "shortSummary": "Ngôi cổ tự độc đáo ẩn mình trong con hẻm Chợ Lớn với đại điện tầng 4 trang nghiêm trưng bày hơn 10.000 pho tượng Phật thếp vàng phủ kín bốn bức tường.",
        "historicalEra": "Khởi dựng năm 1959",
        "openingHours": "07:00 – 17:00 Hàng ngày",
        "architecturalHighlights": [
          "Đại điện Quang Minh tầng 4 với 10.000 tượng Phật nhỏ bằng đồng – thếp vàng xếp đều tăm tắp trên các vách tường",
          "Pho tượng Đức Phật Thích Ca Mâu Ni uy nghi ngự trên đài sen ngàn cánh ở trung tâm",
          "Không gian yên tĩnh, choáng ngợp và cực kỳ độc đáo để chiêm bái, chụp ảnh kiến trúc"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Chùa Vạn Phật tại hẻm 66 Nghĩa Thục, Quận 5 – một kho báu tâm linh ít người ngờ tới giữa lòng Chợ Lớn.",
          "Bước lên Đại điện Quang Minh ở tầng 4, quý khách sẽ choáng ngợp trước 10.000 pho tượng Phật ánh kim phủ kín khắp bốn bức tường vây quanh tượng Phật Thích Ca trên đài sen ngàn cánh."
        ]
      },
      "en": {
        "name": "Van Phat Pagoda (Ten Thousand Buddhas Temple)",
        "shortSummary": "A hidden gem in Cho Lon whose breathtaking 4th-floor main sanctuary is lined floor-to-ceiling with 10,000 golden Buddha statues.",
        "historicalEra": "Founded in 1959",
        "openingHours": "07:00 – 17:00 Daily",
        "architecturalHighlights": [
          "10,000 miniature golden Buddha statues covering every wall of the 4th-floor Quang Minh Hall",
          "Monumental central Shakyamuni Buddha seated on a thousand-petal lotus",
          "Serene multi-story temple tucked down a quiet District 5 alleyway"
        ],
        "audioScript": [
          "Welcome to Van Phat Pagoda in District 5, famous for its awe-inspiring fourth-floor hall lined with ten thousand golden Buddha statues."
        ]
      },
      "fr": {
        "name": "Pagode Van Phat (Pagode des Dix Mille Bouddhas)",
        "shortSummary": "Sanctuaire caché de Cho Lon abritant au 4e étage une salle spectaculaire tapissée de 10 000 statues dorées de Bouddha.",
        "historicalEra": "1959",
        "openingHours": "07h00 – 17h00",
        "architecturalHighlights": [
          "Salle Quang Minh ornée de 10 000 statuettes dorées",
          "Atmosphère recueillie et cadre photographique unique"
        ],
        "audioScript": [
          "Bienvenue à la pagode Van Phat, célèbre pour sa salle des dix mille Bouddhas dorés."
        ]
      },
      "zh": {
        "name": "万佛寺（第五郡堤岸）",
        "shortSummary": "隐匿于第五郡巷内的庄严佛寺，四楼光明大殿四壁镶满一万尊金色小佛像，视觉极为震撼。",
        "historicalEra": "始建于1959年",
        "openingHours": "07:00 – 17:00",
        "architecturalHighlights": [
          "四楼大殿环绕一万尊贴金小佛像的壮观金墙",
          "中央千瓣莲台释迦牟尼佛巨像"
        ],
        "audioScript": [
          "欢迎来到第五郡万佛寺，登上四楼光明大殿即可一睹万佛金墙的震撼奇观。"
        ]
      },
      "ja": {
        "name": "万仏寺（ヴァンファット寺・5区）",
        "shortSummary": "チョロンの路地裏に建つ名刹。4階の本堂壁面を1万体の黄金の仏像が埋め尽くす圧巻の光景が広がります。",
        "historicalEra": "1959年創建",
        "openingHours": "07:00 – 17:00",
        "architecturalHighlights": [
          "4階光明殿の壁一面に並ぶ1万体の黄金仏像",
          "千弁の蓮座に鎮座する荘厳な釈迦如来像"
        ],
        "audioScript": [
          "1万体の仏像が壁一面に並ぶ圧巻の本堂で知られる5区の万仏寺へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-chuavanphatq-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Ten_Thousand_Buddha_Pagoda_in_HCMC.jpg/1280px-Ten_Thousand_Buddha_Pagoda_in_HCMC.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Chùa Vạn Phật (Chùa 10.000 Tượng Phật · Quận 5) (Wikimedia Commons)",
          "en": "Real view of Van Phat Pagoda (Ten Thousand Buddhas Temple) (Wikimedia Commons)",
          "fr": "Vue réelle de Pagode Van Phat (Pagode des Dix Mille Bouddhas) (Wikimedia Commons)",
          "zh": "万佛寺（第五郡堤岸）实景照片（维基共享资源）",
          "ja": "万仏寺（ヴァンファット寺・5区）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chuavanphatq-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Ch%C3%B9a_V%E1%BA%A1n_Ph%E1%BA%ADt_%28N%E1%BB%99i_th%E1%BA%A5t_Ch%C3%A1nh_%C4%91i%E1%BB%87n%2C_b%E1%BB%A9c_t%C6%B0%E1%BB%9Dng_v%E1%BA%A1n_t%C6%B0%E1%BB%A3ng_Ph%E1%BA%ADt%29_%284%29.jpg/1280px-Ch%C3%B9a_V%E1%BA%A1n_Ph%E1%BA%ADt_%28N%E1%BB%99i_th%E1%BA%A5t_Ch%C3%A1nh_%C4%91i%E1%BB%87n%2C_b%E1%BB%A9c_t%C6%B0%E1%BB%9Dng_v%E1%BA%A1n_t%C6%B0%E1%BB%A3ng_Ph%E1%BA%ADt%29_%284%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chùa Vạn Phật (Chùa 10.000 Tượng Phật · Quận 5) (Ảnh 2)",
          "en": "Architecture & atmosphere at Van Phat Pagoda (Ten Thousand Buddhas Temple) (Photo 2)",
          "fr": "Architecture et ambiance à Pagode Van Phat (Pagode des Dix Mille Bouddhas) (Photo 2)",
          "zh": "万佛寺（第五郡堤岸）建筑与实景细节（图 2）",
          "ja": "万仏寺（ヴァンファット寺・5区）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chuavanphatq-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Ch%C3%B9a_V%E1%BA%A1n_Ph%E1%BA%ADt_%28N%E1%BB%99i_th%E1%BA%A5t_Ch%C3%A1nh_%C4%91i%E1%BB%87n%2C_b%E1%BB%A9c_t%C6%B0%E1%BB%9Dng_v%E1%BA%A1n_t%C6%B0%E1%BB%A3ng_Ph%E1%BA%ADt%29_%281%29.jpg/1280px-Ch%C3%B9a_V%E1%BA%A1n_Ph%E1%BA%ADt_%28N%E1%BB%99i_th%E1%BA%A5t_Ch%C3%A1nh_%C4%91i%E1%BB%87n%2C_b%E1%BB%A9c_t%C6%B0%E1%BB%9Dng_v%E1%BA%A1n_t%C6%B0%E1%BB%A3ng_Ph%E1%BA%ADt%29_%281%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chùa Vạn Phật (Chùa 10.000 Tượng Phật · Quận 5) (Ảnh 3)",
          "en": "Architecture & atmosphere at Van Phat Pagoda (Ten Thousand Buddhas Temple) (Photo 3)",
          "fr": "Architecture et ambiance à Pagode Van Phat (Pagode des Dix Mille Bouddhas) (Photo 3)",
          "zh": "万佛寺（第五郡堤岸）建筑与实景细节（图 3）",
          "ja": "万仏寺（ヴァンファット寺・5区）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cvp-1",
        "name": "Mì Vịt Tiềm Thiêm Huy (Nguyễn Trãi Q.5)",
        "cuisine": "Ẩm thực Hoa – Mì vịt tiềm trứ danh",
        "specialtyDishes": [
          "Mì vịt tiềm đùi nguyên",
          "Sủi cảo tôm thịt",
          "Trà bí đao hạt chia"
        ],
        "rating": 4.5,
        "reviewCount": 4120,
        "priceRange": "75.000đ – 135.000đ",
        "lat": 10.7556,
        "lng": 106.6712,
        "address": "455 Nguyễn Trãi, Phường 7, Quận 5, TP.HCM",
        "openHours": "08:00 – 23:30",
        "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 35
  },
  {
    "id": "nha-tho-cho-quan",
    "city": "Quận 5 · TP.HCM",
    "district": "Quận 5",
    "lat": 10.7568,
    "lng": 106.6819,
    "category": "temple",
    "rating": 4.8,
    "reviewCount": 3690,
    "ticketPrice": "Miễn phí tham quan",
    "address": "120 Trần Bình Trọng, Phường 2, Quận 5, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Nh%C3%A0_th%E1%BB%9D_Th%C3%A1nh_T%C3%A2m_Ch%C3%BAa_Gi%C3%AAsu%2C_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg/1280px-Nh%C3%A0_th%E1%BB%9D_Th%C3%A1nh_T%C3%A2m_Ch%C3%BAa_Gi%C3%AAsu%2C_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Nhà thờ Chợ Quán (Nhà thờ cổ nhất TP.HCM · 1722)",
        "shortSummary": "Họ đạo Công giáo lâu đời nhất Thành phố Hồ Chí Minh (thành lập năm 1722), sở hữu thánh đường kiến trúc Romanesque bề thế khánh thành năm 1896.",
        "historicalEra": "Họ đạo 1722 – Thánh đường 1896",
        "openingHours": "05:00 – 11:00, 14:30 – 19:00 Hàng ngày",
        "architecturalHighlights": [
          "Hơn 300 năm lịch sử hình thành cùng vùng đất Sài Gòn – Gia Định",
          "Kiến trúc Romanesque bề thế với mặt tiền vàng kem, vòm cuốn tròn và tháp chuông vươn cao",
          "Khuôn viên rộng rãi rợp bóng cây cổ thụ yên tĩnh giữa khu vực Chợ Quán"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Nhà thờ Chợ Quán tại số 120 Trần Bình Trọng, Quận 5 – họ đạo Công giáo lâu đời nhất tại Thành phố Hồ Chí Minh với lịch sử hơn 300 năm kể từ năm 1722.",
          "Ngôi thánh đường hiện nay khánh thành năm 1896 mang vẻ đẹp Romanesque cổ kính và uy nghiêm, là chứng nhân lịch sử quan trọng của vùng đất Sài Gòn – Chợ Lớn.",
          "Theo tư liệu bách khoa Wikipedia: Nhà thờ Chợ Quán (tên hiệu: Nhà thờ Thánh Tâm Chúa Giêsu) là một nhà thờ Công giáo tại Thành phố Hồ Chí Minh, thuộc giáo xứ Chợ Quán, tọa lạc tại số 120 đường Trần Bình Trọng, phường Chợ Quán, thành phố Hồ Chí Minh. Nhà thờ có kiến trúc Romanesque, đã nhiều lần bị phá hủy rồi lại được xây lại vào các năm 1727, 1733, 1793, 1862, 1882 và ngôi nhà thờ hiện nay được khánh thành vào năm 1896. Nhà thờ Chợ Quán là nhà thờ cổ nhất Thành phố Hồ Chí Minh."
        ]
      },
      "en": {
        "name": "Cho Quan Church (Oldest Catholic Parish in HCMC · 1722)",
        "shortSummary": "Established in 1722 as Ho Chi Minh City’s oldest Catholic parish, anchored by a stately 1896 Romanesque church set in a leafy District 5 compound.",
        "historicalEra": "Parish 1722 – Church 1896",
        "openingHours": "05:00 – 11:00, 14:30 – 19:00 Daily",
        "architecturalHighlights": [
          "Over 300 years of continuous history as Saigon’s oldest Catholic parish",
          "Grand 1896 Romanesque cream-yellow facade and arched nave",
          "Peaceful shaded courtyard tucked inside historic District 5"
        ],
        "audioScript": [
          "Welcome to Cho Quan Church in District 5, founded in 1722 as the oldest Catholic parish in Ho Chi Minh City."
        ]
      },
      "fr": {
        "name": "Église Cho Quan (Plus ancienne paroisse de Saïgon · 1722)",
        "shortSummary": "Plus ancienne paroisse catholique de Hô Chi Minh-Ville (1722), dotée d’une majestueuse église romane inaugurée en 1896.",
        "historicalEra": "1722 – 1896",
        "openingHours": "05h00 – 11h00, 14h30 – 19h00",
        "architecturalHighlights": [
          "Plus de 300 ans d’histoire religieuse à Saïgon",
          "Architecture romane de 1896 entourée d’arbres centenaires"
        ],
        "audioScript": [
          "Bienvenue à l’église Cho Quan, fondée en 1722 et plus ancienne paroisse catholique de la ville."
        ]
      },
      "zh": {
        "name": "社馆教堂（胡志明市最古老教堂 · 1722年）",
        "shortSummary": "胡志明市历史最悠久的天主教堂区（始于1722年），现存1896年落成的罗马式大教堂典雅庄严。",
        "historicalEra": "1722年建堂区 – 1896年现建筑",
        "openingHours": "05:00 – 11:00, 14:30 – 19:00",
        "architecturalHighlights": [
          "逾三百年历史的西贡最早天主教社区",
          "宏伟的1896年罗马式鹅黄外墙与绿荫庭院"
        ],
        "audioScript": [
          "欢迎来到第五郡的社馆教堂，它始建于1722年，是胡志明市历史最悠久的天主教堂。"
        ]
      },
      "ja": {
        "name": "チョークアン教会（ホーチミン市最古の教会・1722年）",
        "shortSummary": "1722年創設の市内最古のカトリック教区。1896年完成の堂々たるロマネスク様式聖堂が緑豊かな境内に建っています。",
        "historicalEra": "1722年創設 – 1896年現聖堂",
        "openingHours": "05:00 – 11:00, 14:30 – 19:00",
        "architecturalHighlights": [
          "300年以上の歴史を持つサイゴン最古の教区",
          "1896年完成の優美なロマネスク建築"
        ],
        "audioScript": [
          "1722年に起源を持つホーチミン市最古の教区、チョークアン教会へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-nhathochoqua-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Nh%C3%A0_th%E1%BB%9D_Th%C3%A1nh_T%C3%A2m_Ch%C3%BAa_Gi%C3%AAsu%2C_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg/1280px-Nh%C3%A0_th%E1%BB%9D_Th%C3%A1nh_T%C3%A2m_Ch%C3%BAa_Gi%C3%AAsu%2C_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Nhà thờ Chợ Quán (Nhà thờ cổ nhất TP.HCM · 1722) (Wikimedia Commons)",
          "en": "Real view of Cho Quan Church (Oldest Catholic Parish in HCMC · 1722) (Wikimedia Commons)",
          "fr": "Vue réelle de Église Cho Quan (Plus ancienne paroisse de Saïgon · 1722) (Wikimedia Commons)",
          "zh": "社馆教堂（胡志明市最古老教堂 · 1722年）实景照片（维基共享资源）",
          "ja": "チョークアン教会（ホーチミン市最古の教会・1722年）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-nhathochoqua-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/20190923_Independence_Palace-13.jpg/1280px-20190923_Independence_Palace-13.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Nhà thờ Chợ Quán (Nhà thờ cổ nhất TP.HCM · 1722) (Ảnh 2)",
          "en": "Architecture & atmosphere at Cho Quan Church (Oldest Catholic Parish in HCMC · 1722) (Photo 2)",
          "fr": "Architecture et ambiance à Église Cho Quan (Plus ancienne paroisse de Saïgon · 1722) (Photo 2)",
          "zh": "社馆教堂（胡志明市最古老教堂 · 1722年）建筑与实景细节（图 2）",
          "ja": "チョークアン教会（ホーチミン市最古の教会・1722年）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-nhathochoqua-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/91/Ben_Thanh_market_2.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Nhà thờ Chợ Quán (Nhà thờ cổ nhất TP.HCM · 1722) (Ảnh 3)",
          "en": "Architecture & atmosphere at Cho Quan Church (Oldest Catholic Parish in HCMC · 1722) (Photo 3)",
          "fr": "Architecture et ambiance à Église Cho Quan (Plus ancienne paroisse de Saïgon · 1722) (Photo 3)",
          "zh": "社馆教堂（胡志明市最古老教堂 · 1722年）建筑与实景细节（图 3）",
          "ja": "チョークアン教会（ホーチミン市最古の教会・1722年）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-ntcq-1",
        "name": "Cơm Tấm Ba Ghiền / Cháo Tiều Chợ Quán",
        "cuisine": "Ẩm thực Bình dân Sài Gòn xưa",
        "specialtyDishes": [
          "Cháo Tiều thập cẩm",
          "Hủ tiếu sa tế nai",
          "Cà phê đá"
        ],
        "rating": 4.5,
        "reviewCount": 1520,
        "priceRange": "40.000đ – 80.000đ",
        "lat": 10.7574,
        "lng": 106.6812,
        "address": "Trần Bình Trọng – Nguyễn Trãi, Quận 5, TP.HCM",
        "openHours": "07:00 – 21:30",
        "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 35
  },
  {
    "id": "lang-du-lich-binh-quoi",
    "city": "Bình Thạnh · TP.HCM",
    "district": "Bình Thạnh",
    "lat": 10.8266,
    "lng": 106.7376,
    "category": "ancient_town",
    "rating": 4.6,
    "reviewCount": 11200,
    "ticketPrice": "Miễn phí vào cổng (Buffet cuối tuần ~300.000đ)",
    "address": "1147 Bình Quới, Phường 28, Quận Bình Thạnh, TP.HCM",
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/7/70/Thanh_Da_area.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
    "translations": {
      "vi": {
        "name": "Làng Du lịch Bình Quới (Bán đảo Thanh Đa)",
        "shortSummary": "Không gian miệt vườn Nam Bộ xanh mát yên bình giữa lòng thành phố với rặng dừa nước, cầu khỉ, ao sen, nhà tranh vách đất và buffet ẩm thực khẩn hoang Nam Bộ nổi tiếng.",
        "historicalEra": "Khởi dựng thập niên 1970",
        "openingHours": "09:00 – 21:00 Hàng ngày",
        "architecturalHighlights": [
          "Cảnh quan sông nước miệt vườn Nam Bộ nguyên bản với cầu khỉ, xuồng ba lá và nhà chòi lá dừa",
          "Thảm cỏ xanh rộng lớn ven sông Sài Gòn – tọa độ chụp ảnh áo bà ba, áo dài truyền thống tuyệt đẹp",
          "Buffet \"Khẩn hoang Nam Bộ\" cuối tuần quy tụ hơn 70 món quê dân dã"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Làng Du lịch Bình Quới nằm ở cuối bán đảo Thanh Đa xanh mát bên dòng sông Sài Gòn.",
          "Rời xa sự náo nhiệt của trung tâm chỉ khoảng 20 phút di chuyển, nơi đây tái hiện trọn vẹn hồn quê Nam Bộ với rặng dừa nước, ao súng, chiếc xuồng ba lá và hương vị ẩm thực miệt vườn đậm đà.",
          "Theo tư liệu bách khoa Wikipedia: Bình Quới – Thanh Đa là một bán đảo (thường được gọi tắt là bán đảo Thanh Đa hoặc bán đảo Bình Quới) nằm bên sông Sài Gòn thuộc phường Bình Quới, Thành phố Hồ Chí Minh, Việt Nam. Tuy nằm giữa lòng thành phố nhưng hiện nay bán đảo này vẫn như một miền quê do dự án quy hoạch đã bị treo hơn 25 năm qua. Cảnh quan thường gặp ở đây là những ruộng lúa, ao, đầm, đối lập với những cao ốc, căn hộ, khu biệt thự phía bên kia sông Sài Gòn thuộc khu vực Thảo Điền, phường An Khánh."
        ]
      },
      "en": {
        "name": "Binh Quoi Tourist Village (Thanh Da Peninsula)",
        "shortSummary": "A lush Mekong-style riverside retreat on Thanh Da Peninsula featuring palm-fringed canals, wooden footbridges, lotus ponds, and famed Southern Vietnamese folk buffets.",
        "historicalEra": "Established in the 1970s",
        "openingHours": "09:00 – 21:00 Daily",
        "architecturalHighlights": [
          "Authentic Southern Vietnamese village setting with thatched cottages, water palms, and monkey bridges",
          "Expansive riverside lawns ideal for traditional Ao Ba Ba & Ao Dai photography",
          "Weekend Southern Folk Buffet featuring over 70 traditional countryside dishes"
        ],
        "audioScript": [
          "Welcome to Binh Quoi Village on Thanh Da Peninsula, a tranquil Mekong-style riverside oasis just 20 minutes from downtown Ho Chi Minh City."
        ]
      },
      "fr": {
        "name": "Village Touristique de Binh Quoi (Presqu’île de Thanh Da)",
        "shortSummary": "Oasis verdoyante au bord du fleuve Saïgon recréant l’atmosphère des villages du delta du Mékong avec ponts de bois, palmiers d’eau et buffets du Sud.",
        "historicalEra": "Années 1970",
        "openingHours": "09h00 – 21h00",
        "architecturalHighlights": [
          "Paysage champêtre de cocotiers d’eau, étangs de lotus et paillotes",
          "Célèbre buffet gastronomique traditionnel du Sud-Vietnam le week-end"
        ],
        "audioScript": [
          "Bienvenue au village touristique de Binh Quoi, havre champêtre au bord du fleuve Saïgon."
        ]
      },
      "zh": {
        "name": "平桂旅游村（清多半岛）",
        "shortSummary": "隐匿于西贡河清多半岛的南越水乡生态村，水椰摇曳、荷塘木桥与草屋相映成趣，周末南越乡土自助餐久负盛名。",
        "historicalEra": "始建于20世纪70年代",
        "openingHours": "09:00 – 21:00",
        "architecturalHighlights": [
          "原汁原味的湄公河三角洲水乡园林与木桥茅屋",
          "汇聚70余道地道南越风味的周末特色自助餐"
        ],
        "audioScript": [
          "欢迎来到平桂旅游村，在这里不用远离市区便能感受诗意悠闲的南越水乡风情。"
        ]
      },
      "ja": {
        "name": "ビンクオイ観光村（タインダー半島）",
        "shortSummary": "サイゴン川沿いの緑豊かな半島に広がる南ベトナムの田園リゾート。ニッパヤシや蓮池、伝統料理の週末ビュッフェが人気です。",
        "historicalEra": "1970年代開設",
        "openingHours": "09:00 – 21:00",
        "architecturalHighlights": [
          "メコンの農村を再現したヤシ並木・木橋・蓮池のフォトスポット",
          "70種以上の南部郷土料理を味わえる週末ビュッフェ"
        ],
        "audioScript": [
          "市内からわずかの距離で南ベトナムの田園風景を楽しめるビンクオイ観光村へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-langdulichbi-1",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/7/70/Thanh_Da_area.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Làng Du lịch Bình Quới (Bán đảo Thanh Đa) (Wikimedia Commons)",
          "en": "Real view of Binh Quoi Tourist Village (Thanh Da Peninsula) (Wikimedia Commons)",
          "fr": "Vue réelle de Village Touristique de Binh Quoi (Presqu’île de Thanh Da) (Wikimedia Commons)",
          "zh": "平桂旅游村（清多半岛）实景照片（维基共享资源）",
          "ja": "ビンクオイ観光村（タインダー半島）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-langdulichbi-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/20190923_Independence_Palace-13.jpg/1280px-20190923_Independence_Palace-13.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Làng Du lịch Bình Quới (Bán đảo Thanh Đa) (Ảnh 2)",
          "en": "Architecture & atmosphere at Binh Quoi Tourist Village (Thanh Da Peninsula) (Photo 2)",
          "fr": "Architecture et ambiance à Village Touristique de Binh Quoi (Presqu’île de Thanh Da) (Photo 2)",
          "zh": "平桂旅游村（清多半岛）建筑与实景细节（图 2）",
          "ja": "ビンクオイ観光村（タインダー半島）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-langdulichbi-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Ao_Sen%2C_khu_du_lich_Binh_quoi_-ph%C6%B0%E1%BB%9Dng_28%2C_B%C3%ACnh_Th%E1%BA%A1nh%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg/1280px-Ao_Sen%2C_khu_du_lich_Binh_quoi_-ph%C6%B0%E1%BB%9Dng_28%2C_B%C3%ACnh_Th%E1%BA%A1nh%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Làng Du lịch Bình Quới (Bán đảo Thanh Đa) (Ảnh 3)",
          "en": "Architecture & atmosphere at Binh Quoi Tourist Village (Thanh Da Peninsula) (Photo 3)",
          "fr": "Architecture et ambiance à Village Touristique de Binh Quoi (Presqu’île de Thanh Da) (Photo 3)",
          "zh": "平桂旅游村（清多半岛）建筑与实景细节（图 3）",
          "ja": "ビンクオイ観光村（タインダー半島）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-bq-1",
        "name": "Nhà hàng Buffet Khẩn Hoang Nam Bộ (Bình Quới 1)",
        "cuisine": "Ẩm thực Miền Tây & Nam Bộ",
        "specialtyDishes": [
          "Bánh xèo củ hủ dừa",
          "Cá lóc nướng trui",
          "Cháo vịt Thanh Đa"
        ],
        "rating": 4.6,
        "reviewCount": 3820,
        "priceRange": "180.000đ – 330.000đ",
        "lat": 10.8268,
        "lng": 106.7378,
        "address": "1147 Bình Quới, Phường 28, Quận Bình Thạnh, TP.HCM",
        "openHours": "10:00 – 21:00",
        "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 120
  },
  {
    "id": "hem-hao-si-phuong-cho-lon",
    "city": "Quận 5 · Chợ Lớn",
    "district": "Quận 5",
    "lat": 10.7544,
    "lng": 106.6657,
    "category": "ancient_town",
    "rating": 4.6,
    "reviewCount": 4920,
    "ticketPrice": "Miễn phí (Giữ trật tự cho cư dân)",
    "address": "Hẻm 206 Trần Hưng Đạo, Phường 11, Quận 5, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/HCMC_Binh_Tay.jpg/1280px-HCMC_Binh_Tay.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Hẻm cổ Hào Sĩ Phường (Hơn 100 năm tuổi)",
        "shortSummary": "Con hẻm chung cư cổ xây dựng từ năm 1910 bởi công ty Hứa Bổn Hòa (Chú Hỏa), nổi tiếng với hành lang sơn xanh–vàng, cầu thang gỗ và khung cảnh đậm chất điện ảnh Hồng Kông xưa.",
        "historicalEra": "Khởi dựng năm 1910 (Hơn 115 năm tuổi)",
        "openingHours": "08:00 – 18:00 (Ghé thăm văn minh, tránh làm ồn)",
        "architecturalHighlights": [
          "Hai dãy nhà phố liền kề 2 tầng đối xứng qua lối đi hẹp lát gạch cổ mang đậm hồn Chợ Lớn đầu thế kỷ 20",
          "Bảng màu xanh ngọc, vàng nhạt, cửa chớp gỗ và câu đối đỏ tạo nên bối cảnh nhiếp ảnh độc nhất vô nhị",
          "Liền kề Phố lồng đèn Lương Nhữ Học và trục hội quán Nguyễn Trãi"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Hẻm cổ Hào Sĩ Phường tại số 206 Trần Hưng Đạo, Quận 5 – khu cư xá hơn 115 năm tuổi do công ty Chú Hỏa xây dựng năm 1910.",
          "Bước qua cổng hẻm nhỏ, không gian như quay ngược thời gian về Chợ Lớn thập niên 1960 với những dãy ban công xanh–vàng đối diện nhau. Khi chụp ảnh lưu niệm, quý khách vui lòng giữ yên lặng và tôn trọng đời sống sinh hoạt của các hộ dân nơi đây.",
          "Theo tư liệu bách khoa Wikipedia: Chợ Lớn (chữ Hán: 堤岸; âm Hán-Việt: Đê Ngạn; âm Quảng Đông: Thầy Ngòn) là một khu vực đông Hoa kiều sinh sống nằm ven kênh Tàu Hủ trải dài trên địa bàn Quận 5 và Quận 6 cũ, về phía nam tới Quận 8 cũ, về phía bắc tới Quận 10 và Quận 11 cũ ở Thành phố Hồ Chí Minh, Việt Nam. Khu phố Chợ Lớn đã có Hoa kiều sinh sống từ lâu và được coi là phố người Hoa lớn nhất thế giới tính theo diện tích."
        ]
      },
      "en": {
        "name": "Hao Si Phuong Historic Alley (1910)",
        "shortSummary": "A century-old Sino-Vietnamese residential alleyway built in 1910 in Cho Lon, celebrated for its pastel green-and-yellow balconies and timeless cinematic charm.",
        "historicalEra": "Built in 1910",
        "openingHours": "08:00 – 18:00 (Please respect residents)",
        "architecturalHighlights": [
          "Symmetrical two-story wooden-shuttered shophouses lining a narrow heritage courtyard",
          "Pastel mint walls, red lucky couplets, and retro staircases beloved by photographers",
          "Minutes away from Luong Nhu Hoc Lantern Street and Cho Lon temples"
        ],
        "audioScript": [
          "Welcome to Hao Si Phuong, a picturesque 1910 residential alley in Cho Lon frozen in time with vintage balconies and warm neighborhood charm.",
          "Historical context from Wikipedia: Chợ Lớn (Chinese: 堤岸), usually anglicized as \"Cholon\" in English sources, is an unofficial quarter of Ho Chi Minh City, Vietnam. Historically a city separate from Sài Gòn prior to its urbanization in the 1930s-1950s, the quarter has long been inhabited by Chinese people and is considered the largest Chinatown in the world by area."
        ]
      },
      "fr": {
        "name": "Ruelle Historique Hao Si Phuong (1910)",
        "shortSummary": "Ruelle résidentielle centenaire de Cho Lon bâtie en 1910, célèbre pour ses balcons pastel et son atmosphère cinématographique rétro.",
        "historicalEra": "1910",
        "openingHours": "08h00 – 18h00",
        "architecturalHighlights": [
          "Galeries symétriques vert d’eau et jaune aux volets en bois anciens",
          "Décor authentique de la vie quotidienne de Cho Lon"
        ],
        "audioScript": [
          "Bienvenue dans la ruelle Hao Si Phuong, joyau architectural centenaire du quartier de Cho Lon."
        ]
      },
      "zh": {
        "name": "豪士坊百年老巷（1910年）",
        "shortSummary": "建于1910年的堤岸百年华人老宅院，青黄相间的木质廊道与复古楼梯充满老香港电影氛围。",
        "historicalEra": "建于1910年",
        "openingHours": "08:00 – 18:00（请轻声文明参观）",
        "architecturalHighlights": [
          "对称双层老式骑楼走廊、百叶窗与春联",
          "紧邻梁汝学灯笼街与各大百年华人会馆"
        ],
        "audioScript": [
          "欢迎来到建于1910年的堤岸豪士坊老巷，拍照打卡时请保持安静，尊重当地居民生活。"
        ]
      },
      "ja": {
        "name": "ハオシーフオン歴史路地（1910年）",
        "shortSummary": "1910年に建てられたチョロンのレトロな集合住宅路地。パステルカラーの回廊と木製階段がノスタルジックな映画の世界を思わせます。",
        "historicalEra": "1910年建築",
        "openingHours": "08:00 – 18:00（住民への配慮を忘れずに）",
        "architecturalHighlights": [
          "向かい合う2階建て長屋とミントグリーンの古い回廊",
          "ランタン通りや天后宮と合わせて歩ける絶好の撮影地"
        ],
        "audioScript": [
          "1910年から続くチョロンの隠れたフォトスポット、ハオシーフオン路地へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-hemhaosiphuo-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/HCMC_Binh_Tay.jpg/1280px-HCMC_Binh_Tay.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Hẻm cổ Hào Sĩ Phường (Hơn 100 năm tuổi) (Wikimedia Commons)",
          "en": "Real view of Hao Si Phuong Historic Alley (1910) (Wikimedia Commons)",
          "fr": "Vue réelle de Ruelle Historique Hao Si Phuong (1910) (Wikimedia Commons)",
          "zh": "豪士坊百年老巷（1910年）实景照片（维基共享资源）",
          "ja": "ハオシーフオン歴史路地（1910年）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-hemhaosiphuo-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/HCMC_Binh_Tay.jpg/1280px-HCMC_Binh_Tay.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Hẻm cổ Hào Sĩ Phường (Hơn 100 năm tuổi) (Ảnh 2)",
          "en": "Architecture & atmosphere at Hao Si Phuong Historic Alley (1910) (Photo 2)",
          "fr": "Architecture et ambiance à Ruelle Historique Hao Si Phuong (1910) (Photo 2)",
          "zh": "豪士坊百年老巷（1910年）建筑与实景细节（图 2）",
          "ja": "ハオシーフオン歴史路地（1910年）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-hemhaosiphuo-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Binh_Tay_market_3.jpg/1280px-Binh_Tay_market_3.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Hẻm cổ Hào Sĩ Phường (Hơn 100 năm tuổi) (Ảnh 3)",
          "en": "Architecture & atmosphere at Hao Si Phuong Historic Alley (1910) (Photo 3)",
          "fr": "Architecture et ambiance à Ruelle Historique Hao Si Phuong (1910) (Photo 3)",
          "zh": "豪士坊百年老巷（1910年）建筑与实景细节（图 3）",
          "ja": "ハオシーフオン歴史路地（1910年）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-hsp-1",
        "name": "Sủi Cảo Thiên Thiên (Hà Tôn Quyền – Chợ Lớn)",
        "cuisine": "Sủi cảo & Mì kéo Chợ Lớn",
        "specialtyDishes": [
          "Sủi cảo tôm thịt thập cẩm",
          "Sủi cảo chiên giòn",
          "Mì khô dầu hào"
        ],
        "rating": 4.6,
        "reviewCount": 5120,
        "priceRange": "55.000đ – 110.000đ",
        "lat": 10.7579,
        "lng": 106.6584,
        "address": "197 Hà Tôn Quyền, Phường 4, Quận 11 (giáp Q.5), TP.HCM",
        "openHours": "13:00 – 23:00",
        "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 50
  },
  {
    "id": "cho-binh-tay-cho-lon",
    "city": "Quận 6 · Chợ Lớn",
    "district": "Quận 6",
    "lat": 10.7495,
    "lng": 106.6512,
    "category": "ancient_town",
    "rating": 4.6,
    "reviewCount": 18400,
    "ticketPrice": "Miễn phí tham quan",
    "address": "57A Tháp Mười, Phường 2, Quận 6, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Vn-hcm-cho-binh-tay-27-07-07.JPG/1280px-Vn-hcm-cho-binh-tay-27-07-07.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Chợ Bình Tây (Chợ Lớn Mới · 1928)",
        "shortSummary": "Ngôi chợ đầu mối lịch sử vĩ đại nhất khu Chợ Lớn xây dựng năm 1928–1930 bởi thương nhân Quách Đàm, mang kiến trúc chữ Khẩu Á Đông kết hợp kỹ thuật Pháp cùng tháp đồng hồ 4 mặt.",
        "historicalEra": "1928 – 1930 (Di tích Kiến trúc TP.HCM)",
        "openingHours": "06:00 – 19:00 Hàng ngày",
        "architecturalHighlights": [
          "Mái ngói lưu ly uốn cong với cặp rồng chầu châu và tháp đồng hồ 4 mặt cổ kính",
          "Sân hoa viên giếng trời rộng lớn ở trung tâm đặt tượng đồng thương nhân Quách Đàm",
          "Hơn 2.300 sạp hàng sỉ gia vị, trà, thảo mộc, bánh mứt và khu ẩm thực Chợ Lớn cực kỳ sôi động"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Chợ Bình Tây – còn gọi là Chợ Lớn Mới tại số 57A Tháp Mười, Quận 6.",
          "Khởi công năm 1928 bằng kinh phí của doanh nhân Quách Đàm, ngôi chợ là kiệt tác giao thoa giữa mái ngói âm dương Á Đông và kết cấu bê tông cốt thép Pháp, sở hữu khoảng sân giếng trời xanh mát đầy bản sắc thương cảng Chợ Lớn.",
          "Theo tư liệu bách khoa Wikipedia: Chợ Bình Tây, còn được gọi là Chợ Lớn Mới, là một ngôi chợ tại phường Bình Tây (Quận 6 cũ), Thành phố Hồ Chí Minh, tọa lạc trong khu vực gọi là Chợ Lớn. Chợ Bình Tây nằm trong khuôn viên rộng 25.000 m², nằm giữa 4 tuyến đường Tháp Mười - Lê Tấn Kế - Phan Văn Khỏe - Trần Bình. Chợ này có mặt bằng hình chữ nhật, 12 cổng (gồm cả chính lẫn phụ) và được thiết kế theo lối kiến trúc Á Đông."
        ]
      },
      "en": {
        "name": "Binh Tay Market (Cho Lon Historic Market · 1928)",
        "shortSummary": "Chinatown’s grand 1928 wholesale market built by merchant Quach Dam, combining curved Asian glazed-tile roofs, a four-sided clock tower, and a lush central courtyard.",
        "historicalEra": "1928 – 1930",
        "openingHours": "06:00 – 19:00 Daily",
        "architecturalHighlights": [
          "Pagoda-style curved tile roof crowned with dragon motifs and a central clock tower",
          "Open-air central courtyard garden honoring founder Quach Dam",
          "Over 2,300 bustling stalls of spices, dried delicacies, tea, and local street food"
        ],
        "audioScript": [
          "Welcome to Binh Tay Market in District 6, the architectural and commercial centerpiece of Cho Lon since 1928.",
          "Historical context from Wikipedia: Bình Tây Market (Vietnamese: Chợ Bình Tây, Chinese: 平西市場) is the largest market in Chợ Lớn; located in Bình Tây ward, Ho Chi Minh City, Vietnam. Prior to 1975, it was also referred to as \"Chợ Lớn mới\". (lit. 'new big market') to differentiate from its predecessor, \"Chợ Lớn cũ\" (lit. 'old / former big market')."
        ]
      },
      "fr": {
        "name": "Marché Binh Tay (Grand Marché de Cho Lon · 1928)",
        "shortSummary": "Grand marché historique de Cho Lon bâti en 1928 alliant toitures chinoises vernissées, tour de l’horloge et cour-jardin centrale.",
        "historicalEra": "1928 – 1930",
        "openingHours": "06h00 – 19h00",
        "architecturalHighlights": [
          "Toits pagode ornés de dragons et tour de l’horloge à quatre cadrans",
          "Plus de 2 300 étals d’épices, thés et spécialités de Cho Lon"
        ],
        "audioScript": [
          "Bienvenue au marché Binh Tay, cœur commerçant et architectural de Cho Lon depuis 1928."
        ]
      },
      "zh": {
        "name": "平西市场（堤岸新大市场 · 1928年）",
        "shortSummary": "1928年由华商郭琰捐建的堤岸地标大市场，中式琉璃飞檐四面钟楼与法式结构完美结合，中央庭院绿意盎然。",
        "historicalEra": "1928 – 1930年",
        "openingHours": "06:00 – 19:00",
        "architecturalHighlights": [
          "四面复古钟楼、中式琉璃瓦飞檐与双龙戏珠屋脊",
          "逾2300家香料、干货、茶叶摊位与热闹美食区"
        ],
        "audioScript": [
          "欢迎来到第六郡的平西市场，这座建于1928年的百年市场是感受堤岸商贸活力的最佳去处。"
        ]
      },
      "ja": {
        "name": "ビンタイ市場（チョロン大市場・1928年）",
        "shortSummary": "1928年建設のチョロン最大の卸売市場。東洋風の瓦屋根と四面時計塔、緑の中庭が美しい歴史的建築です。",
        "historicalEra": "1928年 – 1930年",
        "openingHours": "06:00 – 19:00",
        "architecturalHighlights": [
          "龍の装飾を載せた反り屋根と象徴的な時計塔",
          "スパイス・乾物・茶葉が並ぶ2,300以上の活気ある商店"
        ],
        "audioScript": [
          "1928年建設のチョロンを代表する歴史市場、ビンタイ市場へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-chobinhtaych-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Vn-hcm-cho-binh-tay-27-07-07.JPG/1280px-Vn-hcm-cho-binh-tay-27-07-07.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Chợ Bình Tây (Chợ Lớn Mới · 1928) (Wikimedia Commons)",
          "en": "Real view of Binh Tay Market (Cho Lon Historic Market · 1928) (Wikimedia Commons)",
          "fr": "Vue réelle de Marché Binh Tay (Grand Marché de Cho Lon · 1928) (Wikimedia Commons)",
          "zh": "平西市场（堤岸新大市场 · 1928年）实景照片（维基共享资源）",
          "ja": "ビンタイ市場（チョロン大市場・1928年）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chobinhtaych-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Vn-hcm-cho-binh-tay-27-07-07.JPG/1280px-Vn-hcm-cho-binh-tay-27-07-07.JPG?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chợ Bình Tây (Chợ Lớn Mới · 1928) (Ảnh 2)",
          "en": "Architecture & atmosphere at Binh Tay Market (Cho Lon Historic Market · 1928) (Photo 2)",
          "fr": "Architecture et ambiance à Marché Binh Tay (Grand Marché de Cho Lon · 1928) (Photo 2)",
          "zh": "平西市场（堤岸新大市场 · 1928年）建筑与实景细节（图 2）",
          "ja": "ビンタイ市場（チョロン大市場・1928年）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chobinhtaych-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Binh_Tay_Market%2C_interior.jpg/1280px-Binh_Tay_Market%2C_interior.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chợ Bình Tây (Chợ Lớn Mới · 1928) (Ảnh 3)",
          "en": "Architecture & atmosphere at Binh Tay Market (Cho Lon Historic Market · 1928) (Photo 3)",
          "fr": "Architecture et ambiance à Marché Binh Tay (Grand Marché de Cho Lon · 1928) (Photo 3)",
          "zh": "平西市场（堤岸新大市场 · 1928年）建筑与实景细节（图 3）",
          "ja": "ビンタイ市場（チョロン大市場・1928年）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cbtay-1",
        "name": "Cơm Gà Đông Nguyên (Chợ Lớn từ 1945)",
        "cuisine": "Cơm gà & Canh tiềm Quảng Đông",
        "specialtyDishes": [
          "Cơm gà luộc da giòn",
          "Canh tiềm thảo mộc",
          "Xá xíu mật ong"
        ],
        "rating": 4.6,
        "reviewCount": 4210,
        "priceRange": "70.000đ – 160.000đ",
        "lat": 10.7532,
        "lng": 106.6634,
        "address": "801 Nguyễn Trãi, Phường 14, Quận 5 (gần Chợ Bình Tây), TP.HCM",
        "openHours": "09:00 – 20:30",
        "imageUrl": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 50
  },
  {
    "id": "bao-tang-y-hoc-co-truyen-fito",
    "city": "Quận 10 · TP.HCM",
    "district": "Quận 10",
    "lat": 10.7745,
    "lng": 106.6743,
    "category": "museum",
    "rating": 4.7,
    "reviewCount": 4180,
    "ticketPrice": "180.000đ (HSSV/Trẻ em 90.000đ)",
    "address": "41 Hoàng Dư Khương, Phường 12, Quận 10, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Hai_Thuong_Lan_Ong_Blvd%2C_Cholon%2C_HCMC.jpg/1280px-Hai_Thuong_Lan_Ong_Blvd%2C_Cholon%2C_HCMC.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Bảo tàng Y học Cổ truyền Việt Nam (FITO Museum)",
        "shortSummary": "Bảo tàng y học cổ truyền đầu tiên tại Việt Nam thiết kế theo phong cách nhà gỗ truyền thống 5 tầng chạm trổ công phu, lưu giữ hơn 3.000 hiện vật dao cầu, thuyền tán, sách thuốc cổ từ thời Đồ đá.",
        "historicalEra": "Khánh thành năm 2007",
        "openingHours": "08:30 – 17:00 Hàng ngày",
        "architecturalHighlights": [
          "Ngôi nhà gỗ 5 tầng gồm 18 phòng trưng bày chạm khắc rồng phượng theo lối cổ truyền Bắc – Trung – Nam",
          "Bộ sưu tập hơn 3.000 cổ vật ngành y: dao cầu, thuyền tán, cối giã thuốc, ấm sắc thuốc và tủ thuốc bắc thế kỷ 19",
          "Trải nghiệm bốc thuốc, giã thảo mộc và thưởng trà dưỡng sinh miễn phí sau tham quan"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Bảo tàng Y học Cổ truyền Việt Nam – FITO Museum tại số 41 Hoàng Dư Khương, Quận 10.",
          "Bước qua cánh cửa gỗ chạm khắc tinh xảo, quý khách sẽ lạc vào không gian 18 phòng trưng bày mùi hương thảo mộc dịu nhẹ, khám phá lịch sử nghìn năm thuốc Nam cùng hai vị đại danh y Tuệ Tĩnh và Hải Thượng Lãn Ông."
        ]
      },
      "en": {
        "name": "FITO Museum (Museum of Traditional Vietnamese Medicine)",
        "shortSummary": "A hidden five-story carved timber house in District 10 displaying over 3,000 antique apothecary tools, herb cutters, medicinal manuscripts, and herbal tea tastings.",
        "historicalEra": "Opened in 2007",
        "openingHours": "08:30 – 17:00 Daily",
        "architecturalHighlights": [
          "Intricately carved traditional Vietnamese wooden house with 18 atmospheric galleries",
          "3,000+ artifacts including stone mortars, bronze herb grinders, and antique pharmacies",
          "Complimentary herbal tea tasting and hands-on herb grinding experience"
        ],
        "audioScript": [
          "Welcome to the FITO Museum of Traditional Vietnamese Medicine in District 10, an exquisite wooden sanctuary preserving over 3,000 historic medical artifacts."
        ]
      },
      "fr": {
        "name": "Musée FITO de la Médecine Traditionnelle Vietnamienne",
        "shortSummary": "Superbe maison traditionnelle en bois sculpté du 10e arrondissement abritant plus de 3 000 objets anciens de pharmacopée vietnamienne.",
        "historicalEra": "2007",
        "openingHours": "08h30 – 17h00",
        "architecturalHighlights": [
          "18 salles en bois précieux aux odeurs d’herbes médicinales",
          "Anciennes pharmacies reconstituées et dégustation de tisane"
        ],
        "audioScript": [
          "Bienvenue au musée FITO, consacré à l’histoire millénaire de la médecine traditionnelle vietnamienne."
        ]
      },
      "zh": {
        "name": "越南传统医学博物馆（FITO博物馆）",
        "shortSummary": "位于第十郡的五层传统雕花木楼博物馆，珍藏三千余件古代药碾、药柜与医书典籍，参观后可免费品尝养生草本茶。",
        "historicalEra": "2007年开馆",
        "openingHours": "08:30 – 17:00",
        "architecturalHighlights": [
          "18间古色古香的传统硬木雕花展室",
          "珍藏逾3,000件传统中药器具与古医籍"
        ],
        "audioScript": [
          "欢迎来到第十郡的越南传统医学博物馆，木香与药香交织的古楼展厅极具文化魅力。"
        ]
      },
      "ja": {
        "name": "ベトナム伝統医学博物館（FITOミュージアム）",
        "shortSummary": "繊細な木彫りが施された5階建ての伝統木造館に3,000点以上の漢方・薬草道具を展示。見学後の薬草茶試飲も人気です。",
        "historicalEra": "2007年開館",
        "openingHours": "08:30 – 17:00",
        "architecturalHighlights": [
          "18室からなる総木造の重厚なベトナム伝統建築",
          "薬研・古い薬箪笥・古医書など3,000点以上のコレクション"
        ],
        "audioScript": [
          "10区の隠れた名所、ベトナム伝統医学博物館（FITO）へようこそ。美しい木造建築と千年の薬草文化を体感できます。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-baotangyhocc-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Hai_Thuong_Lan_Ong_Blvd%2C_Cholon%2C_HCMC.jpg/1280px-Hai_Thuong_Lan_Ong_Blvd%2C_Cholon%2C_HCMC.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Bảo tàng Y học Cổ truyền Việt Nam (FITO Museum) (Wikimedia Commons)",
          "en": "Real view of FITO Museum (Museum of Traditional Vietnamese Medicine) (Wikimedia Commons)",
          "fr": "Vue réelle de Musée FITO de la Médecine Traditionnelle Vietnamienne (Wikimedia Commons)",
          "zh": "越南传统医学博物馆（FITO博物馆）实景照片（维基共享资源）",
          "ja": "ベトナム伝統医学博物館（FITOミュージアム）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangyhocc-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Hai_Thuong_Lan_Ong_Blvd%2C_Cholon%2C_HCMC_%281%29.jpg/1280px-Hai_Thuong_Lan_Ong_Blvd%2C_Cholon%2C_HCMC_%281%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Bảo tàng Y học Cổ truyền Việt Nam (FITO Museum) (Wikimedia Commons)",
          "en": "Real view of FITO Museum (Museum of Traditional Vietnamese Medicine) (Wikimedia Commons)",
          "fr": "Vue réelle de Musée FITO de la Médecine Traditionnelle Vietnamienne (Wikimedia Commons)",
          "zh": "越南传统医学博物馆（FITO博物馆）实景照片（维基共享资源）",
          "ja": "ベトナム伝統医学博物館（FITOミュージアム）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangyhocc-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/Hai_thuong_lang_ong_street-_ph%C6%B0%E1%BB%9Dng_10%2C_Qu%E1%BA%ADn_5%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg/1280px-Hai_thuong_lang_ong_street-_ph%C6%B0%E1%BB%9Dng_10%2C_Qu%E1%BA%ADn_5%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Bảo tàng Y học Cổ truyền Việt Nam (FITO Museum) (Wikimedia Commons)",
          "en": "Real view of FITO Museum (Museum of Traditional Vietnamese Medicine) (Wikimedia Commons)",
          "fr": "Vue réelle de Musée FITO de la Médecine Traditionnelle Vietnamienne (Wikimedia Commons)",
          "zh": "越南传统医学博物馆（FITO博物馆）实景照片（维基共享资源）",
          "ja": "ベトナム伝統医学博物館（FITOミュージアム）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-fito-1",
        "name": "Bún Bò Huế Đông Ba (Khu Sư Vạn Hạnh Q.10)",
        "cuisine": "Đặc sản Huế & Cơm Việt",
        "specialtyDishes": [
          "Bún bò giò gân chả cua",
          "Bánh bèo nậm lọc",
          "Trà sen nhãn nhục"
        ],
        "rating": 4.5,
        "reviewCount": 1680,
        "priceRange": "55.000đ – 95.000đ",
        "lat": 10.7738,
        "lng": 106.6709,
        "address": "Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM",
        "openHours": "07:00 – 21:30",
        "imageUrl": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 60
  },
  {
    "id": "cho-hoa-pho-am-thuc-ho-thi-ky",
    "city": "Quận 10 · TP.HCM",
    "district": "Quận 10",
    "lat": 10.7647,
    "lng": 106.6763,
    "category": "ancient_town",
    "rating": 4.6,
    "reviewCount": 24500,
    "ticketPrice": "Miễn phí tham quan",
    "address": "Đường Hồ Thị Kỷ, Phường 1, Quận 10, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/20180413_190400Saigon_Hotpot_Night_Food_Tour_Ho_Thi_Ky_Flower_Market.jpg/1280px-20180413_190400Saigon_Hotpot_Night_Food_Tour_Ho_Thi_Ky_Flower_Market.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Chợ hoa & Phố ẩm thực Hồ Thị Kỷ (Quận 10)",
        "shortSummary": "Chợ đầu mối hoa tươi lớn nhất TP.HCM hoạt động suốt 24/7 kết hợp thiên đường ẩm thực đường phố hơn 100 món đặc sản Sài Gòn – Campuchia sôi động bậc nhất về đêm.",
        "historicalEra": "Thành lập năm 1987",
        "openingHours": "Chợ hoa 24/7 · Phố ẩm thực 15:00 – 23:00",
        "architecturalHighlights": [
          "Khu chợ hoa tươi rực rỡ nhập trực tiếp từ Đà Lạt và miền Tây – khung hình sáng sớm tuyệt đẹp",
          "Tuyến phố ẩm thực dài gần 500m với bún num bò chóc, chè Campuchia, nem bò nướng sả, hủ tiếu ốc",
          "Không gian giao thoa văn hóa Việt – Khmer thân thiện, giàu sức sống bản địa"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Chợ hoa và Phố ẩm thực Hồ Thị Kỷ tại Quận 10 – nơi hòa quyện hương sắc ngàn hoa Đà Lạt cùng bản giao hưởng ẩm thực đường phố rộn rã nhất Sài Gòn.",
          "Ban ngày quý khách có thể dạo bước chụp ảnh giữa biển hoa tươi bạt ngàn, còn từ 15 giờ chiều trở đi con phố bừng sáng với hơn trăm gian hàng ẩm thực Việt – Campuchia hấp dẫn."
        ]
      },
      "en": {
        "name": "Ho Thi Ky Flower Market & Night Food Street",
        "shortSummary": "Ho Chi Minh City’s largest 24/7 wholesale flower market paired with a vibrant night street-food lane featuring over 100 Saigon and Cambodian specialties.",
        "historicalEra": "Established in 1987",
        "openingHours": "Flower Market 24/7 · Food Street 15:00 – 23:00",
        "architecturalHighlights": [
          "Kaleidoscope of fresh Da Lat blooms bustling from dawn till midnight",
          "Over 100 street-food stalls serving grilled beef lemongrass skewers, Cambodian noodles, and desserts",
          "Authentic local neighborhood energy rarely missed by food lovers"
        ],
        "audioScript": [
          "Welcome to Ho Thi Ky in District 10, Saigon’s famous 24-hour flower market and bustling evening street-food paradise."
        ]
      },
      "fr": {
        "name": "Marché aux Fleurs & Rue Gastronomique Ho Thi Ky",
        "shortSummary": "Plus grand marché aux fleurs de Hô Chi Minh-Ville doublé chaque soir d’une rue gourmande de spécialités saïgonnaises et cambodgiennes.",
        "historicalEra": "1987",
        "openingHours": "24h/24 (Street-food 15h00 – 23h00)",
        "architecturalHighlights": [
          "Allées parfumées de fleurs fraîches de Da Lat",
          "Plus de 100 stands de street-food animés dès la fin d’après-midi"
        ],
        "audioScript": [
          "Bienvenue au marché aux fleurs et à la rue gastronomique Ho Thi Ky, un concentré de couleurs et de saveurs locales."
        ]
      },
      "zh": {
        "name": "胡氏纪鲜花市场与夜市美食街",
        "shortSummary": "胡志明市规模最大的24小时鲜花批发市场，傍晚则变身汇聚百余种越柬地道小吃的超人气街头美食天堂。",
        "historicalEra": "始建于1987年",
        "openingHours": "花市全天 · 美食街 15:00 – 23:00",
        "architecturalHighlights": [
          "大叻鲜花铺满巷弄的缤纷摄影场景",
          "香茅烤牛肉、柬埔寨米粉与百款平价夜市小吃"
        ],
        "audioScript": [
          "欢迎来到第十郡胡氏纪花市与美食街，白天赏花拍照、夜晚大啖西贡街头美味。"
        ]
      },
      "ja": {
        "name": "ホー・ティ・キー花市場＆屋台グルメ通り",
        "shortSummary": "24時間活気あふれる市内最大の花市場と、夕方から100軒以上のローカル・カンボジア屋台が並ぶ絶品食べ歩きストリート。",
        "historicalEra": "1987年開設",
        "openingHours": "花市場 24時間・グルメ通り 15:00 – 23:00",
        "architecturalHighlights": [
          "ダラット直送の生花が彩るカラフルな路地",
          "レモングラス牛肉串やカンボジア風チェーなど屋台グルメの宝庫"
        ],
        "audioScript": [
          "色とりどりの花市場と絶品ナイトフードが同時に楽しめる10区のホー・ティ・キー通りへようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-chohoaphoamt-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/20180413_190400Saigon_Hotpot_Night_Food_Tour_Ho_Thi_Ky_Flower_Market.jpg/1280px-20180413_190400Saigon_Hotpot_Night_Food_Tour_Ho_Thi_Ky_Flower_Market.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Chợ hoa & Phố ẩm thực Hồ Thị Kỷ (Quận 10) (Wikimedia Commons)",
          "en": "Real view of Ho Thi Ky Flower Market & Night Food Street (Wikimedia Commons)",
          "fr": "Vue réelle de Marché aux Fleurs & Rue Gastronomique Ho Thi Ky (Wikimedia Commons)",
          "zh": "胡氏纪鲜花市场与夜市美食街实景照片（维基共享资源）",
          "ja": "ホー・ティ・キー花市場＆屋台グルメ通りの実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chohoaphoamt-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/20180413_201709Saigon_Hotpot_Night_Food_Tour_Ho_Thi_Ky_Flower_Market_Thanh_H%E1%BA%B1ng_L%C3%BD_Th%C3%A1i_Minh_Hi%E1%BA%BFu_Kim_Euncheol_Lee_Junho_Choi_Kwangmo.jpg/1280px-20180413_201709Saigon_Hotpot_Night_Food_Tour_Ho_Thi_Ky_Flower_Market_Thanh_H%E1%BA%B1ng_L%C3%BD_Th%C3%A1i_Minh_Hi%E1%BA%BFu_Kim_Euncheol_Lee_Junho_Choi_Kwangmo.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chợ hoa & Phố ẩm thực Hồ Thị Kỷ (Quận 10) (Ảnh 2)",
          "en": "Architecture & atmosphere at Ho Thi Ky Flower Market & Night Food Street (Photo 2)",
          "fr": "Architecture et ambiance à Marché aux Fleurs & Rue Gastronomique Ho Thi Ky (Photo 2)",
          "zh": "胡氏纪鲜花市场与夜市美食街建筑与实景细节（图 2）",
          "ja": "ホー・ティ・キー花市場＆屋台グルメ通りの建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chohoaphoamt-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/07/20180413_204934Saigon_Hotpot_Night_Food_Tour_Ho_Thi_Ky_Flower_Market_Thanh_H%E1%BA%B1ng_L%C3%BD_Th%C3%A1i_Minh_Hi%E1%BA%BFu_Kim_Euncheol_Lee_Junho_Choi_Kwangmo.jpg/1280px-20180413_204934Saigon_Hotpot_Night_Food_Tour_Ho_Thi_Ky_Flower_Market_Thanh_H%E1%BA%B1ng_L%C3%BD_Th%C3%A1i_Minh_Hi%E1%BA%BFu_Kim_Euncheol_Lee_Junho_Choi_Kwangmo.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chợ hoa & Phố ẩm thực Hồ Thị Kỷ (Quận 10) (Ảnh 3)",
          "en": "Architecture & atmosphere at Ho Thi Ky Flower Market & Night Food Street (Photo 3)",
          "fr": "Architecture et ambiance à Marché aux Fleurs & Rue Gastronomique Ho Thi Ky (Photo 3)",
          "zh": "胡氏纪鲜花市场与夜市美食街建筑与实景细节（图 3）",
          "ja": "ホー・ティ・キー花市場＆屋台グルメ通りの建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-htk-1",
        "name": "Chè Campuchia Cô Huôi & Bún Num Bò Chóc Tư Xê",
        "cuisine": "Đặc sản Campuchia – Sài Gòn",
        "specialtyDishes": [
          "Chè bí đỏ trứng sữa",
          "Chè thốt nốt sầu riêng",
          "Bún num bò chóc"
        ],
        "rating": 4.7,
        "reviewCount": 3420,
        "priceRange": "25.000đ – 65.000đ",
        "lat": 10.7646,
        "lng": 106.6761,
        "address": "57/21A Hồ Thị Kỷ, Phường 1, Quận 10, TP.HCM",
        "openHours": "07:00 – 22:00",
        "imageUrl": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80",
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
    "id": "pho-di-bo-bui-vien",
    "city": "Quận 1 · TP.HCM",
    "district": "Quận 1",
    "lat": 10.7675,
    "lng": 106.6938,
    "category": "ancient_town",
    "rating": 4.4,
    "reviewCount": 41200,
    "ticketPrice": "Miễn phí tham quan",
    "address": "Đường Bùi Viện – Đề Thám, Phường Phạm Ngũ Lão, Quận 1, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Bui_Vien_Walking_Street_1.jpg/1280px-Bui_Vien_Walking_Street_1.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Phố đi bộ Bùi Viện (Phố Tây Sài Gòn)",
        "shortSummary": "Con phố không ngủ náo nhiệt bậc nhất TP.HCM dành cho du khách quốc tế và giới trẻ, bừng sáng ánh đèn neon, nhạc sống, ẩm thực đêm và bia thủ công.",
        "historicalEra": "Phố đi bộ chính thức từ năm 2017",
        "openingHours": "Sôi động nhất 19:00 – 02:00 (Phố đi bộ tối T7–CN)",
        "architecturalHighlights": [
          "Không khí lễ hội đường phố rực rỡ ánh đèn neon dài gần 850m giữa khu Phạm Ngũ Lão",
          "Hàng trăm quán ăn đêm, bia Sài Gòn, nhạc acoustic và nghệ sĩ đường phố giao lưu văn hóa quốc tế",
          "Điểm dừng chân lý tưởng khép lại một ngày khám phá di sản Quận 1"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Phố đi bộ Bùi Viện – khu Phố Tây nổi tiếng nhất của Thành phố Hồ Chí Minh, nơi ánh đèn và âm nhạc không bao giờ tắt về đêm.",
          "Từ những quán ăn vỉa hè dân dã đến các không gian nhạc sống sôi động, Bùi Viện mang đến góc nhìn tràn đầy năng lượng về nhịp sống đêm Sài Gòn.",
          "Theo tư liệu bách khoa Wikipedia: Đường Bùi Viện là một tuyến đường tại phường Bến Thành, Thành phố Hồ Chí Minh. Đây là tuyến đường vui chơi về đêm nổi tiếng của thành phố với nhiều quán bar và quán bia nhỏ lề đường, chuyên kinh doanh các mặt hàng, dịch vụ du lịch giá rẻ. Đường Bùi Viện bắt đầu từ đường Trần Hưng Đạo, cạnh ngã tư Trần Hưng Đạo – Nguyễn Thái Học, giao cắt với các con đường Đề Thám, Đỗ Quang Đẩu và kết thúc tại đường Cống Quỳnh. Khu vực các tuyến đường Bùi Viện, Đề Thám, Phạm Ngũ Lão và Đỗ Quang Đẩu còn được biết đến với tên gọi là Phố Tây ba lô."
        ]
      },
      "en": {
        "name": "Bui Vien Walking Street (Saigon Backpacker Street)",
        "shortSummary": "Ho Chi Minh City’s famous neon-lit nightlife promenade packed with street food, live music, craft beer, and international travelers.",
        "historicalEra": "Pedestrian street since 2017",
        "openingHours": "Liveliest 19:00 – 02:00",
        "architecturalHighlights": [
          "850-meter neon-glowing entertainment corridor in Pham Ngu Lao quarter",
          "Sidewalk dining, live bands, and energetic Saigon night photography",
          "Walking distance from Ben Thanh Market and 23/9 Park"
        ],
        "audioScript": [
          "Welcome to Bui Vien Walking Street, the vibrant nightlife hub of District 1 filled with neon lights, street performers, and late-night flavors."
        ]
      },
      "fr": {
        "name": "Rue piétonne Bui Vien (Quartier nocturne)",
        "shortSummary": "Artère nocturne la plus animée de Hô Chi Minh-Ville, illuminée de néons, de concerts en direct et de terrasses conviviales.",
        "historicalEra": "Rue piétonne depuis 2017",
        "openingHours": "19h00 – 02h00",
        "architecturalHighlights": [
          "850 mètres de néons, musique live et cuisine de rue nocturne",
          "Rendez-vous cosmopolite des voyageurs du monde entier"
        ],
        "audioScript": [
          "Bienvenue dans la rue Bui Vien, cœur vibrant de la vie nocturne saïgonnaise."
        ]
      },
      "zh": {
        "name": "范五老街 · 裴援步行街（西贡不夜街）",
        "shortSummary": "胡志明市最具活力的霓虹夜生活步行街，汇集全球背包客、现场音乐、精酿啤酒与地道宵夜美食。",
        "historicalEra": "2017年设为步行街",
        "openingHours": "19:00 – 02:00最热闹",
        "architecturalHighlights": [
          "长约850米的赛博霓虹夜市街道与街头表演",
          "体验胡志明市“不夜城”活力的代表地标"
        ],
        "audioScript": [
          "欢迎来到第一郡裴援步行街，霓虹闪烁的街景与热闹音乐展现胡志明市的无限活力。"
        ]
      },
      "ja": {
        "name": "ブイビエン歩行者天国（バックパッカー通り）",
        "shortSummary": "ネオンが輝くホーチミン市最大のナイトライフ通り。ライブ音楽、屋台グルメ、世界各国の旅人が交わる眠らない街です。",
        "historicalEra": "2017年歩行者天国化",
        "openingHours": "19:00 – 02:00がピーク",
        "architecturalHighlights": [
          "全長850mにわたるネオンサインと路上パフォーマンス",
          "ベンタイン市場からも徒歩圏内の活気ある夜の繁華街"
        ],
        "audioScript": [
          "ネオンと音楽が弾けるホーチミン市最大のナイトスポット、ブイビエン通りへようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-phodibobuivi-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Bui_Vien_Walking_Street_1.jpg/1280px-Bui_Vien_Walking_Street_1.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Phố đi bộ Bùi Viện (Phố Tây Sài Gòn) (Wikimedia Commons)",
          "en": "Real view of Bui Vien Walking Street (Saigon Backpacker Street) (Wikimedia Commons)",
          "fr": "Vue réelle de Rue piétonne Bui Vien (Quartier nocturne) (Wikimedia Commons)",
          "zh": "范五老街 · 裴援步行街（西贡不夜街）实景照片（维基共享资源）",
          "ja": "ブイビエン歩行者天国（バックパッカー通り）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-phodibobuivi-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/20190923_Independence_Palace-13.jpg/1280px-20190923_Independence_Palace-13.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Phố đi bộ Bùi Viện (Phố Tây Sài Gòn) (Ảnh 2)",
          "en": "Architecture & atmosphere at Bui Vien Walking Street (Saigon Backpacker Street) (Photo 2)",
          "fr": "Architecture et ambiance à Rue piétonne Bui Vien (Quartier nocturne) (Photo 2)",
          "zh": "范五老街 · 裴援步行街（西贡不夜街）建筑与实景细节（图 2）",
          "ja": "ブイビエン歩行者天国（バックパッカー通り）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-phodibobuivi-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/91/Ben_Thanh_market_2.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Phố đi bộ Bùi Viện (Phố Tây Sài Gòn) (Ảnh 3)",
          "en": "Architecture & atmosphere at Bui Vien Walking Street (Saigon Backpacker Street) (Photo 3)",
          "fr": "Architecture et ambiance à Rue piétonne Bui Vien (Quartier nocturne) (Photo 3)",
          "zh": "范五老街 · 裴援步行街（西贡不夜街）建筑与实景细节（图 3）",
          "ja": "ブイビエン歩行者天国（バックパッカー通り）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-bv-1",
        "name": "Bún Chả 145 Bùi Viện",
        "cuisine": "Bún chả & Ẩm thực Việt Nam",
        "specialtyDishes": [
          "Bún chả nướng than hoa",
          "Nem cua bể giòn",
          "Trà tắc mật ong"
        ],
        "rating": 4.7,
        "reviewCount": 4680,
        "priceRange": "55.000đ – 95.000đ",
        "lat": 10.7673,
        "lng": 106.6934,
        "address": "145 Bùi Viện, Phường Phạm Ngũ Lão, Quận 1, TP.HCM",
        "openHours": "11:30 – 21:30",
        "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 50
  },
  {
    "id": "cong-vien-bo-song-sai-gon-thu-thiem",
    "city": "TP. Thủ Đức · TP.HCM",
    "district": "TP. Thủ Đức",
    "lat": 10.7749,
    "lng": 106.7128,
    "category": "monument",
    "rating": 4.8,
    "reviewCount": 12900,
    "ticketPrice": "Miễn phí tham quan",
    "address": "Công viên Bờ sông Sài Gòn (Đầu hầm Thủ Thiêm – Cầu Ba Son), TP. Thủ Đức",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/C%E1%BA%A7u_Ba_Son%2C_TP.HCM%2C_042022.jpg/1280px-C%E1%BA%A7u_Ba_Son%2C_TP.HCM%2C_042022.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Công viên Bờ sông Sài Gòn (Thủ Thiêm)",
        "shortSummary": "Tọa độ check-in ven sông mới nổi cực kỳ thu hút bên bờ Đông sông Sài Gòn, sở hữu cánh đồng hoa theo mùa, cầu đi bộ ven sông và góc ngắm đường chân trời Quận 1 – Bitexco triệu đô.",
        "historicalEra": "Khánh thành cuối năm 2023",
        "openingHours": "Mở cửa 24/7 (Đẹp nhất 16:30 – 21:30)",
        "architecturalHighlights": [
          "Góc chụp ảnh toàn cảnh đường chân trời Quận 1, Tháp Bitexco và Cầu Ba Son đẹp nhất TP.HCM",
          "Cánh đồng hoa hướng dương & hoa theo mùa rực rỡ, khu nhà cổ Đình An Khánh và sân khấu sự kiện ven sông",
          "Kết nối trực tiếp tuyến buýt sông Saigon Waterbus và chỉ cách Quận 1 vài phút qua Cầu Ba Son"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Công viên Bờ sông Sài Gòn phía Thủ Thiêm, Thành phố Thủ Đức – không gian công cộng xanh mát và là tọa độ ngắm hoàng hôn được yêu thích bậc nhất hiện nay.",
          "Từ bãi cỏ ven sông và cánh đồng hoa rực rỡ, quý khách có thể ghi lại bức ảnh lưu niệm ôm trọn toàn cảnh Quận 1 và Cầu dây văng Ba Son lung linh phản chiếu trên mặt nước.",
          "Theo tư liệu bách khoa Wikipedia: Thủ Thiêm là một địa danh tại Thành phố Hồ Chí Minh, Việt Nam, nằm ven bờ sông Sài Gòn, đối diện với phường Sài Gòn. Khu vực Thủ Thiêm nằm trọn trong địa phận của phường An Khánh ngày nay và là trung tâm của khu đô thị mới Thủ Thiêm. Trước ngày 1 tháng 7 năm 2025, Thủ Thiêm là một phường thuộc thành phố Thủ Đức. Phường có diện tích 3,31 km², dân số năm 2021 là 2.176 người, mật độ dân số đạt 657 người/km²."
        ]
      },
      "en": {
        "name": "Saigon Riverside Park (Thu Thiem)",
        "shortSummary": "Ho Chi Minh City’s newest waterfront park on the eastern bank of the Saigon River, famous for seasonal flower fields and unobstructed golden-hour views of the District 1 skyline.",
        "historicalEra": "Opened late 2023",
        "openingHours": "Open 24/7 (Best 16:30 – 21:30)",
        "architecturalHighlights": [
          "Best panoramic skyline vantage point facing Bitexco Tower, District 1, and Ba Son Bridge",
          "Seasonal sunflower gardens, riverside boardwalk, and open-air cultural plazas",
          "Easy access via Ba Son Bridge or Saigon Waterbus from Bach Dang Wharf"
        ],
        "audioScript": [
          "Welcome to Saigon Riverside Park in Thu Thiem, offering seasonal flower gardens and the city’s most celebrated panoramic view across the river to District 1.",
          "Historical context from Wikipedia: Thủ Thiêm New Urban Area (Vietnamese: Khu đô thị mới Thủ Thiêm) is an 6.57 km2 (1,620-acre) ongoing urban redevelopment project and a planned community locates in the former District 2 and subsequently Thủ Đức City, now An Khánh ward of Ho Chi Minh City. It is currently under development. As of 2026, the area has been chosen to be the new seat of government for the expanded Ho Chi Minh City."
        ]
      },
      "fr": {
        "name": "Parc des Berges de Saïgon (Thu Thiem)",
        "shortSummary": "Nouveau parc fluvial sur la rive est offrant champs de fleurs saisonniers et panorama spectaculaire sur la skyline du 1er arrondissement.",
        "historicalEra": "Inauguré fin 2023",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "Vue panoramique imprenable sur la tour Bitexco et le pont Ba Son",
          "Jardins de tournesols saisonniers et promenade fluviale au coucher du soleil"
        ],
        "audioScript": [
          "Bienvenue au parc des Berges de Saïgon à Thu Thiem, lieu privilégié pour admirer le coucher de soleil sur la ville."
        ]
      },
      "zh": {
        "name": "西贡河畔公园（守添东岸）",
        "shortSummary": "胡志明市最新爆火的滨水公园，拥有季节性向日葵花海与隔江遥望第一郡金融塔、巴松大桥的绝佳日落机位。",
        "historicalEra": "2023年底开放",
        "openingHours": "全天开放（16:30 – 21:30最佳）",
        "architecturalHighlights": [
          "拍摄第一郡摩天楼群与西贡河倒影的“百万级”全景机位",
          "四季花海、滨水步道与水上巴士码头"
        ],
        "audioScript": [
          "欢迎来到守德市守添西贡河畔公园，傍晚在此拍摄对岸第一郡天际线与日落美不胜收。"
        ]
      },
      "ja": {
        "name": "サイゴン川リバーサイドパーク（トゥーティエム）",
        "shortSummary": "サイゴン川東岸に誕生した最新フォトスポット。季節のひまわり畑越しに1区の高層ビル群とバーソン橋の夕景を一望できます。",
        "historicalEra": "2023年末オープン",
        "openingHours": "24時間開放（16:30 – 21:30がおすすめ）",
        "architecturalHighlights": [
          "ビテクスコタワーと1区スカイラインを望む絶景リバーフロント",
          "季節の花畑と水上バス直結の開放的な公園"
        ],
        "audioScript": [
          "1区の絶景スカイラインと夕焼けを楽しめるトゥーティエムのサイゴン川リバーサイドパークへようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-congvienboso-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/C%E1%BA%A7u_Ba_Son%2C_TP.HCM%2C_042022.jpg/1280px-C%E1%BA%A7u_Ba_Son%2C_TP.HCM%2C_042022.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Công viên Bờ sông Sài Gòn (Thủ Thiêm) (Wikimedia Commons)",
          "en": "Real view of Saigon Riverside Park (Thu Thiem) (Wikimedia Commons)",
          "fr": "Vue réelle de Parc des Berges de Saïgon (Thu Thiem) (Wikimedia Commons)",
          "zh": "西贡河畔公园（守添东岸）实景照片（维基共享资源）",
          "ja": "サイゴン川リバーサイドパーク（トゥーティエム）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-congvienboso-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Thu_Thiem_2_Bridge_construction.png/1280px-Thu_Thiem_2_Bridge_construction.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Công viên Bờ sông Sài Gòn (Thủ Thiêm) (Wikimedia Commons)",
          "en": "Real view of Saigon Riverside Park (Thu Thiem) (Wikimedia Commons)",
          "fr": "Vue réelle de Parc des Berges de Saïgon (Thu Thiem) (Wikimedia Commons)",
          "zh": "西贡河畔公园（守添东岸）实景照片（维基共享资源）",
          "ja": "サイゴン川リバーサイドパーク（トゥーティエム）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-congvienboso-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Ba-Son-bridge-HCMC.jpg/1280px-Ba-Son-bridge-HCMC.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Công viên Bờ sông Sài Gòn (Thủ Thiêm) (Wikimedia Commons)",
          "en": "Real view of Saigon Riverside Park (Thu Thiem) (Wikimedia Commons)",
          "fr": "Vue réelle de Parc des Berges de Saïgon (Thu Thiem) (Wikimedia Commons)",
          "zh": "西贡河畔公园（守添东岸）实景照片（维基共享资源）",
          "ja": "サイゴン川リバーサイドパーク（トゥーティエム）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cvbs-1",
        "name": "Katinat & Cà Phê Ven Sông Công viên Thủ Thiêm",
        "cuisine": "Cà phê View Sông & Đồ ăn nhẹ",
        "specialtyDishes": [
          "Cà phê sữa đá",
          "Trà ô long sữa nướng",
          "Bánh ngọt thủ công"
        ],
        "rating": 4.6,
        "reviewCount": 2150,
        "priceRange": "45.000đ – 85.000đ",
        "lat": 10.7745,
        "lng": 106.7123,
        "address": "Công viên Bờ sông Sài Gòn, Phường Thủ Thiêm, TP. Thủ Đức",
        "openHours": "07:00 – 22:30",
        "imageUrl": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 40
  },
  {
    "id": "chua-buu-long-thu-duc",
    "city": "TP. Thủ Đức · TP.HCM",
    "district": "TP. Thủ Đức",
    "lat": 10.8738,
    "lng": 106.8364,
    "category": "temple",
    "rating": 4.9,
    "reviewCount": 15600,
    "ticketPrice": "Miễn phí tham quan",
    "address": "81 Nguyễn Xiển, Phường Long Bình, TP. Thủ Đức, TP.HCM",
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/e/ef/Th%C3%A1p_ch%C3%ADnh_ch%C3%B9a_B%E1%BB%ADu_Long.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
    "translations": {
      "vi": {
        "name": "Chùa Bửu Long (Thiền viện Tổ đình Bửu Long)",
        "shortSummary": "Ngôi chùa Phật giáo Nguyên thủy nổi tiếng toàn cầu với Bảo tháp Gotama Cetiya trắng – vàng lộng lẫy soi bóng bên hồ nước xanh, từng được National Geographic vinh danh Top chùa đẹp nhất thế giới.",
        "historicalEra": "Khởi dựng 1942 – Bảo tháp 2007–2013",
        "openingHours": "08:00 – 18:00 Hàng ngày",
        "architecturalHighlights": [
          "Bảo tháp Gotama Cetiya cao 56m phủ sắc trắng thanh khiết và chóp nhọn mạ vàng rực rỡ",
          "Hồ bán nguyệt màu xanh ngọc trước tháp tạo hiệu ứng soi bóng tuyệt mỹ",
          "Kết hợp tinh hoa kiến trúc Phật giáo Ấn Độ – Thái Lan cùng họa tiết rồng thời Nguyễn bên bờ sông Đồng Nai"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Thiền viện Tổ đình Bửu Long tại phường Long Bình, Thành phố Thủ Đức – một trong những ngôi chùa có kiến trúc Phật giáo đẹp nhất thế giới theo bình chọn của National Geographic.",
          "Nổi bật giữa khuôn viên rừng cây thanh tịnh rộng 11 hecta bên sông Đồng Nai là Bảo tháp Gotama Cetiya cao 56 mét với chóp vàng óng ánh soi bóng xuống hồ nước xanh ngọc, mang lại khung hình lưu niệm tựa chốn bồng lai.",
          "Theo tư liệu bách khoa Wikipedia: Chùa Bửu Long, tên chính thức là Thiền viện Tổ đình Bửu Long, là một ngôi chùa tọa lạc trên một ngọn đồi bên sông Đồng Nai tại địa chỉ số 81 đường Nguyễn Xiển, phường Long Bình, Thành phố Hồ Chí Minh. Chùa thuộc hệ phái Phật giáo nguyên thủy Nam tông, do cư sĩ Võ Hà Thuật thành lập năm 1942. Đến năm 2007, chùa được đầu tư xây dựng và trùng tu. Chùa Bửu Long mang nét kiến trúc các chùa ở Thái Lan, Ấn Độ kết hợp cùng nét kiến trúc các chùa thời Nguyễn."
        ]
      },
      "en": {
        "name": "Buu Long Pagoda (Gotama Cetiya Stupa · Thu Duc)",
        "shortSummary": "A serene Theravada Buddhist monastery celebrated by National Geographic for its gleaming white-and-gold 56-meter Gotama Cetiya stupa reflected in a turquoise pool.",
        "historicalEra": "Founded 1942 – Stupa 2013",
        "openingHours": "08:00 – 18:00 Daily",
        "architecturalHighlights": [
          "56-meter white-and-gold Gotama Cetiya stupa with Thai, Indian, and Nguyen Dynasty accents",
          "Mirror-like turquoise crescent pond creating extraordinary photo reflections",
          "Tranquil 11-hectare wooded hillside overlooking the Dong Nai River"
        ],
        "audioScript": [
          "Welcome to Buu Long Pagoda in Thu Duc City, renowned worldwide for its dazzling white-and-gold Gotama Cetiya stupa reflected across a turquoise pool."
        ]
      },
      "fr": {
        "name": "Pagode Buu Long (Stupa Gotama Cetiya · Thu Duc)",
        "shortSummary": "Monastère bouddhique theravada célèbre pour son stupa blanc et or de 56 mètres se reflétant dans un bassin turquoise, classé parmi les plus beaux temples du monde.",
        "historicalEra": "1942 – 2013",
        "openingHours": "08h00 – 18h00",
        "architecturalHighlights": [
          "Stupa Gotama Cetiya blanc et doré de 56 mètres",
          "Bassin turquoise miroir dans un parc boisé de 11 hectares"
        ],
        "audioScript": [
          "Bienvenue à la pagode Buu Long, joyau d’architecture bouddhique aux reflets d’or dans la ville de Thu Duc."
        ]
      },
      "zh": {
        "name": "宝龙寺（守德市金色佛塔）",
        "shortSummary": "曾入选《国家地理》全球最美佛寺榜单的南传佛教名刹，56米高白底金顶舍利塔倒映碧水池中，宛若仙境。",
        "historicalEra": "1942年建寺 – 2013年大塔落成",
        "openingHours": "08:00 – 18:00",
        "architecturalHighlights": [
          "融合印泰与阮朝美学的高56米白金舍利宝塔",
          "碧蓝半月池倒影与11公顷静谧山林"
        ],
        "audioScript": [
          "欢迎来到守德市宝龙寺，纯白与鎏金交辉的舍利宝塔倒映碧池，是胡志明市最梦幻的摄影圣地之一。"
        ]
      },
      "ja": {
        "name": "ブーロン寺（黄金仏塔・トゥードゥック市）",
        "shortSummary": "ナショナルジオグラフィック誌でも称賛された上座部仏教の美しい寺院。高さ56mの白と黄金の仏塔が青い池に映る絶景が人気です。",
        "historicalEra": "1942年創建 – 2013年仏塔完成",
        "openingHours": "08:00 – 18:00",
        "architecturalHighlights": [
          "タイ・インド・阮朝様式が融合した高さ56mの黄金ストゥーパ",
          "ターコイズブルーの池に映る幻想的なリフレクション"
        ],
        "audioScript": [
          "白と黄金の仏塔が美しいトゥードゥック市の名刹、ブーロン寺へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-chuabuulongt-1",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/ef/Th%C3%A1p_ch%C3%ADnh_ch%C3%B9a_B%E1%BB%ADu_Long.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Chùa Bửu Long (Thiền viện Tổ đình Bửu Long) (Wikimedia Commons)",
          "en": "Real view of Buu Long Pagoda (Gotama Cetiya Stupa · Thu Duc) (Wikimedia Commons)",
          "fr": "Vue réelle de Pagode Buu Long (Stupa Gotama Cetiya · Thu Duc) (Wikimedia Commons)",
          "zh": "宝龙寺（守德市金色佛塔）实景照片（维基共享资源）",
          "ja": "ブーロン寺（黄金仏塔・トゥードゥック市）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chuabuulongt-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Hoa_Y%C3%AAn.JPG/1280px-Hoa_Y%C3%AAn.JPG?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chùa Bửu Long (Thiền viện Tổ đình Bửu Long) (Ảnh 2)",
          "en": "Architecture & atmosphere at Buu Long Pagoda (Gotama Cetiya Stupa · Thu Duc) (Photo 2)",
          "fr": "Architecture et ambiance à Pagode Buu Long (Stupa Gotama Cetiya · Thu Duc) (Photo 2)",
          "zh": "宝龙寺（守德市金色佛塔）建筑与实景细节（图 2）",
          "ja": "ブーロン寺（黄金仏塔・トゥードゥック市）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-chuabuulongt-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/ef/Th%C3%A1p_ch%C3%ADnh_ch%C3%B9a_B%E1%BB%ADu_Long.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Chùa Bửu Long (Thiền viện Tổ đình Bửu Long) (Ảnh 3)",
          "en": "Architecture & atmosphere at Buu Long Pagoda (Gotama Cetiya Stupa · Thu Duc) (Photo 3)",
          "fr": "Architecture et ambiance à Pagode Buu Long (Stupa Gotama Cetiya · Thu Duc) (Photo 3)",
          "zh": "宝龙寺（守德市金色佛塔）建筑与实景细节（图 3）",
          "ja": "ブーロン寺（黄金仏塔・トゥードゥック市）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-cbl-1",
        "name": "Quán Chay Bửu Long & Ẩm thực Sông Đồng Nai",
        "cuisine": "Ẩm thực Chay & Đặc sản Long Bình",
        "specialtyDishes": [
          "Cơm chay thập cẩm",
          "Bún riêu chay nấm mối",
          "Nước mía sầu riêng"
        ],
        "rating": 4.6,
        "reviewCount": 1240,
        "priceRange": "35.000đ – 90.000đ",
        "lat": 10.8725,
        "lng": 106.8351,
        "address": "Nguyễn Xiển, Phường Long Bình, TP. Thủ Đức, TP.HCM",
        "openHours": "07:00 – 18:30",
        "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "breakfast",
          "lunch",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 75
  },
  {
    "id": "bao-tang-ao-dai-thu-duc",
    "city": "TP. Thủ Đức · TP.HCM",
    "district": "TP. Thủ Đức",
    "lat": 10.8062,
    "lng": 106.8431,
    "category": "museum",
    "rating": 4.7,
    "reviewCount": 5340,
    "ticketPrice": "50.000đ (HSSV 30.000đ)",
    "address": "206/19/30 Long Thuận, Phường Long Phước, TP. Thủ Đức, TP.HCM",
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/1/1a/%C3%81o_d%C3%A0i_hoa_ph%C6%B0%E1%BB%A3ng_-_Ph%C3%A1t_Tr%C6%B0%C6%A1ng_-_51231007393_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
    "translations": {
      "vi": {
        "name": "Bảo tàng Áo Dài Việt Nam (TP. Thủ Đức)",
        "shortSummary": "Không gian văn hóa miệt vườn thanh bình rộng gần 2 hecta do nhà thiết kế Sĩ Hoàng sáng lập, tôn vinh hành trình 300 năm của tà Áo dài Việt Nam giữa nhà rường cổ, ao sen và cầu gỗ.",
        "historicalEra": "Khánh thành năm 2014 (NTK Sĩ Hoàng)",
        "openingHours": "08:30 – 17:30 Hàng ngày",
        "architecturalHighlights": [
          "Khu nhà rường gỗ Quảng Nam cổ kính bên hồ sen, cầu tre và vườn cây ăn trái cực kỳ thơ mộng",
          "Hơn 300 bộ áo dài từ thế kỷ 17 đến hiện đại và kỷ vật của các nữ chính khách, nghệ sĩ nổi tiếng",
          "Dịch vụ cho thuê áo dài truyền thống để du khách chụp ảnh lưu niệm ngay trong khuôn viên cổ"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Bảo tàng Áo Dài Việt Nam tại phường Long Phước, Thành phố Thủ Đức – một ốc đảo văn hóa thanh bình với nhà rường gỗ cổ và hồ sen ngát hương.",
          "Tại đây, quý khách sẽ khám phá hành trình tiến hóa hơn 300 năm của chiếc áo dài Việt Nam từ áo giao lĩnh, ngũ thân đến áo dài tân thời, đồng thời có thể khoác lên mình tà áo dài để lưu lại những khuôn hình đậm hồn dân tộc.",
          "Theo tư liệu bách khoa Wikipedia: Áo dài là một trang phục Việt Nam chủ yếu dành cho nữ giới, xuất hiện từ những năm 1930 do Le Mur Cát Tường cách tân theo hướng Tây hóa từ Áo ngũ thân. Đặc điểm của trang phục này là kiểu áo tay chẽn, dáng áo bó, hai tà thẳng trước sau và hai bên. Các nhà thiết kế không áp dụng hoa văn truyền thống, phụ kiện trang sức truyền thống lên áo dài."
        ]
      },
      "en": {
        "name": "Ao Dai Museum (Vietnamese National Dress Museum)",
        "shortSummary": "A poetic lakeside cultural estate in Thu Duc City founded by designer Si Hoang, celebrating 300 years of Vietnam’s iconic Ao Dai amidst lotus ponds and antique timber pavilions.",
        "historicalEra": "Opened in 2014",
        "openingHours": "08:30 – 17:30 Daily",
        "architecturalHighlights": [
          "Traditional timber houses set amid lotus lakes, wooden bridges, and lush gardens",
          "300+ historical and contemporary Ao Dai gowns documenting 3 centuries of Vietnamese fashion",
          "On-site Ao Dai rental for memorable heritage photoshoots"
        ],
        "audioScript": [
          "Welcome to the Ao Dai Museum in Thu Duc City, a tranquil garden sanctuary showcasing three centuries of Vietnam’s iconic national dress.",
          "Historical context from Wikipedia: Áo dài (English: ; Vietnamese: [ʔaːw˧˦ zaːj˨˩] (North), [ʔaːw˦˥ jaːj˨˩] (South), lit. “long tunic”) is a traditional Vietnamese outfit consisting of a long split tunic worn over silk trousers. It has many variations, and can serve as formalwear for both men and women."
        ]
      },
      "fr": {
        "name": "Musée de l’Ao Dai (Thu Duc)",
        "shortSummary": "Domaine bucolique d’étangs de lotus et de maisons anciennes en bois dédié aux 300 ans d’histoire du costume traditionnel Ao Dai.",
        "historicalEra": "2014",
        "openingHours": "08h30 – 17h30",
        "architecturalHighlights": [
          "Maisons traditionnelles en bois, ponts champêtres et bassins de lotus",
          "Plus de 300 modèles d’Ao Dai et location de tenues pour séances photo"
        ],
        "audioScript": [
          "Bienvenue au musée de l’Ao Dai, écrin de verdure dédié à l’élégance du costume traditionnel vietnamien."
        ]
      },
      "zh": {
        "name": "越南奥黛博物馆（守德市）",
        "shortSummary": "由著名设计师士皇创立的园林式博物馆，古木屋、莲花池与木桥相映，展示三百年越南国服奥黛演变史并提供奥黛换装拍照。",
        "historicalEra": "2014年开馆",
        "openingHours": "08:30 – 17:30",
        "architecturalHighlights": [
          "江南水乡般诗意的莲池、古木屋与竹桥园林",
          "逾300套历代奥黛珍品，支持现场租借奥黛留影"
        ],
        "audioScript": [
          "欢迎来到守德市的越南奥黛博物馆，您既能了解三百年奥黛文化，也能身着奥黛在莲池古宅留影。"
        ]
      },
      "ja": {
        "name": "アオザイ博物館（トゥードゥック市）",
        "shortSummary": "蓮池と古民家が広がる詩情豊かな庭園博物館。300年にわたるベトナム民族衣装アオザイの変遷を展示し、試着撮影も楽しめます。",
        "historicalEra": "2014年開館",
        "openingHours": "08:30 – 17:30",
        "architecturalHighlights": [
          "蓮池・木橋・伝統木造家屋が織りなす絶好の撮影ロケーション",
          "300着以上のアオザイ展示とレンタル撮影体験"
        ],
        "audioScript": [
          "美しい蓮池と古民家の中でアオザイの歴史と着付け撮影が楽しめるアオザイ博物館へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-baotangaodai-1",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/1/1a/%C3%81o_d%C3%A0i_hoa_ph%C6%B0%E1%BB%A3ng_-_Ph%C3%A1t_Tr%C6%B0%C6%A1ng_-_51231007393_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Ảnh thực tế toàn cảnh Bảo tàng Áo Dài Việt Nam (TP. Thủ Đức) (Wikimedia Commons)",
          "en": "Real view of Ao Dai Museum (Vietnamese National Dress Museum) (Wikimedia Commons)",
          "fr": "Vue réelle de Musée de l’Ao Dai (Thu Duc) (Wikimedia Commons)",
          "zh": "越南奥黛博物馆（守德市）实景照片（维基共享资源）",
          "ja": "アオザイ博物館（トゥードゥック市）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangaodai-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/%C3%81o_D%C3%A0i_HCM_2013.jpg/1280px-%C3%81o_D%C3%A0i_HCM_2013.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Áo Dài Việt Nam (TP. Thủ Đức) (Ảnh 2)",
          "en": "Architecture & atmosphere at Ao Dai Museum (Vietnamese National Dress Museum) (Photo 2)",
          "fr": "Architecture et ambiance à Musée de l’Ao Dai (Thu Duc) (Photo 2)",
          "zh": "越南奥黛博物馆（守德市）建筑与实景细节（图 2）",
          "ja": "アオザイ博物館（トゥードゥック市）の建築と風景（写真 2）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangaodai-3",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/0/08/Aodai.PNG?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Góc nhìn kiến trúc & không gian tại Bảo tàng Áo Dài Việt Nam (TP. Thủ Đức) (Ảnh 3)",
          "en": "Architecture & atmosphere at Ao Dai Museum (Vietnamese National Dress Museum) (Photo 3)",
          "fr": "Architecture et ambiance à Musée de l’Ao Dai (Thu Duc) (Photo 3)",
          "zh": "越南奥黛博物馆（守德市）建筑与实景细节（图 3）",
          "ja": "アオザイ博物館（トゥードゥック市）の建築と風景（写真 3）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-btad-1",
        "name": "Ẩm thực Chợ Quê Long Phước (Trong Bảo tàng Áo Dài)",
        "cuisine": "Món quê Nam Bộ & Trà sen",
        "specialtyDishes": [
          "Bánh xèo rau vườn",
          "Gỏi ngó sen tôm thịt",
          "Chè hạt sen long nhãn"
        ],
        "rating": 4.6,
        "reviewCount": 920,
        "priceRange": "45.000đ – 120.000đ",
        "lat": 10.8065,
        "lng": 106.8428,
        "address": "206/19/30 Long Thuận, Phường Long Phước, TP. Thủ Đức, TP.HCM",
        "openHours": "08:30 – 17:00",
        "imageUrl": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast"
        ]
      }
    ],
    "recommendedVisitMinutes": 75
  },
  {
    "id": "bao-tang-nghe-thuat-quang-san",
    "city": "TP. Thủ Đức · TP.HCM",
    "district": "TP. Thủ Đức",
    "lat": 10.8112,
    "lng": 106.7376,
    "category": "museum",
    "rating": 4.8,
    "reviewCount": 1620,
    "ticketPrice": "200.000đ (HSSV 100.000đ)",
    "address": "189B/3 Nguyễn Văn Hưởng, Phường Thảo Điền, TP. Thủ Đức, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Thao_Dien_Station_%28MRT_1%29%2C_Qu%E1%BB%91c_H%C6%B0%C6%A1ng%2C_Th%E1%BA%A3o_%C4%90i%E1%BB%81n%2C_H%E1%BB%93_Ch%C3%AD_Minh_-_54690900645.jpg/1280px-Thao_Dien_Station_%28MRT_1%29%2C_Qu%E1%BB%91c_H%C6%B0%C6%A1ng%2C_Th%E1%BA%A3o_%C4%90i%E1%BB%81n%2C_H%E1%BB%93_Ch%C3%AD_Minh_-_54690900645.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Bảo tàng Nghệ thuật Quang San (Thảo Điền)",
        "shortSummary": "Bảo tàng nghệ thuật tư nhân đầu tiên tại TP.HCM tọa lạc ven sông Thảo Điền, lưu giữ hơn 1.500 kiệt tác hội họa Việt Nam từ Mỹ thuật Đông Dương (bộ tứ Trí–Lân–Vân–Cẩn) đến đương đại.",
        "historicalEra": "Khánh thành năm 2023",
        "openingHours": "09:00 – 16:30 (Thứ 3 – Chủ nhật)",
        "architecturalHighlights": [
          "Không gian trưng bày 3 tầng sang trọng, ánh sáng chuẩn bảo tàng quốc tế bên khu phố nghệ thuật Thảo Điền",
          "Quy tụ tác phẩm quý hiếm của bộ tứ danh họa Đông Dương Nguyễn Gia Trí, Tô Ngọc Vân, Nguyễn Tường Lân, Trần Văn Cẩn",
          "Biệt thự sân vườn thanh lịch kết hợp khu cà phê nghệ thuật cực kỳ tinh tế cho người yêu mỹ thuật"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Bảo tàng Nghệ thuật Quang San tại phường Thảo Điền, Thành phố Thủ Đức – bảo tàng mỹ thuật tư nhân đầu tiên tại Thành phố Hồ Chí Minh.",
          "Bộ sưu tập hơn 1.500 tác phẩm nơi đây đưa người xem đi dọc dòng chảy mỹ thuật Việt Nam suốt gần một thế kỷ, từ sơn mài và tranh lụa Đông Dương kinh điển đến hơi thở hội họa đương đại.",
          "Theo tư liệu bách khoa Wikipedia: Phường An Khánh nằm ở trung tâm Thành phố Hồ Chí Minh. Trong tương lai, khu vực thuộc Khu đô thị mới Thủ Thiêm, phường Sài Gòn và phường Bến Thành sẽ trở thành Trung tâm Tài chính Thành phố Hồ Chí Minh. Phía Tây giáp với các phường Sài Gòn và phường Thạnh Mỹ Tây với ranh giới là sông Sài Gòn"
        ]
      },
      "en": {
        "name": "Quang San Art Museum (Thao Dien)",
        "shortSummary": "Ho Chi Minh City’s first private fine arts museum in leafy Thao Dien, housing over 1,500 masterpieces from the Indochina Fine Arts era to contemporary Vietnamese art.",
        "historicalEra": "Opened in 2023",
        "openingHours": "09:00 – 16:30 (Tue – Sun)",
        "architecturalHighlights": [
          "Three serene museum-grade floors inside a riverside Thao Dien villa",
          "Rare lacquer, silk, and oil works by Vietnam’s iconic Indochina masters",
          "Surrounded by Thao Dien’s premier cafes, boutiques, and riverfront dining"
        ],
        "audioScript": [
          "Welcome to Quang San Art Museum in Thao Dien, Ho Chi Minh City’s first private art museum featuring over 1,500 Vietnamese masterpieces.",
          "Historical context from Wikipedia: Thảo Điền is an area of An Khánh, Ho Chi Minh City, Vietnam. During 1997 to 2025, it was an administrative ward under District 2 then Thủ Đức Municipal City of Ho Chi Minh City."
        ]
      },
      "fr": {
        "name": "Musée d’Art Quang San (Thao Dien)",
        "shortSummary": "Premier musée d’art privé de Hô Chi Minh-Ville réunissant plus de 1 500 chefs-d’œuvre de l’École des Beaux-Arts d’Indochine à l’art contemporain.",
        "historicalEra": "2023",
        "openingHours": "09h00 – 16h30 (Mar – Dim)",
        "architecturalHighlights": [
          "Trois étages lumineux dédiés à la peinture sur laque et sur soie vietnamienne",
          "Situé au cœur du quartier créatif de Thao Dien"
        ],
        "audioScript": [
          "Bienvenue au musée d’Art Quang San à Thao Dien, consacré aux grands maîtres de la peinture vietnamienne."
        ]
      },
      "zh": {
        "name": "光山艺术博物馆（草田 · 守德市）",
        "shortSummary": "胡志明市首座私人美术馆，坐落于文艺气息浓厚的草田区，收藏逾1,500件印度支那时期至当代的越南绘画大师珍品。",
        "historicalEra": "2023年开馆",
        "openingHours": "09:00 – 16:30（周二至周日）",
        "architecturalHighlights": [
          "国际博物馆级展陈灯光与优雅的河畔花园别墅空间",
          "珍藏越南漆画、丝绸画四大宗师传世佳作"
        ],
        "audioScript": [
          "欢迎来到草田区的光山艺术博物馆，感受跨越百年的越南现当代艺术精品。"
        ]
      },
      "ja": {
        "name": "クアンサン美術館（タオディエン）",
        "shortSummary": "おしゃれなタオディエン地区に2023年開館した市内初の私立美術館。インドシナ美術から現代アートまで1,500点以上の名画を所蔵しています。",
        "historicalEra": "2023年開館",
        "openingHours": "09:00 – 16:30（火〜日）",
        "architecturalHighlights": [
          "洗練された3階建てギャラリーと緑豊かなヴィラ建築",
          "ベトナム漆絵・絹絵の巨匠による希少コレクション"
        ],
        "audioScript": [
          "タオディエンのおしゃれな街並みに佇むホーチミン市初の私立美術館、クアンサン美術館へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-baotangnghet-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Thao_Dien_Station_%28MRT_1%29%2C_Qu%E1%BB%91c_H%C6%B0%C6%A1ng%2C_Th%E1%BA%A3o_%C4%90i%E1%BB%81n%2C_H%E1%BB%93_Ch%C3%AD_Minh_-_54690900645.jpg/1280px-Thao_Dien_Station_%28MRT_1%29%2C_Qu%E1%BB%91c_H%C6%B0%C6%A1ng%2C_Th%E1%BA%A3o_%C4%90i%E1%BB%81n%2C_H%E1%BB%93_Ch%C3%AD_Minh_-_54690900645.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Bảo tàng Nghệ thuật Quang San (Thảo Điền) (Wikimedia Commons)",
          "en": "Real view of Quang San Art Museum (Thao Dien) (Wikimedia Commons)",
          "fr": "Vue réelle de Musée d’Art Quang San (Thao Dien) (Wikimedia Commons)",
          "zh": "光山艺术博物馆（草田 · 守德市）实景照片（维基共享资源）",
          "ja": "クアンサン美術館（タオディエン）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangnghet-2",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Thao_Dien_Station_%28MRT_1%29%2C_Qu%E1%BB%91c_H%C6%B0%C6%A1ng%2C_Th%E1%BA%A3o_%C4%90i%E1%BB%81n%2C_H%E1%BB%93_Ch%C3%AD_Minh_-_54689750152.jpg/1280px-Thao_Dien_Station_%28MRT_1%29%2C_Qu%E1%BB%91c_H%C6%B0%C6%A1ng%2C_Th%E1%BA%A3o_%C4%90i%E1%BB%81n%2C_H%E1%BB%93_Ch%C3%AD_Minh_-_54689750152.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Bảo tàng Nghệ thuật Quang San (Thảo Điền) (Wikimedia Commons)",
          "en": "Real view of Quang San Art Museum (Thao Dien) (Wikimedia Commons)",
          "fr": "Vue réelle de Musée d’Art Quang San (Thao Dien) (Wikimedia Commons)",
          "zh": "光山艺术博物馆（草田 · 守德市）实景照片（维基共享资源）",
          "ja": "クアンサン美術館（タオディエン）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-baotangnghet-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Thao_Dien_Station_%28MRT_1%29%2C_Qu%E1%BB%91c_H%C6%B0%C6%A1ng%2C_Th%E1%BA%A3o_%C4%90i%E1%BB%81n%2C_H%E1%BB%93_Ch%C3%AD_Minh_-_54690818339.jpg/1280px-Thao_Dien_Station_%28MRT_1%29%2C_Qu%E1%BB%91c_H%C6%B0%C6%A1ng%2C_Th%E1%BA%A3o_%C4%90i%E1%BB%81n%2C_H%E1%BB%93_Ch%C3%AD_Minh_-_54690818339.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Bảo tàng Nghệ thuật Quang San (Thảo Điền) (Wikimedia Commons)",
          "en": "Real view of Quang San Art Museum (Thao Dien) (Wikimedia Commons)",
          "fr": "Vue réelle de Musée d’Art Quang San (Thao Dien) (Wikimedia Commons)",
          "zh": "光山艺术博物馆（草田 · 守德市）实景照片（维基共享资源）",
          "ja": "クアンサン美術館（タオディエン）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-btqs-1",
        "name": "The Deck Saigon (Nhà hàng Ven sông Thảo Điền)",
        "cuisine": "Ẩm thực Á – Âu Cao cấp Ven sông",
        "specialtyDishes": [
          "Cá chẽm áp chảo sốt chanh dây",
          "Tôm càng nướng bơ tỏi",
          "Cocktail hoàng hôn"
        ],
        "rating": 4.7,
        "reviewCount": 3890,
        "priceRange": "220.000đ – 550.000đ",
        "lat": 10.8136,
        "lng": 106.7361,
        "address": "38 Nguyễn Ư Dĩ, Phường Thảo Điền, TP. Thủ Đức, TP.HCM",
        "openHours": "08:00 – 23:00",
        "imageUrl": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
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
    "id": "tu-vien-khanh-an-quan-12",
    "city": "Quận 12 · TP.HCM",
    "district": "Quận 12",
    "lat": 10.8648,
    "lng": 106.6912,
    "category": "temple",
    "rating": 4.8,
    "reviewCount": 7850,
    "ticketPrice": "Miễn phí tham quan",
    "address": "1055/3D Quốc lộ 1A (Võ Thị Thừa), Phường An Phú Đông, Quận 12, TP.HCM",
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Hoi_Khanh_Pagoda_in_Binh_Duong.jpg/1280px-Hoi_Khanh_Pagoda_in_Binh_Duong.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "translations": {
      "vi": {
        "name": "Tu viện Khánh An (\"Tiểu Nhật Bản\" giữa Sài Gòn · Quận 12)",
        "shortSummary": "Ngôi tu viện Phật giáo Bắc tông nổi tiếng với kiến trúc gỗ đỏ – tường trắng thanh tao, mái ngói cong, lồng đèn lục giác và vườn thiền tĩnh lặng tựa cố đô Kyoto.",
        "historicalEra": "Khởi dựng 1905 – Trùng tu 2006–2016",
        "openingHours": "05:00 – 20:00 Hàng ngày",
        "architecturalHighlights": [
          "Lối kiến trúc Á Đông tối giản với 3 gam màu chủ đạo nâu gỗ, đỏ trầm và trắng vôi cực kỳ thanh lịch",
          "Hàng lồng đèn giấy lục giác, chuông gió và bậc thang đá tạo góc chụp ảnh tựa Nhật Bản",
          "Không gian tu học thanh tịnh, không đốt vàng mã, xanh mát rợp bóng cây"
        ],
        "audioScript": [
          "Chào mừng quý khách đến với Tu viện Khánh An tại phường An Phú Đông, Quận 12 – nơi được du khách trìu mến gọi là \"Tiểu Nhật Bản\" giữa lòng Thành phố Hồ Chí Minh.",
          "Khởi dựng từ năm 1905 và trùng tu theo phong cách thiền viện Á Đông tối giản, Tu viện Khánh An mang đến không gian an yên tuyệt đối cùng những mái ngói gỗ đỏ và hàng lồng đèn trắng tinh tế.",
          "Theo tư liệu bách khoa Wikipedia: Tu viện Khánh An là một ngôi chùa bề thế nằm ở quận 12, Thành phố Hồ Chí Minh, nơi đây được gọi là tu viện vì muốn nói giảm thiểu đi sắc màu của tín ngưỡng, tôn giáo. Tu viện Khánh An là nơi thường xuyên tổ chức các khóa tu, khóa thiền, thiền tứ niệm xứ và nhận được sự quan tâm của đông đảo chư tăng, phật tử. Đây là nơi thu hút người dân tới chiêm bái, lễ chùa, nhiều người trẻ tìm tới tham dự các khóa tu ngắn ngày, nghe thuyết pháp."
        ]
      },
      "en": {
        "name": "Khanh An Monastery (\"Little Japan\" of Saigon · District 12)",
        "shortSummary": "A serene Zen monastery in District 12 nicknamed “Little Japan” for its crimson-timber roofs, white plaster walls, paper lanterns, and peaceful Kyoto-like courtyards.",
        "historicalEra": "Founded 1905 – Restored 2016",
        "openingHours": "05:00 – 20:00 Daily",
        "architecturalHighlights": [
          "Minimalist East Asian timber-and-white architecture reminiscent of Kyoto temples",
          "Hexagonal paper lanterns, wooden wind chimes, and tranquil stone steps",
          "Peaceful spiritual retreat free of incense smoke and urban noise"
        ],
        "audioScript": [
          "Welcome to Khanh An Monastery in District 12, famed for its tranquil Kyoto-inspired timber architecture, white walls, and hanging lanterns.",
          "Historical context from Wikipedia: District 12 may also refer to a fictional location in The Hunger Games universe, or to other 12th legislative districts."
        ]
      },
      "fr": {
        "name": "Monastère Khanh An (\"Petit Japon\" de Saïgon · 12e)",
        "shortSummary": "Monastère zen du 12e arrondissement surnommé le « Petit Japon » pour ses toitures en bois rouge, murs blancs et lanternes de papier.",
        "historicalEra": "1905 – 2016",
        "openingHours": "05h00 – 20h00",
        "architecturalHighlights": [
          "Architecture zen épurée rappelant les temples de Kyoto",
          "Cours silencieuses ornées de lanternes hexagonales blanches"
        ],
        "audioScript": [
          "Bienvenue au monastère Khanh An, sanctuaire zen paisible surnommé le Petit Japon de Saïgon."
        ]
      },
      "zh": {
        "name": "庆安禅院（西贡“小京都” · 第十二郡）",
        "shortSummary": "第十二郡最具禅意美学的佛教寺院，红木屋檐、素白围墙与六角纸灯笼宛如京都古寺，清幽雅致极适合静心拍照。",
        "historicalEra": "1905年建寺 – 2016年重修",
        "openingHours": "05:00 – 20:00",
        "architecturalHighlights": [
          "红木、白墙与黛瓦勾勒出极简东方禅意建筑",
          "六角白灯笼、木风铃与清幽庭院极具京都风韵"
        ],
        "audioScript": [
          "欢迎来到第十二郡的庆安禅院，这里素雅清幽的木构建筑被誉为胡志明市的“小京都”。"
        ]
      },
      "ja": {
        "name": "カインアン修道院（サイゴンの「リトル京都」・12区）",
        "shortSummary": "朱塗りの木組みと白壁、六角形の紙提灯が日本の古寺を思わせる12区の禅寺院。静謐な空間と優美な建築で人気のフォトスポットです。",
        "historicalEra": "1905年創建 – 2016年改修",
        "openingHours": "05:00 – 20:00",
        "architecturalHighlights": [
          "木造の反り屋根と白壁が織りなす京都風の禅建築",
          "六角形の白い提灯と風鈴が揺れる静かな回廊"
        ],
        "audioScript": [
          "日本の古寺を思わせる静謐な佇まいで人気の12区・カインアン修道院へようこそ。"
        ]
      }
    },
    "mediaGallery": [
      {
        "id": "wk-tuvienkhanha-1",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Hoi_Khanh_Pagoda_in_Binh_Duong.jpg/1280px-Hoi_Khanh_Pagoda_in_Binh_Duong.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Tu viện Khánh An (\"Tiểu Nhật Bản\" giữa Sài Gòn · Quận 12) (Wikimedia Commons)",
          "en": "Real view of Khanh An Monastery (\"Little Japan\" of Saigon · District 12) (Wikimedia Commons)",
          "fr": "Vue réelle de Monastère Khanh An (\"Petit Japon\" de Saïgon · 12e) (Wikimedia Commons)",
          "zh": "庆安禅院（西贡“小京都” · 第十二郡）实景照片（维基共享资源）",
          "ja": "カインアン修道院（サイゴンの「リトル京都」・12区）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-tuvienkhanha-2",
        "type": "image",
        "url": "https://upload.wikimedia.org/wikipedia/commons/9/95/Thap_mo_Ly_Khanh_Van.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
        "caption": {
          "vi": "Ảnh thực tế tại Tu viện Khánh An (\"Tiểu Nhật Bản\" giữa Sài Gòn · Quận 12) (Wikimedia Commons)",
          "en": "Real view of Khanh An Monastery (\"Little Japan\" of Saigon · District 12) (Wikimedia Commons)",
          "fr": "Vue réelle de Monastère Khanh An (\"Petit Japon\" de Saïgon · 12e) (Wikimedia Commons)",
          "zh": "庆安禅院（西贡“小京都” · 第十二郡）实景照片（维基共享资源）",
          "ja": "カインアン修道院（サイゴンの「リトル京都」・12区）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      },
      {
        "id": "wk-tuvienkhanha-3",
        "type": "image",
        "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Pagode_bouddhiste_viet_Khanh_Anh_de_Bagneux.jpg/1280px-Pagode_bouddhiste_viet_Khanh_Anh_de_Bagneux.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
        "caption": {
          "vi": "Ảnh thực tế tại Tu viện Khánh An (\"Tiểu Nhật Bản\" giữa Sài Gòn · Quận 12) (Wikimedia Commons)",
          "en": "Real view of Khanh An Monastery (\"Little Japan\" of Saigon · District 12) (Wikimedia Commons)",
          "fr": "Vue réelle de Monastère Khanh An (\"Petit Japon\" de Saïgon · 12e) (Wikimedia Commons)",
          "zh": "庆安禅院（西贡“小京都” · 第十二郡）实景照片（维基共享资源）",
          "ja": "カインアン修道院（サイゴンの「リトル京都」・12区）の実景写真（ウィキメディア・コモンズ）"
        },
        "yearOrSource": "Wikipedia · Wikimedia Commons"
      }
    ],
    "nearbyRestaurants": [
      {
        "id": "res-tvka-1",
        "name": "Quán Chay An Lạc & Cà Phê Vườn An Phú Đông",
        "cuisine": "Ẩm thực Chay & Cà phê Sân vườn",
        "specialtyDishes": [
          "Bún thái chay",
          "Gỏi cuốn chay",
          "Cà phê sữa đá"
        ],
        "rating": 4.5,
        "reviewCount": 740,
        "priceRange": "30.000đ – 75.000đ",
        "lat": 10.8641,
        "lng": 106.6924,
        "address": "Vườn Lài, Phường An Phú Đông, Quận 12, TP.HCM",
        "openHours": "06:30 – 21:00",
        "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
        "mealSlots": [
          "cafe",
          "breakfast",
          "dinner"
        ]
      }
    ],
    "recommendedVisitMinutes": 35
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
    """Idempotently seed all 50 HCMC sites, 56 restaurants, RAG chunks, 6 badges, and demo accounts."""
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

        # 2. Upsert 50 Heritage Sites + 56 Nearby Restaurants + Multilingual Chunks
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
        if site_count >= len(SEED_SITES_DATA) and badge_count >= 6:
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
