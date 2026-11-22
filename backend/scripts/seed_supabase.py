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
        "shortSummary": "The special national monument is associated with the historical moment of national unification on April 30, 1975 and is a masterpiece of modern Asian architecture by architect Ngo Viet Thu.",
        "historicalEra": "1868 – 1966 – 1975",
        "openingHours": "08:00 – 15:30 Daily",
        "architecturalHighlights": [
          "The stylized stone flower curtain facade burns traditional Eastern bamboo by architect Ngo Viet Thu",
          "More than 100 functional rooms: Ceremony Room, Cabinet Room, National Letters Presentation Room",
          "Solid underground communications and combat command bunker system",
          "National Treasure artifacts tanks 843 and 390 in the 18ha park"
        ],
        "audioScript": [
          "Welcome to the Special National Monument Independence Palace, also known as Reunification Hall, located at 135 Nam Ky Khoi Nghia, center of District 1, Ho Chi Minh City.",
          "The project's predecessor was Norodom Palace, built in 1868. The current mansion was started in 1962 and inaugurated in 1966 according to the project of Architect Ngo Viet Thu - the first Asian to win the Roman Khoi Nguyen award.",
          "The architecture of the Independence Palace harmoniously combines Western modern art and Eastern philosophy through the auspicious design of the word Cat, along with a system of white stone flower curtains simulating elegant bamboo segments.",
          "At exactly 11:30 a.m. on April 30, 1975, this place marked a brilliant milestone when Liberation Army tanks entered the main gate, ending the war and unifying Vietnam.",
          "According to the Wikipedia encyclopedia: Independence Palace is a mansion in Ho Chi Minh City, once the residence and working place of the President of the Republic of Vietnam before the April 30, 1975 Event. Currently, the Independence Palace has been ranked by the Vietnamese Government as a special national monument. The agency managing the cultural relics of the Independence Palace is called the Reunification Hall under the Government Office. The Independence Palace was started construction by President Ngo Dinh Diem on July 1, 1962, after the old palace from the French colonial period was damaged by the bombing of two pilots. The palace was built according to the design of architect Ngo Viet Thu, the first Vietnamese to win the Roman Khoi Nguyen award."
        ]
      },
      "fr": {
        "name": "Palais de la Réunification (Palais de l’Indépendance)",
        "shortSummary": "Ce monument national spécial est associé au moment historique de l'unification nationale du 30 avril 1975 et est un chef-d'œuvre de l'architecture asiatique moderne de l'architecte Ngo Viet Thu.",
        "historicalEra": "1868 – 1966 – 1975",
        "openingHours": "08h00 – 15h30 tous les jours",
        "architecturalHighlights": [
          "La façade stylisée du rideau de fleurs en pierre brûle le bambou oriental traditionnel par l'architecte Ngo Viet Thu",
          "Plus de 100 salles fonctionnelles : Salle de Cérémonie, Salle du Cabinet, Salle de Présentation des Lettres Nationales",
          "Système de bunker de communications souterraines et de commandement de combat solide",
          "Réservoirs d'artefacts du Trésor National 843 et 390 dans le parc de 18ha"
        ],
        "audioScript": [
          "Bienvenue au Palais de l'Indépendance, monument national spécial, également connu sous le nom de Salle de la Réunification, situé au 135 Nam Ky Khoi Nghia, centre du district 1, Hô Chi Minh-Ville.",
          "Le prédécesseur du projet était le palais Norodom, construit en 1868. Le manoir actuel a été commencé en 1962 et inauguré en 1966 selon le projet de l'architecte Ngo Viet Thu - le premier asiatique à remporter le prix romain Khoi Nguyen.",
          "L'architecture du Palais de l'Indépendance combine harmonieusement l'art moderne occidental et la philosophie orientale à travers le dessin de bon augure du mot Chat, ainsi qu'un système de rideaux de fleurs en pierre blanche simulant d'élégants segments de bambou.",
          "À 11h30 exactement le 30 avril 1975, cet endroit a marqué une étape brillante lorsque les chars de l'Armée de libération ont franchi la porte principale, mettant ainsi fin à la guerre et unifiant le Vietnam.",
          "Selon l'encyclopédie Wikipédia : Le Palais de l'Indépendance est un manoir à Hô Chi Minh-Ville, autrefois résidence et lieu de travail du président de la République du Vietnam avant les événements du 30 avril 1975. Actuellement, le Palais de l'Indépendance a été classé par le gouvernement vietnamien comme monument national spécial. L'agence qui gère les reliques culturelles du Palais de l'Indépendance s'appelle la Salle de la Réunification relevant du Bureau du Gouvernement. La construction du Palais de l'Indépendance a été commencée par le président Ngo Dinh Diem le 1er juillet 1962, après que l'ancien palais de la période coloniale française ait été endommagé par le bombardement de deux pilotes. Le palais a été construit selon les plans de l'architecte Ngo Viet Thu, le premier Vietnamien à remporter le prix romain Khoi Nguyen."
        ]
      },
      "zh": {
        "name": "胡志明市独立宫（统一宫）",
        "shortSummary": "这座特殊的国家纪念碑与1975年4月30日国家统一的历史时刻相关，是建筑师吴越图的现代亚洲建筑杰作。",
        "historicalEra": "1868 – 1966 – 1975",
        "openingHours": "08:00 – 15:30",
        "architecturalHighlights": [
          "由建筑师 Ngo Viet Thu 设计的风格化的石花幕墙立面燃烧了传统的东方竹子",
          "100余间功能室：礼堂、内阁室、国书呈递室",
          "坚固的地下通信和作战指挥掩体系统",
          "18公顷公园内的国宝文物坦克843和390"
        ],
        "audioScript": [
          "欢迎来到特别国家纪念碑独立宫，也称为统一馆，位于胡志明市第一区中心南己起义路 135 号。",
          "该项目的前身是建于1868年的诺罗敦宫。现在的宅邸是根据建筑师Ngo Viet Thu（第一个获得Roman Khoi Nguyen奖的亚洲人）的设计，于1962年动工，并于1966年落成。",
          "独立宫的建筑通过吉祥的“猫”字设计，以及模仿优雅竹节的白色石花窗帘系统，将西方现代艺术与东方哲学和谐地结合在一起。",
          "1975年4月30日上午11时30分整，这里标志着解放军坦克开进大门、结束战争、统一越南的辉煌里程碑。",
          "据维基百科百科介绍：独立宫是胡志明市的一座宅邸，在1975年4月30日事件之前曾是越南共和国总统的住所和工作场所。目前，独立宫已被越南政府列为特殊国家古迹。管理独立宫文物的机构称为政府办公厅下属的统一馆。法国殖民时期的旧宫殿因两名飞行员的轰炸而受损，独立宫由总统吴庭艳于 1962 年 7 月 1 日开始兴建。这座宫殿是根据建筑师吴越图（Ngo Viet Thu）的设计建造的，吴越图是第一位获得罗马科伊阮奖的越南人。"
        ]
      },
      "ja": {
        "name": "統一会堂（旧独立宮殿）",
        "shortSummary": "この特別な国家記念碑は、1975 年 4 月 30 日の国家統一の歴史的瞬間に関連しており、建築家ゴ ベト トゥーによる現代アジア建築の傑作です。",
        "historicalEra": "1868年 – 1966年 – 1975年",
        "openingHours": "08:00 – 15:30",
        "architecturalHighlights": [
          "様式化された石の花のカーテンのファサードは、建築家 Ngo Viet Thu による伝統的な東洋の竹を燃やしています。",
          "100 以上の機能的な部屋: セレモニールーム、キャビネットルーム、ナショナルレタープレゼンテーションルーム",
          "堅牢な地下通信と戦闘指揮バンカーシステム",
          "18haの公園内にある国宝戦車843号戦車と390号戦車"
        ],
        "audioScript": [
          "ホーチミン市 1 区の中心、ナム キー コイ ギア 135 番地にある特別国定記念物独立宮殿 (統一会館としても知られています) へようこそ。",
          "このプロジェクトの前身は、1868 年に建てられたノロドム宮殿でした。現在の邸宅は、ローマン コイ グエン賞を受賞した最初のアジア人である建築家ゴ ベト トゥーのプロジェクトに従って 1962 年に着工され、1966 年に竣工しました。",
          "独立宮殿の建築は、猫という言葉の縁起の良いデザインと、エレガントな竹の部分を模した白い石の花のカーテンのシステムを通じて、西洋の現代美術と東洋の哲学を調和的に組み合わせています。",
          "1975 年 4 月 30 日の午前 11 時 30 分ちょうど、この場所は、解放軍の戦車が正門に進入し、戦争が終わり、ベトナムが統一される輝かしい節目となりました。",
          "ウィキペディア百科事典によると、独立宮殿はホーチミン市にある邸宅で、1975 年 4 月 30 日の事件以前はベトナム共和国大統領の住居および執務場所でした。現在、独立宮殿はベトナム政府によって特別な国家記念物に指定されています。独立宮殿の文化財を管理する機関は、政府庁直属の統一会館と呼ばれています。独立宮殿は、フランス植民地時代の旧宮殿がパイロット 2 名の爆撃によって被害を受けた後、1962 年 7 月 1 日にゴ ディン ディエム大統領によって建設が開始されました。この宮殿は、ベトナム人として初めてローマン・コイ・グエン賞を受賞した建築家、ゴ・ベト・トゥーの設計に従って建てられました。"
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
        "shortSummary": "The symbol of Roman and Gothic architecture was completed in 1880 in the center of the Paris Commune with all original Marseille red bricks imported from France.",
        "historicalEra": "1877 – 1880 (Architect J. Bourard)",
        "openingHours": "Exterior square open 24/7",
        "architecturalHighlights": [
          "Red-pink ceiling brick walls imported from Marseille (France) are not plastered or covered with moss",
          "The two bell towers rise 57 meters high with a set of 6 bronze bells resonating majestically",
          "Rose Window and stained glass system produced in Chartres",
          "Statue of Our Lady of Peace made of white Carrara marble (Italy) in front of the square"
        ],
        "audioScript": [
          "You are standing at the Paris Commune Square, in front of the Notre Dame Cathedral Basilica of Saigon - one of the oldest and most famous architectural symbols of Ho Chi Minh City.",
          "Construction started on October 7, 1877 and inaugurated on Easter 1880 according to the design of architect J. Bourard, the project has a modified Roman style mixed with the elegance of Gothic architecture.",
          "All construction materials from cement, iron and steel to millions of red bricks for the exterior are transported directly from Marseille, France, keeping the warm red color for more than 145 years.",
          "In 1895, two pointed bell towers over 57 meters high were built, inside hung six large bronze bells weighing a total of nearly 30 tons.",
          "According to Wikipedia encyclopedia: Saigon Notre-Dame Cathedral Basilica (or Immaculate Conception Cathedral Basilica, English: Immaculate Conception Cathedral Basilica, French: Cathédrale Notre-Dame de Saïgon, Latin: Basilica Immaculatae Conceptionis), often referred to as Notre-Dame Cathedral Basilica, is the cathedral of the Archdiocese of Saigon. The church is not only a symbol of Catholicism in Vietnam, but also one of the unique architectural works of Ho Chi Minh City and a famous destination for tourists. The original name of the church was Saigon Cathedral (French: l'eglise de Saïgon), the name Notre Dame Cathedral began to be used in 1959 by placing the Statue of Our Lady of Peace in front of the campus."
        ]
      },
      "fr": {
        "name": "Cathédrale Notre-Dame de Saïgon",
        "shortSummary": "Le symbole de l'architecture romane et gothique a été achevé en 1880 au centre de la Commune de Paris avec toutes les briques rouges marseillaises d'origine importées de France.",
        "historicalEra": "1877 – 1880 (Architecte J. Bourard)",
        "openingHours": "Parvis accessible toute la journée",
        "architecturalHighlights": [
          "Les murs en briques du plafond rouge-rose importés de Marseille (France) ne sont ni enduits ni recouverts de mousse",
          "Les deux clochers s'élèvent à 57 mètres de hauteur avec un ensemble de 6 cloches en bronze résonnant majestueusement.",
          "Système de rosace et vitraux produits à Chartres",
          "Statue de Notre-Dame de la Paix en marbre blanc de Carrare (Italie) devant la place"
        ],
        "audioScript": [
          "Vous vous trouvez sur la place de la Commune de Paris, devant la basilique-cathédrale Notre-Dame de Saigon, l'un des symboles architecturaux les plus anciens et les plus célèbres d'Hô Chi Minh-Ville.",
          "La construction débuta le 7 octobre 1877 et inaugurée à Pâques 1880 selon les plans de l'architecte J. Bourard, le projet présente un style roman modifié mêlé à l'élégance de l'architecture gothique.",
          "Tous les matériaux de construction, du ciment, du fer et de l'acier aux millions de briques rouges pour l'extérieur, sont transportés directement de Marseille, en France, conservant leur couleur rouge chaude pendant plus de 145 ans.",
          "En 1895, deux clochers pointus de plus de 57 mètres de haut furent construits, à l'intérieur étaient suspendues six grosses cloches en bronze pesant au total près de 30 tonnes.",
          "Selon l'encyclopédie Wikipédia : Basilique-cathédrale Notre-Dame de Saigon (ou Basilique-cathédrale de l'Immaculée Conception, anglais : Basilique-cathédrale de l'Immaculée Conception, français : Cathédrale Notre-Dame de Saïgon, latin : Basilique Immaculatae Conceptionis), souvent appelée basilique-cathédrale Notre-Dame, est la cathédrale de l'archidiocèse de Saigon. L'église n'est pas seulement un symbole du catholicisme au Vietnam, mais aussi l'une des œuvres architecturales uniques de Hô Chi Minh-Ville et une destination célèbre pour les touristes. Le nom original de l'église était Cathédrale de Saigon (français : l'église de Saïgon), le nom de Cathédrale Notre-Dame a commencé à être utilisé en 1959 en plaçant la statue de Notre-Dame de la Paix devant le campus."
        ]
      },
      "zh": {
        "name": "西贡圣母大教堂（红教堂）",
        "shortSummary": "罗马和哥特式建筑的象征，于1880年在巴黎公社中心落成，全部采用法国原装进口的马赛红砖。",
        "historicalEra": "1877 – 1880年",
        "openingHours": "广场全天开放",
        "architecturalHighlights": [
          "从法国马赛进口的红粉色天花板砖墙未抹灰或长满青苔",
          "两座钟楼高 57 米，六口铜钟发出雄伟的共鸣",
          "沙特尔生产的玫瑰窗和彩色玻璃系统",
          "广场前的和平圣母像，由白色卡拉拉大理石（意大利）制成"
        ],
        "audioScript": [
          "您正站在巴黎公社广场，西贡圣母大教堂前 - 胡志明市最古老、最著名的建筑标志之一。",
          "根据建筑师J. Bourard的设计，该项目于1877年10月7日动工，1880年复活节落成，将罗马风格与哥特式建筑的优雅融为一体。",
          "从水泥、钢铁到外墙的数百万块红砖，所有建筑材料均直接从法国马赛运来，使温暖的红色保持了超过145年。",
          "1895年建成两座高57米的尖尖钟楼，内悬六口总重近30吨的大铜钟。",
          "根据维基百科百科全书：西贡圣母大教堂（或圣母无原罪主教座堂，英语：Immaculate Conception Cathedral Basilica，法语：Cathédrale Notre-Dame de Saïgon，拉丁语：Basilica Immaculatae Conceptionis），通常简称为圣母大教堂，是西贡总教区的大教堂。该教堂不仅是越南天主教的象征，也是胡志明市独特的建筑作品之一，也是著名的旅游胜地。教堂原名西贡大教堂（法语：l'eglise de Saïgon），1959年因在校园前放置和平圣母像而开始使用圣母大教堂之名。"
        ]
      },
      "ja": {
        "name": "サイゴン大教会（聖母マリア教会）",
        "shortSummary": "ローマ建築とゴシック建築のシンボルは、すべてフランスから輸入されたオリジナルのマルセイユ赤レンガを使用して、パリ コミューンの中心に 1880 年に完成しました。",
        "historicalEra": "1877年 – 1880年",
        "openingHours": "広場は終日開放",
        "architecturalHighlights": [
          "マルセイユ（フランス）から輸入された赤ピンクの天井レンガ壁には漆喰が塗られておらず、苔で覆われていない",
          "2 つの鐘楼は高さ 57 メートルで、6 つの銅鐘が荘厳に響き渡ります。",
          "シャルトルで生産されたバラ窓とステンドグラスシステム",
          "広場前のカララ白大理石（イタリア）製の平和の聖母像"
        ],
        "audioScript": [
          "あなたは、ホーチミン市で最も古く最も有名な建築のシンボルの 1 つであるサイゴンのノートルダム大聖堂の前にあるパリ コミューン広場に立っています。",
          "建築家 J. ブラールの設計に従って 1877 年 10 月 7 日に建設が開始され、1880 年の復活祭に着工したこのプロジェクトは、修正されたローマ様式とゴシック建築の優雅さが融合しています。",
          "セメント、鉄鋼から外装用の数百万個の赤レンガに至るまで、すべての建築資材はフランスのマルセイユから直接輸送され、145 年以上にわたって温かみのある赤色を保ち続けています。",
          "1895 年に、高さ 57 メートルを超える 2 つの尖った鐘楼が建てられ、内部には合計 30 トン近い重さの 6 つの大きな銅鐘が吊るされていました。",
          "ウィキペディア百科事典によると、サイゴン ノートルダム大聖堂バシリカ（または無原罪の御宿り大聖堂、英語: Immaculate Conception Cathedral Basilica、フランス語: Cathédrale Notre-Dame de Saigon、ラテン語: Basilica Immaculatae Conceptionis）は、しばしばノートルダム大聖堂バシリカと呼ばれ、大司教区の大聖堂です。サイゴンの。この教会はベトナムのカトリックの象徴であるだけでなく、ホーチミン市のユニークな建築物の一つであり、観光客の有名な目的地でもあります。教会の元々の名前はサイゴン大聖堂 (フランス語: l'eglise de Saigon) でしたが、1959 年にキャンパスの前に平和の聖母像が置かれたことにより、ノートルダム大聖堂という名前が使用され始めました。"
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
        "shortSummary": "Neoclassical architectural masterpiece combining 19th century industrial steel arch structure (1886 - 1891) by architects Alfred Foulhoux and Villedieu.",
        "historicalEra": "1886 – 1891 (Villedieu & Foulhoux)",
        "openingHours": "07:30 – 18:00 Daily",
        "architecturalHighlights": [
          "The dome has a delicate curved steel frame structure along the main hall",
          "Two hand-painted historical maps on the wall arch: \"Saigon et ses environs 1892\" and a map of the Cochinchina telegraph line",
          "The facade is decorated with telegraph science celebrities and a large শত five-year-old clock",
          "Next to Ho Chi Minh City Book Street Nguyen Van Binh is shady with green trees"
        ],
        "audioScript": [
          "Welcome to Saigon Central Post Office, a more than 130-year-old postal project that is still bustling with activity every day at No. 2 Paris Commune.",
          "Built from 1886 to 1891 under the leadership of architects Auguste Villedieu and Alfred Foulhoux, the building makes a strong impression with its brilliant golden facade and antique clock in the middle.",
          "When passing through the main lobby, you will be overwhelmed by the high and wide iron-framed dome reminiscent of European stations in the late 19th century, along with two hand-painted antique maps from 1892 on the dome wall.",
          "Right next to the Post Office is Nguyen Van Binh Book Street - the most peaceful reading cultural space in the city center.",
          "According to Wikipedia encyclopedia: Saigon Central Post Office, also known as Ho Chi Minh City Post Office Building, is one of the typical architectural works in Ho Chi Minh City, located at No. 2, Paris Commune Square, Saigon Ward. This is a building built by the French between 1886 and 1891 with an eclectic style according to the design project of architect Marie-Alfred Foulhoux. Located next to Notre Dame Cathedral, this is also a tourist attraction for tourists coming to Ho Chi Minh City."
        ]
      },
      "fr": {
        "name": "Poste Centrale de Saïgon & Rue du Livre",
        "shortSummary": "Chef-d'œuvre architectural néoclassique combinant une structure industrielle en arc en acier du XIXe siècle (1886 - 1891) réalisée par les architectes Alfred Foulhoux et Villedieu.",
        "historicalEra": "1886 – 1891 (Villedieu & Foulhoux)",
        "openingHours": "07h30 – 18h00",
        "architecturalHighlights": [
          "Le dôme a une délicate structure en acier incurvée le long du hall principal",
          "Deux cartes historiques peintes à la main sur l'arche murale : \"Saigon et ses environs 1892\" et un plan de la ligne télégraphique de Cochinchine",
          "La façade est décorée de célébrités de la science télégraphique et d'une grande horloge vieille de cinq ans.",
          "À côté de la rue du livre de Hô Chi Minh-Ville, Nguyen Van Binh, elle est ombragée avec des arbres verts"
        ],
        "audioScript": [
          "Bienvenue à la Poste Centrale de Saigon, un projet postal vieux de plus de 130 ans qui continue d'être animé chaque jour au n°2 de la Commune de Paris.",
          "Construit de 1886 à 1891 sous la houlette des architectes Auguste Villedieu et Alfred Foulhoux, le bâtiment fait forte impression avec sa façade dorée brillante et son horloge ancienne au milieu.",
          "En traversant le hall principal, vous serez submergé par le haut et large dôme à charpente de fer qui rappelle les gares européennes de la fin du 19e siècle, ainsi que par deux cartes anciennes peintes à la main de 1892 sur le mur du dôme.",
          "Juste à côté de la poste se trouve la rue du livre Nguyen Van Binh, l'espace culturel de lecture le plus paisible du centre-ville.",
          "Selon l'encyclopédie Wikipédia : La poste centrale de Saigon, également connue sous le nom de bâtiment du bureau de poste de Hô Chi Minh-Ville, est l'une des œuvres architecturales typiques de Hô Chi Minh-Ville, située au n° 2 de la place de la Commune de Paris, dans le quartier de Saigon. Il s'agit d'un bâtiment construit par les Français entre 1886 et 1891 avec un style éclectique selon le projet de conception de l'architecte Marie-Alfred Foulhoux. Situé à côté de la cathédrale Notre-Dame, c'est également une attraction touristique pour les touristes venant à Hô Chi Minh-Ville."
        ]
      },
      "zh": {
        "name": "西贡中央邮局与阮文平书街",
        "shortSummary": "由建筑师 Alfred Foulhoux 和 Villedieu 设计的新古典主义建筑杰作，结合了 19 世纪工业钢拱结构（1886 - 1891）。",
        "historicalEra": "1886 – 1891年",
        "openingHours": "07:30 – 18:00",
        "architecturalHighlights": [
          "穹顶沿着主厅有一个精致的弧形钢框架结构",
          "墙上的拱门上有两张手绘历史地图：“Saigon et ses Environs 1892”和一张交趾支那电报线地图",
          "正面装饰有电报科学名人和一座五岁大钟",
          "胡志明市书街阮文平旁边绿树成荫"
        ],
        "audioScript": [
          "欢迎来到西贡中央邮局，这是一个拥有 130 多年历史的邮政项目，在巴黎 2 号公社每天仍然熙熙攘攘。",
          "该建筑建于 1886 年至 1891 年，由建筑师 Auguste Villedieu 和 Alfred Foulhoux 领导，其辉煌的金色外观和中间的古董钟给人留下了深刻的印象。",
          "穿过主大厅，你会被高而宽的铁架圆顶所震撼，让人想起19世纪末的欧洲车站，圆顶墙上挂着两张1892年的手绘古董地图。",
          "邮局旁边就是阮文平书街——市中心最宁静的阅读文化空间。",
          "据维基百科百科介绍：西贡中央邮局，又称胡志明市邮政局大楼，是胡志明市的典型建筑作品之一，位于西贡区巴黎公社广场2号。这是法国人根据建筑师Marie-Alfred Foulhoux的设计项目于1886年至1891年间建造的一座具有折衷主义风格的建筑。位于圣母大教堂旁边，这也是来胡志明市游客的旅游景点。"
        ]
      },
      "ja": {
        "name": "サイゴン中央郵便局とグエン・ヴァン・ビン本通り",
        "shortSummary": "建築家アルフレッド フルーとヴィルデューによる 19 世紀の工業用鋼製アーチ構造 (1886 ～ 1891 年) を組み合わせた新古典主義建築の傑作。",
        "historicalEra": "1886年 – 1891年",
        "openingHours": "07:30 – 18:00",
        "architecturalHighlights": [
          "ドームはメインホールに沿って繊細な曲線を描く鉄骨構造となっている",
          "壁のアーチにある 2 枚の手描きの歴史地図:「1892 年のサイゴンとその周辺」とコーチシナ電信線の地図",
          "ファサードは電信科学の著名人や 5 年前の大きな時計で飾られています。",
          "ホーチミン市ブックストリートの隣にあるグエン バン ビンは緑の木々が生い茂る木陰です"
        ],
        "audioScript": [
          "サイゴン中央郵便局へようこそ。130 年以上の歴史を持つ郵便プロジェクトであり、パリ第 2 コミューンでは今も毎日活気にあふれています。",
          "建築家オーギュスト・ヴィルデューとアルフレッド・フルーの指揮のもと、1886 年から 1891 年にかけて建てられたこの建物は、輝く金色のファサードと中央にあるアンティーク時計が強い印象を与えます。",
          "メインロビーを抜けると、19世紀後半のヨーロッパの駅を思わせる高くて広い鉄骨のドームと、ドームの壁に貼られた1892年の手描きの古地図2枚に圧倒されます。",
          "郵便局のすぐ隣には、市内中心部で最も静かな読書文化空間であるグエン ヴァン ビン ブック ストリートがあります。",
          "ウィキペディア百科事典によると、ホーチミン市郵便局舎としても知られるサイゴン中央郵便局は、ホーチミン市の典型的な建築作品の 1 つで、サイゴン区パリ コミューン広場 2 番地にあります。これは、建築家マリー アルフレッド フルーの設計プロジェクトに従って、折衷的なスタイルで 1886 年から 1891 年にかけてフランス人によって建てられた建物です。ノートルダム大聖堂の隣に位置し、ホーチミン市を訪れる観光客の観光スポットでもあります。"
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
        "shortSummary": "Where young man Nguyen Tat Thanh left his country on the ship Amiral Latouche-Tréville on June 5, 1911 to find a way to save his country.",
        "historicalEra": "1863 – 1911 – Present",
        "openingHours": "07:30 – 11:30 & 13:30 – 17:00 (Tue – Sun)",
        "architecturalHighlights": [
          "Western European architecture combines Asian tiled roofs with two dragons flanking the moon in green ceramic (\"Two dragons flanking the moon\")",
          "More than 11,000 documents, artifacts and models of the Amiral Latouche-Tréville merchant ship",
          "Panoramic view of the confluence of the Saigon River - Tau Hu Canal and ancient Mong Bridge"
        ],
        "audioScript": [
          "Welcome to Nha Rong Wharf - Ho Chi Minh Museum Ho Chi Minh City branch, located right at the historical Saigon River confluence.",
          "The building was built in 1863 as the headquarters of the shipping company Messageries Maritimes. On the top of the roof are two large green glazed terracotta dragons facing the moon, so people often call it Nha Rong and the harbor in front is Nha Rong Wharf.",
          "On June 5, 1911, from this very port, young man Nguyen Tat Thanh with the name Van Ba boarded the ship Amiral Latouche-Tréville, starting a 30-year journey to find a way to save the country.",
          "According to Wikipedia encyclopedia: Nha Rong Wharf, officially named Ho Chi Minh Museum - Ho Chi Minh City Branch, is a cluster of architectural relics - museums located on the Saigon River, in Xom Chieu ward (formerly District 4), Ho Chi Minh City. This was once the headquarters of the shipping company Messageries Maritimes in Saigon from 1864 to 1955. The People's Committee of Ho Chi Minh City directed the Department of Culture, Sports and Tourism to include Nha Rong Wharf in the list of symbolic landscapes of the city."
        ]
      },
      "fr": {
        "name": "Quai Nha Rong (Musée Hô Chi Minh)",
        "shortSummary": "Où le jeune homme Nguyen Tat Thanh a quitté son pays à bord du navire Amiral Latouche-Tréville le 5 juin 1911 pour trouver un moyen de sauver son pays.",
        "historicalEra": "1863 – 1911 – Présent",
        "openingHours": "07h30 – 11h30 & 13h30 – 17h00 (Mar – Dim)",
        "architecturalHighlights": [
          "L'architecture d'Europe occidentale combine des toits de tuiles asiatiques avec deux dragons flanquant la lune en céramique verte (\"Deux dragons flanquant la lune\")",
          "Plus de 11 000 documents, artefacts et maquettes du navire marchand Amiral Latouche-Tréville",
          "Vue panoramique sur le confluent de la rivière Saigon - Canal Tau Hu et ancien pont Mong"
        ],
        "audioScript": [
          "Bienvenue au quai Nha Rong - Musée de Ho Chi Minh Branche de Ho Chi Minh-Ville, située juste au confluent historique de la rivière Saigon.",
          "Le bâtiment a été construit en 1863 comme siège de la compagnie maritime Messageries Maritimes. Sur le toit se trouvent deux grands dragons en terre cuite vernissée verte faisant face à la lune, c'est pourquoi les gens l'appellent souvent Nha Rong et le port en face est le quai de Nha Rong.",
          "Le 5 juin 1911, depuis ce même port, le jeune homme Nguyen Tat Thanh, du nom de Van Ba, monta à bord du navire Amiral Latouche-Tréville, entamant un voyage de 30 ans pour trouver un moyen de sauver le pays.",
          "Selon l'encyclopédie Wikipédia : Le quai Nha Rong, officiellement nommé Musée d'Hô Chi Minh - Branche d'Hô Chi Minh-Ville, est un groupe de reliques architecturales - musées situés sur la rivière Saigon, dans le quartier de Xom Chieu (anciennement district 4), à Hô Chi Minh-Ville. C'était autrefois le siège de la compagnie maritime Messageries Maritimes à Saigon de 1864 à 1955. Le Comité populaire de Hô Chi Minh-Ville a ordonné au ministère de la Culture, des Sports et du Tourisme d'inclure le quai de Nha Rong dans la liste des paysages symboliques de la ville."
        ]
      },
      "zh": {
        "name": "龙屋港历史遗迹（胡志明博物馆）",
        "shortSummary": "1911 年 6 月 5 日，年轻人 Nguyen Tat Thanh 乘 Amiral Latouche-Tréville 号船离开祖国，去寻找拯救国家的方法。",
        "historicalEra": "1863 – 1911年至今",
        "openingHours": "07:30 – 11:30 & 13:30 – 17:00（周二至周日）",
        "architecturalHighlights": [
          "西欧建筑将亚洲瓦片屋顶与绿色陶瓷中的两条龙侧月相结合（“两条龙侧月”）",
          "超过 11,000 份 Amiral Latouche-Tréville 商船的文件、文物和模型",
          "西贡河 - 头湖运河和古芒桥交汇处的全景"
        ],
        "audioScript": [
          "欢迎来到芽龙码头 - 胡志明博物馆胡志明市分馆，位于历史悠久的西贡河交汇处。",
          "该建筑建于 1863 年，是 Messageries Maritimes 航运公司的总部。屋顶上有两条面向月亮的巨大绿釉陶龙，所以人们常称它为芽龙，前面的港口就是芽龙码头。",
          "1911年6月5日，从这个港口，青年阮达成登上了拉图什-特雷维尔海军上将号，开始了长达30年的救国之旅。",
          "据维基百科百科介绍：芽龙码头，正式名称为胡志明博物馆 - 胡志明市分馆，是位于胡志明市 Xom Chieu 区（原第四区）西贡河畔的一组建筑遗迹 - 博物馆。这里曾是 1864 年至 1955 年间位于西贡的 Messageries Maritimes 航运公司的总部。胡志明市人民委员会指示文化、体育和旅游部将芽龙码头列入该市的标志性景观名录。"
        ]
      },
      "ja": {
        "name": "ニャロン港（ホーチミン博物館）",
        "shortSummary": "1911 年 6 月 5 日、若い男性グエン タット タインが祖国を救う方法を見つけるためにアミラル ラトゥーシュ トレヴィル号で国を出た場所。",
        "historicalEra": "1863年 – 1911年 – 現在",
        "openingHours": "07:30 – 11:30 / 13:30 – 17:00（火曜〜日曜）",
        "architecturalHighlights": [
          "西ヨーロッパの建築物は、アジア風の瓦屋根と緑色のセラミックで月の側面に配置された 2 頭の龍を組み合わせたものです (「月の側面にある 2 頭の龍」)",
          "アミラル ラトゥーシュ トレヴィル商船に関する 11,000 点を超える文書、工芸品、模型",
          "サイゴン川の合流点 - タウフ運河と古代のモン橋のパノラマビュー"
        ],
        "audioScript": [
          "ナロン埠頭 - ホーチミン博物館ホーチミン市支店へようこそ。歴史あるサイゴン川の合流点に位置します。",
          "この建物は、海運会社メッセージリー マリタイムズの本社として 1863 年に建てられました。屋根の上には月に向かって緑釉のテラコッタの大きな龍が2頭いるので、人々はここをニャロンと呼ぶことが多く、正面の港はニャロン埠頭です。",
          "1911 年 6 月 5 日、まさにこの港から、ヴァン バという名前の青年グエン タット タンはアミラル ラトゥーシュ トレヴィル号に乗り込み、国を救う方法を見つけるための 30 年間の旅を始めました。",
          "ウィキペディア百科事典によると: 正式名称はホーチミン博物館 - ホーチミン市分館というナロン埠頭は、ホーチミン市Xom Chieu区(旧4区)のサイゴン川沿いに位置する建築遺物群である博物館です。ここは、1864 年から 1955 年までサイゴンにある海運会社メッセージリーズ マリタイムズの本社でした。ホーチミン市人民委員会は、文化スポーツ観光省に対し、ナロン埠頭を市の象徴的な風景のリストに含めるよう指示しました。"
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
        "shortSummary": "National Artistic Architectural Monument inaugurated in 1900 in the Flamboyant style of the Third French Republic at Lam Son Square.",
        "historicalEra": "1898 – 1900 (Architect Félix Olivier)",
        "openingHours": "09:00 – 21:00",
        "architecturalHighlights": [
          "The facade is embossed with a relief of an artistic goddess inspired by the Petit Palais Museum (Paris)",
          "500-seat auditorium with standard acoustics and classic crystal chandeliers",
          "Located right in the heart of Dong Khoi Street and City Theater Metro Underground Station"
        ],
        "audioScript": [
          "Welcome to the Ho Chi Minh City Theater at 7 Lam Son Square, one of the most typical artistic architectural works of Saigon in the early 20th century.",
          "Started in 1898 and inaugurated on January 1, 1900 according to the project of the group of architects Félix Olivier, Ernest Guichard and Eugène Ferret, the building bears the brilliant Flamboyant style of the Third French Republic.",
          "All facade reliefs, the statue of the goddess Caryatids supporting the dome and the lobby's paving stones were crafted in France and then transported by sea to Saigon.",
          "According to Wikipedia encyclopedia: Saigon Opera House (English: Saigon Opera House), often simply called City Theater, is a theater with a facade facing Lam Son Square and Dong Khoi Street, Saigon Ward, Ho Chi Minh City. Directly managed by the City Center for Performances and Cinema (Saigon Concert) - a unit under the Department of Culture and Sports of Ho Chi Minh City."
        ]
      },
      "fr": {
        "name": "Opéra de Saïgon (Théâtre Municipal)",
        "shortSummary": "Monument architectural artistique national inauguré en 1900 dans le style flamboyant de la Troisième République française sur la place Lam Son.",
        "historicalEra": "1898 – 1900 (Félix Olivier)",
        "openingHours": "09h00 – 21h00",
        "architecturalHighlights": [
          "La façade est gaufrée d'un relief d'une déesse artistique inspiré du Musée du Petit Palais (Paris)",
          "Auditorium de 500 places avec acoustique standard et lustres en cristal classiques",
          "Situé en plein cœur de la rue Dong Khoi et de la station de métro City Theatre"
        ],
        "audioScript": [
          "Bienvenue au Théâtre de Ho Chi Minh Ville au 7 place Lam Son, l'une des œuvres architecturales artistiques les plus typiques de Saigon au début du 20e siècle.",
          "Commencé en 1898 et inauguré le 1er janvier 1900 selon le projet du groupe d'architectes Félix Olivier, Ernest Guichard et Eugène Ferret, l'édifice porte le brillant style flamboyant de la Troisième République française.",
          "Tous les reliefs de la façade, la statue de la déesse Cariatide supportant le dôme et les pavés du hall ont été réalisés en France puis transportés par voie maritime jusqu'à Saigon.",
          "Selon l'encyclopédie Wikipédia : l'Opéra de Saigon (anglais : Saigon Opera House), souvent simplement appelé City Theatre, est un théâtre avec une façade donnant sur la place Lam Son et la rue Dong Khoi, dans le quartier de Saigon, à Hô Chi Minh-Ville. Directement géré par le Centre Ville des Spectacles et du Cinéma (Concert de Saigon) - une unité relevant du Département de la Culture et des Sports de Hô Chi Minh-Ville."
        ]
      },
      "zh": {
        "name": "胡志明市大剧院（西贡歌剧院）",
        "shortSummary": "国家艺术建筑纪念碑于 1900 年在林山广场落成，具有法兰西第三共和国的华丽风格。",
        "historicalEra": "1898 – 1900年",
        "openingHours": "09:00 – 21:00",
        "architecturalHighlights": [
          "正面浮雕有艺术女神的浮雕，灵感来自小皇宫博物馆（巴黎）",
          "500 个座位的礼堂，配有标准音响效果和经典水晶吊灯",
          "位于同桂街和城市剧院地铁站的中心"
        ],
        "audioScript": [
          "欢迎来到位于林山广场 7 号的胡志明市剧院，它是 20 世纪初西贡最典型的艺术建筑作品之一。",
          "该建筑于1898年动工，于1900年1月1日落成，由建筑师费利克斯·奥利维尔（Félix Olivier）、欧内斯特·吉查德（Ernest Guichard）和欧仁·费雷（Eugène Ferret）设计，具有法兰西第三共和国辉煌的华丽风格。",
          "所有立面浮雕、支撑圆顶的女像柱雕像以及大堂的铺路石均在法国制作，然后通过海运运至西贡。",
          "据维基百科百科介绍：西贡歌剧院（英语：Saigon Opera House），通常简称为城市剧院，是胡志明市西贡区一座立面面向林山广场和东桂街的剧院。由胡志明市文化体育局下属的城市表演和电影中心（西贡音乐会）直接管理。"
        ]
      },
      "ja": {
        "name": "サイゴン・オペラハウス（市民劇場）",
        "shortSummary": "国立芸術建築記念碑。ラムソン広場にフランス第三共和国のフランボワイヤン様式で 1900 年に完成しました。",
        "historicalEra": "1898年 – 1900年",
        "openingHours": "09:00 – 21:00",
        "architecturalHighlights": [
          "ファサードにはプティ・パレ美術館（パリ）からインスピレーションを得た芸術的な女神のレリーフが施されています。",
          "標準的な音響設備とクラシックなクリスタルのシャンデリアを備えた 500 席の講堂",
          "ドンコイ通りと地下鉄シティ・シアター駅の中心部に位置"
        ],
        "audioScript": [
          "7 ラムソン広場にあるホーチミン市劇場へようこそ。この劇場は、20 世紀初頭のサイゴンの最も典型的な芸術的建築作品の 1 つです。",
          "1898 年に着工し、フェリックス オリヴィエ、エルネスト ギシャール、ウジェーヌ フェレの建築家グループのプロジェクトに従って 1900 年 1 月 1 日に落成したこの建物は、フランス第三共和国の華麗なフランボワイヤン様式を継承しています。",
          "すべてのファサードのレリーフ、ドームを支える女神カリアティードの像、ロビーの敷石はフランスで制作され、海路でサイゴンに運ばれました。",
          "ウィキペディア百科事典によると： サイゴン・オペラ・ハウス（英語: Saigon Opera House ）は、単に市立劇場とも呼ばれることがあり、ホーチミン市サイゴン区のラムソン広場とドンコイ通りに面したファサードを持つ劇場です。ホーチミン市文化スポーツ局傘下のシティ・センター・フォー・パフォーマンス・アンド・シネマ（サイゴンコンサート）が直接運営。"
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
        "shortSummary": "National Artistic Architectural Monument built from 1898 - 1909 according to the prototype of Paris City Hall, located at the beginning of Nguyen Hue Walking Street.",
        "historicalEra": "1898 – 1909 (Architect Fernand Gardès)",
        "openingHours": "Exterior & Nguyen Hue Walking Street open 24/7",
        "architecturalHighlights": [
          "The soaring bell tower simulates the Northern French Renaissance architecture of architect Femand Gardès",
          "Exquisite plaster facade and ceiling sculpture by artist - sculptor Ruffier",
          "Statue of President Ho Chi Minh and water music square on Nguyen Hue Walking Street in front"
        ],
        "audioScript": [
          "You are standing at the beginning of Nguyen Hue Walking Street avenue, in front of the Ho Chi Minh City People's Council and People's Committee headquarters building - in the past Saigon people used to call it Tay Xa Palace.",
          "Built from 1898 to 1909 according to the design of architect Femand Gardès and decorated by sculptor Ruffier, the building was inspired by the town halls of Northern France with a central bell tower and delicate floral reliefs.",
          "In 2020, the building was ranked by the Ministry of Culture, Sports and Tourism as a National Architectural and Artistic Monument and opened to visitors on major holidays.",
          "According to Wikipedia encyclopedia: Ho Chi Minh City People's Committee Headquarters is one of the classical architectural works in Ho Chi Minh City, built from 1898 to 1908, inaugurated in 1909. During the French colonial period, this building was called Hôtel de ville in French or Tay Xa Palace in Vietnamese. During the Republic of Vietnam, it was called Saigon City Hall because it was the working and meeting place of the capital government."
        ]
      },
      "fr": {
        "name": "Hôtel de Ville de Hô Chi Minh-Ville & Promenade Nguyen Hue",
        "shortSummary": "Monument architectural artistique national construit de 1898 à 1909 selon le prototype de l'hôtel de ville de Paris, situé au début de la rue piétonne Nguyen Hue.",
        "historicalEra": "1898 – 1909",
        "openingHours": "Esplanade piétonne ouverte 24h/24",
        "architecturalHighlights": [
          "Le clocher élancé simule l'architecture de la Renaissance du nord de la France de l'architecte Femand Gardès",
          "Exquise sculpture de façade et de plafond en plâtre de l'artiste - sculpteur Ruffier",
          "Statue du président Hô Chi Minh et place de la musique aquatique sur la rue piétonne Nguyen Hue en face"
        ],
        "audioScript": [
          "Vous vous trouvez au début de l'avenue piétonne Nguyen Hue, devant le bâtiment du siège du Conseil populaire et du Comité populaire de Hô Chi Minh-Ville - autrefois, les Saigonnais l'appelaient le palais Tay Xa.",
          "Construit de 1898 à 1909 selon les plans de l'architecte Femand Gardès et décoré par le sculpteur Ruffier, l'édifice s'inspire des mairies du Nord de la France avec un clocher central et de délicats reliefs floraux.",
          "En 2020, le bâtiment a été classé par le ministère de la Culture, des Sports et du Tourisme comme monument architectural et artistique national et ouvert aux visiteurs lors des grandes vacances.",
          "Selon l'encyclopédie Wikipédia : Le siège du Comité populaire de Hô Chi Minh-Ville est l'une des œuvres architecturales classiques de Hô Chi Minh-Ville, construit de 1898 à 1908, inauguré en 1909. Pendant la période coloniale française, ce bâtiment s'appelait Hôtel de ville en français ou Palais Tay Xa en vietnamien. Durant la République du Vietnam, on l'appelait Hôtel de Ville de Saigon car c'était le lieu de travail et de réunion du gouvernement de la capitale."
        ]
      },
      "zh": {
        "name": "胡志明市人民委员会总部（市政厅）与阮惠步行街",
        "shortSummary": "国家艺术建筑纪念碑，建于1898年至1909年，按照巴黎市政厅的原型建造，位于阮惠步行街的起点。",
        "historicalEra": "1898 – 1909年",
        "openingHours": "步行街全天开放",
        "architecturalHighlights": [
          "高耸的钟楼模仿了建筑师 Femand Gardès 的法国北部文艺复兴时期的建筑风格",
          "艺术家雕塑家 Ruffier 的精美石膏立面和天花板雕塑",
          "胡志明主席雕像和前面阮惠步行街的水上音乐广场"
        ],
        "audioScript": [
          "您现在正站在阮惠步行街的起点，胡志明市人民议会和人民委员会总部大楼前——过去西贡人习惯称其为Tay Xa宫。",
          "该建筑建于1898年至1909年，根据建筑师Femand Gardès的设计，由雕塑家Ruffier装饰，其灵感来自法国北部的市政厅，拥有中央钟楼和精致的花卉浮雕。",
          "2020年，该建筑被文化体育和旅游部列为国家建筑艺术纪念碑，并在重大节假日向游客开放。",
          "据维基百科百科介绍：胡志明市人民委员会总部是胡志明市的古典建筑作品之一，建于1898年至1908年，1909年落成。在法国殖民时期，这座建筑在法语中被称为Hôtel de ville，在越南语中被称为Tay Xa Palace。越南共和国时期，它被称为西贡市政厅，因为它是首都政府的工作和会议场所。"
        ]
      },
      "ja": {
        "name": "ホーチミン市人民委員会庁舎とグエンフエ歩行者天国",
        "shortSummary": "パリ市庁舎の原型に基づいて 1898 年から 1909 年にかけて建てられた国立芸術建築記念碑。グエン フエ ウォーキング ストリートの始まりに位置します。",
        "historicalEra": "1898年 – 1909年",
        "openingHours": "グエンフエ歩行者天国は終日開放",
        "architecturalHighlights": [
          "そびえ立つ鐘楼は、建築家フェマン・ガルデスの北フランス・ルネッサンス建築を模倣しています。",
          "アーティスト - 彫刻家ルフィエによる精巧な漆喰のファサードと天井の彫刻",
          "ホーチミン大統領像とグエンフエウォーキングストリート正面の水上音楽広場"
        ],
        "audioScript": [
          "あなたは、ホーチミン市人民評議会と人民委員会本部の建物の前、グエンフエウォーキングストリートの大通りの始まりに立っています。かつてサイゴンの人々はここをタイサー宮殿と呼んでいました。",
          "建築家フェマン ガルデスの設計に従って 1898 年から 1909 年にかけて建てられ、彫刻家ルフィエによって装飾されたこの建物は、中央の鐘楼と繊細な花のレリーフを備えた北フランスの市庁舎からインスピレーションを受けています。",
          "2020 年、この建物は文化スポーツ観光省によって国家建築芸術記念碑に指定され、主要な祝日に訪問者に公開されました。",
          "ウィキペディア百科事典によると、ホーチミン市人民委員会本部はホーチミン市の古典的な建築作品の 1 つで、1898 年から 1908 年にかけて建設され、1909 年に完成しました。フランス植民地時代には、この建物はフランス語でオテル ド ヴィル、ベトナム語でタイサー宮殿と呼ばれていました。ベトナム共和国時代には、首都政府の執務および会議の場であったため、サイゴン市庁舎と呼ばれていました。"
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
        "shortSummary": "The historic market was inaugurated in 1914 with a 3-sided clock tower at Cua Nam and Bien Hoa ceramic reliefs at the 4 main gates.",
        "historicalEra": "1859 – 1914",
        "openingHours": "06:00 – 23:00 Daily",
        "architecturalHighlights": [
          "The iconic 3-sided clock tower at Cua Nam faces Quach Thi Trang square",
          "The four main gates East - West - South - North are mounted with reliefs of Bien Hoa ceramics in 1952 by artist Le Van Mau.",
          "Traditional Southern culinary paradise with more than 1,400 stalls"
        ],
        "audioScript": [
          "Welcome to Ben Thanh Market, the bustling commercial heart and cultural symbol of Saigon - Ho Chi Minh City for more than a century.",
          "Originating from the ancient market on the banks of the Ben Nghe River near Gia Dinh citadel before 1859, the market at its current location was started in 1912 and opened to welcome visitors in March 1914.",
          "The most famous architectural highlight is the three-sided clock tower at Cua Nam, along with Bien Hoa ceramic reliefs embossed with images of cows, rays, and bananas mounted on four market gates since 1952.",
          "According to Wikipedia encyclopedia: Ben Thanh Market is a market located in Ben Thanh ward, Ho Chi Minh City. The market was started to be built in 1912, the clock image at the south gate of this market is considered the unofficial symbol of Ho Chi Minh City. The market is located between Phan Boi Chau - Phan Chu Trinh - Le Thanh Ton - Quach Thi Trang Square in Ben Thanh Ward with an area of ​​13,056 m². The main business sectors here include: clothing, fabrics, shoes, fashion, handicrafts, fresh food, fruits, fresh flowers,..."
        ]
      },
      "fr": {
        "name": "Marché Ben Thanh",
        "shortSummary": "Le marché historique a été inauguré en 1914 avec une tour d'horloge à 3 côtés à Cua Nam et des reliefs en céramique de Bien Hoa aux 4 portes principales.",
        "historicalEra": "1912 – 1914",
        "openingHours": "06h00 – 23h00",
        "architecturalHighlights": [
          "L'emblématique tour de l'horloge à 3 côtés de Cua Nam fait face à la place Quach Thi Trang",
          "Les quatre portes principales Est - Ouest - Sud - Nord sont ornées de reliefs en céramique de Bien Hoa réalisés en 1952 par l'artiste Le Van Mau.",
          "Paradis culinaire traditionnel du Sud avec plus de 1 400 stands"
        ],
        "audioScript": [
          "Bienvenue au marché Ben Thanh, cœur commercial animé et symbole culturel de Saigon - Ho Chi Minh Ville depuis plus d'un siècle.",
          "Originaire de l'ancien marché sur les rives de la rivière Ben Nghe, près de la citadelle de Gia Dinh, avant 1859, le marché à son emplacement actuel a été inauguré en 1912 et ouvert aux visiteurs en mars 1914.",
          "Le point culminant architectural le plus célèbre est la tour de l'horloge à trois côtés de Cua Nam, ainsi que les reliefs en céramique de Bien Hoa représentant des images de vaches, de raies et de bananes, montés sur quatre portes du marché depuis 1952.",
          "Selon l'encyclopédie Wikipédia : Le marché Ben Thanh est un marché situé dans le quartier Ben Thanh, à Hô Chi Minh-Ville. La construction du marché a commencé en 1912, l'image de l'horloge à la porte sud de ce marché est considérée comme le symbole non officiel de Hô Chi Minh-Ville. Le marché est situé entre la place Phan Boi Chau - Phan Chu Trinh - Le Thanh Ton - Quach Thi Trang dans le quartier Ben Thanh d'une superficie de 13 056 m². Les principaux secteurs d'activité sont : l'habillement, les tissus, les chaussures, la mode, l'artisanat, les produits frais, les fruits, les fleurs fraîches,..."
        ]
      },
      "zh": {
        "name": "滨城市场（西贡百年市集地标）",
        "shortSummary": "这个历史悠久的市场于 1914 年落成，在 Cua Nam 设有 3 面钟楼，4 个大门设有边和陶瓷浮雕。",
        "historicalEra": "1912 – 1914年",
        "openingHours": "06:00 – 23:00",
        "architecturalHighlights": [
          "Cua Nam 标志性的三面钟楼面向 Quach Thi Trang 广场",
          "东、西、南、北四个大门上镶嵌着艺术家 Le Van Mau 于 1952 年创作的边和陶瓷浮雕。",
          "传统南方美食天堂，拥有 1,400 多个摊位"
        ],
        "audioScript": [
          "欢迎来到滨城市场，这是一个多世纪以来西贡 - 胡志明市繁华的商业中心和文化象征。",
          "起源于 1859 年之前位于嘉定城堡附近滨义河畔的古老市场，现址市场于 1912 年开始动工，并于 1914 年 3 月开放接待游客。",
          "最著名的建筑亮点是 Cua Nam 的三边钟楼，以及自 1952 年以来安装在四个市场大门上的边和陶瓷浮雕，浮雕上刻有牛、鳐鱼和香蕉的图像。",
          "根据维基百科百科：滨城市场是位于胡志明市滨城区的一个市场。该市场于1912年开始兴建，市场南门的时钟图像被认为是胡志明市的非官方象征。该市场位于Ben Thanh Ward的Phan Boi Chau - Phan Chu Trinh - Le Thanh Ton - Quach Thi Trang广场之间，面积为13,056平方米。这里的主要经营板块有：服装、面料、鞋帽、时装、工艺品、生鲜食品、水果、鲜花、..."
        ]
      },
      "ja": {
        "name": "ベンタイン市場",
        "shortSummary": "この歴史的な市場は 1914 年に開設され、クア ナムには 3 面の時計塔が、4 つのメイン ゲートにはビエン ホアの陶器のレリーフが建てられました。",
        "historicalEra": "1912年 – 1914年",
        "openingHours": "06:00 – 23:00",
        "architecturalHighlights": [
          "クアナムの象徴的な 3 面の時計塔はクア ティ チャン広場に面しています",
          "東、西、南、北の 4 つの正門には、1952 年に芸術家レ ヴァン マウによって制作されたビエン ホア陶器のレリーフが取り付けられています。",
          "1,400 以上の屋台が並ぶ伝統的な南部料理の楽園"
        ],
        "audioScript": [
          "ベンタイン市場へようこそ。1 世紀以上にわたってサイゴン - ホーチミン市のにぎやかな商業の中心地であり、文化的象徴でもあります。",
          "1859 年以前にザーディン城塞の近くのベンゲ川のほとりにあった古代市場が起源で、現在の場所にある市場は 1912 年に開設され、1914 年 3 月に訪問者を迎えるためにオープンしました。",
          "最も有名な建築上のハイライトは、クア ナムの三面時計塔と、1952 年以来 4 つの市場の門に取り付けられた、牛、エイ、バナナの絵が浮き彫りにされたビエン ホアのセラミック レリーフです。",
          "ウィキペディア百科事典によると、ベンタイン市場はホーチミン市ベンタイン区にある市場です。この市場は 1912 年に建設が開始され、この市場の南門にある時計の絵はホーチミン市の非公式のシンボルとみなされています。この市場はベンタイン区のファンボイチャウ～ファンチューチン～レタントン～クアチチャン広場の間に位置しており、面積は13,056㎡です。ここの主な事業分野には、衣料品、生地、靴、ファッション、手工芸品、生鮮食品、果物、生花などが含まれます。"
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
        "shortSummary": "The member museum of the Museums for World Peace (INMP) system preserves more than 20,000 valuable documents, films and historical artifacts.",
        "historicalEra": "Established September 4, 1975",
        "openingHours": "07:30 – 17:30 Daily",
        "architecturalHighlights": [
          "Outdoor display area of military equipment: UH-1 helicopter, F-5A aircraft, M48 tank",
          "Collection of battlefield reportage photos \"Recollections\" by 134 international reporters",
          "The space recreates Con Dao's \"Tiger Cage\" and the For Peace education room"
        ],
        "audioScript": [
          "Welcome to the War Remnants Museum at 28 Vo Van Tan, District 3 - one of the museums that attracts the most domestic and international visitors in Vietnam.",
          "Established on September 4, 1975 and a member of the UNESCO International Network of Museums for Peace, it houses more than 20,000 authentic documents, artifacts and films.",
          "In particular, the \"Recollection\" gallery on the upper floor introduces hundreds of photographic works by 134 war correspondents from 11 countries, conveying a profound humanistic message about the value of peace.",
          "According to Wikipedia encyclopedia: War Remnants Museum is a museum for peace at 28 Vo Van Tan Street, Xuan Hoa Ward, Ho Chi Minh City. The War Remnants Museum belongs to the Department of Culture and Sports of Ho Chi Minh City, and is a member of the Museums for World Peace system and the World Council of Museums (ICOM). For many years, the War Remnants Museum has been one of the attractions attracting the largest number of visitors in Ho Chi Minh City and the whole country. Through 50 years of establishment and development (1975 - 2025), the Museum has welcomed more than 23 million visitors..."
        ]
      },
      "fr": {
        "name": "Musée des Vestiges de la Guerre",
        "shortSummary": "Le musée membre du système Musées pour la paix mondiale (INMP) conserve plus de 20 000 documents, films et objets historiques précieux.",
        "historicalEra": "Fondé en 1975",
        "openingHours": "07h30 – 17h30 tous les jours",
        "architecturalHighlights": [
          "Zone d'exposition extérieure d'équipements militaires : hélicoptère UH-1, avion F-5A, char M48",
          "Collection de photos de reportages sur les champs de bataille \"Souvenirs\" de 134 reporters internationaux",
          "L'espace recrée la \"Cage du Tigre\" de Con Dao et la salle d'éducation For Peace"
        ],
        "audioScript": [
          "Bienvenue au Musée des Vestiges de Guerre au 28 Vo Van Tan, District 3 - l'un des musées qui attire le plus de visiteurs nationaux et internationaux au Vietnam.",
          "Créé le 4 septembre 1975 et membre du Réseau international des musées pour la paix de l'UNESCO, il abrite plus de 20 000 documents, artefacts et films authentiques.",
          "En particulier, la galerie « Souvenirs » à l'étage supérieur présente des centaines d'œuvres photographiques de 134 correspondants de guerre de 11 pays, véhiculant un profond message humaniste sur la valeur de la paix.",
          "Selon l'encyclopédie Wikipédia : le Musée des vestiges de guerre est un musée pour la paix situé au 28 rue Vo Van Tan, quartier de Xuan Hoa, à Hô Chi Minh-Ville. Le Musée des vestiges de guerre appartient au Département de la culture et des sports de Hô Chi Minh-Ville et est membre du système Musées pour la paix mondiale et du Conseil mondial des musées (ICOM). Depuis de nombreuses années, le Musée des Vestiges de Guerre est l'une des attractions attirant le plus grand nombre de visiteurs à Hô Chi Minh-Ville et dans tout le pays. En 50 ans de création et de développement (1975 - 2025), le Musée a accueilli plus de 23 millions de visiteurs..."
        ]
      },
      "zh": {
        "name": "战争遗迹博物馆",
        "shortSummary": "世界和平博物馆 (INMP) 系统的成员博物馆保存了 20,000 多件珍贵的文献、影片和历史文物。",
        "historicalEra": "成立于1975年9月4日",
        "openingHours": "07:30 – 17:30",
        "architecturalHighlights": [
          "户外军事装备展示区：UH-1直升机、F-5A飞机、M48坦克",
          "134位国际记者的战地报道摄影集《回忆》",
          "该空间再现了昆岛的“虎笼”和和平教育室"
        ],
        "audioScript": [
          "欢迎来到位于第 3 区 Vo Van Tan 28 号的战争遗迹博物馆 - 这是越南吸引最多国内外游客的博物馆之一。",
          "该博物馆成立于 1975 年 9 月 4 日，是联合国教科文组织国际和平博物馆网络的成员，收藏有 20,000 多件真实的文献、文物和影片。",
          "特别是楼上的“回忆”画廊，展出了来自11个国家的134名战地记者的数百幅摄影作品，传达了关于和平价值的深刻人文信息。",
          "根据维基百科百科全书：战争遗迹博物馆是一座和平博物馆，位于胡志明市宣和区武文新街28号。战争遗迹博物馆隶属于胡志明市文化体育局，是世界和平博物馆系统和世界博物馆理事会（ICOM）的成员。多年来，战争遗迹博物馆一直是胡志明市乃至全国吸引游客最多的景点之一。经过50年的建立和发展（1975年至2025年），博物馆已接待了超过2300万参观者......"
        ]
      },
      "ja": {
        "name": "戦争証跡博物館",
        "shortSummary": "世界平和博物館 (INMP) システムの会員博物館には、20,000 点を超える貴重な文書、映画、歴史的工芸品が保存されています。",
        "historicalEra": "1975年9月4日設立",
        "openingHours": "07:30 – 17:30（年中無休）",
        "architecturalHighlights": [
          "軍事装備の屋外展示エリア: UH-1 ヘリコプター、F-5A 航空機、M48 戦車",
          "海外記者134名による戦場ルポ写真集『Recollections』",
          "コンダオの「虎の檻」と平和のための教育室を再現した空間"
        ],
        "audioScript": [
          "3 区 28 Vo Van Tan にある戦争証跡博物館へようこそ。ベトナム国内および海外から最も多くの観光客が集まる博物館の 1 つです。",
          "1975 年 9 月 4 日に設立され、ユネスコ平和博物館国際ネットワークのメンバーとして、20,000 点以上の本物の文書、工芸品、映画を収蔵しています。",
          "特に、上階のギャラリー「追憶」では、11か国の従軍記者134名による数百点の写真作品を紹介し、平和の大切さについての深い人間味あふれるメッセージを伝えています。",
          "ウィキペディア百科事典によると、戦争証跡博物館は、ホーチミン市スアンホア区ボー・ヴァン・タン通り28番地にある平和博物館です。戦争証跡博物館はホーチミン市文化スポーツ省に属し、世界平和博物館システムおよび世界博物館評議会 (ICOM) のメンバーです。戦争証跡博物館は、長年にわたり、ホーチミン市および全国で最も多くの訪問者を集める名所の 1 つです。 50 年間の設立と発展 (1975 ～ 2025 年) を通じて、博物館は 2,300 万人以上の訪問者を迎えてきました。"
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
        "shortSummary": "The Indochina architectural heritage complex (1929) by architect Ernest Hébrard is located within the grounds of the Saigon Botanical Garden established in 1864 - one of the eight oldest botanical gardens in the world.",
        "historicalEra": "1864 – 1929",
        "openingHours": "07:00 – 17:30 Daily",
        "architecturalHighlights": [
          "History Museum building (Museum Blanchard de la Brosse 1929) with Indochinese style octagonal tower by architect Ernest Hébrard",
          "Preserving 12 National Treasures (Dong Duong Buddha Statue, Vishnu Statue, Oc Eo Cultural Gold Collection - Champa)",
          "Ancient Hung King Temple (1926) with wooden columns carved with dragons and phoenixes painted red and gilded",
          "Saigon Zoo (1864) by botanist J.B. Louis Pierre planning"
        ],
        "audioScript": [
          "Welcome to the Ho Chi Minh City History Museum Complex, King Hung Temple and Saigon Zoo at 2 Nguyen Binh Khiem, District 1.",
          "Saigon Zoo was established in March 1864 under the leadership of botanist Jean Baptiste Louis Pierre, and is currently one of the eight oldest continuously operating botanical and zoological gardens in the world.",
          "Right at the main gate is the History Museum inaugurated in 1929 in the classic Indochine style design of architect Ernest Hébrard, which preserves more than 43,000 artifacts and 12 National Treasures from Dong Son, Oc Eo, Champa cultures to the Nguyen Dynasty.",
          "According to Wikipedia encyclopedia: Ho Chi Minh City Museum of History is located at 2 Nguyen Binh Khiem Street, Saigon Ward, within the grounds of the Saigon Zoo and Botanical Garden. This is a place to preserve and display tens of thousands of precious artifacts collected inside and outside Vietnam."
        ]
      },
      "fr": {
        "name": "Musée d’Histoire du Vietnam & Jardin Botanique de Saïgon",
        "shortSummary": "L'ensemble du patrimoine architectural d'Indochine (1929) de l'architecte Ernest Hébrard est situé dans l'enceinte du Jardin botanique de Saïgon créé en 1864, l'un des huit plus anciens jardins botaniques du monde.",
        "historicalEra": "1864 – 1929",
        "openingHours": "07h00 – 17h30",
        "architecturalHighlights": [
          "Bâtiment du Musée d'Histoire (Musée Blanchard de la Brosse 1929) avec tour octogonale de style indochinois de l'architecte Ernest Hébrard",
          "Préserver 12 trésors nationaux (Statue de Bouddha Dong Duong, Statue de Vishnu, Collection d'or culturel Oc Eo - Champa)",
          "Ancien temple du Roi Hung (1926) avec des colonnes en bois sculptées de dragons et de phénix peints en rouge et doré",
          "Zoo de Saigon (1864) par le botaniste J.B. Louis Pierre"
        ],
        "audioScript": [
          "Bienvenue au complexe du musée d'histoire de Hô Chi Minh-Ville, au temple King Hung et au zoo de Saigon, au 2 Nguyen Binh Khiem, district 1.",
          "Le zoo de Saigon a été créé en mars 1864 sous la direction du botaniste Jean Baptiste Louis Pierre et est actuellement l'un des huit plus anciens jardins botaniques et zoologiques en activité au monde.",
          "Juste à l'entrée principale se trouve le musée d'histoire inauguré en 1929 dans le style classique indochine de l'architecte Ernest Hébrard, qui préserve plus de 43 000 artefacts et 12 trésors nationaux des cultures Dong Son, Oc Eo et Champa jusqu'à la dynastie des Nguyen.",
          "Selon l'encyclopédie Wikipédia : Le musée d'histoire de Hô Chi Minh-Ville est situé au 2, rue Nguyen Binh Khiem, dans le quartier de Saigon, dans l'enceinte du zoo et du jardin botanique de Saigon. C'est un lieu de préservation et d'exposition de dizaines de milliers d'objets précieux collectés au Vietnam et à l'étranger."
        ]
      },
      "zh": {
        "name": "胡志明市历史博物馆、雄王庙与西贡动植物园",
        "shortSummary": "印度支那建筑遗产综合体（1929 年）由建筑师 Ernest Hébrard 设计，位于西贡植物园内，西贡植物园建于 1864 年，是世界上八个最古老的植物园之一。",
        "historicalEra": "1864 – 1929年",
        "openingHours": "07:00 – 17:30",
        "architecturalHighlights": [
          "历史博物馆建筑（布兰查德拉布罗斯博物馆，1929 年），拥有印度支那风格的八角塔，由建筑师 Ernest Hébrard 设计",
          "保护 12 件国宝（Dong Duong 佛像、Vishnu 雕像、Oc Eo 文化黄金收藏 - 占婆）",
          "古雄王庙（1926年），木柱雕龙凤，漆红鎏金",
          "西贡动物园 (1864) 由植物学家 J.B. Louis Pierre 规划"
        ],
        "audioScript": [
          "欢迎来到胡志明市历史博物馆大楼、景洪寺和西贡动物园，地址：2 Nguyen Binh Khiem, District 1。",
          "西贡动物园于 1864 年 3 月在植物学家让·巴蒂斯特·路易·皮埃尔 (Jean Baptiste Louis Pierre) 的领导下建立，目前是世界上八座持续运营的最古老的动植物园之一。",
          "正门旁是历史博物馆，于 1929 年落成，采用建筑师 Ernest Hébrard 的经典印度支那风格设计，保存了从同山文化、Oc Eo 文化、占城文化到阮朝的 43,000 多件文物和 12 件国宝。",
          "根据维基百科百科全书：胡志明市历史博物馆位于西贡区阮平谦街 2 号，西贡动植物园内。这里保存和展示了越南国内外收集的数万件珍贵文物。"
        ]
      },
      "ja": {
        "name": "ベトナム歴史博物館・フン王廟・サイゴン動植物園",
        "shortSummary": "建築家エルネスト・エブラールによるインドシナ建築遺産複合施設 (1929 年) は、1864 年に設立された世界最古の植物園 8 つのうちの 1 つであるサイゴン植物園の敷地内にあります。",
        "historicalEra": "1864年 – 1929年",
        "openingHours": "07:00 – 17:30",
        "architecturalHighlights": [
          "建築家エルネスト・エブラールによるインドシナ様式の八角形の塔を持つ歴史博物館の建物（ブランシャール・ド・ラ・ブロス美術館、1929年）",
          "12 点の国宝の保存 (ドンズオン仏像、ヴィシュヌ像、オセオ文化黄金コレクション - チャンパ)",
          "古代の弘王寺 (1926 年)、赤く塗られ、金メッキが施された龍と鳳凰の彫刻が施された木の柱がある",
          "サイゴン動物園 (1864 年) 植物学者 J.B. ルイ・ピエールによる計画"
        ],
        "audioScript": [
          "1 区グエンビンキエム 2 にあるホーチミン市歴史博物館複合施設、キンフン寺院、サイゴン動物園へようこそ。",
          "サイゴン動物園は、植物学者ジャン バティスト ルイ ピエールの指導の下、1864 年 3 月に設立され、現在、継続的に運営されている世界で最も古い 8 つの植物園および動物園の 1 つです。",
          "正門のすぐそばには、建築家エルネスト・エブラードによる古典的なインドシナ様式の設計で 1929 年に開館した歴史博物館があり、ドンソン、オクエオ、チャンパの文化からグエン王朝に至るまで、43,000 点以上の工芸品と 12 点の国宝が保存されています。",
          "ウィキペディア百科事典によると: ホーチミン市歴史博物館は、サイゴン区グエン ビン キエム通り 2 番地、サイゴン動植物園の敷地内にあります。ここは、ベトナム国内外で収集された数万点の貴重な工芸品を保存、展示する場所です。"
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
        "shortSummary": "The ancient Art Deco and Asian mansion built in 1929 of the Hua Bon Hoa (Uncle Hoa) family, where the National Treasure \"North Central South Spring Garden\" by famous artist Nguyen Gia Tri is kept.",
        "historicalEra": "1929 – 1934 (Architect Rivera)",
        "openingHours": "08:00 – 17:00 Daily",
        "architecturalHighlights": [
          "The 99-door golden mansion combines French Art Deco architecture and Asian lapis lazuli tile roof",
          "The oldest wooden elevator in Saigon, installed in 1929, is still original",
          "Preserving the National Treasure lacquer paintings \"North Central South Spring Garden\" (Nguyen Gia Tri) and \"Youth in the Field\" (Nguyen Sang)"
        ],
        "audioScript": [
          "Welcome to the Ho Chi Minh City Museum of Fine Arts at 97A Pho Duc Chinh, District 1 - the mansion that once belonged to the merchant family Hua Bon Hoa, also known as Chu Hoa.",
          "Designed by French architect Rivera in 1929 and completed in 1934, the mansion is a beautiful intersection between European Art Deco style and traditional Asian patterned ceramic and lapis lazuli tile roofs.",
          "This is also the first private building in Saigon to be equipped with a sophisticated carved wooden elevator, while also storing more than 22,000 works of fine art and priceless National Treasures.",
          "According to Wikipedia encyclopedia: Ho Chi Minh City Museum of Fine Arts is located at 97 Pho Duc Chinh, Ben Thanh Ward, Ho Chi Minh City, Vietnam; was established in 1987 and went into operation in 1991. The building consists of 3 floors, displaying works of painting, sculpture, and antiques of high aesthetic value. This is one of the largest fine arts centers in the country."
        ]
      },
      "fr": {
        "name": "Musée des Beaux-Arts de Hô Chi Minh-Ville (Villa Hua Bon Hoa)",
        "shortSummary": "L'ancien manoir Art déco et asiatique construit en 1929 par la famille Hua Bon Hoa (Oncle Hoa), où est conservé le trésor national « Jardin de printemps du centre-nord et du sud » du célèbre artiste Nguyen Gia Tri.",
        "historicalEra": "1929 – 1934 (Architecte Rivera)",
        "openingHours": "08h00 – 17h00",
        "architecturalHighlights": [
          "Le manoir doré de 99 portes allie l'architecture Art déco française et le toit de tuiles asiatiques en lapis-lazuli",
          "Le plus ancien ascenseur en bois de Saigon, installé en 1929, est encore d'origine",
          "Préserver les peintures en laque du Trésor national « Jardin de printemps du centre-nord du sud » (Nguyen Gia Tri) et « Jeunesse sur le terrain » (Nguyen Sang)"
        ],
        "audioScript": [
          "Bienvenue au Musée des Beaux-Arts de Hô Chi Minh-Ville, au 97A Pho Duc Chinh, District 1 - le manoir qui appartenait autrefois à la famille de marchands Hua Bon Hoa, également connue sous le nom de Chu Hoa.",
          "Conçu par l'architecte français Rivera en 1929 et achevé en 1934, le manoir est une belle intersection entre le style Art déco européen et les toits traditionnels asiatiques en céramique et en tuiles de lapis-lazuli.",
          "Il s'agit également du premier bâtiment privé de Saigon à être équipé d'un ascenseur sophistiqué en bois sculpté, tout en stockant plus de 22 000 œuvres d'art et trésors nationaux inestimables.",
          "Selon l'encyclopédie Wikipédia : Le musée des beaux-arts de Hô Chi Minh-Ville est situé au 97 Pho Duc Chinh, quartier Ben Thanh, Hô Chi Minh-Ville, Vietnam ; a été créé en 1987 et est entré en service en 1991. Le bâtiment se compose de 3 étages et expose des œuvres de peinture, de sculpture et des antiquités de haute valeur esthétique. C'est l'un des plus grands centres des beaux-arts du pays."
        ]
      },
      "zh": {
        "name": "胡志明市美术馆（华本和家族古宅）",
        "shortSummary": "这座古老的装饰艺术和亚洲豪宅建于 1929 年，是华邦和 (Hua Bon Hoa) 家族的宅邸，里面保存着著名艺术家阮嘉智 (Nguyen Gia Tri) 创作的国宝“北中南春花园”。",
        "historicalEra": "1929 – 1934年",
        "openingHours": "08:00 – 17:00",
        "architecturalHighlights": [
          "99门金色豪宅融合了法国装饰艺术建筑和亚洲青金石瓦屋顶",
          "西贡最古老的木制电梯，于 1929 年安装，至今仍保持原貌",
          "保存国宝漆画《北中南春园》（阮嘉智）和《青春田野》（阮桑）"
        ],
        "audioScript": [
          "欢迎来到位于第一区 Pho Duc Chinh 97A 号的胡志明市美术馆，这座宅邸曾经属于商人家族 Hua Bon Hoa（又名 Chu Hoa）。",
          "这座豪宅由法国建筑师里维拉于 1929 年设计，于 1934 年竣工，是欧洲装饰艺术风格与传统亚洲图案陶瓷和青金石瓦屋顶的美丽交汇点。",
          "这也是西贡第一座配备精致雕花木电梯的私人建筑，同时还存放着超过22,000件美术作品和无价国宝。",
          "根据维基百科百科：胡志明市美术馆位于 97 Pho Duc Chinh, Ben Thanh Ward, Ho Chi Minh City, Vietnam； 1987年成立，1991年投入使用。建筑共3层，展示具有较高审美价值的绘画、雕塑、古董等作品。这是该国最大的美术中心之一。"
        ]
      },
      "ja": {
        "name": "ホーチミン市美術博物館（フア・ボン・ホア邸）",
        "shortSummary": "1929 年にホア ボン ホア (ホアおじさん) 家によって建てられた古代のアールデコ様式とアジア風の邸宅。有名な芸術家グエン ギア トリによる国宝「北中南春庭園」が保管されています。",
        "historicalEra": "1929年 – 1934年",
        "openingHours": "08:00 – 17:00",
        "architecturalHighlights": [
          "99 ドアの黄金の邸宅は、フランスのアールデコ建築とアジアのラピスラズリ瓦屋根を組み合わせたものです。",
          "1929 年に設置されたサイゴン最古の木造エレベーターは今も当時の姿を保っています",
          "国宝漆絵「北中南春庭図」（グエン・ザ・トリ）と「野原の若者」（グエン・サン）の保存"
        ],
        "audioScript": [
          "1 区 97A Pho Duc Chinh にあるホーチミン市立美術館へようこそ。この博物館はかつて商家フア ボン ホア (別名チュー ホア) が所有していた邸宅です。",
          "1929 年にフランス人建築家リベラによって設計され、1934 年に完成したこの邸宅は、ヨーロッパのアールデコ様式と伝統的なアジアの模様のあるセラミックとラピスラズリのタイル屋根が美しく交差しています。",
          "これは、洗練された彫刻が施された木製エレベーターを備えたサイゴン初の民間建物でもあり、22,000 点以上の美術品や貴重な国宝も保管されています。",
          "ウィキペディア百科事典によると: ホーチミン市立美術館は、ベトナム、ホーチミン市ベンタイン区 Pho Duc Chinh 97 にあります。 1987年に設立され、1991年に稼働しました。建物は3階建てで、美的価値の高い絵画、彫刻、骨董品などを展示しています。これは国内最大級の美術センターです。"
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
        "shortSummary": "National Artistic Architectural Monument built from 1885 - 1890 according to the design of architect Alfred Foulhoux, comprehensively recreating 300 years of history of Saigon - Gia Dinh - Ho Chi Minh City.",
        "historicalEra": "1885 – 1890 (Architect Alfred Foulhoux)",
        "openingHours": "08:00 – 17:00 Daily",
        "architecturalHighlights": [
          "White marble hall staircase and French Neoclassical dome",
          "9 specialized galleries on geology, archaeology, Saigon trading port, currency and revolutionary struggle",
          "Secret tunnel system and 2-hectare ancient garden in the heart of District 1"
        ],
        "audioScript": [
          "Welcome to the Ho Chi Minh City Museum at 65 Ly Tu Trong, a building once known as Gia Long Palace.",
          "Started in 1885 and completed in 1890 according to the design of architect Alfred Foulhoux, the mansion has majestic Neoclassical beauty, combined with a solid underground tunnel system below.",
          "Here, you will go back in time to explore more than 300 years of formation and development of the land of Saigon - Gia Dinh - Ho Chi Minh City.",
          "According to Wikipedia encyclopedia: Ho Chi Minh City Museum is a museum in Ho Chi Minh City, Vietnam, located at 65 Ly Tu Trong, Saigon Ward, Ho Chi Minh City, on a land area of nearly 2 hectares, limited by Ly Tu Trong, Pasteur, Le Thanh Ton and Nam Ky Khoi Nghia streets."
        ]
      },
      "fr": {
        "name": "Musée de Hô Chi Minh-Ville (Ancien Palais Gia Long)",
        "shortSummary": "Monument architectural artistique national construit de 1885 à 1890 selon les plans de l'architecte Alfred Foulhoux, recréant intégralement 300 ans d'histoire de Saigon - Gia Dinh - Ho Chi Minh Ville.",
        "historicalEra": "1885 – 1890 (Alfred Foulhoux)",
        "openingHours": "08h00 – 17h00",
        "architecturalHighlights": [
          "Escalier de hall en marbre blanc et dôme néoclassique français",
          "9 galeries spécialisées sur la géologie, l'archéologie, le port de commerce de Saigon, la monnaie et la lutte révolutionnaire",
          "Système de tunnels secrets et jardin ancien de 2 hectares au cœur du district 1"
        ],
        "audioScript": [
          "Bienvenue au musée d'Hô Chi Minh-Ville au 65 Ly Tu Trong, un bâtiment autrefois connu sous le nom de palais Gia Long.",
          "Commencé en 1885 et achevé en 1890 selon les plans de l'architecte Alfred Foulhoux, le manoir présente une beauté néoclassique majestueuse, combinée à un solide système de tunnels souterrains.",
          "Ici, vous remonterez le temps pour explorer plus de 300 ans de formation et de développement du pays de Saigon - Gia Dinh - Ho Chi Minh Ville.",
          "Selon l'encyclopédie Wikipédia : Le musée d'Hô Chi Minh-Ville est un musée d'Hô Chi Minh-Ville, au Vietnam, situé au 65 Ly Tu Trong, quartier Saigon, Hô Chi Minh-Ville, sur un terrain de près de 2 hectares, limité par les rues Ly Tu Trong, Pasteur, Le Thanh Ton et Nam Ky Khoi Nghia."
        ]
      },
      "zh": {
        "name": "胡志明市博物馆（原嘉隆宫）",
        "shortSummary": "国家艺术建筑纪念碑，建于1885年至1890年，根据建筑师Alfred Foulhoux的设计，全面再现了西贡-嘉定-胡志明市300年的历史。",
        "historicalEra": "1885 – 1890年",
        "openingHours": "08:00 – 17:00",
        "architecturalHighlights": [
          "白色大理石大厅楼梯和法国新古典主义圆顶",
          "9 个关于地质学、考古学、西贡贸易港口、货币和革命斗争的专业画廊",
          "位于第一区中心的秘密隧道系统和 2 公顷的古花园"
        ],
        "audioScript": [
          "欢迎来到位于 Ly Tu Trong 65 号的胡志明市博物馆，这座建筑曾经被称为嘉隆宫。",
          "这座豪宅于 1885 年动工，于 1890 年竣工，根据建筑师 Alfred Foulhoux 的设计，具有雄伟的新古典主义之美，与下方坚固的地下隧道系统相结合。",
          "在这里，您将回到过去，探索西贡-嘉定-胡志明市这片土地300多年的形成和发展。",
          "据维基百科百科介绍：胡志明市博物馆是越南胡志明市的一座博物馆，位于胡志明市西贡区李子庄65号，占地近2公顷，以李子庄街、巴斯德街、黎青吨街和南纪起义街为界。"
        ]
      },
      "ja": {
        "name": "ホーチミン市博物館（旧ザーロン宮殿）",
        "shortSummary": "建築家アルフレッド・フルーの設計に基づいて 1885 年から 1890 年にかけて建てられた国立芸術建築記念碑。サイゴン - ジアディン - ホーチミン市の 300 年の歴史を包括的に再現しています。",
        "historicalEra": "1885年 – 1890年",
        "openingHours": "08:00 – 17:00",
        "architecturalHighlights": [
          "白い大理石のホールの階段とフランスの新古典主義様式のドーム",
          "地質学、考古学、サイゴン貿易港、通貨、革命闘争に関する 9 つの専門ギャラリー",
          "1 区の中心部にある秘密のトンネル システムと 2 ヘクタールの古代庭園"
        ],
        "audioScript": [
          "リー トゥ チョン 65 番地にあるホーチミン市博物館へようこそ。この建物はかつてジアロン宮殿として知られていました。",
          "建築家アルフレッド・フルーの設計に従って 1885 年に着工し、1890 年に完成したこの邸宅は、その下にある堅固な地下トンネル システムと組み合わされた荘厳な新古典主義の美しさを備えています。",
          "ここでは、時間を遡り、サイゴン - ジアディン - ホーチミン市の土地の 300 年以上にわたる形成と発展を探索します。",
          "ウィキペディア百科事典によると: ホーチミン市博物館は、ベトナムのホーチミン市にある博物館で、ホーチミン市サイゴン区リートゥチョン65番地にあり、リートゥチョン通り、パスツール通り、レタントン通り、ナムキーコイギア通りに囲まれた約2ヘクタールの敷地内にあります。"
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
        "shortSummary": "National Artistic Architectural Monument built from 1892 - 1906 with more than 300 ancient statues made of papier-mâché, wood and unique ceramics.",
        "historicalEra": "1892 – 1906",
        "openingHours": "07:00 – 18:00 Daily",
        "architecturalHighlights": [
          "The complex of statues of the Jade Emperor, the Ten Emperors of Hell and the 12 Midwives are made from papier-mâché, carved wood and terracotta.",
          "The yin-yang tiled roof decorates a complex of brightly colored ceramic statues on the roof",
          "The cultural destination once welcomed US President Barack Obama to visit in May 2016"
        ],
        "audioScript": [
          "Welcome to Jade Emperor Pagoda, whose name is Phuoc Hai Tu, located at 73 Mai Thi Luu Street, Da Kao Ward, District 1.",
          "The ancient temple was built in the late 19th century and completed in 1906, and was recognized as a National Artistic Architectural Monument in 1994.",
          "The most unique artistic value of the pagoda is the collection of more than 300 Buddha statues, especially the statues made of papier-mâché material that is very rare in Vietnam, along with the wooden reliefs carved with scenes of the Ten Palaces of Hell and the shrine of the Golden Mother Goddess - 12 Midwives.",
          "According to Wikipedia encyclopedia: Jade Emperor Pagoda or Phuoc Hai Pagoda is the common name of Jade Emperor Palace, the literal name is Phuoc Hai Tu (the French call it Da Kao Pagoda); currently located at 73 Mai Thi Luu Street, Tan Dinh Ward, Ho Chi Minh City, Vietnam. The pagoda was originally a temple to worship the Jade Emperor, built by a man named Liu Ming (Dharma name Liu Daoyuan, from Guangdong, China) around the beginning of the 20th century. According to scholar Vuong Hong Sen, Liu Minh was \"a net vegetarian, kept the Ming Su religion, made up his mind to overthrow the Manchu Qing Dynasty, and spent money to establish the pagoda both for worship and as a place for secret meetings\"..."
        ]
      },
      "fr": {
        "name": "Pagode de l’Empereur de Jade (Phuoc Hai Tu)",
        "shortSummary": "Monument architectural artistique national construit de 1892 à 1906 avec plus de 300 statues anciennes en papier mâché, bois et céramiques uniques.",
        "historicalEra": "1892 – 1906",
        "openingHours": "07h00 – 18h00",
        "architecturalHighlights": [
          "Le complexe de statues de l'empereur de Jade, des dix empereurs de l'enfer et des 12 sages-femmes est réalisé en papier mâché, en bois sculpté et en terre cuite.",
          "Le toit de tuiles yin-yang décore un complexe de statues en céramique aux couleurs vives sur le toit",
          "La destination culturelle a déjà accueilli le président américain Barack Obama en mai 2016."
        ],
        "audioScript": [
          "Bienvenue à la pagode de l'Empereur de Jade, dont le nom est Phuoc Hai Tu, située au 73 rue Mai Thi Luu, quartier Da Kao, district 1.",
          "L'ancien temple a été construit à la fin du XIXe siècle et achevé en 1906, et a été reconnu monument architectural et artistique national en 1994.",
          "La valeur artistique la plus unique de la pagode est la collection de plus de 300 statues de Bouddha, en particulier les statues en papier mâché très rare au Vietnam, ainsi que les reliefs en bois sculptés de scènes des Dix Palais de l'Enfer et du sanctuaire de la Déesse Mère Dorée - 12 Sages-femmes.",
          "Selon l'encyclopédie Wikipédia : la pagode de l'empereur de Jade ou pagode Phuoc Hai est le nom commun du palais de l'empereur de Jade, le nom littéral est Phuoc Hai Tu (les Français l'appellent la pagode Da Kao) ; actuellement situé au 73 rue Mai Thi Luu, quartier Tan Dinh, Hô Chi Minh-Ville, Vietnam. La pagode était à l'origine un temple destiné à vénérer l'empereur de Jade, construit par un homme nommé Liu Ming (nom du Dharma Liu Daoyuan, originaire du Guangdong, en Chine) au début du 20e siècle. Selon l'érudit Vuong Hong Sen, Liu Minh était « un végétarien net, gardait la religion Ming Su, décidait de renverser la dynastie mandchoue Qing et dépensait de l'argent pour établir la pagode à la fois pour le culte et comme lieu de réunions secrètes »..."
        ]
      },
      "zh": {
        "name": "玉皇殿（福海寺 · 国家级建筑艺术遗迹）",
        "shortSummary": "国家艺术建筑纪念碑，建于 1892 年至 1906 年，拥有 300 多座由纸浆、木材和独特陶瓷制成的古代雕像。",
        "historicalEra": "1892 – 1906年",
        "openingHours": "07:00 – 18:00",
        "architecturalHighlights": [
          "玉皇大帝、地狱十帝和十二婆婆的雕像群由纸浆、木雕和赤土制成。",
          "阴阳瓦屋顶装饰着屋顶上色彩鲜艳的陶瓷雕像群",
          "该文化胜地曾于2016年5月接待美国总统奥巴马到访"
        ],
        "audioScript": [
          "欢迎来到玉皇塔，它的名字是 Phuoc Hai Tu，位于第一区大高区 Mai Thi Luu 街 73 号。",
          "这座古庙建于19世纪末，1906年竣工，1994年被认定为国家艺术建筑古迹。",
          "该塔最独特的艺术价值是收藏了300多尊佛像，尤其是越南罕见的纸浆造像，以及刻有地狱十宫场景和金母娘娘十二接生婆神龛的木制浮雕。",
          "根据维基百科百科：玉皇塔或福海塔是玉皇宫的俗称，字面名称是Phuoc Hai Tu（法国人称之为Da Kao Pagoda）；目前位于越南胡志明市 Tan Dinh Ward Mai Thi Luu 街 73 号。该塔原是一座祭祀玉皇大帝的寺庙，由刘明（法号刘道元，中国广东人）于20世纪初建造。据学者王洪森记载，刘明“吃素，信奉明苏教，立志推翻满清，花钱建塔，既供祭祀，又作为秘密会议场所”……"
        ]
      },
      "ja": {
        "name": "玉皇殿（フックハイ寺・国家建築芸術遺跡）",
        "shortSummary": "1892 年から 1906 年にかけて建てられた国立芸術建築記念碑。張り子、木材、ユニークな陶器で作られた 300 体以上の古代の彫像が置かれています。",
        "historicalEra": "1892年 – 1906年",
        "openingHours": "07:00 – 18:00",
        "architecturalHighlights": [
          "玉皇大帝、地獄の十帝、12 人の助産師の彫像の複合体は、張り子、木彫り、テラコッタで作られています。",
          "陰陽瓦屋根の屋根には色鮮やかな陶製の彫像が並んでいます。",
          "この文化的な目的地は、かつて 2016 年 5 月にバラク・オバマ米国大統領の訪問を歓迎しました。"
        ],
        "audioScript": [
          "1 区ダカオ区マイ ティ ルー ストリート 73 にある玉皇殿、その名はフォク ハイ トゥへようこそ。",
          "この古代寺院は 19 世紀後半に建てられ、1906 年に完成し、1994 年に国家芸術建築記念物に認定されました。",
          "パゴダの最もユニークな芸術的価値は、300 体以上の仏像のコレクションであり、特にベトナムでは非常に珍しい張り子素材で作られた仏像と、地獄の十宮殿と黄金の母女神 - 12 人の助産師の神殿の情景が刻まれた木製のレリーフが含まれています。",
          "ウィキペディア百科事典によると、玉皇殿またはフォク ハイ パゴダは玉皇殿の通称で、文字通りの名前はフォク ハイ トゥ（フランス人はダ カオ パゴダと呼びます）です。現在は、ベトナム、ホーチミン市、タンディン区、マイ ティ ルー ストリート 73 番地にあります。この塔はもともと玉皇大帝を崇拝する寺院で、20 世紀初頭に劉明（法名劉道源、中国広東省出身）という人物によって建てられました。学者のブオン・ホン・セン氏によると、リュー・ミンは「ネット菜食主義者で、ミンスー教を守り、満州清王朝を打倒する決意を固め、礼拝と秘密会議の場として仏塔の建設に資金を投じた」という。"
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
        "shortSummary": "The architectural complex of mausoleums and temples worshiping Governor of Gia Dinh Citadel Le Van Duyet (1764 - 1832), imbued with Nguyen Dynasty royal art and Southern porcelain mosaics.",
        "historicalEra": "1832 – 1848 – 1949",
        "openingHours": "07:00 – 17:30 Daily",
        "architecturalHighlights": [
          "The Three Gate Gate of Thuong Cong Temple, built in 1949, was once a cultural symbol of the ancient Gia Dinh region",
          "The burial site of Left Army Le Van Duyet and his wife Do Thi Phan are buried in the shape of a tortoise (tortoise back).",
          "The martial arts house, the main hall are filled with snails and delicate porcelain mosaic art"
        ],
        "audioScript": [
          "Welcome to the National Historical and Cultural Relic of Le Van Duyet's Tomb, commonly known by people as the Tomb of Ong and Ba Chieu in Binh Thanh district.",
          "This is where the Emperor Le Van Duyet is buried and worshiped, the Governor of Gia Dinh Citadel who made great contributions to expanding the territory, digging the Vinh Te Canal and developing the economy of the Southern region in the early 19th century.",
          "The architectural complex includes the majestic Three Gate Gate of Thuong Cong Temple, the tomb area shaped like a turtle's back, the Beer Garden, the Vo Ca House and the Main Hall carved with dragons and phoenixes painted in red and gilded in gold according to Hue royal architecture combined with Southern folk.",
          "According to Wikipedia encyclopedia: Tomb of the Left Army Le Van Duyet (literal name: Thuong Cong Mieu, Chinese character: 上公廟, customary name: Lang Ong - Ba Chieu) is a complex of mausoleums and shrines dedicated to the Left Army Le Van Duyet (1764–1832), with the double burial of Lady Do Thi Phan. The relic is located at 1 Vu Tung Street, Gia Dinh Ward, Ho Chi Minh City, Vietnam. The west gate of the mausoleum opens to 126 Le Van Duyet Street. The complex is arranged along the main axis: from the three-entrance gate (recorded \"Thuong Cong Temple\"), through the stele house, the double burial area, then to the shrine (front hall - middle hall - main hall); The two rows of Dong Lang and Tay Lang are arranged symmetrically along the axis. Many architectural and decorative details are associated with the Nguyen Dynasty's artistic style, including porcelain mosaics."
        ]
      },
      "fr": {
        "name": "Mausolée du Général Le Van Duyet (Lang Ong Ba Chieu)",
        "shortSummary": "Le complexe architectural de mausolées et de temples vénérant le gouverneur de la citadelle de Gia Dinh Le Van Duyet (1764 - 1832), imprégné de l'art royal de la dynastie Nguyen et des mosaïques de porcelaine du Sud.",
        "historicalEra": "1832 – 1949",
        "openingHours": "07h00 – 17h30",
        "architecturalHighlights": [
          "La porte à trois portes du temple de Thuong Cong, construite en 1949, était autrefois un symbole culturel de l'ancienne région de Gia Dinh.",
          "Le lieu de sépulture de l'Armée de Gauche Le Van Duyet et son épouse Do Thi Phan sont enterrés en forme de tortue (dos de tortue).",
          "La maison des arts martiaux et la salle principale sont remplies d'escargots et de délicates mosaïques de porcelaine."
        ],
        "audioScript": [
          "Bienvenue à la relique historique et culturelle nationale du tombeau de Le Van Duyet, communément connu sous le nom de tombeau d'Ong et Ba Chieu dans le district de Binh Thanh.",
          "C'est ici qu'est enterré et vénéré l'empereur Le Van Duyet, gouverneur de la citadelle de Gia Dinh qui a grandement contribué à l'expansion du territoire, au creusement du canal de Vinh Te et au développement de l'économie de la région du Sud au début du 19ème siècle.",
          "Le complexe architectural comprend la majestueuse porte à trois portes du temple de Thuong Cong, la zone funéraire en forme de dos de tortue, le jardin de bière, la maison Vo Ca et le hall principal sculpté de dragons et de phénix peints en rouge et dorés en or selon l'architecture royale de Hué combinée avec les gens du Sud.",
          "Selon l'encyclopédie Wikipédia : Le Tombeau de l'Armée de Gauche Le Van Duyet (nom littéral : Thuong Cong Mieu, caractère chinois : 上公廟, nom usuel : Lang Ong - Ba Chieu) est un complexe de mausolées et de sanctuaires dédiés à l'Armée de Gauche Le Van Duyet (1764-1832), avec la double sépulture de Dame Do Thi Phan. La relique est située au 1 rue Vu Tung, quartier Gia Dinh, Hô Chi Minh-Ville, Vietnam. La porte ouest du mausolée s'ouvre au 126, rue Le Van Duyet. Le complexe est disposé le long de l'axe principal : depuis la porte à trois entrées (enregistrée « Temple de Thuong Cong »), en passant par la maison en stèles, la double zone de sépulture, puis jusqu'au sanctuaire (hall d'entrée - hall du milieu - hall principal) ; Les deux rangées de Dong Lang et Tay Lang sont disposées symétriquement le long de l'axe. De nombreux détails architecturaux et décoratifs sont associés au style artistique de la dynastie des Nguyen, notamment les mosaïques en porcelaine."
        ]
      },
      "zh": {
        "name": "黎文悦将军陵（巴沼翁陵 · 国家级历史文化遗迹）",
        "shortSummary": "这座建筑群由陵墓和寺庙组成，供奉着嘉定城堡总督黎凡杜耶（Le Van Duyet，1764 - 1832 年），充满了阮朝皇家艺术和南方瓷器马赛克的特色。",
        "historicalEra": "1832 – 1848 – 1949年",
        "openingHours": "07:00 – 17:30",
        "architecturalHighlights": [
          "上公寺三门建于1949年，曾是古代嘉定地区的文化象征",
          "左军黎凡杜耶及其夫人杜氏潘墓葬地呈龟形（龟背）。",
          "武馆、正殿里布满了蜗牛和精致的瓷器马赛克艺术"
        ],
        "audioScript": [
          "欢迎来到国家历史文化遗址黎文杜耶墓，俗称平盛县王巴乔墓。",
          "这里安葬和祭祀着嘉定城堡总督黎文悦皇帝，他在19世纪初为开拓疆土、开凿永德运河、发展南部地区经济做出了巨大贡献。",
          "建筑群包括雄伟的上公寺三门、龟背墓区、啤酒花园、沃卡屋和红金鎏金龙凤大殿，按照顺化皇家建筑风格与南方民俗相结合。",
          "根据维基百科百科全书：左军黎文杜耶墓（字面名称：Thuong Cong Mieu，汉字：上公庙，习惯名称：Lang Ong - Ba Chieu）是一座供奉左军黎文杜耶（Le Van Duyet，1764-1832 年）的陵墓和神殿建筑群，内有杜氏潘夫人 (Do Thi Phan) 的双重埋葬。该遗迹位于越南胡志明市嘉定区武同街1号。陵墓西门通向黎凡杜耶街126号。建筑群沿主轴线排列：从三进门（记载“上恭寺”），经碑舍、双葬区，再至祠堂（前殿-中殿-正殿）；洞朗和泰朗两排沿轴线对称排列。许多建筑和装饰细节都与阮朝的艺术风格相关，包括瓷器马赛克。"
        ]
      },
      "ja": {
        "name": "レ・ヴァン・ズエット将軍廟（バーチエウ廟）",
        "shortSummary": "ギア ディン城塞総督レ ヴァン デュエット (1764 ～ 1832 年) を崇拝する霊廟と寺院からなる建築複合体。グエン朝の王室芸術と南部磁器のモザイクが染み込んでいます。",
        "historicalEra": "1832年 – 1949年",
        "openingHours": "07:00 – 17:30",
        "architecturalHighlights": [
          "1949 年に建てられたトゥオンコン寺院の三門は、かつては古代ギアディン地域の文化的象徴でした。",
          "左軍レ・ヴァン・デュエットとその妻ド・ティ・ファンの埋葬地は亀の形（亀の背）で埋葬されている。",
          "武道館、本堂にはカタツムリと繊細な磁器のモザイクアートがいっぱい"
        ],
        "audioScript": [
          "ビンタイン地区にある国立歴史文化遺産であるレ ヴァン デュエットの墓へようこそ。一般にオンとバ チュウの墓として知られています。",
          "ここは、19 世紀初頭の領土拡大、ビン テ運河の掘削、南部地域の経済発展に多大な貢献を果たしたギア ディン城塞の総督、レ ヴァン デュエット皇帝が埋葬され崇拝されている場所です。",
          "この建築複合体には、トゥオンコン寺院の荘厳な三門、亀の背中のような形をした墓エリア、ビアガーデン、ヴォカハウス、そして南部の民俗と組み合わせたフエ王室建築に従って赤く塗られ金箔を施された龍や鳳凰が彫られたメインホールが含まれています。",
          "ウィキペディア百科事典によると: 左軍レ ヴァン デュエットの墓 (直訳名: トゥオン コン ミーウ、漢字: 上公廟、慣例名: Lang Ong - Ba Chieu) は、左軍レ ヴァン デュエット (1764 ～ 1832 年) に捧げられた霊廟と神社の複合体であり、ドー ティ ファン夫人が二重埋葬されています。遺物は、ベトナム、ホーチミン市、ギアディン区、1 Vu Tung Streetにあります。霊廟の西門は 126 Le Van Duyet Street に通じています。この複合施設は主軸に沿って配置されています。つまり、3 つの入口の門 (「トゥオン コン寺院」と記録されている) から、石碑の家、二重の埋葬エリアを経て、神社 (前殿 - 中殿 - 正殿) に至ります。ドンランとタイランの2列が軸に沿って対称に配置されています。磁器モザイクなど、多くの建築および装飾の細部はグエン王朝の芸術様式に関連しています。"
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
        "shortSummary": "The ancient temple is more than 260 years old (built in 1760) in the center of Cho Lon, the first National Architectural Artistic Monument of the Chinese area in Ho Chi Minh City.",
        "historicalEra": "Founded in 1760",
        "openingHours": "06:00 – 17:30 Daily",
        "architecturalHighlights": [
          "The \"Foreign Internal Affairs\" layout with Thien Tinh yard hanging hundreds of twisted incense rings emitting magical smoke",
          "Complex of ancient Apricot Tree ceramic reliefs (19th - early 20th century) running along the roof border",
          "Dai Hong Chung was cast in the 60th year of Qianlong (1796) and the bronze agarwood top was cast in the year of Dao Quang (1830)."
        ],
        "audioScript": [
          "Welcome to Tue Thanh Assembly Hall, commonly known as Ba Thien Hau Pagoda, located at 710 Nguyen Trai Street, in the heart of historic Cho Lon, District 5.",
          "Built by the Chinese community of the Cantonese language group (Tue Thanh group) in 1760, this is one of the oldest temples in Saigon - Cho Lon and has been ranked a National Architectural and Artistic Monument since 1993.",
          "Looking up at Thien Tinh yard to catch the sunlight, you will see hundreds of hanging spiral incense rings radiating warm incense, above the tiled roof are populations of extremely sophisticated ancient Cay Mai ceramic statues.",
          "According to Wikipedia encyclopedia: Tue Thanh Assembly Hall (Chinese: 穗城會館), commonly known as Thien Hau Temple or Ba Cho Lon Pagoda, is a religious facility worshiping Thien Hau Thanh Mau located at 710 Nguyen Trai Street, Cho Lon Ward (former District 5), Ho Chi Minh City. This is one of the oldest places of worship the Chinese built on ancient Cho Lon land."
        ]
      },
      "fr": {
        "name": "Temple de la Dame Céleste Thien Hau (Congrégation Tue Thanh – Cho Lon)",
        "shortSummary": "L'ancien temple a plus de 260 ans (construit en 1760) au centre de Cho Lon, le premier monument architectural et artistique national de la région chinoise à Hô Chi Minh-Ville.",
        "historicalEra": "Fondé en 1760",
        "openingHours": "06h00 – 17h30",
        "architecturalHighlights": [
          "Le plan « Affaires intérieures étrangères » avec la cour de Thien Tinh suspendue à des centaines d'anneaux d'encens torsadés émettant une fumée magique",
          "Complexe d'anciens reliefs en céramique d'abricotier (XIXe - début XXe siècle) longeant la bordure du toit",
          "Dai Hong Chung a été coulé l'année 60 de Qianlong (1796) et le dessus en bois d'agar en bronze a été coulé l'année de Dao Quang (1830)."
        ],
        "audioScript": [
          "Bienvenue à la salle de l'Assemblée Tue Thanh, communément connue sous le nom de pagode Ba Thien Hau, située au 710 rue Nguyen Trai, au cœur du quartier historique de Cho Lon, district 5.",
          "Construit par la communauté chinoise du groupe de langue cantonaise (groupe Tue Thanh) en 1760, c'est l'un des temples les plus anciens de Saigon - Cho Lon et est classé Monument National Architectural et Artistique depuis 1993.",
          "En regardant la cour de Thien Tinh pour capter la lumière du soleil, vous verrez des centaines d'anneaux d'encens en spirale suspendus rayonnant de l'encens chaud, au-dessus du toit de tuiles se trouvent des populations d'anciennes statues en céramique de Cay Mai extrêmement sophistiquées.",
          "Selon l'encyclopédie Wikipédia : la salle de l'Assemblée de Tue Thanh (chinois : 穗城會館), communément connue sous le nom de temple Thien Hau ou pagode Ba Cho Lon, est un établissement religieux vénérant Thien Hau Thanh Mau situé au 710 rue Nguyen Trai, quartier Cho Lon (ancien district 5), Hô Chi Minh-Ville. C'est l'un des plus anciens lieux de culte construits par les Chinois sur l'ancienne terre de Cho Lon."
        ]
      },
      "zh": {
        "name": "堤岸穗城会馆（天后宫 · 国家级建筑艺术遗迹）",
        "shortSummary": "这座古庙已有260多年的历史（建于1760年），位于河岸市中心，是胡志明市华人区第一座国家建筑艺术纪念碑。",
        "historicalEra": "始建于1760年（清乾隆二十五年）",
        "openingHours": "06:00 – 17:30",
        "architecturalHighlights": [
          "“外国内政”布局，天静院子里悬挂着数百个扭曲的香圈，散发着神奇的烟雾",
          "沿屋顶边界分布的古代杏树陶瓷浮雕（19 世纪至 20 世纪初）",
          "大红钟铸于乾隆六十年（1796年），青铜沉香陀铸于道光年（1830年）。"
        ],
        "audioScript": [
          "欢迎来到二清大会堂，俗称巴天后寺，位于第 5 区历史悠久的 Cho Lon 中心 Nguyen Trai 街 710 号。",
          "这座寺庙由粤语族（Tue Thanh 族）的华人社区于 1760 年建造，是西贡楚龙最古老的寺庙之一，自 1993 年以来一直被列为国家建筑和艺术纪念碑。",
          "抬头仰望天静院子迎着阳光，你会看到数百个悬挂的螺旋香环散发着温暖的香火，瓦片屋顶上是一群极其精致的古代 Cay Mai 陶瓷雕像。",
          "根据维基百科百科：穗城会馆（中文：穗城会馆）俗称天后宫或巴祖龙塔，是一座崇拜天后清茂的宗教设施，位于胡志明市楚伦区（前第五郡）阮岱街 710 号。这是中国人在古老的 Cho Lon 土地上建造的最古老的礼拜场所之一。"
        ]
      },
      "ja": {
        "name": "ティエンハウ廟（穂城会館・チョロン中華街）",
        "shortSummary": "この古代寺院はチョロンの中心部にある 260 年以上の歴史 (1760 年に建設) で、ホーチミン市の中華圏初の国家建築芸術記念碑です。",
        "historicalEra": "1760年創建",
        "openingHours": "06:00 – 17:30",
        "architecturalHighlights": [
          "魔法の煙を発する何百ものねじれた香輪が吊り下げられたティエン・ティン・ヤードのある「フォーリン・インターナル・アフェアーズ」のレイアウト",
          "屋根の境界に沿って走る古代アプリコット ツリーのセラミック レリーフの複合体 (19 世紀から 20 世紀初頭)",
          "大紅忠は乾隆60年（1796年）に鋳造され、青銅の沈香独楽は道光年間（1830年）に鋳造されました。"
        ],
        "audioScript": [
          "一般にバー ティエン ハウ パゴダとして知られるトゥエ タン アセンブリ ホールへようこそ。歴史的なチョロン 5 区の中心部、グエン トライ ストリート 710 番地にあります。",
          "1760 年に広東語グループ (トゥエタン グループ) の中国人コミュニティによって建てられたこの寺院は、サイゴン - チョロンで最も古い寺院の 1 つであり、1993 年以来国家建築および芸術記念碑に指定されています。",
          "太陽の光を浴びるためにティエンティンの庭を見上げると、何百ものらせん状の香輪が吊り下げられ、温かいお香を放ち、瓦屋根の上には非常に洗練された古代のカイマイの陶器の彫像が群がっているのが見えます。",
          "ウィキペディア百科事典によると: トゥエタン集会ホール (中国語: 穗城會館) は、一般的にティエンハウ寺院またはバーチョロンパゴダとして知られ、ホーチミン市チョロン区 (旧 5 区) グエン トライ ストリート 710 にあるティエンハウ タインマウを崇拝する宗教施設です。これは中国人が古代チョロンの土地に建てた最古の礼拝所の 1 つです。"
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
        "shortSummary": "The secret basement under a residential house in the heart of District 3 once hid nearly 3 tons of weapons to serve the Saigon Rangers attacking the Independence Palace in the spring of 1968.",
        "historicalEra": "1966 – 1968",
        "openingHours": "07:30 – 17:00 Daily",
        "architecturalHighlights": [
          "The hatch cover is camouflaged with encaustic tiles and opens with a secret lock right inside the small house",
          "The underground tunnel is more than 8m long, 2m wide, 2.5m deep, dug entirely by hand in 7 months.",
          "Four camouflaged vent pipes and emergency exits open to the city's underground sewer system"
        ],
        "audioScript": [
          "Welcome to the National Historical Site of the Saigon Rangers Weapons Bunker at alley 287 Nguyen Dinh Chieu, District 3.",
          "In 1966, special forces soldier Tran Van Lai (also known as Mai Hong Que) bought this small house and secretly dug a cellar under the floor for 7 long months to hide more than two and a half tons of weapons and explosives.",
          "From this secret bunker right in the heart of the urban center, Team 5 of the Saigon Rangers received weapons to attack the Independence Palace on New Year's Eve 1968.",
          "According to the Wikipedia encyclopedia: Saigon Rangers is the name of the special forces of the Southern Liberation Army, specializing in raids targeting military installations of the United States and the Republic of Vietnam as well as public works in the urban environment in Saigon during the Vietnam War."
        ]
      },
      "fr": {
        "name": "Cache d’Armes Secrète des Commandos de Saïgon (3e Arr.)",
        "shortSummary": "Le sous-sol secret d'une maison d'habitation au cœur du District 3 cachait autrefois près de 3 tonnes d'armes destinées aux Saigon Rangers attaquant le Palais de l'Indépendance au printemps 1968.",
        "historicalEra": "1966 – 1968",
        "openingHours": "07h30 – 17h00",
        "architecturalHighlights": [
          "Le panneau d'écoutille est camouflé avec des tuiles à l'encaustique et s'ouvre avec une serrure secrète directement à l'intérieur de la petite maison.",
          "Le tunnel souterrain fait plus de 8 m de long, 2 m de large, 2,5 m de profondeur, creusé entièrement à la main en 7 mois.",
          "Quatre tuyaux de ventilation camouflés et des sorties de secours ouvertes sur le réseau d'égouts souterrain de la ville"
        ],
        "audioScript": [
          "Bienvenue au Site historique national du bunker d'armes des Saigon Rangers, allée 287 Nguyen Dinh Chieu, district 3.",
          "En 1966, le soldat des forces spéciales Tran Van Lai (également connu sous le nom de Mai Hong Que) acheta cette petite maison et creusa secrètement une cave sous le sol pendant 7 longs mois pour cacher plus de deux tonnes et demie d'armes et d'explosifs.",
          "Depuis ce bunker secret en plein cœur du centre urbain, l'équipe 5 des Saigon Rangers a reçu des armes pour attaquer le Palais de l'Indépendance le soir du Nouvel An 1968.",
          "D'après l'encyclopédie Wikipédia : Saigon Rangers est le nom des forces spéciales de l'Armée de libération du Sud, spécialisées dans les raids visant les installations militaires des États-Unis et de la République du Vietnam ainsi que les travaux publics en milieu urbain à Saigon pendant la guerre du Vietnam."
        ]
      },
      "zh": {
        "name": "西贡别动队秘密军火地窖国家遗迹",
        "shortSummary": "第三区中心一栋居民楼下的秘密地下室曾藏有近3吨武器，为1968年春天袭击独立宫的西贡游骑兵队提供服务。",
        "historicalEra": "1966 – 1968年",
        "openingHours": "07:30 – 17:00",
        "architecturalHighlights": [
          "舱口盖用花砖伪装，并在小房子内用秘密锁打开",
          "地下隧道长8m多，宽2m，深2.5m，全部由手工挖出，历时7个月。",
          "四个伪装通风管和紧急出口通向城市的地下下水道系统"
        ],
        "audioScript": [
          "欢迎来到西贡游骑兵武器掩体国家历史遗址，位于第 3 区 Nguyen Dinh Chieu 287 号巷。",
          "1966年，特种部队士兵陈文来（又名麦红雀）买下了这座小房子，并在地板下秘密挖了一个地窖，长达7个月之久，藏匿了超过两吨半的武器和爆炸物。",
          "1968 年除夕夜，西贡游骑兵第五小队从市中心的这个秘密掩体中获得了攻击独立宫的武器。",
          "据维基百科百科介绍：西贡游骑兵是南方解放军特种部队的名称，专门针对越南战争期间美国和越南共和国的军事设施以及西贡城市环境中的公共工程进行突袭。"
        ]
      },
      "ja": {
        "name": "サイゴン別動隊の秘密武器地下壕（国家歴史遺跡）",
        "shortSummary": "3 区の中心部にある住宅の下の秘密の地下室には、かつて 1968 年の春に独立宮殿を攻撃したサイゴン レンジャーズに役立つ 3 トン近くの武器が隠されていました。",
        "historicalEra": "1966年 – 1968年",
        "openingHours": "07:30 – 17:00",
        "architecturalHighlights": [
          "ハッチカバーはエンコースティックタイルでカモフラージュされており、小さな家の中にある秘密のロックで開きます。",
          "地下トンネルは長さ8メートル、幅2メートル、深さ2.5メートルを超え、7カ月をかけてすべて手作業で掘られた。",
          "市内の地下下水道システムに通じる 4 本の偽装通気管と非常口が開いている"
        ],
        "audioScript": [
          "3 区グエン ディン チュウ路地 287 にあるサイゴン レンジャーズ武器庫の国定史跡へようこそ。",
          "1966 年、特殊部隊兵士のトラン ヴァン ライ (別名マイ ホン クエ) はこの小さな家を購入し、7 か月間かけて床の下に秘密裏に地下室を掘り、2.5 トン以上の武器や爆発物を隠しました。",
          "1968 年の大晦日、サイゴン レンジャーズのチーム 5 は都市中心部の中心にあるこの秘密のバンカーから独立宮殿を攻撃するための武器を受け取りました。",
          "ウィキペディア百科事典によると、サイゴン・レンジャーズは南部解放軍の特殊部隊の名前で、ベトナム戦争中、アメリカ合衆国とベトナム共和国の軍事施設やサイゴンの都市環境における公共事業を標的とした襲撃を専門としていました。"
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
        "shortSummary": "The underground military wonder is more than 250km long with 3 deep floors of the \"Steel into Bronze Land\", ranked as a Special National Monument in 2015.",
        "historicalEra": "1948 – 1975",
        "openingHours": "07:00 – 17:00 Daily",
        "architecturalHighlights": [
          "The 3-storey tunnel network is 250km long, including a meeting tunnel, a military medical tunnel, and a Hoang Cam stove that hides smoke",
          "Ben Duoc Martyrs Memorial Temple with a 9-storey tower and the largest ceramic painting in Vietnam",
          "The area recreates the Cu Chi liberated area and experiences enjoying cassava dipped in sesame salt"
        ],
        "audioScript": [
          "Welcome to the Cu Chi Tunnels Special National Monument - a unique underground defense and living wonder in the world.",
          "Starting digging in 1948 with rudimentary tools such as blunt-bladed hoes and bamboo shovels, the army and people of Cu Chi created an underground city up to 250 kilometers long with three floors ranging from 3 meters to more than 10 meters deep under hard clay.",
          "Inside the tunnel there are full command meeting rooms, military medical surgery stations, food warehouses, water wells and especially the Hoang Cam stove system that guides smoke away from the ground.",
          "According to Wikipedia encyclopedia: Cu Chi Tunnels is an underground defense system in An Nhon Tay commune, 69 km northwest of Ho Chi Minh City center. This system was dug by the Viet Minh resistance army and the National Front for the Liberation of South Vietnam during the Indochina War and Vietnam War. After the war, the Cu Chi tunnels became a national historical site. In 2015, the Cu Chi Tunnels historical relic site received the title of Hero of Labor for its particularly outstanding achievements in labor and creativity. During 20 years of operation, the relic site welcomed more than 20 million domestic and foreign visitors to visit and learn. On February 12, 2016, the relic received the Special National Monument ranking certificate.…"
        ]
      },
      "fr": {
        "name": "Tunnels de Cu Chi & Temple Mémorial de Ben Duoc",
        "shortSummary": "Cette merveille militaire souterraine s'étend sur plus de 250 km de long et compte 3 étages profonds du \"Terre de l'acier vers le bronze\", classé monument national spécial en 2015.",
        "historicalEra": "1948 – 1975",
        "openingHours": "07h00 – 17h00",
        "architecturalHighlights": [
          "Le réseau de tunnels de 3 étages s'étend sur 250 km de long, comprenant un tunnel de réunion, un tunnel médical militaire et un poêle Hoang Cam qui cache la fumée.",
          "Temple commémoratif des martyrs Ben Duoc avec une tour de 9 étages et la plus grande peinture en céramique du Vietnam",
          "La zone recrée la zone libérée de Cu Chi et permet de déguster du manioc trempé dans du sel de sésame."
        ],
        "audioScript": [
          "Bienvenue au monument national spécial des tunnels de Cu Chi, une défense souterraine unique et une merveille vivante au monde.",
          "Commençant à creuser en 1948 avec des outils rudimentaires tels que des houes à lame émoussée et des pelles en bambou, l'armée et la population de Cu Chi ont créé une ville souterraine pouvant atteindre 250 kilomètres de long avec trois étages allant de 3 mètres à plus de 10 mètres de profondeur sous de l'argile dure.",
          "À l’intérieur du tunnel se trouvent des salles de réunion de commandement complètes, des postes de chirurgie médicale militaire, des entrepôts de nourriture, des puits d’eau et surtout le système de poêle Hoang Cam qui éloigne la fumée du sol.",
          "Selon l'encyclopédie Wikipédia : Les tunnels de Cu Chi sont un système de défense souterrain situé dans la commune d'An Nhon Tay, à 69 km au nord-ouest du centre de Hô Chi Minh-Ville. Ce système a été creusé par l’armée de résistance du Viet Minh et le Front National de Libération du Sud Vietnam pendant la guerre d’Indochine et la guerre du Vietnam. Après la guerre, les tunnels de Cu Chi sont devenus un site historique national. En 2015, le site historique des tunnels de Cu Chi a reçu le titre de Héros du travail pour ses réalisations particulièrement remarquables en matière de travail et de créativité. Au cours de 20 années d'exploitation, le site des reliques a accueilli plus de 20 millions de visiteurs nationaux et étrangers pour visiter et apprendre. Le 12 février 2016, la relique a reçu le certificat de classement de Monument National Spécial.…"
        ]
      },
      "zh": {
        "name": "古芝地道与本药纪念祠（越南特别国家级历史遗迹）",
        "shortSummary": "这个地下军事奇观长达250多公里，深3层，是“钢成青铜之地”，于2015年被列为国家特别古迹。",
        "historicalEra": "1948 – 1975年",
        "openingHours": "07:00 – 17:00",
        "architecturalHighlights": [
          "3层隧道网络长250公里，包括一条会议隧道、一条军事医疗隧道和一个隐藏烟雾的Hoang Cam炉",
          "Ben Duoc 烈士纪念庙拥有 9 层塔楼和越南最大的陶瓷画",
          "再现古芝解放区，体验木薯蘸芝麻盐"
        ],
        "audioScript": [
          "欢迎来到古芝地道特别国家纪念碑 - 世界上独一无二的地下防御和活生生的奇迹。",
          "1948年，古芝军民用钝头锄头和竹铲等简陋工具开始挖掘，在坚硬的粘土下建造了一座长达250公里、三层的地下城，深度从3米到10多米不等。",
          "隧道内有完整的指挥会议室、军事医疗手术站、食品仓库、水井，尤其是可将烟雾引导远离地面的 Hoang Cam 炉灶系统。",
          "据维基百科百科介绍：古芝地道是安仁西公社的一个地下防御系统，位于胡志明市中心西北69公里处。这个体系是越盟抵抗军和南越民族解放阵线在印度支那战争和越南战争期间挖掘出来的。战后，古芝地道成为国家历史遗址。 2015年，古芝地道遗址因其在劳动和创造力方面取得的特别突出的成就而被授予劳动英雄称号。运营20年来，遗址已接待国内外游客超过2000万人次参观学习。 2016年2月12日，该文物获得国家特别古迹等级证书。…"
        ]
      },
      "ja": {
        "name": "クチトンネルとベンズオック慰霊神殿（特別国家歴史遺跡）",
        "shortSummary": "この地下軍事遺跡は長さ 250 km 以上で、深い 3 階まである「Steel into Bronze Land」は、2015 年に国の特別記念物に指定されました。",
        "historicalEra": "1948年 – 1975年",
        "openingHours": "07:00 – 17:00",
        "architecturalHighlights": [
          "3 階建てのトンネル網は長さ 250 km で、集会用トンネル、軍用医療用トンネル、煙を隠すホアンカムストーブが含まれています。",
          "9 階建ての塔とベトナム最大の陶板画があるベン ドゥオック殉教者記念寺院",
          "クチ解放区を再現したエリアでキャッサバのごま塩漬けを体験"
        ],
        "audioScript": [
          "クチトンネル特別国定記念物へようこそ - 世界でもユニークな地下防衛施設であり、生きた驚異です。",
          "1948 年に鈍い鍬や竹スコップなどの初歩的な道具を使って掘削を開始し、クチの軍隊と人々は、固い粘土の下に深さ 3 メートルから 10 メートル以上の 3 階建て、長さ 250 キロメートルにも及ぶ地下都市を建設しました。",
          "トンネル内には、完全な指揮会議室、軍の医療手術ステーション、食糧倉庫、井戸、そして特に煙を地面から遠ざけるホアンカムストーブシステムがあります。",
          "ウィキペディア百科事典によると、クチ トンネルはホーチミン市中心部から北西 69 km のアンニョンタイ地区にある地下防御システムです。このシステムは、インドシナ戦争とベトナム戦争中にベトミン抵抗軍と南ベトナム解放国民戦線によって構築されました。戦後、クチトンネルは国の史跡になりました。 2015 年、クチ トンネルの歴史的遺跡は、労働と創造性における特に優れた功績により、労働英雄の称号を獲得しました。 20 年間の運営期間中、この遺跡には 2,000 万人を超える国内外の訪問者が訪れ、学びました。 2016 年 2 月 12 日、この遺物は特別国定記念物ランク認定証を受け取りました。"
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
        "shortSummary": "The first World Biosphere Reserve in Vietnam was recognized by UNESCO in 2000 (the \"Green Lung\" of Ho Chi Minh City) associated with the National Monument of Sac Forest Commando Base.",
        "historicalEra": "1966 – 1975 & UNESCO 2000",
        "openingHours": "07:30 – 17:00 Daily",
        "architecturalHighlights": [
          "The 75,000-hectare mangrove ecosystem is recognized by UNESCO as a World Biosphere Reserve",
          "Rung Sac War Zone National Historical Site (10 Heroic Special Forces Group)",
          "Lang Co Ong (Can Gio Nghinh Ong Festival - National Intangible Cultural Heritage)"
        ],
        "audioScript": [
          "Welcome to the Can Gio Mangrove World Biosphere Reserve and Sac Rung Base National Historic Site in the southeast of Ho Chi Minh City.",
          "On January 21, 2000, UNESCO recognized Can Gio as the first World Biosphere Reserve in Vietnam with more than 75,000 hectares of rich mangrove, cork and fish forests.",
          "In the middle of this mangrove forest crisscrossed with rivers and canals is Rung Sac Base - a place that vividly recreates the lives and brave battles of the soldiers of the 10th Rung Sac Special Forces Group.",
          "According to Wikipedia encyclopedia: Can Gio Biosphere Reserve, also known as Sac Forest, is a complex of terrestrial and aquatic forest animals and plants, formed on the vast delta of the Dong Nai, Saigon and Vam Co rivers. UNESCO recognized this as a world biosphere reserve on January 21, 2000 with a unique and diverse flora and fauna typical of mangrove areas. This place is recognized as a key national tourist area in Vietnam"
        ]
      },
      "fr": {
        "name": "Réserve de Biosphère de la Mangrove de Can Gio (UNESCO) & Base de Rung Sac",
        "shortSummary": "La première réserve mondiale de biosphère au Vietnam a été reconnue par l'UNESCO en 2000 (le « Poumon vert » d'Hô Chi Minh-Ville) associée au Monument national de la base du commando de la forêt de Sac.",
        "historicalEra": "UNESCO 2000",
        "openingHours": "07h30 – 17h00",
        "architecturalHighlights": [
          "L'écosystème de mangrove de 75 000 hectares est reconnu par l'UNESCO comme réserve mondiale de biosphère.",
          "Site historique national de la zone de guerre de Rung Sac (10e groupe de forces spéciales héroïques)",
          "Lang Co Ong (Festival Can Gio Nghinh Ong - Patrimoine culturel immatériel national)"
        ],
        "audioScript": [
          "Bienvenue dans la réserve mondiale de biosphère de Can Gio Mangrove et le site historique national de la base de Sac Rung, au sud-est d'Hô Chi Minh-Ville.",
          "Le 21 janvier 2000, l'UNESCO a reconnu Can Gio comme la première réserve mondiale de biosphère au Vietnam avec plus de 75 000 hectares de riches forêts de mangroves, de lièges et de poissons.",
          "Au milieu de cette forêt de mangrove sillonnée de rivières et de canaux se trouve la base de Rung Sac, un lieu qui recrée de manière vivante la vie et les combats courageux des soldats du 10e groupe des forces spéciales de Rung Sac.",
          "Selon l'encyclopédie Wikipédia : La réserve de biosphère de Can Gio, également connue sous le nom de forêt de Sac, est un complexe d'animaux et de plantes forestiers terrestres et aquatiques, formé sur le vaste delta des rivières Dong Nai, Saigon et Vam Co. L'UNESCO l'a reconnu comme réserve mondiale de biosphère le 21 janvier 2000 avec une flore et une faune uniques et diversifiées typiques des zones de mangrove. Cet endroit est reconnu comme une zone touristique nationale clé au Vietnam"
        ]
      },
      "zh": {
        "name": "芹椰红树林世界生物圈保护区（UNESCO）与森林萨革命根据地",
        "shortSummary": "越南第一个世界生物圈保护区于 2000 年获得联合国教科文组织认可（胡志明市的“绿肺”），与萨克森林突击队基地国家纪念碑相关。",
        "historicalEra": "1966 – 1975 & UNESCO 2000",
        "openingHours": "07:30 – 17:00",
        "architecturalHighlights": [
          "占地75,000公顷的红树林生态系统被联合国教科文组织认定为世界生物圈保护区",
          "荣萨克战区国家历史遗址（10英雄特种部队大队）",
          "Lang Co Ong（Can Gio Nghinh Ong 节 - 国家级非物质文化遗产）"
        ],
        "audioScript": [
          "欢迎来到位于胡志明市东南部的芹焦红树林世界生物圈保护区和萨克龙基地国家历史遗址。",
          "2000年1月21日，联合国教科文组织承认芹吉奥为越南第一个世界生物圈保护区，拥有超过75,000公顷茂盛的红树林、软木林和鱼林。",
          "在这片河流和运河纵横交错的红树林中央，有一座荣萨克基地，这里生动地再现了荣萨克特种部队第10大队士兵的生活和英勇战斗。",
          "根据维基百科百科全书的介绍：Can Gio生物圈保护区，也称为Sac森林，是一个陆生和水生森林动物和植物的复合体，形成于同奈河、西贡河和Vam Co河的广阔三角洲上。联合国教科文组织于2000年1月21日将这里认定为世界生物圈保护区，拥有独特而多样的红树林地区典型动植物群。这个地方被认定为越南国家重点旅游区"
        ]
      },
      "ja": {
        "name": "カンザー・マングローブ生物圏保存地域（ユネスコ）とルンサック基地遺跡",
        "shortSummary": "2000 年にベトナム初の世界生物圏保護区 (ホーチミン市の「緑の肺」) が、国定記念物であるサック森林コマンドー基地に関連してユネスコに認定されました。",
        "historicalEra": "ユネスコ登録 2000年",
        "openingHours": "07:30 – 17:00",
        "architecturalHighlights": [
          "75,000 ヘクタールのマングローブ生態系はユネスコによって世界生物圏保護区として認められています",
          "ルンサック戦争地帯国立史跡（10英雄特殊部隊群）",
          "ラン コー オン (カン ジョー ギン オン フェスティバル - 国家無形文化遺産)"
        ],
        "audioScript": [
          "ホーチミン市の南東にあるカンザーマングローブ世界生物圏保護区とサックルン基地国定史跡へようこそ。",
          "2000 年 1 月 21 日、ユネスコはカンザーを、75,000 ヘクタール以上の豊かなマングローブ、コルク、魚類の森があるベトナム初の世界生物圏保護区として認定しました。",
          "川と運河が交差するこのマングローブ林の真ん中に、第 10 ルンサック特殊部隊グループの兵士たちの生涯と勇敢な戦いが生き生きと再現されているルンサック基地があります。",
          "ウィキペディア百科事典によると、サックの森としても知られるカンザー生物圏保護区は、ドンナイ川、サイゴン川、ヴァムコー川の広大なデルタ地帯に形成された陸生および水生の森林動植物の複合体です。ユネスコは、2000 年 1 月 21 日に、マングローブ地域に典型的なユニークで多様な動植物が生息するこの場所を世界生物圏保護区として承認しました。この場所はベトナムの主要な国家観光地として認識されています"
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
          "hơn 7.000 chiếc đĩa gốm cổ trang trí dọc bờ nóc, vách chùa và tháp Tổ"
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
        "shortSummary": "The National Historical-Cultural Monument was established in 1744 during the reign of Lord Nguyen Phuc Khoat, preserving 118 ancient statues and thousands of ceramic plates decorated with the architecture of Tam Nam Bo.",
        "historicalEra": "Founded in 1744",
        "openingHours": "06:00 – 19:00 Daily",
        "architecturalHighlights": [
          "Southern traditional Tam-shaped architecture includes the Main Hall, Lecture Hall and Groom's House with 98 precious wooden columns engraved with parallel sentences and gilded in gold.",
          "118 ancient statues made of jackfruit wood and bronze, notably the 18th and 19th century statues of the Eighteen Arhats",
          "More than 7,000 ancient ceramic plates decorate the roof, walls of the pagoda and the To tower"
        ],
        "audioScript": [
          "Welcome to Giac Lam Pagoda in Tan Binh district - the oldest pagoda in Ho Chi Minh City founded by layman Ly Thuy Long in the spring of the year Giap Ty 1744.",
          "Recognized as a National Historical and Cultural Monument since 1988, Giac Lam Pagoda retains the traditional Southern Tam architecture with 98 large wooden pillars carved with exquisite parallel sentences.",
          "Inside the pagoda, 118 ancient statues from the 18th and 19th centuries are preserved along with more than 7,000 ancient ceramic plates mounted along the roof and stupas.",
          "According to Wikipedia encyclopedia: Giac Lam Pagoda (Chinese: 覺林寺:; Sino-Vietnamese: Giac Lam Pagoda) also has other names: Cam Son, Son Can or Cam Dem; is one of the oldest pagodas in Ho Chi Minh City. This is the ancestral temple of the Zen Lam Te sect in the South. Giac Lam Pagoda was built by layman Ly Thuy Long, from Minh Huong, in the spring of the year Giap Ty (1744) during the reign of Lord Nguyen Phuc Khoat. Initially, the pagoda was called Son Can (son means mountain, can means shallow mound), later it was also called Cam Son because the pagoda was located on Cam Son mound. In addition, the pagoda is also called Cam Dem because layman Thuy Long's personal name is Cam. He specializes in weaving and selling cushions. Local people call him Mr. Cam Dem."
        ]
      },
      "fr": {
        "name": "Pagode Giac Lam (La plus ancienne pagode de Saïgon – 1744)",
        "shortSummary": "Le monument historique et culturel national a été créé en 1744 sous le règne du Seigneur Nguyen Phuc Khoat, préservant 118 statues anciennes et des milliers de plaques de céramique décorées de l'architecture de Tam Nam Bo.",
        "historicalEra": "Fondée en 1744",
        "openingHours": "06h00 – 19h00",
        "architecturalHighlights": [
          "L'architecture traditionnelle du sud en forme de Tam comprend le hall principal, la salle de conférence et la maison du marié avec 98 colonnes en bois précieux gravées de phrases parallèles et dorées à l'or.",
          "118 statues anciennes en bois de jacquier et en bronze, notamment les statues des XVIIIe et XIXe siècles des Dix-huit Arhats",
          "Plus de 7 000 plaques de céramique anciennes décorent le toit, les murs de la pagode et la tour To"
        ],
        "audioScript": [
          "Bienvenue à la pagode Giac Lam dans le district de Tan Binh - la plus ancienne pagode de Hô Chi Minh-Ville fondée par le laïc Ly Thuy Long au printemps de l'année Giap Ty 1744.",
          "Reconnue monument historique et culturel national depuis 1988, la pagode Giac Lam conserve l'architecture traditionnelle des Tam du Sud avec 98 grands piliers en bois sculptés de phrases parallèles exquises.",
          "À l'intérieur de la pagode, 118 statues anciennes des XVIIIe et XIXe siècles sont conservées ainsi que plus de 7 000 anciennes plaques de céramique montées le long du toit et des stupas.",
          "Selon l'encyclopédie Wikipédia : la pagode Giac Lam (chinois : 覺林寺 : ; sino-vietnamien : pagode Giac Lam) a également d'autres noms : Cam Son, Son Can ou Cam Dem ; est l'une des plus anciennes pagodes d'Hô Chi Minh-Ville. C'est le temple ancestral de la secte Zen Lam Te au Sud. La pagode Giac Lam a été construite par le laïc Ly Thuy Long, de Minh Huong, au printemps de l'année Giap Ty (1744), sous le règne du seigneur Nguyen Phuc Khoat. Initialement, la pagode s'appelait Son Can (son signifie montagne, can signifie monticule peu profond), plus tard elle fut également appelée Cam Son parce que la pagode était située sur le monticule de Cam Son. De plus, la pagode est également appelée Cam Dem parce que le nom personnel du profane Thuy Long est Cam. Il est spécialisé dans le tissage et la vente de coussins. La population locale l'appelle M. Cam Dem."
        ]
      },
      "zh": {
        "name": "觉林寺（胡志明市最古老佛寺 · 1744年）",
        "shortSummary": "国家历史文化纪念碑建于 1744 年阮福科勋爵统治时期，保存着 118 座古代雕像和数千块装饰有 Tam Nam Bo 建筑风格的陶瓷板。",
        "historicalEra": "始建于1744年",
        "openingHours": "06:00 – 19:00",
        "architecturalHighlights": [
          "南方传统潭形建筑，包括大雄宝殿、讲堂和新郎房，内有98根刻有平行句、鎏金的珍贵木柱。",
          "118 尊由菠萝蜜木和青铜制成的古代雕像，尤其是 18 和 19 世纪的十八罗汉雕像",
          "7000多块古代陶瓷板装饰着塔顶、墙壁和塔楼"
        ],
        "audioScript": [
          "欢迎来到新平区的伽蓝寺，这是胡志明市最古老的寺院，由居士李水龙于 1744 年春天建造。",
          "伽蓝塔自1988年起被列为国家历史文化古迹，保留了传统的南谭建筑风格，98根大木柱上刻有精美的骈句。",
          "塔内保存有 118 尊 18 世纪和 19 世纪的古代雕像，以及沿着屋顶和佛塔安装的 7000 多块古代陶瓷板。",
          "根据维基百科百科：Giac Lam Pagoda（中文：觉林寺：；汉越语：Giac Lam Pagoda）还有其他名称：Cam Son、Son Can 或 Cam Dem；是胡志明市最古老的宝塔之一。这是南方禅林德宗的祖庙。伽蓝寺是由明香居士李水龙于阮福科统治时期的甲太年（1744年）春天建造的。最初，该塔被称为Son Can（儿子的意思是山，can的意思是浅土丘），后来又因为塔位于Cam Son土丘上而被称为Cam Son。此外，由于居士Thuy Long的名字是Cam，所以该塔也被称为Cam Dem。他专门从事编织和销售靠垫。当地人称他为 Cam Dem 先生。"
        ]
      },
      "ja": {
        "name": "ザックラム寺（覚林寺・ホーチミン市最古の寺院 1744年）",
        "shortSummary": "国立歴史文化記念物は、グエン フック コート卿の治世中の 1744 年に設立され、118 体の古代の彫像とタム ナム ボーの建築で装飾された数千枚の陶板が保存されています。",
        "historicalEra": "1744年創建",
        "openingHours": "06:00 – 19:00",
        "architecturalHighlights": [
          "南部の伝統的なタム型建築には、本堂、講堂、そして平行文が刻まれ金メッキされた 98 本の貴重な木製柱を備えた花婿の家があります。",
          "パラミツの木と青銅で作られた 118 体の古代像、特に 18 世紀と 19 世紀の十八羅漢像",
          "7,000 枚を超える古代の陶板が塔や塔の屋根、壁を飾っています。"
        ],
        "audioScript": [
          "タンビン地区にあるジャックラム塔へようこそ。ジャップ・ティ 1744 年の春に信徒のリー・トゥイ・ロンによって設立されたホーチミン市最古の塔です。",
          "1988 年に国家歴史文化記念物に指定された覚林塔は、絶妙な平行文が刻まれた 98 本の大きな木の柱など、伝統的な南タム建築を残しています。",
          "塔の内部には、18 世紀から 19 世紀にかけての 118 体の古代の彫像が、屋根や仏塔に沿って取り付けられた 7,000 枚以上の古代の陶板とともに保存されています。",
          "ウィキペディア百科事典によると: 覚林塔 (中国語: 覺林寺:; 中国・ベトナム語: 覚林塔) には別の名前もあります: Cam Son、Son Can、または Cam Dem。ホーチミン市で最も古い仏塔の 1 つです。ここは禅林徳宗南部の祖廟です。ジャーク ラム パゴダは、グエン フック コート卿の治世中のジャープ ティ (1744 年) の春に、ミン フォン出身の信徒リー トゥイ ロンによって建てられました。当初、この塔はソン・カン（ソンは山、カンは浅い塚を意味する）と呼ばれていましたが、後に塔がカムソン塚にあったためカムソンとも呼ばれるようになりました。また、この塔は在家トゥイ・ロンの個人名がカムであることからカム・デムとも呼ばれています。彼はクッションの織りと販売を専門としています。地元の人々は彼をカム・デムさんと呼んでいます。"
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
        "shortSummary": "The ancient site combines traditional Northern Buddhist architecture and modern concrete techniques by architect Nguyen Ba Lang (1964 - 1971), owner of the tallest Stone Stupa in Vietnam.",
        "historicalEra": "1964 – 1971 (Architect Nguyen Ba Lang)",
        "openingHours": "06:00 – 20:00 Daily",
        "architecturalHighlights": [
          "The 7-story Avalokiteśvara Tower is 40m high and the Vinh Nghiem Stone Tower is carved entirely of monolithic granite",
          "The curved roof in the style of an ancient Northern pagoda recreated with reinforced concrete structure by architect Nguyen Ba Lang",
          "The bronze bell \"Great Bell of Peace\" was donated by Japanese Buddhism"
        ],
        "audioScript": [
          "Welcome to Vinh Nghiem Pagoda on Nam Ky Khoi Nghia Street, District 3 - one of the most typical Buddhist architectural works of the 20th century in Ho Chi Minh City.",
          "Started in 1964 and completed in 1971 according to the project of Architect Nguyen Ba Lang, the pagoda took its prototype from Vinh Nghiem's ancestral home during the Tran Dynasty in Bac Giang but was constructed using modern reinforced concrete techniques.",
          "Prominent on the campus are the 40-meter-high, 7-storey Avalokiteśvara Tower and the Vinh Nghiem Stone Tower, intricately carved from monolithic granite.",
          "According to Wikipedia encyclopedia: Vinh Nghiem Pagoda (Chinese: 永嚴寺) is a famous landmark, currently located at 339 Nam Ky Khoi Nghia (near Cong Ly Bridge), Xuan Hoa Ward, Ho Chi Minh City, Vietnam. From the North, two Venerable Monks, Thich Tam Giac and Thich Thanh Kiem, went to the South to spread Buddhism, and later built Vinh Nghiem Pagoda. They took the design prototype from a wooden pagoda of the same name in Duc La village, Tri Yen commune, Yen Dung district, Bac Giang province; Established during the reign of King Ly Thai To, it was the center of spreading Buddhism of the Truc Lam Zen sect."
        ]
      },
      "fr": {
        "name": "Pagode Vinh Nghiem (3e Arrondissement)",
        "shortSummary": "Le site antique combine l'architecture traditionnelle bouddhiste du Nord et les techniques modernes de béton de l'architecte Nguyen Ba Lang (1964 - 1971), propriétaire du plus haut stupa de pierre du Vietnam.",
        "historicalEra": "1964 – 1971",
        "openingHours": "06h00 – 20h00",
        "architecturalHighlights": [
          "La tour Avalokiteśvara de 7 étages mesure 40 m de haut et la tour de pierre de Vinh Nghiem est entièrement taillée dans du granit monolithique.",
          "Le toit incurvé dans le style d'une ancienne pagode du Nord recréé avec une structure en béton armé par l'architecte Nguyen Ba Lang",
          "La cloche en bronze « Grande Cloche de la Paix » a été offerte par le bouddhisme japonais"
        ],
        "audioScript": [
          "Bienvenue à la pagode Vinh Nghiem, rue Nam Ky Khoi Nghia, district 3 - l'une des œuvres architecturales bouddhistes les plus typiques du 20e siècle à Hô Chi Minh-Ville.",
          "Commencée en 1964 et achevée en 1971 selon le projet de l'architecte Nguyen Ba Lang, la pagode a pris son prototype de la maison ancestrale de Vinh Nghiem pendant la dynastie Tran à Bac Giang mais a été construite en utilisant des techniques modernes de béton armé.",
          "Les plus importantes sur le campus sont la tour Avalokiteśvara de 40 mètres de haut et 7 étages et la tour de pierre Vinh Nghiem, finement sculptée dans du granit monolithique.",
          "Selon l'encyclopédie Wikipédia : la pagode Vinh Nghiem (chinois : 永嚴寺) est un monument célèbre, actuellement situé au 339 Nam Ky Khoi Nghia (près du pont Cong Ly), quartier de Xuan Hoa, Hô Chi Minh-Ville, Vietnam. Du nord, deux vénérables moines, Thich Tam Giac et Thich Thanh Kiem, se sont rendus au sud pour propager le bouddhisme et ont ensuite construit la pagode Vinh Nghiem. Ils ont pris le prototype de conception d'une pagode en bois du même nom dans le village de Duc La, commune de Tri Yen, district de Yen Dung, province de Bac Giang ; Fondé sous le règne du roi Ly Thai To, c'était le centre de diffusion du bouddhisme de la secte Truc Lam Zen."
        ]
      },
      "zh": {
        "name": "永严寺与石造宝塔（第三郡）",
        "shortSummary": "这个古老的遗址结合了传统的北方佛教建筑和现代混凝土技术，由越南最高石佛塔的所有者建筑师 Nguyen Ba Lang（1964 - 1971 年）设计。",
        "historicalEra": "1964 – 1971年",
        "openingHours": "06:00 – 20:00",
        "architecturalHighlights": [
          "7层观音塔高40m，永严石塔完全由整块花岗岩雕刻而成",
          "建筑师 Nguyen Ba Lang 用钢筋混凝土结构再现了古代北方宝塔风格的弧形屋顶",
          "日本佛教捐赠的铜钟“和平大钟”"
        ],
        "audioScript": [
          "欢迎来到位于第三区 Nam Ky Khoi Nghia 街的 Vinh Nghiem 塔 - 胡志明市 20 世纪最典型的佛教建筑作品之一。",
          "根据建筑师 Nguyen Ba Lang 的设计，该塔于 1964 年动工，于 1971 年竣工，其原型来自北江陈朝时期 Vinh Nghiem 的祖居，但采用现代钢筋混凝土技术建造。",
          "校园内最引人注目的是 40 米高的 7 层观音塔和由整块花岗岩雕刻而成的永严石塔。",
          "根据维基百科百科：永严寺是一个著名的地标，目前位于越南胡志明市宣和区 Nam Ky Khoi Nghia 339 号（靠近 Cong Ly 桥）。两位高僧释谭觉和释清剑从北方南下传播佛教，后来建造了永严塔。他们的设计原型取自北江省安勇县三安公社德拉村的同名木塔；始建于李太祖统治时期，是竹林禅宗的佛教传播中心。"
        ]
      },
      "ja": {
        "name": "ヴィンギエム寺（永厳寺・3区）",
        "shortSummary": "この古代遺跡は、ベトナムで最も高い石仏塔の所有者である建築家グエン バ ラン (1964 ～ 1971 年) による、伝統的な北部仏教建築と現代のコンクリート技術を組み合わせたものです。",
        "historicalEra": "1964年 – 1971年",
        "openingHours": "06:00 – 20:00",
        "architecturalHighlights": [
          "7 階建ての観音塔は高さ 40 メートル、ヴィン ギエム石塔は全体が一枚岩の花崗岩で彫られています。",
          "建築家グエン・バ・ランによって鉄筋コンクリート構造で再現された、古代北方の塔を模した湾曲した屋根",
          "銅鐘「平和の大鐘」は日本仏教会より寄贈されました"
        ],
        "audioScript": [
          "3 区ナムキーコイギア通りにあるヴィンギエムパゴダへようこそ。ホーチミン市の 20 世紀の最も典型的な仏教建築作品の 1 つです。",
          "建築家グエン・バ・ランのプロジェクトに従って1964年に着工し、1971年に完成したこの塔は、バクザンにあるチャン王朝時代のヴィン・ギエムの先祖代々の家からプロトタイプを引き継いだが、現代の鉄筋コンクリート技術を使用して建設された。",
          "キャンパス内で有名なのは、高さ 40 メートルの 7 階建ての観音塔と、一枚岩の花崗岩から複雑に彫られたヴィン ギエム石塔です。",
          "ウィキペディア百科事典によると: ヴィン ギエム パゴダ (中国語: 永嚴寺) は、現在ベトナム、ホーチミン市スアンホア区ナムキーコイギア 339 番地 (コンリー橋近く) に位置する有名なランドマークです。北からは、ティク・タム・ジャークとティク・タイン・キエムという二人の尊い僧侶が仏教を広めるために南へ向かい、後にヴィン・ギエム・パゴダを建設しました。彼らは、バクザン省イェンズン地区、トリエンコミューン、ドゥクラ村にある同名の木造塔からデザインのプロトタイプを採用した。リー タイ トー王の治世中に設立され、チュックラム禅宗の仏教を広める中心地でした。"
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
        "shortSummary": "Spiritual and cultural architectural complex of more than 400 hectares at Technology Hill - City. Thu Duc, designed in the image of Dong Son Bronze Drum, Banh Chung - Banh Giay and Cuu Long.",
        "historicalEra": "Inaugurated in 2009",
        "openingHours": "07:00 – 17:00 Daily",
        "architecturalHighlights": [
          "Thai Duong Square simulates the face of the Ngoc Lu Bronze Drum with 18 bows symbolizing the 18 generations of Hung Kings.",
          "The 400m long Bamboo road leads to Thuong Temple, located on a high, airy hilltop",
          "An Duong Vuong's oath stone pillar and Dong Nai River Ancient Pottery Museum"
        ],
        "audioScript": [
          "Welcome to the Memorial Temple of the Hung Kings located in the National Historical and Cultural Park of more than 400 hectares in Long Binh ward, Thu Duc City.",
          "The project is designed according to the philosophy of Round Heaven and Square Earth (Banh Chung - Banh Giay), featuring Thai Duong Square with the Dong Son bronze drum face motif and 54 stone pillars symbolizing 54 ethnic groups.",
          "The green bamboo-shaded walkway leading straight to Thuong Temple is one of the most beautiful cultural strolls in the East area of Ho Chi Minh City.",
          "According to Wikipedia encyclopedia: National Cultural History Park is a large-scale architectural project built in Long Binh ward and part of Dong Hoa ward, Ho Chi Minh City with the function of a park and tourist attraction with the theme of history and culture of the Vietnamese people. This is considered a typical project of the southern region and a place to honor Vietnamese national cultural values."
        ]
      },
      "fr": {
        "name": "Temple Mémorial des Rois Hung & Parc Historique National (Thu Duc)",
        "shortSummary": "Complexe architectural spirituel et culturel de plus de 400 hectares à Technology Hill - City. Thu Duc, conçu à l'image du tambour de bronze Dong Son, Banh Chung - Banh Giay et Cuu Long.",
        "historicalEra": "Inauguré en 2009",
        "openingHours": "07h00 – 17h00",
        "architecturalHighlights": [
          "La place Thai Duong simule le visage du tambour de bronze Ngoc Lu avec 18 arcs symbolisant les 18 générations de rois Hung.",
          "La route des bambous, longue de 400 m, mène au temple de Thuong, situé sur une colline haute et aérée.",
          "Pilier de pierre du serment d'An Duong Vuong et musée de la poterie ancienne de la rivière Dong Nai"
        ],
        "audioScript": [
          "Bienvenue au Temple Mémorial des Rois Hung situé dans le Parc National Historique et Culturel de plus de 400 hectares dans le quartier de Long Binh, ville de Thu Duc.",
          "Le projet est conçu selon la philosophie du Ciel rond et de la Terre carrée (Banh Chung - Banh Giay), avec la place Thai Duong avec le motif du tambour en bronze Dong Son et 54 piliers en pierre symbolisant 54 groupes ethniques.",
          "La passerelle verte ombragée de bambous menant directement au temple de Thuong est l'une des plus belles promenades culturelles de la zone est d'Hô Chi Minh-Ville.",
          "Selon l'encyclopédie Wikipédia : Le Parc national d'histoire culturelle est un projet architectural à grande échelle construit dans le quartier de Long Binh et une partie du quartier de Dong Hoa, à Hô Chi Minh-Ville, avec la fonction de parc et d'attraction touristique sur le thème de l'histoire et de la culture du peuple vietnamien. Ceci est considéré comme un projet typique de la région du sud et un lieu pour honorer les valeurs culturelles nationales vietnamiennes."
        ]
      },
      "zh": {
        "name": "守德市雄王纪念圣殿与民族历史文化公园",
        "shortSummary": "科技山城占地400多公顷的精神文化建筑群。 Thu Duc，以东山铜鼓、Banh Chung - Banh Giay 和 Cuu Long 的形象设计。",
        "historicalEra": "2009年落成",
        "openingHours": "07:00 – 17:00",
        "architecturalHighlights": [
          "Thai Duong 广场模仿玉禄铜鼓的面貌，有 18 个弓，象征着第 18 代雄王。",
          "400m 长的竹路通向位于高而通风的山顶上的 Thuong 寺",
          "安阳王的誓言石柱和同奈河古陶器博物馆"
        ],
        "audioScript": [
          "欢迎来到位于守德市隆平区占地 400 多公顷的国家历史文化公园内的雄王纪念庙。",
          "该项目按照天圆地方（Banh Chung - Banh Giay）的理念进行设计，以Thai Duong广场为特色，广场上有同山铜鼓面图案和象征54个民族的54根石柱。",
          "绿竹掩映的步道直通上寺，是胡志明市东部地区最美丽的文化步道之一。",
          "据维基百科百科介绍：国家文化历史公园是在胡志明市隆平区和东和区的一部分建设的大型建筑项目，具有公园和旅游景点的功能，以越南人民的历史文化为主题。这被认为是南部地区的典型项目，也是体现越南民族文化价值观的地方。"
        ]
      },
      "ja": {
        "name": "フン王記念神殿と民族歴史文化公園（トゥードゥック市）",
        "shortSummary": "テクノロジー ヒル - シティにある 400 ヘクタールを超える精神的および文化的な建築複合体。ドンソン銅鼓、バインチュン、バインザイ、クーロンをイメージしてデザインされたトゥドゥック。",
        "historicalEra": "2009年完成",
        "openingHours": "07:00 – 17:00",
        "architecturalHighlights": [
          "タイ ズオン広場は、18 世代のフン王を象徴する 18 個の弓を備えたゴック ルー青銅ドラムの表面を模倣しています。",
          "長さ 400 メートルの竹の道は、高く風通しの良い丘の上にあるトゥオン寺院に通じています。",
          "アン・ズオン・ヴオンの誓いの石柱とドンナイ川古代陶器博物館"
        ],
        "audioScript": [
          "トゥドゥック市ロンビン区にある 400 ヘクタール以上の国立歴史文化公園内にあるフン王記念寺院へようこそ。",
          "このプロジェクトは、「丸い天と四角い地」（バインチュン - バインザイ）の哲学に従って設計されており、ドンソン銅太鼓の顔をモチーフにしたタイズオン広場と、54の民族を象徴する54本の石柱が特徴です。",
          "トゥオン寺院へとまっすぐに続く緑の竹陰の歩道は、ホーチミン市の東部エリアで最も美しい文化的な散歩道の 1 つです。",
          "ウィキペディア百科事典によると: 国立文化歴史公園は、ホーチミン市ロンビン区とドンホア区の一部に建設された大規模な建築プロジェクトで、ベトナム民族の歴史と文化をテーマにした公園と観光名所の機能を備えています。これは南部地域の典型的なプロジェクトであり、ベトナムの国民文化的価値を称える場所と考えられています。"
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
        "shortSummary": "The world-famous Catholic church with its vibrant pastel pink color, combining Gothic, Roman and Baroque architecture, was built in 1876.",
        "historicalEra": "1870 – 1876 (Painted pink in 1957)",
        "openingHours": "08:00 – 11:00, 14:00 – 17:00 (Mon – Sat)",
        "architecturalHighlights": [
          "The coral pink facade combined with sophisticated white borders is the top check-in point in Ho Chi Minh City",
          "The main bell tower is 52.6m high with an octagonal top and 5 bells cast in France",
          "The inside of the church includes two rows of curved Gothic columns and an Italian marble altar"
        ],
        "audioScript": [
          "Welcome to Tan Dinh Church on Hai Ba Trung Street, District 3 - one of the most ancient and famous churches in Ho Chi Minh City.",
          "Started in 1870 and inaugurated in 1876, the building has Gothic architecture combining Roman and Baroque details. Since 1957, the church has worn its characteristic pastel pink color and has become a photography icon for tourists around the world.",
          "The most beautiful angle to take souvenir photos is from the balcony of the coffee shop across Hai Ba Trung street in the early morning when the sunlight shines obliquely on the bell tower over 52 meters high.",
          "According to Wikipedia encyclopedia: Tan Dinh Church (official name: Sacred Heart of Jesus Church, Tan Dinh) is a Catholic church in Ho Chi Minh City, belonging to Tan Dinh parish. Tan Dinh Church and Saigon Notre Dame Cathedral are two churches built very early and have the largest scale in this city. The church is located at 289 Hai Ba Trung Street, Xuan Hoa Ward, Ho Chi Minh City, started in 1870 and inaugurated on December 16, 1876. The overall style is Roman architecture. The church has been painted pink both outside and inside since 1957, giving it the nickname \"the pink church.\""
        ]
      },
      "fr": {
        "name": "Église Tan Dinh (L’Église Rose · 1876)",
        "shortSummary": "L'église catholique de renommée mondiale, avec sa couleur rose pastel vibrante, combinant architecture gothique, romaine et baroque, a été construite en 1876.",
        "historicalEra": "1870 – 1876",
        "openingHours": "08h00 – 11h00, 14h00 – 17h00",
        "architecturalHighlights": [
          "La façade rose corail combinée à des bordures blanches sophistiquées est le principal point d'enregistrement à Hô Chi Minh-Ville.",
          "Le clocher principal mesure 52,6 m de haut avec un sommet octogonal et 5 cloches coulées en France",
          "L'intérieur de l'église comprend deux rangées de colonnes gothiques incurvées et un autel en marbre italien."
        ],
        "audioScript": [
          "Bienvenue à l'église Tan Dinh sur la rue Hai Ba Trung, district 3 - l'une des églises les plus anciennes et les plus célèbres de Ho Chi Minh-Ville.",
          "Commencé en 1870 et inauguré en 1876, le bâtiment présente une architecture gothique combinant des détails romains et baroques. Depuis 1957, l’église arbore sa couleur rose pastel caractéristique et est devenue une icône photographique pour les touristes du monde entier.",
          "Le plus bel angle pour prendre des photos souvenirs est celui du balcon du café de l'autre côté de la rue Hai Ba Trung, tôt le matin, lorsque la lumière du soleil brille obliquement sur le clocher de plus de 52 mètres de haut.",
          "Selon l'encyclopédie Wikipédia : L'église de Tan Dinh (nom officiel : Église du Sacré-Cœur de Jésus, Tan Dinh) est une église catholique de Hô Chi Minh-Ville, appartenant à la paroisse de Tan Dinh. L'église Tan Dinh et la cathédrale Notre-Dame de Saigon sont deux églises construites très tôt et possèdent la plus grande envergure de cette ville. L'église est située au 289 rue Hai Ba Trung, quartier Xuan Hoa, Hô Chi Minh-Ville, commencée en 1870 et inaugurée le 16 décembre 1876. Le style général est l'architecture romaine. L'église est peinte en rose à l'extérieur et à l'intérieur depuis 1957, ce qui lui donne le surnom d'« église rose »."
        ]
      },
      "zh": {
        "name": "新定教堂（西贡粉红教堂 · 1876年）",
        "shortSummary": "这座举世闻名的天主教堂建于 1876 年，拥有充满活力的柔和粉红色，融合了哥特式、罗马式和巴洛克式建筑风格。",
        "historicalEra": "1870 – 1876年",
        "openingHours": "08:00 – 11:00, 14:00 – 17:00",
        "architecturalHighlights": [
          "珊瑚粉色的外观与精致的白色边框相结合，是胡志明市的顶级打卡点",
          "主钟楼高52.6m，八角顶，5口法国铸钟",
          "教堂内部包括两排弯曲的哥特式圆柱和一座意大利大理石祭坛"
        ],
        "audioScript": [
          "欢迎来到第三区二征街的谭亭教堂 - 胡志明市最古老、最著名的教堂之一。",
          "该建筑始建于 1870 年，于 1876 年落成，具有结合罗马和巴洛克细节的哥特式建筑。自 1957 年以来，这座教堂一直呈现出其特有的淡粉色，并成为世界各地游客的摄影地标。",
          "拍摄纪念照片的最美角度是清晨二征街对面的咖啡店阳台，阳光斜射在高52米的钟楼上。",
          "据维基百科百科介绍：陈亭教堂（正式名称：耶稣圣心教堂、陈亭）是胡志明市的一座天主教教堂，属于陈亭教区。谭亭教堂和西贡圣母大教堂是这座城市中建造较早、规模最大的两座教堂。该教堂位于胡志明市宣和区二征街289号，始建于1870年，于1876年12月16日落成。整体风格为罗马建筑风格。自1957年起，教堂的内外都被漆成粉红色，因此被称为“粉红教堂”。"
        ]
      },
      "ja": {
        "name": "タンディン教会（ピンクの教会・1876年）",
        "shortSummary": "鮮やかなパステル ピンク色で世界的に有名なこのカトリック教会は、ゴシック、ローマ、バロック建築を組み合わせたもので、1876 年に建てられました。",
        "historicalEra": "1870年 – 1876年",
        "openingHours": "08:00 – 11:00, 14:00 – 17:00",
        "architecturalHighlights": [
          "コーラルピンクのファサードと洗練された白のボーダーが組み合わさった外観は、ホーチミン市で最高のチェックインポイントです",
          "主鐘楼は高さ 52.6 メートルで、頂部は八角形で、5 つの鐘がフランスで鋳造されています。",
          "教会の内部には、2 列の湾曲したゴシック様式の柱とイタリア大理石の祭壇があります。"
        ],
        "audioScript": [
          "3 区のハイ バ チュン通りにあるタン ディン教会へようこそ。ホーチミン市で最も古く有名な教会の 1 つです。",
          "1870 年に着工し、1876 年に完成したこの建物は、ローマ様式とバロック様式の細部を組み合わせたゴシック様式の建築となっています。 1957 年以来、この教会はその特徴的なパステル ピンク色を身に着けており、世界中の観光客の写真撮影のアイコンとなっています。",
          "記念写真を撮るのに最も美しい角度は、ハイバーチュン通りの向かいにあるコーヒーショップのバルコニーから、高さ 52 メートルを超える鐘楼に太陽光が斜めに当たる早朝です。",
          "ウィキペディア百科事典によると： タンディン教会（正式名称：聖心イエス教会、タンディン）は、ホーチミン市にあるタンディン教区に属するカトリック教会です。タンディン教会とサイゴン ノートルダム大聖堂は、非常に早くから建てられ、この都市で最大の規模を誇る 2 つの教会です。この教会はホーチミン市スアンホア区ハイバチュン通り 289 番地にあり、1870 年に建設が始まり、1876 年 12 月 16 日に落成しました。全体的なスタイルはローマ建築です。この教会は 1957 年以来、外も内もピンク色に塗られており、「ピンクの教会」というあだ名が付けられています。"
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
        "shortSummary": "The most vibrant walking avenue in Ho Chi Minh City connecting the City People's Committee to the Saigon River, highlighted by a 9-storey cafe-boutique complex at Apartment 42 Nguyen Hue.",
        "historicalEra": "1887 Boulevard – 2015 Pedestrian Plaza",
        "openingHours": "Open 24/7 (Best 17:30 – 22:30)",
        "architecturalHighlights": [
          "670m long pedestrian square paved with granite with artistic fountain & monument of President Ho Chi Minh",
          "Apartment 42 Nguyen Hue (built in the 1960s) with dozens of coffee balconies brightly lit like a modern beehive",
          "Direct connection to the City Theater, Ho Chi Minh City People's Committee, Bitexco Tower and Bach Dang Wharf"
        ],
        "audioScript": [
          "Welcome to Nguyen Hue Walking Street and Apartment 42 Nguyen Hue - the heart of Saigon's youthful lifestyle.",
          "In the past, this avenue used to be a large canal leading merchant ships into Gia Dinh citadel, it was filled in at the end of the 19th century and became a modern walking street since 2015.",
          "Right next door is Apartment 42 Nguyen Hue built in the 1960s, where old apartments have been transformed into dozens of creative cafes and shops, creating a beautiful light-up scene every evening.",
          "According to Wikipedia encyclopedia: Nguyen Hue Street is a route in Saigon ward (former District 1), center of Ho Chi Minh City, running from the City People's Committee Headquarters to Bach Dang Wharf, on the banks of the Saigon River. Currently in the middle of this road is a 27 m wide walking square put into use since 2015, the first walking square in Vietnam. Nguyen Hue Street starts from Le Thanh Ton Street right opposite the Ho Chi Minh City People's Committee Headquarters, cuts through Le Loi, Nguyen Thiep, Ton That Thiep, Mac Thi Buoi, Huynh Thuc Khang, Ngo Duc Ke, Hai Trieu streets and ends at Ton Duc Thang Street opposite Bach Dang Wharf park."
        ]
      },
      "fr": {
        "name": "Rue piétonne Nguyen Hue & Immeuble Café 42",
        "shortSummary": "L'avenue piétonne la plus animée d'Hô Chi Minh-Ville reliant le Comité populaire de la ville à la rivière Saigon, mise en valeur par un complexe de cafés-boutiques de 9 étages à l'appartement 42 Nguyen Hue.",
        "historicalEra": "1887 – 2015",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "Place piétonne de 670 m de long pavée de granit avec fontaine artistique et monument du président Ho Chi Minh",
          "Appartement 42 Nguyen Hue (construit dans les années 1960) avec des dizaines de balcons de café brillamment éclairés comme une ruche moderne",
          "Connexion directe au Théâtre municipal, au Comité populaire de Hô Chi Minh-Ville, à la tour Bitexco et au quai Bach Dang"
        ],
        "audioScript": [
          "Bienvenue dans la rue piétonne Nguyen Hue et dans l'appartement 42 Nguyen Hue, au cœur du style de vie jeune de Saigon.",
          "Autrefois, cette avenue était un grand canal menant les navires marchands à la citadelle de Gia Dinh, elle a été comblée à la fin du 19ème siècle et est devenue une rue piétonne moderne depuis 2015.",
          "Juste à côté se trouve l'appartement 42 Nguyen Hue, construit dans les années 1960, où d'anciens appartements ont été transformés en des dizaines de cafés et de boutiques créatifs, créant une belle scène lumineuse chaque soir.",
          "Selon l'encyclopédie Wikipédia : La rue Nguyen Hue est une route du quartier de Saigon (ancien district 1), centre de Hô Chi Minh-Ville, allant du siège du Comité populaire de la ville au quai Bach Dang, sur les rives de la rivière Saigon. Actuellement, au milieu de cette route se trouve une place piétonne de 27 m de large, mise en service depuis 2015, la première place piétonne du Vietnam. La rue Nguyen Hue part de la rue Le Thanh Ton, juste en face du siège du Comité populaire de Hô Chi Minh-Ville, traverse les rues Le Loi, Nguyen Thiep, Ton That Thiep, Mac Thi Buoi, Huynh Thuc Khang, Ngo Duc Ke, Hai Trieu et se termine à la rue Ton Duc Thang en face du parc du quai Bach Dang."
        ]
      },
      "zh": {
        "name": "阮惠步行街与42号咖啡公寓",
        "shortSummary": "胡志明市最具活力的步行大道，连接市人民委员会和西贡河，其中以 42 Nguyen Hue 公寓的 9 层咖啡精品综合体为亮点。",
        "historicalEra": "1887年大道 – 2015年步行街",
        "openingHours": "全天开放（17:30 – 22:30最佳）",
        "architecturalHighlights": [
          "670m长的花岗岩步行广场，设有艺术喷泉和胡志明主席纪念碑",
          "阮惠 42 号公寓（建于 1960 年代）设有数十个咖啡阳台，灯火通明，就像现代蜂巢一样",
          "直接连接城市剧院、胡志明市人民委员会、Bitexco 塔和 Bach Dang 码头"
        ],
        "audioScript": [
          "欢迎来到阮惠步行街和阮惠 42 号公寓 - 西贡年轻生活方式的中心。",
          "过去，这条大道曾是一条引导商船进入嘉定城堡的大运河，于19世纪末被填平，并于2015年起成为现代化的步行街。",
          "隔壁就是建于1960年代的Apartment 42 Nguyen Hue，这里的旧公寓被改造成数十家创意咖啡馆和商店，每天晚上营造出美丽的灯光场景。",
          "据维基百科百科介绍：阮惠街是胡志明市中心西贡区（前第一区）的一条路线，从市人民委员会总部一直延伸到西贡河岸上的Bach Dang码头。目前，这条路的中间有一个27m宽的步行广场，于2015年投入使用，是越南第一个步行广场。阮惠街起于胡志明市人民委员会总部对面的Le Thanh Ton街，穿过Le Loi街、Nguyen Thiep街、Ton That Thiep街、Mac Thi Buoi街、Huynh Thuc Khang街、Ngo Duc Ke街、Hai Trieu街，结束于Ton Duc Thang街，白腾码头公园对面。"
        ]
      },
      "ja": {
        "name": "グエンフエ歩行者天国とカフェアパートメント42",
        "shortSummary": "ホーチミン市人民委員会とサイゴン川を結ぶホーチミン市で最も活気のある歩行者専用道路。アパートメント 42 グエン フエにある 9 階建てのカフェとブティックの複合施設がそのハイライトとなっています。",
        "historicalEra": "1887年 – 2015年歩行者天国化",
        "openingHours": "24時間開放（夕方〜夜がおすすめ）",
        "architecturalHighlights": [
          "花崗岩で舗装された長さ 670 メートルの歩行者広場。芸術的な噴水とホーチミン大統領の記念碑がある",
          "アパートメント 42 グエン フエ (1960 年代に建てられた) には、現代の蜂の巣のように明るく照らされる数十のコーヒー バルコニーが付いています。",
          "市立劇場、ホーチミン市人民委員会、ビテクスコタワー、バクダン埠頭へ直結"
        ],
        "audioScript": [
          "サイゴンの若々しいライフスタイルの中心、グエン フエ ウォーキング ストリートとアパートメント 42 グエン フエへようこそ。",
          "かつて、この通りは商船をギアディン城塞に導く大きな運河でしたが、19 世紀末に埋め立てられ、2015 年から現代的なウォーキングストリートになりました。",
          "すぐ隣には 1960 年代に建てられたアパートメント 42 グエン フエがあり、古いアパートが数十のクリエイティブなカフェやショップに改装され、毎晩美しいライトアップシーンを作り出しています。",
          "ウィキペディア百科事典によると: グエン フエ通りは、ホーチミン市中心部のサイゴン区 (旧 1 区) にある、市人民委員会本部からサイゴン川のほとりのバクダン埠頭までを結ぶルートです。現在、この道路の中央には、2015年から使用されている幅27メートルのベトナム初の歩行者広場が整備されている。グエン フエ通りは、ホーチミン市人民委員会本部の真向かいのレ タン トン通りから始まり、レ ロイ通り、グエン ティップ通り、トン タット ティップ通り、マック ティ ブオイ通り、フイン トゥック カン通り、ゴ ドゥク ケ通り、ハイ トリウ通りを通り、バクダン埠頭公園の向かい側のトン ドゥック タン通りで終わります。"
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
        "shortSummary": "Beautiful park space along the Saigon River right in the heart of District 1, where to catch the Saigon Waterbus and fully view the Ba Son Cable-stayed Bridge at sunset.",
        "historicalEra": "Historic Saigon Waterfront – Revamped 2022",
        "openingHours": "Open 24/7 (Waterbus 07:00 – 21:00)",
        "architecturalHighlights": [
          "Ba Son cable-stayed bridge (Thu Thiem 2) with 113m leaning tower, new symbol of Saigon River",
          "Saigon Waterbus Pier connecting District 1 to Thanh Da - Binh An - Linh Dong for only 15,000 VND",
          "Airy walkway with panoramic view of Thu Thiem peninsula and Landmark 81 tower"
        ],
        "audioScript": [
          "Welcome to Ben Bach Dang Park on the west bank of the Saigon River - the most beautiful place to stroll, watch the sunset and take photos of the city's skyline.",
          "From here, you can fully capture the 113-meter-high Ba Son Cable-stayed Bridge stretching across the river, or board the Saigon Waterbus to see Saigon from the water.",
          "According to Wikipedia encyclopedia: Bach Dang Wharf is the name of the park and river wharf area on the banks of the Saigon River in Saigon, central Ho Chi Minh City, Vietnam. This is where city residents and tourists come to have fun and is a place to watch fireworks every holiday and New Year. Bach Dang Wharf is located at 2 Ton Duc Thang Street, located on the west bank of the Saigon River, including a wharf and park 1.3 km long and 23,400 m² wide."
        ]
      },
      "fr": {
        "name": "Quai Bach Dang & Pont Ba Son (Saigon Waterbus)",
        "shortSummary": "Bel espace de parc le long de la rivière Saigon, en plein cœur du district 1, où prendre le bateau-bus de Saigon et admirer pleinement le pont à haubans de Ba Son au coucher du soleil.",
        "historicalEra": "Quai historique – Rénové en 2022",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "Pont à haubans de Ba Son (Thu Thiem 2) avec tour penchée de 113 m, nouveau symbole du fleuve Saigon",
          "Jetée du bateau-bus de Saigon reliant le district 1 à Thanh Da - Binh An - Linh Dong pour seulement 15 000 VND",
          "Passerelle aérée avec vue panoramique sur la péninsule de Thu Thiem et la tour Landmark 81"
        ],
        "audioScript": [
          "Bienvenue au parc Ben Bach Dang, sur la rive ouest de la rivière Saigon, le plus bel endroit pour se promener, admirer le coucher de soleil et prendre des photos de l'horizon de la ville.",
          "De là, vous pouvez pleinement capturer le pont à haubans Ba Son de 113 mètres de haut qui traverse la rivière, ou monter à bord du Saigon Waterbus pour voir Saigon depuis l'eau.",
          "Selon l'encyclopédie Wikipédia : Bach Dang Wharf est le nom du parc et de la zone du quai fluvial sur les rives de la rivière Saigon à Saigon, dans le centre d'Hô Chi Minh-Ville, au Vietnam. C'est ici que les habitants de la ville et les touristes viennent s'amuser et c'est un endroit où l'on peut regarder des feux d'artifice à chaque fête et au Nouvel An. Le quai Bach Dang est situé au 2 rue Ton Duc Thang, situé sur la rive ouest de la rivière Saigon, comprenant un quai et un parc de 1,3 km de long et 23 400 m² de large."
        ]
      },
      "zh": {
        "name": "白藤码头公园与巴松大桥（西贡水上巴士）",
        "shortSummary": "位于第一区中心的西贡河沿岸美丽的公园空间，可以在那里搭乘西贡水上巴士并在日落时欣赏巴山斜拉桥的全景。",
        "historicalEra": "历史码头 – 2022年焕新开放",
        "openingHours": "全天开放（水上巴士 07:00 – 21:00）",
        "architecturalHighlights": [
          "巴山斜拉桥（Thu Thiem 2）与 113m 斜塔，西贡河的新象征",
          "连接第 1 区至 Thanh Da - Binh An - Linh Dong 的西贡水上巴士码头仅需 15,000 越南盾",
          "通风良好的步道，可欣赏守添半岛和 Landmark 81 塔的全景"
        ],
        "audioScript": [
          "欢迎来到西贡河西岸的 Ben Bach Dang 公园 - 这是散步、观看日落和拍摄城市天际线的最美丽的地方。",
          "从这里，您可以完整捕捉横跨河流的 113 米高的巴山斜拉桥，或登上西贡水上巴士从水上欣赏西贡。",
          "据维基百科百科介绍：Bach Dang Wharf是越南胡志明市中部西贡西贡河沿岸公园和河码头区的名称。这里是城市居民和游客前来游玩的地方，也是逢年过节观赏烟花的地方。 Bach Dang 码头位于西贡河西岸的 Ton Duc Thang 街 2 号，包括码头和公园，长 1.3 公里，宽 23,400 平方米。"
        ]
      },
      "ja": {
        "name": "バクダン公園・バーソン橋（サイゴン水上バス）",
        "shortSummary": "1 区の中心部にあるサイゴン川沿いの美しい公園で、サイゴン水上バスに乗り、夕暮れ時のバソン斜張橋を一望できます。",
        "historicalEra": "歴史的船着場 – 2022年リニューアル",
        "openingHours": "24時間開放（水上バス 07:00 – 21:00）",
        "architecturalHighlights": [
          "サイゴン川の新しいシンボル、高さ 113 メートルの斜塔を備えたバソン斜張橋 (トゥ ティエム 2)",
          "1 区とタインダー - ビンアン - リンドンを結ぶサイゴン水上バス乗り場をわずか 15,000 ドンで利用可能",
          "トゥ ティエム半島とランドマーク 81 タワーのパノラマの景色を望む広々とした歩道"
        ],
        "audioScript": [
          "サイゴン川の西岸にあるベン バク ダン パークへようこそ。散歩したり、夕日を眺めたり、街のスカイラインの写真を撮ったりするのに最も美しい場所です。",
          "ここからは、川に架かる高さ 113 メートルのバソン斜張橋を完全に撮影したり、サイゴン水上バスに乗って水上からサイゴンを眺めることができます。",
          "ウィキペディア百科事典によると: バックダン埠頭は、ベトナムのホーチミン市中心部、サイゴンのサイゴン川のほとりにある公園と川の埠頭エリアの名前です。都市住民や観光客が集い、休日や正月には花火が打ち上げられる場所です。バックダン埠頭は、サイゴン川西岸の 2 Ton Duc Thang 通りに位置しており、長さ 1.3 km、幅 23,400 平方メートルの埠頭と公園が含まれています。"
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
        "shortSummary": "One of the oldest buildings in Saigon, built in 1865 right at the junction of the Saigon River - Ben Nghe Canal, used to be a signal post for ships entering and leaving the port.",
        "historicalEra": "Built in 1865",
        "openingHours": "Open 24/7",
        "architecturalHighlights": [
          "Classic octagonal architecture painted white and red tiled roof stands out next to the riverside park",
          "The tall flagpole once hung a navigational guide flag for the Saigon commercial port in the 19th century",
          "Located on the riverside walking axis connecting Bach Dang Wharf, Mong Bridge and Nha Rong Wharf"
        ],
        "audioScript": [
          "Welcome to the Thu Ngu Flagpole Relic - a more than 160-year-old historical structure located right at the confluence of the Saigon River and Ben Nghe Canal.",
          "Built in October 1865, the Thu Ngu Flagpole was formerly responsible for flying the signal flag to coordinate international ships entering and leaving the Saigon commercial port, and at the same time marked the heroic fighting spirit of the Southern people in 1945.",
          "According to Wikipedia encyclopedia: Thu Ngu flagpole is a structure located on Ton Duc Thang street, Saigon ward, Ho Chi Minh City, Vietnam. The flagpole was built by the French in October 1865 on the old foundation of the royal mandarin's palace, specializing in taking care of the Nguyen Dynasty's business. Up to now it is more than 159 years old. In 2016, Thu Ngu flagpole was ranked by the city as a Ho Chi Minh City-level historical relic. Thu Ngu flagpole was built by the French in October 1865 with the original name Mât des signaux, meaning Signal Pole. True to its original name, the flagpole's original function was to serve as a signal pole for ships entering and exiting the canals in the Saigon - Gia Dinh area. Since then, the flagpole has been 159 years old with many deteriorations and restorations."
        ]
      },
      "fr": {
        "name": "Mât de Pavillon Thu Ngu (1865)",
        "shortSummary": "L'un des bâtiments les plus anciens de Saigon, construit en 1865 juste à la jonction de la rivière Saigon et du canal Ben Nghe, était autrefois un poste de signalisation pour les navires entrant et sortant du port.",
        "historicalEra": "1865",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "L'architecture octogonale classique peinte en blanc et le toit en tuiles rouges se distinguent à côté du parc au bord de la rivière",
          "Le grand mât de drapeau accrochait autrefois un drapeau de guidage de navigation pour le port de commerce de Saigon au 19ème siècle",
          "Situé sur l'axe piétonnier au bord de la rivière reliant le quai Bach Dang, le pont Mong et le quai Nha Rong."
        ],
        "audioScript": [
          "Bienvenue à la relique du mât de drapeau de Thu Ngu, une structure historique vieille de plus de 160 ans située juste au confluent de la rivière Saigon et du canal Ben Nghe.",
          "Construit en octobre 1865, le mât de drapeau de Thu Ngu était autrefois chargé de faire flotter le pavillon de signalisation pour coordonner les navires internationaux entrant et sortant du port commercial de Saigon, et marquait en même temps l'esprit combatif héroïque des peuples du Sud en 1945.",
          "Selon l'encyclopédie Wikipédia : Le mât de drapeau Thu Ngu est une structure située dans la rue Ton Duc Thang, quartier de Saigon, Ho Chi Minh-Ville, Vietnam. Le mât du drapeau a été construit par les Français en octobre 1865 sur les anciennes fondations du palais royal du mandarin, spécialisé dans les affaires de la dynastie des Nguyen. À ce jour, il a plus de 159 ans. En 2016, le mât du drapeau de Thu Ngu a été classé par la ville comme une relique historique au niveau de Hô Chi Minh-Ville. Le mât de drapeau de Thu Ngu a été construit par les Français en octobre 1865 sous le nom original de Mât des signaux, ce qui signifie poteau de signal. Fidèle à son nom d'origine, la fonction originale du mât de drapeau était de servir de poteau de signalisation pour les navires entrant et sortant des canaux de la région de Saigon - Gia Dinh. Depuis, le mât du drapeau a 159 ans avec de nombreuses détériorations et restaurations."
        ]
      },
      "zh": {
        "name": "守御旗杆历史遗迹（1865年）",
        "shortSummary": "西贡最古老的建筑之一，建于 1865 年，位于西贡河 - Ben Nghe 运河交汇处，曾经是船舶进出港口的信号站。",
        "historicalEra": "始建于1865年",
        "openingHours": "全天开放",
        "architecturalHighlights": [
          "经典的八角形建筑，漆成白色和红色的瓦屋顶，在河滨公园旁显得格外引人注目",
          "高大的旗杆曾悬挂着19世纪西贡商港的导航旗",
          "位于连接 Bach Dang 码头、Mong 桥和 Nha Rong 码头的河滨步行轴上"
        ],
        "audioScript": [
          "欢迎来到 Thu Ngu 旗杆遗址 - 一座拥有 160 多年历史的历史建筑，位于西贡河和 Ben Nghe 运河的交汇处。",
          "秋五旗杆建于1865年10月，以前负责悬挂信号旗，协调国际船舶进出西贡商港，同时标志着1945年南方人民的英勇战斗精神。",
          "根据维基百科百科全书：Thu Ngu旗杆是位于越南胡志明市西贡区Ton Duc Thang街的一个结构。旗杆是法国人于1865年10月在皇家官府旧基础上修建的，专门照顾阮朝的事务。至今已有159年历史。 2016年，Thu Ngu旗杆被胡志明市列为胡志明市级历史文物。 Thu Ngu 旗杆由法国人于 1865 年 10 月建造，原名 Mât dessignaux，意思是信号杆。正如它原来的名字一样，旗杆最初的功能是作为进出西贡-嘉定地区运河的船只的信号杆。从那时起，旗杆已有 159 年的历史，经历了多次损坏和修复。"
        ]
      },
      "ja": {
        "name": "トゥーグー旗竿遺跡（1865年）",
        "shortSummary": "サイゴンで最も古い建物の 1 つで、1865 年にサイゴン川 - ベンゲ運河の合流点に建てられ、かつては港に出入りする船舶の信号所でした。",
        "historicalEra": "1865年建造",
        "openingHours": "24時間開放",
        "architecturalHighlights": [
          "白と赤の瓦屋根に塗られた古典的な八角形の建築物が川沿いの公園の隣にひときわ目立つ",
          "背の高い旗竿には、19 世紀にサイゴン商業港の航行誘導旗が掲げられていました。",
          "バクダン埠頭、モン橋、ナロン埠頭を結ぶ川沿いの散歩軸上に位置"
        ],
        "audioScript": [
          "トゥ グー旗竿遺跡へようこそ - サイゴン川とベンゲ運河の合流点に位置する 160 年以上の歴史的建造物です。",
          "1865 年 10 月に建てられたトゥ グー旗竿は、かつてはサイゴン商業港に出入りする国際船舶を調整する信号旗を掲揚する役割を担っていましたが、同時に 1945 年には南部の人々の英雄的な闘争心を象徴していました。",
          "ウィキペディア百科事典によると: トゥ グー旗竿は、ベトナム、ホーチミン市サイゴン区のトン ドゥック タン通りにある建造物です。この旗竿は、阮王朝の事業を管理することに特化して、1865 年 10 月にマンダリン王宮の古い基礎の上にフランス人によって建てられました。現在までに159年以上の歴史があります。 2016 年、トゥ グー旗竿はホーチミン市レベルの歴史的遺物として市によってランクされました。トゥ グー旗竿は 1865 年 10 月にフランス人によって建てられ、元の名前は信号ポールを意味する Mât des signalaux でした。元の名前の通り、旗竿の本来の機能は、サイゴン - ギアディン地域の運河に出入りする船舶の信号柱として機能することでした。それ以来、旗竿は劣化と修復を繰り返しながら 159 年が経ちました。"
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
        "shortSummary": "The turquoise steel pedestrian bridge, built in 1893–1894 by the Levallois-Perret company (Gustave Eiffel's company), has an extremely photogenic classic rainbow shape.",
        "historicalEra": "1893 – 1894",
        "openingHours": "Open 24/7",
        "architecturalHighlights": [
          "The 19th century riveted steel arch structure is 128m long, painted in a characteristic jade green color",
          "Curved design like a rainbow - beautiful vintage photo angle with Bitexco Tower in the background",
          "Located right next to the 1929 Art Deco State Bank Building"
        ],
        "audioScript": [
          "Welcome to Mong Bridge - one of the oldest steel bridges in Saigon built in 1893 to 1894 by Levallois-Perret construction company of engineer Gustave Eiffel.",
          "Today, Mong Bridge is reserved for pedestrians, a place to enjoy the wind, watch the sunset and take souvenir photos, an extremely interesting contrast between the hundred-year-old iron and steel features and the modern Bitexco Tower.",
          "According to Wikipedia encyclopedia: Mong Bridge or Arc-en-ciel Bridge is a bridge spanning Ben Nghe Canal, connecting District 1 and District 4, Ho Chi Minh City, Vietnam. This is considered one of the oldest bridges in this city. The bridge was built by the French shipping company Messageries Maritimes in 1881-1883, 128 meters long, 5.2 meters wide, 0.5 meter wide sidewalk, built of solid steel."
        ]
      },
      "fr": {
        "name": "Pont Mong (Passerelle Eiffel · 1894)",
        "shortSummary": "La passerelle piétonne en acier turquoise, construite en 1893-1894 par l'entreprise Levallois-Perret (entreprise de Gustave Eiffel), présente une forme arc-en-ciel classique extrêmement photogénique.",
        "historicalEra": "1893 – 1894",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "La structure en arc en acier riveté du XIXe siècle mesure 128 m de long et est peinte dans une couleur vert jade caractéristique.",
          "Design incurvé comme un arc-en-ciel - bel angle de photo vintage avec la tour Bitexco en arrière-plan",
          "Situé juste à côté du bâtiment Art déco de la Banque d'État de 1929"
        ],
        "audioScript": [
          "Bienvenue au pont Mong - l'un des plus anciens ponts en acier de Saigon construit entre 1893 et 1894 par l'entreprise de construction de Levallois-Perret de l'ingénieur Gustave Eiffel.",
          "Aujourd'hui, le pont Mong est réservé aux piétons, un lieu pour profiter du vent, regarder le coucher du soleil et prendre des photos souvenirs, un contraste extrêmement intéressant entre les éléments centenaires en fer et en acier et la tour Bitexco moderne.",
          "Selon l'encyclopédie Wikipédia : Le pont Mong ou pont Arc-en-ciel est un pont enjambant le canal Ben Nghe, reliant le district 1 et le district 4, à Hô Chi Minh-Ville, au Vietnam. Celui-ci est considéré comme l'un des ponts les plus anciens de cette ville. Le pont a été construit par la compagnie maritime française Messageries Maritimes en 1881-1883, long de 128 mètres, large de 5,2 mètres, trottoir de 0,5 mètre de large, construit en acier massif."
        ]
      },
      "zh": {
        "name": "彩虹桥（西贡百年铁桥 · 1894年）",
        "shortSummary": "绿松石色钢制人行桥由 Levallois-Perret 公司（古斯塔夫·埃菲尔的公司）于 1893 年至 1894 年建造，具有极其上镜的经典彩虹形状。",
        "historicalEra": "1893 – 1894年",
        "openingHours": "全天开放",
        "architecturalHighlights": [
          "19 世纪的铆接钢拱结构，长 128m，漆成特有的翠绿色",
          "弧形设计如彩虹 — 美丽的复古照片角度，背景为 Bitexco 塔",
          "毗邻 1929 年装饰艺术风格的国家银行大楼"
        ],
        "audioScript": [
          "欢迎来到芒桥 - 西贡最古老的钢桥之一，由工程师 Gustave Eiffel 的 Levallois-Perret 建筑公司于 1893 年至 1894 年建造。",
          "如今，芒桥专供行人通行，是一个享受风、看日落、拍纪念照的地方，百年的钢铁风貌与现代化的 Bitexco 大厦形成了极其有趣的对比。",
          "据维基百科百科介绍：Mong Bridge或Arc-en-ciel Bridge是一座横跨Ben Nghe运河的桥梁，连接越南胡志明市第一区和第四区。它被认为是这座城市最古老的桥梁之一。该桥由法国航运公司Messageries Maritimes于1881-1883年建造，长128米，宽5.2米，人行道宽0.5米，采用实心钢材建造。"
        ]
      },
      "ja": {
        "name": "モン橋（1894年エッフェル社建造の歩道橋）",
        "shortSummary": "1893 年から 1894 年にルヴァロワ ペレ会社 (ギュスターヴ エッフェルの会社) によって建設されたターコイズブルーの鋼製歩道橋は、非常に写真映えする古典的な虹の形をしています。",
        "historicalEra": "1893年 – 1894年",
        "openingHours": "24時間開放",
        "architecturalHighlights": [
          "19 世紀のリベットで留められた鋼製アーチ構造は長さ 128 メートルで、特徴的な翡翠色に塗装されています。",
          "虹のような曲線デザイン - ビテクスコタワーを背景にした美しいビンテージ写真の角度",
          "1929 年アールデコ様式の州立銀行ビルのすぐ隣に位置"
        ],
        "audioScript": [
          "モン橋へようこそ - 技術者ギュスターヴ エッフェルのルヴァロワ ペレ建設会社によって 1893 年から 1894 年に建設されたサイゴン最古の鋼橋の 1 つです。",
          "現在、モン橋は歩行者専用となっており、風を感じたり、夕日を眺めたり、記念写真を撮ったりできる場所となっており、100 年前の鉄鋼の特徴と現代のビテクスコ タワーの非常に興味深いコントラストとなっています。",
          "ウィキペディア百科事典によると: モン橋またはアルカンシエル橋は、ベトナムのホーチミン市の 1 区と 4 区を結ぶベンゲ運河にかかる橋です。これはこの都市で最も古い橋の 1 つと考えられています。この橋は 1881 年から 1883 年にかけてフランスの海運会社メッセージリー マリタイムズによって建設され、長さ 128 メートル、幅 5.2 メートル、歩道の幅 0.5 メートルで、頑丈な鋼で造られています。"
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
        "shortSummary": "The most famous urban heritage roundabout in Saigon with a tall octagonal tower with 5 white columns, a meeting place to snack on mixed rice paper and feel the rhythm of young life in District 3.",
        "historicalEra": "1965 – 1967",
        "openingHours": "Open 24/7 (Liveliest 17:00 – 22:30)",
        "architecturalHighlights": [
          "Octagonal lake with 4 spiral walkways leading to the central platform and 5 concrete columns with stylized hands",
          "Located at the intersection of 3 roads shaded by the most beautiful old trees in the central area",
          "Surrounded by a chain of garden cafes, grilled rice paper, and peach tea typical of Saigon students"
        ],
        "audioScript": [
          "Welcome to Turtle Lake - International Construction Site in District 3, an urban architectural work bearing the mark of the 1960s designed by Architect Nguyen Ky.",
          "Not only is it a green, ancient intersection less than a 5-minute walk from Notre Dame Cathedral, Turtle Lake is also an unforgettable street food memory with mixed rice paper, stir-fried corn and cool afternoons of city residents.",
          "According to Wikipedia encyclopedia: Turtle Lake is the folk name of an artificial fountain lake located at the intersection of three streets Vo Van Tan, Pham Ngoc Thach and Tran Cao Van, Xuan Hoa ward (former District 3), Ho Chi Minh City, forming a roundabout-style intersection at the same level. This area, officially named International Square, is currently one of the places with culinary activities almost from morning to night, with many cafes and shops around."
        ]
      },
      "fr": {
        "name": "Lac de la Tortue (Place Internationale · 1967)",
        "shortSummary": "Le rond-point du patrimoine urbain le plus célèbre de Saigon avec une haute tour octogonale à 5 colonnes blanches, un lieu de rendez-vous pour grignoter du papier de riz mélangé et ressentir le rythme de la jeune vie du District 3.",
        "historicalEra": "1965 – 1967",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "Lac octogonal avec 4 passerelles en spirale menant à la plateforme centrale et 5 colonnes en béton avec mains stylisées",
          "Situé à l'intersection de 3 routes ombragées par les plus beaux arbres centenaires de la zone centrale",
          "Entouré d'une chaîne de cafés-jardins, de papier de riz grillé et de thé à la pêche typique des étudiants de Saigon"
        ],
        "audioScript": [
          "Bienvenue à Turtle Lake - Chantier International du District 3, une œuvre architecturale urbaine portant la marque des années 1960 conçue par l'architecte Nguyen Ky.",
          "Non seulement c'est un ancien carrefour vert à moins de 5 minutes à pied de la cathédrale Notre-Dame, mais Turtle Lake est aussi un souvenir inoubliable de cuisine de rue avec du papier de riz mélangé, du maïs sauté et des après-midi frais des habitants de la ville.",
          "Selon l'encyclopédie Wikipédia : Turtle Lake est le nom populaire d'un lac de fontaine artificiel situé à l'intersection de trois rues Vo Van Tan, Pham Ngoc Thach et Tran Cao Van, quartier de Xuan Hoa (ancien district 3), Hô Chi Minh-Ville, formant une intersection de style rond-point au même niveau. Cette zone, officiellement nommée Place Internationale, est actuellement l'un des lieux où se déroulent des activités culinaires presque du matin au soir, avec de nombreux cafés et magasins aux alentours."
        ]
      },
      "zh": {
        "name": "乌龟湖（国际广场 · 1967年）",
        "shortSummary": "西贡最著名的城市遗产环形交叉路口，拥有一座带有 5 根白色柱子的高八角形塔楼，是享用混合米纸并感受第 3 区年轻生活节奏的聚会场所。",
        "historicalEra": "1965 – 1967年",
        "openingHours": "全天开放（17:00 – 22:30最热闹）",
        "architecturalHighlights": [
          "八角形湖泊，有 4 条螺旋走道通向中央平台，还有 5 根带有风格化手的混凝土柱",
          "位于中心区最美丽的古树掩映下的 3 条道路的交叉口",
          "周围环绕着一系列花园咖啡馆，提供西贡学生特有的烤米纸和桃茶"
        ],
        "audioScript": [
          "欢迎来到龟湖 - 第三区国际建筑工地，这是一座由建筑师 Nguyen Ky 设计的带有 20 世纪 60 年代标志的城市建筑作品。",
          "龟湖不仅是距离巴黎圣母院不到5分钟步行路程的绿色古老十字路口，也是令人难忘的街头美食记忆，混合米纸、炒玉米和城市居民凉爽的午后时光。",
          "据维基百科百科介绍：龟湖是一个人工喷泉湖的民间名称，位于胡志明市春和区（原第三区）武文新、范玉石和陈高文三条街道的交叉口，形成同层环岛式交叉路口。这个区域的正式名称是国际广场，目前是几乎从早到晚都有美食活动的地方之一，周围有很多咖啡馆和商店。"
        ]
      },
      "ja": {
        "name": "亀湖（国際広場・1967年）",
        "shortSummary": "サイゴンで最も有名な都市遺産のロータリー。5 本の白い柱を備えた高い八角形の塔があり、ミックス ライス ペーパーを軽食し、第 3 地区の若者の生活のリズムを感じることができる集会場です。",
        "historicalEra": "1965年 – 1967年",
        "openingHours": "24時間開放（夕方〜夜が賑やか）",
        "architecturalHighlights": [
          "中央のプラットフォームにつながる 4 本のらせん状の歩道と、様式化された手の付いた 5 本のコンクリート柱がある八角形の湖",
          "中心部で最も美しい古木が生い茂る3つの道路の交差点に位置",
          "チェーン店のガーデンカフェに囲まれて、ライスペーパーのグリルとサイゴンの学生特有のピーチティーを楽しむ"
        ],
        "audioScript": [
          "タートル レイク - 3 区の国際建設現場へようこそ。建築家グエン キーが設計した 1960 年代の痕跡を残す都市建築作品です。",
          "ノートルダム大聖堂から徒歩 5 分以内にあるタートル レイクは、緑豊かな古代の交差点であるだけでなく、ミックス ライス ペーパー、トウモロコシの炒め物、そして都市住民の涼しい午後を過ごした忘れられない屋台の食べ物の記憶でもあります。",
          "ウィキペディア百科事典によると: タートル湖は、ホーチミン市スアンホア区 (旧 3 区) のヴォー ヴァン タン通り、ファム ゴック タック通り、トラン カオ ヴァン通りの 3 つの交差点に位置し、同じレベルでロータリー形式の交差点を形成している人工噴水湖の民間名です。正式名称は国際広場と呼ばれるこのエリアは、現在ではカフェやショップが数多く立ち並び、ほぼ朝から晩までグルメが楽しめる場所の一つとなっています。"
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
        "shortSummary": "The 68-storey tower, 262m high, is inspired by a lotus bud rising into the blue sky, with a helipad on the 52nd floor and a 360° Saigon Skydeck observation deck on the 49th floor.",
        "historicalEra": "Completed in 2010 (Carlos Zapata)",
        "openingHours": "09:30 – 21:30 Daily",
        "architecturalHighlights": [
          "The shape of a rising lotus bud - a symbol of the modern transformation of Ho Chi Minh City",
          "Saigon Skydeck observatory on the 49th floor (178m high) with 360° panoramic binoculars & Mini Ao Dai Museum",
          "The helipad extends 22m into the air on the 52nd floor, unique in Vietnam"
        ],
        "audioScript": [
          "Welcome to Bitexco Financial Tower at 2 Hai Trieu, District 1 - a 68-storey architectural work inspired by the Vietnamese lotus flower designed by architect Carlos Zapata.",
          "From the Saigon Skydeck Observation Deck on the 49th floor, you can enjoy a 360-degree view of all the historical relics of District 1, the winding Saigon River and the brilliant city lights at sunset.",
          "According to Wikipedia encyclopedia: Bitexco Financial Tower or Bitexco Financial Tower is a skyscraper built in Saigon ward, Ho Chi Minh City. The building is built on an area of ​​nearly 6,100 m². Total investment capital is estimated at 220 million USD, invested in construction by Bitexco Group based in Hanoi."
        ]
      },
      "fr": {
        "name": "Tour Bitexco & Observatoire Saigon Skydeck",
        "shortSummary": "La tour de 68 étages, haute de 262 m, s'inspire d'un bouton de lotus s'élevant dans le ciel bleu, avec un héliport au 52ème étage et une plate-forme d'observation à 360° Saigon Skydeck au 49ème étage.",
        "historicalEra": "Inaugurée en 2010",
        "openingHours": "09h30 – 21h30",
        "architecturalHighlights": [
          "La forme d'un bourgeon de lotus montant - un symbole de la transformation moderne de Hô Chi Minh-Ville",
          "Observatoire Saigon Skydeck au 49ème étage (178 m de haut) avec jumelles panoramiques à 360° et musée Mini Ao Dai",
          "L'héliport s'étend à 22 m de haut au 52ème étage, unique au Vietnam"
        ],
        "audioScript": [
          "Bienvenue à la tour financière Bitexco au 2 Hai Trieu, district 1 - une œuvre architecturale de 68 étages inspirée de la fleur de lotus vietnamienne conçue par l'architecte Carlos Zapata.",
          "Depuis la terrasse d'observation Saigon Skydeck, au 49ème étage, vous pourrez profiter d'une vue à 360 degrés sur toutes les reliques historiques du district 1, la sinueuse rivière Saigon et les lumières éclatantes de la ville au coucher du soleil.",
          "Selon l'encyclopédie Wikipédia : Bitexco Financial Tower ou Bitexco Financial Tower est un gratte-ciel construit dans le quartier de Saigon, à Hô Chi Minh-Ville. Le bâtiment est édifié sur une superficie de près de 6 100 m². Le capital d'investissement total est estimé à 220 millions de dollars, investis dans la construction par le groupe Bitexco basé à Hanoï."
        ]
      },
      "zh": {
        "name": "金融塔（Bitexco）与西贡观景台",
        "shortSummary": "这座68层的塔楼高262m，其设计灵感来自一朵升入蓝天的莲花花蕾，52层设有直升机停机坪，49层设有360° Saigon Skydeck观景台。",
        "historicalEra": "2010年落成",
        "openingHours": "09:30 – 21:30",
        "architecturalHighlights": [
          "莲花花蕾的形状——胡志明市现代化转型的象征",
          "西贡 Skydeck 观景台位于 49 层（178m 高），配有 360° 全景双筒望远镜和迷你奥黛博物馆",
          "52层直升机停机坪向空中延伸22m，越南独一无二"
        ],
        "audioScript": [
          "欢迎来到位于第一区 Hai Trieu 2 号的 Bitexco 金融大厦，这是一栋 68 层的建筑作品，其灵感源自建筑师 Carlos Zapata 设计的越南莲花。",
          "从49层的Saigon Skydeck观景台，您可以360度欣赏第一区的所有历史遗迹、蜿蜒的西贡河和日落时绚丽的城市灯光。",
          "据维基百科百科全书介绍：Bitexco金融塔或Bitexco金融塔是一座建于胡志明市西贡区的摩天大楼。该建筑占地近6,100平方米。总投资预计为2.2亿美元，由总部位于河内的Bitexco集团投资建设。"
        ]
      },
      "ja": {
        "name": "ビテクスコ・フィナンシャルタワー＆サイゴン・スカイデック",
        "shortSummary": "高さ 262 メートルの 68 階建てのタワーは、青空にそびえる蓮のつぼみをイメージしており、52 階にはヘリポートがあり、49 階には 360 度見渡せるサイゴン スカイデッキ展望台があります。",
        "historicalEra": "2010年完成",
        "openingHours": "09:30 – 21:30",
        "architecturalHighlights": [
          "立ち上がる蓮のつぼみの形 - ホーチミン市の近代的な変革の象徴",
          "360° パノラマ双眼鏡とミニ アオザイ ミュージアムを備えた 49 階 (高さ 178 m) のサイゴン スカイデッキ展望台",
          "ベトナムでは珍しい、52階の空中に22メートル伸びるヘリポート"
        ],
        "audioScript": [
          "1 区ハイ トリウ 2 番地にあるビテクスコ フィナンシャル タワーへようこそ - 建築家カルロス サパタが設計したベトナムの蓮の花にインスピレーションを得た 68 階建ての建築物です。",
          "49 階にあるサイゴン スカイデッキ展望台からは、1 区の歴史的遺跡すべて、曲がりくねったサイゴン川、そして夕暮れ時の鮮やかな街の明かりを 360 度見渡すことができます。",
          "ウィキペディア百科事典によると: ビテクスコ フィナンシャル タワーまたはビテクスコ フィナンシャル タワーは、ホーチミン市サイゴン区に建てられた超高層ビルです。建物は約6,100平方メートルの面積に建てられています。総投資資本は2億2,000万ドルと推定され、ハノイに拠点を置くBitexco Groupによって建設に投資されました。"
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
        "shortSummary": "The tallest building in Vietnam (461.2m) is inspired by traditional bamboo bundles, and comes with a 14-hectare riverside park with a red bridge, Japanese garden and a beautiful full-body view of the tower.",
        "historicalEra": "Completed in 2018 (461.2m)",
        "openingHours": "09:30 – 22:00 (Park 05:00 – 21:30)",
        "architecturalHighlights": [
          "Design of 25 cylinders simulating bundles of Vietnamese bamboo reaching 461.2m high - the highest in Southeast Asia when inaugurated",
          "Landmark 81 SkyView observatory on floors 79–81 with SkyTouch glass bridge and virtual reality experience",
          "14ha Central Park along the Saigon River with Koi fish garden, Japanese-style red wooden bridge & sunset viewing lawn"
        ],
        "audioScript": [
          "Welcome to Landmark 81 and Vinhomes Central Park on the banks of the Saigon River, Binh Thanh District.",
          "With a height of 461.2 meters and 81 floors, inspired by the image of traditional bamboo bundles of solidarity of the Vietnamese people, Landmark 81 is the roof of Vietnam and the most spectacular panoramic view of the city from the 79th to 81st floors.",
          "According to Wikipedia encyclopedia: Vincom Landmark 81, or simply Landmark 81 or also known as The Landmark 81, is a super tall skyscraper in Ho Chi Minh City belonging to the Vinhomes Central Park project complex worth 1.4 billion USD invested by Tan Lien Phat Construction Investment Joint Stock Company of Vingroup. Landmark 81 is the tallest building in Vietnam, the second tallest building in Southeast Asia (the record for tallest building will be broken by Merdeka 118 in 2022), and the 17th tallest building in the world."
        ]
      },
      "fr": {
        "name": "Landmark 81 SkyView & Parc Central Park",
        "shortSummary": "Le bâtiment le plus haut du Vietnam (461,2 m) s'inspire des fagots de bambou traditionnels et comprend un parc au bord de la rivière de 14 hectares avec un pont rouge, un jardin japonais et une belle vue panoramique sur la tour.",
        "historicalEra": "2018",
        "openingHours": "09h30 – 22h00",
        "architecturalHighlights": [
          "Conception de 25 cylindres simulant des faisceaux de bambous vietnamiens atteignant 461,2 m de haut, le plus haut d'Asie du Sud-Est lors de son inauguration",
          "Observatoire Landmark 81 SkyView aux étages 79 à 81 avec pont en verre SkyTouch et expérience de réalité virtuelle",
          "Central Park de 14 ha le long de la rivière Saigon avec jardin de poissons Koi, pont en bois rouge de style japonais et pelouse pour admirer le coucher du soleil"
        ],
        "audioScript": [
          "Bienvenue au Landmark 81 et au Vinhomes Central Park, sur les rives de la rivière Saigon, dans le district de Binh Thanh.",
          "Avec une hauteur de 461,2 mètres et 81 étages, inspiré de l'image des paquets de bambou traditionnels de solidarité du peuple vietnamien, Landmark 81 est le toit du Vietnam et la vue panoramique la plus spectaculaire de la ville du 79e au 81e étage.",
          "Selon l'encyclopédie Wikipédia : Vincom Landmark 81, ou simplement Landmark 81 ou également connu sous le nom de The Landmark 81, est un très grand gratte-ciel situé à Hô Chi Minh-Ville appartenant au complexe du projet Vinhomes Central Park d'une valeur de 1,4 milliard de dollars investi par Tan Lien Phat Construction Investment Joint Stock Company de Vingroup. Landmark 81 est le plus haut bâtiment du Vietnam, le deuxième plus haut bâtiment d'Asie du Sud-Est (le record du plus haut bâtiment sera battu par Merdeka 118 en 2022) et le 17e plus haut bâtiment du monde."
        ]
      },
      "zh": {
        "name": "地标81大厦（Landmark 81）与中央公园",
        "shortSummary": "越南最高建筑（461.2m）的设计灵感来自于传统的竹束，并配有占地14公顷的河滨公园，内有红桥、日式花园和美丽的塔楼全身景观。",
        "historicalEra": "2018年落成",
        "openingHours": "09:30 – 22:00（公园 05:00 – 21:30）",
        "architecturalHighlights": [
          "25个圆柱体模拟越南竹束设计，落成时高达461.2m，为东南亚最高高度",
          "Landmark 81 SkyView 观景台位于 79-81 层，设有 SkyTouch 玻璃桥和虚拟现实体验",
          "西贡河沿岸 14 公顷的中央公园，设有锦鲤鱼园、日式红色木桥和日落观赏草坪"
        ],
        "audioScript": [
          "欢迎来到平盛区西贡河畔的 Landmark 81 和 Vinhomes 中央公园。",
          "Landmark 81 高度 461.2 米，共 81 层，灵感源自越南人民团结一致的传统竹捆形象，是越南的屋顶，从 79 层到 81 层可欣赏到最壮观的城市全景。",
          "据维基百科百科介绍：Vincom Landmark 81，简称Landmark 81或又称The Landmark 81，是胡志明市一座超高层摩天大楼，属于Vingroup陈联发建设投资股份公司投资的价值14亿美元的Vinhomes Central Park项目综合体。 Landmark 81是越南第一高楼，东南亚第二高楼（最高楼纪录将于2022年被Merdeka 118打破），也是世界第17高楼。"
        ]
      },
      "ja": {
        "name": "ランドマーク81 スカイビュー＆セントラルパーク",
        "shortSummary": "ベトナムで最も高いこの建物 (461.2 m) は、伝統的な竹の束からインスピレーションを得たもので、赤い橋、日本庭園、塔の美しい全身景色を望む 14 ヘクタールの川沿いの公園が併設されています。",
        "historicalEra": "2018年開業",
        "openingHours": "09:30 – 22:00（公園 05:00 – 21:30）",
        "architecturalHighlights": [
          "高さ461.2メートルに達するベトナムの竹の束を模した25本のシリンダーの設計 - 完成時は東南アジアで最も高い",
          "ランドマーク 81 の 79 ～ 81 階にある SkyView 展望台には、SkyTouch ガラス橋と仮想現実体験が備わっています。",
          "サイゴン川沿いの 14 ヘクタールの中央公園。鯉の庭園、日本風の赤い木の橋、夕日を眺める芝生がある"
        ],
        "audioScript": [
          "ビンタイン区のサイゴン川のほとりにあるランドマーク 81 とビンホームズ セントラル パークへようこそ。",
          "ベトナム人民の団結を表す伝統的な竹束のイメージからインスピレーションを得た高さ461.2メートル、81階建てのランドマーク81は、ベトナムの屋根であり、79階から81階からは市内の最も壮観なパノラマの景色を眺めることができます。",
          "ウィキペディア百科事典によると: ビンコム ランドマーク 81、または単にランドマーク 81、またはランドマーク 81 としても知られる超高層ビルは、ビングループのタン リエン ファット建設投資株式会社が投資した 14 億ドル相当のビンホームズ セントラル パーク プロジェクト複合施設に属するホーチミン市の超高層ビルです。ランドマーク 81 は、ベトナムで最も高い建物であり、東南アジアで 2 番目に高い建物であり (最も高い建物の記録は 2022 年にムルデカ 118 に破られるでしょう)、世界で 17 番目に高い建物です。"
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
        "shortSummary": "The first modern pedestrian bridge in Ho Chi Minh City is 170m long across Crescent Lake, brilliant with rainbow-colored LED lights and an artificial waterfall every weekend night.",
        "historicalEra": "Opened in 2010",
        "openingHours": "Open 24/7 (Lights 18:00 – 21:30)",
        "architecturalHighlights": [
          "The bridge's surface is paved with LED lights that simulate the galaxy sparkling under pedestrians' footsteps",
          "The two ends of the bridge are designed with spacious Moon and Sun squares",
          "The park space along Crescent Lake is peaceful, ideal for evening walks"
        ],
        "audioScript": [
          "Welcome to Starlight Bridge and Crescent Lake in Phu My Hung urban area, District 7.",
          "With a length of 170 meters, softly curving across the vast lake, Starlight Bridge stands out every night with thousands of LED lights that change color like a strip of stars and artistic water spray screens on both sides of the bridge.",
          "According to Wikipedia encyclopedia: Phu My Hung Urban Area is an urban area belonging to Tan Hung and Tan My wards located in the south of Ho Chi Minh City. This is where high-income people live, managed by Phu My Hung Development Company Limited (old name: Phu My Hung Joint Venture Company Limited). On June 26, 2008, the Ministry of Construction and the People's Committee of Ho Chi Minh City recognized Phu My Hung urban area as a \"model urban area\" of Vietnam."
        ]
      },
      "fr": {
        "name": "Pont Starlight & Lac du Croissant (Phu My Hung)",
        "shortSummary": "Le premier pont piétonnier moderne d'Hô Chi Minh-Ville mesure 170 m de long et traverse le lac Crescent, brillant de lumières LED aux couleurs de l'arc-en-ciel et d'une cascade artificielle tous les soirs de week-end.",
        "historicalEra": "2010",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "La surface du pont est pavée de lumières LED qui simulent la galaxie scintillant sous les pas des piétons",
          "Les deux extrémités du pont sont conçues avec de spacieux carrés de Lune et de Soleil",
          "L'espace parc le long du lac Crescent est paisible, idéal pour les promenades en soirée."
        ],
        "audioScript": [
          "Bienvenue au pont Starlight et au lac Crescent dans la zone urbaine de Phu My Hung, district 7.",
          "D'une longueur de 170 mètres, courbant doucement le vaste lac, Starlight Bridge se démarque chaque nuit avec des milliers de lumières LED qui changent de couleur comme une bande d'étoiles et des écrans artistiques de pulvérisation d'eau des deux côtés du pont.",
          "Selon l'encyclopédie Wikipédia : La zone urbaine de Phu My Hung est une zone urbaine appartenant aux quartiers de Tan Hung et Tan My située au sud d'Hô Chi Minh-Ville. C'est là que vivent les personnes à revenus élevés, gérées par Phu My Hung Development Company Limited (ancien nom : Phu My Hung Joint Venture Company Limited). Le 26 juin 2008, le ministère de la Construction et le Comité populaire de Hô Chi Minh-Ville ont reconnu la zone urbaine de Phu My Hung comme « zone urbaine modèle » du Vietnam."
        ]
      },
      "zh": {
        "name": "星光桥与半月湖（富美兴 · 第七郡）",
        "shortSummary": "胡志明市第一座现代化步行桥长170m，横跨月牙湖，彩虹色的LED灯光璀璨夺目，每个周末晚上都会有人工瀑布。",
        "historicalEra": "2010年落成",
        "openingHours": "全天开放（18:00 – 21:30亮灯）",
        "architecturalHighlights": [
          "桥面铺有LED灯，模拟行人脚步下闪烁的银河",
          "桥的两端设计有宽敞的月亮和太阳广场",
          "月牙湖畔的公园空间宁静，非常适合晚间散步"
        ],
        "audioScript": [
          "欢迎来到第七区富美兴市区的星光桥和月牙湖。",
          "星光桥全长 170 米，在浩瀚的湖面上轻轻弯曲，每到夜晚，数千盏 LED 灯会像一条星星一样变换颜色，桥两侧还有艺术喷水屏。",
          "根据维基百科百科：富美兴市区是位于胡志明市南部的新兴区和新美区的市区。这里是高收入人群居住的地方，由富美兴发展有限公司（旧名：富美兴合资有限公司）管理。 2008年6月26日，建设部和胡志明市人民委员会认定富美兴城区为越南“模范城区”。"
        ]
      },
      "ja": {
        "name": "スターライトブリッジ＆クレセント湖（7区フーミーフン）",
        "shortSummary": "ホーチミン市初の近代的な歩道橋は三日月湖に架かる長さ 170 メートルで、毎週末の夜には虹色の LED ライトと人工の滝で輝きます。",
        "historicalEra": "2010年開通",
        "openingHours": "24時間開放（ライトアップ 18:00 – 21:30）",
        "architecturalHighlights": [
          "橋の表面にはLEDライトが敷き詰められ、歩行者の足音の下で輝く銀河をイメージしています。",
          "橋の両端には広々とした月と太陽の四角形がデザインされています。",
          "三日月湖沿いの公園スペースは静かで、夜の散歩に最適です"
        ],
        "audioScript": [
          "7 区フーミーフン市街地にあるスターライト ブリッジとクレセント湖へようこそ。",
          "広大な湖に沿って緩やかにカーブする長さ 170 メートルのスターライト ブリッジは、星の帯のように色が変化する何千もの LED ライトと橋の両側にある芸術的な水しぶきスクリーンで毎晩注目を集めています。",
          "ウィキペディア百科事典によると: フーミーフン市街地は、ホーチミン市の南部に位置するタンフン区とタンミー区に属する市街地です。ここはフーミーフン開発会社（旧名：フーミーフンジョイントベンチャー会社）が管理する高所得者が住むエリアです。 2008年6月26日、建設省とホーチミン市人民委員会はフーミーフン市街地をベトナムの「モデル都市地区」として認定した。"
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
        "shortSummary": "The oldest and most sacred Hindu temple in Ho Chi Minh City was built in the late 19th century right near Ben Thanh Market, featuring a Gopuram gate tower with brilliant South Indian sculptures.",
        "historicalEra": "Late 19th Century (~1885)",
        "openingHours": "07:00 – 19:00 Daily",
        "architecturalHighlights": [
          "The 12m high Gopuram gate tower is carved with dozens of colorful statues of Hindu gods",
          "The main shrine worships Goddess Mariamman and two guardian gods Maduraiveeran and Pechiamman",
          "Stone walls covered with reliefs of 18 Indian gods and a space filled with South Asian incense in the middle of District 1"
        ],
        "audioScript": [
          "Welcome to Mariamman Hindu Temple at 45 Truong Dinh, just a few minutes' walk from Ben Thanh Market.",
          "Built by the Indian Tamil community in the late 19th century, the temple is a vivid testament to Saigon's multicultural identity with its vividly carved Gopuram gate tower and colorful South Indian religious space.",
          "According to Wikipedia encyclopedia: Ba An Temple, also known as Ba Mariamman Temple, is a temple worshiping the Hindu goddess Mariamman in Ho Chi Minh City, Vietnam. This temple was built by Palaniappa Thevar from Pattukkottai, Thanjavur district, a trading community of Tamil Nadu, India, in the late 19th century."
        ]
      },
      "fr": {
        "name": "Temple Hindou Mariamman (1885)",
        "shortSummary": "Le temple hindou le plus ancien et le plus sacré d'Hô Chi Minh-Ville a été construit à la fin du XIXe siècle, juste à côté du marché de Ben Thanh, avec une tour-porte Gopuram ornée de brillantes sculptures du sud de l'Inde.",
        "historicalEra": "Fin XIXe siècle",
        "openingHours": "07h00 – 19h00",
        "architecturalHighlights": [
          "La tour-porte Gopuram, haute de 12 m, est sculptée de dizaines de statues colorées de dieux hindous.",
          "Le sanctuaire principal vénère la déesse Mariamman et deux dieux gardiens Maduraiveeran et Pechiamman",
          "Des murs en pierre recouverts de reliefs de 18 dieux indiens et un espace rempli d'encens d'Asie du Sud au milieu du District 1"
        ],
        "audioScript": [
          "Bienvenue au temple hindou Mariamman au 45 Truong Dinh, à seulement quelques minutes à pied du marché Ben Thanh.",
          "Construit par la communauté indienne tamoule à la fin du XIXe siècle, le temple est un témoignage frappant de l'identité multiculturelle de Saigon avec sa tour-porte Gopuram aux couleurs vives et son espace religieux coloré du sud de l'Inde.",
          "Selon l'encyclopédie Wikipédia : le temple Ba An, également connu sous le nom de temple Ba Mariamman, est un temple vénérant la déesse hindoue Mariamman à Hô Chi Minh-Ville, au Vietnam. Ce temple a été construit par Palaniappa Thevar de Pattukkottai, district de Thanjavur, une communauté commerçante du Tamil Nadu, en Inde, à la fin du 19e siècle."
        ]
      },
      "zh": {
        "name": "马里安曼印度教神庙（1885年）",
        "shortSummary": "胡志明市最古老、最神圣的印度教寺庙建于 19 世纪末，位于滨城市场附近，拥有一座带有精美南印度雕塑的 Gopuram 门塔。",
        "historicalEra": "19世纪末（约1885年）",
        "openingHours": "07:00 – 19:00",
        "architecturalHighlights": [
          "高12m的Gopuram门塔上雕刻着数十尊色彩缤纷的印度教神像",
          "主神殿供奉着玛丽安曼女神和两位守护神马杜拉伊兰 (Maduraiveeran) 和佩奇安曼 (Pechiamman)",
          "第一区中部的石墙上刻有 18 个印度神灵的浮雕，还有一个充满南亚香的空间"
        ],
        "audioScript": [
          "欢迎来到位于 45 Truong Dinh 的马里安曼印度教寺庙，距离滨城市场仅几分钟步行路程。",
          "该寺庙由印度泰米尔社区于 19 世纪末建造，其雕刻生动的 Gopuram 门塔和色彩缤纷的南印度宗教空间生动地证明了西贡的多元文化特征。",
          "据维基百科百科介绍：巴安寺，又称巴马里安曼寺，是越南胡志明市一座供奉印度教女神马里安曼的寺庙。这座寺庙是由来自印度泰米尔纳德邦坦贾武尔地区帕图库泰（Pattukkottai）贸易社区的 Palaniappa Thevar 于 19 世纪末建造的。"
        ]
      },
      "ja": {
        "name": "マリアマン・ヒンドゥー寺院（1885年）",
        "shortSummary": "ホーチミン市で最も古く、最も神聖なヒンズー教寺院は、ベンタイン市場のすぐ近くに 19 世紀後半に建てられ、南インドの華麗な彫刻が施されたゴープラム門塔が特徴です。",
        "historicalEra": "19世紀末（1885年頃）",
        "openingHours": "07:00 – 19:00",
        "architecturalHighlights": [
          "高さ 12 メートルのゴープラム門塔には、ヒンズー教の神々の色とりどりの像が何十体も彫られています。",
          "本殿にはマリアマン女神と二柱の守護神マドゥライヴェラン神とペチアンマン神が祀られています。",
          "1 区の真ん中にあるインド 18 の神々のレリーフで覆われた石垣と南アジアの香で満たされた空間"
        ],
        "audioScript": [
          "ベンタイン市場から徒歩わずか数分のチュオンディン 45 番地にあるマリアンマン ヒンドゥー寺院へようこそ。",
          "19 世紀後半にインドのタミル人コミュニティによって建てられたこの寺院は、鮮やかな彫刻が施されたゴープラム門塔とカラフルな南インドの宗教空間により、サイゴンの多文化アイデンティティを鮮やかに証明しています。",
          "ウィキペディア百科事典によると、バ マリアマン寺院としても知られるバ アン寺院は、ベトナムのホーチミン市にあるヒンズー教の女神マリアマンを崇拝する寺院です。この寺院は、19 世紀後半、インドのタミル ナードゥ州の貿易コミュニティであるタンジャヴル地区パットゥコッタイ出身のパラニアッパ テヴァールによって建てられました。"
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
        "shortSummary": "The central mosque was built in 1935 on Dong Du street with pristine white-turquoise arch architecture and a quiet lake yard in the heart of District 1.",
        "historicalEra": "Built in 1935",
        "openingHours": "08:00 – 20:00 Daily",
        "architecturalHighlights": [
          "The semi-circular archway, elegant round columns and 4 pen towers are imbued with classical Islamic art",
          "The pure white color palette with jade green highlights creates a minimalist, peaceful photography space",
          "Surrounded by many Halal restaurants with Indian - Malaysian flavors right in the middle of Dong Khoi - Dong Du street"
        ],
        "audioScript": [
          "Welcome to Jamia Al-Musulman Mosque at 66 Dong Du - a peaceful oasis in the bustling Dong Khoi neighborhood of District 1.",
          "Built in 1935 by the Muslim community of South Indian descent, the mosque impresses with its white-turquoise arched architecture and pure lake, welcoming visitors wearing polite attire."
        ]
      },
      "fr": {
        "name": "Mosquée Centrale de Saïgon (Jamia Al-Musulman · 1935)",
        "shortSummary": "La mosquée centrale a été construite en 1935 dans la rue Dong Du avec une architecture en arc blanc-turquoise immaculée et une cour tranquille au bord d'un lac au cœur du district 1.",
        "historicalEra": "1935",
        "openingHours": "08h00 – 20h00",
        "architecturalHighlights": [
          "L'arche semi-circulaire, les élégantes colonnes rondes et les 4 tours à plumes sont imprégnées de l'art islamique classique.",
          "La palette de couleurs blanc pur avec des reflets vert jade crée un espace photographique minimaliste et paisible.",
          "Entouré de nombreux restaurants Halal aux saveurs indiennes et malaisiennes en plein milieu de la rue Dong Khoi - Dong Du"
        ],
        "audioScript": [
          "Bienvenue à la mosquée Jamia Al-Musulman au 66 Dong Du - une oasis de paix dans le quartier animé de Dong Khoi du district 1.",
          "Construite en 1935 par la communauté musulmane d'origine sud-indienne, la mosquée impressionne par son architecture en arc blanc-turquoise et son lac pur, accueillant les visiteurs en tenue polie."
        ]
      },
      "zh": {
        "name": "西贡中央清真寺（1935年）",
        "shortSummary": "中央清真寺建于 1935 年，位于东都街，拥有原始的白绿松石拱形建筑和位于第一区中心的安静湖滨庭院。",
        "historicalEra": "建于1935年",
        "openingHours": "08:00 – 20:00",
        "architecturalHighlights": [
          "半圆形的拱门、优雅的圆柱和4座笔塔，充满了古典伊斯兰艺术的气息",
          "纯白的色调搭配翠绿色的亮点，营造出极简、宁静的摄影空间",
          "周围有许多供应印度和马来西亚风味的清真餐厅，位于 Dong Khoi - Dong Du 街的中间"
        ],
        "audioScript": [
          "欢迎来到位于 66 Dong Du 的 Jamia Al-Musulman 清真寺 - 第一区繁华的同桂社区中的一片宁静绿洲。",
          "这座清真寺由南印度裔穆斯林社区于 1935 年建造，以其白色绿松石色的拱形建筑和纯净的湖泊令人印象深刻，欢迎穿着礼貌服装的游客。"
        ]
      },
      "ja": {
        "name": "サイゴン・セントラル・モスク（1935年）",
        "shortSummary": "中央モスクは 1935 年にドン ドゥ通りに建てられ、1 区の中心部にある自然のままの白とターコイズのアーチ建築と静かな湖の庭が特徴です。",
        "historicalEra": "1935年建立",
        "openingHours": "08:00 – 20:00",
        "architecturalHighlights": [
          "半円形のアーチ、優美な円柱、4 つのペンタワーには古典的なイスラム美術が染み込んでいます。",
          "ピュアホワイトにジェイドグリーンのハイライトを加えたカラーパレットが、ミニマルで穏やかな撮影空間を演出します。",
          "ドンコイ通りとドンドゥ通りの真ん中にあり、インド料理やマレーシア料理を提供する多くのハラールレストランに囲まれています。"
        ],
        "audioScript": [
          "1 区の賑やかなドンコイ地区にある静かなオアシス、66 Dong Du にあるジャミア アル ムスルマン モスクへようこそ。",
          "南インド系イスラム教徒コミュニティによって 1935 年に建てられたこのモスクは、白ターコイズブルーのアーチ型建築と清らかな湖が印象的で、礼儀正しい服装をした訪問者を歓迎します。"
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
        "shortSummary": "The classic Gothic architecture was built entirely of Bien Hoa marble in 1902–1905, bringing a quiet, majestic beauty under the canopy of ancient trees.",
        "historicalEra": "1902 – 1905",
        "openingHours": "05:00 – 11:00, 14:00 – 19:00 Daily",
        "architecturalHighlights": [
          "The facade and walls are covered with monolithic Bien Hoa marble, rare in Saigon",
          "The 57m high pointed bell tower has a bronze Goloa rooster statue on top",
          "The quiet campus is shaded by green trees and houses the marble mausoleum of Mr. Huyen Sy's family"
        ],
        "audioScript": [
          "Welcome to Huyen Sy Church at 1 Ton That Tung, District 1 - a Neo-Gothic architectural masterpiece made of Bien Hoa marble built from 1902 to 1905.",
          "The church is named after the person who donated the land and construction funds, Mr. Le Phat Dat - Huyen Sy, the maternal grandfather of Queen Nam Phuong. The serenity of the ancient gray stone wall creates a beautiful European photography backdrop.",
          "According to Wikipedia encyclopedia: Huyen Sy Church (official name: Church of Saint Philip the Apostle) is an ancient Catholic church more than 100 years old, located at 1 Ton That Tung Street, Ben Thanh Ward, Ho Chi Minh City, Vietnam. This is the church of Cho Dui parish of Ho Chi Minh City Archdiocese. The church was built by Mr. and Mrs. Le Phat Dat, aka Huyen Sy, who donated the land and 1/7 of their fortune to build it. The price at that time was about over 30 thousand (ten thousand) Indochina silver coins. Construction began in 1902 according to the design of Father Bouttier, and was inaugurated in 1905. The church is located on a high plot of land more than one acre wide, at the corner of Frère Louis Street (now Nguyen Trai Street) and Frère Guilleraut (now Ton That Tung Street)."
        ]
      },
      "fr": {
        "name": "Église Huyen Sy (Saint-Philippe · 1902)",
        "shortSummary": "L'architecture gothique classique a été construite entièrement en marbre de Bien Hoa entre 1902 et 1905, apportant une beauté calme et majestueuse sous la canopée d'arbres centenaires.",
        "historicalEra": "1902 – 1905",
        "openingHours": "05h00 – 11h00, 14h00 – 19h00",
        "architecturalHighlights": [
          "La façade et les murs sont recouverts de marbre monolithique de Bien Hoa, rare à Saigon",
          "Le clocher pointu de 57 m de haut est surmonté d'une statue de coq Goloa en bronze.",
          "Le campus calme est ombragé par des arbres verts et abrite le mausolée en marbre de la famille de M. Huyen Sy"
        ],
        "audioScript": [
          "Bienvenue à l'église Huyen Sy à 1 Ton That Tung, district 1 - un chef-d'œuvre architectural néo-gothique en marbre de Bien Hoa construit de 1902 à 1905.",
          "L'église porte le nom de la personne qui a fait don du terrain et des fonds de construction, M. Le Phat Dat - Huyen Sy, le grand-père maternel de la reine Nam Phuong. La sérénité de l’ancien mur de pierre grise crée une magnifique toile de fond pour la photographie européenne.",
          "Selon l'encyclopédie Wikipédia : L'église Huyen Sy (nom officiel : Église Saint Philippe l'Apôtre) est une ancienne église catholique vieille de plus de 100 ans, située au 1 rue Ton That Tung, quartier Ben Thanh, Hô Chi Minh-Ville, Vietnam. Il s'agit de l'église de la paroisse Cho Dui de l'archidiocèse de Hô Chi Minh-Ville. L'église a été construite par M. et Mme Le Phat Dat, alias Huyen Sy, qui ont fait don du terrain et d'un septième de leur fortune pour la construire. Le prix à cette époque était d’environ 30 mille (dix mille) pièces d’argent d’Indochine. La construction débuta en 1902 selon les plans du Père Bouttier et fut inaugurée en 1905. L'église est située sur un terrain élevé de plus d'un acre de large, à l'angle de la rue Frère Louis (aujourd'hui rue Nguyen Trai) et de Frère Guilleraut (aujourd'hui rue Ton That Tung)."
        ]
      },
      "zh": {
        "name": "县士教堂（圣斐理伯堂 · 1902年）",
        "shortSummary": "经典的哥特式建筑完全由边和大理石建造于1902年至1905年，在古树的树冠下带来一种安静、雄伟的美感。",
        "historicalEra": "1902 – 1905年",
        "openingHours": "05:00 – 11:00, 14:00 – 19:00",
        "architecturalHighlights": [
          "正面和墙壁覆盖着整块边和大理石，这在西贡很少见",
          "高57m的尖尖钟楼，顶部有青铜Goloa公鸡雕像",
          "安静的校园绿树成荫，内有玄施先生家族的大理石陵墓"
        ],
        "audioScript": [
          "欢迎来到位于第一区 1 Ton That Tung 的 Huyen Sy 教堂，这是一座新哥特式建筑杰作，由边和大理石建成，建于 1902 年至 1905 年。",
          "该教堂以捐赠土地和建设资金的人、南芳王后的外祖父黎发达-玄西先生的名字命名。古老的灰色石墙的宁静营造出美丽的欧洲摄影背景。",
          "据维基百科百科介绍：玄施教堂（正式名称：使徒圣菲利普教堂）是一座拥有100多年历史的古老天主教堂，位于越南胡志明市滨城区吨塔东街1号。这是胡志明市总教区 Cho Dui 教区的教堂。这座教堂是由Le Phat Dat（又名Huyen Sy）夫妇建造的，他们捐赠了土地和1/7的财产来建造它。当时的价格大约是三万多（万）印度支那银币。 1902年根据Bouttier神父的设计开始兴建，并于1905年落成。教堂位于Frère Louis街（现Nguyen Trai街）和Frère Guilleraut（现Ton That Tung街）拐角处的一块宽一英亩多的高地上。"
        ]
      },
      "ja": {
        "name": "フエンシー教会（1902年）",
        "shortSummary": "古典的なゴシック様式の建築は、1902 年から 1905 年にかけてビエンホア大理石のみで建てられ、古代の木々の天蓋の下に静かで雄大な美しさをもたらしています。",
        "historicalEra": "1902年 – 1905年",
        "openingHours": "05:00 – 11:00, 14:00 – 19:00",
        "architecturalHighlights": [
          "ファサードと壁はサイゴンでは珍しい一枚岩のビエンホア大理石で覆われています。",
          "高さ 57 メートルの尖った鐘楼の頂上には青銅製のゴロア雄鶏の像があります",
          "緑の木陰に囲まれた静かなキャンパスには、フエン・シー氏の家族の大理石の霊廟があります。"
        ],
        "audioScript": [
          "1 区 1 Ton That Tung にある Huyen Sy 教会へようこそ。1902 年から 1905 年にかけて建てられたビエンホア大理石で作られたネオゴシック建築の傑作です。",
          "この教会の名前は、土地と建設資金を寄付した人物、ナム・プオン王妃の母方の祖父であるル・ファット・ダット・フエン・シー氏にちなんで名付けられました。古代の灰色の石壁の静けさが、美しいヨーロッパの写真撮影の背景を作り出します。",
          "ウィキペディア百科事典によると: フエンシー教会 (正式名: 聖フィリップ使徒教会) は、ベトナム、ホーチミン市ベンタイン区、トン タート トゥン ストリート 1 トン タット トゥン ストリートに位置する 100 年以上の歴史を持つ古いカトリック教会です。ここはホーチミン大司教区チョードゥイ教区の教会です。この教会は、フエン・シーことル・ファット・ダット夫妻によって建てられ、彼はその建設のために土地と財産の 7 分の 1 を寄付しました。当時の価格はインドシナ銀貨約3万枚以上でした。ブティエ神父の設計に従って 1902 年に建設が始まり、1905 年に落成しました。教会はフレール ルイ通り (現在のグエン トライ通り) とフレール ギロー通り (現在のトン タットン通り) の角、幅 1 エーカー以上の高台にあります。"
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
        "shortSummary": "Modern museum along the Saigon River (free ticket) displays multimedia about the life of President Ton Duc Thang, the history of Ba Son shipyard and the Saigon workers' movement.",
        "historicalEra": "Founded 1988 – New Building 2024",
        "openingHours": "07:30 – 11:30, 13:00 – 17:00 (Tue – Sun)",
        "architecturalHighlights": [
          "The new spacious museum building is right on the Ton Duc Thang - Ba Son Bridge axis, with luxurious minimalist design",
          "Modern interactive digital display includes 5 major topics about Uncle Ton and Ba Son workers",
          "Spacious air-conditioned space, free entrance tickets for all domestic and foreign tourists"
        ],
        "audioScript": [
          "Welcome to Ton Duc Thang Museum at 5 Ton Duc Thang Street, District 1 - right on the banks of the Saigon River and the historic Ba Son shipyard.",
          "With a new modern exhibition building and interactive multimedia technology, the museum vividly recreates the simple but great life journey of President Ton Duc Thang and the history of Saigon workers.",
          "According to Wikipedia encyclopedia: Ton Duc Thang Museum is a memorial museum of famous people in Vietnam, located at 5 Ton Duc Thang Street, Saigon Ward, Ho Chi Minh City. The museum is responsible for researching, collecting, inventorying, preserving and displaying, storing and introducing to visitors documents and artifacts related to the life and revolutionary career of President Ton Duc Thang, the feelings of the people of the country and international friends towards him, with the aim of being a place of education..."
        ]
      },
      "fr": {
        "name": "Musée Ton Duc Thang",
        "shortSummary": "Un musée moderne le long de la rivière Saigon (billet gratuit) présente des contenus multimédias sur la vie du président Ton Duc Thang, l'histoire du chantier naval de Ba Son et le mouvement ouvrier de Saigon.",
        "historicalEra": "1988 – Nouvel édifice 2024",
        "openingHours": "07h30 – 11h30, 13h00 – 17h00 (Mar – Dim)",
        "architecturalHighlights": [
          "Le nouveau bâtiment spacieux du musée se trouve juste sur l'axe Ton Duc Thang - Ba Son Bridge, avec un design minimaliste luxueux.",
          "L'affichage numérique interactif moderne comprend 5 sujets majeurs sur les travailleurs d'Oncle Ton et de Ba Son",
          "Espace spacieux et climatisé, billets d'entrée gratuits pour tous les touristes nationaux et étrangers"
        ],
        "audioScript": [
          "Bienvenue au musée Ton Duc Thang, situé au 5, rue Ton Duc Thang, district 1, sur les rives de la rivière Saigon et du chantier naval historique de Ba Son.",
          "Avec un nouveau bâtiment d'exposition moderne et une technologie multimédia interactive, le musée recrée de manière vivante le parcours de vie simple mais formidable du président Ton Duc Thang et l'histoire des travailleurs de Saigon.",
          "Selon l'encyclopédie Wikipédia : Le musée Ton Duc Thang est un musée commémoratif de personnages célèbres du Vietnam, situé au 5 rue Ton Duc Thang, quartier de Saigon, Hô Chi Minh-Ville. Le musée est responsable de la recherche, de la collecte, de l'inventaire, de la préservation et de l'exposition, du stockage et de la présentation aux visiteurs de documents et d'objets liés à la vie et à la carrière révolutionnaire du président Ton Duc Thang, aux sentiments de la population du pays et des amis internationaux à son égard, dans le but d'être un lieu d'éducation..."
        ]
      },
      "zh": {
        "name": "孙德胜博物馆",
        "shortSummary": "西贡河沿岸的现代博物馆（免费门票）展示有关孙德胜总统生平、巴山造船厂历史和西贡工人运动的多媒体。",
        "historicalEra": "1988年建馆 – 2024年新馆",
        "openingHours": "07:30 – 11:30, 13:00 – 17:00（周二至周日）",
        "architecturalHighlights": [
          "宽敞的新博物馆建筑位于 Ton Duc Thang - Ba Son 大桥轴线上，采用奢华简约的设计",
          "现代互动数字展示包括有关Uncle Ton和Ba Son工人的5个主要主题",
          "宽敞的空调空间，免费为所有国内外游客提供门票"
        ],
        "audioScript": [
          "欢迎来到位于第一区 Ton Duc Thang 街 5 号的 Ton Duc Thang 博物馆，位于西贡河和历史悠久的 Ba Son 造船厂的河畔。",
          "博物馆凭借全新的现代化展览大楼和互动多媒体技术，生动地再现了孙德胜总统简单而伟大的人生历程和西贡工人的历史。",
          "据维基百科百科介绍：Ton Duc Thang博物馆是越南著名人士的纪念博物馆，位于胡志明市西贡区Ton Duc Thang街5号。博物馆负责研究、收集、盘点、保存和展示、保存并向参观者介绍与孙德胜主席生平和革命事业有关的文献和文物，以及全国人民和国际友人对他的感情，旨在成为一个教育场所……"
        ]
      },
      "ja": {
        "name": "トン・ドゥック・タン博物館",
        "shortSummary": "サイゴン川沿いにある近代的な博物館 (入場無料) には、トン ドゥク タン大統領の生涯、バソン造船所の歴史、サイゴンの労働運動に関するマルチメディアが展示されています。",
        "historicalEra": "1988年開館 – 2024年新館",
        "openingHours": "07:30 – 11:30, 13:00 – 17:00（火〜日）",
        "architecturalHighlights": [
          "新しい広々とした博物館の建物は、トンドゥックタン - バソン橋の軸上にあり、豪華でミニマリストなデザインが施されています。",
          "最新のインタラクティブなデジタル表示には、アンクル トンとバ ソンの労働者に関する 5 つの主要なトピックが含まれています",
          "エアコン完備の広々とした空間、国内外の観光客に入場無料チケットを提供"
        ],
        "audioScript": [
          "トン ドゥック タン博物館へようこそ。1 区トン ドゥック タン ストリート 5 番地にあり、サイゴン川と歴史的なバソン造船所のほとりにあります。",
          "新しい近代的な展示棟とインタラクティブなマルチメディア技術を備えたこの博物館は、トン・ドゥク・タン大統領のシンプルだが偉大な人生の旅路とサイゴンの労働者の歴史を生き生きと再現しています。",
          "ウィキペディア百科事典によると: トン ドゥック タン博物館は、ホーチミン市サイゴン区トン ドゥック タン通り 5 番地にあるベトナムの著名人の記念博物館です。この博物館は、教育の場となることを目的として、トン・ドゥク・タン大統領の生涯と革命的経歴、大統領に対する国民や国際友人の感情に関する文書や工芸品の調査、収集、目録作成、保存と展示、保管、訪問者への紹介を担当しています。"
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
        "shortSummary": "The emotional cultural space in District 3 preserves more than 30,000 artifacts of ao dai, ao dai, ancient jewelry, crafts and heroic traditions of Southern women.",
        "historicalEra": "Founded in 1985",
        "openingHours": "07:30 – 11:30, 13:30 – 17:00 Daily",
        "architecturalHighlights": [
          "The gallery specializes in Vietnamese Ao Dai and colorful traditional costumes of southern ethnic groups",
          "3D Hologram projection application and smart interaction that tells vivid historical stories",
          "Free admission, just a few minutes' walk from Tan Dinh Church and Vinh Nghiem Pagoda"
        ],
        "audioScript": [
          "Welcome to the Southern Women's Museum at 202 Vo Thi Sau, District 3.",
          "This place preserves more than 30,000 valuable documents and artifacts, from the collection of traditional ao dai - traditional ao dai, the art of weaving ceramics to the stories of steadfastness of Southern women through two resistance wars.",
          "According to Wikipedia encyclopedia: The Southern Women's Museum is located at 202 Vo Thi Sau, Xuan Hoa, Ho Chi Minh City. The museum has an exhibition area of ​​2000 m² including 10 galleries about the traditions of building and defending the homeland of Southern women. The museum building currently has 4 floors. The hall can accommodate nearly 1,000 people and is built on an area of ​​5,410.5m2. The storage warehouse system has an area of ​​over 700m2."
        ]
      },
      "fr": {
        "name": "Musée des Femmes du Sud",
        "shortSummary": "L'espace culturel émotionnel du district 3 préserve plus de 30 000 artefacts d'ao dai, d'ao dai, de bijoux anciens, d'artisanat et de traditions héroïques des femmes du Sud.",
        "historicalEra": "Fondé en 1985",
        "openingHours": "07h30 – 11h30, 13h30 – 17h00",
        "architecturalHighlights": [
          "La galerie est spécialisée dans l'Ao Dai vietnamien et les costumes traditionnels colorés des groupes ethniques du sud.",
          "Application de projection d'hologrammes 3D et interaction intelligente qui raconte des histoires historiques saisissantes",
          "Entrée gratuite, à quelques minutes à pied de l'église Tan Dinh et de la pagode Vinh Nghiem"
        ],
        "audioScript": [
          "Bienvenue au Musée des femmes du Sud au 202 Vo Thi Sau, District 3.",
          "Ce lieu conserve plus de 30 000 documents et objets précieux, de la collection d'ao dai traditionnel - l'ao dai traditionnel, l'art du tissage de la céramique aux histoires de fermeté des femmes du Sud à travers deux guerres de résistance.",
          "Selon l'encyclopédie Wikipédia : Le Musée des femmes du Sud est situé au 202 Vo Thi Sau, Xuan Hoa, Hô Chi Minh-Ville. Le musée dispose d'une surface d'exposition de 2000 m² comprenant 10 galeries sur les traditions de construction et de défense de la patrie des femmes du Sud. Le bâtiment du musée compte actuellement 4 étages. La salle peut accueillir près de 1 000 personnes et est construite sur une superficie de 5 410,5 m2. Le système d'entrepôt de stockage a une superficie de plus de 700 m2."
        ]
      },
      "zh": {
        "name": "南部妇女博物馆",
        "shortSummary": "三区的情感文化空间保存了三万多件长袄、长袄、古代珠宝、工艺品和南方妇女的英雄传统等文物。",
        "historicalEra": "1985年建馆",
        "openingHours": "07:30 – 11:30, 13:30 – 17:00",
        "architecturalHighlights": [
          "画廊专门展示越南奥黛和色彩缤纷的南方少数民族传统服饰",
          "3D全息投影应用和智能交互，讲述生动的历史故事",
          "免费入场，距离 Tan Dinh 教堂和 Vinh Nghiem 塔仅几分钟步行路程"
        ],
        "audioScript": [
          "欢迎来到南方妇女博物馆，地址：202 Vo Thi Sau, District 3。",
          "这里保存了三万多件珍贵的文献和文物，从传统长袄的收藏、陶瓷编织艺术到南方妇女在两次抗战中坚强的故事。",
          "根据维基百科百科：南方妇女博物馆位于胡志明市春和武氏秀202号。博物馆展览面积2000平方米，包括10个画廊，讲述南方妇女建设和保卫家园的传统。博物馆建筑目前有4层。大厅可容纳近千人，建筑面积5410.5平方米。储存仓库系统面积超过700m2。"
        ]
      },
      "ja": {
        "name": "南部女性博物館",
        "shortSummary": "3 区にある感情豊かな文化空間には、アオザイ、アオザイ、古代の宝飾品、工芸品、南部女性の英雄的な伝統などの 30,000 点以上の工芸品が保存されています。",
        "historicalEra": "1985年開館",
        "openingHours": "07:30 – 11:30, 13:30 – 17:00",
        "architecturalHighlights": [
          "ベトナムのアオザイと南部民族のカラフルな伝統衣装を専門とするギャラリーです。",
          "3D ホログラム投影アプリケーションと鮮やかな歴史ストーリーを伝えるスマートなインタラクション",
          "入場無料、タンディン教会とヴィンギエムパゴダから徒歩わずか数分"
        ],
        "audioScript": [
          "南部女性博物館 (住所 202 Vo Thi Sau、District 3) へようこそ。",
          "この場所には、伝統的なアオザイのコレクションから、陶器を織る技術、2 つの抵抗戦争を通じた南部女性の不屈の物語まで、30,000 点以上の貴重な文書や工芸品が保存されています。",
          "ウィキペディア百科事典によると、南部女性博物館はホーチミン市スアンホア、ヴォ・ティ・サウ202番地にあります。この博物館の展示面積は 2000 平方メートルで、南部女性の祖国を築き、守る伝統に関する 10 のギャラリーが含まれています。博物館の建物は現在 4 階建てです。ホールは約1,000人を収容でき、面積は5,410.5平方メートルです。保管倉庫システムの面積は700平方メートル以上です。"
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
        "shortSummary": "Unique private museum located in the 1963 relic house of soldier Tran Van Lai, displaying secret floating bunkers, secret mailboxes, classic cars and the old Saigon dairy coffee experience.",
        "historicalEra": "1963 House – Museum opened 2019",
        "openingHours": "07:30 – 19:00 Daily",
        "architecturalHighlights": [
          "Compact antique wooden elevators and double-layered walls and ceilings were once used as secret tunnels in the heart of the city",
          "More than 300 original artifacts: typewriters, communication radios, antique motorbikes and Saigon Commando combat maps",
          "Combining the space of Do Phu Coffee - Korean broken rice, nostalgic for Saigon in the 1960s"
        ],
        "audioScript": [
          "Welcome to the Saigon - Gia Dinh Rangers Museum at 145 Tran Quang Khai, Tan Dinh Ward, District 1.",
          "This old house, built in 1963, was once a secret operating base for the Saigon Rangers. You will be able to see with your own eyes the cleverly camouflaged tunnel walls, the collection of original artifacts and enjoy a cup of coffee with the essence of old Saigon."
        ]
      },
      "fr": {
        "name": "Musée des Commandos de Saïgon (145 Tran Quang Khai)",
        "shortSummary": "Musée privé unique situé dans la maison relique de 1963 du soldat Tran Van Lai, présentant des bunkers flottants secrets, des boîtes aux lettres secrètes, des voitures classiques et l'ancienne expérience du café au lait de Saigon.",
        "historicalEra": "1963 – 2019",
        "openingHours": "07h30 – 19h00",
        "architecturalHighlights": [
          "Des ascenseurs compacts en bois anciens et des murs et plafonds à double couche étaient autrefois utilisés comme tunnels secrets au cœur de la ville.",
          "Plus de 300 objets originaux : machines à écrire, radios de communication, motos anciennes et cartes de combat du Saigon Commando",
          "Combinant l'espace du Do Phu Coffee - Riz cassé coréen, nostalgique du Saigon des années 1960"
        ],
        "audioScript": [
          "Bienvenue au musée Saigon - Gia Dinh Rangers au 145 Tran Quang Khai, quartier Tan Dinh, district 1.",
          "Cette ancienne maison, construite en 1963, était autrefois une base opérationnelle secrète des Saigon Rangers. Vous pourrez voir de vos propres yeux les parois du tunnel savamment camouflées, la collection d'objets originaux et déguster une tasse de café avec l'essence du vieux Saigon."
        ]
      },
      "zh": {
        "name": "西贡别动队博物馆（陈光启街145号）",
        "shortSummary": "独特的私人博物馆，位于 1963 年士兵 Tran Van Lai 的遗物屋内，展示秘密浮动掩体、秘密邮箱、老爷车和老西贡奶制品咖啡体验。",
        "historicalEra": "1963年老宅 – 2019年开馆",
        "openingHours": "07:30 – 19:00",
        "architecturalHighlights": [
          "紧凑的古董木制电梯和双层墙壁和天花板曾经被用作市中心的秘密隧道",
          "超过 300 件原始文物：打字机、通讯收音机、古董摩托车和西贡突击队作战地图",
          "结合Do Phu Coffee的空间——韩国碎米，怀念1960年代的西贡"
        ],
        "audioScript": [
          "欢迎来到西贡 - 嘉定流浪者博物馆，地址：145 Tran Quang Khai, Tan Dinh Ward, District 1。",
          "这座建于1963年的老房子，曾经是西贡游骑兵队的秘密作战基地。您将能够亲眼看到巧妙伪装的隧道墙、原始文物的收藏，并享受一杯具有老西贡精髓的咖啡。"
        ]
      },
      "ja": {
        "name": "サイゴン特攻隊博物館（チャンクアンカイ通り145番地）",
        "shortSummary": "1963 年に建てられた兵士トラン ヴァン ライの遺物邸宅内にあるユニークな私設博物館。秘密の水上バンカー、秘密の郵便ポスト、クラシックカー、そして昔ながらのサイゴン デイリー コーヒー体験が展示されています。",
        "historicalEra": "1963年建築 – 2019年開館",
        "openingHours": "07:30 – 19:00",
        "architecturalHighlights": [
          "コンパクトなアンティーク木製エレベーターと二重の壁と天井は、かつて街の中心部の秘密のトンネルとして使用されていました",
          "300 点を超えるオリジナルの工芸品: タイプライター、通信ラジオ、アンティーク バイク、サイゴン コマンドーの戦闘地図",
          "1960年代のサイゴンを懐かしむ韓国の砕いたご飯、ドーフーコーヒーの空間を組み合わせる"
        ],
        "audioScript": [
          "サイゴン - ギアディン レンジャーズ博物館へようこそ。所在地は 145 Tran Quang Khai、Tan Dinh Ward、1 区です。",
          "1963 年に建てられたこの古い家は、かつてサイゴンレンジャーの秘密作戦基地でした。巧妙にカモフラージュされたトンネルの壁やオリジナルの工芸品のコレクションを自分の目で見て、古いサイゴンのエッセンスを入れたコーヒーを楽しむことができます。"
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
        "shortSummary": "The National Artistic Architectural Monument of the Chaozhou Chinese community was built in the early 19th century, famous for its splendid gilded wood carving and Xich Tho horse statue.",
        "historicalEra": "Early 19th Century",
        "openingHours": "06:00 – 17:30 Daily",
        "architecturalHighlights": [
          "The most sophisticated system of wooden panels, horizontal panels, and tureen carved in lacquered and gilded wood in Cho Lon",
          "The tall wooden Xich Tho horse statue is solemnly placed right in front of the palace",
          "Located on the heritage axis of Nguyen Trai Street, only a 2-minute walk from Ba Thien Hau Pagoda"
        ],
        "audioScript": [
          "Welcome to Nghia An Assembly Hall - often called Ong Pagoda - at 678 Nguyen Trai, center of Cho Lon Old Quarter, District 5.",
          "Built by the Chaozhou community in the early 19th century to worship Quan Thanh De Quan, the assembly hall was recognized as a National Artistic Architectural Monument thanks to its masterpieces of gilded wood carving and ceramic statues on the yin-yang tile roof.",
          "According to Wikipedia encyclopedia: Nghia An Assembly Hall (Chinese: 義安會館), commonly known as Quan De Temple or Ong Pagoda, is a religious facility of the Tieu people at 678 Nguyen Trai Street, Cho Lon Ward, Ho Chi Minh City, Vietnam. This is not only a place of worship for the Tieu people in Saigon, but also a valuable architectural and artistic work in the second half of the 19th century - early 20th century. Therefore, on November 7, 1993, the Ministry of Culture and Information signed Decision No. 43-VH/QD recognizing the temple as a national architectural and artistic relic."
        ]
      },
      "fr": {
        "name": "Salle d’Assemblée Nghia An (Pagode de Quan Cong)",
        "shortSummary": "Le monument architectural artistique national de la communauté chinoise de Chaozhou a été construit au début du XIXe siècle et est célèbre pour ses splendides sculptures en bois doré et sa statue de cheval de Xich Tho.",
        "historicalEra": "Début XIXe siècle",
        "openingHours": "06h00 – 17h30",
        "architecturalHighlights": [
          "Le système le plus sophistiqué de panneaux en bois, de panneaux horizontaux et de soupières sculptées en bois laqué et doré à Cho Lon",
          "La grande statue en bois du cheval Xich Tho est solennellement placée juste en face du palais.",
          "Situé sur l'axe patrimonial de la rue Nguyen Trai, à seulement 2 minutes à pied de la pagode Ba Thien Hau"
        ],
        "audioScript": [
          "Bienvenue à la salle de l'Assemblée Nghia An - souvent appelée pagode Ong - au 678 Nguyen Trai, centre du vieux quartier de Cho Lon, district 5.",
          "Construite par la communauté de Chaozhou au début du XIXe siècle pour vénérer Quan Thanh De Quan, la salle de réunion a été reconnue comme monument architectural artistique national grâce à ses chefs-d'œuvre de sculpture sur bois doré et ses statues en céramique sur le toit de tuiles yin-yang.",
          "Selon l'encyclopédie Wikipédia : la salle de réunion Nghia An (chinois : 義安會館), communément connue sous le nom de temple Quan De ou pagode Ong, est un établissement religieux du peuple Tieu situé au 678 rue Nguyen Trai, quartier Cho Lon, Hô Chi Minh-Ville, Vietnam. Il s'agit non seulement d'un lieu de culte pour le peuple Tieu à Saigon, mais aussi d'une œuvre architecturale et artistique précieuse de la seconde moitié du 19e siècle - début du 20e siècle. C'est pourquoi, le 7 novembre 1993, le ministère de la Culture et de l'Information a signé la décision n° 43-VH/QD reconnaissant le temple comme relique architecturale et artistique nationale."
        ]
      },
      "zh": {
        "name": "义安会馆（堤岸关帝庙）",
        "shortSummary": "潮州华人社区国家艺术建筑纪念碑建于19世纪初，以其华丽的鎏金木雕和西驰马像而闻名。",
        "historicalEra": "19世纪初（1993年列为国家级遗迹）",
        "openingHours": "06:00 – 17:30",
        "architecturalHighlights": [
          "Cho Lon 最复杂的木板、水平板和盖碗系统，采用漆木和镀金木雕刻而成",
          "高大的木制西克托马雕像庄严地放置在宫殿的正前方",
          "位于 Nguyen Trai 街的遗产轴线上，距离 Ba Thien Hau Pagoda 仅 2 分钟步行路程"
        ],
        "audioScript": [
          "欢迎来到 Nghia An 大会堂 - 通常称为 Ong Pagoda - 位于第 5 区 Cho Lon 老城区中心 Nguyen Trai 678 号。",
          "会堂是潮州人于十九世纪初期为祭祀关清德君而建造的，因其鎏金木雕和阴阳瓦顶陶瓷雕像的杰作而被认定为国家艺术建筑古迹。",
          "根据维基百科百科：义安会馆（中文：义安会馆），俗称全德寺或王塔，是张族的宗教设施，位于越南胡志明市楚龙区阮岱街678号。这不仅是西贡Tieu人的礼拜场所，也是19世纪下半叶至20世纪初的宝贵建筑和艺术作品。因此，1993年11月7日，文化和信息部签署第43-VH/QD号决定，承认该寺为国家级建筑艺术文物。"
        ]
      },
      "ja": {
        "name": "義安会館（チョロン関帝廟）",
        "shortSummary": "潮州華人コミュニティの国家芸術建築記念碑は 19 世紀初頭に建てられ、見事な金メッキの木彫りとシチトー馬の像で有名です。",
        "historicalEra": "19世紀初頭",
        "openingHours": "06:00 – 17:30",
        "architecturalHighlights": [
          "チョロンで漆塗りと金メッキを施した木材に彫刻された木製パネル、水平パネル、および鋳物からなる最も洗練されたシステム",
          "背の高い木造のシチトー馬の像が宮殿の正面に厳かに置かれています。",
          "文化遺産の中心地であるグエン トライ通り沿いに位置し、バー ティエン ハウ パゴダから徒歩わずか 2 分"
        ],
        "audioScript": [
          "5 区チョロン旧市街の中心、グエン トライ 678 にあるギアアン集会所 - しばしばオン パゴダと呼ばれます - へようこそ。",
          "クアン・タン・デ・クアンを崇拝するために 19 世紀初頭に潮州のコミュニティによって建てられたこの集会場は、陰陽瓦の屋根に金メッキを施した木彫りや陶器の彫像の傑作があり、国家芸術建築記念碑として認められています。",
          "ウィキペディア百科事典によると: Nghia An Assembly Hall (中国語: 義安會館) は、一般にQuan De Temple または Ong Pagoda として知られ、ベトナム、ホーチミン市チョロン区、グエン・トライ通り678番地にあるティエウ族の宗教施設です。ここはサイゴンのティエウ族の礼拝所であるだけでなく、19世紀後半から20世紀初頭にかけての貴重な建築・芸術作品でもあります。そのため、1993 年 11 月 7 日、文化情報省は、寺院を国家の建築および芸術遺物として認める決定第 43-VH/QD に署名しました。"
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
        "shortSummary": "The oldest pagoda in Cho Lon area was built by Fujian Chinese people in 1740, famous for its brilliant curved tiled roof, Mai Mai ceramic statue and magical red lantern truss.",
        "historicalEra": "Founded in 1740",
        "openingHours": "06:00 – 17:30 Daily",
        "architecturalHighlights": [
          "The curved yin-yang tile roof is decorated with hundreds of classic blue-yellow ceramic miniature statues",
          "The skylight courtyard hangs red lanterns and incense rings, creating extremely cinematic lighting effects for photography",
          "The place preserves many unique Fujian religious customs such as praying for peace and good fortune"
        ],
        "audioScript": [
          "Welcome to the On Lang Assembly Hall on Lao Tzu Street, District 5 - one of the oldest temples of the Fujian Chinese community in Cho Lon since 1740.",
          "This place harmoniously combines the beliefs of worshiping Avalokiteśvara Bodhisattva and Thien Hau Thanh Mau in the space of a solemn red lantern yard and colorful ancient ceramic roof.",
          "According to Wikipedia encyclopedia: On Lang Assembly Hall (Chinese: 溫陵會館, or On Lang Assembly Hall) is also known as On Lang Pagoda, Quan Am Pagoda or Ong Lao Pagoda; is a Chinese-Vietnamese temple, currently located at 12 Lao Tzu Street, Cho Lon Ward, Ho Chi Minh City (Vietnam). Wenling is the ancient name of Quanzhou prefecture in Fujian - because this assembly hall was originally founded by Fujian Chinese people in Quanzhou, so people used the name Wenlang to name the assembly hall. In Chinese, \"Wen\" (溫) means warm (moderate, pleasant), gentle; and \"Lang\" (陵) means mound, hill - this name is said to date back to the Tang Dynasty or earlier. In Quanzhou city, the name Wenling can be easily seen on many ancient buildings."
        ]
      },
      "fr": {
        "name": "Pagode Quan Am (Salle Ôn Lăng · 1740)",
        "shortSummary": "La plus ancienne pagode de la région de Cho Lon a été construite par les Chinois du Fujian en 1740, célèbre pour son brillant toit de tuiles incurvées, sa statue en céramique Mai Mai et sa ferme de lanterne rouge magique.",
        "historicalEra": "1740",
        "openingHours": "06h00 – 17h30",
        "architecturalHighlights": [
          "Le toit de tuiles incurvées yin-yang est décoré de centaines de statues miniatures classiques en céramique bleu-jaune",
          "La cour avec lucarne accroche des lanternes rouges et des anneaux d'encens, créant des effets de lumière extrêmement cinématographiques pour la photographie",
          "Le lieu préserve de nombreuses coutumes religieuses uniques du Fujian, telles que la prière pour la paix et la bonne fortune."
        ],
        "audioScript": [
          "Bienvenue à la salle de l'Assemblée d'On Lang, rue Lao Tzu, district 5 - l'un des plus anciens temples de la communauté chinoise du Fujian à Cho Lon depuis 1740.",
          "Ce lieu combine harmonieusement les croyances du culte du bodhisattva Avalokiteśvara et de Thien Hau Thanh Mau dans l'espace d'une cour solennelle de lanternes rouges et d'un ancien toit en céramique coloré.",
          "Selon l'encyclopédie Wikipédia : On Lang Assembly Hall (chinois : 溫陵會館, ou On Lang Assembly Hall) est également connue sous le nom de pagode On Lang, pagode Quan Am ou pagode Ong Lao ; est un temple sino-vietnamien, actuellement situé au 12 rue Lao Tseu, quartier Cho Lon, Hô Chi Minh-Ville (Vietnam). Wenling est l'ancien nom de la préfecture de Quanzhou dans le Fujian - parce que cette salle de réunion a été fondée à l'origine par les Chinois du Fujian à Quanzhou, les gens ont donc utilisé le nom Wenlang pour nommer la salle de réunion. En chinois, « Wen » (溫) signifie chaud (modéré, agréable), doux ; et « Lang » (陵) signifie monticule, colline – ce nom remonterait à la dynastie Tang ou avant. Dans la ville de Quanzhou, le nom Wenling est facilement visible sur de nombreux bâtiments anciens."
        ]
      },
      "zh": {
        "name": "温陵会馆（堤岸观音庙 · 1740年）",
        "shortSummary": "草仑地区最古老的宝塔由福建人于 1740 年建造，以其绚丽的弧形瓦顶、麦麦陶瓷雕像和神奇的红灯笼桁架而闻名。",
        "historicalEra": "始建于1740年",
        "openingHours": "06:00 – 17:30",
        "architecturalHighlights": [
          "弧形阴阳瓦屋顶装饰着数百个经典的蓝黄色陶瓷微型雕像",
          "天窗庭院悬挂着红灯笼和香圈，为摄影营造出极具电影感的灯光效果",
          "这里保留着祈求平安、吉祥等许多福建特有的宗教习俗"
        ],
        "audioScript": [
          "欢迎来到第五区老子街的安朗会堂 - 自 1740 年以来，这是草龙福建华人社区最古老的寺庙之一。",
          "这里在庄严的红灯笼院落和色彩缤纷的古陶瓷屋顶的空间里，将观世音菩萨和天后清茂的信仰和谐地结合在一起。",
          "根据维基百科百科：温陵会馆（中文：温陵会馆，或安郎会馆）也被称为安郎塔、关安塔或翁老塔；是一座中越寺庙，目前位于胡志明市（越南）堤岸区老子街 12 号。温岭是福建泉州府的古称——因为这座礼堂最初是由福建华人在泉州创办的，所以人们就用文朗这个名字来命名礼堂。在汉语中，“温”的意思是温暖（温和、宜人）、温和； “陵”的意思是土丘、小山——这个名字据说可以追溯到唐代或更早。在泉州城，很多古建筑上都可以看到温岭这个名字。"
        ]
      },
      "ja": {
        "name": "温陵会館（観音寺・1740年）",
        "shortSummary": "チョロン地区最古の塔は福建省の中国人によって 1740 年に建てられ、見事な曲線を描く瓦屋根、陶製のマイマイ像、幻想的な赤い提灯のトラスで有名です。",
        "historicalEra": "1740年創建",
        "openingHours": "06:00 – 17:30",
        "architecturalHighlights": [
          "湾曲した陰陽瓦の屋根は、何百もの古典的な青黄色の陶器のミニチュア像で飾られています。",
          "天窓の中庭には赤い提灯と線香が吊り下げられ、写真撮影に非常に映画的な照明効果を生み出します。",
          "この場所には、平和や幸運を祈るなど、福建省独特の宗教的習慣が数多く保存されています。"
        ],
        "audioScript": [
          "5 区老子街にあるオンラン集会所へようこそ。1740 年以来、チョロンにある福建省華人コミュニティの最古の寺院の 1 つです。",
          "この場所は、厳粛な赤い灯籠の庭と色鮮やかな古代の陶器の屋根の空間の中で、観世音菩薩とティエンハウタンマウを崇拝する信仰を調和して組み合わせています。",
          "ウィキペディア百科事典によると: オンラン集会堂 (中国語: 溫陵會館、またはオンラン集会場) は、オンランパゴダ、クアンアムパゴダ、またはオンラオパゴダとしても知られています。は中国系ベトナム人の寺院で、現在はホーチミン市 (ベトナム) チョロン区老子街 12 番地にあります。温陵は福建省泉州県の古代の名前です。この集会場はもともと福建省の中国人によって泉州に設立されたため、人々は集会所の名前に文朗という名前を使用しました。中国語の「温」（溫）は、暖かい（適度な、心地よい）、優しいを意味します。 「陵」は塚、丘を意味します。この名前は唐の時代かそれ以前に遡ると言われています。泉州市では、多くの古い建物に温嶺の名前がよく見られます。"
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
        "shortSummary": "The unique ancient temple is hidden in Cho Lon alley with a solemn 4th floor main hall displaying more than 10,000 gilded Buddha statues covering four walls.",
        "historicalEra": "Founded in 1959",
        "openingHours": "07:00 – 17:00 Daily",
        "architecturalHighlights": [
          "Quang Minh Great Hall on the 4th floor with 10,000 small bronze and gilded Buddha statues arranged evenly on the walls",
          "The majestic statue of Shakyamuni Buddha sits on a thousand-petalled lotus in the center",
          "Quiet, overwhelming and extremely unique space to admire and take architectural photos"
        ],
        "audioScript": [
          "Welcome to Van Phat Pagoda at alley 66 Nghia Thuc, District 5 - a spiritual treasure that few people expect in the heart of Cho Lon.",
          "Stepping up to the Quang Minh Great Hall on the 4th floor, you will be overwhelmed by 10,000 golden Buddha statues covering all four walls surrounding the Shakyamuni Buddha statue on a thousand-petalled lotus."
        ]
      },
      "fr": {
        "name": "Pagode Van Phat (Pagode des Dix Mille Bouddhas)",
        "shortSummary": "L'ancien temple unique est caché dans l'allée Cho Lon avec un hall principal solennel au 4ème étage affichant plus de 10 000 statues de Bouddha dorées couvrant quatre murs.",
        "historicalEra": "1959",
        "openingHours": "07h00 – 17h00",
        "architecturalHighlights": [
          "Grande salle Quang Minh au 4ème étage avec 10 000 petites statues de Bouddha en bronze et dorées disposées uniformément sur les murs",
          "La majestueuse statue du Bouddha Shakyamuni repose au centre sur un lotus aux mille pétales.",
          "Espace calme, bouleversant et extrêmement unique pour admirer et prendre des photos architecturales"
        ],
        "audioScript": [
          "Bienvenue à la pagode Van Phat, allée 66 Nghia Thuc, district 5 - un trésor spirituel auquel peu de gens s'attendent au cœur de Cho Lon.",
          "En montant dans la Grande Salle Quang Minh, au 4ème étage, vous serez submergé par les 10 000 statues de Bouddha dorées recouvrant les quatre murs entourant la statue du Bouddha Shakyamuni sur un lotus aux mille pétales."
        ]
      },
      "zh": {
        "name": "万佛寺（第五郡堤岸）",
        "shortSummary": "这座独特的古老寺庙隐藏在草龙巷子里，庄严的四楼大殿四壁陈列着一万多尊镀金佛像。",
        "historicalEra": "始建于1959年",
        "openingHours": "07:00 – 17:00",
        "architecturalHighlights": [
          "四楼的光明大厅，墙壁上均匀排列着一万尊小型青铜镀金佛像",
          "中央有一尊庄严的释迦牟尼佛坐千瓣莲花",
          "安静、令人惊叹且极其独特的空间，可供欣赏和拍摄建筑照片"
        ],
        "audioScript": [
          "欢迎来到位于第 5 区 Nghia Thuc 巷 66 号的 Van Phat 宝塔 - 这是位于 Cho Lon 中心地带的一个很少有人期待的精神宝藏。",
          "登上四楼的光明大殿，映入眼帘的是覆盖四壁的一万尊金色佛像，围绕着千瓣莲花上的释迦牟尼佛像。"
        ]
      },
      "ja": {
        "name": "万仏寺（ヴァンファット寺・5区）",
        "shortSummary": "チョロン路地にひっそりと佇むこのユニークな古代寺院には、荘厳な 4 階の本堂があり、4 つの壁を覆う 10,000 体以上の金箔を施した仏像が展示されています。",
        "historicalEra": "1959年創建",
        "openingHours": "07:00 – 17:00",
        "architecturalHighlights": [
          "クアン ミン大ホールの 4 階には、10,000 体の青銅と金色の小さな仏像が壁に均等に配置されています。",
          "中央の千枚の花びらの蓮の上に荘厳な釈迦如来像が鎮座",
          "建築写真を鑑賞したり撮影したりできる、静かで圧倒的な非常にユニークな空間"
        ],
        "audioScript": [
          "5 区 Nghia Thuc 路地 66 にある Van Phat パゴダへようこそ。チョロンの中心部にあると期待する人はほとんどいない精神的な宝物です。",
          "クアン ミン大殿の 4 階に上がると、千枚の花びらをもつ釈迦如来像を囲む四方の壁を埋め尽くす 1 万体の黄金の仏像に圧倒されるでしょう。"
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
        "shortSummary": "The oldest Catholic church in Ho Chi Minh City (founded in 1722), owns a majestic Romanesque cathedral inaugurated in 1896.",
        "historicalEra": "Parish 1722 – Church 1896",
        "openingHours": "05:00 – 11:00, 14:30 – 19:00 Daily",
        "architecturalHighlights": [
          "More than 300 years of history forming with the land of Saigon - Gia Dinh",
          "Exquisite Romanesque architecture with creamy golden facade, rounded arches and high bell tower",
          "Spacious campus shaded by ancient trees, quiet in the middle of the Quan Market area"
        ],
        "audioScript": [
          "Welcome to Cho Quan Church at 120 Tran Binh Trong, District 5 - the oldest Catholic church in Ho Chi Minh City with a history of more than 300 years since 1722.",
          "The current cathedral, inaugurated in 1896, has ancient and majestic Romanesque beauty and is an important historical witness of the Saigon - Cho Lon region.",
          "According to Wikipedia encyclopedia: Cho Quan Church (nickname: Sacred Heart of Jesus Church) is a Catholic church in Ho Chi Minh City, belonging to Cho Quan parish, located at 120 Tran Binh Trong Street, Cho Quan Ward, Ho Chi Minh City. The church has Romanesque architecture, was destroyed many times and then rebuilt in 1727, 1733, 1793, 1862, 1882 and the current church was inaugurated in 1896. Cho Quan Church is the oldest church in Ho Chi Minh City."
        ]
      },
      "fr": {
        "name": "Église Cho Quan (Plus ancienne paroisse de Saïgon · 1722)",
        "shortSummary": "La plus ancienne église catholique d'Hô Chi Minh Ville (fondée en 1722), possède une majestueuse cathédrale romane inaugurée en 1896.",
        "historicalEra": "1722 – 1896",
        "openingHours": "05h00 – 11h00, 14h30 – 19h00",
        "architecturalHighlights": [
          "Plus de 300 ans d'histoire se formant avec la terre de Saigon - Gia Dinh",
          "Architecture romane exquise avec façade dorée crémeuse, arcs arrondis et haut clocher",
          "Campus spacieux ombragé par des arbres centenaires, au calme au milieu du quartier du marché de Quan"
        ],
        "audioScript": [
          "Bienvenue à l'église Cho Quan au 120 Tran Binh Trong, district 5 - la plus ancienne église catholique d'Hô Chi Minh-Ville avec une histoire de plus de 300 ans depuis 1722.",
          "La cathédrale actuelle, inaugurée en 1896, présente une beauté romane ancienne et majestueuse et constitue un témoin historique important de la région de Saigon - Cho Lon.",
          "Selon l'encyclopédie Wikipédia : L'église Cho Quan (surnom : Église du Sacré-Cœur de Jésus) est une église catholique de Hô Chi Minh-Ville, appartenant à la paroisse de Cho Quan, située au 120 rue Tran Binh Trong, quartier Cho Quan, Hô Chi Minh-Ville. L'église a une architecture romane, a été détruite à plusieurs reprises puis reconstruite en 1727, 1733, 1793, 1862, 1882 et l'église actuelle a été inaugurée en 1896. L'église Cho Quan est la plus ancienne église d'Hô Chi Minh-Ville."
        ]
      },
      "zh": {
        "name": "社馆教堂（胡志明市最古老教堂 · 1722年）",
        "shortSummary": "胡志明市最古老的天主教堂（建于 1722 年），拥有一座于 1896 年落成的雄伟罗马式大教堂。",
        "historicalEra": "1722年建堂区 – 1896年现建筑",
        "openingHours": "05:00 – 11:00, 14:30 – 19:00",
        "architecturalHighlights": [
          "与西贡土地一起形成的 300 多年历史 - 嘉定",
          "精致的罗马式建筑，奶油色的金色外墙、圆形拱门和高高的钟楼",
          "宽敞的校园，古树掩映，安静的泉市场区中心"
        ],
        "audioScript": [
          "欢迎来到第五郡陈平庄 120 号的祖泉教堂 (Cho Quan Church)，它是胡志明市最古老的天主教堂，自 1722 年以来已有 300 多年的历史。",
          "现在的大教堂于1896年落成，具有古老而雄伟的罗马式美感，是西贡-草龙地区的重要历史见证。",
          "据维基百科百科介绍：楚泉教堂（昵称：耶稣圣心教堂）是胡志明市的一座天主教堂，隶属于楚泉堂区，位于胡志明市楚泉坊陈平仲街120号。教堂为罗马式建筑，曾多次被毁，并于1727年、1733年、1793年、1862年、1882年重建，现在的教堂于1896年落成。祖泉教堂是胡志明市最古老的教堂。"
        ]
      },
      "ja": {
        "name": "チョークアン教会（ホーチミン市最古の教会・1722年）",
        "shortSummary": "ホーチミン市最古のカトリック教会 (1722 年創立) には、1896 年に完成した壮大なロマネスク様式の大聖堂があります。",
        "historicalEra": "1722年創設 – 1896年現聖堂",
        "openingHours": "05:00 – 11:00, 14:30 – 19:00",
        "architecturalHighlights": [
          "サイゴンの地とともに形成された300年以上の歴史 - ジアディン",
          "クリーミーな金色のファサード、丸いアーチ、高い鐘楼を備えた絶妙なロマネスク様式の建築",
          "クアン市場エリアの真ん中にある静かな、古木の木陰に囲まれた広々としたキャンパス"
        ],
        "audioScript": [
          "5 区チャン ビン チョン 120 番地にあるチョ クアン教会へようこそ。1722 年以来 300 年以上の歴史を持つホーチミン市最古のカトリック教会です。",
          "1896 年に完成した現在の大聖堂は、古代の荘厳なロマネスク様式の美しさを持ち、サイゴン - チョロン地域の重要な歴史的証人です。",
          "ウィキペディア百科事典によると: チョークアン教会 (愛称: イエス聖心教会) は、ホーチミン市のカトリック教会で、チョークアン教区に属し、ホーチミン市チョークアン区チャンビンチョン通り 120 番地にあります。この教会はロマネスク様式の建築で、何度も破壊されましたが、1727年、1733年、1793年、1862年、1882年に再建され、現在の教会は1896年に完成しました。チョクアン教会はホーチミン市で最も古い教会です。"
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
        "shortSummary": "Green and peaceful Southern garden space in the heart of the city with nipa palm groves, monkey bridge, lotus pond, mud-walled cottages and famous Southern reclaimed cuisine buffet.",
        "historicalEra": "Established in the 1970s",
        "openingHours": "09:00 – 21:00 Daily",
        "architecturalHighlights": [
          "Original Southern garden landscape with monkey bridge, dinghy and coconut leaf hut",
          "Large green lawn along the Saigon River - coordinates for taking photos of beautiful traditional ao dai and Ba Ba ao dai",
          "The weekend \"Southern Desolation\" buffet brings together more than 70 rustic dishes"
        ],
        "audioScript": [
          "Welcome to Binh Quoi Tourist Village located at the end of the green Thanh Da peninsula next to the Saigon River.",
          "Away from the bustle of the center, only about 20 minutes away, this place fully recreates the soul of the Southern countryside with nipa palm groves, water lily ponds, dinghy boats and the rich flavor of garden cuisine.",
          "According to Wikipedia encyclopedia: Binh Quoi - Thanh Da is a peninsula (often referred to as Thanh Da peninsula or Binh Quoi peninsula) located on the Saigon River in Binh Quoi ward, Ho Chi Minh City, Vietnam. Although located in the heart of the city, this peninsula is still like a countryside because the planning project has been suspended for more than 25 years. Common landscapes here are rice fields, ponds, and lagoons, contrasting with high-rise buildings, apartments, and villas on the other side of the Saigon River in Thao Dien area, An Khanh ward."
        ]
      },
      "fr": {
        "name": "Village Touristique de Binh Quoi (Presqu’île de Thanh Da)",
        "shortSummary": "Espace jardin verdoyant et paisible du Sud au cœur de la ville avec palmeraies de nipa, pont de singe, étang de lotus, cottages aux murs de boue et célèbre buffet de cuisine du Sud récupérée.",
        "historicalEra": "Années 1970",
        "openingHours": "09h00 – 21h00",
        "architecturalHighlights": [
          "Paysage de jardin original du Sud avec pont de singe, canot et cabane en feuilles de cocotier",
          "Grande pelouse verte le long de la rivière Saigon - coordonnées pour prendre des photos de magnifiques ao dai traditionnels et Ba Ba ao dai",
          "Le buffet du week-end « Désolation du Sud » rassemble plus de 70 plats rustiques"
        ],
        "audioScript": [
          "Bienvenue au village touristique de Binh Quoi situé à l'extrémité de la péninsule verdoyante de Thanh Da, à côté de la rivière Saigon.",
          "À l'écart de l'agitation du centre, à seulement 20 minutes environ, cet endroit recrée pleinement l'âme de la campagne du Sud avec ses palmeraies de nipa, ses étangs aux nénuphars, ses canots pneumatiques et la riche saveur de la cuisine du jardin.",
          "Selon l'encyclopédie Wikipédia : Binh Quoi - Thanh Da est une péninsule (souvent appelée péninsule de Thanh Da ou péninsule de Binh Quoi) située sur la rivière Saigon dans le quartier de Binh Quoi, à Ho Chi Minh-Ville, au Vietnam. Bien que située au cœur de la ville, cette presqu'île ressemble encore à une campagne car le projet d'urbanisme est suspendu depuis plus de 25 ans. Les paysages communs ici sont des rizières, des étangs et des lagons, contrastant avec des immeubles de grande hauteur, des appartements et des villas de l'autre côté de la rivière Saigon, dans la région de Thao Dien, dans le quartier d'An Khanh."
        ]
      },
      "zh": {
        "name": "平桂旅游村（清多半岛）",
        "shortSummary": "位于市中心的绿色宁静的南方园林空间，有尼帕棕榈林、猴桥、荷花池、泥墙小屋和著名的南方再生美食自助餐。",
        "historicalEra": "始建于20世纪70年代",
        "openingHours": "09:00 – 21:00",
        "architecturalHighlights": [
          "原始的南方园林景观，有猴桥、小艇和椰叶小屋",
          "西贡河沿岸的大片绿色草坪 - 拍摄美丽的传统奥黛和巴巴奥黛照片的坐标",
          "周末“南荒”自助餐汇聚70余道乡村菜肴"
        ],
        "audioScript": [
          "欢迎来到 Binh Quoi 旅游村，该村位于西贡河旁边绿色的 Thanh Da 半岛的尽头。",
          "远离市中心的喧嚣，仅约20分钟路程，这里充分再现了南方乡村的灵魂，有尼帕棕榈林、睡莲池、小船和浓郁的花园美食。",
          "根据维基百科百科全书： Binh Quoi - Thanh Da 是位于越南胡志明市 Binh Quoi 区西贡河上的一个半岛（通常称为 Thanh Da 半岛或 Binh Quoi 半岛）。虽然位于城市中心，但这个半岛仍然像一个乡村，因为规划项目已经暂停了25年多。这里常见的景观是稻田、池塘和泻湖，与安庆区 Thao Dien 地区西贡河对岸的高层建筑、公寓和别墅形成鲜明对比。"
        ]
      },
      "ja": {
        "name": "ビンクオイ観光村（タインダー半島）",
        "shortSummary": "ニパヤシの木立、猿の橋、蓮の池、土壁のコテージ、そして有名な南部の再生料理ビュッフェを備えた、市の中心部にある緑豊かで静かな南部の庭園空間。",
        "historicalEra": "1970年代開設",
        "openingHours": "09:00 – 21:00",
        "architecturalHighlights": [
          "猿の橋、ディンギー、ココナッツの葉の小屋のあるオリジナルの南部庭園の風景",
          "サイゴン川沿いの広い緑の芝生 - 美しい伝統的なアオザイとババアオザイの写真を撮るのに最適な場所",
          "週末の「Southern Desolation」ビュッフェには、70 種類以上の素朴な料理が集まります"
        ],
        "audioScript": [
          "サイゴン川の隣、緑豊かなタンダ半島の端にあるビン クオイ観光村へようこそ。",
          "中心部の喧騒からわずか 20 分ほど離れたこの場所では、ニッパヤシの木立、スイレンの池、ディンギーボート、豊かな風味の庭園料理など、南部の田園地帯の魂を完全に再現しています。",
          "ウィキペディア百科事典によると: ビンクオイ - タンダーは、ベトナム、ホーチミン市ビンクオイ区のサイゴン川沿いに位置する半島 (タンダー半島またはビンクオイ半島と呼ばれることが多い) です。都市の中心部にありながら、25年以上も計画が中断されているため、今も田舎のような半島です。ここでよく見られる風景は水田、池、ラグーンで、サイゴン川の対岸のアンカイン区タオディエン地区にある高層ビル、アパート、別荘とは対照的です。"
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
        "shortSummary": "The ancient apartment alley was built in 1910 by Hua Bon Hoa Company (Uncle Hoa), famous for its blue-yellow painted corridors, wooden stairs and scenery reminiscent of old Hong Kong cinema.",
        "historicalEra": "Built in 1910",
        "openingHours": "08:00 – 18:00 (Please respect residents)",
        "architecturalHighlights": [
          "Two rows of adjacent 2-storey townhouses symmetrically walk through a narrow walkway paved with ancient tiles, imbued with the soul of Cho Lon in the early 20th century.",
          "The color palette of turquoise, pale yellow, wooden shutters and red couplets create a unique photographic backdrop",
          "Adjacent to Luong Nhu Hoc Lantern Street and Nguyen Trai Assembly Hall axis"
        ],
        "audioScript": [
          "Welcome to Hao Si Ward Ancient Alley at 206 Tran Hung Dao, District 5 - a more than 115-year-old residential area built by Chu Hoa company in 1910.",
          "Stepping through the small alley gate, the space seems to go back in time to Cho Lon in the 1960s with rows of green and yellow balconies facing each other. When taking souvenir photos, please keep quiet and respect the daily life of the households here.",
          "According to Wikipedia encyclopedia: Cho Lon (Chinese character: 堤岸; Sino-Vietnamese pronunciation: De Ngan; Cantonese pronunciation: Thay Ngon) is an area where many overseas Chinese live along the Tau Hu Canal, stretching across the old District 5 and 6, south to the old District 8, north to the old District 10 and 11 in Ho Chi Minh City, Vietnam. Cho Lon Quarter has been inhabited by overseas Chinese for a long time and is considered the largest Chinatown in the world by area."
        ]
      },
      "fr": {
        "name": "Ruelle Historique Hao Si Phuong (1910)",
        "shortSummary": "L'ancienne ruelle des appartements a été construite en 1910 par la société Hua Bon Hoa (Oncle Hoa), célèbre pour ses couloirs peints en bleu-jaune, ses escaliers en bois et ses décors rappelant le vieux cinéma de Hong Kong.",
        "historicalEra": "1910",
        "openingHours": "08h00 – 18h00",
        "architecturalHighlights": [
          "Deux rangées de maisons de ville adjacentes de 2 étages traversent symétriquement une allée étroite pavée de tuiles anciennes, imprégnée de l'âme de Cho Lon au début du XXe siècle.",
          "La palette de couleurs turquoise, jaune pâle, volets en bois et distiques rouges crée une toile de fond photographique unique.",
          "À côté de la rue des lanternes Luong Nhu Hoc et de l'axe de la salle de l'Assemblée Nguyen Trai"
        ],
        "audioScript": [
          "Bienvenue dans l'ancienne ruelle du quartier Hao Si, au 206 Tran Hung Dao, district 5 - un quartier résidentiel vieux de plus de 115 ans construit par la société Chu Hoa en 1910.",
          "En franchissant la petite porte de la ruelle, l'espace semble remonter le temps à Cho Lon dans les années 1960 avec des rangées de balcons verts et jaunes se faisant face. Lorsque vous prenez des photos souvenirs, veuillez rester silencieux et respecter la vie quotidienne des ménages ici.",
          "Selon l'encyclopédie Wikipédia : Cho Lon (caractère chinois : 堤岸 ; prononciation sino-vietnamienne : De Ngan ; prononciation cantonaise : Thay Ngon) est une région où de nombreux Chinois d'outre-mer vivent le long du canal Tau Hu, s'étendant à travers les anciens districts 5 et 6, au sud jusqu'à l'ancien district 8, au nord jusqu'aux anciens districts 10 et 11 à Hô Chi Minh-Ville, au Vietnam. Le quartier Cho Lon est habité depuis longtemps par des Chinois d'outre-mer et est considéré comme le plus grand quartier chinois du monde en termes de superficie."
        ]
      },
      "zh": {
        "name": "豪士坊百年老巷（1910年）",
        "shortSummary": "这条古老的公寓胡同是由华邦和公司（Uncle Hoa）于 1910 年建造的，以其蓝黄色的走廊、木楼梯和让人想起旧香港电影院的风景而闻名。",
        "historicalEra": "建于1910年",
        "openingHours": "08:00 – 18:00（请轻声文明参观）",
        "architecturalHighlights": [
          "两排相邻的两层联排别墅对称地穿过一条铺有古瓷砖的狭窄走道，充满了20世纪初期的Cho Lon灵魂。",
          "绿松石色、淡黄色、木质百叶窗和红色对联的色调营造出独特的摄影背景",
          "毗邻 Luong Nhu Hoc 灯笼街和 Nguyen Trai 大会堂轴线"
        ],
        "audioScript": [
          "欢迎来到第五区陈兴岛 206 号的好四坊古巷 - 这是一个由 Chu Hoa 公司于 1910 年建造的拥有超过 115 年历史的住宅区。",
          "穿过小巷门，一排排绿色和黄色的阳台相对，空间仿佛回到了1960年代的Cho Lon。拍摄纪念照片时，请保持安静并尊重这里住户的日常生活。",
          "据维基百科百科介绍：堤岸是越南胡志明市头湖运河沿线的一个华人聚居区，横跨旧五、六郡，南至旧八郡，北至旧十、十一郡。堤岸区自古以来就有海外华人聚居，被认为是世界上面积最大的唐人街。"
        ]
      },
      "ja": {
        "name": "ハオシーフオン歴史路地（1910年）",
        "shortSummary": "この古いアパートの路地は、1910 年にフア ボン ホア社 (ホアおじさん) によって建設され、青と黄色に塗られた廊下、木製の階段、古い香港映画を思い出させる風景で有名です。",
        "historicalEra": "1910年建築",
        "openingHours": "08:00 – 18:00（住民への配慮を忘れずに）",
        "architecturalHighlights": [
          "2 階建ての隣接するタウンハウスが 2 列対称に並び、古代のタイルで舗装された狭い通路には、20 世紀初頭のチョロンの魂が染み込んでいます。",
          "ターコイズ、淡い黄色、木製雨戸、赤い対句のカラーパレットがユニークな写真の背景を作り出します。",
          "ルオン・ニュー・ホック・ランタン・ストリートとグエン・トライ・アセンブリー・ホールの軸に隣接"
        ],
        "audioScript": [
          "5区チャンフンダオ206番地にあるハオシー区古代路地へようこそ - 1910年にChu Hoa社によって建設された築115年以上の住宅地です。",
          "路地の小さな門をくぐると、緑と黄色のバルコニーが向かい合った空間が広がり、1960年代のチョロンにタイムスリップしたかのような空間が広がります。記念写真を撮影する際は、静かに各世帯の日常生活を尊重してください。",
          "ウィキペディア百科事典によると、チョーロン（漢字：堤岸、中越語発音：デガン、広東語発音：タイゴン）は、ベトナム・ホーチミン市の旧5区と6区、南は旧8区、北は旧10区と11区にまたがるタウフ運河沿いの華僑が多く住む地域である。チョロン地区は古くから華僑が居住しており、面積では世界最大のチャイナタウンとみなされています。"
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
        "shortSummary": "The greatest historical wholesale market in Cho Lon area was built in 1928-1930 by businessman Quach Dam, with Asian Khau architecture combining French technology and a 4-sided clock tower.",
        "historicalEra": "1928 – 1930",
        "openingHours": "06:00 – 19:00 Daily",
        "architecturalHighlights": [
          "Curved glass tile roof with a pair of dragons flanking pearls and an ancient 4-sided clock tower",
          "The large skylight garden courtyard in the center has a bronze statue of businessman Quach Dam",
          "More than 2,300 wholesale stalls selling spices, tea, herbs, cakes and jams and an extremely vibrant Cho Lon food court"
        ],
        "audioScript": [
          "Welcome to Binh Tay Market - also known as Cho Lon Moi at 57A Thap Muoi, District 6.",
          "Started in 1928 with funding from businessman Quach Dam, the market is a masterpiece of intersection between Asian yin and yang tile roofs and French reinforced concrete structures, possessing a green atrium filled with the identity of Cho Lon commercial port.",
          "According to Wikipedia encyclopedia: Binh Tay Market, also known as Cho Lon Moi, is a market in Binh Tay ward (former District 6), Ho Chi Minh City, located in the area called Cho Lon. Binh Tay Market is located on a 25,000 m² campus, located between 4 routes: Thap Muoi - Le Tan Ke - Phan Van Khoe - Tran Binh. This market has a rectangular floor plan, 12 gates (both main and auxiliary) and is designed in the Asian architectural style."
        ]
      },
      "fr": {
        "name": "Marché Binh Tay (Grand Marché de Cho Lon · 1928)",
        "shortSummary": "Le plus grand marché de gros historique de la région de Cho Lon a été construit entre 1928 et 1930 par l'homme d'affaires Quach Dam, avec une architecture asiatique Khau combinant technologie française et tour d'horloge à 4 côtés.",
        "historicalEra": "1928 – 1930",
        "openingHours": "06h00 – 19h00",
        "architecturalHighlights": [
          "Toit en tuiles de verre incurvées avec une paire de dragons flanquant des perles et une ancienne tour d'horloge à 4 côtés",
          "La grande cour-jardin avec lucarne au centre abrite une statue en bronze de l'homme d'affaires Quach Dam",
          "Plus de 2 300 stands de vente en gros vendant des épices, du thé, des herbes, des gâteaux et des confitures, ainsi qu'une aire de restauration Cho Lon extrêmement animée."
        ],
        "audioScript": [
          "Bienvenue au marché de Binh Tay - également connu sous le nom de Cho Lon Moi, au 57A Thap Muoi, district 6.",
          "Lancé en 1928 grâce au financement de l'homme d'affaires Quach Dam, le marché est un chef-d'œuvre d'intersection entre les toits de tuiles asiatiques yin et yang et les structures françaises en béton armé, possédant un atrium vert rempli de l'identité du port commercial de Cho Lon.",
          "Selon l'encyclopédie Wikipédia : Le marché de Binh Tay, également connu sous le nom de Cho Lon Moi, est un marché du quartier de Binh Tay (ancien district 6), à Hô Chi Minh-Ville, situé dans la zone appelée Cho Lon. Le marché Binh Tay est situé sur un campus de 25 000 m², situé entre 4 routes : Thap Muoi - Le Tan Ke - Phan Van Khoe - Tran Binh. Ce marché a un plan rectangulaire, 12 portes (principales et auxiliaires) et est conçu dans le style architectural asiatique."
        ]
      },
      "zh": {
        "name": "平西市场（堤岸新大市场 · 1928年）",
        "shortSummary": "Cho Lon地区历史最悠久的批发市场由商人Quach Dam于1928-1930年建造，采用亚洲Khu建筑风格，结合了法国技术和四面钟楼。",
        "historicalEra": "1928 – 1930年",
        "openingHours": "06:00 – 19:00",
        "architecturalHighlights": [
          "弧形玻璃瓦屋顶，两侧有珍珠龙和古老的四面钟楼",
          "中心的大天窗花园庭院有一尊商人Quach Dam的铜像",
          "超过 2,300 个批发摊位出售香料、茶叶、香草、蛋糕和果酱，以及充满活力的 Cho Lon 美食广场"
        ],
        "audioScript": [
          "欢迎来到 Binh Tay 市场 - 也称为 Cho Lon Moi，位于第 6 区 Thap Muoi 57A。",
          "该市场始建于1928年，由商人Quach Dam资助，是亚洲阴阳瓦屋顶与法式钢筋混凝土结构交汇的杰作，拥有充满了卓伦商港特色的绿色中庭。",
          "据维基百科百科介绍：Binh Tay Market，又名 Cho Lon Moi，是胡志明市 Binh Tay 区（前第六郡）的一个市场，位于名为 Cho Lon 的地区。 Binh Tay 市场位于占地 25,000 平方米的园区内，位于 4 条路线之间：Thap Muoi - Le Tan Ke - Phan Van Khoe - Tran Binh。该市场平面呈长方形，有12个大门（主副），采用亚洲建筑风格设计。"
        ]
      },
      "ja": {
        "name": "ビンタイ市場（チョロン大市場・1928年）",
        "shortSummary": "チョロン地区最大の歴史ある卸売市場は、1928 年から 1930 年にかけて実業家のクアック ダムによって建設され、フランスの技術と 4 面の時計塔を組み合わせたアジアン カウ建築が特徴です。",
        "historicalEra": "1928年 – 1930年",
        "openingHours": "06:00 – 19:00",
        "architecturalHighlights": [
          "真珠の両側に一対の龍が描かれた湾曲したガラスタイルの屋根と古代の 4 面の時計塔",
          "中央にある大きな天窓の中庭には実業家クワック・ダムの銅像がある",
          "スパイス、紅茶、ハーブ、ケーキ、ジャムを販売する 2,300 を超える卸売屋台と、非常に活気のあるチョロンのフードコート"
        ],
        "audioScript": [
          "ビンタイ市場へようこそ - チョ ロン モイとしても知られています。住所は 57A Thap Muoi、6 区です。",
          "実業家クアック・ダムの資金提供により 1928 年に設立されたこの市場は、アジアの陰陽瓦屋根とフランスの鉄筋コンクリート構造が交差する傑作で、チョロン商業港のアイデンティティに満ちた緑のアトリウムを備えています。",
          "ウィキペディア百科事典によると、チョロンモイとしても知られるビンタイ市場は、ホーチミン市ビンタイ区（旧6区）のチョロンと呼ばれる地域にある市場です。ビンタイ市場は 25,000 平方メートルのキャンパス内にあり、タップ ムオイ - レ タン ケ - ファン ヴァン コー - チャン ビンの 4 つのルートの間に位置します。この市場は長方形の平面図で、12 の門 (メインと補助の両方) があり、アジアの建築様式で設計されています。"
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
        "shortSummary": "The first traditional medicine museum in Vietnam is designed in the style of a traditional 5-story wooden house with elaborate carvings, storing more than 3,000 artifacts like knives, canoes, and ancient medicine books from the Stone Age.",
        "historicalEra": "Opened in 2007",
        "openingHours": "08:30 – 17:00 Daily",
        "architecturalHighlights": [
          "The 5-storey wooden house includes 18 galleries of dragon and phoenix carvings in the traditional North - Central - South style",
          "Collection of more than 3,000 medical artifacts: knives, canopies, mortars, medicine kettles and 19th-century herbal medicine cabinets",
          "Experience taking medicine, pounding herbs and enjoying free nutritious tea after the tour"
        ],
        "audioScript": [
          "Welcome to the Museum of Vietnamese Traditional Medicine - FITO Museum at 41 Hoang Du Khuong, District 10.",
          "Stepping through the exquisitely carved wooden door, you will be lost in the space of 18 galleries with a gentle herbal scent, discovering the thousand-year history of traditional medicine with two great physicians, Tue Tinh and Hai Thuong Lan Ong."
        ]
      },
      "fr": {
        "name": "Musée FITO de la Médecine Traditionnelle Vietnamienne",
        "shortSummary": "Le premier musée de médecine traditionnelle du Vietnam est conçu dans le style d'une maison traditionnelle en bois de 5 étages avec des sculptures élaborées, stockant plus de 3 000 artefacts comme des couteaux, des canoës et des livres de médecine anciens de l'âge de pierre.",
        "historicalEra": "2007",
        "openingHours": "08h30 – 17h00",
        "architecturalHighlights": [
          "La maison en bois de 5 étages comprend 18 galeries de sculptures de dragons et de phénix dans le style traditionnel Nord-Centre-Sud.",
          "Collection de plus de 3 000 objets médicaux : couteaux, dais, mortiers, bouilloires à médicaments et armoires à pharmacie du XIXe siècle.",
          "Expérience de prise de médicaments, de broyage d'herbes et de dégustation de thé nutritif gratuit après la visite"
        ],
        "audioScript": [
          "Bienvenue au Musée de Médecine Traditionnelle Vietnamienne - Musée FITO au 41 Hoang Du Khuong, District 10.",
          "En franchissant la porte en bois superbement sculptée, vous vous perdrez dans l'espace de 18 galeries au doux parfum d'herbes, à la découverte de l'histoire millénaire de la médecine traditionnelle avec deux grands médecins, Tue Tinh et Hai Thuong Lan Ong."
        ]
      },
      "zh": {
        "name": "越南传统医学博物馆（FITO博物馆）",
        "shortSummary": "越南第一座传统医学博物馆，采用传统五层木屋风格设计，雕刻精美，收藏有3000多件石器时代的刀具、独木舟、古医书等文物。",
        "historicalEra": "2007年开馆",
        "openingHours": "08:30 – 17:00",
        "architecturalHighlights": [
          "木屋楼高5层，内有18间北中南传统龙凤雕刻廊",
          "收藏超过 3,000 件医疗文物：刀具、华盖、研钵、药壶和 19 世纪的草药柜",
          "参观结束后体验服药、捣药、免费享用营养茶"
        ],
        "audioScript": [
          "欢迎来到越南传统医学博物馆 - FITO 博物馆，地址：41 Hoang Du Khuong, District 10。",
          "踏入雕刻精美的木门，您将迷失在18个画廊的空间中，散发着柔和的草药香味，与两位伟大的医师Tue Tinh和Hai Thuong Lan Ong一起探索传统医学的千年历史。"
        ]
      },
      "ja": {
        "name": "ベトナム伝統医学博物館（FITOミュージアム）",
        "shortSummary": "ベトナム初の伝統医学博物館は、精巧な彫刻が施された伝統的な 5 階建ての木造住宅のスタイルで設計されており、ナイフ、カヌー、石器時代の古代医学書など 3,000 点以上の工芸品が保管されています。",
        "historicalEra": "2007年開館",
        "openingHours": "08:30 – 17:00",
        "architecturalHighlights": [
          "5 階建ての木造住宅には、伝統的な北 - 中 - 南スタイルの龍と鳳凰の彫刻の 18 つのギャラリーが含まれています。",
          "3,000 点以上の医療品のコレクション: ナイフ、天蓋、迫撃砲、薬瓶、19 世紀の漢方薬棚など",
          "ツアー後に薬を飲んだり、ハーブを叩いたり、無料の栄養価の高いお茶を楽しんだりする体験"
        ],
        "audioScript": [
          "ベトナム伝統医学博物館 - FITO 博物館 (住所: 41 Hoang Du Khuong, District 10) へようこそ。",
          "精巧な彫刻が施された木製のドアをくぐり抜けると、優しいハーブの香りが漂う 18 のギャラリーの空間に迷い込み、二人の偉大な医師トゥ ティンとハイ トゥオン ラン オンによる伝統医学の千年の歴史を知ることができます。"
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
        "shortSummary": "The largest fresh flower wholesale market in Ho Chi Minh City operates 24/7, combining a street food paradise with more than 100 most vibrant Saigon - Cambodian specialties at night.",
        "historicalEra": "Established in 1987",
        "openingHours": "Flower Market 24/7 · Food Street 15:00 – 23:00",
        "architecturalHighlights": [
          "Brilliant fresh flower market imported directly from Da Lat and the West - beautiful early morning scene",
          "The culinary street is nearly 500m long with beef noodle soup, Cambodian sweet soup, lemongrass grilled beef spring rolls, and snail noodles.",
          "The Vietnamese - Khmer cultural intersection space is friendly and rich in local vitality"
        ],
        "audioScript": [
          "Welcome to Ho Thi Ky Flower Market and Food Street in District 10 - where the scent of thousands of Da Lat flowers blends with the busiest street food symphony in Saigon.",
          "During the day, you can walk and take photos amid the vast sea of fresh flowers, and from 3:00 p.m. onwards, the street lights up with more than a hundred attractive Vietnamese - Cambodian cuisine stalls."
        ]
      },
      "fr": {
        "name": "Marché aux Fleurs & Rue Gastronomique Ho Thi Ky",
        "shortSummary": "Le plus grand marché de gros de fleurs fraîches d'Hô Chi Minh-Ville fonctionne 24h/24 et 7j/7, combinant un paradis de cuisine de rue avec plus de 100 spécialités cambodgiennes les plus dynamiques de Saigon la nuit.",
        "historicalEra": "1987",
        "openingHours": "24h/24 (Street-food 15h00 – 23h00)",
        "architecturalHighlights": [
          "Brillant marché aux fleurs fraîches importées directement de Da Lat et de l'Ouest - belle scène tôt le matin",
          "La rue culinaire fait près de 500 m de long avec de la soupe de nouilles au bœuf, de la soupe sucrée cambodgienne, des rouleaux de printemps au bœuf grillé à la citronnelle et des nouilles aux escargots.",
          "L’espace d’intersection culturelle vietnamienne – khmère est convivial et riche de la vitalité locale"
        ],
        "audioScript": [
          "Bienvenue au marché aux fleurs et à la rue gastronomique de Ho Thi Ky, dans le district 10, où le parfum de milliers de fleurs de Da Lat se mélange à la symphonie culinaire de rue la plus animée de Saigon.",
          "Pendant la journée, vous pourrez vous promener et prendre des photos au milieu de la vaste mer de fleurs fraîches, et à partir de 15h00. à partir de maintenant, la rue s'illumine de plus d'une centaine de jolis stands de cuisine vietnamienne et cambodgienne."
        ]
      },
      "zh": {
        "name": "胡氏纪鲜花市场与夜市美食街",
        "shortSummary": "胡志明市最大的鲜花批发市场 24/7 全天候运营，将街头美食天堂与 100 多种最具活力的西贡 - 柬埔寨夜间特色美食融为一体。",
        "historicalEra": "始建于1987年",
        "openingHours": "花市全天 · 美食街 15:00 – 23:00",
        "architecturalHighlights": [
          "精彩的鲜花市场，直接从大叻和西方进口 - 美丽的清晨景色",
          "美食街近500m长，有牛肉面、柬埔寨甜汤、柠檬草烤牛肉春卷、螺蛳粉等。",
          "越南-高棉文化交汇空间友善且富有当地活力"
        ],
        "audioScript": [
          "欢迎来到第 10 区的 Ho Thi Ky 花卉市场和美食街 - 那里成千上万的大叻鲜花的香气与西贡最繁忙的街头美食交响曲融为一体。",
          "白天，您可以在广阔的花海中散步、拍照，下午 3:00 开始，您可以在这片花海中漫步拍照。此后，街道上灯火通明，一百多个诱人的越南-柬埔寨美食摊位。"
        ]
      },
      "ja": {
        "name": "ホー・ティ・キー花市場＆屋台グルメ通り",
        "shortSummary": "ホーチミン市最大の生花卸売市場は 24 時間年中無休で営業しており、屋台の楽園と 100 以上の最も活気のあるサイゴン - カンボジアの名物料理を夜に組み合わせています。",
        "historicalEra": "1987年開設",
        "openingHours": "花市場 24時間・グルメ通り 15:00 – 23:00",
        "architecturalHighlights": [
          "ダラットや西部から直輸入された鮮やかな生花市場 - 美しい早朝の風景",
          "牛肉麺のスープ、カンボジアの甘いスープ、レモングラスで焼いた牛肉の春巻き、カタツムリの麺などが並ぶグルメ街は、長さ約 500 メートルです。",
          "ベトナムとクメールの文化が交差するフレンドリーで地域の活力に富んだ空間"
        ],
        "audioScript": [
          "10 区のホー ティ キ フラワー マーケットとフード ストリートへようこそ。ここでは、何千ものダラットの花の香りが、サイゴンで最も賑わうストリート フードのシンフォニーと融合します。",
          "日中は広大な生花の海の中を散歩したり写真を撮ったりすることができ、午後3時からは花々が咲き誇ります。その後、通りには 100 軒以上の魅力的なベトナム料理やカンボジア料理の屋台が並びます。"
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
        "shortSummary": "The busiest street that never sleeps in Ho Chi Minh City for international tourists and young people, lit up with neon lights, live music, late-night cuisine and craft beer.",
        "historicalEra": "Pedestrian street since 2017",
        "openingHours": "Liveliest 19:00 – 02:00",
        "architecturalHighlights": [
          "The festive atmosphere of a street filled with neon lights is nearly 850m long in the middle of Pham Ngu Lao area",
          "Hundreds of nightlife bars, Saigon beer, acoustic music and international cultural exchange street artists",
          "An ideal stop to end a day exploring District 1 heritage"
        ],
        "audioScript": [
          "Welcome to Bui Vien Walking Street - the most famous Western Quarter of Ho Chi Minh City, where the lights and music never turn off at night.",
          "From rustic sidewalk eateries to vibrant live music spaces, Bui Vien offers an energetic perspective on Saigon's nightlife.",
          "According to Wikipedia encyclopedia: Bui Vien Street is a street in Ben Thanh ward, Ho Chi Minh City. This is a famous nightlife route of the city with many bars and small roadside beer shops, specializing in selling cheap tourist goods and services. Bui Vien Street starts from Tran Hung Dao Street, next to Tran Hung Dao - Nguyen Thai Hoc intersection, intersects with De Tham and Do Quang Dau streets and ends at Cong Quynh Street. The area of ​​Bui Vien, De Tham, Pham Ngu Lao and Do Quang Dau streets is also known as Backpacker Street."
        ]
      },
      "fr": {
        "name": "Rue piétonne Bui Vien (Quartier nocturne)",
        "shortSummary": "La rue la plus fréquentée qui ne dort jamais à Hô Chi Minh-Ville pour les touristes internationaux et les jeunes, éclairée de néons, de musique live, de cuisine de fin de soirée et de bière artisanale.",
        "historicalEra": "Rue piétonne depuis 2017",
        "openingHours": "19h00 – 02h00",
        "architecturalHighlights": [
          "L'ambiance festive d'une rue remplie de néons s'étend sur près de 850 m de long au milieu du quartier de Pham Ngu Lao",
          "Des centaines de bars de vie nocturne, de la bière Saigon, de la musique acoustique et des artistes de rue d'échanges culturels internationaux",
          "Une étape idéale pour terminer une journée de découverte du patrimoine du District 1"
        ],
        "audioScript": [
          "Bienvenue dans la rue piétonne Bui Vien, le quartier ouest le plus célèbre d'Hô Chi Minh-Ville, où les lumières et la musique ne s'éteignent jamais la nuit.",
          "Des restaurants rustiques sur trottoir aux espaces de musique live animés, Bui Vien offre une perspective énergique sur la vie nocturne de Saigon.",
          "Selon l'encyclopédie Wikipédia : La rue Bui Vien est une rue du quartier Ben Thanh, à Hô Chi Minh-Ville. Il s'agit d'une célèbre rue de la vie nocturne de la ville, avec de nombreux bars et petites brasseries en bord de route, spécialisées dans la vente de biens et services touristiques bon marché. La rue Bui Vien part de la rue Tran Hung Dao, à côté de l'intersection Tran Hung Dao - Nguyen Thai Hoc, croise les rues De Tham et Do Quang Dau et se termine à la rue Cong Quynh. Le quartier des rues Bui Vien, De Tham, Pham Ngu Lao et Do Quang Dau est également connu sous le nom de rue des routards."
        ]
      },
      "zh": {
        "name": "范五老街 · 裴援步行街（西贡不夜街）",
        "shortSummary": "胡志明市最繁忙的不夜街，为国际游客和年轻人所青睐，霓虹灯、现场音乐、深夜美食和精酿啤酒点亮了这里。",
        "historicalEra": "2017年设为步行街",
        "openingHours": "19:00 – 02:00最热闹",
        "architecturalHighlights": [
          "范五老区中部近850m长的霓虹灯街道充满节日气氛",
          "数百家夜生活酒吧、西贡啤酒、原声音乐和国际文化交流街头艺术家",
          "结束一天探索第一区遗产的理想下榻之处"
        ],
        "audioScript": [
          "欢迎来到碧文步行街 - 胡志明市最著名的西区，这里的灯光和音乐在夜晚永不熄灭。",
          "从质朴的路边餐馆到充满活力的现场音乐场所，Bui Vien 为西贡的夜生活提供了充满活力的视角。",
          "根据维基百科百科全书：碧文街是胡志明市滨城区的一条街道。这是该市著名的夜生活路线，有许多酒吧和路边小啤酒店，专门出售廉价的旅游商品和服务。 Bui Vien 街起于 Tran Hung Dao 街，靠近 Tran Hung Dao - Nguyen Thai Hoc 交叉路口，与 De Tham 街和 Do Quang Dau 街相交，终止于 Cong Quynh 街。 Bui Vien、De Tham、Pham Ngu Lao 和 Do Quang Dau 街道地区也被称为背包客街。"
        ]
      },
      "ja": {
        "name": "ブイビエン歩行者天国（バックパッカー通り）",
        "shortSummary": "外国人観光客や若者で賑わうホーチミン市で最も活気のある通りで、ネオン、生演奏、深夜の料理、クラフトビールが光ります。",
        "historicalEra": "2017年歩行者天国化",
        "openingHours": "19:00 – 02:00がピーク",
        "architecturalHighlights": [
          "ファングーラオ地区の中心部にある全長約850mのネオン街はお祭り気分",
          "何百ものナイトライフ バー、サイゴン ビール、アコースティック ミュージック、国際文化交流のストリート アーティスト",
          "1 区の歴史遺産を探索して 1 日を終えるのに最適な場所"
        ],
        "audioScript": [
          "ブイビエン ウォーキング ストリートへようこそ。ホーチミン市で最も有名な西部地区で、夜になっても照明と音楽が消えることはありません。",
          "素朴な歩道の飲食店から活気のあるライブ音楽スペースまで、ブイ ビエンではサイゴンのナイトライフをエネルギッシュに見ることができます。",
          "ウィキペディア百科事典によると、ブイビエン通りはホーチミン市ベンタイン区の通りです。これは街の有名なナイトライフ ルートで、多くのバーや道端の小さなビール ショップがあり、格安の観光商品やサービスの販売に特化しています。ブイビエン通りは、チャンフンダオ通りとグエンタイホック通りの交差点の隣にあるチャンフンダオ通りから始まり、デタム通りとドークアンダウ通りと交差し、コンクイン通りで終わります。ブイビエン通り、デタム通り、ファングーラオ通り、ドークアンダウ通りのエリアはバックパッカーストリートとしても知られています。"
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
        "shortSummary": "Extremely attractive emerging riverside check-in coordinates on the East bank of the Saigon River, possessing seasonal flower fields, riverside pedestrian bridges and a million-dollar view of the District 1 skyline - Bitexco.",
        "historicalEra": "Opened late 2023",
        "openingHours": "Open 24/7 (Best 16:30 – 21:30)",
        "architecturalHighlights": [
          "The most beautiful panoramic view of the District 1 skyline, Bitexco Tower and Ba Son Bridge in Ho Chi Minh City",
          "Bright sunflower & seasonal flower fields, An Khanh ancient house area and riverside event stage",
          "Direct connection to the Saigon Waterbus river bus line and just a few minutes from District 1 via Ba Son Bridge"
        ],
        "audioScript": [
          "Welcome to Saigon Riverfront Park on the Thu Thiem side, Thu Duc City - a green public space and the most popular sunset viewing coordinates today.",
          "From the riverside lawns and colorful flower fields, you can take souvenir photos embracing the panoramic view of District 1 and the sparkling Ba Son Cable-stayed Bridge reflecting on the water.",
          "According to Wikipedia encyclopedia: Thu Thiem is a place in Ho Chi Minh City, Vietnam, located along the banks of the Saigon River, opposite Saigon ward. Thu Thiem area is located entirely within the territory of An Khanh ward today and is the center of Thu Thiem new urban area. Before July 1, 2025, Thu Thiem was a ward of Thu Duc city. The ward has an area of ​​3.31 km², population in 2021 is 2,176 people, population density reaches 657 people/km²."
        ]
      },
      "fr": {
        "name": "Parc des Berges de Saïgon (Thu Thiem)",
        "shortSummary": "Des coordonnées d'enregistrement au bord de la rivière émergentes extrêmement attrayantes sur la rive est de la rivière Saigon, possédant des champs de fleurs saisonnières, des ponts piétonniers au bord de la rivière et une vue d'un million de dollars sur les toits du district 1 - Bitexco.",
        "historicalEra": "Inauguré fin 2023",
        "openingHours": "24h/24",
        "architecturalHighlights": [
          "La plus belle vue panoramique sur les toits du District 1, la tour Bitexco et le pont Ba Son à Hô Chi Minh-Ville",
          "Champs lumineux de tournesols et de fleurs de saison, quartier des anciennes maisons d'An Khanh et scène événementielle au bord de la rivière",
          "Connexion directe à la ligne de bus fluvial Saigon Waterbus et à quelques minutes du District 1 via le pont Ba Son"
        ],
        "audioScript": [
          "Bienvenue au parc riverain de Saigon du côté de Thu Thiem, dans la ville de Thu Duc - un espace public vert et les coordonnées d'observation du coucher de soleil les plus populaires aujourd'hui.",
          "Depuis les pelouses au bord de la rivière et les champs de fleurs colorés, vous pouvez prendre des photos souvenirs en admirant la vue panoramique sur le district 1 et l'étincelant pont à haubans de Ba Son se reflétant sur l'eau.",
          "Selon l'encyclopédie Wikipédia : Thu Thiem est un endroit à Hô Chi Minh-Ville, au Vietnam, situé le long des rives de la rivière Saigon, en face du quartier de Saigon. La zone de Thu Thiem est aujourd'hui entièrement située sur le territoire du quartier An Khanh et constitue le centre de la nouvelle zone urbaine de Thu Thiem. Avant le 1er juillet 2025, Thu Thiem était un quartier de la ville de Thu Duc. Le quartier a une superficie de 3,31 km², la population en 2021 est de 2 176 personnes, la densité de population atteint 657 personnes/km²."
        ]
      },
      "zh": {
        "name": "西贡河畔公园（守添东岸）",
        "shortSummary": "西贡河东岸极具吸引力的新兴河滨打卡坐标，拥有季节性花田、河滨人行天桥和价值百万的1区天际线景观——Bitexco。",
        "historicalEra": "2023年底开放",
        "openingHours": "全天开放（16:30 – 21:30最佳）",
        "architecturalHighlights": [
          "胡志明市第一区天际线、Bitexco 塔和巴山桥最美全景",
          "鲜艳的向日葵和季节性花田、安庆古屋区和河边活动舞台",
          "直接连接西贡水上巴士 (Saigon Waterbus) 河流巴士线，经巴山桥 (Ba Son Bridge) 距第一区仅几分钟路程"
        ],
        "audioScript": [
          "欢迎来到守德市守添一侧的西贡河滨公园 - 一个绿色的公共空间和当今最受欢迎的日落观赏坐标。",
          "在河边的草坪和色彩缤纷的花田上，您可以拍摄第一区全景和波光粼粼的巴山斜拉桥倒映在水面上的纪念照片。",
          "据维基百科百科介绍：守添是越南胡志明市的一个地方，位于西贡河沿岸，西贡区对面。守添地区完全位于今天的安庆区范围内，是守添新城区的中心。 2025 年 7 月 1 日之前，守添是守德市的一个行政区。该区面积3.31平方公里，2021年人口为2176人，人口密度达到657人/平方公里。"
        ]
      },
      "ja": {
        "name": "サイゴン川リバーサイドパーク（トゥーティエム）",
        "shortSummary": "サイゴン川の東岸にある非常に魅力的な新興の川沿いのチェックイン コーディネートで、季節の花畑、川沿いの歩道橋、そして 1 区のスカイラインの 100 万ドルの眺望を備えています。",
        "historicalEra": "2023年末オープン",
        "openingHours": "24時間開放（16:30 – 21:30がおすすめ）",
        "architecturalHighlights": [
          "ホーチミン市の 1 区のスカイライン、ビテクスコ タワー、バソン橋の最も美しいパノラマ ビュー",
          "鮮やかなひまわりと季節の花畑、アンカイン古民家エリアと川沿いのイベントステージ",
          "サイゴン水上バスの河川バスラインに直結しており、1 区からはバソン橋経由でわずか数分です。"
        ],
        "audioScript": [
          "トゥドゥック市のトゥティエム側にあるサイゴン リバーフロント パークへようこそ。緑豊かな公共スペースであり、今日最も人気のある夕日鑑賞スポットです。",
          "川沿いの芝生や色とりどりの花畑からは、1 区のパノラマビューと水面に反射して輝くバソン斜張橋を眺めながら記念写真を撮ることができます。",
          "ウィキペディア百科事典によると、トゥ ティエムはベトナムのホーチミン市にある場所で、サイゴン区の反対側、サイゴン川のほとりに沿って位置しています。トゥ ティエム地区は現在、完全にアン カーン区の領土内に位置しており、トゥ ティエム新市街地の中心となっています。 2025 年 7 月 1 日以前、トゥ ティエムはトゥ ドゥック市の区でした。区の面積は3.31平方キロメートル、2021年の人口は2,176人、人口密度は657人/平方キロメートルに達します。"
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
        "shortSummary": "The Theravada Buddhist temple is famous globally for its splendid white-gold Gotama Cetiya Stupa reflecting on the blue lake, once honored by National Geographic as the Top most beautiful pagoda in the world.",
        "historicalEra": "Founded 1942 – Stupa 2013",
        "openingHours": "08:00 – 18:00 Daily",
        "architecturalHighlights": [
          "The 56m high Gotama Cetiya stupa is covered in pure white and has a brilliant gilded tip",
          "The turquoise semicircular lake in front of the tower creates a beautiful reflection effect",
          "Combining the quintessence of Indian - Thai Buddhist architecture with dragon motifs of the Nguyen Dynasty on the banks of the Dong Nai River"
        ],
        "audioScript": [
          "Welcome to Buu Long Ancestral Temple in Long Binh Ward, Thu Duc City - one of the temples with the most beautiful Buddhist architecture in the world as voted by National Geographic.",
          "Standing out among the 11-hectare peaceful forest campus on the Dong Nai River is the 56-meter-high Gotama Cetiya Stupa with its iridescent golden spire reflecting into the turquoise lake, creating a souvenir frame like a fairyland.",
          "According to Wikipedia encyclopedia: Buu Long Pagoda, officially called Buu Long Zen Monastery, is a pagoda located on a hill beside the Dong Nai River at 81 Nguyen Xien Street, Long Binh Ward, Ho Chi Minh City. The pagoda belongs to the Theravada Buddhist sect, founded by layman Vo Ha Thuat in 1942. In 2007, the pagoda was invested in construction and restoration. Buu Long Pagoda has the architectural features of pagodas in Thailand and India combined with the architectural features of pagodas of the Nguyen Dynasty."
        ]
      },
      "fr": {
        "name": "Pagode Buu Long (Stupa Gotama Cetiya · Thu Duc)",
        "shortSummary": "Le temple bouddhiste Theravada est célèbre dans le monde entier pour son splendide stupa Gotama Cetiya en or blanc se reflétant sur le lac bleu, autrefois honoré par le National Geographic comme la plus belle pagode du monde.",
        "historicalEra": "1942 – 2013",
        "openingHours": "08h00 – 18h00",
        "architecturalHighlights": [
          "Le stupa Gotama Cetiya de 56 m de haut est recouvert de blanc pur et possède une pointe dorée brillante.",
          "Le lac semi-circulaire turquoise devant la tour crée un bel effet de reflet",
          "Combinant la quintessence de l'architecture bouddhiste indo-thaïlandaise avec les motifs de dragons de la dynastie Nguyen sur les rives de la rivière Dong Nai"
        ],
        "audioScript": [
          "Bienvenue au temple ancestral de Buu Long dans le quartier de Long Binh, dans la ville de Thu Duc - l'un des temples dotés de la plus belle architecture bouddhiste au monde, selon le National Geographic.",
          "Parmi le campus forestier paisible de 11 hectares sur la rivière Dong Nai se détache le stupa Gotama Cetiya, haut de 56 mètres, avec sa flèche dorée irisée se reflétant dans le lac turquoise, créant un cadre souvenir comme un pays des fées.",
          "Selon l'encyclopédie Wikipédia : La pagode Buu Long, officiellement appelée monastère Buu Long Zen, est une pagode située sur une colline au bord de la rivière Dong Nai, au 81, rue Nguyen Xien, quartier Long Binh, Hô Chi Minh-Ville. La pagode appartient à la secte bouddhiste Theravada, fondée par le laïc Vo Ha Thuat en 1942. En 2007, la pagode a été investie dans la construction et la restauration. La pagode Buu Long présente les caractéristiques architecturales des pagodes de Thaïlande et d'Inde combinées aux caractéristiques architecturales des pagodes de la dynastie Nguyen."
        ]
      },
      "zh": {
        "name": "宝龙寺（守德市金色佛塔）",
        "shortSummary": "上座部佛教寺庙因其倒映在蓝色湖水中的华丽白金乔达摩舍提亚佛塔而闻名于世，曾被国家地理杂志评为世界上最美丽的佛塔。",
        "historicalEra": "1942年建寺 – 2013年大塔落成",
        "openingHours": "08:00 – 18:00",
        "architecturalHighlights": [
          "高56m的Gotama Cetiya佛塔通体纯白，顶端镀金辉煌",
          "塔前碧绿的半圆形湖泊营造出美丽的倒影效果",
          "将印度-泰国佛教建筑的精髓与同奈河畔阮朝的龙图案相结合"
        ],
        "audioScript": [
          "欢迎来到守德市隆平区的布隆祖庙 - 被国家地理杂志评选为世界上最美丽佛教建筑的寺庙之一。",
          "在同奈河畔占地 11 公顷的宁静森林校园中，高 56 米的乔达玛·舍提亚佛塔 (Gotama Cetiya Stupa) 格外引人注目，其彩虹色的金色塔尖倒映在碧绿的湖水里，营造出如仙境般的纪念框。",
          "根据维基百科百科：布龙宝塔，正式名称为布龙禅寺，是一座位于胡志明市龙平区阮贤街81号同奈河畔山上的宝塔。该塔属于上座部佛教宗派，由居士武河图于1942年创立。2007年，该塔投资兴建和修复。布龙塔具有泰国、印度佛塔的建筑特色，并结合了阮朝佛塔的建筑特色。"
        ]
      },
      "ja": {
        "name": "ブーロン寺（黄金仏塔・トゥードゥック市）",
        "shortSummary": "上座部仏教寺院は、青い湖に映る見事な白金のゴータマ セティヤ ストゥーパで世界的に有名で、かつてはナショナル ジオグラフィックによって世界で最も美しい仏塔のトップに選ばれました。",
        "historicalEra": "1942年創建 – 2013年仏塔完成",
        "openingHours": "08:00 – 18:00",
        "architecturalHighlights": [
          "高さ 56 メートルのゴータマ セティヤ仏塔は純白で覆われ、先端は金色に輝いています。",
          "タワーの前にあるターコイズブルーの半円形の湖が美しい反射効果を生み出します",
          "インドとタイの仏教建築の真髄と、ドンナイ川のほとりにあるグエン王朝のドラゴンのモチーフを組み合わせた建物"
        ],
        "audioScript": [
          "トゥドゥック市ロンビン区にあるブーロン祖寺院へようこそ。ナショナル ジオグラフィックの投票で世界で最も美しい仏教建築を持つ寺院の 1 つです。",
          "ドンナイ川沿いの 11 ヘクタールの静かな森のキャンパスの中でひときわ目立つのは、高さ 56 メートルのゴータマ セティヤ ストゥーパです。虹色に輝く金色の尖塔がターコイズブルーの湖に映り、おとぎの国のようなお土産のフレームを作り出しています。",
          "ウィキペディア百科事典によると: 正式にはブーロン禅寺と呼ばれるブーロン塔は、ホーチミン市ロンビン区グエンシエン通り81番地にあるドンナイ川のほとりの丘の上にある塔です。この塔は、1942 年に信徒のボー ハ トゥアトによって設立された上座部仏教宗派に属し、2007 年に建設と修復に投資されました。ブウ ロン パゴダは、タイとインドのパゴダの建築的特徴と、グエン王朝のパゴダの建築的特徴を組み合わせたものです。"
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
        "shortSummary": "The peaceful garden cultural space of nearly 2 hectares was founded by designer Si Hoang, honoring the 300-year journey of Vietnamese Ao Dai between ancient beam houses, lotus ponds and wooden bridges.",
        "historicalEra": "Opened in 2014",
        "openingHours": "08:30 – 17:30 Daily",
        "architecturalHighlights": [
          "The ancient Quang Nam wooden house area next to the lotus pond, bamboo bridge and fruit garden is extremely poetic",
          "More than 300 sets of ao dai from the 17th century to modern times and memorabilia of famous female politicians and artists",
          "Traditional ao dai rental service for tourists to take souvenir photos right on the ancient campus"
        ],
        "audioScript": [
          "Welcome to the Vietnamese Ao Dai Museum in Long Phuoc Ward, Thu Duc City - a peaceful cultural oasis with ancient wooden houses and fragrant lotus ponds.",
          "Here, you will explore the more than 300-year evolutionary journey of the Vietnamese ao dai from Giao Lanh, Five-bodied, to modern Ao Dai, and can also wear the Ao Dai to save the images imbued with the national soul.",
          "According to Wikipedia encyclopedia: Ao Dai is a Vietnamese costume mainly for women, appearing in the 1930s when Le Mur Cat Tuong innovated in a Westernized direction from the Five-body Ao Dai. The characteristics of this outfit are short sleeves, a tight shape, two straight flaps in the front, back and sides. Designers do not apply traditional patterns or traditional jewelry accessories to the ao dai."
        ]
      },
      "fr": {
        "name": "Musée de l’Ao Dai (Thu Duc)",
        "shortSummary": "Ce jardin et espace culturel paisible de près de 2 hectares a été fondé par le designer Si Hoang, honorant le voyage de 300 ans de l'Ao Dai vietnamien entre d'anciennes maisons à poutres, des étangs de lotus et des ponts en bois.",
        "historicalEra": "2014",
        "openingHours": "08h30 – 17h30",
        "architecturalHighlights": [
          "L'ancienne maison en bois de Quang Nam, à côté de l'étang de lotus, du pont de bambou et du jardin fruitier, est extrêmement poétique.",
          "Plus de 300 ensembles d'ao dai du XVIIe siècle aux temps modernes et des souvenirs de femmes politiques et artistes célèbres",
          "Service de location d'ao dai traditionnel permettant aux touristes de prendre des photos souvenirs directement sur l'ancien campus"
        ],
        "audioScript": [
          "Bienvenue au musée vietnamien Ao Dai dans le quartier de Long Phuoc, ville de Thu Duc - une oasis culturelle paisible avec d'anciennes maisons en bois et des étangs de lotus parfumés.",
          "Ici, vous explorerez le voyage évolutif de plus de 300 ans de l'ao dai vietnamien, de Giao Lanh, à cinq corps, à l'Ao Dai moderne, et pourrez également porter l'Ao Dai pour sauvegarder les images imprégnées de l'âme nationale.",
          "Selon l'encyclopédie Wikipédia : L'Ao Dai est un costume vietnamien principalement destiné aux femmes, apparu dans les années 1930 lorsque Le Mur Cat Tuong a innové dans une direction occidentalisée à partir de l'Ao Dai à cinq corps. Les caractéristiques de cette tenue sont des manches courtes, une forme ajustée, deux rabats droits devant, dos et côtés. Les créateurs n'appliquent pas de motifs traditionnels ni d'accessoires de bijoux traditionnels à l'ao dai."
        ]
      },
      "zh": {
        "name": "越南奥黛博物馆（守德市）",
        "shortSummary": "这个占地近2公顷的宁静花园文化空间由设计师Si Hoang创建，纪念越南奥黛在古梁屋、荷塘和木桥之间300年的历程。",
        "historicalEra": "2014年开馆",
        "openingHours": "08:30 – 17:30",
        "architecturalHighlights": [
          "荷塘、竹桥、果园旁的古广南木屋区，极具诗意",
          "300多套从17世纪到现代的长袍和著名女政治家、艺术家的纪念品",
          "传统长袄租赁服务，供游客在古老的校园里拍摄纪念照片"
        ],
        "audioScript": [
          "欢迎来到位于守德市隆福区的越南奥黛博物馆——这是一片宁静的文化绿洲，拥有古老的木屋和芬芳的荷塘。",
          "在这里，您将探索越南奥黛从五体到现代奥黛300多年的演变历程，也可以穿着奥黛来保存充满民族灵魂的形象。",
          "根据维基百科百科：奥黛是一种主要为女性设计的越南服装，出现于20世纪30年代，当时Le Mur Cat Tuong从五体奥黛向西化方向创新。这件衣服的特点是短袖、紧身版型、前、后、侧两直襟。设计师不会将传统图案或传统珠宝配饰应用到奥黛上。"
        ]
      },
      "ja": {
        "name": "アオザイ博物館（トゥードゥック市）",
        "shortSummary": "約 2 ヘクタールの静かな庭園文化空間は、古代の梁の家、蓮の池、木の橋の間を行き来するベトナムのアオザイの 300 年にわたる旅を讃え、デザイナーのシ・ホアンによって設立されました。",
        "historicalEra": "2014年開館",
        "openingHours": "08:30 – 17:30",
        "architecturalHighlights": [
          "蓮の池、竹の橋、果樹園に隣接するクアンナムの古代木造住宅エリアは、非常に詩的です",
          "17 世紀から現代までの 300 セット以上のアオザイと、有名な女性政治家や芸術家の記念品",
          "観光客が古代のキャンパスで記念写真を撮影できる伝統的なアオザイのレンタル サービス"
        ],
        "audioScript": [
          "トゥドゥック市ロン フック区にあるベトナム アオザイ博物館へようこそ。古代の木造家屋と香り豊かな蓮の池がある静かな文化のオアシスです。",
          "ここでは、五体体型のジャオランから現代のアオザイまで、ベトナムのアオザイの 300 年以上にわたる進化の旅を探索し、アオザイを着て国民の魂が込められたイメージを保存することもできます。",
          "ウィキペディア百科事典によると、アオザイは主に女性のためのベトナムの衣装で、ル・ムール・キャット・トゥオンが五体式アオザイを西洋化した方向で革新した1930年代に登場しました。この衣装の特徴は、半袖、タイトな形、前後とサイドにある 2 つのまっすぐなフラップです。デザイナーは、伝統的な模様や伝統的なジュエリー アクセサリーをアオザイに適用しません。"
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
        "shortSummary": "The first private art museum in Ho Chi Minh City is located along the Thao Dien River, preserving more than 1,500 masterpieces of Vietnamese painting from Indochina Fine Arts (Tri – Lan – Van – Can quartet) to contemporary.",
        "historicalEra": "Opened in 2023",
        "openingHours": "09:00 – 16:30 (Tue – Sun)",
        "architecturalHighlights": [
          "Luxurious 3-storey exhibition space, international museum-standard lighting in Thao Dien art neighborhood",
          "Gathering rare works of the four famous Indochina painters Nguyen Gia Tri, To Ngoc Van, Nguyen Tuong Lan, Tran Van Can",
          "Elegant garden villa combined with extremely sophisticated art coffee area for art lovers"
        ],
        "audioScript": [
          "Welcome to Quang San Art Museum in Thao Dien Ward, Thu Duc City - the first private fine arts museum in Ho Chi Minh City.",
          "The collection of more than 1,500 works here takes viewers along the flow of Vietnamese fine art for nearly a century, from classic Indochina lacquer and silk paintings to the breath of contemporary painting.",
          "According to Wikipedia encyclopedia: An Khanh Ward is located in the center of Ho Chi Minh City. In the future, the area of ​​Thu Thiem New Urban Area, Saigon Ward and Ben Thanh Ward will become Ho Chi Minh City Financial Center. The West borders Saigon wards and Thanh My Tay wards with the boundary being the Saigon River"
        ]
      },
      "fr": {
        "name": "Musée d’Art Quang San (Thao Dien)",
        "shortSummary": "Le premier musée d'art privé d'Hô Chi Minh-Ville est situé le long de la rivière Thao Dien, préservant plus de 1 500 chefs-d'œuvre de la peinture vietnamienne, des Beaux-Arts d'Indochine (quatuor Tri – Lan – Van – Can) jusqu'à l'art contemporain.",
        "historicalEra": "2023",
        "openingHours": "09h00 – 16h30 (Mar – Dim)",
        "architecturalHighlights": [
          "Espace d'exposition luxueux sur 3 étages, éclairage conforme aux normes internationales des musées dans le quartier artistique de Thao Dien",
          "Rassemblant des œuvres rares des quatre célèbres peintres indochinois Nguyen Gia Tri, To Ngoc Van, Nguyen Tuong Lan, Tran Van Can",
          "Villa avec jardin élégante combinée à un espace café artistique extrêmement sophistiqué pour les amateurs d'art"
        ],
        "audioScript": [
          "Bienvenue au musée d'art de Quang San dans le quartier Thao Dien, ville de Thu Duc - le premier musée privé des beaux-arts de Hô Chi Minh-Ville.",
          "La collection de plus de 1 500 œuvres emmène les spectateurs à travers le flux des beaux-arts vietnamiens depuis près d'un siècle, des peintures classiques sur laque et soie d'Indochine jusqu'au souffle de la peinture contemporaine.",
          "Selon l'encyclopédie Wikipédia : Le quartier An Khanh est situé au centre d'Hô Chi Minh-Ville. À l'avenir, la zone de la nouvelle zone urbaine de Thu Thiem, les quartiers de Saigon et Ben Thanh deviendront le centre financier de Hô Chi Minh-Ville. L'ouest borde les quartiers de Saigon et de Thanh My Tay, la frontière étant la rivière Saigon."
        ]
      },
      "zh": {
        "name": "光山艺术博物馆（草田 · 守德市）",
        "shortSummary": "胡志明市第一家私人艺术博物馆位于Thao Dien河沿岸，保存了从印度支那美术（Tri-Lan-Van-Can四重奏）到当代的1,500多件越南绘画杰作。",
        "historicalEra": "2023年开馆",
        "openingHours": "09:00 – 16:30（周二至周日）",
        "architecturalHighlights": [
          "Thao Dien 艺术街区的豪华 3 层展览空间、国际博物馆标准照明",
          "汇集印度支那四位著名画家阮嘉智、杜玉文、阮祥兰、陈文灿的珍稀作品",
          "优雅的花园别墅结合极其精致的艺术咖啡区，适合艺术爱好者"
        ],
        "audioScript": [
          "欢迎来到位于守德市草甸区的广山美术馆 - 胡志明市第一家私人美术馆。",
          "这里收藏的1500多件作品，带观众了解越南美术近一个世纪的脉络，从经典的印度支那漆器和丝绸画到当代绘画的气息。",
          "据维基百科百科介绍：安庆区位于胡志明市市中心。未来，守添新城区、西贡区和滨城区地区将成为胡志明市金融中心。西部与西贡区和清美西区接壤，以西贡河为界"
        ]
      },
      "ja": {
        "name": "クアンサン美術館（タオディエン）",
        "shortSummary": "ホーチミン市初の私立美術館はタオディエン川沿いにあり、インドシナ美術（トリ・ラン・ヴァン・カンカルテット）から現代までのベトナム絵画の傑作1,500点以上が保存されています。",
        "historicalEra": "2023年開館",
        "openingHours": "09:00 – 16:30（火〜日）",
        "architecturalHighlights": [
          "タオディエン芸術地区にある豪華な 3 階建ての展示スペース、国際美術館標準の照明",
          "インドシナの著名な4人の画家、グエン・ギア・トリ、ト・ゴック・ヴァン、グエン・トゥオン・ラン、トラン・ヴァン・カンの貴重な作品を集めました。",
          "芸術愛好家のための非常に洗練されたアートコーヒーエリアと組み合わせたエレガントなガーデンヴィラ"
        ],
        "audioScript": [
          "トゥドゥック市タオディエン区にあるクアンサン美術館へようこそ。ホーチミン市初の私立美術館です。",
          "ここにある 1,500 点以上の作品コレクションは、インドシナの古典的な漆や絹の絵画から現代絵画の息吹まで、ほぼ 1 世紀にわたるベトナム美術の流れをたどることができます。",
          "ウィキペディア百科事典によると、アン カーン区はホーチミン市の中心部に位置します。将来的には、トゥティエム新市街地、サイゴン区、ベンタイン区のエリアがホーチミン市金融センターとなる予定です。西側はサイゴン川を境にサイゴン区とタンミータイ区に隣接しています。"
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
        "shortSummary": "The Northern Buddhist monastery is famous for its red wood architecture - elegant white walls, curved tile roofs, hexagonal lanterns and a quiet Zen garden like the ancient capital of Kyoto.",
        "historicalEra": "Founded 1905 – Restored 2016",
        "openingHours": "05:00 – 20:00 Daily",
        "architecturalHighlights": [
          "Minimalist Asian architecture with 3 main colors: brown wood, deep red and extremely elegant lime white",
          "Rows of hexagonal paper lanterns, wind chimes and stone steps create a Japanese-like photo angle",
          "The study space is pure, does not burn votive papers, and is green and shady with trees"
        ],
        "audioScript": [
          "Welcome to Khanh An Monastery in An Phu Dong ward, District 12 - a place affectionately called \"Little Japan\" by tourists in the heart of Ho Chi Minh City.",
          "Built in 1905 and restored in a minimalist Asian Zen monastery style, Khanh An Monastery offers an absolutely peaceful space with red wooden tiled roofs and rows of delicate white lanterns.",
          "According to Wikipedia encyclopedia: Khanh An Monastery is a majestic temple located in District 12, Ho Chi Minh City, this place is called a monastery because it wants to minimize the color of belief and religion. Khanh An Monastery is a place where retreats, meditation courses, and mindfulness meditation are regularly organized and receives the attention of a large number of monks and Buddhists. This is a place that attracts people to worship and attend pagodas. Many young people come to attend short retreats and listen to sermons."
        ]
      },
      "fr": {
        "name": "Monastère Khanh An (\"Petit Japon\" de Saïgon · 12e)",
        "shortSummary": "Le monastère bouddhiste du Nord est célèbre pour son architecture en bois rouge : d'élégants murs blancs, des toits de tuiles incurvés, des lanternes hexagonales et un jardin zen paisible à l'image de l'ancienne capitale de Kyoto.",
        "historicalEra": "1905 – 2016",
        "openingHours": "05h00 – 20h00",
        "architecturalHighlights": [
          "Architecture asiatique minimaliste avec 3 couleurs principales : bois marron, rouge profond et blanc lime extrêmement élégant",
          "Des rangées de lanternes en papier hexagonales, des carillons éoliens et des marches en pierre créent un angle photo de type japonais",
          "L'espace d'étude est pur, ne brûle pas de papiers votifs et est vert et ombragé avec des arbres."
        ],
        "audioScript": [
          "Bienvenue au monastère de Khanh An dans le quartier An Phu Dong, district 12 - un endroit affectueusement appelé \"Petit Japon\" par les touristes au cœur d'Hô Chi Minh-Ville.",
          "Construit en 1905 et restauré dans un style monastique zen asiatique minimaliste, le monastère de Khanh An offre un espace absolument paisible avec des toits de tuiles en bois rouges et des rangées de délicates lanternes blanches.",
          "Selon l'encyclopédie Wikipédia : Le monastère de Khanh An est un temple majestueux situé dans le district 12 de Hô Chi Minh-Ville. Cet endroit est appelé monastère car il veut minimiser la couleur de la croyance et de la religion. Le monastère de Khanh An est un lieu où des retraites, des cours de méditation et de méditation de pleine conscience sont régulièrement organisés et reçoit l'attention d'un grand nombre de moines et de bouddhistes. C'est un endroit qui attire les gens pour adorer et visiter les pagodes. De nombreux jeunes viennent assister à de courtes retraites et écouter des sermons."
        ]
      },
      "zh": {
        "name": "庆安禅院（西贡“小京都” · 第十二郡）",
        "shortSummary": "北传佛教寺院以其红木建筑而闻名——优雅的白墙、弧形瓦顶、六角灯笼和仿古都京都般的静谧禅宗花园。",
        "historicalEra": "1905年建寺 – 2016年重修",
        "openingHours": "05:00 – 20:00",
        "architecturalHighlights": [
          "极简亚洲建筑，3种主色调：棕木色、深红色和极其优雅的石灰白",
          "一排排六角纸灯笼、风铃、石阶营造出日式拍照角度",
          "书房空间纯净，不焚烧许愿纸，绿树成荫"
        ],
        "audioScript": [
          "欢迎来到位于第十二区安富东区的庆安寺——位于胡志明市中心的游客亲切地称为“小日本”的地方。",
          "庆安寺 (Khanh An Monastery) 建于 1905 年，采用简约的亚洲禅宗寺院风格进行修复，拥有红色木瓦屋顶和一排精致的白色灯笼，营造出绝对宁静的空间。",
          "据维基百科百科介绍：庆安寺是一座雄伟的寺庙，位于胡志明市第12区，这个地方之所以被称为寺院，是因为它想尽量减少信仰和宗教的色彩。庆安寺是定期举办静修、冥想课程和正念冥想的地方，受到大量僧侣和佛教徒的关注。这里是吸引人们朝拜、参拜佛塔的地方。许多年轻人前来参加短暂的静修和听布道。"
        ]
      },
      "ja": {
        "name": "カインアン修道院（サイゴンの「リトル京都」・12区）",
        "shortSummary": "北方仏教寺院は、優雅な白壁、湾曲した瓦屋根、六角形の灯籠、古都京都のような静かな禅庭など、赤い木の建築で有名です。",
        "historicalEra": "1905年創建 – 2016年改修",
        "openingHours": "05:00 – 20:00",
        "architecturalHighlights": [
          "茶色の木、深い赤、非常にエレガントなライムホワイトの 3 つのメインカラーを備えたミニマリストのアジア建築",
          "六角形の提灯、風鈴、石段が並び、日本らしい写真を撮ることができます",
          "学習空間は清らかで、絵馬は燃やされず、緑と木陰が多いです。"
        ],
        "audioScript": [
          "ホーチミン市の中心部にある観光客から愛情を込めて「小日本」と呼ばれる場所、第 12 区アン フー ドン区にあるカン アン僧院へようこそ。",
          "1905 年に建てられ、ミニマルなアジアの禅僧院スタイルで復元されたカンアン僧院は、赤い木の瓦屋根と繊細な白い提灯が並び、とても静かな空間を提供しています。",
          "ウィキペディア百科事典によると、カンアン僧院はホーチミン市12区にある荘厳な寺院で、この場所が僧院と呼ばれているのは、信仰や宗教の色彩を最小限に抑えたいためです。カーンアン僧院は、リトリート、瞑想コース、マインドフルネス瞑想が定期的に開催され、多くの僧侶や仏教徒の注目を集めている場所です。ここは、仏塔を参拝したり参拝したりする人々が集まる場所です。多くの若者が短いリトリートに参加し、説教を聞きに来ます。"
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
