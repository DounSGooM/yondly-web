import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import axios from 'axios';
import { getLevelBadge } from '../../src/utils/levelBadges';
import { calculateCO2Impact, formatCO2, getCO2Level, getCO2Equivalents } from '../../src/utils/co2Calculator';
import { API_URL } from '../../src/config/api';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/theme';

function CO2PreviewCard({ onPress }: { onPress: () => void }) {
  const { token } = useAuthStore();
  const [co2Data, setCo2Data] = useState({ basketsCount: 0, donationsCount: 0, salesCount: 0, rentalsCount: 0 });

  useEffect(() => {
    axios.get(`${API_URL}/users/me/impact`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setCo2Data(r.data))
      .catch(() => {});
  }, []);

  const co2Impact = calculateCO2Impact(co2Data.basketsCount, co2Data.donationsCount, co2Data.salesCount, co2Data.rentalsCount);
  const level = getCO2Level(co2Impact.totalCO2SavedKg);
  const equivalents = getCO2Equivalents(co2Impact.totalCO2SavedKg);

  return (
    <TouchableOpacity style={styles.co2Card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.co2Header}>
        <Text style={styles.co2Emoji}>{level.emoji}</Text>
        <View style={styles.co2HeaderRight}>
          <Text style={styles.co2LevelText}>{level.level}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </View>
      </View>

      <View style={styles.co2MainValue}>
        <Text style={styles.co2ValueText}>{formatCO2(co2Impact.totalCO2SavedKg)}</Text>
        <Text style={styles.co2ValueLabel}>de CO₂ économisé</Text>
      </View>

      <View style={styles.co2Equivalents}>
        <View style={styles.co2EquivItem}>
          <Text style={styles.co2EquivEmoji}>🌳</Text>
          <Text style={styles.co2EquivValue}>{equivalents.treeDays}j</Text>
        </View>
        <View style={styles.co2EquivDivider} />
        <View style={styles.co2EquivItem}>
          <Text style={styles.co2EquivEmoji}>🚗</Text>
          <Text style={styles.co2EquivValue}>{equivalents.carKm}km</Text>
        </View>
        <View style={styles.co2EquivDivider} />
        <View style={styles.co2EquivItem}>
          <Text style={styles.co2EquivEmoji}>📱</Text>
          <Text style={styles.co2EquivValue}>{equivalents.smartphoneCharges}</Text>
        </View>
      </View>

      <Text style={styles.co2SeeMore}>Voir les détails →</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser, isLoading } = useAuthStore();
  const [stats, setStats] = useState<{ total_transactions: number; people_helped: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && user.level !== 'Graine') fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth/stats`, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
      });
      setStats(response.data);
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (refreshUser) await refreshUser();
      if (user && user.level !== 'Graine') await fetchStats();
    } catch {}
    finally { setRefreshing(false); }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: () => {
          router.replace('/(auth)/login');
          setTimeout(async () => { await logout(); }, 100);
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notLoggedInText}>Connecte-toi pour voir ton profil</Text>
      </View>
    );
  }

  const badge = getLevelBadge(user.level || 'Graine');
  const levelTarget = user.level === 'Graine' ? 100 : user.level === 'Pousse' ? 500 : 2500;
  const progress = Math.min(((user.co2_saved || 0) / levelTarget) * 100, 100);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, user.profile_theme_color ? { borderTopColor: user.profile_theme_color, borderTopWidth: 4 } : {}]}>
        <TouchableOpacity
          style={[styles.editButton, user.profile_theme_color ? { backgroundColor: user.profile_theme_color + '20' } : {}]}
          onPress={() => router.push('/profile/edit' as any)}
        >
          <Ionicons name="pencil" size={20} color={user.profile_theme_color || colors.primary} />
        </TouchableOpacity>

        <View style={styles.avatar}>
          {user.photo_url ? (
            <Image source={{ uri: user.photo_url }} style={styles.avatarImage} />
          ) : (
            <Image
              source={require('../../assets/images/yondly-icon.png')}
              style={styles.avatarImage}
              resizeMode="contain"
            />
          )}
          <View style={[styles.levelBadge, { backgroundColor: badge.color }]}>
            <Text style={styles.levelBadgeEmoji}>{badge.emoji || '🌱'}</Text>
          </View>
        </View>

        <Text style={styles.name}>{user.display_name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.phone && <Text style={styles.phone}>{user.phone}</Text>}

        <TouchableOpacity style={styles.ratingRow} onPress={() => router.push('/profile/reviews' as any)}>
          <Ionicons name="star" size={16} color="#ffc107" />
          <Text style={styles.rating}>{user.ratings_avg?.toFixed(1) || '0.0'} ({user.ratings_count || 0} avis)</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {user.level === 'Graine' && (
          <View style={styles.seedGoal}>
            <Text style={styles.seedGoalLabel}>🌱 Graine d'Impact</Text>
            <Text style={styles.seedGoalText}>Prochain but: Débloquer les recherches sauvegardées (100kg)</Text>
          </View>
        )}

        {stats && user.level !== 'Graine' && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total_transactions}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.people_helped}</Text>
              <Text style={styles.statLabel}>Personnes aidées</Text>
            </View>
          </View>
        )}
      </View>

      {/* Level Card */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelLabel}>Niveau actuel</Text>
            <Text style={styles.levelTitle}>{badge.level}</Text>
          </View>
          <View style={[styles.pointsBadge, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.pointsText, { color: badge.color }]}>{Math.round(user.co2_saved || 0)} kg CO₂</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` as any, backgroundColor: badge.color }]} />
        </View>

        <Text style={styles.nextLevelText}>
          {user.level === 'Forêt'
            ? 'Niveau maximum atteint ! 🌲'
            : `${Math.round(levelTarget - (user.co2_saved || 0))} kg CO₂ avant le niveau ${user.level === 'Graine' ? 'Pousse' : user.level === 'Pousse' ? 'Arbre' : 'Forêt'}`}
        </Text>
      </View>

      {/* CO2 Impact Preview */}
      <CO2PreviewCard onPress={() => router.push('/profile/impact' as any)} />

      {/* Seller Space */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Espace Vendeur</Text>
        {[
          { icon: 'pricetags-outline', label: 'Mes annonces', path: '/my-items', accent: true },
          { icon: 'bar-chart-outline', label: 'Tableau de bord Vendeur', path: '/profile/analytics', accent: true },
          { icon: 'wallet-outline', label: 'Ma Tirelire', path: '/profile/wallet', accent: true },
        ].map((item) => (
          <TouchableOpacity key={item.path} style={styles.menuItem} onPress={() => router.push(item.path as any)}>
            <Ionicons name={item.icon as any} size={24} color={item.accent ? colors.primary : colors.textSecondary} />
            <Text style={styles.menuText}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Buyer Space */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Espace Acheteur</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/orders' as any)}>
          <Ionicons name="receipt-outline" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Mes Commandes & Réservations</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/saved-searches' as any)}>
          <Ionicons name="bookmarks-outline" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Recherches Sauvegardées</Text>
          {user.level === 'Graine' && <Ionicons name="lock-closed" size={16} color={colors.textTertiary} style={{ marginRight: Spacing.sm }} />}
          <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/disputes' as any)}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
          <Text style={styles.menuText}>Mes litiges</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>

        {['Arbre', 'Forêt'].includes(user.level) && (
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/public-lists' as any)}>
            <Ionicons name="color-palette-outline" size={24} color="#ffb74d" />
            <Text style={styles.menuText}>Pages Inspirations</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
        )}
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application</Text>
        {[
          { icon: 'shield-checkmark-outline', label: 'Sécurité et Confiance', path: '/profile/security' },
          { icon: 'settings-outline', label: 'Préférences', path: '/profile/settings' },
          { icon: 'help-circle-outline', label: 'Aide & Support', path: '/profile/help' },
        ].map((item) => (
          <TouchableOpacity key={item.path} style={styles.menuItem} onPress={() => router.push(item.path as any)}>
            <Ionicons name={item.icon as any} size={24} color={colors.textSecondary} />
            <Text style={styles.menuText}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={colors.error} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  notLoggedInText: {
    color: colors.textSecondary,
    fontSize: Typography.base,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
  },
  profileCard: {
    backgroundColor: colors.surface,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    position: 'relative',
    ...Shadows.md,
  },
  editButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    padding: Spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: BorderRadius.full,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  levelBadgeEmoji: {
    fontSize: 14,
  },
  name: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  phone: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  rating: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
  },
  seedGoal: {
    marginTop: Spacing.lg,
    backgroundColor: colors.surfaceAlt,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    width: '100%',
    alignItems: 'center',
  },
  seedGoalLabel: {
    fontSize: Typography.xs,
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  seedGoalText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    width: '100%',
    justifyContent: 'space-around',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
  },
  levelCard: {
    backgroundColor: colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  levelInfo: {
    gap: Spacing.xs,
  },
  levelLabel: {
    fontSize: Typography.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: colors.primary,
  },
  pointsBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  pointsText: {
    fontWeight: Typography.bold,
    fontSize: Typography.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  nextLevelText: {
    fontSize: Typography.xs,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  co2Card: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  co2Header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  co2HeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  co2LevelText: {
    fontSize: Typography.sm,
    color: colors.primary,
    fontWeight: Typography.semibold,
  },
  co2Emoji: {
    fontSize: 28,
  },
  co2MainValue: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  co2ValueText: {
    fontSize: Typography.display,
    fontWeight: Typography.bold,
    color: colors.primary,
  },
  co2ValueLabel: {
    fontSize: Typography.sm,
    color: colors.primary,
    marginTop: 2,
    opacity: 0.8,
  },
  co2Equivalents: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  co2EquivItem: {
    alignItems: 'center',
  },
  co2EquivEmoji: {
    fontSize: 18,
  },
  co2EquivValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: colors.textPrimary,
    marginTop: Spacing.xs,
  },
  co2EquivDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  co2SeeMore: {
    textAlign: 'center',
    fontSize: Typography.sm,
    color: colors.primary,
    fontWeight: Typography.semibold,
  },
  section: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 15,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: Typography.base,
    color: colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 15,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
    borderWidth: 1.5,
    borderColor: colors.error,
    gap: Spacing.sm,
  },
  logoutText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: colors.error,
  },
});
