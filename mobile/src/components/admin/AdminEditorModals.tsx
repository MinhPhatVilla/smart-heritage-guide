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
  Copy,
  Globe2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Search,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  X,
} from 'lucide-react-native';
import {
  HeritageSite,
  NearbyRestaurant,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../../types/heritage';
import {
  AdminLocalizedTextDraft,
  AdminRestaurantFormInput,
  AdminSiteFormInput,
  adminCreateRestaurant,
  adminCreateSite,
  adminDeleteRestaurant,
  adminDeleteSite,
  adminTranslateSiteContent,
  adminUpdateRestaurant,
  adminUpdateSite,
  buildHeritageSiteFromForm,
  buildLocalFallbackTranslations,
  buildRestaurantFromForm,
  countCompleteLanguages,
  createEmptyLocalizedDrafts,
  extractLocalizedDraftsFromSite,
  getLanguageCompleteness,
  slugifyVietnamese,
} from '../../services/adminService';
import { speechService } from '../../services/speechService';
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

const LANG_PLACEHOLDERS: Record<
  SupportedLanguage,
  {
    name: string;
    era: string;
    hours: string;
    summary: string;
    highlights: string;
    script: string;
  }
> = {
  vi: {
    name: 'VD: Bảo tàng Áo Dài TP.HCM',
    era: 'VD: 1880 – 1891 hoặc Thế kỷ XX',
    hours: '07:30 – 17:30 Hàng ngày',
    summary: 'Mô tả ngắn gọn giá trị lịch sử & kiến trúc (Tiếng Việt)...',
    highlights: 'VD: Mái vòm gạch đỏ kiểu Roman\nHai tháp chuông cao 57,6 mét',
    script: 'Nhập các đoạn thuyết minh để giọng AI tự động đọc (mỗi dòng 1 đoạn)...',
  },
  en: {
    name: 'e.g. Ao Dai Museum Ho Chi Minh City',
    era: 'e.g. 1880 – 1891 or 20th Century',
    hours: '07:30 – 17:30 Daily',
    summary: 'Concise historical & architectural overview in English...',
    highlights: 'e.g. Neo-Romanesque red brick facade\nTwin 57.6m bell towers',
    script: 'Enter English audio guide narration paragraphs (one paragraph per line)...',
  },
  fr: {
    name: "ex. Musée de l'Áo Dài de Hô Chi Minh-Ville",
    era: 'ex. 1880 – 1891 ou XXe siècle',
    hours: '07h30 – 17h30 Tous les jours',
    summary: 'Présentation historique et architecturale en français...',
    highlights: 'ex. Façade néo-romane en briques rouges\nClochers jumeaux de 57,6 m',
    script: 'Saisissez le script audio en français (un paragraphe par ligne)...',
  },
  zh: {
    name: '例如：胡志明市奥黛博物馆',
    era: '例如：1880 – 1891 或 20世纪',
    hours: '07:30 – 17:30 每日开放',
    summary: '简明历史与建筑价值介绍（简体中文）...',
    highlights: '例如：红砖罗马风格穹顶\n57.6米双钟楼',
    script: '输入中文语音导览解说词（每行一段）...',
  },
  ja: {
    name: '例：ホーチミン市アオザイ博物館',
    era: '例：1880年〜1891年 または 20世紀',
    hours: '07:30 – 17:30 毎日',
    summary: '歴史・建築的価値の簡潔な紹介（日本語）...',
    highlights: '例：赤レンガ造りのネオ・ロマネスク様式\n高さ57.6mの双塔',
    script: '日本語の音声ガイド原稿を入力してください（1行につき1段落）...',
  },
};

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
  const [activeLang, setActiveLang] = useState<SupportedLanguage>('vi');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translateNotice, setTranslateNotice] = useState<string | null>(null);
  const [isPreviewSpeaking, setIsPreviewSpeaking] = useState<boolean>(false);
  const [mapPickerTarget, setMapPickerTarget] = useState<
    'site' | 'restaurant' | null
  >(null);
  const [parentSiteQuery, setParentSiteQuery] = useState<string>('');

  const [siteForm, setSiteForm] = useState<AdminSiteFormInput>({
    id: '',
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
    translations: createEmptyLocalizedDrafts(),
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

  // Stop any TTS preview whenever modal closes or unmounts
  useEffect(() => {
    if (!siteModalOpen) {
      speechService.stop();
      setIsPreviewSpeaking(false);
      setTranslateNotice(null);
    }
    return () => {
      speechService.stop();
    };
  }, [siteModalOpen]);

  // Hydrate Site form whenever modal opens
  useEffect(() => {
    if (!siteModalOpen) return;
    setActiveLang('vi');
    setTranslateNotice(null);
    if (editingSite) {
      setSiteForm({
        id: editingSite.id,
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
        translations: extractLocalizedDraftsFromSite(editingSite),
      });
    } else {
      setSiteForm({
        id: '',
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
        translations: createEmptyLocalizedDrafts(),
      });
    }
  }, [editingSite, siteModalOpen, userLocation]);

  const activeDraft = siteForm.translations[activeLang];
  const activeLangMeta = useMemo(
    () =>
      SUPPORTED_LANGUAGES.find((m) => m.code === activeLang) ||
      SUPPORTED_LANGUAGES[0],
    [activeLang]
  );
  const completeLangCount = useMemo(
    () => countCompleteLanguages(siteForm.translations),
    [siteForm.translations]
  );

  const updateActiveDraftField = (
    field: keyof AdminLocalizedTextDraft,
    value: string
  ) => {
    setSiteForm((prev) => {
      const nextTranslations = {
        ...prev.translations,
        [activeLang]: {
          ...prev.translations[activeLang],
          [field]: value,
        },
      };
      return {
        ...prev,
        id:
          !editingSite && activeLang === 'vi' && field === 'name'
            ? slugifyVietnamese(value)
            : prev.id,
        translations: nextTranslations,
      };
    });
  };

  const handleSelectLang = (lang: SupportedLanguage) => {
    if (lang === activeLang) return;
    if (isPreviewSpeaking) {
      speechService.stop();
      setIsPreviewSpeaking(false);
    }
    setActiveLang(lang);
  };

  const handleTogglePreviewTts = () => {
    if (isPreviewSpeaking) {
      speechService.stop();
      setIsPreviewSpeaking(false);
      return;
    }
    const scriptLines = activeDraft.audioScriptText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const segments =
      scriptLines.length > 0
        ? scriptLines
        : [activeDraft.shortSummary.trim(), activeDraft.name.trim()].filter(
            Boolean
          );

    if (segments.length === 0) {
      Alert.alert(
        'Chưa có nội dung để đọc',
        `Vui lòng nhập kịch bản thuyết minh hoặc mô tả cho ngôn ngữ ${activeLangMeta.nativeLabel}.`
      );
      return;
    }

    setIsPreviewSpeaking(true);
    speechService.speakScript(segments, activeLang, 1.0, 0, {
      onStateChange: (st) => {
        if (st === 'idle') setIsPreviewSpeaking(false);
      },
      onEnd: () => setIsPreviewSpeaking(false),
      onError: () => setIsPreviewSpeaking(false),
    });
  };

  const handleAutoTranslateAll = async () => {
    const srcDraft = siteForm.translations[activeLang];
    if (!srcDraft.name.trim()) {
      Alert.alert(
        'Thiếu văn bản gốc',
        `Vui lòng nhập ít nhất Tên di tích cho ngôn ngữ ${activeLangMeta.nativeLabel} trước khi dịch tự động.`
      );
      return;
    }

    setIsTranslating(true);
    setTranslateNotice(null);

    const targetLangs = SUPPORTED_LANGUAGES.map((m) => m.code).filter(
      (code) => code !== activeLang
    );

    const apiRes = await adminTranslateSiteContent({
      sourceLanguage: activeLang,
      sourceDraft: srcDraft,
      targetLanguages: targetLangs,
      city: siteForm.city,
      address: siteForm.address,
    });

    if (apiRes.ok && apiRes.data?.translations) {
      const incoming = apiRes.data.translations;
      setSiteForm((prev) => {
        const merged = { ...prev.translations };
        for (const lang of targetLangs) {
          const loc = incoming[lang];
          if (!loc) continue;
          merged[lang] = {
            name: loc.name || prev.translations[lang].name,
            shortSummary: loc.shortSummary || prev.translations[lang].shortSummary,
            historicalEra:
              loc.historicalEra || prev.translations[lang].historicalEra,
            openingHours:
              loc.openingHours || prev.translations[lang].openingHours,
            architecturalHighlightsText: (
              loc.architecturalHighlights || []
            ).join('\n'),
            audioScriptText: (loc.audioScript || []).join('\n'),
          };
        }
        return { ...prev, translations: merged };
      });
      setTranslateNotice(
        apiRes.data.mode === 'gemini'
          ? `Đã dịch tự động bằng Gemini AI từ ${activeLang.toUpperCase()} sang 4 ngôn ngữ còn lại.`
          : apiRes.data.note ||
              'Đã tạo bản nháp đa ngôn ngữ chuẩn hóa — hãy chuyển tab ngôn ngữ để rà soát.'
      );
    } else {
      // Offline / Local Demo fallback so Admin always gets 5-language drafts immediately
      const localDrafts = buildLocalFallbackTranslations(
        activeLang,
        srcDraft,
        siteForm.city,
        siteForm.address,
        targetLangs
      );
      setSiteForm((prev) => {
        const merged = { ...prev.translations };
        for (const lang of targetLangs) {
          const item = localDrafts[lang];
          if (item) {
            merged[lang] = item;
          }
        }
        return { ...prev, translations: merged };
      });
      setTranslateNotice(
        'Backend AI chưa sẵn sàng — đã khởi tạo bản nháp 4 ngôn ngữ cục bộ để bạn chỉnh sửa nhanh.'
      );
    }

    setIsTranslating(false);
  };

  const handleCopyFromVietnamese = () => {
    if (activeLang === 'vi') return;
    const vi = siteForm.translations.vi;
    if (!vi.name.trim() && !vi.shortSummary.trim()) {
      Alert.alert(
        'Chưa có nội dung Tiếng Việt',
        'Vui lòng nhập nội dung Tiếng Việt trước để sao chép khung sang ngôn ngữ này.'
      );
      return;
    }
    const localDraft = buildLocalFallbackTranslations(
      'vi',
      vi,
      siteForm.city,
      siteForm.address,
      [activeLang]
    )[activeLang];
    if (!localDraft) return;
    setSiteForm((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeLang]: localDraft,
      },
    }));
    setTranslateNotice(
      `Đã sao chép khung dữ liệu từ Tiếng Việt sang ${activeLangMeta.nativeLabel}.`
    );
  };

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
    if (!siteForm.translations.vi.name.trim()) {
      setActiveLang('vi');
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

    speechService.stop();
    setIsPreviewSpeaking(false);

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
              {/* MULTILINGUAL TEXT STUDIO CARD (VI · EN · FR · ZH · JA) */}
              <View style={styles.langStudioCard}>
                <View style={styles.langStudioHeader}>
                  <View style={styles.langStudioTitleRow}>
                    <Globe2 size={15} color={COLORS.accent} />
                    <Text style={styles.langStudioTitle}>
                      Nội dung Đa ngôn ngữ (5 thứ tiếng)
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.langProgressBadge,
                      completeLangCount === 5 && styles.langProgressBadgeFull,
                    ]}
                  >
                    <Text
                      style={[
                        styles.langProgressText,
                        completeLangCount === 5 && styles.langProgressTextFull,
                      ]}
                    >
                      {completeLangCount}/5 đủ
                    </Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.langTabRow}
                >
                  {SUPPORTED_LANGUAGES.map((meta) => {
                    const isActive = activeLang === meta.code;
                    const status = getLanguageCompleteness(
                      siteForm.translations[meta.code]
                    );
                    const dotColor =
                      status === 'complete'
                        ? COLORS.visitedDot
                        : status === 'partial'
                          ? COLORS.amber
                          : '#CBD5E1';
                    return (
                      <TouchableOpacity
                        key={meta.code}
                        activeOpacity={0.85}
                        onPress={() => handleSelectLang(meta.code)}
                        style={[
                          styles.langTabBtn,
                          isActive && styles.langTabBtnActive,
                        ]}
                      >
                        <Text style={styles.langTabFlag}>{meta.flag}</Text>
                        <Text
                          style={[
                            styles.langTabCode,
                            isActive && styles.langTabCodeActive,
                          ]}
                        >
                          {meta.code.toUpperCase()}
                        </Text>
                        <View
                          style={[
                            styles.langStatusDot,
                            { backgroundColor: dotColor },
                          ]}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.langActionBar}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleAutoTranslateAll}
                    disabled={isTranslating}
                    style={styles.aiTranslateBtn}
                  >
                    {isTranslating ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Sparkles size={13} color={COLORS.white} />
                    )}
                    <Text style={styles.aiTranslateBtnText}>
                      {isTranslating
                        ? 'Đang dịch 4 ngôn ngữ...'
                        : `AI Dịch từ ${activeLang.toUpperCase()} → 4 ngôn ngữ`}
                    </Text>
                  </TouchableOpacity>

                  {activeLang !== 'vi' && (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleCopyFromVietnamese}
                      style={styles.copyViBtn}
                    >
                      <Copy size={12} color={COLORS.ink} />
                      <Text style={styles.copyViBtnText}>Chép từ VI</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {Boolean(translateNotice) && (
                  <Text style={styles.translateNoticeText}>
                    {translateNotice}
                  </Text>
                )}

                {/* ACTIVE LANGUAGE TEXT FIELDS */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Tên di tích ({activeLangMeta.flag} {activeLangMeta.nativeLabel})
                    {activeLang === 'vi' ? ' *' : ''}
                  </Text>
                  <TextInput
                    value={activeDraft.name}
                    onChangeText={(txt) => updateActiveDraftField('name', txt)}
                    placeholder={LANG_PLACEHOLDERS[activeLang].name}
                    placeholderTextColor={COLORS.inkMuted}
                    style={styles.input}
                  />
                </View>

                <View style={styles.twoColRow}>
                  <View style={[styles.fieldGroup, styles.flex]}>
                    <Text style={styles.fieldLabel}>
                      Niên đại ({activeLang.toUpperCase()})
                    </Text>
                    <TextInput
                      value={activeDraft.historicalEra}
                      onChangeText={(txt) =>
                        updateActiveDraftField('historicalEra', txt)
                      }
                      placeholder={LANG_PLACEHOLDERS[activeLang].era}
                      placeholderTextColor={COLORS.inkMuted}
                      style={styles.input}
                    />
                  </View>
                  <View style={[styles.fieldGroup, styles.flex]}>
                    <Text style={styles.fieldLabel}>
                      Giờ mở cửa ({activeLang.toUpperCase()})
                    </Text>
                    <TextInput
                      value={activeDraft.openingHours}
                      onChangeText={(txt) =>
                        updateActiveDraftField('openingHours', txt)
                      }
                      placeholder={LANG_PLACEHOLDERS[activeLang].hours}
                      placeholderTextColor={COLORS.inkMuted}
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Tóm tắt lịch sử & RAG AI ({activeLang.toUpperCase()})
                  </Text>
                  <TextInput
                    value={activeDraft.shortSummary}
                    onChangeText={(txt) =>
                      updateActiveDraftField('shortSummary', txt)
                    }
                    placeholder={LANG_PLACEHOLDERS[activeLang].summary}
                    placeholderTextColor={COLORS.inkMuted}
                    multiline
                    numberOfLines={3}
                    style={[styles.input, styles.textArea]}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Điểm nhấn kiến trúc ({activeLang.toUpperCase()} · mỗi dòng 1 ý)
                  </Text>
                  <TextInput
                    value={activeDraft.architecturalHighlightsText}
                    onChangeText={(txt) =>
                      updateActiveDraftField('architecturalHighlightsText', txt)
                    }
                    placeholder={LANG_PLACEHOLDERS[activeLang].highlights}
                    placeholderTextColor={COLORS.inkMuted}
                    multiline
                    numberOfLines={3}
                    style={[styles.input, styles.textArea]}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.fieldLabelRow}>
                    <Text style={styles.fieldLabel}>
                      Kịch bản thuyết minh ({activeLang.toUpperCase()} · mỗi dòng 1 đoạn)
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleTogglePreviewTts}
                      style={[
                        styles.ttsPreviewBtn,
                        isPreviewSpeaking && styles.ttsPreviewBtnActive,
                      ]}
                    >
                      {isPreviewSpeaking ? (
                        <Square size={11} color={COLORS.white} />
                      ) : (
                        <Volume2 size={12} color={COLORS.accent} />
                      )}
                      <Text
                        style={[
                          styles.ttsPreviewBtnText,
                          isPreviewSpeaking && styles.ttsPreviewBtnTextActive,
                        ]}
                      >
                        {isPreviewSpeaking
                          ? 'Dừng đọc'
                          : `Nghe thử ${activeLang.toUpperCase()}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    value={activeDraft.audioScriptText}
                    onChangeText={(txt) =>
                      updateActiveDraftField('audioScriptText', txt)
                    }
                    placeholder={LANG_PLACEHOLDERS[activeLang].script}
                    placeholderTextColor={COLORS.inkMuted}
                    multiline
                    numberOfLines={4}
                    style={[styles.input, styles.textAreaTall]}
                  />
                </View>
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
  langStudioCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 12,
    ...SHADOWS.card,
  },
  langStudioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  langStudioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  langStudioTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  langProgressBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.amberBg,
  },
  langProgressBadgeFull: {
    backgroundColor: COLORS.visitedBg,
  },
  langProgressText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.amber,
  },
  langProgressTextFull: {
    color: COLORS.visited,
  },
  langTabRow: {
    gap: 7,
    paddingVertical: 2,
  },
  langTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langTabBtnActive: {
    backgroundColor: '#141413',
    borderColor: '#141413',
  },
  langTabFlag: {
    fontSize: 13,
  },
  langTabCode: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  langTabCodeActive: {
    color: COLORS.white,
  },
  langStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  langActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  aiTranslateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.md,
    backgroundColor: COLORS.accent,
    flexGrow: 1,
  },
  aiTranslateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  copyViBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  copyViBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.ink,
  },
  translateNoticeText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: COLORS.visited,
    backgroundColor: COLORS.visitedBg,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADII.md,
  },
  ttsPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  ttsPreviewBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  ttsPreviewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  ttsPreviewBtnTextActive: {
    color: COLORS.white,
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
