import { create } from 'zustand';
import * as authApi from '../services/auth';

interface User {
  id: number;
  email: string;
  role: string;
  name?: string;
  permissions?: Record<string, boolean>;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restore: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.token) {
        global.__AUTH_TOKEN__ = res.token;
        set({
          token: res.token,
          user: res.user || null,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      set({ isLoading: false, error: 'Login failed' });
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ isLoading: false, error: msg });
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout
    }
    global.__AUTH_TOKEN__ = null;
    set({ token: null, user: null, isAuthenticated: false });
  },

  restore: async () => {
    if (!global.__AUTH_TOKEN__) {
      return false;
    }
    set({ isLoading: true });
    try {
      const res = await authApi.getMe();
      if (res.success && res.user) {
        set({
          user: res.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
    } catch {
      // token invalid
    }
    global.__AUTH_TOKEN__ = null;
    set({ isLoading: false, isAuthenticated: false });
    return false;
  },
}));

declare global {
  var __AUTH_TOKEN__: string | null;
  var __TENANT_ID__: string | null;
}

if (!global.__AUTH_TOKEN__) global.__AUTH_TOKEN__ = null;
if (!global.__TENANT_ID__) global.__TENANT_ID__ = null;
