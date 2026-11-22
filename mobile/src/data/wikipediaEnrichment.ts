/**
 * Ảnh thực tế (Wikimedia Commons) & tư liệu chi tiết từ Wikipedia (VI/EN)
 * cho toàn bộ 50 di tích & điểm tham quan TP. Hồ Chí Minh.
 *
 * - Synced at: 2026-11-22T07:21:22Z
 * - Ảnh thực tế: 150 ảnh phủ 50/50 địa điểm
 * - Tư liệu Wikipedia: 46/50 địa điểm
 *
 * Cập nhật lại bằng lệnh: `cd backend && python -m scripts.sync_wikipedia_data`
 */

import { DocumentaryMedia } from '../types/heritage';

export interface WikipediaSiteEnrichment {
  coverImage?: string;
  mediaGallery?: DocumentaryMedia[];
  wikipediaUrl?: string;
  viWikiSummary?: string;
  viWikiParagraphs?: string[];
  enWikiSummary?: string;
  enWikiParagraphs?: string[];
}

export const WIKIPEDIA_ENRICHMENT_SYNCED_AT = '2026-11-22T07:21:22Z';

export const WIKIPEDIA_ENRICHMENT_BY_SITE: Record<string, WikipediaSiteEnrichment> = {
  "dinh-doc-lap": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/20190923_Independence_Palace-10.jpg/1280px-20190923_Independence_Palace-10.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Dinh_%C4%90%E1%BB%99c_L%E1%BA%ADp",
    "viWikiSummary": "Dinh Độc Lập là một tòa dinh thự tại Thành phố Hồ Chí Minh, từng là nơi ở và làm việc của Tổng thống Việt Nam Cộng hòa trước Sự kiện 30 tháng 4 năm 1975. Hiện nay, Dinh Độc Lập đã được Chính phủ Việt Nam xếp hạng là di tích quốc gia đặc biệt. Cơ quan quản lý di tích văn hóa Dinh Độc Lập có tên là Hội trường Thống Nhất thuộc Văn phòng Chính phủ.",
    "viWikiParagraphs": [
      "Dinh Độc Lập là một tòa dinh thự tại Thành phố Hồ Chí Minh, từng là nơi ở và làm việc của Tổng thống Việt Nam Cộng hòa trước Sự kiện 30 tháng 4 năm 1975. Hiện nay, Dinh Độc Lập đã được Chính phủ Việt Nam xếp hạng là di tích quốc gia đặc biệt. Cơ quan quản lý di tích văn hóa Dinh Độc Lập có tên là Hội trường Thống Nhất thuộc Văn phòng Chính phủ.",
      "Dinh Độc Lập được Tổng thống Ngô Đình Diệm cho khởi công xây dựng ngày 1 tháng 7 năm 1962, sau khi dinh cũ từ thời Pháp thuộc bị hư hại do vụ đánh bom của hai phi công. Dinh được xây theo bản thiết kế của kiến trúc sư Ngô Viết Thụ, người Việt Nam đầu tiên đạt giải Khôi nguyên La Mã."
    ],
    "enWikiSummary": "The Independence Palace (Vietnamese: Dinh Độc Lập), also publicly and officially known as the Reunification Convention Hall or simply Reunification Hall (Vietnamese: Hội trường Thống Nhất), is a historic landmark and government-owned public hall in Ho Chi Minh City (formerly known as Saigon), Vietnam. It was designed by architect Ngô Viết Thụ and was the presidential palace, home and workplace of the president of the Republic of Vietnam (South Vietnam).",
    "enWikiParagraphs": [
      "The Independence Palace (Vietnamese: Dinh Độc Lập), also publicly and officially known as the Reunification Convention Hall or simply Reunification Hall (Vietnamese: Hội trường Thống Nhất), is a historic landmark and government-owned public hall in Ho Chi Minh City (formerly known as Saigon), Vietnam. It was designed by architect Ngô Viết Thụ and was the presidential palace, home and workplace of the president of the Republic of Vietnam (South Vietnam)."
    ]
  },
  "nha-tho-duc-ba-sai-gon": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_07.JPG/1280px-Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_07.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Nh%C3%A0_th%E1%BB%9D_ch%C3%ADnh_t%C3%B2a_%C4%90%E1%BB%A9c_B%C3%A0_S%C3%A0i_G%C3%B2n",
    "viWikiSummary": "Nhà thờ Chánh tòa Đức Bà Sài Gòn (hay Vương cung thánh đường chánh tòa Đức Mẹ Vô nhiễm Nguyên tội, tiếng Anh: Immaculate Conception Cathedral Basilica, tiếng Pháp: Cathédrale Notre-Dame de Saïgon, tiếng Latinh: Basilica Immaculatae Conceptionis), thường được gọi tắt là Nhà thờ Đức Bà, là nhà thờ chính tòa của Tổng giáo phận Sài Gòn.",
    "viWikiParagraphs": [
      "Nhà thờ Chánh tòa Đức Bà Sài Gòn (hay Vương cung thánh đường chánh tòa Đức Mẹ Vô nhiễm Nguyên tội, tiếng Anh: Immaculate Conception Cathedral Basilica, tiếng Pháp: Cathédrale Notre-Dame de Saïgon, tiếng Latinh: Basilica Immaculatae Conceptionis), thường được gọi tắt là Nhà thờ Đức Bà, là nhà thờ chính tòa của Tổng giáo phận Sài Gòn.",
      "Nhà thờ không chỉ là biểu tượng của Công giáo ở Việt Nam, mà còn là một trong những công trình kiến trúc độc đáo của Thành phố Hồ Chí Minh và điểm đến nổi tiếng với du khách. Tên gọi ban đầu của nhà thờ là Nhà thờ Sài Gòn (tiếng Pháp: l'eglise de Saïgon), tên gọi Nhà thờ Đức Bà bắt đầu được sử dụng từ năm 1959 bằng việc đặt Tượng Đức Bà Hòa Bình trước khuôn viên."
    ],
    "enWikiSummary": "The Cathedral Basilica of Our Lady of the Immaculate Conception in Saigon (Vietnamese: Vương cung thánh đường Chính tòa Đức Mẹ Vô nhiễm Nguyên tội Bà Sài Gòn) is a Roman Catholic minor basilica and cathedral located in Saigon, Vietnam. The cathedral was originally established by French Catholic priests who originally named it the Church of Saigon (French: l'Église de Saïgon), was constructed between 1877 and 1880.",
    "enWikiParagraphs": [
      "The Cathedral Basilica of Our Lady of the Immaculate Conception in Saigon (Vietnamese: Vương cung thánh đường Chính tòa Đức Mẹ Vô nhiễm Nguyên tội Bà Sài Gòn) is a Roman Catholic minor basilica and cathedral located in Saigon, Vietnam. The cathedral was originally established by French Catholic priests who originally named it the Church of Saigon (French: l'Église de Saïgon), was constructed between 1877 and 1880.",
      "Pope John XXIII raised the shrine to the status of Minor Basilica via his decree Spectabile Monumentum Fidei on 13 November 1962. The decree was signed and notarized by Cardinal Amleto Cicognani."
    ]
  },
  "buu-dien-trung-tam-sai-gon": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Saigon_Central_Post_Office_%2852681461470%29.jpg/1280px-Saigon_Central_Post_Office_%2852681461470%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/B%C6%B0u_%C4%91i%E1%BB%87n_S%C3%A0i_G%C3%B2n",
    "viWikiSummary": "Bưu điện Trung tâm Sài Gòn, còn gọi là Tòa nhà Bưu điện Thành phố Hồ Chí Minh, là một trong những công trình kiến trúc tiêu biểu tại Thành phố Hồ Chí Minh, tọa lạc tại số 2, Công trường Công xã Paris, phường Sài Gòn. Đây là tòa nhà được người Pháp xây dựng trong khoảng năm 1886–1891 với phong cách chiết trung theo đồ án thiết kế của kiến trúc sư Marie-Alfred Foulhoux.",
    "viWikiParagraphs": [
      "Bưu điện Trung tâm Sài Gòn, còn gọi là Tòa nhà Bưu điện Thành phố Hồ Chí Minh, là một trong những công trình kiến trúc tiêu biểu tại Thành phố Hồ Chí Minh, tọa lạc tại số 2, Công trường Công xã Paris, phường Sài Gòn. Đây là tòa nhà được người Pháp xây dựng trong khoảng năm 1886–1891 với phong cách chiết trung theo đồ án thiết kế của kiến trúc sư Marie-Alfred Foulhoux.",
      "Nằm cạnh Nhà thờ Đức Bà, đây cũng là điểm tham quan cho khách du lịch khi đến Thành phố Hồ Chí Minh."
    ],
    "enWikiSummary": "The Saigon Central Post Office (Vietnamese: Bưu điện Trung tâm Sài Gòn, French: Poste centrale de Saïgon) is a post office in Paris Commune Square, Saigon ward, Ho Chi Minh City, next to the Saigon Notre-Dame Basilica, the city's cathedral.",
    "enWikiParagraphs": [
      "The Saigon Central Post Office (Vietnamese: Bưu điện Trung tâm Sài Gòn, French: Poste centrale de Saïgon) is a post office in Paris Commune Square, Saigon ward, Ho Chi Minh City, next to the Saigon Notre-Dame Basilica, the city's cathedral.",
      "The building was constructed when Vietnam was part of French Indochina in the late 19th century. It counts with Gothic, Renaissance and French influences. It was constructed between 1886 and 1891 and is now a tourist attraction."
    ]
  },
  "ben-nha-rong": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Ho_Chi_Minh_Museum%2C_Saigon.jpg/1280px-Ho_Chi_Minh_Museum%2C_Saigon.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/B%E1%BA%BFn_Nh%C3%A0_R%E1%BB%93ng",
    "viWikiSummary": "Bến Nhà Rồng, tên chính thức là Bảo tàng Hồ Chí Minh - Chi nhánh Thành phố Hồ Chí Minh, là cụm di tích kiến trúc - bảo tàng nằm bên sông Sài Gòn, thuộc phường Xóm Chiếu (xưa là Quận 4), Thành phố Hồ Chí Minh. Nơi đây từng là trụ sở của hãng vận tải Messageries maritimes tại Sài Gòn từ năm 1864 đến năm 1955.",
    "viWikiParagraphs": [
      "Bến Nhà Rồng, tên chính thức là Bảo tàng Hồ Chí Minh - Chi nhánh Thành phố Hồ Chí Minh, là cụm di tích kiến trúc - bảo tàng nằm bên sông Sài Gòn, thuộc phường Xóm Chiếu (xưa là Quận 4), Thành phố Hồ Chí Minh. Nơi đây từng là trụ sở của hãng vận tải Messageries maritimes tại Sài Gòn từ năm 1864 đến năm 1955.",
      "Ủy ban nhân dân Thành phố Hồ Chí Minh chỉ đạo Sở Văn hóa, Thể thao và Du lịch đưa Bến Nhà Rồng vào danh sách danh thắng biểu trưng của thành phố."
    ]
  },
  "nha-hat-thanh-pho-hcm": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Lascar_Municipal_Theatre_%284608017466%29.jpg/1280px-Lascar_Municipal_Theatre_%284608017466%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Nh%C3%A0_h%C3%A1t_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh",
    "viWikiSummary": "Nhà hát Sài Gòn (Tiếng Anh: Saigon Opera House), thường được gọi ngắn gọn là Nhà hát Thành phố, là một nhà hát có mặt tiền hướng ra Công trường Lam Sơn và đường Đồng Khởi, phường Sài Gòn, Thành phố Hồ Chí Minh. được quản lý trực tiếp bởi Trung tâm Tổ chức Biểu diễn và Điện ảnh Thành phố (Saigon Concert) - đơn vị trực thuộc Sở Văn hóa và Thể thao Thành phố Hồ Chí Minh.",
    "viWikiParagraphs": [
      "Nhà hát Sài Gòn (Tiếng Anh: Saigon Opera House), thường được gọi ngắn gọn là Nhà hát Thành phố, là một nhà hát có mặt tiền hướng ra Công trường Lam Sơn và đường Đồng Khởi, phường Sài Gòn, Thành phố Hồ Chí Minh. được quản lý trực tiếp bởi Trung tâm Tổ chức Biểu diễn và Điện ảnh Thành phố (Saigon Concert) - đơn vị trực thuộc Sở Văn hóa và Thể thao Thành phố Hồ Chí Minh."
    ],
    "enWikiSummary": "Saigon Opera House (Vietnamese: Nhà hát Thành phố, French: Théâtre Municipal de Saïgon) is a municipal opera house in downtown Saigon, now Ho Chi Minh City, Vietnam. Like other French-built opera houses during French colonial period, including the ones in Hanoi and Haiphong, it is an example of French colonial architecture in Vietnam.",
    "enWikiParagraphs": [
      "Saigon Opera House (Vietnamese: Nhà hát Thành phố, French: Théâtre Municipal de Saïgon) is a municipal opera house in downtown Saigon, now Ho Chi Minh City, Vietnam. Like other French-built opera houses during French colonial period, including the ones in Hanoi and Haiphong, it is an example of French colonial architecture in Vietnam."
    ]
  },
  "tru-so-ubnd-tphcm-dinh-xa-tay": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Ho_Chi_Minh_City%2C_City_Hall%2C_2020-01_CN-02.jpg/1280px-Ho_Chi_Minh_City%2C_City_Hall%2C_2020-01_CN-02.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Tr%E1%BB%A5_s%E1%BB%9F_%E1%BB%A6y_ban_nh%C3%A2n_d%C3%A2n_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh",
    "viWikiSummary": "Trụ sở Ủy ban nhân dân Thành phố Hồ Chí Minh là một trong những công trình kiến trúc cổ điển ở Thành phố Hồ Chí Minh, được xây dựng từ năm 1898 đến 1908, khánh thành năm 1909. Thời Pháp thuộc, tòa nhà này có tên là Hôtel de ville trong tiếng Pháp hay Dinh xã Tây trong tiếng Việt. Đến thời Việt Nam Cộng hòa, nó được gọi là Tòa đô chánh Sài Gòn vì là nơi làm việc và hội họp của chính quyền thủ đô.",
    "viWikiParagraphs": [
      "Trụ sở Ủy ban nhân dân Thành phố Hồ Chí Minh là một trong những công trình kiến trúc cổ điển ở Thành phố Hồ Chí Minh, được xây dựng từ năm 1898 đến 1908, khánh thành năm 1909. Thời Pháp thuộc, tòa nhà này có tên là Hôtel de ville trong tiếng Pháp hay Dinh xã Tây trong tiếng Việt. Đến thời Việt Nam Cộng hòa, nó được gọi là Tòa đô chánh Sài Gòn vì là nơi làm việc và hội họp của chính quyền thủ đô."
    ],
    "enWikiSummary": "Ho Chi Minh City Hall, officially called the Ho Chi Minh City People's Council and People's Committee Head Office (Vietnamese: Trụ sở Hội đồng Nhân dân và Ủy ban Nhân dân Thành phố Hồ Chí Minh), is a city hall and the seat of the government of Ho Chi Minh City, Vietnam. It is located in downtown Ho Chi Minh City's Saigon ward, between Pasteur, Lý Tự Trọng, Đồng Khởi, and Lê Thánh Tôn Street, with its front facade facing Nguyễn Huệ Boulevard.",
    "enWikiParagraphs": [
      "Ho Chi Minh City Hall, officially called the Ho Chi Minh City People's Council and People's Committee Head Office (Vietnamese: Trụ sở Hội đồng Nhân dân và Ủy ban Nhân dân Thành phố Hồ Chí Minh), is a city hall and the seat of the government of Ho Chi Minh City, Vietnam. It is located in downtown Ho Chi Minh City's Saigon ward, between Pasteur, Lý Tự Trọng, Đồng Khởi, and Lê Thánh Tôn Street, with its front facade facing Nguyễn Huệ Boulevard.",
      "Ho Chi Minh City Hall served as an administrative house for past governments during the French colonial period of Vietnam and Vietnam War. The building now also serves as one of Vietnam's national heritage sites and is open for public at the last weekend of each month."
    ]
  },
  "cho-ben-thanh": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Ben_Thanh%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_01.JPG/1280px-Ben_Thanh%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_01.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Ch%E1%BB%A3_B%E1%BA%BFn_Th%C3%A0nh",
    "viWikiSummary": "Chợ Bến Thành là một ngôi chợ nằm tại phường Bến Thành, Thành phố Hồ Chí Minh. Chợ được khởi công xây dựng từ năm 1912, hình ảnh đồng hồ ở cửa nam của ngôi chợ này được xem là biểu tượng không chính thức của Thành phố Hồ Chí Minh.",
    "viWikiParagraphs": [
      "Chợ Bến Thành là một ngôi chợ nằm tại phường Bến Thành, Thành phố Hồ Chí Minh. Chợ được khởi công xây dựng từ năm 1912, hình ảnh đồng hồ ở cửa nam của ngôi chợ này được xem là biểu tượng không chính thức của Thành phố Hồ Chí Minh.",
      "Chợ nằm giữa các đường Phan Bội Châu - Phan Chu Trinh - Lê Thánh Tôn - Công trường Quách Thị Trang tại phường Bến Thành với diện tích 13.056 m². Các ngành hàng kinh doanh chủ yếu ở đây bao gồm: quần áo, vải sợi, giày dép, thời trang, hàng thủ công mỹ nghệ, thực phẩm tươi sống, trái cây, hoa tươi,..."
    ],
    "enWikiSummary": "Bến Thành Market (Vietnamese: Chợ Bến Thành) is located in the center of Ho Chi Minh City (Saigon), Vietnam in District 1. The market is one of the earliest surviving structures in the city and an important symbol of the city. Ben Thanh Market is a famous destination for many local and foreign tourists from all around the world. The market operates all year round and opens at around 6am every day until the official closing time at 6pm.",
    "enWikiParagraphs": [
      "Bến Thành Market (Vietnamese: Chợ Bến Thành) is located in the center of Ho Chi Minh City (Saigon), Vietnam in District 1. The market is one of the earliest surviving structures in the city and an important symbol of the city. Ben Thanh Market is a famous destination for many local and foreign tourists from all around the world. The market operates all year round and opens at around 6am every day until the official closing time at 6pm.",
      "Today, Ben Thanh Market welcomes more than 10,000 visitors per day to shop and visit. The market has nearly 1,500 booths with more than 6,000 small businesses selling wholesale and retail items from consumables to luxury goods."
    ]
  },
  "bao-tang-chung-tich-chien-tranh": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/War_Remnants_Museum%2C_HCMC%2C_front.JPG/1280px-War_Remnants_Museum%2C_HCMC%2C_front.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/B%E1%BA%A3o_t%C3%A0ng_Ch%E1%BB%A9ng_t%C3%ADch_chi%E1%BA%BFn_tranh",
    "viWikiSummary": "Bảo tàng Chứng tích Chiến tranh (War Remnants Museum) là một bảo tàng vì hòa bình ở số 28 đường Võ Văn Tần, phường Xuân Hòa, Thành phố Hồ Chí Minh. Bảo tàng Chứng tích Chiến tranh trực thuộc Sở Văn hóa và Thể thao Thành phố Hồ Chí Minh, là thành viên của hệ thống Bảo tàng vì hòa bình thế giới và Hội đồng các bảo tàng thế giới (ICOM).",
    "viWikiParagraphs": [
      "Bảo tàng Chứng tích Chiến tranh (War Remnants Museum) là một bảo tàng vì hòa bình ở số 28 đường Võ Văn Tần, phường Xuân Hòa, Thành phố Hồ Chí Minh. Bảo tàng Chứng tích Chiến tranh trực thuộc Sở Văn hóa và Thể thao Thành phố Hồ Chí Minh, là thành viên của hệ thống Bảo tàng vì hòa bình thế giới và Hội đồng các bảo tàng thế giới (ICOM).",
      "Từ nhiều năm qua, Bảo tàng Chứng tích Chiến tranh là một trong những điểm tham quan thu hút lượng khách đông nhất ở TPHCM và cả nước. Qua 50 năm hình thành và phát triển (1975 - 2025), Bảo tàng đã đón tiếp hơn 23 triệu lượt khách tham…"
    ],
    "enWikiSummary": "The War Remnants Museum (Vietnamese: Bảo tàng chứng tích chiến tranh, IPA: [ɓâw tàŋ cɯ̌ŋ tǐʲc cǐən ʈ͡ʂāɲ]) is a war museum at 28 Võ Văn Tần Street, Xuân Hòa, Ho Chi Minh City, Vietnam. It contains exhibits relating to the First Indochina War and the Vietnam War.",
    "enWikiParagraphs": [
      "The War Remnants Museum (Vietnamese: Bảo tàng chứng tích chiến tranh, IPA: [ɓâw tàŋ cɯ̌ŋ tǐʲc cǐən ʈ͡ʂāɲ]) is a war museum at 28 Võ Văn Tần Street, Xuân Hòa, Ho Chi Minh City, Vietnam. It contains exhibits relating to the First Indochina War and the Vietnam War."
    ]
  },
  "bao-tang-lich-su-thao-cam-vien": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/Vietnam_National_Museum_of_History%2C_Hanoi%2C_Vietnam.jpg/1280px-Vietnam_National_Museum_of_History%2C_Hanoi%2C_Vietnam.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/B%E1%BA%A3o_t%C3%A0ng_L%E1%BB%8Bch_s%E1%BB%AD_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh",
    "viWikiSummary": "Bảo tàng Lịch sử Thành phố Hồ Chí Minh tọa lạc tại số 2 đường Nguyễn Bỉnh Khiêm, phường Sài Gòn, trong khuôn viên Thảo Cầm Viên Sài Gòn. Đây là nơi bảo tồn và trưng bày hàng chục ngàn hiện vật quý được sưu tầm trong và ngoài nước Việt Nam.",
    "viWikiParagraphs": [
      "Bảo tàng Lịch sử Thành phố Hồ Chí Minh tọa lạc tại số 2 đường Nguyễn Bỉnh Khiêm, phường Sài Gòn, trong khuôn viên Thảo Cầm Viên Sài Gòn. Đây là nơi bảo tồn và trưng bày hàng chục ngàn hiện vật quý được sưu tầm trong và ngoài nước Việt Nam."
    ],
    "enWikiSummary": "The Vietnam National Museum of History (Vietnamese: Viện Bảo tàng Lịch sử Việt Nam; French: Musée National d'Histoire du Viêt Nam) is in the Hoan Kiem district of Hanoi, Vietnam. The museum building was originally a museum of the French School of the Far East during French colonial rule. It was acquired by the government of North Vietnam in 1958 and the collections were expanded to cover eastern arts and national history.",
    "enWikiParagraphs": [
      "The Vietnam National Museum of History (Vietnamese: Viện Bảo tàng Lịch sử Việt Nam; French: Musée National d'Histoire du Viêt Nam) is in the Hoan Kiem district of Hanoi, Vietnam. The museum building was originally a museum of the French School of the Far East during French colonial rule. It was acquired by the government of North Vietnam in 1958 and the collections were expanded to cover eastern arts and national history.",
      "The museum highlights Vietnam's prehistory (roughly 40,000 years ago to 3,000 years ago) up to the August 1945 Revolution and the founding of the Democratic Republic of Vietnam. Its collections have over 200,000 items, arranged in four major sections."
    ]
  },
  "bao-tang-my-thuat-tphcm-dinh-chu-hoa": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/B%E1%BA%A3o_t%C3%A0ng_M%E1%BB%B9_thu%E1%BA%ADt_Tp_%28ki%E1%BA%BFn_tr%C3%BAc_t%E1%BB%95ng_th%E1%BB%83%29_%282%29.jpg/1280px-B%E1%BA%A3o_t%C3%A0ng_M%E1%BB%B9_thu%E1%BA%ADt_Tp_%28ki%E1%BA%BFn_tr%C3%BAc_t%E1%BB%95ng_th%E1%BB%83%29_%282%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/B%E1%BA%A3o_t%C3%A0ng_M%E1%BB%B9_thu%E1%BA%ADt_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh",
    "viWikiSummary": "Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh tọa lạc tại số 97 Phó Đức Chính, phường Bến Thành, Thành phố Hồ Chí Minh, Việt Nam; được thành lập năm 1987 và đi vào hoạt động năm 1991. Tòa nhà bao gồm 3 tầng, trưng bày các tác phẩm hội họa, điêu khắc, cổ vật có giá trị mỹ thuật cao. Đây là một trong những trung tâm mỹ thuật lớn nhất cả nước.",
    "viWikiParagraphs": [
      "Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh tọa lạc tại số 97 Phó Đức Chính, phường Bến Thành, Thành phố Hồ Chí Minh, Việt Nam; được thành lập năm 1987 và đi vào hoạt động năm 1991. Tòa nhà bao gồm 3 tầng, trưng bày các tác phẩm hội họa, điêu khắc, cổ vật có giá trị mỹ thuật cao. Đây là một trong những trung tâm mỹ thuật lớn nhất cả nước."
    ],
    "enWikiSummary": "Ho Chi Minh City Museum of Fine Arts (Vietnamese: Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh) is the major art museum of Ho Chi Minh City, Vietnam, and second in the country only to the Vietnam National Museum of Fine Arts in Hanoi.",
    "enWikiParagraphs": [
      "Ho Chi Minh City Museum of Fine Arts (Vietnamese: Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh) is the major art museum of Ho Chi Minh City, Vietnam, and second in the country only to the Vietnam National Museum of Fine Arts in Hanoi."
    ]
  },
  "bao-tang-tphcm-dinh-gia-long": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/B%E1%BA%A3o_t%C3%A0ng_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh_7.jpg/1280px-B%E1%BA%A3o_t%C3%A0ng_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh_7.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/B%E1%BA%A3o_t%C3%A0ng_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh",
    "viWikiSummary": "Bảo tàng Thành phố Hồ Chí Minh là một bảo tàng ở Thành phố Hồ Chí Minh, Việt Nam, lạc tại số 65 Lý Tự Trọng, Phường Sài Gòn, Thành phố Hồ Chí Minh, trên một khu đất rộng gần 2 ha, giới hạn bởi các con đường Lý Tự Trọng, Pasteur, Lê Thánh Tôn và Nam Kỳ Khởi Nghĩa.",
    "viWikiParagraphs": [
      "Bảo tàng Thành phố Hồ Chí Minh là một bảo tàng ở Thành phố Hồ Chí Minh, Việt Nam, lạc tại số 65 Lý Tự Trọng, Phường Sài Gòn, Thành phố Hồ Chí Minh, trên một khu đất rộng gần 2 ha, giới hạn bởi các con đường Lý Tự Trọng, Pasteur, Lê Thánh Tôn và Nam Kỳ Khởi Nghĩa."
    ],
    "enWikiSummary": "Museum of Ho Chi Minh City (Vietnamese: Bảo tàng Thành phố Hồ Chí Minh), formerly known as Gia Long Palace (Vietnamese: Dinh Gia Long), is a historical site and museum in Ho Chi Minh City, Vietnam. The museum is situated at the corner of Lý Tự Trọng and Nam Kỳ Khởi Nghĩa streets, located on a 2-hectare block near the Independence Palace.",
    "enWikiParagraphs": [
      "Museum of Ho Chi Minh City (Vietnamese: Bảo tàng Thành phố Hồ Chí Minh), formerly known as Gia Long Palace (Vietnamese: Dinh Gia Long), is a historical site and museum in Ho Chi Minh City, Vietnam. The museum is situated at the corner of Lý Tự Trọng and Nam Kỳ Khởi Nghĩa streets, located on a 2-hectare block near the Independence Palace.",
      "Construction of the palace began in 1885 and completed in 1890, and was designed by French architect Alfred Foulhoux to house the Museum of Commercial Trade, exhibiting products and goods of Southern Vietnam. However, the building soon became the residence of the Governor of Cochinchina, starting with Henri Éloi Danel (1850 - 1898)."
    ]
  },
  "chua-ngoc-hoang-phuoc-hai-tu": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Jade_Emperor_Pagoda_Saigon.jpg/1280px-Jade_Emperor_Pagoda_Saigon.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Ch%C3%B9a_Ng%E1%BB%8Dc_Ho%C3%A0ng",
    "viWikiSummary": "Chùa Ngọc Hoàng hay Chùa Phước Hải là tên thường gọi của Điện Ngọc Hoàng, tên chữ là Phước Hải Tự (người Pháp thì gọi là chùa Đa Kao); hiện tọa lạc tại số 73 đường Mai Thị Lựu, phường Tân Định, Thành phố Hồ Chí Minh, Việt Nam.",
    "viWikiParagraphs": [
      "Chùa Ngọc Hoàng hay Chùa Phước Hải là tên thường gọi của Điện Ngọc Hoàng, tên chữ là Phước Hải Tự (người Pháp thì gọi là chùa Đa Kao); hiện tọa lạc tại số 73 đường Mai Thị Lựu, phường Tân Định, Thành phố Hồ Chí Minh, Việt Nam.",
      "Ngôi chùa vốn là điện thờ Ngọc Hoàng Thượng đế do một người tên Lưu Minh (pháp danh là Lưu Đạo Nguyên, người Quảng Đông, Trung Quốc) xây dựng vào khoảng đầu thế kỷ 20. Theo học giả Vương Hồng Sển, thì Lưu Minh là người \"ăn chay ròng, giữ đạo Minh Sư, lập chí quyết lật đổ nhà Mãn Thanh, xuất tiền tạo lập chùa vừa để thờ phượng vừa để làm nơi hội kín\"..."
    ],
    "enWikiSummary": "The Jade Emperor Pagoda (Vietnamese: Chùa Ngọc Hoàng; name: Ngọc Hoàng Điện, 玉皇殿, \"Jade Emperor Hall\", French: Temple Đa Kao, Pagode de l'Empereur de Jade) also known as the Phước Hải Tự (Vietnamese: Chùa Phước Hải; 福海寺, \"Luck Sea Temple\") is a Taoist, Buddhist, Confucian pagoda located at District 1, Ho Chi Minh City, Vietnam. It was founded by a Chinese merchant named Liu Daoyuan (劉道源, Lưu Minh or Lưu Đạo Nguyên), a Cantonese migrant.",
    "enWikiParagraphs": [
      "The Jade Emperor Pagoda (Vietnamese: Chùa Ngọc Hoàng; name: Ngọc Hoàng Điện, 玉皇殿, \"Jade Emperor Hall\", French: Temple Đa Kao, Pagode de l'Empereur de Jade) also known as the Phước Hải Tự (Vietnamese: Chùa Phước Hải; 福海寺, \"Luck Sea Temple\") is a Taoist, Buddhist, Confucian pagoda located at District 1, Ho Chi Minh City, Vietnam. It was founded by a Chinese merchant named Liu Daoyuan (劉道源, Lưu Minh or Lưu Đạo Nguyên), a Cantonese migrant."
    ]
  },
  "lang-ong-ba-chieu-le-van-duyet": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Mi%E1%BA%BFu_th%E1%BB%9D_L%C3%AA_V%C4%83n_Duy%E1%BB%87t.jpg/1280px-Mi%E1%BA%BFu_th%E1%BB%9D_L%C3%AA_V%C4%83n_Duy%E1%BB%87t.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/L%C4%83ng_%C3%94ng_(B%C3%A0_Chi%E1%BB%83u)",
    "viWikiSummary": "Lăng Tả quân Lê Văn Duyệt (tên chữ: Thượng Công Miếu, chữ Hán: 上公廟, tục gọi: Lăng Ông - Bà Chiểu) là quần thể lăng mộ và miếu thờ Tả quân Lê Văn Duyệt (1764–1832), kèm phần mộ song táng của phu nhân Đỗ Thị Phẫn. Di tích nằm tại số 1 đường Vũ Tùng, phường Gia Định, Thành phố Hồ Chí Minh, Việt Nam. Cổng phía tây của khu lăng mở ra số 126 đường Lê Văn Duyệt.",
    "viWikiParagraphs": [
      "Lăng Tả quân Lê Văn Duyệt (tên chữ: Thượng Công Miếu, chữ Hán: 上公廟, tục gọi: Lăng Ông - Bà Chiểu) là quần thể lăng mộ và miếu thờ Tả quân Lê Văn Duyệt (1764–1832), kèm phần mộ song táng của phu nhân Đỗ Thị Phẫn. Di tích nằm tại số 1 đường Vũ Tùng, phường Gia Định, Thành phố Hồ Chí Minh, Việt Nam. Cổng phía tây của khu lăng mở ra số 126 đường Lê Văn Duyệt.",
      "Quần thể có bố cục theo trục chính: từ tam quan (ghi \"Thượng Công Miếu\") qua nhà bia, khu mộ song táng, rồi đến miếu thờ (tiền điện – trung điện – chính điện); hai dãy Đông lang và Tây lang bố trí đối xứng theo trục. Nhiều chi tiết kiến trúc và trang trí gắn với phong cách mỹ thuật triều Nguyễn, trong đó có các mảng khảm sành sứ."
    ],
    "enWikiSummary": "Tomb of Lê Văn Duyệt (Vietnamese: Lăng Tả quân Lê Văn Duyệt), also known as Tomb of the Marshal in Ba Chieu (Lăng Ông - Bà Chiểu), is a Vietnamese tomb located in Bình Thạnh District, Ho Chi Minh City, Vietnam. The tomb was originally built for Marshal Lê Văn Duyệt and his wife but later became some other Nguyễn dynasty's mandarins worship house.",
    "enWikiParagraphs": [
      "Tomb of Lê Văn Duyệt (Vietnamese: Lăng Tả quân Lê Văn Duyệt), also known as Tomb of the Marshal in Ba Chieu (Lăng Ông - Bà Chiểu), is a Vietnamese tomb located in Bình Thạnh District, Ho Chi Minh City, Vietnam. The tomb was originally built for Marshal Lê Văn Duyệt and his wife but later became some other Nguyễn dynasty's mandarins worship house.",
      "Lê Văn Duyệt (1763–1831) was a Vietnamese general who helped Nguyễn Ánh put down the Tây Sơn rebellion and unify Vietnam."
    ]
  },
  "chua-ba-thien-hau-cho-lon": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/Thien_Hau_Pagoda_%2810017896294%29.jpg/1280px-Thien_Hau_Pagoda_%2810017896294%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/H%E1%BB%99i_qu%C3%A1n_Tu%E1%BB%87_Th%C3%A0nh",
    "viWikiSummary": "Hội quán Tuệ Thành (chữ Hán: 穗城會館), thường được gọi là Miếu Thiên Hậu hay Chùa Bà Chợ Lớn, là một cơ sở tín ngưỡng thờ Thiên Hậu Thánh mẫu tọa lạc tại số 710 đường Nguyễn Trãi, phường Chợ Lớn (Quận 5 cũ), Thành phố Hồ Chí Minh.",
    "viWikiParagraphs": [
      "Hội quán Tuệ Thành (chữ Hán: 穗城會館), thường được gọi là Miếu Thiên Hậu hay Chùa Bà Chợ Lớn, là một cơ sở tín ngưỡng thờ Thiên Hậu Thánh mẫu tọa lạc tại số 710 đường Nguyễn Trãi, phường Chợ Lớn (Quận 5 cũ), Thành phố Hồ Chí Minh.",
      "Đây là một trong những nơi thờ tự cổ nhất của người Hoa đã gây dựng trên đất Chợ Lớn xưa."
    ],
    "enWikiSummary": "This is a list of Mazu temples, dedicated to Mazu (媽祖) also known as Tian Shang Sheng Mu (天上聖母) or Tian Hou (天后) Chinese Goddess of Sea and Patron Deity of fishermen, sailors and any occupations related to sea/ocean, also regarded as Ancestral Deity for the Lin (林) Clan.",
    "enWikiParagraphs": [
      "This is a list of Mazu temples, dedicated to Mazu (媽祖) also known as Tian Shang Sheng Mu (天上聖母) or Tian Hou (天后) Chinese Goddess of Sea and Patron Deity of fishermen, sailors and any occupations related to sea/ocean, also regarded as Ancestral Deity for the Lin (林) Clan.",
      "Koesel, Karrie J. (2014), Religion and Authoritarianism: Cooperation, Conflict, and the Consequences, Cambridge: Cambridge University Press, ISBN 9781107037069."
    ]
  },
  "ham-chua-vu-khi-biet-dong-sai-gon": {
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/1/17/US_Embassy%2C_Saigon%2C_January_1968_%28Colorized%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Bi%E1%BB%87t_%C4%91%E1%BB%99ng_S%C3%A0i_G%C3%B2n",
    "viWikiSummary": "Biệt động Sài Gòn là danh xưng của lực lượng đặc công quân Giải phóng miền Nam, chuyên làm nhiệm vụ tập kích nhằm vào các cơ sở của quân đội Hoa Kỳ và Việt Nam Cộng hòa cũng như các công trình công cộng trong môi trường đô thị tại Sài Gòn trong thời kỳ Chiến tranh Việt Nam.",
    "viWikiParagraphs": [
      "Biệt động Sài Gòn là danh xưng của lực lượng đặc công quân Giải phóng miền Nam, chuyên làm nhiệm vụ tập kích nhằm vào các cơ sở của quân đội Hoa Kỳ và Việt Nam Cộng hòa cũng như các công trình công cộng trong môi trường đô thị tại Sài Gòn trong thời kỳ Chiến tranh Việt Nam."
    ]
  },
  "dia-dao-cu-chi-ben-duoc": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/C%E1%BB%A7_Chi_tunnels_entrance.JPG/1280px-C%E1%BB%A7_Chi_tunnels_entrance.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/%C4%90%E1%BB%8Ba_%C4%91%E1%BA%A1o_C%E1%BB%A7_Chi",
    "viWikiSummary": "Địa đạo Củ Chi là một hệ thống phòng thủ trong lòng đất ở xã An Nhơn Tây, cách trung tâm Thành phố Hồ Chí Minh 69 km về hướng Tây-Bắc. Hệ thống này được quân kháng chiến Việt Minh và Mặt trận Dân tộc Giải phóng miền Nam Việt Nam đào trong thời kỳ Chiến tranh Đông Dương và Chiến tranh Việt Nam.",
    "viWikiParagraphs": [
      "Địa đạo Củ Chi là một hệ thống phòng thủ trong lòng đất ở xã An Nhơn Tây, cách trung tâm Thành phố Hồ Chí Minh 69 km về hướng Tây-Bắc. Hệ thống này được quân kháng chiến Việt Minh và Mặt trận Dân tộc Giải phóng miền Nam Việt Nam đào trong thời kỳ Chiến tranh Đông Dương và Chiến tranh Việt Nam.",
      "Sau chiến tranh, khu địa đạo Củ Chi trở thành di tích lịch sử cấp quốc gia. Năm 2015, khu di tích lịch sử địa đạo Củ Chi đón nhận danh hiệu Anh hùng Lao động do có thành tích đặc biệt xuất sắc trong lao động, sáng tạo. Trong 20 năm hoạt động, khu di tích đón hơn 20 triệu lượt khách trong và ngoài nước tới tham quan, tìm hiểu. Ngày 12 tháng 2 năm 2016, khu di tích đón nhận Bằng xếp hạng Di tích quốc gia đặc biệt.…"
    ],
    "enWikiSummary": "The tunnels of Củ Chi (Vietnamese: Địa đạo Củ Chi) are an immense network of connecting tunnels located in the Củ Chi District of Ho Chi Minh City (Saigon), Vietnam, and are part of a much larger network of tunnels that underlie much of the country. The Củ Chi tunnels were the location of several military campaigns during the Vietnam War, and were the Viet Cong's base of operations for the Tết Offensive in 1968.",
    "enWikiParagraphs": [
      "The tunnels of Củ Chi (Vietnamese: Địa đạo Củ Chi) are an immense network of connecting tunnels located in the Củ Chi District of Ho Chi Minh City (Saigon), Vietnam, and are part of a much larger network of tunnels that underlie much of the country. The Củ Chi tunnels were the location of several military campaigns during the Vietnam War, and were the Viet Cong's base of operations for the Tết Offensive in 1968."
    ]
  },
  "khu-du-tru-sinh-quyen-rung-sac-can-gio": {
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/e/e5/Mangrove_in_Can_Gio_forest.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Khu_d%E1%BB%B1_tr%E1%BB%AF_sinh_quy%E1%BB%83n_r%E1%BB%ABng_ng%E1%BA%ADp_m%E1%BA%B7n_C%E1%BA%A7n_Gi%E1%BB%9D",
    "viWikiSummary": "Khu dự trữ sinh quyển Cần Giờ còn gọi là Rừng Sác là một quần thể gồm các loài động, thực vật rừng trên cạn và thủy sinh, được hình thành trên vùng châu thổ rộng lớn của các cửa sông Đồng Nai, sông Sài Gòn và sông Vàm Cỏ. UNESCO đã công nhận đây là khu dự trữ sinh quyển thế giới vào ngày 21/1/2000 với hệ động thực vật đa dạng độc đáo điển hình của vùng ngập mặn. Nơi đây được công nhận là một khu du lịch trọng điểm quốc gia Việt Nam",
    "viWikiParagraphs": [
      "Khu dự trữ sinh quyển Cần Giờ còn gọi là Rừng Sác là một quần thể gồm các loài động, thực vật rừng trên cạn và thủy sinh, được hình thành trên vùng châu thổ rộng lớn của các cửa sông Đồng Nai, sông Sài Gòn và sông Vàm Cỏ. UNESCO đã công nhận đây là khu dự trữ sinh quyển thế giới vào ngày 21/1/2000 với hệ động thực vật đa dạng độc đáo điển hình của vùng ngập mặn. Nơi đây được công nhận là một khu du lịch trọng điểm quốc gia Việt Nam"
    ],
    "enWikiSummary": "Cần Giờ Biosphere Reserve (Vietnamese: Khu dự trữ sinh quyển rừng ngập mặn Cần Giờ) or simply known as Mangrove Forest (Rừng Sác) is a wetland located at the eponymous coastal district that 40 km southeast away from the centre of Ho Chi Minh City. This reserve has been listed as a biosphere reserve by UNESCO. The site is an important wildlife sanctuary in Vietnam as it is characterized by a wetland biosystem dominated by mangrove and many rare species.",
    "enWikiParagraphs": [
      "Cần Giờ Biosphere Reserve (Vietnamese: Khu dự trữ sinh quyển rừng ngập mặn Cần Giờ) or simply known as Mangrove Forest (Rừng Sác) is a wetland located at the eponymous coastal district that 40 km southeast away from the centre of Ho Chi Minh City. This reserve has been listed as a biosphere reserve by UNESCO. The site is an important wildlife sanctuary in Vietnam as it is characterized by a wetland biosystem dominated by mangrove and many rare species.",
      "The forest's area is 75,740 ha (757.4 km2), with over 150 botanical species."
    ]
  },
  "chua-giac-lam-tan-binh": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/ChuaGiacLam02.jpg/1280px-ChuaGiacLam02.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Ch%C3%B9a_Gi%C3%A1c_L%C3%A2m",
    "viWikiSummary": "Chùa Giác Lâm (tiếng Trung: 覺林寺:; Hán-Việt: Giác Lâm tự) còn có các tên khác: Cẩm Sơn, Sơn Can hay Cẩm Đệm; là một trong những ngôi chùa cổ nhất của Thành phố Hồ Chí Minh. Đây chính là tổ đình của phái Thiền Lâm Tế tông ở Nam Bộ.",
    "viWikiParagraphs": [
      "Chùa Giác Lâm (tiếng Trung: 覺林寺:; Hán-Việt: Giác Lâm tự) còn có các tên khác: Cẩm Sơn, Sơn Can hay Cẩm Đệm; là một trong những ngôi chùa cổ nhất của Thành phố Hồ Chí Minh. Đây chính là tổ đình của phái Thiền Lâm Tế tông ở Nam Bộ.",
      "Chùa Giác Lâm được cư sĩ Lý Thụy Long, người Minh Hương, quyên tiền xây dựng vào mùa xuân năm Giáp Tý (1744) đời chúa Nguyễn Phúc Khoát. Ban đầu chùa có tên là Sơn Can (sơn là núi, can là gò nông), về sau còn được gọi là Cẩm Sơn do chùa tọa lạc trên gò Cẩm Sơn. Ngoài ra, chùa còn có tên là Cẩm Đệm vì cư sĩ Thụy Long có tên riêng là Cẩm, chuyên nghề đan đệm bán, người địa phương gọi là ông Cẩm Đệm."
    ],
    "enWikiSummary": "Giác Lâm Temple (Vietnamese: Chùa Giác Lâm; chữ Hán: 覺林寺, Giác Lâm tự) is a historic Buddhist temple in Ho Chi Minh City (Saigon), the largest city in Vietnam. Built in 1744, it is one of the oldest temples in the city. It was officially listed as a state-cultural and historical site by the Ministry of Culture, Sports and Tourism in Vietnam on November 16, 1988, under Decision 1288VH/QĐ.",
    "enWikiParagraphs": [
      "Giác Lâm Temple (Vietnamese: Chùa Giác Lâm; chữ Hán: 覺林寺, Giác Lâm tự) is a historic Buddhist temple in Ho Chi Minh City (Saigon), the largest city in Vietnam. Built in 1744, it is one of the oldest temples in the city. It was officially listed as a state-cultural and historical site by the Ministry of Culture, Sports and Tourism in Vietnam on November 16, 1988, under Decision 1288VH/QĐ."
    ]
  },
  "chua-vinh-nghiem-quan-3": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/C%E1%BB%95ng_ch%C3%B9a_V%C4%A9nh_Nghi%C3%AAm.jpg/1280px-C%E1%BB%95ng_ch%C3%B9a_V%C4%A9nh_Nghi%C3%AAm.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Ch%C3%B9a_V%C4%A9nh_Nghi%C3%AAm_(Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh)",
    "viWikiSummary": "Chùa Vĩnh Nghiêm (chữ Hán: 永嚴寺) là một danh lam, hiện tọa lạc tại số 339 Nam Kỳ Khởi Nghĩa (gần cầu Công Lý), thuộc phường Xuân Hoà, Thành phố Hồ Chí Minh, Việt Nam.",
    "viWikiParagraphs": [
      "Chùa Vĩnh Nghiêm (chữ Hán: 永嚴寺) là một danh lam, hiện tọa lạc tại số 339 Nam Kỳ Khởi Nghĩa (gần cầu Công Lý), thuộc phường Xuân Hoà, Thành phố Hồ Chí Minh, Việt Nam.",
      "Từ miền Bắc, hai Hòa thượng là Thích Tâm Giác và Thích Thanh Kiểm vào miền Nam truyền bá đạo Phật, và sau đó đã cho xây dựng chùa Vĩnh Nghiêm. Họ lấy nguyên mẫu thiết kế từ một ngôi chùa gỗ cùng tên ở làng Đức La, xã Trí Yên, huyện Yên Dũng, tỉnh Bắc Giang; kiến lập từ đời vua Lý Thái Tổ, vốn là trung tâm truyền bá Phật giáo của Thiền phái Trúc Lâm."
    ],
    "enWikiSummary": "Vĩnh Nghiêm Pagoda (Chùa Vĩnh Nghiêm; literally Ever Solemn) is a pagoda in an area of 6,000 square metres (65,000 sq ft) at 339, Nam Kỳ Khởi Nghĩa street, Ward 7, District 3 Ho Chi Minh City. This is the first pagoda in Vietnam to be built in Vietnamese traditional architecture style but with concrete. The highest structure in this pagoda is the 7-story, 40-metre-high (130 ft) tower.",
    "enWikiParagraphs": [
      "Vĩnh Nghiêm Pagoda (Chùa Vĩnh Nghiêm; literally Ever Solemn) is a pagoda in an area of 6,000 square metres (65,000 sq ft) at 339, Nam Kỳ Khởi Nghĩa street, Ward 7, District 3 Ho Chi Minh City. This is the first pagoda in Vietnam to be built in Vietnamese traditional architecture style but with concrete. The highest structure in this pagoda is the 7-story, 40-metre-high (130 ft) tower."
    ]
  },
  "den-tuong-niem-cac-vua-hung-thu-duc": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/C%C3%B4ng_vi%C3%AAn_V%C4%83n_h%C3%B3a_l%E1%BB%8Bch_s%E1%BB%AD_d%C3%A2n_t%E1%BB%99c_qu%E1%BA%ADn_9.JPG/1280px-C%C3%B4ng_vi%C3%AAn_V%C4%83n_h%C3%B3a_l%E1%BB%8Bch_s%E1%BB%AD_d%C3%A2n_t%E1%BB%99c_qu%E1%BA%ADn_9.JPG?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/C%C3%B4ng_vi%C3%AAn_L%E1%BB%8Bch_s%E1%BB%AD_%E2%80%93_V%C4%83n_h%C3%B3a_D%C3%A2n_t%E1%BB%99c",
    "viWikiSummary": "Công viên Lịch sử Văn hóa Dân tộc là một công trình kiến trúc quy mô lớn được xây cất tại phường Long Bình và một phần phường Đông Hòa, Thành phố Hồ Chí Minh với chức năng là một công viên, điểm tham quan với chủ đề lịch sử và văn hóa của dân tộc Việt Nam. Đây được coi là công trình tiêu biểu của khu vực phía Nam và là nơi tôn vinh các giá trị văn hóa dân tộc Việt Nam.",
    "viWikiParagraphs": [
      "Công viên Lịch sử Văn hóa Dân tộc là một công trình kiến trúc quy mô lớn được xây cất tại phường Long Bình và một phần phường Đông Hòa, Thành phố Hồ Chí Minh với chức năng là một công viên, điểm tham quan với chủ đề lịch sử và văn hóa của dân tộc Việt Nam. Đây được coi là công trình tiêu biểu của khu vực phía Nam và là nơi tôn vinh các giá trị văn hóa dân tộc Việt Nam."
    ]
  },
  "nha-tho-tan-dinh": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/T%C3%A2n_%C4%90%E1%BB%8Bnh_Church_20190922.jpg/1280px-T%C3%A2n_%C4%90%E1%BB%8Bnh_Church_20190922.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Nh%C3%A0_th%E1%BB%9D_T%C3%A2n_%C4%90%E1%BB%8Bnh",
    "viWikiSummary": "Nhà thờ Tân Định (tên chính thức: Nhà thờ Thánh Tâm Chúa Giêsu, Tân Định) là một nhà thờ Công giáo tại Thành phố Hồ Chí Minh, thuộc giáo xứ Tân Định. Nhà thờ Tân Định cùng với Nhà thờ Đức Bà Sài Gòn là hai nhà thờ được xây dựng từ rất sớm và có quy mô lớn nhất tại thành phố này.",
    "viWikiParagraphs": [
      "Nhà thờ Tân Định (tên chính thức: Nhà thờ Thánh Tâm Chúa Giêsu, Tân Định) là một nhà thờ Công giáo tại Thành phố Hồ Chí Minh, thuộc giáo xứ Tân Định. Nhà thờ Tân Định cùng với Nhà thờ Đức Bà Sài Gòn là hai nhà thờ được xây dựng từ rất sớm và có quy mô lớn nhất tại thành phố này.",
      "Nhà thờ tọa lạc tại số 289 đường Hai Bà Trưng, phường Xuân Hòa, Thành phố Hồ Chí Minh, được khởi công vào năm 1870 và khánh thành vào ngày 16 tháng 12 năm 1876. Tổng thể mang phong cách kiến trúc Roman. Nhà thờ được sơn màu hồng phấn cả bên ngoài và bên trong từ năm 1957, khiến nhà thờ có biệt danh là \"nhà thờ màu hồng.\""
    ],
    "enWikiSummary": "Tân Định Church or Tân Định Parish Church (Vietnamese: Nhà thờ Tân Định, Giáo xứ Tân Định) is a Roman Catholic church in Ho Chi Minh City, Vietnam. Its formal name is the Church of the Sacred Heart of Jesus (Vietnamese: Nhà thờ Thánh Tâm Chúa Giêsu). Even though it is in District 3, the parish shares its name with neighbouring District 1's Tân Định ward as of Tân Định was the place name of a former village that the church was also included.",
    "enWikiParagraphs": [
      "Tân Định Church or Tân Định Parish Church (Vietnamese: Nhà thờ Tân Định, Giáo xứ Tân Định) is a Roman Catholic church in Ho Chi Minh City, Vietnam. Its formal name is the Church of the Sacred Heart of Jesus (Vietnamese: Nhà thờ Thánh Tâm Chúa Giêsu). Even though it is in District 3, the parish shares its name with neighbouring District 1's Tân Định ward as of Tân Định was the place name of a former village that the church was also included."
    ]
  },
  "pho-di-bo-nguyen-hue-chung-cu-42": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Nguyen_Hue_Street_2020.jpg/1280px-Nguyen_Hue_Street_2020.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/%C4%90%C6%B0%E1%BB%9Dng_Nguy%E1%BB%85n_Hu%E1%BB%87,_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh",
    "viWikiSummary": "Đường Nguyễn Huệ là một tuyến đường tại phường Sài Gòn (Quận 1 cũ), trung tâm Thành phố Hồ Chí Minh, chạy từ Trụ sở Ủy ban nhân dân Thành phố đến Bến Bạch Đằng, bờ sông Sài Gòn. Hiện nay chính giữa con đường này là một quảng trường đi bộ rộng 27 m được đưa vào sử dụng từ năm 2015, là quảng trường đi bộ đầu tiên của Việt Nam.",
    "viWikiParagraphs": [
      "Đường Nguyễn Huệ là một tuyến đường tại phường Sài Gòn (Quận 1 cũ), trung tâm Thành phố Hồ Chí Minh, chạy từ Trụ sở Ủy ban nhân dân Thành phố đến Bến Bạch Đằng, bờ sông Sài Gòn. Hiện nay chính giữa con đường này là một quảng trường đi bộ rộng 27 m được đưa vào sử dụng từ năm 2015, là quảng trường đi bộ đầu tiên của Việt Nam.",
      "Đường Nguyễn Huệ bắt đầu từ đường Lê Thánh Tôn ngay đối diện Trụ sở Ủy ban nhân dân Thành phố Hồ Chí Minh, cắt qua các con đường Lê Lợi, Nguyễn Thiệp, Tôn Thất Thiệp, Mạc Thị Bưởi, Huỳnh Thúc Kháng, Ngô Đức Kế, Hải Triều và kết thúc tại đường Tôn Đức Thắng đối diện với công viên Bến Bạch Đằng."
    ],
    "enWikiSummary": "Nguyễn Huệ Boulevard (Vietnamese: Đường Nguyễn Huệ) is a boulevard in District 1, downtown Ho Chi Minh City, Vietnam. Being one of Saigon's oldest thoroughfares, the boulevard has undergone several transformations; it is currently a famous pedestrian street in the city.",
    "enWikiParagraphs": [
      "Nguyễn Huệ Boulevard (Vietnamese: Đường Nguyễn Huệ) is a boulevard in District 1, downtown Ho Chi Minh City, Vietnam. Being one of Saigon's oldest thoroughfares, the boulevard has undergone several transformations; it is currently a famous pedestrian street in the city.",
      "The boulevard stretches from Lê Thánh Tôn Street, right across from Ho Chi Minh City Hall, to Tôn Đức Thắng Boulevard (Bạch Đằng Quay, the Saigon River waterfront)."
    ]
  },
  "ben-bach-dang-cau-ba-son": {
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/5/58/Saigon_Skyline.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/B%E1%BA%BFn_B%E1%BA%A1ch_%C4%90%E1%BA%B1ng",
    "viWikiSummary": "Bến Bạch Đằng là tên của khu vực công viên và bến sông bên bờ sông Sài Gòn tại Sài Gòn, trung tâm Thành phố Hồ Chí Minh, Việt Nam. Đây là nơi người dân thành phố và du khách tới vui chơi và là địa điểm ngắm pháo hoa mỗi dịp lễ, Tết.",
    "viWikiParagraphs": [
      "Bến Bạch Đằng là tên của khu vực công viên và bến sông bên bờ sông Sài Gòn tại Sài Gòn, trung tâm Thành phố Hồ Chí Minh, Việt Nam. Đây là nơi người dân thành phố và du khách tới vui chơi và là địa điểm ngắm pháo hoa mỗi dịp lễ, Tết.",
      "Bến Bạch Đằng ở địa chỉ số 2 đường Tôn Đức Thắng, nằm bên bờ tây sông Sài Gòn, gồm bến cảng và công viên dài 1,3 km, rộng 23.400 m²."
    ],
    "enWikiSummary": "Bạch Đằng Quay (Vietnamese: Bến Bạch Đằng) is a wharf and park with an address No.2 Tôn Đức Thắng Boulevard, Bến Nghé (now is Saigon ward), Ho Chi Minh City, Vietnam. It stretches along about 1.3 kilometres (0.81 mi) of the Saigon River from the Thủ Ngữ flagpole (Three-way junction of Bến Nghé Channel and Saigon River) to the site of the former Ba Son Shipyard (now the Saigon – Ba Son complex) and covers an area of 23,400 square metres (252,000 sq ft).",
    "enWikiParagraphs": [
      "Bạch Đằng Quay (Vietnamese: Bến Bạch Đằng) is a wharf and park with an address No.2 Tôn Đức Thắng Boulevard, Bến Nghé (now is Saigon ward), Ho Chi Minh City, Vietnam. It stretches along about 1.3 kilometres (0.81 mi) of the Saigon River from the Thủ Ngữ flagpole (Three-way junction of Bến Nghé Channel and Saigon River) to the site of the former Ba Son Shipyard (now the Saigon – Ba Son complex) and covers an area of 23,400 square metres (252,000 sq ft)."
    ]
  },
  "cot-co-thu-ngu": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/C%E1%BB%99t_c%E1%BB%9D_Th%E1%BB%A7_Ng%E1%BB%AF.JPG/1280px-C%E1%BB%99t_c%E1%BB%9D_Th%E1%BB%A7_Ng%E1%BB%AF.JPG?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/C%E1%BB%99t_c%E1%BB%9D_Th%E1%BB%A7_Ng%E1%BB%AF",
    "viWikiSummary": "Cột cờ Thủ Ngữ là một công trình nằm tại đường Tôn Đức Thắng, phường Sài Gòn, Thành phố Hồ Chí Minh, Việt Nam. Cột cờ được người Pháp xây dựng vào tháng 10 năm 1865 trên nền cũ của dinh quan thủ ngự chuyên chăm lo thương chính của nhà Nguyễn. Tính đến nay nó đã hơn 159 năm tuổi. Năm 2016, cột cờ Thủ Ngữ được thành phố xếp hạng là di tích lịch sử cấp TP.HCM.",
    "viWikiParagraphs": [
      "Cột cờ Thủ Ngữ là một công trình nằm tại đường Tôn Đức Thắng, phường Sài Gòn, Thành phố Hồ Chí Minh, Việt Nam. Cột cờ được người Pháp xây dựng vào tháng 10 năm 1865 trên nền cũ của dinh quan thủ ngự chuyên chăm lo thương chính của nhà Nguyễn. Tính đến nay nó đã hơn 159 năm tuổi. Năm 2016, cột cờ Thủ Ngữ được thành phố xếp hạng là di tích lịch sử cấp TP.HCM.",
      "Cột cờ Thủ Ngữ được người Pháp xây dựng vào tháng 10 năm 1865 với tên gọi lúc đầu là Mât des signaux, có nghĩa là Cột tín hiệu. Đúng như cái tên lúc đầu của nó, chức năng ban đầu của cột cờ là làm cột tín hiệu cho tàu bè ra vào luồng lạch khu vực Sài Gòn - Gia Định. Từ đó đến nay, cột cờ đã trải qua 159 tuổi với nhiều lần xuống cấp và trùng tu."
    ]
  },
  "cau-mong-sai-gon": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/M%E1%BB%91ng_Bridge_Ho_Chi_Minh_City.JPG/1280px-M%E1%BB%91ng_Bridge_Ho_Chi_Minh_City.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/C%E1%BA%A7u_M%E1%BB%91ng",
    "viWikiSummary": "Cầu Mống hay cầu Arc-en-ciel là một cây cầu bắc qua kênh Bến Nghé, nối liền giữa Quận 1 và Quận 4, Thành phố Hồ Chí Minh, Việt Nam. Đây được coi là một trong những cây cầu cổ xưa nhất tại thành phố này.",
    "viWikiParagraphs": [
      "Cầu Mống hay cầu Arc-en-ciel là một cây cầu bắc qua kênh Bến Nghé, nối liền giữa Quận 1 và Quận 4, Thành phố Hồ Chí Minh, Việt Nam. Đây được coi là một trong những cây cầu cổ xưa nhất tại thành phố này.",
      "Cầu do Công ty vận chuyển hàng hải Messageries Maritimes của Pháp bỏ vốn xây dựng vào năm 1881-1883, dài 128 mét, rộng 5,2 mét, lề bộ hành rộng 0,5 mét, xây bằng thép kiên cố."
    ],
    "enWikiSummary": "The Mong Bridge (Cầu Mống in Vietnamese, \"Rainbow bridge\") is a steel bridge across the Bến Nghé Channel, connecting District 1 and District 4 of Ho Chi Minh City. It is one of the oldest bridges in that city. Originally named Pont des Messageries maritimes, it was built in 1882 by Gustave Eiffel for the merchant shipping company Messageries maritimes, replacing a ferry route.",
    "enWikiParagraphs": [
      "The Mong Bridge (Cầu Mống in Vietnamese, \"Rainbow bridge\") is a steel bridge across the Bến Nghé Channel, connecting District 1 and District 4 of Ho Chi Minh City. It is one of the oldest bridges in that city. Originally named Pont des Messageries maritimes, it was built in 1882 by Gustave Eiffel for the merchant shipping company Messageries maritimes, replacing a ferry route."
    ]
  },
  "ho-con-rua-cong-truong-quoc-te": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d6/Cong_truong_con_rua.jpg/1280px-Cong_truong_con_rua.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/H%E1%BB%93_Con_R%C3%B9a",
    "viWikiSummary": "Hồ Con Rùa là tên gọi dân gian của một hồ phun nước nhân tạo nằm giữa nơi giao nhau của ba con đường Võ Văn Tần, Phạm Ngọc Thạch và Trần Cao Vân, phường Xuân Hòa (Quận 3 cũ), Thành phố Hồ Chí Minh, tạo thành một nút giao thông cùng mức kiểu bùng binh. Khu vực này có tên chính thức là Công trường Quốc tế, hiện nay là một trong những nơi hoạt động ẩm thực gần như từ sáng đến đêm, với rất nhiều tiệm cà phê và hàng quán xung quanh.",
    "viWikiParagraphs": [
      "Hồ Con Rùa là tên gọi dân gian của một hồ phun nước nhân tạo nằm giữa nơi giao nhau của ba con đường Võ Văn Tần, Phạm Ngọc Thạch và Trần Cao Vân, phường Xuân Hòa (Quận 3 cũ), Thành phố Hồ Chí Minh, tạo thành một nút giao thông cùng mức kiểu bùng binh. Khu vực này có tên chính thức là Công trường Quốc tế, hiện nay là một trong những nơi hoạt động ẩm thực gần như từ sáng đến đêm, với rất nhiều tiệm cà phê và hàng quán xung quanh."
    ]
  },
  "thap-bitexco-saigon-skydeck": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/DJI_0550-HDR-Pano_Bitexco_Financial_Tower.jpg/1280px-DJI_0550-HDR-Pano_Bitexco_Financial_Tower.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Bitexco_Financial_Tower",
    "viWikiSummary": "Bitexco Financial Tower hay Tháp Tài chính Bitexco là một tòa nhà chọc trời được xây dựng tại phường Sài Gòn, Thành phố Hồ Chí Minh. Tòa nhà được xây dựng trên diện tích gần 6.100 m². Tổng vốn đầu tư ước tính khoảng 220 triệu USD, được tập đoàn Bitexco Group có trụ sở tại Hà Nội đầu tư xây dựng.",
    "viWikiParagraphs": [
      "Bitexco Financial Tower hay Tháp Tài chính Bitexco là một tòa nhà chọc trời được xây dựng tại phường Sài Gòn, Thành phố Hồ Chí Minh. Tòa nhà được xây dựng trên diện tích gần 6.100 m². Tổng vốn đầu tư ước tính khoảng 220 triệu USD, được tập đoàn Bitexco Group có trụ sở tại Hà Nội đầu tư xây dựng."
    ],
    "enWikiSummary": "Bitexco Financial Tower (Vietnamese: Tháp Tài chính Bitexco) is a skyscraper in Financial District, Saigon, Ho Chi Minh City, Vietnam (next to the city's state treasury). At its completion in 2010, it became the tallest building in Vietnam and kept this status until January 2011, when it was surpassed by Keangnam Hanoi Landmark Tower.",
    "enWikiParagraphs": [
      "Bitexco Financial Tower (Vietnamese: Tháp Tài chính Bitexco) is a skyscraper in Financial District, Saigon, Ho Chi Minh City, Vietnam (next to the city's state treasury). At its completion in 2010, it became the tallest building in Vietnam and kept this status until January 2011, when it was surpassed by Keangnam Hanoi Landmark Tower.",
      "The tower is owned by Bitexco Group, a Vietnamese multi-industry corporation, with a focus on real estate development. The building also houses the Ho Chi Minh City representative office of Bitexco Group, while its headquarters are in Hanoi."
    ]
  },
  "landmark-81-central-park": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Ho_Chi_Minh_City_panorama_2019_%28cropped%29.jpg/1280px-Ho_Chi_Minh_City_panorama_2019_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Landmark_81",
    "viWikiSummary": "Vincom Landmark 81, hay đơn giản là Landmark 81 hoặc còn được gọi là The Landmark 81, là tòa nhà chọc trời siêu cao ở Thành phố Hồ Chí Minh thuộc tổ hợp dự án Vinhomes Central Park trị giá 1,4 tỷ USD do Công ty Cổ phần Đầu tư xây dựng Tân Liên Phát thuộc Vingroup làm chủ đầu tư. Landmark 81 là tòa nhà cao nhất Việt Nam, tòa nhà cao thứ hai Đông Nam Á (bị phá kỉ lục là tòa nhà cao nhất bởi Merdeka 118 vào năm 2022), và là tòa nhà cao thứ 17 trên thế giới.",
    "viWikiParagraphs": [
      "Vincom Landmark 81, hay đơn giản là Landmark 81 hoặc còn được gọi là The Landmark 81, là tòa nhà chọc trời siêu cao ở Thành phố Hồ Chí Minh thuộc tổ hợp dự án Vinhomes Central Park trị giá 1,4 tỷ USD do Công ty Cổ phần Đầu tư xây dựng Tân Liên Phát thuộc Vingroup làm chủ đầu tư. Landmark 81 là tòa nhà cao nhất Việt Nam, tòa nhà cao thứ hai Đông Nam Á (bị phá kỉ lục là tòa nhà cao nhất bởi Merdeka 118 vào năm 2022), và là tòa nhà cao thứ 17 trên thế giới."
    ],
    "enWikiSummary": "Landmark 81 is a supertall skyscraper in Ho Chi Minh City, Vietnam. It is primarily invested in and developed by Vinhomes, the largest Vietnamese real-estate developer. Landmark 81 holds the position of the tallest building in Vietnam, the second-tallest building in Southeast Asia, as well as the seventeenth-tallest building in the world overall.",
    "enWikiParagraphs": [
      "Landmark 81 is a supertall skyscraper in Ho Chi Minh City, Vietnam. It is primarily invested in and developed by Vinhomes, the largest Vietnamese real-estate developer. Landmark 81 holds the position of the tallest building in Vietnam, the second-tallest building in Southeast Asia, as well as the seventeenth-tallest building in the world overall."
    ]
  },
  "cau-anh-sao-ho-ban-nguyet": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Khu_%C4%91%C3%B4_th%E1%BB%8B_Ph%C3%BA_M%E1%BB%B9_H%C6%B0ng_Qu%E1%BA%ADn_7_Th%C3%A0nh_Ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg/1280px-Khu_%C4%91%C3%B4_th%E1%BB%8B_Ph%C3%BA_M%E1%BB%B9_H%C6%B0ng_Qu%E1%BA%ADn_7_Th%C3%A0nh_Ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Khu_%C4%91%C3%B4_th%E1%BB%8B_Ph%C3%BA_M%E1%BB%B9_H%C6%B0ng",
    "viWikiSummary": "Khu đô thị Phú Mỹ Hưng là một khu đô thị thuộc các phường Tân Hưng và Tân Mỹ toạ lạc ở phía Nam Thành phố Hồ Chí Minh. Đây là nơi tập trung sinh sống của những người có thu nhập cao, do Công ty TNHH Phát triển Phú Mỹ Hưng (tên cũ: Công ty TNHH Liên doanh Phú Mỹ Hưng) quản lý.",
    "viWikiParagraphs": [
      "Khu đô thị Phú Mỹ Hưng là một khu đô thị thuộc các phường Tân Hưng và Tân Mỹ toạ lạc ở phía Nam Thành phố Hồ Chí Minh. Đây là nơi tập trung sinh sống của những người có thu nhập cao, do Công ty TNHH Phát triển Phú Mỹ Hưng (tên cũ: Công ty TNHH Liên doanh Phú Mỹ Hưng) quản lý.",
      "Ngày 26 tháng 6 năm 2008, Bộ Xây dựng và Uỷ ban nhân dân Thành phố Hồ Chí Minh công nhận đô thị Phú Mỹ Hưng là \"Khu đô thị kiểu mẫu\" của Việt Nam."
    ],
    "enWikiSummary": "Phú Mỹ Hưng Urban Area (Vietnamese: Khu đô thị Phú Mỹ Hưng) or Saigon South Urban Development (Khu đô thị Nam Sài Gòn, Khu đô thị Nam Thành phố) is a planned community in District 7, District 8 and Bình Chánh district, Ho Chi Minh City. The area is managed by the Phu My Hung Development Corporation.",
    "enWikiParagraphs": [
      "Phú Mỹ Hưng Urban Area (Vietnamese: Khu đô thị Phú Mỹ Hưng) or Saigon South Urban Development (Khu đô thị Nam Sài Gòn, Khu đô thị Nam Thành phố) is a planned community in District 7, District 8 and Bình Chánh district, Ho Chi Minh City. The area is managed by the Phu My Hung Development Corporation.",
      "On June 26, 2008, the Ministry of Construction and the People's Committee of Ho Chi Minh City recognized Phú Mỹ Hưng urban area as a \"model urban area\" of Vietnam."
    ]
  },
  "den-hindu-mariamman": {
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/4/48/Mariamman_Temple%2C_HCMC.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/%C4%90%E1%BB%81n_B%C3%A0_%E1%BA%A4n_(Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh)",
    "viWikiSummary": "Đền Bà Ấn còn gọi là Đền Bà Mariamman là một ngôi đền thờ nữ thần Mariamman của Ấn Độ giáo ở Thành phố Hồ Chí Minh, Việt Nam. Đền này được Palaniappa Thevar từ Pattukkottai, huyện Thanjavur, một cộng đồng thương mại xứ Tamil Nadu, Ấn Độ xây dựng vào cuối thế kỷ 19.",
    "viWikiParagraphs": [
      "Đền Bà Ấn còn gọi là Đền Bà Mariamman là một ngôi đền thờ nữ thần Mariamman của Ấn Độ giáo ở Thành phố Hồ Chí Minh, Việt Nam. Đền này được Palaniappa Thevar từ Pattukkottai, huyện Thanjavur, một cộng đồng thương mại xứ Tamil Nadu, Ấn Độ xây dựng vào cuối thế kỷ 19."
    ],
    "enWikiSummary": "The Mariamman Temple in Ho Chi Minh City, Vietnam, is a temple dedicated to the Hindu goddess Mariamman. It was built in the late 19th century by the Nagarathar a trade community from Tamil Nadu, India.",
    "enWikiParagraphs": [
      "The Mariamman Temple in Ho Chi Minh City, Vietnam, is a temple dedicated to the Hindu goddess Mariamman. It was built in the late 19th century by the Nagarathar a trade community from Tamil Nadu, India.",
      "In the outer hall, Parvati's sons Ganesha and Muruga are on her right and left, respectively. The Raja-gopuram of this temple is about 12m high and contains a number of statues. Statues of Lakshmi, Murugan and other devas dot the hallways."
    ]
  },
  "thanh-duong-hoi-giao-saigon": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Mosque_in_Ho_Chi_Minh_City.jpg/1280px-Mosque_in_Ho_Chi_Minh_City.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://en.wikipedia.org/wiki/Saigon_Central_Mosque",
    "enWikiSummary": "The Saigon Central Mosque (Vietnamese: Nhà thờ Hồi giáo Musulman) is a mosque in Ho Chi Minh City, Vietnam and it is one of the ancient and historic Mosque in the region. It was completed in the Year 1935 since the construction began in 1934 December 21 and was led by JM Mohamed Ismael, Chief of the Muslims Congregations, Head of British Indian Muslims Community.",
    "enWikiParagraphs": [
      "The Saigon Central Mosque (Vietnamese: Nhà thờ Hồi giáo Musulman) is a mosque in Ho Chi Minh City, Vietnam and it is one of the ancient and historic Mosque in the region. It was completed in the Year 1935 since the construction began in 1934 December 21 and was led by JM Mohamed Ismael, Chief of the Muslims Congregations, Head of British Indian Muslims Community.",
      "The mosque was established in 1935 as the India Jamia Muslim Mosque."
    ]
  },
  "nha-tho-huyen-sy": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/Nh%C3%A0_th%E1%BB%9D_huy%E1%BB%87n_S%E1%BB%B9_%E1%BB%9F_HCM.jpg/1280px-Nh%C3%A0_th%E1%BB%9D_huy%E1%BB%87n_S%E1%BB%B9_%E1%BB%9F_HCM.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Nh%C3%A0_th%E1%BB%9D_Huy%E1%BB%87n_S%E1%BB%B9",
    "viWikiSummary": "Nhà thờ Huyện Sỹ (tên chính thức là: Nhà thờ Thánh Philipphê Tông đồ) là một nhà thờ Công giáo cổ hơn 100 tuổi, tọa lạc tại số 1 đường Tôn Thất Tùng, phường Bến Thành, Thành phố Hồ Chí Minh, Việt Nam. Đây là nhà thờ của giáo xứ Chợ Đũi thuộc Tổng giáo phận Thành phố Hồ Chí Minh.",
    "viWikiParagraphs": [
      "Nhà thờ Huyện Sỹ (tên chính thức là: Nhà thờ Thánh Philipphê Tông đồ) là một nhà thờ Công giáo cổ hơn 100 tuổi, tọa lạc tại số 1 đường Tôn Thất Tùng, phường Bến Thành, Thành phố Hồ Chí Minh, Việt Nam. Đây là nhà thờ của giáo xứ Chợ Đũi thuộc Tổng giáo phận Thành phố Hồ Chí Minh.",
      "Nhà thờ do ông bà Lê Phát Đạt, tức Huyện Sỹ, hiến đất và xuất 1/7 gia tài để xây dựng, thời giá lúc bấy giờ là khoảng trên 30 muôn (mười ngàn) đồng bạc Đông Dương. Khởi công xây dựng năm 1902 theo thiết kế của linh mục Bouttier, đến 1905 thì được khánh thành. Nhà thờ tọa lạc trên một khu đất cao và rộng hơn một mẫu, nằm ở góc đường Frère Louis (nay là đường Nguyễn Trãi) và Frère Guilleraut (nay là đường Tôn Thất Tùng)."
    ]
  },
  "bao-tang-ton-duc-thang": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/B%E1%BA%BFn_Ngh%C3%A9%2C_Qu%E1%BA%ADn_1%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_B%E1%BA%A3o_t%C3%A0ng_T%C3%B4n_%C4%90%E1%BB%A9c_Th%E1%BA%AFng_-_panoramio.jpg/1280px-B%E1%BA%BFn_Ngh%C3%A9%2C_Qu%E1%BA%ADn_1%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_B%E1%BA%A3o_t%C3%A0ng_T%C3%B4n_%C4%90%E1%BB%A9c_Th%E1%BA%AFng_-_panoramio.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/B%E1%BA%A3o_t%C3%A0ng_T%C3%B4n_%C4%90%E1%BB%A9c_Th%E1%BA%AFng",
    "viWikiSummary": "Bảo tàng Tôn Đức Thắng là một bảo tàng lưu niệm danh nhân ở Việt Nam, tọa lạc tại địa chỉ số 5 đường Tôn Đức Thắng, phường Sài Gòn, Thành phố Hồ Chí Minh. Bảo tàng có nhiệm vụ nghiên cứu, sưu tầm, kiểm kê, bảo quản trưng bày, nơi lưu giữ và giới thiệu với khách tham quan những tài liệu, hiện vật có liên quan đến cuộc đời và sự nghiệp cách mạng của Chủ tịch Tôn Đức Thắng, tình cảm của nhân dân cả nước và bè bạn quốc tế đối với ông, nhằm mục đích là nơi giáo…",
    "viWikiParagraphs": [
      "Bảo tàng Tôn Đức Thắng là một bảo tàng lưu niệm danh nhân ở Việt Nam, tọa lạc tại địa chỉ số 5 đường Tôn Đức Thắng, phường Sài Gòn, Thành phố Hồ Chí Minh. Bảo tàng có nhiệm vụ nghiên cứu, sưu tầm, kiểm kê, bảo quản trưng bày, nơi lưu giữ và giới thiệu với khách tham quan những tài liệu, hiện vật có liên quan đến cuộc đời và sự nghiệp cách mạng của Chủ tịch Tôn Đức Thắng, tình cảm của nhân dân cả nước và bè bạn quốc tế đối với ông, nhằm mục đích là nơi giáo…"
    ]
  },
  "bao-tang-phu-nu-nam-bo": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/Mission_letter_from_the_southern_Vietnamese_Communist_Party_to_Ho_Thi_Bi%2C_who_led_the_economic_affairs_of_a_resistance_group%2C_Saigon%2C_1951_-_Vietnamese_Women%27s_Museum_-_Hanoi%2C_Vietnam_-_DSC04202.JPG/1280px-thumbnail.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/B%E1%BA%A3o_t%C3%A0ng_Ph%E1%BB%A5_n%E1%BB%AF_Nam_B%E1%BB%99",
    "viWikiSummary": "Bảo tàng Phụ nữ Nam Bộ ngụ tại 202 Võ Thị Sáu, Xuân Hòa, Thành phố Hồ Chí Minh. Bảo tàng có diện tích trưng bày 2000 m² bao gồm 10 phòng trưng bày về truyền thống xây dựng và bảo vệ tổ quốc của phụ nữ Nam Bộ. Tòa nhà của bảo tàng hiện nay có 4 tầng lầu. Hội trường có khả năng chứa gần 1.000 người và được xây dựng trên diện tích sử dụng 5.410,5m2. Hệ thống kho bảo quản có diện tích trên 700m2.",
    "viWikiParagraphs": [
      "Bảo tàng Phụ nữ Nam Bộ ngụ tại 202 Võ Thị Sáu, Xuân Hòa, Thành phố Hồ Chí Minh. Bảo tàng có diện tích trưng bày 2000 m² bao gồm 10 phòng trưng bày về truyền thống xây dựng và bảo vệ tổ quốc của phụ nữ Nam Bộ. Tòa nhà của bảo tàng hiện nay có 4 tầng lầu. Hội trường có khả năng chứa gần 1.000 người và được xây dựng trên diện tích sử dụng 5.410,5m2. Hệ thống kho bảo quản có diện tích trên 700m2.",
      "Các hiện vật được phân loại thành 24 sưu tập dựa trên chủ đề và chất liệu. Trong số này, có 6 sưu tập chứa những hiện vật quý hiếm. Ngoài ra, thư viện của bảo tàng có hơn 11.000 cuốn sách chuyên đề về phụ nữ."
    ],
    "enWikiSummary": "The Southern Women's Museum (Vietnamese: Bảo tàng Phụ nữ Nam Bộ) is a history museum in Ho Chi Minh City, Vietnam, dedicated to the contributions of women in southern Vietnam to national building, defense, and cultural preservation. Established in 1985, it houses over 31,000 artifacts, focusing on revolutionary struggles, traditional crafts, and ethnographic elements.",
    "enWikiParagraphs": [
      "The Southern Women's Museum (Vietnamese: Bảo tàng Phụ nữ Nam Bộ) is a history museum in Ho Chi Minh City, Vietnam, dedicated to the contributions of women in southern Vietnam to national building, defense, and cultural preservation. Established in 1985, it houses over 31,000 artifacts, focusing on revolutionary struggles, traditional crafts, and ethnographic elements."
    ]
  },
  "bao-tang-biet-dong-sai-gon-145": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Tran_quang_khai-T%C3%A2n_%C4%90%E1%BB%8Bnh%2C_Qu%E1%BA%ADn_1%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg/1280px-Tran_quang_khai-T%C3%A2n_%C4%90%E1%BB%8Bnh%2C_Qu%E1%BA%ADn_1%2C_TPHCM%2C_Vi%E1%BB%87t_Nam_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
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
    ]
  },
  "hoi-quan-nghia-an-chua-ong": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Nghia_An_Hoi_Quan_Pagoda_%2810018256906%29.jpg/1280px-Nghia_An_Hoi_Quan_Pagoda_%2810018256906%29.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/H%E1%BB%99i_qu%C3%A1n_Ngh%C4%A9a_An",
    "viWikiSummary": "Hội quán Nghĩa An (chữ Hán: 義安會館), thường được gọi là Miếu Quan Đế hay Chùa Ông, là một cơ sở tín ngưỡng của người Tiều tại 678 đường Nguyễn Trãi, thuộc Phường Chợ Lớn, Thành phố Hồ Chí Minh, Việt Nam.",
    "viWikiParagraphs": [
      "Hội quán Nghĩa An (chữ Hán: 義安會館), thường được gọi là Miếu Quan Đế hay Chùa Ông, là một cơ sở tín ngưỡng của người Tiều tại 678 đường Nguyễn Trãi, thuộc Phường Chợ Lớn, Thành phố Hồ Chí Minh, Việt Nam.",
      "Đây không chỉ là nơi chiêm bái của người Tiều tại Sài Gòn, mà còn là một công trình có giá trị về kiến trúc và nghệ thuật ở nửa cuối thế kỷ 19 - đầu thế kỷ 20. Vì vậy, ngày 7 tháng 11 năm 1993, Bộ Văn hóa - Thông tin đã ký quyết định số 43-VH/QĐ công nhận ngôi miếu là di tích kiến trúc nghệ thuật cấp quốc gia."
    ]
  },
  "hoi-quan-on-lang-chua-quan-am": {
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Quan_%C3%82m_Pagoda_-_Front_entrance_edited.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/H%E1%BB%99i_qu%C3%A1n_%C3%94n_L%C4%83ng",
    "viWikiSummary": "Hội quán Ôn Lăng (chữ Hán: 溫陵會館, hay Ôn Lăng hội quán) còn được gọi là chùa Ôn Lăng, chùa Quan Âm hay chùa Ông Lào; là một ngôi chùa của người Việt gốc Hoa, hiện tọa lạc tại số 12 đường Lão Tử, Phường Chợ Lớn, Thành phố Hồ Chí Minh (Việt Nam).",
    "viWikiParagraphs": [
      "Hội quán Ôn Lăng (chữ Hán: 溫陵會館, hay Ôn Lăng hội quán) còn được gọi là chùa Ôn Lăng, chùa Quan Âm hay chùa Ông Lào; là một ngôi chùa của người Việt gốc Hoa, hiện tọa lạc tại số 12 đường Lão Tử, Phường Chợ Lớn, Thành phố Hồ Chí Minh (Việt Nam).",
      "Ôn Lăng là tên cổ của phủ Tuyền Châu ở Phúc Kiến – vì hội quán này nguyên do người Hoa gốc Phúc Kiến ở Tuyền Châu lập nên nên người ta dùng cái tên Ôn Lăng để đặt cho hội quán. Trong tiếng Hoa, \"Ôn\" (溫) có nghĩa là ấm (vừa phải, dễ chịu), nhu hòa; còn \"Lăng\" (陵) có nghĩa là gò đất, đồi – cái tên này được cho có từ thời nhà Đường hoặc sớm hơn. Tại thành phố Tuyền Châu, cái tên Ôn Lăng có thể được dễ dàng nhìn thất ở trên nhiều công trình cổ."
    ],
    "enWikiSummary": "The Ôn Lăng Assembly Hall (Hội quán Ôn Lăng / 溫陵會館), also known as the Quan Âm Temple (Chùa Quân Âm), is a Chinese-style Buddhist temple located on Lão Tử Street in Chợ Lớn ward, Ho Chi Minh City, Vietnam. Founded in the 19th century, it is dedicated to Guanyin (Vietnamese: Quan Âm), the Chinese goddess of mercy and the Chinese form of the Indian bodhisattva Avalokiteshvara.",
    "enWikiParagraphs": [
      "The Ôn Lăng Assembly Hall (Hội quán Ôn Lăng / 溫陵會館), also known as the Quan Âm Temple (Chùa Quân Âm), is a Chinese-style Buddhist temple located on Lão Tử Street in Chợ Lớn ward, Ho Chi Minh City, Vietnam. Founded in the 19th century, it is dedicated to Guanyin (Vietnamese: Quan Âm), the Chinese goddess of mercy and the Chinese form of the Indian bodhisattva Avalokiteshvara."
    ]
  },
  "chua-van-phat-quan-5": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/Ten_Thousand_Buddha_Pagoda_in_HCMC.jpg/1280px-Ten_Thousand_Buddha_Pagoda_in_HCMC.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
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
    ]
  },
  "nha-tho-cho-quan": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Nh%C3%A0_th%E1%BB%9D_Th%C3%A1nh_T%C3%A2m_Ch%C3%BAa_Gi%C3%AAsu%2C_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg/1280px-Nh%C3%A0_th%E1%BB%9D_Th%C3%A1nh_T%C3%A2m_Ch%C3%BAa_Gi%C3%AAsu%2C_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Nh%C3%A0_th%E1%BB%9D_Ch%E1%BB%A3_Qu%C3%A1n",
    "viWikiSummary": "Nhà thờ Chợ Quán (tên hiệu: Nhà thờ Thánh Tâm Chúa Giêsu) là một nhà thờ Công giáo tại Thành phố Hồ Chí Minh, thuộc giáo xứ Chợ Quán, tọa lạc tại số 120 đường Trần Bình Trọng, phường Chợ Quán, thành phố Hồ Chí Minh. Nhà thờ có kiến trúc Romanesque, đã nhiều lần bị phá hủy rồi lại được xây lại vào các năm 1727, 1733, 1793, 1862, 1882 và ngôi nhà thờ hiện nay được khánh thành vào năm 1896. Nhà thờ Chợ Quán là nhà thờ cổ nhất Thành phố Hồ Chí Minh.",
    "viWikiParagraphs": [
      "Nhà thờ Chợ Quán (tên hiệu: Nhà thờ Thánh Tâm Chúa Giêsu) là một nhà thờ Công giáo tại Thành phố Hồ Chí Minh, thuộc giáo xứ Chợ Quán, tọa lạc tại số 120 đường Trần Bình Trọng, phường Chợ Quán, thành phố Hồ Chí Minh. Nhà thờ có kiến trúc Romanesque, đã nhiều lần bị phá hủy rồi lại được xây lại vào các năm 1727, 1733, 1793, 1862, 1882 và ngôi nhà thờ hiện nay được khánh thành vào năm 1896. Nhà thờ Chợ Quán là nhà thờ cổ nhất Thành phố Hồ Chí Minh.",
      "Họ đạo Chợ Quán là họ đạo lâu đời nhất của Tổng giáo phận Thành phố Hồ Chí Minh, thành lập vào năm 1722. Trương Vĩnh Ký cho rằng những người lập nên họ đạo là lưu dân đến từ thuộc phường Thợ Đức ở Huế. Đến năm 1725, họ đạo đã có khoảng 300 bổn đạo. Chợ Quán trở thành trung tâm đón tiếp lưu dân từ miền Trung vào."
    ]
  },
  "lang-du-lich-binh-quoi": {
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/7/70/Thanh_Da_area.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/B%C3%ACnh_Qu%E1%BB%9Bi_%E2%80%93_Thanh_%C4%90a",
    "viWikiSummary": "Bình Quới – Thanh Đa là một bán đảo (thường được gọi tắt là bán đảo Thanh Đa hoặc bán đảo Bình Quới) nằm bên sông Sài Gòn thuộc phường Bình Quới, Thành phố Hồ Chí Minh, Việt Nam.",
    "viWikiParagraphs": [
      "Bình Quới – Thanh Đa là một bán đảo (thường được gọi tắt là bán đảo Thanh Đa hoặc bán đảo Bình Quới) nằm bên sông Sài Gòn thuộc phường Bình Quới, Thành phố Hồ Chí Minh, Việt Nam.",
      "Tuy nằm giữa lòng thành phố nhưng hiện nay bán đảo này vẫn như một miền quê do dự án quy hoạch đã bị treo hơn 25 năm qua. Cảnh quan thường gặp ở đây là những ruộng lúa, ao, đầm, đối lập với những cao ốc, căn hộ, khu biệt thự phía bên kia sông Sài Gòn thuộc khu vực Thảo Điền, phường An Khánh."
    ]
  },
  "hem-hao-si-phuong-cho-lon": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/HCMC_Binh_Tay.jpg/1280px-HCMC_Binh_Tay.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Ch%E1%BB%A3_L%E1%BB%9Bn",
    "viWikiSummary": "Chợ Lớn (chữ Hán: 堤岸; âm Hán-Việt: Đê Ngạn; âm Quảng Đông: Thầy Ngòn) là một khu vực đông Hoa kiều sinh sống nằm ven kênh Tàu Hủ trải dài trên địa bàn Quận 5 và Quận 6 cũ, về phía nam tới Quận 8 cũ, về phía bắc tới Quận 10 và Quận 11 cũ ở Thành phố Hồ Chí Minh, Việt Nam. Khu phố Chợ Lớn đã có Hoa kiều sinh sống từ lâu và được coi là phố người Hoa lớn nhất thế giới tính theo diện tích.",
    "viWikiParagraphs": [
      "Chợ Lớn (chữ Hán: 堤岸; âm Hán-Việt: Đê Ngạn; âm Quảng Đông: Thầy Ngòn) là một khu vực đông Hoa kiều sinh sống nằm ven kênh Tàu Hủ trải dài trên địa bàn Quận 5 và Quận 6 cũ, về phía nam tới Quận 8 cũ, về phía bắc tới Quận 10 và Quận 11 cũ ở Thành phố Hồ Chí Minh, Việt Nam. Khu phố Chợ Lớn đã có Hoa kiều sinh sống từ lâu và được coi là phố người Hoa lớn nhất thế giới tính theo diện tích.",
      "Khu vực này trước kia lập thành một thành phố riêng biệt với Sài Gòn, gọi là thành phố Chợ Lớn. Trong những năm 1930-1950 do quá trình đô thị hóa, Sài Gòn và Chợ Lớn đã sáp nhập với nhau."
    ],
    "enWikiSummary": "Chợ Lớn (Chinese: 堤岸), usually anglicized as \"Cholon\" in English sources, is an unofficial quarter of Ho Chi Minh City, Vietnam. Historically a city separate from Sài Gòn prior to its urbanization in the 1930s-1950s, the quarter has long been inhabited by Chinese people and is considered the largest Chinatown in the world by area.",
    "enWikiParagraphs": [
      "Chợ Lớn (Chinese: 堤岸), usually anglicized as \"Cholon\" in English sources, is an unofficial quarter of Ho Chi Minh City, Vietnam. Historically a city separate from Sài Gòn prior to its urbanization in the 1930s-1950s, the quarter has long been inhabited by Chinese people and is considered the largest Chinatown in the world by area.",
      "Chợ Lớn lies on the west bank of the Saigon River, and spans across all of former District 5 and District 6. The quarter borders the former District 8 (along the Tàu Hủ Canal) to the south, and the former Districts 10 & 11 to the north."
    ]
  },
  "cho-binh-tay-cho-lon": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Vn-hcm-cho-binh-tay-27-07-07.JPG/1280px-Vn-hcm-cho-binh-tay-27-07-07.JPG?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Ch%E1%BB%A3_B%C3%ACnh_T%C3%A2y",
    "viWikiSummary": "Chợ Bình Tây, còn được gọi là Chợ Lớn Mới, là một ngôi chợ tại phường Bình Tây (Quận 6 cũ), Thành phố Hồ Chí Minh, tọa lạc trong khu vực gọi là Chợ Lớn.",
    "viWikiParagraphs": [
      "Chợ Bình Tây, còn được gọi là Chợ Lớn Mới, là một ngôi chợ tại phường Bình Tây (Quận 6 cũ), Thành phố Hồ Chí Minh, tọa lạc trong khu vực gọi là Chợ Lớn.",
      "Chợ Bình Tây nằm trong khuôn viên rộng 25.000 m², nằm giữa 4 tuyến đường Tháp Mười - Lê Tấn Kế - Phan Văn Khỏe - Trần Bình. Chợ này có mặt bằng hình chữ nhật, 12 cổng (gồm cả chính lẫn phụ) và được thiết kế theo lối kiến trúc Á Đông."
    ],
    "enWikiSummary": "Bình Tây Market (Vietnamese: Chợ Bình Tây, Chinese: 平西市場) is the largest market in Chợ Lớn; located in Bình Tây ward, Ho Chi Minh City, Vietnam. Prior to 1975, it was also referred to as \"Chợ Lớn mới\". (lit. 'new big market') to differentiate from its predecessor, \"Chợ Lớn cũ\" (lit. 'old / former big market').",
    "enWikiParagraphs": [
      "Bình Tây Market (Vietnamese: Chợ Bình Tây, Chinese: 平西市場) is the largest market in Chợ Lớn; located in Bình Tây ward, Ho Chi Minh City, Vietnam. Prior to 1975, it was also referred to as \"Chợ Lớn mới\". (lit. 'new big market') to differentiate from its predecessor, \"Chợ Lớn cũ\" (lit. 'old / former big market').",
      "Prior to the market's construction in 1928, there had, in its place, existed another market (located in modern-day Chợ Lớn Post Office). Nicknamed the \"Old Market\" (Vietnamese: Chợ Lớn cũ; Chinese: 舊街市), its subsequent destruction during a fire led to construction of the \"New Market\" (modern-day Bình Tây Market), hence its alias."
    ]
  },
  "bao-tang-y-hoc-co-truyen-fito": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Hai_Thuong_Lan_Ong_Blvd%2C_Cholon%2C_HCMC.jpg/1280px-Hai_Thuong_Lan_Ong_Blvd%2C_Cholon%2C_HCMC.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
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
    ]
  },
  "cho-hoa-pho-am-thuc-ho-thi-ky": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1e/20180413_190400Saigon_Hotpot_Night_Food_Tour_Ho_Thi_Ky_Flower_Market.jpg/1280px-20180413_190400Saigon_Hotpot_Night_Food_Tour_Ho_Thi_Ky_Flower_Market.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
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
    ]
  },
  "pho-di-bo-bui-vien": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Bui_Vien_Walking_Street_1.jpg/1280px-Bui_Vien_Walking_Street_1.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/%C4%90%C6%B0%E1%BB%9Dng_B%C3%B9i_Vi%E1%BB%87n,_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh",
    "viWikiSummary": "Đường Bùi Viện là một tuyến đường tại phường Bến Thành, Thành phố Hồ Chí Minh. Đây là tuyến đường vui chơi về đêm nổi tiếng của thành phố với nhiều quán bar và quán bia nhỏ lề đường, chuyên kinh doanh các mặt hàng, dịch vụ du lịch giá rẻ.",
    "viWikiParagraphs": [
      "Đường Bùi Viện là một tuyến đường tại phường Bến Thành, Thành phố Hồ Chí Minh. Đây là tuyến đường vui chơi về đêm nổi tiếng của thành phố với nhiều quán bar và quán bia nhỏ lề đường, chuyên kinh doanh các mặt hàng, dịch vụ du lịch giá rẻ.",
      "Đường Bùi Viện bắt đầu từ đường Trần Hưng Đạo, cạnh ngã tư Trần Hưng Đạo – Nguyễn Thái Học, giao cắt với các con đường Đề Thám, Đỗ Quang Đẩu và kết thúc tại đường Cống Quỳnh. Khu vực các tuyến đường Bùi Viện, Đề Thám, Phạm Ngũ Lão và Đỗ Quang Đẩu còn được biết đến với tên gọi là Phố Tây ba lô."
    ]
  },
  "cong-vien-bo-song-sai-gon-thu-thiem": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/C%E1%BA%A7u_Ba_Son%2C_TP.HCM%2C_042022.jpg/1280px-C%E1%BA%A7u_Ba_Son%2C_TP.HCM%2C_042022.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Th%E1%BB%A7_Thi%C3%AAm",
    "viWikiSummary": "Thủ Thiêm là một địa danh tại Thành phố Hồ Chí Minh, Việt Nam, nằm ven bờ sông Sài Gòn, đối diện với phường Sài Gòn. Khu vực Thủ Thiêm nằm trọn trong địa phận của phường An Khánh ngày nay và là trung tâm của khu đô thị mới Thủ Thiêm.",
    "viWikiParagraphs": [
      "Thủ Thiêm là một địa danh tại Thành phố Hồ Chí Minh, Việt Nam, nằm ven bờ sông Sài Gòn, đối diện với phường Sài Gòn. Khu vực Thủ Thiêm nằm trọn trong địa phận của phường An Khánh ngày nay và là trung tâm của khu đô thị mới Thủ Thiêm.",
      "Trước ngày 1 tháng 7 năm 2025, Thủ Thiêm là một phường thuộc thành phố Thủ Đức. Phường có diện tích 3,31 km², dân số năm 2021 là 2.176 người, mật độ dân số đạt 657 người/km²."
    ],
    "enWikiSummary": "Thủ Thiêm New Urban Area (Vietnamese: Khu đô thị mới Thủ Thiêm) is an 6.57 km2 (1,620-acre) ongoing urban redevelopment project and a planned community locates in the former District 2 and subsequently Thủ Đức City, now An Khánh ward of Ho Chi Minh City. It is currently under development. As of 2026, the area has been chosen to be the new seat of government for the expanded Ho Chi Minh City.",
    "enWikiParagraphs": [
      "Thủ Thiêm New Urban Area (Vietnamese: Khu đô thị mới Thủ Thiêm) is an 6.57 km2 (1,620-acre) ongoing urban redevelopment project and a planned community locates in the former District 2 and subsequently Thủ Đức City, now An Khánh ward of Ho Chi Minh City. It is currently under development. As of 2026, the area has been chosen to be the new seat of government for the expanded Ho Chi Minh City."
    ]
  },
  "chua-buu-long-thu-duc": {
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/e/ef/Th%C3%A1p_ch%C3%ADnh_ch%C3%B9a_B%E1%BB%ADu_Long.jpg?utm_source=vi.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Ch%C3%B9a_B%E1%BB%ADu_Long",
    "viWikiSummary": "Chùa Bửu Long, tên chính thức là Thiền viện Tổ đình Bửu Long, là một ngôi chùa tọa lạc trên một ngọn đồi bên sông Đồng Nai tại địa chỉ số 81 đường Nguyễn Xiển, phường Long Bình, Thành phố Hồ Chí Minh. Chùa thuộc hệ phái Phật giáo nguyên thủy Nam tông, do cư sĩ Võ Hà Thuật thành lập năm 1942. Đến năm 2007, chùa được đầu tư xây dựng và trùng tu. Chùa Bửu Long mang nét kiến trúc các chùa ở Thái Lan, Ấn Độ kết hợp cùng nét kiến trúc các chùa thời Nguyễn.",
    "viWikiParagraphs": [
      "Chùa Bửu Long, tên chính thức là Thiền viện Tổ đình Bửu Long, là một ngôi chùa tọa lạc trên một ngọn đồi bên sông Đồng Nai tại địa chỉ số 81 đường Nguyễn Xiển, phường Long Bình, Thành phố Hồ Chí Minh. Chùa thuộc hệ phái Phật giáo nguyên thủy Nam tông, do cư sĩ Võ Hà Thuật thành lập năm 1942. Đến năm 2007, chùa được đầu tư xây dựng và trùng tu. Chùa Bửu Long mang nét kiến trúc các chùa ở Thái Lan, Ấn Độ kết hợp cùng nét kiến trúc các chùa thời Nguyễn."
    ]
  },
  "bao-tang-ao-dai-thu-duc": {
    "coverImage": "https://upload.wikimedia.org/wikipedia/commons/1/1a/%C3%81o_d%C3%A0i_hoa_ph%C6%B0%E1%BB%A3ng_-_Ph%C3%A1t_Tr%C6%B0%C6%A1ng_-_51231007393_%28cropped%29.jpg?utm_source=en.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/%C3%81o_d%C3%A0i",
    "viWikiSummary": "Áo dài là một trang phục Việt Nam chủ yếu dành cho nữ giới, xuất hiện từ những năm 1930 do Le Mur Cát Tường cách tân theo hướng Tây hóa từ Áo ngũ thân.",
    "viWikiParagraphs": [
      "Áo dài là một trang phục Việt Nam chủ yếu dành cho nữ giới, xuất hiện từ những năm 1930 do Le Mur Cát Tường cách tân theo hướng Tây hóa từ Áo ngũ thân.",
      "Đặc điểm của trang phục này là kiểu áo tay chẽn, dáng áo bó, hai tà thẳng trước sau và hai bên. Các nhà thiết kế không áp dụng hoa văn truyền thống, phụ kiện trang sức truyền thống lên áo dài."
    ],
    "enWikiSummary": "Áo dài (English: ; Vietnamese: [ʔaːw˧˦ zaːj˨˩] (North), [ʔaːw˦˥ jaːj˨˩] (South), lit. “long tunic”) is a traditional Vietnamese outfit consisting of a long split tunic worn over silk trousers. It has many variations, and can serve as formalwear for both men and women.",
    "enWikiParagraphs": [
      "Áo dài (English: ; Vietnamese: [ʔaːw˧˦ zaːj˨˩] (North), [ʔaːw˦˥ jaːj˨˩] (South), lit. “long tunic”) is a traditional Vietnamese outfit consisting of a long split tunic worn over silk trousers. It has many variations, and can serve as formalwear for both men and women."
    ]
  },
  "bao-tang-nghe-thuat-quang-san": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Thao_Dien_Station_%28MRT_1%29%2C_Qu%E1%BB%91c_H%C6%B0%C6%A1ng%2C_Th%E1%BA%A3o_%C4%90i%E1%BB%81n%2C_H%E1%BB%93_Ch%C3%AD_Minh_-_54690900645.jpg/1280px-Thao_Dien_Station_%28MRT_1%29%2C_Qu%E1%BB%91c_H%C6%B0%C6%A1ng%2C_Th%E1%BA%A3o_%C4%90i%E1%BB%81n%2C_H%E1%BB%93_Ch%C3%AD_Minh_-_54690900645.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/An_Kh%C3%A1nh_(ph%C6%B0%E1%BB%9Dng)",
    "viWikiSummary": "Phường An Khánh nằm ở trung tâm Thành phố Hồ Chí Minh. Trong tương lai, khu vực thuộc Khu đô thị mới Thủ Thiêm, phường Sài Gòn và phường Bến Thành sẽ trở thành Trung tâm Tài chính Thành phố Hồ Chí Minh.",
    "viWikiParagraphs": [
      "Phường An Khánh nằm ở trung tâm Thành phố Hồ Chí Minh. Trong tương lai, khu vực thuộc Khu đô thị mới Thủ Thiêm, phường Sài Gòn và phường Bến Thành sẽ trở thành Trung tâm Tài chính Thành phố Hồ Chí Minh.",
      "Phía Tây giáp với các phường Sài Gòn và phường Thạnh Mỹ Tây với ranh giới là sông Sài Gòn"
    ],
    "enWikiSummary": "Thảo Điền is an area of An Khánh, Ho Chi Minh City, Vietnam. During 1997 to 2025, it was an administrative ward under District 2 then Thủ Đức Municipal City of Ho Chi Minh City.",
    "enWikiParagraphs": [
      "Thảo Điền is an area of An Khánh, Ho Chi Minh City, Vietnam. During 1997 to 2025, it was an administrative ward under District 2 then Thủ Đức Municipal City of Ho Chi Minh City.",
      "This area is known as an affluent area with top highest housing price among other places in the city and Vietnam generally with luxury mansions and high-rise apartments. It is also considered an \"expat hub,\" with a significant foreign population that creates a multicultural community."
    ]
  },
  "tu-vien-khanh-an-quan-12": {
    "coverImage": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Hoi_Khanh_Pagoda_in_Binh_Duong.jpg/1280px-Hoi_Khanh_Pagoda_in_Binh_Duong.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
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
    "wikipediaUrl": "https://vi.wikipedia.org/wiki/Tu_vi%E1%BB%87n_Kh%C3%A1nh_An",
    "viWikiSummary": "Tu viện Khánh An là một ngôi chùa bề thế nằm ở quận 12, Thành phố Hồ Chí Minh, nơi đây được gọi là tu viện vì muốn nói giảm thiểu đi sắc màu của tín ngưỡng, tôn giáo. Tu viện Khánh An là nơi thường xuyên tổ chức các khóa tu, khóa thiền, thiền tứ niệm xứ và nhận được sự quan tâm của đông đảo chư tăng, phật tử. Đây là nơi thu hút người dân tới chiêm bái, lễ chùa, nhiều người trẻ tìm tới tham dự các khóa tu ngắn ngày, nghe thuyết pháp.",
    "viWikiParagraphs": [
      "Tu viện Khánh An là một ngôi chùa bề thế nằm ở quận 12, Thành phố Hồ Chí Minh, nơi đây được gọi là tu viện vì muốn nói giảm thiểu đi sắc màu của tín ngưỡng, tôn giáo. Tu viện Khánh An là nơi thường xuyên tổ chức các khóa tu, khóa thiền, thiền tứ niệm xứ và nhận được sự quan tâm của đông đảo chư tăng, phật tử. Đây là nơi thu hút người dân tới chiêm bái, lễ chùa, nhiều người trẻ tìm tới tham dự các khóa tu ngắn ngày, nghe thuyết pháp."
    ],
    "enWikiSummary": "District 12 may also refer to a fictional location in The Hunger Games universe, or to other 12th legislative districts.",
    "enWikiParagraphs": [
      "District 12 may also refer to a fictional location in The Hunger Games universe, or to other 12th legislative districts.",
      "District 12 (Vietnamese: Quận 12) is an urban district (quận) of Ho Chi Minh City, the largest and third most populous city in Vietnam."
    ]
  }
};
