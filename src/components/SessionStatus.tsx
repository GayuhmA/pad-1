'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/Button';
import { PageSkeleton } from '@/components/skeletons/PageSkeleton';
import { useAuthStore } from '@/stores/auth-store';

export function SessionStatus() {
  const { status, error, isChecking, fetchUser, logout } = useAuthStore();
  const pathname = usePathname();
  if (status !== 'error') {
    const variant = pathname === '/' ? 'home'
      : pathname.startsWith('/lomba') ? 'lomba'
      : pathname.startsWith('/profile') ? 'profile'
      : 'generic';
    return <PageSkeleton variant={variant} includeShell />;
  }
  return (
    <div className="flex min-h-[60vh] grow items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-h6 font-bold text-primary-600">Akun belum dapat dimuat</h1>
        <p role="alert" className="text-body-2 text-neutral-600">{error}</p>
        <div className="flex justify-center gap-3">
          <Button disabled={isChecking} onClick={() => void fetchUser(true)}>{isChecking ? 'Memeriksa…' : 'Coba lagi'}</Button>
          <Button variant="ghost" disabled={isChecking} onClick={() => void logout().catch(() => undefined)}>Keluar</Button>
        </div>
      </div>
    </div>
  );
}
