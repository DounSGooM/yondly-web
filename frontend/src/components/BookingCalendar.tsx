import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useStripe } from '../utils/stripe';
import PaymentMethodModal from './PaymentMethodModal';

import { API_URL } from '../config/api';

interface BookingCalendarProps {
    visible: boolean;
    onClose: () => void;
    item_id: string;
    price_per_day_cents: number;
    deposit_cents: number;
    token: string;
    onBookingComplete: () => void;
}

export default function BookingCalendar({
    visible,
    onClose,
    item_id,
    price_per_day_cents,
    deposit_cents,
    token,
    onBookingComplete,
}: BookingCalendarProps) {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [markedDates, setMarkedDates] = useState<any>({});
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingRental, setPendingRental] = useState<any>(null);

    useEffect(() => {
        if (visible) {
            fetchBookings();
        }
    }, [visible]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/items/${item_id}/availability`);
            const bookedRanges = response.data.booked_ranges || [];

            // Mark unavailable dates
            const marked: any = {};
            bookedRanges.forEach((range: any) => {
                const start = new Date(range.start);
                const end = new Date(range.end);

                // Mark all dates in the range
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    marked[dateStr] = {
                        disabled: true,
                        disableTouchEvent: true,
                        color: '#f0f0f0',
                        textColor: '#999',
                    };
                }
            });

            setMarkedDates(marked);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const onDayPress = (day: any) => {
        const dateStr = day.dateString;

        // Check if date is disabled
        if (markedDates[dateStr]?.disabled) {
            return;
        }

        // If no start date, set it
        if (!startDate) {
            setStartDate(dateStr);
            setMarkedDates({
                ...markedDates,
                [dateStr]: { startingDay: true, color: '#4C7B4B', textColor: 'white' },
            });
        }
        // If start date exists but no end date
        else if (!endDate) {
            // Make sure end is after start
            if (new Date(dateStr) <= new Date(startDate)) {
                Alert.alert('Erreur', 'La date de fin doit être après la date de début');
                return;
            }

            // Check if any dates in range are blocked
            const start = new Date(startDate);
            const end = new Date(dateStr);
            let hasConflict = false;

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const checkDateStr = d.toISOString().split('T')[0];
                if (markedDates[checkDateStr]?.disabled) {
                    hasConflict = true;
                    break;
                }
            }

            if (hasConflict) {
                Alert.alert('Erreur', 'Certaines dates dans cette plage sont déjà réservées');
                return;
            }

            setEndDate(dateStr);

            // Mark the range
            const newMarked = { ...markedDates };
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const rangeDate = d.toISOString().split('T')[0];
                newMarked[rangeDate] = {
                    color: '#4C7B4B',
                    textColor: 'white',
                };
            }
            newMarked[startDate] = { startingDay: true, color: '#4C7B4B', textColor: 'white' };
            newMarked[dateStr] = { endingDay: true, color: '#4C7B4B', textColor: 'white' };
            setMarkedDates(newMarked);
        }
        // If both dates are set, reset
        else {
            fetchBookings(); // Reset marked dates
            setStartDate(dateStr);
            setEndDate(null);
            setMarkedDates({
                ...markedDates,
                [dateStr]: { startingDay: true, color: '#4C7B4B', textColor: 'white' },
            });
        }
    };

    // Step 1: Create rental and redirect to payment screen
    const handleSubmit = async () => {
        console.log('Submit pressed', { startDate, endDate, submitting });

        if (!startDate || !endDate) {
            Alert.alert('Attention', `Veuillez sélectionner une plage de dates complète.\n\nDébut: ${startDate || 'Non défini'}\nFin: ${endDate || 'Non défini'}`);
            return;
        }

        try {
            setSubmitting(true);

            // Create the rental (returns client_secret)
            const response = await axios.post(
                `${API_URL}/rentals`,
                {
                    item_id,
                    start_date: new Date(startDate).toISOString(),
                    end_date: new Date(endDate).toISOString(),
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const rentalId = response.data.id;

            // Close modal and redirect to payment screen
            onClose();

            // Use dynamic import to get router
            const { router } = require('expo-router');
            router.push(`/rental/payment?rentalId=${rentalId}`);

        } catch (error: any) {
            console.error('Booking error:', error);
            Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors de la réservation');
        } finally {
            setSubmitting(false);
        }
    };

    // Step 2: Handle payment based on selected method
    const handlePaymentMethod = async (method: 'apple_pay' | 'google_pay' | 'wallet' | 'card') => {
        if (!pendingRental) return;

        setShowPaymentModal(false);
        setSubmitting(true);

        const { client_secret, id: rentalId, total_price_cents } = pendingRental;

        try {
            if (method === 'wallet') {
                // Pay with Yondly Wallet
                await axios.post(
                    `${API_URL}/rentals/${rentalId}/pay-with-wallet`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                Alert.alert(
                    'Paiement confirmé! ✅',
                    `Payé avec votre solde Yondly.\nTotal: ${(total_price_cents / 100).toFixed(2)}€`,
                    [{ text: 'Super!', onPress: () => onBookingComplete() }]
                );
                onClose();

            } else if (method === 'apple_pay' || method === 'google_pay') {
                // Use Stripe PaymentSheet with Apple/Google Pay
                if (client_secret && !client_secret.startsWith('pi_demo_')) {
                    const { error: initError } = await initPaymentSheet({
                        paymentIntentClientSecret: client_secret,
                        merchantDisplayName: 'Yondly',
                        applePay: { merchantCountryCode: 'FR' },
                        googlePay: { merchantCountryCode: 'FR', testEnv: __DEV__ },
                        style: 'automatic',
                    });

                    if (initError) {
                        throw new Error('Impossible d\'initialiser le paiement');
                    }

                    const { error: paymentError } = await presentPaymentSheet();

                    if (paymentError) {
                        if (paymentError.code !== 'Canceled') {
                            Alert.alert('Erreur de paiement', paymentError.message);
                        }
                        return;
                    }

                    // Confirm with backend
                    await axios.post(
                        `${API_URL}/rentals/${rentalId}/confirm-payment`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    Alert.alert(
                        'Paiement confirmé! ✅',
                        `Votre location a été confirmée.\nTotal: ${(total_price_cents / 100).toFixed(2)}€`,
                        [{ text: 'Super!', onPress: () => onBookingComplete() }]
                    );
                    onClose();
                }

            } else if (method === 'card') {
                // Standard card payment via Stripe
                if (client_secret && !client_secret.startsWith('pi_demo_')) {
                    const { error: initError } = await initPaymentSheet({
                        paymentIntentClientSecret: client_secret,
                        merchantDisplayName: 'Yondly',
                        style: 'automatic',
                    });

                    if (initError) {
                        throw new Error('Impossible d\'initialiser le paiement');
                    }

                    const { error: paymentError } = await presentPaymentSheet();

                    if (paymentError) {
                        if (paymentError.code !== 'Canceled') {
                            Alert.alert('Erreur de paiement', paymentError.message);
                        }
                        return;
                    }

                    // Confirm with backend
                    await axios.post(
                        `${API_URL}/rentals/${rentalId}/confirm-payment`,
                        {},
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    Alert.alert(
                        'Paiement confirmé! ✅',
                        `Votre location a été confirmée.\nTotal: ${(total_price_cents / 100).toFixed(2)}€`,
                        [{ text: 'Super!', onPress: () => onBookingComplete() }]
                    );
                    onClose();
                } else {
                    // Demo mode
                    Alert.alert(
                        'Réservation créée! 🎉',
                        `Total: ${(total_price_cents / 100).toFixed(2)}€\n\n(Mode démo - paiement simulé)`,
                        [{ text: 'OK', onPress: () => onBookingComplete() }]
                    );
                    onClose();
                }
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            Alert.alert('Erreur', error.response?.data?.detail || error.message || 'Erreur lors du paiement');
        } finally {
            setSubmitting(false);
        }
    };

    const calculatePrice = () => {
        if (!startDate || !endDate) return { days: 0, total: 0 };

        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const total = days * (price_per_day_cents / 100);

        return { days, total };
    };

    const { days, total } = calculatePrice();

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Sélectionner les dates</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#4C7B4B" style={{ marginVertical: 40 }} />
                    ) : (
                        <ScrollView>
                            <Calendar
                                onDayPress={onDayPress}
                                markedDates={markedDates}
                                markingType="period"
                                minDate={new Date().toISOString().split('T')[0]}
                                theme={{
                                    selectedDayBackgroundColor: '#4C7B4B',
                                    todayTextColor: '#4C7B4B',
                                    arrowColor: '#4C7B4B',
                                }}
                            />

                            <View style={styles.legend}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendBox, { backgroundColor: '#4C7B4B' }]} />
                                    <Text style={styles.legendText}>Sélectionné</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendBox, { backgroundColor: '#f0f0f0' }]} />
                                    <Text style={styles.legendText}>Réservé</Text>
                                </View>
                            </View>

                            {startDate && endDate && (
                                <View style={styles.priceCard}>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceLabel}>
                                            {price_per_day_cents / 100}€/jour × {days} jour{days > 1 ? 's' : ''}
                                        </Text>
                                        <Text style={styles.priceValue}>{total.toFixed(2)}€</Text>
                                    </View>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceLabel}>Caution</Text>
                                        <Text style={styles.priceValue}>{(deposit_cents / 100).toFixed(2)}€</Text>
                                    </View>
                                    <View style={[styles.priceRow, styles.totalRow]}>
                                        <Text style={styles.totalLabel}>Total</Text>
                                        <Text style={styles.totalValue}>{total.toFixed(2)}€</Text>
                                    </View>
                                    <Text style={styles.noteText}>
                                        💡 La caution n'est pas débitée, elle sert juste de garantie.
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmit}
                            >
                                <Text style={styles.submitButtonText}>
                                    {submitting ? 'Envoi...' : 'Envoyer la demande'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </View>

            {/* Payment Method Selection Modal */}
            <PaymentMethodModal
                visible={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                totalAmountCents={Math.round(total * 100)}
                onSelectMethod={handlePaymentMethod}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 16,
        paddingHorizontal: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendBox: {
        width: 20,
        height: 20,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 14,
        color: '#666',
    },
    priceCard: {
        margin: 20,
        padding: 16,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
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
        fontWeight: '500',
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    noteText: {
        fontSize: 12,
        color: '#666',
        marginTop: 12,
        fontStyle: 'italic',
    },
    submitButton: {
        backgroundColor: '#4C7B4B',
        margin: 20,
        marginTop: 0,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
