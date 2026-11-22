import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import {
  ArrowUp,
  Box,
  Check,
  ChevronDown,
  ChevronUp,
  CornerUpLeft,
  CornerUpRight,
  ExternalLink,
  Flag,
  Footprints,
  KeyRound,
  Layers,
  LocateFixed,
  MapPin,
  Maximize2,
  Minus,
  Moon,
  Navigation,
  Play,
  Plus,
  Star,
  Sun,
  Sunset,
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
  MAPBOX_TOKEN_STORAGE_KEY,
  MapTileConfig,
  MapboxLightPreset,
  buildOsmWalkingUrl,
  getAvailableMapStyles,
  getDefaultMapStyle,
  getTileConfig,
  isValidMapboxPublicToken,
  resolveMapboxAccessToken,
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
  is3D: boolean;
  lightPreset: MapboxLightPreset;
  selectedLanguage: SupportedLanguage;
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
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'SET_3D'; enabled: boolean }
  | { type: 'SET_LIGHT'; preset: MapboxLightPreset }
  | { type: 'FLY_TO'; lat: number; lng: number; zoom?: number };

type MapBridgeIncomingMessage =
  | { source: 'shg-map'; mapId: string; type: 'MAP_READY'; engine?: string }
  | { source: 'shg-map'; mapId: string; type: 'MAPBOX_AUTH_ERROR'; message?: string }
  | { source: 'shg-map'; mapId: string; type: 'SITE_CLICK'; siteId: string }
  | {
      source: 'shg-map';
      mapId: string;
      type: 'RESTAURANT_CLICK';
      restaurantId: string;
      siteId: string;
    }
  | {
      source: 'shg-map';
      mapId: string;
      type: 'MAP_CLICK';
      lat: number;
      lng: number;
      placeName?: string;
      placeCategory?: string;
    }
  | { source: 'shg-map'; mapId: string; type: 'USER_DRAG'; lat: number; lng: number };

/**
 * Trình dựng bản đồ hợp nhất:
 * - Khi có Mapbox Public Token (`pk.`) => chạy **Mapbox GL JS v3.7.0** (Mapbox Standard 3D, ánh sáng Ngày/Hoàng hôn/Đêm, Streets v12, Satellite Streets v12, Outdoors v12).
 * - Khi chưa có token => chạy **MapLibre GL JS + OpenStreetMap Vector 3D** (miễn phí, không cần key), kèm tự động dự phòng sang Leaflet OSM HOT nếu thiết bị thiếu WebGL.
 */
function buildExplorerMapHtml(
  mapId: string,
  initialCenter: [number, number],
  initialTile: MapTileConfig,
  mapboxToken: string
): string {
  const useMapboxEngine = Boolean(mapboxToken);
  const safeMapId = JSON.stringify(mapId);
  const safeCenter = JSON.stringify(initialCenter);
  const safeTile = JSON.stringify(initialTile);
  const safeMapboxToken = JSON.stringify(mapboxToken);

  const glCssUrl = useMapboxEngine
    ? 'https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css'
    : 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css';
  const glJsUrl = useMapboxEngine
    ? 'https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js'
    : 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="${glCssUrl}" />
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; font-family: "Times New Roman", Times, serif; }
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #F2F0EA;
      overflow: hidden;
      font-family: "Times New Roman", Times, serif;
    }
    .mapboxgl-map, .maplibregl-map, .leaflet-container {
      background: #F2F0EA;
      font-family: "Times New Roman", Times, serif !important;
    }
    .mapboxgl-ctrl-attrib, .maplibregl-ctrl-attrib {
      font-size: 9px !important;
      background: rgba(255, 255, 255, 0.8) !important;
      color: #57554F !important;
      border-radius: 6px 0 0 0;
    }
    .mapboxgl-ctrl-scale, .maplibregl-ctrl-scale {
      background: rgba(255, 255, 255, 0.9) !important;
      border: 1.5px solid #3C4043 !important;
      border-top: none !important;
      color: #202124 !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      padding: 0 5px !important;
      border-radius: 0 0 3px 3px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
    }
    .mapboxgl-ctrl-bottom-left, .maplibregl-ctrl-bottom-left {
      left: 10px !important;
      bottom: 10px !important;
    }
    @keyframes shgGpsPulse {
      0% { transform: scale(0.8); opacity: 0.78; }
      70% { transform: scale(2.35); opacity: 0; }
      100% { transform: scale(2.35); opacity: 0; }
    }
    .shg-gps-ring {
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 9999px;
      background: rgba(26, 115, 232, 0.36);
      animation: shgGpsPulse 2s ease-out infinite;
    }
    .shg-pin-badge {
      transition: transform 0.16s ease;
    }
    .shg-pin-badge:active {
      transform: scale(0.94);
    }
    .shg-dest-pulse {
      position: absolute;
      width: 26px;
      height: 26px;
      border-radius: 9999px;
      background: rgba(185, 56, 21, 0.32);
      animation: shgGpsPulse 1.8s ease-out infinite;
    }
    .custom-user-marker,
    .custom-heritage-marker,
    .custom-restaurant-marker,
    .custom-dest-marker {
      background: transparent !important;
      border: none !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="${glJsUrl}"></script>
  <script>
    (function() {
      var MAP_ID = ${safeMapId};
      var INITIAL_CENTER = ${safeCenter}; // [lat, lng]
      var INITIAL_TILE = ${safeTile};
      var MAPBOX_TOKEN = ${safeMapboxToken};
      var USE_MAPBOX = Boolean(MAPBOX_TOKEN);

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

      function expandSubdomainUrls(template, subdomains) {
        if (!template) return [];
        if (template.indexOf('{s}') === -1) return [template];
        return (subdomains || 'abc').split('').map(function(s) {
          return template.replace('{s}', s);
        });
      }

      function createCircleGeoJson(centerLngLat, radiusMeters, steps) {
        var count = steps || 64;
        var coords = [];
        var km = radiusMeters / 1000;
        var distanceX = km / (111.320 * Math.cos((centerLngLat[1] * Math.PI) / 180));
        var distanceY = km / 110.574;
        for (var i = 0; i <= count; i++) {
          var theta = (i / count) * (2 * Math.PI);
          coords.push([
            centerLngLat[0] + distanceX * Math.cos(theta),
            centerLngLat[1] + distanceY * Math.sin(theta)
          ]);
        }
        return {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [coords] },
            properties: {}
          }]
        };
      }

      function buildRasterStyleJson(tileCfg) {
        var sources = {
          'osm-raster': {
            type: 'raster',
            tiles: expandSubdomainUrls(tileCfg.url, tileCfg.subdomains),
            tileSize: 256,
            maxzoom: tileCfg.maxZoom || 19,
            attribution: tileCfg.attribution || ''
          }
        };
        var layers = [{
          id: 'osm-raster-layer',
          type: 'raster',
          source: 'osm-raster',
          minzoom: 0,
          maxzoom: 22
        }];
        if (tileCfg.renderMode === 'hybrid' && tileCfg.overlayUrl) {
          sources['hybrid-labels'] = {
            type: 'raster',
            tiles: expandSubdomainUrls(tileCfg.overlayUrl, 'abc'),
            tileSize: 256,
            maxzoom: 19
          };
          layers.push({
            id: 'hybrid-labels-layer',
            type: 'raster',
            source: 'hybrid-labels',
            minzoom: 0,
            maxzoom: 22,
            paint: { 'raster-opacity': 0.96 }
          });
        }
        return { version: 8, sources: sources, layers: layers };
      }

      function resolveGlStyle(tileCfg) {
        if (USE_MAPBOX && tileCfg.renderMode === 'mapbox' && tileCfg.mapboxStyleUrl) {
          return tileCfg.mapboxStyleUrl;
        }
        if (tileCfg.renderMode === 'vector' && tileCfg.vectorStyleUrl) {
          return tileCfg.vectorStyleUrl;
        }
        return buildRasterStyleJson(tileCfg);
      }

      function createSiteMarkerElement(site) {
        var el = document.createElement('div');
        el.style.cursor = 'pointer';
        el.style.zIndex = site.isSelected ? '30' : '10';
        var borderColor = site.isSelected ? '#B93815' : (site.isVisited ? '#047857' : '#141413');
        var badgeText = site.isVisited ? '✓' : String(site.index);

        if (site.isSelected) {
          var shortLabel = site.label.length > 18 ? site.label.slice(0, 16) + '…' : site.label;
          el.innerHTML = '<div class="shg-pin-badge" style="display:inline-flex;flex-direction:column;align-items:center;user-select:none;">'
            + '<div style="display:inline-flex;align-items:center;gap:6px;padding:3px 9px 3px 3px;border-radius:999px;background:#FFFFFF;border:2px solid #B93815;box-shadow:0 8px 22px rgba(20,20,19,0.28);">'
            + '<div style="width:24px;height:24px;border-radius:999px;overflow:hidden;flex-shrink:0;background:#F3F1EC;">'
            + '<img src="' + escapeHtml(site.coverImage) + '" alt="" style="width:24px;height:24px;object-fit:cover;display:block;" />'
            + '</div>'
            + '<span style="font-size:11.5px;font-weight:700;color:#141413;white-space:nowrap;">'
            + escapeHtml(shortLabel)
            + '</span>'
            + '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#B93815;color:#FFFFFF;font-size:9.5px;font-weight:700;">'
            + badgeText
            + '</span>'
            + '</div>'
            + '<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #B93815;margin-top:-1px;"></div>'
            + '</div>';
        } else {
          el.innerHTML = '<div class="shg-pin-badge" style="position:relative;width:36px;height:36px;border-radius:999px;background:#FFFFFF;border:2.5px solid ' + (site.isVisited ? '#047857' : '#FFFFFF') + ';box-shadow:0 4px 14px rgba(20,20,19,0.28);user-select:none;">'
            + '<div style="width:100%;height:100%;border-radius:999px;overflow:hidden;background:#F3F1EC;">'
            + '<img src="' + escapeHtml(site.coverImage) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />'
            + '</div>'
            + '<span style="position:absolute;top:-4px;right:-4px;display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 3px;border-radius:999px;background:' + borderColor + ';color:#FFFFFF;border:1.5px solid #FFFFFF;font-size:9px;font-weight:700;line-height:1;">'
            + badgeText
            + '</span>'
            + '</div>';
        }
        return el;
      }

      function createRestaurantMarkerElement(res) {
        var el = document.createElement('div');
        el.style.cursor = 'pointer';
        el.innerHTML = '<div class="shg-pin-badge" style="display:inline-flex;align-items:center;gap:3px;padding:3px 7px;border-radius:999px;background:#141413;color:#FFFFFF;border:1.5px solid #FFFFFF;box-shadow:0 4px 10px rgba(0,0,0,0.26);font-size:10px;font-weight:700;white-space:nowrap;">'
          + '<span style="color:#FBBF24;">★</span>'
          + '<span>' + Number(res.rating).toFixed(1) + '</span>'
          + '</div>';
        return el;
      }

      function createUserMarkerElement() {
        var el = document.createElement('div');
        el.style.position = 'relative';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.cursor = 'grab';
        el.innerHTML = '<span class="shg-gps-ring"></span>'
          + '<span style="position:relative;width:16px;height:16px;border-radius:9999px;background:#1A73E8;border:3px solid #FFFFFF;box-shadow:0 3px 12px rgba(26,115,232,0.55);"></span>';
        return el;
      }

      function createDestMarkerElement() {
        var el = document.createElement('div');
        el.style.position = 'relative';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.width = '28px';
        el.style.height = '28px';
        el.innerHTML = '<span class="shg-dest-pulse"></span>'
          + '<span style="position:relative;width:16px;height:16px;border-radius:9999px;background:#B93815;border:3px solid #FFFFFF;box-shadow:0 3px 10px rgba(185,56,21,0.55);"></span>';
        return el;
      }

      function applyMapboxOrOsmEnhancements(map, tileCfg, is3D, lightPreset) {
        // 1. Mapbox Standard 3D (v3): cấu hình ánh sáng Ngày/Hoàng hôn/Đêm + hiển thị nhãn POI & 3D
        if (USE_MAPBOX && tileCfg.id === 'mapbox_standard') {
          try {
            map.setConfigProperty('basemap', 'lightPreset', lightPreset || 'day');
            map.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
            map.setConfigProperty('basemap', 'showRoadLabels', true);
            map.setConfigProperty('basemap', 'showTransitLabels', true);
            map.setConfigProperty('basemap', 'show3dObjects', is3D);
          } catch (e) {}
          return;
        }

        // 2. Mapbox Streets / Outdoors / Satellite v12: thêm lớp 3D building extrusion từ composite source
        if (USE_MAPBOX && tileCfg.renderMode === 'mapbox') {
          try {
            if (is3D && map.getSource('composite') && !map.getLayer('shg-mapbox-3d-buildings')) {
              var layers = (map.getStyle() && map.getStyle().layers) || [];
              var labelLayerId = undefined;
              for (var i = 0; i < layers.length; i++) {
                if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
                  labelLayerId = layers[i].id;
                  break;
                }
              }
              map.addLayer({
                id: 'shg-mapbox-3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 14.5,
                paint: {
                  'fill-extrusion-color': [
                    'interpolate', ['linear'],
                    ['coalesce', ['get', 'height'], 10],
                    0, '#EAE6DF',
                    25, '#DDD7CC',
                    80, '#CFC7B9'
                  ],
                  'fill-extrusion-height': ['get', 'height'],
                  'fill-extrusion-base': ['get', 'min_height'],
                  'fill-extrusion-opacity': 0.82
                }
              }, labelLayerId);
            } else if (map.getLayer('shg-mapbox-3d-buildings')) {
              map.setLayoutProperty('shg-mapbox-3d-buildings', 'visibility', is3D ? 'visible' : 'none');
            }
          } catch (e) {}
          return;
        }

        // 3. OpenStreetMap Vector 3D (OpenFreeMap) — bảng màu Google Maps
        if (tileCfg.renderMode !== 'vector') return;
        var style = map.getStyle();
        if (!style || !Array.isArray(style.layers)) return;

        var setPaint = function(id, prop, val) {
          try { if (map.getLayer(id)) map.setPaintProperty(id, prop, val); } catch (e) {}
        };
        var setLayout = function(id, prop, val) {
          try { if (map.getLayer(id)) map.setLayoutProperty(id, prop, val); } catch (e) {}
        };

        if (tileCfg.googleLikePalette) {
          setPaint('background', 'background-color', '#F1F3F4');
          setPaint('water', 'fill-color', '#AADAFF');
          setPaint('waterway_river', 'line-color', '#94CCF9');
          setPaint('waterway_other', 'line-color', '#AADAFF');
          setPaint('park', 'fill-color', '#C8E6C9');
          setPaint('park_outline', 'line-color', '#A5D6A7');
          setPaint('landcover_wood', 'fill-color', '#CBE8C6');
          setPaint('landcover_grass', 'fill-color', '#D5ECD2');
          setPaint('landuse_residential', 'fill-color', '#ECEFF1');
          setPaint('landuse_commercial_area', 'fill-color', '#F5EFE6');
          setPaint('landuse_hospital', 'fill-color', '#FDE8E8');
          setPaint('landuse_school', 'fill-color', '#FEF7E0');
          setPaint('road_motorway_casing', 'line-color', '#E2A24B');
          setPaint('road_motorway', 'line-color', '#FCD6A4');
          setPaint('road_trunk_primary_casing', 'line-color', '#DFC066');
          setPaint('road_trunk_primary', 'line-color', '#FFE89E');
          setPaint('road_secondary_tertiary_casing', 'line-color', '#D1D7E0');
          setPaint('road_secondary_tertiary', 'line-color', '#FFFFFF');
          setPaint('road_minor_casing', 'line-color', '#DCE1E8');
          setPaint('road_minor', 'line-color', '#FFFFFF');
          setPaint('road_service_track_casing', 'line-color', '#E4E8EE');
          setPaint('road_service_track', 'line-color', '#FAFBFD');
          setPaint('road_path_pedestrian', 'line-color', '#E8DEC8');
          setPaint('building', 'fill-color', '#E8EAED');
          setPaint('building', 'fill-outline-color', '#D5D9DF');
        }

        if (map.getLayer('building-3d')) {
          setLayout('building-3d', 'visibility', is3D ? 'visible' : 'none');
          setPaint('building-3d', 'fill-extrusion-color', [
            'interpolate', ['linear'],
            ['coalesce', ['get', 'render_height'], 10],
            0, '#EAE6DF',
            18, '#E0DBD1',
            45, '#D4CEC2',
            120, '#C8C0B2'
          ]);
          setPaint('building-3d', 'fill-extrusion-opacity', 0.9);
          setPaint('building-3d', 'fill-extrusion-vertical-gradient', true);
        }
      }

      function initGlMap() {
        var gl = USE_MAPBOX ? window.mapboxgl : window.maplibregl;
        if (USE_MAPBOX) {
          gl.accessToken = MAPBOX_TOKEN;
        }

        var currentTile = INITIAL_TILE;
        var currentStyleId = INITIAL_TILE.id;
        var is3DEnabled = true;
        var currentLightPreset = 'day';
        var prevUserCenter = INITIAL_CENTER;
        var lastSitesSignature = '';
        var lastRouteKey = '';
        var lastKnownSites = [];
        var lastKnownUser = INITIAL_CENTER;
        var lastRadiusMeters = 0;
        var lastRouteData = null;
        var styleReady = false;

        var userMarker = null;
        var destMarker = null;
        var siteMarkers = [];
        var restaurantMarkers = [];

        var map = new gl.Map({
          container: 'map',
          style: resolveGlStyle(INITIAL_TILE),
          center: [INITIAL_CENTER[1], INITIAL_CENTER[0]],
          zoom: 15.6,
          pitch: 45,
          bearing: -12,
          maxPitch: 70,
          antialias: true,
          attributionControl: true
        });

        map.addControl(new gl.ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-left');

        function ensureCustomOverlayLayers() {
          var slotProps = (USE_MAPBOX && currentTile.id === 'mapbox_standard') ? { slot: 'middle' } : {};

          if (!map.getSource('shg-radius')) {
            map.addSource('shg-radius', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] }
            });
            map.addLayer(Object.assign({
              id: 'shg-radius-fill',
              type: 'fill',
              source: 'shg-radius',
              paint: {
                'fill-color': '#1A73E8',
                'fill-opacity': 0.06
              }
            }, slotProps));
            map.addLayer(Object.assign({
              id: 'shg-radius-line',
              type: 'line',
              source: 'shg-radius',
              paint: {
                'line-color': '#1A73E8',
                'line-width': 1.5,
                'line-dasharray': [4, 4],
                'line-opacity': 0.65
              }
            }, slotProps));
          }

          if (!map.getSource('shg-route')) {
            map.addSource('shg-route', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] }
            });
            map.addLayer(Object.assign({
              id: 'shg-route-casing',
              type: 'line',
              source: 'shg-route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#FFFFFF',
                'line-width': 10,
                'line-opacity': 0.96
              }
            }, slotProps));
            map.addLayer(Object.assign({
              id: 'shg-route-core',
              type: 'line',
              source: 'shg-route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#1A73E8',
                'line-width': 5.5,
                'line-opacity': 0.96
              }
            }, slotProps));
            map.addLayer(Object.assign({
              id: 'shg-route-dashes',
              type: 'line',
              source: 'shg-route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#DCEBFF',
                'line-width': 2.2,
                'line-dasharray': [0.5, 2.8],
                'line-opacity': 0.95
              }
            }, slotProps));
          }
        }

        function syncRadiusLayer(coords, radiusMeters) {
          lastRadiusMeters = radiusMeters || 0;
          if (!styleReady || !map.getSource('shg-radius')) return;
          if (lastRadiusMeters > 0 && lastRadiusMeters <= 25000) {
            map.getSource('shg-radius').setData(
              createCircleGeoJson([coords[1], coords[0]], lastRadiusMeters, 64)
            );
          } else {
            map.getSource('shg-radius').setData({ type: 'FeatureCollection', features: [] });
          }
        }

        function syncRouteLayer(route, shouldFit) {
          lastRouteData = route || null;
          if (!styleReady || !map.getSource('shg-route')) return;

          if (destMarker) {
            destMarker.remove();
            destMarker = null;
          }

          if (!route || !Array.isArray(route.coordinates) || route.coordinates.length < 2) {
            map.getSource('shg-route').setData({ type: 'FeatureCollection', features: [] });
            return;
          }

          var lngLatCoords = route.coordinates.map(function(pt) {
            return [pt[1], pt[0]];
          });

          map.getSource('shg-route').setData({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: lngLatCoords },
              properties: {}
            }]
          });

          if (route.destination) {
            destMarker = new gl.Marker({
              element: createDestMarkerElement(),
              anchor: 'center'
            })
              .setLngLat([route.destination[1], route.destination[0]])
              .addTo(map);
          }

          if (shouldFit) {
            try {
              var bounds = new gl.LngLatBounds(lngLatCoords[0], lngLatCoords[0]);
              lngLatCoords.forEach(function(c) { bounds.extend(c); });
              map.fitBounds(bounds, {
                padding: { top: 76, bottom: 220, left: 44, right: 56 },
                maxZoom: 16.5,
                duration: 700
              });
            } catch (e) {}
          }
        }

        function ensureUserMarker(coords) {
          if (!userMarker) {
            userMarker = new gl.Marker({
              element: createUserMarkerElement(),
              draggable: true,
              anchor: 'center'
            })
              .setLngLat([coords[1], coords[0]])
              .addTo(map);

            userMarker.on('dragend', function() {
              var ll = userMarker.getLngLat();
              postToHost({ type: 'USER_DRAG', lat: ll.lat, lng: ll.lng });
            });
          } else {
            userMarker.setLngLat([coords[1], coords[0]]);
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

          siteMarkers.forEach(function(m) { m.remove(); });
          siteMarkers = [];
          restaurantMarkers.forEach(function(m) { m.remove(); });
          restaurantMarkers = [];

          sites.forEach(function(site) {
            var el = createSiteMarkerElement(site);
            el.addEventListener('click', function(ev) {
              ev.stopPropagation();
              postToHost({ type: 'SITE_CLICK', siteId: site.id });
              map.easeTo({
                center: [site.lng, site.lat],
                zoom: Math.max(map.getZoom(), 15.8),
                duration: 550
              });
            });

            var m = new gl.Marker({
              element: el,
              anchor: site.isSelected ? 'bottom' : 'center'
            })
              .setLngLat([site.lng, site.lat])
              .addTo(map);
            siteMarkers.push(m);

            if (showRestaurants && Array.isArray(site.restaurants)) {
              site.restaurants.forEach(function(res) {
                var rEl = createRestaurantMarkerElement(res);
                rEl.addEventListener('click', function(ev) {
                  ev.stopPropagation();
                  postToHost({
                    type: 'RESTAURANT_CLICK',
                    restaurantId: res.id,
                    siteId: site.id
                  });
                  map.easeTo({
                    center: [res.lng, res.lat],
                    zoom: Math.max(map.getZoom(), 16.5),
                    duration: 500
                  });
                });

                var rm = new gl.Marker({ element: rEl, anchor: 'center' })
                  .setLngLat([res.lng, res.lat])
                  .addTo(map);
                restaurantMarkers.push(rm);
              });
            }
          });
        }

        function setTileConfig(cfg) {
          if (!cfg || currentStyleId === cfg.id) return;
          currentStyleId = cfg.id;
          currentTile = cfg;
          styleReady = false;

          var is3DCapable = cfg.renderMode === 'mapbox' || cfg.renderMode === 'vector';
          if (!is3DCapable) {
            map.easeTo({ pitch: 0, bearing: 0, duration: 400 });
          } else if (is3DEnabled) {
            map.easeTo({ pitch: 45, duration: 450 });
          }

          map.setStyle(resolveGlStyle(cfg));
        }

        map.on('style.load', function() {
          styleReady = true;
          applyMapboxOrOsmEnhancements(map, currentTile, is3DEnabled, currentLightPreset);
          ensureCustomOverlayLayers();
          syncRadiusLayer(lastKnownUser, lastRadiusMeters);
          syncRouteLayer(lastRouteData, false);
        });

        var fallbackTriggered = false;
        map.on('error', function(e) {
          var status = e && e.error && e.error.status;
          var msg = (e && e.error && e.error.message) ? String(e.error.message) : '';
          if (USE_MAPBOX && (status === 401 || status === 403 || msg.indexOf('Unauthorized') !== -1 || msg.indexOf('access token') !== -1)) {
            if (!fallbackTriggered) {
              fallbackTriggered = true;
              postToHost({
                type: 'MAPBOX_AUTH_ERROR',
                message: 'Mapbox Access Token không hợp lệ hoặc đã hết hạn. Đã tự động chuyển sang bản đồ OSM 3D.'
              });
              currentTile = Object.assign({}, currentTile, { renderMode: 'raster' });
              map.setStyle(buildRasterStyleJson(currentTile));
            }
            return;
          }
          if (!fallbackTriggered && currentTile.renderMode === 'vector' && (msg.indexOf('openfreemap') !== -1 || msg.indexOf('Failed to fetch') !== -1)) {
            fallbackTriggered = true;
            currentTile = Object.assign({}, currentTile, { renderMode: 'raster' });
            map.setStyle(buildRasterStyleJson(currentTile));
          }
        });

        map.on('click', function(e) {
          var placeName = '';
          var placeCategory = '';
          try {
            var feats = map.queryRenderedFeatures(e.point);
            for (var i = 0; i < feats.length; i++) {
              var props = feats[i].properties || {};
              var candidate = props['name_vi'] || props['name:vi'] || props.name || props['name_en'] || '';
              if (candidate) {
                placeName = String(candidate);
                placeCategory = String(props.category_en || props.subclass || props.class || '');
                break;
              }
            }
          } catch (err) {}

          postToHost({
            type: 'MAP_CLICK',
            lat: e.lngLat.lat,
            lng: e.lngLat.lng,
            placeName: placeName,
            placeCategory: placeCategory
          });
        });

        window.__SHG_UPDATE__ = function(state) {
          if (!state) return;
          if (state.lightPreset && state.lightPreset !== currentLightPreset) {
            currentLightPreset = state.lightPreset;
            if (styleReady && USE_MAPBOX && currentTile.id === 'mapbox_standard') {
              try { map.setConfigProperty('basemap', 'lightPreset', currentLightPreset); } catch (e) {}
            }
          }
          if (typeof state.is3D === 'boolean' && state.is3D !== is3DEnabled) {
            is3DEnabled = state.is3D;
            if (styleReady) {
              applyMapboxOrOsmEnhancements(map, currentTile, is3DEnabled, currentLightPreset);
              map.easeTo({
                pitch: is3DEnabled ? 48 : 0,
                bearing: is3DEnabled ? -14 : 0,
                duration: 500
              });
            }
          }
          if (state.tileConfig) {
            setTileConfig(state.tileConfig);
          }
          if (Array.isArray(state.userLocation) && state.userLocation.length === 2) {
            lastKnownUser = state.userLocation;
            ensureUserMarker(state.userLocation);
            syncRadiusLayer(state.userLocation, state.searchRadiusMeters || 0);

            var latDiff = Math.abs(prevUserCenter[0] - state.userLocation[0]);
            var lngDiff = Math.abs(prevUserCenter[1] - state.userLocation[1]);
            if (latDiff > 0.012 || lngDiff > 0.012) {
              map.flyTo({
                center: [state.userLocation[1], state.userLocation[0]],
                zoom: 15.6,
                duration: 850
              });
            }
            prevUserCenter = state.userLocation;
          }
          if (Array.isArray(state.sites)) {
            lastKnownSites = state.sites;
            renderSites(state.sites, !!state.showRestaurants);
          }
          var nextKey = state.route ? state.route.key : '';
          if (nextKey !== lastRouteKey) {
            lastRouteKey = nextKey;
            syncRouteLayer(state.route || null, true);
          }
        };

        window.__SHG_CMD__ = function(cmd) {
          if (!cmd || !cmd.type) return;
          if (cmd.type === 'FIT_ALL') {
            var pts = [[lastKnownUser[1], lastKnownUser[0]]];
            lastKnownSites.forEach(function(s) { pts.push([s.lng, s.lat]); });
            if (pts.length > 1) {
              var b = new gl.LngLatBounds(pts[0], pts[0]);
              pts.forEach(function(p) { b.extend(p); });
              map.fitBounds(b, {
                padding: { top: 64, bottom: 110, left: 36, right: 56 },
                maxZoom: 15.5,
                duration: 650
              });
            } else {
              map.flyTo({ center: [lastKnownUser[1], lastKnownUser[0]], zoom: 15.5, duration: 600 });
            }
          } else if (cmd.type === 'CENTER_USER') {
            map.flyTo({
              center: [lastKnownUser[1], lastKnownUser[0]],
              zoom: 16.5,
              pitch: is3DEnabled ? 48 : 0,
              duration: 650
            });
          } else if (cmd.type === 'ZOOM_IN') {
            map.zoomIn({ duration: 260 });
          } else if (cmd.type === 'ZOOM_OUT') {
            map.zoomOut({ duration: 260 });
          } else if (cmd.type === 'SET_3D') {
            is3DEnabled = !!cmd.enabled;
            if (styleReady) {
              applyMapboxOrOsmEnhancements(map, currentTile, is3DEnabled, currentLightPreset);
            }
            map.easeTo({
              pitch: is3DEnabled ? 50 : 0,
              bearing: is3DEnabled ? -14 : 0,
              duration: 500
            });
          } else if (cmd.type === 'SET_LIGHT' && cmd.preset) {
            currentLightPreset = cmd.preset;
            if (styleReady && USE_MAPBOX && currentTile.id === 'mapbox_standard') {
              try { map.setConfigProperty('basemap', 'lightPreset', currentLightPreset); } catch (e) {}
            }
          } else if (cmd.type === 'FLY_TO' && typeof cmd.lat === 'number' && typeof cmd.lng === 'number') {
            map.flyTo({ center: [cmd.lng, cmd.lat], zoom: cmd.zoom || 16, duration: 650 });
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

        map.on('load', function() {
          map.resize();
          postToHost({ type: 'MAP_READY', engine: USE_MAPBOX ? 'mapbox-gl-v3' : 'maplibre-osm-3d' });
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
          var map = L.map('map', { center: INITIAL_CENTER, zoom: 15, zoomControl: false });
          var tileLayer = L.tileLayer(INITIAL_TILE.url, {
            subdomains: INITIAL_TILE.subdomains || 'abc',
            attribution: INITIAL_TILE.attribution || '',
            maxZoom: 19
          }).addTo(map);
          var sitesLayer = L.layerGroup().addTo(map);
          var routeLayer = L.layerGroup().addTo(map);
          var userLayer = L.layerGroup().addTo(map);
          var userMarker = null;
          var lastKnownUser = INITIAL_CENTER;
          var lastKnownSites = [];

          map.on('click', function(e) {
            postToHost({ type: 'MAP_CLICK', lat: e.latlng.lat, lng: e.latlng.lng });
          });

          window.__SHG_UPDATE__ = function(state) {
            if (!state) return;
            if (state.tileConfig && state.tileConfig.url) {
              map.removeLayer(tileLayer);
              tileLayer = L.tileLayer(state.tileConfig.url, {
                subdomains: state.tileConfig.subdomains || 'abc',
                maxZoom: 19
              }).addTo(map);
            }
            if (Array.isArray(state.userLocation)) {
              lastKnownUser = state.userLocation;
              if (!userMarker) {
                userMarker = L.marker(state.userLocation, {
                  draggable: true,
                  icon: L.divIcon({
                    className: 'custom-user-marker',
                    html: createUserMarkerElement().outerHTML,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                  })
                }).addTo(userLayer);
                userMarker.on('dragend', function() {
                  var p = userMarker.getLatLng();
                  postToHost({ type: 'USER_DRAG', lat: p.lat, lng: p.lng });
                });
              } else {
                userMarker.setLatLng(state.userLocation);
              }
            }
            if (Array.isArray(state.sites)) {
              lastKnownSites = state.sites;
              sitesLayer.clearLayers();
              state.sites.forEach(function(site) {
                var m = L.marker([site.lat, site.lng], {
                  icon: L.divIcon({
                    className: 'custom-heritage-marker',
                    html: createSiteMarkerElement(site).outerHTML,
                    iconSize: site.isSelected ? [188, 40] : [36, 36],
                    iconAnchor: site.isSelected ? [94, 40] : [18, 18]
                  })
                }).addTo(sitesLayer);
                m.on('click', function(ev) {
                  L.DomEvent.stopPropagation(ev);
                  postToHost({ type: 'SITE_CLICK', siteId: site.id });
                });
              });
            }
            routeLayer.clearLayers();
            if (state.route && Array.isArray(state.route.coordinates) && state.route.coordinates.length > 1) {
              L.polyline(state.route.coordinates, { color: '#FFFFFF', weight: 9 }).addTo(routeLayer);
              L.polyline(state.route.coordinates, { color: '#1A73E8', weight: 5 }).addTo(routeLayer);
            }
          };

          window.__SHG_CMD__ = function(cmd) {
            if (!cmd) return;
            if (cmd.type === 'CENTER_USER') map.flyTo(lastKnownUser, 16);
            if (cmd.type === 'ZOOM_IN') map.zoomIn();
            if (cmd.type === 'ZOOM_OUT') map.zoomOut();
            if (cmd.type === 'FIT_ALL') {
              var pts = [lastKnownUser].concat(lastKnownSites.map(function(s) { return [s.lat, s.lng]; }));
              if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [36, 60] });
            }
          };

          window.addEventListener('message', function(event) {
            try {
              var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              if (!data || data.target !== 'shg-map' || data.mapId !== MAP_ID) return;
              if (data.type === 'UPDATE_STATE') window.__SHG_UPDATE__(data.payload);
              if (data.type === 'CMD') window.__SHG_CMD__(data.command);
            } catch (err) {}
          });

          setTimeout(function() {
            map.invalidateSize();
            postToHost({ type: 'MAP_READY', engine: 'leaflet-osm-fallback' });
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

      function boot() {
        if (!hasWebGL()) {
          initLeafletFallback();
          return;
        }
        var targetGlobal = USE_MAPBOX ? window.mapboxgl : window.maplibregl;
        if (typeof targetGlobal === 'undefined') {
          if (!USE_MAPBOX) {
            var fallback = document.createElement('script');
            fallback.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
            fallback.onload = function() {
              if (typeof window.maplibregl !== 'undefined') initGlMap();
              else initLeafletFallback();
            };
            fallback.onerror = initLeafletFallback;
            document.head.appendChild(fallback);
          } else {
            initLeafletFallback();
          }
          return;
        }
        try {
          initGlMap();
        } catch (err) {
          initLeafletFallback();
        }
      }

      boot();
    })();
  </script>
</body>
</html>`;
}

function renderStepIcon(maneuverType: RouteStep['maneuverType']) {
  switch (maneuverType) {
    case 'turn-left':
      return <CornerUpLeft size={14} color={COLORS.gpsBlue} />;
    case 'turn-right':
      return <CornerUpRight size={14} color={COLORS.gpsBlue} />;
    case 'arrive':
      return <Flag size={14} color={COLORS.visited} />;
    case 'depart':
      return <Navigation size={14} color={COLORS.gpsBlue} />;
    default:
      return <ArrowUp size={14} color={COLORS.gpsBlue} />;
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
  const [runtimeMapboxToken, setRuntimeMapboxToken] = useState<string>('');
  const [tokenLoaded, setTokenLoaded] = useState<boolean>(false);
  const [showTokenModal, setShowTokenModal] = useState<boolean>(false);
  const [tokenDraft, setTokenDraft] = useState<string>('');
  const [tokenError, setTokenError] = useState<string | null>(null);

  const activeMapboxToken = useMemo(
    () => resolveMapboxAccessToken(runtimeMapboxToken),
    [runtimeMapboxToken]
  );
  const isMapboxActive = Boolean(activeMapboxToken);

  const availableStyles = useMemo(
    () => getAvailableMapStyles(activeMapboxToken),
    [activeMapboxToken]
  );

  const [mapStyle, setMapStyle] = useState<BaseMapStyle>(() =>
    getDefaultMapStyle()
  );
  const [is3DView, setIs3DView] = useState<boolean>(true);
  const [lightPreset, setLightPreset] = useState<MapboxLightPreset>('day');
  const [showRestaurantsOnMap, setShowRestaurantsOnMap] =
    useState<boolean>(false);
  const [showStyleMenu, setShowStyleMenu] = useState<boolean>(false);
  const [tappedPlace, setTappedPlace] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [focusedSite, setFocusedSite] = useState<HeritageSite | null>(null);
  const [focusedRestaurant, setFocusedRestaurant] = useState<{
    restaurant: NearbyRestaurant;
    parentSite: HeritageSite;
  } | null>(null);
  const [stepsExpanded, setStepsExpanded] = useState<boolean>(false);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  // Load saved Mapbox token from AsyncStorage (if user entered it in-app)
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(MAPBOX_TOKEN_STORAGE_KEY)
      .then((saved) => {
        if (!mounted) return;
        if (saved && isValidMapboxPublicToken(saved)) {
          setRuntimeMapboxToken(saved.trim());
          setMapStyle('mapbox_standard');
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

  // Unique mapId per engine mode so iframe/WebView cleanly reboots when switching between OSM & Mapbox GL JS
  const mapId = useMemo(
    () =>
      `explorer-${isMapboxActive ? 'mbx' : 'osm'}-${Math.random().toString(36).slice(2, 8)}`,
    [isMapboxActive, activeMapboxToken]
  );

  useEffect(() => {
    setIsMapReady(false);
  }, [mapId]);

  const webViewRef = useRef<WebView<{}> | null>(null);
  const iframeRef = useRef<{
    contentWindow?: { postMessage: (msg: string, targetOrigin: string) => void };
  } | null>(null);
  const latestPayloadRef = useRef<MapStatePayload | null>(null);

  const initialHtml = useMemo(
    () =>
      buildExplorerMapHtml(
        mapId,
        userLocation,
        getTileConfig(getDefaultMapStyle(activeMapboxToken)),
        activeMapboxToken
      ),
    // Keep static HTML shell per mapId so map never reloads on minor prop updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapId]
  );

  useEffect(() => {
    if (activeRoute) {
      setFocusedSite(null);
      setFocusedRestaurant(null);
      setTappedPlace(null);
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

  const currentTileConfig = useMemo(() => {
    const cfg = getTileConfig(mapStyle);
    if (cfg.requiresMapboxToken && !isMapboxActive) {
      return getTileConfig('osm_3d');
    }
    return cfg;
  }, [mapStyle, isMapboxActive]);

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
      tileConfig: currentTileConfig,
      is3D: is3DView,
      lightPreset,
      selectedLanguage,
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
    currentTileConfig,
    is3DView,
    lightPreset,
    selectedLanguage,
    userLocation,
    searchRadiusMeters,
    sites,
    visitedRecords,
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
        case 'MAPBOX_AUTH_ERROR':
          setTokenError(
            msg.message ||
              'Mapbox Token không hợp lệ. Vui lòng kiểm tra lại token bắt đầu bằng pk.'
          );
          break;
        case 'SITE_CLICK': {
          const matched = sites.find((s) => s.id === msg.siteId);
          if (matched) {
            setShowStyleMenu(false);
            setTappedPlace(null);
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
            setShowStyleMenu(false);
            setTappedPlace(null);
            setFocusedSite(null);
            setFocusedRestaurant({ restaurant, parentSite });
          }
          break;
        }
        case 'MAP_CLICK':
          setShowStyleMenu(false);
          setFocusedSite(null);
          setFocusedRestaurant(null);
          if (msg.placeName) {
            setTappedPlace({
              name: msg.placeName,
              lat: msg.lat,
              lng: msg.lng,
            });
          } else {
            setTappedPlace(null);
          }
          onMoveUserLocation(msg.lat, msg.lng);
          break;
        case 'USER_DRAG':
          setTappedPlace(null);
          onMoveUserLocation(msg.lat, msg.lng);
          break;
      }
    },
    [mapId, sites, onMoveUserLocation]
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

  const handleZoomIn = useCallback(() => {
    sendToMap({ type: 'CMD', command: { type: 'ZOOM_IN' } });
  }, [sendToMap]);

  const handleZoomOut = useCallback(() => {
    sendToMap({ type: 'CMD', command: { type: 'ZOOM_OUT' } });
  }, [sendToMap]);

  const handleToggle3D = useCallback(() => {
    setIs3DView((prev) => {
      const next = !prev;
      sendToMap({ type: 'CMD', command: { type: 'SET_3D', enabled: next } });
      return next;
    });
  }, [sendToMap]);

  const handleCycleLightPreset = useCallback(() => {
    const order: MapboxLightPreset[] = ['day', 'dusk', 'night'];
    setLightPreset((prev) => {
      const next = order[(order.indexOf(prev) + 1) % order.length];
      sendToMap({ type: 'CMD', command: { type: 'SET_LIGHT', preset: next } });
      return next;
    });
  }, [sendToMap]);

  const handleOpenTokenModal = useCallback(() => {
    setShowStyleMenu(false);
    setTokenDraft(runtimeMapboxToken);
    setTokenError(null);
    setShowTokenModal(true);
  }, [runtimeMapboxToken]);

  const handleSaveMapboxToken = useCallback(async () => {
    const clean = tokenDraft.trim();
    if (!clean) {
      await AsyncStorage.removeItem(MAPBOX_TOKEN_STORAGE_KEY).catch(() => {});
      setRuntimeMapboxToken('');
      setMapStyle(getDefaultMapStyle(''));
      setTokenError(null);
      setShowTokenModal(false);
      return;
    }
    if (!isValidMapboxPublicToken(clean)) {
      setTokenError('Token Mapbox công khai phải bắt đầu bằng "pk." (Public Token).');
      return;
    }
    await AsyncStorage.setItem(MAPBOX_TOKEN_STORAGE_KEY, clean).catch(() => {});
    setRuntimeMapboxToken(clean);
    setMapStyle('mapbox_standard');
    setTokenError(null);
    setShowTokenModal(false);
  }, [tokenDraft]);

  const handleOpenExternalOsmMaps = useCallback(() => {
    if (!activeRoute) return;
    const url = buildOsmWalkingUrl(userLocation, activeRoute.destination);
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

  const is3DCapable =
    currentTileConfig.renderMode === 'mapbox' ||
    currentTileConfig.renderMode === 'vector';
  const showLightButton =
    isMapboxActive && currentTileConfig.supportsLightPreset;

  return (
    <View style={styles.root}>
      {/* Interactive Mapbox GL JS v3 / OpenStreetMap 3D Surface */}
      <View style={styles.mapSurface}>
        {tokenLoaded ? (
          Platform.OS === 'web' ? (
            React.createElement('iframe', {
              key: mapId,
              ref: iframeRef,
              srcDoc: initialHtml,
              onLoad: handleIframeLoad,
              title: isMapboxActive
                ? 'Smart Heritage Guide Mapbox GL JS v3'
                : 'Smart Heritage Guide OpenStreetMap 3D',
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
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              style={styles.webView}
            />
          )
        ) : (
          <View style={styles.bootCenter}>
            <ActivityIndicator size="small" color={COLORS.accent} />
          </View>
        )}
      </View>

      {/* Top-Left Pill: Tapped OSM/Mapbox Place OR Quick Mapbox Activation Chip */}
      <View style={styles.topLeftPlaceWrap} pointerEvents="box-none">
        {tappedPlace && !activeRoute && !focusedSite && !focusedRestaurant ? (
          <View style={styles.tappedPlacePill}>
            <MapPin size={13} color={COLORS.gpsBlue} />
            <Text style={styles.tappedPlaceText} numberOfLines={1}>
              {tappedPlace.name}
            </Text>
            <TouchableOpacity
              onPress={() => setTappedPlace(null)}
              hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            >
              <X size={13} color={COLORS.inkMuted} />
            </TouchableOpacity>
          </View>
        ) : !isMapboxActive && !activeRoute && !focusedSite && !focusedRestaurant ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenTokenModal}
            style={styles.mapboxPromptPill}
          >
            <KeyRound size={12} color={COLORS.accent} />
            <Text style={styles.mapboxPromptText}>
              Bật Mapbox GL JS v3
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Minimal Top-Right Floating Controls (Layers + 3D + Light + Food) */}
      <View style={styles.topRightControls} pointerEvents="box-none">
        <View style={styles.topRightIconColumn}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowStyleMenu((prev) => !prev)}
            style={[
              styles.roundControlBtn,
              showStyleMenu && styles.roundControlBtnActive,
            ]}
            accessibilityLabel="Chọn lớp bản đồ"
          >
            <Layers
              size={18}
              color={showStyleMenu ? COLORS.white : COLORS.ink}
            />
          </TouchableOpacity>

          {is3DCapable && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleToggle3D}
              style={[
                styles.roundControlBtn,
                is3DView && styles.roundControlBtn3DActive,
              ]}
              accessibilityLabel="Chuyển góc nhìn 2D và 3D"
            >
              <Text
                style={[
                  styles.toggle3DText,
                  is3DView && styles.toggle3DTextActive,
                ]}
              >
                {is3DView ? '3D' : '2D'}
              </Text>
            </TouchableOpacity>
          )}

          {showLightButton && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCycleLightPreset}
              style={styles.roundControlBtn}
              accessibilityLabel="Đổi ánh sáng Mapbox Standard 3D"
            >
              {lightPreset === 'day' ? (
                <Sun size={17} color="#D97706" />
              ) : lightPreset === 'dusk' ? (
                <Sunset size={17} color={COLORS.accent} />
              ) : (
                <Moon size={16} color={COLORS.ink} />
              )}
            </TouchableOpacity>
          )}

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
            <View style={styles.stylePopoverHeader}>
              <Box size={12} color={COLORS.inkMuted} />
              <Text style={styles.stylePopoverTitle}>
                {isMapboxActive ? 'Mapbox GL JS v3' : 'OpenStreetMap 3D'}
              </Text>
            </View>
            {availableStyles.map((tile) => {
              const active = currentTileConfig.id === tile.id;
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
            <View style={styles.popoverDivider} />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenTokenModal}
              style={styles.tokenActionRow}
            >
              <KeyRound size={13} color={COLORS.gpsBlue} />
              <Text style={styles.tokenActionText}>
                {isMapboxActive ? 'Đổi Mapbox Token' : 'Nhập Mapbox Token'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Floating Bottom-Right Icon Controls (Zoom +/-, Fit All, My GPS) */}
      <View
        style={[
          styles.rightControls,
          activeRoute || focusedSite || focusedRestaurant
            ? styles.rightControlsRaised
            : null,
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.zoomGroup}>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleZoomIn}
            style={styles.zoomBtn}
            accessibilityLabel="Phóng to bản đồ"
          >
            <Plus size={17} color={COLORS.ink} />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleZoomOut}
            style={styles.zoomBtn}
            accessibilityLabel="Thu nhỏ bản đồ"
          >
            <Minus size={17} color={COLORS.ink} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleFitAllMarkers}
          style={styles.roundControlBtn}
          accessibilityLabel="Xem toàn cảnh các di tích"
        >
          <Maximize2 size={17} color={COLORS.ink} />
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
            <ActivityIndicator size="small" color={COLORS.gpsBlue} />
            <Text style={styles.loadingText}>
              Đang tính lộ trình đi bộ trên bản đồ…
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
                onPress={handleOpenExternalOsmMaps}
                style={styles.navExternalBtn}
                accessibilityLabel="Mở tuyến trên OpenStreetMap"
              >
                <ExternalLink size={14} color={COLORS.gpsBlue} />
              </TouchableOpacity>
            </View>

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

      {/* Mapbox Public Token Modal (cho phép dán pk. token và trải nghiệm Mapbox GL JS v3 ngay lập tức) */}
      <Modal
        visible={showTokenModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTokenModal(false)}
      >
        <View style={styles.tokenBackdrop}>
          <View style={styles.tokenModalCard}>
            <View style={styles.tokenModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tokenModalTitle}>
                  Kích hoạt Mapbox GL JS v3
                </Text>
                <Text style={styles.tokenModalSub}>
                  Dán Public Token (bắt đầu bằng pk.) để mở Mapbox Standard 3D, ánh sáng Ngày/Hoàng hôn/Đêm và Vệ tinh 3D.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowTokenModal(false)}
                style={styles.closeIconBtn}
              >
                <X size={18} color={COLORS.inkMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={tokenDraft}
              onChangeText={(txt) => {
                setTokenDraft(txt);
                setTokenError(null);
              }}
              placeholder="pk.eyJ1Ijoi..."
              placeholderTextColor={COLORS.inkMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.tokenInput}
            />

            {tokenError && (
              <Text style={styles.tokenErrorText}>{tokenError}</Text>
            )}

            <Text style={styles.tokenHintText}>
              Bạn cũng có thể đặt EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN trong mobile/.env. Để trống để dùng OpenStreetMap 3D miễn phí.
            </Text>

            <View style={styles.tokenModalActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  Linking.openURL(
                    'https://account.mapbox.com/access-tokens/'
                  ).catch(() => {})
                }
                style={styles.tokenSecondaryBtn}
              >
                <ExternalLink size={13} color={COLORS.ink} />
                <Text style={styles.tokenSecondaryBtnText}>Lấy token</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSaveMapboxToken}
                style={styles.tokenPrimaryBtn}
              >
                <Check size={14} color={COLORS.white} />
                <Text style={styles.tokenPrimaryBtnText}>
                  {tokenDraft.trim() ? 'Áp dụng Mapbox' : 'Dùng OSM 3D'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 440,
    backgroundColor: '#F2F0EA',
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
    backgroundColor: '#F2F0EA',
  },
  bootCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLeftPlaceWrap: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: 70,
    zIndex: 14,
    alignItems: 'flex-start',
  },
  tappedPlacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...SHADOWS.floating,
  },
  tappedPlaceText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    flexShrink: 1,
  },
  mapboxPromptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 12,
    paddingVertical: 7,
    ...SHADOWS.card,
  },
  mapboxPromptText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.accent,
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
  roundControlBtn3DActive: {
    backgroundColor: COLORS.gpsBlue,
    borderColor: COLORS.gpsBlue,
  },
  toggle3DText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: 0.3,
  },
  toggle3DTextActive: {
    color: COLORS.white,
  },
  stylePopover: {
    width: 186,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xs + 2,
    gap: 2,
    ...SHADOWS.floating,
  },
  stylePopoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
  },
  stylePopoverTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.inkMuted,
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
  popoverDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
    marginHorizontal: SPACING.xs,
  },
  tokenActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: RADII.md,
  },
  tokenActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gpsBlue,
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
    bottom: 220,
  },
  zoomGroup: {
    width: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.floating,
  },
  zoomBtn: {
    width: 40,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
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
    backgroundColor: COLORS.gpsBlue,
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
    color: COLORS.gpsBlue,
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
  navExternalBtn: {
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
  tokenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.48)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  tokenModalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.floating,
  },
  tokenModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  tokenModalTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  tokenModalSub: {
    fontSize: 12.5,
    color: COLORS.inkSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  tokenInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.ink,
  },
  tokenErrorText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
  tokenHintText: {
    fontSize: 11.5,
    color: COLORS.inkMuted,
    lineHeight: 16,
  },
  tokenModalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tokenSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingVertical: 10,
  },
  tokenSecondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.ink,
  },
  tokenPrimaryBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.ink,
    borderRadius: RADII.md,
    paddingVertical: 10,
  },
  tokenPrimaryBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default MapExplorer;
