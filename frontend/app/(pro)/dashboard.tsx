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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

import { API_URL } from '../../src/config/api';

interface ServiceStats {
    active_baskets?: number;
    pending_pickups?: number;
    active_rentals?: number;
    pending_returns?: number;
    active_items?: number;
    today_revenue_cents: number;
    today_sales_count?: number;
    week_stats?: number[];
}

interface ProStats {
    anti_waste: ServiceStats;
    rental: ServiceStats;
    sale: ServiceStats;
}

export default function ProDashboardScreen() {
    const router = useRouter();
    const { user, token } = useAuthStore();
    const [stats, setStats] = useState<ProStats | null>(null);
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const services = user?.services || [];
    // Determine mode
    const isAntiWasteOnly = services.length === 1 && services[0] === 'anti_waste';
    const isRentalOnly = services.length === 1 && services[0] === 'rent';
    const isSaleOnly = services.length === 1 && services[0] === 'sale';

    // Legacy support or mixed
    const hasSale = services.length === 0 || services.includes('sale');
    const hasRent = services.includes('rent');
    const hasAntiWaste = services.length === 0 || services.includes('anti_waste');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, disputesRes] = await Promise.all([
                axios.get(`${API_URL}/pro/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/pro/disputes`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setStats(statsRes.data);
            setDisputes(disputesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;

    const ChartSection = ({ data, color }: { data: number[], color: string }) => (
        <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Activité sur 7 jours</Text>
            <View style={styles.chartBars}>
                {['J-6', 'J-5', 'J-4', 'J-3', 'J-2', 'Hier', 'Ajdh'].map((day, index) => {
                    const value = data?.[index] || 0;
                    const maxValue = Math.max(...(data || [1]));
                    const height = (value / maxValue) * 80;
                    const isToday = index === 6;

                    return (
                        <View key={`day-${index}`} style={styles.chartBarContainer}>
                            <View
                                style={[
                                    styles.chartBar,
                                    { height: Math.max(height, 10), backgroundColor: isToday ? color : '#eee' },
                                ]}
                            />
                            <Text style={[styles.chartLabel, isToday && { color, fontWeight: 'bold' }]}>
                                {day}
                            </Text>
                        </View>
                    );
                })}
            </View>
            <Text style={styles.chartTotal}>
                Total: {data?.reduce((a, b) => a + b, 0) || 0}
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

    const renderHeader = (title: string, color: string, icon: any) => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
                <Text style={styles.greeting}>Bonjour {user?.display_name}</Text>
                <Text style={[styles.storeName, { color }]}>{title}</Text>
            </View>
            <View style={[styles.proBadge, { backgroundColor: color }]}>
                <Ionicons name={icon} size={16} color="#fff" />
            </View>
        </View>
    );

    const renderDisputesSection = () => {
        if (!disputes || disputes.length === 0) return null;
        return (
            <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="warning" size={24} color="#FF453A" />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 8, color: '#FF453A' }}>
                        Litiges en cours ({disputes.length})
                    </Text>
                </View>
                {disputes.map(d => (
                    <View key={d.id} style={{ backgroundColor: '#fff0f0', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#ffcdd2' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#c62828' }}>
                            {d.reason === 'item_not_received' ? 'Non Reçu' : d.reason === 'item_damaged' ? 'Endommagé' : d.reason}
                        </Text>
                        <Text style={{ marginTop: 4, color: '#333' }}>{d.description}</Text>
                        <Text style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                            {formatPrice(d.amount * 100)} • {new Date(d.created_at).toLocaleDateString()}
                        </Text>
                        <View style={{ marginTop: 12, flexDirection: 'row' }}>
                            <TouchableOpacity style={{ backgroundColor: '#fff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginRight: 8 }}>
                                <Text style={{ fontSize: 12 }}>Contacter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ backgroundColor: '#FF453A', padding: 8, borderRadius: 8 }}>
                                <Text style={{ fontSize: 12, color: '#fff' }}>Rembourser</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    // 1. ANTI-WASTE EXCLUSIVE
    if (isAntiWasteOnly) {
        return (
            <View style={styles.container}>
                {renderHeader("Espace Anti-gaspi", "#4C7B4B", "leaf")}
                <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C7B4B" />}>
                    {renderDisputesSection()}
                    <Text style={styles.dateText}>{format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}</Text>

                    <View style={styles.statsGrid}>
                        <TouchableOpacity style={[styles.statCard, { backgroundColor: '#4C7B4B' }]} onPress={() => router.push('/(pro)/mes-paniers?filter=completed')}>
                            <Ionicons name="cart" size={32} color="#fff" />
                            <Text style={styles.primaryStatValue}>{stats?.anti_waste.today_sales_count || 0}</Text>
                            <Text style={styles.primaryStatLabel}>Paniers sauvés</Text>
                            <Text style={styles.primaryStatSub}>Aujourd'hui</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.statCard, { backgroundColor: '#2E7D32' }]} onPress={() => router.push('/(pro)/chiffre-affaires')}>
                            <Ionicons name="wallet" size={32} color="#fff" />
                            <Text style={styles.primaryStatValue}>{formatPrice(stats?.anti_waste.today_revenue_cents || 0)}</Text>
                            <Text style={styles.primaryStatLabel}>Chiffre d'affaires</Text>
                            <Text style={styles.primaryStatSub}>Aujourd'hui</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statsGrid}>
                        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(pro)/mes-paniers?filter=active')}>
                            <Ionicons name="basket" size={28} color="#4C7B4B" />
                            <Text style={styles.statValue}>{stats?.anti_waste.active_baskets || 0}</Text>
                            <Text style={styles.statLabel}>Panier en ligne</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(pro)/mes-paniers?filter=pending')}>
                            <Ionicons name="time" size={28} color="#FF9800" />
                            <Text style={styles.statValue}>{stats?.anti_waste.pending_pickups || 0}</Text>
                            <Text style={styles.statLabel}>À récupérer</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>Actions rapides</Text>
                    <TouchableOpacity style={[styles.fullActionBtn, { backgroundColor: '#4C7B4B' }]} onPress={() => router.push('/(pro)/nouveau-panier')}>
                        <Ionicons name="add-circle" size={28} color="#fff" />
                        <Text style={styles.fullActionBtnText}>Créer un panier suprise</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.fullActionBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#4C7B4B' }]} onPress={() => router.push('/(pro)/scanner-retrait')}>
                        <Ionicons name="qr-code" size={28} color="#4C7B4B" />
                        <Text style={[styles.fullActionBtnText, { color: '#4C7B4B' }]}>Scanner un retrait client</Text>
                    </TouchableOpacity>

                    <View style={{ marginTop: 24 }}>
                        <ChartSection data={stats?.anti_waste.week_stats || []} color="#4C7B4B" />
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        );
    }

    // 2. RENTAL EXCLUSIVE
    if (isRentalOnly) {
        return (
            <View style={styles.container}>
                {renderHeader("Espace Location", "#4C7B4B", "key")}
                <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C7B4B" />}>
                    {renderDisputesSection()}
                    <Text style={styles.dateText}>{format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}</Text>

                    <View style={styles.statsGrid}>
                        <TouchableOpacity style={[styles.statCard, { backgroundColor: '#4C7B4B' }]} onPress={() => router.push('/(pro)/mes-locations')}>
                            <Ionicons name="calendar" size={32} color="#fff" />
                            <Text style={styles.primaryStatValue}>{stats?.rental.active_rentals || 0}</Text>
                            <Text style={styles.primaryStatLabel}>Locations en cours</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.statCard, { backgroundColor: '#2E7D32' }]} onPress={() => router.push('/(pro)/mes-locations')}>
                            <Ionicons name="return-down-back" size={32} color="#fff" />
                            <Text style={styles.primaryStatValue}>{stats?.rental.pending_returns || 0}</Text>
                            <Text style={styles.primaryStatLabel}>Retours attendus</Text>
                            <Text style={styles.primaryStatSub}>Ce jour</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>Actions rapides</Text>
                    <TouchableOpacity style={[styles.fullActionBtn, { backgroundColor: '#4C7B4B' }]} onPress={() => router.push('/(pro)/nouvelle-location')}>
                        <Ionicons name="add-circle" size={28} color="#fff" />
                        <Text style={styles.fullActionBtnText}>Nouvel objet en location</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.fullActionBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#4C7B4B' }]} onPress={() => router.push('/(pro)/scanner-retrait')}>
                        <Ionicons name="qr-code" size={28} color="#4C7B4B" />
                        <Text style={[styles.fullActionBtnText, { color: '#4C7B4B' }]}>Scanner un retrait client</Text>
                    </TouchableOpacity>

                    <View style={{ marginTop: 24 }}>
                        <ChartSection data={stats?.rental.week_stats || []} color="#4C7B4B" />
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        );
    }

    // 3. SALE EXCLUSIVE
    if (isSaleOnly) {
        return (
            <View style={styles.container}>
                {renderHeader("Espace Seconde Main", "#4C7B4B", "shirt")}
                <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C7B4B" />}>
                    {renderDisputesSection()}
                    <Text style={styles.dateText}>{format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}</Text>

                    <View style={styles.statsGrid}>
                        <TouchableOpacity style={[styles.statCard, { backgroundColor: '#4C7B4B' }]} onPress={() => router.push('/(pro)/mes-articles')}>
                            <Ionicons name="trending-up" size={32} color="#fff" />
                            <Text style={styles.primaryStatValue}>{stats?.sale.today_sales_count || 0}</Text>
                            <Text style={styles.primaryStatLabel}>Ventes du jour</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.statCard, { backgroundColor: '#2E7D32' }]} onPress={() => router.push('/(pro)/chiffre-affaires')}>
                            <Ionicons name="cash" size={32} color="#fff" />
                            <Text style={styles.primaryStatValue}>{formatPrice(stats?.sale.today_revenue_cents || 0)}</Text>
                            <Text style={styles.primaryStatLabel}>Chiffre d'affaires</Text>
                            <Text style={styles.primaryStatSub}>Aujourd'hui</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statsGrid}>
                        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(pro)/mes-articles')}>
                            <Ionicons name="layers" size={28} color="#4C7B4B" />
                            <Text style={styles.statValue}>{stats?.sale.active_items || 0}</Text>
                            <Text style={styles.statLabel}>Articles en ligne</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>Actions rapides</Text>
                    <TouchableOpacity style={[styles.fullActionBtn, { backgroundColor: '#4C7B4B' }]} onPress={() => router.push('/(pro)/nouvel-article')}>
                        <Ionicons name="add-circle" size={28} color="#fff" />
                        <Text style={styles.fullActionBtnText}>Mettre en vente un article</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.fullActionBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#4C7B4B' }]} onPress={() => router.push('/(pro)/scanner-retrait')}>
                        <Ionicons name="qr-code" size={28} color="#4C7B4B" />
                        <Text style={[styles.fullActionBtnText, { color: '#4C7B4B' }]}>Scanner un retrait client</Text>
                    </TouchableOpacity>

                    <View style={{ marginTop: 24 }}>
                        <ChartSection data={stats?.sale.week_stats || []} color="#4C7B4B" />
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        );
    }

    const renderAntiWasteSection = () => (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Ionicons name="leaf" size={20} color="#4C7B4B" />
                <Text style={styles.sectionTitle}>Espace Anti-gaspi</Text>
            </View>

            <View style={styles.statsGrid}>
                <TouchableOpacity
                    style={[styles.statCard, styles.primaryCard]}
                    onPress={() => router.push('/(pro)/mes-paniers?filter=completed')}
                >
                    <Ionicons name="cart" size={28} color="#fff" />
                    <Text style={styles.primaryStatValue}>{stats?.anti_waste.today_sales_count || 0}</Text>
                    <Text style={styles.primaryStatLabel}>Paniers vendus</Text>
                    <Text style={styles.primaryStatSub}>Aujourd'hui</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statCard, styles.primaryCard, styles.revenueCard]}
                    onPress={() => router.push('/(pro)/chiffre-affaires')}
                >
                    <Ionicons name="cash" size={28} color="#fff" />
                    <Text style={styles.primaryStatValue}>
                        {formatPrice(stats?.anti_waste.today_revenue_cents || 0)}
                    </Text>
                    <Text style={styles.primaryStatLabel}>Chiffre d'affaires</Text>
                    <Text style={styles.primaryStatSub}>Aujourd'hui</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => router.push('/(pro)/mes-paniers?filter=active')}
                >
                    <View style={styles.statIconContainer}>
                        <Ionicons name="basket" size={24} color="#4C7B4B" />
                    </View>
                    <Text style={styles.statValue}>{stats?.anti_waste.active_baskets || 0}</Text>
                    <Text style={styles.statLabel}>Paniers actifs</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => router.push('/(pro)/mes-paniers?filter=pending')}
                >
                    <View style={[styles.statIconContainer, styles.warningIcon]}>
                        <Ionicons name="time" size={24} color="#ff9800" />
                    </View>
                    <Text style={styles.statValue}>{stats?.anti_waste.pending_pickups || 0}</Text>
                    <Text style={styles.statLabel}>À récupérer</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.fullActionBtn}
                onPress={() => router.push('/(pro)/nouveau-panier')}
            >
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.fullActionBtnText}>Créer un nouveau panier</Text>
            </TouchableOpacity>
        </View>
    );

    const renderRentalSection = () => (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Ionicons name="key" size={20} color="#1565C0" />
                <Text style={styles.sectionTitle}>Espace Location</Text>
            </View>

            <View style={styles.statsGrid}>
                <TouchableOpacity
                    style={[styles.statCard, { backgroundColor: '#1565C0' }]}
                    onPress={() => router.push('/(pro)/mes-locations')}
                >
                    <Ionicons name="calendar" size={28} color="#fff" />
                    <Text style={styles.primaryStatValue}>{stats?.rental.active_rentals || 0}</Text>
                    <Text style={styles.primaryStatLabel}>Locations en cours</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statCard, { backgroundColor: '#0D47A1' }]}
                    onPress={() => router.push('/(pro)/mes-locations')}
                >
                    <Ionicons name="return-down-back" size={28} color="#fff" />
                    <Text style={styles.primaryStatValue}>{stats?.rental.pending_returns || 0}</Text>
                    <Text style={styles.primaryStatLabel}>Retours attendus</Text>
                    {stats?.rental?.pending_returns ? (
                        <Text style={styles.primaryStatSub}>Attention aux retards</Text>
                    ) : null}
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.fullActionBtn, { backgroundColor: '#1565C0' }]}
                onPress={() => router.push('/(pro)/nouvelle-location')}
            >
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.fullActionBtnText}>Mettre en location un objet</Text>
            </TouchableOpacity>
        </View>
    );

    const renderSaleSection = () => (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Ionicons name="shirt" size={20} color="#E65100" />
                <Text style={styles.sectionTitle}>Espace Vente Seconde Main</Text>
            </View>

            <View style={styles.statsGrid}>
                <TouchableOpacity
                    style={[styles.statCard, { backgroundColor: '#EF6C00' }]}
                    onPress={() => router.push('/(pro)/mes-articles')}
                >
                    <Ionicons name="trending-up" size={28} color="#fff" />
                    <Text style={styles.primaryStatValue}>{stats?.sale.today_sales_count || 0}</Text>
                    <Text style={styles.primaryStatLabel}>Ventes du jour</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statCard, { backgroundColor: '#E65100' }]}
                    onPress={() => router.push('/(pro)/chiffre-affaires')}
                >
                    <Ionicons name="cash-outline" size={28} color="#fff" />
                    <Text style={styles.primaryStatValue}>{formatPrice(stats?.sale.today_revenue_cents || 0)}</Text>
                    <Text style={styles.primaryStatLabel}>Chiffre d'affaires</Text>
                </TouchableOpacity>
            </View>



            <View style={styles.statsGrid}>
                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => router.push('/(pro)/mes-articles')}
                >
                    <View style={[styles.statIconContainer, { backgroundColor: '#FFF3E0' }]}>
                        <Ionicons name="layers" size={24} color="#E65100" />
                    </View>
                    <Text style={styles.statValue}>{stats?.sale.active_items || 0}</Text>
                    <Text style={styles.statLabel}>Articles en ligne</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => router.push('/(pro)/payouts')}
                >
                    <View style={[styles.statIconContainer, { backgroundColor: '#e8f5e9' }]}>
                        <Ionicons name="card" size={24} color="#4C7B4B" />
                    </View>
                    <Text style={styles.statValue}>Virements</Text>
                    <Text style={styles.statLabel}>Configuration</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.fullActionBtn, { backgroundColor: '#E65100' }]}
                onPress={() => router.push('/(pro)/nouvel-article')}
            >
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.fullActionBtnText}>Vendre un article</Text>
            </TouchableOpacity>
        </View >
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.greeting}>Hub Commerçant</Text>
                    <Text style={styles.storeName}>{user?.display_name || 'Partenaire'}</Text>
                </View>
                <View style={styles.proBadge}>
                    <Ionicons name="briefcase" size={16} color="#fff" />
                    <Text style={styles.proBadgeText}>PRO</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C7B4B" />
                }
            >
                {/* Date */}
                <Text style={styles.dateText}>
                    {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                </Text>

                {renderDisputesSection()}

                {hasAntiWaste && renderAntiWasteSection()}
                {hasRent && renderRentalSection()}
                {hasSale && renderSaleSection()}

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
    headerCenter: {
        flex: 1,
        marginLeft: 8,
    },
    greeting: {
        fontSize: 14,
        color: '#666',
    },
    storeName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4C7B4B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    proBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        textTransform: 'capitalize',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    primaryCard: {
        backgroundColor: '#4C7B4B',
    },
    revenueCard: {
        backgroundColor: '#2e7d32',
    },
    primaryStatValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
    },
    primaryStatLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    primaryStatSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    warningIcon: {
        backgroundColor: '#fff3e0',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    soldCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    soldInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    soldLabel: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    soldRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    soldValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 24,
        marginBottom: 12,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e8f5e9',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4C7B4B',
        marginTop: 8,
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
    },
    chartBars: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 100,
    },
    chartBarContainer: {
        alignItems: 'center',
    },
    chartBar: {
        width: 24,
        backgroundColor: '#e8f5e9',
        borderRadius: 4,
        marginBottom: 8,
    },
    chartBarToday: {
        backgroundColor: '#4C7B4B',
    },
    chartLabel: {
        fontSize: 12,
        color: '#999',
    },
    chartLabelToday: {
        color: '#4C7B4B',
        fontWeight: 'bold',
    },
    chartTotal: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
    },
    // New styles
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    fullActionBtn: {
        backgroundColor: '#4C7B4B',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    fullActionBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
});
