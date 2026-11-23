import type { SupportedLanguage } from '../types/heritage';

export type SpeechVoiceGender = 'female' | 'male';

export interface VoiceLike {
  identifier?: string;
  name?: string;
  language?: string;
  quality?: string;
}

const ROMAN_NUMERALS_MAP: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
  XIII: 13,
  XIV: 14,
  XV: 15,
  XVI: 16,
  XVII: 17,
  XVIII: 18,
  XIX: 19,
  XX: 20,
  XXI: 21,
  XXII: 22,
};

function romanToArabic(token: string): string {
  const num = ROMAN_NUMERALS_MAP[token.toUpperCase()];
  return num ? String(num) : token;
}

/**
 * Từ điển phiên âm chuẩn tiếng Việt cho các tên riêng nước ngoài, kiến trúc sư Pháp,
 * phong cách kiến trúc và thuật ngữ quốc tế xuất hiện trong kho 97 di tích TP.HCM mở rộng.
 * (Đặt cụm dài trước cụm ngắn để khớp chính xác.)
 */
const VI_FOREIGN_PRONUNCIATION_MAP: Array<[RegExp, string]> = [
  [/\bAlfred\s+Foulhoux\b/gi, 'An phờ rét Phu lu'],
  [/\bMarie-Alfred\s+Foulhoux\b/gi, 'Ma ri An phờ rét Phu lu'],
  [/\bGustave\s+Eiffel\b/gi, 'Gút xờ táp Ép phen'],
  [/\bJules\s+Bourard\b/gi, 'Giuyn Bu ra'],
  [/\bEug[eè]ne\s+Ferret\b/gi, 'Ơ gien Phê rê'],
  [/\bPaul\s+Gard[eè]s\b/gi, 'Pôn Gác đét'],
  [/\bPaul\s+Doumer\b/gi, 'Pôn Đu me'],
  [/\bAlexandre\s+de\s+Rhodes\b/gi, 'A lếch xăng đờ Rốt'],
  [/\bPigneau\s+de\s+B[eé]haine\b/gi, 'Pi nhô đờ Bê hen'],
  [/\bH[oô]tel\s+de\s+Ville\b/gi, 'Ô ten đờ Vin'],
  [/\bVilla\s+Blanche\b/gi, 'Vi la Blăng'],
  [/\bNotre[- ]Dame\b/gi, 'Nốt tơ Đam'],
  [/\bArt\s+Deco\b/gi, 'Ạc Đê cô'],
  [/\bArt\s+Nouveau\b/gi, 'Ạc Nu vô'],
  [/\bCable\s+Car\b/gi, 'cáp treo'],
  [/\bLandmark\s*81\b/gi, 'Len mác 81'],
  [/\bVũng\s+Tàu\s+Marina\b/gi, 'Vũng Tàu Ma ri na'],
  [/\bCheck-in\b/gi, 'chếch in'],
  [/\bUNESCO\b/gi, 'U nét cô'],
  [/\bRomanesque\b/gi, 'Rô ma nét'],
  [/\bNeoclassical\b/gi, 'tân cổ điển'],
  [/\bRenaissance\b/gi, 'Rơ ne xăng'],
  [/\bGothic\b/gi, 'Gô tích'],
  [/\bBaroque\b/gi, 'Ba rốc'],
  [/\bRoman\b/gi, 'Rô măng'],
  [/\bIndochine\b/gi, 'In đô sin'],
  [/\bIndochina\b/gi, 'Đông Dương'],
  [/\bFoulhoux\b/gi, 'Phu lu'],
  [/\bVilledieu\b/gi, 'Vin điơ'],
  [/\bEiffel\b/gi, 'Ép phen'],
  [/\bBourard\b/gi, 'Bu ra'],
  [/\bFerret\b/gi, 'Phê rê'],
  [/\bGard[eè]s\b/gi, 'Gác đét'],
  [/\bPasteur\b/gi, 'Pát xờ tơ'],
  [/\bYersin\b/gi, 'Y éc xanh'],
  [/\bCalmette\b/gi, 'Can mét'],
  [/\bNorodom\b/gi, 'Nô rô đôm'],
  [/\bMarseille\b/gi, 'Mác xây'],
  [/\bParis\b/gi, 'Pa ri'],
  [/\bBitexco\b/gi, 'Bi tếch cô'],
  [/\bContinental\b/gi, 'Côn ti nen tồ'],
  [/\bMajestic\b/gi, 'Ma gét tích'],
  [/\bCaravelle\b/gi, 'Ca ra ven'],
  [/\bOpera\b/gi, 'Ô pê ra'],
  [/\bMarina\b/gi, 'Ma ri na'],
  [/\bBoulevard\b/gi, 'đại lộ'],
  [/\bPlaza\b/gi, 'Pờ la da'],
  [/\bResort\b/gi, 'khu nghỉ dưỡng'],
  [/\bSafari\b/gi, 'Sa pha ri'],
  [/\bSaigon\b/gi, 'Sài Gòn'],
  [/\bview\b/gi, 'tầm nhìn'],
  [/\b3D\b/g, 'ba đê'],
  [/\b4D\b/g, 'bốn đê'],
  [/\bGPS\b/g, 'Gờ Pê Ét'],
  [/\bAI\b/g, 'ây ai'],
];

/**
 * Chuẩn hóa văn bản trước khi đọc (cho cả Neural TTS lẫn giọng Offline)
 * để đọc chuẩn số liệu, ngày tháng, số La Mã, đơn vị đo, tên riêng nước ngoài và tạo nhịp ngắt tự nhiên.
 */
export function preprocessTextForSpeech(
  text: string,
  lang: SupportedLanguage = 'vi'
): string {
  let cleaned = (text || '').trim();
  if (!cleaned) return '';

  cleaned = cleaned.replace(/[*_`#]+/g, '').replace(/\s+/g, ' ');

  if (lang === 'vi') {
    // 1. Ngày tháng dạng dd/mm/yyyy hoặc dd/mm (xử lý TRƯỚC khi thay dấu `/` thành dấu phẩy)
    cleaned = cleaned
      .replace(
        /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
        '$1 tháng $2 năm $3'
      )
      .replace(
        /\b(ngày|mùng|đêm|sáng|chiều|tối|lễ|chiến thắng|giải phóng|kỷ niệm)\s+(\d{1,2})\/(\d{1,2})\b/gi,
        '$1 $2 tháng $3'
      )
      .replace(/\b(30\/4|30\/04)\b/g, '30 tháng 4')
      .replace(/\b(2\/9|02\/09)\b/g, '2 tháng 9')
      .replace(/\b(19\/8|19\/08)\b/g, '19 tháng 8')
      .replace(/\b(19\/5|19\/05)\b/g, '19 tháng 5')
      .replace(/\b(7\/5|07\/05)\b/g, '7 tháng 5')
      .replace(/\b(1\/5|01\/05)\b/g, '1 tháng 5')
      .replace(/\b(20\/11)\b/g, '20 tháng 11');

    // 2. Số La Mã sau từ chỉ thứ tự / thế kỷ (thế kỷ XIX – XX, giai đoạn II, khu III, thế chiến II...)
    cleaned = cleaned
      .replace(
        /\b(thế kỷ|giai đoạn|khu|phần|đợt|cấp|tầng|hạng|thứ)\s+([IVX]{1,5})\s*[–—-]\s*([IVX]{1,5})\b/gi,
        (_m, prefix: string, r1: string, r2: string) =>
          `${prefix} ${romanToArabic(r1)} đến ${romanToArabic(r2)}`
      )
      .replace(
        /\b(thế kỷ|giai đoạn|khu|phần|đợt|cấp|tầng|hạng|thứ)\s+([IVX]{1,5})\b/gi,
        (_m, prefix: string, r1: string) => `${prefix} ${romanToArabic(r1)}`
      );

    // 3. Từ viết tắt, đơn vị đo, tiền tệ, khung giờ, khoảng năm và số thập phân
    cleaned = cleaned
      .replace(/\bTP\.?\s*HCM\b/gi, 'Thành phố Hồ Chí Minh')
      .replace(/\bTP\.?\s*Thủ Đức\b/gi, 'Thành phố Thủ Đức')
      .replace(/\bTP\.?\s*Vũng Tàu\b/gi, 'Thành phố Vũng Tàu')
      .replace(/\bUBND\b/g, 'Ủy ban nhân dân')
      .replace(/\bKTS\.?\s*/g, 'Kiến trúc sư ')
      .replace(/\bHSSV\b/g, 'học sinh, sinh viên')
      .replace(/\bQ\.\s*(\d+)\b/g, 'Quận $1')
      .replace(/\bP\.\s*(\d+)\b/g, 'Phường $1')
      .replace(/\bQL\.?\s*(\d+[A-Z]?)\b/g, 'Quốc lộ $1')
      .replace(/(\d+(?:[.,]\d+)?)\s*km²/gi, '$1 ki lô mét vuông')
      .replace(/(\d+(?:[.,]\d+)?)\s*m²/gi, '$1 mét vuông')
      .replace(/(\d+(?:[.,]\d+)?)\s*km\/h/gi, '$1 ki lô mét mỗi giờ')
      .replace(/(\d+(?:[.,]\d+)?)\s*ha(?=$|[\s,.;:!?)/])/gi, '$1 héc ta')
      .replace(/(\d+(?:[.,]\d+)?)\s*km(?=$|[\s,.;:!?)/])/gi, '$1 ki lô mét')
      .replace(/(\d+(?:[.,]\d+)?)\s*cm(?=$|[\s,.;:!?)/])/gi, '$1 xăng ti mét')
      .replace(/(\d+(?:[.,]\d+)?)\s*mm(?=$|[\s,.;:!?)/])/gi, '$1 mi li mét')
      .replace(/(\d+(?:[.,]\d+)?)\s*m(?=$|[\s,.;:!?)/])/gi, '$1 mét')
      .replace(/(\d+(?:[.,]\d+)?)\s*°\s*C/gi, '$1 độ Cê')
      .replace(/(\d+(?:[.,]\d+)?)\s*°/g, '$1 độ')
      .replace(/(\d+(?:[.,]\d+)?)\s*%/g, '$1 phần trăm')
      .replace(/(\d[\d.]*)\s*(?:VNĐ|VND|đ)(?=$|[\s,.;:!?)/])/gi, '$1 đồng')
      .replace(/(\d[\d.]*)\s*USD(?=$|[\s,.;:!?)/])/gi, '$1 đô la Mỹ')
      .replace(/(\d{1,2}):00\s*[–—-]\s*(\d{1,2}):00/g, '$1 giờ đến $2 giờ')
      .replace(
        /(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/g,
        '$1 giờ $2 đến $3 giờ $4'
      )
      .replace(/\b(\d{1,2}):00\b/g, '$1 giờ')
      .replace(/\b(\d{1,2}):(\d{2})\b/g, '$1 giờ $2')
      .replace(/(\d{1,4})\s*[–—-]\s*(\d{1,4})/g, '$1 đến $2')
      // Số thập phân kiểu Việt Nam (57,6 -> 57 phẩy 6) để TTS không ngắt hơi sai chỗ
      .replace(/(\d+),(\d+)/g, '$1 phẩy $2');

    // 4. Phiên âm tên riêng nước ngoài & thuật ngữ kiến trúc Pháp/Anh
    for (const [pattern, replacement] of VI_FOREIGN_PRONUNCIATION_MAP) {
      cleaned = cleaned.replace(pattern, replacement);
    }
  } else if (lang === 'en') {
    cleaned = cleaned
      .replace(/(\d{3,4})\s*[–—-]\s*(\d{3,4})/g, '$1 to $2')
      .replace(/(\d+(?:\.\d+)?)\s*m²/gi, '$1 square meters')
      .replace(/(\d+(?:\.\d+)?)\s*km²/gi, '$1 square kilometers')
      .replace(/(\d[\d,]*)\s*(?:VNĐ|VND|đ)\b/gi, '$1 Vietnamese dong');
  } else if (lang === 'fr') {
    cleaned = cleaned
      .replace(/(\d{3,4})\s*[–—-]\s*(\d{3,4})/g, '$1 à $2')
      .replace(/(\d+(?:[.,]\d+)?)\s*m²/gi, '$1 mètres carrés');
  }

  cleaned = cleaned
    .replace(/\s*[–—]\s*/g, ', ')
    .replace(/\s*·\s*/g, ', ')
    .replace(/\s*\/\s*/g, ', ')
    .replace(/\s*\|\s*/g, ', ')
    .replace(/,\s*,+/g, ', ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Chấm điểm chất lượng giọng đọc trên thiết bị/trình duyệt để ưu tiên tuyệt đối
 * giọng Neural / Natural / Enhanced / Online thay vì giọng robot mặc định.
 */
export function scoreSpeechVoice(
  voice: VoiceLike,
  bcp47: string,
  preferredGender: SpeechVoiceGender = 'female'
): number {
  const target = bcp47.toLowerCase();
  const prefix = target.split('-')[0];
  const vLang = (voice.language || '').toLowerCase().replace('_', '-');

  let score = 0;
  if (vLang === target) {
    score += 100;
  } else if (vLang.startsWith(prefix)) {
    score += 60;
  } else {
    return -1;
  }

  const hay = `${voice.name || ''} ${voice.identifier || ''}`.toLowerCase();
  const qualityStr = String(voice.quality || '').toLowerCase();

  // Ưu tiên cực cao cho giọng Neural / Natural / Online / Enhanced
  if (hay.includes('natural')) score += 80;
  if (hay.includes('neural')) score += 75;
  if (hay.includes('online')) score += 45;
  if (hay.includes('enhanced') || qualityStr === 'enhanced') score += 55;
  if (hay.includes('premium') || hay.includes('wavenet') || hay.includes('siri')) {
    score += 50;
  }
  if (hay.includes('google')) score += 35;

  // Giảm điểm các giọng robot cũ
  if (hay.includes('espeak') || hay.includes('compact') || hay.includes('legacy')) {
    score -= 40;
  }

  // Ưu tiên đúng giới tính giọng mong muốn
  const femaleHints = [
    'hoaimy',
    'hoai my',
    'linh',
    'mai',
    'lan',
    'aria',
    'jenny',
    'denise',
    'xiaoxiao',
    'nanami',
    'female',
    'woman',
  ];
  const maleHints = [
    'namminh',
    'nam minh',
    'an ',
    'guy',
    'davis',
    'henri',
    'yunxi',
    'keita',
    'male',
    'man',
  ];

  if (preferredGender === 'female') {
    if (femaleHints.some((k) => hay.includes(k))) score += 28;
    if (maleHints.some((k) => hay.includes(k))) score -= 12;
  } else {
    if (maleHints.some((k) => hay.includes(k))) score += 28;
    if (femaleHints.some((k) => hay.includes(k))) score -= 12;
  }

  return score;
}
