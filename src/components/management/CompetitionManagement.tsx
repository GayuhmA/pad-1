'use client';

import { Fragment, useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  DashboardCardGridSkeleton,
  DashboardMetricSkeleton,
  DashboardSkeletonFrame,
  DashboardTableSkeleton,
} from '@/components/management/DashboardLoadingSkeleton';
import { Icon, ManagementLayout } from '@/components/management/ManagementDashboard';
import { Modal } from '@/components/Modal';
import {
  archiveManagementLomba,
  createManagementLomba,
  deleteManagementLomba,
  getManagementLomba,
  restoreManagementLomba,
  updateManagementLomba,
} from '@/lib/api/management-lomba';
import type {
  CompetitionStatus,
  LombaCategoryOption,
  ManagementArchivedCompetition,
  ManagementCompetition,
  ManagementLombaStatistik,
  RegistrationOpenStatus,
  SaveManagementLombaInput,
} from '@/types/management-lomba';

interface CompetitionForm {
  name: string;
  kind: 'Individu' | 'Beregu';
  idKategori: string;
  registrationStatus: RegistrationOpenStatus;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: string;
  teamMemberLimit: string;
}

const DEFAULT_CATEGORIES: LombaCategoryOption[] = [
  { id_kategori: 1, nama_kategori: 'Dewasa' },
  { id_kategori: 2, nama_kategori: 'Umum' },
  { id_kategori: 3, nama_kategori: 'Anak-anak' },
];

const PAGE_SIZE = 5;

function currentJakartaDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function emptyForm(categories: LombaCategoryOption[]): CompetitionForm {
  const defaultCat = categories.find((c) => c.nama_kategori === 'Umum') ?? categories[0];
  return {
    name: '',
    kind: 'Individu',
    idKategori: defaultCat ? String(defaultCat.id_kategori) : '2',
    registrationStatus: 'Dibuka',
    description: '',
    date: currentJakartaDate(),
    startTime: '08:00',
    endTime: '10:00',
    location: '',
    capacity: '',
    teamMemberLimit: '5',
  };
}

function formFromCompetition(
  item: ManagementCompetition,
  categories: LombaCategoryOption[],
): CompetitionForm {
  const matchedCategory = item.id_kategori
    ?? categories.find((c) => c.nama_kategori.toLowerCase() === item.category.toLowerCase())?.id_kategori
    ?? categories[0]?.id_kategori
    ?? 2;

  return {
    name: item.name,
    kind: item.kind === 'Regu' ? 'Beregu' : 'Individu',
    idKategori: String(matchedCategory),
    registrationStatus: item.registrationStatus,
    description: item.description ?? '',
    date: item.date,
    startTime: item.startTime,
    endTime: item.endTime,
    location: item.location === 'Belum ditentukan' ? '' : item.location,
    capacity: item.capacity !== null ? String(item.capacity) : '',
    teamMemberLimit: item.teamMemberLimit !== null ? String(item.teamMemberLimit) : '5',
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatTime(time: string) {
  return time.replace(':', '.');
}

function StatusBadge({ status }: { status: CompetitionStatus }) {
  const classes = status === 'Berlangsung'
    ? 'bg-primary-100/75 text-primary-700'
    : status === 'Mendatang'
      ? 'bg-secondary-100 text-secondary-700'
      : 'bg-success-10 text-success-200';
  return (
    <span className={`inline-flex whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${classes}`}>
      {status}
    </span>
  );
}

function Capacity({ item }: { item: ManagementCompetition }) {
  const unit = item.kind === 'Regu' ? 'regu' : 'peserta';
  if (item.capacity === null) {
    return (
      <div className="min-w-28">
        <p className="text-xs font-semibold text-neutral-700">{item.registered} {unit}</p>
        <p className="mt-1 text-[11px] text-neutral-400">Kuota tidak dibatasi</p>
      </div>
    );
  }
  const percentage = Math.min(100, Math.round((item.registered / item.capacity) * 100));
  return (
    <div className="min-w-28">
      <p className="text-xs font-semibold text-neutral-700">{item.registered} / {item.capacity} {unit}</p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full ${percentage >= 90 ? 'bg-primary-600' : 'bg-primary-400'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CompetitionFormModal({
  initialValue,
  categories,
  title,
  saving,
  error,
  onClose,
  onSave,
}: {
  initialValue: CompetitionForm;
  categories: LombaCategoryOption[];
  title: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (value: CompetitionForm) => void;
}) {
  const [form, setForm] = useState(initialValue);
  const inputClass =
    'h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 outline-none transition focus:border-primary-400 focus:ring-3 focus:ring-primary-100';

  return (
    <Modal isOpen onClose={saving ? () => undefined : onClose} ariaLabel={title}>
      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onSave(form);
        }}
        className="p-5 sm:p-7"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">Manajemen lomba</p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-900">{title}</h2>
            <p className="mt-1 text-sm text-neutral-500">Lengkapi informasi utama, kategori, kuota, dan jadwal pelaksanaan.</p>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-neutral-700">Nama lomba <span className="text-error-100">*</span></span>
            <input
              autoFocus
              required
              maxLength={100}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Contoh: Tarik Tambang"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Jenis pendaftaran <span className="text-error-100">*</span></span>
            <select
              value={form.kind}
              onChange={(event) => setForm({ ...form, kind: event.target.value as 'Individu' | 'Beregu' })}
              className={inputClass}
            >
              <option value="Individu">Individu</option>
              <option value="Beregu">Beregu / Tim</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Kategori <span className="text-error-100">*</span></span>
            <select
              required
              value={form.idKategori}
              onChange={(event) => setForm({ ...form, idKategori: event.target.value })}
              className={inputClass}
            >
              {categories.map((cat) => (
                <option key={cat.id_kategori} value={String(cat.id_kategori)}>
                  {cat.nama_kategori}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Tanggal pelaksanaan <span className="text-error-100">*</span></span>
            <input
              required
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Lokasi <span className="text-error-100">*</span></span>
            <input
              required
              maxLength={120}
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              placeholder="Contoh: Lapangan Utama"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Waktu mulai <span className="text-error-100">*</span></span>
            <input
              required
              type="time"
              value={form.startTime}
              onChange={(event) => setForm({ ...form, startTime: event.target.value })}
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Waktu selesai <span className="text-error-100">*</span></span>
            <input
              required
              type="time"
              value={form.endTime}
              onChange={(event) => setForm({ ...form, endTime: event.target.value })}
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">
              Kuota {form.kind === 'Beregu' ? 'regu' : 'peserta'} <span className="text-xs font-normal text-neutral-400">(opsional)</span>
            </span>
            <input
              type="number"
              min="1"
              max="500"
              value={form.capacity}
              onChange={(event) => setForm({ ...form, capacity: event.target.value })}
              placeholder="Kosongkan jika tanpa batas"
              className={inputClass}
            />
          </label>

          {form.kind === 'Beregu' ? (
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">Batas anggota per regu</span>
              <input
                type="number"
                min="1"
                max="50"
                value={form.teamMemberLimit}
                onChange={(event) => setForm({ ...form, teamMemberLimit: event.target.value })}
                placeholder="Contoh: 5"
                className={inputClass}
              />
            </label>
          ) : (
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">Status pendaftaran</span>
              <select
                value={form.registrationStatus}
                onChange={(event) => setForm({ ...form, registrationStatus: event.target.value as RegistrationOpenStatus })}
                className={inputClass}
              >
                <option value="Dibuka">Dibuka</option>
                <option value="Ditutup">Ditutup</option>
              </select>
            </label>
          )}

          {form.kind === 'Beregu' && (
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-neutral-700">Status pendaftaran</span>
              <select
                value={form.registrationStatus}
                onChange={(event) => setForm({ ...form, registrationStatus: event.target.value as RegistrationOpenStatus })}
                className={inputClass}
              >
                <option value="Dibuka">Dibuka</option>
                <option value="Ditutup">Ditutup</option>
              </select>
            </label>
          )}

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-neutral-700">Deskripsi lomba</span>
            <textarea
              rows={3}
              maxLength={500}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Contoh: Perlombaan dalam rangka HUT RI ke-81."
              className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-400 focus:ring-3 focus:ring-primary-100"
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
            {error}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="min-h-11 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
          >
            <Icon name="check" className="size-4" />
            {saving ? 'Menyimpan…' : 'Simpan lomba'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function CompetitionManagement({ role, userName }: { role: 'admin' | 'panitia'; userName: string }) {
  const [competitions, setCompetitions] = useState<ManagementCompetition[]>([]);
  const [archived, setArchived] = useState<ManagementArchivedCompetition[]>([]);
  const [categories, setCategories] = useState<LombaCategoryOption[]>(DEFAULT_CATEGORIES);
  const [stats, setStats] = useState<ManagementLombaStatistik>({
    total_lomba: 0,
    lomba_berlangsung: 0,
    lomba_mendatang: 0,
    lomba_selesai: 0,
  });

  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [archiveQuery, setArchiveQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua Status' | CompetitionStatus>('Semua Status');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [dialog, setDialog] = useState<{ mode: 'create' } | { mode: 'edit'; item: ManagementCompetition } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id_lomba: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const closeDialog = useCallback(() => {
    if (!saving) {
      setDialog(null);
      setFormError(null);
    }
  }, [saving]);

  const reload = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const response = await getManagementLomba(role);
      setCompetitions(response.data.competitions ?? []);
      setArchived(response.data.archived ?? []);
      if (response.data.categories?.length) setCategories(response.data.categories);
      if (response.data.statistik) setStats(response.data.statistik);
      setHasLoaded(true);
      setLoadError(null);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Daftar lomba gagal dimuat.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    const controller = new AbortController();
    getManagementLomba(role, controller.signal)
      .then((response) => {
        setCompetitions(response.data.competitions ?? []);
        setArchived(response.data.archived ?? []);
        if (response.data.categories?.length) setCategories(response.data.categories);
        if (response.data.statistik) setStats(response.data.statistik);
        setHasLoaded(true);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(err instanceof Error ? err.message : 'Daftar lomba gagal dimuat.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [role]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5_000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredCompetitions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('id-ID');
    return competitions.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [item.name, item.category, item.location, item.kind].some((value) =>
          value.toLocaleLowerCase('id-ID').includes(normalizedQuery),
        );
      return matchesQuery && (statusFilter === 'Semua Status' || item.status === statusFilter);
    });
  }, [competitions, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredCompetitions.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filteredCompetitions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const initialForm: CompetitionForm = dialog?.mode === 'edit'
    ? formFromCompetition(dialog.item, categories)
    : emptyForm(categories);

  const filteredArchive = archived.filter((item) =>
    [item.name, item.category, item.location].some((value) =>
      value.toLocaleLowerCase('id-ID').includes(archiveQuery.trim().toLocaleLowerCase('id-ID')),
    ),
  );

  async function saveCompetition(value: CompetitionForm) {
    if (!dialog || saving) return;
    if (value.endTime <= value.startTime) {
      setFormError('Waktu selesai harus setelah waktu mulai.');
      return;
    }

    const payload: SaveManagementLombaInput = {
      id_kategori: Number(value.idKategori),
      nama_lomba: value.name.trim(),
      jenis_pendaftaran: value.kind,
      status: value.registrationStatus,
      ...(value.description.trim() ? { deskripsi: value.description.trim() } : {}),
      kapasitas_peserta: value.capacity.trim() ? Number(value.capacity) : null,
      batas_anggota_tim:
        value.kind === 'Beregu' && value.teamMemberLimit.trim()
          ? Number(value.teamMemberLimit)
          : null,
      jadwal: [
        {
          tanggal: value.date,
          waktu_mulai: value.startTime,
          waktu_selesai: value.endTime,
          lokasi: value.location.trim(),
        },
      ],
    };

    setSaving(true);
    setFormError(null);
    setActionError(null);
    try {
      const res = dialog.mode === 'create'
        ? await createManagementLomba(payload)
        : await updateManagementLomba(dialog.item.id_lomba, payload);
      const fallbackMsg = dialog.mode === 'create'
        ? 'Lomba berhasil ditambahkan.'
        : 'Lomba berhasil diperbarui.';
      if (res.data?.status && res.data.status !== payload.status) {
        setToast(null);
        setActionError(
          `${dialog.mode === 'create' ? 'Lomba ditambahkan' : 'Perubahan data lain tersimpan'}, namun backend masih mempertahankan status pendaftaran "${res.data.status}" (belum menerapkan "${payload.status}").`,
        );
      } else {
        setToast(res.message || fallbackMsg);
      }
      setDialog(null);
      setPage(1);
      await reload(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Lomba gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(item: ManagementCompetition) {
    if (busyId !== null) return;
    setBusyId(item.id_lomba);
    setActionError(null);
    try {
      const res = await archiveManagementLomba(item.id_lomba);
      if (expandedId === item.id) setExpandedId(null);
      setToast(res.message || `${item.name} berhasil diarsipkan.`);
      await reload(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Gagal mengarsipkan lomba.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRestore(item: ManagementArchivedCompetition) {
    if (busyId !== null) return;
    setBusyId(item.id_lomba);
    setActionError(null);
    try {
      const res = await restoreManagementLomba(item.id_lomba);
      setToast(res.message || `${item.name} berhasil dipulihkan.`);
      await reload(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Gagal memulihkan lomba.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await deleteManagementLomba(deleteTarget.id_lomba);
      setDeleteTarget(null);
      setToast(res.message || 'Lomba berhasil dihapus.');
      await reload(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Gagal menghapus lomba.');
    } finally {
      setDeleting(false);
    }
  }

  const metrics = [
    { label: 'Total Lomba', value: stats.total_lomba },
    { label: 'Lomba Berlangsung', value: stats.lomba_berlangsung },
    { label: 'Lomba Mendatang', value: stats.lomba_mendatang },
    { label: 'Lomba Selesai', value: stats.lomba_selesai },
  ];

  return (
    <ManagementLayout role={role} userName={userName} title="Kelola Lomba" activeItem="competitions">
      {loadError && (
        <div role="alert" className="mb-5 flex items-center justify-between gap-4 rounded-xl bg-error-10 px-4 py-3 text-sm text-error-100">
          <span>Pembaruan data lomba gagal: {loadError}</span>
          <button
            type="button"
            onClick={() => void reload(true)}
            className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700"
          >
            Muat Ulang
          </button>
        </div>
      )}

      {toast && (
        <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Tutup notifikasi" className="rounded p-1 text-green-700/70 hover:text-green-900">
            <Icon name="close" className="size-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} aria-label="Tutup pesan" className="rounded p-1 text-primary-700/70 hover:text-primary-900">
            <Icon name="close" className="size-4" />
          </button>
        </div>
      )}

      <section className="mb-7 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
        <div>
          <p className="mb-1 text-sm font-medium text-primary-600">Ruang {role === 'admin' ? 'Admin' : 'Panitia'}</p>
          <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">Kelola Lomba</h1>
          <p className="mt-2 text-sm text-neutral-500">Atur lomba, kuota peserta, jadwal, dan arsip perlombaan.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setDialog({ mode: 'create' });
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:px-5"
        >
          <span className="text-xl leading-none">+</span>
          Tambah Lomba
        </button>
      </section>

      {loading && !hasLoaded ? (
        <DashboardSkeletonFrame label="Memuat data lomba…">
          <DashboardMetricSkeleton count={4} merged />
          <DashboardTableSkeleton columns={7} rows={5} tabCount={0} hasSelectFilter />
          <DashboardCardGridSkeleton titleWidth="w-40" cards={4} gridClass="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" />
        </DashboardSkeletonFrame>
      ) : hasLoaded ? (
        <>
          <section aria-label="Ringkasan lomba" className="mb-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_3px_16px_rgba(34,24,24,0.025)] lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`flex min-h-[88px] items-center gap-3 px-4 py-4 sm:px-6 ${index > 0 ? 'border-l border-primary-100' : ''} ${index > 1 ? 'border-t border-primary-100 lg:border-t-0' : ''}`}
              >
                <p className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[30px]">{metric.value}</p>
                <p className="text-xs leading-5 text-neutral-500 sm:text-sm">{metric.label}</p>
              </div>
            ))}
          </section>

          <section aria-labelledby="active-competitions-title" className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_3px_16px_rgba(34,24,24,0.025)]">
            <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="relative w-full sm:max-w-[420px]">
                <label htmlFor="competition-search" className="sr-only">Cari lomba aktif</label>
                <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400" />
                <input
                  id="competition-search"
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari nama, kategori, atau lokasi lomba"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-primary-400 focus:ring-3 focus:ring-primary-100"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-500">
                <span className="sr-only">Filter status lomba</span>
                <Icon name="filter" className="size-4" />
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as typeof statusFilter);
                    setPage(1);
                  }}
                  className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 outline-none focus:border-primary-400"
                >
                  <option>Semua Status</option>
                  <option>Berlangsung</option>
                  <option>Mendatang</option>
                  <option>Selesai</option>
                </select>
              </label>
            </div>

            <h2 id="active-competitions-title" className="sr-only">Daftar lomba</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[990px] border-collapse text-left">
                <thead className="bg-neutral-50 text-xs font-semibold text-neutral-600">
                  <tr>
                    {['Lomba', 'Kategori', 'Jadwal', 'Lokasi', 'Kuota', 'Status', 'Aksi'].map((heading) => (
                      <th key={heading} scope="col" className="px-4 py-3.5 first:pl-5 last:pr-5">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100/80">
                  {pageItems.map((item) => (
                    <Fragment key={item.id}>
                      <tr className="group hover:bg-primary-100/15">
                        <td className="px-4 py-4 pl-5">
                          <button
                            type="button"
                            aria-expanded={expandedId === item.id}
                            onClick={() => setExpandedId((current) => (current === item.id ? null : item.id))}
                            className="text-left"
                          >
                            <span className="block text-sm font-semibold text-neutral-900 hover:text-primary-700">{item.name}</span>
                            <span className="mt-0.5 block text-xs text-neutral-400">
                              {item.kind} · {item.registrationStatus}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-600">{item.category}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-neutral-600">
                          {formatDate(item.date)} · {formatTime(item.startTime)}–{formatTime(item.endTime)}
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-600">{item.location}</td>
                        <td className="px-4 py-4"><Capacity item={item} /></td>
                        <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                        <td className="px-4 py-4 pr-5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={busyId === item.id_lomba}
                              onClick={() => {
                                setFormError(null);
                                setDialog({ mode: 'edit', item });
                              }}
                              className="rounded-lg px-2.5 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-100/60 focus-visible:outline-2 focus-visible:outline-primary-600 disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <details className="group/menu relative">
                              <summary
                                aria-label={`Aksi lainnya untuk ${item.name}`}
                                className="flex size-9 cursor-pointer list-none items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary-600"
                              >
                                <Icon name="dots" />
                              </summary>
                              <div className="absolute top-full right-0 z-20 mt-1 w-44 rounded-xl border border-neutral-100 bg-white p-1.5 shadow-lg">
                                <button
                                  type="button"
                                  disabled={busyId === item.id_lomba}
                                  onClick={(event) => {
                                    event.currentTarget.closest('details')?.removeAttribute('open');
                                    void handleArchive(item);
                                  }}
                                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                                >
                                  {busyId === item.id_lomba ? 'Memproses…' : 'Arsipkan lomba'}
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === item.id_lomba}
                                  onClick={(event) => {
                                    event.currentTarget.closest('details')?.removeAttribute('open');
                                    setActionError(null);
                                    setDeleteTarget({ id_lomba: item.id_lomba, name: item.name });
                                  }}
                                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-primary-600 hover:bg-primary-50 disabled:opacity-50"
                                >
                                  Hapus lomba
                                </button>
                              </div>
                            </details>
                          </div>
                        </td>
                      </tr>
                      {expandedId === item.id && item.matches.length > 0 && (
                        <tr className="bg-white">
                          <td colSpan={7} className="px-4 pb-4 pt-1 sm:px-5">
                            <div className="overflow-x-auto rounded-xl border border-neutral-100">
                              <table className="w-full min-w-[640px] text-left">
                                <thead className="bg-neutral-50 text-xs font-semibold text-neutral-500">
                                  <tr>
                                    <th scope="col" className="px-3 py-2.5">Tim 1</th>
                                    <th scope="col" className="px-3 py-2.5">Tim 2</th>
                                    <th scope="col" className="px-3 py-2.5">Waktu</th>
                                    <th scope="col" className="px-3 py-2.5">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                  {item.matches.map((match, index) => (
                                    <tr key={`${match.time}-${index}`} className="text-xs text-neutral-700">
                                      <td className="px-3 py-3 font-medium">{match.teamOne}</td>
                                      <td className="px-3 py-3 font-medium">{match.teamTwo}</td>
                                      <td className="px-3 py-3">{match.time}</td>
                                      <td className="px-3 py-3"><StatusBadge status={match.status} /></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-14 text-center">
                        <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-neutral-50 text-neutral-400">
                          <Icon name="search" />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-neutral-800">
                          {loading ? 'Memuat daftar lomba…' : 'Lomba tidak ditemukan'}
                        </p>
                        <p className="mt-1 text-sm text-neutral-500">
                          {loading ? 'Mohon tunggu sebentar.' : 'Coba kata kunci atau filter status yang berbeda.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-3.5 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p aria-live="polite">
                Menampilkan {filteredCompetitions.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
                {Math.min(currentPage * PAGE_SIZE, filteredCompetitions.length)} dari {filteredCompetitions.length} lomba
              </p>
              <nav aria-label="Navigasi halaman lomba" className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  aria-label="Halaman sebelumnya"
                  className="flex size-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-100 disabled:cursor-not-allowed disabled:text-neutral-300"
                >
                  <Icon name="chevron" className="size-4 rotate-180" />
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-current={currentPage === pageNumber ? 'page' : undefined}
                    onClick={() => setPage(pageNumber)}
                    className={`size-8 rounded-lg text-xs font-semibold ${
                      currentPage === pageNumber ? 'bg-primary-100 text-primary-700' : 'text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  aria-label="Halaman berikutnya"
                  className="flex size-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-100 disabled:cursor-not-allowed disabled:text-neutral-300"
                >
                  <Icon name="chevron" className="size-4" />
                </button>
              </nav>
            </div>
          </section>

          <section aria-labelledby="archive-title" className="mt-9 sm:mt-11">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-1 text-sm font-medium text-primary-600">Koleksi terarsip</p>
                <h2 id="archive-title" className="text-[22px] font-semibold tracking-tight text-neutral-900 sm:text-[26px]">
                  Arsip Lomba
                </h2>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-neutral-500">
                {archived.length} lomba diarsipkan
              </span>
            </div>

            <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-5">
              <div className="relative mb-4 max-w-[420px]">
                <label htmlFor="archive-search" className="sr-only">Cari lomba arsip</label>
                <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400" />
                <input
                  id="archive-search"
                  type="search"
                  value={archiveQuery}
                  onChange={(event) => setArchiveQuery(event.target.value)}
                  placeholder="Cari nama, kategori, atau lokasi lomba"
                  className="h-11 w-full rounded-xl border border-neutral-200 pl-11 pr-4 text-sm outline-none placeholder:text-neutral-400 focus:border-primary-400 focus:ring-3 focus:ring-primary-100"
                />
              </div>

              {filteredArchive.length ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {filteredArchive.map((item) => (
                    <article key={item.id} className="flex min-h-36 flex-col rounded-xl border border-neutral-200 p-4 transition hover:border-primary-200 hover:shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-neutral-900">{item.name}</h3>
                          <p className="mt-1 text-xs text-neutral-500">
                            {item.participantCount} pendaftar · {item.category}
                          </p>
                          <p className="mt-1 text-xs text-neutral-400">{item.location}</p>
                        </div>
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-400">
                          <Icon name="clock" className="size-4" />
                        </span>
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                        <button
                          type="button"
                          disabled={busyId === item.id_lomba}
                          onClick={() => {
                            setActionError(null);
                            setDeleteTarget({ id_lomba: item.id_lomba, name: item.name });
                          }}
                          className="text-xs font-medium text-neutral-400 hover:text-primary-600 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id_lomba}
                          onClick={() => void handleRestore(item)}
                          className="text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50"
                        >
                          {busyId === item.id_lomba ? 'Memulihkan…' : 'Pulihkan lomba'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
                  {archived.length === 0
                    ? 'Belum ada lomba yang diarsipkan.'
                    : 'Tidak ada arsip yang cocok dengan pencarian.'}
                </p>
              )}
            </div>
          </section>
        </>
      ) : null}

      {dialog && (
        <CompetitionFormModal
          key={dialog.mode === 'edit' ? dialog.item.id : 'create'}
          title={dialog.mode === 'edit' ? 'Edit Lomba' : 'Tambah Lomba'}
          initialValue={initialForm}
          categories={categories}
          saving={saving}
          error={formError}
          onClose={closeDialog}
          onSave={(value) => void saveCompetition(value)}
        />
      )}

      {deleteTarget && (
        <Modal
          isOpen
          onClose={() => {
            if (!deleting) setDeleteTarget(null);
          }}
          ariaLabel="Konfirmasi hapus lomba"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Hapus Lomba Secara Permanen?</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Lomba <strong>{deleteTarget.name}</strong> akan dihapus permanen. Jika hanya ingin menyembunyikan dari daftar aktif tanpa menghapus data pendaftaran, gunakan fitur <strong>Arsipkan lomba</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleConfirmDelete()}
                className="min-h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {deleting ? 'Menghapus…' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ManagementLayout>
  );
}
