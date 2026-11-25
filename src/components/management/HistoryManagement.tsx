'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  DashboardHistoryDetailSkeleton,
  DashboardHistorySkeleton,
} from '@/components/management/DashboardLoadingSkeleton';
import { Icon, ManagementLayout } from '@/components/management/ManagementDashboard';
import { Modal } from '@/components/Modal';
import {
  addPemenangLomba,
  deletePemenang,
  getDaftarHistori,
  getDetailHistori,
  getPesertaLomba,
  updateHistoriPeriode,
  updatePemenang,
} from '@/lib/api/histori';
import type {
  DetailHistoriPeriode,
  LombaHistoriItem,
  PeriodeHistoriItem,
  PesertaLombaOption,
} from '@/types/histori';

interface WinnerEntry {
  id: string;
  idPemenang?: number;
  idLomba: number;
  competition: string;
  category: string;
  participants: string;
  location: string;
  winner: string;
  peringkat: number;
  keterangan?: string | null;
  tipePemenang: string;
  idPendaftaran?: number | null;
}

function formatDateRange(start: string | null, end: string | null, fallbackYear: string): string {
  if (!start && !end) return `Agustus ${fallbackYear}`;
  try {
    if (start && end) {
      const s = new Date(start.includes('T') ? start : `${start}T00:00:00Z`);
      const e = new Date(end.includes('T') ? end : `${end}T00:00:00Z`);
      const dayFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', timeZone: 'UTC' });
      const fullFormat = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
      return `${dayFormat.format(s)} – ${fullFormat.format(e)}`;
    }
    if (start) {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(start.includes('T') ? start : `${start}T00:00:00Z`));
    }
  } catch {
    // fallback to year
  }
  return `Agustus ${fallbackYear}`;
}

const inputClass =
  'h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:bg-neutral-100 disabled:text-neutral-500';

function WinnerForm({
  initial,
  lombaList,
  idPeriode,
  role,
  onClose,
  onSuccess,
}: {
  initial: WinnerEntry | null;
  lombaList: LombaHistoriItem[];
  idPeriode: number;
  role?: 'admin' | 'panitia';
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [selectedLombaId, setSelectedLombaId] = useState<string>(
    initial ? String(initial.idLomba) : lombaList.length > 0 ? String(lombaList[0].id_lomba) : '',
  );
  const [peringkat, setPeringkat] = useState<number>(initial?.peringkat ?? 1);
  const [keterangan, setKeterangan] = useState<string>(initial?.keterangan ?? '');
  const [participants, setParticipants] = useState<PesertaLombaOption[]>([]);
  const [selectedPesertaId, setSelectedPesertaId] = useState<string>(
    initial?.idPendaftaran ? String(initial.idPendaftaran) : '',
  );
  const [customWinnerName, setCustomWinnerName] = useState<string>(initial?.winner ?? '');
  const [isLoadingPeserta, setIsLoadingPeserta] = useState<boolean>(
    () => !initial && Boolean(lombaList[0]?.id_lomba),
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const currentLomba = useMemo(() => {
    return lombaList.find((l) => String(l.id_lomba) === selectedLombaId) ?? lombaList[0] ?? null;
  }, [lombaList, selectedLombaId]);

  useEffect(() => {
    if (initial) return; // In edit mode, winner identity is fixed
    if (!selectedLombaId) return;

    let active = true;

    getPesertaLomba(Number(selectedLombaId), role)
      .then((res) => {
        if (!active) return;
        setParticipants(res.data);
        if (res.data.length > 0) {
          setSelectedPesertaId(String(res.data[0].id_pendaftaran));
          setCustomWinnerName(res.data[0].nama_tim || res.data[0].nama);
        } else {
          setSelectedPesertaId('');
          setCustomWinnerName('');
        }
      })
      .catch(() => {
        if (!active) return;
        setParticipants([]);
        setSelectedPesertaId('');
      })
      .finally(() => {
        if (active) setIsLoadingPeserta(false);
      });

    return () => {
      active = false;
    };
  }, [selectedLombaId, initial, role]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    if (initial) {
      if (!initial.idPemenang) {
        setFormError('ID pemenang tidak ditemukan.');
        return;
      }
      setIsSubmitting(true);
      try {
        await updatePemenang(initial.idPemenang, {
          peringkat: Number(peringkat),
          keterangan: keterangan.trim() || null,
        });
        onSuccess(`Rekap pemenang ${initial.competition} berhasil diperbarui.`);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Gagal memperbarui pemenang.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!selectedLombaId) {
      setFormError('Silakan pilih cabang perlombaan.');
      return;
    }

    const targetPesertaId = selectedPesertaId ? Number(selectedPesertaId) : null;
    const finalWinnerName = customWinnerName.trim();

    if (!targetPesertaId && !finalWinnerName) {
      setFormError('Silakan pilih peserta terdaftar atau isi nama pemenang.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addPemenangLomba(idPeriode, Number(selectedLombaId), {
        tipe_pemenang: currentLomba?.jenis_pendaftaran || 'Individu',
        peringkat: Number(peringkat),
        id_pendaftaran: targetPesertaId,
        nama_pemenang: finalWinnerName || undefined,
        keterangan: keterangan.trim() || null,
      });
      onSuccess(`Pemenang ${currentLomba?.nama_lomba || ''} berhasil ditambahkan.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menambahkan pemenang.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} ariaLabel={initial ? 'Edit pemenang' : 'Input pemenang'}>
      <form onSubmit={submit}>
        <div className="border-b border-neutral-100 px-5 py-5 sm:px-7">
          <h2 className="text-xl font-semibold text-neutral-900">
            {initial ? 'Edit Pemenang' : 'Input Pemenang'}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {initial
              ? 'Perbarui peringkat atau keterangan rekap pemenang.'
              : 'Lengkapi rekap pemenang untuk perayaan ini.'}
          </p>
        </div>

        {formError && (
          <div className="mx-5 mt-4 rounded-xl border border-error-100 bg-error-10 px-4 py-3 text-sm font-medium text-error-100 sm:mx-7">
            {formError}
          </div>
        )}

        <div className="grid gap-4 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-neutral-700">Cabang perlombaan</span>
            {initial ? (
              <input value={initial.competition} disabled className={inputClass} />
            ) : (
              <select
                required
                value={selectedLombaId}
                onChange={(e) => {
                  setIsLoadingPeserta(Boolean(e.target.value));
                  setFormError('');
                  setSelectedLombaId(e.target.value);
                }}
                className={inputClass}
              >
                {lombaList.length === 0 && <option value="">Tidak ada perlombaan tersedia</option>}
                {lombaList.map((item) => (
                  <option key={item.id_lomba} value={item.id_lomba}>
                    {item.nama_lomba} ({item.kategori} - {item.jenis_pendaftaran})
                  </option>
                ))}
              </select>
            )}
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-neutral-700">Kategori</span>
            <input
              value={initial ? initial.category : currentLomba?.kategori ?? 'Umum'}
              disabled
              className={inputClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-neutral-700">Peringkat Juara</span>
            <select
              value={peringkat}
              onChange={(e) => setPeringkat(Number(e.target.value))}
              className={inputClass}
            >
              <option value={1}>Juara 1</option>
              <option value={2}>Juara 2</option>
              <option value={3}>Juara 3</option>
              <option value={4}>Juara Harapan 1</option>
              <option value={5}>Juara Harapan 2</option>
            </select>
          </label>

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-neutral-700">
              Pemenang {isLoadingPeserta ? '(Memuat peserta...)' : ''}
            </span>
            {initial ? (
              <input value={initial.winner} disabled className={inputClass} />
            ) : participants.length > 0 ? (
              <select
                required
                value={selectedPesertaId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedPesertaId(id);
                  const p = participants.find((item) => String(item.id_pendaftaran) === id);
                  if (p) setCustomWinnerName(p.nama_tim || p.nama);
                }}
                className={inputClass}
              >
                {participants.map((p) => (
                  <option key={p.id_pendaftaran} value={p.id_pendaftaran}>
                    {p.nama_tim ? `${p.nama_tim} (${p.nama})` : p.nama}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                maxLength={120}
                value={customWinnerName}
                onChange={(e) => setCustomWinnerName(e.target.value)}
                placeholder="Nama pemenang atau regu"
                className={inputClass}
              />
            )}
            {!initial && participants.length === 0 && !isLoadingPeserta && (
              <p className="text-xs text-neutral-400">
                Belum ada pendaftaran yang disetujui pada lomba ini. Nama pemenang dapat diisi manual.
              </p>
            )}
          </label>

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-neutral-700">Keterangan / Hadiah (Opsional)</span>
            <input
              maxLength={120}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Piala Bergilir + Hadiah Pembinaan"
              className={inputClass}
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-11 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteConfirmation({
  entry,
  onClose,
  onConfirm,
  isDeleting,
}: {
  entry: WinnerEntry;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Modal isOpen onClose={onClose} ariaLabel="Hapus rekap pemenang">
      <div className="p-6 sm:p-7">
        <span className="flex size-11 items-center justify-center rounded-xl bg-error-10 text-error-100">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
          </svg>
        </span>
        <h2 className="mt-4 text-lg font-semibold text-neutral-900">Hapus rekap pemenang?</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Data <span className="font-semibold text-neutral-700">{entry.competition}</span> - Juara{' '}
          {entry.peringkat} (<span className="font-medium text-neutral-700">{entry.winner}</span>)
          akan dihapus dari tampilan histori ini.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="min-h-10 rounded-xl bg-error-100 px-4 text-sm font-semibold text-white hover:bg-error-200 disabled:opacity-50"
          >
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function HistoryManagement({
  role,
  userName,
}: {
  role: 'admin' | 'panitia';
  userName: string;
}) {
  const [periods, setPeriods] = useState<PeriodeHistoriItem[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [periodDetail, setPeriodDetail] = useState<DetailHistoriPeriode | null>(null);
  const [periodsRefreshKey, setPeriodsRefreshKey] = useState(0);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  const [isLoadingPeriods, setIsLoadingPeriods] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [editingWinner, setEditingWinner] = useState<WinnerEntry | null>(null);
  const [isAddingWinner, setIsAddingWinner] = useState(false);
  const [deletingWinner, setDeletingWinner] = useState<WinnerEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  // Load periods on mount / retry
  useEffect(() => {
    let active = true;

    getDaftarHistori()
      .then((res) => {
        if (!active) return;
        const list = res.data ?? [];
        setPeriods(list);
        if (list.length > 0) {
          setIsLoadingDetail(true);
        }
        setSelectedPeriodId((prev) => {
          if (prev !== null && list.some((item) => item.id_periode === prev)) return prev;
          return list[0]?.id_periode ?? null;
        });
        setErrorMessage('');
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Gagal memuat daftar periode histori perayaan.',
        );
      })
      .finally(() => {
        if (active) setIsLoadingPeriods(false);
      });

    return () => {
      active = false;
    };
  }, [periodsRefreshKey]);

  // Function to load detail after manual mutations
  const fetchDetail = useCallback(
    async (id: number) => {
      setIsLoadingDetail(true);
      setPeriodDetail(null);
      setErrorMessage('');
      try {
        const res = await getDetailHistori(id);
        setPeriodDetail(res.data);
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Gagal memuat detail histori kegiatan perayaan.',
        );
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedPeriodId === null) return;
    let active = true;

    getDetailHistori(selectedPeriodId)
      .then((res) => {
        if (!active) return;
        setPeriodDetail(res.data);
        setErrorMessage('');
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Gagal memuat detail histori kegiatan perayaan.',
        );
      })
      .finally(() => {
        if (active) setIsLoadingDetail(false);
      });

    return () => {
      active = false;
    };
  }, [selectedPeriodId, detailRefreshKey]);

  const activePeriod = useMemo(() => {
    if (!periods.length) return null;
    return periods.find((p) => p.id_periode === selectedPeriodId) ?? periods[0] ?? null;
  }, [periods, selectedPeriodId]);

  const dateRangeText = useMemo(() => {
    if (!activePeriod) return '';
    return formatDateRange(
      periodDetail?.tanggal_mulai ?? activePeriod.tanggal_mulai,
      periodDetail?.tanggal_selesai ?? activePeriod.tanggal_selesai,
      activePeriod.tahun,
    );
  }, [periodDetail, activePeriod]);

  const displayTitle = useMemo(() => {
    if (!activePeriod) return '';
    return (
      periodDetail?.nama_kegiatan ||
      periodDetail?.judul ||
      activePeriod.nama_kegiatan ||
      activePeriod.judul ||
      `Perayaan ${activePeriod.tahun}`
    );
  }, [periodDetail, activePeriod]);

  const displayDescription = useMemo(() => {
    return (
      periodDetail?.deskripsi ??
      activePeriod?.deskripsi ??
      'Belum ada deskripsi rangkuman untuk perayaan ini.'
    );
  }, [periodDetail, activePeriod]);

  // Transform lomba & pemenang to flattened table rows
  const winners = useMemo<WinnerEntry[]>(() => {
    if (!periodDetail?.lomba) return [];

    const result: WinnerEntry[] = [];
    for (const l of periodDetail.lomba) {
      const participantsCount =
        l.jenis_pendaftaran === 'Beregu'
          ? `${l.jumlah_regu || l.jumlah_peserta} Regu`
          : `${l.jumlah_peserta} Peserta`;
      const location = l.lokasi && l.lokasi.length > 0 ? l.lokasi.join(', ') : 'Area Perayaan';

      if (l.pemenang && l.pemenang.length > 0) {
        for (const p of l.pemenang) {
          result.push({
            id: p.id_pemenang ? `winner-${p.id_pemenang}` : `lomba-${l.id_lomba}-${p.peringkat}`,
            idPemenang: p.id_pemenang,
            idLomba: l.id_lomba,
            competition: l.nama_lomba,
            category: l.kategori,
            participants: participantsCount,
            location,
            winner: p.nama_pemenang,
            peringkat: p.peringkat ?? 1,
            keterangan: p.keterangan,
            tipePemenang: p.tipe_pemenang || l.jenis_pendaftaran || 'Individu',
          });
        }
      }
    }

    return result;
  }, [periodDetail]);

  const filteredWinners = useMemo(() => {
    const s = query.trim().toLocaleLowerCase('id-ID');
    if (!s) return winners;
    return winners.filter((item) =>
      `${item.competition} ${item.category} ${item.participants} ${item.location} ${item.winner} Juara ${item.peringkat}`
        .toLocaleLowerCase('id-ID')
        .includes(s),
    );
  }, [query, winners]);

  function beginDescriptionEdit() {
    setDescriptionDraft(displayDescription);
    setIsEditingDescription(true);
    setNotice('');
  }

  async function saveDescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPeriodId) return;

    setIsSavingDescription(true);
    setErrorMessage('');
    try {
      await updateHistoriPeriode(selectedPeriodId, {
        deskripsi: descriptionDraft.trim(),
      });
      setPeriodDetail((prev) =>
        prev ? { ...prev, deskripsi: descriptionDraft.trim() } : null,
      );
      setIsEditingDescription(false);
      setNotice('Ringkasan perayaan berhasil diperbarui di backend.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal memperbarui ringkasan perayaan.',
      );
    } finally {
      setIsSavingDescription(false);
    }
  }

  async function confirmDeleteWinner() {
    if (!deletingWinner) return;

    if (!deletingWinner.idPemenang) {
      // Local fallback removal
      setPeriodDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lomba: prev.lomba.map((l) =>
            l.id_lomba === deletingWinner.idLomba
              ? {
                  ...l,
                  pemenang: l.pemenang.filter(
                    (p) =>
                      p.peringkat !== deletingWinner.peringkat ||
                      p.nama_pemenang !== deletingWinner.winner,
                  ),
                }
              : l,
          ),
        };
      });
      setNotice(`Rekap pemenang ${deletingWinner.competition} dihapus.`);
      setDeletingWinner(null);
      return;
    }

    setIsDeleting(true);
    try {
      await deletePemenang(deletingWinner.idPemenang);
      setNotice(`Rekap pemenang ${deletingWinner.competition} berhasil dihapus.`);
      setDeletingWinner(null);
      if (selectedPeriodId !== null) {
        await fetchDetail(selectedPeriodId);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal menghapus rekap pemenang.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ManagementLayout role={role} userName={userName} title="Histori" activeItem="history">
      <div className="space-y-7 lg:space-y-9">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Ruang {role === 'admin' ? 'Administrator' : 'Panitia'}
          </p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">
            Histori
          </h1>
        </div>

        {isLoadingPeriods ? (
          <DashboardHistorySkeleton />
        ) : periods.length === 0 ? (
          <section className="rounded-2xl border border-primary-100 bg-white px-6 py-12 text-center">
            <p className={`text-sm font-medium ${errorMessage ? 'text-error-100' : 'text-neutral-500'}`}>
              {errorMessage || 'Belum ada periode histori perayaan.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLoadingPeriods(true);
                setErrorMessage('');
                setPeriodsRefreshKey((key) => key + 1);
              }}
              className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Muat Ulang
            </button>
          </section>
        ) : (
          <>
            {/* Periode selector */}
            <section
              aria-label="Pilih histori perayaan"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-100 bg-white px-4 py-4 sm:px-5"
            >
              <label htmlFor="history-event" className="sr-only">
                Pilih perayaan
              </label>
              <select
                id="history-event"
                value={selectedPeriodId ?? ''}
                disabled={isLoadingPeriods}
                onChange={(e) => {
                  setIsLoadingDetail(true);
                  setSelectedPeriodId(Number(e.target.value));
                  setPeriodDetail(null);
                  setQuery('');
                  setNotice('');
                  setErrorMessage('');
                  setIsEditingDescription(false);
                }}
                className="h-10 min-w-48 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                {periods.map((item) => (
                  <option key={item.id_periode} value={item.id_periode}>
                    {item.nama_kegiatan || item.judul || `Perayaan ${item.tahun}`}
                  </option>
                ))}
              </select>
              <p className="text-sm font-medium text-neutral-400">{dateRangeText}</p>
            </section>

            {notice && (
              <p
                role="status"
                className="rounded-xl border border-success-100 bg-success-10 px-4 py-3 text-sm font-medium text-success-200"
              >
                {notice}
              </p>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-error-100 bg-error-10 px-4 py-3 text-sm font-medium text-error-100"
              >
                {errorMessage}
              </div>
            )}

            {isLoadingDetail && !periodDetail ? (
              <DashboardHistoryDetailSkeleton />
            ) : (
              <>
                {/* Ringkasan Perayaan */}
                <section
                  aria-labelledby="history-summary-title"
                  className="relative rounded-2xl border border-primary-100 bg-white p-5 sm:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 id="history-summary-title" className="text-lg font-semibold text-neutral-900 sm:text-xl">
                      {displayTitle}
                    </h2>
                    {!isEditingDescription && (
                      <button
                        type="button"
                        onClick={beginDescriptionEdit}
                        aria-label="Edit ringkasan perayaan"
                        title="Edit ringkasan"
                        className="shrink-0 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-primary-100/40 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                      >
                        <Icon name="edit" className="size-4.5" />
                      </button>
                    )}
                  </div>

                  {isEditingDescription ? (
                    <form onSubmit={saveDescription} className="mt-4">
                      <label htmlFor="history-description" className="sr-only">
                        Ringkasan perayaan
                      </label>
                      <textarea
                        id="history-description"
                        required
                        maxLength={2000}
                        autoFocus
                        value={descriptionDraft}
                        onChange={(e) => setDescriptionDraft(e.target.value)}
                        rows={5}
                        className="w-full resize-y rounded-xl border border-neutral-200 px-4 py-3 text-sm leading-6 text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                      />
                      <p className="mt-1 text-right text-xs text-neutral-400">
                        {descriptionDraft.length}/2.000
                      </p>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingDescription(false)}
                          disabled={isSavingDescription}
                          className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingDescription}
                          className="min-h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                        >
                          {isSavingDescription ? 'Menyimpan...' : 'Simpan Ringkasan'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-500 sm:text-base">
                      {displayDescription}
                    </p>
                  )}
                </section>

                {/* Tabel Rekap Juara Perlombaan */}
                <section
                  aria-labelledby="winner-heading"
                  className="overflow-hidden rounded-2xl border border-primary-100 bg-white"
                >
                  <div className="p-4 sm:p-5 lg:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h2
                        id="winner-heading"
                        className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl"
                      >
                        Rekap Juara Perlombaan
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingWinner(true);
                          setNotice('');
                        }}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                      >
                        <span aria-hidden="true" className="text-lg leading-none">
                          +
                        </span>
                        Input Pemenang
                      </button>
                    </div>
                    <div className="mt-4 max-w-lg">
                      <label htmlFor="winner-search" className="sr-only">
                        Cari rekap pemenang
                      </label>
                      <div className="relative">
                        <Icon
                          name="search"
                          className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400"
                        />
                        <input
                          id="winner-search"
                          type="search"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Cari nama, kategori, atau lokasi lomba"
                          className="h-11 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-11 text-sm text-neutral-800 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                      <caption className="sr-only">
                        Rekap pemenang perlombaan {displayTitle}
                      </caption>
                      <thead className="bg-neutral-50 text-xs font-semibold text-neutral-700">
                        <tr>
                          <th scope="col" className="px-5 py-4">
                            Cabang Perlombaan
                          </th>
                          <th scope="col" className="px-4 py-4">
                            Kategori
                          </th>
                          <th scope="col" className="px-4 py-4">
                            Partisipan
                          </th>
                          <th scope="col" className="px-4 py-4">
                            Lokasi Pelaksanaan
                          </th>
                          <th scope="col" className="px-4 py-4">
                            Pemenang
                          </th>
                          <th scope="col" className="px-4 py-4 text-right">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {filteredWinners.map((item) => (
                          <tr key={item.id} className="transition-colors hover:bg-neutral-50/70">
                            <th scope="row" className="px-5 py-4 font-semibold text-neutral-900">
                              {item.competition}
                            </th>
                            <td className="px-4 py-4 text-neutral-500">{item.category}</td>
                            <td className="px-4 py-4 text-neutral-500">{item.participants}</td>
                            <td className="px-4 py-4 text-neutral-500">{item.location}</td>
                            <td className="px-4 py-4 text-neutral-600">
                              <span className="font-semibold text-neutral-900">
                                Juara {item.peringkat}:
                              </span>{' '}
                              {item.winner}
                              {item.keterangan && (
                                <span className="block text-xs text-neutral-400">
                                  {item.keterangan}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingWinner(item);
                                    setNotice('');
                                  }}
                                  aria-label={`Edit pemenang ${item.competition}`}
                                  title="Edit"
                                  className="rounded-lg p-2 text-primary-600 hover:bg-primary-100/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                                >
                                  <Icon name="edit" className="size-4.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingWinner(item)}
                                  aria-label={`Hapus rekap ${item.competition}`}
                                  title="Hapus"
                                  className="rounded-lg p-2 text-primary-600 hover:bg-primary-100/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                                >
                                  <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="size-4.5"
                                  >
                                    <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredWinners.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-5 py-14 text-center">
                              <p className="font-semibold text-neutral-800">
                                {isLoadingDetail
                                  ? 'Memuat rekap pemenang...'
                                  : query
                                  ? 'Rekap tidak ditemukan'
                                  : 'Belum ada pemenang'}
                              </p>
                              <p className="mt-1 text-sm text-neutral-500">
                                {isLoadingDetail
                                  ? 'Silakan tunggu sebentar...'
                                  : query
                                  ? 'Coba kata kunci lain.'
                                  : 'Tambahkan hasil perlombaan untuk perayaan ini.'}
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 px-5 py-4 text-xs font-medium text-neutral-400">
                    <span>{filteredWinners.length} Pemenang</span>
                    <span>{displayTitle}</span>
                  </footer>
                </section>
              </>
            )}
          </>
        )}
      </div>

      {(isAddingWinner || editingWinner) && selectedPeriodId !== null && (
        <WinnerForm
          key={editingWinner?.id ?? 'new'}
          initial={editingWinner}
          lombaList={periodDetail?.lomba ?? []}
          idPeriode={selectedPeriodId}
          role={role}
          onClose={() => {
            setIsAddingWinner(false);
            setEditingWinner(null);
          }}
          onSuccess={(msg) => {
            setIsAddingWinner(false);
            setEditingWinner(null);
            setNotice(msg);
            setIsLoadingDetail(true);
            setDetailRefreshKey((key) => key + 1);
          }}
        />
      )}

      {deletingWinner && (
        <DeleteConfirmation
          entry={deletingWinner}
          isDeleting={isDeleting}
          onClose={() => setDeletingWinner(null)}
          onConfirm={confirmDeleteWinner}
        />
      )}
    </ManagementLayout>
  );
}
