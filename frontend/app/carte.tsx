import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InteractiveMap from '../src/components/InteractiveMap';
import {
  MOCK_MAP_POINTS,
} from '../src/data/mockMapPoints';
import {
  MapPoint, MapPointType, MapCategory,
  MAP_TYPE_META, FOOD_FILTER_TYPES, ZONE_LABELS,
} from '../src/types/map';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../src/theme';

// ─── Adapter: MapPoint → InteractiveMap item ─────────────────────────────────

function toMapItem(point: MapPoint) {
  const typeMap: Record<MapPointType, 'donation' | 'sale' | 'store' | 'rent'> = {
    food_donation:      'donation',
    garden_surplus:     'donation',
    anti_waste_basket:  'store',
    producer:           'store',
    market:             'store',
    amap:               'store',
    solidarity_grocery: 'store',
    food_association:   'store',
    yondly_mobile_stop: 'donation',
    reuse_shop:         'store',
    repair_point:       'store',
    second_hand:        'sale',
  };
  return {
    id: point.id,
    title: point.name,
    location: { lat: point.latitude, lng: point.longitude },
    type: typeMap[point.type] ?? 'store',
    price_cents: 0,
  };
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

const TYPE_FILTERS_FOOD: { key: MapPointType | 'all'; label: string; icon: string }[] = [
  { key: 'all',               label: 'Tout',            icon: 'layers-outline' },
  { key: 'food_donation',     label: 'Dons',            icon: 'leaf-outline' },
  { key: 'garden_surplus',    label: 'Jardin',          icon: 'flower-outline' },
  { key: 'anti_waste_basket', label: 'Anti-gaspi',      icon: 'timer-outline' },
  { key: 'producer',          label: 'Producteurs',     icon: 'storefront-outline' },
  { key: 'market',            label: 'Marchés',         icon: 'storefront-outline' },
  { key: 'amap',              label: 'AMAP',            icon: 'basket-outline' },
  { key: 'solidarity_grocery',label: 'Épiceries',       icon: 'heart-outline' },
  { key: 'food_association',  label: 'Associations',    icon: 'people-outline' },
  { key: 'yondly_mobile_stop',label: 'Yondly Mobile',  icon: 'bus-outline' },
];

const TYPE_FILTERS_REUSE: { key: MapPointType | 'all'; label: string; icon: string }[] = [
  { key: 'all',          label: 'Tout',         icon: 'layers-outline' },
  { key: 'reuse_shop',   label: 'Recycleries',  icon: 'refresh-circle-outline' },
  { key: 'repair_point', label: 'Réparation',   icon: 'construct-outline' },
  { key: 'second_hand',  label: 'Seconde main', icon: 'swap-horizontal-outline' },
];

// ─── Selected point bottom sheet ─────────────────────────────────────────────

function PointSheet({ point, onClose }: { point: MapPoint; onClose: () => void }) {
  const meta = MAP_TYPE_META[point.type];
  return (
    <View style={sheet.container}>
      <View style={sheet.handle} />
      <View style={sheet.row}>
        <View style={[sheet.iconWrap, { backgroundColor: meta.color + '20' }]}>
          <Ionicons name={meta.icon as any} size={20} color={meta.color} />
        </View>
        <View style={sheet.headerText}>
          <Text style={sheet.typeBadge}>{meta.label}</Text>
          <Text style={sheet.title}>{point.name}</Text>
        </View>
        <TouchableOpacity style={sheet.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {point.openingHours && (
        <View style={sheet.detail}>
          <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
          <Text style={sheet.detailText}>{point.openingHours}</Text>
        </View>
      )}

      <View style={sheet.detail}>
        <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
        <Text style={sheet.detailText}>{point.address}, {point.city}</Text>
      </View>

      {point.description ? (
        <Text style={sheet.description} numberOfLines={3}>{point.description}</Text>
      ) : null}

      {point.actionLabel && (
        <TouchableOpacity style={[sheet.actionBtn, { backgroundColor: meta.color }]}>
          <Text style={sheet.actionBtnText}>{point.actionLabel}</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CarteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ initialCategory?: string; initialType?: string }>();

  const initCategory = (params.initialCategory as MapCategory) || 'all';
  const initType = (params.initialType as MapPointType | 'all') || 'all';

  const [activeCategory, setActiveCategory] = useState<MapCategory>(initCategory);
  const [activeType, setActiveType] = useState<MapPointType | 'all'>(initType);
  const [activeZone, setActiveZone] = useState(ZONE_LABELS[2]); // Grand Poitiers
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  const typeFilters = activeCategory === 'reemploi' ? TYPE_FILTERS_REUSE : TYPE_FILTERS_FOOD;

  const filteredPoints = MOCK_MAP_POINTS.filter((p) => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (activeType !== 'all' && p.type !== activeType) return false;
    return true;
  });

  const mapItems = filteredPoints.map(toMapItem);

  const handleMarkerPress = useCallback((id: string) => {
    const point = MOCK_MAP_POINTS.find(p => p.id === id);
    if (point) setSelectedPoint(point);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carte</Text>
        <TouchableOpacity
          style={styles.zoneBtn}
          onPress={() => setShowZonePicker(v => !v)}
        >
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={styles.zoneBtnText} numberOfLines={1}>{activeZone}</Text>
          <Ionicons name="chevron-down" size={13} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Zone picker ── */}
      {showZonePicker && (
        <View style={styles.zonePicker}>
          {ZONE_LABELS.map(zone => (
            <TouchableOpacity
              key={zone}
              style={[styles.zoneOption, zone === activeZone && styles.zoneOptionActive]}
              onPress={() => { setActiveZone(zone); setShowZonePicker(false); }}
            >
              <Text style={[styles.zoneOptionText, zone === activeZone && styles.zoneOptionTextActive]}>
                {zone}
              </Text>
              {zone === activeZone && <Ionicons name="checkmark" size={16} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Category toggle ── */}
      <View style={styles.catRow}>
        {(['all', 'alimentaire', 'reemploi'] as MapCategory[]).map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
            onPress={() => { setActiveCategory(cat); setActiveType('all'); }}
          >
            <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>
              {cat === 'all' ? 'Tout' : cat === 'alimentaire' ? 'Alimentaire' : 'Réemploi'}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.countBadge}>{filteredPoints.length} point{filteredPoints.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* ── Type filters ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typeBar}
        contentContainerStyle={styles.typeBarContent}
      >
        {typeFilters.map(f => {
          const active = activeType === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.typeChip, active && styles.typeChipActive]}
              onPress={() => setActiveType(f.key)}
            >
              <Ionicons
                name={f.icon as any}
                size={13}
                color={active ? colors.primary : colors.textTertiary}
              />
              <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Map ── */}
      <View style={styles.mapWrap}>
        <InteractiveMap
          items={mapItems}
          onMarkerPress={handleMarkerPress}
          userLocation={null}
        />
      </View>

      {/* ── Selected point sheet ── */}
      {selectedPoint && (
        <PointSheet point={selectedPoint} onClose={() => setSelectedPoint(null)} />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.lg,
    fontWeight: Typography.bold as any,
    color: colors.textPrimary,
  },
  zoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    maxWidth: 140,
  },
  zoneBtnText: {
    fontSize: Typography.xs,
    color: colors.primary,
    fontWeight: Typography.semibold as any,
    flex: 1,
  },
  zonePicker: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...Shadows.card,
    zIndex: 10,
  },
  zoneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  zoneOptionActive: {
    backgroundColor: colors.primaryLight,
  },
  zoneOptionText: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
  },
  zoneOptionTextActive: {
    color: colors.primary,
    fontWeight: Typography.semibold as any,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: colors.surface,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    fontWeight: Typography.medium as any,
  },
  catChipTextActive: {
    color: '#fff',
    fontWeight: Typography.semibold as any,
  },
  countBadge: {
    marginLeft: 'auto',
    fontSize: Typography.xs,
    color: colors.textTertiary,
  },
  typeBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    maxHeight: 48,
  },
  typeBarContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    gap: Spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary + '40',
  },
  typeChipText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  typeChipTextActive: {
    color: colors.primary,
    fontWeight: Typography.semibold as any,
  },
  mapWrap: {
    flex: 1,
  },
});

const sheet = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.elevated,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
  },
  typeBadge: {
    fontSize: Typography.xs,
    color: colors.textTertiary,
    fontWeight: Typography.medium as any,
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.bold as any,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  description: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
  },
});
