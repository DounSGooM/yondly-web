import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { API_URL } from '../src/config/api';

interface LegalSection {
    title: string;
    text: string;
}

interface LegalTexts {
    version: string;
    platform_role: string;
    sections: LegalSection[];
    food_info?: { allergens: string; date: string };
    retractation_text: string;
    show_perishable_warning?: boolean;
    requires_immediate_execution?: boolean;
    immediate_execution_checkbox?: string;
    loss_right_checkbox?: string;
    mediation_text: string;
    checkbox_text: string;
}

export default function CheckoutProScreen() {
    const router = useRouter();
    const { offerId, type, startAt, endAt } = useLocalSearchParams<{
        offerId: string;
        type: 'order' | 'rental';
        startAt?: string;
        endAt?: string;
    }>();
    const { token } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [legalTexts, setLegalTexts] = useState<LegalTexts | null>(null);
    const [offer, setOffer] = useState<any>(null);

    // Checkboxes
    const [mainAccepted, setMainAccepted] = useState(false);
    const [immediateExecution, setImmediateExecution] = useState(false);
    const [lossRightAcknowledged, setLossRightAcknowledged] = useState(false);

    useEffect(() => {
        loadLegalTexts();
    }, [offerId, type]);

    const loadLegalTexts = async () => {
        try {
            // Get legal texts
            let url = `${API_URL}/pro/checkout/${type}/${offerId}/legal-texts`;
            if (type === 'rental' && startAt && endAt) {
                url += `?start_at=${startAt}&end_at=${endAt}`;
            }

            const textsRes = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!textsRes.ok) {
                throw new Error('Failed to load legal texts');
            }

            const texts = await textsRes.json();
            setLegalTexts(texts);

            // Get offer details
            const offerRes = await fetch(`${API_URL}/pro/offers/${offerId}/details`);
            if (offerRes.ok) {
                const data = await offerRes.json();
                setOffer(data);
            }
        } catch (error: any) {
            console.error('Error loading legal texts:', error);
            Alert.alert('Erreur', 'Impossible de charger les informations légales');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        if (!mainAccepted) return false;

        if (type === 'rental' && legalTexts?.requires_immediate_execution) {
            // If rental starts within 14 days, must check immediate execution
            if (!immediateExecution) return false;
        }

        return true;
    };

    const handlePayment = async () => {
        if (!canProceed()) {
            Alert.alert('Attention', 'Veuillez accepter les conditions pour continuer.');
            return;
        }

        setProcessing(true);
        try {
            // Create legal acceptance log
            const logPayload = {
                context: type === 'order' ? 'CHECKOUT_ORDER' : 'CHECKOUT_RENTAL',
                version: legalTexts?.version || '2026-01-01.v1',
                ip: '', // Will be filled by server
                user_agent: '',
                payload_json: {
                    offer_id: offerId,
                    pro_id: offer?.pro?.pro_id,
                    total_price: offer?.offer?.price_cents,
                    no_delivery: true,
                    main_accepted: mainAccepted,
                    immediate_execution_requested: type === 'rental' ? immediateExecution : undefined,
                    loss_right_acknowledged: type === 'rental' ? lossRightAcknowledged : undefined,
                    is_food: offer?.specific_data?.is_food,
                    date_type: offer?.specific_data?.date_type,
                    perishable_warning_shown: legalTexts?.show_perishable_warning,
                },
            };

            await fetch(`${API_URL}/pro/legal-acceptance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(logPayload),
            });

            // Simulate payment (in production, this would initiate Stripe)
            await new Promise(resolve => setTimeout(resolve, 2000));

            Alert.alert(
                '✅ Paiement réussi !',
                type === 'order'
                    ? 'Votre commande est confirmée. Présentez-vous au point de retrait avec votre QR code.'
                    : 'Votre réservation est confirmée. Un contrat de location vous sera envoyé.',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)/profile') }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Le paiement a échoué');
        } finally {
            setProcessing(false);
        }
    };

    const openTransparency = () => {
        router.push('/transparency' as any);
    };

    const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4C7B4B" />
                <Text style={styles.loadingText}>Chargement des informations légales...</Text>
            </View>
        );
    }

    if (!legalTexts) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
                <Text style={styles.errorText}>Informations légales non disponibles</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Récap légal</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Platform Role Banner */}
                <View style={styles.platformBanner}>
                    <Ionicons name="information-circle" size={20} color="#3b82f6" />
                    <Text style={styles.platformText}>{legalTexts.platform_role}</Text>
                </View>

                {/* Seller/Lessor Info */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        {type === 'order' ? 'Vendeur' : 'Loueur'}
                    </Text>
                    {legalTexts.sections.map((section, index) => (
                        <View key={index} style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{section.title}</Text>
                            <Text style={styles.infoValue}>{section.text}</Text>
                        </View>
                    ))}
                </View>

                {/* Food Info (Anti-gaspi only) */}
                {legalTexts.food_info && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Informations denrées</Text>
                        <Text style={styles.infoText}>{legalTexts.food_info.allergens}</Text>
                        <Text style={styles.infoText}>{legalTexts.food_info.date}</Text>
                    </View>
                )}

                {/* Retractation Notice */}
                <View style={[styles.card, legalTexts.show_perishable_warning && styles.warningCard]}>
                    <View style={styles.cardHeader}>
                        <Ionicons
                            name={legalTexts.show_perishable_warning ? "warning" : "information-circle"}
                            size={20}
                            color={legalTexts.show_perishable_warning ? "#f59e0b" : "#3b82f6"}
                        />
                        <Text style={[styles.cardTitle, { marginBottom: 0, marginLeft: 8 }]}>
                            Droit de rétractation
                        </Text>
                    </View>
                    <Text style={styles.retractationText}>{legalTexts.retractation_text}</Text>
                </View>

                {/* Immediate Execution Checkboxes (Rental only) */}
                {type === 'rental' && legalTexts.requires_immediate_execution && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Exécution immédiate</Text>

                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setImmediateExecution(!immediateExecution)}
                        >
                            <View style={[styles.checkbox, immediateExecution && styles.checkboxChecked]}>
                                {immediateExecution && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <Text style={styles.checkboxText}>{legalTexts.immediate_execution_checkbox}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setLossRightAcknowledged(!lossRightAcknowledged)}
                        >
                            <View style={[styles.checkbox, lossRightAcknowledged && styles.checkboxChecked]}>
                                {lossRightAcknowledged && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <Text style={styles.checkboxText}>{legalTexts.loss_right_checkbox}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Mediation */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Médiation</Text>
                    <Text style={styles.mediationText}>{legalTexts.mediation_text}</Text>
                </View>

                {/* Transparency Link */}
                <TouchableOpacity style={styles.linkButton} onPress={openTransparency}>
                    <Ionicons name="eye" size={18} color="#4C7B4B" />
                    <Text style={styles.linkText}>Voir comment Yondly classe les offres</Text>
                </TouchableOpacity>

                {/* Usage Rules (Rental) */}
                {type === 'rental' && offer?.specific_data?.usage_rules && (
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => Alert.alert('Règles d\'usage', offer.specific_data.usage_rules)}
                    >
                        <Ionicons name="document-text" size={18} color="#4C7B4B" />
                        <Text style={styles.linkText}>Voir les règles d'usage</Text>
                    </TouchableOpacity>
                )}

                {/* Main Checkbox */}
                <View style={styles.mainCheckboxContainer}>
                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setMainAccepted(!mainAccepted)}
                    >
                        <View style={[styles.checkbox, styles.mainCheckbox, mainAccepted && styles.checkboxChecked]}>
                            {mainAccepted && <Ionicons name="checkmark" size={18} color="#fff" />}
                        </View>
                        <Text style={styles.mainCheckboxText}>{legalTexts.checkbox_text}</Text>
                    </TouchableOpacity>
                </View>

                {/* Version */}
                <Text style={styles.versionText}>Version : {legalTexts.version}</Text>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Total à payer</Text>
                    <Text style={styles.priceValue}>
                        {formatPrice(offer?.offer?.price_cents || 0)}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.payButton,
                        !canProceed() && styles.payButtonDisabled,
                        processing && styles.payButtonDisabled
                    ]}
                    onPress={handlePayment}
                    disabled={!canProceed() || processing}
                >
                    {processing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="lock-closed" size={20} color="#fff" />
                            <Text style={styles.payButtonText}>
                                Confirmer et payer
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
        color: '#ef4444',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 120,
    },
    platformBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#eff6ff',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        gap: 10,
    },
    platformText: {
        flex: 1,
        fontSize: 13,
        color: '#1e40af',
        lineHeight: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    warningCard: {
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fcd34d',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
    },
    infoRow: {
        marginBottom: 10,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        color: '#1f2937',
    },
    infoText: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 6,
    },
    retractationText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 22,
    },
    mediationText: {
        fontSize: 13,
        color: '#374151',
        lineHeight: 20,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#d1d5db',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainCheckbox: {
        width: 26,
        height: 26,
        borderRadius: 8,
    },
    checkboxChecked: {
        backgroundColor: '#4C7B4B',
        borderColor: '#4C7B4B',
    },
    checkboxText: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
        lineHeight: 20,
    },
    mainCheckboxContainer: {
        backgroundColor: '#f0fdf4',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#86efac',
    },
    mainCheckboxText: {
        flex: 1,
        fontSize: 14,
        color: '#166534',
        fontWeight: '600',
        lineHeight: 22,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        gap: 10,
    },
    linkText: {
        fontSize: 14,
        color: '#4C7B4B',
        fontWeight: '600',
    },
    versionText: {
        fontSize: 11,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    priceLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    priceValue: {
        fontSize: 22,
        fontWeight: '700',
        color: '#4C7B4B',
    },
    payButton: {
        flexDirection: 'row',
        backgroundColor: '#4C7B4B',
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    payButtonDisabled: {
        opacity: 0.5,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});
