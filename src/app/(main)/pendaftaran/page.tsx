"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { getRiwayatPendaftaran } from "@/lib/api/pendaftaran";
import { formatTanggalIndonesia, formatWaktu } from "@/lib/lomba-date";
import type { RiwayatJadwalLomba, RiwayatPendaftaran } from "@/types/pendaftaran";

function normalize(value: string): string {
  return value.toLocaleLowerCase("id-ID").trim();
}

function primarySchedule(item: RiwayatPendaftaran): RiwayatJadwalLomba | undefined {
  return [...item.lomba.jadwal].sort((left, right) => {
    const leftKey = `${left.tanggal} ${left.waktu_mulai ?? ""}`;
    const rightKey = `${right.tanggal} ${right.waktu_mulai ?? ""}`;
    return leftKey.localeCompare(rightKey);
  })[0];
}

function formatRegistrationDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value)).replace(" pukul ", ", ") + " WIB";
}

function scheduleTime(schedule: RiwayatJadwalLomba): string | null {
  if (!schedule.waktu_mulai && !schedule.waktu_selesai) return null;
  return `${formatWaktu(schedule.waktu_mulai)}–${formatWaktu(schedule.waktu_selesai)} WIB`;
}

function displayStatus(item: RiwayatPendaftaran): string {
  return normalize(item.status) === "dibatalkan" ? "Dibatalkan" : "Berhasil";
}

function statusBadge(status: string): {
  color: "primary" | "secondary" | "neutral" | "success";
  className?: string;
} {
  const value = normalize(status);
  if (value === "berhasil") {
    return { color: "success" };
  }
  if (value === "dibatalkan") {
    return { color: "primary", className: "bg-[#E53935] text-white" };
  }
  return { color: "neutral" };
}

export default function PendaftaranPage() {
  const [items, setItems] = useState<RiwayatPendaftaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [activeStatus, setActiveStatus] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await getRiwayatPendaftaran(controller.signal);
        setItems(response.data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : "Riwayat pendaftaran gagal dimuat.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [retryKey]);

  const statuses = useMemo(
    () => ["Semua", ...new Set(items.map(displayStatus))],
    [items],
  );

  const filteredItems = useMemo(() => {
    const query = normalize(searchQuery);
    return items.filter((item) => {
      if (activeStatus !== "Semua" && displayStatus(item) !== activeStatus) return false;
      if (!query) return true;

      const searchable = [
        item.lomba.nama_lomba,
        displayStatus(item),
        item.catatan ?? "",
        item.nama_tim ?? "",
        item.lomba.kategori?.nama_kategori ?? "",
        item.lomba.jenis_pendaftaran,
        ...item.lomba.jadwal.map((schedule) => schedule.lokasi ?? ""),
      ];
      return searchable.some((value) => normalize(value).includes(query));
    });
  }, [activeStatus, items, searchQuery]);

  if (isLoading && !loadError && items.length === 0) {
    return <PageSkeleton variant="pendaftaran" />;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-8 px-5 py-10 md:px-15">
        <header>
          <h1 className="text-h4 font-bold text-neutral-900 md:text-h2">Pendaftaran Saya</h1>
          <p className="mt-2 text-body-1 text-neutral-600">
            Pantau seluruh lomba yang sudah Anda ikuti.
          </p>
        </header>

        {loadError ? (
          <section role="alert" className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-h6 font-bold text-neutral-900">Riwayat pendaftaran belum dapat dimuat</h2>
            <p className="mt-2 text-body-2 text-neutral-600">{loadError}</p>
            <Button className="mt-5" onClick={() => setRetryKey((value) => value + 1)}>
              Coba Lagi
            </Button>
          </section>
        ) : (
          <>
            <section aria-label="Pencarian dan filter pendaftaran" className="flex flex-col gap-4">
              <label className="relative w-full">
                <span className="sr-only">Cari riwayat pendaftaran</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari nama lomba, lokasi, kategori, atau status"
                  className="h-14 w-full rounded-2xl bg-white/90 pl-6 pr-14 text-body-2 font-medium text-neutral-800 shadow-xs outline-none transition-all placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-primary-500"
                />
                <Image
                  src="/icons/search.svg"
                  alt=""
                  width={22}
                  height={22}
                  className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 opacity-50"
                />
              </label>

              {items.length > 0 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1" aria-label="Filter status pendaftaran">
                  {statuses.map((status) => (
                    <button
                      type="button"
                      key={status}
                      aria-pressed={activeStatus === status}
                      onClick={() => setActiveStatus(status)}
                      className={`whitespace-nowrap rounded-xl px-7 py-2 text-body-2 font-bold shadow-2xs transition-all ${
                        activeStatus === status
                          ? "bg-primary-600 text-white shadow-sm"
                          : "bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section aria-label="Riwayat pendaftaran" className="flex flex-col gap-5">
              {filteredItems.length === 0 ? (
                <div className="rounded-2xl bg-white p-12 text-center shadow-xs">
                  <h2 className="text-h6 font-bold text-neutral-900">
                    {items.length === 0 ? "Belum ada pendaftaran" : "Pendaftaran tidak ditemukan"}
                  </h2>
                  <p className="mt-2 text-body-2 text-neutral-500">
                    {items.length === 0
                      ? "Lomba yang Anda daftarkan akan muncul di halaman ini."
                      : "Coba ubah kata pencarian atau filter status."}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const schedule = primarySchedule(item);
                  const time = schedule ? scheduleTime(schedule) : null;
                  const shownStatus = displayStatus(item);
                  const badge = statusBadge(shownStatus);
                  const canShowCancellation = normalize(item.status) !== "dibatalkan";
                  return (
                    <article key={item.id_pendaftaran} className="rounded-2xl bg-white p-6 shadow-xs md:p-8">
                      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                        <div className="flex min-w-0 flex-col gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="solid" color={badge.color} className={badge.className}>
                              {shownStatus}
                            </Badge>
                            {item.lomba.kategori && (
                              <Badge variant="soft" color="neutral">{item.lomba.kategori.nama_kategori}</Badge>
                            )}
                          </div>
                          <h2 className="text-2xl font-bold leading-tight text-primary-600 md:text-[32px]">
                            {item.lomba.nama_lomba}
                          </h2>
                        </div>

                        <div className="flex shrink-0 flex-col gap-1.5 text-sm font-semibold text-neutral-800 sm:items-end md:text-body-3">
                          <span>{schedule ? formatTanggalIndonesia(schedule.tanggal) : "Jadwal belum tersedia"}</span>
                          {time && <span className="text-neutral-600">{time}</span>}
                          <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                            <Image src="/icons/location.svg" alt="" width={18} height={18} />
                            <span>{schedule?.lokasi ?? "Lokasi belum tersedia"}</span>
                          </div>
                          {item.lomba.jadwal.length > 1 && (
                            <span className="text-body-4 text-neutral-500">+{item.lomba.jadwal.length - 1} jadwal lainnya</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-4 border-t border-neutral-200 pt-4 md:flex-row md:items-center md:justify-between">
                        <span className="text-body-3 font-medium text-neutral-500">
                          Terdaftar {formatRegistrationDate(item.tanggal_daftar)}
                        </span>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          {item.lomba.jenis_pendaftaran === "Beregu" && item.id_tim !== null && (
                            <div className="rounded-xl bg-green-50 px-4 py-3 text-body-3 text-green-800">
                              <span>
                                Regu: <strong>{item.nama_tim ?? `#${item.id_tim}`}</strong>
                                {item.jumlah_anggota > 0 ? ` · ${item.jumlah_anggota} anggota` : ""}
                              </span>
                            </div>
                          )}

                          {canShowCancellation && (
                            <button
                              type="button"
                              disabled
                              title="Menunggu endpoint pembatalan dari backend"
                              aria-label="Batalkan pendaftaran, belum tersedia"
                              className="cursor-not-allowed rounded-xl bg-neutral-300 px-5 py-2.5 text-body-3 font-bold text-neutral-500"
                            >
                              Batalkan Pendaftaran
                            </button>
                          )}
                        </div>
                      </div>

                      {item.catatan && (
                        <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-body-3 text-neutral-700">
                          <strong>Catatan:</strong> {item.catatan}
                        </div>
                      )}

                    </article>
                  );
                })
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
