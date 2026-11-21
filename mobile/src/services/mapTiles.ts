/**
 * Cấu hình lớp bản đồ nền (Goong Maps, CARTO, OpenStreetMap, Vệ tinh Esri)
 * Thiết kế dạng dữ liệu thuần (JSON-serializable) để nhúng trực tiếp vào WebView Leaflet / MapLibre.
 */

export type BaseMapStyle = 'goong' | 'carto' | 'osm' | 'satellite';

export interface MapTileConfig {
  id: BaseMapStyle;
  label: string;
  /** URL raster tile tương thích Leaflet `L.tileLayer(url, options)` */
  url: string;
  /** URL vector style của Goong tương thích MapLibre GL (khi có EXPO_PUBLIC_GOONG_MAPTILES_KEY) */
  maplibreStyleUrl?: string;
  subdomains?: string;
  attribution: string;
  maxZoom: number;
  requiresKey?: boolean;
}

export function getGoongMapTilesKey(): string {
  if (typeof process === 'undefined' || !process.env) return '';
  return (process.env.EXPO_PUBLIC_GOONG_MAPTILES_KEY || '').trim();
}

export function hasGoongMapTilesKey(): boolean {
  return getGoongMapTilesKey().length > 0;
}

/**
 * Trả về cấu hình tất cả 4 chế độ bản đồ.
 * - `goong`: ưu tiên Goong Maps (MapLibre style khi có key, kèm raster VN sạch cho Leaflet WebView)
 * - `carto`: CARTO Voyager miễn phí, rõ nét, tốc độ tải cao tại Việt Nam
 * - `osm`: OpenStreetMap tiêu chuẩn cộng đồng
 * - `satellite`: Ảnh vệ tinh độ phân giải cao Esri World Imagery
 */
export function getMapTileStyles(): Record<BaseMapStyle, MapTileConfig> {
  const goongKey = getGoongMapTilesKey();
  const encodedKey = goongKey ? encodeURIComponent(goongKey) : '';

  return {
    goong: {
      id: 'goong',
      label: goongKey ? 'Goong VN' : 'Đường phố VN',
      url: 'https://mt1.google.com/vt/lyrs=r&hl=vi&x={x}&y={y}&z={z}',
      ...(encodedKey
        ? {
            maplibreStyleUrl: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${encodedKey}`,
          }
        : {}),
      attribution: goongKey
        ? '&copy; Goong Maps Vietnam'
        : 'Map data &copy;2026 Vietnam Streets',
      maxZoom: 19,
      requiresKey: false,
    },
    carto: {
      id: 'carto',
      label: 'CARTO Sáng',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    },
    osm: {
      id: 'osm',
      label: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: 'abc',
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    },
    satellite: {
      id: 'satellite',
      label: 'Vệ tinh',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar',
      maxZoom: 19,
    },
  };
}

export const MAP_TILE_STYLES: Record<BaseMapStyle, MapTileConfig> = getMapTileStyles();

export function getDefaultMapStyle(): BaseMapStyle {
  return hasGoongMapTilesKey() ? 'goong' : 'carto';
}

export function getTileConfig(style: BaseMapStyle): MapTileConfig {
  const styles = getMapTileStyles();
  return styles[style] ?? styles.carto;
}

export function getAvailableMapStyles(): MapTileConfig[] {
  const styles = getMapTileStyles();
  return [styles.goong, styles.carto, styles.osm, styles.satellite];
}

/**
 * Tạo đường dẫn mở ứng dụng / web Google Maps chỉ đường đi bộ (miễn phí, không cần API key)
 */
export function buildGoogleMapsWalkingUrl(
  origin: [number, number],
  destination: [number, number]
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}&travelmode=walking`;
}
