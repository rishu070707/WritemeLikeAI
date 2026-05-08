'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  generationsLeft: number;
  totalGenerations: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login({ email, password });
          const { token, user } = res.data;
          localStorage.setItem('wlm_token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.signup({ name, email, password });
          const { token, user } = res.data;
          localStorage.setItem('wlm_token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (e) {
          // Logout anyway
        }
        localStorage.removeItem('wlm_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const res = await authApi.getMe();
          set({ user: res.data.user, isAuthenticated: true });
        } catch (e) {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'wlm-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
