import {
  HeritageCategory,
  HeritageSite,
  LocalizedContent,
  NearbyRestaurant,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
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
  tts?: {
    provider: string;
    storage_mode: string;
    offline_engine_ready: boolean;
    offline_models: string[];
  };
}

interface RawBackendHealthResponse {
  status?: string;
  app_name?: string;
  version?: string;
  environment?: string;
  database?: Partial<BackendHealthStatus['database']>;
  services?: {
    auth_provider?: string;
    storage_provider?: string;
    gemini_enabled?: boolean;
    gemini_chat_model?: string;
    routing_primary?: string;
    routing_goong_fallback?: boolean;
    tts_provider?: string;
    tts_storage_mode?: string;
    tts_offline_engine_ready?: boolean;
    tts_offline_models?: string[];
  };
  ai?: Partial<BackendHealthStatus['ai']>;
  auth?: Partial<BackendHealthStatus['auth']>;
  routing?: Partial<BackendHealthStatus['routing']>;
}

function normalizeBackendHealth(raw: RawBackendHealthResponse): BackendHealthStatus {
  const db = raw.database || {};
  const svc = raw.services || {};
  const legacyAi = raw.ai || {};
  const legacyAuth = raw.auth || {};
  const legacyRouting = raw.routing || {};

  return {
    status: raw.status || 'degraded',
    app_name: raw.app_name || 'Smart Heritage Guide API',
    version: raw.version || '1.0.0',
    environment: raw.environment || 'development',
    database: {
      connected: Boolean(db.connected),
      dialect: String(db.dialect || 'unknown'),
      postgis_enabled: Boolean(db.postgis_enabled),
      pgvector_enabled: Boolean(db.pgvector_enabled),
      error: db.error,
    },
    ai: {
      gemini_configured: Boolean(
        legacyAi.gemini_configured ?? svc.gemini_enabled
      ),
      chat_model: String(
        legacyAi.chat_model || svc.gemini_chat_model || 'gemini-2.5-flash'
      ),
      vision_model: String(
        legacyAi.vision_model || svc.gemini_chat_model || 'gemini-2.5-flash'
      ),
      embedding_model: String(
        legacyAi.embedding_model || 'text-embedding-004'
      ),
    },
    auth: {
      supabase_configured: Boolean(
        legacyAuth.supabase_configured ?? svc.auth_provider === 'supabase'
      ),
      storage_configured: Boolean(
        legacyAuth.storage_configured ?? svc.storage_provider === 'supabase'
      ),
    },
    routing: {
      osrm_base_url: String(
        legacyRouting.osrm_base_url ||
          (svc.routing_primary === 'osrm'
            ? 'FOSSGIS OSRM (Primary)'
            : svc.routing_primary || 'OSRM')
      ),
      goong_configured: Boolean(
        legacyRouting.goong_configured ?? svc.routing_goong_fallback
      ),
    },
    tts: {
      provider: String(svc.tts_provider || 'auto'),
      storage_mode: String(svc.tts_storage_mode || 'ram_stream_only'),
      offline_engine_ready: Boolean(svc.tts_offline_engine_ready),
      offline_models: Array.isArray(svc.tts_offline_models)
        ? svc.tts_offline_models
        : [],
    },
  };
}

export interface AdminLocalizedTextDraft {
  name: string;
  shortSummary: string;
  historicalEra: string;
  openingHours: string;
  architecturalHighlightsText: string;
  audioScriptText: string;
}

export type AdminTranslationsDraftMap = Record<
  SupportedLanguage,
  AdminLocalizedTextDraft
>;

export type LanguageCompletenessState = 'empty' | 'partial' | 'complete';

export interface AdminSiteFormInput {
  id: string;
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
  translations: AdminTranslationsDraftMap;
}

export interface AdminTranslateSiteApiResponse {
  source_language: SupportedLanguage;
  translations: Partial<Record<SupportedLanguage, LocalizedContent>>;
  mode: 'gemini' | 'fallback';
  note: string;
}

const DEFAULT_OPENING_HOURS_BY_LANG: Record<SupportedLanguage, string> = {
  vi: '07:30 – 17:30 Hàng ngày',
  en: '07:30 – 17:30 Daily',
  fr: '07h30 – 17h30 Tous les jours',
  zh: '07:30 – 17:30 每日开放',
  ja: '07:30 – 17:30 毎日',
};

const DEFAULT_ERA_BY_LANG: Record<SupportedLanguage, string> = {
  vi: 'Thế kỷ XIX – XX',
  en: '19th – 20th Century',
  fr: 'XIXe – XXe siècle',
  zh: '19世纪 – 20世纪',
  ja: '19世紀〜20世紀',
};

const FALLBACK_HIGHLIGHT_BY_LANG: Record<SupportedLanguage, string> = {
  vi: 'Công trình di sản văn hóa – lịch sử tiêu biểu tại TP. Hồ Chí Minh',
  en: 'Notable cultural and historical heritage landmark in Ho Chi Minh City',
  fr: 'Site culturel et historique emblématique à Hô Chi Minh-Ville',
  zh: '胡志明市具有代表性的历史文化地标',
  ja: 'ホーチミン市を代表する歴史文化遺産スポット',
};

export function createEmptyLocalizedDrafts(): AdminTranslationsDraftMap {
  return {
    vi: {
      name: '',
      shortSummary: '',
      historicalEra: DEFAULT_ERA_BY_LANG.vi,
      openingHours: DEFAULT_OPENING_HOURS_BY_LANG.vi,
      architecturalHighlightsText: '',
      audioScriptText: '',
    },
    en: {
      name: '',
      shortSummary: '',
      historicalEra: '',
      openingHours: '',
      architecturalHighlightsText: '',
      audioScriptText: '',
    },
    fr: {
      name: '',
      shortSummary: '',
      historicalEra: '',
      openingHours: '',
      architecturalHighlightsText: '',
      audioScriptText: '',
    },
    zh: {
      name: '',
      shortSummary: '',
      historicalEra: '',
      openingHours: '',
      architecturalHighlightsText: '',
      audioScriptText: '',
    },
    ja: {
      name: '',
      shortSummary: '',
      historicalEra: '',
      openingHours: '',
      architecturalHighlightsText: '',
      audioScriptText: '',
    },
  };
}

export function extractLocalizedDraftsFromSite(
  site: HeritageSite
): AdminTranslationsDraftMap {
  const result = createEmptyLocalizedDrafts();
  for (const meta of SUPPORTED_LANGUAGES) {
    const loc = site.translations?.[meta.code];
    if (!loc) continue;
    result[meta.code] = {
      name: loc.name || '',
      shortSummary: loc.shortSummary || '',
      historicalEra: loc.historicalEra || '',
      openingHours: loc.openingHours || '',
      architecturalHighlightsText: (loc.architecturalHighlights || []).join('\n'),
      audioScriptText: (loc.audioScript || []).join('\n'),
    };
  }
  return result;
}

export function getLanguageCompleteness(
  draft: AdminLocalizedTextDraft | undefined
): LanguageCompletenessState {
  if (!draft) return 'empty';
  const hasName = Boolean(draft.name.trim());
  const hasSummary = Boolean(draft.shortSummary.trim());
  const hasScript = Boolean(draft.audioScriptText.trim());
  const hasHighlights = Boolean(draft.architecturalHighlightsText.trim());
  if (hasName && hasSummary && hasScript) {
    return 'complete';
  }
  if (hasName || hasSummary || hasScript || hasHighlights) {
    return 'partial';
  }
  return 'empty';
}

export function countCompleteLanguages(
  drafts: AdminTranslationsDraftMap
): number {
  return SUPPORTED_LANGUAGES.filter(
    (meta) => getLanguageCompleteness(drafts[meta.code]) === 'complete'
  ).length;
}

function parseBulletLines(text: string): string[] {
  return (text || '')
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

function parseScriptLines(text: string): string[] {
  return (text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function localizeOpeningHoursFallback(
  raw: string,
  targetLang: SupportedLanguage
): string {
  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT_OPENING_HOURS_BY_LANG[targetLang];
  if (targetLang === 'en') {
    return trimmed
      .replace(/Hàng ngày/gi, 'Daily')
      .replace(/Mỗi ngày/gi, 'Daily')
      .replace(/Mở cửa tự do/gi, 'Open access');
  }
  if (targetLang === 'fr') {
    return trimmed
      .replace(/Hàng ngày|Mỗi ngày|Daily/gi, 'Tous les jours')
      .replace(/Mở cửa tự do/gi, 'Accès libre');
  }
  if (targetLang === 'zh') {
    return trimmed
      .replace(/Hàng ngày|Mỗi ngày|Daily/gi, '每日开放')
      .replace(/Mở cửa tự do/gi, '全天免费开放');
  }
  if (targetLang === 'ja') {
    return trimmed
      .replace(/Hàng ngày|Mỗi ngày|Daily/gi, '毎日')
      .replace(/Mở cửa tự do/gi, '終日開放');
  }
  return trimmed;
}

function localizeEraFallback(
  raw: string,
  targetLang: SupportedLanguage
): string {
  const trimmed = raw.trim();
  if (!trimmed) return DEFAULT_ERA_BY_LANG[targetLang];
  if (targetLang === 'en') {
    return trimmed
      .replace(/Thế kỷ/gi, 'Century')
      .replace(/Hiện đại/gi, 'Modern Era')
      .replace(/Thời Pháp thuộc/gi, 'French Colonial Era');
  }
  if (targetLang === 'fr') {
    return trimmed
      .replace(/Thế kỷ/gi, 'Siècle')
      .replace(/Hiện đại/gi, 'Époque moderne')
      .replace(/Thời Pháp thuộc/gi, 'Époque coloniale française');
  }
  if (targetLang === 'zh') {
    return trimmed
      .replace(/Thế kỷ/gi, '世纪')
      .replace(/Hiện đại/gi, '现代')
      .replace(/Thời Pháp thuộc/gi, '法属时期');
  }
  if (targetLang === 'ja') {
    return trimmed
      .replace(/Thế kỷ/gi, '世紀')
      .replace(/Hiện đại/gi, '現代')
      .replace(/Thời Pháp thuộc/gi, 'フランス植民地時代');
  }
  return trimmed;
}

function buildIntroScriptFallback(
  lang: SupportedLanguage,
  name: string,
  location: string,
  summary: string
): string {
  switch (lang) {
    case 'en':
      return `Welcome to ${name}, located in ${location}. ${summary}`;
    case 'fr':
      return `Bienvenue à ${name}, situé à ${location}. ${summary}`;
    case 'zh':
      return `欢迎来到位于${location}的${name}。${summary}`;
    case 'ja':
      return `${location}にある${name}へようこそ。${summary}`;
    case 'vi':
    default:
      return `Chào mừng quý khách đến với ${name}, tọa lạc tại ${location}. ${summary}`;
  }
}

export function buildLocalFallbackTranslations(
  sourceLang: SupportedLanguage,
  sourceDraft: AdminLocalizedTextDraft,
  city: string,
  address: string,
  targetLanguages?: SupportedLanguage[]
): Partial<Record<SupportedLanguage, AdminLocalizedTextDraft>> {
  const targets = (
    targetLanguages && targetLanguages.length > 0
      ? targetLanguages
      : SUPPORTED_LANGUAGES.map((m) => m.code)
  ).filter((code) => code !== sourceLang);

  const location = address.trim() || city.trim() || 'TP. Hồ Chí Minh';
  const baseName = sourceDraft.name.trim() || 'Heritage Site';
  const baseSummary = sourceDraft.shortSummary.trim() || `${baseName} (${location}).`;
  const sourceHighlights = parseBulletLines(sourceDraft.architecturalHighlightsText);
  const sourceScripts = parseScriptLines(sourceDraft.audioScriptText);

  const result: Partial<Record<SupportedLanguage, AdminLocalizedTextDraft>> = {};
  for (const lang of targets) {
    result[lang] = {
      name: baseName,
      shortSummary: baseSummary,
      historicalEra: localizeEraFallback(sourceDraft.historicalEra, lang),
      openingHours: localizeOpeningHoursFallback(sourceDraft.openingHours, lang),
      architecturalHighlightsText:
        sourceHighlights.length > 0
          ? sourceHighlights.join('\n')
          : FALLBACK_HIGHLIGHT_BY_LANG[lang],
      audioScriptText:
        sourceScripts.length > 0
          ? sourceScripts.join('\n')
          : buildIntroScriptFallback(lang, baseName, location, baseSummary),
    };
  }
  return result;
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
  const viDraft = form.translations.vi;
  const primaryNameVi =
    viDraft.name.trim() ||
    form.translations.en.name.trim() ||
    existing?.translations.vi.name ||
    'Di tích mới';
  const safeId =
    existing?.id ||
    form.id.trim() ||
    slugifyVietnamese(primaryNameVi) ||
    `site-${Date.now()}`;
  const locationLabel = form.address.trim() || form.city.trim() || 'TP. Hồ Chí Minh';

  const buildLocalized = (
    lang: SupportedLanguage,
    fallbackSource?: LocalizedContent
  ): LocalizedContent => {
    const draft = form.translations[lang];
    const existingLoc = existing?.translations?.[lang];
    const name =
      draft?.name.trim() ||
      existingLoc?.name?.trim() ||
      fallbackSource?.name ||
      primaryNameVi;
    const summary =
      draft?.shortSummary.trim() ||
      existingLoc?.shortSummary?.trim() ||
      fallbackSource?.shortSummary ||
      `${name} (${form.city.trim() || 'TP.HCM'}).`;
    const era =
      draft?.historicalEra.trim() ||
      existingLoc?.historicalEra?.trim() ||
      localizeEraFallback(viDraft.historicalEra, lang);
    const hours =
      draft?.openingHours.trim() ||
      existingLoc?.openingHours?.trim() ||
      localizeOpeningHoursFallback(viDraft.openingHours, lang);
    const parsedHighlights = parseBulletLines(
      draft?.architecturalHighlightsText || ''
    );
    const parsedScript = parseScriptLines(draft?.audioScriptText || '');

    return {
      name,
      shortSummary: summary,
      historicalEra: era,
      openingHours: hours,
      architecturalHighlights:
        parsedHighlights.length > 0
          ? parsedHighlights
          : existingLoc?.architecturalHighlights &&
              existingLoc.architecturalHighlights.length > 0
            ? existingLoc.architecturalHighlights
            : fallbackSource?.architecturalHighlights &&
                fallbackSource.architecturalHighlights.length > 0
              ? fallbackSource.architecturalHighlights
              : [FALLBACK_HIGHLIGHT_BY_LANG[lang]],
      audioScript:
        parsedScript.length > 0
          ? parsedScript
          : existingLoc?.audioScript && existingLoc.audioScript.length > 0
            ? existingLoc.audioScript
            : [buildIntroScriptFallback(lang, name, locationLabel, summary)],
    };
  };

  const viContent = buildLocalized('vi');
  const enContent = buildLocalized('en', viContent);
  const frContent = buildLocalized('fr', enContent);
  const zhContent = buildLocalized('zh', enContent);
  const jaContent = buildLocalized('ja', enContent);

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
      fr: frContent,
      zh: zhContent,
      ja: jaContent,
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
                vi: viContent.name,
                en: enContent.name,
                fr: frContent.name,
                zh: zhContent.name,
                ja: jaContent.name,
              },
              yearOrSource: 'Quản trị Smart Heritage Guide',
            },
          ],
    nearbyRestaurants: existing?.nearbyRestaurants ?? [],
  };
}

export async function adminTranslateSiteContent(params: {
  sourceLanguage: SupportedLanguage;
  sourceDraft: AdminLocalizedTextDraft;
  targetLanguages?: SupportedLanguage[];
  city: string;
  address: string;
}): Promise<ApiResult<AdminTranslateSiteApiResponse>> {
  const { sourceLanguage, sourceDraft, targetLanguages, city, address } = params;
  return apiRequest<AdminTranslateSiteApiResponse>('/api/v1/admin/translate-site', {
    method: 'POST',
    timeoutMs: 25000,
    body: {
      source_language: sourceLanguage,
      target_languages: targetLanguages ?? [],
      city: city.trim() || 'TP. Hồ Chí Minh',
      address: address.trim(),
      source_content: {
        name: sourceDraft.name.trim(),
        shortSummary: sourceDraft.shortSummary.trim(),
        historicalEra: sourceDraft.historicalEra.trim(),
        openingHours: sourceDraft.openingHours.trim(),
        architecturalHighlights: parseBulletLines(
          sourceDraft.architecturalHighlightsText
        ),
        audioScript: parseScriptLines(sourceDraft.audioScriptText),
      },
    },
  });
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
  const res = await apiRequest<RawBackendHealthResponse>('/api/v1/health', {
    method: 'GET',
    skipAuth: true,
    timeoutMs: 4000,
  });
  if (!res.ok) return res;
  return {
    ...res,
    data: normalizeBackendHealth(res.data || {}),
  };
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
