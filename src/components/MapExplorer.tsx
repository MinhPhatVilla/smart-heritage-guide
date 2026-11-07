import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Footprints,
  Play,
  CheckCircle2,
  X,
  CornerUpRight,
  Sparkles,
} from 'lucide-react';
import {
  HeritageSite,
  SupportedLanguage,
  VisitedSiteRecord,
  WalkingRouteResult,
} from '../types/heritage';
import { formatDistance, formatWalkingDuration } from '../utils/geoUtils';

interface MapExplorerProps {
  userLocation: [number, number];
  sites: HeritageSite[];
  visitedRecords: VisitedSiteRecord[];
  selectedLanguage: SupportedLanguage;
  activeRoute: WalkingRouteResult | null;
  activeWalkSeconds: number;
  isSimulatingWalk: boolean;
  searchRadiusMeters: number;
  onSelectSite: (site: HeritageSite) => void;
  onStartRouteToSite: (site: HeritageSite) => void;
  onSimulateWalkAlongRoute: () => void;
  onFinishWalkAndCheckIn: () => void;
  onCancelRoute: () => void;
  onMoveUserLocation: (lat: number, lng: number) => void;
}

export const MapExplorer: React.FC<MapExplorerProps> = ({
  userLocation,
  sites,
  visitedRecords,
  selectedLanguage,
  activeRoute,
  activeWalkSeconds,
  isSimulatingWalk,
  searchRadiusMeters,
  onSelectSite,
  onStartRouteToSite,
  onSimulateWalkAlongRoute,
  onFinishWalkAndCheckIn,
  onCancelRoute,
  onMoveUserLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const prevCenterRef = useRef<[number, number]>(userLocation);

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: userLocation,
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | Smart Heritage Guide',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);

    // Cho phép nhấp đúp hoặc click lên bản đồ để di chuyển vị trí GPS giả lập nhanh
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMoveUserLocation(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markersLayerRef.current = markersGroup;
    routeLayerRef.current = routeGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Cập nhật các Marker Vị trí người dùng, Di tích & Quán ăn đề xuất
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // Nếu người dùng đổi thành phố (khoảng cách dịch chuyển > 3km), pan bản đồ mượt mà tới vị trí mới
    const latDiff = Math.abs(prevCenterRef.current[0] - userLocation[0]);
    const lngDiff = Math.abs(prevCenterRef.current[1] - userLocation[1]);
    if (latDiff > 0.02 || lngDiff > 0.02) {
      map.flyTo(userLocation, 15, { duration: 1.1 });
    }
    prevCenterRef.current = userLocation;

    // Vòng bán kính quét danh lam thắng cảnh
    if (searchRadiusMeters > 0 && searchRadiusMeters <= 25000) {
      L.circle(userLocation, {
        radius: searchRadiusMeters,
        color: '#b45309',
        weight: 1.5,
        dashArray: '6 6',
        fillColor: '#f59e0b',
        fillOpacity: 0.07,
      }).addTo(layer);
    }

    // Marker vị trí người dùng
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 0 6px rgba(37,99,235,0.28);color:#fff;font-size:16px;">🚶</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker(userLocation, { icon: userIcon })
      .bindPopup(
        `<div style="font-family:sans-serif;font-size:12px;">
          <strong>📍 Vị trí của bạn</strong><br/>
          <span>Mẹo: Nhấn vào bất kỳ điểm nào trên bản đồ để giả lập bước đi GPS tới đó!</span>
        </div>`
      )
      .addTo(layer);

    // Marker cho từng Danh lam thắng cảnh và các quán ăn đánh giá cao quanh đó
    sites.forEach((site) => {
      const isVisited = visitedRecords.some((r) => r.siteId === site.id);
      const localName =
        (site.translations[selectedLanguage] || site.translations.vi).name;

      const badgeBg = isVisited ? '#059669' : '#991b1b';
      const siteIcon = L.divIcon({
        className: 'custom-heritage-marker',
        html: `<div style="display:flex;align-items:center;gap:4px;padding:4px 8px;border-radius:999px;background:${badgeBg};color:#fff;border:2px solid #fde68a;box-shadow:0 4px 12px rgba(0,0,0,0.28);font-weight:700;font-size:11px;white-space:nowrap;">
          <span>${isVisited ? '✅' : '🏛️'}</span>
          <span>${localName.length > 22 ? localName.slice(0, 20) + '…' : localName}</span>
        </div>`,
        iconSize: [140, 30],
        iconAnchor: [70, 15],
      });

      const marker = L.marker([site.lat, site.lng], { icon: siteIcon }).addTo(
        layer
      );

      marker.on('click', () => {
        onSelectSite(site);
      });

      // Hiển thị thêm các marker tiệm ăn uống đề xuất gần di tích (rating >= 4.7)
      site.nearbyRestaurants.forEach((res) => {
        const resIcon = L.divIcon({
          className: 'custom-restaurant-marker',
          html: `<div title="${res.name} (${res.rating}⭐)" style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:999px;background:#ea580c;color:#fff;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.22);font-size:13px;">🍜</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        L.marker([res.lat, res.lng], { icon: resIcon })
          .bindPopup(
            `<div style="font-family:sans-serif;font-size:12px;min-width:180px;">
              <strong style="color:#9a3412;">🍜 ${res.name}</strong><br/>
              <span>Đánh giá: <strong>${res.rating.toFixed(1)} ⭐</strong> (${res.reviewCount} lượt)</span><br/>
              <span>Đặc sản: ${res.specialtyDishes.join(', ')}</span><br/>
              <span style="color:#57534e;">Giá: ${res.priceRange}</span>
            </div>`
          )
          .addTo(layer);
      });
    });
  }, [userLocation, sites, visitedRecords, selectedLanguage, searchRadiusMeters]);

  // Vẽ đường dẫn đường đi bộ (Active Route)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    routeLayer.clearLayers();
    if (!activeRoute || !activeRoute.coordinates.length) return;

    // Đường nền trắng và đường dẫn bộ màu xanh nổi bật
    L.polyline(activeRoute.coordinates, {
      color: '#ffffff',
      weight: 9,
      opacity: 0.9,
    }).addTo(routeLayer);

    const routeLine = L.polyline(activeRoute.coordinates, {
      color: '#2563eb',
      weight: 5,
      dashArray: '10 8',
      opacity: 0.95,
    }).addTo(routeLayer);

    map.fitBounds(routeLine.getBounds(), { padding: [50, 50], maxZoom: 16 });
  }, [activeRoute]);

  return (
    <div className="relative h-[440px] sm:h-[540px] w-full overflow-hidden rounded-3xl border border-stone-200 shadow-md">
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Chú giải bản đồ góc trên bên phải */}
      <div className="pointer-events-auto absolute top-3 right-3 z-10 flex flex-wrap items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 text-[11px] font-semibold text-stone-700 shadow-md backdrop-blur-xs border border-stone-200">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" /> Vị trí bạn
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-800" /> Danh lam thắng cảnh
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" /> Đã đi qua
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-600" /> Quán ăn Rating cao
        </span>
      </div>

      {/* Bảng Dẫn đường Đi bộ Trực tiếp & Bấm giờ Hành trình */}
      {activeRoute && (
        <div className="pointer-events-auto absolute bottom-3 inset-x-3 z-10 rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                <Navigation className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
                    Đang dẫn đường đi bộ tới đích
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    <Footprints className="h-3 w-3" /> Đã đi bộ:{' '}
                    {formatWalkingDuration(activeWalkSeconds)}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-stone-900">
                  {activeRoute.targetName} •{' '}
                  <span className="text-blue-700">
                    {formatDistance(activeRoute.totalDistanceMeters)} (~
                    {formatWalkingDuration(activeRoute.estimatedDurationSeconds)})
                  </span>
                </h4>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isSimulatingWalk}
                onClick={onSimulateWalkAlongRoute}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-stone-950 shadow-xs hover:bg-amber-400 disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                {isSimulatingWalk ? 'Đang mô phỏng bước đi...' : 'Mô phỏng Đi bộ tới Đích'}
              </button>

              {activeRoute.targetType === 'heritage' && (
                <button
                  type="button"
                  onClick={onFinishWalkAndCheckIn}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Đã tới nơi • Lưu Ảnh & Xếp hạng
                </button>
              )}

              <button
                type="button"
                onClick={onCancelRoute}
                className="rounded-xl border border-stone-200 p-2 text-stone-500 hover:bg-stone-100"
                title="Kết thúc dẫn đường"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Danh sách các bước chỉ dẫn rẽ */}
          <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
            {activeRoute.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex min-w-[230px] shrink-0 items-start gap-2 rounded-xl bg-stone-100/90 p-2.5 text-xs"
              >
                <CornerUpRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div>
                  <p className="font-semibold text-stone-800 line-clamp-2">
                    {step.instruction}
                  </p>
                  <span className="text-[11px] text-stone-500">
                    {formatDistance(step.distanceMeters)} • ~
                    {formatWalkingDuration(step.durationSeconds)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!activeRoute && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-1.5 rounded-xl bg-stone-900/80 px-3 py-1.5 text-xs text-amber-200 backdrop-blur-xs">
          <Sparkles className="h-3.5 w-3.5" />
          Nhấn vào bất kỳ vị trí nào trên bản đồ để di chuyển vị trí khách hàng và tự động tìm di tích gần đó
        </div>
      )}
    </div>
  );
};
