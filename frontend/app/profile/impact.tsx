import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { CO2DetailContent } from '../../src/components/CO2ImpactCard';
import { calculateCO2Impact, formatCO2, getCO2Level } from '../../src/utils/co2Calculator';

import { API_URL } from '../../src/config/api';

export default function ImpactScreen() {
    const router = useRouter();
    const { token, user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [impactData, setImpactData] = useState({
        basketsCount: 0,
        donationsCount: 0,
        salesCount: 0,
        rentalsCount: 0,
    });

    useEffect(() => {
        fetchImpactData();
    }, []);

    const fetchImpactData = async () => {
        try {
            const response = await axios.get(`${API_URL}/users/me/impact`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setImpactData(response.data);
        } catch (error) {
            console.error('Error fetching impact:', error);
            // Mock data for development
            setImpactData({
                basketsCount: 0,
                donationsCount: 0,
                salesCount: 0,
                rentalsCount: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const co2Impact = calculateCO2Impact(
        impactData.basketsCount,
        impactData.donationsCount,
        impactData.salesCount,
        impactData.rentalsCount
    );

    const level = getCO2Level(co2Impact.totalCO2SavedKg);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `🌱 J'ai économisé ${formatCO2(co2Impact.totalCO2SavedKg)} de CO₂ grâce à Yondly ! Rejoignez-moi pour sauver la planète. ${level.emoji}`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mon impact écologique</Text>
                <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                    <Ionicons name="share-outline" size={24} color="#4C7B4B" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <CO2DetailContent
                    totalCO2Kg={co2Impact.totalCO2SavedKg}
                    basketsCount={impactData.basketsCount}
                    donationsCount={impactData.donationsCount}
                    salesCount={impactData.salesCount}
                    rentalsCount={impactData.rentalsCount}
                />

                {/* Call to Action */}
                <View style={styles.ctaCard}>
                    <Text style={styles.ctaTitle}>Augmentez votre impact !</Text>
                    <Text style={styles.ctaText}>
                        Chaque action compte. Continuez à sauver des paniers anti-gaspi et à donner une seconde vie aux objets.
                    </Text>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={() => router.push('/(tabs)/antigaspi')}
                    >
                        <Ionicons name="basket" size={20} color="#fff" />
                        <Text style={styles.ctaButtonText}>Voir les paniers</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
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
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    shareButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    ctaCard: {
        backgroundColor: '#4C7B4B',
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    ctaText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    ctaButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
