import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

import { API_URL } from '../../src/config/api';

interface RevenueData {
    today: number;
    yesterday: number;
    week: number;
    month: number;
    daily_breakdown: { date: string; amount: number }[];
}

export default function ChiffreAffairesScreen() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [data, setData] = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchRevenue();
    }, []);

    const fetchRevenue = async () => {
        try {
            const response = await axios.get(`${API_URL}/pro/revenue`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching revenue:', error);
            // Mock data for development
            const mockData: RevenueData = {
                today: 4250,
                yesterday: 3890,
                week: 21500,
                month: 89200,
                daily_breakdown: [
                    { date: format(new Date(), 'yyyy-MM-dd'), amount: 4250 },
                    { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), amount: 3890 },
                    { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), amount: 2750 },
                    { date: format(subDays(new Date(), 3), 'yyyy-MM-dd'), amount: 4100 },
                    { date: format(subDays(new Date(), 4), 'yyyy-MM-dd'), amount: 3200 },
                    { date: format(subDays(new Date(), 5), 'yyyy-MM-dd'), amount: 1890 },
                    { date: format(subDays(new Date(), 6), 'yyyy-MM-dd'), amount: 1420 },
                ],
            };
            setData(mockData);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRevenue();
    };

    const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;

    const getPercentChange = (current: number, previous: number) => {
        if (previous === 0) return '+100%';
        const change = ((current - previous) / previous) * 100;
        return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chiffre d'affaires</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C7B4B" />
                }
            >
                {/* Main Revenue Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.mainLabel}>Aujourd'hui</Text>
                    <Text style={styles.mainValue}>{formatPrice(data?.today || 0)}</Text>
                    <View style={styles.changeRow}>
                        <Ionicons
                            name={(data?.today || 0) >= (data?.yesterday || 0) ? "trending-up" : "trending-down"}
                            size={16}
                            color={(data?.today || 0) >= (data?.yesterday || 0) ? "#4C7B4B" : "#d32f2f"}
                        />
                        <Text style={[
                            styles.changeText,
                            { color: (data?.today || 0) >= (data?.yesterday || 0) ? "#4C7B4B" : "#d32f2f" }
                        ]}>
                            {getPercentChange(data?.today || 0, data?.yesterday || 0)} vs hier
                        </Text>
                    </View>
                </View>

                {/* Period Cards */}
                <View style={styles.periodGrid}>
                    <View style={styles.periodCard}>
                        <Ionicons name="calendar-outline" size={24} color="#4C7B4B" />
                        <Text style={styles.periodValue}>{formatPrice(data?.yesterday || 0)}</Text>
                        <Text style={styles.periodLabel}>Hier</Text>
                    </View>
                    <View style={styles.periodCard}>
                        <Ionicons name="calendar" size={24} color="#4C7B4B" />
                        <Text style={styles.periodValue}>{formatPrice(data?.week || 0)}</Text>
                        <Text style={styles.periodLabel}>Cette semaine</Text>
                    </View>
                    <View style={styles.periodCard}>
                        <Ionicons name="calendar-number" size={24} color="#4C7B4B" />
                        <Text style={styles.periodValue}>{formatPrice(data?.month || 0)}</Text>
                        <Text style={styles.periodLabel}>Ce mois</Text>
                    </View>
                </View>

                {/* Daily Breakdown */}
                <Text style={styles.sectionTitle}>Détail des 7 derniers jours</Text>
                <View style={styles.breakdownCard}>
                    {data?.daily_breakdown.map((day, index) => (
                        <View key={index} style={[
                            styles.breakdownRow,
                            index < (data?.daily_breakdown.length || 0) - 1 && styles.breakdownBorder
                        ]}>
                            <View style={styles.breakdownLeft}>
                                <Text style={styles.breakdownDate}>
                                    {format(new Date(day.date), 'EEEE', { locale: fr })}
                                </Text>
                                <Text style={styles.breakdownDateSub}>
                                    {format(new Date(day.date), 'd MMM', { locale: fr })}
                                </Text>
                            </View>
                            <Text style={styles.breakdownAmount}>{formatPrice(day.amount)}</Text>
                        </View>
                    ))}
                </View>

                {/* Tips */}
                <View style={styles.tipsCard}>
                    <Ionicons name="bulb" size={24} color="#ff9800" />
                    <View style={styles.tipsContent}>
                        <Text style={styles.tipsTitle}>Conseil</Text>
                        <Text style={styles.tipsText}>
                            Publiez vos paniers entre 14h et 16h pour maximiser vos ventes en fin de journée.
                        </Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
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
    content: {
        flex: 1,
        padding: 16,
    },
    mainCard: {
        backgroundColor: '#4C7B4B',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    mainLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    mainValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        marginVertical: 8,
    },
    changeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    changeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    periodGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    periodCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    periodValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    periodLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    breakdownCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    breakdownBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    breakdownLeft: {},
    breakdownDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textTransform: 'capitalize',
    },
    breakdownDateSub: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    breakdownAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    tipsCard: {
        flexDirection: 'row',
        backgroundColor: '#fff8e1',
        borderRadius: 16,
        padding: 16,
        marginTop: 24,
        gap: 12,
    },
    tipsContent: {
        flex: 1,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    tipsText: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
        lineHeight: 18,
    },
});
