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
  register: (email: string, password: string, display_name: string, phone?: string, address?: AddressData | null, isAssociation?: boolean, associationName?: string) => Promise<{ requires_verification?: boolean; email?: string }>;
  socialLogin: (provider: string, id_token: string, display_name?: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
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
    // Skip if already authenticated (e.g. just logged in)
    if (get().isAuthenticated) {
      set({ isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        // Only update if not already authenticated by a concurrent login
        if (!get().isAuthenticated) {
          set({ user: response.data, token, isAuthenticated: true, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      // Only clear auth if not already authenticated by a concurrent login
      if (!get().isAuthenticated) {
        await AsyncStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user, access_token } = response.data;
      await AsyncStorage.setItem('auth_token', access_token);
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      if (error.response?.status === 403) {
        // Email not verified — throw special error with email for redirect
        const err = new Error(error.response?.data?.detail || 'Email non vérifié');
        (err as any).requiresVerification = true;
        (err as any).email = email;
        throw err;
      }
      throw new Error(error.response?.data?.detail || error.message || 'Login failed');
    }
  },

  socialLogin: async (provider: string, id_token: string, display_name?: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/social`, {
        provider,
        id_token,
        display_name,
      });
      const { user, access_token } = response.data;
      await AsyncStorage.setItem('auth_token', access_token);
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      console.error('SOCIAL LOGIN ERROR:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Social login failed');
    }
  },

  register: async (email, password, displayName, phone, address = null, isAssociation = false, associationName) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        display_name: displayName,
        phone,
        is_association: isAssociation,
        association_name: associationName,
        street: address?.street,
        city: address?.city,
        postcode: address?.postcode,
        citycode: address?.citycode,
        context: address?.context,
        location: address ? { lat: address.lat, lng: address.lng } : undefined,
      });
      const data = response.data;
      // If email verification is bypassed, store token and log in directly
      if (!data.requires_verification && data.access_token) {
        await AsyncStorage.setItem('auth_token', data.access_token);
        set({ user: data.user, token: data.access_token, isAuthenticated: true });
      }
      return data;
    } catch (error: any) {
      if (error.message === 'Network Error') {
        throw new Error('Connexion impossible au serveur.');
      }
      throw new Error(error.response?.data?.detail || `Registration failed: ${error.message}`);
    }
  },

  verifyEmail: async (email: string, code: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/verify-email`, { email, code });
      const { user, access_token } = response.data;
      await AsyncStorage.setItem('auth_token', access_token);
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Verification failed');
    }
  },

  resendCode: async (email: string) => {
    try {
      await axios.post(`${API_URL}/auth/resend-code`, { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to resend code');
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
