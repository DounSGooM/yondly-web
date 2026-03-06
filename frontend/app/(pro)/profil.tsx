import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';

import { API_URL } from '../../src/config/api';

interface ProStats {
    total_baskets_sold: number;
    average_rating: number;
    total_revenue_cents: number;
}

export default function ProProfilScreen() {
    const router = useRouter();
    const { user, token, logout } = useAuthStore();
    const [stats, setStats] = useState<ProStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/pro/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStats(response.data);
        } catch (error) {
            // Mock data
            setStats({
                total_baskets_sold: 247,
                average_rating: 4.8,
                total_revenue_cents: 89200,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: () => {
                        logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    const formatPrice = (cents: number) => `${(cents / 100).toFixed(0)}€`;

    // Determine core service item based on services
    const services = user?.services || [];
    const isRentalOnly = services.length === 1 && services[0] === 'rent';
    const isSaleOnly = services.length === 1 && services[0] === 'sale';

    // Default to Anti-waste (or mixed) behavior
    let coreServiceItem = {
        icon: 'basket-outline',
        label: 'Mes paniers',
        subtitle: 'Gérer vos paniers actifs',
        route: '/(pro)/mes-paniers?filter=active',
        color: '#4C7B4B'
    };

    if (isRentalOnly) {
        coreServiceItem = {
            icon: 'key-outline',
            label: 'Mes locations',
            subtitle: 'Gérer vos objets en location',
            route: '/(pro)/mes-locations',
            color: '#4C7B4B'
        };
    } else if (isSaleOnly) {
        coreServiceItem = {
            icon: 'shirt-outline',
            label: 'Mes articles',
            subtitle: 'Gérer vos articles en vente',
            route: '/(pro)/mes-articles',
            color: '#4C7B4B'
        };
    }

    const mainMenuItems = [
        {
            icon: 'receipt-outline',
            label: 'Historique des ventes',
            subtitle: 'Voir toutes vos transactions',
            route: '/(pro)/historique',
            color: '#4C7B4B'
        },
        coreServiceItem,
        {
            icon: 'qr-code-outline',
            label: 'Scanner un retrait',
            subtitle: 'Valider une commande client',
            route: '/(pro)/scanner-retrait',
            color: '#4C7B4B'
        },
    ];

    const settingsMenuItems = [
        {
            icon: 'storefront-outline',
            label: 'Informations boutique',
            route: '/profile/store-settings'
        },
        {
            icon: 'wallet-outline',
            label: 'Portefeuille & Paiements',
            route: '/profile/wallet'
        },
        {
            icon: 'notifications-outline',
            label: 'Notifications',
            route: '/profile/settings'
        },
        {
            icon: 'help-circle-outline',
            label: 'Aide & Support',
            route: '/(pro)/aide-pro'
        },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mon compte</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Store Card */}
                <TouchableOpacity
                    style={styles.storeCard}
                    onPress={() => router.push('/profile/store-settings')}
                >
                    <View style={styles.storeAvatar}>
                        {user?.photo_url ? (
                            <Image source={{ uri: user.photo_url }} style={styles.avatarImage} />
                        ) : (
                            <Ionicons name="storefront" size={36} color="#4C7B4B" />
                        )}
                    </View>
                    <View style={styles.storeInfo}>
                        <Text style={styles.storeName}>{user?.display_name || 'Ma Boutique'}</Text>
                        <Text style={styles.storeEmail}>{user?.email}</Text>
                        <View style={styles.proBadge}>
                            <Ionicons name="shield-checkmark" size={12} color="#fff" />
                            <Text style={styles.proBadgeText}>COMPTE PRO</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>

                {/* Stats Summary */}
                <View style={styles.statsCard}>
                    {loading ? (
                        <ActivityIndicator color="#4C7B4B" />
                    ) : (
                        <View style={styles.statsRow}>
                            <TouchableOpacity
                                style={styles.statItem}
                                onPress={() => router.push('/(pro)/mes-paniers?filter=completed')}
                            >
                                <Text style={styles.statValue}>{stats?.total_baskets_sold || 0}</Text>
                                <Text style={styles.statLabel}>Vendus</Text>
                            </TouchableOpacity>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <View style={styles.ratingContainer}>
                                    <Text style={styles.statValue}>{stats?.average_rating?.toFixed(1) || '–'}</Text>
                                    <Ionicons name="star" size={14} color="#ff9800" />
                                </View>
                                <Text style={styles.statLabel}>Note</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <TouchableOpacity
                                style={styles.statItem}
                                onPress={() => router.push('/(pro)/chiffre-affaires')}
                            >
                                <Text style={styles.statValue}>{formatPrice(stats?.total_revenue_cents || 0)}</Text>
                                <Text style={styles.statLabel}>CA total</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Main Actions */}
                <Text style={styles.sectionTitle}>Gestion</Text>
                <View style={styles.menu}>
                    {mainMenuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, index < mainMenuItems.length - 1 && styles.menuItemBorder]}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                                <Ionicons name={item.icon as any} size={22} color={item.color} />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Settings */}
                <Text style={styles.sectionTitle}>Paramètres</Text>
                <View style={styles.menu}>
                    {settingsMenuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, index < settingsMenuItems.length - 1 && styles.menuItemBorder]}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View style={styles.menuIconContainer}>
                                <Ionicons name={item.icon as any} size={22} color="#666" />
                            </View>
                            <Text style={styles.menuLabelSimple}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color="#d32f2f" />
                    <Text style={styles.logoutText}>Déconnexion</Text>
                </TouchableOpacity>

                {/* Version */}
                <Text style={styles.versionText}>Yondly Pro v1.0.0</Text>

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    storeCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 16,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    storeAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    storeInfo: {
        flex: 1,
        marginLeft: 12,
    },
    storeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    storeEmail: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4C7B4B',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 8,
        gap: 4,
    },
    proBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 10,
    },
    statsCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 16,
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        paddingVertical: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menu: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuContent: {
        flex: 1,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    menuLabelSimple: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 24,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ffcdd2',
        gap: 8,
    },
    logoutText: {
        color: '#d32f2f',
        fontSize: 16,
        fontWeight: '600',
    },
    versionText: {
        textAlign: 'center',
        color: '#ccc',
        fontSize: 12,
        marginTop: 24,
    },
});
