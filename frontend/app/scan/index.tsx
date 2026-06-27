import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { API_URL } from '../../src/config/api';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/theme';

interface ScanResult {
  titre: string;
  categorie: string;
  product_type?: string;
  etat: string;
  condition_form: string;
  description: string;
  prix_min: number;
  prix_max: number;
  reparabilite: string;
  orientation: string;
  materiaux: string[];
  co2_evite_kg: number;
  circular_score: number;
  circular_status: string;
  circular_color: string;
  circular_breakdown: Record<string, number>;
  local_demand: number;
  confidence: number;
}

const ORIENTATION_LABELS: Record<string, { label: string; icon: string }> = {
  revente: { label: 'Revente', icon: 'pricetag' },
  don: { label: 'Don', icon: 'gift' },
  ressourcerie: { label: 'Ressourcerie', icon: 'storefront' },
  reparation: { label: 'Réparation', icon: 'construct' },
  recyclage: { label: 'Recyclage', icon: 'sync' },
};

const REPAR_LABELS: Record<string, string> = {
  facile: 'Facile à réparer',
  moyenne: 'Réparabilité moyenne',
  difficile: 'Difficile à réparer',
  non_reparable: 'Non réparable',
};

export default function ScanScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (result) {
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    }
  }, [result]);

  const capture = async (fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission requise', 'Accès caméra nécessaire'); return; }
      }
      const opts = { allowsEditing: true, aspect: [4, 3] as [number, number], quality: 0.4, base64: true };
      const res = fromCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync({ ...opts, mediaTypes: ['images'] });
      if (res.canceled || !res.assets?.[0]?.base64) return;
      const dataUri = `data:image/jpeg;base64,${res.assets[0].base64}`;
      setPhoto(dataUri);
      analyze(dataUri);
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'accéder à la photo");
    }
  };

  const analyze = async (dataUri: string) => {
    setLoading(true);
    setResult(null);
    try {
      // Géoloc optionnelle pour calculer la demande locale.
      let coords: { lat?: number; lng?: number } = {};
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }
      } catch {}

      const { data } = await axios.post(
        `${API_URL}/scan`,
        { image_base64: dataUri, ...coords },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 45000 }
      );
      setResult(data);
    } catch (e: any) {
      Alert.alert('Analyse impossible', e.response?.data?.detail || 'Réessaie avec une photo plus nette.');
      setPhoto(null);
    } finally {
      setLoading(false);
    }
  };

  const createListing = () => {
    if (!result || !photo) return;
    const type = result.orientation === 'don' ? 'donation' : 'sale';
    const midPrice = result.prix_min && result.prix_max
      ? Math.round((result.prix_min + result.prix_max) / 2)
      : (result.prix_max || result.prix_min || 0);
    router.push({
      pathname: '/post/market',
      params: {
        type,
        title: result.titre,
        category: result.categorie,
        condition: result.condition_form,
        price: midPrice ? String(midPrice) : '',
        description: result.description,
        photo,
        scanScore: String(result.circular_score),
      },
    } as any);
  };

  const reset = () => { setPhoto(null); setResult(null); };

  // ─── Écran initial (capture) ───────────────────────────────────────────────
  if (!photo) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yondly Scan</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons name="scan" size={48} color={colors.primary} />
          </View>
          <Text style={styles.introTitle}>Photographie ton objet</Text>
          <Text style={styles.introSub}>
            Yondly identifie l'objet, estime sa valeur, son impact carbone et te recommande
            la meilleure orientation — en quelques secondes.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => capture(true)}>
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={styles.primaryBtnText}>Prendre une photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => capture(false)}>
            <Ionicons name="images-outline" size={20} color={colors.primary} />
            <Text style={styles.secondaryBtnText}>Choisir dans la galerie</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Écran preview / loader / résultat ──────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={reset} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analyse</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Image source={{ uri: photo }} style={styles.preview} />

        {loading && (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Analyse de l'objet en cours…</Text>
            <Text style={styles.loaderSub}>Catégorie · état · prix · impact · score</Text>
          </View>
        )}

        {result && (
          <Animated.View style={{ opacity: fade, paddingHorizontal: Spacing.lg }}>
            {/* Circular Score */}
            <View style={[styles.scoreCard, { backgroundColor: result.circular_color + '12' }]}>
              <View style={[styles.scoreCircle, { borderColor: result.circular_color }]}>
                <Text style={[styles.scoreValue, { color: result.circular_color }]}>
                  {result.circular_score}
                </Text>
                <Text style={styles.scoreOutOf}>/100</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scoreLabel}>Circular Score</Text>
                <Text style={[styles.scoreStatus, { color: result.circular_color }]}>
                  {result.circular_status}
                </Text>
              </View>
            </View>

            {/* Titre + catégorie */}
            <Text style={styles.resultTitle}>{result.titre}</Text>
            <View style={styles.tagRow}>
              <View style={styles.tag}><Text style={styles.tagText}>{result.categorie}</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>{result.etat}</Text></View>
            </View>

            {result.description ? <Text style={styles.resultDesc}>{result.description}</Text> : null}

            {/* Grille d'infos */}
            <View style={styles.infoGrid}>
              <View style={styles.infoCell}>
                <Ionicons name="cash-outline" size={18} color={colors.sale} />
                <Text style={styles.infoLabel}>Prix de revente</Text>
                <Text style={styles.infoValue}>
                  {result.prix_min}–{result.prix_max} €
                </Text>
              </View>
              <View style={styles.infoCell}>
                <Ionicons name="leaf-outline" size={18} color={colors.primary} />
                <Text style={styles.infoLabel}>CO₂ évité</Text>
                <Text style={styles.infoValue}>{result.co2_evite_kg} kg</Text>
              </View>
              <View style={styles.infoCell}>
                <Ionicons name="construct-outline" size={18} color={colors.rent} />
                <Text style={styles.infoLabel}>Réparabilité</Text>
                <Text style={styles.infoValue}>{REPAR_LABELS[result.reparabilite] || result.reparabilite}</Text>
              </View>
              <View style={styles.infoCell}>
                <Ionicons name="search-outline" size={18} color={colors.service} />
                <Text style={styles.infoLabel}>Demande locale</Text>
                <Text style={styles.infoValue}>{result.local_demand} objet(s)</Text>
              </View>
            </View>

            {/* Orientation recommandée */}
            <View style={styles.orientationCard}>
              <Ionicons
                name={(ORIENTATION_LABELS[result.orientation]?.icon || 'compass') as any}
                size={22}
                color={colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.orientationLabel}>Orientation recommandée</Text>
                <Text style={styles.orientationValue}>
                  {ORIENTATION_LABELS[result.orientation]?.label || result.orientation}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {result && !loading && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={createListing}>
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.primaryBtnText}>Créer l'annonce</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryBtn} onPress={reset}>
            <Text style={styles.retryText}>Reprendre une photo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: colors.textPrimary },

  intro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  introIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
  },
  introTitle: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: colors.textPrimary, marginBottom: Spacing.sm },
  introSub: { fontSize: Typography.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xxl },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: BorderRadius.lg,
    width: '100%', ...Shadows.button,
  },
  primaryBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: Typography.bold },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, marginTop: Spacing.md, width: '100%',
  },
  secondaryBtnText: { color: colors.primary, fontSize: Typography.base, fontWeight: Typography.semibold },

  preview: { width: '100%', height: 280, backgroundColor: '#000' },

  loaderBox: { alignItems: 'center', padding: Spacing.xxl, gap: Spacing.sm },
  loaderText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: colors.textPrimary, marginTop: Spacing.md },
  loaderSub: { fontSize: Typography.sm, color: colors.textTertiary },

  scoreCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.lg,
  },
  scoreCircle: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
  },
  scoreValue: { fontSize: 28, fontWeight: Typography.heavy, lineHeight: 30 },
  scoreOutOf: { fontSize: 10, color: colors.textTertiary, marginTop: -2 },
  scoreLabel: { fontSize: Typography.sm, color: colors.textSecondary, fontWeight: Typography.semibold },
  scoreStatus: { fontSize: Typography.lg, fontWeight: Typography.bold, marginTop: 2 },

  resultTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: colors.textPrimary, marginTop: Spacing.lg },
  tagRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  tag: { backgroundColor: colors.surfaceAlt, borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontSize: Typography.xs, color: colors.textSecondary, fontWeight: Typography.semibold },
  resultDesc: { fontSize: Typography.base, color: colors.textSecondary, lineHeight: 22, marginTop: Spacing.md },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.lg },
  infoCell: {
    width: '47%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: 4, ...Shadows.card,
  },
  infoLabel: { fontSize: Typography.xs, color: colors.textTertiary, marginTop: 2 },
  infoValue: { fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary },

  orientationCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: colors.primaryLight, borderRadius: BorderRadius.md,
    padding: Spacing.lg, marginTop: Spacing.lg,
  },
  orientationLabel: { fontSize: Typography.xs, color: colors.textSecondary, fontWeight: Typography.semibold },
  orientationValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: colors.primary, marginTop: 2 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.lg, paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  retryBtn: { alignItems: 'center', paddingVertical: 12 },
  retryText: { color: colors.textSecondary, fontSize: Typography.sm },
});
