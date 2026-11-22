import { HeritageSite } from '../types/heritage';

/**
 * 17 di tích lịch sử – văn hóa cấp Quốc gia, danh thắng & điểm tham quan chi tiết
 * tại khu vực Vũng Tàu, Đảo Long Sơn, Bà Rịa, Núi Dinh (Phú Mỹ), Long Hải – Đất Đỏ,
 * Hồ Tràm – Bình Châu (Xuyên Mộc) và Đặc khu Côn Đảo (thuộc TP. Hồ Chí Minh mở rộng sau sáp nhập).
 *
 * Kết hợp với 8 điểm đã có trong `hcmMergedBinhDuongVungTauSites.ts` => tổng 25 điểm chi tiết
 * phủ trọn toàn bộ vùng biển đảo Bà Rịa – Vũng Tàu & Côn Đảo.
 */
export const HCM_VUNG_TAU_DETAILED_SITES: HeritageSite[] = [
  // =========================================================================
  // 1. TRUNG TÂM VŨNG TÀU & ĐẢO LONG SƠN (8 ĐIỂM)
  // =========================================================================
  {
    id: 'dinh-than-thang-tam-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3401,
    lng: 107.0827,
    category: 'temple',
    rating: 4.8,
    reviewCount: 4120,
    ticketPrice: 'Miễn phí tham quan',
    address: '77A Hoàng Hoa Thám, Phường Thắng Tam, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Đình Thần Thắng Tam & Lăng Cá Ông Nam Hải (1820)',
        shortSummary:
          'Di tích Lịch sử – Văn hóa cấp Quốc gia (1991) khởi dựng năm 1820 thời vua Minh Mạng để tưởng nhớ 3 vị tiền hiền khai lập ba làng Thắng Nhất – Thắng Nhì – Thắng Tam, gồm Đình thần, Miếu Bà Ngũ Hành và Lăng Ông Nam Hải lưu giữ bộ xương Cá Ông dài 12m.',
        historicalEra: 'Khởi dựng năm 1820 (Triều Minh Mạng)',
        openingHours: '06:30 – 18:00 Hàng ngày',
        architecturalHighlights: [
          'Quần thể kiến trúc tín ngưỡng biển Nam Bộ gồm 3 công trình liên hoàn: Đình thần, Miếu Bà Ngũ Hành và Lăng Ông Nam Hải',
          'Lưu giữ 12 sắc phong triều Nguyễn (Thiệu Trị, Tự Đức) và bộ xương Cá Ông dài hơn 12m dạt vào Bãi Sau hơn 100 năm trước',
          'Trung tâm Lễ hội Nghinh Ông Thắng Tam (16–18/8 âm lịch) — một trong những lễ hội ngư dân lớn nhất nước',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Đình Thần Thắng Tam tại số 77A Hoàng Hoa Thám, Vũng Tàu — Di tích Lịch sử Văn hóa cấp Quốc gia được xây dựng từ năm 1820 dưới triều vua Minh Mạng.',
          'Quần thể gồm Đình thần thờ ba vị tiền hiền khai phá đất Vũng Tàu, Miếu Bà Ngũ Hành và Lăng Ông Nam Hải — nơi tôn trí bộ cốt Cá Ông khổng lồ gắn với tín ngưỡng cầu ngư và Lễ hội Nghinh Ông nổi tiếng mỗi tháng Tám âm lịch.',
        ],
      },
      en: {
        name: 'Thang Tam Communal House & Whale Temple (1820)',
        shortSummary:
          'Built in 1820 under Emperor Minh Mang, this National Cultural Monument honors Vung Tau’s founding pioneers and houses a giant whale skeleton worshipped by local fishermen.',
        historicalEra: 'Founded in 1820',
        openingHours: '06:30 – 18:00 Daily',
        architecturalHighlights: [
          'Three-part coastal complex: Communal House, Five Elements Shrine, and Whale Mausoleum',
          'Preserves 12 Nguyen Dynasty royal decrees and a century-old 12-meter whale skeleton',
          'Center of the annual Nghinh Ong Whale Festival (8th lunar month)',
        ],
        audioScript: [
          'Welcome to Thang Tam Communal House and Whale Temple in Vung Tau, founded in 1820 and revered as the heart of Vung Tau’s maritime heritage and annual Whale Festival.',
        ],
      },
      fr: {
        name: 'Maison communale Thang Tam et Temple de la Baleine (1820)',
        shortSummary:
          'Monument national de 1820 regroupant la maison communale, le sanctuaire des Cinq Éléments et le mausolée abritant un squelette de baleine de 12 m.',
        historicalEra: '1820',
        openingHours: '06h30 – 18h00',
        architecturalHighlights: [
          'Squelette de baleine de 12 m vénéré par les pêcheurs',
          '12 décrets royaux de la dynastie Nguyen',
        ],
        audioScript: [
          'Bienvenue au temple Thang Tam de Vung Tau, haut lieu de la culture maritime fondé en 1820.',
        ],
      },
      zh: {
        name: '胜三亭与南海鲸鱼庙（1820年）',
        shortSummary:
          '始建于1820年明命年间的国家级历史文化遗迹，集亭庙、五行庙与供奉12米鲸鱼骨的南海翁陵于一体。',
        historicalEra: '始建于1820年',
        openingHours: '06:30 – 18:00',
        architecturalHighlights: [
          '珍藏阮朝12道敕封与百年12米鲸鱼遗骨',
          '每年农历八月盛大迎翁节发源地',
        ],
        audioScript: [
          '欢迎参观建于1820年的头顿胜三亭与南海鲸鱼庙，感受南越渔民深厚的海洋信仰。',
        ],
      },
      ja: {
        name: 'タンタム亭・鯨廟（1820年）',
        shortSummary:
          '1820年建立の国家歴史文化遺産。ブンタウ開拓の祖と漁師の守り神である全長12mの鯨の骨格を祀ります。',
        historicalEra: '1820年建立',
        openingHours: '06:30 – 18:00',
        architecturalHighlights: [
          '全長12mの鯨の骨格を祀る南海翁廟と五行廟',
          '旧暦8月に開催される伝統の鯨祭り（ギンオン祭）の拠点',
        ],
        audioScript: [
          '1820年建立のタンタム亭・鯨廟へようこそ。ブンタウの海の信仰と伝統を伝える貴重な史跡です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'dttt-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Quần thể Di tích Quốc gia Đình Thần Thắng Tam & Lăng Cá Ông',
          en: 'Thang Tam Communal House and Whale Temple',
          fr: 'Maison communale Thang Tam',
          zh: '头顿胜三亭与鲸鱼庙',
          ja: 'タンタム亭・鯨廟',
        },
        yearOrSource: 'Di tích Lịch sử – Văn hóa cấp Quốc gia (1991)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-tt-1',
        name: 'Bánh Khọt Cô Ba Vũng Tàu – Hoàng Hoa Thám',
        cuisine: 'Đặc sản Vũng Tàu',
        specialtyDishes: ['Bánh khọt tôm mực giòn', 'Bánh xèo hải sản', 'Gỏi cuốn tôm thịt'],
        rating: 4.7,
        reviewCount: 6820,
        priceRange: '55.000đ – 110.000đ',
        lat: 10.3418,
        lng: 107.0812,
        address: '01 Hoàng Hoa Thám, Phường 3, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '07:00 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'linh-son-co-tu-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3396,
    lng: 107.0819,
    category: 'temple',
    rating: 4.8,
    reviewCount: 2890,
    ticketPrice: 'Miễn phí tham quan',
    address: '104 Hoàng Hoa Thám, Phường 2, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Linh Sơn Cổ Tự (Ngôi chùa cổ nhất Vũng Tàu)',
        shortSummary:
          'Di tích Lịch sử – Văn hóa cấp Quốc gia (1991), ngôi chùa lâu đời nhất tại Vũng Tàu (dời từ sườn Núi Nhỏ về năm 1919), lưu giữ bảo vật tượng Đức Phật bằng sa thạch phong cách Chămpa thế kỷ VII cao 1,2m.',
        historicalEra: 'Thế kỷ XIX – Dời về vị trí hiện nay năm 1919',
        openingHours: '06:00 – 19:00 Hàng ngày',
        architecturalHighlights: [
          'Tượng Đức Phật bằng đá sa thạch cao 1,2m thếp vàng mang dấu ấn điêu khắc Chămpa – Phù Nam thế kỷ VII',
          'Không gian chùa cổ rợp bóng cây bồ đề và đại thụ yên bình ngay trung tâm phố biển',
          'Nằm liền kề Đình Thần Thắng Tam tạo thành cụm di tích văn hóa – tâm linh cổ kính nhất Vũng Tàu',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Linh Sơn Cổ Tự tại số 104 Hoàng Hoa Thám — ngôi chùa cổ xưa nhất của Vũng Tàu, được công nhận Di tích Lịch sử Văn hóa cấp Quốc gia năm 1991.',
          'Bên trong chính điện cổ kính tôn trí pho tượng Đức Phật tạc bằng đá sa thạch cao 1,2 mét có niên đại khoảng thế kỷ thứ 7, được người dân phát hiện trên sườn Núi Nhỏ hơn một thế kỷ trước.',
        ],
      },
      en: {
        name: 'Linh Son Ancient Pagoda (Oldest Temple in Vung Tau)',
        shortSummary:
          'Vung Tau’s oldest pagoda and a National Cultural Monument (1991), safeguarding a gilded 7th-century sandstone Buddha statue discovered on Nho Mountain.',
        historicalEra: '19th Century (Relocated 1919)',
        openingHours: '06:00 – 19:00 Daily',
        architecturalHighlights: [
          'Rare 1.2m gilded sandstone Buddha statue dating back to the 7th century',
          'Peaceful shaded courtyard adjacent to Thang Tam Communal House',
        ],
        audioScript: [
          'Welcome to Linh Son Ancient Pagoda, Vung Tau’s oldest Buddhist temple, treasured for its 7th-century sandstone Buddha statue.',
        ],
      },
      fr: {
        name: 'Pagode ancienne Linh Son',
        shortSummary:
          'Plus ancienne pagode de Vung Tau (monument national), abritant une statue de Bouddha en grès doré du VIIe siècle.',
        historicalEra: 'XIXe siècle',
        openingHours: '06h00 – 19h00',
        architecturalHighlights: [
          'Statue de Bouddha en grès du VIIe siècle (1,2 m)',
          'Cour paisible ombragée de figuiers sacrés',
        ],
        audioScript: [
          'Bienvenue à la pagode Linh Son, la plus ancienne pagode de Vung Tau.',
        ],
      },
      zh: {
        name: '灵山古寺（头顿最古老寺庙）',
        shortSummary:
          '国家级历史文化遗迹，头顿历史最悠久的古寺，供奉一尊出土于小山、距今千年的七世纪砂岩贴金佛像。',
        historicalEra: '19世纪（1919年迁建）',
        openingHours: '06:00 – 19:00',
        architecturalHighlights: [
          '珍贵的七世纪1.2米砂岩贴金古佛像',
          '与胜三亭相邻的静谧古刹庭院',
        ],
        audioScript: [
          '欢迎来到头顿最古老的佛寺——灵山古寺，瞻仰珍贵的七世纪古石佛。',
        ],
      },
      ja: {
        name: 'リンソン古寺（ブンタウ最古の寺院）',
        shortSummary:
          'ブンタウ最古の仏教寺院（国家遺産）。7世紀の貴重な砂岩製仏像（高さ1.2m）を本尊として祀っています。',
        historicalEra: '19世紀建立',
        openingHours: '06:00 – 19:00',
        architecturalHighlights: [
          '7世紀に造られた高さ1.2mの金箔砂岩仏像',
          '街の中心に佇む静寂な境内',
        ],
        audioScript: [
          'ブンタウ最古の寺院・リンソン古寺へようこそ。7世紀の貴重な石仏が安置されています。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'lsct-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Linh Sơn Cổ Tự – Di tích Quốc gia trên đường Hoàng Hoa Thám',
          en: 'Linh Son Ancient Pagoda in Vung Tau',
          fr: 'Pagode Linh Son à Vung Tau',
          zh: '头顿灵山古寺',
          ja: 'ブンタウのリンソン古寺',
        },
        yearOrSource: 'Di tích Lịch sử – Văn hóa cấp Quốc gia (1991)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-ls-1',
        name: 'Bánh Bông Lan Trứng Muối Gốc Cột Điện',
        cuisine: 'Đặc sản bánh Vũng Tàu',
        specialtyDishes: ['Bánh bông lan trứng muối phô mai nướng than', 'Bánh kẹp lá dứa', 'Trà tắc mát lạnh'],
        rating: 4.8,
        reviewCount: 8410,
        priceRange: '30.000đ – 70.000đ',
        lat: 10.3376,
        lng: 107.0793,
        address: '17B Nguyễn Trường Tộ, Phường 2, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '06:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'niet-ban-tinh-xa-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3292,
    lng: 107.0752,
    category: 'temple',
    rating: 4.8,
    reviewCount: 6240,
    ticketPrice: 'Miễn phí tham quan',
    address: '66/7 Hạ Long, Khu vực Bãi Dứa, Phường 2, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Niết Bàn Tịnh Xá – Chùa Phật Nằm Bãi Dứa',
        shortSummary:
          'Di tích Lịch sử – Văn hóa cấp Quốc gia (1989) xây dựng năm 1969–1974 trên triền Núi Nhỏ hướng thẳng ra biển Bãi Dứa, nổi danh là một trong những ngôi chùa đẹp nhất Vũng Tàu với tượng Phật nằm dài 12m và tháp 42 bậc.',
        historicalEra: '1969 – 1974 (Di tích Quốc gia 1989)',
        openingHours: '06:00 – 19:00 Hàng ngày',
        architecturalHighlights: [
          'Tượng Đức Phật Thích Ca nhập Niết Bàn dài 12m sơn son thếp vàng đặt trên bệ chạm khắc tinh tế',
          'Tháp cao 21m ốp gạch men màu với 42 bậc thang tượng trưng 42 trang kinh Phật đầu tiên truyền vào Việt Nam',
          'Lư hương đồng "Tứ Linh" và Đại Hồng Chung nặng 3,5 tấn vang vọng giữa gió biển Bãi Dứa',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Niết Bàn Tịnh Xá — còn gọi là Chùa Phật Nằm — tọa lạc trên sườn Núi Nhỏ hướng mặt ra biển Bãi Dứa thơ mộng.',
          'Khởi công năm 1969 và khánh thành năm 1974, tịnh xá nổi tiếng với pho tượng Đức Phật nhập Niết Bàn dài 12 mét, ngọn tháp 21 mét cùng chiếc đại hồng chung nặng 3,5 tấn vang tiếng thanh tao bên sóng biển.',
        ],
      },
      en: {
        name: 'Niet Ban Tinh Xa (Reclining Buddha Pagoda, Bai Dua)',
        shortSummary:
          'Built from 1969 to 1974 on the ocean-facing slope of Nho Mountain, this National Monument showcases a 12-meter Reclining Buddha, a 21m ceramic stupa, and a 3.5-ton bronze bell.',
        historicalEra: '1969 – 1974',
        openingHours: '06:00 – 19:00 Daily',
        architecturalHighlights: [
          '12-meter gilded Reclining Buddha centerpiece',
          '21m tiled tower with 42 steps symbolizing the 42-chapter sutra',
          '3.5-ton bronze temple bell overlooking Pineapple Beach (Bai Dua)',
        ],
        audioScript: [
          'Welcome to Niet Ban Tinh Xa overlooking Bai Dua beach, admired as one of Vung Tau’s most scenic pagodas with its 12-meter Reclining Buddha.',
        ],
      },
      fr: {
        name: 'Pagode Niet Ban Tinh Xa (Bouddha couché)',
        shortSummary:
          'Édifiée entre 1969 et 1974 face à la plage Bai Dua, célèbre pour son Bouddha couché de 12 m et sa cloche de 3,5 tonnes.',
        historicalEra: '1969 – 1974',
        openingHours: '06h00 – 19h00',
        architecturalHighlights: [
          'Bouddha couché doré de 12 mètres',
          'Cloche en bronze de 3,5 tonnes face à la mer',
        ],
        audioScript: [
          'Bienvenue à Niet Ban Tinh Xa, l’une des plus belles pagodes de la côte de Vung Tau.',
        ],
      },
      zh: {
        name: '涅槃净舍（头顿卧佛寺）',
        shortSummary:
          '建于1969至1974年的国家级文化遗迹，面朝菠萝湾海景，供奉12米长释迦卧佛与3.5吨大铜钟。',
        historicalEra: '1969 – 1974',
        openingHours: '06:00 – 19:00',
        architecturalHighlights: [
          '12米长贴金释迦牟尼涅槃卧佛像',
          '21米彩瓷佛塔与3.5吨海景大洪钟',
        ],
        audioScript: [
          '欢迎来到头顿海滨的涅槃净舍，欣赏12米庄严卧佛与蔚蓝海景。',
        ],
      },
      ja: {
        name: 'ニエッバン・ティンサー（涅槃仏寺院）',
        shortSummary:
          '1969〜1974年建立の国家遺産。バイズア湾を見下ろす斜面に建ち、全長12mの涅槃仏と3.5トンの大鐘が見どころです。',
        historicalEra: '1969年 – 1974年',
        openingHours: '06:00 – 19:00',
        architecturalHighlights: [
          '全長12mの荘厳な金箔涅槃仏',
          '海を見渡す高さ21mの仏塔と3.5トンの大鐘',
        ],
        audioScript: [
          'バイズア海岸を望む美しい寺院、ニエッバン・ティンサーへようこそ。全長12mの涅槃仏が迎えてくれます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'nbtx-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Niết Bàn Tịnh Xá hướng ra biển Bãi Dứa – Vũng Tàu',
          en: 'Niet Ban Tinh Xa Pagoda facing Bai Dua Beach',
          fr: 'Niet Ban Tinh Xa face à la baie Bai Dua',
          zh: '头顿涅槃净舍',
          ja: 'ニエッバン・ティンサー寺院',
        },
        yearOrSource: 'Di tích Lịch sử – Văn hóa cấp Quốc gia (1989)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-nb-1',
        name: 'Cà Phê Biển Bãi Dứa – Đường Hạ Long',
        cuisine: 'Cà phê view biển hoàng hôn',
        specialtyDishes: ['Cà phê dừa đá xay', 'Trà đào cam sả', 'Bánh tiramisu'],
        rating: 4.7,
        reviewCount: 2890,
        priceRange: '45.000đ – 85.000đ',
        lat: 10.3304,
        lng: 107.0741,
        address: 'Đường Hạ Long, Bãi Dứa, Phường 2, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '06:30 – 22:30',
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'bao-tang-vu-khi-co-robert-taylor',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3446,
    lng: 107.0725,
    category: 'museum',
    rating: 4.9,
    reviewCount: 5480,
    ticketPrice: '70.000đ (Khách Việt) · 100.000đ (Khách quốc tế)',
    address: '98 Trần Hưng Đạo, Phường 1, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Bảo tàng Vũ khí Cổ Toàn cầu (Robert Taylor Museum)',
        shortSummary:
          'Bảo tàng tư nhân độc đáo bậc nhất Việt Nam đặt trong biệt thự Pháp cổ tại trung tâm Bãi Trước, trưng bày hơn 3.000 hiện vật vũ khí, giáp trụ và quân phục nguyên bản từ thời La Mã, Samurai Nhật Bản đến Hiệp sĩ châu Âu.',
        historicalEra: 'Bộ sưu tập hơn 50 năm – Mở cửa tại Vũng Tàu 2016',
        openingHours: '08:00 – 17:00 Hàng ngày',
        architecturalHighlights: [
          'Ngôi biệt thự Pháp cổ 3 tầng rộng 1.500m² được bảo tồn tinh tế ngay trục đường Trần Hưng Đạo',
          'Hơn 3.000 hiện vật nguyên bản: giáp sắt Thập tự chinh, kiếm Katana Samurai, súng hỏa mai thế kỷ 17 và quân phục cận đại',
          'Không gian trưng bày khoa học chia theo 3 thời kỳ: Cổ đại, Trung đại và Cận – Hiện đại',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Bảo tàng Vũ khí Cổ Toàn cầu Robert Taylor tại số 98 Trần Hưng Đạo, Phường 1, Vũng Tàu.',
          'Bên trong ngôi biệt thự Pháp cổ kính là bộ sưu tập kỳ công suốt hơn 50 năm với hơn 3.000 hiện vật thật từ khắp năm châu — từ giáp trụ chiến binh Hy Lạp, La Mã, kiếm Samurai Nhật Bản đến những khẩu súng hỏa mai quý hiếm thế kỷ 17.',
        ],
      },
      en: {
        name: 'Worldwide Arms Museum (Robert Taylor Collection)',
        shortSummary:
          'Housed in a charming French colonial villa near Front Beach, showcasing over 3,000 authentic antique arms, Samurai armor, Crusader mail, and historic military uniforms.',
        historicalEra: 'Private Collection · Opened 2016',
        openingHours: '08:00 – 17:00 Daily',
        architecturalHighlights: [
          'Over 3,000 genuine artifacts spanning Greek, Roman, Samurai, Medieval European, and modern eras',
          'Restored 3-story French colonial mansion in central Vung Tau',
        ],
        audioScript: [
          'Welcome to the Worldwide Arms Museum in Vung Tau, an extraordinary collection of over 3,000 historic uniforms, swords, and armor assembled over five decades.',
        ],
      },
      fr: {
        name: 'Musée mondial des armes anciennes (Robert Taylor)',
        shortSummary:
          'Installé dans une villa coloniale française, ce musée expose plus de 3 000 armes, armures de samouraïs et uniformes historiques.',
        historicalEra: 'Ouvert en 2016',
        openingHours: '08h00 – 17h00',
        architecturalHighlights: [
          'Plus de 3 000 pièces authentiques de l’Antiquité à l’époque moderne',
          'Villa coloniale restaurée au cœur de Vung Tau',
        ],
        audioScript: [
          'Bienvenue au musée Robert Taylor de Vung Tau, l’une des plus riches collections d’armes anciennes d’Asie du Sud-Est.',
        ],
      },
      zh: {
        name: '头顿世界古兵器博物馆（罗伯特·泰勒）',
        shortSummary:
          '坐落于法式古别墅内的特色博物馆，展出3000余件涵盖古罗马、日本武士及欧洲中世纪骑士的珍贵兵器与盔甲。',
        historicalEra: '2016年开馆',
        openingHours: '08:00 – 17:00',
        architecturalHighlights: [
          '3000余件横跨古今的世界历史军服与冷热兵器原件',
          '优雅复古的三层法式殖民时期别墅展馆',
        ],
        audioScript: [
          '欢迎参观头顿世界古兵器博物馆，近距离欣赏三千余件跨越千年的世界历史兵器珍藏。',
        ],
      },
      ja: {
        name: '世界古兵器博物館（ロバート・テイラー博物館）',
        shortSummary:
          'フランス様式の洋館に3,000点以上の貴重な武具や甲冑、侍の刀剣、軍服を展示するベトナム屈指の博物館です。',
        historicalEra: '2016年開館',
        openingHours: '08:00 – 17:00',
        architecturalHighlights: [
          '古代ローマから日本の侍、中世騎士まで3,000点超の本物のコレクション',
          '前浜近くの趣あるフランス式邸宅',
        ],
        audioScript: [
          'ブンタウの世界古兵器博物館へようこそ。50年以上かけて収集された3,000点以上の貴重な歴史資料をご覧いただけます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'btvk-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Bảo tàng Vũ khí Cổ Robert Taylor – 98 Trần Hưng Đạo',
          en: 'Worldwide Arms Museum in Vung Tau',
          fr: 'Musée Robert Taylor à Vung Tau',
          zh: '头顿世界古兵器博物馆',
          ja: '世界古兵器博物館',
        },
        yearOrSource: 'Bảo tàng Vũ khí Cổ Toàn cầu Vũng Tàu',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-vk-1',
        name: 'Bánh Mì Không Tên (Hàng Quyên – Đồ Chiểu)',
        cuisine: 'Bánh mì gia truyền Vũng Tàu',
        specialtyDishes: ['Bánh mì xíu mại pate chả lụa', 'Sữa đậu nành nóng'],
        rating: 4.8,
        reviewCount: 3940,
        priceRange: '25.000đ – 40.000đ',
        lat: 10.3469,
        lng: 107.0748,
        address: 'Ngã tư Đồ Chiểu – Lý Thường Kiệt, Phường 1, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '06:00 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'mui-nghinh-phong-cong-troi',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3204,
    lng: 107.0846,
    category: 'ancient_town',
    rating: 4.7,
    reviewCount: 18450,
    ticketPrice: 'Miễn phí tham quan',
    address: '01 Hạ Long, Phường 2, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Mũi Nghinh Phong & Cổng Trời Vũng Tàu',
        shortSummary:
          'Mũi đất vươn dài nhất phía Nam bán đảo Vũng Tàu với thế "lưng tựa Núi Nhỏ, mặt hướng Biển Đông", nổi tiếng với khung Cổng Trời hướng ra đại dương, hai bãi tắm Vọng Nguyệt – Hương Phong và làn gió biển thổi quanh năm.',
        historicalEra: 'Danh thắng thiên nhiên cực Nam Vũng Tàu',
        openingHours: 'Mở cửa tự do 24/7 (Đẹp nhất lúc bình minh & hoàng hôn)',
        architecturalHighlights: [
          'Cổng Trời màu vàng hướng thẳng ra biển xanh — góc chụp ảnh biểu tượng của du lịch Vũng Tàu',
          'Hai mặt giáp biển tạo nên Bãi Vọng Nguyệt hoang sơ bên phải và vịnh Hòn Bà bên trái',
          'Bậc thang đá dẫn xuống bãi cát trắng mịn và cung đường ven biển Hạ Long tuyệt đẹp',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Mũi Nghinh Phong — mũi đất cực Nam của bán đảo Vũng Tàu có nghĩa là mũi đón gió, nơi gió biển thổi mát rượi suốt bốn mùa.',
          'Bước qua khung Cổng Trời nổi tiếng, trước mắt quý khách là đại dương xanh ngát cùng hai bãi tắm tuyệt đẹp Vọng Nguyệt và Hương Phong uốn lượn dưới chân Núi Nhỏ.',
        ],
      },
      en: {
        name: 'Nghinh Phong Cape & Heaven’s Gate',
        shortSummary:
          'The breezy southernmost promontory of Vung Tau Peninsula, famous for its ocean-framing Heaven’s Gate archway, secluded Vong Nguyet Beach, and dramatic cliffside sunsets.',
        historicalEra: 'Natural Coastal Landmark',
        openingHours: 'Open 24/7',
        architecturalHighlights: [
          'Iconic yellow Heaven’s Gate framing the East Sea horizon',
          'Twin crescent coves: Vong Nguyet Beach and Huong Phong Bay',
        ],
        audioScript: [
          'Welcome to Nghinh Phong Cape, meaning Wind-Welcoming Cape, prized for its iconic Heaven’s Gate viewpoint and sweeping sea breezes.',
        ],
      },
      fr: {
        name: 'Cap Nghinh Phong et Porte du Ciel',
        shortSummary:
          'Pointe la plus méridionale de Vung Tau, célèbre pour sa Porte du Ciel ouverte sur l’océan et ses criques sauvages.',
        historicalEra: 'Site naturel côtier',
        openingHours: 'Ouvert 24h/24',
        architecturalHighlights: [
          'Arche panoramique dite « Porte du Ciel » face à la mer',
          'Plage sauvage de Vong Nguyet au pied de la falaise',
        ],
        audioScript: [
          'Bienvenue au cap Nghinh Phong, le cap des vents de Vung Tau offrant une vue spectaculaire sur la mer.',
        ],
      },
      zh: {
        name: '迎风角与头顿天空之门',
        shortSummary:
          '头顿半岛最南端常年海风习习的海角，以面朝碧海的网红“天空之门”与原生态望月湾沙滩闻名。',
        historicalEra: '海滨自然名胜',
        openingHours: '全天开放',
        architecturalHighlights: [
          '面朝辽阔南海的标志性“天空之门”打卡拱门',
          '山海相依的望月湾与香风双海湾',
        ],
        audioScript: [
          '欢迎来到头顿最南端的迎风角，穿过天空之门即可饱览壮阔海景。',
        ],
      },
      ja: {
        name: 'ニンフォン岬と天空の門',
        shortSummary:
          'ブンタウ半島最南端の爽やかな海風が吹き抜ける岬。大海原を切り取る「天空の門」が人気の絶景スポットです。',
        historicalEra: '自然景勝地',
        openingHours: '24時間開放',
        architecturalHighlights: [
          '海へと続くフォトジェニックな「天空の門」',
          '断崖の下に広がる静かなヴォングエットビーチ',
        ],
        audioScript: [
          '一年中心地よい海風が吹くニンフォン岬へようこそ。「天空の門」から望む水平線が格別です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'mnp-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Biển xanh tại Mũi Nghinh Phong – Vũng Tàu',
          en: 'Nghinh Phong Cape coastline, Vung Tau',
          fr: 'Côte du cap Nghinh Phong',
          zh: '迎风角海滨全景',
          ja: 'ニンフォン岬の海岸',
        },
        yearOrSource: 'Danh thắng Mũi Nghinh Phong',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-mnp-1',
        name: 'Quán Cà Phê & Hải Sản Ô Quắn – Hạ Long',
        cuisine: 'Cà phê & Ẩm thực ven biển',
        specialtyDishes: ['Nước dừa xiêm lạnh', 'Cà phê muối', 'Mực nướng sa tế'],
        rating: 4.6,
        reviewCount: 1980,
        priceRange: '35.000đ – 150.000đ',
        lat: 10.3238,
        lng: 107.0819,
        address: 'Đường Hạ Long, Phường 2, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '07:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'ho-may-park-nui-lon-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3547,
    lng: 107.0681,
    category: 'imperial',
    rating: 4.6,
    reviewCount: 12100,
    ticketPrice: '200.000đ – 400.000đ (Bao gồm cáp treo khứ hồi)',
    address: '1A Trần Phú, Phường 1, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Khu Du lịch Hồ Mây – Cáp treo Núi Lớn & Trận địa Pháo cổ',
        shortSummary:
          'Tổ hợp sinh thái – văn hóa trên đỉnh Núi Lớn (độ cao 210m) được ví như "Đà Lạt giữa phố biển", kết nối bằng tuyến cáp treo ngắm toàn vịnh Bãi Trước cùng di tích Quốc gia Trận địa pháo Sao Mai & Hầm thủy lôi thời Pháp.',
        historicalEra: 'Trận địa pháo cuối thế kỷ XIX · Khu du lịch từ 2010',
        openingHours: '08:00 – 22:00 Hàng ngày',
        architecturalHighlights: [
          'Tuyến cáp treo xuyên núi ngắm toàn cảnh Bãi Trước, Bạch Dinh và vịnh Ghềnh Rái từ trên cao',
          'Di tích Lịch sử Quốc gia Trận địa pháo cổ Sao Mai và Hầm thủy lôi trên sườn Núi Lớn',
          'Hồ nước nhân tạo trên đỉnh núi, Tượng Phật Di Lặc cao 30m, rừng thông Caribe và công viên nước trên cao',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Khu Du lịch Hồ Mây trên đỉnh Núi Lớn Vũng Tàu ở độ cao 210 mét so với mực nước biển.',
          'Không chỉ mang lại trải nghiệm cáp treo ngắm biển tuyệt đẹp và khí hậu mát dịu quanh năm, sườn Núi Lớn còn lưu giữ Di tích Quốc gia Trận địa pháo cổ Sao Mai và Hầm thủy lôi được xây dựng từ cuối thế kỷ 19.',
        ],
      },
      en: {
        name: 'Ho May Park (Lon Mountain Cable Car & Historic Cannon Battery)',
        shortSummary:
          'Perched 210m atop Lon Mountain via scenic cable car, combining cool pine-covered lake gardens, a 30m Maitreya Buddha, and the 19th-century Sao Mai Artillery Battery monument.',
        historicalEra: '19th-Century Battery · Park Opened 2010',
        openingHours: '08:00 – 22:00 Daily',
        architecturalHighlights: [
          'Scenic cable car ride soaring above Front Beach and White Palace',
          'Historic Sao Mai French-era artillery emplacement and torpedo tunnel',
          'Mountaintop lake, pine groves, and 30m Maitreya Buddha statue',
        ],
        audioScript: [
          'Welcome to Ho May Park atop Lon Mountain, accessible by cable car and home to cool pine forests, panoramic sea views, and the historic 19th-century Sao Mai artillery site.',
        ],
      },
      fr: {
        name: 'Parc Ho May (Téléphérique du Mont Lon et batterie historique)',
        shortSummary:
          'Parc perché à 210 m d’altitude accessible par téléphérique, mêlant jardins frais, Bouddha Maitreya de 30 m et ancienne batterie d’artillerie.',
        historicalEra: 'XIXe siècle / 2010',
        openingHours: '08h00 – 22h00',
        architecturalHighlights: [
          'Téléphérique panoramique surplombant la baie de Vung Tau',
          'Ancienne batterie d’artillerie historique de Sao Mai',
        ],
        audioScript: [
          'Bienvenue au parc Ho May au sommet du mont Lon, offrant un panorama spectaculaire sur Vung Tau.',
        ],
      },
      zh: {
        name: '头顿云湖缆车景区与古炮台遗址',
        shortSummary:
          '乘观海缆车登临海拔210米大山山顶，集清凉松林湖泊、30米弥勒佛与19世纪古炮台遗迹于一体。',
        historicalEra: '19世纪古炮台 / 2010年开园',
        openingHours: '08:00 – 22:00',
        architecturalHighlights: [
          '俯瞰前滩与白宫的跨山观海缆车',
          '国家级历史遗迹——早星古炮台与水雷坑道',
        ],
        audioScript: [
          '欢迎来到头顿大山云湖景区，乘坐缆车即可纵览海湾全景与古炮台遗迹。',
        ],
      },
      ja: {
        name: 'ホーメイ公園（ロン山ロープウェイ・古砲台跡）',
        shortSummary:
          '海抜210mのロン山山頂へロープウェイで登る絶景リゾート。19世紀のサオマイ古砲台遺跡や松林の湖が広がります。',
        historicalEra: '19世紀砲台 / 2010年開園',
        openingHours: '08:00 – 22:00',
        architecturalHighlights: [
          '前浜と白宮を見下ろす絶景ロープウェイ',
          '歴史的価値のあるサオマイ古砲台跡',
        ],
        audioScript: [
          'ロープウェイで登るロン山山頂のホーメイ公園へようこそ。涼やかな松林と海の大パノラマが楽しめます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'hmvt-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Cảnh biển nhìn từ đỉnh Núi Lớn – Hồ Mây Vũng Tàu',
          en: 'View from Lon Mountain and Ho May Park',
          fr: 'Vue depuis le mont Lon à Vung Tau',
          zh: '大山云湖景区俯瞰海景',
          ja: 'ロン山・ホーメイ公園からの眺望',
        },
        yearOrSource: 'Khu du lịch Hồ Mây & Di tích Núi Lớn',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-hm-1',
        name: 'Nhà Hàng Hải Sản Bến Đá – Trần Phú',
        cuisine: 'Hải sản tươi sống cảng cá',
        specialtyDishes: ['Bạch tuộc nướng muối ớt', 'Cơm chiên hải sản', 'Canh chua cá bớp'],
        rating: 4.6,
        reviewCount: 2410,
        priceRange: '120.000đ – 320.000đ',
        lat: 10.3578,
        lng: 107.0654,
        address: 'Đường Trần Phú, Phường 5, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '09:30 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'bao-tang-ba-ria-vung-tau',
    city: 'Vũng Tàu · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.3489,
    lng: 107.0695,
    category: 'museum',
    rating: 4.8,
    reviewCount: 3650,
    ticketPrice: '40.000đ',
    address: '04 Trần Phú, Phường 1, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Bảo tàng Bà Rịa – Vũng Tàu (Bãi Trước)',
        shortSummary:
          'Bảo tàng hiện đại tọa lạc ngay trục di sản Bãi Trước cạnh Bạch Dinh, lưu giữ hơn 28.000 hiện vật quý về văn hóa tiền sử Đồng Nai, cổ vật trục vớt tàu đắm biển Đông, dầu khí Việt Nam và lịch sử Côn Đảo.',
        historicalEra: 'Khánh thành tòa nhà mới năm 2020',
        openingHours: '07:30 – 11:30 & 13:30 – 17:00 (Thứ 3 – Chủ nhật)',
        architecturalHighlights: [
          'Không gian trưng bày 4 tầng hiện đại hướng thẳng ra vịnh Bãi Trước đầy ánh sáng tự nhiên',
          'Bộ sưu tập khảo cổ văn hóa Đồng Nai hơn 3.000 năm tuổi (di chỉ Giồng Cá Vồ, Giồng Lớn – Long Sơn)',
          'Chuyên đề độc đáo về cổ vật tàu đắm Hòn Cau, ngành dầu khí biển Đông và đặc khu Côn Đảo',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Bảo tàng Bà Rịa – Vũng Tàu tại số 4 Trần Phú, ngay sát chân đồi Bạch Dinh nhìn ra Bãi Trước.',
          'Với hơn 28.000 hiện vật quý giá trải dài trên 4 tầng trưng bày hiện đại, bảo tàng tái hiện sống động 3.000 năm lịch sử vùng đất biển đảo từ văn hóa khảo cổ Giồng Lớn đến hành trình chinh phục dầu khí Biển Đông.',
        ],
      },
      en: {
        name: 'Ba Ria – Vung Tau Museum (Front Beach)',
        shortSummary:
          'A striking modern waterfront museum next to White Palace showcasing 28,000 artifacts from 3,000-year-old Giong Lon archaeology, shipwreck ceramics, offshore energy, and Con Dao history.',
        historicalEra: 'New Wing Opened 2020',
        openingHours: '07:30 – 17:00 (Tue – Sun)',
        architecturalHighlights: [
          'Four-story modern exhibition halls facing Front Beach',
          '3,000-year-old Giong Lon – Long Son gold mask and ancient burial relics',
          'Maritime shipwreck treasures and Vietnam offshore oil & gas heritage',
        ],
        audioScript: [
          'Welcome to the Ba Ria – Vung Tau Museum along Front Beach, displaying 28,000 artifacts spanning 3,000 years of coastal archaeology and maritime history.',
        ],
      },
      fr: {
        name: 'Musée de Ba Ria – Vung Tau',
        shortSummary:
          'Musée moderne face à la baie présentant 28 000 objets archéologiques vieux de 3 000 ans, céramiques d’épaves et histoire maritime.',
        historicalEra: 'Nouveau bâtiment 2020',
        openingHours: '07h30 – 17h00',
        architecturalHighlights: [
          'Quatre niveaux d’exposition modernes face à la mer',
          'Objets archéologiques du site antique de Giong Lon (Long Son)',
        ],
        audioScript: [
          'Bienvenue au musée de Ba Ria – Vung Tau, vitrine de trois millénaires d’histoire maritime.',
        ],
      },
      zh: {
        name: '巴地头顿博物馆',
        shortSummary:
          '毗邻白宫的现代化海滨博物馆，馆藏2.8万余件文物，涵盖三千年前龙山古墓考古、南海沉船古瓷与海洋石油历史。',
        historicalEra: '2020年新馆落成',
        openingHours: '07:30 – 17:00（周二至周日）',
        architecturalHighlights: [
          '四层现代化观海展厅，馆藏28,000余件文物',
          '距今3000年的龙山古遗址黄金面具与南海沉船珍宝',
        ],
        audioScript: [
          '欢迎参观巴地头顿博物馆，通过2.8万件珍贵文物探索三千年海疆文化。',
        ],
      },
      ja: {
        name: 'バリア・ブンタウ博物館',
        shortSummary:
          '白宮の隣に建つ近代的な海辺の博物館。3,000年前のロンソン遺跡出土品や沈没船陶磁など28,000点を収蔵します。',
        historicalEra: '2020年新館開館',
        openingHours: '07:30 – 17:00（火〜日）',
        architecturalHighlights: [
          '海を望む4階建ての近代的展示スペース',
          '3,000年前の古代遺跡遺物と沈没船コレクション',
        ],
        audioScript: [
          'バリア・ブンタウ博物館へようこそ。3,000年にわたる沿岸部の考古学と海洋史をわかりやすく紹介しています。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'btbrvt-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Bảo tàng Bà Rịa – Vũng Tàu bên Bãi Trước',
          en: 'Ba Ria – Vung Tau Museum at Front Beach',
          fr: 'Musée de Ba Ria – Vung Tau',
          zh: '巴地头顿博物馆',
          ja: 'バリア・ブンタウ博物館',
        },
        yearOrSource: 'Bảo tàng Bà Rịa – Vũng Tàu',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-bt-1',
        name: 'Bánh Canh Ghẹ Anh Vy – Võ Thị Sáu',
        cuisine: 'Đặc sản biển Vũng Tàu',
        specialtyDishes: ['Bánh canh ghẹ nguyên con', 'Chả cá thu chiên', 'Bánh quẩy nóng'],
        rating: 4.7,
        reviewCount: 4120,
        priceRange: '55.000đ – 95.000đ',
        lat: 10.3432,
        lng: 107.0785,
        address: '109 Võ Thị Sáu, Phường 2, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '06:30 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'nha-lon-long-son-den-ong-tran',
    city: 'Đảo Long Sơn · Vũng Tàu (TP.HCM)',
    district: 'Vũng Tàu',
    lat: 10.4494,
    lng: 107.0537,
    category: 'imperial',
    rating: 4.8,
    reviewCount: 4780,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Thôn 5, Xã đảo Long Sơn, Vũng Tàu, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Di tích Quốc gia Nhà Lớn Long Sơn (Đền Ông Trần 1910)',
        shortSummary:
          'Di tích Lịch sử – Kiến trúc Nghệ thuật cấp Quốc gia (1991) rộng 2ha dưới chân Núi Nứa trên đảo Long Sơn, do Ông Trần (Lê Văn Mưu) khởi dựng từ 1910–1929 với quần thể Đền thờ, Nhà hội, trường học, chợ và truyền thống hiếu khách đãi cơm miễn phí cho du khách.',
        historicalEra: '1910 – 1929 (Di tích Quốc gia 1991)',
        openingHours: '06:00 – 18:00 Hàng ngày',
        architecturalHighlights: [
          'Quần thể kiến trúc gỗ truyền thống rộng 2ha gồm Nhà Thờ, Nhà Hội, Trường học, Chợ, kho thóc và Lăng mộ Ông Trần',
          'Nét văn hóa "Đạo Ông Trần" độc đáo: sống nhân nghĩa, hiếu khách, giữ phong tục mặc bà ba đen búi tóc',
          'Gần kề Làng Bè Hàu Long Sơn trứ danh trên sông Chà Và — thiên đường thưởng thức hàu tươi nổi tiếng nhất miền Nam',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Di tích Quốc gia Nhà Lớn Long Sơn — còn gọi là Đền Ông Trần — tọa lạc dưới chân Núi Nứa trên xã đảo Long Sơn, TP. Hồ Chí Minh.',
          'Do cụ Lê Văn Mưu cùng các lưu dân khai hoang xây dựng từ năm 1910 đến năm 1929 trên diện tích 2 hecta, Nhà Lớn là quần thể kiến trúc cổ bằng gỗ quý độc nhất vô nhị tại Nam Bộ gắn liền với đạo lý nhân nghĩa và lòng hiếu khách.',
        ],
      },
      en: {
        name: 'Long Son Big House (Ong Tran Temple Complex – 1910)',
        shortSummary:
          'Built between 1910 and 1929 on Long Son Island, this 2-hectare National Architectural Monument preserves timber shrines, community halls, and the hospitable traditions of the Ong Tran faith—right beside famous floating oyster farms.',
        historicalEra: '1910 – 1929',
        openingHours: '06:00 – 18:00 Daily',
        architecturalHighlights: [
          '2-hectare timber complex combining temple, meeting house, antique school, market, and tomb',
          'Unique local heritage of Ong Tran’s philosophy of simplicity and hospitality',
          'Steps away from Long Son’s famous Cha Va River floating oyster rafts',
        ],
        audioScript: [
          'Welcome to Long Son Big House, a 2-hectare wooden heritage complex built between 1910 and 1929 on Long Son Island, renowned for its timeless architecture and nearby floating oyster restaurants.',
        ],
      },
      fr: {
        name: 'Grande Maison de Long Son (Temple d’Ong Tran, 1910)',
        shortSummary:
          'Monument national de 2 hectares construit entre 1910 et 1929 sur l’île de Long Son, célèbre pour son architecture en bois et ses fermes ostréicoles flottantes.',
        historicalEra: '1910 – 1929',
        openingHours: '06h00 – 18h00',
        architecturalHighlights: [
          'Ensemble architectural traditionnel de 2 ha en bois précieux',
          'Villages flottants d’huîtres fraîches à proximité',
        ],
        audioScript: [
          'Bienvenue à la Grande Maison de Long Son, monument architectural unique sur l’île aux huîtres.',
        ],
      },
      zh: {
        name: '龙山大屋（陈公庙 · 1910年）',
        shortSummary:
          '建于1910至1929年的国家级建筑艺术遗迹，占地2公顷，完整保留古木庙宇、会馆与朴实好客的陈公文化，毗邻著名龙山生蚝渔排。',
        historicalEra: '1910 – 1929',
        openingHours: '06:00 – 18:00',
        architecturalHighlights: [
          '占地2公顷的南越传统木构建筑群',
          '毗邻享誉盛名的龙山海上生蚝渔排美食村',
        ],
        audioScript: [
          '欢迎来到龙山岛的国家级遗迹龙山大屋，领略百年古木建筑与海岛生蚝风情。',
        ],
      },
      ja: {
        name: 'ロンソン大屋敷（オン・チャン廟 / 1910年）',
        shortSummary:
          '1910〜1929年にロンソン島へ建てられた2ヘクタールの国家建築遺産。素朴な木造建築群と名物の水上牡蠣養殖場が魅力です。',
        historicalEra: '1910年 – 1929年',
        openingHours: '06:00 – 18:00',
        architecturalHighlights: [
          '廟・集会所・学校跡が集まる2ヘクタールの伝統木造建築群',
          '新鮮な牡蠣が味わえるロンソン水上筏レストラン街に隣接',
        ],
        audioScript: [
          'ロンソン島の国家遺産・ロンソン大屋敷へようこそ。独特の信仰文化と名物の新鮮な牡蠣料理が楽しめます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'nlls-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Quần thể Di tích Quốc gia Nhà Lớn Long Sơn (Đền Ông Trần)',
          en: 'Long Son Big House National Monument',
          fr: 'La Grande Maison de Long Son',
          zh: '龙山大屋国家级遗迹',
          ja: 'ロンソン大屋敷（国家遺産）',
        },
        yearOrSource: 'Di tích Lịch sử – Kiến trúc Nghệ thuật cấp Quốc gia (1991)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-ls-be-1',
        name: 'Làng Bè Hàu Nổi Long Sơn (Sông Chà Và)',
        cuisine: 'Hải sản & Hàu tươi sống tại bè',
        specialtyDishes: ['Hàu Long Sơn nướng mỡ hành & phô mai', 'Hàu sống mù tạt', 'Cá mú hấp Hồng Kông'],
        rating: 4.8,
        reviewCount: 7450,
        priceRange: '120.000đ – 300.000đ',
        lat: 10.4408,
        lng: 107.0645,
        address: 'Cầu Chà Và, Xã đảo Long Sơn, Vũng Tàu, TP. Hồ Chí Minh',
        openHours: '09:00 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 2. BÀ RỊA, PHÚ MỸ (NÚI DINH), LONG ĐẤT & HỒ TRÀM – BÌNH CHÂU (7 ĐIỂM)
  // =========================================================================
  {
    id: 'nha-tron-ba-ria',
    city: 'Bà Rịa · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Bà Rịa',
    lat: 10.4959,
    lng: 107.1704,
    category: 'monument',
    rating: 4.6,
    reviewCount: 1840,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Đường Cách Mạng Tháng Tám, Phường Phước Hiệp, Bà Rịa, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Di tích Lịch sử Nhà Tròn Bà Rịa (Tháp Nước Cổ)',
        shortSummary:
          'Di tích Lịch sử cấp Quốc gia (1987) và biểu tượng kiến trúc của trung tâm Bà Rịa — công trình tháp nước hình trụ độc đáo do Pháp xây đầu thế kỷ 20, nơi lá cờ đỏ sao vàng tung bay trong ngày Cách mạng Tháng Tám 25/8/1945.',
        historicalEra: 'Đầu thế kỷ XX (Di tích Quốc gia 1987)',
        openingHours: 'Mở cửa tự do 24/7',
        architecturalHighlights: [
          'Công trình tháp nước hình trụ cổ cao 20m mang kiến trúc Pháp vững chãi giữa trung tâm đô thị Bà Rịa',
          'Chứng tích hào hùng của cuộc khởi nghĩa giành chính quyền ngày 25/8/1945 tại Bà Rịa',
          'Điểm check-in lịch sử kết hợp không gian công viên trung tâm rợp bóng cây xanh',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Di tích Lịch sử Quốc gia Nhà Tròn Bà Rịa — biểu tượng hơn một trăm năm tuổi giữa trung tâm Bà Rịa.',
          'Ban đầu là công trình tháp nước bằng bê tông cốt thép xây dựng đầu thế kỷ 20, Nhà Tròn đã đi vào lịch sử khi trở thành nơi treo lá cờ khởi nghĩa giành chính quyền ngày 25 tháng 8 năm 1945.',
        ],
      },
      en: {
        name: 'Ba Ria Round House (Historic Water Tower)',
        shortSummary:
          'A National Historical Monument (1987) and iconic early-20th-century cylindrical water tower in central Ba Ria marking the August 25, 1945 independence uprising.',
        historicalEra: 'Early 20th Century',
        openingHours: 'Open 24/7',
        architecturalHighlights: [
          '20-meter-tall French colonial cylindrical masonry tower in central Ba Ria',
          'Symbolic site of the August 1945 Revolution in Ba Ria – Vung Tau',
        ],
        audioScript: [
          'Welcome to the Ba Ria Round House, an iconic century-old cylindrical monument celebrating Ba Ria’s August 1945 revolutionary heritage.',
        ],
      },
      fr: {
        name: 'Maison Ronde de Ba Ria (Château d’eau historique)',
        shortSummary:
          'Monument historique national du début du XXe siècle, symbole architectural et historique du centre de Ba Ria.',
        historicalEra: 'Début du XXe siècle',
        openingHours: 'Ouvert 24h/24',
        architecturalHighlights: [
          'Tour cylindrique coloniale de 20 m au cœur de la ville',
          'Lieu emblématique d’août 1945',
        ],
        audioScript: [
          'Bienvenue à la Maison Ronde de Ba Ria, monument historique emblématique du centre-ville.',
        ],
      },
      zh: {
        name: '巴地圆屋历史遗迹（百年水塔）',
        shortSummary:
          '建于20世纪初的国家级历史遗迹与巴地市地标圆柱建筑，见证了1945年八月革命的历史时刻。',
        historicalEra: '20世纪初',
        openingHours: '全天开放',
        architecturalHighlights: [
          '20米高百年法式圆柱形标志性建筑',
          '1945年巴地八月革命纪念地标',
        ],
        audioScript: [
          '欢迎参观巴地市中心的百年历史地标——巴地圆屋。',
        ],
      },
      ja: {
        name: 'バリア円形館（歴史的給水塔）',
        shortSummary:
          '20世紀初頭に建てられたバリア中心部のシンボル（国家歴史遺産）。1945年8月革命の記念碑的建造物です。',
        historicalEra: '20世紀初頭',
        openingHours: '24時間見学可能',
        architecturalHighlights: [
          '高さ20mの円筒形フランス様式建造物',
          '1945年8月25日の歴史を伝える街の象徴',
        ],
        audioScript: [
          'バリア中心部の象徴である歴史的建造物・バリア円形館へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'ntbr-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Di tích Lịch sử Nhà Tròn Bà Rịa',
          en: 'Ba Ria Round House Historical Monument',
          fr: 'Maison Ronde de Ba Ria',
          zh: '巴地圆屋历史遗迹',
          ja: 'バリア円形館',
        },
        yearOrSource: 'Di tích Lịch sử cấp Quốc gia (1987)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-br-1',
        name: 'Bánh Canh Long Hương (Cổng Chào Bà Rịa)',
        cuisine: 'Đặc sản trứ danh Bà Rịa',
        specialtyDishes: ['Bánh canh giò heo Long Hương', 'Bánh canh thịt nạc chả cua', 'Nước mía sầu riêng'],
        rating: 4.8,
        reviewCount: 6420,
        priceRange: '40.000đ – 65.000đ',
        lat: 10.4941,
        lng: 107.1528,
        address: '11 Cách Mạng Tháng Tám, Phường Long Hương, Bà Rịa, TP. Hồ Chí Minh',
        openHours: '05:30 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'dia-dao-long-phuoc-ba-ria',
    city: 'Bà Rịa · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Bà Rịa',
    lat: 10.5256,
    lng: 107.2312,
    category: 'monument',
    rating: 4.7,
    reviewCount: 1520,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Xã Long Phước, Khu vực Bà Rịa, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Di tích Quốc gia Địa đạo Long Phước (1948)',
        shortSummary:
          'Di tích Lịch sử cấp Quốc gia (1990) — hệ thống địa đạo chiến đấu liên hoàn nối liền 5 ấp ở độ sâu 2–6m được đào từ năm 1948, minh chứng sáng tạo của chiến tranh nhân dân và trận chống càn 44 ngày đêm năm 1963.',
        historicalEra: '1948 – 1975 (Di tích Quốc gia 1990)',
        openingHours: '07:30 – 11:30 & 13:30 – 17:00',
        architecturalHighlights: [
          'Hệ thống đường hầm sâu 2–6m nối thông 5 ấp (Đông, Tây, Nam, Bắc, Phước Hữu) dài hàng nghìn mét',
          'Các công trình ngầm: trạm cứu thương, kho dự trữ lương thực, bếp Hoàng Cầm và ụ chiến đấu',
          'Nhà trưng bày hiện vật lịch sử và khu phục dựng hầm địa đạo cho khách trải nghiệm trực tiếp',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Di tích Lịch sử Quốc gia Địa đạo Long Phước tại Bà Rịa, TP. Hồ Chí Minh.',
          'Khởi nguồn từ những căn hầm bí mật năm 1948, quân và dân Long Phước đã kiên trì đào mạng lưới địa đạo liên hoàn nối thông cả 5 ấp, trụ vững kiên cường qua trận càn khốc liệt suốt 44 ngày đêm năm 1963.',
        ],
      },
      en: {
        name: 'Long Phuoc Tunnels National Monument (1948)',
        shortSummary:
          'Started in 1948 and designated a National Historical Monument in 1990, this subterranean tunnel complex linked five hamlets with underground clinics, storage rooms, and battle bunkers.',
        historicalEra: '1948 – 1975',
        openingHours: '07:30 – 17:00 Daily',
        architecturalHighlights: [
          'Underground tunnels dug 2–6 meters deep connecting five historic hamlets',
          'Preserved subterranean infirmary, food depots, and visitor walkthrough section',
        ],
        audioScript: [
          'Welcome to the Long Phuoc Tunnels in Ba Ria, a remarkable network of underground tunnels dug from 1948 onward and preserved as a National Historical Monument.',
        ],
      },
      fr: {
        name: 'Tunnels historiques de Long Phuoc (1948)',
        shortSummary:
          'Monument historique national (1990), réseau souterrain creusé dès 1948 reliant cinq hameaux avec infirmerie et abris.',
        historicalEra: '1948 – 1975',
        openingHours: '07h30 – 17h00',
        architecturalHighlights: [
          'Galeries souterraines de 2 à 6 m de profondeur',
          'Espace muséal et tronçon visitable',
        ],
        audioScript: [
          'Bienvenue aux tunnels de Long Phuoc, monument historique majeur de la région de Ba Ria.',
        ],
      },
      zh: {
        name: '龙福地道国家级遗迹（1948年）',
        shortSummary:
          '始挖于1948年的国家级历史遗迹，地下2至6米深处贯通五个村落，设有地下医疗站与粮库。',
        historicalEra: '1948 – 1975',
        openingHours: '07:30 – 17:00',
        architecturalHighlights: [
          '贯通五个村落的地下坑道防御网络',
          '开放体验的地道展段与历史文物陈列馆',
        ],
        audioScript: [
          '欢迎参观巴地龙福地道国家级历史遗迹，了解1948年以来的地下抗战传奇。',
        ],
      },
      ja: {
        name: 'ロンフック地下トンネル遺跡（1948年）',
        shortSummary:
          '1948年から掘り進められた5集落を結ぶ地下トンネル網（国家歴史遺産）。救護室や食料庫などが残ります。',
        historicalEra: '1948年 – 1975年',
        openingHours: '07:30 – 17:00',
        architecturalHighlights: [
          '地下2〜6mに張り巡らされた多目的地下トンネル',
          '資料館と体験見学できる復元坑道',
        ],
        audioScript: [
          'バリアのロンフック地下トンネル遺跡へようこそ。1948年から築かれた歴史的な地下施設を見学できます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'ddlp-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Di tích Lịch sử Quốc gia Địa đạo Long Phước – Bà Rịa',
          en: 'Long Phuoc Tunnels National Monument',
          fr: 'Tunnels de Long Phuoc',
          zh: '巴地龙福地道',
          ja: 'ロンフック地下トンネル遺跡',
        },
        yearOrSource: 'Di tích Lịch sử cấp Quốc gia (1990)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-lp-1',
        name: 'Khu Sinh Thái Tứ Phương Thất Đảo & Ẩm Thực Đồng Quê',
        cuisine: 'Ẩm thực miệt vườn Bà Rịa',
        specialtyDishes: ['Cá lóc nướng trui', 'Gà vườn nướng mật ong', 'Lẩu cua đồng rau tập tàng'],
        rating: 4.6,
        reviewCount: 2180,
        priceRange: '80.000đ – 200.000đ',
        lat: 10.5202,
        lng: 107.2238,
        address: 'Ấp Phước Hữu, Xã Long Phước, Bà Rịa, TP. Hồ Chí Minh',
        openHours: '08:00 – 20:00',
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'can-cu-minh-dam-long-hai',
    city: 'Long Hải – Đất Đỏ · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Long Đất',
    lat: 10.4024,
    lng: 107.2591,
    category: 'monument',
    rating: 4.8,
    reviewCount: 4210,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Dãy núi Minh Đạm, Khu vực Long Hải – Phước Hải, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Khu Di tích Lịch sử Quốc gia Căn cứ Minh Đạm',
        shortSummary:
          'Di tích Lịch sử cấp Quốc gia (1993) trên dãy núi đá hoa cương dài 8km với 3 mặt giáp biển, đặt tên từ năm 1948 để tri ân hai liệt sĩ Bùi Công Minh và Mạc Thanh Đạm, nổi tiếng với hơn 300 hang đá tự nhiên và cung đường hoa anh đào nở rực mùa xuân.',
        historicalEra: '1948 – 1975 (Di tích Quốc gia 1993)',
        openingHours: '07:00 – 17:00 Hàng ngày',
        architecturalHighlights: [
          'Hệ thống hang đá tự nhiên hiểm trở: Hang Huyện ủy, Hang Quân y, Hang Quân giới, Hang Thị xã cấp cứu',
          'Đền thờ Liệt sĩ Minh Đạm trang nghiêm và góc ngắm toàn vịnh biển Phước Hải – Long Hải từ sườn núi',
          'Cung đường đèo Nước Ngọt và rừng hoa anh đào nở hồng tuyệt đẹp dịp đầu năm',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Khu Di tích Lịch sử Quốc gia Căn cứ Minh Đạm giữa rừng xanh và biển biếc Long Hải – Phước Hải.',
          'Mang tên ghép của hai nhà lãnh đạo kiên trung Bùi Công Minh và Mạc Thanh Đạm hy sinh năm 1948, dãy núi đá với hàng trăm hang động tự nhiên này từng là pháo đài bất khả xâm phạm trong suốt hai cuộc kháng chiến.',
        ],
      },
      en: {
        name: 'Minh Dam Mountain Revolutionary Base',
        shortSummary:
          'A National Historical Monument (1993) spanning an 8km forested granite ridge overlooking the sea, housing historic natural cave bunkers and scenic spring cherry-blossom trails.',
        historicalEra: '1948 – 1975',
        openingHours: '07:00 – 17:00 Daily',
        architecturalHighlights: [
          'Natural granite cave shelters: Command Cave, Field Hospital Cave, and Armory Cave',
          'Scenic mountain road overlooking Long Hai and Phuoc Hai beaches',
        ],
        audioScript: [
          'Welcome to Minh Dam Mountain Base, a national historical site combining forested granite caves with breathtaking views of the Long Hai coastline.',
        ],
      },
      fr: {
        name: 'Base historique de la montagne Minh Dam',
        shortSummary:
          'Monument national (1993) sur une crête granitique boisée face à la mer, célèbre pour ses grottes historiques et sa route panoramique.',
        historicalEra: '1948 – 1975',
        openingHours: '07h00 – 17h00',
        architecturalHighlights: [
          'Grottes naturelles historiques au cœur de la forêt',
          'Vue imprenable sur la côte de Phuoc Hai et Long Hai',
        ],
        audioScript: [
          'Bienvenue à la base historique de Minh Dam, entre forêt montagneuse et littoral de Long Hai.',
        ],
      },
      zh: {
        name: '明淡山抗战根据地（国家级遗迹）',
        shortSummary:
          '1993年认定的国家级历史遗迹，三面环海的花岗岩山脉中藏有300余处天然岩洞，春季山道樱花盛开。',
        historicalEra: '1948 – 1975',
        openingHours: '07:00 – 17:00',
        architecturalHighlights: [
          '天然花岗岩战地洞穴群（指挥洞、军医洞等）',
          '俯瞰龙海与福海海岸线的绝美盘山公路',
        ],
        audioScript: [
          '欢迎来到明淡山国家级历史遗迹，感受山海之间的壮丽风光与红色历史。',
        ],
      },
      ja: {
        name: 'ミンダム山革命根拠地（国家歴史遺産）',
        shortSummary:
          '三方を海に囲まれた花崗岩の山並みに300以上の天然洞窟が残る国家歴史遺産。海を望む絶景トレッキングも楽しめます。',
        historicalEra: '1948年 – 1975年',
        openingHours: '07:00 – 17:00',
        architecturalHighlights: [
          '天然岩洞を活用した歴史的な司令部・野戦病院跡',
          'ロンハイ・フックハイ海岸を一望する山道',
        ],
        audioScript: [
          'ミンダム山国家歴史遺産へようこそ。深い緑と天然洞窟、そして美しい海景色が広がります。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'ccmd-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Núi rừng và biển nhìn từ Căn cứ Minh Đạm',
          en: 'Minh Dam Mountain Base overlooking the sea',
          fr: 'Montagne Minh Dam face à la mer',
          zh: '明淡山海景',
          ja: 'ミンダム山からの眺め',
        },
        yearOrSource: 'Di tích Lịch sử cấp Quốc gia (1993)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-md-1',
        name: 'Hàu Sữa & Hải Sản Bờ Kè Phước Hải',
        cuisine: 'Hải sản làng chài Phước Hải',
        specialtyDishes: ['Hàu sữa Phước Hải hấp sả (giá bình dân)', 'Gỏi cá trích', 'Lẩu cá bớp'],
        rating: 4.8,
        reviewCount: 4920,
        priceRange: '50.000đ – 160.000đ',
        lat: 10.4152,
        lng: 107.2896,
        address: 'Bờ kè Trần Hưng Đạo, Làng chài Phước Hải, TP. Hồ Chí Minh',
        openHours: '09:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'nha-luu-niem-vo-thi-sau-dat-do',
    city: 'Đất Đỏ · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Long Đất',
    lat: 10.4839,
    lng: 107.2747,
    category: 'monument',
    rating: 4.9,
    reviewCount: 5180,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Ngã tư Đất Đỏ, Quốc lộ 55, Khu vực Long Đất, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Nhà lưu niệm & Đền thờ Anh hùng Liệt sĩ Võ Thị Sáu',
        shortSummary:
          'Địa chỉ đỏ thiêng liêng trên quê hương Đất Đỏ, bảo tồn ngôi nhà gỗ mái ngói nơi nữ Anh hùng Lực lượng Vũ trang Nhân dân Võ Thị Sáu (1933–1952) lớn lên cùng công viên tượng đài và đền tưởng niệm trang nghiêm.',
        historicalEra: '1933 – 1952 (Xếp hạng Di tích Lịch sử)',
        openingHours: '07:00 – 17:30 Hàng ngày',
        architecturalHighlights: [
          'Ngôi nhà cổ của gia đình chị Võ Thị Sáu được bảo tồn nguyên vẹn với nhiều kỷ vật thời niên thiếu',
          'Tượng đài bằng đồng cao 7m khắc họa hình ảnh hiên ngang của người con gái đất Đỏ',
          'Đền thờ và phòng trưng bày tư liệu về cuộc đời bất tử của nữ anh hùng từ Đất Đỏ tới Côn Đảo',
        ],
        audioScript: [
          'Chào mừng quý khách đến thăm Nhà lưu niệm và Đền thờ Anh hùng Lực lượng Vũ trang Nhân dân Võ Thị Sáu ngay trung tâm quê hương Đất Đỏ.',
          'Nơi đây lưu giữ ngôi nhà giản dị thời thơ ấu của chị Sáu — người nữ chiến sĩ công an xung phong quả cảm đã đi vào huyền thoại dân tộc và yên nghỉ tại Nghĩa trang Hàng Dương, Côn Đảo.',
        ],
      },
      en: {
        name: 'Heroine Vo Thi Sau Memorial House & Shrine (Dat Do)',
        shortSummary:
          'Preserves the humble childhood timber home, bronze monument, and memorial shrine of Vietnamese national heroine Vo Thi Sau (1933–1952) in her hometown of Dat Do.',
        historicalEra: '1933 – 1952',
        openingHours: '07:00 – 17:30 Daily',
        architecturalHighlights: [
          'Preserved childhood wooden home of heroine Vo Thi Sau',
          '7-meter bronze statue and tranquil memorial park',
        ],
        audioScript: [
          'Welcome to the Vo Thi Sau Memorial House in Dat Do, honoring the courageous life and enduring legacy of Vietnam’s beloved young heroine.',
        ],
      },
      fr: {
        name: 'Maison mémoriale de Vo Thi Sau (Dat Do)',
        shortSummary:
          'Maison d’enfance préservée et sanctuaire dédié à l’héroïne nationale Vo Thi Sau (1933–1952) dans sa ville natale de Dat Do.',
        historicalEra: '1933 – 1952',
        openingHours: '07h00 – 17h30',
        architecturalHighlights: [
          'Maison familiale en bois conservée',
          'Statue en bronze de 7 m et parc commémoratif',
        ],
        audioScript: [
          'Bienvenue à la maison mémoriale de Vo Thi Sau à Dat Do.',
        ],
      },
      zh: {
        name: '武氏六女英雄故居纪念馆（红土）',
        shortSummary:
          '坐落于红土家乡的爱国纪念地，完整保存越南民族女英雄武氏六（1933–1952）童年木屋、7米高铜像与纪念殿。',
        historicalEra: '1933 – 1952',
        openingHours: '07:00 – 17:30',
        architecturalHighlights: [
          '保存完好的武氏六故居木屋与生平展厅',
          '7米高英雄青铜雕像与纪念公园',
        ],
        audioScript: [
          '欢迎参观红土武氏六女英雄故居纪念馆，缅怀这位永载史册的青年英雄。',
        ],
      },
      ja: {
        name: 'ヴォー・ティ・サウ記念館・生家（ダットドー）',
        shortSummary:
          'ベトナムの国民的英雄ヴォー・ティ・サウ（1933–1952）の故郷に建つ生家保存館と慰霊殿です。',
        historicalEra: '1933年 – 1952年',
        openingHours: '07:00 – 17:30',
        architecturalHighlights: [
          '少女時代を過ごした伝統木造家屋の保存展示',
          '高さ7mのブロンズ像と静かな記念公園',
        ],
        audioScript: [
          'ダットドーのヴォー・ティ・サウ記念館へようこそ。彼女の生涯と勇気を伝える大切な記念地です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'vts-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Đền thờ & Nhà lưu niệm Anh hùng Võ Thị Sáu – Đất Đỏ',
          en: 'Vo Thi Sau Memorial House in Dat Do',
          fr: 'Mémorial de Vo Thi Sau à Dat Do',
          zh: '红土武氏六纪念馆',
          ja: 'ヴォー・ティ・サウ記念館',
        },
        yearOrSource: 'Khu Di tích Lưu niệm Võ Thị Sáu',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-dd-1',
        name: 'Bánh Hỏi Thịt Nướng An Nhứt (Đặc sản Quốc lộ 55)',
        cuisine: 'Đặc sản lâu đời Long Điền – Đất Đỏ',
        specialtyDishes: ['Bánh hỏi thịt nướng cuốn bánh tráng', 'Chả giò giòn An Nhứt', 'Nước mắm đậu phộng'],
        rating: 4.8,
        reviewCount: 5340,
        priceRange: '55.000đ – 110.000đ',
        lat: 10.4876,
        lng: 107.2349,
        address: 'Quốc lộ 55, Xã An Nhứt, Khu vực Long Đất, TP. Hồ Chí Minh',
        openHours: '07:00 – 20:30',
        imageUrl:
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'nui-dinh-chua-hang-phu-my',
    city: 'Phú Mỹ · Bà Rịa – Vũng Tàu (TP.HCM)',
    district: 'Phú Mỹ',
    lat: 10.5317,
    lng: 107.1255,
    category: 'temple',
    rating: 4.7,
    reviewCount: 4860,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Khu vực Núi Dinh, Phú Mỹ, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Căn cứ Núi Dinh, Chùa Hang & Suối Tiên (Phú Mỹ)',
        shortSummary:
          'Di tích Lịch sử cấp Quốc gia trên ngọn núi cao 504m xanh mát cách trung tâm Sài Gòn chỉ ~70km, nổi tiếng với hơn 100 ngôi chùa – thiền viện cổ (Chùa Hang, Chùa Tây Phương), Suối Đá, Suối Tiên và cung trekking đỉnh La Bàn.',
        historicalEra: 'Căn cứ cách mạng 1945–1975 · Vùng đất thiền lâm cổ',
        openingHours: '06:00 – 17:30 Hàng ngày',
        architecturalHighlights: [
          'Di tích Lịch sử Quốc gia Căn cứ Núi Dinh cùng Hang Dây Bí, Hang Tổ và Chùa Hang kỳ vĩ trong lòng đá',
          'Hơn 100 ngôi chùa, am thất, thiền viện ẩn hiện dưới tán rừng nguyên sinh ở độ cao trên 500m',
          'Suối Tiên – Suối Đá nước trong vắt và đỉnh La Bàn ngắm trọn vịnh Cái Mép – Thị Vải',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Núi Dinh tại Phú Mỹ — ngọn núi cao hơn 500 mét hội tụ cả giá trị Di tích Lịch sử Quốc gia, vùng đất thiền lâm hàng trăm ngôi chùa và thiên nhiên suối rừng mát lành.',
          'Dừng chân tại Chùa Hang, Chùa Tây Phương hay dạo bước bên dòng Suối Tiên róc rách, du khách sẽ cảm nhận sự giao hòa tuyệt diệu giữa lịch sử hào hùng và không gian thanh tịnh.',
        ],
      },
      en: {
        name: 'Nui Dinh Mountain Base, Hang Pagoda & Suoi Tien Stream',
        shortSummary:
          'Rising 504m in Phu My, this National Historical Monument blends forested trekking trails, crystal mountain streams, and over 100 tranquil pagodas including cave-carved Hang Pagoda.',
        historicalEra: 'National Historical Base & Monastic Mountain',
        openingHours: '06:00 – 17:30 Daily',
        architecturalHighlights: [
          'Over 100 hillside pagodas and Zen monasteries nestled in cool rainforest',
          'Suoi Tien and Suoi Da natural streams plus La Ban peak viewpoints over Cai Mep Bay',
        ],
        audioScript: [
          'Welcome to Nui Dinh Mountain in Phu My, a 504-meter forested sanctuary combining historic cave shelters, peaceful pagodas, and refreshing mountain streams.',
        ],
      },
      fr: {
        name: 'Mont Nui Dinh, Pagode Hang et ruisseau Suoi Tien',
        shortSummary:
          'Massif boisé de 504 m classé monument national, réputé pour sa centaine de pagodes, ses ruisseaux clairs et ses sentiers de randonnée.',
        historicalEra: 'Base historique nationale',
        openingHours: '06h00 – 17h30',
        architecturalHighlights: [
          'Plus de 100 pagodes et ermitages dans la forêt',
          'Ruisseaux naturels Suoi Tien et sommet panoramique La Ban',
        ],
        audioScript: [
          'Bienvenue au mont Nui Dinh, havre de nature, d’histoire et de sérénité.',
        ],
      },
      zh: {
        name: '富美定山根据地、石洞寺与仙溪',
        shortSummary:
          '海拔504米的国家级历史遗迹与佛教禅修圣地，山间隐匿百余座古刹、清澈仙溪与徒步观海山径。',
        historicalEra: '国家级历史遗迹',
        openingHours: '06:00 – 17:30',
        architecturalHighlights: [
          '百余座隐于原始森林的寺庙与禅院（石洞寺、西方寺）',
          '清凉仙溪瀑布与眺望盖梅港海湾的罗盘峰',
        ],
        audioScript: [
          '欢迎来到富美定山，这里集国家级历史遗迹、百座山林古寺与清凉溪谷于一体。',
        ],
      },
      ja: {
        name: 'ヌイディン山根拠地・ハン寺・スオイティエン渓谷',
        shortSummary:
          '標高504mの緑豊かな国家歴史遺産。100以上の寺院が点在する静かな修行の山で、清流トレッキングも人気です。',
        historicalEra: '国家歴史遺産',
        openingHours: '06:00 – 17:30',
        architecturalHighlights: [
          '原生林に点在する100以上の寺院と洞窟のハン寺',
          '澄んだ渓流スオイティエンと湾を望む絶景山頂',
        ],
        audioScript: [
          'フーミーのヌイディン山へようこそ。歴史的史跡と数多くの寺院、清らかな渓流が調和する名峰です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'ndpm-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Không gian thiền lâm và rừng xanh Núi Dinh – Phú Mỹ',
          en: 'Nui Dinh Mountain sanctuaries in Phu My',
          fr: 'Sanctuaires du mont Nui Dinh',
          zh: '富美定山禅林',
          ja: 'ヌイディン山の寺院群',
        },
        yearOrSource: 'Di tích Lịch sử cấp Quốc gia Căn cứ Núi Dinh',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-nd-1',
        name: 'Gà Nướng Suối Đá & Lẩu Gà Lá Giang Núi Dinh',
        cuisine: 'Đặc sản núi rừng Phú Mỹ',
        specialtyDishes: ['Gà thả vườn nướng muối ớt', 'Lẩu gà lá giang', 'Rau rừng chấm kho quẹt'],
        rating: 4.7,
        reviewCount: 2150,
        priceRange: '90.000đ – 220.000đ',
        lat: 10.5215,
        lng: 107.1189,
        address: 'Chân Núi Dinh – Đường vào Suối Đá, Phú Mỹ, TP. Hồ Chí Minh',
        openHours: '08:00 – 20:00',
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'bien-ho-tram-hamptons-pier',
    city: 'Hồ Tràm · Xuyên Mộc (TP.HCM)',
    district: 'Xuyên Mộc',
    lat: 10.4648,
    lng: 107.4416,
    category: 'ancient_town',
    rating: 4.8,
    reviewCount: 11650,
    ticketPrice: 'Miễn phí tham quan cầu ngắm biển',
    address: 'Đường Ven Biển, Xã Phước Thuận, Hồ Tràm – Xuyên Mộc, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Biển Hồ Tràm & Cầu Ngắm Biển Hamptons Pier',
        shortSummary:
          'Bãi biển hoang sơ từng được kênh CNNGo (Mỹ) vinh danh top bãi biển đẹp nhất thế giới, nổi bật với Cầu ngắm biển Hamptons Pier vươn dài 270m ra đại dương, phố đi bộ biển Hồ Tràm và bãi đá Hồ Cốc kế bên.',
        historicalEra: 'Thủ phủ du lịch nghỉ dưỡng biển Đông Nam Bộ',
        openingHours: '06:00 – 22:00 Hàng ngày',
        architecturalHighlights: [
          'Cầu đi bộ ngắm biển Hamptons Pier dài 270m vươn thẳng ra Biển Đông — điểm ngắm bình minh & hoàng hôn hàng đầu',
          'Bờ biển Hồ Tràm – Hồ Cốc dài hơn 30km cát trắng mịn nối liền rừng nguyên sinh Bình Châu – Phước Bửu',
          'Chợ hải sản ngư dân Hồ Tràm ngay sát bãi biển với hải sản tươi rói kéo lưới mỗi sáng',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Biển Hồ Tràm và Cầu Ngắm Biển Hamptons Pier tại khu vực Xuyên Mộc, TP. Hồ Chí Minh mở rộng.',
          'Từng được kênh CNNGo bình chọn là một trong những bãi biển hoang sơ đẹp nhất hành tinh, Hồ Tràm quyến rũ du khách với cây cầu gỗ vươn dài 270 mét ra giữa đại dương và làng chài hải sản tươi sống.',
        ],
      },
      en: {
        name: 'Ho Tram Beach & Hamptons Pier (Ocean Walk Bridge)',
        shortSummary:
          'Recognized by CNNGo among the world’s most unspoiled beaches, highlighted by the 270-meter-long Hamptons Pier stretching over turquoise waves and nearby pristine Ho Coc Cove.',
        historicalEra: 'Premier Coastal Resort Strip',
        openingHours: '06:00 – 22:00 Daily',
        architecturalHighlights: [
          '270-meter Hamptons Pier — one of Southeast Asia’s longest ocean-viewing walkways',
          '30km stretch of unspoiled white sand bordering Binh Chau – Phuoc Buu coastal rainforest',
        ],
        audioScript: [
          'Welcome to Ho Tram Beach and the 270-meter Hamptons Pier, famed for tranquil golden sands, sunrise ocean strolls, and fresh morning fishermen’s markets.',
        ],
      },
      fr: {
        name: 'Plage de Ho Tram et jetée Hamptons Pier',
        shortSummary:
          'Plage sauvage saluée par CNNGo, dotée de la jetée piétonne Hamptons Pier longue de 270 m s’avançant dans la mer.',
        historicalEra: 'Station balnéaire côtière',
        openingHours: '06h00 – 22h00',
        architecturalHighlights: [
          'Passerelle panoramique de 270 m sur l’océan',
          'Marché aux fruits de mer frais sur la plage',
        ],
        audioScript: [
          'Bienvenue à la plage de Ho Tram et sa célèbre passerelle Hamptons Pier longue de 270 mètres.',
        ],
      },
      zh: {
        name: '胡茶海滩与270米海上观景栈桥（Hamptons Pier）',
        shortSummary:
          '曾入选CNNGo全球最美原生态海滩，拥有向大海延伸270米的标志性观景栈桥与渔民现捕海鲜市场。',
        historicalEra: '生态滨海度假胜地',
        openingHours: '06:00 – 22:00',
        architecturalHighlights: [
          '270米长海上观景栈桥，绝佳日出日落打卡地',
          '绵延30公里洁白沙滩与原生态海滨渔市',
        ],
        audioScript: [
          '欢迎来到胡茶海滩，漫步270米长的海上栈桥，尽享碧海蓝天与新鲜海味。',
        ],
      },
      ja: {
        name: 'ホーチャム海岸・ハンプトンズ桟橋',
        shortSummary:
          'CNNGoで世界の美しい手つかずビーチに選ばれたホーチャム海岸。海へ270m伸びる絶景桟橋がシンボルです。',
        historicalEra: '海辺のリゾートエリア',
        openingHours: '06:00 – 22:00',
        architecturalHighlights: [
          '海の上へ270m突き出すハンプトンズ・ピア展望桟橋',
          '朝獲れ魚介が並ぶ活気ある海辺のシーフード市場',
        ],
        audioScript: [
          'ホーチャム海岸と全長270mのハンプトンズ桟橋へようこそ。穏やかな白砂と絶景の夕日をお楽しみください。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'hthp-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Biển Hồ Tràm & Cầu ngắm biển Hamptons Pier',
          en: 'Ho Tram Beach and Hamptons Pier',
          fr: 'Plage de Ho Tram et Hamptons Pier',
          zh: '胡茶海滩与海上观景桥',
          ja: 'ホーチャム海岸と桟橋',
        },
        yearOrSource: 'Danh thắng biển Hồ Tràm – Xuyên Mộc',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-ht-1',
        name: 'Chợ Hải Sản Lưới Biển Hồ Tràm',
        cuisine: 'Hải sản đánh bắt trực tiếp tại bãi',
        specialtyDishes: ['Ghẹ xanh hấp bia', 'Tôm hùm nướng bơ tỏi', 'Mực lá nướng mọi'],
        rating: 4.8,
        reviewCount: 4730,
        priceRange: '120.000đ – 380.000đ',
        lat: 10.4669,
        lng: 107.4345,
        address: 'Ngã tư Hồ Tràm, Xã Phước Thuận, Xuyên Mộc, TP. Hồ Chí Minh',
        openHours: '06:30 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'suoi-khoang-nong-binh-chau',
    city: 'Bình Châu · Xuyên Mộc (TP.HCM)',
    district: 'Xuyên Mộc',
    lat: 10.5985,
    lng: 107.5592,
    category: 'ancient_town',
    rating: 4.7,
    reviewCount: 9320,
    ticketPrice: '150.000đ – 450.000đ',
    address: 'Quốc lộ 55, Xã Bình Châu, Khu vực Xuyên Mộc, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Suối Khoáng Nóng Bình Châu & Rừng Nguyên Sinh Phước Bửu',
        shortSummary:
          'Nguồn suối khoáng nóng tự nhiên duy nhất và lớn nhất miền Nam được bác sĩ Pháp Albert Sallet phát hiện từ năm 1928, sở hữu hơn 70 điểm phun nước khoáng lộ thiên (37°C–82°C) giữa Khu Bảo tồn Thiên nhiên Bình Châu – Phước Bửu rộng 11.000ha.',
        historicalEra: 'Phát hiện năm 1928 · Khu Bảo tồn Thiên nhiên Quốc gia',
        openingHours: '08:00 – 21:00 Hàng ngày',
        architecturalHighlights: [
          'Hơn 70 điểm phun nước khoáng nóng tự nhiên giàu khoáng chất (Silic, Nitơ, Natri) từ 37°C đến 82°C',
          'Trải nghiệm luộc trứng gà trực tiếp tại Giếng Trời 82°C, ngâm chân khoáng nóng và tắm bùn khoáng',
          'Nằm giữa rừng nguyên sinh ven biển Bình Châu – Phước Bửu rộng hơn 11.000ha quý hiếm bậc nhất Việt Nam',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Suối Khoáng Nóng Bình Châu nằm giữa Khu Bảo tồn Thiên nhiên rừng nguyên sinh Bình Châu – Phước Bửu.',
          'Được bác sĩ người Pháp Albert Sallet phát hiện năm 1928, nơi đây sở hữu hơn 70 mạch phun khoáng nóng tự nhiên với nhiệt độ lên tới 82 độ C — điểm nghỉ dưỡng tắm khoáng Onsen, tắm bùn và luộc trứng giếng trời độc nhất vô nhị tại miền Nam.',
        ],
      },
      en: {
        name: 'Binh Chau Natural Hot Springs & Phuoc Buu Nature Reserve',
        shortSummary:
          'Discovered in 1928 within the 11,000-hectare coastal primeval forest, Southern Vietnam’s only natural mineral hot spring features over 70 geothermal vents (37°C–82°C) for thermal bathing, mud spas, and hot-spring egg boiling.',
        historicalEra: 'Discovered in 1928',
        openingHours: '08:00 – 21:00 Daily',
        architecturalHighlights: [
          'Over 70 natural geothermal mineral vents ranging from 37°C to 82°C',
          'Iconic 82°C Gieng Troi spring for boiling farm eggs plus Onsen and mineral mud baths',
          'Surrounded by the rare 11,000-hectare Binh Chau – Phuoc Buu coastal rainforest',
        ],
        audioScript: [
          'Welcome to Binh Chau Hot Springs, discovered in 1928 amidst a vast coastal rainforest, offering natural 82-degree thermal wells, mineral mud baths, and restorative Onsen pools.',
        ],
      },
      fr: {
        name: 'Sources thermales de Binh Chau et réserve de Phuoc Buu',
        shortSummary:
          'Découvertes en 1928 au cœur d’une forêt primaire de 11 000 ha, plus de 70 sources chaudes naturelles (37 °C à 82 °C) pour bains thermaux et bains de boue.',
        historicalEra: 'Découvertes en 1928',
        openingHours: '08h00 – 21h00',
        architecturalHighlights: [
          'Plus de 70 sources minérales naturelles jusqu’à 82 °C',
          'Réserve naturelle côtière de Binh Chau – Phuoc Buu',
        ],
        audioScript: [
          'Bienvenue aux sources chaudes naturelles de Binh Chau, oasis thermale nichée au cœur de la forêt primaire.',
        ],
      },
      zh: {
        name: '平洲天然温泉与福宝原始森林保护区',
        shortSummary:
          '1928年发现于1.1万公顷海滨原始森林中的南越唯一天然温泉群，拥有70余处37°C至82°C地热泉眼，可体验温泉泡汤、矿泥浴与82°C温泉煮蛋。',
        historicalEra: '1928年发现',
        openingHours: '08:00 – 21:00',
        architecturalHighlights: [
          '70余处37°C至82°C天然矿物质地热泉眼',
          '82°C天井温泉煮蛋体验与日式温泉矿泥疗养',
        ],
        audioScript: [
          '欢迎来到平洲天然温泉，在万顷原始森林环抱中尽享天然地热矿泉与温泉煮蛋乐趣。',
        ],
      },
      ja: {
        name: 'ビンチャウ天然温泉・フックブー自然保護区',
        shortSummary:
          '1928年発見のベトナム南部最大の天然温泉地。原生林の中に37〜82℃の源泉が70カ所以上湧き、温泉卵作りや泥風呂を楽しめます。',
        historicalEra: '1928年発見',
        openingHours: '08:00 – 21:00',
        architecturalHighlights: [
          '37℃〜82℃の天然鉱泉が湧き出る70以上の源泉',
          '82℃の源泉での温泉卵体験と11,000haの海岸原生林',
        ],
        audioScript: [
          '1928年発見のビンチャウ天然温泉へようこそ。豊かな原生林の中で天然温泉と名物の温泉卵を体験できます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'skbc-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Suối Khoáng Nóng Bình Châu giữa rừng nguyên sinh Phước Bửu',
          en: 'Binh Chau Hot Springs and Phuoc Buu Nature Reserve',
          fr: 'Sources thermales de Binh Chau',
          zh: '平洲天然温泉与原始森林',
          ja: 'ビンチャウ天然温泉',
        },
        yearOrSource: 'Khu Bảo tồn Thiên nhiên Bình Châu – Phước Bửu',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vt-bc-1',
        name: 'Ẩm Thực Rừng Biển & Trứng Luộc Khoáng Nóng Bình Châu',
        cuisine: 'Đặc sản Xuyên Mộc – Bình Châu',
        specialtyDishes: ['Trứng gà luộc khoáng nóng 82°C', 'Gà nướng cơm lam', 'Hải sản cảng cá Bình Châu'],
        rating: 4.6,
        reviewCount: 2890,
        priceRange: '50.000đ – 220.000đ',
        lat: 10.5968,
        lng: 107.5608,
        address: 'Quốc lộ 55, Xã Bình Châu, Xuyên Mộc, TP. Hồ Chí Minh',
        openHours: '07:30 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  // =========================================================================
  // 3. ĐẶC KHU CÔN ĐẢO — BỔ SUNG THÊM 2 ĐIỂM BIỂU TƯỢNG
  // =========================================================================
  {
    id: 'chua-nui-mot-van-son-tu-con-dao',
    city: 'Côn Đảo · TP. Hồ Chí Minh',
    district: 'Côn Đảo',
    lat: 8.6815,
    lng: 106.5973,
    category: 'temple',
    rating: 4.9,
    reviewCount: 6180,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Núi Một, Đặc khu Côn Đảo, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Chùa Núi Một (Vân Sơn Tự) – Côn Đảo',
        shortSummary:
          'Ngôi chùa duy nhất trên đảo Côn Sơn có thế phong thủy đẹp bậc nhất Việt Nam: lưng tựa Núi Một xanh ngát, mặt hướng ra hồ sen An Hải và toàn cảnh vịnh Côn Sơn bao la.',
        historicalEra: 'Khởi dựng năm 1964 · Trùng tu mở rộng 2011',
        openingHours: '06:00 – 18:30 Hàng ngày',
        architecturalHighlights: [
          'Thế "tựa sơn hướng thủy" tuyệt mỹ nhìn xuống hồ sen An Hải và vịnh Côn Sơn xanh ngọc',
          'Kiến trúc gỗ lim cổ truyền mái đao cong vút chạm khắc tinh xảo trên sườn núi',
          'Tượng Quan Thế Âm Bồ Tát đứng trên đài sen hướng ra biển khơi cầu bình an cho đảo ngọc',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Vân Sơn Tự — thường gọi là Chùa Núi Một — ngôi chùa cổ kính có vị trí phong thủy đẹp bậc nhất tại Đặc khu Côn Đảo.',
          'Từ sân chùa trên sườn Núi Một, du khách có thể thu trọn vào tầm mắt đầm sen An Hải rực hồng phía dưới và vịnh biển Côn Sơn xanh biếc phía xa.',
        ],
      },
      en: {
        name: 'Van Son Tu (Nui Mot Pagoda, Con Dao)',
        shortSummary:
          'Con Dao’s sole Buddhist pagoda, praised for its breathtaking feng-shui perch overlooking An Hai Lotus Lake and emerald Con Son Bay.',
        historicalEra: 'Founded 1964 · Restored 2011',
        openingHours: '06:00 – 18:30 Daily',
        architecturalHighlights: [
          'Dramatic mountain-backed terrace overlooking An Hai Lotus Lake and Con Son Bay',
          'Traditional ironwood temple architecture and sea-facing Quan Yin statue',
        ],
        audioScript: [
          'Welcome to Van Son Tu, known as Nui Mot Pagoda, offering Con Dao’s most serene mountain-and-sea panorama.',
        ],
      },
      fr: {
        name: 'Pagode Van Son Tu (Pagode Nui Mot, Con Dao)',
        shortSummary:
          'Unique pagode de Con Dao, admirée pour sa vue panoramique sur le lac aux lotus An Hai et la baie de Con Son.',
        historicalEra: '1964 / 2011',
        openingHours: '06h00 – 18h30',
        architecturalHighlights: [
          'Vue spectaculaire sur le lac An Hai et la baie de Con Son',
          'Architecture traditionnelle en bois de fer',
        ],
        audioScript: [
          'Bienvenue à la pagode Van Son Tu, joyau spirituel surplombant la baie de Con Son.',
        ],
      },
      zh: {
        name: '昆岛云山寺（一山寺）',
        shortSummary:
          '昆岛唯一的佛寺，背靠苍翠一山、俯瞰安海莲花湖与碧绿昆山湾，被誉为越南风水风景最美古寺之一。',
        historicalEra: '1964年建 · 2011年重修',
        openingHours: '06:00 – 18:30',
        architecturalHighlights: [
          '俯瞰安海莲花湖与昆山湾的绝佳风水全景',
          '传统铁木飞檐大殿与望海观音像',
        ],
        audioScript: [
          '欢迎来到昆岛云山寺，从山巅远眺莲花湖与碧海蓝天，心旷神怡。',
        ],
      },
      ja: {
        name: 'ヴァンソン寺（ヌイモット寺・コンダオ）',
        shortSummary:
          'コンダオ島唯一の仏教寺院。アンハイ蓮池とコンソン湾を一望する絶好の風水ロケーションが魅力です。',
        historicalEra: '1964年創建・2011年改修',
        openingHours: '06:00 – 18:30',
        architecturalHighlights: [
          'アンハイ蓮池とコンソン湾を見下ろす絶景境内',
          '伝統的な鉄木造りの本堂と海を見守る観音像',
        ],
        audioScript: [
          'コンダオ島のヴァンソン寺へようこそ。山と蓮池、そしてエメラルド色の湾を一望できる静かな聖地です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'cnm-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Chùa Núi Một (Vân Sơn Tự) nhìn xuống vịnh Côn Sơn',
          en: 'Van Son Tu (Nui Mot Pagoda) overlooking Con Son Bay',
          fr: 'Pagode Van Son Tu à Con Dao',
          zh: '昆岛云山寺',
          ja: 'コンダオ島ヴァンソン寺',
        },
        yearOrSource: 'Vân Sơn Tự – Đặc khu Côn Đảo',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cd-nm-1',
        name: 'Cơm Niêu & Đặc Sản Biển Côn Sơn',
        cuisine: 'Ẩm thực gia đình Côn Đảo',
        specialtyDishes: ['Cá thu một nắng sốt cà', 'Gỏi cá mập Côn Đảo', 'Canh chua cá bớp'],
        rating: 4.7,
        reviewCount: 1680,
        priceRange: '70.000đ – 220.000đ',
        lat: 8.6841,
        lng: 106.6054,
        address: 'Đường Trần Phú, Đặc khu Côn Đảo, TP. Hồ Chí Minh',
        openHours: '09:00 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },

  {
    id: 'bai-dam-trau-vuon-quoc-gia-con-dao',
    city: 'Côn Đảo · TP. Hồ Chí Minh',
    district: 'Côn Đảo',
    lat: 8.7294,
    lng: 106.6189,
    category: 'ancient_town',
    unescoRecognized: true,
    rating: 4.9,
    reviewCount: 7920,
    ticketPrice: 'Miễn phí tắm biển (Vé trekking VQG từ 60.000đ)',
    address: 'Bãi Đầm Trầu & Vườn Quốc gia Côn Đảo, Đặc khu Côn Đảo, TP. Hồ Chí Minh',
    coverImage:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Bãi Đầm Trầu & Vườn Quốc gia Côn Đảo (Khu Ramsar Thế giới)',
        shortSummary:
          'Bãi biển cát vàng hình trăng khuyết lọt top bãi biển đẹp nhất thế giới (Travel + Leisure) với trải nghiệm ngắm máy bay hạ cánh sát mặt biển, gắn liền Khu Ramsar biển đảo đầu tiên của Việt Nam — nơi bảo tồn rùa xanh (Vích) và san hô nguyên sinh.',
        historicalEra: 'Vườn Quốc gia (1993) · Khu Ramsar Thế giới (2013)',
        openingHours: '06:00 – 18:30 Hàng ngày',
        architecturalHighlights: [
          'Bãi Đầm Trầu hoang sơ nước trong xanh như ngọc và khoảnh khắc ngắm máy bay bay sát đầu cực kỳ ấn tượng',
          'Vườn Quốc gia Côn Đảo — Khu đất ngập nước Ramsar biển đảo đầu tiên của Việt Nam với hơn 1.700 loài sinh vật biển',
          'Cung trekking rừng nguyên sinh Ông Đụng và mùa xem rùa biển đẻ trứng tại Hòn Bảy Cạnh (tháng 4 – tháng 10)',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Bãi Đầm Trầu và Vườn Quốc gia Côn Đảo — Khu Ramsar đất ngập nước tầm quốc tế đầu tiên của Việt Nam tại vùng biển đảo.',
          'Nơi đây không chỉ làm say lòng du khách với làn nước ngọc bích và trải nghiệm ngắm máy bay hạ cánh sát bờ cát vàng, mà còn là mái nhà bảo tồn rùa xanh và rạn san hô quý hiếm bậc nhất Đông Nam Á.',
        ],
      },
      en: {
        name: 'Dam Trau Beach & Con Dao National Park (Ramsar Site)',
        shortSummary:
          'Named among the world’s finest beaches by Travel + Leisure, Dam Trau offers crystal waters and dramatic low-flying aircraft views alongside Vietnam’s first marine Ramsar site protecting sea turtles and coral reefs.',
        historicalEra: 'National Park (1993) · Ramsar Site (2013)',
        openingHours: '06:00 – 18:30 Daily',
        architecturalHighlights: [
          'Crescent golden beach renowned for exhilarating low-altitude airplane landings',
          'Vietnam’s first marine Ramsar wetland safeguarding endangered green sea turtles and vibrant coral reefs',
        ],
        audioScript: [
          'Welcome to Dam Trau Beach and Con Dao National Park, a globally celebrated marine sanctuary famous for turquoise coves, rainforest trails, and sea turtle conservation.',
        ],
      },
      fr: {
        name: 'Plage Dam Trau et Parc national de Con Dao (Site Ramsar)',
        shortSummary:
          'Classée parmi les plus belles plages du monde, adossée au premier site Ramsar marin du Vietnam protégeant tortues marines et coraux.',
        historicalEra: 'Parc national (1993) · Ramsar (2013)',
        openingHours: '06h00 – 18h30',
        architecturalHighlights: [
          'Plage dorée célèbre pour le passage spectaculaire des avions à basse altitude',
          'Sanctuaire marin protégé pour les tortues vertes et récifs coralliens',
        ],
        audioScript: [
          'Bienvenue à la plage Dam Trau et au parc national de Con Dao, joyau écologique marin du Vietnam.',
        ],
      },
      zh: {
        name: '昆岛潭洲海滩与昆岛国家公园（国际湿地）',
        shortSummary:
          '入选《Travel + Leisure》全球最美海滩之一，可近距离观赏飞机掠海降落；毗邻越南首个海洋国际重要湿地，守护海龟与原始珊瑚礁。',
        historicalEra: '1993年国家公园 · 2013年国际湿地',
        openingHours: '06:00 – 18:30',
        architecturalHighlights: [
          '新月形金色沙滩与近距离观赏飞机低空降落的独特体验',
          '越南首个海岛拉姆萨尔国际重要湿地与绿海龟保护区',
        ],
        audioScript: [
          '欢迎来到昆岛潭洲海滩与国家公园，这里拥有澄澈海湾与珍贵的珊瑚海龟生态。',
        ],
      },
      ja: {
        name: 'ダムチャウビーチ・コンダオ国立公園（ラムサール条約湿地）',
        shortSummary:
          '世界の美しいビーチに選ばれる黄金の砂浜と間近を飛ぶ飛行機の絶景、さらにウミガメとサンゴ礁を守る国際保護区です。',
        historicalEra: '国立公園（1993年）・ラムサール湿地（2013年）',
        openingHours: '06:00 – 18:30',
        architecturalHighlights: [
          '透明度の高い三日月ビーチと頭上をかすめる飛行機の迫力ある光景',
          'ベトナム初の海洋ラムサール湿地（アオウミガメ産卵保護区）',
        ],
        audioScript: [
          'ダムチャウビーチとコンダオ国立公園へようこそ。美しい海と豊かな海洋生態系が広がる楽園です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'bdt-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Bãi Đầm Trầu xanh ngọc tại Đặc khu Côn Đảo',
          en: 'Turquoise waters of Dam Trau Beach, Con Dao',
          fr: 'Plage Dam Trau à Con Dao',
          zh: '昆岛潭洲海滩',
          ja: 'コンダオ島ダムチャウビーチ',
        },
        yearOrSource: 'Vườn Quốc gia Côn Đảo – Khu Ramsar Thế giới',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cd-dt-1',
        name: 'Quán Hải Sản Bãi Biển Đầm Trầu',
        cuisine: 'Hải sản nướng tươi bên bãi biển',
        specialtyDishes: ['Ốc vú nàng nướng mỡ hành', 'Cá bò da nướng muối ớt', 'Dừa tươi mát lạnh'],
        rating: 4.7,
        reviewCount: 2310,
        priceRange: '80.000đ – 240.000đ',
        lat: 8.7286,
        lng: 106.6197,
        address: 'Bãi Đầm Trầu, Đặc khu Côn Đảo, TP. Hồ Chí Minh',
        openHours: '08:00 – 18:30',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];
