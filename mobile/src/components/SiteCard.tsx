import React, { memo, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Bike,
  Camera,
  Check,
  Footprints,
  Headphones,
  Navigation,
  Star,
} from 'lucide-react-native';
import {
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
} from '../utils/geoUtils';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export interface SiteCardProps {
  site: HeritageSite;
  index: number;
  distanceMeters: number;
  estimatedWalkingSeconds: number;
  selectedLanguage: SupportedLanguage;
  visitedRecord?: VisitedSiteRecord;
  isActiveRouteTarget?: boolean;
  isGridItem?: boolean;
  onOpenDetail: (site: HeritageSite) => void;
  onStartNavigation: (site: HeritageSite) => void;
  onNavigateToRestaurant?: (
    restaurant: NearbyRestaurant,
    parentSite: HeritageSite
  ) => void;
  onOpenPhotoCapture: (site: HeritageSite) => void;
}

const MOTORBIKE_THRESHOLD_METERS = 3500;

export const SiteCard: React.FC<SiteCardProps> = memo(
  ({
    site,
    distanceMeters,
    estimatedWalkingSeconds,
    selectedLanguage,
    visitedRecord,
    isActiveRouteTarget = false,
    isGridItem = false,
    onOpenDetail,
    onStartNavigation,
    onOpenPhotoCapture,
  }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.985,
        useNativeDriver: Platform.OS !== 'web',
        speed: 32,
        bounciness: 0,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: Platform.OS !== 'web',
        speed: 24,
        bounciness: 4,
      }).start();
    };

    const local = site.translations?.[selectedLanguage] ||
      site.translations?.vi || {
        name: site.id,
        shortSummary: '',
        historicalEra: '',
        openingHours: '07:00 – 18:00',
        architecturalHighlights: [],
        audioScript: [],
      };

    const userReviewedStars =
      visitedRecord && Number.isFinite(visitedRecord.userRating)
        ? Math.max(1, Math.min(5, Math.round(visitedRecord.userRating)))
        : null;

    const statusTag = visitedRecord
      ? userReviewedStars
        ? `Bạn đánh giá ${userReviewedStars}★`
        : 'Đã check-in'
      : site.nationalSpecialMonument
        ? 'Di tích QG Đặc biệt'
        : site.unescoRecognized
          ? 'Di sản UNESCO'
          : null;

    const safeRating = Number.isFinite(site.rating) ? site.rating : 4.7;
    const useMotorbikeEstimate = distanceMeters > MOTORBIKE_THRESHOLD_METERS;
    const travelTimeLabel = useMotorbikeEstimate
      ? `~${formatTravelDuration(
          estimateTravelSeconds(distanceMeters, 'motorbike'),
          'motorbike'
        )}`
      : `~${formatWalkingDuration(estimatedWalkingSeconds)}`;

    const shortDistrict = site.district || site.city.split('·')[0].trim();

    return (
      <Animated.View
        style={[
          styles.card,
          isGridItem && styles.cardGrid,
          isActiveRouteTarget && styles.cardActive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Pressable
          onPress={() => onOpenDetail(site)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={`Xem chi tiết và thuyết minh ${local.name}`}
          style={styles.cardMainPressable}
        >
          {/* Clean Editorial Photo (max 1 left badge + 1 right rating pill) */}
          <View style={[styles.heroWrap, isGridItem && styles.heroWrapGrid]}>
            <Image
              source={{ uri: site.coverImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroTopRow}>
              {statusTag ? (
                <View
                  style={[
                    styles.statusPill,
                    visitedRecord && styles.statusPillVisited,
                  ]}
                >
                  {visitedRecord && (
                    <Check size={11} color={COLORS.white} strokeWidth={2.6} />
                  )}
                  <Text style={styles.statusPillText} numberOfLines={1}>
                    {statusTag}
                  </Text>
                </View>
              ) : (
                <View />
              )}

              <View style={styles.ratingPill}>
                <Star
                  size={11}
                  color={COLORS.amberStar}
                  fill={COLORS.amberStar}
                />
                <Text style={styles.ratingPillText}>
                  {safeRating.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>

          {/* Minimalist 2-Line Editorial Content Block (zero text clutter) */}
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>
              {local.name}
            </Text>

            <View style={styles.metaRow}>
              <Text style={styles.cityText} numberOfLines={1}>
                {shortDistrict}
              </Text>
              <Text style={styles.dot}>·</Text>
              {useMotorbikeEstimate ? (
                <Bike size={12.5} color={COLORS.accentDeep} strokeWidth={2} />
              ) : (
                <Footprints
                  size={12}
                  color={COLORS.accentDeep}
                  strokeWidth={2}
                />
              )}
              <Text style={styles.walkText} numberOfLines={1}>
                {travelTimeLabel} ({formatDistance(distanceMeters)})
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Clean Action Row (40px+ WCAG / Apple HIG touch targets) */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.84}
            onPress={() => onOpenDetail(site)}
            style={styles.primaryBtn}
            accessibilityRole="button"
            accessibilityLabel={`Chi tiết và thuyết minh ${local.name}`}
          >
            <Headphones size={14} color={COLORS.white} strokeWidth={2} />
            <Text style={styles.primaryBtnText} numberOfLines={1}>
              Chi tiết &amp; Thuyết minh
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onStartNavigation(site)}
            style={[
              styles.iconActionBtn,
              styles.iconActionBtnJade,
              isActiveRouteTarget && styles.iconActionBtnActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Dẫn đường tới ${local.name}`}
          >
            <Navigation
              size={15}
              color={isActiveRouteTarget ? COLORS.white : COLORS.accentDeep}
              strokeWidth={2}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOpenPhotoCapture(site)}
            style={styles.iconActionBtn}
            accessibilityRole="button"
            accessibilityLabel={`Chụp ảnh check-in tại ${local.name}`}
          >
            <Camera size={15} color={COLORS.inkSecondary} strokeWidth={1.9} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }
);

SiteCard.displayName = 'SiteCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    marginBottom: 14,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardGrid: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
    justifyContent: 'space-between',
  },
  cardActive: {
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },
  cardMainPressable: {
    flexGrow: 1,
  },
  heroWrap: {
    width: '100%',
    height: 176,
    backgroundColor: COLORS.surfaceMuted,
    position: 'relative',
  },
  heroWrapGrid: {
    height: 164,
  },
  heroImage: {
    width: '100%',
    height: '100%',
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(21, 94, 86, 0.90)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: RADII.pill,
    maxWidth: '72%',
  },
  statusPillVisited: {
    backgroundColor: 'rgba(15, 118, 110, 0.92)',
  },
  statusPillText: {
    color: COLORS.white,
    fontSize: 10.5,
    fontWeight: '700',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: RADII.pill,
  },
  ratingPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 11,
    gap: 6,
  },
  title: {
    fontFamily: SERIF_FONT,
    fontSize: 16.5,
    fontWeight: '700',
    lineHeight: 22,
    color: COLORS.ink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cityText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkSecondary,
    flexShrink: 1,
  },
  dot: {
    fontSize: 12,
    color: COLORS.borderStrong,
  },
  walkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentDeep,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  primaryBtn: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 12.5,
    fontWeight: '700',
  },
  iconActionBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionBtnJade: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentBorder,
  },
  iconActionBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
});
