import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStripe } from '@stripe/stripe-react-native';

import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

export default function DealPaymentScreen() {
    const router = useRouter();
    const { dealId } = useLocalSearchParams();
    const [deal, setDeal] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchDeal();
    }, [dealId]);

    const fetchDeal = async () => {
        try {
            const response = await axios.get(`${API_URL}/deals/${dealId}`);
            setDeal(response.data);
        } catch (error) {
            console.error('Error fetching deal:', error);
            Alert.alert('Erreur', 'Impossible de charger l\'offre');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const handlePayment = async () => {
        setProcessing(true);

        try {
            const token = await AsyncStorage.getItem('auth_token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // 1. Create Order (get clientSecret)
            const response = await axios.post(`${API_URL}/deals/${dealId}/order`, {}, config);
            const { client_secret, id: orderId } = response.data;

            if (!client_secret) {
                Alert.alert('Erreur', 'Impossible d\'initialiser le paiement');
                return;
            }

            // 2. Initialize Payment Sheet
            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: "Yondly",
                paymentIntentClientSecret: client_secret,
                returnURL: 'yondly://stripe-redirect',
            });

            if (initError) {
                Alert.alert('Erreur', initError.message);
                return;
            }

            // 3. Present Payment Sheet
            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                Alert.alert('Paiement annulé', paymentError.message);
            } else {
                // Success
                Alert.alert('Succès', 'Paiement confirmé !');
                router.replace(`/order/success?orderId=${orderId}`);
            }

        } catch (error: any) {
            console.error('Payment error:', error);
            Alert.alert('Erreur', error.response?.data?.detail || 'Le paiement a échoué');
        } finally {
            setProcessing(false);
        }
    };

    const formatPrice = (price: number) => `${price.toFixed(2)}€`;

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4C7B4B" />
            </View>
        );
    }

    if (!deal) {
        return (
            <View style={styles.centerContainer}>
                <Text>Panier introuvable</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Validation du Panier" />

            <ScrollView style={styles.content}>

                {/* Deal Summary Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Votre Panier</Text>

                    <View style={styles.dealRow}>
                        <View style={styles.dealInfo}>
                            <Text style={styles.dealTitle}>{deal.title}</Text>
                            <Text style={styles.storeName}>{deal.store?.name}</Text>

                            <View style={styles.priceContainer}>
                                <Text style={styles.originalPrice}>{formatPrice(deal.original_price)}</Text>
                                <Text style={styles.dealPrice}>{formatPrice(deal.deal_price)}</Text>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>-{deal.discount_value}%</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />
                    <View style={[styles.priceRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total à payer</Text>
                        <Text style={styles.totalValue}>{formatPrice(deal.deal_price)}</Text>
                    </View>
                </View>


                {/* Payment Method Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Moyen de Paiement</Text>
                    <TouchableOpacity style={styles.paymentOption} activeOpacity={0.7}>
                        <Ionicons name="logo-apple" size={24} color="#000" />
                        <Text style={styles.paymentText}>Apple Pay</Text>
                        <Ionicons name="checkmark-circle" size={24} color="#4C7B4B" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.paymentOption} activeOpacity={0.7}>
                        <Ionicons name="card" size={24} color="#666" />
                        <Text style={styles.paymentText}>Carte bancaire .... 4242</Text>
                        <View style={styles.radioCircle} />
                    </TouchableOpacity>
                </View>

                {/* Security Info */}
                <View style={styles.infoCard}>
                    <Ionicons name="shield-checkmark" size={24} color="#4C7B4B" />
                    <View style={styles.infoText}>
                        <Text style={styles.infoTitle}>Paiement 100% Sécurisé</Text>
                        <Text style={styles.infoSubtitle}>
                            Transaction chiffrée SSL. Nous ne stockons pas vos coordonnées bancaires.
                        </Text>
                    </View>
                </View>

            </ScrollView >

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.payButton, processing && styles.payButtonDisabled]}
                    onPress={handlePayment}
                    disabled={processing}
                >
                    {processing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.payButtonText}>
                                Payer {formatPrice(deal.deal_price)}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                    En payant, vous acceptez les CGV de Yondly.
                </Text>
            </View>
        </View >
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
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    dealRow: {
        flexDirection: 'row',
    },
    dealInfo: {
        flex: 1,
    },
    dealTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    storeName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    originalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    dealPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    badge: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 16,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalRow: {
        marginTop: 0,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    paymentText: {
        flex: 1,
        fontSize: 16,
        marginLeft: 12,
        color: '#333',
        fontWeight: '500',
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ddd',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#e8f5e9',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4C7B4B',
        marginBottom: 4,
    },
    infoSubtitle: {
        fontSize: 13,
        color: '#4C7B4B',
        lineHeight: 18,
        opacity: 0.9,
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    payButton: {
        backgroundColor: '#4C7B4B',
        padding: 18,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4C7B4B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    payButtonDisabled: {
        opacity: 0.7,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    termsText: {
        marginTop: 12,
        textAlign: 'center',
        fontSize: 11,
        color: '#999',
    }
});
