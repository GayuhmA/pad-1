'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DashboardMetricSkeleton,
  DashboardSkeletonFrame,
  DashboardTableSkeleton,
} from '@/components/management/DashboardLoadingSkeleton';
import { Icon, ManagementLayout } from '@/components/management/ManagementDashboard';
import { Modal } from '@/components/Modal';
import {
  getAdminAkun,
  updateAdminAkunRole,
  updateAdminAkunStatus,
} from '@/lib/api/management-admin';
import { useAuthStore } from '@/stores/auth-store';
import type {
  AccountStatus,
  AkunItem,
  AkunMetrics,
  RoleOption,
} from '@/types/management-admin';

type RoleFilterTab = 'Semua' | 'Panitia' | 'Warga' | 'Admin';

const PAGE_SIZE = 7;
const ROLE_TABS: RoleFilterTab[] = ['Semua', 'Panitia', 'Warga', 'Admin'];

const DEFAULT_ROLE_OPTIONS: RoleOption[] = [
  { id_role: 3, nama_role: 'Warga' },
  { id_role: 2, nama_role: 'Panitia' },
  { id_role: 1, nama_role: 'Admin' },
];

const EMPTY_METRICS: AkunMetrics = {
  totalAkun: 0,
  panitiaCount: 0,
  wargaCount: 0,
  aktifCount: 0,
};

function RoleBadge({ role }: { role: string }) {
  const lower = role.toLowerCase();
  const cls = lower.includes('admin')
    ? 'bg-[#FFE0DD] text-primary-700'
    : lower.includes('panitia')
      ? 'bg-secondary-100 text-secondary-700'
      : 'bg-neutral-100 text-neutral-700';
  return (
    <span className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const cls = status === 'Aktif'
    ? 'bg-[#C8F0E3] text-[#16866A]'
    : 'bg-[#FFD2CE] text-primary-600';
  return (
    <span className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

export function PanitiaManagement({ role, userName }: { role: 'admin' | 'panitia'; userName: string }) {
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  const [akunList, setAkunList] = useState<AkunItem[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>(DEFAULT_ROLE_OPTIONS);
  const [metrics, setMetrics] = useState<AkunMetrics>(EMPTY_METRICS);

  const [roleTab, setRoleTab] = useState<RoleFilterTab>('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | AccountStatus>('Semua');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [roleDialog, setRoleDialog] = useState<{ akun: AkunItem; selectedRoleId: number } | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ akun: AkunItem; nextStatus: AccountStatus } | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const reload = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const response = await getAdminAkun({ per_page: 100 });
      setAkunList(response.data.akun);
      setRoleOptions(response.data.roleOptions.length ? response.data.roleOptions : DEFAULT_ROLE_OPTIONS);
      setMetrics(response.data.metrics);
      setHasLoaded(true);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Daftar akun gagal dimuat.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getAdminAkun({ per_page: 100 }, controller.signal)
      .then((response) => {
        setAkunList(response.data.akun);
        setRoleOptions(response.data.roleOptions.length ? response.data.roleOptions : DEFAULT_ROLE_OPTIONS);
        setMetrics(response.data.metrics);
        setHasLoaded(true);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : 'Daftar akun gagal dimuat.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5_000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('id-ID');
    return akunList.filter((item) => {
      if (roleTab !== 'Semua' && !item.nama_role.toLowerCase().includes(roleTab.toLowerCase())) return false;
      if (statusFilter !== 'Semua' && item.status !== statusFilter) return false;
      if (!keyword) return true;
      return (
        item.nama.toLocaleLowerCase('id-ID').includes(keyword) ||
        item.username.toLocaleLowerCase('id-ID').includes(keyword) ||
        (item.nik ?? '').toLocaleLowerCase('id-ID').includes(keyword) ||
        (item.no_hp ?? '').toLocaleLowerCase('id-ID').includes(keyword)
      );
    });
  }, [akunList, roleTab, statusFilter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function paginationPages(): (number | '…')[] {
    if (pageCount <= 5) return Array.from({ length: pageCount }, (_, index) => index + 1);
    const pages: (number | '…')[] = [1];
    if (currentPage > 3) pages.push('…');
    for (let num = Math.max(2, currentPage - 1); num <= Math.min(pageCount - 1, currentPage + 1); num++) {
      pages.push(num);
    }
    if (currentPage < pageCount - 2) pages.push('…');
    pages.push(pageCount);
    return pages;
  }

  async function handleConfirmRoleChange() {
    if (!roleDialog || mutating) return;
    setMutating(true);
    setMutationError(null);
    try {
      const res = await updateAdminAkunRole(roleDialog.akun.id_akun, {
        id_role: roleDialog.selectedRoleId,
      });
      setRoleDialog(null);
      setToast(res.message || 'Role akun berhasil diperbarui.');
      await reload(false);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Gagal memperbarui role akun.');
    } finally {
      setMutating(false);
    }
  }

  async function handleConfirmStatusChange() {
    if (!statusDialog || mutating) return;
    setMutating(true);
    setMutationError(null);
    try {
      const res = await updateAdminAkunStatus(statusDialog.akun.id_akun, {
        status: statusDialog.nextStatus,
      });
      setStatusDialog(null);
      setToast(res.message || 'Status akun berhasil diperbarui.');
      await reload(false);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Gagal memperbarui status akun.');
    } finally {
      setMutating(false);
    }
  }

  return (
    <ManagementLayout role={role} userName={userName} title="Kelola Panitia" activeItem="panitia">
      <section className="mb-7 sm:mb-8">
        <p className="mb-1 text-sm font-medium text-primary-600">Ruang Admin</p>
        <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">
          Kelola Panitia &amp; Akun
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Tetapkan akun warga sebagai Panitia, ubah hak akses role, atau aktifkan/nonaktifkan akun login.
        </p>
      </section>

      {toast && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="rounded p-1 text-green-700/70 hover:text-green-900"
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>
      )}

      {loadError && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-700">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => void reload(true)}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
          >
            Muat Ulang
          </button>
        </div>
      )}

      {loading && !hasLoaded ? (
        <DashboardSkeletonFrame label="Memuat data akun dan panitia…">
          <DashboardMetricSkeleton count={4} />
          <DashboardTableSkeleton columns={5} rows={6} tabCount={4} hasSelectFilter />
        </DashboardSkeletonFrame>
      ) : hasLoaded ? (
        <>
          <section aria-label="Ringkasan akun dan panitia" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5">
              <p className="text-sm font-medium text-neutral-500">Total akun</p>
              <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{metrics.totalAkun}</p>
            </article>
            <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5">
              <p className="text-sm font-medium text-neutral-500">Total panitia</p>
              <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{metrics.panitiaCount}</p>
            </article>
            <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5">
              <p className="text-sm font-medium text-neutral-500">Akun warga</p>
              <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{metrics.wargaCount}</p>
            </article>
            <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5">
              <p className="text-sm font-medium text-neutral-500">Akun aktif</p>
              <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{metrics.aktifCount}</p>
            </article>
          </section>

          <section
            aria-labelledby="akun-table-title"
            className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_3px_16px_rgba(34,24,24,0.025)]"
          >
            <h2 id="akun-table-title" className="sr-only">Daftar akun dan panitia</h2>
            <div className="flex flex-col gap-4 border-b border-neutral-100 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div role="tablist" aria-label="Filter role akun" className="flex flex-wrap gap-2">
                  {ROLE_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={roleTab === tab}
                      onClick={() => {
                        setRoleTab(tab);
                        setPage(1);
                      }}
                      className={`min-h-9 rounded-xl px-4 text-sm font-semibold transition-colors ${
                        roleTab === tab
                          ? 'bg-primary-100 text-primary-700'
                          : 'border border-neutral-200 bg-white text-neutral-500 hover:border-primary-200 hover:text-primary-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-sm text-neutral-600">
                  <span className="text-xs font-semibold text-neutral-500">Status Akun:</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value as 'Semua' | AccountStatus);
                      setPage(1);
                    }}
                    className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 outline-none focus:border-primary-400"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </label>
              </div>

              <div className="relative max-w-[460px]">
                <label htmlFor="akun-search" className="sr-only">Cari nama, username, atau NIK akun</label>
                <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400" />
                <input
                  id="akun-search"
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari nama, username, NIK, atau nomor HP"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-primary-400 focus:ring-3 focus:ring-primary-100"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left">
                <thead className="bg-neutral-50 text-xs font-semibold text-neutral-700">
                  <tr>
                    {['Nama & Username', 'Role', 'Kontak / Wilayah', 'Status Akun', 'Aksi'].map((heading) => (
                      <th key={heading} scope="col" className="px-4 py-4 first:pl-5 last:pr-5">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pageItems.map((item) => {
                    const isSelf = currentUserId !== null && item.id_akun === currentUserId;
                    const nextStatus: AccountStatus = item.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
                    return (
                      <tr key={item.id_akun} className="hover:bg-primary-50/40">
                        <td className="px-4 py-3.5 pl-5">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-neutral-900">{item.nama}</p>
                            {isSelf && (
                              <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[11px] font-semibold text-primary-700">
                                Anda
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-neutral-400">
                            @{item.username}{item.nik ? ` · NIK ${item.nik}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <RoleBadge role={item.nama_role} />
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm text-neutral-700">{item.no_hp ?? '–'}</p>
                          {item.wilayah && <p className="mt-0.5 text-xs text-neutral-400">{item.wilayah}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3.5 pr-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={isSelf}
                              title={isSelf ? 'Role akun sendiri tidak dapat diubah' : 'Ubah role akun'}
                              onClick={() => {
                                setMutationError(null);
                                setRoleDialog({ akun: item, selectedRoleId: item.id_role });
                              }}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-primary-200 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Icon name="shield" className="size-3.5" />
                              Ubah Role
                            </button>
                            <button
                              type="button"
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? 'Akun sendiri tidak dapat dinonaktifkan'
                                  : nextStatus === 'Nonaktif'
                                    ? 'Nonaktifkan akses login akun ini'
                                    : 'Aktifkan kembali akun ini'
                              }
                              onClick={() => {
                                setMutationError(null);
                                setStatusDialog({ akun: item, nextStatus });
                              }}
                              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                item.status === 'Aktif'
                                  ? 'border-primary-200 bg-white text-primary-600 hover:bg-primary-50'
                                  : 'border-[#16866A]/30 bg-white text-[#16866A] hover:bg-[#C8F0E3]/40'
                              }`}
                            >
                              {item.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-14 text-center text-sm text-neutral-400">
                        {loading ? 'Memuat daftar akun…' : 'Belum ada akun yang cocok'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-neutral-400">
                Menampilkan {pageItems.length} dari {filtered.length} akun
              </p>
              <nav aria-label="Navigasi halaman akun" className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Halaman sebelumnya"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="flex size-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-50 disabled:cursor-not-allowed disabled:text-neutral-300"
                >
                  <Icon name="chevron" className="size-4 rotate-180" />
                </button>
                {paginationPages().map((item, index) =>
                  item === '…' ? (
                    <span key={`ellipsis-${index}`} className="px-1 text-sm text-primary-600">…</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      aria-current={currentPage === item ? 'page' : undefined}
                      onClick={() => setPage(item)}
                      className={`flex size-8 items-center justify-center rounded-lg text-sm font-semibold ${
                        currentPage === item ? 'bg-primary-100 text-primary-700' : 'text-primary-600 hover:bg-primary-50'
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  aria-label="Halaman berikutnya"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage((value) => value + 1)}
                  className="flex size-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-50 disabled:cursor-not-allowed disabled:text-neutral-300"
                >
                  <Icon name="chevron" className="size-4" />
                </button>
              </nav>
            </div>
          </section>
        </>
      ) : null}

      {roleDialog && (
        <Modal
          isOpen
          onClose={() => {
            if (!mutating) setRoleDialog(null);
          }}
          ariaLabel="Ubah role akun"
        >
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">Manajemen Hak Akses</p>
            <h2 className="mt-1 text-lg font-semibold text-neutral-900">Ubah Role {roleDialog.akun.nama}</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Username <span className="font-mono font-medium">@{roleDialog.akun.username}</span> saat ini memiliki role{' '}
              <strong>{roleDialog.akun.nama_role}</strong>.
            </p>

            <div className="mt-5 space-y-2.5">
              {roleOptions.map((opt) => {
                const selected = roleDialog.selectedRoleId === opt.id_role;
                return (
                  <label
                    key={opt.id_role}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${
                      selected
                        ? 'border-primary-400 bg-primary-50/70'
                        : 'border-neutral-200 bg-white hover:border-primary-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="akun-role"
                        checked={selected}
                        onChange={() => setRoleDialog({ ...roleDialog, selectedRoleId: opt.id_role })}
                        className="size-4 accent-primary-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{opt.nama_role}</p>
                        <p className="text-xs text-neutral-500">
                          {opt.nama_role === 'Panitia'
                            ? 'Dapat mengelola lomba, pendaftaran, verifikasi iuran, histori, dan dokumentasi.'
                            : opt.nama_role === 'Admin'
                              ? 'Memiliki akses penuh termasuk kelola data warga dan manajemen akun.'
                              : 'Hanya dapat mengakses halaman warga, pendaftaran lomba, dan pembayaran iuran.'}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {mutationError && (
              <div role="alert" className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-3 text-xs text-primary-700">
                {mutationError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={mutating}
                onClick={() => setRoleDialog(null)}
                className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={mutating || roleDialog.selectedRoleId === roleDialog.akun.id_role}
                onClick={() => void handleConfirmRoleChange()}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="check" className="size-4" />
                {mutating ? 'Menyimpan…' : 'Simpan Role'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {statusDialog && (
        <Modal
          isOpen
          onClose={() => {
            if (!mutating) setStatusDialog(null);
          }}
          ariaLabel="Konfirmasi perubahan status akun"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              {statusDialog.nextStatus === 'Nonaktif' ? 'Nonaktifkan Akun Login?' : 'Aktifkan Kembali Akun?'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              {statusDialog.nextStatus === 'Nonaktif'
                ? `Akun ${statusDialog.akun.nama} (@${statusDialog.akun.username}) tidak akan bisa masuk ke sistem sampai diaktifkan kembali.`
                : `Akun ${statusDialog.akun.nama} (@${statusDialog.akun.username}) akan dapat masuk kembali menggunakan kredensialnya.`}
            </p>
            {mutationError && (
              <div role="alert" className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-3 text-xs text-primary-700">
                {mutationError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={mutating}
                onClick={() => setStatusDialog(null)}
                className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={mutating}
                onClick={() => void handleConfirmStatusChange()}
                className={`min-h-10 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50 ${
                  statusDialog.nextStatus === 'Aktif'
                    ? 'bg-[#16866A] hover:bg-[#13735B]'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {mutating
                  ? 'Memproses…'
                  : statusDialog.nextStatus === 'Aktif'
                    ? 'Ya, Aktifkan'
                    : 'Ya, Nonaktifkan'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ManagementLayout>
  );
}

