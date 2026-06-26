import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { API_URL } from '../../src/config/api';

const REASONS = [
  { id: 'not_consumable', label: 'Manifestement non consommable', icon: 'close-circle' },
  { id: 'expired', label: 'Produit périmé', icon: 'calendar' },
  { id: 'cold_or_spoiled', label: 'Froid / avarié', icon: 'snow' },
  { id: 'far_from_description', label: 'Très éloigné de la description', icon: 'alert-circle' },
  { id: 'too_old', label: 'Trop vieux', icon: 'time' },
  { id: 'quantity_short', label: 'Quantité très inférieure', icon: 'remove-circle' },
  { id: 'other', label: 'Autre', icon: 'ellipsis-horizontal' },
];

export default function BasketReportScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { token } = useAuthStore();
  const [reason, setReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason) {
      Alert.alert('Motif requis', 'Sélectionne un motif de signalement.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/baskets/${orderId}/report`,
        { reason, description: description.trim() || null, photos: [] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert(
        'Signalement envoyé',
        "Merci. Notre équipe va examiner ce panier. Si le panier est jugé non conforme, tu seras remboursé en crédit Yondly.",
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || "Impossible d'envoyer le signalement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signaler un panier</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Ionicons name="shield-checkmark" size={18} color="#2D7D46" />
          <Text style={styles.bannerText}>
            On sauve un produit encore bon — pas les déchets du commerçant. Si ton panier n'est pas
            conforme, signale-le : c'est remboursé en crédit Yondly.
          </Text>
        </View>

        <Text style={styles.label}>Que s'est-il passé ?</Text>
        {REASONS.map(r => {
          const active = reason === r.id;
          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.reasonRow, active && styles.reasonRowActive]}
              onPress={() => setReason(r.id)}
            >
              <Ionicons name={r.icon as any} size={20} color={active ? '#DC2626' : '#6B7280'} />
              <Text style={[styles.reasonText, active && styles.reasonTextActive]}>{r.label}</Text>
              {active && <Ionicons name="checkmark-circle" size={20} color="#DC2626" />}
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.label, { marginTop: 20 }]}>Détails (optionnel)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Décris le problème pour aider notre équipe…"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (!reason || loading) && styles.submitBtnDisabled]}
          onPress={submit}
          disabled={!reason || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Envoyer le signalement</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { padding: 20, paddingBottom: 100 },
  banner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#E8F5EC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  bannerText: { flex: 1, fontSize: 12.5, color: '#1a5c30', lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 8,
  },
  reasonRowActive: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  reasonText: { flex: 1, fontSize: 14.5, color: '#374151' },
  reasonTextActive: { color: '#DC2626', fontWeight: '600' },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    color: '#111',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  submitBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
