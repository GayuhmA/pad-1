'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/management/ManagementDashboard';
import { createManagementTagihan, getTagihanFormOptions } from '@/lib/api/management-iuran';
import { STALE_TIME } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import type {
  PeriodeOption,
  TagihanTarget,
  WargaSelectOption,
} from '@/types/management-iuran';

function extractApiErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function CreateTagihanModal({
  periodes,
  wargaOptions,
  canSelectSpecificWarga,
  optionsLoading,
  onClose,
  onSaved,
}: {
  periodes: PeriodeOption[];
  wargaOptions: WargaSelectOption[];
  canSelectSpecificWarga: boolean;
  optionsLoading: boolean;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const defaultPeriodeId = useMemo(() => {
    const aktif = periodes.find((p) => p.status.toLowerCase() === 'aktif');
    return aktif ? String(aktif.id_periode) : periodes[0] ? String(periodes[0].id_periode) : '';
  }, [periodes]);

  const [namaTagihan, setNamaTagihan] = useState('');
  const [idPeriode, setIdPeriode] = useState(defaultPeriodeId);
  const [nominal, setNominal] = useState('');
  const [jatuhTempo, setJatuhTempo] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [target, setTarget] = useState<TagihanTarget>('Semua');
  const [selectedWargaIds, setSelectedWargaIds] = useState<number[]>([]);
  const [wargaSearch, setWargaSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectivePeriodeId = idPeriode || defaultPeriodeId;

  const filteredWarga = useMemo(() => {
    const q = wargaSearch.trim().toLocaleLowerCase('id-ID');
    if (!q) return wargaOptions;
    return wargaOptions.filter((w) => {
      const region = `rt ${w.nomor_rt ?? ''} rw ${w.nomor_rw ?? ''}`.toLocaleLowerCase('id-ID');
      return (
        w.nama.toLocaleLowerCase('id-ID').includes(q)
        || region.includes(q)
        || (w.no_hp ?? '').includes(q)
      );
    });
  }, [wargaOptions, wargaSearch]);

  function toggleWarga(idWarga: number) {
    setSelectedWargaIds((prev) =>
      prev.includes(idWarga) ? prev.filter((id) => id !== idWarga) : [...prev, idWarga],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedName = namaTagihan.trim();
    const numericNominal = Number(nominal);
    const numericPeriode = Number(effectivePeriodeId);

    if (!trimmedName) {
      setError('Nama tagihan wajib diisi.');
      return;
    }
    if (!Number.isSafeInteger(numericPeriode) || numericPeriode <= 0) {
      setError('Periode kegiatan wajib dipilih.');
      return;
    }
    if (!Number.isFinite(numericNominal) || numericNominal <= 0) {
      setError('Nominal harus lebih besar dari 0.');
      return;
    }
    if (!jatuhTempo) {
      setError('Tanggal jatuh tempo wajib diisi.');
      return;
    }
    if (target === 'Tertentu' && selectedWargaIds.length === 0) {
      setError('Pilih minimal satu warga jika target adalah Warga Tertentu.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createManagementTagihan({
        nama_tagihan: trimmedName,
        id_periode: numericPeriode,
        nominal: numericNominal,
        jatuh_tempo: jatuhTempo,
        keterangan: keterangan.trim() || null,
        target,
        ...(target === 'Tertentu' ? { id_warga: selectedWargaIds } : {}),
      });
      await onSaved(res.message || 'Tagihan iuran berhasil dibuat.');
      onClose();
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Gagal menyimpan tagihan iuran.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="tagihan-form-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        onClick={() => { if (!submitting) onClose(); }}
        className="absolute inset-0 bg-neutral-900/40"
      />
      <section className="relative z-10 flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-100 px-6 py-4">
          <div>
            <h2 id="tagihan-form-title" className="text-lg font-semibold text-neutral-900">
              Tambah Tagihan Iuran
            </h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              Membuat tagihan baru dan otomatis menambahkan baris iuran ke daftar warga target.
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            disabled={submitting}
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-50 disabled:opacity-50"
          >
            <Icon name="close" className="size-5" />
          </button>
        </header>

        <form id="tagihan-form" onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {error && (
            <div className="rounded-xl border border-primary-200 bg-primary-50 p-3 text-xs leading-5 text-primary-700">
              {error}
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">
              Nama tagihan <span className="text-primary-600">*</span>
            </span>
            <input
              type="text"
              required
              value={namaTagihan}
              onChange={(e) => setNamaTagihan(e.target.value)}
              placeholder="Contoh: Iuran HUT RI Agustus 2026"
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-800 outline-none focus:border-primary-400 focus:ring-3 focus:ring-primary-100"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">
                Periode <span className="text-primary-600">*</span>
              </span>
              <select
                value={effectivePeriodeId}
                disabled={optionsLoading}
                onChange={(e) => setIdPeriode(e.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-primary-400 disabled:bg-neutral-50 disabled:text-neutral-400"
              >
                {periodes.length === 0 ? (
                  <option value="">{optionsLoading ? 'Memuat periode...' : 'Belum ada periode'}</option>
                ) : (
                  periodes.map((p) => (
                    <option key={p.id_periode} value={String(p.id_periode)}>
                      {p.judul} ({p.tahun}) {p.status.toLowerCase() === 'aktif' ? '— Aktif' : ''}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">
                Nominal (Rp) <span className="text-primary-600">*</span>
              </span>
              <input
                type="number"
                required
                min={1}
                step="any"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                placeholder="50000"
                className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-800 outline-none focus:border-primary-400 focus:ring-3 focus:ring-primary-100"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">
              Tanggal jatuh tempo <span className="text-primary-600">*</span>
            </span>
            <input
              type="date"
              required
              value={jatuhTempo}
              onChange={(e) => setJatuhTempo(e.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-800 outline-none focus:border-primary-400 focus:ring-3 focus:ring-primary-100"
            />
          </label>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-neutral-700">
              Target penerima <span className="text-primary-600">*</span>
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTarget('Semua')}
                className={`rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                  target === 'Semua'
                    ? 'border-primary-400 bg-primary-50 font-semibold text-primary-700'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-200'
                }`}
              >
                Semua Warga
              </button>
              <button
                type="button"
                disabled={!canSelectSpecificWarga}
                onClick={() => {
                  if (canSelectSpecificWarga) setTarget('Tertentu');
                }}
                className={`rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                  target === 'Tertentu'
                    ? 'border-primary-400 bg-primary-50 font-semibold text-primary-700'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-200'
                } disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400`}
              >
                Warga Tertentu
              </button>
            </div>
            {!canSelectSpecificWarga && !optionsLoading && (
              <p className="text-xs leading-5 text-neutral-400">
                Pemilihan warga tertentu memerlukan akses data warga (khusus Admin). Panitia dapat membuat tagihan untuk Semua Warga.
              </p>
            )}

            {target === 'Tertentu' && canSelectSpecificWarga && (
              <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-neutral-700">
                    Pilih Warga ({selectedWargaIds.length} dipilih)
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedWargaIds(wargaOptions.map((w) => w.id_warga))}
                      className="font-semibold text-primary-600 hover:underline"
                    >
                      Pilih Semua
                    </button>
                    {selectedWargaIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedWargaIds([])}
                        className="font-medium text-neutral-500 hover:underline"
                      >
                        Kosongkan
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="search"
                  value={wargaSearch}
                  onChange={(e) => setWargaSearch(e.target.value)}
                  placeholder="Cari nama warga atau RT/RW..."
                  className="mb-2 h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800 outline-none focus:border-primary-400"
                />
                <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                  {filteredWarga.map((warga) => {
                    const checked = selectedWargaIds.includes(warga.id_warga);
                    const regionLabel = [
                      warga.nomor_rt ? `RT ${warga.nomor_rt}` : null,
                      warga.nomor_rw ? `RW ${warga.nomor_rw}` : null,
                    ].filter(Boolean).join(' / ');
                    return (
                      <label
                        key={warga.id_warga}
                        className={`flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs transition ${
                          checked ? 'bg-primary-50 text-primary-800' : 'bg-white text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleWarga(warga.id_warga)}
                            className="size-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="font-medium">{warga.nama}</span>
                        </span>
                        {regionLabel && <span className="text-[11px] text-neutral-400">{regionLabel}</span>}
                      </label>
                    );
                  })}
                  {filteredWarga.length === 0 && (
                    <p className="py-4 text-center text-xs text-neutral-400">Tidak ada warga aktif cocok.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-neutral-700">Keterangan (opsional)</span>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Iuran kebersihan dan perlengkapan acara 17 Agustus"
              className="w-full rounded-xl border border-neutral-200 p-3 text-sm text-neutral-800 outline-none focus:border-primary-400 focus:ring-3 focus:ring-primary-100"
            />
          </label>
        </form>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-neutral-100 bg-neutral-50/50 px-6 py-4">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="min-h-10 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="tagihan-form"
            disabled={submitting}
            className="min-h-10 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Buat Tagihan'}
          </button>
        </footer>
      </section>
    </div>
  );
}

export function TagihanToolbarActions({
  onTagihanChanged,
  onFeedback,
}: {
  onTagihanChanged: () => Promise<void>;
  onFeedback: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const optionsQuery = useQuery({
    queryKey: queryKeys.managementTagihanOptions,
    queryFn: ({ signal }) => getTagihanFormOptions(signal),
    staleTime: STALE_TIME.MODERATE,
  });

  const periodes = useMemo(
    () => optionsQuery.data?.data.periodes ?? [],
    [optionsQuery.data?.data.periodes],
  );
  const wargaOptions = optionsQuery.data?.data.wargaOptions ?? [];
  const canSelectSpecificWarga = optionsQuery.data?.data.canSelectSpecificWarga ?? false;

  async function refreshAllTagihanCaches(successText: string) {
    onFeedback(successText);
    await queryClient.invalidateQueries({ queryKey: ['management', 'tagihan'] });
    void queryClient.invalidateQueries({ queryKey: ['warga-iuran-aktif'] });
    await onTagihanChanged();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="inline-flex min-h-9 items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
      >
        + Tambah Tagihan
      </button>

      {createOpen && (
        <CreateTagihanModal
          periodes={periodes}
          wargaOptions={wargaOptions}
          canSelectSpecificWarga={canSelectSpecificWarga}
          optionsLoading={optionsQuery.isLoading}
          onClose={() => setCreateOpen(false)}
          onSaved={refreshAllTagihanCaches}
        />
      )}
    </>
  );
}
