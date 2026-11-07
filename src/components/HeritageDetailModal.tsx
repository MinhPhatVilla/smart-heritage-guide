import React, { useState } from 'react';
import {
  X,
  Navigation,
  Camera,
  Star,
  Clock,
  Ticket,
  Film,
  Image as ImageIcon,
  Utensils,
  Award,
  Footprints,
  MapPin,
  Landmark,
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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Ảnh bìa & Header */}
        <div className="relative h-56 sm:h-64 w-full shrink-0 overflow-hidden bg-stone-900">
          <img
            src={site.coverImage}
            alt={localized.name}
            className="h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white backdrop-blur-xs hover:bg-black/75"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 inset-x-5 flex flex-wrap items-end justify-between gap-3 text-white">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {site.unescoRecognized && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-stone-950">
                    <Award className="h-3.5 w-3.5" /> Di sản UNESCO
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-xs">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {site.rating.toFixed(1)} ({site.reviewCount.toLocaleString()} đánh giá)
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-xs font-semibold">
                  <Footprints className="h-3.5 w-3.5" /> Cách bạn {formatDistance(distanceMeters)} (~
                  {formatWalkingDuration(estimatedWalkingSeconds)})
                </span>
              </div>
              <h2 className="mt-1.5 text-xl sm:text-2xl font-extrabold tracking-tight">
                {localized.name}
              </h2>
              <p className="text-xs text-stone-200">{localized.historicalEra}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onStartNavigation(site)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700"
              >
                <Navigation className="h-4 w-4" /> Dẫn đường tới đây
              </button>
              <button
                type="button"
                onClick={() => onOpenPhotoCheckIn(site)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-stone-950 shadow-md hover:bg-amber-400"
              >
                <Camera className="h-4 w-4" /> Chụp & Lưu ảnh Di tích
              </button>
            </div>
          </div>
        </div>

        {/* Thanh chuyển Tab */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-5">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition ${
              activeTab === 'overview'
                ? 'border-red-800 text-red-800'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Landmark className="h-4 w-4" />
            Thuyết minh Đa ngôn ngữ & Thông tin
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition ${
              activeTab === 'media'
                ? 'border-red-800 text-red-800'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Film className="h-4 w-4" />
            Ảnh & Video Tài liệu ({site.mediaGallery.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dining')}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition ${
              activeTab === 'dining'
                ? 'border-red-800 text-red-800'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Utensils className="h-4 w-4" />
            Tiệm Ăn uống Gần đó ({site.nearbyRestaurants.length})
          </button>
        </div>

        {/* Nội dung từng Tab */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'overview' && (
            <>
              <AudioGuidePlayer
                site={site}
                selectedLanguage={selectedLanguage}
                onLanguageChange={onLanguageChange}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 rounded-2xl border border-stone-200 bg-white p-4">
                  <h4 className="text-sm font-bold text-stone-900">
                    Điểm nhấn Kiến trúc & Giá trị Di sản
                  </h4>
                  <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">
                    {localized.shortSummary}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {localized.architecturalHighlights.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs sm:text-sm text-stone-700"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold text-red-800">
                          {idx + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs">
                  <h4 className="text-sm font-bold text-stone-900">
                    Thông tin Tham quan
                  </h4>
                  <div className="flex items-start gap-2 text-stone-700">
                    <Clock className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Giờ mở cửa:</span>
                      <span>{localized.openingHours}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-stone-700">
                    <Ticket className="h-4 w-4 shrink-0 text-red-700 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Giá vé tham khảo:</span>
                      <span>{site.ticketPrice}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-stone-700">
                    <MapPin className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Tọa độ GPS:</span>
                      <span>
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Kho Tư liệu Hình ảnh & Phim Tài liệu Lịch sử
                  </h3>
                  <p className="text-xs text-stone-500">
                    Tổng hợp tư liệu trực quan về {localized.name} theo ngôn ngữ đang chọn
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {site.mediaGallery.map((media) => {
                  const captionText =
                    media.caption[selectedLanguage] || media.caption.vi;
                  return (
                    <div
                      key={media.id}
                      className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 shadow-xs flex flex-col"
                    >
                      {media.type === 'video' ? (
                        <div className="relative bg-black">
                          <video
                            controls
                            poster={media.thumbnailUrl}
                            className="h-52 w-full object-cover"
                          >
                            <source src={media.url} type="video/mp4" />
                          </video>
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-red-700/90 px-2 py-0.5 text-[11px] font-bold text-white">
                            <Film className="h-3 w-3" /> Video Tài liệu{' '}
                            {media.durationLabel ? `• ${media.durationLabel}` : ''}
                          </span>
                        </div>
                      ) : (
                        <div
                          onClick={() => setLightboxImage(media.url)}
                          className="group relative cursor-pointer overflow-hidden"
                        >
                          <img
                            src={media.url}
                            alt={captionText}
                            className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-stone-900/75 px-2 py-0.5 text-[11px] font-semibold text-white">
                            <ImageIcon className="h-3 w-3" /> Ảnh Tư liệu (Nhấn để phóng to)
                          </span>
                        </div>
                      )}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <p className="text-xs sm:text-sm font-medium text-stone-800">
                          {captionText}
                        </p>
                        <p className="mt-2 text-[11px] text-stone-500">
                          Nguồn tư liệu: {media.yearOrSource}
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
                  <h3 className="text-base font-bold text-stone-900">
                    Đề xuất Tiệm Ăn uống Gần Di tích có Điểm Đánh giá Tốt
                  </h3>
                  <p className="text-xs text-stone-500">
                    Các quán ăn đặc sản nằm gần {localized.name} được du khách đánh giá cao nhất
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-stone-600">Lọc điểm đánh giá:</span>
                  {[4.5, 4.7, 4.8].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setMinRatingFilter(rating)}
                      className={`rounded-lg px-2.5 py-1 font-semibold ${
                        minRatingFilter === rating
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      ≥ {rating}⭐
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topRestaurants.map((res) => (
                  <div
                    key={res.id}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs hover:border-amber-300 transition"
                  >
                    <div>
                      <div className="relative h-40 w-full overflow-hidden bg-stone-100">
                        <img
                          src={res.imageUrl}
                          alt={res.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-extrabold text-stone-950 shadow-sm">
                          <Star className="h-3.5 w-3.5 fill-stone-950" />
                          {res.rating.toFixed(1)} ({res.reviewCount})
                        </div>
                        <div className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">
                          Cách di tích {formatDistance(res.distanceMeters)} (~
                          {formatWalkingDuration(res.walkingSeconds)})
                        </div>
                      </div>

                      <div className="p-4">
                        <span className="text-[11px] font-bold tracking-wide text-amber-800 uppercase">
                          {res.cuisine}
                        </span>
                        <h4 className="mt-0.5 text-base font-bold text-stone-900">
                          {res.name}
                        </h4>
                        <p className="mt-1 text-xs text-stone-500">
                          📍 {res.address} • ⏰ {res.openHours}
                        </p>

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {res.specialtyDishes.map((dish, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-900"
                            >
                              🍜 {dish}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50 px-4 py-2.5">
                      <span className="text-xs font-bold text-stone-700">
                        Mức giá: {res.priceRange}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateToRestaurant(res, site)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-900"
                      >
                        <Navigation className="h-3.5 w-3.5" /> Dẫn đường tới quán
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox xem ảnh tư liệu phóng to */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <img
            src={lightboxImage}
            alt="Ảnh tư liệu phóng to"
            className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
