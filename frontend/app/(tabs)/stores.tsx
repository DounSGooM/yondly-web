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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Item } from '../../src/types';
import InteractiveMap from '../../src/components/InteractiveMap';
import NotificationBell from '../../src/components/NotificationBell';
import * as Location from 'expo-location';

import { API_URL } from '../../src/config/api';

const RENTAL_CATEGORIES = [
  { name: 'Tous', icon: 'apps' },
  { name: 'Bricolage', icon: 'hammer' },
  { name: 'Jardinage', icon: 'leaf' },
  { name: 'Maison', icon: 'home' },
  { name: 'High-Tech', icon: 'camera' },
  { name: 'Sport', icon: 'bicycle' },
  { name: 'Événementiel', icon: 'musical-notes' },
  { name: 'Autre', icon: 'ellipsis-horizontal' },
];

export default function RentalScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  useEffect(() => {
    getUserLocation();
    fetchItems();
  }, [selectedCategory]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

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
      const params: any = { type: 'rent' };

      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }

      if (selectedCategory !== 'Tous') {
        params.category = selectedCategory;
      }

      const response = await axios.get(`${API_URL}/items`, { params });
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching rental items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const formatPrice = (item: Item) => {
    if (item.price_per_day_cents) {
      return `${(item.price_per_day_cents / 100).toFixed(0)}€ /j`;
    }
    return 'Prix sur demande';
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
        <View style={styles.rentBadge}>
          <Text style={styles.rentBadgeText}>LOCATION</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.productTitle} numberOfLines={1}>
          {item.title}
        </Text>

        <Text style={styles.price}>{formatPrice(item)}</Text>

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
        <View style={styles.rentBadge}>
          <Text style={styles.rentBadgeText}>LOCATION</Text>
        </View>
      </View>

      <View style={styles.listCardContent}>
        <View>
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.distance_km !== undefined && (
            <View style={styles.distanceRow}>
              <Ionicons name="location" size={14} color="#666" />
              <Text style={styles.distance}>{item.distance_km.toFixed(1)}km</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.price}>{formatPrice(item)}</Text>
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

        <NotificationBell />

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
          placeholder="Je cherche une perceuse, une tente..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Dropdown */}
      <View style={styles.categorySelector}>
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => setShowCategoryMenu(!showCategoryMenu)}
        >
          <View style={styles.categoryButtonContent}>
            <Ionicons
              name={RENTAL_CATEGORIES.find(c => c.name === selectedCategory)?.icon as any}
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
              {RENTAL_CATEGORIES.map((cat) => (
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

      {/* Product Grid or Map */}
      {viewMode === 'map' ? (
        <InteractiveMap
          items={items}
          userLocation={userLocation}
          onItemPress={(itemId: string) => router.push(`/item-detail?id=${itemId}` as any)}
        />
      ) : (
        <FlatList
          data={items}
          renderItem={viewMode === 'list' ? renderListItem : renderItem}
          keyExtractor={(item) => item.id}
          key={viewMode} // Force re-render when switching columns
          numColumns={viewMode === 'list' ? 1 : 2}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4C7B4B']} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Aucun objet à louer trouvé</Text>
              <Text style={styles.emptySubtext}>Soyez le premier à proposer quelque chose !</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      {viewMode !== 'map' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/post/rent' as any)}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}
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
    zIndex: 2000,
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
  listContent: {
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
    marginRight: '2%',
    marginBottom: 16,
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
  rentBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rentBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4C7B4B',
    marginBottom: 8,
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
  emptySubtext: {
    marginTop: 8,
    color: '#999',
  }
});
