export type WeatherConditionKind =
  | 'sunny'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rain'
  | 'storm';

export interface HourlyWeatherPoint {
  isoTime: string;
  hourLabel: string;
  temperatureC: number;
  rainProbabilityPercent: number;
  weatherCode: number;
}

export interface WeatherAiTourAdvice {
  indoorPreferred: boolean;
  comfortLevel: 'ideal' | 'warm' | 'rain_alert';
  headlineVi: string;
  detailVi: string;
}

export interface WeatherSnapshot {
  lat: number;
  lng: number;
  fetchedAt: string;
  isLive: boolean;
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  rainProbabilityPercent: number;
  next3HoursRainMaxPercent: number;
  precipitationMm: number;
  windSpeedKmh: number;
  uvIndex: number;
  weatherCode: number;
  conditionKind: WeatherConditionKind;
  conditionLabelVi: string;
  hourlyPreview: HourlyWeatherPoint[];
  aiTourAdvice: WeatherAiTourAdvice;
}

export interface WeatherContextPayload {
  temperature_c: number;
  apparent_temperature_c: number;
  humidity_percent: number;
  rain_probability_percent: number;
  next_3h_rain_max_percent: number;
  condition_kind: WeatherConditionKind;
  condition_label: string;
  indoor_preferred: boolean;
}

interface OpenMeteoForecastResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    weather_code?: number[];
    uv_index?: number[];
  };
}

export function classifyWeatherCondition(code: number): {
  kind: WeatherConditionKind;
  labelVi: string;
} {
  if (code === 0) return { kind: 'sunny', labelVi: 'Trời quang đãng' };
  if (code === 1 || code === 2) {
    return { kind: 'partly_cloudy', labelVi: 'Ít mây · Nắng nhẹ' };
  }
  if (code === 3 || code === 45 || code === 48) {
    return { kind: 'cloudy', labelVi: 'Nhiều mây · Dịu mát' };
  }
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82)
  ) {
    return {
      kind: 'rain',
      labelVi: code >= 63 || code >= 81 ? 'Mưa vừa đến lớn' : 'Có mưa rào nhẹ',
    };
  }
  if (code >= 95 && code <= 99) {
    return { kind: 'storm', labelVi: 'Mưa dông · Cần chú ý' };
  }
  return { kind: 'partly_cloudy', labelVi: 'Có mây nhẹ' };
}

export function buildWeatherAiAdvice(params: {
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  rainProbabilityPercent: number;
  next3HoursRainMaxPercent: number;
  precipitationMm: number;
  uvIndex: number;
  conditionKind: WeatherConditionKind;
}): WeatherAiTourAdvice {
  const peakRain = Math.max(
    params.rainProbabilityPercent,
    params.next3HoursRainMaxPercent
  );

  if (
    params.conditionKind === 'storm' ||
    params.precipitationMm >= 0.8 ||
    peakRain >= 60
  ) {
    return {
      indoorPreferred: true,
      comfortLevel: 'rain_alert',
      headlineVi: 'Khả năng mưa cao — AI ưu tiên điểm trong nhà',
      detailVi: `Xác suất mưa tới ${Math.round(peakRain)}% trong 3 giờ tới. Nên mang ô/áo mưa và ưu tiên Bảo tàng, Dinh thự hoặc quán ăn gần nhau.`,
    };
  }

  if (
    params.apparentTemperatureC >= 35 ||
    params.temperatureC >= 34 ||
    params.uvIndex >= 8
  ) {
    return {
      indoorPreferred: true,
      comfortLevel: 'warm',
      headlineVi: 'Trời khá nắng nóng — AI ưu tiên điểm có bóng mát',
      detailVi: `Cảm giác ngoài trời ~${Math.round(params.apparentTemperatureC)}°C, độ ẩm ${Math.round(params.humidityPercent)}%. Nên tham quan Bảo tàng/Chùa vào trưa và đi bộ ngoài trời sau 16h.`,
    };
  }

  if (peakRain >= 35) {
    return {
      indoorPreferred: false,
      comfortLevel: 'warm',
      headlineVi: 'Có thể có mưa rào nhẹ — Nên mang theo ô gấp',
      detailVi: `Nhiệt độ ${Math.round(params.temperatureC)}°C, độ ẩm ${Math.round(params.humidityPercent)}%, xác suất mưa ${Math.round(peakRain)}%. Phù hợp kết hợp di tích ngoài trời và điểm dừng chân ẩm thực.`,
    };
  }

  return {
    indoorPreferred: false,
    comfortLevel: 'ideal',
    headlineVi: 'Thời tiết đẹp — Lý tưởng để đi bộ khám phá',
    detailVi: `Nhiệt độ ${Math.round(params.temperatureC)}°C, độ ẩm ${Math.round(params.humidityPercent)}%, khả năng mưa thấp (${Math.round(peakRain)}%). Rất thuận lợi cho tour đi bộ & chụp ảnh di sản.`,
  };
}

function formatHourLabel(isoTime: string): string {
  const match = /T(\d{2}):\d{2}/.exec(isoTime);
  return match ? `${match[1]}h` : isoTime.slice(-5);
}

export function parseOpenMeteoResponse(
  raw: OpenMeteoForecastResponse,
  lat: number,
  lng: number,
  nowIso: string = new Date().toISOString()
): WeatherSnapshot {
  const cur = raw.current ?? {};
  const hourly = raw.hourly ?? {};

  const times = Array.isArray(hourly.time) ? hourly.time : [];
  const temps = Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m : [];
  const probs = Array.isArray(hourly.precipitation_probability)
    ? hourly.precipitation_probability
    : [];
  const codes = Array.isArray(hourly.weather_code) ? hourly.weather_code : [];
  const uvs = Array.isArray(hourly.uv_index) ? hourly.uv_index : [];

  const temperatureC = Number.isFinite(cur.temperature_2m)
    ? Number(cur.temperature_2m)
    : Number(temps[0] ?? 30);
  const apparentTemperatureC = Number.isFinite(cur.apparent_temperature)
    ? Number(cur.apparent_temperature)
    : temperatureC + 2;
  const humidityPercent = Number.isFinite(cur.relative_humidity_2m)
    ? Math.max(0, Math.min(100, Math.round(Number(cur.relative_humidity_2m))))
    : 74;
  const precipitationMm = Number.isFinite(cur.precipitation)
    ? Math.max(0, Number(cur.precipitation))
    : 0;
  const windSpeedKmh = Number.isFinite(cur.wind_speed_10m)
    ? Math.max(0, Math.round(Number(cur.wind_speed_10m)))
    : 10;
  const weatherCode = Number.isFinite(cur.weather_code)
    ? Number(cur.weather_code)
    : Number(codes[0] ?? 2);
  const uvIndex = Number.isFinite(uvs[0]) ? Math.max(0, Number(uvs[0])) : 4;

  const rainProbabilityPercent = Number.isFinite(probs[0])
    ? Math.max(0, Math.min(100, Math.round(Number(probs[0]))))
    : precipitationMm > 0
      ? 80
      : 15;

  const next3Probs = probs
    .slice(0, 4)
    .filter((p) => Number.isFinite(p))
    .map((p) => Math.max(0, Math.min(100, Math.round(Number(p)))));
  const next3HoursRainMaxPercent =
    next3Probs.length > 0 ? Math.max(...next3Probs) : rainProbabilityPercent;

  const hourlyPreview: HourlyWeatherPoint[] = times.slice(0, 4).map((t, idx) => ({
    isoTime: t,
    hourLabel: idx === 0 ? 'Hiện tại' : formatHourLabel(t),
    temperatureC: Math.round(Number(temps[idx] ?? temperatureC)),
    rainProbabilityPercent: Math.max(
      0,
      Math.min(100, Math.round(Number(probs[idx] ?? rainProbabilityPercent)))
    ),
    weatherCode: Number(codes[idx] ?? weatherCode),
  }));

  const { kind, labelVi } = classifyWeatherCondition(weatherCode);
  const aiTourAdvice = buildWeatherAiAdvice({
    temperatureC,
    apparentTemperatureC,
    humidityPercent,
    rainProbabilityPercent,
    next3HoursRainMaxPercent,
    precipitationMm,
    uvIndex,
    conditionKind: kind,
  });

  return {
    lat,
    lng,
    fetchedAt: nowIso,
    isLive: true,
    temperatureC: Math.round(temperatureC * 10) / 10,
    apparentTemperatureC: Math.round(apparentTemperatureC * 10) / 10,
    humidityPercent,
    rainProbabilityPercent,
    next3HoursRainMaxPercent,
    precipitationMm,
    windSpeedKmh,
    uvIndex: Math.round(uvIndex * 10) / 10,
    weatherCode,
    conditionKind: kind,
    conditionLabelVi: labelVi,
    hourlyPreview,
    aiTourAdvice,
  };
}

export function toWeatherContextPayload(
  snapshot: WeatherSnapshot | null | undefined
): WeatherContextPayload | undefined {
  if (!snapshot) return undefined;
  return {
    temperature_c: snapshot.temperatureC,
    apparent_temperature_c: snapshot.apparentTemperatureC,
    humidity_percent: snapshot.humidityPercent,
    rain_probability_percent: snapshot.rainProbabilityPercent,
    next_3h_rain_max_percent: snapshot.next3HoursRainMaxPercent,
    condition_kind: snapshot.conditionKind,
    condition_label: snapshot.conditionLabelVi,
    indoor_preferred: snapshot.aiTourAdvice.indoorPreferred,
  };
}

export function buildFallbackWeatherSnapshot(
  lat: number,
  lng: number
): WeatherSnapshot {
  const hour = new Date().getHours();
  const isEvening = hour >= 18 || hour < 6;
  const temp = isEvening ? 28 : hour >= 11 && hour <= 15 ? 33 : 30;
  const humidity = isEvening ? 78 : 70;
  const rainProb = 25;
  const code = isEvening ? 2 : 1;
  const { kind, labelVi } = classifyWeatherCondition(code);
  const nowIso = new Date().toISOString();

  return {
    lat,
    lng,
    fetchedAt: nowIso,
    isLive: false,
    temperatureC: temp,
    apparentTemperatureC: temp + 2,
    humidityPercent: humidity,
    rainProbabilityPercent: rainProb,
    next3HoursRainMaxPercent: rainProb,
    precipitationMm: 0,
    windSpeedKmh: 11,
    uvIndex: isEvening ? 0 : 6,
    weatherCode: code,
    conditionKind: kind,
    conditionLabelVi: labelVi,
    hourlyPreview: [0, 1, 2, 3].map((offset) => {
      const h = (hour + offset) % 24;
      return {
        isoTime: nowIso,
        hourLabel: offset === 0 ? 'Hiện tại' : `${h < 10 ? '0' : ''}${h}h`,
        temperatureC: temp - Math.min(2, offset),
        rainProbabilityPercent: rainProb,
        weatherCode: code,
      };
    }),
    aiTourAdvice: buildWeatherAiAdvice({
      temperatureC: temp,
      apparentTemperatureC: temp + 2,
      humidityPercent: humidity,
      rainProbabilityPercent: rainProb,
      next3HoursRainMaxPercent: rainProb,
      precipitationMm: 0,
      uvIndex: isEvening ? 0 : 6,
      conditionKind: kind,
    }),
  };
}

// In-memory cache theo ô tọa độ (~2km) trong 5 phút để chuyển tab không gọi lặp
const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;
const weatherCache = new Map<string, { expiresAt: number; data: WeatherSnapshot }>();

function cacheKeyForCoords(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

export async function fetchLiveWeather(
  lat: number,
  lng: number,
  options?: { forceRefresh?: boolean }
): Promise<WeatherSnapshot> {
  const key = cacheKeyForCoords(lat, lng);
  const cached = weatherCache.get(key);
  if (!options?.forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,precipitation_probability,weather_code,uv_index',
    forecast_hours: '6',
    timezone: 'auto',
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      { signal: controller.signal }
    );
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = (await res.json()) as OpenMeteoForecastResponse;
    const parsed = parseOpenMeteoResponse(json, lat, lng);
    weatherCache.set(key, {
      expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
      data: parsed,
    });
    return parsed;
  } catch {
    if (cached) {
      return cached.data;
    }
    return buildFallbackWeatherSnapshot(lat, lng);
  } finally {
    clearTimeout(timeoutId);
  }
}
