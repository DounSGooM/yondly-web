import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

export default function PartnerScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const isPartner = user?.is_partner || false;

    const handleLogout = async () => {
        Alert.alert(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Se déconnecter',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login-pro');
                    }
                }
            ]
        );
    };

    const handleBecomePartner = () => {
        Alert.alert(
            "Devenir Partenaire",
            "Votre demande a bien été reçue ! Notre équipe vous contactera sous 24h pour valider votre commerce.",
            [{ text: "OK", onPress: () => router.back() }]
        );
    };

    if (isPartner) {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { marginLeft: 16 }]}>Espace Partenaire</Text>
                    <TouchableOpacity onPress={handleLogout} style={{ padding: 8, marginRight: 8 }}>
                        <Ionicons name="log-out-outline" size={24} color="#d32f2f" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Tableau de bord</Text>

                <View style={styles.dashboardCard}>
                    <Text style={styles.welcomeText}>Bonjour, {user?.display_name} ! 👋</Text>
                    <Text style={styles.roleText}>Partenaire Certifié</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>12</Text>
                            <Text style={styles.statLabel}>Ventes du mois</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>€450</Text>
                            <Text style={styles.statLabel}>Chiffre d'affaires</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>4.8</Text>
                            <Text style={styles.statLabel}>Note</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={styles.mainActionButton}
                        onPress={() => router.push('/profile/post-pro' as any)}
                    >
                        <View style={[styles.actionIconContainer, { backgroundColor: '#fff' }]}>
                            <Ionicons name="add" size={32} color="#4C7B4B" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionButtonTitle}>Publier un panier Anti-Gaspi</Text>
                            <Text style={styles.actionButtonDesc}>Mettez en vente vos invendus du jour</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.secondaryActions}>
                        <TouchableOpacity style={styles.secondaryButton}>
                            <Ionicons name="list" size={24} color="#4C7B4B" />
                            <Text style={styles.secondaryButtonText}>Mes Annonces</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton}>
                            <Ionicons name="qr-code" size={24} color="#4C7B4B" />
                            <Text style={styles.secondaryButtonText}>Scanner</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => router.push('/profile/store-settings' as any)}
                        >
                            <Ionicons name="settings-outline" size={24} color="#4C7B4B" />
                            <Text style={styles.secondaryButtonText}>Profil Magasin</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Devenir Partenaire</Text>
            </View>

            <View style={styles.heroSection}>
                <Ionicons name="storefront-outline" size={80} color="#4C7B4B" />
                <Text style={styles.heroTitle}>Boostez votre commerce avec Yondly</Text>
                <Text style={styles.heroSubtitle}>
                    Rejoignez notre réseau de commerçants engagés et donnez une seconde vie à vos invendus.
                </Text>
            </View>

            <View style={styles.benefitSection}>
                <BenefitItem
                    icon="leaf-outline"
                    title="Réduisez le gaspillage"
                    desc="Ne jetez plus vos invendus, vendez-les à notre communauté."
                />
                <BenefitItem
                    icon="people-outline"
                    title="Nouveaux clients"
                    desc="Attirez une clientèle locale et engagée dans votre boutique."
                />
                <BenefitItem
                    icon="cash-outline"
                    title="Revenus additionnels"
                    desc="Transformez vos pertes en profits tout en faisant une bonne action."
                />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.ctaButton} onPress={handleBecomePartner}>
                    <Text style={styles.ctaText}>Créer mon compte Pro</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}>
                    En continuant, vous acceptez nos conditions générales de partenariat.
                </Text>
            </View>
        </ScrollView>
    );
}

const BenefitItem = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <View style={styles.benefitItem}>
        <View style={styles.benefitIcon}>
            <Ionicons name={icon} size={24} color="#4C7B4B" />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.benefitTitle}>{title}</Text>
            <Text style={styles.benefitDesc}>{desc}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    // Dashboard Styles
    dashboardCard: {
        margin: 16,
        padding: 20,
        backgroundColor: '#4C7B4B',
        borderRadius: 20,
    },
    welcomeText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '600',
        marginBottom: 4,
    },
    roleText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
        marginTop: 8,
        marginBottom: 16,
        color: '#333',
    },
    actionContainer: {
        padding: 16,
    },
    mainActionButton: {
        backgroundColor: '#4C7B4B',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#4C7B4B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    actionButtonTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    actionButtonDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
    },
    secondaryActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    secondaryButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
    },
    actionIconContainer: { // Renamed to avoid conflict with grid iconContainer
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
    },
    gridItem: {
        width: '50%',
        padding: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gridLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },

    // Onboarding Styles
    heroSection: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#f9f9f9',
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 8,
        color: '#1a1a1a',
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    benefitSection: {
        padding: 20,
    },
    benefitItem: {
        flexDirection: 'row',
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    benefitIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    benefitDesc: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
    },
    ctaButton: {
        backgroundColor: '#4C7B4B',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    ctaText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    termsText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
});
