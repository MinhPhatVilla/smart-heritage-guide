import { HeritageSite } from '../types/heritage';

/**
 * 14 điểm du lịch biểu tượng, tọa độ check-in, bãi biển nổi tiếng & di tích ven biển
 * tại Vũng Tàu, Phú Mỹ, Châu Đức, Long Hải – Phước Hải và Xuyên Mộc (TP. Hồ Chí Minh mở rộng).
 * Bao gồm: Tháp Tam Thắng (khánh thành 2025), Đồi Con Heo, Bãi Sau, Bãi Trước, Bãi Dứa,
 * Hẻm 107 Trần Phú, Đền Thánh Đức Mẹ Bãi Dâu, Chợ Xóm Lưới, Vũng Tàu Marina, Hồ Đá Xanh,
 * Đồi Cừu Suối Nghệ, Đèo Nước Ngọt – Phước Hải, Biển Hồ Cốc và Di tích Bến Lộc An.
 */
export const HCM_VUNG_TAU_TOURISM_SITES: HeritageSite[] = [
  // =========================================================================
  // 1. THÁP TAM THẮNG & QUẢNG TRƯỜNG BÃI SAU (THÙY VÂN) — BIỂU TƯỢNG MỚI 2025
  // =========================================================================
  {
    id: 'thap-tam-thang-quang-truong-bai-sau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3418,
    lng: 107.0956,
    category: 'monument',
    rating: 4.9,
    reviewCount: 14800,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Quảng trường Tam Thắng, giao lộ Thùy Vân – Lê Hồng Phong, Bãi Sau, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Tháp Tam Thắng & Quảng trường Bãi Sau (Thùy Vân)',
        shortSummary:
          'Biểu tượng kiến trúc biển mới của Vũng Tàu khánh thành dịp Quốc khánh 02/09/2025 do KTS Ý Oliviero Godi thiết kế: 143 trụ gốm mosaic cao dần từ 4,55m đến 34,25m gợi hình 3 mũi thuyền vươn khơi của ba làng cổ Thắng Nhất – Thắng Nhì – Thắng Tam.',
        historicalEra: 'Khánh thành 02/09/2025 (Diện tích quảng trường 1,67 ha)',
        openingHours: 'Mở cửa 24/7 (Nhạc nước & đèn LED nghệ thuật buổi tối)',
        architecturalHighlights: [
          '143 trụ bê tông cốt thép ốp gốm mosaic cao từ 4,55m đến 34,25m xếp lớp vươn cao dần hướng ra Biển Đông',
          'Hình khối 3 mũi thuyền tôn vinh cội nguồn 3 ngôi làng lập ấp cổ Thắng Nhất, Thắng Nhì và Thắng Tam',
          'Quảng trường rộng 1,67 ha tích hợp Mũi Vọng Cảnh hướng biển, sân khấu nhạc nước và trình diễn ánh sáng đêm',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Tháp Tam Thắng tại trung tâm Quảng trường Bãi Sau, ngay giao lộ đường Thùy Vân và Lê Hồng Phong — biểu tượng kiến trúc mới rực rỡ của thành phố biển Vũng Tàu.',
          'Chính thức khánh thành ngày 2 tháng 9 năm 2025 theo thiết kế của kiến trúc sư người Ý Oliviero Godi, công trình gây ấn tượng mạnh với 143 trụ ốp gốm mosaic vươn cao dần từ 4,55 mét tới 34,25 mét như ba mũi thuyền mạnh mẽ rẽ sóng ra khơi.',
          'Ý tưởng kiến trúc giàu chiều sâu này gợi nhắc lịch sử ba ngôi làng cổ Thắng Nhất, Thắng Nhì và Thắng Tam đã khai phá nên vùng đất Vũng Tàu xưa. Về đêm, quảng trường trở thành điểm hẹn lung linh với nhạc nước nghệ thuật và hệ thống đèn chiếu sáng đổi màu ngoạn mục.',
        ],
      },
      en: {
        name: 'Tam Thang Tower & Back Beach Square (Thuy Van)',
        shortSummary:
          'Vung Tau’s newest coastal landmark inaugurated on September 2, 2025 by Italian architect Oliviero Godi: 143 mosaic-clad pillars rising from 4.55m to 34.25m like three ocean-bound ship prows honoring Vung Tau’s three founding villages.',
        historicalEra: 'Inaugurated September 2, 2025',
        openingHours: 'Open 24/7 (Evening light & musical fountain shows)',
        architecturalHighlights: [
          '143 stepped mosaic-tiled columns soaring up to 34.25 meters facing the East Sea',
          'Three prow-shaped silhouettes paying tribute to the historic villages of Thang Nhat, Thang Nhi, and Thang Tam',
          '1.67-hectare seafront plaza with panoramic viewing deck, illuminated night fountains, and coastal promenade',
        ],
        audioScript: [
          'Welcome to Tam Thang Tower at the heart of Back Beach Square on Thuy Van Boulevard, inaugurated on September 2, 2025.',
          'Designed by Italian architect Oliviero Godi, its 143 soaring mosaic pillars symbolize three ship prows honoring Vung Tau’s three historic founding villages, glowing with musical fountains every evening.',
        ],
      },
      fr: {
        name: 'Tour Tam Thang et place de Back Beach (Thuy Van)',
        shortSummary:
          'Nouveau monument emblématique de Vung Tau inauguré le 2 septembre 2025 : 143 colonnes en mosaïque atteignant 34,25 m en forme de trois proues face à la mer.',
        historicalEra: 'Inaugurée le 2 septembre 2025',
        openingHours: 'Ouvert 24h/24',
        architecturalHighlights: [
          '143 colonnes en mosaïque culminant à 34,25 m face à l’océan',
          'Hommage aux trois villages fondateurs Thang Nhat, Thang Nhi et Thang Tam',
        ],
        audioScript: [
          'Bienvenue à la tour Tam Thang sur le front de mer de Back Beach, symbole architectural contemporain de Vung Tau.',
        ],
      },
      zh: {
        name: '三胜塔与后滩广场（垂云海滨新地标）',
        shortSummary:
          '2025年9月2日落成的头顿全新海滨地标，由意大利建筑师设计，143根马赛克立柱层层升高至34.25米，宛如三艘乘风破浪的船艏。',
        historicalEra: '2025年9月2日落成',
        openingHours: '全天开放（夜间灯光与音乐喷泉）',
        architecturalHighlights: [
          '143根渐进式马赛克立柱，最高达34.25米面向大海',
          '致敬头顿三大古村“胜一、胜二、胜三”的历史渊源',
        ],
        audioScript: [
          '欢迎来到头顿后滩新地标三胜塔广场，143根面向大海的艺术立柱在夜色与音乐喷泉映衬下格外迷人。',
        ],
      },
      ja: {
        name: 'タムタン塔＆バックビーチ広場（2025年新ランドマーク）',
        shortSummary:
          '2025年9月2日開業のブンタウ最新シンボル。イタリア人建築家設計による高さ最大34.25mの143本のモザイク柱が海へ伸びる壮麗な広場です。',
        historicalEra: '2025年9月2日開業',
        openingHours: '24時間開放（夜間ライトアップ＆噴水ショー）',
        architecturalHighlights: [
          '海へ向かって高さを増す143本のモザイク柱（最大34.25m）',
          'ブンタウ発祥の三古村に捧げられた船首モチーフと夜間音楽噴水',
        ],
        audioScript: [
          'ブンタウの新名所・タムタン塔広場へようこそ。143本の壮麗な柱と夜の噴水ショーが海辺を彩ります。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'ttt-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Quảng trường Tam Thắng & không gian biển Bãi Sau Vũng Tàu',
          en: 'Tam Thang Square overlooking Back Beach, Vung Tau',
          fr: 'Place Tam Thang sur la plage de Back Beach',
          zh: '头顿三胜塔与后滩广场',
          ja: 'ブンタウ・タムタン広場とバックビーチ',
        },
        yearOrSource: 'Quảng trường Tháp Tam Thắng – Bãi Sau (2025)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-ttt-1',
        name: 'Bánh Bông Lan Trứng Muối Gốc Cột Điện – Nguyễn Trường Tộ',
        cuisine: 'Đặc sản quà Vũng Tàu',
        specialtyDishes: ['Bánh bông lan trứng muối phô mai nướng than', 'Bánh bông lan chà bông gà cay', 'Sữa đậu nành nóng'],
        rating: 4.8,
        reviewCount: 8920,
        priceRange: '30.000đ – 75.000đ',
        lat: 10.3388,
        lng: 107.0812,
        address: '17B Nguyễn Trường Tộ, Phường 2, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '06:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 2. ĐỒI CON HEO (HẺM 222 PHAN CHU TRINH – BÃI SAU)
  // =========================================================================
  {
    id: 'doi-con-heo-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3315,
    lng: 107.0861,
    category: 'monument',
    rating: 4.8,
    reviewCount: 16200,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Hẻm 222 Phan Chu Trinh, Phường 2, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Đồi Con Heo (Tọa độ Ngắm Toàn cảnh Bãi Sau)',
        shortSummary:
          'Tọa độ check-in "triệu đô" nổi tiếng nhất giới trẻ tại Vũng Tàu trên triền Núi Nhỏ (cao 106m), từng là mỏ khai thác đá cổ — nổi bật với dải phân cách đỏ trắng, mỏm đá hướng biển, mùa hoa đỗ mai cuối năm và góc ngắm trọn cung đường Thùy Vân – Hòn Bà.',
        historicalEra: 'Điểm thắng cảnh thiên nhiên triền Núi Nhỏ (106m)',
        openingHours: '05:30 – 18:30 Hàng ngày (đẹp nhất 05:30–07:30 & 16:00–17:30)',
        architecturalHighlights: [
          'Tầm nhìn bao quát 360° xuống toàn bộ bãi cát cong Bãi Sau, Tháp Tam Thắng, Hòn Bà và cung đường Hạ Long',
          'Mỏm đá tự nhiên, sỏi đá hoang sơ và dải phân cách đỏ trắng đặc trưng phong cách cung đường phượt',
          'Sắc cỏ cháy vàng rực mùa khô và hoa đỗ mai nở trắng hồng lãng mạn từ tháng 11 đến tháng 1',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Đồi Con Heo — tọa độ ngắm bình minh và hoàng hôn được săn đón bậc nhất tại thành phố biển Vũng Tàu.',
          'Nằm trên sườn Núi Nhỏ ở độ cao hơn 100 mét với lối lên từ hẻm 222 Phan Chu Trinh, ngọn đồi vốn là bãi khai thác đá xưa nên sở hữu vẻ đẹp hoang sơ, phóng khoáng đầy chất điện ảnh.',
          'Từ mỏm đá trên đỉnh đồi, quý khách có thể thu trọn vào ống kính cung đường Thùy Vân uốn lượn, đảo Hòn Bà nổi giữa sóng biếc và toàn cảnh thành phố biển gió lộng.',
        ],
      },
      en: {
        name: 'Con Heo Hill (Back Beach Panoramic Overlook)',
        shortSummary:
          'Vung Tau’s most beloved hilltop photo spot (106m elevation off Alley 222 Phan Chu Trinh), an old stone quarry famed for its dramatic cliff ledges, red-and-white road barrier, seasonal blossoms, and sweeping Back Beach panoramas.',
        historicalEra: 'Natural Coastal Overlook (Nho Mountain)',
        openingHours: '05:30 – 18:30 Daily (Best at sunrise & sunset)',
        architecturalHighlights: [
          'Sweeping 360-degree vistas over Back Beach, Thuy Van Boulevard, Tam Thang Tower, and Hon Ba Islet',
          'Rugged rocky ledges and iconic red-and-white viewpoint barrier',
          'Golden dry-season grasslands and white-pink coastal blossoms from November to January',
        ],
        audioScript: [
          'Welcome to Con Heo Hill, a rugged 106-meter-high viewpoint above Back Beach celebrated for dramatic sunrise panoramas over Thuy Van Boulevard and Hon Ba Islet.',
        ],
      },
      fr: {
        name: 'Colline Con Heo (Panorama de Back Beach)',
        shortSummary:
          'Belvédère sauvage à 106 m d’altitude offrant une vue spectaculaire sur la baie de Back Beach, l’îlot Hon Ba et le boulevard Thuy Van.',
        historicalEra: 'Site naturel panoramique',
        openingHours: '05h30 – 18h30',
        architecturalHighlights: [
          'Panorama à 360° sur Back Beach et l’îlot Hon Ba',
          'Rochers sauvages très prisés au lever et au coucher du soleil',
        ],
        audioScript: [
          'Bienvenue sur la colline Con Heo, l’un des plus beaux points de vue panoramiques de Vung Tau.',
        ],
      },
      zh: {
        name: '猪山观景台（Đồi Con Heo · 头顿网红日落山丘）',
        shortSummary:
          '头顿年轻人最喜爱的海景打卡圣地，海拔106米，以粗犷岩坡、红白护栏及俯瞰后滩与婆岛的绝美全景著称。',
        historicalEra: '自然海岸观景山丘',
        openingHours: '05:30 – 18:30',
        architecturalHighlights: [
          '360度俯瞰垂云大道、后滩沙滩与婆岛的绝佳视角',
          '旱季金黄草坡与年末浪漫花季交织的电影感风光',
        ],
        audioScript: [
          '欢迎来到头顿网红打卡地猪山观景台，在这里可饱览后滩海岸线与迷人海景日出日落。',
        ],
      },
      ja: {
        name: 'コンヘオの丘（バックビーチ絶景展望スポット）',
        shortSummary:
          '標高106mの旧採石場跡に広がるブンタウ屈指の絶景フォトスポット。バックビーチやホンバー島を一望するダイナミックな眺望が人気です。',
        historicalEra: 'ニョー山自然展望スポット',
        openingHours: '05:30 – 18:30',
        architecturalHighlights: [
          'バックビーチとホンバー島を見渡す360度の絶景',
          '朝日と夕暮れ時に輝くワイルドな岩場と季節の花々',
        ],
        audioScript: [
          'ブンタウの人気絶景スポット、コンヘオの丘へようこそ。バックビーチを一望する圧巻の景色が広がります。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'dch-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Đồi Con Heo nhìn xuống biển Bãi Sau – Vũng Tàu',
          en: 'View from Con Heo Hill overlooking Back Beach, Vung Tau',
          fr: 'Vue depuis la colline Con Heo à Vung Tau',
          zh: '头顿猪山观景台俯瞰海岸',
          ja: 'ブンタウ・コンヘオの丘からの眺望',
        },
        yearOrSource: 'Tọa độ ngắm biển nổi tiếng Đồi Con Heo',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-dch-1',
        name: 'Bánh Khọt Cô Ba Vũng Tàu – Hoàng Hoa Thám',
        cuisine: 'Đặc sản Vũng Tàu',
        specialtyDishes: ['Bánh khọt tôm tươi & mực sữa', 'Bánh xèo hải sản', 'Gỏi cuốn tôm thịt'],
        rating: 4.7,
        reviewCount: 7450,
        priceRange: '55.000đ – 110.000đ',
        lat: 10.3382,
        lng: 107.0865,
        address: '01 Hoàng Hoa Thám, Phường 3, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '07:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 3. BÃI SAU (BÃI THÙY VÂN) & CÔNG VIÊN VEN BIỂN
  // =========================================================================
  {
    id: 'bai-sau-thuy-van-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3372,
    lng: 107.0928,
    category: 'ancient_town',
    rating: 4.8,
    reviewCount: 28400,
    ticketPrice: 'Miễn phí tắm biển & dạo công viên',
    address: 'Đường Thùy Vân, Phường 2 & Phường Thắng Tam, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Bãi Sau (Bãi Thùy Vân) & Công viên Ven biển',
        shortSummary:
          'Bãi biển nổi tiếng và nhộn nhịp nhất Vũng Tàu trải dài gần 8 km cát vàng mịn từ chân Núi Nhỏ đến Chí Linh, nổi bật với công viên ven biển Thùy Vân chỉnh trang hiện đại, sóng biển êm và bình minh rực rỡ trên Biển Đông.',
        historicalEra: 'Danh thắng biển biểu tượng của Vũng Tàu',
        openingHours: 'Mở cửa 24/7 (An toàn tắm biển 05:30 – 18:00)',
        architecturalHighlights: [
          'Bờ cát phẳng rộng dài gần 8 km chạy dọc đại lộ ven biển Thùy Vân thoáng đãng',
          'Công viên bờ biển Bãi Sau thiết kế mới với đường dạo bộ, cầu đi bộ ngắm biển và không gian sự kiện ngoài trời',
          'Kết nối liền mạch Tượng Chúa Kitô Vua, Đồi Con Heo, Tháp Tam Thắng và Chợ đêm hải sản Vũng Tàu',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Bãi Sau — hay Bãi Thùy Vân — bãi biển đẹp và sôi động bậc nhất thành phố Vũng Tàu.',
          'Trải dài gần 8 cây số cát vàng mịn màng với làn nước ôn hòa quanh năm, Bãi Sau ngày nay khoác lên diện mạo hiện đại với công viên ven biển không che chắn tầm nhìn và Quảng trường Tháp Tam Thắng ngay trung tâm.',
        ],
      },
      en: {
        name: 'Back Beach (Thuy Van Beach & Seafront Park)',
        shortSummary:
          'Vung Tau’s premier 8-kilometer stretch of fine golden sand along Thuy Van Boulevard, refreshed with an open seafront park, gentle swimming waves, and vibrant night markets.',
        historicalEra: 'Signature Coastal Beach of Vung Tau',
        openingHours: 'Open 24/7 (Lifeguarded swimming 05:30 – 18:00)',
        architecturalHighlights: [
          'Nearly 8 km of wide golden sand facing the sunrise over the East Sea',
          'Newly redesigned open beachfront promenade connecting Tam Thang Square and Nho Mountain',
        ],
        audioScript: [
          'Welcome to Back Beach along Thuy Van Boulevard, Vung Tau’s famous eight-kilometer golden coastline celebrated for sunrise swims and lively seafront promenades.',
        ],
      },
      fr: {
        name: 'Plage de Back Beach (Thuy Van)',
        shortSummary:
          'La plus célèbre plage de Vung Tau s’étendant sur 8 km de sable doré le long du boulevard Thuy Van.',
        historicalEra: 'Plage emblématique de Vung Tau',
        openingHours: 'Ouvert 24h/24',
        architecturalHighlights: [
          '8 km de sable fin et promenade maritime modernisée',
          'Connexion directe avec la tour Tam Thang et le marché de nuit',
        ],
        audioScript: [
          'Bienvenue à Back Beach, la grande plage dorée emblématique de Vung Tau.',
        ],
      },
      zh: {
        name: '头顿后滩（垂云海滩与海滨公园）',
        shortSummary:
          '头顿最具人气的8公里金色沙滩，沿垂云大道延展，拥有全新开放式海滨公园、平缓海浪与璀璨海上日出。',
        historicalEra: '头顿标志性海滨浴场',
        openingHours: '全天开放',
        architecturalHighlights: [
          '近8公里宽阔细腻的金色沙滩与日出海景',
          '串联三胜塔广场与头顿海鲜夜市的现代海滨长廊',
        ],
        audioScript: [
          '欢迎来到头顿最著名的后滩，沿着8公里金色海岸线感受清凉海风与活力夜生活。',
        ],
      },
      ja: {
        name: 'バックビーチ（トゥイヴァン海岸＆海浜公園）',
        shortSummary:
          '約8kmにわたる黄金色の砂浜が続くブンタウ最大の人気ビーチ。新しく整備された海浜公園と穏やかな波が魅力です。',
        historicalEra: 'ブンタウを代表する海岸リゾート',
        openingHours: '24時間開放',
        architecturalHighlights: [
          '全長約8kmの美しい砂浜と海辺の遊歩道',
          'タムタン広場やナイトマーケットへ直結する抜群のロケーション',
        ],
        audioScript: [
          'ブンタウを代表するバックビーチへようこそ。約8kmの砂浜と心地よい海風が迎えてくれます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'bsvt-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Bờ biển Bãi Sau – Thùy Vân trong nắng sớm',
          en: 'Morning sunlight along Back Beach (Thuy Van), Vung Tau',
          fr: 'Matin ensoleillé sur Back Beach à Vung Tau',
          zh: '晨光下的头顿后滩',
          ja: '朝の光に輝くバックビーチ',
        },
        yearOrSource: 'Bãi Sau – Thùy Vân, Vũng Tàu',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-bs-1',
        name: 'Chợ Đêm Hải Sản Vũng Tàu (Sau Imperial Plaza)',
        cuisine: 'Chợ đêm hải sản nướng',
        specialtyDishes: ['Tôm hùm nướng phô mai', 'Bạch tuộc nướng sa tế', 'Sò điệp nướng mỡ hành'],
        rating: 4.6,
        reviewCount: 6820,
        priceRange: '100.000đ – 350.000đ',
        lat: 10.3435,
        lng: 107.0942,
        address: 'Ngã ba Nguyễn Biểu – Đào Duy Từ, Phường Thắng Tam, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '16:30 – 00:00',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 4. CÔNG VIÊN BÃI TRƯỚC (VỊNH TẦM DƯƠNG) & BẾN TÀU CÁNH NGẦM
  // =========================================================================
  {
    id: 'cong-vien-bai-truoc-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3442,
    lng: 107.0736,
    category: 'ancient_town',
    rating: 4.8,
    reviewCount: 19450,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Đường Quang Trung – Hạ Long, Phường 1, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Công viên Bãi Trước (Vịnh Tầm Dương) & Bến tàu Cánh Ngầm',
        shortSummary:
          'Trái tim lãng mạn của trung tâm Vũng Tàu uốn cong hình vầng trăng khuyết giữa Núi Lớn và Núi Nhỏ, nổi tiếng với hàng dừa cổ thụ, vườn tượng điêu khắc ven biển, bến tàu cao tốc nối thẳng Bến Bạch Đằng (Q.1) và khung cảnh hoàng hôn đẹp bậc nhất miền Nam.',
        historicalEra: 'Không gian đô thị biển lịch sử từ cuối thế kỷ XIX',
        openingHours: 'Mở cửa 24/7 (Rực rỡ nhất lúc hoàng hôn 16:30 – 21:00)',
        architecturalHighlights: [
          'Vịnh biển Tầm Dương cong hình bán nguyệt yên ả, neo đậu hàng trăm thuyền đánh cá và tàu cao tốc',
          'Công viên cây xanh rộng lớn dọc đường Quang Trung với vườn tượng điêu khắc đá và quảng trường hóng gió',
          'Bến tàu cao tốc Hồ Mây – Cánh Ngầm kết nối đường thủy trực tiếp về trung tâm Quận 1 chỉ trong ~2 giờ',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Công viên Bãi Trước — còn được mệnh danh là Vịnh Tầm Dương thơ mộng nằm gọn giữa hai ngọn Núi Lớn và Núi Nhỏ.',
          'Đây là không gian dạo bộ, ngắm hoàng hôn và sinh hoạt cộng đồng lâu đời nhất của người dân Vũng Tàu, đồng thời là nơi cập bến tuyến tàu cao tốc kết nối trực tiếp từ Bến Bạch Đằng Quận 1.',
        ],
      },
      en: {
        name: 'Front Beach Park (Tam Duong Bay) & Hydrofoil Pier',
        shortSummary:
          'Vung Tau’s romantic crescent bay nestled between Lon and Nho Mountains, lined with coconut palms, stone sculptures, sunset cafés, and the express ferry pier to central District 1.',
        historicalEra: 'Historic Seafront Promenade (Late 19th Century)',
        openingHours: 'Open 24/7',
        architecturalHighlights: [
          'Crescent-shaped Tam Duong Bay famous for glowing western sunsets over anchored fishing boats',
          'Palm-shaded sculpture park along Quang Trung Street',
          'GreenlinesDP express ferry terminal linking directly to Bach Dang Wharf in District 1',
        ],
        audioScript: [
          'Welcome to Front Beach Park on crescent-shaped Tam Duong Bay, Vung Tau’s favorite sunset promenade and historic ferry gateway to central Ho Chi Minh City.',
        ],
      },
      fr: {
        name: 'Parc de Front Beach (Baie de Tam Duong)',
        shortSummary:
          'Baie en croissant entre les monts Lon et Nho, promenade ombragée célèbre pour ses couchers de soleil et son embarcadère d’hydroglisseurs.',
        historicalEra: 'Fin du XIXe siècle',
        openingHours: 'Ouvert 24h/24',
        architecturalHighlights: [
          'Promenade bordée de cocotiers et sculptures face au coucher du soleil',
          'Embarcadère des vedettes rapides vers le centre de Hô Chi Minh-Ville',
        ],
        audioScript: [
          'Bienvenue au parc de Front Beach, le cœur romantique de Vung Tau face au soleil couchant.',
        ],
      },
      zh: {
        name: '头顿前滩公园与高速客船码头',
        shortSummary:
          '依偎在大小两山之间的半月形海湾，椰林摇曳、雕塑林立，是头顿赏日落与乘高速客船直达胡志明市第一郡的经典地标。',
        historicalEra: '19世纪末历史海滨长廊',
        openingHours: '全天开放',
        architecturalHighlights: [
          '半月形平静海湾与绝美海上落日余晖',
          '绿荫雕塑公园与直通第一郡白藤码头的水上客运站',
        ],
        audioScript: [
          '欢迎来到头顿前滩公园，这里是欣赏夕阳渔火与感受海滨慢生活的最佳去处。',
        ],
      },
      ja: {
        name: 'フロントビーチ公園＆高速船乗り場',
        shortSummary:
          'ロン山とニョー山に抱かれた三日月型の美しい湾。ヤシ並木と彫刻公園、そしてホーチミン市1区を結ぶ高速船の発着場として親しまれます。',
        historicalEra: '19世紀末からの歴史的海浜プロムナード',
        openingHours: '24時間開放',
        architecturalHighlights: [
          '夕日が海を染める三日月型のタムズオン湾',
          'バクダン船着き場へ直結する高速船ターミナル',
        ],
        audioScript: [
          'ブンタウの中心・フロントビーチ公園へようこそ。美しい夕日と海辺の散歩をお楽しみください。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'btvt-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Hoàng hôn dịu êm tại Công viên Bãi Trước – Vũng Tàu',
          en: 'Golden sunset over Front Beach Park, Vung Tau',
          fr: 'Coucher de soleil sur Front Beach à Vung Tau',
          zh: '头顿前滩公园落日风光',
          ja: 'ブンタウ・フロントビーチの夕景',
        },
        yearOrSource: 'Vịnh Tầm Dương – Bãi Trước Vũng Tàu',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-bt-1',
        name: 'Kem Bơ Sầu Riêng Alibaba – Lê Lợi (Bãi Trước)',
        cuisine: 'Tráng miệng đặc sản Vũng Tàu',
        specialtyDishes: ['Kem bơ sầu riêng tươi', 'Kem dừa Thổ Nhĩ Kỳ', 'Sinh tố bơ sáp'],
        rating: 4.8,
        reviewCount: 6410,
        priceRange: '25.000đ – 55.000đ',
        lat: 10.3455,
        lng: 107.0748,
        address: '01 Trần Phú / Gần Bến Cáp treo Bãi Trước, Phường 1, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '09:00 – 23:00',
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 5. BÃI DỨA (BÃI LÃNG DU – CUNG ĐƯỜNG HẠ LONG)
  // =========================================================================
  {
    id: 'bai-dua-lang-du-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3348,
    lng: 107.0715,
    category: 'ancient_town',
    rating: 4.8,
    reviewCount: 9320,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Số 24–26 Đường Hạ Long, Phường 2, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Bãi Dứa (Bãi Lãng Du – Cung đường Hạ Long)',
        shortSummary:
          'Bãi biển nhỏ thơ mộng và kín gió bậc nhất Vũng Tàu nép mình dưới chân Núi Nhỏ giữa Bãi Trước và Mũi Nghinh Phong — nổi tiếng với ghềnh đá tự nhiên ôm lấy làn nước trong xanh, những quán cà phê sát mép sóng và hoàng hôn đẹp nao lòng.',
        historicalEra: 'Danh thắng biển trên cung đường Hạ Long (Bãi Lãng Du)',
        openingHours: 'Mở cửa 24/7',
        architecturalHighlights: [
          'Vịnh nhỏ hình vòng cung được bao bọc bởi Mũi Nghinh Phong và ghềnh đá nên nước êm, trong xanh quanh năm',
          'Cung đường ven biển Hạ Long được mệnh danh một trong những tuyến đường ven biển đẹp nhất Việt Nam',
          'Thiên đường của các quán cà phê ngắm hoàng hôn sát biển, thích hợp dạo mát và chụp ảnh nghệ thuật',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Bãi Dứa — hay Bãi Lãng Du — góc biển bình yên ẩn mình dưới triền Núi Nhỏ dọc cung đường Hạ Long tuyệt đẹp.',
          'Nhờ các ghềnh đá vươn ra chắn sóng, mặt nước nơi đây luôn êm dịu và trong vắt, trở thành điểm dừng chân lý tưởng để thưởng thức cà phê ven biển và đón khoảnh khắc mặt trời lặn đỏ rực trên đại dương.',
        ],
      },
      en: {
        name: 'Dua Beach (Lang Du Cove – Ha Long Coastal Road)',
        shortSummary:
          'A tranquil sheltered cove tucked beneath Nho Mountain along scenic Ha Long Road, cherished for calm turquoise water, dramatic coastal boulders, cliffside cafés, and romantic sunsets.',
        historicalEra: 'Natural Cove along Ha Long Road',
        openingHours: 'Open 24/7',
        architecturalHighlights: [
          'Rocky promontories shielding a quiet, crystal-clear swimming cove',
          'Scenic Ha Long coastal drive lined with boutique sea-view cafés',
        ],
        audioScript: [
          'Welcome to Dua Beach, a serene rocky cove along Ha Long Road beloved for calm waters and unforgettable sunset cafés.',
        ],
      },
      fr: {
        name: 'Crique de Bai Dua (Route côtière Ha Long)',
        shortSummary:
          'Petite crique abritée au pied du mont Nho, célèbre pour ses eaux calmes, ses cafés face à la mer et ses couchers de soleil.',
        historicalEra: 'Site naturel côtier',
        openingHours: 'Ouvert 24h/24',
        architecturalHighlights: [
          'Eaux calmes protégées par des rochers naturels',
          'Route panoramique Ha Long et cafés au bord de l’eau',
        ],
        audioScript: [
          'Bienvenue à Bai Dua, une crique paisible et romantique le long de la route côtière Ha Long.',
        ],
      },
      zh: {
        name: '菠萝滩（Bãi Dứa · 下龙海滨浪漫海湾）',
        shortSummary:
          '隐匿在小山脚下的静谧小海湾，天然礁石挡风避浪、海水清澈，沿途汇集众多悬崖海景咖啡馆与绝美日落机位。',
        historicalEra: '头顿下龙海滨风景线',
        openingHours: '全天开放',
        architecturalHighlights: [
          '天然礁石环抱的清澈避风海湾',
          '网红海景咖啡馆与唯美海上夕阳景观',
        ],
        audioScript: [
          '欢迎来到浪漫宁静的菠萝滩，在下龙海滨路伴着海浪品咖啡、赏日落。',
        ],
      },
      ja: {
        name: 'バイズア（ハロン海岸の隠れ家ビーチ）',
        shortSummary:
          'ニョー山の麓に抱かれた静かな入り江。穏やかな海と絵になる海辺のカフェ、美しい夕日で人気を集めます。',
        historicalEra: 'ハロン海岸道路の景勝入り江',
        openingHours: '24時間開放',
        architecturalHighlights: [
          '岩礁に守られた透明度が高く穏やかな入り江',
          '海を見渡すお洒落なカフェが並ぶ夕日スポット',
        ],
        audioScript: [
          '静かな隠れ家ビーチ・バイズアへようこそ。海辺のカフェから眺める夕日は格別です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'bdld-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Ghềnh đá và biển xanh êm ả tại Bãi Dứa – Đường Hạ Long',
          en: 'Calm rocky cove of Dua Beach along Ha Long Road',
          fr: 'Crique rocheuse de Bai Dua sur la route Ha Long',
          zh: '头顿菠萝滩静谧海湾',
          ja: 'ハロン通りのバイズア入り江',
        },
        yearOrSource: 'Bãi Dứa – Bãi Lãng Du, Vũng Tàu',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-bdua-1',
        name: 'Cà Phê Biển Soho & Ốc Tự Nhiên – Đường Hạ Long',
        cuisine: 'Cà phê biển & Ốc Vũng Tàu',
        specialtyDishes: ['Cà phê muối ngắm hoàng hôn', 'Ốc len xào dừa', 'Hàu nướng mỡ hành'],
        rating: 4.7,
        reviewCount: 5120,
        priceRange: '45.000đ – 180.000đ',
        lat: 10.3356,
        lng: 107.0721,
        address: 'Đường Hạ Long, Phường 2, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '07:00 – 23:00',
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 6. HẺM 107–109 TRẦN PHÚ (HẺM THÔNG BIỂN SỐNG ẢO)
  // =========================================================================
  {
    id: 'hem-107-tran-phu-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3601,
    lng: 107.0615,
    category: 'ancient_town',
    rating: 4.7,
    reviewCount: 11250,
    ticketPrice: 'Miễn phí chụp ảnh',
    address: 'Giữa số 107 và 109 Đường Trần Phú, Phường 5, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Hẻm 107–109 Trần Phú (Hẻm Thông Biển Sống Ảo)',
        shortSummary:
          'Con hẻm nhỏ dốc thoai thoải hướng thẳng ra mặt biển xanh ngọc trên cung đường Trần Phú — nổi tiếng với hai bức tường vàng pastel, giàn hoa giấy rực rỡ và khung hình lãng mạn đậm chất điện ảnh Hàn Quốc khi nắng chiều buông xuống.',
        historicalEra: 'Tọa độ check-in đường phố ven biển nổi tiếng Vũng Tàu',
        openingHours: '06:00 – 18:30 (Ánh sáng đẹp nhất 07:00–09:00 & 16:00–17:30)',
        architecturalHighlights: [
          'Lối dốc nhỏ mở thẳng tầm mắt từ phố Trần Phú xuống mặt biển Bãi Dâu xanh biếc',
          'Hai bức tường tông vàng kem cổ điển hòa cùng tán cây xanh và hoa giấy ven biển',
          'Nằm ngay trên cung đường du lịch kết nối Bạch Dinh, Đức Mẹ Bãi Dâu và Thích Ca Phật Đài',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Hẻm 107 – 109 Trần Phú — con hẻm hướng biển nổi tiếng nhất mạng xã hội tại thành phố Vũng Tàu.',
          'Với độ dốc nhẹ dẫn thẳng xuống bãi biển xanh trong cùng hai hàng tường vàng pastel dịu mắt, con hẻm nhỏ tạo nên khung hình đậm chất điện ảnh mỗi khi ánh nắng bình minh hay hoàng hôn rọi xuống mặt nước.',
        ],
      },
      en: {
        name: 'Alley 107–109 Tran Phu (Ocean-View Photo Alley)',
        shortSummary:
          'Vung Tau’s viral coastal alleyway between houses 107 and 109 Tran Phu Street, where pastel-yellow walls slope gently down straight into the shimmering turquoise sea.',
        historicalEra: 'Iconic Coastal Street Photo Landmark',
        openingHours: '06:00 – 18:30 (Best light morning & late afternoon)',
        architecturalHighlights: [
          'Gently sloping narrow alley framing a postcard view directly onto the ocean',
          'Warm pastel walls and coastal foliage along the scenic Tran Phu waterfront route',
        ],
        audioScript: [
          'Welcome to Alley 107 Tran Phu, Vung Tau’s iconic pastel-walled lane opening directly onto the sparkling blue sea.',
        ],
      },
      fr: {
        name: 'Ruelle 107–109 Tran Phu (Allée vers la mer)',
        shortSummary:
          'Charmante ruelle en pente bordée de murs pastel débouchant directement sur la mer bleue, spot photo emblématique de Vung Tau.',
        historicalEra: 'Spot photo côtier emblématique',
        openingHours: '06h00 – 18h30',
        architecturalHighlights: [
          'Perspective directe sur l’océan entre deux murs jaune pastel',
          'Sur la route côtière pittoresque de Tran Phu',
        ],
        audioScript: [
          'Bienvenue dans la célèbre ruelle 107 Tran Phu ouvrant sur la mer à Vung Tau.',
        ],
      },
      zh: {
        name: '陈富路107号通海小巷（网红海景小巷）',
        shortSummary:
          '头顿陈富路107至109号间的浪漫下坡小巷，两侧淡黄墙面与三角梅相映，尽头直通蔚蓝大海，宛如韩剧取景地。',
        historicalEra: '头顿网红海滨打卡地标',
        openingHours: '06:00 – 18:30',
        architecturalHighlights: [
          '缓坡直通湛蓝海面的唯美视觉纵深',
          '淡黄色复古墙面与海边光影构成的绝佳拍照机位',
        ],
        audioScript: [
          '欢迎来到陈富路107号通海小巷，在这里随手一拍都是充满电影感的浪漫海滨大片。',
        ],
      },
      ja: {
        name: 'チャンフー通り107番の海へ続く路地',
        shortSummary:
          'パステルイエローの壁の間から真っ直ぐ青い海へ抜ける絶景フォトスポット。映画のワンシーンのような風景がSNSで大人気です。',
        historicalEra: 'ブンタウの人気フォトスポット',
        openingHours: '06:00 – 18:30',
        architecturalHighlights: [
          '緩やかな坂の先に広がる真っ青な海のフレーム構図',
          'チャンフー海岸ドライブの途中に立ち寄れる好立地',
        ],
        audioScript: [
          '海へ真っ直ぐ続く人気の路地、チャンフー通り107番へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'h107-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Con hẻm thông biển 107–109 Trần Phú nhìn ra vịnh Bãi Dâu',
          en: 'Alley 107–109 Tran Phu opening toward the sea',
          fr: 'La ruelle 107 Tran Phu face à la mer',
          zh: '头顿陈富路107号通海小巷',
          ja: 'チャンフー通り107番の海へ続く小道',
        },
        yearOrSource: 'Hẻm 107–109 Trần Phú, Phường 5, Vũng Tàu',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-h107-1',
        name: 'Bánh Mì Chảo & Hải Sản Ven Biển Trần Phú',
        cuisine: 'Cà phê & Ẩm thực ven biển Bãi Dâu',
        specialtyDishes: ['Cà phê ngắm biển Bãi Dâu', 'Bánh mì chảo xíu mại', 'Mực hấp gừng tươi'],
        rating: 4.6,
        reviewCount: 2340,
        priceRange: '35.000đ – 140.000đ',
        lat: 10.3592,
        lng: 107.0621,
        address: 'Đường Trần Phú, Phường 5, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '06:30 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 7. ĐỀN THÁNH ĐỨC MẸ BÃI DÂU
  // =========================================================================
  {
    id: 'den-thanh-duc-me-bai-dau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3644,
    lng: 107.0583,
    category: 'temple',
    rating: 4.9,
    reviewCount: 11850,
    ticketPrice: 'Miễn phí tham quan',
    address: '140A Đường Trần Phú, Phường 5, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Đền Thánh Đức Mẹ Bãi Dâu (Tượng Đức Mẹ 25m)',
        shortSummary:
          'Trung tâm hành hương Công giáo linh thiêng và danh thắng nổi tiếng bên sườn tây Núi Lớn hướng ra biển Bãi Dâu, nổi bật với pho tượng Đức Mẹ bồng Chúa Hài Đồng trắng muốt cao 25m nặng gần 500 tấn cùng nhà thờ kiến trúc cánh buồm độc đáo.',
        historicalEra: 'Khởi dựng 1969 – Hoàn thành Đền Thánh 1994',
        openingHours: '05:00 – 21:00 Hàng ngày',
        architecturalHighlights: [
          'Tượng Đức Mẹ Bãi Dâu cao 25m, nặng gần 500 tấn ngự trên độ cao 60m nhìn bao quát vịnh biển Bãi Dâu',
          'Đền Thánh khánh thành năm 1994 thiết kế như cánh buồm trắng đang no gió vươn ra đại dương',
          'Con đường 14 chặng Đàng Thánh Giá uốn lượn dưới tán rừng xanh lên đỉnh Núi Lớn thanh bình',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Đền Thánh Đức Mẹ Bãi Dâu tại số 140A đường Trần Phú — một trong những công trình kiến trúc tâm linh tuyệt đẹp lưng tựa Núi Lớn, mặt hướng ra vịnh Bãi Dâu xanh biếc.',
          'Nổi bật giữa nền trời là pho tượng Đức Mẹ bồng Chúa Hài Đồng cao 25 mét bằng đá trắng uy nghi cùng ngôi Đền Thánh mô phỏng hình dáng cánh buồm trắng vươn khơi, mang lại cảm giác bình an sâu lắng cho mọi du khách.',
        ],
      },
      en: {
        name: 'Our Lady of Bai Dau Sanctuary (25m Virgin Mary Statue)',
        shortSummary:
          'A serene hillside Catholic pilgrimage sanctuary on Lon Mountain overlooking Bai Dau Bay, renowned for its 25-meter-tall white statue of Mary holding the Infant Jesus and a sailboat-shaped church.',
        historicalEra: '1969 – 1994',
        openingHours: '05:00 – 21:00 Daily',
        architecturalHighlights: [
          'Monumental 25-meter, 500-ton white statue of Our Lady overlooking Bai Dau Bay from 60m elevation',
          'Distinctive 1994 sanctuary designed in the silhouette of a white billowing sail',
          'Shaded hillside pathway with 14 Stations of the Cross climbing Lon Mountain',
        ],
        audioScript: [
          'Welcome to Our Lady of Bai Dau Sanctuary on the western slope of Lon Mountain, famed for its 25-meter white statue and sail-shaped sanctuary facing the sea.',
        ],
      },
      fr: {
        name: 'Sanctuaire Notre-Dame de Bai Dau',
        shortSummary:
          'Haut lieu de pèlerinage surplombant la baie de Bai Dau, dominé par une statue blanche de 25 m et une église en forme de voile.',
        historicalEra: '1969 – 1994',
        openingHours: '05h00 – 21h00',
        architecturalHighlights: [
          'Statue blanche de Notre-Dame haute de 25 m face à la mer',
          'Sanctuaire de 1994 évoquant une voile blanche gonflée par le vent',
        ],
        audioScript: [
          'Bienvenue au sanctuaire Notre-Dame de Bai Dau, havre de paix face à la mer à Vung Tau.',
        ],
      },
      zh: {
        name: '桑滩圣母圣殿（25米白玉圣母像）',
        shortSummary:
          '坐落于头顿大山面向桑滩海湾的宁静圣地，以高达25米、重近500吨的纯白圣母抱婴像与风帆造型教堂著称。',
        historicalEra: '1969 – 1994年',
        openingHours: '05:00 – 21:00',
        architecturalHighlights: [
          '矗立于海拔60米山坡的25米纯白圣母像',
          '如扬帆出海般优雅的帆船造型圣殿与山林步道',
        ],
        audioScript: [
          '欢迎来到头顿桑滩圣母圣殿，背山面海的纯白圣母雕像与帆船教堂庄严宁静。',
        ],
      },
      ja: {
        name: 'バイザウ聖母大聖堂（高さ25mの聖母像）',
        shortSummary:
          'ロン山の西斜面に佇む海を望む巡礼聖地。高さ25mの白亜の聖母子像と白い帆を模した聖堂が印象的です。',
        historicalEra: '1969年 – 1994年',
        openingHours: '05:00 – 21:00',
        architecturalHighlights: [
          '海抜60mからバイザウ湾を見守る高さ25mの白亜の聖母像',
          '白い帆船をかたどった美しい大聖堂と静かな山道',
        ],
        audioScript: [
          'バイザウ湾を見下ろす白亜の聖地、バイザウ聖母大聖堂へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'dmbd-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Đền Thánh Đức Mẹ Bãi Dâu bên sườn Núi Lớn – Vũng Tàu',
          en: 'Our Lady of Bai Dau Sanctuary overlooking the sea',
          fr: 'Sanctuaire Notre-Dame de Bai Dau',
          zh: '头顿桑滩圣母圣殿',
          ja: 'バイザウ聖母大聖堂',
        },
        yearOrSource: 'Đền Thánh Đức Mẹ Bãi Dâu – 140A Trần Phú',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-dmbd-1',
        name: 'Nhà Hàng Hải Sản Cây Bàng – Trần Phú (Bãi Dâu)',
        cuisine: 'Hải sản tươi sống ven biển',
        specialtyDishes: ['Cá dìa nướng muối ớt', 'Mực trứng hấp hành gừng', 'Lẩu hải sản chua cay'],
        rating: 4.7,
        reviewCount: 4120,
        priceRange: '130.000đ – 380.000đ',
        lat: 10.3638,
        lng: 107.0575,
        address: '132–138 Trần Phú, Phường 5, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '09:30 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 8. CHỢ HẢI SẢN XÓM LƯỚI (VỰA HẢI SẢN TƯƠI SỐNG VŨNG TÀU)
  // =========================================================================
  {
    id: 'cho-hai-san-xom-luoi-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3445,
    lng: 107.0792,
    category: 'ancient_town',
    rating: 4.7,
    reviewCount: 18600,
    ticketPrice: 'Miễn phí tham quan (Chế biến tại chỗ ~20.000đ–40.000đ/kg)',
    address: 'Góc đường Nguyễn Công Trứ & Phan Bội Châu, Phường 1, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Chợ Hải sản Xóm Lưới (Chợ Hải sản Tươi sống Vũng Tàu)',
        shortSummary:
          'Vựa hải sản tươi sống sầm uất và nổi tiếng bậc nhất Vũng Tàu gần khu Bãi Trước, nơi ghe thuyền ngư dân đưa tôm tích, ghẹ xanh, mực ống, ốc hương, hàu sữa vừa đánh bắt lên bờ và du khách có thể nhờ hấp nướng nóng hổi ngay tại chỗ.',
        historicalEra: 'Chợ nghề biển truyền thống khu Xóm Lưới – Bãi Trước',
        openingHours: '05:30 – 19:30 Hàng ngày (Đông tươi nhất 06:30–10:30 & 14:30–17:00)',
        architecturalHighlights: [
          'Hàng chục vựa hải sản sống sục oxy với đủ loại ghẹ, cua, tôm hùm, bề bề, mực nang, ốc hương giá bình dân',
          'Dịch vụ chế biến tại chỗ (hấp bia, nướng mỡ hành, rang me) nhanh gọn để mang ra công viên biển thưởng thức',
          'Không khí sinh hoạt ngư dân miền biển nhộn nhịp và chân thực ngay trung tâm Phường 1',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Chợ Hải sản Xóm Lưới tại góc đường Nguyễn Công Trứ và Phan Bội Châu — thiên đường ẩm thực biển không thể bỏ lỡ khi ghé Vũng Tàu.',
          'Mỗi ngày, hàng tấn hải sản tươi rói vừa cập bến như ghẹ xanh, tôm tích gạch, mực ống và các loại ốc biển được bày bán với giá gốc, kèm dịch vụ hấp nướng nóng hổi ngay tại sạp để du khách thưởng thức trọn hương vị đại dương.',
        ],
      },
      en: {
        name: 'Xom Luoi Fresh Seafood Market',
        shortSummary:
          'Vung Tau’s liveliest live seafood market near Front Beach, where daily catches of blue crab, mantis shrimp, squid, and sea snails can be selected live and steamed or grilled on the spot.',
        historicalEra: 'Traditional Fishermen’s Market',
        openingHours: '05:30 – 19:30 Daily',
        architecturalHighlights: [
          'Dozens of live-tank seafood stalls straight from local fishing boats',
          'On-the-spot steaming, grilling, and tamarind stir-frying services for modest cooking fees',
        ],
        audioScript: [
          'Welcome to Xom Luoi Seafood Market, Vung Tau’s bustling hub for freshly landed crabs, mantis shrimp, and squid cooked to order right beside the stalls.',
        ],
      },
      fr: {
        name: 'Marché aux fruits de mer de Xom Luoi',
        shortSummary:
          'Le marché aux poissons et crustacés le plus vivant de Vung Tau, avec cuisson à la demande sur place.',
        historicalEra: 'Marché maritime traditionnel',
        openingHours: '05h30 – 19h30',
        architecturalHighlights: [
          'Poissons, crabes, crevettes-mantes et calamars vivants fraîchement débarqués',
          'Cuisson vapeur ou grillée directement sur les étals',
        ],
        audioScript: [
          'Bienvenue au marché aux fruits de mer de Xom Luoi, cœur gastronomique maritime de Vung Tau.',
        ],
      },
      zh: {
        name: '渔网村海鲜市场（Chợ Xóm Lưới）',
        shortSummary:
          '头顿人气最旺的鲜活海鲜集市，汇聚当日上岸的花蟹、皮皮虾、鱿鱼与花螺，支持现场现挑现蒸现烤。',
        historicalEra: '头顿传统渔民海鲜市场',
        openingHours: '05:30 – 19:30',
        architecturalHighlights: [
          '渔船直供的鲜活花蟹、皮皮虾、鲍鱼与各类海螺',
          '实惠透明的现场代加工清蒸与炭烤服务',
        ],
        audioScript: [
          '欢迎来到头顿最热闹的渔网村海鲜市场，体验刚上岸的海鲜现挑现做的地道美味。',
        ],
      },
      ja: {
        name: 'ソムルオイ海鮮市場（活魚・即席調理）',
        shortSummary:
          'ブンタウで最も活気ある鮮魚市場。水揚げ直後のワタリガニやシャコ、イカをその場で蒸し焼きにして味わえます。',
        historicalEra: '伝統的な漁師町の海鮮市場',
        openingHours: '05:30 – 19:30',
        architecturalHighlights: [
          '活きの良いカニ、シャコ、イカ、貝類が並ぶ圧巻の活魚水槽',
          '選んだ魚介をその場で調理してくれるローカル体験',
        ],
        audioScript: [
          'ブンタウ随一の活気を誇るソムルオイ海鮮市場へようこそ。新鮮な海の幸をその場でご堪能いただけます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'cxl-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Hải sản tươi sống đánh bắt trong ngày tại Chợ Xóm Lưới',
          en: 'Daily fresh catch at Xom Luoi Seafood Market, Vung Tau',
          fr: 'Fruits de mer frais au marché Xom Luoi',
          zh: '渔网村市场新鲜海产',
          ja: 'ソムルオイ市場の新鮮な魚介類',
        },
        yearOrSource: 'Chợ Hải sản Xóm Lưới – Phường 1, Vũng Tàu',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-xl-1',
        name: 'Hải Sản Chế Biến Tại Chỗ Cô Út – Chợ Xóm Lưới',
        cuisine: 'Hải sản tươi sống chế biến tại chỗ',
        specialtyDishes: ['Ghẹ xanh hấp bia', 'Tôm tích cháy tỏi', 'Mực sữa hấp gừng nước mắm me'],
        rating: 4.8,
        reviewCount: 4320,
        priceRange: '90.000đ – 260.000đ',
        lat: 10.3447,
        lng: 107.0795,
        address: 'Đường Phan Bội Châu – Nguyễn Công Trứ, Phường 1, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '06:00 – 19:30',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 9. BẾN DU THUYỀN VŨNG TÀU MARINA (VỊNH SÔNG DINH)
  // =========================================================================
  {
    id: 'ben-du-thuyen-vung-tau-marina',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3956,
    lng: 107.1472,
    category: 'ancient_town',
    rating: 4.6,
    reviewCount: 7850,
    ticketPrice: '20.000đ – 50.000đ (Thuê cano/buồm từ 150.000đ)',
    address: 'Cuối Đường số 1, KCN Đông Xuyên, Phường Rạch Dừa, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Bến Du thuyền Vũng Tàu Marina (Vịnh Sông Dinh)',
        shortSummary:
          'Bến du thuyền buồm thể thao đầu tiên tại Vũng Tàu trên vịnh Sông Dinh — nổi tiếng với cây cầu gỗ dài vươn ra mặt nước xanh ngọc, những cánh buồm Catamaran rực rỡ đậm chất châu Âu và tour cano khám phá Đảo Long Sơn – Gò Găng – giàn khoan.',
        historicalEra: 'Khánh thành năm 2015',
        openingHours: '07:00 – 21:00 Hàng ngày',
        architecturalHighlights: [
          'Cầu gỗ nổi dài hướng ra vịnh Sông Dinh cùng hàng chục thuyền buồm Catamaran hai thân đầy màu sắc',
          'Điểm khởi hành tour cano lướt sóng khám phá Đảo Gò Găng, làng bè hàu Long Sơn và cầu Chà Và',
          'Không gian chụp ảnh ngoại cảnh phong cách bến cảng Địa Trung Hải giữa lòng Vũng Tàu',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Bến Du thuyền Vũng Tàu Marina bên vịnh Sông Dinh thơ mộng.',
          'Với cây cầu gỗ vươn dài giữa làn nước xanh biếc và dàn thuyền buồm Catamaran rực rỡ sắc màu, đây là địa điểm tuyệt vời để trải nghiệm lướt buồm, đi cano thăm đảo Long Sơn – Gò Găng và lưu giữ những bộ ảnh phong cách châu Âu.',
        ],
      },
      en: {
        name: 'Vung Tau Marina (Song Dinh Yacht Club)',
        shortSummary:
          'Vung Tau’s premier sailboat and yacht marina on Song Dinh Bay, loved for its wooden pier, colorful Catamaran sails, and speedboat excursions to Long Son and Go Gang Islands.',
        historicalEra: 'Opened in 2015',
        openingHours: '07:00 – 21:00 Daily',
        architecturalHighlights: [
          'Picturesque wooden jetty flanked by colorful twin-hull Catamaran sailboats',
          'Waterfront gateway for speedboat tours to Go Gang Island and Long Son oyster farms',
        ],
        audioScript: [
          'Welcome to Vung Tau Marina on Song Dinh Bay, featuring scenic wooden piers, Catamaran sailing, and island-hopping boat tours.',
        ],
      },
      fr: {
        name: 'Marina de Vung Tau (Baie de Song Dinh)',
        shortSummary:
          'Port de plaisance sur la baie de Song Dinh, célèbre pour sa jetée en bois, ses catamarans colorés et ses excursions vers l’île de Long Son.',
        historicalEra: 'Ouverte en 2015',
        openingHours: '07h00 – 21h00',
        architecturalHighlights: [
          'Ponton en bois photogénique bordé de voiliers catamarans',
          'Départ d’excursions en bateau vers Long Son et Go Gang',
        ],
        audioScript: [
          'Bienvenue à la Marina de Vung Tau sur la baie de Song Dinh.',
        ],
      },
      zh: {
        name: '头顿游艇码头（Vũng Tàu Marina）',
        shortSummary:
          '位于营江湾畔的帆船游艇码头，以伸入碧水的木栈道、五彩双体帆船及前往龙山岛的快艇体验闻名。',
        historicalEra: '2015年开放',
        openingHours: '07:00 – 21:00',
        architecturalHighlights: [
          '充满欧式港湾风情的木栈道与彩色双体帆船',
          '乘快艇探访龙山生蚝养殖村与鹅江岛的起航点',
        ],
        audioScript: [
          '欢迎来到头顿游艇码头，在彩色帆船与碧波之间开启海上休闲之旅。',
        ],
      },
      ja: {
        name: 'ブンタウ・マリーナ（ソンディン湾）',
        shortSummary:
          'カラフルなカタマランヨットと海に伸びる木製桟橋が映えるヨットハーバー。ロンソン島へのボートツアー拠点でもあります。',
        historicalEra: '2015年開業',
        openingHours: '07:00 – 21:00',
        architecturalHighlights: [
          'ヨーロッパ風の港を思わせる木製桟橋とヨット群',
          'ロンソン島・ゴーガン島巡りの高速ボート発着地',
        ],
        audioScript: [
          'ソンディン湾のブンタウ・マリーナへようこそ。ヨットと海の開放感あふれる景色を楽しめます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'vtmar-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Cầu gỗ và thuyền buồm tại Vũng Tàu Marina – Vịnh Sông Dinh',
          en: 'Sailboats and wooden pier at Vung Tau Marina',
          fr: 'Voiliers et jetée en bois à Vung Tau Marina',
          zh: '头顿游艇码头木栈道与帆船',
          ja: 'ブンタウ・マリーナのヨットと桟橋',
        },
        yearOrSource: 'Bến Du thuyền Vũng Tàu Marina',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-mar-1',
        name: 'Nhà Hàng Nổi Vũng Tàu Marina (Vịnh Sông Dinh)',
        cuisine: 'Hải sản vịnh Sông Dinh',
        specialtyDishes: ['Hàu Long Sơn nướng phô mai', 'Cá chẽm hấp Hồng Kông', 'Cơm chiên hải sản'],
        rating: 4.5,
        reviewCount: 2180,
        priceRange: '120.000đ – 320.000đ',
        lat: 10.3958,
        lng: 107.1476,
        address: 'Bến du thuyền Vũng Tàu Marina, Phường Rạch Dừa, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '08:00 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 10. HỒ ĐÁ XANH (CHÂN NÚI DINH – PHÚ MỸ)
  // =========================================================================
  {
    id: 'ho-da-xanh-phu-my',
    city: 'Phú Mỹ · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Phú Mỹ',
    lat: 10.5335,
    lng: 107.1265,
    category: 'ancient_town',
    rating: 4.6,
    reviewCount: 9840,
    ticketPrice: '20.000đ – 40.000đ (Phí chụp ảnh & tham quan)',
    address: 'Đường vào Núi Dinh, Khu vực Kim Dinh – Tân Hải, Phú Mỹ, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Hồ Đá Xanh (Hồ Ngọc Bích Chân Núi Dinh)',
        shortSummary:
          'Hồ nước màu xanh ngọc bích tự nhiên tuyệt đẹp nằm sát triền Núi Dinh trên đường đi Vũng Tàu — nổi tiếng với vách đá dựng đứng, cây cầu gỗ vươn ra mặt hồ, thuyền hoa, xích đu và đàn cừu trắng muốt thu hút đông đảo du khách chụp ảnh.',
        historicalEra: 'Thắng cảnh hồ núi đá tự nhiên chân Núi Dinh',
        openingHours: '07:00 – 18:00 Hàng ngày',
        architecturalHighlights: [
          'Mặt hồ nước sâu trong vắt mang sắc xanh ngọc bích hiếm có giữa lòng vách đá sừng sững',
          'Cây cầu gỗ nổi, thuyền gỗ chụp ảnh và đàn cừu thân thiện bên bãi cỏ ven hồ',
          'Vị trí cực kỳ thuận tiện để dừng chân kết hợp lịch trình Núi Dinh – Bà Rịa – Vũng Tàu',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Hồ Đá Xanh dưới chân Núi Dinh — điểm dừng chân chụp ảnh cực kỳ nổi tiếng trên hành trình từ trung tâm TP.HCM ra biển Vũng Tàu.',
          'Hình thành từ lòng hồ khai thác đá xưa, Hồ Đá Xanh mê hoặc du khách bởi sắc nước xanh ngọc bích kỳ ảo soi bóng vách núi, cây cầu gỗ lãng mạn và khung cảnh sơn thủy hữu tình. Quý khách lưu ý chỉ tham quan, chụp ảnh trên cầu gỗ và không tự ý xuống tắm vì hồ rất sâu.',
        ],
      },
      en: {
        name: 'Ho Da Xanh (Emerald Quarry Lake at Nui Dinh)',
        shortSummary:
          'A striking emerald-turquoise quarry lake nestled at the foot of Dinh Mountain, beloved for its dramatic rock cliffs, wooden photo piers, flower boats, and friendly sheep.',
        historicalEra: 'Scenic Mountain Lake Landmark',
        openingHours: '07:00 – 18:00 Daily',
        architecturalHighlights: [
          'Vivid turquoise water framed by steep rocky ridges beneath Dinh Mountain',
          'Wooden boardwalks, rowboats, and grazing sheep for photography (sightseeing only; no swimming)',
        ],
        audioScript: [
          'Welcome to Ho Da Xanh, the emerald lake at the foot of Dinh Mountain famed for wooden piers, dramatic cliffs, and picture-perfect mountain reflections.',
        ],
      },
      fr: {
        name: 'Lac Émeraude Ho Da Xanh (Mont Dinh)',
        shortSummary:
          'Lac d’ancienne carrière aux eaux vert émeraude au pied du mont Dinh, réputé pour ses pontons en bois et ses paysages photogéniques.',
        historicalEra: 'Site naturel pittoresque',
        openingHours: '07h00 – 18h00',
        architecturalHighlights: [
          'Eaux turquoise entourées de falaises rocheuses',
          'Pontons en bois et barques fleuries pour la photographie',
        ],
        audioScript: [
          'Bienvenue au lac Ho Da Xanh au pied du mont Dinh, célèbre pour ses eaux couleur émeraude.',
        ],
      },
      zh: {
        name: '青石湖（Hồ Đá Xanh · 营山翡翠湖）',
        shortSummary:
          '隐于营山脚下的翡翠色矿坑湖泊，以峭壁倒影、湖面木栈道、花船与绵羊群构成的绝美旅拍布景闻名。',
        historicalEra: '营山脚下网红自然湖景',
        openingHours: '07:00 – 18:00',
        architecturalHighlights: [
          '如翡翠般澄澈碧绿的山谷湖水',
          '木栈道、小木船与草坪绵羊拍照打卡区（湖深禁泳）',
        ],
        audioScript: [
          '欢迎来到营山脚下的青石湖，碧绿湖水与木栈道交织出如画风景。',
        ],
      },
      ja: {
        name: 'ホー・ダー・サイン（ディン山麓の翡翠湖）',
        shortSummary:
          'ディン山の麓に広がる鮮やかなエメラルドグリーンの湖。木製桟橋や小舟、羊たちと記念撮影できる人気の立ち寄りスポットです。',
        historicalEra: 'ディン山麓の景勝湖',
        openingHours: '07:00 – 18:00',
        architecturalHighlights: [
          '岩壁に囲まれた鮮やかなエメラルドグリーンの湖面',
          '木製桟橋と花舟が映えるフォトジェニックな空間（遊泳禁止）',
        ],
        audioScript: [
          'ディン山麓の翡翠湖、ホー・ダー・サインへようこそ。鮮やかな湖面と桟橋が絶好の撮影スポットです。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'hdx-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Mặt nước xanh ngọc và cầu gỗ tại Hồ Đá Xanh – chân Núi Dinh',
          en: 'Emerald lake and cliffs at Ho Da Xanh near Dinh Mountain',
          fr: 'Lac émeraude Ho Da Xanh au pied du mont Dinh',
          zh: '营山脚下青石湖美景',
          ja: 'ディン山麓のホー・ダー・サイン湖',
        },
        yearOrSource: 'Hồ Đá Xanh – Phú Mỹ / Bà Rịa',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-pm-hdx-1',
        name: 'Gà Nướng & Bánh Xèo Chân Núi Dinh',
        cuisine: 'Đặc sản Núi Dinh – Phú Mỹ',
        specialtyDishes: ['Gà ta nướng muối ớt', 'Bánh xèo rau rừng Núi Dinh', 'Lẩu gà lá giang'],
        rating: 4.7,
        reviewCount: 1580,
        priceRange: '70.000đ – 200.000đ',
        lat: 10.5318,
        lng: 107.1242,
        address: 'Đường vào Núi Dinh, Khu vực Kim Dinh – Phú Mỹ, TP. Hồ Chí Minh',
        openHours: '08:00 – 20:30',
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 11. ĐỒI CỪU SUỐI NGHỆ (CHÂU ĐỨC)
  // =========================================================================
  {
    id: 'doi-cuu-suoi-nghe-chau-duc',
    city: 'Châu Đức · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Châu Đức',
    lat: 10.5754,
    lng: 107.189,
    category: 'ancient_town',
    rating: 4.6,
    reviewCount: 10650,
    ticketPrice: '50.000đ – 100.000đ / nhóm (hỗ trợ người chăn cừu)',
    address: 'Đường số 14, Xã Suối Nghệ, Khu vực Châu Đức, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Đồi Cừu Suối Nghệ (Thảo nguyên Cừu Châu Đức)',
        shortSummary:
          'Đồng cỏ thảo nguyên rộng lớn trên cung đường Phước Tân – Hội Bài nơi hàng trăm chú cừu trắng bông và ngựa thả rong tự do — điểm du lịch nông trại và chụp ảnh phong cách du mục châu Âu được yêu thích hàng đầu gần Vũng Tàu.',
        historicalEra: 'Điểm du lịch sinh thái – nông trại Châu Đức',
        openingHours: '07:00 – 17:00 Hàng ngày (Đẹp nhất 08:00–10:00 & 15:00–16:30)',
        architecturalHighlights: [
          'Hơn 3 đàn cừu với hơn 400 chú cừu trắng hiền lành, dạn người trên đồng cỏ nắng gió thoáng đãng',
          'Trải nghiệm cho cừu ăn cỏ, bồng cừu non và chụp ảnh cùng ngựa trên nền thảo nguyên mênh mông',
          'Chỉ cách trung tâm Bà Rịa ~10 km và Vũng Tàu ~26 km, rất dễ kết hợp chuyến đi trong ngày',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Đồi Cừu Suối Nghệ tại khu vực Châu Đức, TP. Hồ Chí Minh — thảo nguyên du mục đầy nắng gió nằm ngay trên cung đường Phước Tân – Hội Bài.',
          'Với hàng trăm chú cừu trắng hiền lành tung tăng trên bãi cỏ rộng lớn, nơi đây mang lại trải nghiệm gần gũi thiên nhiên vô cùng thích thú cho các gia đình, trẻ nhỏ và những tín đồ yêu thích nhiếp ảnh.',
        ],
      },
      en: {
        name: 'Suoi Nghe Sheep Hill (Chau Duc Pastoral Meadow)',
        shortSummary:
          'A sunlit pastoral meadow along the Phuoc Tan – Hoi Bai road where hundreds of fluffy white sheep and horses roam freely—a beloved family and photography stop near Vung Tau.',
        historicalEra: 'Rural Ecotourism Farm Landmark',
        openingHours: '07:00 – 17:00 Daily',
        architecturalHighlights: [
          'Over 400 friendly white sheep grazing across open sun-drenched pastures',
          'Hands-on feeding and rustic European-steppe photography experiences just 26 km from Vung Tau',
        ],
        audioScript: [
          'Welcome to Suoi Nghe Sheep Hill in Chau Duc, where hundreds of gentle white sheep roam across sunlit meadows.',
        ],
      },
      fr: {
        name: 'Colline aux moutons de Suoi Nghe (Chau Duc)',
        shortSummary:
          'Grande prairie ensoleillée peuplée de centaines de moutons blancs, étape champêtre et photogénique près de Vung Tau.',
        historicalEra: 'Ferme écotouristique',
        openingHours: '07h00 – 17h00',
        architecturalHighlights: [
          'Plus de 400 moutons blancs en liberté sur la prairie',
          'Expérience familiale de nourrissage et photographie pastorale',
        ],
        audioScript: [
          'Bienvenue à la colline aux moutons de Suoi Nghe, un décor champêtre unique près de Vung Tau.',
        ],
      },
      zh: {
        name: '苏艺绵羊山丘（Đồi Cừu Suối Nghệ）',
        shortSummary:
          '位于周德阳光草场的网红牧场，数百只洁白温顺的绵羊自由漫步，洋溢浪漫欧式草原旅拍氛围。',
        historicalEra: '乡村生态牧场景点',
        openingHours: '07:00 – 17:00',
        architecturalHighlights: [
          '四百余只温顺绵羊与马匹漫步阳光草场',
          '亲子互动喂羊与浪漫牧场摄影的绝佳去处',
        ],
        audioScript: [
          '欢迎来到周德苏艺绵羊山丘，在阳光草场与成群洁白绵羊近距离互动拍照。',
        ],
      },
      ja: {
        name: 'スオイゲー羊の丘（チャウドゥック牧草地）',
        shortSummary:
          '数百頭の白い羊たちがのどかに草を食む広大な牧草地。餌やり体験や牧歌的な写真撮影が人気の立ち寄りスポットです。',
        historicalEra: '農園エコ観光スポット',
        openingHours: '07:00 – 17:00',
        architecturalHighlights: [
          '広々とした草地に放牧された400頭以上の人懐っこい羊たち',
          '家族連れにも人気の餌やり体験と牧場フォトスポット',
        ],
        audioScript: [
          'のどかな牧草地が広がるスオイゲー羊の丘へようこそ。たくさんの羊たちとの触れ合いを楽しめます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'dcsn-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Thảo nguyên nắng gió tại Đồi Cừu Suối Nghệ – Châu Đức',
          en: 'Sunlit meadows at Suoi Nghe Sheep Hill, Chau Duc',
          fr: 'Prairies ensoleillées de Suoi Nghe à Chau Duc',
          zh: '周德苏艺绵羊山丘草场',
          ja: 'スオイゲー羊の丘の牧草地',
        },
        yearOrSource: 'Đồi Cừu Suối Nghệ – Châu Đức',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cd-sn-1',
        name: 'Bánh Canh Long Hương & Cà Phê Vườn Châu Đức',
        cuisine: 'Đặc sản Bà Rịa – Châu Đức',
        specialtyDishes: ['Bánh canh giò heo Long Hương', 'Bò nướng lụi lá lốt', 'Nước mía sầu riêng'],
        rating: 4.7,
        reviewCount: 2450,
        priceRange: '35.000đ – 75.000đ',
        lat: 10.5205,
        lng: 107.1558,
        address: 'Quốc lộ 51 – Ngã ba Long Hương, Khu vực Bà Rịa, TP. Hồ Chí Minh',
        openHours: '06:00 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 12. ĐÈO NƯỚC NGỌT & LÀNG CHÀI PHƯỚC HẢI
  // =========================================================================
  {
    id: 'deo-nuoc-ngot-phuoc-hai',
    city: 'Long Hải – Phước Hải · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Long Đất',
    lat: 10.3853,
    lng: 107.2408,
    category: 'ancient_town',
    rating: 4.8,
    reviewCount: 11400,
    ticketPrice: 'Miễn phí tham quan (Cắm trại khu du lịch từ 80.000đ)',
    address: 'Tỉnh lộ ĐT44A, ranh giới Long Hải & Phước Hải (chân Núi Minh Đạm), Khu vực Long Đất, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Đèo Nước Ngọt & Làng Chài Phước Hải',
        shortSummary:
          'Cung đường đèo ven biển hình chữ C dài 5 km tuyệt đẹp ôm sát chân Núi Minh Đạm nối Long Hải sang làng chài Phước Hải — nổi tiếng với mùa hoa anh đào (đỗ mai) nở hồng rực dịp Tết, bãi cắm trại ven biển và đặc sản hàu sữa – chả cá Phước Hải.',
        historicalEra: 'Cung đường biển di sản nối Long Hải – Phước Hải',
        openingHours: 'Mở cửa 24/7',
        architecturalHighlights: [
          'Cung đèo ven biển dài 5 km một bên là vách núi Minh Đạm xanh ngát, một bên là sóng biển vỗ bờ đá tung bọt trắng',
          'Mỗi dịp giáp Tết và tháng Giêng, hàng trăm cây hoa đỗ mai (anh đào miền biển) nở rộ hồng trắng thơ mộng',
          'Làng chài Phước Hải bình yên với bờ kè ngắm biển, nghề làm khô – chả cá trăm năm và hải sản giá cực bình dân',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Đèo Nước Ngọt và Làng chài Phước Hải — cung đường đèo ven biển đẹp nhất miền Đông Nam Bộ nằm dưới chân Núi Minh Đạm.',
          'Uốn lượn hình chữ C dài 5 cây số giữa một bên núi rừng và một bên biển xanh bao la, Đèo Nước Ngọt đặc biệt mê hoặc du khách vào mỗi dịp đầu xuân khi hoa đỗ mai nở hồng rực cả triền đèo, dẫn thẳng xuống làng chài Phước Hải trù phú hàu sữa và hải sản tươi ngon.',
        ],
      },
      en: {
        name: 'Nuoc Ngot Coastal Pass & Phuoc Hai Fishing Village',
        shortSummary:
          'A breathtaking 5-kilometer C-shaped ocean pass hugging Minh Dam Mountain between Long Hai and Phuoc Hai Fishing Village, famed for spring cherry-like blossoms, seaside camping, and ultra-fresh local oysters.',
        historicalEra: 'Scenic Coastal Pass & Historic Fishing Village',
        openingHours: 'Open 24/7',
        architecturalHighlights: [
          '5 km cliffside coastal road wedged between green Minh Dam peaks and crashing ocean surf',
          'Blossoming pink-white Do Mai trees lining the pass around Lunar New Year',
          'Authentic Phuoc Hai coastal promenade famous for affordable milk oysters and artisanal fish cakes',
        ],
        audioScript: [
          'Welcome to Nuoc Ngot Pass and Phuoc Hai Fishing Village, a stunning five-kilometer coastal road famous for spring blossoms, beachside camping, and fresh oysters.',
        ],
      },
      fr: {
        name: 'Col côtier de Nuoc Ngot et village de pêcheurs de Phuoc Hai',
        shortSummary:
          'Route côtière panoramique de 5 km au pied du mont Minh Dam, fleurie au printemps et prolongée par le village de pêcheurs de Phuoc Hai.',
        historicalEra: 'Route panoramique et village traditionnel',
        openingHours: 'Ouvert 24h/24',
        architecturalHighlights: [
          'Route en croissant entre falaises boisées et mer turquoise',
          'Village de pêcheurs réputé pour ses huîtres fraîches',
        ],
        audioScript: [
          'Bienvenue au col de Nuoc Ngot et au village de pêcheurs de Phuoc Hai.',
        ],
      },
      zh: {
        name: '淡水岭沿海公路与福海渔村',
        shortSummary:
          '依明淡山蜿蜒5公里的C字形最美海滨山道，新春时节粉白花海盛开，直通以平价鲜蚝和渔村风情闻名的福海渔村。',
        historicalEra: '海滨风景道与传统渔村',
        openingHours: '全天开放',
        architecturalHighlights: [
          '一面青山一面碧海的5公里绝美海岸弯道',
          '福海渔村原生态海堤与超值炭烤生蚝美食',
        ],
        audioScript: [
          '欢迎沿着淡水岭沿海公路前行，一面青山一面大海，尽头便是烟火气十足的福海渔村。',
        ],
      },
      ja: {
        name: 'ヌオックゴット海岸峠＆フオックハイ漁村',
        shortSummary:
          'ミンダム山の麓を巡る全長5kmの絶景海岸ロード。春には桜に似た花が咲き誇り、新鮮な牡蠣が名物のフオックハイ漁村へ続きます。',
        historicalEra: '絶景海岸峠＆伝統漁村',
        openingHours: '24時間開放',
        architecturalHighlights: [
          '山と海に挟まれたC字型の爽快な海岸ドライブコース',
          'リーズナブルな新鮮牡蠣と海辺のキャンプで人気のフオックハイ漁村',
        ],
        audioScript: [
          'ミンダム山の麓を走る絶景のヌオックゴット峠と、新鮮な牡蠣で知られるフオックハイ漁村へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'dnn-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Cung đường Đèo Nước Ngọt ôm sát biển hướng về Làng chài Phước Hải',
          en: 'Nuoc Ngot Coastal Pass curving toward Phuoc Hai Fishing Village',
          fr: 'Col côtier de Nuoc Ngot vers Phuoc Hai',
          zh: '淡水岭沿海公路与福海海湾',
          ja: 'ヌオックゴット峠とフオックハイの海岸',
        },
        yearOrSource: 'Đèo Nước Ngọt – Phước Hải',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-ph-dnn-1',
        name: 'Hàu Sữa 35k Bờ Kè Làng Chài Phước Hải',
        cuisine: 'Hải sản làng chài Phước Hải',
        specialtyDishes: ['Hàu sữa hấp gừng sả', 'Gỏi cá mai Phước Hải', 'Mực một nắng nướng than hồng'],
        rating: 4.8,
        reviewCount: 4860,
        priceRange: '35.000đ – 180.000đ',
        lat: 10.4152,
        lng: 107.2912,
        address: 'Đường Trần Hưng Đạo (Bờ kè Phước Hải), Khu vực Long Đất, TP. Hồ Chí Minh',
        openHours: '09:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 13. BIỂN HỒ CỐC (XUYÊN MỘC)
  // =========================================================================
  {
    id: 'bien-ho-coc-xuyen-moc',
    city: 'Hồ Cốc · Xuyên Mộc (TP.HCM)',
    district: 'Xuyên Mộc',
    lat: 10.528,
    lng: 107.475,
    category: 'ancient_town',
    rating: 4.8,
    reviewCount: 8760,
    ticketPrice: 'Miễn phí bãi công cộng (Bãi dịch vụ từ 50.000đ)',
    address: 'Xã Bưng Riềng, Khu vực Xuyên Mộc, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Biển Hồ Cốc (Cung đường Rừng – Biển Xuyên Mộc)',
        shortSummary:
          'Một trong những bãi biển hoang sơ và lãng mạn bậc nhất miền Nam nằm liền kề Rừng nguyên sinh Bình Châu – Phước Bửu, nổi bật với những tảng đá muôn hình giữa làn nước xanh ngọc, rừng phi lao rì rào và không gian cắm trại cực kỳ trong lành.',
        historicalEra: 'Thắng cảnh biển hoang sơ liền kề rừng nguyên sinh',
        openingHours: 'Mở cửa 24/7',
        architecturalHighlights: [
          'Bãi biển cát trắng mịn hiếm hoi tiếp giáp trực tiếp 11.000 ha rừng nguyên sinh ven biển',
          'Các cụm đá tảng tự nhiên nằm rải rác trên bãi tắm tạo góc chụp ảnh nghệ thuật tuyệt đẹp',
          'Nằm trên cung đường du lịch đẹp nhất Xuyên Mộc: Hồ Tràm – Hồ Cốc – Suối khoáng nóng Bình Châu',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Biển Hồ Cốc tại khu vực Xuyên Mộc — viên ngọc hoang sơ nằm giữa làn nước Biển Đông xanh biếc và khu bảo tồn rừng nguyên sinh Bình Châu – Phước Bửu.',
          'Không ồn ào phố thị, Hồ Cốc chinh phục du khách bằng hàng dương rì rào gió biển, những ghềnh đá tự nhiên nghệ thuật và không khí trong lành tuyệt đối cho những chuyến nghỉ dưỡng hay cắm trại cuối tuần.',
        ],
      },
      en: {
        name: 'Ho Coc Beach (Pristine Forest-Meets-Sea Coast)',
        shortSummary:
          'One of Southern Vietnam’s most unspoiled beaches, tucked right against the Binh Chau – Phuoc Buu primeval forest with sculpted ocean boulders, casuarina shade, and peaceful seaside camping.',
        historicalEra: 'Unspoiled Coastal Nature Landmark',
        openingHours: 'Open 24/7',
        architecturalHighlights: [
          'Pristine sandy shoreline directly bordering 11,000 hectares of coastal rainforest',
          'Sculpted granite boulders along clear waters ideal for photography and glamping',
        ],
        audioScript: [
          'Welcome to Ho Coc Beach in Xuyen Moc, a tranquil natural haven where primeval coastal forest meets boulder-studded turquoise waters.',
        ],
      },
      fr: {
        name: 'Plage sauvage de Ho Coc (Xuyen Moc)',
        shortSummary:
          'Plage préservée bordée par la forêt primaire de Binh Chau – Phuoc Buu, célèbre pour ses rochers marins et ses filaos.',
        historicalEra: 'Site naturel côtier préservé',
        openingHours: 'Ouvert 24h/24',
        architecturalHighlights: [
          'Rencontre rare entre forêt primaire côtière et plage sauvage',
          'Rochers granitiques photogéniques au bord de l’eau',
        ],
        audioScript: [
          'Bienvenue sur la plage sauvage de Ho Coc, havre naturel entre forêt et océan.',
        ],
      },
      zh: {
        name: '胡谷原始海滩（Biển Hồ Cốc）',
        shortSummary:
          '紧邻平州—福保原始海岸森林的静谧海滩，以海中天然礁石、苍翠木麻黄林与清澈浪花闻名，是露营与旅拍胜地。',
        historicalEra: '原始森林海岸胜地',
        openingHours: '全天开放',
        architecturalHighlights: [
          '紧依11,000公顷原始森林的纯净白沙滩',
          '错落于浅海中的天然礁石与绝美露营风光',
        ],
        audioScript: [
          '欢迎来到川木胡谷海滩，感受原始森林与蔚蓝大海相拥的宁静之美。',
        ],
      },
      ja: {
        name: 'ホーコック海岸（原生林に抱かれた秘境ビーチ）',
        shortSummary:
          'ビンチャウ・フオックブー原生林のすぐ隣に広がる手つかずのビーチ。海中の奇岩と松林、透明な波が魅力です。',
        historicalEra: '原生林隣接の自然海岸',
        openingHours: '24時間開放',
        architecturalHighlights: [
          '11,000ヘクタールの原生林に隣接する静かな白砂の浜辺',
          '写真映えする海の奇岩群とグランピングスポット',
        ],
        audioScript: [
          '原生林と海が出会う秘境ビーチ、ホーコック海岸へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'bhc-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Bờ biển hoang sơ và ghềnh đá tự nhiên tại Hồ Cốc – Xuyên Mộc',
          en: 'Unspoiled shoreline and boulders at Ho Coc Beach',
          fr: 'Plage sauvage et rochers de Ho Coc',
          zh: '川木胡谷原始海岸景观',
          ja: 'ホーコックの美しい自然海岸',
        },
        yearOrSource: 'Biển Hồ Cốc – Xuyên Mộc',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-xm-hc-1',
        name: 'Hải Sản Biển Hồ Cốc & Gà Nướng Rừng Phước Bửu',
        cuisine: 'Hải sản tươi & Đặc sản Xuyên Mộc',
        specialtyDishes: ['Cá đục nướng muối ớt', 'Mực lá nướng mọi', 'Gà thả vườn nướng lá chanh'],
        rating: 4.6,
        reviewCount: 1840,
        priceRange: '110.000đ – 320.000đ',
        lat: 10.5262,
        lng: 107.4718,
        address: 'Tuyến ven biển Hồ Tràm – Hồ Cốc, Xã Bưng Riềng, Xuyên Mộc, TP. Hồ Chí Minh',
        openHours: '09:00 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 14. DI TÍCH BẾN LỘC AN (ĐƯỜNG HỒ CHÍ MINH TRÊN BIỂN)
  // =========================================================================
  {
    id: 'ben-tau-khong-so-loc-an',
    city: 'Lộc An · Xuyên Mộc (TP.HCM)',
    district: 'Xuyên Mộc',
    lat: 10.473,
    lng: 107.419,
    category: 'monument',
    nationalSpecialMonument: true,
    rating: 4.7,
    reviewCount: 2340,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Ven cửa sông Ray, Xã Lộc An – Phước Thuận, Khu vực Xuyên Mộc, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Di tích Bến Lộc An (Đường Hồ Chí Minh trên biển)',
        shortSummary:
          'Di tích Lịch sử cấp Quốc gia (1995) gắn liền với tuyến huyền thoại "Đường Hồ Chí Minh trên biển" — đầu cầu chiến lược bên cửa sông Ray từng tiếp nhận 3 chuyến Tàu Không Số (1963–1965) chở hơn 109 tấn vũ khí chi viện trực tiếp cho chiến trường Đông Nam Bộ và chiến dịch Bình Giã.',
        historicalEra: '1963 – 1965 (Di tích Lịch sử Quốc gia 1995)',
        openingHours: '07:00 – 17:30 Hàng ngày',
        architecturalHighlights: [
          'Đài tưởng niệm hình con tàu rẽ sóng uy nghiêm hướng ra cửa biển Lộc An – sông Ray',
          'Chứng tích lịch sử đón 3 chuyến Tàu Không Số (Đoàn 125 Hải quân) chở hơn 109 tấn vũ khí chi viện miền Đông Nam Bộ',
          'Không gian cửa sông – bãi biển Lộc An thanh bình nằm ngay trên tuyến kết nối Phước Hải và Hồ Tràm',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Di tích Lịch sử Bến Lộc An bên cửa sông Ray — bến đỗ huyền thoại của những con Tàu Không Số trên Đường Hồ Chí Minh trên biển.',
          'Từ tháng 10 năm 1963 đến cuối năm 1964, ba chuyến tàu cảm tử vượt trùng khơi đã cập bến bí mật tại đây, vận chuyển hơn 109 tấn vũ khí góp phần làm nên chiến thắng Bình Giã vang dội của quân dân Đông Nam Bộ.',
        ],
      },
      en: {
        name: 'Loc An Historic Pier (Ho Chi Minh Sea Trail Monument)',
        shortSummary:
          'A National Historical Monument along the Ray River estuary commemorating the legendary "Unnumbered Ships" of the Ho Chi Minh Sea Trail (1963–1965), which delivered over 109 tons of supplies to the Southeast front.',
        historicalEra: '1963 – 1965 (National Monument 1995)',
        openingHours: '07:00 – 17:30 Daily',
        architecturalHighlights: [
          'Ship-prow memorial monument facing the Ray River estuary and East Sea',
          'Historic landing point of three legendary Unnumbered Ships supplying the Binh Gia campaign',
        ],
        audioScript: [
          'Welcome to Loc An Historic Pier at the mouth of the Ray River, a solemn National Monument honoring the daring vessels of the Ho Chi Minh Sea Trail.',
        ],
      },
      fr: {
        name: 'Site historique de la jetée de Loc An (Piste maritime Hô Chi Minh)',
        shortSummary:
          'Monument historique national à l’embouchure du fleuve Ray commémorant les navires sans numéro de la piste maritime Hô Chi Minh (1963–1965).',
        historicalEra: '1963 – 1965',
        openingHours: '07h00 – 17h30',
        architecturalHighlights: [
          'Mémorial en forme de proue face à l’estuaire de Loc An',
          'Haut lieu historique de la piste maritime Hô Chi Minh',
        ],
        audioScript: [
          'Bienvenue au site historique de la jetée de Loc An, témoin de la célèbre piste maritime Hô Chi Minh.',
        ],
      },
      zh: {
        name: '禄安无号船码头遗迹（海上胡志明小道）',
        shortSummary:
          '位于雷河入海口的国家级历史遗迹，纪念1963至1965年间沿“海上胡志明小道”秘密抵达禄安的三艘传奇“无号船”。',
        historicalEra: '1963 – 1965年（国家级遗迹）',
        openingHours: '07:00 – 17:30',
        architecturalHighlights: [
          '面向海口的破浪船艏纪念碑',
          '海上胡志明小道重要战略接应码头遗址',
        ],
        audioScript: [
          '欢迎参观禄安无号船历史码头遗迹，这里铭记了海上胡志明小道的传奇往事。',
        ],
      },
      ja: {
        name: 'ロックアン無番号船埠頭遺跡（海のホーチミン・ルート）',
        shortSummary:
          '1963〜1965年に「海のホーチミン・ルート」の無番号船が秘密裡に着岸した歴史的拠点を称える国家史跡です。',
        historicalEra: '1963年 – 1965年',
        openingHours: '07:00 – 17:30',
        architecturalHighlights: [
          'ライ川河口と海を望む船首型の記念碑',
          '海のホーチミン・ルートの歴史を伝える重要な史跡',
        ],
        audioScript: [
          '海のホーチミン・ルートの歴史を刻むロックアン埠頭遺跡へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'bla-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Di tích lịch sử Bến tàu Không Số Lộc An bên cửa sông Ray',
          en: 'Loc An Historic Sea Trail Monument at Ray River Estuary',
          fr: 'Monument historique de la jetée de Loc An',
          zh: '禄安无号船码头历史遗迹',
          ja: 'ロックアン無番号船埠頭遺跡',
        },
        yearOrSource: 'Di tích Lịch sử Quốc gia – Đường Hồ Chí Minh trên biển',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-xm-la-1',
        name: 'Hải Sản Cảng Cá Lộc An (Bờ sông Ray)',
        cuisine: 'Hải sản tươi sống cảng cá',
        specialtyDishes: ['Cá đối nướng mọi', 'Tôm sú hấp nước dừa', 'Nghêu hấp thái'],
        rating: 4.6,
        reviewCount: 1420,
        priceRange: '90.000đ – 240.000đ',
        lat: 10.4705,
        lng: 107.4162,
        address: 'Cảng cá Lộc An, Xã Lộc An, Khu vực Xuyên Mộc, TP. Hồ Chí Minh',
        openHours: '08:00 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];
