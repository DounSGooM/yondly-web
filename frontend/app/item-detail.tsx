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
import { Item } from '../src/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { useAuthStore } from '../src/store/authStore';
import MakeOfferModal from '../src/components/MakeOfferModal';
import BookingCalendar from '../src/components/BookingCalendar';
import ScreenHeader from '../src/components/ScreenHeader';
import CO2Badge from '../src/components/CO2Badge';
import { getLevelBadge } from '../src/utils/levelBadges';
import AddToInspirationModal from '../src/components/AddToInspirationModal';

import { API_URL } from '../src/config/api';
import { getProximityLabel } from '../src/utils/locationUtils';
const { width } = Dimensions.get('window');

interface Offer {
  id: string;
  buyer_id: string;
  buyer?: {
    display_name?: string;
    email: string;
  };
  amount_cents: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  accepted_at?: string;
  expires_at?: string;
}

export default function ItemDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user, token } = useAuthStore();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showBookingCalendar, setShowBookingCalendar] = useState(false);
  const [showInspirationModal, setShowInspirationModal] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await axios.get(`${API_URL}/items/${id}`);
      setItem(response.data);

      // Si c'est un article en vente, charger les offres (pour vendeur ET acheteur)
      if (response.data.type === 'sale') {
        fetchOffers();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger cet article');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    try {
      setLoadingOffers(true);
      console.log('Fetching offers for item:', id);
      const response = await axios.get(`${API_URL}/offers/item/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Offers received:', response.data);
      setOffers(response.data);
    } catch (error: any) {
      console.error('Error fetching offers:', error.response?.data || error.message);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleMakeOffer = async (amountCents: number) => {
    try {
      await axios.post(
        `${API_URL}/offers`,
        { item_id: id, amount_cents: amountCents },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Notification locale pour information (la vraie notification sera gérée côté backend en prod)
      Alert.alert('Offre envoyée ✅', 'Le vendeur va examiner votre offre et recevra une notification');
      setShowOfferModal(false);
    } catch (error: any) {
      throw error; // Let the modal handle the error
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);

    Alert.alert(
      'Accepter l\'offre',
      'Si vous acceptez, le prix sera verrouillé pendant 4h pour que l\'acheteur puisse payer.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            try {
              await axios.put(
                `${API_URL}/offers/${offerId}/accept`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );

              // Envoyer une notification locale (TODO: remplacer par notification push serveur)
              // Pour l'instant, c'est juste une confirmation pour le vendeur
              Alert.alert(
                'Offre acceptée ✅',
                `L'acheteur ${offer?.buyer?.display_name || offer?.buyer?.email} a 4h pour payer ${(offer?.amount_cents! / 100).toFixed(2)}€`
              );

              fetchItem(); // Refresh item with new price
              fetchOffers(); // Refresh offers
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'accepter l\'offre');
            }
          },
        },
      ]
    );
  };

  const handleDeclineOffer = async (offerId: string) => {
    try {
      await axios.put(
        `${API_URL}/offers/${offerId}/decline`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Offre refusée');
      fetchOffers(); // Refresh offers
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de refuser l\'offre');
    }
  };

  const handleBuy = async () => {
    if (!item) return;

    if (item.type === 'rent') {
      // Open booking calendar for rentals
      setShowBookingCalendar(true);
      return;
    }

    // Navigate to payment screen for sales
    router.push(`/order/item-payment?itemId=${item.id}` as any);
  };

  const handleContact = () => {
    if (!item) return;
    router.push(`/chat-detail?id=${item.id}` as any);
  };

  const handlePickup = async () => {
    if (!item) return;

    Alert.alert(
      'Demande de récupération',
      `Vous souhaitez récupérer "${item.title}"?\n\nLe donateur sera notifié de votre demande.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              // Create an order for the donation - this sends notification to donor
              const response = await axios.post(
                `${API_URL}/orders`,
                { item_id: item.id },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              const orderId = response.data.id;

              Alert.alert(
                '🎉 Demande envoyée !',
                'Le donateur a été notifié. Présentez le QR code lors de la récupération.',
                [
                  {
                    text: 'Voir mon QR code',
                    onPress: () => router.push(`/order-detail?id=${orderId}` as any),
                  },
                ]
              );
            } catch (error: any) {
              const errorMsg = error.response?.data?.detail || 'Erreur lors de la demande';
              Alert.alert('Erreur', errorMsg);
            }
          },
        },
      ]
    );
  };

  const formatPrice = (cents: number) => {
    const price = (cents / 100).toFixed(2);
    return item?.type === 'rent' ? `${price}€/jour` : `${price}€`;
  };

  const handleDeleteItem = () => {
    Alert.alert(
      'Supprimer l\'annonce',
      'Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/items/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Succès', 'Annonce supprimée', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error: any) {
              const errorMsg = error.response?.data?.detail || 'La suppression a échoué';
              Alert.alert('Erreur', errorMsg);
            }
          },
        },
      ]
    );
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

  // Vérifier s'il y a une offre acceptée
  const acceptedOffer = offers.find(o => o.status === 'accepted');
  const myAcceptedOffer = acceptedOffer?.buyer_id === user?.id ? acceptedOffer : null;

  // Fonction unifiée pour calculer le temps restant
  const getTimeRemaining = (expiresAtDate?: string) => {
    const dateToUse = expiresAtDate || myAcceptedOffer?.expires_at;
    if (!dateToUse) return null;

    const now = new Date();
    const expiresAt = new Date(dateToUse);
    const diffMs = expiresAt.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expiré';

    // Pour l'offre acceptée, format détaillé
    if (!expiresAtDate && myAcceptedOffer) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}h ${diffMinutes}m`;
    }

    // Pour les items normaux, format simple
    const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));
    if (hoursLeft < 1) return 'Expire bientôt!';
    return `Expire dans ${hoursLeft}h`;
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        rightAction={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => setShowInspirationModal(true)}>
              <Ionicons name="bookmark-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { /* TODO: Share */ }}>
              <Ionicons name="share-outline" size={24} color="#333" />
            </TouchableOpacity>
            {isOwner && (
              <>
                <TouchableOpacity onPress={() => router.push(`/edit-item?id=${item.id}` as any)}>
                  <Ionicons name="create-outline" size={24} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteItem}>
                  <Ionicons name="trash-outline" size={24} color="#d32f2f" />
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.imageContainer}>
          {item.photos && item.photos.length > 0 ? (
            <Image
              source={{ uri: item.photos[0] }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Ionicons
                name={isDonation ? 'nutrition' : 'storefront'}
                size={80}
                color="#ccc"
              />
            </View>
          )}
          <View style={styles.imageOverlay} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.title}</Text>
            {isDonation ? (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>GRATUIT</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.price}>{formatPrice(item.type === 'rent' ? item.price_per_day_cents! : item.price_cents || 0)}</Text>
                {item.type === 'rent' && item.deposit_cents && (
                  <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                    Caution: {(item.deposit_cents / 100).toFixed(0)}€
                  </Text>
                )}
              </View>
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

          {/* CO2 Impact Section - Show for non-donation items */}
          {item.type !== 'donation' && (
            <CO2Badge
              itemId={item.id}
              category={item.category}
              showDetails={true}
            />
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

          {item.store ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Boutique Partenaire</Text>
              <TouchableOpacity onPress={() => router.push(`/store-detail?id=${item.store?.id}` as any)} activeOpacity={0.9}>
                <View style={[styles.ownerCard, { backgroundColor: '#f8fdf8', borderColor: '#4C7B4B', borderWidth: 1 }]}>
                  <Image source={{ uri: item.store?.logo || 'https://via.placeholder.com/150' }} style={styles.ownerAvatar} />
                  <View style={styles.sellerInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.sellerName}>{item.store?.name}</Text>
                      <View style={{ backgroundColor: '#4C7B4B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>PRO</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                      {item.store?.address}
                    </Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#ffc107" />
                      <Text style={styles.ratingText}>
                        4.8 (Expert) {/* Need to fetch ratings? for now mock or use User ratings */}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#4C7B4B" />
                </View>
              </TouchableOpacity>
            </View>
          ) : item.owner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{isDonation ? 'Donateur' : 'Vendeur'}</Text>
              <View style={styles.ownerCard}>
                <View style={styles.ownerAvatar}>
                  <Ionicons name="person" size={24} color="#4C7B4B" />
                </View>
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerTextContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={styles.sellerName}>{item.owner?.display_name}</Text>
                      {item.owner?.level && (
                        <View style={{ backgroundColor: getLevelBadge(item.owner.level).color, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                          <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>{getLevelBadge(item.owner.level).label}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#ffc107" />
                      <Text style={styles.ratingText}>
                        {item.owner?.ratings_avg?.toFixed(1) || 'N/A'} ({item.owner?.ratings_count || 0})
                      </Text>
                    </View>
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
        {/* Section Offers for seller */}
        {!isDonation && item.owner_id === user?.id && (
          <View style={styles.offersSection}>
            <Text style={styles.offersSectionTitle}>
              Offres reçues ({offers.filter(o => o.status === 'pending').length})
            </Text>
            {loadingOffers && (
              <ActivityIndicator size="small" color="#4C7B4B" />
            )}
            {!loadingOffers && offers.length === 0 && (
              <Text style={styles.noOffersText}>Aucune offre pour le moment</Text>
            )}
            {offers
              .filter(o => o.status === 'pending')
              .map((offer) => (
                <View key={offer.id} style={styles.offerCard}>
                  <View style={styles.offerHeader}>
                    <View>
                      <Text style={styles.offerBuyer}>
                        {offer.buyer?.display_name || offer.buyer?.email || 'Acheteur'}
                      </Text>
                      <Text style={styles.offerAmount}>
                        {(offer.amount_cents / 100).toFixed(2)}€
                      </Text>
                      <Text style={styles.offerSavings}>
                        Réduction de {(((item.price_cents! - offer.amount_cents) / item.price_cents!) * 100).toFixed(0)}%
                      </Text>
                    </View>
                    <View style={styles.offerActions}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAcceptOffer(offer.id)}
                      >
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.acceptButtonText}>Accepter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.declineButton}
                        onPress={() => handleDeclineOffer(offer.id)}
                      >
                        <Ionicons name="close" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        )}
      </ScrollView>

      <MakeOfferModal
        visible={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        originalPrice={item.price_cents || 0}
        onOfferSubmit={handleMakeOffer}
      />

      {/* Inspiration Modal Integration */}
      <AddToInspirationModal
        visible={showInspirationModal}
        item={item}
        onClose={() => setShowInspirationModal(false)}
      />

      {item.type === 'rent' && (
        <BookingCalendar
          visible={showBookingCalendar}
          onClose={() => setShowBookingCalendar(false)}
          item_id={item.id}
          price_per_day_cents={item.price_per_day_cents || 0}
          deposit_cents={item.deposit_cents || 0}
          token={token || ''}
          onBookingComplete={() => {
            fetchItem();
          }}
        />
      )}

      {item.status === 'active' && (
        <View style={styles.footer}>
          {isDonation ? (
            // For food donations
            item.owner_id === user?.id ? (
              <View style={styles.ownerFooterInfo}>
                <Text style={styles.ownerInfoText}>✅ C'est votre annonce</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.actionButton} onPress={handlePickup}>
                <Ionicons name="hand-right" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Demander à récupérer</Text>
              </TouchableOpacity>
            )
          ) : (
            // For market sales
            item.owner_id === user?.id ? (
              <View style={styles.ownerFooterInfo}>
                <Text style={styles.ownerInfoText}>✅ C'est votre annonce</Text>
              </View>
            ) : myAcceptedOffer ? (
              // Offre acceptée - afficher bouton payer avec compte à rebours
              <View style={styles.acceptedOfferContainer}>
                <View style={styles.acceptedOfferInfo}>
                  <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
                  <View style={styles.acceptedOfferText}>
                    <Text style={styles.acceptedOfferTitle}>
                      ✅ Votre offre a été acceptée !
                    </Text>
                    <Text style={styles.acceptedOfferPrice}>
                      Prix négocié : {(myAcceptedOffer.amount_cents / 100).toFixed(2)}€
                    </Text>
                    <Text style={styles.acceptedOfferTimer}>
                      ⏰ Temps restant : {getTimeRemaining()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.actionButton, styles.payButton]}
                  onPress={handleBuy}
                  disabled={purchasing}
                >
                  <Text style={styles.actionButtonText}>
                    {purchasing ? 'Paiement...' : 'Payer maintenant'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : acceptedOffer ? (
              // Une autre offre a été acceptée - pas de nouvelle offre possible
              <View style={styles.offerAcceptedByOther}>
                <Ionicons name="lock-closed" size={20} color="#999" />
                <Text style={styles.offerAcceptedText}>
                  Une offre a été acceptée pour cet article
                </Text>
              </View>
            ) : (
              // Aucune offre acceptée - afficher les boutons normaux
              <View style={styles.buyerActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.contactButton]}
                  onPress={handleContact}
                >
                  <Ionicons name="chatbubble-outline" size={24} color="#4C7B4B" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.offerButton]}
                  onPress={() => setShowOfferModal(true)}
                >
                  <Ionicons name="pricetag-outline" size={20} color="#4C7B4B" />
                  <Text style={styles.offerButtonText}>Faire une offre</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.buyButton]}
                  onPress={handleBuy}
                  disabled={purchasing}
                >
                  <Text style={styles.actionButtonText}>
                    {purchasing ? 'Traitement...' : item.type === 'rent' ? 'Louer' : 'Acheter'}
                  </Text>
                </TouchableOpacity>
              </View>
            )
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
  // Header styles removed as ScreenHeader is used
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  imageContainer: {
    position: 'relative',
    height: 350,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)', // Note: LinearGradient requires expo-linear-gradient, using simple transparency for now or just rely on image contrast
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  price: {
    fontSize: 24,
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
    padding: 12,
    borderRadius: 12,
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerTextContainer: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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
    padding: 12,
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
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
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
  ownerFooterInfo: {
    flex: 1,
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ownerInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4C7B4B',
  },
  buyerActions: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  offerButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4C7B4B',
    gap: 6,
  },
  offerButtonText: {
    color: '#4C7B4B',
    fontSize: 14,
    fontWeight: '600',
  },
  offersSection: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  offersSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  noOffersText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  offerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerBuyer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  offerAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4C7B4B',
    marginBottom: 2,
  },
  offerSavings: {
    fontSize: 12,
    color: '#999',
  },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4C7B4B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#d32f2f',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptedOfferContainer: {
    flex: 1,
    gap: 12,
  },
  acceptedOfferInfo: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  acceptedOfferText: {
    flex: 1,
  },
  acceptedOfferTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4C7B4B',
    marginBottom: 4,
  },
  acceptedOfferPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  acceptedOfferTimer: {
    fontSize: 14,
    color: '#f57c00',
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#4caf50',
    flex: 1,
  },
  offerAcceptedByOther: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  offerAcceptedText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
});
