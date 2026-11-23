import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Edit3, Plus, Search, Star, Trash2, X } from 'lucide-react-native';
import { HeritageSite } from '../../types/heritage';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../../theme';
import {
  FlattenedRestaurant,
  RestaurantSourceFilter,
  classifySiteRegion,
} from './adminTypes';

export interface AdminDiningTabProps {
  sites: HeritageSite[];
  onCreateRestaurant: () => void;
  onEditRestaurant: (item: FlattenedRestaurant) => void;
  onDeleteRestaurant: (item: FlattenedRestaurant) => void;
}

interface DiningRowProps {
  item: FlattenedRestaurant;
  onEdit: (item: FlattenedRestaurant) => void;
  onDelete: (item: FlattenedRestaurant) => void;
}

const AdminDiningRow = memo<DiningRowProps>(({ item, onEdit, onDelete }) => {
  const isOverture = item.restaurant.source === 'overture';
  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <View
            style={[
              styles.sourcePill,
              isOverture ? styles.sourcePillOverture : styles.sourcePillCurated,
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
              {isOverture ? 'Overture Maps' : 'Tinh tuyển'}
            </Text>
          </View>
          <Text style={styles.metaMuted} numberOfLines={1}>
            {item.restaurant.cuisine}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {item.restaurant.name}
        </Text>

        <View style={styles.infoLine}>
          <Star size={11} color={COLORS.amberStar} fill={COLORS.amberStar} />
          <Text style={styles.ratingText}>
            {item.restaurant.rating.toFixed(1)}
          </Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.subMeta} numberOfLines={1}>
            {item.restaurant.priceRange} · Gần {item.siteName}
          </Text>
        </View>
      </View>

      <View style={styles.actionsCol}>
        <TouchableOpacity
          onPress={() => onEdit(item)}
          style={styles.iconBtn}
          accessibilityLabel="Chỉnh sửa quán ăn"
        >
          <Edit3 size={14} color={COLORS.ink} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(item)}
          style={[styles.iconBtn, styles.iconBtnDanger]}
          accessibilityLabel="Xóa quán ăn"
        >
          <Trash2 size={14} color={COLORS.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export const AdminDiningTab: React.FC<AdminDiningTabProps> = ({
  sites,
  onCreateRestaurant,
  onEditRestaurant,
  onDeleteRestaurant,
}) => {
  const [rawSearch, setRawSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sourceFilter, setSourceFilter] =
    useState<RestaurantSourceFilter>('all');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(rawSearch.trim().toLowerCase());
    }, 180);
    return () => clearTimeout(t);
  }, [rawSearch]);

  // Chỉ flatten toàn bộ 340+ quán ăn khi Admin thực sự mở tab Ẩm thực
  const allRestaurants = useMemo<FlattenedRestaurant[]>(() => {
    const items: FlattenedRestaurant[] = [];
    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      const siteName = site.translations.vi.name;
      const siteRegion = classifySiteRegion(site);
      const list = site.nearbyRestaurants || [];
      for (let j = 0; j < list.length; j++) {
        items.push({ siteId: site.id, siteName, siteRegion, restaurant: list[j] });
      }
    }
    return items;
  }, [sites]);

  const overtureCount = useMemo(
    () =>
      allRestaurants.filter((i) => i.restaurant.source === 'overture').length,
    [allRestaurants]
  );

  const filtered = useMemo(() => {
    return allRestaurants.filter((item) => {
      const src = item.restaurant.source || 'curated';
      if (sourceFilter !== 'all' && src !== sourceFilter) return false;
      if (!debouncedSearch) return true;
      return (
        item.restaurant.name.toLowerCase().includes(debouncedSearch) ||
        item.restaurant.cuisine.toLowerCase().includes(debouncedSearch) ||
        item.siteName.toLowerCase().includes(debouncedSearch) ||
        item.restaurant.address.toLowerCase().includes(debouncedSearch)
      );
    });
  }, [allRestaurants, sourceFilter, debouncedSearch]);

  const renderItem = useCallback(
    ({ item }: { item: FlattenedRestaurant }) => (
      <AdminDiningRow
        item={item}
        onEdit={onEditRestaurant}
        onDelete={onDeleteRestaurant}
      />
    ),
    [onDeleteRestaurant, onEditRestaurant]
  );

  const keyExtractor = useCallback(
    (item: FlattenedRestaurant) => `${item.siteId}-${item.restaurant.id}`,
    []
  );

  return (
    <View style={styles.root}>
      <View style={styles.stickyControls}>
        <View style={styles.toolbarRow}>
          <View style={styles.searchPill}>
            <Search size={15} color={COLORS.inkMuted} />
            <TextInput
              value={rawSearch}
              onChangeText={setRawSearch}
              placeholder="Tìm tên quán, món ăn, di tích gần…"
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
            onPress={onCreateRestaurant}
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
              { id: 'overture', label: `Overture (${overtureCount})` },
            ] as const
          ).map((opt) => {
            const active = sourceFilter === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setSourceFilter(opt.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Virtualized FlatList — hiển thị mượt toàn bộ 340+ quán ăn không bị cắt 50 mục và không lag */}
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={40}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Không tìm thấy quán ăn phù hợp</Text>
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
    backgroundColor: '#141413',
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
  },
  filterChipActive: {
    backgroundColor: '#141413',
    borderColor: '#141413',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
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
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  subMeta: {
    fontSize: 11.5,
    color: COLORS.inkSecondary,
    flexShrink: 1,
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
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
});

export default AdminDiningTab;
