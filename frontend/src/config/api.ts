/**
 * API Configuration
 * Surcharger via .env : EXPO_PUBLIC_API_URL (prod) ou EXPO_PUBLIC_DEV_API_URL (dev)
 */

const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://yondly-backend-951855414282.europe-west1.run.app/api';
const DEV_API_URL = process.env.EXPO_PUBLIC_DEV_API_URL || 'http://192.168.1.12:8000/api';

export const API_URL = __DEV__ ? DEV_API_URL : PRODUCTION_API_URL;

// Stripe Configuration
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51M2fZlJaOgMZUcVV9NVs3L4yqz5QQeFsz6ySwl5MEkMeCnXxKnIS78Kk7QKCr6qPwGlj7vP85dvnZwz5Pf12tSM000bRfoA4ol';
