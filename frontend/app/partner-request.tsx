import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import axios from 'axios';

import { API_URL } from '../src/config/api';

const BUSINESS_TYPES = ['Épicerie', 'Supermarché/GMS', 'Boulangerie', 'Recyclerie', 'Repair Café', 'Restaurant', 'Autre'];

export default function PartnerRequestScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    legal_name: '',
    business_name: '',
    address: '',
    business_type: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    description: '',
    website: '',
    estimated_volume: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.legal_name.trim()) newErrors.legal_name = 'Requis';
    if (!formData.business_name.trim()) newErrors.business_name = 'Requis';
    if (!formData.address.trim()) newErrors.address = 'Requis';
    if (!formData.business_type) newErrors.business_type = 'Requis';
    if (!formData.contact_name.trim()) newErrors.contact_name = 'Requis';
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Email invalide';
    }
    if (!formData.contact_phone.trim()) newErrors.contact_phone = 'Requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.address)}&format=json&limit=1`;
      const geoResponse = await fetch(nominatimUrl);
      const geoData = await geoResponse.json();

      if (!geoData || geoData.length === 0) {
        Alert.alert('Erreur', 'Adresse introuvable. Veuillez vérifier.');
        setLoading(false);
        return;
      }

      const location = {
        lat: parseFloat(geoData[0].lat),
        lng: parseFloat(geoData[0].lon),
      };

      await axios.post(`${API_URL}/partner-requests`, {
        ...formData,
        location,
      });

      Alert.alert(
        'Demande envoyée!',
        'Votre demande de partenariat a été envoyée avec succès. Nous vous contacterons bientôt.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting partner request:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Devenir partenaire</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Rejoignez notre réseau de magasins partenaires anti-gaspi et touchez plus de clients engagés.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations légales</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Raison sociale *</Text>
            <TextInput
              style={[styles.input, errors.legal_name && styles.inputError]}
              value={formData.legal_name}
              onChangeText={(text) => setFormData({ ...formData, legal_name: text })}
              placeholder="Ex: SARL Bio Épicerie"
            />
            {errors.legal_name && <Text style={styles.errorText}>{errors.legal_name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom commercial *</Text>
            <TextInput
              style={[styles.input, errors.business_name && styles.inputError]}
              value={formData.business_name}
              onChangeText={(text) => setFormData({ ...formData, business_name: text })}
              placeholder="Ex: Bio Épicerie du Coin"
            />
            {errors.business_name && <Text style={styles.errorText}>{errors.business_name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse complète *</Text>
            <TextInput
              style={[styles.input, errors.address && styles.inputError]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="15 Rue de la République, 75001 Paris"
              multiline
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type de commerce *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {BUSINESS_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    formData.business_type === type && styles.chipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, business_type: type })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.business_type === type && styles.chipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.business_type && <Text style={styles.errorText}>{errors.business_type}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom du contact *</Text>
            <TextInput
              style={[styles.input, errors.contact_name && styles.inputError]}
              value={formData.contact_name}
              onChangeText={(text) => setFormData({ ...formData, contact_name: text })}
              placeholder="Prénom Nom"
            />
            {errors.contact_name && <Text style={styles.errorText}>{errors.contact_name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.contact_email && styles.inputError]}
              value={formData.contact_email}
              onChangeText={(text) => setFormData({ ...formData, contact_email: text })}
              placeholder="contact@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.contact_email && <Text style={styles.errorText}>{errors.contact_email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone *</Text>
            <TextInput
              style={[styles.input, errors.contact_phone && styles.inputError]}
              value={formData.contact_phone}
              onChangeText={(text) => setFormData({ ...formData, contact_phone: text })}
              placeholder="06 12 34 56 78"
              keyboardType="phone-pad"
            />
            {errors.contact_phone && <Text style={styles.errorText}>{errors.contact_phone}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations complémentaires</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Site web</Text>
            <TextInput
              style={styles.input}
              value={formData.website}
              onChangeText={(text) => setFormData({ ...formData, website: text })}
              placeholder="https://www.exemple.com"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Présentez votre établissement et votre engagement anti-gaspi..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Volume anti-gaspi estimé</Text>
            <TextInput
              style={styles.input}
              value={formData.estimated_volume}
              onChangeText={(text) => setFormData({ ...formData, estimated_volume: text })}
              placeholder="Ex: 50kg/semaine, 10 paniers/jour..."
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Envoyer la demande</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  intro: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 24, textAlign: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  inputError: { borderColor: '#d32f2f' },
  textArea: { height: 100, textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: '#d32f2f', marginTop: 4 },
  chipsScroll: { marginTop: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5', marginRight: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  chipActive: { backgroundColor: '#4C7B4B', borderColor: '#4C7B4B' },
  chipText: { fontSize: 14, color: '#666', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4C7B4B', borderRadius: 8, padding: 16, marginTop: 24, gap: 8 },
  submitButtonDisabled: { backgroundColor: '#999' },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});
