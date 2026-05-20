import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

interface FoodMapCTAProps {
  count?: number;
  category?: string;
  title?: string;
  subtitle?: string;
}

export default function FoodMapCTA({
  count,
  category = 'alimentaire',
  title,
  subtitle,
}: FoodMapCTAProps) {
  const router = useRouter();

  const defaultTitle = category === 'reemploi'
    ? 'Explorer les ressources de réemploi locales'
    : 'Voir la carte alimentaire';

  const defaultSubtitle = category === 'reemploi'
    ? 'Ressourceries, réparation, seconde main et dons près de chez vous.'
    : count != null
      ? `${count} points sur le territoire`
      : 'Producteurs, marchés, dons…';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/carte?initialCategory=${category}` as any)}
      activeOpacity={0.88}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="map" size={22} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title ?? defaultTitle}</Text>
        <Text style={styles.sub}>{subtitle ?? defaultSubtitle}</Text>
      </View>
      <View style={styles.arrow}>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    ...Shadows.card,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold as any,
    color: colors.primary,
  },
  sub: {
    fontSize: Typography.xs,
    color: colors.primary,
    opacity: 0.75,
    marginTop: 2,
  },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
