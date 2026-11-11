import L from 'leaflet';

/**
 * Quản lý bản đồ nền cho toàn bộ ứng dụng.
 * - Có Goong Map Tiles key  => bản đồ vector Goong (render bằng MapLibre GL bên trong Leaflet)
 * - Không có key / key lỗi  => tự động dùng bản đồ raster CARTO (OpenStreetMap) miễn phí
 *
 * Marker, popup, đường dẫn đi bộ vẫn là layer Leaflet nên không phụ thuộc nhà cung cấp bản đồ nền.
 */

export type BaseMapStyle = 'street' | 'light' | 'dark';
export type BaseMapProvider = 'goong' | 'carto';

const GOONG_MAPTILES_KEY = (import.meta.env.VITE_GOONG_MAPTILES_KEY || '').trim();

export const isGoongMapEnabled = GOONG_MAPTILES_KEY.length > 0;

const GOONG_ATTRIBUTION =
  '&copy; <a href="https://goong.io" target="_blank" rel="noopener">Goong</a> &copy; OpenStreetMap';
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>';

export const BASE_MAP_STYLES: Record<
  BaseMapStyle,
  { label: string; goongStyleUrl: string; cartoUrl: string }
> = {
  street: {
    label: 'Đường phố',
    goongStyleUrl: 'https://tiles.goong.io/assets/goong_map_web.json',
    cartoUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  },
  light: {
    label: 'Sáng',
    goongStyleUrl: 'https://tiles.goong.io/assets/goong_light_v2.json',
    cartoUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  },
  dark: {
    label: 'Tối',
    goongStyleUrl: 'https://tiles.goong.io/assets/goong_map_dark.json',
    cartoUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  },
};

/** Gắn api_key vào mọi request tới máy chủ Goong (style, sprite, glyph, tile) nếu còn thiếu */
export function withGoongKey(url: string): string {
  if (!url.includes('goong.io') || /[?&]api_key=/.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(GOONG_MAPTILES_KEY)}`;
}

interface MountOptions {
  /** false => luôn dùng CARTO (tiết kiệm quota Goong cho bản đồ phụ mở thường xuyên) */
  preferGoong?: boolean;
  onProviderChange?: (provider: BaseMapProvider, reason?: string) => void;
}

/**
 * Gắn bản đồ nền vào một Leaflet map. Trả về hàm cleanup để gỡ layer khi đổi kiểu bản đồ / unmount.
 */
export function mountBaseLayer(
  map: L.Map,
  style: BaseMapStyle,
  { preferGoong = true, onProviderChange }: MountOptions = {}
): () => void {
  let disposed = false;
  let currentLayer: L.Layer | null = null;
  let currentAttribution: string | null = null;

  const setAttribution = (text: string) => {
    if (currentAttribution) map.attributionControl?.removeAttribution(currentAttribution);
    map.attributionControl?.addAttribution(text);
    currentAttribution = text;
  };

  const mountCarto = (reason?: string) => {
    if (disposed) return;
    if (currentLayer) map.removeLayer(currentLayer);
    currentLayer = L.tileLayer(BASE_MAP_STYLES[style].cartoUrl, {
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);
    setAttribution(CARTO_ATTRIBUTION);
    onProviderChange?.('carto', reason);
  };

  if (!preferGoong || !isGoongMapEnabled) {
    mountCarto();
  } else {
    (async () => {
      try {
        const [{ maplibreGL }] = await Promise.all([
          import('@maplibre/maplibre-gl-leaflet'),
          import('maplibre-gl/dist/maplibre-gl.css'),
        ]);
        if (disposed) return;

        const goongLayer = maplibreGL({
          style: withGoongKey(BASE_MAP_STYLES[style].goongStyleUrl),
          transformRequest: (url) => ({ url: withGoongKey(url) }),
        });
        goongLayer.addTo(map);
        currentLayer = goongLayer;
        setAttribution(GOONG_ATTRIBUTION);
        onProviderChange?.('goong');

        // Key sai / hết quota / style không tải được => chuyển sang CARTO để bản đồ không bị trắng
        const glMap = goongLayer.getMaplibreMap();
        let styleLoaded = false;
        let fellBack = false;
        glMap.once('load', () => {
          styleLoaded = true;
        });
        glMap.on('error', (event) => {
          if (fellBack || disposed) return;
          // MapLibre gắn thêm status (HTTP) và sourceId (lỗi tile) vào error event
          const ev = event as unknown as { error?: { status?: number }; sourceId?: string };
          const status = ev.error?.status;
          const authError = status === 401 || status === 403;
          const styleError = !styleLoaded && !ev.sourceId;
          if (authError || styleError) {
            fellBack = true;
            console.warn('[Goong] Không tải được bản đồ Goong, chuyển sang CARTO.', ev?.error);
            mountCarto(
              authError
                ? 'Goong Map Tiles key không hợp lệ hoặc đã hết quota'
                : 'Không tải được bản đồ Goong'
            );
          }
        });
      } catch (err) {
        console.warn('[Goong] Lỗi khởi tạo MapLibre, chuyển sang CARTO.', err);
        mountCarto('Không khởi tạo được bản đồ Goong');
      }
    })();
  }

  return () => {
    disposed = true;
    if (currentLayer) map.removeLayer(currentLayer);
    if (currentAttribution) map.attributionControl?.removeAttribution(currentAttribution);
    currentLayer = null;
    currentAttribution = null;
  };
}
