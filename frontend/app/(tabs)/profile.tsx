import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { getLevelBadge, getLevelProgress, getNextLevel } from '../../src/utils/levelBadges';
import { API_URL } from '../../src/config/api';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserStats {
  total_transactions: number;
  active_listings: number;
  people_helped: number;
}

// ─── Menu item ────────────────────────────────────────────────────────────────

function MenuItem({
  icon,
  label,
  sublabel,
  onPress,
  accent,
  locked,
  badgeCount,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  accent?: boolean;
  locked?: boolean;
  badgeCount?: number;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconWrap, accent && styles.menuIconWrapAccent]}>
        <Ionicons name={icon as any} size={20} color={accent ? colors.primary : colors.textSecondary} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={styles.menuLabel}>{label}</Text>
        {sublabel ? <Text style={styles.menuSublabel}>{sublabel}</Text> : null}
      </View>
      {badgeCount ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount}</Text>
        </View>
      ) : null}
      {locked ? (
        <Ionicons name="lock-closed-outline" size={16} color={colors.textTertiary} style={{ marginRight: 4 }} />
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser, isLoading, token } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/auth/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(data);
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (refreshUser) await refreshUser();
      if (user) await fetchStats();
    } catch {}
    finally { setRefreshing(false); }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Tu veux vraiment te déconnecter ?', [
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <View style={styles.guestCard}>
          <Ionicons name="person-circle-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.guestTitle}>Pas encore connecté</Text>
          <Text style={styles.guestSub}>Connecte-toi pour accéder à ton profil</Text>
          <TouchableOpacity style={styles.guestCTA} onPress={() => router.push('/(auth)/login' as any)}>
            <Text style={styles.guestCTAText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const co2Saved = user.co2_saved || 0;
  const badge = getLevelBadge(user.level || 'Graine');
  const progress = getLevelProgress(co2Saved);
  const nextLevel = getNextLevel(co2Saved);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        {/* Edit button */}
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/profile/edit' as any)}>
          <Ionicons name="pencil-outline" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {user.photo_url ? (
            <Image source={{ uri: user.photo_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {(user.display_name || user.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.levelDot, { backgroundColor: badge.color }]}>
            <Text style={styles.levelDotEmoji}>{badge.emoji}</Text>
          </View>
        </View>

        {/* Name + email */}
        <Text style={styles.heroName}>{user.display_name || 'Utilisateur'}</Text>
        <Text style={styles.heroEmail}>{user.email}</Text>

        {/* Rating */}
        <TouchableOpacity style={styles.ratingRow} onPress={() => router.push('/profile/reviews' as any)}>
          <Ionicons name="star" size={14} color="#f59e0b" />
          <Text style={styles.ratingText}>
            {user.ratings_avg?.toFixed(1) || '—'} · {user.ratings_count || 0} avis
          </Text>
          <Ionicons name="chevron-forward" size={12} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* ─── Quick stats ──────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.active_listings ?? '—'}</Text>
          <Text style={styles.statLabel}>Annonces</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.total_transactions ?? '—'}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {co2Saved >= 1 ? `${Math.round(co2Saved)} kg` : `${Math.round(co2Saved * 1000)} g`}
          </Text>
          <Text style={styles.statLabel}>CO₂ économisé</Text>
        </View>
      </View>

      {/* ─── Level card ───────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.levelCard} onPress={() => router.push('/profile/impact' as any)} activeOpacity={0.9}>
        <View style={styles.levelCardTop}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelEmoji}>{badge.emoji}</Text>
            <View>
              <Text style={styles.levelName}>{badge.level}</Text>
              <Text style={styles.levelSub}>
                {nextLevel
                  ? `encore ${nextLevel.co2Needed} kg pour atteindre ${nextLevel.name}`
                  : 'Niveau maximum atteint ! 🌲'}
              </Text>
            </View>
          </View>
          <View style={[styles.levelPct, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.levelPctText, { color: badge.color }]}>{progress}%</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: badge.color }]} />
        </View>
        <Text style={styles.levelSeeMore}>Voir mon impact CO₂ →</Text>
      </TouchableOpacity>

      {/* ─── Mon activité ─────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mon activité</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="pricetags-outline"
            label="Mes annonces"
            sublabel="Alimentaire & Réemploi"
            onPress={() => router.push('/my-items' as any)}
            accent
          />
          <MenuItem
            icon="receipt-outline"
            label="Mes commandes & réservations"
            onPress={() => router.push('/profile/orders' as any)}
            accent
          />
          <MenuItem
            icon="swap-horizontal-outline"
            label="Mes échanges"
            onPress={() => router.push('/profile/orders' as any)}
            accent
          />
          <MenuItem
            icon="leaf-outline"
            label="Impact CO₂"
            sublabel="Voir les équivalences"
            onPress={() => router.push('/profile/impact' as any)}
            accent
          />
          <MenuItem
            icon="bookmarks-outline"
            label="Recherches sauvegardées"
            onPress={() => router.push('/profile/saved-searches' as any)}
            locked={badge.level === 'Graine'}
          />
        </View>
      </View>

      {/* ─── Paramètres ───────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="shield-checkmark-outline"
            label="Sécurité et confiance"
            onPress={() => router.push('/profile/security' as any)}
          />
          <MenuItem
            icon="settings-outline"
            label="Préférences"
            onPress={() => router.push('/profile/settings' as any)}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Aide & Support"
            onPress={() => router.push('/profile/help' as any)}
          />
        </View>
      </View>

      {/* ─── Logout ───────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl * 2 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  // ── Guest ──────────────────────────────────────────────────────────────────
  guestCard: {
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  guestTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
  },
  guestSub: {
    fontSize: Typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  guestCTA: {
    marginTop: Spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  guestCTAText: {
    color: '#fff',
    fontWeight: Typography.semibold,
    fontSize: Typography.base,
  },

  // ── Hero ───────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  editBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 44,
    right: Spacing.lg,
    padding: Spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: BorderRadius.full,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: Typography.bold,
    color: colors.primary,
  },
  levelDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  levelDotEmoji: {
    fontSize: 13,
  },
  heroName: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  heroEmail: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: colors.background,
    borderRadius: BorderRadius.full,
  },
  ratingText: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    ...Shadows.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
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

  // ── Level card ────────────────────────────────────────────────────────────
  levelCard: {
    backgroundColor: colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  levelCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  levelEmoji: {
    fontSize: 32,
  },
  levelName: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
  },
  levelSub: {
    fontSize: Typography.xs,
    color: colors.textSecondary,
    marginTop: 2,
    flexShrink: 1,
  },
  levelPct: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  levelPctText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  levelSeeMore: {
    fontSize: Typography.sm,
    color: colors.primary,
    fontWeight: Typography.semibold,
  },

  // ── Sections ─────────────────────────────────────────────────────────────
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  menuGroup: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: Spacing.md,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconWrapAccent: {
    backgroundColor: colors.primaryLight,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    fontSize: Typography.base,
    color: colors.textPrimary,
  },
  menuSublabel: {
    fontSize: Typography.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.error + '40',
    backgroundColor: colors.surface,
  },
  logoutText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: colors.error,
  },
});
