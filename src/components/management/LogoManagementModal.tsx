'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/Modal';
import { Icon } from '@/components/management/ManagementDashboard';
import { DEFAULT_LOGO_SRC, useActiveLogo } from '@/hooks/use-active-logo';
import { ApiRequestError } from '@/lib/api/client';
import {
  activateManagementLogo,
  createManagementLogo,
  deleteManagementLogo,
  getManagementLogos,
  updateManagementLogo,
} from '@/lib/api/logo';
import { STALE_TIME } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import type { LogoHutRiItem, LogoStatus } from '@/types/logo';

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface LogoManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoManagementModal({ isOpen, onClose }: LogoManagementModalProps) {
  const queryClient = useQueryClient();
  const { activeLogo, logoUrl, logoAlt } = useActiveLogo();

  const [tab, setTab] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<LogoHutRiItem | null>(null);

  const [tahun, setTahun] = useState(() => String(new Date().getFullYear()));
  const [namaLogo, setNamaLogo] = useState('');
  const [activateOnSave, setActivateOnSave] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const logosQuery = useQuery({
    queryKey: queryKeys.managementLogo(),
    queryFn: ({ signal }) => getManagementLogos(undefined, signal).then((res) => res.data),
    enabled: isOpen,
    staleTime: STALE_TIME.MODERATE,
  });

  const logos = logosQuery.data ?? [];

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function resetForm(nextEditing: LogoHutRiItem | null = null) {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setEditingItem(nextEditing);
    setTahun(nextEditing ? String(nextEditing.tahun) : String(new Date().getFullYear()));
    setNamaLogo(nextEditing ? nextEditing.nama_logo : '');
    setActivateOnSave(nextEditing ? nextEditing.status === 'Aktif' : true);
    setSelectedFile(null);
    setPreviewUrl(nextEditing ? nextEditing.gambar : null);
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function openCreateForm() {
    setNotice(null);
    resetForm(null);
    setTab('form');
  }

  function openEditForm(item: LogoHutRiItem) {
    setNotice(null);
    resetForm(item);
    setTab('form');
  }

  function handleSelectFile(file: File) {
    setFormError(null);
    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      setFormError('Format gambar logo harus berupa JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setFormError('Ukuran gambar logo maksimal 5 MB.');
      return;
    }
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function invalidateLogoCaches() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.activeLogo }),
      queryClient.invalidateQueries({ queryKey: ['management', 'logo'] }),
      queryClient.invalidateQueries({ queryKey: ['beranda'] }),
      queryClient.invalidateQueries({ queryKey: ['histori'] }),
    ]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);
    setNotice(null);

    const parsedYear = /^\d{4}$/.test(tahun.trim()) ? Number(tahun.trim()) : Number.NaN;
    if (!Number.isSafeInteger(parsedYear) || parsedYear < 1945 || parsedYear > 2100) {
      setFormError('Masukkan tahun yang valid (4 digit, contoh: 2026).');
      return;
    }

    const trimmedName = namaLogo.trim();
    if (!trimmedName || trimmedName.length > 150) {
      setFormError('Nama logo wajib diisi maksimal 150 karakter.');
      return;
    }

    if (!editingItem && !selectedFile) {
      setFormError('Pilih file gambar logo terlebih dahulu.');
      return;
    }

    const statusValue: LogoStatus = activateOnSave ? 'Aktif' : 'Nonaktif';
    const formData = new FormData();
    formData.set('tahun', String(parsedYear));
    formData.set('nama_logo', trimmedName);
    formData.set('status', statusValue);
    if (selectedFile) {
      formData.set('gambar', selectedFile, selectedFile.name);
    }

    setSubmitting(true);
    try {
      const response = editingItem
        ? await updateManagementLogo(editingItem.id_logo, formData)
        : await createManagementLogo(formData);
      await invalidateLogoCaches();
      setNotice(response.message);
      resetForm(null);
      setTab('list');
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError
          ? error.message
          : 'Logo gagal disimpan. Silakan coba lagi.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleActivate(item: LogoHutRiItem) {
    if (busyId !== null) return;
    setFormError(null);
    setNotice(null);
    setBusyId(item.id_logo);
    try {
      const response = await activateManagementLogo(item.id_logo);
      await invalidateLogoCaches();
      setNotice(response.message);
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError
          ? error.message
          : 'Logo gagal diaktifkan. Silakan coba lagi.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: LogoHutRiItem) {
    if (busyId !== null) return;
    setFormError(null);
    setNotice(null);
    setBusyId(item.id_logo);
    try {
      const response = await deleteManagementLogo(item.id_logo);
      await invalidateLogoCaches();
      setConfirmDeleteId(null);
      setNotice(response.message);
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError
          ? error.message
          : 'Logo gagal dihapus. Silakan coba lagi.',
      );
    } finally {
      setBusyId(null);
    }
  }

  function handleClose() {
    if (submitting || busyId !== null) return;
    setConfirmDeleteId(null);
    setFormError(null);
    setNotice(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} ariaLabel="Kelola dan ganti logo website">
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-primary-600 uppercase">Khusus Admin</p>
            <h2 className="mt-0.5 text-xl font-semibold text-neutral-900">Kelola Logo Website</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Unggah logo baru atau aktifkan logo tahun tertentu untuk ditampilkan di website.
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            disabled={submitting || busyId !== null}
            onClick={handleClose}
            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-700 disabled:opacity-50"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Active Logo Summary */}
          <div className="flex flex-col gap-4 rounded-2xl border border-primary-100 bg-primary-100/25 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white p-1.5">
                <Image
                  src={logoUrl}
                  alt={logoAlt}
                  width={56}
                  height={56}
                  unoptimized={logoUrl !== DEFAULT_LOGO_SRC}
                  className="size-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-primary-700 shadow-2xs">
                  {activeLogo ? `Logo Aktif · ${activeLogo.tahun}` : 'Logo Default Bawaan'}
                </span>
                <p className="mt-1 truncate text-sm font-semibold text-neutral-900">
                  {activeLogo ? activeLogo.nama_logo : 'Logo Default Website'}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTab('list');
                  setFormError(null);
                }}
                className={`min-h-9 rounded-xl px-3.5 text-xs font-semibold transition-colors ${
                  tab === 'list'
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Daftar Logo ({logos.length})
              </button>
              <button
                type="button"
                onClick={openCreateForm}
                className={`min-h-9 rounded-xl px-3.5 text-xs font-semibold transition-colors ${
                  tab === 'form' && !editingItem
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'border border-primary-200 bg-white text-primary-700 hover:bg-primary-50'
                }`}
              >
                + Unggah Baru
              </button>
            </div>
          </div>

          {notice && (
            <p role="status" className="rounded-xl border border-success-100 bg-success-10 px-4 py-3 text-xs font-semibold text-success-200">
              {notice}
            </p>
          )}
          {formError && (
            <p role="alert" className="rounded-xl border border-error-100/25 bg-error-10 px-4 py-3 text-xs font-semibold text-error-100">
              {formError}
            </p>
          )}

          {tab === 'list' ? (
            logosQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((row) => (
                  <div key={row} className="h-20 animate-pulse rounded-xl bg-neutral-100" />
                ))}
              </div>
            ) : logosQuery.isError ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center">
                <p className="text-sm font-medium text-neutral-700">
                  {logosQuery.error instanceof Error ? logosQuery.error.message : 'Daftar logo gagal dimuat.'}
                </p>
                <button
                  type="button"
                  onClick={() => void logosQuery.refetch()}
                  className="mt-3 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700"
                >
                  Coba Lagi
                </button>
              </div>
            ) : logos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-8 text-center">
                <Icon name="image" className="mx-auto size-9 text-neutral-300" />
                <p className="mt-3 text-sm font-semibold text-neutral-800">Belum ada logo tersimpan</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Unggah logo baru untuk mengganti logo bawaan website.
                </p>
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-4 min-h-10 rounded-xl bg-primary-600 px-5 text-xs font-semibold text-white hover:bg-primary-700"
                >
                  Unggah Logo Pertama
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {logos.map((item) => {
                  const isItemBusy = busyId === item.id_logo;
                  const isConfirmingDelete = confirmDeleteId === item.id_logo;
                  return (
                    <li
                      key={item.id_logo}
                      className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50 p-1">
                          <Image
                            src={item.gambar}
                            alt={item.nama_logo}
                            width={48}
                            height={48}
                            unoptimized
                            className="size-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-900 truncate">
                              {item.nama_logo}
                            </span>
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                item.status === 'Aktif'
                                  ? 'bg-[#C8F0E3] text-[#16866A]'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-neutral-500">Tahun {item.tahun}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {item.status !== 'Aktif' && (
                          <button
                            type="button"
                            disabled={busyId !== null}
                            onClick={() => void handleActivate(item)}
                            className="min-h-9 rounded-xl bg-[#16866A] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#13735B] disabled:opacity-50"
                          >
                            {isItemBusy ? 'Memproses...' : 'Aktifkan'}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => openEditForm(item)}
                          className="min-h-9 rounded-xl border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
                        >
                          Ubah
                        </button>
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={busyId !== null}
                              onClick={() => void handleDelete(item)}
                              className="min-h-9 rounded-xl bg-error-100 px-3 text-xs font-semibold text-white hover:bg-error-200 disabled:opacity-50"
                            >
                              {isItemBusy ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                            <button
                              type="button"
                              disabled={busyId !== null}
                              onClick={() => setConfirmDeleteId(null)}
                              className="min-h-9 rounded-xl border border-neutral-200 px-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId !== null}
                            onClick={() => setConfirmDeleteId(item.id_logo)}
                            className="min-h-9 rounded-xl border border-primary-200 px-3 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50 disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-neutral-700">Tahun</span>
                  <input
                    type="number"
                    min={1945}
                    max={2100}
                    required
                    disabled={submitting}
                    value={tahun}
                    onChange={(event) => setTahun(event.target.value)}
                    placeholder="Contoh: 2026"
                    className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm text-neutral-900 outline-none focus:border-primary-400"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-neutral-700">Nama Logo</span>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    disabled={submitting}
                    value={namaLogo}
                    onChange={(event) => setNamaLogo(event.target.value)}
                    placeholder="Contoh: Logo HUT RI ke-81"
                    className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm text-neutral-900 outline-none focus:border-primary-400"
                  />
                </label>
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Gambar Logo {editingItem ? '(opsional jika tidak diganti)' : ''}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleSelectFile(file);
                  }}
                />
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) handleSelectFile(file);
                  }}
                  className={`flex w-full flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center transition ${
                    isDragging
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-300 bg-neutral-50 hover:border-primary-300 hover:bg-neutral-100/50'
                  }`}
                >
                  {previewUrl ? (
                    <>
                      <Image
                        src={previewUrl}
                        alt="Pratinjau logo"
                        width={120}
                        height={120}
                        unoptimized
                        className="max-h-32 w-auto rounded-lg object-contain"
                      />
                      <p className="mt-2.5 text-xs font-semibold text-primary-600">
                        {selectedFile ? selectedFile.name : 'Klik atau tarik gambar baru untuk mengganti'}
                      </p>
                    </>
                  ) : (
                    <>
                      <Icon name="image" className="size-8 text-neutral-300" />
                      <p className="mt-2 text-sm font-medium text-neutral-600">
                        Klik atau tarik file gambar logo ke sini
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-400">JPG, PNG, atau WebP (maks. 5 MB)</p>
                    </>
                  )}
                </button>
              </div>

              <label className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-sm font-medium text-neutral-700">
                <input
                  type="checkbox"
                  checked={activateOnSave}
                  disabled={submitting}
                  onChange={(event) => setActivateOnSave(event.target.checked)}
                  className="size-4 accent-primary-600"
                />
                <span>Aktifkan logo ini di website setelah disimpan</span>
              </label>

              <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    resetForm(null);
                    setTab('list');
                  }}
                  className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-10 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : editingItem
                      ? 'Simpan Perubahan'
                      : 'Simpan Logo'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}

