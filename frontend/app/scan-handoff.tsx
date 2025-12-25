import React, { useState, useRef } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { useAuthStore } from '../src/store/authStore';
import { API_URL } from '../src/config/api';

export default function ScanHandoffScreen() {
    const router = useRouter();
    const { orderId, code: expectedCode, type, itemTitle } = useLocalSearchParams<{
        orderId: string;
        code: string;
        type: 'sale' | 'rental' | 'donation' | 'rental_pickup' | 'rental_return';
        itemTitle?: string;
    }>();
    const { token } = useAuthStore();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'scan' | 'manual'>('scan');
    const [validated, setValidated] = useState(false);

    // Ref to prevent multiple scans (synchronous check)
    const isProcessingRef = useRef(false);

    // Get display text based on transaction type
    const getTypeLabel = () => {
        switch (type) {
            case 'rental': return 'location';
            case 'donation': return 'don';
            default: return 'vente';
        }
    };

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        // Use ref for synchronous check to prevent race conditions
        if (isProcessingRef.current || scanned || validated) return;
        isProcessingRef.current = true;
        setScanned(true);
        await validateHandoff(data);
    };

    const validateHandoff = async (scannedCode: string) => {
        const code = scannedCode.trim().toUpperCase();

        if (!code) {
            Alert.alert('Erreur', 'Veuillez entrer un code valide');
            isProcessingRef.current = false;
            setScanned(false);
            return;
        }

        // Verify code matches expected
        if (expectedCode && code !== expectedCode.toUpperCase()) {
            Alert.alert('❌ Code incorrect', 'Ce code ne correspond pas à cette commande.');
            isProcessingRef.current = false;
            setScanned(false);
            return;
        }

        setLoading(true);
        try {
            let response;
            let successType = type || 'sale';

            // Handle different transaction types
            if (type === 'rental_pickup') {
                // Rental pickup confirmation
                response = await axios.post(
                    `${API_URL}/rentals/${orderId}/pickup`,
                    null,
                    {
                        params: { code },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                successType = 'rental';
            } else if (type === 'rental_return') {
                // Rental return confirmation
                response = await axios.post(
                    `${API_URL}/rentals/${orderId}/return`,
                    null,
                    {
                        params: { code },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                successType = 'rental';
            } else {
                // Standard order handoff (sale/donation)
                response = await axios.post(
                    `${API_URL}/orders/${orderId}/handoff`,
                    null,
                    {
                        params: { code },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
            }

            setValidated(true);

            // Navigate to success screen with transaction data
            router.replace({
                pathname: '/transaction-success',
                params: {
                    orderId: orderId,
                    type: response.data?.item_type || successType,
                    itemTitle: response.data?.item_title || itemTitle || 'Article',
                    amount: response.data?.payout_cents?.toString() || response.data?.total_price_cents?.toString() || '0',
                    co2_kg: response.data?.co2_kg?.toString() || '5',
                }
            });
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Erreur lors de la validation';
            Alert.alert('❌ Erreur', message);
            isProcessingRef.current = false;
            setScanned(false);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = () => {
        validateHandoff(manualCode);
    };

    const resetScanner = () => {
        setScanned(false);
        setManualCode('');
    };

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
                <Text style={styles.headerTitle}>Confirmer la remise</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Instructions */}
            <View style={styles.instructionCard}>
                <Ionicons name="information-circle" size={24} color="#4C7B4B" />
                <Text style={styles.instructionText}>
                    Scannez le QR code affiché sur l'écran de l'acheteur pour confirmer la remise de l'article.
                </Text>
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
                                Placez le QR code de l'acheteur dans le cadre
                            </Text>
                            {loading && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator size="large" color="#fff" />
                                    <Text style={styles.loadingText}>Validation en cours...</Text>
                                </View>
                            )}
                            {scanned && !loading && !validated && (
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
                        <Text style={styles.manualTitle}>Entrez le code de remise</Text>
                        <Text style={styles.manualSubtitle}>
                            Le code à 6 caractères affiché sur l'écran de l'acheteur
                        </Text>

                        {expectedCode && (
                            <View style={styles.expectedCodeHint}>
                                <Ionicons name="key" size={16} color="#4C7B4B" />
                                <Text style={styles.expectedCodeText}>
                                    Code attendu : {expectedCode}
                                </Text>
                            </View>
                        )}

                        <TextInput
                            style={styles.codeInput}
                            value={manualCode}
                            onChangeText={(text) => setManualCode(text.toUpperCase())}
                            placeholder="ABC123"
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
                                    <Text style={styles.validateButtonText}>Confirmer la remise</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            {/* Success Card */}
            {validated && (
                <View style={styles.validatedCard}>
                    <View style={styles.validatedHeader}>
                        <Ionicons name="checkmark-circle" size={48} color="#4C7B4B" />
                    </View>
                    <Text style={styles.validatedTitle}>Remise confirmée !</Text>
                    <Text style={styles.validatedSubtitle}>
                        Le paiement sera libéré sur votre portefeuille.
                    </Text>
                    <TouchableOpacity
                        style={styles.doneButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.doneButtonText}>Terminé</Text>
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
    instructionCard: {
        flexDirection: 'row',
        backgroundColor: '#e8f5e9',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        gap: 12,
        alignItems: 'center',
    },
    instructionText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
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
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
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
        bottom: 60,
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
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 12,
    },
    rescanButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
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
        backgroundColor: '#fff',
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
        marginBottom: 16,
    },
    expectedCodeHint: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 24,
        gap: 8,
    },
    expectedCodeText: {
        fontSize: 14,
        color: '#4C7B4B',
        fontWeight: '600',
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
        top: '30%',
        left: 40,
        right: 40,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    validatedHeader: {
        marginBottom: 16,
    },
    validatedTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4C7B4B',
        marginBottom: 8,
    },
    validatedSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    doneButton: {
        backgroundColor: '#4C7B4B',
        paddingHorizontal: 48,
        paddingVertical: 14,
        borderRadius: 12,
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
