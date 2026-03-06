import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
    Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
import { useAuthStore } from '../../src/store/authStore';

const THEME_COLORS = [
    '#4CAF50', // Original Green
    '#2196F3', // Blue
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#E91E63', // Pink
    '#795548', // Brown
];

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, updateProfile, deleteAccount } = useAuthStore();

    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [photoUrl, setPhotoUrl] = useState(user?.photo_url || null);
    const [selectedColor, setSelectedColor] = useState(user?.profile_theme_color || THEME_COLORS[0]);
    const [loading, setLoading] = useState(false);
    const [showImageOptions, setShowImageOptions] = useState(false);

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert('Erreur', 'Le nom d\'affichage ne peut pas être vide');
            return;
        }

        setLoading(true);
        try {
            // Check if photoUrl is a local URI (newly picked) or remote URL
            // If it's a local URI, we might need to upload it or convert to base64 if the API expects base64
            // The previous code in store-settings used base64. 
            // The previous edit.tsx code just passed the URI. 
            // It seems updateProfile handles the URL/String.
            // Wait, looking at settings.tsx in previous turn (which was creating logic for this), 
            // it converted to base64 for upload.
            // Let's ensure we handle the image data correctly. 
            // The original logic just set photo_url: photoUrl. If backend expects base64 or URL, we should be consistent.
            // However, ImagePicker result gives us URI.
            // Let's modify handleCamera/Gallery to get base64 too if needed.
            // Checking models.py or other files, `UserUpdate` expects `photo_url`.
            // If the backend handles base64 upload, we should send base64 data URI.

            // I will update the image picker calls to request base64 and use that for saving if it's a new image.

            await updateProfile({
                display_name: displayName,
                phone: phone,
                photo_url: photoUrl || undefined, // This presumes updateProfile handles the upload or it's a URL
                profile_theme_color: selectedColor,
            });
            Alert.alert('Succès', 'Profil mis à jour avec succès');
            router.back();
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le profil');
        } finally {
            setLoading(false);
        }
    };

    // Modification: Refine ImagePicker to get base64 to be safe for upload
    const handleCameraWithBase64 = async () => {
        setShowImageOptions(false);

        try {
            // STEP 1: Check Device
            if (!Device.isDevice) {
                Alert.alert('Info', 'Simulateur détecté : La caméra ne fonctionne pas ICI. Utilisez un vrai appareil.');
                return; // STOP execution on simulator to prevent hangs
            }

            // STEP 2: Permissions
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission refusée',
                    'L\'accès à la caméra est nécessaire. Ouvrez les réglages.',
                    [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Réglages', onPress: () => Linking.openSettings() }
                    ]
                );
                return;
            }

            // STEP 3: Launch
            // Removing mediaTypes explicitly to use default 'Images' and avoid type/value issues
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setPhotoUrl(uri);
            }
        } catch (error: any) {
            console.error('Camera error:', error);
            Alert.alert('Erreur technique', error.message || 'Impossible de lancer la caméra');
        }
    };

    const handleGalleryWithBase64 = async () => {
        setShowImageOptions(false);

        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission refusée', 'Accès galerie requis.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'Images' as any,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setPhotoUrl(uri);
            }
        } catch (error: any) {
            console.error('Gallery error:', error);
            Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie');
        }
    };


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Modifier mon profil</Text>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#4C7B4B" />
                    ) : (
                        <Text style={styles.saveText}>Enregistrer</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content}>
                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={() => setShowImageOptions(true)} style={styles.avatarContainer}>
                            {photoUrl ? (
                                <Image source={{ uri: photoUrl }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <Ionicons name="person" size={40} color="#ccc" />
                                </View>
                            )}
                            <View style={[styles.editBadge, { backgroundColor: selectedColor }]}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.changePhotoText, { color: selectedColor }]}>Changer photo</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Thème du profil</Text>
                            <View style={styles.colorGrid}>
                                {THEME_COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorOption,
                                            { backgroundColor: color },
                                            selectedColor === color && styles.colorOptionSelected,
                                        ]}
                                        onPress={() => setSelectedColor(color)}
                                    >
                                        {selectedColor === color && (
                                            <Ionicons name="checkmark" size={20} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nom d'affichage</Text>
                            <TextInput
                                style={styles.input}
                                value={displayName}
                                onChangeText={setDisplayName}
                                placeholder="Votre nom"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={user?.email}
                                editable={false}
                                placeholder="votre@email.com"
                                placeholderTextColor="#999"
                            />
                            <Text style={styles.helperText}>L'email ne peut pas être modifié</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Téléphone</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Votre numéro de téléphone"
                                placeholderTextColor="#999"
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.deleteSection}>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => {
                            Alert.alert(
                                'Supprimer mon compte ?',
                                'Cette action est irréversible. Toutes vos données seront effacées.',
                                [
                                    { text: 'Annuler', style: 'cancel' },
                                    {
                                        text: 'Supprimer',
                                        style: 'destructive',
                                        onPress: async () => {
                                            setLoading(true);
                                            try {
                                                await deleteAccount();
                                                // Force navigation to root to trigger auth check rejection
                                                router.replace('/');
                                            } catch (error: any) {
                                                Alert.alert('Erreur', error.message);
                                                setLoading(false);
                                            }
                                        }
                                    }
                                ]
                            );
                        }}>
                            <Ionicons name="trash-outline" size={20} color="#ff4444" />
                            <Text style={styles.deleteText}>Supprimer mon compte</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Custom Modal for Image Selection */}
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
                        <Text style={styles.modalTitle}>Changer de photo</Text>

                        <TouchableOpacity style={styles.modalButton} onPress={handleCameraWithBase64}>
                            <Ionicons name="camera" size={24} color="#fff" />
                            <Text style={styles.modalButtonText}>Prendre une photo</Text>
                        </TouchableOpacity>

                        <View style={styles.modalDivider} />

                        <TouchableOpacity style={styles.modalButton} onPress={handleGalleryWithBase64}>
                            <Ionicons name="images" size={24} color="#fff" />
                            <Text style={styles.modalButtonText}>Choisir dans la galerie</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowImageOptions(false)}>
                            <Text style={styles.modalCancelText}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
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
        fontWeight: '600',
        color: '#333',
    },
    saveButton: {
        padding: 8,
        marginRight: -8,
    },
    saveText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4C7B4B',
    },
    content: {
        flex: 1,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f5f5f5',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    changePhotoText: {
        fontSize: 14,
        fontWeight: '500',
    },
    form: {
        paddingHorizontal: 16,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    disabledInput: {
        backgroundColor: '#f9f9f9',
        color: '#999',
    },
    helperText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: '#fff',
        elevation: 4,
        shadowOpacity: 0.3,
        transform: [{ scale: 1.1 }],
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
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#fff',
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#333',
    },
    modalButtonText: {
        fontSize: 16,
        marginLeft: 16,
        color: '#fff',
    },
    modalCancelButton: {
        marginTop: 16,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 12,
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    deleteSection: {
        marginTop: 32,
        marginBottom: 48, // ample space at bottom
        alignItems: 'center',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff0f0',
        borderRadius: 8,
    },
    deleteText: {
        color: '#ff4444',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
