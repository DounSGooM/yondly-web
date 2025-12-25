import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import * as ImagePicker from 'expo-image-picker';
import { Image, Platform } from 'react-native';
import * as Device from 'expo-device';
import ScreenHeader from '../../src/components/ScreenHeader';

export default function SettingsScreen() {
    const router = useRouter();
    const { logout, user, updateProfile } = useAuthStore();
    const [uploading, setUploading] = useState(false);
    const [showImageOptions, setShowImageOptions] = useState(false);

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    const handleUpdatePhoto = () => {
        console.log("LOG: Photo Icon Pressed - Opening Modal");
        setShowImageOptions(true);
    };

    const handleCamera = async () => {
        console.log("LOG: Camera Selected");
        setShowImageOptions(false);

        if (!Device.isDevice) {
            // Simulator bypass logic for testing if needed, or soft warning
            Alert.alert(
                "Simulateur détecté",
                "L'appareil photo n'est pas disponible sur le simulateur. Veuillez utiliser un vrai téléphone ou la galerie."
            );
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                "Permission refusée",
                "L'application a besoin d'accéder à votre caméra.",
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
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'Images' as any,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });
            if (result.canceled) return;
            if (result.assets && result.assets[0].base64) {
                saveImage(result.assets[0].base64);
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
            Alert.alert("Permission refusée", "Nous avons besoin de la permission galerie.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'Images' as any,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });
        if (result.canceled) return;
        if (result.assets && result.assets[0].base64) {
            saveImage(result.assets[0].base64);
        }
    };

    const saveImage = async (base64: string) => {
        try {
            setUploading(true);
            const photoUrl = `data:image/jpeg;base64,${base64}`;
            await updateProfile({ photo_url: photoUrl });
            Alert.alert("Succès", "Photo de profil mise à jour !");
        } catch (error: any) {
            console.error("Upload error:", error);
            const message = error.message || "Impossible de mettre à jour la photo.";
            Alert.alert("Erreur", message);
        } finally {
            setUploading(false);
        }
    };

    const renderSectionHeader = (title: string) => (
        <Text style={styles.sectionHeader}>{title}</Text>
    );

    const renderToggleItem = (title: string, value: boolean, onValueChange: (val: boolean) => void, icon: string) => (
        <View style={styles.item}>
            <View style={styles.itemLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon as any} size={20} color="#666" />
                </View>
                <Text style={styles.itemText}>{title}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#e0e0e0', true: '#a5d6a7' }}
                thumbColor={value ? '#4C7B4B' : '#f4f3f4'}
            />
        </View>
    );

    const renderLinkItem = (title: string, onPress: () => void, icon: string, color: string = '#666') => (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <View style={styles.itemLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon as any} size={20} color={color} />
                </View>
                <Text style={[styles.itemText, { color: color === '#d32f2f' ? color : '#333' }]}>{title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#e0e0e0" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScreenHeader title="Paramètres" />

            <ScrollView style={styles.content}>
                <View style={styles.profileHeader}>
                    <TouchableOpacity onPress={handleUpdatePhoto} disabled={uploading}>
                        <View style={styles.imageContainer}>
                            {user?.photo_url ? (
                                <Image source={{ uri: user.photo_url }} style={styles.profileImage} />
                            ) : (
                                <View style={[styles.profileImage, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="person" size={40} color="#999" />
                                </View>
                            )}
                            <View style={styles.cameraIcon}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </View>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.profileName}>{user?.display_name || 'Utilisateur'}</Text>
                    <Text style={styles.profileEmail}>{user?.email}</Text>
                </View>

                {renderSectionHeader('Préférences')}
                <View style={styles.section}>
                    {renderToggleItem('Notifications push', notificationsEnabled, setNotificationsEnabled, 'notifications-outline')}
                    {renderToggleItem('Emails marketing', emailNotifs, setEmailNotifs, 'mail-outline')}
                    {renderToggleItem('Localisation', locationEnabled, setLocationEnabled, 'location-outline')}
                    {/* Dark mode placeholder - would need theme context */}
                    {renderToggleItem('Mode sombre', darkMode, setDarkMode, 'moon-outline')}
                </View>

                {renderSectionHeader('Support')}
                <View style={styles.section}>
                    {renderLinkItem('Centre d\'aide', () => router.push('/profile/help' as any), 'help-circle-outline')}
                    {renderLinkItem('Nous contacter', () => Alert.alert('Info', 'Contact: support@yondly.com'), 'chatbox-ellipses-outline')}
                    {renderLinkItem('Conditions d\'utilisation', () => { }, 'document-text-outline')}
                    {renderLinkItem('Politique de confidentialité', () => { }, 'shield-checkmark-outline')}
                </View>

                {renderSectionHeader('Compte')}
                <View style={styles.section}>
                    {renderLinkItem('Supprimer mon compte', () => Alert.alert('Attention', 'Cette action est irréversible'), 'trash-outline', '#d32f2f')}
                </View>

                <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0</Text>
                <View style={{ height: 40 }} />
            </ScrollView>

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

                        <TouchableOpacity style={styles.modalButton} onPress={handleCamera}>
                            <Ionicons name="camera" size={24} color="#fff" />
                            <Text style={styles.modalButtonText}>Prendre une photo</Text>
                        </TouchableOpacity>

                        <View style={styles.modalDivider} />

                        <TouchableOpacity style={styles.modalButton} onPress={handleGallery}>
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
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    // header, backButton, headerTitle removed
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginLeft: 16,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    section: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 32,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 32,
        alignItems: 'flex-start',
    },
    itemText: {
        fontSize: 16,
        color: '#333',
    },
    logoutRow: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoutText: {
        color: '#d32f2f',
        fontSize: 16,
        fontWeight: '600',
    },
    versionText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        marginBottom: 20,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: '#fff',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
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
        borderColor: '#fff',
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#666',
    },
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
});
// End of file
