import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Image,
    Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';

import { API_URL } from '../../src/config/api';

export default function StoreSettingsScreen() {
    const router = useRouter();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showImageOptions, setShowImageOptions] = useState(false);

    const [form, setForm] = useState({
        name: '',
        description: '',
        address: '',
        website: '',
        logo_url: ''
    });

    useEffect(() => {
        fetchStore();
    }, []);

    const fetchStore = async () => {
        try {
            const response = await axios.get(`${API_URL}/me/store`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const store = response.data;
            setForm({
                name: store.name || '',
                description: store.description || '',
                address: store.address || '',
                website: store.website || '',
                logo_url: store.logo_url || store.logo || ''
            });
        } catch (error: any) {
            console.error('Fetch store error:', error);
            Alert.alert('Erreur', 'Impossible de charger les informations du magasin.');
        } finally {
            setLoading(false);
        }
    };

    const handleCamera = async () => {
        setShowImageOptions(false);
        if (!Device.isDevice) {

            // On simulator, we can fall back to gallery or just warn.
            // But since user asked specifically about "why not working", assume they might be on sim.
            // Let's allow simulator to bypass camera check IF we can (we can't actually open camera on sim).

            Alert.alert(
                'Simulateur détecté',
                'La caméra n\'est pas disponible sur le simulateur iOS. Veuillez utiliser la galerie ou un appareil physique.'
            );
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Permission refusée',
                'L\'application a besoin d\'accéder à votre caméra.',
                [
                    { text: 'Annuler', style: 'cancel' },
                    {
                        text: 'Ouvrir les réglages',
                        onPress: () => Linking.openSettings()
                    }
                ]
            );
            return;
        }

        try {
            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'Images' as any,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                setForm({ ...form, logo_url: `data:image/jpeg;base64,${result.assets[0].base64}` });
            }
        } catch (error) {
            console.error('Camera launch error:', error);
            Alert.alert('Erreur', 'Impossible d\'ouvrir la caméra.');
        }
    };

    const handleGallery = async () => {
        setShowImageOptions(false);
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Accès galerie requis.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'Images' as any,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setForm({ ...form, logo_url: `data:image/jpeg;base64,${result.assets[0].base64}` });
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.address) {
            Alert.alert('Erreur', 'Le nom et l\'adresse sont obligatoires.');
            return;
        }

        setSaving(true);
        try {
            await axios.patch(`${API_URL}/me/store`, {
                name: form.name,
                description: form.description,
                address: form.address,
                website: form.website,
                logo_url: form.logo_url
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert(
                'Succès',
                'Les informations ont été mises à jour.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            console.error('Update store error:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4C7B4B" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil Magasin</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.logoSection}>
                    <TouchableOpacity onPress={() => setShowImageOptions(true)}>
                        <View style={styles.logoContainer}>
                            {form.logo_url ? (
                                <Image source={{ uri: form.logo_url }} style={styles.logoImage} />
                            ) : (
                                <View style={styles.logoPlaceholder}>
                                    <Ionicons name="storefront-outline" size={40} color="#999" />
                                </View>
                            )}
                            <View style={styles.cameraIcon}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </View>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.logoLabel}>Logo du commerce</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Nom du commerce <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={form.name}
                        onChangeText={t => setForm({ ...form, name: t })}
                        placeholder="Ex: Boulangerie de la Place"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={form.description}
                        onChangeText={t => setForm({ ...form, description: t })}
                        placeholder="Décrivez votre commerce et vos produits..."
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Adresse <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        value={form.address}
                        onChangeText={t => setForm({ ...form, address: t })}
                        placeholder="123 Rue de Exemple, 75000 Paris"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Site Web</Text>
                    <TextInput
                        style={styles.input}
                        value={form.website}
                        onChangeText={t => setForm({ ...form, website: t })}
                        placeholder="https://mon-commerce.com"
                        autoCapitalize="none"
                        keyboardType="url"
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Enregistrer</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Modal for Image Selection */}
            <Modal
                visible={showImageOptions}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowImageOptions(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalOverlayClose}
                        activeOpacity={1}
                        onPress={() => setShowImageOptions(false)}
                    />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Ajouter une photo</Text>
                        <Text style={styles.modalSubtitle}>Choisissez une source</Text>

                        <TouchableOpacity style={styles.modalButton} onPress={handleCamera}>
                            <Text style={styles.modalButtonText}>Appareil photo</Text>
                        </TouchableOpacity>

                        <View style={styles.modalDivider} />

                        <TouchableOpacity style={styles.modalButton} onPress={handleGallery}>
                            <Text style={styles.modalButtonText}>Galerie</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowImageOptions(false)}>
                            <Text style={styles.modalCancelText}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
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
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    logoImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    logoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4C7B4B',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f5f5f5',
    },
    logoLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    required: {
        color: '#d32f2f',
    },
    input: {
        backgroundColor: '#fff',
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
    footer: {
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    saveButton: {
        backgroundColor: '#4C7B4B',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalOverlayClose: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#1a1a1a', // Dark theme as per screenshot
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: '#333',
        paddingVertical: 16,
        borderRadius: 12, // Rounded buttons like screenshot? Actually screenshot has stacked rounded group
        alignItems: 'center',
        marginBottom: 2,
    },
    modalButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    modalDivider: {
        height: 1,
    },
    modalCancelButton: {
        backgroundColor: '#333',
        marginTop: 12,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
