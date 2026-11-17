import L from 'leaflet';

/**
 * Quản lý bản đồ nền 100% miễn phí, KHÔNG CẦN API KEY cho đồ án:
 * - Chế độ "Đường phố" (street): Esri World Street Map (Raster sắc nét, không cần key, hoạt động mọi mạng VN)
 *   (Nếu người dùng có cấu hình VITE_GOONG_MAPTILES_KEY thì tự động ưu tiên Goong Vector)
 * - Chế độ "Vector 3D" (light): OpenFreeMap Liberty Vector (MapLibre GL, mã nguồn mở miễn phí 100%, không cần key)
 * - Chế độ "Vệ tinh" (dark): Esri World Imagery Satellite (Ảnh vệ tinh thực tế, không cần key)
 */

export type BaseMapStyle = 'street' | 'light' | 'dark';
export type BaseMapProvider = 'goong' | 'openfreemap' | 'esri';

const GOONG_MAPTILES_KEY = (import.meta.env.VITE_GOONG_MAPTILES_KEY || '').trim();

export const isGoongMapEnabled = GOONG_MAPTILES_KEY.length > 0;

const GOONG_ATTRIBUTION =
  '&copy; <a href="https://goong.io" target="_blank" rel="noopener">Goong</a> &copy; OpenStreetMap';
const OPENFREEMAP_ATTRIBUTION =
  '&copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; OpenStreetMap';
const ESRI_STREET_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; OpenStreetMap, HERE, Garmin, USGS';
const ESRI_SAT_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';

export const BASE_MAP_STYLES: Record<
  BaseMapStyle,
  {
    label: string;
    goongStyleUrl: string;
    openFreeMapStyleUrl: string;
    esriTileUrl: string;
  }
> = {
  street: {
    label: 'Đường phố',
    goongStyleUrl: 'https://tiles.goong.io/assets/goong_map_web.json',
    openFreeMapStyleUrl: 'https://tiles.openfreemap.org/styles/bright',
    esriTileUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  },
  light: {
    label: 'Vector Hiện đại',
    goongStyleUrl: 'https://tiles.goong.io/assets/goong_light_v2.json',
    openFreeMapStyleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    esriTileUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  },
  dark: {
    label: 'Vệ tinh',
    goongStyleUrl: 'https://tiles.goong.io/assets/goong_map_dark.json',
    openFreeMapStyleUrl: 'https://tiles.openfreemap.org/styles/positron',
    esriTileUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
};

export function withGoongKey(url: string): string {
  if (!url.includes('goong.io') || /[?&]api_key=/.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(GOONG_MAPTILES_KEY)}`;
}

interface MountOptions {
  preferGoong?: boolean;
  onProviderChange?: (provider: BaseMapProvider, reason?: string) => void;
}

/**
 * Gắn bản đồ nền vào Leaflet map — Hoạt động ngay lập tức không cần API key!
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
    if (currentAttribution) {
      map.attributionControl?.removeAttribution(currentAttribution);
    }
    map.attributionControl?.addAttribution(text);
    currentAttribution = text;
  };

  const mountEsriRaster = (reason?: string) => {
    if (disposed) return;
    if (currentLayer) map.removeLayer(currentLayer);
    currentLayer = L.tileLayer(BASE_MAP_STYLES[style].esriTileUrl, {
      maxZoom: 19,
    }).addTo(map);
    setAttribution(
      style === 'dark' ? ESRI_SAT_ATTRIBUTION : ESRI_STREET_ATTRIBUTION
    );
    onProviderChange?.('esri', reason);
  };

  const mountOpenFreeMapVector = async () => {
    try {
      const [{ maplibreGL }] = await Promise.all([
        import('@maplibre/maplibre-gl-leaflet'),
        import('maplibre-gl/dist/maplibre-gl.css'),
      ]);
      if (disposed) return;

      const vectorLayer = maplibreGL({
        style: BASE_MAP_STYLES[style].openFreeMapStyleUrl,
      });
      vectorLayer.addTo(map);
      currentLayer = vectorLayer;
      setAttribution(OPENFREEMAP_ATTRIBUTION);
      onProviderChange?.('openfreemap');

      const glMap = vectorLayer.getMaplibreMap();
      let fellBack = false;
      glMap.on('error', () => {
        if (fellBack || disposed) return;
        fellBack = true;
        mountEsriRaster('Chuyển sang Esri Street Map');
      });
    } catch {
      mountEsriRaster();
    }
  };

  // 1. Nếu là chế độ "Đường phố" hoặc "Vệ tinh" và chưa có Goong key => Dùng Esri Raster siêu nhanh, ổn định
  if (!preferGoong || !isGoongMapEnabled) {
    if (style === 'light') {
      mountOpenFreeMapVector();
    } else {
      mountEsriRaster();
    }
  } else {
    // 2. Nếu người dùng có cấu hình Goong key => thử tải Goong Vector, lỗi thì tự về Esri
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

        const glMap = goongLayer.getMaplibreMap();
        let styleLoaded = false;
        let fellBack = false;
        glMap.once('load', () => {
          styleLoaded = true;
        });
        glMap.on('error', (event) => {
          if (fellBack || disposed) return;
          const ev = event as unknown as {
            error?: { status?: number };
            sourceId?: string;
          };
          const status = ev.error?.status;
          const authError = status === 401 || status === 403;
          const styleError = !styleLoaded && !ev.sourceId;
          if (authError || styleError) {
            fellBack = true;
            mountEsriRaster('Key Goong chưa kích hoạt, tự động dùng Esri');
          }
        });
      } catch {
        mountEsriRaster();
      }
    })();
  }

  return () => {
    disposed = true;
    if (currentLayer) map.removeLayer(currentLayer);
    if (currentAttribution) {
      map.attributionControl?.removeAttribution(currentAttribution);
    }
    currentLayer = null;
    currentAttribution = null;
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
