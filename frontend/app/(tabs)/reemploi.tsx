import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Item } from '../../src/types';
import FilterModal, { FilterState } from '../../src/components/FilterModal';
import FoodMapCTA from '../../src/components/FoodMapCTA';
import CategoryDropdown from '../../src/components/CategoryDropdown';
import { useAuthStore } from '../../src/store/authStore';
import { MOCK_MAP_POINTS } from '../../src/data/mockMapPoints';
import * as Location from 'expo-location';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { API_URL } from '../../src/config/api';

const { width: SCREEN_W } = Dimensions.get('window');

const REUSE_POINT_COUNT = MOCK_MAP_POINTS.filter(p => p.category === 'reemploi').length;

// ─── Sub-tabs ────────────────────────────────────────────────────────────────

const SUB_TABS = [
  { key: 'vente',     label: 'Vente',                  icon: 'pricetag',    color: colors.info,    bg: '#EFF6FF', canPublish: true  },
  { key: 'dons',      label: 'Dons',                   icon: 'gift',        color: colors.primary, bg: colors.primaryLight, canPublish: true  },
  { key: 'echange',   label: 'Échange',                icon: 'swap-horizontal', color: '#7C3AED',  bg: '#F5F3FF', canPublish: true  },
  { key: 'services',  label: 'Services',               icon: 'construct',   color: '#0284C7',      bg: '#F0F9FF', canPublish: true  },
  { key: 'pros',      label: 'Ressourceries',          icon: 'storefront',  color: '#059669',      bg: '#ECFDF5', canPublish: false },
];

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  new:       { label: 'Neuf',      color: '#059669' },
  like_new:  { label: 'Comme neuf', color: '#0284C7' },
  good:      { label: 'Bon état',  color: colors.info },
  fair:      { label: 'Correct',   color: colors.accent },
  poor:      { label: 'À réparer', color: colors.error },
};

// ─── Item Card ───────────────────────────────────────────────────────────────

function ReemploiCard({
  item, accentColor, onPress,
}: { item: any; accentColor: string; onPress: () => void }) {
  const isFree = item.price_cents == null || item.price_cents === 0;
  const condition = item.condition ? CONDITION_LABELS[item.condition] : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Image */}
      <View style={styles.cardImg}>
        {item.photos?.length > 0 ? (
          <Image source={{ uri: item.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.cardImgPlaceholder]}>
            <Ionicons name="cube-outline" size={32} color={colors.border} />
          </View>
        )}

        {/* Price badge */}
        <View style={[styles.priceBadge, { backgroundColor: isFree ? colors.primary : accentColor }]}>
          <Text style={styles.priceBadgeText}>
            {isFree ? 'Gratuit' : `${(item.price_cents / 100).toFixed(0)} €`}
          </Text>
        </View>

        {/* Condition badge */}
        {condition && (
          <View style={[styles.conditionBadge, { backgroundColor: condition.color + 'EE' }]}>
            <Text style={styles.conditionText}>{condition.label}</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

        {item.city && (
          <View style={styles.cardMeta}>
            <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.cardMetaText}>{item.city}</Text>
          </View>
        )}
        {(item.seller_name || item.store_name) && (
          <View style={styles.cardMeta}>
            <Ionicons name="person-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.cardMetaText} numberOfLines={1}>
              {item.seller_name || item.store_name}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.cardBtn, { backgroundColor: accentColor + '15', borderColor: accentColor + '40' }]}
          onPress={onPress}
        >
          <Text style={[styles.cardBtnText, { color: accentColor }]}>Voir</Text>
          <Ionicons name="arrow-forward" size={12} color={accentColor} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  tab: typeof SUB_TABS[0];
  onPublish?: () => void;
  onViewMap?: () => void;
}

function EmptyState({ tab, onPublish, onViewMap }: EmptyStateProps) {
  const MESSAGES: Record<string, { title: string; sub: string; cta: string }> = {
    vente:    { title: 'Aucun article en vente autour de vous',   sub: 'Consultez la carte locale ou publiez un objet pour lui offrir une seconde vie.', cta: 'Mettre en vente' },
    dons:     { title: 'Aucun don disponible',                    sub: 'Vos objets inutilisés peuvent rendre service à quelqu\'un près de vous.', cta: 'Donner un objet' },
    echange:  { title: 'Aucune proposition d\'échange',           sub: 'Proposez un objet en échange d\'un autre et évitez le gaspillage.', cta: 'Proposer un échange' },
    services: { title: 'Aucun service disponible',                sub: 'Proposez vos compétences : réparation, bricolage, couture…', cta: 'Proposer un service' },
    pros:     { title: 'Aucune boutique référencée',              sub: 'Les friperies, recycleries et ressourceries locales apparaîtront ici.', cta: '' },
  };
  const msg = MESSAGES[tab.key];

  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIconBox, { backgroundColor: tab.bg }]}>
        <Ionicons name={tab.icon as any} size={40} color={tab.color} />
      </View>
      <Text style={styles.emptyTitle}>{msg.title}</Text>
      <Text style={styles.emptySub}>{msg.sub}</Text>

      {onPublish && msg.cta ? (
        <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: tab.color }]} onPress={onPublish}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.emptyBtnText}>{msg.cta}</Text>
        </TouchableOpacity>
      ) : null}

      {onViewMap ? (
        <TouchableOpacity style={styles.emptyMapBtn} onPress={onViewMap}>
          <Ionicons name="map-outline" size={15} color={colors.primary} />
          <Text style={styles.emptyMapBtnText}>Voir la carte réemploi</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

const CARTE_REEMPLOI = '/carte?initialCategory=reemploi';

const TYPE_MAP: Record<string, string> = {
  vente:    'sale',
  dons:     'donation',
  echange:  'exchange',
  services: 'service',
  pros:     'pro_reemploi',
};

const CATEGORY_MAP: Record<string, string> = {
  pros: 'Friperie/Recyclerie',
};

type ViewMode = 'grid' | 'list' | 'map';

export default function ReemploiScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('vente');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    minPrice: '', maxPrice: '', conditions: [], sortBy: 'date_desc', radiusKm: null,
  });

  const currentTab = SUB_TABS.find(t => t.key === activeTab)!;

  const CATEGORIES = activeTab === 'pros' ? [] : [
    { name: 'Tous',        icon: 'apps-outline' },
    { name: 'Maison',      icon: 'home-outline' },
    { name: 'Vêtements',   icon: 'shirt-outline' },
    { name: 'Électronique',icon: 'phone-portrait-outline' },
    { name: 'Livres',      icon: 'book-outline' },
    { name: 'Sport',       icon: 'basketball-outline' },
    { name: 'Enfants',     icon: 'happy-outline' },
    { name: 'Bricolage',   icon: 'hammer-outline' },
    { name: 'Musique',     icon: 'musical-notes-outline' },
    { name: 'Autre',       icon: 'ellipsis-horizontal-outline' },
  ];

  useEffect(() => { getUserLocation(); }, []);
  useEffect(() => { setSelectedCategory('Tous'); load(); }, [activeTab, userLocation]);
  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [selectedCategory, filters, searchQuery]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {}
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (activeTab === 'pros') {
        params.category = CATEGORY_MAP.pros;
      } else {
        params.type = TYPE_MAP[activeTab] || 'sale';
        if (selectedCategory !== 'Tous') params.category = selectedCategory;
        if (searchQuery.trim()) params.q = searchQuery.trim();
        if (filters.minPrice) params.min_price = parseInt(filters.minPrice);
        if (filters.maxPrice) params.max_price = parseInt(filters.maxPrice);
        if (filters.conditions.length > 0) params.condition = filters.conditions;
        if (filters.sortBy) params.sort_by = filters.sortBy;
        if (filters.radiusKm) params.radius_km = filters.radiusKm;
      }
      if (userLocation) { params.lat = userLocation.lat; params.lng = userLocation.lng; }

      const res = await axios.get(`${API_URL}/items`, { params });
      const now = new Date();
      setItems(res.data.filter((i: Item) => !i.locked_until || new Date(i.locked_until) < now));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [activeTab, selectedCategory, filters, searchQuery, userLocation]);

  const toggleViewMode = () => {
    if (viewMode === 'grid') setViewMode('list');
    else if (viewMode === 'list') setViewMode('map');
    else setViewMode('grid');
  };
  const getViewIcon = () => {
    if (viewMode === 'grid') return 'list-outline';
    if (viewMode === 'list') return 'map-outline';
    return 'grid-outline';
  };

  const hasActiveFilters = !!(filters.minPrice || filters.maxPrice || filters.conditions.length > 0 || filters.radiusKm);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Réemploi</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={toggleViewMode}>
              <Ionicons name={getViewIcon() as any} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/messages' as any)}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un objet…"
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          {activeTab !== 'pros' && (
            <TouchableOpacity
              style={[styles.filterBtn, hasActiveFilters && { backgroundColor: currentTab.color }]}
              onPress={() => setShowFilters(true)}
            >
              <Ionicons name="options-outline" size={18} color={hasActiveFilters ? '#fff' : colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Sub-tabs : style underline, aucun pill ── */}
      <View style={styles.subTabsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabsContent}>
          {SUB_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.subTab, active && { borderBottomColor: tab.color }]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.subTabText, active && { color: tab.color, fontWeight: Typography.bold as any }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Filtre catégorie : dropdown déroulant ── */}
      {CATEGORIES.length > 0 && (
        <View style={styles.filterRow}>
          <CategoryDropdown
            categories={CATEGORIES}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            accentColor={currentTab.color}
          />
        </View>
      )}

      {/* ── Active filter pills ── */}
      {hasActiveFilters && (
        <View style={styles.filterPills}>
          {filters.minPrice ? (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>Min {filters.minPrice}€</Text>
              <TouchableOpacity onPress={() => setFilters({ ...filters, minPrice: '' })}>
                <Ionicons name="close" size={11} color={currentTab.color} />
              </TouchableOpacity>
            </View>
          ) : null}
          {filters.radiusKm ? (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>&lt;{filters.radiusKm}km</Text>
              <TouchableOpacity onPress={() => setFilters({ ...filters, radiusKm: null })}>
                <Ionicons name="close" size={11} color={currentTab.color} />
              </TouchableOpacity>
            </View>
          ) : null}
          <TouchableOpacity onPress={() => setFilters({ minPrice: '', maxPrice: '', conditions: [], sortBy: 'date_desc', radiusKm: null })}>
            <Text style={[styles.clearFilters, { color: currentTab.color }]}>Effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={currentTab.color} />
        </View>
      ) : items.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={currentTab.color} colors={[currentTab.color]} />
          }
        >
          <EmptyState
            tab={currentTab}
            onPublish={currentTab.canPublish ? () => router.push('/post' as any) : undefined}
            onViewMap={() => router.push(CARTE_REEMPLOI as any)}
          />
        </ScrollView>
      ) : (
        <FlatList
          key={viewMode}
          data={items}
          numColumns={viewMode === 'grid' ? 2 : 1}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <FoodMapCTA
              category="reemploi"
              count={REUSE_POINT_COUNT}
            />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={currentTab.color} colors={[currentTab.color]} />
          }
          renderItem={({ item }) => (
            <View style={viewMode === 'grid' ? styles.gridItem : undefined}>
              <ReemploiCard
                item={item}
                accentColor={currentTab.color}
                onPress={() => router.push(`/item-detail?id=${item.id}` as any)}
              />
            </View>
          )}
        />
      )}

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(f) => { setFilters(f); setShowFilters(false); }}
        initialFilters={filters}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    backgroundColor: colors.surface,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.heavy as any,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 9 : 7,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: colors.textPrimary,
    padding: 0,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  subTabsBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  subTabsContent: {
    paddingHorizontal: Spacing.lg,
    gap: 0,
  },
  subTab: {
    paddingHorizontal: Spacing.md,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  subTabText: {
    fontSize: Typography.sm,
    color: colors.textTertiary,
    fontWeight: Typography.medium as any,
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  filterPills: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
    gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    backgroundColor: colors.surface,
  },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  filterPillText: { fontSize: Typography.xs, color: colors.info, fontWeight: Typography.semibold as any },
  clearFilters: { fontSize: Typography.xs, textDecorationLine: 'underline', paddingVertical: 5 },

  gridRow: { gap: Spacing.md, paddingHorizontal: Spacing.lg },
  gridItem: { flex: 1 },
  listContent: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.md },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cardImg: { height: 130, backgroundColor: colors.surfaceAlt, position: 'relative' },
  cardImgPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF6FF' },
  priceBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  priceBadgeText: { color: '#fff', fontSize: 11, fontWeight: Typography.heavy as any },
  conditionBadge: {
    position: 'absolute', bottom: 8, right: 8,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  conditionText: { color: '#fff', fontSize: 10, fontWeight: Typography.semibold as any },
  cardBody: { padding: Spacing.md, gap: 4 },
  cardTitle: { fontSize: Typography.sm, fontWeight: Typography.heavy as any, color: colors.textPrimary, lineHeight: 18, marginBottom: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: Typography.xs, color: colors.textTertiary, flex: 1 },
  cardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    marginTop: Spacing.sm, paddingVertical: 6,
    borderRadius: BorderRadius.md, borderWidth: 1,
  },
  cardBtnText: { fontSize: Typography.xs, fontWeight: Typography.semibold as any },

  // Empty
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl * 1.5, paddingTop: 60, gap: Spacing.md,
  },
  emptyIconBox: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.heavy as any, color: colors.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: Typography.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.xl, paddingVertical: 12,
    borderRadius: BorderRadius.full, marginTop: Spacing.sm, ...Shadows.card,
  },
  emptyBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.heavy as any },
  emptyMapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: colors.primary + '40',
    backgroundColor: colors.primaryLight,
  },
  emptyMapBtnText: { fontSize: Typography.sm, color: colors.primary, fontWeight: Typography.semibold as any },
});
