import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Share,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../src/config/api';
import { useAssociationStore } from '../src/store/associationStore';
import { Beneficiary } from '../src/types';

export default function AssoShareQRScreen() {
    const router = useRouter();
    const { orderId, pickupCode, storeName, dealTitle, quantity } = useLocalSearchParams<{
        orderId: string;
        pickupCode: string;
        storeName: string;
        dealTitle: string;
        quantity: string;
    }>();

    const { beneficiaries, fetchBeneficiaries } = useAssociationStore();
    const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [showBeneficiarySelector, setShowBeneficiarySelector] = useState(false);
    const [assignedRef, setAssignedRef] = useState<string | null>(null);

    useEffect(() => {
        fetchBeneficiaries();
    }, []);

    const activeBeneficiaries = beneficiaries.filter(b => b.is_active);

    const handleAssignBeneficiary = async (beneficiary: Beneficiary) => {
        setIsAssigning(true);
        try {
            const token = await AsyncStorage.getItem('auth_token');
            await axios.post(
                `${API_URL}/orders/${orderId}/assign-beneficiary`,
                null,
                {
                    params: { beneficiary_id: beneficiary.id },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSelectedBeneficiary(beneficiary);
            setAssignedRef(beneficiary.internal_ref);
            setShowBeneficiarySelector(false);

            Alert.alert('Succès', `Panier assigné à ${beneficiary.internal_ref}`);
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Impossible d\'assigner le bénéficiaire');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleShare = async () => {
        const message = `🧺 Panier anti-gaspi YONDLY

📍 Magasin : ${storeName}
📦 Panier : ${dealTitle}
📊 Quantité : ${quantity} panier(s)

🔑 Code de récupération : ${pickupCode}

Présentez ce code au commerce pour récupérer votre panier.

⏰ À récupérer aujourd'hui !`;

        try {
            await Share.share({
                message,
                title: 'Panier anti-gaspi - Code de récupération',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Partager le code</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Success Icon */}
                <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={64} color="#4C7B4B" />
                </View>

                <Text style={styles.successTitle}>Panier récupéré !</Text>
                <Text style={styles.successSubtitle}>
                    {quantity} panier(s) chez {storeName}
                </Text>

                {/* QR Code Card */}
                <View style={styles.qrCard}>
                    <Text style={styles.qrLabel}>Code de récupération</Text>

                    <View style={styles.qrContainer}>
                        <QRCode
                            value={pickupCode || 'NOCODE'}
                            size={180}
                            backgroundColor="#fff"
                            color="#1A1A1A"
                        />
                    </View>

                    <Text style={styles.codeText}>{pickupCode}</Text>

                    {assignedRef && (
                        <View style={styles.assignedBadge}>
                            <Ionicons name="person" size={16} color="#4C7B4B" />
                            <Text style={styles.assignedText}>Assigné à {assignedRef}</Text>
                        </View>
                    )}
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="storefront-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>{storeName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="basket-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>{dealTitle}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>À récupérer aujourd'hui</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    {!assignedRef && (
                        <TouchableOpacity
                            style={styles.assignButton}
                            onPress={() => setShowBeneficiarySelector(true)}
                        >
                            <Ionicons name="person-add-outline" size={20} color="#4C7B4B" />
                            <Text style={styles.assignButtonText}>Assigner à un bénéficiaire</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                        <Ionicons name="share-outline" size={20} color="#fff" />
                        <Text style={styles.shareButtonText}>Partager le code</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Beneficiary Selector Modal */}
            {showBeneficiarySelector && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Choisir un bénéficiaire</Text>
                            <TouchableOpacity
                                onPress={() => setShowBeneficiarySelector(false)}
                                disabled={isAssigning}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.beneficiaryList}>
                            {activeBeneficiaries.length === 0 ? (
                                <Text style={styles.noBeneficiaries}>
                                    Aucun bénéficiaire actif
                                </Text>
                            ) : (
                                activeBeneficiaries.map((beneficiary) => (
                                    <TouchableOpacity
                                        key={beneficiary.id}
                                        style={styles.beneficiaryItem}
                                        onPress={() => handleAssignBeneficiary(beneficiary)}
                                        disabled={isAssigning}
                                    >
                                        <View style={styles.beneficiaryInitials}>
                                            <Text style={styles.initialsText}>{beneficiary.initials}</Text>
                                        </View>
                                        <View style={styles.beneficiaryInfo}>
                                            <Text style={styles.beneficiaryRef}>{beneficiary.internal_ref}</Text>
                                            <Text style={styles.beneficiaryFamily}>
                                                {beneficiary.family_size} personne(s)
                                            </Text>
                                        </View>
                                        {isAssigning ? (
                                            <ActivityIndicator size="small" color="#4C7B4B" />
                                        ) : (
                                            <Ionicons name="chevron-forward" size={20} color="#CCC" />
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        alignItems: 'center',
    },
    successIcon: {
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    qrCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 20,
    },
    qrLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    qrContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
    },
    codeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4C7B4B',
        letterSpacing: 4,
    },
    assignedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4C7B4B15',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 16,
        gap: 8,
    },
    assignedText: {
        fontSize: 14,
        color: '#4C7B4B',
        fontWeight: '500',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    infoText: {
        fontSize: 15,
        color: '#1A1A1A',
        flex: 1,
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    assignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#4C7B4B',
        gap: 8,
    },
    assignButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4C7B4B',
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4C7B4B',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 14,
        gap: 8,
        shadowColor: '#4C7B4B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    // Modal styles
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    beneficiaryList: {
        padding: 16,
    },
    noBeneficiaries: {
        textAlign: 'center',
        color: '#666',
        paddingVertical: 40,
    },
    beneficiaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 8,
    },
    beneficiaryInitials: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#4C7B4B15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    beneficiaryInfo: {
        flex: 1,
        marginLeft: 12,
    },
    beneficiaryRef: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    beneficiaryFamily: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
});
