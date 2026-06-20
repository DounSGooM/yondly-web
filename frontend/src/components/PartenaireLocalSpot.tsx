import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Partner {
  name: string;
  tagline: string;
  logoPlaceholder?: string;
}

// Partenaires locaux fictifs — à remplacer par une API partenaires
const LOCAL_PARTNERS: Partner[] = [
  { name: 'La Carotte', tagline: 'Épicerie vrac & produits locaux' },
  { name: 'Atelier Vélo Quartier', tagline: 'Réparation & vente de vélos de seconde main' },
  { name: 'La Recyclerie', tagline: 'Ressourcerie solidaire de Poitiers' },
  { name: 'Le Coin du Marché', tagline: 'Producteurs locaux du Grand Poitiers' },
];

interface PartenaireLocalSpotProps {
  onConfirm: () => void;
  confirmed?: boolean;
}

export default function PartenaireLocalSpot({ onConfirm, confirmed }: PartenaireLocalSpotProps) {
  const [partner] = useState(() =>
    LOCAL_PARTNERS[Math.floor(Math.random() * LOCAL_PARTNERS.length)]
  );
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="storefront-outline" size={12} color="#4C7B4B" />
          <Text style={styles.badgeText}>Partenaire local</Text>
        </View>
        <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Ionicons name="close" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <View style={styles.partnerRow}>
        <View style={styles.logoPlaceholder}>
          <Ionicons name="leaf" size={22} color="#4C7B4B" />
        </View>
        <View style={styles.partnerInfo}>
          <Text style={styles.partnerName}>{partner.name}</Text>
          <Text style={styles.partnerTagline}>{partner.tagline}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.message}>
        Cette vente réemployée est soutenue par un partenaire de proximité.
        Merci de contribuer à l'économie locale 🌱
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    color: '#4C7B4B',
    fontWeight: '600',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a3a1a',
    marginBottom: 2,
  },
  partnerTagline: {
    fontSize: 12,
    color: '#4C7B4B',
  },
  divider: {
    height: 1,
    backgroundColor: '#bbf7d0',
    marginBottom: 10,
  },
  message: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
});
