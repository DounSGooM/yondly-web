import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, FlatList, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';

export interface DropdownCategory {
  name: string;
  icon: string; // Ionicons name
}

interface CategoryDropdownProps {
  categories: DropdownCategory[];
  selected: string;
  onSelect: (name: string) => void;
  accentColor?: string;
}

export default function CategoryDropdown({
  categories,
  selected,
  onSelect,
  accentColor = colors.primary,
}: CategoryDropdownProps) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedItem = categories.find(c => c.name === selected) ?? categories[0];
  const isFiltered = selected !== categories[0]?.name;

  const handleSelect = (name: string) => {
    onSelect(name);
    setVisible(false);
  };

  return (
    <View>
      {/* ── Trigger ── */}
      <TouchableOpacity
        style={[styles.trigger, isFiltered && { borderColor: accentColor + '60', backgroundColor: accentColor + '10' }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.75}
      >
        <Ionicons
          name={selectedItem.icon as any}
          size={14}
          color={isFiltered ? accentColor : colors.textSecondary}
        />
        <Text style={[styles.triggerText, isFiltered && { color: accentColor }]}>
          {selectedItem.name}
        </Text>
        <Ionicons name="chevron-down" size={13} color={isFiltered ? accentColor : colors.textTertiary} />
      </TouchableOpacity>

      {/* ── Bottom sheet modal ── */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          {/* Handle */}
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Catégorie</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories}
            keyExtractor={item => item.name}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const active = selected === item.name;
              return (
                <TouchableOpacity
                  style={[styles.option, active && { backgroundColor: accentColor + '12' }]}
                  onPress={() => handleSelect(item.name)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, active && { backgroundColor: accentColor + '20' }]}>
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={active ? accentColor : colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.optionLabel, active && { color: accentColor, fontWeight: Typography.semibold as any }]}>
                    {item.name}
                  </Text>
                  {active && <Ionicons name="checkmark" size={18} color={accentColor} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  triggerText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium as any,
    color: colors.textSecondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.sm,
    ...Shadows.elevated,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sheetTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold as any,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    marginHorizontal: Spacing.md,
    marginVertical: 2,
    borderRadius: BorderRadius.lg,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: Typography.base,
    color: colors.textSecondary,
    fontWeight: Typography.medium as any,
  },
});
