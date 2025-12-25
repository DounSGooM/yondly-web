import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../../src/store/authStore';
import { API_URL } from '../../src/config/api';

export default function PayoutsScreen() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<any>(null);
    const [setupLoading, setSetupLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await axios.get(`${API_URL}/payments/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus(res.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Impossible de récupérer le statut');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleSetup = async () => {
        setSetupLoading(true);
        try {
            const res = await axios.post(`${API_URL}/payments/onboard`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.url) {
                // Open Stripe Onboarding Flow
                const result = await WebBrowser.openBrowserAsync(res.data.url);
                // Refresh status after browser closes manually (or we could use deep linking but simple refresh works for MVP)
                fetchStatus();
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de démarrer la configuration');
        } finally {
            setSetupLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4C7B4B" />
            </View>
        );
    }

    const isReady = status?.charges_enabled && status?.payouts_enabled;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Mes Virements</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <Ionicons name={isReady ? "checkmark-circle" : "card"} size={48} color={isReady ? "#4caf50" : "#E65100"} />
                </View>

                <Text style={styles.statusTitle}>
                    {isReady ? "Compte actif" : "Configuration requise"}
                </Text>

                <Text style={styles.statusDesc}>
                    {isReady
                        ? "Votre compte est configuré pour recevoir les paiements automatiquement."
                        : "Pour recevoir l'argent de vos ventes, vous devez configurer votre compte de paiement sécurisé avec notre partenaire Stripe."}
                </Text>

                {!isReady && (
                    <TouchableOpacity
                        style={styles.setupBtn}
                        onPress={handleSetup}
                        disabled={setupLoading}
                    >
                        {setupLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.setupBtnText}>Configurer maintenant</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {isReady && (
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color="#666" />
                        <Text style={styles.infoText}>Les virements sont effectués automatiquement vers votre compte bancaire enregistré tous les lundis.</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff' },
    backBtn: { padding: 8, marginRight: 8 },
    title: { fontSize: 20, fontWeight: 'bold' },
    card: { margin: 20, padding: 30, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    iconContainer: { marginBottom: 20, padding: 20, backgroundColor: '#f0f9ff', borderRadius: 50 },
    statusTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    statusDesc: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 24 },
    setupBtn: { backgroundColor: '#E65100', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' },
    setupBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    infoBox: { flexDirection: 'row', backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginTop: 10, gap: 10 },
    infoText: { flex: 1, color: '#666', fontSize: 14 }
});
