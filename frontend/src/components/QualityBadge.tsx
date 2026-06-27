import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Badge de fiabilité anti-gaspi renvoyé par le backend
// (store.quality_badge ou deal.quality_badge).
export interface QualityBadgeData {
  tier: 'reliable' | 'good' | 'watch' | 'new' | 'suspended';
  label: string;
  color: string;
  icon: string;
  conformity_rate?: number | null;
  reviews_count?: number;
}

export default function QualityBadge({
  badge,
  size = 'md',
  style,
}: {
  badge?: QualityBadgeData | null;
  size?: 'sm' | 'md';
  style?: any;
}) {
  if (!badge) return null;

  const small = size === 'sm';
  const iconSize = small ? 12 : 15;
  const fontSize = small ? 11 : 13;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: badge.color + '18',
          paddingVertical: small ? 3 : 5,
          paddingHorizontal: small ? 7 : 10,
        },
        style,
      ]}
    >
      <Ionicons name={badge.icon as any} size={iconSize} color={badge.color} />
      <Text style={[styles.label, { color: badge.color, fontSize }]} numberOfLines={1}>
        {badge.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
});
