import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Item } from '../../src/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { useAuthStore } from '../../src/store/authStore';

import { API_URL } from '../../src/config/api';
import { getProximityLabel } from '../../src/utils/locationUtils';
const { width } = Dimensions.get('window');

export default function ItemDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user, token } = useAuthStore();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await axios.get(`${API_URL}/items/${id}`);
      setItem(response.data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger cet article');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!item) return;

    Alert.alert(
      'Confirmer l\'achat',
      `Acheter "${item.title}" pour ${((item.price_cents || 0) / 100).toFixed(2)}€?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Acheter',
          onPress: async () => {
            setPurchasing(true);
            try {
              const response = await axios.post(
                `${API_URL}/orders`,
                { item_id: item.id },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              Alert.alert('Succès', 'Achat effectué! Consultez vos commandes.');
              router.push(`/order/${response.data.id}` as any);
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors de l\'achat');
            } finally {
              setPurchasing(false);
            }
          },
        },
      ]
    );
  };

  const handleContact = () => {
    if (!item) return;
    router.push(`/chat/${item.id}` as any);
  };

  const handlePickup = () => {
    if (!item) return;
    Alert.alert(
      'Demande de récupération',
      `Envoyer une demande pour récupérer "${item.title}"?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: () => {
            router.push(`/chat/${item.id}` as any);
            Alert.alert('Succès', 'Message envoyé au donateur!');
          },
        },
      ]
    );
  };

  const handleMakeOffer = async (offerAmountCents: number) => {
    if (!item || !token) {
      Alert.alert('Erreur', 'Vous devez être connecté pour faire une offre');
      return;
    }

    const isRentalItem = item.type === 'rent';
    const priceLabel = isRentalItem ? `${formatPrice(offerAmountCents)}/jour` : formatPrice(offerAmountCents);

    Alert.alert(
      'Confirmer l\'offre',
      `Proposer ${priceLabel} pour "${item.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            try {
              await axios.post(
                `${API_URL}/offers`,
                { item_id: item.id, amount_cents: offerAmountCents },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Succès', 'Votre offre a été envoyée!');
              router.push(`/chat/${item.id}` as any);
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.detail || 'Impossible d\'envoyer l\'offre');
            }
          },
        },
      ]
    );
  };

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return '';
    const now = new Date();
    const expiry = new Date(expiresAt);
    const hoursLeft = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (hoursLeft < 0) return 'Expiré';
    if (hoursLeft < 1) return 'Expire bientôt!';
    return `Expire dans ${hoursLeft}h`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4C7B4B" />
      </View>
    );
  }

  if (!item) return null;

  const isOwner = user?.id === item.owner_id;
  const isDonation = item.type === 'donation';
  const isRental = item.type === 'rent';
  const isSale = item.type === 'sale';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.imageContainer}>
          {item.photos && item.photos.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setCurrentImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {item.photos.map((photo, index) => (
                  <Image
                    key={index}
                    source={{ uri: photo }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {item.photos.length > 1 && (
                <View style={styles.pagination}>
                  {item.photos.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === currentImageIndex && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Ionicons
                name={isDonation ? 'nutrition' : 'storefront'}
                size={64}
                color="#ccc"
              />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.title}</Text>
            {isDonation ? (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>GRATUIT</Text>
              </View>
            ) : isRental ? (
              <View>
                <Text style={styles.price}>{formatPrice(item.price_per_day_cents || 0)}</Text>
                <Text style={styles.pricePerDay}>/jour</Text>
              </View>
            ) : (
              <Text style={styles.price}>{formatPrice(item.price_cents || 0)}</Text>
            )}
          </View>

          <View style={styles.tags}>
            {item.food_type && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {item.food_type === 'non_perishable' ? 'Sec' : 'Frais'}
                </Text>
              </View>
            )}
            {item.condition && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {item.condition === 'new'
                    ? 'Neuf'
                    : item.condition === 'good'
                      ? 'Bon état'
                      : 'À réparer'}
                </Text>
              </View>
            )}
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.category}</Text>
            </View>
            {item.expires_at && (
              <View style={[styles.tag, styles.urgentTag]}>
                <Text style={styles.urgentText}>{getTimeRemaining(item.expires_at)}</Text>
              </View>
            )}
          </View>

          {item.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localisation</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color="#4C7B4B" />
              <Text style={styles.locationText}>
                {getProximityLabel(item.radius_km || 5)}
              </Text>
            </View>
          </View>

          {item.owner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vendeur</Text>
              <View style={styles.ownerCard}>
                <View style={styles.ownerAvatar}>
                  <Ionicons name="person" size={24} color="#4C7B4B" />
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{item.owner.display_name}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#ffc107" />
                    <Text style={styles.ratingText}>
                      {item.owner.ratings_avg?.toFixed(1) || '0.0'} ({item.owner.ratings_count || 0})
                    </Text>
                  </View>
                </View>
                {!isOwner && (
                  <TouchableOpacity style={styles.chatButton} onPress={handleContact}>
                    <Ionicons name="chatbubble-outline" size={20} color="#4C7B4B" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Offer buttons only for sales - rentals have offers in booking screen */}
          {isSale && item.allow_offers && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Faire une offre</Text>
              <View style={styles.offerButtons}>
                {[-5, -10, -15].map((percent) => {
                  const basePrice = isRental ? (item.price_per_day_cents || 0) : (item.price_cents || 0);
                  const offerPrice = Math.round(basePrice * (1 + percent / 100));
                  return (
                    <TouchableOpacity
                      key={percent}
                      style={styles.offerButton}
                      disabled={isOwner}
                      onPress={() => handleMakeOffer(offerPrice)}
                    >
                      <Text style={styles.offerPercent}>{percent}%</Text>
                      <Text style={styles.offerPrice}>{formatPrice(offerPrice)}{isRental ? '/j' : ''}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {isRental && (
            <View style={styles.rentalInfo}>
              <Ionicons name="calendar-outline" size={20} color="#4C7B4B" />
              <View style={styles.rentalDetails}>
                {item.deposit_cents && (
                  <Text style={styles.rentalDetailText}>
                    Caution: {formatPrice(item.deposit_cents)}
                  </Text>
                )}
                {item.max_duration_days && (
                  <Text style={styles.rentalDetailText}>
                    Durée max: {item.max_duration_days} jours
                  </Text>
                )}
              </View>
            </View>
          )}

          {isDonation && (
            <View style={styles.safetyTip}>
              <Ionicons name="information-circle" size={20} color="#4C7B4B" />
              <Text style={styles.safetyText}>
                Conseil sécurité: Rencontrez dans un lieu public et vérifiez la fraîcheur des
                produits
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {!isOwner && item.status === 'active' && (
        <View style={styles.footer}>
          {isDonation ? (
            <TouchableOpacity style={styles.actionButton} onPress={handlePickup}>
              <Ionicons name="hand-right" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Demander à récupérer</Text>
            </TouchableOpacity>
          ) : isRental ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.contactButton]}
                onPress={handleContact}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#4C7B4B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rentButton]}
                onPress={() => router.push(`/booking/${item.id}` as any)}
              >
                <Ionicons name="calendar" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Réserver</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.contactButton]}
                onPress={handleContact}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#4C7B4B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.buyButton]}
                onPress={handleBuy}
                disabled={purchasing}
              >
                <Text style={styles.actionButtonText}>
                  {purchasing ? 'Achat...' : 'Acheter maintenant'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {item.status !== 'active' && (
        <View style={styles.footer}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {item.status === 'reserved'
                ? 'Réservé'
                : item.status === 'completed'
                  ? 'Terminé'
                  : 'Expiré'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: width,
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4C7B4B',
  },
  freeBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  freeBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#4C7B4B',
    fontWeight: '500',
  },
  urgentTag: {
    backgroundColor: '#fff3e0',
  },
  urgentText: {
    fontSize: 12,
    color: '#f57c00',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  offerButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4C7B4B',
    alignItems: 'center',
  },
  offerPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4C7B4B',
    marginBottom: 4,
  },
  offerPrice: {
    fontSize: 14,
    color: '#666',
  },
  safetyTip: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
  },
  safetyText: {
    flex: 1,
    fontSize: 14,
    color: '#4C7B4B',
    marginLeft: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4C7B4B',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  contactButton: {
    flex: 0,
    width: 56,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4C7B4B',
  },
  buyButton: {
    flex: 1,
  },
  rentButton: {
    flex: 1,
    backgroundColor: '#1976d2',
  },
  pricePerDay: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  rentalInfo: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  rentalDetails: {
    marginLeft: 12,
  },
  rentalDetailText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
});
