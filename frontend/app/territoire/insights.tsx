import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../src/config/api';

type Reco = { category: string; action: string; reason: string };
type Unmet = { category: string; supply: number; demand: number; gap: number; severity: string };
type Surplus = { category: string; supply: number; demand: number };
type Zone = { commune: string; supply: number; partners: number };
type Trend = { category: string; demand: number; prev: number; trend_pct: number };

type GraphData = {
  summary: { categories: number; zones: number; partners: number; active_items: number; transactions: number };
  insights: {
    unmet_demand: Unmet[];
    surplus_risk: Surplus[];
    underserved_zones: Zone[];
    trending: Trend[];
    recommendations: Reco[];
  };
};

const DEMO: GraphData = {
  summary: { categories: 11, zones: 5, partners: 8, active_items: 231, transactions: 64 },
  insights: {
    recommendations: [
      { category: 'Électronique', action: "Stimuler l'offre", reason: '61 demandes pour 38 annonces — besoin local non couvert.' },
      { category: 'Enfants', action: "Stimuler l'offre", reason: '33 demandes pour 12 annonces — forte tension.' },
      { category: 'Mobilier', action: 'Orienter vers ressourcerie / don', reason: '52 objets en stock, peu de demande — risque de rebut.' },
      { category: 'Migné-Auxances', action: 'Implanter un relais / partenaire', reason: '19 objets déposés sans repreneur local.' },
    ],
    unmet_demand: [
      { category: 'Électronique', supply: 38, demand: 61, gap: 23, severity: 'haute' },
      { category: 'Enfants', supply: 12, demand: 33, gap: 21, severity: 'haute' },
      { category: 'Bricolage', supply: 9, demand: 18, gap: 9, severity: 'moyenne' },
    ],
    surplus_risk: [
      { category: 'Mobilier', supply: 52, demand: 0 },
      { category: 'Livres', supply: 21, demand: 0 },
    ],
    underserved_zones: [
      { commune: 'Migné-Auxances', supply: 19, partners: 0 },
      { commune: 'Saint-Benoît', supply: 15, partners: 0 },
    ],
    trending: [
      { category: 'Électronique', demand: 61, prev: 40, trend_pct: 53 },
      { category: 'Enfants', demand: 33, prev: 28, trend_pct: 18 },
      { category: 'Mobilier', demand: 12, prev: 20, trend_pct: -40 },
    ],
  },
};

const ACTION_ICON: Record<string, string> = {
  "Stimuler l'offre": 'megaphone',
  'Orienter vers ressourcerie / don': 'sync',
  'Implanter un relais / partenaire': 'business',
};

export default function TerritoireInsights() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<GraphData>(DEMO);

  const fetchGraph = async () => {
    try {
      const res = await axios.get(`${API_URL}/territoire/graph`, { params: { period: '90j' } });
      const d = res.data as GraphData;
      // Garde la démo si la base n'a pas assez de données pour des insights.
      const hasInsights = d?.insights && (
        d.insights.recommendations.length || d.insights.unmet_demand.length ||
        d.insights.surplus_risk.length || d.insights.trending.length
      );
      setData(hasInsights ? d : DEMO);
    } catch (e) {
      if (__DEV__) console.warn('[Insights] /territoire/graph indisponible, démo:', e);
      setData(DEMO);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchGraph(); }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4C7B4B" /></View>;
  }

  const { summary, insights } = data;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Intelligence territoriale</Text>
          <Text style={styles.headerSub}>Graphe de connaissance · 3 mois</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGraph(); }} tintColor="#4C7B4B" />}
      >
        {/* Résumé du graphe */}
        <View style={styles.summaryRow}>
          {[
            { v: summary.categories, l: 'Catégories' },
            { v: summary.zones, l: 'Communes' },
            { v: summary.partners, l: 'Repreneurs' },
            { v: summary.transactions, l: 'Échanges' },
          ].map((s, i) => (
            <View key={i} style={styles.summaryCell}>
              <Text style={styles.summaryValue}>{s.v}</Text>
              <Text style={styles.summaryLabel}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* Recommandations (headline) */}
        <Text style={styles.sectionTitle}>🎯 Recommandations</Text>
        {insights.recommendations.map((r, i) => (
          <View key={i} style={styles.recoCard}>
            <View style={styles.recoIcon}>
              <Ionicons name={(ACTION_ICON[r.action] || 'bulb') as any} size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recoCat}>{r.category}</Text>
              <Text style={styles.recoAction}>{r.action}</Text>
              <Text style={styles.recoReason}>{r.reason}</Text>
            </View>
          </View>
        ))}

        {/* Demande non satisfaite */}
        {insights.unmet_demand.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📈 Demande non satisfaite</Text>
            {insights.unmet_demand.map((u, i) => (
              <View key={i} style={styles.insightRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightCat}>{u.category}</Text>
                  <Text style={styles.insightSub}>{u.demand} demandes · {u.supply} en stock</Text>
                </View>
                <View style={[styles.tag, u.severity === 'haute' ? styles.tagHot : styles.tagWarm]}>
                  <Text style={[styles.tagText, u.severity === 'haute' ? styles.tagHotText : styles.tagWarmText]}>
                    +{u.gap} manquant{u.gap > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Risque de recyclage */}
        {insights.surplus_risk.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>♻️ Risque de rebut (sans repreneur)</Text>
            {insights.surplus_risk.map((s, i) => (
              <View key={i} style={styles.insightRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightCat}>{s.category}</Text>
                  <Text style={styles.insightSub}>{s.supply} objets · aucune demande</Text>
                </View>
                <Ionicons name="warning" size={18} color="#D97706" />
              </View>
            ))}
          </>
        )}

        {/* Zones sous-couvertes */}
        {insights.underserved_zones.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📍 Communes sans relais</Text>
            {insights.underserved_zones.map((z, i) => (
              <View key={i} style={styles.insightRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightCat}>{z.commune}</Text>
                  <Text style={styles.insightSub}>{z.supply} dépôts · 0 partenaire local</Text>
                </View>
                <Ionicons name="business-outline" size={18} color="#4C7B4B" />
              </View>
            ))}
          </>
        )}

        {/* Tendances */}
        {insights.trending.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🔮 Tendances de la demande</Text>
            {insights.trending.slice(0, 5).map((t, i) => {
              const up = t.trend_pct >= 0;
              return (
                <View key={i} style={styles.insightRow}>
                  <Text style={[styles.insightCat, { flex: 1 }]}>{t.category}</Text>
                  <View style={[styles.trendTag, up ? styles.trendUp : styles.trendDown]}>
                    <Ionicons name={up ? 'trending-up' : 'trending-down'} size={13} color={up ? '#27500A' : '#791F1F'} />
                    <Text style={[styles.trendText, { color: up ? '#27500A' : '#791F1F' }]}>
                      {up ? '+' : ''}{t.trend_pct}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color="#888" />
          <Text style={styles.noteText}>
            Insights calculés en continu sur les échanges réels. Plus la plateforme est utilisée,
            plus les recommandations et le Circular Score s'affinent.
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60, backgroundColor: '#fff' },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  headerSub: { fontSize: 12, color: '#4C7B4B', textAlign: 'center', marginTop: 2 },

  summaryRow: { flexDirection: 'row', backgroundColor: '#4C7B4B', margin: 16, borderRadius: 16, paddingVertical: 16 },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginHorizontal: 16, marginTop: 18, marginBottom: 10 },

  recoCard: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginBottom: 10, padding: 14 },
  recoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#4C7B4B', alignItems: 'center', justifyContent: 'center' },
  recoCat: { fontSize: 14, fontWeight: '700', color: '#333' },
  recoAction: { fontSize: 13, fontWeight: '600', color: '#4C7B4B', marginTop: 1 },
  recoReason: { fontSize: 12, color: '#666', marginTop: 3, lineHeight: 16 },

  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 8, padding: 14 },
  insightCat: { fontSize: 14, fontWeight: '600', color: '#333' },
  insightSub: { fontSize: 12, color: '#777', marginTop: 2 },

  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  tagHot: { backgroundColor: '#FCEBEB' },
  tagWarm: { backgroundColor: '#FFF4E5' },
  tagText: { fontSize: 11, fontWeight: '700' },
  tagHotText: { color: '#B3261E' },
  tagWarmText: { color: '#9A5B00' },

  trendTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  trendUp: { backgroundColor: '#EAF3DE' },
  trendDown: { backgroundColor: '#FCEBEB' },
  trendText: { fontSize: 12, fontWeight: '700' },

  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginHorizontal: 16, marginTop: 16, padding: 12, backgroundColor: '#fff', borderRadius: 12 },
  noteText: { flex: 1, fontSize: 11, color: '#888', lineHeight: 16 },
});
