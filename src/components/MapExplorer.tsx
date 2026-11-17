import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
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
  Box,
  Star,
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
  VECTOR_MAP_STYLES,
  buildGoogleMapsWalkingUrl,
  createGeoJsonCircle,
  resolveMapStyleUrl,
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
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const prevCenterRef = useRef<[number, number]>(userLocation);

  const [mapStyle, setMapStyle] = useState<BaseMapStyle>('liberty');
  const [is3DView, setIs3DView] = useState<boolean>(true);
  const [showRestaurantsOnMap, setShowRestaurantsOnMap] =
    useState<boolean>(false);
  const [focusedSite, setFocusedSite] = useState<HeritageSite | null>(null);
  const [focusedRestaurant, setFocusedRestaurant] = useState<{
    restaurant: NearbyRestaurant;
    parentSite: HeritageSite;
  } | null>(null);

  // Đồng bộ GeoJSON đường đi bộ và vòng bán kính lên bản đồ Vector
  const syncGeoJsonOverlays = (map: maplibregl.Map) => {
    if (!map.isStyleLoaded()) return;

    // 1. Vòng tròn bán kính quét GPS
    const radiusSourceId = 'shg-radius-source';
    const radiusFillId = 'shg-radius-fill';
    const radiusLineId = 'shg-radius-line';

    const circleGeoJson: GeoJSON.FeatureCollection =
      searchRadiusMeters > 0 && searchRadiusMeters <= 25000
        ? {
            type: 'FeatureCollection',
            features: [
              createGeoJsonCircle(
                userLocation[0],
                userLocation[1],
                searchRadiusMeters
              ),
            ],
          }
        : { type: 'FeatureCollection', features: [] };

    const existingRadiusSource = map.getSource(
      radiusSourceId
    ) as maplibregl.GeoJSONSource | undefined;

    if (existingRadiusSource) {
      existingRadiusSource.setData(circleGeoJson);
    } else {
      map.addSource(radiusSourceId, {
        type: 'geojson',
        data: circleGeoJson,
      });
      map.addLayer({
        id: radiusFillId,
        type: 'fill',
        source: radiusSourceId,
        paint: {
          'fill-color': '#2563eb',
          'fill-opacity': 0.045,
        },
      });
      map.addLayer({
        id: radiusLineId,
        type: 'line',
        source: radiusSourceId,
        paint: {
          'line-color': '#2563eb',
          'line-width': 1.5,
          'line-dasharray': [4, 4],
          'line-opacity': 0.45,
        },
      });
    }

    // 2. Đường dẫn đường đi bộ (Walking Route Line)
    const routeSourceId = 'shg-route-source';
    const routeCasingId = 'shg-route-casing';
    const routeMainId = 'shg-route-main';

    const routeGeoJson: GeoJSON.FeatureCollection =
      activeRoute && activeRoute.coordinates.length > 1
        ? {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: activeRoute.coordinates.map(([lat, lng]) => [
                    lng,
                    lat,
                  ]),
                },
              },
            ],
          }
        : { type: 'FeatureCollection', features: [] };

    const existingRouteSource = map.getSource(
      routeSourceId
    ) as maplibregl.GeoJSONSource | undefined;

    if (existingRouteSource) {
      existingRouteSource.setData(routeGeoJson);
    } else {
      map.addSource(routeSourceId, {
        type: 'geojson',
        data: routeGeoJson,
      });
      map.addLayer({
        id: routeCasingId,
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 9,
          'line-opacity': 0.95,
        },
      });
      map.addLayer({
        id: routeMainId,
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#B93815',
          'line-width': 4.5,
          'line-dasharray': [2, 1.5],
          'line-opacity': 0.98,
        },
      });
    }
  };

  // Khởi tạo bản đồ Vector MapLibre GL
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: resolveMapStyleUrl(mapStyle),
      center: [userLocation[1], userLocation[0]],
      zoom: 14.6,
      pitch: 42,
      bearing: -8,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showCompass: true,
      }),
      'bottom-right'
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-left'
    );

    map.on('load', () => {
      syncGeoJsonOverlays(map);
    });

    map.on('styledata', () => {
      syncGeoJsonOverlays(map);
    });

    map.on('click', (e: maplibregl.MapMouseEvent) => {
      const target = e.originalEvent.target as HTMLElement | null;
      if (target && target.closest('.shg-pin')) return;
      onMoveUserLocation(e.lngLat.lat, e.lngLat.lng);
    });

    mapRef.current = map;

    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Đổi style Vector (Hiện đại 3D / Tối giản / Đường phố)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(resolveMapStyleUrl(mapStyle));
  }, [mapStyle]);

  // Chuyển góc nhìn 2D / 3D
  const handleToggle3D = () => {
    const map = mapRef.current;
    const next = !is3DView;
    setIs3DView(next);
    if (map) {
      map.easeTo({
        pitch: next ? 45 : 0,
        bearing: next ? -10 : 0,
        duration: 650,
      });
    }
  };

  // Cập nhật chấm xanh GPS của người dùng
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const latDiff = Math.abs(prevCenterRef.current[0] - userLocation[0]);
    const lngDiff = Math.abs(prevCenterRef.current[1] - userLocation[1]);
    if (latDiff > 0.015 || lngDiff > 0.015) {
      map.flyTo({
        center: [userLocation[1], userLocation[0]],
        zoom: 14.6,
        duration: 1100,
      });
    }
    prevCenterRef.current = userLocation;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'shg-pin';
      el.style.cursor = 'grab';
      el.innerHTML = `
        <div class="shg-gps-pulse" style="position:relative;display:flex;align-items:center;justify-content:center;width:22px;height:22px;">
          <span style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 3px 10px rgba(37,99,235,0.45);"></span>
        </div>
      `;

      const marker = new maplibregl.Marker({
        element: el,
        draggable: true,
      })
        .setLngLat([userLocation[1], userLocation[0]])
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        onMoveUserLocation(lngLat.lat, lngLat.lng);
      });

      userMarkerRef.current = marker;
    } else {
      userMarkerRef.current.setLngLat([userLocation[1], userLocation[0]]);
    }

    syncGeoJsonOverlays(map);
  }, [userLocation, searchRadiusMeters]);

  // Vẽ các Pin Danh lam thắng cảnh & Quán ăn hiện đại, gọn đẹp
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

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

      const el = document.createElement('div');
      el.className = 'shg-pin';
      el.style.cursor = 'pointer';
      el.style.zIndex = isSelected ? '25' : '10';

      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;user-select:none;">
          <div style="position:relative;display:flex;align-items:center;gap:6px;padding:3px 9px 3px 4px;border-radius:999px;background:#ffffff;border:2px solid ${borderColor};box-shadow:0 6px 18px rgba(20,20,19,0.18);">
            <div style="width:24px;height:24px;border-radius:999px;overflow:hidden;flex-shrink:0;background:#f3f1ec;">
              <img src="${site.coverImage}" alt="" style="width:100%;height:100%;object-fit:cover;" />
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
      `;

      el.onclick = (ev) => {
        ev.stopPropagation();
        setFocusedRestaurant(null);
        setFocusedSite(site);
        map.flyTo({
          center: [site.lng, site.lat],
          zoom: Math.max(map.getZoom(), 15.2),
          duration: 750,
        });
      };

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([site.lng, site.lat])
        .addTo(map);

      markersRef.current.push(marker);

      // Pin quán ăn đề xuất (khi bật bộ lọc quán ăn trên bản đồ)
      if (showRestaurantsOnMap) {
        site.nearbyRestaurants.forEach((res) => {
          const resEl = document.createElement('div');
          resEl.className = 'shg-pin';
          resEl.style.cursor = 'pointer';
          resEl.style.zIndex = '8';
          resEl.innerHTML = `
            <div style="display:inline-flex;align-items:center;gap:3px;padding:3px 7px;border-radius:999px;background:#141413;color:#ffffff;border:1.5px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.2);font-size:10px;font-weight:700;white-space:nowrap;">
              <span style="color:#fbbf24;">★</span>
              <span>${res.rating.toFixed(1)}</span>
            </div>
          `;

          resEl.onclick = (ev) => {
            ev.stopPropagation();
            setFocusedSite(null);
            setFocusedRestaurant({ restaurant: res, parentSite: site });
            map.flyTo({
              center: [res.lng, res.lat],
              zoom: Math.max(map.getZoom(), 15.8),
              duration: 650,
            });
          };

          const resMarker = new maplibregl.Marker({
            element: resEl,
            anchor: 'center',
          })
            .setLngLat([res.lng, res.lat])
            .addTo(map);

          markersRef.current.push(resMarker);
        });
      }
    });
  }, [
    sites,
    selectedSiteId,
    focusedSite,
    visitedRecords,
    selectedLanguage,
    showRestaurantsOnMap,
  ]);

  // Vẽ lộ trình dẫn đường đi bộ và căn khung nhìn vừa vặn
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    syncGeoJsonOverlays(map);

    if (activeRoute && activeRoute.coordinates.length > 1) {
      setFocusedSite(null);
      setFocusedRestaurant(null);
      const bounds = new maplibregl.LngLatBounds();
      activeRoute.coordinates.forEach(([lat, lng]) => {
        bounds.extend([lng, lat]);
      });
      map.fitBounds(bounds, {
        padding: { top: 72, bottom: 180, left: 64, right: 64 },
        maxZoom: 16.2,
        duration: 900,
      });
    }
  }, [activeRoute]);

  const handleFitAllMarkers = () => {
    const map = mapRef.current;
    if (!map || sites.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([userLocation[1], userLocation[0]]);
    sites.forEach((s) => bounds.extend([s.lng, s.lat]));
    map.fitBounds(bounds, {
      padding: 64,
      maxZoom: 15,
      duration: 850,
    });
  };

  return (
    <div className="relative h-[520px] lg:h-[calc(100vh-96px)] min-h-[500px] w-full overflow-hidden rounded-2xl border border-[#E6E4DD] bg-[#ECEAE4] shadow-xs">
      {/* Khung bản đồ Vector MapLibre GL */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 h-full w-full z-0"
      />

      {/* Thanh điều khiển nổi phía trên (Floating Top Controls) */}
      <div className="pointer-events-auto absolute top-3 inset-x-3 z-10 flex flex-wrap items-center justify-between gap-2">
        {/* Chú giải & Bật/Tắt Quán ăn */}
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

        {/* Bộ chọn giao diện Vector 3D & Định vị */}
        <div className="flex items-center gap-1.5">
          <div className="inline-flex items-center rounded-xl border border-[#E6E4DD] bg-white/95 p-0.5 shadow-xs backdrop-blur-md">
            {(Object.keys(VECTOR_MAP_STYLES) as BaseMapStyle[]).map((mode) => (
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
                {VECTOR_MAP_STYLES[mode].label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleToggle3D}
            className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold shadow-xs backdrop-blur-md transition-colors ${
              is3DView
                ? 'border-[#141413] bg-[#141413] text-white'
                : 'border-[#E6E4DD] bg-white/95 text-[#141413]'
            }`}
            title="Chuyển góc nhìn tòa nhà 3D / 2D"
          >
            <Box className="h-3.5 w-3.5" />
            <span>3D</span>
          </button>

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
              <span className="hidden sm:inline">GPS</span>
            </button>
          )}
        </div>
      </div>

      {/* Thẻ Xem nhanh Di tích Nổi trên Bản đồ (Floating Heritage Card) */}
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

      {/* Trạng thái đang tính đường */}
      {isRoutingLoading && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 flex items-center justify-center">
          <div className="rounded-xl border border-[#E6E4DD] bg-white/95 px-4 py-2.5 text-xs font-medium text-[#141413] shadow-md">
            Đang vẽ lộ trình dẫn đường đi bộ trên bản đồ…
          </div>
        </div>
      )}

      {/* Thanh Dẫn đường Đi bộ Trực tiếp */}
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
