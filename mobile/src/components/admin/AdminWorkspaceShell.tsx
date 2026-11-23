import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Eye,
  Landmark,
  LayoutDashboard,
  MapPin,
  Server,
  ShieldCheck,
  Utensils,
} from 'lucide-react-native';
import { HeritageSite, NearbyRestaurant } from '../../types/heritage';
import { AuthSessionState } from '../../services/authService';
import {
  BackendHealthStatus,
  fetchBackendHealth,
} from '../../services/adminService';
import { COLORS, RADII, SERIF_FONT, SPACING } from '../../theme';
import {
  AdminActivityItem,
  AdminRegionFilter,
  AdminTabId,
  FlattenedRestaurant,
  computeAdminQualitySummary,
} from './adminTypes';
import type { PendingAdminDelete } from './AdminEditorModals';

// Code-split từng màn hình & bộ modal Admin — chỉ tải chunk khi Admin mở tới!
const LazyAdminOverviewTab = React.lazy(() => import('./AdminOverviewTab'));
const LazyAdminSitesTab = React.lazy(() => import('./AdminSitesTab'));
const LazyAdminDiningTab = React.lazy(() => import('./AdminDiningTab'));
const LazyAdminAuditMapTab = React.lazy(() => import('./AdminAuditMapTab'));
const LazyAdminSystemTab = React.lazy(() => import('./AdminSystemTab'));
const LazyAdminEditorModals = React.lazy(() => import('./AdminEditorModals'));

export interface AdminWorkspaceShellProps {
  sites: HeritageSite[];
  userLocation: [number, number];
  authState: AuthSessionState;
  onUpsertSite: (site: HeritageSite) => void;
  onDeleteSite: (siteId: string) => void;
  onUpsertRestaurant: (siteId: string, restaurant: NearbyRestaurant) => void;
  onDeleteRestaurant: (siteId: string, restaurantId: string) => void;
  onOpenAuthModal: () => void;
  onLogout?: () => void;
  onEnterUserPreview?: () => void;
  onNotify: (message: string) => void;
}

const TAB_TITLES: Record<AdminTabId, string> = {
  overview: 'Trung tâm Điều hành',
  sites: 'Danh mục Di tích & Điểm đến',
  dining: 'Quản lý Ẩm thực lân cận',
  audit_map: 'Bản đồ Kiểm định Tọa độ (QC)',
  system: 'Hệ thống & Phân quyền',
};

const TabLoadingFallback: React.FC<{ label?: string }> = ({ label }) => (
  <View style={styles.fallbackBox}>
    <ActivityIndicator size="small" color={COLORS.accent} />
    <Text style={styles.fallbackText}>{label || 'Đang tải phân hệ...'}</Text>
  </View>
);

export const AdminWorkspaceShell: React.FC<AdminWorkspaceShellProps> = ({
  sites,
  userLocation,
  authState,
  onUpsertSite,
  onDeleteSite,
  onUpsertRestaurant,
  onDeleteRestaurant,
  onOpenAuthModal,
  onLogout,
  onEnterUserPreview,
  onNotify,
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [sitesRegionFilter, setSitesRegionFilter] =
    useState<AdminRegionFilter>('all');
  const [isAuditMapMounted, setIsAuditMapMounted] = useState<boolean>(false);
  const [focusedMapSite, setFocusedMapSite] = useState<HeritageSite | null>(
    null
  );

  // Health telemetry
  const [health, setHealth] = useState<BackendHealthStatus | null>(null);
  const [healthLatencyMs, setHealthLatencyMs] = useState<number | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const [recentActivities, setRecentActivities] = useState<AdminActivityItem[]>(
    []
  );

  // Lazy-mounted CRUD Modals state
  const [siteModalOpen, setSiteModalOpen] = useState<boolean>(false);
  const [editingSite, setEditingSite] = useState<HeritageSite | null>(null);
  const [restModalOpen, setRestModalOpen] = useState<boolean>(false);
  const [editingRestaurant, setEditingRestaurant] =
    useState<FlattenedRestaurant | null>(null);
  const [presetRestaurantSiteId, setPresetRestaurantSiteId] = useState<
    string | null
  >(null);
  const [pendingDelete, setPendingDelete] = useState<PendingAdminDelete | null>(
    null
  );

  // 1 vòng lặp O(N) duy nhất cho KPI, Chất lượng & Badge Taskbar
  const summary = useMemo(() => computeAdminQualitySummary(sites), [sites]);

  const recordActivity = useCallback(
    (item: Omit<AdminActivityItem, 'id' | 'timestamp'>) => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setRecentActivities((prev) =>
        [
          {
            ...item,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: `${hh}:${mm}:${ss}`,
          },
          ...prev,
        ].slice(0, 12)
      );
    },
    []
  );

  const loadHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    const t0 = Date.now();
    const res = await fetchBackendHealth();
    const elapsed = Date.now() - t0;
    setIsCheckingHealth(false);
    if (res.ok) {
      setHealth(res.data);
      setHealthLatencyMs(elapsed);
    } else {
      setHealth(null);
      setHealthLatencyMs(null);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  // Chỉ khởi tạo Bản đồ QC khi Admin thực sự chuyển vào tab Bản đồ QC
  useEffect(() => {
    if (activeTab === 'audit_map' && !isAuditMapMounted) {
      setIsAuditMapMounted(true);
    }
  }, [activeTab, isAuditMapMounted]);

  const handleNavigateTab = useCallback(
    (tab: AdminTabId, regionFilter?: AdminRegionFilter) => {
      if (tab === 'sites' && regionFilter) {
        setSitesRegionFilter(regionFilter);
      }
      setActiveTab(tab);
    },
    []
  );

  const handleOpenCreateSite = useCallback(() => {
    setEditingSite(null);
    setSiteModalOpen(true);
  }, []);

  const handleOpenEditSite = useCallback((site: HeritageSite) => {
    setEditingSite(site);
    setSiteModalOpen(true);
  }, []);

  const handleRequestDeleteSite = useCallback((site: HeritageSite) => {
    setPendingDelete({
      kind: 'site',
      siteId: site.id,
      title: site.translations.vi.name,
    });
  }, []);

  const handleInspectSiteOnMap = useCallback((site: HeritageSite) => {
    setFocusedMapSite(site);
    setIsAuditMapMounted(true);
    setActiveTab('audit_map');
  }, []);

  const handleOpenCreateRestaurant = useCallback((presetSiteId?: string) => {
    setEditingRestaurant(null);
    setPresetRestaurantSiteId(presetSiteId || null);
    setRestModalOpen(true);
  }, []);

  const handleOpenEditRestaurant = useCallback((item: FlattenedRestaurant) => {
    setEditingRestaurant(item);
    setPresetRestaurantSiteId(null);
    setRestModalOpen(true);
  }, []);

  const handleRequestDeleteRestaurant = useCallback(
    (item: FlattenedRestaurant) => {
      setPendingDelete({
        kind: 'restaurant',
        siteId: item.siteId,
        restaurantId: item.restaurant.id,
        title: item.restaurant.name,
      });
    },
    []
  );

  const isBackendOnline = Boolean(health?.status === 'ok');
  const hasActiveModal = siteModalOpen || restModalOpen || Boolean(pendingDelete);
  const adminInitials = (authState.profile?.display_name || 'AD')
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.root}>
      {/* Dark Obsidian Admin Studio Header (khác biệt hoàn toàn giao diện Du khách) */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 8) + 6 },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View style={styles.brandCol}>
            <View style={styles.badgeRow}>
              <View style={styles.studioBadge}>
                <ShieldCheck size={11} color="#FDBA74" />
                <Text style={styles.studioBadgeText}>ADMIN STUDIO</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={loadHealth}
                style={[
                  styles.healthPill,
                  isBackendOnline
                    ? styles.healthPillOnline
                    : styles.healthPillOffline,
                ]}
              >
                <View
                  style={[
                    styles.healthDot,
                    isBackendOnline
                      ? styles.healthDotOnline
                      : styles.healthDotOffline,
                  ]}
                />
                <Text style={styles.healthPillText}>
                  {isCheckingHealth
                    ? 'Đang ping...'
                    : isBackendOnline
                      ? 'Cloud Online'
                      : 'Local Demo'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {TAB_TITLES[activeTab]}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {onEnterUserPreview && (
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={onEnterUserPreview}
                style={styles.previewBtn}
                accessibilityLabel="Xem ứng dụng như Du khách"
              >
                <Eye size={13} color="#F5F5F4" />
                <Text style={styles.previewBtnText}>Khách</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.82}
              onPress={onOpenAuthModal}
              style={styles.avatarBtn}
              accessibilityLabel="Tài khoản Quản trị viên"
            >
              <Text style={styles.avatarText}>{adminInitials}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Lazy-Loaded Tab Stage */}
      <View style={styles.stage}>
        {activeTab === 'overview' && (
          <Suspense
            fallback={<TabLoadingFallback label="Đang tải Tổng quan..." />}
          >
            <LazyAdminOverviewTab
              summary={summary}
              health={health}
              healthLatencyMs={healthLatencyMs}
              isCheckingHealth={isCheckingHealth}
              recentActivities={recentActivities}
              onRefreshHealth={loadHealth}
              onCreateSite={handleOpenCreateSite}
              onCreateRestaurant={() => handleOpenCreateRestaurant()}
              onNavigateTab={handleNavigateTab}
            />
          </Suspense>
        )}

        {activeTab === 'sites' && (
          <Suspense
            fallback={
              <TabLoadingFallback label="Đang tải danh sách Di tích..." />
            }
          >
            <LazyAdminSitesTab
              sites={sites}
              initialRegionFilter={sitesRegionFilter}
              onCreateSite={handleOpenCreateSite}
              onEditSite={handleOpenEditSite}
              onDeleteSite={handleRequestDeleteSite}
              onInspectOnMap={handleInspectSiteOnMap}
            />
          </Suspense>
        )}

        {activeTab === 'dining' && (
          <Suspense
            fallback={
              <TabLoadingFallback label="Đang tải danh sách Ẩm thực..." />
            }
          >
            <LazyAdminDiningTab
              sites={sites}
              onCreateRestaurant={() => handleOpenCreateRestaurant()}
              onEditRestaurant={handleOpenEditRestaurant}
              onDeleteRestaurant={handleRequestDeleteRestaurant}
            />
          </Suspense>
        )}

        {/* Keep-Alive Lazy Audit Map: chỉ tải chunk & WebGL khi Admin bấm tab Bản đồ QC */}
        {isAuditMapMounted && (
          <View
            pointerEvents={activeTab === 'audit_map' ? 'auto' : 'none'}
            style={[
              styles.auditMapLayer,
              activeTab !== 'audit_map' && styles.auditMapHidden,
            ]}
          >
            <Suspense
              fallback={
                <TabLoadingFallback label="Đang khởi tạo Bản đồ QC..." />
              }
            >
              <LazyAdminAuditMapTab
                sites={sites}
                userLocation={userLocation}
                isVisible={activeTab === 'audit_map'}
                focusedSite={focusedMapSite}
                onClearFocusedSite={() => setFocusedMapSite(null)}
                onEditSite={handleOpenEditSite}
                onCreateSite={handleOpenCreateSite}
                onCreateRestaurantForSite={(siteId) =>
                  handleOpenCreateRestaurant(siteId)
                }
              />
            </Suspense>
          </View>
        )}

        {activeTab === 'system' && (
          <Suspense
            fallback={
              <TabLoadingFallback label="Đang tải cấu hình Hệ thống..." />
            }
          >
            <LazyAdminSystemTab
              authState={authState}
              summary={summary}
              health={health}
              healthLatencyMs={healthLatencyMs}
              isCheckingHealth={isCheckingHealth}
              onRefreshHealth={loadHealth}
              onOpenAuthModal={onOpenAuthModal}
              onLogout={onLogout}
              onEnterUserPreview={onEnterUserPreview}
            />
          </Suspense>
        )}
      </View>

      {/* Dedicated 5-Tab Dark Admin Bottom Taskbar */}
      <View
        style={[
          styles.taskbar,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('overview')}
          style={styles.tabItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'overview' }}
        >
          {activeTab === 'overview' && <View style={styles.activeIndicator} />}
          <LayoutDashboard
            size={20}
            strokeWidth={activeTab === 'overview' ? 2.2 : 1.7}
            color={activeTab === 'overview' ? '#FDBA74' : '#A8A29E'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'overview' && styles.tabLabelActive,
            ]}
          >
            Tổng quan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('sites')}
          style={styles.tabItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'sites' }}
        >
          {activeTab === 'sites' && <View style={styles.activeIndicator} />}
          <View style={styles.iconBox}>
            <Landmark
              size={20}
              strokeWidth={activeTab === 'sites' ? 2.2 : 1.7}
              color={activeTab === 'sites' ? '#FDBA74' : '#A8A29E'}
            />
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{summary.totalSites}</Text>
            </View>
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'sites' && styles.tabLabelActive,
            ]}
          >
            Di tích
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('dining')}
          style={styles.tabItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'dining' }}
        >
          {activeTab === 'dining' && <View style={styles.activeIndicator} />}
          <View style={styles.iconBox}>
            <Utensils
              size={20}
              strokeWidth={activeTab === 'dining' ? 2.2 : 1.7}
              color={activeTab === 'dining' ? '#FDBA74' : '#A8A29E'}
            />
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {summary.totalRestaurants}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'dining' && styles.tabLabelActive,
            ]}
          >
            Ẩm thực
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('audit_map')}
          style={styles.tabItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'audit_map' }}
        >
          {activeTab === 'audit_map' && <View style={styles.activeIndicator} />}
          <MapPin
            size={20}
            strokeWidth={activeTab === 'audit_map' ? 2.2 : 1.7}
            color={activeTab === 'audit_map' ? '#FDBA74' : '#A8A29E'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'audit_map' && styles.tabLabelActive,
            ]}
          >
            Bản đồ QC
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('system')}
          style={styles.tabItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'system' }}
        >
          {activeTab === 'system' && <View style={styles.activeIndicator} />}
          <View style={styles.iconBox}>
            <Server
              size={20}
              strokeWidth={activeTab === 'system' ? 2.2 : 1.7}
              color={activeTab === 'system' ? '#FDBA74' : '#A8A29E'}
            />
            <View
              style={[
                styles.sysHealthDot,
                isBackendOnline
                  ? styles.healthDotOnline
                  : styles.healthDotOffline,
              ]}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'system' && styles.tabLabelActive,
            ]}
          >
            Hệ thống
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lazy-Mounted Admin CRUD Modals (không tốn bộ nhớ khi không mở form) */}
      {hasActiveModal && (
        <Suspense fallback={null}>
          <LazyAdminEditorModals
            siteModalOpen={siteModalOpen}
            editingSite={editingSite}
            restModalOpen={restModalOpen}
            editingRestaurant={editingRestaurant}
            presetRestaurantSiteId={presetRestaurantSiteId}
            pendingDelete={pendingDelete}
            sites={sites}
            userLocation={userLocation}
            onCloseSiteModal={() => setSiteModalOpen(false)}
            onCloseRestModal={() => setRestModalOpen(false)}
            onCloseDelete={() => setPendingDelete(null)}
            onUpsertSite={onUpsertSite}
            onDeleteSite={onDeleteSite}
            onUpsertRestaurant={onUpsertRestaurant}
            onDeleteRestaurant={onDeleteRestaurant}
            onNotify={onNotify}
            onRecordActivity={recordActivity}
          />
        </Suspense>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: '#141413',
    paddingHorizontal: SPACING.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  brandCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  studioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(185,56,21,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(253,186,116,0.28)',
  },
  studioBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FDBA74',
    letterSpacing: 0.7,
  },
  healthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  healthPillOnline: {
    backgroundColor: 'rgba(16,185,129,0.16)',
  },
  healthPillOffline: {
    backgroundColor: 'rgba(245,158,11,0.16)',
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: RADII.pill,
  },
  healthDotOnline: {
    backgroundColor: '#10B981',
  },
  healthDotOffline: {
    backgroundColor: '#F59E0B',
  },
  healthPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E7E5E4',
  },
  headerTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 11,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  previewBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#F5F5F4',
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  avatarText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.white,
  },
  stage: {
    flex: 1,
    position: 'relative',
  },
  auditMapLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 4,
  },
  auditMapHidden: {
    display: 'none',
  },
  fallbackBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.bg,
  },
  fallbackText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  taskbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141413',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
    paddingVertical: 2,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 2.5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
  },
  iconBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 18,
    height: 15,
    paddingHorizontal: 4,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#141413',
  },
  countBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.white,
    fontVariant: ['tabular-nums'],
  },
  sysHealthDot: {
    position: 'absolute',
    top: -1,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: RADII.pill,
    borderWidth: 1.2,
    borderColor: '#141413',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A8A29E',
  },
  tabLabelActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
});

export default AdminWorkspaceShell;
