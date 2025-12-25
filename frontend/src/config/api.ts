/**
 * API Configuration
 */

// Use environment variable or fallback to localhost
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.190:8000/api';

console.log('🔌 API Configured URL:', API_URL);


// For production, this should be set to your production API URL
// Example: https://api.yondly.com/api
