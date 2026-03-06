import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Store } from '../types';
import { useRouter } from 'expo-router';

interface StoreCardProps {
  store: Store;
}

const BADGE_COLORS = {
  basic: '#757575',
  plus: '#1976d2',
  premium: '#f57c00',
};

const BADGE_LABELS = {
  basic: 'Basic',
  plus: 'Plus',
  premium: 'Premium',
};

export default function StoreCard({ store }: StoreCardProps) {
  const router = useRouter();

  const isOpen = () => {
    if (!store.hours) return null;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const hours = store.hours[today as keyof typeof store.hours];
    
    if (!hours || hours === 'Fermé') return false;
    
    // Simple check if current time is within hours (simplified)
    const now = new Date().getHours();
    const [open] = hours.split('-');
    const [openHour] = open.split(':').map(Number);
    
    return now >= openHour && now < 20; // Simplified logic
  };

  const openStatus = isOpen();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/store-detail?storeId=${store.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.storeName} numberOfLines={1}>
            {store.name}
          </Text>
          <View style={[styles.badge, { backgroundColor: BADGE_COLORS[store.badge_type] }]}>
            <Text style={styles.badgeText}>{BADGE_LABELS[store.badge_type]}</Text>
          </View>
        </View>
        <Text style={styles.category}>{store.category}</Text>
      </View>

      {store.description && (
        <Text style={styles.description} numberOfLines={2}>
          {store.description}
        </Text>
      )}

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText} numberOfLines={1}>
            {store.address.split(',')[0]}
          </Text>
        </View>
        {store.distance_km !== undefined && (
          <Text style={styles.distance}>
            {store.distance_km < 1 
              ? `${Math.round(store.distance_km * 1000)}m`
              : `${store.distance_km.toFixed(1)}km`
            }
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.statusRow}>
          {openStatus !== null && (
            <View style={[styles.statusBadge, openStatus ? styles.openBadge : styles.closedBadge]}>
              <View style={[styles.statusDot, openStatus ? styles.openDot : styles.closedDot]} />
              <Text style={[styles.statusText, openStatus ? styles.openText : styles.closedText]}>
                {openStatus ? 'Ouvert' : 'Fermé'}
              </Text>
            </View>
          )}
          {store.deals && store.deals.length > 0 && (
            <View style={styles.dealsBadge}>
              <Ionicons name="pricetag" size={14} color="#d32f2f" />
              <Text style={styles.dealsText}>{store.deals.length} deal{store.deals.length > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.followersRow}>
          <Ionicons name="people-outline" size={16} color="#999" />
          <Text style={styles.followersText}>{store.followers_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  category: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4C7B4B',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openBadge: {
    backgroundColor: '#e8f5e9',
  },
  closedBadge: {
    backgroundColor: '#ffebee',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  openDot: {
    backgroundColor: '#4C7B4B',
  },
  closedDot: {
    backgroundColor: '#d32f2f',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  openText: {
    color: '#4C7B4B',
  },
  closedText: {
    color: '#d32f2f',
  },
  dealsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dealsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d32f2f',
    marginLeft: 4,
  },
  followersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followersText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
});
