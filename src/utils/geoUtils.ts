import {
  HeritageSite,
  NearbyRestaurant,
  RankedVisitedSite,
  VisitedSiteRecord,
} from '../types/heritage';

const EARTH_RADIUS_METERS = 6371000;
/** Vận tốc đi bộ tham quan trung bình: ~4.5 km/h = 1.25 m/s */
const AVERAGE_WALKING_SPEED_MPS = 1.25;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Tính khoảng cách đường chim bay (Haversine) giữa 2 tọa độ GPS (đơn vị: mét)
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Ước tính thời gian đi bộ thực tế (giây) từ khoảng cách đường chim bay (nhân hệ số đường phố 1.25)
 */
export function estimateWalkingSeconds(distanceMeters: number): number {
  const streetDistance = distanceMeters * 1.25;
  return Math.max(30, Math.round(streetDistance / AVERAGE_WALKING_SPEED_MPS));
}

/**
 * Định dạng khoảng cách hiển thị thân thiện (m hoặc km)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Định dạng thời gian đi bộ thân thiện (phút / giờ)
 */
export function formatWalkingDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.max(1, Math.round(seconds))} giây`;
  }
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) {
    const remainingSec = Math.round(seconds % 60);
    return remainingSec > 0 && totalMinutes < 10
      ? `${Math.floor(seconds / 60)} phút ${remainingSec}s`
      : `${totalMinutes} phút đi bộ`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours} giờ ${mins} phút` : `${hours} giờ`;
}

/**
 * Sắp xếp danh sách danh lam thắng cảnh theo khoảng cách / thời gian đi bộ tới vị trí người dùng
 */
export function getNearbySitesWithMetrics(
  sites: HeritageSite[],
  userLat: number,
  userLng: number,
  maxRadiusMeters?: number
): Array<{
  site: HeritageSite;
  distanceMeters: number;
  estimatedWalkingSeconds: number;
}> {
  const mapped = sites.map((site) => {
    const distanceMeters = calculateDistanceMeters(userLat, userLng, site.lat, site.lng);
    const estimatedWalkingSeconds = estimateWalkingSeconds(distanceMeters);
    return { site, distanceMeters, estimatedWalkingSeconds };
  });

  const filtered =
    typeof maxRadiusMeters === 'number' && maxRadiusMeters > 0
      ? mapped.filter((item) => item.distanceMeters <= maxRadiusMeters)
      : mapped;

  return filtered.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Đề xuất tiệm ăn uống gần di tích có điểm đánh giá tốt, sắp xếp theo rating giảm dần & khoảng cách
 */
export function getRecommendedRestaurants(
  restaurants: NearbyRestaurant[],
  referenceLat: number,
  referenceLng: number,
  minRating = 4.0
): Array<NearbyRestaurant & { distanceMeters: number; walkingSeconds: number }> {
  return restaurants
    .filter((r) => r.rating >= minRating)
    .map((r) => {
      const distanceMeters = calculateDistanceMeters(referenceLat, referenceLng, r.lat, r.lng);
      const walkingSeconds = estimateWalkingSeconds(distanceMeters);
      return { ...r, distanceMeters, walkingSeconds };
    })
    .sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return a.distanceMeters - b.distanceMeters;
    });
}

/**
 * Xếp hạng những nơi người dùng đã đi qua dựa trên thời gian đi bộ tới điểm danh lam thắng cảnh đó
 * - 'longest_walk': Xếp hạng nỗ lực chinh phục (thời gian đi bộ lâu nhất lên đầu)
 * - 'shortest_walk': Xếp hạng di chuyển nhanh nhất (thời gian đi bộ ngắn nhất lên đầu)
 */
export function rankVisitedSitesByWalkingTime(
  records: VisitedSiteRecord[],
  mode: 'longest_walk' | 'shortest_walk' = 'longest_walk'
): RankedVisitedSite[] {
  const sorted = [...records].sort((a, b) => {
    if (mode === 'longest_walk') {
      if (b.walkingDurationSeconds !== a.walkingDurationSeconds) {
        return b.walkingDurationSeconds - a.walkingDurationSeconds;
      }
      return b.walkingDistanceMeters - a.walkingDistanceMeters;
    } else {
      if (a.walkingDurationSeconds !== b.walkingDurationSeconds) {
        return a.walkingDurationSeconds - b.walkingDurationSeconds;
      }
      return a.walkingDistanceMeters - b.walkingDistanceMeters;
    }
  });

  return sorted.map((record, index) => {
    const rank = index + 1;
    let badgeTitle = 'Bước Chân Khám Phá';
    if (record.walkingDurationSeconds >= 1200) {
      badgeTitle = 'Kiện Tướng Bộ Hành Di Sản';
    } else if (record.walkingDurationSeconds >= 600) {
      badgeTitle = 'Nhà Thám Hiểm Bền Bỉ';
    } else if (record.walkingDurationSeconds >= 300) {
      badgeTitle = 'Người Lữ Hành Văn Hóa';
    }

    const effortScore = Math.round(
      record.walkingDurationSeconds * 0.5 +
        record.walkingDistanceMeters * 0.2 +
        record.photos.length * 100
    );

    return {
      rank,
      record,
      badgeTitle,
      effortScore,
    };
  });
}
