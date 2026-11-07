'use client';

import { useAuthStore } from '@/stores/auth-store';
import { getResidentProfile } from '@/lib/profile';

export function useResidentProfile() {
  const user = useAuthStore((state) => state.user);
  return { profile: getResidentProfile(user) };
}
