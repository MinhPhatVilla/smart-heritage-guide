import { describe, expect, it } from 'vitest';
import { decodePolyline } from './routingService';

describe('routingService - giải mã polyline của Goong Direction API', () => {
  it('giải mã đúng chuỗi polyline mẫu chuẩn của Google', () => {
    // Ví dụ chính thức trong tài liệu Encoded Polyline Algorithm Format
    const coords = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(coords).toEqual([
      [38.5, -120.2],
      [40.7, -120.95],
      [43.252, -126.453],
    ]);
  });

  it('trả về mảng rỗng với chuỗi rỗng', () => {
    expect(decodePolyline('')).toEqual([]);
  });
});
