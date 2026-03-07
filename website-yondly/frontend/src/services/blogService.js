import axios from 'axios';

// Backend Production URL (Google Cloud Run)
const API_URL = 'https://yondly-backend-951855414282.europe-west1.run.app/api/blog';
const ADMIN_KEY = 'SECRET_KEY_YONDLY_ADMIN_2025';

export const blogService = {
    // Public
    getAll: async () => {
        const response = await axios.get(API_URL);
        return response.data;
    },

    getBySlug: async (slug) => {
        const response = await axios.get(`${API_URL}/${slug}`);
        return response.data;
    },

    // Admin
    create: async (data) => {
        const response = await axios.post(API_URL, data, {
            headers: { 'x-admin-key': ADMIN_KEY }
        });
        return response.data;
    },

    update: async (id, data) => {
        const response = await axios.put(`${API_URL}/${id}`, data, {
            headers: { 'x-admin-key': ADMIN_KEY }
        });
        return response.data;
    },

    delete: async (id) => {
        await axios.delete(`${API_URL}/${id}`, {
            headers: { 'x-admin-key': ADMIN_KEY }
        });
    }
};
