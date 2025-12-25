import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

import { API_URL } from '../../src/config/api';

type TabType = 'all' | 'orders' | 'rentals';
type FilterType = 'all' | 'pending' | 'active' | 'completed';

interface Transaction {
    id: string;
    type: 'order' | 'rental';
    title: string;
    amount_cents: number;
    status: string;
    payment_status: string;
    created_at: string;
    item?: any;
    role: 'buyer' | 'seller' | 'renter' | 'owner';
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    initiated: { label: 'En attente', color: '#ff9800', icon: 'time' },
    pending: { label: 'En attente', color: '#ff9800', icon: 'time' },
    escrowed: { label: 'Payé', color: '#2196f3', icon: 'checkmark-circle' },
    confirmed: { label: 'Confirmé', color: '#2196f3', icon: 'checkmark-circle' },
    active: { label: 'En cours', color: '#4caf50', icon: 'key' },
    released: { label: 'Terminé', color: '#4caf50', icon: 'checkmark-done-circle' },
    returned: { label: 'Retourné', color: '#4caf50', icon: 'checkmark-done-circle' },
    completed: { label: 'Terminé', color: '#4caf50', icon: 'checkmark-done-circle' },
    refunded: { label: 'Remboursé', color: '#9e9e9e', icon: 'refresh' },
    cancelled: { label: 'Annulé', color: '#f44336', icon: 'close-circle' },
    dispute: { label: 'Litige', color: '#f44336', icon: 'warning' },
};

export default function TransactionsScreen() {
    const router = useRouter();
    const { user, token } = useAuthStore();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadTransactions();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [transactions, activeTab, activeFilter, searchQuery]);

    const loadTransactions = async () => {
        try {
            // Load orders
            const ordersRes = await axios.get(`${API_URL}/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Load rentals
            const rentalsRes = await axios.get(`${API_URL}/rentals`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Normalize data
            const orders: Transaction[] = ordersRes.data.map((o: any) => ({
                id: o.id,
                type: 'order' as const,
                title: o.item?.title || 'Article',
                amount_cents: o.amount_cents,
                status: o.payment_status,
                payment_status: o.payment_status,
                created_at: o.created_at,
                item: o.item,
                role: o.buyer_id === user?.id ? 'buyer' : 'seller',
            }));

            const rentals: Transaction[] = rentalsRes.data.map((r: any) => ({
                id: r.id,
                type: 'rental' as const,
                title: r.item?.title || 'Location',
                amount_cents: r.total_price_cents,
                status: r.status,
                payment_status: r.payment_status,
                created_at: r.created_at,
                item: r.item,
                role: r.renter_id === user?.id ? 'renter' : 'owner',
            }));

            // Combine and sort by date
            const all = [...orders, ...rentals].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setTransactions(all);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFilters = () => {
        let result = [...transactions];

        // Tab filter
        if (activeTab === 'orders') {
            result = result.filter(t => t.type === 'order');
        } else if (activeTab === 'rentals') {
            result = result.filter(t => t.type === 'rental');
        }

        // Status filter
        if (activeFilter === 'pending') {
            result = result.filter(t => ['initiated', 'pending', 'escrowed', 'confirmed'].includes(t.status));
        } else if (activeFilter === 'active') {
            result = result.filter(t => ['active'].includes(t.status));
        } else if (activeFilter === 'completed') {
            result = result.filter(t => ['released', 'returned', 'completed', 'refunded'].includes(t.status));
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t => t.title.toLowerCase().includes(query));
        }

        setFilteredTransactions(result);
    };

    const getStatusInfo = (status: string) => {
        return STATUS_CONFIG[status] || { label: status, color: '#666', icon: 'help-circle' };
    };

    const handlePress = (item: Transaction) => {
        if (item.type === 'order') {
            router.push(`/order-detail?id=${item.id}` as any);
        } else {
            router.push(`/rental/detail?id=${item.id}` as any);
        }
    };

    const renderItem = ({ item }: { item: Transaction }) => {
        const statusInfo = getStatusInfo(item.status);
        const roleLabel = item.role === 'buyer' || item.role === 'renter' ? 'Achat' : 'Vente';

        return (
            <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
                <View style={[styles.typeIcon, { backgroundColor: item.type === 'order' ? '#e3f2fd' : '#e8f5e9' }]}>
                    <Ionicons
                        name={item.type === 'order' ? 'cart' : 'key'}
                        size={22}
                        color={item.type === 'order' ? '#1976d2' : '#4C7B4B'}
                    />
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.cardPrice}>{(item.amount_cents / 100).toFixed(2)}€</Text>
                    </View>
                    <View style={styles.cardMeta}>
                        <Text style={styles.roleText}>{roleLabel}</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.dateText}>
                            {format(new Date(item.created_at), 'd MMM yyyy', { locale: fr })}
                        </Text>
                    </View>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                            <Ionicons name={statusInfo.icon as any} size={12} color={statusInfo.color} />
                            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                        </View>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View style={styles.filtersContainer}>
            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {(['all', 'orders', 'rentals'] as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'all' ? 'Tout' : tab === 'orders' ? 'Achats' : 'Locations'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Status Filters */}
            <View style={styles.filterChips}>
                {(['all', 'pending', 'active', 'completed'] as FilterType[]).map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                        onPress={() => setActiveFilter(filter)}
                    >
                        <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
                            {filter === 'all' ? 'Tous' : filter === 'pending' ? 'En cours' : filter === 'active' ? 'Actifs' : 'Terminés'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Results count */}
            <Text style={styles.resultsCount}>
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </Text>
        </View>
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mes Transactions</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push('/profile/disputes' as any)}
                >
                    <Ionicons name="shield" size={22} color="#4C7B4B" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredTransactions}
                renderItem={renderItem}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadTransactions();
                        }}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyTitle}>Aucune transaction</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'Aucun résultat pour cette recherche' : 'Vos transactions apparaîtront ici'}
                        </Text>
                    </View>
                }
            />
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
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    filtersContainer: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        fontSize: 16,
        color: '#333',
    },
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#4C7B4B',
        fontWeight: '600',
    },
    filterChips: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
    },
    filterChipActive: {
        backgroundColor: '#4C7B4B',
    },
    filterChipText: {
        fontSize: 13,
        color: '#666',
    },
    filterChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    resultsCount: {
        fontSize: 13,
        color: '#999',
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    typeIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    cardPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4C7B4B',
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    roleText: {
        fontSize: 13,
        color: '#666',
    },
    dotSeparator: {
        marginHorizontal: 6,
        color: '#ccc',
    },
    dateText: {
        fontSize: 13,
        color: '#999',
    },
    statusRow: {
        flexDirection: 'row',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
});
