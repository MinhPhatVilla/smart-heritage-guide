import React, { useEffect, useState } from 'react';
import {
  Volume2,
  Navigation,
  Camera,
  LocateFixed,
  Search,
  Footprints,
  X,
  Check,
  Map as MapIcon,
  List,
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
  const [userLocation, setUserLocation] = useState<[number, number]>([
    21.0313, 105.8412,
  ]);
  const [activeCityId, setActiveCityId] = useState<string>('Ha Noi');
  const [gpsStatus, setGpsStatus] = useState<string>('Trung tâm Hà Nội');
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>('vi');
  const [searchRadiusMeters, setSearchRadiusMeters] = useState<number>(15000);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeView, setActiveView] = useState<'explore' | 'journey'>('explore');
  const [mobileLayout, setMobileLayout] = useState<'split' | 'map'>('split');

  const [selectedSite, setSelectedSite] = useState<HeritageSite | null>(null);
  const [quickAudioSite, setQuickAudioSite] = useState<HeritageSite | null>(
    null
  );
  const [photoCaptureSite, setPhotoCaptureSite] =
    useState<HeritageSite | null>(null);
  const [activeRoute, setActiveRoute] = useState<WalkingRouteResult | null>(
    null
  );
  const [isRoutingLoading, setIsRoutingLoading] = useState<boolean>(false);
  const [activeWalkSeconds, setActiveWalkSeconds] = useState<number>(0);
  const [isSimulatingWalk, setIsSimulatingWalk] = useState<boolean>(false);
  const [autoAudioGuide, setAutoAudioGuide] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [visitedRecords, setVisitedRecords] = useState<VisitedSiteRecord[]>(() =>
    loadVisitedSiteRecords()
  );

  useEffect(() => {
    if (!activeRoute) return;
    const interval = setInterval(() => {
      setActiveWalkSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRoute]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const rawNearbySites = getNearbySitesWithMetrics(
    HERITAGE_SITES,
    userLocation[0],
    userLocation[1],
    searchRadiusMeters > 0 ? searchRadiusMeters : undefined
  );

  const nearbySitesWithMetrics = rawNearbySites.filter(({ site }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const local = site.translations[selectedLanguage] || site.translations.vi;
    const matchesName =
      local.name.toLowerCase().includes(q) ||
      site.translations.vi.name.toLowerCase().includes(q) ||
      local.shortSummary.toLowerCase().includes(q);
    const matchesFood = site.nearbyRestaurants.some(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.specialtyDishes.some((d) => d.toLowerCase().includes(q))
    );
    return matchesName || matchesFood;
  });

  const closestSiteItem = rawNearbySites[0];

  const handleDetectRealGps = () => {
    if (!('geolocation' in navigator)) {
      setToastMessage('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }
    setGpsStatus('Đang xác định GPS…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation([lat, lng]);
        setSearchRadiusMeters(0);
        setActiveCityId('GPS');
        setGpsStatus(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
        setToastMessage('Đã cập nhật vị trí GPS thực tế của bạn.');
      },
      () => {
        setGpsStatus('Chưa cấp quyền GPS · Đang dùng vị trí mẫu');
        setToastMessage(
          'Không lấy được GPS thực tế. Bạn có thể chọn khu vực hoặc nhấn lên bản đồ.'
        );
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleSelectCityPreset = (presetId: string) => {
    const preset = CITY_PRESETS.find((c) => c.id === presetId);
    if (!preset) return;
    setActiveCityId(preset.id);
    setUserLocation([preset.lat, preset.lng]);
    setSearchRadiusMeters(15000);
    setActiveRoute(null);
    setGpsStatus(preset.label);
  };

  const handleStartNavigationToSite = async (site: HeritageSite) => {
    const localName =
      (site.translations[selectedLanguage] || site.translations.vi).name;
    setSelectedSite(null);
    setActiveView('explore');
    setMobileLayout('map');
    setIsRoutingLoading(true);
    const route = await fetchWalkingRoute(
      userLocation,
      [site.lat, site.lng],
      localName,
      'heritage',
      site.id
    );
    setIsRoutingLoading(false);
    setActiveRoute(route);
    setActiveWalkSeconds(0);
  };

  const handleNavigateToRestaurant = async (
    restaurant: NearbyRestaurant,
    _parentSite: HeritageSite
  ) => {
    setSelectedSite(null);
    setActiveView('explore');
    setMobileLayout('map');
    setIsRoutingLoading(true);
    const route = await fetchWalkingRoute(
      userLocation,
      [restaurant.lat, restaurant.lng],
      `${restaurant.name} (${restaurant.rating}★)`,
      'restaurant',
      restaurant.id
    );
    setIsRoutingLoading(false);
    setActiveRoute(route);
    setActiveWalkSeconds(0);
  };

  const handleSimulateWalkAlongRoute = () => {
    if (!activeRoute || isSimulatingWalk) return;
    setIsSimulatingWalk(true);

    const coords = activeRoute.coordinates;
    let stepIdx = 0;
    const stepDurationIncrement = Math.max(
      25,
      Math.round(
        activeRoute.estimatedDurationSeconds / Math.max(1, coords.length)
      )
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

        if (activeRoute.targetType === 'heritage') {
          const targetSite = HERITAGE_SITES.find(
            (s) => s.id === activeRoute.targetId
          );
          if (targetSite) {
            setToastMessage(
              `Đã đi bộ đến ${targetSite.translations.vi.name}.`
            );
            if (autoAudioGuide) {
              setQuickAudioSite(targetSite);
            }
          }
        }
        return;
      }

      setUserLocation(coords[stepIdx]);
      setActiveWalkSeconds((prev) => prev + stepDurationIncrement);
    }, 350);
  };

  const handleFinishWalkAndCheckIn = () => {
    if (!activeRoute) return;
    const targetSite = HERITAGE_SITES.find((s) => s.id === activeRoute.targetId);
    if (targetSite) {
      setPhotoCaptureSite(targetSite);
    }
  };

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
    setToastMessage(
      `Đã lưu ảnh và xếp hạng hành trình tại ${photoCaptureSite.translations.vi.name}.`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#141413]">
      {/* Minimalist Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#E6E4DD] bg-[#FAF9F6]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
          {/* Brand & Live Location */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#141413] text-xs font-bold tracking-wider text-white">
                SHG
              </span>
              <span className="font-serif-editorial text-lg font-semibold tracking-tight text-[#141413] truncate">
                Smart Heritage Guide
              </span>
            </div>

            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[#E6E4DD] bg-white px-2.5 py-1 text-xs text-[#57554F]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span className="truncate max-w-[200px]">{gpsStatus}</span>
            </span>
          </div>

          {/* Primary Navigation & Language Selector */}
          <div className="flex items-center gap-2.5">
            {/* View Switcher */}
            <nav
              className="inline-flex rounded-lg border border-[#E6E4DD] bg-white p-0.5"
              aria-label="Chuyển chế độ xem"
            >
              <button
                type="button"
                onClick={() => setActiveView('explore')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeView === 'explore'
                    ? 'bg-[#141413] text-white'
                    : 'text-[#57554F] hover:text-[#141413]'
                }`}
              >
                Bản đồ & Di tích
              </button>
              <button
                type="button"
                onClick={() => setActiveView('journey')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors tabular-nums ${
                  activeView === 'journey'
                    ? 'bg-[#141413] text-white'
                    : 'text-[#57554F] hover:text-[#141413]'
                }`}
              >
                Hành trình & Xếp hạng ({visitedRecords.length})
              </button>
            </nav>

            {/* Language Selector */}
            <div
              className="hidden sm:inline-flex items-center rounded-lg border border-[#E6E4DD] bg-white p-0.5"
              role="group"
              aria-label="Ngôn ngữ thuyết minh"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`rounded-md px-2 py-1 text-xs font-medium uppercase transition-colors ${
                    selectedLanguage === lang.code
                      ? 'bg-[#141413] text-white'
                      : 'text-[#57554F] hover:text-[#141413]'
                  }`}
                  title={lang.nativeLabel}
                >
                  {lang.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
          <div className="mx-auto flex max-w-[1440px] flex-col-reverse lg:flex-row lg:h-[calc(100vh-65px)] lg:overflow-hidden">
            {/* Left Column: Discovery Rail & Controls */}
            <div
              className={`flex w-full lg:w-[460px] xl:w-[500px] shrink-0 flex-col border-t lg:border-t-0 lg:border-r border-[#E6E4DD] bg-[#FAF9F6] lg:h-full lg:overflow-y-auto ${
                mobileLayout === 'map' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Location Filter & Search Header */}
              <div className="space-y-3 border-b border-[#E6E4DD] bg-white p-4">
                {/* City Presets + Real GPS */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <button
                    type="button"
                    onClick={handleDetectRealGps}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      activeCityId === 'GPS'
                        ? 'border-[#141413] bg-[#141413] text-white'
                        : 'border-[#E6E4DD] bg-[#FAF9F6] text-[#141413] hover:bg-[#F3F1EC]'
                    }`}
                  >
                    <LocateFixed className="h-3.5 w-3.5 text-blue-600" />
                    <span>GPS thực tế</span>
                  </button>

                  {CITY_PRESETS.map((city) => {
                    const active = activeCityId === city.id;
                    return (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleSelectCityPreset(city.id)}
                        className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? 'border-[#141413] bg-[#141413] text-white'
                            : 'border-[#E6E4DD] bg-white text-[#57554F] hover:text-[#141413]'
                        }`}
                      >
                        {city.label}
                      </button>
                    );
                  })}
                </div>

                {/* Search & Radius Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#8A877F]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm di tích hoặc món ăn đặc sản…"
                      className="w-full rounded-lg border border-[#E6E4DD] bg-[#FAF9F6] py-1.5 pr-7 pl-8 text-xs text-[#141413] placeholder:text-[#8A877F] focus:border-[#141413] focus:bg-white focus:outline-hidden"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute top-1/2 right-2 -translate-y-1/2 text-[#8A877F] hover:text-[#141413]"
                        aria-label="Xóa tìm kiếm"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <select
                    value={searchRadiusMeters}
                    onChange={(e) =>
                      setSearchRadiusMeters(Number(e.target.value))
                    }
                    className="rounded-lg border border-[#E6E4DD] bg-[#FAF9F6] px-2.5 py-1.5 text-xs font-medium text-[#141413] focus:border-[#141413] focus:outline-hidden"
                    aria-label="Bán kính quét"
                  >
                    <option value={5000}>Trong 5 km</option>
                    <option value={15000}>Trong 15 km</option>
                    <option value={0}>Toàn quốc</option>
                  </select>
                </div>

                {/* Auto Audio Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs text-[#57554F]">
                  <span>
                    Tìm thấy{' '}
                    <strong className="font-semibold text-[#141413] tabular-nums">
                      {nearbySitesWithMetrics.length}
                    </strong>{' '}
                    danh lam thắng cảnh
                  </span>

                  <label className="inline-flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={autoAudioGuide}
                      onChange={(e) => setAutoAudioGuide(e.target.checked)}
                      className="accent-[#141413] h-3.5 w-3.5 rounded"
                    />
                    <span>Tự động đọc khi đến gần</span>
                  </label>
                </div>
              </div>

              {/* Proximity Alert or Quick Audio Player */}
              {quickAudioSite ? (
                <div className="border-b border-[#E6E4DD] bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B93815]">
                      Đang phát thuyết minh
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuickAudioSite(null)}
                      className="text-xs text-[#8A877F] hover:text-[#141413]"
                    >
                      Đóng
                    </button>
                  </div>
                  <AudioGuidePlayer
                    site={quickAudioSite}
                    selectedLanguage={selectedLanguage}
                    onLanguageChange={setSelectedLanguage}
                    autoPlayOnOpen={true}
                    compact={true}
                  />
                </div>
              ) : (
                closestSiteItem &&
                closestSiteItem.distanceMeters <= 350 && (
                  <div className="flex items-center justify-between gap-3 border-b border-[#E6E4DD] bg-white px-4 py-3">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-[#B93815]">
                        Cách bạn {formatDistance(closestSiteItem.distanceMeters)}
                      </span>
                      <p className="truncate text-xs font-semibold text-[#141413]">
                        {(
                          closestSiteItem.site.translations[selectedLanguage] ||
                          closestSiteItem.site.translations.vi
                        ).name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuickAudioSite(closestSiteItem.site)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#141413] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2C2B29]"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      Nghe ngay
                    </button>
                  </div>
                )
              )}

              {/* Heritage Sites Feed */}
              <div className="divide-y divide-[#E6E4DD]">
                {nearbySitesWithMetrics.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <p className="text-sm font-medium text-[#141413]">
                      Không tìm thấy danh lam thắng cảnh phù hợp
                    </p>
                    <p className="text-xs text-[#8A877F]">
                      Thử mở rộng bán kính tìm kiếm hoặc xóa từ khóa lọc hiện tại.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchRadiusMeters(0);
                        setSearchQuery('');
                      }}
                      className="rounded-lg bg-[#141413] px-3.5 py-2 text-xs font-medium text-white"
                    >
                      Xem toàn bộ di tích
                    </button>
                  </div>
                ) : (
                  nearbySitesWithMetrics.map(
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
                        <article
                          key={site.id}
                          className="group bg-white p-4 transition-colors hover:bg-[#FAF9F6]"
                        >
                          <div className="flex gap-3.5">
                            {/* Thumbnail */}
                            <button
                              type="button"
                              onClick={() => setSelectedSite(site)}
                              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[#E6E4DD] bg-[#F3F1EC]"
                            >
                              <img
                                src={site.coverImage}
                                alt={local.name}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />
                              <span className="absolute top-1.5 left-1.5 rounded bg-[#141413]/80 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                                0{idx + 1}
                              </span>
                            </button>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 text-[11px] text-[#8A877F]">
                                <span className="truncate">
                                  {site.city} · {local.historicalEra}
                                </span>
                                {visitedRecord && (
                                  <span className="shrink-0 font-medium text-emerald-700 tabular-nums">
                                    ✓ Đã đi{' '}
                                    {formatWalkingDuration(
                                      visitedRecord.walkingDurationSeconds
                                    )}
                                  </span>
                                )}
                              </div>

                              <h3
                                onClick={() => setSelectedSite(site)}
                                className="mt-0.5 cursor-pointer font-serif-editorial text-base font-semibold leading-snug text-[#141413] hover:underline"
                              >
                                {local.name}
                              </h3>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#57554F] tabular-nums">
                                <span className="inline-flex items-center gap-1 font-medium text-[#141413]">
                                  <Footprints className="h-3.5 w-3.5 text-[#B93815]" />
                                  {formatWalkingDuration(estimatedWalkingSeconds)}
                                </span>
                                <span>·</span>
                                <span>{formatDistance(distanceMeters)}</span>
                                <span>·</span>
                                <span>{site.mediaGallery.length} tư liệu</span>
                              </div>

                              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#57554F]">
                                {local.shortSummary}
                              </p>

                              {bestRestaurant && (
                                <div className="mt-2 flex items-center justify-between rounded-lg border border-[#E6E4DD] bg-[#FAF9F6] px-2.5 py-1 text-[11px]">
                                  <span className="truncate text-[#57554F]">
                                    Ẩm thực gần đó:{' '}
                                    <strong className="font-medium text-[#141413]">
                                      {bestRestaurant.name}
                                    </strong>
                                  </span>
                                  <span className="ml-2 shrink-0 font-semibold text-[#141413] tabular-nums">
                                    <span className="text-[#B93815]">★</span>{' '}
                                    {bestRestaurant.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Clean Action Row */}
                          <div className="mt-3 flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setSelectedSite(site)}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#141413] px-3 py-2 text-xs font-medium text-white hover:bg-[#2C2B29] transition-colors"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                              <span>Thuyết minh & Tư liệu</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartNavigationToSite(site)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#E6E4DD] bg-white px-3 py-2 text-xs font-medium text-[#141413] hover:bg-[#F3F1EC] transition-colors"
                            >
                              <Navigation className="h-3.5 w-3.5 text-[#B93815]" />
                              <span>Dẫn đường</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPhotoCaptureSite(site)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#E6E4DD] bg-white px-2.5 py-2 text-xs font-medium text-[#57554F] hover:bg-[#F3F1EC] hover:text-[#141413] transition-colors"
                              title="Chụp & Lưu ảnh tại di tích"
                            >
                              <Camera className="h-3.5 w-3.5" />
                              <span className="sr-only sm:not-sr-only">Lưu ảnh</span>
                            </button>
                          </div>
                        </article>
                      );
                    }
                  )
                )}
              </div>
            </div>

            {/* Right Column: Interactive Map Workspace (Luôn nằm trên cùng ở màn hình nhỏ và bên phải ở màn hình lớn) */}
            <div className="w-full flex-1 p-3 sm:p-4 bg-[#FAF9F6]">
              {/* Nút chuyển nhanh Bản đồ / Danh sách trên màn hình nhỏ */}
              <div className="mb-2 flex items-center justify-between lg:hidden">
                <span className="text-xs font-semibold text-[#141413]">
                  Bản đồ Định vị Di tích & Quán ăn
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setMobileLayout((prev) =>
                      prev === 'split' ? 'map' : 'split'
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6E4DD] bg-white px-2.5 py-1 text-xs font-medium text-[#141413]"
                >
                  {mobileLayout === 'split' ? (
                    <>
                      <MapIcon className="h-3.5 w-3.5" />
                      <span>Mở rộng bản đồ</span>
                    </>
                  ) : (
                    <>
                      <List className="h-3.5 w-3.5" />
                      <span>Hiện danh sách di tích</span>
                    </>
                  )}
                </button>
              </div>

              <MapExplorer
                userLocation={userLocation}
                sites={nearbySitesWithMetrics.map((i) => i.site)}
                selectedSiteId={selectedSite?.id || activeRoute?.targetId}
                visitedRecords={visitedRecords}
                selectedLanguage={selectedLanguage}
                activeRoute={activeRoute}
                isRoutingLoading={isRoutingLoading}
                activeWalkSeconds={activeWalkSeconds}
                isSimulatingWalk={isSimulatingWalk}
                searchRadiusMeters={searchRadiusMeters}
                onSelectSite={(site) => setSelectedSite(site)}
                onStartRouteToSite={handleStartNavigationToSite}
                onStartRouteToRestaurant={handleNavigateToRestaurant}
                onSimulateWalkAlongRoute={handleSimulateWalkAlongRoute}
                onFinishWalkAndCheckIn={handleFinishWalkAndCheckIn}
                onCancelRoute={() => setActiveRoute(null)}
                onDetectRealGps={handleDetectRealGps}
                onMoveUserLocation={(lat, lng) => {
                  setUserLocation([lat, lng]);
                  setGpsStatus(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#E6E4DD] bg-[#141413] px-4 py-2.5 text-xs font-medium text-white shadow-lg">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSite && (
        <HeritageDetailModal
          site={selectedSite}
          userLocation={userLocation}
          distanceMeters={
            rawNearbySites.find((i) => i.site.id === selectedSite.id)
              ?.distanceMeters || 500
          }
          estimatedWalkingSeconds={
            rawNearbySites.find((i) => i.site.id === selectedSite.id)
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

      {/* Photo Check-in & Walking Duration Modal */}
      {photoCaptureSite && (
        <PhotoCaptureModal
          site={photoCaptureSite}
          walkingDurationSeconds={
            activeWalkSeconds > 30
              ? activeWalkSeconds
              : rawNearbySites.find((i) => i.site.id === photoCaptureSite.id)
                  ?.estimatedWalkingSeconds || 600
          }
          walkingDistanceMeters={
            activeRoute?.totalDistanceMeters ||
            rawNearbySites.find((i) => i.site.id === photoCaptureSite.id)
              ?.distanceMeters ||
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
