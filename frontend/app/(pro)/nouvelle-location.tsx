
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

const CATEGORIES = ['Bricolage', 'Jardinage', 'Événementiel', 'Sport', 'Électronique', 'Mobilité', 'Autre'];

export default function NouvelleLocationProScreen() {
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [pricePerDay, setPricePerDay] = useState('');
    const [deposit, setDeposit] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Bricolage');
    const [condition, setCondition] = useState('good');
    const [photos, setPhotos] = useState<string[]>([]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setPhotos([...photos, base64]);
        }
    };

    const handlePublish = async () => {
        if (!title || !pricePerDay || photos.length === 0) {
            Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires (Titre, Prix/jour, Photo)');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                type: 'rent',
                title,
                description,
                photos,
                category,
                condition,
                price_per_day_cents: Math.round(parseFloat(pricePerDay) * 100),
                deposit_cents: deposit ? Math.round(parseFloat(deposit) * 100) : 0,
                location: { lat: 0, lng: 0 }, // Backend will use store location if linked
                radius_km: 0,
                allow_offers: false
            };

            await axios.post(`${API_URL}/items`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Succès', 'Location publiée !');
            router.back();
            router.replace('/(pro)/mes-locations'); // Force refresh
        } catch (error: any) {
            console.error(error);
            Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors de la publication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="Ajouter une location" />
            <ScrollView contentContainerStyle={styles.content}>

                {/* Photos */}
                <Text style={styles.label}>Photos *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                    {photos.map((p, i) => (
                        <Image key={i} source={{ uri: p }} style={styles.photoThumb} />
                    ))}
                    <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                        <Ionicons name="camera-outline" size={32} color="#4C7B4B" />
                        <Text style={styles.addPhotoText}>Ajouter</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Info */}
                <Text style={styles.label}>Titre *</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ex: Perceuse à percussion" />

                <View style={styles.rowInput}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Prix / jour (€) *</Text>
                        <TextInput style={styles.input} value={pricePerDay} onChangeText={setPricePerDay} keyboardType="numeric" placeholder="15" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Caution (€)</Text>
                        <TextInput style={styles.input} value={deposit} onChangeText={setDeposit} keyboardType="numeric" placeholder="150" />
                    </View>
                </View>

                <Text style={styles.label}>Catégorie</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {CATEGORIES.map(c => (
                        <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
                            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.label}>État</Text>
                <View style={styles.row}>
                    {[{ k: 'new', l: 'Neuf' }, { k: 'good', l: 'Bon état' }, { k: 'repair', l: 'Fonctionnel' }].map(c => (
                        <TouchableOpacity key={c.k} onPress={() => setCondition(c.k)} style={[styles.chip, condition === c.k && styles.chipActive]}>
                            <Text style={[styles.chipText, condition === c.k && styles.chipTextActive]}>{c.l}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Description</Text>
                <TextInput style={[styles.input, { height: 100 }]} value={description} onChangeText={setDescription} multiline placeholder="Description détaillée, accessoires inclus..." />

                <TouchableOpacity style={styles.submitBtn} onPress={handlePublish} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Publier la location</Text>}
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 16, paddingBottom: 40 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 16, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
    photoList: { flexDirection: 'row', marginBottom: 8 },
    photoThumb: { width: 80, height: 80, borderRadius: 8, marginRight: 8 },
    addPhotoBtn: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: '#4C7B4B', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e8f5e9' },
    addPhotoText: { color: '#4C7B4B', fontSize: 10, marginTop: 4 },
    row: { flexDirection: 'row', gap: 8 },
    rowInput: { flexDirection: 'row', gap: 16 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
    chipActive: { backgroundColor: '#4C7B4B' },
    chipText: { color: '#333' },
    chipTextActive: { color: '#fff', fontWeight: 'bold' },
    submitBtn: { backgroundColor: '#4C7B4B', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
    submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
