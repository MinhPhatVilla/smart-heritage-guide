/**
 * Cấu hình lớp bản đồ nền hỗ trợ song song:
 * 1. Mapbox GL JS v3 (khi có `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` hoặc nhập token `pk.` trong app):
 *    - `mapbox_standard`: Mapbox Standard 3D (tòa nhà 3D, cây xanh 3D, ánh sáng Ngày/Hoàng hôn/Đêm)
 *    - `mapbox_streets`: Mapbox Đường phố v12 sắc nét + khối nhà 3D
 *    - `mapbox_satellite`: Mapbox Vệ tinh + Tên đường v12
 *    - `mapbox_outdoors`: Mapbox Địa hình & Công viên v12
 * 2. OpenStreetMap Vector 3D & Vệ tinh miễn phí (không cần API key — dùng ngay hoặc làm fallback):
 *    - `osm_3d`, `osm_bright`, `osm_hot`, `satellite`
 */

export type BaseMapStyle =
  | 'mapbox_standard'
  | 'mapbox_streets'
  | 'mapbox_satellite'
  | 'mapbox_outdoors'
  | 'osm_3d'
  | 'osm_bright'
  | 'osm_hot'
  | 'satellite';

export type MapEngine = 'mapbox' | 'maplibre';

export type MapRenderMode = 'mapbox' | 'vector' | 'raster' | 'hybrid';

export type MapboxLightPreset = 'day' | 'dusk' | 'night';

export interface MapTileConfig {
  id: BaseMapStyle;
  label: string;
  engine: MapEngine;
  renderMode: MapRenderMode;
  /** Mapbox Studio style URI (ví dụ: mapbox://styles/mapbox/standard) */
  mapboxStyleUrl?: string;
  /** Hỗ trợ chỉnh ánh sáng Ngày / Hoàng hôn / Đêm (Mapbox Standard v3) */
  supportsLightPreset?: boolean;
  /** Style JSON cho MapLibre GL JS (OpenStreetMap Vector Tiles miễn phí) */
  vectorStyleUrl?: string;
  /** Áp dụng bảng màu chi tiết kiểu Google Maps lên các lớp vector OSM */
  googleLikePalette?: boolean;
  /** URL raster tile dự phòng (OSM HOT / Esri) */
  url: string;
  overlayUrl?: string;
  fallbackUrl?: string;
  subdomains?: string;
  attribution: string;
  maxZoom: number;
  requiresMapboxToken?: boolean;
}

export const MAPBOX_TOKEN_STORAGE_KEY = 'shg_mapbox_access_token_v1';

const OSM_HOT_URL = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
const OSM_FR_URL = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png';
const ESRI_SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

export function getEnvMapboxAccessToken(): string {
  // Không kiểm tra `typeof process === 'undefined'` trước vì Expo/Babel thay thế trực tiếp
  // biểu thức `process.env.EXPO_PUBLIC_*` thành chuỗi tĩnh khi bundle cho Web/Mobile.
  try {
    return (process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '').trim();
  } catch {
    return '';
  }
}

export function isValidMapboxPublicToken(token: string | null | undefined): boolean {
  const clean = (token || '').trim();
  return clean.startsWith('pk.') && clean.length >= 24;
}

export function resolveMapboxAccessToken(runtimeToken?: string | null): string {
  const runtime = (runtimeToken || '').trim();
  if (isValidMapboxPublicToken(runtime)) return runtime;
  const envToken = getEnvMapboxAccessToken();
  if (isValidMapboxPublicToken(envToken)) return envToken;
  return '';
}

export function getMapTileStyles(): Record<BaseMapStyle, MapTileConfig> {
  return {
    mapbox_standard: {
      id: 'mapbox_standard',
      label: 'Mapbox Standard 3D',
      engine: 'mapbox',
      renderMode: 'mapbox',
      mapboxStyleUrl: 'mapbox://styles/mapbox/standard',
      supportsLightPreset: true,
      url: OSM_HOT_URL,
      fallbackUrl: OSM_FR_URL,
      subdomains: 'abc',
      attribution: '&copy; Mapbox &copy; OpenStreetMap',
      maxZoom: 21,
      requiresMapboxToken: true,
    },
    mapbox_streets: {
      id: 'mapbox_streets',
      label: 'Mapbox Đường phố',
      engine: 'mapbox',
      renderMode: 'mapbox',
      mapboxStyleUrl: 'mapbox://styles/mapbox/streets-v12',
      url: OSM_HOT_URL,
      fallbackUrl: OSM_FR_URL,
      subdomains: 'abc',
      attribution: '&copy; Mapbox &copy; OpenStreetMap',
      maxZoom: 21,
      requiresMapboxToken: true,
    },
    mapbox_satellite: {
      id: 'mapbox_satellite',
      label: 'Mapbox Vệ tinh 3D',
      engine: 'mapbox',
      renderMode: 'mapbox',
      mapboxStyleUrl: 'mapbox://styles/mapbox/satellite-streets-v12',
      url: ESRI_SATELLITE_URL,
      overlayUrl: ESRI_LABELS_URL,
      fallbackUrl: OSM_HOT_URL,
      attribution: '&copy; Mapbox &copy; Maxar &copy; OpenStreetMap',
      maxZoom: 21,
      requiresMapboxToken: true,
    },
    mapbox_outdoors: {
      id: 'mapbox_outdoors',
      label: 'Mapbox Địa hình',
      engine: 'mapbox',
      renderMode: 'mapbox',
      mapboxStyleUrl: 'mapbox://styles/mapbox/outdoors-v12',
      url: OSM_HOT_URL,
      fallbackUrl: OSM_FR_URL,
      subdomains: 'abc',
      attribution: '&copy; Mapbox &copy; OpenStreetMap',
      maxZoom: 21,
      requiresMapboxToken: true,
    },
    osm_3d: {
      id: 'osm_3d',
      label: 'OSM Chi tiết 3D',
      engine: 'maplibre',
      renderMode: 'vector',
      vectorStyleUrl: 'https://tiles.openfreemap.org/styles/liberty',
      googleLikePalette: true,
      url: OSM_HOT_URL,
      fallbackUrl: OSM_FR_URL,
      subdomains: 'abc',
      attribution: '&copy; OpenStreetMap contributors &copy; OpenFreeMap',
      maxZoom: 20,
    },
    osm_bright: {
      id: 'osm_bright',
      label: 'OSM Sáng phẳng',
      engine: 'maplibre',
      renderMode: 'vector',
      vectorStyleUrl: 'https://tiles.openfreemap.org/styles/bright',
      googleLikePalette: false,
      url: OSM_FR_URL,
      fallbackUrl: OSM_HOT_URL,
      subdomains: 'abc',
      attribution: '&copy; OpenStreetMap contributors &copy; OpenFreeMap',
      maxZoom: 20,
    },
    osm_hot: {
      id: 'osm_hot',
      label: 'OSM Cổ điển',
      engine: 'maplibre',
      renderMode: 'raster',
      url: OSM_HOT_URL,
      fallbackUrl: OSM_FR_URL,
      subdomains: 'abc',
      attribution: '&copy; OpenStreetMap contributors, HOT',
      maxZoom: 19,
    },
    satellite: {
      id: 'satellite',
      label: 'Vệ tinh miễn phí',
      engine: 'maplibre',
      renderMode: 'hybrid',
      url: ESRI_SATELLITE_URL,
      overlayUrl: ESRI_LABELS_URL,
      fallbackUrl: OSM_HOT_URL,
      attribution: 'Tiles &copy; Esri, Maxar &copy; OpenStreetMap',
      maxZoom: 19,
    },
  };
}

export const MAP_TILE_STYLES: Record<BaseMapStyle, MapTileConfig> =
  getMapTileStyles();

export function getDefaultMapStyle(runtimeMapboxToken?: string | null): BaseMapStyle {
  return resolveMapboxAccessToken(runtimeMapboxToken)
    ? 'mapbox_standard'
    : 'osm_3d';
}

export function getTileConfig(style: BaseMapStyle): MapTileConfig {
  const styles = getMapTileStyles();
  return styles[style] ?? styles.osm_3d;
}

export function getAvailableMapStyles(
  runtimeMapboxToken?: string | null
): MapTileConfig[] {
  const styles = getMapTileStyles();
  const hasToken = Boolean(resolveMapboxAccessToken(runtimeMapboxToken));
  if (hasToken) {
    return [
      styles.mapbox_standard,
      styles.mapbox_streets,
      styles.mapbox_satellite,
      styles.mapbox_outdoors,
      styles.osm_3d,
    ];
  }
  return [styles.osm_3d, styles.osm_bright, styles.osm_hot, styles.satellite];
}

/**
 * Tạo đường dẫn mở OpenStreetMap chỉ đường đi bộ (OSRM Foot, miễn phí, không cần API key)
 */
export function buildOsmWalkingUrl(
  origin: [number, number],
  destination: [number, number]
): string {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${origin[0]}%2C${origin[1]}%3B${destination[0]}%2C${destination[1]}`;
}

/**
 * Giữ tương thích ngược cho các module cũ nếu có gọi trực tiếp.
 */
export function buildGoogleMapsWalkingUrl(
  origin: [number, number],
  destination: [number, number]
): string {
  return buildOsmWalkingUrl(origin, destination);
}
