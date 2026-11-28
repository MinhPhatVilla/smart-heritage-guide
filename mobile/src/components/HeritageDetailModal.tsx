import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  ArrowLeft,
  Bike,
  Camera,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Film,
  Footprints,
  Headphones,
  Image as ImageIcon,
  MapPin,
  MessageSquareText,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  Star,
  Ticket,
  Utensils,
  X,
} from 'lucide-react-native';
import {
  DocumentaryMedia,
  HeritageSite,
  NearbyRestaurant,
  SupportedLanguage,
  VisitedSiteRecord,
} from '../types/heritage';
import {
  estimateTravelSeconds,
  formatDistance,
  formatTravelDuration,
  formatWalkingDuration,
  getRecommendedRestaurants,
} from '../utils/geoUtils';
import {
  AudioGuidePlayer,
  AudioPlaybackSnapshot,
  formatAudioClock,
} from './AudioGuidePlayer';
import { SiteMiniMap } from './SiteMiniMap';
import { speechService } from '../services/speechService';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export interface HeritageDetailModalProps {
  visible?: boolean;
  site: HeritageSite;
  visitedRecord?: VisitedSiteRecord;
  userLocation: [number, number];
  distanceMeters: number;
  estimatedWalkingSeconds: number;
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onClose: () => void;
  onStartNavigation: (site: HeritageSite) => void;
  onNavigateToRestaurant: (
    restaurant: NearbyRestaurant,
    parentSite: HeritageSite
  ) => void;
  onOpenPhotoCheckIn: (site: HeritageSite) => void;
  onAskAiAboutSite?: (site: HeritageSite) => void;
}

type DetailTab = 'overview' | 'media' | 'dining';

const FALLBACK_FOOD_IMG =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildVideoPlayerHtml(url: string, poster?: string): string {
  const safeUrl = escapeHtmlAttr(url);
  const posterAttr = poster ? `poster="${escapeHtmlAttr(poster)}"` : '';
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #141413; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    video { width: 100%; height: 100%; object-fit: contain; background: #141413; }
  </style>
</head>
<body>
  <video controls autoplay playsinline ${posterAttr}>
    <source src="${safeUrl}" type="video/mp4" />
  </video>
</body>
</html>`;
}

export const HeritageDetailModal: React.FC<HeritageDetailModalProps> = ({
  visible = true,
  site,
  visitedRecord,
  userLocation,
  distanceMeters,
  estimatedWalkingSeconds,
  selectedLanguage,
  onLanguageChange,
  onClose,
  onStartNavigation,
  onNavigateToRestaurant,
  onOpenPhotoCheckIn,
  onAskAiAboutSite,
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [showDiningMap, setShowDiningMap] = useState<boolean>(false);
  const [audioSnapshot, setAudioSnapshot] = useState<AudioPlaybackSnapshot>({
    playState: 'idle',
    progressPercent: 0,
    currentSeconds: 0,
    durationSeconds: 0,
    activeSegment: 0,
    totalSegments: 0,
    isBuffering: false,
  });
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    caption: string;
    source: string;
  } | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Luôn đảm bảo thoát modal thành công ngay cả khi audio / WebView đang chạy hoặc gặp lỗi
  const handleCloseModal = useCallback(() => {
    try {
      speechService.stop();
    } catch {
      // Bỏ qua lỗi dừng giọng đọc để không bao giờ chặn thao tác đóng
    }
    setPlayingVideoId(null);
    setLightboxMedia(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    setActiveTab('overview');
    setMinRatingFilter(0);
    setShowDiningMap(false);
    setLightboxMedia(null);
    setPlayingVideoId(null);
  }, [site.id]);

  // Hỗ trợ bấm phím Escape trên Web để thoát lightbox hoặc thoát chi tiết địa danh ngay lập tức
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const win = globalThis as unknown as {
      addEventListener?: (ev: string, fn: (e: { key?: string }) => void) => void;
      removeEventListener?: (ev: string, fn: (e: { key?: string }) => void) => void;
    };
    if (!win.addEventListener || !win.removeEventListener) return;
    const onKeyDown = (e: { key?: string }) => {
      if (e.key === 'Escape') {
        if (lightboxMedia) {
          setLightboxMedia(null);
        } else {
          handleCloseModal();
        }
      }
    };
    win.addEventListener('keydown', onKeyDown);
    return () => win.removeEventListener?.('keydown', onKeyDown);
  }, [visible, lightboxMedia, handleCloseModal]);

  const localized = site.translations?.[selectedLanguage] || site.translations?.vi || {
    name: site.id,
    shortSummary: '',
    historicalEra: '',
    openingHours: '07:00 – 18:00',
    architecturalHighlights: [],
    audioScript: [],
  };

  const safeGallery = useMemo(
    () => (Array.isArray(site.mediaGallery) ? site.mediaGallery : []),
    [site.mediaGallery]
  );

  const safeRestaurants = useMemo(
    () => (Array.isArray(site.nearbyRestaurants) ? site.nearbyRestaurants : []),
    [site.nearbyRestaurants]
  );

  const safeHighlights = useMemo(
    () =>
      Array.isArray(localized.architecturalHighlights)
        ? localized.architecturalHighlights
        : [],
    [localized.architecturalHighlights]
  );

  const topRestaurants = useMemo(
    () =>
      getRecommendedRestaurants(
        safeRestaurants,
        site.lat,
        site.lng,
        minRatingFilter
      ),
    [safeRestaurants, site.lat, site.lng, minRatingFilter]
  );

  const safeRating = Number.isFinite(site.rating) ? site.rating : 4.7;
  const safeReviewCount = Number.isFinite(site.reviewCount) ? site.reviewCount : 0;

  const handleOpenExternalVideo = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      // Ignore linking errors on restricted devices
    }
  };

  const renderVideoBlock = (media: DocumentaryMedia, captionText: string) => {
    const isPlaying = playingVideoId === media.id;

    return (
      <View style={styles.videoBox}>
        {isPlaying ? (
          Platform.OS === 'web' ? (
            <View style={styles.webVideoWrap}>
              {React.createElement('video', {
                controls: true,
                autoPlay: true,
                playsInline: true,
                poster: media.thumbnailUrl,
                style: {
                  width: '100%',
                  height: 205,
                  backgroundColor: '#141413',
                  objectFit: 'contain',
                },
                src: media.url,
              })}
            </View>
          ) : (
            <WebView
              source={{
                html: buildVideoPlayerHtml(media.url, media.thumbnailUrl),
              }}
              style={styles.videoWebView}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
            />
          )
        ) : (
          <TouchableOpacity
            onPress={() => setPlayingVideoId(media.id)}
            style={styles.videoPosterBtn}
            activeOpacity={0.85}
            accessibilityLabel={`Phát video: ${captionText}`}
          >
            <Image
              source={{ uri: media.thumbnailUrl || site.coverImage }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
            <View style={styles.videoPosterScrim} pointerEvents="none" />
            <View style={styles.playCircle} pointerEvents="none">
              <Play size={22} color={COLORS.ink} fill={COLORS.ink} />
            </View>
            <View style={styles.mediaTypeBadge} pointerEvents="none">
              <Film size={11} color={COLORS.white} />
              <Text style={styles.mediaTypeBadgeText}>
                Video tư liệu
                {media.durationLabel ? ` · ${media.durationLabel}` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.videoActionsStrip}>
          <TouchableOpacity
            onPress={() => setPlayingVideoId(isPlaying ? null : media.id)}
            style={styles.videoActionBtn}
            activeOpacity={0.75}
          >
            <Play size={12} color={COLORS.ink} />
            <Text style={styles.videoActionBtnText}>
              {isPlaying ? 'Đóng trình phát' : 'Phát ngay'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleOpenExternalVideo(media.url)}
            style={styles.videoActionBtn}
            activeOpacity={0.75}
          >
            <ExternalLink size={12} color={COLORS.accent} />
            <Text style={[styles.videoActionBtnText, { color: COLORS.accent }]}>
              Mở liên kết ngoài
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!visible) return null;

  const modalBody = (
    <View
      style={[
        styles.rootContainer,
        {
          paddingTop: Platform.OS === 'web' ? 0 : Math.max(insets.top, 8),
          paddingBottom: Platform.OS === 'web' ? 0 : Math.max(insets.bottom, 0),
        },
      ]}
    >
      {/* Dedicated Sticky Top Navigation Bar (normal flow — NEVER overlapped or blocked!) */}
      <View style={styles.topNavBar}>
        <Pressable
          onPress={handleCloseModal}
          style={({ pressed }) => [
            styles.topBackBtn,
            pressed && styles.topBtnPressed,
          ]}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách"
        >
          <ArrowLeft size={17} color={COLORS.ink} strokeWidth={2.3} />
          <Text style={styles.topBackText}>Quay lại</Text>
        </Pressable>

        <View style={styles.topTitleCol}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {localized.name}
          </Text>
          <Text style={styles.topSub} numberOfLines={1}>
            {site.city}
          </Text>
        </View>

        <Pressable
          onPress={handleCloseModal}
          style={({ pressed }) => [
            styles.topCloseBtn,
            pressed && styles.topBtnPressed,
          ]}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Đóng chi tiết di tích"
        >
          <X size={19} color={COLORS.ink} strokeWidth={2.3} />
        </Pressable>
      </View>

      {/* Clean Soft Jade Segmented Tab Bar */}
      <View style={styles.tabsOuter}>
        <View style={styles.tabsBar}>
          {(
            [
              { id: 'overview', label: 'Thuyết minh', icon: Headphones },
              {
                id: 'dining',
                label: `Ẩm thực (${safeRestaurants.length})`,
                icon: Utensils,
              },
              {
                id: 'media',
                label: `Tư liệu (${safeGallery.length})`,
                icon: ImageIcon,
              },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            const IconComponent = tab.icon;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <IconComponent
                  size={13.5}
                  color={active ? COLORS.white : COLORS.accentDeep}
                  strokeWidth={2}
                />
                <Text
                  style={[styles.tabLabel, active && styles.tabLabelActive]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Scrollable Body (Hero lives inside scroll; cleanly centered on Web Desktop) */}
      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.bodyInner}>
        {/* Clean Editorial Hero Card (Photo uncluttered + Practical Info Strip below) */}
        <View style={styles.heroCardWrap}>
          <View style={styles.heroCard}>
            <Image
              source={{ uri: site.coverImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroScrim} pointerEvents="none" />

            <View style={styles.heroTopRow} pointerEvents="none">
              {site.unescoRecognized ? (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>Di sản UNESCO</Text>
                </View>
              ) : site.nationalSpecialMonument ? (
                <View style={styles.heroBadgeAccent}>
                  <Text style={styles.heroBadgeText}>Di tích QG Đặc biệt</Text>
                </View>
              ) : (
                <View />
              )}

              <View style={styles.heroRatingPill}>
                <Star
                  size={12}
                  color={COLORS.amberStar}
                  fill={COLORS.amberStar}
                />
                <Text style={styles.heroRatingText}>
                  {safeRating.toFixed(1)} ({safeReviewCount.toLocaleString()})
                </Text>
              </View>
            </View>

            <View style={styles.heroBottom} pointerEvents="none">
              <Text style={styles.heroEra} numberOfLines={1}>
                {site.city}
                {localized.historicalEra ? ` · ${localized.historicalEra}` : ''}
              </Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {localized.name}
              </Text>
            </View>
          </View>

          {/* Clean Practical Strip Below Photo (Smart travel estimate · Ticket · Rating) */}
          <View style={styles.heroMetaStrip}>
            <View style={styles.heroMetaStripItem}>
              {distanceMeters > 3500 ? (
                <Bike size={13} color={COLORS.accentDeep} strokeWidth={2} />
              ) : (
                <Footprints size={13} color={COLORS.accentDeep} strokeWidth={2} />
              )}
              <Text style={styles.heroMetaStripPrimary} numberOfLines={1}>
                {distanceMeters > 3500
                  ? `~${formatTravelDuration(
                      estimateTravelSeconds(distanceMeters, 'motorbike'),
                      'motorbike'
                    )}`
                  : `~${formatWalkingDuration(estimatedWalkingSeconds)}`}{' '}
                ({formatDistance(distanceMeters)})
              </Text>
            </View>
            <View style={styles.heroMetaStripDivider} />
            <View style={styles.heroMetaStripItemRight}>
              <Ticket size={13} color={COLORS.inkMuted} strokeWidth={1.9} />
              <Text style={styles.heroMetaStripMuted} numberOfLines={1}>
                {site.ticketPrice || 'Miễn phí'}
              </Text>
            </View>
          </View>
        </View>

        {/* TAB 1: THUYẾT MINH & TỔNG QUAN (Luôn giữ sống trong DOM để âm thanh KHÔNG NGẮT khi đổi sang tab Ẩm thực / Tư liệu!) */}
        <View
          style={[
            styles.tabSection,
            activeTab !== 'overview' && styles.hiddenTab,
          ]}
        >
          <AudioGuidePlayer
            site={site}
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
            onPlaybackSnapshotChange={setAudioSnapshot}
          />

          {/* User's Own Check-in Review Card (shown when user has rated/checked in) */}
          {visitedRecord && (
            <View style={styles.myReviewCard}>
              <View style={styles.myReviewHeader}>
                <View style={styles.myReviewLeft}>
                  <Text style={styles.myReviewTitle}>Đánh giá của bạn</Text>
                  <View style={styles.myReviewStars}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const filled = star <= (visitedRecord.userRating || 5);
                      return (
                        <Star
                          key={star}
                          size={13}
                          color={filled ? COLORS.amberStar : COLORS.borderStrong}
                          fill={filled ? COLORS.amberStar : 'transparent'}
                        />
                      );
                    })}
                    <Text style={styles.myReviewScoreText}>
                      {(visitedRecord.userRating || 5).toFixed(1)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => onOpenPhotoCheckIn(site)}
                  style={styles.myReviewEditBtn}
                  activeOpacity={0.78}
                >
                  <Text style={styles.myReviewEditText}>Cập nhật</Text>
                </TouchableOpacity>
              </View>

              {visitedRecord.userNote ? (
                <Text style={styles.myReviewNote}>{visitedRecord.userNote}</Text>
              ) : null}

              {visitedRecord.photos?.length > 0 &&
                visitedRecord.photos[0].dataUrl &&
                visitedRecord.photos[0].dataUrl !== site.coverImage && (
                  <Image
                    source={{ uri: visitedRecord.photos[0].dataUrl }}
                    style={styles.myReviewPhoto}
                    resizeMode="cover"
                  />
                )}
            </View>
          )}

          {/* Consolidated Single Practical Info Card (Giờ mở cửa · Giá vé · Địa chỉ) */}
          <View style={styles.practicalCard}>
            <View style={styles.practicalRowItem}>
              <View style={styles.practicalIconBox}>
                <Clock size={14} color={COLORS.accentDeep} strokeWidth={2} />
              </View>
              <View style={styles.practicalTextCol}>
                <Text style={styles.practicalLabel}>Giờ mở cửa</Text>
                <Text style={styles.practicalValue}>
                  {localized.openingHours || '07:00 – 18:00'}
                </Text>
              </View>
            </View>

            <View style={styles.practicalDivider} />

            <View style={styles.practicalRowItem}>
              <View style={styles.practicalIconBox}>
                <Ticket size={14} color={COLORS.accentDeep} strokeWidth={2} />
              </View>
              <View style={styles.practicalTextCol}>
                <Text style={styles.practicalLabel}>Giá vé tham khảo</Text>
                <Text style={styles.practicalValue}>
                  {site.ticketPrice || 'Miễn phí tham quan'}
                </Text>
              </View>
            </View>

            {site.address ? (
              <>
                <View style={styles.practicalDivider} />
                <View style={styles.practicalRowItem}>
                  <View style={styles.practicalIconBox}>
                    <MapPin size={14} color={COLORS.accentDeep} strokeWidth={2} />
                  </View>
                  <View style={styles.practicalTextCol}>
                    <Text style={styles.practicalLabel}>Địa chỉ</Text>
                    <Text style={styles.practicalValue}>{site.address}</Text>
                  </View>
                </View>
              </>
            ) : null}
          </View>

          {/* Historical Summary & Highlights */}
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>
              GIỚI THIỆU &amp; ĐIỂM NHẤN KIẾN TRÚC
            </Text>
            <Text style={styles.summaryText}>{localized.shortSummary}</Text>

            {safeHighlights.length > 0 && (
              <View style={styles.highlightsList}>
                {safeHighlights.map((item, idx) => (
                  <View key={idx} style={styles.highlightRow}>
                    <Text style={styles.highlightIndex}>0{idx + 1}</Text>
                    <Text style={styles.highlightText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {onAskAiAboutSite && (
            <TouchableOpacity
              onPress={() => onAskAiAboutSite(site)}
              style={styles.askAiCard}
              activeOpacity={0.85}
            >
              <View style={styles.askAiIconWrap}>
                <MessageSquareText size={16} color={COLORS.white} />
              </View>
              <View style={styles.askAiTextCol}>
                <Text style={styles.askAiTitle}>Hỏi trợ lý về di tích này</Text>
                <Text style={styles.askAiDesc} numberOfLines={2}>
                  Giải đáp lịch sử, kiến trúc &amp; ẩm thực quanh {localized.name}
                </Text>
              </View>
              <View style={styles.askAiCtaPill}>
                <Text style={styles.askAiCtaText}>Hỏi ngay</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* TAB 2: ẨM THỰC GẦN ĐÓ (Danh sách hiện ngay, Bản đồ mini thu gọn mặc định) */}
        {activeTab === 'dining' && (
          <View style={styles.tabSection}>
            <View style={styles.sectionIntro}>
              <Text style={styles.sectionTitle}>
                Quán ăn &amp; Đồ uống quanh {localized.name}
              </Text>
              <Text style={styles.sectionSubtitle}>
                Sắp xếp theo đánh giá cao nhất và khoảng cách từ địa điểm.
              </Text>
            </View>

            {/* Rating Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {[
                { value: 0, label: 'Tất cả (xếp theo ★)' },
                { value: 4.5, label: '≥ 4.5 ★' },
                { value: 4.7, label: '≥ 4.7 ★' },
                { value: 4.8, label: '≥ 4.8 ★' },
              ].map((opt) => {
                const active = minRatingFilter === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setMinRatingFilter(opt.value)}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Collapsible Mini Map Toggle (Hidden by default so user sees dining list immediately) */}
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setShowDiningMap((prev) => !prev)}
              style={styles.diningMapToggleBtn}
              accessibilityRole="button"
              accessibilityLabel={
                showDiningMap
                  ? 'Ẩn bản đồ vị trí các quán'
                  : 'Xem vị trí các quán trên bản đồ'
              }
            >
              <View style={styles.diningMapToggleLeft}>
                <MapPin size={14} color={COLORS.accentDeep} strokeWidth={2} />
                <Text style={styles.diningMapToggleText}>
                  {showDiningMap
                    ? 'Ẩn bản đồ vị trí các quán'
                    : `Xem vị trí ${topRestaurants.length} quán trên bản đồ`}
                </Text>
              </View>
              {showDiningMap ? (
                <ChevronUp size={15} color={COLORS.accentDeep} strokeWidth={2} />
              ) : (
                <ChevronDown
                  size={15}
                  color={COLORS.accentDeep}
                  strokeWidth={2}
                />
              )}
            </TouchableOpacity>

            {showDiningMap && (
              <SiteMiniMap
                site={site}
                userLocation={userLocation}
                restaurants={topRestaurants}
                onSelectRestaurant={(res) => onNavigateToRestaurant(res, site)}
                height={195}
              />
            )}

            {topRestaurants.length === 0 ? (
              <View style={styles.emptyDiningCard}>
                <Text style={styles.emptyDiningText}>
                  Không có quán ăn nào đạt mức ≥ {minRatingFilter} ★. Hãy chọn
                  mức lọc thấp hơn.
                </Text>
              </View>
            ) : (
              <View style={styles.diningList}>
                {topRestaurants.map((res) => (
                  <View key={res.id} style={styles.restaurantCard}>
                    <View style={styles.restaurantTop}>
                      <Image
                        source={{ uri: res.imageUrl || FALLBACK_FOOD_IMG }}
                        style={styles.restaurantThumb}
                        resizeMode="cover"
                      />
                      <View style={styles.restaurantMain}>
                        <View style={styles.restaurantTitleRow}>
                          <Text
                            style={styles.restaurantName}
                            numberOfLines={2}
                          >
                            {res.name}
                          </Text>
                          <View style={styles.ratingBadge}>
                            <Star
                              size={11}
                              color={COLORS.accent}
                              fill={COLORS.accent}
                            />
                            <Text style={styles.ratingBadgeText}>
                              {(res.rating ?? 4.5).toFixed(1)}
                            </Text>
                            <Text style={styles.ratingCountText}>
                              ({res.reviewCount ?? 0})
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.restaurantCuisine}>
                          {res.cuisine}
                          {res.priceRange ? ` · ${res.priceRange}` : ''}
                        </Text>

                        {Array.isArray(res.specialtyDishes) &&
                        res.specialtyDishes.length > 0 ? (
                          <Text
                            style={styles.restaurantDishes}
                            numberOfLines={2}
                          >
                            Món nổi bật: {res.specialtyDishes.join(' · ')}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.restaurantMetaRow}>
                      <View style={styles.restaurantMetaLeft}>
                        <Footprints size={12} color={COLORS.accent} />
                        <Text style={styles.restaurantMetaText}>
                          Cách {formatDistance(res.distanceMeters)} · ~
                          {formatWalkingDuration(res.walkingSeconds)}
                        </Text>
                      </View>
                      <Text style={styles.restaurantHours}>
                        {res.openHours || '07:00 – 21:00'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => onNavigateToRestaurant(res, site)}
                      style={styles.navRestaurantBtn}
                      activeOpacity={0.8}
                    >
                      <Navigation size={14} color={COLORS.white} />
                      <Text style={styles.navRestaurantBtnText}>
                        Dẫn đường tới quán
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: TƯ LIỆU ẢNH & VIDEO */}
        {activeTab === 'media' && (
          <View style={styles.tabSection}>
            <View style={styles.sectionIntro}>
              <Text style={styles.sectionTitle}>
                Tư liệu Ảnh & Phim tài liệu lịch sử
              </Text>
              <Text style={styles.sectionSubtitle}>
                Chạm vào ảnh để xem toàn màn hình hoặc phát video tư liệu về{' '}
                {localized.name}.
              </Text>
            </View>

            {safeGallery.length === 0 ? (
              <View style={styles.emptyDiningCard}>
                <Text style={styles.emptyDiningText}>
                  Chưa có thêm ảnh tư liệu cho địa điểm này.
                </Text>
              </View>
            ) : (
              <View style={styles.mediaList}>
                {safeGallery.map((media) => {
                  const captionText =
                    media.caption?.[selectedLanguage] ||
                    media.caption?.vi ||
                    localized.name;
                  return (
                    <View key={media.id} style={styles.mediaCard}>
                      {media.type === 'video' ? (
                        renderVideoBlock(media, captionText)
                      ) : (
                        <TouchableOpacity
                          onPress={() =>
                            setLightboxMedia({
                              url: media.url,
                              caption: captionText,
                              source: media.yearOrSource || 'Tư liệu di sản',
                            })
                          }
                          style={styles.imageBtnWrap}
                          activeOpacity={0.85}
                        >
                          <Image
                            source={{ uri: media.url }}
                            style={styles.mediaImage}
                            resizeMode="cover"
                          />
                          <View
                            style={styles.mediaTypeBadge}
                            pointerEvents="none"
                          >
                            <ImageIcon size={11} color={COLORS.white} />
                            <Text style={styles.mediaTypeBadgeText}>
                              Chạm để phóng to
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}

                      <View style={styles.mediaBody}>
                        <Text style={styles.mediaCaption}>{captionText}</Text>
                        <Text style={styles.mediaSource}>
                          {media.yearOrSource || 'Tư liệu lịch sử'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
        </View>
      </ScrollView>

      {/* Persistent Mini Audio Bar when viewing Ẩm thực / Tư liệu while audio is playing or paused */}
      {activeTab !== 'overview' && audioSnapshot.playState !== 'idle' && (
        <View style={styles.miniAudioOuter}>
          <View style={styles.miniAudioCard}>
            <View style={styles.miniAudioProgressTrack}>
              <View
                style={[
                  styles.miniAudioProgressFill,
                  { width: `${audioSnapshot.progressPercent}%` },
                ]}
              />
            </View>
            <View style={styles.miniAudioRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('overview')}
                style={styles.miniAudioInfoBtn}
                accessibilityLabel="Quay lại trình phát thuyết minh đầy đủ"
              >
                <View style={styles.miniAudioIconBox}>
                  <Headphones size={14} color={COLORS.white} strokeWidth={2} />
                </View>
                <View style={styles.miniAudioTextCol}>
                  <Text style={styles.miniAudioTitle} numberOfLines={1}>
                    {localized.name}
                  </Text>
                  <Text style={styles.miniAudioSub} numberOfLines={1}>
                    {audioSnapshot.playState === 'playing'
                      ? 'Đang phát thuyết minh'
                      : 'Đang tạm dừng'}{' '}
                    ·{' '}
                    {audioSnapshot.durationSeconds > 0
                      ? `${formatAudioClock(
                          audioSnapshot.currentSeconds
                        )} / ${formatAudioClock(audioSnapshot.durationSeconds)}`
                      : `Đoạn ${audioSnapshot.activeSegment + 1}/${
                          audioSnapshot.totalSegments
                        }`}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.miniAudioControls}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => speechService.seekBySeconds(-10)}
                  style={styles.miniAudioStepBtn}
                  accessibilityLabel="Tua lùi 10 giây"
                >
                  <RotateCcw
                    size={14}
                    color={COLORS.accentDeep}
                    strokeWidth={2}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    if (audioSnapshot.playState === 'playing') {
                      speechService.pause();
                    } else {
                      speechService.resume();
                    }
                  }}
                  style={styles.miniAudioPlayBtn}
                  accessibilityLabel={
                    audioSnapshot.playState === 'playing'
                      ? 'Tạm dừng thuyết minh'
                      : 'Tiếp tục thuyết minh'
                  }
                >
                  {audioSnapshot.playState === 'playing' ? (
                    <Pause size={15} color={COLORS.white} fill={COLORS.white} />
                  ) : (
                    <Play
                      size={15}
                      color={COLORS.white}
                      fill={COLORS.white}
                      style={{ marginLeft: 1.5 }}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Sticky Footer Actions (Soft Jade WCAG AA) */}
      <View style={styles.footerOuter}>
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => onStartNavigation(site)}
            style={styles.footerPrimaryBtn}
            activeOpacity={0.85}
          >
            <Navigation size={15} color={COLORS.white} strokeWidth={2} />
            <Text style={styles.footerPrimaryText}>Dẫn đường</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onOpenPhotoCheckIn(site)}
            style={styles.footerSecondaryBtn}
            activeOpacity={0.8}
          >
            <Camera size={15} color={COLORS.accentDeep} strokeWidth={2} />
            <Text style={styles.footerSecondaryText}>Check-in ảnh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Non-nested Inline Fullscreen Image Lightbox (NO nested <Modal> bugs!) */}
      {lightboxMedia && (
        <View style={styles.lightboxOverlay}>
          <View style={styles.lightboxTopBar}>
            <Text style={styles.lightboxSource} numberOfLines={1}>
              {lightboxMedia.source}
            </Text>
            <Pressable
              onPress={() => setLightboxMedia(null)}
              style={styles.lightboxCloseBtn}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Đóng ảnh phóng to"
            >
              <X size={20} color={COLORS.white} />
            </Pressable>
          </View>

          <Pressable
            style={styles.lightboxBody}
            onPress={() => setLightboxMedia(null)}
          >
            <Image
              source={{ uri: lightboxMedia.url }}
              style={styles.lightboxImg}
              resizeMode="contain"
            />
          </Pressable>

          {lightboxMedia.caption ? (
            <View style={styles.lightboxFooter}>
              <Text style={styles.lightboxCaption}>{lightboxMedia.caption}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );

  // Trên Web dùng fixed overlay trực tiếp để tránh hoàn toàn lỗi kẹt portal/click của RNW <Modal>
  if (Platform.OS === 'web') {
    return <View style={styles.webFixedPortal}>{modalBody}</View>;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCloseModal}
    >
      {modalBody}
    </Modal>
  );
};

const styles = StyleSheet.create({
  webFixedPortal: {
    position: 'fixed' as unknown as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: COLORS.bg,
  },
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    position: 'relative',
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 20,
  },
  topBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  topTitleCol: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  topTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  topSub: {
    fontSize: 11,
    color: COLORS.inkMuted,
    marginTop: 1,
  },
  topCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  tabsOuter: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabsBar: {
    width: '100%',
    maxWidth: 740,
    flexDirection: 'row',
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: RADII.md,
  },
  tabBtnActive: {
    backgroundColor: COLORS.accent,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  tabLabelActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.md + 2,
    paddingBottom: SPACING.xxl + 8,
    alignItems: 'center',
  },
  bodyInner: {
    width: '100%',
    maxWidth: 740,
    gap: SPACING.md,
  },
  heroCardWrap: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  heroCard: {
    height: 184,
    width: '100%',
    backgroundColor: COLORS.ink,
    position: 'relative',
  },
  heroMetaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
  },
  heroMetaStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  heroMetaStripItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    maxWidth: '46%',
  },
  heroMetaStripDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
  },
  heroMetaStripPrimary: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentDeep,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  heroMetaStripMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkSecondary,
    flexShrink: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.88,
  },
  heroScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 20, 19, 0.36)',
  },
  heroTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(20, 20, 19, 0.72)',
  },
  heroBadgeAccent: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
  },
  heroBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  heroRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(250, 249, 246, 0.94)',
  },
  heroRatingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  heroBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(20, 20, 19, 0.62)',
    gap: 4,
  },
  heroEra: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.88)',
  },
  heroTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 24,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    marginTop: 2,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroStatText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.white,
    fontVariant: ['tabular-nums'],
  },
  heroMetaDot: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  tabSection: {
    gap: SPACING.md,
  },
  hiddenTab: {
    display: 'none',
  },
  myReviewCard: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: 14,
    gap: 8,
  },
  myReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  myReviewLeft: {
    gap: 4,
    flex: 1,
  },
  myReviewTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  myReviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  myReviewScoreText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  myReviewEditBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  myReviewEditText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  myReviewNote: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.ink,
  },
  myReviewPhoto: {
    width: 84,
    height: 84,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  practicalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    ...SHADOWS.card,
  },
  practicalRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 10,
  },
  practicalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practicalTextCol: {
    flex: 1,
    gap: 1,
  },
  practicalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  practicalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 18,
  },
  practicalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  diningMapToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  diningMapToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  diningMapToggleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  miniAudioOuter: {
    paddingHorizontal: SPACING.md,
    paddingTop: 8,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
  },
  miniAudioCard: {
    width: '100%',
    maxWidth: 740,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    overflow: 'hidden',
    ...SHADOWS.floating,
  },
  miniAudioProgressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: COLORS.accentSoft,
  },
  miniAudioProgressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
  },
  miniAudioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  miniAudioInfoBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniAudioIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAudioTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  miniAudioTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  miniAudioSub: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentDeep,
    fontVariant: ['tabular-nums'],
  },
  miniAudioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  miniAudioStepBtn: {
    width: 34,
    height: 34,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAudioPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickFactsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm + 2,
  },
  quickFactCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 4,
    ...SHADOWS.card,
  },
  quickFactIcon: {
    width: 28,
    height: 28,
    borderRadius: RADII.md,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quickFactLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  quickFactValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 17,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.surfaceTint,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
    ...SHADOWS.card,
  },
  cardEyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: COLORS.inkMuted,
  },
  cardEyebrowDark: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.ink,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.ink,
  },
  highlightsList: {
    gap: SPACING.sm,
    paddingTop: 2,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm + 2,
  },
  highlightIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.inkSecondary,
  },
  infoTextWrap: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
    lineHeight: 18,
  },
  infoCoords: {
    fontSize: 11,
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  seeAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  previewFoodList: {
    gap: 10,
  },
  previewFoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bg,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
  },
  previewFoodThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceMuted,
  },
  previewFoodInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  previewFoodName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  previewFoodMeta: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.accent,
  },
  previewFoodDish: {
    fontSize: 11,
    color: COLORS.inkSecondary,
  },
  previewFoodGoBtn: {
    width: 34,
    height: 34,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMapSection: {
    gap: SPACING.sm,
  },
  miniMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  miniMapNavLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniMapNavLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  sectionIntro: {
    gap: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.inkSecondary,
    lineHeight: 17,
  },
  mediaList: {
    gap: SPACING.md,
  },
  mediaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  imageBtnWrap: {
    position: 'relative',
    height: 205,
    backgroundColor: COLORS.surfaceMuted,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaTypeBadge: {
    position: 'absolute',
    top: SPACING.sm + 2,
    left: SPACING.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20, 20, 19, 0.78)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADII.sm,
  },
  mediaTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  videoBox: {
    backgroundColor: COLORS.ink,
  },
  videoPosterBtn: {
    height: 205,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPosterScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 20, 19, 0.32)',
  },
  playCircle: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  videoWebView: {
    height: 205,
    width: '100%',
    backgroundColor: COLORS.ink,
  },
  webVideoWrap: {
    height: 205,
    width: '100%',
    backgroundColor: COLORS.ink,
  },
  videoActionsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceTint,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  videoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
  },
  videoActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  mediaBody: {
    padding: SPACING.md,
    gap: 4,
  },
  mediaCaption: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
    lineHeight: 19,
  },
  mediaSource: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  filterRow: {
    gap: SPACING.xs + 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  emptyDiningCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyDiningText: {
    fontSize: 12.5,
    color: COLORS.inkSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  diningList: {
    gap: SPACING.md,
  },
  restaurantCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm + 2,
    ...SHADOWS.card,
  },
  restaurantTop: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  restaurantThumb: {
    width: 72,
    height: 72,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  restaurantMain: {
    flex: 1,
    gap: 4,
  },
  restaurantTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  restaurantName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 19,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  ratingCountText: {
    fontSize: 10,
    color: COLORS.inkMuted,
  },
  restaurantCuisine: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.accent,
  },
  restaurantDishes: {
    fontSize: 12,
    color: COLORS.inkSecondary,
    lineHeight: 17,
  },
  restaurantMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
  },
  restaurantMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  restaurantMetaText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  restaurantHours: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  navRestaurantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
  },
  navRestaurantBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  footerOuter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    ...SHADOWS.bar,
  },
  footer: {
    width: '100%',
    maxWidth: 740,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
  },
  footerPrimaryBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
  },
  footerPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  footerSecondaryBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    backgroundColor: COLORS.accentSoft,
  },
  footerSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  lightboxOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 40,
    backgroundColor: 'rgba(14, 14, 13, 0.96)',
  },
  lightboxTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  lightboxSource: {
    flex: 1,
    color: '#CFCBC2',
    fontSize: 12,
    fontWeight: '600',
  },
  lightboxCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  lightboxImg: {
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
  askAiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  askAiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADII.md,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askAiTextCol: {
    flex: 1,
    gap: 2,
  },
  askAiTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  askAiDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    color: COLORS.inkSecondary,
  },
  askAiCtaPill: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
  },
  askAiCtaText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
