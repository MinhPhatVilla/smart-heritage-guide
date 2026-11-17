import { CapturedPhoto, VisitedSiteRecord } from '../types/heritage';

const STORAGE_KEY = 'smart_heritage_guide_hcm_journey_v2';

const INITIAL_SAMPLE_JOURNEYS: VisitedSiteRecord[] = [
  {
    id: 'visit-hcm-1',
    siteId: 'dinh-doc-lap',
    siteName: 'Di tích Quốc gia Đặc biệt Dinh Độc Lập (Hội trường Thống Nhất)',
    city: 'Quận 1 · TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
    visitedAt: '2026-11-06T08:30:00.000Z',
    walkingDurationSeconds: 1380, // 23 phút đi bộ
    walkingDistanceMeters: 1720,
    routeCoordinates: [
      [10.7725, 106.698],
      [10.7748, 106.6966],
      [10.777, 106.6953],
    ],
    photos: [
      {
        id: 'photo-hcm-1',
        siteId: 'dinh-doc-lap',
        siteName: 'Dinh Độc Lập',
        dataUrl:
          'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80',
        takenAt: '2026-11-06T09:00:00.000Z',
        caption: 'Check-in trước mặt tiền rèm hoa đá trúc tại Dinh Độc Lập sau hành trình đi bộ từ Chợ Bến Thành.',
        lat: 10.777,
        lng: 106.6953,
        walkingDurationSecondsAtCapture: 1380,
      },
    ],
    userNote:
      'Kiến trúc của KTS Ngô Viết Thụ và khu hầm chỉ huy ngầm vô cùng ấn tượng, thuyết minh đa ngôn ngữ rất chi tiết.',
    userRating: 5,
  },
  {
    id: 'visit-hcm-2',
    siteId: 'buu-dien-trung-tam-sai-gon',
    siteName: 'Bưu điện Trung tâm Sài Gòn & Đường sách Nguyễn Văn Bình',
    city: 'Quận 1 · TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=1200&q=80',
    visitedAt: '2026-11-06T10:15:00.000Z',
    walkingDurationSeconds: 780, // 13 phút đi bộ
    walkingDistanceMeters: 950,
    routeCoordinates: [
      [10.777, 106.6953],
      [10.7788, 106.6975],
      [10.78, 106.6999],
    ],
    photos: [
      {
        id: 'photo-hcm-2',
        siteId: 'buu-dien-trung-tam-sai-gon',
        siteName: 'Bưu điện Trung tâm Sài Gòn',
        dataUrl:
          'https://images.unsplash.com/photo-1555921015-5532091f6026?auto=format&fit=crop&w=900&q=80',
        takenAt: '2026-11-06T10:30:00.000Z',
        caption: 'Vòm thép cổ điển hơn 130 năm tuổi và bản đồ Sài Gòn 1892 bên trong Bưu điện.',
        lat: 10.78,
        lng: 106.6999,
        walkingDurationSecondsAtCapture: 780,
      },
    ],
    userNote: 'Đi bộ dọc công viên 30/4 rợp bóng cây cổ thụ sang Bưu điện và Đường sách rất mát mẻ.',
    userRating: 5,
  },
  {
    id: 'visit-hcm-3',
    siteId: 'ben-nha-rong',
    siteName: 'Di tích Lịch sử Bến Nhà Rồng (Bảo tàng Hồ Chí Minh)',
    city: 'Quận 4 · TP.HCM',
    coverImage:
      'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=1200&q=80',
    visitedAt: '2026-11-06T16:20:00.000Z',
    walkingDurationSeconds: 1620, // 27 phút đi bộ dọc Phố đi bộ Nguyễn Huệ & Cầu Móng
    walkingDistanceMeters: 2050,
    routeCoordinates: [
      [10.776, 106.701],
      [10.7715, 106.7048],
      [10.7683, 106.7068],
    ],
    photos: [
      {
        id: 'photo-hcm-3',
        siteId: 'ben-nha-rong',
        siteName: 'Bến Nhà Rồng',
        dataUrl:
          'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=900&q=80',
        takenAt: '2026-11-06T16:50:00.000Z',
        caption: 'Hoàng hôn bên sông Sài Gòn tại Bến Nhà Rồng lịch sử.',
        lat: 10.7683,
        lng: 106.7068,
        walkingDurationSecondsAtCapture: 1620,
      },
    ],
    userNote: 'Đi bộ dọc đại lộ Nguyễn Huệ qua Cầu Móng sang Bến Nhà Rồng rất đẹp và ý nghĩa.',
    userRating: 5,
  },
];

export function loadVisitedSiteRecords(): VisitedSiteRecord[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_JOURNEYS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(INITIAL_SAMPLE_JOURNEYS)
      );
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
    // Ignore storage quota errors
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
      userNote:
        input.userNote !== undefined ? input.userNote : existing.userNote,
      userRating:
        input.userRating !== undefined ? input.userRating : existing.userRating,
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
      input.userNote || `Đã đi bộ khám phá và check-in tại ${input.siteName}.`,
    userRating: input.userRating || 5,
  };

  const next = [created, ...records];
  saveVisitedSiteRecords(next);
  return next;
}
