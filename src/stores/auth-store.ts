import { create } from 'zustand';
import type { User } from '@/types/auth';
import * as authApi from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { publishSessionChange } from '@/lib/session-sync';

export type SessionStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'error' | 'logging-out';
interface AuthState {
  user: User | null;
  status: SessionStatus;
  isChecking: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: (force?: boolean) => Promise<void>;
  syncSession: () => Promise<void>;
  clearError: () => void;
}

const errorMessage = (error: unknown) => error instanceof ApiRequestError
  ? error.message : 'Layanan akun sedang bermasalah. Silakan coba lagi.';

/** Separate factory keeps request coordination scoped to each store, including tests. */
export function createAuthStore(api = authApi, notify = publishSessionChange) {
  let revision = 0;
  let sessionRequest: Promise<void> | null = null;
  let mutating = false;

  return create<AuthState>((set, get) => ({
    user: null,
    status: 'initializing',
    isChecking: false,
    error: null,

    fetchUser: (force = false) => {
      if (sessionRequest) return sessionRequest;
      if (mutating || (!force && get().status !== 'initializing')) return Promise.resolve();
      const requestRevision = revision;
      set({ isChecking: true, error: null });
      const request = (async () => {
        try {
          const { user } = await api.getMe();
          if (requestRevision !== revision) return;
          set({ user, status: 'authenticated', error: null });
        } catch (error) {
          if (requestRevision !== revision) return;
          if (error instanceof ApiRequestError && error.status === 401) {
            set({ user: null, status: 'unauthenticated', error: get().user ? error.message : null });
          } else {
            // Temporary outages do not destroy the session or trigger login loops.
            set({ status: get().user ? 'authenticated' : 'error', error: errorMessage(error) });
          }
        } finally {
          if (requestRevision === revision) {
            sessionRequest = null;
            set({ isChecking: false });
          }
        }
      })();
      sessionRequest = request;
      return request;
    },

    login: async (username, password) => {
      if (mutating) throw new Error('Account request already in progress');
      mutating = true;
      const requestRevision = ++revision;
      sessionRequest = null;
      set({ user: null, error: null, isChecking: false });
      try {
        await api.login({ username, password });
        if (requestRevision !== revision) return;
        // /me supplies the complete identity (including phone), and validates
        // the cookie before any authenticated UI is revealed.
        set({ status: 'initializing' });
      } catch (error) {
        if (requestRevision === revision) set({ user: null, status: 'unauthenticated', error: errorMessage(error) });
        throw error;
      } finally { mutating = false; }
      // Wait for the verified account before resolving login. Broadcasting the
      // session change before /me completes can make the same tab invalidate
      // this request and briefly expose an empty user to the redirect handler.
      await get().fetchUser(true);
      if (get().status === 'unauthenticated') {
        const message = 'Sesi tidak valid. Silakan masuk kembali.';
        set({ error: message });
        throw new ApiRequestError(message, 401);
      }
      if (get().status !== 'authenticated') {
        throw new ApiRequestError(get().error ?? 'Sesi belum dapat diverifikasi. Silakan coba lagi.', 503);
      }
      if (requestRevision === revision) notify();
    },

    logout: async () => {
      if (mutating) throw new Error('Account request already in progress');
      mutating = true;
      const previousStatus = get().status;
      const requestRevision = ++revision;
      sessionRequest = null;
      set({ status: 'logging-out', isChecking: false, error: null });
      try {
        await api.logout();
        if (requestRevision !== revision) return;
        set({ user: null, status: 'unauthenticated', error: null });
        notify();
      } catch (error) {
        if (requestRevision === revision) set({ status: previousStatus, error: errorMessage(error) });
        throw error;
      } finally { mutating = false; }
    },

    syncSession: async () => {
      if (mutating) return;
      ++revision;
      sessionRequest = null;
      set({ user: null, status: 'initializing', error: null, isChecking: false });
      await get().fetchUser(true);
    },
    clearError: () => set({ error: null }),
  }));
}

export const useAuthStore = createAuthStore();
