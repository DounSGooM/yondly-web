import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { format, startOfDay, startOfMonth, startOfYear } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

import { API_URL } from '../../src/config/api';

type Period = 'day' | 'month' | 'year';

interface Sale {
    id: string;
    title: string;
    price_cents: number;
    buyer_name: string;
    sold_at: string;
    status: string;
}

export default function HistoriqueScreen() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [period, setPeriod] = useState<Period>('day');
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
        fetchSales();
    }, [period]);

    const fetchSales = async () => {
        try {
            const response = await axios.get(`${API_URL}/pro/sales?period=${period}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSales(response.data.sales || []);
            setTotalRevenue(response.data.total_cents || 0);
        } catch (error) {
            console.error('Error fetching sales:', error);
            // Mock data for development
            const mockSales: Sale[] = [
                { id: '1', title: 'Panier Surprise', price_cents: 399, buyer_name: 'Marie D.', sold_at: new Date().toISOString(), status: 'completed' },
                { id: '2', title: 'Panier Fruits & Légumes', price_cents: 499, buyer_name: 'Jean P.', sold_at: new Date().toISOString(), status: 'completed' },
                { id: '3', title: 'Panier Boulangerie', price_cents: 349, buyer_name: 'Sophie L.', sold_at: new Date().toISOString(), status: 'pending' },
                { id: '4', title: 'Panier Surprise', price_cents: 399, buyer_name: 'Pierre M.', sold_at: new Date().toISOString(), status: 'completed' },
                { id: '5', title: 'Panier Bio', price_cents: 599, buyer_name: 'Claire B.', sold_at: new Date().toISOString(), status: 'completed' },
            ];
            setSales(mockSales);
            setTotalRevenue(mockSales.reduce((sum, s) => sum + s.price_cents, 0));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchSales();
    };

    const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;

    const getPeriodLabel = () => {
        const now = new Date();
        switch (period) {
            case 'day':
                return format(now, "EEEE d MMMM", { locale: fr });
            case 'month':
                return format(now, "MMMM yyyy", { locale: fr });
            case 'year':
                return format(now, "yyyy", { locale: fr });
        }
    };

    const renderSaleItem = ({ item }: { item: Sale }) => (
        <View style={styles.saleItem}>
            <View style={styles.saleInfo}>
                <Text style={styles.saleTitle}>{item.title}</Text>
                <Text style={styles.saleBuyer}>{item.buyer_name}</Text>
                <Text style={styles.saleTime}>
                    {format(new Date(item.sold_at), 'HH:mm', { locale: fr })}
                </Text>
            </View>
            <View style={styles.saleRight}>
                <Text style={styles.salePrice}>{formatPrice(item.price_cents)}</Text>
                <View style={[
                    styles.statusBadge,
                    item.status === 'completed' ? styles.statusCompleted : styles.statusPending
                ]}>
                    <Text style={[
                        styles.statusText,
                        item.status === 'completed' ? styles.statusTextCompleted : styles.statusTextPending
                    ]}>
                        {item.status === 'completed' ? 'Récupéré' : 'En attente'}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historique des ventes</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Period Selector */}
            <View style={styles.periodSelector}>
                {(['day', 'month', 'year'] as Period[]).map((p) => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.periodButton, period === p && styles.periodButtonActive]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                            {p === 'day' ? 'Jour' : p === 'month' ? 'Mois' : 'Année'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <View>
                    <Text style={styles.summaryPeriod}>{getPeriodLabel()}</Text>
                    <Text style={styles.summaryCount}>{sales.length} vente{sales.length > 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.summaryRevenue}>
                    <Text style={styles.summaryLabel}>Total</Text>
                    <Text style={styles.summaryAmount}>{formatPrice(totalRevenue)}</Text>
                </View>
            </View>

            {/* Sales List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4C7B4B" />
                </View>
            ) : (
                <FlatList
                    data={sales}
                    renderItem={renderSaleItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.salesList}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C7B4B" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Aucune vente</Text>
                            <Text style={styles.emptySubtext}>pour cette période</Text>
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    periodSelector: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    periodButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: '#4C7B4B',
    },
    periodText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    periodTextActive: {
        color: '#fff',
    },
    summaryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryPeriod: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textTransform: 'capitalize',
    },
    summaryCount: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    summaryRevenue: {
        alignItems: 'flex-end',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#666',
    },
    summaryAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    salesList: {
        padding: 16,
        paddingTop: 0,
    },
    saleItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    saleInfo: {
        flex: 1,
    },
    saleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    saleBuyer: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    saleTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    saleRight: {
        alignItems: 'flex-end',
    },
    salePrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    statusCompleted: {
        backgroundColor: '#e8f5e9',
    },
    statusPending: {
        backgroundColor: '#fff3e0',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    statusTextCompleted: {
        color: '#4C7B4B',
    },
    statusTextPending: {
        color: '#ff9800',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 64,
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
        marginTop: 4,
    },
});
