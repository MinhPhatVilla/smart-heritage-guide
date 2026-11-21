import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
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
  Check,
  Compass,
  LocateFixed,
  Map as MapIcon,
  MessageSquareText,
  Navigation,
  Route,
  Search,
  Sparkles,
  Trophy,
  User,
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
  formatDistance,
  getNearbySitesWithMetrics,
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
  watchLocation,
} from './src/services/locationService';
import { speechService } from './src/services/speechService';
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

type MainTab = 'explore' | 'map' | 'journey';

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
  { id: 'all', label: `Tất cả (${HERITAGE_SITES.length})` },
  { id: 'monument', label: 'Di tích & Biểu tượng' },
  { id: 'museum', label: 'Bảo tàng' },
  { id: 'temple', label: 'Đền Chùa & Hội quán' },
  { id: 'imperial', label: 'Dinh thự & Lăng miếu' },
  { id: 'ancient_town', label: 'Chợ cổ & Sinh quyển' },
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

  // Default: District 1 Center, Ho Chi Minh City (all 20 heritage sites)
  const [userLocation, setUserLocation] = useState<[number, number]>([
    10.7775, 106.699,
  ]);
  const [activeCityId, setActiveCityId] = useState<string>('ALL_HCM');
  const [gpsStatus, setGpsStatus] = useState<string>(
    'Trung tâm Quận 1 · TP.HCM'
  );
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);

  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguage>('vi');
  const [searchRadiusMeters, setSearchRadiusMeters] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | HeritageCategory
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<MainTab>('explore');

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

  const [visitedRecords, setVisitedRecords] = useState<VisitedSiteRecord[]>(
    INITIAL_SAMPLE_JOURNEYS
  );

  // Backend Auth & Smart AI modals state (Offline-first Guest by default)
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

  const walkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsWatchRef = useRef<LocationWatchHandle | null>(null);
  const lastAutoTriggeredSiteIdRef = useRef<string | null>(null);
  const usedSimulatedWalkRef = useRef<boolean>(false);

  // Load persisted journeys & optional auth session from AsyncStorage on mount
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

  // Clean up walk simulation, GPS watch, and TTS on unmount
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

  // Active walking navigation timer
  useEffect(() => {
    if (!activeRoute) return;
    const interval = setInterval(() => {
      setActiveWalkSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRoute]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 3800);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

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

  // Compute distance & walking time metrics for all sites
  const rawNearbySites = useMemo(
    () =>
      getNearbySitesWithMetrics(
        HERITAGE_SITES,
        userLocation[0],
        userLocation[1],
        searchRadiusMeters > 0 ? searchRadiusMeters : undefined
      ),
    [userLocation, searchRadiusMeters]
  );

  // Full unfiltered list (for modal distance lookups regardless of radius filter)
  const allSitesWithMetrics = useMemo(
    () =>
      getNearbySitesWithMetrics(
        HERITAGE_SITES,
        userLocation[0],
        userLocation[1]
      ),
    [userLocation]
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

  // Automatic proximity < 150m audio guide trigger
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

  // Real GPS detection + live watch via expo-location
  const handleDetectRealGps = useCallback(async () => {
    stopWalkSimulation();
    stopGpsWatch();
    setIsLocatingGps(true);
    setGpsStatus('Đang xác định GPS…');

    const result = await getCurrentLocation({ timeoutMs: 8000 });
    setIsLocatingGps(false);

    if (result.ok && result.tuple) {
      const [lat, lng] = result.tuple;
      setUserLocation([lat, lng]);
      setSearchRadiusMeters(0);
      setActiveCityId('GPS');
      setGpsStatus(formatCoordinatesLabel(lat, lng));
      setToastMessage('Đã cập nhật vị trí GPS thực tế của bạn.');
      triggerHaptic('light');

      // Start background foreground watch for live walking updates
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
      setGpsStatus('Tâm điểm Quận 1 · TP.HCM');
      setToastMessage(
        result.error ||
          'Không lấy được GPS thực tế. Hãy chọn khu vực TP.HCM hoặc chạm bản đồ.'
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

    const coords = activeRoute.coordinates;
    let stepIdx = 0;
    const stepDurationIncrement = Math.max(
      25,
      Math.round(
        activeRoute.estimatedDurationSeconds / Math.max(1, coords.length)
      )
    );

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
          const targetSite = HERITAGE_SITES.find(
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
      setUserLocation(nextCoord);
      setActiveWalkSeconds((prev) => prev + stepDurationIncrement);
    }, 320);
  }, [activeRoute, autoAudioGuide, isSimulatingWalk, stopGpsWatch]);

  const handleCancelRoute = useCallback(() => {
    stopWalkSimulation();
    setActiveRoute(null);
    setActiveWalkSeconds(0);
  }, [stopWalkSimulation]);

  const handleFinishWalkAndCheckIn = useCallback(() => {
    if (!activeRoute) return;
    stopWalkSimulation();
    triggerHaptic('success');
    const targetSite = HERITAGE_SITES.find(
      (s) => s.id === activeRoute.targetId
    );
    if (targetSite) {
      setPhotoCaptureSite(targetSite);
    } else {
      setActiveRoute(null);
      setToastMessage(`Hoàn thành hành trình tới ${activeRoute.targetName}!`);
    }
  }, [activeRoute, stopWalkSimulation]);

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

      // 1. Lưu cục bộ AsyncStorage trước (Offline-first 100%)
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

      // 2. Nếu đã đăng nhập, đồng bộ lên Backend (Anti-Fake + Badges + Storage)
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

  const handleAuthSuccess = useCallback((profile: UserProfile) => {
    setAuthState({
      isAuthenticated: true,
      isGuest: false,
      profile,
    });
    setAuthModalVisible(false);
    setToastMessage(`Xin chào ${profile.display_name}! Đã bật đồng bộ Cloud.`);
    triggerHaptic('success');
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutAccount();
    setAuthState({
      isAuthenticated: false,
      isGuest: true,
      profile: null,
    });
    setToastMessage('Đã chuyển về chế độ Khách (Offline).');
  }, []);

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

  const handleOpenRecognizedSite = useCallback((siteId: string) => {
    const matched = HERITAGE_SITES.find((s) => s.id === siteId);
    if (!matched) return;
    setQuickAudioSite(matched);
    setSelectedSite(matched);
    triggerHaptic('success');
  }, []);

  const handleCloseQuickAudio = useCallback(() => {
    speechService.stop();
    setQuickAudioSite(null);
  }, []);

  const handleCycleRadius = useCallback(() => {
    const idx = RADIUS_OPTIONS.findIndex((o) => o.value === searchRadiusMeters);
    const next = RADIUS_OPTIONS[(idx + 1) % RADIUS_OPTIONS.length];
    setSearchRadiusMeters(next.value);
    triggerHaptic('selection');
  }, [searchRadiusMeters]);

  const currentRadiusLabel =
    RADIUS_OPTIONS.find((o) => o.value === searchRadiusMeters)?.label ||
    `${Math.round(searchRadiusMeters / 1000)} km`;

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
        onOpenPhotoCapture={setPhotoCaptureSite}
      />
    ),
    [
      activeRoute?.targetId,
      handleStartNavigationToSite,
      selectedLanguage,
      visitedMap,
    ]
  );

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
    closestSiteItem.distanceMeters <= 350;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Compact Mobile Top Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 8) + 4 },
        ]}
      >
        <View style={styles.headerTopRow}>
          {/* Brand + Live GPS Pill */}
          <View style={styles.brandGroup}>
            <View style={styles.shgBadge}>
              <Text style={styles.shgBadgeText}>SHG</Text>
            </View>
            <View style={styles.brandTextCol}>
              <Text style={styles.brandTitle} numberOfLines={1}>
                Smart Heritage Guide
              </Text>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleDetectRealGps}
                style={styles.gpsPillInline}
              >
                <View
                  style={[
                    styles.gpsDot,
                    isLocatingGps && styles.gpsDotLocating,
                  ]}
                />
                <Text style={styles.gpsPillText} numberOfLines={1}>
                  {gpsStatus}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Compact Language Switcher + Account/Guest Badge */}
          <View style={styles.headerRightGroup}>
            <View style={styles.langSwitcher}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const active = selectedLanguage === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    activeOpacity={0.75}
                    onPress={() => {
                      setSelectedLanguage(lang.code);
                      triggerHaptic('selection');
                    }}
                    style={[styles.langBtn, active && styles.langBtnActive]}
                    accessibilityLabel={lang.nativeLabel}
                  >
                    <Text
                      style={[
                        styles.langBtnText,
                        active && styles.langBtnTextActive,
                      ]}
                    >
                      {lang.code.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAuthModalVisible(true)}
              style={[
                styles.accountPill,
                authState.isAuthenticated && styles.accountPillSignedIn,
              ]}
              accessibilityLabel="Tài khoản và đồng bộ Cloud"
            >
              <User
                size={12}
                color={
                  authState.isAuthenticated ? COLORS.visited : COLORS.inkSecondary
                }
              />
              <Text
                style={[
                  styles.accountPillText,
                  authState.isAuthenticated && styles.accountPillTextSignedIn,
                ]}
                numberOfLines={1}
              >
                {authState.isAuthenticated && authState.profile
                  ? authState.profile.display_name.split(' ')[0]
                  : 'Khách'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content Area (3 Tabs) */}
      <View style={styles.mainBody}>
        {activeTab === 'explore' && (
          <View style={styles.tabContainer}>
            {/* Filter Controls Panel (kept outside FlatList to prevent keyboard dismissal) */}
            <View style={styles.controlsPanel}>
              {/* Area / District Presets + Real GPS */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleDetectRealGps}
                  style={[
                    styles.areaChip,
                    activeCityId === 'GPS' && styles.areaChipActive,
                  ]}
                >
                  <LocateFixed
                    size={13}
                    color={
                      activeCityId === 'GPS' ? COLORS.white : COLORS.gpsBlue
                    }
                  />
                  <Text
                    style={[
                      styles.areaChipText,
                      activeCityId === 'GPS' && styles.areaChipTextActive,
                    ]}
                  >
                    GPS của tôi
                  </Text>
                </TouchableOpacity>

                {CITY_PRESETS.map((city) => {
                  const active = activeCityId === city.id;
                  return (
                    <TouchableOpacity
                      key={city.id}
                      activeOpacity={0.8}
                      onPress={() => handleSelectCityPreset(city.id)}
                      style={[
                        styles.areaChip,
                        active && styles.areaChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.areaChipText,
                          active && styles.areaChipTextActive,
                        ]}
                      >
                        {city.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Category Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
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
                        styles.categoryChip,
                        active && styles.categoryChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          active && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Search Input + Radius Picker */}
              <View style={styles.searchRadiusRow}>
                <View style={styles.searchBox}>
                  <Search size={14} color={COLORS.inkMuted} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Tìm di tích, quận huyện, món ăn…"
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
                      <X size={14} color={COLORS.inkMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCycleRadius}
                  style={styles.radiusBtn}
                  accessibilityLabel="Đổi bán kính tìm kiếm"
                >
                  <Text style={styles.radiusBtnText}>{currentRadiusLabel}</Text>
                </TouchableOpacity>
              </View>

              {/* Smart AI Quick Actions: Tour AI (2-Opt) & Hỏi AI (RAG) */}
              <View style={styles.aiQuickRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setSmartTourVisible(true);
                    triggerHaptic('light');
                  }}
                  style={styles.aiTourBtn}
                >
                  <Route size={14} color={COLORS.white} />
                  <Text style={styles.aiTourBtnText}>Tour AI (2-Opt)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleOpenGlobalAiChat}
                  style={styles.aiChatBtn}
                >
                  <MessageSquareText size={14} color={COLORS.accent} />
                  <Text style={styles.aiChatBtnText}>Hỏi AI Di sản</Text>
                </TouchableOpacity>
              </View>

              {/* Result Count + Auto-Audio Proximity Toggle */}
              <View style={styles.metaFooterRow}>
                <Text style={styles.countText}>
                  Hiển thị{' '}
                  <Text style={styles.countStrong}>
                    {nearbySitesWithMetrics.length}
                  </Text>{' '}
                  di tích TP.HCM
                </Text>

                <View style={styles.autoAudioRow}>
                  <Text style={styles.autoAudioLabel}>
                    Tự đọc (&lt;150m)
                  </Text>
                  <Switch
                    value={autoAudioGuide}
                    onValueChange={setAutoAudioGuide}
                    trackColor={{
                      false: COLORS.borderStrong,
                      true: COLORS.ink,
                    }}
                    thumbColor={COLORS.white}
                    style={styles.compactSwitch}
                  />
                </View>
              </View>
            </View>

            {/* Quick Audio Player (Triggered by Proximity < 150m or User Tap) */}
            {quickAudioSite && (
              <View style={styles.quickAudioCard}>
                <View style={styles.quickAudioHeader}>
                  <View style={styles.quickAudioTitleWrap}>
                    <Sparkles size={13} color={COLORS.accent} />
                    <Text style={styles.quickAudioEyebrow}>
                      ĐANG PHÁT THUYẾT MINH TỰ ĐỘNG
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

            {/* Proximity < 150m (or <= 350m nearby) Alert Banner */}
            {isNearbyBannerVisible && closestSiteItem && (
              <View
                style={[
                  styles.proximityBanner,
                  isWithinProximity && styles.proximityBannerHot,
                ]}
              >
                <View style={styles.proximityTextCol}>
                  <Text style={styles.proximityLabel}>
                    {isWithinProximity
                      ? `Trong vùng thuyết minh < 150m · Cách bạn ${formatDistance(
                          closestSiteItem.distanceMeters
                        )}`
                      : `Rất gần bạn · Cách ${formatDistance(
                          closestSiteItem.distanceMeters
                        )}`}
                  </Text>
                  <Text style={styles.proximitySiteName} numberOfLines={1}>
                    {(
                      closestSiteItem.site.translations[selectedLanguage] ||
                      closestSiteItem.site.translations.vi
                    ).name}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setQuickAudioSite(closestSiteItem.site)}
                  style={styles.proximityBtn}
                >
                  <Volume2 size={14} color={COLORS.white} />
                  <Text style={styles.proximityBtnText}>Nghe ngay</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Heritage Sites FlatList */}
            <FlatList
              data={nearbySitesWithMetrics}
              keyExtractor={(item) => item.site.id}
              renderItem={renderSiteItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>
                    Không tìm thấy địa điểm phù hợp trong phạm vi lọc
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Chọn "Toàn TP.HCM" để xem đầy đủ {HERITAGE_SITES.length} di
                    tích lịch sử và điểm tham quan.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setSearchRadiusMeters(0);
                      setSelectedCategory('all');
                      setSearchQuery('');
                      setActiveCityId('ALL_HCM');
                    }}
                    style={styles.emptyResetBtn}
                  >
                    <Text style={styles.emptyResetBtnText}>
                      Hiển thị toàn bộ {HERITAGE_SITES.length} di tích TP.HCM
                    </Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        )}

        {activeTab === 'map' && (
          <View style={styles.mapTabContainer}>
            {/* Floating Quick Audio overlay when triggered during map walk */}
            {quickAudioSite && (
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
              userLocation={userLocation}
              sites={mapSites}
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
              onCancelRoute={handleCancelRoute}
              onDetectRealGps={handleDetectRealGps}
              onMoveUserLocation={(lat, lng) => {
                stopWalkSimulation();
                stopGpsWatch();
                setUserLocation([lat, lng]);
                setActiveCityId('CUSTOM');
                setGpsStatus(formatCoordinatesLabel(lat, lng));
              }}
            />
          </View>
        )}

        {activeTab === 'journey' && (
          <View style={styles.tabContainer}>
            <JourneyAndRankingView
              records={visitedRecords}
              allSites={HERITAGE_SITES}
              userLocation={userLocation}
              selectedLanguage={selectedLanguage}
              authState={authState}
              isSyncing={isSyncingCloud}
              onSelectSiteById={(siteId) => {
                const target = HERITAGE_SITES.find((s) => s.id === siteId);
                if (target) setSelectedSite(target);
              }}
              onOpenCaptureForSite={(siteId) => {
                const target = HERITAGE_SITES.find((s) => s.id === siteId);
                if (target) setPhotoCaptureSite(target);
              }}
              onOpenAuthModal={() => setAuthModalVisible(true)}
              onSyncNow={handleSyncOfflineJourneys}
            />
          </View>
        )}
      </View>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <View
          pointerEvents="none"
          style={[
            styles.toastWrap,
            { bottom: Math.max(insets.bottom, 8) + 68 },
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

      {/* Bottom Tab Bar (3 Clear Native Tabs) */}
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
          <View
            style={[
              styles.tabIconWrap,
              activeTab === 'explore' && styles.tabIconWrapActive,
            ]}
          >
            <Compass
              size={20}
              color={
                activeTab === 'explore' ? COLORS.ink : COLORS.inkMuted
              }
            />
          </View>
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
          <View
            style={[
              styles.tabIconWrap,
              activeTab === 'map' && styles.tabIconWrapActive,
            ]}
          >
            {activeRoute ? (
              <Navigation
                size={20}
                color={
                  activeTab === 'map' ? COLORS.accent : COLORS.accent
                }
              />
            ) : (
              <MapIcon
                size={20}
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
          <View
            style={[
              styles.tabIconWrap,
              activeTab === 'journey' && styles.tabIconWrapActive,
            ]}
          >
            <Trophy
              size={20}
              color={
                activeTab === 'journey' ? COLORS.ink : COLORS.inkMuted
              }
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
      </View>

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
        allSites={HERITAGE_SITES}
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
          const target = HERITAGE_SITES.find((s) => s.id === siteId);
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm + 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    minWidth: 0,
  },
  shgBadge: {
    width: 34,
    height: 34,
    borderRadius: RADII.md,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shgBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  brandTextCol: {
    flex: 1,
    minWidth: 0,
  },
  brandTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  gpsPillInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
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
  gpsPillText: {
    fontSize: 11,
    color: COLORS.inkSecondary,
    flex: 1,
  },
  langSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: 2,
    gap: 1,
  },
  langBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: RADII.sm,
  },
  langBtnActive: {
    backgroundColor: COLORS.ink,
  },
  langBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  langBtnTextActive: {
    color: COLORS.white,
  },
  mainBody: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  mapTabContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: COLORS.bg,
  },
  controlsPanel: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: SPACING.sm + 2,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  chipRow: {
    paddingHorizontal: SPACING.lg,
    gap: 6,
    alignItems: 'center',
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  areaChipActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  areaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  areaChipTextActive: {
    color: COLORS.white,
  },
  categoryRow: {
    paddingHorizontal: SPACING.lg,
    gap: 6,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.borderStrong,
  },
  categoryChipText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: COLORS.inkMuted,
  },
  categoryChipTextActive: {
    color: COLORS.ink,
    fontWeight: '700',
  },
  searchRadiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: 10,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.ink,
    paddingVertical: 0,
  },
  radiusBtn: {
    height: 36,
    paddingHorizontal: 11,
    borderRadius: RADII.md,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.ink,
  },
  metaFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 2,
  },
  countText: {
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  countStrong: {
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  autoAudioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autoAudioLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: COLORS.inkSecondary,
  },
  compactSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
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
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  proximityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  proximityBannerHot: {
    backgroundColor: COLORS.amberBg,
    borderBottomColor: COLORS.amberBorder,
  },
  proximityTextCol: {
    flex: 1,
    minWidth: 0,
  },
  proximityLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  proximitySiteName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 2,
  },
  proximityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.md,
  },
  proximityBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  emptyBox: {
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: COLORS.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyResetBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADII.md,
  },
  emptyResetBtnText: {
    color: COLORS.white,
    fontSize: 12.5,
    fontWeight: '600',
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
    borderRadius: RADII.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 420,
    ...SHADOWS.floating,
  },
  toastText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    ...SHADOWS.bar,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIconWrap: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  tabIconWrapActive: {
    backgroundColor: COLORS.surfaceMuted,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.inkMuted,
  },
  tabLabelActive: {
    color: COLORS.ink,
    fontWeight: '700',
  },
  routeActiveDot: {
    position: 'absolute',
    top: 2,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  journeyBadge: {
    position: 'absolute',
    top: 0,
    right: 6,
    minWidth: 17,
    height: 17,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.visited,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  journeyBadgeText: {
    color: COLORS.white,
    fontSize: 9.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: 82,
  },
  accountPillSignedIn: {
    backgroundColor: COLORS.visitedBg,
    borderColor: COLORS.visitedBorder,
  },
  accountPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.inkSecondary,
    flexShrink: 1,
  },
  accountPillTextSignedIn: {
    color: COLORS.visited,
  },
  aiQuickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  aiTourBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingVertical: 8,
    borderRadius: RADII.md,
  },
  aiTourBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  aiChatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingVertical: 8,
    borderRadius: RADII.md,
  },
  aiChatBtnText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default App;
