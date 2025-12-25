import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProSellerPublic } from '../types';

interface ProSellerBadgeProps {
    proInfo: ProSellerPublic;
    onPress?: () => void;
    compact?: boolean;
}

const LEGAL_FORM_LABELS: Record<string, string> = {
    'auto_entrepreneur': 'Auto-entrepreneur',
    'ei': 'Entreprise Individuelle',
    'eirl': 'EIRL',
    'eurl': 'EURL',
    'sarl': 'SARL',
    'sas': 'SAS',
    'sasu': 'SASU',
    'sa': 'SA',
    'snc': 'SNC',
    'association': 'Association',
    'other': 'Autre',
};

/**
 * ProSellerBadge - Displays verified Pro seller information (DSA transparency)
 * 
 * Shows business name, masked SIREN, and city for DSA Art. 30 compliance.
 */
export default function ProSellerBadge({ proInfo, onPress, compact = false }: ProSellerBadgeProps) {
    if (!proInfo || !proInfo.verified) {
        return null;
    }

    if (compact) {
        return (
            <TouchableOpacity
                style={styles.compactBadge}
                onPress={onPress}
                activeOpacity={onPress ? 0.7 : 1}
            >
                <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                <Text style={styles.compactText}>Pro vérifié</Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.header}>
                <View style={styles.badge}>
                    <Ionicons name="shield-checkmark" size={16} color="#fff" />
                    <Text style={styles.badgeText}>Vendeur Pro vérifié</Text>
                </View>
            </View>

            <View style={styles.info}>
                <Text style={styles.businessName}>
                    {proInfo.trade_name || proInfo.business_name}
                </Text>

                <View style={styles.details}>
                    <View style={styles.detailRow}>
                        <Ionicons name="business-outline" size={14} color="#666" />
                        <Text style={styles.detailText}>
                            {LEGAL_FORM_LABELS[proInfo.legal_form] || proInfo.legal_form}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="document-text-outline" size={14} color="#666" />
                        <Text style={styles.detailText}>
                            SIREN: {proInfo.siren_masked}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text style={styles.detailText}>
                            {proInfo.city}, {proInfo.country}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    ℹ️ Informations légales DSA
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        padding: 16,
        marginVertical: 8,
    },
    header: {
        marginBottom: 12,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    info: {
        marginBottom: 12,
    },
    businessName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
    },
    details: {
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 13,
        color: '#4b5563',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#d1fae5',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 11,
        color: '#6b7280',
        textAlign: 'center',
    },
    // Compact style
    compactBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        alignSelf: 'flex-start',
    },
    compactText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#10b981',
    },
});
