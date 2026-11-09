"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { getBeranda } from "@/lib/api/beranda";
import { ApiRequestError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { BerandaAgenda, BerandaData } from "@/types/beranda";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
const tabDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  timeZone: "Asia/Jakarta",
});
const fallbackAgendaVisuals = [
  { icon: "/icons/workout.svg", background: "bg-primary-100" },
  { icon: "/icons/flag.svg", background: "bg-secondary-100" },
  { icon: "/icons/groups.svg", background: "bg-neutral-100" },
  { icon: "/icons/night.svg", background: "bg-primary-100" },
] as const;

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatTabDate(value: string) {
  const date = new Date(`${value}T00:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? value : tabDateFormatter.format(date);
}

function jakartaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function initialAgendaDate() {
  return jakartaToday();
}

function formatClock(value: string | null) {
  if (!value) return 'Waktu belum ditentukan';
  const match = value.match(/(?:^| )(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : value;
}

function formatPublishedAt(value: string) {
  const [date, time] = value.split(" ");
  if (!date || !time) return value;
  return `${formatDate(date)}, ${formatClock(time)} WIB`;
}

function agendaTime(item: BerandaAgenda) {
  if (item.waktu_mulai && item.waktu_selesai) {
    return `${formatClock(item.waktu_mulai)} - ${formatClock(item.waktu_selesai)}`;
  }
  if (item.waktu_mulai) return formatClock(item.waktu_mulai);
  if (item.waktu_selesai) return `Sampai ${formatClock(item.waktu_selesai)}`;
  return 'Waktu belum ditentukan';
}

function agendaVisual(item: BerandaAgenda) {
  const name = item.nama_lomba.toLocaleLowerCase("id-ID");
  if (name.includes("futsal")) return fallbackAgendaVisuals[0];
  if (name.includes("makan kerupuk")) return fallbackAgendaVisuals[1];
  if (name.includes("tarik tambang") || name.includes("estafet")) return fallbackAgendaVisuals[2];
  if (name.includes("mewarnai") || name.includes("catur")) return fallbackAgendaVisuals[3];
  return fallbackAgendaVisuals[Math.abs(item.id_lomba) % fallbackAgendaVisuals.length];
}

export default function HomePage() {
  const [data, setData] = useState<BerandaData | null>(null);
  const [selectedAgenda, setSelectedAgenda] = useState<BerandaAgenda | null>(null);
  const [isAnnouncementOpen, setAnnouncementOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [requestVersion, setRequestVersion] = useState(0);
  const [requestedDate, setRequestedDate] = useState(initialAgendaDate);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRequestVersion((version) => version + 1);
  }, []);

  const selectDate = useCallback((date: string) => {
    if (date === requestedDate) return;
    setLoading(true);
    setError(null);
    setRequestedDate(date);
  }, [requestedDate]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    void getBeranda(requestedDate, controller.signal)
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        if (reason instanceof ApiRequestError && reason.status === 401) {
          void useAuthStore.getState().fetchUser(true);
        }
        setError(reason instanceof Error ? reason.message : "Beranda gagal dimuat. Silakan coba lagi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [requestVersion, requestedDate]);

  if (isLoading && !data) {
    return <PageSkeleton variant="home" />;
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10 px-5 text-center">
        <p className="text-body-1 font-semibold text-neutral-900" role="alert">{error}</p>
        <Button onClick={retry}>Coba lagi</Button>
      </div>
    );
  }

  if (!data) return null;

  const {
    jadwal_agenda: agenda,
    pengumuman_terbaru: pengumuman,
    sedang_berlangsung: pertandingan,
    tanggal_filter: tanggalFilter,
  } = data;
  const availableDates = data.tanggal_tersedia?.length
    ? data.tanggal_tersedia
    : [tanggalFilter];

  return (
    <div className="min-h-screen bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-12 px-5 py-10 md:px-15">
        {error && (
          <div className="flex items-center justify-between gap-4 rounded-lg bg-amber-50 p-4" role="alert">
            <p className="text-body-2 text-neutral-900">{error}</p>
            <Button variant="ghost" size="S" onClick={retry} disabled={isLoading}>Coba lagi</Button>
          </div>
        )}

        <section className="flex w-full flex-col gap-4">
          <div className="flex w-fit items-center gap-2 rounded-md bg-white px-4 py-1">
            <Image src="/icons/calendar-date.svg" alt="" width={24} height={24} />
            <p className="text-body-2 font-bold text-primary-600">{formatDate(tanggalFilter)}</p>
          </div>

          <div className="relative flex min-h-100 w-full items-center overflow-hidden rounded-lg bg-white p-10 md:p-16">
            <div className="relative z-10">
              <h1 className="mb-4 text-[40px] leading-tight font-bold text-neutral-900 md:text-[68px]">
                Semarak HUT RI <span className="text-primary-600">ke-81</span>
              </h1>
              <p className="text-body-2 text-neutral-400 md:text-body-1">“Nusantara Bersuka, Indonesia Berjaya”</p>
            </div>
            <div className="pointer-events-none absolute top-1/2 -right-5 -translate-y-1/2 select-none md:-right-10">
              <span className="text-[150px] leading-none font-bold text-primary-100 md:text-[280px]">81</span>
            </div>
          </div>
        </section>

        {pengumuman && (
          <section>
            <div className="flex w-full flex-col justify-between gap-6 rounded-lg bg-white p-6 md:flex-row md:items-center md:p-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <Badge variant="solid" color="primary" className="px-3 py-1 text-body-4">Pengumuman Terbaru</Badge>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Image src="/icons/clock-circle.svg" alt="" width={18} height={18} />
                    <span className="mt-0.5 text-body-4 font-semibold">{formatPublishedAt(pengumuman.tanggal_publikasi)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-h5 font-bold text-neutral-900">{pengumuman.judul}</h2>
                  <p className="mt-1 line-clamp-2 max-w-2xl text-body-2 text-neutral-400">{pengumuman.isi}</p>
                </div>
              </div>
              <div className="shrink-0">
                <Button variant="ghost" color="primary" size="M" className="font-bold" onClick={() => setAnnouncementOpen(true)}>
                  Lihat Detail
                  <Image src="/icons/round-arrow-right.svg" alt="" width={24} height={24} />
                </Button>
              </div>
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="mb-6 flex items-center gap-3">
            <Image src="/icons/alert.svg" alt="" width={28} height={28} />
            <h2 className="text-h6 font-bold text-primary-600">Sedang Berlangsung</h2>
          </div>

          {pertandingan.length ? (
            <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
              {pertandingan.map((item) => (
                <article key={item.id_pertandingan} className="flex flex-col gap-5 rounded-lg bg-white p-6">
                  <div className="flex items-center justify-between gap-4">
                    {item.babak ? (
                      <Badge variant="soft" color="secondary" className="px-5 py-1 text-body-3">
                        {item.babak}
                      </Badge>
                    ) : <span />}
                    <div className="flex items-center gap-2 text-primary-600">
                      <span className="text-body-3 font-bold">{item.lokasi ?? "Lokasi belum ditentukan"}</span>
                      <Image src="/icons/location.svg" alt="" width={20} height={20} />
                    </div>
                  </div>
                  <h3 className="text-h4 font-bold text-neutral-900">{item.nama_lomba}</h3>
                  <div className="mt-2 flex flex-col items-center justify-between gap-4 rounded-lg bg-neutral-50 p-6 sm:flex-row">
                    <p className="flex-1 text-center text-body-2 font-bold text-neutral-900">{item.peserta_1}</p>
                    <Badge variant="solid" color="primary" className="shrink-0 px-5 py-2 text-h6">VS</Badge>
                    <p className="flex-1 text-center text-body-2 font-bold text-neutral-900">{item.peserta_2}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white p-8 text-center text-body-2 text-neutral-500">
              Tidak ada pertandingan yang sedang berlangsung.
            </div>
          )}
        </section>

        <section className="mx-auto mt-4 w-full max-w-300 rounded-lg bg-white p-8 md:p-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <h2 className="text-h4 font-bold text-neutral-900">Jadwal dan Agenda</h2>
            <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-neutral-50 p-1.5">
              {availableDates.map((date) => {
                const isActive = tanggalFilter === date;
                return (
                  <button
                    key={date}
                    type="button"
                    aria-pressed={isActive}
                    disabled={isActive || isLoading}
                    className={`cursor-pointer whitespace-nowrap rounded-lg px-8 py-2.5 text-body-2 font-bold transition-colors disabled:cursor-default ${
                      isActive
                        ? "bg-primary-600 text-white shadow-sm"
                        : "text-neutral-600 enabled:hover:bg-neutral-200"
                    }`}
                    onClick={() => selectDate(date)}
                  >
                    {formatTabDate(date)}
                  </button>
                );
              })}
            </div>
          </div>

          {agenda.length ? (
            <div className="mt-10 flex w-full flex-col gap-10">
              {agenda.map((item) => {
                const visual = agendaVisual(item);
                return (
                  <article key={item.id_jadwal} className="flex w-full flex-col gap-6 md:flex-row md:items-center md:gap-0">
                    <div className={`mx-auto w-fit shrink-0 rounded-[20px] p-4 md:mx-0 ${visual.background}`}>
                      <Image src={visual.icon} alt="" width={48} height={48} className="h-10 w-10 md:h-12 md:w-12" />
                    </div>
                    <div className="flex flex-1 flex-col justify-center text-center md:ml-8 md:text-left">
                      <div className="flex items-center justify-center gap-3 md:justify-start">
                        <p className="text-body-3 font-bold text-primary-600">{agendaTime(item)}</p>
                        <Badge variant="soft" color="secondary">{item.nama_kategori}</Badge>
                      </div>
                      <h3 className="-mt-1 text-h5 font-bold text-neutral-900">{item.nama_lomba}</h3>
                      <p className="flex items-center justify-center text-body-3 text-neutral-500 md:justify-start">
                        <Image src="/icons/location_outline.svg" alt="" width={20} height={20} className="mr-1" />
                        {item.lokasi ?? "Lokasi belum ditentukan"}
                      </p>
                    </div>
                    <div className="flex shrink-0 justify-center font-bold md:block">
                      <Button variant="ghost" color="primary" size="M" onClick={() => setSelectedAgenda(item)}>
                        Lihat Detail
                        <Image src="/icons/round-arrow-right.svg" alt="" width={24} height={24} />
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-10 rounded-lg bg-neutral-50 p-8 text-center text-body-2 text-neutral-500">
              Belum ada jadwal pada tanggal ini.
            </p>
          )}
        </section>
      </div>

      <Modal isOpen={!!selectedAgenda} onClose={() => setSelectedAgenda(null)}>
        {selectedAgenda && (
          <div className="flex flex-col gap-6 p-10">
            <h2 className="mb-2 text-center text-h4 font-bold text-primary-600">{selectedAgenda.nama_lomba}</h2>
            <DetailField label="Kategori" value={selectedAgenda.nama_kategori} />
            <DetailField label="Tanggal" value={formatDate(selectedAgenda.tanggal)} />
            <DetailField label="Waktu" value={agendaTime(selectedAgenda)} />
            <DetailField label="Lokasi" value={selectedAgenda.lokasi ?? "Lokasi belum ditentukan"} />
          </div>
        )}
      </Modal>

      <Modal isOpen={isAnnouncementOpen} onClose={() => setAnnouncementOpen(false)}>
        {pengumuman && (
          <div className="flex flex-col gap-5 p-10">
            <Badge variant="solid" color="primary" className="mx-auto">Pengumuman Terbaru</Badge>
            <h2 className="text-center text-h4 font-bold text-primary-600">{pengumuman.judul}</h2>
            <p className="text-center text-body-3 font-semibold text-neutral-500">{formatPublishedAt(pengumuman.tanggal_publikasi)}</p>
            <p className="whitespace-pre-line text-body-2 leading-relaxed text-neutral-900">{pengumuman.isi}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-body-2 font-bold text-primary-600">{label}</span>
      <div className="rounded-xl bg-neutral-50 px-5 py-3">
        <p className="text-body-1 font-bold text-neutral-900">{value}</p>
      </div>
    </div>
  );
}
