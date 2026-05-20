import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { YondlyMobileStop } from '../types/map';
import { MOCK_YONDLY_MOBILE_STOPS } from '../data/mockMapPoints';

function StopCard({ stop, onDeposit }: { stop: YondlyMobileStop; onDeposit: (stop: YondlyMobileStop) => void }) {
  return (
    <View style={[styles.stopCard, stop.nextStop && styles.stopCardNext]}>
      {stop.nextStop && (
        <View style={styles.nextBadge}>
          <Text style={styles.nextBadgeText}>Prochain passage</Text>
        </View>
      )}
      <View style={styles.stopHeader}>
        <View style={styles.stopIconWrap}>
          <Ionicons name="bus" size={20} color={colors.primary} />
        </View>
        <View style={styles.stopHeaderText}>
          <Text style={styles.stopCity}>{stop.city}</Text>
          <Text style={styles.stopDate}>{stop.date} · {stop.schedule}</Text>
        </View>
      </View>

      <View style={styles.stopDetail}>
        <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
        <Text style={styles.stopDetailText}>{stop.location}</Text>
      </View>

      <View style={styles.stopDetail}>
        <Ionicons name="cube-outline" size={13} color={colors.textTertiary} />
        <Text style={styles.stopDetailText}>{stop.acceptedItems}</Text>
      </View>

      {stop.nextStop && (
        <TouchableOpacity
          style={styles.depositBtn}
          onPress={() => onDeposit(stop)}
          activeOpacity={0.85}
        >
          <Ionicons name="bag-add-outline" size={16} color="#fff" />
          <Text style={styles.depositBtnText}>Je prépare un dépôt</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function YondlyMobileCard() {
  const stops = MOCK_YONDLY_MOBILE_STOPS;

  const handleDeposit = (stop: YondlyMobileStop) => {
    Alert.alert(
      'Préparer un dépôt',
      `Vous souhaitez déposer des dons à ${stop.city} le ${stop.date}.\n\nNous vous enverrons un rappel la veille.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => Alert.alert('', 'Dépôt enregistré ! Rendez-vous à ' + stop.location) },
      ]
    );
  };

  const handleSuggestStop = () => {
    Alert.alert(
      'Proposer un arrêt',
      'Vous pouvez proposer votre commune pour un prochain passage Yondly Mobile.',
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Proposer', onPress: () => Alert.alert('', 'Votre demande a été transmise. Merci !') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Ionicons name="bus" size={28} color={colors.primary} />
        </View>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Yondly Mobile</Text>
          <Text style={styles.bannerSub}>Collecte itinérante de dons</Text>
        </View>
      </View>

      {/* Stops list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.stopsList}
      >
        {stops.map(stop => (
          <StopCard key={stop.id} stop={stop} onDeposit={handleDeposit} />
        ))}

        {/* Suggest stop CTA */}
        <TouchableOpacity style={styles.suggestCard} onPress={handleSuggestStop} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          <View style={styles.suggestText}>
            <Text style={styles.suggestTitle}>Proposer un arrêt dans ma commune</Text>
            <Text style={styles.suggestSub}>On essaie de couvrir tout le territoire PAT</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold as any,
    color: colors.primary,
  },
  bannerSub: {
    fontSize: Typography.sm,
    color: colors.primary,
    opacity: 0.8,
    marginTop: 2,
  },
  stopsList: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 100,
  },
  stopCard: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  stopCardNext: {
    borderWidth: 1.5,
    borderColor: colors.primary + '40',
    backgroundColor: colors.primaryLight,
  },
  nextBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  nextBadgeText: {
    color: '#fff',
    fontSize: Typography.xs,
    fontWeight: Typography.semibold as any,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stopIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stopHeaderText: {
    flex: 1,
  },
  stopCity: {
    fontSize: Typography.base,
    fontWeight: Typography.bold as any,
    color: colors.textPrimary,
  },
  stopDate: {
    fontSize: Typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stopDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  stopDetailText: {
    flex: 1,
    fontSize: Typography.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  depositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  depositBtnText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
  },
  suggestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  suggestText: {
    flex: 1,
  },
  suggestTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
    color: colors.textPrimary,
  },
  suggestSub: {
    fontSize: Typography.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
