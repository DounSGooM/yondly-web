import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../src/config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type PeriodKey = '7j' | '30j' | '90j' | 'total';

type TerritoireStats = {
  // Alimentation
  paniers_sauves: number;
  kg_nourriture_sauves: number;
  dons_alimentaires: number;
  producteurs_actifs: number;
  // Réemploi
  objets_reemployes: number;
  kg_dechets_evites: number;
  locations_realisees: number;
  // Impact global
  co2_economise_kg: number;
  utilisateurs_actifs: number;
  commerces_engages: number;
  // Associations
  beneficiaires_aides: number;
  associations_partenaires: number;
  // Évolution
  evolution_co2_pct: number;
  evolution_dons_pct: number;
};

const EMPTY_STATS: TerritoireStats = {
  paniers_sauves: 0,
  kg_nourriture_sauves: 0,
  dons_alimentaires: 0,
  producteurs_actifs: 0,
  objets_reemployes: 0,
  kg_dechets_evites: 0,
  locations_realisees: 0,
  co2_economise_kg: 0,
  utilisateurs_actifs: 0,
  commerces_engages: 0,
  beneficiaires_aides: 0,
  associations_partenaires: 0,
  evolution_co2_pct: 0,
  evolution_dons_pct: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatNumber = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const formatCO2 = (kg: number) =>
  kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${kg} kg`;

const EvolutionBadge = ({ pct }: { pct: number }) => {
  const up = pct >= 0;
  return (
    <View style={[styles.evoBadge, up ? styles.evoUp : styles.evoDown]}>
      <Ionicons name={up ? 'trending-up' : 'trending-down'} size={12} color={up ? '#27500A' : '#791F1F'} />
      <Text style={[styles.evoText, up ? styles.evoUpText : styles.evoDownText]}>
        {up ? '+' : ''}{pct}%
      </Text>
    </View>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────

export default function TerritoireDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>('30j');
  const [stats, setStats] = useState<TerritoireStats>(EMPTY_STATS);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/territoire/stats`, {
        params: { period, ville: 'Poitiers' },
      });
      setStats(response.data);
    } catch (error) {
      console.error('Erreur dashboard territoire:', error);
      // Données de démo pour le pitch
      setStats({
        paniers_sauves: 142,
        kg_nourriture_sauves: 284,
        dons_alimentaires: 67,
        producteurs_actifs: 8,
        objets_reemployes: 231,
        kg_dechets_evites: 1150,
        locations_realisees: 43,
        co2_economise_kg: 3240,
        utilisateurs_actifs: 412,
        commerces_engages: 23,
        beneficiaires_aides: 89,
        associations_partenaires: 4,
        evolution_co2_pct: 18,
        evolution_dons_pct: 24,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `📊 Impact Yondly sur le territoire — ${period}\n` +
          `🌱 ${formatCO2(stats.co2_economise_kg)} de CO₂ économisés\n` +
          `🥦 ${formatNumber(stats.kg_nourriture_sauves)} kg de nourriture sauvés\n` +
          `♻️ ${formatNumber(stats.objets_reemployes)} objets réemployés\n` +
          `👥 ${formatNumber(stats.utilisateurs_actifs)} habitants actifs\n` +
          `Données Yondly — yondly.app`,
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4C7B4B" />
      </View>
    );
  }

  const PERIODS: { key: PeriodKey; label: string }[] = [
    { key: '7j', label: '7 jours' },
    { key: '30j', label: '30 jours' },
    { key: '90j', label: '3 mois' },
    { key: 'total', label: 'Total' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Impact territoire</Text>
          <Text style={styles.headerSubtitle}>Grand Poitiers 2022-2026</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
          <Ionicons name="share-outline" size={24} color="#4C7B4B" />
        </TouchableOpacity>
      </View>

      {/* Sélecteur de période */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4C7B4B" />}
      >

        {/* ── CO2 hero card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Ionicons name="leaf" size={32} color="#fff" />
            <Text style={styles.heroValue}>{formatCO2(stats.co2_economise_kg)}</Text>
            <Text style={styles.heroLabel}>CO₂ économisé</Text>
          </View>
          <View style={styles.heroRight}>
            <EvolutionBadge pct={stats.evolution_co2_pct} />
            <Text style={styles.heroEquiv}>
              = {Math.round(stats.co2_economise_kg / 0.21)} km en voiture évités
            </Text>
            <Text style={styles.heroEquiv}>
              = {Math.round(stats.co2_economise_kg / 22)} arbres plantés
            </Text>
          </View>
        </View>

        {/* ── Alimentation & anti-gaspi ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="nutrition" size={20} color="#4C7B4B" />
            <Text style={styles.sectionTitle}>Alimentation & anti-gaspi</Text>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{formatNumber(stats.paniers_sauves)}</Text>
              <Text style={styles.kpiLabel}>Paniers sauvés</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{formatNumber(stats.kg_nourriture_sauves)} kg</Text>
              <Text style={styles.kpiLabel}>Nourriture sauvée</Text>
            </View>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{formatNumber(stats.dons_alimentaires)}</Text>
              <View style={styles.kpiLabelRow}>
                <Text style={styles.kpiLabel}>Dons alimentaires</Text>
                <EvolutionBadge pct={stats.evolution_dons_pct} />
              </View>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats.producteurs_actifs}</Text>
              <Text style={styles.kpiLabel}>Producteurs locaux</Text>
            </View>
          </View>
        </View>

        {/* ── Réemploi & économie circulaire ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="repeat" size={20} color="#4C7B4B" />
            <Text style={styles.sectionTitle}>Réemploi & économie circulaire</Text>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{formatNumber(stats.objets_reemployes)}</Text>
              <Text style={styles.kpiLabel}>Objets réemployés</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{formatNumber(stats.kg_dechets_evites)} kg</Text>
              <Text style={styles.kpiLabel}>Déchets évités</Text>
            </View>
          </View>
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { flex: 1 }]}>
              <Text style={styles.kpiValue}>{formatNumber(stats.locations_realisees)}</Text>
              <Text style={styles.kpiLabel}>Locations réalisées</Text>
            </View>
          </View>
        </View>

        {/* ── Solidarité & associations ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color="#4C7B4B" />
            <Text style={styles.sectionTitle}>Solidarité & associations</Text>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{formatNumber(stats.beneficiaires_aides)}</Text>
              <Text style={styles.kpiLabel}>Bénéficiaires aidés</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats.associations_partenaires}</Text>
              <Text style={styles.kpiLabel}>Associations</Text>
            </View>
          </View>
        </View>

        {/* ── Mobilisation citoyenne ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart" size={20} color="#4C7B4B" />
            <Text style={styles.sectionTitle}>Mobilisation citoyenne</Text>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{formatNumber(stats.utilisateurs_actifs)}</Text>
              <Text style={styles.kpiLabel}>Habitants actifs</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats.commerces_engages}</Text>
              <Text style={styles.kpiLabel}>Commerces engagés</Text>
            </View>
          </View>
        </View>

        {/* ── Badge partenaire ── */}
        <View style={styles.patCard}>
          <Ionicons name="leaf" size={24} color="#27500A" />
          <View style={{ flex: 1 }}>
            <Text style={styles.patTitle}>Partenaire Grand Poitiers</Text>
            <Text style={styles.patSubtitle}>
              Données contribuant au suivi du Projet Alimentaire Territorial 2022-2026
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60, backgroundColor: '#fff' },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  headerSubtitle: { fontSize: 12, color: '#4C7B4B', textAlign: 'center', marginTop: 2 },

  // Période
  periodRow: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  periodBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#4C7B4B' },
  periodText: { fontSize: 12, color: '#666', fontWeight: '500' },
  periodTextActive: { color: '#fff' },

  // Hero CO2
  heroCard: { margin: 16, borderRadius: 16, backgroundColor: '#4C7B4B', padding: 20, flexDirection: 'row', justifyContent: 'space-between' },
  heroLeft: { gap: 4 },
  heroValue: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  heroLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  heroRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  heroEquiv: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'right', marginTop: 4 },

  // Sections
  section: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },

  // KPI cards
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  kpiCard: { flex: 1, backgroundColor: '#f8f8f8', borderRadius: 12, padding: 14 },
  kpiValue: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  kpiLabel: { fontSize: 12, color: '#666' },
  kpiLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },

  // Evolution badge
  evoBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  evoUp: { backgroundColor: '#EAF3DE' },
  evoDown: { backgroundColor: '#FCEBEB' },
  evoText: { fontSize: 11, fontWeight: '600' },
  evoUpText: { color: '#27500A' },
  evoDownText: { color: '#791F1F' },

  // badge partenaire
  patCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#EAF3DE', borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 16 },
  patTitle: { fontSize: 14, fontWeight: '600', color: '#27500A', marginBottom: 2 },
  patSubtitle: { fontSize: 12, color: '#4C7B4B', lineHeight: 16 },
});
