import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Item } from '../../src/types';
import { useAuthStore } from '../../src/store/authStore';
import InteractiveMap from '../../src/components/InteractiveMap';
import ItemGridCard from '../../src/components/ItemGridCard';
import MarketHeader from '../../src/components/MarketHeader';
import FilterModal, { FilterState } from '../../src/components/FilterModal';
import * as Location from 'expo-location';
import { colors, Typography, Spacing, BorderRadius } from '../../src/theme';
import { API_URL } from '../../src/config/api';

const CATEGORIES = [
  { name: 'Tous',          icon: 'apps-outline' },
  { name: 'Maison',        icon: 'home-outline' },
  { name: 'Vêtements',     icon: 'shirt-outline' },
  { name: 'Électronique',  icon: 'phone-portrait-outline' },
  { name: 'Multimédia',    icon: 'laptop-outline' },
  { name: 'Sport',         icon: 'basketball-outline' },
  { name: 'Livres',        icon: 'book-outline' },
  { name: 'Enfants',       icon: 'happy-outline' },
  { name: 'Jouets',        icon: 'game-controller-outline' },
  { name: 'Bricolage',     icon: 'hammer-outline' },
  { name: 'Musique',       icon: 'musical-notes-outline' },
  { name: 'Animaux',       icon: 'paw-outline' },
  { name: 'Services',      icon: 'construct-outline' },
  { name: 'Troc',          icon: 'swap-horizontal-outline' },
  { name: 'Autre',         icon: 'ellipsis-horizontal-outline' },
];

type ViewMode = 'grid' | 'list' | 'map';

export default function ReemploiScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
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

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchItems(), 400);
    return () => clearTimeout(t);
  }, [selectedCategory, filters, searchQuery, userLocation]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {}
  };

  const fetchItems = async () => {
    try {
      const params: any = { type: 'sale' };
      if (userLocation) { params.lat = userLocation.lat; params.lng = userLocation.lng; }
      if (selectedCategory !== 'Tous') params.category = selectedCategory;
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (filters.minPrice) params.min_price = parseInt(filters.minPrice);
      if (filters.maxPrice) params.max_price = parseInt(filters.maxPrice);
      if (filters.conditions.length > 0) params.condition = filters.conditions;
      if (filters.sortBy) params.sort_by = filters.sortBy;
      if (filters.radiusKm) params.radius_km = filters.radiusKm;

      const res = await axios.get(`${API_URL}/items`, { params });
      const now = new Date();
      setItems(res.data.filter((i: Item) => !i.locked_until || new Date(i.locked_until) < now));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleOpenFilters = () => {
    if (!user || ['Graine', 'Pousse'].includes(user.level)) {
      Alert.alert('Fonctionnalité Arbre 🌳', 'Les filtres avancés sont réservés aux membres Arbre.', [{ text: 'Compris' }]);
      return;
    }
    setShowFilters(true);
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

  const hasActiveFilters = !!(filters.minPrice || filters.maxPrice || filters.conditions.length > 0 || filters.radiusKm);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.info} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MarketHeader
        title="Réemploi"
        subtitle="Autour de moi…"
        location="Grand Poitiers"
        onViewToggle={toggleViewMode}
        viewModeIcon={getViewIcon()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMessagePress={() => router.push('/messages' as any)}
        onFilterPress={handleOpenFilters}
        activeFilters={hasActiveFilters}
        accentColor={colors.info}
      />

      {/* Category chips */}
      <View style={styles.chipsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.name}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedCategory(cat.name)}
                activeOpacity={0.75}
              >
                <Ionicons name={cat.icon as any} size={14} color={active ? '#fff' : colors.textSecondary} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <View style={styles.filterPills}>
          {filters.minPrice ? (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>Min {filters.minPrice}€</Text>
              <TouchableOpacity onPress={() => setFilters({ ...filters, minPrice: '' })}>
                <Ionicons name="close" size={12} color={colors.info} />
              </TouchableOpacity>
            </View>
          ) : null}
          {filters.radiusKm ? (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>&lt;{filters.radiusKm}km</Text>
              <TouchableOpacity onPress={() => setFilters({ ...filters, radiusKm: null })}>
                <Ionicons name="close" size={12} color={colors.info} />
              </TouchableOpacity>
            </View>
          ) : null}
          <TouchableOpacity onPress={() => setFilters({ minPrice: '', maxPrice: '', conditions: [], sortBy: 'date_desc', radiusKm: null })}>
            <Text style={styles.clearFilters}>Tout effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      {viewMode === 'map' ? (
        <InteractiveMap
          items={items}
          userLocation={userLocation}
          onItemPress={(id: string) => router.push(`/item-detail?id=${id}` as any)}
        />
      ) : (
        <FlatList
          key={viewMode}
          data={items}
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
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} colors={[colors.info]} tintColor={colors.info} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="swap-horizontal-outline" size={56} color={colors.border} />
              <Text style={styles.emptyTitle}>Aucun article trouvé</Text>
              <Text style={styles.emptySub}>Essayez d'autres catégories ou élargissez votre zone</Text>
            </View>
          }
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  chipsWrapper: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  chips: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: BorderRadius.full, backgroundColor: colors.surfaceAlt,
  },
  chipActive: { backgroundColor: colors.info },
  chipText: { fontSize: Typography.xs, fontWeight: Typography.semibold as any, color: colors.textSecondary },
  chipTextActive: { color: '#fff' },

  filterPills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: colors.surface },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E3F0FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full },
  filterPillText: { fontSize: Typography.xs, color: colors.info, fontWeight: Typography.semibold as any },
  clearFilters: { fontSize: Typography.xs, color: colors.textTertiary, textDecorationLine: 'underline', paddingVertical: 5 },

  gridRow: { justifyContent: 'space-between', gap: Spacing.md },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold as any, color: colors.textSecondary, marginTop: Spacing.lg },
  emptySub: { fontSize: Typography.sm, color: colors.textTertiary, marginTop: Spacing.sm, textAlign: 'center' },
});
