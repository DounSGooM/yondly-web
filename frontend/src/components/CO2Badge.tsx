import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config/api';

// Hardcoded colors to avoid import issues
const themeColors = {
    primary: '#4C7B4B',
    textPrimary: '#1a1a1a',
    textSecondary: '#666666',
    textTertiary: '#999999',
};

interface CO2BadgeProps {
    itemId: string;
    category?: string;
    compact?: boolean;
    showDetails?: boolean;
}

interface CO2Estimate {
    co2_saved_kg: number;
    method?: string;
    confidence?: number;
    source?: string;
    explanation?: string;
    equivalents?: {
        trees_year: number;
        car_km_avoided: number;
        smartphones_saved: number;
        streaming_hours: number;
    };
}

// Quick ADEME-based estimate (no API call)
const QUICK_CO2_ESTIMATES: Record<string, number> = {
    'Électronique': 50, 'High-Tech': 50,
    'Vêtements': 12, 'Mode': 12,
    'Maison': 50, 'Meubles': 50,
    'Sports': 20, 'Loisirs': 20,
    'Livres': 1.5, 'Jouets': 8,
    'Bricolage': 25, 'Jardin': 25,
    'Boulangerie': 2.5, 'Restaurant': 2.5,
    'default': 10,
};

export default function CO2Badge({ itemId, category, compact = false, showDetails = false }: CO2BadgeProps) {
    const [estimate, setEstimate] = useState<CO2Estimate | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const quickEstimate = QUICK_CO2_ESTIMATES[category || 'default'] || QUICK_CO2_ESTIMATES['default'];

    useEffect(() => {
        if (showDetails && itemId) {
            fetchCO2Estimate();
        }
    }, [itemId, showDetails]);

    const fetchCO2Estimate = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/items/${itemId}/co2`);
            setEstimate(response.data);
        } catch (error) {
            console.log('CO2 estimate not available, using quick estimate');
            setEstimate({
                co2_saved_kg: quickEstimate,
                method: 'ademe_base',
                source: 'ADEME Base Carbone',
            });
        } finally {
            setLoading(false);
        }
    };

    const co2Value = estimate?.co2_saved_kg || quickEstimate;

    // Compact badge for cards
    if (compact) {
        return (
            <View style={styles.compactBadge}>
                <Ionicons name="leaf" size={12} color="#fff" />
                <Text style={styles.compactText}>-{co2Value.toFixed(0)}kg CO₂</Text>
            </View>
        );
    }

    // Full display for detail page
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.8}
        >
            <View style={styles.header}>
                <View style={styles.mainInfo}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="leaf" size={24} color="#fff" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Impact environnemental</Text>
                        {loading ? (
                            <ActivityIndicator size="small" color={themeColors.primary} />
                        ) : (
                            <Text style={styles.co2Value}>
                                <Text style={styles.co2Number}>{co2Value.toFixed(1)}</Text> kg CO₂ économisé
                            </Text>
                        )}
                    </View>
                </View>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={themeColors.textSecondary}
                />
            </View>

            {expanded && estimate && (
                <View style={styles.details}>
                    {/* Compute equivalents locally if not provided by API */}
                    {(() => {
                        const co2 = estimate.co2_saved_kg || 0;
                        const equiv = {
                            trees: estimate.equivalents?.trees_year ?? (co2 / 22),
                            car_km: estimate.equivalents?.car_km_avoided ?? (co2 / 0.12),
                            smartphones: estimate.equivalents?.smartphones_saved ?? (co2 / 70),
                            streaming: estimate.equivalents?.streaming_hours ?? (co2 / 0.055),
                        };
                        return (
                            <View style={styles.equivalentsGrid}>
                                <View style={styles.equivalentItem}>
                                    <Text style={styles.equivalentEmoji}>🌳</Text>
                                    <Text style={styles.equivalentValue}>{equiv.trees.toFixed(2)}</Text>
                                    <Text style={styles.equivalentLabel}>arbres/an</Text>
                                </View>
                                <View style={styles.equivalentItem}>
                                    <Text style={styles.equivalentEmoji}>🚗</Text>
                                    <Text style={styles.equivalentValue}>{equiv.car_km.toFixed(0)}</Text>
                                    <Text style={styles.equivalentLabel}>km évités</Text>
                                </View>
                                <View style={styles.equivalentItem}>
                                    <Text style={styles.equivalentEmoji}>📱</Text>
                                    <Text style={styles.equivalentValue}>{equiv.smartphones.toFixed(1)}</Text>
                                    <Text style={styles.equivalentLabel}>smartphones</Text>
                                </View>
                                <View style={styles.equivalentItem}>
                                    <Text style={styles.equivalentEmoji}>📺</Text>
                                    <Text style={styles.equivalentValue}>{equiv.streaming.toFixed(0)}</Text>
                                    <Text style={styles.equivalentLabel}>h streaming</Text>
                                </View>
                            </View>
                        );
                    })()}

                    {estimate.explanation && (
                        <View style={styles.explanationBox}>
                            <Text style={styles.explanationText}>{estimate.explanation}</Text>
                        </View>
                    )}

                    <View style={styles.sourceRow}>
                        <Ionicons name="information-circle-outline" size={14} color={themeColors.textTertiary} />
                        <Text style={styles.sourceText}>
                            Source: {estimate.source || 'ADEME Base Carbone'}
                        </Text>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    compactBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 123, 75, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    compactText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    container: {
        backgroundColor: '#f0f7f0',
        borderRadius: 16,
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(76, 123, 75, 0.2)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    mainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#4C7B4B',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    co2Value: {
        fontSize: 16,
        color: '#1a1a1a',
    },
    co2Number: {
        fontSize: 20,
        fontWeight: '700',
        color: '#4C7B4B',
    },
    details: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(76, 123, 75, 0.15)',
    },
    equivalentsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    equivalentItem: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 8,
    },
    equivalentEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    equivalentValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    equivalentLabel: {
        fontSize: 12,
        color: '#666666',
        textAlign: 'center',
    },
    explanationBox: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 12,
        marginBottom: 8,
    },
    explanationText: {
        fontSize: 14,
        color: '#666666',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sourceText: {
        fontSize: 12,
        color: '#999999',
    },
});
