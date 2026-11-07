"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { ApiRequestError } from "@/lib/api/client";
import { daftarLomba, getDaftarLomba } from "@/lib/api/lomba";
import {
  buildAgendaDateTabs,
  formatTanggalIndonesia,
  formatWaktu,
  getScheduleTimingStatus,
  jakartaToday,
} from "@/lib/lomba-date";
import type { JadwalLomba, Lomba } from "@/types/lomba";

const STATUS_OPTIONS = ["Semua", "Segera", "Selesai"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

interface Notice {
  type: "success" | "error";
  message: string;
}

interface AgendaItem {
  lomba: Lomba;
  jadwal: JadwalLomba;
}

function normalize(value: string): string {
  return value.toLocaleLowerCase("id-ID").trim();
}

function isGenericDescription(value: string | null): boolean {
  return value !== null
    && normalize(value).replace(/\.$/, "") === "perlombaan dalam rangka hut ri ke-81";
}

function matchesStatus(lomba: Lomba, status: StatusFilter, now: Date): boolean {
  if (status === "Semua") return true;
  if (lomba.jadwal.length === 0) return false;
  const timingStatus = lomba.jadwal.some((item) => getScheduleTimingStatus(item, now) === "Segera")
    ? "Segera"
    : "Selesai";
  return timingStatus === status;
}

function primarySchedule(lomba: Lomba): JadwalLomba | undefined {
  return [...lomba.jadwal].sort((left, right) => {
    const leftKey = `${left.tanggal} ${left.waktu_mulai ?? ""}`;
    const rightKey = `${right.tanggal} ${right.waktu_mulai ?? ""}`;
    return leftKey.localeCompare(rightKey);
  })[0];
}

function scheduleTime(jadwal: JadwalLomba): string {
  return `${formatWaktu(jadwal.waktu_mulai)} - ${formatWaktu(jadwal.waktu_selesai)}`;
}

export default function LombaPage() {
  const [lombaList, setLombaList] = useState<Lomba[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("Semua");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedLomba, setSelectedLomba] = useState<Lomba | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await getDaftarLomba(controller.signal);
        setLombaList(response.data);
        setAvailableDates(response.tanggal_tersedia);
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : "Daftar lomba gagal dimuat.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [retryKey]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 5_000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const dateTabs = useMemo(
    () => buildAgendaDateTabs(availableDates, jakartaToday(now)),
    [availableDates, now],
  );
  const effectiveDate = dateTabs.some((tab) => tab.date === selectedDate)
    ? selectedDate
    : dateTabs[0]?.date ?? null;

  const categories = useMemo(() => {
    const values = lombaList
      .map((item) => item.kategori?.nama_kategori)
      .filter((value): value is string => Boolean(value));
    return ["Semua", ...new Set(values)];
  }, [lombaList]);

  const query = normalize(searchQuery);
  const matchesCommonFilters = useCallback((lomba: Lomba): boolean => {
    if (activeCategory !== "Semua" && lomba.kategori?.nama_kategori !== activeCategory) return false;
    if (!matchesStatus(lomba, activeStatus, now)) return false;
    if (!query) return true;
    const searchable = [
      lomba.nama_lomba,
      lomba.deskripsi ?? "",
      lomba.status,
      lomba.jenis_pendaftaran,
      lomba.kategori?.nama_kategori ?? "",
      ...lomba.jadwal.map((item) => item.lokasi ?? ""),
    ];
    return searchable.some((value) => normalize(value).includes(query));
  }, [activeCategory, activeStatus, now, query]);

  const filteredLomba = useMemo(
    () => lombaList.filter(matchesCommonFilters),
    [lombaList, matchesCommonFilters],
  );

  const agenda = useMemo<AgendaItem[]>(() => {
    if (!effectiveDate) return [];
    return lombaList
      .filter(matchesCommonFilters)
      .flatMap((lomba) => lomba.jadwal
        .filter((jadwal) => jadwal.tanggal === effectiveDate)
        .map((jadwal) => ({ lomba, jadwal })))
      .sort((left, right) => (left.jadwal.waktu_mulai ?? "").localeCompare(right.jadwal.waktu_mulai ?? ""));
  }, [lombaList, effectiveDate, matchesCommonFilters]);

  async function handleRegistration() {
    if (!selectedLomba || isSubmitting) return;
    const target = selectedLomba;
    setIsSubmitting(true);
    try {
      const response = await daftarLomba(target.id_lomba);
      setLombaList((items) => items.map((item) => item.id_lomba === target.id_lomba
        ? { ...item, sudah_mendaftar: true }
        : item));
      setSelectedLomba(null);
      setNotice({ type: "success", message: response.message || `Pendaftaran ${target.nama_lomba} berhasil dikirim.` });
    } catch (error) {
      const message = error instanceof ApiRequestError
        ? error.message
        : "Pendaftaran gagal diproses. Silakan coba lagi.";
      setNotice({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedSchedule = selectedLomba ? primarySchedule(selectedLomba) : undefined;

  if (isLoading && !loadError && lombaList.length === 0) {
    return <PageSkeleton variant="lomba" />;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-8 px-5 py-10 md:px-15">
        <header>
          <h1 className="text-h4 font-bold text-neutral-900 md:text-h2">Daftar Lomba</h1>
          <p className="mt-2 text-body-1 text-neutral-600">Pilih dan ikuti lomba yang tersedia</p>
        </header>

        {notice && (
          <div
            role={notice.type === "error" ? "alert" : "status"}
            className={`flex items-start justify-between gap-4 rounded-xl border px-5 py-4 shadow-sm ${
              notice.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-error-200"
            }`}
          >
            <span className="font-semibold">{notice.message}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Tutup pemberitahuan" className="font-bold">×</button>
          </div>
        )}

        <section aria-label="Pencarian dan filter lomba" className="flex w-full flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Cari lomba</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama lomba, lokasi, atau status"
                className="h-12 w-full rounded-xl bg-neutral-100 pl-5 pr-12 text-body-2 font-medium text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:ring-2 focus:ring-primary-500"
              />
              <Image src="/icons/search.svg" alt="" width={22} height={22} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-50" />
            </label>

            <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1.5" aria-label="Filter status">
              {STATUS_OPTIONS.map((status) => (
                <button
                  type="button"
                  key={status}
                  aria-pressed={activeStatus === status}
                  onClick={() => setActiveStatus(status)}
                  className={`flex h-full items-center justify-center whitespace-nowrap rounded-lg px-6 text-body-2 font-bold transition-colors ${
                    activeStatus === status
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1" aria-label="Filter kategori">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap rounded-xl px-7 py-2.5 text-body-2 font-bold transition-colors ${
                  activeCategory === category
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {loadError ? (
          <section role="alert" className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-h6 font-bold text-neutral-900">Daftar lomba belum dapat dimuat</h2>
            <p className="mt-2 text-body-2 text-neutral-600">{loadError}</p>
            <Button className="mt-5" onClick={() => setRetryKey((value) => value + 1)}>Coba Lagi</Button>
          </section>
        ) : (
          <>
            <section className="mt-2 flex flex-col gap-6" aria-labelledby="agenda-title">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <h2 id="agenda-title" className="text-h6 font-bold text-neutral-900 md:text-h4">Jadwal dan Agenda Perlombaan</h2>
                <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-white p-1.5 shadow-sm" aria-label="Pilih tanggal agenda">
                  {dateTabs.map((tab) => (
                    <button
                      type="button"
                      key={tab.date}
                      aria-pressed={effectiveDate === tab.date}
                      onClick={() => setSelectedDate(tab.date)}
                      className={`whitespace-nowrap rounded-lg px-7 py-2.5 text-body-2 font-bold transition-colors ${
                        effectiveDate === tab.date
                          ? "bg-primary-600 text-white shadow-sm"
                          : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {agenda.length > 0 ? (
                  agenda.map(({ lomba, jadwal }) => (
                    <article key={jadwal.id_jadwal} className="flex flex-col items-center gap-6 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:p-6">
                      <div className="flex w-full shrink-0 items-center justify-center rounded-xl bg-primary-100 px-6 py-4 text-primary-600 md:w-auto">
                        <span className="whitespace-nowrap text-h6 font-bold">{scheduleTime(jadwal)}</span>
                      </div>
                      <div className="flex w-full flex-1 flex-col gap-2 text-center md:text-left">
                        <h3 className="text-h6 font-bold text-neutral-900 md:text-h4">{lomba.nama_lomba}</h3>
                        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                          {lomba.kategori && <Badge variant="soft" color="secondary">{lomba.kategori.nama_kategori}</Badge>}
                          <Badge variant="solid" color={getScheduleTimingStatus(jadwal, now) === "Selesai" ? "neutral" : "primary"}>
                            {getScheduleTimingStatus(jadwal, now)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex w-full shrink-0 items-center justify-center gap-2 text-primary-600 md:w-auto md:justify-end">
                        <Image src="/icons/location.svg" alt="" width={20} height={20} />
                        <span className="text-body-2 font-bold">{jadwal.lokasi ?? "Lokasi belum tersedia"}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white p-8 text-center text-neutral-600 shadow-sm">
                    Tidak ada agenda yang cocok pada tanggal ini.
                  </div>
                )}
              </div>
            </section>

            <section className="mt-10 flex flex-col gap-6" aria-labelledby="competition-list-title">
              <h2 id="competition-list-title" className="text-h6 font-bold text-neutral-900 md:text-h4">Daftar dan Detail Lomba</h2>
              {filteredLomba.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredLomba.map((lomba) => {
                    const jadwal = primarySchedule(lomba);
                    const isOpen = normalize(lomba.status) === "dibuka";
                    const canRegister = isOpen && !lomba.sudah_mendaftar;
                    return (
                      <article key={lomba.id_lomba} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-2">
                            {lomba.kategori && <Badge variant="soft" color="secondary">{lomba.kategori.nama_kategori}</Badge>}
                          </div>
                          <Badge variant="solid" color={isOpen ? "success" : "neutral"}>{lomba.status}</Badge>
                        </div>

                        <h3 className="mb-1 text-h6 font-bold leading-tight text-primary-600 md:text-h4">{lomba.nama_lomba}</h3>
                        <p className="mb-4 text-body-3 font-semibold text-primary-600">
                          {jadwal ? formatTanggalIndonesia(jadwal.tanggal) : "Jadwal belum tersedia"}
                        </p>
                        {lomba.deskripsi && !isGenericDescription(lomba.deskripsi) && (
                          <p className="mb-5 line-clamp-3 text-body-2 text-neutral-600">{lomba.deskripsi}</p>
                        )}

                        <div className="mb-6 flex flex-col gap-3 rounded-xl bg-primary-100 p-4">
                          <div className="flex items-center gap-3">
                            <Image src="/icons/groups.svg" alt="" width={20} height={20} />
                            <span className="text-body-3 font-semibold text-primary-600">
                              {lomba.jenis_pendaftaran}
                              {lomba.jenis_pendaftaran === "Beregu" && lomba.batas_anggota_tim
                                ? ` · Maks. ${lomba.batas_anggota_tim} anggota/regu`
                                : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Image src="/icons/location.svg" alt="" width={20} height={20} />
                            <span className="text-body-3 font-semibold text-primary-600">{jadwal?.lokasi ?? "Lokasi belum tersedia"}</span>
                          </div>
                        </div>

                        <Button
                          variant="solid"
                          color={canRegister ? "primary" : "neutral"}
                          size="L"
                          className="mt-auto w-full font-bold"
                          disabled={!canRegister}
                          onClick={() => setSelectedLomba(lomba)}
                        >
                          {lomba.sudah_mendaftar ? "Sudah Terdaftar" : isOpen ? "Daftar Sekarang" : "Pendaftaran Ditutup"}
                        </Button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-8 text-center text-neutral-600 shadow-sm">Lomba tidak ditemukan.</div>
              )}
            </section>
          </>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedLomba)}
        onClose={() => { if (!isSubmitting) setSelectedLomba(null); }}
        ariaLabel="Konfirmasi pendaftaran lomba"
      >
        {selectedLomba && (
          <div className="flex w-full flex-col gap-6 p-6 md:p-9">
            <div>
              <p className="text-body-3 font-bold uppercase tracking-wide text-primary-600">Konfirmasi Pendaftaran</p>
              <h2 className="mt-1 text-h6 font-bold text-neutral-900 md:text-h4">{selectedLomba.nama_lomba}</h2>
              <p className="mt-2 text-body-2 text-neutral-600">
                Pastikan lomba yang dipilih sudah benar sebelum mengirim pendaftaran.
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl bg-neutral-50 p-5 sm:grid-cols-2">
              <div>
                <p className="text-body-4 font-semibold uppercase text-neutral-500">Jenis pendaftaran</p>
                <p className="mt-1 font-bold text-neutral-900">{selectedLomba.jenis_pendaftaran}</p>
              </div>
              <div>
                <p className="text-body-4 font-semibold uppercase text-neutral-500">Kategori</p>
                <p className="mt-1 font-bold text-neutral-900">{selectedLomba.kategori?.nama_kategori ?? "Umum"}</p>
              </div>
              <div>
                <p className="text-body-4 font-semibold uppercase text-neutral-500">Tanggal dan waktu</p>
                <p className="mt-1 font-bold text-neutral-900">
                  {selectedSchedule
                    ? `${formatTanggalIndonesia(selectedSchedule.tanggal)}, ${scheduleTime(selectedSchedule)}`
                    : "Jadwal belum tersedia"}
                </p>
              </div>
              <div>
                <p className="text-body-4 font-semibold uppercase text-neutral-500">Lokasi</p>
                <p className="mt-1 font-bold text-neutral-900">{selectedSchedule?.lokasi ?? "Lokasi belum tersedia"}</p>
              </div>
            </div>

            {selectedLomba.jenis_pendaftaran === "Beregu" && (
              <div className="rounded-xl border border-secondary-300 bg-secondary-100 p-4 text-body-2 text-neutral-800">
                <p className="font-bold">Regu dibentuk otomatis oleh sistem</p>
                <p className="mt-1">
                  Anda tidak perlu memasukkan anggota. Peserta akan diacak ke dalam regu
                  {selectedLomba.batas_anggota_tim ? ` dengan maksimal ${selectedLomba.batas_anggota_tim} anggota per regu` : ""}.
                </p>
              </div>
            )}

            <p className="text-body-2 text-neutral-600">
              Data peserta akan menggunakan identitas warga dari akun yang sedang masuk. Lanjutkan pendaftaran?
            </p>

            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <Button variant="ghost" color="neutral" size="L" disabled={isSubmitting} onClick={() => setSelectedLomba(null)}>
                Kembali
              </Button>
              <Button size="L" disabled={isSubmitting} onClick={() => void handleRegistration()}>
                {isSubmitting ? "Mengirim…" : "Ya, Daftar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
