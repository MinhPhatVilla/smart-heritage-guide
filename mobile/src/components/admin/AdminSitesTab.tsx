import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Edit3, MapPin, Plus, Search, Trash2, X } from 'lucide-react-native';
import { HeritageCategory, HeritageSite } from '../../types/heritage';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../../theme';
import {
  AdminRegionFilter,
  CATEGORY_OPTIONS,
  REGION_OPTIONS,
  classifySiteRegion,
  getCategoryLabel,
} from './adminTypes';

export interface AdminSitesTabProps {
  sites: HeritageSite[];
  initialRegionFilter?: AdminRegionFilter;
  onCreateSite: () => void;
  onEditSite: (site: HeritageSite) => void;
  onDeleteSite: (site: HeritageSite) => void;
  onInspectOnMap: (site: HeritageSite) => void;
}

interface SiteRowProps {
  site: HeritageSite;
  onEdit: (site: HeritageSite) => void;
  onDelete: (site: HeritageSite) => void;
  onInspect: (site: HeritageSite) => void;
}

const AdminSiteRow = memo<SiteRowProps>(
  ({ site, onEdit, onDelete, onInspect }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: site.coverImage }}
        style={styles.thumb}
        resizeMode="cover"
      />
      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <Text style={styles.metaTag}>{getCategoryLabel(site.category)}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaMuted} numberOfLines={1}>
            {site.city}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {site.translations.vi.name}
        </Text>
        <Text style={styles.subMeta} numberOfLines={1}>
          {site.nearbyRestaurants.length} quán · ★ {site.rating.toFixed(1)} ·{' '}
          {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
        </Text>
      </View>

      <View style={styles.actionsCol}>
        <TouchableOpacity
          onPress={() => onInspect(site)}
          style={styles.iconBtn}
          accessibilityLabel="Kiểm tra trên Bản đồ QC"
        >
          <MapPin size={14} color={COLORS.gpsBlue} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onEdit(site)}
          style={styles.iconBtn}
          accessibilityLabel="Chỉnh sửa di tích"
        >
          <Edit3 size={14} color={COLORS.ink} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(site)}
          style={[styles.iconBtn, styles.iconBtnDanger]}
          accessibilityLabel="Xóa di tích"
        >
          <Trash2 size={14} color={COLORS.accent} />
        </TouchableOpacity>
      </View>
    </View>
  )
);

export const AdminSitesTab: React.FC<AdminSitesTabProps> = ({
  sites,
  initialRegionFilter = 'all',
  onCreateSite,
  onEditSite,
  onDeleteSite,
  onInspectOnMap,
}) => {
  const [rawSearch, setRawSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [regionFilter, setRegionFilter] =
    useState<AdminRegionFilter>(initialRegionFilter);
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | HeritageCategory
  >('all');

  useEffect(() => {
    setRegionFilter(initialRegionFilter);
  }, [initialRegionFilter]);

  // Debounce 180ms để gõ tìm kiếm mượt mà không lag trên 97+ địa điểm
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(rawSearch.trim().toLowerCase());
    }, 180);
    return () => clearTimeout(t);
  }, [rawSearch]);

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      if (regionFilter !== 'all' && classifySiteRegion(site) !== regionFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && site.category !== categoryFilter) {
        return false;
      }
      if (!debouncedSearch) return true;
      return (
        site.translations.vi.name.toLowerCase().includes(debouncedSearch) ||
        site.translations.en.name.toLowerCase().includes(debouncedSearch) ||
        site.city.toLowerCase().includes(debouncedSearch) ||
        (site.address || '').toLowerCase().includes(debouncedSearch) ||
        site.id.toLowerCase().includes(debouncedSearch)
      );
    });
  }, [sites, regionFilter, categoryFilter, debouncedSearch]);

  const renderItem = useCallback(
    ({ item }: { item: HeritageSite }) => (
      <AdminSiteRow
        site={item}
        onEdit={onEditSite}
        onDelete={onDeleteSite}
        onInspect={onInspectOnMap}
      />
    ),
    [onDeleteSite, onEditSite, onInspectOnMap]
  );

  const keyExtractor = useCallback((item: HeritageSite) => item.id, []);

  return (
    <View style={styles.root}>
      {/* Sticky Filter & Search Toolbar */}
      <View style={styles.stickyControls}>
        <View style={styles.toolbarRow}>
          <View style={styles.searchPill}>
            <Search size={15} color={COLORS.inkMuted} />
            <TextInput
              value={rawSearch}
              onChangeText={setRawSearch}
              placeholder="Tìm tên di tích, địa chỉ, slug…"
              placeholderTextColor={COLORS.inkMuted}
              style={styles.searchInput}
            />
            {rawSearch.length > 0 && (
              <TouchableOpacity onPress={() => setRawSearch('')}>
                <X size={14} color={COLORS.inkMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onCreateSite}
            style={styles.addBtn}
          >
            <Plus size={15} color={COLORS.white} />
            <Text style={styles.addBtnText}>Thêm</Text>
          </TouchableOpacity>
        </View>

        {/* Region Filter Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {REGION_OPTIONS.map((reg) => {
            const active = regionFilter === reg.id;
            return (
              <TouchableOpacity
                key={reg.id}
                onPress={() => setRegionFilter(reg.id)}
                style={[styles.regionChip, active && styles.regionChipActive]}
              >
                <Text
                  style={[
                    styles.regionChipText,
                    active && styles.regionChipTextActive,
                  ]}
                >
                  {reg.shortLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Category Filter Strip + Live Count */}
        <View style={styles.catStripWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <TouchableOpacity
              onPress={() => setCategoryFilter('all')}
              style={[
                styles.catChip,
                categoryFilter === 'all' && styles.catChipActive,
              ]}
            >
              <Text
                style={[
                  styles.catChipText,
                  categoryFilter === 'all' && styles.catChipTextActive,
                ]}
              >
                Tất cả ({filteredSites.length})
              </Text>
            </TouchableOpacity>
            {CATEGORY_OPTIONS.map((cat) => {
              const active = categoryFilter === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryFilter(cat.id)}
                  style={[styles.catChip, active && styles.catChipActive]}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      active && styles.catChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Virtualized FlatList — renders only visible viewport cards for instant 60 FPS load */}
      <FlatList
        data={filteredSites}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={40}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Không có di tích khớp bộ lọc</Text>
            <TouchableOpacity
              onPress={() => {
                setRawSearch('');
                setRegionFilter('all');
                setCategoryFilter('all');
              }}
              style={styles.resetBtn}
            >
              <Text style={styles.resetBtnText}>Đặt lại bộ lọc</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  stickyControls: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm + 2,
    gap: 8,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    paddingHorizontal: 12,
    height: 40,
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
    gap: 4,
    backgroundColor: COLORS.accent,
    borderRadius: RADII.lg,
    paddingHorizontal: 13,
    height: 40,
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 12,
  },
  catStripWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  regionChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  regionChipActive: {
    backgroundColor: '#141413',
    borderColor: '#141413',
  },
  regionChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  regionChipTextActive: {
    color: COLORS.white,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  catChipActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentBorder,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  catChipTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.sm + 2,
    paddingBottom: SPACING.xxl + 12,
  },
  card: {
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
  thumb: {
    width: 54,
    height: 54,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaTag: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: COLORS.accent,
  },
  metaDot: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  metaMuted: {
    fontSize: 11,
    color: COLORS.inkMuted,
    flexShrink: 1,
  },
  title: {
    fontFamily: SERIF_FONT,
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 19,
  },
  subMeta: {
    fontSize: 11,
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  actionsCol: {
    flexDirection: 'row',
    gap: 5,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: {
    backgroundColor: COLORS.accentSoft,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  resetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADII.md,
    backgroundColor: COLORS.ink,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default AdminSitesTab;
