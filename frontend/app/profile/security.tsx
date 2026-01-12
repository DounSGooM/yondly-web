import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import ScreenHeader from '../../src/components/ScreenHeader';

export default function SecurityScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [twoFactor, setTwoFactor] = useState(user?.two_factor_enabled || false);

    const getTrustBadge = () => {
        switch (user?.trust_level) {
            case 'TRUSTED':
                return { label: 'Utilisateur de Confiance', color: '#4caf50', icon: 'shield-checkmark' };
            case 'BASIC_VERIFIED':
                return { label: 'Vérifié (Basique)', color: '#2196f3', icon: 'shield' };
            case 'RESTRICTED':
                return { label: 'Restreint', color: '#ff9800', icon: 'alert-circle' };
            case 'BANNED':
                return { label: 'Banni', color: '#f44336', icon: 'close-circle' };
            default:
                return { label: 'Nouveau', color: '#9e9e9e', icon: 'leaf-outline' };
        }
    };

    const badge = getTrustBadge();

    const handleToggle2FA = () => {
        // In a real app, this would trigger an API call and likely an SMS verification flow
        if (!twoFactor) {
            Alert.alert(
                "Activer la double authentification",
                "Nous allons vous envoyer un code par SMS pour confirmer l'activation.",
                [
                    { text: "Annuler", style: "cancel" },
                    { text: "Continuer", onPress: () => setTwoFactor(true) }
                ]
            );
        } else {
            setTwoFactor(false);
        }
    };

    const handleDisconnectAll = () => {
        Alert.alert(
            "Déconnexion générale",
            "Voulez-vous vraiment vous déconnecter de tous les appareils ?",
            [
                { text: "Annuler", style: "cancel" },
                { text: "Confirmer", style: "destructive", onPress: () => Alert.alert("Déconnecté", "Toutes les sessions ont été fermées.") }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="Sécurité et Confiance" />

            <ScrollView style={styles.content}>
                {/* Trust Level Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
                            <Ionicons name={badge.icon as any} size={32} color={badge.color} />
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>Votre statut</Text>
                            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                    </View>
                    <Text style={styles.cardDescription}>
                        Votre niveau de confiance évolue en fonction de vos vérifications et de votre historique.
                        Un niveau élevé débloque des fonctionnalités exclusives.
                    </Text>

                    <View style={styles.verificationList}>
                        <View style={styles.verificationItem}>
                            <Ionicons name={user?.verified_email ? "checkmark-circle" : "ellipse-outline"} size={20} color={user?.verified_email ? "#4caf50" : "#ccc"} />
                            <Text style={styles.verificationText}>Email vérifié</Text>
                        </View>
                        <View style={styles.verificationItem}>
                            <Ionicons name={user?.verified_phone ? "checkmark-circle" : "ellipse-outline"} size={20} color={user?.verified_phone ? "#4caf50" : "#ccc"} />
                            <Text style={styles.verificationText}>Téléphone vérifié</Text>
                        </View>
                    </View>
                </View>

                {/* Security Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Paramètres de sécurité</Text>

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={styles.settingLabel}>Double Authentification (2FA)</Text>
                            <Text style={styles.settingSubLabel}>Code SMS requis à la connexion</Text>
                        </View>
                        <Switch
                            value={twoFactor}
                            onValueChange={handleToggle2FA}
                            trackColor={{ false: "#e0e0e0", true: "#a5d6a7" }}
                            thumbColor={twoFactor ? "#4C7B4B" : "#f4f3f4"}
                        />
                    </View>
                </View>

                {/* Active Sessions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Appareils connectés</Text>

                    <View style={styles.sessionItem}>
                        <Ionicons name="phone-portrait-outline" size={24} color="#666" />
                        <View style={styles.sessionInfo}>
                            <Text style={styles.sessionDevice}>iPhone 14 Pro</Text>
                            <Text style={styles.sessionLocation}>Paris, France • Actif maintenant</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnectAll}>
                        <Text style={styles.disconnectText}>Se déconnecter de tous les appareils</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 16,
    },
    badgeIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    badgeText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    cardDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 16,
    },
    verificationList: {
        gap: 8,
    },
    verificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    verificationText: {
        fontSize: 14,
        color: '#333',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        marginLeft: 4,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    settingSubLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 16,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionDevice: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    sessionLocation: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    disconnectButton: {
        alignItems: 'center',
        padding: 16,
    },
    disconnectText: {
        color: '#f44336',
        fontSize: 15,
        fontWeight: '500',
    },
});
