// Web-only Stripe implementation
// Provides mock implementations for web testing

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

// On web, return mock implementation
export function useStripe() {
    return webStripeMock;
}

// On web, just render children without Stripe context
export function StripeProvider(props: any) {
    return props.children;
}
