import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';
import * as WebBrowser from 'expo-web-browser';

interface BoostModalProps {
    visible: boolean;
    onClose: () => void;
    itemId: string;
    itemTitle: string;
    hasFreeBoost: boolean;
    onBoostSuccess: () => void;
}

export default function BoostModal({
    visible,
    onClose,
    itemId,
    itemTitle,
    hasFreeBoost,
    onBoostSuccess,
}: BoostModalProps) {
    const token = useAuthStore((state) => state.token);
    const [loading, setLoading] = useState(false);

    const handleFreeBoost = async () => {
        try {
            setLoading(true);
            await axios.post(
                `${API_URL}/items/${itemId}/boost/free`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert('Succès', 'Votre annonce a été boostée pour 7 jours !');
            onBoostSuccess();
            onClose();
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Impossible d\'utiliser le boost gratuit');
        } finally {
            setLoading(false);
        }
    };

    const handlePaidBoost = async (packSize: number) => {
        try {
            setLoading(true);
            const response = await axios.post(
                `${API_URL}/items/${itemId}/boost/checkout?pack=${packSize}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { checkout_url } = response.data;
            if (checkout_url) {
                onClose(); // Close modal before opening browser
                const result = await WebBrowser.openBrowserAsync(checkout_url);
                if (result.type === 'cancel' || result.type === 'dismiss') {
                    // Provide feedback or silently handle
                }
            }
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de lancer le paiement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={loading}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <Ionicons name="rocket" size={48} color="#4C7B4B" />
                    </View>

                    <Text style={styles.title}>Booster "{itemTitle}"</Text>
                    <Text style={styles.subtitle}>
                        Remontez votre annonce en haut des résultats de recherche pendant 7 jours.
                    </Text>

                    {hasFreeBoost && (
                        <View style={styles.freeBoostContainer}>
                            <Text style={styles.freeBoostTitle}>🎁 Vous avez 1 boost gratuit !</Text>
                            <Text style={styles.freeBoostDesc}>
                                En tant que membre Pousse ou supérieur, vous bénéficiez d'un boost offert chaque mois.
                            </Text>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleFreeBoost}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Utiliser mon boost gratuit</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>{hasFreeBoost ? 'Ou acheter des boosts' : 'Acheter des boosts'}</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.pricingContainer}>
                        <TouchableOpacity
                            style={styles.pricingCard}
                            onPress={() => handlePaidBoost(1)}
                            disabled={loading}
                        >
                            <Text style={styles.packTitle}>1 Boost</Text>
                            <Text style={styles.packDesc}>Mise en avant 7 jours</Text>
                            <Text style={styles.packPrice}>1,99 €</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.pricingCard, styles.popularCard]}
                            onPress={() => handlePaidBoost(3)}
                            disabled={loading}
                        >
                            <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>Populaire</Text>
                            </View>
                            <Text style={styles.packTitle}>Pack de 3</Text>
                            <Text style={styles.packDesc}>Soit 1,66€ l'unité</Text>
                            <Text style={styles.packPrice}>4,99 €</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.pricingCard}
                            onPress={() => handlePaidBoost(5)}
                            disabled={loading}
                        >
                            <Text style={styles.packTitle}>Pack de 5</Text>
                            <Text style={styles.packDesc}>Soit 1,59€ l'unité</Text>
                            <Text style={styles.packPrice}>7,99 €</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: '60%',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    freeBoostContainer: {
        backgroundColor: '#fff3cd',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#ffeeba',
    },
    freeBoostTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 8,
    },
    freeBoostDesc: {
        fontSize: 13,
        color: '#856404',
        marginBottom: 16,
        lineHeight: 20,
    },
    primaryButton: {
        backgroundColor: '#4C7B4B',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#eee',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#999',
        fontSize: 14,
    },
    pricingContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 8,
    },
    pricingCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    popularCard: {
        borderColor: '#4C7B4B',
        borderWidth: 2,
        transform: [{ scale: 1.05 }],
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        backgroundColor: '#4C7B4B',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    popularBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    packTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
        marginTop: 8,
    },
    packDesc: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
        marginBottom: 12,
        minHeight: 30,
    },
    packPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
});
