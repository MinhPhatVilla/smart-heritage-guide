import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Maximize2 } from 'lucide-react-native';
import { HeritageSite, NearbyRestaurant } from '../types/heritage';
import {
  MAPBOX_TOKEN_STORAGE_KEY,
  MapTileConfig,
  MapboxLightPreset,
  getRealtimeLightPreset,
  getTileConfig,
  isValidMapboxPublicToken,
  resolveMapboxAccessToken,
} from '../services/mapTiles';
import { calculateDistanceMeters } from '../utils/geoUtils';
import { COLORS, RADII, SHADOWS, SPACING } from '../theme';

export interface SiteMiniMapProps {
  site: HeritageSite;
  userLocation: [number, number];
  restaurants: Array<NearbyRestaurant & { distanceMeters?: number }>;
  onSelectRestaurant?: (restaurant: NearbyRestaurant) => void;
  height?: number;
}

interface MiniMapPayload {
  site: {
    lat: number;
    lng: number;
    name: string;
  };
  userLocation: [number, number];
  includeUserInBounds: boolean;
  restaurants: Array<{
    id: string;
    name: string;
    rating: number;
    lat: number;
    lng: number;
  }>;
}

type MiniMapIncomingMessage =
  | { source: 'shg-minimap'; mapId: string; type: 'MAP_READY' }
  | {
      source: 'shg-minimap';
      mapId: string;
      type: 'RESTAURANT_CLICK';
      restaurantId: string;
    };

function buildMiniMapHtml(
  mapId: string,
  center: [number, number],
  primaryTile: MapTileConfig,
  fallbackTile: MapTileConfig,
  mapboxToken: string,
  initialLightPreset: MapboxLightPreset
): string {
  const useMapbox = Boolean(mapboxToken);
  const safeMapId = JSON.stringify(mapId);
  const safeCenter = JSON.stringify(center);
  const safePrimary = JSON.stringify(primaryTile);
  const safeFallback = JSON.stringify(fallbackTile);
  const safeToken = JSON.stringify(mapboxToken);
  const safeLightPreset = JSON.stringify(initialLightPreset);
  const initialBg = initialLightPreset === 'night' ? '#0E121B' : '#F4F2EC';

  const glCss = useMapbox
    ? 'https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.css'
    : 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css';
  const glJs = useMapbox
    ? 'https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.js'
    : 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="${glCss}" />
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #minimap {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: ${initialBg};
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    }
    .mapboxgl-map, .maplibregl-map, .leaflet-container {
      background: ${initialBg};
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    }
    .mapboxgl-ctrl-attrib, .maplibregl-ctrl-attrib {
      font-size: 8.5px !important;
      background: rgba(255, 255, 255, 0.8) !important;
      color: #57554F !important;
    }
    .custom-heritage-marker,
    .custom-restaurant-marker,
    .custom-user-marker {
      background: transparent !important;
      border: none !important;
    }
  </style>
</head>
<body>
  <div id="minimap"></div>
  <script src="${glJs}"></script>
  <script>
    (function() {
      var MAP_ID = ${safeMapId};
      var INITIAL_CENTER = ${safeCenter};
      var PRIMARY_TILE = ${safePrimary};
      var FALLBACK_TILE = ${safeFallback};
      var INITIAL_LIGHT_PRESET = ${safeLightPreset};
      var MAPBOX_TOKEN = ${safeToken};
      var USE_MAPBOX = Boolean(MAPBOX_TOKEN);

      function postToHost(payload) {
        try {
          var msg = JSON.stringify(Object.assign({ source: 'shg-minimap', mapId: MAP_ID }, payload));
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

      function expandSubdomainUrls(template, subdomains) {
        if (!template) return [];
        if (template.indexOf('{s}') === -1) return [template];
        return (subdomains || 'abc').split('').map(function(s) {
          return template.replace('{s}', s);
        });
      }

      function buildRasterStyle(tile) {
        return {
          version: 8,
          sources: {
            'osm-hot': {
              type: 'raster',
              tiles: expandSubdomainUrls(tile.url, tile.subdomains),
              tileSize: 256,
              maxzoom: 19,
              attribution: tile.attribution || ''
            }
          },
          layers: [{ id: 'osm-hot-layer', type: 'raster', source: 'osm-hot' }]
        };
      }

      function applyStylePolish(map) {
        var isNight = INITIAL_LIGHT_PRESET === 'night';
        var isDusk = INITIAL_LIGHT_PRESET === 'dusk';
        var isDawn = INITIAL_LIGHT_PRESET === 'dawn';
        if (USE_MAPBOX) {
          var setCfg = function(k, v) { try { map.setConfigProperty('basemap', k, v); } catch (e) {} };
          setCfg('theme', 'faded');
          setCfg('lightPreset', INITIAL_LIGHT_PRESET || 'day');
          setCfg('colorMotorways', isNight ? '#333B4C' : (isDusk ? '#D8CEC0' : (isDawn ? '#ECE2D6' : '#E8E3D9')));
          setCfg('colorTrunks', isNight ? '#2B3242' : (isDusk ? '#E2D9CC' : (isDawn ? '#F3EAE0' : '#EFECE4')));
          setCfg('colorRoads', isNight ? '#222836' : (isDusk ? '#F2ECE2' : (isDawn ? '#FFFBF5' : '#FFFFFF')));
          setCfg('show3dObjects', true);
          return;
        }
        var setPaint = function(id, prop, val) {
          try { if (map.getLayer(id)) map.setPaintProperty(id, prop, val); } catch (e) {}
        };
        setPaint('background', 'background-color', isNight ? '#131823' : (isDusk ? '#EDE4D8' : (isDawn ? '#F6EFE8' : '#F6F4EF')));
        setPaint('water', 'fill-color', isNight ? '#0B1320' : (isDusk ? '#A9C2D6' : '#D2E2EE'));
        setPaint('park', 'fill-color', isNight ? '#16241E' : (isDusk ? '#C4D2BC' : '#DCE7D4'));
        setPaint('building', 'fill-color', isNight ? '#1B2231' : (isDusk ? '#DFD6C9' : '#EBE7DF'));
        setPaint('building-3d', 'fill-extrusion-color', isNight ? '#263147' : (isDusk ? '#D2C7B8' : '#E0DBD1'));
        setPaint('building-3d', 'fill-extrusion-opacity', 0.88);
        var style = map.getStyle();
        if (style && Array.isArray(style.layers)) {
          for (var i = 0; i < style.layers.length; i++) {
            var lyr = style.layers[i];
            if (lyr.type !== 'line') continue;
            var lower = (lyr.id || '').toLowerCase();
            if (lower.indexOf('road') === -1 && lower.indexOf('bridge') === -1 && lower.indexOf('tunnel') === -1) continue;
            var isCase = lower.indexOf('case') !== -1 || lower.indexOf('casing') !== -1;
            var isMajor = lower.indexOf('motorway') !== -1 || lower.indexOf('trunk') !== -1 || lower.indexOf('primary') !== -1;
            var roadColor = isNight
              ? (isCase ? '#182030' : (isMajor ? '#334057' : '#253043'))
              : (isDusk ? (isCase ? '#C9BFAF' : (isMajor ? '#E2D8CA' : '#F2EBE0')) : (isCase ? '#D6D0C4' : (isMajor ? '#F1EEE7' : '#FFFFFF')));
            setPaint(lyr.id, 'line-color', roadColor);
          }
        }
      }

      function initGlMiniMap() {
        var gl = USE_MAPBOX ? window.mapboxgl : window.maplibregl;
        if (USE_MAPBOX) gl.accessToken = MAPBOX_TOKEN;

        var initialStyle = USE_MAPBOX
          ? (PRIMARY_TILE.mapboxStyleUrl || 'mapbox://styles/mapbox/standard')
          : (PRIMARY_TILE.vectorStyleUrl || buildRasterStyle(FALLBACK_TILE));

        var map = new gl.Map({
          container: 'minimap',
          style: initialStyle,
          center: [INITIAL_CENTER[1], INITIAL_CENTER[0]],
          zoom: 16,
          pitch: 38,
          bearing: -10,
          antialias: true,
          attributionControl: true
        });

        var markers = [];
        var lastBoundsPoints = [[INITIAL_CENTER[1], INITIAL_CENTER[0]]];
        var lastPayload = null;
        var styleReady = false;
        var fallbackSwitched = false;

        function ensureConnectorsLayer() {
          if (!map.getSource('mini-connectors')) {
            map.addSource('mini-connectors', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] }
            });
            var slotProps = USE_MAPBOX ? { slot: 'middle' } : {};
            map.addLayer(Object.assign({
              id: 'mini-connectors-line',
              type: 'line',
              source: 'mini-connectors',
              paint: {
                'line-color': '#B93815',
                'line-width': 2,
                'line-dasharray': [2, 2],
                'line-opacity': 0.8
              }
            }, slotProps));
          }
        }

        function fitAll() {
          if (lastBoundsPoints.length > 1) {
            var b = new gl.LngLatBounds(lastBoundsPoints[0], lastBoundsPoints[0]);
            lastBoundsPoints.forEach(function(p) { b.extend(p); });
            map.fitBounds(b, { padding: 38, maxZoom: 16.5, duration: 500 });
          } else {
            map.easeTo({ center: lastBoundsPoints[0], zoom: 16, duration: 400 });
          }
        }

        function renderPayload(payload) {
          if (!payload || !payload.site) return;
          lastPayload = payload;
          markers.forEach(function(m) { m.remove(); });
          markers = [];

          var site = payload.site;
          var shortSiteName = site.name.length > 24 ? site.name.slice(0, 22) + '…' : site.name;
          var siteEl = document.createElement('div');
          siteEl.innerHTML = '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;border-radius:999px;background:#141413;color:#FFFFFF;border:2px solid #FFFFFF;box-shadow:0 4px 14px rgba(0,0,0,0.28);font-weight:700;font-size:11px;white-space:nowrap;">'
            + '<span style="width:7px;height:7px;border-radius:999px;background:#FBBF24;flex-shrink:0;"></span>'
            + '<span>' + escapeHtml(shortSiteName) + '</span>'
            + '</div>';
          markers.push(new gl.Marker({ element: siteEl, anchor: 'center' }).setLngLat([site.lng, site.lat]).addTo(map));

          var boundsPoints = [[site.lng, site.lat]];

          if (Array.isArray(payload.userLocation) && payload.userLocation.length === 2) {
            var uEl = document.createElement('div');
            uEl.innerHTML = '<div style="width:14px;height:14px;border-radius:999px;background:#1A73E8;border:2.5px solid #FFFFFF;box-shadow:0 2px 8px rgba(26,115,232,0.5);"></div>';
            markers.push(new gl.Marker({ element: uEl, anchor: 'center' }).setLngLat([payload.userLocation[1], payload.userLocation[0]]).addTo(map));
            if (payload.includeUserInBounds) {
              boundsPoints.push([payload.userLocation[1], payload.userLocation[0]]);
            }
          }

          var lineFeatures = [];
          (payload.restaurants || []).forEach(function(res) {
            boundsPoints.push([res.lng, res.lat]);
            var shortRes = res.name.length > 16 ? res.name.slice(0, 14) + '…' : res.name;
            var rEl = document.createElement('div');
            rEl.style.cursor = 'pointer';
            rEl.innerHTML = '<div style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;background:#B93815;color:#FFFFFF;border:1.5px solid #FFFFFF;box-shadow:0 4px 10px rgba(0,0,0,0.24);font-size:10px;font-weight:700;white-space:nowrap;">'
              + '<span>★ ' + Number(res.rating).toFixed(1) + '</span>'
              + '<span>' + escapeHtml(shortRes) + '</span>'
              + '</div>';
            rEl.addEventListener('click', function(ev) {
              ev.stopPropagation();
              postToHost({ type: 'RESTAURANT_CLICK', restaurantId: res.id });
            });
            markers.push(new gl.Marker({ element: rEl, anchor: 'center' }).setLngLat([res.lng, res.lat]).addTo(map));
            lineFeatures.push({
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: [[site.lng, site.lat], [res.lng, res.lat]] },
              properties: {}
            });
          });

          if (styleReady && map.getSource('mini-connectors')) {
            map.getSource('mini-connectors').setData({
              type: 'FeatureCollection',
              features: lineFeatures
            });
          }

          lastBoundsPoints = boundsPoints;
          fitAll();
        }

        map.on('style.load', function() {
          styleReady = true;
          applyStylePolish(map);
          ensureConnectorsLayer();
          if (lastPayload) renderPayload(lastPayload);
        });

        map.on('error', function(e) {
          if (fallbackSwitched) return;
          var status = e && e.error && e.error.status;
          var msg = (e && e.error && e.error.message) ? String(e.error.message) : '';
          if (status === 401 || status === 403 || msg.indexOf('openfreemap') !== -1 || msg.indexOf('Failed to fetch') !== -1) {
            fallbackSwitched = true;
            map.setStyle(buildRasterStyle(FALLBACK_TILE));
          }
        });

        window.__SHG_MINIMAP_UPDATE__ = renderPayload;
        window.__SHG_MINIMAP_FIT__ = fitAll;

        window.addEventListener('message', function(event) {
          try {
            var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (!data || data.target !== 'shg-minimap' || data.mapId !== MAP_ID) return;
            if (data.type === 'UPDATE_STATE') window.__SHG_MINIMAP_UPDATE__(data.payload);
            if (data.type === 'FIT_ALL') window.__SHG_MINIMAP_FIT__();
          } catch (err) {}
        });

        map.on('load', function() {
          map.resize();
          postToHost({ type: 'MAP_READY' });
        });
      }

      function initLeafletFallback() {
        var css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);

        var sc = document.createElement('script');
        sc.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
        sc.onload = function() {
          var map = L.map('minimap', { center: INITIAL_CENTER, zoom: 16, zoomControl: true });
          L.tileLayer(FALLBACK_TILE.url, {
            subdomains: FALLBACK_TILE.subdomains || 'abc',
            attribution: FALLBACK_TILE.attribution || '',
            maxZoom: 19
          }).addTo(map);
          var overlay = L.layerGroup().addTo(map);
          var lastBoundsPoints = [INITIAL_CENTER];

          function fitAll() {
            if (lastBoundsPoints.length > 1) {
              map.fitBounds(L.latLngBounds(lastBoundsPoints), { padding: [34, 34], maxZoom: 16 });
            } else {
              map.setView(lastBoundsPoints[0], 16);
            }
          }

          window.__SHG_MINIMAP_UPDATE__ = function(payload) {
            if (!payload || !payload.site) return;
            overlay.clearLayers();
            var site = payload.site;
            var shortSiteName = site.name.length > 24 ? site.name.slice(0, 22) + '…' : site.name;
            L.marker([site.lat, site.lng], {
              icon: L.divIcon({
                className: 'custom-heritage-marker',
                html: '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;border-radius:999px;background:#141413;color:#FFFFFF;border:2px solid #FFFFFF;font-weight:700;font-size:11px;white-space:nowrap;">' + escapeHtml(shortSiteName) + '</div>',
                iconSize: [190, 28],
                iconAnchor: [95, 14]
              })
            }).addTo(overlay);

            var pts = [[site.lat, site.lng]];
            (payload.restaurants || []).forEach(function(res) {
              pts.push([res.lat, res.lng]);
              var m = L.marker([res.lat, res.lng], {
                icon: L.divIcon({
                  className: 'custom-restaurant-marker',
                  html: '<div style="padding:3px 8px;border-radius:999px;background:#B93815;color:#FFFFFF;border:1.5px solid #FFFFFF;font-size:10px;font-weight:700;white-space:nowrap;">★ ' + Number(res.rating).toFixed(1) + '</div>',
                  iconSize: [52, 22],
                  iconAnchor: [26, 11]
                })
              }).addTo(overlay);
              m.on('click', function() {
                postToHost({ type: 'RESTAURANT_CLICK', restaurantId: res.id });
              });
              L.polyline([[site.lat, site.lng], [res.lat, res.lng]], { color: '#B93815', weight: 2, dashArray: '4 4' }).addTo(overlay);
            });
            lastBoundsPoints = pts;
            fitAll();
          };
          window.__SHG_MINIMAP_FIT__ = fitAll;

          window.addEventListener('message', function(event) {
            try {
              var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              if (!data || data.target !== 'shg-minimap' || data.mapId !== MAP_ID) return;
              if (data.type === 'UPDATE_STATE') window.__SHG_MINIMAP_UPDATE__(data.payload);
              if (data.type === 'FIT_ALL') window.__SHG_MINIMAP_FIT__();
            } catch (err) {}
          });

          setTimeout(function() {
            map.invalidateSize();
            postToHost({ type: 'MAP_READY' });
          }, 80);
        };
        document.head.appendChild(sc);
      }

      function hasWebGL() {
        try {
          var c = document.createElement('canvas');
          return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl') || c.getContext('webgl2')));
        } catch (e) {
          return false;
        }
      }

      var targetGlobal = USE_MAPBOX ? window.mapboxgl : window.maplibregl;
      if (!hasWebGL() || typeof targetGlobal === 'undefined') {
        initLeafletFallback();
      } else {
        try {
          initGlMiniMap();
        } catch (err) {
          initLeafletFallback();
        }
      }
    })();
  </script>
</body>
</html>`;
}

export const SiteMiniMap: React.FC<SiteMiniMapProps> = ({
  site,
  userLocation,
  restaurants,
  onSelectRestaurant,
  height = 240,
}) => {
  const [runtimeToken, setRuntimeToken] = useState<string>('');
  const [tokenLoaded, setTokenLoaded] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(MAPBOX_TOKEN_STORAGE_KEY)
      .then((saved) => {
        if (mounted && saved && isValidMapboxPublicToken(saved)) {
          setRuntimeToken(saved.trim());
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setTokenLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const activeToken = useMemo(
    () => resolveMapboxAccessToken(runtimeToken),
    [runtimeToken]
  );

  const mapId = useMemo(
    () =>
      `minimap-${site.id}-${activeToken ? 'mbx' : 'osm'}-${Math.random().toString(36).slice(2, 8)}`,
    [site.id, activeToken]
  );
  const [isReady, setIsReady] = useState(false);

  const webViewRef = useRef<WebView<{}> | null>(null);
  const iframeRef = useRef<{
    contentWindow?: { postMessage: (msg: string, targetOrigin: string) => void };
  } | null>(null);
  const latestPayloadRef = useRef<MiniMapPayload | null>(null);

  useEffect(() => {
    setIsReady(false);
  }, [mapId]);

  const initialHtml = useMemo(
    () =>
      buildMiniMapHtml(
        mapId,
        [site.lat, site.lng],
        getTileConfig(activeToken ? 'mapbox_standard' : 'osm_3d'),
        getTileConfig('osm_hot'),
        activeToken,
        getRealtimeLightPreset()
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapId]
  );

  const payload = useMemo<MiniMapPayload>(() => {
    const userDistanceToSite = calculateDistanceMeters(
      userLocation[0],
      userLocation[1],
      site.lat,
      site.lng
    );
    return {
      site: {
        lat: site.lat,
        lng: site.lng,
        name: site.translations.vi.name,
      },
      userLocation,
      includeUserInBounds: userDistanceToSite <= 2500,
      restaurants: restaurants.map((res) => ({
        id: res.id,
        name: res.name,
        rating: res.rating,
        lat: res.lat,
        lng: res.lng,
      })),
    };
  }, [site, userLocation, restaurants]);

  const sendUpdate = useCallback(
    (nextPayload: MiniMapPayload) => {
      if (Platform.OS === 'web') {
        const win = iframeRef.current?.contentWindow;
        if (win) {
          win.postMessage(
            JSON.stringify({
              target: 'shg-minimap',
              mapId,
              type: 'UPDATE_STATE',
              payload: nextPayload,
            }),
            '*'
          );
        }
        return;
      }

      if (webViewRef.current) {
        const literal = JSON.stringify(nextPayload)
          .replace(/\u2028/g, '\\u2028')
          .replace(/\u2029/g, '\\u2029');
        webViewRef.current.injectJavaScript(
          `(function(){try{if(window.__SHG_MINIMAP_UPDATE__){window.__SHG_MINIMAP_UPDATE__(${literal});}}catch(e){}})();true;`
        );
      }
    },
    [mapId]
  );

  const handleFitBounds = useCallback(() => {
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ target: 'shg-minimap', mapId, type: 'FIT_ALL' }),
        '*'
      );
      return;
    }
    webViewRef.current?.injectJavaScript(
      `(function(){try{if(window.__SHG_MINIMAP_FIT__){window.__SHG_MINIMAP_FIT__();}}catch(e){}})();true;`
    );
  }, [mapId]);

  useEffect(() => {
    latestPayloadRef.current = payload;
    if (!isReady) return;
    sendUpdate(payload);
  }, [isReady, payload, sendUpdate]);

  const handleIframeLoad = useCallback(() => {
    setIsReady(true);
    if (latestPayloadRef.current) {
      sendUpdate(latestPayloadRef.current);
    }
  }, [sendUpdate]);

  const handleIncomingMessage = useCallback(
    (raw: unknown) => {
      let msg: MiniMapIncomingMessage | null = null;
      try {
        msg =
          typeof raw === 'string'
            ? (JSON.parse(raw) as MiniMapIncomingMessage)
            : (raw as MiniMapIncomingMessage);
      } catch {
        return;
      }
      if (!msg || msg.source !== 'shg-minimap' || msg.mapId !== mapId) return;

      if (msg.type === 'MAP_READY') {
        setIsReady(true);
      } else if (msg.type === 'RESTAURANT_CLICK' && onSelectRestaurant) {
        const found = restaurants.find((r) => r.id === msg.restaurantId);
        if (found) onSelectRestaurant(found);
      }
    },
    [mapId, restaurants, onSelectRestaurant]
  );

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
      handleIncomingMessage(event.data);
    };
    globalWin.addEventListener('message', listener);
    return () => {
      globalWin.removeEventListener?.('message', listener);
    };
  }, [handleIncomingMessage]);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      handleIncomingMessage(event.nativeEvent.data);
    },
    [handleIncomingMessage]
  );

  return (
    <View style={[styles.container, { height }]}>
      {tokenLoaded &&
        (Platform.OS === 'web' ? (
          React.createElement('iframe', {
            key: mapId,
            ref: iframeRef,
            srcDoc: initialHtml,
            onLoad: handleIframeLoad,
            title: `Bản đồ 3D ${site.translations.vi.name}`,
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
            key={mapId}
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: initialHtml }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            bounces={false}
            overScrollMode="never"
            style={styles.webView}
          />
        ))}

      {/* Fit All Floating Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleFitBounds}
        style={styles.fitBtn}
        accessibilityLabel="Xem toàn cảnh di tích và quán ăn"
      >
        <Maximize2 size={13} color={COLORS.ink} />
        <Text style={styles.fitBtnText}>Toàn cảnh</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: RADII.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F2F0EA',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#F2F0EA',
  },
  fitBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 9,
    paddingVertical: 6,
    ...SHADOWS.card,
  },
  fitBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
  },
});

export default SiteMiniMap;
