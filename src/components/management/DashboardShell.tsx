'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ManagementLayout, ManagementShellContext } from '@/components/management/ManagementDashboard';
import { NoManagementAccess } from '@/components/management/ManagementRoute';
import { SessionStatus } from '@/components/SessionStatus';
import { PageSkeleton, type ManagementSkeletonPage } from '@/components/skeletons/PageSkeleton';
import { useRequireManagementAuth } from '@/hooks/use-require-management-auth';
import { getManagementRole, type ManagementRole } from '@/lib/management-role';
import { useAuthStore } from '@/stores/auth-store';

interface RouteMeta {
  title: string;
  activeItem:
    | 'dashboard'
    | 'competitions'
    | 'registrations'
    | 'dues'
    | 'warga'
    | 'panitia'
    | 'messages'
    | 'documentation'
    | 'history';
  skeletonPage: ManagementSkeletonPage;
  adminOnly?: boolean;
}

function getRouteMeta(pathname: string): RouteMeta {
  if (pathname.startsWith('/dashboard/lomba')) {
    return { title: 'Kelola Lomba', activeItem: 'competitions', skeletonPage: 'competitions' };
  }
  if (pathname.startsWith('/dashboard/pendaftaran')) {
    return { title: 'Kelola Pendaftaran', activeItem: 'registrations', skeletonPage: 'registrations' };
  }
  if (pathname.startsWith('/dashboard/iuran')) {
    return { title: 'Kelola Iuran', activeItem: 'dues', skeletonPage: 'dues' };
  }
  if (pathname.startsWith('/dashboard/warga')) {
    return { title: 'Kelola Warga', activeItem: 'warga', skeletonPage: 'warga', adminOnly: true };
  }
  if (pathname.startsWith('/dashboard/panitia')) {
    return { title: 'Kelola Panitia', activeItem: 'panitia', skeletonPage: 'panitia', adminOnly: true };
  }
  if (pathname.startsWith('/dashboard/pesan')) {
    return { title: 'Pesan', activeItem: 'messages', skeletonPage: 'messages' };
  }
  if (pathname.startsWith('/dashboard/dokumentasi')) {
    return { title: 'Dokumentasi', activeItem: 'documentation', skeletonPage: 'documentation' };
  }
  if (pathname.startsWith('/dashboard/histori')) {
    return { title: 'Histori', activeItem: 'history', skeletonPage: 'history' };
  }
  return { title: 'Dashboard', activeItem: 'dashboard', skeletonPage: 'dashboard' };
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isReady } = useRequireManagementAuth();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const meta = getRouteMeta(pathname);

  if (status === 'error' && !user) return <SessionStatus />;
  if (!isReady || !user) {
    return <PageSkeleton variant="management" managementPage={meta.skeletonPage} />;
  }

  const role: ManagementRole | null = getManagementRole(user.role);
  if (!role || (meta.adminOnly && role !== 'admin')) {
    return <NoManagementAccess role={user.role} />;
  }

  return (
    <ManagementLayout role={role} userName={user.nama} title={meta.title} activeItem={meta.activeItem}>
      <ManagementShellContext.Provider value={true}>
        {children}
      </ManagementShellContext.Provider>
    </ManagementLayout>
  );
}

