import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

export default function TabLayout() {
  const { user } = useAuthStore();

  // Regular user tab bar (default)
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

      {/* Hidden tabs */}
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="asso-dashboard" options={{ href: null }} />
      <Tabs.Screen name="asso-suspended" options={{ href: null }} />
      <Tabs.Screen name="asso-beneficiaries" options={{ href: null }} />
    </Tabs>
  );
}
