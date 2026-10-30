"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";

type StatusType = "Diterima" | "Menunggu" | "Ditolak";

interface PendaftaranItem {
  id: number;
  title: string;
  status: StatusType;
  date: string;
  location: string;
  registerDate?: string;
  rejectReason?: string;
}

const INITIAL_DATA: PendaftaranItem[] = [
  {
    id: 1,
    title: "Makan Kerupuk",
    status: "Diterima",
    date: "16 Agustus 2026",
    location: "Depan Pendopo",
  },
  {
    id: 2,
    title: "Tarik Tambang",
    status: "Diterima",
    date: "16 Agustus 2026",
    location: "Lapangan Timur",
    registerDate: "13 Agustus 2026",
  },
  {
    id: 3,
    title: "Estafet Kelereng",
    status: "Menunggu",
    date: "17 Agustus 2026",
    location: "Aula Balai Desa",
  },
  {
    id: 4,
    title: "Mewarnai",
    status: "Ditolak",
    date: "16 Agustus 2026",
    location: "Aula Balai Desa",
    rejectReason: "Usia anda melebihi batas kategori anak-anak",
  },
];

const FILTER_TABS = ["Semua", "Diterima", "Menunggu", "Ditolak"] as const;

export default function PendaftaranPage() {
  const [data, setData] = useState<PendaftaranItem[]>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cancelModalItem, setCancelModalItem] = useState<PendaftaranItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Filter by Tab
      if (activeTab !== "Semua" && item.status !== activeTab) {
        return false;
      }

      // Filter by Search Query (title, location, or status)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchLocation = item.location.toLowerCase().includes(query);
        const matchStatus = item.status.toLowerCase().includes(query);
        if (!matchTitle && !matchLocation && !matchStatus) {
          return false;
        }
      }

      return true;
    });
  }, [data, activeTab, searchQuery]);

  const handleConfirmCancel = () => {
    if (!cancelModalItem || cancelModalItem.status !== "Diterima") return;
    setData((prev) => prev.filter((item) => item.id !== cancelModalItem.id));
    setToastMessage(`Pendaftaran lomba "${cancelModalItem.title}" berhasil dibatalkan.`);
    setCancelModalItem(null);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10 min-h-screen">
      <div className="w-full max-w-360 mx-auto px-5 md:px-15 py-10 flex flex-col gap-8">

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

        {/* Search Bar */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama lomba, lokasi, atau status"
            className="w-full h-14 bg-white/90 backdrop-blur-sm text-neutral-800 placeholder:text-neutral-400 text-body-2 font-medium rounded-2xl pl-6 pr-14 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M16.5 16.5L21 21"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-7 py-2 rounded-xl text-body-2 font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
                  isActive
                    ? "bg-[#BA1B1B] text-white shadow-sm"
                    : "bg-white text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Cards List */}
        <div className="flex flex-col gap-5 mt-1">
          {filteredData.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-xs">
              <p className="text-body-1 text-neutral-500 font-medium">
                Tidak ada pendaftaran yang ditemukan.
              </p>
            </div>
          ) : (
            filteredData.map((item) => {
              const isRejected = item.status === "Ditolak";

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl shadow-xs transition-all ${
                    isRejected
                      ? "bg-[#F7F9FC]/90 border border-neutral-200/60 p-6 md:p-8"
                      : "bg-white p-6 md:p-8"
                  }`}
                >
                  {/* Top Part: Title + Status Badge on Left, Date + Location on Right */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Left: Title & Badge */}
                    <div className="flex flex-col gap-3">
                      <h2
                        className={`text-2xl md:text-[32px] font-bold leading-tight ${
                          isRejected ? "text-[#9AA5B1]" : "text-[#BA1B1B]"
                        }`}
                      >
                        {item.title}
                      </h2>

                      <div className="flex flex-wrap items-center gap-3">
                        {item.status === "Diterima" && (
                          <Badge
                            variant="solid"
                            color="success"
                            className="bg-[#04C065] text-white px-5 py-1 text-body-3 font-semibold rounded-full"
                          >
                            Diterima
                          </Badge>
                        )}

                        {item.status === "Menunggu" && (
                          <Badge
                            variant="solid"
                            color="secondary"
                            className="bg-secondary-500 text-white px-5 py-1 text-body-3 font-semibold rounded-full"
                          >
                            Menunggu
                          </Badge>
                        )}

                        {item.status === "Ditolak" && (
                          <>
                            <Badge
                              variant="solid"
                              className="bg-[#E53935] text-white px-5 py-1 text-body-3 font-semibold rounded-full"
                            >
                              Ditolak
                            </Badge>
                            {item.rejectReason && (
                              <span className="text-sm md:text-base font-bold text-[#BA1B1B]">
                                {item.rejectReason}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Date and Location */}
                    <div className="flex flex-col sm:items-end gap-1.5 shrink-0 text-sm md:text-body-3 font-medium">
                      <span
                        className={
                          isRejected ? "text-neutral-400 font-medium" : "text-neutral-800 font-semibold"
                        }
                      >
                        {item.date}
                      </span>
                      <div
                        className={`flex items-center gap-1.5 font-bold ${
                          isRejected ? "text-neutral-400" : "text-neutral-900"
                        }`}
                      >
                        <Image
                          src="/icons/location.svg"
                          alt="Lokasi"
                          width={18}
                          height={18}
                          className={`w-4 h-4 object-contain ${
                            isRejected ? "grayscale opacity-40" : ""
                          }`}
                        />
                        <span>{item.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation action for accepted registrations */}
                  {item.status === "Diterima" && (
                    <div className="mt-5 pt-4 border-t border-neutral-200 flex flex-col items-end gap-2">
                      {item.registerDate && (
                        <span className="text-body-3 text-neutral-400 font-medium">
                          {item.registerDate}
                        </span>
                      )}
                      <button
                        onClick={() => setCancelModalItem(item)}
                        className="bg-[#BA1B1B] hover:bg-primary-700 active:scale-[0.98] text-white font-bold text-body-3 px-5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        Batalkan Pendaftaran
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={!!cancelModalItem} onClose={() => setCancelModalItem(null)}>
        <div className="p-6 md:p-8 flex flex-col gap-6">
          <div>
            <h3 className="text-h6 font-bold text-neutral-900">Batalkan Pendaftaran</h3>
            <p className="text-body-2 text-neutral-600 mt-2">
              Apakah Anda yakin ingin membatalkan pendaftaran untuk lomba{" "}
              <strong className="text-[#BA1B1B]">{cancelModalItem?.title}</strong>? Tindakan ini
              tidak dapat dibatalkan.
            </p>
          </div>

          <div className="flex justify-end items-center gap-3">
            <button
              onClick={() => setCancelModalItem(null)}
              className="px-5 py-2.5 rounded-xl text-body-2 font-bold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Kembali
            </button>
            <button
              onClick={handleConfirmCancel}
              className="bg-[#BA1B1B] hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-body-2 font-bold transition-colors cursor-pointer shadow-xs"
            >
              Ya, Batalkan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
