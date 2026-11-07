'use client';

import { type ReactNode } from 'react';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useAuthStore } from '@/stores/auth-store';
import { SessionStatus } from '@/components/SessionStatus';

export function AuthBoundary({ children }: { children: ReactNode }) {
  const { isReady } = useRequireAuth();
  const { user, error, isChecking, fetchUser } = useAuthStore();
  if (!isReady) return <SessionStatus />;
  return (
    <div key={user!.id} className="flex min-h-screen flex-col">
      {error && <div role="alert" className="bg-amber-50 p-3 text-center text-body-2 text-neutral-900">
        {error} <button type="button" disabled={isChecking} className="ml-2 underline" onClick={() => void fetchUser(true)}>{isChecking ? 'Memeriksa…' : 'Coba lagi'}</button>
      </div>}
      {children}
    </div>
  );
}
