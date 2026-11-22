import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import {
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  CornerUpLeft,
  CornerUpRight,
  ExternalLink,
  Flag,
  Footprints,
  Layers,
  LocateFixed,
  Maximize2,
  Navigation,
  Play,
  Star,
  Utensils,
  Volume2,
  X,
} from 'lucide-react-native';
import {
  HeritageSite,
  NearbyRestaurant,
  RouteStep,
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
  MapTileConfig,
  buildGoogleMapsWalkingUrl,
  getAvailableMapStyles,
  getDefaultMapStyle,
  getTileConfig,
} from '../services/mapTiles';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export interface MapExplorerProps {
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

interface SerializedSiteMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  coverImage: string;
  index: number;
  isVisited: boolean;
  isSelected: boolean;
  restaurants: Array<{
    id: string;
    lat: number;
    lng: number;
    rating: number;
    name: string;
  }>;
}

interface MapStatePayload {
  tileConfig: MapTileConfig;
  userLocation: [number, number];
  searchRadiusMeters: number;
  sites: SerializedSiteMarker[];
  showRestaurants: boolean;
  route: {
    key: string;
    coordinates: [number, number][];
    destination: [number, number];
    targetName: string;
  } | null;
}

type MapCommand =
  | { type: 'FIT_ALL' }
  | { type: 'CENTER_USER' }
  | { type: 'FLY_TO'; lat: number; lng: number; zoom?: number };

type MapBridgeIncomingMessage =
  | { source: 'shg-map'; mapId: string; type: 'MAP_READY' }
  | { source: 'shg-map'; mapId: string; type: 'SITE_CLICK'; siteId: string }
  | {
      source: 'shg-map';
      mapId: string;
      type: 'RESTAURANT_CLICK';
      restaurantId: string;
      siteId: string;
    }
  | { source: 'shg-map'; mapId: string; type: 'MAP_CLICK'; lat: number; lng: number }
  | { source: 'shg-map'; mapId: string; type: 'USER_DRAG'; lat: number; lng: number };

function buildExplorerLeafletHtml(
  mapId: string,
  initialCenter: [number, number],
  initialTile: MapTileConfig
): string {
  const safeMapId = JSON.stringify(mapId);
  const safeCenter = JSON.stringify(initialCenter);
  const safeTile = JSON.stringify(initialTile);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; font-family: "Times New Roman", Times, serif; }
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #EFEDE6;
      overflow: hidden;
      font-family: "Times New Roman", Times, serif;
    }
    .leaflet-container { background: #EFEDE6; font-family: "Times New Roman", Times, serif !important; }
    .leaflet-control-attribution {
      font-size: 9px !important;
      background: rgba(255, 255, 255, 0.78) !important;
      color: #57554F !important;
    }
    .custom-user-marker,
    .custom-heritage-marker,
    .custom-restaurant-marker,
    .custom-dest-marker {
      background: transparent !important;
      border: none !important;
    }
    @keyframes shgGpsPulse {
      0% { transform: scale(0.85); opacity: 0.75; }
      70% { transform: scale(2.1); opacity: 0; }
      100% { transform: scale(2.1); opacity: 0; }
    }
    .shg-gps-ring {
      position: absolute;
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: rgba(37, 99, 235, 0.35);
      animation: shgGpsPulse 2s ease-out infinite;
    }
    .shg-pin-badge {
      transition: transform 0.16s ease;
    }
    .shg-pin-badge:active {
      transform: scale(0.95);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function() {
      var MAP_ID = ${safeMapId};
      var INITIAL_CENTER = ${safeCenter};
      var INITIAL_TILE = ${safeTile};

      function postToHost(payload) {
        try {
          var msg = JSON.stringify(Object.assign({ source: 'shg-map', mapId: MAP_ID }, payload));
          if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
            window.ReactNativeWebView.postMessage(msg);
          } else if (window.parent && window.parent !== window && typeof window.parent.postMessage === 'function') {
            window.parent.postMessage(msg, '*');
          }
        } catch (err) {}
      }

      function escapeHtml(str) {
        return String(str || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function bootLeaflet() {
        if (typeof L === 'undefined') {
          var fallbackScript = document.createElement('script');
          fallbackScript.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
          fallbackScript.onload = initMap;
          document.head.appendChild(fallbackScript);
          return;
        }
        initMap();
      }

      function initMap() {
        var map = L.map('map', {
          center: INITIAL_CENTER,
          zoom: 15,
          zoomControl: false,
          attributionControl: true
        });

        var currentTileId = null;
        var tileLayer = null;
        var radiusLayer = L.layerGroup().addTo(map);
        var routeLayer = L.layerGroup().addTo(map);
        var sitesLayer = L.layerGroup().addTo(map);
        var userLayer = L.layerGroup().addTo(map);

        var userMarker = null;
        var radiusCircle = null;
        var prevUserCenter = INITIAL_CENTER;
        var lastSitesSignature = '';
        var lastRouteKey = '';
        var lastKnownSites = [];
        var lastKnownUser = INITIAL_CENTER;

        function setTileConfig(cfg) {
          if (!cfg || currentTileId === cfg.id) return;
          currentTileId = cfg.id;
          if (tileLayer) {
            map.removeLayer(tileLayer);
          }
          tileLayer = L.tileLayer(cfg.url, {
            subdomains: cfg.subdomains || 'abc',
            attribution: cfg.attribution || '',
            maxZoom: cfg.maxZoom || 19
          }).addTo(map);
        }

        setTileConfig(INITIAL_TILE);

        map.on('click', function(e) {
          postToHost({ type: 'MAP_CLICK', lat: e.latlng.lat, lng: e.latlng.lng });
        });

        function ensureUserMarker(coords) {
          if (!userMarker) {
            var userIcon = L.divIcon({
              className: 'custom-user-marker',
              html: '<div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;">'
                + '<span class="shg-gps-ring"></span>'
                + '<span style="position:relative;width:16px;height:16px;border-radius:9999px;background:#2563EB;border:3px solid #FFFFFF;box-shadow:0 3px 10px rgba(37,99,235,0.48);"></span>'
                + '</div>',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
            userMarker = L.marker(coords, {
              icon: userIcon,
              draggable: true,
              zIndexOffset: 2000
            }).addTo(userLayer);

            userMarker.on('dragend', function() {
              var pos = userMarker.getLatLng();
              postToHost({ type: 'USER_DRAG', lat: pos.lat, lng: pos.lng });
            });
          } else {
            userMarker.setLatLng(coords);
          }
        }

        function updateRadius(coords, radiusMeters) {
          if (radiusMeters > 0 && radiusMeters <= 25000) {
            if (!radiusCircle) {
              radiusCircle = L.circle(coords, {
                radius: radiusMeters,
                color: '#2563EB',
                weight: 1.5,
                dashArray: '6 6',
                fillColor: '#2563EB',
                fillOpacity: 0.05
              }).addTo(radiusLayer);
            } else {
              radiusCircle.setLatLng(coords);
              radiusCircle.setRadius(radiusMeters);
            }
          } else if (radiusCircle) {
            radiusLayer.removeLayer(radiusCircle);
            radiusCircle = null;
          }
        }

        function renderSites(sites, showRestaurants) {
          var sig = JSON.stringify({
            showRestaurants: showRestaurants,
            sites: sites.map(function(s) {
              return [s.id, s.label, s.index, s.isVisited, s.isSelected];
            })
          });
          if (sig === lastSitesSignature) return;
          lastSitesSignature = sig;

          sitesLayer.clearLayers();

          sites.forEach(function(site) {
            var borderColor = site.isSelected
              ? '#B93815'
              : site.isVisited
                ? '#047857'
                : '#141413';
            var badgeBg = borderColor;
            var badgeText = site.isVisited ? '✓' : String(site.index);
            var siteIcon;

            if (site.isSelected) {
              var shortLabel = site.label.length > 18 ? site.label.slice(0, 16) + '…' : site.label;
              var selectedHtml = '<div class="shg-pin-badge" style="display:inline-flex;flex-direction:column;align-items:center;user-select:none;cursor:pointer;">'
                + '<div style="display:inline-flex;align-items:center;gap:6px;padding:3px 9px 3px 3px;border-radius:999px;background:#FFFFFF;border:2px solid #B93815;box-shadow:0 8px 20px rgba(20,20,19,0.26);">'
                + '<div style="width:24px;height:24px;border-radius:999px;overflow:hidden;flex-shrink:0;background:#F3F1EC;">'
                + '<img src="' + escapeHtml(site.coverImage) + '" alt="" style="width:24px;height:24px;object-fit:cover;display:block;" />'
                + '</div>'
                + '<span style="font-size:11.5px;font-weight:700;color:#141413;white-space:nowrap;letter-spacing:-0.01em;">'
                + escapeHtml(shortLabel)
                + '</span>'
                + '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#B93815;color:#FFFFFF;font-size:9.5px;font-weight:700;">'
                + badgeText
                + '</span>'
                + '</div>'
                + '<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #B93815;margin-top:-1px;"></div>'
                + '</div>';

              siteIcon = L.divIcon({
                className: 'custom-heritage-marker',
                html: selectedHtml,
                iconSize: [188, 40],
                iconAnchor: [94, 40]
              });
            } else {
              var compactHtml = '<div class="shg-pin-badge" style="position:relative;width:36px;height:36px;border-radius:999px;background:#FFFFFF;border:2.5px solid ' + (site.isVisited ? '#047857' : '#FFFFFF') + ';box-shadow:0 4px 12px rgba(20,20,19,0.26);cursor:pointer;user-select:none;">'
                + '<div style="width:100%;height:100%;border-radius:999px;overflow:hidden;background:#F3F1EC;">'
                + '<img src="' + escapeHtml(site.coverImage) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />'
                + '</div>'
                + '<span style="position:absolute;top:-4px;right:-4px;display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 3px;border-radius:999px;background:' + badgeBg + ';color:#FFFFFF;border:1.5px solid #FFFFFF;font-size:9px;font-weight:700;line-height:1;">'
                + badgeText
                + '</span>'
                + '</div>';

              siteIcon = L.divIcon({
                className: 'custom-heritage-marker',
                html: compactHtml,
                iconSize: [36, 36],
                iconAnchor: [18, 18]
              });
            }

            var marker = L.marker([site.lat, site.lng], {
              icon: siteIcon,
              zIndexOffset: site.isSelected ? 1200 : 200
            }).addTo(sitesLayer);

            marker.on('click', function(ev) {
              L.DomEvent.stopPropagation(ev);
              postToHost({ type: 'SITE_CLICK', siteId: site.id });
              map.flyTo([site.lat, site.lng], Math.max(map.getZoom(), 15), { duration: 0.55 });
            });

            if (showRestaurants && Array.isArray(site.restaurants)) {
              site.restaurants.forEach(function(res) {
                var resIcon = L.divIcon({
                  className: 'custom-restaurant-marker',
                  html: '<div class="shg-pin-badge" style="display:inline-flex;align-items:center;gap:3px;padding:3px 7px;border-radius:999px;background:#141413;color:#FFFFFF;border:1.5px solid #FFFFFF;box-shadow:0 4px 10px rgba(0,0,0,0.24);font-size:10px;font-weight:700;white-space:nowrap;cursor:pointer;">'
                    + '<span style="color:#FBBF24;">★</span>'
                    + '<span>' + Number(res.rating).toFixed(1) + '</span>'
                    + '</div>',
                  iconSize: [48, 22],
                  iconAnchor: [24, 11]
                });
                var resMarker = L.marker([res.lat, res.lng], {
                  icon: resIcon,
                  zIndexOffset: 150
                }).addTo(sitesLayer);

                resMarker.on('click', function(ev) {
                  L.DomEvent.stopPropagation(ev);
                  postToHost({
                    type: 'RESTAURANT_CLICK',
                    restaurantId: res.id,
                    siteId: site.id
                  });
                  map.flyTo([res.lat, res.lng], Math.max(map.getZoom(), 16), { duration: 0.55 });
                });
              });
            }
          });
        }

        function renderRoute(route) {
          var nextKey = route ? route.key : '';
          if (nextKey === lastRouteKey) return;
          lastRouteKey = nextKey;

          routeLayer.clearLayers();
          if (!route || !Array.isArray(route.coordinates) || route.coordinates.length === 0) {
            return;
          }

          L.polyline(route.coordinates, {
            color: '#FFFFFF',
            weight: 9,
            opacity: 0.94,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(routeLayer);

          var routeLine = L.polyline(route.coordinates, {
            color: '#B93815',
            weight: 5,
            dashArray: '10 6',
            opacity: 0.98,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(routeLayer);

          if (route.destination) {
            var destIcon = L.divIcon({
              className: 'custom-dest-marker',
              html: '<div style="width:16px;height:16px;border-radius:999px;background:#B93815;border:3px solid #FFFFFF;box-shadow:0 2px 8px rgba(185,56,21,0.5);"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });
            L.marker(route.destination, { icon: destIcon, zIndexOffset: 1500 }).addTo(routeLayer);
          }

          try {
            map.fitBounds(routeLine.getBounds(), {
              paddingTopLeft: [40, 88],
              paddingBottomRight: [40, 210],
              maxZoom: 16
            });
          } catch (err) {}
        }

        window.__SHG_UPDATE__ = function(state) {
          if (!state) return;
          if (state.tileConfig) {
            setTileConfig(state.tileConfig);
          }
          if (Array.isArray(state.userLocation) && state.userLocation.length === 2) {
            lastKnownUser = state.userLocation;
            ensureUserMarker(state.userLocation);
            updateRadius(state.userLocation, state.searchRadiusMeters || 0);

            var latDiff = Math.abs(prevUserCenter[0] - state.userLocation[0]);
            var lngDiff = Math.abs(prevUserCenter[1] - state.userLocation[1]);
            if (latDiff > 0.012 || lngDiff > 0.012) {
              map.flyTo(state.userLocation, 15, { duration: 0.85 });
            }
            prevUserCenter = state.userLocation;
          }
          if (Array.isArray(state.sites)) {
            lastKnownSites = state.sites;
            renderSites(state.sites, !!state.showRestaurants);
          }
          renderRoute(state.route || null);
        };

        window.__SHG_CMD__ = function(cmd) {
          if (!cmd || !cmd.type) return;
          if (cmd.type === 'FIT_ALL') {
            var pts = [lastKnownUser];
            lastKnownSites.forEach(function(s) {
              pts.push([s.lat, s.lng]);
            });
            if (pts.length > 1) {
              map.fitBounds(L.latLngBounds(pts), {
                paddingTopLeft: [36, 92],
                paddingBottomRight: [36, 120],
                maxZoom: 15
              });
            } else {
              map.flyTo(lastKnownUser, 15, { duration: 0.6 });
            }
          } else if (cmd.type === 'CENTER_USER') {
            map.flyTo(lastKnownUser, 16, { duration: 0.65 });
          } else if (cmd.type === 'FLY_TO' && typeof cmd.lat === 'number' && typeof cmd.lng === 'number') {
            map.flyTo([cmd.lat, cmd.lng], cmd.zoom || 16, { duration: 0.65 });
          }
        };

        window.addEventListener('message', function(event) {
          try {
            var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (!data || data.target !== 'shg-map' || data.mapId !== MAP_ID) return;
            if (data.type === 'UPDATE_STATE') {
              window.__SHG_UPDATE__(data.payload);
            } else if (data.type === 'CMD') {
              window.__SHG_CMD__(data.command);
            }
          } catch (err) {}
        });

        setTimeout(function() {
          map.invalidateSize();
          postToHost({ type: 'MAP_READY' });
        }, 80);
      }

      bootLeaflet();
    })();
  </script>
</body>
</html>`;
}

function renderStepIcon(maneuverType: RouteStep['maneuverType']) {
  switch (maneuverType) {
    case 'turn-left':
      return <CornerUpLeft size={14} color={COLORS.accent} />;
    case 'turn-right':
      return <CornerUpRight size={14} color={COLORS.accent} />;
    case 'arrive':
      return <Flag size={14} color={COLORS.visited} />;
    case 'depart':
      return <Navigation size={14} color={COLORS.accent} />;
    default:
      return <ArrowUp size={14} color={COLORS.accent} />;
  }
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
  const mapId = useMemo(
    () => `explorer-${Math.random().toString(36).slice(2, 10)}`,
    []
  );
  const availableStyles = useMemo(() => getAvailableMapStyles(), []);
  const [mapStyle, setMapStyle] = useState<BaseMapStyle>(() =>
    getDefaultMapStyle()
  );
  const [showRestaurantsOnMap, setShowRestaurantsOnMap] =
    useState<boolean>(false);
  const [showStyleMenu, setShowStyleMenu] = useState<boolean>(false);
  const [focusedSite, setFocusedSite] = useState<HeritageSite | null>(null);
  const [focusedRestaurant, setFocusedRestaurant] = useState<{
    restaurant: NearbyRestaurant;
    parentSite: HeritageSite;
  } | null>(null);
  const [stepsExpanded, setStepsExpanded] = useState<boolean>(false);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  const webViewRef = useRef<WebView<{}> | null>(null);
  const iframeRef = useRef<{
    contentWindow?: { postMessage: (msg: string, targetOrigin: string) => void };
  } | null>(null);
  const latestPayloadRef = useRef<MapStatePayload | null>(null);

  const initialHtml = useMemo(
    () =>
      buildExplorerLeafletHtml(
        mapId,
        userLocation,
        getTileConfig(getDefaultMapStyle())
      ),
    // Keep static HTML shell so map never reloads on prop updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapId]
  );

  // Clear quick preview cards when an active route begins
  useEffect(() => {
    if (activeRoute) {
      setFocusedSite(null);
      setFocusedRestaurant(null);
    } else {
      setStepsExpanded(false);
    }
  }, [activeRoute]);

  const sendToMap = useCallback(
    (
      message:
        | { type: 'UPDATE_STATE'; payload: MapStatePayload }
        | { type: 'CMD'; command: MapCommand }
    ) => {
      if (Platform.OS === 'web') {
        const win = iframeRef.current?.contentWindow;
        if (win) {
          win.postMessage(
            JSON.stringify({ target: 'shg-map', mapId, ...message }),
            '*'
          );
        }
        return;
      }

      if (webViewRef.current) {
        const fn =
          message.type === 'UPDATE_STATE' ? '__SHG_UPDATE__' : '__SHG_CMD__';
        const data =
          message.type === 'UPDATE_STATE' ? message.payload : message.command;
        const literal = JSON.stringify(data)
          .replace(/\u2028/g, '\\u2028')
          .replace(/\u2029/g, '\\u2029');
        webViewRef.current.injectJavaScript(
          `(function(){try{if(window.${fn}){window.${fn}(${literal});}}catch(e){}})();true;`
        );
      }
    },
    [mapId]
  );

  const mapStatePayload = useMemo<MapStatePayload>(() => {
    const visitedIdSet = new Set(visitedRecords.map((r) => r.siteId));
    const serializedSites: SerializedSiteMarker[] = sites.map((site, idx) => {
      const localName =
        (site.translations[selectedLanguage] || site.translations.vi).name;
      return {
        id: site.id,
        lat: site.lat,
        lng: site.lng,
        label: localName,
        coverImage: site.coverImage,
        index: idx + 1,
        isVisited: visitedIdSet.has(site.id),
        isSelected:
          selectedSiteId === site.id || focusedSite?.id === site.id,
        restaurants: site.nearbyRestaurants.map((res) => ({
          id: res.id,
          lat: res.lat,
          lng: res.lng,
          rating: res.rating,
          name: res.name,
        })),
      };
    });

    return {
      tileConfig: getTileConfig(mapStyle),
      userLocation,
      searchRadiusMeters,
      sites: serializedSites,
      showRestaurants: showRestaurantsOnMap,
      route:
        activeRoute && activeRoute.coordinates.length > 0
          ? {
              key: `${activeRoute.targetId}:${activeRoute.coordinates.length}:${Math.round(activeRoute.totalDistanceMeters)}`,
              coordinates: activeRoute.coordinates,
              destination: activeRoute.destination,
              targetName: activeRoute.targetName,
            }
          : null,
    };
  }, [
    mapStyle,
    userLocation,
    searchRadiusMeters,
    sites,
    visitedRecords,
    selectedLanguage,
    selectedSiteId,
    focusedSite,
    showRestaurantsOnMap,
    activeRoute,
  ]);

  useEffect(() => {
    latestPayloadRef.current = mapStatePayload;
    if (!isMapReady) return;
    sendToMap({ type: 'UPDATE_STATE', payload: mapStatePayload });
  }, [isMapReady, mapStatePayload, sendToMap]);

  const handleIframeLoad = useCallback(() => {
    setIsMapReady(true);
    if (latestPayloadRef.current) {
      sendToMap({ type: 'UPDATE_STATE', payload: latestPayloadRef.current });
    }
  }, [sendToMap]);

  const handleIncomingBridgeMessage = useCallback(
    (raw: unknown) => {
      let msg: MapBridgeIncomingMessage | null = null;
      try {
        msg =
          typeof raw === 'string'
            ? (JSON.parse(raw) as MapBridgeIncomingMessage)
            : (raw as MapBridgeIncomingMessage);
      } catch {
        return;
      }
      if (!msg || msg.source !== 'shg-map' || msg.mapId !== mapId) return;

      switch (msg.type) {
        case 'MAP_READY':
          setIsMapReady(true);
          break;
        case 'SITE_CLICK': {
          const matched = sites.find((s) => s.id === msg.siteId);
          if (matched) {
            setFocusedRestaurant(null);
            setFocusedSite(matched);
          }
          break;
        }
        case 'RESTAURANT_CLICK': {
          const parentSite = sites.find((s) => s.id === msg.siteId);
          const restaurant = parentSite?.nearbyRestaurants.find(
            (r) => r.id === msg.restaurantId
          );
          if (parentSite && restaurant) {
            setFocusedSite(null);
            setFocusedRestaurant({ restaurant, parentSite });
          }
          break;
        }
        case 'MAP_CLICK':
          setShowStyleMenu(false);
          setFocusedSite(null);
          setFocusedRestaurant(null);
          onMoveUserLocation(msg.lat, msg.lng);
          break;
        case 'USER_DRAG':
          onMoveUserLocation(msg.lat, msg.lng);
          break;
      }
    },
    [mapId, sites, onMoveUserLocation]
  );

  // Listen for iframe postMessage events on Expo Web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const globalWin = globalThis as unknown as {
      addEventListener?: (
        event: string,
        handler: (e: { data: unknown }) => void
      ) => void;
      removeEventListener?: (
        event: string,
        handler: (e: { data: unknown }) => void
      ) => void;
    };
    if (!globalWin.addEventListener || !globalWin.removeEventListener) return;

    const listener = (event: { data: unknown }) => {
      handleIncomingBridgeMessage(event.data);
    };
    globalWin.addEventListener('message', listener);
    return () => {
      globalWin.removeEventListener?.('message', listener);
    };
  }, [handleIncomingBridgeMessage]);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      handleIncomingBridgeMessage(event.nativeEvent.data);
    },
    [handleIncomingBridgeMessage]
  );

  const handleFitAllMarkers = useCallback(() => {
    sendToMap({ type: 'CMD', command: { type: 'FIT_ALL' } });
  }, [sendToMap]);

  const handleCenterOnGps = useCallback(() => {
    onDetectRealGps?.();
    sendToMap({ type: 'CMD', command: { type: 'CENTER_USER' } });
  }, [onDetectRealGps, sendToMap]);

  const handleOpenExternalGoogleMaps = useCallback(() => {
    if (!activeRoute) return;
    const url = buildGoogleMapsWalkingUrl(userLocation, activeRoute.destination);
    Linking.openURL(url).catch(() => {});
  }, [activeRoute, userLocation]);

  const focusedSiteMetrics = useMemo(() => {
    if (!focusedSite) return null;
    const distance = calculateDistanceMeters(
      userLocation[0],
      userLocation[1],
      focusedSite.lat,
      focusedSite.lng
    );
    const walkingSecs = estimateWalkingSeconds(distance);
    const isVisited = visitedRecords.some((r) => r.siteId === focusedSite.id);
    const localized =
      focusedSite.translations[selectedLanguage] || focusedSite.translations.vi;
    return { distance, walkingSecs, isVisited, localized };
  }, [focusedSite, userLocation, visitedRecords, selectedLanguage]);

  const focusedRestaurantDistance = useMemo(() => {
    if (!focusedRestaurant) return 0;
    return calculateDistanceMeters(
      userLocation[0],
      userLocation[1],
      focusedRestaurant.restaurant.lat,
      focusedRestaurant.restaurant.lng
    );
  }, [focusedRestaurant, userLocation]);

  return (
    <View style={styles.root}>
      {/* Interactive Leaflet Map Surface */}
      <View style={styles.mapSurface}>
        {Platform.OS === 'web' ? (
          React.createElement('iframe', {
            ref: iframeRef,
            srcDoc: initialHtml,
            onLoad: handleIframeLoad,
            title: 'Smart Heritage Guide Map Explorer',
            sandbox: 'allow-scripts allow-same-origin',
            style: {
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            },
          })
        ) : (
          <WebView<{}>
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: initialHtml }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            bounces={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            style={styles.webView}
          />
        )}
      </View>

      {/* Minimal Top-Right Floating Controls (Layers + Food) */}
      <View style={styles.topRightControls} pointerEvents="box-none">
        <View style={styles.topRightIconColumn}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowStyleMenu((prev) => !prev)}
            style={[
              styles.roundControlBtn,
              showStyleMenu && styles.roundControlBtnActive,
            ]}
            accessibilityLabel="Chọn nền bản đồ"
          >
            <Layers
              size={18}
              color={showStyleMenu ? COLORS.white : COLORS.ink}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowRestaurantsOnMap((prev) => !prev)}
            style={[
              styles.roundControlBtn,
              showRestaurantsOnMap && styles.roundControlBtnActive,
            ]}
            accessibilityLabel="Hiện hoặc ẩn quán ăn quanh di tích"
          >
            <Utensils
              size={17}
              color={showRestaurantsOnMap ? COLORS.white : COLORS.ink}
            />
          </TouchableOpacity>
        </View>

        {showStyleMenu && (
          <View style={styles.stylePopover}>
            <Text style={styles.stylePopoverTitle}>Nền bản đồ</Text>
            {availableStyles.map((tile) => {
              const active = mapStyle === tile.id;
              return (
                <TouchableOpacity
                  key={tile.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    setMapStyle(tile.id);
                    setShowStyleMenu(false);
                  }}
                  style={[
                    styles.styleOptionRow,
                    active && styles.styleOptionRowActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.styleOptionText,
                      active && styles.styleOptionTextActive,
                    ]}
                  >
                    {tile.label}
                  </Text>
                  {active && <Check size={14} color={COLORS.accent} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Floating Bottom-Right Icon Controls (Fit All + My GPS) */}
      <View
        style={[
          styles.rightControls,
          activeRoute || focusedSite || focusedRestaurant
            ? styles.rightControlsRaised
            : null,
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleFitAllMarkers}
          style={styles.roundControlBtn}
          accessibilityLabel="Xem toàn cảnh các di tích"
        >
          <Maximize2 size={18} color={COLORS.ink} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCenterOnGps}
          style={styles.roundControlBtn}
          accessibilityLabel="Về vị trí GPS của tôi"
        >
          <LocateFixed size={19} color={COLORS.gpsBlue} />
        </TouchableOpacity>
      </View>

      {/* Routing Loading Indicator */}
      {isRoutingLoading && (
        <View style={styles.loadingWrap} pointerEvents="none">
          <View style={styles.loadingPill}>
            <ActivityIndicator size="small" color={COLORS.accent} />
            <Text style={styles.loadingText}>
              Đang vẽ lộ trình dẫn đường đi bộ trên bản đồ…
            </Text>
          </View>
        </View>
      )}

      {/* Focused Heritage Site Quick Card */}
      {focusedSite && focusedSiteMetrics && !activeRoute && !isRoutingLoading && (
        <View style={styles.bottomCardWrap} pointerEvents="box-none">
          <View style={styles.previewCard}>
            <View style={styles.previewCardRow}>
              <Image
                source={{ uri: focusedSite.coverImage }}
                style={styles.previewThumb}
                resizeMode="cover"
              />
              <View style={styles.previewInfo}>
                <View style={styles.previewTopMeta}>
                  <View style={styles.previewTagRow}>
                    <Text style={styles.previewCity} numberOfLines={1}>
                      {focusedSite.city}
                    </Text>
                    {focusedSiteMetrics.isVisited && (
                      <View style={styles.visitedMiniBadge}>
                        <Check size={10} color={COLORS.visited} />
                        <Text style={styles.visitedMiniText}>Đã đi</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setFocusedSite(null)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    style={styles.closeIconBtn}
                  >
                    <X size={16} color={COLORS.inkMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.previewTitle} numberOfLines={1}>
                  {focusedSiteMetrics.localized.name}
                </Text>

                <View style={styles.previewMetricsRow}>
                  <Footprints size={12} color={COLORS.accent} />
                  <Text style={styles.previewMetricStrong}>
                    {formatWalkingDuration(focusedSiteMetrics.walkingSecs)}
                  </Text>
                  <Text style={styles.previewMetricDot}>·</Text>
                  <Text style={styles.previewMetricMuted}>
                    {formatDistance(focusedSiteMetrics.distance)}
                  </Text>
                </View>

                <View style={styles.previewActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onSelectSite(focusedSite)}
                    style={styles.btnDark}
                  >
                    <Volume2 size={13} color={COLORS.white} />
                    <Text style={styles.btnDarkText}>Thuyết minh</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onStartRouteToSite(focusedSite)}
                    style={styles.btnAccent}
                  >
                    <Navigation size={13} color={COLORS.white} />
                    <Text style={styles.btnAccentText}>Dẫn đường</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Focused Restaurant Quick Card */}
      {focusedRestaurant && !activeRoute && !isRoutingLoading && (
        <View style={styles.bottomCardWrap} pointerEvents="box-none">
          <View style={styles.previewCard}>
            <View style={styles.previewTopMeta}>
              <View style={{ flex: 1 }}>
                <Text style={styles.restaurantCuisine} numberOfLines={1}>
                  {focusedRestaurant.restaurant.cuisine}
                </Text>
                <Text style={styles.restaurantName} numberOfLines={1}>
                  {focusedRestaurant.restaurant.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFocusedRestaurant(null)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                style={styles.closeIconBtn}
              >
                <X size={16} color={COLORS.inkMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.restaurantMetaRow}>
              <Star
                size={13}
                color={COLORS.amberStar}
                fill={COLORS.amberStar}
              />
              <Text style={styles.previewMetricStrong}>
                {focusedRestaurant.restaurant.rating.toFixed(1)}
              </Text>
              <Text style={styles.previewMetricDot}>·</Text>
              <Text style={styles.previewMetricMuted}>
                {focusedRestaurant.restaurant.priceRange}
              </Text>
              <Text style={styles.previewMetricDot}>·</Text>
              <Text style={styles.previewMetricMuted}>
                {formatDistance(focusedRestaurantDistance)}
              </Text>
            </View>

            <Text style={styles.restaurantDishes} numberOfLines={1}>
              {focusedRestaurant.restaurant.specialtyDishes.join(' · ')}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                onStartRouteToRestaurant?.(
                  focusedRestaurant.restaurant,
                  focusedRestaurant.parentSite
                )
              }
              style={[styles.btnDark, { marginTop: SPACING.sm, paddingVertical: 10 }]}
            >
              <Navigation size={14} color={COLORS.white} />
              <Text style={styles.btnDarkText}>Chỉ đường đi bộ tới quán</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Active Walking Navigation Bottom HUD */}
      {activeRoute && !isRoutingLoading && (
        <View style={styles.bottomCardWrap} pointerEvents="box-none">
          <View style={styles.navHudCard}>
            {/* Header: Active Route Info + Live Timer + Cancel */}
            <View style={styles.navHeaderRow}>
              <View style={styles.navIconBadge}>
                <Navigation size={16} color={COLORS.white} />
              </View>

              <View style={styles.navTitleBlock}>
                <View style={styles.navStatusLine}>
                  <Text style={styles.navStatusLabel}>Đang dẫn đường</Text>
                  <View style={styles.timerBadge}>
                    <Footprints size={11} color={COLORS.ink} />
                    <Text style={styles.timerText}>
                      Đã đi: {formatWalkingDuration(activeWalkSeconds)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.navTargetName} numberOfLines={1}>
                  {activeRoute.targetName}
                </Text>

                <Text style={styles.navSubMetrics}>
                  {formatDistance(activeRoute.totalDistanceMeters)} · ~
                  {formatWalkingDuration(activeRoute.estimatedDurationSeconds)}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={onCancelRoute}
                style={styles.cancelNavBtn}
                accessibilityLabel="Dừng dẫn đường"
              >
                <X size={17} color={COLORS.inkSecondary} />
              </TouchableOpacity>
            </View>

            {/* Primary Navigation Action Buttons */}
            <View style={styles.navActionsRow}>
              <TouchableOpacity
                activeOpacity={0.82}
                disabled={isSimulatingWalk}
                onPress={onSimulateWalkAlongRoute}
                style={[
                  styles.navSecondaryBtn,
                  isSimulatingWalk && styles.navBtnDisabled,
                ]}
              >
                <Play size={13} color={COLORS.ink} fill={COLORS.ink} />
                <Text style={styles.navSecondaryBtnText} numberOfLines={1}>
                  {isSimulatingWalk ? 'Đang đi bộ…' : 'Mô phỏng đi bộ'}
                </Text>
              </TouchableOpacity>

              {activeRoute.targetType === 'heritage' && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onFinishWalkAndCheckIn}
                  style={styles.navPrimaryBtn}
                >
                  <Check size={14} color={COLORS.white} />
                  <Text style={styles.navPrimaryBtnText} numberOfLines={1}>
                    Đã đến · Check-in
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.82}
                onPress={handleOpenExternalGoogleMaps}
                style={styles.navGmapsBtn}
                accessibilityLabel="Mở Google Maps"
              >
                <ExternalLink size={14} color={COLORS.gpsBlue} />
              </TouchableOpacity>
            </View>

            {/* Expandable Turn-by-Turn Steps Sheet */}
            {activeRoute.steps.length > 0 && (
              <View style={styles.stepsSection}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setStepsExpanded((prev) => !prev)}
                  style={styles.stepsToggleBar}
                >
                  <View style={styles.stepsToggleLeft}>
                    {renderStepIcon(activeRoute.steps[0].maneuverType)}
                    <Text style={styles.stepsToggleTitle} numberOfLines={1}>
                      {stepsExpanded
                        ? `Chỉ dẫn từng chặng (${activeRoute.steps.length} bước)`
                        : activeRoute.steps[0].instruction}
                    </Text>
                  </View>
                  <View style={styles.stepsToggleRight}>
                    <Text style={styles.stepsCountChip}>
                      {activeRoute.steps.length} bước
                    </Text>
                    {stepsExpanded ? (
                      <ChevronDown size={15} color={COLORS.inkMuted} />
                    ) : (
                      <ChevronUp size={15} color={COLORS.inkMuted} />
                    )}
                  </View>
                </TouchableOpacity>

                {stepsExpanded && (
                  <ScrollView
                    style={styles.stepsScroll}
                    contentContainerStyle={styles.stepsListContent}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    {activeRoute.steps.map((step, idx) => (
                      <View key={idx} style={styles.stepItem}>
                        <View style={styles.stepIconCircle}>
                          {renderStepIcon(step.maneuverType)}
                        </View>
                        <View style={styles.stepTextWrap}>
                          <Text style={styles.stepInstruction}>
                            {idx + 1}. {step.instruction}
                          </Text>
                          <Text style={styles.stepMeta}>
                            {formatDistance(step.distanceMeters)} · ~
                            {formatWalkingDuration(step.durationSeconds)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 440,
    backgroundColor: '#EFEDE6',
    position: 'relative',
    overflow: 'hidden',
  },
  mapSurface: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  webView: {
    flex: 1,
    backgroundColor: '#EFEDE6',
  },
  topRightControls: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 15,
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  topRightIconColumn: {
    gap: SPACING.sm,
    alignItems: 'flex-end',
  },
  roundControlBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.floating,
  },
  roundControlBtnActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  stylePopover: {
    width: 156,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xs + 2,
    gap: 2,
    ...SHADOWS.floating,
  },
  stylePopoverTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: COLORS.inkMuted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  styleOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: RADII.md,
  },
  styleOptionRowActive: {
    backgroundColor: COLORS.accentSoft,
  },
  styleOptionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  styleOptionTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  rightControls: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.lg,
    zIndex: 10,
    gap: SPACING.sm,
    alignItems: 'flex-end',
  },
  rightControlsRaised: {
    bottom: 215,
  },
  loadingWrap: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.lg,
    alignItems: 'center',
    zIndex: 20,
  },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.floating,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  bottomCardWrap: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.md,
    zIndex: 20,
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.floating,
  },
  previewCardRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  previewThumb: {
    width: 78,
    height: 84,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewInfo: {
    flex: 1,
    minWidth: 0,
  },
  previewTopMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  previewTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  previewCity: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: COLORS.inkMuted,
    flexShrink: 1,
  },
  visitedMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.visitedBg,
    borderColor: COLORS.visitedBorder,
    borderWidth: 1,
    borderRadius: RADII.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  visitedMiniText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.visited,
  },
  closeIconBtn: {
    padding: 2,
  },
  previewTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 2,
  },
  previewMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  previewMetricStrong: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  previewMetricDot: {
    fontSize: 12,
    color: COLORS.inkMuted,
  },
  previewMetricMuted: {
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  previewActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  btnDark: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.ink,
    borderRadius: RADII.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  btnDarkText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  btnAccent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.accent,
    borderRadius: RADII.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  btnAccentText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  restaurantCuisine: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.accent,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 2,
  },
  restaurantMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  restaurantDishes: {
    fontSize: 12,
    color: COLORS.inkSecondary,
    marginTop: 4,
  },
  navHudCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.floating,
  },
  navHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  navIconBadge: {
    width: 34,
    height: 34,
    borderRadius: RADII.md,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  navTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  navStatusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  navStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  timerText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  navTargetName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 2,
  },
  navSubMetrics: {
    fontSize: 12,
    color: COLORS.inkSecondary,
    marginTop: 1,
  },
  cancelNavBtn: {
    width: 32,
    height: 32,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  navSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navSecondaryBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.ink,
  },
  navPrimaryBtn: {
    flex: 1.15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.ink,
    borderRadius: RADII.md,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  navPrimaryBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.white,
  },
  navGmapsBtn: {
    width: 38,
    height: 36,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsSection: {
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  stepsToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    backgroundColor: COLORS.bg,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  stepsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  stepsToggleTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.ink,
    flex: 1,
  },
  stepsToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepsCountChip: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  stepsScroll: {
    maxHeight: 168,
    marginTop: SPACING.xs + 2,
  },
  stepsListContent: {
    gap: 6,
    paddingBottom: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.bg,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  stepIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  stepInstruction: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
    lineHeight: 17,
  },
  stepMeta: {
    fontSize: 11,
    color: COLORS.inkMuted,
    marginTop: 1,
  },
});

export default MapExplorer;
