import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, Shadows } from '../../src/theme';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();
  // Tabs: food, antigaspi, [+], market, profile
  const visibleTabs = state.routes.filter((r: any) =>
    ['food', 'antigaspi', 'market', 'profile'].includes(r.name)
  );

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBar}>
        {/* Donner */}
        <TabItem
          icon="leaf"
          label="Donner"
          focused={state.routes[state.index]?.name === 'food'}
          onPress={() => navigation.navigate('food')}
        />

        {/* Sauver */}
        <TabItem
          icon="timer"
          label="Sauver"
          focused={state.routes[state.index]?.name === 'antigaspi'}
          onPress={() => navigation.navigate('antigaspi')}
          accent
        />

        {/* Bouton + central */}
        <View style={styles.fabWrapper}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/post')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Échanger */}
        <TabItem
          icon="swap-horizontal"
          label="Échanger"
          focused={state.routes[state.index]?.name === 'market'}
          onPress={() => navigation.navigate('market')}
        />

        {/* Moi */}
        <TabItem
          icon="person"
          label="Moi"
          focused={state.routes[state.index]?.name === 'profile'}
          onPress={() => navigation.navigate('profile')}
        />
      </View>
    </View>
  );
}

function TabItem({
  icon,
  label,
  focused,
  onPress,
  accent,
}: {
  icon: string;
  label: string;
  focused: boolean;
  onPress: () => void;
  accent?: boolean;
}) {
  const activeColor = accent ? colors.accent : colors.primary;
  const color = focused ? activeColor : colors.tabInactive;

  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons
        name={(focused ? icon : `${icon}-outline`) as any}
        size={22}
        color={color}
      />
      <View
        style={[
          styles.label,
          focused && { borderBottomWidth: 2, borderBottomColor: activeColor },
        ]}
      />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="food" />
      <Tabs.Screen name="antigaspi" />
      <Tabs.Screen name="market" />
      <Tabs.Screen name="profile" />

      {/* Hidden */}
      <Tabs.Screen name="stores" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="asso-dashboard" options={{ href: null }} />
      <Tabs.Screen name="asso-suspended" options={{ href: null }} />
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
    paddingVertical: 8,
  },
  label: {
    marginTop: 3,
    height: 2,
    width: 20,
    borderRadius: 2,
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
