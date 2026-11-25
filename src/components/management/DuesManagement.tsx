'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DashboardDuesSkeleton } from '@/components/management/DashboardLoadingSkeleton';
import { Icon, ManagementLayout } from '@/components/management/ManagementDashboard';
import { getManagementIuran, updatePaymentSettings, verifyPayment } from '@/lib/api/management-iuran';
import type {
  FilterTab,
  HouseholdPayment,
  ManagementIuranMetrics,
  PaymentStatus,
} from '@/types/management-iuran';

type DialogAction = 'approve' | 'reject';

const EMPTY_METRICS: ManagementIuranMetrics = {
  totalCollected: 0,
  waitingCount: 0,
  paidCount: 0,
  unpaidCount: 0,
  totalHouseholds: 0,
  progressPercentage: 0,
};

const PAGE_SIZE = 5;
const tabs: FilterTab[] = ['Semua', 'Menunggu', 'Lunas', 'Belum Lunas'];

function formatCurrency(amount: number | null) {
  if (amount === null) return 'Rp–';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return '–';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    Menunggu: 'bg-secondary-100 text-secondary-600',
    Lunas: 'bg-[#C8F0E3] text-[#16866A]',
    'Belum Lunas': 'bg-[#FFD2CE] text-primary-600',
  };
  return <span className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium ${styles[status]}`}>{status}</span>;
}

function ConfirmDialog({
  payment,
  action,
  isVerifying,
  error,
  onClose,
  onConfirm,
}: {
  payment: HouseholdPayment;
  action: DialogAction;
  isVerifying: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const title = action === 'approve' ? 'Konfirmasi Pembayaran (Terima)' : 'Tolak Pembayaran';
  const description = action === 'approve'
    ? `Konfirmasi pembayaran dari ${payment.name} sebesar ${formatCurrency(payment.amount)} sebagai lunas?`
    : `Tolak bukti pembayaran dari ${payment.name}? Status iuran akan dikembalikan menjadi Belum Lunas.`;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="payment-confirm-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Tutup" onClick={onClose} className="absolute inset-0 bg-neutral-900/40" />
      <section className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="payment-confirm-title" className="text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
        {error && (
          <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-3 text-xs leading-5 text-primary-700">
            {error}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={isVerifying}
            onClick={onClose}
            className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isVerifying}
            onClick={onConfirm}
            className={`min-h-10 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50 ${
              action === 'approve' ? 'bg-[#16866A] hover:bg-[#13735B]' : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {isVerifying ? 'Memproses...' : action === 'approve' ? 'Ya, Terima' : 'Ya, Tolak'}
          </button>
        </div>
      </section>
    </div>
  );
}

export function DuesManagement({ role, userName }: { role: 'admin' | 'panitia'; userName: string }) {
  const [payments, setPayments] = useState<HouseholdPayment[]>([]);
  const [metrics, setMetrics] = useState<ManagementIuranMetrics | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('Semua');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ payment: HouseholdPayment; action: DialogAction } | null>(null);
  const [proof, setProof] = useState<HouseholdPayment | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Settings form states
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [qrisPreview, setQrisPreview] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function applyDuesResponse(res: Awaited<ReturnType<typeof getManagementIuran>>) {
    setPayments(res.data?.payments ?? []);
    setMetrics(res.data?.metrics ?? EMPTY_METRICS);
    if (res.data?.settings) {
      setBankName(res.data.settings.nama_bank || '');
      setAccountNumber(res.data.settings.nomor_rekening || '');
      setAccountHolder(res.data.settings.atas_nama || '');
      setQrisPreview(res.data.settings.qris_image || null);
    }
    setHasLoaded(true);
    setLoadError(null);
  }

  async function loadData(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      const res = await getManagementIuran();
      applyDuesResponse(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat data iuran.';
      console.error('Failed to load management iuran:', err);
      setLoadError(message);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getManagementIuran()
      .then((res) => {
        if (!active) return;
        applyDuesResponse(res);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'Gagal memuat data iuran.';
        console.error('Failed to load management iuran:', err);
        setLoadError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('id-ID');
    return payments.filter((payment) => (activeTab === 'Semua' || payment.status === activeTab) &&
      (!search || payment.name.toLocaleLowerCase('id-ID').includes(search)));
  }, [payments, activeTab, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function changeTab(tab: FilterTab) { setActiveTab(tab); setPage(1); }
  function changeQuery(value: string) { setQuery(value); setPage(1); }

  async function confirmAction() {
    if (!dialog) return;
    if (dialog.payment.status !== 'Menunggu') {
      setActionError('Pembayaran dengan status selain Menunggu tidak dapat dibatalkan atau diubah.');
      return;
    }
    setActionError(null);
    setIsVerifying(true);

    try {
      if (dialog.payment.id_pembayaran) {
        const keputusan = dialog.action === 'approve' ? 'Diterima' : 'Ditolak';
        await verifyPayment(dialog.payment.id_pembayaran, { keputusan });
      } else {
        throw new Error('ID pembayaran tidak valid atau belum diunggah.');
      }

      setPayments((current) => current.map((item) => (
        item.id === dialog.payment.id
          ? { ...item, status: dialog.action === 'approve' ? 'Lunas' : 'Belum Lunas' }
          : item
      )));

      await loadData(false);
      setDialog(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memproses verifikasi pembayaran.';
      setActionError(message);
    } finally {
      setIsVerifying(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setQrisFile(file);
      const url = URL.createObjectURL(file);
      setQrisPreview(url);
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      const formData = new FormData();
      formData.append('nama_bank', bankName);
      formData.append('nomor_rekening', accountNumber);
      formData.append('atas_nama', accountHolder);
      if (qrisFile) {
        formData.append('qris_image', qrisFile);
      }

      await updatePaymentSettings(formData);
      setSettingsSuccess('Pengaturan rekening dan QRIS berhasil disimpan.');
      await loadData(false);
      setTimeout(() => {
        setSettingsOpen(false);
        setSettingsSuccess(null);
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan pengaturan pembayaran.';
      setSettingsError(message);
    } finally {
      setSavingSettings(false);
    }
  }

  function paginationPages(): (number | '…')[] {
    if (pageCount <= 5) return Array.from({ length: pageCount }, (_, index) => index + 1);
    const pages: (number | '…')[] = [1];
    if (currentPage > 3) pages.push('…');
    for (let number = Math.max(2, currentPage - 1); number <= Math.min(pageCount - 1, currentPage + 1); number++) pages.push(number);
    if (currentPage < pageCount - 2) pages.push('…');
    pages.push(pageCount);
    return pages;
  }

  return <ManagementLayout role={role} userName={userName} title="Kelola Iuran" activeItem="dues">
    <section className="mb-7 sm:mb-8">
      <p className="mb-1 text-sm font-medium text-primary-600">Ruang {role === 'admin' ? 'Admin' : 'Panitia'}</p>
      <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">Kelola Iuran</h1>
    </section>

    {loadError && (
      <div className="mb-6 flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-700">
        <span>{loadError}</span>
        <button
          type="button"
          onClick={() => loadData(true)}
          className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700"
        >
          Muat Ulang
        </button>
      </div>
    )}

    {loading && !hasLoaded ? (
      <DashboardDuesSkeleton />
    ) : metrics ? (
      <>
        <section aria-label="Ringkasan pembayaran iuran" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-neutral-500">Iuran terkumpul</p>
            <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{formatCurrency(metrics.totalCollected)}</p>
          </article>
          <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-neutral-500">Menunggu konfirmasi</p>
            <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{metrics.waitingCount}</p>
          </article>
          <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-neutral-500">Pembayaran lunas</p>
            <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{metrics.paidCount}</p>
          </article>
          <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-neutral-500">Belum pembayaran</p>
            <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{metrics.unpaidCount}</p>
          </article>
        </section>

        <section aria-label="Progres penerimaan iuran" className="mb-6 rounded-xl border border-primary-100 bg-white p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-neutral-800">Progres penerimaan iuran</h2>
            <span className="text-xs font-semibold text-neutral-400">{metrics.progressPercentage}% dari total kepala keluarga</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-neutral-50">
            <div
              className="h-full rounded-full bg-primary-600 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, metrics.progressPercentage))}%` }}
            />
          </div>
        </section>

        <button
          type="button"
          onClick={() => {
            setSettingsError(null);
            setSettingsSuccess(null);
            setSettingsOpen(true);
          }}
          className="mb-6 flex min-h-[72px] w-full items-center justify-between rounded-2xl bg-primary-100/70 px-5 text-left text-base font-semibold text-primary-600 transition hover:bg-primary-100 sm:px-6 sm:text-lg"
        >
          <span>Pengaturan Rekening dan QRIS</span>
          <Icon name="arrow" className="size-6" />
        </button>

        <section aria-labelledby="dues-table-title" className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_3px_16px_rgba(34,24,24,0.025)]">
          <h2 id="dues-table-title" className="sr-only">Daftar pembayaran iuran</h2>
          <div className="flex flex-col gap-4 border-b border-neutral-100 p-4 sm:p-5">
            <div role="tablist" aria-label="Filter status pembayaran" className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => changeTab(tab)}
                  className={`min-h-9 rounded-xl px-4 text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-primary-100 text-primary-700' : 'border border-neutral-200 bg-white text-neutral-500 hover:border-primary-200 hover:text-primary-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative max-w-[460px]">
              <label htmlFor="dues-search" className="sr-only">Cari nama kepala keluarga</label>
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400" />
              <input
                id="dues-search"
                type="search"
                value={query}
                onChange={(event) => changeQuery(event.target.value)}
                placeholder="Cari nama kepala keluarga"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-primary-400 focus:ring-3 focus:ring-primary-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead className="bg-neutral-50 text-xs font-semibold text-neutral-700">
                <tr>
                  {['Kepala Keluarga', 'Nominal', 'Tanggal Pembayaran', 'Bukti Pembayaran', 'Status', 'Aksi'].map((heading) => (
                    <th key={heading} scope="col" className="px-4 py-4 first:pl-5 last:pr-5">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pageItems.map((payment) => (
                  <tr key={payment.id} className="hover:bg-primary-50/40">
                    <td className="px-4 py-3.5 pl-5">
                      <p className="text-sm font-semibold text-neutral-900">{payment.name}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">{payment.phone}</p>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3.5 text-sm ${payment.amount === null ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3.5 text-sm ${payment.date ? 'text-neutral-500' : 'text-neutral-300'}`}>
                      {formatDate(payment.date)}
                    </td>
                    <td className="px-4 py-3.5">
                      {payment.proofUrl || payment.date ? (
                        <button
                          type="button"
                          onClick={() => setProof(payment)}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          Lihat Bukti
                        </button>
                      ) : (
                        <span className="text-sm text-neutral-300">Belum Diunggah</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3.5 pr-5">
                      {payment.status === 'Menunggu' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Terima pembayaran ${payment.name}`}
                            title="Terima (Konfirmasi)"
                            onClick={() => {
                              setActionError(null);
                              setDialog({ payment, action: 'approve' });
                            }}
                            className="flex size-8 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-600 transition hover:bg-primary-50"
                          >
                            <Icon name="check" className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Tolak pembayaran ${payment.name}`}
                            title="Tolak"
                            onClick={() => {
                              setActionError(null);
                              setDialog({ payment, action: 'reject' });
                            }}
                            className="flex size-8 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-600 transition hover:bg-primary-50"
                          >
                            <Icon name="close" className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-neutral-400">
                      {loading ? 'Memuat data pembayaran...' : 'Tidak ada pembayaran ditemukan'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-400">
              Menampilkan {pageItems.length} dari {filtered.length} kepala keluarga
            </p>
            <nav aria-label="Navigasi halaman iuran" className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Halaman sebelumnya"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => value - 1)}
                className="flex size-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-50 disabled:cursor-not-allowed disabled:text-neutral-300"
              >
                <Icon name="chevron" className="size-4 rotate-180" />
              </button>
              {paginationPages().map((item, index) => (
                item === '…' ? (
                  <span key={`ellipsis-${index}`} className="px-1 text-sm text-primary-600">…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    aria-current={currentPage === item ? 'page' : undefined}
                    onClick={() => setPage(item)}
                    className={`flex size-8 items-center justify-center rounded-lg text-sm font-semibold ${currentPage === item ? 'bg-primary-100 text-primary-700' : 'text-primary-600 hover:bg-primary-50'}`}
                  >
                    {item}
                  </button>
                )
              ))}
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

    {dialog && (
      <ConfirmDialog
        payment={dialog.payment}
        action={dialog.action}
        isVerifying={isVerifying}
        error={actionError}
        onClose={() => {
          if (!isVerifying) {
            setDialog(null);
            setActionError(null);
          }
        }}
        onConfirm={confirmAction}
      />
    )}

    {proof && (
      <div role="dialog" aria-modal="true" aria-labelledby="proof-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button type="button" aria-label="Tutup" onClick={() => setProof(null)} className="absolute inset-0 bg-neutral-900/40" />
        <section className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="proof-title" className="text-lg font-semibold text-neutral-900">Bukti pembayaran</h2>
              <p className="mt-1 text-sm text-neutral-500">{proof.name} · {formatCurrency(proof.amount)}</p>
            </div>
            <button type="button" aria-label="Tutup" onClick={() => setProof(null)} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-50">
              <Icon name="close" className="size-5" />
            </button>
          </div>
          <div className="mt-5 flex min-h-72 items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-center">
            {proof.proofUrl ? (
              <img
                src={proof.proofUrl}
                alt={`Bukti pembayaran ${proof.name}`}
                className="max-h-80 max-w-full rounded-lg object-contain shadow-sm"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = (e.target as HTMLElement).nextElementSibling;
                  if (fallback) (fallback as HTMLElement).style.display = 'block';
                }}
              />
            ) : null}
            <div style={{ display: proof.proofUrl ? 'none' : 'block' }}>
              <Icon name="image" className="mx-auto size-10 text-neutral-300" />
              <p className="mt-3 text-sm font-medium text-neutral-500">Pratinjau bukti pembayaran</p>
              <p className="mt-1 text-xs text-neutral-400">
                {proof.proofUrl ? 'File bukti tidak dapat ditampilkan dari server' : 'Belum ada bukti pembayaran terlampir'}
              </p>
            </div>
          </div>
        </section>
      </div>
    )}

    {settingsOpen && (
      <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          aria-label="Tutup"
          onClick={() => {
            if (!savingSettings) setSettingsOpen(false);
          }}
          className="absolute inset-0 bg-neutral-900/40"
        />
        <section className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="settings-title" className="text-lg font-semibold text-neutral-900">Pengaturan Rekening dan QRIS</h2>
              <p className="mt-1 text-sm text-neutral-500">Informasi pembayaran iuran warga</p>
            </div>
            <button
              type="button"
              aria-label="Tutup"
              disabled={savingSettings}
              onClick={() => setSettingsOpen(false)}
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-50 disabled:opacity-50"
            >
              <Icon name="close" className="size-5" />
            </button>
          </div>

          {settingsError && (
            <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-3 text-xs leading-5 text-primary-700">
              {settingsError}
            </div>
          )}

          {settingsSuccess && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-700">
              {settingsSuccess}
            </div>
          )}

          <div className="mt-5 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">Nama bank</span>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Contoh: Bank BRI"
                className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-800 outline-none focus:border-primary-400"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">Nomor rekening</span>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Contoh: 0123 01 000000 30 1"
                className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-800 outline-none focus:border-primary-400"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">Atas nama</span>
              <input
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Contoh: Panitia HUT RI"
                className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-800 outline-none focus:border-primary-400"
              />
            </label>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-neutral-700">Gambar QRIS</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-center transition hover:border-primary-300 hover:bg-neutral-100/50"
              >
                {qrisPreview ? (
                  <div className="flex flex-col items-center">
                    <img src={qrisPreview} alt="Pratinjau QRIS" className="max-h-40 rounded-lg object-contain shadow-sm" />
                    <p className="mt-2 text-xs font-medium text-primary-600">Klik untuk mengganti gambar</p>
                  </div>
                ) : (
                  <div>
                    <Icon name="image" className="mx-auto size-8 text-neutral-300" />
                    <p className="mt-2 text-sm text-neutral-500">Unggah gambar QRIS</p>
                    <p className="mt-0.5 text-xs text-neutral-400">PNG, JPG atau WEBP (maks. 2MB)</p>
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled={savingSettings}
              onClick={handleSaveSettings}
              className="min-h-10 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {savingSettings ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </section>
      </div>
    )}
  </ManagementLayout>;
}
