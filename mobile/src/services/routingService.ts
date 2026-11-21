import { RouteStep, WalkingRouteResult } from '../types/heritage';
import { calculateDistanceMeters, estimateWalkingSeconds } from '../utils/geoUtils';

/**
 * Thứ tự nguồn chỉ đường đi bộ:
 * 1. Backend Routing Proxy (`POST /api/v1/routing/walking`) — có cache DB + OSRM/Goong server-side
 * 2. FOSSGIS OSRM (routing.openstreetmap.de) — profile đi bộ thật, miễn phí, không cần key
 * 3. Goong Direction API (nếu có EXPO_PUBLIC_GOONG_API_KEY) — Goong không có chế độ đi bộ nên dùng
 *    hình học tuyến `bike`, còn thời gian được tính lại theo tốc độ đi bộ (~1.25 m/s)
 * 4. Tuyến nội suy offline — để ứng dụng vẫn chạy mượt khi mất mạng
 *
 * Lưu ý: router.project-osrm.org chỉ chạy profile ô tô (bỏ qua chữ `foot` trong URL),
 * nên không dùng để tính đường đi bộ.
 */

const FOSSGIS_FOOT_URL = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';
const GOONG_DIRECTION_URL = 'https://rsapi.goong.io/v2/direction';
const DEFAULT_BACKEND_URL = 'http://localhost:8000';
const BACKEND_PROXY_TIMEOUT_MS = 2500;
const REQUEST_TIMEOUT_MS = 6000;

export type RouteSource = Omit<
  WalkingRouteResult,
  'origin' | 'destination' | 'targetName' | 'targetType' | 'targetId'
>;

interface OsrmStep {
  name?: string;
  distance?: number;
  duration?: number;
  maneuver?: {
    type?: string;
    modifier?: string;
  };
}

interface OsrmResponse {
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: {
      coordinates?: [number, number][];
    };
    legs?: Array<{
      steps?: OsrmStep[];
    }>;
  }>;
}

interface GoongStep {
  distance?: { value?: number };
  html_instructions?: string;
  maneuver?: string;
}

interface GoongDirectionResponse {
  routes?: Array<{
    overview_polyline?: { points?: string };
    legs?: Array<{
      distance?: { value?: number };
      steps?: GoongStep[];
    }>;
  }>;
}

function getGoongApiKey(): string {
  if (typeof process === 'undefined' || !process.env) return '';
  return (process.env.EXPO_PUBLIC_GOONG_API_KEY || '').trim();
}

async function fetchJsonWithTimeout<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
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
  const data = await fetchJsonWithTimeout<OsrmResponse>(
    `${FOSSGIS_FOOT_URL}/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&steps=true`
  );
  const route = data?.routes?.[0];
  if (!route?.geometry?.coordinates?.length) return null;

  const coordinates: [number, number][] = route.geometry.coordinates.map(
    (c: [number, number]) => [c[1], c[0]]
  );

  const rawSteps: OsrmStep[] = route.legs?.[0]?.steps || [];
  const steps: RouteStep[] = rawSteps
    .filter((s) => (s.distance || 0) > 0 || s.maneuver?.type === 'arrive')
    .slice(0, 8)
    .map((step, idx, arr) => {
      const road = step.name ? ` đường ${step.name}` : ' tuyến phố tiếp theo';
      const modifier = step.maneuver?.modifier || '';
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
    totalDistanceMeters: Math.round(route.distance ?? 0),
    estimatedDurationSeconds: Math.round(route.duration ?? 0),
    steps,
  };
}

/** 2. Goong Direction API (dự phòng) — dùng tuyến xe máy, tính lại thời gian theo tốc độ đi bộ */
async function fetchFromGoong(
  origin: [number, number],
  destination: [number, number],
  targetName: string
): Promise<RouteSource | null> {
  const apiKey = getGoongApiKey();
  if (!apiKey) return null;

  const data = await fetchJsonWithTimeout<GoongDirectionResponse>(
    `${GOONG_DIRECTION_URL}?origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}&vehicle=bike&api_key=${encodeURIComponent(apiKey)}`
  );
  const route = data?.routes?.[0];
  const leg = route?.legs?.[0];
  if (!route || !leg) return null;

  const encoded = route.overview_polyline?.points;
  const coordinates = encoded ? decodePolyline(encoded) : [];
  if (coordinates.length < 2) return null;

  const totalDistanceMeters = Math.round(leg.distance?.value ?? 0);
  if (!totalDistanceMeters) return null;

  // Goong tính thời gian cho xe máy => quy đổi lại sang tốc độ đi bộ (~1.25 m/s)
  const estimatedDurationSeconds = Math.round(totalDistanceMeters / 1.25);

  const rawSteps: GoongStep[] = leg.steps || [];
  const steps: RouteStep[] = rawSteps.slice(0, 8).map((step, idx, arr) => {
    const distanceMeters = Math.max(5, Math.round(step.distance?.value ?? 0));
    const text = stripHtml(step.html_instructions || '') || 'Đi tiếp theo tuyến phố';
    const maneuverType: RouteStep['maneuverType'] =
      idx === 0
        ? 'depart'
        : idx === arr.length - 1
          ? 'arrive'
          : maneuverFromModifier(String(step.maneuver || ''));
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
export function buildFallbackRoute(
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

interface BackendRouteStepDTO {
  instruction?: string;
  distance_meters?: number;
  duration_seconds?: number;
  maneuver_type?: RouteStep['maneuverType'];
}

interface BackendWalkingRouteResponse {
  coordinates?: [number, number][];
  total_distance_meters?: number;
  estimated_duration_seconds?: number;
  steps?: BackendRouteStepDTO[];
  provider?: 'osrm' | 'goong' | 'fallback';
  cached?: boolean;
}

function getBackendProxyBaseUrl(): string {
  if (typeof process === 'undefined' || !process.env) {
    return DEFAULT_BACKEND_URL;
  }
  const explicit = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  // Trong môi trường unit test (Vitest) không cấu hình biến môi trường, bỏ qua proxy
  // để không can thiệp vào các bài test OSRM/Goong trực tiếp.
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return '';
  }
  return DEFAULT_BACKEND_URL;
}

/** 0. Backend Routing Proxy (`POST /api/v1/routing/walking`) — ưu tiên khi máy chủ khả dụng */
async function fetchFromBackendProxy(
  origin: [number, number],
  destination: [number, number],
  targetName: string,
  targetType: 'heritage' | 'restaurant',
  targetId: string
): Promise<RouteSource | null> {
  const baseUrl = getBackendProxyBaseUrl();
  if (!baseUrl) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_PROXY_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}/api/v1/routing/walking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        origin_lat: origin[0],
        origin_lng: origin[1],
        dest_lat: destination[0],
        dest_lng: destination[1],
        target_id: targetId,
        target_name: targetName,
        target_type: targetType,
        language: 'vi',
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const data = (await response.json()) as BackendWalkingRouteResponse;
    if (!Array.isArray(data?.coordinates) || data.coordinates.length < 2) {
      return null;
    }

    const coordinates: [number, number][] = data.coordinates.map((pt) => [
      Number(pt[0]),
      Number(pt[1]),
    ]);
    const steps: RouteStep[] = (data.steps || []).map((step, idx, arr) => ({
      instruction: step.instruction || `Đi bộ theo hướng ${targetName}`,
      distanceMeters: Math.max(0, Math.round(step.distance_meters ?? 0)),
      durationSeconds: Math.max(0, Math.round(step.duration_seconds ?? 0)),
      maneuverType:
        step.maneuver_type ||
        (idx === 0 ? 'depart' : idx === arr.length - 1 ? 'arrive' : 'straight'),
    }));

    return {
      coordinates,
      totalDistanceMeters: Math.max(
        50,
        Math.round(data.total_distance_meters ?? 0)
      ),
      estimatedDurationSeconds: Math.max(
        30,
        Math.round(data.estimated_duration_seconds ?? 0)
      ),
      steps,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Lấy lộ trình đi bộ từ vị trí người dùng tới danh lam thắng cảnh / tiệm ăn uống
 */
export async function fetchWalkingRoute(
  origin: [number, number],
  destination: [number, number],
  targetName: string,
  targetType: 'heritage' | 'restaurant',
  targetId: string
): Promise<WalkingRouteResult> {
  const source =
    (await fetchFromBackendProxy(
      origin,
      destination,
      targetName,
      targetType,
      targetId
    )) ??
    (await fetchFromFossgisFoot(origin, destination, targetName)) ??
    (await fetchFromGoong(origin, destination, targetName)) ??
    buildFallbackRoute(origin, destination, targetName);

  return { origin, destination, targetName, targetType, targetId, ...source };
}
