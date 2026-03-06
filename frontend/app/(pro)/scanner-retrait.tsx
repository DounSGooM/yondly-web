import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    TextInput,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';

import { API_URL } from '../../src/config/api';

export default function ScannerRetraitScreen() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'scan' | 'manual'>('scan');
    const [validatedOrder, setValidatedOrder] = useState<any>(null);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        await validatePickup(data);
    };

    const validatePickup = async (code: string) => {
        if (!code.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer un code valide');
            setScanned(false);
            return;
        }

        setLoading(true);
        try {
            // Try to validate the pickup code
            const response = await axios.post(
                `${API_URL}/orders/validate-pickup`,
                { pickup_code: code.trim().toUpperCase() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setValidatedOrder(response.data);
            Alert.alert(
                '✅ Retrait validé !',
                `Commande de ${response.data.buyer_name || 'Client'} confirmée.`,
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Code invalide ou commande introuvable';
            Alert.alert('❌ Erreur', message);
            setScanned(false);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = () => {
        validatePickup(manualCode);
    };

    const resetScanner = () => {
        setScanned(false);
        setManualCode('');
        setValidatedOrder(null);
    };

    // Camera permission handling
    if (!permission) {
        return (
            <View style={styles.container}>
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
                <Text style={styles.headerTitle}>Scanner un retrait</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Mode Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, mode === 'scan' && styles.tabActive]}
                    onPress={() => setMode('scan')}
                >
                    <Ionicons name="qr-code" size={20} color={mode === 'scan' ? '#4C7B4B' : '#666'} />
                    <Text style={[styles.tabText, mode === 'scan' && styles.tabTextActive]}>
                        Scanner QR
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, mode === 'manual' && styles.tabActive]}
                    onPress={() => setMode('manual')}
                >
                    <Ionicons name="keypad" size={20} color={mode === 'manual' ? '#4C7B4B' : '#666'} />
                    <Text style={[styles.tabText, mode === 'manual' && styles.tabTextActive]}>
                        Code manuel
                    </Text>
                </TouchableOpacity>
            </View>

            {mode === 'scan' ? (
                <View style={styles.scannerContainer}>
                    {!permission.granted ? (
                        <View style={styles.permissionContainer}>
                            <Ionicons name="camera-outline" size={64} color="#666" />
                            <Text style={styles.permissionText}>
                                Autorisez l'accès à la caméra pour scanner les codes QR
                            </Text>
                            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                                <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <CameraView
                                style={styles.camera}
                                facing="back"
                                barcodeScannerSettings={{
                                    barcodeTypes: ['qr'],
                                }}
                                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                            />
                            <View style={styles.overlay}>
                                <View style={styles.scanFrame}>
                                    <View style={[styles.corner, styles.topLeft]} />
                                    <View style={[styles.corner, styles.topRight]} />
                                    <View style={[styles.corner, styles.bottomLeft]} />
                                    <View style={[styles.corner, styles.bottomRight]} />
                                </View>
                            </View>
                            <Text style={styles.scanHint}>
                                Placez le QR code du client dans le cadre
                            </Text>
                            {scanned && (
                                <TouchableOpacity style={styles.rescanButton} onPress={resetScanner}>
                                    <Text style={styles.rescanButtonText}>Scanner à nouveau</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            ) : (
                <ScrollView style={styles.manualContainer} keyboardShouldPersistTaps="handled">
                    <View style={styles.manualContent}>
                        <View style={styles.codeIconContainer}>
                            <Ionicons name="keypad" size={48} color="#4C7B4B" />
                        </View>
                        <Text style={styles.manualTitle}>Entrez le code de retrait</Text>
                        <Text style={styles.manualSubtitle}>
                            Le code à 6 caractères affiché sur l'écran du client
                        </Text>

                        <TextInput
                            style={styles.codeInput}
                            value={manualCode}
                            onChangeText={(text) => setManualCode(text.toUpperCase())}
                            placeholder="EX: ABC123"
                            placeholderTextColor="#999"
                            maxLength={6}
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />

                        <TouchableOpacity
                            style={[styles.validateButton, loading && styles.validateButtonDisabled]}
                            onPress={handleManualSubmit}
                            disabled={loading || manualCode.length < 4}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                    <Text style={styles.validateButtonText}>Valider le retrait</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            {/* Validated Order Info */}
            {validatedOrder && (
                <View style={styles.validatedCard}>
                    <View style={styles.validatedHeader}>
                        <Ionicons name="checkmark-circle" size={32} color="#4C7B4B" />
                        <Text style={styles.validatedTitle}>Retrait confirmé !</Text>
                    </View>
                    <View style={styles.validatedInfo}>
                        <Text style={styles.validatedLabel}>Client</Text>
                        <Text style={styles.validatedValue}>{validatedOrder.buyer_name || 'Client'}</Text>
                    </View>
                    <View style={styles.validatedInfo}>
                        <Text style={styles.validatedLabel}>Article</Text>
                        <Text style={styles.validatedValue}>{validatedOrder.item_title || 'Panier Surprise'}</Text>
                    </View>
                    <TouchableOpacity style={styles.newScanButton} onPress={resetScanner}>
                        <Text style={styles.newScanButtonText}>Nouveau scan</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        gap: 8,
    },
    tabActive: {
        backgroundColor: '#e8f5e9',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#4C7B4B',
        fontWeight: '600',
    },
    scannerContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#4C7B4B',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 8,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 8,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 8,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 8,
    },
    scanHint: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    rescanButton: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        backgroundColor: '#4C7B4B',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    rescanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    permissionText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: '#4C7B4B',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    manualContainer: {
        flex: 1,
    },
    manualContent: {
        padding: 24,
        alignItems: 'center',
    },
    codeIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    manualTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    manualSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    codeInput: {
        width: '100%',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#4C7B4B',
        borderRadius: 16,
        padding: 20,
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 8,
        color: '#333',
    },
    validateButton: {
        flexDirection: 'row',
        backgroundColor: '#4C7B4B',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        width: '100%',
        gap: 8,
    },
    validateButtonDisabled: {
        opacity: 0.5,
    },
    validateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    validatedCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    validatedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    validatedTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    validatedInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    validatedLabel: {
        fontSize: 14,
        color: '#666',
    },
    validatedValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    newScanButton: {
        backgroundColor: '#e8f5e9',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    newScanButtonText: {
        color: '#4C7B4B',
        fontSize: 16,
        fontWeight: '600',
    },
});
