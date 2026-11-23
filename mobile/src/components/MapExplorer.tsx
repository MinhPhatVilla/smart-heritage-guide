import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
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
  Compass,
  CornerUpLeft,
  CornerUpRight,
  ExternalLink,
  Flag,
  Footprints,
  Globe,
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
  Sunrise,
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
  getLightPresetLabel,
  getRealtimeLightPreset,
  getTileConfig,
  isValidMapboxPublicToken,
  resolveMapboxAccessToken,
} from '../services/mapTiles';
import {
  HCMC_BOUNDARY_RINGS,
  HCMC_FOCUS_BOUNDS,
  HCMC_MAX_BOUNDS,
  HCMC_MIN_ZOOM,
  VIETNAM_BOUNDARY_RINGS,
  VIETNAM_FOCUS_BOUNDS,
  VIETNAM_MAX_BOUNDS,
  VIETNAM_MIN_ZOOM,
} from '../data/vietnamMapBounds';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export interface MapExplorerProps {
  userLocation: [number, number];
  userHeading?: number | null;
  sites: HeritageSite[];
  selectedSiteId?: string | null;
  visitedRecords: VisitedSiteRecord[];
  selectedLanguage: SupportedLanguage;
  activeRoute: WalkingRouteResult | null;
  isRoutingLoading?: boolean;
  activeWalkSeconds: number;
  isSimulatingWalk: boolean;
  searchRadiusMeters: number;
  focusHcmcOnly?: boolean;
  isVisible?: boolean;
  onToggleFocusHcmcOnly?: (next: boolean) => void;
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
    source?: 'curated' | 'overture';
  }>;
}

interface MapStatePayload {
  tileConfig: MapTileConfig;
  is3D: boolean;
  lightPreset: MapboxLightPreset;
  selectedLanguage: SupportedLanguage;
  userLocation: [number, number];
  userHeading: number | null;
  followNav: boolean;
  isSimulatingWalk: boolean;
  searchRadiusMeters: number;
  focusHcmcOnly: boolean;
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
  | { type: 'RECENTER_NAV' }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'SET_3D'; enabled: boolean }
  | { type: 'SET_LIGHT'; preset: MapboxLightPreset }
  | { type: 'FIT_SCOPE'; focusHcmcOnly: boolean }
  | { type: 'FLY_TO'; lat: number; lng: number; zoom?: number }
  | { type: 'RESIZE' }
  | {
      type: 'UPDATE_USER';
      userLocation: [number, number];
      userHeading: number | null;
      followNav: boolean;
      isSimulatingWalk: boolean;
      searchRadiusMeters: number;
    };

type MapBridgeIncomingMessage =
  | { source: 'shg-map'; mapId: string; type: 'MAP_READY'; engine?: string }
  | { source: 'shg-map'; mapId: string; type: 'MAPBOX_AUTH_ERROR'; message?: string }
  | { source: 'shg-map'; mapId: string; type: 'NAV_FOLLOW_CHANGED'; following: boolean }
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
  mapboxToken: string,
  initialFocusHcmcOnly: boolean,
  initialLightPreset: MapboxLightPreset
): string {
  const useMapboxEngine = Boolean(mapboxToken);
  const safeMapId = JSON.stringify(mapId);
  const safeCenter = JSON.stringify(initialCenter);
  const safeTile = JSON.stringify(initialTile);
  const safeMapboxToken = JSON.stringify(mapboxToken);
  const safeInitialFocusHcmc = JSON.stringify(initialFocusHcmcOnly);
  const safeInitialLightPreset = JSON.stringify(initialLightPreset);
  const initialCanvasBg =
    initialLightPreset === 'night'
      ? '#0E121B'
      : initialLightPreset === 'dusk'
        ? '#ECE3D7'
        : '#F4F2EC';
  const safeVietnamBounds = JSON.stringify(VIETNAM_MAX_BOUNDS);
  const safeVietnamFocusBounds = JSON.stringify(VIETNAM_FOCUS_BOUNDS);
  const safeVietnamMinZoom = JSON.stringify(VIETNAM_MIN_ZOOM);
  const safeVietnamRings = JSON.stringify(VIETNAM_BOUNDARY_RINGS);
  const safeHcmcBounds = JSON.stringify(HCMC_MAX_BOUNDS);
  const safeHcmcFocusBounds = JSON.stringify(HCMC_FOCUS_BOUNDS);
  const safeHcmcMinZoom = JSON.stringify(HCMC_MIN_ZOOM);
  const safeHcmcRings = JSON.stringify(HCMC_BOUNDARY_RINGS);

  const glCssUrl = useMapboxEngine
    ? 'https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.css'
    : 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css';
  const glJsUrl = useMapboxEngine
    ? 'https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.js'
    : 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="${glCssUrl}" />
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: ${initialCanvasBg};
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    }
    .mapboxgl-map, .maplibregl-map, .leaflet-container {
      background: ${initialCanvasBg};
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    }
    .mapboxgl-ctrl-attrib, .maplibregl-ctrl-attrib {
      font-size: 9px !important;
      background: rgba(250, 249, 246, 0.78) !important;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #8A877F !important;
      border-radius: 10px 0 0 0;
      padding: 1px 6px !important;
    }
    .mapboxgl-ctrl-scale, .maplibregl-ctrl-scale {
      background: rgba(250, 249, 246, 0.86) !important;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1.5px solid rgba(20, 20, 19, 0.38) !important;
      border-top: none !important;
      color: #57554F !important;
      font-size: 9.5px !important;
      font-weight: 600 !important;
      padding: 0 6px !important;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 2px 6px rgba(20, 20, 19, 0.06);
    }
    .mapboxgl-ctrl-bottom-left, .maplibregl-ctrl-bottom-left {
      left: 12px !important;
      bottom: 12px !important;
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
      background: rgba(0, 122, 255, 0.34);
      animation: shgGpsPulse 2s ease-out infinite;
    }
    .shg-pin-badge {
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
      transform-origin: bottom center;
    }
    .shg-pin-badge:hover {
      transform: translateY(-2px) scale(1.06);
    }
    .shg-pin-badge:active {
      transform: scale(0.94);
    }
    .shg-teardrop-shadow {
      width: 14px;
      height: 4px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.24);
      filter: blur(1.5px);
      margin-top: -1px;
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
      var INITIAL_FOCUS_HCMC = ${safeInitialFocusHcmc};
      var INITIAL_LIGHT_PRESET = ${safeInitialLightPreset};
      var VIETNAM_MAX_BOUNDS = ${safeVietnamBounds};
      var VIETNAM_FOCUS_BOUNDS = ${safeVietnamFocusBounds};
      var VIETNAM_MIN_ZOOM = ${safeVietnamMinZoom};
      var VIETNAM_BOUNDARY_RINGS = ${safeVietnamRings};
      var HCMC_MAX_BOUNDS = ${safeHcmcBounds};
      var HCMC_FOCUS_BOUNDS = ${safeHcmcFocusBounds};
      var HCMC_MIN_ZOOM = ${safeHcmcMinZoom};
      var HCMC_BOUNDARY_RINGS = ${safeHcmcRings};

      function ringSignedArea(ring) {
        var area = 0;
        for (var i = 0; i < ring.length - 1; i++) {
          area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
        }
        return area / 2;
      }

      function normalizeRing(ring, wantClockwise) {
        var copy = ring.slice();
        var isCw = ringSignedArea(copy) < 0;
        if (isCw !== wantClockwise) copy.reverse();
        return copy;
      }

      function buildInverseMaskGeoJson(rings) {
        // Outer world veil (CCW), inner spotlight cutouts (CW) — keeps active region crisp while softly misting outside
        var outerWorld = [[82, -8], [136, -8], [136, 36], [82, 36], [82, -8]];
        var holes = rings.map(function(r) { return normalizeRing(r, true); });
        return {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [normalizeRing(outerWorld, false)].concat(holes)
            },
            properties: { role: 'spotlight-dim-mask' }
          }]
        };
      }

      function buildBorderGeoJson(rings) {
        return {
          type: 'FeatureCollection',
          features: rings.map(function(ring) {
            return {
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: ring },
              properties: { role: 'spotlight-border' }
            };
          })
        };
      }

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
        return {
          version: 8,
          glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
          sources: sources,
          layers: layers
        };
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

      function createSiteMarkerElement(site, compactMode) {
        var el = document.createElement('div');
        el.style.cursor = 'pointer';
        el.style.zIndex = site.isSelected ? '45' : '15';
        var accent = site.isVisited ? '#047857' : '#B93815';
        var badgeText = site.isVisited ? '✓' : String(site.index);

        if (site.isSelected) {
          var shortLabel = site.label.length > 20 ? site.label.slice(0, 18) + '…' : site.label;
          el.style.willChange = 'transform';
          el.innerHTML = '<div class="shg-pin-badge" style="display:inline-flex;flex-direction:column;align-items:center;user-select:none;">'
            + '<div style="display:inline-flex;align-items:center;gap:7px;padding:4px 11px 4px 4px;border-radius:999px;background:rgba(250,249,246,0.98);border:1.5px solid ' + accent + ';box-shadow:0 8px 22px rgba(20,20,19,0.22);">'
            + '<div style="width:26px;height:26px;border-radius:999px;overflow:hidden;flex-shrink:0;background:#F3F1EC;border:1px solid rgba(20,20,19,0.08);">'
            + '<img src="' + escapeHtml(site.coverImage) + '" alt="" style="width:26px;height:26px;object-fit:cover;display:block;" />'
            + '</div>'
            + '<span style="font-size:12px;font-weight:700;color:#141413;letter-spacing:-0.01em;white-space:nowrap;">'
            + escapeHtml(shortLabel)
            + '</span>'
            + '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:' + accent + ';color:#FAF9F6;font-size:10px;font-weight:700;">'
            + badgeText
            + '</span>'
            + '</div>'
            + '<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid ' + accent + ';margin-top:-1px;"></div>'
            + '<div class="shg-teardrop-shadow" style="width:18px;"></div>'
            + '</div>';
          return el;
        }

        if (compactMode) {
          // Clean minimalist medallion for city/province overview — zero overlap clutter
          el.innerHTML = '<div class="shg-pin-badge" style="display:inline-flex;flex-direction:column;align-items:center;user-select:none;">'
            + '<div style="position:relative;width:30px;height:30px;border-radius:999px;background:#FAF9F6;padding:2px;box-shadow:0 4px 12px rgba(20,20,19,0.20),0 1px 2px rgba(20,20,19,0.10);border:1.5px solid ' + accent + ';">'
            + '<div style="width:100%;height:100%;border-radius:999px;overflow:hidden;background:#F3F1EC;">'
            + '<img src="' + escapeHtml(site.coverImage) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />'
            + '</div>'
            + '<span style="position:absolute;bottom:-2px;right:-2px;width:9px;height:9px;border-radius:999px;background:' + accent + ';border:1.5px solid #FAF9F6;"></span>'
            + '</div>'
            + '</div>';
          return el;
        }

        // Refined Editorial Teardrop Photo Pin — harmonized with #FAF9F6 & #B93815
        el.innerHTML = '<div class="shg-pin-badge" style="display:inline-flex;flex-direction:column;align-items:center;user-select:none;">'
          + '<div style="position:relative;width:34px;height:34px;border-radius:999px;background:#FAF9F6;padding:2.5px;box-shadow:0 6px 14px rgba(20,20,19,0.20),0 1px 3px rgba(20,20,19,0.10);border:1px solid rgba(20,20,19,0.08);">'
          + '<div style="width:100%;height:100%;border-radius:999px;overflow:hidden;background:#F3F1EC;">'
          + '<img src="' + escapeHtml(site.coverImage) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />'
          + '</div>'
          + '<span style="position:absolute;bottom:-3px;right:-3px;display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 3.5px;border-radius:999px;background:' + accent + ';color:#FAF9F6;border:1.5px solid #FAF9F6;font-size:8.5px;font-weight:700;line-height:1;box-shadow:0 2px 5px rgba(20,20,19,0.20);">'
          + badgeText
          + '</span>'
          + '</div>'
          + '<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid #FAF9F6;margin-top:-2px;filter:drop-shadow(0 2px 2px rgba(20,20,19,0.16));"></div>'
          + '<div class="shg-teardrop-shadow"></div>'
          + '</div>';
        return el;
      }

      function createClusterMarkerElement(count, allVisited) {
        var el = document.createElement('div');
        el.style.cursor = 'pointer';
        el.style.zIndex = '24';
        var bg = allVisited ? '#047857' : '#B93815';
        var size = count >= 15 ? 40 : (count >= 6 ? 36 : 32);
        el.innerHTML = '<div class="shg-pin-badge" style="display:inline-flex;align-items:center;justify-content:center;width:' + size + 'px;height:' + size + 'px;border-radius:999px;background:' + bg + ';color:#FAF9F6;border:2.5px solid #FAF9F6;box-shadow:0 6px 16px rgba(20,20,19,0.22),0 0 0 4px rgba(185,56,21,0.14);font-size:12px;font-weight:800;letter-spacing:-0.02em;user-select:none;">'
          + String(count)
          + '</div>';
        return el;
      }

      function createRestaurantMarkerElement(res, asDot) {
        var el = document.createElement('div');
        el.style.cursor = 'pointer';
        el.style.zIndex = '9';
        var isOverture = res.source === 'overture';
        var starColor = isOverture ? '#B45309' : '#B93815';
        if (asDot) {
          el.innerHTML = '<div class="shg-pin-badge" style="width:11px;height:11px;border-radius:999px;background:' + starColor + ';border:2px solid #FAF9F6;box-shadow:0 2px 6px rgba(20,20,19,0.22);"></div>';
          return el;
        }
        // Unified Warm-Ivory Glass Pill for eateries (matches #FAF9F6 & #141413)
        el.innerHTML = '<div class="shg-pin-badge" style="display:inline-flex;align-items:center;gap:3px;padding:2.5px 7px;border-radius:999px;background:rgba(250,249,246,0.94);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#141413;border:1px solid rgba(20,20,19,0.10);box-shadow:0 3px 9px rgba(20,20,19,0.13),0 1px 2px rgba(20,20,19,0.06);font-size:9.5px;font-weight:700;letter-spacing:-0.01em;white-space:nowrap;">'
          + '<span style="color:' + starColor + ';font-size:9px;line-height:1;">★</span>'
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
        el.style.width = '56px';
        el.style.height = '56px';
        el.style.cursor = 'grab';
        el.innerHTML = '<span class="shg-heading-cone" style="position:absolute;top:-2px;left:50%;width:40px;height:36px;margin-left:-20px;background:radial-gradient(ellipse at 50% 100%, rgba(26,115,232,0.52) 0%, rgba(26,115,232,0.16) 52%, rgba(26,115,232,0) 80%);clip-path:polygon(50% 96%, 6% 4%, 94% 4%);opacity:0;transition:opacity 0.25s ease;pointer-events:none;"></span>'
          + '<span class="shg-gps-ring"></span>'
          + '<span class="shg-gps-core" style="position:relative;display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:9999px;background:#1A73E8;border:3px solid #FFFFFF;box-shadow:0 3px 12px rgba(26,115,232,0.6);">'
          + '<svg class="shg-nav-arrow" viewBox="0 0 24 24" width="11" height="11" style="opacity:0;transition:opacity 0.2s ease;"><path d="M12 2L19 20L12 16.5L5 20L12 2Z" fill="#FFFFFF"/></svg>'
          + '</span>';
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

      function recolorAllRoadsAndBridges(map, lightPreset) {
        var style = map.getStyle();
        if (!style || !Array.isArray(style.layers)) return;
        var isNight = lightPreset === 'night';
        var isDusk = lightPreset === 'dusk';
        var isDawn = lightPreset === 'dawn';
        var fillBridge = isNight ? '#263044' : (isDusk ? '#DED5C7' : (isDawn ? '#EDE3D8' : '#E7E2D8'));
        var caseMajor = isNight ? '#171E2C' : (isDusk ? '#C6BBA9' : (isDawn ? '#DDD3C6' : '#D6D0C4'));
        var caseMinor = isNight ? '#1B2333' : (isDusk ? '#D4CABE' : (isDawn ? '#E9E0D4' : '#E5E0D7'));
        var pathColor = isNight ? '#20293B' : (isDusk ? '#DDD4C7' : (isDawn ? '#EFE6DC' : '#EAE5DB'));
        var majorColor = isNight ? '#344159' : (isDusk ? '#E2D8C9' : (isDawn ? '#F3EAE0' : '#F1EEE7'));
        var minorColor = isNight ? '#263145' : (isDusk ? '#F2ECE2' : (isDawn ? '#FFFBF5' : '#FFFFFF'));

        for (var i = 0; i < style.layers.length; i++) {
          var lyr = style.layers[i];
          var id = lyr.id || '';
          if (!id || id.indexOf('shg-') === 0) continue;
          var lower = id.toLowerCase();
          if (
            lower.indexOf('rail') !== -1 ||
            lower.indexOf('ferry') !== -1 ||
            lower.indexOf('aerial') !== -1 ||
            lower.indexOf('water') !== -1 ||
            lower.indexOf('boundary') !== -1 ||
            lower.indexOf('contour') !== -1
          ) {
            continue;
          }
          if (lyr.type === 'fill' && lower.indexOf('bridge') !== -1) {
            try { map.setPaintProperty(id, 'fill-color', fillBridge); } catch (e) {}
            continue;
          }
          if (lyr.type !== 'line') continue;
          var isTransport =
            lower.indexOf('road') !== -1 ||
            lower.indexOf('bridge') !== -1 ||
            lower.indexOf('tunnel') !== -1 ||
            lower.indexOf('highway') !== -1 ||
            lower.indexOf('motorway') !== -1 ||
            lower.indexOf('trunk') !== -1 ||
            lower.indexOf('primary') !== -1 ||
            lower.indexOf('secondary') !== -1 ||
            lower.indexOf('tertiary') !== -1 ||
            lower.indexOf('street') !== -1;
          if (!isTransport) continue;

          var isCasing =
            lower.indexOf('case') !== -1 ||
            lower.indexOf('casing') !== -1 ||
            lower.indexOf('outline') !== -1;
          var isMajor =
            lower.indexOf('motorway') !== -1 ||
            lower.indexOf('trunk') !== -1 ||
            lower.indexOf('primary') !== -1 ||
            lower.indexOf('expressway') !== -1;
          var isPath =
            lower.indexOf('path') !== -1 ||
            lower.indexOf('pedestrian') !== -1 ||
            lower.indexOf('footway') !== -1 ||
            lower.indexOf('cycle') !== -1 ||
            lower.indexOf('steps') !== -1;

          try {
            if (isCasing) {
              map.setPaintProperty(id, 'line-color', isMajor ? caseMajor : caseMinor);
            } else if (isPath) {
              map.setPaintProperty(id, 'line-color', pathColor);
            } else if (isMajor) {
              // Đồng màu trung tính cho cả đường lớn lẫn cầu vượt / cầu sông theo đúng khung giờ thực tế
              map.setPaintProperty(id, 'line-color', majorColor);
            } else {
              map.setPaintProperty(id, 'line-color', minorColor);
            }
          } catch (e) {}
        }
      }

      function applyMapboxOrOsmEnhancements(map, tileCfg, is3D, lightPreset) {
        var preset = lightPreset || 'day';
        var isNight = preset === 'night';
        var isDusk = preset === 'dusk';
        var isDawn = preset === 'dawn';

        // 1. Mapbox Standard 3D (v3): bảng màu Faded hiện đại + ánh sáng realtime Bình minh/Ngày/Hoàng hôn/Đêm + đường/cầu đồng màu
        if (USE_MAPBOX && tileCfg.id === 'mapbox_standard') {
          var setBasemapCfg = function(prop, val) {
            try { map.setConfigProperty('basemap', prop, val); } catch (e) {}
          };
          setBasemapCfg('theme', 'faded');
          setBasemapCfg('lightPreset', preset);
          setBasemapCfg('colorMotorways', isNight ? '#333B4C' : (isDusk ? '#D8CEC0' : (isDawn ? '#ECE2D6' : '#E8E3D9')));
          setBasemapCfg('colorTrunks', isNight ? '#2B3242' : (isDusk ? '#E2D9CC' : (isDawn ? '#F3EAE0' : '#EFECE4')));
          setBasemapCfg('colorRoads', isNight ? '#222836' : (isDusk ? '#F2ECE2' : (isDawn ? '#FFFBF5' : '#FFFFFF')));
          setBasemapCfg('showPointOfInterestLabels', true);
          setBasemapCfg('showRoadLabels', true);
          setBasemapCfg('showTransitLabels', true);
          setBasemapCfg('show3dObjects', is3D);
          try {
            if (typeof map.setFog === 'function') {
              map.setFog(is3D ? {
                color: isNight ? '#0E121B' : (isDusk ? '#ECE1D4' : (isDawn ? '#F3E6DC' : '#F4F2EC')),
                'high-color': isNight ? '#05070D' : (isDusk ? '#D8C3AD' : (isDawn ? '#D9C5CE' : '#E3E9EE')),
                'space-color': isNight ? '#05070D' : (isDusk ? '#A99282' : '#DAE3EB'),
                'horizon-blend': 0.10,
                range: [1.8, 12]
              } : null);
            }
          } catch (e) {}
          return;
        }

        // 2. Mapbox Streets / Outdoors / Satellite v12: đồng màu toàn bộ đường + cầu + khối kiến trúc 3D
        if (USE_MAPBOX && tileCfg.renderMode === 'mapbox') {
          if (tileCfg.id !== 'mapbox_satellite') {
            recolorAllRoadsAndBridges(map, preset);
          }
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
                minzoom: 14.3,
                paint: {
                  'fill-extrusion-color': [
                    'interpolate', ['linear'],
                    ['coalesce', ['get', 'height'], 10],
                    0, '#F5F2EC',
                    25, '#EAE5DC',
                    75, '#DDD7CC',
                    160, '#CFC8BC'
                  ],
                  'fill-extrusion-height': ['get', 'height'],
                  'fill-extrusion-base': ['get', 'min_height'],
                  'fill-extrusion-opacity': 0.86,
                  'fill-extrusion-vertical-gradient': true
                }
              }, labelLayerId);
            } else if (map.getLayer('shg-mapbox-3d-buildings')) {
              map.setLayoutProperty('shg-mapbox-3d-buildings', 'visibility', is3D ? 'visible' : 'none');
            }
          } catch (e) {}
          return;
        }

        // 3. OpenStreetMap Vector 3D (OpenFreeMap) — Tự động chuyển bảng màu Bình minh / Ngày / Hoàng hôn / Đêm theo thời gian thực!
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
          if (isNight) {
            setPaint('background', 'background-color', '#121722');
            setPaint('water', 'fill-color', '#0B1320');
            setPaint('waterway_river', 'line-color', '#0D1829');
            setPaint('waterway_other', 'line-color', '#0E192B');
            setPaint('park', 'fill-color', '#15251E');
            setPaint('park_outline', 'line-color', '#1A2E25');
            setPaint('landcover_wood', 'fill-color', '#14221C');
            setPaint('landcover_grass', 'fill-color', '#172821');
            setPaint('landuse_residential', 'fill-color', '#151B28');
            setPaint('landuse_commercial_area', 'fill-color', '#1A2130');
            setPaint('landuse_hospital', 'fill-color', '#241B26');
            setPaint('landuse_school', 'fill-color', '#1D2230');
            setPaint('building', 'fill-color', '#1B2333');
            setPaint('building', 'fill-outline-color', '#253046');
          } else if (isDusk) {
            setPaint('background', 'background-color', '#EFE7DC');
            setPaint('water', 'fill-color', '#AFC4D6');
            setPaint('waterway_river', 'line-color', '#A1BACF');
            setPaint('waterway_other', 'line-color', '#AFC4D6');
            setPaint('park', 'fill-color', '#CBD6C2');
            setPaint('park_outline', 'line-color', '#BECBB3');
            setPaint('landcover_wood', 'fill-color', '#C3D0B9');
            setPaint('landcover_grass', 'fill-color', '#D2DCC8');
            setPaint('landuse_residential', 'fill-color', '#EAE1D5');
            setPaint('landuse_commercial_area', 'fill-color', '#EDE2D3');
            setPaint('landuse_hospital', 'fill-color', '#EEDDD9');
            setPaint('landuse_school', 'fill-color', '#ECE2D2');
            setPaint('building', 'fill-color', '#E0D7C9');
            setPaint('building', 'fill-outline-color', '#D3C9BA');
          } else if (isDawn) {
            setPaint('background', 'background-color', '#F6F0E9');
            setPaint('water', 'fill-color', '#CADCEB');
            setPaint('waterway_river', 'line-color', '#BCD2E4');
            setPaint('waterway_other', 'line-color', '#CADCEB');
            setPaint('park', 'fill-color', '#D7E3CF');
            setPaint('park_outline', 'line-color', '#C9D8BF');
            setPaint('landcover_wood', 'fill-color', '#CFDEC6');
            setPaint('landcover_grass', 'fill-color', '#DDE8D4');
            setPaint('landuse_residential', 'fill-color', '#F3ECE4');
            setPaint('landuse_commercial_area', 'fill-color', '#F6ECE2');
            setPaint('landuse_hospital', 'fill-color', '#F6E7E7');
            setPaint('landuse_school', 'fill-color', '#F4ECE0');
            setPaint('building', 'fill-color', '#EAE2D9');
            setPaint('building', 'fill-outline-color', '#DDD4CA');
          } else {
            setPaint('background', 'background-color', '#F6F4EF');
            setPaint('water', 'fill-color', '#D2E2EE');
            setPaint('waterway_river', 'line-color', '#C3D9E8');
            setPaint('waterway_other', 'line-color', '#D2E2EE');
            setPaint('park', 'fill-color', '#DCE7D4');
            setPaint('park_outline', 'line-color', '#CEDCC4');
            setPaint('landcover_wood', 'fill-color', '#D4E2CB');
            setPaint('landcover_grass', 'fill-color', '#E2ECD9');
            setPaint('landuse_residential', 'fill-color', '#F2EFE9');
            setPaint('landuse_commercial_area', 'fill-color', '#F4EEE4');
            setPaint('landuse_hospital', 'fill-color', '#F5EAE8');
            setPaint('landuse_school', 'fill-color', '#F4EFE3');
            setPaint('building', 'fill-color', '#EBE7DF');
            setPaint('building', 'fill-outline-color', '#DED9CF');
          }
          // Tô đồng màu toàn bộ road_*, bridge_*, tunnel_*, highway_* theo khung giờ hiện tại
          recolorAllRoadsAndBridges(map, preset);
        }

        if (map.getLayer('building-3d')) {
          setLayout('building-3d', 'visibility', is3D ? 'visible' : 'none');
          var extrudeColors = isNight
            ? [0, '#1D2536', 18, '#253046', 50, '#2E3C57', 130, '#3C4D6E']
            : isDusk
              ? [0, '#E9DFD2', 18, '#DDD2C2', 50, '#CFC3B2', 130, '#C0B3A1']
              : isDawn
                ? [0, '#F5ECE4', 18, '#EAE0D6', 50, '#DDD2C6', 130, '#CFC3B6']
                : [0, '#F5F2EC', 18, '#EAE5DC', 50, '#DDD7CC', 130, '#CFC8BC'];
          setPaint('building-3d', 'fill-extrusion-color', [
            'interpolate', ['linear'],
            ['coalesce', ['get', 'render_height'], 10]
          ].concat(extrudeColors));
          setPaint('building-3d', 'fill-extrusion-opacity', 0.88);
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
        var currentLightPreset = INITIAL_LIGHT_PRESET || 'day';
        var prevUserCenter = INITIAL_CENTER;
        var lastSitesSignature = '';
        var lastRouteKey = '';
        var lastKnownSites = [];
        var lastKnownUser = INITIAL_CENTER;
        var lastRadiusMeters = 0;
        var lastRouteData = null;
        var styleReady = false;

        var userMarker = null;
        var userMarkerEl = null;
        var destMarker = null;
        var selectedSiteMarker = null;
        var isFollowingNav = false;
        var lastKnownHeading = null;
        var wasInNavMode = false;
        var isFocusHcmcOnly = Boolean(INITIAL_FOCUS_HCMC);
        var loadedPhotoSprites = {};
        var loadingPhotoSprites = {};
        var spriteRefreshTimer = null;

        var isInteracting = false;
        var interactCooldownTimer = null;
        var pendingSpriteBatches = [];
        var lastRadiusSig = '';
        var lastRestaurantsSig = '';

        var dpr = typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1;
        var mapInitOpts = {
          container: 'map',
          style: resolveGlStyle(INITIAL_TILE),
          center: [INITIAL_CENTER[1], INITIAL_CENTER[0]],
          zoom: 15.6,
          minZoom: isFocusHcmcOnly ? HCMC_MIN_ZOOM : VIETNAM_MIN_ZOOM,
          maxBounds: isFocusHcmcOnly ? HCMC_MAX_BOUNDS : VIETNAM_MAX_BOUNDS,
          renderWorldCopies: false,
          pitch: 50,
          bearing: -15,
          maxPitch: 70,
          // Trên màn hình HiDPI/Retina (>=1.5x), tắt MSAA antialias giúp tăng 30-50% FPS khi phóng to thu nhỏ mà vẫn sắc nét
          antialias: dpr < 1.5,
          fadeDuration: 0,
          maxTileCacheSize: 160,
          collectResourceTiming: false,
          preserveDrawingBuffer: false,
          refreshExpiredTiles: false,
          attributionControl: true
        };
        if (USE_MAPBOX && INITIAL_TILE.id === 'mapbox_standard') {
          var initNight = currentLightPreset === 'night';
          var initDusk = currentLightPreset === 'dusk';
          var initDawn = currentLightPreset === 'dawn';
          mapInitOpts.config = {
            basemap: {
              theme: 'faded',
              lightPreset: currentLightPreset,
              colorMotorways: initNight ? '#333B4C' : (initDusk ? '#D8CEC0' : (initDawn ? '#ECE2D6' : '#E8E3D9')),
              colorTrunks: initNight ? '#2B3242' : (initDusk ? '#E2D9CC' : (initDawn ? '#F3EAE0' : '#EFECE4')),
              colorRoads: initNight ? '#222836' : (initDusk ? '#F2ECE2' : (initDawn ? '#FFFBF5' : '#FFFFFF')),
              showPointOfInterestLabels: true,
              showRoadLabels: true,
              showTransitLabels: true,
              show3dObjects: true
            }
          };
        }
        var map = new gl.Map(mapInitOpts);

        // Giới hạn pixelRatio tối đa 2x (màn hình 3x iPhone/Android giảm 56% tải GPU fragment shader khi zoom!)
        try {
          if (typeof map.setPixelRatio === 'function' && dpr > 2) {
            map.setPixelRatio(2);
          }
        } catch (e) {}

        // Tối ưu độ nhạy & độ mượt khi lăn chuột / phóng to thu nhỏ
        try {
          if (map.scrollZoom) {
            if (typeof map.scrollZoom.setWheelZoomRate === 'function') {
              map.scrollZoom.setWheelZoomRate(1 / 250);
            }
            if (typeof map.scrollZoom.setZoomRate === 'function') {
              map.scrollZoom.setZoomRate(1 / 90);
            }
          }
        } catch (e) {}

        map.addControl(new gl.ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-left');

        // =========================================================================
        // 100% GPU WebGL HiDPI Canvas Sprites — zero DOM lag during 60-120fps zoom!
        // =========================================================================
        function drawPinCanvas(img, accent, badgeText) {
          var w = 88;
          var h = 98;
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          var cx = w / 2;
          var cy = 40;
          var r = 32;

          // Subtle ground ellipse shadow
          ctx.save();
          ctx.fillStyle = 'rgba(20, 20, 19, 0.22)';
          ctx.beginPath();
          ctx.ellipse(cx, h - 6, 13, 3.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Teardrop pointer tip
          ctx.save();
          ctx.shadowColor = 'rgba(20, 20, 19, 0.22)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 4;
          ctx.fillStyle = '#FAF9F6';
          ctx.beginPath();
          ctx.moveTo(cx - 10, cy + r - 5);
          ctx.lineTo(cx, h - 8);
          ctx.lineTo(cx + 10, cy + r - 5);
          ctx.closePath();
          ctx.fill();

          // Outer warm-ivory medallion frame
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Hairline rim
          ctx.strokeStyle = 'rgba(20, 20, 19, 0.12)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r - 0.75, 0, Math.PI * 2);
          ctx.stroke();

          // Inner circular photo or warm fallback icon
          var ir = r - 5;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, ir, 0, Math.PI * 2);
          ctx.clip();
          if (img) {
            var iw = img.naturalWidth || img.width || 1;
            var ih = img.naturalHeight || img.height || 1;
            var scale = Math.max((ir * 2) / iw, (ir * 2) / ih);
            var dw = iw * scale;
            var dh = ih * scale;
            ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
          } else {
            ctx.fillStyle = '#F3F1EC';
            ctx.fillRect(cx - ir, cy - ir, ir * 2, ir * 2);
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // Corner index / visited badge
          if (badgeText) {
            var bx = cx + 22;
            var by = cy + 21;
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.arc(bx, by, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FAF9F6';
            ctx.lineWidth = 2.6;
            ctx.stroke();
            ctx.fillStyle = '#FAF9F6';
            ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, bx, by + 0.5);
          }
          return ctx.getImageData(0, 0, w, h);
        }

        function drawRestaurantPillCanvas(starColor) {
          var w = 104;
          var h = 44;
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          var x = 8;
          var y = 6;
          var pw = w - 16;
          var ph = h - 14;
          var rad = ph / 2;

          ctx.save();
          ctx.shadowColor = 'rgba(20, 20, 19, 0.16)';
          ctx.shadowBlur = 7;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = 'rgba(250, 249, 246, 0.96)';
          ctx.beginPath();
          ctx.moveTo(x + rad, y);
          ctx.lineTo(x + pw - rad, y);
          ctx.arcTo(x + pw, y, x + pw, y + rad, rad);
          ctx.arcTo(x + pw, y + ph, x + pw - rad, y + ph, rad);
          ctx.lineTo(x + rad, y + ph);
          ctx.arcTo(x, y + ph, x, y + ph - rad, rad);
          ctx.arcTo(x, y, x + rad, y, rad);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          ctx.strokeStyle = 'rgba(20, 20, 19, 0.12)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Tiny accent star dot on the left of the pill
          ctx.fillStyle = starColor;
          ctx.font = '700 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', x + 17, y + ph / 2 + 0.5);
          return ctx.getImageData(0, 0, w, h);
        }

        function ensureMarkerSprites() {
          try {
            if (!map.hasImage('shg-pin-default')) {
              map.addImage('shg-pin-default', drawPinCanvas(null, '#B93815', ''), { pixelRatio: 2 });
            }
            if (!map.hasImage('shg-pin-visited')) {
              map.addImage('shg-pin-visited', drawPinCanvas(null, '#047857', '✓'), { pixelRatio: 2 });
            }
            if (!map.hasImage('shg-res-pill-curated')) {
              map.addImage('shg-res-pill-curated', drawRestaurantPillCanvas('#B93815'), { pixelRatio: 2 });
            }
            if (!map.hasImage('shg-res-pill-overture')) {
              map.addImage('shg-res-pill-overture', drawRestaurantPillCanvas('#B45309'), { pixelRatio: 2 });
            }
          } catch (e) {}
        }

        var pinImageCache = {};
        var photoLoadQueue = [];
        var activePhotoLoads = 0;
        var MAX_CONCURRENT_PHOTO_LOADS = 5;
        var directWikimediaErrors = 0;

        function scheduleSpriteSourceRefresh() {
          if (spriteRefreshTimer || isInteracting) return;
          spriteRefreshTimer = setTimeout(function() {
            spriteRefreshTimer = null;
            if (styleReady && !isInteracting && lastKnownSites.length) {
              syncSitesSourceOnly(lastKnownSites);
            }
          }, 260);
        }

        function flushPendingSpriteRegistrations() {
          if (!styleReady || isInteracting || pendingSpriteBatches.length === 0) return;
          var batch = pendingSpriteBatches.splice(0, 12);
          var addedAny = false;
          for (var i = 0; i < batch.length; i++) {
            var item = batch[i];
            if (registerSiteSpriteFromImgImmediate(item.site, item.spriteId, item.imgObj)) {
              addedAny = true;
            }
          }
          if (addedAny) {
            scheduleSpriteSourceRefresh();
          }
          if (pendingSpriteBatches.length > 0 && !isInteracting) {
            setTimeout(flushPendingSpriteRegistrations, 48);
          }
        }

        function buildPinPhotoCandidates(rawUrl) {
          if (!rawUrl) return [];
          var clean = String(rawUrl).split('?')[0];
          if (clean.indexOf('https://thumb.wikimedia.org/') === 0) {
            clean = 'https://upload.wikimedia.org/' + clean.slice('https://thumb.wikimedia.org/'.length);
          }

          var thumbUrl = '';
          var thumbPrefix = 'https://upload.wikimedia.org/wikipedia/commons/thumb/';
          var directPrefix = 'https://upload.wikimedia.org/wikipedia/commons/';
          if (clean.indexOf(thumbPrefix) === 0) {
            var lastSlash = clean.lastIndexOf('/');
            var basePart = clean.slice(0, lastSlash + 1);
            var leaf = clean.slice(lastSlash + 1);
            var pxIdx = leaf.indexOf('px-');
            if (pxIdx > 0 && pxIdx <= 5) {
              thumbUrl = basePart + '250px-' + leaf.slice(pxIdx + 3);
            }
          } else if (clean.indexOf(directPrefix) === 0) {
            var rel = clean.slice(directPrefix.length);
            var segs = rel.split('/');
            if (segs.length === 3 && segs[0].length === 1 && segs[1].length === 2) {
              var fname = segs[2];
              var ext = fname.toLowerCase();
              var isStandardExt = ext.indexOf('.jpg') === ext.length - 4 || ext.indexOf('.jpeg') === ext.length - 5 || ext.indexOf('.png') === ext.length - 4;
              var thumbName = isStandardExt ? ('250px-' + fname) : ('250px-' + fname + '.jpg');
              thumbUrl = thumbPrefix + segs[0] + '/' + segs[1] + '/' + fname + '/' + thumbName;
            }
          }

          var wsrvUrl = 'https://wsrv.nl/?url=' + encodeURIComponent(clean) + '&w=128&h=128&fit=cover&output=webp';
          var list = [];
          if (directWikimediaErrors >= 2) {
            list.push({ url: wsrvUrl, isDirectWm: false });
            if (thumbUrl && thumbUrl !== clean) list.push({ url: thumbUrl, isDirectWm: true });
            list.push({ url: clean, isDirectWm: true });
          } else {
            if (thumbUrl && thumbUrl !== clean) list.push({ url: thumbUrl, isDirectWm: true });
            list.push({ url: wsrvUrl, isDirectWm: false });
            list.push({ url: clean, isDirectWm: true });
          }
          return list;
        }

        function registerSiteSpriteFromImgImmediate(site, spriteId, imgObj) {
          var accent = site.isVisited ? '#047857' : '#B93815';
          var badge = site.isVisited ? '✓' : String(site.index);
          try {
            if (styleReady && !map.hasImage(spriteId)) {
              map.addImage(spriteId, drawPinCanvas(imgObj, accent, badge), { pixelRatio: 2 });
            }
            loadedPhotoSprites[spriteId] = true;
            return true;
          } catch (err) {
            return false;
          }
        }

        function registerSiteSpriteFromImg(site, spriteId, imgObj) {
          if (isInteracting) {
            pendingSpriteBatches.push({ site: site, spriteId: spriteId, imgObj: imgObj });
            return true;
          }
          var ok = registerSiteSpriteFromImgImmediate(site, spriteId, imgObj);
          if (ok) {
            scheduleSpriteSourceRefresh();
          }
          return ok;
        }

        function prioritizePhotoQueueByViewport() {
          if (photoLoadQueue.length < 2 || !map || typeof map.getBounds !== 'function') return;
          try {
            var b = map.getBounds();
            var c = map.getCenter();
            photoLoadQueue.sort(function(a, bb) {
              var sa = a.site;
              var sb = bb.site;
              var aIn = b.contains([sa.lng, sa.lat]) ? 0 : 1;
              var bIn = b.contains([sb.lng, sb.lat]) ? 0 : 1;
              if (aIn !== bIn) return aIn - bIn;
              var da = Math.pow(sa.lat - c.lat, 2) + Math.pow(sa.lng - c.lng, 2);
              var db = Math.pow(sb.lat - c.lat, 2) + Math.pow(sb.lng - c.lng, 2);
              return da - db;
            });
          } catch (e) {}
        }

        function pumpPhotoLoadQueue() {
          if (!styleReady || isInteracting) return;
          prioritizePhotoQueueByViewport();
          while (activePhotoLoads < MAX_CONCURRENT_PHOTO_LOADS && photoLoadQueue.length > 0) {
            var job = photoLoadQueue.shift();
            if (!job) break;
            if (map.hasImage(job.spriteId)) {
              loadedPhotoSprites[job.spriteId] = true;
              delete loadingPhotoSprites[job.spriteId];
              continue;
            }
            activePhotoLoads++;
            (function(task) {
              var candidates = buildPinPhotoCandidates(task.site.coverImage);
              var candIdx = 0;

              function finishJob(imgObj) {
                activePhotoLoads = Math.max(0, activePhotoLoads - 1);
                delete loadingPhotoSprites[task.spriteId];
                if (imgObj) {
                  pinImageCache[task.site.coverImage] = imgObj;
                  if (!registerSiteSpriteFromImg(task.site, task.spriteId, imgObj)) {
                    registerSiteSpriteFromImg(task.site, task.spriteId, null);
                  }
                } else {
                  registerSiteSpriteFromImg(task.site, task.spriteId, null);
                }
                setTimeout(pumpPhotoLoadQueue, 35);
              }

              function tryNextCandidate() {
                if (candIdx >= candidates.length) {
                  finishJob(null);
                  return;
                }
                var cand = candidates[candIdx++];
                var img = new Image();
                img.crossOrigin = 'anonymous';
                var settled = false;
                var timeoutId = setTimeout(function() {
                  if (settled) return;
                  settled = true;
                  if (cand.isDirectWm) directWikimediaErrors++;
                  tryNextCandidate();
                }, 7500);
                img.onload = function() {
                  if (settled) return;
                  settled = true;
                  clearTimeout(timeoutId);
                  if (cand.isDirectWm) directWikimediaErrors = 0;
                  finishJob(img);
                };
                img.onerror = function() {
                  if (settled) return;
                  settled = true;
                  clearTimeout(timeoutId);
                  if (cand.isDirectWm) directWikimediaErrors++;
                  tryNextCandidate();
                };
                img.src = cand.url;
              }

              tryNextCandidate();
            })(job);
          }
        }

        function ensureSitePhotoSprite(site) {
          var spriteId = 'shg-site-' + site.id + (site.isVisited ? '-v' : '-i' + site.index);
          if (map.hasImage(spriteId)) {
            loadedPhotoSprites[spriteId] = true;
            return spriteId;
          }
          if (!site.coverImage) {
            registerSiteSpriteFromImg(site, spriteId, null);
            return map.hasImage(spriteId) ? spriteId : (site.isVisited ? 'shg-pin-visited' : 'shg-pin-default');
          }
          // Instant RAM redraw after style switches (0 network requests!)
          if (pinImageCache[site.coverImage]) {
            if (registerSiteSpriteFromImg(site, spriteId, pinImageCache[site.coverImage])) {
              return spriteId;
            }
          }
          if (!loadingPhotoSprites[spriteId]) {
            loadingPhotoSprites[spriteId] = true;
            photoLoadQueue.push({ site: site, spriteId: spriteId });
            pumpPhotoLoadQueue();
          }
          return site.isVisited ? 'shg-pin-visited' : 'shg-pin-default';
        }

        function getSpotlightTheme() {
          var isDark = currentTile.id === 'mapbox_satellite' || currentTile.id === 'satellite' || currentLightPreset === 'night';
          var isDusk = !isDark && currentLightPreset === 'dusk';
          var isDawn = !isDark && currentLightPreset === 'dawn';
          if (isDark) {
            return {
              maskColor: '#0B0F17',
              maskOpacity: 0.64,
              featherColor: '#000000',
              featherOpacity: 0.24,
              casingColor: 'rgba(250, 249, 246, 0.30)',
              lineColor: '#E07A5F',
              lineOpacity: 0.88
            };
          }
          if (isDusk) {
            return {
              maskColor: '#EBE3D7',
              maskOpacity: 0.76,
              featherColor: '#8C7A68',
              featherOpacity: 0.16,
              casingColor: '#FAF9F6',
              lineColor: '#B93815',
              lineOpacity: 0.84
            };
          }
          if (isDawn) {
            return {
              maskColor: '#F3EAE2',
              maskOpacity: 0.76,
              featherColor: '#9A8479',
              featherOpacity: 0.14,
              casingColor: '#FAF9F6',
              lineColor: '#B93815',
              lineOpacity: 0.82
            };
          }
          // Warm Alabaster Frosted Veil — harmonized 1:1 with app parchment #FAF9F6 & terracotta #B93815
          return {
            maskColor: '#F4F2EC',
            maskOpacity: 0.78,
            featherColor: '#8A877F',
            featherOpacity: 0.14,
            casingColor: '#FAF9F6',
            lineColor: '#B93815',
            lineOpacity: 0.82
          };
        }

        function ensureCustomOverlayLayers() {
          var slotProps = (USE_MAPBOX && currentTile.id === 'mapbox_standard') ? { slot: 'middle' } : {};
          var topSlotProps = (USE_MAPBOX && currentTile.id === 'mapbox_standard') ? { slot: 'top' } : {};
          var theme = getSpotlightTheme();

          // Lớp sương mờ tông kem ấm đồng bộ app (Frosted Alabaster Veil)
          // maxzoom: 12 + tolerance: 0.75 giúp tránh re-tiling / re-triangulation đa giác lớn khi phóng to từ mức 12 -> 20!
          if (!map.getSource('shg-hcmc-mask')) {
            map.addSource('shg-hcmc-mask', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
              maxzoom: 12,
              tolerance: 0.75,
              buffer: 32
            });
            map.addLayer(Object.assign({
              id: 'shg-hcmc-mask-fill',
              type: 'fill',
              source: 'shg-hcmc-mask',
              paint: {
                'fill-color': theme.maskColor,
                'fill-opacity': theme.maskOpacity
              }
            }, topSlotProps));
          }

          if (!map.getSource('shg-hcmc-border')) {
            map.addSource('shg-hcmc-border', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
              maxzoom: 12,
              tolerance: 0.75,
              buffer: 32
            });
            // 1. Subtle lightweight halo along the border (bỏ line-blur tốn GPU fragment shader khi zoom!)
            map.addLayer(Object.assign({
              id: 'shg-hcmc-border-glow',
              type: 'line',
              source: 'shg-hcmc-border',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': theme.featherColor,
                'line-width': 5.5,
                'line-opacity': theme.featherOpacity
              }
            }, topSlotProps));
            // 2. Crisp warm-ivory rim separating land/sea from border hairline
            map.addLayer(Object.assign({
              id: 'shg-hcmc-border-casing',
              type: 'line',
              source: 'shg-hcmc-border',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': theme.casingColor,
                'line-width': 3.2,
                'line-opacity': 0.92
              }
            }, topSlotProps));
            // 3. Refined Heritage Terracotta border hairline
            map.addLayer(Object.assign({
              id: 'shg-hcmc-border-line',
              type: 'line',
              source: 'shg-hcmc-border',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': theme.lineColor,
                'line-width': 1.6,
                'line-opacity': theme.lineOpacity
              }
            }, topSlotProps));
          }

          if (!map.getSource('shg-radius')) {
            map.addSource('shg-radius', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
              maxzoom: 14,
              tolerance: 0.6,
              buffer: 32
            });
            map.addLayer(Object.assign({
              id: 'shg-radius-fill',
              type: 'fill',
              source: 'shg-radius',
              paint: {
                'fill-color': '#B93815',
                'fill-opacity': 0.045
              }
            }, slotProps));
            map.addLayer(Object.assign({
              id: 'shg-radius-line',
              type: 'line',
              source: 'shg-radius',
              paint: {
                'line-color': '#B93815',
                'line-width': 1.25,
                'line-dasharray': [4, 4],
                'line-opacity': 0.48
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
                'line-color': '#FAF9F6',
                'line-width': 9,
                'line-opacity': 0.96
              }
            }, slotProps));
            map.addLayer(Object.assign({
              id: 'shg-route-core',
              type: 'line',
              source: 'shg-route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#B93815',
                'line-width': 5,
                'line-opacity': 0.96
              }
            }, slotProps));
            map.addLayer(Object.assign({
              id: 'shg-route-dashes',
              type: 'line',
              source: 'shg-route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#FDE8DF',
                'line-width': 2,
                'line-dasharray': [0.5, 2.8],
                'line-opacity': 0.95
              }
            }, slotProps));
          }

          // =========================================================================
          // GPU-Accelerated Native WebGL Layers for Restaurants (250+) & Heritage Sites
          // =========================================================================
          ensureMarkerSprites();
          var gpuTextFontProps = (USE_MAPBOX && currentTile.renderMode === 'mapbox')
            ? (currentTile.id === 'mapbox_standard' ? {} : { 'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'] })
            : { 'text-font': ['Noto Sans Bold'] };

          if (!map.getSource('shg-restaurants-src')) {
            map.addSource('shg-restaurants-src', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
              maxzoom: 15,
              buffer: 32
            });
            // District zoom (12.8 - 15.2): ultra-fast GPU dots (0ms collision CPU cost during zoom!)
            map.addLayer(Object.assign({
              id: 'shg-res-dots',
              type: 'circle',
              source: 'shg-restaurants-src',
              minzoom: 12.8,
              maxzoom: 15.3,
              filter: ['!=', ['get', 'isSelectedSite'], 1],
              paint: {
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 12.8, 3.2, 14.8, 5.2],
                'circle-color': ['case', ['==', ['get', 'isOverture'], 1], '#B45309', '#B93815'],
                'circle-stroke-width': 1.8,
                'circle-stroke-color': '#FAF9F6',
                'circle-opacity': ['interpolate', ['linear'], ['zoom'], 12.8, 0, 13.3, 0.92, 14.9, 0.92, 15.3, 0],
                'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'], 12.8, 0, 13.3, 0.95, 14.9, 0.95, 15.3, 0]
              }
            }, topSlotProps));
            // Street zoom (>= 15.0): crisp GPU Warm-Ivory Rating Pills with automatic WebGL collision detection
            map.addLayer(Object.assign({
              id: 'shg-res-pills',
              type: 'symbol',
              source: 'shg-restaurants-src',
              minzoom: 15.0,
              filter: ['!=', ['get', 'isSelectedSite'], 1],
              layout: Object.assign({
                'icon-image': ['case', ['==', ['get', 'isOverture'], 1], 'shg-res-pill-overture', 'shg-res-pill-curated'],
                'icon-allow-overlap': false,
                'icon-padding': 4,
                'text-field': ['get', 'ratingText'],
                'text-size': 10,
                'text-offset': [0.62, -0.05],
                'text-anchor': 'center',
                'text-allow-overlap': false,
                'symbol-sort-key': ['*', -1, ['get', 'rating']]
              }, gpuTextFontProps),
              paint: {
                'text-color': '#141413'
              }
            }, topSlotProps));
            // Selected site's nearby restaurants ALWAYS appear immediately at any zoom
            map.addLayer(Object.assign({
              id: 'shg-res-selected-pills',
              type: 'symbol',
              source: 'shg-restaurants-src',
              minzoom: 9,
              filter: ['==', ['get', 'isSelectedSite'], 1],
              layout: Object.assign({
                'icon-image': ['case', ['==', ['get', 'isOverture'], 1], 'shg-res-pill-overture', 'shg-res-pill-curated'],
                'icon-allow-overlap': false,
                'icon-padding': 3,
                'text-field': ['get', 'ratingText'],
                'text-size': 10,
                'text-offset': [0.62, -0.05],
                'text-anchor': 'center',
                'text-allow-overlap': false
              }, gpuTextFontProps),
              paint: {
                'text-color': '#141413'
              }
            }, topSlotProps));
          }

          if (!map.getSource('shg-sites-src')) {
            map.addSource('shg-sites-src', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
              buffer: 64,
              cluster: true,
              clusterMaxZoom: 13,
              clusterRadius: 42,
              clusterProperties: {
                visitedCount: ['+', ['get', 'isVisited']]
              }
            });
            map.addLayer(Object.assign({
              id: 'shg-sites-cluster-halo',
              type: 'circle',
              source: 'shg-sites-src',
              filter: ['has', 'point_count'],
              paint: {
                'circle-color': ['case', ['==', ['get', 'visitedCount'], ['get', 'point_count']], 'rgba(4, 120, 87, 0.16)', 'rgba(185, 56, 21, 0.16)'],
                'circle-radius': ['step', ['get', 'point_count'], 21, 8, 24, 18, 27]
              }
            }, topSlotProps));
            map.addLayer(Object.assign({
              id: 'shg-sites-cluster-circle',
              type: 'circle',
              source: 'shg-sites-src',
              filter: ['has', 'point_count'],
              paint: {
                'circle-color': ['case', ['==', ['get', 'visitedCount'], ['get', 'point_count']], '#047857', '#B93815'],
                'circle-radius': ['step', ['get', 'point_count'], 15, 8, 17.5, 18, 20],
                'circle-stroke-width': 2.4,
                'circle-stroke-color': '#FAF9F6'
              }
            }, topSlotProps));
            map.addLayer(Object.assign({
              id: 'shg-sites-cluster-count',
              type: 'symbol',
              source: 'shg-sites-src',
              filter: ['has', 'point_count'],
              layout: Object.assign({
                'text-field': ['get', 'point_count_abbreviated'],
                'text-size': 12,
                'text-allow-overlap': true
              }, gpuTextFontProps),
              paint: {
                'text-color': '#FAF9F6'
              }
            }, topSlotProps));
            map.addLayer(Object.assign({
              id: 'shg-sites-unclustered',
              type: 'symbol',
              source: 'shg-sites-src',
              filter: ['!', ['has', 'point_count']],
              layout: {
                'icon-image': ['get', 'iconName'],
                'icon-size': ['interpolate', ['linear'], ['zoom'], 8.5, 0.72, 13, 0.88, 15.5, 1.0],
                'icon-anchor': 'bottom',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'symbol-sort-key': ['get', 'index']
              }
            }, topSlotProps));
          }
        }

        function syncHcmcFocusLayer(enabled, shouldAdjustCamera) {
          isFocusHcmcOnly = Boolean(enabled);
          try {
            map.setMaxBounds(isFocusHcmcOnly ? HCMC_MAX_BOUNDS : VIETNAM_MAX_BOUNDS);
            map.setMinZoom(isFocusHcmcOnly ? HCMC_MIN_ZOOM : VIETNAM_MIN_ZOOM);
          } catch (e) {}

          if (styleReady && map.getSource('shg-hcmc-mask') && map.getSource('shg-hcmc-border')) {
            var theme = getSpotlightTheme();
            try {
              if (map.getLayer('shg-hcmc-mask-fill')) {
                map.setPaintProperty('shg-hcmc-mask-fill', 'fill-color', theme.maskColor);
                map.setPaintProperty('shg-hcmc-mask-fill', 'fill-opacity', theme.maskOpacity);
              }
              if (map.getLayer('shg-hcmc-border-glow')) {
                map.setPaintProperty('shg-hcmc-border-glow', 'line-color', theme.featherColor);
                map.setPaintProperty('shg-hcmc-border-glow', 'line-opacity', theme.featherOpacity);
              }
              if (map.getLayer('shg-hcmc-border-casing')) {
                map.setPaintProperty('shg-hcmc-border-casing', 'line-color', theme.casingColor);
              }
              if (map.getLayer('shg-hcmc-border-line')) {
                map.setPaintProperty('shg-hcmc-border-line', 'line-color', theme.lineColor);
                map.setPaintProperty('shg-hcmc-border-line', 'line-opacity', theme.lineOpacity);
                map.setPaintProperty('shg-hcmc-border-line', 'line-width', isFocusHcmcOnly ? 1.8 : 1.4);
              }
            } catch (e) {}

            // Chỉ TP.HCM: làm mờ các tỉnh xung quanh; Toàn Việt Nam: làm mờ các quốc gia ngoài lãnh thổ Việt Nam
            var activeRings = isFocusHcmcOnly ? HCMC_BOUNDARY_RINGS : VIETNAM_BOUNDARY_RINGS;
            map.getSource('shg-hcmc-mask').setData(buildInverseMaskGeoJson(activeRings));
            map.getSource('shg-hcmc-border').setData(buildBorderGeoJson(activeRings));
          }

          if (shouldAdjustCamera && !isFollowingNav) {
            try {
              if (isFocusHcmcOnly) {
                map.fitBounds(HCMC_FOCUS_BOUNDS, {
                  padding: { top: 72, bottom: 108, left: 28, right: 56 },
                  pitch: 0,
                  bearing: 0,
                  duration: 850
                });
              } else {
                map.fitBounds(VIETNAM_FOCUS_BOUNDS, {
                  padding: { top: 64, bottom: 90, left: 24, right: 48 },
                  pitch: 0,
                  bearing: 0,
                  duration: 900
                });
              }
            } catch (e) {}
          }
        }

        function syncRadiusLayer(coords, radiusMeters, force) {
          lastRadiusMeters = radiusMeters || 0;
          if (!styleReady || !map.getSource('shg-radius')) return;
          var nextSig = lastRadiusMeters > 0 && lastRadiusMeters <= 25000
            ? (coords[0].toFixed(5) + ',' + coords[1].toFixed(5) + ':' + lastRadiusMeters)
            : 'none';
          if (!force && nextSig === lastRadiusSig) return;
          lastRadiusSig = nextSig;
          if (lastRadiusMeters > 0 && lastRadiusMeters <= 25000) {
            map.getSource('shg-radius').setData(
              createCircleGeoJson([coords[1], coords[0]], lastRadiusMeters, 48)
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

          if (shouldFit && !isFollowingNav) {
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

        function updateUserHeadingVisual(heading, isNavigating) {
          if (!userMarker || !userMarkerEl) return;
          var cone = userMarkerEl.querySelector('.shg-heading-cone');
          var arrow = userMarkerEl.querySelector('.shg-nav-arrow');
          var showDir = typeof heading === 'number' && !isNaN(heading);
          if (cone) cone.style.opacity = showDir ? '1' : '0';
          if (arrow) arrow.style.opacity = (showDir && isNavigating) ? '1' : '0';
          if (showDir && typeof userMarker.setRotation === 'function') {
            userMarker.setRotation(heading);
          }
        }

        function engageNavCamera(coords, heading, durationMs, linear) {
          var targetBearing = (typeof heading === 'number' && !isNaN(heading))
            ? heading
            : map.getBearing();
          var opts = {
            center: [coords[1], coords[0]],
            zoom: 18.0,
            pitch: is3DEnabled ? 62 : 0,
            bearing: targetBearing,
            padding: { top: 230, bottom: 185, left: 0, right: 0 },
            duration: durationMs
          };
          if (linear) {
            opts.easing = function(t) { return t; };
          }
          map.easeTo(opts);
        }

        function ensureUserMarker(coords, heading, isNavigating) {
          if (!userMarker) {
            userMarkerEl = createUserMarkerElement();
            userMarker = new gl.Marker({
              element: userMarkerEl,
              draggable: true,
              anchor: 'center',
              rotationAlignment: 'map',
              pitchAlignment: 'map'
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
          updateUserHeadingVisual(heading, isNavigating);
        }

        var lastShowRestaurants = true;

        function syncSitesSourceOnly(sites) {
          if (!styleReady || !map.getSource('shg-sites-src')) return;
          ensureMarkerSprites();
          var siteFeatures = [];
          for (var i = 0; i < sites.length; i++) {
            var site = sites[i];
            var iconName = ensureSitePhotoSprite(site);
            siteFeatures.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [site.lng, site.lat] },
              properties: {
                id: site.id,
                index: site.index,
                isVisited: site.isVisited ? 1 : 0,
                isSelected: site.isSelected ? 1 : 0,
                iconName: iconName
              }
            });
          }
          try {
            map.getSource('shg-sites-src').setData({
              type: 'FeatureCollection',
              features: siteFeatures
            });
          } catch (e) {}
        }

        function syncGpuMarkers(sites, showRestaurants, forceRestaurants) {
          if (!styleReady) return;
          ensureMarkerSprites();

          var selectedSiteObj = null;
          for (var i = 0; i < sites.length; i++) {
            if (sites[i].isSelected) {
              selectedSiteObj = sites[i];
              break;
            }
          }

          syncSitesSourceOnly(sites);

          // Chỉ cập nhật GeoJSON 250+ quán ăn khi danh sách/bộ lọc/điểm chọn thực sự thay đổi (không chạy lại khi tải ảnh!)
          var resSig = (showRestaurants ? '1' : '0') + '|' + (selectedSiteObj ? selectedSiteObj.id : '') + '|' + sites.length;
          if (forceRestaurants || resSig !== lastRestaurantsSig) {
            lastRestaurantsSig = resSig;
            var resFeatures = [];
            if (showRestaurants) {
              for (var sIdx = 0; sIdx < sites.length; sIdx++) {
                var st = sites[sIdx];
                if (!Array.isArray(st.restaurants)) continue;
                var selFlag = st.isSelected ? 1 : 0;
                for (var rIdx = 0; rIdx < st.restaurants.length; rIdx++) {
                  var res = st.restaurants[rIdx];
                  var ratingNum = Number(res.rating) || 4.5;
                  resFeatures.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [res.lng, res.lat] },
                    properties: {
                      id: res.id,
                      siteId: st.id,
                      rating: ratingNum,
                      ratingText: ratingNum.toFixed(1),
                      isOverture: res.source === 'overture' ? 1 : 0,
                      isSelectedSite: selFlag
                    }
                  });
                }
              }
            }
            try {
              if (map.getSource('shg-restaurants-src')) {
                map.getSource('shg-restaurants-src').setData({
                  type: 'FeatureCollection',
                  features: resFeatures
                });
              }
            } catch (e) {}
          }

          // Chỉ dùng đúng 1 DOM marker nổi duy nhất cho địa điểm đang chọn
          if (selectedSiteMarker) {
            selectedSiteMarker.remove();
            selectedSiteMarker = null;
          }
          if (selectedSiteObj) {
            var selEl = createSiteMarkerElement(selectedSiteObj, false);
            selEl.addEventListener('click', function(ev) {
              ev.stopPropagation();
              postToHost({ type: 'SITE_CLICK', siteId: selectedSiteObj.id });
            });
            selectedSiteMarker = new gl.Marker({
              element: selEl,
              anchor: 'bottom'
            })
              .setLngLat([selectedSiteObj.lng, selectedSiteObj.lat])
              .addTo(map);
          }
        }

        function renderSites(sites, showRestaurants, forceRedraw) {
          lastShowRestaurants = !!showRestaurants;
          var sig = JSON.stringify({
            showRestaurants: lastShowRestaurants,
            sites: sites.map(function(s) {
              return [s.id, s.label, s.index, s.isVisited, s.isSelected];
            })
          });
          if (!forceRedraw && sig === lastSitesSignature) return;
          lastSitesSignature = sig;
          syncGpuMarkers(sites, lastShowRestaurants);
        }

        function setTileConfig(cfg) {
          if (!cfg || currentStyleId === cfg.id) return;
          currentStyleId = cfg.id;
          currentTile = cfg;
          styleReady = false;
          loadedPhotoSprites = {};
          loadingPhotoSprites = {};
          photoLoadQueue = [];

          var is3DCapable = cfg.renderMode === 'mapbox' || cfg.renderMode === 'vector';
          if (!is3DCapable) {
            map.easeTo({ pitch: 0, bearing: 0, duration: 350 });
          } else if (is3DEnabled) {
            map.easeTo({ pitch: 45, duration: 400 });
          }

          map.setStyle(resolveGlStyle(cfg));
        }

        map.on('style.load', function() {
          styleReady = true;
          loadedPhotoSprites = {};
          loadingPhotoSprites = {};
          photoLoadQueue = [];
          pendingSpriteBatches = [];
          lastRadiusSig = '';
          lastRestaurantsSig = '';
          applyMapboxOrOsmEnhancements(map, currentTile, is3DEnabled, currentLightPreset);
          ensureCustomOverlayLayers();
          syncHcmcFocusLayer(isFocusHcmcOnly, false);
          syncRadiusLayer(lastKnownUser, lastRadiusMeters, true);
          syncRouteLayer(lastRouteData, false);
          if (lastKnownSites.length) {
            syncGpuMarkers(lastKnownSites, lastShowRestaurants, true);
          }
        });

        function markInteractingStart() {
          isInteracting = true;
          if (interactCooldownTimer) {
            clearTimeout(interactCooldownTimer);
            interactCooldownTimer = null;
          }
          if (spriteRefreshTimer) {
            clearTimeout(spriteRefreshTimer);
            spriteRefreshTimer = null;
          }
        }

        function markInteractingEnd() {
          if (interactCooldownTimer) clearTimeout(interactCooldownTimer);
          // Đợi 150ms sau khi dừng lăn chuột / chụm tay mới giải mã ảnh & cập nhật sprite (0ms giật khung hình khi zoom!)
          interactCooldownTimer = setTimeout(function() {
            interactCooldownTimer = null;
            isInteracting = false;
            if (!styleReady) return;
            if (pendingSpriteBatches.length > 0) {
              flushPendingSpriteRegistrations();
            }
            if (photoLoadQueue.length > 0) {
              pumpPhotoLoadQueue();
            }
          }, 150);
        }

        map.on('movestart', markInteractingStart);
        map.on('zoomstart', markInteractingStart);
        map.on('moveend', markInteractingEnd);
        map.on('zoomend', markInteractingEnd);

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

        var interactiveGpuLayers = [
          'shg-sites-unclustered',
          'shg-sites-cluster-circle',
          'shg-res-selected-pills',
          'shg-res-pills',
          'shg-res-dots'
        ];

        // Dùng sự kiện cấp layer native của Mapbox thay vì queryRenderedFeatures trên từng pixel mousemove (giảm tải CPU rõ rệt)
        var hoveredInteractiveCount = 0;
        interactiveGpuLayers.forEach(function(layerId) {
          map.on('mouseenter', layerId, function() {
            hoveredInteractiveCount++;
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', layerId, function() {
            hoveredInteractiveCount = Math.max(0, hoveredInteractiveCount - 1);
            if (hoveredInteractiveCount === 0) {
              map.getCanvas().style.cursor = '';
            }
          });
        });

        map.on('click', function(e) {
          // 1. Ưu tiên xử lý chạm vào điểm di tích, cụm di tích hoặc quán ăn trên lớp GPU WebGL
          if (styleReady) {
            try {
              var activeLayers = interactiveGpuLayers.filter(function(id) { return !!map.getLayer(id); });
              if (activeLayers.length) {
                var hits = map.queryRenderedFeatures(e.point, { layers: activeLayers });
                if (hits && hits.length > 0) {
                  var top = hits[0];
                  var lid = top.layer && top.layer.id;
                  var props = top.properties || {};
                  if (lid === 'shg-sites-unclustered' && props.id) {
                    var coords = top.geometry && top.geometry.coordinates;
                    postToHost({ type: 'SITE_CLICK', siteId: String(props.id) });
                    if (coords && coords.length >= 2) {
                      map.easeTo({
                        center: [coords[0], coords[1]],
                        zoom: Math.max(map.getZoom(), 15.8),
                        duration: 420
                      });
                    }
                    return;
                  }
                  if (lid === 'shg-sites-cluster-circle' && typeof props.cluster_id !== 'undefined') {
                    var cCoords = top.geometry && top.geometry.coordinates;
                    var src = map.getSource('shg-sites-src');
                    if (src && typeof src.getClusterExpansionZoom === 'function') {
                      src.getClusterExpansionZoom(props.cluster_id, function(err, zoom) {
                        if (err) return;
                        map.easeTo({
                          center: cCoords,
                          zoom: Math.min(Math.max(zoom + 0.6, 13.8), 16.2),
                          duration: 380
                        });
                      });
                    } else if (cCoords) {
                      map.easeTo({
                        center: cCoords,
                        zoom: Math.min(map.getZoom() + 2.4, 15.5),
                        duration: 380
                      });
                    }
                    return;
                  }
                  if (
                    (lid === 'shg-res-selected-pills' || lid === 'shg-res-pills' || lid === 'shg-res-dots') &&
                    props.id &&
                    props.siteId
                  ) {
                    var rCoords = top.geometry && top.geometry.coordinates;
                    postToHost({
                      type: 'RESTAURANT_CLICK',
                      restaurantId: String(props.id),
                      siteId: String(props.siteId)
                    });
                    if (rCoords && rCoords.length >= 2) {
                      map.easeTo({
                        center: [rCoords[0], rCoords[1]],
                        zoom: Math.max(map.getZoom(), 16.2),
                        duration: 380
                      });
                    }
                    return;
                  }
                }
              }
            } catch (err) {}
          }

          var placeName = '';
          var placeCategory = '';
          try {
            var feats = map.queryRenderedFeatures(e.point);
            for (var i = 0; i < feats.length; i++) {
              var fprops = feats[i].properties || {};
              var candidate = fprops['name_vi'] || fprops['name:vi'] || fprops.name || fprops['name_en'] || '';
              if (candidate) {
                placeName = String(candidate);
                placeCategory = String(fprops.category_en || fprops.subclass || fprops.class || '');
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

        map.on('dragstart', function() {
          if (isFollowingNav) {
            isFollowingNav = false;
            postToHost({ type: 'NAV_FOLLOW_CHANGED', following: false });
          }
        });

        window.__SHG_UPDATE__ = function(state) {
          if (!state) return;
          var hasRoute = Boolean(state.route && Array.isArray(state.route.coordinates) && state.route.coordinates.length >= 2);
          if (typeof state.followNav === 'boolean') {
            isFollowingNav = hasRoute && state.followNav;
          }
          if (typeof state.userHeading === 'number') {
            lastKnownHeading = state.userHeading;
          } else if (!hasRoute) {
            lastKnownHeading = null;
          }

          if (state.lightPreset && state.lightPreset !== currentLightPreset) {
            currentLightPreset = state.lightPreset;
            if (styleReady) {
              applyMapboxOrOsmEnhancements(map, currentTile, is3DEnabled, currentLightPreset);
            }
            syncHcmcFocusLayer(isFocusHcmcOnly, false);
          }
          if (typeof state.focusHcmcOnly === 'boolean' && state.focusHcmcOnly !== isFocusHcmcOnly) {
            syncHcmcFocusLayer(state.focusHcmcOnly, true);
          }
          if (typeof state.is3D === 'boolean' && state.is3D !== is3DEnabled) {
            is3DEnabled = state.is3D;
            if (styleReady) {
              applyMapboxOrOsmEnhancements(map, currentTile, is3DEnabled, currentLightPreset);
              map.easeTo({
                pitch: is3DEnabled ? (isFollowingNav ? 62 : 48) : 0,
                bearing: is3DEnabled ? (isFollowingNav && typeof lastKnownHeading === 'number' ? lastKnownHeading : -14) : 0,
                duration: 500
              });
            }
          }
          if (state.tileConfig) {
            setTileConfig(state.tileConfig);
          }

          var nextKey = state.route ? state.route.key : '';
          var routeJustStarted = nextKey && nextKey !== lastRouteKey;
          if (nextKey !== lastRouteKey) {
            lastRouteKey = nextKey;
            syncRouteLayer(state.route || null, !isFollowingNav);
          }

          if (Array.isArray(state.userLocation) && state.userLocation.length === 2) {
            lastKnownUser = state.userLocation;
            ensureUserMarker(state.userLocation, lastKnownHeading, hasRoute);
            syncRadiusLayer(state.userLocation, hasRoute ? 0 : (state.searchRadiusMeters || 0));

            if (hasRoute && isFollowingNav) {
              // Góc nhìn 3D Heading-Up Chase-Cam mượt mà theo hướng điện thoại / OSRM
              if (routeJustStarted || !wasInNavMode) {
                engageNavCamera(state.userLocation, lastKnownHeading, 850, false);
              } else {
                engageNavCamera(
                  state.userLocation,
                  lastKnownHeading,
                  state.isSimulatingWalk ? 260 : 420,
                  Boolean(state.isSimulatingWalk)
                );
              }
            } else {
              if (wasInNavMode && !hasRoute) {
                map.easeTo({
                  center: [state.userLocation[1], state.userLocation[0]],
                  zoom: 15.8,
                  pitch: is3DEnabled ? 45 : 0,
                  bearing: is3DEnabled ? -12 : 0,
                  padding: { top: 0, bottom: 0, left: 0, right: 0 },
                  duration: 650
                });
              } else {
                var latDiff = Math.abs(prevUserCenter[0] - state.userLocation[0]);
                var lngDiff = Math.abs(prevUserCenter[1] - state.userLocation[1]);
                if (latDiff > 0.012 || lngDiff > 0.012) {
                  map.flyTo({
                    center: [state.userLocation[1], state.userLocation[0]],
                    zoom: 15.6,
                    duration: 850
                  });
                }
              }
            }
            prevUserCenter = state.userLocation;
          }
          wasInNavMode = hasRoute;

          if (Array.isArray(state.sites)) {
            lastKnownSites = state.sites;
            renderSites(state.sites, !!state.showRestaurants);
          }
        };

        window.__SHG_CMD__ = function(cmd) {
          if (!cmd || !cmd.type) return;
          if (cmd.type === 'FIT_ALL') {
            isFollowingNav = false;
            postToHost({ type: 'NAV_FOLLOW_CHANGED', following: false });
            var pts = [[lastKnownUser[1], lastKnownUser[0]]];
            if (lastRouteData && Array.isArray(lastRouteData.coordinates) && lastRouteData.coordinates.length > 1) {
              lastRouteData.coordinates.forEach(function(pt) { pts.push([pt[1], pt[0]]); });
            } else {
              lastKnownSites.forEach(function(s) { pts.push([s.lng, s.lat]); });
            }
            if (pts.length > 1) {
              var b = new gl.LngLatBounds(pts[0], pts[0]);
              pts.forEach(function(p) { b.extend(p); });
              map.fitBounds(b, {
                padding: { top: 72, bottom: lastRouteData ? 225 : 110, left: 40, right: 56 },
                maxZoom: 16,
                pitch: 0,
                bearing: 0,
                duration: 650
              });
            } else {
              map.flyTo({ center: [lastKnownUser[1], lastKnownUser[0]], zoom: 15.5, duration: 600 });
            }
          } else if (cmd.type === 'RECENTER_NAV') {
            isFollowingNav = true;
            engageNavCamera(lastKnownUser, lastKnownHeading, 750, false);
          } else if (cmd.type === 'CENTER_USER') {
            if (lastRouteData) {
              isFollowingNav = true;
              engageNavCamera(lastKnownUser, lastKnownHeading, 750, false);
            } else {
              map.flyTo({
                center: [lastKnownUser[1], lastKnownUser[0]],
                zoom: 16.5,
                pitch: is3DEnabled ? 48 : 0,
                duration: 650
              });
            }
          } else if (cmd.type === 'ZOOM_IN') {
            map.zoomIn({ duration: 180 });
          } else if (cmd.type === 'ZOOM_OUT') {
            map.zoomOut({ duration: 180 });
          } else if (cmd.type === 'UPDATE_USER') {
            var hasActiveRoute = Boolean(lastRouteData && Array.isArray(lastRouteData.coordinates) && lastRouteData.coordinates.length >= 2);
            if (typeof cmd.followNav === 'boolean') {
              isFollowingNav = hasActiveRoute && cmd.followNav;
            }
            if (typeof cmd.userHeading === 'number') {
              lastKnownHeading = cmd.userHeading;
            } else if (!hasActiveRoute) {
              lastKnownHeading = null;
            }
            if (Array.isArray(cmd.userLocation) && cmd.userLocation.length === 2) {
              lastKnownUser = cmd.userLocation;
              ensureUserMarker(cmd.userLocation, lastKnownHeading, hasActiveRoute);
              syncRadiusLayer(cmd.userLocation, hasActiveRoute ? 0 : (cmd.searchRadiusMeters || 0), false);
              if (hasActiveRoute && isFollowingNav) {
                engageNavCamera(
                  cmd.userLocation,
                  lastKnownHeading,
                  cmd.isSimulatingWalk ? 260 : 400,
                  Boolean(cmd.isSimulatingWalk)
                );
              } else {
                var latD = Math.abs(prevUserCenter[0] - cmd.userLocation[0]);
                var lngD = Math.abs(prevUserCenter[1] - cmd.userLocation[1]);
                if (latD > 0.012 || lngD > 0.012) {
                  map.flyTo({
                    center: [cmd.userLocation[1], cmd.userLocation[0]],
                    zoom: 15.6,
                    duration: 700
                  });
                }
              }
              prevUserCenter = cmd.userLocation;
            }
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
            if (styleReady) {
              applyMapboxOrOsmEnhancements(map, currentTile, is3DEnabled, currentLightPreset);
            }
            syncHcmcFocusLayer(isFocusHcmcOnly, false);
          } else if (cmd.type === 'FIT_SCOPE') {
            isFollowingNav = false;
            syncHcmcFocusLayer(Boolean(cmd.focusHcmcOnly), true);
          } else if (cmd.type === 'FLY_TO' && typeof cmd.lat === 'number' && typeof cmd.lng === 'number') {
            map.flyTo({ center: [cmd.lng, cmd.lat], zoom: cmd.zoom || 16, duration: 650 });
          } else if (cmd.type === 'RESIZE') {
            try { map.resize(); } catch (e) {}
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
          var vnLeafletBounds = L.latLngBounds(
            [VIETNAM_MAX_BOUNDS[0][1], VIETNAM_MAX_BOUNDS[0][0]],
            [VIETNAM_MAX_BOUNDS[1][1], VIETNAM_MAX_BOUNDS[1][0]]
          );
          var hcmcLeafletBounds = L.latLngBounds(
            [HCMC_MAX_BOUNDS[0][1], HCMC_MAX_BOUNDS[0][0]],
            [HCMC_MAX_BOUNDS[1][1], HCMC_MAX_BOUNDS[1][0]]
          );
          var leafletFocusHcmc = Boolean(INITIAL_FOCUS_HCMC);
          var map = L.map('map', {
            center: INITIAL_CENTER,
            zoom: 15,
            minZoom: leafletFocusHcmc ? 9 : 5,
            maxBounds: leafletFocusHcmc ? hcmcLeafletBounds : vnLeafletBounds,
            maxBoundsViscosity: 1.0,
            zoomControl: false
          });
          var tileLayer = L.tileLayer(INITIAL_TILE.url, {
            subdomains: INITIAL_TILE.subdomains || 'abc',
            attribution: INITIAL_TILE.attribution || '',
            maxZoom: 19
          }).addTo(map);
          var maskLayer = L.layerGroup().addTo(map);
          var sitesLayer = L.layerGroup().addTo(map);
          var routeLayer = L.layerGroup().addTo(map);
          var userLayer = L.layerGroup().addTo(map);
          var userMarker = null;
          var lastKnownUser = INITIAL_CENTER;
          var lastKnownSites = [];

          function renderLeafletHcmcMask(enabled, shouldAdjustCamera) {
            maskLayer.clearLayers();
            map.setMaxBounds(enabled ? hcmcLeafletBounds : vnLeafletBounds);
            map.setMinZoom(enabled ? 8 : 5);
            var activeRings = enabled ? HCMC_BOUNDARY_RINGS : VIETNAM_BOUNDARY_RINGS;
            var outer = [[-8, 82], [36, 82], [36, 136], [-8, 136]];
            var holes = activeRings.map(function(ring) {
              return ring.map(function(pt) { return [pt[1], pt[0]]; });
            });
            L.polygon([outer].concat(holes), {
              color: '#FFFFFF',
              weight: 4,
              opacity: 0.9,
              fillColor: '#F3F0E9',
              fillOpacity: 0.78,
              interactive: false
            }).addTo(maskLayer);
            holes.forEach(function(hole) {
              L.polyline(hole, {
                color: '#B93815',
                weight: 1.8,
                opacity: 0.85,
                interactive: false
              }).addTo(maskLayer);
            });
            if (shouldAdjustCamera) {
              var target = enabled ? HCMC_FOCUS_BOUNDS : VIETNAM_FOCUS_BOUNDS;
              map.fitBounds([
                [target[0][1], target[0][0]],
                [target[1][1], target[1][0]]
              ], { padding: [36, 56] });
            }
          }

          renderLeafletHcmcMask(leafletFocusHcmc, false);

          map.on('click', function(e) {
            postToHost({ type: 'MAP_CLICK', lat: e.latlng.lat, lng: e.latlng.lng });
          });

          window.__SHG_UPDATE__ = function(state) {
            if (!state) return;
            if (typeof state.focusHcmcOnly === 'boolean' && state.focusHcmcOnly !== leafletFocusHcmc) {
              leafletFocusHcmc = state.focusHcmcOnly;
              renderLeafletHcmcMask(leafletFocusHcmc, true);
            }
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
              L.polyline(state.route.coordinates, { color: '#FAF9F6', weight: 9 }).addTo(routeLayer);
              L.polyline(state.route.coordinates, { color: '#B93815', weight: 5 }).addTo(routeLayer);
            }
          };

          window.__SHG_CMD__ = function(cmd) {
            if (!cmd) return;
            if (cmd.type === 'CENTER_USER') map.flyTo(lastKnownUser, 16);
            if (cmd.type === 'ZOOM_IN') map.zoomIn();
            if (cmd.type === 'ZOOM_OUT') map.zoomOut();
            if (cmd.type === 'FIT_SCOPE') {
              leafletFocusHcmc = Boolean(cmd.focusHcmcOnly);
              renderLeafletHcmcMask(leafletFocusHcmc, true);
            }
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

export const MapExplorer: React.FC<MapExplorerProps> = React.memo(({
  userLocation,
  userHeading = null,
  sites,
  selectedSiteId,
  visitedRecords,
  selectedLanguage,
  activeRoute,
  isRoutingLoading = false,
  activeWalkSeconds,
  isSimulatingWalk,
  searchRadiusMeters,
  focusHcmcOnly = true,
  isVisible = true,
  onToggleFocusHcmcOnly,
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
  const [autoLightByTime, setAutoLightByTime] = useState<boolean>(true);
  const [lightPreset, setLightPreset] = useState<MapboxLightPreset>(() =>
    getRealtimeLightPreset()
  );
  const [clockLabel, setClockLabel] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [showRestaurantsOnMap, setShowRestaurantsOnMap] =
    useState<boolean>(true);
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
  const [isFollowingNav, setIsFollowingNav] = useState<boolean>(true);
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
        activeMapboxToken,
        focusHcmcOnly,
        getRealtimeLightPreset()
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
      setIsFollowingNav(true);
      setIs3DView(true);
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

  // Tách riêng danh sách 97 địa điểm + 250+ quán ăn để KHÔNG phải serialize lại 60KB JSON khi chỉ đổi GPS hoặc góc la bàn!
  const serializedSites = useMemo<SerializedSiteMarker[]>(() => {
    const visitedIdSet = new Set(visitedRecords.map((r) => r.siteId));
    return sites.map((site, idx) => {
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
          source: res.source,
        })),
      };
    });
  }, [sites, visitedRecords, selectedLanguage, selectedSiteId, focusedSite?.id]);

  // Ref giữ trạng thái GPS/la bàn mới nhất cho full sync đầu tiên mà không ép re-build payload nặng
  const liveUserStateRef = useRef({
    userLocation,
    userHeading: userHeading ?? null,
    followNav: isFollowingNav,
    isSimulatingWalk,
    searchRadiusMeters,
  });
  liveUserStateRef.current = {
    userLocation,
    userHeading: userHeading ?? null,
    followNav: isFollowingNav,
    isSimulatingWalk,
    searchRadiusMeters,
  };

  const mapStatePayload = useMemo<MapStatePayload>(() => {
    const u = liveUserStateRef.current;
    return {
      tileConfig: currentTileConfig,
      is3D: is3DView,
      lightPreset,
      selectedLanguage,
      userLocation: u.userLocation,
      userHeading: u.userHeading,
      followNav: u.followNav,
      isSimulatingWalk: u.isSimulatingWalk,
      searchRadiusMeters: u.searchRadiusMeters,
      focusHcmcOnly,
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
    focusHcmcOnly,
    serializedSites,
    showRestaurantsOnMap,
    activeRoute,
  ]);

  const hasFlushedInitialRef = useRef<boolean>(false);

  useEffect(() => {
    latestPayloadRef.current = mapStatePayload;
    if (!isMapReady) return;
    // Cho phép flush 1 lần đầu tiên khi pre-warm ngầm, sau đó chỉ gửi khi tab Bản đồ đang hiển thị để tiết kiệm CPU
    if (!isVisible && hasFlushedInitialRef.current) return;
    hasFlushedInitialRef.current = true;
    sendToMap({ type: 'UPDATE_STATE', payload: mapStatePayload });
  }, [isMapReady, isVisible, mapStatePayload, sendToMap]);

  // Kênh siêu nhẹ (~120 bytes) chỉ cập nhật GPS/la bàn — hoàn toàn không gửi lại 97 di tích & 250 quán ăn qua bridge!
  useEffect(() => {
    if (!isMapReady || !isVisible) return;
    sendToMap({
      type: 'CMD',
      command: {
        type: 'UPDATE_USER',
        userLocation,
        userHeading: userHeading ?? null,
        followNav: isFollowingNav,
        isSimulatingWalk,
        searchRadiusMeters,
      },
    });
  }, [
    isMapReady,
    isVisible,
    userLocation,
    userHeading,
    isFollowingNav,
    isSimulatingWalk,
    searchRadiusMeters,
    sendToMap,
  ]);

  // Ngay khi người dùng chuyển sang tab Bản đồ -> resize tức thì + đẩy dữ liệu mới nhất (0ms reload!)
  useEffect(() => {
    if (!isVisible || !isMapReady) return;
    sendToMap({ type: 'CMD', command: { type: 'RESIZE' } });
    if (latestPayloadRef.current) {
      hasFlushedInitialRef.current = true;
      sendToMap({ type: 'UPDATE_STATE', payload: latestPayloadRef.current });
    }
  }, [isVisible, isMapReady, sendToMap]);

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
        case 'NAV_FOLLOW_CHANGED':
          setIsFollowingNav(Boolean(msg.following));
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
    setIsFollowingNav(false);
    sendToMap({ type: 'CMD', command: { type: 'FIT_ALL' } });
  }, [sendToMap]);

  const handleRecenterNav3D = useCallback(() => {
    setIsFollowingNav(true);
    setIs3DView(true);
    sendToMap({ type: 'CMD', command: { type: 'RECENTER_NAV' } });
  }, [sendToMap]);

  const handleCenterOnGps = useCallback(() => {
    if (activeRoute) {
      handleRecenterNav3D();
      return;
    }
    onDetectRealGps?.();
    sendToMap({ type: 'CMD', command: { type: 'CENTER_USER' } });
  }, [activeRoute, handleRecenterNav3D, onDetectRealGps, sendToMap]);

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

  // Tự động đồng bộ ánh sáng bản đồ realtime theo giờ thực tế (mỗi 30s + khi mở lại app/tab)
  useEffect(() => {
    const syncClockAndLight = () => {
      const now = new Date();
      const nextClock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setClockLabel((prev) => (prev === nextClock ? prev : nextClock));
      if (!autoLightByTime) return;
      const nextPreset = getRealtimeLightPreset(now);
      setLightPreset((prev) => {
        if (prev === nextPreset) return prev;
        sendToMap({ type: 'CMD', command: { type: 'SET_LIGHT', preset: nextPreset } });
        return nextPreset;
      });
    };

    syncClockAndLight();
    const timer = setInterval(syncClockAndLight, 30000);
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncClockAndLight();
    });

    let cleanupVisibility: (() => void) | undefined;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const onVis = () => {
        if (document.visibilityState === 'visible') syncClockAndLight();
      };
      document.addEventListener('visibilitychange', onVis);
      cleanupVisibility = () => document.removeEventListener('visibilitychange', onVis);
    }

    return () => {
      clearInterval(timer);
      appStateSub.remove();
      cleanupVisibility?.();
    };
  }, [autoLightByTime, sendToMap]);

  const handleResumeRealtimeLight = useCallback(() => {
    const realtime = getRealtimeLightPreset();
    setAutoLightByTime(true);
    setLightPreset(realtime);
    sendToMap({ type: 'CMD', command: { type: 'SET_LIGHT', preset: realtime } });
  }, [sendToMap]);

  const handleCycleLightPreset = useCallback(() => {
    const order: MapboxLightPreset[] = ['dawn', 'day', 'dusk', 'night'];
    if (autoLightByTime) {
      // Đang ở chế độ tự động theo giờ -> chuyển sang xem trước khung giờ kế tiếp
      setAutoLightByTime(false);
      setLightPreset((prev) => {
        const next = order[(order.indexOf(prev) + 1) % order.length];
        sendToMap({ type: 'CMD', command: { type: 'SET_LIGHT', preset: next } });
        return next;
      });
      return;
    }
    const realtime = getRealtimeLightPreset();
    const nextIdx = (order.indexOf(lightPreset) + 1) % order.length;
    const next = order[nextIdx];
    if (next === realtime) {
      // Khi quay vòng đúng khung giờ thực tế -> bật lại chế độ tự động realtime
      setAutoLightByTime(true);
    }
    setLightPreset(next);
    sendToMap({ type: 'CMD', command: { type: 'SET_LIGHT', preset: next } });
  }, [autoLightByTime, lightPreset, sendToMap]);

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
  const showLightButton = Boolean(currentTileConfig.supportsLightPreset);

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
              cacheEnabled
              androidLayerType="hardware"
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

      {/* Top-Left Region Scope Switcher (TP.HCM · sương mờ tỉnh lân cận vs Việt Nam) + Realtime Clock Pill */}
      <View style={styles.topLeftPlaceWrap} pointerEvents="box-none">
        {!activeRoute && (
          <View style={styles.topLeftRow} pointerEvents="box-none">
            <View style={styles.scopeSegmentedPill}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => {
                  onToggleFocusHcmcOnly?.(true);
                  sendToMap({ type: 'CMD', command: { type: 'FIT_SCOPE', focusHcmcOnly: true } });
                }}
                style={[
                  styles.scopeSegBtn,
                  focusHcmcOnly && styles.scopeSegBtnActive,
                ]}
                accessibilityLabel="Chỉ hiển thị TP.HCM và làm mờ các tỉnh xung quanh"
              >
                <MapPin
                  size={12}
                  color={focusHcmcOnly ? COLORS.white : COLORS.inkMuted}
                  strokeWidth={2.4}
                />
                <Text
                  style={[
                    styles.scopeSegText,
                    focusHcmcOnly && styles.scopeSegTextActive,
                  ]}
                >
                  TP.HCM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => {
                  onToggleFocusHcmcOnly?.(false);
                  sendToMap({ type: 'CMD', command: { type: 'FIT_SCOPE', focusHcmcOnly: false } });
                }}
                style={[
                  styles.scopeSegBtn,
                  !focusHcmcOnly && styles.scopeSegBtnActive,
                ]}
                accessibilityLabel="Mở bản đồ toàn lãnh thổ Việt Nam"
              >
                <Globe
                  size={12}
                  color={!focusHcmcOnly ? COLORS.white : COLORS.inkMuted}
                  strokeWidth={2.2}
                />
                <Text
                  style={[
                    styles.scopeSegText,
                    !focusHcmcOnly && styles.scopeSegTextActive,
                  ]}
                >
                  Việt Nam
                </Text>
              </TouchableOpacity>
            </View>

            {showLightButton && (
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={autoLightByTime ? handleCycleLightPreset : handleResumeRealtimeLight}
                style={[
                  styles.realtimeClockPill,
                  lightPreset === 'night' && styles.realtimeClockPillNight,
                ]}
                accessibilityLabel={
                  autoLightByTime
                    ? `Ánh sáng realtime theo giờ ${clockLabel} (${getLightPresetLabel(lightPreset)}). Chạm để đổi thử khung giờ`
                    : `Đang xem trước ${getLightPresetLabel(lightPreset)}. Chạm để quay về giờ thực tế`
                }
              >
                {autoLightByTime && <View style={styles.realtimeClockDot} />}
                {lightPreset === 'dawn' ? (
                  <Sunrise size={12} color={COLORS.accent} />
                ) : lightPreset === 'day' ? (
                  <Sun size={12} color="#D97706" />
                ) : lightPreset === 'dusk' ? (
                  <Sunset size={12} color="#C2410C" />
                ) : (
                  <Moon size={11.5} color="#FDE68A" />
                )}
                <Text
                  style={[
                    styles.realtimeClockText,
                    lightPreset === 'night' && styles.realtimeClockTextNight,
                  ]}
                >
                  {autoLightByTime
                    ? `${clockLabel} · ${getLightPresetLabel(lightPreset)}`
                    : `${getLightPresetLabel(lightPreset)} · Tự động`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {tappedPlace && !activeRoute && !focusedSite && !focusedRestaurant && (
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
        )}
      </View>

      {/* Minimalist Unified Top-Right Frosted Glass Dock (Layers · 3D · Light · Food) */}
      <View style={styles.topRightControls} pointerEvents="box-none">
        <View style={styles.controlDock}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowStyleMenu((prev) => !prev)}
            style={[
              styles.dockBtn,
              showStyleMenu && styles.dockBtnActive,
            ]}
            accessibilityLabel="Chọn lớp bản đồ"
          >
            <Layers
              size={16}
              color={showStyleMenu ? COLORS.white : COLORS.ink}
            />
          </TouchableOpacity>

          {is3DCapable && (
            <>
              <View style={styles.dockDivider} />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleToggle3D}
                style={[
                  styles.dockBtn,
                  is3DView && styles.dockBtn3DActive,
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
            </>
          )}

          {showLightButton && (
            <>
              <View style={styles.dockDivider} />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCycleLightPreset}
                style={styles.dockBtn}
                accessibilityLabel={
                  autoLightByTime
                    ? `Ánh sáng tự động theo giờ thực tế (${getLightPresetLabel(lightPreset)})`
                    : `Đang chọn thủ công: ${getLightPresetLabel(lightPreset)}`
                }
              >
                {lightPreset === 'dawn' ? (
                  <Sunrise size={16} color={COLORS.accent} />
                ) : lightPreset === 'day' ? (
                  <Sun size={16} color="#D97706" />
                ) : lightPreset === 'dusk' ? (
                  <Sunset size={16} color="#C2410C" />
                ) : (
                  <Moon size={15} color={COLORS.ink} />
                )}
                {autoLightByTime && <View style={styles.realtimeLightDot} />}
              </TouchableOpacity>
            </>
          )}

          <View style={styles.dockDivider} />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowRestaurantsOnMap((prev) => !prev)}
            style={[
              styles.dockBtn,
              showRestaurantsOnMap && styles.dockBtnActive,
            ]}
            accessibilityLabel="Hiện hoặc ẩn quán ăn quanh di tích"
          >
            <Utensils
              size={15}
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

      {/* Minimalist Bottom-Right Controls (Unified Zoom/Fit Dock + GPS Anchor) */}
      <View
        style={[
          styles.rightControls,
          activeRoute || focusedSite || focusedRestaurant
            ? styles.rightControlsRaised
            : null,
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.controlDock}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleZoomIn}
            style={styles.dockBtn}
            accessibilityLabel="Phóng to bản đồ"
          >
            <Plus size={16} color={COLORS.ink} />
          </TouchableOpacity>
          <View style={styles.dockDivider} />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleZoomOut}
            style={styles.dockBtn}
            accessibilityLabel="Thu nhỏ bản đồ"
          >
            <Minus size={16} color={COLORS.ink} />
          </TouchableOpacity>
          <View style={styles.dockDivider} />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleFitAllMarkers}
            style={styles.dockBtn}
            accessibilityLabel="Xem toàn cảnh các di tích"
          >
            <Maximize2 size={15} color={COLORS.ink} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCenterOnGps}
          style={[
            styles.roundControlBtn,
            activeRoute && isFollowingNav && styles.roundControlBtn3DActive,
          ]}
          accessibilityLabel={
            activeRoute
              ? 'Bám theo hướng đi 3D'
              : 'Về vị trí GPS của tôi'
          }
        >
          {activeRoute ? (
            <Compass
              size={19}
              color={isFollowingNav ? COLORS.white : COLORS.accent}
            />
          ) : (
            <LocateFixed size={19} color={COLORS.ink} />
          )}
        </TouchableOpacity>
      </View>

      {/* Re-center 3D Heading-Up Pill when user manually panned away during OSRM navigation */}
      {activeRoute && !isFollowingNav && !isRoutingLoading && (
        <View style={styles.recenterNavWrap} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleRecenterNav3D}
            style={styles.recenterNavBtn}
          >
            <Compass size={15} color={COLORS.white} />
            <Text style={styles.recenterNavText}>Bám theo hướng đi 3D</Text>
          </TouchableOpacity>
        </View>
      )}

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
                <View style={styles.previewTagRow}>
                  <Text style={styles.restaurantCuisine} numberOfLines={1}>
                    {focusedRestaurant.restaurant.cuisine}
                  </Text>
                  {focusedRestaurant.restaurant.source === 'overture' && (
                    <View style={styles.overtureBadge}>
                      <Text style={styles.overtureBadgeText}>Overture Maps</Text>
                    </View>
                  )}
                </View>
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
              {focusedRestaurant.restaurant.address ||
                focusedRestaurant.restaurant.specialtyDishes.join(' · ')}
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
});

MapExplorer.displayName = 'MapExplorer';

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
    gap: 6,
  },
  scopeSegmentedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 249, 246, 0.92)',
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.08)',
    padding: 3.5,
    gap: 3,
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as object)
      : {}),
    ...SHADOWS.floating,
  },
  scopeSegBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: RADII.pill,
  },
  scopeSegBtnActive: {
    backgroundColor: COLORS.ink,
  },
  scopeSegText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
    color: COLORS.inkSecondary,
  },
  scopeSegTextActive: {
    color: COLORS.white,
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
  controlDock: {
    width: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(250, 249, 246, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.08)',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as object)
      : {}),
    ...SHADOWS.floating,
  },
  dockBtn: {
    width: 40,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  realtimeLightDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#FAF9F6',
  },
  topLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  realtimeClockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 249, 246, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.09)',
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } as object)
      : {}),
    ...SHADOWS.floating,
  },
  realtimeClockPillNight: {
    backgroundColor: 'rgba(18, 23, 34, 0.88)',
    borderColor: 'rgba(253, 230, 138, 0.24)',
  },
  realtimeClockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  realtimeClockText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.1,
  },
  realtimeClockTextNight: {
    color: '#FAF9F6',
  },
  dockBtnActive: {
    backgroundColor: COLORS.ink,
  },
  dockBtn3DActive: {
    backgroundColor: COLORS.accent,
  },
  dockDivider: {
    height: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.08)',
    marginHorizontal: 9,
  },
  roundControlBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(250, 249, 246, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as object)
      : {}),
    ...SHADOWS.floating,
  },
  roundControlBtnActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  roundControlBtn3DActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
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
  recenterNavWrap: {
    position: 'absolute',
    left: SPACING.md,
    bottom: 228,
    zIndex: 18,
  },
  recenterNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gpsBlue,
    borderRadius: RADII.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    ...SHADOWS.floating,
  },
  recenterNavText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
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
    backgroundColor: 'rgba(250, 249, 246, 0.96)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.08)',
    padding: SPACING.md + 2,
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as object)
      : {}),
    ...SHADOWS.floating,
  },
  previewCardRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  previewThumb: {
    width: 84,
    height: 90,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
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
    borderRadius: RADII.pill,
    paddingVertical: 9,
    paddingHorizontal: 12,
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
    borderRadius: RADII.pill,
    paddingVertical: 9,
    paddingHorizontal: 12,
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
  overtureBadge: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
    borderWidth: 1,
    borderRadius: RADII.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  overtureBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#C2410C',
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
