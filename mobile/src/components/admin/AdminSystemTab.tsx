import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Database,
  Eye,
  LogOut,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from 'lucide-react-native';
import { AuthSessionState } from '../../services/authService';
import {
  BackendHealthStatus,
  getAdminApiEndpointLabel,
} from '../../services/adminService';
import { OVERTURE_PLACES_RELEASE } from '../../data/overtureRestaurants';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../../theme';
import { AdminQualitySummary } from './adminTypes';

export interface AdminSystemTabProps {
  authState: AuthSessionState;
  summary: AdminQualitySummary;
  health: BackendHealthStatus | null;
  healthLatencyMs: number | null;
  isCheckingHealth: boolean;
  onRefreshHealth: () => void;
  onOpenAuthModal: () => void;
  onLogout?: () => void;
  onEnterUserPreview?: () => void;
}

export const AdminSystemTab: React.FC<AdminSystemTabProps> = ({
  authState,
  summary,
  health,
  healthLatencyMs,
  isCheckingHealth,
  onRefreshHealth,
  onOpenAuthModal,
  onLogout,
  onEnterUserPreview,
}) => {
  const isOnline = Boolean(health?.status === 'ok');

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Card 1: Backend Health & Infrastructure */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Server size={16} color={COLORS.ink} />
            <Text style={styles.cardTitle}>Trạng thái Backend & AI</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onRefreshHealth}
            disabled={isCheckingHealth}
            style={styles.refreshBtn}
          >
            {isCheckingHealth ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <RefreshCw size={13} color={COLORS.accent} />
            )}
            <Text style={styles.refreshText}>Kiểm tra</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.statusBanner,
            isOnline ? styles.statusBannerOnline : styles.statusBannerOffline,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isOnline ? styles.statusDotOnline : styles.statusDotOffline,
            ]}
          />
          <Text
            style={[
              styles.statusBannerText,
              isOnline
                ? styles.statusBannerTextOnline
                : styles.statusBannerTextOffline,
            ]}
          >
            {isOnline
              ? `Cloud Online${healthLatencyMs !== null ? ` · ${healthLatencyMs}ms` : ''} · ${health?.environment || 'production'}`
              : `Local Demo Mode · Chưa kết nối ${getAdminApiEndpointLabel()}`}
          </Text>
        </View>

        {health ? (
          <View style={styles.rows}>
            <View style={styles.row}>
              <Text style={styles.rowKey}>API Endpoint</Text>
              <Text style={styles.rowVal} numberOfLines={1}>
                {getAdminApiEndpointLabel()}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowKey}>Cơ sở dữ liệu</Text>
              <Text style={styles.rowVal}>
                {health.database.dialect.toUpperCase()} ·{' '}
                {health.database.connected ? 'Connected' : 'Error'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowKey}>Extensions</Text>
              <Text style={styles.rowVal}>
                {health.database.postgis_enabled ? 'PostGIS ✓' : 'PostGIS –'} ·{' '}
                {health.database.pgvector_enabled ? 'pgvector ✓' : 'pgvector –'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowKey}>Gemini AI (RAG & Vision)</Text>
              <Text style={styles.rowVal}>
                {health.ai.gemini_configured
                  ? health.ai.chat_model
                  : 'Smart Fallback'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowKey}>Supabase Auth / Storage</Text>
              <Text style={styles.rowVal}>
                {health.auth.supabase_configured ? 'Auth ✓' : 'Local JWT'} ·{' '}
                {health.auth.storage_configured ? 'Storage ✓' : 'Local'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowKey}>OSRM Walking Routing</Text>
              <Text style={styles.rowVal} numberOfLines={1}>
                {health.routing.osrm_base_url}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.offlineBox}>
            <WifiOff size={18} color={COLORS.inkMuted} />
            <View style={styles.offlineBody}>
              <Text style={styles.offlineTitle}>
                Đang chạy chế độ Local Demo (Offline-First)
              </Text>
              <Text style={styles.offlineDesc}>
                Mọi thao tác Thêm / Sửa / Xóa Di tích & Quán ăn vẫn cập nhật tức
                thì trên ứng dụng. Khi khởi chạy FastAPI (`uvicorn app.main:app`),
                Admin Studio sẽ tự đồng bộ PostgreSQL & re-index RAG.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Card 2: Dataset & Coverage Diagnostics */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Database size={16} color={COLORS.accent} />
          <Text style={styles.cardTitle}>Chỉ số Dữ liệu Di sản & Bản đồ</Text>
        </View>
        <View style={styles.rows}>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Tổng di tích / điểm du lịch</Text>
            <Text style={styles.rowVal}>{summary.totalSites} điểm</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Ẩm thực (Tinh tuyển / Overture)</Text>
            <Text style={styles.rowVal}>
              {summary.curatedRestaurants} / {summary.overtureRestaurants} quán
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Overture Maps Release</Text>
            <Text style={styles.rowVal}>{OVERTURE_PLACES_RELEASE}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Ảnh Wikimedia Commons CDN</Text>
            <Text style={styles.rowVal}>
              {summary.wikimediaCovers}/{summary.totalSites} điểm
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Thuyết minh đủ 5 ngôn ngữ</Text>
            <Text style={styles.rowVal}>
              {summary.fullFiveLangSites}/{summary.totalSites} điểm
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Tự động Re-index RAG</Text>
            <Text style={styles.rowVal}>Kích hoạt khi CRUD</Text>
          </View>
        </View>
      </View>

      {/* Card 3: Admin Session & Mode Switcher */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Sparkles size={16} color={COLORS.ink} />
          <Text style={styles.cardTitle}>Phiên Quản trị & Chế độ hiển thị</Text>
        </View>
        <View style={styles.rows}>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Quản trị viên</Text>
            <Text style={styles.rowVal}>
              {authState.profile?.display_name || 'Admin Demo'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Email tài khoản</Text>
            <Text style={styles.rowVal} numberOfLines={1}>
              {authState.profile?.email || 'admin@smartheritage.vn'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowKey}>Quyền hạn (RBAC)</Text>
            <Text style={styles.rowValAccent}>
              {(authState.profile?.role || 'admin').toUpperCase()} · Toàn quyền
            </Text>
          </View>
        </View>

        <View style={styles.actionStack}>
          {onEnterUserPreview && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onEnterUserPreview}
              style={styles.previewUserBtn}
            >
              <Eye size={15} color={COLORS.white} />
              <Text style={styles.previewUserBtnText}>
                Xem ứng dụng như Du khách
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={onOpenAuthModal}
            style={styles.secondaryBtn}
          >
            <ShieldCheck size={15} color={COLORS.ink} />
            <Text style={styles.secondaryBtnText}>
              Quản lý tài khoản & Đồng bộ Cloud
            </Text>
          </TouchableOpacity>

          {onLogout && (
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={onLogout}
              style={styles.logoutBtn}
            >
              <LogOut size={15} color="#B91C1C" />
              <Text style={styles.logoutBtnText}>Đăng xuất phiên Admin</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.lg,
    gap: 14,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  refreshText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.accent,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: RADII.md,
  },
  statusBannerOnline: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBannerOffline: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: RADII.pill,
  },
  statusDotOnline: {
    backgroundColor: '#10B981',
  },
  statusDotOffline: {
    backgroundColor: '#F59E0B',
  },
  statusBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  statusBannerTextOnline: {
    color: '#065F46',
  },
  statusBannerTextOffline: {
    color: '#92400E',
  },
  rows: {
    gap: 9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceMuted,
  },
  rowKey: {
    fontSize: 12.5,
    color: COLORS.inkSecondary,
    flexShrink: 0,
  },
  rowVal: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.ink,
    flexShrink: 1,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  rowValAccent: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  offlineBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.surfaceMuted,
  },
  offlineBody: {
    flex: 1,
    gap: 4,
  },
  offlineTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  offlineDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.inkSecondary,
  },
  actionStack: {
    gap: 8,
    marginTop: 2,
  },
  previewUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 42,
    borderRadius: RADII.md,
    backgroundColor: '#141413',
  },
  previewUserBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 40,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.ink,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 40,
    borderRadius: RADII.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#B91C1C',
  },
});

export default AdminSystemTab;
