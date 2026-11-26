'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useAuthStore } from '@/stores/auth-store';
import { PageSkeleton, type ManagementSkeletonPage } from '@/components/skeletons/PageSkeleton';
import { SessionStatus } from '@/components/SessionStatus';

function getManagementSkeletonPage(pathname: string): ManagementSkeletonPage {
  if (pathname.startsWith('/dashboard/lomba')) return 'competitions';
  if (pathname.startsWith('/dashboard/pendaftaran')) return 'registrations';
  if (pathname.startsWith('/dashboard/iuran')) return 'dues';
  if (pathname.startsWith('/dashboard/warga')) return 'warga';
  if (pathname.startsWith('/dashboard/panitia')) return 'panitia';
  if (pathname.startsWith('/dashboard/pesan')) return 'messages';
  if (pathname.startsWith('/dashboard/dokumentasi')) return 'documentation';
  if (pathname.startsWith('/dashboard/histori')) return 'history';
  return 'dashboard';
}

function getRouteSkeleton(pathname: string) {
  if (pathname === '/') return <PageSkeleton variant="home" />;
  if (pathname.startsWith('/lomba')) return <PageSkeleton variant="lomba" />;
  if (pathname.startsWith('/pendaftaran')) return <PageSkeleton variant="pendaftaran" />;
  if (pathname.startsWith('/iuran')) return <PageSkeleton variant="iuran" />;
  if (pathname.startsWith('/histori')) return <PageSkeleton variant="histori" />;
  if (pathname.startsWith('/notifikasi')) return <PageSkeleton variant="notifikasi" />;
  if (pathname.startsWith('/profile')) return <PageSkeleton variant="profile" />;
  if (pathname.startsWith('/dashboard')) {
    return <PageSkeleton variant="management" managementPage={getManagementSkeletonPage(pathname)} />;
  }
  return <PageSkeleton variant="generic" />;
}

export function AuthBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === '/';
  const { isReady } = useRequireAuth(!isPublicRoute);
  const { user, error, isChecking, status, fetchUser } = useAuthStore();

  if (isPublicRoute) {
    return (
      <div key={user?.id ?? 'guest'} className="flex min-h-full grow flex-col">
        {user && error && (
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

