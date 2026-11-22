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

    const statusTag = visitedRecord
      ? `Đã đi · ${formatWalkingDuration(visitedRecord.walkingDurationSeconds)}`
      : site.nationalSpecialMonument
        ? 'Di tích Quốc gia Đặc biệt'
        : site.unescoRecognized
          ? 'Di sản UNESCO'
          : null;

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onOpenDetail(site)}
        style={[styles.card, isActiveRouteTarget && styles.cardActive]}
        accessibilityRole="button"
        accessibilityLabel={`Xem chi tiết ${local.name}`}
      >
        {/* Clean Editorial Cover Photo */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: site.coverImage }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Top Overlay: At most 1 status pill (left) + 1 rating pill (right) */}
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
                {site.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Body: Generous whitespace, clear reading order */}
        <View style={styles.body}>
          {/* Line 1: Orientation (District · Walking time · Distance) */}
          <View style={styles.metaRow}>
            <Text style={styles.cityText} numberOfLines={1}>
              {site.city}
            </Text>
            <Text style={styles.dot}>·</Text>
            <View style={styles.walkInline}>
              <Footprints size={12} color={COLORS.accent} />
              <Text style={styles.walkText}>
                {formatWalkingDuration(estimatedWalkingSeconds)}
              </Text>
            </View>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.distanceText}>
              {formatDistance(distanceMeters)}
            </Text>
          </View>

          {/* Line 2: Editorial Title */}
          <Text style={styles.title} numberOfLines={2}>
            {local.name}
          </Text>

          {/* Line 3: Concise 1-line summary */}
          <Text style={styles.summary} numberOfLines={2}>
            {local.shortSummary}
          </Text>

          {/* Subtle inline food hint (no heavy box border) */}
          {bestRestaurant && (
            <View style={styles.foodLine}>
              <Utensils size={12} color={COLORS.inkMuted} />
              <Text style={styles.foodText} numberOfLines={1}>
                Quán ngon gần đó:{' '}
                <Text style={styles.foodName}>{bestRestaurant.name}</Text> (
                {bestRestaurant.rating.toFixed(1)}★)
              </Text>
            </View>
          )}

          {/* Clean Action Bar: 1 Primary CTA + 2 Compact Icon Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onOpenDetail(site)}
              style={styles.primaryBtn}
              accessibilityRole="button"
            >
              <Volume2 size={14} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>Thuyết minh & Tư liệu</Text>
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
                size={15}
                color={isActiveRouteTarget ? COLORS.white : COLORS.accent}
              />
              <Text
                style={[
                  styles.iconActionLabel,
                  isActiveRouteTarget && styles.iconActionLabelActive,
                ]}
              >
                Đi tới
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
      </TouchableOpacity>
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
    height: 172,
    backgroundColor: COLORS.surfaceMuted,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
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
    maxWidth: '72%',
  },
  statusPillVisited: {
    backgroundColor: 'rgba(4, 120, 87, 0.90)',
  },
  statusPillText: {
    fontFamily: SERIF_FONT,
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  ratingPillText: {
    fontFamily: SERIF_FONT,
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  body: {
    padding: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  cityText: {
    fontFamily: SERIF_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  dot: {
    fontFamily: SERIF_FONT,
    fontSize: 12,
    color: COLORS.borderStrong,
  },
  walkInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  walkText: {
    fontFamily: SERIF_FONT,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  distanceText: {
    fontFamily: SERIF_FONT,
    fontSize: 12,
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: COLORS.ink,
    marginTop: 5,
  },
  summary: {
    fontFamily: SERIF_FONT,
    fontSize: 13.5,
    lineHeight: 19,
    color: COLORS.inkSecondary,
    marginTop: 6,
  },
  foodLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
  },
  foodText: {
    fontFamily: SERIF_FONT,
    fontSize: 12,
    color: COLORS.inkMuted,
    flex: 1,
  },
  foodName: {
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 13,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.ink,
    height: 40,
    borderRadius: RADII.lg,
    paddingHorizontal: 12,
  },
  primaryBtnText: {
    fontFamily: SERIF_FONT,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 40,
    paddingHorizontal: 13,
    borderRadius: RADII.lg,
  },
  iconActionBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  iconActionLabel: {
    fontFamily: SERIF_FONT,
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  iconActionLabelActive: {
    color: COLORS.white,
  },
  iconOnlyBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
  },
});

export default SiteCard;
