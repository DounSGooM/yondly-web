import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../../src/config/api';

export default function OrderSuccessScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const { refreshUser } = useAuthStore();

    useEffect(() => {
        fetchOrder();
        refreshUser(); // Updates points immediately
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const auth_token = await AsyncStorage.getItem('auth_token');
            // We might need a generic getOrder endpoint that works for deals too
            // or we just trust the passed params, but better to fetch fresh data
            // Using existing /api/orders/{id} if it exists properly
            // ...Wait, existing get_order checks item ownership. For deal orders, it might fail if logic is strict.
            // Let's try mocking the display if fetch fails or assuming /api/orders/{id} works broadly.
            // The current backend get_order checks renter_id/owner_id. We set buyer_id/seller_id.
            // Wait, backend uses 'renter_id' for bookings, 'buyer_id' for orders. 
            // Let's check get_order logic? No, there isn't a generic get_order in the previous view.
            // Ah, create_deal_order creates an order in 'orders' collection.
            // I need to ensure there is an endpoint to GET this order.
            // Checking server.py earlier... there IS a get_current_user dependent something?
            // I'll assume I can pass the data via navigation params for speed/robustness now, OR fetch simple details.

            // OPTION: Fetching from a new endpoint or using the returned data from creation.
            // Safer: Just pass the code and details via params? No, QR code data should be secure.
            // Let's implement a quick fetch.

            const config = { headers: { Authorization: `Bearer ${auth_token}` } };
            // I'll try to implement a specific endpoint for order details or just assume I have the order object from the previous screen?
            // Actually, standard practice: fetch by ID.
            // I will implement a quick GET /api/orders/{id} general one if missing.
            // Checking server.py... I saw create_order and notification routes.
            // I'll assume I need to implement GET /api/orders/{id} as well if it's not there.
            // WAIT, I saw line 565: @api_router.get("/orders/{order_id}") in grep search!
            const response = await axios.get(`${API_URL}/orders/${orderId}`, config);
            setOrder(response.data);
        } catch (error: any) {
            console.error('Error fetching order:', error);
            Alert.alert("Erreur", error.message || "Impossible de récupérer la commande");
            // Fallback: if fetch fails (e.g. strict permissions), show error?
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4C7B4B" />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.container}>
                <Text>Commande introuvable</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.successHeader}>
                <Ionicons name="checkmark-circle" size={80} color="#4C7B4B" />
                <Text style={styles.successTitle}>Réservation Confirmée !</Text>
                <Text style={styles.successSubtitle}>Merci pour votre geste anti-gaspi.</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>À présenter au commerçant</Text>

                <View style={styles.qrContainer}>
                    {order.handoff?.code && (
                        <QRCode
                            value={order.handoff.code}
                            size={200}
                            color="black"
                            backgroundColor="white"
                        />
                    )}
                </View>
                <Text style={styles.codeText}>{order.handoff?.code}</Text>

                <View style={styles.divider} />

                <Text style={styles.instruction}>
                    Ce code permet de valider le retrait de votre panier.
                </Text>
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace('/profile/orders')}
            >
                <Text style={styles.buttonText}>Voir mes commandes</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f5f5f5',
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4C7B4B',
        marginTop: 16,
    },
    successSubtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 32,
        width: '100%',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 24,
    },
    qrContainer: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#fff',
    },
    codeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        letterSpacing: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        width: '100%',
        marginVertical: 24,
    },
    instruction: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#4C7B4B',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 32,
        marginTop: 32,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
