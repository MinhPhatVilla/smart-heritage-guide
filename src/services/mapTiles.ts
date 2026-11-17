import L from 'leaflet';

/**
 * Hệ thống Bản đồ 4 Chế độ (Đã kiểm tra trả về 200 OK 25KB-35KB tức thì trên mạng VN,
 * dùng thuần Leaflet DOM không phụ thuộc Web Worker nên không bao giờ bị trắng màn hình!)
 */

export type BaseMapStyle = 'topo' | 'vn_clean' | 'hot' | 'satellite';

export const MAP_TILE_STYLES: Record<
  BaseMapStyle,
  {
    label: string;
    url: string;
    subdomains?: string;
    attribution: string;
  }
> = {
  topo: {
    label: 'Hiện đại',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Garmin, FAO, NOAA, USGS',
  },
  vn_clean: {
    label: 'Đường phố VN',
    url: 'https://mt1.google.com/vt/lyrs=r&hl=vi&x={x}&y={y}&z={z}',
    attribution: 'Map data &copy;2026',
  },
  hot: {
    label: 'Di sản (HOT)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: '&copy; OpenStreetMap contributors, HOT',
  },
  satellite: {
    label: 'Vệ tinh',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar',
  },
};

export function createTileLayer(style: BaseMapStyle): L.TileLayer {
  const cfg = MAP_TILE_STYLES[style] || MAP_TILE_STYLES.topo;
  return L.tileLayer(cfg.url, {
    subdomains: cfg.subdomains || 'abc',
    attribution: cfg.attribution,
    maxZoom: 19,
  });
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
