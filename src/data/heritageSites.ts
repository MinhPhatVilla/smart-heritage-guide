import { HeritageSite } from '../types/heritage';

export interface CityPreset {
  id: 'Ha Noi' | 'Hue' | 'Hoi An' | 'TP.HCM';
  label: string;
  subtitle: string;
  lat: number;
  lng: number;
}

export const CITY_PRESETS: CityPreset[] = [
  {
    id: 'Ha Noi',
    label: 'Thủ đô Hà Nội',
    subtitle: 'Hoàng Thành, Văn Miếu, Hồ Gươm',
    lat: 21.0313,
    lng: 105.8412,
  },
  {
    id: 'Hue',
    label: 'Cố đô Huế',
    subtitle: 'Đại Nội Huế, Chùa Thiên Mụ',
    lat: 16.4675,
    lng: 107.5785,
  },
  {
    id: 'Hoi An',
    label: 'Phố cổ Hội An',
    subtitle: 'Chùa Cầu, Hội quán Phúc Kiến',
    lat: 15.8772,
    lng: 108.3265,
  },
  {
    id: 'TP.HCM',
    label: 'TP. Hồ Chí Minh',
    subtitle: 'Dinh Độc Lập, Bưu điện Trung tâm',
    lat: 10.7782,
    lng: 106.6968,
  },
];

export const HERITAGE_SITES: HeritageSite[] = [
  {
    id: 'hoang-thanh-thang-long',
    city: 'Ha Noi',
    lat: 21.0341,
    lng: 105.84,
    category: 'imperial',
    unescoRecognized: true,
    rating: 4.9,
    reviewCount: 4820,
    ticketPrice: '70.000 VNĐ',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Hoàng Thành Thăng Long',
        shortSummary:
          'Di sản văn hóa thế giới UNESCO gắn liền với hơn 1.000 năm lịch sử kinh đô Đại Việt qua các triều đại Lý, Trần, Lê, Nguyễn.',
        historicalEra: 'Thế kỷ XI – XIX (1010 – 1945)',
        openingHours: '08:00 – 17:00 (Thứ Ba – Chủ Nhật)',
        architecturalHighlights: [
          'Đoan Môn - Cổng chính dẫn vào Cấm thành',
          'Nền Điện Kính Thiên với đôi rồng đá thời Lê Sơ',
          'Khu khảo cổ học 18 Hoàng Diệu với tầng văn hóa xếp chồng 13 thế kỷ',
          'Hầm chỉ huy tác chiến D67 thời kháng chiến',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Khu di tích Trung tâm Hoàng Thành Thăng Long tại Hà Nội, Di sản Văn hóa Thế giới được UNESCO công nhận năm 2010.',
          'Được vua Lý Thái Tổ định đô từ năm 1010, nơi đây là trung tâm quyền lực chính trị liên tục của Đại Việt suốt hơn một thiên niên kỷ qua các triều đại Lý, Trần, Lê Sơ, Mạc và Lê Trung Hưng.',
          'Điểm nhấn kiến trúc nổi bật nhất là cổng Đoan Môn uy nghi xây bằng đá xanh và gạch vồ, dẫn thẳng tới nền Điện Kính Thiên với bậc thềm rồng đá chạm khắc tinh xảo từ thế kỷ 15.',
          'Bên cạnh đó, khu khảo cổ học 18 Hoàng Diệu đã phát lộ hàng triệu di vật gốm sứ, nền móng cung điện xếp chồng lên nhau minh chứng cho dòng chảy văn hiến Thăng Long bất tận.',
        ],
      },
      en: {
        name: 'Imperial Citadel of Thang Long',
        shortSummary:
          'A UNESCO World Heritage Site representing over 1,000 years of continuous political and cultural power in Vietnam.',
        historicalEra: '11th – 19th Century (1010 – 1945)',
        openingHours: '08:00 – 17:00 (Tue – Sun)',
        architecturalHighlights: [
          'Doan Mon - Main Southern Gate to the Forbidden City',
          'Kinh Thien Palace Foundation with 15th-century stone dragons',
          '18 Hoang Dieu Archaeological Site spanning 13 centuries',
          'D67 Revolutionary Underground Command Bunker',
        ],
        audioScript: [
          'Welcome to the Central Sector of the Imperial Citadel of Thang Long in Hanoi, recognized by UNESCO as a World Cultural Heritage Site in 2010.',
          'Established in 1010 by Emperor Ly Thai To, this citadel served as the uninterrupted political center of Dai Viet for nearly a millennium across the Ly, Tran, and Le dynasties.',
          'As you walk through the majestic five-arched Doan Mon Gate, you will reach the foundation of Kinh Thien Palace, guarded by exquisitely carved 15th-century stone dragons.',
          'Adjacent to the palace lies the 18 Hoang Dieu archaeological excavation site, where layered foundations and royal artifacts reveal thirteen centuries of vibrant history.',
        ],
      },
      fr: {
        name: 'Citadelle Impériale de Thang Long',
        shortSummary:
          'Patrimoine mondial de l’UNESCO témoignant de plus de mille ans d’histoire impériale au cœur de Hanoï.',
        historicalEra: 'XIe – XIXe siècle (1010 – 1945)',
        openingHours: '08h00 – 17h00 (Mardi – Dimanche)',
        architecturalHighlights: [
          'Porte Doan Mon menant à la Cité Pourpre Interdite',
          'Fondations du Palais Kinh Thien et ses dragons de pierre',
          'Site archéologique du 18 rue Hoang Dieu',
          'Bunker souterrain historique D67',
        ],
        audioScript: [
          'Bienvenue dans le secteur central de la Citadelle Impériale de Thang Long à Hanoï, inscrite au patrimoine mondial de l’UNESCO en 2010.',
          'Fondée en 1010 par l’empereur Ly Thai To, cette cité fut le centre politique ininterrompu du Vietnam pendant près d’un millénaire.',
          'Franchissez la porte monumentale Doan Mon pour admirer les marches du palais Kinh Thien ornées de dragons sculptés du XVe siècle.',
          'Les fouilles archéologiques voisines dévoilent des vestiges superposés illustrant treize siècles de civilisation raffinée.',
        ],
      },
      zh: {
        name: '升龙皇城遗址',
        shortSummary: '联合国教科文组织世界文化遗产，见证越南李、陈、黎等朝代逾千年的都城历史。',
        historicalEra: '11世纪至19世纪 (1010 – 1945)',
        openingHours: '08:00 – 17:00（周二至周日）',
        architecturalHighlights: [
          '端门——通往紫禁城的皇家正门',
          '敬天殿遗址与十五世纪黎初石龙御阶',
          '黄耀街18号考古遗址群',
          'D67地下军事指挥所',
        ],
        audioScript: [
          '欢迎来到河内升龙皇城中心遗址，这里于2010年被联合国教科文组织列入世界文化遗产名录。',
          '自公元1010年李太祖迁都升龙以来，这里连续一千多年作为大越国的政治与文化中心。',
          '穿过宏伟的端门五拱城门，您将看到敬天殿基址以及雕刻精美的十五世纪石龙台阶。',
          '旁边的黄耀街18号考古遗址出土了层层叠压的宫殿地基与珍贵瓷器，展现了千年古都的辉煌历史。',
        ],
      },
      ja: {
        name: 'タンロン皇城遺跡',
        shortSummary:
          '1000年以上のベトナム王朝の都としての歴史を今に伝えるユネスコ世界文化遺産です。',
        historicalEra: '11世紀〜19世紀 (1010 – 1945)',
        openingHours: '08:00 – 17:00（火曜〜日曜）',
        architecturalHighlights: [
          '端門（ドアンモン） - 紫禁城への正門',
          '敬天殿跡と15世紀の石造りの龍階段',
          'ホアンジエウ通り18番地の考古学遺跡',
          'D67地下司令部バンカー',
        ],
        audioScript: [
          'ハノイのタンロン皇城中心区域へようこそ。ここは2010年にユネスコの世界文化遺産に登録されました。',
          '1010年に李太祖が都を定めて以来、約1000年にわたりベトナムの政治と文化の中心地であり続けました。',
          '壮麗な端門をくぐると、15世紀に彫られた見事な石龍の階段が残る敬天殿の礎石へと続きます。',
          '隣接する考古学発掘現場では、何層にも重なる宮殿の遺構や陶磁器が発見され、王都の悠久の歴史を物語っています。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'httl-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Cổng Đoan Môn nhìn từ quảng trường trung tâm Hoàng Thành Thăng Long',
          en: 'Doan Mon Gate viewed from the central square of Thang Long Citadel',
          fr: 'La porte Doan Mon vue depuis l’esplanade centrale',
          zh: '从升龙皇城中央广场眺望端门',
          ja: '中央広場から望むタンロン皇城の端門',
        },
        yearOrSource: 'Tư liệu Kiến trúc Di sản Thăng Long',
      },
      {
        id: 'httl-img-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Không gian cổ kính và rêu phong của quần thể di tích ngàn năm',
          en: 'Ancient architectural heritage preserved over a millennium',
          fr: 'Architecture ancienne préservée à travers les siècles',
          zh: '千年古迹的古典建筑风貌',
          ja: '千年の時を超えて保存された古都の建築美',
        },
        yearOrSource: 'Trung tâm Bảo tồn Di sản Thăng Long - Hà Nội',
      },
      {
        id: 'httl-vid-1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=900&q=80',
        caption: {
          vi: 'Phim tài liệu: Dấu ấn 1000 năm Hoàng Thành Thăng Long & Khu khảo cổ 18 Hoàng Diệu',
          en: 'Documentary: 1000 Years of Thang Long Imperial Citadel & Archaeological Discoveries',
          fr: 'Documentaire : 1000 ans d’histoire de la Citadelle Impériale de Thang Long',
          zh: '纪录片：千年升龙皇城与考古发现',
          ja: 'ドキュメンタリー：タンロン皇城1000年の歴史と考古学の発見',
        },
        yearOrSource: 'Tư liệu Phim Lịch sử Di sản UNESCO',
        durationLabel: '03:15',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-hn-1',
        name: 'Phở Gia Truyền Bát Đàn',
        cuisine: 'Ẩm thực truyền thống Hà Nội',
        specialtyDishes: ['Phở bò tái nạm', 'Phở chín gầu', 'Quẩy giòn nóng'],
        rating: 4.8,
        reviewCount: 2340,
        priceRange: '60.000đ – 90.000đ',
        lat: 21.0335,
        lng: 105.8458,
        address: '49 Bát Đàn, Quận Hoàn Kiếm, Hà Nội',
        openHours: '06:00 – 10:00 & 18:00 – 20:30',
        imageUrl:
          'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'res-hn-2',
        name: 'Bún Chả Đắc Kim Hàng Mành',
        cuisine: 'Đặc sản Hà Nội',
        specialtyDishes: ['Bún chả nướng than hoa', 'Nem cua bể rán giòn'],
        rating: 4.7,
        reviewCount: 1890,
        priceRange: '70.000đ – 120.000đ',
        lat: 21.0322,
        lng: 105.8475,
        address: '1 Hàng Mành, Quận Hoàn Kiếm, Hà Nội',
        openHours: '08:30 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'res-hn-3',
        name: 'Chả Cá Thăng Long Đường Thành',
        cuisine: 'Đặc sản Hà Thành (Michelin Selected)',
        specialtyDishes: ['Chả cá lăng nướng nghệ thì là', 'Canh đầu cá nấu dọc mùng'],
        rating: 4.9,
        reviewCount: 1520,
        priceRange: '150.000đ – 250.000đ',
        lat: 21.0319,
        lng: 105.8451,
        address: '6B Đường Thành, Quận Hoàn Kiếm, Hà Nội',
        openHours: '10:30 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'van-mieu-quoc-tu-giam',
    city: 'Ha Noi',
    lat: 21.0285,
    lng: 105.8355,
    category: 'temple',
    unescoRecognized: true,
    rating: 4.9,
    reviewCount: 6150,
    ticketPrice: '70.000 VNĐ',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Văn Miếu – Quốc Tử Giám',
        shortSummary:
          'Trường đại học đầu tiên của Việt Nam, biểu tượng của truyền thống hiếu học với 82 bia Tiến sĩ được UNESCO công nhận là Di sản Tư liệu Thế giới.',
        historicalEra: 'Khởi dựng năm 1070 (Triều Lý Thánh Tông)',
        openingHours: '08:00 – 17:00 & Tour đêm 18:30 – 21:30',
        architecturalHighlights: [
          'Khuê Văn Các – Biểu tượng văn hóa của Thủ đô Hà Nội',
          'Vườn Bia Tiến Sĩ với 82 tấm bia đá đặt trên lưng rùa',
          'Giếng Thiên Quang phẳng lặng soi bóng cổ thụ',
          'Điện Đại Thành và Khu Thái Học',
        ],
        audioScript: [
          'Quý khách đang đứng tại Văn Miếu – Quốc Tử Giám, quần thể di tích văn hóa và giáo dục hàng đầu Việt Nam được xây dựng từ năm 1070 dưới triều vua Lý Thánh Tông.',
          'Năm 1076, vua Lý Nhân Tông cho lập Quốc Tử Giám ngay bên cạnh Văn Miếu, biến nơi đây thành trường đại học quốc gia đầu tiên đào tạo nhân tài cho đất nước.',
          'Hình ảnh nổi bật nhất tại khu di tích là Khuê Văn Các – gác văn chương tám mái duyên dáng bên giếng Thiên Quang, biểu tượng chính thức của Thủ đô Hà Nội.',
          'Hai bên giếng Thiên Quang là 82 tấm bia Tiến sĩ khắc tên các bậc hiền tài đỗ đạt từ năm 1442 đến năm 1779, được UNESCO vinh danh là Di sản Tư liệu Thế giới.',
        ],
      },
      en: {
        name: 'Temple of Literature (Van Mieu - Quoc Tu Giam)',
        shortSummary:
          'Vietnam’s first national university founded in 1070, home to the iconic Khue Van Cac pavilion and 82 UNESCO Memory of the World Doctor Steles.',
        historicalEra: 'Founded in 1070 (Ly Dynasty)',
        openingHours: '08:00 – 17:00 Daily',
        architecturalHighlights: [
          'Khue Van Cac (Pavilion of the Constellation of Literature)',
          '82 Stone Doctor Steles resting on stone tortoises',
          'Thien Quang Well (Well of Heavenly Clarity)',
          'Great Sanctuary & Imperial Academy Courtyard',
        ],
        audioScript: [
          'Welcome to the Temple of Literature and Quoc Tu Giam, built in 1070 during the reign of Emperor Ly Thanh Tong to honor scholars and sages.',
          'In 1076, Quoc Tu Giam was established here as Vietnam’s first national university, educating generations of mandarins and intellectuals.',
          'At the heart of the complex stands Khue Van Cac, the Pavilion of the Constellation of Literature, which serves as the cultural symbol of Hanoi.',
          'Flanking the tranquil Thien Quang Well are 82 stone Doctor Steles mounted on tortoises, inscribed in UNESCO’s Memory of the World Register.',
        ],
      },
      fr: {
        name: 'Temple de la Littérature (Van Mieu)',
        shortSummary:
          'Première université nationale du Vietnam fondée en 1070, célèbre pour le pavillon Khue Van Cac et ses 82 stèles des docteurs classées par l’UNESCO.',
        historicalEra: 'Fondé en 1070 (Dynastie Ly)',
        openingHours: '08h00 – 17h00 tous les jours',
        architecturalHighlights: [
          'Pavillon de la Constellation des Lettres (Khue Van Cac)',
          'Jardin des 82 stèles de pierre portées par des tortues',
          'Puits de la Clarté Céleste (Thien Quang)',
          'Cour du Grand Sanctuaire et Académie Impériale',
        ],
        audioScript: [
          'Bienvenue au Temple de la Littérature, édifié en 1070 sous l’empereur Ly Thanh Tong et devenu la première université nationale du Vietnam en 1076.',
          'Ce joyau de l’architecture traditionnelle vietnamienne s’organise autour de cinq cours successives bordées d’arbres centenaires.',
          'Admirez le pavillon Khue Van Cac, emblème culturel de Hanoï, ainsi que les 82 stèles des lauréats des concours royaux inscrites au registre Mémoire du monde de l’UNESCO.',
        ],
      },
      zh: {
        name: '河内文庙—国子监',
        shortSummary: '始建于1070年的越南第一所国立大学，拥有河内文化象征奎文阁与82通世界记忆遗产进士碑。',
        historicalEra: '始建于1070年（李朝神武二年）',
        openingHours: '08:00 – 17:00（每日开放）',
        architecturalHighlights: [
          '奎文阁——河内首都的文化标志',
          '82通石龟驮载的进士题名碑',
          '天光井与大成门庭院',
          '太学堂与国子监讲堂',
        ],
        audioScript: [
          '欢迎来到文庙—国子监。文庙始建于公元1070年李圣宗时期，1076年增设国子监，成为越南历史上第一所国立最高学府。',
          '景区采用传统五进院落布局，中心的奎文阁造型典雅，是河内市的文化象征。',
          '天光井两侧陈列着82通黎朝至莫朝的进士碑，记录了数百位科举状元与进士的姓名，已被联合国教科文组织列入《世界记忆名录》。',
        ],
      },
      ja: {
        name: '文廟・国子監（バンミエウ）',
        shortSummary:
          '1070年に創建されたベトナム最古の国立大学。ハノイの象徴である奎文閣と82基の進士碑で知られています。',
        historicalEra: '1070年創建（李朝時代）',
        openingHours: '08:00 – 17:00（年中無休）',
        architecturalHighlights: [
          '奎文閣（クエバンカック） - ハノイの文化シンボル',
          'ユネスコ世界の記憶に登録された82基の進士石碑',
          '天光井（ティエンクアン池）',
          '大成殿と太学エリア',
        ],
        audioScript: [
          '文廟・国子監へようこそ。ここは1070年に建立され、1076年にはベトナム初の国立大学である国子監が設けられました。',
          '五つの美しい中庭が連なる境内の中央には、ハノイの象徴として知られる朱塗りの楼閣「奎文閣」が佇んでいます。',
          '天光井の両側に並ぶ亀の背に乗った82基の進士碑は、科挙の合格者の名を刻んだ貴重な歴史資料としてユネスコ「世界の記憶」に登録されています。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'vm-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Khuê Văn Các cổ kính soi bóng bên Giếng Thiên Quang',
          en: 'Khue Van Cac Pavilion reflected in the Thien Quang Well',
          fr: 'Le pavillon Khue Van Cac se reflétant dans le puits Thien Quang',
          zh: '倒映在天光井中的奎文阁',
          ja: '天光井に映る奎文閣の美しい姿',
        },
        yearOrSource: 'Trung tâm Hoạt động VHKH Văn Miếu – Quốc Tử Giám',
      },
      {
        id: 'vm-vid-1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=900&q=80',
        caption: {
          vi: 'Tư liệu: 82 Bia Tiến sĩ Văn Miếu và truyền thống khoa bảng Việt Nam',
          en: 'Documentary: The 82 Doctor Steles and Vietnam’s Imperial Examination Heritage',
          fr: 'Documentaire : Les 82 stèles des docteurs et la tradition académique',
          zh: '纪录片：文庙82通进士碑与科举传统',
          ja: 'ドキュメンタリー：82基の進士碑とベトナムの科挙の歴史',
        },
        yearOrSource: 'Hồ sơ Di sản Tư liệu UNESCO',
        durationLabel: '02:45',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-vm-1',
        name: 'KOTO Van Mieu Training Restaurant',
        cuisine: 'Ẩm thực Việt – Á Đương đại',
        specialtyDishes: ['Nem tươi cuốn tôm thịt', 'Bò lúc lắc tiêu xanh', 'Cà phê trứng Hà Nội'],
        rating: 4.8,
        reviewCount: 1680,
        priceRange: '120.000đ – 250.000đ',
        lat: 21.0279,
        lng: 105.8348,
        address: '59 Văn Miếu, Quận Đống Đa, Hà Nội',
        openHours: '07:30 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'res-vm-2',
        name: 'Bún Cá Sâm Cây Si (Gần Văn Miếu)',
        cuisine: 'Đặc sản Hà Nội',
        specialtyDishes: ['Bún cá rô đồng giòn', 'Chả cá cuốn thịt dọc mùng'],
        rating: 4.6,
        reviewCount: 940,
        priceRange: '50.000đ – 75.000đ',
        lat: 21.0294,
        lng: 105.8372,
        address: 'Ngõ Tôn Đức Thắng, Quận Đống Đa, Hà Nội',
        openHours: '07:00 – 20:00',
        imageUrl:
          'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'ho-hoan-kiem-den-ngoc-son',
    city: 'Ha Noi',
    lat: 21.0307,
    lng: 105.8524,
    category: 'monument',
    unescoRecognized: false,
    rating: 4.9,
    reviewCount: 8420,
    ticketPrice: '30.000 VNĐ (Đền Ngọc Sơn)',
    coverImage:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Hồ Hoàn Kiếm & Đền Ngọc Sơn',
        shortSummary:
          'Trái tim của Thủ đô Hà Nội gắn với truyền thuyết vua Lê Thái Tổ trả gươm báu thần Kim Quy, nổi bật với Tháp Rùa, cầu Thê Húc và Tháp Bút.',
        historicalEra: 'Thế kỷ XV – XIX',
        openingHours: 'Mở cửa cả ngày (Đền Ngọc Sơn: 07:00 – 18:00)',
        architecturalHighlights: [
          'Tháp Rùa cổ kính giữa làn nước xanh lục bảo',
          'Cầu Thê Húc đỏ son – Nơi đậu lại ánh nắng ban mai',
          'Tháp Bút "Tả Thanh Thiên" (Viết lên trời xanh) và Đài Nghiên',
          'Đền Ngọc Sơn thờ Hưng Đạo Đại Vương Trần Quốc Toản và Văn Xương Đế Quân',
        ],
        audioScript: [
          'Chào mừng bạn đến với Hồ Hoàn Kiếm và Đền Ngọc Sơn, viên ngọc xanh nằm ngay trung tâm lịch sử của Thủ đô Hà Nội.',
          'Tên gọi Hoàn Kiếm bắt nguồn từ truyền thuyết đầu thế kỷ 15, khi vua Lê Lợi sau khi đánh đuổi quân Minh đã trao trả thanh gươm Thuận Thiên cho Rùa Vàng trên mặt hồ này.',
          'Bước qua chiếc cầu Thê Húc màu đỏ son uốn cong như dải lụa đón ánh mặt trời buổi sớm, quý khách sẽ tiến vào đảo Ngọc, nơi tọa lạc Đền Ngọc Sơn cổ kính.',
          'Ngay lối vào là Tháp Bút vươn cao với ba chữ Hán "Tả Thanh Thiên" nghĩa là viết lên trời xanh, thể hiện khí phách và trí tuệ của người Việt.',
        ],
      },
      en: {
        name: 'Hoan Kiem Lake & Ngoc Son Temple',
        shortSummary:
          'The cultural heart of Hanoi linked to the legend of Emperor Le Loi returning the sacred sword to the Golden Turtle God.',
        historicalEra: '15th – 19th Century',
        openingHours: '07:00 – 18:00 Daily',
        architecturalHighlights: [
          'Turtle Tower (Thap Rua) on a small islet in the lake',
          'Crimson-painted The Huc Bridge (Bridge of Morning Sunlight)',
          'Pen Tower (Thap But) inscribed with "Writing on the Blue Sky"',
          'Ngoc Son Temple on Jade Island',
        ],
        audioScript: [
          'Welcome to Hoan Kiem Lake and Ngoc Son Temple, the scenic and spiritual heart of Hanoi.',
          'The name Hoan Kiem means Lake of the Returned Sword, honoring the 15th-century legend in which Emperor Le Loi returned his magic sword to the Golden Turtle deity after liberating the country.',
          'Crossing the vibrant red The Huc Bridge, whose name means Perch of the Morning Sunbeam, brings you to Jade Island and Ngoc Son Temple.',
        ],
      },
      fr: {
        name: 'Lac Hoan Kiem et Temple Ngoc Son',
        shortSummary:
          'Le cœur historique de Hanoï lié à la légende de l’Épée Restituée, célèbre pour son pont rouge The Huc et la Tour de la Tortue.',
        historicalEra: 'XVe – XIXe siècle',
        openingHours: '07h00 – 18h00 tous les jours',
        architecturalHighlights: [
          'Tour de la Tortue au milieu du lac',
          'Pont rouge The Huc (Pont du Soleil Levant)',
          'Tour du Pinceau et Temple de la Montagne de Jade',
        ],
        audioScript: [
          'Bienvenue au lac Hoan Kiem, le lac de l’Épée Restituée, véritable joyau au cœur de Hanoï.',
          'Selon la légende du XVe siècle, l’empereur Le Loi y rendit son épée sacrée à la Tortue d’Or après la victoire pour l’indépendance.',
          'Empruntez le célèbre pont rouge The Huc pour visiter le temple Ngoc Son sur l’île de Jade.',
        ],
      },
      zh: {
        name: '还剑湖与玉山祠',
        shortSummary: '河内市中心的明珠，承载黎太祖归还顺天宝剑的神话传说，以栖旭桥、笔塔与龟塔闻名。',
        historicalEra: '15世纪至19世纪',
        openingHours: '07:00 – 18:00',
        architecturalHighlights: ['湖心古朴的龟塔', '朱红色的栖旭桥', '刻有“写青天”三字的笔塔与砚台'],
        audioScript: [
          '欢迎来到河内心脏地带的还剑湖与玉山祠。',
          '相传十五世纪初，黎利皇帝击退明军后泛舟湖上，神龟浮出水面取回顺天宝剑，此湖便得名“还剑湖”。',
          '走过意为“凝聚朝阳”的红色木桥栖旭桥，即可抵达玉岛上的古刹玉山祠。',
        ],
      },
      ja: {
        name: 'ホアンキエム湖と玉山祠（ゴックソン祠）',
        shortSummary:
          'レ・ロイ王が神亀に宝剣を返した伝説が残るハノイの中心湖。朱塗りの棲旭橋と亀の塔が象徴です。',
        historicalEra: '15世紀〜19世紀',
        openingHours: '07:00 – 18:00',
        architecturalHighlights: ['湖の中央に浮かぶ亀の塔', '朝日の宿る朱塗りの棲旭橋（テーフック橋）', '青空に書くという意味の筆塔'],
        audioScript: [
          'ハノイの心のふるさと、ホアンキエム湖と玉山祠へようこそ。',
          '15世紀、レ・ロイ王が国を平定した後に黄金の亀へ宝剣を返したという伝説から「還剣湖」と名付けられました。',
          '鮮やかな赤い棲旭橋を渡ると、翡翠の島に建つ歴史ある玉山祠へと入ることができます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'hk-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Cầu Thê Húc và mặt hồ Hoàn Kiếm rực rỡ trong nắng sớm',
          en: 'The Huc Bridge and Hoan Kiem Lake in the morning light',
          fr: 'Le pont The Huc et le lac Hoan Kiem au lever du soleil',
          zh: '晨光中的还剑湖与栖旭桥',
          ja: '朝日に輝くホアンキエム湖と棲旭橋',
        },
        yearOrSource: 'Tư liệu Di sản Hồ Gươm',
      },
      {
        id: 'hk-vid-1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80',
        caption: {
          vi: 'Video tài liệu: Huyền thoại Hồ Gươm và kiến trúc Đền Ngọc Sơn',
          en: 'Documentary: Legend of the Returned Sword and Ngoc Son Temple',
          fr: 'Documentaire : La légende du lac Hoan Kiem',
          zh: '纪录片：还剑湖传说与玉山祠建筑艺术',
          ja: 'ドキュメンタリー：ホアンキエム湖の伝説と玉山祠',
        },
        yearOrSource: 'Kho Tư liệu Văn hóa Thăng Long',
        durationLabel: '01:58',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-hk-1',
        name: 'Cà Phê Giảng (Cà Phê Trứng Nguyên Bản 1946)',
        cuisine: 'Thức uống di sản Hà Nội',
        specialtyDishes: ['Cà phê trứng nóng/đá', 'Cacao trứng kem bông'],
        rating: 4.9,
        reviewCount: 5410,
        priceRange: '40.000đ – 65.000đ',
        lat: 21.0332,
        lng: 105.8541,
        address: '39 Nguyễn Hữu Huân, Quận Hoàn Kiếm, Hà Nội',
        openHours: '07:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'res-hk-2',
        name: 'Bún Thang Bà Đức Cầu Gỗ',
        cuisine: 'Ẩm thực tinh hoa Phố Cổ',
        specialtyDishes: ['Bún thang Hà Nội 20 nguyên liệu', 'Nem cuốn tôm thịt'],
        rating: 4.7,
        reviewCount: 1120,
        priceRange: '55.000đ – 85.000đ',
        lat: 21.0321,
        lng: 105.8529,
        address: '48 Cầu Gỗ, Quận Hoàn Kiếm, Hà Nội',
        openHours: '11:00 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'dai-noi-hue',
    city: 'Hue',
    lat: 16.4698,
    lng: 107.5776,
    category: 'imperial',
    unescoRecognized: true,
    rating: 4.9,
    reviewCount: 7340,
    ticketPrice: '200.000 VNĐ',
    coverImage:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Quần thể Đại Nội Huế (Hoàng Thành & Tử Cấm Thành)',
        shortSummary:
          'Kinh đô tráng lệ của triều đại nhà Nguyễn suốt 143 năm, Di sản Văn hóa Thế giới đầu tiên của Việt Nam được UNESCO vinh danh năm 1993.',
        historicalEra: '1802 – 1945 (Triều Nguyễn)',
        openingHours: '07:00 – 17:30 (Có mở cửa Đại Nội về đêm)',
        architecturalHighlights: [
          'Ngọ Môn – Cổng chính uy nghiêm của Hoàng Thành Huế',
          'Điện Thái Hòa – Nơi cử hành đại lễ thiết triều',
          'Thế Tổ Miếu & Hiển Lâm Các cùng Cửu Đỉnh đúc bằng đồng',
          'Duyệt Thị Đường – Nhà hát Nhã nhạc Cung đình Huế',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Đại Nội Huế, trung tâm của Quần thể Di tích Cố đô Huế được UNESCO công nhận là Di sản Văn hóa Thế giới năm 1993.',
          'Khởi công từ năm 1804 dưới thời vua Gia Long, Hoàng Thành và Tử Cấm Thành Huế là nơi sinh sống và làm việc của 13 vị vua triều Nguyễn.',
          'Trước mắt quý khách là Ngọ Môn với lầu Ngũ Phụng nguy nga, dẫn qua cầu Trung Đạo bắc trên hồ Thái Dịch để tiến vào Điện Thái Hòa sơn son thếp vàng lộng lẫy.',
          'Tại đây, quý khách còn được thưởng thức Nhã nhạc cung đình Huế – Kiệt tác truyền khẩu và phi vật thể của nhân loại tại nhà hát cổ Duyệt Thị Đường.',
        ],
      },
      en: {
        name: 'Hue Imperial City (The Citadel)',
        shortSummary:
          'The majestic royal seat of the Nguyen Dynasty emperors from 1802 to 1945, Vietnam’s first UNESCO World Heritage Site.',
        historicalEra: '1802 – 1945 (Nguyen Dynasty)',
        openingHours: '07:00 – 17:30 Daily',
        architecturalHighlights: [
          'Ngo Mon (Noon Gate) and Five-Phoenix Pavilion',
          'Thai Hoa Palace (Palace of Supreme Harmony)',
          'The Mieu Temple and the Nine Dynastic Urns',
          'Duyet Thi Duong Royal Theater',
        ],
        audioScript: [
          'Welcome to the Imperial City of Hue, the political and cultural capital of Vietnam under the Nguyen Dynasty from 1802 to 1945.',
          'Stepping through the grand Noon Gate, or Ngo Mon, you cross the Golden Water Bridge over lotus ponds into the Palace of Supreme Harmony.',
          'Every hall, courtyard, and garden in the Citadel was designed in harmony with royal feng shui principles and traditional Vietnamese artistry.',
        ],
      },
      fr: {
        name: 'Cité Impériale de Hué (Dai Noi)',
        shortSummary:
          'L’ancienne capitale impériale de la dynastie Nguyen (1802-1945), premier site vietnamien classé au patrimoine mondial de l’UNESCO.',
        historicalEra: '1802 – 1945 (Dynastie Nguyen)',
        openingHours: '07h00 – 17h30 tous les jours',
        architecturalHighlights: [
          'Porte du Midi (Ngo Mon) et Pavillon des Cinq Phénix',
          'Palais de l’Harmonie Suprême (Thai Hoa)',
          'Temple The Mieu et les Neuf Urnes Dynastiques',
        ],
        audioScript: [
          'Bienvenue dans la Cité Impériale de Hué, inscrite au patrimoine mondial de l’UNESCO dès 1993.',
          'Résidence des treize empereurs de la dynastie Nguyen, cet ensemble monumental réunit la Porte du Midi, le Palais Thai Hoa et la Cité Pourpre Interdite.',
        ],
      },
      zh: {
        name: '顺化皇城（大内）',
        shortSummary: '阮朝十三代皇帝的皇宫紫禁城（1802–1945），越南首个联合国教科文组织世界文化遗产。',
        historicalEra: '1802 – 1945年（阮朝）',
        openingHours: '07:00 – 17:30',
        architecturalHighlights: ['午门与五凤楼', '太和殿皇家朝堂', '世祖庙与九鼎', '阅是堂皇家剧院'],
        audioScript: [
          '欢迎来到顺化皇城大内，这里于1993年成为越南首个世界文化遗产。',
          '自嘉隆皇帝定都顺化起，这里曾是阮朝十三位皇帝处理朝政与生活的皇家禁地，午门与太和殿展现出东方宫廷建筑的庄严气象。',
        ],
      },
      ja: {
        name: 'フエ王宮（ダイノイ）',
        shortSummary:
          '1802年から1945年まで続いたグエン朝の王宮。ベトナム初の世界文化遺産に登録された壮麗な歴史建造物群です。',
        historicalEra: '1802年〜1945年（阮朝時代）',
        openingHours: '07:00 – 17:30',
        architecturalHighlights: ['午門（ゴモン）と五鳳楼', '太和殿（タイホア殿）', '世廟と九鼎', '閲是堂（王立劇場）'],
        audioScript: [
          '古都フエの王宮へようこそ。1993年にベトナムで初めてユネスコの世界文化遺産に登録されました。',
          '壮大な午門をくぐり太和殿へと進むと、グエン朝143年間の宮廷文化と建築の粋を体感することができます。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'hue-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Ngọ Môn và Lầu Ngũ Phụng uy nghiêm trước Hoàng Thành Huế',
          en: 'Ngo Mon Gate and Five-Phoenix Pavilion of Hue Imperial City',
          fr: 'Porte du Midi et Pavillon des Cinq Phénix à Hué',
          zh: '顺化皇城午门与五凤楼',
          ja: 'フエ王宮の午門と五鳳楼',
        },
        yearOrSource: 'Trung tâm Bảo tồn Di tích Cố đô Huế',
      },
      {
        id: 'hue-vid-1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=80',
        caption: {
          vi: 'Tư liệu: Kiến trúc Cung đình Huế và Nhã nhạc Cung đình',
          en: 'Documentary: Royal Architecture and Court Music of Hue',
          fr: 'Documentaire : Architecture impériale et musique de cour de Hué',
          zh: '纪录片：顺化宫廷建筑与雅乐',
          ja: 'ドキュメンタリー：フエ王宮建築と宮廷雅楽',
        },
        yearOrSource: 'Tư liệu Di sản Cố đô Huế',
        durationLabel: '02:30',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-hue-1',
        name: 'Bún Bò Huế Mệ Kéo',
        cuisine: 'Đặc sản Cố đô Huế',
        specialtyDishes: ['Bún bò Huế giò heo chả cua', 'Nước dùng mắm ruốc sả thơm lừng'],
        rating: 4.8,
        reviewCount: 1950,
        priceRange: '45.000đ – 65.000đ',
        lat: 16.4728,
        lng: 107.5852,
        address: '20 Bạch Đằng, Phú Cát, TP. Huế',
        openHours: '06:00 – 11:00',
        imageUrl:
          'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'res-hue-2',
        name: 'Bánh Bèo Nậm Lọc Bà Đỏ',
        cuisine: 'Bánh truyền thống Cung đình Huế',
        specialtyDishes: ['Bánh bèo chén tôm cháy', 'Bánh nậm lá dong', 'Bánh lọc gói', 'Nem lụi Huế'],
        rating: 4.7,
        reviewCount: 1430,
        priceRange: '50.000đ – 100.000đ',
        lat: 16.4651,
        lng: 107.5831,
        address: '8 Nguyễn Bỉnh Khiêm, TP. Huế',
        openHours: '08:00 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'chua-cau-hoi-an',
    city: 'Hoi An',
    lat: 15.8771,
    lng: 108.3261,
    category: 'ancient_town',
    unescoRecognized: true,
    rating: 4.9,
    reviewCount: 9120,
    ticketPrice: '80.000 VNĐ – 120.000 VNĐ',
    coverImage:
      'https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Chùa Cầu & Phố Cổ Hội An',
        shortSummary:
          'Biểu tượng giao thoa văn hóa Việt – Nhật – Hoa hơn 400 năm tuổi tại thương cảng cổ Hội An, Di sản Văn hóa Thế giới UNESCO.',
        historicalEra: 'Đầu thế kỷ XVII',
        openingHours: '07:00 – 21:30 Hàng ngày',
        architecturalHighlights: [
          'Kiến trúc "Thượng gia hạ kiều" (Trên là nhà, dưới là cầu)',
          'Miếu thờ Bắc Đế Trấn Vũ bảo hộ cư dân phố cảng',
          'Đôi tượng Linh Khuyển và Linh Hầu bằng gỗ ở hai đầu cầu',
          'Phố đèn lồng rực rỡ dọc dòng sông Hoài',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Chùa Cầu, viên ngọc kiến trúc nằm ở trung tâm Đô thị cổ Hội An được UNESCO công nhận là Di sản Văn hóa Thế giới năm 1999.',
          'Được các thương nhân Nhật Bản khởi dựng vào đầu thế kỷ 17 và trùng tu qua nhiều thế hệ người Việt và người Hoa, công trình mang kiến trúc độc đáo "Thượng gia hạ kiều" – trên là chùa, dưới là cầu gỗ bắc qua nhánh sông Thu Bồn.',
          'Bên trong Chùa Cầu thờ Bắc Đế Trấn Vũ, vị thần trị thủy mang lại bình an cho thương cảng sầm uất một thời.',
        ],
      },
      en: {
        name: 'Japanese Covered Bridge & Hoi An Ancient Town',
        shortSummary:
          'A 17th-century architectural gem symbolizing cultural harmony in the UNESCO World Heritage trading port of Hoi An.',
        historicalEra: 'Early 17th Century',
        openingHours: '07:00 – 21:30 Daily',
        architecturalHighlights: [
          'Unique wooden bridge-pagoda architecture',
          'Shrine of Tran Vu protecting the town from floods',
          'Guardian Monkey and Dog wooden statues marking construction years',
        ],
        audioScript: [
          'Welcome to the iconic Japanese Covered Bridge in Hoi An Ancient Town, a UNESCO World Heritage Site since 1999.',
          'Built in the early 17th century by Japanese merchants and preserved by Vietnamese and Chinese artisans, this wooden bridge features an integrated temple roof.',
        ],
      },
      fr: {
        name: 'Pont-Pagode Japonais & Vieille Ville de Hoi An',
        shortSummary:
          'Emblème architectural du XVIIe siècle au cœur de l’ancien port marchand de Hoi An classé par l’UNESCO.',
        historicalEra: 'Début du XVIIe siècle',
        openingHours: '07h00 – 21h30',
        architecturalHighlights: [
          'Architecture « maison au-dessus, pont en dessous »',
          'Sanctuaire de Tran Vu et statues gardiennes du Singe et du Chien',
        ],
        audioScript: [
          'Bienvenue au Pont-Pagode Japonais, joyau de la vieille ville de Hoi An inscrite au patrimoine mondial de l’UNESCO.',
          'Édifié au début du XVIIe siècle, ce pont couvert en bois témoigne des échanges florissants entre le Vietnam, le Japon et la Chine.',
        ],
      },
      zh: {
        name: '会安古镇与来远桥（日本廊桥）',
        shortSummary: '十七世纪初建造的独特廊桥古刹，象征会安世界文化遗产古港的多元文化交融。',
        historicalEra: '17世纪初',
        openingHours: '07:00 – 21:30',
        architecturalHighlights: ['“上屋下桥”的独特木构建筑', '供奉北帝镇武的古祠', '桥头守护的石猴与石狗雕像'],
        audioScript: [
          '欢迎来到会安古镇标志性建筑——来远桥（又名日本桥）。',
          '这座建于十七世纪初的廊桥采用“上屋下桥”结构，见证了昔日国际商港中日越文化的交汇与繁荣。',
        ],
      },
      ja: {
        name: '来遠橋（日本橋）とホイアン旧市街',
        shortSummary:
          '17世紀初頭に日本人町と中華街を結ぶために架けられた屋根付き橋。ユネスコ世界遺産ホイアンの象徴です。',
        historicalEra: '17世紀初頭（江戸時代初期）',
        openingHours: '07:00 – 21:30',
        architecturalHighlights: [
          '橋と祠が一体となった独自の木造建築',
          '両端を守る申（サル）と戌（イヌ）の木彫像',
          'ランタンが彩るホイアン旧市街の街並み',
        ],
        audioScript: [
          'ユネスコ世界遺産・ホイアン旧市街の象徴である来遠橋（日本橋）へようこそ。',
          '17世紀初頭、朱印船貿易の時代に日本人によって架けられたこの屋根付き橋は、日本とベトナムの歴史的な絆を今に伝えています。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'ha-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Phố cổ Hội An lung linh ánh đèn lồng bên dòng sông Hoài',
          en: 'Lantern-lit streets of Hoi An Ancient Town along the Hoai River',
          fr: 'Les lanternes de la vieille ville de Hoi An au bord de la rivière Hoai',
          zh: '怀河畔灯火辉煌的会安古镇',
          ja: 'ホアイ川沿いにランタンが灯るホイアン旧市街',
        },
        yearOrSource: 'Trung tâm Quản lý Bảo tồn Di sản Văn hóa Hội An',
      },
      {
        id: 'ha-vid-1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=900&q=80',
        caption: {
          vi: 'Tư liệu: Thương cảng Hội An và kiến trúc Chùa Cầu 400 năm',
          en: 'Documentary: Hoi An Trading Port & 400 Years of the Covered Bridge',
          fr: 'Documentaire : Le port marchand de Hoi An et le Pont-Pagode',
          zh: '纪录片：会安古商港与来远桥四百年历史',
          ja: 'ドキュメンタリー：交易港ホイアンと来遠橋400年の歴史',
        },
        yearOrSource: 'Tư liệu Di sản Văn hóa Hội An',
        durationLabel: '02:10',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-ha-1',
        name: 'Bánh Mì Phượng Hội An',
        cuisine: 'Ẩm thực đường phố Hội An',
        specialtyDishes: ['Bánh mì thập cẩm pate xá xíu', 'Bánh mì thịt nướng sốt gia truyền'],
        rating: 4.8,
        reviewCount: 6420,
        priceRange: '25.000đ – 40.000đ',
        lat: 15.8788,
        lng: 108.3318,
        address: '2B Phan Chu Trinh, TP. Hội An',
        openHours: '06:30 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'res-ha-2',
        name: 'Cao Lầu Thanh & Cơm Gà Phố Hội',
        cuisine: 'Đặc sản Hội An',
        specialtyDishes: ['Cao lầu thịt xá xíu tóp mỡ giòn', 'Cơm gà xé Hội An', 'Hoành thánh chiên'],
        rating: 4.8,
        reviewCount: 2150,
        priceRange: '40.000đ – 70.000đ',
        lat: 15.8795,
        lng: 108.3282,
        address: '26 Thái Phiên, Phường Minh An, Hội An',
        openHours: '07:00 – 19:30',
        imageUrl:
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'dinh-doc-lap',
    city: 'TP.HCM',
    lat: 10.777,
    lng: 106.6953,
    category: 'monument',
    unescoRecognized: false,
    rating: 4.8,
    reviewCount: 7850,
    ticketPrice: '40.000 VNĐ – 65.000 VNĐ',
    coverImage:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Di tích Lịch sử Dinh Độc Lập (Hội trường Thống Nhất)',
        shortSummary:
          'Di tích quốc gia đặc biệt gắn liền với dấu mốc lịch sử thống nhất đất nước ngày 30/4/1975 và là kiệt tác kiến trúc hiện đại của KTS Ngô Viết Thụ.',
        historicalEra: '1868 – 1966 – 1975',
        openingHours: '08:00 – 15:30 Hàng ngày',
        architecturalHighlights: [
          'Mặt tiền rèm hoa đá cách điệu đốt trúc truyền thống Á Đông',
          'Phòng Khánh Tiết, Phòng Nội Các và Hầm chỉ huy thông tin',
          'Chiếc xe tăng 390 và 843 nguyên bản trưng bày trong khuôn viên',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Di tích Quốc gia Đặc biệt Dinh Độc Lập tại trung tâm Thành phố Hồ Chí Minh.',
          'Công trình hiện tại được thiết kế bởi kiến trúc sư Ngô Viết Thụ – người châu Á đầu tiên đạt giải Khôi nguyên La Mã, kết hợp hài hòa kiến trúc hiện đại với triết lý phương Đông qua các chữ Cát, Khẩu, Trung, Hưng.',
          'Ngày 30 tháng 4 năm 1975, nơi đây đã đi vào lịch sử dân tộc khi đoàn xe tăng Quân Giải phóng tiến qua cổng chính, mở ra kỷ nguyên hòa bình và thống nhất đất nước.',
        ],
      },
      en: {
        name: 'Independence Palace (Reunification Palace)',
        shortSummary:
          'A Special National Historical Monument marking the reunification of Vietnam on April 30, 1975, designed by famed architect Ngo Viet Thu.',
        historicalEra: '1868 – 1966 – 1975',
        openingHours: '08:00 – 15:30 Daily',
        architecturalHighlights: [
          'Bamboo-inspired modernist stone facade by Ngo Viet Thu',
          'Presidential Cabinet Room, Banquet Hall, and Underground Command Bunker',
          'Historic Tanks 390 and 843 on the palace lawn',
        ],
        audioScript: [
          'Welcome to the Independence Palace, also known as the Reunification Palace, in the heart of Ho Chi Minh City.',
          'Designed by Prix de Rome laureate architect Ngo Viet Thu and completed in 1966, the palace blends mid-century modernism with traditional Eastern symbolism.',
          'Inside, visitors can explore the preserved cabinet rooms, banquet halls, and the underground communications bunker.',
        ],
      },
      fr: {
        name: 'Palais de la Réunification (Palais de l’Indépendance)',
        shortSummary:
          'Monument historique majeur de Hô Chi Minh-Ville et chef-d’œuvre moderniste conçu par l’architecte Ngo Viet Thu.',
        historicalEra: '1868 – 1966 – 1975',
        openingHours: '08h00 – 15h30',
        architecturalHighlights: [
          'Façade brise-soleil en pierre inspirée des tiges de bambou',
          'Salles de réception, cabinet et bunker souterrain de commandement',
        ],
        audioScript: [
          'Bienvenue au Palais de la Réunification au cœur de Hô Chi Minh-Ville.',
          'Dessiné par l’architecte Ngo Viet Thu, Grand Prix de Rome, cet édifice emblématique fut le théâtre de la réunification du Vietnam le 30 avril 1975.',
        ],
      },
      zh: {
        name: '胡志明市独立宫（统一宫）',
        shortSummary: '越南特别国家级历史遗迹，由著名建筑师吴日树设计，见证1975年4月30日国家统一的历史时刻。',
        historicalEra: '1868 – 1966 – 1975',
        openingHours: '08:00 – 15:30',
        architecturalHighlights: ['竹节造型的现代主义石雕外墙', '内阁会议厅、宴会厅与地下指挥中心', '草坪上陈列的843号与390号历史坦克'],
        audioScript: [
          '欢迎来到位于胡志明市中心的国家级特别历史遗迹——独立宫（统一宫）。',
          '建筑由曾获罗马大奖的越南建筑师吴日树主持设计，巧妙融合西方现代建筑技术与东方传统吉祥寓意。',
        ],
      },
      ja: {
        name: '統一会堂（旧独立宮殿）',
        shortSummary:
          '1975年4月30日のベトナム南北統一の歴史的舞台となった、建築家ゴ・ヴィエット・トゥー設計の名建築です。',
        historicalEra: '1868年 – 1966年 – 1975年',
        openingHours: '08:00 – 15:30',
        architecturalHighlights: ['竹の節をモチーフにした優美なファサード', '内閣会議室、大宴会場、地下司令室', '前庭に展示された歴史的な843号・390号戦車'],
        audioScript: [
          'ホーチミン市中心部に位置する統一会堂へようこそ。',
          'ローマ賞を受賞した建築家ゴ・ヴィエット・トゥーによって設計され、東洋の伝統思想とモダニズム建築が美しく融合しています。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'ddl-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Toàn cảnh Dinh Độc Lập nhìn từ trục đại lộ Lê Duẩn',
          en: 'Panoramic view of the Independence Palace from Le Duan Boulevard',
          fr: 'Vue panoramique du Palais de la Réunification',
          zh: '从黎笋大道眺望独立宫全景',
          ja: 'レズアン通りから望む統一会堂の全景',
        },
        yearOrSource: 'Hội trường Thống Nhất',
      },
      {
        id: 'ddl-vid-1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80',
        caption: {
          vi: 'Phim tư liệu: Kiến trúc Ngô Viết Thụ & Dấu mốc Lịch sử tại Dinh Độc Lập',
          en: 'Documentary: Architect Ngo Viet Thu & Historical Milestones at Independence Palace',
          fr: 'Documentaire : L’architecture de Ngo Viet Thu et l’histoire du Palais',
          zh: '纪录片：吴日树建筑艺术与独立宫历史时刻',
          ja: 'ドキュメンタリー：統一会堂の建築美と歴史的瞬間',
        },
        yearOrSource: 'Tư liệu Lịch sử Quốc gia',
        durationLabel: '02:50',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-hcm-1',
        name: 'Cục Gạch Quán / Bếp Nhà Lục Tỉnh (Gần Dinh Độc Lập)',
        cuisine: 'Ẩm thực Truyền thống Nam Bộ',
        specialtyDishes: ['Cá kho tộ đất nung', 'Canh chua cá bông lau', 'Đậu hũ chiên sả ớt'],
        rating: 4.8,
        reviewCount: 2890,
        priceRange: '120.000đ – 280.000đ',
        lat: 10.7792,
        lng: 106.6978,
        address: '37 Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM',
        openHours: '10:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'res-hcm-2',
        name: 'Bánh Mì Huỳnh Hoa & Cà Phê Sài Gòn Xưa',
        cuisine: 'Ẩm thực đường phố Sài Gòn',
        specialtyDishes: ['Bánh mì đặc biệt chả lụa pate bơ', 'Cà phê sữa đá vợt Sài Gòn'],
        rating: 4.7,
        reviewCount: 4120,
        priceRange: '45.000đ – 70.000đ',
        lat: 10.7745,
        lng: 106.6932,
        address: '26 Lê Thị Riêng, Quận 1, TP.HCM',
        openHours: '06:00 – 22:00',
        imageUrl:
          'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];
