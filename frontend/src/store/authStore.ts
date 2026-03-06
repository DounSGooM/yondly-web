import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { User } from '../types';

import { API_URL } from '../config/api';

interface AddressData {
  street: string;
  postcode: string;
  city: string;
  citycode: string;
  context: string;
  lat: number;
  lng: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, display_name: string, phone?: string, address?: AddressData | null, isPartner?: boolean, services?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true, // Changed back to true to prevent race condition
  isAuthenticated: false,

  refreshUser: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: response.data });
    } catch (error) {
      console.error("Failed to refresh user", error);
    }
  },

  loadToken: async () => {
    set({ isLoading: true }); // Set loading when actually loading
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        // Verify token and get user
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        set({ user: response.data, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      await AsyncStorage.removeItem('auth_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user, access_token } = response.data;
      await AsyncStorage.setItem('auth_token', access_token);
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      console.error('LOGIN ERROR DETAILS:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      const detailedError = error.response?.data?.detail
        || error.message
        || JSON.stringify(error);
      throw new Error(`Debug: ${detailedError}`);
    }
  },

  register: async (email, password, displayName, phone, address = null, isPartner = false, services = []) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        display_name: displayName,
        phone,
        is_partner: isPartner,
        services,
        // Address fields for local community
        street: address?.street,
        city: address?.city,
        postcode: address?.postcode,
        citycode: address?.citycode,
        context: address?.context,
        location: address ? { lat: address.lat, lng: address.lng } : undefined,
      });
      const { user, access_token } = response.data;
      await AsyncStorage.setItem('auth_token', access_token);
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      console.error('REGISTRATION ERROR:', error);
      if (error.message === 'Network Error') {
        throw new Error('Connexion impossible au serveur. Vérifiez que le backend tourne et l\'adresse IP.');
      }
      throw new Error(error.response?.data?.detail || `Registration failed: ${error.message}`);
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateProfile: async (data: Partial<User>) => {
    try {
      const token = get().token;
      const response = await axios.put(`${API_URL}/auth/profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: response.data });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Profile update failed');
    }
  },
  deleteAccount: async () => {
    try {
      const token = get().token;
      await axios.delete(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await get().logout();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Account deletion failed');
    }
  },
}));
