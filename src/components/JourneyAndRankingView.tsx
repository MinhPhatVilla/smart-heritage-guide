import React, { useState } from 'react';
import {
  Trophy,
  Footprints,
  Camera,
  Calendar,
  MapPin,
  ArrowUpDown,
  Medal,
  Sparkles,
  Navigation,
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Thống kê tổng quan hành trình */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase">
              Di tích đã đi qua
            </span>
            <Trophy className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-stone-900">
            {records.length} / {allSites.length}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            Danh lam thắng cảnh đã ghi nhận
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase">
              Tổng thời gian đi bộ
            </span>
            <Footprints className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-stone-900">
            {formatWalkingDuration(totalWalkingSeconds)}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            Tích lũy qua các chặng hành trình
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase">
              Quãng đường bộ hành
            </span>
            <Navigation className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-stone-900">
            {formatDistance(totalDistanceMeters)}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            Ước tính ~{Math.round(totalDistanceMeters * 1.35).toLocaleString()} bước chân
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-900 uppercase">
              Ảnh chụp tại Di tích
            </span>
            <Camera className="h-5 w-5 text-red-700" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-stone-900">
            {totalPhotos} ảnh
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            Lưu trong Sổ tay Hành trình Di sản
          </p>
        </div>
      </div>

      {/* Bảng Xếp hạng những nơi đã đi thông qua thời gian đi bộ */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-900">
              <Medal className="h-3.5 w-3.5" /> Bảng Xếp Hạng Hành Trình Đi Bộ
            </div>
            <h2 className="mt-1 text-lg sm:text-xl font-extrabold text-stone-900">
              Xếp hạng Những Nơi Đã Đi qua Thời Gian Đi Bộ tới Di Tích
            </h2>
            <p className="text-xs text-stone-500">
              Đánh giá và xếp hạng các danh lam thắng cảnh bạn đã khám phá dựa trên thời gian đi bộ thực tế tới điểm đó
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setSortMode((prev) =>
                prev === 'longest_walk' ? 'shortest_walk' : 'longest_walk'
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100"
          >
            <ArrowUpDown className="h-4 w-4 text-red-700" />
            {sortMode === 'longest_walk'
              ? 'Đang xếp: Thời gian đi bộ lâu nhất (Nỗ lực cao nhất)'
              : 'Đang xếp: Thời gian đi bộ nhanh nhất'}
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {rankedList.map(({ rank, record, badgeTitle, effortScore }) => {
            const widthPercent = Math.max(
              15,
              Math.round((record.walkingDurationSeconds / maxDurationSeconds) * 100)
            );
            const medalBadge =
              rank === 1 ? '🥇 Hạng 1' : rank === 2 ? '🥈 Hạng 2' : rank === 3 ? '🥉 Hạng 3' : `#${rank}`;

            return (
              <div
                key={record.id}
                className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 transition hover:border-amber-300 hover:bg-white"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl font-extrabold text-xs shadow-xs ${
                        rank === 1
                          ? 'bg-amber-400 text-stone-950'
                          : rank === 2
                            ? 'bg-stone-300 text-stone-900'
                            : rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      <span>{medalBadge}</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          onClick={() => onSelectSiteById(record.siteId)}
                          className="cursor-pointer text-base font-bold text-stone-900 hover:text-red-800"
                        >
                          {record.siteName}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                          <Sparkles className="h-3 w-3" /> {badgeTitle}
                        </span>
                        <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                          {effortScore} điểm bộ hành
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-600">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                          <Footprints className="h-3.5 w-3.5" /> Thời gian đi bộ:{' '}
                          {formatWalkingDuration(record.walkingDurationSeconds)}
                        </span>
                        <span>• Quãng đường: {formatDistance(record.walkingDistanceMeters)}</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />{' '}
                          {new Date(record.visitedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      {/* Thanh biểu đồ trực quan so sánh thời gian đi bộ */}
                      <div className="mt-2.5 w-full max-w-md rounded-full bg-stone-200 h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-700 via-amber-600 to-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>

                      {record.userNote && (
                        <p className="mt-2 text-xs italic text-stone-600">
                          “{record.userNote}”
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => onOpenCaptureForSite(record.siteId)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400"
                    >
                      <Camera className="h-3.5 w-3.5" /> Chụp thêm ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectSiteById(record.siteId)}
                      className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                    >
                      Xem Di tích
                    </button>
                  </div>
                </div>

                {/* Bộ sưu tập ảnh chụp tại di tích này */}
                {record.photos.length > 0 && (
                  <div className="mt-4 border-t border-stone-200/80 pt-3">
                    <p className="mb-2 text-xs font-bold text-stone-700">
                      📸 Ảnh kỷ niệm đã lưu tại {record.siteName} ({record.photos.length}):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {record.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xs"
                        >
                          <img
                            src={photo.dataUrl}
                            alt={photo.caption}
                            className="h-36 w-full object-cover"
                          />
                          <div className="p-2.5">
                            <p className="text-xs font-semibold text-stone-800 line-clamp-1">
                              {photo.caption}
                            </p>
                            <p className="mt-0.5 text-[11px] text-stone-500 flex items-center justify-between">
                              <span>
                                {new Date(photo.takenAt).toLocaleDateString('vi-VN')}
                              </span>
                              {photo.walkingDurationSecondsAtCapture && (
                                <span className="text-emerald-700 font-semibold">
                                  🚶 {formatWalkingDuration(photo.walkingDurationSecondsAtCapture)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Gợi ý các di tích tiếp theo để chinh phục và lưu ảnh */}
      {unvisitedSites.length > 0 && (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
          <h3 className="text-base font-bold text-stone-900">
            Danh lam thắng cảnh tiếp theo đang chờ bạn khám phá & check-in ({unvisitedSites.length})
          </h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unvisitedSites.map((site) => (
              <div
                key={site.id}
                className="flex items-center justify-between rounded-2xl border border-stone-200 p-3 hover:border-amber-300"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={site.coverImage}
                    alt={site.translations.vi.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">
                      {site.translations.vi.name}
                    </h4>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-stone-500">
                      <MapPin className="h-3 w-3" /> {site.city}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCaptureForSite(site.id)}
                  className="rounded-xl bg-red-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-900"
                >
                  Check-in
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
