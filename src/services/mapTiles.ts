/**
 * Cấu hình Bản đồ Vector 60fps (MapLibre GL + OpenFreeMap / Goong)
 * 100% miễn phí, sắc nét chuẩn Retina, hỗ trợ tòa nhà 3D, không cần API key!
 */

export type BaseMapStyle = 'liberty' | 'positron' | 'bright';

const GOONG_MAPTILES_KEY = (import.meta.env.VITE_GOONG_MAPTILES_KEY || '').trim();

export const isGoongMapEnabled = GOONG_MAPTILES_KEY.length > 0;

export const VECTOR_MAP_STYLES: Record<
  BaseMapStyle,
  {
    label: string;
    styleUrl: string;
    goongStyleUrl: string;
  }
> = {
  liberty: {
    label: 'Hiện đại 3D',
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    goongStyleUrl: 'https://tiles.goong.io/assets/goong_map_web.json',
  },
  positron: {
    label: 'Tối giản',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    goongStyleUrl: 'https://tiles.goong.io/assets/goong_light_v2.json',
  },
  bright: {
    label: 'Đường phố',
    styleUrl: 'https://tiles.openfreemap.org/styles/bright',
    goongStyleUrl: 'https://tiles.goong.io/assets/ navigation_day.json'.replace(
      ' ',
      ''
    ),
  },
};

export function resolveMapStyleUrl(style: BaseMapStyle): string {
  const cfg = VECTOR_MAP_STYLES[style] || VECTOR_MAP_STYLES.liberty;
  if (isGoongMapEnabled) {
    return `${cfg.goongStyleUrl}?api_key=${encodeURIComponent(GOONG_MAPTILES_KEY)}`;
  }
  return cfg.styleUrl;
}

/**
 * Tạo đa giác hình tròn GeoJSON mượt mà (64 cạnh) biểu diễn bán kính quét xung quanh khách hàng
 */
export function createGeoJsonCircle(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  points = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const distanceX =
    radiusMeters / (111320 * Math.cos((centerLat * Math.PI) / 180));
  const distanceY = radiusMeters / 110574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([centerLng + x, centerLat + y]);
  }
  coords.push(coords[0]);

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  };
}

/**
 * Tạo link mở trực tiếp Google Maps chính thức (100% miễn phí, không cần API key)
 */
export function buildGoogleMapsWalkingUrl(
  origin: [number, number],
  destination: [number, number]
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}&travelmode=walking`;
}
