import { CapturedPhoto, VisitedSiteRecord } from '../types/heritage';

const STORAGE_KEY = 'smart_heritage_guide_journey_v1';

const INITIAL_SAMPLE_JOURNEYS: VisitedSiteRecord[] = [
  {
    id: 'visit-sample-1',
    siteId: 'hoang-thanh-thang-long',
    siteName: 'Hoàng Thành Thăng Long',
    city: 'Ha Noi',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    visitedAt: '2026-11-06T09:15:00.000Z',
    walkingDurationSeconds: 1420, // ~23 phút 40 giây đi bộ
    walkingDistanceMeters: 1750,
    routeCoordinates: [
      [21.0285, 105.8355],
      [21.0312, 105.8381],
      [21.0341, 105.84],
    ],
    photos: [
      {
        id: 'photo-sample-1',
        siteId: 'hoang-thanh-thang-long',
        siteName: 'Hoàng Thành Thăng Long',
        dataUrl:
          'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=900&q=80',
        takenAt: '2026-11-06T09:40:00.000Z',
        caption: 'Check-in trước cổng Đoan Môn sau hơn 23 phút đi bộ khám phá khu phố Ba Đình.',
        lat: 21.0341,
        lng: 105.84,
        walkingDurationSecondsAtCapture: 1420,
      },
    ],
    userNote:
      'Không gian Đoan Môn và nền Điện Kính Thiên vô cùng trang nghiêm, thuyết minh tiếng Việt & tiếng Anh rất rõ ràng.',
    userRating: 5,
  },
  {
    id: 'visit-sample-2',
    siteId: 'van-mieu-quoc-tu-giam',
    siteName: 'Văn Miếu – Quốc Tử Giám',
    city: 'Ha Noi',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    visitedAt: '2026-11-06T15:20:00.000Z',
    walkingDurationSeconds: 860, // ~14 phút 20 giây đi bộ
    walkingDistanceMeters: 1080,
    routeCoordinates: [
      [21.0241, 105.8412],
      [21.0265, 105.838],
      [21.0285, 105.8355],
    ],
    photos: [
      {
        id: 'photo-sample-2',
        siteId: 'van-mieu-quoc-tu-giam',
        siteName: 'Văn Miếu – Quốc Tử Giám',
        dataUrl:
          'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=900&q=80',
        takenAt: '2026-11-06T15:35:00.000Z',
        caption: 'Khuê Văn Các soi bóng bên Giếng Thiên Quang chiều thu Hà Nội.',
        lat: 21.0285,
        lng: 105.8355,
        walkingDurationSecondsAtCapture: 860,
      },
    ],
    userNote: 'Vườn bia Tiến sĩ rất ấn tượng, sau khi tham quan còn ghé quán KOTO ngay sát Văn Miếu.',
    userRating: 5,
  },
];

export function loadVisitedSiteRecords(): VisitedSiteRecord[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_JOURNEYS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_JOURNEYS));
      return INITIAL_SAMPLE_JOURNEYS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SAMPLE_JOURNEYS;
  } catch {
    return INITIAL_SAMPLE_JOURNEYS;
  }
}

export function saveVisitedSiteRecords(records: VisitedSiteRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Fallback if storage quota is full
  }
}

export function upsertSiteVisitRecord(
  records: VisitedSiteRecord[],
  input: {
    siteId: string;
    siteName: string;
    city: string;
    coverImage: string;
    walkingDurationSeconds: number;
    walkingDistanceMeters: number;
    routeCoordinates?: [number, number][];
    photo?: CapturedPhoto;
    userNote?: string;
    userRating?: number;
  }
): VisitedSiteRecord[] {
  const existingIdx = records.findIndex((r) => r.siteId === input.siteId);
  const nowIso = new Date().toISOString();

  if (existingIdx >= 0) {
    const existing = records[existingIdx];
    const updated: VisitedSiteRecord = {
      ...existing,
      visitedAt: nowIso,
      walkingDurationSeconds: Math.max(
        existing.walkingDurationSeconds,
        input.walkingDurationSeconds
      ),
      walkingDistanceMeters: Math.max(
        existing.walkingDistanceMeters,
        input.walkingDistanceMeters
      ),
      routeCoordinates:
        input.routeCoordinates && input.routeCoordinates.length > 0
          ? input.routeCoordinates
          : existing.routeCoordinates,
      photos: input.photo ? [input.photo, ...existing.photos] : existing.photos,
      userNote: input.userNote !== undefined ? input.userNote : existing.userNote,
      userRating: input.userRating !== undefined ? input.userRating : existing.userRating,
    };
    const next = [...records];
    next[existingIdx] = updated;
    saveVisitedSiteRecords(next);
    return next;
  }

  const created: VisitedSiteRecord = {
    id: `visit-${Date.now()}`,
    siteId: input.siteId,
    siteName: input.siteName,
    city: input.city,
    coverImage: input.coverImage,
    visitedAt: nowIso,
    walkingDurationSeconds: Math.max(60, input.walkingDurationSeconds),
    walkingDistanceMeters: Math.max(50, input.walkingDistanceMeters),
    routeCoordinates: input.routeCoordinates || [],
    photos: input.photo ? [input.photo] : [],
    userNote:
      input.userNote ||
      `Đã đi bộ khám phá và check-in tại ${input.siteName}.`,
    userRating: input.userRating || 5,
  };

  const next = [created, ...records];
  saveVisitedSiteRecords(next);
  return next;
}
