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
import { ItemType } from '../../src/types';

import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

const CATEGORIES = ['Maison', 'Vêtements', 'Électronique', 'Multimédia', 'Véhicules', 'Sport', 'Livres', 'Enfants', 'Jeux & Jouets', 'Jardin', 'Bricolage', 'Beauté', 'Animaux', 'Musique', 'Mobilier', 'Autre'];
type Condition = 'new' | 'good' | 'repair';

export default function PostMarketScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [step, setStep] = useState(1);

  // Step 1
  const [type, setType] = useState<ItemType>('sale');
  const [category, setCategory] = useState('Maison');
  const [condition, setCondition] = useState<Condition>('good');
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Step 2
  const [priceEuros, setPriceEuros] = useState('10');
  const [depositEuros, setDepositEuros] = useState('');
  const [allowOffers, setAllowOffers] = useState(true);
  const [description, setDescription] = useState('');

  // Step 3
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);

  const [loading, setLoading] = useState(false);

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

  const calculateFee = (price: number) => {
    const baseFee = Math.round(0.05 * price * 100) / 100 + 0.49;
    const fee = Math.max(Math.min(baseFee, 9.99), 0.99);
    return { fee: fee.toFixed(2), payout: (price - fee).toFixed(2) };
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
      setStep(2);
    } else if (step === 2) {
      const price = parseFloat(priceEuros);
      if (isNaN(price) || price <= 0) {
        Alert.alert('Erreur', 'Veuillez entrer un prix valide');
        return;
      }
      setStep(3);
    }
  };

  const handlePublish = async () => {


    try {

      const priceCents = Math.round(parseFloat(priceEuros) * 100);
      const depositCents = type === 'rent' && depositEuros ? Math.round(parseFloat(depositEuros) * 100) : undefined;



      setLoading(true);



      // Limit photos to first 2 and check their sizes
      const limitedPhotos = photos.slice(0, 2);

      limitedPhotos.forEach((p, i) => {

      });

      const payload = {
        type,
        title,
        description,
        photos: limitedPhotos,
        category,
        condition,
        radius_km: radiusKm,
        price_cents: type === 'sale' ? priceCents : undefined,
        price_per_day_cents: type === 'rent' ? priceCents : undefined,
        deposit_cents: depositCents,
        allow_offers: allowOffers,
      };



      const response = await axios.post(
        `${API_URL}/items`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000, // 30 second timeout
        }
      );


      Alert.alert('Succès', 'Votre article a été publié!');
      router.back();
    } catch (error: any) {


      Alert.alert('Erreur', JSON.stringify(error?.response?.data) || error?.message || 'Erreur lors de la publication');
    } finally {

      setLoading(false);
    }
  };

  const price = parseFloat(priceEuros) || 0;
  const { fee, payout } = calculateFee(price);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScreenHeader title="Nouvelle vente" />

      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]} />
      </View>

      <ScrollView style={styles.content}>
        {step === 1 && (
          <View>
            <Text style={styles.label}>Catégorie *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <Text style={styles.dropdownButtonText}>{category}</Text>
              <Ionicons
                name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            {showCategoryDropdown && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.dropdownItem,
                        category === cat && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          category === cat && styles.dropdownItemTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                      {category === cat && (
                        <Ionicons name="checkmark" size={18} color="#4C7B4B" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.label}>État *</Text>
            <View style={styles.conditionButtons}>
              {[{ key: 'new', label: 'Neuf' }, { key: 'good', label: 'Bon état' }, { key: 'repair', label: 'À réparer' }].map((cond) => (
                <TouchableOpacity
                  key={cond.key}
                  style={[
                    styles.conditionButton,
                    condition === cond.key && styles.conditionButtonActive,
                  ]}
                  onPress={() => setCondition(cond.key as Condition)}
                >
                  <Text
                    style={[
                      styles.conditionText,
                      condition === cond.key && styles.conditionTextActive,
                    ]}
                  >
                    {cond.label}
                  </Text>
                </TouchableOpacity>
              ))}
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

            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Canapé d'angle en bon état"
              value={title}
              onChangeText={setTitle}
              maxLength={60}
            />
            <Text style={styles.hint}>{title.length}/60</Text>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.label}>{type === 'rent' ? 'Prix par jour *' : 'Prix *'}</Text>
            <View style={styles.priceInput}>
              <TextInput
                style={styles.priceInputField}
                placeholder="10"
                value={priceEuros}
                onChangeText={setPriceEuros}
                keyboardType="numeric"
              />
              <Text style={styles.priceSymbol}>€</Text>
            </View>

            {type === 'rent' && (
              <>
                <Text style={styles.label}>Caution (non débitée) *</Text>
                <View style={styles.priceInput}>
                  <TextInput
                    style={styles.priceInputField}
                    placeholder="50"
                    value={depositEuros}
                    onChangeText={setDepositEuros}
                    keyboardType="numeric"
                  />
                  <Text style={styles.priceSymbol}>€</Text>
                </View>
              </>
            )}

            <View style={styles.feeInfo}>
              <Text style={styles.feeTitle}>Frais de la plateforme</Text>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Prix de vente</Text>
                <Text style={styles.feeValue}>{price.toFixed(2)}€</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Frais plateforme</Text>
                <Text style={styles.feeValue}>-{fee}€</Text>
              </View>
              <View style={[styles.feeRow, styles.feeRowTotal]}>
                <Text style={styles.feeLabelTotal}>Vous recevez</Text>
                <Text style={styles.feeValueTotal}>{payout}€</Text>
              </View>
            </View>

            <View style={styles.offerToggle}>
              <View>
                <Text style={styles.offerTitle}>Accepter les offres</Text>
                <Text style={styles.offerSubtitle}>Les acheteurs peuvent proposer un prix</Text>
              </View>
              <TouchableOpacity
                style={[styles.switch, allowOffers && styles.switchActive]}
                onPress={() => setAllowOffers(!allowOffers)}
              >
                <View style={[styles.switchThumb, allowOffers && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez votre article..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>
        )}

        {step === 3 && (
          <View>
            {/* Rayon de livraison removed as per user request (visibility based on admin levels) */}
            <View style={{ height: 16 }} />

            <View style={styles.handoffInfo}>
              <Ionicons name="information-circle" size={20} color="#4C7B4B" />
              <Text style={styles.handoffText}>
                Mode: Remise en main propre. L'adresse de votre profil sera utilisée pour la localisation de l'annonce.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => setStep(step - 1)}
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
          onPress={step < 3 ? handleNext : handlePublish}
          disabled={loading}
        >
          <Text style={styles.buttonPrimaryText}>
            {loading ? 'Publication...' : step < 3 ? 'Suivant' : 'Publier'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 50,
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
    width: 40,
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  dropdownItemActive: {
    backgroundColor: '#e8f5e9',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#4C7B4B',
    fontWeight: '600',
  },
  conditionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  conditionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  conditionButtonActive: {
    borderColor: '#4C7B4B',
    backgroundColor: '#e8f5e9',
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  conditionTextActive: {
    color: '#4C7B4B',
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
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  photoRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  photoAdd: {
    width: 80,
    height: 80,
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
    padding: 12,
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
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4C7B4B',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  priceInputField: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4C7B4B',
    padding: 12,
  },
  priceSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4C7B4B',
  },
  feeInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  feeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#666',
  },
  feeValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  feeRowTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  feeLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4C7B4B',
  },
  feeValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4C7B4B',
  },
  offerToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  offerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#4caf50',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
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
  handoffInfo: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  handoffText: {
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
});
