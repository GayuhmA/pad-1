'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export function useRequireAuth() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);
  return { isReady: !!user && (status === 'authenticated' || status === 'logging-out') };
}
