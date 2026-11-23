import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Search,
  Trash2,
  X,
} from 'lucide-react-native';
import { HeritageSite, NearbyRestaurant } from '../../types/heritage';
import {
  AdminRestaurantFormInput,
  AdminSiteFormInput,
  adminCreateRestaurant,
  adminCreateSite,
  adminDeleteRestaurant,
  adminDeleteSite,
  adminUpdateRestaurant,
  adminUpdateSite,
  buildHeritageSiteFromForm,
  buildRestaurantFromForm,
  slugifyVietnamese,
} from '../../services/adminService';
import {
  AdminMapPickerModal,
  ExistingMapPoint,
  MapPickedLocation,
} from '../AdminMapPickerModal';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../../theme';
import {
  AdminActivityItem,
  CATEGORY_OPTIONS,
  FlattenedRestaurant,
} from './adminTypes';

export type PendingAdminDelete =
  | { kind: 'site'; siteId: string; title: string }
  | { kind: 'restaurant'; siteId: string; restaurantId: string; title: string };

export interface AdminEditorModalsProps {
  siteModalOpen: boolean;
  editingSite: HeritageSite | null;
  restModalOpen: boolean;
  editingRestaurant: FlattenedRestaurant | null;
  presetRestaurantSiteId?: string | null;
  pendingDelete: PendingAdminDelete | null;
  sites: HeritageSite[];
  userLocation: [number, number];
  onCloseSiteModal: () => void;
  onCloseRestModal: () => void;
  onCloseDelete: () => void;
  onUpsertSite: (site: HeritageSite) => void;
  onDeleteSite: (siteId: string) => void;
  onUpsertRestaurant: (siteId: string, restaurant: NearbyRestaurant) => void;
  onDeleteRestaurant: (siteId: string, restaurantId: string) => void;
  onNotify: (message: string) => void;
  onRecordActivity: (
    item: Omit<AdminActivityItem, 'id' | 'timestamp'>
  ) => void;
}

const DEFAULT_SITE_COVER =
  'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_DINING_COVER =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';

export const AdminEditorModals: React.FC<AdminEditorModalsProps> = ({
  siteModalOpen,
  editingSite,
  restModalOpen,
  editingRestaurant,
  presetRestaurantSiteId,
  pendingDelete,
  sites,
  userLocation,
  onCloseSiteModal,
  onCloseRestModal,
  onCloseDelete,
  onUpsertSite,
  onDeleteSite,
  onUpsertRestaurant,
  onDeleteRestaurant,
  onNotify,
  onRecordActivity,
}) => {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [mapPickerTarget, setMapPickerTarget] = useState<
    'site' | 'restaurant' | null
  >(null);
  const [parentSiteQuery, setParentSiteQuery] = useState<string>('');

  const [siteForm, setSiteForm] = useState<AdminSiteFormInput>({
    id: '',
    nameVi: '',
    nameEn: '',
    shortSummaryVi: '',
    architecturalHighlightsText: '',
    audioScriptText: '',
    historicalEra: 'Thế kỷ XIX – XX',
    openingHours: '07:30 – 17:30 Hàng ngày',
    city: 'Quận 1 · TP.HCM',
    district: 'Quận 1',
    address: '',
    lat: Number(userLocation[0].toFixed(5)),
    lng: Number(userLocation[1].toFixed(5)),
    category: 'monument',
    ticketPrice: 'Miễn phí tham quan',
    coverImage: DEFAULT_SITE_COVER,
    rating: 4.7,
    nationalSpecialMonument: false,
    unescoRecognized: false,
  });

  const [restForm, setRestForm] = useState<AdminRestaurantFormInput>({
    siteId: sites[0]?.id || '',
    name: '',
    cuisine: 'Ẩm thực Việt Nam',
    specialtyDishesText: '',
    rating: 4.6,
    priceRange: '45.000đ – 120.000đ',
    lat: Number(userLocation[0].toFixed(5)),
    lng: Number(userLocation[1].toFixed(5)),
    address: '',
    openHours: '07:00 – 21:30',
    imageUrl: DEFAULT_DINING_COVER,
  });

  // Hydrate Site form whenever modal opens
  useEffect(() => {
    if (!siteModalOpen) return;
    if (editingSite) {
      setSiteForm({
        id: editingSite.id,
        nameVi: editingSite.translations.vi.name,
        nameEn: editingSite.translations.en.name,
        shortSummaryVi: editingSite.translations.vi.shortSummary,
        architecturalHighlightsText: (
          editingSite.translations.vi.architecturalHighlights || []
        ).join('\n'),
        audioScriptText: (editingSite.translations.vi.audioScript || []).join(
          '\n'
        ),
        historicalEra: editingSite.translations.vi.historicalEra,
        openingHours: editingSite.translations.vi.openingHours,
        city: editingSite.city,
        district:
          editingSite.district ||
          editingSite.city.split('·')[0]?.trim() ||
          'Quận 1',
        address: editingSite.address || '',
        lat: editingSite.lat,
        lng: editingSite.lng,
        category: editingSite.category,
        ticketPrice: editingSite.ticketPrice,
        coverImage: editingSite.coverImage,
        rating: editingSite.rating,
        nationalSpecialMonument: Boolean(editingSite.nationalSpecialMonument),
        unescoRecognized: Boolean(editingSite.unescoRecognized),
      });
    } else {
      setSiteForm({
        id: '',
        nameVi: '',
        nameEn: '',
        shortSummaryVi: '',
        architecturalHighlightsText: '',
        audioScriptText: '',
        historicalEra: 'Thế kỷ XIX – XX',
        openingHours: '07:30 – 17:30 Hàng ngày',
        city: 'Quận 1 · TP.HCM',
        district: 'Quận 1',
        address: '',
        lat: Number(userLocation[0].toFixed(5)),
        lng: Number(userLocation[1].toFixed(5)),
        category: 'monument',
        ticketPrice: 'Miễn phí tham quan',
        coverImage: DEFAULT_SITE_COVER,
        rating: 4.7,
        nationalSpecialMonument: false,
        unescoRecognized: false,
      });
    }
  }, [editingSite, siteModalOpen, userLocation]);

  // Hydrate Restaurant form whenever modal opens
  useEffect(() => {
    if (!restModalOpen) return;
    setParentSiteQuery('');
    if (editingRestaurant) {
      setRestForm({
        id: editingRestaurant.restaurant.id,
        siteId: editingRestaurant.siteId,
        name: editingRestaurant.restaurant.name,
        cuisine: editingRestaurant.restaurant.cuisine,
        specialtyDishesText:
          editingRestaurant.restaurant.specialtyDishes.join(', '),
        rating: editingRestaurant.restaurant.rating,
        priceRange: editingRestaurant.restaurant.priceRange,
        lat: editingRestaurant.restaurant.lat,
        lng: editingRestaurant.restaurant.lng,
        address: editingRestaurant.restaurant.address,
        openHours: editingRestaurant.restaurant.openHours,
        imageUrl: editingRestaurant.restaurant.imageUrl,
      });
    } else {
      const targetSite =
        (presetRestaurantSiteId
          ? sites.find((s) => s.id === presetRestaurantSiteId)
          : null) || sites[0];
      setRestForm({
        siteId: targetSite?.id || '',
        name: '',
        cuisine: 'Ẩm thực Việt Nam',
        specialtyDishesText: 'Phở bò, Cơm tấm, Cà phê sữa đá',
        rating: 4.6,
        priceRange: '45.000đ – 120.000đ',
        lat: Number((targetSite?.lat ?? userLocation[0]).toFixed(5)),
        lng: Number((targetSite?.lng ?? userLocation[1]).toFixed(5)),
        address: targetSite?.city || 'Quận 1, TP.HCM',
        openHours: '07:00 – 21:30',
        imageUrl: DEFAULT_DINING_COVER,
      });
    }
  }, [
    editingRestaurant,
    presetRestaurantSiteId,
    restModalOpen,
    sites,
    userLocation,
  ]);

  const existingMapPoints = useMemo<ExistingMapPoint[]>(
    () =>
      mapPickerTarget
        ? sites.map((s) => ({
            id: s.id,
            name: s.translations.vi.name,
            lat: s.lat,
            lng: s.lng,
          }))
        : [],
    [mapPickerTarget, sites]
  );

  const filteredParentSites = useMemo(() => {
    const q = parentSiteQuery.trim().toLowerCase();
    if (!q) {
      // Đưa site đang chọn lên đầu để dễ thấy, giới hạn 18 mục để render tức thì
      const selected = sites.find((s) => s.id === restForm.siteId);
      const others = sites.filter((s) => s.id !== restForm.siteId).slice(0, 17);
      return selected ? [selected, ...others] : others;
    }
    return sites
      .filter(
        (s) =>
          s.translations.vi.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [parentSiteQuery, restForm.siteId, sites]);

  const handleConfirmMapPick = (picked: MapPickedLocation) => {
    const lat = Number(picked.lat.toFixed(6));
    const lng = Number(picked.lng.toFixed(6));
    if (mapPickerTarget === 'site') {
      setSiteForm((prev) => ({
        ...prev,
        lat,
        lng,
        address:
          !prev.address.trim() && picked.suggestedPlaceName
            ? `${picked.suggestedPlaceName}, TP. Hồ Chí Minh`
            : prev.address,
      }));
    } else if (mapPickerTarget === 'restaurant') {
      setRestForm((prev) => ({
        ...prev,
        lat,
        lng,
        address:
          !prev.address.trim() && picked.suggestedPlaceName
            ? `${picked.suggestedPlaceName}, TP. Hồ Chí Minh`
            : prev.address,
      }));
    }
    setMapPickerTarget(null);
  };

  const handleSaveSite = async () => {
    if (!siteForm.nameVi.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên di tích tiếng Việt.');
      return;
    }
    const latNum = Number(siteForm.lat);
    const lngNum = Number(siteForm.lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      Alert.alert(
        'Tọa độ không hợp lệ',
        'Vui lòng nhập vĩ độ (lat) và kinh độ (lng) hợp lệ.'
      );
      return;
    }

    const builtSite = buildHeritageSiteFromForm(
      { ...siteForm, lat: latNum, lng: lngNum },
      editingSite
    );

    setIsSaving(true);
    const apiRes = editingSite
      ? await adminUpdateSite(editingSite.id, builtSite)
      : await adminCreateSite(builtSite);
    setIsSaving(false);

    onUpsertSite(builtSite);
    onRecordActivity({
      action: editingSite ? 'update' : 'create',
      entityType: 'site',
      title: `${editingSite ? 'Cập nhật' : 'Thêm mới'} di tích "${builtSite.translations.vi.name}"`,
      syncedCloud: apiRes.ok,
    });
    onCloseSiteModal();

    if (apiRes.ok) {
      onNotify(
        editingSite
          ? `Đã cập nhật "${builtSite.translations.vi.name}" lên Cloud & re-index RAG!`
          : `Đã thêm mới "${builtSite.translations.vi.name}" lên Cloud & lập chỉ mục RAG!`
      );
    } else if (apiRes.isOffline) {
      onNotify(
        editingSite
          ? `Đã cập nhật "${builtSite.translations.vi.name}" (chế độ Local Demo).`
          : `Đã thêm "${builtSite.translations.vi.name}" lên bản đồ (chế độ Local Demo).`
      );
    } else {
      onNotify(
        `Đã cập nhật cục bộ (${apiRes.error}). Đăng nhập Admin Backend để đồng bộ Cloud.`
      );
    }
  };

  const handleSaveRestaurant = async () => {
    if (!restForm.name.trim() || !restForm.siteId) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập tên quán ăn và chọn di tích lân cận.'
      );
      return;
    }

    const builtRes = buildRestaurantFromForm(
      restForm,
      editingRestaurant?.restaurant
    );

    setIsSaving(true);
    const apiRes = editingRestaurant
      ? await adminUpdateRestaurant(restForm.siteId, builtRes)
      : await adminCreateRestaurant(restForm.siteId, builtRes);
    setIsSaving(false);

    if (editingRestaurant && editingRestaurant.siteId !== restForm.siteId) {
      onDeleteRestaurant(
        editingRestaurant.siteId,
        editingRestaurant.restaurant.id
      );
    }
    onUpsertRestaurant(restForm.siteId, builtRes);
    onRecordActivity({
      action: editingRestaurant ? 'update' : 'create',
      entityType: 'restaurant',
      title: `${editingRestaurant ? 'Cập nhật' : 'Thêm mới'} quán "${builtRes.name}"`,
      syncedCloud: apiRes.ok,
    });
    onCloseRestModal();

    if (apiRes.ok) {
      onNotify(`Đã lưu quán "${builtRes.name}" lên Cloud & cập nhật RAG!`);
    } else if (apiRes.isOffline) {
      onNotify(`Đã lưu quán "${builtRes.name}" lên bản đồ (chế độ Local Demo).`);
    } else {
      onNotify(`Đã cập nhật cục bộ (${apiRes.error}).`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsSaving(true);
    if (pendingDelete.kind === 'site') {
      const res = await adminDeleteSite(pendingDelete.siteId);
      onDeleteSite(pendingDelete.siteId);
      onRecordActivity({
        action: 'delete',
        entityType: 'site',
        title: `Xóa di tích "${pendingDelete.title}"`,
        syncedCloud: res.ok,
      });
      onNotify(
        res.ok
          ? `Đã xóa di tích "${pendingDelete.title}" trên Cloud.`
          : `Đã xóa di tích "${pendingDelete.title}" khỏi danh sách.`
      );
    } else {
      const res = await adminDeleteRestaurant(pendingDelete.restaurantId);
      onDeleteRestaurant(pendingDelete.siteId, pendingDelete.restaurantId);
      onRecordActivity({
        action: 'delete',
        entityType: 'restaurant',
        title: `Xóa quán "${pendingDelete.title}"`,
        syncedCloud: res.ok,
      });
      onNotify(
        res.ok
          ? `Đã xóa quán "${pendingDelete.title}" trên Cloud.`
          : `Đã xóa quán "${pendingDelete.title}" khỏi bản đồ.`
      );
    }
    setIsSaving(false);
    onCloseDelete();
  };

  return (
    <>
      {/* SITE CREATE / EDIT MODAL */}
      <Modal
        visible={siteModalOpen && mapPickerTarget !== 'site'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onCloseSiteModal}
      >
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSite ? 'Chỉnh sửa Di tích' : 'Thêm mới Di tích'}
              </Text>
              <TouchableOpacity
                onPress={onCloseSiteModal}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={COLORS.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Tên di tích (Tiếng Việt) *</Text>
                <TextInput
                  value={siteForm.nameVi}
                  onChangeText={(txt) =>
                    setSiteForm((prev) => ({
                      ...prev,
                      nameVi: txt,
                      id: editingSite ? prev.id : slugifyVietnamese(txt),
                    }))
                  }
                  placeholder="VD: Bảo tàng Áo Dài TP.HCM"
                  placeholderTextColor={COLORS.inkMuted}
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Mã định danh (Slug ID)</Text>
                <TextInput
                  value={siteForm.id}
                  editable={!editingSite}
                  onChangeText={(txt) =>
                    setSiteForm((prev) => ({ ...prev, id: txt }))
                  }
                  placeholder="bao-tang-ao-dai"
                  placeholderTextColor={COLORS.inkMuted}
                  autoCapitalize="none"
                  style={[styles.input, editingSite && styles.inputDisabled]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Tên tiếng Anh</Text>
                <TextInput
                  value={siteForm.nameEn}
                  onChangeText={(txt) =>
                    setSiteForm((prev) => ({ ...prev, nameEn: txt }))
                  }
                  placeholder="Ao Dai Museum Ho Chi Minh City"
                  placeholderTextColor={COLORS.inkMuted}
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Danh mục di sản</Text>
                <View style={styles.chipWrap}>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() =>
                        setSiteForm((prev) => ({ ...prev, category: cat.id }))
                      }
                      style={[
                        styles.filterChip,
                        siteForm.category === cat.id && styles.filterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          siteForm.category === cat.id &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, styles.flex]}>
                  <Text style={styles.fieldLabel}>Khu vực</Text>
                  <TextInput
                    value={siteForm.city}
                    onChangeText={(txt) =>
                      setSiteForm((prev) => ({ ...prev, city: txt }))
                    }
                    placeholder="Quận 1 · TP.HCM"
                    placeholderTextColor={COLORS.inkMuted}
                    style={styles.input}
                  />
                </View>
                <View style={[styles.fieldGroup, styles.flex]}>
                  <Text style={styles.fieldLabel}>Giá vé</Text>
                  <TextInput
                    value={siteForm.ticketPrice}
                    onChangeText={(txt) =>
                      setSiteForm((prev) => ({ ...prev, ticketPrice: txt }))
                    }
                    placeholder="40.000đ"
                    placeholderTextColor={COLORS.inkMuted}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, styles.flex]}>
                  <Text style={styles.fieldLabel}>Niên đại / Giai đoạn</Text>
                  <TextInput
                    value={siteForm.historicalEra}
                    onChangeText={(txt) =>
                      setSiteForm((prev) => ({ ...prev, historicalEra: txt }))
                    }
                    placeholder="VD: 1880 – 1891"
                    placeholderTextColor={COLORS.inkMuted}
                    style={styles.input}
                  />
                </View>
                <View style={[styles.fieldGroup, styles.flex]}>
                  <Text style={styles.fieldLabel}>Giờ mở cửa</Text>
                  <TextInput
                    value={siteForm.openingHours}
                    onChangeText={(txt) =>
                      setSiteForm((prev) => ({ ...prev, openingHours: txt }))
                    }
                    placeholder="07:30 – 17:30 Hàng ngày"
                    placeholderTextColor={COLORS.inkMuted}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>
                    Vị trí trên Bản đồ & Tọa độ GPS
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setSiteForm((prev) => ({
                        ...prev,
                        lat: Number(userLocation[0].toFixed(5)),
                        lng: Number(userLocation[1].toFixed(5)),
                      }))
                    }
                    style={styles.gpsFillBtn}
                  >
                    <LocateFixed size={12} color={COLORS.gpsBlue} />
                    <Text style={styles.gpsFillBtnText}>GPS hiện tại</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setMapPickerTarget('site')}
                  style={styles.mapPickerCardBtn}
                >
                  <View style={styles.mapPickerIconCircle}>
                    <MapIcon size={16} color={COLORS.white} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.mapPickerTitle}>
                      Chọn vị trí trực tiếp trên Bản đồ
                    </Text>
                    <Text style={styles.mapPickerSub}>
                      Đang ghim: {Number(siteForm.lat).toFixed(5)},{' '}
                      {Number(siteForm.lng).toFixed(5)} · Chạm để thả ghim
                    </Text>
                  </View>
                  <MapPin size={16} color={COLORS.accent} />
                </TouchableOpacity>

                <View style={styles.twoColRow}>
                  <TextInput
                    value={String(siteForm.lat)}
                    onChangeText={(txt) =>
                      setSiteForm((prev) => ({
                        ...prev,
                        lat: Number(txt) || 0,
                      }))
                    }
                    keyboardType="numeric"
                    placeholder="10.7770"
                    style={[styles.input, styles.flex]}
                  />
                  <TextInput
                    value={String(siteForm.lng)}
                    onChangeText={(txt) =>
                      setSiteForm((prev) => ({
                        ...prev,
                        lng: Number(txt) || 0,
                      }))
                    }
                    keyboardType="numeric"
                    placeholder="106.6953"
                    style={[styles.input, styles.flex]}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Địa chỉ chi tiết</Text>
                <TextInput
                  value={siteForm.address}
                  onChangeText={(txt) =>
                    setSiteForm((prev) => ({ ...prev, address: txt }))
                  }
                  placeholder="Số nhà, đường, phường, quận..."
                  placeholderTextColor={COLORS.inkMuted}
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Tóm tắt lịch sử (hiển thị & RAG AI)
                </Text>
                <TextInput
                  value={siteForm.shortSummaryVi}
                  onChangeText={(txt) =>
                    setSiteForm((prev) => ({ ...prev, shortSummaryVi: txt }))
                  }
                  placeholder="Mô tả ngắn gọn giá trị lịch sử & kiến trúc..."
                  placeholderTextColor={COLORS.inkMuted}
                  multiline
                  numberOfLines={3}
                  style={[styles.input, styles.textArea]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Điểm nhấn kiến trúc (mỗi dòng 1 ý)
                </Text>
                <TextInput
                  value={siteForm.architecturalHighlightsText || ''}
                  onChangeText={(txt) =>
                    setSiteForm((prev) => ({
                      ...prev,
                      architecturalHighlightsText: txt,
                    }))
                  }
                  placeholder={
                    'VD: Mái vòm gạch đỏ kiểu Roman\nHai tháp chuông cao 57,6 mét'
                  }
                  placeholderTextColor={COLORS.inkMuted}
                  multiline
                  numberOfLines={3}
                  style={[styles.input, styles.textArea]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Kịch bản thuyết minh âm thanh (mỗi dòng 1 đoạn đọc)
                </Text>
                <TextInput
                  value={siteForm.audioScriptText || ''}
                  onChangeText={(txt) =>
                    setSiteForm((prev) => ({ ...prev, audioScriptText: txt }))
                  }
                  placeholder="Nhập các đoạn thuyết minh để giọng AI Hoài My / Nam Minh tự động đọc..."
                  placeholderTextColor={COLORS.inkMuted}
                  multiline
                  numberOfLines={4}
                  style={[styles.input, styles.textAreaTall]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>URL Ảnh bìa</Text>
                <TextInput
                  value={siteForm.coverImage}
                  onChangeText={(txt) =>
                    setSiteForm((prev) => ({ ...prev, coverImage: txt }))
                  }
                  placeholder="https://upload.wikimedia.org/... hoặc URL ảnh"
                  placeholderTextColor={COLORS.inkMuted}
                  autoCapitalize="none"
                  style={styles.input}
                />
                {Boolean(siteForm.coverImage.trim()) && (
                  <Image
                    source={{ uri: siteForm.coverImage.trim() }}
                    style={styles.coverPreview}
                    resizeMode="cover"
                  />
                )}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  Di tích Quốc gia Đặc biệt
                </Text>
                <Switch
                  value={siteForm.nationalSpecialMonument}
                  onValueChange={(v) =>
                    setSiteForm((prev) => ({
                      ...prev,
                      nationalSpecialMonument: v,
                    }))
                  }
                  trackColor={{ false: COLORS.border, true: COLORS.ink }}
                  thumbColor={COLORS.white}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  Di sản / Khu Dự trữ Sinh quyển UNESCO
                </Text>
                <Switch
                  value={siteForm.unescoRecognized}
                  onValueChange={(v) =>
                    setSiteForm((prev) => ({ ...prev, unescoRecognized: v }))
                  }
                  trackColor={{ false: COLORS.border, true: COLORS.accent }}
                  thumbColor={COLORS.white}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={onCloseSiteModal}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveSite}
                disabled={isSaving}
                style={styles.saveBtn}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Check size={15} color={COLORS.white} />
                )}
                <Text style={styles.saveBtnText}>
                  {editingSite ? 'Lưu cập nhật' : 'Tạo di tích'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* RESTAURANT CREATE / EDIT MODAL */}
      <Modal
        visible={restModalOpen && mapPickerTarget !== 'restaurant'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onCloseRestModal}
      >
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRestaurant ? 'Chỉnh sửa Quán ăn' : 'Thêm Quán ăn mới'}
              </Text>
              <TouchableOpacity
                onPress={onCloseRestModal}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={COLORS.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Gắn với Di tích lân cận *</Text>
                <View style={styles.miniSearchBox}>
                  <Search size={13} color={COLORS.inkMuted} />
                  <TextInput
                    value={parentSiteQuery}
                    onChangeText={setParentSiteQuery}
                    placeholder="Lọc nhanh di tích cha (VD: Vũng Tàu, Chợ Bến Thành...)"
                    placeholderTextColor={COLORS.inkMuted}
                    style={styles.miniSearchInput}
                  />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {filteredParentSites.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() =>
                        setRestForm((prev) => ({
                          ...prev,
                          siteId: s.id,
                          lat: editingRestaurant ? prev.lat : s.lat,
                          lng: editingRestaurant ? prev.lng : s.lng,
                        }))
                      }
                      style={[
                        styles.filterChip,
                        restForm.siteId === s.id && styles.filterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          restForm.siteId === s.id &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {s.translations.vi.name.slice(0, 28)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Tên quán ăn / cà phê *</Text>
                <TextInput
                  value={restForm.name}
                  onChangeText={(txt) =>
                    setRestForm((prev) => ({ ...prev, name: txt }))
                  }
                  placeholder="VD: Phở Hòa Pasteur"
                  placeholderTextColor={COLORS.inkMuted}
                  style={styles.input}
                />
              </View>

              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, styles.flex]}>
                  <Text style={styles.fieldLabel}>Loại ẩm thực</Text>
                  <TextInput
                    value={restForm.cuisine}
                    onChangeText={(txt) =>
                      setRestForm((prev) => ({ ...prev, cuisine: txt }))
                    }
                    placeholder="Phở, Bún & Mì"
                    style={styles.input}
                  />
                </View>
                <View style={[styles.fieldGroup, styles.flex]}>
                  <Text style={styles.fieldLabel}>Khoảng giá</Text>
                  <TextInput
                    value={restForm.priceRange}
                    onChangeText={(txt) =>
                      setRestForm((prev) => ({ ...prev, priceRange: txt }))
                    }
                    placeholder="50.000đ – 120.000đ"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Món đặc sản (phân cách bằng dấu phẩy)
                </Text>
                <TextInput
                  value={restForm.specialtyDishesText}
                  onChangeText={(txt) =>
                    setRestForm((prev) => ({
                      ...prev,
                      specialtyDishesText: txt,
                    }))
                  }
                  placeholder="Phở bò tái nạm, Quẩy giòn, Trà đá"
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Địa chỉ</Text>
                <TextInput
                  value={restForm.address}
                  onChangeText={(txt) =>
                    setRestForm((prev) => ({ ...prev, address: txt }))
                  }
                  placeholder="260C Pasteur, Quận 3, TP.HCM"
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setMapPickerTarget('restaurant')}
                  style={styles.mapPickerCardBtn}
                >
                  <View style={styles.mapPickerIconCircle}>
                    <MapIcon size={16} color={COLORS.white} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.mapPickerTitle}>
                      Chọn vị trí quán ăn trên Bản đồ
                    </Text>
                    <Text style={styles.mapPickerSub}>
                      Đang ghim: {Number(restForm.lat).toFixed(5)},{' '}
                      {Number(restForm.lng).toFixed(5)}
                    </Text>
                  </View>
                  <MapPin size={16} color={COLORS.accent} />
                </TouchableOpacity>
              </View>

              <View style={styles.twoColRow}>
                <View style={[styles.fieldGroup, styles.flex]}>
                  <Text style={styles.fieldLabel}>Vĩ độ (Lat)</Text>
                  <TextInput
                    value={String(restForm.lat)}
                    onChangeText={(txt) =>
                      setRestForm((prev) => ({ ...prev, lat: Number(txt) || 0 }))
                    }
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
                <View style={[styles.fieldGroup, styles.flex]}>
                  <Text style={styles.fieldLabel}>Kinh độ (Lng)</Text>
                  <TextInput
                    value={String(restForm.lng)}
                    onChangeText={(txt) =>
                      setRestForm((prev) => ({ ...prev, lng: Number(txt) || 0 }))
                    }
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={onCloseRestModal}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveRestaurant}
                disabled={isSaving}
                style={styles.saveBtn}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Check size={15} color={COLORS.white} />
                )}
                <Text style={styles.saveBtnText}>
                  {editingRestaurant ? 'Lưu quán ăn' : 'Thêm quán ăn'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* INTERACTIVE MAP PICKER (Mounted strictly on demand!) */}
      {mapPickerTarget !== null && (
        <AdminMapPickerModal
          visible={true}
          title={
            mapPickerTarget === 'site'
              ? 'Thả ghim vị trí Di tích'
              : 'Thả ghim vị trí Quán ăn'
          }
          initialLat={
            mapPickerTarget === 'site'
              ? Number(siteForm.lat) || userLocation[0]
              : Number(restForm.lat) || userLocation[0]
          }
          initialLng={
            mapPickerTarget === 'site'
              ? Number(siteForm.lng) || userLocation[1]
              : Number(restForm.lng) || userLocation[1]
          }
          userLocation={userLocation}
          existingPoints={existingMapPoints}
          onConfirm={handleConfirmMapPick}
          onClose={() => setMapPickerTarget(null)}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        visible={Boolean(pendingDelete)}
        transparent
        animationType="fade"
        onRequestClose={onCloseDelete}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <Trash2 size={20} color="#B91C1C" />
            </View>
            <Text style={styles.confirmTitle}>
              Xác nhận xóa{' '}
              {pendingDelete?.kind === 'site' ? 'Di tích' : 'Quán ăn'}?
            </Text>
            <Text style={styles.confirmDesc}>
              Bạn sắp xóa &ldquo;{pendingDelete?.title}&rdquo; khỏi hệ thống.
              Thao tác này sẽ cập nhật ngay trên bản đồ & danh sách.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                onPress={onCloseDelete}
                disabled={isSaving}
                style={styles.confirmCancelBtn}
              >
                <Text style={styles.confirmCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                disabled={isSaving}
                style={styles.confirmDeleteBtn}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.confirmDeleteText}>Xóa ngay</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: SPACING.lg,
    gap: 14,
    paddingBottom: 30,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  input: {
    height: 42,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: COLORS.ink,
  },
  inputDisabled: {
    backgroundColor: COLORS.surfaceMuted,
    color: COLORS.inkMuted,
  },
  textArea: {
    height: 82,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  textAreaTall: {
    height: 112,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  filterRow: {
    gap: 7,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: '#141413',
    borderColor: '#141413',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  miniSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 36,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  miniSearchInput: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.ink,
    paddingVertical: 0,
  },
  gpsFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.gpsBlueSoft,
  },
  gpsFillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gpsBlue,
  },
  mapPickerCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    marginBottom: 6,
  },
  mapPickerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: RADII.pill,
    backgroundColor: '#141413',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPickerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  mapPickerSub: {
    fontSize: 11.5,
    color: COLORS.inkSecondary,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  coverPreview: {
    width: '100%',
    height: 150,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.surfaceMuted,
    marginTop: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
    flex: 1,
    marginRight: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cancelBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADII.md,
    backgroundColor: '#141413',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,17,16,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    ...SHADOWS.floating,
  },
  confirmIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADII.pill,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center',
  },
  confirmDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.inkSecondary,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 6,
  },
  confirmCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  confirmDeleteBtn: {
    flex: 1,
    height: 42,
    borderRadius: RADII.md,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default AdminEditorModals;
