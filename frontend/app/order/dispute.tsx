import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';

import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

const DISPUTE_REASONS = [
    { value: 'item_not_received', label: 'Article non reçu', icon: 'cube-outline' },
    { value: 'item_damaged', label: 'Article endommagé', icon: 'warning-outline' },
    { value: 'item_not_as_described', label: 'Non conforme à la description', icon: 'document-text-outline' },
    { value: 'seller_unresponsive', label: 'Vendeur ne répond pas', icon: 'chatbubble-ellipses-outline' },
    { value: 'other', label: 'Autre problème', icon: 'help-circle-outline' },
];

export default function CreateDisputeScreen() {
    const router = useRouter();
    const { orderId, rentalId } = useLocalSearchParams();
    const { token } = useAuthStore();

    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransaction();
    }, []);

    const fetchTransaction = async () => {
        try {
            if (orderId) {
                const response = await axios.get(`${API_URL}/orders/${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTransaction({ type: 'order', ...response.data });
            } else if (rentalId) {
                const response = await axios.get(`${API_URL}/rentals/${rentalId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTransaction({ type: 'rental', ...response.data });
            }
        } catch (error) {
            Alert.alert('Erreur', 'Transaction introuvable');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedReason) {
            Alert.alert('Erreur', 'Veuillez sélectionner une raison');
            return;
        }
        if (description.trim().length < 20) {
            Alert.alert('Erreur', 'Veuillez décrire le problème en détail (min 20 caractères)');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(
                `${API_URL}/disputes`,
                {
                    order_id: orderId || null,
                    rental_id: rentalId || null,
                    reason: selectedReason,
                    description: description.trim(),
                    evidence_photos: [],
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert(
                'Litige créé',
                'Votre litige a été enregistré. Notre équipe l\'examinera sous 48h.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de créer le litige');
        } finally {
            setSubmitting(false);
        }
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
            <ScreenHeader title="Ouvrir un litige" />

            <ScrollView style={styles.content}>
                {/* Transaction Info */}
                {transaction && (
                    <View style={styles.infoCard}>
                        <Ionicons
                            name={transaction.type === 'order' ? 'cart' : 'key'}
                            size={24}
                            color="#4C7B4B"
                        />
                        <View style={styles.infoText}>
                            <Text style={styles.infoTitle}>
                                {transaction.type === 'order' ? 'Commande' : 'Location'}
                            </Text>
                            <Text style={styles.infoSubtitle}>
                                {transaction.item?.title || 'Transaction'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Reason Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quelle est la raison du litige ?</Text>
                    {DISPUTE_REASONS.map((reason) => (
                        <TouchableOpacity
                            key={reason.value}
                            style={[
                                styles.reasonCard,
                                selectedReason === reason.value && styles.reasonCardSelected,
                            ]}
                            onPress={() => setSelectedReason(reason.value)}
                        >
                            <Ionicons
                                name={reason.icon as any}
                                size={24}
                                color={selectedReason === reason.value ? '#4C7B4B' : '#666'}
                            />
                            <Text
                                style={[
                                    styles.reasonText,
                                    selectedReason === reason.value && styles.reasonTextSelected,
                                ]}
                            >
                                {reason.label}
                            </Text>
                            {selectedReason === reason.value && (
                                <Ionicons name="checkmark-circle" size={24} color="#4C7B4B" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Décrivez le problème</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Expliquez en détail ce qui s'est passé..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{description.length}/500</Text>
                </View>

                {/* Warning */}
                <View style={styles.warningCard}>
                    <Ionicons name="information-circle" size={20} color="#ff9800" />
                    <Text style={styles.warningText}>
                        Les litiges abusifs peuvent entraîner des pénalités sur votre compte.
                        Assurez-vous que votre réclamation est fondée.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    <Text style={styles.submitButtonText}>
                        {submitting ? 'Envoi...' : 'Soumettre le litige'}
                    </Text>
                </TouchableOpacity>
            </View>
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
    content: {
        flex: 1,
        padding: 16,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    infoText: {
        marginLeft: 12,
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        color: '#4C7B4B',
        fontWeight: '600',
    },
    infoSubtitle: {
        fontSize: 16,
        color: '#333',
        marginTop: 2,
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
    reasonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    reasonCardSelected: {
        borderColor: '#4C7B4B',
        backgroundColor: '#f0f9f0',
    },
    reasonText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#333',
    },
    reasonTextSelected: {
        color: '#4C7B4B',
        fontWeight: '600',
    },
    textArea: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 120,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    charCount: {
        textAlign: 'right',
        color: '#999',
        fontSize: 12,
        marginTop: 8,
    },
    warningCard: {
        flexDirection: 'row',
        backgroundColor: '#fff8e1',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    warningText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 13,
        color: '#f57c00',
        lineHeight: 18,
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    submitButton: {
        backgroundColor: '#f44336',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
