import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

interface Dispute {
    id: string;
    order_id?: string;
    rental_id?: string;
    complainant_id: string;
    respondent_id: string;
    reason: string;
    description: string;
    status: string;
    created_at: string;
    refund_amount_cents?: number;
    admin_notes?: string;
    resolution?: string;
}

const REASON_LABELS: Record<string, string> = {
    item_not_received: 'Article non reçu',
    item_damaged: 'Article endommagé',
    item_not_as_described: 'Non conforme',
    seller_unresponsive: 'Vendeur absent',
    other: 'Autre',
};

const STATUS_INFO: Record<string, { label: string; color: string; icon: string; description: string }> = {
    open: {
        label: 'Ouvert',
        color: '#ff9800',
        icon: 'time',
        description: 'Votre litige a été reçu et est en attente d\'examen par notre équipe.'
    },
    under_review: {
        label: 'En cours d\'examen',
        color: '#2196f3',
        icon: 'search',
        description: 'Un administrateur est en train d\'analyser les éléments du dossier.'
    },
    resolved_buyer: {
        label: 'Résolu (Remboursé)',
        color: '#4caf50',
        icon: 'checkmark-circle',
        description: 'Le litige a été tranché en faveur de l\'acheteur/locataire. Un remboursement a été initié.'
    },
    resolved_seller: {
        label: 'Résolu (Maintenu)',
        color: '#9e9e9e',
        icon: 'close-circle',
        description: 'Le litige a été fermé sans remboursement. La transaction est validée.'
    },
    closed: {
        label: 'Fermé',
        color: '#666',
        icon: 'lock-closed',
        description: 'Ce dossier de litige est clos.'
    },
};

export default function DisputeDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { token, user } = useAuthStore();
    const [dispute, setDispute] = useState<Dispute | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchDispute();
        }
    }, [id]);

    const fetchDispute = async () => {
        try {
            const response = await axios.get(`${API_URL}/disputes/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDispute(response.data);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger les détails du litige');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4C7B4B" />
            </View>
        );
    }

    if (!dispute) return null;

    const statusInfo = STATUS_INFO[dispute.status] || STATUS_INFO.open;
    const isComplainant = user?.id === dispute.complainant_id;

    return (
        <View style={styles.container}>
            <ScreenHeader title="Détails du litige" />

            <ScrollView style={styles.content}>
                {/* Status Header */}
                <View style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}>
                    <Ionicons name={statusInfo.icon as any} size={32} color={statusInfo.color} />
                    <View style={styles.statusInfo}>
                        <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
                            {statusInfo.label}
                        </Text>
                        <Text style={styles.statusDescription}>
                            {statusInfo.description}
                        </Text>
                    </View>
                </View>

                {/* Dispute Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ma réclamation</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Motif</Text>
                            <Text style={styles.value}>{REASON_LABELS[dispute.reason] || dispute.reason}</Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.row}>
                            <Text style={styles.label}>Transaction</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (dispute.order_id) router.push(`/order/${dispute.order_id}` as any);
                                    if (dispute.rental_id) router.push(`/rental/detail?id=${dispute.rental_id}` as any);
                                }}
                            >
                                <Text style={styles.link}>
                                    {dispute.order_id ? `Commande #${dispute.order_id.substring(0, 8)}` : `Location #${dispute.rental_id?.substring(0, 8)}`}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.separator} />
                        <Text style={styles.label}>Description</Text>
                        <Text style={styles.descriptionText}>{dispute.description}</Text>

                        <Text style={styles.dateText}>
                            Ouvert le {format(new Date(dispute.created_at), 'd MMMM yyyy à HH:mm', { locale: fr })}
                        </Text>
                    </View>
                </View>

                {/* Resolution Info (if resolved) */}
                {['resolved_buyer', 'resolved_seller'].includes(dispute.status) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Résolution</Text>
                        <View style={styles.resolutionCard}>
                            <Ionicons name="hammer-outline" size={24} color="#333" />
                            <View style={styles.resolutionContent}>
                                <Text style={styles.resolutionTitle}>Décision de l'administrateur</Text>
                                <Text style={styles.resolutionText}>
                                    {dispute.resolution || (dispute.status === 'resolved_buyer'
                                        ? "Remboursement accordé à l'acheteur."
                                        : "Litige rejeté, paiement libéré au vendeur.")}
                                </Text>
                                {dispute.refund_amount_cents && dispute.refund_amount_cents > 0 && (
                                    <Text style={styles.refundAmount}>
                                        Montant remboursé : {(dispute.refund_amount_cents / 100).toFixed(2)}€
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* Contact Support Button - Placeholder for chat inside dispute */}
                <TouchableOpacity style={styles.supportButton} onPress={() => router.push('/profile/help' as any)}>
                    <Ionicons name="chatbox-ellipses-outline" size={20} color="#666" />
                    <Text style={styles.supportButtonText}>Contacter le support</Text>
                </TouchableOpacity>

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
    content: {
        flex: 1,
        padding: 16,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderLeftWidth: 4,
        elevation: 2,
    },
    statusInfo: {
        marginLeft: 16,
        flex: 1,
    },
    statusLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statusDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        elevation: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    link: {
        fontSize: 16,
        color: '#4C7B4B',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 12,
    },
    descriptionText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        marginTop: 8,
        marginBottom: 16,
    },
    dateText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        fontStyle: 'italic',
    },
    resolutionCard: {
        backgroundColor: '#f0f4f8',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    resolutionContent: {
        marginLeft: 12,
        flex: 1,
    },
    resolutionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    resolutionText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    refundAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4caf50',
        marginTop: 8,
    },
    supportButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        marginBottom: 32,
    },
    supportButtonText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
});
