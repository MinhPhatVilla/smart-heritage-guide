import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  ArrowUpDown,
  ArrowUpRight,
  Award,
  BookOpen,
  Calendar,
  Camera,
  Clock,
  Footprints,
  Images,
  Lock,
  LogIn,
  MapPin,
  ShieldCheck,
  Star,
  Trophy,
  Users,
  WifiOff,
  X,
} from 'lucide-react-native';
import {
  CapturedPhoto,
  HeritageSite,
  SupportedLanguage,
  VisitedSiteRecord,
} from '../types/heritage';
import { AuthSessionState } from '../services/authService';
import {
  BadgeOut,
  LeaderboardEntryOut,
  LeaderboardSortBy,
  MyLeaderboardResponse,
  OFFLINE_FALLBACK_BADGES,
  fetchAllBadges,
  fetchGlobalLeaderboard,
  fetchMyLeaderboard,
} from '../services/aiService';
import {
  formatDistance,
  formatWalkingDuration,
  getNearbySitesWithMetrics,
  rankVisitedSitesByWalkingTime,
} from '../utils/geoUtils';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export type JourneyViewMode = 'journey' | 'ranking';

export interface JourneyAndRankingViewProps {
  /** 'journey' = Nhật ký & Album cá nhân; 'ranking' = Xếp hạng Cộng đồng, Huy hiệu & Thành tích */
  viewMode: JourneyViewMode;
  records: VisitedSiteRecord[];
  allSites: HeritageSite[];
  userLocation?: [number, number];
  selectedLanguage?: SupportedLanguage;
  authState?: AuthSessionState;
  isSyncing?: boolean;
  onSelectSiteById: (siteId: string) => void;
  onOpenCaptureForSite: (siteId: string) => void;
  onOpenAuthModal?: () => void;
}

interface AlbumPhotoItem {
  photo: CapturedPhoto;
  city: string;
  walkingDurationSeconds: number;
}

const DEFAULT_HCMC_CENTER: [number, number] = [10.7775, 106.699];

function formatClockTime(d: Date | null): string {
  if (!d) return '--:--';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export const JourneyAndRankingView: React.FC<JourneyAndRankingViewProps> = ({
  viewMode,
  records,
  allSites,
  userLocation = DEFAULT_HCMC_CENTER,
  selectedLanguage = 'vi',
  authState,
  isSyncing = false,
  onSelectSiteById,
  onOpenCaptureForSite,
  onOpenAuthModal,
}) => {
  // Personal Journey sub-tab (ONLY 2 clean tabs: Nhật ký | Album ảnh)
  const [journeyTab, setJourneyTab] = useState<'log' | 'album'>('log');
  // Ranking sub-tab (ONLY 2 clean tabs: Cộng đồng & Huy hiệu | Thành tích của tôi)
  const [rankingTab, setRankingTab] = useState<'community' | 'personal'>(
    'community'
  );
  const [sortMode, setSortMode] = useState<'longest_walk' | 'shortest_walk'>(
    'longest_walk'
  );
  const [previewPhoto, setPreviewPhoto] = useState<CapturedPhoto | null>(null);

  // Community Leaderboard & Badges (100% auto-updating!)
  const [globalSortBy, setGlobalSortBy] =
    useState<LeaderboardSortBy>('walking_time');
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntryOut[]>([]);
  const [totalCommunityUsers, setTotalCommunityUsers] = useState<number>(0);
  const [badgesList, setBadgesList] = useState<BadgeOut[]>(
    OFFLINE_FALLBACK_BADGES
  );
  const [myBoard, setMyBoard] = useState<MyLeaderboardResponse | null>(null);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState<boolean>(false);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [lastAutoUpdatedAt, setLastAutoUpdatedAt] = useState<Date | null>(null);

  const loadCommunityData = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoadingCommunity(true);
      setCommunityError(null);
      const [globalRes, allBadgesRes, myRes] = await Promise.all([
        fetchGlobalLeaderboard(globalSortBy),
        fetchAllBadges(),
        authState?.isAuthenticated
          ? fetchMyLeaderboard()
          : Promise.resolve(null),
      ]);

      setIsLoadingCommunity(false);
      setLastAutoUpdatedAt(new Date());

      if (globalRes.ok) {
        setGlobalEntries(globalRes.data.entries);
        setTotalCommunityUsers(globalRes.data.total_users);
      } else {
        setCommunityError(globalRes.error);
      }

      if (myRes && myRes.ok) {
        setMyBoard(myRes.data);
        const merged = [
          ...myRes.data.unlocked_badges,
          ...myRes.data.upcoming_badges,
        ];
        if (merged.length > 0) {
          setBadgesList(merged);
        }
      } else {
        setMyBoard(null);
        if (allBadgesRes.ok && allBadgesRes.data.length > 0) {
          setBadgesList(allBadgesRes.data);
        } else {
          setBadgesList(OFFLINE_FALLBACK_BADGES);
        }
      }
    },
    [authState?.isAuthenticated, globalSortBy]
  );

  // Tự động tải & cập nhật định kỳ mỗi 60s + khi dữ liệu hành trình đổi + khi quay lại ứng dụng
  useEffect(() => {
    if (viewMode !== 'ranking') return;
    void loadCommunityData(false);

    const interval = setInterval(() => {
      void loadCommunityData(true);
    }, 60 * 1000);

    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void loadCommunityData(true);
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
            void loadCommunityData(true);
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
  }, [viewMode, records.length, loadCommunityData]);

  // Hỗ trợ phím Escape trên Web để đóng xem ảnh phóng to
  useEffect(() => {
    if (!previewPhoto || Platform.OS !== 'web') return;
    const win = globalThis as unknown as {
      addEventListener?: (ev: string, fn: (e: { key?: string }) => void) => void;
      removeEventListener?: (ev: string, fn: (e: { key?: string }) => void) => void;
    };
    if (!win.addEventListener || !win.removeEventListener) return;
    const onKeyDown = (e: { key?: string }) => {
      if (e.key === 'Escape') setPreviewPhoto(null);
    };
    win.addEventListener('keydown', onKeyDown);
    return () => win.removeEventListener?.('keydown', onKeyDown);
  }, [previewPhoto]);

  const renderVerificationPill = (
    status?: VisitedSiteRecord['verificationStatus'],
    score?: number
  ) => {
    if (!status) return null;
    if (status === 'verified') {
      return (
        <View style={styles.verifyPillVerified}>
          <ShieldCheck size={11} color={COLORS.visited} />
          <Text style={styles.verifyTextVerified}>
            Xác thực GPS{score ? ` · ${Math.round(score)}đ` : ''}
          </Text>
        </View>
      );
    }
    if (status === 'simulated') {
      return (
        <View style={styles.verifyPillSim}>
          <Clock size={11} color={COLORS.amber} />
          <Text style={styles.verifyTextSim}>Mô phỏng</Text>
        </View>
      );
    }
    return (
      <View style={styles.verifyPillFlagged}>
        <AlertTriangle size={11} color={COLORS.accent} />
        <Text style={styles.verifyTextFlagged}>Kiểm tra GPS</Text>
      </View>
    );
  };

  const rankedActualList = useMemo(
    () => rankVisitedSitesByWalkingTime(records, sortMode),
    [records, sortMode]
  );

  const chronologicalRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()
      ),
    [records]
  );

  const albumPhotos = useMemo<AlbumPhotoItem[]>(() => {
    const items: AlbumPhotoItem[] = [];
    records.forEach((rec) => {
      rec.photos.forEach((photo) => {
        items.push({
          photo,
          city: rec.city,
          walkingDurationSeconds:
            photo.walkingDurationSecondsAtCapture || rec.walkingDurationSeconds,
        });
      });
    });
    return items.sort(
      (a, b) =>
        new Date(b.photo.takenAt).getTime() -
        new Date(a.photo.takenAt).getTime()
    );
  }, [records]);

  // Chỉ gợi ý 5 điểm chưa đi gần vị trí người dùng nhất (tránh danh sách 90+ điểm gây rối!)
  const nearestUnvisitedSites = useMemo(() => {
    const visitedIds = new Set(records.map((r) => r.siteId));
    const nearbyAll = getNearbySitesWithMetrics(
      allSites,
      userLocation[0],
      userLocation[1]
    );
    return nearbyAll
      .filter((item) => !visitedIds.has(item.site.id))
      .slice(0, 5);
  }, [allSites, records, userLocation]);

  const totalWalkingSeconds = useMemo(
    () => records.reduce((sum, r) => sum + r.walkingDurationSeconds, 0),
    [records]
  );
  const totalDistanceMeters = useMemo(
    () => records.reduce((sum, r) => sum + r.walkingDistanceMeters, 0),
    [records]
  );
  const totalPhotos = albumPhotos.length;
  const completionPct =
    allSites.length > 0
      ? Math.min(100, Math.round((records.length / allSites.length) * 100))
      : 0;

  const maxActualDuration = Math.max(
    1,
    ...records.map((r) => r.walkingDurationSeconds)
  );

  const screenWidth = Dimensions.get('window').width;
  const albumCardWidth = Math.max(
    140,
    (screenWidth - SPACING.lg * 2 - SPACING.sm) / 2
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* =================================================================== */}
        {/* MODE 1: HÀNH TRÌNH CÁ NHÂN (NHẬT KÝ & ALBUM)                        */}
        {/* =================================================================== */}
        {viewMode === 'journey' && (
          <>
            {/* Clean Personal Passport Summary */}
            <View style={styles.passportCard}>
              <View style={styles.passportTop}>
                <View>
                  <Text style={styles.pageTitle}>Hộ chiếu Di sản</Text>
                  <Text style={styles.pageSubtitle}>
                    Tự động lưu nhật ký & kỷ niệm của bạn
                  </Text>
                </View>
                <View style={styles.autoLiveChip}>
                  <View style={styles.autoLiveDot} />
                  <Text style={styles.autoLiveText}>
                    {isSyncing
                      ? 'Đang đồng bộ…'
                      : authState?.isAuthenticated
                        ? 'Cloud tự động'
                        : 'Lưu cục bộ'}
                  </Text>
                </View>
              </View>

              <View style={styles.kpiRow}>
                <View style={[styles.kpiCell, styles.kpiBorder]}>
                  <Text style={styles.kpiValue}>
                    {records.length}
                    <Text style={styles.kpiSub}>/{allSites.length}</Text>
                  </Text>
                  <Text style={styles.kpiLabel}>Đã check-in</Text>
                </View>
                <View style={[styles.kpiCell, styles.kpiBorder]}>
                  <Text style={styles.kpiValue} numberOfLines={1}>
                    {formatWalkingDuration(totalWalkingSeconds)}
                  </Text>
                  <Text style={styles.kpiLabel}>
                    {formatDistance(totalDistanceMeters)}
                  </Text>
                </View>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiValue}>{totalPhotos}</Text>
                  <Text style={styles.kpiLabel}>Ảnh kỷ niệm</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${Math.max(4, completionPct)}%` }]}
                />
              </View>
            </View>

            {/* Clean 2-Tab Switcher: Nhật ký | Album ảnh */}
            <View style={styles.twoTabBar}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => setJourneyTab('log')}
                style={[
                  styles.twoTabBtn,
                  journeyTab === 'log' && styles.twoTabBtnActive,
                ]}
              >
                <BookOpen
                  size={14}
                  color={journeyTab === 'log' ? COLORS.white : COLORS.inkSecondary}
                />
                <Text
                  style={[
                    styles.twoTabText,
                    journeyTab === 'log' && styles.twoTabTextActive,
                  ]}
                >
                  Nhật ký ({chronologicalRecords.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => setJourneyTab('album')}
                style={[
                  styles.twoTabBtn,
                  journeyTab === 'album' && styles.twoTabBtnActive,
                ]}
              >
                <Images
                  size={14}
                  color={journeyTab === 'album' ? COLORS.white : COLORS.inkSecondary}
                />
                <Text
                  style={[
                    styles.twoTabText,
                    journeyTab === 'album' && styles.twoTabTextActive,
                  ]}
                >
                  Album ảnh ({albumPhotos.length})
                </Text>
              </TouchableOpacity>
            </View>

            {journeyTab === 'log' && (
              <View style={styles.section}>
                {chronologicalRecords.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <BookOpen size={26} color={COLORS.inkMuted} />
                    <Text style={styles.emptyTitle}>Nhật ký đang trống</Text>
                    <Text style={styles.emptyDesc}>
                      Check-in tại bất kỳ điểm di tích nào để tự động lưu lại
                      quãng đường đi bộ, cảm nhận và hình ảnh.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.listGap}>
                    {chronologicalRecords.map((record) => (
                      <View key={record.id} style={styles.logCard}>
                        <View style={styles.logHeaderRow}>
                          <Image
                            source={{ uri: record.coverImage }}
                            style={styles.logThumb}
                          />
                          <View style={styles.logInfo}>
                            <Text style={styles.logCity} numberOfLines={1}>
                              {record.city}
                            </Text>
                            <TouchableOpacity
                              onPress={() => onSelectSiteById(record.siteId)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.logTitle} numberOfLines={2}>
                                {record.siteName}
                              </Text>
                            </TouchableOpacity>
                            <View style={styles.logMetaRow}>
                              <Calendar size={11} color={COLORS.inkMuted} />
                              <Text style={styles.metricMuted}>
                                {new Date(record.visitedAt).toLocaleDateString(
                                  'vi-VN'
                                )}
                              </Text>
                              <Text style={styles.dotSep}>·</Text>
                              <Star
                                size={11}
                                color={COLORS.amberStar}
                                fill={COLORS.amberStar}
                              />
                              <Text style={styles.metricStrong}>
                                {record.userRating.toFixed(1)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.logStatsStrip}>
                          <View style={styles.logStatChip}>
                            <Footprints size={11.5} color={COLORS.accent} />
                            <Text style={styles.logStatText}>
                              {formatWalkingDuration(record.walkingDurationSeconds)} ·{' '}
                              {formatDistance(record.walkingDistanceMeters)}
                            </Text>
                          </View>
                          {renderVerificationPill(
                            record.verificationStatus,
                            record.verificationScore
                          )}
                        </View>

                        {record.userNote ? (
                          <Text style={styles.logNote} numberOfLines={3}>
                            “{record.userNote}”
                          </Text>
                        ) : null}

                        {record.photos.length > 0 && (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.logPhotosRow}
                          >
                            {record.photos.map((photo) => (
                              <TouchableOpacity
                                key={photo.id}
                                onPress={() => setPreviewPhoto(photo)}
                                style={styles.logPhotoItem}
                                activeOpacity={0.82}
                              >
                                <Image
                                  source={{ uri: photo.dataUrl }}
                                  style={styles.logPhotoThumb}
                                />
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        )}

                        <View style={styles.cardActionRow}>
                          <TouchableOpacity
                            onPress={() => onOpenCaptureForSite(record.siteId)}
                            style={styles.secondaryBtn}
                            activeOpacity={0.78}
                          >
                            <Camera size={13} color={COLORS.ink} />
                            <Text style={styles.secondaryBtnText}>
                              Thêm ảnh ({record.photos.length})
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => onSelectSiteById(record.siteId)}
                            style={styles.ghostBtn}
                            activeOpacity={0.78}
                          >
                            <Text style={styles.ghostBtnText}>Chi tiết</Text>
                            <ArrowUpRight size={13} color={COLORS.ink} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Compact Top 5 Nearest Unvisited Suggestions */}
                {nearestUnvisitedSites.length > 0 && (
                  <View style={styles.unvisitedSection}>
                    <Text style={styles.sectionHeading}>
                      Gợi ý điểm chưa check-in gần bạn
                    </Text>
                    <View style={styles.listGap}>
                      {nearestUnvisitedSites.map(
                        ({ site, distanceMeters, estimatedWalkingSeconds }) => {
                          const local =
                            site.translations?.[selectedLanguage] ||
                            site.translations?.vi;
                          return (
                            <View key={site.id} style={styles.unvisitedCard}>
                              <Image
                                source={{ uri: site.coverImage }}
                                style={styles.unvisitedThumb}
                              />
                              <TouchableOpacity
                                onPress={() => onSelectSiteById(site.id)}
                                style={styles.unvisitedInfo}
                                activeOpacity={0.75}
                              >
                                <Text
                                  style={styles.unvisitedTitle}
                                  numberOfLines={1}
                                >
                                  {local?.name || site.id}
                                </Text>
                                <Text style={styles.metricMuted} numberOfLines={1}>
                                  {formatDistance(distanceMeters)} · ~
                                  {formatWalkingDuration(estimatedWalkingSeconds)} ·{' '}
                                  {site.city}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => onOpenCaptureForSite(site.id)}
                                style={styles.checkinChipBtn}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.checkinChipText}>
                                  Check-in
                                </Text>
                              </TouchableOpacity>
                            </View>
                          );
                        }
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {journeyTab === 'album' && (
              <View style={styles.section}>
                {albumPhotos.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Images size={26} color={COLORS.inkMuted} />
                    <Text style={styles.emptyTitle}>Chưa có ảnh kỷ niệm</Text>
                    <Text style={styles.emptyDesc}>
                      Mở Camera khi check-in tại di tích để tự động lưu vào bộ
                      sưu tập hành trình.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.albumGrid}>
                    {albumPhotos.map(({ photo, walkingDurationSeconds }) => (
                      <TouchableOpacity
                        key={photo.id}
                        onPress={() => setPreviewPhoto(photo)}
                        style={[styles.albumCard, { width: albumCardWidth }]}
                        activeOpacity={0.85}
                      >
                        <View style={styles.albumImageWrap}>
                          <Image
                            source={{ uri: photo.dataUrl }}
                            style={styles.albumImage}
                            resizeMode="cover"
                          />
                          <View style={styles.albumDurationBadge}>
                            <Footprints size={10} color={COLORS.white} />
                            <Text style={styles.albumDurationText}>
                              {formatWalkingDuration(walkingDurationSeconds)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.albumCardBody}>
                          <Text style={styles.albumSiteName} numberOfLines={1}>
                            {photo.siteName}
                          </Text>
                          <Text style={styles.albumCaption} numberOfLines={2}>
                            {photo.caption}
                          </Text>
                          <Text style={styles.albumDate}>
                            {new Date(photo.takenAt).toLocaleDateString('vi-VN')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* =================================================================== */}
        {/* MODE 2: XẾP HẠNG, CỘNG ĐỒNG & HUY HIỆU (TAB RIÊNG DƯỚI TASKBAR)     */}
        {/* =================================================================== */}
        {viewMode === 'ranking' && (
          <>
            <View style={styles.rankingHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pageTitle}>Xếp hạng & Huy hiệu</Text>
                <Text style={styles.pageSubtitle}>
                  Bảng xếp hạng cộng đồng tự động cập nhật
                </Text>
              </View>
              <View style={styles.autoLiveChip}>
                <View style={styles.autoLiveDot} />
                <Text style={styles.autoLiveText}>
                  {isLoadingCommunity
                    ? 'Đang cập nhật…'
                    : `Tự động · ${formatClockTime(lastAutoUpdatedAt)}`}
                </Text>
              </View>
            </View>

            {/* Clean 2-Tab Switcher: Cộng đồng & Huy hiệu | Thành tích của tôi */}
            <View style={styles.twoTabBar}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => setRankingTab('community')}
                style={[
                  styles.twoTabBtn,
                  rankingTab === 'community' && styles.twoTabBtnActive,
                ]}
              >
                <Users
                  size={14}
                  color={
                    rankingTab === 'community'
                      ? COLORS.white
                      : COLORS.inkSecondary
                  }
                />
                <Text
                  style={[
                    styles.twoTabText,
                    rankingTab === 'community' && styles.twoTabTextActive,
                  ]}
                >
                  Cộng đồng & Huy hiệu
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => setRankingTab('personal')}
                style={[
                  styles.twoTabBtn,
                  rankingTab === 'personal' && styles.twoTabBtnActive,
                ]}
              >
                <Trophy
                  size={14}
                  color={
                    rankingTab === 'personal'
                      ? COLORS.white
                      : COLORS.inkSecondary
                  }
                />
                <Text
                  style={[
                    styles.twoTabText,
                    rankingTab === 'personal' && styles.twoTabTextActive,
                  ]}
                >
                  Của tôi ({records.length})
                </Text>
              </TouchableOpacity>
            </View>

            {rankingTab === 'community' && (
              <View style={styles.section}>
                {!authState?.isAuthenticated ? (
                  <View style={styles.guestCtaCard}>
                    <View style={styles.guestCtaTextCol}>
                      <Text style={styles.guestCtaTitle}>
                        Đăng nhập để tự động đồng bộ hạng
                      </Text>
                      <Text style={styles.guestCtaDesc}>
                        Hệ thống sẽ tự động đồng bộ hành trình, mở khóa 6 Huy
                        hiệu và ghi tên bạn lên bảng xếp hạng.
                      </Text>
                    </View>
                    {onOpenAuthModal && (
                      <TouchableOpacity
                        onPress={onOpenAuthModal}
                        style={styles.guestLoginBtn}
                        activeOpacity={0.85}
                      >
                        <LogIn size={14} color={COLORS.white} />
                        <Text style={styles.guestLoginBtnText}>Đăng nhập</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={styles.myBoardCard}>
                    <View style={styles.myBoardTop}>
                      <View style={styles.myBoardInfo}>
                        <Text style={styles.myBoardEyebrow}>
                          HẠNG HIỆN TẠI CỦA BẠN
                        </Text>
                        <Text style={styles.myBoardName}>
                          {authState.profile?.display_name}
                        </Text>
                        <Text style={styles.myBoardRankText}>
                          {myBoard?.rank
                            ? `Hạng #${myBoard.rank} / ${myBoard.total_users} · ${myBoard.unlocked_badges.length}/6 huy hiệu`
                            : 'Đang tự động đồng bộ hành trình lên Cloud…'}
                        </Text>
                      </View>
                      <View style={styles.autoSyncStatusPill}>
                        {isSyncing ? (
                          <ActivityIndicator size={11} color={COLORS.visited} />
                        ) : (
                          <ShieldCheck size={13} color={COLORS.visited} />
                        )}
                        <Text style={styles.autoSyncStatusText}>
                          {isSyncing ? 'Đang đồng bộ' : 'Đã đồng bộ'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Achievement Badges */}
                <Text style={styles.sectionHeading}>
                  Huy hiệu thành tựu (
                  {badgesList.filter((b) => b.unlocked).length}/
                  {badgesList.length})
                </Text>

                <View style={styles.badgesGrid}>
                  {badgesList.map((badge) => (
                    <View
                      key={badge.code}
                      style={[
                        styles.badgeCard,
                        badge.unlocked && styles.badgeCardUnlocked,
                      ]}
                    >
                      <View style={styles.badgeTopRow}>
                        <View
                          style={[
                            styles.badgeIconCircle,
                            badge.unlocked && styles.badgeIconCircleUnlocked,
                          ]}
                        >
                          {badge.unlocked ? (
                            <Award size={14} color={COLORS.white} />
                          ) : (
                            <Lock size={12} color={COLORS.inkMuted} />
                          )}
                        </View>
                        {badge.unlocked ? (
                          <View style={styles.unlockedTag}>
                            <Text style={styles.unlockedTagText}>Đã đạt</Text>
                          </View>
                        ) : (
                          <Text style={styles.badgePctText}>
                            {badge.progress_percent}%
                          </Text>
                        )}
                      </View>
                      <Text style={styles.badgeTitle} numberOfLines={2}>
                        {badge.title_vi}
                      </Text>
                      <Text style={styles.badgeDesc} numberOfLines={2}>
                        {badge.description_vi}
                      </Text>
                      <View style={styles.badgeBarTrack}>
                        <View
                          style={[
                            styles.badgeBarFill,
                            {
                              width: `${Math.min(
                                100,
                                Math.max(
                                  badge.unlocked ? 100 : 0,
                                  badge.progress_percent
                                )
                              )}%`,
                              backgroundColor: badge.unlocked
                                ? COLORS.visited
                                : COLORS.accent,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>

                {/* Global Community Leaderboard */}
                <Text style={styles.sectionHeading}>
                  Bảng xếp hạng Cộng đồng
                  {totalCommunityUsers > 0 ? ` (${totalCommunityUsers})` : ''}
                </Text>

                <View style={styles.sortChipsRow}>
                  {(
                    [
                      { id: 'walking_time', label: 'Thời gian đi bộ' },
                      { id: 'walking_distance', label: 'Quãng đường' },
                      { id: 'sites_count', label: 'Số di tích' },
                    ] as const
                  ).map((opt) => {
                    const active = globalSortBy === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => setGlobalSortBy(opt.id)}
                        style={[
                          styles.globalSortChip,
                          active && styles.globalSortChipActive,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.globalSortText,
                            active && styles.globalSortTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {isLoadingCommunity && globalEntries.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <ActivityIndicator size="small" color={COLORS.accent} />
                    <Text style={styles.emptyDesc}>
                      Đang tải bảng xếp hạng cộng đồng…
                    </Text>
                  </View>
                ) : communityError ? (
                  <View style={styles.emptyCard}>
                    <WifiOff size={22} color={COLORS.inkMuted} />
                    <Text style={styles.emptyTitle}>
                      Chưa kết nối được Cloud
                    </Text>
                    <Text style={styles.emptyDesc}>
                      Hệ thống sẽ tự động cập nhật ngay khi có kết nối mạng.
                    </Text>
                  </View>
                ) : globalEntries.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Trophy size={24} color={COLORS.inkMuted} />
                    <Text style={styles.emptyTitle}>
                      Chưa có dữ liệu cộng đồng
                    </Text>
                    <Text style={styles.emptyDesc}>
                      Hãy đăng nhập và check-in để trở thành người đầu tiên trên
                      bảng xếp hạng!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.listGap}>
                    {globalEntries.map((entry) => {
                      const isMe = authState?.profile?.id === entry.user_id;
                      return (
                        <View
                          key={entry.user_id}
                          style={[
                            styles.globalRowCard,
                            isMe && styles.globalRowCardMe,
                          ]}
                        >
                          <View
                            style={[
                              styles.rankBadge,
                              entry.rank === 1 && styles.rankBadgeFirst,
                              entry.rank > 1 &&
                                entry.rank <= 3 &&
                                styles.rankBadgeTopThree,
                            ]}
                          >
                            <Text
                              style={[
                                styles.rankNumber,
                                entry.rank === 1 && styles.rankNumberFirst,
                                entry.rank > 1 &&
                                  entry.rank <= 3 &&
                                  styles.rankNumberTopThree,
                              ]}
                            >
                              #{entry.rank}
                            </Text>
                          </View>
                          <View style={styles.globalRowMain}>
                            <View style={styles.globalNameRow}>
                              <Text
                                style={styles.globalDisplayName}
                                numberOfLines={1}
                              >
                                {entry.display_name}
                                {isMe ? ' (Bạn)' : ''}
                              </Text>
                              <View style={styles.verifyPillVerified}>
                                <ShieldCheck size={10} color={COLORS.visited} />
                                <Text style={styles.verifyTextVerified}>
                                  {entry.badges_count} huy hiệu
                                </Text>
                              </View>
                            </View>
                            <View style={styles.metricsRow}>
                              <Text style={styles.metricStrong}>
                                {formatWalkingDuration(
                                  entry.total_verified_walking_seconds
                                )}
                              </Text>
                              <Text style={styles.dotSep}>·</Text>
                              <Text style={styles.metricNormal}>
                                {formatDistance(
                                  entry.total_verified_walking_meters
                                )}
                              </Text>
                              <Text style={styles.dotSep}>·</Text>
                              <Text style={styles.metricMuted}>
                                {entry.verified_sites_count} di tích
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {rankingTab === 'personal' && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionSubtitle}>
                    Các điểm bạn đã chinh phục theo thời gian đi bộ
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setSortMode((prev) =>
                        prev === 'longest_walk'
                          ? 'shortest_walk'
                          : 'longest_walk'
                      )
                    }
                    style={styles.sortBtn}
                    activeOpacity={0.75}
                  >
                    <ArrowUpDown size={12} color={COLORS.ink} />
                    <Text style={styles.sortBtnText}>
                      {sortMode === 'longest_walk' ? 'Lâu nhất' : 'Nhanh nhất'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {rankedActualList.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Trophy size={26} color={COLORS.inkMuted} />
                    <Text style={styles.emptyTitle}>
                      Chưa có thành tích nào
                    </Text>
                    <Text style={styles.emptyDesc}>
                      Hãy đi bộ tới một điểm di tích và check-in để bắt đầu bảng
                      thành tích cá nhân.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.listGap}>
                    {rankedActualList.map(
                      ({ rank, record, badgeTitle, effortScore }) => {
                        const widthPercent = Math.max(
                          12,
                          Math.min(
                            100,
                            Math.round(
                              (record.walkingDurationSeconds /
                                maxActualDuration) *
                                100
                            )
                          )
                        );
                        return (
                          <View
                            key={record.id}
                            style={[
                              styles.rankCard,
                              rank === 1 && styles.rankCardTop,
                            ]}
                          >
                            <View style={styles.rankTopRow}>
                              <View
                                style={[
                                  styles.rankBadge,
                                  rank === 1 && styles.rankBadgeFirst,
                                  rank > 1 &&
                                    rank <= 3 &&
                                    styles.rankBadgeTopThree,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.rankNumber,
                                    rank === 1 && styles.rankNumberFirst,
                                    rank > 1 &&
                                      rank <= 3 &&
                                      styles.rankNumberTopThree,
                                  ]}
                                >
                                  #{rank}
                                </Text>
                              </View>
                              <View style={styles.rankMain}>
                                <TouchableOpacity
                                  onPress={() => onSelectSiteById(record.siteId)}
                                  activeOpacity={0.75}
                                >
                                  <Text
                                    style={styles.rankSiteName}
                                    numberOfLines={1}
                                  >
                                    {record.siteName}
                                  </Text>
                                </TouchableOpacity>
                                <View style={styles.badgeRow}>
                                  <View style={styles.titlePill}>
                                    <Award size={11} color={COLORS.accent} />
                                    <Text style={styles.titlePillText}>
                                      {badgeTitle}
                                    </Text>
                                  </View>
                                  <Text style={styles.scoreText}>
                                    {effortScore} điểm
                                  </Text>
                                </View>
                              </View>
                            </View>

                            <View style={styles.metricsRow}>
                              <Footprints size={12.5} color={COLORS.accent} />
                              <Text style={styles.metricStrong}>
                                {formatWalkingDuration(
                                  record.walkingDurationSeconds
                                )}
                              </Text>
                              <Text style={styles.dotSep}>·</Text>
                              <Text style={styles.metricNormal}>
                                {formatDistance(record.walkingDistanceMeters)}
                              </Text>
                              <Text style={styles.dotSep}>·</Text>
                              <Text style={styles.metricMuted}>
                                {new Date(record.visitedAt).toLocaleDateString(
                                  'vi-VN'
                                )}
                              </Text>
                            </View>

                            <View style={styles.barTrack}>
                              <View
                                style={[
                                  styles.barFill,
                                  {
                                    width: `${widthPercent}%`,
                                    backgroundColor:
                                      rank === 1 ? COLORS.accent : COLORS.ink,
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        );
                      }
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Non-nested Inline Photo Lightbox (never locks clicks on Web/iOS) */}
      {previewPhoto && (
        <View style={styles.lightboxOverlay}>
          <View style={styles.lightboxHeader}>
            <View style={styles.lightboxHeaderInfo}>
              <Text style={styles.lightboxTitle} numberOfLines={1}>
                {previewPhoto.siteName}
              </Text>
              <Text style={styles.lightboxSub}>
                {new Date(previewPhoto.takenAt).toLocaleString('vi-VN')}
              </Text>
            </View>
            <Pressable
              onPress={() => setPreviewPhoto(null)}
              style={styles.lightboxCloseBtn}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Đóng ảnh"
            >
              <X size={20} color={COLORS.white} />
            </Pressable>
          </View>

          <Pressable
            style={styles.lightboxImageWrap}
            onPress={() => setPreviewPhoto(null)}
          >
            <Image
              source={{ uri: previewPhoto.dataUrl }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          </Pressable>

          <View style={styles.lightboxFooter}>
            <Text style={styles.lightboxCaption}>{previewPhoto.caption}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: 14,
    paddingBottom: SPACING.xxl + 16,
  },
  pageTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  pageSubtitle: {
    fontSize: 12,
    color: COLORS.inkMuted,
    marginTop: 2,
  },
  rankingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  autoLiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  autoLiveDot: {
    width: 6,
    height: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.visitedDot,
  },
  autoLiveText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  passportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 12,
    ...SHADOWS.card,
  },
  passportTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceMuted,
    paddingVertical: 10,
  },
  kpiCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 2,
  },
  kpiBorder: {
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  kpiSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  progressTrack: {
    height: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
  },
  twoTabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.pill,
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  twoTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADII.pill,
  },
  twoTabBtnActive: {
    backgroundColor: COLORS.ink,
  },
  twoTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  twoTabTextActive: {
    color: COLORS.white,
  },
  section: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionSubtitle: {
    flex: 1,
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  listGap: {
    gap: 10,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 22,
    alignItems: 'center',
    gap: 7,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 12.5,
    color: COLORS.inkSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  logCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    gap: 10,
    ...SHADOWS.card,
  },
  logHeaderRow: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
  },
  logThumb: {
    width: 62,
    height: 62,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
  },
  logInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  logCity: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  logTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 20,
  },
  logMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  logStatsStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  logStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bg,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  logStatText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  logNote: {
    fontSize: 12.5,
    fontStyle: 'italic',
    color: COLORS.inkSecondary,
    lineHeight: 18,
  },
  logPhotosRow: {
    gap: 8,
  },
  logPhotoItem: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logPhotoThumb: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.surfaceMuted,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  ghostBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  unvisitedSection: {
    gap: 10,
    marginTop: 6,
  },
  unvisitedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 9,
  },
  unvisitedThumb: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceMuted,
  },
  unvisitedInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  unvisitedTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  checkinChipBtn: {
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  checkinChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.accent,
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  albumCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  albumImageWrap: {
    height: 128,
    backgroundColor: COLORS.surfaceMuted,
    position: 'relative',
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  albumDurationBadge: {
    position: 'absolute',
    bottom: 7,
    left: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20, 20, 19, 0.78)',
    borderRadius: RADII.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  albumDurationText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  albumCardBody: {
    padding: 9,
    gap: 2,
  },
  albumSiteName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  albumCaption: {
    fontSize: 11,
    color: COLORS.inkSecondary,
    lineHeight: 15,
  },
  albumDate: {
    fontSize: 10,
    color: COLORS.inkMuted,
    marginTop: 2,
  },
  guestCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: 13,
    ...SHADOWS.card,
  },
  guestCtaTextCol: {
    flex: 1,
    gap: 3,
  },
  guestCtaTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  guestCtaDesc: {
    fontSize: 11.5,
    color: COLORS.inkSecondary,
    lineHeight: 16,
  },
  guestLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.ink,
    borderRadius: RADII.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  guestLoginBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  myBoardCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    ...SHADOWS.card,
  },
  myBoardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  myBoardInfo: {
    flex: 1,
    gap: 2,
  },
  myBoardEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: COLORS.accent,
  },
  myBoardName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  myBoardRankText: {
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  autoSyncStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.visitedBg,
    borderWidth: 1,
    borderColor: COLORS.visitedBorder,
    borderRadius: RADII.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  autoSyncStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.visited,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeCard: {
    width: '48.5%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 11,
    gap: 5,
  },
  badgeCardUnlocked: {
    borderColor: COLORS.visitedBorder,
    backgroundColor: COLORS.visitedBg,
  },
  badgeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconCircleUnlocked: {
    backgroundColor: COLORS.visited,
  },
  unlockedTag: {
    backgroundColor: COLORS.visited,
    borderRadius: RADII.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unlockedTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  badgePctText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  badgeTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 16,
  },
  badgeDesc: {
    fontSize: 11,
    color: COLORS.inkSecondary,
    lineHeight: 15,
  },
  badgeBarTrack: {
    height: 4,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    overflow: 'hidden',
    marginTop: 2,
  },
  badgeBarFill: {
    height: '100%',
    borderRadius: RADII.pill,
  },
  sortChipsRow: {
    flexDirection: 'row',
    gap: 7,
  },
  globalSortChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  globalSortChipActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  globalSortText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  globalSortTextActive: {
    color: COLORS.white,
  },
  globalRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 11,
  },
  globalRowCardMe: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
  },
  globalRowMain: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  globalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  globalDisplayName: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  rankCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    gap: 9,
    ...SHADOWS.card,
  },
  rankCardTop: {
    borderColor: COLORS.accentBorder,
  },
  rankTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeFirst: {
    backgroundColor: COLORS.accent,
  },
  rankBadgeTopThree: {
    backgroundColor: COLORS.ink,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  rankNumberFirst: {
    color: COLORS.white,
  },
  rankNumberTopThree: {
    color: COLORS.white,
  },
  rankMain: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rankSiteName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADII.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  titlePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.accent,
  },
  scoreText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metricStrong: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  metricNormal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  metricMuted: {
    fontSize: 11.5,
    color: COLORS.inkMuted,
  },
  dotSep: {
    fontSize: 11,
    color: COLORS.borderStrong,
  },
  barTrack: {
    height: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: RADII.pill,
  },
  verifyPillVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.visitedBg,
    borderWidth: 1,
    borderColor: COLORS.visitedBorder,
    borderRadius: RADII.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  verifyTextVerified: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.visited,
  },
  verifyPillSim: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.amberBg,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    borderRadius: RADII.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  verifyTextSim: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.amber,
  },
  verifyPillFlagged: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADII.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  verifyTextFlagged: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.accent,
  },
  lightboxOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'rgba(14, 14, 13, 0.96)',
  },
  lightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  lightboxHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  lightboxTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  lightboxSub: {
    color: '#CFCBC2',
    fontSize: 11.5,
  },
  lightboxCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxFooter: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  lightboxCaption: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 19,
  },
});
