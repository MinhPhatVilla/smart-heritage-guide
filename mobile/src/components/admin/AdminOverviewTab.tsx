import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Database,
  Globe2,
  Image as ImageIcon,
  Landmark,
  MapPin,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Utensils,
} from 'lucide-react-native';
import { BackendHealthStatus } from '../../services/adminService';
import { OVERTURE_PLACES_RELEASE } from '../../data/overtureRestaurants';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../../theme';
import {
  AdminActivityItem,
  AdminQualitySummary,
  AdminRegionFilter,
  AdminTabId,
} from './adminTypes';

export interface AdminOverviewTabProps {
  summary: AdminQualitySummary;
  health: BackendHealthStatus | null;
  healthLatencyMs: number | null;
  isCheckingHealth: boolean;
  recentActivities: AdminActivityItem[];
  onRefreshHealth: () => void;
  onCreateSite: () => void;
  onCreateRestaurant: () => void;
  onNavigateTab: (tab: AdminTabId, regionFilter?: AdminRegionFilter) => void;
}

const REGION_ROWS: Array<{
  key: Exclude<AdminRegionFilter, 'all'>;
  label: string;
  accent: string;
}> = [
  { key: 'hcm_core', label: 'Nội thành TP.HCM · Củ Chi · Cần Giờ', accent: '#141413' },
  { key: 'vung_tau', label: 'Bà Rịa – Vũng Tàu & Biển đảo', accent: '#B93815' },
  { key: 'binh_duong', label: 'Khu vực Bình Dương', accent: '#047857' },
  { key: 'con_dao', label: 'Đặc khu Côn Đảo', accent: '#2563EB' },
];

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  summary,
  health,
  healthLatencyMs,
  isCheckingHealth,
  recentActivities,
  onRefreshHealth,
  onCreateSite,
  onCreateRestaurant,
  onNavigateTab,
}) => {
  const isOnline = health?.status === 'ok';
  const photoPct =
    summary.totalSites > 0
      ? Math.round((summary.wikimediaCovers / summary.totalSites) * 100)
      : 0;
  const langPct =
    summary.totalSites > 0
      ? Math.round((summary.fullFiveLangSites / summary.totalSites) * 100)
      : 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Executive Command Summary Card (Dark Obsidian Accent — distinct from Tourist UI) */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <Sparkles size={11} color="#F59E0B" />
            <Text style={styles.heroBadgeText}>TRUNG TÂM ĐIỀU HÀNH DỮ LIỆU</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onRefreshHealth}
            style={styles.heroPingBtn}
          >
            <RefreshCw size={12} color="#E6E4DD" />
            <Text style={styles.heroPingText}>
              {isCheckingHealth
                ? 'Đang đo…'
                : isOnline
                  ? `Cloud ${healthLatencyMs ?? '--'}ms`
                  : 'Local Demo'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTitle}>
          TP. Hồ Chí Minh Mở Rộng · {summary.totalSites} Di sản
        </Text>
        <Text style={styles.heroSubtitle}>
          Quản trị trực tiếp di tích, ẩm thực Overture ({OVERTURE_PLACES_RELEASE}), kiểm định tọa độ 3D và chỉ mục AI RAG.
        </Text>

        {/* 4-Column Quick Action Row */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onCreateSite}
            style={styles.quickActionPrimary}
          >
            <Plus size={15} color={COLORS.white} />
            <Text style={styles.quickActionPrimaryText}>Thêm di tích</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onCreateRestaurant}
            style={styles.quickActionSecondary}
          >
            <Utensils size={14} color="#FAF9F6" />
            <Text style={styles.quickActionSecondaryText}>Thêm quán ăn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onNavigateTab('audit_map')}
            style={styles.quickActionSecondary}
          >
            <MapPin size={14} color="#F59E0B" />
            <Text style={styles.quickActionSecondaryText}>Soi Bản đồ QC</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2x2 KPI Bento Grid */}
      <View style={styles.kpiGrid}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onNavigateTab('sites', 'all')}
          style={styles.kpiCard}
        >
          <View style={styles.kpiIconBox}>
            <Landmark size={16} color={COLORS.accent} />
          </View>
          <Text style={styles.kpiNum}>{summary.totalSites}</Text>
          <Text style={styles.kpiLbl}>Tổng địa điểm</Text>
          <Text style={styles.kpiHint}>
            {summary.nationalSpecialCount} QG Đặc biệt · {summary.unescoCount} UNESCO
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onNavigateTab('dining')}
          style={styles.kpiCard}
        >
          <View style={[styles.kpiIconBox, styles.kpiIconAmber]}>
            <Utensils size={16} color={COLORS.amber} />
          </View>
          <Text style={styles.kpiNum}>{summary.totalRestaurants}</Text>
          <Text style={styles.kpiLbl}>Điểm ẩm thực</Text>
          <Text style={styles.kpiHint}>
            {summary.curatedRestaurants} tinh tuyển · {summary.overtureRestaurants} Overture
          </Text>
        </TouchableOpacity>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, styles.kpiIconGreen]}>
            <ImageIcon size={16} color={COLORS.visited} />
          </View>
          <Text style={styles.kpiNum}>{photoPct}%</Text>
          <Text style={styles.kpiLbl}>Ảnh thực tế</Text>
          <Text style={styles.kpiHint}>
            {summary.wikimediaCovers}/{summary.totalSites} Wikimedia · {summary.multiPhotoSites} bộ ảnh
          </Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconBox, styles.kpiIconBlue]}>
            <Globe2 size={16} color={COLORS.gpsBlue} />
          </View>
          <Text style={styles.kpiNum}>{langPct}%</Text>
          <Text style={styles.kpiLbl}>Đủ 5 ngôn ngữ</Text>
          <Text style={styles.kpiHint}>
            VI · EN · FR · ZH · JA Audio Guide
          </Text>
        </View>
      </View>

      {/* Regional Distribution Panel (1-tap drill-down into Sites tab) */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Phân bổ theo 4 vùng hành chính</Text>
          <Text style={styles.panelMeta}>Chạm để lọc nhanh</Text>
        </View>

        <View style={styles.regionList}>
          {REGION_ROWS.map((row) => {
            const count = summary.regionCounts[row.key] || 0;
            const pct =
              summary.totalSites > 0
                ? Math.max(4, Math.round((count / summary.totalSites) * 100))
                : 0;
            return (
              <TouchableOpacity
                key={row.key}
                activeOpacity={0.8}
                onPress={() => onNavigateTab('sites', row.key)}
                style={styles.regionItem}
              >
                <View style={styles.regionTop}>
                  <Text style={styles.regionLabel} numberOfLines={1}>
                    {row.label}
                  </Text>
                  <View style={styles.regionCountWrap}>
                    <Text style={styles.regionCount}>{count} điểm</Text>
                    <ChevronRight size={14} color={COLORS.inkMuted} />
                  </View>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${pct}%`, backgroundColor: row.accent },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Data Quality & Health Audit */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View style={styles.panelTitleRow}>
            <Activity size={15} color={COLORS.accent} />
            <Text style={styles.panelTitle}>Kiểm định chất lượng dữ liệu</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigateTab('system')}>
            <Text style={styles.panelLink}>Hệ thống →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.qaList}>
          <View style={styles.qaRow}>
            <CheckCircle2 size={15} color={COLORS.visited} />
            <Text style={styles.qaText}>
              {summary.wikimediaCovers}/{summary.totalSites} điểm dùng CDN Wikimedia CORS hợp lệ cho WebGL 3D.
            </Text>
          </View>
          <View style={styles.qaRow}>
            {summary.sitesWithoutDining === 0 ? (
              <CheckCircle2 size={15} color={COLORS.visited} />
            ) : (
              <ShieldAlert size={15} color={COLORS.amber} />
            )}
            <Text style={styles.qaText}>
              {summary.sitesWithoutDining === 0
                ? '100% địa điểm đã có quán ăn đặc sản / Overture lân cận.'
                : `${summary.sitesWithoutDining} địa điểm chưa có quán ăn gắn kèm.`}
            </Text>
          </View>
          <View style={styles.qaRow}>
            <Database size={15} color={isOnline ? COLORS.visited : COLORS.amber} />
            <Text style={styles.qaText}>
              {isOnline
                ? `Backend FastAPI trực tuyến (${health?.database.dialect.toUpperCase()} · ${health?.ai.chat_model}).`
                : 'Đang chạy ở chế độ Local Demo — thay đổi hiển thị tức thì trên bản đồ.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Admin Session Activity */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Nhật ký thao tác phiên Admin</Text>
          <Text style={styles.panelMeta}>{recentActivities.length} mục</Text>
        </View>
        {recentActivities.length === 0 ? (
          <Text style={styles.emptyActivityText}>
            Chưa có thao tác chỉnh sửa nào trong phiên này. Mọi thay đổi thêm/sửa/xóa sẽ được ghi nhận tại đây.
          </Text>
        ) : (
          <View style={styles.activityList}>
            {recentActivities.slice(0, 6).map((act) => (
              <View key={act.id} style={styles.activityRow}>
                <View
                  style={[
                    styles.activityDot,
                    {
                      backgroundColor:
                        act.action === 'delete'
                          ? COLORS.accent
                          : act.action === 'create'
                            ? COLORS.visitedDot
                            : COLORS.gpsBlue,
                    },
                  ]}
                />
                <View style={styles.activityBody}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {act.title}
                  </Text>
                  <Text style={styles.activityMeta}>
                    {act.timestamp} · {act.syncedCloud ? 'Đã đồng bộ Cloud' : 'Local Demo'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.md + 2,
    paddingBottom: SPACING.xxl + 12,
  },
  heroCard: {
    backgroundColor: '#1B1B19',
    borderRadius: RADII.xl,
    padding: SPACING.lg,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2E2D2A',
    ...SHADOWS.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  heroBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#FCD34D',
  },
  heroPingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroPingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E6E4DD',
  },
  heroTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '700',
    color: '#FAF9F6',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#B5B2A8',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  quickActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: RADII.md,
  },
  quickActionPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  quickActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADII.md,
  },
  quickActionSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FAF9F6',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm + 2,
  },
  kpiCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 4,
    ...SHADOWS.card,
  },
  kpiIconBox: {
    width: 30,
    height: 30,
    borderRadius: RADII.md,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiIconAmber: {
    backgroundColor: COLORS.amberBg,
  },
  kpiIconGreen: {
    backgroundColor: COLORS.visitedBg,
  },
  kpiIconBlue: {
    backgroundColor: COLORS.gpsBlueSoft,
  },
  kpiNum: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  kpiLbl: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  kpiHint: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  panel: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  panelTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
  },
  panelMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  panelLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  regionList: {
    gap: 12,
  },
  regionItem: {
    gap: 6,
  },
  regionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  regionLabel: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.ink,
  },
  regionCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  regionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 7,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: RADII.pill,
  },
  qaList: {
    gap: 10,
  },
  qaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  qaText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.inkSecondary,
  },
  emptyActivityText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.inkMuted,
  },
  activityList: {
    gap: 10,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityBody: {
    flex: 1,
    gap: 1,
  },
  activityTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.ink,
  },
  activityMeta: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
});

export default AdminOverviewTab;
