import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAssociationStore } from '../../src/store/associationStore';
import { useAuthStore } from '../../src/store/authStore';

export default function AssoDashboardScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { stats, isLoadingStats, fetchStats, fetchBeneficiaries, fetchDistributions } = useAssociationStore();

    const [refreshing, setRefreshing] = React.useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await Promise.all([
            fetchStats(),
            fetchBeneficiaries(),
            fetchDistributions(10)
        ]);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const StatCard = ({
        icon,
        label,
        value,
        color = '#4C7B4B'
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        label: string;
        value: number;
        color?: string;
    }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.statContent}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </View>
        </View>
    );

    const QuickAction = ({
        icon,
        label,
        onPress,
        color = '#4C7B4B'
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        label: string;
        onPress: () => void;
        color?: string;
    }) => (
        <TouchableOpacity style={styles.quickAction} onPress={onPress}>
            <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text style={styles.quickActionLabel}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4C7B4B']} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Bonjour,</Text>
                        <Text style={styles.associationName}>
                            {user?.association_name || user?.display_name}
                        </Text>
                    </View>
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.verifiedText}>Vérifiée</Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <Text style={styles.sectionTitle}>Votre impact</Text>

                {isLoadingStats ? (
                    <ActivityIndicator size="large" color="#4C7B4B" style={styles.loader} />
                ) : (
                    <View style={styles.statsGrid}>
                        <StatCard
                            icon="basket"
                            label="Paniers récupérés"
                            value={stats?.total_baskets_claimed || 0}
                            color="#4C7B4B"
                        />
                        <StatCard
                            icon="gift"
                            label="Paniers distribués"
                            value={stats?.total_baskets_distributed || 0}
                            color="#FF9500"
                        />
                        <StatCard
                            icon="people"
                            label="Bénéficiaires actifs"
                            value={stats?.active_beneficiaries || 0}
                            color="#007AFF"
                        />
                        <StatCard
                            icon="home"
                            label="Familles aidées"
                            value={stats?.impact_families || 0}
                            color="#AF52DE"
                        />
                    </View>
                )}

                {/* This Month */}
                <View style={styles.monthCard}>
                    <Text style={styles.monthTitle}>Ce mois-ci</Text>
                    <View style={styles.monthStats}>
                        <View style={styles.monthStat}>
                            <Text style={styles.monthValue}>{stats?.this_month_baskets || 0}</Text>
                            <Text style={styles.monthLabel}>paniers récupérés</Text>
                        </View>
                        <View style={styles.monthDivider} />
                        <View style={styles.monthStat}>
                            <Text style={styles.monthValue}>{stats?.this_month_distributions || 0}</Text>
                            <Text style={styles.monthLabel}>distributions</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Actions rapides</Text>
                <View style={styles.quickActions}>
                    <QuickAction
                        icon="basket-outline"
                        label="Récupérer"
                        onPress={() => router.push('/(tabs)/asso-suspended')}
                        color="#4C7B4B"
                    />
                    <QuickAction
                        icon="gift-outline"
                        label="Distribuer"
                        onPress={() => router.push('/asso-distribution')}
                        color="#FF9500"
                    />
                    <QuickAction
                        icon="people-outline"
                        label="Bénéficiaires"
                        onPress={() => router.push('/(tabs)/asso-beneficiaries')}
                        color="#007AFF"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: 20,
        marginBottom: 30,
    },
    welcomeText: {
        fontSize: 16,
        color: '#666',
    },
    associationName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginTop: 4,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4C7B4B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    verifiedText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    loader: {
        marginVertical: 40,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    monthCard: {
        backgroundColor: '#4C7B4B',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
    },
    monthTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 16,
    },
    monthStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthStat: {
        flex: 1,
        alignItems: 'center',
    },
    monthValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    monthLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    monthDivider: {
        width: 1,
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
    },
    quickAction: {
        flex: 1,
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
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickActionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
    },
});
