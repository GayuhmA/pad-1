'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/Avatar';
import { Icon, ManagementLayout } from '@/components/management/ManagementDashboard';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { ManagePasswordForm } from '@/components/profile/ManagePasswordForm';
import { ProfileDialog } from '@/components/profile/ProfileDialog';
import { formatBirthDetails, getResidentProfile } from '@/lib/profile';
import { useAuthStore } from '@/stores/auth-store';

interface ManagementProfileProps {
  role: 'admin' | 'panitia';
  userName: string;
}

function ProfileDetailRow({ label, value }: { label: string; value: string }) {
  const isEmpty = !value || value === 'Belum diisi';
  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 px-4 py-3">
      <dt className="text-xs font-medium text-neutral-500">{label}</dt>
      <dd className={`mt-1 text-sm font-semibold wrap-break-word ${isEmpty ? 'text-neutral-400' : 'text-neutral-900'}`}>
        {value || 'Belum diisi'}
      </dd>
    </div>
  );
}

export function ManagementProfile({ role, userName }: ManagementProfileProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const profile = getResidentProfile(user);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showManagePassword, setShowManagePassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutLock = useRef(false);

  const isAdmin = role === 'admin';
  const roleLabel = isAdmin ? 'Administrator' : 'Panitia';
  const roleDescription = isAdmin
    ? 'Akses penuh: kelola warga, akun panitia, logo website, dan seluruh operasional acara.'
    : 'Akses operasional: kelola lomba, pendaftaran, iuran, pesan warga, dokumentasi, dan histori.';

  async function handleLogout() {
    if (logoutLock.current) return;
    logoutLock.current = true;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      router.replace('/login');
    } catch {
      setLogoutError(useAuthStore.getState().error || 'Gagal keluar. Silakan coba lagi.');
      logoutLock.current = false;
      setIsLoggingOut(false);
    }
  }

  if (!profile) return null;

  return (
    <ManagementLayout role={role} userName={userName} title="Profil & Akun" activeItem={null}>
      <section className="mb-7 sm:mb-8">
        <p className="mb-1 text-sm font-medium text-primary-600">Ruang {roleLabel}</p>
        <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">
          Profil &amp; Akun
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Kelola identitas akun dan keamanan kredensial Anda di ruang kerja {roleLabel.toLowerCase()}.
        </p>
      </section>

      {notice && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-success-100 bg-success-10 px-4 py-3 text-sm font-medium text-success-200"
        >
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Tutup pemberitahuan"
            onClick={() => setNotice(null)}
            className="rounded p-1 text-success-200/70 hover:text-success-200"
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>
      )}

      {logoutError && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-error-100/25 bg-error-10 px-4 py-3 text-sm font-medium text-error-100"
        >
          {logoutError}
        </div>
      )}

      {/* Identity Summary Card */}
      <section className="mb-6 flex flex-col justify-between gap-5 rounded-2xl border border-primary-100 bg-white p-5 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:flex-row sm:items-center sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={profile.name} className="size-16 shrink-0 text-xl sm:size-20 sm:text-2xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold text-neutral-900 sm:text-2xl">
                {profile.name}
              </h2>
              <span
                className={`inline-flex rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                  isAdmin ? 'bg-[#FFE0DD] text-primary-700' : 'bg-secondary-100 text-secondary-700'
                }`}
              >
                {roleLabel}
              </span>
              <span
                className={`inline-flex rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                  user?.is_active !== false
                    ? 'bg-[#C8F0E3] text-[#16866A]'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {user?.is_active !== false ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-neutral-500">@{profile.username}</p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">{roleDescription}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setShowEditProfile(true);
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Icon name="edit" className="size-4" />
            Edit Profil
          </button>
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-error-100 transition-colors hover:bg-error-10 disabled:opacity-50"
          >
            <Icon name="logout" className="size-4" />
            {isLoggingOut ? 'Keluar…' : 'Keluar'}
          </button>
        </div>
      </section>

      {/* Main Grid: Personal Data & Account Security */}
      <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section
          aria-labelledby="management-profile-info"
          className="rounded-2xl border border-primary-100 bg-white p-5 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 id="management-profile-info" className="text-lg font-semibold text-neutral-900">
                Informasi Pribadi
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                Data identitas akun yang terhubung dengan sistem.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNotice(null);
                setShowEditProfile(true);
              }}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Ubah Data
            </button>
          </div>

          <dl className="grid gap-3.5 sm:grid-cols-2">
            <ProfileDetailRow label="Nama Lengkap" value={profile.name} />
            <ProfileDetailRow label="Nomor WhatsApp / Telepon" value={profile.phone || 'Belum diisi'} />
            <ProfileDetailRow
              label="Tempat, Tanggal Lahir"
              value={formatBirthDetails(profile.birthPlace, profile.birthDate)}
            />
            <ProfileDetailRow
              label="Wilayah"
              value={
                user?.nomor_rt || user?.nomor_rw
                  ? [user.nomor_rt ? `RT ${user.nomor_rt}` : '', user.nomor_rw ? `RW ${user.nomor_rw}` : '']
                      .filter(Boolean)
                      .join(' / ')
                  : 'Belum ditentukan'
              }
            />
            <div className="sm:col-span-2">
              <ProfileDetailRow label="Alamat" value={profile.address || 'Belum diisi'} />
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="management-profile-security"
          className="rounded-2xl border border-primary-100 bg-white p-5 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-100/70 text-primary-600">
              <Icon name="shield" className="size-5" />
            </span>
            <div>
              <h2 id="management-profile-security" className="text-lg font-semibold text-neutral-900">
                Keamanan Akun
              </h2>
              <p className="mt-0.5 text-xs leading-5 text-neutral-500">
                Perbarui username login atau ganti kata sandi secara berkala untuk menjaga keamanan akses {roleLabel.toLowerCase()}.
              </p>
            </div>
          </div>

          <dl className="mt-5 space-y-3">
            <ProfileDetailRow label="Username Login" value={`@${profile.username}`} />
            <ProfileDetailRow label="Kata Sandi" value="••••••••••••" />
          </dl>

          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setShowManagePassword(true);
            }}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50/60 px-4 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100/60"
          >
            <Icon name="settings" className="size-4" />
            Ubah Username &amp; Sandi
          </button>
        </section>
      </div>

      {showEditProfile && (
        <ProfileDialog title="Edit Profil" onClose={() => setShowEditProfile(false)} variant="form">
          <EditProfileForm
            profile={profile}
            onSave={() => {
              setShowEditProfile(false);
              setNotice('Data profil berhasil diperbarui.');
            }}
            onCancel={() => setShowEditProfile(false)}
          />
        </ProfileDialog>
      )}

      {showManagePassword && (
        <ProfileDialog title="Kelola Sandi" onClose={() => setShowManagePassword(false)} variant="form">
          <ManagePasswordForm
            username={profile.username}
            onSave={() => {
              setShowManagePassword(false);
              setNotice('Username atau kata sandi berhasil diperbarui.');
            }}
            onCancel={() => setShowManagePassword(false)}
          />
        </ProfileDialog>
      )}
    </ManagementLayout>
  );
}

