import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from './config/api';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Clé de stockage du token — DOIT être identique partout (le store écrit
// 'auth_token'). Utiliser une autre clé (ex. 'token') envoie "Bearer null".
const TOKEN_KEY = 'auth_token';

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré/invalide : on déconnecte proprement via le store pour
      // resynchroniser l'état applicatif (et pas seulement le storage).
      try {
        const { useAuthStore } = require('./store/authStore');
        await useAuthStore.getState().logout();
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
