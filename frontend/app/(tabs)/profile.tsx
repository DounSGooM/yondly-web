import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import axios from 'axios';
import { getLevelBadge } from '../../src/utils/levelBadges';
import { calculateCO2Impact, formatCO2, getCO2Level, getCO2Equivalents } from '../../src/utils/co2Calculator';

import { API_URL } from '../../src/config/api';

// CO2 Preview Card Component
function CO2PreviewCard({ onPress, onLevelLoaded }: { onPress: () => void; onLevelLoaded?: (level: any) => void }) {
  const { token } = useAuthStore();
  const [co2Data, setCo2Data] = useState({ basketsCount: 0, donationsCount: 0, salesCount: 0, rentalsCount: 0 });

  useEffect(() => {
    fetchCO2Data();
  }, []);

  const fetchCO2Data = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/me/impact`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCo2Data(response.data);
    } catch (error) {
      setCo2Data({ basketsCount: 0, donationsCount: 0, salesCount: 0, rentalsCount: 0 });
    }
  };

  const co2Impact = calculateCO2Impact(co2Data.basketsCount, co2Data.donationsCount, co2Data.salesCount, co2Data.rentalsCount);
  const level = getCO2Level(co2Impact.totalCO2SavedKg);
  const equivalents = getCO2Equivalents(co2Impact.totalCO2SavedKg);

  // Notify parent of level change
  useEffect(() => {
    if (onLevelLoaded && co2Impact.totalCO2SavedKg > 0) {
      onLevelLoaded(level);
    }
  }, [co2Impact.totalCO2SavedKg]);

  return (
    <TouchableOpacity style={styles.co2Card} onPress={onPress}>
      <View style={styles.co2Header}>
        <Text style={styles.co2Emoji}>{level.emoji}</Text>
        <View style={styles.co2HeaderRight}>
          <Text style={styles.co2LevelText}>{level.level}</Text>
          <Ionicons name="chevron-forward" size={18} color="#4C7B4B" />
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
  const { user, logout } = useAuthStore();

  // Hooks must be called unconditionally before any returns
  const [co2Level, setCo2Level] = useState<{ level: string; color: string; emoji: string; icon: string } | null>(null);
  const [stats, setStats] = useState<{ total_transactions: number; people_helped: number } | null>(null);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => {
            // Navigate first to avoid rendering protected screens without user
            router.replace('/(auth)/login');
            // Small delay to let navigation start before clearing state
            setTimeout(async () => {
              await logout();
            }, 100);
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (user && user.level !== 'Graine') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/auth/stats`, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      });
      setStats(response.data);
    } catch (e) {
      console.log('Error fetching stats');
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Unify badge format - use co2Level if available, otherwise map legacy getLevelBadge
  const legacyBadge = getLevelBadge(user.level || 'Graine');
  const badge = co2Level || {
    level: legacyBadge.label,
    color: legacyBadge.color,
    emoji: '🌱',
    icon: legacyBadge.icon
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <View style={[styles.profileCard, user.profile_theme_color ? { borderTopColor: user.profile_theme_color, borderTopWidth: 4 } : {}]}>
        <TouchableOpacity
          style={[styles.editButton, user.profile_theme_color ? { backgroundColor: user.profile_theme_color + '20' } : {}]}
          onPress={() => router.push('/profile/edit' as any)}
        >
          <Ionicons name="pencil" size={20} color={user.profile_theme_color || "#4C7B4B"} />
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

        <TouchableOpacity
          style={styles.ratingRow}
          onPress={() => router.push('/profile/reviews' as any)}
        >
          <Ionicons name="star" size={16} color="#ffc107" />
          <Text style={styles.rating}>
            {user.ratings_avg?.toFixed(1) || '0.0'} ({user.ratings_count || 0} avis)
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#999" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Graine Reward: Encouragement */}
        {user.level === 'Graine' && (
          <View style={{ marginTop: 16, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, width: '100%', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>🌱 Graine d'Impact</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#333' }}>Prochain but: Débloquer les recherches sauvegardées (100kg)</Text>
          </View>
        )}

        {/* Pousse+ Reward: Detailed Stats */}
        {stats && user.level !== 'Graine' && (
          <View style={{ flexDirection: 'row', marginTop: 16, width: '100%', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4C7B4B' }}>{stats.total_transactions}</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>Transactions</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#f0f0f0' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4C7B4B' }}>{stats.people_helped}</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>Personnes aidées</Text>
            </View>
          </View>
        )}
      </View>

      {/* Gamification Card */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelLabel}>Niveau actuel</Text>
            <View style={styles.levelTitleRow}>
              <Text style={styles.levelTitle}>{badge.level}</Text>
            </View>
          </View>
          <View style={[styles.pointsBadge, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.pointsText, { color: badge.color }]}>{Math.round(user.co2_saved || 0)} kg CO₂</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${Math.min(((user.co2_saved || 0) / (user.level === 'Graine' ? 100 : user.level === 'Pousse' ? 500 : user.level === 'Arbre' ? 2500 : 2500)) * 100, 100)}%`, backgroundColor: badge.color }]} />
        </View>

        <Text style={styles.nextLevelText}>
          {user.level === 'Forêt'
            ? 'Niveau maximum atteint ! 🌲'
            : `${Math.round((user.level === 'Graine' ? 100 : user.level === 'Pousse' ? 500 : 2500) - (user.co2_saved || 0))} kg CO₂ avant le niveau ${user.level === 'Graine' ? 'Pousse' : user.level === 'Pousse' ? 'Arbre' : 'Forêt'}`}
        </Text>
      </View>

      {/* CO2 Impact Card with Preview */}
      <CO2PreviewCard
        onPress={() => router.push('/profile/impact' as any)}
        onLevelLoaded={(level) => setCo2Level(level)}
      />

      {/* NEW: Espace Vendeur */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Espace Vendeur</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/my-items' as any)}
        >
          <Ionicons name="pricetags-outline" size={24} color="#4C7B4B" />
          <Text style={styles.menuText}>Mes annonces</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/analytics' as any)}
        >
          <Ionicons name="bar-chart-outline" size={24} color="#4C7B4B" />
          <Text style={styles.menuText}>Tableau de bord Vendeur</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/wallet' as any)}
        >
          <Ionicons name="wallet-outline" size={24} color="#4C7B4B" />
          <Text style={styles.menuText}>Ma Tirelire</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* NEW: Espace Acheteur */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Espace Acheteur</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/orders' as any)}
        >
          <Ionicons name="receipt-outline" size={24} color="#4C7B4B" />
          <Text style={styles.menuText}>Mes Commandes & Réservations</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/saved-searches' as any)}
        >
          <Ionicons name="bookmarks-outline" size={24} color="#4C7B4B" />
          <Text style={styles.menuText}>Recherches Sauvegardées</Text>
          {user.level === 'Graine' && <Ionicons name="lock-closed" size={16} color="#999" style={{ marginRight: 8 }} />}
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/disputes' as any)}
        >
          <Ionicons name="shield-checkmark-outline" size={24} color="#4C7B4B" />
          <Text style={styles.menuText}>Mes litiges</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        {/* Forêt Feature: Pages Inspirations (Public Lists) */}
        {['Arbre', 'Forêt'].includes(user.level) && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/profile/public-lists' as any)}
          >
            <Ionicons name="color-palette-outline" size={24} color="#ffb74d" />
            <Text style={styles.menuText}>Pages Inspirations</Text>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {/* NEW: Paramètres */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Application</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/security' as any)}
        >
          <Ionicons name="shield-checkmark-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Sécurité et Confiance</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/settings' as any)}
        >
          <Ionicons name="settings-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Préférences</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/help' as any)}
        >
          <Ionicons name="help-circle-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Aide & Support</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#d32f2f" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileCard: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  editButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
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
    borderColor: '#fff',
  },
  levelBadgeEmoji: {
    fontSize: 14,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  levelCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelInfo: {
    gap: 4,
  },
  levelLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4C7B4B',
  },
  pointsBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    color: '#4C7B4B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4C7B4B',
    borderRadius: 4,
  },
  nextLevelText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
    marginLeft: 8,
  },
  spacer: {
    height: 32,
  },
  co2Card: {
    backgroundColor: '#e8f5e9',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
  },
  co2Header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  co2HeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  co2LevelText: {
    fontSize: 13,
    color: '#4C7B4B',
    fontWeight: '600',
  },
  co2Left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  co2Emoji: {
    fontSize: 28,
  },
  co2Title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  co2Subtitle: {
    fontSize: 13,
    color: '#4C7B4B',
    marginTop: 2,
  },
  co2MainValue: {
    alignItems: 'center',
    marginBottom: 16,
  },
  co2ValueText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  co2ValueLabel: {
    fontSize: 13,
    color: '#4C7B4B',
    marginTop: 2,
  },
  co2Equivalents: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  co2EquivItem: {
    alignItems: 'center',
  },
  co2EquivEmoji: {
    fontSize: 18,
  },
  co2EquivValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  co2EquivDivider: {
    width: 1,
    backgroundColor: '#c8e6c9',
  },
  co2SeeMore: {
    textAlign: 'center',
    fontSize: 13,
    color: '#4C7B4B',
    fontWeight: '500',
  },
});
