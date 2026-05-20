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
import { useAuthStore } from '../../src/store/authStore';
import * as Location from 'expo-location';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { API_URL } from '../../src/config/api';
import FoodMapCTA from '../../src/components/FoodMapCTA';
import YondlyMobileCard from '../../src/components/YondlyMobileCard';
import { MOCK_MAP_POINTS } from '../../src/data/mockMapPoints';
import { FOOD_FILTER_TYPES } from '../../src/types/map';

const { width: SCREEN_W } = Dimensions.get('window');

const FOOD_POINT_COUNT = MOCK_MAP_POINTS.filter(p => FOOD_FILTER_TYPES.includes(p.type)).length;

// ─── Sub-tabs ────────────────────────────────────────────────────────────────

const SUB_TABS = [
  { key: 'dons',     label: 'Dons & Surplus',   icon: 'leaf',          color: colors.primary,  bg: colors.primaryLight, canPublish: true  },
  { key: 'antigaspi',label: 'Anti-gaspi',        icon: 'timer',         color: colors.accent,   bg: colors.accentLight,  canPublish: false },
  { key: 'circuits', label: 'Circuits courts',   icon: 'storefront',    color: '#059669',        bg: '#ECFDF5',           canPublish: false },
  { key: 'aide',     label: 'Aide alimentaire',  icon: 'heart',         color: '#DC2626',        bg: '#FEF2F2',           canPublish: false },
  { key: 'mobile',   label: 'Yondly Mobile',     icon: 'bus',           color: colors.primary,  bg: colors.primaryLight, canPublish: false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expiré';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

function isUrgent(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() - Date.now() < 6 * 3600000;
}

// ─── Food Card ───────────────────────────────────────────────────────────────

function FoodCard({ item, onPress, accentColor }: { item: any; onPress: () => void; accentColor: string }) {
  const isFree = item.price_cents == null || item.price_cents === 0;
  const hasTimer = !!item.expires_at;
  const urgent = hasTimer && isUrgent(item.expires_at);

  return (
    <TouchableOpacity style={styles.foodCard} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.foodCardImg}>
        {item.photos?.length > 0 ? (
          <Image source={{ uri: item.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.foodCardImgPlaceholder]}>
            <Ionicons name="nutrition-outline" size={36} color={colors.border} />
          </View>
        )}

        <View style={styles.foodCardBadges}>
          <View style={[styles.priceBadge, { backgroundColor: isFree ? colors.primary : accentColor }]}>
            <Text style={styles.priceBadgeText}>{isFree ? 'Gratuit' : `${(item.price_cents / 100).toFixed(2)} €`}</Text>
          </View>
        </View>

        {hasTimer && (
          <View style={[styles.timerBadge, urgent && { backgroundColor: colors.error }]}>
            <Ionicons name="time-outline" size={11} color="#fff" />
            <Text style={styles.timerText}>{timeLeft(item.expires_at)}</Text>
          </View>
        )}
      </View>

      <View style={styles.foodCardBody}>
        <Text style={styles.foodCardTitle} numberOfLines={2}>{item.title}</Text>

        {(item.seller_name || item.store_name) && (
          <View style={styles.foodCardMeta}>
            <Ionicons name="person-circle-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.foodCardMetaText} numberOfLines={1}>
              {item.seller_name || item.store_name}
            </Text>
          </View>
        )}

        {item.city && (
          <View style={styles.foodCardMeta}>
            <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.foodCardMetaText}>{item.city}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.foodCardBtn, { backgroundColor: accentColor + '15', borderColor: accentColor + '40' }]}
          onPress={onPress}
        >
          <Text style={[styles.foodCardBtnText, { color: accentColor }]}>Voir l'annonce</Text>
          <Ionicons name="arrow-forward" size={13} color={accentColor} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty States ─────────────────────────────────────────────────────────────

function EmptyState({ tab, onPublish }: { tab: typeof SUB_TABS[0]; onPublish?: () => void }) {
  const router = useRouter();

  const MESSAGES: Record<string, { title: string; sub: string; cta?: string; mapCTA?: boolean }> = {
    dons:     {
      title: 'Aucun don ni surplus',
      sub: 'Partagez vos surplus de cuisine ou de jardin avec vos voisins.',
      cta: 'Faire un don',
      mapCTA: true,
    },
    antigaspi: {
      title: 'Aucun panier anti-gaspi',
      sub: 'Les commerçants locaux peuvent proposer leurs invendus ici.',
      cta: 'Proposer un panier',
      mapCTA: true,
    },
    circuits: {
      title: 'Aucun circuit court référencé',
      sub: 'Producteurs, épiceries, AMAP… référencez vos points de vente locaux.',
      cta: 'Référencer mon circuit',
      mapCTA: true,
    },
    aide: {
      title: 'Aucune structure référencée',
      sub: 'Épiceries solidaires, banques alimentaires, associations d\'aide. Ces points sont visibles sur la carte.',
      mapCTA: true,
    },
    mobile: {
      title: 'Aucun passage prévu',
      sub: 'Le planning Yondly Mobile est en cours de mise à jour pour votre zone.',
    },
  };
  const msg = MESSAGES[tab.key] ?? { title: '', sub: '' };

  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIconBox, { backgroundColor: tab.bg }]}>
        <Ionicons name={tab.icon as any} size={40} color={tab.color} />
      </View>
      <Text style={styles.emptyTitle}>{msg.title}</Text>
      <Text style={styles.emptySub}>{msg.sub}</Text>
      {onPublish && msg.cta && (
        <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: tab.color }]} onPress={onPublish}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.emptyBtnText}>{msg.cta}</Text>
        </TouchableOpacity>
      )}
      {msg.mapCTA && (
        <TouchableOpacity
          style={styles.emptyMapBtn}
          onPress={() => router.push('/carte?initialCategory=alimentaire' as any)}
        >
          <Ionicons name="map-outline" size={15} color={colors.primary} />
          <Text style={styles.emptyMapBtnText}>Voir sur la carte</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

type ViewMode = 'grid' | 'list';

export default function AlimentaireScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dons');
  const [items, setItems] = useState<Item[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const currentTab = SUB_TABS.find(t => t.key === activeTab)!;
  const showCTA = activeTab !== 'mobile';

  useEffect(() => { getUserLocation(); }, []);
  useEffect(() => {
    if (activeTab !== 'mobile') load();
    else { setLoading(false); setItems([]); setDeals([]); }
  }, [activeTab, userLocation]);

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
      if (activeTab === 'antigaspi') {
        const params: any = {};
        if (userLocation) { params.lat = userLocation.lat; params.lng = userLocation.lng; }
        const res = await axios.get(`${API_URL}/deals`, { params });
        setDeals(res.data);
        setItems([]);
      } else {
        const params: any = { type: 'donation' };
        if (userLocation) { params.lat = userLocation.lat; params.lng = userLocation.lng; }
        if (activeTab === 'circuits') params.category = 'Circuit court';
        if (activeTab === 'aide') params.category = 'Aide alimentaire';
        const res = await axios.get(`${API_URL}/items`, { params });
        const now = new Date();
        setItems(res.data.filter((i: Item) => !i.locked_until || new Date(i.locked_until) < now));
        setDeals([]);
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [activeTab, userLocation]);

  const displayItems = activeTab === 'antigaspi' ? deals : items;
  const filtered = displayItems.filter(i =>
    !searchQuery || i.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Alimentaire</Text>
          <View style={styles.headerActions}>
            {activeTab !== 'mobile' && activeTab !== 'aide' && (
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
              >
                <Ionicons
                  name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/messages' as any)}>
              <Ionicons name="chatbubbles-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        {activeTab !== 'mobile' && (
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher…"
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* ── Sub-tabs ── */}
      <View style={styles.subTabsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subTabsContent}
        >
          {SUB_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.subTab, active && { backgroundColor: tab.bg, borderColor: tab.color + '50' }]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={(active ? tab.icon : `${tab.icon}-outline`) as any}
                  size={15}
                  color={active ? tab.color : colors.textTertiary}
                />
                <Text style={[styles.subTabText, active && { color: tab.color, fontWeight: Typography.heavy as any }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      {activeTab === 'mobile' ? (
        <YondlyMobileCard />
      ) : loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={currentTab.color} />
        </View>
      ) : filtered.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={currentTab.color}
              colors={[currentTab.color]}
            />
          }
        >
          <EmptyState
            tab={currentTab}
            onPublish={currentTab.canPublish ? () => router.push('/post' as any) : undefined}
          />
        </ScrollView>
      ) : (
        <FlatList
          key={viewMode}
          data={filtered}
          numColumns={viewMode === 'grid' ? 2 : 1}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={currentTab.color}
              colors={[currentTab.color]}
            />
          }
          ListHeaderComponent={
            showCTA ? <FoodMapCTA count={FOOD_POINT_COUNT} category="alimentaire" /> : null
          }
          renderItem={({ item }) => (
            viewMode === 'grid' ? (
              <View style={styles.gridItem}>
                <FoodCard
                  item={item}
                  accentColor={currentTab.color}
                  onPress={() => router.push(`/item-detail?id=${item.id}` as any)}
                />
              </View>
            ) : (
              <FoodCard
                item={item}
                accentColor={currentTab.color}
                onPress={() => router.push(`/item-detail?id=${item.id}` as any)}
              />
            )
          )}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CARD_H_IMG = 140;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold as any,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
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

  // Sub-tabs
  subTabsBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: Spacing.sm,
  },
  subTabsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  subTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.surfaceAlt,
  },
  subTabText: {
    fontSize: Typography.sm,
    color: colors.textTertiary,
    fontWeight: Typography.medium as any,
  },

  // Grid
  gridRow: { gap: Spacing.md, paddingHorizontal: Spacing.lg },
  gridItem: { flex: 1 },
  listContent: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.md },

  // Food Card
  foodCard: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.card,
  },
  foodCardImg: {
    height: CARD_H_IMG,
    backgroundColor: colors.surfaceAlt,
    position: 'relative',
  },
  foodCardImgPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
  },
  foodCardBadges: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 4,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  priceBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: Typography.heavy as any,
  },
  timerBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  timerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: Typography.semibold as any,
  },
  foodCardBody: {
    padding: Spacing.md,
    gap: 4,
  },
  foodCardTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.heavy as any,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 2,
  },
  foodCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  foodCardMetaText: {
    fontSize: Typography.xs,
    color: colors.textTertiary,
    flex: 1,
  },
  foodCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: Spacing.sm,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  foodCardBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold as any,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl * 1.5,
    paddingTop: 60,
    gap: Spacing.md,
  },
  emptyIconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.heavy as any,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
    ...Shadows.card,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.heavy as any,
  },
  emptyMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    backgroundColor: colors.primaryLight,
  },
  emptyMapBtnText: {
    fontSize: Typography.sm,
    color: colors.primary,
    fontWeight: Typography.semibold as any,
  },
});
