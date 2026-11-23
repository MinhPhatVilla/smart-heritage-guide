import {
  HeritageCategory,
  HeritageSite,
  NearbyRestaurant,
} from '../../types/heritage';

export type AdminTabId = 'overview' | 'sites' | 'dining' | 'audit_map' | 'system';

export type AdminRegionFilter =
  | 'all'
  | 'hcm_core'
  | 'binh_duong'
  | 'vung_tau'
  | 'con_dao';

export type RestaurantSourceFilter = 'all' | 'curated' | 'overture';

export interface FlattenedRestaurant {
  siteId: string;
  siteName: string;
  siteRegion: Exclude<AdminRegionFilter, 'all'>;
  restaurant: NearbyRestaurant;
}

export interface AdminActivityItem {
  id: string;
  action: 'create' | 'update' | 'delete' | 'health';
  entityType: 'site' | 'restaurant' | 'system';
  title: string;
  timestamp: string;
  syncedCloud: boolean;
}

export interface AdminQualitySummary {
  totalSites: number;
  totalRestaurants: number;
  curatedRestaurants: number;
  overtureRestaurants: number;
  wikimediaCovers: number;
  multiPhotoSites: number;
  fullFiveLangSites: number;
  sitesWithoutDining: number;
  nationalSpecialCount: number;
  unescoCount: number;
  regionCounts: Record<Exclude<AdminRegionFilter, 'all'>, number>;
  categoryCounts: Record<HeritageCategory, number>;
}

export const CATEGORY_OPTIONS: Array<{ id: HeritageCategory; label: string }> = [
  { id: 'monument', label: 'Di tích' },
  { id: 'museum', label: 'Bảo tàng' },
  { id: 'temple', label: 'Đền Chùa' },
  { id: 'imperial', label: 'Dinh thự' },
  { id: 'ancient_town', label: 'Biển · Chợ · Sinh thái' },
];

export const REGION_OPTIONS: Array<{
  id: AdminRegionFilter;
  label: string;
  shortLabel: string;
}> = [
  { id: 'all', label: 'Toàn TP.HCM mở rộng', shortLabel: 'Tất cả' },
  { id: 'hcm_core', label: 'Nội thành & Củ Chi · Cần Giờ', shortLabel: 'TP.HCM' },
  { id: 'binh_duong', label: 'Khu vực Bình Dương', shortLabel: 'Bình Dương' },
  { id: 'vung_tau', label: 'Bà Rịa – Vũng Tàu', shortLabel: 'Vũng Tàu' },
  { id: 'con_dao', label: 'Đặc khu Côn Đảo', shortLabel: 'Côn Đảo' },
];

export function getCategoryLabel(category: HeritageCategory): string {
  return (
    CATEGORY_OPTIONS.find((item) => item.id === category)?.label || category
  );
}

export function classifySiteRegion(
  site: Pick<HeritageSite, 'city' | 'district' | 'lat'>
): Exclude<AdminRegionFilter, 'all'> {
  const haystack = `${site.city || ''} ${site.district || ''}`.toLowerCase();
  if (haystack.includes('côn đảo') || site.lat < 9.5) {
    return 'con_dao';
  }
  if (
    haystack.includes('bình dương') ||
    haystack.includes('thủ dầu một') ||
    haystack.includes('thuận an') ||
    haystack.includes('dĩ an') ||
    haystack.includes('bến cát')
  ) {
    return 'binh_duong';
  }
  if (
    haystack.includes('vũng tàu') ||
    haystack.includes('bà rịa') ||
    haystack.includes('long sơn') ||
    haystack.includes('long hải') ||
    haystack.includes('long đất') ||
    haystack.includes('đất đỏ') ||
    haystack.includes('phú mỹ') ||
    haystack.includes('châu đức') ||
    haystack.includes('hồ tràm') ||
    haystack.includes('hồ cốc') ||
    haystack.includes('bình châu') ||
    haystack.includes('xuyên mộc') ||
    haystack.includes('lộc an')
  ) {
    return 'vung_tau';
  }
  return 'hcm_core';
}

export function computeAdminQualitySummary(
  sites: HeritageSite[]
): AdminQualitySummary {
  const regionCounts: Record<Exclude<AdminRegionFilter, 'all'>, number> = {
    hcm_core: 0,
    binh_duong: 0,
    vung_tau: 0,
    con_dao: 0,
  };
  const categoryCounts: Record<HeritageCategory, number> = {
    monument: 0,
    museum: 0,
    temple: 0,
    imperial: 0,
    ancient_town: 0,
  };

  let totalRestaurants = 0;
  let overtureRestaurants = 0;
  let wikimediaCovers = 0;
  let multiPhotoSites = 0;
  let fullFiveLangSites = 0;
  let sitesWithoutDining = 0;
  let nationalSpecialCount = 0;
  let unescoCount = 0;

  for (let i = 0; i < sites.length; i++) {
    const s = sites[i];
    regionCounts[classifySiteRegion(s)] += 1;
    if (categoryCounts[s.category] !== undefined) {
      categoryCounts[s.category] += 1;
    }
    if (s.coverImage && s.coverImage.includes('wikimedia.org')) {
      wikimediaCovers += 1;
    }
    if (Array.isArray(s.mediaGallery) && s.mediaGallery.length >= 2) {
      multiPhotoSites += 1;
    }
    const t = s.translations;
    if (
      t?.vi?.audioScript?.length &&
      t?.en?.audioScript?.length &&
      t?.fr?.audioScript?.length &&
      t?.zh?.audioScript?.length &&
      t?.ja?.audioScript?.length
    ) {
      fullFiveLangSites += 1;
    }
    if (s.nationalSpecialMonument) nationalSpecialCount += 1;
    if (s.unescoRecognized) unescoCount += 1;

    const eateries = Array.isArray(s.nearbyRestaurants)
      ? s.nearbyRestaurants
      : [];
    if (eateries.length === 0) {
      sitesWithoutDining += 1;
    }
    totalRestaurants += eateries.length;
    for (let j = 0; j < eateries.length; j++) {
      if (eateries[j].source === 'overture') {
        overtureRestaurants += 1;
      }
    }
  }

  return {
    totalSites: sites.length,
    totalRestaurants,
    curatedRestaurants: totalRestaurants - overtureRestaurants,
    overtureRestaurants,
    wikimediaCovers,
    multiPhotoSites,
    fullFiveLangSites,
    sitesWithoutDining,
    nationalSpecialCount,
    unescoCount,
    regionCounts,
    categoryCounts,
  };
}
