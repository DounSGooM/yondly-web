import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AllowedZone, getActiveZones } from '../config/geoRestriction';

interface GeoBlockedScreenProps {
    nearestZone: AllowedZone | null;
    onRetry: () => void;
    isRetrying?: boolean;
    error?: string | null;
}

export default function GeoBlockedScreen({
    nearestZone,
    onRetry,
    isRetrying = false,
    error
}: GeoBlockedScreenProps) {
    const activeZones = getActiveZones();

    const handleNotifyMe = () => {
        // Opens email to register interest
        Linking.openURL('mailto:expansion@yondly.com?subject=Intéressé%20par%20Yondly%20dans%20ma%20ville');
    };

    const isPermissionError = error === 'permission_denied';

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={isPermissionError ? "location-outline" : "map-outline"}
                        size={80}
                        color="#4C7B4B"
                    />
                </View>

                {/* Title */}
                <Text style={styles.title}>
                    {isPermissionError
                        ? "Localisation requise"
                        : "Bientôt dans votre ville !"}
                </Text>

                {/* Message */}
                <Text style={styles.message}>
                    {isPermissionError
                        ? "Pour utiliser Yondly, nous avons besoin d'accéder à votre localisation afin de vous montrer les offres près de chez vous."
                        : "Yondly n'est pas encore disponible dans votre zone. Nous travaillons dur pour arriver chez vous très bientôt !"}
                </Text>

                {/* Nearest zone info */}
                {nearestZone && !isPermissionError && (
                    <View style={styles.nearestCard}>
                        <Ionicons name="navigate" size={20} color="#4C7B4B" />
                        <Text style={styles.nearestText}>
                            Zone la plus proche : <Text style={styles.nearestName}>{nearestZone.displayName}</Text>
                        </Text>
                    </View>
                )}

                {/* Active zones */}
                {!isPermissionError && (
                    <View style={styles.zonesSection}>
                        <Text style={styles.zonesTitle}>Zones disponibles</Text>
                        <View style={styles.zonesList}>
                            {activeZones.map((zone) => (
                                <View key={zone.id} style={styles.zoneItem}>
                                    <Ionicons name="checkmark-circle" size={18} color="#4C7B4B" />
                                    <Text style={styles.zoneName}>{zone.displayName}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Coming soon zones */}
                {!isPermissionError && (
                    <View style={styles.comingSoonSection}>
                        <Text style={styles.comingSoonTitle}>🚀 Prochainement</Text>
                        <Text style={styles.comingSoonText}>
                            Paris, Lyon, Bordeaux, Nantes, Tours, La Rochelle et bien d'autres...
                        </Text>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={onRetry}
                        disabled={isRetrying}
                    >
                        {isRetrying ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="refresh" size={20} color="#fff" />
                                <Text style={styles.retryText}>
                                    {isPermissionError ? "Autoriser la localisation" : "Réessayer"}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {!isPermissionError && (
                        <TouchableOpacity
                            style={styles.notifyButton}
                            onPress={handleNotifyMe}
                        >
                            <Ionicons name="notifications-outline" size={20} color="#4C7B4B" />
                            <Text style={styles.notifyText}>Me prévenir du lancement</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Footer message */}
                <Text style={styles.footerText}>
                    🌱 Chaque ville compte dans notre mission anti-gaspi !
                </Text>
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
        flexGrow: 1,
        padding: 24,
        paddingTop: 80,
        alignItems: 'center',
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 16,
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    nearestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
        width: '100%',
    },
    nearestText: {
        fontSize: 14,
        color: '#666',
    },
    nearestName: {
        fontWeight: '600',
        color: '#4C7B4B',
    },
    zonesSection: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    zonesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    zonesList: {
        gap: 12,
    },
    zoneItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    zoneName: {
        fontSize: 15,
        color: '#333',
    },
    comingSoonSection: {
        width: '100%',
        backgroundColor: '#fff8e1',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
    },
    comingSoonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    comingSoonText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4C7B4B',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    retryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    notifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4C7B4B',
        gap: 8,
    },
    notifyText: {
        color: '#4C7B4B',
        fontSize: 16,
        fontWeight: '600',
    },
    footerText: {
        marginTop: 32,
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});
