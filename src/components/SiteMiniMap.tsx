import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { HeritageSite, NearbyRestaurant } from '../types/heritage';
import { createTileLayer } from '../services/mapTiles';

interface SiteMiniMapProps {
  site: HeritageSite;
  userLocation: [number, number];
  restaurants: Array<NearbyRestaurant & { distanceMeters: number }>;
  onSelectRestaurant?: (restaurant: NearbyRestaurant) => void;
}

export const SiteMiniMap: React.FC<SiteMiniMapProps> = ({
  site,
  userLocation,
  restaurants,
  onSelectRestaurant,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: [site.lat, site.lng],
      zoom: 16,
      zoomControl: true,
    });

    createTileLayer('topo').addTo(map);
    overlayRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const timer = setTimeout(() => {
      if (mapRef.current === map) map.invalidateSize();
    }, 100);

    const ro = new ResizeObserver(() => {
      if (mapRef.current === map) map.invalidateSize();
    });
    ro.observe(el);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const overlay = overlayRef.current;
    if (!map || !overlay) return;

    overlay.clearLayers();

    const siteIcon = L.divIcon({
      className: 'custom-heritage-marker',
      html: `<div class="shg-pin-badge" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 5px;border-radius:999px;background:#141413;color:#ffffff;border:2px solid #ffffff;box-shadow:0 4px 14px rgba(0,0,0,0.26);font-weight:700;font-size:11px;white-space:nowrap;">
        <span style="width:7px;height:7px;border-radius:999px;background:#fbbf24;"></span>
        <span>${site.translations.vi.name}</span>
      </div>`,
      iconSize: [180, 28],
      iconAnchor: [90, 14],
    });

    L.marker([site.lat, site.lng], { icon: siteIcon }).addTo(overlay);

    const boundsPoints: [number, number][] = [[site.lat, site.lng]];

    restaurants.forEach((res) => {
      boundsPoints.push([res.lat, res.lng]);

      const resIcon = L.divIcon({
        className: 'custom-restaurant-marker',
        html: `<div class="shg-pin-badge" style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;background:#B93815;color:#ffffff;border:1.5px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.22);font-size:10.5px;font-weight:700;white-space:nowrap;">
          <span>★ ${res.rating.toFixed(1)}</span>
          <span>${res.name.length > 18 ? res.name.slice(0, 16) + '…' : res.name}</span>
        </div>`,
        iconSize: [140, 24],
        iconAnchor: [70, 12],
      });

      const marker = L.marker([res.lat, res.lng], { icon: resIcon }).addTo(
        overlay
      );
      marker.on('click', () => {
        onSelectRestaurant?.(res);
      });

      L.polyline(
        [
          [site.lat, site.lng],
          [res.lat, res.lng],
        ],
        {
          color: '#B93815',
          weight: 2,
          dashArray: '4 4',
          opacity: 0.75,
        }
      ).addTo(overlay);
    });

    if (boundsPoints.length > 1) {
      map.fitBounds(L.latLngBounds(boundsPoints), {
        padding: [36, 36],
        maxZoom: 16,
      });
    } else {
      map.setView([site.lat, site.lng], 16);
    }
  }, [site, userLocation, restaurants]);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl border border-[#E6E4DD] bg-[#EFEDE6]">
      <div ref={containerRef} className="absolute inset-0 h-full w-full z-0" />
    </div>
  );
};
