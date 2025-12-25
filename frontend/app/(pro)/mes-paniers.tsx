import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

import { API_URL } from '../../src/config/api';

type FilterType = 'active' | 'pending' | 'completed';

interface Basket {
    id: string;
    title: string;
    price_cents: number;
    quantity_available: number;
    pickup_start: string;
    pickup_end: string;
    status: string;
    created_at: string;
    buyer_name?: string;
}

export default function MesPaniersScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { token } = useAuthStore();

    const filter = (params.filter as FilterType) || 'active';
    const [baskets, setBaskets] = useState<Basket[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchBaskets();
    }, [params.filter]);

    const fetchBaskets = async () => {
        try {
            const response = await axios.get(`${API_URL}/pro/baskets?status=${filter}&role=seller`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBaskets(response.data.baskets || []);
        } catch (error) {
            console.error('Error fetching baskets:', error);
            // Mock data for development
            const mockBaskets: Basket[] = [
                {
                    id: '1',
                    title: 'Panier Surprise',
                    price_cents: 399,
                    quantity_available: 3,
                    pickup_start: '17:00',
                    pickup_end: '19:00',
                    status: filter === 'active' ? 'active' : filter === 'pending' ? 'reserved' : 'completed',
                    created_at: new Date().toISOString(),
                    buyer_name: filter !== 'active' ? 'Marie D.' : undefined
                },
                {
                    id: '2',
                    title: 'Panier Fruits & Légumes',
                    price_cents: 499,
                    quantity_available: 2,
                    pickup_start: '18:00',
                    pickup_end: '20:00',
                    status: filter === 'active' ? 'active' : filter === 'pending' ? 'reserved' : 'completed',
                    created_at: new Date().toISOString(),
                    buyer_name: filter !== 'active' ? 'Jean P.' : undefined
                },
                {
                    id: '3',
                    title: 'Panier Boulangerie',
                    price_cents: 349,
                    quantity_available: 5,
                    pickup_start: '16:00',
                    pickup_end: '18:00',
                    status: filter === 'active' ? 'active' : filter === 'pending' ? 'reserved' : 'completed',
                    created_at: new Date().toISOString(),
                    buyer_name: filter !== 'active' ? 'Sophie L.' : undefined
                },
            ];
            setBaskets(mockBaskets);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchBaskets();
    };

    const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;

    const getFilterTitle = () => {
        switch (filter) {
            case 'active': return 'Paniers actifs';
            case 'pending': return 'À récupérer';
            case 'completed': return 'Paniers vendus';
        }
    };

    const getEmptyMessage = () => {
        switch (filter) {
            case 'active': return 'Aucun panier actif';
            case 'pending': return 'Aucun retrait en attente';
            case 'completed': return 'Aucun panier vendu';
        }
    };

    const handleDeleteBasket = (basket: Basket) => {
        Alert.alert(
            'Supprimer le panier',
            `Voulez-vous supprimer "${basket.title}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/items/${basket.id}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            fetchBaskets();
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de supprimer le panier');
                        }
                    }
                },
            ]
        );
    };

    const renderBasketItem = ({ item }: { item: Basket }) => (
        <View style={styles.basketItem}>
            <View style={styles.basketIcon}>
                <Ionicons
                    name={filter === 'completed' ? 'checkmark-circle' : filter === 'pending' ? 'time' : 'basket'}
                    size={28}
                    color={filter === 'completed' ? '#4C7B4B' : filter === 'pending' ? '#ff9800' : '#4C7B4B'}
                />
            </View>
            <View style={styles.basketInfo}>
                <Text style={styles.basketTitle}>{item.title}</Text>
                {item.buyer_name && (
                    <Text style={styles.basketBuyer}>Client: {item.buyer_name}</Text>
                )}
                <View style={styles.basketDetails}>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text style={styles.detailText}>{item.pickup_start} - {item.pickup_end}</Text>
                    </View>
                    {filter === 'active' && (
                        <View style={styles.detailRow}>
                            <Ionicons name="layers-outline" size={14} color="#666" />
                            <Text style={styles.detailText}>{item.quantity_available} dispo</Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.basketRight}>
                <Text style={styles.basketPrice}>{formatPrice(item.price_cents)}</Text>
                {filter === 'active' && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteBasket(item)}
                    >
                        <Ionicons name="trash-outline" size={18} color="#d32f2f" />
                    </TouchableOpacity>
                )}
                {filter === 'pending' && (
                    <TouchableOpacity
                        style={styles.scanButton}
                        onPress={() => router.push('/(pro)/scanner-retrait')}
                    >
                        <Ionicons name="qr-code-outline" size={18} color="#4C7B4B" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{getFilterTitle()}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Basket List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4C7B4B" />
                </View>
            ) : (
                <FlatList
                    data={baskets}
                    renderItem={renderBasketItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C7B4B" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name={filter === 'active' ? 'basket-outline' : filter === 'pending' ? 'time-outline' : 'checkmark-done-outline'}
                                size={64}
                                color="#ccc"
                            />
                            <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
                            {filter === 'active' && (
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => router.push('/(pro)/nouveau-panier')}
                                >
                                    <Ionicons name="add" size={20} color="#fff" />
                                    <Text style={styles.addButtonText}>Créer un panier</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60,
        backgroundColor: '#fff',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 8,
    },
    filterTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        gap: 6,
    },
    filterTabActive: {
        backgroundColor: '#e8f5e9',
    },
    filterText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#4C7B4B',
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    basketItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    basketIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    basketInfo: {
        flex: 1,
    },
    basketTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    basketBuyer: {
        fontSize: 13,
        color: '#4C7B4B',
        marginTop: 2,
    },
    basketDetails: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 12,
        color: '#666',
    },
    basketRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    basketPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    deleteButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#ffebee',
    },
    scanButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#e8f5e9',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4C7B4B',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
        gap: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
