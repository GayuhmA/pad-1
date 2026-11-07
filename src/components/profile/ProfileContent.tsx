'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useResidentProfile } from '@/hooks/use-resident-profile';
import { useAuthStore } from '@/stores/auth-store';

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <dt className="text-body-2 font-medium text-neutral-400 md:text-body-1">{label}</dt>
      <dd className="min-h-12.5 rounded-xl bg-neutral-100 px-4 py-2 text-body-1 font-bold wrap-break-word text-neutral-900 md:text-h7">{children}</dd>
    </div>
  );
}

export function ProfileContent() {
  const router = useRouter();
  const { profile } = useResidentProfile();
  const logout = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const submitLocked = useRef(false);

  async function handleLogout() {
    if (submitLocked.current) return;
    submitLocked.current = true;
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/login');
    } catch {
      // The boundary displays the store error; preserve the session for retry.
      submitLocked.current = false;
      setIsLoggingOut(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="bg-linear-to-b from-primary-100 to-white">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-12 px-5 py-12 md:gap-24 md:px-15 md:py-24">
        <section aria-label="Profil pengguna" className="relative mx-auto flex min-h-43 w-full max-w-240 flex-col gap-6 rounded-xl bg-white p-6 shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={profile.name} className="size-20 text-h6 shadow-sm sm:size-28 sm:text-h4" />
            <div className="min-w-0 space-y-1">
              <h1 className="text-h6 font-bold wrap-break-word text-primary-600 md:text-h4">{profile.name}</h1>
              <p className="text-body-2 text-neutral-500">@{profile.username}</p>
              <Badge color="secondary" className="min-w-24">{profile.role}</Badge>
            </div>
          </div>
          <Button size="S" disabled aria-describedby="profile-update-note" className="min-h-11 shrink-0 self-start font-bold shadow-sm">Edit Profil</Button>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
          <section aria-labelledby="personal-data-title" className="rounded-xl bg-white p-6">
            <h2 id="personal-data-title" className="mb-6 text-h5 font-bold text-primary-600 md:text-h4">Data Diri</h2>
            <dl className="space-y-5">
              <ProfileField label="Nama Lengkap">{profile.name}</ProfileField>
              <ProfileField label="Username">{profile.username}</ProfileField>
              <ProfileField label="Tempat Tanggal Lahir">Belum tersedia</ProfileField>
              <ProfileField label="Alamat Sesuai KTP">Belum tersedia</ProfileField>
              <ProfileField label="Nomor WhatsApp / Telepon">{profile.phone || 'Belum tersedia'}</ProfileField>
            </dl>
            <p id="profile-update-note" className="mt-5 text-body-3 text-neutral-500">Perubahan profil belum tersedia. Hubungi pengurus jika data Anda perlu diperbarui.</p>
          </section>

          <div className="flex flex-col gap-5">
            <section aria-labelledby="neighborhood-contacts-title" className="rounded-xl bg-white p-6">
              <h2 id="neighborhood-contacts-title" className="mb-5 text-center text-h7 font-bold text-primary-600">Kontak Ketua RT dan RW</h2>
              <p className="text-center text-body-2 text-neutral-500">Kontak pengurus belum tersedia.</p>
            </section>
            <Button size="L" disabled aria-describedby="password-update-note" className="h-15! w-full text-h6! font-bold shadow-sm">Kelola Sandi</Button>
            <p id="password-update-note" className="text-center text-body-3 text-neutral-500">Perubahan sandi belum tersedia.</p>
            <Button variant="ghost" size="L" onClick={handleLogout} disabled={isLoggingOut} className="w-full text-h6! font-bold">{isLoggingOut ? 'Keluar…' : 'Log Out'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
