import React, { useState, useEffect } from 'react';
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
import { Calendar, DateData } from 'react-native-calendars';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';

import { API_URL } from '../../src/config/api';

export default function BookingScreen() {
    const router = useRouter();
    const { id: itemId } = useLocalSearchParams();
    const { user, token } = useAuthStore();

    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Date selection
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [markedDates, setMarkedDates] = useState<any>({});

    // Custom offer
    const [wantToOffer, setWantToOffer] = useState(false);
    const [customOfferAmount, setCustomOfferAmount] = useState('');

    useEffect(() => {
        fetchItem();
    }, [itemId]);

    const fetchItem = async () => {
        try {
            const response = await axios.get(`${API_URL}/items/${itemId}`);
            setItem(response.data);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger cet article');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    // Calculate number of days
    const calculateDays = (): number => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const days = calculateDays();
    const pricePerDay = item?.price_per_day_cents || 0;
    const totalPrice = days * pricePerDay;
    const deposit = item?.deposit_cents || 0;
    const grandTotal = totalPrice + deposit;

    // Handle date selection
    const handleDayPress = (day: DateData) => {
        const selectedDate = day.dateString;

        if (!startDate || (startDate && endDate)) {
            // First selection or reset
            setStartDate(selectedDate);
            setEndDate(null);
            setMarkedDates({
                [selectedDate]: {
                    selected: true,
                    startingDay: true,
                    color: '#4C7B4B',
                    textColor: 'white'
                }
            });
        } else {
            // Second selection
            if (new Date(selectedDate) < new Date(startDate)) {
                // Selected date is before start, reset
                setStartDate(selectedDate);
                setEndDate(null);
                setMarkedDates({
                    [selectedDate]: {
                        selected: true,
                        startingDay: true,
                        color: '#4C7B4B',
                        textColor: 'white'
                    }
                });
            } else {
                // Valid end date
                setEndDate(selectedDate);
                updateMarkedDates(startDate, selectedDate);
            }
        }
    };

    const updateMarkedDates = (start: string, end: string) => {
        const dates: any = {};
        const current = new Date(start);
        const endD = new Date(end);

        while (current <= endD) {
            const dateStr = current.toISOString().split('T')[0];
            if (dateStr === start) {
                dates[dateStr] = { startingDay: true, color: '#4C7B4B', textColor: 'white' };
            } else if (dateStr === end) {
                dates[dateStr] = { endingDay: true, color: '#4C7B4B', textColor: 'white' };
            } else {
                dates[dateStr] = { color: '#e8f5e9', textColor: '#333' };
            }
            current.setDate(current.getDate() + 1);
        }
        setMarkedDates(dates);
    };

    const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;

    const handleSubmit = async () => {
        if (!startDate || !endDate) {
            Alert.alert('Erreur', 'Veuillez sélectionner les dates de location');
            return;
        }

        // Check max duration
        if (item?.max_duration_days && days > item.max_duration_days) {
            Alert.alert('Erreur', `La durée maximale est de ${item.max_duration_days} jours`);
            return;
        }

        setSubmitting(true);
        try {
            // Create booking
            const bookingData: any = {
                item_id: itemId,
                start_date: startDate,
                end_date: endDate,
            };

            // Add custom offer if provided
            if (wantToOffer && customOfferAmount) {
                const offerCents = Math.round(parseFloat(customOfferAmount) * 100);
                if (offerCents > 0) {
                    bookingData.proposed_total_cents = offerCents;
                }
            }

            const response = await axios.post(
                `${API_URL}/bookings`,
                bookingData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert(
                'Demande envoyée !',
                wantToOffer
                    ? 'Votre proposition a été envoyée au propriétaire. Il vous répondra bientôt.'
                    : 'Votre demande de réservation a été envoyée. Le propriétaire vous répondra bientôt.',
                [{ text: 'OK', onPress: () => router.push('/profile/orders' as any) }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Impossible d\'envoyer la demande');
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

    if (!item) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Réserver</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView style={styles.content}>
                {/* Item info */}
                <View style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemPrice}>{formatPrice(pricePerDay)} / jour</Text>
                    {item.max_duration_days && (
                        <Text style={styles.itemMeta}>Max {item.max_duration_days} jours</Text>
                    )}
                </View>

                {/* Calendar */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📅 Sélectionnez vos dates</Text>
                    <Calendar
                        markingType="period"
                        markedDates={markedDates}
                        onDayPress={handleDayPress}
                        minDate={new Date().toISOString().split('T')[0]}
                        theme={{
                            todayTextColor: '#4C7B4B',
                            selectedDayBackgroundColor: '#4C7B4B',
                            arrowColor: '#4C7B4B',
                        }}
                    />
                    {startDate && endDate && (
                        <View style={styles.datesSummary}>
                            <Text style={styles.datesText}>
                                Du {startDate} au {endDate} ({days} jour{days > 1 ? 's' : ''})
                            </Text>
                        </View>
                    )}
                </View>

                {/* Price breakdown */}
                {days > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>💰 Récapitulatif</Text>
                        <View style={styles.priceCard}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>{formatPrice(pricePerDay)} × {days} jour{days > 1 ? 's' : ''}</Text>
                                <Text style={styles.priceValue}>{formatPrice(totalPrice)}</Text>
                            </View>
                            {deposit > 0 && (
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Caution (remboursable)</Text>
                                    <Text style={styles.priceValue}>{formatPrice(deposit)}</Text>
                                </View>
                            )}
                            <View style={[styles.priceRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>{formatPrice(grandTotal)}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Make offer option */}
                {days > 0 && item.allow_offers && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.offerToggle}
                            onPress={() => setWantToOffer(!wantToOffer)}
                        >
                            <Ionicons
                                name={wantToOffer ? "checkbox" : "square-outline"}
                                size={24}
                                color="#4C7B4B"
                            />
                            <Text style={styles.offerToggleText}>Proposer un autre prix</Text>
                        </TouchableOpacity>

                        {wantToOffer && (
                            <View style={styles.offerInput}>
                                <Text style={styles.offerHint}>
                                    Prix normal: {formatPrice(totalPrice)} (hors caution)
                                </Text>
                                <View style={styles.inputRow}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Votre proposition (€)"
                                        keyboardType="decimal-pad"
                                        value={customOfferAmount}
                                        onChangeText={setCustomOfferAmount}
                                    />
                                    <Text style={styles.inputSuffix}>€</Text>
                                </View>
                                <Text style={styles.offerNote}>
                                    💡 Le propriétaire peut accepter, refuser ou contre-proposer
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Submit button */}
            <View style={styles.footer}>
                <View style={styles.footerPrice}>
                    <Text style={styles.footerLabel}>Total à payer</Text>
                    <Text style={styles.footerValue}>
                        {wantToOffer && customOfferAmount
                            ? formatPrice(Math.round(parseFloat(customOfferAmount || '0') * 100) + deposit)
                            : formatPrice(grandTotal)
                        }
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.submitButton, (!startDate || !endDate) && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={!startDate || !endDate || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {wantToOffer ? 'Envoyer ma proposition' : 'Demander la réservation'}
                        </Text>
                    )}
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
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    itemCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    itemMeta: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
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
    datesSummary: {
        backgroundColor: '#e8f5e9',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        alignItems: 'center',
    },
    datesText: {
        fontSize: 14,
        color: '#4C7B4B',
        fontWeight: '500',
    },
    priceCard: {
        backgroundColor: '#fff',
        padding: 16,
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
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 12,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    offerToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
    },
    offerToggleText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
    },
    offerInput: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
    },
    offerHint: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 14,
        borderRadius: 8,
        fontSize: 18,
        fontWeight: '600',
    },
    inputSuffix: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    offerNote: {
        fontSize: 12,
        color: '#666',
        marginTop: 12,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        alignItems: 'center',
    },
    footerPrice: {
        flex: 1,
    },
    footerLabel: {
        fontSize: 12,
        color: '#666',
    },
    footerValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    submitButton: {
        backgroundColor: '#4C7B4B',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
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
