import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_API_BASE_URL = 'http://localhost:8000';
export const AUTH_TOKEN_STORAGE_KEY = 'smart_heritage_auth_token_v1';
export const REFRESH_TOKEN_STORAGE_KEY = 'smart_heritage_refresh_token_v1';
export const DEFAULT_TIMEOUT_MS = 10000;

let cachedAccessToken: string | null = null;
let tokenHydrated = false;

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  skipAuth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

export interface ApiSuccess<T> {
  ok: true;
  status: number;
  data: T;
  isOffline: false;
}

export interface ApiFailure {
  ok: false;
  status: number;
  error: string;
  isOffline: boolean;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

/**
 * Đọc URL Backend từ biến môi trường EXPO_PUBLIC_API_BASE_URL (mặc định http://localhost:8000).
 */
export function getApiBaseUrl(): string {
  const raw =
    typeof process !== 'undefined' && process.env
      ? (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim()
      : '';
  const base = raw || DEFAULT_API_BASE_URL;
  return base.replace(/\/+$/, '');
}

/**
 * Kiểm tra có đang chạy trong môi trường unit test (Vitest) mà không cấu hình API URL tường minh hay không.
 */
export function shouldTryBackendProxy(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    const explicit = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
    if (explicit) return true;
    if (process.env.VITEST || process.env.NODE_ENV === 'test') {
      return false;
    }
  }
  return true;
}

export function getCachedAuthToken(): string | null {
  return cachedAccessToken;
}

export async function getAuthToken(): Promise<string | null> {
  if (tokenHydrated) return cachedAccessToken;
  try {
    cachedAccessToken = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    cachedAccessToken = null;
  }
  tokenHydrated = true;
  return cachedAccessToken;
}

export async function setAuthTokens(
  accessToken: string | null,
  refreshToken?: string | null
): Promise<void> {
  cachedAccessToken = accessToken;
  tokenHydrated = true;
  try {
    if (accessToken) {
      await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
    if (refreshToken !== undefined) {
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
      } else {
        await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      }
    }
  } catch {
    // Bỏ qua lỗi bộ nhớ cục bộ để không crash chế độ Offline-first
  }
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  let url = `${getApiBaseUrl()}${normalizedPath}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, String(v));
      }
    });
    const qs = params.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }
  return url;
}

function extractFastApiError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.detail === 'string' && obj.detail.trim()) {
    return obj.detail;
  }
  if (Array.isArray(obj.detail) && obj.detail.length > 0) {
    const first = obj.detail[0] as Record<string, unknown> | undefined;
    if (first && typeof first.msg === 'string') {
      return first.msg;
    }
  }
  if (typeof obj.message === 'string' && obj.message.trim()) {
    return obj.message;
  }
  return fallback;
}

/**
 * Gọi REST API Backend an toàn theo triết lý Offline-first:
 * - Tự gắn Bearer JWT token nếu người dùng đã đăng nhập.
 * - Tự timeout bằng AbortController và bắt mọi lỗi mạng => KHÔNG BAO GIỜ throw crash app.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<ApiResult<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    skipAuth = false,
    query,
  } = options;

  const url = buildUrl(path, query);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const finalHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...headers,
    };

    const isFormData =
      typeof FormData !== 'undefined' && body instanceof FormData;
    if (body !== undefined && !isFormData && !finalHeaders['Content-Type']) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    if (!skipAuth) {
      const token = await getAuthToken();
      if (token && !finalHeaders.Authorization) {
        finalHeaders.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
      signal: controller.signal,
    });

    let parsed: unknown = null;
    const contentType = response.headers?.get?.('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        parsed = await response.json();
      } catch {
        parsed = null;
      }
    } else {
      try {
        const text = await response.text();
        if (text) {
          try {
            parsed = JSON.parse(text);
          } catch {
            parsed = { message: text };
          }
        }
      } catch {
        parsed = null;
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: extractFastApiError(
          parsed,
          `Máy chủ phản hồi lỗi (${response.status}).`
        ),
        isOffline: false,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: parsed as T,
      isOffline: false,
    };
  } catch (err: unknown) {
    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' || err.message.toLowerCase().includes('abort'));
    return {
      ok: false,
      status: 0,
      error: isAbort
        ? 'Kết nối tới máy chủ Backend quá thời gian chờ. Đang dùng chế độ Offline.'
        : 'Không thể kết nối máy chủ Backend. Ứng dụng vẫn hoạt động ở chế độ Offline.',
      isOffline: true,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  const res = await apiRequest<{ status?: string }>('/api/v1/health', {
    method: 'GET',
    timeoutMs: 3000,
    skipAuth: true,
  });
  return res.ok;
}
