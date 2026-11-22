import { HeritageSite } from '../types/heritage';

/**
 * 15 điểm di sản Chợ Lớn (Quận 5, Quận 6), Quận 10, Phố Tây Bùi Viện,
 * Công viên Bờ sông Thủ Thiêm, Chùa Bửu Long, Bảo tàng Áo Dài, Tu viện Khánh An & Bình Quới.
 */
export const HCM_CULTURE_AND_SUBURBAN_SITES: HeritageSite[] = [
  {
    id: 'hoi-quan-nghia-an-chua-ong',
    city: 'Quận 5 · Chợ Lớn',
    district: 'Quận 5',
    lat: 10.7536,
    lng: 106.6626,
    category: 'temple',
    rating: 4.8,
    reviewCount: 4680,
    ticketPrice: 'Miễn phí tham quan',
    address: '678 Nguyễn Trãi, Phường 11, Quận 5, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Hội quán Nghĩa An (Chùa Ông – Chợ Lớn)',
        shortSummary:
          'Di tích Kiến trúc Nghệ thuật cấp Quốc gia của cộng đồng người Hoa Triều Châu xây từ đầu thế kỷ 19, nổi tiếng với nghệ thuật chạm gỗ sơn son thếp vàng lộng lẫy và tượng ngựa Xích Thố.',
        historicalEra: 'Đầu thế kỷ 19 (Công nhận Di tích QG 1993)',
        openingHours: '06:00 – 17:30 Hàng ngày',
        architecturalHighlights: [
          'Hệ thống bao lam, hoành phi và liễn đối chạm khắc gỗ sơn son thếp vàng tinh xảo bậc nhất Chợ Lớn',
          'Bức tượng ngựa Xích Thố bằng gỗ cao lớn đặt trang trọng ngay tiền điện',
          'Nằm trên trục di sản đường Nguyễn Trãi, chỉ cách Chùa Bà Thiên Hậu 2 phút đi bộ',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Hội quán Nghĩa An – thường gọi là Chùa Ông – tại số 678 Nguyễn Trãi, trung tâm khu phố cổ Chợ Lớn, Quận 5.',
          'Được cộng đồng người Triều Châu xây dựng từ đầu thế kỷ 19 để thờ Quan Thánh Đế Quân, hội quán được công nhận là Di tích Kiến trúc Nghệ thuật cấp Quốc gia nhờ những kiệt tác chạm gỗ sơn son thếp vàng và tiểu tượng gốm sứ trên mái ngói âm dương.',
        ],
      },
      en: {
        name: 'Nghia An Assembly Hall (Quan Cong Temple · Cho Lon)',
        shortSummary:
          'A National Architectural Monument built by the Teochew Chinese community in early 19th-century Cho Lon, celebrated for gilded wood carvings and the Red Hare horse statue.',
        historicalEra: 'Early 19th Century',
        openingHours: '06:00 – 17:30 Daily',
        architecturalHighlights: [
          'Lavish red-and-gold lacquered woodcarvings and calligraphic plaques',
          'Iconic wooden statue of General Guan Yu’s Red Hare steed at the entrance',
          'Two-minute walk from Thien Hau Temple along historic Nguyen Trai Street',
        ],
        audioScript: [
          'Welcome to Nghia An Assembly Hall in Cho Lon, an ornate early 19th-century Teochew temple renowned for gilded timber carvings and traditional incense coils.',
        ],
      },
      fr: {
        name: 'Salle d’Assemblée Nghia An (Pagode de Quan Cong)',
        shortSummary:
          'Monument national du XIXe siècle fondé par la communauté Teochew à Cho Lon, célèbre pour ses boiseries dorées à la feuille.',
        historicalEra: 'Début XIXe siècle',
        openingHours: '06h00 – 17h30',
        architecturalHighlights: [
          'Boiseries sculptées laquées rouge et or d’une finesse exceptionnelle',
          'Statue en bois du cheval Lièvre Rouge à l’entrée du sanctuaire',
        ],
        audioScript: [
          'Bienvenue à la salle d’assemblée Nghia An à Cho Lon, chef-d’œuvre d’art sino-vietnamien du XIXe siècle.',
        ],
      },
      zh: {
        name: '义安会馆（堤岸关帝庙）',
        shortSummary:
          '十九世纪初潮州先民兴建的国家级建筑艺术遗迹，以金碧辉煌的潮州木雕、彩瓷屋脊与赤兔马木像著称。',
        historicalEra: '19世纪初（1993年列为国家级遗迹）',
        openingHours: '06:00 – 17:30',
        architecturalHighlights: [
          '堤岸最为精美的贴金木雕匾额与彩瓷剪黏屋脊',
          '大殿前庄严的赤兔马木雕与盘香天井',
        ],
        audioScript: [
          '欢迎来到堤岸阮廌街的义安会馆，这座潮州关帝庙以精湛的贴金木雕闻名南越。',
        ],
      },
      ja: {
        name: '義安会館（チョロン関帝廟）',
        shortSummary:
          '19世紀初頭に潮州系華人が建てた国家建築遺産。豪華な金箔木彫りと赤兎馬の木像が見事なチョロン屈指の名所です。',
        historicalEra: '19世紀初頭',
        openingHours: '06:00 – 17:30',
        architecturalHighlights: [
          '絢爛豪華な朱塗り・金箔の潮州木彫装飾',
          '天后宮から徒歩2分のチョロン歴史散策ルート',
        ],
        audioScript: [
          'チョロンの中心に建つ国家遺産、義安会館へようこそ。壮麗な金箔木彫りが見どころです。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'hqna-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Hội quán Nghĩa An rực rỡ sắc son vàng tại khu Chợ Lớn, Quận 5',
          en: 'Gilded interior of Nghia An Assembly Hall in Cho Lon',
          fr: 'La salle d’assemblée Nghia An à Cho Lon',
          zh: '堤岸义安会馆精雕殿堂',
          ja: 'チョロンの義安会館',
        },
        yearOrSource: 'Di tích Kiến trúc Nghệ thuật Quốc gia (1993)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-hqna-1',
        name: 'Chè Hà Ký (Tráng miệng Hoa cổ truyền Q.5)',
        cuisine: 'Chè Hoa & Tráng miệng Chợ Lớn',
        specialtyDishes: ['Chè hột gà trà', 'Quy linh cao mật ong', 'Chè đậu phộng mè đen'],
        rating: 4.7,
        reviewCount: 3850,
        priceRange: '30.000đ – 55.000đ',
        lat: 10.7539,
        lng: 106.6645,
        address: '138 Châu Văn Liêm, Phường 11, Quận 5, TP.HCM',
        openHours: '10:00 – 22:30',
        imageUrl:
          'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'hoi-quan-on-lang-chua-quan-am',
    city: 'Quận 5 · Chợ Lớn',
    district: 'Quận 5',
    lat: 10.7524,
    lng: 106.6637,
    category: 'temple',
    rating: 4.7,
    reviewCount: 3120,
    ticketPrice: 'Miễn phí tham quan',
    address: '12 Lão Tử, Phường 11, Quận 5, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Hội quán Ôn Lăng (Chùa Quan Âm · 1740)',
        shortSummary:
          'Ngôi chùa cổ nhất khu Chợ Lớn do người Hoa gốc Phúc Kiến xây dựng từ năm 1740, nổi tiếng với mái ngói cong rực rỡ tượng gốm Cây Mai và giàn đèn lồng đỏ huyền ảo.',
        historicalEra: 'Khởi dựng năm 1740 (Di tích QG 2007)',
        openingHours: '06:00 – 17:30 Hàng ngày',
        architecturalHighlights: [
          'Mái ngói âm dương uốn cong trang trí hàng trăm tiểu tượng gốm men xanh – vàng cổ điển',
          'Sân giếng trời treo đèn lồng đỏ và nhang vòng tạo hiệu ứng ánh sáng chụp ảnh cực kỳ điện ảnh',
          'Nơi bảo tồn nhiều phong tục tín ngưỡng Phúc Kiến đặc sắc như lễ cầu an, cầu duyên',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Hội quán Ôn Lăng trên đường Lão Tử, Quận 5 – một trong những ngôi chùa cổ xưa nhất của cộng đồng người Hoa Phúc Kiến tại Chợ Lớn từ năm 1740.',
          'Nơi đây kết hợp hài hòa tín ngưỡng thờ Quan Thế Âm Bồ Tát và Thiên Hậu Thánh Mẫu trong không gian sân đèn lồng đỏ thâm nghiêm và mái gốm men cổ đầy màu sắc.',
        ],
      },
      en: {
        name: 'On Lang Assembly Hall (Quan Am Pagoda · 1740)',
        shortSummary:
          'Founded in 1740 by Fujian settlers in Cho Lon, beloved for its dramatic glazed ceramic roof figurines, glowing red lanterns, and photogenic incense-lit courtyard.',
        historicalEra: 'Founded in 1740',
        openingHours: '06:00 – 17:30 Daily',
        architecturalHighlights: [
          'Curved Fujian roofs topped with intricate glazed porcelain dioramas',
          'Atmospheric courtyard draped in crimson lanterns and spiral incense',
          'Recognized as a National Architectural & Artistic Heritage Monument',
        ],
        audioScript: [
          'Welcome to Quan Am Pagoda, also known as On Lang Assembly Hall, founded in 1740 by the Fujian community in Cho Lon.',
        ],
      },
      fr: {
        name: 'Pagode Quan Am (Salle Ôn Lăng · 1740)',
        shortSummary:
          'Fondée en 1740 par la communauté du Fujian à Cho Lon, célèbre pour ses toits en céramique émaillée et sa cour aux lanternes rouges.',
        historicalEra: '1740',
        openingHours: '06h00 – 17h30',
        architecturalHighlights: [
          'Toits courbes ornés de scènes en porcelaine émaillée',
          'Cour illuminée de lanternes rouges et spirales d’encens',
        ],
        audioScript: [
          'Bienvenue à la pagode Quan Am, sanctuaire historique fondé en 1740 au cœur de Cho Lon.',
        ],
      },
      zh: {
        name: '温陵会馆（堤岸观音庙 · 1740年）',
        shortSummary:
          '始建于1740年的福建泉州会馆，以飞檐嵌瓷雕塑、红灯笼天井与传统民俗祈福文化闻名堤岸。',
        historicalEra: '始建于1740年',
        openingHours: '06:00 – 17:30',
        architecturalHighlights: [
          '闽南传统燕尾脊与精美彩瓷人物雕饰',
          '红灯笼与盘香交织的绝美古寺光影',
        ],
        audioScript: [
          '欢迎来到建于1740年的温陵会馆（观音庙），这里是堤岸最古老的福建籍古庙之一。',
        ],
      },
      ja: {
        name: '温陵会館（観音寺・1740年）',
        shortSummary:
          '1740年に福建系華人が建立したチョロン最古級の寺院。色鮮やかな陶磁器装飾の屋根と赤い提灯の中庭が幻想的です。',
        historicalEra: '1740年創建',
        openingHours: '06:00 – 17:30',
        architecturalHighlights: [
          '曲線美あふれる福建様式の屋根と陶磁器細工',
          '赤い提灯と渦巻き線香が織りなすフォトジェニックな空間',
        ],
        audioScript: [
          '1740年創建の歴史を誇るチョロンの観音寺（温陵会館）へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'hqol-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Hội quán Ôn Lăng rực rỡ đèn lồng tại đường Lão Tử, Quận 5',
          en: 'On Lang Assembly Hall (Quan Am Pagoda) in Cho Lon',
          fr: 'La pagode Quan Am à Cho Lon',
          zh: '堤岸温陵会馆红灯笼庭院',
          ja: 'チョロンの温陵会館（観音寺）',
        },
        yearOrSource: 'Di tích Kiến trúc Nghệ thuật Quốc gia',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-hqol-1',
        name: 'Dimsum Tiến Phát (Ký Hòa – Chợ Lớn)',
        cuisine: 'Dimsum & Ẩm thực Quảng Đông',
        specialtyDishes: ['Há cảo tôm tươi', 'Xíu mại trứng cua', 'Bánh bao kim sa'],
        rating: 4.6,
        reviewCount: 2760,
        priceRange: '55.000đ – 160.000đ',
        lat: 10.7549,
        lng: 106.6682,
        address: '18 Kỳ Hòa, Phường 11, Quận 5, TP.HCM',
        openHours: '06:00 – 12:30',
        imageUrl:
          'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'chua-van-phat-quan-5',
    city: 'Quận 5 · Chợ Lớn',
    district: 'Quận 5',
    lat: 10.7559,
    lng: 106.6696,
    category: 'temple',
    rating: 4.8,
    reviewCount: 4150,
    ticketPrice: 'Miễn phí tham quan',
    address: '66/14 Nghĩa Thục, Phường 5, Quận 5, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Chùa Vạn Phật (Chùa 10.000 Tượng Phật · Quận 5)',
        shortSummary:
          'Ngôi cổ tự độc đáo ẩn mình trong con hẻm Chợ Lớn với đại điện tầng 4 trang nghiêm trưng bày hơn 10.000 pho tượng Phật thếp vàng phủ kín bốn bức tường.',
        historicalEra: 'Khởi dựng năm 1959',
        openingHours: '07:00 – 17:00 Hàng ngày',
        architecturalHighlights: [
          'Đại điện Quang Minh tầng 4 với 10.000 tượng Phật nhỏ bằng đồng – thếp vàng xếp đều tăm tắp trên các vách tường',
          'Pho tượng Đức Phật Thích Ca Mâu Ni uy nghi ngự trên đài sen ngàn cánh ở trung tâm',
          'Không gian yên tĩnh, choáng ngợp và cực kỳ độc đáo để chiêm bái, chụp ảnh kiến trúc',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Chùa Vạn Phật tại hẻm 66 Nghĩa Thục, Quận 5 – một kho báu tâm linh ít người ngờ tới giữa lòng Chợ Lớn.',
          'Bước lên Đại điện Quang Minh ở tầng 4, quý khách sẽ choáng ngợp trước 10.000 pho tượng Phật ánh kim phủ kín khắp bốn bức tường vây quanh tượng Phật Thích Ca trên đài sen ngàn cánh.',
        ],
      },
      en: {
        name: 'Van Phat Pagoda (Ten Thousand Buddhas Temple)',
        shortSummary:
          'A hidden gem in Cho Lon whose breathtaking 4th-floor main sanctuary is lined floor-to-ceiling with 10,000 golden Buddha statues.',
        historicalEra: 'Founded in 1959',
        openingHours: '07:00 – 17:00 Daily',
        architecturalHighlights: [
          '10,000 miniature golden Buddha statues covering every wall of the 4th-floor Quang Minh Hall',
          'Monumental central Shakyamuni Buddha seated on a thousand-petal lotus',
          'Serene multi-story temple tucked down a quiet District 5 alleyway',
        ],
        audioScript: [
          'Welcome to Van Phat Pagoda in District 5, famous for its awe-inspiring fourth-floor hall lined with ten thousand golden Buddha statues.',
        ],
      },
      fr: {
        name: 'Pagode Van Phat (Pagode des Dix Mille Bouddhas)',
        shortSummary:
          'Sanctuaire caché de Cho Lon abritant au 4e étage une salle spectaculaire tapissée de 10 000 statues dorées de Bouddha.',
        historicalEra: '1959',
        openingHours: '07h00 – 17h00',
        architecturalHighlights: [
          'Salle Quang Minh ornée de 10 000 statuettes dorées',
          'Atmosphère recueillie et cadre photographique unique',
        ],
        audioScript: [
          'Bienvenue à la pagode Van Phat, célèbre pour sa salle des dix mille Bouddhas dorés.',
        ],
      },
      zh: {
        name: '万佛寺（第五郡堤岸）',
        shortSummary:
          '隐匿于第五郡巷内的庄严佛寺，四楼光明大殿四壁镶满一万尊金色小佛像，视觉极为震撼。',
        historicalEra: '始建于1959年',
        openingHours: '07:00 – 17:00',
        architecturalHighlights: [
          '四楼大殿环绕一万尊贴金小佛像的壮观金墙',
          '中央千瓣莲台释迦牟尼佛巨像',
        ],
        audioScript: [
          '欢迎来到第五郡万佛寺，登上四楼光明大殿即可一睹万佛金墙的震撼奇观。',
        ],
      },
      ja: {
        name: '万仏寺（ヴァンファット寺・5区）',
        shortSummary:
          'チョロンの路地裏に建つ名刹。4階の本堂壁面を1万体の黄金の仏像が埋め尽くす圧巻の光景が広がります。',
        historicalEra: '1959年創建',
        openingHours: '07:00 – 17:00',
        architecturalHighlights: [
          '4階光明殿の壁一面に並ぶ1万体の黄金仏像',
          '千弁の蓮座に鎮座する荘厳な釈迦如来像',
        ],
        audioScript: [
          '1万体の仏像が壁一面に並ぶ圧巻の本堂で知られる5区の万仏寺へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'cvp-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Đại điện 10.000 tượng Phật rực rỡ ánh vàng tại Chùa Vạn Phật, Q.5',
          en: 'Hall of Ten Thousand Buddhas at Van Phat Pagoda',
          fr: 'La salle des Dix Mille Bouddhas de la pagode Van Phat',
          zh: '第五郡万佛寺万佛金墙大殿',
          ja: '5区万仏寺の1万体の仏像が並ぶ本堂',
        },
        yearOrSource: 'Di sản Phật giáo Chợ Lớn',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cvp-1',
        name: 'Mì Vịt Tiềm Thiêm Huy (Nguyễn Trãi Q.5)',
        cuisine: 'Ẩm thực Hoa – Mì vịt tiềm trứ danh',
        specialtyDishes: ['Mì vịt tiềm đùi nguyên', 'Sủi cảo tôm thịt', 'Trà bí đao hạt chia'],
        rating: 4.5,
        reviewCount: 4120,
        priceRange: '75.000đ – 135.000đ',
        lat: 10.7556,
        lng: 106.6712,
        address: '455 Nguyễn Trãi, Phường 7, Quận 5, TP.HCM',
        openHours: '08:00 – 23:30',
        imageUrl:
          'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'nha-tho-cho-quan',
    city: 'Quận 5 · TP.HCM',
    district: 'Quận 5',
    lat: 10.7568,
    lng: 106.6819,
    category: 'temple',
    rating: 4.8,
    reviewCount: 3690,
    ticketPrice: 'Miễn phí tham quan',
    address: '120 Trần Bình Trọng, Phường 2, Quận 5, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Nhà thờ Chợ Quán (Nhà thờ cổ nhất TP.HCM · 1722)',
        shortSummary:
          'Họ đạo Công giáo lâu đời nhất Thành phố Hồ Chí Minh (thành lập năm 1722), sở hữu thánh đường kiến trúc Romanesque bề thế khánh thành năm 1896.',
        historicalEra: 'Họ đạo 1722 – Thánh đường 1896',
        openingHours: '05:00 – 11:00, 14:30 – 19:00 Hàng ngày',
        architecturalHighlights: [
          'Hơn 300 năm lịch sử hình thành cùng vùng đất Sài Gòn – Gia Định',
          'Kiến trúc Romanesque bề thế với mặt tiền vàng kem, vòm cuốn tròn và tháp chuông vươn cao',
          'Khuôn viên rộng rãi rợp bóng cây cổ thụ yên tĩnh giữa khu vực Chợ Quán',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Nhà thờ Chợ Quán tại số 120 Trần Bình Trọng, Quận 5 – họ đạo Công giáo lâu đời nhất tại Thành phố Hồ Chí Minh với lịch sử hơn 300 năm kể từ năm 1722.',
          'Ngôi thánh đường hiện nay khánh thành năm 1896 mang vẻ đẹp Romanesque cổ kính và uy nghiêm, là chứng nhân lịch sử quan trọng của vùng đất Sài Gòn – Chợ Lớn.',
        ],
      },
      en: {
        name: 'Cho Quan Church (Oldest Catholic Parish in HCMC · 1722)',
        shortSummary:
          'Established in 1722 as Ho Chi Minh City’s oldest Catholic parish, anchored by a stately 1896 Romanesque church set in a leafy District 5 compound.',
        historicalEra: 'Parish 1722 – Church 1896',
        openingHours: '05:00 – 11:00, 14:30 – 19:00 Daily',
        architecturalHighlights: [
          'Over 300 years of continuous history as Saigon’s oldest Catholic parish',
          'Grand 1896 Romanesque cream-yellow facade and arched nave',
          'Peaceful shaded courtyard tucked inside historic District 5',
        ],
        audioScript: [
          'Welcome to Cho Quan Church in District 5, founded in 1722 as the oldest Catholic parish in Ho Chi Minh City.',
        ],
      },
      fr: {
        name: 'Église Cho Quan (Plus ancienne paroisse de Saïgon · 1722)',
        shortSummary:
          'Plus ancienne paroisse catholique de Hô Chi Minh-Ville (1722), dotée d’une majestueuse église romane inaugurée en 1896.',
        historicalEra: '1722 – 1896',
        openingHours: '05h00 – 11h00, 14h30 – 19h00',
        architecturalHighlights: [
          'Plus de 300 ans d’histoire religieuse à Saïgon',
          'Architecture romane de 1896 entourée d’arbres centenaires',
        ],
        audioScript: [
          'Bienvenue à l’église Cho Quan, fondée en 1722 et plus ancienne paroisse catholique de la ville.',
        ],
      },
      zh: {
        name: '社馆教堂（胡志明市最古老教堂 · 1722年）',
        shortSummary:
          '胡志明市历史最悠久的天主教堂区（始于1722年），现存1896年落成的罗马式大教堂典雅庄严。',
        historicalEra: '1722年建堂区 – 1896年现建筑',
        openingHours: '05:00 – 11:00, 14:30 – 19:00',
        architecturalHighlights: [
          '逾三百年历史的西贡最早天主教社区',
          '宏伟的1896年罗马式鹅黄外墙与绿荫庭院',
        ],
        audioScript: [
          '欢迎来到第五郡的社馆教堂，它始建于1722年，是胡志明市历史最悠久的天主教堂。',
        ],
      },
      ja: {
        name: 'チョークアン教会（ホーチミン市最古の教会・1722年）',
        shortSummary:
          '1722年創設の市内最古のカトリック教区。1896年完成の堂々たるロマネスク様式聖堂が緑豊かな境内に建っています。',
        historicalEra: '1722年創設 – 1896年現聖堂',
        openingHours: '05:00 – 11:00, 14:30 – 19:00',
        architecturalHighlights: [
          '300年以上の歴史を持つサイゴン最古の教区',
          '1896年完成の優美なロマネスク建築',
        ],
        audioScript: [
          '1722年に起源を持つホーチミン市最古の教区、チョークアン教会へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'ntcq-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Nhà thờ Chợ Quán – Họ đạo hơn 300 năm tuổi tại Quận 5',
          en: 'Historic Cho Quan Church in District 5',
          fr: 'L’église historique Cho Quan',
          zh: '第五郡三百年古堂社馆教堂',
          ja: '5区のチョークアン教会',
        },
        yearOrSource: 'Di sản Lịch sử – Tôn giáo Quận 5',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-ntcq-1',
        name: 'Cơm Tấm Ba Ghiền / Cháo Tiều Chợ Quán',
        cuisine: 'Ẩm thực Bình dân Sài Gòn xưa',
        specialtyDishes: ['Cháo Tiều thập cẩm', 'Hủ tiếu sa tế nai', 'Cà phê đá'],
        rating: 4.5,
        reviewCount: 1520,
        priceRange: '40.000đ – 80.000đ',
        lat: 10.7574,
        lng: 106.6812,
        address: 'Trần Bình Trọng – Nguyễn Trãi, Quận 5, TP.HCM',
        openHours: '07:00 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'lang-du-lich-binh-quoi',
    city: 'Bình Thạnh · TP.HCM',
    district: 'Bình Thạnh',
    lat: 10.8266,
    lng: 106.7376,
    category: 'ancient_town',
    rating: 4.6,
    reviewCount: 11200,
    ticketPrice: 'Miễn phí vào cổng (Buffet cuối tuần ~300.000đ)',
    address: '1147 Bình Quới, Phường 28, Quận Bình Thạnh, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Làng Du lịch Bình Quới (Bán đảo Thanh Đa)',
        shortSummary:
          'Không gian miệt vườn Nam Bộ xanh mát yên bình giữa lòng thành phố với rặng dừa nước, cầu khỉ, ao sen, nhà tranh vách đất và buffet ẩm thực khẩn hoang Nam Bộ nổi tiếng.',
        historicalEra: 'Khởi dựng thập niên 1970',
        openingHours: '09:00 – 21:00 Hàng ngày',
        architecturalHighlights: [
          'Cảnh quan sông nước miệt vườn Nam Bộ nguyên bản với cầu khỉ, xuồng ba lá và nhà chòi lá dừa',
          'Thảm cỏ xanh rộng lớn ven sông Sài Gòn – tọa độ chụp ảnh áo bà ba, áo dài truyền thống tuyệt đẹp',
          'Buffet "Khẩn hoang Nam Bộ" cuối tuần quy tụ hơn 70 món quê dân dã',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Làng Du lịch Bình Quới nằm ở cuối bán đảo Thanh Đa xanh mát bên dòng sông Sài Gòn.',
          'Rời xa sự náo nhiệt của trung tâm chỉ khoảng 20 phút di chuyển, nơi đây tái hiện trọn vẹn hồn quê Nam Bộ với rặng dừa nước, ao súng, chiếc xuồng ba lá và hương vị ẩm thực miệt vườn đậm đà.',
        ],
      },
      en: {
        name: 'Binh Quoi Tourist Village (Thanh Da Peninsula)',
        shortSummary:
          'A lush Mekong-style riverside retreat on Thanh Da Peninsula featuring palm-fringed canals, wooden footbridges, lotus ponds, and famed Southern Vietnamese folk buffets.',
        historicalEra: 'Established in the 1970s',
        openingHours: '09:00 – 21:00 Daily',
        architecturalHighlights: [
          'Authentic Southern Vietnamese village setting with thatched cottages, water palms, and monkey bridges',
          'Expansive riverside lawns ideal for traditional Ao Ba Ba & Ao Dai photography',
          'Weekend Southern Folk Buffet featuring over 70 traditional countryside dishes',
        ],
        audioScript: [
          'Welcome to Binh Quoi Village on Thanh Da Peninsula, a tranquil Mekong-style riverside oasis just 20 minutes from downtown Ho Chi Minh City.',
        ],
      },
      fr: {
        name: 'Village Touristique de Binh Quoi (Presqu’île de Thanh Da)',
        shortSummary:
          'Oasis verdoyante au bord du fleuve Saïgon recréant l’atmosphère des villages du delta du Mékong avec ponts de bois, palmiers d’eau et buffets du Sud.',
        historicalEra: 'Années 1970',
        openingHours: '09h00 – 21h00',
        architecturalHighlights: [
          'Paysage champêtre de cocotiers d’eau, étangs de lotus et paillotes',
          'Célèbre buffet gastronomique traditionnel du Sud-Vietnam le week-end',
        ],
        audioScript: [
          'Bienvenue au village touristique de Binh Quoi, havre champêtre au bord du fleuve Saïgon.',
        ],
      },
      zh: {
        name: '平桂旅游村（清多半岛）',
        shortSummary:
          '隐匿于西贡河清多半岛的南越水乡生态村，水椰摇曳、荷塘木桥与草屋相映成趣，周末南越乡土自助餐久负盛名。',
        historicalEra: '始建于20世纪70年代',
        openingHours: '09:00 – 21:00',
        architecturalHighlights: [
          '原汁原味的湄公河三角洲水乡园林与木桥茅屋',
          '汇聚70余道地道南越风味的周末特色自助餐',
        ],
        audioScript: [
          '欢迎来到平桂旅游村，在这里不用远离市区便能感受诗意悠闲的南越水乡风情。',
        ],
      },
      ja: {
        name: 'ビンクオイ観光村（タインダー半島）',
        shortSummary:
          'サイゴン川沿いの緑豊かな半島に広がる南ベトナムの田園リゾート。ニッパヤシや蓮池、伝統料理の週末ビュッフェが人気です。',
        historicalEra: '1970年代開設',
        openingHours: '09:00 – 21:00',
        architecturalHighlights: [
          'メコンの農村を再現したヤシ並木・木橋・蓮池のフォトスポット',
          '70種以上の南部郷土料理を味わえる週末ビュッフェ',
        ],
        audioScript: [
          '市内からわずかの距離で南ベトナムの田園風景を楽しめるビンクオイ観光村へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'bq-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Không gian xanh mát đậm chất miệt vườn tại Làng Du lịch Bình Quới',
          en: 'Riverside gardens and thatched pavilions at Binh Quoi Village',
          fr: 'Les jardins tropicaux du village Binh Quoi',
          zh: '清多半岛平桂旅游村水乡风光',
          ja: 'ビンクオイ観光村の緑豊かな水辺風景',
        },
        yearOrSource: 'Bán đảo Thanh Đa · Bình Thạnh',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-bq-1',
        name: 'Nhà hàng Buffet Khẩn Hoang Nam Bộ (Bình Quới 1)',
        cuisine: 'Ẩm thực Miền Tây & Nam Bộ',
        specialtyDishes: ['Bánh xèo củ hủ dừa', 'Cá lóc nướng trui', 'Cháo vịt Thanh Đa'],
        rating: 4.6,
        reviewCount: 3820,
        priceRange: '180.000đ – 330.000đ',
        lat: 10.8268,
        lng: 106.7378,
        address: '1147 Bình Quới, Phường 28, Quận Bình Thạnh, TP.HCM',
        openHours: '10:00 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'hem-hao-si-phuong-cho-lon',
    city: 'Quận 5 · Chợ Lớn',
    district: 'Quận 5',
    lat: 10.7544,
    lng: 106.6657,
    category: 'ancient_town',
    rating: 4.6,
    reviewCount: 4920,
    ticketPrice: 'Miễn phí (Giữ trật tự cho cư dân)',
    address: 'Hẻm 206 Trần Hưng Đạo, Phường 11, Quận 5, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Hẻm cổ Hào Sĩ Phường (Hơn 100 năm tuổi)',
        shortSummary:
          'Con hẻm chung cư cổ xây dựng từ năm 1910 bởi công ty Hứa Bổn Hòa (Chú Hỏa), nổi tiếng với hành lang sơn xanh–vàng, cầu thang gỗ và khung cảnh đậm chất điện ảnh Hồng Kông xưa.',
        historicalEra: 'Khởi dựng năm 1910 (Hơn 115 năm tuổi)',
        openingHours: '08:00 – 18:00 (Ghé thăm văn minh, tránh làm ồn)',
        architecturalHighlights: [
          'Hai dãy nhà phố liền kề 2 tầng đối xứng qua lối đi hẹp lát gạch cổ mang đậm hồn Chợ Lớn đầu thế kỷ 20',
          'Bảng màu xanh ngọc, vàng nhạt, cửa chớp gỗ và câu đối đỏ tạo nên bối cảnh nhiếp ảnh độc nhất vô nhị',
          'Liền kề Phố lồng đèn Lương Nhữ Học và trục hội quán Nguyễn Trãi',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Hẻm cổ Hào Sĩ Phường tại số 206 Trần Hưng Đạo, Quận 5 – khu cư xá hơn 115 năm tuổi do công ty Chú Hỏa xây dựng năm 1910.',
          'Bước qua cổng hẻm nhỏ, không gian như quay ngược thời gian về Chợ Lớn thập niên 1960 với những dãy ban công xanh–vàng đối diện nhau. Khi chụp ảnh lưu niệm, quý khách vui lòng giữ yên lặng và tôn trọng đời sống sinh hoạt của các hộ dân nơi đây.',
        ],
      },
      en: {
        name: 'Hao Si Phuong Historic Alley (1910)',
        shortSummary:
          'A century-old Sino-Vietnamese residential alleyway built in 1910 in Cho Lon, celebrated for its pastel green-and-yellow balconies and timeless cinematic charm.',
        historicalEra: 'Built in 1910',
        openingHours: '08:00 – 18:00 (Please respect residents)',
        architecturalHighlights: [
          'Symmetrical two-story wooden-shuttered shophouses lining a narrow heritage courtyard',
          'Pastel mint walls, red lucky couplets, and retro staircases beloved by photographers',
          'Minutes away from Luong Nhu Hoc Lantern Street and Cho Lon temples',
        ],
        audioScript: [
          'Welcome to Hao Si Phuong, a picturesque 1910 residential alley in Cho Lon frozen in time with vintage balconies and warm neighborhood charm.',
        ],
      },
      fr: {
        name: 'Ruelle Historique Hao Si Phuong (1910)',
        shortSummary:
          'Ruelle résidentielle centenaire de Cho Lon bâtie en 1910, célèbre pour ses balcons pastel et son atmosphère cinématographique rétro.',
        historicalEra: '1910',
        openingHours: '08h00 – 18h00',
        architecturalHighlights: [
          'Galeries symétriques vert d’eau et jaune aux volets en bois anciens',
          'Décor authentique de la vie quotidienne de Cho Lon',
        ],
        audioScript: [
          'Bienvenue dans la ruelle Hao Si Phuong, joyau architectural centenaire du quartier de Cho Lon.',
        ],
      },
      zh: {
        name: '豪士坊百年老巷（1910年）',
        shortSummary:
          '建于1910年的堤岸百年华人老宅院，青黄相间的木质廊道与复古楼梯充满老香港电影氛围。',
        historicalEra: '建于1910年',
        openingHours: '08:00 – 18:00（请轻声文明参观）',
        architecturalHighlights: [
          '对称双层老式骑楼走廊、百叶窗与春联',
          '紧邻梁汝学灯笼街与各大百年华人会馆',
        ],
        audioScript: [
          '欢迎来到建于1910年的堤岸豪士坊老巷，拍照打卡时请保持安静，尊重当地居民生活。',
        ],
      },
      ja: {
        name: 'ハオシーフオン歴史路地（1910年）',
        shortSummary:
          '1910年に建てられたチョロンのレトロな集合住宅路地。パステルカラーの回廊と木製階段がノスタルジックな映画の世界を思わせます。',
        historicalEra: '1910年建築',
        openingHours: '08:00 – 18:00（住民への配慮を忘れずに）',
        architecturalHighlights: [
          '向かい合う2階建て長屋とミントグリーンの古い回廊',
          'ランタン通りや天后宮と合わせて歩ける絶好の撮影地',
        ],
        audioScript: [
          '1910年から続くチョロンの隠れたフォトスポット、ハオシーフオン路地へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'hsp-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Hành lang trăm tuổi đầy hoài niệm tại Hẻm Hào Sĩ Phường, Quận 5',
          en: 'Century-old balconies of Hao Si Phuong Alley in Cho Lon',
          fr: 'Les balcons anciens de la ruelle Hao Si Phuong',
          zh: '堤岸百年老巷豪士坊',
          ja: 'ノスタルジックなハオシーフオン路地',
        },
        yearOrSource: 'Di sản Kiến trúc Dân gian Chợ Lớn',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-hsp-1',
        name: 'Sủi Cảo Thiên Thiên (Hà Tôn Quyền – Chợ Lớn)',
        cuisine: 'Sủi cảo & Mì kéo Chợ Lớn',
        specialtyDishes: ['Sủi cảo tôm thịt thập cẩm', 'Sủi cảo chiên giòn', 'Mì khô dầu hào'],
        rating: 4.6,
        reviewCount: 5120,
        priceRange: '55.000đ – 110.000đ',
        lat: 10.7579,
        lng: 106.6584,
        address: '197 Hà Tôn Quyền, Phường 4, Quận 11 (giáp Q.5), TP.HCM',
        openHours: '13:00 – 23:00',
        imageUrl:
          'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'cho-binh-tay-cho-lon',
    city: 'Quận 6 · Chợ Lớn',
    district: 'Quận 6',
    lat: 10.7495,
    lng: 106.6512,
    category: 'ancient_town',
    rating: 4.6,
    reviewCount: 18400,
    ticketPrice: 'Miễn phí tham quan',
    address: '57A Tháp Mười, Phường 2, Quận 6, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Chợ Bình Tây (Chợ Lớn Mới · 1928)',
        shortSummary:
          'Ngôi chợ đầu mối lịch sử vĩ đại nhất khu Chợ Lớn xây dựng năm 1928–1930 bởi thương nhân Quách Đàm, mang kiến trúc chữ Khẩu Á Đông kết hợp kỹ thuật Pháp cùng tháp đồng hồ 4 mặt.',
        historicalEra: '1928 – 1930 (Di tích Kiến trúc TP.HCM)',
        openingHours: '06:00 – 19:00 Hàng ngày',
        architecturalHighlights: [
          'Mái ngói lưu ly uốn cong với cặp rồng chầu châu và tháp đồng hồ 4 mặt cổ kính',
          'Sân hoa viên giếng trời rộng lớn ở trung tâm đặt tượng đồng thương nhân Quách Đàm',
          'Hơn 2.300 sạp hàng sỉ gia vị, trà, thảo mộc, bánh mứt và khu ẩm thực Chợ Lớn cực kỳ sôi động',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Chợ Bình Tây – còn gọi là Chợ Lớn Mới tại số 57A Tháp Mười, Quận 6.',
          'Khởi công năm 1928 bằng kinh phí của doanh nhân Quách Đàm, ngôi chợ là kiệt tác giao thoa giữa mái ngói âm dương Á Đông và kết cấu bê tông cốt thép Pháp, sở hữu khoảng sân giếng trời xanh mát đầy bản sắc thương cảng Chợ Lớn.',
        ],
      },
      en: {
        name: 'Binh Tay Market (Cho Lon Historic Market · 1928)',
        shortSummary:
          'Chinatown’s grand 1928 wholesale market built by merchant Quach Dam, combining curved Asian glazed-tile roofs, a four-sided clock tower, and a lush central courtyard.',
        historicalEra: '1928 – 1930',
        openingHours: '06:00 – 19:00 Daily',
        architecturalHighlights: [
          'Pagoda-style curved tile roof crowned with dragon motifs and a central clock tower',
          'Open-air central courtyard garden honoring founder Quach Dam',
          'Over 2,300 bustling stalls of spices, dried delicacies, tea, and local street food',
        ],
        audioScript: [
          'Welcome to Binh Tay Market in District 6, the architectural and commercial centerpiece of Cho Lon since 1928.',
        ],
      },
      fr: {
        name: 'Marché Binh Tay (Grand Marché de Cho Lon · 1928)',
        shortSummary:
          'Grand marché historique de Cho Lon bâti en 1928 alliant toitures chinoises vernissées, tour de l’horloge et cour-jardin centrale.',
        historicalEra: '1928 – 1930',
        openingHours: '06h00 – 19h00',
        architecturalHighlights: [
          'Toits pagode ornés de dragons et tour de l’horloge à quatre cadrans',
          'Plus de 2 300 étals d’épices, thés et spécialités de Cho Lon',
        ],
        audioScript: [
          'Bienvenue au marché Binh Tay, cœur commerçant et architectural de Cho Lon depuis 1928.',
        ],
      },
      zh: {
        name: '平西市场（堤岸新大市场 · 1928年）',
        shortSummary:
          '1928年由华商郭琰捐建的堤岸地标大市场，中式琉璃飞檐四面钟楼与法式结构完美结合，中央庭院绿意盎然。',
        historicalEra: '1928 – 1930年',
        openingHours: '06:00 – 19:00',
        architecturalHighlights: [
          '四面复古钟楼、中式琉璃瓦飞檐与双龙戏珠屋脊',
          '逾2300家香料、干货、茶叶摊位与热闹美食区',
        ],
        audioScript: [
          '欢迎来到第六郡的平西市场，这座建于1928年的百年市场是感受堤岸商贸活力的最佳去处。',
        ],
      },
      ja: {
        name: 'ビンタイ市場（チョロン大市場・1928年）',
        shortSummary:
          '1928年建設のチョロン最大の卸売市場。東洋風の瓦屋根と四面時計塔、緑の中庭が美しい歴史的建築です。',
        historicalEra: '1928年 – 1930年',
        openingHours: '06:00 – 19:00',
        architecturalHighlights: [
          '龍の装飾を載せた反り屋根と象徴的な時計塔',
          'スパイス・乾物・茶葉が並ぶ2,300以上の活気ある商店',
        ],
        audioScript: [
          '1928年建設のチョロンを代表する歴史市場、ビンタイ市場へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'cbtay-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Tháp đồng hồ và mái ngói Á Đông đặc trưng của Chợ Bình Tây (1928)',
          en: 'Clock tower and glazed roofs of Binh Tay Market (1928)',
          fr: 'La tour de l’horloge du marché Binh Tay',
          zh: '第六郡百年平西市场钟楼',
          ja: 'ビンタイ市場の時計塔と伝統屋根',
        },
        yearOrSource: 'Di tích Kiến trúc Nghệ thuật TP.HCM',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cbtay-1',
        name: 'Cơm Gà Đông Nguyên (Chợ Lớn từ 1945)',
        cuisine: 'Cơm gà & Canh tiềm Quảng Đông',
        specialtyDishes: ['Cơm gà luộc da giòn', 'Canh tiềm thảo mộc', 'Xá xíu mật ong'],
        rating: 4.6,
        reviewCount: 4210,
        priceRange: '70.000đ – 160.000đ',
        lat: 10.7532,
        lng: 106.6634,
        address: '801 Nguyễn Trãi, Phường 14, Quận 5 (gần Chợ Bình Tây), TP.HCM',
        openHours: '09:00 – 20:30',
        imageUrl:
          'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'bao-tang-y-hoc-co-truyen-fito',
    city: 'Quận 10 · TP.HCM',
    district: 'Quận 10',
    lat: 10.7745,
    lng: 106.6743,
    category: 'museum',
    rating: 4.7,
    reviewCount: 4180,
    ticketPrice: '180.000đ (HSSV/Trẻ em 90.000đ)',
    address: '41 Hoàng Dư Khương, Phường 12, Quận 10, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Bảo tàng Y học Cổ truyền Việt Nam (FITO Museum)',
        shortSummary:
          'Bảo tàng y học cổ truyền đầu tiên tại Việt Nam thiết kế theo phong cách nhà gỗ truyền thống 5 tầng chạm trổ công phu, lưu giữ hơn 3.000 hiện vật dao cầu, thuyền tán, sách thuốc cổ từ thời Đồ đá.',
        historicalEra: 'Khánh thành năm 2007',
        openingHours: '08:30 – 17:00 Hàng ngày',
        architecturalHighlights: [
          'Ngôi nhà gỗ 5 tầng gồm 18 phòng trưng bày chạm khắc rồng phượng theo lối cổ truyền Bắc – Trung – Nam',
          'Bộ sưu tập hơn 3.000 cổ vật ngành y: dao cầu, thuyền tán, cối giã thuốc, ấm sắc thuốc và tủ thuốc bắc thế kỷ 19',
          'Trải nghiệm bốc thuốc, giã thảo mộc và thưởng trà dưỡng sinh miễn phí sau tham quan',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Bảo tàng Y học Cổ truyền Việt Nam – FITO Museum tại số 41 Hoàng Dư Khương, Quận 10.',
          'Bước qua cánh cửa gỗ chạm khắc tinh xảo, quý khách sẽ lạc vào không gian 18 phòng trưng bày mùi hương thảo mộc dịu nhẹ, khám phá lịch sử nghìn năm thuốc Nam cùng hai vị đại danh y Tuệ Tĩnh và Hải Thượng Lãn Ông.',
        ],
      },
      en: {
        name: 'FITO Museum (Museum of Traditional Vietnamese Medicine)',
        shortSummary:
          'A hidden five-story carved timber house in District 10 displaying over 3,000 antique apothecary tools, herb cutters, medicinal manuscripts, and herbal tea tastings.',
        historicalEra: 'Opened in 2007',
        openingHours: '08:30 – 17:00 Daily',
        architecturalHighlights: [
          'Intricately carved traditional Vietnamese wooden house with 18 atmospheric galleries',
          '3,000+ artifacts including stone mortars, bronze herb grinders, and antique pharmacies',
          'Complimentary herbal tea tasting and hands-on herb grinding experience',
        ],
        audioScript: [
          'Welcome to the FITO Museum of Traditional Vietnamese Medicine in District 10, an exquisite wooden sanctuary preserving over 3,000 historic medical artifacts.',
        ],
      },
      fr: {
        name: 'Musée FITO de la Médecine Traditionnelle Vietnamienne',
        shortSummary:
          'Superbe maison traditionnelle en bois sculpté du 10e arrondissement abritant plus de 3 000 objets anciens de pharmacopée vietnamienne.',
        historicalEra: '2007',
        openingHours: '08h30 – 17h00',
        architecturalHighlights: [
          '18 salles en bois précieux aux odeurs d’herbes médicinales',
          'Anciennes pharmacies reconstituées et dégustation de tisane',
        ],
        audioScript: [
          'Bienvenue au musée FITO, consacré à l’histoire millénaire de la médecine traditionnelle vietnamienne.',
        ],
      },
      zh: {
        name: '越南传统医学博物馆（FITO博物馆）',
        shortSummary:
          '位于第十郡的五层传统雕花木楼博物馆，珍藏三千余件古代药碾、药柜与医书典籍，参观后可免费品尝养生草本茶。',
        historicalEra: '2007年开馆',
        openingHours: '08:30 – 17:00',
        architecturalHighlights: [
          '18间古色古香的传统硬木雕花展室',
          '珍藏逾3,000件传统中药器具与古医籍',
        ],
        audioScript: [
          '欢迎来到第十郡的越南传统医学博物馆，木香与药香交织的古楼展厅极具文化魅力。',
        ],
      },
      ja: {
        name: 'ベトナム伝統医学博物館（FITOミュージアム）',
        shortSummary:
          '繊細な木彫りが施された5階建ての伝統木造館に3,000点以上の漢方・薬草道具を展示。見学後の薬草茶試飲も人気です。',
        historicalEra: '2007年開館',
        openingHours: '08:30 – 17:00',
        architecturalHighlights: [
          '18室からなる総木造の重厚なベトナム伝統建築',
          '薬研・古い薬箪笥・古医書など3,000点以上のコレクション',
        ],
        audioScript: [
          '10区の隠れた名所、ベトナム伝統医学博物館（FITO）へようこそ。美しい木造建築と千年の薬草文化を体感できます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'fito-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Kiến trúc nhà gỗ chạm khắc cổ truyền tại Bảo tàng FITO, Quận 10',
          en: 'Carved wooden galleries inside FITO Museum, District 10',
          fr: 'Les salles en bois sculpté du musée FITO',
          zh: '第十郡FITO传统医学博物馆木雕展厅',
          ja: 'FITO伝統医学博物館の木造展示室',
        },
        yearOrSource: 'FITO Museum · Quận 10',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-fito-1',
        name: 'Bún Bò Huế Đông Ba (Khu Sư Vạn Hạnh Q.10)',
        cuisine: 'Đặc sản Huế & Cơm Việt',
        specialtyDishes: ['Bún bò giò gân chả cua', 'Bánh bèo nậm lọc', 'Trà sen nhãn nhục'],
        rating: 4.5,
        reviewCount: 1680,
        priceRange: '55.000đ – 95.000đ',
        lat: 10.7738,
        lng: 106.6709,
        address: 'Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM',
        openHours: '07:00 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'cho-hoa-pho-am-thuc-ho-thi-ky',
    city: 'Quận 10 · TP.HCM',
    district: 'Quận 10',
    lat: 10.7647,
    lng: 106.6763,
    category: 'ancient_town',
    rating: 4.6,
    reviewCount: 24500,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Đường Hồ Thị Kỷ, Phường 1, Quận 10, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Chợ hoa & Phố ẩm thực Hồ Thị Kỷ (Quận 10)',
        shortSummary:
          'Chợ đầu mối hoa tươi lớn nhất TP.HCM hoạt động suốt 24/7 kết hợp thiên đường ẩm thực đường phố hơn 100 món đặc sản Sài Gòn – Campuchia sôi động bậc nhất về đêm.',
        historicalEra: 'Thành lập năm 1987',
        openingHours: 'Chợ hoa 24/7 · Phố ẩm thực 15:00 – 23:00',
        architecturalHighlights: [
          'Khu chợ hoa tươi rực rỡ nhập trực tiếp từ Đà Lạt và miền Tây – khung hình sáng sớm tuyệt đẹp',
          'Tuyến phố ẩm thực dài gần 500m với bún num bò chóc, chè Campuchia, nem bò nướng sả, hủ tiếu ốc',
          'Không gian giao thoa văn hóa Việt – Khmer thân thiện, giàu sức sống bản địa',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Chợ hoa và Phố ẩm thực Hồ Thị Kỷ tại Quận 10 – nơi hòa quyện hương sắc ngàn hoa Đà Lạt cùng bản giao hưởng ẩm thực đường phố rộn rã nhất Sài Gòn.',
          'Ban ngày quý khách có thể dạo bước chụp ảnh giữa biển hoa tươi bạt ngàn, còn từ 15 giờ chiều trở đi con phố bừng sáng với hơn trăm gian hàng ẩm thực Việt – Campuchia hấp dẫn.',
        ],
      },
      en: {
        name: 'Ho Thi Ky Flower Market & Night Food Street',
        shortSummary:
          'Ho Chi Minh City’s largest 24/7 wholesale flower market paired with a vibrant night street-food lane featuring over 100 Saigon and Cambodian specialties.',
        historicalEra: 'Established in 1987',
        openingHours: 'Flower Market 24/7 · Food Street 15:00 – 23:00',
        architecturalHighlights: [
          'Kaleidoscope of fresh Da Lat blooms bustling from dawn till midnight',
          'Over 100 street-food stalls serving grilled beef lemongrass skewers, Cambodian noodles, and desserts',
          'Authentic local neighborhood energy rarely missed by food lovers',
        ],
        audioScript: [
          'Welcome to Ho Thi Ky in District 10, Saigon’s famous 24-hour flower market and bustling evening street-food paradise.',
        ],
      },
      fr: {
        name: 'Marché aux Fleurs & Rue Gastronomique Ho Thi Ky',
        shortSummary:
          'Plus grand marché aux fleurs de Hô Chi Minh-Ville doublé chaque soir d’une rue gourmande de spécialités saïgonnaises et cambodgiennes.',
        historicalEra: '1987',
        openingHours: '24h/24 (Street-food 15h00 – 23h00)',
        architecturalHighlights: [
          'Allées parfumées de fleurs fraîches de Da Lat',
          'Plus de 100 stands de street-food animés dès la fin d’après-midi',
        ],
        audioScript: [
          'Bienvenue au marché aux fleurs et à la rue gastronomique Ho Thi Ky, un concentré de couleurs et de saveurs locales.',
        ],
      },
      zh: {
        name: '胡氏纪鲜花市场与夜市美食街',
        shortSummary:
          '胡志明市规模最大的24小时鲜花批发市场，傍晚则变身汇聚百余种越柬地道小吃的超人气街头美食天堂。',
        historicalEra: '始建于1987年',
        openingHours: '花市全天 · 美食街 15:00 – 23:00',
        architecturalHighlights: [
          '大叻鲜花铺满巷弄的缤纷摄影场景',
          '香茅烤牛肉、柬埔寨米粉与百款平价夜市小吃',
        ],
        audioScript: [
          '欢迎来到第十郡胡氏纪花市与美食街，白天赏花拍照、夜晚大啖西贡街头美味。',
        ],
      },
      ja: {
        name: 'ホー・ティ・キー花市場＆屋台グルメ通り',
        shortSummary:
          '24時間活気あふれる市内最大の花市場と、夕方から100軒以上のローカル・カンボジア屋台が並ぶ絶品食べ歩きストリート。',
        historicalEra: '1987年開設',
        openingHours: '花市場 24時間・グルメ通り 15:00 – 23:00',
        architecturalHighlights: [
          'ダラット直送の生花が彩るカラフルな路地',
          'レモングラス牛肉串やカンボジア風チェーなど屋台グルメの宝庫',
        ],
        audioScript: [
          '色とりどりの花市場と絶品ナイトフードが同時に楽しめる10区のホー・ティ・キー通りへようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'htk-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Phố ẩm thực và chợ hoa Hồ Thị Kỷ rộn rã tại Quận 10',
          en: 'Ho Thi Ky Flower Market & Night Food Street',
          fr: 'Le marché aux fleurs et la street-food de Ho Thi Ky',
          zh: '热闹缤纷的胡氏纪花市与夜市',
          ja: '活気あふれるホー・ティ・キー屋台通り',
        },
        yearOrSource: 'Phố Ẩm thực Hồ Thị Kỷ · Quận 10',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-htk-1',
        name: 'Chè Campuchia Cô Huôi & Bún Num Bò Chóc Tư Xê',
        cuisine: 'Đặc sản Campuchia – Sài Gòn',
        specialtyDishes: ['Chè bí đỏ trứng sữa', 'Chè thốt nốt sầu riêng', 'Bún num bò chóc'],
        rating: 4.7,
        reviewCount: 3420,
        priceRange: '25.000đ – 65.000đ',
        lat: 10.7646,
        lng: 106.6761,
        address: '57/21A Hồ Thị Kỷ, Phường 1, Quận 10, TP.HCM',
        openHours: '07:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'pho-di-bo-bui-vien',
    city: 'Quận 1 · TP.HCM',
    district: 'Quận 1',
    lat: 10.7675,
    lng: 106.6938,
    category: 'ancient_town',
    rating: 4.4,
    reviewCount: 41200,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Đường Bùi Viện – Đề Thám, Phường Phạm Ngũ Lão, Quận 1, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Phố đi bộ Bùi Viện (Phố Tây Sài Gòn)',
        shortSummary:
          'Con phố không ngủ náo nhiệt bậc nhất TP.HCM dành cho du khách quốc tế và giới trẻ, bừng sáng ánh đèn neon, nhạc sống, ẩm thực đêm và bia thủ công.',
        historicalEra: 'Phố đi bộ chính thức từ năm 2017',
        openingHours: 'Sôi động nhất 19:00 – 02:00 (Phố đi bộ tối T7–CN)',
        architecturalHighlights: [
          'Không khí lễ hội đường phố rực rỡ ánh đèn neon dài gần 850m giữa khu Phạm Ngũ Lão',
          'Hàng trăm quán ăn đêm, bia Sài Gòn, nhạc acoustic và nghệ sĩ đường phố giao lưu văn hóa quốc tế',
          'Điểm dừng chân lý tưởng khép lại một ngày khám phá di sản Quận 1',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Phố đi bộ Bùi Viện – khu Phố Tây nổi tiếng nhất của Thành phố Hồ Chí Minh, nơi ánh đèn và âm nhạc không bao giờ tắt về đêm.',
          'Từ những quán ăn vỉa hè dân dã đến các không gian nhạc sống sôi động, Bùi Viện mang đến góc nhìn tràn đầy năng lượng về nhịp sống đêm Sài Gòn.',
        ],
      },
      en: {
        name: 'Bui Vien Walking Street (Saigon Backpacker Street)',
        shortSummary:
          'Ho Chi Minh City’s famous neon-lit nightlife promenade packed with street food, live music, craft beer, and international travelers.',
        historicalEra: 'Pedestrian street since 2017',
        openingHours: 'Liveliest 19:00 – 02:00',
        architecturalHighlights: [
          '850-meter neon-glowing entertainment corridor in Pham Ngu Lao quarter',
          'Sidewalk dining, live bands, and energetic Saigon night photography',
          'Walking distance from Ben Thanh Market and 23/9 Park',
        ],
        audioScript: [
          'Welcome to Bui Vien Walking Street, the vibrant nightlife hub of District 1 filled with neon lights, street performers, and late-night flavors.',
        ],
      },
      fr: {
        name: 'Rue piétonne Bui Vien (Quartier nocturne)',
        shortSummary:
          'Artère nocturne la plus animée de Hô Chi Minh-Ville, illuminée de néons, de concerts en direct et de terrasses conviviales.',
        historicalEra: 'Rue piétonne depuis 2017',
        openingHours: '19h00 – 02h00',
        architecturalHighlights: [
          '850 mètres de néons, musique live et cuisine de rue nocturne',
          'Rendez-vous cosmopolite des voyageurs du monde entier',
        ],
        audioScript: [
          'Bienvenue dans la rue Bui Vien, cœur vibrant de la vie nocturne saïgonnaise.',
        ],
      },
      zh: {
        name: '范五老街 · 裴援步行街（西贡不夜街）',
        shortSummary:
          '胡志明市最具活力的霓虹夜生活步行街，汇集全球背包客、现场音乐、精酿啤酒与地道宵夜美食。',
        historicalEra: '2017年设为步行街',
        openingHours: '19:00 – 02:00最热闹',
        architecturalHighlights: [
          '长约850米的赛博霓虹夜市街道与街头表演',
          '体验胡志明市“不夜城”活力的代表地标',
        ],
        audioScript: [
          '欢迎来到第一郡裴援步行街，霓虹闪烁的街景与热闹音乐展现胡志明市的无限活力。',
        ],
      },
      ja: {
        name: 'ブイビエン歩行者天国（バックパッカー通り）',
        shortSummary:
          'ネオンが輝くホーチミン市最大のナイトライフ通り。ライブ音楽、屋台グルメ、世界各国の旅人が交わる眠らない街です。',
        historicalEra: '2017年歩行者天国化',
        openingHours: '19:00 – 02:00がピーク',
        architecturalHighlights: [
          '全長850mにわたるネオンサインと路上パフォーマンス',
          'ベンタイン市場からも徒歩圏内の活気ある夜の繁華街',
        ],
        audioScript: [
          'ネオンと音楽が弾けるホーチミン市最大のナイトスポット、ブイビエン通りへようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'bv-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Phố đi bộ Bùi Viện rực rỡ ánh đèn về đêm tại Quận 1',
          en: 'Bui Vien Walking Street nightlife in District 1',
          fr: 'Ambiance nocturne de la rue Bui Vien',
          zh: '第一郡霓虹闪烁的裴援步行街',
          ja: '夜のブイビエン歩行者天国',
        },
        yearOrSource: 'Phố đi bộ Bùi Viện · Quận 1',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-bv-1',
        name: 'Bún Chả 145 Bùi Viện',
        cuisine: 'Bún chả & Ẩm thực Việt Nam',
        specialtyDishes: ['Bún chả nướng than hoa', 'Nem cua bể giòn', 'Trà tắc mật ong'],
        rating: 4.7,
        reviewCount: 4680,
        priceRange: '55.000đ – 95.000đ',
        lat: 10.7673,
        lng: 106.6934,
        address: '145 Bùi Viện, Phường Phạm Ngũ Lão, Quận 1, TP.HCM',
        openHours: '11:30 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'cong-vien-bo-song-sai-gon-thu-thiem',
    city: 'TP. Thủ Đức · TP.HCM',
    district: 'TP. Thủ Đức',
    lat: 10.7749,
    lng: 106.7128,
    category: 'monument',
    rating: 4.8,
    reviewCount: 12900,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Công viên Bờ sông Sài Gòn (Đầu hầm Thủ Thiêm – Cầu Ba Son), TP. Thủ Đức',
    coverImage:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Công viên Bờ sông Sài Gòn (Thủ Thiêm)',
        shortSummary:
          'Tọa độ check-in ven sông mới nổi cực kỳ thu hút bên bờ Đông sông Sài Gòn, sở hữu cánh đồng hoa theo mùa, cầu đi bộ ven sông và góc ngắm đường chân trời Quận 1 – Bitexco triệu đô.',
        historicalEra: 'Khánh thành cuối năm 2023',
        openingHours: 'Mở cửa 24/7 (Đẹp nhất 16:30 – 21:30)',
        architecturalHighlights: [
          'Góc chụp ảnh toàn cảnh đường chân trời Quận 1, Tháp Bitexco và Cầu Ba Son đẹp nhất TP.HCM',
          'Cánh đồng hoa hướng dương & hoa theo mùa rực rỡ, khu nhà cổ Đình An Khánh và sân khấu sự kiện ven sông',
          'Kết nối trực tiếp tuyến buýt sông Saigon Waterbus và chỉ cách Quận 1 vài phút qua Cầu Ba Son',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Công viên Bờ sông Sài Gòn phía Thủ Thiêm, Thành phố Thủ Đức – không gian công cộng xanh mát và là tọa độ ngắm hoàng hôn được yêu thích bậc nhất hiện nay.',
          'Từ bãi cỏ ven sông và cánh đồng hoa rực rỡ, quý khách có thể ghi lại bức ảnh lưu niệm ôm trọn toàn cảnh Quận 1 và Cầu dây văng Ba Son lung linh phản chiếu trên mặt nước.',
        ],
      },
      en: {
        name: 'Saigon Riverside Park (Thu Thiem)',
        shortSummary:
          'Ho Chi Minh City’s newest waterfront park on the eastern bank of the Saigon River, famous for seasonal flower fields and unobstructed golden-hour views of the District 1 skyline.',
        historicalEra: 'Opened late 2023',
        openingHours: 'Open 24/7 (Best 16:30 – 21:30)',
        architecturalHighlights: [
          'Best panoramic skyline vantage point facing Bitexco Tower, District 1, and Ba Son Bridge',
          'Seasonal sunflower gardens, riverside boardwalk, and open-air cultural plazas',
          'Easy access via Ba Son Bridge or Saigon Waterbus from Bach Dang Wharf',
        ],
        audioScript: [
          'Welcome to Saigon Riverside Park in Thu Thiem, offering seasonal flower gardens and the city’s most celebrated panoramic view across the river to District 1.',
        ],
      },
      fr: {
        name: 'Parc des Berges de Saïgon (Thu Thiem)',
        shortSummary:
          'Nouveau parc fluvial sur la rive est offrant champs de fleurs saisonniers et panorama spectaculaire sur la skyline du 1er arrondissement.',
        historicalEra: 'Inauguré fin 2023',
        openingHours: '24h/24',
        architecturalHighlights: [
          'Vue panoramique imprenable sur la tour Bitexco et le pont Ba Son',
          'Jardins de tournesols saisonniers et promenade fluviale au coucher du soleil',
        ],
        audioScript: [
          'Bienvenue au parc des Berges de Saïgon à Thu Thiem, lieu privilégié pour admirer le coucher de soleil sur la ville.',
        ],
      },
      zh: {
        name: '西贡河畔公园（守添东岸）',
        shortSummary:
          '胡志明市最新爆火的滨水公园，拥有季节性向日葵花海与隔江遥望第一郡金融塔、巴松大桥的绝佳日落机位。',
        historicalEra: '2023年底开放',
        openingHours: '全天开放（16:30 – 21:30最佳）',
        architecturalHighlights: [
          '拍摄第一郡摩天楼群与西贡河倒影的“百万级”全景机位',
          '四季花海、滨水步道与水上巴士码头',
        ],
        audioScript: [
          '欢迎来到守德市守添西贡河畔公园，傍晚在此拍摄对岸第一郡天际线与日落美不胜收。',
        ],
      },
      ja: {
        name: 'サイゴン川リバーサイドパーク（トゥーティエム）',
        shortSummary:
          'サイゴン川東岸に誕生した最新フォトスポット。季節のひまわり畑越しに1区の高層ビル群とバーソン橋の夕景を一望できます。',
        historicalEra: '2023年末オープン',
        openingHours: '24時間開放（16:30 – 21:30がおすすめ）',
        architecturalHighlights: [
          'ビテクスコタワーと1区スカイラインを望む絶景リバーフロント',
          '季節の花畑と水上バス直結の開放的な公園',
        ],
        audioScript: [
          '1区の絶景スカイラインと夕焼けを楽しめるトゥーティエムのサイゴン川リバーサイドパークへようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'cvbs-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Góc nhìn toàn cảnh Quận 1 từ Công viên Bờ sông Sài Gòn (Thủ Thiêm)',
          en: 'District 1 skyline from Saigon Riverside Park in Thu Thiem',
          fr: 'Vue panoramique depuis le parc de Thu Thiem',
          zh: '从守添西贡河畔公园远眺第一郡天际线',
          ja: 'トゥーティエム公園から望む1区スカイライン',
        },
        yearOrSource: 'Công viên Bờ sông Sài Gòn · TP. Thủ Đức',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cvbs-1',
        name: 'Katinat & Cà Phê Ven Sông Công viên Thủ Thiêm',
        cuisine: 'Cà phê View Sông & Đồ ăn nhẹ',
        specialtyDishes: ['Cà phê sữa đá', 'Trà ô long sữa nướng', 'Bánh ngọt thủ công'],
        rating: 4.6,
        reviewCount: 2150,
        priceRange: '45.000đ – 85.000đ',
        lat: 10.7745,
        lng: 106.7123,
        address: 'Công viên Bờ sông Sài Gòn, Phường Thủ Thiêm, TP. Thủ Đức',
        openHours: '07:00 – 22:30',
        imageUrl:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'chua-buu-long-thu-duc',
    city: 'TP. Thủ Đức · TP.HCM',
    district: 'TP. Thủ Đức',
    lat: 10.8738,
    lng: 106.8364,
    category: 'temple',
    rating: 4.9,
    reviewCount: 15600,
    ticketPrice: 'Miễn phí tham quan',
    address: '81 Nguyễn Xiển, Phường Long Bình, TP. Thủ Đức, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Chùa Bửu Long (Thiền viện Tổ đình Bửu Long)',
        shortSummary:
          'Ngôi chùa Phật giáo Nguyên thủy nổi tiếng toàn cầu với Bảo tháp Gotama Cetiya trắng – vàng lộng lẫy soi bóng bên hồ nước xanh, từng được National Geographic vinh danh Top chùa đẹp nhất thế giới.',
        historicalEra: 'Khởi dựng 1942 – Bảo tháp 2007–2013',
        openingHours: '08:00 – 18:00 Hàng ngày',
        architecturalHighlights: [
          'Bảo tháp Gotama Cetiya cao 56m phủ sắc trắng thanh khiết và chóp nhọn mạ vàng rực rỡ',
          'Hồ bán nguyệt màu xanh ngọc trước tháp tạo hiệu ứng soi bóng tuyệt mỹ',
          'Kết hợp tinh hoa kiến trúc Phật giáo Ấn Độ – Thái Lan cùng họa tiết rồng thời Nguyễn bên bờ sông Đồng Nai',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Thiền viện Tổ đình Bửu Long tại phường Long Bình, Thành phố Thủ Đức – một trong những ngôi chùa có kiến trúc Phật giáo đẹp nhất thế giới theo bình chọn của National Geographic.',
          'Nổi bật giữa khuôn viên rừng cây thanh tịnh rộng 11 hecta bên sông Đồng Nai là Bảo tháp Gotama Cetiya cao 56 mét với chóp vàng óng ánh soi bóng xuống hồ nước xanh ngọc, mang lại khung hình lưu niệm tựa chốn bồng lai.',
        ],
      },
      en: {
        name: 'Buu Long Pagoda (Gotama Cetiya Stupa · Thu Duc)',
        shortSummary:
          'A serene Theravada Buddhist monastery celebrated by National Geographic for its gleaming white-and-gold 56-meter Gotama Cetiya stupa reflected in a turquoise pool.',
        historicalEra: 'Founded 1942 – Stupa 2013',
        openingHours: '08:00 – 18:00 Daily',
        architecturalHighlights: [
          '56-meter white-and-gold Gotama Cetiya stupa with Thai, Indian, and Nguyen Dynasty accents',
          'Mirror-like turquoise crescent pond creating extraordinary photo reflections',
          'Tranquil 11-hectare wooded hillside overlooking the Dong Nai River',
        ],
        audioScript: [
          'Welcome to Buu Long Pagoda in Thu Duc City, renowned worldwide for its dazzling white-and-gold Gotama Cetiya stupa reflected across a turquoise pool.',
        ],
      },
      fr: {
        name: 'Pagode Buu Long (Stupa Gotama Cetiya · Thu Duc)',
        shortSummary:
          'Monastère bouddhique theravada célèbre pour son stupa blanc et or de 56 mètres se reflétant dans un bassin turquoise, classé parmi les plus beaux temples du monde.',
        historicalEra: '1942 – 2013',
        openingHours: '08h00 – 18h00',
        architecturalHighlights: [
          'Stupa Gotama Cetiya blanc et doré de 56 mètres',
          'Bassin turquoise miroir dans un parc boisé de 11 hectares',
        ],
        audioScript: [
          'Bienvenue à la pagode Buu Long, joyau d’architecture bouddhique aux reflets d’or dans la ville de Thu Duc.',
        ],
      },
      zh: {
        name: '宝龙寺（守德市金色佛塔）',
        shortSummary:
          '曾入选《国家地理》全球最美佛寺榜单的南传佛教名刹，56米高白底金顶舍利塔倒映碧水池中，宛若仙境。',
        historicalEra: '1942年建寺 – 2013年大塔落成',
        openingHours: '08:00 – 18:00',
        architecturalHighlights: [
          '融合印泰与阮朝美学的高56米白金舍利宝塔',
          '碧蓝半月池倒影与11公顷静谧山林',
        ],
        audioScript: [
          '欢迎来到守德市宝龙寺，纯白与鎏金交辉的舍利宝塔倒映碧池，是胡志明市最梦幻的摄影圣地之一。',
        ],
      },
      ja: {
        name: 'ブーロン寺（黄金仏塔・トゥードゥック市）',
        shortSummary:
          'ナショナルジオグラフィック誌でも称賛された上座部仏教の美しい寺院。高さ56mの白と黄金の仏塔が青い池に映る絶景が人気です。',
        historicalEra: '1942年創建 – 2013年仏塔完成',
        openingHours: '08:00 – 18:00',
        architecturalHighlights: [
          'タイ・インド・阮朝様式が融合した高さ56mの黄金ストゥーパ',
          'ターコイズブルーの池に映る幻想的なリフレクション',
        ],
        audioScript: [
          '白と黄金の仏塔が美しいトゥードゥック市の名刹、ブーロン寺へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'cbl-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Bảo tháp Gotama Cetiya rực rỡ ánh vàng tại Chùa Bửu Long, TP. Thủ Đức',
          en: 'Golden Gotama Cetiya Stupa at Buu Long Pagoda',
          fr: 'Le stupa doré de la pagode Buu Long',
          zh: '守德市宝龙寺白金舍利塔',
          ja: 'トゥードゥック市ブーロン寺の黄金仏塔',
        },
        yearOrSource: 'Thiền viện Tổ đình Bửu Long · TP. Thủ Đức',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cbl-1',
        name: 'Quán Chay Bửu Long & Ẩm thực Sông Đồng Nai',
        cuisine: 'Ẩm thực Chay & Đặc sản Long Bình',
        specialtyDishes: ['Cơm chay thập cẩm', 'Bún riêu chay nấm mối', 'Nước mía sầu riêng'],
        rating: 4.6,
        reviewCount: 1240,
        priceRange: '35.000đ – 90.000đ',
        lat: 10.8725,
        lng: 106.8351,
        address: 'Nguyễn Xiển, Phường Long Bình, TP. Thủ Đức, TP.HCM',
        openHours: '07:00 – 18:30',
        imageUrl:
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'bao-tang-ao-dai-thu-duc',
    city: 'TP. Thủ Đức · TP.HCM',
    district: 'TP. Thủ Đức',
    lat: 10.8062,
    lng: 106.8431,
    category: 'museum',
    rating: 4.7,
    reviewCount: 5340,
    ticketPrice: '50.000đ (HSSV 30.000đ)',
    address: '206/19/30 Long Thuận, Phường Long Phước, TP. Thủ Đức, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Bảo tàng Áo Dài Việt Nam (TP. Thủ Đức)',
        shortSummary:
          'Không gian văn hóa miệt vườn thanh bình rộng gần 2 hecta do nhà thiết kế Sĩ Hoàng sáng lập, tôn vinh hành trình 300 năm của tà Áo dài Việt Nam giữa nhà rường cổ, ao sen và cầu gỗ.',
        historicalEra: 'Khánh thành năm 2014 (NTK Sĩ Hoàng)',
        openingHours: '08:30 – 17:30 Hàng ngày',
        architecturalHighlights: [
          'Khu nhà rường gỗ Quảng Nam cổ kính bên hồ sen, cầu tre và vườn cây ăn trái cực kỳ thơ mộng',
          'Hơn 300 bộ áo dài từ thế kỷ 17 đến hiện đại và kỷ vật của các nữ chính khách, nghệ sĩ nổi tiếng',
          'Dịch vụ cho thuê áo dài truyền thống để du khách chụp ảnh lưu niệm ngay trong khuôn viên cổ',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Bảo tàng Áo Dài Việt Nam tại phường Long Phước, Thành phố Thủ Đức – một ốc đảo văn hóa thanh bình với nhà rường gỗ cổ và hồ sen ngát hương.',
          'Tại đây, quý khách sẽ khám phá hành trình tiến hóa hơn 300 năm của chiếc áo dài Việt Nam từ áo giao lĩnh, ngũ thân đến áo dài tân thời, đồng thời có thể khoác lên mình tà áo dài để lưu lại những khuôn hình đậm hồn dân tộc.',
        ],
      },
      en: {
        name: 'Ao Dai Museum (Vietnamese National Dress Museum)',
        shortSummary:
          'A poetic lakeside cultural estate in Thu Duc City founded by designer Si Hoang, celebrating 300 years of Vietnam’s iconic Ao Dai amidst lotus ponds and antique timber pavilions.',
        historicalEra: 'Opened in 2014',
        openingHours: '08:30 – 17:30 Daily',
        architecturalHighlights: [
          'Traditional timber houses set amid lotus lakes, wooden bridges, and lush gardens',
          '300+ historical and contemporary Ao Dai gowns documenting 3 centuries of Vietnamese fashion',
          'On-site Ao Dai rental for memorable heritage photoshoots',
        ],
        audioScript: [
          'Welcome to the Ao Dai Museum in Thu Duc City, a tranquil garden sanctuary showcasing three centuries of Vietnam’s iconic national dress.',
        ],
      },
      fr: {
        name: 'Musée de l’Ao Dai (Thu Duc)',
        shortSummary:
          'Domaine bucolique d’étangs de lotus et de maisons anciennes en bois dédié aux 300 ans d’histoire du costume traditionnel Ao Dai.',
        historicalEra: '2014',
        openingHours: '08h30 – 17h30',
        architecturalHighlights: [
          'Maisons traditionnelles en bois, ponts champêtres et bassins de lotus',
          'Plus de 300 modèles d’Ao Dai et location de tenues pour séances photo',
        ],
        audioScript: [
          'Bienvenue au musée de l’Ao Dai, écrin de verdure dédié à l’élégance du costume traditionnel vietnamien.',
        ],
      },
      zh: {
        name: '越南奥黛博物馆（守德市）',
        shortSummary:
          '由著名设计师士皇创立的园林式博物馆，古木屋、莲花池与木桥相映，展示三百年越南国服奥黛演变史并提供奥黛换装拍照。',
        historicalEra: '2014年开馆',
        openingHours: '08:30 – 17:30',
        architecturalHighlights: [
          '江南水乡般诗意的莲池、古木屋与竹桥园林',
          '逾300套历代奥黛珍品，支持现场租借奥黛留影',
        ],
        audioScript: [
          '欢迎来到守德市的越南奥黛博物馆，您既能了解三百年奥黛文化，也能身着奥黛在莲池古宅留影。',
        ],
      },
      ja: {
        name: 'アオザイ博物館（トゥードゥック市）',
        shortSummary:
          '蓮池と古民家が広がる詩情豊かな庭園博物館。300年にわたるベトナム民族衣装アオザイの変遷を展示し、試着撮影も楽しめます。',
        historicalEra: '2014年開館',
        openingHours: '08:30 – 17:30',
        architecturalHighlights: [
          '蓮池・木橋・伝統木造家屋が織りなす絶好の撮影ロケーション',
          '300着以上のアオザイ展示とレンタル撮影体験',
        ],
        audioScript: [
          '美しい蓮池と古民家の中でアオザイの歴史と着付け撮影が楽しめるアオザイ博物館へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'btad-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Không gian nhà rường và hồ sen thơ mộng tại Bảo tàng Áo Dài',
          en: 'Lotus ponds and timber pavilions at the Ao Dai Museum',
          fr: 'Les jardins et étangs du musée de l’Ao Dai',
          zh: '守德市奥黛博物馆莲池与古宅',
          ja: 'アオザイ博物館の蓮池と伝統家屋',
        },
        yearOrSource: 'Bảo tàng Áo Dài · TP. Thủ Đức',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-btad-1',
        name: 'Ẩm thực Chợ Quê Long Phước (Trong Bảo tàng Áo Dài)',
        cuisine: 'Món quê Nam Bộ & Trà sen',
        specialtyDishes: ['Bánh xèo rau vườn', 'Gỏi ngó sen tôm thịt', 'Chè hạt sen long nhãn'],
        rating: 4.6,
        reviewCount: 920,
        priceRange: '45.000đ – 120.000đ',
        lat: 10.8065,
        lng: 106.8428,
        address: '206/19/30 Long Thuận, Phường Long Phước, TP. Thủ Đức, TP.HCM',
        openHours: '08:30 – 17:00',
        imageUrl:
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'bao-tang-nghe-thuat-quang-san',
    city: 'TP. Thủ Đức · TP.HCM',
    district: 'TP. Thủ Đức',
    lat: 10.8112,
    lng: 106.7376,
    category: 'museum',
    rating: 4.8,
    reviewCount: 1620,
    ticketPrice: '200.000đ (HSSV 100.000đ)',
    address: '189B/3 Nguyễn Văn Hưởng, Phường Thảo Điền, TP. Thủ Đức, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Bảo tàng Nghệ thuật Quang San (Thảo Điền)',
        shortSummary:
          'Bảo tàng nghệ thuật tư nhân đầu tiên tại TP.HCM tọa lạc ven sông Thảo Điền, lưu giữ hơn 1.500 kiệt tác hội họa Việt Nam từ Mỹ thuật Đông Dương (bộ tứ Trí–Lân–Vân–Cẩn) đến đương đại.',
        historicalEra: 'Khánh thành năm 2023',
        openingHours: '09:00 – 16:30 (Thứ 3 – Chủ nhật)',
        architecturalHighlights: [
          'Không gian trưng bày 3 tầng sang trọng, ánh sáng chuẩn bảo tàng quốc tế bên khu phố nghệ thuật Thảo Điền',
          'Quy tụ tác phẩm quý hiếm của bộ tứ danh họa Đông Dương Nguyễn Gia Trí, Tô Ngọc Vân, Nguyễn Tường Lân, Trần Văn Cẩn',
          'Biệt thự sân vườn thanh lịch kết hợp khu cà phê nghệ thuật cực kỳ tinh tế cho người yêu mỹ thuật',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Bảo tàng Nghệ thuật Quang San tại phường Thảo Điền, Thành phố Thủ Đức – bảo tàng mỹ thuật tư nhân đầu tiên tại Thành phố Hồ Chí Minh.',
          'Bộ sưu tập hơn 1.500 tác phẩm nơi đây đưa người xem đi dọc dòng chảy mỹ thuật Việt Nam suốt gần một thế kỷ, từ sơn mài và tranh lụa Đông Dương kinh điển đến hơi thở hội họa đương đại.',
        ],
      },
      en: {
        name: 'Quang San Art Museum (Thao Dien)',
        shortSummary:
          'Ho Chi Minh City’s first private fine arts museum in leafy Thao Dien, housing over 1,500 masterpieces from the Indochina Fine Arts era to contemporary Vietnamese art.',
        historicalEra: 'Opened in 2023',
        openingHours: '09:00 – 16:30 (Tue – Sun)',
        architecturalHighlights: [
          'Three serene museum-grade floors inside a riverside Thao Dien villa',
          'Rare lacquer, silk, and oil works by Vietnam’s iconic Indochina masters',
          'Surrounded by Thao Dien’s premier cafes, boutiques, and riverfront dining',
        ],
        audioScript: [
          'Welcome to Quang San Art Museum in Thao Dien, Ho Chi Minh City’s first private art museum featuring over 1,500 Vietnamese masterpieces.',
        ],
      },
      fr: {
        name: 'Musée d’Art Quang San (Thao Dien)',
        shortSummary:
          'Premier musée d’art privé de Hô Chi Minh-Ville réunissant plus de 1 500 chefs-d’œuvre de l’École des Beaux-Arts d’Indochine à l’art contemporain.',
        historicalEra: '2023',
        openingHours: '09h00 – 16h30 (Mar – Dim)',
        architecturalHighlights: [
          'Trois étages lumineux dédiés à la peinture sur laque et sur soie vietnamienne',
          'Situé au cœur du quartier créatif de Thao Dien',
        ],
        audioScript: [
          'Bienvenue au musée d’Art Quang San à Thao Dien, consacré aux grands maîtres de la peinture vietnamienne.',
        ],
      },
      zh: {
        name: '光山艺术博物馆（草田 · 守德市）',
        shortSummary:
          '胡志明市首座私人美术馆，坐落于文艺气息浓厚的草田区，收藏逾1,500件印度支那时期至当代的越南绘画大师珍品。',
        historicalEra: '2023年开馆',
        openingHours: '09:00 – 16:30（周二至周日）',
        architecturalHighlights: [
          '国际博物馆级展陈灯光与优雅的河畔花园别墅空间',
          '珍藏越南漆画、丝绸画四大宗师传世佳作',
        ],
        audioScript: [
          '欢迎来到草田区的光山艺术博物馆，感受跨越百年的越南现当代艺术精品。',
        ],
      },
      ja: {
        name: 'クアンサン美術館（タオディエン）',
        shortSummary:
          'おしゃれなタオディエン地区に2023年開館した市内初の私立美術館。インドシナ美術から現代アートまで1,500点以上の名画を所蔵しています。',
        historicalEra: '2023年開館',
        openingHours: '09:00 – 16:30（火〜日）',
        architecturalHighlights: [
          '洗練された3階建てギャラリーと緑豊かなヴィラ建築',
          'ベトナム漆絵・絹絵の巨匠による希少コレクション',
        ],
        audioScript: [
          'タオディエンのおしゃれな街並みに佇むホーチミン市初の私立美術館、クアンサン美術館へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'btqs-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Không gian nghệ thuật tinh tế tại Bảo tàng Quang San, Thảo Điền',
          en: 'Quang San Art Museum in Thao Dien, Thu Duc City',
          fr: 'Le musée d’Art Quang San à Thao Dien',
          zh: '草田光山艺术博物馆',
          ja: 'タオディエンのクアンサン美術館',
        },
        yearOrSource: 'Quang San Art Museum · Thảo Điền',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-btqs-1',
        name: 'The Deck Saigon (Nhà hàng Ven sông Thảo Điền)',
        cuisine: 'Ẩm thực Á – Âu Cao cấp Ven sông',
        specialtyDishes: ['Cá chẽm áp chảo sốt chanh dây', 'Tôm càng nướng bơ tỏi', 'Cocktail hoàng hôn'],
        rating: 4.7,
        reviewCount: 3890,
        priceRange: '220.000đ – 550.000đ',
        lat: 10.8136,
        lng: 106.7361,
        address: '38 Nguyễn Ư Dĩ, Phường Thảo Điền, TP. Thủ Đức, TP.HCM',
        openHours: '08:00 – 23:00',
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'tu-vien-khanh-an-quan-12',
    city: 'Quận 12 · TP.HCM',
    district: 'Quận 12',
    lat: 10.8648,
    lng: 106.6912,
    category: 'temple',
    rating: 4.8,
    reviewCount: 7850,
    ticketPrice: 'Miễn phí tham quan',
    address: '1055/3D Quốc lộ 1A (Võ Thị Thừa), Phường An Phú Đông, Quận 12, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Tu viện Khánh An ("Tiểu Nhật Bản" giữa Sài Gòn · Quận 12)',
        shortSummary:
          'Ngôi tu viện Phật giáo Bắc tông nổi tiếng với kiến trúc gỗ đỏ – tường trắng thanh tao, mái ngói cong, lồng đèn lục giác và vườn thiền tĩnh lặng tựa cố đô Kyoto.',
        historicalEra: 'Khởi dựng 1905 – Trùng tu 2006–2016',
        openingHours: '05:00 – 20:00 Hàng ngày',
        architecturalHighlights: [
          'Lối kiến trúc Á Đông tối giản với 3 gam màu chủ đạo nâu gỗ, đỏ trầm và trắng vôi cực kỳ thanh lịch',
          'Hàng lồng đèn giấy lục giác, chuông gió và bậc thang đá tạo góc chụp ảnh tựa Nhật Bản',
          'Không gian tu học thanh tịnh, không đốt vàng mã, xanh mát rợp bóng cây',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Tu viện Khánh An tại phường An Phú Đông, Quận 12 – nơi được du khách trìu mến gọi là "Tiểu Nhật Bản" giữa lòng Thành phố Hồ Chí Minh.',
          'Khởi dựng từ năm 1905 và trùng tu theo phong cách thiền viện Á Đông tối giản, Tu viện Khánh An mang đến không gian an yên tuyệt đối cùng những mái ngói gỗ đỏ và hàng lồng đèn trắng tinh tế.',
        ],
      },
      en: {
        name: 'Khanh An Monastery ("Little Japan" of Saigon · District 12)',
        shortSummary:
          'A serene Zen monastery in District 12 nicknamed “Little Japan” for its crimson-timber roofs, white plaster walls, paper lanterns, and peaceful Kyoto-like courtyards.',
        historicalEra: 'Founded 1905 – Restored 2016',
        openingHours: '05:00 – 20:00 Daily',
        architecturalHighlights: [
          'Minimalist East Asian timber-and-white architecture reminiscent of Kyoto temples',
          'Hexagonal paper lanterns, wooden wind chimes, and tranquil stone steps',
          'Peaceful spiritual retreat free of incense smoke and urban noise',
        ],
        audioScript: [
          'Welcome to Khanh An Monastery in District 12, famed for its tranquil Kyoto-inspired timber architecture, white walls, and hanging lanterns.',
        ],
      },
      fr: {
        name: 'Monastère Khanh An ("Petit Japon" de Saïgon · 12e)',
        shortSummary:
          'Monastère zen du 12e arrondissement surnommé le « Petit Japon » pour ses toitures en bois rouge, murs blancs et lanternes de papier.',
        historicalEra: '1905 – 2016',
        openingHours: '05h00 – 20h00',
        architecturalHighlights: [
          'Architecture zen épurée rappelant les temples de Kyoto',
          'Cours silencieuses ornées de lanternes hexagonales blanches',
        ],
        audioScript: [
          'Bienvenue au monastère Khanh An, sanctuaire zen paisible surnommé le Petit Japon de Saïgon.',
        ],
      },
      zh: {
        name: '庆安禅院（西贡“小京都” · 第十二郡）',
        shortSummary:
          '第十二郡最具禅意美学的佛教寺院，红木屋檐、素白围墙与六角纸灯笼宛如京都古寺，清幽雅致极适合静心拍照。',
        historicalEra: '1905年建寺 – 2016年重修',
        openingHours: '05:00 – 20:00',
        architecturalHighlights: [
          '红木、白墙与黛瓦勾勒出极简东方禅意建筑',
          '六角白灯笼、木风铃与清幽庭院极具京都风韵',
        ],
        audioScript: [
          '欢迎来到第十二郡的庆安禅院，这里素雅清幽的木构建筑被誉为胡志明市的“小京都”。',
        ],
      },
      ja: {
        name: 'カインアン修道院（サイゴンの「リトル京都」・12区）',
        shortSummary:
          '朱塗りの木組みと白壁、六角形の紙提灯が日本の古寺を思わせる12区の禅寺院。静謐な空間と優美な建築で人気のフォトスポットです。',
        historicalEra: '1905年創建 – 2016年改修',
        openingHours: '05:00 – 20:00',
        architecturalHighlights: [
          '木造の反り屋根と白壁が織りなす京都風の禅建築',
          '六角形の白い提灯と風鈴が揺れる静かな回廊',
        ],
        audioScript: [
          '日本の古寺を思わせる静謐な佇まいで人気の12区・カインアン修道院へようこそ。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'tvka-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Kiến trúc gỗ đỏ và lồng đèn thanh tao tại Tu viện Khánh An, Quận 12',
          en: 'Kyoto-like timber roofs and lanterns at Khanh An Monastery',
          fr: 'Le monastère zen Khanh An dans le 12e arrondissement',
          zh: '第十二郡庆安禅院禅意建筑',
          ja: '12区カインアン修道院の優美な建築',
        },
        yearOrSource: 'Tu viện Khánh An · Quận 12',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-tvka-1',
        name: 'Quán Chay An Lạc & Cà Phê Vườn An Phú Đông',
        cuisine: 'Ẩm thực Chay & Cà phê Sân vườn',
        specialtyDishes: ['Bún thái chay', 'Gỏi cuốn chay', 'Cà phê sữa đá'],
        rating: 4.5,
        reviewCount: 740,
        priceRange: '30.000đ – 75.000đ',
        lat: 10.8641,
        lng: 106.6924,
        address: 'Vườn Lài, Phường An Phú Đông, Quận 12, TP.HCM',
        openHours: '06:30 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];
