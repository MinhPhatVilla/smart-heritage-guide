import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  RefreshCw,
  Sparkles,
  Sun,
  Umbrella,
  Wind,
} from 'lucide-react-native';
import {
  WeatherConditionKind,
  WeatherSnapshot,
} from '../services/weatherService';
import { COLORS, RADII, SHADOWS } from '../theme';

export interface WeatherWidgetCardProps {
  weather: WeatherSnapshot | null;
  locationLabel: string;
  isLoading: boolean;
  onRefresh: () => void;
  onPlanTourWithWeather: () => void;
}

function renderWeatherIcon(kind: WeatherConditionKind, size = 18) {
  switch (kind) {
    case 'sunny':
      return <Sun size={size} color="#D97706" />;
    case 'partly_cloudy':
      return <CloudSun size={size} color={COLORS.accent} />;
    case 'cloudy':
      return <Cloud size={size} color={COLORS.inkSecondary} />;
    case 'rain':
      return <CloudRain size={size} color={COLORS.gpsBlue} />;
    case 'storm':
      return <CloudLightning size={size} color={COLORS.accent} />;
    default:
      return <CloudSun size={size} color={COLORS.accent} />;
  }
}

function formatUpdatedClock(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '--:--';
  }
}

export const WeatherWidgetCard: React.FC<WeatherWidgetCardProps> = ({
  weather,
  locationLabel,
  isLoading,
  onRefresh,
  onPlanTourWithWeather,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  if (!weather) {
    return (
      <View style={styles.compactBar}>
        <ActivityIndicator size="small" color={COLORS.accent} />
        <Text style={styles.loadingText} numberOfLines={1}>
          Đang cập nhật thời tiết tại {locationLabel}…
        </Text>
      </View>
    );
  }

  const isRainAlert = weather.aiTourAdvice.comfortLevel === 'rain_alert';
  const peakRain = Math.max(
    weather.rainProbabilityPercent,
    weather.next3HoursRainMaxPercent
  );

  return (
    <View style={styles.card}>
      {/* Compact 1-Line Live Weather Summary (Temp · Humidity · Rain % — always visible, zero clutter!) */}
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => setExpanded((prev) => !prev)}
        style={styles.summaryRow}
        accessibilityRole="button"
        accessibilityLabel="Xem chi tiết dự báo thời tiết theo giờ"
      >
        <View style={[styles.iconBadge, isRainAlert && styles.iconBadgeRain]}>
          {renderWeatherIcon(weather.conditionKind, 18)}
        </View>

        <View style={styles.summaryCenter}>
          <View style={styles.summaryTopLine}>
            <Text style={styles.tempText}>
              {Math.round(weather.temperatureC)}°C
            </Text>
            <Text style={styles.conditionShort} numberOfLines={1}>
              {weather.conditionLabelVi}
            </Text>
          </View>

          <View style={styles.inlineMetrics}>
            <View style={styles.inlineMetricItem}>
              <Droplets size={11} color={COLORS.gpsBlue} />
              <Text style={styles.inlineMetricText}>
                Ẩm {weather.humidityPercent}%
              </Text>
            </View>
            <Text style={styles.dot}>·</Text>
            <View style={styles.inlineMetricItem}>
              <Umbrella
                size={11}
                color={peakRain >= 50 ? COLORS.accent : COLORS.gpsBlue}
              />
              <Text
                style={[
                  styles.inlineMetricText,
                  peakRain >= 50 && styles.inlineMetricAlert,
                ]}
              >
                Mưa {weather.rainProbabilityPercent}%
              </Text>
            </View>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.updatedTiny}>
              {formatUpdatedClock(weather.fetchedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.expandChip}>
          {expanded ? (
            <ChevronUp size={15} color={COLORS.inkSecondary} />
          ) : (
            <ChevronDown size={15} color={COLORS.inkSecondary} />
          )}
        </View>
      </TouchableOpacity>

      {/* Expandable Details: 4h Forecast + Wind/Feels-Like + AI Weather Tour Planning */}
      {expanded && (
        <View style={styles.expandedBody}>
          <View style={styles.extraMetaRow}>
            <View style={styles.extraMetaLeft}>
              <View
                style={[
                  styles.liveDot,
                  !weather.isLive && styles.liveDotOffline,
                ]}
              />
              <Text style={styles.extraMetaText}>
                Cảm giác {Math.round(weather.apparentTemperatureC)}°C · Gió{' '}
                {weather.windSpeedKmh} km/h
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onRefresh}
              disabled={isLoading}
              style={styles.refreshMiniBtn}
            >
              {isLoading ? (
                <ActivityIndicator size={11} color={COLORS.inkSecondary} />
              ) : (
                <RefreshCw size={11} color={COLORS.inkSecondary} />
              )}
              <Text style={styles.refreshMiniText}>Làm mới</Text>
            </TouchableOpacity>
          </View>

          {weather.hourlyPreview.length > 0 && (
            <View style={styles.hourlyRow}>
              {weather.hourlyPreview.map((slot, idx) => (
                <View
                  key={`${slot.isoTime}-${idx}`}
                  style={[styles.hourlyChip, idx === 0 && styles.hourlyChipNow]}
                >
                  <Text style={styles.hourlyTime}>{slot.hourLabel}</Text>
                  <Text style={styles.hourlyTemp}>{slot.temperatureC}°</Text>
                  <Text
                    style={[
                      styles.hourlyRain,
                      slot.rainProbabilityPercent >= 50 && styles.hourlyRainHigh,
                    ]}
                  >
                    {slot.rainProbabilityPercent}%
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPlanTourWithWeather}
            style={styles.aiAdviceRow}
          >
            <Sparkles size={13} color={COLORS.accent} />
            <Text style={styles.aiAdviceText} numberOfLines={2}>
              {weather.aiTourAdvice.headlineVi}
            </Text>
            <Text style={styles.aiAdviceLink}>Lập Tour →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  compactBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.inkSecondary,
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeRain: {
    backgroundColor: COLORS.gpsBlueSoft,
    borderColor: '#BFDBFE',
  },
  summaryCenter: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  summaryTopLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  tempText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  conditionShort: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkSecondary,
    flexShrink: 1,
  },
  inlineMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  inlineMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  inlineMetricText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  inlineMetricAlert: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  dot: {
    fontSize: 11,
    color: COLORS.borderStrong,
  },
  updatedTiny: {
    fontSize: 10.5,
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  expandChip: {
    width: 28,
    height: 28,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 11,
    gap: 9,
    backgroundColor: COLORS.bg,
  },
  extraMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  extraMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.visitedDot,
  },
  liveDotOffline: {
    backgroundColor: COLORS.amberStar,
  },
  extraMetaText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  refreshMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  refreshMiniText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  hourlyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  hourlyChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    gap: 2,
  },
  hourlyChipNow: {
    borderColor: COLORS.borderStrong,
  },
  hourlyTime: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  hourlyTemp: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  hourlyRain: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  hourlyRainHigh: {
    color: COLORS.gpsBlue,
    fontWeight: '700',
  },
  aiAdviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  aiAdviceText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.ink,
    lineHeight: 16,
  },
  aiAdviceLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
