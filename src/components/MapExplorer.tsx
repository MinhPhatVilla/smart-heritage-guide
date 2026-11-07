import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Footprints,
  Play,
  Check,
  X,
  CornerUpRight,
  LocateFixed,
  Layers,
  Maximize2,
  Utensils,
} from 'lucide-react';
import {
  HeritageSite,
  NearbyRestaurant,
  SupportedLanguage,
  VisitedSiteRecord,
  WalkingRouteResult,
} from '../types/heritage';
import {
  calculateDistanceMeters,
  estimateWalkingSeconds,
  formatDistance,
  formatWalkingDuration,
} from '../utils/geoUtils';

type MapTileMode = 'roadmap' | 'terrain' | 'satellite';

const TILE_LAYERS: Record<
  MapTileMode,
  { label: string; url: string; attribution: string }
> = {
  roadmap: {
    label: 'Đường phố',
    url: 'https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
  },
  terrain: {
    label: 'Địa hình',
    url: 'https://mt1.google.com/vt/lyrs=p&hl=vi&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Terrain',
  },
  satellite: {
    label: 'Vệ tinh',
    url: 'https://mt1.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite',
  },
};

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
  onStartRouteToRestaurant?: (
    restaurant: NearbyRestaurant,
    parentSite: HeritageSite
  ) => void;
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
  onStartRouteToSite,
  onStartRouteToRestaurant,
  onSimulateWalkAlongRoute,
  onFinishWalkAndCheckIn,
  onCancelRoute,
  onMoveUserLocation,
  onDetectRealGps,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const prevCenterRef = useRef<[number, number]>(userLocation);

  const [tileMode, setTileMode] = useState<MapTileMode>('roadmap');
  const [showRestaurantsOnMap, setShowRestaurantsOnMap] =
    useState<boolean>(true);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    const map = L.map(container, {
      center: userLocation,
      zoom: 15,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileCfg = TILE_LAYERS[tileMode];
    const baseTile = L.tileLayer(tileCfg.url, {
      attribution: tileCfg.attribution,
      maxZoom: 20,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      onMoveUserLocation(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    tileLayerRef.current = baseTile;
    markersLayerRef.current = markersGroup;
    routeLayerRef.current = routeGroup;

    const timer = setTimeout(() => {
      if (mapInstanceRef.current === map) {
        map.invalidateSize();
      }
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current === map) {
        map.invalidateSize();
      }
    });
    resizeObserver.observe(container);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const cfg = TILE_LAYERS[tileMode];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 20,
    }).addTo(map);
  }, [tileMode]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const latDiff = Math.abs(prevCenterRef.current[0] - userLocation[0]);
    const lngDiff = Math.abs(prevCenterRef.current[1] - userLocation[1]);
    if (latDiff > 0.012 || lngDiff > 0.012) {
      map.flyTo(userLocation, 15, { duration: 0.9 });
    }
    prevCenterRef.current = userLocation;

    if (searchRadiusMeters > 0 && searchRadiusMeters <= 25000) {
      L.circle(userLocation, {
        radius: searchRadiusMeters,
        color: '#2563eb',
        weight: 1.5,
        dashArray: '6 6',
        fillColor: '#2563eb',
        fillOpacity: 0.05,
      }).addTo(layer);
    }

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;">
        <span style="position:absolute;width:32px;height:32px;border-radius:9999px;background:rgba(37,99,235,0.22);"></span>
        <span style="position:relative;width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></span>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const userMarker = L.marker(userLocation, {
      icon: userIcon,
      draggable: true,
    })
      .bindPopup(
        `<div style="font-size:12px;line-height:1.45;color:#141413;min-width:180px;">
          <div style="font-weight:700;color:#2563eb;">📍 Vị trí của bạn</div>
          <div style="color:#57554f;margin-top:3px;">Tọa độ: ${userLocation[0].toFixed(4)}°N, ${userLocation[1].toFixed(4)}°E</div>
          <div style="color:#8a877f;font-size:11px;margin-top:4px;">Bạn có thể kéo thả chấm xanh này hoặc chạm vào bất kỳ đâu trên bản đồ để đổi vị trí.</div>
        </div>`
      )
      .addTo(layer);

    userMarker.on('dragend', () => {
      const pos = userMarker.getLatLng();
      onMoveUserLocation(pos.lat, pos.lng);
    });

    sites.forEach((site) => {
      const isVisited = visitedRecords.some((r) => r.siteId === site.id);
      const isSelected = selectedSiteId === site.id;
      const localName =
        (site.translations[selectedLanguage] || site.translations.vi).name;
      const distMeters = calculateDistanceMeters(
        userLocation[0],
        userLocation[1],
        site.lat,
        site.lng
      );
      const walkSec = estimateWalkingSeconds(distMeters);

      const bg = isSelected
        ? '#B93815'
        : isVisited
          ? '#15803d'
          : '#141413';

      const siteIcon = L.divIcon({
        className: 'custom-heritage-marker',
        html: `<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border-radius:999px;background:${bg};color:#ffffff;border:2px solid #ffffff;box-shadow:0 4px 14px rgba(20,20,19,0.28);font-weight:600;font-size:11.5px;letter-spacing:-0.01em;white-space:nowrap;cursor:pointer;">
          <span style="width:7px;height:7px;border-radius:999px;background:${isVisited ? '#86efac' : '#fbbf24'};"></span>
          <span>${localName.length > 24 ? localName.slice(0, 22) + '…' : localName}</span>
        </div>`,
        iconSize: [165, 32],
        iconAnchor: [82, 16],
      });

      const popupContainer = document.createElement('div');
      popupContainer.style.minWidth = '220px';
      popupContainer.style.fontFamily = 'Inter, sans-serif';
      popupContainer.innerHTML = `
        <div style="overflow:hidden;border-radius:8px;margin-bottom:8px;height:96px;background:#f3f1ec;">
          <img src="${site.coverImage}" alt="${localName}" style="width:100%;height:100%;object-fit:cover;" />
        </div>
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;color:#8a877f;">${site.city} · ★ ${site.rating.toFixed(1)}</div>
        <div style="font-size:13px;font-weight:700;color:#141413;margin-top:2px;">${localName}</div>
        <div style="font-size:11px;color:#57554f;margin-top:4px;">🚶 Cách bạn <strong>${formatDistance(distMeters)}</strong> (~${formatWalkingDuration(walkSec)})</div>
        <div style="display:flex;gap:6px;margin-top:10px;">
          <button id="btn-detail-${site.id}" style="flex:1;padding:6px 8px;border-radius:6px;background:#141413;color:#fff;font-size:11px;font-weight:600;border:none;cursor:pointer;">Thuyết minh</button>
          <button id="btn-route-${site.id}" style="flex:1;padding:6px 8px;border-radius:6px;background:#B93815;color:#fff;font-size:11px;font-weight:600;border:none;cursor:pointer;">Dẫn đường</button>
        </div>
      `;

      const marker = L.marker([site.lat, site.lng], { icon: siteIcon })
        .bindPopup(popupContainer)
        .addTo(layer);

      marker.on('popupopen', () => {
        const detailBtn = document.getElementById(`btn-detail-${site.id}`);
        const routeBtn = document.getElementById(`btn-route-${site.id}`);
        if (detailBtn) {
          detailBtn.onclick = () => {
            onSelectSite(site);
            marker.closePopup();
          };
        }
        if (routeBtn) {
          routeBtn.onclick = () => {
            onStartRouteToSite(site);
            marker.closePopup();
          };
        }
      });

      if (showRestaurantsOnMap) {
        site.nearbyRestaurants.forEach((res) => {
          const resIcon = L.divIcon({
            className: 'custom-restaurant-marker',
            html: `<div title="${res.name}" style="display:inline-flex;align-items:center;gap:3px;padding:3px 7px;border-radius:999px;background:#ffffff;color:#141413;border:1.5px solid #B93815;box-shadow:0 2px 8px rgba(0,0,0,0.16);font-size:10.5px;font-weight:700;white-space:nowrap;">
              <span style="color:#B93815;">★</span>
              <span>${res.rating.toFixed(1)}</span>
            </div>`,
            iconSize: [48, 22],
            iconAnchor: [24, 11],
          });

          const resPopup = document.createElement('div');
          resPopup.style.minWidth = '200px';
          resPopup.style.fontFamily = 'Inter, sans-serif';
          resPopup.innerHTML = `
            <div style="font-size:10px;font-weight:600;color:#B93815;text-transform:uppercase;">${res.cuisine}</div>
            <div style="font-size:13px;font-weight:700;color:#141413;margin-top:2px;">${res.name}</div>
            <div style="font-size:11px;font-weight:600;color:#141413;margin-top:3px;">★ ${res.rating.toFixed(1)} <span style="font-weight:400;color:#8a877f;">(${res.reviewCount} đánh giá)</span></div>
            <div style="font-size:11px;color:#57554f;margin-top:4px;">${res.specialtyDishes.slice(0, 2).join(' · ')}</div>
            <div style="font-size:11px;color:#8a877f;margin-top:2px;">Giá: ${res.priceRange}</div>
            <button id="btn-res-route-${res.id}" style="width:100%;margin-top:8px;padding:6px 8px;border-radius:6px;background:#141413;color:#fff;font-size:11px;font-weight:600;border:none;cursor:pointer;">Chỉ đường đi bộ tới quán</button>
          `;

          const resMarker = L.marker([res.lat, res.lng], { icon: resIcon })
            .bindPopup(resPopup)
            .addTo(layer);

          resMarker.on('popupopen', () => {
            const btn = document.getElementById(`btn-res-route-${res.id}`);
            if (btn && onStartRouteToRestaurant) {
              btn.onclick = () => {
                onStartRouteToRestaurant(res, site);
                resMarker.closePopup();
              };
            }
          });
        });
      }
    });
  }, [
    userLocation,
    sites,
    selectedSiteId,
    visitedRecords,
    selectedLanguage,
    searchRadiusMeters,
    showRestaurantsOnMap,
  ]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    routeLayer.clearLayers();
    if (!activeRoute || !activeRoute.coordinates.length) return;

    L.polyline(activeRoute.coordinates, {
      color: '#ffffff',
      weight: 9,
      opacity: 0.92,
    }).addTo(routeLayer);

    const routeLine = L.polyline(activeRoute.coordinates, {
      color: '#B93815',
      weight: 5,
      dashArray: '10 6',
      opacity: 0.98,
    }).addTo(routeLayer);

    map.fitBounds(routeLine.getBounds(), { padding: [56, 56], maxZoom: 16 });
  }, [activeRoute]);

  const handleFitAllMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map || sites.length === 0) return;
    const bounds = L.latLngBounds([
      userLocation,
      ...sites.map((s) => [s.lat, s.lng] as [number, number]),
    ]);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  };

  return (
    <div className="relative h-[520px] lg:h-[calc(100vh-96px)] min-h-[500px] w-full overflow-hidden rounded-2xl border border-[#E6E4DD] bg-[#E5E3DF] shadow-xs">
      <div
        ref={mapContainerRef}
        className="absolute inset-0 h-full w-full z-0"
      />

      {/* Top Map Controls */}
      <div className="pointer-events-auto absolute top-3 inset-x-3 z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-3 rounded-xl border border-[#E6E4DD] bg-white/95 px-3 py-1.5 text-[11px] font-medium text-[#57554F] shadow-xs backdrop-blur-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Bạn
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#141413]" /> Di tích
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" /> Đã đi
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowRestaurantsOnMap((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium shadow-xs backdrop-blur-xs transition-colors ${
              showRestaurantsOnMap
                ? 'border-[#141413] bg-[#141413] text-white'
                : 'border-[#E6E4DD] bg-white/95 text-[#57554F] hover:text-[#141413]'
            }`}
          >
            <Utensils className="h-3 w-3" />
            <span>Quán ăn đề xuất</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="inline-flex items-center rounded-xl border border-[#E6E4DD] bg-white/95 p-0.5 shadow-xs backdrop-blur-xs">
            <Layers className="mx-1.5 h-3.5 w-3.5 text-[#8A877F]" />
            {(['roadmap', 'terrain', 'satellite'] as MapTileMode[]).map(
              (mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTileMode(mode)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    tileMode === mode
                      ? 'bg-[#141413] text-white'
                      : 'text-[#57554F] hover:text-[#141413]'
                  }`}
                >
                  {TILE_LAYERS[mode].label}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={handleFitAllMarkers}
            className="inline-flex items-center gap-1 rounded-xl border border-[#E6E4DD] bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-[#141413] shadow-xs backdrop-blur-xs hover:bg-white"
            title="Thu phóng toàn bộ điểm trên bản đồ"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {onDetectRealGps && (
            <button
              type="button"
              onClick={onDetectRealGps}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E4DD] bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-[#141413] shadow-xs backdrop-blur-xs hover:bg-white"
              title="Định vị GPS thực tế"
            >
              <LocateFixed className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">GPS của tôi</span>
            </button>
          )}
        </div>
      </div>

      {isRoutingLoading && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 flex items-center justify-center">
          <div className="rounded-xl border border-[#E6E4DD] bg-white/95 px-4 py-2.5 text-xs font-medium text-[#141413] shadow-md">
            Đang vẽ lộ trình dẫn đường đi bộ trên bản đồ…
          </div>
        </div>
      )}

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
                    Đang dẫn đường đi bộ
                  </span>
                  <span className="text-[#8A877F]">·</span>
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
