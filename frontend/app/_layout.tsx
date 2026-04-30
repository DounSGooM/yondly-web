import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '../src/utils/stripe';
import { STRIPE_PUBLISHABLE_KEY } from '../src/config/api';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const { loadToken } = useAuthStore();

  useEffect(() => {
    loadToken();
  }, []);

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(pro)" />
        </Stack>
      </GestureHandlerRootView>
    </StripeProvider>
  );
}
