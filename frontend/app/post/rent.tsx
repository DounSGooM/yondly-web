import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';

import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

const CATEGORIES = [
    'Bricolage',
    'Jardinage',
    'Maison',
    'High-Tech',
    'Sport',
    'Événementiel',
    'Autre'
];

type Condition = 'new' | 'good' | 'repair';

export default function PostRentItemScreen() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [pricePerDay, setPricePerDay] = useState('');
    const [deposit, setDeposit] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [condition, setCondition] = useState<Condition>('good');
    const [photos, setPhotos] = useState<string[]>([]);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [fetchingLocation, setFetchingLocation] = useState(false);

    const pickImage = async () => {
        try {
            if (Platform.OS !== 'web') {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permissionResult.granted) {
                    Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à vos photos');
                    return;
                }
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.2,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                setPhotos([...photos, `data:image/jpeg;base64,${result.assets[0].base64}`]);
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger l\'image');
        }
    };

    const takePhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à votre caméra');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.2,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                setPhotos([...photos, `data:image/jpeg;base64,${result.assets[0].base64}`]);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Erreur', 'Impossible de prendre la photo');
        }
    };

    const selectImageSource = () => {
        Alert.alert(
            'Ajouter une photo',
            'Choisissez une source',
            [
                { text: 'Appareil photo', onPress: takePhoto },
                { text: 'Galerie', onPress: pickImage },
                { text: 'Annuler', style: 'cancel' },
            ],
            { cancelable: true }
        );
    };

    const removePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const getLocation = async () => {
        try {
            setFetchingLocation(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à votre position');
                return;
            }

            const loc = await Location.getCurrentPositionAsync({});
            setLocation({
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
            });
            Alert.alert('Succès', 'Position obtenue!');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible d\'obtenir votre position');
        } finally {
            setFetchingLocation(false);
        }
    };

    const handleSubmit = async () => {
        if (!title || !description || !pricePerDay) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (photos.length === 0) {
            Alert.alert('Erreur', 'Veuillez ajouter au moins une photo');
            return;
        }

        try {
            setLoading(true);

            const pricePerDayCents = Math.round(parseFloat(pricePerDay.replace(',', '.')) * 100);
            const depositCents = deposit ? Math.round(parseFloat(deposit.replace(',', '.')) * 100) : 0;

            await axios.post(
                `${API_URL}/items`,
                {
                    title,
                    description,
                    price_per_day_cents: pricePerDayCents,
                    deposit_cents: depositCents,
                    category,
                    condition,
                    photos,
                    type: 'rent',
                    // location handled by backend
                    radius_km: 5,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            Alert.alert('Succès', 'Votre objet est en ligne pour la location !', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de créer l\'annonce');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScreenHeader title="Mettre en location" />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Photos */}
                <View style={styles.section}>
                    <Text style={styles.label}>Photos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                        <TouchableOpacity style={styles.addPhotoButton} onPress={selectImageSource}>
                            <Ionicons name="camera" size={32} color="#4C7B4B" />
                            <Text style={styles.photoAddText}>Ajouter</Text>
                        </TouchableOpacity>
                        {photos.map((photo, index) => (
                            <View key={index} style={styles.photoContainer}>
                                <Image source={{ uri: photo }} style={styles.photo} />
                                <TouchableOpacity
                                    style={styles.removePhoto}
                                    onPress={() => removePhoto(index)}
                                >
                                    <Ionicons name="close-circle" size={24} color="#ff4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Title */}
                <View style={styles.section}>
                    <Text style={styles.label}>Titre de l'annonce</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Perceuse Bosch Professional"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                    />
                </View>

                {/* Category */}
                <View style={styles.section}>
                    <Text style={styles.label}>Catégorie</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.chip, category === cat && styles.chipActive]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Price & Deposit */}
                <View style={styles.row}>
                    <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Prix / jour (€)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            value={pricePerDay}
                            onChangeText={setPricePerDay}
                        />
                    </View>
                    <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Caution (€)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            value={deposit}
                            onChangeText={setDeposit}
                        />
                    </View>
                </View>

                {/* Condition */}
                <View style={styles.section}>
                    <Text style={styles.label}>État</Text>
                    <View style={styles.conditionContainer}>
                        <TouchableOpacity
                            style={[styles.conditionButton, condition === 'new' && styles.conditionActive]}
                            onPress={() => setCondition('new')}
                        >
                            <Text style={[styles.conditionText, condition === 'new' && styles.conditionTextActive]}>Neuf</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.conditionButton, condition === 'good' && styles.conditionActive]}
                            onPress={() => setCondition('good')}
                        >
                            <Text style={[styles.conditionText, condition === 'good' && styles.conditionTextActive]}>Bon état</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.conditionButton, condition === 'repair' && styles.conditionActive]}
                            onPress={() => setCondition('repair')}
                        >
                            <Text style={[styles.conditionText, condition === 'repair' && styles.conditionTextActive]}>Acceptable</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Location */}
                <View style={styles.section}>
                    <Text style={styles.label}>Lieu de remise</Text>
                    <Text style={{ color: '#666', fontStyle: 'italic' }}>
                        Votre adresse de profil sera utilisée pour la localisation de l'annonce.
                    </Text>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Décrivez votre objet, les accessoires inclus..."
                        multiline
                        numberOfLines={6}
                        value={description}
                        onChangeText={setDescription}
                        textAlignVertical="top"
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
                        <Text style={styles.submitButtonText}>Publier l'annonce</Text>
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
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        minHeight: 120,
        paddingTop: 12,
    },
    photoList: {
        flexDirection: 'row',
    },
    addPhotoButton: {
        width: 100,
        height: 100,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    photoAddText: {
        color: '#4C7B4B',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
    },
    photoContainer: {
        width: 100,
        height: 100,
        marginRight: 12,
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    removePhoto: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    chipContainer: {
        flexDirection: 'row',
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
    },
    chipActive: {
        backgroundColor: '#4C7B4B',
    },
    chipText: {
        color: '#666',
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#fff',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    conditionContainer: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 4,
    },
    conditionButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    conditionActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    conditionText: {
        color: '#666',
        fontWeight: '500',
    },
    conditionTextActive: {
        color: '#333',
        fontWeight: '600',
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#4C7B4B',
        justifyContent: 'center',
    },
    locationButtonSuccess: {
        backgroundColor: '#4C7B4B',
        borderColor: '#4C7B4B',
    },
    locationButtonText: {
        color: '#4C7B4B',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    locationButtonTextSuccess: {
        color: '#fff',
    },
    locationInfo: {
        fontSize: 13,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingBottom: 40,
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
