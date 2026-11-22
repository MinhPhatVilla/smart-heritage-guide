import { describe, expect, it } from 'vitest';
import {
  buildWeatherAiAdvice,
  classifyWeatherCondition,
  parseOpenMeteoResponse,
  toWeatherContextPayload,
} from './weatherService';

describe('weatherService', () => {
  it('classifies WMO weather codes into expected Vietnamese labels', () => {
    expect(classifyWeatherCondition(0)).toEqual({
      kind: 'sunny',
      labelVi: 'Trời quang đãng',
    });
    expect(classifyWeatherCondition(63).kind).toBe('rain');
    expect(classifyWeatherCondition(95).kind).toBe('storm');
  });

  it('builds indoor-preferred AI tour advice when rain probability is high', () => {
    const advice = buildWeatherAiAdvice({
      temperatureC: 28,
      apparentTemperatureC: 31,
      humidityPercent: 86,
      rainProbabilityPercent: 75,
      next3HoursRainMaxPercent: 80,
      precipitationMm: 1.2,
      uvIndex: 3,
      conditionKind: 'rain',
    });
    expect(advice.indoorPreferred).toBe(true);
    expect(advice.comfortLevel).toBe('rain_alert');
    expect(advice.detailVi).toContain('80%');
  });

  it('parses Open-Meteo response and maps AI context payload cleanly', () => {
    const snapshot = parseOpenMeteoResponse(
      {
        current: {
          time: '2026-11-22T14:00',
          temperature_2m: 31.4,
          relative_humidity_2m: 72,
          apparent_temperature: 34.1,
          precipitation: 0,
          weather_code: 2,
          wind_speed_10m: 12.3,
        },
        hourly: {
          time: [
            '2026-11-22T14:00',
            '2026-11-22T15:00',
            '2026-11-22T16:00',
            '2026-11-22T17:00',
          ],
          temperature_2m: [31.4, 31.0, 29.8, 28.9],
          precipitation_probability: [15, 20, 30, 25],
          weather_code: [2, 2, 3, 2],
          uv_index: [6.2, 4.5, 2.1, 0.5],
        },
      },
      10.7775,
      106.699
    );

    expect(snapshot.isLive).toBe(true);
    expect(snapshot.temperatureC).toBe(31.4);
    expect(snapshot.humidityPercent).toBe(72);
    expect(snapshot.rainProbabilityPercent).toBe(15);
    expect(snapshot.next3HoursRainMaxPercent).toBe(30);
    expect(snapshot.hourlyPreview).toHaveLength(4);
    expect(snapshot.hourlyPreview[0].hourLabel).toBe('Hiện tại');
    expect(snapshot.hourlyPreview[1].hourLabel).toBe('15h');

    const payload = toWeatherContextPayload(snapshot);
    expect(payload).toEqual({
      temperature_c: 31.4,
      apparent_temperature_c: 34.1,
      humidity_percent: 72,
      rain_probability_percent: 15,
      next_3h_rain_max_percent: 30,
      condition_kind: 'partly_cloudy',
      condition_label: 'Ít mây · Nắng nhẹ',
      indoor_preferred: false,
    });
  });
});
