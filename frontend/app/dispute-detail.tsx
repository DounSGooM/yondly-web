/**
 * Dispute Detail Screen
 * Full dispute management with tabs: Discussion, Evidence, Settlement Offers
 * Includes mediator escalation and disclaimer
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    RefreshControl,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

type TabId = 'discussion' | 'evidence' | 'offers';

interface SettlementOffer {
    id: string;
    type: string;
    amount_cents?: number;
    details_text: string;
    status: string;
    created_by_name: string;
    created_by_user_id: string;
    created_at: string;
}

interface Evidence {
    id: string;
    file_url: string;
    file_type: string;
    description: string;
    uploaded_by_name: string;
    created_at: string;
}

interface Dispute {
    id: string;
    reason: string;
    description: string;
    stage: string;
    status: string;
    transaction_type: string;
    transaction_id: string;
    messages: any[];
    created_at: string;
    mediation_dossier_url?: string;
}

export default function DisputeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<TabId>('discussion');
    const [dispute, setDispute] = useState<Dispute | null>(null);
    const [offers, setOffers] = useState<SettlementOffer[]>([]);
    const [evidence, setEvidence] = useState<Evidence[]>([]);
    const [canEscalate, setCanEscalate] = useState<{ can_escalate: boolean; days_remaining: number }>({ can_escalate: false, days_remaining: 14 });
    const [mediator, setMediator] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // New message/offer states
    const [newMessage, setNewMessage] = useState('');
    const [showNewOffer, setShowNewOffer] = useState(false);
    const [offerType, setOfferType] = useState('REFUND_PARTIAL');
    const [offerAmount, setOfferAmount] = useState('');
    const [offerDetails, setOfferDetails] = useState('');

    const getAuthHeaders = async () => {
        const token = await AsyncStorage.getItem('token');
        return { Authorization: `Bearer ${token}` };
    };

    const loadDispute = useCallback(async () => {
        if (!id) return;
        try {
            const headers = await getAuthHeaders();

            // Load dispute
            const disputeRes = await axios.get(`${API_URL}/pro/disputes/${id}`, { headers });
            setDispute(disputeRes.data);

            // Load settlement offers
            const offersRes = await axios.get(`${API_URL}/pro/disputes/${id}/settlement-offers`, { headers });
            setOffers(offersRes.data);

            // Load evidence
            const evidenceRes = await axios.get(`${API_URL}/pro/disputes/${id}/evidence`, { headers });
            setEvidence(evidenceRes.data);

            // Check escalation status
            const escalateRes = await axios.get(`${API_URL}/pro/disputes/${id}/can-escalate`, { headers });
            setCanEscalate(escalateRes.data);

            // Load mediator info
            if (disputeRes.data.transaction_type && disputeRes.data.transaction_id) {
                const mediatorRes = await axios.get(
                    `${API_URL}/pro/transactions/${disputeRes.data.transaction_type}/${disputeRes.data.transaction_id}/mediator`,
                    { headers }
                );
                setMediator(mediatorRes.data);
            }
        } catch (error) {
            console.error('Error loading dispute:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        loadDispute();
    }, [loadDispute]);

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            const headers = await getAuthHeaders();
            await axios.post(`${API_URL}/pro/disputes/${id}/message`, null, {
                headers,
                params: { content: newMessage }
            });
            setNewMessage('');
            loadDispute();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible d\'envoyer le message');
        }
    };

    const createOffer = async () => {
        if (!offerDetails.trim()) {
            Alert.alert('Erreur', 'Veuillez décrire votre proposition');
            return;
        }
        try {
            const headers = await getAuthHeaders();
            await axios.post(`${API_URL}/pro/disputes/${id}/settlement-offers`, null, {
                headers,
                params: {
                    offer_type: offerType,
                    details_text: offerDetails,
                    amount_cents: offerAmount ? parseInt(offerAmount) * 100 : null
                }
            });
            setShowNewOffer(false);
            setOfferDetails('');
            setOfferAmount('');
            loadDispute();
            Alert.alert('✅ Proposition envoyée', 'L\'autre partie va être notifiée');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de créer la proposition');
        }
    };

    const acceptOffer = async (offerId: string) => {
        Alert.alert(
            'Accepter cette proposition ?',
            'En acceptant, l\'action sera exécutée (remboursement, libération caution, etc.)',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Accepter',
                    onPress: async () => {
                        try {
                            const headers = await getAuthHeaders();
                            await axios.post(`${API_URL}/pro/disputes/${id}/settlement-offers/${offerId}/accept`, null, { headers });
                            loadDispute();
                            Alert.alert('✅ Accord accepté', 'Le litige est résolu');
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible d\'accepter la proposition');
                        }
                    }
                }
            ]
        );
    };

    const rejectOffer = async (offerId: string) => {
        try {
            const headers = await getAuthHeaders();
            await axios.post(`${API_URL}/pro/disputes/${id}/settlement-offers/${offerId}/reject`, null, { headers });
            loadDispute();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de refuser la proposition');
        }
    };

    const escalateToMediator = async () => {
        Alert.alert(
            'Passer au médiateur indépendant ?',
            'Un dossier sera généré avec toutes les informations du litige. Le médiateur pourra alors être saisi.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Escalader',
                    onPress: async () => {
                        try {
                            const headers = await getAuthHeaders();
                            const res = await axios.post(`${API_URL}/pro/disputes/${id}/escalate-mediator`, null, { headers });
                            loadDispute();
                            Alert.alert('📋 Dossier créé', 'Vous pouvez maintenant contacter le médiateur avec le dossier généré.');
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible d\'escalader vers le médiateur');
                        }
                    }
                }
            ]
        );
    };

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            {[
                { id: 'discussion', label: 'Discussion', icon: 'chatbubbles' },
                { id: 'evidence', label: 'Preuves', icon: 'document-attach' },
                { id: 'offers', label: 'Accords', icon: 'handshake' },
            ].map((tab) => (
                <TouchableOpacity
                    key={tab.id}
                    style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                    onPress={() => setActiveTab(tab.id as TabId)}
                >
                    <Ionicons
                        name={tab.icon as any}
                        size={20}
                        color={activeTab === tab.id ? '#22c55e' : '#94a3b8'}
                    />
                    <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderDiscussion = () => (
        <View style={styles.tabContent}>
            {dispute?.messages?.map((msg, i) => (
                <View key={i} style={styles.messageCard}>
                    <Text style={styles.messageMeta}>{msg.author_id?.substring(0, 8)}... • {new Date(msg.created_at).toLocaleString('fr-FR')}</Text>
                    <Text style={styles.messageContent}>{msg.content}</Text>
                </View>
            ))}
            {(!dispute?.messages || dispute.messages.length === 0) && (
                <Text style={styles.emptyText}>Aucun message pour le moment</Text>
            )}

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.messageInput}
                    placeholder="Votre message..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEvidence = () => (
        <View style={styles.tabContent}>
            {evidence.map((e) => (
                <View key={e.id} style={styles.evidenceCard}>
                    <Ionicons
                        name={e.file_type === 'IMAGE' ? 'image' : 'document'}
                        size={24}
                        color="#64748b"
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.evidenceTitle}>{e.description || 'Sans description'}</Text>
                        <Text style={styles.evidenceMeta}>Par {e.uploaded_by_name} • {new Date(e.created_at).toLocaleDateString('fr-FR')}</Text>
                    </View>
                </View>
            ))}
            {evidence.length === 0 && (
                <Text style={styles.emptyText}>Aucune preuve ajoutée</Text>
            )}

            <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={20} color="#22c55e" />
                <Text style={styles.addButtonText}>Ajouter une preuve</Text>
            </TouchableOpacity>
        </View>
    );

    const renderOffers = () => (
        <View style={styles.tabContent}>
            {offers.map((offer) => (
                <View key={offer.id} style={[styles.offerCard, offer.status === 'ACCEPTED' && styles.offerAccepted]}>
                    <View style={styles.offerHeader}>
                        <Text style={styles.offerType}>{offer.type.replace(/_/g, ' ')}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: offer.status === 'ACCEPTED' ? '#22c55e' : offer.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }]}>
                            <Text style={styles.statusText}>{offer.status}</Text>
                        </View>
                    </View>
                    {offer.amount_cents && (
                        <Text style={styles.offerAmount}>{(offer.amount_cents / 100).toFixed(2)}€</Text>
                    )}
                    <Text style={styles.offerDetails}>{offer.details_text}</Text>
                    <Text style={styles.offerMeta}>Par {offer.created_by_name} • {new Date(offer.created_at).toLocaleDateString('fr-FR')}</Text>

                    {offer.status === 'PROPOSED' && (
                        <View style={styles.offerActions}>
                            <TouchableOpacity style={styles.acceptButton} onPress={() => acceptOffer(offer.id)}>
                                <Text style={styles.acceptButtonText}>✓ Accepter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.rejectButton} onPress={() => rejectOffer(offer.id)}>
                                <Text style={styles.rejectButtonText}>✕ Refuser</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            ))}

            {offers.length === 0 && (
                <Text style={styles.emptyText}>Aucune proposition d'accord</Text>
            )}

            <TouchableOpacity style={styles.addButton} onPress={() => setShowNewOffer(true)}>
                <Ionicons name="add" size={20} color="#22c55e" />
                <Text style={styles.addButtonText}>Proposer un accord</Text>
            </TouchableOpacity>

            {showNewOffer && (
                <View style={styles.newOfferForm}>
                    <Text style={styles.formLabel}>Type de proposition</Text>
                    <View style={styles.offerTypeGrid}>
                        {['REFUND_FULL', 'REFUND_PARTIAL', 'DEPOSIT_RELEASE', 'DEPOSIT_CAPTURE', 'OTHER'].map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.offerTypeBtn, offerType === type && styles.offerTypeBtnActive]}
                                onPress={() => setOfferType(type)}
                            >
                                <Text style={[styles.offerTypeBtnText, offerType === type && styles.offerTypeBtnTextActive]}>
                                    {type.replace(/_/g, ' ')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {(offerType === 'REFUND_PARTIAL' || offerType === 'DEPOSIT_CAPTURE') && (
                        <>
                            <Text style={styles.formLabel}>Montant (€)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: 25"
                                value={offerAmount}
                                onChangeText={setOfferAmount}
                                keyboardType="numeric"
                            />
                        </>
                    )}

                    <Text style={styles.formLabel}>Description de la proposition</Text>
                    <TextInput
                        style={[styles.input, { minHeight: 80 }]}
                        placeholder="Décrivez votre proposition..."
                        value={offerDetails}
                        onChangeText={setOfferDetails}
                        multiline
                    />

                    <View style={styles.formActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewOffer(false)}>
                            <Text style={styles.cancelBtnText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitBtn} onPress={createOffer}>
                            <Text style={styles.submitBtnText}>Envoyer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: 'Litige',
                    headerBackTitle: 'Retour',
                }}
            />

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDispute(); }} />}
            >
                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                    <Ionicons name="information-circle" size={20} color="#f59e0b" />
                    <Text style={styles.disclaimerText}>
                        Yondly facilite la résolution amiable mais n'est pas médiateur.
                        En cas de désaccord persistant, vous pouvez saisir un médiateur indépendant.
                    </Text>
                </View>

                {/* Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Statut</Text>
                        <View style={[styles.stageBadge, { backgroundColor: dispute?.stage === 'RESOLVED' ? '#22c55e' : dispute?.stage === 'ESCALATED_TO_MEDIATOR' ? '#3b82f6' : '#f59e0b' }]}>
                            <Text style={styles.stageText}>{dispute?.stage?.replace(/_/g, ' ')}</Text>
                        </View>
                    </View>
                    <Text style={styles.disputeReason}>{dispute?.reason}</Text>
                    <Text style={styles.disputeDescription}>{dispute?.description}</Text>
                </View>

                {/* Mediator Info */}
                {mediator && (
                    <View style={styles.mediatorCard}>
                        <Text style={styles.mediatorTitle}>Médiateur désigné</Text>
                        <Text style={styles.mediatorName}>{mediator.mediator_name}</Text>
                        <Text style={styles.mediatorContact}>{mediator.mediator_url}</Text>
                        <Text style={styles.mediatorContact}>{mediator.mediator_contact}</Text>
                    </View>
                )}

                {/* Escalation Button */}
                {dispute?.stage !== 'RESOLVED' && dispute?.stage !== 'ESCALATED_TO_MEDIATOR' && (
                    <TouchableOpacity
                        style={[styles.escalateButton, !canEscalate.can_escalate && styles.escalateButtonDisabled]}
                        onPress={escalateToMediator}
                        disabled={!canEscalate.can_escalate}
                    >
                        <Ionicons name="arrow-up-circle" size={20} color="#fff" />
                        <Text style={styles.escalateButtonText}>
                            {canEscalate.can_escalate
                                ? 'Passer au médiateur indépendant'
                                : `Escalade possible dans ${canEscalate.days_remaining} jours`}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Dossier Link */}
                {dispute?.mediation_dossier_url && (
                    <View style={styles.dossierCard}>
                        <Ionicons name="document-text" size={24} color="#3b82f6" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.dossierTitle}>Dossier de médiation</Text>
                            <Text style={styles.dossierUrl}>{dispute.mediation_dossier_url}</Text>
                        </View>
                    </View>
                )}

                {/* Tabs */}
                {renderTabs()}

                {/* Tab Content */}
                {activeTab === 'discussion' && renderDiscussion()}
                {activeTab === 'evidence' && renderEvidence()}
                {activeTab === 'offers' && renderOffers()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    disclaimer: {
        flexDirection: 'row',
        backgroundColor: '#fef3c7',
        padding: 12,
        margin: 16,
        borderRadius: 12,
        gap: 10,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 12,
        color: '#92400e',
        lineHeight: 18,
    },
    statusCard: {
        backgroundColor: '#fff',
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusLabel: {
        fontSize: 12,
        color: '#64748b',
        textTransform: 'uppercase',
    },
    stageBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    stageText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
    disputeReason: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    disputeDescription: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    mediatorCard: {
        backgroundColor: '#eff6ff',
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    mediatorTitle: {
        fontSize: 12,
        color: '#3b82f6',
        fontWeight: '600',
        marginBottom: 8,
    },
    mediatorName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e40af',
    },
    mediatorContact: {
        fontSize: 13,
        color: '#3b82f6',
        marginTop: 2,
    },
    escalateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
        margin: 16,
        marginTop: 0,
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    escalateButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    escalateButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    dossierCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 16,
    },
    dossierTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e40af',
    },
    dossierUrl: {
        fontSize: 12,
        color: '#3b82f6',
        marginTop: 2,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 10,
        gap: 6,
    },
    tabActive: {
        backgroundColor: '#f0fdf4',
    },
    tabText: {
        fontSize: 13,
        color: '#64748b',
    },
    tabTextActive: {
        color: '#22c55e',
        fontWeight: '600',
    },
    tabContent: {
        padding: 16,
    },
    messageCard: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    messageMeta: {
        fontSize: 11,
        color: '#94a3b8',
        marginBottom: 4,
    },
    messageContent: {
        fontSize: 14,
        color: '#1e293b',
        lineHeight: 20,
    },
    inputRow: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    messageInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sendButton: {
        backgroundColor: '#22c55e',
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    evidenceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    evidenceTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1e293b',
    },
    evidenceMeta: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 14,
        paddingVertical: 20,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0fdf4',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#22c55e',
        borderStyle: 'dashed',
        marginTop: 12,
        gap: 8,
    },
    addButtonText: {
        color: '#22c55e',
        fontWeight: '600',
        fontSize: 14,
    },
    offerCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    offerAccepted: {
        borderColor: '#22c55e',
        backgroundColor: '#f0fdf4',
    },
    offerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    offerType: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
    },
    offerAmount: {
        fontSize: 22,
        fontWeight: '700',
        color: '#22c55e',
        marginBottom: 8,
    },
    offerDetails: {
        fontSize: 14,
        color: '#1e293b',
        marginBottom: 8,
        lineHeight: 20,
    },
    offerMeta: {
        fontSize: 11,
        color: '#94a3b8',
    },
    offerActions: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 12,
    },
    acceptButton: {
        flex: 1,
        backgroundColor: '#22c55e',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    rejectButton: {
        flex: 1,
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    rejectButtonText: {
        color: '#ef4444',
        fontWeight: '600',
    },
    newOfferForm: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginTop: 16,
    },
    formLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 12,
    },
    offerTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    offerTypeBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
    },
    offerTypeBtnActive: {
        backgroundColor: '#22c55e',
    },
    offerTypeBtnText: {
        fontSize: 11,
        color: '#64748b',
    },
    offerTypeBtnTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
    },
    formActions: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
    },
    cancelBtnText: {
        color: '#64748b',
        fontWeight: '600',
    },
    submitBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#22c55e',
    },
    submitBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
});
