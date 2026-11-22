import { HeritageSite } from '../types/heritage';

/**
 * 16 di tích lịch sử, văn hóa, tâm linh & điểm tham quan biểu tượng tại
 * khu vực Bình Dương, Bà Rịa – Vũng Tàu và Đặc khu Côn Đảo (thuộc TP. Hồ Chí Minh mở rộng sau sáp nhập).
 * Đầy đủ 5 ngôn ngữ (VI/EN/FR/ZH/JA), tọa độ WGS84 thực tế và ẩm thực địa phương đặc trưng.
 */
export const HCM_MERGED_BD_VT_SITES: HeritageSite[] = [
  // =========================================================================
  // KHU VỰC BÌNH DƯƠNG (TP. HỒ CHÍ MINH MỞ RỘNG) — 8 ĐỊA ĐIỂM
  // =========================================================================
  {
    id: 'chua-hoi-khanh-thu-dau-mot',
    city: 'Thủ Dầu Một · Bình Dương (TP.HCM)',
    district: 'Thủ Dầu Một',
    lat: 10.98103,
    lng: 106.65964,
    category: 'temple',
    rating: 4.8,
    reviewCount: 4650,
    ticketPrice: 'Miễn phí tham quan',
    address: '35 Yersin, Phường Phú Cường, Thủ Dầu Một, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Chùa Hội Khánh (Tượng Phật Nhập Niết Bàn 52m)',
        shortSummary:
          'Ngôi cổ tự khởi dựng năm 1741, Di tích Lịch sử – Văn hóa cấp Quốc gia, nổi tiếng với pho tượng Đức Phật nhập Niết Bàn trên mái chùa dài 52m đạt kỷ lục châu Á và dấu tích cụ Phó bảng Nguyễn Sinh Sắc.',
        historicalEra: 'Khởi dựng năm 1741 (Triều Chúa Nguyễn)',
        openingHours: '06:00 – 20:00 Hàng ngày',
        architecturalHighlights: [
          'Tượng Đức Phật nhập Niết Bàn dài 52m, cao 12m đặt trên mái chùa ở độ cao 22m — kỷ lục châu Á',
          'Chính điện gỗ cổ lưu giữ hơn 100 pho tượng cổ sơn son thếp vàng và bộ mộc bản kinh Phật',
          'Không gian tưởng niệm Hội Danh dự yêu nước do cụ Phó bảng Nguyễn Sinh Sắc đồng sáng lập (1923–1926)',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Tổ đình Hội Khánh tại Thủ Dầu Một, khu vực Bình Dương thuộc Thành phố Hồ Chí Minh mở rộng — ngôi chùa cổ hơn 280 năm tuổi được Thiền sư Đại Ngạn khai sơn năm 1741.',
          'Công trình từng là nơi cụ Phó bảng Nguyễn Sinh Sắc — thân sinh Chủ tịch Hồ Chí Minh — cùng Hòa thượng Từ Văn lập Hội Danh dự yêu nước những năm 1923 đến 1926.',
          'Điểm nhấn uy nghi nhất hiện nay là pho tượng Đức Phật Thích Ca nhập Niết Bàn dài 52 mét ngự trên mái tòa bảo điện cao 22 mét, được Tổ chức Kỷ lục châu Á vinh danh.',
        ],
      },
      en: {
        name: 'Hoi Khanh Pagoda (52m Reclining Buddha)',
        shortSummary:
          'Founded in 1741, this National Historical-Cultural Monument in Thu Dau Mot features Asia’s longest rooftop Reclining Buddha statue (52m) and deep patriotic heritage.',
        historicalEra: 'Founded in 1741',
        openingHours: '06:00 – 20:00 Daily',
        architecturalHighlights: [
          '52-meter-long rooftop Reclining Buddha statue recognized by the Asia Book of Records',
          'Timber main hall preserving over 100 gilded wooden statues and antique woodblock sutras',
          'Memorial hall honoring Nguyen Sinh Sac’s patriotic literary circle (1923–1926)',
        ],
        audioScript: [
          'Welcome to Hoi Khanh Pagoda in Thu Dau Mot, founded in 1741 and celebrated as a National Historical and Cultural Monument.',
          'Its crowning landmark is the monumental 52-meter-long Reclining Buddha resting atop a 22-meter-high pavilion overlooking the temple gardens.',
        ],
      },
      fr: {
        name: 'Pagode Hoi Khanh (Bouddha couché de 52 m)',
        shortSummary:
          'Fondée en 1741 à Thu Dau Mot, cette pagode classée abrite un spectaculaire Bouddha couché de 52 mètres sur son toit.',
        historicalEra: 'Fondée en 1741',
        openingHours: '06h00 – 20h00 tous les jours',
        architecturalHighlights: [
          'Statue du Bouddha couché de 52 m sur le toit, record d’Asie',
          'Salle principale en bois abritant plus de 100 statues anciennes dorées',
        ],
        audioScript: [
          'Bienvenue à la pagode Hoi Khanh de Thu Dau Mot, fondée en 1741 et célèbre pour son immense Bouddha couché de 52 mètres.',
        ],
      },
      zh: {
        name: '会庆寺（52米屋顶卧佛）',
        shortSummary:
          '始建于1741年的国家级历史文化古刹，以安奉于寺顶、长达52米的亚洲纪录释迦牟尼卧佛像闻名。',
        historicalEra: '始建于1741年',
        openingHours: '06:00 – 20:00',
        architecturalHighlights: [
          '屋顶52米长释迦牟尼涅槃卧佛像（亚洲纪录）',
          '古木大雄宝殿珍藏百余尊古佛像与历史遗迹',
        ],
        audioScript: [
          '欢迎来到土龙木的会庆寺，这座建于1741年的古寺以屋顶52米长巨型卧佛著称。',
        ],
      },
      ja: {
        name: 'ホイカン寺（全長52mの涅槃仏）',
        shortSummary:
          '1741年創建の国家歴史文化遺産。屋根の上に安置された全長52メートルの巨大な涅槃仏がアジア記録として知られます。',
        historicalEra: '1741年創建',
        openingHours: '06:00 – 20:00',
        architecturalHighlights: [
          '高さ22mの屋根上に横たわる全長52mの涅槃仏',
          '100体以上の古仏像を伝える伝統木造本堂',
        ],
        audioScript: [
          '1741年創建のホイカン寺へようこそ。屋根の上に横たわる全長52メートルの壮大な涅槃仏が見どころです。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'chk-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Không gian cổ tự Chùa Hội Khánh tại Thủ Dầu Một',
          en: 'Historic grounds of Hoi Khanh Pagoda in Thu Dau Mot',
          fr: 'La pagode historique Hoi Khanh à Thu Dau Mot',
          zh: '土龙木会庆古寺景观',
          ja: 'トゥーザウモットのホイカン古寺',
        },
        yearOrSource: 'Di tích Lịch sử – Văn hóa cấp Quốc gia',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-bd-hk-1',
        name: 'Bánh Bèo Bì Mỹ Liên (Đặc sản Thủ Dầu Một)',
        cuisine: 'Đặc sản Bình Dương',
        specialtyDishes: ['Bánh bèo bì đậu xanh', 'Nem chua & chả lụa Thủ Dầu Một', 'Nước mắm chua ngọt'],
        rating: 4.8,
        reviewCount: 2340,
        priceRange: '30.000đ – 55.000đ',
        lat: 10.9762,
        lng: 106.6548,
        address: 'Đường Yersin – Phú Cường, Thủ Dầu Một, TP. Hồ Chí Minh',
        openHours: '07:00 – 20:00',
        imageUrl:
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'chua-ba-thien-hau-thu-dau-mot',
    city: 'Thủ Dầu Một · Bình Dương (TP.HCM)',
    district: 'Thủ Dầu Một',
    lat: 10.9796,
    lng: 106.6528,
    category: 'temple',
    rating: 4.8,
    reviewCount: 7820,
    ticketPrice: 'Miễn phí tham quan',
    address: '04 Nguyễn Du, Phường Phú Cường, Thủ Dầu Một, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Miếu Bà Thiên Hậu Thủ Dầu Một',
        shortSummary:
          'Ngôi miếu linh thiêng bậc nhất khu vực Bình Dương, trung tâm Lễ hội Rằm tháng Giêng rước kiệu Bà thu hút hàng trăm nghìn du khách thập phương mỗi dịp đầu xuân.',
        historicalEra: 'Thế kỷ XIX (Trùng tu 1923)',
        openingHours: '05:30 – 20:00 Hàng ngày',
        architecturalHighlights: [
          'Kiến trúc ba dãy nhà liền kề mái ngói âm dương, bờ nóc gắn tượng gốm lưỡng long tranh châu',
          'Hoành phi, liễn đối sơn son thếp vàng cổ kính của 4 bang người Hoa đất Thủ',
          'Không gian lễ hội Rằm tháng Giêng với đoàn múa lân sư rồng và lễ rước kiệu Bà đặc sắc',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Miếu Bà Thiên Hậu tại trung tâm Phú Cường, Thủ Dầu Một — điểm hành hương văn hóa nổi tiếng bậc nhất miền Đông Nam Bộ.',
          'Ngôi miếu do cộng đồng bốn bang người Hoa kiến tạo từ thế kỷ 19 để thờ Thiên Hậu Thánh Mẫu, nổi bật với nghệ thuật đắp tượng gốm trên bờ nóc và lễ hội Rằm tháng Giêng rực rỡ mỗi năm.',
        ],
      },
      en: {
        name: 'Thien Hau Temple Thu Dau Mot',
        shortSummary:
          'The premier spiritual landmark of the Binh Duong area, famed for its vibrant First Full Moon Lantern Festival and ornate ceramic roof sculptures.',
        historicalEra: '19th Century (Restored 1923)',
        openingHours: '05:30 – 20:00 Daily',
        architecturalHighlights: [
          'Three-hall Sino-Vietnamese complex crowned with yin-yang tiles and ceramic dragon friezes',
          'Gilded wooden plaques donated by historic Chinese merchant guilds',
          'Host of Southern Vietnam’s largest Lunar New Year Full Moon procession',
        ],
        audioScript: [
          'Welcome to Thien Hau Temple in Thu Dau Mot, a revered 19th-century shrine renowned for its intricate roof ceramics and grand Lantern Festival procession.',
        ],
      },
      fr: {
        name: 'Temple de Thien Hau à Thu Dau Mot',
        shortSummary:
          'Sanctuaire majeur de Thu Dau Mot célèbre pour sa grande fête de la première pleine lune et ses sculptures en céramique.',
        historicalEra: 'XIXe siècle',
        openingHours: '05h30 – 20h00 tous les jours',
        architecturalHighlights: [
          'Toits en tuiles yin-yang ornés de dragons en céramique',
          'Grande procession festive de la pleine lune du premier mois lunaire',
        ],
        audioScript: [
          'Bienvenue au temple Thien Hau de Thu Dau Mot, haut lieu spirituel célèbre pour sa fête des lanternes.',
        ],
      },
      zh: {
        name: '土龙木天后宫',
        shortSummary:
          '平阳土龙木最负盛名的妈祖庙，以精致剪瓷雕屋脊与盛大的元宵节巡游庙会闻名南越。',
        historicalEra: '19世纪（1923年重修）',
        openingHours: '05:30 – 20:00',
        architecturalHighlights: [
          '阴阳瓦三进古建与双龙抢珠剪瓷雕屋脊',
          '每年正月十五盛大的妈祖巡游与舞狮庆典',
        ],
        audioScript: [
          '欢迎来到土龙木天后宫，这里以精美的岭南陶瓷屋脊工艺与热闹的元宵庙会闻名。',
        ],
      },
      ja: {
        name: 'トゥーザウモット天后宮',
        shortSummary:
          '旧正月満月祭（ランタン祭り）で知られる歴史ある媽祖廟。華麗な陶器装飾の屋根が見どころです。',
        historicalEra: '19世紀建立',
        openingHours: '05:30 – 20:00',
        architecturalHighlights: [
          '龍の陶器装飾が並ぶ伝統的な陰陽瓦の屋根',
          '旧暦1月15日に開催される盛大な巡行祭り',
        ],
        audioScript: [
          'トゥーザウモット天后宮へようこそ。鮮やかな陶器装飾と旧正月満月祭で親しまれる名刹です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'cbtdm-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Miếu Bà Thiên Hậu Phú Cường – Thủ Dầu Một',
          en: 'Thien Hau Temple in Phu Cuong, Thu Dau Mot',
          fr: 'Le temple Thien Hau à Phu Cuong',
          zh: '土龙木富强天后宫',
          ja: 'トゥーザウモットの天后宮',
        },
        yearOrSource: 'Di sản văn hóa tín ngưỡng Thủ Dầu Một',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-bd-cb-1',
        name: 'Bún Tôm & Bún Quậy Chợ Thủ Dầu Một',
        cuisine: 'Ẩm thực đất Thủ',
        specialtyDishes: ['Bún tôm tươi giã tay', 'Chả cá thác lác', 'Chè đậu xanh đánh'],
        rating: 4.7,
        reviewCount: 1580,
        priceRange: '35.000đ – 60.000đ',
        lat: 10.9815,
        lng: 106.6498,
        address: 'Khu Chợ Thủ Dầu Một, Phường Phú Cường, TP. Hồ Chí Minh',
        openHours: '06:30 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'nha-tu-phu-loi-thu-dau-mot',
    city: 'Thủ Dầu Một · Bình Dương (TP.HCM)',
    district: 'Thủ Dầu Một',
    lat: 10.99122,
    lng: 106.68229,
    category: 'monument',
    rating: 4.6,
    reviewCount: 1620,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Đường 1 Tháng 12, Phường Phú Lợi, Thủ Dầu Một, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Di tích Lịch sử Nhà tù Phú Lợi',
        shortSummary:
          'Di tích Lịch sử cấp Quốc gia (1980), chứng tích lịch sử ghi dấu vụ đầu độc tù nhân chính trị ngày 01/12/1958 với các khu phòng giam, tháp canh và tượng đài "Phú Lợi căm thù".',
        historicalEra: '1957 – 1964',
        openingHours: '07:30 – 11:30 & 13:30 – 17:00',
        architecturalHighlights: [
          'Khu phòng giam tập thể, xà lim kỷ luật và vọng gác được bảo tồn nguyên trạng',
          'Tượng đài "Phú Lợi căm thù" trang nghiêm của điêu khắc gia Diệp Minh Châu',
          'Nhà trưng bày hiện vật, hình ảnh tư liệu về cuộc đấu tranh của các chiến sĩ yêu nước',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Di tích Lịch sử cấp Quốc gia Nhà tù Phú Lợi tại Thủ Dầu Một, TP. Hồ Chí Minh.',
          'Được xây dựng năm 1957 trên diện tích 12 hecta, nơi đây từng giam giữ hàng ngàn chiến sĩ cách mạng và đồng bào yêu nước. Sự kiện đau thương ngày 1 tháng 12 năm 1958 đã làm dấy lên làn sóng đấu tranh mạnh mẽ khắp trong nước và quốc tế.',
        ],
      },
      en: {
        name: 'Phu Loi Prison Historical Monument',
        shortSummary:
          'National Historical Monument preserving the 1957–1964 political detention site, watchtowers, memorial sculpture, and documentary exhibition.',
        historicalEra: '1957 – 1964',
        openingHours: '07:30 – 11:30 & 13:30 – 17:00',
        architecturalHighlights: [
          'Preserved detention blocks, solitary cells, and perimeter guard towers',
          'Monumental memorial sculpture by acclaimed Vietnamese artist Diep Minh Chau',
          'Archival exhibition hall documenting wartime history',
        ],
        audioScript: [
          'Welcome to the Phu Loi Prison Historical Monument in Thu Dau Mot, a solemn national memorial preserving wartime history and artifacts from 1957 to 1964.',
        ],
      },
      fr: {
        name: 'Site historique de la prison de Phu Loi',
        shortSummary:
          'Monument historique national conservant les bâtiments pénitentiaires de 1957–1964 et le mémorial du sculpteur Diep Minh Chau.',
        historicalEra: '1957 – 1964',
        openingHours: '07h30 – 17h00',
        architecturalHighlights: [
          'Cellules et miradors préservés',
          'Sculpture commémorative de Diep Minh Chau',
        ],
        audioScript: [
          'Bienvenue au site historique de la prison de Phu Loi, lieu de mémoire national à Thu Dau Mot.',
        ],
      },
      zh: {
        name: '富利监狱历史遗迹',
        shortSummary:
          '国家级历史遗迹，完整保留1957至1964年间的监舍、岗楼与历史陈列馆。',
        historicalEra: '1957 – 1964',
        openingHours: '07:30 – 17:00',
        architecturalHighlights: [
          '保存完好的历史监舍与瞭望塔',
          '著名雕塑家叶明珠创作的纪念雕像',
        ],
        audioScript: [
          '欢迎参观富利监狱国家级历史遗迹，这里铭记了1957至1964年的峥嵘岁月。',
        ],
      },
      ja: {
        name: 'フーロイ刑務所歴史遺跡',
        shortSummary:
          '1957〜1964年の歴史を伝える国家歴史遺跡。監房や監視塔、資料展示館が保存されています。',
        historicalEra: '1957年 – 1964年',
        openingHours: '07:30 – 17:00',
        architecturalHighlights: [
          '当時の姿を残す監房と監視塔',
          '彫刻家ディエップ・ミン・チャウ作の記念碑',
        ],
        audioScript: [
          'フーロイ刑務所歴史遺跡へようこそ。1957年から1964年の歴史を後世に伝える国家記念遺跡です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'ntpl-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Khu di tích lịch sử quốc gia Nhà tù Phú Lợi',
          en: 'Phu Loi Prison National Historical Monument',
          fr: 'Le mémorial de la prison de Phu Loi',
          zh: '富利监狱国家级历史遗迹',
          ja: 'フーロイ刑務所歴史遺跡',
        },
        yearOrSource: 'Di tích Lịch sử cấp Quốc gia (1980)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-bd-pl-1',
        name: 'Bánh Khọt & Bún Riêu Phú Lợi',
        cuisine: 'Ẩm thực Bình Dương',
        specialtyDishes: ['Bánh khọt tôm tươi giòn rụm', 'Bún riêu cua đồng', 'Rau sống vườn nhà'],
        rating: 4.6,
        reviewCount: 940,
        priceRange: '30.000đ – 55.000đ',
        lat: 10.9895,
        lng: 106.681,
        address: 'Phường Phú Lợi, Thủ Dầu Một, TP. Hồ Chí Minh',
        openHours: '06:30 – 20:30',
        imageUrl:
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'khu-du-lich-dai-nam-binh-duong',
    city: 'Thủ Dầu Một · Bình Dương (TP.HCM)',
    district: 'Thủ Dầu Một',
    lat: 11.04333,
    lng: 106.6325,
    category: 'imperial',
    rating: 4.6,
    reviewCount: 15200,
    ticketPrice: '100.000đ – 200.000đ',
    address: '1765A Đại lộ Bình Dương, Phường Hiệp An, Thủ Dầu Một, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Lạc Cảnh Đại Nam Văn Hiến (Kim Điện & Bảo Sơn)',
        shortSummary:
          'Quần thể văn hóa – tâm linh – du lịch quy mô 450ha nổi tiếng với Đền thờ Đại Nam (Kim Điện) dát vàng rực rỡ, dãy núi Ngũ Hành Sơn nhân tạo dài nhất Việt Nam, vườn thú mở và biển nhân tạo.',
        historicalEra: 'Khởi công 1999 – Khánh thành 2008',
        openingHours: '08:00 – 17:00 Hàng ngày',
        architecturalHighlights: [
          'Kim Điện rộng 5.000m² chạm trổ gỗ quý và dát vàng 24K tôn vinh 4.000 năm văn hiến Việt Nam',
          'Dãy Bảo Sơn nhân tạo dài 252m, cao 65,8m với 5 ngọn núi biểu tượng Ngũ Hành',
          'Quảng trường Đại Nam rộng lớn, vườn thú mở bán hoang dã và khu biển nhân tạo',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Lạc Cảnh Đại Nam Văn Hiến tại khu vực Thủ Dầu Một, Thành phố Hồ Chí Minh mở rộng — quần thể văn hóa tâm linh và du lịch rộng tới 450 hecta.',
          'Trái tim của quần thể là Kim Điện uy nghi tôn vinh Vua Hùng, Chủ tịch Hồ Chí Minh và 1.068 dòng họ Việt Nam, kết hợp hài hòa kiến trúc cung đình truyền thống với không gian du lịch sinh thái.',
        ],
      },
      en: {
        name: 'Dai Nam Van Hien Cultural Complex (Golden Temple)',
        shortSummary:
          'A monumental 450-hectare cultural and leisure complex featuring the 24K-gold-leaf Kim Dien Temple, Vietnam’s longest artificial mountain range, open zoo, and wave lagoon.',
        historicalEra: '1999 – 2008',
        openingHours: '08:00 – 17:00 Daily',
        architecturalHighlights: [
          '5,000 sqm Kim Dien Golden Temple celebrating 4,000 years of Vietnamese heritage',
          '252-meter-long Bao Son Five-Elements artificial mountain range',
          'Open safari-style zoo and massive man-made seaside park',
        ],
        audioScript: [
          'Welcome to Dai Nam Van Hien, a 450-hectare cultural landmark highlighted by the gilded Kim Dien Temple and the dramatic Bao Son mountain range.',
        ],
      },
      fr: {
        name: 'Complexe culturel Dai Nam Van Hien',
        shortSummary:
          'Vaste complexe culturel de 450 ha célèbre pour son Temple d’Or (Kim Dien), sa montagne artificielle et son zoo ouvert.',
        historicalEra: '1999 – 2008',
        openingHours: '08h00 – 17h00 tous les jours',
        architecturalHighlights: [
          'Temple d’Or Kim Dien recouvert de feuilles d’or',
          'Montagne artificielle Bao Son et parc zoologique ouvert',
        ],
        audioScript: [
          'Bienvenue à Dai Nam Van Hien, un grand parc culturel célébrant l’histoire millénaire du Vietnam.',
        ],
      },
      zh: {
        name: '大南文献旅游区（金殿）',
        shortSummary:
          '占地450公顷的大型文化与旅游胜地，以金碧辉煌的大南金殿、宝山人造山脉、开放式动物园和人造海闻名。',
        historicalEra: '1999 – 2008年',
        openingHours: '08:00 – 17:00',
        architecturalHighlights: [
          '24K贴金大南金殿，礼赞越南四千年文献历史',
          '252米长宝山五岳人造山脉与开放式动物园',
        ],
        audioScript: [
          '欢迎来到大南文献旅游区，这里以恢弘的金殿建筑群与丰富的休闲体验闻名。',
        ],
      },
      ja: {
        name: 'ダイナム文化観光公園（金殿）',
        shortSummary:
          '450ヘクタールの広大な文化・レジャー複合施設。金箔装飾の金殿や人工山脈、サファリ動物園が見どころです。',
        historicalEra: '1999年 – 2008年',
        openingHours: '08:00 – 17:00',
        architecturalHighlights: [
          '24金箔で彩られた壮麗な金殿（キムディエン）',
          '全長252mの人工山脈とオープン動物園',
        ],
        audioScript: [
          'ダイナム文化観光公園へようこそ。ベトナムの歴史を称える壮麗な金殿と広大な自然公園が広がります。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'dnvh-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Quần thể Lạc Cảnh Đại Nam Văn Hiến',
          en: 'Dai Nam Van Hien Cultural Complex',
          fr: 'Complexe culturel Dai Nam Van Hien',
          zh: '大南文献旅游区',
          ja: 'ダイナム文化観光公園',
        },
        yearOrSource: 'Khu du lịch Đại Nam Văn Hiến',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-bd-dn-1',
        name: 'Nhà Hàng Ẩm Thực Đại Nam & Bò Nướng Ngói',
        cuisine: 'Đặc sản Nam Bộ',
        specialtyDishes: ['Bò nướng ngói lá lốt', 'Gà hấp mắm nhĩ', 'Lẩu cá lăng nấu măng'],
        rating: 4.5,
        reviewCount: 1890,
        priceRange: '70.000đ – 200.000đ',
        lat: 11.0432,
        lng: 106.6335,
        address: 'Đại lộ Bình Dương, Hiệp An, Thủ Dầu Một, TP. Hồ Chí Minh',
        openHours: '08:00 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'nha-co-tran-van-ho-thu-dau-mot',
    city: 'Thủ Dầu Một · Bình Dương (TP.HCM)',
    district: 'Thủ Dầu Một',
    lat: 10.9799,
    lng: 106.6492,
    category: 'ancient_town',
    rating: 4.7,
    reviewCount: 980,
    ticketPrice: 'Miễn phí tham quan',
    address: '18 Bạch Đằng, Phường Phú Cường, Thủ Dầu Một, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Nhà cổ Trần Văn Hổ (Kiến trúc gỗ Nam Bộ 1890)',
        shortSummary:
          'Di tích Kiến trúc Nghệ thuật cấp Quốc gia xây năm 1890 bên bờ sông Sài Gòn, tiêu biểu cho nghệ thuật chạm khắc gỗ Thủ Dầu Một thế kỷ 19 với kết cấu chữ Đinh ba gian hai chái.',
        historicalEra: 'Xây dựng năm 1890 (Hơn 135 năm tuổi)',
        openingHours: '08:00 – 17:00 (Thứ 3 – Chủ nhật)',
        architecturalHighlights: [
          'Kiến trúc nhà chữ Đinh ba gian hai chái, 36 cột gỗ quý (căm xe, gõ đỏ) không dùng đinh sắt',
          'Hệ thống bao lam, liễn đối, tủ thờ khảm xà cừ và chạm lộng tứ linh – mai lan cúc trúc tinh xảo',
          'Vị trí đắc địa ngay công viên ven sông Bạch Đằng – Thủ Dầu Một',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Nhà cổ Trần Văn Hổ bên phố đi bộ Bạch Đằng, Thủ Dầu Một — di tích kiến trúc nghệ thuật cấp Quốc gia được xây dựng từ năm 1890.',
          'Ngôi nhà lưu giữ nguyên vẹn tay nghề điêu khắc gỗ trứ danh của nghệ nhân đất Thủ thế kỷ 19 với 36 cột gỗ quý ghép mộng hoàn toàn thủ công cùng bộ bao lam khảm xà cừ tuyệt mỹ.',
        ],
      },
      en: {
        name: 'Tran Van Ho Ancient House (1890)',
        shortSummary:
          'Built in 1890 along the Saigon River in Thu Dau Mot, this National Architectural Monument showcases 36 hardwood pillars and masterful Southern woodcarvings.',
        historicalEra: 'Built in 1890',
        openingHours: '08:00 – 17:00 (Tue – Sun)',
        architecturalHighlights: [
          'Traditional three-bay timber house built with 36 mortise-and-tenon hardwood columns',
          'Intricate mother-of-pearl inlay altars and carved wooden lattice screens',
        ],
        audioScript: [
          'Welcome to Tran Van Ho Ancient House, an 1890 national architectural gem along Bach Dang waterfront showcasing fine 19th-century Vietnamese woodworking.',
        ],
      },
      fr: {
        name: 'Maison ancienne Tran Van Ho (1890)',
        shortSummary:
          'Monument architectural national de 1890 au bord de la rivière Saïgon, célèbre pour ses 36 piliers en bois précieux sculpté.',
        historicalEra: '1890',
        openingHours: '08h00 – 17h00',
        architecturalHighlights: [
          'Structure traditionnelle en bois précieux assemblée sans clous',
          'Autels incrustés de nacre et boiseries finement sculptées',
        ],
        audioScript: [
          'Bienvenue à la maison ancienne Tran Van Ho de 1890, joyau de l’ébénisterie traditionnelle du Sud.',
        ],
      },
      zh: {
        name: '陈文虎古宅（1890年）',
        shortSummary:
          '建于1890年的国家级建筑艺术遗迹，以36根珍贵榫卯木柱与精细的贝雕木刻闻名。',
        historicalEra: '建于1890年',
        openingHours: '08:00 – 17:00',
        architecturalHighlights: [
          '36根珍贵红木榫卯结构“丁”字形古宅',
          '精美的螺钿镶嵌神龛与四灵镂空木雕',
        ],
        audioScript: [
          '欢迎参观建于1890年的陈文虎古宅，欣赏土龙木十九世纪精湛的传统木雕工艺。',
        ],
      },
      ja: {
        name: 'チャン・ヴァン・ホー古民家（1890年）',
        shortSummary:
          '1890年建築の国家建築芸術遺産。釘を使わない36本の銘木柱と精巧な螺鈿・木彫装飾が見事です。',
        historicalEra: '1890年築',
        openingHours: '08:00 – 17:00',
        architecturalHighlights: [
          '釘を使わず組み上げた36本の銘木柱',
          '精巧な螺鈿細工と伝統木彫装飾',
        ],
        audioScript: [
          '1890年に建てられたチャン・ヴァン・ホー古民家へようこそ。南部の伝統木造建築と彫刻美を今に伝えます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'nctvh-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Nhà cổ Trần Văn Hổ bên phố đi bộ Bạch Đằng',
          en: 'Tran Van Ho Ancient House near Bach Dang riverfront',
          fr: 'La maison ancienne Tran Van Ho',
          zh: '陈文虎古宅',
          ja: 'チャン・ヴァン・ホー古民家',
        },
        yearOrSource: 'Di tích Kiến trúc Nghệ thuật cấp Quốc gia',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-bd-tvh-1',
        name: 'Cà Phê & Ẩm Thực Phố Đi Bộ Bạch Đằng',
        cuisine: 'Cà phê ven sông & Đặc sản đất Thủ',
        specialtyDishes: ['Cà phê phin ven sông Sài Gòn', 'Bánh bèo bì', 'Gỏi ngó sen tôm thịt'],
        rating: 4.7,
        reviewCount: 1320,
        priceRange: '30.000đ – 90.000đ',
        lat: 10.9788,
        lng: 106.6476,
        address: 'Phố đi bộ Bạch Đằng, Phú Cường, Thủ Dầu Một, TP. Hồ Chí Minh',
        openHours: '06:30 – 22:30',
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'lang-gom-lai-thieu-thuan-an',
    city: 'Thuận An · Bình Dương (TP.HCM)',
    district: 'Thuận An',
    lat: 10.9082,
    lng: 106.7016,
    category: 'ancient_town',
    rating: 4.7,
    reviewCount: 2150,
    ticketPrice: 'Miễn phí tham quan (Workshop từ 50.000đ)',
    address: 'Phường Lái Thiêu & Tương Bình Hiệp, Thuận An, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Làng Gốm Lái Thiêu & Vườn cây ăn trái Lái Thiêu',
        shortSummary:
          'Cái nôi nghề gốm Nam Bộ hơn 150 năm tuổi gắn liền với những chiếc tô con gà, chén men xanh vẽ tay và vườn măng cụt trăm năm trứ danh ven sông Sài Gòn.',
        historicalEra: 'Giữa thế kỷ XIX – Nay',
        openingHours: '07:30 – 17:30 Hàng ngày',
        architecturalHighlights: [
          'Lò nung củi truyền thống và xưởng chế tác gốm vẽ tay Lái Thiêu đặc trưng',
          'Không gian trải nghiệm vuốt gốm thủ công và trưng bày gốm gia dụng Nam Bộ cổ',
          'Kết hợp tham quan vườn măng cụt Lái Thiêu cổ thụ và thưởng thức gỏi gà măng cụt',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Làng Gốm Lái Thiêu tại Thuận An, TP. Hồ Chí Minh — nơi lưu giữ di sản nghề gốm gia dụng hơn 150 năm tuổi với họa tiết con gà và hoa lá mộc mạc.',
          'Bên cạnh các lò gốm truyền thống, vùng đất phù sa ven sông này còn nổi danh với những vườn măng cụt hàng trăm năm tuổi và món gỏi gà măng cụt trứ danh mỗi mùa hè.',
        ],
      },
      en: {
        name: 'Lai Thieu Ceramic Village & Fruit Orchards',
        shortSummary:
          'A 150-year-old Southern ceramic craft hub famed for hand-painted rooster bowls, wood-fired kilns, and century-old mangosteen orchards along the Saigon River.',
        historicalEra: 'Mid-19th Century – Present',
        openingHours: '07:30 – 17:30 Daily',
        architecturalHighlights: [
          'Traditional wood-fired pottery workshops and hand-painted Lai Thieu ceramics',
          'Hands-on wheel-throwing craft experiences for visitors',
          'Historic riverside mangosteen and tropical fruit orchards',
        ],
        audioScript: [
          'Welcome to Lai Thieu Ceramic Village, celebrated for 150 years of hand-painted Southern pottery and lush riverside mangosteen orchards.',
        ],
      },
      fr: {
        name: 'Village de céramique et vergers de Lai Thieu',
        shortSummary:
          'Berceau de la céramique du Sud depuis 150 ans, célèbre pour ses bols peints à la main et ses vergers de mangoustans.',
        historicalEra: 'XIXe siècle – Aujourd’hui',
        openingHours: '07h30 – 17h30',
        architecturalHighlights: [
          'Ateliers de céramique peinte à la main et fours traditionnels',
          'Vergers centenaires de mangoustans au bord de la rivière',
        ],
        audioScript: [
          'Bienvenue au village de céramique de Lai Thieu, célèbre pour ses poteries traditionnelles et ses vergers tropicaux.',
        ],
      },
      zh: {
        name: '莱条古陶瓷村与百年果园',
        shortSummary:
          '拥有150多年历史的越南南部传统陶瓷之乡，以手绘公鸡碗与百年山竹果园闻名。',
        historicalEra: '19世纪中叶至今',
        openingHours: '07:30 – 17:30',
        architecturalHighlights: [
          '传统柴窑与手绘莱条陶瓷工坊',
          '西贡河畔百年山竹果园与农家美食',
        ],
        audioScript: [
          '欢迎来到莱条陶瓷村，体验拥有150年历史的手绘陶瓷工艺与百年山竹果园。',
        ],
      },
      ja: {
        name: 'ライティエウ陶器村と果樹園',
        shortSummary:
          '150年以上の歴史を持つ南部の陶芸の里。手描きの鶏模様の器とマンゴスチン果樹園で知られます。',
        historicalEra: '19世紀中頃 – 現在',
        openingHours: '07:30 – 17:30',
        architecturalHighlights: [
          '伝統的な薪窯と手描きライティエウ焼き工房',
          'サイゴン川沿いの歴史あるマンゴスチン果樹園',
        ],
        audioScript: [
          '150年の伝統を受け継ぐライティエウ陶器村へようこそ。素朴な手描き陶器と名物のマンゴスチン料理が楽しめます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'lglt-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Nghề gốm thủ công truyền thống Lái Thiêu',
          en: 'Traditional handcrafted Lai Thieu pottery',
          fr: 'Poterie artisanale de Lai Thieu',
          zh: '莱条传统手工陶瓷',
          ja: 'ライティエウの伝統手仕事陶器',
        },
        yearOrSource: 'Di sản làng nghề truyền thống Nam Bộ',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-bd-lt-1',
        name: 'Vườn Măng Cụt & Gỏi Gà Măng Cụt Lái Thiêu',
        cuisine: 'Đặc sản miệt vườn Lái Thiêu',
        specialtyDishes: ['Gỏi gà măng cụt xanh', 'Cháo gà ta lá dứa', 'Trái cây hái tại vườn'],
        rating: 4.8,
        reviewCount: 2890,
        priceRange: '90.000đ – 220.000đ',
        lat: 10.9035,
        lng: 106.6978,
        address: 'Phường Hưng Định – Lái Thiêu, Thuận An, TP. Hồ Chí Minh',
        openHours: '08:00 – 20:30',
        imageUrl:
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'chua-chau-thoi-di-an',
    city: 'Dĩ An · Bình Dương (TP.HCM)',
    district: 'Dĩ An',
    lat: 10.91435,
    lng: 106.80317,
    category: 'temple',
    rating: 4.8,
    reviewCount: 6430,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Núi Châu Thới, Phường Bình An, Dĩ An, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Chùa Núi Châu Thới (Cổ tự 1612 trên đỉnh núi)',
        shortSummary:
          'Danh thắng Quốc gia khởi dựng năm 1612 trên đỉnh núi Châu Thới cao 82m — ngôi chùa cổ bậc nhất vùng Đông Nam Bộ, nổi bật với 220 bậc thang đá và tượng Quan Âm bằng đá ngọc bích nguyên khối.',
        historicalEra: 'Khởi dựng năm 1612 (Hơn 410 năm tuổi)',
        openingHours: '05:00 – 19:00 Hàng ngày',
        architecturalHighlights: [
          'Ngôi chùa cổ hơn 400 năm trên đỉnh núi cao 82m giữa rừng cây xanh và hồ nước thơ mộng',
          '220 bậc thang đá cổ kính cùng con đường uốn lượn lên đỉnh núi ngắm toàn cảnh Đông Sài Gòn',
          'Ba pho tượng Phật cổ bằng đá từ cuối thế kỷ 18 và tượng Quan Âm đá ngọc bích nặng hàng trăm tấn',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Danh thắng Quốc gia Chùa Núi Châu Thới tại Dĩ An, TP. Hồ Chí Minh — ngôi cổ tự hơn 410 năm tuổi do Thiền sư Khánh Long khai sơn năm 1612.',
          'Tọa lạc trên đỉnh núi Châu Thới cao 82 mét, vượt qua 220 bậc thang đá dưới tán cây cổ thụ, du khách sẽ chiêm bái bảo điện gốm sứ rực rỡ và phóng tầm mắt ngắm toàn cảnh khu Đông Thành phố.',
        ],
      },
      en: {
        name: 'Chau Thoi Mountain Pagoda (1612)',
        shortSummary:
          'Founded in 1612 atop 82m Chau Thoi Hill, this National Scenic Monument is one of Southeastern Vietnam’s oldest mountaintop temples with 220 stone steps and sweeping city views.',
        historicalEra: 'Founded in 1612',
        openingHours: '05:00 – 19:00 Daily',
        architecturalHighlights: [
          'Over 400-year-old hilltop sanctuary reached via 220 shaded stone steps',
          'Ceramic mosaic dragon eaves and monumental jade Quan Yin statue',
          'Panoramic 360-degree views across eastern Ho Chi Minh City and the Dong Nai River',
        ],
        audioScript: [
          'Welcome to Chau Thoi Mountain Pagoda, founded in 1612 atop a forested hill offering 220 stone steps, antique stone Buddha statues, and sweeping skyline panoramas.',
        ],
      },
      fr: {
        name: 'Pagode de la montagne Chau Thoi (1612)',
        shortSummary:
          'Fondée en 1612 au sommet de la colline Chau Thoi (82 m), site classé accessible par 220 marches de pierre.',
        historicalEra: '1612',
        openingHours: '05h00 – 19h00',
        architecturalHighlights: [
          '220 marches en pierre sous les arbres centenaires',
          'Vue panoramique sur l’est de Hô Chi Minh-Ville',
        ],
        audioScript: [
          'Bienvenue à la pagode de la montagne Chau Thoi, l’un des plus anciens sanctuaires du Sud-Est du Vietnam.',
        ],
      },
      zh: {
        name: '周泰山古寺（1612年）',
        shortSummary:
          '始建于1612年的国家级名胜古迹，矗立于82米高的周泰山顶，沿220级石阶登顶可远眺城市全景。',
        historicalEra: '始建于1612年',
        openingHours: '05:00 – 19:00',
        architecturalHighlights: [
          '220级林荫古石阶与400余年山顶古刹',
          '俯瞰胡志明市东区的开阔全景',
        ],
        audioScript: [
          '欢迎来到建于1612年的周泰山古寺，拾级而上可欣赏千年古刹与壮阔山景。',
        ],
      },
      ja: {
        name: 'チャウトイ山寺（1612年創建）',
        shortSummary:
          '1612年創建の国家名勝。標高82mの山頂に建つ古刹で、220段の石段と壮大なパノラマが魅力です。',
        historicalEra: '1612年創建',
        openingHours: '05:00 – 19:00',
        architecturalHighlights: [
          '緑に囲まれた220段の石段と400年以上の歴史',
          'ホーチミン市東部を一望する山頂の絶景',
        ],
        audioScript: [
          '1612年創建のチャウトイ山寺へようこそ。220段の石段を上ると山頂から雄大な景色が広がります。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'cct-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Chùa Núi Châu Thới – Danh thắng quốc gia tại Dĩ An',
          en: 'Chau Thoi Mountain Pagoda in Di An',
          fr: 'Pagode de la montagne Chau Thoi',
          zh: '周泰山古寺',
          ja: 'チャウトイ山寺',
        },
        yearOrSource: 'Di tích Danh lam Thắng cảnh Quốc gia',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-bd-ct-1',
        name: 'Quán Chay Chân Núi Châu Thới',
        cuisine: 'Ẩm thực Chay thanh tịnh',
        specialtyDishes: ['Bún Huế chay', 'Cơm thập cẩm chay', 'Nước sâm thảo mộc'],
        rating: 4.7,
        reviewCount: 1120,
        priceRange: '25.000đ – 50.000đ',
        lat: 10.9135,
        lng: 106.8045,
        address: 'Chân núi Châu Thới, Phường Bình An, Dĩ An, TP. Hồ Chí Minh',
        openHours: '06:00 – 18:30',
        imageUrl:
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'dia-dao-tam-giac-sat-ben-cat',
    city: 'Bến Cát · Bình Dương (TP.HCM)',
    district: 'Bến Cát',
    lat: 11.1583,
    lng: 106.5382,
    category: 'monument',
    rating: 4.7,
    reviewCount: 1410,
    ticketPrice: '20.000đ – 30.000đ',
    address: 'Xã An Tây, Bến Cát, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Di tích Địa đạo Tây Nam Bến Cát (Tam Giác Sắt)',
        shortSummary:
          'Di tích Lịch sử cấp Quốc gia gắn liền với vùng đất thép "Tam Giác Sắt" (An Điền – An Tây – Phú An), lưu giữ hệ thống đường hầm nối liền Củ Chi qua sông Sài Gòn và đền tưởng niệm uy nghiêm.',
        historicalEra: '1948 – 1975',
        openingHours: '07:30 – 17:00 Hàng ngày',
        architecturalHighlights: [
          'Hệ thống đường hầm địa đạo nhiều tầng đào trong đất sét pha đá ong vững chắc',
          'Đền tưởng niệm các Anh hùng Liệt sĩ Tam Giác Sắt và nhà trưng bày vũ khí lịch sử',
          'Không gian rừng xanh yên bình kết nối tuyến du lịch về nguồn Địa đạo Củ Chi – Bến Cát',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Di tích Lịch sử Quốc gia Địa đạo Tây Nam Bến Cát — biểu tượng kiên trung của vùng Tam Giác Sắt lịch sử bên bờ sông Thị Tính và sông Sài Gòn.',
          'Được đào từ năm 1948 và phát triển mạnh mẽ trong kháng chiến, hệ thống địa đạo nơi đây tạo thế liên hoàn chiến lược cùng Địa đạo Củ Chi, ghi dấu biết bao chiến công oanh liệt.',
        ],
      },
      en: {
        name: 'Iron Triangle Tunnels (Ben Cat Historic Tunnels)',
        shortSummary:
          'National Historical Monument preserving the strategic Iron Triangle underground tunnel network (1948–1975) across the Saigon River from Cu Chi.',
        historicalEra: '1948 – 1975',
        openingHours: '07:30 – 17:00 Daily',
        architecturalHighlights: [
          'Multi-level laterite underground tunnels connected strategically with the Cu Chi sector',
          'Memorial temple and historical exhibition gallery',
        ],
        audioScript: [
          'Welcome to the Iron Triangle Tunnels of Ben Cat, a national historical site preserving the resilient underground network built from 1948 to 1975.',
        ],
      },
      fr: {
        name: 'Tunnels du Triangle de Fer (Ben Cat)',
        shortSummary:
          'Site historique national préservant le réseau souterrain du Triangle de Fer (1948–1975), relié stratégiquement à Cu Chi.',
        historicalEra: '1948 – 1975',
        openingHours: '07h30 – 17h00',
        architecturalHighlights: [
          'Réseau de tunnels souterrains dans la latérite',
          'Temple mémorial et musée historique',
        ],
        audioScript: [
          'Bienvenue aux tunnels historiques du Triangle de Fer à Ben Cat.',
        ],
      },
      zh: {
        name: '铁三角地道遗迹（滨吉）',
        shortSummary:
          '国家级历史遗迹，保留1948至1975年间与古芝地道遥相呼应的“铁三角”地下坑道体系。',
        historicalEra: '1948 – 1975',
        openingHours: '07:30 – 17:00',
        architecturalHighlights: [
          '多层红土地下坑道遗址',
          '铁三角英雄烈士纪念殿与历史展馆',
        ],
        audioScript: [
          '欢迎参观滨吉铁三角地道国家级历史遗迹。',
        ],
      },
      ja: {
        name: '鉄の三角地帯トンネル遺跡（ベンカット）',
        shortSummary:
          '1948〜1975年の「鉄の三角地帯」地下トンネル網を保存する国家歴史遺跡。クチトンネルと並ぶ歴史拠点です。',
        historicalEra: '1948年 – 1975年',
        openingHours: '07:30 – 17:00',
        architecturalHighlights: [
          '堅固なラテライト層に掘られた多層地下トンネル',
          '歴史資料展示館と記念堂',
        ],
        audioScript: [
          'ベンカットの鉄の三角地帯トンネル遺跡へようこそ。1948年から1975年の歴史を伝える重要な史跡です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'tgs-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Khu di tích Địa đạo Tam Giác Sắt Bến Cát',
          en: 'Iron Triangle Tunnels Historical Site in Ben Cat',
          fr: 'Site des tunnels du Triangle de Fer',
          zh: '铁三角地道历史遗迹',
          ja: '鉄の三角地帯トンネル遺跡',
        },
        yearOrSource: 'Di tích Lịch sử cấp Quốc gia',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-bd-bc-1',
        name: 'Bò Tơ & Ẩm Thực Đồng Quê An Tây',
        cuisine: 'Đặc sản Bến Cát – Củ Chi',
        specialtyDishes: ['Bò tơ cuốn bánh tráng rau rừng', 'Lẩu bò nhúng mắm ruốc', 'Khoai mì hấp nước dừa'],
        rating: 4.6,
        reviewCount: 860,
        priceRange: '70.000đ – 180.000đ',
        lat: 11.1538,
        lng: 106.5445,
        address: 'Đường ĐT744, An Tây, Bến Cát, TP. Hồ Chí Minh',
        openHours: '08:00 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // KHU VỰC BÀ RỊA – VŨNG TÀU & ĐẶC KHU CÔN ĐẢO (TP.HCM MỞ RỘNG) — 8 ĐỊA ĐIỂM
  // =========================================================================
  {
    id: 'tuong-chua-kito-vua-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3264,
    lng: 107.084,
    category: 'monument',
    rating: 4.9,
    reviewCount: 24500,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Đỉnh Núi Nhỏ, Đường Thùy Vân, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Tượng Chúa Kitô Vua (Tượng Chúa Dang Tay – Núi Nhỏ)',
        shortSummary:
          'Biểu tượng du lịch nổi tiếng bậc nhất Vũng Tàu cao 32m, sải tay 18,4m trên đỉnh Núi Nhỏ (cao 170m), với 811 bậc thang đá và cầu thang xoắn 133 bậc bên trong lên vai tượng ngắm toàn cảnh Biển Đông.',
        historicalEra: '1974 – 1994',
        openingHours: '07:00 – 17:00 Hàng ngày',
        architecturalHighlights: [
          'Tượng Chúa cao 32m đặt trên bệ phù điêu Bữa Tiệc Ly dài 10m ở độ cao 170m so với mực nước biển',
          'Hành trình chinh phục 811 bậc thang đá rợp bóng hoa sứ và 133 bậc xoắn ốc trong lòng tượng',
          'Đài quan sát ngay hai cánh tay tượng ôm trọn Bãi Sau, Mũi Nghinh Phong và Hòn Bà',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Tượng Chúa Kitô Vua trên đỉnh Núi Nhỏ, Vũng Tàu — nay thuộc không gian biển đảo năng động của Thành phố Hồ Chí Minh mở rộng.',
          'Hoàn thành năm 1994 với chiều cao 32 mét và sải tay rộng 18,4 mét, tượng là một trong những công trình tượng Chúa lớn nhất châu Á. Vượt qua 811 bậc thang đá và 133 bậc xoắn bên trong, quý khách có thể đứng trên vai tượng ngắm toàn cảnh đại dương bao la.',
        ],
      },
      en: {
        name: 'Christ the King Statue (Nho Mountain, Vung Tau)',
        shortSummary:
          'Vung Tau’s iconic 32-meter-tall hilltop statue overlooking the East Sea, featuring an 811-step stone climb and a 133-step interior spiral staircase to panoramic shoulder balconies.',
        historicalEra: '1974 – 1994',
        openingHours: '07:00 – 17:00 Daily',
        architecturalHighlights: [
          '32m statue with an 18.4m arm span perched 170m above sea level',
          '811-step frangipani-lined trail plus 133 internal steps up to the open shoulder viewpoints',
          'Sweeping 360° vistas of Back Beach, Nghinh Phong Cape, and Hon Ba Islet',
        ],
        audioScript: [
          'Welcome to the Christ the King Statue atop Nho Mountain in Vung Tau. Standing 32 meters tall with an internal staircase to its shoulders, it offers breathtaking views across the coastline.',
        ],
      },
      fr: {
        name: 'Statue du Christ-Roi (Montagne Nho, Vung Tau)',
        shortSummary:
          'Statue emblématique de 32 m dominant Vung Tau, accessible par 811 marches avec un escalier intérieur offrant un panorama sur la mer.',
        historicalEra: '1974 – 1994',
        openingHours: '07h00 – 17h00',
        architecturalHighlights: [
          'Statue monumentale de 32 m et envergure de 18,4 m',
          'Escalier intérieur de 133 marches menant aux épaules panoramiques',
        ],
        audioScript: [
          'Bienvenue à la statue du Christ-Roi de Vung Tau, surplombant la côte depuis le sommet de la montagne Nho.',
        ],
      },
      zh: {
        name: '头顿耶稣山基督像',
        shortSummary:
          '矗立于小山顶的32米高地标雕像，登811级石阶并沿雕像内部133级螺旋梯可抵达肩部观景台俯瞰南海全景。',
        historicalEra: '1974 – 1994',
        openingHours: '07:00 – 17:00',
        architecturalHighlights: [
          '高32米、臂展18.4米的亚洲著名地标雕像',
          '雕像内部133级阶梯直达双肩海景平台',
        ],
        audioScript: [
          '欢迎来到头顿耶稣山，攀登811级石阶即可从高空俯瞰壮丽海岸线。',
        ],
      },
      ja: {
        name: 'ブンタウ巨大キリスト像（ニョー山）',
        shortSummary:
          '海抜170mの山頂に立つ高さ32mのシンボル像。811段の階段と像内部の133段を上ると絶景の海が広がります。',
        historicalEra: '1974年 – 1994年',
        openingHours: '07:00 – 17:00',
        architecturalHighlights: [
          '高さ32m・両腕18.4mを誇るアジア最大級のキリスト像',
          '像内部の螺旋階段から肩の上の展望台へアクセス可能',
        ],
        audioScript: [
          'ブンタウの象徴・巨大キリスト像へようこそ。肩の上の展望台から美しい海岸線を一望できます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'tck-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Toàn cảnh bờ biển nhìn từ Núi Nhỏ – Vũng Tàu',
          en: 'Coastal panorama from Nho Mountain, Vung Tau',
          fr: 'Panorama côtier depuis la montagne Nho à Vung Tau',
          zh: '头顿小山海岸全景',
          ja: 'ブンタウ・ニョー山からの海岸パノラマ',
        },
        yearOrSource: 'Biểu tượng du lịch biển Vũng Tàu',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-ck-1',
        name: 'Bánh Khọt Gốc Vú Sữa – Nguyễn Trường Tộ',
        cuisine: 'Đặc sản Vũng Tàu',
        specialtyDishes: ['Bánh khọt tôm tươi giòn rụm', 'Rau cải bẹ xanh & đu đủ bào', 'Nước mắm pha truyền thống'],
        rating: 4.8,
        reviewCount: 9420,
        priceRange: '50.000đ – 90.000đ',
        lat: 10.3369,
        lng: 107.0798,
        address: '14 Nguyễn Trường Tộ, Phường 2, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '07:00 – 14:30',
        imageUrl:
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'bach-dinh-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3474,
    lng: 107.0692,
    category: 'imperial',
    rating: 4.8,
    reviewCount: 11250,
    ticketPrice: '15.000đ',
    address: '04 Trần Phú, Phường 1, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Di tích Lịch sử – Văn hóa Bạch Dinh (Villa Blanche)',
        shortSummary:
          'Dinh thự kiến trúc Pháp cuối thế kỷ 19 (1898–1902) màu trắng tinh khôi giữa rừng sứ cổ thụ bên sườn Núi Lớn hướng ra Bãi Trước, nơi từng giam lỏng vua Thành Thái (1907–1916) và trưng bày cổ vật gốm Hòn Cau.',
        historicalEra: '1898 – 1902 (Di tích Quốc gia 1992)',
        openingHours: '07:00 – 17:00 Hàng ngày',
        architecturalHighlights: [
          'Kiến trúc biệt thự Pháp 3 tầng phủ màu trắng thanh lịch, mặt tiền trang trí 8 bức tượng bán thân gốm men cổ điển',
          'Nơi lưu dấu giai đoạn bị quản thúc của vị vua yêu nước Thành Thái (1907–1916)',
          'Phòng trưng bày hơn 19 khẩu súng thần công cổ và bộ sưu tập gốm sứ trục vớt từ tàu cổ Hòn Cau (thế kỷ 17)',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Bạch Dinh — hay Villa Blanche — tọa lạc giữa rừng hoa sứ bên sườn Núi Lớn, nhìn thẳng ra Bãi Trước Vũng Tàu.',
          'Khởi công năm 1898 trên nền pháo đài Phước Thắng thời vua Minh Mạng, Bạch Dinh được công nhận Di tích Lịch sử Văn hóa cấp Quốc gia năm 1992. Nơi đây từng là nơi giam lỏng vua Thành Thái suốt gần một thập kỷ và hiện trưng bày bộ cổ vật gốm sứ Hòn Cau quý giá.',
        ],
      },
      en: {
        name: 'White Palace (Bach Dinh / Villa Blanche)',
        shortSummary:
          'Built in 1898–1902 amidst frangipani groves overlooking Front Beach, this French colonial villa once held Emperor Thanh Thai under house arrest and now displays 17th-century Hon Cau shipwreck ceramics.',
        historicalEra: '1898 – 1902',
        openingHours: '07:00 – 17:00 Daily',
        architecturalHighlights: [
          'Three-story white French neoclassical villa adorned with eight antique porcelain busts',
          'Historic residence of patriotic Emperor Thanh Thai (1907–1916)',
          'Exhibition of 19 antique cannons and 17th-century Hon Cau shipwreck porcelain',
        ],
        audioScript: [
          'Welcome to Bach Dinh, the White Palace built in 1898 overlooking Vung Tau’s Front Beach. Once the place of exile for Emperor Thanh Thai, it now houses priceless shipwreck ceramics and colonial architecture.',
        ],
      },
      fr: {
        name: 'Villa Blanche (Bach Dinh)',
        shortSummary:
          'Villa coloniale blanche construite entre 1898 et 1902 face à la mer, ancien lieu de résidence surveillée de l’empereur Thanh Thai et musée de céramiques anciennes.',
        historicalEra: '1898 – 1902',
        openingHours: '07h00 – 17h00',
        architecturalHighlights: [
          'Architecture néoclassique française ornée de bustes en céramique',
          'Collection de porcelaines d’épave du XVIIe siècle de Hon Cau',
        ],
        audioScript: [
          'Bienvenue à la Villa Blanche, monument national historique surplombant la baie de Vung Tau.',
        ],
      },
      zh: {
        name: '头顿白宫（Villa Blanche）',
        shortSummary:
          '建于1898至1902年的法式白色海景别墅，成泰皇帝曾被软禁于此，现展出17世纪沉船古瓷与古炮文物。',
        historicalEra: '1898 – 1902',
        openingHours: '07:00 – 17:00',
        architecturalHighlights: [
          '三层法式新古典主义白色宫殿与百年鸡蛋花林',
          '珍藏17世纪沉船古瓷器与19门历史古炮',
        ],
        audioScript: [
          '欢迎参观头顿白宫，这座1898年落成的海景法式建筑见证了成泰皇帝的传奇历史。',
        ],
      },
      ja: {
        name: 'バックディン（白宮 / ヴィラ・ブランシュ）',
        shortSummary:
          '1898〜1902年に建てられた海を見渡す白亜のフランス様式宮殿。タインタイ帝ゆかりの史跡であり、沈没船古陶磁も展示されます。',
        historicalEra: '1898年 – 1902年',
        openingHours: '07:00 – 17:00',
        architecturalHighlights: [
          'プルメリアの木立に佇む優美な白亜のコロニアル建築',
          '17世紀ホンカウ沈没船から引き揚げられた古陶磁コレクション',
        ],
        audioScript: [
          'ブンタウの前浜を見下ろす白亜の宮殿・バックディンへようこそ。歴史的価値の高い建造物と古陶磁をご覧いただけます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'bdvt-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Di tích lịch sử – văn hóa Bạch Dinh bên sườn Núi Lớn',
          en: 'Bach Dinh (White Palace) overlooking Front Beach',
          fr: 'La Villa Blanche face à la mer',
          zh: '头顿白宫历史遗迹',
          ja: 'バックディン歴史遺跡',
        },
        yearOrSource: 'Di tích Lịch sử – Văn hóa cấp Quốc gia (1992)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-bd-1',
        name: 'Nhà Hàng Hải Sản Gành Hào (Bãi Trước)',
        cuisine: 'Hải sản tươi sống ven biển',
        specialtyDishes: ['Hàu nướng phô mai', 'Gỏi cá mai Vũng Tàu', 'Lẩu cá đuối măng chua'],
        rating: 4.7,
        reviewCount: 8340,
        priceRange: '150.000đ – 450.000đ',
        lat: 10.3519,
        lng: 107.0642,
        address: '03 Trần Phú, Phường 5, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '10:00 – 22:30',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'hai-dang-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.33389,
    lng: 107.0775,
    category: 'monument',
    rating: 4.8,
    reviewCount: 16780,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Đỉnh Núi Nhỏ, Đường Hải Đăng, Phường 2, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Ngọn Hải Đăng Vũng Tàu (1862)',
        shortSummary:
          'Một trong những ngọn hải đăng cổ nhất Việt Nam và Đông Nam Á, xây dựng từ năm 1862 trên đỉnh Núi Nhỏ ở độ cao 170m, nổi tiếng với cung đường hoa bông gòn uốn lượn và view hoàng hôn đẹp nao lòng.',
        historicalEra: '1862 (Tái thiết năm 1913)',
        openingHours: '07:00 – 22:00 Hàng ngày',
        architecturalHighlights: [
          'Tháp hình trụ sơn trắng cao 18m, đường kính 3m, tầm chiếu sáng xa tới 35 hải lý dẫn đường tàu biển',
          'Đường hầm kiên cố nối khu nhà ở của người gác đèn với chân tháp hải đăng',
          'Cung đường dạo bộ ven núi rợp bóng cây bông gòn và góc ngắm toàn cảnh thành phố biển lúc hoàng hôn',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Ngọn Hải Đăng Vũng Tàu — biểu tượng hàng hải hơn 160 năm tuổi được người Pháp khởi dựng từ năm 1862 trên đỉnh Núi Nhỏ.',
          'Từ ban công trên cao ở độ cao 170 mét so với mực nước biển, du khách có thể thu trọn vào tầm mắt bờ biển uốn cong hình lưỡi liềm của Bãi Trước, Bãi Sau và những con tàu lướt sóng trên Biển Đông.',
        ],
      },
      en: {
        name: 'Vung Tau Lighthouse (1862)',
        shortSummary:
          'One of Vietnam’s oldest lighthouses, built in 1862 atop Nho Mountain at 170m elevation, beloved for its scenic winding road and golden sunset panoramas.',
        historicalEra: '1862 (Rebuilt 1913)',
        openingHours: '07:00 – 22:00 Daily',
        architecturalHighlights: [
          '18-meter-tall white cylindrical stone tower visible up to 35 nautical miles at sea',
          'Scenic winding hilltop road famous for sunset walks and citywide views',
        ],
        audioScript: [
          'Welcome to Vung Tau Lighthouse, originally built in 1862 atop Nho Mountain and offering unforgettable 360-degree views of Vung Tau’s beaches and harbor.',
        ],
      },
      fr: {
        name: 'Phare de Vung Tau (1862)',
        shortSummary:
          'L’un des plus anciens phares d’Asie du Sud-Est, érigé en 1862 à 170 m d’altitude avec une vue splendide sur la baie.',
        historicalEra: '1862 – 1913',
        openingHours: '07h00 – 22h00',
        architecturalHighlights: [
          'Tour blanche de 18 m guidant les navires jusqu’à 35 milles marins',
          'Route panoramique très prisée au coucher du soleil',
        ],
        audioScript: [
          'Bienvenue au phare historique de Vung Tau, construit en 1862 au sommet de la montagne Nho.',
        ],
      },
      zh: {
        name: '头顿百年灯塔（1862年）',
        shortSummary:
          '建于1862年的越南最古老灯塔之一，矗立在海拔170米的小山顶，是俯瞰海湾日落的绝佳胜地。',
        historicalEra: '1862年（1913年重建）',
        openingHours: '07:00 – 22:00',
        architecturalHighlights: [
          '18米高纯白圆柱灯塔，射程可达35海里',
          '浪漫盘山步道与360度日落海景',
        ],
        audioScript: [
          '欢迎来到建于1862年的头顿百年灯塔，在这里可尽览海湾全景与迷人日落。',
        ],
      },
      ja: {
        name: 'ブンタウ灯台（1862年）',
        shortSummary:
          '1862年建設のベトナム最古級の灯台。標高170mの山頂に白亜の塔が立ち、夕日の名所として人気です。',
        historicalEra: '1862年（1913年再建）',
        openingHours: '07:00 – 22:00',
        architecturalHighlights: [
          '高さ18mの白亜の石造灯台と美しい螺旋階段',
          '夕暮れ時の絶景が楽しめる山道プロムナード',
        ],
        audioScript: [
          '1862年建設のブンタウ灯台へようこそ。海抜170mから望む海と街のパノラマが圧巻です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'hdvt-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Cảnh biển Vũng Tàu nhìn từ đồi Hải Đăng',
          en: 'Vung Tau coastline from the historic lighthouse hill',
          fr: 'La côte de Vung Tau depuis le phare',
          zh: '头顿灯塔山海景',
          ja: 'ブンタウ灯台からの海景',
        },
        yearOrSource: 'Hải đăng cổ Vũng Tàu (1862)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-hd-1',
        name: 'Yaourt Cô Tiên & Trứng Gà Lòng Đào Hải Đăng',
        cuisine: 'Ăn vặt huyền thoại Vũng Tàu',
        specialtyDishes: ['Yaourt dẻo Cô Tiên', 'Trứng gà lòng đào muối tiêu', 'Bánh bông lan trứng muối'],
        rating: 4.8,
        reviewCount: 7210,
        priceRange: '15.000đ – 45.000đ',
        lat: 10.3348,
        lng: 107.0779,
        address: 'Đường lên Hải Đăng, Núi Nhỏ, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '07:00 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'thich-ca-phat-dai-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.37463,
    lng: 107.07054,
    category: 'temple',
    rating: 4.7,
    reviewCount: 5340,
    ticketPrice: 'Miễn phí tham quan',
    address: '608 Trần Phú, Phường 5, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Thích Ca Phật Đài (Sườn Bắc Núi Lớn)',
        shortSummary:
          'Quần thể kiến trúc Phật giáo nổi tiếng rộng 28ha trên sườn Núi Lớn, kết hợp hài hòa giữa cảnh sắc thiên nhiên biển núi với tượng Kim Thân Phật Tổ cao 10,2m và Tháp Bát Giác lưu giữ Xá Lợi Phật.',
        historicalEra: '1961 – 1963 (Di tích Lịch sử – Danh thắng Quốc gia 1989)',
        openingHours: '06:00 – 18:00 Hàng ngày',
        architecturalHighlights: [
          'Tượng Đức Phật Thích Ca ngồi thiền trên tòa sen cao 10,2m uy nghiêm hướng ra biển',
          'Tháp Bát Giác cao 19m lưu giữ 13 viên Xá Lợi Phật thiêng liêng',
          'Cụm tượng tái hiện trọn vẹn cuộc đời Đức Phật từ Đản sinh, Xuất gia đến Thành đạo và Nhập Niết Bàn',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Thích Ca Phật Đài tại sườn bắc Núi Lớn, Vũng Tàu — quần thể danh thắng Phật giáo được công nhận Di tích Quốc gia từ năm 1989.',
          'Trải dài trên triền núi xanh mát rộng 28 hecta, nơi đây quy tụ tượng Kim Thân Phật Tổ tọa thiền trên tòa sen cùng Tháp Bát Giác tôn trí Xá Lợi Phật vô cùng thanh tịnh.',
        ],
      },
      en: {
        name: 'Thich Ca Phat Dai Buddhist Complex',
        shortSummary:
          'A 28-hectare hillside Buddhist sanctuary on Lon Mountain featuring a 10.2m meditating Buddha, an octagonal relic stupa, and peaceful coastal forest trails.',
        historicalEra: '1961 – 1963',
        openingHours: '06:00 – 18:00 Daily',
        architecturalHighlights: [
          '10.2-meter seated Shakyamuni Buddha overlooking the sea',
          '19-meter Octagonal Stupa enshrining sacred Buddhist relics',
        ],
        audioScript: [
          'Welcome to Thich Ca Phat Dai on Lon Mountain in Vung Tau, a tranquil 28-hectare Buddhist sanctuary framed by coastal greenery.',
        ],
      },
      fr: {
        name: 'Sanctuaire bouddhique Thich Ca Phat Dai',
        shortSummary:
          'Vaste sanctuaire de 28 ha sur le mont Lon abritant un Bouddha méditant de 10,2 m et un stupa octogonal.',
        historicalEra: '1961 – 1963',
        openingHours: '06h00 – 18h00',
        architecturalHighlights: [
          'Statue de Bouddha assis sur un lotus (10,2 m)',
          'Stupa octogonal de 19 m abritant des reliques',
        ],
        audioScript: [
          'Bienvenue au sanctuaire Thich Ca Phat Dai sur le versant nord du mont Lon à Vung Tau.',
        ],
      },
      zh: {
        name: '释迦佛台（头顿大山）',
        shortSummary:
          '坐落于头顿大山北坡的28公顷佛教名胜，拥有10.2米高释迦牟尼坐佛像与供奉佛陀舍利的八角宝塔。',
        historicalEra: '1961 – 1963',
        openingHours: '06:00 – 18:00',
        architecturalHighlights: [
          '10.2米高莲花座释迦牟尼坐佛',
          '供奉佛舍利的19米八角宝塔',
        ],
        audioScript: [
          '欢迎来到头顿大山的释迦佛台，这里依山傍海，环境清幽庄严。',
        ],
      },
      ja: {
        name: 'ティッカー・ファット・ダイ（釈迦仏台）',
        shortSummary:
          'ロン山の斜面に広がる28ヘクタールの仏教聖地。高さ10.2mの釈迦坐像と仏舎利を納める八角塔が佇みます。',
        historicalEra: '1961年 – 1963年',
        openingHours: '06:00 – 18:00',
        architecturalHighlights: [
          '海を望む高さ10.2mの釈迦如来坐像',
          '仏舎利を安置する高さ19mの八角仏塔',
        ],
        audioScript: [
          'ロン山の緑に包まれた仏教聖地、ティッカー・ファット・ダイへようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'tcpd-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Quần thể Thích Ca Phật Đài – Núi Lớn Vũng Tàu',
          en: 'Thich Ca Phat Dai Buddhist Complex, Vung Tau',
          fr: 'Sanctuaire Thich Ca Phat Dai',
          zh: '头顿释迦佛台',
          ja: 'ティッカー・ファット・ダイ',
        },
        yearOrSource: 'Di tích Lịch sử – Danh thắng cấp Quốc gia',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-tc-1',
        name: 'Lẩu Cá Đuối Hoàng Minh – Trương Công Định',
        cuisine: 'Đặc sản biển Vũng Tàu',
        specialtyDishes: ['Lẩu cá đuối nấu măng chua', 'Mực sữa chiên nước mắm', 'Nghêu hấp sả'],
        rating: 4.7,
        reviewCount: 6150,
        priceRange: '120.000đ – 280.000đ',
        lat: 10.3522,
        lng: 107.0789,
        address: '44 Trương Công Định, Phường 3, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '09:00 – 22:30',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'mieu-hon-ba-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.32389,
    lng: 107.08917,
    category: 'temple',
    rating: 4.8,
    reviewCount: 8910,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Đảo Hòn Bà, Mũi Nghinh Phong – Bãi Sau, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Miếu Hòn Bà & Con đường rẽ biển Bãi Sau',
        shortSummary:
          'Ngôi miếu cổ xây dựng năm 1881 trên đảo đá nhỏ ngoài khơi Mũi Nghinh Phong — nổi tiếng với con đường đá hàu rẽ sóng dài hơn 200m chỉ xuất hiện vào các ngày thủy triều rút sâu.',
        historicalEra: 'Xây dựng năm 1881',
        openingHours: 'Tham quan theo lịch thủy triều rút (14–15 & 30–01 âm lịch)',
        architecturalHighlights: [
          'Đảo đá xanh mướt rộng 5.000m² giữa sóng biển Bãi Sau – Mũi Nghinh Phong',
          'Con đường đi bộ xuyên biển dài ~200m lộ ra ngoạn mục khi nước ròng',
          'Miếu Bà Thủy Long cổ kính gắn với tín ngưỡng cầu ngư bình an của ngư dân Vũng Tàu',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Miếu Hòn Bà nằm ngoài khơi Mũi Nghinh Phong, Vũng Tàu.',
          'Được xây dựng từ năm 1881 để thờ Thủy Long Thần Nữ, điều kỳ diệu nhất nơi đây là con đường đá dài hơn 200 mét nối từ bờ ra đảo chỉ hiện ra mỗi khi thủy triều rút sâu vào dịp rằm và mùng một âm lịch.',
        ],
      },
      en: {
        name: 'Hon Ba Islet Shrine & Sea-Parting Stone Path',
        shortSummary:
          'Built in 1881 on a tiny rocky islet off Nghinh Phong Cape, famous for its 200-meter natural stone pathway that emerges across the sea only during low tide.',
        historicalEra: 'Built in 1881',
        openingHours: 'Accessible on foot during low tide',
        architecturalHighlights: [
          '200-meter natural rock causeway emerging from the ocean at low tide',
          '1881 maritime shrine dedicated to the Water Goddess overlooking Back Beach',
        ],
        audioScript: [
          'Welcome to Hon Ba Shrine off Vung Tau’s Nghinh Phong Cape, famed for its dramatic sea-parting rock path that reveals itself at low tide.',
        ],
      },
      fr: {
        name: 'Îlot et temple de Hon Ba',
        shortSummary:
          'Temple marin de 1881 perché sur un îlot rocheux relié au rivage par un sentier de pierre de 200 m uniquement visible à marée basse.',
        historicalEra: '1881',
        openingHours: 'Accessible à marée basse',
        architecturalHighlights: [
          'Chemin de pierre de 200 m traversant la mer à marée basse',
          'Sanctuaire marin de 1881 au large du cap Nghinh Phong',
        ],
        audioScript: [
          'Bienvenue à l’îlot de Hon Ba, célèbre pour son chemin de pierre qui émerge des flots à marée basse.',
        ],
      },
      zh: {
        name: '头顿婆岛庙（退潮海中石道）',
        shortSummary:
          '建于1881年的海中礁岛古庙，每逢大退潮时海面现出200米天然石道可供步行登岛，奇观迷人。',
        historicalEra: '建于1881年',
        openingHours: '依潮汐退潮时间步行登岛',
        architecturalHighlights: [
          '退潮时浮现海面的200米天然海中步道',
          '1881年护佑渔民的水龙神女海岛古庙',
        ],
        audioScript: [
          '欢迎来到头顿婆岛庙，每逢退潮，一条神奇的海中石道将引领您步行登上礁岛。',
        ],
      },
      ja: {
        name: 'ホンバー島廟（干潮に現れる海の道）',
        shortSummary:
          '1881年建立の岩島の廟。大潮の干潮時だけ海の中から約200mの石道が現れ、歩いて渡れる絶景スポットです。',
        historicalEra: '1881年建立',
        openingHours: '干潮時に徒歩で参拝可能',
        architecturalHighlights: [
          '干潮時に海が割れて現れる約200mの自然石道',
          '漁師の安全を祈る1881年建立の海辺の廟',
        ],
        audioScript: [
          'ホンバー島廟へようこそ。干潮時だけ海の中から道が現れる神秘的な景勝地です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'mhb-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Đảo Hòn Bà & biển Bãi Sau – Vũng Tàu',
          en: 'Hon Ba Islet off Back Beach, Vung Tau',
          fr: 'Îlot Hon Ba à Vung Tau',
          zh: '头顿婆岛海景',
          ja: 'ブンタウ・ホンバー島',
        },
        yearOrSource: 'Danh thắng biển Mũi Nghinh Phong',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-hb-1',
        name: 'Hải Sản Bờ Biển Bãi Sau – Thùy Vân',
        cuisine: 'Hải sản nướng Vũng Tàu',
        specialtyDishes: ['Ốc hương nướng mọi', 'Ghẹ hấp bia', 'Mực một nắng nướng sa tế'],
        rating: 4.6,
        reviewCount: 2740,
        priceRange: '120.000đ – 320.000đ',
        lat: 10.3269,
        lng: 107.0872,
        address: 'Đường Hạ Long – Thùy Vân, Bãi Sau, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '10:00 – 23:00',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'dinh-co-long-hai',
    city: 'Long Hải · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Long Đất',
    lat: 10.3995,
    lng: 107.2281,
    category: 'temple',
    rating: 4.7,
    reviewCount: 7940,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Thị trấn Long Hải, Khu vực Long Đất, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Khu Di tích Dinh Cô – Biển Long Hải',
        shortSummary:
          'Di tích Lịch sử – Văn hóa cấp Quốc gia bên bãi biển Long Hải cát trắng, nơi tổ chức Lễ hội Dinh Cô (10–12/2 âm lịch) — Di sản Văn hóa Phi vật thể Quốc gia đậm bản sắc ngư dân miền biển.',
        historicalEra: 'Cuối thế kỷ XVIII (Di tích Quốc gia 1995)',
        openingHours: '06:00 – 19:00 Hàng ngày',
        architecturalHighlights: [
          'Quần thể kiến trúc uy nghi lưng tựa núi Kỳ Vân, mặt hướng ra bãi biển Long Hải khoáng đạt',
          'Mái ngói lưu ly xanh lợp nhiều tầng chạm lưỡng long chầu nguyệt tinh xảo',
          'Lễ hội Nghinh Cô hàng năm được công nhận Di sản Văn hóa Phi vật thể Quốc gia (2023)',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Khu Di tích Lịch sử Văn hóa Dinh Cô bên bãi biển Long Hải thơ mộng, khu vực Bà Rịa – Vũng Tàu thuộc TP. Hồ Chí Minh mở rộng.',
          'Gắn với huyền thoại Lê Thị Hồng linh thiêng che chở ngư dân vượt sóng dữ từ cuối thế kỷ 18, Lễ hội Dinh Cô rằm tháng Hai âm lịch hằng năm đã được vinh danh là Di sản Văn hóa Phi vật thể Quốc gia.',
        ],
      },
      en: {
        name: 'Dinh Co Temple & Long Hai Beach',
        shortSummary:
          'A National Historical-Cultural Monument facing sandy Long Hai Beach, renowned for its annual Dinh Co Festival—recognized as National Intangible Cultural Heritage.',
        historicalEra: 'Late 18th Century',
        openingHours: '06:00 – 19:00 Daily',
        architecturalHighlights: [
          'Grand hillside coastal temple framed by Ky Van Mountain and Long Hai Bay',
          'Host of the annual Dinh Co maritime festival (National Intangible Cultural Heritage)',
        ],
        audioScript: [
          'Welcome to Dinh Co Temple in Long Hai, a cherished coastal monument celebrated for its maritime heritage and annual Dinh Co Festival.',
        ],
      },
      fr: {
        name: 'Temple Dinh Co et plage de Long Hai',
        shortSummary:
          'Monument national surplombant la plage de Long Hai, célèbre pour son festival maritime classé au patrimoine immatériel national.',
        historicalEra: 'Fin du XVIIIe siècle',
        openingHours: '06h00 – 19h00',
        architecturalHighlights: [
          'Temple côtier adossé au mont Ky Van face à la mer',
          'Festival maritime de Dinh Co inscrit au patrimoine immatériel national',
        ],
        audioScript: [
          'Bienvenue au temple Dinh Co de Long Hai, haut lieu des traditions maritimes du Sud.',
        ],
      },
      zh: {
        name: '龙海姑庙历史遗迹',
        shortSummary:
          '坐落于龙海海滩旁的国家级历史文化遗迹，每年农历二月举办的龙海姑庙会已被列入国家级非物质文化遗产。',
        historicalEra: '18世纪末',
        openingHours: '06:00 – 19:00',
        architecturalHighlights: [
          '背靠山峦、面向白沙滩的宏伟海滨庙宇',
          '国家级非物质文化遗产——龙海姑渔民庙会',
        ],
        audioScript: [
          '欢迎来到龙海姑庙历史遗迹，感受浓郁的南海渔村祈福文化。',
        ],
      },
      ja: {
        name: 'ディンコー廟とロンハイ海岸',
        shortSummary:
          '白砂のロンハイ海岸に面した国家歴史文化遺産。漁師の安全を祈るディンコー祭は国家無形文化遺産に登録されています。',
        historicalEra: '18世紀後半',
        openingHours: '06:00 – 19:00',
        architecturalHighlights: [
          '山を背にロンハイ湾を望む壮麗な海辺の廟',
          '国家無形文化遺産のディンコー漁業祭',
        ],
        audioScript: [
          'ロンハイ海岸のディンコー廟へようこそ。海辺の信仰と伝統祭事が息づく名所です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'dclh-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Di tích Dinh Cô bên bờ biển Long Hải',
          en: 'Dinh Co Temple along Long Hai Beach',
          fr: 'Le temple Dinh Co à Long Hai',
          zh: '龙海姑庙海滨景观',
          ja: 'ロンハイのディンコー廟',
        },
        yearOrSource: 'Di tích Lịch sử – Văn hóa cấp Quốc gia (1995)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-lh-1',
        name: 'Chợ Hải Sản Dinh Cô – Long Hải',
        cuisine: 'Hải sản đánh bắt trong ngày',
        specialtyDishes: ['Tôm tích hấp sả', 'Cá bớp nướng muối ớt', 'Mực nang nướng tươi'],
        rating: 4.7,
        reviewCount: 2630,
        priceRange: '100.000đ – 280.000đ',
        lat: 10.3982,
        lng: 107.2271,
        address: 'Khu vực Bãi biển Dinh Cô, Long Hải, TP. Hồ Chí Minh',
        openHours: '07:00 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'nha-tu-con-dao',
    city: 'Côn Đảo · TP. Hồ Chí Minh',
    district: 'Côn Đảo',
    lat: 8.6892,
    lng: 106.6145,
    category: 'monument',
    nationalSpecialMonument: true,
    rating: 4.9,
    reviewCount: 13840,
    ticketPrice: '50.000đ (Vé liên tuyến các điểm di tích)',
    address: 'Đường Nguyễn Chí Thanh, Đặc khu Côn Đảo, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Di tích Quốc gia Đặc biệt Nhà tù Côn Đảo',
        shortSummary:
          'Quần thể Di tích Quốc gia Đặc biệt lưu giữ trọn vẹn 113 năm lịch sử đấu tranh bất khuất (1862–1975) với Trại Phú Hải, Chuồng Cọp kiểu Pháp, Chuồng Cọp kiểu Mỹ, Cầu tàu 914 và Dinh Chúa Đảo.',
        historicalEra: '1862 – 1975 (Di tích Quốc gia Đặc biệt 2012)',
        openingHours: '07:30 – 11:30 & 13:30 – 17:00 Hàng ngày',
        architecturalHighlights: [
          'Trại Phú Hải — nhà tù cổ nhất Côn Đảo xây năm 1862 với hầm xay lúa lịch sử',
          'Khu biệt lập Chuồng Cọp kiểu Pháp (1940) và Chuồng Cọp kiểu Mỹ (1971) được bảo tồn nguyên trạng',
          'Di tích Cầu tàu 914 và Dinh Chúa Đảo bên bờ vịnh Côn Sơn xanh ngọc',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Di tích Quốc gia Đặc biệt Nhà tù Côn Đảo — quần thể lịch sử thiêng liêng thuộc Đặc khu Côn Đảo, Thành phố Hồ Chí Minh.',
          'Tồn tại suốt 113 năm từ 1862 đến 1975, nơi từng bị gọi là địa ngục trần gian này đã trở thành trường học cách mạng rèn luyện ý chí sắt son của biết bao thế hệ chiến sĩ yêu nước Việt Nam.',
          'Hành trình tham quan đưa quý khách qua Trại Phú Hải, Chuồng Cọp kiểu Pháp, Chuồng Cọp kiểu Mỹ và Cầu tàu lịch sử 914.',
        ],
      },
      en: {
        name: 'Con Dao Prison Special National Monument',
        shortSummary:
          'A Special National Historical Monument preserving 113 years of wartime prison history (1862–1975), including Phu Hai Camp, the French and American Tiger Cages, and Historic Pier 914.',
        historicalEra: '1862 – 1975',
        openingHours: '07:30 – 11:30 & 13:30 – 17:00 Daily',
        architecturalHighlights: [
          'Phu Hai Camp (1862), the oldest prison complex on Con Son Island',
          'Preserved French-era (1940) and American-era (1971) Tiger Cages',
          'Historic Pier 914 and the Island Governor’s Palace overlooking Con Son Bay',
        ],
        audioScript: [
          'Welcome to the Con Dao Prison Special National Monument, preserving Phu Hai Camp, the Tiger Cages, and Pier 914 as a solemn tribute to Vietnamese resilience from 1862 to 1975.',
        ],
      },
      fr: {
        name: 'Bagne de Poulo Condor (Prison de Con Dao)',
        shortSummary:
          'Monument historique national spécial témoignant de 113 ans d’histoire (1862–1975) : camp Phu Hai, Cages à Tigres et jetée 914.',
        historicalEra: '1862 – 1975',
        openingHours: '07h30 – 17h00',
        architecturalHighlights: [
          'Camp Phu Hai (1862) et célèbres Cages à Tigres',
          'Jetée historique 914 et Palais du Gouverneur',
        ],
        audioScript: [
          'Bienvenue au monument national spécial de la prison de Con Dao, haut lieu de mémoire de l’histoire vietnamienne.',
        ],
      },
      zh: {
        name: '昆岛监狱特别国家级历史遗迹',
        shortSummary:
          '特别国家级历史遗迹，完整保留1862至1975年间富海营、“虎笼”牢房与914历史码头。',
        historicalEra: '1862 – 1975',
        openingHours: '07:30 – 17:00',
        architecturalHighlights: [
          '建于1862年的富海营与历史“虎笼”监区',
          '914历史码头与昆山湾岛主官邸遗址',
        ],
        audioScript: [
          '欢迎参观昆岛监狱特别国家级历史遗迹，这里铭记了1862至1975年不屈的历史篇章。',
        ],
      },
      ja: {
        name: 'コンダオ刑務所（特別国家史跡）',
        shortSummary:
          '1862〜1975年の歴史を伝える特別国家史跡。フーハイ収容所や「虎の檻」、914桟橋が保存されています。',
        historicalEra: '1862年 – 1975年',
        openingHours: '07:30 – 17:00',
        architecturalHighlights: [
          '1862年建造のフーハイ収容所と歴史的な「虎の檻」',
          'コンソン湾に面した914桟橋と島主官邸跡',
        ],
        audioScript: [
          'コンダオ刑務所特別国家史跡へようこそ。113年におよぶ歴史と平和の尊さを伝える史跡群です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'ntcd-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Quần thể Di tích Quốc gia Đặc biệt Nhà tù Côn Đảo',
          en: 'Con Dao Prison Special National Monument',
          fr: 'Monument national spécial de Con Dao',
          zh: '昆岛监狱特别国家级历史遗迹',
          ja: 'コンダオ刑務所特別国家史跡',
        },
        yearOrSource: 'Di tích Quốc gia Đặc biệt (2012)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cd-nt-1',
        name: 'Bún Riêu Hai Khiêm & Đặc Sản Hạt Bàng Côn Đảo',
        cuisine: 'Đặc sản Côn Đảo',
        specialtyDishes: ['Bún riêu cua biển Hai Khiêm', 'Mứt hạt bàng rang muối', 'Ốc vú nàng nướng mỡ hành'],
        rating: 4.8,
        reviewCount: 3120,
        priceRange: '40.000đ – 120.000đ',
        lat: 8.6879,
        lng: 106.6122,
        address: 'Đường Nguyễn Huệ, Đặc khu Côn Đảo, TP. Hồ Chí Minh',
        openHours: '06:00 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'nghia-trang-hang-duong-con-dao',
    city: 'Côn Đảo · TP. Hồ Chí Minh',
    district: 'Côn Đảo',
    lat: 8.6946,
    lng: 106.6152,
    category: 'monument',
    nationalSpecialMonument: true,
    rating: 4.9,
    reviewCount: 16400,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Đường Nguyễn An Ninh, Đặc khu Côn Đảo, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Nghĩa trang Hàng Dương & Mộ Chị Võ Thị Sáu',
        shortSummary:
          'Nghĩa trang liệt sĩ thiêng liêng bậc nhất cả nước thuộc Quần thể Di tích Quốc gia Đặc biệt Côn Đảo (rộng 19ha), nơi yên nghỉ của gần 2.000 chiến sĩ cách mạng, Anh hùng Võ Thị Sáu, Tổng Bí thư Lê Hồng Phong và nhà yêu nước Nguyễn An Ninh.',
        historicalEra: '1941 – Nay (Di tích Quốc gia Đặc biệt)',
        openingHours: '07:00 – 22:00 Hàng ngày (mở cửa viếng đêm trang nghiêm)',
        architecturalHighlights: [
          'Khuôn viên 19ha chia 4 khu A, B, C, D rợp bóng cây dương liễu cổ thụ trang nghiêm',
          'Tượng đài tưởng niệm cao 21,6m khắc họa tinh thần bất tử của các chiến sĩ Côn Đảo',
          'Phần mộ Anh hùng Lực lượng Vũ trang Nhân dân Võ Thị Sáu, đồng chí Lê Hồng Phong và cụ Nguyễn An Ninh',
        ],
        audioScript: [
          'Chào mừng quý khách đến viếng Nghĩa trang Hàng Dương thiêng liêng tại Đặc khu Côn Đảo, TP. Hồ Chí Minh — nơi yên nghỉ của gần hai ngàn anh hùng liệt sĩ đã ngã xuống vì độc lập tự do của Tổ quốc.',
          'Giữa rừng cây dương liễu vi vu gió biển, nơi đây quy tụ phần mộ đồng chí Tổng Bí thư Lê Hồng Phong, nhà yêu nước Nguyễn An Ninh và nữ Anh hùng đất Đỏ Võ Thị Sáu — điểm hành hương tri ân sâu lắng của đồng bào cả nước.',
        ],
      },
      en: {
        name: 'Hang Duong Cemetery & Vo Thi Sau Memorial',
        shortSummary:
          'Vietnam’s most revered national martyrs’ cemetery on Con Dao (19 hectares), resting place of nearly 2,000 patriots including national heroine Vo Thi Sau, Le Hong Phong, and Nguyen An Ninh.',
        historicalEra: '1941 – Present',
        openingHours: '07:00 – 22:00 Daily',
        architecturalHighlights: [
          '19-hectare pine-shaded memorial grounds divided into four tranquil sections',
          '21.6-meter central monument honoring Con Dao’s fallen heroes',
          'Memorial graves of heroine Vo Thi Sau, Le Hong Phong, and Nguyen An Ninh',
        ],
        audioScript: [
          'Welcome to Hang Duong Cemetery on Con Dao Island, a deeply revered 19-hectare national memorial honoring nearly two thousand Vietnamese patriots, including heroine Vo Thi Sau.',
        ],
      },
      fr: {
        name: 'Cimetière national de Hang Duong (Con Dao)',
        shortSummary:
          'Cimetière mémorial sacré de 19 hectares à Con Dao où reposent près de 2 000 patriotes vietnamiens, dont l’héroïne Vo Thi Sau.',
        historicalEra: '1941 – Aujourd’hui',
        openingHours: '07h00 – 22h00',
        architecturalHighlights: [
          'Mémorial central de 21,6 m au cœur d’une forêt de filaos',
          'Tombes de Vo Thi Sau, Le Hong Phong et Nguyen An Ninh',
        ],
        audioScript: [
          'Bienvenue au cimetière mémorial de Hang Duong à Con Dao, haut lieu de recueillement national.',
        ],
      },
      zh: {
        name: '昆岛航阳烈士陵园（武氏六墓）',
        shortSummary:
          '越南最庄严的国家级烈士陵园之一，占地19公顷，安息着近两千名革命先烈及民族女英雄武氏六。',
        historicalEra: '1941年至今',
        openingHours: '07:00 – 22:00',
        architecturalHighlights: [
          '21.6米高纪念碑与木麻黄林荫陵园',
          '民族英雄武氏六、黎鸿峰与阮安宁长眠之所',
        ],
        audioScript: [
          '欢迎来到昆岛航阳烈士陵园，共同缅怀为独立自由献身的英雄先烈。',
        ],
      },
      ja: {
        name: 'ハンズオン墓地（ヴォー・ティ・サウ記念地）',
        shortSummary:
          '約2,000人の愛国烈士や国民的英雄ヴォー・ティ・サウが眠るコンダオ最大の厳粛な慰霊地です。',
        historicalEra: '1941年 – 現在',
        openingHours: '07:00 – 22:00',
        architecturalHighlights: [
          '高さ21.6mの慰霊塔とモクマオウの並木道',
          'ヴォー・ティ・サウ女史ら歴史上の人物が眠る聖地',
        ],
        audioScript: [
          'コンダオ島の厳粛な慰霊地、ハンズオン墓地へようこそ。多くの先人たちの記憶が静かに息づいています。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'nthd-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Không gian trang nghiêm tại Nghĩa trang Hàng Dương – Côn Đảo',
          en: 'Tranquil memorial grounds of Hang Duong Cemetery, Con Dao',
          fr: 'Le cimetière mémorial de Hang Duong à Con Dao',
          zh: '昆岛航阳烈士陵园',
          ja: 'コンダオ島ハンズオン墓地',
        },
        yearOrSource: 'Quần thể Di tích Quốc gia Đặc biệt Côn Đảo',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cd-hd-1',
        name: 'Hải Sản Chợ Đêm Côn Đảo & Cháo Hàu',
        cuisine: 'Hải sản biển đảo Côn Đảo',
        specialtyDishes: ['Cháo hàu Côn Đảo', 'Cua mặt trăng hấp', 'Cá mú đỏ nướng giấy bạc'],
        rating: 4.8,
        reviewCount: 2540,
        priceRange: '60.000đ – 260.000đ',
        lat: 8.6932,
        lng: 106.6135,
        address: 'Đường Phạm Văn Đồng, Đặc khu Côn Đảo, TP. Hồ Chí Minh',
        openHours: '16:00 – 23:00',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];
