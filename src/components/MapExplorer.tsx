import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Footprints,
  Play,
  Check,
  X,
  CornerUpRight,
  LocateFixed,
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
  selectedSiteId?: string | null;
  visitedRecords: VisitedSiteRecord[];
  selectedLanguage: SupportedLanguage;
  activeRoute: WalkingRouteResult | null;
  isRoutingLoading?: boolean;
  activeWalkSeconds: number;
  isSimulatingWalk: boolean;
  searchRadiusMeters: number;
  onSelectSite: (site: HeritageSite) => void;
  onStartRouteToSite: (site: HeritageSite) => void;
  onSimulateWalkAlongRoute: () => void;
  onFinishWalkAndCheckIn: () => void;
  onCancelRoute: () => void;
  onMoveUserLocation: (lat: number, lng: number) => void;
  onDetectRealGps?: () => void;
}

export const MapExplorer: React.FC<MapExplorerProps> = ({
  userLocation,
  sites,
  selectedSiteId,
  visitedRecords,
  selectedLanguage,
  activeRoute,
  isRoutingLoading = false,
  activeWalkSeconds,
  isSimulatingWalk,
  searchRadiusMeters,
  onSelectSite,
  onSimulateWalkAlongRoute,
  onFinishWalkAndCheckIn,
  onCancelRoute,
  onMoveUserLocation,
  onDetectRealGps,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const prevCenterRef = useRef<[number, number]>(userLocation);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: userLocation,
      zoom: 15,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Sử dụng bản đồ CartoDB Voyager hiện đại, tối giản, dễ đọc đường phố
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }
    ).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);

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

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const latDiff = Math.abs(prevCenterRef.current[0] - userLocation[0]);
    const lngDiff = Math.abs(prevCenterRef.current[1] - userLocation[1]);
    if (latDiff > 0.015 || lngDiff > 0.015) {
      map.flyTo(userLocation, 15, { duration: 0.9 });
    }
    prevCenterRef.current = userLocation;

    if (searchRadiusMeters > 0 && searchRadiusMeters <= 25000) {
      L.circle(userLocation, {
        radius: searchRadiusMeters,
        color: '#141413',
        weight: 1,
        dashArray: '4 6',
        fillColor: '#141413',
        fillOpacity: 0.03,
      }).addTo(layer);
    }

    // Marker vị trí người dùng tối giản (Pulsing GPS Dot)
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;">
        <span style="position:absolute;width:24px;height:24px;border-radius:9999px;background:rgba(37,99,235,0.22);"></span>
        <span style="position:relative;width:12px;height:12px;border-radius:9999px;background:#2563eb;border:2.5px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.25);"></span>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker(userLocation, { icon: userIcon })
      .bindPopup(
        `<div style="font-size:12px;line-height:1.4;color:#141413;">
          <div style="font-weight:600;">Vị trí hiện tại của bạn</div>
          <div style="color:#57554f;margin-top:2px;">Nhấn vào điểm bất kỳ trên bản đồ để giả lập di chuyển GPS.</div>
        </div>`
      )
      .addTo(layer);

    // Marker danh lam thắng cảnh & tiệm ăn uống
    sites.forEach((site) => {
      const isVisited = visitedRecords.some((r) => r.siteId === site.id);
      const isSelected = selectedSiteId === site.id;
      const localName =
        (site.translations[selectedLanguage] || site.translations.vi).name;

      const bg = isSelected
        ? '#B93815'
        : isVisited
          ? '#15803d'
          : '#141413';

      const siteIcon = L.divIcon({
        className: 'custom-heritage-marker',
        html: `<div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:${bg};color:#ffffff;border:1.5px solid #ffffff;box-shadow:0 4px 14px rgba(20,20,19,0.22);font-weight:600;font-size:11px;letter-spacing:-0.01em;white-space:nowrap;transition:transform 0.15s ease;">
          <span style="width:6px;height:6px;border-radius:999px;background:${isVisited ? '#86efac' : '#f59e0b'};"></span>
          <span>${localName.length > 24 ? localName.slice(0, 22) + '…' : localName}</span>
        </div>`,
        iconSize: [150, 28],
        iconAnchor: [75, 14],
      });

      const marker = L.marker([site.lat, site.lng], { icon: siteIcon }).addTo(
        layer
      );

      marker.on('click', () => {
        onSelectSite(site);
      });

      // Marker nhà hàng đề xuất (nhỏ gọn, tinh tế)
      site.nearbyRestaurants.forEach((res) => {
        const resIcon = L.divIcon({
          className: 'custom-restaurant-marker',
          html: `<div title="${res.name}" style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:999px;background:#ffffff;color:#141413;border:1px solid #d6d3cd;box-shadow:0 2px 6px rgba(0,0,0,0.12);font-size:10px;font-weight:600;">
            <span style="color:#B93815;">★</span>
            <span>${res.rating.toFixed(1)}</span>
          </div>`,
          iconSize: [42, 20],
          iconAnchor: [21, 10],
        });

        L.marker([res.lat, res.lng], { icon: resIcon })
          .bindPopup(
            `<div style="font-size:12px;line-height:1.45;color:#141413;min-width:190px;">
              <div style="font-weight:600;">${res.name}</div>
              <div style="color:#B93815;font-weight:600;margin-top:2px;">★ ${res.rating.toFixed(1)} <span style="color:#8a877f;font-weight:400;">(${res.reviewCount} đánh giá)</span></div>
              <div style="color:#57554f;margin-top:4px;">${res.specialtyDishes.slice(0, 2).join(' · ')}</div>
              <div style="color:#8a877f;font-size:11px;margin-top:2px;">${res.priceRange}</div>
            </div>`
          )
          .addTo(layer);
      });
    });
  }, [
    userLocation,
    sites,
    selectedSiteId,
    visitedRecords,
    selectedLanguage,
    searchRadiusMeters,
  ]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    routeLayer.clearLayers();
    if (!activeRoute || !activeRoute.coordinates.length) return;

    L.polyline(activeRoute.coordinates, {
      color: '#ffffff',
      weight: 8,
      opacity: 0.9,
    }).addTo(routeLayer);

    const routeLine = L.polyline(activeRoute.coordinates, {
      color: '#B93815',
      weight: 4,
      dashArray: '8 6',
      opacity: 0.95,
    }).addTo(routeLayer);

    map.fitBounds(routeLine.getBounds(), { padding: [48, 48], maxZoom: 16 });
  }, [activeRoute]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-[#E6E4DD] bg-[#EFEDE6]">
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Top-left Map Legend & Recenter Control */}
      <div className="pointer-events-auto absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-3 rounded-xl border border-[#E6E4DD] bg-white/95 px-3 py-1.5 text-[11px] font-medium text-[#57554F] shadow-xs backdrop-blur-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600" /> Bạn
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#141413]" /> Di tích
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-700" /> Đã đi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-[#B93815] font-bold">★</span> Quán ngon
          </span>
        </div>

        {onDetectRealGps && (
          <button
            type="button"
            onClick={onDetectRealGps}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E4DD] bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-[#141413] shadow-xs backdrop-blur-xs hover:bg-white"
            title="Định vị GPS thực tế"
          >
            <LocateFixed className="h-3.5 w-3.5 text-blue-600" />
            <span>GPS của tôi</span>
          </button>
        )}
      </div>

      {/* Loading Route Indicator */}
      {isRoutingLoading && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 flex items-center justify-center">
          <div className="rounded-xl border border-[#E6E4DD] bg-white/95 px-4 py-2.5 text-xs font-medium text-[#141413] shadow-md">
            Đang tìm lộ trình đi bộ tối ưu…
          </div>
        </div>
      )}

      {/* Active Turn-by-Turn Walking Navigation Bar */}
      {activeRoute && !isRoutingLoading && (
        <div className="pointer-events-auto absolute bottom-3 inset-x-3 z-10 rounded-xl border border-[#E6E4DD] bg-white/98 p-4 shadow-lg backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E4DD] pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#B93815] text-white">
                <Navigation className="h-4 w-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-[#B93815]">
                    Lộ trình đi bộ
                  </span>
                  <span className="text-[#8A877F]">•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-[#141413] tabular-nums">
                    <Footprints className="h-3.5 w-3.5 text-[#57554F]" />
                    Đã đi: {formatWalkingDuration(activeWalkSeconds)}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-[#141413] mt-0.5">
                  {activeRoute.targetName}{' '}
                  <span className="font-normal text-[#57554F] tabular-nums">
                    ({formatDistance(activeRoute.totalDistanceMeters)} · ~
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6E4DD] bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#F3F1EC] disabled:opacity-45"
              >
                <Play className="h-3 w-3 fill-current" />
                {isSimulatingWalk ? 'Đang di chuyển…' : 'Mô phỏng đi bộ'}
              </button>

              {activeRoute.targetType === 'heritage' && (
                <button
                  type="button"
                  onClick={onFinishWalkAndCheckIn}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#141413] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2C2B29]"
                >
                  <Check className="h-3.5 w-3.5" />
                  Đã đến · Lưu ảnh & Xếp hạng
                </button>
              )}

              <button
                type="button"
                onClick={onCancelRoute}
                className="rounded-lg p-1.5 text-[#8A877F] hover:bg-[#F3F1EC] hover:text-[#141413]"
                aria-label="Hủy dẫn đường"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Step-by-step Instructions */}
          <div className="mt-2.5 flex gap-2 overflow-x-auto pb-0.5">
            {activeRoute.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex min-w-[210px] shrink-0 items-start gap-2 rounded-lg border border-[#E6E4DD] bg-[#FAF9F6] px-3 py-2 text-xs"
              >
                <CornerUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B93815]" />
                <div>
                  <p className="font-medium text-[#141413] line-clamp-1">
                    {step.instruction}
                  </p>
                  <span className="text-[11px] text-[#8A877F] tabular-nums">
                    {formatDistance(step.distanceMeters)} · ~
                    {formatWalkingDuration(step.durationSeconds)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
