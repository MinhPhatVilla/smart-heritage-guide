export type SupportedLanguage = 'vi' | 'en' | 'fr' | 'zh' | 'ja';

export interface LanguageMetadata {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
  bcp47: string;
}

export const SUPPORTED_LANGUAGES: LanguageMetadata[] = [
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt', flag: '🇻🇳', bcp47: 'vi-VN' },
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧', bcp47: 'en-US' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷', bcp47: 'fr-FR' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳', bcp47: 'zh-CN' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵', bcp47: 'ja-JP' },
];

export interface LocalizedContent {
  name: string;
  shortSummary: string;
  audioScript: string[];
  historicalEra: string;
  openingHours: string;
  architecturalHighlights: string[];
}

export interface DocumentaryMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption: Record<SupportedLanguage, string>;
  yearOrSource: string;
  durationLabel?: string;
}

export interface NearbyRestaurant {
  id: string;
  name: string;
  cuisine: string;
  specialtyDishes: string[];
  rating: number;
  reviewCount: number;
  priceRange: string;
  lat: number;
  lng: number;
  address: string;
  openHours: string;
  imageUrl: string;
}

export type HeritageCategory =
  | 'imperial'
  | 'temple'
  | 'museum'
  | 'monument'
  | 'ancient_town';

export interface HeritageSite {
  id: string;
  city: string; // VD: "Quận 1 · TP.HCM", "Quận 5 · Chợ Lớn", "Củ Chi · TP.HCM"
  district?: string;
  lat: number;
  lng: number;
  category: HeritageCategory;
  unescoRecognized?: boolean;
  nationalSpecialMonument?: boolean;
  rating: number;
  reviewCount: number;
  ticketPrice: string;
  address?: string;
  coverImage: string;
  translations: Record<SupportedLanguage, LocalizedContent>;
  mediaGallery: DocumentaryMedia[];
  nearbyRestaurants: NearbyRestaurant[];
}

export interface CapturedPhoto {
  id: string;
  siteId: string;
  siteName: string;
  dataUrl: string;
  takenAt: string;
  caption: string;
  lat: number;
  lng: number;
  walkingDurationSecondsAtCapture?: number;
}

export interface VisitedSiteRecord {
  id: string;
  siteId: string;
  siteName: string;
  city: string;
  coverImage: string;
  visitedAt: string;
  walkingDurationSeconds: number;
  walkingDistanceMeters: number;
  routeCoordinates: [number, number][];
  photos: CapturedPhoto[];
  userNote: string;
  userRating: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuverType: 'depart' | 'turn-left' | 'turn-right' | 'straight' | 'arrive';
}

export interface WalkingRouteResult {
  origin: [number, number];
  destination: [number, number];
  targetName: string;
  targetType: 'heritage' | 'restaurant';
  targetId: string;
  coordinates: [number, number][];
  totalDistanceMeters: number;
  estimatedDurationSeconds: number;
  steps: RouteStep[];
}

export interface RankedVisitedSite {
  rank: number;
  record: VisitedSiteRecord;
  badgeTitle: string;
  effortScore: number;
}
