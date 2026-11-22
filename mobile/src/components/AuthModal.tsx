import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import {
  CloudUpload,
  Footprints,
  LogIn,
  LogOut,
  MapPin,
  ShieldCheck,
  User,
  UserPlus,
  X,
} from 'lucide-react-native';
import { SupportedLanguage } from '../types/heritage';
import {
  AuthSessionState,
  UserProfile,
  loginAccount,
  registerAccount,
} from '../services/authService';
import { formatDistance, formatWalkingDuration } from '../utils/geoUtils';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export interface AuthModalProps {
  visible: boolean;
  authState: AuthSessionState;
  selectedLanguage: SupportedLanguage;
  localJourneysCount: number;
  isSyncing: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  onLogout: () => Promise<void>;
  onSyncOfflineJourneys: () => Promise<void>;
  onOpenAdminDashboard?: () => void;
}

type AuthTabMode = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  authState,
  selectedLanguage,
  localJourneysCount,
  isSyncing,
  onClose,
  onAuthSuccess,
  onLogout,
  onSyncOfflineJourneys,
  onOpenAdminDashboard,
}) => {
  const [mode, setMode] = useState<AuthTabMode>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMsg(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setErrorMsg('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    setIsSubmitting(true);
    const result =
      mode === 'login'
        ? await loginAccount(trimmedEmail, password)
        : await registerAccount({
            email: trimmedEmail,
            password,
            display_name: displayName.trim() || trimmedEmail.split('@')[0],
            preferred_language: selectedLanguage,
          });
    setIsSubmitting(false);

    if (result.ok) {
      setPassword('');
      onAuthSuccess(result.data.profile);
    } else {
      setErrorMsg(result.error);
    }
  };

  const handleQuickAdminDemoLogin = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    const result = await loginAccount(
      'admin@smartheritage.vn',
      'AdminHeritage@2026'
    );
    setIsSubmitting(false);

    if (result.ok) {
      onAuthSuccess(result.data.profile);
      return;
    }

    // Fallback chế độ Local Admin Preview khi Backend chưa bật, giúp test ngay UI Quản trị Mobile
    onAuthSuccess({
      id: 'local-admin-preview',
      email: 'admin@smartheritage.vn',
      display_name: 'Quản trị Di sản TP.HCM',
      avatar_url: null,
      role: 'admin',
      preferred_language: selectedLanguage,
      preferred_categories: ['monument', 'museum'],
      total_verified_walking_seconds: 0,
      total_verified_walking_meters: 0,
      verified_sites_count: 0,
      created_at: new Date().toISOString(),
    });
  };

  const handleLogoutPress = async () => {
    setIsSubmitting(true);
    await onLogout();
    setIsSubmitting(false);
    onClose();
  };

  const profile = authState.profile;
  const initials = (profile?.display_name || 'KH')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

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
            <View style={styles.headerTextCol}>
              <Text style={styles.eyebrow}>
                {authState.isAuthenticated
                  ? 'HỒ SƠ ĐỒNG BỘ CLOUD'
                  : 'TÀI KHOẢN TÙY CHỌN · OFFLINE-FIRST'}
              </Text>
              <Text style={styles.headerTitle}>
                {authState.isAuthenticated
                  ? 'Tài khoản của bạn'
                  : 'Đăng nhập & Đồng bộ'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Đóng tài khoản"
              activeOpacity={0.75}
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
            {authState.isAuthenticated && profile ? (
              <View style={styles.section}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials || 'SH'}</Text>
                  </View>
                  <View style={styles.profileMain}>
                    <View style={styles.nameRow}>
                      <Text style={styles.profileName} numberOfLines={1}>
                        {profile.display_name}
                      </Text>
                      <View style={styles.rolePill}>
                        <ShieldCheck size={11} color={COLORS.visited} />
                        <Text style={styles.rolePillText}>
                          {profile.role === 'admin' ? 'Admin' : 'Thành viên'}
                        </Text>
                      </View>
                    </View>
                    {profile.email ? (
                      <Text style={styles.profileEmail}>{profile.email}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Verified Cloud Stats */}
                <View style={styles.statsCard}>
                  <Text style={styles.statsTitle}>
                    Thành tích đã xác thực trên Cloud
                  </Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <MapPin size={15} color={COLORS.accent} />
                      <Text style={styles.statValue}>
                        {profile.verified_sites_count}
                      </Text>
                      <Text style={styles.statLabel}>Di tích xác thực</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Footprints size={15} color={COLORS.visited} />
                      <Text style={styles.statValue}>
                        {formatWalkingDuration(
                          profile.total_verified_walking_seconds
                        )}
                      </Text>
                      <Text style={styles.statLabel}>Thời gian đi bộ</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>
                        {formatDistance(profile.total_verified_walking_meters)}
                      </Text>
                      <Text style={styles.statLabel}>Quãng đường</Text>
                    </View>
                  </View>
                </View>

                {/* Cloud Sync CTA */}
                <View style={styles.syncCard}>
                  <Text style={styles.syncTitle}>
                    Đồng bộ hành trình Offline lên Cloud
                  </Text>
                  <Text style={styles.syncDesc}>
                    Đẩy {localJourneysCount} bản ghi hành trình trên máy lên máy
                    chủ để xác thực chống gian lận GPS, mở khóa Huy hiệu và tham
                    gia Bảng xếp hạng Cộng đồng.
                  </Text>
                  <TouchableOpacity
                    onPress={onSyncOfflineJourneys}
                    disabled={isSyncing}
                    style={[
                      styles.primaryBtn,
                      isSyncing && styles.btnDisabled,
                    ]}
                    activeOpacity={0.85}
                  >
                    {isSyncing ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <CloudUpload size={16} color={COLORS.white} />
                    )}
                    <Text style={styles.primaryBtnText}>
                      {isSyncing
                        ? 'Đang đồng bộ lên Cloud...'
                        : 'Đồng bộ hành trình lên Cloud'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Admin Console Shortcut when logged in as Admin */}
                {profile.role === 'admin' && onOpenAdminDashboard && (
                  <TouchableOpacity
                    onPress={onOpenAdminDashboard}
                    style={styles.adminShortcutBtn}
                    activeOpacity={0.85}
                  >
                    <ShieldCheck size={16} color={COLORS.white} />
                    <Text style={styles.primaryBtnText}>
                      Mở bảng Quản trị Admin
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Logout Button */}
                <TouchableOpacity
                  onPress={handleLogoutPress}
                  disabled={isSubmitting}
                  style={styles.logoutBtn}
                  activeOpacity={0.8}
                >
                  <LogOut size={16} color={COLORS.accent} />
                  <Text style={styles.logoutBtnText}>
                    Đăng xuất (Chuyển về chế độ Khách)
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.section}>
                {/* Guest Info Banner */}
                <View style={styles.guestBanner}>
                  <User size={16} color={COLORS.ink} />
                  <Text style={styles.guestBannerText}>
                    Bạn đang dùng chế độ Khách. Đăng nhập là tùy chọn để đồng bộ
                    hành trình lên Cloud, nhận Huy hiệu và đua top Cộng đồng.
                  </Text>
                </View>

                {/* Login / Register Segmented Control */}
                <View style={styles.modeSwitch}>
                  <TouchableOpacity
                    onPress={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    style={[
                      styles.modeBtn,
                      mode === 'login' && styles.modeBtnActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <LogIn
                      size={14}
                      color={
                        mode === 'login' ? COLORS.white : COLORS.inkSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.modeBtnText,
                        mode === 'login' && styles.modeBtnTextActive,
                      ]}
                    >
                      Đăng nhập
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setMode('register');
                      setErrorMsg(null);
                    }}
                    style={[
                      styles.modeBtn,
                      mode === 'register' && styles.modeBtnActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <UserPlus
                      size={14}
                      color={
                        mode === 'register' ? COLORS.white : COLORS.inkSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.modeBtnText,
                        mode === 'register' && styles.modeBtnTextActive,
                      ]}
                    >
                      Đăng ký mới
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.formCard}>
                  {mode === 'register' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Tên hiển thị</Text>
                      <TextInput
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="VD: Minh Anh · Saigon Walker"
                        placeholderTextColor={COLORS.inkMuted}
                        style={styles.textInput}
                      />
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="ban@example.com"
                      placeholderTextColor={COLORS.inkMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.textInput}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mật khẩu</Text>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder={
                        mode === 'register'
                          ? 'Tối thiểu 6 ký tự'
                          : 'Nhập mật khẩu'
                      }
                      placeholderTextColor={COLORS.inkMuted}
                      secureTextEntry
                      style={styles.textInput}
                    />
                  </View>

                  {errorMsg && (
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    style={[
                      styles.primaryBtn,
                      isSubmitting && styles.btnDisabled,
                    ]}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : mode === 'login' ? (
                      <LogIn size={16} color={COLORS.white} />
                    ) : (
                      <UserPlus size={16} color={COLORS.white} />
                    )}
                    <Text style={styles.primaryBtnText}>
                      {isSubmitting
                        ? 'Đang xử lý...'
                        : mode === 'login'
                          ? 'Đăng nhập ngay'
                          : 'Tạo tài khoản & Đăng nhập'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Admin Demo Access */}
                <TouchableOpacity
                  onPress={handleQuickAdminDemoLogin}
                  disabled={isSubmitting}
                  style={styles.quickAdminBtn}
                  activeOpacity={0.8}
                >
                  <ShieldCheck size={15} color={COLORS.accent} />
                  <Text style={styles.quickAdminBtnText}>
                    Vào giao diện Quản trị (Admin Demo)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onClose}
                  style={styles.continueGuestBtn}
                  activeOpacity={0.75}
                >
                  <Text style={styles.continueGuestText}>
                    Tiếp tục dùng chế độ Khách (Offline)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
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
  headerTextCol: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: COLORS.inkMuted,
  },
  headerTitle: {
    marginTop: 2,
    fontFamily: SERIF_FONT,
    fontSize: 19,
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
    paddingBottom: SPACING.xxl,
  },
  section: {
    gap: SPACING.md,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  guestBannerText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.inkSecondary,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADII.md,
  },
  modeBtnActive: {
    backgroundColor: COLORS.ink,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  modeBtnTextActive: {
    color: COLORS.white,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.card,
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
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.ink,
  },
  errorBanner: {
    backgroundColor: COLORS.amberBg,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    borderRadius: RADII.md,
    padding: SPACING.sm + 2,
  },
  errorText: {
    fontSize: 12.5,
    lineHeight: 17,
    color: COLORS.accent,
    fontWeight: '500',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.ink,
    paddingVertical: 13,
    borderRadius: RADII.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 13.5,
    fontWeight: '700',
  },
  continueGuestBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  adminShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    borderRadius: RADII.md,
    paddingVertical: 13,
    paddingHorizontal: SPACING.lg,
  },
  quickAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADII.md,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
  },
  quickAdminBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  continueGuestText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.inkMuted,
    textDecorationLine: 'underline',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },
  profileMain: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  profileName: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    flexShrink: 1,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.visitedBg,
    borderWidth: 1,
    borderColor: COLORS.visitedBorder,
    borderRadius: RADII.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rolePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.visited,
  },
  profileEmail: {
    fontSize: 12.5,
    color: COLORS.inkSecondary,
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  statsTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm + 2,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 10.5,
    color: COLORS.inkMuted,
    textAlign: 'center',
  },
  syncCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  syncTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  syncDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.inkSecondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADII.md,
    paddingVertical: 12,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
