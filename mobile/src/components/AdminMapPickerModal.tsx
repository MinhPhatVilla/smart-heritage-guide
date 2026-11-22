import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import {
  Check,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  X,
} from 'lucide-react-native';
import {
  getDefaultMapStyle,
  getTileConfig,
  resolveMapboxAccessToken,
} from '../services/mapTiles';
import {
  HCMC_BOUNDARY_RINGS,
  VIETNAM_MAX_BOUNDS,
  VIETNAM_MIN_ZOOM,
} from '../data/vietnamMapBounds';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export interface ExistingMapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface MapPickedLocation {
  lat: number;
  lng: number;
  suggestedPlaceName?: string;
}

export interface AdminMapPickerModalProps {
  visible: boolean;
  title?: string;
  initialLat: number;
  initialLng: number;
  userLocation: [number, number];
  existingPoints?: ExistingMapPoint[];
  onConfirm: (picked: MapPickedLocation) => void;
  onClose: () => void;
}

type PickerBridgeMsg =
  | { source: 'shg-picker'; mapId: string; type: 'READY' }
  | {
      source: 'shg-picker';
      mapId: string;
      type: 'PICK';
      lat: number;
      lng: number;
      placeName?: string;
    };

function buildPickerHtml(
  mapId: string,
  initialLat: number,
  initialLng: number,
  existingPoints: ExistingMapPoint[],
  mapboxToken: string
): string {
  const useMapbox = Boolean(mapboxToken);
  const tileCfg = getTileConfig(getDefaultMapStyle(mapboxToken));
  const glCss = useMapbox
    ? 'https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css'
    : 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css';
  const glJs = useMapbox
    ? 'https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js'
    : 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="${glCss}" />
  <style>
    * { box-sizing: border-box; font-family: "Times New Roman", Times, serif; }
    html, body, #picker-map {
      margin: 0; padding: 0; width: 100%; height: 100%;
      background: #F2F0EA; overflow: hidden;
    }
    .shg-picker-pin {
      display: flex; flex-direction: column; align-items: center;
      cursor: grab; user-select: none;
    }
    .shg-picker-pin-head {
      width: 34px; height: 34px; border-radius: 999px;
      background: #B93815; border: 3px solid #FFFFFF;
      box-shadow: 0 8px 20px rgba(185,56,21,0.45);
      display: flex; align-items: center; justify-content: center;
      color: #FFFFFF; font-size: 16px; font-weight: 700;
    }
    .shg-picker-pin-tail {
      width: 0; height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 9px solid #B93815;
      margin-top: -1px;
    }
    .shg-existing-dot {
      width: 10px; height: 10px; border-radius: 999px;
      background: #141413; border: 2px solid #FFFFFF;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      opacity: 0.72;
    }
  </style>
</head>
<body>
  <div id="picker-map"></div>
  <script src="${glJs}"></script>
  <script>
    (function() {
      var MAP_ID = ${JSON.stringify(mapId)};
      var INIT_LAT = ${JSON.stringify(initialLat)};
      var INIT_LNG = ${JSON.stringify(initialLng)};
      var EXISTING = ${JSON.stringify(existingPoints)};
      var MAPBOX_TOKEN = ${JSON.stringify(mapboxToken)};
      var USE_MAPBOX = Boolean(MAPBOX_TOKEN);
      var TILE_CFG = ${JSON.stringify(tileCfg)};
      var VN_BOUNDS = ${JSON.stringify(VIETNAM_MAX_BOUNDS)};
      var VN_MIN_ZOOM = ${JSON.stringify(VIETNAM_MIN_ZOOM)};
      var HCMC_RINGS = ${JSON.stringify(HCMC_BOUNDARY_RINGS)};

      function postToHost(payload) {
        try {
          var msg = JSON.stringify(Object.assign({ source: 'shg-picker', mapId: MAP_ID }, payload));
          if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
            window.ReactNativeWebView.postMessage(msg);
          } else if (window.parent && window.parent !== window) {
            window.parent.postMessage(msg, '*');
          }
        } catch (e) {}
      }

      function createPinEl() {
        var el = document.createElement('div');
        el.className = 'shg-picker-pin';
        el.innerHTML = '<div class="shg-picker-pin-head">+</div><div class="shg-picker-pin-tail"></div>';
        return el;
      }

      function buildRasterStyle(cfg) {
        var url = cfg.url || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        var tiles = url.indexOf('{s}') !== -1
          ? ['a','b','c'].map(function(s) { return url.replace('{s}', s); })
          : [url];
        return {
          version: 8,
          sources: {
            osm: { type: 'raster', tiles: tiles, tileSize: 256, maxzoom: 19 }
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
        };
      }

      function resolveStyle() {
        if (USE_MAPBOX && TILE_CFG.renderMode === 'mapbox' && TILE_CFG.mapboxStyleUrl) {
          return TILE_CFG.mapboxStyleUrl;
        }
        if (TILE_CFG.renderMode === 'vector' && TILE_CFG.vectorStyleUrl) {
          return TILE_CFG.vectorStyleUrl;
        }
        return buildRasterStyle(TILE_CFG);
      }

      var mapInstance = null;
      var markerInstance = null;

      function initGl() {
        var gl = USE_MAPBOX ? window.mapboxgl : window.maplibregl;
        if (USE_MAPBOX) gl.accessToken = MAPBOX_TOKEN;

        var map = new gl.Map({
          container: 'picker-map',
          style: resolveStyle(),
          center: [INIT_LNG, INIT_LAT],
          zoom: 15.2,
          minZoom: VN_MIN_ZOOM,
          maxBounds: VN_BOUNDS,
          renderWorldCopies: false,
          pitch: 0,
          bearing: 0
        });
        mapInstance = map;

        map.on('style.load', function() {
          try {
            if (!map.getSource('hcmc-outline')) {
              map.addSource('hcmc-outline', {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: HCMC_RINGS.map(function(ring) {
                    return {
                      type: 'Feature',
                      geometry: { type: 'LineString', coordinates: ring },
                      properties: {}
                    };
                  })
                }
              });
              map.addLayer({
                id: 'hcmc-outline-line',
                type: 'line',
                source: 'hcmc-outline',
                paint: { 'line-color': '#B93815', 'line-width': 1.6, 'line-opacity': 0.55, 'line-dasharray': [4, 2] }
              });
            }
          } catch (e) {}
        });

        EXISTING.forEach(function(pt) {
          var d = document.createElement('div');
          d.className = 'shg-existing-dot';
          d.title = pt.name || '';
          new gl.Marker({ element: d, anchor: 'center' })
            .setLngLat([pt.lng, pt.lat])
            .addTo(map);
        });

        var pin = new gl.Marker({ element: createPinEl(), draggable: true, anchor: 'bottom' })
          .setLngLat([INIT_LNG, INIT_LAT])
          .addTo(map);
        markerInstance = pin;

        function emitPick(lat, lng, placeName) {
          postToHost({
            type: 'PICK',
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
            placeName: placeName || ''
          });
        }

        pin.on('dragend', function() {
          var ll = pin.getLngLat();
          emitPick(ll.lat, ll.lng, '');
        });

        map.on('click', function(e) {
          var placeName = '';
          try {
            var feats = map.queryRenderedFeatures(e.point);
            for (var i = 0; i < feats.length; i++) {
              var p = feats[i].properties || {};
              var cand = p['name_vi'] || p['name:vi'] || p.name || p['name_en'] || '';
              if (cand) { placeName = String(cand); break; }
            }
          } catch (err) {}
          pin.setLngLat([e.lngLat.lng, e.lngLat.lat]);
          emitPick(e.lngLat.lat, e.lngLat.lng, placeName);
        });

        window.__SHG_PICKER_CMD__ = function(cmd) {
          if (!cmd || !mapInstance) return;
          if (cmd.type === 'ZOOM_IN') mapInstance.zoomIn({ duration: 220 });
          if (cmd.type === 'ZOOM_OUT') mapInstance.zoomOut({ duration: 220 });
          if (cmd.type === 'SET_POS' && typeof cmd.lat === 'number' && typeof cmd.lng === 'number') {
            if (markerInstance) markerInstance.setLngLat([cmd.lng, cmd.lat]);
            mapInstance.flyTo({ center: [cmd.lng, cmd.lat], zoom: Math.max(mapInstance.getZoom(), 15.5), duration: 550 });
          }
        };

        window.addEventListener('message', function(ev) {
          try {
            var data = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
            if (!data || data.target !== 'shg-picker' || data.mapId !== MAP_ID) return;
            window.__SHG_PICKER_CMD__(data.command);
          } catch (e) {}
        });

        map.on('load', function() {
          map.resize();
          postToHost({ type: 'READY' });
        });
      }

      try {
        initGl();
      } catch (e) {
        postToHost({ type: 'READY' });
      }
    })();
  </script>
</body>
</html>`;
}

export const AdminMapPickerModal: React.FC<AdminMapPickerModalProps> = ({
  visible,
  title = 'Chọn vị trí trên bản đồ',
  initialLat,
  initialLng,
  userLocation,
  existingPoints = [],
  onConfirm,
  onClose,
}) => {
  const [pickedLat, setPickedLat] = useState<number>(initialLat);
  const [pickedLng, setPickedLng] = useState<number>(initialLng);
  const [suggestedPlace, setSuggestedPlace] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);

  const webViewRef = useRef<WebView<{}> | null>(null);
  const iframeRef = useRef<{
    contentWindow?: { postMessage: (msg: string, targetOrigin: string) => void };
  } | null>(null);

  const mapboxToken = useMemo(() => resolveMapboxAccessToken(''), []);

  const mapId = useMemo(
    () => `picker-${Math.random().toString(36).slice(2, 8)}`,
    [visible]
  );

  useEffect(() => {
    if (visible) {
      const safeLat =
        Number.isFinite(initialLat) && Math.abs(initialLat) > 1
          ? initialLat
          : userLocation[0];
      const safeLng =
        Number.isFinite(initialLng) && Math.abs(initialLng) > 1
          ? initialLng
          : userLocation[1];
      setPickedLat(Number(safeLat.toFixed(6)));
      setPickedLng(Number(safeLng.toFixed(6)));
      setSuggestedPlace('');
      setIsReady(false);
    }
  }, [visible, initialLat, initialLng, userLocation]);

  const htmlContent = useMemo(
    () =>
      buildPickerHtml(
        mapId,
        Number.isFinite(initialLat) && Math.abs(initialLat) > 1
          ? initialLat
          : userLocation[0],
        Number.isFinite(initialLng) && Math.abs(initialLng) > 1
          ? initialLng
          : userLocation[1],
        existingPoints,
        mapboxToken
      ),
    // Rebuild cleanly only when modal opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapId]
  );

  const sendCmd = useCallback(
    (command: { type: 'ZOOM_IN' | 'ZOOM_OUT' | 'SET_POS'; lat?: number; lng?: number }) => {
      if (Platform.OS === 'web') {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ target: 'shg-picker', mapId, command }),
          '*'
        );
        return;
      }
      if (webViewRef.current) {
        const lit = JSON.stringify(command);
        webViewRef.current.injectJavaScript(
          `(function(){try{if(window.__SHG_PICKER_CMD__){window.__SHG_PICKER_CMD__(${lit});}}catch(e){}})();true;`
        );
      }
    },
    [mapId]
  );

  const handleBridgeMsg = useCallback(
    (raw: unknown) => {
      let msg: PickerBridgeMsg | null = null;
      try {
        msg =
          typeof raw === 'string'
            ? (JSON.parse(raw) as PickerBridgeMsg)
            : (raw as PickerBridgeMsg);
      } catch {
        return;
      }
      if (!msg || msg.source !== 'shg-picker' || msg.mapId !== mapId) return;
      if (msg.type === 'READY') {
        setIsReady(true);
      } else if (msg.type === 'PICK') {
        setPickedLat(msg.lat);
        setPickedLng(msg.lng);
        if (msg.placeName) {
          setSuggestedPlace(msg.placeName);
        }
      }
    },
    [mapId]
  );

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const globalWin = globalThis as unknown as {
      addEventListener?: (
        ev: string,
        fn: (e: { data: unknown }) => void
      ) => void;
      removeEventListener?: (
        ev: string,
        fn: (e: { data: unknown }) => void
      ) => void;
    };
    if (!globalWin.addEventListener || !globalWin.removeEventListener) return;
    const listener = (e: { data: unknown }) => handleBridgeMsg(e.data);
    globalWin.addEventListener('message', listener);
    return () => globalWin.removeEventListener?.('message', listener);
  }, [visible, handleBridgeMsg]);

  const handleWebViewMsg = useCallback(
    (event: WebViewMessageEvent) => {
      handleBridgeMsg(event.nativeEvent.data);
    },
    [handleBridgeMsg]
  );

  const handleJumpToGps = () => {
    const lat = Number(userLocation[0].toFixed(6));
    const lng = Number(userLocation[1].toFixed(6));
    setPickedLat(lat);
    setPickedLng(lng);
    sendCmd({ type: 'SET_POS', lat, lng });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              Chạm vào bản đồ hoặc kéo ghim đỏ để chọn đúng vị trí
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={COLORS.ink} />
          </TouchableOpacity>
        </View>

        <View style={styles.mapWrap}>
          {visible &&
            (Platform.OS === 'web' ? (
              React.createElement('iframe', {
                key: mapId,
                ref: iframeRef,
                srcDoc: htmlContent,
                onLoad: () => setIsReady(true),
                title: 'Admin Map Location Picker',
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
                source={{ html: htmlContent }}
                onMessage={handleWebViewMsg}
                javaScriptEnabled
                domStorageEnabled
                style={styles.flex}
              />
            ))}

          {!isReady && (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="small" color={COLORS.accent} />
            </View>
          )}

          {/* Floating Map Controls */}
          <View style={styles.floatingControls}>
            <TouchableOpacity
              onPress={() => sendCmd({ type: 'ZOOM_IN' })}
              style={styles.ctrlBtn}
              accessibilityLabel="Phóng to"
            >
              <Plus size={17} color={COLORS.ink} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => sendCmd({ type: 'ZOOM_OUT' })}
              style={styles.ctrlBtn}
              accessibilityLabel="Thu nhỏ"
            >
              <Minus size={17} color={COLORS.ink} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleJumpToGps}
              style={styles.ctrlBtn}
              accessibilityLabel="Về vị trí hiện tại"
            >
              <LocateFixed size={17} color={COLORS.gpsBlue} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Coordinate Bar & Confirm Action */}
        <View style={styles.footer}>
          <View style={styles.coordInfo}>
            <View style={styles.coordRow}>
              <MapPin size={15} color={COLORS.accent} />
              <Text style={styles.coordText}>
                {pickedLat.toFixed(5)}, {pickedLng.toFixed(5)}
              </Text>
            </View>
            {suggestedPlace ? (
              <Text style={styles.placeHint} numberOfLines={1}>
                Gần: {suggestedPlace}
              </Text>
            ) : (
              <Text style={styles.placeHint}>
                Chấm đen là {existingPoints.length} địa điểm hiện có trên bản đồ
              </Text>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              onConfirm({
                lat: pickedLat,
                lng: pickedLng,
                suggestedPlaceName: suggestedPlace || undefined,
              })
            }
            style={styles.confirmBtn}
          >
            <Check size={16} color={COLORS.white} />
            <Text style={styles.confirmBtnText}>Chọn vị trí này</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F2F0EA',
  },
  loadingOverlay: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  floatingControls: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.lg,
    gap: SPACING.sm,
  },
  ctrlBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.floating,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  coordInfo: {
    flex: 1,
    gap: 2,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coordText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  placeHint: {
    fontSize: 11.5,
    color: COLORS.inkMuted,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: RADII.md,
    ...SHADOWS.card,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default AdminMapPickerModal;
