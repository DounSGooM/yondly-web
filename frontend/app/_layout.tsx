import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Nunito_800ExtraBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { VarelaRound_400Regular } from '@expo-google-fonts/varela-round';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useAuthStore } from '../src/store/authStore';
import { useGeoRestriction } from '../src/hooks/useGeoRestriction';
import GeoBlockedScreen from '../src/components/GeoBlockedScreen';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_xxx';
const GEO_RESTRICTION_ENABLED = true;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
    Nunito_700Bold,
    VarelaRound_400Regular,
  });

  const {
    isChecking,
    isAllowed,
    nearestZone,
    error,
    checkLocation
  } = useGeoRestriction();

  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Load auth token asynchronously without blocking
    const loadAuth = async () => {
      try {
        await useAuthStore.getState().loadToken();
      } catch (error) {
        console.log('Auth load error (non-blocking):', error);
      }
    };

    // Don't await - let it run in background
    loadAuth();
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    await checkLocation();
    setIsRetrying(false);
  };

  // Show loading while checking fonts and geo
  if (!fontsLoaded || (GEO_RESTRICTION_ENABLED && isChecking)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C7B4B" />
      </View>
    );
  }

  // Show blocked screen if geo-restriction is enabled and user is not in allowed zone
  if (GEO_RESTRICTION_ENABLED && isAllowed === false) {
    return (
      <GeoBlockedScreen
        nearestZone={nearestZone}
        onRetry={handleRetry}
        isRetrying={isRetrying}
        error={error}
      />
    );
  }

  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.loop.app"
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(pro)" />
          <Stack.Screen name="index" />
          <Stack.Screen name="post" />
          <Stack.Screen name="item" />
          <Stack.Screen name="order" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="item-detail" />
          <Stack.Screen name="order-detail" />
          <Stack.Screen name="chat-detail" />
          <Stack.Screen name="checkout" />
          {/* Profile sub-routes are auto-discovered or managed via (tabs)/profile */}
        </Stack>
      </GestureHandlerRootView>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
