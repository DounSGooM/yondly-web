import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/api';

interface Partner {
  id: string;
  business_name: string;
  business_type?: string;
  promo_code?: string;
  description?: string;
}

// Fallback si aucun partenaire actif en base
const FALLBACK_PARTNERS: Partner[] = [
  { id: 'f1', business_name: 'La Recyclerie', business_type: 'Ressourcerie solidaire' },
  { id: 'f2', business_name: 'Atelier Vélo 86', business_type: 'Réparation & vente de vélos' },
  { id: 'f3', business_name: 'Le Coin du Marché', business_type: 'Producteurs locaux' },
];

interface Props {
  city?: string;
}

export default function PartenaireLocalSpot({ city }: Props) {
  const { user } = useAuthStore();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchPartner();
  }, []);

  const fetchPartner = async () => {
    try {
      const userCity = city || (user as any)?.location?.city;
      const params = userCity ? `?city=${encodeURIComponent(userCity)}` : '';
      const res = await axios.get(`${API_URL}/partners/active${params}`);
      const list: Partner[] = res.data;
      if (list.length > 0) {
        setPartner(list[Math.floor(Math.random() * list.length)]);
      } else {
        const fallback = FALLBACK_PARTNERS;
        setPartner(fallback[Math.floor(Math.random() * fallback.length)]);
      }
    } catch {
      const fallback = FALLBACK_PARTNERS;
      setPartner(fallback[Math.floor(Math.random() * fallback.length)]);
    }
  };

  if (dismissed || !partner) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="storefront-outline" size={12} color="#4C7B4B" />
          <Text style={styles.badgeText}>Partenaire local engagé</Text>
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
          <Text style={styles.partnerName}>{partner.business_name}</Text>
          {partner.business_type && (
            <Text style={styles.partnerType}>{partner.business_type}</Text>
          )}
        </View>
      </View>

      {partner.description && (
        <Text style={styles.description}>{partner.description}</Text>
      )}

      {partner.promo_code && (
        <View style={styles.promoBox}>
          <Ionicons name="pricetag-outline" size={14} color="#D97706" />
          <Text style={styles.promoText}>Code : <Text style={styles.promoCode}>{partner.promo_code}</Text></Text>
        </View>
      )}

      <View style={styles.divider} />
      <Text style={styles.footer}>
        Cette vente réemployée est soutenue par un partenaire de proximité. 🌱
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
  badgeText: { fontSize: 11, color: '#4C7B4B', fontWeight: '600' },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logoPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#dcfce7',
    justifyContent: 'center', alignItems: 'center',
  },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 15, fontWeight: '700', color: '#1a3a1a', marginBottom: 2 },
  partnerType: { fontSize: 12, color: '#4C7B4B' },
  description: { fontSize: 12, color: '#374151', lineHeight: 18, marginBottom: 8 },
  promoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7', padding: 8, borderRadius: 8, marginBottom: 8,
  },
  promoText: { fontSize: 13, color: '#92400E' },
  promoCode: { fontWeight: '800', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: '#bbf7d0', marginBottom: 8 },
  footer: { fontSize: 11, color: '#4C7B4B', lineHeight: 16 },
});
