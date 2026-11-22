import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
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
import { COLORS, RADII, SHADOWS, SPACING } from '../theme';

export interface WeatherWidgetCardProps {
  weather: WeatherSnapshot | null;
  locationLabel: string;
  isLoading: boolean;
  onRefresh: () => void;
  onPlanTourWithWeather: () => void;
}

function renderWeatherIcon(kind: WeatherConditionKind, size = 22) {
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
  if (!weather) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator size="small" color={COLORS.accent} />
        <Text style={styles.loadingText}>
          Đang cập nhật thời tiết trực tiếp tại {locationLabel}…
        </Text>
      </View>
    );
  }

  const isRainAlert = weather.aiTourAdvice.comfortLevel === 'rain_alert';
  const isWarmAlert = weather.aiTourAdvice.comfortLevel === 'warm';
  const peakRain = Math.max(
    weather.rainProbabilityPercent,
    weather.next3HoursRainMaxPercent
  );

  return (
    <View style={styles.card}>
      {/* Top Row: Temp + Condition + Live Refresh */}
      <View style={styles.topRow}>
        <View style={styles.leftMain}>
          <View
            style={[
              styles.iconBox,
              isRainAlert && styles.iconBoxRain,
            ]}
          >
            {renderWeatherIcon(weather.conditionKind, 22)}
          </View>
          <View style={styles.tempCol}>
            <View style={styles.tempLine}>
              <Text style={styles.tempBig}>
                {Math.round(weather.temperatureC)}°C
              </Text>
              <Text style={styles.feelsLike}>
                Cảm giác {Math.round(weather.apparentTemperatureC)}°C
              </Text>
            </View>
            <Text style={styles.conditionText} numberOfLines={1}>
              {weather.conditionLabelVi} · {locationLabel}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onRefresh}
          disabled={isLoading}
          style={styles.refreshBtn}
          accessibilityLabel="Cập nhật lại thông tin thời tiết"
        >
          <View
            style={[
              styles.liveDot,
              !weather.isLive && styles.liveDotOffline,
            ]}
          />
          <Text style={styles.updatedTime}>
            {formatUpdatedClock(weather.fetchedAt)}
          </Text>
          {isLoading ? (
            <ActivityIndicator size={11} color={COLORS.inkSecondary} />
          ) : (
            <RefreshCw size={12} color={COLORS.inkSecondary} />
          )}
        </TouchableOpacity>
      </View>

      {/* 3 Core Weather Metrics: Humidity · Rain Chance · Wind */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCell}>
          <Droplets size={13} color={COLORS.gpsBlue} />
          <View style={styles.metricTextCol}>
            <Text style={styles.metricLabel}>Độ ẩm</Text>
            <Text style={styles.metricValue}>{weather.humidityPercent}%</Text>
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCell}>
          <Umbrella
            size={13}
            color={peakRain >= 50 ? COLORS.accent : COLORS.gpsBlue}
          />
          <View style={styles.metricTextCol}>
            <Text style={styles.metricLabel}>Khả năng mưa</Text>
            <Text
              style={[
                styles.metricValue,
                peakRain >= 50 && styles.metricValueAlert,
              ]}
            >
              {weather.rainProbabilityPercent}%
              {weather.next3HoursRainMaxPercent > weather.rainProbabilityPercent
                ? ` (tới ${weather.next3HoursRainMaxPercent}%)`
                : ''}
            </Text>
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCell}>
          <Wind size={13} color={COLORS.inkSecondary} />
          <View style={styles.metricTextCol}>
            <Text style={styles.metricLabel}>Gió</Text>
            <Text style={styles.metricValue}>{weather.windSpeedKmh} km/h</Text>
          </View>
        </View>
      </View>

      {/* Hourly Mini Strip (Next 4h) */}
      {weather.hourlyPreview.length > 0 && (
        <View style={styles.hourlyRow}>
          {weather.hourlyPreview.map((slot, idx) => (
            <View
              key={`${slot.isoTime}-${idx}`}
              style={[styles.hourlyChip, idx === 0 && styles.hourlyChipNow]}
            >
              <Text
                style={[
                  styles.hourlyTime,
                  idx === 0 && styles.hourlyTimeNow,
                ]}
              >
                {slot.hourLabel}
              </Text>
              <Text style={styles.hourlyTemp}>{slot.temperatureC}°</Text>
              <Text
                style={[
                  styles.hourlyRain,
                  slot.rainProbabilityPercent >= 50 && styles.hourlyRainHigh,
                ]}
              >
                {slot.rainProbabilityPercent}% mưa
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* AI Weather Tour Planning Banner */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPlanTourWithWeather}
        style={[
          styles.aiAdviceBar,
          isRainAlert
            ? styles.aiAdviceBarRain
            : isWarmAlert
              ? styles.aiAdviceBarWarm
              : null,
        ]}
      >
        <View style={styles.aiAdviceLeft}>
          <Sparkles
            size={13}
            color={isRainAlert ? COLORS.gpsBlue : COLORS.accent}
          />
          <View style={styles.aiAdviceTextCol}>
            <Text style={styles.aiAdviceHeadline} numberOfLines={1}>
              {weather.aiTourAdvice.headlineVi}
            </Text>
            <Text style={styles.aiAdviceSub} numberOfLines={2}>
              {weather.aiTourAdvice.detailVi}
            </Text>
          </View>
        </View>
        <View style={styles.aiAdviceCta}>
          <Text style={styles.aiAdviceCtaText}>Lập Tour AI</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...SHADOWS.card,
  },
  loadingText: {
    fontSize: 12.5,
    color: COLORS.inkSecondary,
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    gap: 11,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  leftMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxRain: {
    backgroundColor: COLORS.gpsBlueSoft,
    borderColor: '#BFDBFE',
  },
  tempCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  tempLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
  },
  tempBig: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  feelsLike: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
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
  updatedTime: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceMuted,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  metricCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  metricTextCol: {
    gap: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  metricValueAlert: {
    color: COLORS.accent,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  hourlyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  hourlyChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceMuted,
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 2,
  },
  hourlyChipNow: {
    backgroundColor: COLORS.surfaceTint,
    borderColor: COLORS.borderStrong,
  },
  hourlyTime: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  hourlyTimeNow: {
    color: COLORS.ink,
    fontWeight: '700',
  },
  hourlyTemp: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  hourlyRain: {
    fontSize: 9.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  hourlyRainHigh: {
    color: COLORS.gpsBlue,
    fontWeight: '700',
  },
  aiAdviceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: COLORS.surfaceTint,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  aiAdviceBarRain: {
    backgroundColor: COLORS.gpsBlueSoft,
    borderColor: '#BFDBFE',
  },
  aiAdviceBarWarm: {
    backgroundColor: COLORS.amberBg,
    borderColor: COLORS.amberBorder,
  },
  aiAdviceLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    minWidth: 0,
  },
  aiAdviceTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  aiAdviceHeadline: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  aiAdviceSub: {
    fontSize: 10.5,
    lineHeight: 14.5,
    color: COLORS.inkSecondary,
  },
  aiAdviceCta: {
    backgroundColor: COLORS.ink,
    borderRadius: RADII.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  aiAdviceCtaText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.white,
  },
});
