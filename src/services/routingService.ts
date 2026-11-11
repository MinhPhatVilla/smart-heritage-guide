import { RouteStep, WalkingRouteResult } from '../types/heritage';
import { calculateDistanceMeters, estimateWalkingSeconds } from '../utils/geoUtils';

/**
 * Thứ tự nguồn chỉ đường đi bộ:
 * 1. FOSSGIS OSRM (routing.openstreetmap.de) — profile đi bộ thật, miễn phí, không cần key
 * 2. Goong Direction API (nếu có VITE_GOONG_API_KEY) — Goong không có chế độ đi bộ nên dùng
 *    hình học tuyến `bike`, còn thời gian được tính lại theo tốc độ đi bộ
 * 3. Tuyến nội suy offline — để ứng dụng vẫn chạy được khi mất mạng
 *
 * Lưu ý: router.project-osrm.org chỉ chạy profile ô tô (bỏ qua chữ `foot` trong URL),
 * nên không dùng để tính đường đi bộ.
 */

const FOSSGIS_FOOT_URL = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';
const GOONG_DIRECTION_URL = 'https://rsapi.goong.io/v2/direction';
const GOONG_API_KEY = (import.meta.env.VITE_GOONG_API_KEY || '').trim();
const REQUEST_TIMEOUT_MS = 6000;

type RouteSource = Omit<
  WalkingRouteResult,
  'origin' | 'destination' | 'targetName' | 'targetType' | 'targetId'
>;

async function fetchJsonWithTimeout(url: string): Promise<any | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Giải mã Google Encoded Polyline (precision 5) => mảng [lat, lng] */
export function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    for (const axis of [0, 1]) {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20 && index < encoded.length);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta;
      else lng += delta;
    }
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function maneuverFromModifier(modifier: string): RouteStep['maneuverType'] {
  if (modifier.includes('left')) return 'turn-left';
  if (modifier.includes('right')) return 'turn-right';
  return 'straight';
}

/** 1. FOSSGIS OSRM — profile đi bộ */
async function fetchFromFossgisFoot(
  origin: [number, number],
  destination: [number, number],
  targetName: string
): Promise<RouteSource | null> {
  const [lat1, lng1] = origin;
  const [lat2, lng2] = destination;
  const data = await fetchJsonWithTimeout(
    `${FOSSGIS_FOOT_URL}/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&steps=true`
  );
  const route = data?.routes?.[0];
  if (!route?.geometry?.coordinates?.length) return null;

  const coordinates: [number, number][] = route.geometry.coordinates.map(
    (c: [number, number]) => [c[1], c[0]]
  );

  const rawSteps: any[] = route.legs?.[0]?.steps || [];
  const steps: RouteStep[] = rawSteps
    .filter((s) => (s.distance || 0) > 0 || s.maneuver?.type === 'arrive')
    .slice(0, 8)
    .map((step, idx, arr) => {
      const road = step.name ? ` đường ${step.name}` : ' tuyến phố tiếp theo';
      const modifier: string = step.maneuver?.modifier || '';
      const isFirst = idx === 0;
      const isLast = idx === arr.length - 1 || step.maneuver?.type === 'arrive';
      let maneuverType: RouteStep['maneuverType'] = maneuverFromModifier(modifier);
      let instruction = `Đi tiếp theo${road}`;
      if (isFirst) {
        maneuverType = 'depart';
        instruction = `Bắt đầu đi bộ vào${road}`;
      } else if (isLast) {
        maneuverType = 'arrive';
        instruction = `Đến nơi: ${targetName}`;
      } else if (maneuverType === 'turn-left') {
        instruction = `Rẽ trái vào${road}`;
      } else if (maneuverType === 'turn-right') {
        instruction = `Rẽ phải vào${road}`;
      }
      return {
        instruction,
        distanceMeters: Math.max(5, Math.round(step.distance || 0)),
        durationSeconds: Math.max(5, Math.round(step.duration || 0)),
        maneuverType,
      };
    });

  return {
    coordinates,
    totalDistanceMeters: Math.round(route.distance),
    estimatedDurationSeconds: Math.round(route.duration),
    steps,
  };
}

/** 2. Goong Direction API (dự phòng) — dùng tuyến xe máy, tính lại thời gian theo tốc độ đi bộ */
async function fetchFromGoong(
  origin: [number, number],
  destination: [number, number],
  targetName: string
): Promise<RouteSource | null> {
  if (!GOONG_API_KEY) return null;
  const data = await fetchJsonWithTimeout(
    `${GOONG_DIRECTION_URL}?origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}&vehicle=bike&api_key=${encodeURIComponent(GOONG_API_KEY)}`
  );
  const route = data?.routes?.[0];
  const leg = route?.legs?.[0];
  if (!route || !leg) return null;

  const encoded: string | undefined = route.overview_polyline?.points;
  const coordinates = encoded ? decodePolyline(encoded) : [];
  if (coordinates.length < 2) return null;

  const totalDistanceMeters = Math.round(leg.distance?.value ?? 0);
  if (!totalDistanceMeters) return null;
  // Goong tính thời gian cho xe máy => quy đổi lại sang đi bộ (~1.25 m/s)
  const estimatedDurationSeconds = Math.round(totalDistanceMeters / 1.25);

  const rawSteps: any[] = leg.steps || [];
  const steps: RouteStep[] = rawSteps.slice(0, 8).map((step, idx, arr) => {
    const distanceMeters = Math.max(5, Math.round(step.distance?.value ?? 0));
    const text = stripHtml(step.html_instructions || '') || 'Đi tiếp theo tuyến phố';
    const maneuverType: RouteStep['maneuverType'] =
      idx === 0 ? 'depart' : idx === arr.length - 1 ? 'arrive' : maneuverFromModifier(String(step.maneuver || ''));
    return {
      instruction: idx === arr.length - 1 ? `${text} · Đến nơi: ${targetName}` : text,
      distanceMeters,
      durationSeconds: Math.round(distanceMeters / 1.25),
      maneuverType,
    };
  });

  return { coordinates, totalDistanceMeters, estimatedDurationSeconds, steps };
}

/** 3. Tuyến nội suy offline */
function buildFallbackRoute(
  origin: [number, number],
  destination: [number, number],
  targetName: string
): RouteSource {
  const [lat1, lng1] = origin;
  const [lat2, lng2] = destination;
  const straightDist = calculateDistanceMeters(lat1, lng1, lat2, lng2);
  const totalDistanceMeters = Math.max(50, Math.round(straightDist * 1.25));
  const estimatedDurationSeconds = estimateWalkingSeconds(straightDist);

  const coordinates: [number, number][] = [];
  const segments = 8;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const curveOffset = Math.sin(t * Math.PI) * 0.00045;
    coordinates.push([
      lat1 + (lat2 - lat1) * t + curveOffset,
      lng1 + (lng2 - lng1) * t - curveOffset * 0.6,
    ]);
  }

  return {
    coordinates,
    totalDistanceMeters,
    estimatedDurationSeconds,
    steps: [
      {
        instruction: `Đi bộ theo hướng ${targetName} (chưa kết nối được máy chủ chỉ đường)`,
        distanceMeters: totalDistanceMeters,
        durationSeconds: estimatedDurationSeconds,
        maneuverType: 'depart',
      },
      {
        instruction: `Đến nơi: ${targetName}`,
        distanceMeters: 0,
        durationSeconds: 0,
        maneuverType: 'arrive',
      },
    ],
  };
}

/**
 * Lấy lộ trình đi bộ từ vị trí khách hàng tới danh lam thắng cảnh / tiệm ăn uống
 */
export async function fetchWalkingRoute(
  origin: [number, number],
  destination: [number, number],
  targetName: string,
  targetType: 'heritage' | 'restaurant',
  targetId: string
): Promise<WalkingRouteResult> {
  const source =
    (await fetchFromFossgisFoot(origin, destination, targetName)) ??
    (await fetchFromGoong(origin, destination, targetName)) ??
    buildFallbackRoute(origin, destination, targetName);

  return { origin, destination, targetName, targetType, targetId, ...source };
}
