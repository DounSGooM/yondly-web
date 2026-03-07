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
import NotificationBell from '../../src/components/NotificationBell';
import * as Location from 'expo-location';

import { API_URL } from '../../src/config/api';

type ViewMode = 'grid' | 'map' | 'list';

export default function AntiGaspiScreen() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [activeTab, setActiveTab] = useState<'buying' | 'suspended'>('buying');

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
            // Anti-gaspi shows deals from stores (unsold items)
            const params: any = {};

            if (userLocation) {
                params.lat = userLocation.lat;
                params.lng = userLocation.lng;
            }

            // Fetch deals from stores
            const response = await axios.get(`${API_URL}/deals`, { params });
            let fetchedDeals = response.data;

            // Filter for active deals only
            const now = new Date();
            const activeDeals = fetchedDeals.filter((deal: any) => {
                if (deal.status !== 'active') return false;
                if (deal.expires_at) {
                    return new Date(deal.expires_at) > now;
                }
                return true;
            });

            // Transform deals to item-like format for display
            const dealItems = activeDeals.map((deal: any) => ({
                id: deal.id,
                title: deal.title,
                description: deal.description,
                photos: deal.store?.logo ? [deal.store.logo] : [],
                type: 'sale',
                price_cents: deal.deal_price ? Math.round(deal.deal_price * 100) : 0,
                original_price_cents: deal.original_price ? Math.round(deal.original_price * 100) : 0,
                discount_value: deal.discount_value,
                discount_type: deal.discount_type,
                category: deal.category,
                expires_at: deal.expires_at,
                store: deal.store,
                distance_km: deal.store?.distance_km,
                allow_suspension: deal.allow_suspension,
                suspended_available: deal.suspended_available,
                owner: {
                    id: deal.store_id,
                    display_name: deal.store?.name || 'Magasin',
                    photo_url: deal.store?.logo,
                },
            }));

            setItems(dealItems);
        } catch (error) {
            console.error('Error fetching deals:', error);
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

    const renderItem = ({ item }: { item: any }) => {
        const isFree = activeTab === 'suspended';
        const discountPercent = item.discount_type === 'percentage'
            ? item.discount_value
            : item.original_price_cents
                ? Math.round(((item.original_price_cents - item.price_cents) / item.original_price_cents) * 100)
                : 0;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/store-detail?id=${item.store?.id}` as any)}
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
                            <Ionicons name="storefront-outline" size={40} color="#ccc" />
                        </View>
                    )}
                    {discountPercent > 0 && !isFree && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>-{discountPercent}%</Text>
                        </View>
                    )}
                    {isFree && (
                        <View style={[styles.discountBadge, { backgroundColor: '#4FC3F7' }]}>
                            <Text style={styles.discountText}>GRATUIT</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.productTitle} numberOfLines={1}>
                        {item.title}
                    </Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.price}>
                            {isFree ? '0.00€' : `€${(item.price_cents / 100).toFixed(2)}`}
                        </Text>
                        {!isFree && item.original_price_cents && (
                            <Text style={styles.originalPrice}>
                                €{(item.original_price_cents / 100).toFixed(2)}
                            </Text>
                        )}
                        {isFree && (
                            <Text style={[styles.originalPrice, { textDecorationLine: 'none', fontSize: 12, color: '#4FC3F7' }]}>
                                (Suspendu)
                            </Text>
                        )}
                    </View>

                    <View style={styles.bottomRow}>
                        <View style={styles.storeRow}>
                            <Ionicons name="storefront" size={14} color="#666" />
                            <Text style={styles.storeName} numberOfLines={1}>
                                {item.store?.name || 'Magasin'}
                            </Text>
                        </View>

                        {item.distance_km !== undefined && (
                            <View style={styles.distanceRow}>
                                <Ionicons name="location" size={14} color="#666" />
                                <Text style={styles.distance}>{item.distance_km.toFixed(1)}km</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderListItem = ({ item }: { item: any }) => {
        const isFree = activeTab === 'suspended';
        // ... (Similar logic for list item if needed, but grid is main view)
        return renderItem({ item }); // Re-use grid render for now or keeping list logic similar
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4C7B4B" />
            </View>
        );
    }

    const filteredItems = items.filter(item => {
        if (activeTab === 'suspended') {
            return item.suspended_available && item.suspended_available > 0;
        }
        return true;
    });

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

            {/* TABS - TEMPORARILY DISABLED (only one tab active since suspended baskets are disabled)
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10, gap: 10 }}>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: activeTab === 'buying' ? '#4C7B4B' : '#eee',
                        borderRadius: 8,
                        alignItems: 'center'
                    }}
                    onPress={() => setActiveTab('buying')}
                >
                    <Text style={{ fontWeight: 'bold', color: activeTab === 'buying' ? 'white' : '#666' }}>Paniers anti-gaspi</Text>
                </TouchableOpacity>

                {user?.is_association && user?.association_verified && (
                    <TouchableOpacity
                        style={{
                            flex: 1,
                            paddingVertical: 10,
                            backgroundColor: activeTab === 'suspended' ? '#4FC3F7' : '#eee',
                            borderRadius: 8,
                            alignItems: 'center'
                        }}
                        onPress={() => setActiveTab('suspended')}
                    >
                        <Text style={{ fontWeight: 'bold', color: activeTab === 'suspended' ? 'white' : '#666' }}>Paniers suspendus</Text>
                    </TouchableOpacity>
                )}
            </View>
            */}

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher des invendus..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Product Grid / List / Map */}
            {viewMode === 'map' ? (
                <InteractiveMap
                    items={filteredItems}
                    userLocation={userLocation}
                    onItemPress={(itemId: string) => router.push(`/item-detail?id=${itemId}` as any)}
                />
            ) : (
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem} // Note: simplified to use renderItem for both list/grid for consistency in this edit
                    keyExtractor={(item) => item.id}
                    key={viewMode} // Force re-render when switching modes
                    numColumns={viewMode === 'list' ? 1 : 2}
                    columnWrapperStyle={viewMode === 'list' ? undefined : styles.row}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4C7B4B']} />
                    }
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="storefront-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Aucun panier disponible</Text>
                            <Text style={styles.emptySubtext}>
                                {activeTab === 'suspended'
                                    ? "Aucun panier suspendu n'est disponible pour le moment."
                                    : "Les paniers anti-gaspi des magasins apparaîtront ici"}
                            </Text>
                        </View>
                    }
                />
            )}
            {/* Floating Action Button - Removed as only partners can post */}
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
        marginTop: 0, // Reduced top margin due to tabs
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
    discountBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ff5722',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    discountText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    urgentText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
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
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    originalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
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
        gap: 8,
    },
    storeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    storeName: {
        fontSize: 12,
        color: '#666',
        flex: 1,
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
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
});
