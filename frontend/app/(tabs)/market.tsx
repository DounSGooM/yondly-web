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
  TextInput,
  ScrollView,
  Alert,
  Modal,
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

import { API_URL } from '../../src/config/api';

const CATEGORIES = [
  { name: 'Tous', icon: 'apps' },
  { name: 'Maison', icon: 'home' },
  { name: 'Vêtements', icon: 'shirt' },
  { name: 'Électronique', icon: 'phone-portrait' },
  { name: 'Multimédia', icon: 'laptop' },
  { name: 'Véhicules', icon: 'car' },
  { name: 'Sport', icon: 'basketball' },
  { name: 'Livres', icon: 'book' },
  { name: 'Enfants', icon: 'happy' },
  { name: 'Jeux & Jouets', icon: 'game-controller' },
  { name: 'Jardin', icon: 'leaf' },
  { name: 'Bricolage', icon: 'hammer' },
  { name: 'Beauté', icon: 'sparkles' },
  { name: 'Animaux', icon: 'paw' },
  { name: 'Musique', icon: 'musical-notes' },
  { name: 'Mobilier', icon: 'bed' },
  { name: 'Autre', icon: 'ellipsis-horizontal' },
];

type ViewMode = 'grid' | 'map' | 'list';

export default function MarketScreen() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);

  const handleSaveSearch = async () => {
    if (!searchQuery.trim() && selectedCategory === 'Tous') {
      Alert.alert('Info', 'Veuillez entrer une recherche ou sélectionner une catégorie.');
      return;
    }

    const ALLOWED_LEVELS = ['Pousse', 'Arbre', 'Forêt'];
    if (!user || user.level === 'Graine' || !ALLOWED_LEVELS.includes(user.level)) {
      // Also check if they are explicity 'Graine' to be sure
      if (!user || user.level === 'Graine') {
        Alert.alert(
          'Fonctionnalité Pousse 🌱',
          'Sauvegarder des recherches est réservé aux membres Pousse et plus. Continuez à utiliser l\'app pour monter en niveau !',
          [{ text: 'Compris' }]
        );
        return;
      }
    }

    try {
      await axios.post(`${API_URL}/saved-searches`, {
        query: searchQuery,
        category: selectedCategory !== 'Tous' ? selectedCategory : null,
        alert_enabled: true
      }, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert('Succès', 'Recherche sauvegardée avec succès !');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la recherche.');
    }
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    minPrice: '',
    maxPrice: '',
    conditions: [],
    sortBy: 'date_desc',
    radiusKm: null
  });

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    getUserLocation();

    // Simple debounce for search
    const delayDebounceFn = setTimeout(() => {
      fetchItems();
    }, 500);

    fetchUnreadNotifications();

    return () => clearTimeout(delayDebounceFn);
  }, [selectedCategory, filters, searchQuery]);

  const fetchUnreadNotifications = async () => {
    try {
      if (!token) return;
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadNotifications(response.data.count);
    } catch (error) {

    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {

        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const params: any = { type: 'sale' }; // Market tab shows only sales

      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }

      // Add category filter if not 'Tous'
      if (selectedCategory !== 'Tous') {
        params.category = selectedCategory;
      }

      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      if (filters.minPrice) params.min_price = parseInt(filters.minPrice);
      if (filters.maxPrice) params.max_price = parseInt(filters.maxPrice);
      if (filters.conditions.length > 0) params.condition = filters.conditions;
      if (filters.sortBy) params.sort_by = filters.sortBy;
      if (filters.radiusKm) params.radius_km = filters.radiusKm;

      const response = await axios.get(`${API_URL}/items`, { params });
      let fetchedItems = response.data;

      // Filter out locked/reserved items
      const now = new Date();
      const availableItems = fetchedItems.filter((item: Item) => {
        if (!item.locked_until) return true;
        return new Date(item.locked_until) < now;
      });

      setItems(availableItems);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleOpenFilters = () => {
    const ALLOWED_LEVELS = ['Arbre', 'Forêt'];
    if (!user || user.level === 'Graine' || user.level === 'Pousse' || !ALLOWED_LEVELS.includes(user.level)) {
      // Explicit check
      if (!user || ['Graine', 'Pousse'].includes(user.level)) {
        Alert.alert(
          'Fonctionnalité Arbre 🌳',
          'Les filtres avancés (distance précise, note vendeur) sont réservés aux Arbres. Continuez vos efforts !',
          [{ text: 'Compris' }]
        );
        return;
      }
    }
    setShowFilters(true);
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      conditions: [],
      sortBy: 'date_desc',
      radiusKm: null
    });
    setShowFilters(false);
  };

  // ...

  const toggleViewMode = () => {
    // Circle: Grid -> List -> Map -> Grid
    if (viewMode === 'grid') setViewMode('list');
    else if (viewMode === 'list') setViewMode('map');
    else setViewMode('grid');
  };

  const getViewIcon = () => {
    // Show icon for the NEXT state to indicate action
    if (viewMode === 'grid') return 'list-outline';
    if (viewMode === 'list') return 'map-outline';
    return 'grid-outline';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4C7B4B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MarketHeader
        location="Poitiers" // Could be dynamic
        onLocationPress={() => { }} // Future
        onNotificationPress={() => router.push('/notifications' as any)}
        onMessagePress={() => router.push('/messages' as any)}
        onViewToggle={toggleViewMode}
        viewModeIcon={getViewIcon()}
        notificationCount={unreadNotifications}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterPress={handleOpenFilters}
        onSaveSearchPress={handleSaveSearch}
        showSaveSearch={searchQuery.length > 0 || selectedCategory !== 'Tous'}
        activeFilters={!!(filters.minPrice || filters.maxPrice || filters.conditions.length > 0 || filters.radiusKm)}
      />

      {/* Category Dropdown */}

      {/* Category Dropdown */}
      <View style={styles.categorySelector}>
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => setShowCategoryMenu(!showCategoryMenu)}
        >
          <View style={styles.categoryButtonContent}>
            <Ionicons
              name={CATEGORIES.find(c => c.name === selectedCategory)?.icon as any}
              size={20}
              color="#4C7B4B"
            />
            <Text style={styles.categoryButtonText}>{selectedCategory}</Text>
          </View>
          <Ionicons
            name={showCategoryMenu ? "chevron-up" : "chevron-down"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>

        {showCategoryMenu && (
          <View style={styles.categoryMenu}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', padding: 8 }} style={{ maxHeight: 350 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.menuItem,
                    selectedCategory === cat.name && styles.menuItemActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat.name);
                    setShowCategoryMenu(false);
                  }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={selectedCategory === cat.name ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.menuText,
                      selectedCategory === cat.name && styles.menuTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {(filters.minPrice || filters.radiusKm || filters.conditions.length > 0) && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          {filters.minPrice && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', padding: 6, borderRadius: 16 }}>
              <Text style={{ fontSize: 12, color: '#4C7B4B' }}>Min {filters.minPrice}€</Text>
              <TouchableOpacity onPress={() => setFilters({ ...filters, minPrice: '' })}>
                <Ionicons name="close" size={14} color="#4C7B4B" />
              </TouchableOpacity>
            </View>
          )}
          {filters.radiusKm && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', padding: 6, borderRadius: 16 }}>
              <Text style={{ fontSize: 12, color: '#4C7B4B' }}>📍 &lt;{filters.radiusKm}km</Text>
              <TouchableOpacity onPress={() => setFilters({ ...filters, radiusKm: null })}>
                <Ionicons name="close" size={14} color="#4C7B4B" />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={clearFilters}>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 4, textDecorationLine: 'underline' }}>Tout effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Product Grid / List / Map */}
      {viewMode === 'map' ? (
        <InteractiveMap
          items={items}
          userLocation={userLocation}
          onItemPress={(itemId: string) => router.push(`/item-detail?id=${itemId}` as any)}
        />
      ) : (
        <FlatList
          key={viewMode} // Force re-render on mode change
          data={items}
          renderItem={({ item }) => (
            <View style={{ flex: viewMode === 'grid' ? 0.5 : 1 }}>
              <ItemGridCard item={item} layout={viewMode === 'list' ? 'list' : 'grid'} />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between', gap: 12 } : undefined}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun article trouvé</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4C7B4B']}
              tintColor={'#4C7B4B'}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      {viewMode !== 'map' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/post/market' as any)}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {/* FILTER MODAL */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setShowFilters(false);
        }}
        initialFilters={filters}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  // Header styles removed (moved to MarketHeader)
  categorySelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
    zIndex: 1000,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4C7B4B',
    backgroundColor: '#fff',
  },
  categoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4C7B4B',
  },
  categoryMenu: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 400,
    zIndex: 2000,
  },
  categoryMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  categoryMenuItemActive: {
    backgroundColor: '#e8f5e9',
  },
  categoryMenuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  categoryMenuTextActive: {
    color: '#4C7B4B',
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    width: '30%',
    margin: '1.5%',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  menuItemActive: {
    backgroundColor: '#4C7B4B',
  },
  menuText: {
    fontSize: 14,
    color: '#333',
  },
  menuTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4C7B4B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    marginRight: '2%',
  },
  listCard: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    height: 120,
  },
  listImageContainer: {
    width: 120,
    height: '100%',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  listCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4C7B4B',
  },
  freeBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeText: {
    color: '#4C7B4B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 12,
    color: '#666',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
});
