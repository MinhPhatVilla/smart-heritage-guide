import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Check,
  Clock,
  Footprints,
  Image as ImageIcon,
  MapPin,
  Minus,
  Plus,
  RefreshCw,
  ScanEye,
  Sparkles,
  Stamp,
  Star,
  Volume2,
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
import { formatDistance, formatWalkingDuration } from '../utils/geoUtils';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

// 1x1 JPEG placeholder base64 (used only when scanning a remote CORS-restricted cover image so GPS fallback works cleanly)
const FALLBACK_PLACEHOLDER_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';

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

const DURATION_PRESETS = [5, 10, 15, 20, 30, 45];

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
  const siteNameVi = site.translations.vi.name;

  const [previewUri, setPreviewUri] = useState<string>(site.coverImage);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [capturedMimeType, setCapturedMimeType] = useState<string>('image/jpeg');
  const [isScanningAi, setIsScanningAi] = useState<boolean>(false);
  const [visionResult, setVisionResult] =
    useState<VisionIdentifyResponse | null>(null);
  const [visionError, setVisionError] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>(`Check-in tại ${siteNameVi}`);
  const [userNote, setUserNote] = useState<string>(
    `Đi bộ khám phá và lưu ảnh tại ${siteNameVi}.`
  );
  const [customMinutes, setCustomMinutes] = useState<number>(
    Math.max(2, Math.round(walkingDurationSeconds / 60))
  );
  const [userRating, setUserRating] = useState<number>(5);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [capturedTimestamp, setCapturedTimestamp] = useState<string>(() =>
    new Date().toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  );

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const stampLat = userLocation ? userLocation[0] : site.lat;
  const stampLng = userLocation ? userLocation[1] : site.lng;

  useEffect(() => {
    setPreviewUri(site.coverImage);
    setCapturedBase64(null);
    setCapturedMimeType('image/jpeg');
    setVisionResult(null);
    setVisionError(null);
    setCaption(`Check-in tại ${site.translations.vi.name}`);
    setUserNote(`Đi bộ khám phá và lưu ảnh tại ${site.translations.vi.name}.`);
    setCustomMinutes(Math.max(2, Math.round(walkingDurationSeconds / 60)));
    setUserRating(5);
    setCameraActive(false);
    setCameraError(null);
    setCapturedTimestamp(
      new Date().toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }, [site.id, walkingDurationSeconds]);

  const refreshTimestamp = () => {
    setCapturedTimestamp(
      new Date().toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  const handleOpenCamera = async () => {
    setCameraError(null);

    if (Platform.OS === 'web') {
      setCameraError(
        'Trình duyệt web không hỗ trợ Camera native trực tiếp — đang mở trình chọn ảnh từ thiết bị.'
      );
      await handlePickFromGallery();
      return;
    }

    try {
      if (!cameraPermission?.granted) {
        const result = await requestCameraPermission();
        if (!result.granted) {
          setCameraError(
            'Chưa được cấp quyền Camera. Bạn có thể cấp quyền trong Cài đặt hoặc chọn ảnh từ thư viện.'
          );
          return;
        }
      }
      setCameraActive(true);
    } catch {
      setCameraError(
        'Không thể khởi động Camera trên thiết bị này. Vui lòng chọn ảnh từ thư viện.'
      );
    }
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    setCameraError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.65,
        base64: true,
      });
      if (photo?.uri) {
        setPreviewUri(photo.uri);
        setCapturedBase64(photo.base64 ?? null);
        setCapturedMimeType('image/jpeg');
        setVisionResult(null);
        setVisionError(null);
        refreshTimestamp();
        setShowWatermark(true);
        setCameraActive(false);
      }
    } catch {
      setCameraError(
        'Chụp ảnh thất bại. Vui lòng thử lại hoặc chọn ảnh từ thư viện.'
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickFromGallery = async () => {
    setCameraError(null);
    setCameraActive(false);
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setCameraError(
            'Chưa được cấp quyền truy cập Thư viện ảnh. Vui lòng cấp quyền để chọn ảnh kỷ niệm.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
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
          setPreviewUri(`data:${mime};base64,${asset.base64}`);
        } else if (asset.uri) {
          setPreviewUri(asset.uri);
        }
        refreshTimestamp();
        setShowWatermark(true);
      }
    } catch {
      setCameraError(
        'Không thể mở thư viện ảnh. Bạn vẫn có thể lưu với ảnh di tích.'
      );
    }
  };

  const handleScanVisionAi = async () => {
    if (isScanningAi) return;
    setIsScanningAi(true);
    setVisionError(null);
    try {
      let base64Payload = capturedBase64 || '';
      let mimeType = capturedMimeType || 'image/jpeg';

      if (!base64Payload && previewUri.startsWith('data:')) {
        const match = /^data:([^;]+);base64,(.+)$/s.exec(previewUri);
        if (match) {
          mimeType = match[1] || 'image/jpeg';
          base64Payload = match[2];
        }
      }

      if (!base64Payload) {
        base64Payload = FALLBACK_PLACEHOLDER_BASE64;
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

  const adjustMinutes = (delta: number) => {
    setCustomMinutes((prev) => Math.max(1, Math.min(180, prev + delta)));
  };

  const estimatedDistance = Math.max(
    walkingDistanceMeters,
    Math.round(customMinutes * 60 * 1.25)
  );

  const handleConfirmSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const finalSeconds = Math.max(60, customMinutes * 60);
      const finalDistance = Math.max(
        100,
        Math.round(
          walkingDistanceMeters > 0 &&
            Math.abs(finalSeconds - walkingDurationSeconds) < 90
            ? walkingDistanceMeters
            : finalSeconds * 1.25
        )
      );

      const photo: CapturedPhoto = {
        id: `photo-${Date.now()}`,
        siteId: site.id,
        siteName: siteNameVi,
        dataUrl: previewUri,
        takenAt: new Date().toISOString(),
        caption: caption.trim() || `Check-in tại ${siteNameVi}`,
        lat: stampLat,
        lng: stampLng,
        walkingDurationSecondsAtCapture: finalSeconds,
      };

      await onSaveCheckIn({
        photo,
        userNote:
          userNote.trim() || `Đi bộ khám phá và lưu ảnh tại ${siteNameVi}.`,
        userRating,
        walkingDurationSeconds: finalSeconds,
        walkingDistanceMeters: finalDistance,
        imageBase64: capturedBase64,
        mimeType: capturedMimeType,
        visionDetectedSiteId: visionResult?.matched_site_id ?? null,
        visionConfidence: visionResult?.confidence ?? null,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const renderWatermarkOverlay = () => (
    <View style={styles.watermarkContainer} pointerEvents="none">
      <View style={styles.watermarkTopRow}>
        <View style={styles.watermarkStampBadge}>
          <Stamp size={11} color={COLORS.amberStar} />
          <Text style={styles.watermarkStampText}>SMART HERITAGE GUIDE</Text>
        </View>
        <View style={styles.watermarkDurationPill}>
          <Footprints size={11} color={COLORS.white} />
          <Text style={styles.watermarkDurationText}>
            {formatWalkingDuration(customMinutes * 60)}
          </Text>
        </View>
      </View>

      <View style={styles.watermarkBottom}>
        <Text style={styles.watermarkSiteName} numberOfLines={1}>
          {siteNameVi}
        </Text>
        <View style={styles.watermarkMetaRow}>
          <View style={styles.watermarkMetaItem}>
            <MapPin size={11} color="#E6E4DD" />
            <Text style={styles.watermarkMetaText}>
              {stampLat.toFixed(4)}°N, {stampLng.toFixed(4)}°E
            </Text>
          </View>
          <View style={styles.watermarkMetaItem}>
            <Clock size={11} color="#E6E4DD" />
            <Text style={styles.watermarkMetaText}>{capturedTimestamp}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerEyebrow}>
                LƯU ẢNH & GHI NHẬN HÀNH TRÌNH
              </Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {siteNameVi}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Đóng"
              activeOpacity={0.7}
            >
              <X size={20} color={COLORS.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Camera / Preview Box */}
            <View style={styles.previewFrame}>
              {cameraActive && Platform.OS !== 'web' ? (
                <View style={styles.cameraWrap}>
                  <CameraView
                    ref={cameraRef}
                    style={styles.cameraView}
                    facing={cameraFacing}
                  />
                  {showWatermark && renderWatermarkOverlay()}

                  {/* Camera Controls */}
                  <View style={styles.cameraControls}>
                    <TouchableOpacity
                      onPress={() => setCameraActive(false)}
                      style={styles.cameraSecondaryBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cameraSecondaryText}>Hủy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleTakePicture}
                      disabled={isCapturing}
                      style={styles.shutterOuter}
                      accessibilityLabel="Chụp ảnh"
                      activeOpacity={0.8}
                    >
                      <View style={styles.shutterInner}>
                        {isCapturing ? (
                          <ActivityIndicator size="small" color={COLORS.ink} />
                        ) : (
                          <Camera size={22} color={COLORS.ink} />
                        )}
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        setCameraFacing((prev) =>
                          prev === 'back' ? 'front' : 'back'
                        )
                      }
                      style={styles.cameraSecondaryBtn}
                      accessibilityLabel="Đổi camera"
                      activeOpacity={0.8}
                    >
                      <RefreshCw size={16} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePreviewWrap}>
                  <Image
                    source={{ uri: previewUri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  {showWatermark && renderWatermarkOverlay()}
                </View>
              )}
            </View>

            {cameraError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{cameraError}</Text>
              </View>
            )}

            {/* Capture & Vision AI Action Row */}
            <View style={styles.captureActionsRow}>
              <TouchableOpacity
                onPress={handleOpenCamera}
                style={[
                  styles.actionChip,
                  cameraActive && styles.actionChipActive,
                ]}
                activeOpacity={0.75}
              >
                <Camera
                  size={15}
                  color={cameraActive ? COLORS.white : COLORS.ink}
                />
                <Text
                  style={[
                    styles.actionChipText,
                    cameraActive && styles.actionChipTextActive,
                  ]}
                >
                  Mở Camera
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickFromGallery}
                style={styles.actionChip}
                activeOpacity={0.75}
              >
                <ImageIcon size={15} color={COLORS.ink} />
                <Text style={styles.actionChipText}>Thư viện ảnh</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowWatermark((v) => !v)}
                style={[
                  styles.actionChip,
                  showWatermark && styles.actionChipAccent,
                ]}
                activeOpacity={0.75}
              >
                <Stamp
                  size={15}
                  color={showWatermark ? COLORS.accent : COLORS.inkSecondary}
                />
                <Text
                  style={[
                    styles.actionChipText,
                    showWatermark && { color: COLORS.accent },
                  ]}
                >
                  {showWatermark ? 'Dấu di sản: Bật' : 'Dấu di sản: Tắt'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleScanVisionAi}
                disabled={isScanningAi}
                style={[styles.actionChip, styles.actionChipVision]}
                activeOpacity={0.8}
              >
                {isScanningAi ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <ScanEye size={15} color={COLORS.white} />
                )}
                <Text style={styles.actionChipVisionText}>
                  {isScanningAi ? 'Đang quét AI...' : 'Quét AI nhận diện'}
                </Text>
              </TouchableOpacity>
            </View>

            {visionError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{visionError}</Text>
              </View>
            )}

            {visionResult && (
              <View style={styles.visionCard}>
                <View style={styles.visionHeaderRow}>
                  <View style={styles.visionTitleRow}>
                    <Sparkles size={14} color={COLORS.accent} />
                    <Text style={styles.visionEyebrow}>
                      {visionResult.mode === 'gemini_vision'
                        ? 'GEMINI VISION AI'
                        : 'AI NHẬN DIỆN (GPS FALLBACK)'}
                    </Text>
                  </View>
                  <View style={styles.confidencePill}>
                    <Text style={styles.confidenceText}>
                      Độ tin cậy {Math.round(visionResult.confidence * 100)}%
                    </Text>
                  </View>
                </View>

                <Text style={styles.visionSiteName}>
                  {visionResult.matched_site_name ||
                    'Chưa xác định được di tích khớp trong ảnh'}
                </Text>

                {visionResult.message ? (
                  <Text style={styles.visionMessage}>
                    {visionResult.message}
                  </Text>
                ) : null}

                {visionResult.architectural_cues.length > 0 && (
                  <View style={styles.cuesWrap}>
                    {visionResult.architectural_cues.map((cue, idx) => (
                      <View key={idx} style={styles.cueChip}>
                        <Text style={styles.cueText}>{cue}</Text>
                      </View>
                    ))}
                  </View>
                )}

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
                    <Volume2 size={15} color={COLORS.white} />
                    <Text style={styles.openAudioNowText}>
                      Mở thuyết minh ngay
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Walking Duration Adjuster Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>
                  Thời gian đi bộ tới điểm di tích
                </Text>
                <Text style={styles.durationHighlight}>
                  {customMinutes} phút · ~{formatDistance(estimatedDistance)}
                </Text>
              </View>

              <View style={styles.stepperRow}>
                <TouchableOpacity
                  onPress={() => adjustMinutes(-5)}
                  style={styles.stepperBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnLabel}>-5p</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => adjustMinutes(-1)}
                  style={styles.stepperIconBtn}
                  activeOpacity={0.7}
                >
                  <Minus size={16} color={COLORS.ink} />
                </TouchableOpacity>

                <View style={styles.stepperValueBox}>
                  <Footprints size={15} color={COLORS.accent} />
                  <Text style={styles.stepperValueText}>
                    {customMinutes} phút
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => adjustMinutes(1)}
                  style={styles.stepperIconBtn}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color={COLORS.ink} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => adjustMinutes(5)}
                  style={styles.stepperBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnLabel}>+5p</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetChipsRow}
              >
                {DURATION_PRESETS.map((mins) => {
                  const active = customMinutes === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      onPress={() => setCustomMinutes(mins)}
                      style={[
                        styles.presetChip,
                        active && styles.presetChipActive,
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          active && styles.presetChipTextActive,
                        ]}
                      >
                        {mins} phút
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.helperHint}>
                Dữ liệu thời gian đi bộ được dùng để xếp hạng hành trình của bạn.
              </Text>
            </View>

            {/* Rating Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Đánh giá trải nghiệm</Text>
                <Text style={styles.ratingValue}>{userRating}.0 / 5.0 ★</Text>
              </View>
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
                        size={26}
                        color={filled ? COLORS.amberStar : COLORS.borderStrong}
                        fill={filled ? COLORS.amberStar : 'transparent'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Caption & Note Inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chú thích ảnh kỷ niệm</Text>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Nhập chú thích ảnh..."
                placeholderTextColor={COLORS.inkMuted}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ghi chú cảm nhận hành trình</Text>
              <TextInput
                value={userNote}
                onChangeText={setUserNote}
                placeholder="Ghi lại cảm nhận, góc chụp đẹp hoặc quán ăn ấn tượng..."
                placeholderTextColor={COLORS.inkMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={[styles.textInput, styles.textArea]}
              />
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelBtn}
              activeOpacity={0.7}
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
                <Check size={16} color={COLORS.white} />
              )}
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Đang lưu...' : 'Lưu ảnh & Xếp hạng'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.inkMuted,
  },
  headerTitle: {
    marginTop: 2,
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  previewFrame: {
    borderRadius: RADII.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.ink,
    ...SHADOWS.card,
  },
  cameraWrap: {
    height: 290,
    position: 'relative',
    backgroundColor: COLORS.ink,
  },
  cameraView: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 72,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.xl,
  },
  cameraSecondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(20, 20, 19, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraSecondaryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  shutterOuter: {
    width: 62,
    height: 62,
    borderRadius: RADII.pill,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  shutterInner: {
    width: 50,
    height: 50,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewWrap: {
    height: 230,
    position: 'relative',
    backgroundColor: COLORS.surfaceMuted,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  watermarkTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  watermarkStampBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20, 20, 19, 0.76)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  watermarkStampText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  watermarkDurationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  watermarkDurationText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  watermarkBottom: {
    backgroundColor: 'rgba(20, 20, 19, 0.78)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  watermarkSiteName: {
    color: COLORS.white,
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontWeight: '700',
  },
  watermarkMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: 4,
  },
  watermarkMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  watermarkMetaText: {
    color: '#E6E4DD',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  errorBanner: {
    backgroundColor: COLORS.amberBg,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    borderRadius: RADII.md,
    padding: SPACING.md,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.ink,
  },
  captureActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  actionChipActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  actionChipAccent: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentBorder,
  },
  actionChipVision: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  actionChipTextActive: {
    color: COLORS.white,
  },
  actionChipVisionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  visionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  visionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  visionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  visionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: COLORS.accent,
  },
  confidencePill: {
    backgroundColor: COLORS.visitedBg,
    borderWidth: 1,
    borderColor: COLORS.visitedBorder,
    borderRadius: RADII.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  confidenceText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.visited,
  },
  visionSiteName: {
    fontFamily: SERIF_FONT,
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  visionMessage: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.inkSecondary,
  },
  cuesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cueChip: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cueText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.ink,
  },
  openAudioNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.ink,
    paddingVertical: 10,
    borderRadius: RADII.md,
    marginTop: 2,
  },
  openAudioNowText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  durationHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
    fontVariant: ['tabular-nums'],
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: 2,
  },
  stepperBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  stepperBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  stepperIconBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  stepperValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  presetChipsRow: {
    gap: SPACING.xs + 2,
    paddingTop: 2,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  presetChipActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  presetChipTextActive: {
    color: COLORS.white,
  },
  helperHint: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.amber,
    fontVariant: ['tabular-nums'],
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  starBtn: {
    padding: 6,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.ink,
  },
  textArea: {
    minHeight: 78,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    ...SHADOWS.bar,
  },
  cancelBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADII.md,
    backgroundColor: COLORS.ink,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
});
