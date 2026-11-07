'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { createSessionChannel, SESSION_EVENT_KEY } from '@/lib/session-sync';
import { useAppStore } from '@/stores/app-store';
import { useProfileStore } from '@/stores/profile-store';

export function SessionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Legacy localStorage tokens are intentionally not trusted or migrated.
    try { localStorage.removeItem('auth_token'); } catch { /* Storage can be disabled. */ }
    void useAuthStore.getState().fetchUser();
    const revalidate = () => {
      const state = useAuthStore.getState();
      if (document.visibilityState === 'visible' && state.status !== 'unauthenticated') void state.fetchUser(true);
    };
    const sync = () => { void useAuthStore.getState().syncSession(); };
    const onStorage = (event: StorageEvent) => { if (event.key === SESSION_EVENT_KEY) sync(); };
    const channel = createSessionChannel();
    if (channel) channel.onmessage = (event) => { if (event.data === 'changed') sync(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', revalidate);
    window.addEventListener('pageshow', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    const timer = window.setInterval(revalidate, 60_000);
    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      if (state.user?.id !== previous.user?.id) {
        useProfileStore.getState().clearDrafts();
        useAppStore.getState().closeMobileMenu();
      }
    });
    return () => {
      channel?.close();
      unsubscribe();
      window.clearInterval(timer);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', revalidate);
      window.removeEventListener('pageshow', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
    };
  }, []);
  return children;
}
