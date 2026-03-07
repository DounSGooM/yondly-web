/**
 * API Configuration
 */

// Production URL (Cloud Run)
const PRODUCTION_API_URL = 'https://yondly-backend-951855414282.europe-west1.run.app/api';

// Development URL (local)
const DEV_API_URL = 'http://192.168.1.12:8000/api';

// TESTING MODE: Force Cloud URL
// To switch back to local, change true to false below
const FORCE_CLOUD = false;

export const API_URL = FORCE_CLOUD ? PRODUCTION_API_URL :
    (process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? DEV_API_URL : PRODUCTION_API_URL));

console.log('🔌 API Configured URL:', API_URL);
console.log('📱 Environment:', __DEV__ ? 'Development' : 'Production');
console.log('☁️ Using Cloud:', FORCE_CLOUD ? 'YES' : 'AUTO');
