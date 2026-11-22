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
    const local = site.translations?.[selectedLanguage] ||
      site.translations?.vi || {
        name: site.id,
        shortSummary: '',
        historicalEra: '',
        openingHours: '07:00 – 18:00',
        architecturalHighlights: [],
        audioScript: [],
      };

    const nearbyList = Array.isArray(site.nearbyRestaurants)
      ? [...site.nearbyRestaurants].sort(
          (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
        )
      : [];
    const topFood = nearbyList[0] || null;

    const statusTag = visitedRecord
      ? 'Đã check-in'
      : site.nationalSpecialMonument
        ? 'Di tích QG Đặc biệt'
        : site.unescoRecognized
          ? 'Di sản UNESCO'
          : null;

    const safeRating = Number.isFinite(site.rating) ? site.rating : 4.7;

    return (
      <View style={[styles.card, isActiveRouteTarget && styles.cardActive]}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => onOpenDetail(site)}
          accessibilityRole="button"
          accessibilityLabel={`Xem chi tiết ${local.name}`}
        >
          {/* Clean Editorial Photo (max 1 left status pill + 1 right rating pill) */}
          <View style={styles.heroWrap}>
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
                    <Check size={10.5} color={COLORS.white} strokeWidth={3} />
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

          {/* Clean, Airy Content Block (4 effortless lines, zero clutter) */}
          <View style={styles.body}>
            {/* Line 1: Location & Distance */}
            <View style={styles.metaRow}>
              <Text style={styles.cityText} numberOfLines={1}>
                {site.city}
              </Text>
              <Text style={styles.dot}>·</Text>
              <Footprints size={11.5} color={COLORS.accent} />
              <Text style={styles.walkText}>
                {formatWalkingDuration(estimatedWalkingSeconds)} ({formatDistance(distanceMeters)})
              </Text>
            </View>

            {/* Line 2: Clear Title */}
            <Text style={styles.title} numberOfLines={2}>
              {local.name}
            </Text>

            {/* Line 3: Concise 2-line Summary */}
            <Text style={styles.summary} numberOfLines={2}>
              {local.shortSummary}
            </Text>

            {/* Line 4: Subtle Practical Details (Hours · Ticket) */}
            <View style={styles.practicalRow}>
              <View style={styles.practicalItem}>
                <Clock size={11.5} color={COLORS.inkMuted} />
                <Text style={styles.practicalText} numberOfLines={1}>
                  {local.openingHours || '07:00 – 18:00'}
                </Text>
              </View>
              <Text style={styles.dot}>·</Text>
              <View style={styles.practicalItem}>
                <Ticket size={11.5} color={COLORS.inkMuted} />
                <Text style={styles.practicalText} numberOfLines={1}>
                  {site.ticketPrice || 'Miễn phí'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Subtle 1-Line Nearby Eatery Strip (tappable to navigate, zero bulky nested cards) */}
        {topFood && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              onNavigateToRestaurant
                ? onNavigateToRestaurant(topFood, site)
                : onOpenDetail(site)
            }
            style={styles.foodStrip}
          >
            <Utensils size={12} color={COLORS.accent} />
            <Text style={styles.foodStripText} numberOfLines={1}>
              Gần đây: <Text style={styles.foodStripName}>{topFood.name}</Text>{' '}
              ({(topFood.rating ?? 4.5).toFixed(1)}★
              {nearbyList.length > 1 ? ` · +${nearbyList.length - 1} quán` : ''})
            </Text>
            <Text style={styles.foodStripCta}>Đi tới</Text>
          </TouchableOpacity>
        )}

        {/* Clean Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onOpenDetail(site)}
            style={styles.primaryBtn}
            accessibilityRole="button"
          >
            <Volume2 size={14} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>Chi tiết & Nghe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onStartNavigation(site)}
            style={[
              styles.secondaryBtn,
              isActiveRouteTarget && styles.secondaryBtnActive,
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
                styles.secondaryBtnText,
                isActiveRouteTarget && styles.secondaryBtnTextActive,
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
    marginBottom: 14,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardActive: {
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },
  heroWrap: {
    width: '100%',
    height: 164,
    backgroundColor: COLORS.surfaceMuted,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTopRow: {
    position: 'absolute',
    top: 11,
    left: 11,
    right: 11,
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
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    maxWidth: '70%',
  },
  statusPillVisited: {
    backgroundColor: 'rgba(4, 120, 87, 0.92)',
  },
  statusPillText: {
    color: COLORS.white,
    fontSize: 10.5,
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
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cityText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.inkMuted,
    flexShrink: 1,
  },
  dot: {
    fontSize: 11,
    color: COLORS.borderStrong,
  },
  walkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontFamily: SERIF_FONT,
    fontSize: 17.5,
    fontWeight: '700',
    lineHeight: 23,
    color: COLORS.ink,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18.5,
    color: COLORS.inkSecondary,
  },
  practicalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  practicalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  practicalText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: COLORS.inkMuted,
    flexShrink: 1,
  },
  foodStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 14,
    marginBottom: 11,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.surfaceMuted,
  },
  foodStripText: {
    flex: 1,
    fontSize: 11.5,
    color: COLORS.inkSecondary,
  },
  foodStripName: {
    fontWeight: '700',
    color: COLORS.ink,
  },
  foodStripCta: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 13,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.ink,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 12.5,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 12,
    paddingVertical: 9.5,
    borderRadius: RADII.pill,
  },
  secondaryBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  secondaryBtnTextActive: {
    color: COLORS.white,
  },
  iconOnlyBtn: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
