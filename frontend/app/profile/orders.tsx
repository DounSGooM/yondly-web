import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image,
    RefreshControl,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/store/authStore';

import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

export default function OrderHistoryScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${API_URL}/orders?role=buyer`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data);
        } catch (error) {
            console.error("Error loading orders", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handlePressOrder = (order: any) => {
        // Always navigate to order-detail to show QR code for handoff
        router.push(`/order-detail?id=${order.id}`);
    };


    const renderItem = ({ item }: { item: any }) => {
        const isDeal = item.type === 'deal';
        const title = item.item?.title || item.title || (isDeal ? "Panier Anti-Gaspi" : "Objet");
        const price = (item.amount_cents / 100).toFixed(2);
        const date = new Date(item.created_at).toLocaleDateString();
        const status = item.payment_status === 'released' ? 'Payé' : item.payment_status;

        return (
            <TouchableOpacity style={styles.card} onPress={() => handlePressOrder(item)}>
                <View style={[styles.iconContainer, isDeal ? styles.dealIcon : styles.itemIcon]}>
                    <Ionicons
                        name={isDeal ? "leaf" : "cube"}
                        size={24}
                        color={isDeal ? "#4C7B4B" : "#1976d2"}
                    />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.cardSubtitle}>
                        {isDeal ? (item.item?.store_name || "Commerçant") : "Vendeur particulier"}
                    </Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.date}>{date}</Text>
                        <Text style={styles.price}>{price}€</Text>
                    </View>
                </View>
                <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="Mes Commandes" />

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4C7B4B" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Aucune commande pour le moment</Text>
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
    // header, backButton, headerTitle removed
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    dealIcon: {
        backgroundColor: '#e8f5e9',
    },
    itemIcon: {
        backgroundColor: '#e3f2fd',
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    price: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    arrowContainer: {
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
    }
});
