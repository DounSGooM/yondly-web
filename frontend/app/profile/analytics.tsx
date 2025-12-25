import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { LineChart } from 'react-native-chart-kit';

import { API_URL } from '../../src/config/api';
const SCREEN_WIDTH = Dimensions.get('window').width;

interface SellerAnalytics {
    total_revenue_cents: number;
    monthly_revenue_cents: number;
    active_items: number;
    total_sales_count: number;
    recent_sales: any[];
    payouts: any[];
}

export default function AnalyticsScreen() {
    const router = useRouter();
    const { token, user } = useAuthStore();
    const [data, setData] = useState<SellerAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await axios.get(`${API_URL}/analytics/seller`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setData(response.data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const formatCurrency = (cents: number) => {
        return `${(cents / 100).toFixed(2)}€`;
    };

    // Mock chart data (in real app, use history from API)
    const chartData = {
        labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
        datasets: [
            {
                data: [
                    Math.random() * 100,
                    Math.random() * 100,
                    Math.random() * 100,
                    Math.random() * 100,
                    Math.random() * 100,
                    data ? data.monthly_revenue_cents / 100 : 50
                ],
                strokeWidth: 2
            }
        ]
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
            <View style={styles.header}>
                <Ionicons name="stats-chart" size={24} color="#333" onPress={() => router.back()} />
                <Text style={styles.headerTitle}>Tableau de bord Vendeur</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnalytics(); }} />
                }
            >
                {/* Summary Cards */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Revenus Total</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(data?.total_revenue_cents || 0)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Ce mois-ci</Text>
                        <Text style={[styles.summaryValue, { color: '#4caf50' }]}>
                            +{formatCurrency(data?.monthly_revenue_cents || 0)}
                        </Text>
                    </View>
                </View>

                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Ventes/Locs</Text>
                        <Text style={styles.summaryValue}>{data?.total_sales_count || 0}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Annonces Actives</Text>
                        <Text style={styles.summaryValue}>{data?.active_items || 0}</Text>
                    </View>
                </View>

                {/* Chart */}
                <View style={styles.chartCard}>
                    <Text style={styles.sectionTitle}>Revenus (7 derniers jours)</Text>
                    <LineChart
                        data={chartData}
                        width={SCREEN_WIDTH - 64}
                        height={220}
                        chartConfig={{
                            backgroundColor: "#ffffff",
                            backgroundGradientFrom: "#ffffff",
                            backgroundGradientTo: "#ffffff",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(76, 123, 75, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: {
                                r: "6",
                                strokeWidth: "2",
                                stroke: "#4C7B4B"
                            }
                        }}
                        bezier
                        style={{ marginVertical: 8, borderRadius: 16 }}
                    />
                </View>

                {/* Recent Payouts */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Virements récents</Text>
                    {data?.payouts && data.payouts.length > 0 ? (
                        data.payouts.map((payout, index) => (
                            <View key={index} style={styles.payoutCard}>
                                <View style={styles.payoutInfo}>
                                    <Text style={styles.payoutId}>Virement #{payout.id.split('_')[2]}</Text>
                                    <Text style={styles.payoutDate}>{new Date(payout.date).toLocaleDateString()}</Text>
                                </View>
                                <View style={styles.payoutAmountContainer}>
                                    <Text style={styles.payoutAmount}>{formatCurrency(payout.amount_cents)}</Text>
                                    <Text style={styles.payoutStatus}>Payé</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Aucun virement récent</Text>
                    )}
                </View>
            </ScrollView>
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    content: {
        padding: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    summaryCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    payoutCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    payoutInfo: {
        justifyContent: 'center',
    },
    payoutId: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    payoutDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    payoutAmountContainer: {
        alignItems: 'flex-end',
    },
    payoutAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    payoutStatus: {
        fontSize: 12,
        color: '#4caf50',
        marginTop: 2,
    },
    emptyText: {
        color: '#999',
        textAlign: 'center',
        marginVertical: 10,
    },
});
