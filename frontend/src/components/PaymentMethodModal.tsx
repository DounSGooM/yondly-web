import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';

interface PaymentMethodModalProps {
    visible: boolean;
    onClose: () => void;
    totalAmountCents: number;
    onSelectMethod: (method: 'apple_pay' | 'google_pay' | 'wallet' | 'card') => void;
}

export default function PaymentMethodModal({
    visible,
    onClose,
    totalAmountCents,
    onSelectMethod,
}: PaymentMethodModalProps) {
    const { token, user } = useAuthStore();
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible) {
            fetchWalletBalance();
        }
    }, [visible]);

    const fetchWalletBalance = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/wallet/balance`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setWalletBalance(response.data.balance_cents || 0);
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            setWalletBalance(0);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;
    const canPayWithWallet = walletBalance >= totalAmountCents;
    const isAppleDevice = Platform.OS === 'ios';

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Choisir un moyen de paiement</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.totalText}>
                        Total à payer: <Text style={styles.totalAmount}>{formatPrice(totalAmountCents)}</Text>
                    </Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#4C7B4B" style={{ marginVertical: 40 }} />
                    ) : (
                        <View style={styles.options}>
                            {/* Apple Pay / Google Pay */}
                            <TouchableOpacity
                                style={styles.optionCard}
                                onPress={() => onSelectMethod(isAppleDevice ? 'apple_pay' : 'google_pay')}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: '#000' }]}>
                                    <Ionicons
                                        name={isAppleDevice ? "logo-apple" : "logo-google"}
                                        size={24}
                                        color="#fff"
                                    />
                                </View>
                                <View style={styles.optionText}>
                                    <Text style={styles.optionTitle}>
                                        {isAppleDevice ? 'Apple Pay' : 'Google Pay'}
                                    </Text>
                                    <Text style={styles.optionSubtitle}>Paiement rapide et sécurisé</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#ccc" />
                            </TouchableOpacity>

                            {/* Yondly Wallet */}
                            <TouchableOpacity
                                style={[styles.optionCard, !canPayWithWallet && styles.optionDisabled]}
                                onPress={() => canPayWithWallet && onSelectMethod('wallet')}
                                disabled={!canPayWithWallet}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: '#4C7B4B' }]}>
                                    <Ionicons name="wallet" size={24} color="#fff" />
                                </View>
                                <View style={styles.optionText}>
                                    <Text style={[styles.optionTitle, !canPayWithWallet && styles.textDisabled]}>
                                        Solde Yondly
                                    </Text>
                                    <Text style={[styles.optionSubtitle, !canPayWithWallet && styles.textDisabled]}>
                                        Disponible: {formatPrice(walletBalance)}
                                    </Text>
                                    {!canPayWithWallet && (
                                        <Text style={styles.insufficientText}>
                                            Solde insuffisant
                                        </Text>
                                    )}
                                </View>
                                {canPayWithWallet ? (
                                    <Ionicons name="chevron-forward" size={24} color="#ccc" />
                                ) : (
                                    <Ionicons name="lock-closed" size={20} color="#ccc" />
                                )}
                            </TouchableOpacity>

                            {/* Card Payment */}
                            <TouchableOpacity
                                style={styles.optionCard}
                                onPress={() => onSelectMethod('card')}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: '#635BFF' }]}>
                                    <Ionicons name="card" size={24} color="#fff" />
                                </View>
                                <View style={styles.optionText}>
                                    <Text style={styles.optionTitle}>Carte bancaire</Text>
                                    <Text style={styles.optionSubtitle}>Visa, Mastercard, etc.</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#ccc" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.securityNote}>
                        <Ionicons name="shield-checkmark" size={16} color="#4C7B4B" />
                        <Text style={styles.securityText}>Paiement 100% sécurisé</Text>
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
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    totalText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    options: {
        gap: 12,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionDisabled: {
        opacity: 0.6,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    optionSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    textDisabled: {
        color: '#999',
    },
    insufficientText: {
        fontSize: 11,
        color: '#d32f2f',
        marginTop: 2,
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        gap: 6,
    },
    securityText: {
        fontSize: 13,
        color: '#4C7B4B',
    },
});
