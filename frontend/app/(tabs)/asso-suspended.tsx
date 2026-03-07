import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../src/config/api';
import { Deal } from '../../src/types';

interface QuotaInfo {
    daily_quota: number;
    claimed_today: number;
    remaining: number;
}

export default function AssoSuspendedScreen() {
    const router = useRouter();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [quota, setQuota] = useState<QuotaInfo | null>(null);

    // Claim modal state
    const [claimModalVisible, setClaimModalVisible] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [claimQuantity, setClaimQuantity] = useState('1');
    const [claiming, setClaiming] = useState(false);

    useEffect(() => {
        loadDeals();
        loadQuota();
    }, []);

    const loadQuota = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${API_URL}/associations/my-quota`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuota(response.data);
        } catch (error) {
            console.error('Error loading quota:', error);
        }
    };

    const loadDeals = async () => {
        try {
            const response = await axios.get(`${API_URL}/deals`);
            // Filter deals with available suspended baskets
            const suspendedDeals = response.data.filter(
                (deal: Deal) => deal.allow_suspension && (deal.suspended_available || 0) > 0
            );
            setDeals(suspendedDeals);
        } catch (error) {
            console.error('Error loading deals:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([loadDeals(), loadQuota()]);
        setRefreshing(false);
    };

    const openClaimModal = (deal: Deal) => {
        setSelectedDeal(deal);
        setClaimQuantity('1');
        setClaimModalVisible(true);
    };

    const confirmClaim = async () => {
        if (!selectedDeal) return;

        const available = selectedDeal.suspended_available || 0;
        const quantity = parseInt(claimQuantity || '1', 10);

        if (isNaN(quantity) || quantity < 1 || quantity > available) {
            Alert.alert('Erreur', `Quantité invalide (max: ${available})`);
            return;
        }

        setClaiming(true);
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const response = await axios.post(
                `${API_URL}/deals/${selectedDeal.id}/claim-suspended`,
                null,
                {
                    params: { quantity },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const order = response.data;
            setClaimModalVisible(false);
            loadDeals();
            loadQuota();

            // Navigate to share QR screen
            router.push({
                pathname: '/asso-share-qr',
                params: {
                    orderId: order.id,
                    pickupCode: order.handoff?.code || '',
                    storeName: selectedDeal.store?.name || 'Commerce',
                    dealTitle: selectedDeal.title,
                    quantity: String(quantity),
                }
            });
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Erreur lors de la récupération';
            Alert.alert('Erreur', message);
        } finally {
            setClaiming(false);
        }
    };

    const renderDeal = ({ item: deal }: { item: Deal }) => (
        <View style={styles.dealCard}>
            <View style={styles.dealHeader}>
                <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>{deal.store?.name || 'Commerce'}</Text>
                    <Text style={styles.storeAddress}>{deal.store?.address}</Text>
                </View>
                <View style={styles.availableBadge}>
                    <Text style={styles.availableCount}>{deal.suspended_available}</Text>
                    <Text style={styles.availableLabel}>dispo</Text>
                </View>
            </View>

            <View style={styles.dealContent}>
                <Text style={styles.dealTitle}>{deal.title}</Text>
                {deal.description && (
                    <Text style={styles.dealDescription} numberOfLines={2}>
                        {deal.description}
                    </Text>
                )}
            </View>

            <View style={styles.dealFooter}>
                <View style={styles.priceInfo}>
                    <Text style={styles.freeLabel}>Gratuit</Text>
                    <Text style={styles.originalPrice}>
                        Valeur : {((deal.deal_price || 0) / 100).toFixed(2)}€
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.claimButton}
                    onPress={() => openClaimModal(deal)}
                >
                    <Ionicons name="basket" size={18} color="#fff" />
                    <Text style={styles.claimButtonText}>Récupérer</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#4C7B4B" style={styles.loader} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Paniers Suspendus</Text>
                    {quota && (
                        <View style={[
                            styles.quotaBadge,
                            quota.remaining <= 3 && styles.quotaLow
                        ]}>
                            <Ionicons name="bag-handle" size={14} color={quota.remaining <= 3 ? '#D32F2F' : '#4C7B4B'} />
                            <Text style={[
                                styles.quotaText,
                                quota.remaining <= 3 && styles.quotaTextLow
                            ]}>
                                {quota.remaining}/{quota.daily_quota}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.headerSubtitle}>
                    {deals.length} panier(s) disponible(s) à récupérer
                </Text>
                {quota && quota.remaining <= 3 && quota.remaining > 0 && (
                    <Text style={styles.quotaWarning}>
                        ⚠️ Plus que {quota.remaining} panier(s) aujourd'hui
                    </Text>
                )}
                {quota && quota.remaining === 0 && (
                    <Text style={styles.quotaExhausted}>
                        ❌ Quota journalier atteint - Revenez demain
                    </Text>
                )}
            </View>

            <FlatList
                data={deals}
                keyExtractor={(item) => item.id}
                renderItem={renderDeal}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4C7B4B']} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="basket-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyTitle}>Aucun panier disponible</Text>
                        <Text style={styles.emptyText}>
                            De nouveaux paniers suspendus seront bientôt disponibles près de chez vous.
                        </Text>
                    </View>
                }
            />

            {/* Claim Modal */}
            <Modal
                visible={claimModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setClaimModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Récupérer des paniers</Text>

                        {selectedDeal && (
                            <>
                                <Text style={styles.modalStore}>{selectedDeal.store?.name}</Text>
                                <Text style={styles.modalDeal}>{selectedDeal.title}</Text>
                                <Text style={styles.modalAvailable}>
                                    {selectedDeal.suspended_available} panier(s) disponible(s)
                                </Text>
                            </>
                        )}

                        <Text style={styles.modalLabel}>Quantité à récupérer :</Text>
                        <TextInput
                            style={styles.quantityInput}
                            value={claimQuantity}
                            onChangeText={setClaimQuantity}
                            keyboardType="number-pad"
                            placeholder="1"
                            maxLength={2}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setClaimModalVisible(false)}
                                disabled={claiming}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.confirmButton, claiming && styles.buttonDisabled]}
                                onPress={confirmClaim}
                                disabled={claiming}
                            >
                                {claiming ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Récupérer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    quotaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4C7B4B15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    quotaLow: {
        backgroundColor: '#FFEBEE',
    },
    quotaText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4C7B4B',
    },
    quotaTextLow: {
        color: '#D32F2F',
    },
    quotaWarning: {
        fontSize: 13,
        color: '#F57C00',
        marginTop: 8,
    },
    quotaExhausted: {
        fontSize: 13,
        color: '#D32F2F',
        marginTop: 8,
        fontWeight: '600',
    },
    list: {
        padding: 16,
        gap: 12,
    },
    dealCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 12,
    },
    dealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    storeInfo: {
        flex: 1,
    },
    storeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    storeAddress: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    availableBadge: {
        backgroundColor: '#4C7B4B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignItems: 'center',
    },
    availableCount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    availableLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
    },
    dealContent: {
        marginBottom: 16,
    },
    dealTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1A1A1A',
    },
    dealDescription: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    dealFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    priceInfo: {},
    freeLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    originalPrice: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    claimButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4C7B4B',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    claimButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalStore: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4C7B4B',
        textAlign: 'center',
    },
    modalDeal: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
    },
    modalAvailable: {
        fontSize: 14,
        color: '#4FC3F7',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    quantityInput: {
        borderWidth: 2,
        borderColor: '#4C7B4B',
        borderRadius: 12,
        padding: 14,
        fontSize: 18,
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    confirmButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#4C7B4B',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
