import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useMessageNotifications } from '../../src/hooks/useMessageNotifications';

function TabBarBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { unreadCount } = useMessageNotifications();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4C7B4B',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="food"
        options={{
          title: 'Dons',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "nutrition" : "nutrition-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="market"
        options={{
          title: 'Vente',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "pricetag" : "pricetag-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="stores"
        options={{
          title: 'Location',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="antigaspi"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            Alert.alert(
              "Bientôt disponible !",
              "Nous préparons cette fonctionnalité pour vous permettre de sauver encore plus de produits.",
              [{ text: "J'ai hâte !" }]
            );
          },
        }}
        options={{
          title: 'Anti-gaspi',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "time" : "time-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* Keep messages screen but hide from tabs */}
      <Tabs.Screen
        name="messages"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
