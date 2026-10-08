"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

const jadwalList = [
  {
    id: 1,
    time: "08:00 - 11:00",
    title: "Balap Karung Helm",
    category: "Anak-anak",
    status: "Segera",
    location: "Halaman Selatan Balai Desa",
    tab: "Hari Ini"
  },
  {
    id: 2,
    time: "08:30 - 11:00",
    title: "Panjat Pinang",
    category: "Dewasa",
    status: "Segera",
    location: "Lapangan Utama",
    tab: "Hari Ini"
  },
  {
    id: 3,
    time: "13:00 - 14:30",
    title: "Futsal Sarung",
    category: "Dewasa",
    status: "",
    location: "Aula Balai Desa",
    tab: "Besok"
  },
  {
    id: 4,
    time: "07:00 - 8:30",
    title: "Senam Kreatif",
    category: "Umum",
    status: "Selesai",
    location: "Lapangan Barat",
    tab: "17 Agustus"
  }
];

const lombaList = [
  {
    id: 1,
    title: "Futsal Sarung",
    category: "Umum",
    type: "Regu",
    status: "Dibuka",
    date: "16 Agustus 2026",
    participants: "6/10 Regu",
    location: "Lapangan Utara"
  },
  {
    id: 2,
    title: "Mewarnai",
    category: "Anak-anak",
    type: "Individu",
    status: "Dibuka",
    date: "16 Agustus 2026",
    participants: "9/10 Peserta",
    location: "Aula Balai Desa"
  },
  {
    id: 3,
    title: "Estafet Tepung",
    category: "Umum",
    type: "Regu",
    status: "Dibuka",
    date: "16 Agustus 2026",
    participants: "10/12 Regu",
    location: "Aula Balai Desa"
  },
  {
    id: 4,
    title: "Panjat Pinang",
    category: "Umum",
    type: "Regu",
    status: "Dibuka",
    date: "15 Agustus 2026",
    participants: "7/8 Regu",
    location: "Lapangan Timur"
  },
  {
    id: 5,
    title: "Menyanyi",
    category: "Anak-anak",
    type: "Individu",
    status: "Ditutup",
    date: "15 Agustus 2026",
    participants: "10/10 Peserta",
    location: "Aula Balai Desa"
  },
  {
    id: 6,
    title: "Makan Kerupuk",
    category: "Umum",
    type: "Individu",
    status: "Ditutup",
    date: "16 Agustus 2026",
    participants: "8/8 Peserta",
    location: "Depan Pendopo"
  }
];

export default function LombaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState("Semua");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [activeTab, setActiveTab] = useState("Hari Ini");
  const [selectedLomba, setSelectedLomba] = useState<typeof lombaList[0] | null>(null);

  const statusOptions = ["Semua", "Segera", "Selesai"];
  const categoryOptions = ["Semua", "Anak-anak", "Dewasa", "Umum"];

  const filteredJadwal = jadwalList.filter((item) => {
    if (activeTab !== item.tab) return false;
    
    if (activeStatus !== "Semua") {
      if (item.status !== activeStatus) return false;
    }
    
    if (activeCategory !== "Semua" && item.category !== activeCategory) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.title.toLowerCase().includes(q) && !item.location.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredLomba = lombaList.filter((item) => {
    if (activeCategory !== "Semua" && item.category !== activeCategory) return false;
    
    if (activeStatus === "Segera" && item.status !== "Dibuka") return false;
    if (activeStatus === "Selesai" && item.status !== "Ditutup") return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.title.toLowerCase().includes(q) && !item.location.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10 min-h-screen">
      <div className="w-full max-w-360 mx-auto px-5 md:px-15 py-10 flex flex-col gap-8">
        
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Daftar Lomba</h1>
          <p className="text-body-1 text-neutral-500 mt-2">Pilih dan ikuti lomba yang tersedia</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 w-full flex flex-col gap-4">
          
          <div className="flex flex-col md:flex-row gap-4">
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama lomba, lokasi, atau status"
                className="w-full h-12 bg-neutral-100 text-neutral-900 placeholder:text-neutral-400 text-body-2 font-medium rounded-xl pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400">
                  <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21.0004 21L16.6504 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="shrink-0 flex items-center bg-neutral-100 rounded-xl p-1.5 gap-1 h-12 overflow-x-auto">
              {statusOptions.map((status) => {
                const isActive = activeStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => setActiveStatus(status)}
                    className={`h-full px-8 rounded-lg text-body-2 font-bold whitespace-nowrap transition-colors flex items-center justify-center ${
                      isActive 
                        ? "bg-primary-600 text-white shadow-sm pointer-events-none" 
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
            
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {categoryOptions.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-8 py-2.5 rounded-xl text-body-2 font-bold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary-600 text-white shadow-sm pointer-events-none"
                      : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

        </div>

        <div className="flex flex-col gap-6 mt-2">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-h4 font-bold text-neutral-900">Jadwal dan Agenda Perlombaan</h2>
            
            <div className="bg-white rounded-xl flex items-center p-1.5 gap-1 shadow-sm overflow-x-auto scrollbar-hide">
              {["Hari Ini", "Besok", "17 Agustus"].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-8 py-2.5 font-bold text-body-2 rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-primary-600 text-white shadow-sm pointer-events-none"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {filteredJadwal.length > 0 ? (
              filteredJadwal.map((lomba) => (
                <div key={lomba.id} className="bg-white rounded-2xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
                  
                  <div className="w-full md:w-auto shrink-0 bg-primary-100 text-primary-600 px-6 py-4 rounded-xl flex items-center justify-center">
                    <span className="text-h5 font-bold whitespace-nowrap">{lomba.time}</span>
                  </div>

                  <div className="flex-1 flex flex-col gap-2 w-full text-center md:text-left">
                    <h3 className="text-h4 font-bold text-neutral-900">{lomba.title}</h3>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Badge variant="soft" color="secondary">
                        {lomba.category}
                      </Badge>
                      {lomba.status && (
                        <Badge variant="solid" color={lomba.status === "Segera" ? "primary" : "success"}>
                          {lomba.status}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-center md:justify-end gap-2 text-primary-600 w-full md:w-auto mt-2 md:mt-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-primary-600">
                      <path d="M12 21C16 17 19 13.5 19 9.5C19 5.35786 15.866 2 12 2C8.13401 2 5 5.35786 5 9.5C5 13.5 8 17 12 21Z" fill="currentColor"/>
                      <circle cx="12" cy="9" r="3" fill="white"/>
                    </svg>
                    <span className="text-body-2 font-bold">{lomba.location}</span>
                  </div>

                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center text-neutral-500 font-medium">
                Jadwal tidak ditemukan
              </div>
            )}
          </div>

        </div>

        <div className="flex flex-col gap-6 mt-10">
          
          <h2 className="text-h4 font-bold text-neutral-900">Daftar dan Detail Lomba</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLomba.length > 0 ? (
              filteredLomba.map((lomba) => (
                <div key={lomba.id} className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
                  
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="soft" color="secondary">{lomba.category}</Badge>
                    <Badge variant="solid" color={lomba.status === "Dibuka" ? "success" : "primary"}>
                      {lomba.status}
                    </Badge>
                  </div>

                  <h3 className="text-h4 font-bold text-primary-600 mb-1 leading-tight">{lomba.title}</h3>
                  <p className="text-body-3 font-semibold text-primary-600 mb-4">{lomba.date}</p>

                  <div className="bg-primary-100 rounded-xl p-4 flex flex-col gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <Image src="/icons/groups.svg" alt="Participants" width={20} height={20} className="w-5 h-5" />
                      <span className="text-body-4 font-semibold text-primary-600">{lomba.participants}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Image src="/icons/location.svg" alt="Location" width={20} height={20} className="w-5 h-5" />
                      <span className="text-body-4 font-semibold text-primary-600">{lomba.location}</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <Button 
                      variant="solid" 
                      color={lomba.status === "Dibuka" ? "primary" : "neutral"}
                      size="L" 
                      className="w-full font-bold"
                      disabled={lomba.status === "Ditutup"}
                      onClick={() => setSelectedLomba(lomba)}
                    >
                      Daftar Sekarang
                    </Button>
                  </div>

                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center text-neutral-500 font-medium md:col-span-2 lg:col-span-3">
                Lomba tidak ditemukan
              </div>
            )}
          </div>

        </div>

      </div>

      <Modal isOpen={!!selectedLomba} onClose={() => setSelectedLomba(null)}>
        {selectedLomba && (
          <div className="p-8 md:p-10 flex flex-col items-center w-full">
            
            <h2 className="text-h4 font-bold text-primary-600 mb-4 text-center">
              Pendaftaran {selectedLomba.title}
            </h2>
            <div className="flex gap-4 mb-8">
              <Badge variant="soft" color="secondary" className="px-8 w-auto! min-w-30">
                {selectedLomba.category}
              </Badge>
              <Badge variant="soft" color="secondary" className="px-8 w-auto! min-w-30">
                {selectedLomba.type === "Regu" ? "Regu / Tim" : "Individu"}
              </Badge>
            </div>

            {selectedLomba.type === "Regu" ? (
              <div className="w-full flex flex-col gap-6">
                
                <div className="flex flex-col gap-2">
                  <label className="text-body-2 font-bold text-neutral-900">Nama Regu / Tim</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan nama regu atau tim anda" 
                    className="w-full h-12 bg-neutral-100 rounded-xl px-5 text-body-2 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-[1fr_160px] sm:grid-cols-[1fr_220px] gap-4 mb-1 px-1">
                    <label className="text-body-2 font-bold text-neutral-900">Anggota</label>
                    <label className="text-body-2 font-bold text-neutral-900">No. Telp</label>
                  </div>
                  
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="grid grid-cols-[1fr_160px] sm:grid-cols-[1fr_220px] gap-4">
                      <input 
                        type="text" 
                        placeholder="Masukkan nama anggota" 
                        className="w-full h-12 bg-neutral-100 rounded-xl px-4 sm:px-5 text-body-2 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      />
                      
                      <div className="relative flex items-center w-full h-12 bg-neutral-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                        <span className="pl-3 sm:pl-4 pr-1 text-body-2 text-neutral-500 font-medium">+62</span>
                        <input 
                          type="number" 
                          placeholder="812..." 
                          className="w-full h-full bg-transparent pl-1 pr-4 text-body-2 text-neutral-900 placeholder:text-neutral-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                <div className="grid grid-cols-[1fr_160px] sm:grid-cols-[1fr_220px] gap-4 mb-1 px-1">
                  <label className="text-body-2 font-bold text-neutral-900">Nama Lengkap</label>
                  <label className="text-body-2 font-bold text-neutral-900">No. Telp</label>
                </div>
                
                <div className="grid grid-cols-[1fr_160px] sm:grid-cols-[1fr_220px] gap-4">
                  <input 
                    type="text" 
                    placeholder="Masukkan nama anda" 
                    className="w-full h-12 bg-neutral-100 rounded-xl px-4 sm:px-5 text-body-2 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                  
                  <div className="relative flex items-center w-full h-12 bg-neutral-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                    <span className="pl-3 sm:pl-4 pr-1 text-body-2 text-neutral-500 font-medium">+62</span>
                    <input 
                      type="number" 
                      placeholder="812..." 
                      className="w-full h-full bg-transparent pl-1 pr-4 text-body-2 text-neutral-900 placeholder:text-neutral-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="w-full flex items-center justify-end gap-6 mt-10">
              <button 
                onClick={() => setSelectedLomba(null)} 
                className="text-body-2 font-bold text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <Button variant="solid" color="primary" size="L" className="font-bold flex items-center gap-2">
                Kirim Pendaftaran
                <Image src="/icons/plane.svg" alt="Send" width={20} height={20} className="w-5 h-5 shrink-0" />
              </Button>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
