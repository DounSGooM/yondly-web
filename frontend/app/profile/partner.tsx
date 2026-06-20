import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

// ─── Offres ──────────────────────────────────────────────────────────────────

const OFFERS = [
    {
        id: 'fondateur',
        label: 'Partenaire Fondateur',
        price: 49,
        highlight: true,
        badge: '🌟 Offre de lancement',
        color: '#4C7B4B',
        bg: '#e8f5e9',
        features: [
            'Badge "Partenaire Fondateur" exclusif',
            'Priorité d\'affichage dans les ventes cash',
            'Fiche partenaire complète (logo, horaires, promo)',
            'Présence sur la carte des partenaires locaux',
            'Reporting mensuel basique',
            'Tarif bloqué tant que vous restez abonné',
        ],
        note: 'Au lieu de 69 €/mois',
    },
    {
        id: 'coup_de_pouce',
        label: 'Coup de pouce local',
        price: 29,
        highlight: false,
        color: '#2563EB',
        bg: '#DBEAFE',
        features: [
            'Fiche partenaire dans Yondly',
            'Apparition ponctuelle lors des ventes cash',
            'Un code promo à proposer',
            'Statistiques basiques (affichages)',
        ],
        note: 'Idéal pour démarrer',
    },
    {
        id: 'reemploi',
        label: 'Partenaire Réemploi',
        price: 69,
        highlight: false,
        color: '#7C3AED',
        bg: '#EDE9FE',
        features: [
            'Priorité d\'affichage garantie',
            'Fiche détaillée + catégorie de commerce',
            'Badge "Partenaire Yondly du réemploi local"',
            'Code promo personnalisé',
            'Reporting mensuel détaillé',
            'Ciblage par zone (Grand Poitiers)',
        ],
        note: 'Notre offre principale',
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PartnerScreen() {
    const router = useRouter();
    const { user, token } = useAuthStore();
    const isPartner = user?.is_partner || false;
    const subscription = (user as any)?.partner_subscription;

    const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
    const [step, setStep] = useState<'offers' | 'form'>('offers');
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [promoCode, setPromoCode] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!businessName.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer le nom de votre commerce');
            return;
        }
        setLoading(true);
        try {
            await axios.post(
                `${API_URL}/partners/subscribe`,
                {
                    tier: selectedOffer,
                    business_name: businessName,
                    business_type: businessType,
                    promo_code: promoCode || undefined,
                    description: description || undefined,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert(
                '✅ Demande envoyée !',
                'Notre équipe vous contactera sous 24h pour finaliser votre abonnement et configurer votre fiche partenaire.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    // ── Partenaire existant ──
    if (isPartner) {
        const tier = subscription?.tier;
        const tierLabel = OFFERS.find(o => o.id === tier)?.label || 'Partenaire';
        const impressions = subscription?.stats?.impressions || 0;
        const clicks = subscription?.stats?.clicks || 0;
        const sales_supported = subscription?.stats?.sales_supported || 0;

        return (
            <View style={styles.container}>
                <ScreenHeader title="Espace Partenaire" />
                <ScrollView style={styles.content}>
                    <View style={styles.partnerCard}>
                        <View style={styles.partnerHeader}>
                            <View style={styles.partnerBadge}>
                                <Ionicons name="leaf" size={20} color="#4C7B4B" />
                                <Text style={styles.partnerBadgeText}>{tierLabel}</Text>
                            </View>
                            <Text style={styles.partnerName}>{user?.display_name}</Text>
                            <Text style={styles.partnerSub}>Partenaire local engagé Yondly</Text>
                        </View>

                        <View style={styles.statsRow}>
                            <StatBlock label="Affichages" value={impressions} icon="eye-outline" />
                            <StatBlock label="Clics fiche" value={clicks} icon="finger-print-outline" />
                            <StatBlock label="Ventes soutenues" value={sales_supported} icon="checkmark-circle-outline" />
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Votre visibilité</Text>

                    <View style={styles.infoCard}>
                        <Ionicons name="storefront-outline" size={20} color="#4C7B4B" />
                        <Text style={styles.infoText}>
                            Votre commerce apparaît lors des ventes en espèces validées par les habitants de votre zone.
                        </Text>
                    </View>

                    <Text style={styles.sectionTitle}>Actions</Text>

                    <TouchableOpacity
                        style={styles.actionRow}
                        onPress={() => router.push('/profile/store-settings' as any)}
                    >
                        <Ionicons name="create-outline" size={22} color="#4C7B4B" />
                        <Text style={styles.actionText}>Modifier ma fiche partenaire</Text>
                        <Ionicons name="chevron-forward" size={18} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionRow}
                        onPress={() => router.push('/(pro)/dashboard' as any)}
                    >
                        <Ionicons name="grid-outline" size={22} color="#4C7B4B" />
                        <Text style={styles.actionText}>Espace Pro (anti-gaspi, locations…)</Text>
                        <Ionicons name="chevron-forward" size={18} color="#ccc" />
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    // ── Formulaire ──
    if (step === 'form' && selectedOffer) {
        const offer = OFFERS.find(o => o.id === selectedOffer)!;
        return (
            <View style={styles.container}>
                <ScreenHeader title="Finaliser l'abonnement" />
                <ScrollView style={styles.content}>
                    <View style={[styles.selectedOfferBanner, { backgroundColor: offer.bg, borderColor: offer.color + '40' }]}>
                        <Text style={[styles.selectedOfferLabel, { color: offer.color }]}>{offer.label}</Text>
                        <Text style={[styles.selectedOfferPrice, { color: offer.color }]}>{offer.price} €<Text style={styles.selectedOfferPeriod}>/mois</Text></Text>
                    </View>

                    <Text style={styles.formLabel}>Nom de votre commerce *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Atelier Vélo 86"
                        value={businessName}
                        onChangeText={setBusinessName}
                    />

                    <Text style={styles.formLabel}>Type d'activité</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Réparation vélo, Épicerie vrac, Café…"
                        value={businessType}
                        onChangeText={setBusinessType}
                    />

                    <Text style={styles.formLabel}>Code promo à offrir (optionnel)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: YONDLY10 → -10% sur votre première visite"
                        value={promoCode}
                        onChangeText={setPromoCode}
                    />

                    <Text style={styles.formLabel}>Description courte (optionnel)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Ce que vous faites, votre engagement local…"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        maxLength={200}
                    />

                    <View style={styles.noteBox}>
                        <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
                        <Text style={styles.noteText}>
                            Notre équipe vous contactera sous 24h pour valider votre fiche et activer votre abonnement. Paiement par virement ou prélèvement mensuel.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.ctaButton, loading && { opacity: 0.7 }]}
                        onPress={handleSubscribe}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.ctaText}>Envoyer ma demande</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.backLink} onPress={() => setStep('offers')}>
                        <Text style={styles.backLinkText}>← Changer d'offre</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    // ── Page offres ──
    return (
        <View style={styles.container}>
            <ScreenHeader title="Devenir Partenaire local" />
            <ScrollView style={styles.content}>
                <View style={styles.hero}>
                    <Text style={styles.heroTitle}>Devenez un Partenaire local engagé Yondly</Text>
                    <Text style={styles.heroSub}>
                        Soyez visible auprès des habitants de votre zone au moment où ils participent au réemploi. Soutenez l'économie circulaire locale, et bénéficiez d'un outil de trafic vers votre commerce.
                    </Text>
                </View>

                {OFFERS.map((offer) => (
                    <TouchableOpacity
                        key={offer.id}
                        style={[
                            styles.offerCard,
                            offer.highlight && styles.offerCardHighlight,
                            selectedOffer === offer.id && { borderColor: offer.color, borderWidth: 2 },
                        ]}
                        onPress={() => setSelectedOffer(offer.id)}
                        activeOpacity={0.85}
                    >
                        {offer.highlight && (
                            <View style={[styles.offerBadge, { backgroundColor: offer.color }]}>
                                <Text style={styles.offerBadgeText}>{offer.badge}</Text>
                            </View>
                        )}
                        <View style={styles.offerHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.offerName, { color: offer.color }]}>{offer.label}</Text>
                                {offer.note && <Text style={styles.offerNote}>{offer.note}</Text>}
                            </View>
                            <View style={styles.offerPriceBlock}>
                                <Text style={[styles.offerPrice, { color: offer.color }]}>{offer.price} €</Text>
                                <Text style={styles.offerPeriod}>/mois</Text>
                            </View>
                        </View>
                        <View style={styles.offerFeatures}>
                            {offer.features.map((f, i) => (
                                <View key={i} style={styles.featureRow}>
                                    <Ionicons name="checkmark-circle" size={16} color={offer.color} />
                                    <Text style={styles.featureText}>{f}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={[
                            styles.selectButton,
                            { backgroundColor: selectedOffer === offer.id ? offer.color : offer.bg },
                        ]}>
                            <Text style={[
                                styles.selectButtonText,
                                { color: selectedOffer === offer.id ? '#fff' : offer.color },
                            ]}>
                                {selectedOffer === offer.id ? '✓ Sélectionné' : 'Choisir cette offre'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={styles.trustRow}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#4C7B4B" />
                    <Text style={styles.trustText}>Aucun engagement longue durée · Résiliable à tout moment</Text>
                </View>

                <TouchableOpacity
                    style={[styles.ctaButton, !selectedOffer && styles.ctaDisabled]}
                    disabled={!selectedOffer}
                    onPress={() => setStep('form')}
                >
                    <Text style={styles.ctaText}>Continuer →</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

function StatBlock({ label, value, icon }: { label: string; value: number; icon: any }) {
    return (
        <View style={styles.statBlock}>
            <Ionicons name={icon} size={20} color="#4C7B4B" />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    content: { flex: 1 },
    hero: { padding: 20, paddingBottom: 8 },
    heroTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 10, lineHeight: 30 },
    heroSub: { fontSize: 14, color: '#6b7280', lineHeight: 22 },
    offerCard: {
        margin: 16, marginBottom: 8, backgroundColor: '#fff',
        borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#e5e7eb',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    offerCardHighlight: {
        borderColor: '#4C7B4B', borderWidth: 2,
        shadowColor: '#4C7B4B', shadowOpacity: 0.15,
    },
    offerBadge: {
        alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, marginBottom: 12,
    },
    offerBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    offerHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    offerName: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
    offerNote: { fontSize: 12, color: '#9ca3af' },
    offerPriceBlock: { alignItems: 'flex-end' },
    offerPrice: { fontSize: 28, fontWeight: '900' },
    offerPeriod: { fontSize: 13, color: '#9ca3af', marginTop: -4 },
    offerFeatures: { marginBottom: 16, gap: 8 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    featureText: { fontSize: 13, color: '#374151', flex: 1, lineHeight: 18 },
    selectButton: {
        paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    },
    selectButtonText: { fontSize: 15, fontWeight: '700' },
    trustRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginHorizontal: 16, marginTop: 8, marginBottom: 16,
    },
    trustText: { fontSize: 12, color: '#6b7280' },
    ctaButton: {
        backgroundColor: '#4C7B4B', marginHorizontal: 16, marginBottom: 8,
        paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    },
    ctaDisabled: { backgroundColor: '#d1d5db' },
    ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    // Partner dashboard
    partnerCard: {
        margin: 16, backgroundColor: '#4C7B4B', borderRadius: 20, padding: 20,
    },
    partnerHeader: { marginBottom: 20 },
    partnerBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 12,
    },
    partnerBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    partnerName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
    partnerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
    statsRow: {
        flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 14, padding: 16, justifyContent: 'space-between',
    },
    statBlock: { alignItems: 'center', flex: 1, gap: 4 },
    statValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
    sectionTitle: {
        fontSize: 16, fontWeight: '700', color: '#1a1a1a',
        marginHorizontal: 16, marginTop: 20, marginBottom: 10,
    },
    infoCard: {
        flexDirection: 'row', gap: 10, backgroundColor: '#e8f5e9',
        marginHorizontal: 16, padding: 14, borderRadius: 12, alignItems: 'flex-start',
    },
    infoText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },
    actionRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
        padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
    },
    actionText: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
    // Form
    selectedOfferBanner: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        margin: 16, padding: 16, borderRadius: 14, borderWidth: 1,
    },
    selectedOfferLabel: { fontSize: 15, fontWeight: '700' },
    selectedOfferPrice: { fontSize: 24, fontWeight: '900' },
    selectedOfferPeriod: { fontSize: 13, fontWeight: '400' },
    formLabel: {
        fontSize: 13, fontWeight: '600', color: '#374151',
        marginHorizontal: 16, marginTop: 12, marginBottom: 6,
    },
    input: {
        backgroundColor: '#fff', marginHorizontal: 16, padding: 14,
        borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
        fontSize: 15, color: '#1a1a1a',
    },
    textArea: { minHeight: 90, textAlignVertical: 'top' },
    noteBox: {
        flexDirection: 'row', gap: 8, backgroundColor: '#EFF6FF',
        margin: 16, padding: 14, borderRadius: 12, alignItems: 'flex-start',
    },
    noteText: { flex: 1, fontSize: 13, color: '#1e40af', lineHeight: 20 },
    backLink: { alignItems: 'center', marginBottom: 24 },
    backLinkText: { fontSize: 14, color: '#6b7280' },
});
