import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bike,
  Car,
  Clock,
  CloudSun,
  Droplets,
  Footprints,
  Navigation,
  Route,
  Sparkles,
  Umbrella,
  Utensils,
  WifiOff,
  X,
} from 'lucide-react-native';
import {
  HeritageCategory,
  HeritageSite,
  SupportedLanguage,
  TRAVEL_MODE_OPTIONS,
  TravelMode,
} from '../types/heritage';
import {
  TourPlanResponse,
  TourStopItem,
  fetchSmartTourPlan,
} from '../services/aiService';
import {
  WeatherSnapshot,
  toWeatherContextPayload,
} from '../services/weatherService';
import { formatDistance } from '../utils/geoUtils';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export interface SmartTourModalProps {
  visible: boolean;
  userLocation: [number, number];
  selectedLanguage: SupportedLanguage;
  visitedSiteIds: string[];
  allSites: HeritageSite[];
  weather?: WeatherSnapshot | null;
  initialTravelMode?: TravelMode;
  onClose: () => void;
  onStartNavigateStop: (site: HeritageSite, travelMode?: TravelMode) => void;
  onSelectSite: (site: HeritageSite) => void;
}

const TIME_BUDGET_OPTIONS = [60, 90, 120, 180] as const;

const CATEGORY_OPTIONS: Array<{ id: HeritageCategory; label: string }> = [
  { id: 'monument', label: 'Di tích & Biểu tượng' },
  { id: 'museum', label: 'Bảo tàng' },
  { id: 'temple', label: 'Đền Chùa' },
  { id: 'imperial', label: 'Dinh thự & Lăng' },
  { id: 'ancient_town', label: 'Chợ cổ & Sinh quyển' },
];

export const SmartTourModal: React.FC<SmartTourModalProps> = ({
  visible,
  userLocation,
  selectedLanguage,
  visitedSiteIds,
  allSites,
  weather = null,
  initialTravelMode = 'walking',
  onClose,
  onStartNavigateStop,
  onSelectSite,
}) => {
  const [travelMode, setTravelMode] = useState<TravelMode>(initialTravelMode);
  const [availableMinutes, setAvailableMinutes] = useState<number>(120);
  const [selectedCategories, setSelectedCategories] = useState<
    HeritageCategory[]
  >([]);
  const [includeMealStop, setIncludeMealStop] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [plan, setPlan] = useState<TourPlanResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOfflineError, setIsOfflineError] = useState<boolean>(false);

  const toggleCategory = (cat: HeritageCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleGenerateTour = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setIsOfflineError(false);

    const res = await fetchSmartTourPlan({
      lat: userLocation[0],
      lng: userLocation[1],
      available_minutes: availableMinutes,
      start_hour: new Date().getHours(),
      preferred_categories: selectedCategories,
      visited_site_ids: visitedSiteIds,
      include_meal_stop: includeMealStop,
      language: selectedLanguage,
      max_stops: availableMinutes >= 150 ? 6 : 4,
      travel_mode: travelMode,
      weather_context: toWeatherContextPayload(weather),
    });

    setIsLoading(false);

    if (res.ok) {
      setPlan(res.data);
    } else {
      setErrorMsg(res.error);
      setIsOfflineError(res.isOffline);
    }
  };

  const firstHeritageStop: TourStopItem | undefined = plan?.stops.find(
    (s) => s.stop_type === 'heritage'
  );
  const firstHeritageSite = firstHeritageStop
    ? allSites.find((s) => s.id === firstHeritageStop.site_id)
    : undefined;

  const handleStartFirstStop = () => {
    if (!firstHeritageSite) return;
    onClose();
    onStartNavigateStop(firstHeritageSite, plan?.travel_mode || travelMode);
  };

  const activePlanMode: TravelMode = plan?.travel_mode || travelMode;
  const activeModeMeta =
    TRAVEL_MODE_OPTIONS.find((m) => m.id === activePlanMode) ||
    TRAVEL_MODE_OPTIONS[0];

  const handleOpenStopDetail = (stop: TourStopItem) => {
    const matched = allSites.find((s) => s.id === stop.site_id);
    if (!matched) return;
    onClose();
    onSelectSite(matched);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleCol}>
            <View style={styles.eyebrowRow}>
              <Sparkles size={12} color={COLORS.accent} />
              <Text style={styles.eyebrow}>
                SMART AI · EXPLAINABLE + 2-OPT TOUR PLANNER
              </Text>
            </View>
            <Text style={styles.headerTitle}>Lập Lịch Trình AI</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="Đóng lập tour AI"
            activeOpacity={0.75}
          >
            <X size={20} color={COLORS.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Live Weather Context Banner for AI Planning */}
          {weather && (
            <View style={styles.weatherContextBanner}>
              <View style={styles.weatherContextTop}>
                <CloudSun size={15} color={COLORS.accent} />
                <Text style={styles.weatherContextTitle}>
                  Ngữ cảnh thời tiết thực tế gửi cho AI: {Math.round(weather.temperatureC)}°C · {weather.conditionLabelVi}
                </Text>
              </View>
              <View style={styles.weatherContextMetrics}>
                <View style={styles.weatherContextChip}>
                  <Droplets size={11} color={COLORS.gpsBlue} />
                  <Text style={styles.weatherContextChipText}>
                    Độ ẩm {weather.humidityPercent}%
                  </Text>
                </View>
                <View style={styles.weatherContextChip}>
                  <Umbrella size={11} color={COLORS.accent} />
                  <Text style={styles.weatherContextChipText}>
                    Mưa {weather.rainProbabilityPercent}% (3h tới: {weather.next3HoursRainMaxPercent}%)
                  </Text>
                </View>
              </View>
              <Text style={styles.weatherContextHint}>
                {weather.aiTourAdvice.headlineVi} — {weather.aiTourAdvice.detailVi}
              </Text>
            </View>
          )}

          {/* Configuration Card */}
          <View style={styles.configCard}>
            <Text style={styles.sectionLabel}>1. Phương tiện di chuyển</Text>
            <View style={styles.budgetRow}>
              {TRAVEL_MODE_OPTIONS.map((opt) => {
                const active = travelMode === opt.id;
                const iconColor = active ? COLORS.white : COLORS.inkSecondary;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setTravelMode(opt.id)}
                    style={[styles.budgetChip, active && styles.budgetChipActive]}
                    activeOpacity={0.8}
                  >
                    {opt.id === 'walking' ? (
                      <Footprints size={13} color={iconColor} />
                    ) : opt.id === 'motorbike' ? (
                      <Bike size={13} color={iconColor} />
                    ) : (
                      <Car size={13} color={iconColor} />
                    )}
                    <Text
                      style={[
                        styles.budgetChipText,
                        active && styles.budgetChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>2. Quỹ thời gian rảnh của bạn</Text>
            <View style={styles.budgetRow}>
              {TIME_BUDGET_OPTIONS.map((mins) => {
                const active = availableMinutes === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => setAvailableMinutes(mins)}
                    style={[styles.budgetChip, active && styles.budgetChipActive]}
                    activeOpacity={0.8}
                  >
                    <Clock
                      size={13}
                      color={active ? COLORS.white : COLORS.inkSecondary}
                    />
                    <Text
                      style={[
                        styles.budgetChipText,
                        active && styles.budgetChipTextActive,
                      ]}
                    >
                      {mins} phút
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>
              3. Sở thích di sản (để trống = chọn cân bằng)
            </Text>
            <View style={styles.categoryWrap}>
              {CATEGORY_OPTIONS.map((cat) => {
                const active = selectedCategories.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id)}
                    style={[styles.catChip, active && styles.catChipActive]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        active && styles.catChipTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.mealToggleRow}>
              <View style={styles.mealToggleTextCol}>
                <View style={styles.mealLabelRow}>
                  <Utensils size={14} color={COLORS.accent} />
                  <Text style={styles.mealLabel}>Tự động chèn điểm ẩm thực</Text>
                </View>
                <Text style={styles.mealHint}>
                  Chọn quán ngon gần lộ trình phù hợp khung giờ ăn hiện tại
                </Text>
              </View>
              <Switch
                value={includeMealStop}
                onValueChange={setIncludeMealStop}
                trackColor={{ false: COLORS.borderStrong, true: COLORS.ink }}
                thumbColor={COLORS.white}
              />
            </View>

            <TouchableOpacity
              onPress={handleGenerateTour}
              disabled={isLoading}
              style={[
                styles.generateBtn,
                isLoading && styles.generateBtnDisabled,
              ]}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Route size={16} color={COLORS.white} />
              )}
              <Text style={styles.generateBtnText}>
                {isLoading
                  ? 'Đang tối ưu lộ trình 2-Opt...'
                  : `Tạo lịch trình (${TRAVEL_MODE_OPTIONS.find((m) => m.id === travelMode)?.label || 'Đi bộ'})`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error / Offline Banner */}
          {errorMsg && (
            <View style={styles.errorCard}>
              <View style={styles.errorHeader}>
                <WifiOff size={15} color={COLORS.accent} />
                <Text style={styles.errorTitle}>
                  {isOfflineError
                    ? 'Đang ở chế độ Offline'
                    : 'Không tạo được lịch trình'}
                </Text>
              </View>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Optimized Plan Result */}
          {plan && (
            <View style={styles.resultSection}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>
                  Lộ trình đề xuất ({plan.total_sites} di tích
                  {plan.meal_stop_included ? ' + 1 bữa ăn' : ''})
                </Text>
                <Text style={styles.summarySubtitle}>{plan.summary}</Text>

                <View style={styles.kpiRow}>
                  <View style={styles.kpiPill}>
                    <Text style={styles.kpiLabel}>Tổng thời lượng</Text>
                    <Text style={styles.kpiValue}>
                      {plan.total_duration_minutes} phút
                    </Text>
                  </View>
                  <View style={styles.kpiPill}>
                    <Text style={styles.kpiLabel}>{activeModeMeta.label}</Text>
                    <Text style={styles.kpiValue}>
                      {formatDistance(plan.total_walking_meters)} ·{' '}
                      {plan.total_walking_minutes}p
                    </Text>
                  </View>
                </View>

                <View style={styles.optBanner}>
                  <Sparkles size={13} color={COLORS.visited} />
                  <Text style={styles.optBannerText}>
                    {plan.distance_saved_meters > 0
                      ? `Thuật toán 2-Opt giúp rút ngắn ${formatDistance(
                          plan.distance_saved_meters
                        )} quãng đường di chuyển.`
                      : `Thứ tự di chuyển đã đạt tối ưu bằng Nearest-Neighbor + 2-Opt.`}
                  </Text>
                </View>
              </View>

              {/* Stop Timeline */}
              <View style={styles.timelineList}>
                {plan.stops.map((stop) => {
                  const isMeal = stop.stop_type === 'meal';
                  return (
                    <TouchableOpacity
                      key={`${stop.order}-${stop.site_id}`}
                      activeOpacity={isMeal ? 1 : 0.8}
                      onPress={() => !isMeal && handleOpenStopDetail(stop)}
                      style={[styles.stopCard, isMeal && styles.stopCardMeal]}
                    >
                      <View style={styles.stopTopRow}>
                        <View
                          style={[
                            styles.orderCircle,
                            isMeal && styles.orderCircleMeal,
                          ]}
                        >
                          {isMeal ? (
                            <Utensils size={13} color={COLORS.white} />
                          ) : (
                            <Text style={styles.orderText}>{stop.order}</Text>
                          )}
                        </View>

                        <View style={styles.stopMain}>
                          <View style={styles.stopTimeRow}>
                            <Text style={styles.stopTime}>
                              {stop.arrival_time} – {stop.departure_time}
                            </Text>
                            <Text style={styles.stopStay}>
                              ({stop.stay_minutes} phút)
                            </Text>
                            {!isMeal && stop.score > 0 && (
                              <View style={styles.scoreBadge}>
                                <Text style={styles.scoreBadgeText}>
                                  AI {Math.round(stop.score * 100)}%
                                </Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.stopName}>{stop.name}</Text>

                          <View style={styles.walkLegRow}>
                            {activePlanMode === 'walking' ? (
                              <Footprints size={12} color={COLORS.accent} />
                            ) : activePlanMode === 'motorbike' ? (
                              <Bike size={12} color={COLORS.accent} />
                            ) : (
                              <Car size={12} color={COLORS.accent} />
                            )}
                            <Text style={styles.walkLegText}>
                              {activeModeMeta.label} chặng này:{' '}
                              {formatDistance(stop.walk_from_prev_meters)} (~
                              {stop.walk_from_prev_minutes} phút)
                            </Text>
                          </View>

                          {isMeal && stop.specialty_dishes.length > 0 && (
                            <Text style={styles.dishesText}>
                              Món gợi ý: {stop.specialty_dishes.join(' · ')}
                            </Text>
                          )}

                          {stop.reasons.length > 0 && (
                            <View style={styles.reasonsWrap}>
                              {stop.reasons.map((reason, rIdx) => (
                                <View key={rIdx} style={styles.reasonChip}>
                                  <Text style={styles.reasonText}>
                                    {reason}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer CTA to Start Navigating the First Stop */}
        {firstHeritageSite && (
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleStartFirstStop}
              style={styles.startTourBtn}
              activeOpacity={0.85}
            >
              <Navigation size={16} color={COLORS.white} />
              <Text style={styles.startTourBtnText} numberOfLines={1}>
                Bắt đầu dẫn đường điểm 1: {firstHeritageStop?.name}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitleCol: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: COLORS.accent,
  },
  headerTitle: {
    marginTop: 2,
    fontFamily: SERIF_FONT,
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.ink,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  configCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  weatherContextBanner: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: 12,
    gap: 7,
    ...SHADOWS.card,
  },
  weatherContextTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  weatherContextTitle: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  weatherContextMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  weatherContextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bg,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  weatherContextChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  weatherContextHint: {
    fontSize: 11.5,
    lineHeight: 16.5,
    color: COLORS.inkSecondary,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  budgetChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  budgetChipActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  budgetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  budgetChipTextActive: {
    color: COLORS.white,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  catChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  catChipActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentBorder,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.inkSecondary,
  },
  catChipTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  mealToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  mealToggleTextCol: {
    flex: 1,
    gap: 2,
  },
  mealLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  mealHint: {
    fontSize: 11.5,
    color: COLORS.inkMuted,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: RADII.md,
  },
  generateBtnDisabled: {
    opacity: 0.65,
  },
  generateBtnText: {
    color: COLORS.white,
    fontSize: 13.5,
    fontWeight: '700',
  },
  errorCard: {
    backgroundColor: COLORS.amberBg,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    gap: 4,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  errorText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.inkSecondary,
  },
  resultSection: {
    gap: SPACING.md,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  summaryTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
  },
  summarySubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.inkSecondary,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  kpiPill: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.md,
    padding: SPACING.sm + 2,
    gap: 2,
  },
  kpiLabel: {
    fontSize: 10.5,
    color: COLORS.inkMuted,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  optBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.visitedBg,
    borderWidth: 1,
    borderColor: COLORS.visitedBorder,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
  },
  optBannerText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.visited,
  },
  timelineList: {
    gap: SPACING.sm + 2,
  },
  stopCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  stopCardMeal: {
    backgroundColor: COLORS.amberBg,
    borderColor: COLORS.amberBorder,
  },
  stopTopRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  orderCircle: {
    width: 28,
    height: 28,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  orderCircleMeal: {
    backgroundColor: COLORS.amber,
  },
  orderText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  stopMain: {
    flex: 1,
    gap: 4,
  },
  stopTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  stopTime: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
    fontVariant: ['tabular-nums'],
  },
  stopStay: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  scoreBadge: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.xs,
  },
  scoreBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.ink,
  },
  stopName: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  walkLegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  walkLegText: {
    fontSize: 11.5,
    color: COLORS.inkSecondary,
  },
  dishesText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.ink,
  },
  reasonsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 4,
  },
  reasonChip: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reasonText: {
    fontSize: 11,
    color: COLORS.inkSecondary,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    ...SHADOWS.bar,
  },
  startTourBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.ink,
    paddingVertical: 13,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.md,
  },
  startTourBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
});
