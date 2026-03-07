import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAssociationStore } from '../src/store/associationStore';
import { Beneficiary, BeneficiaryUpdate } from '../src/types';

export default function AssoBeneficiaryDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { beneficiaries, distributions, updateBeneficiary, fetchDistributions } = useAssociationStore();

    const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<BeneficiaryUpdate>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const found = beneficiaries.find(b => b.id === id);
        if (found) {
            setBeneficiary(found);
            setEditedData({
                internal_ref: found.internal_ref,
                initials: found.initials,
                family_size: found.family_size,
                notes: found.notes,
            });
        }
        fetchDistributions(100);
    }, [id, beneficiaries]);

    const beneficiaryDistributions = distributions.filter(d => d.beneficiary_id === id);

    const handleSave = async () => {
        if (!beneficiary) return;
        setIsSubmitting(true);

        const success = await updateBeneficiary(beneficiary.id, editedData);

        setIsSubmitting(false);

        if (success) {
            setIsEditing(false);
            Alert.alert('Succès', 'Bénéficiaire mis à jour');
        }
    };

    if (!beneficiary) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#4C7B4B" style={styles.loader} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Détail bénéficiaire</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditing(!isEditing)}
                >
                    <Ionicons name={isEditing ? "close" : "create-outline"} size={24} color="#4C7B4B" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.initialsCircle}>
                        <Text style={styles.initialsText}>{beneficiary.initials}</Text>
                    </View>
                    <Text style={styles.refText}>{beneficiary.internal_ref}</Text>
                    {!beneficiary.is_active && (
                        <View style={styles.archivedBadge}>
                            <Text style={styles.archivedText}>Archivé</Text>
                        </View>
                    )}
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{beneficiary.total_baskets}</Text>
                        <Text style={styles.statLabel}>Paniers reçus</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{beneficiary.family_size}</Text>
                        <Text style={styles.statLabel}>Personnes</Text>
                    </View>
                </View>

                {/* Edit Form or Details */}
                {isEditing ? (
                    <View style={styles.editForm}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Référence</Text>
                            <TextInput
                                style={styles.input}
                                value={editedData.internal_ref}
                                onChangeText={(text) => setEditedData(prev => ({ ...prev, internal_ref: text }))}
                            />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Initiales</Text>
                            <TextInput
                                style={styles.input}
                                value={editedData.initials}
                                onChangeText={(text) => setEditedData(prev => ({ ...prev, initials: text }))}
                                maxLength={5}
                            />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Taille du foyer</Text>
                            <View style={styles.familySizeRow}>
                                {[1, 2, 3, 4, 5].map((size) => (
                                    <TouchableOpacity
                                        key={size}
                                        style={[
                                            styles.familySizeButton,
                                            editedData.family_size === size && styles.familySizeButtonActive
                                        ]}
                                        onPress={() => setEditedData(prev => ({ ...prev, family_size: size }))}
                                    >
                                        <Text style={[
                                            styles.familySizeText,
                                            editedData.family_size === size && styles.familySizeTextActive
                                        ]}>
                                            {size}+
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Notes</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editedData.notes || ''}
                                onChangeText={(text) => setEditedData(prev => ({ ...prev, notes: text }))}
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Enregistrer</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Info Cards */}
                        <View style={styles.infoSection}>
                            <Text style={styles.sectionTitle}>Informations</Text>
                            {beneficiary.notes && (
                                <View style={styles.infoCard}>
                                    <Ionicons name="document-text-outline" size={20} color="#666" />
                                    <Text style={styles.infoText}>{beneficiary.notes}</Text>
                                </View>
                            )}
                            <View style={styles.infoCard}>
                                <Ionicons name="calendar-outline" size={20} color="#666" />
                                <Text style={styles.infoText}>
                                    Inscrit le {new Date(beneficiary.created_at).toLocaleDateString('fr-FR')}
                                </Text>
                            </View>
                            {beneficiary.last_distribution && (
                                <View style={styles.infoCard}>
                                    <Ionicons name="gift-outline" size={20} color="#666" />
                                    <Text style={styles.infoText}>
                                        Dernière distribution : {new Date(beneficiary.last_distribution).toLocaleDateString('fr-FR')}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Distribution History */}
                        <View style={styles.historySection}>
                            <Text style={styles.sectionTitle}>Historique des distributions</Text>
                            {beneficiaryDistributions.length > 0 ? (
                                beneficiaryDistributions.map((dist) => (
                                    <View key={dist.id} style={styles.historyItem}>
                                        <View style={styles.historyIcon}>
                                            <Ionicons name="basket" size={18} color="#4C7B4B" />
                                        </View>
                                        <View style={styles.historyContent}>
                                            <Text style={styles.historyQuantity}>{dist.quantity} panier(s)</Text>
                                            <Text style={styles.historyDate}>
                                                {new Date(dist.distributed_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noHistoryText}>Aucune distribution enregistrée</Text>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
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
    editButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    profileCard: {
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingVertical: 32,
    },
    initialsCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4C7B4B15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    initialsText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    refText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    archivedBadge: {
        backgroundColor: '#FF3B3015',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
    },
    archivedText: {
        fontSize: 12,
        color: '#FF3B30',
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        marginVertical: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    infoSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1A1A1A',
    },
    historySection: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        gap: 12,
    },
    historyIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4C7B4B15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyContent: {
        flex: 1,
    },
    historyQuantity: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    historyDate: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    noHistoryText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        paddingVertical: 20,
    },
    // Edit form styles
    editForm: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    familySizeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    familySizeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    familySizeButtonActive: {
        backgroundColor: '#4C7B4B',
        borderColor: '#4C7B4B',
    },
    familySizeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    familySizeTextActive: {
        color: '#fff',
    },
    saveButton: {
        backgroundColor: '#4C7B4B',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
