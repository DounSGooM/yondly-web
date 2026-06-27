
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
    { id: 'boulangerie', label: 'Boulangerie', icon: 'cafe' },
    { id: 'fruits_legumes', label: 'Fruits & Légumes', icon: 'nutrition' },
    { id: 'epicerie', label: 'Épicerie', icon: 'basket' },
    { id: 'traiteur_froid', label: 'Traiteur', icon: 'restaurant' },
    { id: 'viande_poisson', label: 'Viande / Poisson', icon: 'fish' },
    { id: 'plats_prepares', label: 'Plats préparés', icon: 'fast-food' },
    { id: 'fleurs', label: 'Fleurs', icon: 'rose' },
    { id: 'autre', label: 'Autre', icon: 'cube' },
] as const;

const SIZES = [
    { id: 'small', label: 'Petit', icon: 'cafe-outline' },
    { id: 'medium', label: 'Moyen', icon: 'bag-outline' },
    { id: 'large', label: 'Grand', icon: 'basket-outline' },
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
    const [showDetails, setShowDetails] = useState(false);

    const [form, setForm] = useState({
        food_category: 'boulangerie',
        quantity_size: 'medium',
        pickup_start: '18:00',   // pré-rempli : 1 ajustement éventuel
        pickup_end: '19:30',
        original_price: '',
        deal_price: '',
        // Optionnels (carotte transparence)
        title: '',
        contents_description: '',
        kept_warm: false,
        is_mystery: false,
    });

    const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

    const isSensitive = SENSITIVE.has(form.food_category);
    const isTransparent = form.contents_description.trim().length >= 10 && !form.is_mystery;

    const handleSubmit = async () => {
        // Friction minimale : prix + fenêtre de retrait (catégorie & taille ont un défaut).
        if (!form.original_price || !form.deal_price || !form.pickup_end) {
            Alert.alert('Presque !', 'Indique les prix et l\'heure de fin de retrait.');
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
            Alert.alert('Erreur', "L'heure de fin doit être au format HH:MM (ex: 19:30)");
            return;
        }
        let pickupStart: Date | null = form.pickup_start ? parseTimeToToday(form.pickup_start) : null;
        if (form.pickup_start && !pickupStart) {
            Alert.alert('Erreur', "L'heure de début doit être au format HH:MM");
            return;
        }
        // Défaut : début = 1h avant la fin si non renseigné.
        if (!pickupStart) {
            pickupStart = new Date(pickupEnd.getTime() - 60 * 60 * 1000);
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/deals`, {
                title: form.title || null,
                description: form.contents_description || null,
                contents_description: form.contents_description || null,
                original_price: original,
                deal_price: deal,
                category: mapLegacyCategory(form.food_category),
                food_category: form.food_category,
                quantity_size: form.quantity_size,
                pickup_start: pickupStart.toISOString(),
                pickup_end: pickupEnd.toISOString(),
                kept_warm: form.kept_warm,
                is_mystery: form.is_mystery,
                expires_at: pickupEnd.toISOString(),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Publié ! 🎉', 'Votre panier anti-gaspi est en ligne.', [
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
                <Text style={styles.headerTitle}>Nouveau panier</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <Text style={styles.fastHint}>⚡️ 30 secondes : type, taille, horaire, prix. C'est tout.</Text>

                {/* 1. Catégorie */}
                <Text style={styles.label}>Type de produit</Text>
                <View style={styles.categoryWrap}>
                    {FOOD_CATEGORIES.map(cat => {
                        const active = form.food_category === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.categoryChip, active && styles.categoryChipActive]}
                                onPress={() => set({ food_category: cat.id })}
                            >
                                <Ionicons name={cat.icon as any} size={16} color={active ? '#fff' : '#666'} />
                                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{cat.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* 2. Taille */}
                <Text style={[styles.label, { marginTop: 20 }]}>Taille du panier</Text>
                <View style={styles.sizeRow}>
                    {SIZES.map(s => {
                        const active = form.quantity_size === s.id;
                        return (
                            <TouchableOpacity
                                key={s.id}
                                style={[styles.sizeChip, active && styles.sizeChipActive]}
                                onPress={() => set({ quantity_size: s.id })}
                            >
                                <Ionicons name={s.icon as any} size={22} color={active ? '#fff' : '#4C7B4B'} />
                                <Text style={[styles.sizeText, active && styles.sizeTextActive]}>{s.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* 3. Fenêtre de retrait */}
                <Text style={[styles.label, { marginTop: 20 }]}>Retrait aujourd'hui</Text>
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.subLabel}>De</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="18:00"
                            keyboardType="numbers-and-punctuation"
                            value={form.pickup_start}
                            onChangeText={t => set({ pickup_start: t })}
                            maxLength={5}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.subLabel}>À <Text style={styles.required}>*</Text></Text>
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

                {/* 4. Prix */}
                <View style={[styles.row, { marginTop: 20 }]}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.subLabel}>Prix d'origine (€) <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="15.00"
                            keyboardType="numeric"
                            value={form.original_price}
                            onChangeText={t => set({ original_price: t })}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.subLabel}>Prix anti-gaspi (€) <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="4.99"
                            keyboardType="numeric"
                            value={form.deal_price}
                            onChangeText={t => set({ deal_price: t })}
                        />
                    </View>
                </View>

                {/* Carotte transparence */}
                <TouchableOpacity
                    style={[styles.transparentCard, isTransparent && styles.transparentCardActive]}
                    onPress={() => setShowDetails(v => !v)}
                    activeOpacity={0.85}
                >
                    <Ionicons
                        name={isTransparent ? 'shield-checkmark' : 'add-circle-outline'}
                        size={22}
                        color={isTransparent ? '#2D7D46' : '#6B7280'}
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.transparentTitle}>
                            {isTransparent ? '✓ Panier transparent' : 'Décrire le contenu (optionnel)'}
                        </Text>
                        <Text style={styles.transparentSub}>
                            {isTransparent
                                ? 'Bravo ! Ton panier remonte en premier dans les résultats.'
                                : 'Les paniers décrits sont mis en avant et rassurent les clients.'}
                        </Text>
                    </View>
                    <Ionicons name={showDetails ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
                </TouchableOpacity>

                {showDetails && (
                    <View style={styles.detailsBox}>
                        <Text style={styles.subLabel}>Titre (optionnel)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Panier du soir"
                            value={form.title}
                            onChangeText={t => set({ title: t })}
                        />

                        <Text style={[styles.subLabel, { marginTop: 14 }]}>Contenu du panier</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={isSensitive
                                ? 'Ex: 1 part de lasagnes, 1 quiche lorraine'
                                : 'Ex: 3 pains au chocolat, 2 baguettes, 4 viennoiseries'}
                            value={form.contents_description}
                            onChangeText={t => set({ contents_description: t })}
                            multiline
                            textAlignVertical="top"
                        />

                        {isSensitive && (
                            <View style={styles.sensitiveHint}>
                                <Ionicons name="information-circle" size={15} color="#D97706" />
                                <Text style={styles.sensitiveHintText}>
                                    Produit sensible : indique le contenu et garde une fenêtre de retrait courte.
                                </Text>
                            </View>
                        )}

                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Panier surprise</Text>
                            <Switch
                                value={form.is_mystery}
                                onValueChange={v => set({ is_mystery: v })}
                                trackColor={{ true: '#2D7D46' }}
                            />
                        </View>

                        {(form.food_category === 'plats_prepares' || isSensitive) && (
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>Maintenu au chaud</Text>
                                <Switch
                                    value={form.kept_warm}
                                    onValueChange={v => set({ kept_warm: v })}
                                    trackColor={{ true: '#2D7D46' }}
                                />
                            </View>
                        )}
                    </View>
                )}

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
                        <Text style={styles.submitButtonText}>Publier le panier</Text>
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
    fastHint: { fontSize: 13, color: '#2D7D46', backgroundColor: '#E8F5EC', borderRadius: 10, padding: 12, marginBottom: 20, fontWeight: '600' },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
    subLabel: { fontSize: 13, fontWeight: '500', color: '#555', marginBottom: 6 },
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
    textArea: { height: 80, paddingTop: 12 },
    row: { flexDirection: 'row' },
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
    sizeRow: { flexDirection: 'row', gap: 10 },
    sizeChip: {
        flex: 1,
        alignItems: 'center',
        gap: 5,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#f5f5f5',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    sizeChipActive: { backgroundColor: '#4C7B4B', borderColor: '#4C7B4B' },
    sizeText: { fontSize: 13, fontWeight: '600', color: '#4C7B4B' },
    sizeTextActive: { color: '#fff' },
    transparentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 24,
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#EEE',
    },
    transparentCardActive: { backgroundColor: '#E8F5EC', borderColor: '#A7D7B5' },
    transparentTitle: { fontSize: 14.5, fontWeight: '600', color: '#333' },
    transparentSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    detailsBox: { marginTop: 12 },
    sensitiveHint: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: '#FFFBEB',
        borderRadius: 10,
        padding: 10,
        marginTop: 10,
        alignItems: 'flex-start',
    },
    sensitiveHintText: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 17 },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    toggleLabel: { fontSize: 14, fontWeight: '500', color: '#333' },
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
