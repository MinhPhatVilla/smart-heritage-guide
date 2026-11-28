import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  Bike,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Compass,
  Droplets,
  Footprints,
  Globe,
  Headphones,
  Landmark,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Menu,
  MessageSquareText,
  Navigation,
  Route,
  Search,
  ShieldCheck,
  Star,
  Sun,
  Trophy,
  Umbrella,
  User,
  Utensils,
  Volume2,
  Wind,
  X,
} from 'lucide-react-native';
import {
  CapturedPhoto,
  HeritageCategory,
  HeritageSite,
  NearbyRestaurant,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  TRAVEL_MODE_OPTIONS,
  TravelMode,
  VisitedSiteRecord,
  WalkingRouteResult,
} from './src/types/heritage';
import { CITY_PRESETS, HERITAGE_SITES } from './src/data/heritageSites';
import {
  calculateBearingDegrees,
  calculateDistanceMeters,
  estimateTravelSeconds,
  estimateWalkingSeconds,
  formatDistance,
  formatTravelDuration,
  formatWalkingDuration,
  getNearbySitesWithMetrics,
  interpolateRouteForSmoothWalk,
  normalizeVietnamese,
  suggestTravelModeForDistance,
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
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from './src/theme';

// Code-split toàn bộ Admin Studio: du khách không tải code Admin, Admin tải từng tab theo nhu cầu
const LazyAdminWorkspaceShell = React.lazy(
  () => import('./src/components/admin/AdminWorkspaceShell')
);

type MainTab = 'explore' | 'map' | 'journey' | 'ranking';

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
  const { width: viewportWidth } = useWindowDimensions();
  const isWideWeb = viewportWidth >= 720;
  const exploreColumns = viewportWidth >= 1080 ? 3 : viewportWidth >= 720 ? 2 : 1;

  const [userLocation, setUserLocation] = useState<[number, number]>([
    10.7775, 106.699,
  ]);
  const [userHeading, setUserHeading] = useState<number | null>(null);
  const [activeCityId, setActiveCityId] = useState<string>('ALL_HCM');
  const [focusHcmcOnly, setFocusHcmcOnly] = useState<boolean>(true);
  const [gpsStatus, setGpsStatus] = useState<string>('Quận 1');
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);

  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>('vi');
  const [searchRadiusMeters, setSearchRadiusMeters] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | HeritageCategory
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MainTab>('explore');
  const [exploreSection, setExploreSection] = useState<'sites' | 'dining'>('sites');
  const [isMapMounted, setIsMapMounted] = useState<boolean>(false);

  // Floating ☰ Menu Popover & Clean Sheets
  const [menuPopoverVisible, setMenuPopoverVisible] = useState<boolean>(false);
  const [menuLangExpanded, setMenuLangExpanded] = useState<boolean>(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState<boolean>(false);
  const [weatherSheetVisible, setWeatherSheetVisible] = useState<boolean>(false);

  const [selectedSite, setSelectedSite] = useState<HeritageSite | null>(null);
  const [quickAudioSite, setQuickAudioSite] = useState<HeritageSite | null>(
    null
  );
  const [photoCaptureSite, setPhotoCaptureSite] =
    useState<HeritageSite | null>(null);

  const [activeRoute, setActiveRoute] = useState<WalkingRouteResult | null>(
    null
  );
  const [travelMode, setTravelMode] = useState<TravelMode>('walking');
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
  const [adminPreviewAsUser, setAdminPreviewAsUser] = useState<boolean>(false);
  const [smartTourVisible, setSmartTourVisible] = useState<boolean>(false);
  const [aiChatVisible, setAiChatVisible] = useState<boolean>(false);
  const [aiChatContextSite, setAiChatContextSite] =
    useState<HeritageSite | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const lastWeatherCoordsRef = useRef<[number, number] | null>(null);

  const walkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsWatchRef = useRef<LocationWatchHandle | null>(null);
  const lastAutoTriggeredSiteIdRef = useRef<string | null>(null);
  const usedSimulatedWalkRef = useRef<boolean>(false);
  const autoGpsAttemptedRef = useRef<boolean>(false);
  const returnDetailAfterPhotoRef = useRef<HeritageSite | null>(null);
  const returnDetailAfterAiChatRef = useRef<HeritageSite | null>(null);

  // Tự động xin quyền GPS thực tế ngay khi mở app (từ chối sẽ giữ fallback an toàn tại Quận 1)
  useEffect(() => {
    if (autoGpsAttemptedRef.current) return;
    autoGpsAttemptedRef.current = true;
    let cancelled = false;

    void (async () => {
      setIsLocatingGps(true);
      const res = await getCurrentLocation({ timeoutMs: 7000 });
      if (cancelled) return;
      setIsLocatingGps(false);

      if (res.ok && res.tuple) {
        const [lat, lng] = res.tuple;
        setUserLocation([lat, lng]);
        setActiveCityId('GPS');
        setGpsStatus('Vị trí của bạn');

        const handle = await watchLocation({
          distanceIntervalMeters: 20,
          timeIntervalMs: 6000,
          onUpdate: (_coords, tuple) => {
            if (!cancelled) {
              setUserLocation(tuple);
            }
          },
        });
        if (cancelled) {
          handle?.remove();
        } else {
          gpsWatchRef.current = handle;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
      const snapshot = await fetchLiveWeather(lat, lng, { forceRefresh });
      setWeather(snapshot);
      lastWeatherCoordsRef.current = [lat, lng];
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
    const q = normalizeVietnamese(searchQuery);
    return rawNearbySites.filter(({ site }) => {
      if (selectedCategory !== 'all' && site.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const local = site.translations[selectedLanguage] || site.translations.vi;
      const matchesName =
        normalizeVietnamese(local.name).includes(q) ||
        normalizeVietnamese(site.translations.vi.name).includes(q) ||
        normalizeVietnamese(local.shortSummary).includes(q) ||
        normalizeVietnamese(site.city).includes(q) ||
        (site.district ? normalizeVietnamese(site.district).includes(q) : false) ||
        (site.address ? normalizeVietnamese(site.address).includes(q) : false);
      const matchesFood = site.nearbyRestaurants.some(
        (r) =>
          normalizeVietnamese(r.name).includes(q) ||
          r.specialtyDishes.some((d) => normalizeVietnamese(d).includes(q))
      );
      return matchesName || matchesFood;
    });
  }, [rawNearbySites, selectedCategory, searchQuery, selectedLanguage]);

  // Escape key on Web closes Smart Search dropdown cleanly
  useEffect(() => {
    if (!searchFocused || Platform.OS !== 'web') return;
    const win = globalThis as unknown as {
      addEventListener?: (ev: string, fn: (e: { key?: string }) => void) => void;
      removeEventListener?: (ev: string, fn: (e: { key?: string }) => void) => void;
    };
    if (!win.addEventListener || !win.removeEventListener) return;
    const onKeyDown = (e: { key?: string }) => {
      if (e.key === 'Escape') {
        setSearchFocused(false);
      }
    };
    win.addEventListener('keydown', onKeyDown);
    return () => win.removeEventListener?.('keydown', onKeyDown);
  }, [searchFocused]);

  // Gợi ý tìm kiếm thông minh: 5 địa điểm gần GPS nhất khi trống, hoặc Top 6 khớp theo tên (Di tích + Ẩm thực) khi nhập
  const smartSearchSuggestions = useMemo(() => {
    const q = normalizeVietnamese(searchQuery);

    if (!q) {
      return {
        mode: 'nearby' as const,
        sites: allSitesWithMetrics.slice(0, 5),
        restaurants: [] as Array<{
          restaurant: NearbyRestaurant;
          parentSite: HeritageSite;
          parentName: string;
          distanceMeters: number;
          walkingSeconds: number;
        }>,
      };
    }

    const scoredSites = allSitesWithMetrics
      .map((entry) => {
        const localName =
          (
            entry.site.translations[selectedLanguage] ||
            entry.site.translations.vi
          )?.name || entry.site.id;
        const normLocal = normalizeVietnamese(localName);
        const normVi = normalizeVietnamese(entry.site.translations.vi.name);
        const normArea = normalizeVietnamese(
          `${entry.site.district || ''} ${entry.site.city} ${entry.site.address || ''}`
        );

        let rank = 0;
        if (normLocal.startsWith(q) || normVi.startsWith(q)) {
          rank = 3;
        } else if (normLocal.includes(q) || normVi.includes(q)) {
          rank = 2;
        } else if (normArea.includes(q)) {
          rank = 1;
        }
        return { entry, rank };
      })
      .filter((x) => x.rank > 0)
      .sort((a, b) => {
        if (b.rank !== a.rank) return b.rank - a.rank;
        return a.entry.distanceMeters - b.entry.distanceMeters;
      })
      .map((x) => x.entry);

    const seenFood = new Set<string>();
    const matchedFoods: Array<{
      restaurant: NearbyRestaurant;
      parentSite: HeritageSite;
      parentName: string;
      distanceMeters: number;
      walkingSeconds: number;
      rank: number;
    }> = [];

    for (const { site } of allSitesWithMetrics) {
      const parentName =
        (site.translations[selectedLanguage] || site.translations.vi)?.name ||
        site.city;
      const list = Array.isArray(site.nearbyRestaurants)
        ? site.nearbyRestaurants
        : [];
      for (const r of list) {
        const normR = normalizeVietnamese(r.name);
        const normDishes = normalizeVietnamese(
          (r.specialtyDishes || []).join(' ')
        );
        const normCuisine = normalizeVietnamese(r.cuisine || '');
        let rank = 0;
        if (normR.startsWith(q)) rank = 3;
        else if (normR.includes(q)) rank = 2;
        else if (normDishes.includes(q) || normCuisine.includes(q)) rank = 1;

        if (rank === 0) continue;
        const key = `${normR}|${r.lat.toFixed(4)}|${r.lng.toFixed(4)}`;
        if (seenFood.has(key)) continue;
        seenFood.add(key);

        const dist = calculateDistanceMeters(
          userLocation[0],
          userLocation[1],
          r.lat,
          r.lng
        );
        matchedFoods.push({
          restaurant: r,
          parentSite: site,
          parentName,
          distanceMeters: dist,
          walkingSeconds: estimateWalkingSeconds(dist),
          rank,
        });
      }
    }

    matchedFoods.sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      return a.distanceMeters - b.distanceMeters;
    });

    const maxSites = matchedFoods.length > 0 ? 4 : 6;
    const chosenSites = scoredSites.slice(0, maxSites);
    const remainingSlots = Math.max(0, 6 - chosenSites.length);
    const chosenFoods = matchedFoods
      .slice(0, remainingSlots)
      .map(({ rank: _r, ...rest }) => rest);

    return {
      mode: 'query' as const,
      sites: chosenSites,
      restaurants: chosenFoods,
    };
  }, [allSitesWithMetrics, searchQuery, selectedLanguage, userLocation]);

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
      setGpsStatus('Vị trí của bạn');
      setToastMessage('Đã cập nhật vị trí GPS thực tế.');
      triggerHaptic('light');

      const handle = await watchLocation({
        distanceIntervalMeters: 15,
        timeIntervalMs: 5000,
        onUpdate: (_coords, tuple) => {
          setUserLocation(tuple);
        },
      });
      gpsWatchRef.current = handle;
    } else {
      setGpsStatus('Quận 1');
      setToastMessage(
        result.error ||
          'Chưa lấy được GPS thực tế. Đang dùng vị trí mặc định tại Quận 1.'
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
    async (site: HeritageSite, explicitMode?: TravelMode) => {
      stopWalkSimulation();
      const localName = (
        site.translations[selectedLanguage] || site.translations.vi
      ).name;
      const straightDist = calculateDistanceMeters(
        userLocation[0],
        userLocation[1],
        site.lat,
        site.lng
      );
      const nextMode: TravelMode =
        explicitMode ?? suggestTravelModeForDistance(straightDist, travelMode);
      if (nextMode !== travelMode) {
        setTravelMode(nextMode);
        if (!explicitMode && nextMode === 'motorbike') {
          setToastMessage(
            `Khoảng cách ${formatDistance(straightDist)} — tự chọn Xe máy (đổi phương tiện ngay trên bản đồ).`
          );
        }
      }

      setSelectedSite(null);
      setActiveTab('map');
      setIsRoutingLoading(true);
      triggerHaptic('light');

      const route = await fetchWalkingRoute(
        userLocation,
        [site.lat, site.lng],
        localName,
        'heritage',
        site.id,
        nextMode
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
    [selectedLanguage, stopWalkSimulation, travelMode, userLocation]
  );

  const handleNavigateToRestaurant = useCallback(
    async (restaurant: NearbyRestaurant, _parentSite: HeritageSite) => {
      stopWalkSimulation();
      const straightDist = calculateDistanceMeters(
        userLocation[0],
        userLocation[1],
        restaurant.lat,
        restaurant.lng
      );
      const nextMode = suggestTravelModeForDistance(straightDist, travelMode);
      if (nextMode !== travelMode) {
        setTravelMode(nextMode);
      }

      setSelectedSite(null);
      setActiveTab('map');
      setIsRoutingLoading(true);
      triggerHaptic('light');

      const route = await fetchWalkingRoute(
        userLocation,
        [restaurant.lat, restaurant.lng],
        `${restaurant.name} (${restaurant.rating.toFixed(1)}★)`,
        'restaurant',
        restaurant.id,
        nextMode
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
    [stopWalkSimulation, travelMode, userLocation]
  );

  const handleChangeTravelMode = useCallback(
    async (nextMode: TravelMode) => {
      setTravelMode(nextMode);
      triggerHaptic('selection');
      if (!activeRoute) return;

      stopWalkSimulation();
      setIsRoutingLoading(true);
      const recalculated = await fetchWalkingRoute(
        userLocation,
        activeRoute.destination,
        activeRoute.targetName,
        activeRoute.targetType,
        activeRoute.targetId,
        nextMode
      );
      setIsRoutingLoading(false);
      setActiveRoute(recalculated);
      setActiveWalkSeconds(0);
      const modeLabel =
        TRAVEL_MODE_OPTIONS.find((m) => m.id === nextMode)?.label || nextMode;
      setToastMessage(`Đã cập nhật lộ trình sang chế độ ${modeLabel}.`);
    },
    [activeRoute, stopWalkSimulation, userLocation]
  );

  const handleSimulateWalkAlongRoute = useCallback(() => {
    if (!activeRoute || isSimulatingWalk) return;
    stopGpsWatch();
    usedSimulatedWalkRef.current = true;
    setIsSimulatingWalk(true);
    triggerHaptic('light');

    const routeMode: TravelMode = activeRoute.travelMode || travelMode;
    const stepMeters =
      routeMode === 'car' ? 80 : routeMode === 'motorbike' ? 45 : 10;
    const coords = interpolateRouteForSmoothWalk(
      activeRoute.coordinates,
      stepMeters
    );
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
        setGpsStatus('Đã đến nơi');
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
            const arriveVerb =
              routeMode === 'walking'
                ? 'đi bộ đến'
                : routeMode === 'motorbike'
                  ? 'chạy xe máy đến'
                  : 'lái ô tô đến';
            setToastMessage(
              `Đã ${arriveVerb} ${targetSite.translations.vi.name}! Bạn có thể check-in lưu ảnh ngay.`
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
  }, [activeRoute, autoAudioGuide, catalogSites, isSimulatingWalk, stopGpsWatch, travelMode]);

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
      const checkInMode: TravelMode = activeRoute?.travelMode || travelMode;

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
        travelMode: checkInMode,
      });
      setVisitedRecords(updated);
      // Cập nhật live số sao & lượt đánh giá hiển thị bên ngoài của địa điểm
      setCatalogSites((prev) =>
        prev.map((s) => {
          if (s.id !== photoCaptureSite.id) return s;
          const prevCount = Number.isFinite(s.reviewCount) ? s.reviewCount : 0;
          const prevRating = Number.isFinite(s.rating) ? s.rating : 4.7;
          const nextCount = prevCount + 1;
          const nextRating = Number(
            ((prevRating * prevCount + data.userRating) / nextCount).toFixed(1)
          );
          return { ...s, rating: nextRating, reviewCount: nextCount };
        })
      );
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
        travelMode: checkInMode,
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
  const isAdminWorkspaceActive = isAdminUser && !adminPreviewAsUser;

  const handleAuthSuccess = useCallback((profile: UserProfile) => {
    setAuthState({
      isAuthenticated: true,
      isGuest: false,
      profile,
    });
    setAuthModalVisible(false);
    if (profile.role === 'admin') {
      setAdminPreviewAsUser(false);
      setToastMessage(`Xin chào Admin ${profile.display_name}! Đã mở Admin Studio.`);
    } else {
      setAdminPreviewAsUser(false);
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
    setAdminPreviewAsUser(false);
    setActiveTab('explore');
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

  // Pre-warm bản đồ 3D ngầm cho chế độ Du khách (bỏ qua khi đang mở Admin Studio để tối ưu tốc độ tải)
  useEffect(() => {
    if (isAdminWorkspaceActive || isMapMounted) return;
    if (activeTab === 'map') {
      setIsMapMounted(true);
      return;
    }
    const timer = setTimeout(() => {
      setIsMapMounted(true);
    }, 650);
    return () => clearTimeout(timer);
  }, [activeTab, isAdminWorkspaceActive, isMapMounted]);

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
      setGpsStatus('Vị trí đã chọn');
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
    returnDetailAfterAiChatRef.current = null;
    setAiChatContextSite(null);
    setAiChatVisible(true);
    triggerHaptic('light');
  }, []);

  const handleAskAiAboutSite = useCallback((site: HeritageSite) => {
    returnDetailAfterAiChatRef.current = site;
    setSelectedSite(null);
    setAiChatContextSite(site);
    setAiChatVisible(true);
    triggerHaptic('light');
  }, []);

  const handleOpenRecognizedSite = useCallback(
    (siteId: string) => {
      returnDetailAfterPhotoRef.current = null;
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
      <View
        style={
          exploreColumns > 1
            ? [
                styles.gridCell,
                { maxWidth: `${100 / exploreColumns}%` as unknown as number },
              ]
            : undefined
        }
      >
        <SiteCard
          site={item.site}
          index={index}
          distanceMeters={item.distanceMeters}
          estimatedWalkingSeconds={item.estimatedWalkingSeconds}
          selectedLanguage={selectedLanguage}
          visitedRecord={visitedMap.get(item.site.id)}
          isActiveRouteTarget={activeRoute?.targetId === item.site.id}
          isGridItem={exploreColumns > 1}
          onOpenDetail={setSelectedSite}
          onStartNavigation={handleStartNavigationToSite}
          onNavigateToRestaurant={handleNavigateToRestaurant}
          onOpenPhotoCapture={setPhotoCaptureSite}
        />
      </View>
    ),
    [
      activeRoute?.targetId,
      exploreColumns,
      handleNavigateToRestaurant,
      handleStartNavigationToSite,
      selectedLanguage,
      visitedMap,
    ]
  );

  // Top quán ăn & đồ uống gần vị trí hiện tại để hiển thị nổi bật ngay trong tab Khám phá
  const nearbyFeaturedRestaurants = useMemo(() => {
    if (isAdminWorkspaceActive) return [];
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
  }, [isAdminWorkspaceActive, nearbySitesWithMetrics, selectedLanguage, userLocation]);

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
      ? 'Vị trí của bạn'
      : activeCityId === 'ALL_HCM'
        ? 'Quận 1'
        : (
            CITY_PRESETS.find((c) => c.id === activeCityId)?.label || gpsStatus
          )
            .split('·')[0]
            .trim();

  const currentLangMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) ||
    SUPPORTED_LANGUAGES[0];

  // Clean Scrollable List Header: Unified Soft Jade Concierge Card + Segmented Switcher + Slim Category Pills
  const exploreListHeader = (
    <View style={styles.listHeaderWrap}>
      {/* Unified Soft Jade Concierge Card (replaces scattered AI buttons & duplicate Weather block) */}
      <View
        style={[
          styles.conciergeBanner,
          isWideWeb && styles.conciergeBannerWide,
        ]}
      >
        <View style={styles.conciergeTextCol}>
          <View style={styles.conciergeEyebrowRow}>
            <Compass size={13} color={COLORS.accentDeep} strokeWidth={2} />
            <Text style={styles.conciergeEyebrow}>
              TRỢ LÝ HÀNH TRÌNH THÔNG MINH
            </Text>
          </View>
          <Text style={styles.conciergeHeadline}>
            Lập lịch trình theo thời tiết hoặc hỏi đáp lịch sử 5 ngôn ngữ
          </Text>
        </View>

        <View
          style={[
            styles.conciergeActions,
            isWideWeb && styles.conciergeActionsWide,
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setSmartTourVisible(true);
              triggerHaptic('light');
            }}
            style={styles.conciergePrimaryBtn}
          >
            <Route size={14} color={COLORS.white} strokeWidth={2} />
            <Text style={styles.conciergePrimaryText}>Lập lịch trình</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleOpenGlobalAiChat}
            style={styles.conciergeSecondaryBtn}
          >
            <MessageSquareText
              size={14}
              color={COLORS.accentDeep}
              strokeWidth={2}
            />
            <Text style={styles.conciergeSecondaryText}>Hỏi trợ lý</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Clean Mode Switcher + Category Pills */}
      <View
        style={[
          styles.exploreControlsBar,
          isWideWeb && styles.exploreControlsBarWide,
        ]}
      >
        <View
          style={[
            styles.segmentedControl,
            isWideWeb && styles.segmentedControlWide,
          ]}
        >
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
            <Landmark
              size={13}
              color={
                exploreSection === 'sites' ? COLORS.white : COLORS.accentDeep
              }
              strokeWidth={2}
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
              color={
                exploreSection === 'dining' ? COLORS.white : COLORS.accentDeep
              }
              strokeWidth={2}
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

        {exploreSection === 'sites' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPillsRow}
          >
            {CATEGORY_FILTERS.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.78}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    triggerHaptic('selection');
                  }}
                  style={[
                    styles.catPill,
                    active && styles.catPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      active && styles.catPillTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {(activeFilterCount > 0 || selectedCategory !== 'all' || searchQuery.length > 0) && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setActiveCityId('ALL_HCM');
                  setSearchRadiusMeters(0);
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setGpsStatus('Quận 1');
                }}
                style={styles.quickResetPill}
              >
                <X size={12} color={COLORS.accentDeep} strokeWidth={2.2} />
                <Text style={styles.quickResetPillText}>Đặt lại</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>

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
            <Headphones size={14} color={COLORS.white} strokeWidth={2} />
            <Text style={styles.proximityPlayText}>Nghe</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Dedicated Admin Workspace Shell (tách biệt hoàn toàn giao diện & taskbar với Du khách, tải lười từng phân hệ)
  if (isAdminWorkspaceActive) {
    return (
      <View style={styles.adminShellRoot}>
        <StatusBar style="light" />
        <Suspense
          fallback={
            <View style={styles.adminLoadingBox}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.adminLoadingText}>
                Đang khởi động Admin Studio...
              </Text>
            </View>
          }
        >
          <LazyAdminWorkspaceShell
            sites={catalogSites}
            userLocation={userLocation}
            authState={authState}
            onUpsertSite={handleAdminUpsertSite}
            onDeleteSite={handleAdminDeleteSite}
            onUpsertRestaurant={handleAdminUpsertRestaurant}
            onDeleteRestaurant={handleAdminDeleteRestaurant}
            onOpenAuthModal={() => setAuthModalVisible(true)}
            onLogout={handleLogout}
            onEnterUserPreview={() => {
              setAdminPreviewAsUser(true);
              setActiveTab('explore');
              setToastMessage('Đang xem ứng dụng như Du khách.');
              triggerHaptic('selection');
            }}
            onNotify={(msg) => setToastMessage(msg)}
          />
        </Suspense>

        {toastMessage && (
          <View
            pointerEvents="none"
            style={[
              styles.toastWrap,
              { bottom: Math.max(insets.bottom, 8) + 70 },
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
            setAdminPreviewAsUser(false);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Ultra-Clean 1-Line Soft Jade Header (Zero GPS coords, unified 100% Lucide icons) */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 8) + 4 },
        ]}
      >
        <View style={styles.headerInner}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Landmark size={16} color={COLORS.accentDeep} strokeWidth={2} />
            </View>
            <Text style={styles.brandTitle} numberOfLines={1}>
              Smart Heritage
            </Text>
          </View>

          <View style={styles.headerActions}>
            {/* Compact Weather Pill (opens 4h forecast sheet) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setWeatherSheetVisible(true);
                triggerHaptic('selection');
              }}
              style={[
                styles.headerWeatherBtn,
                weather?.aiTourAdvice.comfortLevel === 'rain_alert' &&
                  styles.headerWeatherBtnRain,
              ]}
              accessibilityLabel="Xem thời tiết trực tiếp"
            >
              {weather?.conditionKind === 'sunny' ? (
                <Sun size={14} color={COLORS.amberStar} strokeWidth={2} />
              ) : weather?.conditionKind === 'cloudy' ? (
                <Cloud size={14} color={COLORS.inkSecondary} strokeWidth={2} />
              ) : weather?.conditionKind === 'rain' ? (
                <CloudRain size={14} color={COLORS.gpsBlue} strokeWidth={2} />
              ) : weather?.conditionKind === 'storm' ? (
                <CloudLightning
                  size={14}
                  color={COLORS.accentDeep}
                  strokeWidth={2}
                />
              ) : (
                <CloudSun size={14} color={COLORS.amberStar} strokeWidth={2} />
              )}
              <Text style={styles.headerWeatherText}>
                {weather ? `${Math.round(weather.temperatureC)}°` : '--°'}
              </Text>
            </TouchableOpacity>

            {/* Unified Floating ☰ Menu Button (Account · Language · Auto Audio · GPS) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setMenuLangExpanded(false);
                setMenuPopoverVisible((prev) => !prev);
                triggerHaptic('selection');
              }}
              style={[
                styles.headerMenuBtn,
                isWideWeb && styles.headerMenuBtnWide,
                menuPopoverVisible && styles.headerMenuBtnOpen,
              ]}
              accessibilityLabel="Mở menu cài đặt và tài khoản"
            >
              {menuPopoverVisible ? (
                <X size={17} color={COLORS.accentDeep} strokeWidth={2.2} />
              ) : (
                <Menu size={17} color={COLORS.accentDeep} strokeWidth={2.2} />
              )}
              {isWideWeb && (
                <Text style={styles.headerMenuLabel}>Cài đặt</Text>
              )}
              {authState.isAuthenticated && <View style={styles.onlineDot} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainBody}>
        {activeTab === 'explore' && (
          <View style={styles.tabContainer}>
            {/* Clean Sticky Search + Compact Area Chip */}
            <View style={styles.stickySearchArea}>
              <View style={styles.searchFilterRow}>
                <View
                  style={[
                    styles.searchPill,
                    searchFocused && styles.searchPillFocused,
                  ]}
                >
                  <Search
                    size={15}
                    color={searchFocused ? COLORS.accentDeep : COLORS.inkMuted}
                    strokeWidth={2}
                  />
                  <TextInput
                    value={searchQuery}
                    onFocus={() => setSearchFocused(true)}
                    onChangeText={(txt) => {
                      setSearchQuery(txt);
                      if (!searchFocused) setSearchFocused(true);
                    }}
                    onSubmitEditing={() => setSearchFocused(false)}
                    placeholder="Tìm di tích, quận, món đặc sản…"
                    placeholderTextColor={COLORS.inkMuted}
                    style={styles.searchInput}
                    returnKeyType="search"
                  />
                  {(searchQuery.length > 0 || searchFocused) && (
                    <TouchableOpacity
                      onPress={() => {
                        if (searchQuery.length > 0) {
                          setSearchQuery('');
                        } else {
                          setSearchFocused(false);
                          Keyboard.dismiss();
                        }
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Xóa tìm kiếm hoặc đóng gợi ý"
                    >
                      <X size={15} color={COLORS.inkMuted} strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => {
                    setSearchFocused(false);
                    Keyboard.dismiss();
                    setFilterSheetVisible(true);
                    triggerHaptic('selection');
                  }}
                  style={[
                    styles.areaChipBtn,
                    activeFilterCount > 0 && styles.areaChipBtnActive,
                  ]}
                  accessibilityLabel="Chọn khu vực và bán kính tìm kiếm"
                >
                  <MapPin
                    size={14}
                    color={
                      activeFilterCount > 0
                        ? COLORS.white
                        : COLORS.accentDeep
                    }
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.areaChipText,
                      activeFilterCount > 0 && styles.areaChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {activeCityLabel}
                  </Text>
                  <ChevronDown
                    size={13}
                    color={
                      activeFilterCount > 0
                        ? COLORS.white
                        : COLORS.inkSecondary
                    }
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Floating Smart Search Dropdown Overlay (zero layout shift on Mobile & Web) */}
            {searchFocused && (
              <>
                <Pressable
                  onPress={() => {
                    setSearchFocused(false);
                    Keyboard.dismiss();
                  }}
                  style={styles.searchOverlayBackdrop}
                  accessibilityLabel="Đóng danh sách gợi ý tìm kiếm"
                />
                <View style={styles.searchDropdownAnchor} pointerEvents="box-none">
                  <View style={styles.searchDropdownCard}>
                    <View style={styles.searchDropdownHeader}>
                      <View style={styles.searchDropdownHeaderLeft}>
                        {smartSearchSuggestions.mode === 'nearby' ? (
                          <LocateFixed
                            size={13}
                            color={COLORS.accentDeep}
                            strokeWidth={2}
                          />
                        ) : (
                          <Search
                            size={13}
                            color={COLORS.accentDeep}
                            strokeWidth={2}
                          />
                        )}
                        <Text style={styles.searchDropdownEyebrow}>
                          {smartSearchSuggestions.mode === 'nearby'
                            ? 'Gần vị trí của bạn'
                            : `Gợi ý cho "${searchQuery.trim()}"`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setSearchFocused(false);
                          Keyboard.dismiss();
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.searchDropdownCloseText}>Đóng</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                      style={styles.searchDropdownScroll}
                    >
                      {smartSearchSuggestions.sites.length === 0 &&
                      smartSearchSuggestions.restaurants.length === 0 ? (
                        <View style={styles.searchEmptyRow}>
                          <Text style={styles.searchEmptyText}>
                            Không tìm thấy địa điểm hay quán ăn nào khớp với &quot;
                            {searchQuery.trim()}&quot;.
                          </Text>
                        </View>
                      ) : (
                        <>
                          {smartSearchSuggestions.sites.length > 0 && (
                            <View style={styles.searchGroupSection}>
                              {smartSearchSuggestions.mode === 'query' &&
                                smartSearchSuggestions.restaurants.length > 0 && (
                                  <Text style={styles.searchGroupLabel}>
                                    DI TÍCH &amp; ĐỊA ĐIỂM
                                  </Text>
                                )}
                              {smartSearchSuggestions.sites.map((entry) => {
                                const localName = (
                                  entry.site.translations[selectedLanguage] ||
                                  entry.site.translations.vi
                                ).name;
                                const shortDistrict =
                                  entry.site.district ||
                                  entry.site.city.split('·')[0].trim();
                                const useMoto = entry.distanceMeters > 3500;
                                const eta = useMoto
                                  ? `~${formatTravelDuration(
                                      estimateTravelSeconds(
                                        entry.distanceMeters,
                                        'motorbike'
                                      ),
                                      'motorbike'
                                    )}`
                                  : `~${formatWalkingDuration(
                                      entry.estimatedWalkingSeconds
                                    )}`;
                                return (
                                  <TouchableOpacity
                                    key={entry.site.id}
                                    activeOpacity={0.78}
                                    onPress={() => {
                                      setSearchFocused(false);
                                      Keyboard.dismiss();
                                      setSelectedSite(entry.site);
                                      triggerHaptic('selection');
                                    }}
                                    style={styles.searchSuggestionRow}
                                  >
                                    <Image
                                      source={{ uri: entry.site.coverImage }}
                                      style={styles.searchSuggestionThumb}
                                      resizeMode="cover"
                                    />
                                    <View style={styles.searchSuggestionInfo}>
                                      <Text
                                        style={styles.searchSuggestionTitle}
                                        numberOfLines={1}
                                      >
                                        {localName}
                                      </Text>
                                      <Text
                                        style={styles.searchSuggestionSub}
                                        numberOfLines={1}
                                      >
                                        {shortDistrict} · {eta} (
                                        {formatDistance(entry.distanceMeters)})
                                      </Text>
                                    </View>
                                    <ChevronRight
                                      size={15}
                                      color={COLORS.inkMuted}
                                      strokeWidth={2}
                                    />
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}

                          {smartSearchSuggestions.restaurants.length > 0 && (
                            <View style={styles.searchGroupSection}>
                              <Text style={styles.searchGroupLabel}>
                                ẨM THỰC GẦN DI TÍCH
                              </Text>
                              {smartSearchSuggestions.restaurants.map((entry) => {
                                const useMoto = entry.distanceMeters > 3500;
                                const eta = useMoto
                                  ? `~${formatTravelDuration(
                                      estimateTravelSeconds(
                                        entry.distanceMeters,
                                        'motorbike'
                                      ),
                                      'motorbike'
                                    )}`
                                  : `~${formatWalkingDuration(
                                      entry.walkingSeconds
                                    )}`;
                                return (
                                  <TouchableOpacity
                                    key={entry.restaurant.id}
                                    activeOpacity={0.78}
                                    onPress={() => {
                                      setSearchFocused(false);
                                      Keyboard.dismiss();
                                      void handleNavigateToRestaurant(
                                        entry.restaurant,
                                        entry.parentSite
                                      );
                                    }}
                                    style={styles.searchSuggestionRow}
                                  >
                                    <View style={styles.searchFoodIconBox}>
                                      <Utensils
                                        size={16}
                                        color={COLORS.accentDeep}
                                        strokeWidth={2}
                                      />
                                    </View>
                                    <View style={styles.searchSuggestionInfo}>
                                      <Text
                                        style={styles.searchSuggestionTitle}
                                        numberOfLines={1}
                                      >
                                        {entry.restaurant.name}
                                      </Text>
                                      <Text
                                        style={styles.searchSuggestionSub}
                                        numberOfLines={1}
                                      >
                                        Gần {entry.parentName} · {eta} (
                                        {formatDistance(entry.distanceMeters)})
                                      </Text>
                                    </View>
                                    <View style={styles.searchFoodCtaPill}>
                                      <Navigation
                                        size={11}
                                        color={COLORS.accentDeep}
                                        strokeWidth={2}
                                      />
                                      <Text style={styles.searchFoodCtaText}>
                                        Đi tới
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}
                        </>
                      )}
                    </ScrollView>
                  </View>
                </View>
              </>
            )}

            {/* Quick Audio Player (when active) */}
            {quickAudioSite && (
              <View style={styles.quickAudioCard}>
                <View style={styles.quickAudioInner}>
                  <View style={styles.quickAudioHeader}>
                    <View style={styles.quickAudioTitleWrap}>
                      <Headphones
                        size={13}
                        color={COLORS.accentDeep}
                        strokeWidth={2}
                      />
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
              </View>
            )}

            {/* Main Explore Feed: Responsive 1/2/3 Column Grid across Mobile & Web */}
            {exploreSection === 'sites' ? (
              <FlatList
                key={`sites-cols-${exploreColumns}`}
                numColumns={exploreColumns}
                columnWrapperStyle={
                  exploreColumns > 1 ? styles.gridRow : undefined
                }
                data={nearbySitesWithMetrics}
                keyExtractor={(item) => item.site.id}
                renderItem={renderSiteItem}
                ListHeaderComponent={exploreListHeader}
                contentContainerStyle={[
                  styles.listContent,
                  isWideWeb && styles.listContentWide,
                ]}
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
                        setGpsStatus('Quận 1');
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
                key={`dining-cols-${exploreColumns}`}
                numColumns={exploreColumns}
                columnWrapperStyle={
                  exploreColumns > 1 ? styles.gridRow : undefined
                }
                data={nearbyFeaturedRestaurants}
                keyExtractor={(item) => item.restaurant.id}
                ListHeaderComponent={exploreListHeader}
                contentContainerStyle={[
                  styles.listContent,
                  isWideWeb && styles.listContentWide,
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: entry }) => {
                  const useMoto = entry.distanceMeters > 3500;
                  const etaLabel = useMoto
                    ? `~${formatTravelDuration(
                        estimateTravelSeconds(entry.distanceMeters, 'motorbike'),
                        'motorbike'
                      )}`
                    : `~${formatWalkingDuration(entry.walkingSeconds)}`;
                  return (
                    <View
                      style={
                        exploreColumns > 1
                          ? [
                              styles.gridCell,
                              {
                                maxWidth: `${
                                  100 / exploreColumns
                                }%` as unknown as number,
                              },
                            ]
                          : undefined
                      }
                    >
                      <View
                        style={[
                          styles.diningFeedCard,
                          exploreColumns > 1 && styles.diningFeedCardGrid,
                        ]}
                      >
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
                              <Text
                                style={styles.diningFeedName}
                                numberOfLines={1}
                              >
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
                            <Text
                              style={styles.diningFeedCuisine}
                              numberOfLines={1}
                            >
                              {entry.restaurant.cuisine}
                              {entry.restaurant.priceRange
                                ? ` · ${entry.restaurant.priceRange}`
                                : ''}
                            </Text>
                            <Text
                              style={styles.diningFeedNearSite}
                              numberOfLines={1}
                            >
                              Gần {entry.parentName}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <View style={styles.diningFeedFooter}>
                          <View style={styles.diningFeedDistWrap}>
                            {useMoto ? (
                              <Bike
                                size={12.5}
                                color={COLORS.accentDeep}
                                strokeWidth={2}
                              />
                            ) : (
                              <Footprints
                                size={12}
                                color={COLORS.accentDeep}
                                strokeWidth={2}
                              />
                            )}
                            <Text
                              style={styles.diningFeedDistText}
                              numberOfLines={1}
                            >
                              {etaLabel} ({formatDistance(entry.distanceMeters)})
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
                            <Navigation
                              size={12}
                              color={COLORS.white}
                              strokeWidth={2}
                            />
                            <Text style={styles.diningFeedGoText}>
                              Chỉ đường
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                }}
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
              travelMode={travelMode}
              onChangeTravelMode={handleChangeTravelMode}
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
      </View>

      {/* Nút nổi quay lại Admin Studio khi Admin đang xem thử chế độ Du khách */}
      {isAdminUser && adminPreviewAsUser && (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => {
            setAdminPreviewAsUser(false);
            triggerHaptic('selection');
          }}
          style={[
            styles.returnAdminPill,
            { bottom: Math.max(insets.bottom, 8) + 68 },
          ]}
          accessibilityLabel="Quay lại giao diện Admin Studio"
        >
          <ShieldCheck size={14} color="#FDBA74" />
          <Text style={styles.returnAdminPillText}>Quay lại Admin Studio</Text>
        </TouchableOpacity>
      )}

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
            color={activeTab === 'explore' ? COLORS.accentDeep : COLORS.inkMuted}
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
                color={activeTab === 'map' ? COLORS.accentDeep : COLORS.inkMuted}
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
              color={activeTab === 'journey' ? COLORS.accentDeep : COLORS.inkMuted}
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
            color={activeTab === 'ranking' ? COLORS.accentDeep : COLORS.inkMuted}
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

      {/* Live Weather Detail Bottom Sheet (opened from Header Weather Pill on Map or any tab) */}
      <Modal
        visible={weatherSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWeatherSheetVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setWeatherSheetVisible(false)}
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
              <Text style={styles.sheetTitle}>Thời tiết trực tiếp</Text>
              <TouchableOpacity
                onPress={() => setWeatherSheetVisible(false)}
                style={styles.sheetCloseBtn}
              >
                <X size={18} color={COLORS.inkSecondary} />
              </TouchableOpacity>
            </View>

            {weather ? (
              <View style={styles.weatherSheetBody}>
                <View style={styles.weatherSheetTop}>
                  <View>
                    <Text style={styles.weatherSheetTemp}>
                      {Math.round(weather.temperatureC)}°C
                    </Text>
                    <Text style={styles.weatherSheetCond}>
                      {weather.conditionLabelVi} · Cảm giác{' '}
                      {Math.round(weather.apparentTemperatureC)}°C
                    </Text>
                    <Text style={styles.weatherSheetLoc}>{activeCityLabel}</Text>
                  </View>
                  <View style={styles.weatherSheetLivePill}>
                    <View style={styles.gpsDot} />
                    <Text style={styles.weatherSheetLiveText}>
                      Tự động cập nhật
                    </Text>
                  </View>
                </View>

                <View style={styles.weatherSheetMetrics}>
                  <View style={styles.weatherSheetMetricBox}>
                    <Droplets size={15} color={COLORS.gpsBlue} />
                    <Text style={styles.weatherSheetMetricVal}>
                      {weather.humidityPercent}%
                    </Text>
                    <Text style={styles.weatherSheetMetricLbl}>Độ ẩm</Text>
                  </View>
                  <View style={styles.weatherSheetMetricBox}>
                    <Umbrella size={15} color={COLORS.accent} />
                    <Text style={styles.weatherSheetMetricVal}>
                      {weather.rainProbabilityPercent}%
                    </Text>
                    <Text style={styles.weatherSheetMetricLbl}>
                      Khả năng mưa
                    </Text>
                  </View>
                  <View style={styles.weatherSheetMetricBox}>
                    <Wind size={15} color={COLORS.inkSecondary} />
                    <Text style={styles.weatherSheetMetricVal}>
                      {weather.windSpeedKmh} km/h
                    </Text>
                    <Text style={styles.weatherSheetMetricLbl}>Gió</Text>
                  </View>
                </View>

                {weather.hourlyPreview.length > 0 && (
                  <View style={styles.weatherSheetHourlyRow}>
                    {weather.hourlyPreview.map((slot, idx) => (
                      <View
                        key={`${slot.isoTime}-${idx}`}
                        style={styles.weatherSheetHourlyCell}
                      >
                        <Text style={styles.weatherSheetHourlyTime}>
                          {slot.hourLabel}
                        </Text>
                        <Text style={styles.weatherSheetHourlyTemp}>
                          {slot.temperatureC}°
                        </Text>
                        <Text style={styles.weatherSheetHourlyRain}>
                          {slot.rainProbabilityPercent}% mưa
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.weatherSheetAdviceCard}>
                  <Compass size={15} color={COLORS.accentDeep} strokeWidth={2} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.weatherSheetAdviceTitle}>
                      {weather.aiTourAdvice.headlineVi}
                    </Text>
                    <Text style={styles.weatherSheetAdviceDesc}>
                      {weather.aiTourAdvice.detailVi}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setWeatherSheetVisible(false);
                    setSmartTourVisible(true);
                  }}
                  style={styles.sheetApplyBtn}
                >
                  <Text style={styles.sheetApplyText}>
                    Lập lịch trình theo thời tiết này
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.weatherSheetCond}>
                Đang tự động cập nhật dữ liệu thời tiết…
              </Text>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Redesigned Floating ☰ Menu Popover (Account · Language Dropdown · Auto Audio Switch · GPS) */}
      <Modal
        visible={menuPopoverVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuPopoverVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuPopoverVisible(false)}
          style={styles.menuBackdrop}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={[
              styles.menuPopoverCard,
              {
                marginTop: Math.max(insets.top, 8) + 56,
              },
              isWideWeb && styles.menuPopoverCardWide,
            ]}
          >
            {/* Block 1: Account Profile Card */}
            <View style={styles.menuProfileBlock}>
              <View style={styles.menuProfileLeft}>
                <View
                  style={[
                    styles.menuAvatarCircle,
                    authState.isAuthenticated && styles.menuAvatarCircleOnline,
                  ]}
                >
                  <User
                    size={18}
                    color={COLORS.accentDeep}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.menuProfileTextCol}>
                  <Text style={styles.menuProfileName} numberOfLines={1}>
                    {authState.isAuthenticated
                      ? authState.profile?.display_name || 'Thành viên'
                      : 'Chế độ Khách'}
                  </Text>
                  <Text style={styles.menuProfileSub} numberOfLines={1}>
                    {authState.isAuthenticated
                      ? authState.profile?.email || 'Đã bật đồng bộ Cloud'
                      : 'Đăng nhập để đồng bộ hành trình'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setMenuPopoverVisible(false);
                  setAuthModalVisible(true);
                }}
                style={styles.menuAuthBtn}
              >
                <Text style={styles.menuAuthBtnText}>
                  {authState.isAuthenticated ? 'Quản lý' : 'Đăng nhập'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Block 2: Grouped Settings Rows */}
            <View style={styles.menuSettingsGroup}>
              {/* 2.1 Language Accordion Dropdown */}
              <View style={styles.menuRowBlock}>
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => setMenuLangExpanded((prev) => !prev)}
                  style={styles.menuRowTouchable}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={styles.menuRowIconBox}>
                      <Globe
                        size={15}
                        color={COLORS.accentDeep}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={styles.menuRowTextCol}>
                      <Text style={styles.menuRowTitle}>
                        Ngôn ngữ thuyết minh
                      </Text>
                      <Text style={styles.menuRowSub}>
                        {currentLangMeta.nativeLabel} (
                        {currentLangMeta.code.toUpperCase()})
                      </Text>
                    </View>
                  </View>
                  <ChevronDown
                    size={16}
                    color={COLORS.inkSecondary}
                    strokeWidth={2}
                    style={
                      menuLangExpanded
                        ? { transform: [{ rotate: '180deg' }] }
                        : undefined
                    }
                  />
                </TouchableOpacity>

                {menuLangExpanded && (
                  <View style={styles.menuLangList}>
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const active = selectedLanguage === lang.code;
                      return (
                        <TouchableOpacity
                          key={lang.code}
                          activeOpacity={0.78}
                          onPress={() => {
                            setSelectedLanguage(lang.code);
                            setMenuLangExpanded(false);
                            triggerHaptic('selection');
                          }}
                          style={[
                            styles.menuLangOption,
                            active && styles.menuLangOptionActive,
                          ]}
                        >
                          <View style={styles.menuLangOptionLeft}>
                            <Text
                              style={[
                                styles.menuLangNative,
                                active && styles.menuLangNativeActive,
                              ]}
                            >
                              {lang.nativeLabel}
                            </Text>
                            <Text style={styles.menuLangCode}>
                              {lang.code.toUpperCase()}
                            </Text>
                          </View>
                          {active && (
                            <Check
                              size={15}
                              color={COLORS.accentDeep}
                              strokeWidth={2.4}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 2.2 Auto Audio Guide Switch */}
              <View style={styles.menuRowDivider} />
              <View style={styles.menuRowInline}>
                <View style={styles.menuRowLeft}>
                  <View style={styles.menuRowIconBox}>
                    <Volume2
                      size={15}
                      color={COLORS.accentDeep}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.menuRowTextCol}>
                    <Text style={styles.menuRowTitle}>
                      Tự động thuyết minh
                    </Text>
                    <Text style={styles.menuRowSub}>
                      Tự phát khi đến gần (&lt; 150m)
                    </Text>
                  </View>
                </View>
                <Switch
                  value={autoAudioGuide}
                  onValueChange={(next) => {
                    setAutoAudioGuide(next);
                    setToastMessage(
                      next
                        ? 'Đã bật tự động thuyết minh khi đến gần (< 150m).'
                        : 'Đã tắt tự động thuyết minh.'
                    );
                    triggerHaptic('selection');
                  }}
                  trackColor={{
                    false: COLORS.borderStrong,
                    true: COLORS.accent,
                  }}
                  thumbColor={COLORS.white}
                />
              </View>

              {/* 2.3 Live GPS Status & Refresh */}
              <View style={styles.menuRowDivider} />
              <View style={styles.menuRowInline}>
                <View style={styles.menuRowLeft}>
                  <View style={styles.menuRowIconBox}>
                    <LocateFixed
                      size={15}
                      color={COLORS.accentDeep}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.menuRowTextCol}>
                    <Text style={styles.menuRowTitle}>
                      Định vị GPS thực tế
                    </Text>
                    <Text style={styles.menuRowSub}>
                      {isLocatingGps
                        ? 'Đang xác định vị trí…'
                        : activeCityId === 'GPS'
                          ? 'Đang hoạt động · Vị trí của bạn'
                          : `Khu vực đang chọn · ${activeCityLabel}`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setMenuPopoverVisible(false);
                    void handleDetectRealGps();
                  }}
                  style={styles.menuGpsRefreshBtn}
                >
                  <Text style={styles.menuGpsRefreshText}>Cập nhật</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Block 3: Compact Offline-First Footer */}
            <View style={styles.menuFooter}>
              <View style={styles.menuFooterLeft}>
                <View style={styles.gpsDot} />
                <Text style={styles.menuFooterText}>
                  Offline-First · {catalogSites.length} di tích
                </Text>
              </View>
              <Text style={styles.menuFooterText}>TP.HCM</Text>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Heritage Detail Modal */}
      {selectedSite && (
        <HeritageDetailModal
          visible={true}
          site={
            catalogSites.find((s) => s.id === selectedSite.id) || selectedSite
          }
          visitedRecord={visitedMap.get(selectedSite.id)}
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
            returnDetailAfterPhotoRef.current = site;
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
          onClose={() => {
            setPhotoCaptureSite(null);
            if (returnDetailAfterPhotoRef.current) {
              const prevSite = returnDetailAfterPhotoRef.current;
              returnDetailAfterPhotoRef.current = null;
              setSelectedSite(prevSite);
            }
          }}
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
        initialTravelMode={travelMode}
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
        onClose={() => {
          setAiChatVisible(false);
          if (returnDetailAfterAiChatRef.current) {
            const prevSite = returnDetailAfterAiChatRef.current;
            returnDetailAfterAiChatRef.current = null;
            setSelectedSite(prevSite);
          }
        }}
        onOpenSiteById={(siteId) => {
          returnDetailAfterAiChatRef.current = null;
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
          setAdminPreviewAsUser(false);
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
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 10,
    alignItems: 'center',
  },
  headerInner: {
    width: '100%',
    maxWidth: 1120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.visitedDot,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerWeatherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerWeatherBtnRain: {
    backgroundColor: COLORS.gpsBlueSoft,
    borderColor: '#BFDBFE',
  },
  headerWeatherText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  headerMenuBtn: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    position: 'relative',
  },
  headerMenuBtnWide: {
    width: 'auto',
    paddingHorizontal: 14,
  },
  headerMenuBtnOpen: {
    backgroundColor: COLORS.accentSoftStrong,
    borderColor: COLORS.accent,
  },
  headerMenuLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.accentDeep,
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
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  searchFilterRow: {
    width: '100%',
    maxWidth: 1120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    height: 44,
    ...SHADOWS.card,
  },
  searchPillFocused: {
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },
  searchOverlayBackdrop: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 35,
    backgroundColor: 'rgba(19, 36, 34, 0.22)',
  },
  searchDropdownAnchor: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 40,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  searchDropdownCard: {
    width: '100%',
    maxWidth: 1120,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    overflow: 'hidden',
    ...SHADOWS.floating,
  },
  searchDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchDropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  searchDropdownEyebrow: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  searchDropdownCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.inkMuted,
  },
  searchDropdownScroll: {
    maxHeight: 340,
  },
  searchEmptyRow: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  searchEmptyText: {
    fontSize: 12.5,
    color: COLORS.inkMuted,
    textAlign: 'center',
  },
  searchGroupSection: {
    paddingVertical: 4,
  },
  searchGroupLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: COLORS.inkMuted,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceMuted,
  },
  searchSuggestionThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceMuted,
  },
  searchFoodIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSuggestionInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  searchSuggestionTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  searchSuggestionSub: {
    fontSize: 11.5,
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  searchFoodCtaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  searchFoodCtaText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.ink,
    paddingVertical: 0,
  },
  areaChipBtn: {
    height: 44,
    maxWidth: 162,
    paddingHorizontal: 13,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    ...SHADOWS.card,
  },
  areaChipBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  areaChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.accentDeep,
    flexShrink: 1,
  },
  areaChipTextActive: {
    color: COLORS.white,
  },
  listHeaderWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
  },
  conciergeBanner: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: 15,
    gap: 12,
  },
  conciergeBannerWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  conciergeTextCol: {
    flex: 1,
    gap: 4,
  },
  conciergeEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conciergeEyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: COLORS.accentDeep,
  },
  conciergeHeadline: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    color: COLORS.ink,
  },
  conciergeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conciergeActionsWide: {
    flexShrink: 0,
  },
  conciergePrimaryBtn: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  conciergePrimaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  conciergeSecondaryBtn: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  conciergeSecondaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  exploreControlsBar: {
    gap: 10,
  },
  exploreControlsBarWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADII.lg,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentedControlWide: {
    width: 300,
    flexShrink: 0,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADII.md,
  },
  segBtnActive: {
    backgroundColor: COLORS.accent,
  },
  segBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  segBtnTextActive: {
    color: COLORS.white,
  },
  categoryPillsRow: {
    gap: 8,
    paddingRight: SPACING.sm,
    alignItems: 'center',
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catPillActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  catPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  catPillTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  quickResetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: RADII.pill,
  },
  quickResetPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  gridRow: {
    paddingHorizontal: SPACING.lg,
    gap: 14,
    marginBottom: 14,
  },
  gridCell: {
    flex: 1,
  },
  listContentWide: {
    width: '100%',
    maxWidth: 1152,
    alignSelf: 'center',
  },
  diningFeedCardGrid: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
    justifyContent: 'space-between',
  },
  quickAudioInner: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
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
    backgroundColor: COLORS.accent,
    borderRadius: RADII.pill,
    paddingHorizontal: 13,
    paddingVertical: 8,
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
    backgroundColor: COLORS.accent,
    paddingHorizontal: 13,
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
    backgroundColor: COLORS.accent,
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
    color: COLORS.accentDeep,
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
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
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
    backgroundColor: COLORS.accent,
    borderRadius: RADII.pill,
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
  weatherSheetBody: {
    gap: 12,
  },
  weatherSheetTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  weatherSheetTemp: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.6,
  },
  weatherSheetCond: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
    marginTop: 2,
  },
  weatherSheetLoc: {
    fontSize: 12,
    color: COLORS.inkMuted,
    marginTop: 2,
  },
  weatherSheetLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  weatherSheetLiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  weatherSheetMetrics: {
    flexDirection: 'row',
    gap: 8,
  },
  weatherSheetMetricBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    gap: 3,
  },
  weatherSheetMetricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  weatherSheetMetricLbl: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  weatherSheetHourlyRow: {
    flexDirection: 'row',
    gap: 7,
  },
  weatherSheetHourlyCell: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceMuted,
    paddingVertical: 7,
    gap: 2,
  },
  weatherSheetHourlyTime: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  weatherSheetHourlyTemp: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  weatherSheetHourlyRain: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  weatherSheetAdviceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.surfaceTint,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: 11,
  },
  weatherSheetAdviceTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  weatherSheetAdviceDesc: {
    fontSize: 11.5,
    color: COLORS.inkSecondary,
    lineHeight: 16.5,
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
  // Floating ☰ Menu Popover Styles
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(19, 36, 34, 0.30)',
    paddingHorizontal: SPACING.md,
    alignItems: 'flex-end',
  },
  menuPopoverCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.floating,
  },
  menuPopoverCardWide: {
    marginRight: 12,
  },
  menuProfileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 14,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  menuAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarCircleOnline: {
    backgroundColor: COLORS.visitedBg,
    borderColor: COLORS.visitedBorder,
  },
  menuProfileTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  menuProfileName: {
    fontFamily: SERIF_FONT,
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  menuProfileSub: {
    fontSize: 11.5,
    color: COLORS.inkSecondary,
  },
  menuAuthBtn: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAuthBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  menuSettingsGroup: {
    paddingHorizontal: 14,
  },
  menuRowBlock: {
    paddingVertical: 12,
  },
  menuRowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  menuRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 12,
  },
  menuRowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  menuRowIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  menuRowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  menuRowSub: {
    fontSize: 11.5,
    color: COLORS.inkMuted,
  },
  menuLangList: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  menuLangOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADII.md,
  },
  menuLangOptionActive: {
    backgroundColor: COLORS.accentSoft,
  },
  menuLangOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuLangNative: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  menuLangNativeActive: {
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  menuLangCode: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  menuGpsRefreshBtn: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuGpsRefreshText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  menuFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  menuFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  adminShellRoot: {
    flex: 1,
    backgroundColor: '#141413',
  },
  adminLoadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#141413',
  },
  adminLoadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D6D3D1',
  },
  returnAdminPill: {
    position: 'absolute',
    right: 16,
    zIndex: 35,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADII.pill,
    backgroundColor: '#141413',
    borderWidth: 1,
    borderColor: 'rgba(253,186,116,0.45)',
    ...SHADOWS.floating,
  },
  returnAdminPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default App;
