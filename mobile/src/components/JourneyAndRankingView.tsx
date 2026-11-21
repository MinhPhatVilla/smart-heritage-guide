import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowUpDown,
  ArrowUpRight,
  Award,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CloudUpload,
  Compass,
  Footprints,
  Images,
  Lock,
  LogIn,
  MapPin,
  RefreshCw,
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

export interface JourneyAndRankingViewProps {
  records: VisitedSiteRecord[];
  allSites: HeritageSite[];
  userLocation?: [number, number];
  selectedLanguage?: SupportedLanguage;
  authState?: AuthSessionState;
  isSyncing?: boolean;
  onSelectSiteById: (siteId: string) => void;
  onOpenCaptureForSite: (siteId: string) => void;
  onOpenAuthModal?: () => void;
  onSyncNow?: () => void;
}

type JourneySubTab = 'ranking' | 'community' | 'log' | 'album';
type RankingSourceMode = 'actual' | 'proximity';

interface AlbumPhotoItem {
  photo: CapturedPhoto;
  city: string;
  walkingDurationSeconds: number;
}

const DEFAULT_HCMC_CENTER: [number, number] = [10.7775, 106.699];

function getRankMedal(rank: number): string | null {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

export const JourneyAndRankingView: React.FC<JourneyAndRankingViewProps> = ({
  records,
  allSites,
  userLocation = DEFAULT_HCMC_CENTER,
  selectedLanguage = 'vi',
  authState,
  isSyncing = false,
  onSelectSiteById,
  onOpenCaptureForSite,
  onOpenAuthModal,
  onSyncNow,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<JourneySubTab>('ranking');
  const [rankingSource, setRankingSource] =
    useState<RankingSourceMode>('actual');
  const [sortMode, setSortMode] = useState<'longest_walk' | 'shortest_walk'>(
    'longest_walk'
  );
  const [previewPhoto, setPreviewPhoto] = useState<CapturedPhoto | null>(null);

  // Community Leaderboard & Badges state
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

  const loadCommunityData = useCallback(async () => {
    setIsLoadingCommunity(true);
    setCommunityError(null);
    const [globalRes, allBadgesRes, myRes] = await Promise.all([
      fetchGlobalLeaderboard(globalSortBy),
      fetchAllBadges(),
      authState?.isAuthenticated ? fetchMyLeaderboard() : Promise.resolve(null),
    ]);

    setIsLoadingCommunity(false);

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
  }, [authState?.isAuthenticated, globalSortBy]);

  useEffect(() => {
    if (activeSubTab === 'community') {
      void loadCommunityData();
    }
  }, [activeSubTab, loadCommunityData]);

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
            Đã xác thực GPS{score ? ` · ${Math.round(score)}đ` : ''}
          </Text>
        </View>
      );
    }
    if (status === 'simulated') {
      return (
        <View style={styles.verifyPillSim}>
          <Clock size={11} color={COLORS.amber} />
          <Text style={styles.verifyTextSim}>Chế độ Mô phỏng</Text>
        </View>
      );
    }
    return (
      <View style={styles.verifyPillFlagged}>
        <AlertTriangle size={11} color={COLORS.accent} />
        <Text style={styles.verifyTextFlagged}>Cần kiểm tra GPS</Text>
      </View>
    );
  };

  const rankedActualList = useMemo(
    () => rankVisitedSitesByWalkingTime(records, sortMode),
    [records, sortMode]
  );

  const proximityRankedList = useMemo(() => {
    const metrics = getNearbySitesWithMetrics(
      allSites,
      userLocation[0],
      userLocation[1]
    );
    const ordered =
      sortMode === 'shortest_walk' ? metrics : [...metrics].reverse();
    return ordered.map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));
  }, [allSites, userLocation, sortMode]);

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

  const unvisitedSites = useMemo(
    () => allSites.filter((s) => !records.some((r) => r.siteId === s.id)),
    [allSites, records]
  );

  const totalWalkingSeconds = useMemo(
    () => records.reduce((sum, r) => sum + r.walkingDurationSeconds, 0),
    [records]
  );
  const totalDistanceMeters = useMemo(
    () => records.reduce((sum, r) => sum + r.walkingDistanceMeters, 0),
    [records]
  );
  const totalPhotos = albumPhotos.length;

  const maxActualDuration = Math.max(
    1,
    ...records.map((r) => r.walkingDurationSeconds)
  );
  const maxProximityDuration = Math.max(
    1,
    ...proximityRankedList.map((i) => i.estimatedWalkingSeconds)
  );

  const screenWidth = Dimensions.get('window').width;
  const albumCardWidth = Math.max(140, (screenWidth - SPACING.lg * 2 - SPACING.sm) / 2);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title */}
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>NHẬT KÝ BỘ HÀNH & XẾP HẠNG</Text>
          <Text style={styles.pageTitle}>Hành trình Di sản TP.HCM</Text>
        </View>

        {/* Summary KPI Strip */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Di sản đã đi</Text>
            <Text style={styles.kpiValue}>
              {records.length}
              <Text style={styles.kpiSubValue}>/{allSites.length}</Text>
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Tổng đi bộ</Text>
            <Text style={styles.kpiValue} numberOfLines={1}>
              {formatWalkingDuration(totalWalkingSeconds)}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Quãng đường</Text>
            <Text style={styles.kpiValue}>
              {formatDistance(totalDistanceMeters)}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Ảnh kỷ niệm</Text>
            <Text style={styles.kpiValue}>{totalPhotos}</Text>
          </View>
        </View>

        {/* 4 Sub-Tabs */}
        <View style={styles.subTabsBar}>
          <TouchableOpacity
            onPress={() => setActiveSubTab('ranking')}
            style={[
              styles.subTabBtn,
              activeSubTab === 'ranking' && styles.subTabBtnActive,
            ]}
            activeOpacity={0.75}
          >
            <Trophy
              size={13}
              color={
                activeSubTab === 'ranking' ? COLORS.white : COLORS.inkSecondary
              }
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'ranking' && styles.subTabTextActive,
              ]}
              numberOfLines={1}
            >
              Xếp hạng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveSubTab('community')}
            style={[
              styles.subTabBtn,
              activeSubTab === 'community' && styles.subTabBtnActive,
            ]}
            activeOpacity={0.75}
          >
            <Users
              size={13}
              color={
                activeSubTab === 'community'
                  ? COLORS.white
                  : COLORS.inkSecondary
              }
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'community' && styles.subTabTextActive,
              ]}
              numberOfLines={1}
            >
              Cộng đồng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveSubTab('log')}
            style={[
              styles.subTabBtn,
              activeSubTab === 'log' && styles.subTabBtnActive,
            ]}
            activeOpacity={0.75}
          >
            <BookOpen
              size={13}
              color={
                activeSubTab === 'log' ? COLORS.white : COLORS.inkSecondary
              }
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'log' && styles.subTabTextActive,
              ]}
              numberOfLines={1}
            >
              Nhật ký
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveSubTab('album')}
            style={[
              styles.subTabBtn,
              activeSubTab === 'album' && styles.subTabBtnActive,
            ]}
            activeOpacity={0.75}
          >
            <Images
              size={13}
              color={
                activeSubTab === 'album' ? COLORS.white : COLORS.inkSecondary
              }
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'album' && styles.subTabTextActive,
              ]}
              numberOfLines={1}
            >
              Album
            </Text>
          </TouchableOpacity>
        </View>

        {/* SUB-TAB 1: WALKING TIME LEADERBOARD */}
        {activeSubTab === 'ranking' && (
          <View style={styles.section}>
            {/* Switcher: Actual Walking Duration vs Estimated Proximity Walking Time */}
            <View style={styles.modeSwitchWrap}>
              <TouchableOpacity
                onPress={() => setRankingSource('actual')}
                style={[
                  styles.modeSwitchBtn,
                  rankingSource === 'actual' && styles.modeSwitchBtnActive,
                ]}
                activeOpacity={0.75}
              >
                <Footprints
                  size={13}
                  color={
                    rankingSource === 'actual'
                      ? COLORS.accent
                      : COLORS.inkSecondary
                  }
                />
                <Text
                  style={[
                    styles.modeSwitchText,
                    rankingSource === 'actual' && styles.modeSwitchTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Đi bộ thực tế ({records.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRankingSource('proximity')}
                style={[
                  styles.modeSwitchBtn,
                  rankingSource === 'proximity' && styles.modeSwitchBtnActive,
                ]}
                activeOpacity={0.75}
              >
                <Compass
                  size={13}
                  color={
                    rankingSource === 'proximity'
                      ? COLORS.accent
                      : COLORS.inkSecondary
                  }
                />
                <Text
                  style={[
                    styles.modeSwitchText,
                    rankingSource === 'proximity' &&
                      styles.modeSwitchTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Ước tính từ GPS ({allSites.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sort Toggle Row */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionSubtitle}>
                {rankingSource === 'actual'
                  ? 'Xếp hạng di sản đã chinh phục theo thời gian đi bộ'
                  : 'Xếp hạng di sản theo thời gian đi bộ ước tính từ vị trí bạn'}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setSortMode((prev) =>
                    prev === 'longest_walk' ? 'shortest_walk' : 'longest_walk'
                  )
                }
                style={styles.sortBtn}
                activeOpacity={0.75}
              >
                <ArrowUpDown size={13} color={COLORS.ink} />
                <Text style={styles.sortBtnText}>
                  {sortMode === 'longest_walk' ? 'Lâu nhất' : 'Nhanh nhất'}
                </Text>
              </TouchableOpacity>
            </View>

            {rankingSource === 'actual' ? (
              rankedActualList.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Trophy size={28} color={COLORS.inkMuted} />
                  <Text style={styles.emptyTitle}>
                    Chưa có hành trình nào được ghi nhận
                  </Text>
                  <Text style={styles.emptyDesc}>
                    Hãy đi bộ tới một điểm di tích và nhấn "Lưu ảnh" để bắt đầu
                    bảng xếp hạng của bạn.
                  </Text>
                </View>
              ) : (
                <View style={styles.listGap}>
                  {rankedActualList.map(
                    ({ rank, record, badgeTitle, effortScore }) => {
                      const medal = getRankMedal(rank);
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
                                rank <= 3 && styles.rankBadgeMedal,
                              ]}
                            >
                              {medal ? (
                                <Text style={styles.medalEmoji}>{medal}</Text>
                              ) : (
                                <Text style={styles.rankNumber}>
                                  #{rank < 10 ? `0${rank}` : rank}
                                </Text>
                              )}
                            </View>

                            <View style={styles.rankMain}>
                              <TouchableOpacity
                                onPress={() => onSelectSiteById(record.siteId)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.rankSiteName}>
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
                                {renderVerificationPill(
                                  record.verificationStatus,
                                  record.verificationScore
                                )}
                              </View>
                            </View>
                          </View>

                          {/* Duration & Distance Metrics */}
                          <View style={styles.metricsRow}>
                            <View style={styles.metricItem}>
                              <Footprints size={13} color={COLORS.accent} />
                              <Text style={styles.metricStrong}>
                                {formatWalkingDuration(
                                  record.walkingDurationSeconds
                                )}
                              </Text>
                            </View>
                            <Text style={styles.dotSep}>·</Text>
                            <Text style={styles.metricNormal}>
                              {formatDistance(record.walkingDistanceMeters)}
                            </Text>
                            <Text style={styles.dotSep}>·</Text>
                            <View style={styles.metricItem}>
                              <Calendar size={12} color={COLORS.inkMuted} />
                              <Text style={styles.metricMuted}>
                                {new Date(record.visitedAt).toLocaleDateString(
                                  'vi-VN'
                                )}
                              </Text>
                            </View>
                          </View>

                          {/* Progress Bar */}
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

                          {record.userNote ? (
                            <Text style={styles.noteSnippet} numberOfLines={2}>
                              “{record.userNote}”
                            </Text>
                          ) : null}

                          {/* Quick Action Row */}
                          <View style={styles.cardActionRow}>
                            <TouchableOpacity
                              onPress={() =>
                                onOpenCaptureForSite(record.siteId)
                              }
                              style={styles.secondaryBtn}
                              activeOpacity={0.75}
                            >
                              <Camera size={13} color={COLORS.ink} />
                              <Text style={styles.secondaryBtnText}>
                                Thêm ảnh ({record.photos.length})
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => onSelectSiteById(record.siteId)}
                              style={styles.ghostBtn}
                              activeOpacity={0.75}
                            >
                              <Text style={styles.ghostBtnText}>Chi tiết</Text>
                              <ArrowUpRight size={13} color={COLORS.ink} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    }
                  )}
                </View>
              )
            ) : (
              /* Estimated Proximity Walking Time Leaderboard */
              <View style={styles.listGap}>
                {proximityRankedList.map(
                  ({
                    rank,
                    site,
                    distanceMeters,
                    estimatedWalkingSeconds,
                  }) => {
                    const medal = getRankMedal(rank);
                    const local =
                      site.translations[selectedLanguage] ||
                      site.translations.vi;
                    const isVisited = records.some((r) => r.siteId === site.id);
                    const widthPercent = Math.max(
                      10,
                      Math.min(
                        100,
                        Math.round(
                          (estimatedWalkingSeconds / maxProximityDuration) * 100
                        )
                      )
                    );

                    return (
                      <View key={site.id} style={styles.rankCard}>
                        <View style={styles.rankTopRow}>
                          <View
                            style={[
                              styles.rankBadge,
                              rank <= 3 && styles.rankBadgeMedal,
                            ]}
                          >
                            {medal ? (
                              <Text style={styles.medalEmoji}>{medal}</Text>
                            ) : (
                              <Text style={styles.rankNumber}>
                                #{rank < 10 ? `0${rank}` : rank}
                              </Text>
                            )}
                          </View>

                          <View style={styles.rankMain}>
                            <TouchableOpacity
                              onPress={() => onSelectSiteById(site.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.rankSiteName}>
                                {local.name}
                              </Text>
                            </TouchableOpacity>

                            <View style={styles.badgeRow}>
                              <View style={styles.metricItem}>
                                <MapPin size={11} color={COLORS.inkMuted} />
                                <Text style={styles.metricMuted}>
                                  {site.city}
                                </Text>
                              </View>
                              {isVisited && (
                                <View style={styles.visitedPill}>
                                  <CheckCircle2
                                    size={11}
                                    color={COLORS.visited}
                                  />
                                  <Text style={styles.visitedPillText}>
                                    Đã check-in
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>

                        <View style={styles.metricsRow}>
                          <View style={styles.metricItem}>
                            <Clock size={13} color={COLORS.accent} />
                            <Text style={styles.metricStrong}>
                              ~{formatWalkingDuration(estimatedWalkingSeconds)}
                            </Text>
                          </View>
                          <Text style={styles.dotSep}>·</Text>
                          <Text style={styles.metricNormal}>
                            {formatDistance(distanceMeters)}
                          </Text>
                          <Text style={styles.dotSep}>·</Text>
                          <Text style={styles.metricMuted}>
                            ★ {site.rating.toFixed(1)}
                          </Text>
                        </View>

                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width: `${widthPercent}%`,
                                backgroundColor: isVisited
                                  ? COLORS.visited
                                  : COLORS.ink,
                              },
                            ]}
                          />
                        </View>

                        <View style={styles.cardActionRow}>
                          <TouchableOpacity
                            onPress={() => onOpenCaptureForSite(site.id)}
                            style={styles.secondaryBtn}
                            activeOpacity={0.75}
                          >
                            <Camera size={13} color={COLORS.ink} />
                            <Text style={styles.secondaryBtnText}>
                              {isVisited ? 'Thêm ảnh' : 'Check-in ngay'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => onSelectSiteById(site.id)}
                            style={styles.ghostBtn}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.ghostBtnText}>Xem di tích</Text>
                            <ArrowUpRight size={13} color={COLORS.ink} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }
                )}
              </View>
            )}
          </View>
        )}

        {/* SUB-TAB 1B: COMMUNITY LEADERBOARD & ACHIEVEMENT BADGES */}
        {activeSubTab === 'community' && (
          <View style={styles.section}>
            {/* Guest Login CTA OR Authenticated Cloud Sync Card */}
            {!authState?.isAuthenticated ? (
              <View style={styles.guestCtaCard}>
                <View style={styles.guestCtaTextCol}>
                  <Text style={styles.guestCtaTitle}>
                    Đang ở chế độ Khách (Offline)
                  </Text>
                  <Text style={styles.guestCtaDesc}>
                    Đăng nhập tùy chọn để đồng bộ hành trình lên Cloud, mở khóa
                    6 Huy hiệu và ghi tên lên Bảng xếp hạng Cộng đồng.
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
                      HẠNG CỘNG ĐỒNG CỦA BẠN
                    </Text>
                    <Text style={styles.myBoardName}>
                      {authState.profile?.display_name}
                    </Text>
                    <Text style={styles.myBoardRankText}>
                      {myBoard?.rank
                        ? `Hạng #${myBoard.rank} / ${myBoard.total_users} người dùng · ${myBoard.unlocked_badges.length}/6 huy hiệu`
                        : `Đã đăng nhập · Đồng bộ hành trình để lên bảng xếp hạng`}
                    </Text>
                  </View>
                  {onSyncNow && (
                    <TouchableOpacity
                      onPress={onSyncNow}
                      disabled={isSyncing}
                      style={styles.syncMiniBtn}
                      activeOpacity={0.85}
                    >
                      {isSyncing ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <CloudUpload size={14} color={COLORS.white} />
                      )}
                      <Text style={styles.syncMiniBtnText}>Đồng bộ</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* 6 Achievement Badges Grid */}
            <View style={styles.communitySectionHeader}>
              <Text style={styles.sectionHeading}>
                Huy hiệu thành tựu ({badgesList.filter((b) => b.unlocked).length}
                /{badgesList.length})
              </Text>
              <TouchableOpacity
                onPress={loadCommunityData}
                style={styles.refreshMiniBtn}
                activeOpacity={0.75}
              >
                <RefreshCw size={12} color={COLORS.ink} />
                <Text style={styles.refreshMiniText}>Làm mới</Text>
              </TouchableOpacity>
            </View>

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
                        <Award size={15} color={COLORS.white} />
                      ) : (
                        <Lock size={13} color={COLORS.inkMuted} />
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

            {/* Global Leaderboard */}
            <View style={styles.communitySectionHeader}>
              <Text style={styles.sectionHeading}>
                Bảng xếp hạng Cộng đồng
                {totalCommunityUsers > 0 ? ` (${totalCommunityUsers})` : ''}
              </Text>
            </View>

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

            {isLoadingCommunity ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={styles.emptyDesc}>
                  Đang tải bảng xếp hạng cộng đồng...
                </Text>
              </View>
            ) : communityError ? (
              <View style={styles.emptyCard}>
                <WifiOff size={24} color={COLORS.inkMuted} />
                <Text style={styles.emptyTitle}>
                  Không kết nối được bảng xếp hạng Cloud
                </Text>
                <Text style={styles.emptyDesc}>{communityError}</Text>
              </View>
            ) : globalEntries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Trophy size={24} color={COLORS.inkMuted} />
                <Text style={styles.emptyTitle}>Chưa có dữ liệu cộng đồng</Text>
                <Text style={styles.emptyDesc}>
                  Hãy đăng nhập và check-in đi bộ xác thực GPS để trở thành
                  người đầu tiên trên bảng xếp hạng!
                </Text>
              </View>
            ) : (
              <View style={styles.listGap}>
                {globalEntries.map((entry) => {
                  const medal = getRankMedal(entry.rank);
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
                          entry.rank <= 3 && styles.rankBadgeMedal,
                        ]}
                      >
                        {medal ? (
                          <Text style={styles.medalEmoji}>{medal}</Text>
                        ) : (
                          <Text style={styles.rankNumber}>#{entry.rank}</Text>
                        )}
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
                            {formatDistance(entry.total_verified_walking_meters)}
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

        {/* SUB-TAB 2: JOURNEY LOG */}
        {activeSubTab === 'log' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>
              Di tích đã ghé thăm ({chronologicalRecords.length})
            </Text>

            {chronologicalRecords.length === 0 ? (
              <View style={styles.emptyCard}>
                <BookOpen size={28} color={COLORS.inkMuted} />
                <Text style={styles.emptyTitle}>Nhật ký đang trống</Text>
                <Text style={styles.emptyDesc}>
                  Check-in tại bất kỳ điểm di tích nào để lưu lại hành trình đi
                  bộ, cảm nhận và hình ảnh của bạn.
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
                        <Text style={styles.logCity}>{record.city}</Text>
                        <TouchableOpacity
                          onPress={() => onSelectSiteById(record.siteId)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.logTitle} numberOfLines={2}>
                            {record.siteName}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.logMetaRow}>
                          <View style={styles.metricItem}>
                            <Calendar size={11} color={COLORS.inkMuted} />
                            <Text style={styles.metricMuted}>
                              {new Date(record.visitedAt).toLocaleDateString(
                                'vi-VN'
                              )}
                            </Text>
                          </View>
                          <Text style={styles.dotSep}>·</Text>
                          <View style={styles.metricItem}>
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
                    </View>

                    <View style={styles.logStatsStrip}>
                      <View style={styles.logStatChip}>
                        <Footprints size={12} color={COLORS.accent} />
                        <Text style={styles.logStatText}>
                          {formatWalkingDuration(record.walkingDurationSeconds)}
                        </Text>
                      </View>
                      <View style={styles.logStatChip}>
                        <MapPin size={12} color={COLORS.inkSecondary} />
                        <Text style={styles.logStatText}>
                          {formatDistance(record.walkingDistanceMeters)}
                        </Text>
                      </View>
                      <View style={styles.logStatChip}>
                        <Camera size={12} color={COLORS.inkSecondary} />
                        <Text style={styles.logStatText}>
                          {record.photos.length} ảnh
                        </Text>
                      </View>
                      {renderVerificationPill(
                        record.verificationStatus,
                        record.verificationScore
                      )}
                    </View>

                    {record.userNote ? (
                      <Text style={styles.logNote}>{record.userNote}</Text>
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
                            activeOpacity={0.8}
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
                        activeOpacity={0.75}
                      >
                        <Camera size={13} color={COLORS.ink} />
                        <Text style={styles.secondaryBtnText}>Chụp thêm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onSelectSiteById(record.siteId)}
                        style={styles.ghostBtn}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.ghostBtnText}>Mở di tích</Text>
                        <ArrowUpRight size={13} color={COLORS.ink} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Unvisited Heritage Sites */}
            {unvisitedSites.length > 0 && (
              <View style={styles.unvisitedSection}>
                <Text style={styles.sectionHeading}>
                  Điểm di sản chưa check-in ({unvisitedSites.length})
                </Text>
                <View style={styles.listGap}>
                  {unvisitedSites.map((site) => {
                    const local =
                      site.translations[selectedLanguage] ||
                      site.translations.vi;
                    return (
                      <View key={site.id} style={styles.unvisitedCard}>
                        <Image
                          source={{ uri: site.coverImage }}
                          style={styles.unvisitedThumb}
                        />
                        <TouchableOpacity
                          onPress={() => onSelectSiteById(site.id)}
                          style={styles.unvisitedInfo}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={styles.unvisitedTitle}
                            numberOfLines={1}
                          >
                            {local.name}
                          </Text>
                          <View style={styles.metricItem}>
                            <MapPin size={11} color={COLORS.inkMuted} />
                            <Text style={styles.metricMuted} numberOfLines={1}>
                              {site.city}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => onOpenCaptureForSite(site.id)}
                          style={styles.checkinChipBtn}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.checkinChipText}>Check-in</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* SUB-TAB 3: PHOTO MEMORY ALBUM */}
        {activeSubTab === 'album' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>
              Album ảnh lưu niệm ({albumPhotos.length})
            </Text>

            {albumPhotos.length === 0 ? (
              <View style={styles.emptyCard}>
                <Images size={28} color={COLORS.inkMuted} />
                <Text style={styles.emptyTitle}>Chưa có ảnh kỷ niệm nào</Text>
                <Text style={styles.emptyDesc}>
                  Hãy mở Camera hoặc tải ảnh lên khi check-in tại di tích để tạo
                  bộ sưu tập hành trình của riêng bạn.
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
      </ScrollView>

      {/* Fullscreen Photo Preview Lightbox Modal */}
      <Modal
        visible={Boolean(previewPhoto)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhoto(null)}
      >
        <SafeAreaView style={styles.lightboxBackdrop} edges={['top', 'bottom']}>
          <View style={styles.lightboxHeader}>
            <View style={styles.lightboxHeaderInfo}>
              <Text style={styles.lightboxTitle} numberOfLines={1}>
                {previewPhoto?.siteName}
              </Text>
              {previewPhoto && (
                <Text style={styles.lightboxSub}>
                  {new Date(previewPhoto.takenAt).toLocaleString('vi-VN')} ·{' '}
                  {previewPhoto.lat.toFixed(4)}°N, {previewPhoto.lng.toFixed(4)}
                  °E
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setPreviewPhoto(null)}
              style={styles.lightboxCloseBtn}
              accessibilityLabel="Đóng ảnh"
              activeOpacity={0.75}
            >
              <X size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.lightboxImageWrap}>
            {previewPhoto && (
              <Image
                source={{ uri: previewPhoto.dataUrl }}
                style={styles.lightboxImage}
                resizeMode="contain"
              />
            )}
          </View>

          {previewPhoto && (
            <View style={styles.lightboxFooter}>
              <Text style={styles.lightboxCaption}>{previewPhoto.caption}</Text>
              {previewPhoto.walkingDurationSecondsAtCapture ? (
                <View style={styles.lightboxWalkPill}>
                  <Footprints size={12} color={COLORS.amberStar} />
                  <Text style={styles.lightboxWalkText}>
                    Thời gian đi bộ:{' '}
                    {formatWalkingDuration(
                      previewPhoto.walkingDurationSecondsAtCapture
                    )}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
    paddingBottom: SPACING.xxl + 16,
  },
  pageHeader: {
    gap: 3,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    color: COLORS.inkMuted,
  },
  pageTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  kpiLabel: {
    fontSize: 11,
    color: COLORS.inkMuted,
    fontWeight: '500',
  },
  kpiValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  kpiSubValue: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.inkMuted,
  },
  subTabsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    gap: 4,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: RADII.md,
  },
  subTabBtnActive: {
    backgroundColor: COLORS.ink,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  subTabTextActive: {
    color: COLORS.white,
  },
  section: {
    gap: SPACING.md,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  modeSwitchWrap: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.md,
    padding: 3,
    gap: 4,
  },
  modeSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: RADII.sm + 2,
  },
  modeSwitchBtnActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  modeSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  modeSwitchTextActive: {
    color: COLORS.ink,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  sectionSubtitle: {
    flex: 1,
    fontSize: 12,
    color: COLORS.inkSecondary,
    lineHeight: 17,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink,
  },
  listGap: {
    gap: SPACING.md,
  },
  rankCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm + 2,
    ...SHADOWS.card,
  },
  rankCardTop: {
    borderColor: COLORS.accentBorder,
  },
  rankTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeMedal: {
    backgroundColor: COLORS.amberBg,
    borderColor: COLORS.amberBorder,
  },
  medalEmoji: {
    fontSize: 20,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  rankMain: {
    flex: 1,
    gap: 4,
  },
  rankSiteName: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADII.xs + 2,
    backgroundColor: COLORS.accentSoft,
  },
  titlePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  visitedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.visitedBg,
    borderWidth: 1,
    borderColor: COLORS.visitedBorder,
  },
  visitedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.visited,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricStrong: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  metricNormal: {
    fontSize: 12,
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  metricMuted: {
    fontSize: 11,
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  dotSep: {
    fontSize: 12,
    color: COLORS.inkMuted,
  },
  barTrack: {
    height: 6,
    width: '100%',
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: RADII.pill,
  },
  noteSnippet: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.inkSecondary,
    lineHeight: 17,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingTop: 2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  ghostBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  logCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm + 2,
    ...SHADOWS.card,
  },
  logHeaderRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  logThumb: {
    width: 68,
    height: 68,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  logInfo: {
    flex: 1,
    gap: 3,
  },
  logCity: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  logTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 20,
  },
  logMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  logStatsStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  logStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logStatText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  logNote: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.inkSecondary,
  },
  logPhotosRow: {
    gap: SPACING.sm,
  },
  logPhotoItem: {
    borderRadius: RADII.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logPhotoThumb: {
    width: 82,
    height: 64,
    backgroundColor: COLORS.surfaceMuted,
  },
  unvisitedSection: {
    gap: SPACING.sm + 2,
    paddingTop: SPACING.sm,
  },
  unvisitedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm + 2,
  },
  unvisitedThumb: {
    width: 48,
    height: 48,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  unvisitedInfo: {
    flex: 1,
    gap: 3,
  },
  unvisitedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  checkinChipBtn: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADII.md,
    backgroundColor: COLORS.ink,
  },
  checkinChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  albumCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  albumImageWrap: {
    height: 130,
    position: 'relative',
    backgroundColor: COLORS.surfaceMuted,
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  albumDurationBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20, 20, 19, 0.78)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  albumDurationText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  albumCardBody: {
    padding: SPACING.sm + 2,
    gap: 3,
  },
  albumSiteName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  albumCaption: {
    fontSize: 11,
    color: COLORS.inkSecondary,
    lineHeight: 15,
  },
  albumDate: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.inkSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  lightboxBackdrop: {
    flex: 1,
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
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
  },
  lightboxSub: {
    color: '#B9B6AE',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  lightboxCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxFooter: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.xs + 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  lightboxCaption: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 19,
  },
  lightboxWalkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lightboxWalkText: {
    color: COLORS.amberStar,
    fontSize: 12,
    fontWeight: '600',
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
    paddingVertical: 2,
  },
  verifyTextVerified: {
    fontSize: 10,
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
    paddingVertical: 2,
  },
  verifyTextSim: {
    fontSize: 10,
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
    paddingVertical: 2,
  },
  verifyTextFlagged: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  guestCtaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  guestCtaTextCol: {
    gap: 3,
  },
  guestCtaTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  guestCtaDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.inkSecondary,
  },
  guestLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.ink,
    paddingVertical: 10,
    borderRadius: RADII.md,
  },
  guestLoginBtnText: {
    color: COLORS.white,
    fontSize: 12.5,
    fontWeight: '700',
  },
  myBoardCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.visitedBorder,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  myBoardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  myBoardInfo: {
    flex: 1,
    gap: 2,
  },
  myBoardEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.visited,
    letterSpacing: 0.5,
  },
  myBoardName: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
  },
  myBoardRankText: {
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  syncMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: RADII.md,
  },
  syncMiniBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  communitySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refreshMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  refreshMiniText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badgeCard: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 5,
    ...SHADOWS.card,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.xs,
  },
  unlockedTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  badgePctText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  badgeTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  badgeDesc: {
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.inkSecondary,
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
    gap: SPACING.xs + 2,
  },
  globalSortChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
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
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  globalRowCardMe: {
    borderColor: COLORS.accentBorder,
    backgroundColor: COLORS.amberBg,
  },
  globalRowMain: {
    flex: 1,
    gap: 4,
  },
  globalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  globalDisplayName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    flexShrink: 1,
  },
});
