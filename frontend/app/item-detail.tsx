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
import { useAuthStore } from '../src/store/authStore';
import MakeOfferModal from '../src/components/MakeOfferModal';
import BookingCalendar from '../src/components/BookingCalendar';
import ScreenHeader from '../src/components/ScreenHeader';
import CO2Badge from '../src/components/CO2Badge';
import { getLevelBadge } from '../src/utils/levelBadges';
import AddToInspirationModal from '../src/components/AddToInspirationModal';
import { API_URL } from '../src/config/api';
import { getProximityLabel } from '../src/utils/locationUtils';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../src/theme';

const { width } = Dimensions.get('window');

interface Offer {
  id: string;
  buyer_id: string;
  buyer?: { display_name?: string; email: string };
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
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showBookingCalendar, setShowBookingCalendar] = useState(false);
  const [showInspirationModal, setShowInspirationModal] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  useEffect(() => {
    if (id) fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await axios.get(`${API_URL}/items/${id}`);
      setItem(response.data);
      if (response.data.type === 'sale' || response.data.type === 'rent') {
        fetchOffers();
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de charger cet article');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    try {
      setLoadingOffers(true);
      const response = await axios.get(`${API_URL}/offers/item/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffers(response.data);
    } catch {}
    finally { setLoadingOffers(false); }
  };

  const handleMakeOffer = async (amountCents: number) => {
    try {
      await axios.post(
        `${API_URL}/offers`,
        { item_id: id, amount_cents: amountCents },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Offre envoyée ✅', 'Le vendeur va examiner votre offre et recevra une notification');
      setShowOfferModal(false);
    } catch (error: any) {
      throw error;
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    Alert.alert(
      "Accepter l'offre",
      'Si vous acceptez, le prix sera verrouillé pendant 4h pour que l\'acheteur puisse payer.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            try {
              await axios.put(`${API_URL}/offers/${offerId}/accept`, {}, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert(
                'Offre acceptée ✅',
                `L'acheteur ${offer?.buyer?.display_name || offer?.buyer?.email} a 4h pour payer ${(offer?.amount_cents! / 100).toFixed(2)}€`
              );
              fetchItem();
              fetchOffers();
            } catch {
              Alert.alert('Erreur', "Impossible d'accepter l'offre");
            }
          },
        },
      ]
    );
  };

  const handleDeclineOffer = async (offerId: string) => {
    try {
      await axios.put(`${API_URL}/offers/${offerId}/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Offre refusée');
      fetchOffers();
    } catch {
      Alert.alert('Erreur', 'Impossible de refuser l\'offre');
    }
  };

  const handleBuy = async () => {
    if (!item) return;
    if (item.type === 'rent') {
      setShowBookingCalendar(true);
      return;
    }

    if (item.accepts_cash) {
      Alert.alert(
        'Mode de paiement',
        `Comment souhaitez-vous régler "${item.title}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: '💳 En ligne (sécurisé)',
            onPress: () => router.push(`/order/item-payment?itemId=${item.id}` as any),
          },
          {
            text: '💵 En espèces (à la remise)',
            onPress: async () => {
              try {
                const response = await axios.post(
                  `${API_URL}/orders`,
                  { item_id: item.id, payment_method: 'cash' },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                Alert.alert(
                  '✅ Réservation confirmée',
                  `Votre réservation est enregistrée. Réglez en espèces lors de la remise.`,
                  [{ text: 'Voir ma commande', onPress: () => router.push(`/order-detail?id=${response.data.id}` as any) }]
                );
              } catch (error: any) {
                Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors de la réservation');
              }
            },
          },
        ]
      );
      return;
    }

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
              const response = await axios.post(
                `${API_URL}/orders`,
                { item_id: item.id },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert(
                '🎉 Demande envoyée !',
                'Le donateur a été notifié. Présentez le QR code lors de la récupération.',
                [{ text: 'Voir mon QR code', onPress: () => router.push(`/order-detail?id=${response.data.id}` as any) }]
              );
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors de la demande');
            }
          },
        },
      ]
    );
  };

  const handleDeleteItem = () => {
    Alert.alert(
      "Supprimer l'annonce",
      'Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/items/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Succès', 'Annonce supprimée', [{ text: 'OK', onPress: () => router.back() }]);
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.detail || 'La suppression a échoué');
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

  const getTimeRemaining = (expiresAtDate?: string) => {
    const myAcceptedOffer = offers.find(o => o.status === 'accepted' && o.buyer_id === user?.id);
    const dateToUse = expiresAtDate || myAcceptedOffer?.expires_at;
    if (!dateToUse) return null;

    const diffMs = new Date(dateToUse).getTime() - Date.now();
    if (diffMs <= 0) return 'Expiré';

    if (!expiresAtDate && myAcceptedOffer) {
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${h}h ${m}m`;
    }

    const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));
    if (hoursLeft < 1) return 'Expire bientôt!';
    return `Expire dans ${hoursLeft}h`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!item) return null;

  const isOwner = user?.id === item.owner_id;
  const isDonation = item.type === 'donation';
  const acceptedOffer = offers.find(o => o.status === 'accepted');
  const myAcceptedOffer = acceptedOffer?.buyer_id === user?.id ? acceptedOffer : null;

  return (
    <View style={styles.container}>
      <ScreenHeader
        rightAction={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => setShowInspirationModal(true)}>
              <Ionicons name="bookmark-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {}}>
              <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            {isOwner && (
              <>
                <TouchableOpacity onPress={() => router.push(`/edit-item?id=${item.id}` as any)}>
                  <Ionicons name="create-outline" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteItem}>
                  <Ionicons name="trash-outline" size={24} color={colors.error} />
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
        <View style={styles.imageContainer}>
          {item.photos && item.photos.length > 0 ? (
            <Image source={{ uri: item.photos[0] }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Ionicons name={isDonation ? 'nutrition' : 'storefront'} size={80} color={colors.border} />
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
            ) : (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.price}>
                  {formatPrice(item.type === 'rent' ? item.price_per_day_cents! : item.price_cents || 0)}
                </Text>
                {item.type === 'rent' && item.deposit_cents && (
                  <Text style={styles.depositText}>Caution: {(item.deposit_cents / 100).toFixed(0)}€</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.tags}>
            {item.food_type && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.food_type === 'non_perishable' ? 'Sec' : 'Frais'}</Text>
              </View>
            )}
            {item.condition && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {item.condition === 'new' ? 'Neuf' : item.condition === 'good' ? 'Bon état' : 'À réparer'}
                </Text>
              </View>
            )}
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.category}</Text>
            </View>
            {item.expires_at && isDonation && (
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

          {item.type !== 'donation' && (
            <CO2Badge itemId={item.id} category={item.category} showDetails={true} />
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localisation</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={styles.locationText}>{getProximityLabel(item.radius_km || 5)}</Text>
            </View>
          </View>

          {item.store ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Boutique Partenaire</Text>
              <TouchableOpacity
                onPress={() => router.push(`/store-detail?id=${item.store?.id}` as any)}
                activeOpacity={0.9}
              >
                <View style={[styles.ownerCard, styles.storeCard]}>
                  <Image source={{ uri: item.store?.logo || 'https://via.placeholder.com/150' }} style={styles.ownerAvatarImg} />
                  <View style={styles.sellerInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.sellerName}>{item.store?.name}</Text>
                      <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    </View>
                    <Text style={styles.storeAddress}>{item.store?.address}</Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#ffc107" />
                      <Text style={styles.ratingText}>4.8 (Expert)</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                </View>
              </TouchableOpacity>
            </View>
          ) : item.owner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{isDonation ? 'Donateur' : 'Vendeur'}</Text>
              <View style={styles.ownerCard}>
                <View style={styles.ownerAvatarIcon}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View style={styles.sellerInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.sellerName}>{item.owner?.display_name}</Text>
                    {item.owner?.level && (
                      <View style={{ backgroundColor: getLevelBadge(item.owner.level).color, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.xs }}>
                        <Text style={{ fontSize: Typography.xs, color: '#fff', fontWeight: Typography.bold }}>{getLevelBadge(item.owner.level).label}</Text>
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
                {!isOwner && (
                  <TouchableOpacity style={styles.chatButton} onPress={handleContact}>
                    <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {isDonation && (
            <View style={styles.safetyTip}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={styles.safetyText}>
                Conseil sécurité: Rencontrez dans un lieu public et vérifiez la fraîcheur des produits
              </Text>
            </View>
          )}
        </View>

        {!isDonation && item.owner_id === user?.id && (
          <View style={styles.offersSection}>
            <Text style={styles.offersSectionTitle}>
              Offres reçues ({offers.filter(o => o.status === 'pending').length})
            </Text>
            {loadingOffers && <ActivityIndicator size="small" color={colors.primary} />}
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
                      <Text style={styles.offerAmount}>{(offer.amount_cents / 100).toFixed(2)}€</Text>
                      <Text style={styles.offerSavings}>
                        Réduction de {(((item.price_cents! - offer.amount_cents) / item.price_cents!) * 100).toFixed(0)}%
                      </Text>
                    </View>
                    <View style={styles.offerActions}>
                      <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptOffer(offer.id)}>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.acceptButtonText}>Accepter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.declineButton} onPress={() => handleDeclineOffer(offer.id)}>
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
        originalPrice={item?.type === 'rent' ? (item.price_per_day_cents || 0) : (item?.price_cents || 0)}
        isRental={item?.type === 'rent'}
        onOfferSubmit={handleMakeOffer}
      />

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
          onBookingComplete={() => fetchItem()}
        />
      )}

      {item.status === 'active' && (
        <View style={styles.footer}>
          {isDonation ? (
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
            item.owner_id === user?.id ? (
              <View style={styles.ownerFooterInfo}>
                <Text style={styles.ownerInfoText}>✅ C'est votre annonce</Text>
              </View>
            ) : myAcceptedOffer ? (
              <View style={styles.acceptedOfferContainer}>
                <View style={styles.acceptedOfferInfo}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  <View style={styles.acceptedOfferText}>
                    <Text style={styles.acceptedOfferTitle}>✅ Votre offre a été acceptée !</Text>
                    <Text style={styles.acceptedOfferPrice}>{(myAcceptedOffer.amount_cents / 100).toFixed(2)}€</Text>
                    <Text style={styles.acceptedOfferTimer}>Paiement requis: {getTimeRemaining()}</Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.actionButton, { width: '100%' }]} onPress={handleBuy}>
                  <Text style={styles.actionButtonText}>Payer maintenant</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.footerActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => setShowOfferModal(true)}
                >
                  <Ionicons name="pricetag-outline" size={22} color={colors.primary} />
                  <Text style={styles.secondaryButtonText}>
                    {item.type === 'rent' ? 'Négocier' : 'Faire une offre'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={handleBuy}>
                  <Ionicons name={item.type === 'rent' ? 'calendar-outline' : 'cart-outline'} size={22} color="#fff" />
                  <Text style={styles.primaryButtonText}>
                    {item.type === 'rent' ? 'Louer' : 'Acheter'}
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
              {item.status === 'reserved' ? 'Réservé' : item.status === 'completed' ? 'Terminé' : 'Expiré'}
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
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  imageContainer: {
    height: 350,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  content: {
    padding: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: Spacing.lg,
  },
  price: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: colors.primary,
  },
  depositText: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  freeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  freeBadgeText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: Typography.xs,
    color: colors.primary,
    fontWeight: Typography.semibold,
  },
  urgentTag: {
    backgroundColor: '#FDF0E6',
  },
  urgentText: {
    fontSize: Typography.xs,
    color: colors.accent,
    fontWeight: Typography.semibold,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: colors.textPrimary,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.base,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locationText: {
    fontSize: Typography.base,
    color: colors.textSecondary,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  storeCard: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ownerAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
  },
  ownerAvatarIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  sellerName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: colors.textPrimary,
  },
  storeAddress: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: Typography.bold,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyTip: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  safetyText: {
    flex: 1,
    fontSize: Typography.sm,
    color: colors.primary,
    lineHeight: 20,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: Spacing.md,
  },
  footerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  statusBadge: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statusText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: colors.textTertiary,
  },
  ownerFooterInfo: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  ownerInfoText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: colors.primary,
  },
  offersSection: {
    padding: Spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  offersSectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
    marginBottom: Spacing.md,
  },
  noOffersText: {
    fontSize: Typography.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  offerCard: {
    backgroundColor: colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerBuyer: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  offerAmount: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: colors.primary,
    marginBottom: 2,
  },
  offerSavings: {
    fontSize: Typography.xs,
    color: colors.textTertiary,
  },
  offerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  declineButton: {
    backgroundColor: colors.error,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptedOfferContainer: {
    flex: 1,
    gap: Spacing.md,
  },
  acceptedOfferInfo: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  acceptedOfferText: {
    flex: 1,
  },
  acceptedOfferTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: colors.primary,
    marginBottom: 4,
  },
  acceptedOfferPrice: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  acceptedOfferTimer: {
    fontSize: Typography.sm,
    color: colors.accent,
    fontWeight: Typography.semibold,
  },
});
