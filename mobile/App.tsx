import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  BookOpen,
  Check,
  ChevronDown,
  Compass,
  Footprints,
  Globe,
  LocateFixed,
  Map as MapIcon,
  MessageSquareText,
  Navigation,
  Route,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
  User,
  Utensils,
  Volume2,
  X,
} from 'lucide-react-native';
import {
  CapturedPhoto,
  HeritageCategory,
  HeritageSite,
  NearbyRestaurant,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  VisitedSiteRecord,
  WalkingRouteResult,
} from './src/types/heritage';
import { CITY_PRESETS, HERITAGE_SITES } from './src/data/heritageSites';
import {
  calculateBearingDegrees,
  calculateDistanceMeters,
  estimateWalkingSeconds,
  formatDistance,
  formatWalkingDuration,
  getNearbySitesWithMetrics,
  interpolateRouteForSmoothWalk,
} from './src/utils/geoUtils';
import { fetchWalkingRoute } from './src/services/routingService';
import {
  INITIAL_SAMPLE_JOURNEYS,
  applyVerificationMetaToLocalRecord,
  loadJourneys,
  syncAllOfflineJourneys,
  syncCheckInToCloud,
  uploadPhotoToCloud,
  upsertSiteVisitRecord,
} from './src/services/journeyStorage';
import {
  AuthSessionState,
  UserProfile,
  fetchCurrentProfile,
  loadStoredAuthState,
  logoutAccount,
} from './src/services/authService';
import {
  LocationWatchHandle,
  formatCoordinatesLabel,
  getCurrentLocation,
  watchDeviceHeading,
  watchLocation,
} from './src/services/locationService';
import { speechService } from './src/services/speechService';
import {
  WeatherSnapshot,
  fetchLiveWeather,
} from './src/services/weatherService';
import { MapExplorer } from './src/components/MapExplorer';
import { HeritageDetailModal } from './src/components/HeritageDetailModal';
import { PhotoCaptureModal } from './src/components/PhotoCaptureModal';
import { JourneyAndRankingView } from './src/components/JourneyAndRankingView';
import { AudioGuidePlayer } from './src/components/AudioGuidePlayer';
import { SiteCard } from './src/components/SiteCard';
import { SmartTourModal } from './src/components/SmartTourModal';
import { AiChatModal } from './src/components/AiChatModal';
import { AuthModal } from './src/components/AuthModal';
import { AdminDashboardView } from './src/components/AdminDashboardView';
import { WeatherWidgetCard } from './src/components/WeatherWidgetCard';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from './src/theme';

type MainTab = 'explore' | 'map' | 'journey' | 'ranking' | 'admin';

const PROXIMITY_TRIGGER_METERS = 150;
const PROXIMITY_RESET_METERS = 220;

const RADIUS_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Toàn TP.HCM' },
  { value: 3000, label: '3 km' },
  { value: 8000, label: '8 km' },
  { value: 20000, label: '20 km' },
];

const CATEGORY_FILTERS: Array<{
  id: 'all' | HeritageCategory;
  label: string;
}> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'monument', label: 'Di tích' },
  { id: 'museum', label: 'Bảo tàng' },
  { id: 'temple', label: 'Đền Chùa' },
  { id: 'imperial', label: 'Dinh thự' },
  { id: 'ancient_town', label: 'Chợ & Sinh quyển' },
];

function triggerHaptic(type: 'light' | 'success' | 'selection'): void {
  if (Platform.OS === 'web') return;
  try {
    if (type === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'selection') {
      void Haptics.selectionAsync();
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // Ignore haptic errors on unsupported hardware
  }
}

function SmartHeritageAppContent() {
  const insets = useSafeAreaInsets();

  const [userLocation, setUserLocation] = useState<[number, number]>([
    10.7775, 106.699,
  ]);
  const [userHeading, setUserHeading] = useState<number | null>(null);
  const [activeCityId, setActiveCityId] = useState<string>('ALL_HCM');
  const [focusHcmcOnly, setFocusHcmcOnly] = useState<boolean>(true);
  const [gpsStatus, setGpsStatus] = useState<string>('Trung tâm Quận 1');
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);

  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>('vi');
  const [searchRadiusMeters, setSearchRadiusMeters] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | HeritageCategory
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<MainTab>('explore');
  const [exploreSection, setExploreSection] = useState<'sites' | 'dining'>('sites');
  const [isMapMounted, setIsMapMounted] = useState<boolean>(false);

  // Compact bottom sheets (replaces cluttered stacked toolbars)
  const [filterSheetVisible, setFilterSheetVisible] = useState<boolean>(false);
  const [langSheetVisible, setLangSheetVisible] = useState<boolean>(false);

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

  const [catalogSites, setCatalogSites] = useState<HeritageSite[]>(HERITAGE_SITES);
  const [visitedRecords, setVisitedRecords] = useState<VisitedSiteRecord[]>(
    INITIAL_SAMPLE_JOURNEYS
  );

  const [authState, setAuthState] = useState<AuthSessionState>({
    isAuthenticated: false,
    isGuest: true,
    profile: null,
  });
  const [authModalVisible, setAuthModalVisible] = useState<boolean>(false);
  const [smartTourVisible, setSmartTourVisible] = useState<boolean>(false);
  const [aiChatVisible, setAiChatVisible] = useState<boolean>(false);
  const [aiChatContextSite, setAiChatContextSite] =
    useState<HeritageSite | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const lastWeatherCoordsRef = useRef<[number, number] | null>(null);

  const walkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsWatchRef = useRef<LocationWatchHandle | null>(null);
  const lastAutoTriggeredSiteIdRef = useRef<string | null>(null);
  const usedSimulatedWalkRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;
    void loadJourneys().then((loaded) => {
      if (mounted) {
        setVisitedRecords(loaded);
      }
    });
    void loadStoredAuthState().then((storedAuth) => {
      if (!mounted) return;
      setAuthState(storedAuth);
      if (storedAuth.isAuthenticated) {
        void fetchCurrentProfile().then((res) => {
          if (!mounted) return;
          if (res.ok) {
            setAuthState({
              isAuthenticated: true,
              isGuest: false,
              profile: res.data,
            });
          } else if (res.status === 401) {
            setAuthState({
              isAuthenticated: false,
              isGuest: true,
              profile: null,
            });
          }
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (walkTimerRef.current) {
        clearInterval(walkTimerRef.current);
        walkTimerRef.current = null;
      }
      if (gpsWatchRef.current) {
        gpsWatchRef.current.remove();
        gpsWatchRef.current = null;
      }
      speechService.stop();
    };
  }, []);

  useEffect(() => {
    if (!activeRoute) return;
    const interval = setInterval(() => {
      setActiveWalkSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRoute]);

  // Theo dõi la bàn điện thoại thật (Heading-Up 3D) khi đang dẫn đường OSRM và không chạy mô phỏng
  useEffect(() => {
    if (!activeRoute || isSimulatingWalk) return;
    let cancelled = false;
    let handle: LocationWatchHandle | null = null;

    void watchDeviceHeading({
      onUpdate: (headingDeg) => {
        if (!cancelled) {
          setUserHeading(headingDeg);
        }
      },
    }).then((sub) => {
      if (cancelled) {
        sub?.remove();
      } else {
        handle = sub;
      }
    });

    return () => {
      cancelled = true;
      handle?.remove();
    };
  }, [activeRoute, isSimulatingWalk]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 3800);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const refreshLiveWeather = useCallback(
    async (lat: number, lng: number, forceRefresh = false) => {
      setIsWeatherLoading(true);
      const snapshot = await fetchLiveWeather(lat, lng, { forceRefresh });
      setWeather(snapshot);
      lastWeatherCoordsRef.current = [lat, lng];
      setIsWeatherLoading(false);
    },
    []
  );

  // Tự động cập nhật thời tiết khi đổi vị trí (> 1.5km), mỗi 5 phút & khi quay lại ứng dụng
  useEffect(() => {
    const prev = lastWeatherCoordsRef.current;
    const movedEnough =
      !prev ||
      calculateDistanceMeters(
        prev[0],
        prev[1],
        userLocation[0],
        userLocation[1]
      ) > 1500;

    if (movedEnough) {
      void refreshLiveWeather(userLocation[0], userLocation[1], false);
    }

    const interval = setInterval(() => {
      void refreshLiveWeather(userLocation[0], userLocation[1], true);
    }, 5 * 60 * 1000);

    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshLiveWeather(userLocation[0], userLocation[1], true);
      }
    });

    let removeVisibility: (() => void) | undefined;
    if (Platform.OS === 'web') {
      const doc = (
        globalThis as unknown as {
          document?: {
            visibilityState?: string;
            addEventListener?: (ev: string, fn: () => void) => void;
            removeEventListener?: (ev: string, fn: () => void) => void;
          };
        }
      ).document;
      if (doc?.addEventListener && doc.removeEventListener) {
        const onVis = () => {
          if (doc.visibilityState === 'visible') {
            void refreshLiveWeather(userLocation[0], userLocation[1], true);
          }
        };
        doc.addEventListener('visibilitychange', onVis);
        removeVisibility = () => doc.removeEventListener?.('visibilitychange', onVis);
      }
    }

    return () => {
      clearInterval(interval);
      appSub.remove();
      removeVisibility?.();
    };
  }, [userLocation, refreshLiveWeather]);

  const stopWalkSimulation = useCallback(() => {
    if (walkTimerRef.current) {
      clearInterval(walkTimerRef.current);
      walkTimerRef.current = null;
    }
    setIsSimulatingWalk(false);
  }, []);

  const stopGpsWatch = useCallback(() => {
    if (gpsWatchRef.current) {
      gpsWatchRef.current.remove();
      gpsWatchRef.current = null;
    }
  }, []);

  const rawNearbySites = useMemo(
    () =>
      getNearbySitesWithMetrics(
        catalogSites,
        userLocation[0],
        userLocation[1],
        searchRadiusMeters > 0 ? searchRadiusMeters : undefined
      ),
    [catalogSites, userLocation, searchRadiusMeters]
  );

  const allSitesWithMetrics = useMemo(
    () =>
      getNearbySitesWithMetrics(
        catalogSites,
        userLocation[0],
        userLocation[1]
      ),
    [catalogSites, userLocation]
  );

  const nearbySitesWithMetrics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rawNearbySites.filter(({ site }) => {
      if (selectedCategory !== 'all' && site.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const local = site.translations[selectedLanguage] || site.translations.vi;
      const matchesName =
        local.name.toLowerCase().includes(q) ||
        site.translations.vi.name.toLowerCase().includes(q) ||
        local.shortSummary.toLowerCase().includes(q) ||
        site.city.toLowerCase().includes(q) ||
        (site.address ? site.address.toLowerCase().includes(q) : false);
      const matchesFood = site.nearbyRestaurants.some(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.specialtyDishes.some((d) => d.toLowerCase().includes(q))
      );
      return matchesName || matchesFood;
    });
  }, [rawNearbySites, selectedCategory, searchQuery, selectedLanguage]);

  const closestSiteItem = allSitesWithMetrics[0];

  useEffect(() => {
    if (!closestSiteItem) return;

    if (closestSiteItem.distanceMeters < PROXIMITY_TRIGGER_METERS) {
      if (
        autoAudioGuide &&
        lastAutoTriggeredSiteIdRef.current !== closestSiteItem.site.id
      ) {
        lastAutoTriggeredSiteIdRef.current = closestSiteItem.site.id;
        triggerHaptic('selection');
        setQuickAudioSite(closestSiteItem.site);
        const localName = (
          closestSiteItem.site.translations[selectedLanguage] ||
          closestSiteItem.site.translations.vi
        ).name;
        setToastMessage(
          `Gần ${localName} (${formatDistance(closestSiteItem.distanceMeters)}) · Tự động mở thuyết minh.`
        );
      }
    } else if (closestSiteItem.distanceMeters >= PROXIMITY_RESET_METERS) {
      lastAutoTriggeredSiteIdRef.current = null;
    }
  }, [closestSiteItem, autoAudioGuide, selectedLanguage]);

  const visitedMap = useMemo(() => {
    const map = new Map<string, VisitedSiteRecord>();
    visitedRecords.forEach((rec) => map.set(rec.siteId, rec));
    return map;
  }, [visitedRecords]);

  const handleDetectRealGps = useCallback(async () => {
    stopWalkSimulation();
    stopGpsWatch();
    setIsLocatingGps(true);
    setGpsStatus('Đang định vị…');

    const result = await getCurrentLocation({ timeoutMs: 8000 });
    setIsLocatingGps(false);

    if (result.ok && result.tuple) {
      const [lat, lng] = result.tuple;
      setUserLocation([lat, lng]);
      setSearchRadiusMeters(0);
      setActiveCityId('GPS');
      setGpsStatus(formatCoordinatesLabel(lat, lng));
      setToastMessage('Đã cập nhật vị trí GPS thực tế.');
      triggerHaptic('light');

      const handle = await watchLocation({
        distanceIntervalMeters: 15,
        timeIntervalMs: 5000,
        onUpdate: (_coords, tuple) => {
          setUserLocation(tuple);
          setGpsStatus(formatCoordinatesLabel(tuple[0], tuple[1]));
        },
      });
      gpsWatchRef.current = handle;
    } else {
      setGpsStatus('Trung tâm Quận 1');
      setToastMessage(
        result.error ||
          'Chưa lấy được GPS thực tế. Bạn có thể chọn khu vực trong Bộ lọc.'
      );
    }
  }, [stopGpsWatch, stopWalkSimulation]);

  const handleSelectCityPreset = useCallback(
    (presetId: string) => {
      const preset = CITY_PRESETS.find((c) => c.id === presetId);
      if (!preset) return;
      stopWalkSimulation();
      stopGpsWatch();
      setActiveCityId(preset.id);
      setFocusHcmcOnly(true);
      setUserLocation([preset.lat, preset.lng]);
      setSearchRadiusMeters(preset.defaultRadius);
      setActiveRoute(null);
      setGpsStatus(preset.label);
      triggerHaptic('selection');
    },
    [stopGpsWatch, stopWalkSimulation]
  );

  const handleStartNavigationToSite = useCallback(
    async (site: HeritageSite) => {
      stopWalkSimulation();
      const localName = (
        site.translations[selectedLanguage] || site.translations.vi
      ).name;
      setSelectedSite(null);
      setActiveTab('map');
      setIsRoutingLoading(true);
      triggerHaptic('light');

      const route = await fetchWalkingRoute(
        userLocation,
        [site.lat, site.lng],
        localName,
        'heritage',
        site.id
      );
      setIsRoutingLoading(false);
      setActiveRoute(route);
      if (route.coordinates.length >= 2) {
        setUserHeading(
          calculateBearingDegrees(route.coordinates[0], route.coordinates[1])
        );
      } else {
        setUserHeading(calculateBearingDegrees(userLocation, [site.lat, site.lng]));
      }
      setActiveWalkSeconds(0);
      usedSimulatedWalkRef.current = false;
    },
    [selectedLanguage, stopWalkSimulation, userLocation]
  );

  const handleNavigateToRestaurant = useCallback(
    async (restaurant: NearbyRestaurant, _parentSite: HeritageSite) => {
      stopWalkSimulation();
      setSelectedSite(null);
      setActiveTab('map');
      setIsRoutingLoading(true);
      triggerHaptic('light');

      const route = await fetchWalkingRoute(
        userLocation,
        [restaurant.lat, restaurant.lng],
        `${restaurant.name} (${restaurant.rating.toFixed(1)}★)`,
        'restaurant',
        restaurant.id
      );
      setIsRoutingLoading(false);
      setActiveRoute(route);
      if (route.coordinates.length >= 2) {
        setUserHeading(
          calculateBearingDegrees(route.coordinates[0], route.coordinates[1])
        );
      } else {
        setUserHeading(
          calculateBearingDegrees(userLocation, [restaurant.lat, restaurant.lng])
        );
      }
      setActiveWalkSeconds(0);
    },
    [stopWalkSimulation, userLocation]
  );

  const handleSimulateWalkAlongRoute = useCallback(() => {
    if (!activeRoute || isSimulatingWalk) return;
    stopGpsWatch();
    usedSimulatedWalkRef.current = true;
    setIsSimulatingWalk(true);
    triggerHaptic('light');

    // Nội suy đều ~10m mỗi bước dọc tuyến OSRM để camera 3D lướt êm qua mọi khúc cua
    const coords = interpolateRouteForSmoothWalk(activeRoute.coordinates, 10);
    let stepIdx = 0;
    const stepDurationIncrement = Math.max(
      6,
      Math.round(
        activeRoute.estimatedDurationSeconds / Math.max(1, coords.length)
      )
    );

    if (coords.length >= 2) {
      setUserHeading(calculateBearingDegrees(coords[0], coords[1]));
    }

    walkTimerRef.current = setInterval(() => {
      stepIdx += 1;
      if (stepIdx >= coords.length) {
        if (walkTimerRef.current) {
          clearInterval(walkTimerRef.current);
          walkTimerRef.current = null;
        }
        setIsSimulatingWalk(false);
        const dest = activeRoute.destination;
        setUserLocation(dest);
        setGpsStatus(formatCoordinatesLabel(dest[0], dest[1]));
        setActiveWalkSeconds((prev) =>
          Math.max(prev, activeRoute.estimatedDurationSeconds)
        );
        triggerHaptic('success');

        if (activeRoute.targetType === 'heritage') {
          const targetSite = catalogSites.find(
            (s) => s.id === activeRoute.targetId
          );
          if (targetSite) {
            lastAutoTriggeredSiteIdRef.current = targetSite.id;
            setToastMessage(
              `Đã đi bộ đến ${targetSite.translations.vi.name}! Bạn có thể check-in lưu ảnh ngay.`
            );
            if (autoAudioGuide) {
              setQuickAudioSite(targetSite);
            }
          }
        } else {
          setToastMessage(`Đã đến ${activeRoute.targetName}!`);
        }
        return;
      }

      const nextCoord = coords[stepIdx];
      const lookAheadIdx = Math.min(coords.length - 1, stepIdx + 2);
      const lookAheadCoord = coords[lookAheadIdx];
      if (lookAheadIdx > stepIdx) {
        setUserHeading(calculateBearingDegrees(nextCoord, lookAheadCoord));
      }
      setUserLocation(nextCoord);
      setActiveWalkSeconds((prev) => prev + stepDurationIncrement);
    }, 260);
  }, [activeRoute, autoAudioGuide, isSimulatingWalk, stopGpsWatch]);

  const handleCancelRoute = useCallback(() => {
    stopWalkSimulation();
    setActiveRoute(null);
    setUserHeading(null);
    setActiveWalkSeconds(0);
  }, [stopWalkSimulation]);

  const handleFinishWalkAndCheckIn = useCallback(() => {
    if (!activeRoute) return;
    stopWalkSimulation();
    triggerHaptic('success');
    const targetSite = catalogSites.find(
      (s) => s.id === activeRoute.targetId
    );
    if (targetSite) {
      setPhotoCaptureSite(targetSite);
    } else {
      setActiveRoute(null);
      setToastMessage(`Hoàn thành hành trình tới ${activeRoute.targetName}!`);
    }
  }, [activeRoute, catalogSites, stopWalkSimulation]);

  const handleSavePhotoCheckIn = useCallback(
    async (data: {
      photo: CapturedPhoto;
      userNote: string;
      userRating: number;
      walkingDurationSeconds: number;
      walkingDistanceMeters: number;
      imageBase64?: string | null;
      mimeType?: string;
      visionDetectedSiteId?: string | null;
      visionConfidence?: number | null;
    }) => {
      if (!photoCaptureSite) return;
      const routeCoords: [number, number][] = activeRoute?.coordinates || [
        userLocation,
        [photoCaptureSite.lat, photoCaptureSite.lng],
      ];
      const wasSimulated = usedSimulatedWalkRef.current;

      const updated = await upsertSiteVisitRecord(visitedRecords, {
        siteId: photoCaptureSite.id,
        siteName: photoCaptureSite.translations.vi.name,
        city: photoCaptureSite.city,
        coverImage: photoCaptureSite.coverImage,
        walkingDurationSeconds: data.walkingDurationSeconds,
        walkingDistanceMeters: data.walkingDistanceMeters,
        routeCoordinates: routeCoords,
        photo: data.photo,
        userNote: data.userNote,
        userRating: data.userRating,
      });
      setVisitedRecords(updated);
      setActiveRoute(null);
      setActiveWalkSeconds(0);
      usedSimulatedWalkRef.current = false;
      setPhotoCaptureSite(null);
      triggerHaptic('success');

      if (!authState.isAuthenticated) {
        setToastMessage(
          `Đã lưu ảnh & xếp hạng hành trình tại ${photoCaptureSite.translations.vi.name}.`
        );
        return;
      }

      const cloudRes = await syncCheckInToCloud({
        siteId: photoCaptureSite.id,
        checkinLat: data.photo.lat,
        checkinLng: data.photo.lng,
        walkingDurationSeconds: data.walkingDurationSeconds,
        walkingDistanceMeters: data.walkingDistanceMeters,
        routeCoordinates: routeCoords,
        userNote: data.userNote,
        userRating: data.userRating,
        isSimulated: wasSimulated,
        visionVerifiedSiteId: data.visionDetectedSiteId ?? null,
        visionConfidence: data.visionConfidence ?? null,
      });

      if (cloudRes.ok) {
        const syncedList = await applyVerificationMetaToLocalRecord(
          updated,
          photoCaptureSite.id,
          {
            cloudJourneyId: cloudRes.data.journey.id,
            verificationStatus: cloudRes.data.verification.status,
            verificationScore: cloudRes.data.verification.score,
          }
        );
        setVisitedRecords(syncedList);

        if (data.imageBase64) {
          void uploadPhotoToCloud(cloudRes.data.journey.id, data.photo, {
            imageBase64: data.imageBase64,
            mimeType: data.mimeType,
            visionDetectedSiteId: data.visionDetectedSiteId,
            visionConfidence: data.visionConfidence,
          });
        }

        void fetchCurrentProfile().then((profRes) => {
          if (profRes.ok) {
            setAuthState({
              isAuthenticated: true,
              isGuest: false,
              profile: profRes.data,
            });
          }
        });

        const newBadges = cloudRes.data.newly_unlocked_badges || [];
        if (newBadges.length > 0) {
          const badgeTitles = newBadges.map((b) => b.title_vi).join(', ');
          setToastMessage(
            `Mở khóa huy hiệu mới: ${badgeTitles}! (${photoCaptureSite.translations.vi.name})`
          );
        } else if (cloudRes.data.verification.status === 'verified') {
          setToastMessage(
            `Đã đồng bộ & xác thực GPS (${Math.round(
              cloudRes.data.verification.score
            )}đ) tại ${photoCaptureSite.translations.vi.name}.`
          );
        } else if (cloudRes.data.verification.status === 'simulated') {
          setToastMessage(
            `Đã lưu nhật ký (Chế độ Mô phỏng) tại ${photoCaptureSite.translations.vi.name}.`
          );
        } else {
          setToastMessage(
            `Đã lưu hành trình tại ${photoCaptureSite.translations.vi.name} (cần kiểm tra tốc độ/GPS).`
          );
        }
      } else {
        setToastMessage(
          `Đã lưu cục bộ (Offline) tại ${photoCaptureSite.translations.vi.name}.`
        );
      }
    },
    [
      activeRoute,
      authState.isAuthenticated,
      photoCaptureSite,
      userLocation,
      visitedRecords,
    ]
  );

  const isAdminUser = authState.isAuthenticated && authState.profile?.role === 'admin';

  const handleAuthSuccess = useCallback((profile: UserProfile) => {
    setAuthState({
      isAuthenticated: true,
      isGuest: false,
      profile,
    });
    setAuthModalVisible(false);
    if (profile.role === 'admin') {
      setActiveTab('admin');
      setToastMessage(`Xin chào Admin ${profile.display_name}! Đã mở bảng Quản trị.`);
    } else {
      setToastMessage(`Xin chào ${profile.display_name}! Đã bật đồng bộ Cloud.`);
    }
    triggerHaptic('success');
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutAccount();
    setAuthState({
      isAuthenticated: false,
      isGuest: true,
      profile: null,
    });
    setActiveTab((prev) => (prev === 'admin' ? 'explore' : prev));
    setToastMessage('Đã chuyển về chế độ Khách (Offline).');
  }, []);

  const handleAdminUpsertSite = useCallback((nextSite: HeritageSite) => {
    setCatalogSites((prev) => {
      const exists = prev.some((s) => s.id === nextSite.id);
      if (exists) {
        return prev.map((s) => (s.id === nextSite.id ? nextSite : s));
      }
      return [nextSite, ...prev];
    });
  }, []);

  const handleAdminDeleteSite = useCallback((siteId: string) => {
    setCatalogSites((prev) => prev.filter((s) => s.id !== siteId));
    setSelectedSite((prev) => (prev?.id === siteId ? null : prev));
  }, []);

  const handleAdminUpsertRestaurant = useCallback(
    (siteId: string, nextRestaurant: NearbyRestaurant) => {
      setCatalogSites((prev) =>
        prev.map((site) => {
          if (site.id !== siteId) return site;
          const exists = site.nearbyRestaurants.some(
            (r) => r.id === nextRestaurant.id
          );
          return {
            ...site,
            nearbyRestaurants: exists
              ? site.nearbyRestaurants.map((r) =>
                  r.id === nextRestaurant.id ? nextRestaurant : r
                )
              : [nextRestaurant, ...site.nearbyRestaurants],
          };
        })
      );
    },
    []
  );

  const handleAdminDeleteRestaurant = useCallback(
    (siteId: string, restaurantId: string) => {
      setCatalogSites((prev) =>
        prev.map((site) =>
          site.id === siteId
            ? {
                ...site,
                nearbyRestaurants: site.nearbyRestaurants.filter(
                  (r) => r.id !== restaurantId
                ),
              }
            : site
        )
      );
    },
    []
  );

  const handleSyncOfflineJourneys = useCallback(async () => {
    if (!authState.isAuthenticated || isSyncingCloud) return;
    setIsSyncingCloud(true);
    const res = await syncAllOfflineJourneys(visitedRecords);
    setIsSyncingCloud(false);

    if (res.ok) {
      let updatedList = visitedRecords;
      for (const j of res.data.journeys) {
        updatedList = await applyVerificationMetaToLocalRecord(
          updatedList,
          j.site_id,
          {
            cloudJourneyId: j.id,
            verificationStatus: j.verification_status,
            verificationScore: j.verification_score,
          }
        );
      }
      setVisitedRecords(updatedList);

      const profRes = await fetchCurrentProfile();
      if (profRes.ok) {
        setAuthState({
          isAuthenticated: true,
          isGuest: false,
          profile: profRes.data,
        });
      }

      const newBadges = res.data.newly_unlocked_badges || [];
      if (newBadges.length > 0) {
        setToastMessage(
          `Đã đồng bộ ${res.data.synced_count} hành trình & mở khóa: ${newBadges
            .map((b) => b.title_vi)
            .join(', ')}!`
        );
      } else {
        setToastMessage(
          `Đã đồng bộ ${res.data.synced_count} hành trình lên Cloud thành công.`
        );
      }
      triggerHaptic('success');
    } else {
      setToastMessage(res.error);
    }
  }, [authState.isAuthenticated, isSyncingCloud, visitedRecords]);

  const autoSyncAttemptedKeyRef = useRef<string>('');

  // Pre-warm bản đồ 3D ngầm sau khi tab Khám phá vừa hiển thị ổn định (~650ms) và giữ sống mãi để chuyển tab 0ms lag!
  useEffect(() => {
    if (isMapMounted) return;
    if (activeTab === 'map') {
      setIsMapMounted(true);
      return;
    }
    const timer = setTimeout(() => {
      setIsMapMounted(true);
    }, 650);
    return () => clearTimeout(timer);
  }, [activeTab, isMapMounted]);

  const handleToggleFocusHcmcOnly = useCallback((next: boolean) => {
    setFocusHcmcOnly(next);
    triggerHaptic('selection');
    setToastMessage(
      next
        ? 'Đang tập trung TP.HCM · Đã làm mờ các tỉnh xung quanh.'
        : 'Đang mở bản đồ toàn lãnh thổ Việt Nam.'
    );
  }, []);

  const handleMoveUserLocation = useCallback(
    (lat: number, lng: number) => {
      stopWalkSimulation();
      stopGpsWatch();
      setUserLocation([lat, lng]);
      setActiveCityId('CUSTOM');
      setGpsStatus(formatCoordinatesLabel(lat, lng));
    },
    [stopGpsWatch, stopWalkSimulation]
  );

  // Tự động đồng bộ ngầm các hành trình offline lên Cloud ngay khi người dùng đã đăng nhập
  useEffect(() => {
    if (!authState.isAuthenticated || isSyncingCloud) return;
    const unsyncedIds = visitedRecords
      .filter((r) => !r.cloudJourneyId)
      .map((r) => r.id)
      .sort()
      .join(',');
    if (!unsyncedIds) return;
    const key = `${authState.profile?.id || 'user'}|${unsyncedIds}`;
    if (autoSyncAttemptedKeyRef.current === key) return;
    autoSyncAttemptedKeyRef.current = key;
    void handleSyncOfflineJourneys();
  }, [
    authState.isAuthenticated,
    authState.profile?.id,
    isSyncingCloud,
    visitedRecords,
    handleSyncOfflineJourneys,
  ]);

  const handleOpenGlobalAiChat = useCallback(() => {
    setAiChatContextSite(null);
    setAiChatVisible(true);
    triggerHaptic('light');
  }, []);

  const handleAskAiAboutSite = useCallback((site: HeritageSite) => {
    setSelectedSite(null);
    setAiChatContextSite(site);
    setAiChatVisible(true);
    triggerHaptic('light');
  }, []);

  const handleOpenRecognizedSite = useCallback(
    (siteId: string) => {
      const matched = catalogSites.find((s) => s.id === siteId);
      if (!matched) return;
      setQuickAudioSite(matched);
      setSelectedSite(matched);
      triggerHaptic('success');
    },
    [catalogSites]
  );

  const handleCloseQuickAudio = useCallback(() => {
    try {
      speechService.stop();
    } catch {
      // Ignore audio stop errors
    }
    setQuickAudioSite(null);
  }, []);

  const activeFilterCount =
    (activeCityId !== 'ALL_HCM' ? 1 : 0) + (searchRadiusMeters > 0 ? 1 : 0);

  const selectedSiteMetrics = useMemo(() => {
    if (!selectedSite) return null;
    return allSitesWithMetrics.find((i) => i.site.id === selectedSite.id);
  }, [allSitesWithMetrics, selectedSite]);

  const photoCaptureMetrics = useMemo(() => {
    if (!photoCaptureSite) return null;
    return allSitesWithMetrics.find((i) => i.site.id === photoCaptureSite.id);
  }, [allSitesWithMetrics, photoCaptureSite]);

  const renderSiteItem = useCallback(
    ({
      item,
      index,
    }: {
      item: {
        site: HeritageSite;
        distanceMeters: number;
        estimatedWalkingSeconds: number;
      };
      index: number;
    }) => (
      <SiteCard
        site={item.site}
        index={index}
        distanceMeters={item.distanceMeters}
        estimatedWalkingSeconds={item.estimatedWalkingSeconds}
        selectedLanguage={selectedLanguage}
        visitedRecord={visitedMap.get(item.site.id)}
        isActiveRouteTarget={activeRoute?.targetId === item.site.id}
        onOpenDetail={setSelectedSite}
        onStartNavigation={handleStartNavigationToSite}
        onNavigateToRestaurant={handleNavigateToRestaurant}
        onOpenPhotoCapture={setPhotoCaptureSite}
      />
    ),
    [
      activeRoute?.targetId,
      handleNavigateToRestaurant,
      handleStartNavigationToSite,
      selectedLanguage,
      visitedMap,
    ]
  );

  // Top quán ăn & đồ uống gần vị trí hiện tại để hiển thị nổi bật ngay trong tab Khám phá
  const nearbyFeaturedRestaurants = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{
      restaurant: NearbyRestaurant;
      parentSite: HeritageSite;
      parentName: string;
      distanceMeters: number;
      walkingSeconds: number;
    }> = [];

    for (const { site } of nearbySitesWithMetrics.slice(0, 28)) {
      const parentName =
        (site.translations?.[selectedLanguage] || site.translations?.vi)?.name ||
        site.city;
      const eateries = Array.isArray(site.nearbyRestaurants)
        ? site.nearbyRestaurants
        : [];
      for (const res of eateries) {
        const key = `${res.name.trim().toLowerCase()}|${res.lat.toFixed(4)}|${res.lng.toFixed(4)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const dist = calculateDistanceMeters(
          userLocation[0],
          userLocation[1],
          res.lat,
          res.lng
        );
        list.push({
          restaurant: res,
          parentSite: site,
          parentName,
          distanceMeters: dist,
          walkingSeconds: estimateWalkingSeconds(dist),
        });
      }
    }

    return list
      .sort((a, b) => {
        const scoreA = a.distanceMeters - (a.restaurant.rating ?? 4.5) * 140;
        const scoreB = b.distanceMeters - (b.restaurant.rating ?? 4.5) * 140;
        return scoreA - scoreB;
      })
      .slice(0, 12);
  }, [nearbySitesWithMetrics, selectedLanguage, userLocation]);

  const mapSites = useMemo(
    () => nearbySitesWithMetrics.map((i) => i.site),
    [nearbySitesWithMetrics]
  );

  const isWithinProximity =
    !!closestSiteItem &&
    closestSiteItem.distanceMeters < PROXIMITY_TRIGGER_METERS;
  const isNearbyBannerVisible =
    !quickAudioSite &&
    !!closestSiteItem &&
    closestSiteItem.distanceMeters <= 300;

  const activeCityLabel =
    activeCityId === 'GPS'
      ? 'GPS thực tế'
      : CITY_PRESETS.find((c) => c.id === activeCityId)?.label || gpsStatus;

  // Scrollable list header: Ultra-clean Compact Weather Bar + Quick AI Pills + Segmented Switcher
  const exploreListHeader = (
    <View style={styles.listHeaderWrap}>
      {/* Compact Expandable Live Auto-Updating Weather Bar */}
      <WeatherWidgetCard
        weather={weather}
        locationLabel={activeCityLabel}
        isLoading={isWeatherLoading}
        onPlanTourWithWeather={() => {
          setSmartTourVisible(true);
          triggerHaptic('light');
        }}
      />

      {/* Smart Mode Switcher: Địa điểm vs Ẩm thực + Slim AI Action Chips */}
      <View style={styles.exploreControlsRow}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setExploreSection('sites');
              triggerHaptic('selection');
            }}
            style={[
              styles.segBtn,
              exploreSection === 'sites' && styles.segBtnActive,
            ]}
          >
            <Compass
              size={13}
              color={exploreSection === 'sites' ? COLORS.white : COLORS.inkSecondary}
            />
            <Text
              style={[
                styles.segBtnText,
                exploreSection === 'sites' && styles.segBtnTextActive,
              ]}
            >
              Địa điểm ({nearbySitesWithMetrics.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setExploreSection('dining');
              triggerHaptic('selection');
            }}
            style={[
              styles.segBtn,
              exploreSection === 'dining' && styles.segBtnActive,
            ]}
          >
            <Utensils
              size={13}
              color={exploreSection === 'dining' ? COLORS.white : COLORS.inkSecondary}
            />
            <Text
              style={[
                styles.segBtnText,
                exploreSection === 'dining' && styles.segBtnTextActive,
              ]}
            >
              Ẩm thực ({nearbyFeaturedRestaurants.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Slim 1-Row Quick AI & Reset Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickActionPillsRow}
      >
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => {
            setSmartTourVisible(true);
            triggerHaptic('light');
          }}
          style={styles.quickAiPillDark}
        >
          <Route size={13} color={COLORS.white} />
          <Text style={styles.quickAiPillDarkText}>Lập Tour AI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.82}
          onPress={handleOpenGlobalAiChat}
          style={styles.quickAiPillLight}
        >
          <MessageSquareText size={13} color={COLORS.accent} />
          <Text style={styles.quickAiPillLightText}>Hỏi AI Di sản</Text>
        </TouchableOpacity>

        {activeFilterCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setActiveCityId('ALL_HCM');
              setSearchRadiusMeters(0);
              setSelectedCategory('all');
              setSearchQuery('');
              setGpsStatus('Trung tâm Quận 1');
            }}
            style={styles.quickResetPill}
          >
            <X size={12} color={COLORS.accent} />
            <Text style={styles.quickResetPillText}>Đặt lại lọc</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Compact Proximity Banner (only shown when actually near a monument < 300m) */}
      {isNearbyBannerVisible && closestSiteItem && (
        <View
          style={[
            styles.proximityCard,
            isWithinProximity && styles.proximityCardHot,
          ]}
        >
          <View style={styles.proximityTextCol}>
            <Text style={styles.proximityEyebrow}>
              {isWithinProximity
                ? `Trong phạm vi < 150m · ${formatDistance(
                    closestSiteItem.distanceMeters
                  )}`
                : `Ngay gần bạn · ${formatDistance(
                    closestSiteItem.distanceMeters
                  )}`}
            </Text>
            <Text style={styles.proximityTitle} numberOfLines={1}>
              {(
                closestSiteItem.site.translations[selectedLanguage] ||
                closestSiteItem.site.translations.vi
              ).name}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setQuickAudioSite(closestSiteItem.site)}
            style={styles.proximityPlayBtn}
          >
            <Volume2 size={14} color={COLORS.white} />
            <Text style={styles.proximityPlayText}>Nghe</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Ultra-Clean 1-Line Mobile Header */}
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top, 8) + 4 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setFilterSheetVisible(true)}
            style={styles.brandCol}
          >
            <Text style={styles.brandTitle} numberOfLines={1}>
              Smart Heritage
            </Text>
            <View style={styles.locationSubtitleRow}>
              <View
                style={[
                  styles.gpsDot,
                  isLocatingGps && styles.gpsDotLocating,
                ]}
              />
              <Text style={styles.locationSubtitle} numberOfLines={1}>
                {gpsStatus}
              </Text>
              <ChevronDown size={12} color={COLORS.inkMuted} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {/* Compact Language Pill (opens clean 5-language sheet instead of cramming 5 buttons) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setLangSheetVisible(true);
                triggerHaptic('selection');
              }}
              style={styles.langPillBtn}
              accessibilityLabel="Chọn ngôn ngữ thuyết minh"
            >
              <Globe size={13} color={COLORS.inkSecondary} />
              <Text style={styles.langPillText}>
                {selectedLanguage.toUpperCase()}
              </Text>
            </TouchableOpacity>

            {/* Clean Circular Account Avatar Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAuthModalVisible(true)}
              style={[
                styles.avatarBtn,
                authState.isAuthenticated && styles.avatarBtnSignedIn,
              ]}
              accessibilityLabel="Tài khoản và đồng bộ Cloud"
            >
              <User
                size={15}
                color={
                  authState.isAuthenticated
                    ? COLORS.visited
                    : COLORS.inkSecondary
                }
              />
              {authState.isAuthenticated && <View style={styles.onlineDot} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainBody}>
        {activeTab === 'explore' && (
          <View style={styles.tabContainer}>
            {/* Minimalist Sticky Search + Single Category Bar */}
            <View style={styles.stickySearchArea}>
              <View style={styles.searchFilterRow}>
                <View style={styles.searchPill}>
                  <Search size={15} color={COLORS.inkMuted} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Tìm di tích, quận, món đặc sản…"
                    placeholderTextColor={COLORS.inkMuted}
                    style={styles.searchInput}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Xóa tìm kiếm"
                    >
                      <X size={15} color={COLORS.inkMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setFilterSheetVisible(true);
                    triggerHaptic('selection');
                  }}
                  style={[
                    styles.filterIconBtn,
                    activeFilterCount > 0 && styles.filterIconBtnActive,
                  ]}
                  accessibilityLabel="Mở bộ lọc khu vực và bán kính"
                >
                  <SlidersHorizontal
                    size={16}
                    color={activeFilterCount > 0 ? COLORS.white : COLORS.ink}
                  />
                  {activeFilterCount > 0 && (
                    <View style={styles.filterCountBadge}>
                      <Text style={styles.filterCountText}>
                        {activeFilterCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Single Clean Category Bar (only shown on Địa điểm view) */}
              {exploreSection === 'sites' && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryBar}
                >
                  {CATEGORY_FILTERS.map((cat) => {
                    const active = selectedCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        activeOpacity={0.75}
                        onPress={() => {
                          setSelectedCategory(cat.id);
                          triggerHaptic('selection');
                        }}
                        style={[
                          styles.catTab,
                          active && styles.catTabActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.catTabText,
                            active && styles.catTabTextActive,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Quick Audio Player (when active) */}
            {quickAudioSite && (
              <View style={styles.quickAudioCard}>
                <View style={styles.quickAudioHeader}>
                  <View style={styles.quickAudioTitleWrap}>
                    <Sparkles size={13} color={COLORS.accent} />
                    <Text style={styles.quickAudioEyebrow}>
                      ĐANG PHÁT THUYẾT MINH
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCloseQuickAudio}
                    style={styles.quickAudioCloseBtn}
                  >
                    <Text style={styles.quickAudioCloseText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
                <AudioGuidePlayer
                  site={quickAudioSite}
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={setSelectedLanguage}
                  autoPlayOnOpen={true}
                  compact={true}
                />
              </View>
            )}

            {/* Main Explore Feed: Cleanly switches between Heritage Sites and Nearby Dining */}
            {exploreSection === 'sites' ? (
              <FlatList
                data={nearbySitesWithMetrics}
                keyExtractor={(item) => item.site.id}
                renderItem={renderSiteItem}
                ListHeaderComponent={exploreListHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>
                      Không tìm thấy địa điểm phù hợp
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      Hãy đặt lại bộ lọc để xem toàn bộ {catalogSites.length} di
                      tích lịch sử TP.HCM.
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        setSearchRadiusMeters(0);
                        setSelectedCategory('all');
                        setSearchQuery('');
                        setActiveCityId('ALL_HCM');
                        setGpsStatus('Trung tâm Quận 1');
                      }}
                      style={styles.emptyResetBtn}
                    >
                      <Text style={styles.emptyResetBtnText}>
                        Xem tất cả {catalogSites.length} di tích
                      </Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            ) : (
              <FlatList
                data={nearbyFeaturedRestaurants}
                keyExtractor={(item) => item.restaurant.id}
                ListHeaderComponent={exploreListHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: entry }) => (
                  <View style={styles.diningFeedCard}>
                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => setSelectedSite(entry.parentSite)}
                      style={styles.diningFeedTop}
                    >
                      <Image
                        source={{
                          uri:
                            entry.restaurant.imageUrl ||
                            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
                        }}
                        style={styles.diningFeedThumb}
                        resizeMode="cover"
                      />
                      <View style={styles.diningFeedInfo}>
                        <View style={styles.diningFeedTitleRow}>
                          <Text style={styles.diningFeedName} numberOfLines={1}>
                            {entry.restaurant.name}
                          </Text>
                          <View style={styles.diningFeedRatingPill}>
                            <Star
                              size={11}
                              color={COLORS.amberStar}
                              fill={COLORS.amberStar}
                            />
                            <Text style={styles.diningFeedRatingText}>
                              {(entry.restaurant.rating ?? 4.5).toFixed(1)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.diningFeedCuisine} numberOfLines={1}>
                          {entry.restaurant.cuisine}
                          {entry.restaurant.priceRange
                            ? ` · ${entry.restaurant.priceRange}`
                            : ''}
                        </Text>
                        <Text style={styles.diningFeedDish} numberOfLines={1}>
                          {entry.restaurant.specialtyDishes?.length
                            ? entry.restaurant.specialtyDishes.slice(0, 2).join(' · ')
                            : `Gần ${entry.parentName}`}
                        </Text>
                        <Text style={styles.diningFeedNearSite} numberOfLines={1}>
                          Gần {entry.parentName}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.diningFeedFooter}>
                      <View style={styles.diningFeedDistWrap}>
                        <Footprints size={12} color={COLORS.accent} />
                        <Text style={styles.diningFeedDistText}>
                          {formatDistance(entry.distanceMeters)} ·{' '}
                          {formatWalkingDuration(entry.walkingSeconds)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                          handleNavigateToRestaurant(
                            entry.restaurant,
                            entry.parentSite
                          )
                        }
                        style={styles.diningFeedGoBtn}
                      >
                        <Navigation size={12} color={COLORS.white} />
                        <Text style={styles.diningFeedGoText}>Chỉ đường</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>
                      Chưa có quán ăn trong khu vực lọc
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      Hãy mở rộng bán kính hoặc xóa từ khóa tìm kiếm.
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        )}

        {/* Keep-Alive 3D Map Layer: giữ WebGL sống liên tục, chuyển tab Bản đồ tức thì (<16ms, không tải lại!) */}
        {isMapMounted && (
          <View
            pointerEvents={activeTab === 'map' ? 'auto' : 'none'}
            style={[
              styles.mapTabKeepAlive,
              activeTab !== 'map' && styles.mapTabKeepAliveHidden,
            ]}
          >
            {activeTab === 'map' && quickAudioSite && (
              <View style={styles.mapQuickAudioOverlay}>
                <View style={styles.quickAudioHeader}>
                  <View style={styles.quickAudioTitleWrap}>
                    <Volume2 size={13} color={COLORS.accent} />
                    <Text style={styles.quickAudioEyebrow}>
                      THUYẾT MINH KHI ĐẾN NƠI
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleCloseQuickAudio}>
                    <Text style={styles.quickAudioCloseText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
                <AudioGuidePlayer
                  site={quickAudioSite}
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={setSelectedLanguage}
                  autoPlayOnOpen={true}
                  compact={true}
                />
              </View>
            )}

            <MapExplorer
              isVisible={activeTab === 'map'}
              userLocation={userLocation}
              userHeading={userHeading}
              sites={mapSites}
              selectedSiteId={selectedSite?.id || activeRoute?.targetId}
              visitedRecords={visitedRecords}
              selectedLanguage={selectedLanguage}
              activeRoute={activeRoute}
              isRoutingLoading={isRoutingLoading}
              activeWalkSeconds={activeWalkSeconds}
              isSimulatingWalk={isSimulatingWalk}
              searchRadiusMeters={searchRadiusMeters}
              focusHcmcOnly={focusHcmcOnly}
              onToggleFocusHcmcOnly={handleToggleFocusHcmcOnly}
              onSelectSite={setSelectedSite}
              onStartRouteToSite={handleStartNavigationToSite}
              onStartRouteToRestaurant={handleNavigateToRestaurant}
              onSimulateWalkAlongRoute={handleSimulateWalkAlongRoute}
              onFinishWalkAndCheckIn={handleFinishWalkAndCheckIn}
              onCancelRoute={handleCancelRoute}
              onDetectRealGps={handleDetectRealGps}
              onMoveUserLocation={handleMoveUserLocation}
            />
          </View>
        )}

        {activeTab === 'journey' && (
          <View style={styles.tabContainer}>
            <JourneyAndRankingView
              viewMode="journey"
              records={visitedRecords}
              allSites={catalogSites}
              userLocation={userLocation}
              selectedLanguage={selectedLanguage}
              authState={authState}
              isSyncing={isSyncingCloud}
              onSelectSiteById={(siteId) => {
                const target = catalogSites.find((s) => s.id === siteId);
                if (target) setSelectedSite(target);
              }}
              onOpenCaptureForSite={(siteId) => {
                const target = catalogSites.find((s) => s.id === siteId);
                if (target) setPhotoCaptureSite(target);
              }}
              onOpenAuthModal={() => setAuthModalVisible(true)}
            />
          </View>
        )}

        {activeTab === 'ranking' && (
          <View style={styles.tabContainer}>
            <JourneyAndRankingView
              viewMode="ranking"
              records={visitedRecords}
              allSites={catalogSites}
              userLocation={userLocation}
              selectedLanguage={selectedLanguage}
              authState={authState}
              isSyncing={isSyncingCloud}
              onSelectSiteById={(siteId) => {
                const target = catalogSites.find((s) => s.id === siteId);
                if (target) setSelectedSite(target);
              }}
              onOpenCaptureForSite={(siteId) => {
                const target = catalogSites.find((s) => s.id === siteId);
                if (target) setPhotoCaptureSite(target);
              }}
              onOpenAuthModal={() => setAuthModalVisible(true)}
            />
          </View>
        )}

        {activeTab === 'admin' && isAdminUser && (
          <View style={styles.tabContainer}>
            <AdminDashboardView
              sites={catalogSites}
              userLocation={userLocation}
              authState={authState}
              onUpsertSite={handleAdminUpsertSite}
              onDeleteSite={handleAdminDeleteSite}
              onUpsertRestaurant={handleAdminUpsertRestaurant}
              onDeleteRestaurant={handleAdminDeleteRestaurant}
              onOpenAuthModal={() => setAuthModalVisible(true)}
              onNotify={(msg) => setToastMessage(msg)}
            />
          </View>
        )}
      </View>

      {/* Toast Notification */}
      {toastMessage && (
        <View
          pointerEvents="none"
          style={[
            styles.toastWrap,
            { bottom: Math.max(insets.bottom, 8) + 66 },
          ]}
        >
          <View style={styles.toastPill}>
            <Check size={14} color={COLORS.visitedDot} strokeWidth={2.8} />
            <Text style={styles.toastText} numberOfLines={2}>
              {toastMessage}
            </Text>
          </View>
        </View>
      )}

      {/* Clean Bottom Tab Bar (3 Primary Tabs) */}
      <View
        style={[
          styles.tabBar,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setActiveTab('explore');
            triggerHaptic('selection');
          }}
          style={styles.tabItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'explore' }}
        >
          <Compass
            size={21}
            strokeWidth={activeTab === 'explore' ? 2.2 : 1.7}
            color={activeTab === 'explore' ? COLORS.ink : COLORS.inkMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'explore' && styles.tabLabelActive,
            ]}
          >
            Khám phá
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setActiveTab('map');
            triggerHaptic('selection');
          }}
          style={styles.tabItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'map' }}
        >
          <View style={styles.tabIconBox}>
            {activeRoute ? (
              <Navigation
                size={21}
                strokeWidth={2.2}
                color={COLORS.accent}
              />
            ) : (
              <MapIcon
                size={21}
                strokeWidth={activeTab === 'map' ? 2.2 : 1.7}
                color={activeTab === 'map' ? COLORS.ink : COLORS.inkMuted}
              />
            )}
            {activeRoute && <View style={styles.routeActiveDot} />}
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'map' && styles.tabLabelActive,
            ]}
          >
            Bản đồ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setActiveTab('journey');
            triggerHaptic('selection');
          }}
          style={styles.tabItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'journey' }}
        >
          <View style={styles.tabIconBox}>
            <BookOpen
              size={21}
              strokeWidth={activeTab === 'journey' ? 2.2 : 1.7}
              color={activeTab === 'journey' ? COLORS.ink : COLORS.inkMuted}
            />
            {visitedRecords.length > 0 && (
              <View style={styles.journeyBadge}>
                <Text style={styles.journeyBadgeText}>
                  {visitedRecords.length}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'journey' && styles.tabLabelActive,
            ]}
          >
            Hành trình
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setActiveTab('ranking');
            triggerHaptic('selection');
          }}
          style={styles.tabItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'ranking' }}
        >
          <Trophy
            size={21}
            strokeWidth={activeTab === 'ranking' ? 2.2 : 1.7}
            color={activeTab === 'ranking' ? COLORS.ink : COLORS.inkMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'ranking' && styles.tabLabelActive,
            ]}
          >
            Xếp hạng
          </Text>
        </TouchableOpacity>

        {isAdminUser && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setActiveTab('admin');
              triggerHaptic('selection');
            }}
            style={styles.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'admin' }}
          >
            <ShieldCheck
              size={21}
              strokeWidth={activeTab === 'admin' ? 2.2 : 1.7}
              color={activeTab === 'admin' ? COLORS.accent : COLORS.inkMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'admin' && styles.tabLabelActive,
              ]}
            >
              Quản trị
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter & Location Bottom Sheet */}
      <Modal
        visible={filterSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterSheetVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setFilterSheetVisible(false)}
          style={styles.sheetBackdrop}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={[
              styles.sheetCard,
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Khu vực & Bộ lọc</Text>
              <TouchableOpacity
                onPress={() => setFilterSheetVisible(false)}
                style={styles.sheetCloseBtn}
              >
                <X size={18} color={COLORS.inkSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.sheetScroll}
            >
              {/* Real GPS Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  void handleDetectRealGps();
                  setFilterSheetVisible(false);
                }}
                style={styles.sheetGpsBtn}
              >
                <LocateFixed size={16} color={COLORS.gpsBlue} />
                <Text style={styles.sheetGpsBtnText}>
                  Dùng vị trí GPS thực tế của tôi
                </Text>
              </TouchableOpacity>

              {/* District Presets */}
              <Text style={styles.sheetSectionLabel}>Khu vực tại TP.HCM</Text>
              <View style={styles.sheetWrapGrid}>
                {CITY_PRESETS.map((city) => {
                  const active = activeCityId === city.id;
                  return (
                    <TouchableOpacity
                      key={city.id}
                      activeOpacity={0.8}
                      onPress={() => handleSelectCityPreset(city.id)}
                      style={[
                        styles.sheetChip,
                        active && styles.sheetChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sheetChipText,
                          active && styles.sheetChipTextActive,
                        ]}
                      >
                        {city.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Radius Options */}
              <Text style={styles.sheetSectionLabel}>Bán kính tìm kiếm</Text>
              <View style={styles.sheetWrapGrid}>
                {RADIUS_OPTIONS.map((opt) => {
                  const active = searchRadiusMeters === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSearchRadiusMeters(opt.value);
                        triggerHaptic('selection');
                      }}
                      style={[
                        styles.sheetChip,
                        active && styles.sheetChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sheetChipText,
                          active && styles.sheetChipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Focus HCMC Map Mask Switch */}
              <View style={styles.sheetSwitchRow}>
                <View style={styles.sheetSwitchTextCol}>
                  <Text style={styles.sheetSwitchTitle}>
                    Chỉ tập trung bản đồ TP.HCM
                  </Text>
                  <Text style={styles.sheetSwitchSub}>
                    Làm mờ các tỉnh xung quanh (giới hạn toàn bản đồ trong lãnh thổ Việt Nam)
                  </Text>
                </View>
                <Switch
                  value={focusHcmcOnly}
                  onValueChange={(val) => {
                    setFocusHcmcOnly(val);
                    triggerHaptic('selection');
                  }}
                  trackColor={{
                    false: COLORS.borderStrong,
                    true: COLORS.accent,
                  }}
                  thumbColor={COLORS.white}
                />
              </View>

              {/* Auto Proximity Audio Switch */}
              <View style={styles.sheetSwitchRow}>
                <View style={styles.sheetSwitchTextCol}>
                  <Text style={styles.sheetSwitchTitle}>
                    Tự động thuyết minh khi đến gần
                  </Text>
                  <Text style={styles.sheetSwitchSub}>
                    Tự mở giọng đọc khi vào vùng bán kính &lt; 150m
                  </Text>
                </View>
                <Switch
                  value={autoAudioGuide}
                  onValueChange={setAutoAudioGuide}
                  trackColor={{
                    false: COLORS.borderStrong,
                    true: COLORS.ink,
                  }}
                  thumbColor={COLORS.white}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setFilterSheetVisible(false)}
              style={styles.sheetApplyBtn}
            >
              <Text style={styles.sheetApplyText}>
                Xem {nearbySitesWithMetrics.length} di tích phù hợp
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Language Picker Bottom Sheet */}
      <Modal
        visible={langSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangSheetVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setLangSheetVisible(false)}
          style={styles.sheetBackdrop}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={[
              styles.sheetCard,
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Ngôn ngữ thuyết minh</Text>
              <TouchableOpacity
                onPress={() => setLangSheetVisible(false)}
                style={styles.sheetCloseBtn}
              >
                <X size={18} color={COLORS.inkSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.langList}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const active = selectedLanguage === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedLanguage(lang.code);
                      setLangSheetVisible(false);
                      triggerHaptic('selection');
                    }}
                    style={[
                      styles.langOptionRow,
                      active && styles.langOptionRowActive,
                    ]}
                  >
                    <View style={styles.langOptionLeft}>
                      <Text style={styles.langCodeTag}>
                        {lang.code.toUpperCase()}
                      </Text>
                      <Text style={styles.langNativeLabel}>
                        {lang.nativeLabel}
                      </Text>
                    </View>
                    {active && <Check size={16} color={COLORS.accent} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Heritage Detail Modal */}
      {selectedSite && (
        <HeritageDetailModal
          visible={true}
          site={selectedSite}
          userLocation={userLocation}
          distanceMeters={selectedSiteMetrics?.distanceMeters || 500}
          estimatedWalkingSeconds={
            selectedSiteMetrics?.estimatedWalkingSeconds || 400
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
          onAskAiAboutSite={handleAskAiAboutSite}
        />
      )}

      {/* Photo Capture & Check-in Modal */}
      {photoCaptureSite && (
        <PhotoCaptureModal
          visible={true}
          site={photoCaptureSite}
          userLocation={userLocation}
          selectedLanguage={selectedLanguage}
          walkingDurationSeconds={
            activeWalkSeconds > 30
              ? activeWalkSeconds
              : photoCaptureMetrics?.estimatedWalkingSeconds || 600
          }
          walkingDistanceMeters={
            activeRoute?.totalDistanceMeters ||
            photoCaptureMetrics?.distanceMeters ||
            750
          }
          onClose={() => setPhotoCaptureSite(null)}
          onOpenRecognizedSite={handleOpenRecognizedSite}
          onSaveCheckIn={handleSavePhotoCheckIn}
        />
      )}

      {/* Smart AI 2-Opt Walking Tour Modal */}
      <SmartTourModal
        visible={smartTourVisible}
        userLocation={userLocation}
        selectedLanguage={selectedLanguage}
        visitedSiteIds={visitedRecords.map((r) => r.siteId)}
        allSites={catalogSites}
        weather={weather}
        onClose={() => setSmartTourVisible(false)}
        onStartNavigateStop={handleStartNavigationToSite}
        onSelectSite={(site) => setSelectedSite(site)}
      />

      {/* Multilingual RAG AI Chat Modal */}
      <AiChatModal
        visible={aiChatVisible}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        contextSite={aiChatContextSite}
        userLocation={userLocation}
        onClose={() => setAiChatVisible(false)}
        onOpenSiteById={(siteId) => {
          const target = catalogSites.find((s) => s.id === siteId);
          if (target) setSelectedSite(target);
        }}
      />

      {/* Optional Account & Cloud Sync Modal */}
      <AuthModal
        visible={authModalVisible}
        authState={authState}
        selectedLanguage={selectedLanguage}
        localJourneysCount={visitedRecords.length}
        isSyncing={isSyncingCloud}
        onClose={() => setAuthModalVisible(false)}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        onSyncOfflineJourneys={handleSyncOfflineJourneys}
        onOpenAdminDashboard={() => {
          setAuthModalVisible(false);
          setActiveTab('admin');
        }}
      />
    </View>
  );
}

export function App() {
  return (
    <SafeAreaProvider>
      <SmartHeritageAppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  brandCol: {
    flex: 1,
    minWidth: 0,
  },
  brandTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  locationSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.visitedDot,
  },
  gpsDotLocating: {
    backgroundColor: COLORS.amberStar,
  },
  locationSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.inkSecondary,
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weatherHeaderTemp: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  langPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 11,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarBtnSignedIn: {
    backgroundColor: COLORS.visitedBg,
    borderColor: COLORS.visitedBorder,
  },
  onlineDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.visitedDot,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  mainBody: {
    flex: 1,
    position: 'relative',
  },
  tabContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    zIndex: 2,
  },
  mapTabContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: COLORS.bg,
  },
  mapTabKeepAlive: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    backgroundColor: COLORS.bg,
    opacity: 1,
  },
  mapTabKeepAliveHidden: {
    opacity: 0,
    zIndex: -5,
  },
  stickySearchArea: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 2,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 10,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    paddingHorizontal: 14,
    height: 42,
    ...SHADOWS.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.ink,
    paddingVertical: 0,
  },
  filterIconBtn: {
    width: 42,
    height: 42,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...SHADOWS.card,
  },
  filterIconBtnActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  filterCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },
  filterCountText: {
    fontFamily: SERIF_FONT,
    color: COLORS.white,
    fontSize: 9.5,
    fontWeight: '700',
  },
  categoryBar: {
    paddingHorizontal: SPACING.lg,
    gap: 18,
  },
  catTab: {
    paddingVertical: 9,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  catTabActive: {
    borderBottomColor: COLORS.ink,
  },
  catTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  catTabTextActive: {
    color: COLORS.ink,
    fontWeight: '700',
  },
  listHeaderWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10,
  },
  exploreControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentedControl: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.pill,
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADII.pill,
  },
  segBtnActive: {
    backgroundColor: COLORS.ink,
  },
  segBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  segBtnTextActive: {
    color: COLORS.white,
  },
  quickActionPillsRow: {
    gap: 8,
    paddingRight: SPACING.md,
  },
  quickAiPillDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADII.pill,
  },
  quickAiPillDarkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  quickAiPillLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADII.pill,
  },
  quickAiPillLightText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  quickResetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADII.pill,
  },
  quickResetPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.accent,
  },
  diningFeedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    marginBottom: 12,
    padding: 12,
    gap: 10,
    ...SHADOWS.card,
  },
  diningFeedTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  diningFeedThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
  },
  diningFeedInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  diningFeedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  diningFeedName: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  diningFeedRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.amberBg,
    borderRadius: RADII.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  diningFeedRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  diningFeedCuisine: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  diningFeedDish: {
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  diningFeedNearSite: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  diningFeedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
  },
  diningFeedDistWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  diningFeedDistText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  diningFeedGoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.ink,
    borderRadius: RADII.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  diningFeedGoText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  aiStripRow: {
    flexDirection: 'row',
    gap: 10,
  },
  aiCardPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 11,
    ...SHADOWS.card,
  },
  aiCardSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 11,
    ...SHADOWS.card,
  },
  aiIconCircleDark: {
    width: 32,
    height: 32,
    borderRadius: RADII.md,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIconCircleAccent: {
    width: 32,
    height: 32,
    borderRadius: RADII.md,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTextCol: {
    flex: 1,
    minWidth: 0,
  },
  aiCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  aiCardSub: {
    fontSize: 11,
    color: COLORS.inkMuted,
    marginTop: 1,
  },
  proximityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  proximityCardHot: {
    backgroundColor: COLORS.amberBg,
    borderColor: COLORS.amberBorder,
  },
  proximityTextCol: {
    flex: 1,
    minWidth: 0,
  },
  proximityEyebrow: {
    fontFamily: SERIF_FONT,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  proximityTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 2,
  },
  proximityPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.pill,
  },
  proximityPlayText: {
    fontFamily: SERIF_FONT,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sectionMetaText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  foodShowcaseWrap: {
    gap: 10,
  },
  foodShowcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  foodShowcaseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  foodShowcaseIcon: {
    width: 30,
    height: 30,
    borderRadius: RADII.md,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodShowcaseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  foodShowcaseSub: {
    fontSize: 11.5,
    color: COLORS.inkMuted,
    marginTop: 1,
  },
  foodShowcaseMapLink: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  foodShowcaseMapLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.accent,
  },
  foodCarouselContent: {
    gap: 10,
    paddingRight: SPACING.md,
  },
  foodCarouselCard: {
    width: 248,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    gap: 9,
    ...SHADOWS.card,
  },
  foodCarouselTop: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  foodCarouselThumb: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
  },
  foodCarouselInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  foodCarouselNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodCarouselName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  foodCarouselRatingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  foodCarouselRating: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  foodCarouselDot: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  foodCarouselPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
    flexShrink: 1,
  },
  foodCarouselDish: {
    fontSize: 11,
    color: COLORS.inkSecondary,
  },
  foodCarouselFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
  },
  foodCarouselDistWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  foodCarouselDistText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  foodCarouselGoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.ink,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  foodCarouselGoText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  quickAudioCard: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  mapQuickAudioOverlay: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 30,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.floating,
  },
  quickAudioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  quickAudioTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  quickAudioEyebrow: {
    fontFamily: SERIF_FONT,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.accent,
  },
  quickAudioCloseBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quickAudioCloseText: {
    fontFamily: SERIF_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  listContent: {
    paddingBottom: SPACING.xxl + 8,
  },
  emptyBox: {
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: SERIF_FONT,
    fontSize: 13,
    color: COLORS.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyResetBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADII.pill,
  },
  emptyResetBtnText: {
    fontFamily: SERIF_FONT,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  toastWrap: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    alignItems: 'center',
    zIndex: 50,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.ink,
    borderRadius: RADII.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: 420,
    ...SHADOWS.floating,
  },
  toastText: {
    fontFamily: SERIF_FONT,
    color: COLORS.white,
    fontSize: 12.5,
    fontWeight: '500',
    flexShrink: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabIconBox: {
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  tabLabelActive: {
    color: COLORS.ink,
    fontWeight: '700',
  },
  routeActiveDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  journeyBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  journeyBadgeText: {
    fontFamily: SERIF_FONT,
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  // Bottom Sheet Styles
  sheetBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlayScrim,
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.xl,
    paddingTop: 10,
    maxHeight: '82%',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.borderStrong,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    maxHeight: 420,
  },
  sheetGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.gpsBlueSoft,
    borderRadius: RADII.lg,
    paddingVertical: 12,
    marginBottom: 16,
  },
  sheetGpsBtnText: {
    fontFamily: SERIF_FONT,
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.gpsBlue,
  },
  sheetSectionLabel: {
    fontFamily: SERIF_FONT,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  sheetWrapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sheetChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetChipActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  sheetChipText: {
    fontFamily: SERIF_FONT,
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  sheetChipTextActive: {
    color: COLORS.white,
  },
  sheetSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 8,
  },
  sheetSwitchTextCol: {
    flex: 1,
  },
  sheetSwitchTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  sheetSwitchSub: {
    fontFamily: SERIF_FONT,
    fontSize: 12,
    color: COLORS.inkMuted,
    marginTop: 2,
  },
  sheetApplyBtn: {
    backgroundColor: COLORS.ink,
    borderRadius: RADII.lg,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  sheetApplyText: {
    fontFamily: SERIF_FONT,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  langList: {
    gap: 6,
  },
  langOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.bg,
  },
  langOptionRowActive: {
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  langOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langCodeTag: {
    fontFamily: SERIF_FONT,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.inkMuted,
    width: 26,
  },
  langNativeLabel: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink,
  },
});

export default App;
