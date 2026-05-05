import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import InteractiveMap from '../../src/components/InteractiveMap';
import MarketHeader from '../../src/components/MarketHeader';
import * as Location from 'expo-location';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { API_URL } from '../../src/config/api';

type ViewMode = 'grid' | 'list' | 'map';

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expiré';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function DealCard({ deal, onPress }: { deal: any; onPress: () => void }) {
  const discountPct = deal.original_price_cents && deal.price_cents
    ? Math.round(((deal.original_price_cents - deal.price_cents) / deal.original_price_cents) * 100)
    : 0;
  const urgent = deal.expires_at && (new Date(deal.expires_at).getTime() - Date.now()) < 6 * 3600000;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Image */}
      <View style={styles.imgBox}>
        {deal.photos?.length > 0 ? (
          <Image source={{ uri: deal.photos[0] }} style={styles.img} resizeMode="cover" />
        ) : (
          <View style={[styles.img, styles.imgPlaceholder]}>
            <Ionicons name="storefront-outline" size={32} color={colors.border} />
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

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{deal.title}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {deal.price_cents ? `${(deal.price_cents / 100).toFixed(0)} €` : 'Gratuit'}
          </Text>
          {deal.original_price_cents > 0 && (
            <Text style={styles.originalPrice}>
              {(deal.original_price_cents / 100).toFixed(0)} €
            </Text>
          )}
        </View>

        {deal.store?.name && (
          <View style={styles.storeRow}>
            <Ionicons name="storefront" size={11} color={colors.textTertiary} />
            <Text style={styles.storeName} numberOfLines={1}>{deal.store.name}</Text>
          </View>
        )}

        {deal.distance_km !== undefined && (
          <View style={styles.metaRow}>
            <Ionicons name="location-sharp" size={11} color={colors.accent} />
            <Text style={styles.metaText}>
              {deal.distance_km < 1
                ? `${(deal.distance_km * 1000).toFixed(0)} m`
                : `${deal.distance_km.toFixed(1)} km`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function AntiGaspiScreen() {
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    getUserLocation();
    fetchDeals();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {}
  };

  const fetchDeals = async () => {
    try {
      const params: any = {};
      if (userLocation) { params.lat = userLocation.lat; params.lng = userLocation.lng; }
      const res = await axios.get(`${API_URL}/deals`, { params });
      const now = new Date();
      const active = (res.data || []).filter((d: any) => {
        if (d.status !== 'active') return false;
        if (d.expires_at) return new Date(d.expires_at) > now;
        return true;
      }).map((d: any) => ({
        ...d,
        photos: d.store?.logo ? [d.store.logo] : [],
        price_cents: d.deal_price ? Math.round(d.deal_price * 100) : 0,
        original_price_cents: d.original_price ? Math.round(d.original_price * 100) : 0,
        distance_km: d.store?.distance_km,
      }));
      setDeals(active);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

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

  const filtered = deals.filter(d =>
    !searchQuery || d.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MarketHeader
        title="Sauver"
        subtitle="Invendus autour de moi…"
        location="Grand Poitiers"
        onViewToggle={toggleViewMode}
        viewModeIcon={getViewIcon()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMessagePress={() => router.push('/messages' as any)}
        accentColor={colors.accent}
      />

      {/* Urgency banner */}
      {filtered.some(d => d.expires_at && (new Date(d.expires_at).getTime() - Date.now()) < 3600000) && (
        <View style={styles.urgencyBanner}>
          <Ionicons name="flame" size={14} color="#fff" />
          <Text style={styles.urgencyBannerText}>Des paniers expirent dans moins d'1h !</Text>
        </View>
      )}

      {viewMode === 'map' ? (
        <InteractiveMap
          items={filtered}
          userLocation={userLocation}
          onItemPress={(id: string) => router.push(`/store-detail?id=${id}` as any)}
        />
      ) : (
        <FlatList
          key={viewMode}
          data={filtered}
          renderItem={({ item }) => (
            <View style={{ flex: viewMode === 'grid' ? 0.5 : 1 }}>
              <DealCard
                deal={item}
                onPress={() => router.push(`/store-detail?id=${item.store?.id}` as any)}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchDeals(); }}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="storefront-outline" size={56} color={colors.border} />
              <Text style={styles.emptyTitle}>Aucun panier disponible</Text>
              <Text style={styles.emptySub}>Les paniers anti-gaspi des commerces locaux apparaîtront ici</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
  },
  urgencyBannerText: {
    color: '#fff',
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  gridRow: { justifyContent: 'space-between', gap: Spacing.md },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },

  // DealCard
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  imgBox: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceAlt,
  },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  discountPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  discountText: { color: '#fff', fontSize: 10, fontWeight: Typography.bold },
  timerPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  timerText: { color: '#fff', fontSize: 10, fontWeight: Typography.bold },
  info: { padding: Spacing.md, gap: 3 },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  price: { fontSize: Typography.base, fontWeight: Typography.bold, color: colors.accent },
  originalPrice: {
    fontSize: Typography.xs,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  storeName: { fontSize: 11, color: colors.textTertiary, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: colors.accent, fontWeight: Typography.semibold },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: colors.textSecondary,
    marginTop: Spacing.lg,
  },
  emptySub: {
    fontSize: Typography.sm,
    color: colors.textTertiary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
