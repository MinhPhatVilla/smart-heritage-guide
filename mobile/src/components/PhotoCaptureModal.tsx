import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Check,
  Headphones,
  ImagePlus,
  MapPin,
  ScanEye,
  Star,
  X,
} from 'lucide-react-native';
import {
  CapturedPhoto,
  HeritageSite,
  SupportedLanguage,
} from '../types/heritage';
import {
  VisionIdentifyResponse,
  identifyHeritageFromImage,
} from '../services/aiService';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export interface PhotoCaptureModalProps {
  visible?: boolean;
  site: HeritageSite;
  walkingDurationSeconds: number;
  walkingDistanceMeters: number;
  userLocation?: [number, number];
  selectedLanguage?: SupportedLanguage;
  onClose: () => void;
  onOpenRecognizedSite?: (siteId: string) => void;
  onSaveCheckIn: (data: {
    photo: CapturedPhoto;
    userNote: string;
    userRating: number;
    walkingDurationSeconds: number;
    walkingDistanceMeters: number;
    imageBase64?: string | null;
    mimeType?: string;
    visionDetectedSiteId?: string | null;
    visionConfidence?: number | null;
  }) => void | Promise<void>;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Không hài lòng',
  2: 'Chưa hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Tuyệt vời',
};

export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  visible = true,
  site,
  walkingDurationSeconds,
  walkingDistanceMeters,
  userLocation,
  selectedLanguage = 'vi',
  onClose,
  onOpenRecognizedSite,
  onSaveCheckIn,
}) => {
  const insets = useSafeAreaInsets();
  const siteName = (
    site.translations?.[selectedLanguage] || site.translations.vi
  ).name;
  const siteNameVi = site.translations.vi.name;

  // Ảnh do người dùng chụp / chọn (mặc định trống — không nhét ảnh bìa giả làm ảnh chụp)
  const [attachedPhotoUri, setAttachedPhotoUri] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [capturedMimeType, setCapturedMimeType] = useState<string>('image/jpeg');

  // 1 ô đánh giá / nhận xét chung duy nhất — mặc định rỗng hoàn toàn, không điền sẵn câu mẫu
  const [reviewComment, setReviewComment] = useState<string>('');
  const [userRating, setUserRating] = useState<number>(5);

  const [isScanningAi, setIsScanningAi] = useState<boolean>(false);
  const [visionResult, setVisionResult] =
    useState<VisionIdentifyResponse | null>(null);
  const [visionError, setVisionError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const stampLat = userLocation ? userLocation[0] : site.lat;
  const stampLng = userLocation ? userLocation[1] : site.lng;

  useEffect(() => {
    setAttachedPhotoUri(null);
    setCapturedBase64(null);
    setCapturedMimeType('image/jpeg');
    setReviewComment('');
    setUserRating(5);
    setVisionResult(null);
    setVisionError(null);
    setMediaError(null);
  }, [site.id, visible]);

  // Mở thẳng Camera gốc của điện thoại (giống Shopee / Google Reviews)
  const handleOpenDeviceCamera = async () => {
    setMediaError(null);
    try {
      if (Platform.OS === 'web') {
        // Trên trình duyệt: mở hộp thoại chụp/chọn ảnh trực tiếp của thiết bị
        const doc = (
          globalThis as unknown as {
            document?: {
              createElement: (tag: string) => {
                type: string;
                accept: string;
                capture: string;
                onchange: (() => void) | null;
                files?: ArrayLike<Blob & { type?: string }>;
                click: () => void;
              };
            };
          }
        ).document;
        if (doc) {
          const input = doc.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'environment';
          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = String(reader.result || '');
              const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
              setAttachedPhotoUri(dataUrl);
              setCapturedMimeType(match?.[1] || file.type || 'image/jpeg');
              setCapturedBase64(match?.[2] || null);
              setVisionResult(null);
              setVisionError(null);
            };
            reader.readAsDataURL(file);
          };
          input.click();
          return;
        }
        await handlePickFromGallery();
        return;
      }

      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setMediaError(
          'Chưa được cấp quyền Camera. Bạn có thể bật trong Cài đặt hoặc chọn ảnh từ thư viện.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.72,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachedPhotoUri(asset.uri);
        setCapturedBase64(asset.base64 ?? null);
        setCapturedMimeType(asset.mimeType || 'image/jpeg');
        setVisionResult(null);
        setVisionError(null);
      }
    } catch {
      setMediaError(
        'Không thể mở máy ảnh trên thiết bị này. Vui lòng thử chọn ảnh từ thư viện.'
      );
    }
  };

  // Mở Thư viện ảnh gốc của thiết bị
  const handlePickFromGallery = async () => {
    setMediaError(null);
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setMediaError(
            'Chưa được cấp quyền Thư viện ảnh. Vui lòng bật trong Cài đặt.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.72,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mime = asset.mimeType || 'image/jpeg';
        setCapturedMimeType(mime);
        setCapturedBase64(asset.base64 ?? null);
        setVisionResult(null);
        setVisionError(null);
        if (Platform.OS === 'web' && asset.base64) {
          setAttachedPhotoUri(`data:${mime};base64,${asset.base64}`);
        } else if (asset.uri) {
          setAttachedPhotoUri(asset.uri);
        }
      }
    } catch {
      setMediaError('Không thể mở thư viện ảnh. Vui lòng thử lại.');
    }
  };

  const handleRemoveAttachedPhoto = () => {
    setAttachedPhotoUri(null);
    setCapturedBase64(null);
    setVisionResult(null);
    setVisionError(null);
  };

  const handleScanVisionAi = async () => {
    if (isScanningAi || !attachedPhotoUri) return;
    setIsScanningAi(true);
    setVisionError(null);
    try {
      let base64Payload = capturedBase64 || '';
      let mimeType = capturedMimeType || 'image/jpeg';

      if (!base64Payload && attachedPhotoUri.startsWith('data:')) {
        const match = /^data:([^;]+);base64,(.+)$/s.exec(attachedPhotoUri);
        if (match) {
          mimeType = match[1] || 'image/jpeg';
          base64Payload = match[2];
        }
      }

      if (!base64Payload) {
        setVisionError('Không đọc được dữ liệu ảnh để nhận diện.');
        return;
      }

      const res = await identifyHeritageFromImage({
        image_base64: base64Payload,
        mime_type: mimeType,
        lat: stampLat,
        lng: stampLng,
        language: selectedLanguage,
      });

      if (res.ok) {
        setVisionResult(res.data);
      } else {
        setVisionError(res.error);
      }
    } finally {
      setIsScanningAi(false);
    }
  };

  const handleConfirmSave = async () => {
    if (isSaving) return;
    Keyboard.dismiss();
    setIsSaving(true);
    try {
      const cleanComment = reviewComment.trim();
      const safeDurationSeconds = Math.max(60, Math.round(walkingDurationSeconds || 300));
      const safeDistanceMeters = Math.max(100, Math.round(walkingDistanceMeters || 500));

      const photo: CapturedPhoto = {
        id: `photo-${Date.now()}`,
        siteId: site.id,
        siteName: siteNameVi,
        dataUrl: attachedPhotoUri || site.coverImage,
        takenAt: new Date().toISOString(),
        caption: cleanComment || siteNameVi,
        lat: stampLat,
        lng: stampLng,
        walkingDurationSecondsAtCapture: safeDurationSeconds,
      };

      await onSaveCheckIn({
        photo,
        userNote: cleanComment,
        userRating,
        walkingDurationSeconds: safeDurationSeconds,
        walkingDistanceMeters: safeDistanceMeters,
        imageBase64: attachedPhotoUri ? capturedBase64 : null,
        mimeType: capturedMimeType,
        visionDetectedSiteId: visionResult?.matched_site_id ?? null,
        visionConfidence: visionResult?.confidence ?? null,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  const modalContent = (
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: Platform.OS === 'web' ? 0 : Math.max(insets.top, 8),
        },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Clean Header */}
        <View style={styles.header}>
          <View style={styles.headerInner}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Đánh giá &amp; Check-in</Text>
              <View style={styles.headerSiteRow}>
                <MapPin size={12} color={COLORS.accentDeep} strokeWidth={2} />
                <Text style={styles.headerSiteName} numberOfLines={1}>
                  {siteName}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                onClose();
              }}
              style={styles.closeBtn}
              accessibilityLabel="Đóng đánh giá"
              activeOpacity={0.75}
            >
              <X size={19} color={COLORS.ink} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bodyInner}>
            {/* 1. Star Rating Card (Shopee / Google Reviews style) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Trải nghiệm của bạn</Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= userRating;
                  return (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setUserRating(star)}
                      style={styles.starBtn}
                      activeOpacity={0.7}
                      accessibilityLabel={`Đánh giá ${star} sao`}
                    >
                      <Star
                        size={32}
                        color={filled ? COLORS.amberStar : COLORS.borderStrong}
                        fill={filled ? COLORS.amberStar : 'transparent'}
                        strokeWidth={1.8}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.ratingSentiment}>
                {RATING_LABELS[userRating]} ({userRating}/5)
              </Text>
            </View>

            {/* 2. Single Clean Review Textbox (Blank by default, no prefilled text!) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Nhận xét của bạn</Text>
              <TextInput
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Viết đánh giá của bạn…"
                placeholderTextColor={COLORS.inkMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.reviewInput}
              />
            </View>

            {/* 3. Shopee / Google Style Photo Tiles (Native Camera + Gallery + Compact Preview) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Thêm hình ảnh (tùy chọn)</Text>

              <View style={styles.mediaTilesRow}>
                {/* Tile 1: Native Device Camera */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleOpenDeviceCamera}
                  style={styles.mediaPickerTile}
                  accessibilityRole="button"
                  accessibilityLabel="Mở máy ảnh chụp hình"
                >
                  <Camera
                    size={22}
                    color={COLORS.accentDeep}
                    strokeWidth={1.9}
                  />
                  <Text style={styles.mediaPickerTileText}>Chụp ảnh</Text>
                </TouchableOpacity>

                {/* Tile 2: Device Photo Library */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePickFromGallery}
                  style={styles.mediaPickerTile}
                  accessibilityRole="button"
                  accessibilityLabel="Chọn ảnh từ thư viện"
                >
                  <ImagePlus
                    size={22}
                    color={COLORS.accentDeep}
                    strokeWidth={1.9}
                  />
                  <Text style={styles.mediaPickerTileText}>Thư viện</Text>
                </TouchableOpacity>

                {/* Tile 3: Attached Photo Thumbnail with Delete Button */}
                {attachedPhotoUri && (
                  <View style={styles.attachedThumbTile}>
                    <Image
                      source={{ uri: attachedPhotoUri }}
                      style={styles.attachedThumbImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={handleRemoveAttachedPhoto}
                      style={styles.removeThumbBtn}
                      accessibilityLabel="Xóa ảnh đã chọn"
                      activeOpacity={0.8}
                    >
                      <X size={13} color={COLORS.white} strokeWidth={2.4} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {mediaError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{mediaError}</Text>
                </View>
              ) : null}

              {/* Optional Vision AI Identify button when user attaches a real photo */}
              {attachedPhotoUri && (
                <TouchableOpacity
                  onPress={handleScanVisionAi}
                  disabled={isScanningAi}
                  style={styles.visionInlineBtn}
                  activeOpacity={0.82}
                >
                  {isScanningAi ? (
                    <ActivityIndicator size="small" color={COLORS.accentDeep} />
                  ) : (
                    <ScanEye
                      size={15}
                      color={COLORS.accentDeep}
                      strokeWidth={2}
                    />
                  )}
                  <Text style={styles.visionInlineBtnText}>
                    {isScanningAi
                      ? 'Đang nhận diện di tích…'
                      : 'Nhận diện di tích từ ảnh này'}
                  </Text>
                </TouchableOpacity>
              )}

              {visionError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{visionError}</Text>
                </View>
              ) : null}

              {visionResult && (
                <View style={styles.visionCard}>
                  <View style={styles.visionTopRow}>
                    <Text style={styles.visionSiteName} numberOfLines={2}>
                      {visionResult.matched_site_name ||
                        'Chưa xác định được di tích khớp trong ảnh'}
                    </Text>
                    <View style={styles.confidencePill}>
                      <Text style={styles.confidenceText}>
                        {Math.round(visionResult.confidence * 100)}%
                      </Text>
                    </View>
                  </View>

                  {visionResult.message ? (
                    <Text style={styles.visionMessage}>
                      {visionResult.message}
                    </Text>
                  ) : null}

                  {visionResult.matched_site_id && onOpenRecognizedSite && (
                    <TouchableOpacity
                      onPress={() => {
                        const targetId = visionResult.matched_site_id;
                        if (targetId) {
                          onClose();
                          onOpenRecognizedSite(targetId);
                        }
                      }}
                      style={styles.openAudioNowBtn}
                      activeOpacity={0.85}
                    >
                      <Headphones size={14} color={COLORS.white} strokeWidth={2} />
                      <Text style={styles.openAudioNowText}>
                        Mở thuyết minh ngay
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Clean Sticky Footer */}
        <View
          style={[
            styles.footerOuter,
            {
              paddingBottom:
                Platform.OS === 'web' ? 14 : Math.max(insets.bottom, 12),
            },
          ]}
        >
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                onClose();
              }}
              style={styles.cancelBtn}
              activeOpacity={0.75}
              disabled={isSaving}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirmSave}
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              activeOpacity={0.85}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Check size={16} color={COLORS.white} strokeWidth={2.4} />
              )}
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Đang lưu…' : 'Gửi đánh giá & Check-in'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  if (Platform.OS === 'web') {
    return <View style={styles.webFixedPortal}>{modalContent}</View>;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {modalContent}
    </Modal>
  );
};

const styles = StyleSheet.create({
  webFixedPortal: {
    position: 'fixed' as unknown as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: COLORS.bg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  headerInner: {
    width: '100%',
    maxWidth: 640,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headerTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  headerSiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerSiteName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.accentDeep,
    flexShrink: 1,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },
  bodyInner: {
    width: '100%',
    maxWidth: 640,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
    ...SHADOWS.card,
  },
  sectionLabel: {
    fontFamily: SERIF_FONT,
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  starBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingSentiment: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentDeep,
    textAlign: 'center',
  },
  reviewInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 112,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink,
  },
  mediaTilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  mediaPickerTile: {
    width: 96,
    height: 96,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.accentBorder,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mediaPickerTileText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  attachedThumbTile: {
    width: 96,
    height: 96,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.surfaceMuted,
  },
  attachedThumbImage: {
    width: '100%',
    height: '100%',
  },
  removeThumbBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(19, 36, 34, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visionInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: 14,
  },
  visionInlineBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  visionCard: {
    backgroundColor: COLORS.bg,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: 12,
    gap: 8,
  },
  visionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  visionSiteName: {
    flex: 1,
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  confidencePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentDeep,
    fontVariant: ['tabular-nums'],
  },
  visionMessage: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.inkSecondary,
  },
  openAudioNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
  },
  openAudioNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  errorBanner: {
    backgroundColor: COLORS.amberBg,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    borderRadius: RADII.md,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.ink,
    lineHeight: 17,
  },
  footerOuter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    alignItems: 'center',
    ...SHADOWS.bar,
  },
  footer: {
    width: '100%',
    maxWidth: 640,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.white,
  },
});
