import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

interface Rental {
    id: string;
    item_id: string;
    renter_id: string;
    owner_id: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    price_per_day_cents: number;
    total_price_cents: number;
    deposit_cents: number;
    status: 'pending' | 'confirmed' | 'active' | 'returned' | 'completed' | 'cancelled' | 'dispute';
    payment_status: string;
    pickup_code?: string;
    return_code?: string;
    item?: any;
}

export default function RentalDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { user, token } = useAuthStore();
    const [rental, setRental] = useState<Rental | null>(null);
    const [loading, setLoading] = useState(true);
    const [codeInput, setCodeInput] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (id) {
            fetchRental();
        }
    }, [id]);

    const fetchRental = async () => {
        try {
            const response = await axios.get(`${API_URL}/rentals/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRental(response.data);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger cette location');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPickup = async () => {
        if (!codeInput.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer le code');
            return;
        }

        setProcessing(true);
        try {
            const response = await axios.post(
                `${API_URL}/rentals/${id}/pickup?code=${codeInput.toUpperCase()}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Navigate to success screen
            router.replace({
                pathname: '/transaction-success',
                params: {
                    orderId: rental?.id || '',
                    type: 'rental',
                    itemTitle: rental?.item?.title || 'Location',
                    amount: (rental?.total_price_cents || 0).toString(),
                    co2_kg: response.data?.co2_kg?.toString() || '3',
                    successTitle: 'Location démarrée !',
                    successMessage: 'Bonne utilisation ! Vous devrez scanner un second code au retour.',
                    nextPath: `../rental/detail?id=${rental?.id}`
                }
            });
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Code invalide');
        } finally {
            setProcessing(false);
        }
    };

    const handleConfirmReturn = async () => {
        if (!codeInput.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer le code de retour');
            return;
        }

        Alert.alert(
            'Confirmer le retour',
            "L'article est-il en bon état?",
            [
                {
                    text: 'Problème détecté',
                    style: 'destructive',
                    onPress: () => processReturn(false),
                },
                {
                    text: 'Tout est OK',
                    onPress: () => processReturn(true),
                },
            ]
        );
    };

    const processReturn = async (conditionOk: boolean) => {
        setProcessing(true);
        try {
            const response = await axios.post(
                `${API_URL}/rentals/${id}/return?code=${codeInput.toUpperCase()}&condition_ok=${conditionOk}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Navigate to success screen
            router.replace({
                pathname: '/transaction-success',
                params: {
                    orderId: rental?.id || '',
                    type: 'rental',
                    itemTitle: rental?.item?.title || 'Location terminée',
                    amount: (rental?.deposit_cents || 0).toString(), // Show deposit returned
                    co2_kg: response.data?.co2_kg?.toString() || '5',
                    successTitle: 'Location terminée !',
                    successMessage: 'Merci pour votre confiance. La caution a été débloquée.',
                    nextPath: '/(tabs)/profile'
                }
            });
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors du retour');
        } finally {
            setProcessing(false);
        }
    };

    const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;
    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), 'dd MMMM yyyy', { locale: fr });
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending':
                return { label: 'En attente de paiement', color: '#ff9800', icon: 'time' };
            case 'confirmed':
                return { label: 'Confirmé - Attente remise', color: '#2196f3', icon: 'checkmark-circle' };
            case 'active':
                return { label: 'Location en cours', color: '#4caf50', icon: 'key' };
            case 'returned':
                return { label: 'Terminé', color: '#9e9e9e', icon: 'checkmark-done-circle' };
            case 'cancelled':
                return { label: 'Annulé', color: '#f44336', icon: 'close-circle' };
            default:
                return { label: status, color: '#666', icon: 'help-circle' };
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4C7B4B" />
            </View>
        );
    }

    if (!rental) return null;

    const isRenter = user?.id === rental.renter_id;
    const isOwner = user?.id === rental.owner_id;
    const statusInfo = getStatusInfo(rental.status);

    return (
        <View style={styles.container}>
            <ScreenHeader title="Location" />

            <ScrollView style={styles.content}>
                {/* Status Card */}
                <View style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}>
                    <Ionicons name={statusInfo.icon as any} size={32} color={statusInfo.color} />
                    <View style={styles.statusInfo}>
                        <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
                            {statusInfo.label}
                        </Text>
                        <Text style={styles.statusDates}>
                            Du {formatDate(rental.start_date)} au {formatDate(rental.end_date)}
                        </Text>
                    </View>
                </View>

                {/* Dispute Button */}
                {rental.status !== 'cancelled' && rental.status !== 'dispute' && (
                    <TouchableOpacity
                        style={{ alignSelf: 'center', marginBottom: 16 }}
                        onPress={() => router.push(`/order/dispute?rentalId=${rental.id}` as any)}
                    >
                        <Text style={{ color: '#d32f2f', textDecorationLine: 'underline', fontSize: 13 }}>
                            Signaler un problème avec cette location
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Item Info */}
                {rental.item && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Article loué</Text>
                        <View style={styles.itemCard}>
                            <Text style={styles.itemTitle}>{rental.item.title}</Text>
                            <Text style={styles.itemCategory}>{rental.item.category}</Text>
                        </View>
                    </View>
                )}

                {/* Price Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Détails du paiement</Text>
                    <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>
                                {formatPrice(rental.price_per_day_cents)}/jour × {rental.duration_days} jour{rental.duration_days > 1 ? 's' : ''}
                            </Text>
                            <Text style={styles.priceValue}>{formatPrice(rental.total_price_cents)}</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Caution (remboursable)</Text>
                            <Text style={styles.priceValue}>{formatPrice(rental.deposit_cents)}</Text>
                        </View>
                        <View style={[styles.priceRow, styles.priceRowTotal]}>
                            <Text style={styles.priceLabelTotal}>Total payé</Text>
                            <Text style={styles.priceValueTotal}>
                                {formatPrice(rental.total_price_cents + rental.deposit_cents)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Pickup Code - For Renter when confirmed */}
                {isRenter && rental.status === 'confirmed' && rental.pickup_code && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Code de retrait</Text>
                        <View style={styles.qrCard}>
                            <QRCode value={rental.pickup_code} size={180} />
                            <Text style={styles.qrCode}>{rental.pickup_code}</Text>
                            <Text style={styles.qrHint}>
                                Présentez ce code au propriétaire lors du retrait
                            </Text>
                        </View>
                    </View>
                )}

                {/* Return Code - For Renter when active */}
                {isRenter && rental.status === 'active' && rental.return_code && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Code de retour</Text>
                        <View style={styles.qrCard}>
                            <QRCode value={rental.return_code} size={180} />
                            <Text style={styles.qrCode}>{rental.return_code}</Text>
                            <Text style={styles.qrHint}>
                                Présentez ce code au propriétaire lors du retour
                            </Text>
                        </View>
                    </View>
                )}

                {/* Owner Actions - Confirm Pickup */}
                {isOwner && rental.status === 'confirmed' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Confirmer le retrait</Text>
                        <View style={styles.actionCard}>
                            <Text style={styles.actionHint}>
                                Scannez le QR code du locataire ou entrez le code manuellement
                            </Text>

                            {/* Scanner Button */}
                            <TouchableOpacity
                                style={styles.scannerButton}
                                onPress={() => router.push({
                                    pathname: '/scan-handoff',
                                    params: {
                                        orderId: rental.id,
                                        code: rental.pickup_code,
                                        type: 'rental_pickup',
                                        itemTitle: rental.item?.title || 'Location'
                                    }
                                } as any)}
                            >
                                <Ionicons name="scan" size={24} color="#fff" />
                                <Text style={styles.scannerButtonText}>Scanner le QR code</Text>
                            </TouchableOpacity>

                            {/* Separator */}
                            <View style={styles.orSeparator}>
                                <View style={styles.orLine} />
                                <Text style={styles.orText}>OU</Text>
                                <View style={styles.orLine} />
                            </View>

                            <TextInput
                                style={styles.codeInput}
                                placeholder="XXXXXX"
                                value={codeInput}
                                onChangeText={(text) => setCodeInput(text.toUpperCase())}
                                maxLength={6}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                style={[styles.confirmButton, processing && styles.buttonDisabled]}
                                onPress={handleConfirmPickup}
                                disabled={processing}
                            >
                                <Text style={styles.confirmButtonText}>
                                    {processing ? 'Confirmation...' : 'Confirmer manuellement'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Owner Actions - Confirm Return */}
                {isOwner && rental.status === 'active' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Confirmer le retour</Text>
                        <View style={styles.actionCard}>
                            <Text style={styles.actionHint}>
                                Scannez le QR code du locataire ou entrez le code manuellement
                            </Text>

                            {/* Scanner Button */}
                            <TouchableOpacity
                                style={styles.scannerButton}
                                onPress={() => router.push({
                                    pathname: '/scan-handoff',
                                    params: {
                                        orderId: rental.id,
                                        code: rental.return_code,
                                        type: 'rental_return',
                                        itemTitle: rental.item?.title || 'Location'
                                    }
                                } as any)}
                            >
                                <Ionicons name="scan" size={24} color="#fff" />
                                <Text style={styles.scannerButtonText}>Scanner le QR code</Text>
                            </TouchableOpacity>

                            {/* Separator */}
                            <View style={styles.orSeparator}>
                                <View style={styles.orLine} />
                                <Text style={styles.orText}>OU</Text>
                                <View style={styles.orLine} />
                            </View>

                            <TextInput
                                style={styles.codeInput}
                                placeholder="XXXXXX"
                                value={codeInput}
                                onChangeText={(text) => setCodeInput(text.toUpperCase())}
                                maxLength={6}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                style={[styles.confirmButton, processing && styles.buttonDisabled]}
                                onPress={handleConfirmReturn}
                                disabled={processing}
                            >
                                <Text style={styles.confirmButtonText}>
                                    {processing ? 'Confirmation...' : 'Confirmer manuellement'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Completed */}
                {rental.status === 'returned' && (
                    <View style={styles.section}>
                        <View style={styles.successCard}>
                            <Ionicons name="checkmark-done-circle" size={48} color="#4caf50" />
                            <Text style={styles.successTitle}>Location terminée!</Text>
                            <Text style={styles.successText}>
                                {rental.payment_status === 'deposit_returned'
                                    ? 'La caution a été remboursée'
                                    : 'Merci d\'avoir utilisé Yondly'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Inspection Buttons (Etat des lieux) */}
                {rental.status === 'confirmed' && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.inspectionButton}
                            onPress={() => router.push({
                                pathname: '/rental/inspection',
                                params: { bookingId: rental.id, type: 'in' }
                            } as any)}
                        >
                            <Ionicons name="clipboard-outline" size={24} color="#fff" />
                            <Text style={styles.inspectionButtonText}>Remplir l'état des lieux d'entrée</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {rental.status === 'active' && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[styles.inspectionButton, { backgroundColor: '#FF9800' }]}
                            onPress={() => router.push({
                                pathname: '/rental/inspection',
                                params: { bookingId: rental.id, type: 'out' }
                            } as any)}
                        >
                            <Ionicons name="clipboard-outline" size={24} color="#fff" />
                            <Text style={styles.inspectionButtonText}>Remplir l'état des lieux de sortie</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Dispute Button */}
                {(rental.status === 'active' || rental.status === 'completed') && (
                    <TouchableOpacity
                        style={styles.disputeButton}
                        onPress={() => router.push({ pathname: '/order/dispute', params: { rentalId: rental.id } } as any)}
                    >
                        <Ionicons name="flag-outline" size={20} color="#ff4444" />
                        <Text style={styles.disputeButtonText}>Signaler un problème / Litige</Text>
                    </TouchableOpacity>
                )}
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
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
    },
    statusInfo: {
        marginLeft: 12,
        flex: 1,
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    statusDates: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    itemCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    itemCategory: {
        fontSize: 14,
        color: '#666',
    },
    priceCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
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
        color: '#666',
    },
    priceRowTotal: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    priceLabelTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    priceValueTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    qrCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
    },
    qrCode: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4C7B4B',
        marginTop: 16,
        letterSpacing: 4,
    },
    qrHint: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    actionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    actionHint: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
    },
    codeInput: {
        width: '100%',
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#4C7B4B',
        borderRadius: 12,
        padding: 16,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 8,
        marginBottom: 16,
    },
    confirmButton: {
        width: '100%',
        backgroundColor: '#4C7B4B',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    inspectionButton: {
        flexDirection: 'row',
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    inspectionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disputeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ff4444',
        borderRadius: 12,
        gap: 8,
        marginTop: 16,
        marginBottom: 32,
    },
    disputeButtonText: {
        color: '#ff4444',
        fontSize: 16,
        fontWeight: '600',
    },
    successCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4caf50',
        marginTop: 16,
    },
    successText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    scannerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4C7B4B',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 12,
        gap: 8,
    },
    scannerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    orSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    orText: {
        paddingHorizontal: 16,
        fontSize: 14,
        color: '#999',
        fontWeight: '500',
    },
});
