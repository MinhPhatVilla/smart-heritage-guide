import { HeritageCategory, SupportedLanguage } from '../types/heritage';
import { ApiResult, apiRequest } from './apiClient';
import { UserProfile } from './authService';
import { WeatherContextPayload } from './weatherService';

// ---------------------------------------------------------------------------
// Smart AI Pillar 1: Explainable Recommendations & 2-Opt Walking Tour Planner
// ---------------------------------------------------------------------------

export interface RecommendationRequest {
  lat: number;
  lng: number;
  language?: SupportedLanguage;
  preferred_categories?: HeritageCategory[];
  visited_site_ids?: string[];
  max_results?: number;
  current_hour?: number;
  radius_m?: number;
}

export interface ScoreBreakdown {
  distance_score: number;
  novelty_score: number;
  category_score: number;
  rating_score: number;
  status_score: number;
}

export interface BackendRestaurant {
  id: string;
  site_id: string;
  name: string;
  cuisine: string;
  specialty_dishes: string[];
  rating: number;
  review_count: number;
  price_range: string;
  lat: number;
  lng: number;
  address: string;
  open_hours: string;
  meal_slots: string[];
  image_url: string;
  distance_meters?: number | null;
}

export interface RecommendedSiteItem {
  site_id: string;
  site_name: string;
  city: string;
  district?: string | null;
  category: string;
  lat: number;
  lng: number;
  cover_image: string;
  rating: number;
  review_count: number;
  distance_meters: number;
  estimated_walk_minutes: number;
  recommended_visit_minutes: number;
  score: number;
  score_breakdown: ScoreBreakdown;
  reasons: string[];
  nearest_restaurant?: BackendRestaurant | null;
}

export interface RecommendationResponse {
  items: RecommendedSiteItem[];
  recommended_restaurants: BackendRestaurant[];
  context_summary: string;
}

export interface TourPlanRequest {
  lat: number;
  lng: number;
  available_minutes: number;
  start_hour?: number;
  preferred_categories?: HeritageCategory[];
  visited_site_ids?: string[];
  include_meal_stop?: boolean;
  language?: SupportedLanguage;
  max_stops?: number;
  weather_context?: WeatherContextPayload;
}

export interface TourStopItem {
  order: number;
  stop_type: 'heritage' | 'meal';
  site_id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  cover_image: string;
  arrival_time: string;
  departure_time: string;
  stay_minutes: number;
  walk_from_prev_meters: number;
  walk_from_prev_minutes: number;
  score: number;
  reasons: string[];
  meal_slot?: string | null;
  specialty_dishes: string[];
}

export interface TourPlanResponse {
  stops: TourStopItem[];
  total_sites: number;
  total_walking_meters: number;
  total_walking_minutes: number;
  total_visit_minutes: number;
  total_duration_minutes: number;
  distance_saved_meters: number;
  initial_distance_meters: number;
  optimized_distance_meters: number;
  optimization_method: string;
  route_polyline: [number, number][];
  meal_stop_included: boolean;
  summary: string;
}

// ---------------------------------------------------------------------------
// Smart AI Pillar 2: Multilingual RAG Heritage Chatbot
// ---------------------------------------------------------------------------

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatRequest {
  question: string;
  language: SupportedLanguage;
  site_id?: string | null;
  lat?: number;
  lng?: number;
  history?: ChatHistoryMessage[];
}

export interface ChatCitation {
  site_id: string;
  site_name: string;
  source_type: string;
  snippet: string;
  score: number;
}

export interface AiChatResponse {
  answer: string;
  language: SupportedLanguage;
  citations: ChatCitation[];
  suggested_questions: string[];
  mode: 'gemini' | 'fallback';
}

// ---------------------------------------------------------------------------
// Smart AI Pillar 3: Vision AI Identification
// ---------------------------------------------------------------------------

export interface VisionIdentifyRequest {
  image_base64: string;
  mime_type?: string;
  lat?: number;
  lng?: number;
  language?: SupportedLanguage;
}

export interface VisionIdentifyResponse {
  matched_site_id: string | null;
  matched_site_name: string | null;
  confidence: number;
  architectural_cues: string[];
  auto_open_audio: boolean;
  candidate_count: number;
  mode: 'gemini_vision' | 'gps_fallback';
  message: string;
}

// ---------------------------------------------------------------------------
// Leaderboard & Achievement Badges
// ---------------------------------------------------------------------------

export interface BadgeOut {
  code: string;
  title_vi: string;
  title_en: string;
  description_vi: string;
  icon_name: string;
  rule_config: Record<string, unknown>;
  unlocked: boolean;
  unlocked_at?: string | null;
  progress_percent: number;
}

export interface LeaderboardEntryOut {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
  total_verified_walking_seconds: number;
  total_verified_walking_meters: number;
  verified_sites_count: number;
  badges_count: number;
  effort_score: number;
}

export type LeaderboardSortBy =
  | 'walking_time'
  | 'walking_distance'
  | 'sites_count';

export interface GlobalLeaderboardResponse {
  sort_by: LeaderboardSortBy;
  total_users: number;
  entries: LeaderboardEntryOut[];
}

export interface MyLeaderboardResponse {
  profile: UserProfile;
  rank: number | null;
  total_users: number;
  unlocked_badges: BadgeOut[];
  upcoming_badges: BadgeOut[];
}

export const OFFLINE_FALLBACK_BADGES: BadgeOut[] = [
  {
    code: 'first_step',
    title_vi: 'Bước Chân Đầu Tiên',
    title_en: 'First Step',
    description_vi: 'Hoàn thành check-in đi bộ xác thực GPS đầu tiên.',
    icon_name: 'footprints',
    rule_config: { verified_sites: 1 },
    unlocked: false,
    progress_percent: 0,
  },
  {
    code: 'district1_master',
    title_vi: 'Thổ Địa Quận 1',
    title_en: 'District 1 Master',
    description_vi: 'Khám phá ít nhất 3 di tích lịch sử tại Quận 1.',
    icon_name: 'compass',
    rule_config: { district1_sites: 3 },
    unlocked: false,
    progress_percent: 0,
  },
  {
    code: 'museum_lover',
    title_vi: 'Người Yêu Bảo Tàng',
    title_en: 'Museum Lover',
    description_vi: 'Ghé thăm ít nhất 2 bảo tàng tại TP.HCM.',
    icon_name: 'landmark',
    rule_config: { museum_sites: 2 },
    unlocked: false,
    progress_percent: 0,
  },
  {
    code: 'heritage_photographer',
    title_vi: 'Nhiếp Ảnh Di Sản',
    title_en: 'Heritage Photographer',
    description_vi: 'Lưu giữ ít nhất 3 ảnh kỷ niệm tại các di tích.',
    icon_name: 'camera',
    rule_config: { photos: 3 },
    unlocked: false,
    progress_percent: 0,
  },
  {
    code: 'walking_marathon',
    title_vi: 'Nhà Bộ Hành Bền Bỉ',
    title_en: 'Walking Marathon',
    description_vi: 'Tích lũy tổng quãng đường đi bộ xác thực ≥ 5 km.',
    icon_name: 'flame',
    rule_config: { meters: 5000 },
    unlocked: false,
    progress_percent: 0,
  },
  {
    code: 'saigon_explorer',
    title_vi: 'Nhà Thám Hiểm Sài Gòn',
    title_en: 'Saigon Explorer',
    description_vi: 'Chinh phục ít nhất 6 điểm di sản TP.HCM.',
    icon_name: 'trophy',
    rule_config: { verified_sites: 6 },
    unlocked: false,
    progress_percent: 0,
  },
];

// ---------------------------------------------------------------------------
// API Callers (Offline-first safe)
// ---------------------------------------------------------------------------

export async function fetchRecommendations(
  req: RecommendationRequest
): Promise<ApiResult<RecommendationResponse>> {
  return apiRequest<RecommendationResponse>('/api/v1/ai/recommendations', {
    method: 'POST',
    body: {
      lat: req.lat,
      lng: req.lng,
      language: req.language || 'vi',
      preferred_categories: req.preferred_categories || [],
      visited_site_ids: req.visited_site_ids || [],
      max_results: req.max_results ?? 6,
      current_hour: req.current_hour ?? new Date().getHours(),
      radius_m: req.radius_m,
    },
    timeoutMs: 12000,
  });
}

export async function fetchSmartTourPlan(
  req: TourPlanRequest
): Promise<ApiResult<TourPlanResponse>> {
  return apiRequest<TourPlanResponse>('/api/v1/ai/tour-plan', {
    method: 'POST',
    body: {
      lat: req.lat,
      lng: req.lng,
      available_minutes: req.available_minutes,
      start_hour: req.start_hour ?? new Date().getHours(),
      preferred_categories: req.preferred_categories || [],
      visited_site_ids: req.visited_site_ids || [],
      include_meal_stop: req.include_meal_stop ?? true,
      language: req.language || 'vi',
      max_stops: req.max_stops ?? 5,
    },
    timeoutMs: 15000,
  });
}

export async function sendAiChatMessage(
  req: AiChatRequest
): Promise<ApiResult<AiChatResponse>> {
  return apiRequest<AiChatResponse>('/api/v1/ai/chat', {
    method: 'POST',
    body: {
      question: req.question.trim(),
      language: req.language,
      site_id: req.site_id || null,
      lat: req.lat,
      lng: req.lng,
      history: (req.history || []).slice(-6),
    },
    timeoutMs: 25000,
  });
}

export async function identifyHeritageFromImage(
  req: VisionIdentifyRequest
): Promise<ApiResult<VisionIdentifyResponse>> {
  return apiRequest<VisionIdentifyResponse>('/api/v1/ai/vision/identify', {
    method: 'POST',
    body: {
      image_base64: req.image_base64,
      mime_type: req.mime_type || 'image/jpeg',
      lat: req.lat,
      lng: req.lng,
      language: req.language || 'vi',
    },
    timeoutMs: 25000,
  });
}

export async function fetchGlobalLeaderboard(
  sortBy: LeaderboardSortBy = 'walking_time',
  limit = 20
): Promise<ApiResult<GlobalLeaderboardResponse>> {
  return apiRequest<GlobalLeaderboardResponse>('/api/v1/leaderboard/global', {
    method: 'GET',
    query: { sort_by: sortBy, limit },
    timeoutMs: 8000,
  });
}

export async function fetchMyLeaderboard(): Promise<
  ApiResult<MyLeaderboardResponse>
> {
  return apiRequest<MyLeaderboardResponse>('/api/v1/leaderboard/me', {
    method: 'GET',
    timeoutMs: 8000,
  });
}

export async function fetchAllBadges(): Promise<ApiResult<BadgeOut[]>> {
  const res = await apiRequest<BadgeOut[] | { items?: BadgeOut[] }>(
    '/api/v1/badges',
    {
      method: 'GET',
      timeoutMs: 8000,
    }
  );
  if (!res.ok) return res;
  const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
  return {
    ok: true,
    status: res.status,
    data: list,
    isOffline: false,
  };
}

export function getOfflineAiChatFallbackMessage(
  language: SupportedLanguage
): string {
  switch (language) {
    case 'en':
      return 'Unable to reach the AI Backend right now. You can still listen to the offline audio guide, browse architecture highlights, and navigate with offline routes.';
    case 'fr':
      return "Impossible de joindre le serveur IA pour le moment. Vous pouvez continuer à écouter l'audioguide hors ligne et consulter les fiches du patrimoine.";
    case 'zh':
      return '目前无法连接到 AI 后端服务器。您仍可使用离线语音导览、查看建筑亮点和离线步行路线。';
    case 'ja':
      return '現在AIバックエンドに接続できません。オフラインの音声ガイドや建築の見どころ、徒歩ルート案内は引き続きご利用いただけます。';
    default:
      return 'Chưa kết nối được máy chủ AI Backend (hãy kiểm tra FastAPI server hoặc mạng). Bạn vẫn có thể nghe thuyết minh đa ngôn ngữ, xem tư liệu và dẫn đường ở chế độ Offline.';
  }
}
