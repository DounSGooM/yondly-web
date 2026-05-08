import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Item } from '../../src/types';
import ItemGridCard from '../../src/components/ItemGridCard';
import { useAuthStore } from '../../src/store/authStore';
import * as Location from 'expo-location';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { API_URL } from '../../src/config/api';

type Section = { title: string; icon: string; color: string; items: Item[]; route: string };

export default function AccueilScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [donations, setDonations] = useState<Item[]>([]);
  const [sales, setSales] = useState<Item[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    getUserLocation();
    fetchAll();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {}
  };

  const fetchAll = async () => {
    try {
      const params = userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : {};
      const [donRes, saleRes, dealRes] = await Promise.allSettled([
        axios.get(`${API_URL}/items`, { params: { ...params, type: 'donation', limit: 6 } }),
        axios.get(`${API_URL}/items`, { params: { ...params, type: 'sale', limit: 6 } }),
        axios.get(`${API_URL}/deals`, { params }),
      ]);
      const now = new Date();
      if (donRes.status === 'fulfilled') {
        setDonations(donRes.value.data.filter((i: Item) => !i.locked_until || new Date(i.locked_until) < now).slice(0, 6));
      }
      if (saleRes.status === 'fulfilled') {
        setSales(saleRes.value.data.filter((i: Item) => !i.locked_until || new Date(i.locked_until) < now).slice(0, 6));
      }
      if (dealRes.status === 'fulfilled') {
        setDeals(dealRes.value.data.slice(0, 6));
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const sections: Section[] = [
    { title: 'Dons alimentaires', icon: 'leaf', color: colors.primary, items: donations, route: '/(tabs)/alimentaire' },
    { title: 'Anti-gaspi du moment', icon: 'timer', color: colors.accent, items: deals, route: '/(tabs)/alimentaire' },
    { title: 'Réemploi local', icon: 'swap-horizontal', color: colors.info, items: sales, route: '/(tabs)/reemploi' },
  ];

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={colors.primary} colors={[colors.primary]} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour{user ? ` ${user.display_name?.split(' ')[0]}` : ''} 👋</Text>
            <Text style={styles.subtitle}>Voici ce qui se passe près de chez vous</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/messages' as any)}>
            <Ionicons name="chatbubble-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      }
      data={sections}
      keyExtractor={(s) => s.title}
      renderItem={({ item: section }) => (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: section.color + '18' }]}>
              <Ionicons name={section.icon as any} size={16} color={section.color} />
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <TouchableOpacity onPress={() => router.push(section.route as any)} style={styles.seeAll}>
              <Text style={[styles.seeAllText, { color: section.color }]}>Tout voir</Text>
              <Ionicons name="chevron-forward" size={14} color={section.color} />
            </TouchableOpacity>
          </View>

          {section.items.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>Aucun contenu pour l'instant</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={section.items}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.hList}
              renderItem={({ item }) => (
                <View style={styles.hCard}>
                  <ItemGridCard item={item} layout="grid" />
                </View>
              )}
            />
          )}
        </View>
      )}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  content: { paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: Spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  greeting: {
    fontSize: Typography.xl,
    fontWeight: Typography.heavy as any,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: Typography.heavy as any,
    color: colors.textPrimary,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
  },

  hList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  hCard: {
    width: 160,
  },

  emptySection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  emptySectionText: {
    fontSize: Typography.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
});
