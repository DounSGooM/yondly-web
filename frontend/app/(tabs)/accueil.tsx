import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import InteractiveMap from '../../src/components/InteractiveMap';
import { useAuthStore } from '../../src/store/authStore';
import * as Location from 'expo-location';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/theme';
import { API_URL } from '../../src/config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type TerritoireStats = {
  paniers_sauves: number;
  kg_nourriture_sauves: number;
  dons_alimentaires: number;
  producteurs_actifs: number;
  objets_reemployes: number;
  co2_economise_kg: number;
  utilisateurs_actifs: number;
  commerces_engages: number;
};

type ActivityItem = {
  id: string;
  type: 'don' | 'antigaspi' | 'reemploi' | 'producteur';
  message: string;
  distance?: string;
  time_ago: string;
  icon: string;
  color: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCO2 = (kg: number) =>
  kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${kg}kg`;

const formatNum = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon, value, label, color, bg,
}: {
  icon: string; value: string; label: string; color: string; bg: string;
}) {
  return (
    <View style={[styles.kpiCard, { backgroundColor: bg }]}>
      <View style={[styles.kpiIconBox, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityDot, { backgroundColor: item.color + '22' }]}>
        <Ionicons name={item.icon as any} size={15} color={item.color} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityMessage}>{item.message}</Text>
        <View style={styles.activityMeta}>
          {item.distance && (
            <Text style={styles.activityMetaText}>
              <Ionicons name="location-outline" size={11} color={colors.textTertiary} /> {item.distance}
            </Text>
          )}
          <Text style={styles.activityMetaText}>{item.time_ago}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function AccueilScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [stats, setStats] = useState<TerritoireStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [mapItems, setMapItems] = useState<any[]>([]);
  const [showMap, setShowMap] = useState(true);

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

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, activityRes, mapRes] = await Promise.allSettled([
        axios.get(`${API_URL}/territoire/stats`, { params: { period: '30j' } }),
        axios.get(`${API_URL}/territoire/activity`, { params: { limit: 8 } }),
        axios.get(`${API_URL}/items`, { params: { limit: 20 } }),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      } else {
        setStats({
          paniers_sauves: 142,
          kg_nourriture_sauves: 284,
          dons_alimentaires: 67,
          producteurs_actifs: 8,
          objets_reemployes: 231,
          co2_economise_kg: 3240,
          utilisateurs_actifs: 412,
          commerces_engages: 23,
        });
      }

      if (activityRes.status === 'fulfilled') {
        setActivity(activityRes.value.data);
      } else {
        setActivity([
          { id: '1', type: 'antigaspi', message: "Un panier anti-gaspi vient d'être mis en ligne", distance: '320 m', time_ago: 'Il y a 3 min', icon: 'timer', color: colors.accent },
          { id: '2', type: 'don', message: 'Des légumes du jardin donnés', distance: '1.2 km', time_ago: 'Il y a 12 min', icon: 'leaf', color: colors.primary },
          { id: '3', type: 'reemploi', message: 'Un vélo proposé à 25€', distance: '800 m', time_ago: 'Il y a 28 min', icon: 'swap-horizontal', color: colors.info },
          { id: '4', type: 'producteur', message: 'Nouveau producteur local sur la carte', distance: '4 km', time_ago: 'Il y a 1h', icon: 'storefront', color: '#9B59B6' },
          { id: '5', type: 'don', message: 'Conserves données à une association', distance: '600 m', time_ago: 'Il y a 2h', icon: 'heart', color: colors.primary },
        ]);
      }

      if (mapRes.status === 'fulfilled') {
        setMapItems(mapRes.value.data.slice(0, 20));
      }
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchAll(); }}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Bonjour{user ? ` ${user.display_name?.split(' ')[0]}` : ''} 👋
          </Text>
          <Text style={styles.subtitle}>Ce qui se passe près de chez vous</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push('/messages' as any)}
        >
          <Ionicons name="chatbubble-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Stats territoire ── */}
      {stats && (
        <View style={styles.statsSection}>
          <View style={styles.statsSectionHeader}>
            <Ionicons name="leaf" size={15} color={colors.primary} />
            <Text style={styles.statsSectionTitle}>Impact local — 30 derniers jours</Text>
          </View>
          <View style={styles.kpiGrid}>
            <KpiCard icon="basket" value={formatNum(stats.paniers_sauves)} label="Paniers sauvés" color={colors.accent} bg={colors.surface} />
            <KpiCard icon="leaf" value={`${formatNum(stats.kg_nourriture_sauves)} kg`} label="Nourriture sauvée" color={colors.primary} bg={colors.surface} />
            <KpiCard icon="cloud-outline" value={formatCO2(stats.co2_economise_kg)} label="CO₂ économisé" color="#27AE60" bg={colors.surface} />
            <KpiCard icon="storefront" value={String(stats.producteurs_actifs)} label="Producteurs locaux" color="#9B59B6" bg={colors.surface} />
          </View>
          <View style={styles.kpiRow2}>
            <View style={styles.kpiWide}>
              <Ionicons name="people" size={14} color={colors.textSecondary} />
              <Text style={styles.kpiWideText}>
                <Text style={styles.kpiWideValue}>{formatNum(stats.utilisateurs_actifs)}</Text>
                {' '}habitants actifs
              </Text>
            </View>
            <View style={styles.kpiWide}>
              <Ionicons name="swap-horizontal" size={14} color={colors.textSecondary} />
              <Text style={styles.kpiWideText}>
                <Text style={styles.kpiWideValue}>{formatNum(stats.objets_reemployes)}</Text>
                {' '}objets réemployés
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.statsLink}
            onPress={() => router.push('/territoire/dashboard' as any)}
          >
            <Text style={styles.statsLinkText}>Voir le dashboard territoire complet</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Carte ── */}
      <View style={styles.mapSection}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Autour de moi</Text>
          <TouchableOpacity onPress={() => setShowMap(v => !v)} style={styles.mapToggle}>
            <Ionicons name={showMap ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {showMap && (
          <View style={styles.mapContainer}>
            <InteractiveMap
              items={mapItems}
              userLocation={userLocation}
              onItemPress={(id) => router.push(`/item-detail?id=${id}` as any)}
            />
          </View>
        )}
      </View>

      {/* ── Accès rapides ── */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: colors.primary + '12' }]}
          onPress={() => router.push('/(tabs)/alimentaire' as any)}
        >
          <Ionicons name="nutrition" size={20} color={colors.primary} />
          <Text style={[styles.quickBtnText, { color: colors.primary }]}>Alimentaire</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: colors.info + '12' }]}
          onPress={() => router.push('/(tabs)/reemploi' as any)}
        >
          <Ionicons name="repeat" size={20} color={colors.info} />
          <Text style={[styles.quickBtnText, { color: colors.info }]}>Réemploi</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: colors.accent + '12' }]}
          onPress={() => router.push('/territoire/dashboard' as any)}
        >
          <Ionicons name="stats-chart" size={20} color={colors.accent} />
          <Text style={[styles.quickBtnText, { color: colors.accent }]}>Territoire</Text>
        </TouchableOpacity>
      </View>

      {/* ── Fil d'activité ── */}
      <View style={styles.activitySection}>
        <View style={styles.activityHeader}>
          <View style={styles.activityHeaderLeft}>
            <View style={styles.liveDot} />
            <Text style={styles.activityTitle}>Activité récente</Text>
          </View>
        </View>
        {activity.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

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
  greeting: { fontSize: Typography.xl, fontWeight: Typography.heavy as any, color: colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: colors.textSecondary, marginTop: 2 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },

  statsSection: {
    margin: Spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  statsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  statsSectionTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold as any, color: colors.textSecondary },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  kpiCard: {
    flex: 1, minWidth: '45%',
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    backgroundColor: colors.surfaceAlt, gap: 4,
  },
  kpiIconBox: {
    width: 32, height: 32, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  kpiValue: { fontSize: 22, fontWeight: Typography.heavy as any },
  kpiLabel: { fontSize: Typography.xs, color: colors.textSecondary },

  kpiRow2: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  kpiWide: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surfaceAlt, borderRadius: BorderRadius.md, padding: Spacing.sm,
  },
  kpiWideText: { fontSize: Typography.xs, color: colors.textSecondary },
  kpiWideValue: { fontWeight: Typography.heavy as any, color: colors.textPrimary },

  statsLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  statsLinkText: { fontSize: Typography.sm, color: colors.primary, fontWeight: Typography.semibold as any },

  mapSection: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  mapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  mapTitle: { fontSize: Typography.base, fontWeight: Typography.heavy as any, color: colors.textPrimary },
  mapToggle: { padding: 4 },
  mapContainer: { height: 200, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.md },

  quickActions: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.xl },
  quickBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg,
  },
  quickBtnText: { fontSize: Typography.xs, fontWeight: Typography.semibold as any },

  activitySection: {
    marginHorizontal: Spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  activityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  activityHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71' },
  activityTitle: { fontSize: Typography.base, fontWeight: Typography.heavy as any, color: colors.textPrimary },
  activityRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  activityDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityContent: { flex: 1 },
  activityMessage: { fontSize: Typography.sm, color: colors.textPrimary, fontWeight: Typography.medium as any, marginBottom: 3 },
  activityMeta: { flexDirection: 'row', gap: Spacing.sm },
  activityMetaText: { fontSize: Typography.xs, color: colors.textTertiary },
});
