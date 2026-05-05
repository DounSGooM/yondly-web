import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import NotificationBell from './NotificationBell';

interface MarketHeaderProps {
  title?: string;
  subtitle?: string;
  location?: string;
  onLocationPress?: () => void;
  onMessagePress?: () => void;
  onViewToggle?: () => void;
  viewModeIcon?: string;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  onFilterPress?: () => void;
  activeFilters?: boolean;
  accentColor?: string;
}

export default function MarketHeader({
  title,
  subtitle,
  location = 'Grand Poitiers',
  onLocationPress,
  onMessagePress,
  onViewToggle,
  viewModeIcon = 'grid-outline',
  searchQuery = '',
  onSearchChange,
  onFilterPress,
  activeFilters = false,
  accentColor,
}: MarketHeaderProps) {
  const accent = accentColor || colors.primary;

  return (
    <View style={styles.container}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.leftBlock}>
          {title && (
            <Text style={[styles.title, { color: accent }]}>{title}</Text>
          )}
          <TouchableOpacity style={styles.locationPill} onPress={onLocationPress}>
            <Ionicons name="location-sharp" size={13} color={accent} />
            <Text style={[styles.locationText, { color: accent }]} numberOfLines={1}>
              {location}
            </Text>
            <Ionicons name="chevron-down" size={13} color={accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.rightActions}>
          {onViewToggle && (
            <TouchableOpacity style={styles.iconBtn} onPress={onViewToggle}>
              <Ionicons name={viewModeIcon as any} size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <NotificationBell size={22} color={colors.textSecondary} />
          {onMessagePress && (
            <TouchableOpacity style={styles.iconBtn} onPress={onMessagePress}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={subtitle || 'Rechercher…'}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>
        {onFilterPress && (
          <TouchableOpacity
            style={[styles.filterBtn, activeFilters && { backgroundColor: accent }]}
            onPress={onFilterPress}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFilters ? '#fff' : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  leftBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.heavy,
    letterSpacing: -0.5,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  locationText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: colors.surfaceAlt,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: colors.textPrimary,
  },
  filterBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
  },
});
