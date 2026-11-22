import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Database,
  Edit3,
  Landmark,
  LocateFixed,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Utensils,
  WifiOff,
  X,
} from 'lucide-react-native';
import {
  HeritageCategory,
  HeritageSite,
  NearbyRestaurant,
} from '../types/heritage';
import { AuthSessionState } from '../services/authService';
import {
  AdminRestaurantFormInput,
  AdminSiteFormInput,
  BackendHealthStatus,
  adminCreateRestaurant,
  adminCreateSite,
  adminDeleteRestaurant,
  adminDeleteSite,
  adminUpdateRestaurant,
  adminUpdateSite,
  buildHeritageSiteFromForm,
  buildRestaurantFromForm,
  fetchBackendHealth,
  getAdminApiEndpointLabel,
  slugifyVietnamese,
} from '../services/adminService';
import { OVERTURE_PLACES_RELEASE } from '../data/overtureRestaurants';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export interface AdminDashboardViewProps {
  sites: HeritageSite[];
  userLocation: [number, number];
  authState: AuthSessionState;
  onUpsertSite: (site: HeritageSite) => void;
  onDeleteSite: (siteId: string) => void;
  onUpsertRestaurant: (siteId: string, restaurant: NearbyRestaurant) => void;
  onDeleteRestaurant: (siteId: string, restaurantId: string) => void;
  onOpenAuthModal: () => void;
  onNotify: (message: string) => void;
}

type AdminSubTab = 'sites' | 'restaurants' | 'system';
type RestaurantSourceFilter = 'all' | 'curated' | 'overture';

const CATEGORY_OPTIONS: Array<{ id: HeritageCategory; label: string }> = [
  { id: 'monument', label: 'Di tích' },
  { id: 'museum', label: 'Bảo tàng' },
  { id: 'temple', label: 'Đền Chùa' },
  { id: 'imperial', label: 'Dinh thự' },
  { id: 'ancient_town', label: 'Chợ & Sinh quyển' },
];

function getCategoryLabel(category: HeritageCategory): string {
  return (
    CATEGORY_OPTIONS.find((item) => item.id === category)?.label || category
  );
}

interface FlattenedRestaurant {
  siteId: string;
  siteName: string;
  restaurant: NearbyRestaurant;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  sites,
  userLocation,
  authState,
  onUpsertSite,
  onDeleteSite,
  onUpsertRestaurant,
  onDeleteRestaurant,
  onOpenAuthModal,
  onNotify,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('sites');
  const [siteSearch, setSiteSearch] = useState<string>('');
  const [siteCategoryFilter, setSiteCategoryFilter] = useState<
    'all' | HeritageCategory
  >('all');
  const [restaurantSearch, setRestaurantSearch] = useState<string>('');
  const [restaurantSourceFilter, setRestaurantSourceFilter] =
    useState<RestaurantSourceFilter>('all');

  const [health, setHealth] = useState<BackendHealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Site Form Modal state
  const [siteModalVisible, setSiteModalVisible] = useState<boolean>(false);
  const [editingSite, setEditingSite] = useState<HeritageSite | null>(null);
  const [siteForm, setSiteForm] = useState<AdminSiteFormInput>({
    id: '',
    nameVi: '',
    nameEn: '',
    shortSummaryVi: '',
    historicalEra: '',
    openingHours: '07:30 – 17:30 Hàng ngày',
    city: 'Quận 1 · TP.HCM',
    district: 'Quận 1',
    address: '',
    lat: userLocation[0],
    lng: userLocation[1],
    category: 'monument',
    ticketPrice: 'Miễn phí tham quan',
    coverImage: '',
    rating: 4.7,
    nationalSpecialMonument: false,
    unescoRecognized: false,
  });

  // Restaurant Form Modal state
  const [restModalVisible, setRestModalVisible] = useState<boolean>(false);
  const [editingRestaurant, setEditingRestaurant] =
    useState<FlattenedRestaurant | null>(null);
  const [restForm, setRestForm] = useState<AdminRestaurantFormInput>({
    siteId: sites[0]?.id || '',
    name: '',
    cuisine: 'Ẩm thực Việt Nam',
    specialtyDishesText: '',
    rating: 4.6,
    priceRange: '45.000đ – 120.000đ',
    lat: userLocation[0],
    lng: userLocation[1],
    address: '',
    openHours: '07:00 – 21:30',
    imageUrl: '',
  });

  // Delete confirmation modal (works cleanly on both Mobile & Web)
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: 'site'; siteId: string; title: string }
    | { kind: 'restaurant'; siteId: string; restaurantId: string; title: string }
    | null
  >(null);

  const loadHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    const res = await fetchBackendHealth();
    setIsCheckingHealth(false);
    if (res.ok) {
      setHealth(res.data);
    } else {
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  const allRestaurants = useMemo<FlattenedRestaurant[]>(() => {
    const items: FlattenedRestaurant[] = [];
    sites.forEach((site) => {
      const siteName = site.translations.vi.name;
      site.nearbyRestaurants.forEach((restaurant) => {
        items.push({ siteId: site.id, siteName, restaurant });
      });
    });
    return items;
  }, [sites]);

  const overtureCount = useMemo(
    () =>
      allRestaurants.filter((item) => item.restaurant.source === 'overture')
        .length,
    [allRestaurants]
  );

  const filteredSites = useMemo(() => {
    const q = siteSearch.trim().toLowerCase();
    return sites.filter((site) => {
      if (siteCategoryFilter !== 'all' && site.category !== siteCategoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        site.translations.vi.name.toLowerCase().includes(q) ||
        site.translations.en.name.toLowerCase().includes(q) ||
        site.city.toLowerCase().includes(q) ||
        site.id.toLowerCase().includes(q)
      );
    });
  }, [sites, siteSearch, siteCategoryFilter]);

  const filteredRestaurants = useMemo(() => {
    const q = restaurantSearch.trim().toLowerCase();
    return allRestaurants.filter((item) => {
      const src = item.restaurant.source || 'curated';
      if (restaurantSourceFilter !== 'all' && src !== restaurantSourceFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.restaurant.name.toLowerCase().includes(q) ||
        item.restaurant.cuisine.toLowerCase().includes(q) ||
        item.siteName.toLowerCase().includes(q) ||
        item.restaurant.address.toLowerCase().includes(q)
      );
    });
  }, [allRestaurants, restaurantSearch, restaurantSourceFilter]);

  // Open Site Modal (Add / Edit)
  const openCreateSiteModal = () => {
    setEditingSite(null);
    setSiteForm({
      id: '',
      nameVi: '',
      nameEn: '',
      shortSummaryVi: '',
      historicalEra: 'Thế kỷ XIX – XX',
      openingHours: '07:30 – 17:30 Hàng ngày',
      city: 'Quận 1 · TP.HCM',
      district: 'Quận 1',
      address: '',
      lat: Number(userLocation[0].toFixed(5)),
      lng: Number(userLocation[1].toFixed(5)),
      category: 'monument',
      ticketPrice: 'Miễn phí tham quan',
      coverImage:
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80',
      rating: 4.7,
      nationalSpecialMonument: false,
      unescoRecognized: false,
    });
    setSiteModalVisible(true);
  };

  const openEditSiteModal = (site: HeritageSite) => {
    setEditingSite(site);
    setSiteForm({
      id: site.id,
      nameVi: site.translations.vi.name,
      nameEn: site.translations.en.name,
      shortSummaryVi: site.translations.vi.shortSummary,
      historicalEra: site.translations.vi.historicalEra,
      openingHours: site.translations.vi.openingHours,
      city: site.city,
      district: site.district || site.city.split('·')[0]?.trim() || 'Quận 1',
      address: site.address || '',
      lat: site.lat,
      lng: site.lng,
      category: site.category,
      ticketPrice: site.ticketPrice,
      coverImage: site.coverImage,
      rating: site.rating,
      nationalSpecialMonument: Boolean(site.nationalSpecialMonument),
      unescoRecognized: Boolean(site.unescoRecognized),
    });
    setSiteModalVisible(true);
  };

  const handleSaveSite = async () => {
    if (!siteForm.nameVi.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên di tích tiếng Việt.');
      return;
    }
    const latNum = Number(siteForm.lat);
    const lngNum = Number(siteForm.lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      Alert.alert('Tọa độ không hợp lệ', 'Vui lòng nhập vĩ độ (lat) và kinh độ (lng) hợp lệ.');
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
    setSiteModalVisible(false);

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

  // Open Restaurant Modal (Add / Edit)
  const openCreateRestaurantModal = () => {
    const firstSite = sites[0];
    setEditingRestaurant(null);
    setRestForm({
      siteId: firstSite?.id || '',
      name: '',
      cuisine: 'Ẩm thực Việt Nam',
      specialtyDishesText: 'Phở bò, Cơm tấm, Cà phê sữa đá',
      rating: 4.6,
      priceRange: '45.000đ – 120.000đ',
      lat: Number((firstSite?.lat ?? userLocation[0]).toFixed(5)),
      lng: Number((firstSite?.lng ?? userLocation[1]).toFixed(5)),
      address: firstSite?.city || 'Quận 1, TP.HCM',
      openHours: '07:00 – 21:30',
      imageUrl:
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    });
    setRestModalVisible(true);
  };

  const openEditRestaurantModal = (item: FlattenedRestaurant) => {
    setEditingRestaurant(item);
    setRestForm({
      id: item.restaurant.id,
      siteId: item.siteId,
      name: item.restaurant.name,
      cuisine: item.restaurant.cuisine,
      specialtyDishesText: item.restaurant.specialtyDishes.join(', '),
      rating: item.restaurant.rating,
      priceRange: item.restaurant.priceRange,
      lat: item.restaurant.lat,
      lng: item.restaurant.lng,
      address: item.restaurant.address,
      openHours: item.restaurant.openHours,
      imageUrl: item.restaurant.imageUrl,
    });
    setRestModalVisible(true);
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

    // Nếu đổi di tích cha khi sửa quán, xóa ở di tích cũ trước
    if (editingRestaurant && editingRestaurant.siteId !== restForm.siteId) {
      onDeleteRestaurant(editingRestaurant.siteId, editingRestaurant.restaurant.id);
    }
    onUpsertRestaurant(restForm.siteId, builtRes);
    setRestModalVisible(false);

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
      onNotify(
        res.ok
          ? `Đã xóa di tích "${pendingDelete.title}" trên Cloud.`
          : `Đã xóa di tích "${pendingDelete.title}" khỏi danh sách.`
      );
    } else {
      const res = await adminDeleteRestaurant(pendingDelete.restaurantId);
      onDeleteRestaurant(pendingDelete.siteId, pendingDelete.restaurantId);
      onNotify(
        res.ok
          ? `Đã xóa quán "${pendingDelete.title}" trên Cloud.`
          : `Đã xóa quán "${pendingDelete.title}" khỏi bản đồ.`
      );
    }
    setIsSaving(false);
    setPendingDelete(null);
  };

  const isBackendOnline = Boolean(health?.status === 'ok');

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Editorial Admin Header */}
        <View style={styles.pageHeaderRow}>
          <View style={styles.pageHeaderText}>
            <View style={styles.adminEyebrowRow}>
              <ShieldCheck size={12} color={COLORS.accent} />
              <Text style={styles.adminEyebrow}>BẢNG QUẢN TRỊ ADMIN</Text>
            </View>
            <Text style={styles.pageTitle}>Quản lý Di sản & Bản đồ</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={loadHealth}
            style={[
              styles.statusBadge,
              isBackendOnline ? styles.statusBadgeOnline : styles.statusBadgeLocal,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isBackendOnline
                    ? COLORS.visitedDot
                    : COLORS.amber,
                },
              ]}
            />
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color: isBackendOnline ? COLORS.visited : COLORS.amber,
                },
              ]}
            >
              {isCheckingHealth
                ? 'Đang kiểm tra…'
                : isBackendOnline
                  ? 'Cloud Online'
                  : 'Local Demo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Unified Single-Bar KPI Strip */}
        <View style={styles.kpiStrip}>
          <View style={[styles.kpiCell, styles.kpiCellBorder]}>
            <Text style={styles.kpiValue}>{sites.length}</Text>
            <Text style={styles.kpiLabel}>Di tích</Text>
          </View>
          <View style={[styles.kpiCell, styles.kpiCellBorder]}>
            <Text style={styles.kpiValue}>{allRestaurants.length}</Text>
            <Text style={styles.kpiLabel}>Quán ăn</Text>
          </View>
          <View style={[styles.kpiCell, styles.kpiCellBorder]}>
            <Text style={styles.kpiValue}>{overtureCount}</Text>
            <Text style={styles.kpiLabel}>Overture</Text>
          </View>
          <View style={styles.kpiCell}>
            <Text style={styles.kpiValue}>5</Text>
            <Text style={styles.kpiLabel}>Ngôn ngữ</Text>
          </View>
        </View>

        {/* 3 Segmented Sub-Tabs */}
        <View style={styles.subTabsBar}>
          <TouchableOpacity
            onPress={() => setActiveSubTab('sites')}
            style={[
              styles.subTabBtn,
              activeSubTab === 'sites' && styles.subTabBtnActive,
            ]}
            activeOpacity={0.8}
          >
            <Landmark
              size={14}
              color={activeSubTab === 'sites' ? COLORS.ink : COLORS.inkMuted}
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'sites' && styles.subTabTextActive,
              ]}
            >
              Di tích
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveSubTab('restaurants')}
            style={[
              styles.subTabBtn,
              activeSubTab === 'restaurants' && styles.subTabBtnActive,
            ]}
            activeOpacity={0.8}
          >
            <Utensils
              size={14}
              color={
                activeSubTab === 'restaurants' ? COLORS.ink : COLORS.inkMuted
              }
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'restaurants' && styles.subTabTextActive,
              ]}
            >
              Quán ăn
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveSubTab('system')}
            style={[
              styles.subTabBtn,
              activeSubTab === 'system' && styles.subTabBtnActive,
            ]}
            activeOpacity={0.8}
          >
            <Server
              size={14}
              color={activeSubTab === 'system' ? COLORS.ink : COLORS.inkMuted}
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'system' && styles.subTabTextActive,
              ]}
            >
              Hệ thống
            </Text>
          </TouchableOpacity>
        </View>

        {/* SUB-TAB 1: HERITAGE SITES CRUD */}
        {activeSubTab === 'sites' && (
          <View style={styles.section}>
            <View style={styles.actionToolbar}>
              <View style={styles.searchPill}>
                <Search size={15} color={COLORS.inkMuted} />
                <TextInput
                  value={siteSearch}
                  onChangeText={setSiteSearch}
                  placeholder="Tìm di tích theo tên, quận, mã..."
                  placeholderTextColor={COLORS.inkMuted}
                  style={styles.searchInput}
                />
                {siteSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setSiteSearch('')}>
                    <X size={14} color={COLORS.inkMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={openCreateSiteModal}
                style={styles.addBtn}
              >
                <Plus size={15} color={COLORS.white} />
                <Text style={styles.addBtnText}>Thêm</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <TouchableOpacity
                onPress={() => setSiteCategoryFilter('all')}
                style={[
                  styles.filterChip,
                  siteCategoryFilter === 'all' && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    siteCategoryFilter === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  Tất cả ({sites.length})
                </Text>
              </TouchableOpacity>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSiteCategoryFilter(cat.id)}
                  style={[
                    styles.filterChip,
                    siteCategoryFilter === cat.id && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      siteCategoryFilter === cat.id &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.listGap}>
              {filteredSites.map((site) => (
                <View key={site.id} style={styles.adminCard}>
                  <Image
                    source={{ uri: site.coverImage }}
                    style={styles.siteThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.cardBody}>
                    <View style={styles.cardMetaRow}>
                      <Text style={styles.cardMetaTag}>
                        {getCategoryLabel(site.category)}
                      </Text>
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.cardMetaMuted} numberOfLines={1}>
                        {site.city}
                      </Text>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {site.translations.vi.name}
                    </Text>
                    <Text style={styles.cardSubMeta} numberOfLines={1}>
                      {site.nearbyRestaurants.length} quán ăn · ★{' '}
                      {site.rating.toFixed(1)} · {site.lat.toFixed(4)},{' '}
                      {site.lng.toFixed(4)}
                    </Text>
                  </View>

                  <View style={styles.cardActionsCol}>
                    <TouchableOpacity
                      onPress={() => openEditSiteModal(site)}
                      style={styles.iconActionBtn}
                      accessibilityLabel="Chỉnh sửa di tích"
                    >
                      <Edit3 size={15} color={COLORS.ink} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        setPendingDelete({
                          kind: 'site',
                          siteId: site.id,
                          title: site.translations.vi.name,
                        })
                      }
                      style={[styles.iconActionBtn, styles.iconActionDanger]}
                      accessibilityLabel="Xóa di tích"
                    >
                      <Trash2 size={15} color={COLORS.accent} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SUB-TAB 2: RESTAURANTS CRUD */}
        {activeSubTab === 'restaurants' && (
          <View style={styles.section}>
            <View style={styles.actionToolbar}>
              <View style={styles.searchPill}>
                <Search size={15} color={COLORS.inkMuted} />
                <TextInput
                  value={restaurantSearch}
                  onChangeText={setRestaurantSearch}
                  placeholder="Tìm tên quán, món ăn, di tích..."
                  placeholderTextColor={COLORS.inkMuted}
                  style={styles.searchInput}
                />
                {restaurantSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setRestaurantSearch('')}>
                    <X size={14} color={COLORS.inkMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={openCreateRestaurantModal}
                style={styles.addBtn}
              >
                <Plus size={15} color={COLORS.white} />
                <Text style={styles.addBtnText}>Thêm</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              {(
                [
                  { id: 'all', label: `Tất cả (${allRestaurants.length})` },
                  {
                    id: 'curated',
                    label: `Tinh tuyển (${allRestaurants.length - overtureCount})`,
                  },
                  { id: 'overture', label: `Overture Maps (${overtureCount})` },
                ] as const
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setRestaurantSourceFilter(opt.id)}
                  style={[
                    styles.filterChip,
                    restaurantSourceFilter === opt.id &&
                      styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      restaurantSourceFilter === opt.id &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.listGap}>
              {filteredRestaurants.slice(0, 50).map((item) => {
                const isOverture = item.restaurant.source === 'overture';
                return (
                  <View
                    key={`${item.siteId}-${item.restaurant.id}`}
                    style={styles.adminCard}
                  >
                    <View style={styles.cardBody}>
                      <View style={styles.cardMetaRow}>
                        <View
                          style={[
                            styles.sourcePill,
                            isOverture
                              ? styles.sourcePillOverture
                              : styles.sourcePillCurated,
                          ]}
                        >
                          <Text
                            style={[
                              styles.sourcePillText,
                              isOverture
                                ? styles.sourcePillTextOverture
                                : styles.sourcePillTextCurated,
                            ]}
                          >
                            {isOverture ? 'Overture' : 'Tinh tuyển'}
                          </Text>
                        </View>
                        <Text style={styles.cardMetaMuted} numberOfLines={1}>
                          {item.restaurant.cuisine}
                        </Text>
                      </View>

                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.restaurant.name}
                      </Text>

                      <View style={styles.restInfoLine}>
                        <Star
                          size={11}
                          color={COLORS.amberStar}
                          fill={COLORS.amberStar}
                        />
                        <Text style={styles.cardSubStrong}>
                          {item.restaurant.rating.toFixed(1)}
                        </Text>
                        <Text style={styles.metaDot}>·</Text>
                        <Text style={styles.cardSubMeta} numberOfLines={1}>
                          {item.restaurant.priceRange} · Gần {item.siteName}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardActionsCol}>
                      <TouchableOpacity
                        onPress={() => openEditRestaurantModal(item)}
                        style={styles.iconActionBtn}
                        accessibilityLabel="Chỉnh sửa quán ăn"
                      >
                        <Edit3 size={15} color={COLORS.ink} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          setPendingDelete({
                            kind: 'restaurant',
                            siteId: item.siteId,
                            restaurantId: item.restaurant.id,
                            title: item.restaurant.name,
                          })
                        }
                        style={[styles.iconActionBtn, styles.iconActionDanger]}
                        accessibilityLabel="Xóa quán ăn"
                      >
                        <Trash2 size={15} color={COLORS.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {filteredRestaurants.length > 50 && (
                <Text style={styles.listFootnote}>
                  Đang hiển thị 50 / {filteredRestaurants.length} quán ăn. Nhập từ khóa để lọc nhanh hơn.
                </Text>
              )}
            </View>
          </View>
        )}

        {/* SUB-TAB 3: SYSTEM HEALTH & DIAGNOSTICS */}
        {activeSubTab === 'system' && (
          <View style={styles.section}>
            <View style={styles.sysCard}>
              <View style={styles.sysHeaderRow}>
                <View style={styles.sysTitleRow}>
                  <Database size={16} color={COLORS.ink} />
                  <Text style={styles.sysTitle}>Trạng thái Backend & Database</Text>
                </View>
                <TouchableOpacity
                  onPress={loadHealth}
                  style={styles.refreshBtn}
                  activeOpacity={0.8}
                >
                  {isCheckingHealth ? (
                    <ActivityIndicator size="small" color={COLORS.ink} />
                  ) : (
                    <RefreshCw size={13} color={COLORS.ink} />
                  )}
                  <Text style={styles.refreshBtnText}>Kiểm tra</Text>
                </TouchableOpacity>
              </View>

              {health ? (
                <View style={styles.sysRows}>
                  <View style={styles.sysRow}>
                    <Text style={styles.sysKey}>API Endpoint</Text>
                    <Text style={styles.sysVal}>{getAdminApiEndpointLabel()}</Text>
                  </View>
                  <View style={styles.sysRow}>
                    <Text style={styles.sysKey}>Database</Text>
                    <Text style={styles.sysVal}>
                      {health.database.connected ? 'Đã kết nối' : 'Lỗi'} ·{' '}
                      {health.database.dialect.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.sysRow}>
                    <Text style={styles.sysKey}>PostGIS / pgvector</Text>
                    <Text style={styles.sysVal}>
                      {health.database.postgis_enabled ? 'PostGIS ✓' : 'PostGIS –'} ·{' '}
                      {health.database.pgvector_enabled ? 'pgvector ✓' : 'pgvector –'}
                    </Text>
                  </View>
                  <View style={styles.sysRow}>
                    <Text style={styles.sysKey}>Gemini AI (RAG & Vision)</Text>
                    <Text style={styles.sysVal}>
                      {health.ai.gemini_configured
                        ? health.ai.chat_model
                        : 'Chế độ Smart Fallback'}
                    </Text>
                  </View>
                  <View style={styles.sysRow}>
                    <Text style={styles.sysKey}>OSRM Walking Routing</Text>
                    <Text style={styles.sysVal} numberOfLines={1}>
                      {health.routing.osrm_base_url}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.offlineBox}>
                  <WifiOff size={18} color={COLORS.inkMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offlineTitle}>
                      Backend FastAPI chưa kết nối ({getAdminApiEndpointLabel()})
                    </Text>
                    <Text style={styles.offlineDesc}>
                      Bạn vẫn có thể thêm/sửa/xóa Di tích & Quán ăn ngay trên giao diện (chế độ Local Demo). Khi bật `uvicorn app.main:app`, mọi thao tác Admin sẽ tự động lưu DB & re-index RAG!
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.sysCard}>
              <View style={styles.sysTitleRow}>
                <Sparkles size={16} color={COLORS.accent} />
                <Text style={styles.sysTitle}>Dữ liệu Bản đồ & Phân quyền</Text>
              </View>
              <View style={styles.sysRows}>
                <View style={styles.sysRow}>
                  <Text style={styles.sysKey}>Quản trị viên hiện tại</Text>
                  <Text style={styles.sysVal}>
                    {authState.profile?.display_name || 'Admin Demo'}
                  </Text>
                </View>
                <View style={styles.sysRow}>
                  <Text style={styles.sysKey}>Overture Maps Release</Text>
                  <Text style={styles.sysVal}>{OVERTURE_PLACES_RELEASE}</Text>
                </View>
                <View style={styles.sysRow}>
                  <Text style={styles.sysKey}>Tự động Re-index RAG</Text>
                  <Text style={styles.sysVal}>Kích hoạt khi CRUD di tích/quán</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onOpenAuthModal}
                style={styles.accountManageBtn}
                activeOpacity={0.8}
              >
                <ShieldCheck size={15} color={COLORS.ink} />
                <Text style={styles.accountManageBtnText}>
                  Quản lý phiên đăng nhập Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* SITE CREATE / EDIT MODAL */}
      <Modal
        visible={siteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSiteModalVisible(false)}
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
                onPress={() => setSiteModalVisible(false)}
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

              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>Tọa độ GPS (Lat / Lng)</Text>
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
                    <Text style={styles.gpsFillBtnText}>Lấy GPS hiện tại</Text>
                  </TouchableOpacity>
                </View>
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
                <Text style={styles.fieldLabel}>Tóm tắt lịch sử (dùng cho RAG AI)</Text>
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
                <Text style={styles.fieldLabel}>URL Ảnh bìa</Text>
                <TextInput
                  value={siteForm.coverImage}
                  onChangeText={(txt) =>
                    setSiteForm((prev) => ({ ...prev, coverImage: txt }))
                  }
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor={COLORS.inkMuted}
                  autoCapitalize="none"
                  style={styles.input}
                />
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
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setSiteModalVisible(false)}
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
        visible={restModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRestModalVisible(false)}
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
                onPress={() => setRestModalVisible(false)}
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {sites.map((s) => (
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
                        {s.translations.vi.name.slice(0, 26)}
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
                onPress={() => setRestModalVisible(false)}
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
                  {editingRestaurant ? 'Lưu thay đổi' : 'Thêm quán ăn'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        visible={Boolean(pendingDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDelete(null)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Xác nhận xóa?</Text>
            <Text style={styles.confirmDesc}>
              Bạn chắc chắn muốn xóa “{pendingDelete?.title}”? Thao tác này sẽ
              cập nhật ngay bản đồ và chỉ mục AI.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                onPress={() => setPendingDelete(null)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                disabled={isSaving}
                style={styles.deleteConfirmBtn}
              >
                <Trash2 size={14} color={COLORS.white} />
                <Text style={styles.saveBtnText}>Xóa ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md + 2,
    paddingBottom: SPACING.xxl + 20,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  pageHeaderText: {
    flex: 1,
    gap: 2,
  },
  adminEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.accent,
  },
  pageTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  statusBadgeOnline: {
    backgroundColor: COLORS.visitedBg,
    borderColor: COLORS.visitedBorder,
  },
  statusBadgeLocal: {
    backgroundColor: COLORS.amberBg,
    borderColor: COLORS.amberBorder,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  kpiStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    paddingVertical: 12,
    ...SHADOWS.card,
  },
  kpiCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  kpiCellBorder: {
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  kpiValue: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  kpiLabel: {
    fontSize: 10.5,
    color: COLORS.inkMuted,
    fontWeight: '500',
  },
  subTabsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.lg,
    padding: 3,
    gap: 3,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: RADII.md,
  },
  subTabBtnActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  subTabTextActive: {
    color: COLORS.ink,
    fontWeight: '700',
  },
  section: {
    gap: SPACING.md,
  },
  actionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.ink,
    paddingVertical: 0,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.ink,
    borderRadius: RADII.lg,
    paddingHorizontal: 14,
    height: 42,
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterChipActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  listGap: {
    gap: SPACING.sm + 2,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  siteThumb: {
    width: 56,
    height: 56,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardMetaTag: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: COLORS.accent,
  },
  metaDot: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  cardMetaMuted: {
    fontSize: 11,
    color: COLORS.inkMuted,
    flexShrink: 1,
  },
  cardTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 20,
  },
  cardSubMeta: {
    fontSize: 11.5,
    color: COLORS.inkSecondary,
    flexShrink: 1,
  },
  cardSubStrong: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  restInfoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardActionsCol: {
    flexDirection: 'row',
    gap: 6,
  },
  iconActionBtn: {
    width: 34,
    height: 34,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionDanger: {
    backgroundColor: COLORS.accentSoft,
  },
  sourcePill: {
    borderRadius: RADII.pill,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderWidth: 1,
  },
  sourcePillCurated: {
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.border,
  },
  sourcePillOverture: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  sourcePillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  sourcePillTextCurated: {
    color: COLORS.ink,
  },
  sourcePillTextOverture: {
    color: '#C2410C',
  },
  listFootnote: {
    textAlign: 'center',
    fontSize: 11.5,
    color: COLORS.inkMuted,
    paddingVertical: SPACING.sm,
  },
  sysCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  sysHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  sysTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sysTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  refreshBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.ink,
  },
  sysRows: {
    gap: 10,
  },
  sysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sysKey: {
    fontSize: 12.5,
    color: COLORS.inkSecondary,
  },
  sysVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  offlineBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.bg,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  offlineTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  offlineDesc: {
    fontSize: 12,
    color: COLORS.inkSecondary,
    lineHeight: 17,
    marginTop: 3,
  },
  accountManageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.md,
    paddingVertical: 11,
  },
  accountManageBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
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
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.ink,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  gpsFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gpsFillBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.gpsBlue,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: COLORS.ink,
  },
  inputDisabled: {
    backgroundColor: COLORS.surfaceMuted,
    color: COLORS.inkMuted,
  },
  textArea: {
    minHeight: 78,
    textAlignVertical: 'top',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  saveBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADII.md,
    backgroundColor: COLORS.ink,
  },
  deleteConfirmBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADII.md,
    backgroundColor: COLORS.accent,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 19, 0.5)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  confirmCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.floating,
  },
  confirmTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.ink,
  },
  confirmDesc: {
    fontSize: 13,
    color: COLORS.inkSecondary,
    lineHeight: 19,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
});

export default AdminDashboardView;
