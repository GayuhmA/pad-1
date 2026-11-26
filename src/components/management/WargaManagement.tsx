'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardWargaSkeleton } from '@/components/management/DashboardLoadingSkeleton';
import { Icon, ManagementLayout } from '@/components/management/ManagementDashboard';
import { Modal } from '@/components/Modal';
import { ApiRequestError } from '@/lib/api/client';
import {
  createAdminRt,
  createAdminWarga,
  deactivateAdminWarga,
  deleteAdminRt,
  getAdminWarga,
  updateAdminRt,
  updateAdminRw,
  updateAdminWarga,
} from '@/lib/api/management-admin';
import { STALE_TIME } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import type {
  AccountStatus,
  CreatedAccountInfo,
  GenderCode,
  RtItem,
  RwItem,
  WargaItem,
  WargaMetrics,
} from '@/types/management-admin';

type StatusTab = 'Semua' | AccountStatus;

interface WargaFormState {
  id_rt: string;
  nik: string;
  nama: string;
  jenis_kelamin: GenderCode;
  tempat_lahir: string;
  tanggal_lahir: string;
  no_hp: string;
  alamat: string;
  status: AccountStatus;
}

const PAGE_SIZE = 6;
const STATUS_TABS: StatusTab[] = ['Semua', 'Aktif', 'Nonaktif'];

const EMPTY_METRICS: WargaMetrics = {
  totalWarga: 0,
  aktifCount: 0,
  nonaktifCount: 0,
  totalRt: 0,
};

function emptyWargaForm(defaultRtId?: number): WargaFormState {
  return {
    id_rt: defaultRtId ? String(defaultRtId) : '',
    nik: '',
    nama: '',
    jenis_kelamin: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    no_hp: '',
    alamat: '',
    status: 'Aktif',
  };
}

function formFromWarga(item: WargaItem): WargaFormState {
  return {
    id_rt: item.id_rt ? String(item.id_rt) : '',
    nik: item.nik === '-' ? '' : item.nik,
    nama: item.nama,
    jenis_kelamin: item.jenis_kelamin,
    tempat_lahir: item.tempat_lahir ?? '',
    tanggal_lahir: item.tanggal_lahir ?? '',
    no_hp: item.no_hp ?? '',
    alamat: item.alamat ?? '',
    status: item.status,
  };
}

function formatBirth(place: string | null, date: string | null): string {
  const formattedDate = date
    ? new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`))
    : null;
  if (place && formattedDate) return `${place}, ${formattedDate}`;
  return place || formattedDate || '–';
}

function formatWilayah(warga: WargaItem): string {
  if (!warga.nomor_rt && !warga.nama_rt) return '–';
  const rtLabel = warga.nama_rt ?? `RT ${warga.nomor_rt}`;
  const rwLabel = warga.nama_rw ?? (warga.nomor_rw ? `RW ${warga.nomor_rw}` : null);
  return rwLabel ? `${rtLabel} / ${rwLabel}` : rtLabel;
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

function WargaFormModal({
  mode,
  initialValue,
  rtList,
  saving,
  error,
  onClose,
  onSubmit,
  onOpenWilayah,
}: {
  mode: 'create' | 'edit';
  initialValue: WargaFormState;
  rtList: RtItem[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (value: WargaFormState) => void;
  onOpenWilayah: () => void;
}) {
  const [form, setForm] = useState<WargaFormState>(initialValue);
  const inputClass =
    'h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 outline-none transition focus:border-primary-400 focus:ring-3 focus:ring-primary-100';

  return (
    <Modal isOpen onClose={saving ? () => undefined : onClose} ariaLabel={mode === 'create' ? 'Tambah data warga' : 'Ubah data warga'}>
      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onSubmit(form);
        }}
        className="p-5 sm:p-7"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">
              Data Kependudukan
            </p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-900">
              {mode === 'create' ? 'Tambah Data Warga' : 'Edit Data Warga'}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {mode === 'create'
                ? 'Menambahkan warga baru akan otomatis membuatkan akun login warga.'
                : 'Perbarui profil kependudukan atau status keaktifan warga.'}
            </p>
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
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="warga-rt" className="text-sm font-medium text-neutral-700">
                Wilayah RT <span className="text-error-100">*</span>
              </label>
              <button
                type="button"
                onClick={onOpenWilayah}
                className="text-xs font-semibold text-primary-600 hover:underline"
              >
                + Kelola RT
              </button>
            </div>
            <select
              id="warga-rt"
              required
              value={form.id_rt}
              onChange={(event) => setForm({ ...form, id_rt: event.target.value })}
              className={inputClass}
            >
              <option value="">Pilih wilayah RT</option>
              {rtList.map((rt) => (
                <option key={rt.id_rt} value={rt.id_rt}>
                  {rt.nama_rt}{rt.nama_rw ? ` · ${rt.nama_rw}` : rt.nomor_rw ? ` · RW ${rt.nomor_rw}` : ''}
                </option>
              ))}
            </select>
            {rtList.length === 0 && (
              <p className="text-xs text-amber-700">
                Belum ada data RT. Klik &ldquo;Atur RT / RW&rdquo; untuk menambahkan RT terlebih dahulu.
              </p>
            )}
          </div>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">
              NIK <span className="text-error-100">*</span>
            </span>
            <input
              required
              minLength={8}
              maxLength={20}
              inputMode="numeric"
              pattern="\d{8,20}"
              value={form.nik}
              onChange={(event) => setForm({ ...form, nik: event.target.value.replace(/\D/g, '') })}
              placeholder="Contoh: 3276010101900001"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">
              Nama Lengkap <span className="text-error-100">*</span>
            </span>
            <input
              required
              maxLength={150}
              value={form.nama}
              onChange={(event) => setForm({ ...form, nama: event.target.value })}
              placeholder="Contoh: Budi Santoso"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">
              Jenis Kelamin <span className="text-error-100">*</span>
            </span>
            <select
              value={form.jenis_kelamin}
              onChange={(event) => setForm({ ...form, jenis_kelamin: event.target.value as GenderCode })}
              className={inputClass}
            >
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Status Warga</span>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as AccountStatus })}
              className={inputClass}
            >
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Tempat Lahir</span>
            <input
              maxLength={100}
              value={form.tempat_lahir}
              onChange={(event) => setForm({ ...form, tempat_lahir: event.target.value })}
              placeholder="Contoh: Yogyakarta"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Tanggal Lahir</span>
            <input
              type="date"
              value={form.tanggal_lahir}
              onChange={(event) => setForm({ ...form, tanggal_lahir: event.target.value })}
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-neutral-700">Nomor HP / WhatsApp</span>
            <input
              maxLength={25}
              value={form.no_hp}
              onChange={(event) => setForm({ ...form, no_hp: event.target.value })}
              placeholder="Contoh: 081234567890"
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-neutral-700">Alamat</span>
            <textarea
              rows={2}
              maxLength={255}
              value={form.alamat}
              onChange={(event) => setForm({ ...form, alamat: event.target.value })}
              placeholder="Contoh: Jalan Melati No. 12"
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
            disabled={saving || rtList.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="check" className="size-4" />
            {saving ? 'Menyimpan…' : mode === 'create' ? 'Tambah Warga' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RtRwModal({
  rtList,
  rwList,
  onClose,
  onMutated,
}: {
  rtList: RtItem[];
  rwList: RwItem[];
  onClose: () => void;
  onMutated: () => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<'rt' | 'rw'>('rt');
  const [rwIdForRt, setRwIdForRt] = useState<string>(rwList[0] ? String(rwList[0].id_rw) : '');
  const [nomorRt, setNomorRt] = useState('');
  const [namaRt, setNamaRt] = useState('');
  const [namaKetuaRt, setNamaKetuaRt] = useState('');
  const [nomorWaRt, setNomorWaRt] = useState('');
  const [editingRt, setEditingRt] = useState<RtItem | null>(null);

  const [selectedRwId, setSelectedRwId] = useState<string>(rwList[0] ? String(rwList[0].id_rw) : '');
  const activeRw = useMemo(
    () => rwList.find((rw) => String(rw.id_rw) === selectedRwId) ?? rwList[0] ?? null,
    [rwList, selectedRwId],
  );
  const [namaKetuaRw, setNamaKetuaRw] = useState<string>(rwList[0]?.nama_ketua ?? '');
  const [nomorWaRw, setNomorWaRw] = useState<string>(rwList[0]?.nomor_whatsapp ?? '');

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const effectiveRwIdForRt = rwList.some((rw) => String(rw.id_rw) === rwIdForRt)
    ? rwIdForRt
    : rwList[0] ? String(rwList[0].id_rw) : '';

  const inputClass =
    'h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-primary-400 focus:ring-3 focus:ring-primary-100';

  function resetRtForm() {
    setEditingRt(null);
    setNomorRt('');
    setNamaRt('');
    setNamaKetuaRt('');
    setNomorWaRt('');
  }

  function selectRwForEdit(rw: RwItem) {
    setSelectedRwId(String(rw.id_rw));
    setNamaKetuaRw(rw.nama_ketua ?? '');
    setNomorWaRw(rw.nomor_whatsapp ?? '');
    setFeedback(null);
  }

  async function handleSaveRt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!effectiveRwIdForRt || !nomorRt.trim()) return;
    setBusy(true);
    setFeedback(null);
    try {
      const payload = {
        id_rw: Number(effectiveRwIdForRt),
        nomor_rt: nomorRt.trim(),
        nama_rt: namaRt.trim() || `RT ${nomorRt.trim()}`,
        nama_ketua: namaKetuaRt.trim() || null,
        nomor_whatsapp: nomorWaRt.trim() || null,
      };
      if (editingRt) {
        await updateAdminRt(editingRt.id_rt, payload);
        setFeedback({ type: 'success', text: 'Data RT berhasil diperbarui.' });
      } else {
        await createAdminRt(payload);
        setFeedback({ type: 'success', text: 'RT baru berhasil ditambahkan.' });
      }
      resetRtForm();
      await onMutated();
    } catch (error) {
      const message = error instanceof ApiRequestError || error instanceof Error
        ? error.message
        : 'Gagal menyimpan data RT.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteRt(rt: RtItem) {
    setBusy(true);
    setFeedback(null);
    try {
      await deleteAdminRt(rt.id_rt);
      setFeedback({ type: 'success', text: `${rt.nama_rt} berhasil dihapus.` });
      await onMutated();
    } catch (error) {
      const message = error instanceof ApiRequestError || error instanceof Error
        ? error.message
        : 'RT tidak dapat dihapus.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveRw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeRw) return;
    setBusy(true);
    setFeedback(null);
    try {
      await updateAdminRw(activeRw.id_rw, {
        nama_ketua: namaKetuaRw.trim() || null,
        nomor_whatsapp: nomorWaRw.trim() || null,
      });
      setFeedback({ type: 'success', text: `Kontak pengurus ${activeRw.nama_rw} berhasil disimpan.` });
      await onMutated();
    } catch (error) {
      const message = error instanceof ApiRequestError || error instanceof Error
        ? error.message
        : 'Gagal menyimpan kontak pengurus RW.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen onClose={busy ? () => undefined : onClose} ariaLabel="Kelola data RT dan RW">
      <div className="p-5 sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">Master Wilayah</p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-900">Kelola Data RT &amp; Pengurus RW</h2>
            <p className="mt-1 text-sm text-neutral-500">Kelola daftar RT serta nama ketua dan nomor WhatsApp pengurus RT/RW.</p>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
          >
            <Icon name="close" />
          </button>
        </div>

        <div role="tablist" aria-label="Pilih tab wilayah" className="mb-5 flex w-fit gap-1 rounded-xl bg-neutral-100 p-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'rt'}
            onClick={() => {
              setActiveTab('rt');
              setFeedback(null);
            }}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === 'rt' ? 'bg-white text-primary-700 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Data RT ({rtList.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'rw'}
            onClick={() => {
              setActiveTab('rw');
              setFeedback(null);
              if (activeRw) {
                setNamaKetuaRw(activeRw.nama_ketua ?? '');
                setNomorWaRw(activeRw.nomor_whatsapp ?? '');
              }
            }}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === 'rw' ? 'bg-white text-primary-700 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Pengurus RW ({rwList.length})
          </button>
        </div>

        {feedback && (
          <div
            role={feedback.type === 'error' ? 'alert' : 'status'}
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === 'error'
                ? 'border-primary-200 bg-primary-50 text-primary-700'
                : 'border-green-200 bg-green-50 text-green-800'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {activeTab === 'rt' ? (
          <div className="space-y-5">
            <form onSubmit={(event) => void handleSaveRt(event)} className="grid gap-3 rounded-xl border border-neutral-100 bg-neutral-50/70 p-4 sm:grid-cols-3">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-neutral-600">RW Induk</span>
                <select
                  required
                  value={effectiveRwIdForRt}
                  onChange={(event) => setRwIdForRt(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Pilih RW</option>
                  {rwList.map((rw) => (
                    <option key={rw.id_rw} value={rw.id_rw}>{rw.nama_rw}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-neutral-600">Nomor RT</span>
                <input
                  required
                  maxLength={10}
                  value={nomorRt}
                  onChange={(event) => setNomorRt(event.target.value)}
                  placeholder="Contoh: 001"
                  className={inputClass}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-neutral-600">Nama Label RT</span>
                <input
                  maxLength={100}
                  value={namaRt}
                  onChange={(event) => setNamaRt(event.target.value)}
                  placeholder="Contoh: RT 001"
                  className={inputClass}
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold text-neutral-600">Nama Ketua RT</span>
                <input
                  maxLength={150}
                  value={namaKetuaRt}
                  onChange={(event) => setNamaKetuaRt(event.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className={inputClass}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-neutral-600">Nomor WhatsApp</span>
                <input
                  type="tel"
                  maxLength={20}
                  value={nomorWaRt}
                  onChange={(event) => setNomorWaRt(event.target.value)}
                  placeholder="081234567890"
                  className={inputClass}
                />
              </label>
              <div className="flex items-center justify-end gap-2 sm:col-span-3">
                {editingRt && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={resetRtForm}
                    className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                  >
                    Batal Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={busy || rwList.length === 0}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary-600 px-4 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  <Icon name="check" className="size-3.5" />
                  {editingRt ? 'Simpan Perubahan RT' : 'Tambah RT'}
                </button>
              </div>
            </form>

            <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-100">
              {rtList.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-400">Belum ada data RT terdaftar.</p>
              ) : (
                rtList.map((rt) => (
                  <div key={rt.id_rt} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{rt.nama_rt}</p>
                      <p className="text-xs text-neutral-500">
                        {rt.nama_rw ?? (rt.nomor_rw ? `RW ${rt.nomor_rw}` : `RW #${rt.id_rw}`)}
                        {rt.jumlah_warga !== null ? ` · ${rt.jumlah_warga} warga` : ''}
                      </p>
                      {(rt.nama_ketua || rt.nomor_whatsapp) && (
                        <p className="mt-0.5 text-xs text-neutral-600">
                          Ketua: {rt.nama_ketua ?? '-'}
                          {rt.nomor_whatsapp ? ` · WA ${rt.nomor_whatsapp}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditingRt(rt);
                          setRwIdForRt(String(rt.id_rw));
                          setNomorRt(rt.nomor_rt);
                          setNamaRt(rt.nama_rt);
                          setNamaKetuaRt(rt.nama_ketua ?? '');
                          setNomorWaRt(rt.nomor_whatsapp ?? '');
                          setFeedback(null);
                        }}
                        className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:border-primary-200 hover:text-primary-600"
                        aria-label={`Edit ${rt.nama_rt}`}
                      >
                        <Icon name="edit" className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleDeleteRt(rt)}
                        className="flex size-8 items-center justify-center rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50"
                        aria-label={`Hapus ${rt.nama_rt}`}
                      >
                        <Icon name="close" className="size-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {rwList.length === 0 ? (
              <p className="rounded-xl border border-neutral-100 py-8 text-center text-sm text-neutral-400">
                Data RW belum tersedia dari backend.
              </p>
            ) : (
              <>
                <form onSubmit={(event) => void handleSaveRw(event)} className="grid gap-3 rounded-xl border border-neutral-100 bg-neutral-50/70 p-4 sm:grid-cols-2">
                  {rwList.length > 1 ? (
                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-semibold text-neutral-600">Wilayah RW</span>
                      <select
                        value={activeRw ? String(activeRw.id_rw) : ''}
                        onChange={(event) => {
                          const target = rwList.find((rw) => String(rw.id_rw) === event.target.value);
                          if (target) selectRwForEdit(target);
                        }}
                        className={inputClass}
                      >
                        {rwList.map((rw) => (
                          <option key={rw.id_rw} value={rw.id_rw}>{rw.nama_rw}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <div className="sm:col-span-2">
                      <span className="text-xs font-semibold text-neutral-600">Wilayah RW</span>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">{activeRw?.nama_rw}</p>
                    </div>
                  )}
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-neutral-600">Nama Ketua RW</span>
                    <input
                      maxLength={150}
                      value={namaKetuaRw}
                      onChange={(event) => setNamaKetuaRw(event.target.value)}
                      placeholder="Contoh: Siti Aminah"
                      className={inputClass}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-neutral-600">Nomor WhatsApp</span>
                    <input
                      type="tel"
                      maxLength={20}
                      value={nomorWaRw}
                      onChange={(event) => setNomorWaRw(event.target.value)}
                      placeholder="081234567890"
                      className={inputClass}
                    />
                  </label>
                  <div className="flex items-center justify-end sm:col-span-2">
                    <button
                      type="submit"
                      disabled={busy || !activeRw}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary-600 px-4 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Icon name="check" className="size-3.5" />
                      Simpan Pengurus RW
                    </button>
                  </div>
                </form>

                <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-100">
                  {rwList.map((rw) => (
                    <div key={rw.id_rw} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900">{rw.nama_rw}</p>
                        <p className="text-xs text-neutral-500">
                          {rw.jumlah_rt !== null ? `${rw.jumlah_rt} RT` : `Nomor RW ${rw.nomor_rw}`}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-600">
                          Ketua: {rw.nama_ketua ?? 'Belum diisi'}
                          {rw.nomor_whatsapp ? ` · WA ${rw.nomor_whatsapp}` : ' · WA belum diisi'}
                        </p>
                      </div>
                      {rwList.length > 1 && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => selectRwForEdit(rw)}
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:border-primary-200 hover:text-primary-600"
                          aria-label={`Edit pengurus ${rw.nama_rw}`}
                        >
                          <Icon name="edit" className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export function WargaManagement({ role, userName }: { role: 'admin' | 'panitia'; userName: string }) {
  const queryClient = useQueryClient();

  const [statusTab, setStatusTab] = useState<StatusTab>('Semua');
  const [rtFilter, setRtFilter] = useState<string>('Semua');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const [toast, setToast] = useState<string | null>(null);

  const [formDialog, setFormDialog] = useState<{ mode: 'create' } | { mode: 'edit'; warga: WargaItem } | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deactivateTarget, setDeactivateTarget] = useState<WargaItem | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const [createdAccount, setCreatedAccount] = useState<{ wargaName: string; account: CreatedAccountInfo } | null>(null);
  const [wilayahOpen, setWilayahOpen] = useState(false);

  const wargaQuery = useQuery({
    queryKey: queryKeys.managementWarga({}),
    queryFn: ({ signal }) => getAdminWarga(undefined, signal).then((res) => res.data),
    staleTime: STALE_TIME.MODERATE,
  });

  const wargaList = useMemo(() => wargaQuery.data?.warga ?? [], [wargaQuery.data]);
  const rtList = useMemo(() => wargaQuery.data?.rtList ?? [], [wargaQuery.data]);
  const rwList = useMemo(() => wargaQuery.data?.rwList ?? [], [wargaQuery.data]);
  const metrics = wargaQuery.data?.metrics ?? EMPTY_METRICS;
  const loading = wargaQuery.isLoading;
  const hasLoaded = wargaQuery.isSuccess;
  const loadError = wargaQuery.error
    ? (wargaQuery.error instanceof Error ? wargaQuery.error.message : 'Data warga gagal dimuat.')
    : null;

  const reload = async (showSpinner = true) => {
    if (showSpinner) {
      await wargaQuery.refetch();
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['management', 'warga'] });
    void queryClient.invalidateQueries({ queryKey: ['management', 'akun'] });
    void queryClient.invalidateQueries({ queryKey: ['management', 'dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['kontak-pengurus'] });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5_000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('id-ID');
    return wargaList.filter((item) => {
      if (statusTab !== 'Semua' && item.status !== statusTab) return false;
      if (rtFilter !== 'Semua' && String(item.id_rt ?? '') !== rtFilter) return false;
      if (!keyword) return true;
      return (
        item.nama.toLocaleLowerCase('id-ID').includes(keyword) ||
        item.nik.toLocaleLowerCase('id-ID').includes(keyword) ||
        (item.no_hp ?? '').toLocaleLowerCase('id-ID').includes(keyword) ||
        (item.username ?? '').toLocaleLowerCase('id-ID').includes(keyword)
      );
    });
  }, [wargaList, statusTab, rtFilter, query]);

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

  async function handleSubmitWarga(form: WargaFormState) {
    if (!formDialog || formSaving) return;
    setFormSaving(true);
    setFormError(null);
    const payload = {
      id_rt: Number(form.id_rt),
      nik: form.nik.trim(),
      nama: form.nama.trim(),
      jenis_kelamin: form.jenis_kelamin,
      ...(form.tempat_lahir.trim() ? { tempat_lahir: form.tempat_lahir.trim() } : {}),
      ...(form.tanggal_lahir.trim() ? { tanggal_lahir: form.tanggal_lahir.trim() } : {}),
      ...(form.no_hp.trim() ? { no_hp: form.no_hp.trim() } : {}),
      ...(form.alamat.trim() ? { alamat: form.alamat.trim() } : {}),
      status: form.status,
    };

    try {
      if (formDialog.mode === 'create') {
        const res = await createAdminWarga(payload);
        setFormDialog(null);
        setToast(res.message || 'Data warga dan akun login berhasil dibuat.');
        if (res.data.account) {
          setCreatedAccount({ wargaName: payload.nama, account: res.data.account });
        }
      } else {
        const res = await updateAdminWarga(formDialog.warga.id_warga, payload);
        setFormDialog(null);
        setToast(res.message || 'Data warga berhasil diperbarui.');
      }
      await reload(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Gagal menyimpan data warga.');
    } finally {
      setFormSaving(false);
    }
  }

  async function handleConfirmDeactivate() {
    if (!deactivateTarget || deactivating) return;
    setDeactivating(true);
    setDeactivateError(null);
    try {
      const res = await deactivateAdminWarga(deactivateTarget.id_warga);
      setDeactivateTarget(null);
      setToast(res.message || 'Warga berhasil dinonaktifkan.');
      await reload(false);
    } catch (error) {
      setDeactivateError(error instanceof Error ? error.message : 'Gagal menonaktifkan warga.');
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <ManagementLayout role={role} userName={userName} title="Kelola Warga" activeItem="warga">
      <section className="mb-7 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-medium text-primary-600">Ruang Admin</p>
          <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">
            Kelola Data Warga
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            Kelola data kependudukan warga, wilayah RT, serta pembuatan akun login warga otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setWilayahOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-primary-200 hover:text-primary-700"
          >
            <Icon name="building" className="size-4.5 text-neutral-400" />
            Kelola RT &amp; RW
          </button>
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setFormDialog({ mode: 'create' });
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            <span className="text-lg leading-none">+</span>
            Tambah Warga
          </button>
        </div>
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
        <DashboardWargaSkeleton />
      ) : hasLoaded ? (
        <>
          <section aria-label="Ringkasan data warga" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5">
              <p className="text-sm font-medium text-neutral-500">Total warga</p>
              <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{metrics.totalWarga}</p>
            </article>
            <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5">
              <p className="text-sm font-medium text-neutral-500">Warga aktif</p>
              <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{metrics.aktifCount}</p>
            </article>
            <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5">
              <p className="text-sm font-medium text-neutral-500">Warga nonaktif</p>
              <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{metrics.nonaktifCount}</p>
            </article>
            <article className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5">
              <p className="text-sm font-medium text-neutral-500">Total wilayah RT</p>
              <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">{metrics.totalRt}</p>
            </article>
          </section>

          <section
            aria-labelledby="warga-table-title"
            className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_3px_16px_rgba(34,24,24,0.025)]"
          >
            <h2 id="warga-table-title" className="sr-only">Daftar data warga</h2>
            <div className="flex flex-col gap-4 border-b border-neutral-100 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div role="tablist" aria-label="Filter status warga" className="flex flex-wrap gap-2">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={statusTab === tab}
                      onClick={() => {
                        setStatusTab(tab);
                        setPage(1);
                      }}
                      className={`min-h-9 rounded-xl px-4 text-sm font-semibold transition-colors ${
                        statusTab === tab
                          ? 'bg-primary-100 text-primary-700'
                          : 'border border-neutral-200 bg-white text-neutral-500 hover:border-primary-200 hover:text-primary-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-sm text-neutral-600">
                  <span className="text-xs font-semibold text-neutral-500">Wilayah RT:</span>
                  <select
                    value={rtFilter}
                    onChange={(event) => {
                      setRtFilter(event.target.value);
                      setPage(1);
                    }}
                    className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 outline-none focus:border-primary-400"
                  >
                    <option value="Semua">Semua RT</option>
                    {rtList.map((rt) => (
                      <option key={rt.id_rt} value={String(rt.id_rt)}>
                        {rt.nama_rt}{rt.nomor_rw ? ` / RW ${rt.nomor_rw}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="relative max-w-[460px]">
                <label htmlFor="warga-search" className="sr-only">Cari nama, NIK, atau username warga</label>
                <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400" />
                <input
                  id="warga-search"
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari nama warga, NIK, nomor HP, atau username"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-primary-400 focus:ring-3 focus:ring-primary-100"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-left">
                <thead className="bg-neutral-50 text-xs font-semibold text-neutral-700">
                  <tr>
                    {['Nama & NIK', 'Wilayah', 'Kontak & Alamat', 'TTL', 'Status', 'Aksi'].map((heading) => (
                      <th key={heading} scope="col" className="px-4 py-4 first:pl-5 last:pr-5">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pageItems.map((item) => (
                    <tr key={item.id_warga} className="hover:bg-primary-50/40">
                      <td className="px-4 py-3.5 pl-5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-900">{item.nama}</p>
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-600">
                            {item.jenis_kelamin}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-neutral-400">
                          NIK: {item.nik}
                          {item.username ? ` · @${item.username}` : ''}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-neutral-700">
                        {formatWilayah(item)}
                      </td>
                      <td className="max-w-xs px-4 py-3.5">
                        <p className="text-sm text-neutral-700">{item.no_hp ?? '–'}</p>
                        <p className="mt-0.5 truncate text-xs text-neutral-400">{item.alamat ?? 'Alamat belum diisi'}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-500">
                        {formatBirth(item.tempat_lahir, item.tanggal_lahir)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3.5 pr-5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Edit data ${item.nama}`}
                            title="Edit Data Warga"
                            onClick={() => {
                              setFormError(null);
                              setFormDialog({ mode: 'edit', warga: item });
                            }}
                            className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:border-primary-200 hover:text-primary-600"
                          >
                            <Icon name="edit" className="size-4" />
                          </button>
                          {item.status === 'Aktif' && (
                            <button
                              type="button"
                              aria-label={`Nonaktifkan ${item.nama}`}
                              title="Nonaktifkan Warga"
                              onClick={() => {
                                setDeactivateError(null);
                                setDeactivateTarget(item);
                              }}
                              className="flex size-8 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-600 transition hover:bg-primary-50"
                            >
                              <Icon name="close" className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-14 text-center text-sm text-neutral-400">
                        {loading ? 'Memuat data warga…' : 'Belum ada data warga yang cocok'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-neutral-400">
                Menampilkan {pageItems.length} dari {filtered.length} warga
              </p>
              <nav aria-label="Navigasi halaman warga" className="flex items-center gap-1">
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

      {formDialog && (
        <WargaFormModal
          mode={formDialog.mode}
          initialValue={
            formDialog.mode === 'create'
              ? emptyWargaForm(rtList[0]?.id_rt)
              : formFromWarga(formDialog.warga)
          }
          rtList={rtList}
          saving={formSaving}
          error={formError}
          onClose={() => {
            if (!formSaving) setFormDialog(null);
          }}
          onSubmit={(value) => void handleSubmitWarga(value)}
          onOpenWilayah={() => {
            setFormDialog(null);
            setWilayahOpen(true);
          }}
        />
      )}

      {deactivateTarget && (
        <Modal
          isOpen
          onClose={() => {
            if (!deactivating) setDeactivateTarget(null);
          }}
          ariaLabel="Konfirmasi nonaktifkan warga"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Nonaktifkan Data Warga?</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Data warga <strong>{deactivateTarget.nama}</strong> (NIK {deactivateTarget.nik}) akan diubah statusnya menjadi Nonaktif.
            </p>
            {deactivateError && (
              <div role="alert" className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-3 text-xs text-primary-700">
                {deactivateError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deactivating}
                onClick={() => setDeactivateTarget(null)}
                className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deactivating}
                onClick={() => void handleConfirmDeactivate()}
                className="min-h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {deactivating ? 'Memproses…' : 'Ya, Nonaktifkan'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {createdAccount && (
        <Modal
          isOpen
          onClose={() => setCreatedAccount(null)}
          ariaLabel="Informasi akun warga baru"
        >
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#16866A]">Akun Dibuat Otomatis</p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-900">Kredensial Login {createdAccount.wargaName}</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Catat dan bagikan informasi login berikut kepada warga. Warga dapat mengubah password setelah masuk.
            </p>
            <dl className="mt-5 space-y-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-sm">
              {createdAccount.account.username && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-neutral-500">Username</dt>
                  <dd className="font-mono font-semibold text-neutral-900">{createdAccount.account.username}</dd>
                </div>
              )}
              {createdAccount.account.password_awal && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-neutral-500">Password Awal</dt>
                  <dd className="font-mono font-semibold text-neutral-900">{createdAccount.account.password_awal}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Role</dt>
                <dd className="font-semibold text-neutral-900">{createdAccount.account.role_name ?? 'Warga'}</dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const text = [
                    createdAccount.account.username ? `Username: ${createdAccount.account.username}` : null,
                    createdAccount.account.password_awal ? `Password: ${createdAccount.account.password_awal}` : null,
                  ].filter(Boolean).join('\n');
                  if (text) void navigator.clipboard?.writeText(text);
                  setToast('Kredensial login berhasil disalin.');
                }}
                className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Salin
              </button>
              <button
                type="button"
                onClick={() => setCreatedAccount(null)}
                className="min-h-10 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Selesai
              </button>
            </div>
          </div>
        </Modal>
      )}

      {wilayahOpen && (
        <RtRwModal
          rtList={rtList}
          rwList={rwList}
          onClose={() => setWilayahOpen(false)}
          onMutated={() => reload(false)}
        />
      )}
    </ManagementLayout>
  );
}

