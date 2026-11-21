import AsyncStorage from '@react-native-async-storage/async-storage';
import { CapturedPhoto, VisitedSiteRecord } from '../types/heritage';
import { ApiResult, apiRequest, getAuthToken } from './apiClient';
import { BadgeOut } from './aiService';

export const JOURNEY_STORAGE_KEY = 'smart_heritage_guide_hcm_journey_v2';

export const INITIAL_SAMPLE_JOURNEYS: VisitedSiteRecord[] = [
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
        caption:
          'Check-in trước mặt tiền rèm hoa đá trúc tại Dinh Độc Lập sau hành trình đi bộ từ Chợ Bến Thành.',
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
        caption:
          'Vòm thép cổ điển hơn 130 năm tuổi và bản đồ Sài Gòn 1892 bên trong Bưu điện.',
        lat: 10.78,
        lng: 106.6999,
        walkingDurationSecondsAtCapture: 780,
      },
    ],
    userNote:
      'Đi bộ dọc công viên 30/4 rợp bóng cây cổ thụ sang Bưu điện và Đường sách rất mát mẻ.',
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
    userNote:
      'Đi bộ dọc đại lộ Nguyễn Huệ qua Cầu Móng sang Bến Nhà Rồng rất đẹp và ý nghĩa.',
    userRating: 5,
  },
];

export interface JourneyRecordInput {
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

export interface AddPhotoFallbackMeta {
  siteName?: string;
  city?: string;
  coverImage?: string;
  walkingDurationSeconds?: number;
  walkingDistanceMeters?: number;
  routeCoordinates?: [number, number][];
  userNote?: string;
  userRating?: number;
}

function cloneSeedJourneys(): VisitedSiteRecord[] {
  return INITIAL_SAMPLE_JOURNEYS.map((record) => ({
    ...record,
    routeCoordinates: record.routeCoordinates.map(
      (coord) => [coord[0], coord[1]] as [number, number]
    ),
    photos: record.photos.map((photo) => ({ ...photo })),
  }));
}

function mergeJourneyRecord(
  records: VisitedSiteRecord[],
  input: JourneyRecordInput
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
      userRating:
        input.userRating !== undefined ? input.userRating : existing.userRating,
    };
    const next = [...records];
    next[existingIdx] = updated;
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

  return [created, ...records];
}

/**
 * Tải danh sách hành trình đã lưu từ AsyncStorage.
 * Nếu chưa có dữ liệu, tự động khởi tạo 3 hành trình mẫu TP.HCM.
 */
export async function loadJourneys(): Promise<VisitedSiteRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(JOURNEY_STORAGE_KEY);
    if (raw === null) {
      const seeded = cloneSeedJourneys();
      await saveJourneys(seeded);
      return seeded;
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VisitedSiteRecord[]) : cloneSeedJourneys();
  } catch {
    return cloneSeedJourneys();
  }
}

/** Lưu toàn bộ danh sách hành trình vào AsyncStorage */
export async function saveJourneys(records: VisitedSiteRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Bỏ qua lỗi giới hạn dung lượng lưu trữ cục bộ
  }
}

/** Thêm mới hoặc cập nhật bản ghi hành trình theo `siteId` và lưu bền vững */
export async function addJourneyRecord(
  input: JourneyRecordInput,
  currentRecords?: VisitedSiteRecord[]
): Promise<VisitedSiteRecord[]> {
  const baseRecords = currentRecords ?? (await loadJourneys());
  const next = mergeJourneyRecord(baseRecords, input);
  await saveJourneys(next);
  return next;
}

/** Alias bất đồng bộ tương thích chữ ký phiên bản web */
export async function upsertSiteVisitRecord(
  records: VisitedSiteRecord[],
  input: JourneyRecordInput
): Promise<VisitedSiteRecord[]> {
  return addJourneyRecord(input, records);
}

/** Đính kèm ảnh chụp kỷ niệm mới vào hành trình của một di tích */
export async function addPhotoToJourney(
  siteId: string,
  photo: CapturedPhoto,
  fallbackMeta?: AddPhotoFallbackMeta
): Promise<VisitedSiteRecord[]> {
  const current = await loadJourneys();
  const existing = current.find((r) => r.siteId === siteId);

  if (existing) {
    return addJourneyRecord(
      {
        siteId: existing.siteId,
        siteName: existing.siteName,
        city: existing.city,
        coverImage: existing.coverImage,
        walkingDurationSeconds:
          fallbackMeta?.walkingDurationSeconds ??
          photo.walkingDurationSecondsAtCapture ??
          existing.walkingDurationSeconds,
        walkingDistanceMeters:
          fallbackMeta?.walkingDistanceMeters ?? existing.walkingDistanceMeters,
        routeCoordinates: fallbackMeta?.routeCoordinates ?? existing.routeCoordinates,
        photo,
        userNote: fallbackMeta?.userNote,
        userRating: fallbackMeta?.userRating,
      },
      current
    );
  }

  return addJourneyRecord(
    {
      siteId,
      siteName: fallbackMeta?.siteName || photo.siteName,
      city: fallbackMeta?.city || 'TP. Hồ Chí Minh',
      coverImage: fallbackMeta?.coverImage || photo.dataUrl,
      walkingDurationSeconds:
        fallbackMeta?.walkingDurationSeconds ??
        photo.walkingDurationSecondsAtCapture ??
        300,
      walkingDistanceMeters: fallbackMeta?.walkingDistanceMeters ?? 400,
      routeCoordinates: fallbackMeta?.routeCoordinates ?? [[photo.lat, photo.lng]],
      photo,
      userNote: fallbackMeta?.userNote,
      userRating: fallbackMeta?.userRating,
    },
    current
  );
}

/**
 * Xóa toàn bộ nhật ký hành trình.
 * - `restoreSeedData = false` (mặc định): lưu danh sách rỗng `[]`.
 * - `restoreSeedData = true`: khôi phục lại 3 hành trình mẫu TP.HCM ban đầu.
 */
export async function clearAllJourneys(
  restoreSeedData = false
): Promise<VisitedSiteRecord[]> {
  const next = restoreSeedData ? cloneSeedJourneys() : [];
  await saveJourneys(next);
  return next;
}

// ---------------------------------------------------------------------------
// Cloud Sync Helpers (Optional — Offline-first, only active when authenticated)
// ---------------------------------------------------------------------------

export interface CloudVerificationResult {
  status: 'verified' | 'simulated' | 'flagged';
  score: number;
  geofence_distance_meters: number;
  average_speed_mps: number;
  max_segment_jump_meters: number;
  flags: string[];
  details: Record<string, unknown>;
}

export interface CloudJourneyPhotoOut {
  id: string;
  journey_id: string;
  site_id: string;
  storage_path: string;
  public_url: string;
  caption: string;
  lat: number;
  lng: number;
  walking_duration_seconds_at_capture: number;
  vision_detected_site_id?: string | null;
  vision_confidence?: number | null;
  taken_at: string;
}

export interface CloudJourneyOut {
  id: string;
  user_id: string;
  site_id: string;
  site_name: string;
  city: string;
  cover_image: string;
  visited_at: string;
  walking_duration_seconds: number;
  walking_distance_meters: number;
  route_coordinates: [number, number][];
  user_note: string;
  user_rating: number;
  verification_status: 'verified' | 'simulated' | 'flagged';
  verification_score: number;
  verification_details: Record<string, unknown>;
  photos: CloudJourneyPhotoOut[];
}

export interface CloudJourneyCheckInResponse {
  journey: CloudJourneyOut;
  verification: CloudVerificationResult;
  newly_unlocked_badges: BadgeOut[];
  profile_stats: Record<string, number>;
}

export interface CloudJourneyBulkSyncResponse {
  synced_count: number;
  journeys: CloudJourneyOut[];
  newly_unlocked_badges: BadgeOut[];
}

export interface CloudCheckInInput {
  siteId: string;
  checkinLat: number;
  checkinLng: number;
  walkingDurationSeconds: number;
  walkingDistanceMeters: number;
  routeCoordinates: [number, number][];
  userNote?: string;
  userRating?: number;
  isSimulated?: boolean;
  visionVerifiedSiteId?: string | null;
  visionConfidence?: number | null;
  visitedAt?: string;
}

/** Cập nhật trạng thái xác thực & ID hành trình cloud vào bản ghi cục bộ trong AsyncStorage */
export async function applyVerificationMetaToLocalRecord(
  records: VisitedSiteRecord[],
  siteId: string,
  meta: {
    cloudJourneyId?: string;
    verificationStatus?: 'verified' | 'simulated' | 'flagged';
    verificationScore?: number;
  }
): Promise<VisitedSiteRecord[]> {
  const next = records.map((rec) =>
    rec.siteId === siteId
      ? {
          ...rec,
          cloudJourneyId: meta.cloudJourneyId ?? rec.cloudJourneyId,
          verificationStatus: meta.verificationStatus ?? rec.verificationStatus,
          verificationScore: meta.verificationScore ?? rec.verificationScore,
        }
      : rec
  );
  await saveJourneys(next);
  return next;
}

/** Đồng bộ 1 lần check-in lên Backend (chạy Anti-Fake Verifier + tự xét mở khóa Badges) */
export async function syncCheckInToCloud(
  input: CloudCheckInInput
): Promise<ApiResult<CloudJourneyCheckInResponse>> {
  const token = await getAuthToken();
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'Chế độ Khách — dữ liệu đã được lưu cục bộ trên thiết bị.',
      isOffline: false,
    };
  }

  return apiRequest<CloudJourneyCheckInResponse>('/api/v1/journeys/check-in', {
    method: 'POST',
    body: {
      site_id: input.siteId,
      checkin_lat: input.checkinLat,
      checkin_lng: input.checkinLng,
      walking_duration_seconds: Math.max(
        0,
        Math.round(input.walkingDurationSeconds)
      ),
      walking_distance_meters: Math.max(
        0,
        Math.round(input.walkingDistanceMeters)
      ),
      route_coordinates: input.routeCoordinates || [],
      user_note: input.userNote || '',
      user_rating: Math.min(5, Math.max(1, Math.round(input.userRating ?? 5))),
      is_simulated: Boolean(input.isSimulated),
      vision_verified_site_id: input.visionVerifiedSiteId ?? null,
      vision_confidence: input.visionConfidence ?? null,
      visited_at: input.visitedAt || new Date().toISOString(),
    },
    timeoutMs: 12000,
  });
}

function parseDataUrl(
  dataUrl: string
): { base64: string; mimeType: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!match) return null;
  return { mimeType: match[1] || 'image/jpeg', base64: match[2] };
}

/** Upload ảnh check-in lên Backend Storage (`POST /api/v1/journeys/{id}/photos`) */
export async function uploadPhotoToCloud(
  journeyId: string,
  photo: CapturedPhoto,
  options?: {
    imageBase64?: string | null;
    mimeType?: string;
    visionDetectedSiteId?: string | null;
    visionConfidence?: number | null;
  }
): Promise<ApiResult<CloudJourneyPhotoOut>> {
  const token = await getAuthToken();
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'Cần đăng nhập để đồng bộ ảnh lên Cloud.',
      isOffline: false,
    };
  }

  let imageBase64 = options?.imageBase64 || '';
  let mimeType = options?.mimeType || 'image/jpeg';

  if (!imageBase64 && photo.dataUrl.startsWith('data:')) {
    const parsed = parseDataUrl(photo.dataUrl);
    if (parsed) {
      imageBase64 = parsed.base64;
      mimeType = parsed.mimeType;
    }
  }

  if (!imageBase64 || imageBase64.length < 16) {
    return {
      ok: false,
      status: 400,
      error: 'Ảnh dạng đường dẫn mẫu nên chỉ lưu cục bộ.',
      isOffline: false,
    };
  }

  return apiRequest<CloudJourneyPhotoOut>(
    `/api/v1/journeys/${encodeURIComponent(journeyId)}/photos`,
    {
      method: 'POST',
      body: {
        image_base64: imageBase64,
        mime_type: mimeType,
        caption: photo.caption || '',
        lat: photo.lat,
        lng: photo.lng,
        walking_duration_seconds_at_capture: Math.max(
          0,
          Math.round(photo.walkingDurationSecondsAtCapture ?? 0)
        ),
        vision_detected_site_id: options?.visionDetectedSiteId ?? null,
        vision_confidence: options?.visionConfidence ?? null,
      },
      timeoutMs: 20000,
    }
  );
}

/** Đồng bộ hàng loạt hành trình offline lên Cloud khi người dùng vừa đăng nhập */
export async function syncAllOfflineJourneys(
  records: VisitedSiteRecord[]
): Promise<ApiResult<CloudJourneyBulkSyncResponse>> {
  const token = await getAuthToken();
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'Vui lòng đăng nhập trước khi đồng bộ lên Cloud.',
      isOffline: false,
    };
  }

  if (!records.length) {
    return {
      ok: true,
      status: 200,
      data: { synced_count: 0, journeys: [], newly_unlocked_badges: [] },
      isOffline: false,
    };
  }

  const payloadJourneys = records.slice(0, 50).map((rec) => {
    const lastCoord =
      rec.routeCoordinates[rec.routeCoordinates.length - 1] ||
      (rec.photos[0]
        ? ([rec.photos[0].lat, rec.photos[0].lng] as [number, number])
        : ([10.7775, 106.699] as [number, number]));

    return {
      site_id: rec.siteId,
      checkin_lat: lastCoord[0],
      checkin_lng: lastCoord[1],
      walking_duration_seconds: Math.max(0, Math.round(rec.walkingDurationSeconds)),
      walking_distance_meters: Math.max(0, Math.round(rec.walkingDistanceMeters)),
      route_coordinates: rec.routeCoordinates || [],
      user_note: rec.userNote || '',
      user_rating: Math.min(5, Math.max(1, Math.round(rec.userRating || 5))),
      is_simulated: rec.verificationStatus === 'simulated',
      visited_at: rec.visitedAt,
    };
  });

  return apiRequest<CloudJourneyBulkSyncResponse>('/api/v1/journeys/sync', {
    method: 'POST',
    body: { journeys: payloadJourneys },
    timeoutMs: 18000,
  });
}

/** Lấy danh sách hành trình đã lưu trên Cloud của tài khoản hiện tại */
export async function fetchCloudJourneys(): Promise<
  ApiResult<CloudJourneyOut[]>
> {
  const token = await getAuthToken();
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'Chưa đăng nhập.',
      isOffline: false,
    };
  }
  return apiRequest<CloudJourneyOut[]>('/api/v1/journeys/me', {
    method: 'GET',
    timeoutMs: 10000,
  });
}
