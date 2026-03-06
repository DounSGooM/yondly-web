
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { API_URL } from '../../src/config/api';

export default function DisputeScreen() {
    const { order_id } = useLocalSearchParams();
    const router = useRouter();
    const { token } = useAuthStore();

    const [reason, setReason] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const reasons = [
        { id: 'item_not_received', label: "Colis non reçu", icon: "cube-outline" },
        { id: 'item_damaged', label: "Article endommagé", icon: "warning-outline" },
        { id: 'item_not_as_described', label: "Non conforme", icon: "alert-circle-outline" },
        { id: 'seller_unresponsive', label: "Vendeur ne répond pas", icon: "chatbubble-ellipses-outline" },
        { id: 'other', label: "Autre", icon: "help-circle-outline" },
    ];

    const handleSubmit = async () => {
        if (!reason) {
            Alert.alert("Erreur", "Veuillez sélectionner un motif.");
            return;
        }
        if (description.length < 10) {
            Alert.alert("Erreur", "Veuillez décrire le problème en détail.");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/disputes`, {
                order_id,
                reason,
                description,
                evidence_photos: []
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert("Envoyé", "Votre réclamation a été transmise. Le vendeur a été notifié.", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible d'envoyer la réclamation.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Signaler un problème</Text>
            </View>

            <Text style={styles.sectionTitle}>Quelle est la raison ?</Text>
            <View style={styles.reasonsGrid}>
                {reasons.map((r) => (
                    <TouchableOpacity
                        key={r.id}
                        style={[styles.reasonCard, reason === r.id && styles.selectedReason]}
                        onPress={() => setReason(r.id)}
                    >
                        <Ionicons name={r.icon as any} size={24} color={reason === r.id ? "#fff" : "#666"} />
                        <Text style={[styles.reasonText, reason === r.id && styles.selectedReasonText]}>
                            {r.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionTitle}>Description détaillée</Text>
            <TextInput
                style={styles.input}
                multiline
                numberOfLines={6}
                placeholder="Expliquez le problème..."
                value={description}
                onChangeText={setDescription}
            />

            <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Envoyer la réclamation</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center' },
    closeBtn: { marginRight: 15 },
    title: { fontSize: 22, fontWeight: '700' },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginLeft: 20, marginTop: 20, marginBottom: 15 },
    reasonsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15 },
    reasonCard: {
        width: '45%', margin: '2.5%', padding: 15, borderRadius: 12, backgroundColor: '#f5f5f5',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent'
    },
    selectedReason: { backgroundColor: '#FF453A', borderColor: '#FF453A' },
    reasonText: { marginTop: 8, fontSize: 13, textAlign: 'center', color: '#666' },
    selectedReasonText: { color: '#fff', fontWeight: '600' },
    input: {
        margin: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 12, fontSize: 16, height: 120, textAlignVertical: 'top'
    },
    submitButton: { margin: 20, padding: 18, backgroundColor: '#FF453A', borderRadius: 14, alignItems: 'center' },
    disabledButton: { opacity: 0.7 },
    submitText: { color: '#fff', fontSize: 17, fontWeight: '600' }
});
