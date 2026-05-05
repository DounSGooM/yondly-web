import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Item } from '../../src/types';
import InteractiveMap from '../../src/components/InteractiveMap';
import ItemGridCard from '../../src/components/ItemGridCard';
import MarketHeader from '../../src/components/MarketHeader';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors, Typography, Spacing, BorderRadius } from '../../src/theme';
import { API_URL } from '../../src/config/api';

type ViewMode = 'grid' | 'list' | 'map';

export default function FoodScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    getUserLocation();
    fetchItems();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
    } catch {}
  };

  const fetchItems = async () => {
    try {
      const params: any = { type: 'donation' };
      if (userLocation) { params.lat = userLocation.lat; params.lng = userLocation.lng; }
      const response = await axios.get(`${API_URL}/items`, { params });
      const now = new Date();
      setItems(response.data.filter((item: Item) => !item.locked_until || new Date(item.locked_until) < now));
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

  const filtered = items.filter(i =>
    !searchQuery || i.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MarketHeader
        title="Donner"
        subtitle="Dons autour de moi…"
        location="Grand Poitiers"
        onViewToggle={toggleViewMode}
        viewModeIcon={getViewIcon()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMessagePress={() => router.push('/messages' as any)}
        accentColor={colors.primary}
      />

      {viewMode === 'map' ? (
        <InteractiveMap
          items={filtered}
          userLocation={userLocation}
          onItemPress={(id: string) => router.push(`/item-detail?id=${id}` as any)}
        />
      ) : (
        <FlatList
          key={viewMode}
          data={filtered}
          renderItem={({ item }) => (
            <View style={{ flex: viewMode === 'grid' ? 0.5 : 1 }}>
              <ItemGridCard item={item} layout={viewMode === 'list' ? 'list' : 'grid'} />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchItems(); }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="leaf-outline" size={56} color={colors.border} />
              <Text style={styles.emptyTitle}>Aucun don disponible</Text>
              <Text style={styles.emptySub}>Soyez le premier à donner quelque chose !</Text>
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
  gridRow: { justifyContent: 'space-between', gap: Spacing.md },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: colors.textSecondary, marginTop: Spacing.lg },
  emptySub: { fontSize: Typography.sm, color: colors.textTertiary, marginTop: Spacing.sm, textAlign: 'center' },
});
