import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { HeritageSite, NearbyRestaurant } from '../types/heritage';

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

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: [site.lat, site.lng],
      zoom: 16,
      zoomControl: true,
    });

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps',
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    const timer = setTimeout(() => {
      if (mapRef.current === map) {
        map.invalidateSize();
      }
    }, 120);

    const ro = new ResizeObserver(() => {
      if (mapRef.current === map) {
        map.invalidateSize();
      }
    });
    ro.observe(el);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    const siteIcon = L.divIcon({
      className: 'custom-heritage-marker',
      html: `<div style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:999px;background:#141413;color:#ffffff;border:2px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.28);font-weight:700;font-size:11px;white-space:nowrap;">
        <span style="width:7px;height:7px;border-radius:999px;background:#fbbf24;"></span>
        <span>${site.translations.vi.name}</span>
      </div>`,
      iconSize: [160, 28],
      iconAnchor: [80, 14],
    });

    L.marker([site.lat, site.lng], { icon: siteIcon }).addTo(map);

    const boundsPoints: [number, number][] = [[site.lat, site.lng]];

    restaurants.forEach((res) => {
      boundsPoints.push([res.lat, res.lng]);

      const resIcon = L.divIcon({
        className: 'custom-restaurant-marker',
        html: `<div style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:999px;background:#B93815;color:#ffffff;border:1.5px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.22);font-size:10.5px;font-weight:700;white-space:nowrap;">
          <span>★ ${res.rating.toFixed(1)}</span>
          <span>${res.name.length > 16 ? res.name.slice(0, 15) + '…' : res.name}</span>
        </div>`,
        iconSize: [130, 24],
        iconAnchor: [65, 12],
      });

      const marker = L.marker([res.lat, res.lng], { icon: resIcon }).addTo(map);
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
          opacity: 0.7,
        }
      ).addTo(map);
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
    <div className="relative h-60 w-full overflow-hidden rounded-xl border border-[#E6E4DD] bg-[#E5E3DF]">
      <div ref={containerRef} className="absolute inset-0 h-full w-full z-0" />
    </div>
  );
};
