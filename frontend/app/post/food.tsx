import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import BarcodeScanner from '../../src/components/BarcodeScanner';

import { API_URL } from '../../src/config/api';

type FoodType = 'non_perishable' | 'fresh_produce';
type DonationCategory = 'packaged' | 'garden';

export default function PostFoodScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [step, setStep] = useState(1);

  // Step 1
  const [donationCategory, setDonationCategory] = useState<DonationCategory>('packaged');
  const [foodType, setFoodType] = useState<FoodType>('non_perishable');
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');

  // Step 2
  const [description, setDescription] = useState('');
  const [urgencyHours, setUrgencyHours] = useState<number>(24);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);

  const [loading, setLoading] = useState(false);

  // Barcode scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<{
    barcode?: string;
    allergens?: string[];
    ddmInfo?: string;
  }>({});

  const selectImageSource = () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une source',
      [
        {
          text: 'Appareil photo',
          onPress: takePhoto,
        },
        {
          text: 'Galerie',
          onPress: pickImage,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const takePhoto = async () => {
    try {
      // Demander permission caméra
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
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setPhotos([...photos, base64Image]);
      } else if (!result.canceled && result.assets[0].uri) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const pickImage = async () => {
    try {
      // Sur web, on ne demande pas de permission (ça bloque)
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
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setPhotos([...photos, base64Image]);
      } else if (!result.canceled && result.assets[0].uri) {
        // Fallback si base64 n'est pas disponible
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à votre position');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
      Alert.alert('Succès', 'Position obtenue!');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position');
    }
  };

  const handleProductScanned = (product: any) => {


    try {
      // Pré-remplir le titre
      if (product.name) {
        setTitle(product.name);
      }

      // Note: On ne peut pas ajouter directement l'URL de l'image car photos attend du base64
      // L'utilisateur devra prendre une photo manuellement

      // Stocker les allergènes et info DDM
      setScannedData({
        barcode: product.barcode,
        allergens: product.allergens,
        ddmInfo: product.ddmInfo,
      });

      // Ajouter description si marque disponible
      let desc = '';
      if (product.brands) {
        desc += `Marque: ${product.brands}\n\n`;
      }
      if (product.ddmInfo) {
        desc += `ℹ️ ${product.ddmInfo}`;
      }
      if (desc) {
        setDescription(desc);
      }



      Alert.alert(
        'Produit scanné!',
        `${product.name || 'Produit'} ajouté. Veuillez ajouter une photo manuellement.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error in handleProductScanned:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du traitement des données');
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim()) {
        Alert.alert('Erreur', 'Veuillez entrer un titre');
        return;
      }
      if (photos.length === 0) {
        Alert.alert('Erreur', 'Veuillez ajouter au moins une photo');
        return;
      }
      // MANDATORY: Barcode scan required ONLY for packaged products
      if (donationCategory === 'packaged' && !scannedData.barcode) {
        Alert.alert(
          'Code-barres requis',
          'Pour les produits emballés, vous devez scanner le code-barres pour garantir la traçabilité.\n\n' +
          'Appuyez sur "Scanner code-barres" pour continuer.',
          [{ text: 'Compris' }]
        );
        return;
      }
      setStep(2);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/items`,
        {
          type: 'donation',
          food_type: foodType,
          title,
          description,
          photos,
          category: 'food',
          // location handled by backend
          radius_km: radiusKm,
          urgency_hours: urgencyHours,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('Succès', 'Votre don a été publié!');
      router.back();
    } catch (error: any) {
      console.error('Error publishing donation:', error.response?.data);

      // Check for AI validation error
      if (error.response?.data?.detail?.error === 'INVALID_FOOD_ITEM') {
        const detail = error.response.data.detail;
        Alert.alert(
          '⚠️ Produit Non Autorisé',
          `${detail.message}\n\n` +
          `Seuls les produits secs et non périssables sont acceptés :\n` +
          `✅ Pâtes, riz, conserves, céréales, légumineuses\n` +
          `❌ Plats préparés, produits frais, produits laitiers`,
          [{ text: 'Compris' }]
        );
      } else {
        Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors de la publication');
      }
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
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau don alimentaire</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
      </View>

      <ScrollView style={styles.content}>
        {step === 1 ? (
          <View>
            <Text style={styles.label}>Catégorie de don *</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  donationCategory === 'packaged' && styles.radioButtonActive,
                ]}
                onPress={() => {
                  setDonationCategory('packaged');
                  setFoodType('non_perishable');
                }}
              >
                <View style={styles.radio}>
                  {donationCategory === 'packaged' && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.radioText}>Produits emballés</Text>
                  <Text style={styles.radioSubtext}>Pâtes, riz, conserves... (code-barres requis)</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioButton,
                  donationCategory === 'garden' && styles.radioButtonActive,
                ]}
                onPress={() => {
                  setDonationCategory('garden');
                  setFoodType('fresh_produce');
                }}
              >
                <View style={styles.radio}>
                  {donationCategory === 'garden' && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.radioText}>Produits du jardin</Text>
                  <Text style={styles.radioSubtext}>Fruits et légumes frais</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Photos *</Text>
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                  >
                    <Ionicons name="close-circle" size={24} color="#d32f2f" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 5 && (
                <TouchableOpacity style={styles.photoAdd} onPress={selectImageSource}>
                  <Ionicons name="camera" size={32} color="#4C7B4B" />
                  <Text style={styles.photoAddText}>Ajouter</Text>
                </TouchableOpacity>
              )}
            </View>

            {donationCategory === 'packaged' && (
              <View style={styles.scannerSection}>
                <Text style={styles.label}>
                  Code-barres *
                  {scannedData.barcode && (
                    <Text style={styles.successBadge}> ✓ Scanné</Text>
                  )}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.scanButton,
                    scannedData.barcode && styles.scanButtonSuccess
                  ]}
                  onPress={() => setShowScanner(true)}
                >
                  <Ionicons
                    name={scannedData.barcode ? "checkmark-circle" : "barcode-outline"}
                    size={24}
                    color={scannedData.barcode ? "#4caf50" : "#4C7B4B"}
                  />
                  <Text style={[
                    styles.scanButtonText,
                    scannedData && styles.scanButtonTextSuccess
                  ]}>
                    {scannedData.barcode ? 'Code-barres scanné' : 'Scanner code-barres (obligatoire)'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Ex: Pâtes, riz, conserves"
              value={title}
              onChangeText={setTitle}
              maxLength={60}
            />
            <Text style={styles.hint}>{title.length}/60</Text>

            {scannedData.allergens && scannedData.allergens.length > 0 && (
              <View style={styles.infoBox}>
                <View style={styles.infoHeader}>
                  <Ionicons name="warning" size={20} color="#d32f2f" />
                  <Text style={styles.infoTitle}>Allergènes détectés</Text>
                </View>
                <Text style={styles.infoText}>{scannedData.allergens.join(', ')}</Text>
              </View>
            )}

            {scannedData.ddmInfo && (
              <View style={styles.infoBox}>
                <View style={styles.infoHeader}>
                  <Ionicons name="information-circle" size={20} color="#1976d2" />
                  <Text style={styles.infoTitle}>Info DDM</Text>
                </View>
                <Text style={styles.infoText}>{scannedData.ddmInfo}</Text>
              </View>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez ce que vous donnez..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <Text style={styles.label}>Urgence *</Text>
            <View style={styles.urgencyButtons}>
              {[12, 24, 48].map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.urgencyButton,
                    urgencyHours === hours && styles.urgencyButtonActive,
                  ]}
                  onPress={() => setUrgencyHours(hours)}
                >
                  <Text
                    style={[
                      styles.urgencyButtonText,
                      urgencyHours === hours && styles.urgencyButtonTextActive,
                    ]}
                  >
                    {hours}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Rayon de collecte</Text>
            <View style={styles.radiusButtons}>
              {[3, 5, 10].map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[
                    styles.radiusButton,
                    radiusKm === km && styles.radiusButtonActive,
                  ]}
                  onPress={() => setRadiusKm(km)}
                >
                  <Text
                    style={[
                      styles.radiusButtonText,
                      radiusKm === km && styles.radiusButtonTextActive,
                    ]}
                  >
                    {km} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.safetyTip}>
              <Ionicons name="information-circle" size={20} color="#4C7B4B" />
              <Text style={styles.safetyText}>
                Lieu de collecte : Votre adresse de profil sera utilisée par défaut.
              </Text>
            </View>

            <View style={styles.safetyTip}>
              <Ionicons name="information-circle" size={20} color="#4C7B4B" />
              <Text style={styles.safetyText}>
                Conseil: Rencontrez dans un lieu public et vérifiez la fraîcheur
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step === 2 && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => setStep(1)}
          >
            <Text style={styles.buttonSecondaryText}>Retour</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonPrimary,
            loading && styles.buttonDisabled,
          ]}
          onPress={step === 1 ? handleNext : handlePublish}
          disabled={loading}
        >
          <Text style={styles.buttonPrimaryText}>
            {loading ? 'Publication...' : step === 1 ? 'Suivant' : 'Publier'}
          </Text>
        </TouchableOpacity>
      </View>

      <BarcodeScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onProductScanned={handleProductScanned}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  stepDotActive: {
    backgroundColor: '#4C7B4B',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#4C7B4B',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  radioGroup: {
    gap: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  radioButtonActive: {
    borderColor: '#4C7B4B',
    backgroundColor: '#e8f5e9',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4C7B4B',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4C7B4B',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  radioSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoItem: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  photoRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  photoAdd: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4C7B4B',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  photoAddText: {
    fontSize: 12,
    color: '#4C7B4B',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  urgencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  urgencyButtonActive: {
    borderColor: '#f57c00',
    backgroundColor: '#fff3e0',
  },
  urgencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  urgencyButtonTextActive: {
    color: '#f57c00',
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  radiusButtonActive: {
    borderColor: '#4C7B4B',
    backgroundColor: '#e8f5e9',
  },
  radiusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  radiusButtonTextActive: {
    color: '#4C7B4B',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4C7B4B',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4C7B4B',
    marginLeft: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  locationText: {
    fontSize: 13,
    color: '#4C7B4B',
    marginLeft: 8,
  },
  safetyTip: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  safetyText: {
    flex: 1,
    fontSize: 13,
    color: '#4C7B4B',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#4C7B4B',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4C7B4B',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#4C7B4B',
    fontSize: 16,
    fontWeight: '600',
  },
  scannerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  scanButtonSuccess: {
    backgroundColor: '#c8e6c9',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  scanButtonText: {
    color: '#4C7B4B',
    fontSize: 14,
    fontWeight: '600',
  },
  scanButtonTextSuccess: {
    color: '#4C7B4B',
    fontWeight: '700',
  },
  successBadge: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
