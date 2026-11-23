"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { getAlbums } from "@/lib/api/dokumentasi";
import { getDaftarHistori, getDetailHistori } from "@/lib/api/histori";
import { DAFTAR_ALBUM, DEFAULT_PLACEHOLDER } from "@/lib/data/histori";
import type {
  DetailHistoriPeriode,
  LombaHistoriItem,
  PemenangLombaItem,
  PeriodeHistoriItem,
} from "@/types/histori";
import type { AlbumDokumentasi } from "@/types/management-dokumentasi";

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  fill?: boolean;
  className?: string;
}

function ImageWithFallback({
  src,
  alt,
  fill = false,
  className = "",
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  const effectiveSrc = !src || hasError ? DEFAULT_PLACEHOLDER : src;

  return (
    <Image
      src={effectiveSrc}
      alt={alt}
      fill={fill}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

function formatDateRange(
  mulai: string | null,
  selesai: string | null,
  tahun: string,
): string {
  if (!mulai && !selesai) return `14 - 17 Agustus ${tahun}`;
  if (mulai && selesai) {
    try {
      const dMulai = new Date(mulai);
      const dSelesai = new Date(selesai);
      const tglMulai = dMulai.getDate();
      const tglSelesai = dSelesai.getDate();
      const bulan = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(
        dSelesai,
      );
      const thn = dSelesai.getFullYear();
      return `${tglMulai} - ${tglSelesai} ${bulan} ${thn}`;
    } catch {
      return `${mulai} - ${selesai}`;
    }
  }
  return mulai || selesai || `Agustus ${tahun}`;
}

function formatTanggalAlbum(dateStr: string): string {
  if (!dateStr) return "Agustus 2026";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00Z`));
  } catch {
    return dateStr;
  }
}

function formatWinners(pemenangList: PemenangLombaItem[]): string {
  if (!pemenangList || pemenangList.length === 0) return "-";
  return pemenangList
    .map((p) => {
      const rank = p.peringkat ? `Juara ${p.peringkat}: ` : "";
      return `${rank}${p.nama_pemenang}`;
    })
    .join(", ");
}

export default function HistoriPage() {
  const [periods, setPeriods] = useState<PeriodeHistoriItem[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<DetailHistoriPeriode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [albums, setAlbums] = useState<AlbumDokumentasi[]>([]);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(true);

  // Load periods list
  useEffect(() => {
    const controller = new AbortController();
    async function loadPeriods() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await getDaftarHistori(undefined, controller.signal);
        setPeriods(response.data);
        if (response.data.length > 0) {
          setSelectedPeriodId((curr) => {
            if (curr && response.data.some((p) => p.id_periode === curr)) {
              return curr;
            }
            return response.data[0].id_periode;
          });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setLoadError(
            err instanceof Error ? err.message : "Daftar histori gagal dimuat.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }
    void loadPeriods();
    return () => controller.abort();
  }, [retryKey]);

  // Load period detail
  useEffect(() => {
    if (!selectedPeriodId) return;
    const controller = new AbortController();
    async function loadDetail() {
      setIsDetailLoading(true);
      try {
        const response = await getDetailHistori(
          selectedPeriodId as number,
          undefined,
          controller.signal,
        );
        setDetailData(response.data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setLoadError(
            err instanceof Error ? err.message : "Detail histori gagal dimuat.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsDetailLoading(false);
        }
      }
    }
    void loadDetail();
    return () => controller.abort();
  }, [selectedPeriodId, retryKey]);

  // Load albums from backend
  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingAlbums(true);

    getAlbums(
      selectedPeriodId ? { id_periode: selectedPeriodId } : undefined,
      controller.signal,
    )
      .then((res) => {
        if (res.data) {
          setAlbums(res.data);
        }
      })
      .catch(() => {
        // Fallback to static DAFTAR_ALBUM handled in useMemo
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingAlbums(false);
        }
      });

    return () => controller.abort();
  }, [selectedPeriodId, retryKey]);

  const activePeriod = useMemo(() => {
    return (
      detailData ??
      periods.find((p) => p.id_periode === selectedPeriodId) ??
      null
    );
  }, [detailData, periods, selectedPeriodId]);

  const selectedYear = activePeriod?.tahun ?? "2026";
  const formattedDateRange = useMemo(() => {
    return formatDateRange(
      activePeriod?.tanggal_mulai ?? null,
      activePeriod?.tanggal_selesai ?? null,
      selectedYear,
    );
  }, [activePeriod, selectedYear]);

  const displayAlbums = useMemo(() => {
    if (albums.length > 0) {
      return albums.map((a) => ({
        id: `live-${a.id_album}`,
        hrefKey: String(a.id_album),
        judul: a.nama_album,
        kategori: a.lomba?.nama_lomba || a.periode?.nama_kegiatan || 'Dokumentasi',
        tanggal: formatTanggalAlbum(a.tanggal_album),
        image: a.cover || DEFAULT_PLACEHOLDER,
      }));
    }
    return DAFTAR_ALBUM.map((a) => ({
      id: `static-${a.id}`,
      hrefKey: a.slug,
      judul: a.judul,
      kategori: a.kategori,
      tanggal: a.tanggal,
      image: a.image,
    }));
  }, [albums]);

  // Filter Table Data
  const filteredLomba = useMemo<LombaHistoriItem[]>(() => {
    if (!detailData?.lomba) return [];
    if (!searchQuery.trim()) return detailData.lomba;
    const q = searchQuery.toLowerCase().trim();
    return detailData.lomba.filter((item) => {
      const pemenangNames = item.pemenang
        .map((p) => p.nama_pemenang)
        .join(" ")
        .toLowerCase();
      const lokasiText = item.lokasi.join(" ").toLowerCase();
      return (
        item.nama_lomba.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        lokasiText.includes(q) ||
        pemenangNames.includes(q)
      );
    });
  }, [detailData, searchQuery]);

  if (isLoading && !detailData && !loadError) {
    return <PageSkeleton variant="generic" />;
  }

  return (
    <div className="bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10 min-h-screen font-outfit">
      <div className="w-full max-w-360 mx-auto px-5 md:px-15 py-10 flex flex-col gap-10 md:gap-12">

        {/* ─── Top Filter Bar: Year & Filter Icon ─────────────────────── */}
        <div className="relative flex items-center gap-2">
          <div className="bg-white rounded-2xl p-1.5 flex items-center gap-2 shadow-xs">
            <button
              type="button"
              onClick={() => periods.length > 1 && setYearMenuOpen((v) => !v)}
              className="bg-[#BA1B1B] text-white font-bold px-7 py-2 rounded-xl text-sm md:text-base shadow-xs cursor-pointer"
            >
              {selectedYear}
            </button>
            <button
              type="button"
              onClick={() => setYearMenuOpen((v) => !v)}
              className="bg-[#BA1B1B] text-white p-2.5 rounded-xl shadow-xs hover:bg-primary-700 transition-colors cursor-pointer flex items-center justify-center"
              title="Filter Tahun"
            >
              <Image
                src="/icons/filter.svg"
                alt="Filter"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </button>
          </div>

          {/* Year Selector Dropdown (when opened) */}
          {yearMenuOpen && periods.length > 0 && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-lg border border-neutral-100 p-2 z-20 flex flex-col gap-1 min-w-44 animate-[modal-in_0.15s_ease-out]">
              {periods.map((p) => (
                <button
                  key={p.id_periode}
                  type="button"
                  onClick={() => {
                    setSelectedPeriodId(p.id_periode);
                    setYearMenuOpen(false);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold text-left transition-colors cursor-pointer ${
                    p.id_periode === selectedPeriodId
                      ? "bg-primary-100 text-[#BA1B1B]"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {p.tahun} · {p.judul || p.nama_kegiatan}
                </button>
              ))}
            </div>
          )}
        </div>

        {loadError && (
          <div
            role="alert"
            className="flex flex-col items-start justify-between gap-3 rounded-xl border border-error-100/20 bg-error-10 px-4 py-3 text-sm font-semibold text-error-100 sm:flex-row sm:items-center"
          >
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              className="rounded-lg bg-error-100 px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* ─── Banner Hero: Kilas Balik Semarak {tahun} ──────────────────── */}
        <div className="bg-white rounded-3xl shadow-xs p-6 md:p-8 lg:p-10 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs md:text-sm font-bold text-[#BA1B1B]">
                Kilas Balik Semarak {selectedYear}
              </span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#BA1B1B] leading-tight">
                “{activePeriod?.judul || activePeriod?.nama_kegiatan || "Merdeka Dirayakan, Kebersamaan Dikuatkan"}”
              </h1>
            </div>

            {/* Date Badge with Calendar Icon */}
            <div className="bg-[#BA1B1B] text-white font-bold text-xs md:text-sm px-4.5 py-2.5 rounded-xl flex items-center gap-2 shrink-0 self-start shadow-xs">
              <Image
                src="/icons/calendar-transparant.svg"
                alt="Calendar"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span>{formattedDateRange}</span>
            </div>
          </div>

          <p className="text-xs md:text-sm text-neutral-500 font-normal leading-relaxed text-justify md:text-left">
            {activePeriod?.deskripsi ||
              "Perayaan Hari Ulang Tahun Kemerdekaan Republik Indonesia telah dilaksanakan dengan penuh semangat dan antusiasme dari seluruh warga. Berbagai rangkaian kegiatan turut memeriahkan perayaan, mulai dari berbagai perlombaan antarwarga hingga Malam Tirakatan yang dilaksanakan sebagai bentuk rasa syukur dan penghormatan terhadap perjuangan para pahlawan. Seluruh kegiatan berlangsung dengan meriah dan penuh kebersamaan, sekaligus menjadi kesempatan bagi warga untuk saling mengenal, mempererat silaturahmi, serta membangun semangat gotong royong di lingkungan bersama."}
          </p>
        </div>

        {/* ─── SECTION 1: Cabang Lomba dan Pemenang ───────────────────── */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
              Cabang Lomba dan Pemenang
            </h2>

            {/* Search Input */}
            <div className="relative w-full sm:w-88">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nama, Kategori, Lokasi, atau Pemenang"
                className="w-full h-11 bg-neutral-50 text-neutral-800 placeholder:text-neutral-400 text-xs md:text-sm font-medium rounded-xl pl-4 pr-11 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <Image
                  src="/icons/search.svg"
                  alt="Search"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-195">
                {/* Table Header: Grey Bar (#E2E2E9) with Red Bold text */}
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="py-4.5 px-6 md:px-8 font-bold text-xs md:text-sm text-[#BA1B1B]">
                      Cabang Perlombaan
                    </th>
                    <th className="py-4.5 px-6 md:px-8 font-bold text-xs md:text-sm text-[#BA1B1B]">
                      Kategori
                    </th>
                    <th className="py-4.5 px-6 md:px-8 font-bold text-xs md:text-sm text-[#BA1B1B]">
                      Partisipan
                    </th>
                    <th className="py-4.5 px-6 md:px-8 font-bold text-xs md:text-sm text-[#BA1B1B]">
                      Lokasi Pelaksanaan
                    </th>
                    <th className="py-4.5 px-6 md:px-8 font-bold text-xs md:text-sm text-[#BA1B1B]">
                      Pemenang
                    </th>
                  </tr>
                </thead>

                {/* Table Body: Solid White without dividing lines */}
                <tbody className="bg-white">
                  {isDetailLoading && filteredLomba.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-400 font-semibold">
                        Memuat data perlombaan...
                      </td>
                    </tr>
                  ) : filteredLomba.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-400 font-semibold">
                        {detailData?.lomba && detailData.lomba.length === 0
                          ? "Belum ada perlombaan yang terdaftar pada periode ini."
                          : "Tidak ada data perlombaan yang cocok dengan pencarian."}
                      </td>
                    </tr>
                  ) : (
                    filteredLomba.map((item) => {
                      const partisipanText =
                        item.jenis_pendaftaran === "Beregu"
                          ? `${item.jumlah_regu || 0} Regu`
                          : `${item.jumlah_peserta || 0} Peserta`;
                      const lokasiText =
                        item.lokasi && item.lokasi.length > 0
                          ? item.lokasi.join(", ")
                          : "-";
                      const pemenangText = formatWinners(item.pemenang);

                      return (
                        <tr
                          key={item.id_lomba}
                          className="hover:bg-neutral-50/60 transition-colors"
                        >
                          <td className="py-4 md:py-4.5 px-6 md:px-8 font-bold text-neutral-900 text-xs md:text-sm">
                            {item.nama_lomba}
                          </td>
                          <td className="py-4 md:py-4.5 px-6 md:px-8">
                            <span className="bg-[#FDECCE] text-[#C47F08] font-bold px-6 py-1 rounded-full text-xs inline-block text-center shadow-2xs">
                              {item.kategori}
                            </span>
                          </td>
                          <td className="py-4 md:py-4.5 px-6 md:px-8 font-bold text-neutral-900 text-xs md:text-sm">
                            {partisipanText}
                          </td>
                          <td className="py-4 md:py-4.5 px-6 md:px-8 font-bold text-neutral-900 text-xs md:text-sm">
                            {lokasiText}
                          </td>
                          <td className="py-4 md:py-4.5 px-6 md:px-8 font-bold text-neutral-900 text-xs md:text-sm">
                            {pemenangText}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── SECTION 2: Album dan Dokumentasi ──────────────────────── */}
        <section
          id="album-dokumentasi"
          className="flex scroll-mt-32 flex-col gap-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
              Album dan Dokumentasi
            </h2>
            {isLoadingAlbums && (
              <span className="text-xs font-semibold text-neutral-400">
                Memuat album...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {displayAlbums.map((album) => {
              return (
                <div
                  key={album.id}
                  className="bg-white rounded-3xl shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  {/* Photo with Overlay Badge */}
                  <div className="relative w-full aspect-16/10 overflow-hidden bg-neutral-100">
                    <ImageWithFallback
                      src={album.image}
                      alt={album.judul}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Category Pill Overlay */}
                    <div className="absolute top-3 left-3 bg-[#FDECCE]/95 backdrop-blur-xs text-[#C47F08] font-bold text-[10px] md:text-xs px-3.5 py-0.5 rounded-full shadow-2xs">
                      {album.kategori}
                    </div>
                  </div>

                  {/* Card Info & Action */}
                  <div className="p-5 flex flex-col gap-1">
                    <span className="text-[11px] md:text-xs font-bold text-[#BA1B1B]">
                      {album.tanggal}
                    </span>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <h3 className="text-base md:text-lg font-bold text-neutral-900 truncate">
                        {album.judul}
                      </h3>

                      <Link
                        href={`/histori/album/${album.hrefKey}`}
                        aria-label={`Lihat album ${album.judul}`}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2.5 rounded-md px-3 py-2 text-body-3 font-bold text-primary-600 transition-colors hover:bg-primary-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                      >
                        Lihat Album
                        <Image
                          src="/icons/arrow.svg"
                          alt=""
                          width={18}
                          height={18}
                          className="w-4.5 h-4.5"
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!isLoadingAlbums && displayAlbums.length === 0 && (
            <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center text-neutral-500">
              Belum ada album dokumentasi untuk perayaan ini.
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
