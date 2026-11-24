'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon, ManagementLayout } from '@/components/management/ManagementDashboard';
import { getManagementPendaftaran, updateRegistrationStatus } from '@/lib/api/management-pendaftaran';

// ─── Types ───────────────────────────────────────────────────────────────────

type RegistrationStatus = 'Menunggu' | 'Diterima' | 'Ditolak' | 'Dibatalkan';
type FilterTab = 'Semua' | RegistrationStatus;

interface Registration {
  id: string;
  peserta: string;
  jenis: 'Individu' | 'Regu';
  nama_tim: string | null;
  lomba: string;
  no_telp: string;
  tanggal_daftar: string;
  status: RegistrationStatus;
}

interface LombaQuota {
  id: string;
  nama: string;
  terdaftar: number;
  kapasitas: number;
  jenis: 'peserta' | 'regu';
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const initialRegistrations: Registration[] = [
  { id: '1', peserta: 'Carole Savoie', jenis: 'Individu', nama_tim: null, lomba: 'Mewarnai', no_telp: '+628 – 0336 – 9511 – 564', tanggal_daftar: '2026-08-15', status: 'Menunggu' },
  { id: '2', peserta: 'Guy Hawkins', jenis: 'Individu', nama_tim: null, lomba: 'Mewarnai', no_telp: '+628 – 2764 – 1199 – 078', tanggal_daftar: '2026-08-15', status: 'Menunggu' },
  { id: '3', peserta: 'Robert Fox', jenis: 'Individu', nama_tim: null, lomba: 'Mewarnai', no_telp: '+628 – 7355 – 9639 – 674', tanggal_daftar: '2026-08-15', status: 'Menunggu' },
  { id: '4', peserta: 'Hadi Setiawan', jenis: 'Individu', nama_tim: null, lomba: 'Mewarnai', no_telp: '+628 – 4317 – 2319 – 753', tanggal_daftar: '2026-08-14', status: 'Ditolak' },
  { id: '5', peserta: 'Kristin Watson', jenis: 'Individu', nama_tim: null, lomba: 'Mewarnai', no_telp: '+628 – 5689 – 0863 – 286', tanggal_daftar: '2026-08-14', status: 'Diterima' },
  { id: '6', peserta: 'Esther Howard', jenis: 'Individu', nama_tim: null, lomba: 'Mewarnai', no_telp: '+628 – 9412 – 2158 – 633', tanggal_daftar: '2026-08-13', status: 'Diterima' },
  { id: '7', peserta: 'Ahmad Fauzi', jenis: 'Individu', nama_tim: null, lomba: 'Makan Kerupuk', no_telp: '+628 – 1234 – 5678 – 901', tanggal_daftar: '2026-08-13', status: 'Diterima' },
  { id: '8', peserta: 'Siti Rahayu', jenis: 'Individu', nama_tim: null, lomba: 'Makan Kerupuk', no_telp: '+628 – 2345 – 6789 – 012', tanggal_daftar: '2026-08-13', status: 'Diterima' },
  { id: '9', peserta: 'Rudi Hartono', jenis: 'Individu', nama_tim: null, lomba: 'Makan Kerupuk', no_telp: '+628 – 3456 – 7890 – 123', tanggal_daftar: '2026-08-12', status: 'Menunggu' },
  { id: '10', peserta: 'Dewi Anggraini', jenis: 'Regu', nama_tim: 'Tim Garuda', lomba: 'Futsal Sarung', no_telp: '+628 – 4567 – 8901 – 234', tanggal_daftar: '2026-08-12', status: 'Diterima' },
  { id: '11', peserta: 'Budi Santoso', jenis: 'Regu', nama_tim: 'Tim Merah', lomba: 'Futsal Sarung', no_telp: '+628 – 5678 – 9012 – 345', tanggal_daftar: '2026-08-12', status: 'Diterima' },
  { id: '12', peserta: 'Rina Puspita', jenis: 'Individu', nama_tim: null, lomba: 'Balap Karung', no_telp: '+628 – 6789 – 0123 – 456', tanggal_daftar: '2026-08-11', status: 'Ditolak' },
  { id: '13', peserta: 'Joko Widodo', jenis: 'Individu', nama_tim: null, lomba: 'Balap Karung', no_telp: '+628 – 7890 – 1234 – 567', tanggal_daftar: '2026-08-11', status: 'Diterima' },
  { id: '14', peserta: 'Maya Sari', jenis: 'Individu', nama_tim: null, lomba: 'Memasukkan Paku', no_telp: '+628 – 8901 – 2345 – 678', tanggal_daftar: '2026-08-11', status: 'Diterima' },
  { id: '15', peserta: 'Andi Surya', jenis: 'Regu', nama_tim: 'Tim Nusantara', lomba: 'Futsal Sarung', no_telp: '+628 – 9012 – 3456 – 789', tanggal_daftar: '2026-08-10', status: 'Menunggu' },
  { id: '16', peserta: 'Lestari Wulandari', jenis: 'Individu', nama_tim: null, lomba: 'Makan Kerupuk', no_telp: '+628 – 0123 – 4567 – 890', tanggal_daftar: '2026-08-10', status: 'Diterima' },
  { id: '17', peserta: 'Faisal Rahman', jenis: 'Individu', nama_tim: null, lomba: 'Catur', no_telp: '+628 – 1111 – 2222 – 333', tanggal_daftar: '2026-08-10', status: 'Diterima' },
  { id: '18', peserta: 'Nining Haryanti', jenis: 'Individu', nama_tim: null, lomba: 'Catur', no_telp: '+628 – 2222 – 3333 – 444', tanggal_daftar: '2026-08-09', status: 'Diterima' },
  { id: '19', peserta: 'Wahyu Nugroho', jenis: 'Individu', nama_tim: null, lomba: 'Mewarnai', no_telp: '+628 – 3333 – 4444 – 555', tanggal_daftar: '2026-08-09', status: 'Diterima' },
  { id: '20', peserta: 'Putri Handayani', jenis: 'Individu', nama_tim: null, lomba: 'Mewarnai', no_telp: '+628 – 4444 – 5555 – 666', tanggal_daftar: '2026-08-09', status: 'Diterima' },
  { id: '21', peserta: 'Surya Pranata', jenis: 'Regu', nama_tim: 'Tim Biru', lomba: 'Futsal Sarung', no_telp: '+628 – 5555 – 6666 – 777', tanggal_daftar: '2026-08-09', status: 'Diterima' },
  { id: '22', peserta: 'Yuni Astuti', jenis: 'Individu', nama_tim: null, lomba: 'Makan Kerupuk', no_telp: '+628 – 6666 – 7777 – 888', tanggal_daftar: '2026-08-08', status: 'Diterima' },
  { id: '23', peserta: 'Hendra Kusuma', jenis: 'Individu', nama_tim: null, lomba: 'Memasukkan Paku', no_telp: '+628 – 7777 – 8888 – 999', tanggal_daftar: '2026-08-08', status: 'Diterima' },
  { id: '24', peserta: 'Sri Wahyuni', jenis: 'Individu', nama_tim: null, lomba: 'Balap Karung', no_telp: '+628 – 8888 – 9999 – 000', tanggal_daftar: '2026-08-08', status: 'Diterima' },
  { id: '25', peserta: 'Dani Firmansyah', jenis: 'Individu', nama_tim: null, lomba: 'Catur', no_telp: '+628 – 9999 – 0000 – 111', tanggal_daftar: '2026-08-07', status: 'Diterima' },
];

const lombaQuotas: LombaQuota[] = [
  { id: 'mewarnai', nama: 'Mewarnai', terdaftar: 9, kapasitas: 10, jenis: 'peserta' },
  { id: 'makan-kerupuk', nama: 'Makan Kerupuk', terdaftar: 10, kapasitas: 10, jenis: 'peserta' },
  { id: 'futsal-sarung', nama: 'Futsal Sarung', terdaftar: 6, kapasitas: 10, jenis: 'regu' },
  { id: 'balap-karung', nama: 'Balap Karung', terdaftar: 18, kapasitas: 24, jenis: 'peserta' },
  { id: 'catur', nama: 'Catur', terdaftar: 12, kapasitas: 12, jenis: 'peserta' },
  { id: 'memasukkan-paku', nama: 'Memasukkan Paku', terdaftar: 11, kapasitas: 16, jenis: 'peserta' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 6;

function formatTanggal(dateStr: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${dateStr}T00:00:00Z`));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RegistrationStatus }) {
  const styles: Record<RegistrationStatus, string> = {
    // orange/amber pill — matches mockup "Menunggu"
    Menunggu: 'bg-secondary-100 text-secondary-700',
    // green pill — matches mockup "Diterima"
    Diterima: 'bg-[#D1FAE5] text-[#047857]',
    // pink-red pill — matches mockup "Ditolak"
    Ditolak: 'bg-primary-100 text-primary-700',
    // neutral pill — matches mockup "Dibatalkan"
    Dibatalkan: 'bg-neutral-100 text-neutral-600',
  };
  return (
    <span className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold ${styles[status] ?? 'bg-neutral-100 text-neutral-600'}`}>
      {status}
    </span>
  );
}

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: FilterTab;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 rounded-xl px-4 text-sm font-semibold transition-colors ${
        active
          // light pink bg + red text — exactly like mockup
          ? 'bg-primary-100 text-primary-700'
          : 'border border-neutral-200 bg-white text-neutral-500 hover:border-primary-200 hover:text-primary-700'
      }`}
    >
      {label}
    </button>
  );
}

function QuotaBar({ quota }: { quota: LombaQuota }) {
  const percentage = Math.min(100, Math.round((quota.terdaftar / quota.kapasitas) * 100));
  const isFull = percentage >= 100;
  const isAlmostFull = percentage >= 80;
  const barColor = isFull ? 'bg-primary-600' : isAlmostFull ? 'bg-primary-500' : 'bg-primary-400';
  const textColor = isFull ? 'text-primary-700' : isAlmostFull ? 'text-primary-600' : 'text-primary-500';

  return (
    <article className="rounded-xl border border-primary-100 bg-white p-4 shadow-[0_2px_8px_rgba(34,24,24,0.04)] transition hover:border-primary-200 hover:shadow-sm">
      <div className="mb-3">
        <h3 className="font-semibold text-neutral-900 text-sm">{quota.nama}</h3>
        <p className={`mt-0.5 text-sm font-semibold ${textColor}`}>
          {quota.terdaftar} / {quota.kapasitas} {quota.jenis}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isFull && (
        <p className="mt-2 text-[11px] font-semibold text-primary-600">Kuota penuh</p>
      )}
    </article>
  );
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmClass,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/40"
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-neutral-100 bg-white p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); onClose(); }}
            className={`min-h-10 rounded-xl px-4 text-sm font-semibold text-white transition ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type DialogState =
  | { type: 'terima'; id: string }
  | { type: 'tolak'; id: string }
  | { type: 'batalkan'; id: string }
  | null;

export function RegistrationManagement({
  role,
  userName,
}: {
  role: 'admin' | 'panitia';
  userName: string;
}) {
  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations);
  const [quotas, setQuotas] = useState<LombaQuota[]>(lombaQuotas);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('Semua');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    getManagementPendaftaran({ role }, controller.signal)
      .then((res) => {
        if (res.data.registrations) {
          setRegistrations(res.data.registrations);
        }
        if (res.data.quotas && res.data.quotas.length > 0) {
          setQuotas(res.data.quotas);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(err instanceof Error ? err.message : 'Pendaftaran gagal dimuat.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [role]);

  // ── Metrics
  const total = registrations.length;
  const menunggu = registrations.filter((r) => r.status === 'Menunggu').length;
  const diterima = registrations.filter((r) => r.status === 'Diterima').length;
  const ditolak = registrations.filter((r) => r.status === 'Ditolak').length;
  const dibatalkan = registrations.filter((r) => r.status === 'Dibatalkan').length;

  const metrics = [
    { label: 'Total pendaftar', value: total },
    { label: 'Menunggu keputusan', value: menunggu },
    { label: 'Diterima', value: diterima },
    { label: 'Ditolak / Batal', value: ditolak + dibatalkan },
  ];

  // ── Filter + search
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('id-ID');
    return registrations.filter((r) => {
      const matchTab = activeTab === 'Semua' || r.status === activeTab;
      const matchQuery =
        !q ||
        r.peserta.toLocaleLowerCase('id-ID').includes(q) ||
        r.lomba.toLocaleLowerCase('id-ID').includes(q) ||
        (r.nama_tim?.toLocaleLowerCase('id-ID').includes(q) ?? false);
      return matchTab && matchQuery;
    });
  }, [registrations, activeTab, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // ── Actions
  async function handleUpdateStatus(id: string, status: 'Diterima' | 'Ditolak') {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await updateRegistrationStatus(id, { status }, role);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
      setDialog(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Gagal memperbarui status pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateStatus(id: string, status: RegistrationStatus) {
    if (status === 'Diterima' || status === 'Ditolak') {
      void handleUpdateStatus(id, status);
    } else {
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      );
    }
  }

  function handleTabChange(tab: FilterTab) {
    setActiveTab(tab);
    setPage(1);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  // ── Pagination helpers
  function getPaginationPages(): (number | '…')[] {
    if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1);
    const pages: (number | '…')[] = [1];
    if (currentPage > 3) pages.push('…');
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(pageCount - 1, currentPage + 1); p++) pages.push(p);
    if (currentPage < pageCount - 2) pages.push('…');
    pages.push(pageCount);
    return pages;
  }

  const dialogReg = dialog ? registrations.find((r) => r.id === dialog.id) : null;

  return (
    <ManagementLayout role={role} userName={userName} title="Kelola Pendaftaran" activeItem="registrations">
      {loadError && (
        <p role="alert" className="mb-5 rounded-xl bg-error-10 px-4 py-3 text-sm text-error-100">
          Pembaruan data pendaftaran gagal: {loadError}
        </p>
      )}
      {actionError && (
        <div role="alert" className="mb-5 flex items-center justify-between rounded-xl bg-error-10 px-4 py-3 text-sm text-error-100">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="font-bold">×</button>
        </div>
      )}
      {/* ── Page header */}
      <section className="mb-7 sm:mb-8">
        <p className="mb-1 text-sm font-medium text-primary-600">Ruang Panitia</p>
        <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">
          Kelola Pendaftaran
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Tinjau, terima, atau tolak pendaftaran peserta untuk setiap lomba.
        </p>
      </section>

      {/* ── Metric cards */}
      <section
        aria-label="Ringkasan pendaftaran"
        className="mb-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_3px_16px_rgba(34,24,24,0.025)] lg:grid-cols-4"
      >
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`flex min-h-[96px] flex-col justify-center px-5 py-5 sm:px-7 ${
              index > 0 ? 'border-l border-primary-100' : ''
            } ${index > 1 ? 'border-t border-primary-100 lg:border-t-0' : ''}`}
          >
            <p className="text-xs font-medium text-neutral-500">
              {metric.label}
            </p>
            <p className="mt-1.5 text-[32px] font-semibold leading-none tracking-tight text-neutral-900">
              {metric.value}
            </p>
          </div>
        ))}
      </section>

      {/* ── Registration table */}
      <section
        aria-labelledby="reg-table-title"
        className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_3px_16px_rgba(34,24,24,0.025)]"
      >
        <h2 id="reg-table-title" className="sr-only">
          Daftar pendaftaran
        </h2>

        {/* Filters row */}
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:p-5">
          {/* Tab filters */}
          <div className="flex flex-wrap gap-2">
            {(['Semua', 'Menunggu', 'Diterima', 'Ditolak', 'Dibatalkan'] as FilterTab[]).map((tab) => (
              <FilterTab
                key={tab}
                label={tab}
                active={activeTab === tab}
                onClick={() => handleTabChange(tab)}
              />
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-[460px]">
            <label htmlFor="reg-search" className="sr-only">
              Cari nama peserta atau regu
            </label>
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400"
            />
            <input
              id="reg-search"
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Cari nama peserta atau regu"
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-primary-400 focus:ring-3 focus:ring-primary-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead className="bg-neutral-50 text-xs font-semibold text-neutral-500">
              <tr>
                {['Peserta/regu', 'Lomba', 'No. Telp', 'Tanggal Daftar', 'Status', 'Aksi'].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-4 py-3.5 first:pl-5 last:pr-5"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {pageItems.map((reg) => (
                <tr key={reg.id} className="group hover:bg-primary-50/40">
                  {/* Peserta / regu */}
                  <td className="px-4 py-3.5 pl-5">
                    <p className="text-sm font-semibold text-neutral-900">{reg.peserta}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {reg.nama_tim ? reg.nama_tim : reg.jenis}
                    </p>
                  </td>

                  {/* Lomba */}
                  <td className="px-4 py-3.5 text-sm text-neutral-600">{reg.lomba}</td>

                  {/* No. Telp */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-500">
                    {reg.no_telp}
                  </td>

                  {/* Tanggal */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-500">
                    {formatTanggal(reg.tanggal_daftar)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusBadge status={reg.status} />
                  </td>

                  {/* Aksi */}
                  <td className="px-4 py-3.5 pr-5">
                    <div className="flex items-center gap-1.5">
                      {reg.status === 'Menunggu' ? (
                        <>
                          {/* Accept */}
                          <button
                            type="button"
                            aria-label={`Terima pendaftaran ${reg.peserta}`}
                            onClick={() => setDialog({ type: 'terima', id: reg.id })}
                            className="flex size-8 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-500 transition hover:bg-primary-50"
                            title="Terima"
                          >
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                              <path d="m7 12 3.5 3.5L17 8" />
                            </svg>
                          </button>

                          {/* Reject */}
                          <button
                            type="button"
                            aria-label={`Tolak pendaftaran ${reg.peserta}`}
                            onClick={() => setDialog({ type: 'tolak', id: reg.id })}
                            className="flex size-8 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-500 transition hover:bg-primary-50"
                            title="Tolak"
                          >
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                              <path d="m9 9 6 6" />
                              <path d="m15 9-6 6" />
                            </svg>
                          </button>

                          {/* More dots */}
                          <div className="relative">
                            <button
                              type="button"
                              aria-label={`Aksi lainnya untuk ${reg.peserta}`}
                              onClick={() =>
                                setOpenMenuId((prev) => (prev === reg.id ? null : reg.id))
                              }
                              className="flex size-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                            >
                              <Icon name="dots" className="size-4" />
                            </button>
                            {openMenuId === reg.id && (
                              <div className="absolute top-full right-0 z-20 mt-1 w-40 rounded-xl border border-neutral-100 bg-white p-1.5 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setDialog({ type: 'batalkan', id: reg.id });
                                  }}
                                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                                >
                                  Batalkan
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-neutral-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-neutral-50 text-neutral-400">
                      <Icon name="search" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-neutral-800">
                      Tidak ada pendaftaran ditemukan
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Coba kata kunci atau filter tab yang berbeda.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-3.5 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p aria-live="polite">
            Menampilkan{' '}
            {filtered.length
              ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                  currentPage * PAGE_SIZE,
                  filtered.length,
                )}`
              : 0}{' '}
            dari {filtered.length} peserta
          </p>
          <nav aria-label="Navigasi halaman pendaftaran" className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Halaman sebelumnya"
              className="flex size-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-100 disabled:cursor-not-allowed disabled:text-neutral-300"
            >
              <Icon name="chevron" className="size-4 rotate-180" />
            </button>

            {getPaginationPages().map((item, idx) =>
              item === '…' ? (
                <span key={`ellipsis-${idx}`} className="flex size-8 items-center justify-center text-neutral-400">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  aria-current={currentPage === item ? 'page' : undefined}
                  onClick={() => setPage(item as number)}
                  className={`size-8 rounded-lg text-xs font-semibold ${
                    currentPage === item
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              aria-label="Halaman berikutnya"
              className="flex size-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-100 disabled:cursor-not-allowed disabled:text-neutral-300"
            >
              <Icon name="chevron" className="size-4" />
            </button>
          </nav>
        </div>
      </section>

      {/* ── Rekapitulasi Kuota */}
      <section aria-labelledby="quota-title" className="mt-9 sm:mt-11">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-primary-600">Pantau kapasitas</p>
            <h2
              id="quota-title"
              className="text-[22px] font-semibold tracking-tight text-neutral-900 sm:text-[26px]"
            >
              Rekapitulasi Kuota Lomba
            </h2>
          </div>
          <a
            href="/dashboard/lomba"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            Lihat semua lomba
            <Icon name="arrow" className="size-4" />
          </a>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quotas.map((quota) => (
            <QuotaBar key={quota.id} quota={quota} />
          ))}
        </div>
      </section>

      {/* ── Confirm dialogs */}
      {dialog?.type === 'terima' && dialogReg && (
        <ConfirmModal
          title="Terima Pendaftaran"
          description={`Konfirmasi penerimaan pendaftaran ${dialogReg.peserta} untuk lomba ${dialogReg.lomba}?`}
          confirmLabel={isSubmitting ? 'Memproses…' : 'Ya, Terima'}
          confirmClass="bg-success-100 hover:bg-success-200"
          onConfirm={() => void handleUpdateStatus(dialog.id, 'Diterima')}
          onClose={() => { if (!isSubmitting) setDialog(null); }}
        />
      )}
      {dialog?.type === 'tolak' && dialogReg && (
        <ConfirmModal
          title="Tolak Pendaftaran"
          description={`Apakah Anda yakin ingin menolak pendaftaran ${dialogReg.peserta} untuk lomba ${dialogReg.lomba}?`}
          confirmLabel={isSubmitting ? 'Memproses…' : 'Ya, Tolak'}
          confirmClass="bg-error-100 hover:bg-error-100/90"
          onConfirm={() => void handleUpdateStatus(dialog.id, 'Ditolak')}
          onClose={() => { if (!isSubmitting) setDialog(null); }}
        />
      )}
      {dialog?.type === 'batalkan' && dialogReg && (
        <ConfirmModal
          title="Batalkan Pendaftaran"
          description={`Batalkan pendaftaran ${dialogReg.peserta} untuk lomba ${dialogReg.lomba}? Status pendaftaran akan ditolak.`}
          confirmLabel={isSubmitting ? 'Memproses…' : 'Ya, Batalkan'}
          confirmClass="bg-error-100 hover:bg-error-200"
          onConfirm={() => void handleUpdateStatus(dialog.id, 'Ditolak')}
          onClose={() => { if (!isSubmitting) setDialog(null); }}
        />
      )}

      {/* Close menu on outside click */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenMenuId(null)}
          aria-hidden="true"
        />
      )}
    </ManagementLayout>
  );
}
