'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export function useRequireAuth(): { isReady: boolean } {
  const router = useRouter();
  const { user, token, isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    if (!user && !isLoading) {
      fetchUser();
    }
  }, [token, user, isLoading, fetchUser, router]);

  return { isReady: !!token && !!user && !isLoading };
}
