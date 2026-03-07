import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAssociationStore } from '../../src/store/associationStore';
import { Beneficiary, BeneficiaryCreate } from '../../src/types';

export default function AssoBeneficiariesScreen() {
    const router = useRouter();
    const {
        beneficiaries,
        isLoadingBeneficiaries,
        fetchBeneficiaries,
        addBeneficiary,
        archiveBeneficiary,
        error,
        clearError
    } = useAssociationStore();

    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newBeneficiary, setNewBeneficiary] = useState<BeneficiaryCreate>({
        internal_ref: '',
        initials: '',
        family_size: 1,
        notes: '',
        yondly_id: '',
        allow_self_service: false,
        self_service_quota: 3,
    });
    const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');

    useEffect(() => {
        fetchBeneficiaries();
    }, []);

    useEffect(() => {
        if (error) {
            Alert.alert('Erreur', error, [{ text: 'OK', onPress: clearError }]);
        }
    }, [error]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBeneficiaries();
        setRefreshing(false);
    };

    const filteredBeneficiaries = beneficiaries.filter(b => {
        if (filter === 'active') return b.is_active;
        if (filter === 'archived') return !b.is_active;
        return true;
    });

    const handleAddBeneficiary = async () => {
        if (!newBeneficiary.internal_ref || !newBeneficiary.initials) {
            Alert.alert('Erreur', 'Veuillez remplir la référence et les initiales');
            return;
        }

        const result = await addBeneficiary(newBeneficiary);
        if (result) {
            setShowAddModal(false);
            setNewBeneficiary({ internal_ref: '', initials: '', family_size: 1, notes: '', yondly_id: '', allow_self_service: false, self_service_quota: 3 });
            Alert.alert('Succès', 'Bénéficiaire ajouté avec succès');
        }
    };

    const handleArchive = (beneficiary: Beneficiary) => {
        Alert.alert(
            'Archiver le bénéficiaire ?',
            `${beneficiary.initials} (${beneficiary.internal_ref}) sera archivé mais non supprimé.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Archiver',
                    style: 'destructive',
                    onPress: () => archiveBeneficiary(beneficiary.id)
                }
            ]
        );
    };

    const renderBeneficiary = ({ item: beneficiary }: { item: Beneficiary }) => (
        <TouchableOpacity
            style={[styles.beneficiaryCard, !beneficiary.is_active && styles.archivedCard]}
            onPress={() => router.push(`/asso-beneficiary-detail?id=${beneficiary.id}`)}
        >
            <View style={styles.beneficiaryInfo}>
                <View style={styles.initialsCircle}>
                    <Text style={styles.initialsText}>{beneficiary.initials}</Text>
                </View>
                <View style={styles.beneficiaryDetails}>
                    <Text style={styles.refText}>{beneficiary.internal_ref}</Text>
                    <Text style={styles.familyText}>
                        <Ionicons name="people-outline" size={12} color="#666" /> {beneficiary.family_size} personne(s)
                    </Text>
                </View>
            </View>

            <View style={styles.beneficiaryStats}>
                <View style={styles.statBadge}>
                    <Text style={styles.statValue}>{beneficiary.total_baskets}</Text>
                    <Text style={styles.statLabel}>paniers</Text>
                </View>
                {!beneficiary.is_active && (
                    <View style={styles.archivedBadge}>
                        <Text style={styles.archivedText}>Archivé</Text>
                    </View>
                )}
            </View>

            {beneficiary.is_active && (
                <TouchableOpacity
                    style={styles.archiveButton}
                    onPress={() => handleArchive(beneficiary)}
                >
                    <Ionicons name="archive-outline" size={20} color="#999" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    if (isLoadingBeneficiaries && beneficiaries.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#4C7B4B" style={styles.loader} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Bénéficiaires</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View style={styles.filters}>
                {(['active', 'archived', 'all'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterChip, filter === f && styles.filterChipActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === 'active' ? 'Actifs' : f === 'archived' ? 'Archivés' : 'Tous'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredBeneficiaries}
                keyExtractor={(item) => item.id}
                renderItem={renderBeneficiary}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4C7B4B']} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyTitle}>Aucun bénéficiaire</Text>
                        <Text style={styles.emptyText}>
                            Ajoutez vos premiers bénéficiaires pour suivre les distributions.
                        </Text>
                    </View>
                }
            />

            {/* Add Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nouveau bénéficiaire</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* YND ID Input - for linking user account */}
                        <View style={styles.formGroup}>
                            <View style={styles.yondlyIdHeader}>
                                <Ionicons name="link-outline" size={16} color="#4C7B4B" />
                                <Text style={styles.label}>ID Yondly (optionnel)</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.yondlyIdInput]}
                                placeholder="Ex: YND-A7X3K9"
                                value={newBeneficiary.yondly_id}
                                onChangeText={(text) => setNewBeneficiary(prev => ({ ...prev, yondly_id: text.toUpperCase() }))}
                                autoCapitalize="characters"
                                maxLength={10}
                            />
                            <Text style={styles.yondlyIdHint}>
                                Si le bénéficiaire a un compte Yondly, entrez son ID pour lui envoyer des notifications.
                            </Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Référence interne *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: B-001"
                                value={newBeneficiary.internal_ref}
                                onChangeText={(text) => setNewBeneficiary(prev => ({ ...prev, internal_ref: text }))}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Initiales *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: J.D."
                                value={newBeneficiary.initials}
                                onChangeText={(text) => setNewBeneficiary(prev => ({ ...prev, initials: text }))}
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
                                            newBeneficiary.family_size === size && styles.familySizeButtonActive
                                        ]}
                                        onPress={() => setNewBeneficiary(prev => ({ ...prev, family_size: size }))}
                                    >
                                        <Text style={[
                                            styles.familySizeText,
                                            newBeneficiary.family_size === size && styles.familySizeTextActive
                                        ]}>
                                            {size}+
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Notes (optionnel)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Notes internes..."
                                value={newBeneficiary.notes}
                                onChangeText={(text) => setNewBeneficiary(prev => ({ ...prev, notes: text }))}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Self-Service Mode */}
                        <View style={styles.sectionDivider} />
                        <Text style={styles.sectionHeader}>Mode Autonomie</Text>

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.switchLabel}>Autoriser à récupérer seul</Text>
                                <Text style={styles.switchSubLabel}>
                                    Le bénéficiaire pourra réserver des paniers via l'appli sans passer par vous.
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.switch, newBeneficiary.allow_self_service && styles.switchActive]}
                                onPress={() => setNewBeneficiary(prev => ({ ...prev, allow_self_service: !prev.allow_self_service }))}
                            >
                                <View style={[styles.switchThumb, newBeneficiary.allow_self_service && styles.switchThumbActive]} />
                            </TouchableOpacity>
                        </View>

                        {newBeneficiary.allow_self_service && (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Quota hebdomadaire</Text>
                                <View style={styles.quotaRow}>
                                    <TouchableOpacity
                                        style={styles.quotaButton}
                                        onPress={() => setNewBeneficiary(prev => ({ ...prev, self_service_quota: Math.max(1, prev.self_service_quota - 1) }))}
                                    >
                                        <Ionicons name="remove" size={24} color="#4C7B4B" />
                                    </TouchableOpacity>

                                    <Text style={styles.quotaValue}>{newBeneficiary.self_service_quota} panier(s)</Text>

                                    <TouchableOpacity
                                        style={styles.quotaButton}
                                        onPress={() => setNewBeneficiary(prev => ({ ...prev, self_service_quota: Math.min(10, prev.self_service_quota + 1) }))}
                                    >
                                        <Ionicons name="add" size={24} color="#4C7B4B" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleAddBeneficiary}
                        >
                            <Text style={styles.submitButtonText}>Ajouter le bénéficiaire</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    addButton: {
        backgroundColor: '#4C7B4B',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filters: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
        backgroundColor: '#fff',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
    },
    filterChipActive: {
        backgroundColor: '#4C7B4B',
    },
    filterText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#fff',
    },
    list: {
        padding: 16,
    },
    beneficiaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    archivedCard: {
        opacity: 0.6,
    },
    beneficiaryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    initialsCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#4C7B4B15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    beneficiaryDetails: {},
    refText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    familyText: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    beneficiaryStats: {
        alignItems: 'flex-end',
        marginRight: 8,
    },
    statBadge: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4C7B4B',
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
    },
    archivedBadge: {
        backgroundColor: '#FF3B3015',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 4,
    },
    archivedText: {
        fontSize: 10,
        color: '#FF3B30',
        fontWeight: '500',
    },
    archiveButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
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
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1A1A1A',
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
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    familySizeButtonActive: {
        backgroundColor: '#4C7B4B',
    },
    familySizeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    familySizeTextActive: {
        color: '#fff',
    },
    submitButton: {
        backgroundColor: '#4C7B4B',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Yondly ID input styles
    yondlyIdHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    yondlyIdInput: {
        fontFamily: 'monospace',
        letterSpacing: 2,
        textTransform: 'uppercase',
        borderWidth: 2,
        borderColor: '#4C7B4B30',
        borderStyle: 'dashed',
    },
    yondlyIdHint: {
        fontSize: 11,
        color: '#666',
        marginTop: 6,
        fontStyle: 'italic',
    },
    // Self Service Styles
    sectionDivider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: 20,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 16,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    switchSubLabel: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },
    switch: {
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#E5E5E5',
        padding: 2,
    },
    switchActive: {
        backgroundColor: '#4C7B4B',
    },
    switchThumb: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    switchThumbActive: {
        transform: [{ translateX: 20 }],
    },
    quotaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 8,
    },
    quotaButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    quotaValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        minWidth: 100,
        textAlign: 'center',
    },
});
