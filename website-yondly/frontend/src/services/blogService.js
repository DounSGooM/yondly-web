import axios from 'axios';

// Backend Production URL (Google Cloud Run)
const API_URL = 'https://yondly-backend-951855414282.europe-west1.run.app/api/blog';

// La clé admin n'est JAMAIS codée en dur côté client.
// Elle est saisie sur /admin/login et stockée en localStorage,
// puis validée par le backend à chaque requête.
const adminHeaders = () => ({
    'x-admin-key': localStorage.getItem('YONDLY_ADMIN_KEY') || ''
});

export const blogService = {
    // ── Public ──────────────────────────────────────────────────────────────
    getAll: async () => {
        const response = await axios.get(API_URL);
        return response.data;
    },

    getBySlug: async (slug) => {
        const response = await axios.get(`${API_URL}/${slug}`);
        return response.data;
    },

    // ── Admin ────────────────────────────────────────────────────────────────
    getDrafts: async () => {
        const response = await axios.get(`${API_URL}/drafts`, {
            headers: adminHeaders()
        });
        return response.data;
    },

    create: async (data) => {
        const response = await axios.post(API_URL, data, {
            headers: adminHeaders()
        });
        return response.data;
    },

    update: async (id, data) => {
        const response = await axios.put(`${API_URL}/${id}`, data, {
            headers: adminHeaders()
        });
        return response.data;
    },

    publish: async (id) => {
        const response = await axios.put(`${API_URL}/${id}`, { published: true }, {
            headers: adminHeaders()
        });
        return response.data;
    },

    delete: async (id) => {
        await axios.delete(`${API_URL}/${id}`, {
            headers: adminHeaders()
        });
    }
};
