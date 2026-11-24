'use client';

import Link from 'next/link';
import { CompetitionManagement } from '@/components/management/CompetitionManagement';
import { DuesManagement } from '@/components/management/DuesManagement';
import { DocumentationManagement } from '@/components/management/DocumentationManagement';
import { HistoryManagement } from '@/components/management/HistoryManagement';
import { ManagementDashboard } from '@/components/management/ManagementDashboard';
import { MessageManagement } from '@/components/management/MessageManagement';
import { RegistrationManagement } from '@/components/management/RegistrationManagement';
import { SessionStatus } from '@/components/SessionStatus';
import { PageSkeleton } from '@/components/skeletons/PageSkeleton';
import { useRequireManagementAuth } from '@/hooks/use-require-management-auth';
import { getManagementRole, type ManagementRole } from '@/lib/management-role';
import { useAuthStore } from '@/stores/auth-store';

function NoManagementAccess({ role }: { role: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FCF4F3] p-5">
      <section className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-6"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="M9 12h6" /></svg>
        </span>
        <h1 className="mt-5 text-xl font-semibold text-neutral-900">Halaman ini tidak tersedia</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-500">Akun dengan role <span className="font-semibold text-neutral-700">{role || 'tidak diketahui'}</span> belum memiliki akses ke ruang admin atau panitia.</p>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-700">Kembali ke website</Link>
      </section>
    </main>
  );
}

export function ManagementRoute({ page }: { page: 'dashboard' | 'competitions' | 'registrations' | 'dues' | 'messages' | 'documentation' | 'history' }) {
  const { isReady } = useRequireManagementAuth();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  if (status === 'error' && !user) return <SessionStatus />;
  if (!isReady || !user) return <PageSkeleton variant="management" />;
  const role: ManagementRole | null = getManagementRole(user.role);
  if (!role) return <NoManagementAccess role={user.role} />;

  if (page === 'dashboard') return <ManagementDashboard role={role} userName={user.nama} />;
  if (page === 'competitions') return <CompetitionManagement role={role} userName={user.nama} />;
  if (page === 'dues') return <DuesManagement role={role} userName={user.nama} />;
  if (page === 'messages') return <MessageManagement role={role} userName={user.nama} />;
  if (page === 'documentation') return <DocumentationManagement role={role} userName={user.nama} />;
  if (page === 'history') return <HistoryManagement role={role} userName={user.nama} />;
  return <RegistrationManagement role={role} userName={user.nama} />;
}
