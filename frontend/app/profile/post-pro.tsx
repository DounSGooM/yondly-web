
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
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import axios from 'axios';

import { API_URL } from '../../src/config/api';

const CATEGORIES = ['Food', 'Flowers', 'Other'];

export default function PostProDealScreen() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        original_price: '',
        deal_price: '',
        category: 'Food',
        expiry_time: ''
    });

    const categories = [
        { id: 'Food', label: 'Alimentaire', icon: 'nutrition' },
        { id: 'Flowers', label: 'Fleurs', icon: 'rose' },
        { id: 'Other', label: 'Autre', icon: 'cube' }
    ];

    const handleSubmit = async () => {
        if (!form.title || !form.description || !form.original_price || !form.deal_price || !form.expiry_time) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
            return;
        }

        const original = parseFloat(form.original_price.replace(',', '.'));
        const deal = parseFloat(form.deal_price.replace(',', '.'));

        if (isNaN(original) || isNaN(deal)) {
            Alert.alert('Erreur', 'Les prix doivent être des nombres valides');
            return;
        }

        if (deal >= original) {
            Alert.alert('Erreur', 'Le prix anti-gaspi doit être inférieur au prix d\'origine');
            return;
        }

        // Validate Time Format HH:MM
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(form.expiry_time)) {
            Alert.alert('Erreur', 'L\'heure de fin doit être au format HH:MM (ex: 19:30)');
            return;
        }

        const [hours, minutes] = form.expiry_time.split(':').map(Number);
        const expiryDate = new Date();
        expiryDate.setHours(hours, minutes, 0, 0);

        // If time is past, assume tomorrow
        if (expiryDate < new Date()) {
            expiryDate.setDate(expiryDate.getDate() + 1);
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/deals`, {
                title: form.title,
                description: form.description,
                original_price: original,
                deal_price: deal,
                category: form.category,
                expires_at: expiryDate.toISOString()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert(
                'Succès ! 🎉',
                'Votre panier anti-gaspi a été publié avec succès.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
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

                <View style={styles.section}>
                    <Text style={styles.label}>Titre du panier <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Panier Boulangerie Surprise"
                        value={form.title}
                        onChangeText={t => setForm({ ...form, title: t })}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Ex: 3 pains au chocolat, 2 baguettes tradition..."
                        value={form.description}
                        onChangeText={t => setForm({ ...form, description: t })}
                        multiline
                        textAlignVertical="top"
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
                            onChangeText={t => setForm({ ...form, original_price: t })}
                        />
                    </View>
                    <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Prix Anti-Gaspi (€) <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="4.99"
                            keyboardType="numeric"
                            value={form.deal_price}
                            onChangeText={t => setForm({ ...form, deal_price: t })}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Catégorie</Text>
                    <View style={styles.categoryRow}>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryChip,
                                    form.category === cat.id && styles.categoryChipActive
                                ]}
                                onPress={() => setForm({ ...form, category: cat.id })}
                            >
                                <Ionicons
                                    name={cat.icon as any}
                                    size={18}
                                    color={form.category === cat.id ? '#fff' : '#666'}
                                />
                                <Text style={[
                                    styles.categoryText,
                                    form.category === cat.id && styles.categoryTextActive
                                ]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.section}>
                        <Text style={styles.label}>Fin de l'offre (Heure) <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: 19:30"
                            keyboardType="numbers-and-punctuation"
                            value={form.expiry_time}
                            onChangeText={t => setForm({ ...form, expiry_time: t })}
                            maxLength={5}
                        />
                        <Text style={styles.helperText}>
                            L'heure à laquelle le client doit venir récupérer le panier au plus tard.
                        </Text>
                    </View>
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
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
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
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    required: {
        color: '#ff4444',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
    },
    categoryRow: {
        flexDirection: 'row',
        gap: 10,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        gap: 6,
    },
    categoryChipActive: {
        backgroundColor: '#4C7B4B',
    },
    categoryText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    categoryTextActive: {
        color: '#fff',
    },
    expiryRow: {
        flexDirection: 'row',
        gap: 12,
    },
    expiryChip: {
        width: 60,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    expiryChipActive: {
        backgroundColor: '#e8f5e9',
        borderColor: '#4C7B4B',
    },
    helperText: {
        fontSize: 12,
        color: '#666',
        marginTop: 6,
    },
    expiryTextActive: {
        color: '#4C7B4B',
    },
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
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
