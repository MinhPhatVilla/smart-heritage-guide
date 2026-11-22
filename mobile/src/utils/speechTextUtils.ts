import type { SupportedLanguage } from '../types/heritage';

export type SpeechVoiceGender = 'female' | 'male';

export interface VoiceLike {
  identifier?: string;
  name?: string;
  language?: string;
  quality?: string;
}

/**
 * Chuẩn hóa văn bản trước khi đọc (cho cả Neural TTS lẫn giọng Offline)
 * để tránh đọc vấp từ viết tắt, ký hiệu gạch nối và tạo nhịp ngắt tự nhiên.
 */
export function preprocessTextForSpeech(
  text: string,
  lang: SupportedLanguage = 'vi'
): string {
  let cleaned = (text || '').trim();
  if (!cleaned) return '';

  cleaned = cleaned.replace(/[*_`#]+/g, '').replace(/\s+/g, ' ');

  if (lang === 'vi') {
    cleaned = cleaned
      .replace(/\bTP\.?\s*HCM\b/gi, 'Thành phố Hồ Chí Minh')
      .replace(/\bTP\.?\s*Thủ Đức\b/gi, 'Thành phố Thủ Đức')
      .replace(/\bUBND\b/g, 'Ủy ban nhân dân')
      .replace(/\bKTS\.?\s*/g, 'Kiến trúc sư ')
      .replace(/\bHSSV\b/g, 'học sinh, sinh viên')
      .replace(/\bQ\.\s*(\d+)\b/g, 'Quận $1')
      .replace(/\bP\.\s*(\d+)\b/g, 'Phường $1')
      .replace(/(\d+)\s*ha(?=$|[\s,.;:!?)/])/gi, '$1 héc ta')
      .replace(/(\d+)\s*km(?=$|[\s,.;:!?)/])/gi, '$1 ki lô mét')
      .replace(/(\d[\d.]*)\s*đ(?=$|[\s,.;:!?)/])/gi, '$1 đồng')
      .replace(/(\d{3,4})\s*[–—-]\s*(\d{3,4})/g, '$1 đến $2')
      .replace(/(\d{1,2}):00\s*[–—-]\s*(\d{1,2}):00/g, '$1 giờ đến $2 giờ')
      .replace(
        /(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/g,
        '$1 giờ $2 đến $3 giờ $4'
      );
  } else if (lang === 'en') {
    cleaned = cleaned.replace(/(\d{3,4})\s*[–—-]\s*(\d{3,4})/g, '$1 to $2');
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
