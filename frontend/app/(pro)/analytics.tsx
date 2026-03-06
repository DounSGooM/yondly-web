
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { API_URL } from '../../src/config/api';
import { LineChart } from 'react-native-chart-kit';
import ScreenHeader from '../../src/components/ScreenHeader';

const screenWidth = Dimensions.get('window').width;

// Define types for our analytics data
interface SellerAnalytics {
    total_revenue_cents: number;
    monthly_revenue_cents: number;
    active_items: number;
    total_sales_count: number;
    recent_sales: any[];
    payouts: any[];
}

export default function SellerAnalyticsScreen() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<SellerAnalytics>({
        total_revenue_cents: 0,
        monthly_revenue_cents: 0,
        active_items: 0,
        total_sales_count: 0,
        recent_sales: [],
        payouts: []
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await axios.get(`${API_URL}/analytics/seller`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnalytics();
    };

    const chartConfig = {
        backgroundGradientFrom: "#fff",
        backgroundGradientTo: "#fff",
        color: (opacity = 1) => `rgba(76, 123, 75, ${opacity})`, // Project Green
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
    };

    // Mock chart data - in a real app, you'd get this from the backend
    // The current endpoint provides aggregates but not timeseries yet
    const salesData = {
        labels: ["J-4", "J-3", "J-2", "Hier", "Auj."],
        datasets: [
            {
                data: [
                    Math.random() * 50,
                    Math.random() * 100,
                    Math.random() * 80,
                    Math.random() * 120,
                    data.monthly_revenue_cents / 100 / 5 || Math.random() * 60
                ],
                color: (opacity = 1) => `rgba(76, 123, 75, ${opacity})`,
                strokeWidth: 2
            }
        ],
        legend: ["Ventes (€)"]
    };

    const formatPrice = (cents: number) => (cents / 100).toFixed(2) + '€';

    return (
        <View style={styles.container}>
            <ScreenHeader title="Tableau de Bord Vendeur" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4C7B4B']} />
                }
            >
                {/* Summary Cards */}
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                        <View style={[styles.iconContainer, { backgroundColor: '#e8f5e9' }]}>
                            <Ionicons name="wallet-outline" size={24} color="#4C7B4B" />
                        </View>
                        <Text style={styles.summaryValue}>{formatPrice(data.total_revenue_cents)}</Text>
                        <Text style={styles.summaryLabel}>Revenus Totaux</Text>
                    </View>

                    <View style={styles.summaryCard}>
                        <View style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}>
                            <Ionicons name="calendar-outline" size={24} color="#1976d2" />
                        </View>
                        <Text style={styles.summaryValue}>{formatPrice(data.monthly_revenue_cents)}</Text>
                        <Text style={styles.summaryLabel}>Ce mois-ci</Text>
                    </View>

                    <View style={styles.summaryCard}>
                        <View style={[styles.iconContainer, { backgroundColor: '#fff3e0' }]}>
                            <Ionicons name="basket-outline" size={24} color="#f57c00" />
                        </View>
                        <Text style={styles.summaryValue}>{data.active_items}</Text>
                        <Text style={styles.summaryLabel}>Annonces Actives</Text>
                    </View>

                    <View style={styles.summaryCard}>
                        <View style={[styles.iconContainer, { backgroundColor: '#f3e5f5' }]}>
                            <Ionicons name="stats-chart-outline" size={24} color="#7b1fa2" />
                        </View>
                        <Text style={styles.summaryValue}>{data.total_sales_count}</Text>
                        <Text style={styles.summaryLabel}>Ventes Totales</Text>
                    </View>
                </View>

                {/* Revenue Chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance Financière</Text>
                    <View style={styles.chartCard}>
                        <LineChart
                            data={salesData}
                            width={screenWidth - 48}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                        />
                    </View>
                </View>

                {/* Recent Payouts */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Derniers Virements</Text>
                    {data.payouts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Aucun virement récent</Text>
                        </View>
                    ) : (
                        data.payouts.map((payout, index) => (
                            <View key={index} style={styles.payoutCard}>
                                <View style={styles.payoutLeft}>
                                    <View style={styles.payoutIcon}>
                                        <Ionicons name="arrow-up" size={20} color="#4C7B4B" />
                                    </View>
                                    <View>
                                        <Text style={styles.payoutId}>Virement #{payout.id?.substring(0, 6) || '???'}</Text>
                                        <Text style={styles.payoutDate}>
                                            {payout.date ? new Date(payout.date).toLocaleDateString() : 'Date inconnue'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.payoutRight}>
                                    <Text style={styles.payoutAmount}>+{formatPrice(payout.amount_cents)}</Text>
                                    <Text style={styles.payoutStatus}>{payout.status}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    summaryCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#666',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
        marginLeft: 4,
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyState: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontStyle: 'italic',
    },
    payoutCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    payoutLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    payoutIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e8f5e9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    payoutId: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1a1a1a',
    },
    payoutDate: {
        fontSize: 12,
        color: '#999',
    },
    payoutRight: {
        alignItems: 'flex-end',
    },
    payoutAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    payoutStatus: {
        fontSize: 11,
        color: '#4C7B4B',
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
        overflow: 'hidden',
    },
});
