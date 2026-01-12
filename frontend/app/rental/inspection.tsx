import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

export default function RentalInspectionScreen() {
    const router = useRouter();
    const { bookingId, type } = useLocalSearchParams<{ bookingId: string, type: 'in' | 'out' }>();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [uploading, setUploading] = useState(false);

    // Checklist state
    const [checklist, setChecklist] = useState({
        "Etat général": true,
        "Propreté": true,
        "Fonctionnement": true,
        "Accessoires": true
    });

    const handleTakePool = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Nous avons besoin de la caméra pour l\'état des lieux.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
        });

        if (!result.canceled) {
            uploadPhoto(result.assets[0].uri);
        }
    };

    const uploadPhoto = async (uri: string) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', {
            uri,
            name: 'inspection.jpg',
            type: 'image/jpeg',
        } as any);

        try {
            const response = await axios.post(`${API_URL}/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            // Append full URL if needed, or relative
            setPhotos([...photos, response.data.url]);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible d\'envoyer la photo');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (photos.length === 0) {
            Alert.alert('Photos requises', 'Veuillez prendre au moins une photo de l\'état de l\'objet.');
            return;
        }

        setLoading(true);
        try {
            await axios.post(
                `${API_URL}/rentals/${bookingId}/inspection/${type}`,
                {
                    id: `${bookingId}_${type}`, // Simple ID generation
                    rental_id: bookingId,
                    type,
                    photos,
                    checklist,
                    notes,
                    created_by: 'user' // Backend will override
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Alert.alert(
                'Succès',
                `État des lieux de ${type === 'in' ? 'sortie' : 'retour'} enregistré.`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert('Erreur', error.response?.data?.detail || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const toggleCheck = (key: keyof typeof checklist) => {
        setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title={type === 'in' ? "État des lieux - Entrée" : "État des lieux - Sortie"} />

            <ScrollView style={styles.content}>
                <View style={styles.instructionCard}>
                    <Ionicons name="camera" size={24} color="#4C7B4B" />
                    <Text style={styles.instructionText}>
                        Prenez des photos de l'objet sous tous les angles pour éviter tout litige.
                    </Text>
                </View>

                {/* Photos Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Photos ({photos.length})</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                        <TouchableOpacity style={styles.addPhotoButton} onPress={handleTakePool} disabled={uploading}>
                            {uploading ? (
                                <ActivityIndicator color="#4C7B4B" />
                            ) : (
                                <Ionicons name="add" size={32} color="#4C7B4B" />
                            )}
                        </TouchableOpacity>

                        {photos.map((photo, index) => (
                            <Image key={index} source={{ uri: photo.startsWith('http') ? photo : `${API_URL}${photo}` }} style={styles.photoThumb} />
                        ))}
                    </ScrollView>
                </View>

                {/* Checklist Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Vérifications Rapides</Text>
                    {Object.entries(checklist).map(([key, value]) => (
                        <TouchableOpacity
                            key={key}
                            style={styles.checkRow}
                            onPress={() => toggleCheck(key as any)}
                        >
                            <Text style={styles.checkLabel}>{key}</Text>
                            <Ionicons
                                name={value ? "checkbox" : "square-outline"}
                                size={24}
                                color={value ? "#4C7B4B" : "#ccc"}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Notes Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Remarques</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Rayures visibles, état de la batterie, etc."
                        multiline
                        numberOfLines={4}
                        value={notes}
                        onChangeText={setNotes}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitButtonText}>
                        {loading ? "Enregistrement..." : "Valider l'état des lieux"}
                    </Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { padding: 16 },
    instructionCard: {
        flexDirection: 'row',
        backgroundColor: '#e8f5e9',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    instructionText: { flex: 1, color: '#333', fontSize: 14 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 12 },
    photoList: { flexDirection: 'row' },
    addPhotoButton: {
        width: 100,
        height: 100,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4C7B4B',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginRight: 12,
    },
    photoThumb: {
        width: 100,
        height: 100,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: '#eee',
    },
    checkRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    checkLabel: { fontSize: 16, color: '#333' },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: '#4C7B4B',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: { opacity: 0.7 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
