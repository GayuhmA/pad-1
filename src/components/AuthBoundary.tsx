'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useAuthStore } from '@/stores/auth-store';
import { PageSkeleton } from '@/components/skeletons/PageSkeleton';
import { SessionStatus } from '@/components/SessionStatus';

function getRouteSkeleton(pathname: string) {
  if (pathname === '/') return <PageSkeleton variant="home" />;
  if (pathname.startsWith('/lomba')) return <PageSkeleton variant="lomba" />;
  if (pathname.startsWith('/pendaftaran')) return <PageSkeleton variant="pendaftaran" />;
  if (pathname.startsWith('/iuran')) return <PageSkeleton variant="iuran" />;
  if (pathname.startsWith('/profile')) return <PageSkeleton variant="profile" />;
  if (pathname.startsWith('/dashboard')) return <PageSkeleton variant="management" />;
  return <PageSkeleton variant="generic" />;
}

export function AuthBoundary({ children }: { children: ReactNode }) {
  const { isReady } = useRequireAuth();
  const { user, error, isChecking, status, fetchUser } = useAuthStore();
  const pathname = usePathname();

  if (status === 'error' && !user) {
    return <SessionStatus />;
  }

  if (!isReady || !user) {
    return getRouteSkeleton(pathname);
  }

  return (
    <div key={user.id} className="flex min-h-full grow flex-col">
      {error && (
        <div role="alert" className="bg-amber-50 p-3 text-center text-body-2 text-neutral-900">
          {error}{' '}
          <button
            type="button"
            disabled={isChecking}
            className="ml-2 underline"
            onClick={() => void fetchUser(true)}
          >
            {isChecking ? 'Memeriksa…' : 'Coba lagi'}
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

