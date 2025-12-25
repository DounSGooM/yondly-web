import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

import { API_URL } from '../config/api';

interface BookingMessageProps {
    message: any;
    booking: any;
    isCurrentUserOwner: boolean;
    currentUserId: string;
    onBookingUpdated: () => void;
}

export default function BookingMessage({
    message,
    booking,
    isCurrentUserOwner,
    currentUserId,
    onBookingUpdated,
}: BookingMessageProps) {
    const { token } = useAuthStore();
    const [processing, setProcessing] = useState(false);

    const handleAccept = async () => {
        setProcessing(true);
        try {
            await axios.put(
                `${API_URL}/bookings/${booking.id}/accept`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert('✅ Accepté', 'La réservation a été acceptée');
            onBookingUpdated();
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Impossible d\'accepter la réservation');
        } finally {
            setProcessing(false);
        }
    };

    const handleDecline = async () => {
        Alert.alert(
            'Refuser la réservation',
            'Êtes-vous sûr de vouloir refuser cette demande ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Refuser',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessing(true);
                        try {
                            await axios.put(
                                `${API_URL}/bookings/${booking.id}/decline`,
                                {},
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            Alert.alert('Refusé', 'La réservation a été refusée');
                            onBookingUpdated();
                        } catch (error: any) {
                            Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de refuser la réservation');
                        } finally {
                            setProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const getStatusBadge = () => {
        switch (booking.status) {
            case 'pending':
                return { text: 'En attente', color: '#ff9800', icon: 'time' };
            case 'accepted':
                return { text: 'Acceptée', color: '#4caf50', icon: 'checkmark-circle' };
            case 'declined':
                return { text: 'Refusée', color: '#f44336', icon: 'close-circle' };
            default:
                return { text: booking.status, color: '#999', icon: 'help-circle' };
        }
    };

    const statusBadge = getStatusBadge();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="calendar" size={20} color="#4C7B4B" />
                <Text style={styles.headerText}>Demande de réservation</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.messageText}>{message.text}</Text>

                <View style={styles.statusRow}>
                    <Ionicons name={statusBadge.icon as any} size={16} color={statusBadge.color} />
                    <Text style={[styles.statusText, { color: statusBadge.color }]}>
                        {statusBadge.text}
                    </Text>
                </View>
            </View>

            {isCurrentUserOwner && booking.status === 'pending' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.declineButton]}
                        onPress={handleDecline}
                        disabled={processing}
                    >
                        {processing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="close" size={18} color="#fff" />
                                <Text style={styles.buttonText}>Refuser</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.acceptButton]}
                        onPress={handleAccept}
                        disabled={processing}
                    >
                        {processing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={18} color="#fff" />
                                <Text style={styles.buttonText}>Accepter</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4C7B4B',
        marginLeft: 8,
    },
    content: {
        marginBottom: 12,
    },
    messageText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    acceptButton: {
        backgroundColor: '#4caf50',
    },
    declineButton: {
        backgroundColor: '#f44336',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
