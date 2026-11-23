import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Edit3,
  Image as ImageIcon,
  MapPin,
  Plus,
  Utensils,
  X,
} from 'lucide-react-native';
import { HeritageSite } from '../../types/heritage';
import { MapExplorer } from '../MapExplorer';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../../theme';
import {
  AdminRegionFilter,
  classifySiteRegion,
  getCategoryLabel,
} from './adminTypes';

export interface AdminAuditMapTabProps {
  sites: HeritageSite[];
  userLocation: [number, number];
  isVisible: boolean;
  focusedSite: HeritageSite | null;
  onClearFocusedSite: () => void;
  onEditSite: (site: HeritageSite) => void;
  onCreateSite: () => void;
  onCreateRestaurantForSite: (siteId: string) => void;
}

const REGION_JUMPS: Array<{
  id: AdminRegionFilter;
  label: string;
  center: [number, number];
}> = [
  { id: 'all', label: 'Tất cả', center: [10.7769, 106.7009] },
  { id: 'hcm_core', label: 'TP.HCM', center: [10.7769, 106.7009] },
  { id: 'binh_duong', label: 'Bình Dương', center: [10.9804, 106.6519] },
  { id: 'vung_tau', label: 'Vũng Tàu', center: [10.346, 107.0843] },
  { id: 'con_dao', label: 'Côn Đảo', center: [8.683, 106.606] },
];

const NOOP = () => {};

export const AdminAuditMapTab: React.FC<AdminAuditMapTabProps> = ({
  sites,
  userLocation,
  isVisible,
  focusedSite,
  onClearFocusedSite,
  onEditSite,
  onCreateSite,
  onCreateRestaurantForSite,
}) => {
  const [regionFilter, setRegionFilter] = useState<AdminRegionFilter>('all');
  const [mapFocusCoord, setMapFocusCoord] =
    useState<[number, number]>(userLocation);
  const [inspectedSite, setInspectedSite] = useState<HeritageSite | null>(
    focusedSite
  );

  // Khi Admin bấm nút "Soi trên Bản đồ QC" từ tab Di tích
  useEffect(() => {
    if (!focusedSite) return;
    setRegionFilter('all');
    setMapFocusCoord([focusedSite.lat, focusedSite.lng]);
    setInspectedSite(focusedSite);
  }, [focusedSite]);

  // Đồng bộ inspectedSite nếu admin vừa chỉnh sửa thông tin điểm đó
  useEffect(() => {
    if (!inspectedSite) return;
    const fresh = sites.find((s) => s.id === inspectedSite.id);
    if (!fresh) {
      setInspectedSite(null);
    } else if (fresh !== inspectedSite) {
      setInspectedSite(fresh);
    }
  }, [inspectedSite, sites]);

  const filteredSites = useMemo(() => {
    if (regionFilter === 'all') return sites;
    return sites.filter((s) => classifySiteRegion(s) === regionFilter);
  }, [regionFilter, sites]);

  const handleSelectRegion = (
    regionId: AdminRegionFilter,
    center: [number, number]
  ) => {
    setRegionFilter(regionId);
    setMapFocusCoord(center);
    onClearFocusedSite();
  };

  return (
    <View style={styles.root}>
      {/* Compact QC Map Control Bar */}
      <View style={styles.topStrip}>
        <View style={styles.topMetaRow}>
          <View style={styles.qcBadge}>
            <MapPin size={11} color="#FDBA74" />
            <Text style={styles.qcBadgeText}>
              QC TỌA ĐỘ · {filteredSites.length} ĐIỂM
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onCreateSite}
            style={styles.quickAddBtn}
          >
            <Plus size={13} color={COLORS.white} />
            <Text style={styles.quickAddText}>Thêm điểm</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.regionRow}
        >
          {REGION_JUMPS.map((jump) => {
            const active = regionFilter === jump.id;
            return (
              <TouchableOpacity
                key={jump.id}
                activeOpacity={0.82}
                onPress={() => handleSelectRegion(jump.id, jump.center)}
                style={[styles.regionChip, active && styles.regionChipActive]}
              >
                <Text
                  style={[
                    styles.regionChipText,
                    active && styles.regionChipTextActive,
                  ]}
                >
                  {jump.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Interactive Map Stage */}
      <View style={styles.mapStage}>
        <MapExplorer
          isVisible={isVisible}
          userLocation={mapFocusCoord}
          sites={filteredSites}
          selectedSiteId={inspectedSite?.id || null}
          visitedRecords={[]}
          selectedLanguage="vi"
          activeRoute={null}
          activeWalkSeconds={0}
          isSimulatingWalk={false}
          searchRadiusMeters={0}
          focusHcmcOnly={false}
          onSelectSite={(site) => setInspectedSite(site)}
          onStartRouteToSite={(site) => setInspectedSite(site)}
          onSimulateWalkAlongRoute={NOOP}
          onFinishWalkAndCheckIn={NOOP}
          onCancelRoute={NOOP}
          onMoveUserLocation={(lat, lng) => setMapFocusCoord([lat, lng])}
        />

        {/* Dark Obsidian Admin Site Inspector Overlay */}
        {inspectedSite && (
          <View style={styles.inspectorCard}>
            <View style={styles.inspectorTop}>
              <Image
                source={{ uri: inspectedSite.coverImage }}
                style={styles.inspectorThumb}
                resizeMode="cover"
              />
              <View style={styles.inspectorInfo}>
                <Text style={styles.inspectorCat} numberOfLines={1}>
                  {getCategoryLabel(inspectedSite.category)} ·{' '}
                  {inspectedSite.city}
                </Text>
                <Text style={styles.inspectorTitle} numberOfLines={1}>
                  {inspectedSite.translations.vi.name}
                </Text>
                <Text style={styles.inspectorCoords} numberOfLines={1}>
                  WGS84: {inspectedSite.lat.toFixed(5)},{' '}
                  {inspectedSite.lng.toFixed(5)}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setInspectedSite(null);
                  onClearFocusedSite();
                }}
                style={styles.closeBtn}
                accessibilityLabel="Đóng thẻ kiểm tra"
              >
                <X size={16} color="#E7E5E4" />
              </TouchableOpacity>
            </View>

            <View style={styles.inspectorStatsRow}>
              <View style={styles.statPill}>
                <ImageIcon size={12} color="#FDBA74" />
                <Text style={styles.statPillText}>
                  {inspectedSite.mediaGallery?.length || 1} ảnh
                </Text>
              </View>
              <View style={styles.statPill}>
                <Utensils size={12} color="#34D399" />
                <Text style={styles.statPillText}>
                  {inspectedSite.nearbyRestaurants.length} quán ăn
                </Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statPillText}>
                  ★ {inspectedSite.rating.toFixed(1)}
                </Text>
              </View>
            </View>

            <View style={styles.inspectorActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onEditSite(inspectedSite)}
                style={styles.editSiteBtn}
              >
                <Edit3 size={14} color={COLORS.white} />
                <Text style={styles.editSiteBtnText}>
                  Sửa tọa độ & thông tin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onCreateRestaurantForSite(inspectedSite.id)}
                style={styles.addDiningBtn}
              >
                <Plus size={14} color="#F5F5F4" />
                <Text style={styles.addDiningBtnText}>+ Quán</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topStrip: {
    backgroundColor: '#1B1B19',
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  qcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(253,186,116,0.14)',
  },
  qcBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FDBA74',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
  },
  quickAddText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  regionRow: {
    gap: 7,
  },
  regionChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  regionChipActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  regionChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#D6D3D1',
  },
  regionChipTextActive: {
    color: '#141413',
    fontWeight: '700',
  },
  mapStage: {
    flex: 1,
    position: 'relative',
  },
  inspectorCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#141413',
    borderRadius: RADII.xl,
    padding: 13,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    ...SHADOWS.floating,
  },
  inspectorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inspectorThumb: {
    width: 52,
    height: 52,
    borderRadius: RADII.md,
    backgroundColor: '#292524',
  },
  inspectorInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  inspectorCat: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#FDBA74',
  },
  inspectorTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  inspectorCoords: {
    fontSize: 11,
    color: '#A8A29E',
    fontVariant: ['tabular-nums'],
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectorStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E7E5E4',
    fontVariant: ['tabular-nums'],
  },
  inspectorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editSiteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: RADII.md,
    backgroundColor: COLORS.accent,
  },
  editSiteBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  addDiningBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: RADII.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  addDiningBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#F5F5F4',
  },
});

export default AdminAuditMapTab;
