import { RouteStep, WalkingRouteResult } from '../types/heritage';
import { calculateDistanceMeters, estimateWalkingSeconds } from '../utils/geoUtils';

/**
 * Tạo đường đi bộ nội suy mượt mà khi ngoại tuyến hoặc OSRM không phản hồi
 */
function buildFallbackWalkingRoute(
  origin: [number, number],
  destination: [number, number],
  targetName: string,
  targetType: 'heritage' | 'restaurant',
  targetId: string
): WalkingRouteResult {
  const [lat1, lng1] = origin;
  const [lat2, lng2] = destination;
  const straightDist = calculateDistanceMeters(lat1, lng1, lat2, lng2);
  const totalDistanceMeters = Math.max(50, Math.round(straightDist * 1.2));
  const estimatedDurationSeconds = estimateWalkingSeconds(straightDist);

  // Tạo 8 điểm trung gian giả lập lộ trình đi bộ qua các góc phố
  const coordinates: [number, number][] = [];
  const segments = 8;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Tạo độ cong nhẹ mô phỏng đường phố thực tế
    const curveOffset = Math.sin(t * Math.PI) * 0.00045;
    const lat = lat1 + (lat2 - lat1) * t + curveOffset;
    const lng = lng1 + (lng2 - lng1) * t - curveOffset * 0.6;
    coordinates.push([lat, lng]);
  }

  const steps: RouteStep[] = [
    {
      instruction: `Xuất phát từ vị trí hiện tại, đi bộ dọc theo tuyến đường chính hướng về ${targetName}`,
      distanceMeters: Math.round(totalDistanceMeters * 0.4),
      durationSeconds: Math.round(estimatedDurationSeconds * 0.4),
      maneuverType: 'depart',
    },
    {
      instruction: 'Rẽ vào trục đường văn hóa du lịch, đi thẳng theo vỉa hè dành cho người đi bộ',
      distanceMeters: Math.round(totalDistanceMeters * 0.45),
      durationSeconds: Math.round(estimatedDurationSeconds * 0.45),
      maneuverType: 'straight',
    },
    {
      instruction: `Đến cổng chính ${targetName} — Hệ thống sẵn sàng kích hoạt thuyết minh đa ngôn ngữ`,
      distanceMeters: Math.round(totalDistanceMeters * 0.15),
      durationSeconds: Math.round(estimatedDurationSeconds * 0.15),
      maneuverType: 'arrive',
    },
  ];

  return {
    origin,
    destination,
    targetName,
    targetType,
    targetId,
    coordinates,
    totalDistanceMeters,
    estimatedDurationSeconds,
    steps,
  };
}

/**
 * Lấy lộ trình dẫn đường đi bộ từ vị trí khách hàng tới danh lam thắng cảnh / tiệm ăn uống
 */
export async function fetchWalkingRoute(
  origin: [number, number],
  destination: [number, number],
  targetName: string,
  targetType: 'heritage' | 'restaurant',
  targetId: string
): Promise<WalkingRouteResult> {
  const [lat1, lng1] = origin;
  const [lat2, lng2] = destination;

  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&steps=true`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return buildFallbackWalkingRoute(origin, destination, targetName, targetType, targetId);
    }

    const data = await response.json();
    const route = data?.routes?.[0];
    if (!route || !route.geometry?.coordinates?.length) {
      return buildFallbackWalkingRoute(origin, destination, targetName, targetType, targetId);
    }

    const coordinates: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]]
    );

    const rawSteps = route.legs?.[0]?.steps || [];
    const steps: RouteStep[] =
      rawSteps.length > 0
        ? rawSteps.slice(0, 6).map((step: any, idx: number) => {
            const roadName = step.name ? ` đường ${step.name}` : ' tuyến phố tiếp theo';
            const mod = step.maneuver?.modifier || '';
            let instruction = `Đi bộ tiếp theo${roadName}`;
            let maneuverType: RouteStep['maneuverType'] = 'straight';

            if (idx === 0) {
              instruction = `Bắt đầu đi bộ từ vị trí hiện tại vào${roadName}`;
              maneuverType = 'depart';
            } else if (idx === rawSteps.length - 1) {
              instruction = `Đến đích: ${targetName}`;
              maneuverType = 'arrive';
            } else if (mod.includes('left')) {
              instruction = `Rẽ trái vào${roadName}`;
              maneuverType = 'turn-left';
            } else if (mod.includes('right')) {
              instruction = `Rẽ phải vào${roadName}`;
              maneuverType = 'turn-right';
            }

            return {
              instruction,
              distanceMeters: Math.max(10, Math.round(step.distance || 50)),
              durationSeconds: Math.max(10, Math.round(step.duration || 40)),
              maneuverType,
            };
          })
        : buildFallbackWalkingRoute(origin, destination, targetName, targetType, targetId).steps;

    const straightDist = calculateDistanceMeters(lat1, lng1, lat2, lng2);
    const totalDistanceMeters = Math.max(
      straightDist,
      Math.round(route.distance || straightDist * 1.2)
    );
    const estimatedDurationSeconds = Math.max(
      estimateWalkingSeconds(straightDist),
      Math.round(route.duration || estimateWalkingSeconds(straightDist))
    );

    return {
      origin,
      destination,
      targetName,
      targetType,
      targetId,
      coordinates,
      totalDistanceMeters,
      estimatedDurationSeconds,
      steps,
    };
  } catch {
    return buildFallbackWalkingRoute(origin, destination, targetName, targetType, targetId);
  }
}
