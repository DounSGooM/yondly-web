import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { Store, Deal } from '../src/types';
import { useAuthStore } from '../src/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../src/config/api';
import ScreenHeader from '../src/components/ScreenHeader';

export default function StoreDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.storeId || params.id;
  const user = useAuthStore((state) => state.user);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    loadStore();
  }, []);

  const loadStore = async () => {
    try {
      const response = await axios.get(`${API_URL}/stores/${storeId}`);
      setStore(response.data);

      // Check follow status if logged in
      if (user) {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          try {
            const statusResponse = await axios.get(`${API_URL}/stores/${storeId}/status`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setFollowing(statusResponse.data.is_following);
          } catch (e) {
            console.log("Status fetch failed", e);
          }
        }
      }
    } catch (error) {
      console.error('Error loading store:', error);
      Alert.alert('Erreur', 'Impossible de charger ce magasin');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Vous devez être connecté pour suivre un magasin');
      return;
    }

    setFollowLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (following) {
        await axios.delete(`${API_URL}/stores/${storeId}/follow`, config);
        setFollowing(false);
        if (store) {
          setStore({ ...store, followers_count: Math.max(0, (store.followers_count || 0) - 1) });
        }
      } else {
        await axios.post(`${API_URL}/stores/${storeId}/follow`, {}, config);
        setFollowing(true);
        if (store) {
          setStore({ ...store, followers_count: (store.followers_count || 0) + 1 });
        }
      }
    } catch (error) {
      console.error('Error following store:', error);
      Alert.alert('Erreur', 'Impossible de modifier le suivi');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCall = () => {
    if (store?.phone) {
      Linking.openURL(`tel:${store.phone}`);
    }
  };

  const handleDirections = () => {
    // Check root lat/lng first (from seed), then location object (standard)
    const lat = store?.lat || store?.location?.lat;
    const lng = store?.lng || store?.location?.lng;

    if (lat && lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url);
    } else {
      Alert.alert("Erreur", "Adresse introuvable sur la carte");
    }
  };

  const handleWebsite = () => {
    if (store?.website) {
      Linking.openURL(store.website);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez ${store?.name} sur Yondly - Magasin anti-gaspi`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleOrder = (deal: Deal) => {
    if (!user) {
      Alert.alert(
        "Connexion requise",
        "Connectez-vous pour réserver ce panier.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Se connecter", onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }

    const price = deal.deal_price ? (deal.deal_price / 100).toFixed(2) : '0.00';

    // Navigate to payment screen instead of direct order
    router.push(`/order/payment?dealId=${deal.id}`);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return 'Expiré';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 24) {
      return `${hours}h ${minutes}m restantes`;
    }
    const days = Math.floor(hours / 24);
    return `${days}j restants`;
  };

  const isOpen = () => {
    if (!store?.hours) return null;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const hours = store.hours[today as keyof typeof store.hours];
    return hours && hours !== 'Fermé';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C7B4B" />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Magasin introuvable</Text>
      </View>
    );
  }

  const openStatus = isOpen();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ScreenHeader
          rightAction={
            <TouchableOpacity style={{ padding: 8 }} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#333" />
            </TouchableOpacity>
          }
        />

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.category}>{store.category}</Text>
            {openStatus !== null && (
              <View style={[styles.statusBadge, openStatus ? styles.openBadge : styles.closedBadge]}>
                <View style={[styles.statusDot, openStatus ? styles.openDot : styles.closedDot]} />
                <Text style={[styles.statusText, openStatus ? styles.openText : styles.closedText]}>
                  {openStatus ? 'Ouvert maintenant' : 'Fermé'}
                </Text>
              </View>
            )}
          </View>

          {store.description && (
            <Text style={styles.description}>{store.description}</Text>
          )}

          <View style={styles.infoSection}>
            <TouchableOpacity style={styles.infoRow} onPress={handleDirections}>
              <Ionicons name="location" size={24} color="#4C7B4B" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Adresse</Text>
                <Text style={styles.infoValue}>{store.address}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            {store.phone && (
              <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
                <Ionicons name="call" size={24} color="#4C7B4B" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Téléphone</Text>
                  <Text style={styles.infoValue}>{store.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            )}

            {store.website && (
              <TouchableOpacity style={styles.infoRow} onPress={handleWebsite}>
                <Ionicons name="globe" size={24} color="#4C7B4B" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Site web</Text>
                  <Text style={styles.infoValue}>{store.website}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {store.hours && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Horaires</Text>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                const dayLabels: any = {
                  monday: 'Lundi',
                  tuesday: 'Mardi',
                  wednesday: 'Mercredi',
                  thursday: 'Jeudi',
                  friday: 'Vendredi',
                  saturday: 'Samedi',
                  sunday: 'Dimanche',
                };
                const hours = store.hours?.[day as keyof typeof store.hours];
                if (!hours) return null;
                return (
                  <View key={day} style={styles.hoursRow}>
                    <Text style={styles.dayLabel}>{dayLabels[day]}</Text>
                    <Text style={styles.hoursValue}>{hours}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {store.deals && store.deals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Deals actifs ({store.deals.length})</Text>
              {store.deals.map((deal: Deal) => (
                <TouchableOpacity
                  key={deal.id}
                  style={styles.dealCard}
                  onPress={() => handleOrder(deal)}
                >
                  <View style={styles.dealHeader}>
                    <Text style={styles.dealTitle}>{deal.title}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        {deal.discount_type === 'percentage'
                          ? `-${deal.discount_value}%`
                          : `-${(deal.discount_value! / 100).toFixed(2)}€`}
                      </Text>
                    </View>
                  </View>
                  {deal.description && (
                    <Text style={styles.dealDescription}>{deal.description}</Text>
                  )}
                  <View style={styles.dealFooter}>
                    {deal.deal_price !== null && deal.deal_price !== undefined && (
                      <View style={styles.priceRow}>
                        {deal.original_price && (
                          <Text style={styles.originalPrice}>
                            {(deal.original_price / 100).toFixed(2)}€
                          </Text>
                        )}
                        <Text style={styles.dealPrice}>
                          {(deal.deal_price / 100).toFixed(2)}€
                        </Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.dealExpiry, { marginRight: 8 }]}>{getTimeRemaining(deal.expires_at)}</Text>
                      <Ionicons name="cart-outline" size={20} color="#4C7B4B" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.followSection}>
            <View style={styles.followInfo}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.followersText}>{store.followers_count} abonnés</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
          <Ionicons name="navigate" size={24} color="#4C7B4B" />
          <Text style={styles.actionButtonText}>Itinéraire</Text>
        </TouchableOpacity>
        {store.phone && (
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color="#4C7B4B" />
            <Text style={styles.actionButtonText}>Appeler</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.followButton, following && styles.followingButton]}
          onPress={handleFollow}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name={following ? 'checkmark' : 'add'} size={24} color="#fff" />
              <Text style={styles.followButtonText}>{following ? 'Abonné' : 'Suivre'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#fff' },
  // Unused custom header styles removed
  content: { padding: 16 },
  titleSection: { marginBottom: 16 },
  storeName: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  category: { fontSize: 16, color: '#666', marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start' },
  openBadge: { backgroundColor: '#e8f5e9' },
  closedBadge: { backgroundColor: '#ffebee' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  openDot: { backgroundColor: '#4C7B4B' },
  closedDot: { backgroundColor: '#d32f2f' },
  statusText: { fontSize: 14, fontWeight: '600' },
  openText: { color: '#4C7B4B' },
  closedText: { color: '#d32f2f' },
  description: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 24 },
  infoSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoTextContainer: { flex: 1, marginLeft: 12 },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  infoValue: { fontSize: 16, color: '#333' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  dayLabel: { fontSize: 14, color: '#666' },
  hoursValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  dealCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 12 },
  dealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dealTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  discountBadge: { backgroundColor: '#d32f2f', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  discountText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  dealDescription: { fontSize: 14, color: '#666', marginBottom: 12 },
  dealFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  originalPrice: { fontSize: 14, color: '#999', textDecorationLine: 'line-through' },
  dealPrice: { fontSize: 18, fontWeight: 'bold', color: '#d32f2f' },
  dealExpiry: { fontSize: 12, color: '#999' },
  followSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24 },
  followInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  followersText: { fontSize: 16, color: '#666' },
  actionsBar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0', padding: 16, gap: 12 },
  actionButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#f5f5f5' },
  actionButtonText: { fontSize: 12, color: '#4C7B4B', marginTop: 4, fontWeight: '600' },
  followButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#4C7B4B', gap: 6 },
  followingButton: { backgroundColor: '#666' },
  followButtonText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
