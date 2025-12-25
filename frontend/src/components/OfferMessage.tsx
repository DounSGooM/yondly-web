import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Offer, Message } from '../types';

import { API_URL } from '../config/api';

interface OfferMessageProps {
  message: Message;
  offer: Offer;
  isCurrentUserSeller: boolean;
  currentUserId: string;
  onOfferUpdated: () => void;
}

export default function OfferMessage({ message, offer, isCurrentUserSeller, currentUserId, onOfferUpdated }: OfferMessageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');

  const isCurrentUserBuyer = offer.buyer_id === currentUserId;

  // Calculate time remaining if offer is accepted
  useEffect(() => {
    if (offer.status === 'accepted' && offer.expires_at) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(offer.expires_at!).getTime();
        const diff = expiry - now;

        if (diff <= 0) {
          setTimeRemaining('Expiré');
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m restantes`);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [offer.status, offer.expires_at]);

  const handleAccept = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      console.log('Token retrieved for accept:', token ? 'Present' : 'Missing');

      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour accepter une offre');
        return;
      }

      await axios.put(
        `${API_URL}/offers/${offer.id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Succès', 'Offre acceptée! L\'acheteur a 4h pour finaliser.');
      onOfferUpdated();
    } catch (error: any) {
      console.error('Error accepting offer:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Erreur', error.response?.data?.detail || 'Impossible d\'accepter l\'offre');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    Alert.alert(
      'Refuser l\'offre',
      'Êtes-vous sûr de vouloir refuser cette offre?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('auth_token');
              console.log('Token retrieved for decline:', token ? 'Present' : 'Missing');

              if (!token) {
                Alert.alert('Erreur', 'Vous devez être connecté pour refuser une offre');
                return;
              }

              await axios.put(
                `${API_URL}/offers/${offer.id}/decline`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Offre refusée');
              onOfferUpdated();
            } catch (error: any) {
              console.error('Error declining offer:', error);
              console.error('Error details:', error.response?.data);
              Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de refuser l\'offre');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCounter = async () => {
    const amount = parseFloat(counterAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Montant invalide');
      return;
    }

    const amountCents = Math.round(amount * 100);

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth_token');
      console.log('Token retrieved for counter:', token ? 'Present' : 'Missing');

      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour faire une contre-offre');
        return;
      }

      await axios.put(
        `${API_URL}/offers/${offer.id}/counter?counter_amount_cents=${amountCents}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Succès', 'Contre-offre envoyée!');
      setShowCounterModal(false);
      setCounterAmount('');
      onOfferUpdated();
    } catch (error: any) {
      console.error('Error sending counter offer:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Erreur', error.response?.data?.detail || 'Impossible d\'envoyer la contre-offre');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (offer.status) {
      case 'accepted':
        return '#4C7B4B';
      case 'declined':
        return '#d32f2f';
      case 'countered':
        return '#f57c00';
      case 'expired':
        return '#999';
      default:
        return '#1976d2';
    }
  };

  const getStatusLabel = () => {
    switch (offer.status) {
      case 'accepted':
        return 'Acceptée';
      case 'declined':
        return 'Refusée';
      case 'countered':
        return 'Contre-offre';
      case 'expired':
        return 'Expirée';
      default:
        return 'En attente';
    }
  };

  return (
    <View style={[styles.container, { borderLeftColor: getStatusColor() }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.badgeText}>OFFRE</Text>
        </View>
        <Text style={[styles.status, { color: getStatusColor() }]}>{getStatusLabel()}</Text>
      </View>

      <Text style={styles.messageText}>{message.text}</Text>

      {offer.counter_offer_amount_cents && offer.status === 'countered' && (
        <View style={styles.counterInfo}>
          <Ionicons name="sync" size={16} color="#f57c00" />
          <Text style={styles.counterText}>
            Contre-offre: {(offer.counter_offer_amount_cents / 100).toFixed(2)}€
          </Text>
        </View>
      )}

      {isCurrentUserSeller && offer.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={handleAccept}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>Accepter</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.counterButton]}
            onPress={() => setShowCounterModal(true)}
            disabled={loading}
          >
            <Ionicons name="sync" size={20} color="#fff" />
            <Text style={styles.buttonText}>Contre-offre</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
            disabled={loading}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>Refuser</Text>
          </TouchableOpacity>
        </View>
      )}

      {isCurrentUserBuyer && offer.status === 'countered' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton, { flex: 1 }]}
            onPress={handleAccept}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>Accepter contre-offre</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.declineButton, { flex: 1 }]}
            onPress={handleDecline}
            disabled={loading}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>Refuser</Text>
          </TouchableOpacity>
        </View>
      )}

      {isCurrentUserBuyer && offer.status === 'accepted' && (
        <View>
          <View style={styles.timerContainer}>
            <Ionicons name="time" size={20} color="#d32f2f" />
            <Text style={styles.timerText}>⏱️ {timeRemaining}</Text>
          </View>
          <TouchableOpacity
            style={styles.paymentButton}
            onPress={() => {
              // Navigate to checkout with itemId
              router.push({
                pathname: '/checkout',
                params: { itemId: message.item_id }
              });
            }}
          >
            <Ionicons name="card" size={24} color="#fff" />
            <Text style={styles.paymentButtonText}>Payer maintenant</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Counter Offer Modal */}
      <Modal visible={showCounterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Faire une contre-offre</Text>
            <Text style={styles.modalSubtitle}>
              Offre initiale: {(offer.amount_cents / 100).toFixed(2)}€
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Votre contre-offre (€)</Text>
              <TextInput
                style={styles.input}
                value={counterAmount}
                onChangeText={setCounterAmount}
                keyboardType="decimal-pad"
                placeholder="Ex: 15.50"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowCounterModal(false);
                  setCounterAmount('');
                }}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleCounter}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Envoyer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
    fontWeight: '500',
  },
  counterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  counterText: {
    fontSize: 14,
    color: '#f57c00',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#4C7B4B',
  },
  counterButton: {
    backgroundColor: '#f57c00',
  },
  declineButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f5',
  },
  modalConfirmButton: {
    backgroundColor: '#f57c00',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  timerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4C7B4B',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 10,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
