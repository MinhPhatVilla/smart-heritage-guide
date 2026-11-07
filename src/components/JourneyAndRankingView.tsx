import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Footprints,
  Camera,
  Calendar,
  MapPin,
  ArrowUpDown,
  ArrowUpRight,
} from 'lucide-react';
import { HeritageSite, VisitedSiteRecord } from '../types/heritage';
import {
  formatDistance,
  formatWalkingDuration,
  rankVisitedSitesByWalkingTime,
} from '../utils/geoUtils';

interface JourneyAndRankingViewProps {
  records: VisitedSiteRecord[];
  allSites: HeritageSite[];
  onSelectSiteById: (siteId: string) => void;
  onOpenCaptureForSite: (siteId: string) => void;
}

export const JourneyAndRankingView: React.FC<JourneyAndRankingViewProps> = ({
  records,
  allSites,
  onSelectSiteById,
  onOpenCaptureForSite,
}) => {
  const [sortMode, setSortMode] = useState<'longest_walk' | 'shortest_walk'>(
    'longest_walk'
  );
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const journeyMapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const rankedList = rankVisitedSitesByWalkingTime(records, sortMode);

  const totalWalkingSeconds = records.reduce(
    (sum, r) => sum + r.walkingDurationSeconds,
    0
  );
  const totalDistanceMeters = records.reduce(
    (sum, r) => sum + r.walkingDistanceMeters,
    0
  );
  const totalPhotos = records.reduce((sum, r) => sum + r.photos.length, 0);
  const maxDurationSeconds = Math.max(
    1,
    ...records.map((r) => r.walkingDurationSeconds)
  );

  const unvisitedSites = allSites.filter(
    (s) => !records.some((r) => r.siteId === s.id)
  );

  // Bản đồ tổng hợp dấu chân hành trình & các lộ trình đã đi bộ
  useEffect(() => {
    const el = journeyMapRef.current;
    if (!el || leafletMapRef.current) return;

    const map = L.map(el, {
      center: [10.7775, 106.699],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps',
      maxZoom: 20,
    }).addTo(map);

    leafletMapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    const boundsCoords: [number, number][] = [];

    rankedList.forEach(({ rank, record }) => {
      const site = allSites.find((s) => s.id === record.siteId);
      if (!site) return;

      boundsCoords.push([site.lat, site.lng]);

      // Vẽ vết lộ trình đi bộ đã lưu của điểm này
      if (record.routeCoordinates && record.routeCoordinates.length > 1) {
        L.polyline(record.routeCoordinates, {
          color: '#B93815',
          weight: 4,
          dashArray: '6 5',
          opacity: 0.85,
        }).addTo(map);
      }

      const icon = L.divIcon({
        className: 'custom-heritage-marker',
        html: `<div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:#141413;color:#ffffff;border:2px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.28);font-weight:700;font-size:11px;white-space:nowrap;">
          <span style="background:#B93815;color:#fff;padding:1px 5px;border-radius:999px;font-size:10px;">#${rank}</span>
          <span>${record.siteName} (${formatWalkingDuration(record.walkingDurationSeconds)})</span>
        </div>`,
        iconSize: [190, 28],
        iconAnchor: [95, 14],
      });

      const marker = L.marker([site.lat, site.lng], { icon }).addTo(map);
      marker.on('click', () => {
        onSelectSiteById(record.siteId);
      });
    });

    if (boundsCoords.length > 0) {
      map.fitBounds(L.latLngBounds(boundsCoords), {
        padding: [48, 48],
        maxZoom: 15,
      });
    }
  }, [rankedList, allSites]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6">
      {/* Page Header & Architectural Metrics Strip */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8A877F]">
            Nhật ký Bộ hành & Lưu trữ
          </span>
          <h2 className="mt-1 font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#141413]">
            Hành trình & Xếp hạng theo Thời gian Đi bộ
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E6E4DD] rounded-xl border border-[#E6E4DD] bg-white">
          <div className="p-4">
            <span className="text-xs text-[#8A877F]">Điểm di sản đã đi</span>
            <p className="mt-1 text-2xl font-semibold text-[#141413] tabular-nums">
              {records.length}
              <span className="text-sm font-normal text-[#8A877F]">
                /{allSites.length}
              </span>
            </p>
          </div>

          <div className="p-4">
            <span className="text-xs text-[#8A877F]">Tổng thời gian đi bộ</span>
            <p className="mt-1 text-2xl font-semibold text-[#141413] tabular-nums">
              {formatWalkingDuration(totalWalkingSeconds)}
            </p>
          </div>

          <div className="p-4">
            <span className="text-xs text-[#8A877F]">Quãng đường tích lũy</span>
            <p className="mt-1 text-2xl font-semibold text-[#141413] tabular-nums">
              {formatDistance(totalDistanceMeters)}
            </p>
          </div>

          <div className="p-4">
            <span className="text-xs text-[#8A877F]">Ảnh lưu tại di tích</span>
            <p className="mt-1 text-2xl font-semibold text-[#141413] tabular-nums">
              {totalPhotos}
            </p>
          </div>
        </div>
      </div>

      {/* Bản đồ Dấu chân Hành trình & Lộ trình Đi bộ đã Ghi lại */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#141413]">
              Bản đồ Hành trình & Lộ trình Đi bộ Đã Ghi nhận
            </h3>
            <p className="text-xs text-[#57554F]">
              Hiển thị các danh lam thắng cảnh bạn đã đi qua kèm vết đường đi bộ và thứ hạng
            </p>
          </div>
        </div>
        <div className="relative h-72 sm:h-80 w-full overflow-hidden rounded-2xl border border-[#E6E4DD] bg-[#EFEDE6]">
          <div
            ref={journeyMapRef}
            className="absolute inset-0 h-full w-full z-0"
          />
        </div>
      </section>

      {/* Walking-Time Leaderboard */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E4DD] pb-3">
          <div>
            <h3 className="text-base font-semibold text-[#141413]">
              Bảng xếp hạng nơi đã đi qua thời gian đi bộ
            </h3>
            <p className="text-xs text-[#57554F]">
              Xếp hạng mức độ đi bộ chinh phục từng danh lam thắng cảnh
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setSortMode((prev) =>
                prev === 'longest_walk' ? 'shortest_walk' : 'longest_walk'
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6E4DD] bg-white px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#F3F1EC] transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-[#8A877F]" />
            {sortMode === 'longest_walk'
              ? 'Xếp theo: Đi bộ lâu nhất'
              : 'Xếp theo: Đi bộ nhanh nhất'}
          </button>
        </div>

        <div className="divide-y divide-[#E6E4DD] rounded-xl border border-[#E6E4DD] bg-white">
          {rankedList.map(({ rank, record, badgeTitle }) => {
            const widthPercent = Math.max(
              12,
              Math.round(
                (record.walkingDurationSeconds / maxDurationSeconds) * 100
              )
            );

            return (
              <div key={record.id} className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums ${
                        rank === 1
                          ? 'bg-[#141413] text-white'
                          : 'border border-[#E6E4DD] bg-[#FAF9F6] text-[#57554F]'
                      }`}
                    >
                      0{rank}
                    </span>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectSiteById(record.siteId)}
                          className="font-serif-editorial text-lg font-semibold text-[#141413] hover:underline text-left"
                        >
                          {record.siteName}
                        </button>
                        <span className="rounded border border-[#E6E4DD] bg-[#FAF9F6] px-2 py-0.5 text-[11px] font-medium text-[#57554F]">
                          {badgeTitle}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#57554F] tabular-nums">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#141413]">
                          <Footprints className="h-3.5 w-3.5 text-[#B93815]" />
                          {formatWalkingDuration(record.walkingDurationSeconds)}
                        </span>
                        <span>·</span>
                        <span>{formatDistance(record.walkingDistanceMeters)}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 text-[#8A877F]">
                          <Calendar className="h-3 w-3" />
                          {new Date(record.visitedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      {/* Minimalist Bar Visualizer */}
                      <div className="w-full max-w-md pt-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F1EC]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              rank === 1 ? 'bg-[#B93815]' : 'bg-[#141413]'
                            }`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>

                      {record.userNote && (
                        <p className="pt-1 text-xs text-[#57554F]">
                          {record.userNote}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => onOpenCaptureForSite(record.siteId)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6E4DD] bg-white px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#FAF9F6]"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Thêm ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectSiteById(record.siteId)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-[#57554F] hover:text-[#141413]"
                    >
                      <span>Chi tiết</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Captured Photos Strip */}
                {record.photos.length > 0 && (
                  <div className="pl-0 sm:pl-13 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {record.photos.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setPreviewPhotoUrl(photo.dataUrl)}
                          className="group flex items-center gap-3 rounded-lg border border-[#E6E4DD] bg-[#FAF9F6] p-2 text-left hover:border-[#141413]/40 transition-colors"
                        >
                          <img
                            src={photo.dataUrl}
                            alt={photo.caption}
                            className="h-14 w-16 shrink-0 rounded object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-[#141413]">
                              {photo.caption}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#8A877F] tabular-nums">
                              {new Date(photo.takenAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Remaining Unvisited Heritage Sites */}
      {unvisitedSites.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[#141413]">
            Điểm di sản chưa check-in ({unvisitedSites.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unvisitedSites.map((site) => (
              <div
                key={site.id}
                className="flex items-center justify-between rounded-xl border border-[#E6E4DD] bg-white p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={site.coverImage}
                    alt={site.translations.vi.name}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <h4 className="truncate text-xs font-semibold text-[#141413]">
                      {site.translations.vi.name}
                    </h4>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[#8A877F]">
                      <MapPin className="h-3 w-3" /> {site.city}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCaptureForSite(site.id)}
                  className="shrink-0 rounded-lg border border-[#E6E4DD] bg-[#FAF9F6] px-2.5 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#141413] hover:text-white transition-colors"
                >
                  Check-in
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/90 p-4"
        >
          <img
            src={previewPhotoUrl}
            alt="Ảnh kỷ niệm tại di tích"
            className="max-h-[88vh] max-w-[92vw] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
};
