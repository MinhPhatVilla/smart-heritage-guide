import React, { memo } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  Check,
  Footprints,
  Navigation,
  Star,
  Utensils,
  Volume2,
} from 'lucide-react-native';
import {
  HeritageSite,
  SupportedLanguage,
  VisitedSiteRecord,
} from '../types/heritage';
import { formatDistance, formatWalkingDuration } from '../utils/geoUtils';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export interface SiteCardProps {
  site: HeritageSite;
  index: number;
  distanceMeters: number;
  estimatedWalkingSeconds: number;
  selectedLanguage: SupportedLanguage;
  visitedRecord?: VisitedSiteRecord;
  isActiveRouteTarget?: boolean;
  onOpenDetail: (site: HeritageSite) => void;
  onStartNavigation: (site: HeritageSite) => void;
  onOpenPhotoCapture: (site: HeritageSite) => void;
}

export const SiteCard: React.FC<SiteCardProps> = memo(
  ({
    site,
    index,
    distanceMeters,
    estimatedWalkingSeconds,
    selectedLanguage,
    visitedRecord,
    isActiveRouteTarget = false,
    onOpenDetail,
    onStartNavigation,
    onOpenPhotoCapture,
  }) => {
    const local = site.translations[selectedLanguage] || site.translations.vi;
    const bestRestaurant =
      site.nearbyRestaurants.length > 0
        ? [...site.nearbyRestaurants].sort((a, b) => b.rating - a.rating)[0]
        : null;
    const badgeNum = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;

    return (
      <View
        style={[
          styles.card,
          isActiveRouteTarget && styles.cardActive,
        ]}
      >
        {/* Top Row: Thumbnail + Metadata */}
        <View style={styles.topRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onOpenDetail(site)}
            style={styles.thumbWrap}
            accessibilityRole="button"
            accessibilityLabel={`Xem chi tiết ${local.name}`}
          >
            <Image
              source={{ uri: site.coverImage }}
              style={styles.thumbImage}
              resizeMode="cover"
            />
            <View style={styles.indexBadge}>
              <Text style={styles.indexBadgeText}>{badgeNum}</Text>
            </View>
            {visitedRecord && (
              <View style={styles.visitedThumbBadge}>
                <Check size={10} color={COLORS.white} strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.contentCol}>
            {/* District + Era & Status Tag */}
            <View style={styles.metaTopRow}>
              <Text style={styles.districtText} numberOfLines={1}>
                {site.city} · {local.historicalEra}
              </Text>
            </View>

            {/* Status badges row */}
            {(site.nationalSpecialMonument || site.unescoRecognized || visitedRecord) && (
              <View style={styles.badgeRow}>
                {site.nationalSpecialMonument && (
                  <View style={styles.specialBadge}>
                    <Text style={styles.specialBadgeText}>
                      Di tích Quốc gia Đặc biệt
                    </Text>
                  </View>
                )}
                {!site.nationalSpecialMonument && site.unescoRecognized && (
                  <View style={styles.specialBadge}>
                    <Text style={styles.specialBadgeText}>UNESCO</Text>
                  </View>
                )}
                {visitedRecord && (
                  <View style={styles.visitedPill}>
                    <Check size={10} color={COLORS.visited} strokeWidth={2.5} />
                    <Text style={styles.visitedPillText}>
                      Đã đi {formatWalkingDuration(visitedRecord.walkingDurationSeconds)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Title */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onOpenDetail(site)}
            >
              <Text style={styles.title} numberOfLines={2}>
                {local.name}
              </Text>
            </TouchableOpacity>

            {/* Metrics Row: Walking time · Distance · Rating */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Footprints size={13} color={COLORS.accent} />
                <Text style={styles.metricHighlight}>
                  {formatWalkingDuration(estimatedWalkingSeconds)}
                </Text>
              </View>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.metricText}>
                {formatDistance(distanceMeters)}
              </Text>
              <Text style={styles.dot}>·</Text>
              <View style={styles.metricItem}>
                <Star
                  size={12}
                  color={COLORS.amberStar}
                  fill={COLORS.amberStar}
                />
                <Text style={styles.ratingText}>{site.rating.toFixed(1)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Short Summary Snippet */}
        <Text style={styles.summary} numberOfLines={2}>
          {local.shortSummary}
        </Text>

        {/* Top Nearby Restaurant Recommendation */}
        {bestRestaurant && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOpenDetail(site)}
            style={styles.foodBanner}
          >
            <View style={styles.foodLeft}>
              <Utensils size={12} color={COLORS.inkMuted} />
              <Text style={styles.foodLabel} numberOfLines={1}>
                Gần đó:{' '}
                <Text style={styles.foodName}>{bestRestaurant.name}</Text>
              </Text>
            </View>
            <View style={styles.foodRatingWrap}>
              <Star
                size={11}
                color={COLORS.amber}
                fill={COLORS.amberStar}
              />
              <Text style={styles.foodRating}>
                {bestRestaurant.rating.toFixed(1)}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onOpenDetail(site)}
            style={styles.primaryBtn}
            accessibilityRole="button"
          >
            <Volume2 size={14} color={COLORS.white} />
            <Text style={styles.primaryBtnText} numberOfLines={1}>
              Thuyết minh & Tư liệu
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onStartNavigation(site)}
            style={[
              styles.secondaryBtn,
              isActiveRouteTarget && styles.secondaryBtnActive,
            ]}
            accessibilityRole="button"
          >
            <Navigation size={14} color={COLORS.accent} />
            <Text style={styles.secondaryBtnText}>Dẫn đường</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOpenPhotoCapture(site)}
            style={styles.cameraBtn}
            accessibilityRole="button"
            accessibilityLabel="Lưu ảnh tại di tích"
          >
            <Camera size={14} color={COLORS.inkSecondary} />
            <Text style={styles.cameraBtnText}>Lưu ảnh</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    padding: SPACING.md + 2,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  cardActive: {
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  thumbWrap: {
    width: 88,
    height: 88,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  indexBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.overlayDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.xs,
  },
  indexBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  visitedThumbBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.visitedDot,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  contentCol: {
    flex: 1,
    minWidth: 0,
  },
  metaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  districtText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.inkSecondary,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  specialBadge: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.xs,
  },
  specialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  visitedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.visitedBg,
    borderWidth: 1,
    borderColor: COLORS.visitedBorder,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADII.xs,
  },
  visitedPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.visited,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontFamily: SERIF_FONT,
    fontSize: 15.5,
    fontWeight: '700',
    lineHeight: 21,
    color: COLORS.ink,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricHighlight: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  metricText: {
    fontSize: 12,
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.amber,
    fontVariant: ['tabular-nums'],
  },
  dot: {
    fontSize: 12,
    color: COLORS.inkMuted,
  },
  summary: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.inkSecondary,
    marginTop: SPACING.sm + 2,
  },
  foodBanner: {
    marginTop: SPACING.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  foodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  foodLabel: {
    fontSize: 11.5,
    color: COLORS.inkSecondary,
    flex: 1,
  },
  foodName: {
    fontWeight: '600',
    color: COLORS.ink,
  },
  foodRatingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.amberBg,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.sm,
  },
  foodRating: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.amber,
    fontVariant: ['tabular-nums'],
  },
  actionsRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.ink,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: RADII.md,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: RADII.md,
  },
  secondaryBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
  },
  secondaryBtnText: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: RADII.md,
  },
  cameraBtnText: {
    color: COLORS.inkSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SiteCard;
