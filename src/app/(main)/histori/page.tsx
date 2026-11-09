"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { DAFTAR_ALBUM, DEFAULT_PLACEHOLDER } from "@/lib/data/histori";

interface LombaPemenangItem {
  id: number;
  cabang: string;
  kategori: "Umum" | "Anak-anak" | "Dewasa";
  partisipan: string;
  lokasi: string;
  pemenang: string;
}

const DAFTAR_LOMBA: LombaPemenangItem[] = [
  {
    id: 1,
    cabang: "Balap Karung",
    kategori: "Umum",
    partisipan: "12 Peserta",
    lokasi: "Halaman Balai Desa",
    pemenang: "Adalah pokoknya",
  },
  {
    id: 2,
    cabang: "Estafet Kelereng",
    kategori: "Anak-anak",
    partisipan: "10 Peserta",
    lokasi: "Aula Balai Desa",
    pemenang: "Adalah pokoknya",
  },
  {
    id: 3,
    cabang: "Bola Beracun",
    kategori: "Umum",
    partisipan: "8 Regu",
    lokasi: "Lapangan Timur",
    pemenang: "Ahay",
  },
  {
    id: 4,
    cabang: "Panjat Pinang",
    kategori: "Dewasa",
    partisipan: "6 Regu",
    lokasi: "Lapangan Utama",
    pemenang: "Depin",
  },
  {
    id: 5,
    cabang: "Menyanyi",
    kategori: "Anak-anak",
    partisipan: "10 Peserta",
    lokasi: "Aula Balai Desa",
    pemenang: "Adalah pokoknya",
  },
  {
    id: 6,
    cabang: "Estafet Air",
    kategori: "Umum",
    partisipan: "10 Regu",
    lokasi: "Lapangan Selatan",
    pemenang: "Saufaini",
  },
  {
    id: 7,
    cabang: "Estafet Pingpong Air",
    kategori: "Dewasa",
    partisipan: "15 Peserta",
    lokasi: "Halaman Balai Desa",
    pemenang: "Adalah pokoknya",
  },
  {
    id: 8,
    cabang: "Futsal Sarung",
    kategori: "Dewasa",
    partisipan: "10 Regu",
    lokasi: "Lapangan Utama",
    pemenang: "Adalah pokoknya",
  },
];

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

export default function HistoriPage() {
  const selectedYear = "2025";
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter Table Data
  const filteredLomba = useMemo(() => {
    if (!searchQuery.trim()) return DAFTAR_LOMBA;
    const q = searchQuery.toLowerCase().trim();
    return DAFTAR_LOMBA.filter((item) => {
      return (
        item.cabang.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.lokasi.toLowerCase().includes(q) ||
        item.pemenang.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  return (
    <div className="bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10 min-h-screen font-outfit">
      <div className="w-full max-w-360 mx-auto px-5 md:px-15 py-10 flex flex-col gap-10 md:gap-12">

        {/* ─── Top Filter Bar: Year & Filter Icon ─────────────────────── */}
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-2xl p-1.5 flex items-center gap-2 shadow-xs">
            <button
              type="button"
              className="bg-[#BA1B1B] text-white font-bold px-7 py-2 rounded-xl text-sm md:text-base shadow-xs"
            >
              {selectedYear}
            </button>
            <button
              type="button"
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
        </div>

        {/* ─── Banner Hero: Kilas Balik Semarak 2025 ──────────────────── */}
        <div className="bg-white rounded-3xl shadow-xs p-6 md:p-8 lg:p-10 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs md:text-sm font-bold text-[#BA1B1B]">
                Kilas Balik Semarak 2025
              </span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#BA1B1B] leading-tight">
                “Merdeka Dirayakan, Kebersamaan Dikuatkan”
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
              <span>14 - 17 Agustus 2025</span>
            </div>
          </div>

          <p className="text-xs md:text-sm text-neutral-500 font-normal leading-relaxed text-justify md:text-left">
            Perayaan Hari Ulang Tahun ke-80 Kemerdekaan Republik Indonesia telah dilaksanakan selama empat hari dengan penuh semangat dan antusiasme dari seluruh warga. Berbagai rangkaian kegiatan turut memeriahkan perayaan, mulai dari berbagai perlombaan antarwarga hingga Malam Tirakatan yang dilaksanakan sebagai bentuk rasa syukur dan penghormatan terhadap perjuangan para pahlawan. Seluruh kegiatan berlangsung dengan meriah dan penuh kebersamaan, sekaligus menjadi kesempatan bagi warga untuk saling mengenal, mempererat silaturahmi, serta membangun semangat gotong royong di lingkungan bersama.
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
              <table className="w-full text-left border-collapse min-w-[780px]">
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
                  {filteredLomba.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-400 font-semibold">
                        Tidak ada data perlombaan yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredLomba.map((item) => {
                      return (
                        <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="py-4 md:py-4.5 px-6 md:px-8 font-bold text-neutral-900 text-xs md:text-sm">
                            {item.cabang}
                          </td>
                          <td className="py-4 md:py-4.5 px-6 md:px-8">
                            <span className="bg-[#FDECCE] text-[#C47F08] font-bold px-6 py-1 rounded-full text-xs inline-block text-center shadow-2xs">
                              {item.kategori}
                            </span>
                          </td>
                          <td className="py-4 md:py-4.5 px-6 md:px-8 font-bold text-neutral-900 text-xs md:text-sm">
                            {item.partisipan}
                          </td>
                          <td className="py-4 md:py-4.5 px-6 md:px-8 font-bold text-neutral-900 text-xs md:text-sm">
                            {item.lokasi}
                          </td>
                          <td className="py-4 md:py-4.5 px-6 md:px-8 font-bold text-neutral-900 text-xs md:text-sm">
                            {item.pemenang}
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
        <section id="album-dokumentasi" className="flex scroll-mt-32 flex-col gap-6">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Album dan Dokumentasi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {DAFTAR_ALBUM.map((album) => {
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
                        href={`/histori/album/${album.slug}`}
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
        </section>

      </div>

    </div>
  );
}
