import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,

  fetchMe: async () => {
    set({ loading: true, error: null });
    try {
      const user = await apiFetch('/api/auth/me');
      set({ user, loading: false });
    } catch (err) {
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      set({ user: data.user, loading: false });
      return data.user;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      // Auto login after registration
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      set({ user: data.user, loading: false });
      return data.user;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignored
    }
    set({ user: null, loading: false });
  },
}));
