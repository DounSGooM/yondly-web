import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Bannière publicitaire affichée lors des transactions en espèces.
 * Remplacer le contenu par une vraie intégration AdMob quand disponible.
 */
interface CashAdBannerProps {
  onClose?: () => void;
}

export default function CashAdBanner({ onClose }: CashAdBannerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.adLabel}>
        <Text style={styles.adLabelText}>Publicité</Text>
      </View>
      <View style={styles.adContent}>
        <Ionicons name="megaphone-outline" size={28} color="#4C7B4B" />
        <View style={styles.adText}>
          <Text style={styles.adTitle}>Espace publicitaire</Text>
          <Text style={styles.adSubtitle}>
            Vous utilisez le paiement en espèces. Des publicités nous permettent de maintenir le service gratuit.
          </Text>
        </View>
      </View>
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={18} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
    position: 'relative',
  },
  adLabel: {
    position: 'absolute',
    top: 6,
    right: 10,
  },
  adLabelText: {
    fontSize: 10,
    color: '#9ca3af',
    letterSpacing: 0.5,
  },
  adContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adText: {
    flex: 1,
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  adSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  closeButton: {
    position: 'absolute',
    bottom: 8,
    right: 10,
  },
});
