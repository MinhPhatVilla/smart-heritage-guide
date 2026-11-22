import { HeritageSite } from '../types/heritage';
import { HCM_CENTRAL_SITES } from './hcmCentralSites';
import { HCM_EXTENDED_SITES } from './hcmExtendedSites';
import { HCM_ICONIC_PHOTO_SITES } from './hcmIconicPhotoSites';
import { HCM_CULTURE_AND_SUBURBAN_SITES } from './hcmCultureAndSuburbanSites';
import { HCM_MERGED_BD_VT_SITES } from './hcmMergedBinhDuongVungTauSites';
import { HCM_VUNG_TAU_DETAILED_SITES } from './hcmVungTauDetailedSites';
import { HCM_VUNG_TAU_TOURISM_SITES } from './hcmVungTauTourismSites';
import { OVERTURE_RESTAURANTS_BY_SITE } from './overtureRestaurants';
import { WIKIPEDIA_ENRICHMENT_BY_SITE } from './wikipediaEnrichment';

export interface CityPreset {
  id: string;
  label: string;
  subtitle: string;
  lat: number;
  lng: number;
  defaultRadius: number;
}

export const CITY_PRESETS: CityPreset[] = [
  {
    id: 'ALL_HCM',
    label: 'Toàn TP. Hồ Chí Minh (Mở rộng)',
    subtitle: 'Tất cả 97 di sản, di tích & điểm du lịch TP.HCM (gồm Bình Dương, Bà Rịa – Vũng Tàu & Côn Đảo)',
    lat: 10.7775,
    lng: 106.699,
    defaultRadius: 0,
  },
  {
    id: 'QUAN_1',
    label: 'Quận 1 · Trung tâm Di sản',
    subtitle: 'Dinh Độc Lập, Nhà thờ Đức Bà, Phố đi bộ Nguyễn Huệ, Bitexco, Bến Bạch Đằng',
    lat: 10.7775,
    lng: 106.699,
    defaultRadius: 5000,
  },
  {
    id: 'QUAN_3_TAN_BINH',
    label: 'Quận 3 & Tân Bình',
    subtitle: 'Nhà thờ Tân Định, Hồ Con Rùa, Bảo tàng Chứng tích, Chùa Vĩnh Nghiêm, Chùa Giác Lâm',
    lat: 10.7815,
    lng: 106.6885,
    defaultRadius: 8000,
  },
  {
    id: 'QUAN_4_BEN_NHA_RONG',
    label: 'Quận 4 · Bến Nhà Rồng',
    subtitle: 'Bảo tàng Hồ Chí Minh, Cầu Mống & Bến cảng lịch sử sông Sài Gòn',
    lat: 10.7683,
    lng: 106.7068,
    defaultRadius: 5000,
  },
  {
    id: 'CHO_LON_QUAN_5',
    label: 'Quận 5 · Chợ Lớn',
    subtitle: 'Chùa Bà Thiên Hậu, Hội quán Nghĩa An, Hẻm Hào Sĩ Phường, Chùa Vạn Phật',
    lat: 10.7533,
    lng: 106.6612,
    defaultRadius: 6000,
  },
  {
    id: 'QUAN_6_10',
    label: 'Quận 6 & Quận 10',
    subtitle: 'Chợ Bình Tây, Bảo tàng Y học Cổ truyền FITO, Chợ hoa & Phố ẩm thực Hồ Thị Kỷ',
    lat: 10.7615,
    lng: 106.6645,
    defaultRadius: 6000,
  },
  {
    id: 'BINH_THANH_DA_KAO',
    label: 'Bình Thạnh & Đa Kao',
    subtitle: 'Lăng Ông Bà Chiểu, Landmark 81, Làng Du lịch Bình Quới, Chùa Ngọc Hoàng',
    lat: 10.7975,
    lng: 106.712,
    defaultRadius: 6000,
  },
  {
    id: 'QUAN_7_PHU_MY_HUNG',
    label: 'Quận 7 · Phú Mỹ Hưng',
    subtitle: 'Cầu Ánh Sao & Hồ Bán Nguyệt — không gian dạo bộ hiện đại khu Nam',
    lat: 10.7273,
    lng: 106.7192,
    defaultRadius: 6000,
  },
  {
    id: 'TP_THU_DUC',
    label: 'TP. Thủ Đức',
    subtitle: 'Công viên Bờ sông Thủ Thiêm, Chùa Bửu Long, Bảo tàng Áo Dài, Đền Vua Hùng',
    lat: 10.842,
    lng: 106.785,
    defaultRadius: 18000,
  },
  {
    id: 'QUAN_12',
    label: 'Quận 12 · Cửa ngõ Tây Bắc',
    subtitle: 'Tu viện Khánh An — không gian thiền viện kiến trúc Á Đông thanh tịnh',
    lat: 10.8617,
    lng: 106.6952,
    defaultRadius: 10000,
  },
  {
    id: 'CU_CHI',
    label: 'Huyện Củ Chi',
    subtitle: 'Di tích Quốc gia Đặc biệt Địa đạo Củ Chi & Đền Bến Dược',
    lat: 11.1419,
    lng: 106.4624,
    defaultRadius: 15000,
  },
  {
    id: 'CAN_GIO',
    label: 'Huyện Cần Giờ (UNESCO)',
    subtitle: 'Khu Dự trữ Sinh quyển Thế giới & Căn cứ Rừng Sác',
    lat: 10.5065,
    lng: 106.8835,
    defaultRadius: 20000,
  },
  {
    id: 'BINH_DUONG_THU_DAU_MOT',
    label: 'Bình Dương · Thủ Dầu Một & Đại Nam',
    subtitle: 'Chùa Hội Khánh, Miếu Bà Thiên Hậu, Đại Nam Văn Hiến, Nhà cổ Trần Văn Hổ, Nhà tù Phú Lợi',
    lat: 10.9803,
    lng: 106.652,
    defaultRadius: 25000,
  },
  {
    id: 'BINH_DUONG_THUAN_AN_DI_AN',
    label: 'Thuận An, Dĩ An & Bến Cát',
    subtitle: 'Chùa Núi Châu Thới, Làng gốm Lái Thiêu, Địa đạo Tam Giác Sắt',
    lat: 10.9163,
    lng: 106.755,
    defaultRadius: 25000,
  },
  {
    id: 'VUNG_TAU_LONG_SON',
    label: 'Vũng Tàu & Đảo Long Sơn',
    subtitle: 'Tháp Tam Thắng, Đồi Con Heo, Tượng Chúa Dang Tay, Bãi Sau – Bãi Trước – Bãi Dứa, Hẻm 107, Đức Mẹ Bãi Dâu, Bạch Dinh, Hải Đăng, Chợ Xóm Lưới, Marina & Long Sơn',
    lat: 10.3458,
    lng: 107.075,
    defaultRadius: 20000,
  },
  {
    id: 'BA_RIA_LONG_HAI_HO_TRAM',
    label: 'Bà Rịa, Phú Mỹ, Long Hải, Hồ Tràm & Hồ Cốc',
    subtitle: 'Hồ Đá Xanh, Đồi Cừu Suối Nghệ, Đèo Nước Ngọt – Phước Hải, Biển Hồ Cốc, Bến Lộc An, Núi Dinh, Minh Đạm, Đền Võ Thị Sáu, Dinh Cô, Hồ Tràm & Bình Châu',
    lat: 10.485,
    lng: 107.28,
    defaultRadius: 45000,
  },
  {
    id: 'CON_DAO',
    label: 'Đặc khu Côn Đảo',
    subtitle: 'Nhà tù Côn Đảo, Nghĩa trang Hàng Dương, Chùa Núi Một, Bãi Đầm Trầu & VQG Côn Đảo',
    lat: 8.693,
    lng: 106.609,
    defaultRadius: 18000,
  },
];

const ADDITIONAL_HCM_SITES: HeritageSite[] = [
  {
    id: 'chua-giac-lam-tan-binh',
    city: 'Tân Bình · TP.HCM',
    district: 'Tân Bình',
    lat: 10.7785,
    lng: 106.6494,
    category: 'temple',
    rating: 4.9,
    reviewCount: 5420,
    ticketPrice: 'Miễn phí tham quan',
    address: '565 Lạc Long Quân, Phường 10, Quận Tân Bình, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Tổ đình Giác Lâm (Ngôi chùa cổ nhất TP.HCM – 1744)',
        shortSummary:
          'Di tích Lịch sử – Văn hóa cấp Quốc gia khởi dựng năm 1744 đời chúa Nguyễn Phúc Khoát, lưu giữ 118 pho tượng cổ và hàng ngàn đĩa gốm trang trí kiến trúc chữ Tam Nam Bộ.',
        historicalEra: 'Khởi dựng năm 1744 (Hơn 280 năm tuổi)',
        openingHours: '06:00 – 19:00 Hàng ngày',
        architecturalHighlights: [
          'Kiến trúc chữ Tam truyền thống Nam Bộ gồm Chính điện, Giảng đường và Nhà trai gắn 98 cột gỗ quý khắc câu đối thếp vàng',
          '118 pho tượng cổ bằng gỗ mít và đồng, nổi bật với bộ tượng Thập Bát La Hán thế kỷ 18 – 19',
          ' hơn 7.000 chiếc đĩa gốm cổ trang trí dọc bờ nóc, vách chùa và tháp Tổ',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Tổ đình Giác Lâm tại quận Tân Bình – ngôi chùa cổ nhất của Thành phố Hồ Chí Minh được cư sĩ Lý Thụy Long khởi dựng vào mùa xuân năm Giáp Tý 1744.',
          'Đã được công nhận là Di tích Lịch sử Văn hóa cấp Quốc gia từ năm 1988, chùa Giác Lâm giữ nguyên kiến trúc chữ Tam cổ truyền của miền Nam với 98 cây cột gỗ lớn chạm khắc câu đối tinh xảo.',
          'Bên trong chùa hiện bảo tồn 118 pho tượng cổ từ thế kỷ 18 – 19 cùng hơn 7.000 chiếc đĩa gốm cổ gắn dọc theo bờ mái và các ngôi bảo tháp.',
        ],
      },
      en: {
        name: 'Giac Lam Pagoda (Oldest Temple in Ho Chi Minh City – 1744)',
        shortSummary:
          'Founded in 1744 in Tan Binh District, recognized as a National Historical-Cultural Monument with 118 antique statues and over 7,000 decorative ceramic plates.',
        historicalEra: 'Founded in 1744',
        openingHours: '06:00 – 19:00 Daily',
        architecturalHighlights: [
          'Traditional Southern Vietnamese three-hall timber layout supported by 98 carved hardwood pillars',
          '118 antique wooden and bronze statues dating back to the 18th and 19th centuries',
          'Over 7,000 antique porcelain plates embedded across roof ridges and stupas',
        ],
        audioScript: [
          'Welcome to Giac Lam Pagoda in Tan Binh District, founded in 1744 and celebrated as the oldest surviving Buddhist temple in Ho Chi Minh City.',
        ],
      },
      fr: {
        name: 'Pagode Giac Lam (La plus ancienne pagode de Saïgon – 1744)',
        shortSummary:
          'Monument historique national fondé en 1744, abritant 118 statues anciennes et plus de 7 000 assiettes en porcelaine décorative.',
        historicalEra: 'Fondée en 1744',
        openingHours: '06h00 – 19h00',
        architecturalHighlights: [
          'Architecture traditionnelle à 98 colonnes en bois précieux',
          '118 statues bouddhiques anciennes des XVIIIe et XIXe siècles',
        ],
        audioScript: [
          'Bienvenue à la pagode Giac Lam, fondée en 1744 et reconnue comme le plus ancien sanctuaire bouddhique de Hô Chi Minh-Ville.',
        ],
      },
      zh: {
        name: '觉林寺（胡志明市最古老佛寺 · 1744年）',
        shortSummary: '始建于1744年的西贡最古老寺院，国家级历史文化遗迹，珍藏118尊古佛像与七千余件嵌瓷古盘。',
        historicalEra: '始建于1744年',
        openingHours: '06:00 – 19:00',
        architecturalHighlights: ['98根名贵硬木楹联柱支撑的南越传统三进殿堂', '118尊十八至十九世纪菠萝蜜木雕古佛像', '镶嵌在屋脊与佛塔上的七千余只古瓷盘'],
        audioScript: [
          '欢迎来到位于新平郡的觉林祖庭，这座始建于1744年的古刹是胡志明市历史最悠久的佛教寺院。',
        ],
      },
      ja: {
        name: 'ザックラム寺（覚林寺・ホーチミン市最古の寺院 1744年）',
        shortSummary:
          '1744年に創建されたホーチミン市最古の仏教寺院。118体の古仏像と7,000枚以上の古陶磁器皿による装飾で知られる国家歴史文化遺跡です。',
        historicalEra: '1744年創建',
        openingHours: '06:00 – 19:00',
        architecturalHighlights: ['98本の銘木柱が支える南部伝統建築', '18〜19世紀の118体の木彫仏像群と七重の仏塔'],
        audioScript: [
          '1744年に創建されたホーチミン市最古の寺院、ザックラム寺へようこそ。国家歴史文化遺跡に指定されています。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'cgl-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Bảo tháp Xá Lợi 7 tầng và mái chùa cổ kính tại Tổ đình Giác Lâm (1744)',
          en: 'Seven-story stupa and historic halls of Giac Lam Pagoda (1744)',
          fr: 'Stupa à sept étages de la pagode Giac Lam',
          zh: '觉林寺七层舍利宝塔与古殿',
          ja: 'ザックラム寺の七重塔と本堂',
        },
        yearOrSource: 'Di tích Lịch sử Văn hóa Quốc gia (1988)',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cgl-1',
        name: 'Nhà hàng Chay Giác Lâm & Hủ Tiếu Nam Vang Lạc Long Quân',
        cuisine: 'Ẩm thực Chay & Đặc sản Sài Gòn',
        specialtyDishes: ['Bún huế chay nấm mối', 'Gỏi ngó sen chay', 'Hủ tiếu khô tôm thịt'],
        rating: 4.7,
        reviewCount: 1580,
        priceRange: '35.000đ – 85.000đ',
        lat: 10.7798,
        lng: 106.6512,
        address: 'Lạc Long Quân, Phường 10, Quận Tân Bình, TP.HCM',
        openHours: '06:30 – 21:00',
        imageUrl:
          'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'chua-vinh-nghiem-quan-3',
    city: 'Quận 3 · TP.HCM',
    district: 'Quận 3',
    lat: 10.7891,
    lng: 106.6835,
    category: 'temple',
    rating: 4.9,
    reviewCount: 8920,
    ticketPrice: 'Miễn phí tham quan',
    address: '339 Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, Quận 3, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Chùa Vĩnh Nghiêm & Bảo tháp Đá Quán Thế Âm (Quận 3)',
        shortSummary:
          'Danh lam cổ tự kết hợp kiến trúc Phật giáo Bắc tông truyền thống và kỹ thuật bê tông hiện đại của KTS Nguyễn Bá Lăng (1964 – 1971), sở hữu Bảo tháp Đá cao nhất Việt Nam.',
        historicalEra: '1964 – 1971 (KTS Nguyễn Bá Lăng)',
        openingHours: '06:00 – 20:00 Hàng ngày',
        architecturalHighlights: [
          'Tháp Quán Thế Âm 7 tầng cao 40m và Tháp Đá Vĩnh Nghiêm chạm khắc hoàn toàn bằng đá granit nguyên khối',
          'Mái đao cong vút theo phong cách chùa cổ miền Bắc tái hiện bằng kết cấu bê tông cốt thép của KTS Nguyễn Bá Lăng',
          'Chiếc chuông đồng "Đại hồng chung Hòa Bình" do Phật giáo Nhật Bản cúng dường',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Chùa Vĩnh Nghiêm trên trục đường Nam Kỳ Khởi Nghĩa, Quận 3 – một trong những công trình kiến trúc Phật giáo tiêu biểu nhất thế kỷ 20 tại Thành phố Hồ Chí Minh.',
          'Được khởi công năm 1964 và hoàn thành năm 1971 theo đồ án của Kiến trúc sư Nguyễn Bá Lăng, ngôi chùa lấy nguyên mẫu từ chốn tổ Vĩnh Nghiêm thời Trần ở Bắc Giang nhưng được thi công bằng kỹ thuật bê tông cốt thép hiện đại.',
          'Nổi bật trong khuôn viên là Tháp Quán Thế Âm 7 tầng cao 40 mét và Tháp Đá Vĩnh Nghiêm chạm trổ kỳ công từ đá granit nguyên khối.',
        ],
      },
      en: {
        name: 'Vinh Nghiem Pagoda & Stone Stupa (District 3)',
        shortSummary:
          'Designed by architect Nguyen Ba Lang (1964–1971), blending Northern Vietnamese Buddhist roofs with modern engineering and Vietnam’s tallest carved granite stupa.',
        historicalEra: '1964 – 1971 (Architect Nguyen Ba Lang)',
        openingHours: '06:00 – 20:00 Daily',
        architecturalHighlights: [
          '40-meter seven-story Avalokitesvara Tower and monumental carved granite Stone Stupa',
          'Soaring upturned eaves inspired by Tran Dynasty Northern pagodas',
          'Peace Bronze Bell gifted by the Japanese Buddhist Sangha',
        ],
        audioScript: [
          'Welcome to Vinh Nghiem Pagoda on Nam Ky Khoi Nghia Boulevard in District 3, designed by renowned architect Nguyen Ba Lang between 1964 and 1971.',
        ],
      },
      fr: {
        name: 'Pagode Vinh Nghiem (3e Arrondissement)',
        shortSummary:
          'Chef-d’œuvre d’architecture bouddhique moderne conçu par Nguyen Ba Lang (1964–1971), célèbre pour sa tour de 40 mètres et son stupa en granit sculpté.',
        historicalEra: '1964 – 1971',
        openingHours: '06h00 – 20h00',
        architecturalHighlights: [
          'Tour Quan The Am de 7 étages (40 mètres) et grand stupa en pierre',
          'Cloche de la Paix offerte par la communauté bouddhiste japonaise',
        ],
        audioScript: [
          'Bienvenue à la pagode Vinh Nghiem, édifiée entre 1964 et 1971 selon les plans de l’architecte Nguyen Ba Lang.',
        ],
      },
      zh: {
        name: '永严寺与石造宝塔（第三郡）',
        shortSummary: '由建筑师阮伯陵设计（1964–1971），融合北越古刹飞檐与现代建筑技术，拥有40米七层观音塔与全石雕宝塔。',
        historicalEra: '1964 – 1971年',
        openingHours: '06:00 – 20:00',
        architecturalHighlights: ['高达40米的七层观世音宝塔与整石雕刻的永严石塔', '日本佛教界赠送的“和平大洪钟”'],
        audioScript: [
          '欢迎来到位于第三郡南圻起义大道的永严寺，寺内耸立着40米高的七层观音宝塔与精湛的花岗岩雕石塔。',
        ],
      },
      ja: {
        name: 'ヴィンギエム寺（永厳寺・3区）',
        shortSummary:
          '建築家グエン・バー・ランの設計により1971年に完成した大寺院。高さ40mの七重塔、石造宝塔、日本の仏教界から寄贈された平和の梵鐘で有名です。',
        historicalEra: '1964年 – 1971年',
        openingHours: '06:00 – 20:00',
        architecturalHighlights: ['高さ40メートルの七重の観音塔と花崗岩の石塔', '日本の仏教徒から寄贈された「平和の梵鐘」'],
        audioScript: [
          '3区のナムキーコイギア通りに建つヴィンギエム寺（永厳寺）へようこそ。日本の仏教界から贈られた平和の鐘や高さ40メートルの七重塔が見どころです。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'cvn-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Quần thể Chùa Vĩnh Nghiêm và Bảo tháp 7 tầng tại Quận 3, TP.HCM',
          en: 'Vinh Nghiem Pagoda and its 7-story tower in District 3',
          fr: 'La pagode Vinh Nghiem et sa tour à sept étages',
          zh: '第三郡永严寺与七层宝塔',
          ja: '3区のヴィンギエム寺と七重塔',
        },
        yearOrSource: 'Di sản Kiến trúc Phật giáo TP.HCM',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-cvn-1',
        name: 'Bún Mọc Ròm Mập & Nhà hàng Chay Vĩnh Nghiêm',
        cuisine: 'Ẩm thực Chay Thanh Tịnh & Đặc sản Nam Kỳ Khởi Nghĩa',
        specialtyDishes: ['Lẩu nấm thảo mộc chay', 'Cơm sen chay Vĩnh Nghiêm', 'Bún mọc sườn non'],
        rating: 4.8,
        reviewCount: 2340,
        priceRange: '55.000đ – 150.000đ',
        lat: 10.7885,
        lng: 106.6842,
        address: '339 Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, Quận 3, TP.HCM',
        openHours: '07:00 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'den-tuong-niem-cac-vua-hung-thu-duc',
    city: 'TP. Thủ Đức · TP.HCM',
    district: 'TP. Thủ Đức',
    lat: 10.8795,
    lng: 106.8195,
    category: 'imperial',
    rating: 4.9,
    reviewCount: 6150,
    ticketPrice: 'Miễn phí tham quan',
    address: 'Công viên Lịch sử – Văn hóa Dân tộc, Phường Long Bình, TP. Thủ Đức, TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    translations: {
      vi: {
        name: 'Đền Tưởng niệm các Vua Hùng & Công viên Lịch sử Văn hóa Dân tộc (TP. Thủ Đức)',
        shortSummary:
          'Quần thể kiến trúc văn hóa tâm linh rộng hơn 400 hecta tại Đồi Công nghệ – TP. Thủ Đức, thiết kế theo hình tượng Trống đồng Đông Sơn, Bánh chưng – Bánh giầy và Cửu Long.',
        historicalEra: 'Khánh thành năm 2009',
        openingHours: '07:00 – 17:00 Hàng ngày',
        architecturalHighlights: [
          'Quảng trường Thái Dương mô phỏng mặt Trống đồng Ngọc Lũ với 18 cánh cung tượng trưng 18 đời Vua Hùng',
          'Con đường Tre dài 400m dẫn lên Đền Thượng tọa lạc trên đỉnh đồi cao thoáng đãng',
          'Cột đá thề của An Dương Vương và Bảo tàng Gốm cổ sông Đồng Nai',
        ],
        audioScript: [
          'Chào mừng quý khách đến với Đền Tưởng niệm các Vua Hùng nằm trong Công viên Lịch sử – Văn hóa Dân tộc rộng hơn 400 hecta tại phường Long Bình, Thành phố Thủ Đức.',
          'Công trình được thiết kế theo triết lý Trời tròn Đất vuông (Bánh chưng – Bánh giầy), nổi bật với Quảng trường Thái Dương mang họa tiết mặt trống đồng Đông Sơn và 54 cột đá tượng trưng cho 54 dân tộc anh em.',
          'Lối đi bộ rợp bóng tre xanh mát dẫn thẳng lên Đền Thượng là một trong những cung đường tản bộ văn hóa đẹp nhất tại khu Đông Thành phố Hồ Chí Minh.',
        ],
      },
      en: {
        name: 'Hung Kings Memorial Temple & National Historical-Cultural Park (Thu Duc City)',
        shortSummary:
          'A monumental 400-hectare cultural complex in Thu Duc City inspired by Dong Son bronze drums and the legend of Square Earth and Round Sky.',
        historicalEra: 'Inaugurated in 2009',
        openingHours: '07:00 – 17:00 Daily',
        architecturalHighlights: [
          'Sun Square modeled after the Dong Son bronze drum with 54 stone pillars representing Vietnam’s 54 ethnic groups',
          '400-meter bamboo-lined ceremonial walking avenue',
          'Upper Sanctuary honoring the 18 Hung King dynasties and Emperor An Duong Vuong’s Oath Stone',
        ],
        audioScript: [
          'Welcome to the Hung Kings Memorial Temple inside the 400-hectare National Historical and Cultural Park in Thu Duc City, eastern Ho Chi Minh City.',
        ],
      },
      fr: {
        name: 'Temple Mémorial des Rois Hung & Parc Historique National (Thu Duc)',
        shortSummary:
          'Vaste complexe culturel de 400 hectares à Thu Duc inspiré des tambours de bronze de Dong Son et bordé d’une allée de bambous.',
        historicalEra: 'Inauguré en 2009',
        openingHours: '07h00 – 17h00',
        architecturalHighlights: [
          'Esplanade du tambour de bronze de Dong Son et 54 colonnes de pierre',
          'Allée piétonne bordée de bambous menant au sanctuaire supérieur',
        ],
        audioScript: [
          'Bienvenue au Temple commémoratif des Rois Hung au cœur du Parc historique et culturel national de la ville de Thu Duc.',
        ],
      },
      zh: {
        name: '守德市雄王纪念圣殿与民族历史文化公园',
        shortSummary: '占地逾400公顷的宏伟历史文化建筑群，融合东山铜鼓图腾、天圆地方理念与400米翠竹步道。',
        historicalEra: '2009年落成',
        openingHours: '07:00 – 17:00',
        architecturalHighlights: ['东山铜鼓造型太阳广场与象征54个民族的54根石柱', '长达400米的翠竹参道'],
        audioScript: [
          '欢迎来到位于胡志明市守德市的雄王纪念圣殿与民族历史文化公园。',
        ],
      },
      ja: {
        name: 'フン王記念神殿と民族歴史文化公園（トゥードゥック市）',
        shortSummary:
          'トゥードゥック市の400ヘクタールにおよぶ広大な歴史公園内に建つ神殿。ドンソン銅鼓を模した広場と美しい竹林の参道が魅力です。',
        historicalEra: '2009年完成',
        openingHours: '07:00 – 17:00',
        architecturalHighlights: ['ドンソン銅鼓の文様を配した太陽広場と54民族の石柱', '400メートル続く緑豊かな竹林の遊歩道'],
        audioScript: [
          'トゥードゥック市にあるフン王記念神殿へようこそ。ドンソン銅鼓をモチーフにした壮大な建築と竹林の参道が広がっています。',
        ],
      },
    },
    mediaGallery: [
      {
        id: 'dvh-img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
        caption: {
          vi: 'Đền Tưởng niệm các Vua Hùng và đường tre xanh tại TP. Thủ Đức',
          en: 'Hung Kings Memorial Temple and bamboo avenue in Thu Duc City',
          fr: 'Le Temple des Rois Hung à Thu Duc',
          zh: '守德市雄王纪念圣殿',
          ja: 'トゥードゥック市のフン王記念神殿',
        },
        yearOrSource: 'Công viên Lịch sử – Văn hóa Dân tộc TP.HCM',
      },
    ],
    nearbyRestaurants: [
      {
        id: 'res-td-1',
        name: 'Làng Nướng Gió Biển & Nem Nướng Thủ Đức',
        cuisine: 'Đặc sản Thủ Đức & Nam Bộ',
        specialtyDishes: ['Nem nướng Thủ Đức cuốn bánh hỏi', 'Gà nướng cơm lam', 'Lẩu cá lăng măng chua'],
        rating: 4.7,
        reviewCount: 1920,
        priceRange: '70.000đ – 180.000đ',
        lat: 10.8712,
        lng: 106.8095,
        address: 'Xa lộ Hà Nội / Phường Long Bình, TP. Thủ Đức, TP.HCM',
        openHours: '08:00 – 21:30',
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];

export const BASE_HERITAGE_SITES: HeritageSite[] = [
  ...HCM_CENTRAL_SITES,
  ...HCM_EXTENDED_SITES,
  ...ADDITIONAL_HCM_SITES,
  ...HCM_ICONIC_PHOTO_SITES,
  ...HCM_CULTURE_AND_SUBURBAN_SITES,
  ...HCM_MERGED_BD_VT_SITES,
  ...HCM_VUNG_TAU_DETAILED_SITES,
  ...HCM_VUNG_TAU_TOURISM_SITES,
];

export const HERITAGE_SITES: HeritageSite[] = BASE_HERITAGE_SITES.map((site) => {
  const curated = site.nearbyRestaurants.map((res) => ({
    ...res,
    source: res.source ?? ('curated' as const),
  }));
  const overture = OVERTURE_RESTAURANTS_BY_SITE[site.id] ?? [];
  const wiki = WIKIPEDIA_ENRICHMENT_BY_SITE[site.id];

  if (wiki?.translations) {
    return {
      ...site,
      coverImage: wiki.coverImage || site.coverImage,
      mediaGallery:
        wiki.mediaGallery && wiki.mediaGallery.length > 0
          ? wiki.mediaGallery
          : site.mediaGallery,
      translations: wiki.translations,
      nearbyRestaurants: [...curated, ...overture],
    };
  }

  const viBase = site.translations.vi;
  const enBase = site.translations.en;

  const viAudioScript = [...viBase.audioScript];
  if (
    wiki?.viWikiParagraphs &&
    wiki.viWikiParagraphs.length > 0 &&
    !viAudioScript.some((s) => s.includes('Wikipedia'))
  ) {
    let wikiNote = `Theo tư liệu bách khoa Wikipedia: ${wiki.viWikiParagraphs[0]}`;
    if (wiki.viWikiParagraphs.length > 1 && wikiNote.length < 420) {
      wikiNote = `${wikiNote} ${wiki.viWikiParagraphs[1]}`;
    }
    viAudioScript.push(wikiNote);
  }

  const enAudioScript = [...enBase.audioScript];
  if (
    wiki?.enWikiParagraphs &&
    wiki.enWikiParagraphs.length > 0 &&
    !enAudioScript.some((s) => s.includes('Wikipedia'))
  ) {
    enAudioScript.push(
      `Historical context from Wikipedia: ${wiki.enWikiParagraphs[0]}`
    );
  }

  return {
    ...site,
    coverImage: wiki?.coverImage || site.coverImage,
    mediaGallery:
      wiki?.mediaGallery && wiki.mediaGallery.length > 0
        ? wiki.mediaGallery
        : site.mediaGallery,
    translations: {
      ...site.translations,
      vi: {
        ...viBase,
        audioScript: viAudioScript,
      },
      en: {
        ...enBase,
        audioScript: enAudioScript,
      },
    },
    nearbyRestaurants: [...curated, ...overture],
  };
});
