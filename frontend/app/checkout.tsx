import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../src/store/authStore';

import { API_URL } from '../src/config/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { orderId, itemId } = useLocalSearchParams();
  const { token } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else if (itemId) {
      fetchItemAndCreateOrder();
    }
  }, [orderId, itemId]);

  const fetchItemAndCreateOrder = async () => {
    try {
      // Fetch item details
      const itemResponse = await axios.get(`${API_URL}/items/${itemId}`);
      const itemData = itemResponse.data;
      setItem(itemData);

      // Create order automatically
      const orderResponse = await axios.post(
        `${API_URL}/orders`,
        { item_id: itemId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrder(orderResponse.data);

      console.log('Order created:', orderResponse.data);
    } catch (error: any) {
      console.error('Error in fetchItemAndCreateOrder:', error);
      Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de créer la commande');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchOrder = async () => {
    try {
      const orderResponse = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(orderResponse.data);

      if (orderResponse.data.item_id) {
        const itemResponse = await axios.get(`${API_URL}/items/${orderResponse.data.item_id}`);
        setItem(itemResponse.data);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la commande');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // Simuler le paiement (2 secondes)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Confirmer le paiement
      const currentOrderId = orderId || order?.id;
      await axios.post(
        `${API_URL}/orders/${currentOrderId}/confirm-payment`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        'Paiement réussi!',
        'Votre paiement a été confirmé. Vous recevrez un code QR pour la remise.',
        [
          {
            text: 'Voir mon QR code',
            onPress: () => router.replace(`/order-detail?id=${currentOrderId}` as any),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Le paiement a échoué');
    } finally {
      setProcessing(false);
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

  if (!order || !item) {
    return (
      <View style={styles.centerContainer}>
        <Text>Commande introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Récapitulatif</Text>

          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemCategory}>{item.category}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prix</Text>
            <Text style={styles.priceValue}>{formatPrice(order.amount_cents)}</Text>
          </View>



          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(order.amount_cents)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Paiement</Text>
          <View style={styles.paymentMethod}>
            <Ionicons name="card" size={24} color="#4C7B4B" />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Paiement sécurisé</Text>
              <Text style={styles.paymentSubtitle}>Mode simulation (Demo MVP)</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color="#4C7B4B" />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Sécurité</Text>
            <Text style={styles.infoSubtitle}>
              Votre argent est retenu jusqu'à la remise de l'article
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="qr-code" size={24} color="#4C7B4B" />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Après paiement</Text>
            <Text style={styles.infoSubtitle}>
              Vous recevrez un code QR à présenter au vendeur
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color="#fff" />
              <Text style={styles.payButtonText}>
                Payer {formatPrice(order.amount_cents)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  itemRow: {
    marginBottom: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
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
  priceSuccess: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4C7B4B',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4C7B4B',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 13,
    color: '#4C7B4B',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#4C7B4B',
    padding: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
