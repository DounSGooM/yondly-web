import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import StyledQRCode from '../../src/components/StyledQRCode';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';
import RatingModal from '../../src/components/RatingModal';

interface Order {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  amount_cents: number;
  platform_fee_cents: number;
  payout_cents: number;
  payment_status: string;
  handoff: {
    mode: string;
    code: string;
    photo_url?: string;
  };
  created_at: string;
  item?: any;
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user, token } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState('');
  const [completing, setCompleting] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    fetchOrder();
    checkCanRate();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(response.data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger cette commande');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const checkCanRate = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/${id}/can-rate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCanRate(response.data.can_rate);
    } catch (error) {
      console.log('Cannot check rating status');
    }
  };

  const handleCompleteHandoff = async () => {
    if (!codeInput.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le code');
      return;
    }

    setCompleting(true);
    try {
      await axios.post(
        `${API_URL}/orders/${id}/handoff?code=${codeInput.toUpperCase()}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Succès', 'Remise confirmée! Le paiement a été libéré.');
      fetchOrder();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Code invalide');
    } finally {
      setCompleting(false);
    }
  };

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4C7B4B" />
      </View>
    );
  }

  if (!order) return null;

  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.seller_id;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Commande" />

      <ScrollView style={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={
                order.payment_status === 'released'
                  ? 'checkmark-circle'
                  : order.payment_status === 'escrowed'
                    ? 'time'
                    : 'card'
              }
              size={48}
              color={
                order.payment_status === 'released'
                  ? '#4caf50'
                  : order.payment_status === 'escrowed'
                    ? '#ff9800'
                    : '#2196f3'
              }
            />
            <Text style={styles.statusTitle}>
              {order.payment_status === 'released'
                ? 'Remise effectuée'
                : order.payment_status === 'escrowed'
                  ? 'En attente de remise'
                  : 'Paiement initié'}
            </Text>
          </View>
        </View>

        {order.item && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Article</Text>
            <View style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{order.item.title}</Text>
                <Text style={styles.itemCategory}>{order.item.category}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatPrice(order.amount_cents)}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du paiement</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Prix de l'article</Text>
              <Text style={styles.priceValue}>{formatPrice(order.amount_cents)}</Text>
            </View>
            {isSeller && (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Frais de plateforme</Text>
                  <Text style={styles.priceValue}>-{formatPrice(order.platform_fee_cents)}</Text>
                </View>
                <View style={[styles.priceRow, styles.priceRowTotal]}>
                  <Text style={styles.priceLabelTotal}>Vous recevez</Text>
                  <Text style={styles.priceValueTotal}>{formatPrice(order.payout_cents)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mode de remise</Text>
          <View style={styles.handoffCard}>
            <Ionicons name="location" size={24} color="#4C7B4B" />
            <View style={styles.handoffInfo}>
              <Text style={styles.handoffTitle}>Remise en main propre</Text>
              <Text style={styles.handoffSubtitle}>Rencontrez-vous dans un lieu public</Text>
            </View>
          </View>
        </View>

        {isBuyer && order.payment_status === 'escrowed' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre code de remise</Text>
            <View style={styles.qrCard}>
              <StyledQRCode value={order.handoff.code} size={180} />
              <Text style={styles.qrCode}>{order.handoff.code}</Text>
              <Text style={styles.qrHint}>
                Présentez ce code au vendeur lors de la remise
              </Text>
            </View>
          </View>
        )}

        {isSeller && order.payment_status === 'escrowed' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scanner le code</Text>
            <View style={styles.scanCard}>
              <Ionicons name="qr-code" size={64} color="#4C7B4B" />
              <Text style={styles.scanTitle}>Scanner le QR code de l'acheteur</Text>
              <Text style={styles.scanSubtitle}>ou entrez le code manuellement:</Text>

              <TouchableOpacity
                style={{ position: 'absolute', top: 0, right: 0, padding: 8 }}
                onPress={() => router.push(`/order/dispute?orderId=${order.id}` as any)}
              >
                <Text style={{ color: '#d32f2f', fontSize: 12 }}>Signaler un litige</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.codeInput}
                placeholder="XXXXXX"
                value={codeInput}
                onChangeText={(text) => setCodeInput(text.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
              />

              <TouchableOpacity
                style={[styles.confirmButton, completing && styles.confirmButtonDisabled]}
                onPress={handleCompleteHandoff}
                disabled={completing}
              >
                <Text style={styles.confirmButtonText}>
                  {completing ? 'Confirmation...' : 'Confirmer la remise'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {order.payment_status === 'released' && (
          <View style={styles.section}>
            <View style={styles.successCard}>
              <Ionicons name="checkmark-circle" size={48} color="#4caf50" />
              <Text style={styles.successTitle}>Transaction terminée!</Text>
              <Text style={styles.successText}>
                {isBuyer
                  ? 'Vous avez reçu votre article.'
                  : `Le paiement de ${formatPrice(order.payout_cents)} a été libéré`}
              </Text>

              {/* Dispute Button */}
              {isBuyer && !canRate && (
                <TouchableOpacity
                  style={{ marginTop: 12, padding: 8 }}
                  onPress={() => router.push(`/order/dispute?orderId=${order.id}` as any)}
                >
                  <Text style={{ color: '#d32f2f', textDecorationLine: 'underline', fontSize: 13 }}>
                    Signaler un problème avec cette commande
                  </Text>
                </TouchableOpacity>
              )}

              {isBuyer && canRate && (
                <TouchableOpacity
                  style={styles.rateButton}
                  onPress={() => setShowRatingModal(true)}
                >
                  <Ionicons name="star" size={20} color="#fff" />
                  <Text style={styles.rateButtonText}>Noter le vendeur</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>N° de commande</Text>
              <Text style={styles.infoValue}>#{order.id.substring(0, 8)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Statut</Text>
              <Text style={styles.infoValue}>
                {order.payment_status === 'released'
                  ? 'Terminé'
                  : order.payment_status === 'escrowed'
                    ? 'En attente'
                    : 'Initié'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <RatingModal
        visible={showRatingModal}
        orderId={order.id}
        sellerName={order.item?.owner?.display_name || 'Vendeur'}
        token={token || ''}
        onClose={() => setShowRatingModal(false)}
        onSuccess={() => {
          setCanRate(false);
        }}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusHeader: {
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4C7B4B',
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priceRowTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  priceLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4C7B4B',
  },
  priceValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4C7B4B',
  },
  handoffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  handoffInfo: {
    flex: 1,
    marginLeft: 12,
  },
  handoffTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  handoffSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  qrCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4C7B4B',
    marginTop: 16,
    letterSpacing: 4,
  },
  qrHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  scanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  scanSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 16,
  },
  codeInput: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#4C7B4B',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  confirmButton: {
    width: '100%',
    backgroundColor: '#4C7B4B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4caf50',
    marginTop: 16,
  },
  successText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
