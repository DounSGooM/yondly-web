import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config/api';

// Notation 3 axes d'un panier anti-gaspi.
const AXES = [
  { key: 'quality', label: 'Qualité', hint: 'Les produits étaient-ils bons ?', icon: 'leaf' },
  { key: 'quantity', label: 'Quantité', hint: 'La quantité correspondait-elle ?', icon: 'cube' },
  { key: 'conformity', label: 'Conformité', hint: 'Conforme à la description ?', icon: 'checkmark-done' },
] as const;

type AxisKey = (typeof AXES)[number]['key'];

function StarRow({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={28}
            color={n <= value ? '#F59E0B' : '#D1D5DB'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function BasketReviewModal({
  visible,
  orderId,
  storeName,
  token,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  orderId: string;
  storeName?: string;
  token: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [ratings, setRatings] = useState<Record<AxisKey, number>>({ quality: 0, quantity: 0, conformity: 0 });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setAxis = (k: AxisKey, n: number) => setRatings(prev => ({ ...prev, [k]: n }));
  const allRated = ratings.quality > 0 && ratings.quantity > 0 && ratings.conformity > 0;

  const submit = async () => {
    if (!allRated) {
      Alert.alert('Note incomplète', 'Merci de noter les 3 critères.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/baskets/${orderId}/review`,
        {
          quality: ratings.quality,
          quantity: ratings.quantity,
          conformity: ratings.conformity,
          comment: comment.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess?.();
      onClose();
      Alert.alert('Merci ! 🌱', 'Votre avis aide à garantir la qualité anti-gaspi.');
      setRatings({ quality: 0, quantity: 0, conformity: 0 });
      setComment('');
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || "Impossible d'envoyer l'avis");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Noter votre panier</Text>
          {storeName ? <Text style={styles.subtitle}>{storeName}</Text> : null}

          {AXES.map(axis => (
            <View key={axis.key} style={styles.axisBlock}>
              <View style={styles.axisHeader}>
                <Ionicons name={axis.icon as any} size={16} color="#2D7D46" />
                <Text style={styles.axisLabel}>{axis.label}</Text>
              </View>
              <Text style={styles.axisHint}>{axis.hint}</Text>
              <StarRow value={ratings[axis.key]} onChange={n => setAxis(axis.key, n)} />
            </View>
          ))}

          <TextInput
            style={styles.comment}
            placeholder="Commentaire (optionnel)"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!allRated || submitting) && styles.submitBtnDisabled]}
            onPress={submit}
            disabled={!allRated || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Envoyer mon avis</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Plus tard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 2, marginBottom: 12 },
  axisBlock: { marginTop: 14 },
  axisHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  axisLabel: { fontSize: 15, fontWeight: '600', color: '#111' },
  axisHint: { fontSize: 12.5, color: '#6B7280', marginTop: 2, marginBottom: 6 },
  starRow: { flexDirection: 'row', gap: 8 },
  comment: {
    marginTop: 18,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    minHeight: 64,
    fontSize: 14,
    color: '#111',
  },
  submitBtn: {
    marginTop: 18,
    backgroundColor: '#2D7D46',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: '#6B7280', fontSize: 14 },
});
