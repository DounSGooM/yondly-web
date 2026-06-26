
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    Switch,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import axios from 'axios';

import { API_URL } from '../../src/config/api';

// Catégories alimentaires (alignées avec le backend antigaspi_quality.py)
const FOOD_CATEGORIES = [
    { id: 'boulangerie', label: 'Boulangerie', icon: 'cafe', sensitive: false },
    { id: 'fruits_legumes', label: 'Fruits & Légumes', icon: 'nutrition', sensitive: false },
    { id: 'epicerie', label: 'Épicerie', icon: 'basket', sensitive: false },
    { id: 'traiteur_froid', label: 'Traiteur froid', icon: 'restaurant', sensitive: false },
    { id: 'traiteur_chaud', label: 'Traiteur chaud', icon: 'flame', sensitive: true },
    { id: 'viande_poisson', label: 'Viande / Poisson', icon: 'fish', sensitive: true },
    { id: 'plats_prepares', label: 'Plats préparés', icon: 'fast-food', sensitive: true },
    { id: 'fleurs', label: 'Fleurs', icon: 'rose', sensitive: false },
    { id: 'autre', label: 'Autre', icon: 'cube', sensitive: false },
] as const;

const SENSITIVE = new Set(['traiteur_chaud', 'viande_poisson', 'plats_prepares']);

function mapLegacyCategory(foodCat: string): 'Food' | 'Flowers' | 'Other' {
    if (foodCat === 'fleurs') return 'Flowers';
    if (foodCat === 'autre') return 'Other';
    return 'Food';
}

function parseTimeToToday(hhmm: string): Date | null {
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hhmm)) return null;
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    if (d < new Date()) d.setDate(d.getDate() + 1);
    return d;
}

export default function PostProDealScreen() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        title: '',
        contents_description: '',
        quantity_info: '',
        original_price: '',
        deal_price: '',
        food_category: 'boulangerie',
        pickup_start: '',
        pickup_end: '',
        kept_warm: false,
        is_mystery: false,
    });

    const isSensitive = SENSITIVE.has(form.food_category);

    const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

    const handleSubmit = async () => {
        if (!form.title || !form.contents_description || !form.original_price || !form.deal_price || !form.pickup_end) {
            Alert.alert('Erreur', 'Merci de remplir le titre, le contenu, les prix et la fenêtre de retrait.');
            return;
        }

        const original = parseFloat(form.original_price.replace(',', '.'));
        const deal = parseFloat(form.deal_price.replace(',', '.'));
        if (isNaN(original) || isNaN(deal)) {
            Alert.alert('Erreur', 'Les prix doivent être des nombres valides');
            return;
        }
        if (deal >= original) {
            Alert.alert('Erreur', "Le prix anti-gaspi doit être inférieur au prix d'origine");
            return;
        }

        const pickupEnd = parseTimeToToday(form.pickup_end);
        if (!pickupEnd) {
            Alert.alert('Erreur', "L'heure de fin de retrait doit être au format HH:MM (ex: 19:30)");
            return;
        }
        let pickupStart: Date | null = null;
        if (form.pickup_start) {
            pickupStart = parseTimeToToday(form.pickup_start);
            if (!pickupStart) {
                Alert.alert('Erreur', "L'heure de début de retrait doit être au format HH:MM");
                return;
            }
        }

        // Garde-fous côté client (le backend revalide).
        if (isSensitive) {
            if (form.is_mystery) {
                Alert.alert('Non autorisé', 'Pas de panier mystère pour un produit sensible. Décris le contenu.');
                return;
            }
            if (form.contents_description.trim().length < 10) {
                Alert.alert('Détaille le contenu', 'Pour un produit sensible, décris précisément le contenu (plat, ingrédients principaux).');
                return;
            }
            if (!pickupStart) {
                Alert.alert('Fenêtre de retrait', 'Indique une heure de début de retrait pour un produit sensible.');
                return;
            }
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/deals`, {
                title: form.title,
                description: form.contents_description,
                contents_description: form.contents_description,
                quantity_info: form.quantity_info || null,
                original_price: original,
                deal_price: deal,
                category: mapLegacyCategory(form.food_category),
                food_category: form.food_category,
                pickup_start: pickupStart ? pickupStart.toISOString() : null,
                pickup_end: pickupEnd.toISOString(),
                kept_warm: form.kept_warm,
                is_mystery: form.is_mystery,
                expires_at: pickupEnd.toISOString(),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Succès ! 🎉', 'Votre panier anti-gaspi a été publié.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Post deal error:', error);
            const msg = error.response?.data?.detail || 'Erreur lors de la publication';
            Alert.alert('Erreur', typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Publier un Panier</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Bandeau qualité garantie */}
                <View style={styles.guaranteeBanner}>
                    <Ionicons name="shield-checkmark" size={18} color="#2D7D46" />
                    <Text style={styles.guaranteeText}>
                        Qualité garantie : décris précisément ce que contient le panier. La transparence
                        protège ta réputation et fidélise les clients.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Titre du panier <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Panier Boulangerie du soir"
                        value={form.title}
                        onChangeText={t => set({ title: t })}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Type de produit <Text style={styles.required}>*</Text></Text>
                    <View style={styles.categoryWrap}>
                        {FOOD_CATEGORIES.map(cat => {
                            const active = form.food_category === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                                    onPress={() => set({ food_category: cat.id, is_mystery: cat.sensitive ? false : form.is_mystery })}
                                >
                                    <Ionicons name={cat.icon as any} size={16} color={active ? '#fff' : '#666'} />
                                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{cat.label}</Text>
                                    {cat.sensitive && (
                                        <Ionicons name="warning" size={12} color={active ? '#fff' : '#D97706'} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {isSensitive && (
                    <View style={styles.sensitiveBanner}>
                        <Ionicons name="warning" size={18} color="#D97706" />
                        <Text style={styles.sensitiveText}>
                            Produit sensible : contenu détaillé obligatoire, pas de panier mystère, et fenêtre
                            de retrait courte (4h max). C'est là que la qualité se joue.
                        </Text>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.label}>
                        Contenu du panier <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder={isSensitive
                            ? 'Ex: 1 part de lasagnes bœuf, 1 quiche lorraine, 1 portion de riz cantonais'
                            : 'Ex: 3 pains au chocolat, 2 baguettes tradition, 4 viennoiseries'}
                        value={form.contents_description}
                        onChangeText={t => set({ contents_description: t })}
                        multiline
                        textAlignVertical="top"
                    />
                    <Text style={styles.helperText}>
                        Indique précisément les produits. C'est la base de la confiance.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Quantité approximative</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: environ 6 pièces / 1,5 kg / 2 portions"
                        value={form.quantity_info}
                        onChangeText={t => set({ quantity_info: t })}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Prix d'origine (€) <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="15.00"
                            keyboardType="numeric"
                            value={form.original_price}
                            onChangeText={t => set({ original_price: t })}
                        />
                    </View>
                    <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Prix Anti-Gaspi (€) <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="4.99"
                            keyboardType="numeric"
                            value={form.deal_price}
                            onChangeText={t => set({ deal_price: t })}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>
                            Début retrait {isSensitive && <Text style={styles.required}>*</Text>}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="18:00"
                            keyboardType="numbers-and-punctuation"
                            value={form.pickup_start}
                            onChangeText={t => set({ pickup_start: t })}
                            maxLength={5}
                        />
                    </View>
                    <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Fin retrait <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="19:30"
                            keyboardType="numbers-and-punctuation"
                            value={form.pickup_end}
                            onChangeText={t => set({ pickup_end: t })}
                            maxLength={5}
                        />
                    </View>
                </View>

                {/* Maintien au chaud */}
                {(form.food_category === 'traiteur_chaud' || form.food_category === 'plats_prepares') && (
                    <View style={styles.toggleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.toggleLabel}>Produit maintenu au chaud</Text>
                            <Text style={styles.helperText}>Informe le client si le plat a été gardé au chaud.</Text>
                        </View>
                        <Switch
                            value={form.kept_warm}
                            onValueChange={v => set({ kept_warm: v })}
                            trackColor={{ true: '#2D7D46' }}
                        />
                    </View>
                )}

                {/* Panier mystère (interdit si sensible) */}
                <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.toggleLabel}>Panier surprise</Text>
                        <Text style={styles.helperText}>
                            {isSensitive
                                ? 'Indisponible pour les produits sensibles.'
                                : 'Le contenu exact peut varier (autorisé hors produits sensibles).'}
                        </Text>
                    </View>
                    <Switch
                        value={form.is_mystery}
                        onValueChange={v => set({ is_mystery: v })}
                        disabled={isSensitive}
                        trackColor={{ true: '#2D7D46' }}
                    />
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Publier l'offre</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    content: { padding: 20, paddingBottom: 100 },
    guaranteeBanner: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: '#E8F5EC',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    guaranteeText: { flex: 1, fontSize: 12.5, color: '#1a5c30', lineHeight: 18 },
    sensitiveBanner: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    sensitiveText: { flex: 1, fontSize: 12.5, color: '#92400e', lineHeight: 18 },
    section: { marginBottom: 20 },
    row: { flexDirection: 'row', marginBottom: 0 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    required: { color: '#ff4444' },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: { height: 90, paddingTop: 12 },
    categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        gap: 5,
    },
    categoryChipActive: { backgroundColor: '#4C7B4B' },
    categoryText: { fontSize: 13, color: '#666', fontWeight: '500' },
    categoryTextActive: { color: '#fff' },
    helperText: { fontSize: 12, color: '#666', marginTop: 6 },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        backgroundColor: '#fafafa',
        borderRadius: 12,
        padding: 14,
    },
    toggleLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
    footer: {
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    submitButton: {
        backgroundColor: '#4C7B4B',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: { opacity: 0.7 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
