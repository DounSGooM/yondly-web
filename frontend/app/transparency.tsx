import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../src/config/api';

export default function TransparencyScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [transparency, setTransparency] = useState<any>(null);

    useEffect(() => {
        loadTransparency();
    }, []);

    const loadTransparency = async () => {
        try {
            const res = await fetch(`${API_URL}/pro/transparency`);
            if (res.ok) {
                const data = await res.json();
                setTransparency(data);
            }
        } catch (error) {
            console.error('Error loading transparency:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4C7B4B" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transparence</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Platform Role */}
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle" size={22} color="#3b82f6" />
                    <Text style={styles.infoBannerText}>
                        Yondly est une plateforme de mise en relation. Le contrat est conclu directement entre vous et le professionnel.
                    </Text>
                </View>

                {/* Ranking Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="bar-chart" size={22} color="#4C7B4B" />
                        <Text style={styles.sectionTitle}>Classement des offres</Text>
                    </View>
                    <Text style={styles.sectionText}>
                        {transparency?.ranking_text || `Trier / classer les offres :
• Proximité géographique (ville/zone)
• Disponibilités (créneaux de retrait / dates de location)
• Pertinence catégorie & mots-clés
• Qualité de l'annonce (photos, description complète, infos légales)
• Historique de fiabilité (annulations, no-show, litiges)
• Signalements et modération

Yondly ne vend pas les produits : le professionnel reste responsable.`}
                    </Text>
                </View>

                {/* Dereferencing Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="shield-checkmark" size={22} color="#f59e0b" />
                        <Text style={styles.sectionTitle}>Suspensions et suppressions</Text>
                    </View>
                    <Text style={styles.sectionText}>
                        {transparency?.dereferencing_rules_text || `Une offre peut être suspendue ou supprimée si :
• Informations obligatoires manquantes
• Contenu trompeur, illégal ou dangereux
• Signalements répétés ou fraude
• Professionnel non vérifié ou paiements désactivés
• Non-respect des conditions de retrait/remise
• Litiges graves`}
                    </Text>
                </View>

                {/* DSA Compliance */}
                <View style={styles.dsaBox}>
                    <Ionicons name="document-text" size={20} color="#6b7280" />
                    <Text style={styles.dsaText}>
                        Ces informations sont publiées conformément au Digital Services Act (DSA) et à la réglementation européenne sur les plateformes numériques.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#eff6ff',
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
        gap: 12,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 14,
        color: '#1e40af',
        lineHeight: 22,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1f2937',
    },
    sectionText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 24,
    },
    dsaBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f3f4f6',
        padding: 14,
        borderRadius: 12,
        gap: 12,
        marginTop: 8,
    },
    dsaText: {
        flex: 1,
        fontSize: 12,
        color: '#6b7280',
        lineHeight: 18,
    },
});
