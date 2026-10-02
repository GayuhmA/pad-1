"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";

const pengumuman = {
  badge: "Pengumuman Terbaru",
  date: "15 Agustus, 02:14 WIB",
  title: "Panggilan Babak Penyisihan Tarik Tambang!",
  description:
    "Regu anda (Ketoprak Sedap Malam RT 07) dijadwalkan bertanding dengan RT 09 di lapangan utara pada pukul ...",
  link: "#",
};

const sedangBerlangsung = [
  {
    id: 1,
    status: "Penyisihan",
    location: "Lapangan Timur",
    title: "Tarik Tambang",
    team1: "Regu Ketoprak Sedap Malam",
    team2: "Regu Nasi Padang Murah",
    badgeVariant: "soft",
    badgeColor: "secondary",
  },
  {
    id: 2,
    status: "Final",
    location: "Balai Desa",
    title: "Catur",
    team1: "Bapak Setiawan Raharja",
    team2: "Bapak Rendra Hariyanto",
    badgeVariant: "soft",
    badgeColor: "primary",
  },
];

const agenda = [
  {
    id: 1,
    time: "09:00 - 11:30 WIB",
    category: "Dewasa",
    title: "Futsal Sarung",
    location: "Lapangan Utara",
    icon: "/icons/workout.svg",
    iconBg: "bg-primary-100",
  },
  {
    id: 2,
    time: "09:30 - 11:00 WIB",
    category: "Umum",
    title: "Makan Kerupuk",
    location: "Depan Pendopo",
    icon: "/icons/flag.svg",
    iconBg: "bg-secondary-100",
  },
  {
    id: 3,
    time: "13:00 - 15:00 WIB",
    category: "Anak-anak",
    title: "Mewarnai",
    location: "Aula Balai Desa",
    icon: "/icons/night.svg",
    iconBg: "bg-primary-100",
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("Besok");
  const tabs = ["Hari Ini", "Besok", "17 Agustus"];

  return (
    <div className="bg-linear-to-b from-primary-100 via-primary-100 to-primary-100/10 min-h-screen">
      <div className="w-full max-w-360 mx-auto px-5 md:px-15 py-10 flex flex-col gap-12">
        
        <section className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2 bg-white w-fit px-4 py-1 rounded-md">
            <Image
              src="/icons/calendar-date.svg"
              alt="Calendar"
              width={24}
              height={24}
            />
            <p className="text-body-2 font-bold text-primary-600">
              15 Agustus 2026
            </p>
          </div>

          <div className="relative bg-white w-full min-h-100 rounded-lg p-10 md:p-16 overflow-hidden flex items-center">
            <div className="relative z-10">
              <h1 className="text-[40px] md:text-[68px] leading-tight text-neutral-900 font-bold mb-4">
                Semarak HUT RI <span className="text-primary-600">ke-81</span>
              </h1>
              <p className="text-body-2 md:text-body-1 text-neutral-400">
                “Nusantara Bersuka, Indonesia Berjaya”
              </p>
            </div>

            <div className="absolute -right-5 md:-right-10 top-1/2 -translate-y-1/2 select-none pointer-events-none">
              <span className="text-[150px] md:text-[280px] font-bold text-primary-100 leading-none">
                81
              </span>
            </div>
          </div>
        </section>

        <section>
          <div className="bg-white w-full rounded-lg p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Badge variant="solid" color="primary" className="text-body-4 px-3 py-1">
                  {pengumuman.badge}
                </Badge>
                <div className="flex items-center gap-2 text-neutral-500">
                  <Image
                    src="/icons/clock-circle.svg"
                    alt="Clock"
                    width={18}
                    height={18}
                  />
                  <span className="text-body-4 font-semibold mt-0.5">
                    {pengumuman.date}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-h5 text-neutral-900 font-bold">
                  {pengumuman.title}
                </h2>
                <p className="text-body-2 text-neutral-400 max-w-2xl mt-1">
                  {pengumuman.description}
                </p>
              </div>
            </div>
            
            <div className="shrink-0">
              <Button variant="ghost" color="primary" size="M" className="font-bold">
                Lihat Detail{" "}
                <Image
                  src="/icons/round-arrow-right.svg"
                  alt="Arrow"
                  width={24}
                  height={24}
                />
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <Image src="/icons/alert.svg" alt="Alert" width={28} height={28} />
            <h2 className="text-h6 text-primary-600 font-bold">
              Sedang Berlangsung
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {sedangBerlangsung.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg p-6 flex flex-col gap-5"
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant={item.badgeVariant as any}
                    color={item.badgeColor as any}
                  >
                    {item.status}
                  </Badge>
                  <div className="flex items-center gap-2 text-primary-600">
                    <span className="text-body-3 font-bold">{item.location}</span>
                    <Image
                      src="/icons/location.svg"
                      alt="Location"
                      width={20}
                      height={20}
                    />
                  </div>
                </div>

                <h3 className="text-h4 font-bold text-neutral-900">
                  {item.title}
                </h3>

                <div className="bg-neutral-50 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                  <p className="text-body-2 font-bold text-neutral-900 text-center flex-1">
                    {item.team1}
                  </p>
                  <Badge
                    variant="solid"
                    color="primary"
                    className="text-h6 px-5 py-2 shrink-0"
                  >
                    VS
                  </Badge>
                  <p className="text-body-2 font-bold text-neutral-900 text-center flex-1">
                    {item.team2}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white w-full max-w-300 mx-auto rounded-lg p-8 md:p-10 mt-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <h2 className="text-h4 text-neutral-900 font-bold">
              Jadwal dan Agenda
            </h2>
            <div className="bg-neutral-50 rounded-xl flex items-center p-1.5 gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`px-8 py-2.5 font-bold text-body-2 rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? "bg-primary-600 text-white shadow-sm pointer-events-none"
                      : "text-neutral-600 hover:bg-neutral-200"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-10 mt-10 w-full">
            {agenda.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center w-full gap-6 md:gap-0">
                <div className={`${item.iconBg} p-4 rounded-[20px] shrink-0 w-fit mx-auto md:mx-0`}>
                  <Image
                    src={item.icon}
                    alt={item.title}
                    width={48}
                    height={48}
                    className="w-10 h-10 md:w-12 md:h-12"
                  />
                </div>
                <div className="md:ml-8 flex-1 flex flex-col justify-center text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <p className="text-body-3 font-bold text-primary-600">
                      {item.time}
                    </p>
                    <Badge variant="soft" color="secondary">
                      {item.category}
                    </Badge>
                  </div>
                  <h3 className="text-h5 text-neutral-900 font-bold -mt-1">
                    {item.title}
                  </h3>
                  <p className="text-body-3 text-neutral-500 flex items-center justify-center md:justify-start">
                    <Image
                      src="/icons/location_outline.svg"
                      alt="Location"
                      width={20}
                      height={20}
                      className="mr-1"
                    />
                    {item.location}
                  </p>
                </div>
                <div className="shrink-0 font-bold flex justify-center md:block">
                  <Button variant="ghost" color="primary" size="M">
                    Lihat Detail{" "}
                    <Image
                      src="/icons/round-arrow-right.svg"
                      alt="Arrow"
                      width={24}
                      height={24}
                    />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
