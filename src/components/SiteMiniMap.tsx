import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { HeritageSite, NearbyRestaurant } from '../types/heritage';
import { resolveMapStyleUrl } from '../services/mapTiles';

interface SiteMiniMapProps {
  site: HeritageSite;
  userLocation: [number, number];
  restaurants: Array<NearbyRestaurant & { distanceMeters: number }>;
  onSelectRestaurant?: (restaurant: NearbyRestaurant) => void;
}

export const SiteMiniMap: React.FC<SiteMiniMapProps> = ({
  site,
  restaurants,
  onSelectRestaurant,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = new maplibregl.Map({
      container: el,
      style: resolveMapStyleUrl('liberty'),
      center: [site.lng, site.lat],
      zoom: 15.6,
      pitch: 36,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'bottom-right'
    );

    mapRef.current = map;

    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Pin Di tích chính
    const siteEl = document.createElement('div');
    siteEl.className = 'shg-pin';
    siteEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="display:flex;align-items:center;gap:6px;padding:4px 10px 4px 5px;border-radius:999px;background:#141413;color:#ffffff;border:2px solid #ffffff;box-shadow:0 4px 14px rgba(0,0,0,0.28);font-weight:700;font-size:11px;white-space:nowrap;">
          <span style="width:7px;height:7px;border-radius:999px;background:#fbbf24;"></span>
          <span>${site.translations.vi.name}</span>
        </div>
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #141413;margin-top:-1px;"></div>
      </div>
    `;

    const siteMarker = new maplibregl.Marker({
      element: siteEl,
      anchor: 'bottom',
    })
      .setLngLat([site.lng, site.lat])
      .addTo(map);
    markersRef.current.push(siteMarker);

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([site.lng, site.lat]);

    restaurants.forEach((res) => {
      bounds.extend([res.lng, res.lat]);

      const resEl = document.createElement('div');
      resEl.className = 'shg-pin';
      resEl.style.cursor = 'pointer';
      resEl.innerHTML = `
        <div style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;background:#B93815;color:#ffffff;border:1.5px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.22);font-size:10.5px;font-weight:700;white-space:nowrap;">
          <span>★ ${res.rating.toFixed(1)}</span>
          <span>${res.name.length > 18 ? res.name.slice(0, 16) + '…' : res.name}</span>
        </div>
      `;

      resEl.onclick = () => {
        onSelectRestaurant?.(res);
      };

      const resMarker = new maplibregl.Marker({
        element: resEl,
        anchor: 'center',
      })
        .setLngLat([res.lng, res.lat])
        .addTo(map);
      markersRef.current.push(resMarker);
    });

    if (restaurants.length > 0) {
      map.fitBounds(bounds, {
        padding: 44,
        maxZoom: 16.2,
        duration: 600,
      });
    } else {
      map.setCenter([site.lng, site.lat]);
    }
  }, [site, restaurants]);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl border border-[#E6E4DD] bg-[#ECEAE4]">
      <div ref={containerRef} className="absolute inset-0 h-full w-full z-0" />
    </div>
  );
};
