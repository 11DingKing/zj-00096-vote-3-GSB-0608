import { create } from 'zustand';
import { User, Role } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.login(username, password);
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      set({ user, token: access_token, isAuthenticated: true, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || '登录失败', loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    const { token } = get();
    if (!token) return;
    
    try {
      const response = await authApi.getProfile();
      set({ user: response.data, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  hasRole: (...roles: Role[]) => {
    const { user } = get();
    if (!user) return false;
    return roles.includes(user.role);
  },
}));
