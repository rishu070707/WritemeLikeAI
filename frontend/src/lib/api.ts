import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

// Request interceptor — attach JWT from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('wlm_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('wlm_token');
      localStorage.removeItem('wlm_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

// Profiles API
export const profilesApi = {
  getAll: () => api.get('/profiles'),
  create: (name: string) => api.post('/profiles', { name }),
  uploadSamples: (profileId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post(`/profiles/${profileId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  train: (profileId: string) => api.post(`/profiles/${profileId}/train`),
  getStatus: (profileId: string) => api.get(`/profiles/${profileId}/status`),
  delete: (profileId: string) => api.delete(`/profiles/${profileId}`),
};

// Generation API
export const generateApi = {
  generate: (data: {
    text: string;
    profileId?: string;
    settings?: Record<string, unknown>;
    title?: string;
  }) => api.post('/generate', data),
  getHistory: (page = 1, limit = 12) =>
    api.get(`/generate/history?page=${page}&limit=${limit}`),
  getOne: (id: string) => api.get(`/generate/${id}`),
  delete: (id: string) => api.delete(`/generate/${id}`),
  toggleFavorite: (id: string) => api.patch(`/generate/${id}/favorite`),
};
