import React, { useEffect, useState } from 'react';
import {
  Compass,
  MapPin,
  Volume2,
  Navigation,
  Camera,
  Trophy,
  Star,
  Utensils,
  Film,
  Footprints,
  LocateFixed,
  Globe,
  Sparkles,
  Award,
} from 'lucide-react';
import {
  CapturedPhoto,
  HeritageSite,
  NearbyRestaurant,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  VisitedSiteRecord,
  WalkingRouteResult,
} from './types/heritage';
import { CITY_PRESETS, HERITAGE_SITES } from './data/heritageSites';
import {
  formatDistance,
  formatWalkingDuration,
  getNearbySitesWithMetrics,
} from './utils/geoUtils';
import { fetchWalkingRoute } from './services/routingService';
import {
  loadVisitedSiteRecords,
  upsertSiteVisitRecord,
} from './services/journeyStorage';
import { MapExplorer } from './components/MapExplorer';
import { HeritageDetailModal } from './components/HeritageDetailModal';
import { PhotoCaptureModal } from './components/PhotoCaptureModal';
import { JourneyAndRankingView } from './components/JourneyAndRankingView';
import { AudioGuidePlayer } from './components/AudioGuidePlayer';

export function App() {
  // Vị trí mặc định: Trung tâm Hà Nội (gần Hoàng Thành Thăng Long & Văn Miếu)
  const [userLocation, setUserLocation] = useState<[number, number]>([
    21.0313, 105.8412,
  ]);
  const [activeCityId, setActiveCityId] = useState<string>('Ha Noi');
  const [gpsStatus, setGpsStatus] = useState<string>(
    'Đang dùng tâm điểm di sản Hà Nội (Nhấn bản đồ để di chuyển hoặc bật GPS thực)'
  );
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>('vi');
  const [searchRadiusMeters, setSearchRadiusMeters] = useState<number>(15000);
  const [activeView, setActiveView] = useState<'explore' | 'journey'>('explore');

  // Trạng thái di tích đang chọn, dẫn đường, bấm giờ đi bộ & lưu ảnh
  const [selectedSite, setSelectedSite] = useState<HeritageSite | null>(null);
  const [quickAudioSite, setQuickAudioSite] = useState<HeritageSite | null>(
    null
  );
  const [photoCaptureSite, setPhotoCaptureSite] =
    useState<HeritageSite | null>(null);
  const [activeRoute, setActiveRoute] = useState<WalkingRouteResult | null>(
    null
  );
  const [activeWalkSeconds, setActiveWalkSeconds] = useState<number>(0);
  const [isSimulatingWalk, setIsSimulatingWalk] = useState<boolean>(false);
  const [autoAudioGuide, setAutoAudioGuide] = useState<boolean>(true);

  // Dữ liệu lịch sử hành trình & ảnh chụp tại di tích
  const [visitedRecords, setVisitedRecords] = useState<VisitedSiteRecord[]>(() =>
    loadVisitedSiteRecords()
  );

  // Đồng hồ đếm thời gian đi bộ khi đang bật chế độ dẫn đường
  useEffect(() => {
    if (!activeRoute) return;
    const interval = setInterval(() => {
      setActiveWalkSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRoute]);

  // Tính danh sách các danh lam thắng cảnh gần vị trí người dùng
  const nearbySitesWithMetrics = getNearbySitesWithMetrics(
    HERITAGE_SITES,
    userLocation[0],
    userLocation[1],
    searchRadiusMeters > 0 ? searchRadiusMeters : undefined
  );

  const closestSiteItem = nearbySitesWithMetrics[0];

  // Lấy vị trí GPS thực tế từ trình duyệt
  const handleDetectRealGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('Trình duyệt không hỗ trợ Geolocation API.');
      return;
    }
    setGpsStatus('Đang xác định tọa độ GPS thực tế của bạn...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation([lat, lng]);
        setSearchRadiusMeters(0); // Mở rộng bán kính toàn quốc để luôn thấy di tích gần nhất
        setActiveCityId('GPS');
        setGpsStatus(
          `Đã định vị GPS thực tế (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`
        );
      },
      () => {
        setGpsStatus(
          'Không thể lấy GPS thực tế (Vui lòng cấp quyền vị trí hoặc chọn khu vực di sản bên dưới)'
        );
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Chuyển nhanh khu vực thành phố để trải nghiệm
  const handleSelectCityPreset = (presetId: string) => {
    const preset = CITY_PRESETS.find((c) => c.id === presetId);
    if (!preset) return;
    setActiveCityId(preset.id);
    setUserLocation([preset.lat, preset.lng]);
    setSearchRadiusMeters(15000);
    setActiveRoute(null);
    setGpsStatus(`Vị trí khách hàng: ${preset.label} (${preset.subtitle})`);
  };

  // Bắt đầu dẫn đường đi bộ tới danh lam thắng cảnh
  const handleStartNavigationToSite = async (site: HeritageSite) => {
    const localName =
      (site.translations[selectedLanguage] || site.translations.vi).name;
    const route = await fetchWalkingRoute(
      userLocation,
      [site.lat, site.lng],
      localName,
      'heritage',
      site.id
    );
    setActiveRoute(route);
    setActiveWalkSeconds(0);
    setSelectedSite(null);
    setActiveView('explore');
  };

  // Bắt đầu dẫn đường đi bộ tới tiệm ăn uống đề xuất gần di tích
  const handleNavigateToRestaurant = async (
    restaurant: NearbyRestaurant,
    _parentSite: HeritageSite
  ) => {
    const route = await fetchWalkingRoute(
      userLocation,
      [restaurant.lat, restaurant.lng],
      `🍜 ${restaurant.name} (${restaurant.rating}⭐)`,
      'restaurant',
      restaurant.id
    );
    setActiveRoute(route);
    setActiveWalkSeconds(0);
    setSelectedSite(null);
    setActiveView('explore');
  };

  // Mô phỏng bước đi bộ dọc theo lộ trình tới danh lam thắng cảnh
  const handleSimulateWalkAlongRoute = () => {
    if (!activeRoute || isSimulatingWalk) return;
    setIsSimulatingWalk(true);

    const coords = activeRoute.coordinates;
    let stepIdx = 0;
    const stepDurationIncrement = Math.max(
      25,
      Math.round(activeRoute.estimatedDurationSeconds / Math.max(1, coords.length))
    );

    const walkTimer = setInterval(() => {
      stepIdx += 1;
      if (stepIdx >= coords.length) {
        clearInterval(walkTimer);
        setIsSimulatingWalk(false);
        const dest = activeRoute.destination;
        setUserLocation(dest);
        setActiveWalkSeconds((prev) =>
          Math.max(prev, activeRoute.estimatedDurationSeconds)
        );

        // Nếu đích đến là danh lam thắng cảnh và đang bật tự động thuyết minh
        if (activeRoute.targetType === 'heritage') {
          const targetSite = HERITAGE_SITES.find(
            (s) => s.id === activeRoute.targetId
          );
          if (targetSite && autoAudioGuide) {
            setQuickAudioSite(targetSite);
          }
        }
        return;
      }

      setUserLocation(coords[stepIdx]);
      setActiveWalkSeconds((prev) => prev + stepDurationIncrement);
    }, 380);
  };

  // Hoàn tất đi bộ tới di tích -> Mở cửa sổ chụp ảnh & ghi nhận thời gian đi bộ
  const handleFinishWalkAndCheckIn = () => {
    if (!activeRoute) return;
    const targetSite = HERITAGE_SITES.find((s) => s.id === activeRoute.targetId);
    if (targetSite) {
      setPhotoCaptureSite(targetSite);
    }
  };

  // Lưu ảnh chụp tại di tích lịch sử & cập nhật bảng xếp hạng thời gian đi bộ
  const handleSavePhotoCheckIn = (data: {
    photo: CapturedPhoto;
    userNote: string;
    userRating: number;
    walkingDurationSeconds: number;
    walkingDistanceMeters: number;
  }) => {
    if (!photoCaptureSite) return;
    const updated = upsertSiteVisitRecord(visitedRecords, {
      siteId: photoCaptureSite.id,
      siteName: photoCaptureSite.translations.vi.name,
      city: photoCaptureSite.city,
      coverImage: photoCaptureSite.coverImage,
      walkingDurationSeconds: data.walkingDurationSeconds,
      walkingDistanceMeters: data.walkingDistanceMeters,
      routeCoordinates: activeRoute?.coordinates || [
        userLocation,
        [photoCaptureSite.lat, photoCaptureSite.lng],
      ],
      photo: data.photo,
      userNote: data.userNote,
      userRating: data.userRating,
    });
    setVisitedRecords(updated);
    setActiveRoute(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Header chính */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          {/* Thương hiệu */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-800 to-amber-700 text-white shadow-md">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-stone-900">
                  Smart Heritage Guide
                </h1>
                <span className="hidden sm:inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                  GPS • Đa ngôn ngữ • Ẩm thực & Hành trình
                </span>
              </div>
              <p className="text-xs text-stone-500 line-clamp-1">{gpsStatus}</p>
            </div>
          </div>

          {/* Chuyển đổi Phân hệ & Ngôn ngữ */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Bộ chọn ngôn ngữ nhanh */}
            <div className="flex items-center rounded-xl border border-stone-200 bg-stone-100 p-1">
              <Globe className="mx-1.5 h-3.5 w-3.5 text-stone-500" />
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`rounded-lg px-2 py-1 text-xs font-bold transition ${
                    selectedLanguage === lang.code
                      ? 'bg-red-800 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title={lang.nativeLabel}
                >
                  {lang.flag} {lang.code.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Chuyển Tab Khám phá / Hành trình & Xếp hạng */}
            <div className="flex rounded-xl border border-stone-200 bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setActiveView('explore')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeView === 'explore'
                    ? 'bg-white text-red-800 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Compass className="h-4 w-4" />
                Khám phá & Dẫn đường
              </button>
              <button
                type="button"
                onClick={() => setActiveView('journey')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeView === 'journey'
                    ? 'bg-white text-red-800 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Trophy className="h-4 w-4 text-amber-600" />
                Hành trình & Xếp hạng ({visitedRecords.length})
              </button>
            </div>
          </div>
        </div>

        {/* Thanh điều khiển Vị trí GPS & Khu vực Di sản */}
        <div className="border-t border-stone-100 bg-stone-100/70 px-4 py-2">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleDetectRealGps}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700"
              >
                <LocateFixed className="h-3.5 w-3.5" /> Định vị GPS Thực tế
              </button>

              {CITY_PRESETS.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleSelectCityPreset(city.id)}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeCityId === city.id
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-2xs'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {city.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={autoAudioGuide}
                  onChange={(e) => setAutoAudioGuide(e.target.checked)}
                  className="accent-red-800 h-3.5 w-3.5 rounded"
                />
                <span>Tự động phát giọng nói khi đến gần di tích</span>
              </label>

              <select
                value={searchRadiusMeters}
                onChange={(e) => setSearchRadiusMeters(Number(e.target.value))}
                className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700"
              >
                <option value={5000}>Bán kính gần: 5 km</option>
                <option value={15000}>Bán kính: 15 km</option>
                <option value={0}>Tất cả di tích Việt Nam</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Nội dung chính */}
      <main className="flex-1">
        {activeView === 'journey' ? (
          <JourneyAndRankingView
            records={visitedRecords}
            allSites={HERITAGE_SITES}
            onSelectSiteById={(siteId) => {
              const target = HERITAGE_SITES.find((s) => s.id === siteId);
              if (target) setSelectedSite(target);
            }}
            onOpenCaptureForSite={(siteId) => {
              const target = HERITAGE_SITES.find((s) => s.id === siteId);
              if (target) setPhotoCaptureSite(target);
            }}
          />
        ) : (
          <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
            {/* Cảnh báo thông minh khi phát hiện danh lam thắng cảnh ở rất gần (< 350m) */}
            {closestSiteItem && closestSiteItem.distanceMeters <= 350 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-100 via-amber-50 to-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-800 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-red-800">
                      Phát hiện Danh lam Thắng cảnh ngay gần bạn ({formatDistance(closestSiteItem.distanceMeters)})
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900">
                      {(
                        closestSiteItem.site.translations[selectedLanguage] ||
                        closestSiteItem.site.translations.vi
                      ).name}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickAudioSite(closestSiteItem.site)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-900"
                  >
                    <Volume2 className="h-4 w-4" /> Phát Giọng Nói Đa Ngôn Ngữ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoCaptureSite(closestSiteItem.site)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400"
                  >
                    <Camera className="h-4 w-4" /> Check-in & Lưu Ảnh
                  </button>
                </div>
              </div>
            )}

            {/* Trình phát thuyết minh nhanh (Quick Audio Bar) nếu đang mở */}
            {quickAudioSite && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setQuickAudioSite(null)}
                  className="absolute top-3 right-3 z-10 rounded-lg bg-stone-200/80 px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-300"
                >
                  Thu gọn
                </button>
                <AudioGuidePlayer
                  site={quickAudioSite}
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={setSelectedLanguage}
                  autoPlayOnOpen={true}
                />
              </div>
            )}

            {/* Bản đồ Tương tác & Dẫn đường Đi bộ */}
            <MapExplorer
              userLocation={userLocation}
              sites={nearbySitesWithMetrics.map((i) => i.site)}
              visitedRecords={visitedRecords}
              selectedLanguage={selectedLanguage}
              activeRoute={activeRoute}
              activeWalkSeconds={activeWalkSeconds}
              isSimulatingWalk={isSimulatingWalk}
              searchRadiusMeters={searchRadiusMeters}
              onSelectSite={(site) => setSelectedSite(site)}
              onStartRouteToSite={handleStartNavigationToSite}
              onSimulateWalkAlongRoute={handleSimulateWalkAlongRoute}
              onFinishWalkAndCheckIn={handleFinishWalkAndCheckIn}
              onCancelRoute={() => setActiveRoute(null)}
              onMoveUserLocation={(lat, lng) => {
                setUserLocation([lat, lng]);
                setGpsStatus(
                  `Vị trí khách hàng trên bản đồ: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`
                );
              }}
            />

            {/* Danh sách Danh lam Thắng cảnh ở gần được sắp xếp theo Thời gian đi bộ */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-stone-900">
                    Danh lam Thắng cảnh ở gần Vị trí của bạn ({nearbySitesWithMetrics.length})
                  </h2>
                  <p className="text-xs text-stone-500">
                    Tự động tính khoảng cách, thời gian đi bộ, tích hợp thuyết minh đa ngôn ngữ, tư liệu lịch sử và quán ăn ngon gần đó
                  </p>
                </div>
              </div>

              {nearbySitesWithMetrics.length === 0 ? (
                <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center">
                  <p className="text-sm font-semibold text-stone-700">
                    Không tìm thấy di tích nào trong bán kính hiện tại.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchRadiusMeters(0)}
                    className="mt-3 rounded-xl bg-red-800 px-4 py-2 text-xs font-bold text-white hover:bg-red-900"
                  >
                    Hiển thị tất cả Danh lam Thắng cảnh
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {nearbySitesWithMetrics.map(
                    ({ site, distanceMeters, estimatedWalkingSeconds }, idx) => {
                      const local =
                        site.translations[selectedLanguage] ||
                        site.translations.vi;
                      const visitedRecord = visitedRecords.find(
                        (r) => r.siteId === site.id
                      );
                      const bestRestaurant = [...site.nearbyRestaurants].sort(
                        (a, b) => b.rating - a.rating
                      )[0];

                      return (
                        <div
                          key={site.id}
                          className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xs transition hover:border-amber-400 hover:shadow-md"
                        >
                          <div>
                            {/* Ảnh đại diện di tích */}
                            <div
                              onClick={() => setSelectedSite(site)}
                              className="relative h-48 w-full cursor-pointer overflow-hidden bg-stone-900"
                            >
                              <img
                                src={site.coverImage}
                                alt={local.name}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                <span className="rounded-full bg-stone-900/80 px-2.5 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-xs">
                                  #{idx + 1} Gần nhất
                                </span>
                                {site.unescoRecognized && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-extrabold text-stone-950">
                                    <Award className="h-3 w-3" /> UNESCO
                                  </span>
                                )}
                                {visitedRecord && (
                                  <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
                                    ✓ Đã đi bộ (
                                    {formatWalkingDuration(
                                      visitedRecord.walkingDurationSeconds
                                    )}
                                    )
                                  </span>
                                )}
                              </div>

                              <div className="absolute bottom-3 inset-x-3 flex items-end justify-between text-white">
                                <div>
                                  <span className="text-[11px] font-medium text-amber-300">
                                    {site.city} • {local.historicalEra}
                                  </span>
                                  <h3 className="text-base font-extrabold leading-snug">
                                    {local.name}
                                  </h3>
                                </div>
                              </div>
                            </div>

                            {/* Thông số khoảng cách, thời gian đi bộ, tư liệu & quán ăn */}
                            <div className="p-4 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-100 px-3 py-2 text-xs">
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                                  <Footprints className="h-4 w-4 text-emerald-600" />
                                  {formatWalkingDuration(estimatedWalkingSeconds)}
                                </span>
                                <span className="font-semibold text-stone-600">
                                  Khoảng cách: {formatDistance(distanceMeters)}
                                </span>
                              </div>

                              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                                {local.shortSummary}
                              </p>

                              {/* Tích hợp hiển thị nhanh Tư liệu & Quán ăn đề xuất gần đó */}
                              <div className="space-y-1.5 border-t border-stone-100 pt-2.5 text-xs">
                                <div className="flex items-center justify-between text-stone-600">
                                  <span className="inline-flex items-center gap-1 font-medium">
                                    <Film className="h-3.5 w-3.5 text-red-700" />
                                    Tư liệu: {site.mediaGallery.length} Ảnh & Video
                                  </span>
                                  <span className="inline-flex items-center gap-1 font-medium">
                                    <Volume2 className="h-3.5 w-3.5 text-amber-700" />
                                    5 ngôn ngữ
                                  </span>
                                </div>

                                {bestRestaurant && (
                                  <div className="flex items-center justify-between rounded-xl bg-amber-50/90 border border-amber-200/80 px-2.5 py-1.5">
                                    <span className="inline-flex items-center gap-1.5 font-semibold text-amber-950 truncate">
                                      <Utensils className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                                      <span className="truncate">
                                        Gần đó: {bestRestaurant.name}
                                      </span>
                                    </span>
                                    <span className="inline-flex shrink-0 items-center gap-0.5 font-extrabold text-amber-800">
                                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                      {bestRestaurant.rating.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Nhóm nút thao tác nhanh */}
                          <div className="grid grid-cols-3 gap-1.5 border-t border-stone-100 bg-stone-50 p-3">
                            <button
                              type="button"
                              onClick={() => setSelectedSite(site)}
                              className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-800 px-2.5 py-2 text-xs font-bold text-white hover:bg-red-900"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                              <span>Thuyết minh</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartNavigationToSite(site)}
                              className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-2.5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                            >
                              <Navigation className="h-3.5 w-3.5" />
                              <span>Dẫn đường</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPhotoCaptureSite(site)}
                              className="inline-flex items-center justify-center gap-1 rounded-xl bg-amber-500 px-2.5 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400"
                            >
                              <Camera className="h-3.5 w-3.5" />
                              <span>Lưu ảnh</span>
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Modal Chi tiết Danh lam Thắng cảnh, Giọng nói Đa ngôn ngữ, Tư liệu Ảnh/Video & Quán ăn */}
      {selectedSite && (
        <HeritageDetailModal
          site={selectedSite}
          distanceMeters={
            nearbySitesWithMetrics.find((i) => i.site.id === selectedSite.id)
              ?.distanceMeters || 500
          }
          estimatedWalkingSeconds={
            nearbySitesWithMetrics.find((i) => i.site.id === selectedSite.id)
              ?.estimatedWalkingSeconds || 400
          }
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          onClose={() => setSelectedSite(null)}
          onStartNavigation={handleStartNavigationToSite}
          onNavigateToRestaurant={handleNavigateToRestaurant}
          onOpenPhotoCheckIn={(site) => {
            setSelectedSite(null);
            setPhotoCaptureSite(site);
          }}
        />
      )}

      {/* Modal Chụp & Lưu ảnh tại di tích + Xếp hạng thời gian đi bộ */}
      {photoCaptureSite && (
        <PhotoCaptureModal
          site={photoCaptureSite}
          walkingDurationSeconds={
            activeWalkSeconds > 30
              ? activeWalkSeconds
              : nearbySitesWithMetrics.find(
                  (i) => i.site.id === photoCaptureSite.id
                )?.estimatedWalkingSeconds || 600
          }
          walkingDistanceMeters={
            activeRoute?.totalDistanceMeters ||
            nearbySitesWithMetrics.find(
              (i) => i.site.id === photoCaptureSite.id
            )?.distanceMeters ||
            750
          }
          onClose={() => setPhotoCaptureSite(null)}
          onSaveCheckIn={handleSavePhotoCheckIn}
        />
      )}
    </div>
  );
}

export default App;
