import { create } from 'zustand';

import type { User } from '@/types/auth';
import * as authApi from '@/lib/api/auth';
import {
  ApiRequestError,
  setStoredToken,
  removeStoredToken,
  getStoredToken,
} from '@/lib/api/client';


interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}


export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getStoredToken(),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login({ username, password });
      setStoredToken(data.token);
      set({ token: data.token, user: data.user, isLoading: false });
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : 'Terjadi kesalahan, coba lagi nanti.';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      removeStoredToken();
      set({ user: null, token: null });
    }
  },

  fetchUser: async () => {
    const { token, user: existingUser } = get();
    if (!token || existingUser) return;

    set({ isLoading: true });
    try {
      const data = await authApi.getMe();
      const user = data.user ?? (data as unknown as Record<string, unknown>).data ?? data;
      set({ user: user as User, isLoading: false });
    } catch {
      removeStoredToken();
      set({ user: null, token: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
