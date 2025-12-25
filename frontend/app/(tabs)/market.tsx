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
import * as Location from 'expo-location';

import { API_URL } from '../../src/config/api';

const CATEGORIES = [
  { name: 'Tous', icon: 'apps' },
  { name: 'Maison', icon: 'home' },
  { name: 'Textile', icon: 'shirt' },
  { name: 'Livres', icon: 'book' },
  { name: 'Sport', icon: 'basketball' },
  { name: 'Électronique', icon: 'phone-portrait' },
  { name: 'Enfants', icon: 'happy' },
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
  const [minRating, setMinRating] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    getUserLocation();
    fetchItems();
    fetchUnreadNotifications();
  }, [selectedCategory, minRating, radiusKm]);

  const fetchUnreadNotifications = async () => {
    try {
      if (!token) return;
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadNotifications(response.data.count);
    } catch (error) {
      console.log('Error fetching unread notifications');
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
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

      if (minRating) params.min_rating = minRating;
      if (radiusKm) params.radius_km = radiusKm;

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
    setMinRating(null);
    setRadiusKm(null);
    setShowFilters(false);
  };

  const formatPrice = (item: Item) => {
    if (item.type === 'donation') return 'FREE';
    if (item.type === 'rent' && item.price_per_day_cents) {
      return `€${(item.price_per_day_cents / 100).toFixed(0)}`;
    }
    if (item.price_cents) {
      return `€${(item.price_cents / 100).toFixed(0)}`;
    }
    return '';
  };

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

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/item-detail?id=${item.id}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {item.photos && item.photos.length > 0 ? (
          <Image
            source={{ uri: item.photos[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.productTitle} numberOfLines={1}>
          {item.title}
        </Text>

        <View style={styles.priceRow}>
          {item.type === 'donation' ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>FREE</Text>
            </View>
          ) : (
            <Text style={styles.price}>{formatPrice(item)}</Text>
          )}
          {/* Pro Badge */}
          {item.store_id && (
            <View style={{ backgroundColor: '#4C7B4B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>PRO</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomRow}>
          {item.distance_km !== undefined && (
            <View style={styles.distanceRow}>
              <Ionicons name="location" size={14} color="#666" />
              <Text style={styles.distance}>{item.distance_km.toFixed(1)}km</Text>
            </View>
          )}

          {item.owner?.photo_url && (
            <Image
              source={{ uri: item.owner.photo_url }}
              style={styles.avatar}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => router.push(`/item-detail?id=${item.id}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.listImageContainer}>
        {item.photos && item.photos.length > 0 ? (
          <Image
            source={{ uri: item.photos[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={30} color="#ccc" />
          </View>
        )}
      </View>

      <View style={styles.listCardContent}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.productTitle, { flex: 1 }]} numberOfLines={2}>
              {item.title}
            </Text>
            {item.store_id && (
              <View style={{ backgroundColor: '#4C7B4B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>PRO</Text>
              </View>
            )}
          </View>

          {item.distance_km !== undefined && (
            <View style={styles.distanceRow}>
              <Ionicons name="location" size={14} color="#666" />
              <Text style={styles.distance}>{item.distance_km.toFixed(1)}km</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {item.type === 'donation' ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>FREE</Text>
            </View>
          ) : (
            <Text style={styles.price}>{formatPrice(item)}</Text>
          )}
          {item.owner?.photo_url && (
            <Image
              source={{ uri: item.owner.photo_url }}
              style={styles.avatar}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4C7B4B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/loop-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.locationBadge}>
          <Ionicons name="location" size={16} color="#4C7B4B" />
          <Text style={styles.locationText}>Poitiers</Text>
        </View>

        {/* View Mode Toggle */}
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={toggleViewMode}
        >
          <Ionicons
            name={getViewIcon() as any}
            size={22}
            color="#333"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications' as any)}
        >
          <Ionicons name="notifications-outline" size={24} color="#333" />
          {unreadNotifications > 0 && <View style={styles.notificationDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/messages' as any)}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for items in Poitiers..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {(searchQuery.length > 0 || selectedCategory !== 'Tous') && (
          <TouchableOpacity onPress={handleSaveSearch} style={{ padding: 8 }}>
            <Ionicons name="bookmark-outline" size={22} color="#4C7B4B" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleOpenFilters} style={{ padding: 8, marginLeft: 4 }}>
          <Ionicons name="filter" size={22} color={(minRating || radiusKm) ? "#4C7B4B" : "#666"} />
        </TouchableOpacity>
      </View>

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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', padding: 8, width: 300 }}>
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

      {(minRating || radiusKm) && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 }}>
          {minRating && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', padding: 6, borderRadius: 16, marginRight: 8 }}>
              <Text style={{ fontSize: 12, color: '#4C7B4B' }}>⭐ {minRating}+</Text>
              <TouchableOpacity onPress={() => setMinRating(null)}>
                <Ionicons name="close" size={14} color="#4C7B4B" />
              </TouchableOpacity>
            </View>
          )}
          {radiusKm && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', padding: 6, borderRadius: 16, marginRight: 8 }}>
              <Text style={{ fontSize: 12, color: '#4C7B4B' }}>📍 &lt;{radiusKm}km</Text>
              <TouchableOpacity onPress={() => setRadiusKm(null)}>
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
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: 400 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Filtres Avancés</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Note minimum du vendeur</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              {[3, 4, 4.5, 5].map(rating => (
                <TouchableOpacity
                  key={rating}
                  style={[{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', width: '22%', alignItems: 'center' }, minRating === rating && { backgroundColor: '#e8f5e9', borderColor: '#4C7B4B' }]}
                  onPress={() => setMinRating(minRating === rating ? null : rating)}
                >
                  <Text style={[minRating === rating && { color: '#4C7B4B', fontWeight: 'bold' }]}>{rating === 5 ? '5' : `${rating}+`}</Text>
                  <Ionicons name="star" size={12} color="#ffc107" />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Distance maximum</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {[1, 5, 10, 20, 50].map(dist => (
                <TouchableOpacity
                  key={dist}
                  style={[{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' }, radiusKm === dist && { backgroundColor: '#e8f5e9', borderColor: '#4C7B4B' }]}
                  onPress={() => setRadiusKm(radiusKm === dist ? null : dist)}
                >
                  <Text style={[minRating === dist && { color: '#4C7B4B', fontWeight: 'bold' }]}>{dist} km</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#4C7B4B', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 }}
              onPress={() => setShowFilters(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Voir les résultats</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  logo: {
    width: 80,
    height: 32,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  viewToggle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginLeft: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#4C7B4B',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
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
    width: '45%',
    margin: '2.5%',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 8,
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
