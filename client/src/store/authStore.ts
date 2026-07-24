import { create } from 'zustand';
import api from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  workspaceId: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', credentials);
      set({ user: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Login failed', loading: false });
      throw err;
    }
  },
  signup: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/signup', data);
      set({ user: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Signup failed', loading: false });
      throw err;
    }
  },
  logout: async () => {
    set({ loading: true });
    try {
      await api.post('/auth/logout');
      set({ user: null, loading: false });
    } catch (err) {
      set({ user: null, loading: false });
    }
  },
  checkAuth: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, loading: false });
    } catch (err) {
      set({ user: null, loading: false });
    }
  }
}));
