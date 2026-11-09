"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { Dropdown } from "@/components/Dropdown";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { ApiRequestError } from "@/lib/api/client";
import { ajukanPembayaranIuran, getDaftarIuran } from "@/lib/api/iuran";
import { useAuthStore } from "@/stores/auth-store";
import type { TagihanIuran } from "@/types/iuran";

const PAYMENT_OPTIONS = [
  { value: "QRIS", label: "QRIS" },
  { value: "Transfer Bank", label: "Transfer Bank" },
];

type IuranStatus = "Lunas" | "Belum Lunas" | "Menunggu Konfirmasi";

interface IuranItem {
  id: number;
  nama: string;
  nominal: number | null;
  status: IuranStatus;
  waktu: string;
}

const nominalFormatter = new Intl.NumberFormat("id-ID");
const ALLOWED_FILE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const FILTER_TABS = ["Semua", "Lunas", "Belum Lunas"] as const;

function formatPaymentDate(value: string): string {
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

function billName(item: TagihanIuran): string {
  return item.periode?.nama_kegiatan ??
    (item.periode?.tahun ? `Iuran kegiatan ${item.periode.tahun}` : `Tagihan #${item.id_iuran}`);
}

export default function IuranPage() {
  const user = useAuthStore((state) => state.user);
  const [bills, setBills] = useState<TagihanIuran[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<number>>(() => new Set());
  const [activeTab, setActiveTab] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [paymentMethodTab, setPaymentMethodTab] = useState<"QRIS" | "Transfer">("QRIS");

  // Form State
  const [selectedIuranId, setSelectedIuranId] = useState<number | null>(null);
  const [metodePembayaran, setMetodePembayaran] = useState("QRIS");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await getDaftarIuran(controller.signal);
        setBills(response.data);
        setLastUpdated(new Date());
        setSelectedIuranId((current) => {
          if (current && response.data.some((item) => item.id_iuran === current)) return current;
          const payable = response.data.find((item) =>
            item.status === "Belum Bayar" && item.pembayaran_terakhir?.status_verifikasi !== "Menunggu");
          return payable?.id_iuran ?? response.data[0]?.id_iuran ?? null;
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : "Daftar iuran gagal dimuat.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [retryKey]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 5_000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const selectedBill = useMemo(
    () => bills.find((item) => item.id_iuran === selectedIuranId) ?? null,
    [bills, selectedIuranId],
  );
  const namaKeluarga = user?.nama ?? "";
  const nominalPembayaran = selectedBill?.nominal ?? "";
  const isSelectedPending = selectedBill
    ? pendingIds.has(selectedBill.id_iuran) || selectedBill.pembayaran_terakhir?.status_verifikasi === "Menunggu"
    : false;
  const canSubmit = Boolean(selectedBill && selectedBill.status === "Belum Bayar" && !isSelectedPending);

  const data = useMemo<IuranItem[]>(() => bills.map((item) => {
    const latest = item.pembayaran_terakhir;
    const pending = pendingIds.has(item.id_iuran) || latest?.status_verifikasi === "Menunggu";
    return {
      id: item.id_iuran,
      nama: namaKeluarga || "Akun Anda",
      nominal: item.nominal,
      status: item.status === "Sudah Bayar" ? "Lunas" : pending ? "Menunggu Konfirmasi" : "Belum Lunas",
      waktu: latest ? formatPaymentDate(latest.tanggal_bayar) : "-",
    };
  }), [bills, namaKeluarga, pendingIds]);

  function clearFile() {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleFileChange = (file: File) => {
    setFormError(null);
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      clearFile();
      setFormError("Bukti pembayaran harus berupa JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      clearFile();
      setFormError("Ukuran bukti pembayaran maksimal 2 MB.");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Filter Table Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (activeTab !== "Semua") {
        if (activeTab === "Lunas" && item.status !== "Lunas") return false;
        if (activeTab === "Belum Lunas" && item.status === "Lunas") return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!item.nama.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [data, activeTab, searchQuery]);

  // Handle Form Submission
  const handleSubmitConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedBill || !canSubmit) {
      setFormError("Pilih tagihan yang masih dapat dibayar.");
      return;
    }
    if (!selectedFile) {
      setFormError("Unggah bukti pembayaran terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await ajukanPembayaranIuran(selectedBill.id_iuran, {
        metode: metodePembayaran,
        nominal: selectedBill.nominal,
        buktiBayar: selectedFile,
      });
      setPendingIds((current) => new Set(current).add(selectedBill.id_iuran));
      setToastMessage(response.message);
      clearFile();
    } catch (error) {
      setFormError(error instanceof ApiRequestError
        ? error.message
        : "Pembayaran gagal diajukan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadQris = () => {
    alert("File QRIS resmi belum tersedia dari backend.");
  };

  if (isLoading && bills.length === 0 && !loadError) {
    return <PageSkeleton variant="iuran" />;
  }

  return (
    <div className="bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10 min-h-screen font-outfit">
      <div className="w-full max-w-360 mx-auto px-5 md:px-15 py-10 flex flex-col gap-12">

        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-neutral-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center justify-between text-body-3 transition-all animate-[modal-in_0.2s_ease-out]">
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/70 hover:text-white font-bold text-sm ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ─── SECTION 1: Transparansi Iuran Warga ───────────────────── */}
        <section className="flex flex-col gap-6">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-neutral-900">
            Transparansi Iuran Warga
          </h1>

          {loadError && (
            <div role="alert" className="flex flex-col items-start justify-between gap-3 rounded-xl border border-error-100/20 bg-error-10 px-4 py-3 text-sm font-semibold text-error-100 sm:flex-row sm:items-center">
              <span>{loadError}</span>
              <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="rounded-lg bg-error-100 px-4 py-2 text-xs font-bold text-white">
                Coba Lagi
              </button>
            </div>
          )}

          {/* Controls Bar: Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Filter Tabs Container */}
            <div className="bg-white rounded-2xl p-1.5 flex items-center shadow-xs w-fit">
              {FILTER_TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-7 py-2 rounded-xl text-body-2 font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-[#BA1B1B] text-white shadow-xs"
                        : "text-[#BA1B1B] hover:bg-neutral-50/70"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama warga"
                className="w-full h-11 bg-neutral-50 text-neutral-800 placeholder:text-neutral-400 text-body-3 font-medium rounded-xl pl-4 pr-11 shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
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

          {/* Data Table Card */}
          <div className="rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-187.5">
                {/* Table Header: Grey Bar (#F1F1F4) with Red Bold text */}
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="py-4.5 px-8 font-bold text-sm md:text-base text-[#BA1B1B]">
                      Kepala Keluarga
                    </th>
                    <th className="py-4.5 px-8 font-bold text-sm md:text-base text-[#BA1B1B]">
                      Nominal
                    </th>
                    <th className="py-4.5 px-8 font-bold text-sm md:text-base text-[#BA1B1B]">
                      Status
                    </th>
                    <th className="py-4.5 px-8 font-bold text-sm md:text-base text-[#BA1B1B]">
                      Waktu Pembayaran
                    </th>
                  </tr>
                </thead>

                {/* Table Body: Soft Pink Background, No internal borders, generous spacing */}
                <tbody className="bg-white/45 backdrop-blur-xs">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-neutral-500 font-semibold">
                        {bills.length === 0 ? "Belum ada tagihan iuran untuk akun ini." : "Tidak ada data warga yang sesuai."}
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => {
                      return (
                        <tr key={item.id} className="hover:bg-white/60 transition-colors">
                          <td className="py-6 px-8 font-bold text-neutral-900 text-sm md:text-base">
                            {item.nama}
                          </td>
                          <td className="py-6 px-8 font-bold text-neutral-900 text-sm md:text-base">
                            {item.nominal === null ? "-" : `Rp. ${nominalFormatter.format(item.nominal)}`}
                          </td>
                          <td className="py-6 px-8 font-bold text-sm md:text-base">
                            {item.status === "Lunas" && (
                              <span className="text-[#00C48C]">Lunas</span>
                            )}
                            {item.status === "Belum Lunas" && (
                              <span className="text-[#BA1B1B]">Belum Lunas</span>
                            )}
                            {item.status === "Menunggu Konfirmasi" && (
                              <span className="text-[#FFBF00]">Menunggu Konfirmasi</span>
                            )}
                          </td>
                          <td className="py-6 px-8 font-bold text-neutral-900 text-sm md:text-base">
                            {item.waktu}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer: Grey Bar (#F1F1F4) with Red text & Pagination */}
            <div className="bg-neutral-50 px-8 py-4.5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs md:text-sm font-bold text-[#BA1B1B]">
                {lastUpdated
                  ? `Terakhir diperbarui: ${new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(lastUpdated)} WIB`
                  : "Data belum diperbarui"}
              </span>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-[#BA1B1B]">
                <button
                  type="button"
                  className="p-1 hover:bg-neutral-200/60 rounded transition-colors cursor-pointer"
                  title="Sebelumnya"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 16.59L10.83 12L15.41 7.41L14 6L8 12L14 18L15.41 16.59Z" />
                  </svg>
                </button>

                <span className="w-6 h-6 rounded bg-[#BA1B1B] text-white flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <button type="button" className="px-1.5 py-0.5 hover:bg-neutral-200/60 rounded transition-colors cursor-pointer">
                  2
                </button>
                <button type="button" className="px-1.5 py-0.5 hover:bg-neutral-200/60 rounded transition-colors cursor-pointer">
                  3
                </button>
                <span className="px-0.5">...</span>
                <button type="button" className="px-1.5 py-0.5 hover:bg-neutral-200/60 rounded transition-colors cursor-pointer">
                  5
                </button>

                <button
                  type="button"
                  className="p-1 hover:bg-neutral-200/60 rounded transition-colors cursor-pointer"
                  title="Selanjutnya"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 2: Metode Pembayaran ─────────────────────────── */}
        <section className="flex flex-col gap-6">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-neutral-900">
            Metode Pembayaran
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Card: QRIS & Transfer Guidance */}
            <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs p-6 md:p-8 flex flex-col justify-between">
              {/* Top Tab Capsule */}
              <div className="bg-neutral-100 rounded-xl p-1.5 flex items-center mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethodTab("QRIS");
                    setMetodePembayaran("QRIS");
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm md:text-base font-bold transition-all cursor-pointer ${
                    paymentMethodTab === "QRIS"
                      ? "bg-[#BA1B1B] text-white shadow-xs"
                      : "text-[#BA1B1B] hover:opacity-80"
                  }`}
                >
                  QRIS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethodTab("Transfer");
                    setMetodePembayaran("Transfer Bank");
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm md:text-base font-bold transition-all cursor-pointer ${
                    paymentMethodTab === "Transfer"
                      ? "bg-[#BA1B1B] text-white shadow-xs"
                      : "text-[#BA1B1B] hover:opacity-80"
                  }`}
                >
                  Transfer
                </button>
              </div>

              {/* Tab Content: QRIS */}
              {paymentMethodTab === "QRIS" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch flex-1">
                  {/* Left Column: QR Code Gray Card */}
                  <div className="bg-neutral-50 rounded-2xl p-5 flex flex-col items-center justify-between text-center gap-4">
                    {/* White QR Box */}
                    <div className="bg-white p-4 rounded-xl shadow-2xs w-full flex items-center justify-center aspect-square">
                      {/* Stylized QRIS SVG with center 81 badge */}
                      <svg
                        width="180"
                        height="180"
                        viewBox="0 0 180 180"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full max-w-47.5 max-h-47.5"
                      >
                        {/* Top-Left Finder */}
                        <rect x="10" y="10" width="48" height="48" rx="5" stroke="#BA1B1B" strokeWidth="5" />
                        <rect x="22" y="22" width="24" height="24" rx="3" fill="#16161D" />

                        {/* Top-Right Finder */}
                        <rect x="122" y="10" width="48" height="48" rx="5" stroke="#BA1B1B" strokeWidth="5" />
                        <rect x="134" y="22" width="24" height="24" rx="3" fill="#16161D" />

                        {/* Bottom-Left Finder */}
                        <rect x="10" y="122" width="48" height="48" rx="5" stroke="#BA1B1B" strokeWidth="5" />
                        <rect x="22" y="134" width="24" height="24" rx="3" fill="#16161D" />

                        {/* QR Data modules */}
                        <rect x="68" y="14" width="12" height="12" fill="#16161D" />
                        <rect x="96" y="14" width="14" height="14" fill="#BA1B1B" />
                        <rect x="76" y="34" width="26" height="10" fill="#16161D" />
                        <rect x="68" y="52" width="12" height="12" fill="#16161D" />
                        <rect x="98" y="52" width="12" height="12" fill="#BA1B1B" />
                        
                        <rect x="14" y="68" width="12" height="12" fill="#16161D" />
                        <rect x="36" y="70" width="16" height="10" fill="#BA1B1B" />
                        <rect x="14" y="94" width="14" height="16" fill="#16161D" />
                        <rect x="38" y="92" width="12" height="14" fill="#16161D" />

                        <rect x="124" y="68" width="14" height="12" fill="#16161D" />
                        <rect x="148" y="70" width="18" height="12" fill="#16161D" />
                        <rect x="128" y="92" width="12" height="14" fill="#BA1B1B" />
                        <rect x="148" y="92" width="18" height="12" fill="#16161D" />

                        <rect x="68" y="118" width="14" height="12" fill="#16161D" />
                        <rect x="94" y="120" width="16" height="12" fill="#16161D" />
                        <rect x="68" y="140" width="12" height="26" fill="#BA1B1B" />
                        <rect x="90" y="146" width="24" height="14" fill="#16161D" />
                        <rect x="124" y="124" width="12" height="12" fill="#16161D" />
                        <rect x="148" y="124" width="18" height="12" fill="#BA1B1B" />
                        <rect x="128" y="146" width="38" height="18" fill="#16161D" />

                        {/* Center Red Badge "81" */}
                        <circle cx="90" cy="90" r="19" fill="#BA1B1B" />
                        <text
                          x="90"
                          y="97"
                          textAnchor="middle"
                          fill="white"
                          fontWeight="bold"
                          fontSize="16"
                          fontFamily="Outfit, sans-serif"
                        >
                          81
                        </text>
                      </svg>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-neutral-900 tracking-wide">
                        NMID: Belum tersedia
                      </p>
                      <p className="text-[11px] font-bold text-neutral-600 tracking-wider uppercase mt-0.5">
                        MENUNGGU DATA DARI BACKEND
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Guidance + Unduh QRIS Button */}
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex flex-col gap-3">
                      <h3 className="font-bold text-base md:text-lg text-neutral-900">
                        Panduan Pembayaran Qris
                      </h3>
                      <ol className="list-decimal list-outside pl-4 space-y-2.5 text-xs md:text-sm font-semibold text-neutral-800 leading-relaxed">
                        <li>Buka aplikasi pembayaran yang mendukung QRIS.</li>
                        <li>Scan QRIS yang tersedia.</li>
                        <li>Masukkan nominal pembayaran sesuai tagihan.</li>
                        <li>Konfirmasi dan selesaikan pembayaran.</li>
                        <li>Simpan bukti pembayaran.</li>
                      </ol>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadQris}
                      className="w-full bg-[#BA1B1B] hover:bg-primary-700 text-white font-bold text-sm md:text-base py-3 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.99] mt-6"
                    >
                      Unduh QRIS
                    </button>
                  </div>
                </div>
              ) : (
                /* Tab Content: Transfer Bank */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start flex-1">
                  {/* Left Column: Bank Info fields */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs md:text-sm font-bold text-[#BA1B1B]">
                        Nama Bank
                      </label>
                      <div className="h-11 bg-neutral-100 rounded-xl px-4 flex items-center text-xs md:text-sm font-bold text-neutral-900">
                        Belum tersedia dari backend
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs md:text-sm font-bold text-[#BA1B1B]">
                        Nama Rekening
                      </label>
                      <div className="h-11 bg-neutral-100 rounded-xl px-4 flex items-center text-xs md:text-sm font-bold text-neutral-900">
                        Belum tersedia dari backend
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs md:text-sm font-bold text-[#BA1B1B]">
                        Nomor Rekening
                      </label>
                      <div className="h-11 bg-neutral-100 rounded-xl px-4 flex items-center justify-between text-xs md:text-sm font-bold text-neutral-900 tracking-wider">
                        <span>Belum tersedia</span>
                        <button
                          type="button"
                          disabled
                          className="cursor-not-allowed text-xs font-bold text-neutral-400"
                        >
                          Salin
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Transfer Guidance */}
                  <div className="flex flex-col gap-3">
                    <h3 className="font-bold text-base md:text-lg text-neutral-900">
                      Panduan Transfer Bank
                    </h3>
                    <ol className="list-decimal list-outside pl-4 space-y-2.5 text-xs md:text-sm font-semibold text-neutral-800 leading-relaxed">
                      <li>Buka mobile banking yang kamu gunakan.</li>
                      <li>Pilih menu Transfer Antarbank.</li>
                      <li>Gunakan data rekening resmi yang diberikan panitia.</li>
                      <li>Masukkan nominal sesuai tagihan dan konfirmasi pembayaran.</li>
                      <li>Simpan bukti transfer sebagai bukti pembayaran.</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Right Card: Konfirmasi Pembayaran Form */}
            <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs p-6 md:p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-[#BA1B1B] text-center">
                  Konfirmasi Pembayaran
                </h3>
                <div className="w-44 h-px bg-neutral-200 mx-auto mt-2 mb-6" />

                <form onSubmit={handleSubmitConfirmation} className="flex flex-col gap-4">
                  {/* Tagihan yang akan dibayar */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-neutral-800">
                      Tagihan Iuran
                    </label>
                    <Dropdown
                      value={selectedIuranId ? String(selectedIuranId) : ""}
                      onChange={(value) => {
                        setSelectedIuranId(Number(value));
                        setFormError(null);
                        clearFile();
                      }}
                      options={bills.map((item) => ({
                        value: String(item.id_iuran),
                        label: `${billName(item)} — Rp ${nominalFormatter.format(item.nominal)}`,
                      }))}
                      placeholder="Pilih tagihan"
                      disabled={bills.length === 0}
                    />
                  </div>

                  {/* Field 1: Nama Kepala Keluarga */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-neutral-800">
                      Nama Kepala Keluarga
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={namaKeluarga}
                      placeholder="Nama akun"
                      className="w-full h-11 bg-neutral-100 text-neutral-900 placeholder:text-neutral-400 rounded-xl px-4 text-xs md:text-sm font-medium focus:outline-none"
                    />
                  </div>

                  {/* Field 2: Nominal Pembayaran */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="nominal-pembayaran" className="text-xs font-bold text-neutral-800">
                      Nominal Pembayaran
                    </label>
                    <div className="flex items-center gap-2 h-11 bg-neutral-100 rounded-xl px-4 focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                      <span className="text-xs md:text-sm font-medium text-neutral-900">Rp</span>
                      <input
                        id="nominal-pembayaran"
                        type="text"
                        readOnly
                        value={nominalPembayaran === "" ? "" : nominalFormatter.format(nominalPembayaran)}
                        placeholder="0"
                        className="w-full min-w-0 h-full bg-transparent text-neutral-900 placeholder:text-neutral-400 text-xs md:text-sm font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Field 3: Metode Pembayaran */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-neutral-800">
                      Metode Pembayaran
                    </label>
                    <Dropdown
                      value={metodePembayaran}
                      onChange={(val) => setMetodePembayaran(val)}
                      options={PAYMENT_OPTIONS}
                      disabled={!canSubmit}
                    />
                  </div>

                  {/* Field 4: Upload Bukti Pembayaran */}
                  <div className="flex flex-col gap-1 mt-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      disabled={!canSubmit}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChange(e.target.files[0]);
                        }
                      }}
                    />
                    
                    <button
                      type="button"
                      disabled={!canSubmit}
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-[#BA1B1B] bg-neutral-100 rounded-2xl py-6 px-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-neutral-200/50 transition-colors disabled:cursor-not-allowed disabled:border-neutral-300 disabled:opacity-60"
                    >
                      {previewUrl && (
                        <Image
                          src={previewUrl}
                          alt="Preview bukti pembayaran"
                          width={480}
                          height={320}
                          unoptimized
                          className="w-full max-h-64 object-contain rounded-xl mb-3"
                        />
                      )}
                      {/* Red rounded photo icon with plus badge */}
                      <svg
                        width="34"
                        height="34"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="mb-2"
                      >
                        <rect x="3" y="6" width="22" height="19" rx="4" fill="#FFD0CC" stroke="#BA1B1B" strokeWidth="2" />
                        <circle cx="9" cy="12" r="2.5" fill="#BA1B1B" />
                        <path d="M5 22L12 15L23 24" stroke="#BA1B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="24" cy="9" r="6" fill="#BA1B1B" />
                        <path d="M24 6V12M21 9H27" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>

                      <p className="text-xs font-bold text-[#BA1B1B]">
                        {selectedFile ? (
                          <span className="truncate max-w-55 inline-block">
                            {selectedFile.name}
                          </span>
                        ) : (
                          canSubmit ? "Klik untuk Unggah Bukti Pembayaran" : "Pilih tagihan yang dapat dibayar"
                        )}
                      </p>
                    </button>
                  </div>

                  {!canSubmit && selectedBill && (
                    <p className="rounded-xl bg-secondary-100/70 px-4 py-3 text-xs font-semibold text-secondary-700">
                      {selectedBill.status === "Sudah Bayar"
                        ? "Tagihan ini sudah lunas."
                        : "Pembayaran tagihan ini sedang menunggu verifikasi panitia."}
                    </p>
                  )}

                  {formError && (
                    <p role="alert" className="rounded-xl bg-error-10 px-4 py-3 text-xs font-semibold text-error-100">
                      {formError}
                    </p>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !canSubmit}
                    className="w-full bg-[#BA1B1B] hover:bg-primary-700 active:scale-[0.99] text-white font-bold text-sm md:text-base py-3.5 px-6 rounded-xl flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer mt-4 disabled:opacity-50"
                  >
                    <Image
                      src="/icons/plane.svg"
                      alt="Kirim"
                      width={18}
                      height={18}
                      className="w-4.5 h-4.5 object-contain"
                    />
                    <span>{isSubmitting ? "Mengirim..." : "Kirim Bukti Pembayaran"}</span>
                  </button>
                </form>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
