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
  Maximize2,
  Utensils,
  ExternalLink,
  Volume2,
  Star,
  Layers,
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
import {
  BaseMapStyle,
  MAP_TILE_STYLES,
  buildGoogleMapsWalkingUrl,
  createTileLayer,
} from '../services/mapTiles';

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

  const [mapStyle, setMapStyle] = useState<BaseMapStyle>('vn_clean');
  const [showRestaurantsOnMap, setShowRestaurantsOnMap] =
    useState<boolean>(false);
  const [focusedSite, setFocusedSite] = useState<HeritageSite | null>(null);
  const [focusedRestaurant, setFocusedRestaurant] = useState<{
    restaurant: NearbyRestaurant;
    parentSite: HeritageSite;
  } | null>(null);

  // Khởi tạo bản đồ Leaflet chuẩn DOM (không dùng Web Worker nên luôn hiển thị 100%)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    const map = L.map(container, {
      center: userLocation,
      zoom: 15,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const baseTile = createTileLayer(mapStyle).addTo(map);
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

    const ro = new ResizeObserver(() => {
      if (mapInstanceRef.current === map) {
        map.invalidateSize();
      }
    });
    ro.observe(container);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  // Đổi lớp bản đồ nền (Đường phố VN / Hiện đại / Di sản HOT / Vệ tinh)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = createTileLayer(mapStyle).addTo(map);
  }, [mapStyle]);

  // Vẽ chấm xanh GPS và các Ghim Di tích Photo-Badge
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
        fillOpacity: 0.045,
      }).addTo(layer);
    }

    // Chấm vị trí GPS của khách hàng
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div class="shg-gps-pulse" style="position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;">
        <span style="position:relative;width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 3px 10px rgba(37,99,235,0.45);"></span>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const userMarker = L.marker(userLocation, {
      icon: userIcon,
      draggable: true,
    }).addTo(layer);

    userMarker.on('dragend', () => {
      const pos = userMarker.getLatLng();
      onMoveUserLocation(pos.lat, pos.lng);
    });

    // Ghim Di tích Photo-Badge hiện đại
    sites.forEach((site, idx) => {
      const isVisited = visitedRecords.some((r) => r.siteId === site.id);
      const isSelected =
        selectedSiteId === site.id || focusedSite?.id === site.id;
      const localName =
        (site.translations[selectedLanguage] || site.translations.vi).name;
      const shortLabel =
        localName.length > 20 ? localName.slice(0, 18) + '…' : localName;

      const borderColor = isSelected
        ? '#B93815'
        : isVisited
          ? '#15803d'
          : '#141413';
      const badgeColor = isSelected
        ? '#B93815'
        : isVisited
          ? '#15803d'
          : '#141413';

      const siteIcon = L.divIcon({
        className: 'custom-heritage-marker',
        html: `
          <div class="shg-pin-badge" style="display:inline-flex;flex-direction:column;align-items:center;user-select:none;cursor:pointer;">
            <div style="display:inline-flex;align-items:center;gap:6px;padding:3px 9px 3px 4px;border-radius:999px;background:#ffffff;border:2px solid ${borderColor};box-shadow:0 6px 18px rgba(20,20,19,0.2);">
              <div style="width:24px;height:24px;border-radius:999px;overflow:hidden;flex-shrink:0;background:#f3f1ec;">
                <img src="${site.coverImage}" alt="" style="width:24px !important;height:24px !important;object-fit:cover;" />
              </div>
              <span style="font-size:11px;font-weight:700;color:#141413;white-space:nowrap;letter-spacing:-0.01em;">
                ${shortLabel}
              </span>
              <span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:${badgeColor};color:#ffffff;font-size:9.5px;font-weight:700;">
                ${isVisited ? '✓' : idx + 1}
              </span>
            </div>
            <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${borderColor};margin-top:-1px;"></div>
          </div>
        `,
        iconSize: [190, 38],
        iconAnchor: [95, 38],
      });

      const marker = L.marker([site.lat, site.lng], {
        icon: siteIcon,
        zIndexOffset: isSelected ? 1000 : 100,
      }).addTo(layer);

      marker.on('click', () => {
        setFocusedRestaurant(null);
        setFocusedSite(site);
        map.flyTo([site.lat, site.lng], Math.max(map.getZoom(), 15), {
          duration: 0.7,
        });
      });

      if (showRestaurantsOnMap) {
        site.nearbyRestaurants.forEach((res) => {
          const resIcon = L.divIcon({
            className: 'custom-restaurant-marker',
            html: `
              <div class="shg-pin-badge" style="display:inline-flex;align-items:center;gap:3px;padding:3px 7px;border-radius:999px;background:#141413;color:#ffffff;border:1.5px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.2);font-size:10px;font-weight:700;white-space:nowrap;cursor:pointer;">
                <span style="color:#fbbf24;">★</span>
                <span>${res.rating.toFixed(1)}</span>
              </div>
            `,
            iconSize: [48, 22],
            iconAnchor: [24, 11],
          });

          const resMarker = L.marker([res.lat, res.lng], {
            icon: resIcon,
          }).addTo(layer);

          resMarker.on('click', () => {
            setFocusedSite(null);
            setFocusedRestaurant({ restaurant: res, parentSite: site });
            map.flyTo([res.lat, res.lng], Math.max(map.getZoom(), 16), {
              duration: 0.6,
            });
          });
        });
      }
    });
  }, [
    userLocation,
    sites,
    selectedSiteId,
    focusedSite,
    visitedRecords,
    selectedLanguage,
    searchRadiusMeters,
    showRestaurantsOnMap,
  ]);

  // Vẽ lộ trình dẫn đường đi bộ
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    routeLayer.clearLayers();
    if (!activeRoute || !activeRoute.coordinates.length) return;

    setFocusedSite(null);
    setFocusedRestaurant(null);

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
    <div className="relative h-[520px] lg:h-[calc(100vh-96px)] min-h-[500px] w-full overflow-hidden rounded-2xl border border-[#E6E4DD] bg-[#EFEDE6] shadow-xs">
      <div
        ref={mapContainerRef}
        className="absolute inset-0 h-full w-full z-0"
      />

      {/* Thanh công cụ phía trên */}
      <div className="pointer-events-auto absolute top-3 inset-x-3 z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-3 rounded-xl border border-[#E6E4DD] bg-white/95 px-3 py-1.5 text-[11px] font-medium text-[#57554F] shadow-xs backdrop-blur-md">
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
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium shadow-xs backdrop-blur-md transition-colors ${
              showRestaurantsOnMap
                ? 'border-[#141413] bg-[#141413] text-white'
                : 'border-[#E6E4DD] bg-white/95 text-[#57554F] hover:text-[#141413]'
            }`}
          >
            <Utensils className="h-3 w-3" />
            <span>Hiện quán ăn</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="inline-flex items-center rounded-xl border border-[#E6E4DD] bg-white/95 p-0.5 shadow-xs backdrop-blur-md">
            <Layers className="mx-1.5 h-3.5 w-3.5 text-[#8A877F]" />
            {(Object.keys(MAP_TILE_STYLES) as BaseMapStyle[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMapStyle(mode)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  mapStyle === mode
                    ? 'bg-[#141413] text-white'
                    : 'text-[#57554F] hover:text-[#141413]'
                }`}
              >
                {MAP_TILE_STYLES[mode].label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleFitAllMarkers}
            className="inline-flex items-center gap-1 rounded-xl border border-[#E6E4DD] bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-[#141413] shadow-xs backdrop-blur-md hover:bg-white"
            title="Thu phóng toàn cảnh"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {onDetectRealGps && (
            <button
              type="button"
              onClick={onDetectRealGps}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6E4DD] bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-[#141413] shadow-xs backdrop-blur-md hover:bg-white"
              title="Định vị GPS thực tế"
            >
              <LocateFixed className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">GPS của tôi</span>
            </button>
          )}
        </div>
      </div>

      {/* Thẻ Xem nhanh Di tích Nổi trên Bản đồ */}
      {focusedSite && !activeRoute && (
        <div className="pointer-events-auto absolute bottom-4 left-4 right-4 sm:right-auto sm:w-88 z-10 rounded-2xl border border-[#E6E4DD] bg-white/98 p-3.5 shadow-xl backdrop-blur-md">
          <div className="flex gap-3">
            <img
              src={focusedSite.coverImage}
              alt={focusedSite.translations.vi.name}
              className="h-20 w-20 shrink-0 rounded-xl object-cover border border-[#E6E4DD]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A877F]">
                  {focusedSite.city}
                </span>
                <button
                  type="button"
                  onClick={() => setFocusedSite(null)}
                  className="rounded p-0.5 text-[#8A877F] hover:text-[#141413]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <h4 className="font-serif-editorial text-sm font-semibold text-[#141413] line-clamp-1">
                {
                  (
                    focusedSite.translations[selectedLanguage] ||
                    focusedSite.translations.vi
                  ).name
                }
              </h4>
              <div className="mt-1 flex items-center gap-2 text-xs text-[#57554F] tabular-nums">
                <span className="inline-flex items-center gap-1 font-medium text-[#141413]">
                  <Footprints className="h-3 w-3 text-[#B93815]" />
                  {formatWalkingDuration(
                    estimateWalkingSeconds(
                      calculateDistanceMeters(
                        userLocation[0],
                        userLocation[1],
                        focusedSite.lat,
                        focusedSite.lng
                      )
                    )
                  )}
                </span>
                <span>·</span>
                <span>
                  {formatDistance(
                    calculateDistanceMeters(
                      userLocation[0],
                      userLocation[1],
                      focusedSite.lat,
                      focusedSite.lng
                    )
                  )}
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectSite(focusedSite)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#141413] px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-[#2C2B29]"
                >
                  <Volume2 className="h-3 w-3" />
                  <span>Thuyết minh</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStartRouteToSite(focusedSite)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#B93815] px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-[#9E2F11]"
                >
                  <Navigation className="h-3 w-3" />
                  <span>Dẫn đường</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thẻ Xem nhanh Quán ăn Nổi trên Bản đồ */}
      {focusedRestaurant && !activeRoute && (
        <div className="pointer-events-auto absolute bottom-4 left-4 right-4 sm:right-auto sm:w-84 z-10 rounded-2xl border border-[#E6E4DD] bg-white/98 p-3.5 shadow-xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B93815]">
                {focusedRestaurant.restaurant.cuisine}
              </span>
              <h4 className="text-sm font-semibold text-[#141413]">
                {focusedRestaurant.restaurant.name}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setFocusedRestaurant(null)}
              className="rounded p-0.5 text-[#8A877F] hover:text-[#141413]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-[#57554F]">
            <span className="inline-flex items-center gap-0.5 font-semibold text-[#141413]">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {focusedRestaurant.restaurant.rating.toFixed(1)}
            </span>
            <span>·</span>
            <span>{focusedRestaurant.restaurant.priceRange}</span>
          </div>
          <p className="mt-1 text-xs text-[#57554F] line-clamp-1">
            {focusedRestaurant.restaurant.specialtyDishes.join(' · ')}
          </p>
          <button
            type="button"
            onClick={() =>
              onStartRouteToRestaurant?.(
                focusedRestaurant.restaurant,
                focusedRestaurant.parentSite
              )
            }
            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#141413] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2C2B29]"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>Chỉ đường đi bộ tới quán</span>
          </button>
        </div>
      )}

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
              <a
                href={buildGoogleMapsWalkingUrl(
                  userLocation,
                  activeRoute.destination
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6E4DD] bg-white px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#F3F1EC]"
                title="Mở dẫn đường đi bộ trên ứng dụng Google Maps chính thức"
              >
                <ExternalLink className="h-3 w-3 text-blue-600" />
                <span>Mở Google Maps</span>
              </a>

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
