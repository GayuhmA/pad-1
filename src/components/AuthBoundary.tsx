'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useAuthStore } from '@/stores/auth-store';
import { SessionStatus } from '@/components/SessionStatus';
import { PageSkeleton } from '@/components/skeletons/PageSkeleton';
import { getManagementRole } from '@/lib/management-role';

export function AuthBoundary({ children }: { children: ReactNode }) {
  const { isReady } = useRequireAuth();
  const { user, error, isChecking, fetchUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isManagementUser = isReady && !!getManagementRole(user?.role);

  useEffect(() => {
    if (isManagementUser) router.replace('/dashboard');
  }, [isManagementUser, pathname, router]);

  if (!isReady) return <SessionStatus />;
  if (isManagementUser) return <PageSkeleton variant="generic" />;
  return (
    <div key={user!.id} className="flex min-h-screen flex-col">
      {error && <div role="alert" className="bg-amber-50 p-3 text-center text-body-2 text-neutral-900">
        {error} <button type="button" disabled={isChecking} className="ml-2 underline" onClick={() => void fetchUser(true)}>{isChecking ? 'Memeriksa…' : 'Coba lagi'}</button>
      </div>}
      {children}
    </div>
  );
}
