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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

import { API_URL } from '../../src/config/api';

interface Dispute {
    id: string;
    order_id?: string;
    rental_id?: string;
    reason: string;
    status: string;
    created_at: string;
    refund_amount_cents?: number;
}

const REASON_LABELS: Record<string, string> = {
    item_not_received: 'Article non reçu',
    item_damaged: 'Article endommagé',
    item_not_as_described: 'Non conforme',
    seller_unresponsive: 'Vendeur absent',
    other: 'Autre',
};

const STATUS_INFO: Record<string, { label: string; color: string; icon: string }> = {
    open: { label: 'Ouvert', color: '#ff9800', icon: 'time' },
    under_review: { label: 'En cours d\'examen', color: '#2196f3', icon: 'search' },
    resolved_buyer: { label: 'Résolu (remboursé)', color: '#4caf50', icon: 'checkmark-circle' },
    resolved_seller: { label: 'Résolu (pas de remboursement)', color: '#9e9e9e', icon: 'close-circle' },
    closed: { label: 'Fermé', color: '#666', icon: 'lock-closed' },
};

export default function DisputesListScreen() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        try {
            const response = await axios.get(`${API_URL}/disputes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDisputes(response.data);
        } catch (error) {
            console.error('Error fetching disputes:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const renderItem = ({ item }: { item: Dispute }) => {
        const statusInfo = STATUS_INFO[item.status] || STATUS_INFO.open;
        const reasonLabel = REASON_LABELS[item.reason] || item.reason;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/order/dispute-detail?id=${item.id}` as any)}
            >
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                    <Ionicons name={statusInfo.icon as any} size={16} color="#fff" />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{reasonLabel}</Text>
                    <Text style={styles.cardSubtitle}>
                        {item.order_id ? 'Commande' : 'Location'} • {statusInfo.label}
                    </Text>
                    <Text style={styles.cardDate}>
                        {format(new Date(item.created_at), 'd MMMM yyyy', { locale: fr })}
                    </Text>
                    {item.refund_amount_cents && item.refund_amount_cents > 0 && (
                        <Text style={styles.refundText}>
                            Remboursement: {(item.refund_amount_cents / 100).toFixed(2)}€
                        </Text>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
        );
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
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mes litiges</Text>
                <View style={styles.backButton} />
            </View>

            <FlatList
                data={disputes}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchDisputes();
                        }}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="shield-checkmark" size={64} color="#4C7B4B" />
                        <Text style={styles.emptyTitle}>Aucun litige</Text>
                        <Text style={styles.emptyText}>
                            Vous n'avez aucun litige en cours. C'est une bonne nouvelle!
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
    listContent: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statusBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
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
        marginBottom: 2,
    },
    cardDate: {
        fontSize: 12,
        color: '#999',
    },
    refundText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4caf50',
        marginTop: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4C7B4B',
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});
