import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

interface Transaction {
    id: string;
    amount_cents: number;
    type: string;
    status: string;
    description: string;
    created_at: string;
}

interface BankDetails {
    iban: string;
    bic: string;
    account_holder: string;
}

export default function WalletScreen() {
    const router = useRouter();
    const { token, user } = useAuthStore();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showIbanModal, setShowIbanModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [savedBankDetails, setSavedBankDetails] = useState<BankDetails | null>(null);

    // Bank Details Form
    const [iban, setIban] = useState('');
    const [bic, setBic] = useState('');
    const [accountHolder, setAccountHolder] = useState('');

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            const response = await axios.get(`${API_URL}/wallet`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBalance(response.data.balance_cents || 0);
            setTransactions(response.data.transactions || []);
            if (response.data.bank_details) {
                setSavedBankDetails(response.data.bank_details);
                setIban(response.data.bank_details.iban || '');
                setBic(response.data.bank_details.bic || '');
                setAccountHolder(response.data.bank_details.account_holder || '');
            }
        } catch (error) {
            console.error('Error fetching wallet:', error);
            // Mock data for dev
            setBalance(8920);
            setTransactions([
                { id: '1', amount_cents: 399, type: 'sale', status: 'completed', description: 'Panier Surprise vendu', created_at: new Date().toISOString() },
                { id: '2', amount_cents: 499, type: 'sale', status: 'completed', description: 'Panier Fruits vendu', created_at: new Date().toISOString() },
                { id: '3', amount_cents: -5000, type: 'withdrawal', status: 'completed', description: 'Virement bancaire', created_at: new Date().toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const formatIban = (value: string) => {
        // Remove spaces and format
        const cleaned = value.replace(/\s/g, '').toUpperCase();
        return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    };

    const handleIbanChange = (text: string) => {
        const formatted = formatIban(text);
        setIban(formatted);
    };

    const validateIban = (ibanValue: string) => {
        const cleaned = ibanValue.replace(/\s/g, '');
        // Basic IBAN validation (length and starts with 2 letters)
        if (cleaned.length < 15 || cleaned.length > 34) return false;
        if (!/^[A-Z]{2}/.test(cleaned)) return false;
        return true;
    };

    const handleSaveBankDetails = async () => {
        const cleanedIban = iban.replace(/\s/g, '');

        if (!accountHolder.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer le nom du titulaire du compte');
            return;
        }

        if (!validateIban(cleanedIban)) {
            Alert.alert('Erreur', 'L\'IBAN saisi n\'est pas valide');
            return;
        }

        if (!bic.trim() || bic.length < 8) {
            Alert.alert('Erreur', 'Veuillez entrer un BIC valide (8-11 caractères)');
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(
                `${API_URL}/wallet/bank-details`,
                {
                    iban: cleanedIban,
                    bic: bic.toUpperCase(),
                    account_holder: accountHolder.trim(),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSavedBankDetails({
                iban: cleanedIban,
                bic: bic.toUpperCase(),
                account_holder: accountHolder.trim(),
            });

            Alert.alert('Succès', 'Vos coordonnées bancaires ont été enregistrées');
            setShowIbanModal(false);
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors de l\'enregistrement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = async () => {
        if (!savedBankDetails) {
            Alert.alert('Coordonnées manquantes', 'Veuillez d\'abord enregistrer vos coordonnées bancaires');
            setShowWithdrawModal(false);
            setShowIbanModal(true);
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(
                `${API_URL}/wallet/withdraw`,
                { amount_cents: balance },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert('Succès', 'Votre demande de retrait a été enregistrée. Le virement sera effectué sous 2-3 jours ouvrés.');
            setShowWithdrawModal(false);
            fetchWalletData();
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors du retrait');
        } finally {
            setSubmitting(false);
        }
    };

    const maskIban = (ibanValue: string) => {
        if (!ibanValue) return '';
        const cleaned = ibanValue.replace(/\s/g, '');
        if (cleaned.length <= 8) return formatIban(cleaned);
        const start = cleaned.slice(0, 4);
        const end = cleaned.slice(-4);
        return `${start} •••• •••• ${end}`;
    };

    const renderTransaction = ({ item }: { item: Transaction }) => (
        <View style={styles.transactionItem}>
            <View style={[styles.transactionIcon, { backgroundColor: item.amount_cents > 0 ? '#e8f5e9' : '#ffebee' }]}>
                <Ionicons
                    name={item.amount_cents > 0 ? "arrow-down" : "arrow-up"}
                    size={20}
                    color={item.amount_cents > 0 ? "#4C7B4B" : "#d32f2f"}
                />
            </View>
            <View style={styles.transactionInfo}>
                <Text style={styles.transactionDesc}>{item.description}</Text>
                <Text style={styles.transactionDate}>
                    {format(new Date(item.created_at), 'dd MMM yyyy', { locale: fr })}
                </Text>
            </View>
            <Text style={[
                styles.transactionAmount,
                { color: item.amount_cents > 0 ? "#4C7B4B" : "#d32f2f" }
            ]}>
                {item.amount_cents > 0 ? "+" : ""}{(item.amount_cents / 100).toFixed(2)}€
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4C7B4B" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Portefeuille" />

            <ScrollView style={styles.content}>
                {/* Balance Card */}
                <LinearGradient
                    colors={['#4C7B4B', '#2A4D29']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                >
                    <Text style={styles.balanceLabel}>Solde disponible</Text>
                    <Text style={styles.balanceAmount}>{(balance / 100).toFixed(2)}€</Text>

                    <TouchableOpacity
                        style={[styles.withdrawButton, balance < 1000 && styles.withdrawButtonDisabled]}
                        onPress={() => {
                            if (balance >= 1000) setShowWithdrawModal(true);
                            else Alert.alert('Solde insuffisant', 'Minimum de retrait : 10€ (1000 centimes)');
                        }}
                        disabled={balance < 1000}
                    >
                        <Ionicons name="arrow-up-circle" size={20} color="#fff" />
                        <Text style={styles.withdrawButtonText}>Retirer mes gains</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Bank Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Coordonnées bancaires</Text>

                    <TouchableOpacity
                        style={styles.bankCard}
                        onPress={() => setShowIbanModal(true)}
                    >
                        {savedBankDetails ? (
                            <>
                                <View style={styles.bankIconContainer}>
                                    <Ionicons name="card" size={24} color="#4C7B4B" />
                                </View>
                                <View style={styles.bankInfo}>
                                    <Text style={styles.bankHolder}>{savedBankDetails.account_holder}</Text>
                                    <Text style={styles.bankIban}>{maskIban(savedBankDetails.iban)}</Text>
                                </View>
                                <View style={styles.bankStatus}>
                                    <Ionicons name="checkmark-circle" size={20} color="#4C7B4B" />
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={[styles.bankIconContainer, { backgroundColor: '#f5f5f5' }]}>
                                    <Ionicons name="add" size={24} color="#999" />
                                </View>
                                <View style={styles.bankInfo}>
                                    <Text style={styles.addBankText}>Ajouter un compte bancaire</Text>
                                    <Text style={styles.addBankSubtext}>Pour recevoir vos paiements</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#ccc" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Transactions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Historique</Text>

                    {transactions.length > 0 ? (
                        <FlatList
                            data={transactions}
                            renderItem={renderTransaction}
                            keyExtractor={item => item.id}
                            scrollEnabled={false}
                        />
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>Aucune transaction</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* IBAN Modal */}
            <Modal
                visible={showIbanModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowIbanModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Coordonnées bancaires</Text>
                            <TouchableOpacity onPress={() => setShowIbanModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Entrez les informations de votre compte pour recevoir vos paiements
                        </Text>

                        <Text style={styles.inputLabel}>Titulaire du compte</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Jean Dupont"
                            placeholderTextColor="#999"
                            value={accountHolder}
                            onChangeText={setAccountHolder}
                        />

                        <Text style={styles.inputLabel}>IBAN</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="FR76 1234 5678 9012 3456 7890 123"
                            placeholderTextColor="#999"
                            value={iban}
                            onChangeText={handleIbanChange}
                            autoCapitalize="characters"
                            maxLength={42}
                        />

                        <Text style={styles.inputLabel}>BIC / SWIFT</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="BNPAFRPP"
                            placeholderTextColor="#999"
                            value={bic}
                            onChangeText={(text) => setBic(text.toUpperCase())}
                            autoCapitalize="characters"
                            maxLength={11}
                        />

                        <View style={styles.securityNote}>
                            <Ionicons name="shield-checkmark" size={16} color="#4C7B4B" />
                            <Text style={styles.securityText}>
                                Vos données bancaires sont chiffrées et sécurisées
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                            onPress={handleSaveBankDetails}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Enregistrer</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Withdraw Confirmation Modal */}
            <Modal
                visible={showWithdrawModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowWithdrawModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Confirmer le retrait</Text>
                            <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.withdrawSummary}>
                            <Text style={styles.withdrawLabel}>Montant à retirer</Text>
                            <Text style={styles.withdrawAmount}>{(balance / 100).toFixed(2)}€</Text>
                        </View>

                        {savedBankDetails && (
                            <View style={styles.withdrawBank}>
                                <Text style={styles.withdrawBankLabel}>Compte destinataire</Text>
                                <Text style={styles.withdrawBankValue}>{savedBankDetails.account_holder}</Text>
                                <Text style={styles.withdrawBankIban}>{maskIban(savedBankDetails.iban)}</Text>
                            </View>
                        )}

                        <Text style={styles.withdrawInfo}>
                            Le virement sera effectué sous 2-3 jours ouvrés.
                        </Text>

                        <TouchableOpacity
                            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                            onPress={handleWithdraw}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Confirmer le retrait</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // header, backButton, headerTitle removed
    content: {
        flex: 1,
    },
    balanceCard: {
        margin: 16,
        padding: 28,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#4C7B4B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    balanceLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    balanceAmount: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fff',
        marginVertical: 8,
    },
    withdrawButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 16,
        gap: 8,
    },
    withdrawButtonDisabled: {
        opacity: 0.5,
    },
    withdrawButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    bankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    bankIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    bankInfo: {
        flex: 1,
    },
    bankHolder: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    bankIban: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
        fontFamily: 'monospace',
    },
    bankStatus: {
        marginLeft: 8,
    },
    addBankText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    addBankSubtext: {
        fontSize: 13,
        color: '#999',
        marginTop: 2,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionDesc: {
        fontSize: 15,
        color: '#333',
    },
    transactionDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    emptyText: {
        color: '#666',
        marginTop: 16,
        fontSize: 15,
        textAlign: 'center',
    },
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
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        fontSize: 16,
        color: '#333',
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    securityText: {
        fontSize: 12,
        color: '#666',
    },
    submitButton: {
        backgroundColor: '#4C7B4B',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    withdrawSummary: {
        alignItems: 'center',
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: 16,
    },
    withdrawLabel: {
        fontSize: 14,
        color: '#666',
    },
    withdrawAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#4C7B4B',
        marginTop: 8,
    },
    withdrawBank: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    withdrawBankLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    withdrawBankValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    withdrawBankIban: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
        fontFamily: 'monospace',
    },
    withdrawInfo: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
    },
});
