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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Item } from '../../src/types';
import InteractiveMap from '../../src/components/InteractiveMap';
import { useAuthStore } from '../../src/store/authStore';
import * as Location from 'expo-location';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { API_URL } from '../../src/config/api';

const FILTERS = [
  { key: 'all',        label: 'Tout',        icon: 'apps' },
  { key: 'dons',       label: 'Dons',        icon: 'leaf' },
  { key: 'antigaspi',  label: 'Anti-gaspi',  icon: 'timer' },
  { key: 'producteurs',label: 'Producteurs', icon: 'storefront' },
  { key: 'reemploi',   label: 'Réemploi',    icon: 'swap-horizontal' },
];

function distanceLabel(item: any, userLoc: { lat: number; lng: number } | null): string {
  if (!userLoc || !item.location) return '';
  const lat = item.location?.lat ?? item.location?.coordinates?.[1];
  const lng = item.location?.lng ?? item.location?.coordinates?.[0];
  if (!lat || !lng) return '';
  const R = 6371;
  const dLat = ((lat - userLoc.lat) * Math.PI) / 180;
  const dLng = ((lng - userLoc.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLoc.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

function NearbyCard({ item, userLoc, onPress }: { item: any; userLoc: any; onPress: () => void }) {
  const dist = distanceLabel(item, userLoc);
  const isFree = item.price_cents == null || item.price_cents === 0;
  const isAntigaspi = item.expires_at != null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.cardImg}>
        {item.photos?.length > 0 ? (
          <Image source={{ uri: item.photos[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.cardImgPlaceholder]}>
            <Ionicons name="image-outline" size={28} color={colors.border} />
          </View>
        )}
        {/* Badge type */}
        <View style={[styles.badge, isAntigaspi ? styles.badgeAntigaspi : isFree ? styles.badgeFree : styles.badgeSale]}>
          <Text style={styles.badgeText}>{isAntigaspi ? 'Anti-gaspi' : isFree ? 'Don' : `${(item.price_cents / 100).toFixed(0)} €`}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>

        <View style={styles.cardMeta}>
          {dist ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
              <Text style={styles.metaText}>{dist}</Text>
            </View>
          ) : null}
          {item.seller_name || item.store_name ? (
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={12} color={colors.textTertiary} />
              <Text style={styles.metaText} numberOfLines={1}>{item.seller_name || item.store_name}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.cardBtn} onPress={onPress}>
          <Ionicons name="eye-outline" size={13} color={colors.primary} />
          <Text style={styles.cardBtnText}>Voir</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

type SectionData = { title: string; icon: string; color: string; items: any[]; route: string };

export default function AccueilScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [donations, setDonations] = useState<Item[]>([]);
  const [sales, setSales] = useState<Item[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    getUserLocation();
    fetchAll();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {}
  };

  const fetchAll = useCallback(async () => {
    try {
      const params: any = {};
      if (userLocation) { params.lat = userLocation.lat; params.lng = userLocation.lng; }
      const [donRes, saleRes, dealRes] = await Promise.allSettled([
        axios.get(`${API_URL}/items`, { params: { ...params, type: 'donation' } }),
        axios.get(`${API_URL}/items`, { params: { ...params, type: 'sale' } }),
        axios.get(`${API_URL}/deals`, { params }),
      ]);
      const now = new Date();
      if (donRes.status === 'fulfilled')
        setDonations(donRes.value.data.filter((i: Item) => !i.locked_until || new Date(i.locked_until) < now).slice(0, 8));
      if (saleRes.status === 'fulfilled')
        setSales(saleRes.value.data.filter((i: Item) => !i.locked_until || new Date(i.locked_until) < now).slice(0, 8));
      if (dealRes.status === 'fulfilled')
        setDeals(dealRes.value.data.slice(0, 8));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [userLocation]);

  const allItems = [...donations, ...deals, ...sales];

  const filteredItems = (() => {
    switch (activeFilter) {
      case 'dons':        return donations;
      case 'antigaspi':   return deals;
      case 'producteurs': return donations.filter(i => (i as any).category === 'Producteur local');
      case 'reemploi':    return sales;
      default:            return allItems;
    }
  })();

  const sections: SectionData[] = [
    { title: 'Dons alimentaires', icon: 'leaf', color: colors.primary, items: donations, route: '/(tabs)/alimentaire' },
    { title: 'Anti-gaspi du moment', icon: 'timer', color: colors.accent, items: deals, route: '/(tabs)/alimentaire' },
    { title: 'Réemploi local', icon: 'swap-horizontal', color: colors.info, items: sales, route: '/(tabs)/reemploi' },
  ];

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={colors.primary} colors={[colors.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour{user ? ` ${user.display_name?.split(' ')[0]}` : ''} 👋</Text>
          <Text style={styles.subtitle}>Voici ce qui se passe près de chez vous</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/messages' as any)}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filtersWrapper}>
        {FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.75}
            >
              <Ionicons name={(active ? f.icon : `${f.icon}-outline`) as any} size={14} color={active ? '#fff' : colors.textSecondary} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Map hero */}
      <View style={styles.mapSection}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Autour de moi</Text>
          <TouchableOpacity onPress={() => setShowMap(v => !v)} style={styles.mapToggle}>
            <Ionicons name={showMap ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {showMap && (
          <View style={styles.mapContainer}>
            <InteractiveMap
              items={filteredItems}
              userLocation={userLocation}
              onItemPress={(id) => router.push(`/item-detail?id=${id}` as any)}
            />
          </View>
        )}
      </View>

      {/* Nearby section — filtered cards */}
      <View style={styles.nearbySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>À proximité</Text>
          <Text style={styles.sectionCount}>{filteredItems.length} résultat{filteredItems.length !== 1 ? 's' : ''}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsList}>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="search-outline" size={32} color={colors.border} />
              <Text style={styles.emptyText}>Aucun contenu pour ce filtre</Text>
            </View>
          ) : (
            filteredItems.map((item) => (
              <NearbyCard
                key={item.id}
                item={item}
                userLoc={userLocation}
                onPress={() => router.push(`/item-detail?id=${item.id}` as any)}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Sections par univers */}
      {sections.map((section) => (
        <View key={section.title} style={styles.universeSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: section.color + '18' }]}>
              <Ionicons name={section.icon as any} size={15} color={section.color} />
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <TouchableOpacity onPress={() => router.push(section.route as any)} style={styles.seeAll}>
              <Text style={[styles.seeAllText, { color: section.color }]}>Tout voir</Text>
              <Ionicons name="chevron-forward" size={13} color={section.color} />
            </TouchableOpacity>
          </View>

          {section.items.length === 0 ? (
            <Text style={styles.emptyInline}>Aucun contenu pour l'instant</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsList}>
              {section.items.map((item) => (
                <NearbyCard
                  key={item.id}
                  item={item}
                  userLoc={userLocation}
                  onPress={() => router.push(`/item-detail?id=${item.id}` as any)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      ))}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const CARD_WIDTH = 180;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: Spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  greeting: { fontSize: Typography.xl, fontWeight: Typography.heavy as any, color: colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: colors.textSecondary, marginTop: 2 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },

  filtersWrapper: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  filters: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full, backgroundColor: colors.surfaceAlt,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: Typography.xs, fontWeight: Typography.semibold as any, color: colors.textSecondary },
  chipTextActive: { color: '#fff' },

  mapSection: { margin: Spacing.xl, marginBottom: 0 },
  mapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  mapTitle: { fontSize: Typography.base, fontWeight: Typography.heavy as any, color: colors.textPrimary },
  mapToggle: { padding: 4 },
  mapContainer: {
    height: 240,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },

  nearbySection: { marginTop: Spacing.xl },
  universeSection: { marginTop: Spacing.xl },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.md, gap: Spacing.sm,
  },
  sectionIconBox: {
    width: 28, height: 28, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { flex: 1, fontSize: Typography.base, fontWeight: Typography.heavy as any, color: colors.textPrimary },
  sectionCount: { fontSize: Typography.xs, color: colors.textTertiary },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: Typography.sm, fontWeight: Typography.semibold as any },

  cardsList: { paddingHorizontal: Spacing.xl, gap: Spacing.md, paddingBottom: 4 },

  // NearbyCard
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardImg: {
    width: CARD_WIDTH,
    height: 120,
    backgroundColor: colors.surfaceAlt,
    position: 'relative',
  },
  cardImgPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  badge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeFree: { backgroundColor: colors.primary },
  badgeAntigaspi: { backgroundColor: colors.accent },
  badgeSale: { backgroundColor: colors.info },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: Typography.heavy as any },

  cardBody: { padding: Spacing.sm },
  cardTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold as any, color: colors.textPrimary, marginBottom: 4 },
  cardMeta: { gap: 3, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Typography.xs, color: colors.textTertiary },
  cardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: colors.primaryLight,
    alignSelf: 'flex-start',
  },
  cardBtnText: { fontSize: Typography.xs, fontWeight: Typography.semibold as any, color: colors.primary },

  emptyCard: { width: 200, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText: { fontSize: Typography.sm, color: colors.textTertiary, textAlign: 'center' },
  emptyInline: { fontSize: Typography.sm, color: colors.textTertiary, fontStyle: 'italic', paddingHorizontal: Spacing.xl },
});
