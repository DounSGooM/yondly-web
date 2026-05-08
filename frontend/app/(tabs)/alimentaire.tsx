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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Item } from '../../src/types';
import InteractiveMap from '../../src/components/InteractiveMap';
import ItemGridCard from '../../src/components/ItemGridCard';
import MarketHeader from '../../src/components/MarketHeader';
import * as Location from 'expo-location';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { API_URL } from '../../src/config/api';

const SUB_TABS = [
  { key: 'dons',       label: 'Dons',        icon: 'leaf',        color: colors.primary },
  { key: 'antigaspi',  label: 'Anti-gaspi',  icon: 'timer',       color: colors.accent },
  { key: 'producteurs',label: 'Producteurs', icon: 'storefront',  color: '#059669' },
  { key: 'surplus',    label: 'Surplus',     icon: 'flower',      color: '#7c3aed' },
  { key: 'circuits',   label: 'Circuits',    icon: 'bicycle',     color: '#0284c7' },
];

type ViewMode = 'grid' | 'list' | 'map';

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expiré';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

function DealCard({ deal, onPress }: { deal: any; onPress: () => void }) {
  const discountPct = deal.original_price_cents && deal.price_cents
    ? Math.round(((deal.original_price_cents - deal.price_cents) / deal.original_price_cents) * 100)
    : 0;
  const urgent = deal.expires_at && (new Date(deal.expires_at).getTime() - Date.now()) < 6 * 3600000;

  return (
    <TouchableOpacity style={styles.dealCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.dealImgBox}>
        {deal.photos?.length > 0 ? (
          <Image source={{ uri: deal.photos[0] }} style={styles.dealImg} resizeMode="cover" />
        ) : (
          <View style={[styles.dealImg, styles.dealImgPlaceholder]}>
            <Ionicons name="storefront-outline" size={28} color={colors.border} />
          </View>
        )}
        {discountPct > 0 && (
          <View style={styles.discountPill}>
            <Text style={styles.discountText}>-{discountPct}%</Text>
          </View>
        )}
        {deal.expires_at && (
          <View style={[styles.timerPill, urgent && { backgroundColor: colors.error }]}>
            <Ionicons name="time-outline" size={10} color="#fff" />
            <Text style={styles.timerText}>{timeLeft(deal.expires_at)}</Text>
          </View>
        )}
      </View>
      <View style={styles.dealInfo}>
        <Text style={styles.dealTitle} numberOfLines={2}>{deal.title}</Text>
        <Text style={styles.dealStore} numberOfLines={1}>{deal.store_name || deal.seller_name}</Text>
        <View style={styles.dealPriceRow}>
          <Text style={styles.dealPrice}>
            {deal.price_cents != null ? `${(deal.price_cents / 100).toFixed(2)} €` : 'Gratuit'}
          </Text>
          {discountPct > 0 && deal.original_price_cents && (
            <Text style={styles.dealOriginalPrice}>
              {(deal.original_price_cents / 100).toFixed(2)} €
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

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

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    load();
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
      } else {
        const params: any = { type: 'donation' };
        if (userLocation) { params.lat = userLocation.lat; params.lng = userLocation.lng; }
        if (activeTab === 'producteurs') params.category = 'Producteur local';
        if (activeTab === 'surplus') params.category = 'Surplus jardin';
        if (activeTab === 'circuits') params.category = 'Circuit court';
        const res = await axios.get(`${API_URL}/items`, { params });
        const now = new Date();
        setItems(res.data.filter((i: Item) => !i.locked_until || new Date(i.locked_until) < now));
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [activeTab, userLocation]);

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

  const activeTabData = SUB_TABS.find(t => t.key === activeTab)!;

  const filteredItems = items.filter(i =>
    !searchQuery || i.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDeals = deals.filter(d =>
    !searchQuery || d.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <MarketHeader
        title="Alimentaire"
        subtitle="Autour de moi…"
        location="Grand Poitiers"
        onViewToggle={toggleViewMode}
        viewModeIcon={getViewIcon()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMessagePress={() => router.push('/messages' as any)}
        accentColor={activeTabData.color}
      />

      {/* Sub-tabs */}
      <View style={styles.subTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabs}>
          {SUB_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.subTab, active && { borderBottomColor: tab.color, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={(active ? tab.icon : `${tab.icon}-outline`) as any}
                  size={15}
                  color={active ? tab.color : colors.textTertiary}
                />
                <Text style={[styles.subTabText, active && { color: tab.color, fontWeight: Typography.semibold as any }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={activeTabData.color} />
        </View>
      ) : activeTab === 'antigaspi' ? (
        viewMode === 'map' ? (
          <InteractiveMap
            items={filteredDeals}
            userLocation={userLocation}
            onItemPress={(id: string) => router.push(`/item-detail?id=${id}` as any)}
          />
        ) : (
          <FlatList
            data={filteredDeals}
            renderItem={({ item }) => (
              <DealCard deal={item} onPress={() => router.push(`/item-detail?id=${item.id}` as any)} />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.accent} colors={[colors.accent]} />
            }
            ListEmptyComponent={<EmptyState icon="timer-outline" title="Aucun deal disponible" sub="Revenez plus tard pour des offres anti-gaspi" />}
          />
        )
      ) : viewMode === 'map' ? (
        <InteractiveMap
          items={filteredItems}
          userLocation={userLocation}
          onItemPress={(id: string) => router.push(`/item-detail?id=${id}` as any)}
        />
      ) : (
        <FlatList
          key={viewMode}
          data={filteredItems}
          renderItem={({ item }) => (
            <View style={{ flex: viewMode === 'grid' ? 0.5 : 1 }}>
              <ItemGridCard item={item} layout={viewMode === 'list' ? 'list' : 'grid'} />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={activeTabData.color} colors={[activeTabData.color]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={`${activeTabData.icon}-outline` as any}
              title={`Aucun contenu — ${activeTabData.label}`}
              sub="Soyez le premier à partager ici !"
            />
          }
        />
      )}
    </View>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon as any} size={56} color={colors.border} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  subTabsWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  subTabs: {
    paddingHorizontal: Spacing.md,
    gap: 0,
  },
  subTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabText: {
    fontSize: Typography.sm,
    color: colors.textTertiary,
  },

  gridRow: { justifyContent: 'space-between', gap: Spacing.md },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },

  // Deal card
  dealCard: {
    flex: 0.5,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  dealImgBox: { position: 'relative' },
  dealImg: { width: '100%', aspectRatio: 1 },
  dealImgPlaceholder: {
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountPill: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.accent,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: { color: '#fff', fontSize: 10, fontWeight: Typography.heavy as any },
  timerPill: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  timerText: { color: '#fff', fontSize: 10, fontWeight: Typography.semibold as any },
  dealInfo: { padding: Spacing.sm },
  dealTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold as any, color: colors.textPrimary, marginBottom: 2 },
  dealStore: { fontSize: Typography.xs, color: colors.textTertiary, marginBottom: Spacing.xs },
  dealPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  dealPrice: { fontSize: Typography.base, fontWeight: Typography.heavy as any, color: colors.accent },
  dealOriginalPrice: { fontSize: Typography.xs, color: colors.textTertiary, textDecorationLine: 'line-through' },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold as any, color: colors.textSecondary, marginTop: Spacing.lg },
  emptySub: { fontSize: Typography.sm, color: colors.textTertiary, marginTop: Spacing.sm, textAlign: 'center' },
});
