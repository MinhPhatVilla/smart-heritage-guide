import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildFallbackRoute, decodePolyline, fetchWalkingRoute } from './routingService';

const ORIGIN: [number, number] = [10.7725, 106.698];
const DESTINATION: [number, number] = [10.777, 106.6953];

describe('routingService - giải mã polyline và chỉ đường đi bộ', () => {
  const originalGoongKey = process.env.EXPO_PUBLIC_GOONG_API_KEY;

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (originalGoongKey === undefined) {
      delete process.env.EXPO_PUBLIC_GOONG_API_KEY;
    } else {
      process.env.EXPO_PUBLIC_GOONG_API_KEY = originalGoongKey;
    }
  });

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

  it('ưu tiên FOSSGIS OSRM foot và chuyển đổi tọa độ GeoJSON [lng, lat] sang [lat, lng]', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        routes: [
          {
            distance: 640,
            duration: 512,
            geometry: {
              coordinates: [
                [106.698, 10.7725],
                [106.6966, 10.7748],
                [106.6953, 10.777],
              ],
            },
            legs: [
              {
                steps: [
                  { name: 'Lê Lợi', distance: 250, duration: 200, maneuver: { type: 'depart' } },
                  {
                    name: 'Nam Kỳ Khởi Nghĩa',
                    distance: 390,
                    duration: 312,
                    maneuver: { type: 'turn', modifier: 'right' },
                  },
                  { name: '', distance: 0, duration: 0, maneuver: { type: 'arrive' } },
                ],
              },
            ],
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchWalkingRoute(
      ORIGIN,
      DESTINATION,
      'Dinh Độc Lập',
      'heritage',
      'dinh-doc-lap'
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('routing.openstreetmap.de/routed-foot');
    expect(result.coordinates).toEqual([
      [10.7725, 106.698],
      [10.7748, 106.6966],
      [10.777, 106.6953],
    ]);
    expect(result.totalDistanceMeters).toBe(640);
    expect(result.estimatedDurationSeconds).toBe(512);
    expect(result.steps[0].maneuverType).toBe('depart');
    expect(result.steps[result.steps.length - 1].maneuverType).toBe('arrive');
  });

  it('chuyển sang Goong Direction API bằng EXPO_PUBLIC_GOONG_API_KEY khi FOSSGIS lỗi', async () => {
    process.env.EXPO_PUBLIC_GOONG_API_KEY = 'test-goong-key';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          routes: [
            {
              overview_polyline: { points: '_p~iF~ps|U_ulLnnqC_mqNvxq`@' },
              legs: [
                {
                  distance: { value: 500 },
                  steps: [
                    {
                      distance: { value: 300 },
                      html_instructions: 'Đi thẳng <b>Lê Thánh Tôn</b>',
                      maneuver: 'straight',
                    },
                    {
                      distance: { value: 200 },
                      html_instructions: 'Rẽ trái vào <b>Nam Kỳ Khởi Nghĩa</b>',
                      maneuver: 'turn-left',
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchWalkingRoute(
      ORIGIN,
      DESTINATION,
      'Dinh Độc Lập',
      'heritage',
      'dinh-doc-lap'
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('rsapi.goong.io/v2/direction');
    expect(String(fetchMock.mock.calls[1][0])).toContain('api_key=test-goong-key');
    expect(result.totalDistanceMeters).toBe(500);
    expect(result.estimatedDurationSeconds).toBe(400); // 500 / 1.25 m/s
    expect(result.coordinates).toHaveLength(3);
    expect(result.steps[0].instruction).toBe('Đi thẳng Lê Thánh Tôn');
    expect(result.steps[1].maneuverType).toBe('arrive');
  });

  it('tạo tuyến nội suy offline khi cả FOSSGIS và Goong đều không khả dụng', async () => {
    delete process.env.EXPO_PUBLIC_GOONG_API_KEY;
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network offline'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchWalkingRoute(
      ORIGIN,
      DESTINATION,
      'Chợ Bến Thành',
      'heritage',
      'cho-ben-thanh'
    );

    expect(result.coordinates).toHaveLength(9);
    expect(result.coordinates[0]).toEqual(ORIGIN);
    expect(result.coordinates[result.coordinates.length - 1]).toEqual(DESTINATION);
    expect(result.totalDistanceMeters).toBeGreaterThan(0);
    expect(result.estimatedDurationSeconds).toBeGreaterThan(0);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].maneuverType).toBe('depart');
    expect(result.steps[1].maneuverType).toBe('arrive');
  });

  it('buildFallbackRoute trả về tọa độ hợp lệ nối điểm đầu và điểm cuối', () => {
    const fallback = buildFallbackRoute(ORIGIN, DESTINATION, 'Nhà thờ Đức Bà');
    expect(fallback.coordinates[0]).toEqual(ORIGIN);
    expect(fallback.coordinates[fallback.coordinates.length - 1]).toEqual(DESTINATION);
    expect(fallback.totalDistanceMeters).toBeGreaterThanOrEqual(50);
  });
});
