import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  ArrowLeft,
  Camera,
  Clock,
  ExternalLink,
  Film,
  Footprints,
  Image as ImageIcon,
  MapPin,
  Navigation,
  Play,
  Sparkles,
  Star,
  Ticket,
  Utensils,
  Volume2,
  X,
} from 'lucide-react-native';
import {
  DocumentaryMedia,
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
import { SiteMiniMap } from './SiteMiniMap';
import { speechService } from '../services/speechService';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export interface HeritageDetailModalProps {
  visible?: boolean;
  site: HeritageSite;
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
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    caption: string;
    source: string;
  } | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const handleCloseModal = () => {
    speechService.stop();
    setPlayingVideoId(null);
    setLightboxMedia(null);
    onClose();
  };

  useEffect(() => {
    setActiveTab('overview');
    setMinRatingFilter(0);
    setLightboxMedia(null);
    setPlayingVideoId(null);
  }, [site.id]);

  // Hỗ trợ bấm phím Escape trên Web để thoát chi tiết địa danh ngay lập tức
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
          speechService.stop();
          onClose();
        }
      }
    };
    win.addEventListener('keydown', onKeyDown);
    return () => win.removeEventListener?.('keydown', onKeyDown);
  }, [visible, lightboxMedia, onClose]);

  const localized = site.translations[selectedLanguage] || site.translations.vi;

  const topRestaurants = useMemo(
    () =>
      getRecommendedRestaurants(
        site.nearbyRestaurants,
        site.lat,
        site.lng,
        minRatingFilter
      ),
    [site.nearbyRestaurants, site.lat, site.lng, minRatingFilter]
  );

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
            <View style={styles.videoPosterScrim} />
            <View style={styles.playCircle}>
              <Play size={22} color={COLORS.ink} fill={COLORS.ink} />
            </View>
            <View style={styles.mediaTypeBadge}>
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
            onPress={() =>
              setPlayingVideoId(isPlaying ? null : media.id)
            }
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCloseModal}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Hero Image Header */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: site.coverImage }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroScrim} pointerEvents="none" />

          <View style={styles.heroBottom} pointerEvents="box-none">
            <View style={styles.heroMetaRow}>
              <Text style={styles.heroMetaText}>{site.city}</Text>
              <Text style={styles.heroMetaDot}>·</Text>
              <Text style={styles.heroMetaText}>{localized.historicalEra}</Text>
              {site.unescoRecognized ? (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>Di sản UNESCO</Text>
                </View>
              ) : site.nationalSpecialMonument ? (
                <View style={styles.heroBadgeAccent}>
                  <Text style={styles.heroBadgeText}>Di tích QG Đặc biệt</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.heroTitle} numberOfLines={2}>
              {localized.name}
            </Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Footprints size={13} color={COLORS.amberStar} />
                <Text style={styles.heroStatText}>
                  {formatWalkingDuration(estimatedWalkingSeconds)} (
                  {formatDistance(distanceMeters)})
                </Text>
              </View>
              <Text style={styles.heroMetaDot}>·</Text>
              <View style={styles.heroStatItem}>
                <Star
                  size={13}
                  color={COLORS.amberStar}
                  fill={COLORS.amberStar}
                />
                <Text style={styles.heroStatText}>
                  {site.rating.toFixed(1)} ({site.reviewCount.toLocaleString()})
                </Text>
              </View>
            </View>
          </View>

          {/* Always-on-top Back & Close controls (never blocked by heroBottom/scrim) */}
          <View style={styles.heroTopActions} pointerEvents="box-none">
            <TouchableOpacity
              onPress={handleCloseModal}
              style={styles.heroBackPill}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              accessibilityLabel="Quay lại danh sách"
              activeOpacity={0.82}
            >
              <ArrowLeft size={16} color={COLORS.white} />
              <Text style={styles.heroBackPillText}>Quay lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCloseModal}
              style={styles.heroCloseBtn}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              accessibilityLabel="Đóng chi tiết di tích"
              activeOpacity={0.82}
            >
              <X size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabsBar}>
          {(
            [
              { id: 'overview', label: 'Thuyết minh', icon: Volume2 },
              {
                id: 'media',
                label: `Tư liệu (${site.mediaGallery.length})`,
                icon: ImageIcon,
              },
              {
                id: 'dining',
                label: `Ẩm thực (${site.nearbyRestaurants.length})`,
                icon: Utensils,
              },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            const IconComponent = tab.icon;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                activeOpacity={0.75}
              >
                <IconComponent
                  size={14}
                  color={active ? COLORS.ink : COLORS.inkMuted}
                />
                <Text
                  style={[styles.tabLabel, active && styles.tabLabelActive]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Scrollable Body */}
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* TAB 1: THUYẾT MINH & BẢN ĐỒ */}
          {activeTab === 'overview' && (
            <View style={styles.tabSection}>
              <AudioGuidePlayer
                site={site}
                selectedLanguage={selectedLanguage}
                onLanguageChange={onLanguageChange}
              />

              {onAskAiAboutSite && (
                <TouchableOpacity
                  onPress={() => onAskAiAboutSite(site)}
                  style={styles.askAiCard}
                  activeOpacity={0.85}
                >
                  <View style={styles.askAiIconWrap}>
                    <Sparkles size={16} color={COLORS.white} />
                  </View>
                  <View style={styles.askAiTextCol}>
                    <Text style={styles.askAiTitle}>Hỏi AI về di tích này</Text>
                    <Text style={styles.askAiDesc} numberOfLines={2}>
                      Trợ lý RAG đa ngôn ngữ giải đáp lịch sử, kiến trúc & ẩm
                      thực quanh {localized.name}
                    </Text>
                  </View>
                  <View style={styles.askAiCtaPill}>
                    <Text style={styles.askAiCtaText}>Hỏi AI</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Historical Summary & Highlights */}
              <View style={styles.card}>
                <Text style={styles.cardEyebrow}>
                  GIỚI THIỆU & ĐIỂM NHẤN KIẾN TRÚC
                </Text>
                <Text style={styles.summaryText}>{localized.shortSummary}</Text>

                <View style={styles.highlightsList}>
                  {localized.architecturalHighlights.map((item, idx) => (
                    <View key={idx} style={styles.highlightRow}>
                      <Text style={styles.highlightIndex}>
                        0{idx + 1}
                      </Text>
                      <Text style={styles.highlightText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Visitor Info */}
              <View style={styles.cardMuted}>
                <Text style={styles.cardEyebrow}>THÔNG TIN KHÁCH THAM QUAN</Text>

                <View style={styles.infoRow}>
                  <Clock size={15} color={COLORS.inkMuted} />
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoLabel}>Giờ mở cửa</Text>
                    <Text style={styles.infoValue}>
                      {localized.openingHours}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ticket size={15} color={COLORS.inkMuted} />
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoLabel}>Giá vé tham khảo</Text>
                    <Text style={styles.infoValue}>{site.ticketPrice}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <MapPin size={15} color={COLORS.inkMuted} />
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoLabel}>
                      {site.address ? 'Địa chỉ & Tọa độ' : 'Tọa độ GPS'}
                    </Text>
                    {site.address ? (
                      <Text style={styles.infoValue}>{site.address}</Text>
                    ) : null}
                    <Text style={styles.infoCoords}>
                      {site.lat.toFixed(4)}°N, {site.lng.toFixed(4)}°E
                    </Text>
                  </View>
                </View>
              </View>

              {/* Embedded SiteMiniMap */}
              <View style={styles.miniMapSection}>
                <View style={styles.miniMapHeader}>
                  <Text style={styles.cardEyebrow}>
                    BẢN ĐỒ DI TÍCH & ẨM THỰC XUNG QUANH
                  </Text>
                  <TouchableOpacity
                    onPress={() => onStartNavigation(site)}
                    style={styles.miniMapNavLink}
                    activeOpacity={0.75}
                  >
                    <Navigation size={12} color={COLORS.accent} />
                    <Text style={styles.miniMapNavLinkText}>Mở bản đồ lớn</Text>
                  </TouchableOpacity>
                </View>
                <SiteMiniMap
                  site={site}
                  userLocation={userLocation}
                  restaurants={topRestaurants}
                  onSelectRestaurant={(res) =>
                    onNavigateToRestaurant(res, site)
                  }
                  height={220}
                />
              </View>
            </View>
          )}

          {/* TAB 2: TƯ LIỆU ẢNH & VIDEO */}
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

              <View style={styles.mediaList}>
                {site.mediaGallery.map((media) => {
                  const captionText =
                    media.caption[selectedLanguage] || media.caption.vi;
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
                              source: media.yearOrSource,
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
                          <View style={styles.mediaTypeBadge}>
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
                          {media.yearOrSource}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* TAB 3: ẨM THỰC GẦN ĐÓ */}
          {activeTab === 'dining' && (
            <View style={styles.tabSection}>
              <View style={styles.sectionIntro}>
                <Text style={styles.sectionTitle}>
                  Ẩm thực nổi bật quanh {localized.name}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Sắp xếp theo đánh giá cao nhất và khoảng cách đi bộ từ di tích.
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

              {/* Mini map showing nearby restaurants */}
              <SiteMiniMap
                site={site}
                userLocation={userLocation}
                restaurants={topRestaurants}
                onSelectRestaurant={(res) => onNavigateToRestaurant(res, site)}
                height={195}
              />

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
                          source={{ uri: res.imageUrl }}
                          style={styles.restaurantThumb}
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
                                {res.rating.toFixed(1)}
                              </Text>
                              <Text style={styles.ratingCountText}>
                                ({res.reviewCount})
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.restaurantCuisine}>
                            {res.cuisine} · {res.priceRange}
                          </Text>

                          <Text
                            style={styles.restaurantDishes}
                            numberOfLines={2}
                          >
                            Món nổi bật: {res.specialtyDishes.join(' · ')}
                          </Text>
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
                          {res.openHours}
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
        </ScrollView>

        {/* Sticky Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => onStartNavigation(site)}
            style={styles.footerPrimaryBtn}
            activeOpacity={0.85}
          >
            <Navigation size={16} color={COLORS.white} />
            <Text style={styles.footerPrimaryText}>Dẫn đường</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onOpenPhotoCheckIn(site)}
            style={styles.footerSecondaryBtn}
            activeOpacity={0.8}
          >
            <Camera size={16} color={COLORS.ink} />
            <Text style={styles.footerSecondaryText}>Chụp ảnh lưu niệm</Text>
          </TouchableOpacity>
        </View>

        {/* Fullscreen Image Lightbox Modal */}
        <Modal
          visible={Boolean(lightboxMedia)}
          transparent
          animationType="fade"
          onRequestClose={() => setLightboxMedia(null)}
        >
          <SafeAreaView
            style={styles.lightboxBackdrop}
            edges={['top', 'bottom']}
          >
            <View style={styles.lightboxTopBar}>
              <Text style={styles.lightboxSource} numberOfLines={1}>
                {lightboxMedia?.source || 'Ảnh tư liệu'}
              </Text>
              <TouchableOpacity
                onPress={() => setLightboxMedia(null)}
                style={styles.lightboxCloseBtn}
                accessibilityLabel="Đóng ảnh phóng to"
                activeOpacity={0.75}
              >
                <X size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.lightboxBody}>
              {lightboxMedia && (
                <Image
                  source={{ uri: lightboxMedia.url }}
                  style={styles.lightboxImg}
                  resizeMode="contain"
                />
              )}
            </View>

            {lightboxMedia?.caption ? (
              <View style={styles.lightboxFooter}>
                <Text style={styles.lightboxCaption}>
                  {lightboxMedia.caption}
                </Text>
              </View>
            ) : null}
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  heroWrap: {
    height: 205,
    width: '100%',
    backgroundColor: COLORS.ink,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  heroScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 20, 19, 0.48)',
  },
  heroTopActions: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 30,
    elevation: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(20, 20, 19, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  heroBackPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  heroCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(20, 20, 19, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(20, 20, 19, 0.56)',
    gap: 5,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  heroMetaDot: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  heroBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADII.xs,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroBadgeAccent: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADII.xs,
    backgroundColor: COLORS.accent,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  heroTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 26,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    fontVariant: ['tabular-nums'],
  },
  tabsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.ink,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  tabLabelActive: {
    color: COLORS.ink,
    fontWeight: '700',
  },
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  tabSection: {
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm + 2,
    ...SHADOWS.card,
  },
  cardMuted: {
    backgroundColor: COLORS.surfaceTint,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm + 2,
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.inkMuted,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm + 2,
  },
  infoTextWrap: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
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
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
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
    fontSize: 12,
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
    fontSize: 11,
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
    paddingTop: 2,
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
    fontSize: 11,
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
    paddingVertical: 10,
    borderRadius: RADII.md,
    backgroundColor: COLORS.ink,
  },
  navRestaurantBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    ...SHADOWS.bar,
  },
  footerPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADII.md,
    backgroundColor: COLORS.accent,
  },
  footerPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  footerSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.bg,
  },
  footerSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  lightboxBackdrop: {
    flex: 1,
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
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
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
