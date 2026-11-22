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
  Clock,
  Footprints,
  MapPin,
  Navigation,
  Star,
  Ticket,
  Utensils,
  Volume2,
} from 'lucide-react-native';
import {
  HeritageSite,
  NearbyRestaurant,
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
  onNavigateToRestaurant?: (
    restaurant: NearbyRestaurant,
    parentSite: HeritageSite
  ) => void;
  onOpenPhotoCapture: (site: HeritageSite) => void;
}

export const SiteCard: React.FC<SiteCardProps> = memo(
  ({
    site,
    distanceMeters,
    estimatedWalkingSeconds,
    selectedLanguage,
    visitedRecord,
    isActiveRouteTarget = false,
    onOpenDetail,
    onStartNavigation,
    onNavigateToRestaurant,
    onOpenPhotoCapture,
  }) => {
    const local = site.translations?.[selectedLanguage] || site.translations?.vi || {
      name: site.id,
      shortSummary: '',
      historicalEra: '',
      openingHours: '07:00 – 18:00',
      architecturalHighlights: [],
      audioScript: [],
    };
    const nearbyList = Array.isArray(site.nearbyRestaurants)
      ? [...site.nearbyRestaurants].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      : [];
    const topFoodItems = nearbyList.slice(0, 2);

    const statusTag = visitedRecord
      ? `Đã đi · ${formatWalkingDuration(visitedRecord.walkingDurationSeconds)}`
      : site.nationalSpecialMonument
        ? 'Di tích Quốc gia Đặc biệt'
        : site.unescoRecognized
          ? 'Di sản UNESCO'
          : null;

    const safeRating = Number.isFinite(site.rating) ? site.rating : 4.7;
    const safeReviews = Number.isFinite(site.reviewCount) ? site.reviewCount : 0;

    return (
      <View style={[styles.card, isActiveRouteTarget && styles.cardActive]}>
        {/* Clickable Cover Photo + Info Header */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => onOpenDetail(site)}
          accessibilityRole="button"
          accessibilityLabel={`Xem chi tiết ${local.name}`}
        >
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: site.coverImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroBottomScrim} pointerEvents="none" />

            {/* Top Overlay: Status pill (left) + Rating pill (right) */}
            <View style={styles.heroTopOverlay}>
              {statusTag ? (
                <View
                  style={[
                    styles.statusPill,
                    visitedRecord && styles.statusPillVisited,
                  ]}
                >
                  {visitedRecord && (
                    <Check size={11} color={COLORS.white} strokeWidth={3} />
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
                {safeReviews > 0 && (
                  <Text style={styles.ratingCountText}>
                    ({safeReviews >= 1000 ? `${(safeReviews / 1000).toFixed(1)}k` : safeReviews})
                  </Text>
                )}
              </View>
            </View>

            {/* Bottom-Left Location Pill */}
            <View style={styles.heroLocationChip}>
              <MapPin size={11} color={COLORS.white} />
              <Text style={styles.heroLocationText} numberOfLines={1}>
                {site.city}
                {local.historicalEra ? ` · ${local.historicalEra}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.bodyTop}>
            <Text style={styles.title} numberOfLines={2}>
              {local.name}
            </Text>

            {/* 3 Scannable Quick-Info Pills: Walking · Opening Hours · Ticket */}
            <View style={styles.infoChipsRow}>
              <View style={styles.infoChipAccent}>
                <Footprints size={11.5} color={COLORS.accent} />
                <Text style={styles.infoChipAccentText}>
                  {formatWalkingDuration(estimatedWalkingSeconds)} ·{' '}
                  {formatDistance(distanceMeters)}
                </Text>
              </View>

              <View style={styles.infoChip}>
                <Clock size={11.5} color={COLORS.inkSecondary} />
                <Text style={styles.infoChipText} numberOfLines={1}>
                  {local.openingHours || '07:00 – 18:00'}
                </Text>
              </View>

              <View style={styles.infoChip}>
                <Ticket size={11.5} color={COLORS.inkSecondary} />
                <Text style={styles.infoChipText} numberOfLines={1}>
                  {site.ticketPrice || 'Miễn phí'}
                </Text>
              </View>
            </View>

            <Text style={styles.summary} numberOfLines={2}>
              {local.shortSummary}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Visible Nearby Food & Drink Box (Interactive — up to 2 top eateries!) */}
        {topFoodItems.length > 0 && (
          <View style={styles.foodBox}>
            <View style={styles.foodBoxHeader}>
              <View style={styles.foodBoxHeaderLeft}>
                <Utensils size={12} color={COLORS.accent} />
                <Text style={styles.foodBoxTitle}>
                  Quán ăn & đồ uống gần đây ({nearbyList.length})
                </Text>
              </View>
              {nearbyList.length > 2 && (
                <TouchableOpacity
                  onPress={() => onOpenDetail(site)}
                  hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                >
                  <Text style={styles.foodBoxMore}>Xem hết</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.foodItemList}>
              {topFoodItems.map((res) => (
                <View key={res.id} style={styles.foodRow}>
                  <View style={styles.foodRowInfo}>
                    <View style={styles.foodNameLine}>
                      <Text style={styles.foodName} numberOfLines={1}>
                        {res.name}
                      </Text>
                      <View style={styles.foodStarChip}>
                        <Star
                          size={9.5}
                          color={COLORS.amberStar}
                          fill={COLORS.amberStar}
                        />
                        <Text style={styles.foodStarText}>
                          {(res.rating ?? 4.5).toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.foodSub} numberOfLines={1}>
                      {res.cuisine}
                      {res.priceRange ? ` · ${res.priceRange}` : ''}
                    </Text>
                  </View>

                  {onNavigateToRestaurant && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => onNavigateToRestaurant(res, site)}
                      style={styles.foodGoBtn}
                      accessibilityLabel={`Dẫn đường tới ${res.name}`}
                    >
                      <Navigation size={11} color={COLORS.accent} />
                      <Text style={styles.foodGoText}>Đi tới</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Clean Action Bar */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onOpenDetail(site)}
            style={styles.primaryBtn}
            accessibilityRole="button"
          >
            <Volume2 size={14} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>Chi tiết & Thuyết minh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onStartNavigation(site)}
            style={[
              styles.iconActionBtn,
              isActiveRouteTarget && styles.iconActionBtnActive,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Dẫn đường tới ${local.name}`}
          >
            <Navigation
              size={14}
              color={isActiveRouteTarget ? COLORS.white : COLORS.accent}
            />
            <Text
              style={[
                styles.iconActionLabel,
                isActiveRouteTarget && styles.iconActionLabelActive,
              ]}
            >
              Dẫn đường
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onOpenPhotoCapture(site)}
            style={styles.iconOnlyBtn}
            accessibilityRole="button"
            accessibilityLabel={`Chụp ảnh tại ${local.name}`}
          >
            <Camera size={16} color={COLORS.inkSecondary} />
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardActive: {
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },
  heroWrap: {
    width: '100%',
    height: 176,
    backgroundColor: COLORS.surfaceMuted,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 62,
    backgroundColor: 'rgba(20, 20, 19, 0.34)',
  },
  heroTopOverlay: {
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
    backgroundColor: 'rgba(20, 20, 19, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    maxWidth: '68%',
  },
  statusPillVisited: {
    backgroundColor: 'rgba(4, 120, 87, 0.92)',
  },
  statusPillText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(250, 249, 246, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  ratingPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  ratingCountText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  heroLocationChip: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroLocationText: {
    color: COLORS.white,
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  bodyTop: {
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: COLORS.ink,
  },
  infoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  infoChipAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADII.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  infoChipAccentText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    fontVariant: ['tabular-nums'],
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  infoChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkSecondary,
    flexShrink: 1,
  },
  summary: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.inkSecondary,
    marginTop: 9,
  },
  foodBox: {
    marginHorizontal: 15,
    marginBottom: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    gap: 8,
  },
  foodBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  foodBoxHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  foodBoxTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  foodBoxMore: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.accent,
  },
  foodItemList: {
    gap: 7,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceMuted,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  foodRowInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  foodNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  foodName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
    flexShrink: 1,
  },
  foodStarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.amberBg,
    borderRadius: RADII.pill,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  foodStarText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  foodSub: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  foodGoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADII.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  foodGoText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
    paddingBottom: 14,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.ink,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 12.5,
    fontWeight: '700',
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADII.pill,
  },
  iconActionBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  iconActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  iconActionLabelActive: {
    color: COLORS.white,
  },
  iconOnlyBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
