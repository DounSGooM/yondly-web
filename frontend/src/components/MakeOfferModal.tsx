import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MakeOfferModalProps {
  visible: boolean;
  onClose: () => void;
  originalPrice: number; // in cents
  isRental?: boolean;
  onOfferSubmit: (amountCents: number) => Promise<void>;
}

export default function MakeOfferModal({
  visible,
  onClose,
  originalPrice,
  isRental = false,
  onOfferSubmit,
}: MakeOfferModalProps) {
  const [loading, setLoading] = useState(false);

  const discountOptions = [
    { percentage: 5, label: '-5%' },
    { percentage: 10, label: '-10%' },
    { percentage: 15, label: '-15%' },
  ];

  const calculateDiscountedPrice = (percentage: number) => {
    return Math.round(originalPrice * (1 - percentage / 100));
  };

  const formatPrice = (cents: number) => {
    return isRental ? `${(cents / 100).toFixed(2)}€/j` : `${(cents / 100).toFixed(2)}€`;
  };

  const handleOfferPress = async (percentage: number) => {
    const discountedAmount = calculateDiscountedPrice(percentage);

    Alert.alert(
      'Confirmer l\'offre',
      `Proposer ${formatPrice(discountedAmount)} au lieu de ${formatPrice(originalPrice)} ?\n\nLe propriétaire pourra accepter ou refuser votre offre.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            setLoading(true);
            try {
              await onOfferSubmit(discountedAmount);
              onClose();
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.detail || 'Impossible d\'envoyer l\'offre');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{isRental ? 'Négocier le loyer' : 'Faire une offre'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Prix actuel : {formatPrice(originalPrice)}
          </Text>
          <Text style={styles.info}>
            Choisissez une réduction :
          </Text>

          <View style={styles.optionsContainer}>
            {discountOptions.map((option) => {
              const discountedPrice = calculateDiscountedPrice(option.percentage);
              const savedAmount = originalPrice - discountedPrice;

              return (
                <TouchableOpacity
                  key={option.percentage}
                  style={styles.optionButton}
                  onPress={() => handleOfferPress(option.percentage)}
                  disabled={loading}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{option.label}</Text>
                    </View>
                    <View style={styles.priceInfo}>
                      <Text style={styles.newPrice}>{formatPrice(discountedPrice)}</Text>
                      <Text style={styles.savings}>Économie : {formatPrice(savedAmount)}</Text>
                    </View>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#4C7B4B" />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.disclaimerText}>
              {isRental
                ? 'L\'offre s\'applique au prix par jour. Si acceptée, elle sera valide pour votre prochaine réservation.'
                : '1 offre par article / 24h • Max 2 offres actives'}
            </Text>
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4C7B4B" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  discountBadge: {
    backgroundColor: '#4C7B4B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  discountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceInfo: {
    flex: 1,
  },
  newPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4C7B4B',
    marginBottom: 2,
  },
  savings: {
    fontSize: 12,
    color: '#666',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    gap: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
