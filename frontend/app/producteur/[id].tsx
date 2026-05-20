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
import { useAuthStore } from '../../src/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../src/config/api';
import ScreenHeader from '../../src/components/ScreenHeader';

// ─── Types ────────────────────────────────────────────────────────────────────

type Certification = 'bio' | 'hve' | 'agroecologie' | 'label_rouge' | 'raisonee';

type ProducteurProduit = {
  id: string;
  nom: string;
  disponible: boolean;
  saison?: string;
  prix_unitaire?: number; // centimes
  unite?: string; // ex: "kg", "botte", "pièce"
};

type Producteur = {
  id: string;
  nom: string;
  type_production: string; // ex: "Maraîchage", "Élevage", "Arboriculture"
  description?: string;
  adresse: string;
  ville: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
  website?: string;
  certifications?: Certification[];
  produits?: ProducteurProduit[];
  rayon_km?: number; // rayon de livraison/retrait
  followers_count?: number;
  // Impact
  kg_vendus_local?: number;
  co2_economise_kg?: number;
  pat_partenaire?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CERTIFICATION_LABELS: Record<Certification, { label: string; color: string; bg: string }> = {
  bio: { label: 'Agriculture Bio', color: '#27500A', bg: '#EAF3DE' },
  hve: { label: 'HVE', color: '#0C447C', bg: '#E6F1FB' },
  agroecologie: { label: 'Agroécologie', color: '#633806', bg: '#FAEEDA' },
  label_rouge: { label: 'Label Rouge', color: '#791F1F', bg: '#FCEBEB' },
  raisonee: { label: 'Agriculture raisonnée', color: '#3C3489', bg: '#EEEDFE' },
};

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ProducteurDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const producteurId = params.id;
  const user = useAuthStore((state) => state.user);

  const [producteur, setProducteur] = useState<Producteur | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    loadProducteur();
  }, []);

  const loadProducteur = async () => {
    try {
      const response = await axios.get(`${API_URL}/producteurs/${producteurId}`);
      setProducteur(response.data);

      if (user) {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          try {
            const statusResponse = await axios.get(
              `${API_URL}/producteurs/${producteurId}/status`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setFollowing(statusResponse.data.is_following);
          } catch (e) {
            // silencieux si pas de suivi
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement producteur:', error);
      Alert.alert('Erreur', 'Impossible de charger ce producteur');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Vous devez être connecté pour suivre un producteur');
      return;
    }
    setFollowLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (following) {
        await axios.delete(`${API_URL}/producteurs/${producteurId}/follow`, config);
        setFollowing(false);
        if (producteur) {
          setProducteur({ ...producteur, followers_count: Math.max(0, (producteur.followers_count || 0) - 1) });
        }
      } else {
        await axios.post(`${API_URL}/producteurs/${producteurId}/follow`, {}, config);
        setFollowing(true);
        if (producteur) {
          setProducteur({ ...producteur, followers_count: (producteur.followers_count || 0) + 1 });
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le suivi');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDirections = () => {
    const lat = producteur?.lat;
    const lng = producteur?.lng;
    if (lat && lng) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    } else {
      Alert.alert('Erreur', 'Adresse introuvable sur la carte');
    }
  };

  const handleCall = () => {
    if (producteur?.phone) Linking.openURL(`tel:${producteur.phone}`);
  };

  const handleWebsite = () => {
    if (producteur?.website) Linking.openURL(producteur.website);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez ${producteur?.nom} sur Yondly – Producteur local`,
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const handleCommandeProduit = (produit: ProducteurProduit) => {
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Connectez-vous pour contacter ce producteur.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }
    // Ouvre le chat avec le producteur avec le produit pré-sélectionné
    router.push(`/chat/${producteur?.id}?produit=${produit.id}`);
  };

  // ─── Loading / Not found ───────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C7B4B" />
      </View>
    );
  }

  if (!producteur) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#666' }}>Producteur introuvable</Text>
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          rightAction={
            <TouchableOpacity style={{ padding: 8 }} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#333" />
            </TouchableOpacity>
          }
        />

        <View style={styles.content}>

          {/* ── En-tête ── */}
          <View style={styles.titleSection}>
            {producteur.pat_partenaire && (
              <View style={styles.patBadge}>
                <Ionicons name="leaf" size={14} color="#27500A" />
                <Text style={styles.patBadgeText}>Partenaire Grand Poitiers</Text>
              </View>
            )}
            <Text style={styles.producteurNom}>{producteur.nom}</Text>
            <Text style={styles.typeProduction}>{producteur.type_production}</Text>
            <Text style={styles.ville}>
              <Ionicons name="location" size={14} color="#999" /> {producteur.ville}
              {producteur.rayon_km ? ` · Livraison ${producteur.rayon_km} km` : ''}
            </Text>
          </View>

          {/* ── Description ── */}
          {producteur.description && (
            <Text style={styles.description}>{producteur.description}</Text>
          )}

          {/* ── Certifications ── */}
          {producteur.certifications && producteur.certifications.length > 0 && (
            <View style={styles.certificationsRow}>
              {producteur.certifications.map((cert) => {
                const c = CERTIFICATION_LABELS[cert];
                return (
                  <View key={cert} style={[styles.certBadge, { backgroundColor: c.bg }]}>
                    <Text style={[styles.certText, { color: c.color }]}>{c.label}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Impact local ── */}
          {(producteur.kg_vendus_local || producteur.co2_economise_kg) && (
            <View style={styles.impactSection}>
              <Text style={styles.sectionTitle}>Impact local</Text>
              <View style={styles.impactRow}>
                {producteur.kg_vendus_local ? (
                  <View style={styles.impactCard}>
                    <Ionicons name="basket" size={22} color="#4C7B4B" />
                    <Text style={styles.impactValue}>{producteur.kg_vendus_local} kg</Text>
                    <Text style={styles.impactLabel}>vendus localement</Text>
                  </View>
                ) : null}
                {producteur.co2_economise_kg ? (
                  <View style={styles.impactCard}>
                    <Ionicons name="leaf" size={22} color="#4C7B4B" />
                    <Text style={styles.impactValue}>{producteur.co2_economise_kg} kg</Text>
                    <Text style={styles.impactLabel}>CO₂ économisé</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* ── Produits disponibles ── */}
          {producteur.produits && producteur.produits.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Produits ({producteur.produits.filter(p => p.disponible).length} disponibles)
              </Text>
              {producteur.produits.map((produit) => (
                <View key={produit.id} style={[styles.produitRow, !produit.disponible && styles.produitIndisponible]}>
                  <View style={styles.produitInfo}>
                    <Text style={styles.produitNom}>{produit.nom}</Text>
                    {produit.saison && (
                      <Text style={styles.produitSaison}>Saison : {produit.saison}</Text>
                    )}
                  </View>
                  <View style={styles.produitRight}>
                    {produit.prix_unitaire && produit.unite && (
                      <Text style={styles.produitPrix}>
                        {(produit.prix_unitaire / 100).toFixed(2)}€/{produit.unite}
                      </Text>
                    )}
                    {produit.disponible ? (
                      <TouchableOpacity
                        style={styles.commandeBtn}
                        onPress={() => handleCommandeProduit(produit)}
                      >
                        <Text style={styles.commandeBtnText}>Contacter</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.indispoBadge}>
                        <Text style={styles.indispoText}>Hors saison</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Infos pratiques ── */}
          <View style={styles.infoSection}>
            <TouchableOpacity style={styles.infoRow} onPress={handleDirections}>
              <Ionicons name="location" size={24} color="#4C7B4B" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Adresse</Text>
                <Text style={styles.infoValue}>{producteur.adresse}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            {producteur.phone && (
              <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
                <Ionicons name="call" size={24} color="#4C7B4B" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Téléphone</Text>
                  <Text style={styles.infoValue}>{producteur.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            )}

            {producteur.website && (
              <TouchableOpacity style={styles.infoRow} onPress={handleWebsite}>
                <Ionicons name="globe" size={24} color="#4C7B4B" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Site web</Text>
                  <Text style={styles.infoValue}>{producteur.website}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Abonnés ── */}
          <View style={styles.followSection}>
            <View style={styles.followInfo}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.followersText}>{producteur.followers_count || 0} abonnés</Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ── Barre d'actions ── */}
      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
          <Ionicons name="navigate" size={24} color="#4C7B4B" />
          <Text style={styles.actionButtonText}>Itinéraire</Text>
        </TouchableOpacity>
        {producteur.phone && (
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  content: { padding: 16 },

  // En-tête
  titleSection: { marginBottom: 16 },
  patBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EAF3DE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 10 },
  patBadgeText: { fontSize: 12, color: '#27500A', fontWeight: '600' },
  producteurNom: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  typeProduction: { fontSize: 16, color: '#666', marginBottom: 4 },
  ville: { fontSize: 14, color: '#999' },

  description: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 16 },

  // Certifications
  certificationsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  certBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  certText: { fontSize: 12, fontWeight: '600' },

  // Impact
  impactSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20 },
  impactRow: { flexDirection: 'row', gap: 12 },
  impactCard: { flex: 1, alignItems: 'center', backgroundColor: '#f0f7f0', borderRadius: 10, padding: 14, gap: 4 },
  impactValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  impactLabel: { fontSize: 11, color: '#666', textAlign: 'center' },

  // Produits
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 14 },
  produitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  produitIndisponible: { opacity: 0.5 },
  produitInfo: { flex: 1 },
  produitNom: { fontSize: 15, fontWeight: '500', color: '#333' },
  produitSaison: { fontSize: 12, color: '#999', marginTop: 2 },
  produitRight: { alignItems: 'flex-end', gap: 6 },
  produitPrix: { fontSize: 14, fontWeight: '600', color: '#4C7B4B' },
  commandeBtn: { backgroundColor: '#4C7B4B', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  commandeBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  indispoBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  indispoText: { fontSize: 12, color: '#999' },

  // Infos pratiques
  infoSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoTextContainer: { flex: 1, marginLeft: 12 },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  infoValue: { fontSize: 16, color: '#333' },

  // Abonnés
  followSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24 },
  followInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  followersText: { fontSize: 16, color: '#666' },

  // Barre d'actions
  actionsBar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0', padding: 16, gap: 12 },
  actionButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#f5f5f5' },
  actionButtonText: { fontSize: 12, color: '#4C7B4B', marginTop: 4, fontWeight: '600' },
  followButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#4C7B4B', gap: 6 },
  followingButton: { backgroundColor: '#666' },
  followButtonText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
