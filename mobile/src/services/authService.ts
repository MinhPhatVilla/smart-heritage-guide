import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeritageCategory, SupportedLanguage } from '../types/heritage';
import {
  ApiResult,
  apiRequest,
  getAuthToken,
  setAuthTokens,
} from './apiClient';

export const AUTH_PROFILE_STORAGE_KEY = 'smart_heritage_auth_profile_v1';

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  role: string;
  preferred_language: string;
  preferred_categories: string[];
  total_verified_walking_seconds: number;
  total_verified_walking_meters: number;
  verified_sites_count: number;
  created_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
  expires_in: number;
  auth_provider: 'supabase' | 'local';
  profile: UserProfile;
}

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
  preferred_language?: SupportedLanguage;
  preferred_categories?: HeritageCategory[];
}

export interface ProfileUpdatePayload {
  display_name?: string;
  avatar_url?: string;
  preferred_language?: SupportedLanguage;
  preferred_categories?: HeritageCategory[];
}

export interface AuthSessionState {
  isAuthenticated: boolean;
  isGuest: boolean;
  profile: UserProfile | null;
}

async function persistProfile(profile: UserProfile | null): Promise<void> {
  try {
    if (profile) {
      await AsyncStorage.setItem(
        AUTH_PROFILE_STORAGE_KEY,
        JSON.stringify(profile)
      );
    } else {
      await AsyncStorage.removeItem(AUTH_PROFILE_STORAGE_KEY);
    }
  } catch {
    // Bỏ qua lỗi bộ nhớ cục bộ
  }
}

/**
 * Tải phiên đăng nhập từ AsyncStorage.
 * Mặc định trả về chế độ Khách (Guest) để người dùng dùng app ngay không bị chặn.
 */
export async function loadStoredAuthState(): Promise<AuthSessionState> {
  try {
    const [token, rawProfile] = await Promise.all([
      getAuthToken(),
      AsyncStorage.getItem(AUTH_PROFILE_STORAGE_KEY),
    ]);
    if (!token || !rawProfile) {
      return { isAuthenticated: false, isGuest: true, profile: null };
    }
    const profile = JSON.parse(rawProfile) as UserProfile;
    if (!profile?.id) {
      return { isAuthenticated: false, isGuest: true, profile: null };
    }
    return { isAuthenticated: true, isGuest: false, profile };
  } catch {
    return { isAuthenticated: false, isGuest: true, profile: null };
  }
}

export async function registerAccount(
  payload: RegisterPayload
): Promise<ApiResult<AuthTokenResponse>> {
  const result = await apiRequest<AuthTokenResponse>('/api/v1/auth/register', {
    method: 'POST',
    skipAuth: true,
    body: {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      display_name: payload.display_name.trim() || 'Khách Du Lịch',
      preferred_language: payload.preferred_language || 'vi',
      preferred_categories: payload.preferred_categories || [],
    },
  });

  if (result.ok) {
    await setAuthTokens(
      result.data.access_token,
      result.data.refresh_token ?? null
    );
    await persistProfile(result.data.profile);
  }
  return result;
}

export async function loginAccount(
  email: string,
  password: string
): Promise<ApiResult<AuthTokenResponse>> {
  const result = await apiRequest<AuthTokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: {
      email: email.trim().toLowerCase(),
      password,
    },
  });

  if (result.ok) {
    await setAuthTokens(
      result.data.access_token,
      result.data.refresh_token ?? null
    );
    await persistProfile(result.data.profile);
  }
  return result;
}

export async function fetchCurrentProfile(): Promise<ApiResult<UserProfile>> {
  const token = await getAuthToken();
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'Bạn đang dùng chế độ Khách.',
      isOffline: false,
    };
  }

  const result = await apiRequest<UserProfile>('/api/v1/auth/me', {
    method: 'GET',
    timeoutMs: 6000,
  });

  if (result.ok) {
    await persistProfile(result.data);
  } else if (result.status === 401) {
    await logoutAccount();
  }
  return result;
}

export async function updateCurrentProfile(
  payload: ProfileUpdatePayload
): Promise<ApiResult<UserProfile>> {
  const result = await apiRequest<UserProfile>('/api/v1/auth/me', {
    method: 'PATCH',
    body: payload,
  });

  if (result.ok) {
    await persistProfile(result.data);
  }
  return result;
}

export async function logoutAccount(): Promise<void> {
  await setAuthTokens(null, null);
  await persistProfile(null);
}
