// Platform-specific Stripe hook
// On web, useStripe from stripe-react-native doesn't work
// This provides a mock implementation for web testing

import { Platform } from 'react-native';

// Mock implementation for web
const webStripeMock = {
    initPaymentSheet: async (_params: any) => {
        console.log('[Stripe Web Mock] initPaymentSheet called');
        return { error: undefined };
    },
    presentPaymentSheet: async () => {
        console.log('[Stripe Web Mock] presentPaymentSheet called');
        // Simulate successful payment for testing
        return { error: undefined };
    },
    confirmPayment: async (_clientSecret: string, _params?: any) => {
        console.log('[Stripe Web Mock] confirmPayment called');
        return { paymentIntent: { id: 'mock_pi_' + Date.now() }, error: undefined };
    },
    createToken: async (_params: any) => {
        console.log('[Stripe Web Mock] createToken called');
        return { token: { id: 'mock_tok_' + Date.now() }, error: undefined };
    },
    handleURLCallback: async (_url: string) => {
        return false;
    },
    retrievePaymentIntent: async (_clientSecret: string) => {
        return { paymentIntent: null, error: undefined };
    },
    retrieveSetupIntent: async (_clientSecret: string) => {
        return { setupIntent: null, error: undefined };
    },
};

// Export the hook - on native it will be the real one, on web it's mocked
export function useStripe() {
    if (Platform.OS === 'web') {
        return webStripeMock;
    }

    // Dynamic import to avoid web bundling issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useStripe: useNativeStripe } = require('@stripe/stripe-react-native');
    return useNativeStripe();
}

// Re-export StripeProvider for convenience
export function StripeProvider(props: any) {
    if (Platform.OS === 'web') {
        // On web, just render children without Stripe context
        return props.children;
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { StripeProvider: NativeStripeProvider } = require('@stripe/stripe-react-native');
    return <NativeStripeProvider {...props} />;
}
