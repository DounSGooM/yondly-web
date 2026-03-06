import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import { useAuthStore } from '../src/store/authStore';

import { API_URL } from '../src/config/api';

type FoodType = 'non_perishable' | 'fresh_produce';
type Condition = 'new' | 'good' | 'repair';

export default function EditItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.token);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<any>(null);

  // Common fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);

  // Food-specific
  const [foodType, setFoodType] = useState<FoodType>('non_perishable');
  const [urgencyHours, setUrgencyHours] = useState<number>(24);

  // Sale-specific
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<Condition>('good');

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await axios.get(`${API_URL}/items/${id}`);
      const itemData = response.data;
      setItem(itemData);

      // Populate form
      setTitle(itemData.title);
      setDescription(itemData.description || '');
      setCategory(itemData.category);
      setPhotos(itemData.photos || []);
      setLocation(itemData.location);
      setRadiusKm(itemData.radius_km || 5);

      if (itemData.type === 'donation') {
        setFoodType(itemData.food_type || 'non_perishable');
        setUrgencyHours(itemData.urgency_hours || 24);
      } else {
        setPrice(((itemData.price_cents || 0) / 100).toString());
        setCondition(itemData.condition || 'good');
      }
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger l\'annonce');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images' as any,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const newPhotos = result.assets.map((asset) => `data:image/jpeg;base64,${asset.base64}`);
      setPhotos([...photos, ...newPhotos].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre localisation');
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: userLocation.coords.latitude,
        lng: userLocation.coords.longitude,
      });
      Alert.alert('Succès', 'Localisation mise à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'obtenir la localisation');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins une photo');
      return;
    }

    if (!location) {
      Alert.alert('Erreur', 'La localisation est requise');
      return;
    }

    if (item.type === 'sale' && (!price || parseFloat(price) <= 0)) {
      Alert.alert('Erreur', 'Le prix doit être supérieur à 0');
      return;
    }

    setSaving(true);

    try {
      const itemData: any = {
        type: item.type,
        title: title.trim(),
        description: description.trim(),
        category,
        photos,
        location,
        radius_km: radiusKm,
      };

      if (item.type === 'donation') {
        itemData.food_type = foodType;
        itemData.urgency_hours = urgencyHours;
      } else {
        itemData.price_cents = Math.round(parseFloat(price) * 100);
        itemData.condition = condition;
      }

      await axios.put(`${API_URL}/items/${id}`, itemData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Succès', 'Annonce modifiée avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'La modification a échoué';
      Alert.alert('Erreur', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4C7B4B" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centerContainer}>
        <Text>Annonce introuvable</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier l'annonce</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos ({photos.length}/5)</Text>
          <ScrollView horizontal style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#d32f2f" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 5 && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                <Ionicons name="camera" size={32} color="#4C7B4B" />
                <Text style={styles.addPhotoText}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Pommes bio"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez votre article..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Catégorie *</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="Ex: Fruits"
          />
        </View>

        {/* Type-specific fields */}
        {item.type === 'donation' ? (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Type d'aliment</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioButton, foodType === 'non_perishable' && styles.radioButtonActive]}
                  onPress={() => setFoodType('non_perishable')}
                >
                  <Text style={[styles.radioText, foodType === 'non_perishable' && styles.radioTextActive]}>
                    Sec
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioButton, foodType === 'fresh_produce' && styles.radioButtonActive]}
                  onPress={() => setFoodType('fresh_produce')}
                >
                  <Text style={[styles.radioText, foodType === 'fresh_produce' && styles.radioTextActive]}>
                    Frais
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Urgence (heures)</Text>
              <TextInput
                style={styles.input}
                value={urgencyHours.toString()}
                onChangeText={(text) => setUrgencyHours(parseInt(text) || 24)}
                keyboardType="numeric"
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Prix (€) *</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>État</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioButton, condition === 'new' && styles.radioButtonActive]}
                  onPress={() => setCondition('new')}
                >
                  <Text style={[styles.radioText, condition === 'new' && styles.radioTextActive]}>
                    Neuf
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioButton, condition === 'good' && styles.radioButtonActive]}
                  onPress={() => setCondition('good')}
                >
                  <Text style={[styles.radioText, condition === 'good' && styles.radioTextActive]}>
                    Bon état
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioButton, condition === 'repair' && styles.radioButtonActive]}
                  onPress={() => setCondition('repair')}
                >
                  <Text style={[styles.radioText, condition === 'repair' && styles.radioTextActive]}>
                    Réparation
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Localisation *</Text>
          <TouchableOpacity style={styles.locationButton} onPress={getLocation}>
            <Ionicons name="location" size={20} color="#4C7B4B" />
            <Text style={styles.locationButtonText}>
              {location ? 'Modifier la localisation' : 'Obtenir ma localisation'}
            </Text>
          </TouchableOpacity>
          {location && (
            <Text style={styles.locationInfo}>
              📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </Text>
          )}
        </View>

        {/* Radius */}
        <View style={styles.section}>
          <Text style={styles.label}>Rayon de visibilité ({radiusKm} km)</Text>
          <TextInput
            style={styles.input}
            value={radiusKm.toString()}
            onChangeText={(text) => setRadiusKm(parseInt(text) || 5)}
            keyboardType="numeric"
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
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </>
          )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  photosContainer: {
    flexDirection: 'row',
  },
  photoWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4C7B4B',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#4C7B4B',
    marginTop: 4,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: '#4C7B4B',
    backgroundColor: '#e8f5e9',
  },
  radioText: {
    fontSize: 14,
    color: '#666',
  },
  radioTextActive: {
    color: '#4C7B4B',
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  locationButtonText: {
    fontSize: 14,
    color: '#4C7B4B',
    fontWeight: '500',
  },
  locationInfo: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4C7B4B',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
