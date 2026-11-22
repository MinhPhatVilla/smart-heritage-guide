import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { smoothAngleDegrees } from '../utils/geoUtils';

export type CoordinatesTuple = [number, number];

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface LocationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus | 'unavailable';
  message: string;
}

export interface LocationFetchResult {
  ok: boolean;
  coords?: LocationCoordinates;
  tuple?: CoordinatesTuple;
  error?: string;
}

export interface LocationWatchOptions {
  accuracy?: Location.LocationAccuracy;
  timeIntervalMs?: number;
  distanceIntervalMeters?: number;
  onUpdate: (coords: LocationCoordinates, tuple: CoordinatesTuple) => void;
  onError?: (errorMessage: string) => void;
}

export interface LocationWatchHandle {
  remove: () => void;
}

const DEFAULT_LOCATION_TIMEOUT_MS = 8000;

function mapLocationObject(location: Location.LocationObject): LocationCoordinates {
  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    accuracy: location.coords.accuracy ?? null,
    heading: location.coords.heading ?? null,
    speed: location.coords.speed ?? null,
    timestamp: location.timestamp ?? Date.now(),
  };
}

/** Định dạng tọa độ hiển thị ngắn gọn trên thanh trạng thái GPS */
export function formatCoordinatesLabel(lat: number, lng: number): string {
  const latSuffix = lat >= 0 ? '°N' : '°S';
  const lngSuffix = lng >= 0 ? '°E' : '°W';
  return `${Math.abs(lat).toFixed(4)}${latSuffix}, ${Math.abs(lng).toFixed(4)}${lngSuffix}`;
}

/** Yêu cầu quyền truy cập vị trí foreground của thiết bị */
export async function requestLocationPermission(): Promise<LocationPermissionResult> {
  try {
    const existing = await Location.getForegroundPermissionsAsync();
    if (existing.granted) {
      return {
        granted: true,
        canAskAgain: existing.canAskAgain,
        status: existing.status,
        message: 'Đã cấp quyền truy cập vị trí GPS.',
      };
    }

    const requested = await Location.requestForegroundPermissionsAsync();
    if (requested.granted) {
      return {
        granted: true,
        canAskAgain: requested.canAskAgain,
        status: requested.status,
        message: 'Đã cấp quyền truy cập vị trí GPS.',
      };
    }

    const message = requested.canAskAgain
      ? 'Bạn chưa cấp quyền truy cập GPS. Hãy cho phép ứng dụng dùng vị trí hoặc chọn nhanh khu vực TP.HCM.'
      : 'Quyền truy cập GPS đang bị tắt. Vui lòng mở Cài đặt thiết bị để bật lại hoặc chọn khu vực TP.HCM.';

    return {
      granted: false,
      canAskAgain: requested.canAskAgain,
      status: requested.status,
      message,
    };
  } catch {
    return {
      granted: false,
      canAskAgain: false,
      status: 'unavailable',
      message:
        'Thiết bị hoặc trình duyệt hiện không hỗ trợ định vị GPS. Bạn có thể chọn nhanh khu vực TP.HCM.',
    };
  }
}

/** Lấy tọa độ GPS hiện tại (có timeout an toàn và dự phòng vị trí gần nhất) */
export async function getCurrentLocation(options?: {
  accuracy?: Location.LocationAccuracy;
  timeoutMs?: number;
}): Promise<LocationFetchResult> {
  const permission = await requestLocationPermission();
  if (!permission.granted) {
    return { ok: false, error: permission.message };
  }

  if (Platform.OS !== 'web') {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        return {
          ok: false,
          error:
            'Dịch vụ định vị (GPS) trên thiết bị đang tắt. Vui lòng bật GPS trong Cài đặt hoặc chọn khu vực TP.HCM.',
        };
      }
    } catch {
      // Tiếp tục thử lấy vị trí nếu kiểm tra dịch vụ không khả dụng
    }
  }

  const accuracy = options?.accuracy ?? Location.Accuracy.Balanced;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_LOCATION_TIMEOUT_MS;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    const position = await Promise.race<Location.LocationObject>([
      Location.getCurrentPositionAsync({ accuracy }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('GPS_TIMEOUT'));
        }, timeoutMs);
      }),
    ]);

    const coords = mapLocationObject(position);
    return {
      ok: true,
      coords,
      tuple: [coords.lat, coords.lng],
    };
  } catch {
    // Dự phòng: lấy tọa độ gần nhất được hệ điều hành lưu tạm
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        const coords = mapLocationObject(lastKnown);
        return {
          ok: true,
          coords,
          tuple: [coords.lat, coords.lng],
        };
      }
    } catch {
      // Bỏ qua nếu không có vị trí cache
    }

    return {
      ok: false,
      error:
        'Không thể lấy tín hiệu GPS lúc này. Vui lòng thử lại ngoài trời hoặc chọn khu vực TP.HCM trên bản đồ.',
    };
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}

/** Theo dõi cập nhật vị trí GPS liên tục khi người dùng đi bộ */
export async function watchLocation(
  options: LocationWatchOptions
): Promise<LocationWatchHandle | null> {
  const permission = await requestLocationPermission();
  if (!permission.granted) {
    options.onError?.(permission.message);
    return null;
  }

  try {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: options.accuracy ?? Location.Accuracy.High,
        timeInterval: options.timeIntervalMs ?? 3000,
        distanceInterval: options.distanceIntervalMeters ?? 5,
      },
      (location) => {
        const coords = mapLocationObject(location);
        options.onUpdate(coords, [coords.lat, coords.lng]);
      }
    );

    return {
      remove: () => {
        try {
          subscription.remove();
        } catch {
          // Bỏ qua lỗi hủy theo dõi nếu đã đóng
        }
      },
    };
  } catch {
    options.onError?.(
      'Không thể bật theo dõi GPS liên tục trên thiết bị này. Bạn vẫn có thể dùng chế độ mô phỏng đi bộ.'
    );
    return null;
  }
}

export interface HeadingWatchOptions {
  onUpdate: (headingDegrees: number) => void;
  onError?: (errorMessage: string) => void;
}

/**
 * Theo dõi hướng la bàn của điện thoại (Heading-Up 3D Navigation).
 * - iOS/Android: dùng `Location.watchHeadingAsync()` kết hợp bộ lọc mượt chống rung tay.
 * - Web di động: đọc `deviceorientationabsolute` / `deviceorientation` nếu thiết bị có cảm biến.
 */
export async function watchDeviceHeading(
  options: HeadingWatchOptions
): Promise<LocationWatchHandle | null> {
  let smoothedHeading: number | null = null;
  let lastEmittedHeading: number | null = null;

  const emitSmooth = (rawHeading: number) => {
    if (!Number.isFinite(rawHeading) || rawHeading < 0) return;
    const normalized = ((rawHeading % 360) + 360) % 360;
    smoothedHeading =
      smoothedHeading === null
        ? normalized
        : smoothAngleDegrees(smoothedHeading, normalized, 0.28);

    if (lastEmittedHeading !== null) {
      const delta = Math.abs(
        ((((smoothedHeading - lastEmittedHeading) % 360) + 540) % 360) - 180
      );
      if (delta < 2.2) return;
    }
    lastEmittedHeading = smoothedHeading;
    options.onUpdate(Math.round(smoothedHeading * 10) / 10);
  };

  if (Platform.OS === 'web') {
    const win = globalThis as unknown as {
      addEventListener?: (
        ev: string,
        fn: (e: {
          webkitCompassHeading?: number;
          alpha?: number | null;
          absolute?: boolean;
        }) => void
      ) => void;
      removeEventListener?: (
        ev: string,
        fn: (e: {
          webkitCompassHeading?: number;
          alpha?: number | null;
          absolute?: boolean;
        }) => void
      ) => void;
    };
    if (!win.addEventListener || !win.removeEventListener) return null;

    const handler = (event: {
      webkitCompassHeading?: number;
      alpha?: number | null;
      absolute?: boolean;
    }) => {
      if (typeof event.webkitCompassHeading === 'number') {
        emitSmooth(event.webkitCompassHeading);
      } else if (typeof event.alpha === 'number') {
        emitSmooth(360 - event.alpha);
      }
    };

    win.addEventListener('deviceorientationabsolute', handler);
    win.addEventListener('deviceorientation', handler);
    return {
      remove: () => {
        win.removeEventListener?.('deviceorientationabsolute', handler);
        win.removeEventListener?.('deviceorientation', handler);
      },
    };
  }

  try {
    const permission = await requestLocationPermission();
    if (!permission.granted) {
      options.onError?.(permission.message);
      return null;
    }
    const sub = await Location.watchHeadingAsync((headingObj) => {
      const raw =
        headingObj.trueHeading >= 0
          ? headingObj.trueHeading
          : headingObj.magHeading;
      emitSmooth(raw);
    });
    return {
      remove: () => {
        try {
          sub.remove();
        } catch {
          // Bỏ qua nếu đã hủy
        }
      },
    };
  } catch {
    return null;
  }
}
