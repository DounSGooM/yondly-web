import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStripe } from '../../src/utils/stripe';

import { API_URL } from '../../src/config/api';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/theme';

// Doit correspondre à MINIMUM_PAYABLE_CENTS côté backend
const MINIMUM_PAYABLE_CENTS = 300;

type PaymentMethod = 'apple_pay' | 'wallet' | 'card';

interface OrderPreview {
    item: {
        id: string;
        title: string;
        category: string;
        price_cents: number;
        photos?: string[];
    };
    amount_cents: number;
    platform_fee_cents: number;
    total_cents: number;
    orderId: string;
    client_secret: string;
}

export default function ItemPaymentScreen() {
    const router = useRouter();
    const { itemId } = useLocalSearchParams();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const [orderPreview, setOrderPreview] = useState<OrderPreview | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentReady, setPaymentReady] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
    const [walletBalance, setWalletBalance] = useState(0);

    useEffect(() => {
        if (itemId) {
            fetchItemAndPreparePayment();
            fetchWalletBalance();
        }
    }, [itemId]);

    const fetchWalletBalance = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const response = await axios.get(`${API_URL}/wallet/balance`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWalletBalance(response.data.balance_cents || 0);
        } catch (error) {
            console.log('Could not fetch wallet balance');
        }
    };

    const fetchItemAndPreparePayment = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Get item details
            const itemRes = await axios.get(`${API_URL}/items/${itemId}`, config);
            const item = itemRes.data;

            if (item.type !== 'sale') {
                Alert.alert('Erreur', 'Cet article n\'est pas en vente');
                router.back();
                return;
            }

            // Bloquer le paiement si l'article est en dessous du seuil
            if ((item.price_cents ?? 0) < MINIMUM_PAYABLE_CENTS) {
                setOrderPreview({
                    item,
                    amount_cents: item.price_cents,
                    platform_fee_cents: 0,
                    total_cents: item.price_cents,
                    orderId: '',
                    client_secret: '',
                });
                setLoading(false);
                return;
            }

            // Create order and get payment intent
            const orderRes = await axios.post(`${API_URL}/orders`, {
                item_id: item.id,
            }, config);

            const { client_secret, id: orderId } = orderRes.data;

            // Calculate preview
            const platformFee = Math.max(Math.round(item.price_cents * 0.05) + 49, 99);
            setOrderPreview({
                item,
                amount_cents: item.price_cents,
                platform_fee_cents: platformFee,
                total_cents: item.price_cents,
                orderId,
                client_secret,
            });

            if (client_secret && !client_secret.includes('demo')) {
                // Initialize Stripe PaymentSheet
                const { error } = await initPaymentSheet({
                    paymentIntentClientSecret: client_secret,
                    merchantDisplayName: 'Yondly',
                    style: 'automatic',
                    googlePay: {
                        merchantCountryCode: 'FR',
                        testEnv: true,
                    },
                    applePay: {
                        merchantCountryCode: 'FR',
                    },
                    defaultBillingDetails: {
                        address: {
                            country: 'FR',
                        },
                    },
                });

                if (error) {
                    console.error('PaymentSheet init error:', error);
                    setPaymentReady(false);
                } else {
                    setPaymentReady(true);
                }
            } else {
                setPaymentReady(false);
            }

        } catch (error: any) {
            console.error('Error preparing payment:', error);
            Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de préparer le paiement');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!orderPreview) return;

        setProcessing(true);
        const token = await AsyncStorage.getItem('auth_token');

        try {
            if (selectedMethod === 'wallet') {
                // Check if wallet has enough balance
                if (walletBalance < orderPreview.total_cents) {
                    Alert.alert(
                        'Solde insuffisant',
                        `Votre solde (${(walletBalance / 100).toFixed(2)}€) est insuffisant pour cet achat.`
                    );
                    setProcessing(false);
                    return;
                }

                // Pay with wallet
                await axios.post(
                    `${API_URL}/orders/${orderPreview.orderId}/pay-with-wallet`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                router.replace(`/order-detail?id=${orderPreview.orderId}`);

            } else if (selectedMethod === 'apple_pay' || selectedMethod === 'card') {
                if (!paymentReady) {
                    // Demo mode
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    await axios.post(
                        `${API_URL}/orders/${orderPreview.orderId}/confirm-payment`,
                        { demo: true },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } else {
                    // Present Stripe PaymentSheet
                    const { error } = await presentPaymentSheet();

                    if (error) {
                        if (error.code === 'Canceled') {
                            setProcessing(false);
                            return;
                        }
                        throw new Error(error.message);
                    }

                    // Confirm with backend
                    await axios.post(
                        `${API_URL}/orders/${orderPreview.orderId}/confirm-payment`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                }

                router.replace(`/order-detail?id=${orderPreview.orderId}`);
            }

        } catch (error: any) {
            console.error('Payment error:', error);
            Alert.alert('Erreur', error.response?.data?.detail || error.message || 'Le paiement a échoué');
        } finally {
            setProcessing(false);
        }
    };

    const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4C7B4B" />
                <Text style={styles.loadingText}>Préparation du paiement...</Text>
            </View>
        );
    }

    if (!orderPreview) {
        return (
            <View style={styles.centerContainer}>
                <Text>Article introuvable</Text>
            </View>
        );
    }

    const canPayWithWallet = walletBalance >= orderPreview.total_cents;
    const isBelowMinimum = (orderPreview.amount_cents ?? 0) < MINIMUM_PAYABLE_CENTS;

    // ── Article en dessous du seuil : paiement non disponible ──
    if (isBelowMinimum) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Paiement</Text>
                    <View style={styles.backButton} />
                </View>
                <View style={styles.belowMinContainer}>
                    <View style={styles.belowMinIcon}>
                        <Ionicons name="information-circle-outline" size={44} color={colors.textTertiary} />
                    </View>
                    <Text style={styles.belowMinTitle}>Paiement non disponible</Text>
                    <Text style={styles.belowMinDesc}>
                        Le paiement sécurisé est disponible à partir de{' '}
                        <Text style={styles.belowMinAmount}>
                            {(MINIMUM_PAYABLE_CENTS / 100).toFixed(2).replace('.', ',')} €
                        </Text>
                        .{'\n\n'}
                        Pour les petits objets, privilégiez un don gratuit ou un échange direct.
                    </Text>
                    <View style={styles.belowMinAlternatives}>
                        <View style={styles.belowMinRow}>
                            <Ionicons name="gift-outline" size={18} color={colors.primary} />
                            <Text style={styles.belowMinRowText}>Proposez-le en don — c'est rapide et gratuit</Text>
                        </View>
                        <View style={styles.belowMinRow}>
                            <Ionicons name="swap-horizontal-outline" size={18} color="#7C3AED" />
                            <Text style={styles.belowMinRowText}>Ou échangez-le contre autre chose</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.belowMinBtn} onPress={() => router.back()}>
                        <Text style={styles.belowMinBtnText}>Retour à l'article</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Paiement</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView style={styles.content}>
                {/* Item Summary */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Récapitulatif</Text>

                    <View style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemTitle}>{orderPreview.item.title}</Text>
                            <Text style={styles.itemCategory}>{orderPreview.item.category}</Text>
                        </View>
                        <Text style={styles.itemPrice}>{formatPrice(orderPreview.amount_cents)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Sous-total</Text>
                        <Text style={styles.priceValue}>{formatPrice(orderPreview.amount_cents)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Frais de service</Text>
                        <Text style={styles.priceValue}>Inclus</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={[styles.priceRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatPrice(orderPreview.total_cents)}</Text>
                    </View>
                </View>

                {/* Payment Method Selection */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Moyen de paiement</Text>

                    {/* Apple Pay Option */}
                    {Platform.OS === 'ios' && (
                        <TouchableOpacity
                            style={[styles.paymentOption, selectedMethod === 'apple_pay' && styles.paymentOptionSelected]}
                            onPress={() => setSelectedMethod('apple_pay')}
                        >
                            <Ionicons name="logo-apple" size={24} color="#000" />
                            <Text style={styles.paymentText}>Apple Pay</Text>
                            {selectedMethod === 'apple_pay' && (
                                <Ionicons name="checkmark-circle" size={24} color="#4C7B4B" style={styles.checkIcon} />
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Wallet Option */}
                    <TouchableOpacity
                        style={[
                            styles.paymentOption,
                            selectedMethod === 'wallet' && styles.paymentOptionSelected,
                            !canPayWithWallet && styles.paymentOptionDisabled
                        ]}
                        onPress={() => canPayWithWallet && setSelectedMethod('wallet')}
                        disabled={!canPayWithWallet}
                    >
                        <Ionicons name="wallet" size={24} color={canPayWithWallet ? "#4C7B4B" : "#999"} />
                        <View style={styles.walletInfo}>
                            <Text style={[styles.paymentText, !canPayWithWallet && styles.paymentTextDisabled]}>
                                Solde Yondly
                            </Text>
                            <Text style={[styles.walletBalance, !canPayWithWallet && styles.paymentTextDisabled]}>
                                {formatPrice(walletBalance)} disponible
                            </Text>
                        </View>
                        {selectedMethod === 'wallet' && (
                            <Ionicons name="checkmark-circle" size={24} color="#4C7B4B" style={styles.checkIcon} />
                        )}
                    </TouchableOpacity>

                    {/* Card Option */}
                    <TouchableOpacity
                        style={[styles.paymentOption, selectedMethod === 'card' && styles.paymentOptionSelected]}
                        onPress={() => setSelectedMethod('card')}
                    >
                        <Ionicons name="card" size={24} color="#4C7B4B" />
                        <Text style={styles.paymentText}>Carte bancaire via Stripe</Text>
                        {selectedMethod === 'card' && (
                            <Ionicons name="checkmark-circle" size={24} color="#4C7B4B" style={styles.checkIcon} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Security Info */}
                <View style={styles.securityBanner}>
                    <Ionicons name="shield-checkmark" size={24} color="#4C7B4B" />
                    <View style={styles.securityText}>
                        <Text style={styles.securityTitle}>Paiement sécurisé</Text>
                        <Text style={styles.securityDesc}>
                            Vos données sont protégées par Stripe. Le paiement sera bloqué jusqu'à la remise de l'article.
                        </Text>
                    </View>
                </View>

                {/* Escrow Info */}
                <View style={styles.infoBanner}>
                    <Ionicons name="time" size={20} color="#2196f3" />
                    <Text style={styles.infoText}>
                        L'argent est conservé en séquestre jusqu'à confirmation de la remise avec le vendeur.
                    </Text>
                </View>
            </ScrollView>

            {/* Pay Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.payButton, processing && styles.payButtonDisabled]}
                    onPress={handlePayment}
                    disabled={processing}
                >
                    <Text style={styles.payButtonText}>
                        {processing ? 'Traitement...' : `Payer ${formatPrice(orderPreview.total_cents)}`}
                    </Text>
                </TouchableOpacity>
                <Text style={styles.legalText}>
                    En confirmant, vous acceptez les CGV et la politique de remboursement de Yondly.
                </Text>
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
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
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
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    itemCategory: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    itemPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 16,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    priceLabel: {
        fontSize: 14,
        color: '#666',
    },
    priceValue: {
        fontSize: 14,
        color: '#333',
    },
    totalRow: {
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
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
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        marginBottom: 12,
    },
    paymentOptionSelected: {
        borderColor: '#4C7B4B',
        backgroundColor: '#f8fdf8',
    },
    paymentOptionDisabled: {
        opacity: 0.5,
    },
    paymentText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    paymentTextDisabled: {
        color: '#999',
    },
    walletInfo: {
        flex: 1,
        marginLeft: 12,
    },
    walletBalance: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    checkIcon: {
        marginLeft: 'auto',
    },
    securityBanner: {
        flexDirection: 'row',
        backgroundColor: '#e8f5e9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    securityText: {
        flex: 1,
        marginLeft: 12,
    },
    securityTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4C7B4B',
    },
    securityDesc: {
        fontSize: 12,
        color: '#4C7B4B',
        marginTop: 4,
    },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: '#e3f2fd',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#1976d2',
        marginLeft: 8,
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    payButton: {
        backgroundColor: '#4C7B4B',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    payButtonDisabled: {
        backgroundColor: '#ccc',
    },
    payButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    legalText: {
        fontSize: 11,
        color: '#999',
        textAlign: 'center',
        marginTop: 12,
    },

    // Écran seuil minimum
    belowMinContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 16,
    },
    belowMinIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    belowMinTitle: {
        fontSize: 20,
        fontWeight: Typography.bold as any,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    belowMinDesc: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    belowMinAmount: {
        fontWeight: Typography.bold as any,
        color: colors.textPrimary,
    },
    belowMinAlternatives: {
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginTop: 8,
    },
    belowMinRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    belowMinRowText: {
        fontSize: 14,
        color: colors.textSecondary,
        flex: 1,
    },
    belowMinBtn: {
        marginTop: 8,
        paddingHorizontal: 32,
        paddingVertical: 13,
        borderRadius: BorderRadius.full,
        backgroundColor: colors.primary,
    },
    belowMinBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: Typography.semibold as any,
    },
});
