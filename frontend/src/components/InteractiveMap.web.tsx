import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MapItem {
    id: string;
    title: string;
    location: {
        lat: number;
        lng: number;
    };
    type: 'donation' | 'sale' | 'store' | 'rent';
    price_cents?: number;
    photos?: string[];
}

interface InteractiveMapProps {
    items: MapItem[];
    onItemPress?: (itemId: string) => void;
    onMarkerPress?: (itemId: string) => void;
    userLocation?: { lat: number; lng: number } | null;
}

// Web fallback - Maps not supported on web
export default function InteractiveMap({ items }: InteractiveMapProps) {
    return (
        <View style={styles.webFallback}>
            <Ionicons name="map" size={48} color="#4C7B4B" />
            <Text style={styles.webFallbackTitle}>Carte interactive</Text>
            <Text style={styles.webFallbackText}>
                La carte est disponible sur l'application mobile.
            </Text>
            <Text style={styles.webFallbackCount}>
                {items.length} offre(s) près de chez vous
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    webFallback: {
        flex: 1,
        backgroundColor: '#f8faf8',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
    },
    webFallbackTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 12,
        marginBottom: 8,
    },
    webFallbackText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 12,
    },
    webFallbackCount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4C7B4B',
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        overflow: 'hidden',
    }
});
