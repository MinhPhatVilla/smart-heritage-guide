import { describe, expect, it } from 'vitest';
import {
  preprocessTextForSpeech,
  scoreSpeechVoice,
} from '../utils/speechTextUtils';

describe('speechService text preprocessing & voice scoring', () => {
  it('expands Vietnamese abbreviations, years, currency, and time ranges naturally', () => {
    const input =
      'Di tích tại TP.HCM – Q.1 do KTS. Ngô Viết Thụ xây dựng 1880 – 1891, mở cửa 07:00 – 17:00, vé 40.000đ.';
    const out = preprocessTextForSpeech(input, 'vi');

    expect(out).toContain('Thành phố Hồ Chí Minh');
    expect(out).toContain('Quận 1');
    expect(out).toContain('Kiến trúc sư');
    expect(out).toContain('1880 đến 1891');
    expect(out).toContain('07 giờ đến 17 giờ');
    expect(out).toContain('40.000 đồng');
    expect(out).not.toContain('–');
  });

  it('normalizes dates, Roman numerals, measurements, decimals, and foreign names for Vietnamese TTS', () => {
    const input =
      'Nhà thờ Notre-Dame do KTS. Jules Bourard thiết kế cuối thế kỷ XIX – XX theo phong cách Roman và Gothic, tháp cao 57,6m, diện tích 4.800 m², gắn mốc 30/4/1975 và UNESCO.';
    const out = preprocessTextForSpeech(input, 'vi');

    expect(out).toContain('Nốt tơ Đam');
    expect(out).toContain('Giuyn Bu ra');
    expect(out).toContain('thế kỷ 19 đến 20');
    expect(out).toContain('Rô măng');
    expect(out).toContain('Gô tích');
    expect(out).toContain('57 phẩy 6 mét');
    expect(out).toContain('4.800 mét vuông');
    expect(out).toContain('30 tháng 4 năm 1975');
    expect(out).toContain('U nét cô');
  });

  it('prefers Microsoft Natural/Neural voices over legacy robotic voices', () => {
    const legacy = scoreSpeechVoice(
      {
        identifier: 'vi-legacy',
        name: 'Microsoft An - Vietnamese (Vietnam)',
        language: 'vi-VN',
        quality: 'Default' as never,
      },
      'vi-VN',
      'female'
    );
    const neuralFemale = scoreSpeechVoice(
      {
        identifier: 'vi-hoaimy',
        name: 'Microsoft HoaiMy Online (Natural) - Vietnamese (Vietnam)',
        language: 'vi-VN',
        quality: 'Enhanced' as never,
      },
      'vi-VN',
      'female'
    );
    const neuralMale = scoreSpeechVoice(
      {
        identifier: 'vi-namminh',
        name: 'Microsoft NamMinh Online (Natural) - Vietnamese (Vietnam)',
        language: 'vi-VN',
        quality: 'Enhanced' as never,
      },
      'vi-VN',
      'male'
    );

    expect(neuralFemale).toBeGreaterThan(legacy);
    expect(neuralMale).toBeGreaterThan(legacy);
  });
});
