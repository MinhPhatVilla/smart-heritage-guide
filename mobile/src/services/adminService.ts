import {
  HeritageCategory,
  HeritageSite,
  NearbyRestaurant,
} from '../types/heritage';
import { ApiResult, apiRequest, getApiBaseUrl } from './apiClient';

export interface BackendHealthStatus {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  database: {
    connected: boolean;
    dialect: string;
    postgis_enabled: boolean;
    pgvector_enabled: boolean;
    error?: string;
  };
  ai: {
    gemini_configured: boolean;
    chat_model: string;
    vision_model: string;
    embedding_model: string;
  };
  auth: {
    supabase_configured: boolean;
    storage_configured: boolean;
  };
  routing: {
    osrm_base_url: string;
    goong_configured: boolean;
  };
}

export interface AdminSiteFormInput {
  id: string;
  nameVi: string;
  nameEn: string;
  shortSummaryVi: string;
  architecturalHighlightsText?: string;
  audioScriptText?: string;
  historicalEra: string;
  openingHours: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  category: HeritageCategory;
  ticketPrice: string;
  coverImage: string;
  rating: number;
  nationalSpecialMonument: boolean;
  unescoRecognized: boolean;
}

export interface AdminRestaurantFormInput {
  id?: string;
  siteId: string;
  name: string;
  cuisine: string;
  specialtyDishesText: string;
  rating: number;
  priceRange: string;
  lat: number;
  lng: number;
  address: string;
  openHours: string;
  imageUrl: string;
}

export function slugifyVietnamese(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function buildHeritageSiteFromForm(
  form: AdminSiteFormInput,
  existing?: HeritageSite | null
): HeritageSite {
  const safeId =
    existing?.id || form.id.trim() || slugifyVietnamese(form.nameVi) || `site-${Date.now()}`;
  const summaryVi = form.shortSummaryVi.trim() || `${form.nameVi.trim()} tại ${form.city.trim()}.`;
  const nameEn = form.nameEn.trim() || form.nameVi.trim();
  const baseVi = existing?.translations.vi;

  const parsedHighlights = (form.architecturalHighlightsText || '')
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

  const parsedAudioScript = (form.audioScriptText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const viContent = {
    name: form.nameVi.trim(),
    shortSummary: summaryVi,
    historicalEra: form.historicalEra.trim() || baseVi?.historicalEra || 'TP. Hồ Chí Minh',
    openingHours: form.openingHours.trim() || baseVi?.openingHours || '07:30 – 17:30 Hàng ngày',
    architecturalHighlights:
      parsedHighlights.length > 0
        ? parsedHighlights
        : baseVi?.architecturalHighlights && baseVi.architecturalHighlights.length > 0
          ? baseVi.architecturalHighlights
          : ['Công trình di sản văn hóa – lịch sử tiêu biểu tại TP. Hồ Chí Minh'],
    audioScript:
      parsedAudioScript.length > 0
        ? parsedAudioScript
        : baseVi?.audioScript && baseVi.audioScript.length > 0
          ? baseVi.audioScript
          : [
              `Chào mừng quý khách đến với ${form.nameVi.trim()}, tọa lạc tại ${form.address.trim() || form.city.trim()}. ${summaryVi}`,
            ],
  };

  const enContent = existing?.translations.en
    ? {
        ...existing.translations.en,
        name: nameEn,
        historicalEra: viContent.historicalEra,
        openingHours: viContent.openingHours,
      }
    : {
        name: nameEn,
        shortSummary: summaryVi,
        historicalEra: viContent.historicalEra,
        openingHours: viContent.openingHours,
        architecturalHighlights: viContent.architecturalHighlights,
        audioScript: [
          `Welcome to ${nameEn} located in ${form.city.trim()}. ${summaryVi}`,
        ],
      };

  const cover =
    form.coverImage.trim() ||
    existing?.coverImage ||
    'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80';

  return {
    id: safeId,
    city: form.city.trim() || 'Quận 1 · TP.HCM',
    district: form.district.trim() || form.city.split('·')[0]?.trim() || 'Quận 1',
    lat: form.lat,
    lng: form.lng,
    category: form.category,
    unescoRecognized: form.unescoRecognized,
    nationalSpecialMonument: form.nationalSpecialMonument,
    rating: form.rating,
    reviewCount: existing?.reviewCount ?? 120,
    ticketPrice: form.ticketPrice.trim() || 'Miễn phí tham quan',
    address: form.address.trim() || form.city.trim(),
    coverImage: cover,
    translations: {
      vi: viContent,
      en: enContent,
      fr: existing?.translations.fr ?? enContent,
      zh: existing?.translations.zh ?? enContent,
      ja: existing?.translations.ja ?? enContent,
    },
    mediaGallery:
      existing?.mediaGallery && existing.mediaGallery.length > 0
        ? existing.mediaGallery
        : [
            {
              id: `${safeId}-img-1`,
              type: 'image',
              url: cover,
              caption: {
                vi: form.nameVi.trim(),
                en: nameEn,
                fr: nameEn,
                zh: nameEn,
                ja: nameEn,
              },
              yearOrSource: 'Quản trị Smart Heritage Guide',
            },
          ],
    nearbyRestaurants: existing?.nearbyRestaurants ?? [],
  };
}

export function buildRestaurantFromForm(
  form: AdminRestaurantFormInput,
  existing?: NearbyRestaurant | null
): NearbyRestaurant {
  const dishes = form.specialtyDishesText
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);

  return {
    id:
      existing?.id ||
      form.id?.trim() ||
      `res-adm-${slugifyVietnamese(form.name).slice(0, 18)}-${Date.now().toString(36).slice(-4)}`,
    name: form.name.trim(),
    cuisine: form.cuisine.trim() || 'Ẩm thực Việt Nam',
    specialtyDishes: dishes.length > 0 ? dishes : ['Đặc sản địa phương'],
    rating: form.rating,
    reviewCount: existing?.reviewCount ?? 150,
    priceRange: form.priceRange.trim() || '45.000đ – 120.000đ',
    lat: form.lat,
    lng: form.lng,
    address: form.address.trim() || 'TP. Hồ Chí Minh',
    openHours: form.openHours.trim() || '07:00 – 21:30',
    imageUrl:
      form.imageUrl.trim() ||
      existing?.imageUrl ||
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    source: existing?.source ?? 'curated',
    overtureId: existing?.overtureId,
    confidence: existing?.confidence,
  };
}

export async function fetchBackendHealth(): Promise<ApiResult<BackendHealthStatus>> {
  return apiRequest<BackendHealthStatus>('/api/v1/health', {
    method: 'GET',
    skipAuth: true,
    timeoutMs: 4000,
  });
}

export async function adminCreateSite(
  site: HeritageSite
): Promise<ApiResult<unknown>> {
  return apiRequest('/api/v1/admin/sites', {
    method: 'POST',
    body: {
      id: site.id,
      city: site.city,
      district: site.district ?? null,
      lat: site.lat,
      lng: site.lng,
      category: site.category,
      unesco_recognized: Boolean(site.unescoRecognized),
      national_special_monument: Boolean(site.nationalSpecialMonument),
      rating: site.rating,
      review_count: site.reviewCount,
      ticket_price: site.ticketPrice,
      address: site.address ?? null,
      cover_image: site.coverImage,
      recommended_visit_minutes: 45,
      translations: site.translations,
      media_gallery: site.mediaGallery,
    },
  });
}

export async function adminUpdateSite(
  siteId: string,
  site: HeritageSite
): Promise<ApiResult<unknown>> {
  return apiRequest(`/api/v1/admin/sites/${encodeURIComponent(siteId)}`, {
    method: 'PUT',
    body: {
      city: site.city,
      district: site.district ?? null,
      lat: site.lat,
      lng: site.lng,
      category: site.category,
      unesco_recognized: Boolean(site.unescoRecognized),
      national_special_monument: Boolean(site.nationalSpecialMonument),
      rating: site.rating,
      review_count: site.reviewCount,
      ticket_price: site.ticketPrice,
      address: site.address ?? null,
      cover_image: site.coverImage,
      translations: site.translations,
      media_gallery: site.mediaGallery,
    },
  });
}

export async function adminDeleteSite(siteId: string): Promise<ApiResult<unknown>> {
  return apiRequest(`/api/v1/admin/sites/${encodeURIComponent(siteId)}`, {
    method: 'DELETE',
  });
}

export async function adminCreateRestaurant(
  siteId: string,
  restaurant: NearbyRestaurant
): Promise<ApiResult<unknown>> {
  return apiRequest('/api/v1/admin/restaurants', {
    method: 'POST',
    body: {
      id: restaurant.id,
      site_id: siteId,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      specialty_dishes: restaurant.specialtyDishes,
      rating: restaurant.rating,
      review_count: restaurant.reviewCount,
      price_range: restaurant.priceRange,
      lat: restaurant.lat,
      lng: restaurant.lng,
      address: restaurant.address,
      open_hours: restaurant.openHours,
      meal_slots: ['lunch', 'dinner'],
      image_url: restaurant.imageUrl,
    },
  });
}

export async function adminUpdateRestaurant(
  siteId: string,
  restaurant: NearbyRestaurant
): Promise<ApiResult<unknown>> {
  return apiRequest(
    `/api/v1/admin/restaurants/${encodeURIComponent(restaurant.id)}`,
    {
      method: 'PUT',
      body: {
        site_id: siteId,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        specialty_dishes: restaurant.specialtyDishes,
        rating: restaurant.rating,
        review_count: restaurant.reviewCount,
        price_range: restaurant.priceRange,
        lat: restaurant.lat,
        lng: restaurant.lng,
        address: restaurant.address,
        open_hours: restaurant.openHours,
        image_url: restaurant.imageUrl,
      },
    }
  );
}

export async function adminDeleteRestaurant(
  restaurantId: string
): Promise<ApiResult<unknown>> {
  return apiRequest(
    `/api/v1/admin/restaurants/${encodeURIComponent(restaurantId)}`,
    {
      method: 'DELETE',
    }
  );
}

export function getAdminApiEndpointLabel(): string {
  return getApiBaseUrl();
}
