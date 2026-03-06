import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    formatCO2,
    getCO2Level,
    getCO2Equivalents,
} from '../utils/co2Calculator';

interface CO2ImpactCardProps {
    totalCO2Kg: number;
    onPress?: () => void;
    compact?: boolean;
}

export default function CO2ImpactCard({ totalCO2Kg, onPress, compact = false }: CO2ImpactCardProps) {
    const level = getCO2Level(totalCO2Kg);
    const equivalents = getCO2Equivalents(totalCO2Kg);

    if (compact) {
        return (
            <TouchableOpacity
                style={styles.compactCard}
                onPress={onPress}
                disabled={!onPress}
            >
                <View style={styles.compactLeft}>
                    <Text style={styles.compactEmoji}>{level.emoji}</Text>
                    <View>
                        <Text style={styles.compactValue}>{formatCO2(totalCO2Kg)}</Text>
                        <Text style={styles.compactLabel}>CO₂ économisé</Text>
                    </View>
                </View>
                {onPress && (
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={onPress ? 0.8 : 1}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelEmoji}>{level.emoji}</Text>
                    <Text style={[styles.levelText, { color: level.color }]}>{level.level}</Text>
                </View>
                <Ionicons name="leaf" size={24} color="#4C7B4B" />
            </View>

            {/* Main CO2 Value */}
            <View style={styles.mainValue}>
                <Text style={styles.co2Value}>{formatCO2(totalCO2Kg)}</Text>
                <Text style={styles.co2Label}>de CO₂ économisé</Text>
            </View>

            {/* Equivalents */}
            <View style={styles.equivalentsGrid}>
                <View style={styles.equivalentItem}>
                    <Ionicons name="leaf-outline" size={20} color="#4C7B4B" />
                    <Text style={styles.equivalentValue}>{equivalents.treeDays}</Text>
                    <Text style={styles.equivalentLabel}>jours d'arbre</Text>
                </View>
                <View style={styles.equivalentDivider} />
                <View style={styles.equivalentItem}>
                    <Ionicons name="car-outline" size={20} color="#4C7B4B" />
                    <Text style={styles.equivalentValue}>{equivalents.carKm}</Text>
                    <Text style={styles.equivalentLabel}>km en voiture</Text>
                </View>
            </View>

            {/* Progress hint */}
            {totalCO2Kg > 0 && (
                <View style={styles.progressHint}>
                    <Ionicons name="trending-up" size={14} color="#4C7B4B" />
                    <Text style={styles.progressText}>
                        Continuez à sauver la planète ! 🌍
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

interface CO2DetailScreenContentProps {
    totalCO2Kg: number;
    basketsCount: number;
    donationsCount?: number;
    salesCount?: number;
    rentalsCount?: number;
}

export function CO2DetailContent({
    totalCO2Kg,
    basketsCount,
    donationsCount = 0,
    salesCount = 0,
    rentalsCount = 0,
}: CO2DetailScreenContentProps) {
    const level = getCO2Level(totalCO2Kg);
    const equivalents = getCO2Equivalents(totalCO2Kg);

    return (
        <View style={styles.detailContainer}>
            {/* Main Impact */}
            <View style={styles.detailMainCard}>
                <Text style={styles.detailEmoji}>{level.emoji}</Text>
                <Text style={styles.detailMainValue}>{formatCO2(totalCO2Kg)}</Text>
                <Text style={styles.detailMainLabel}>de CO₂ économisé</Text>
                <View style={[styles.detailLevelBadge, { backgroundColor: level.color }]}>
                    <Text style={styles.detailLevelText}>{level.level}</Text>
                </View>
            </View>

            {/* Breakdown */}
            <Text style={styles.detailSectionTitle}>Votre impact</Text>
            <View style={styles.breakdownCard}>
                {basketsCount > 0 && (
                    <View style={styles.breakdownRow}>
                        <View style={styles.breakdownLeft}>
                            <Ionicons name="basket" size={20} color="#4C7B4B" />
                            <Text style={styles.breakdownLabel}>Paniers anti-gaspi</Text>
                        </View>
                        <Text style={styles.breakdownValue}>{basketsCount}</Text>
                    </View>
                )}
                {donationsCount > 0 && (
                    <View style={styles.breakdownRow}>
                        <View style={styles.breakdownLeft}>
                            <Ionicons name="gift" size={20} color="#4C7B4B" />
                            <Text style={styles.breakdownLabel}>Dons alimentaires</Text>
                        </View>
                        <Text style={styles.breakdownValue}>{donationsCount}</Text>
                    </View>
                )}
                {salesCount > 0 && (
                    <View style={styles.breakdownRow}>
                        <View style={styles.breakdownLeft}>
                            <Ionicons name="pricetag" size={20} color="#4C7B4B" />
                            <Text style={styles.breakdownLabel}>Objets seconde main</Text>
                        </View>
                        <Text style={styles.breakdownValue}>{salesCount}</Text>
                    </View>
                )}
                {rentalsCount > 0 && (
                    <View style={styles.breakdownRow}>
                        <View style={styles.breakdownLeft}>
                            <Ionicons name="repeat" size={20} color="#4C7B4B" />
                            <Text style={styles.breakdownLabel}>Locations</Text>
                        </View>
                        <Text style={styles.breakdownValue}>{rentalsCount}</Text>
                    </View>
                )}
            </View>

            {/* Equivalents */}
            <Text style={styles.detailSectionTitle}>C'est équivalent à</Text>
            <View style={styles.equivalentsDetailGrid}>
                <View style={styles.equivalentDetailItem}>
                    <View style={styles.equivalentDetailIcon}>
                        <Text style={styles.equivalentDetailEmoji}>🌳</Text>
                    </View>
                    <Text style={styles.equivalentDetailValue}>{equivalents.treeDays}</Text>
                    <Text style={styles.equivalentDetailLabel}>jours d'absorption{'\n'}par un arbre</Text>
                </View>
                <View style={styles.equivalentDetailItem}>
                    <View style={styles.equivalentDetailIcon}>
                        <Text style={styles.equivalentDetailEmoji}>🚗</Text>
                    </View>
                    <Text style={styles.equivalentDetailValue}>{equivalents.carKm}</Text>
                    <Text style={styles.equivalentDetailLabel}>kilomètres{'\n'}en voiture évités</Text>
                </View>
                <View style={styles.equivalentDetailItem}>
                    <View style={styles.equivalentDetailIcon}>
                        <Text style={styles.equivalentDetailEmoji}>📱</Text>
                    </View>
                    <Text style={styles.equivalentDetailValue}>{equivalents.smartphoneCharges}</Text>
                    <Text style={styles.equivalentDetailLabel}>recharges de{'\n'}smartphone</Text>
                </View>
            </View>

            {/* Tip */}
            <View style={styles.tipCard}>
                <Ionicons name="bulb" size={24} color="#ff9800" />
                <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Saviez-vous ?</Text>
                    <Text style={styles.tipText}>
                        Le gaspillage alimentaire représente 10% des émissions mondiales de CO₂.
                        Chaque panier sauvé compte !
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Compact Card
    compactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#e8f5e9',
        padding: 16,
        borderRadius: 16,
    },
    compactLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    compactEmoji: {
        fontSize: 28,
    },
    compactValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    compactLabel: {
        fontSize: 12,
        color: '#4C7B4B',
    },

    // Full Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#4C7B4B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    levelEmoji: {
        fontSize: 24,
    },
    levelText: {
        fontSize: 14,
        fontWeight: '600',
    },
    mainValue: {
        alignItems: 'center',
        marginBottom: 20,
    },
    co2Value: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    co2Label: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    equivalentsGrid: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
    },
    equivalentItem: {
        flex: 1,
        alignItems: 'center',
    },
    equivalentDivider: {
        width: 1,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 12,
    },
    equivalentValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    equivalentLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
    progressHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 6,
    },
    progressText: {
        fontSize: 13,
        color: '#4C7B4B',
    },

    // Detail Screen
    detailContainer: {
        padding: 16,
    },
    detailMainCard: {
        backgroundColor: '#e8f5e9',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
    },
    detailEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    detailMainValue: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    detailMainLabel: {
        fontSize: 16,
        color: '#4C7B4B',
        marginTop: 4,
    },
    detailLevelBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 16,
    },
    detailLevelText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    detailSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    breakdownCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 8,
        marginBottom: 24,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
    },
    breakdownLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    breakdownLabel: {
        fontSize: 14,
        color: '#333',
    },
    breakdownValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    equivalentsDetailGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    equivalentDetailItem: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    equivalentDetailIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    equivalentDetailEmoji: {
        fontSize: 24,
    },
    equivalentDetailValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    equivalentDetailLabel: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
    },
    tipCard: {
        flexDirection: 'row',
        backgroundColor: '#fff8e1',
        borderRadius: 16,
        padding: 16,
        gap: 12,
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    tipText: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
        lineHeight: 18,
    },
});
