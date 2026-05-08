import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, Shadows, Typography, Spacing } from '../../src/theme';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();

  const TAB_CONFIG = [
    { name: 'accueil',      icon: 'home',           label: 'Accueil',      color: colors.primary },
    { name: 'alimentaire',  icon: 'leaf',            label: 'Alimentaire',  color: colors.primary },
    { name: 'reemploi',     icon: 'swap-horizontal', label: 'Réemploi',     color: colors.info },
    { name: 'profile',      icon: 'person',          label: 'Profil',       color: colors.primary },
  ];

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBar}>
        {TAB_CONFIG.slice(0, 2).map((tab) => {
          const focused = state.routes[state.index]?.name === tab.name;
          return (
            <TabItem
              key={tab.name}
              icon={tab.icon}
              label={tab.label}
              focused={focused}
              color={tab.color}
              onPress={() => navigation.navigate(tab.name)}
            />
          );
        })}

        {/* Central + FAB */}
        <View style={styles.fabWrapper}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/post')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {TAB_CONFIG.slice(2).map((tab) => {
          const focused = state.routes[state.index]?.name === tab.name;
          return (
            <TabItem
              key={tab.name}
              icon={tab.icon}
              label={tab.label}
              focused={focused}
              color={tab.color}
              onPress={() => navigation.navigate(tab.name)}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  icon,
  label,
  focused,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  focused: boolean;
  color: string;
  onPress: () => void;
}) {
  const activeColor = focused ? color : colors.tabInactive;

  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons
        name={(focused ? icon : `${icon}-outline`) as any}
        size={22}
        color={activeColor}
      />
      <Text style={[styles.tabLabel, { color: activeColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="accueil" />
      <Tabs.Screen name="alimentaire" />
      <Tabs.Screen name="reemploi" />
      <Tabs.Screen name="profile" />

      {/* Hidden — kept for backward compat */}
      <Tabs.Screen name="food"               options={{ href: null }} />
      <Tabs.Screen name="antigaspi"          options={{ href: null }} />
      <Tabs.Screen name="market"             options={{ href: null }} />
      <Tabs.Screen name="stores"             options={{ href: null }} />
      <Tabs.Screen name="messages"           options={{ href: null }} />
      <Tabs.Screen name="asso-dashboard"     options={{ href: null }} />
      <Tabs.Screen name="asso-suspended"     options={{ href: null }} />
      <Tabs.Screen name="asso-beneficiaries" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    ...Shadows.elevated,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: Typography.semibold as any,
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Shadows.fab,
  },
});
