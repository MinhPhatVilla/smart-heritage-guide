import React, { useEffect, useState } from 'react';
import {
  X,
  Navigation,
  Camera,
  Star,
  Clock,
  Ticket,
  Film,
  Image as ImageIcon,
  Footprints,
  MapPin,
} from 'lucide-react';
import {
  HeritageSite,
  NearbyRestaurant,
  SupportedLanguage,
} from '../types/heritage';
import {
  formatDistance,
  formatWalkingDuration,
  getRecommendedRestaurants,
} from '../utils/geoUtils';
import { AudioGuidePlayer } from './AudioGuidePlayer';

interface HeritageDetailModalProps {
  site: HeritageSite;
  distanceMeters: number;
  estimatedWalkingSeconds: number;
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onClose: () => void;
  onStartNavigation: (site: HeritageSite) => void;
  onNavigateToRestaurant: (restaurant: NearbyRestaurant, parentSite: HeritageSite) => void;
  onOpenPhotoCheckIn: (site: HeritageSite) => void;
}

export const HeritageDetailModal: React.FC<HeritageDetailModalProps> = ({
  site,
  distanceMeters,
  estimatedWalkingSeconds,
  selectedLanguage,
  onLanguageChange,
  onClose,
  onStartNavigation,
  onNavigateToRestaurant,
  onOpenPhotoCheckIn,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'dining'>('overview');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(4.5);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const localized = site.translations[selectedLanguage] || site.translations.vi;
  const topRestaurants = getRecommendedRestaurants(
    site.nearbyRestaurants,
    site.lat,
    site.lng,
    minRatingFilter
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxImage, onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-[#141413]/45 p-0 sm:p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-[#E6E4DD] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image & Orientation */}
        <div className="relative h-52 sm:h-60 w-full shrink-0 overflow-hidden bg-[#141413]">
          <img
            src={site.coverImage}
            alt={localized.name}
            className="h-full w-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141413]/90 via-[#141413]/35 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-[#141413]/60 p-2 text-white backdrop-blur-xs hover:bg-[#141413]"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute bottom-4 inset-x-5 flex flex-wrap items-end justify-between gap-4 text-white">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/85">
                <span className="font-medium">{site.city}</span>
                <span>·</span>
                <span>{localized.historicalEra}</span>
                {site.unescoRecognized && (
                  <>
                    <span>·</span>
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[11px] font-medium text-white">
                      Di sản UNESCO
                    </span>
                  </>
                )}
              </div>

              <h2 className="mt-1 font-serif-editorial text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                {localized.name}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/90 tabular-nums">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Footprints className="h-3.5 w-3.5 text-amber-300" />
                  {formatWalkingDuration(estimatedWalkingSeconds)} ({formatDistance(distanceMeters)})
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {site.rating.toFixed(1)} ({site.reviewCount.toLocaleString()})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onStartNavigation(site)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-[#141413] hover:bg-[#F3F1EC] transition-colors"
              >
                <Navigation className="h-3.5 w-3.5 text-[#B93815]" />
                Dẫn đường
              </button>
              <button
                type="button"
                onClick={() => onOpenPhotoCheckIn(site)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/15 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-xs hover:bg-white/25 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
                Lưu ảnh
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E6E4DD] bg-[#FAF9F6] px-5">
          {[
            { id: 'overview', label: 'Thuyết minh & Lịch sử' },
            { id: 'media', label: `Tư liệu (${site.mediaGallery.length})` },
            { id: 'dining', label: `Ẩm thực gần đó (${site.nearbyRestaurants.length})` },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-[#141413] text-[#141413]'
                    : 'border-transparent text-[#8A877F] hover:text-[#141413]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'overview' && (
            <>
              <AudioGuidePlayer
                site={site}
                selectedLanguage={selectedLanguage}
                onLanguageChange={onLanguageChange}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8A877F]">
                    Giới thiệu & Điểm nhấn Kiến trúc
                  </h3>
                  <p className="text-sm text-[#141413] leading-relaxed">
                    {localized.shortSummary}
                  </p>
                  <ul className="space-y-2 pt-1">
                    {localized.architecturalHighlights.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-[#57554F]"
                      >
                        <span className="mt-0.5 text-xs font-semibold text-[#8A877F] tabular-nums">
                          0{idx + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3 rounded-xl border border-[#E6E4DD] bg-[#FAF9F6] p-4 text-xs">
                  <h4 className="font-semibold uppercase tracking-wider text-[#8A877F]">
                    Thông tin khách tham quan
                  </h4>
                  <div className="flex items-start gap-2.5 text-[#141413]">
                    <Clock className="h-4 w-4 shrink-0 text-[#8A877F] mt-0.5" />
                    <div>
                      <span className="text-[#8A877F] block">Giờ mở cửa</span>
                      <span className="font-medium">{localized.openingHours}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-[#141413]">
                    <Ticket className="h-4 w-4 shrink-0 text-[#8A877F] mt-0.5" />
                    <div>
                      <span className="text-[#8A877F] block">Giá vé tham khảo</span>
                      <span className="font-medium">{site.ticketPrice}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-[#141413]">
                    <MapPin className="h-4 w-4 shrink-0 text-[#8A877F] mt-0.5" />
                    <div>
                      <span className="text-[#8A877F] block">Tọa độ</span>
                      <span className="font-medium tabular-nums">
                        {site.lat.toFixed(4)}°N, {site.lng.toFixed(4)}°E
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'media' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#141413]">
                  Hình ảnh & Phim tài liệu lịch sử
                </h3>
                <p className="text-xs text-[#57554F]">
                  Tư liệu lưu trữ về {localized.name}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {site.mediaGallery.map((media) => {
                  const captionText =
                    media.caption[selectedLanguage] || media.caption.vi;
                  return (
                    <div
                      key={media.id}
                      className="overflow-hidden rounded-xl border border-[#E6E4DD] bg-[#FAF9F6] flex flex-col"
                    >
                      {media.type === 'video' ? (
                        <div className="relative bg-[#141413]">
                          <video
                            controls
                            poster={media.thumbnailUrl}
                            className="h-48 w-full object-cover"
                          >
                            <source src={media.url} type="video/mp4" />
                          </video>
                          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-[#141413]/80 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
                            <Film className="h-3 w-3" /> Video tư liệu{' '}
                            {media.durationLabel ? `· ${media.durationLabel}` : ''}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLightboxImage(media.url)}
                          className="group relative overflow-hidden text-left"
                        >
                          <img
                            src={media.url}
                            alt={captionText}
                            className="h-48 w-full object-cover transition duration-300 group-hover:scale-102"
                          />
                          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-[#141413]/75 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
                            <ImageIcon className="h-3 w-3" /> Phóng to ảnh
                          </span>
                        </button>
                      )}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <p className="text-xs sm:text-sm font-medium text-[#141413]">
                          {captionText}
                        </p>
                        <p className="mt-2 text-[11px] text-[#8A877F]">
                          {media.yearOrSource}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'dining' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#141413]">
                    Tiệm ăn uống đề xuất gần di tích
                  </h3>
                  <p className="text-xs text-[#57554F]">
                    Sắp xếp theo điểm đánh giá thực khách và khoảng cách đi bộ
                  </p>
                </div>

                <div className="inline-flex items-center rounded-lg border border-[#E6E4DD] bg-[#FAF9F6] p-0.5 text-xs">
                  {[4.5, 4.7, 4.8].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setMinRatingFilter(rating)}
                      className={`rounded-md px-2.5 py-1 font-medium tabular-nums transition-colors ${
                        minRatingFilter === rating
                          ? 'bg-[#141413] text-white'
                          : 'text-[#57554F] hover:text-[#141413]'
                      }`}
                    >
                      ≥ {rating} ★
                    </button>
                  ))}
                </div>
              </div>

              {topRestaurants.length === 0 ? (
                <div className="rounded-xl border border-[#E6E4DD] bg-[#FAF9F6] p-6 text-center text-xs text-[#57554F]">
                  Không có quán ăn nào khớp mức lọc ≥ {minRatingFilter} ★. Hãy chọn mức lọc thấp hơn.
                </div>
              ) : (
                <div className="divide-y divide-[#E6E4DD] rounded-xl border border-[#E6E4DD] bg-white">
                  {topRestaurants.map((res) => (
                    <div
                      key={res.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-[#FAF9F6] transition-colors"
                    >
                      <div className="flex items-start gap-3.5">
                        <img
                          src={res.imageUrl}
                          alt={res.name}
                          className="h-16 w-16 shrink-0 rounded-lg object-cover border border-[#E6E4DD]"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-semibold text-[#141413]">
                              {res.name}
                            </h4>
                            <span className="inline-flex items-center gap-1 rounded bg-[#FAF9F6] border border-[#E6E4DD] px-1.5 py-0.5 text-xs font-semibold text-[#141413] tabular-nums">
                              <span className="text-[#B93815]">★</span>
                              {res.rating.toFixed(1)}
                              <span className="font-normal text-[#8A877F]">
                                ({res.reviewCount})
                              </span>
                            </span>
                          </div>

                          <p className="mt-0.5 text-xs text-[#57554F]">
                            {res.specialtyDishes.join(' · ')}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#8A877F] tabular-nums">
                            <span>Cách di tích {formatDistance(res.distanceMeters)}</span>
                            <span>·</span>
                            <span>~{formatWalkingDuration(res.walkingSeconds)}</span>
                            <span>·</span>
                            <span>{res.priceRange}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigateToRestaurant(res, site)}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 self-end sm:self-center rounded-lg border border-[#E6E4DD] bg-white px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#141413] hover:text-white transition-colors"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Chỉ đường
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/90 p-4"
        >
          <img
            src={lightboxImage}
            alt="Ảnh tư liệu"
            className="max-h-[88vh] max-w-[92vw] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
};
