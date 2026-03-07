import { create } from 'zustand';
import axios from 'axios';
import {
    Beneficiary,
    BeneficiaryCreate,
    BeneficiaryUpdate,
    Distribution,
    DistributionCreate,
    AssociationStats
} from '../types';
import { API_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AssociationState {
    // Data
    beneficiaries: Beneficiary[];
    distributions: Distribution[];
    stats: AssociationStats | null;

    // Loading states
    isLoadingBeneficiaries: boolean;
    isLoadingDistributions: boolean;
    isLoadingStats: boolean;

    // Error state
    error: string | null;

    // Actions - Beneficiaries
    fetchBeneficiaries: () => Promise<void>;
    addBeneficiary: (data: BeneficiaryCreate) => Promise<Beneficiary | null>;
    updateBeneficiary: (id: string, data: BeneficiaryUpdate) => Promise<boolean>;
    archiveBeneficiary: (id: string) => Promise<boolean>;

    // Actions - Distributions
    fetchDistributions: (limit?: number) => Promise<void>;
    recordDistribution: (data: DistributionCreate) => Promise<Distribution | null>;

    // Actions - Stats
    fetchStats: () => Promise<void>;

    // Utility
    clearError: () => void;
    reset: () => void;
}

const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useAssociationStore = create<AssociationState>((set, get) => ({
    // Initial state
    beneficiaries: [],
    distributions: [],
    stats: null,
    isLoadingBeneficiaries: false,
    isLoadingDistributions: false,
    isLoadingStats: false,
    error: null,

    // ============ BENEFICIARIES ============

    fetchBeneficiaries: async () => {
        set({ isLoadingBeneficiaries: true, error: null });
        try {
            const headers = await getAuthHeader();
            const response = await axios.get(`${API_URL}/association/beneficiaries`, { headers });
            set({ beneficiaries: response.data, isLoadingBeneficiaries: false });
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Erreur lors du chargement';
            set({ error: message, isLoadingBeneficiaries: false });
        }
    },

    addBeneficiary: async (data: BeneficiaryCreate) => {
        try {
            const headers = await getAuthHeader();
            const response = await axios.post(`${API_URL}/association/beneficiaries`, data, { headers });
            const newBeneficiary = response.data.beneficiary;

            // Add to local state
            set(state => ({
                beneficiaries: [...state.beneficiaries, newBeneficiary]
            }));

            return newBeneficiary;
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Erreur lors de la création';
            set({ error: message });
            return null;
        }
    },

    updateBeneficiary: async (id: string, data: BeneficiaryUpdate) => {
        try {
            const headers = await getAuthHeader();
            await axios.put(`${API_URL}/association/beneficiaries/${id}`, data, { headers });

            // Update local state
            set(state => ({
                beneficiaries: state.beneficiaries.map(b =>
                    b.id === id ? { ...b, ...data } : b
                )
            }));

            return true;
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Erreur lors de la mise à jour';
            set({ error: message });
            return false;
        }
    },

    archiveBeneficiary: async (id: string) => {
        try {
            const headers = await getAuthHeader();
            await axios.delete(`${API_URL}/association/beneficiaries/${id}`, { headers });

            // Update local state (mark as inactive)
            set(state => ({
                beneficiaries: state.beneficiaries.map(b =>
                    b.id === id ? { ...b, is_active: false } : b
                )
            }));

            return true;
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Erreur lors de l\'archivage';
            set({ error: message });
            return false;
        }
    },

    // ============ DISTRIBUTIONS ============

    fetchDistributions: async (limit = 50) => {
        set({ isLoadingDistributions: true, error: null });
        try {
            const headers = await getAuthHeader();
            const response = await axios.get(`${API_URL}/association/distributions?limit=${limit}`, { headers });
            set({ distributions: response.data, isLoadingDistributions: false });
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Erreur lors du chargement';
            set({ error: message, isLoadingDistributions: false });
        }
    },

    recordDistribution: async (data: DistributionCreate) => {
        try {
            const headers = await getAuthHeader();
            const response = await axios.post(`${API_URL}/association/distributions`, data, { headers });
            const newDistribution = response.data.distribution;

            // Add to local state at the beginning (most recent first)
            set(state => ({
                distributions: [newDistribution, ...state.distributions]
            }));

            // Update beneficiary's total_baskets locally if beneficiary was specified
            if (data.beneficiary_id) {
                set(state => ({
                    beneficiaries: state.beneficiaries.map(b =>
                        b.id === data.beneficiary_id
                            ? { ...b, total_baskets: b.total_baskets + data.quantity }
                            : b
                    )
                }));
            }

            return newDistribution;
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Erreur lors de l\'enregistrement';
            set({ error: message });
            return null;
        }
    },

    // ============ STATS ============

    fetchStats: async () => {
        set({ isLoadingStats: true, error: null });
        try {
            const headers = await getAuthHeader();
            const response = await axios.get(`${API_URL}/association/stats`, { headers });
            set({ stats: response.data, isLoadingStats: false });
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Erreur lors du chargement';
            set({ error: message, isLoadingStats: false });
        }
    },

    // ============ UTILITY ============

    clearError: () => set({ error: null }),

    reset: () => set({
        beneficiaries: [],
        distributions: [],
        stats: null,
        isLoadingBeneficiaries: false,
        isLoadingDistributions: false,
        isLoadingStats: false,
        error: null
    })
}));
