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
import { useAuthStore } from '../../src/store/authStore';
import InteractiveMap from '../../src/components/InteractiveMap';
import ItemGridCard from '../../src/components/ItemGridCard';
import NotificationBell from '../../src/components/NotificationBell';
import * as Location from 'expo-location';

import { API_URL } from '../../src/config/api';

type ViewMode = 'grid' | 'map' | 'list';

export default function FoodScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
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
      const params: any = { type: 'donation' };

      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }

      const response = await axios.get(`${API_URL}/items`, { params });
      let fetchedItems = response.data;

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
          <View style={styles.freeBadge}>
            <Text style={styles.freeText}>FREE</Text>
          </View>
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
          <View style={styles.freeBadge}>
            <Text style={styles.freeText}>FREE</Text>
          </View>
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
            color="#666"
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
          placeholder="Rechercher des dons..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Product Grid, List or Map */}
      {viewMode === 'map' ? (
        <InteractiveMap
          items={items}
          userLocation={userLocation}
          onItemPress={(itemId: string) => router.push(`/item-detail?id=${itemId}` as any)}
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
          columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between', gap: 12 } : undefined}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4C7B4B']} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/post/food' as any)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
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
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
    marginBottom: 6,
  },
  priceRow: {
    marginBottom: 8,
  },
  freeBadge: {
    backgroundColor: '#4C7B4B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  freeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
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
});
