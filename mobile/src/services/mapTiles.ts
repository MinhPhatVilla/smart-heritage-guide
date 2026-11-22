/**
 * Cấu hình lớp bản đồ nền 100% OpenStreetMap & Vệ tinh miễn phí (KHÔNG cần API key).
 *
 * - `osm_3d`: OpenStreetMap Vector 3D (OpenFreeMap Liberty) phủ bảng màu chi tiết chuẩn Google Maps
 *   (tòa nhà 3D, tên đường & hẻm tiếng Việt, mũi tên đường 1 chiều, công viên, sông ngòi, POI).
 * - `osm_bright`: OpenStreetMap Vector Sáng phẳng, sắc nét tối đa khi đọc tên phố.
 * - `osm_hot`: OpenStreetMap Humanitarian Raster chi tiết cao (ổn định trên các nhà mạng Việt Nam).
 * - `satellite`: Ảnh vệ tinh độ phân giải cao Esri World Imagery + lớp nhãn địa danh & đường phố.
 */

export type BaseMapStyle = 'osm_3d' | 'osm_bright' | 'osm_hot' | 'satellite';

export type MapRenderMode = 'vector' | 'raster' | 'hybrid';

export interface MapTileConfig {
  id: BaseMapStyle;
  label: string;
  renderMode: MapRenderMode;
  /** Style JSON cho MapLibre GL JS (OpenStreetMap Vector Tiles miễn phí) */
  vectorStyleUrl?: string;
  /** Áp dụng bảng màu chi tiết kiểu Google Maps lên các lớp vector OSM */
  googleLikePalette?: boolean;
  /** URL raster tile chính (dùng trực tiếp cho chế độ raster/hybrid hoặc fallback khi thiếu WebGL) */
  url: string;
  /** Lớp phủ nhãn địa danh/đường phố cho chế độ Vệ tinh Hybrid */
  overlayUrl?: string;
  /** URL raster dự phòng nếu máy chủ chính chậm hoặc bị chặn */
  fallbackUrl?: string;
  subdomains?: string;
  attribution: string;
  maxZoom: number;
}

const OSM_HOT_URL = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
const OSM_FR_URL = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png';
const ESRI_SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

export function getMapTileStyles(): Record<BaseMapStyle, MapTileConfig> {
  return {
    osm_3d: {
      id: 'osm_3d',
      label: 'OSM Chi tiết 3D',
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
      renderMode: 'raster',
      url: OSM_HOT_URL,
      fallbackUrl: OSM_FR_URL,
      subdomains: 'abc',
      attribution: '&copy; OpenStreetMap contributors, HOT',
      maxZoom: 19,
    },
    satellite: {
      id: 'satellite',
      label: 'Vệ tinh + Nhãn',
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

export function getDefaultMapStyle(): BaseMapStyle {
  return 'osm_3d';
}

export function getTileConfig(style: BaseMapStyle): MapTileConfig {
  const styles = getMapTileStyles();
  return styles[style] ?? styles.osm_3d;
}

export function getAvailableMapStyles(): MapTileConfig[] {
  const styles = getMapTileStyles();
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
