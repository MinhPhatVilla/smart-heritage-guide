import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Maximize2 } from 'lucide-react-native';
import { HeritageSite, NearbyRestaurant } from '../types/heritage';
import { MapTileConfig, getTileConfig } from '../services/mapTiles';
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
  tileConfig: MapTileConfig,
  fallbackTileConfig: MapTileConfig
): string {
  const safeMapId = JSON.stringify(mapId);
  const safeCenter = JSON.stringify(center);
  const safeTile = JSON.stringify(tileConfig);
  const safeFallbackTile = JSON.stringify(fallbackTileConfig);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #minimap {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #EFEDE6;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .leaflet-container { background: #EFEDE6; }
    .leaflet-control-attribution {
      font-size: 8.5px !important;
      background: rgba(255, 255, 255, 0.78) !important;
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
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function() {
      var MAP_ID = ${safeMapId};
      var INITIAL_CENTER = ${safeCenter};
      var PRIMARY_TILE = ${safeTile};
      var FALLBACK_TILE = ${safeFallbackTile};

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

      function boot() {
        if (typeof L === 'undefined') {
          var s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
          s.onload = init;
          document.head.appendChild(s);
          return;
        }
        init();
      }

      function init() {
        var map = L.map('minimap', {
          center: INITIAL_CENTER,
          zoom: 16,
          zoomControl: true,
          attributionControl: true
        });

        var tileErrors = 0;
        var switchedToFallback = false;
        var tileLayer = L.tileLayer(PRIMARY_TILE.url, {
          subdomains: PRIMARY_TILE.subdomains || 'abcd',
          attribution: PRIMARY_TILE.attribution || '',
          maxZoom: PRIMARY_TILE.maxZoom || 19
        }).addTo(map);

        tileLayer.on('tileerror', function() {
          tileErrors += 1;
          if (!switchedToFallback && tileErrors >= 4) {
            switchedToFallback = true;
            map.removeLayer(tileLayer);
            tileLayer = L.tileLayer(FALLBACK_TILE.url, {
              subdomains: FALLBACK_TILE.subdomains || 'abc',
              attribution: FALLBACK_TILE.attribution || '',
              maxZoom: FALLBACK_TILE.maxZoom || 19
            }).addTo(map);
          }
        });

        var overlay = L.layerGroup().addTo(map);
        var lastBoundsPoints = [INITIAL_CENTER];

        function fitAll() {
          if (lastBoundsPoints.length > 1) {
            map.fitBounds(L.latLngBounds(lastBoundsPoints), {
              padding: [34, 34],
              maxZoom: 16
            });
          } else {
            map.setView(lastBoundsPoints[0], 16);
          }
        }

        window.__SHG_MINIMAP_UPDATE__ = function(payload) {
          if (!payload || !payload.site) return;
          overlay.clearLayers();

          var site = payload.site;
          var shortSiteName = site.name.length > 24 ? site.name.slice(0, 22) + '…' : site.name;
          var siteIcon = L.divIcon({
            className: 'custom-heritage-marker',
            html: '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;border-radius:999px;background:#141413;color:#FFFFFF;border:2px solid #FFFFFF;box-shadow:0 4px 14px rgba(0,0,0,0.28);font-weight:700;font-size:11px;white-space:nowrap;">'
              + '<span style="width:7px;height:7px;border-radius:999px;background:#FBBF24;flex-shrink:0;"></span>'
              + '<span>' + escapeHtml(shortSiteName) + '</span>'
              + '</div>',
            iconSize: [190, 28],
            iconAnchor: [95, 14]
          });
          L.marker([site.lat, site.lng], { icon: siteIcon, zIndexOffset: 500 }).addTo(overlay);

          var boundsPoints = [[site.lat, site.lng]];

          if (Array.isArray(payload.userLocation) && payload.userLocation.length === 2) {
            var userIcon = L.divIcon({
              className: 'custom-user-marker',
              html: '<div style="width:14px;height:14px;border-radius:999px;background:#2563EB;border:2.5px solid #FFFFFF;box-shadow:0 2px 8px rgba(37,99,235,0.5);"></div>',
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            });
            L.marker(payload.userLocation, { icon: userIcon, zIndexOffset: 700 }).addTo(overlay);
            if (payload.includeUserInBounds) {
              boundsPoints.push(payload.userLocation);
            }
          }

          (payload.restaurants || []).forEach(function(res) {
            boundsPoints.push([res.lat, res.lng]);

            var shortRes = res.name.length > 16 ? res.name.slice(0, 14) + '…' : res.name;
            var resIcon = L.divIcon({
              className: 'custom-restaurant-marker',
              html: '<div style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;background:#B93815;color:#FFFFFF;border:1.5px solid #FFFFFF;box-shadow:0 4px 10px rgba(0,0,0,0.24);font-size:10px;font-weight:700;white-space:nowrap;cursor:pointer;">'
                + '<span>★ ' + Number(res.rating).toFixed(1) + '</span>'
                + '<span>' + escapeHtml(shortRes) + '</span>'
                + '</div>',
              iconSize: [136, 24],
              iconAnchor: [68, 12]
            });

            var marker = L.marker([res.lat, res.lng], {
              icon: resIcon,
              zIndexOffset: 300
            }).addTo(overlay);

            marker.on('click', function() {
              postToHost({ type: 'RESTAURANT_CLICK', restaurantId: res.id });
            });

            L.polyline([[site.lat, site.lng], [res.lat, res.lng]], {
              color: '#B93815',
              weight: 2,
              dashArray: '4 4',
              opacity: 0.72
            }).addTo(overlay);
          });

          lastBoundsPoints = boundsPoints;
          fitAll();
        };

        window.__SHG_MINIMAP_FIT__ = function() {
          fitAll();
        };

        window.addEventListener('message', function(event) {
          try {
            var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (!data || data.target !== 'shg-minimap' || data.mapId !== MAP_ID) return;
            if (data.type === 'UPDATE_STATE') {
              window.__SHG_MINIMAP_UPDATE__(data.payload);
            } else if (data.type === 'FIT_ALL') {
              window.__SHG_MINIMAP_FIT__();
            }
          } catch (err) {}
        });

        setTimeout(function() {
          map.invalidateSize();
          postToHost({ type: 'MAP_READY' });
        }, 80);
      }

      boot();
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
  const mapId = useMemo(
    () => `minimap-${site.id}-${Math.random().toString(36).slice(2, 8)}`,
    [site.id]
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
        getTileConfig('carto'),
        getTileConfig('osm')
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
      } else if (msg.type === 'RESTAURANT_CLICK') {
        const match = restaurants.find((r) => r.id === msg.restaurantId);
        if (match) {
          onSelectRestaurant?.(match);
        }
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
      {Platform.OS === 'web' ? (
        React.createElement('iframe', {
          ref: iframeRef,
          srcDoc: initialHtml,
          onLoad: handleIframeLoad,
          title: `Bản đồ ${site.translations.vi.name}`,
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
          nestedScrollEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          style={styles.webView}
        />
      )}

      {/* Subtle Floating Legend & Fit Button */}
      <View style={styles.topRightOverlay} pointerEvents="box-none">
        <View style={styles.legendChip}>
          <View style={[styles.dot, { backgroundColor: COLORS.ink }]} />
          <Text style={styles.legendLabel}>Di tích</Text>
          <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
          <Text style={styles.legendLabel}>Quán ăn</Text>
          <View style={[styles.dot, { backgroundColor: COLORS.gpsBlue }]} />
          <Text style={styles.legendLabel}>Bạn</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleFitBounds}
          style={styles.fitBtn}
          accessibilityLabel="Thu gọn bản đồ"
        >
          <Maximize2 size={13} color={COLORS.ink} />
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#EFEDE6',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#EFEDE6',
  },
  topRightOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 5,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...SHADOWS.card,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  fitBtn: {
    width: 26,
    height: 26,
    borderRadius: RADII.md - 2,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
});

export default SiteMiniMap;
