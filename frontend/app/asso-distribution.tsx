import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAssociationStore } from '../src/store/associationStore';
import { Beneficiary } from '../src/types';

export default function AssoDistributionScreen() {
    const router = useRouter();
    const {
        beneficiaries,
        fetchBeneficiaries,
        recordDistribution,
        isLoadingBeneficiaries
    } = useAssociationStore();

    const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchBeneficiaries();
    }, []);

    const activeBeneficiaries = beneficiaries.filter(b => b.is_active);

    const handleSubmit = async () => {
        setIsSubmitting(true);

        const result = await recordDistribution({
            beneficiary_id: selectedBeneficiary?.id,
            quantity,
            notes: selectedBeneficiary
                ? `Distribution à ${selectedBeneficiary.initials}`
                : 'Distribution anonyme'
        });

        setIsSubmitting(false);

        if (result) {
            Alert.alert(
                'Distribution enregistrée',
                `${quantity} panier(s) distribué(s)${selectedBeneficiary ? ` à ${selectedBeneficiary.initials}` : ''}.`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Enregistrer une distribution</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Quantity */}
                <Text style={styles.sectionTitle}>Quantité de paniers</Text>
                <View style={styles.quantityRow}>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                    >
                        <Ionicons name="remove" size={24} color={quantity <= 1 ? '#CCC' : '#4C7B4B'} />
                    </TouchableOpacity>
                    <View style={styles.quantityDisplay}>
                        <Text style={styles.quantityValue}>{quantity}</Text>
                        <Text style={styles.quantityLabel}>panier(s)</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => setQuantity(quantity + 1)}
                    >
                        <Ionicons name="add" size={24} color="#4C7B4B" />
                    </TouchableOpacity>
                </View>

                {/* Beneficiary Selection */}
                <Text style={styles.sectionTitle}>Bénéficiaire (optionnel)</Text>
                <Text style={styles.sectionSubtitle}>
                    Sélectionnez un bénéficiaire ou laissez vide pour une distribution anonyme
                </Text>

                {isLoadingBeneficiaries ? (
                    <ActivityIndicator size="large" color="#4C7B4B" style={styles.loader} />
                ) : (
                    <View style={styles.beneficiaryList}>
                        {/* Anonymous option */}
                        <TouchableOpacity
                            style={[
                                styles.beneficiaryOption,
                                !selectedBeneficiary && styles.beneficiaryOptionSelected
                            ]}
                            onPress={() => setSelectedBeneficiary(null)}
                        >
                            <View style={styles.anonymousIcon}>
                                <Ionicons name="eye-off" size={20} color="#666" />
                            </View>
                            <Text style={styles.anonymousText}>Distribution anonyme</Text>
                            {!selectedBeneficiary && (
                                <Ionicons name="checkmark-circle" size={24} color="#4C7B4B" />
                            )}
                        </TouchableOpacity>

                        {activeBeneficiaries.map((beneficiary) => (
                            <TouchableOpacity
                                key={beneficiary.id}
                                style={[
                                    styles.beneficiaryOption,
                                    selectedBeneficiary?.id === beneficiary.id && styles.beneficiaryOptionSelected
                                ]}
                                onPress={() => setSelectedBeneficiary(beneficiary)}
                            >
                                <View style={styles.initialsCircle}>
                                    <Text style={styles.initialsText}>{beneficiary.initials}</Text>
                                </View>
                                <View style={styles.beneficiaryInfo}>
                                    <Text style={styles.refText}>{beneficiary.internal_ref}</Text>
                                    <Text style={styles.statsText}>
                                        {beneficiary.total_baskets} paniers reçus • {beneficiary.family_size} pers.
                                    </Text>
                                </View>
                                {selectedBeneficiary?.id === beneficiary.id && (
                                    <Ionicons name="checkmark-circle" size={24} color="#4C7B4B" />
                                )}
                            </TouchableOpacity>
                        ))}

                        {activeBeneficiaries.length === 0 && (
                            <View style={styles.emptyBeneficiaries}>
                                <Text style={styles.emptyText}>
                                    Aucun bénéficiaire enregistré. Vous pouvez en ajouter depuis l'onglet Bénéficiaires.
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="gift" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>
                                Enregistrer la distribution
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    loader: {
        marginVertical: 40,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 16,
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    quantityButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityDisplay: {
        alignItems: 'center',
        marginHorizontal: 40,
    },
    quantityValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    quantityLabel: {
        fontSize: 14,
        color: '#666',
    },
    beneficiaryList: {
        gap: 8,
    },
    beneficiaryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    beneficiaryOptionSelected: {
        borderColor: '#4C7B4B',
        backgroundColor: '#4C7B4B08',
    },
    anonymousIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    anonymousText: {
        flex: 1,
        fontSize: 15,
        color: '#666',
    },
    initialsCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4C7B4B15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    initialsText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    beneficiaryInfo: {
        flex: 1,
    },
    refText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    statsText: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    emptyBeneficiaries: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4C7B4B',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
