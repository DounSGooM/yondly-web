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

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Sub-tabs ────────────────────────────────────────────────────────────────

const SUB_TABS = [
  { key: 'dons',     label: 'Dons & Surplus',  icon: 'leaf',       color: colors.primary, bg: colors.primaryLight, canPublish: true  },
  { key: 'antigaspi',label: 'Anti-gaspi',      icon: 'timer',      color: colors.accent,  bg: colors.accentLight,  canPublish: false },
  { key: 'circuits', label: 'Circuits courts', icon: 'storefront', color: '#059669',       bg: '#ECFDF5',           canPublish: false },
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
      {/* Image */}
      <View style={styles.foodCardImg}>
        {item.photos?.length > 0 ? (
          <Image source={{ uri: item.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.foodCardImgPlaceholder]}>
            <Ionicons name="nutrition-outline" size={36} color={colors.border} />
          </View>
        )}

        {/* Top badges */}
        <View style={styles.foodCardBadges}>
          <View style={[styles.priceBadge, { backgroundColor: isFree ? colors.primary : accentColor }]}>
            <Text style={styles.priceBadgeText}>{isFree ? 'Gratuit' : `${(item.price_cents / 100).toFixed(2)} €`}</Text>
          </View>
        </View>

        {/* Timer */}
        {hasTimer && (
          <View style={[styles.timerBadge, urgent && { backgroundColor: colors.error }]}>
            <Ionicons name="time-outline" size={11} color="#fff" />
            <Text style={styles.timerText}>{timeLeft(item.expires_at)}</Text>
          </View>
        )}
      </View>

      {/* Info */}
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

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ tab, onPublish }: { tab: typeof SUB_TABS[0]; onPublish?: () => void }) {
  const MESSAGES: Record<string, { title: string; sub: string; cta: string }> = {
    dons:     { title: 'Aucun don ni surplus', sub: 'Partagez vos surplus de cuisine ou de jardin avec vos voisins.', cta: 'Faire un don' },
    antigaspi:{ title: 'Aucun panier anti-gaspi', sub: 'Les commerçants locaux peuvent proposer leurs invendus ici.', cta: 'Proposer un panier' },
    circuits: { title: 'Aucun circuit court', sub: 'Producteurs, épiceries, AMAP… référencez vos points de vente locaux.', cta: 'Référencer mon circuit' },
  };
  const msg = MESSAGES[tab.key];

  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIconBox, { backgroundColor: tab.bg }]}>
        <Ionicons name={tab.icon as any} size={40} color={tab.color} />
      </View>
      <Text style={styles.emptyTitle}>{msg.title}</Text>
      <Text style={styles.emptySub}>{msg.sub}</Text>
      {onPublish && (
        <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: tab.color }]} onPress={onPublish}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.emptyBtnText}>{msg.cta}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

type ViewMode = 'grid' | 'list' | 'map';

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

  useEffect(() => { getUserLocation(); }, []);
  useEffect(() => { load(); }, [activeTab, userLocation]);

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
        // 'circuits' fetches producers + local shops (circuits courts)
        if (activeTab === 'circuits') params.category = 'Circuit court';
        // 'dons' fetches all donations (food + garden surplus)
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

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Alimentaire</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={toggleViewMode}>
              <Ionicons name={getViewIcon() as any} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/messages' as any)}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit…"
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
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={currentTab.color} />
        </View>
      ) : filtered.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={currentTab.color} colors={[currentTab.color]} />
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
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={currentTab.color} colors={[currentTab.color]} />
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
  searchBar: {
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
  proBadge: {
    backgroundColor: '#1A73E8',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: Typography.heavy as any,
    letterSpacing: 0.3,
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
});
