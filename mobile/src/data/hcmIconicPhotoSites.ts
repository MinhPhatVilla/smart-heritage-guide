import { HeritageSite } from '../types/heritage';

/**
 * 15 điểm tham quan, chụp ảnh lưu niệm, bảo tàng & công trình tôn giáo tiêu biểu
 * tại khu vực Trung tâm TP. Hồ Chí Minh (Quận 1, Quận 3, Quận 4, Bình Thạnh, Quận 7).
 */
export const HCM_ICONIC_PHOTO_SITES: HeritageSite[] = [
  {
    id: 'nha-tho-tan-dinh',
    city: 'Quận 3 · TP.HCM',
    district: 'Quận 3',
    lat: 10.7889,
    lng: 106.6907,
    category: 'temple',
    rating: 4.8,
    reviewCount: 16420,
    ticketPrice: 'Miễn phí tham quan',
    address: '289 Hai Bà Trưng, Phường Võ Thị Sáu, Quận 3, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Nhà thờ Tân Định (Nhà thờ Màu Hồng · 1876)',
        shortSummary:
          'Ngôi nhà thờ Công giáo nổi tiếng toàn cầu với sắc hồng pastel rực rỡ, kết hợp kiến trúc Gothic, Roman và Baroque xây dựng từ năm 1876.',
        historicalEra: '1870 – 1876 (Sơn hồng năm 1957)',
        openingHours: '08:00 – 11:00, 14:00 – 17:00 (Thứ 2 – Thứ 7)',
        architecturalHighlights: [
          'Mặt tiền màu hồng san hô kết hợp viền trắng tinh xảo, là điểm check-in hàng đầu TP.HCM',
          'Tháp chuông chính cao 52,6m với đỉnh chóp bát giác và 5 quả chuông đúc tại Pháp',
          'Bên trong lòng nhà thờ gồm hai hàng cột Gothic vòm cong và bàn thờ đá cẩm thạch Ý',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Nhà thờ Tân Định trên đường Hai Bà Trưng, Quận 3 – một trong những nhà thờ cổ kính và nổi tiếng nhất Thành phố Hồ Chí Minh.',
          'Khởi công năm 1870 và khánh thành năm 1876, công trình mang kiến trúc Gothic kết hợp chi tiết Roman và Baroque. Từ năm 1957, nhà thờ khoác lên sắc hồng pastel đặc trưng và trở thành biểu tượng nhiếp ảnh của du khách khắp thế giới.',
          'Góc chụp lưu niệm đẹp nhất là từ ban công các quán cà phê đối diện bên kia đường Hai Bà Trưng vào buổi sáng sớm khi nắng chiếu xiên lên tháp chuông cao hơn 52 mét.',
        ],
      },
      en: {
        name: 'Tan Dinh Church (The Pink Church · 1876)',
        shortSummary:
          'A world-famous pastel-pink Roman Catholic church built in 1876, blending Gothic spires with Romanesque and Baroque accents.',
        historicalEra: '1870 – 1876 (Painted pink in 1957)',
        openingHours: '08:00 – 11:00, 14:00 – 17:00 (Mon – Sat)',
        architecturalHighlights: [
          'Iconic pastel-pink facade with crisp white Gothic tracery',
          '52.6-meter main bell tower housing five French-cast bells',
          'Italian marble altars framed by tall arched colonnades',
        ],
        audioScript: [
          'Welcome to Tan Dinh Church on Hai Ba Trung Street, famously known worldwide as Saigon’s Pink Church.',
          'Completed in 1876 in Gothic-Romanesque style and painted pastel pink in 1957, it is one of Ho Chi Minh City’s most photographed landmarks.',
        ],
      },
      fr: {
        name: 'Église Tan Dinh (L’Église Rose · 1876)',
        shortSummary:
          'Célèbre église catholique rose pastel édifiée en 1876 mêlant style gothique, roman et baroque, incontournable pour la photographie.',
        historicalEra: '1870 – 1876',
        openingHours: '08h00 – 11h00, 14h00 – 17h00',
        architecturalHighlights: [
          'Façade rose pastel unique ornée de moulures blanches',
          'Clocher principal de 52,6 mètres et autels en marbre d’Italie',
        ],
        audioScript: [
          'Bienvenue à l’église Tan Dinh, surnommée l’Église Rose de Saïgon, achevée en 1876.',
        ],
      },
      zh: {
        name: '新定教堂（西贡粉红教堂 · 1876年）',
        shortSummary:
          '建于1876年的梦幻粉红色天主教堂，融合哥特式与罗马式建筑美学，是胡志明市最具人气的网红打卡地标。',
        historicalEra: '1870 – 1876年',
        openingHours: '08:00 – 11:00, 14:00 – 17:00',
        architecturalHighlights: [
          '标志性粉红与纯白相间的哥特式外墙',
          '高52.6米的主钟楼与意大利大理石祭坛',
        ],
        audioScript: [
          '欢迎来到第三郡的新定教堂，这座建于1876年的粉红教堂是胡志明市最受欢迎的拍照地标之一。',
        ],
      },
      ja: {
        name: 'タンディン教会（ピンクの教会・1876年）',
        shortSummary:
          '1876年に完成した鮮やかなパステルピンクのカトリック教会。ゴシックとロマネスク様式が融合した市内屈指のフォトスポットです。',
        historicalEra: '1870年 – 1876年',
        openingHours: '08:00 – 11:00, 14:00 – 17:00',
        architecturalHighlights: [
          'パステルピンクの外壁と白い繊細な装飾',
          '高さ52.6mの主鐘楼とイタリア産大理石の祭壇',
        ],
        audioScript: [
          'ピンクの教会として世界的に人気のタンディン教会へようこそ。1876年に完成した歴史ある聖堂です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'nttd-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Nhà thờ Tân Định nổi bật giữa trục đường Hai Bà Trưng, Quận 3',
          en: 'Tan Dinh Pink Church along Hai Ba Trung Street, District 3',
          fr: 'L’église rose Tan Dinh dans le 3e arrondissement',
          zh: '第三郡二征夫人街上的粉红教堂',
          ja: '3区ハイバーチュン通りに建つタンディン教会',
        },
        yearOrSource: 'Di sản Kiến trúc Tôn giáo TP.HCM',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-nttd-1',
        name: 'Cộng Cà Phê Tân Định (View Nhà thờ Hồng)',
        cuisine: 'Cà phê Sài Gòn & Điểm check-in',
        specialtyDishes: ['Cà phê cốt dừa', 'Bạc xỉu đá', 'Cà phê sữa đá'],
        rating: 4.7,
        reviewCount: 4120,
        priceRange: '45.000đ – 75.000đ',
        lat: 10.7891,
        lng: 106.6902,
        address: '274 Hai Bà Trưng, Phường Tân Định, Quận 1, TP.HCM',
        openHours: '07:00 – 22:30',
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'pho-di-bo-nguyen-hue-chung-cu-42',
    city: 'Quận 1 · TP.HCM',
    district: 'Quận 1',
    lat: 10.7743,
    lng: 106.7037,
    category: 'ancient_town',
    rating: 4.8,
    reviewCount: 28500,
    ticketPrice: 'Miễn phí tham quan',
    address: '42 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Phố đi bộ Nguyễn Huệ & Chung cư 42 Nguyễn Huệ',
        shortSummary:
          'Đại lộ đi bộ sôi động bậc nhất TP.HCM nối UBND Thành phố ra sông Sài Gòn, nổi bật với tổ hợp 9 tầng quán cà phê – boutique tại Chung cư 42 Nguyễn Huệ.',
        historicalEra: 'Kênh Charner (1887) – Phố đi bộ (2015)',
        openingHours: 'Mở cửa 24/7 (Đẹp nhất 17:30 – 22:30)',
        architecturalHighlights: [
          'Quảng trường đi bộ dài 670m lát đá granit kèm đài phun nước nghệ thuật & tượng đài Chủ tịch Hồ Chí Minh',
          'Chung cư 42 Nguyễn Huệ (xây thập niên 1960) với hàng chục ban công cà phê sáng đèn rực rỡ như tổ ong hiện đại',
          'Kết nối trực tiếp Nhà hát Thành phố, UBND TP.HCM, Tháp Bitexco và Bến Bạch Đằng',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Phố đi bộ Nguyễn Huệ và Chung cư 42 Nguyễn Huệ – trái tim nhịp sống trẻ trung của Sài Gòn.',
          'Xưa kia đại lộ này từng là con kênh Lớn dẫn thuyền buôn vào thành Gia Định, được lấp cuối thế kỷ 19 và trở thành phố đi bộ hiện đại từ năm 2015.',
          'Ngay bên cạnh là Chung cư 42 Nguyễn Huệ xây từ thập niên 1960, nơi các căn hộ cũ đã hóa thân thành hàng chục quán cà phê và cửa hiệu sáng tạo, tạo nên khung cảnh lên đèn tuyệt đẹp mỗi buổi tối.',
        ],
      },
      en: {
        name: 'Nguyen Hue Walking Street & 42 Cafe Apartments',
        shortSummary:
          'Ho Chi Minh City’s premier pedestrian boulevard linking City Hall to the Saigon River, anchored by the iconic nine-story 42 Cafe Apartments.',
        historicalEra: '1887 Boulevard – 2015 Pedestrian Plaza',
        openingHours: 'Open 24/7 (Best 17:30 – 22:30)',
        architecturalHighlights: [
          '670-meter granite-paved promenade with musical fountains and evening street life',
          '1960s 42 Nguyen Hue concrete block transformed into stacked boutique cafes glowing at night',
          'Direct walking axis between City Hall, Opera House, Bitexco, and Bach Dang Wharf',
        ],
        audioScript: [
          'Welcome to Nguyen Hue Walking Street and the famous 42 Nguyen Hue Cafe Apartments in central District 1.',
          'From a 19th-century canal to today’s lively granite promenade, this avenue showcases Saigon’s vibrant blend of heritage facades and modern cafe culture.',
        ],
      },
      fr: {
        name: 'Rue piétonne Nguyen Hue & Immeuble Café 42',
        shortSummary:
          'Grande promenade piétonne reliant l’Hôtel de Ville au fleuve Saïgon, célèbre pour l’immeuble 42 Nguyen Hue transformé en dizaines de cafés.',
        historicalEra: '1887 – 2015',
        openingHours: '24h/24',
        architecturalHighlights: [
          'Esplanade de 670m animée chaque soir par des spectacles de rue',
          'Immeuble rétro des années 1960 aux balcons illuminés de cafés indépendants',
        ],
        audioScript: [
          'Bienvenue sur la rue piétonne Nguyen Hue et devant le célèbre immeuble des cafés au numéro 42.',
        ],
      },
      zh: {
        name: '阮惠步行街与42号咖啡公寓',
        shortSummary:
          '胡志明市最繁华的中心步行大道，标志性的九层42号咖啡公寓汇集数十家创意咖啡馆与买手店，夜景迷人。',
        historicalEra: '1887年大道 – 2015年步行街',
        openingHours: '全天开放（17:30 – 22:30最佳）',
        architecturalHighlights: [
          '长670米的花岗岩步行广场与音乐喷泉',
          '夜幕下灯光璀璨的九层42号复古咖啡公寓外立面',
        ],
        audioScript: [
          '欢迎来到胡志明市中心的阮惠步行街与网红地标42号咖啡公寓，夜晚阳台灯光极为出片。',
        ],
      },
      ja: {
        name: 'グエンフエ歩行者天国とカフェアパートメント42',
        shortSummary:
          '人民委員会庁舎からサイゴン川へ延びる大通り。古い集合住宅を改装した9階建てのカフェアパートメント42番地が夜景スポットとして大人気。',
        historicalEra: '1887年 – 2015年歩行者天国化',
        openingHours: '24時間開放（夕方〜夜がおすすめ）',
        architecturalHighlights: [
          '全長670mの御影石プロムナードと夜の噴水ライトアップ',
          '個性豊かなカフェが集まる1960年代の42番地ビル',
        ],
        audioScript: [
          'ホーチミン市の中心、グエンフエ通りと名物カフェアパートメント42番地へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'nh42-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Phố đi bộ Nguyễn Huệ và tòa Chung cư 42 Nguyễn Huệ rực rỡ về đêm',
          en: 'Nguyen Hue Walking Street and 42 Cafe Apartments at dusk',
          fr: 'La rue piétonne Nguyen Hue et l’immeuble 42',
          zh: '阮惠步行街与42号咖啡公寓',
          ja: 'グエンフエ通りとカフェアパートメント42',
        },
        yearOrSource: 'Trung tâm Văn hóa – Đô thị Quận 1',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-nh42-1',
        name: 'Partea – English Tearoom (Tầng 4 Chung cư 42)',
        cuisine: 'Trà chiều & Cà phê View Phố đi bộ',
        specialtyDishes: ['Trà hoa anh quốc', 'Bánh scones kem tươi', 'Cà phê sữa Sài Gòn'],
        rating: 4.7,
        reviewCount: 2850,
        priceRange: '60.000đ – 140.000đ',
        lat: 10.7744,
        lng: 106.7039,
        address: 'Tầng 4, 42 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
        openHours: '09:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'ben-bach-dang-cau-ba-son',
    city: 'Quận 1 · TP.HCM',
    district: 'Quận 1',
    lat: 10.7736,
    lng: 106.7069,
    category: 'monument',
    rating: 4.8,
    reviewCount: 19200,
    ticketPrice: 'Miễn phí (Waterbus 15.000đ/lượt)',
    address: 'Công viên Bến Bạch Đằng, Đường Tôn Đức Thắng, Quận 1, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Công viên Bến Bạch Đằng & Cầu Ba Son (Saigon Waterbus)',
        shortSummary:
          'Không gian công viên ven sông Sài Gòn tuyệt đẹp ngay trung tâm Quận 1, nơi đón buýt đường sông Saigon Waterbus và ngắm trọn Cầu dây văng Ba Son lúc hoàng hôn.',
        historicalEra: 'Bến cảng lịch sử Sài Gòn – Chỉnh trang 2022',
        openingHours: 'Mở cửa 24/7 (Waterbus 07:00 – 21:00)',
        architecturalHighlights: [
          'Cầu dây văng Ba Son (Thủ Thiêm 2) với trụ tháp nghiêng 113m biểu tượng mới của sông Sài Gòn',
          'Bến tàu Saigon Waterbus nối Quận 1 đi Thanh Đa – Bình An – Linh Đông chỉ 15.000đ',
          'Lối đi bộ thoáng mát nhìn toàn cảnh bán đảo Thủ Thiêm và tòa tháp Landmark 81',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Công viên Bến Bạch Đằng bên bờ Tây sông Sài Gòn – điểm dạo mát, ngắm hoàng hôn và chụp ảnh đường chân trời đẹp bậc nhất thành phố.',
          'Từ đây, quý khách có thể thu trọn vào ống kính cây Cầu dây văng Ba Son cao 113 mét vươn mình qua sông, hoặc lên chuyến buýt đường sông Saigon Waterbus để ngắm Sài Gòn từ mặt nước.',
        ],
      },
      en: {
        name: 'Bach Dang Wharf Park & Ba Son Bridge (Saigon Waterbus)',
        shortSummary:
          'A breezy Saigon Riverfront promenade in District 1 featuring the Saigon Waterbus pier and panoramic sunset views of the cable-stayed Ba Son Bridge.',
        historicalEra: 'Historic Saigon Waterfront – Revamped 2022',
        openingHours: 'Open 24/7 (Waterbus 07:00 – 21:00)',
        architecturalHighlights: [
          '113-meter asymmetrical cable-stayed Ba Son Bridge spanning the Saigon River',
          'Saigon Waterbus terminal offering scenic 15,000 VND river rides',
          'Unobstructed skyline views toward Thu Thiem and Landmark 81',
        ],
        audioScript: [
          'Welcome to Bach Dang Wharf Park along the Saigon River, the departure point for the Saigon Waterbus and a favorite sunset spot overlooking Ba Son Bridge.',
        ],
      },
      fr: {
        name: 'Quai Bach Dang & Pont Ba Son (Saigon Waterbus)',
        shortSummary:
          'Promenade verdoyante au bord du fleuve Saïgon avec embarcadère du Waterbus et vue imprenable sur le pont à haubans Ba Son.',
        historicalEra: 'Quai historique – Rénové en 2022',
        openingHours: '24h/24',
        architecturalHighlights: [
          'Pont à haubans Ba Son haut de 113 mètres',
          'Départ du bateau-bus Saigon Waterbus au coucher du soleil',
        ],
        audioScript: [
          'Bienvenue au parc du quai Bach Dang, point de départ du Saigon Waterbus face au pont Ba Son.',
        ],
      },
      zh: {
        name: '白藤码头公园与巴松大桥（西贡水上巴士）',
        shortSummary:
          '位于第一郡西贡河畔的绝美滨水公园，可乘坐西贡水上巴士并拍摄巴松斜拉桥与守添天际线的日落美景。',
        historicalEra: '历史码头 – 2022年焕新开放',
        openingHours: '全天开放（水上巴士 07:00 – 21:00）',
        architecturalHighlights: [
          '高达113米的巴松斜拉桥现代地标',
          '仅需15,000越南盾的西贡河水上巴士体验',
        ],
        audioScript: [
          '欢迎来到西贡河畔的白藤码头公园，在这里可以搭乘水上巴士并欣赏巴松大桥迷人日落。',
        ],
      },
      ja: {
        name: 'バクダン公園・バーソン橋（サイゴン水上バス）',
        shortSummary:
          'サイゴン川沿いの開放的な公園。15,000ドンで乗れる水上バス乗り場があり、美しい斜張橋バーソン橋の夕景スポットとして人気です。',
        historicalEra: '歴史的船着場 – 2022年リニューアル',
        openingHours: '24時間開放（水上バス 07:00 – 21:00）',
        architecturalHighlights: [
          '高さ113mの近代的な斜張橋バーソン橋',
          'サイゴン川をクルーズできる水上バス発着所',
        ],
        audioScript: [
          'サイゴン川沿いのバクダン公園へようこそ。バーソン橋の夕景や水上バスの乗船が楽しめます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'bbd-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Cảnh quan sông Sài Gòn, Bến Bạch Đằng và Cầu Ba Son lúc chiều tà',
          en: 'Saigon Riverfront, Bach Dang Wharf, and Ba Son Bridge at golden hour',
          fr: 'Le fleuve Saïgon et le quai Bach Dang',
          zh: '黄昏时分的白藤码头与巴松大桥',
          ja: '夕暮れのバクダン公園とバーソン橋',
        },
        yearOrSource: 'Công viên Bờ sông Quận 1',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-bbd-1',
        name: 'Katinat Bến Bạch Đằng (Saigon Waterbus)',
        cuisine: 'Cà phê & Trà trái cây ven sông',
        specialtyDishes: ['Trà sữa chôm chôm', 'Cà phê sữa đá', 'Bánh croissant bơ'],
        rating: 4.6,
        reviewCount: 3250,
        priceRange: '45.000đ – 80.000đ',
        lat: 10.7734,
        lng: 106.7067,
        address: '10B Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP.HCM',
        openHours: '07:00 – 23:00',
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'cot-co-thu-ngu',
    city: 'Quận 1 · TP.HCM',
    district: 'Quận 1',
    lat: 10.7706,
    lng: 106.7061,
    category: 'monument',
    rating: 4.7,
    reviewCount: 3420,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Công viên Bến Bạch Đằng, Ngã ba sông Sài Gòn – Kênh Bến Nghé, Quận 1',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Di tích Cột cờ Thủ Ngữ (1865)',
        shortSummary:
          'Một trong những công trình cổ nhất Sài Gòn xây dựng năm 1865 ngay ngã ba sông Sài Gòn – kênh Bến Nghé, từng làm cột tín hiệu cho tàu thuyền ra vào cảng.',
        historicalEra: 'Khởi dựng năm 1865 (Hơn 160 năm tuổi)',
        openingHours: 'Mở cửa 24/7',
        architecturalHighlights: [
          'Kiến trúc bát giác cổ điển sơn trắng – mái ngói đỏ nổi bật bên công viên ven sông',
          'Cột cờ cao vút từng treo cờ hiệu hướng dẫn hải hành cho thương cảng Sài Gòn thế kỷ 19',
          'Nằm trên trục đi bộ ven sông nối Bến Bạch Đằng, Cầu Mống và Bến Nhà Rồng',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Di tích Cột cờ Thủ Ngữ – công trình lịch sử hơn 160 năm tuổi tọa lạc ngay mũi ngã ba sông Sài Gòn và rạch Bến Nghé.',
          'Được xây dựng vào tháng 10 năm 1865, Cột cờ Thủ Ngữ xưa kia làm nhiệm vụ treo cờ tín hiệu điều phối tàu thuyền quốc tế ra vào thương cảng Sài Gòn, đồng thời ghi dấu tinh thần chiến đấu anh dũng của nhân dân Nam Bộ năm 1945.',
        ],
      },
      en: {
        name: 'Thu Ngu Flagpole Historic Monument (1865)',
        shortSummary:
          'Built in 1865 at the confluence of the Saigon River and Ben Nghe Canal, one of the oldest surviving maritime landmarks of historic Saigon.',
        historicalEra: 'Built in 1865',
        openingHours: 'Open 24/7',
        architecturalHighlights: [
          'Restored octagonal white pavilion with terracotta tile roof on the riverfront',
          '19th-century maritime signal mast guiding ships into Saigon Port',
          'Scenic riverside walk connecting Bach Dang Wharf and Mong Bridge',
        ],
        audioScript: [
          'Welcome to the Thu Ngu Flagpole, constructed in 1865 as a maritime signal station at the entrance to historic Saigon Port.',
        ],
      },
      fr: {
        name: 'Mât de Pavillon Thu Ngu (1865)',
        shortSummary:
          'Édifié en 1865 au confluent du fleuve Saïgon et du canal Ben Nghe, l’un des plus anciens vestiges portuaires de la ville.',
        historicalEra: '1865',
        openingHours: '24h/24',
        architecturalHighlights: [
          'Pavillon octogonal blanc au toit de tuiles rouges face au fleuve',
          'Ancien poste de signalisation maritime du port de Saïgon',
        ],
        audioScript: [
          'Bienvenue au mât Thu Ngu, érigé en 1865 pour guider les navires entrant dans le port de Saïgon.',
        ],
      },
      zh: {
        name: '守御旗杆历史遗迹（1865年）',
        shortSummary:
          '建于1865年的西贡最古老海事建筑之一，坐落于西贡河与滨艺涌交汇处，曾为进出西贡港的船只悬挂信号旗。',
        historicalEra: '始建于1865年',
        openingHours: '全天开放',
        architecturalHighlights: [
          '白墙红瓦八角亭与高耸信号旗杆',
          '串联白藤码头、彩虹桥与龙屋码头的滨水历史步道',
        ],
        audioScript: [
          '欢迎来到建于1865年的守御旗杆遗迹，它曾是十九世纪西贡商港重要的航运信号站。',
        ],
      },
      ja: {
        name: 'トゥーグー旗竿遺跡（1865年）',
        shortSummary:
          '1865年にサイゴン川とベンゲー運河の合流点に建てられた市内最古級の海事遺跡。かつて港に出入りする船の信号所でした。',
        historicalEra: '1865年建造',
        openingHours: '24時間開放',
        architecturalHighlights: [
          '川沿いに映える白壁と赤瓦の八角形パビリオン',
          'バクダン公園とモン橋を結ぶ絶好の散策フォトスポット',
        ],
        audioScript: [
          '1865年建造のトゥーグー旗竿へようこそ。サイゴン港の歴史を見守り続けてきた由緒ある遺跡です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'cctn-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Di tích Cột cờ Thủ Ngữ bên ngã ba sông Sài Gòn – kênh Bến Nghé',
          en: 'Thu Ngu Flagpole at the Saigon River confluence',
          fr: 'Le mât Thu Ngu au bord du fleuve Saïgon',
          zh: '西贡河畔守御旗杆遗迹',
          ja: 'サイゴン川沿いのトゥーグー旗竿',
        },
        yearOrSource: 'Di tích Lịch sử Cấp Thành phố',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cctn-1',
        name: 'Bánh Mì Chảo & Cà Phê Bến Chương Dương',
        cuisine: 'Điểm tâm & Cà phê Sài Gòn',
        specialtyDishes: ['Bánh mì chảo ốp la pate', 'Cà phê sữa đá', 'Hủ tiếu nam vang'],
        rating: 4.5,
        reviewCount: 780,
        priceRange: '40.000đ – 85.000đ',
        lat: 10.7704,
        lng: 106.7048,
        address: 'Võ Văn Kiệt – Hàm Nghi, Phường Nguyễn Thái Bình, Quận 1, TP.HCM',
        openHours: '06:30 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'cau-mong-sai-gon',
    city: 'Quận 1 · TP.HCM',
    district: 'Quận 1',
    lat: 10.7685,
    lng: 106.7039,
    category: 'monument',
    rating: 4.7,
    reviewCount: 6840,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Kênh Bến Nghé, nối đường Võ Văn Kiệt (Q.1) & Bến Vân Đồn (Q.4)',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Cầu Mống Sài Gòn (Di tích Kiến trúc 1894)',
        shortSummary:
          'Cây cầu bộ hành bằng thép màu xanh ngọc xây năm 1893–1894 bởi công ty Levallois-Perret (công ty của Gustave Eiffel), mang dáng cầu vồng cổ điển cực ăn ảnh.',
        historicalEra: '1893 – 1894 (Hơn 130 năm tuổi)',
        openingHours: 'Mở cửa 24/7',
        architecturalHighlights: [
          'Kết cấu vòm thép tán đinh thế kỷ 19 dài 128m, sơn màu xanh ngọc bích đặc trưng',
          'Thiết kế uốn cong như cầu vồng – góc chụp ảnh vintage tuyệt đẹp với nền Tháp Bitexco phía sau',
          'Nằm ngay cạnh Tòa nhà Ngân hàng Nhà nước kiến trúc Art Deco 1929',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Cầu Mống – một trong những cây cầu thép cổ nhất Sài Gòn được xây dựng năm 1893 đến 1894 bởi hãng xây dựng Levallois-Perret của kỹ sư Gustave Eiffel.',
          'Ngày nay Cầu Mống dành riêng cho người đi bộ, là tọa độ hóng gió, ngắm hoàng hôn và chụp ảnh lưu niệm đối lập cực kỳ thú vị giữa nét sắt thép trăm tuổi và Tháp Bitexco hiện đại.',
        ],
      },
      en: {
        name: 'Mong Bridge (Historic 1894 Eiffel Iron Footbridge)',
        shortSummary:
          'A turquoise riveted-steel pedestrian bridge built in 1893–1894 by Gustave Eiffel’s firm, spanning Ben Nghe Canal between District 1 and District 4.',
        historicalEra: '1893 – 1894',
        openingHours: 'Open 24/7',
        architecturalHighlights: [
          '128-meter rainbow-arched turquoise iron truss from the late 19th century',
          'Iconic photo angle framing vintage ironwork against the modern Bitexco Tower',
          'Steps away from the 1929 Art Deco State Bank Building',
        ],
        audioScript: [
          'Welcome to Mong Bridge, a turquoise iron pedestrian bridge built in 1894 by Gustave Eiffel’s engineering company, offering classic skyline photo angles.',
        ],
      },
      fr: {
        name: 'Pont Mong (Passerelle Eiffel · 1894)',
        shortSummary:
          'Passerelle métallique turquoise construite en 1893–1894 par la société de Gustave Eiffel au-dessus du canal Ben Nghe.',
        historicalEra: '1893 – 1894',
        openingHours: '24h/24',
        architecturalHighlights: [
          'Arche métallique en fer riveté longue de 128 mètres',
          'Contraste photogénique avec la tour Bitexco',
        ],
        audioScript: [
          'Bienvenue sur le pont Mong, passerelle piétonne construite en 1894 par les ateliers Eiffel.',
        ],
      },
      zh: {
        name: '彩虹桥（西贡百年铁桥 · 1894年）',
        shortSummary:
          '建于1893–1894年的薄荷绿铆接铁艺步行桥，由埃菲尔公司承建，与现代金融塔同框极具复古电影感。',
        historicalEra: '1893 – 1894年',
        openingHours: '全天开放',
        architecturalHighlights: [
          '长128米的十九世纪复古薄荷绿拱形钢架桥',
          '夕阳下拍摄金融塔与运河倒影的绝佳机位',
        ],
        audioScript: [
          '欢迎来到建于1894年的彩虹步行桥，这座薄荷绿百年铁桥是西贡最具复古气息的拍照地之一。',
        ],
      },
      ja: {
        name: 'モン橋（1894年エッフェル社建造の歩道橋）',
        shortSummary:
          '1894年にエッフェル社が建設したターコイズブルーの歴史的鉄橋。レトロな鉄骨と近代的なビテクスコタワーの対比が絶好の撮影スポットです。',
        historicalEra: '1893年 – 1894年',
        openingHours: '24時間開放',
        architecturalHighlights: [
          '全長128mの虹形アーチを持つ19世紀の鉄製歩道橋',
          '夕暮れ時の運河とスカイラインの絶景ポイント',
        ],
        audioScript: [
          '1894年に建造された歴史ある歩道橋、モン橋へようこそ。レトロな造形と高層ビルの対比が魅力です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'cm-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Cầu Mống xanh ngọc bắc qua kênh Bến Nghé nhìn về Quận 1',
          en: 'Turquoise Mong Bridge spanning Ben Nghe Canal',
          fr: 'Le pont Mong au-dessus du canal Ben Nghe',
          zh: '横跨滨艺涌的百年彩虹桥',
          ja: 'ベンゲー運河にかかるターコイズ色のモン橋',
        },
        yearOrSource: 'Di sản Kiến trúc Cầu cổ TP.HCM',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cm-1',
        name: 'Phố Ốc & Bún Đậu Bến Vân Đồn (Đầu Cầu Mống Q.4)',
        cuisine: 'Ẩm thực Đường phố Quận 4',
        specialtyDishes: ['Ốc hương rang muối ớt', 'Sò điệp nướng mỡ hành', 'Nước mía sầu riêng'],
        rating: 4.6,
        reviewCount: 1620,
        priceRange: '45.000đ – 150.000đ',
        lat: 10.7676,
        lng: 106.7034,
        address: 'Bến Vân Đồn, Phường 12, Quận 4, TP.HCM',
        openHours: '15:00 – 23:00',
        imageUrl:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'ho-con-rua-cong-truong-quoc-te',
    city: 'Quận 3 · TP.HCM',
    district: 'Quận 3',
    lat: 10.7827,
    lng: 106.6959,
    category: 'monument',
    rating: 4.6,
    reviewCount: 15800,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Công trường Quốc tế (Giao lộ Võ Văn Tần – Phạm Ngọc Thạch – Trần Cao Vân), Q.3',
    coverImage:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Hồ Con Rùa (Công trường Quốc tế · 1967)',
        shortSummary:
          'Vòng xoay di sản đô thị nổi tiếng nhất Sài Gòn với đài tháp bát giác 5 cột trắng vươn cao, điểm hẹn ăn vặt bánh tráng trộn và cảm nhận nhịp sống trẻ Quận 3.',
        historicalEra: '1965 – 1967 (KTS Nguyễn Kỳ)',
        openingHours: 'Mở cửa 24/7 (Nhộn nhịp nhất 17:00 – 22:30)',
        architecturalHighlights: [
          'Hồ nước hình bát giác với 4 lối đi bộ xoắn ốc dẫn lên đài trung tâm và 5 cột bê tông cách điệu bàn tay',
          'Nằm tại nút giao 3 trục đường rợp bóng cây cổ thụ đẹp nhất khu trung tâm',
          'Bao quanh là chuỗi quán cà phê sân vườn, bánh tráng nướng, trà đào đậm chất sinh viên Sài Gòn',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Hồ Con Rùa – Công trường Quốc tế tại Quận 3, công trình kiến trúc đô thị mang dấu ấn thập niên 1960 do Kiến trúc sư Nguyễn Kỳ thiết kế.',
          'Không chỉ là một nút giao thông cổ thụ xanh mát cách Nhà thờ Đức Bà chưa đầy 5 phút đi bộ, Hồ Con Rùa còn là ký ức ẩm thực đường phố khó quên với bánh tráng trộn, bắp xào và những buổi chiều hóng mát của người dân thành phố.',
        ],
      },
      en: {
        name: 'Turtle Lake (International Square · 1967)',
        shortSummary:
          'A beloved 1960s octagonal water plaza and roundabout in District 3, famous for its modernist five-pillar tower and lively evening street-snack culture.',
        historicalEra: '1965 – 1967',
        openingHours: 'Open 24/7 (Liveliest 17:00 – 22:30)',
        architecturalHighlights: [
          'Octagonal fountain basin with spiral walkways and five soaring modernist pillars',
          'Shaded intersection linking leafy District 3 boulevards near Notre-Dame Cathedral',
          'Hub of Saigon youth snack culture: rice paper salad, grilled rice paper, and iced tea',
        ],
        audioScript: [
          'Welcome to Turtle Lake in District 3, an iconic 1960s roundabout fountain and one of Saigon’s favorite evening gathering spots for street snacks and coffee.',
        ],
      },
      fr: {
        name: 'Lac de la Tortue (Place Internationale · 1967)',
        shortSummary:
          'Place octogonale emblématique des années 1960 au cœur du 3e arrondissement, célèbre pour son ambiance conviviale et sa street-food en soirée.',
        historicalEra: '1965 – 1967',
        openingHours: '24h/24',
        architecturalHighlights: [
          'Bassin octogonal et tour moderniste à cinq colonnes',
          'Rendez-vous incontournable de la jeunesse saïgonnaise à la tombée du jour',
        ],
        audioScript: [
          'Bienvenue au Lac de la Tortue, lieu de rencontre emblématique et convivial du 3e arrondissement.',
        ],
      },
      zh: {
        name: '乌龟湖（国际广场 · 1967年）',
        shortSummary:
          '第三郡最具西贡青春气息的八角形喷泉广场，以现代主义五柱纪念塔与傍晚热闹的街头小吃闻名。',
        historicalEra: '1965 – 1967年',
        openingHours: '全天开放（17:00 – 22:30最热闹）',
        architecturalHighlights: [
          '八角形水池与螺旋步道中央五柱造型塔',
          '体验西贡地道拌米纸、烤米纸与街边咖啡的绝佳地点',
        ],
        audioScript: [
          '欢迎来到第三郡的乌龟湖广场，这里既是复古地标，也是体验胡志明市年轻人夜生活与街头美食的热门地。',
        ],
      },
      ja: {
        name: '亀湖（国際広場・1967年）',
        shortSummary:
          '1960年代のモダニズム塔が立つ3区の八角形ロータリー広場。夕方は若者たちが集まり、バインチャンチョンなど屋台グルメを楽しめます。',
        historicalEra: '1965年 – 1967年',
        openingHours: '24時間開放（夕方〜夜が賑やか）',
        architecturalHighlights: [
          '八角形の噴水池と5本の柱が伸びるレトロなモニュメント',
          'サイゴン名物のストリートスナックとカフェが集う広場',
        ],
        audioScript: [
          '3区のランドマーク、亀湖（ホーコンルア）へようこそ。夕暮れ時の屋台グルメと市民の憩いの風景が魅力です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'hcr-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Hồ Con Rùa xanh mát giữa giao lộ trung tâm Quận 3',
          en: 'Turtle Lake octagonal plaza in District 3',
          fr: 'Le Lac de la Tortue dans le 3e arrondissement',
          zh: '第三郡乌龟湖广场',
          ja: '3区の亀湖ロータリー広場',
        },
        yearOrSource: 'Di sản Đô thị Sài Gòn thập niên 1960',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-hcr-1',
        name: 'Bánh Tráng Nướng & Trà Đào Hồ Con Rùa',
        cuisine: 'Ăn vặt Đường phố Sài Gòn',
        specialtyDishes: ['Bánh tráng nướng Đà Lạt', 'Bánh tráng trộn', 'Trà đào cam sả'],
        rating: 4.6,
        reviewCount: 2650,
        priceRange: '20.000đ – 50.000đ',
        lat: 10.7829,
        lng: 106.6962,
        address: 'Công trường Quốc tế, Phường Võ Thị Sáu, Quận 3, TP.HCM',
        openHours: '15:30 – 22:30',
        imageUrl:
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'thap-bitexco-saigon-skydeck',
    city: 'Quận 1 · TP.HCM',
    district: 'Quận 1',
    lat: 10.7717,
    lng: 106.7044,
    category: 'monument',
    rating: 4.7,
    reviewCount: 22400,
    ticketPrice: '240.000đ (Saigon Skydeck tầng 49)',
    address: '02 Hải Triều, Phường Bến Nghé, Quận 1, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Tháp Tài chính Bitexco & Đài quan sát Saigon Skydeck',
        shortSummary:
          'Tòa tháp 68 tầng cao 262m lấy cảm hứng từ búp sen vươn lên trời xanh, sở hữu sân đỗ trực thăng tầng 52 và đài quan sát 360° Saigon Skydeck ở tầng 49.',
        historicalEra: 'Khánh thành năm 2010 (KTS Carlos Zapata)',
        openingHours: '09:30 – 21:30 Hàng ngày',
        architecturalHighlights: [
          'Hình khối búp hoa sen vươn cao – biểu tượng chuyển mình hiện đại của TP.HCM',
          'Đài quan sát Saigon Skydeck tầng 49 (cao 178m) với ống nhòm toàn cảnh 360° & Bảo tàng Áo dài mini',
          'Sân đỗ trực thăng vươn dài 22m ra ngoài không trung tại tầng 52 độc nhất Việt Nam',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Tháp Tài chính Bitexco tại số 2 Hải Triều, Quận 1 – công trình kiến trúc 68 tầng lấy cảm hứng từ đóa hoa sen Việt Nam do kiến trúc sư Carlos Zapata thiết kế.',
          'Từ Đài quan sát Saigon Skydeck ở tầng 49, quý khách có thể phóng tầm mắt 360 độ ngắm toàn bộ các di tích lịch sử Quận 1, dòng sông Sài Gòn uốn lượn và khung cảnh thành phố rực rỡ ánh đèn lúc hoàng hôn.',
        ],
      },
      en: {
        name: 'Bitexco Financial Tower & Saigon Skydeck',
        shortSummary:
          'A 68-story lotus-inspired skyscraper in District 1 featuring a cantilevered 52nd-floor helipad and the 360-degree Saigon Skydeck observatory on floor 49.',
        historicalEra: 'Completed in 2010 (Carlos Zapata)',
        openingHours: '09:30 – 21:30 Daily',
        architecturalHighlights: [
          '262-meter lotus-bud glass tower symbolizing Ho Chi Minh City’s modern dynamism',
          '49th-floor Saigon Skydeck (178m high) with 360-degree skyline views & mini Ao Dai display',
          'Signature 22-meter cantilevered helipad jutting out from the 52nd floor',
        ],
        audioScript: [
          'Welcome to Bitexco Financial Tower, Ho Chi Minh City’s lotus-shaped architectural icon featuring the 49th-floor Saigon Skydeck observatory.',
        ],
      },
      fr: {
        name: 'Tour Bitexco & Observatoire Saigon Skydeck',
        shortSummary:
          'Gratte-ciel de 68 étages inspiré du bouton de lotus avec héliport en porte-à-faux et observatoire panoramique à 360° au 49e étage.',
        historicalEra: 'Inaugurée en 2010',
        openingHours: '09h30 – 21h30',
        architecturalHighlights: [
          'Silhouette en bouton de lotus haute de 262 mètres',
          'Observatoire Saigon Skydeck au 49e étage avec vue sur le fleuve Saïgon',
        ],
        audioScript: [
          'Bienvenue à la tour Bitexco, gratte-ciel emblématique en forme de lotus offrant une vue panoramique depuis le 49e étage.',
        ],
      },
      zh: {
        name: '金融塔（Bitexco）与西贡观景台',
        shortSummary:
          '高262米的68层莲花造型摩天大楼，拥有标志性52层悬挑停机坪与49层360度西贡全景玻璃观景台。',
        historicalEra: '2010年落成',
        openingHours: '09:30 – 21:30',
        architecturalHighlights: [
          '以越南国花莲花为灵感的现代玻璃幕墙大厦',
          '49层西贡观景台俯瞰第一郡历史城区与西贡河',
        ],
        audioScript: [
          '欢迎来到第一郡的Bitexco金融塔，登上49层观景台即可360度饱览胡志明市日落与夜景。',
        ],
      },
      ja: {
        name: 'ビテクスコ・フィナンシャルタワー＆サイゴン・スカイデック',
        shortSummary:
          '蓮のつぼみをモチーフにした高さ262mの超高層ビル。49階の360度展望台「サイゴン・スカイデック」から市内を一望できます。',
        historicalEra: '2010年完成',
        openingHours: '09:30 – 21:30',
        architecturalHighlights: [
          '52階から突き出す象徴的なヘリポートと蓮形ガラスファサード',
          '49階展望台からの360度パノラマ夜景とアオザイ展示',
        ],
        audioScript: [
          '蓮のつぼみを模したホーチミン市の象徴、ビテクスコタワーへようこそ。49階展望台からの絶景が人気です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'btx-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Tháp Tài chính Bitexco – Biểu tượng kiến trúc hiện đại tại Quận 1',
          en: 'Bitexco Financial Tower rising above District 1',
          fr: 'La tour financière Bitexco au cœur du 1er arrondissement',
          zh: '第一郡标志性建筑Bitexco金融塔',
          ja: '1区にそびえるビテクスコ・フィナンシャルタワー',
        },
        yearOrSource: 'Saigon Skydeck · Quận 1',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-btx-1',
        name: 'EON51 Fine Dining & Cafe (Tầng 50–51 Bitexco)',
        cuisine: 'Ẩm thực Âu – Á & Sky Lounge',
        specialtyDishes: ['Bò Wagyu nướng', 'Trà chiều trên mây', 'Cocktail hoàng hôn Sài Gòn'],
        rating: 4.7,
        reviewCount: 2430,
        priceRange: '120.000đ – 550.000đ',
        lat: 10.7718,
        lng: 106.7045,
        address: 'Tầng 50–51, Tháp Bitexco, 02 Hải Triều, Quận 1, TP.HCM',
        openHours: '08:00 – 23:00',
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'landmark-81-central-park',
    city: 'Bình Thạnh · TP.HCM',
    district: 'Bình Thạnh',
    lat: 10.7949,
    lng: 106.7218,
    category: 'monument',
    rating: 4.8,
    reviewCount: 38900,
    ticketPrice: 'Miễn phí công viên (SkyView từ 405.000đ)',
    address: '720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Landmark 81 SkyView & Công viên Vinhomes Central Park',
        shortSummary:
          'Tòa nhà cao nhất Việt Nam (461,2m) lấy cảm hứng từ bó tre truyền thống, đi kèm công viên ven sông 14 hecta với cầu đỏ, vườn Nhật và góc chụp toàn thân tháp tuyệt đẹp.',
        historicalEra: 'Khánh thành năm 2018 (Cao 461,2m)',
        openingHours: '09:30 – 22:00 (Công viên 05:00 – 21:30)',
        architecturalHighlights: [
          'Thiết kế 25 ống trụ mô phỏng bó tre Việt Nam vươn cao 461,2m – cao nhất Đông Nam Á khi khánh thành',
          'Đài quan sát Landmark 81 SkyView tầng 79–81 với cầu kính SkyTouch và trải nghiệm thực tế ảo',
          'Công viên Central Park 14ha ven sông Sài Gòn có vườn cá Koi, cầu gỗ đỏ kiểu Nhật & bãi cỏ ngắm hoàng hôn',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Landmark 81 và Công viên Vinhomes Central Park bên bờ sông Sài Gòn, quận Bình Thạnh.',
          'Với chiều cao 461,2 mét gồm 81 tầng lấy ý tưởng từ hình ảnh bó tre truyền thống đoàn kết của dân tộc Việt Nam, Landmark 81 là nóc nhà của Việt Nam và là điểm ngắm toàn cảnh thành phố ngoạn mục nhất từ tầng 79 đến 81.',
        ],
      },
      en: {
        name: 'Landmark 81 SkyView & Vinhomes Central Park',
        shortSummary:
          'Vietnam’s tallest skyscraper (461.2m) inspired by a traditional bundle of bamboo, paired with a 14-hectare riverside park featuring a Japanese garden and skyline lawns.',
        historicalEra: 'Completed in 2018 (461.2m)',
        openingHours: '09:30 – 22:00 (Park 05:00 – 21:30)',
        architecturalHighlights: [
          '461.2-meter bamboo-bundle silhouette visible across Ho Chi Minh City',
          'Landmark 81 SkyView observation deck across floors 79–81',
          '14-hectare Saigon riverside park with Japanese koi garden, red bridge, and photo lawns',
        ],
        audioScript: [
          'Welcome to Landmark 81, Vietnam’s tallest tower at 461.2 meters, overlooking the lush 14-hectare Vinhomes Central Park along the Saigon River.',
        ],
      },
      fr: {
        name: 'Landmark 81 SkyView & Parc Central Park',
        shortSummary:
          'Plus haut gratte-ciel du Vietnam (461,2 m) inspiré d’un faisceau de bambous, bordé par un grand parc fluvial de 14 hectares.',
        historicalEra: '2018',
        openingHours: '09h30 – 22h00',
        architecturalHighlights: [
          'Tour de 81 étages et observatoire SkyView aux étages 79–81',
          'Parc de 14 hectares avec jardin japonais et pont rouge',
        ],
        audioScript: [
          'Bienvenue à Landmark 81, la plus haute tour du Vietnam, bordée par le grand parc fluvial Central Park.',
        ],
      },
      zh: {
        name: '地标81大厦（Landmark 81）与中央公园',
        shortSummary:
          '越南第一高楼（461.2米），造型灵感源自竹束，楼下14公顷西贡河畔公园拥有日式红桥与大草坪，极适合拍照。',
        historicalEra: '2018年落成',
        openingHours: '09:30 – 22:00（公园 05:00 – 21:30）',
        architecturalHighlights: [
          '高461.2米、81层的越南最高建筑与79–81层云端观景台',
          '14公顷滨江公园、日式锦鲤池与草坪机位',
        ],
        audioScript: [
          '欢迎来到越南最高建筑地标81大厦及滨江中央公园，无论登顶俯瞰还是在草坪拍全景都极为震撼。',
        ],
      },
      ja: {
        name: 'ランドマーク81 スカイビュー＆セントラルパーク',
        shortSummary:
          'ベトナム最高層（461.2m）の超高層タワーとサイゴン川沿い14ヘクタールの緑豊かな公園。日本庭園や79〜81階展望台が見どころです。',
        historicalEra: '2018年開業',
        openingHours: '09:30 – 22:00（公園 05:00 – 21:30）',
        architecturalHighlights: [
          '竹の束をモチーフにした高さ461.2m・81階建てのシンボルタワー',
          '79〜81階スカイビュー展望台と川沿いの日本庭園・赤い橋',
        ],
        audioScript: [
          'ベトナム一の高さを誇るランドマーク81とセントラルパークへようこそ。展望台と川沿いの公園散策が楽しめます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'lm81-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Tòa tháp Landmark 81 cao 461,2m soi bóng bên Công viên Central Park',
          en: 'Landmark 81 rising above Vinhomes Central Park',
          fr: 'La tour Landmark 81 et son parc fluvial',
          zh: '地标81大厦与中央公园全景',
          ja: 'セントラルパーク越しに見上げるランドマーク81',
        },
        yearOrSource: 'Landmark 81 · Bình Thạnh',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-lm81-1',
        name: 'Nhà hàng Dì Mai – Landmark 81',
        cuisine: 'Ẩm thực Việt Nam Truyền thống',
        specialtyDishes: ['Gỏi cuốn tôm thịt', 'Cơm niêu Sài Gòn', 'Bánh xèo miền Nam'],
        rating: 4.6,
        reviewCount: 2890,
        priceRange: '95.000đ – 240.000đ',
        lat: 10.7951,
        lng: 106.7219,
        address: 'Tầng L02, Vincom Center Landmark 81, Bình Thạnh, TP.HCM',
        openHours: '10:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'cau-anh-sao-ho-ban-nguyet',
    city: 'Quận 7 · TP.HCM',
    district: 'Quận 7',
    lat: 10.7279,
    lng: 106.7186,
    category: 'monument',
    rating: 4.7,
    reviewCount: 14600,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Khu đô thị Phú Mỹ Hưng, Phường Tân Phú, Quận 7, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Cầu Ánh Sao & Hồ Bán Nguyệt (Phú Mỹ Hưng)',
        shortSummary:
          'Cây cầu đi bộ hiện đại đầu tiên tại TP.HCM dài 170m bắc qua Hồ Bán Nguyệt, rực rỡ hệ thống đèn LED bảy sắc cầu vồng và thác nước nhân tạo mỗi tối cuối tuần.',
        historicalEra: 'Khánh thành năm 2010',
        openingHours: 'Mở cửa 24/7 (Đèn LED & phun nước 18:00 – 21:30)',
        architecturalHighlights: [
          'Mặt cầu lát hệ thống đèn LED mô phỏng dải ngân hà lấp lánh dưới bước chân người đi bộ',
          'Hai đầu cầu thiết kế quảng trường Mặt Trăng và Mặt Trời rộng thoáng',
          'Không gian công viên ven Hồ Bán Nguyệt thanh bình, lý tưởng dạo bộ buổi chiều tối',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Cầu Ánh Sao và Hồ Bán Nguyệt tại khu đô thị Phú Mỹ Hưng, Quận 7.',
          'Với chiều dài 170 mét uốn cong mềm mại bắc qua mặt hồ rộng lớn, Cầu Ánh Sao nổi bật mỗi tối với hàng nghìn bóng đèn LED đổi màu tựa dải sao và màn phun nước nghệ thuật hai bên thành cầu.',
        ],
      },
      en: {
        name: 'Starlight Bridge & Crescent Lake (Phu My Hung)',
        shortSummary:
          'A romantic 170-meter pedestrian bridge spanning Crescent Lake in District 7, famous for its starry LED walkway and colorful waterfall light shows at night.',
        historicalEra: 'Opened in 2010',
        openingHours: 'Open 24/7 (Lights 18:00 – 21:30)',
        architecturalHighlights: [
          'Curved 170m pedestrian bridge embedded with twinkling star-like LED lights',
          'Sun and Moon themed plazas at opposite ends of Crescent Lake',
          'Waterfront promenade lined with cafes and Crescent Mall',
        ],
        audioScript: [
          'Welcome to Starlight Bridge and Crescent Lake in Phu My Hung, District 7—one of Saigon’s most scenic evening walks and night photography spots.',
        ],
      },
      fr: {
        name: 'Pont Starlight & Lac du Croissant (Phu My Hung)',
        shortSummary:
          'Passerelle piétonne lumineuse de 170 mètres enjambant le lac du Croissant dans le 7e arrondissement, illuminée chaque soir.',
        historicalEra: '2010',
        openingHours: '24h/24',
        architecturalHighlights: [
          'Allée piétonne constellée de lumières LED et cascades colorées',
          'Promenade calme autour du lac du Croissant',
        ],
        audioScript: [
          'Bienvenue au pont Starlight dans le quartier moderne de Phu My Hung, idéal pour une promenade nocturne.',
        ],
      },
      zh: {
        name: '星光桥与半月湖（富美兴 · 第七郡）',
        shortSummary:
          '横跨第七郡半月湖的170米浪漫步行桥，夜晚桥面星光LED与七彩瀑布水幕交相辉映，是极佳的夜景打卡地。',
        historicalEra: '2010年落成',
        openingHours: '全天开放（18:00 – 21:30亮灯）',
        architecturalHighlights: [
          '如银河般闪烁的星光LED步行桥面与彩虹喷泉',
          '环绕半月湖的现代化滨水广场与咖啡街区',
        ],
        audioScript: [
          '欢迎来到第七郡富美兴的星光桥与半月湖，夜晚漫步在星光闪烁的桥面上十分浪漫。',
        ],
      },
      ja: {
        name: 'スターライトブリッジ＆クレセント湖（7区フーミーフン）',
        shortSummary:
          '7区フーミーフンの半月湖に架かる全長170mの歩行者専用橋。夜には橋面が星空のように輝き、噴水ライトアップが幻想的です。',
        historicalEra: '2010年開通',
        openingHours: '24時間開放（ライトアップ 18:00 – 21:30）',
        architecturalHighlights: [
          '足元に星空が広がるLED歩道とカラフルな噴水ショー',
          '落ち着いた湖畔プロムナードとカフェエリア',
        ],
        audioScript: [
          '7区フーミーフンの名所、スターライトブリッジと半月湖へようこそ。夜のライトアップ散歩におすすめです。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'cas-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Cầu Ánh Sao lung linh bên Hồ Bán Nguyệt, Quận 7',
          en: 'Starlight Bridge glowing above Crescent Lake in District 7',
          fr: 'Le pont Starlight sur le lac du Croissant',
          zh: '第七郡星光桥与半月湖夜景',
          ja: '7区スターライトブリッジと半月湖',
        },
        yearOrSource: 'Khu đô thị Phú Mỹ Hưng · Quận 7',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cas-1',
        name: 'Boomarang Bistro Saigon (Ven Hồ Bán Nguyệt)',
        cuisine: 'Bistro Âu – Á & View Hồ',
        specialtyDishes: ['Sườn nướng BBQ', 'Bánh mì bơ tỏi hải sản', 'Salad cá hồi'],
        rating: 4.6,
        reviewCount: 1940,
        priceRange: '120.000đ – 320.000đ',
        lat: 10.7289,
        lng: 106.7189,
        address: '107 Tôn Dật Tiên, Phú Mỹ Hưng, Quận 7, TP.HCM',
        openHours: '07:00 – 22:30',
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'den-hindu-mariamman',
    city: 'Quận 1 · TP.HCM',
    district: 'Quận 1',
    lat: 10.7722,
    lng: 106.6956,
    category: 'temple',
    rating: 4.6,
    reviewCount: 5420,
    ticketPrice: 'Miễn phí tham quan',
    address: '45 Trương Định, Phường Bến Thành, Quận 1, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Đền Ấn Độ giáo Mariamman (Chùa Bà Ấn · 1885)',
        shortSummary:
          'Ngôi đền Hindu giáo cổ kính và linh thiêng nhất TP.HCM xây dựng cuối thế kỷ 19 ngay gần Chợ Bến Thành, nổi bật với tháp cổng Gopuram rực rỡ điêu khắc Nam Ấn.',
        historicalEra: 'Cuối thế kỷ 19 (Khoảng 1885)',
        openingHours: '07:00 – 19:00 Hàng ngày',
        architecturalHighlights: [
          'Tháp cổng Gopuram cao 12m chạm trổ hàng chục pho tượng thần linh Ấn Độ giáo đa sắc màu',
          'Chánh điện thờ Nữ thần Mariamman cùng hai vị thần bảo hộ Maduraiveeran và Pechiamman',
          'Tường đá ốp phù điêu 18 vị thần Ấn Độ và không gian trầm hương đậm chất Nam Á giữa Quận 1',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Đền Ấn Độ giáo Mariamman tại số 45 Trương Định, chỉ cách Chợ Bến Thành vài phút đi bộ.',
          'Được cộng đồng người Tamil gốc Ấn xây dựng vào cuối thế kỷ 19, ngôi đền là minh chứng sinh động cho bản sắc đa văn hóa của Sài Gòn với tháp cổng Gopuram chạm khắc sống động và không gian tín ngưỡng rực rỡ sắc màu Nam Ấn.',
        ],
      },
      en: {
        name: 'Mariamman Hindu Temple (Saigon · 1885)',
        shortSummary:
          'Ho Chi Minh City’s most prominent 19th-century South Indian Hindu temple near Ben Thanh Market, famed for its colorful sculpted Gopuram tower.',
        historicalEra: 'Late 19th Century (~1885)',
        openingHours: '07:00 – 19:00 Daily',
        architecturalHighlights: [
          '12-meter colorful Gopuram gate tower adorned with intricate Hindu deity sculptures',
          'Inner sanctum dedicated to Goddess Mariamman with stone carvings imported from Tamil Nadu',
          'Fragrant jasmine garlands and serene multicultural heritage steps from Ben Thanh Market',
        ],
        audioScript: [
          'Welcome to Mariamman Hindu Temple on Truong Dinh Street, built by the Tamil community in the late 19th century and celebrated for its vivid South Indian architecture.',
        ],
      },
      fr: {
        name: 'Temple Hindou Mariamman (1885)',
        shortSummary:
          'Temple hindou du XIXe siècle au cœur du 1er arrondissement, remarquable par sa tour Gopuram colorée et ses sculptures tamoules.',
        historicalEra: 'Fin XIXe siècle',
        openingHours: '07h00 – 19h00',
        architecturalHighlights: [
          'Tour-portail Gopuram sculptée de 12 mètres aux couleurs vives',
          'Sanctuaire dédié à la déesse Mariamman près du marché Ben Thanh',
        ],
        audioScript: [
          'Bienvenue au temple hindou Mariamman, joyau du patrimoine multiculturel de Saïgon depuis le XIXe siècle.',
        ],
      },
      zh: {
        name: '马里安曼印度教神庙（1885年）',
        shortSummary:
          '坐落于滨城市场附近的百年南印度风格印度教寺庙，以色彩绚丽、神像雕刻精美的门塔闻名。',
        historicalEra: '19世纪末（约1885年）',
        openingHours: '07:00 – 19:00',
        architecturalHighlights: [
          '12米高南印度彩绘门塔与精雕神像浮雕',
          '供奉雨神与丰收女神马里安曼，展现西贡多元文化',
        ],
        audioScript: [
          '欢迎来到靠近滨城市场的马里安曼印度庙，这里色彩斑斓的南印度雕塑令人过目难忘。',
        ],
      },
      ja: {
        name: 'マリアマン・ヒンドゥー寺院（1885年）',
        shortSummary:
          'ベンタイン市場近くの19世紀末建立のヒンドゥー教寺院。極彩色の南インド様式ゴープラム（塔門）が目を引く多文化遺産です。',
        historicalEra: '19世紀末（1885年頃）',
        openingHours: '07:00 – 19:00',
        architecturalHighlights: [
          '神々の彫刻が連なる色鮮やかな高さ12mの塔門',
          '南インド・タミル文化が息づく香煙たなびく礼拝堂',
        ],
        audioScript: [
          '19世紀末に建てられたサイゴン随一のヒンドゥー寺院、マリアマン寺院へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'mrm-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Kiến trúc chạm khắc Nam Ấn rực rỡ tại Đền Mariamman, Quận 1',
          en: 'South Indian carvings at Mariamman Hindu Temple, District 1',
          fr: 'Sculptures tamoules du temple Mariamman',
          zh: '第一郡马里安曼印度教神庙彩绘雕塑',
          ja: 'マリアマン寺院の極彩色の南インド彫刻',
        },
        yearOrSource: 'Di sản Đa văn hóa Sài Gòn',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-mrm-1',
        name: 'Tandoor Indian Restaurant (Gần Đền Mariamman)',
        cuisine: 'Ẩm thực Ấn Độ Truyền thống',
        specialtyDishes: ['Cà ri gà bơ Butter Chicken', 'Bánh Naan tỏi', 'Cơm Biryani'],
        rating: 4.7,
        reviewCount: 2150,
        priceRange: '90.000đ – 240.000đ',
        lat: 10.7731,
        lng: 106.6976,
        address: '39A–39B Ngô Đức Kế / Khu Bến Thành, Quận 1, TP.HCM',
        openHours: '11:00 – 22:30',
        imageUrl:
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'thanh-duong-hoi-giao-saigon',
    city: 'Quận 1 · TP.HCM',
    district: 'Quận 1',
    lat: 10.7765,
    lng: 106.7047,
    category: 'temple',
    rating: 4.7,
    reviewCount: 4280,
    ticketPrice: 'Miễn phí tham quan (Trang phục lịch sự)',
    address: '66 Đông Du, Phường Bến Nghé, Quận 1, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Thánh đường Hồi giáo Jamia Al-Musulman (Saigon Central Mosque · 1935)',
        shortSummary:
          'Thánh đường Hồi giáo trung tâm xây dựng năm 1935 trên phố Đông Du với kiến trúc vòm cung trắng – xanh ngọc tinh khôi và sân hồ nước tĩnh lặng giữa lòng Quận 1.',
        historicalEra: 'Khởi dựng năm 1935 (Trùng tu 1999)',
        openingHours: '08:00 – 20:00 Hàng ngày',
        architecturalHighlights: [
          'Cổng vòm bán nguyệt, hàng cột tròn thanh thoát và 4 tháp bút mang đậm mỹ thuật Hồi giáo cổ điển',
          'Bảng màu trắng tinh khôi điểm xanh ngọc tạo nên không gian chụp ảnh tối giản, thanh bình',
          'Bao quanh là nhiều quán ăn Halal chuẩn vị Ấn Độ – Malaysia ngay giữa phố Đồng Khởi – Đông Du',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Thánh đường Hồi giáo Jamia Al-Musulman tại số 66 Đông Du – ốc đảo yên bình giữa khu phố Đồng Khởi nhộn nhịp của Quận 1.',
          'Xây dựng năm 1935 bởi cộng đồng người Hồi giáo gốc Nam Ấn, thánh đường gây ấn tượng bằng kiến trúc vòm cong màu trắng – xanh ngọc và hồ nước thanh tịnh, mở cửa thân thiện đón du khách mặc trang phục lịch sự.',
        ],
      },
      en: {
        name: 'Saigon Central Mosque (Jamia Al-Musulman · 1935)',
        shortSummary:
          'A serene 1935 white-and-turquoise Islamic mosque tucked along Dong Du Street in District 1, featuring graceful arches, minarets, and a courtyard reflection pool.',
        historicalEra: 'Built in 1935',
        openingHours: '08:00 – 20:00 Daily',
        architecturalHighlights: [
          'Graceful white and pastel-green Islamic arches with four slender minarets',
          'Peaceful courtyard ablution pool contrasting with bustling Dong Khoi nearby',
          'Surrounded by popular Halal Malaysian and Indian eateries',
        ],
        audioScript: [
          'Welcome to Saigon Central Mosque on Dong Du Street, built in 1935 in serene white and turquoise Islamic architecture right in central District 1.',
        ],
      },
      fr: {
        name: 'Mosquée Centrale de Saïgon (Jamia Al-Musulman · 1935)',
        shortSummary:
          'Havre de paix de 1935 aux arches blanches et vert turquoise au cœur du 1er arrondissement, près de la rue Dong Khoi.',
        historicalEra: '1935',
        openingHours: '08h00 – 20h00',
        architecturalHighlights: [
          'Arches islamiques blanches et vert pastel avec quatre minarets',
          'Cour paisible dotée d’un bassin d’ablutions',
        ],
        audioScript: [
          'Bienvenue à la Grande Mosquée de Saïgon, édifiée en 1935 rue Dong Du.',
        ],
      },
      zh: {
        name: '西贡中央清真寺（1935年）',
        shortSummary:
          '建于1935年的白色与薄荷绿拱门清真寺，藏身繁华的同起街旁，庭院静谧素雅，极具建筑摄影美感。',
        historicalEra: '建于1935年',
        openingHours: '08:00 – 20:00',
        architecturalHighlights: [
          '优雅的伊斯兰拱廊、白绿配色与四座宣礼尖塔',
          '周边汇聚胡志明市最地道的清真餐厅',
        ],
        audioScript: [
          '欢迎来到东游街66号的西贡中央清真寺，这座1935年的清雅建筑是市中心的一片宁静绿洲。',
        ],
      },
      ja: {
        name: 'サイゴン・セントラル・モスク（1935年）',
        shortSummary:
          'ドンコイ通り近くに佇む1935年建立の白とターコイズブルーのモスク。美しいアーチと静かな中庭が都会の喧騒を忘れさせます。',
        historicalEra: '1935年建立',
        openingHours: '08:00 – 20:00',
        architecturalHighlights: [
          '白と淡いグリーンが映えるイスラム様式のアーチと尖塔',
          '周辺にはハラル料理の人気レストランも充実',
        ],
        audioScript: [
          '1935年に建てられたサイゴン・セントラル・モスクへようこそ。白と緑の清らかな建築が見どころです。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'tdhg-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Thánh đường Hồi giáo Jamia Al-Musulman trên phố Đông Du, Quận 1',
          en: 'Saigon Central Mosque along Dong Du Street, District 1',
          fr: 'La Mosquée Centrale de Saïgon rue Dong Du',
          zh: '第一郡东游街西贡中央清真寺',
          ja: '1区ドンズー通りのサイゴン・セントラル・モスク',
        },
        yearOrSource: 'Di sản Tín ngưỡng TP.HCM',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-tdhg-1',
        name: 'Halal@Saigon Restaurant (Đối diện Thánh đường)',
        cuisine: 'Ẩm thực Việt – Mã Halal',
        specialtyDishes: ['Phở bò Halal', 'Cơm gà Hải Nam Halal', 'Gỏi cuốn tôm'],
        rating: 4.6,
        reviewCount: 1850,
        priceRange: '70.000đ – 180.000đ',
        lat: 10.7764,
        lng: 106.7044,
        address: '31 Đông Du, Phường Bến Nghé, Quận 1, TP.HCM',
        openHours: '10:30 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'nha-tho-huyen-sy',
    city: 'Quận 1 · TP.HCM',
    district: 'Quận 1',
    lat: 10.7709,
    lng: 106.6889,
    category: 'temple',
    rating: 4.7,
    reviewCount: 3180,
    ticketPrice: 'Miễn phí tham quan',
    address: '01 Tôn Thất Tùng, Phường Phạm Ngũ Lão, Quận 1, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Nhà thờ Huyện Sỹ (Thánh Phi-líp-phê · 1902)',
        shortSummary:
          'Công trình kiến trúc Gothic cổ điển xây dựng hoàn toàn bằng đá hoa cương Biên Hòa năm 1902–1905, mang vẻ đẹp trầm mặc, uy nghiêm dưới tán cây cổ thụ.',
        historicalEra: '1902 – 1905 (KTS Bouttier)',
        openingHours: '05:00 – 11:00, 14:00 – 19:00 Hàng ngày',
        architecturalHighlights: [
          'Mặt tiền và tường ốp đá hoa cương Biên Hòa nguyên khối hiếm có tại Sài Gòn',
          'Tháp chuông nhọn cao 57m đính tượng gà trống Gô-loa bằng đồng trên đỉnh',
          'Khuôn viên yên tĩnh rợp bóng cây xanh và lưu giữ lăng mộ cẩm thạch của gia đình ông Huyện Sỹ',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Nhà thờ Huyện Sỹ tại số 1 Tôn Thất Tùng, Quận 1 – một kiệt tác kiến trúc Neo-Gothic bằng đá hoa cương Biên Hòa xây dựng từ năm 1902 đến 1905.',
          'Ngôi nhà thờ mang tên người hiến đất và kinh phí xây dựng là ông Lê Phát Đạt – tức Huyện Sỹ, ông ngoại của Hoàng hậu Nam Phương. Vẻ trầm mặc của bức tường đá xám cổ kính tạo nên phông nền chụp ảnh châu Âu tuyệt đẹp.',
        ],
      },
      en: {
        name: 'Huyen Sy Church (St. Philip Church · 1902)',
        shortSummary:
          'A majestic Neo-Gothic church constructed from Bien Hoa granite between 1902 and 1905, renowned for its 57-meter spire and tranquil tree-shaded courtyard.',
        historicalEra: '1902 – 1905',
        openingHours: '05:00 – 11:00, 14:00 – 19:00 Daily',
        architecturalHighlights: [
          'Rare Bien Hoa granite facade giving an authentic European Neo-Gothic character',
          '57-meter steeple topped with a bronze Gallic rooster and four French bells',
          'Connected to the historic family of Empress Nam Phuong',
        ],
        audioScript: [
          'Welcome to Huyen Sy Church in District 1, built between 1902 and 1905 using local Bien Hoa granite in classic Neo-Gothic style.',
        ],
      },
      fr: {
        name: 'Église Huyen Sy (Saint-Philippe · 1902)',
        shortSummary:
          'Édifice néo-gothique en granit de Bien Hoa bâti entre 1902 et 1905, surmonté d’une flèche de 57 mètres.',
        historicalEra: '1902 – 1905',
        openingHours: '05h00 – 11h00, 14h00 – 19h00',
        architecturalHighlights: [
          'Façade en granit gris de Bien Hoa et clocher de 57 mètres',
          'Cour ombragée empreinte de sérénité au centre-ville',
        ],
        audioScript: [
          'Bienvenue à l’église Huyen Sy, joyau néo-gothique en granit construit au début du XXe siècle.',
        ],
      },
      zh: {
        name: '县士教堂（圣斐理伯堂 · 1902年）',
        shortSummary:
          '1902至1905年以边和花岗岩建成的新哥特式古教堂，57米尖塔庄严肃穆，极具欧洲复古气息。',
        historicalEra: '1902 – 1905年',
        openingHours: '05:00 – 11:00, 14:00 – 19:00',
        architecturalHighlights: [
          '罕见的边和花岗岩外墙与57米高哥特式尖顶',
          '与越南末代皇后南芳皇后家族渊源深厚',
        ],
        audioScript: [
          '欢迎来到第一郡的县士教堂，这座1905年完工的花岗岩新哥特式教堂静谧而典雅。',
        ],
      },
      ja: {
        name: 'フエンシー教会（1902年）',
        shortSummary:
          '1902〜1905年にビエンホア産花崗岩で造られたネオゴシック様式の古聖堂。57mの尖塔と木陰の静かな境内が魅力です。',
        historicalEra: '1902年 – 1905年',
        openingHours: '05:00 – 11:00, 14:00 – 19:00',
        architecturalHighlights: [
          '重厚な花崗岩のファサードと高さ57mの尖塔',
          'ナムフオン皇后の祖父ゆかりの歴史的建築',
        ],
        audioScript: [
          '花崗岩の重厚な姿が美しい1902年着工のフエンシー教会へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'nths-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Nhà thờ Huyện Sỹ bằng đá hoa cương cổ kính tại Quận 1',
          en: 'Granite Neo-Gothic facade of Huyen Sy Church',
          fr: 'Façade en granit de l’église Huyen Sy',
          zh: '第一郡花岗岩县士教堂',
          ja: '花崗岩造りのフエンシー教会',
        },
        yearOrSource: 'Di sản Kiến trúc Tôn giáo Quận 1',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-nths-1',
        name: 'Bánh Mì Huỳnh Hoa (Gần Nhà thờ Huyện Sỹ)',
        cuisine: 'Bánh mì Đặc sản Sài Gòn',
        specialtyDishes: ['Bánh mì thập cẩm pate chả lụa', 'Chà bông & thịt nguội truyền thống'],
        rating: 4.6,
        reviewCount: 9850,
        priceRange: '65.000đ – 75.000đ',
        lat: 10.7712,
        lng: 106.6904,
        address: '26 Lê Thị Riêng, Phường Bến Thành, Quận 1, TP.HCM',
        openHours: '06:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'bao-tang-ton-duc-thang',
    city: 'Quận 1 · TP.HCM',
    district: 'Quận 1',
    lat: 10.7782,
    lng: 106.7061,
    category: 'museum',
    rating: 4.8,
    reviewCount: 2890,
    ticketPrice: 'Miễn phí tham quan',
    address: '05 Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Bảo tàng Tôn Đức Thắng',
        shortSummary:
          'Bảo tàng hiện đại ven sông Sài Gòn (miễn phí vé) trưng bày đa phương tiện về cuộc đời Chủ tịch Tôn Đức Thắng, lịch sử xưởng tàu Ba Son và phong trào công nhân Sài Gòn.',
        historicalEra: 'Thành lập năm 1988 – Không gian mới 2024',
        openingHours: '07:30 – 11:30, 13:00 – 17:00 (Thứ 3 – Chủ nhật)',
        architecturalHighlights: [
          'Tòa nhà bảo tàng mới khang trang ngay trục Tôn Đức Thắng – Cầu Ba Son, thiết kế tối giản sang trọng',
          'Trưng bày tương tác số hiện đại gồm 5 chuyên đề lớn về Bác Tôn và công nhân Ba Son',
          'Không gian máy lạnh rộng rãi, miễn phí vé vào cổng cho mọi du khách trong và ngoài nước',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Bảo tàng Tôn Đức Thắng tại số 5 đường Tôn Đức Thắng, Quận 1 – ngay bên bờ sông Sài Gòn và khu xưởng tàu Ba Son lịch sử.',
          'Với tòa nhà trưng bày mới hiện đại cùng công nghệ tương tác đa phương tiện, bảo tàng tái hiện sinh động hành trình cuộc đời bình dị mà vĩ đại của Chủ tịch Tôn Đức Thắng và lịch sử công nhân Sài Gòn.',
        ],
      },
      en: {
        name: 'Ton Duc Thang Museum',
        shortSummary:
          'A newly rebuilt, free-admission riverside museum in District 1 presenting multimedia exhibits on President Ton Duc Thang and the historic Ba Son Shipyard.',
        historicalEra: 'Founded 1988 – New Building 2024',
        openingHours: '07:30 – 11:30, 13:00 – 17:00 (Tue – Sun)',
        architecturalHighlights: [
          'Sleek contemporary museum architecture overlooking the Saigon River and Ba Son Bridge',
          'Five interactive thematic galleries chronicling President Ton Duc Thang and Saigon’s labor heritage',
          'Complimentary admission for domestic and international visitors',
        ],
        audioScript: [
          'Welcome to the Ton Duc Thang Museum on Saigon’s riverfront, offering free admission and modern interactive galleries on President Ton Duc Thang and Ba Son Shipyard.',
        ],
      },
      fr: {
        name: 'Musée Ton Duc Thang',
        shortSummary:
          'Musée moderne et gratuit au bord du fleuve Saïgon retraçant la vie du président Ton Duc Thang et l’histoire des chantiers navals Ba Son.',
        historicalEra: '1988 – Nouvel édifice 2024',
        openingHours: '07h30 – 11h30, 13h00 – 17h00 (Mar – Dim)',
        architecturalHighlights: [
          'Architecture muséale contemporaine face au pont Ba Son',
          'Salles multimédias interactives et entrée gratuite',
        ],
        audioScript: [
          'Bienvenue au musée Ton Duc Thang, espace muséal moderne gratuit situé au bord du fleuve Saïgon.',
        ],
      },
      zh: {
        name: '孙德胜博物馆',
        shortSummary:
          '位于第一郡西贡河畔的现代化免费博物馆，以多媒体互动展陈讲述孙德胜主席生平与百年巴松船厂历史。',
        historicalEra: '1988年建馆 – 2024年新馆',
        openingHours: '07:30 – 11:30, 13:00 – 17:00（周二至周日）',
        architecturalHighlights: [
          '毗邻巴松大桥的全新现代建筑空间',
          '免费开放，五大互动专题展厅内容丰富',
        ],
        audioScript: [
          '欢迎来到西贡河畔的孙德胜博物馆，全馆免费参观，现代化展陈生动再现巴松船厂与历史记忆。',
        ],
      },
      ja: {
        name: 'トン・ドゥック・タン博物館',
        shortSummary:
          'サイゴン川沿いに建つ入場無料の近代的博物館。トン・ドゥック・タン主席の生涯と歴史あるバーソン造船所の歩みを展示しています。',
        historicalEra: '1988年開館 – 2024年新館',
        openingHours: '07:30 – 11:30, 13:00 – 17:00（火〜日）',
        architecturalHighlights: [
          'バーソン橋すぐそばの洗練された新建築',
          'インタラクティブな最新展示が無料で鑑賞可能',
        ],
        audioScript: [
          '入場無料で最新の展示が楽しめるサイゴン川沿いのトン・ドゥック・タン博物館へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'bttdt-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Không gian trưng bày hiện đại của Bảo tàng Tôn Đức Thắng ven sông Sài Gòn',
          en: 'Modern Ton Duc Thang Museum along Ton Duc Thang Street',
          fr: 'Le musée Ton Duc Thang face au fleuve',
          zh: '西贡河畔孙德胜博物馆新馆',
          ja: 'サイゴン川沿いのトン・ドゥック・タン博物館',
        },
        yearOrSource: 'Hệ thống Bảo tàng TP.HCM',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-bttdt-1',
        name: 'Pizza 4P’s Lê Thánh Tôn (Phố Nhật gần Bảo tàng)',
        cuisine: 'Pizza Thủ công Nhật – Ý',
        specialtyDishes: ['Pizza Burrata Parma Ham', 'Mì cua sốt kem cà chua', 'Phô mai tươi nhà làm'],
        rating: 4.8,
        reviewCount: 7420,
        priceRange: '180.000đ – 380.000đ',
        lat: 10.7791,
        lng: 106.7047,
        address: '8/15 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP.HCM',
        openHours: '10:30 – 23:00',
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'bao-tang-phu-nu-nam-bo',
    city: 'Quận 3 · TP.HCM',
    district: 'Quận 3',
    lat: 10.7866,
    lng: 106.6873,
    category: 'museum',
    rating: 4.7,
    reviewCount: 3450,
    ticketPrice: 'Miễn phí tham quan',
    address: '202 Võ Thị Sáu, Phường Võ Thị Sáu, Quận 3, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Bảo tàng Phụ nữ Nam Bộ',
        shortSummary:
          'Không gian văn hóa giàu cảm xúc tại Quận 3 lưu giữ hơn 30.000 hiện vật về trang phục áo dài, áo bà ba, trang sức cổ, nghề thủ công và truyền thống anh hùng của phụ nữ Nam Bộ.',
        historicalEra: 'Thành lập năm 1985',
        openingHours: '07:30 – 11:30, 13:30 – 17:00 Hàng ngày',
        architecturalHighlights: [
          'Phòng trưng bày chuyên đề Áo dài Việt Nam và trang phục truyền thống các dân tộc phía Nam rực rỡ sắc màu',
          'Ứng dụng trình chiếu 3D Hologram và tương tác thông minh kể chuyện lịch sử sống động',
          'Miễn phí vé vào cửa, cách Nhà thờ Tân Định và Chùa Vĩnh Nghiêm chỉ vài phút đi bộ',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Bảo tàng Phụ nữ Nam Bộ tại số 202 Võ Thị Sáu, Quận 3.',
          'Nơi đây lưu giữ hơn 30.000 tư liệu và hiện vật quý giá, từ bộ sưu tập áo dài – áo bà ba truyền thống, nghệ thuật làm gốm dệt chiếu đến những câu chuyện kiên trung của phụ nữ miền Nam qua hai cuộc kháng chiến.',
        ],
      },
      en: {
        name: 'Southern Women’s Museum',
        shortSummary:
          'A free-entry District 3 museum showcasing over 30,000 artifacts of Southern Vietnamese women’s heritage, traditional Ao Dai & Ba Ba fashion, jewelry, and history.',
        historicalEra: 'Founded in 1985',
        openingHours: '07:30 – 11:30, 13:30 – 17:00 Daily',
        architecturalHighlights: [
          'Vivid galleries dedicated to traditional Ao Dai, Ba Ba tunics, and ethnic textiles',
          'Interactive 3D hologram exhibits and modern curatorial storytelling',
          'Free admission within walking distance of Tan Dinh Church',
        ],
        audioScript: [
          'Welcome to the Southern Women’s Museum in District 3, celebrating traditional Vietnamese dress, crafts, and the vital role of Southern women in history.',
        ],
      },
      fr: {
        name: 'Musée des Femmes du Sud',
        shortSummary:
          'Musée gratuit du 3e arrondissement consacré aux costumes traditionnels (Ao Dai, Ao Ba Ba), à l’artisanat et au rôle historique des femmes du Sud-Vietnam.',
        historicalEra: 'Fondé en 1985',
        openingHours: '07h30 – 11h30, 13h30 – 17h00',
        architecturalHighlights: [
          'Collections riches d’Ao Dai anciens et de bijoux traditionnels',
          'Installations numériques et hologrammes 3D modernes',
        ],
        audioScript: [
          'Bienvenue au musée des Femmes du Sud, dédié au patrimoine vestimentaire et historique du Sud-Vietnam.',
        ],
      },
      zh: {
        name: '南部妇女博物馆',
        shortSummary:
          '位于第三郡的免费文化博物馆，珍藏逾三万件越南奥黛、传统服饰、古董首饰与南部女性历史文物。',
        historicalEra: '1985年建馆',
        openingHours: '07:30 – 11:30, 13:30 – 17:00',
        architecturalHighlights: [
          '色彩丰富的越南奥黛与南方少数民族服饰专题展',
          '结合3D全息互动展示，免费向游客开放',
        ],
        audioScript: [
          '欢迎来到第三郡的南部妇女博物馆，馆内免费开放并展示精美的越南奥黛与南方传统文化。',
        ],
      },
      ja: {
        name: '南部女性博物館',
        shortSummary:
          '3区にある入場無料の博物館。アオザイやアオババなど伝統衣装、装身具、歴史を伝える3万点以上の資料を収蔵しています。',
        historicalEra: '1985年開館',
        openingHours: '07:30 – 11:30, 13:30 – 17:00',
        architecturalHighlights: [
          '華やかなアオザイ・民族衣装の常設コレクション',
          '3Dホログラムを活用したわかりやすい現代的展示',
        ],
        audioScript: [
          'ベトナム伝統衣装アオザイや南部女性の歩みを無料で学べる南部女性博物館へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'btpn-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Bảo tàng Phụ nữ Nam Bộ trên trục đường Võ Thị Sáu, Quận 3',
          en: 'Southern Women’s Museum on Vo Thi Sau Street, District 3',
          fr: 'Le musée des Femmes du Sud dans le 3e arrondissement',
          zh: '第三郡南部妇女博物馆',
          ja: '3区の南部女性博物館',
        },
        yearOrSource: 'Bảo tàng Phụ nữ Nam Bộ TP.HCM',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-btpn-1',
        name: 'Phở Hòa Pasteur (Thương hiệu Phở lâu đời Q.3)',
        cuisine: 'Phở bò Sài Gòn Truyền thống',
        specialtyDishes: ['Phở tái nạm gầu', 'Chả giò giòn', 'Quẩy nóng'],
        rating: 4.5,
        reviewCount: 6180,
        priceRange: '75.000đ – 110.000đ',
        lat: 10.7859,
        lng: 106.6896,
        address: '260C Pasteur, Phường Võ Thị Sáu, Quận 3, TP.HCM',
        openHours: '06:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'bao-tang-biet-dong-sai-gon-145',
    city: 'Quận 1 · TP.HCM',
    district: 'Quận 1',
    lat: 10.7908,
    lng: 106.6915,
    category: 'museum',
    rating: 4.8,
    reviewCount: 2740,
    ticketPrice: '50.000đ (Có kết hợp Cà phê Đỗ Phủ cổ)',
    address: '145 Trần Quang Khải, Phường Tân Định, Quận 1, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Bảo tàng Biệt động Sài Gòn – Gia Định (145 Trần Quang Khải)',
        shortSummary:
          'Bảo tàng tư nhân độc đáo đặt trong ngôi nhà di tích năm 1963 của chiến sĩ Trần Văn Lai, trưng bày hầm nổi bí mật, hộp thư mật, xe cổ và trải nghiệm cà phê bơ sữa Sài Gòn xưa.',
        historicalEra: '1963 – Mở cửa Bảo tàng năm 2019',
        openingHours: '07:30 – 19:00 Hàng ngày',
        architecturalHighlights: [
          'Thang máy gỗ cổ nhỏ gọn và các vách tường – trần nhà hai lớp từng dùng làm hầm bí mật giữa lòng đô thị',
          'Hơn 300 hiện vật gốc: máy đánh chữ, radio liên lạc, xe máy cổ và bản đồ tác chiến Biệt động Sài Gòn',
          'Kết hợp không gian Cà phê Đỗ Phủ – Cơm tấm Đại Hàn đậm chất hoài cổ Sài Gòn thập niên 1960',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Bảo tàng Biệt động Sài Gòn – Gia Định tại số 145 Trần Quang Khải, phường Tân Định, Quận 1.',
          'Ngôi nhà cổ xây dựng từ năm 1963 này từng là cơ sở hoạt động bí mật của lực lượng Biệt động Sài Gòn. Quý khách sẽ được tận mắt chứng kiến những vách hầm ngụy trang tài tình, bộ sưu tập hiện vật nguyên bản và thưởng thức ly cà phê vợt đậm chất Sài Gòn xưa.',
        ],
      },
      en: {
        name: 'Saigon Commando Museum (145 Tran Quang Khai)',
        shortSummary:
          'A fascinating heritage-house museum from 1963 showcasing secret wall bunkers, vintage motorbikes, coded mail drops, and nostalgic 1960s Saigon coffee culture.',
        historicalEra: '1963 House – Museum opened 2019',
        openingHours: '07:30 – 19:00 Daily',
        architecturalHighlights: [
          'Concealed wall compartments, secret loft hatches, and an antique wooden lift',
          'Over 300 original artifacts of the Saigon Special Forces',
          'Paired with retro Do Phu Coffee & broken rice dining downstairs',
        ],
        audioScript: [
          'Welcome to the Saigon Commando Museum at 145 Tran Quang Khai, a preserved 1963 safehouse packed with hidden bunkers, historical artifacts, and vintage Saigon atmosphere.',
        ],
      },
      fr: {
        name: 'Musée des Commandos de Saïgon (145 Tran Quang Khai)',
        shortSummary:
          'Maison historique de 1963 transformée en musée présentant caches secrètes, objets d’époque et café rétro saïgonnais.',
        historicalEra: '1963 – 2019',
        openingHours: '07h30 – 19h00',
        architecturalHighlights: [
          'Cloisons secrètes et objets authentiques des commandos de Saïgon',
          'Ambiance vintage des années 1960 avec café traditionnel',
        ],
        audioScript: [
          'Bienvenue au musée des Commandos de Saïgon, installé dans une maison secrète historique de 1963.',
        ],
      },
      zh: {
        name: '西贡别动队博物馆（陈光启街145号）',
        shortSummary:
          '设于1963年老宅内的特色历史博物馆，完整保留秘密夹层暗室、复古木电梯与300余件别动队真品文物，楼下可品尝怀旧西贡咖啡。',
        historicalEra: '1963年老宅 – 2019年开馆',
        openingHours: '07:30 – 19:00',
        architecturalHighlights: [
          '巧夺天工的夹层暗室与复古手拉木电梯',
          '融合怀旧杜府咖啡与大韩碎米饭体验',
        ],
        audioScript: [
          '欢迎来到陈光启街145号的西贡别动队博物馆，在这里可以近距离探索秘密暗室并品尝怀旧滤布咖啡。',
        ],
      },
      ja: {
        name: 'サイゴン特攻隊博物館（チャンクアンカイ通り145番地）',
        shortSummary:
          '1963年の秘密基地だった町家を公開した個性派博物館。隠し部屋やアンティークの木製エレベーター、レトロなサイゴン喫茶が体験できます。',
        historicalEra: '1963年建築 – 2019年開館',
        openingHours: '07:30 – 19:00',
        architecturalHighlights: [
          '二重壁の隠し部屋や300点以上の歴史的実物資料',
          '1960年代の雰囲気を残すレトロ喫茶と名物コムタム',
        ],
        audioScript: [
          '1963年の歴史ある町家を利用したサイゴン特攻隊博物館へようこそ。秘密の仕掛けとレトロな喫茶文化が魅力です。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'btbd-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Không gian trưng bày hoài cổ tại Bảo tàng Biệt động Sài Gòn',
          en: 'Retro artifacts at the Saigon Commando Museum',
          fr: 'Le musée des Commandos de Saïgon',
          zh: '西贡别动队博物馆复古展厅',
          ja: 'サイゴン特攻隊博物館のレトロな展示空間',
        },
        yearOrSource: 'Di sản Biệt động Sài Gòn – Gia Định',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-btbd-1',
        name: 'Cà Phê Đỗ Phủ – Cơm Tấm Đại Hàn (113A Đặng Dung)',
        cuisine: 'Cơm tấm cổ & Cà phê vợt Sài Gòn',
        specialtyDishes: ['Cơm tấm sườn bì chả kim chi', 'Cà phê bơ sữa', 'Bánh quẩy nóng'],
        rating: 4.7,
        reviewCount: 2940,
        priceRange: '45.000đ – 85.000đ',
        lat: 10.7911,
        lng: 106.6908,
        address: '113A Đặng Dung, Phường Tân Định, Quận 1, TP.HCM',
        openHours: '07:00 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];
