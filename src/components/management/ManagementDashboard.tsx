'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

type Role = 'panitia' | 'admin';
export type IconName = 'grid' | 'trophy' | 'users' | 'wallet' | 'mail' | 'image' | 'clock' | 'shield' | 'settings' | 'megaphone' | 'external' | 'menu' | 'close' | 'chevron' | 'search' | 'calendar' | 'edit' | 'arrow' | 'check' | 'dots' | 'building' | 'chart' | 'filter' | 'logout';

const iconPaths: Record<IconName, string[]> = {
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  trophy: ['M8 4h8v5a4 4 0 0 1-8 0V4Z', 'M8 6H4v2a4 4 0 0 0 4 4', 'M16 6h4v2a4 4 0 0 1-4 4', 'M12 13v4', 'M8 20h8', 'M9 17h6'],
  users: ['M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20', 'M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', 'M17 3.2a3.5 3.5 0 0 1 0 6.8', 'M20 20v-1.5a4.5 4.5 0 0 0-3.2-4.3'],
  wallet: ['M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z', 'M4 7h12', 'M15 12h4', 'M15.5 12h.01'],
  mail: ['M4 6h16v12H4z', 'm4 7 8 6 8-6'],
  image: ['M4 5h16v14H4z', 'M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'm20 15-5-5L6 19'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2'],
  shield: ['M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z', 'm9 12 2 2 4-4'],
  settings: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.5 2.6-.2-.1a1.7 1.7 0 0 0-1.9.3l-.1.1h-3l-.1-.2a1.7 1.7 0 0 0-1.4-1l-.2.1-2.6-1.5.1-.2a1.7 1.7 0 0 0-.3-1.9l-.1-.1v-3l.2-.1a1.7 1.7 0 0 0 1-1.4l-.1-.2 1.5-2.6.2.1a1.7 1.7 0 0 0 1.9-.3l.1-.1h3l.1.2a1.7 1.7 0 0 0 1.4 1l.2-.1 2.6 1.5-.1.2a1.7 1.7 0 0 0 .3 1.9l.1.1v3l-.2.1a1.7 1.7 0 0 0-1 1.4'],
  megaphone: ['m3 11 18-5v12L3 13v-2Z', 'M11.6 14.6 13 20l-4-1-1.2-5.1', 'M5 13.5V18'],
  external: ['M14 4h6v6', 'm20 4-9 9', 'M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  close: ['m6 6 12 12', 'M18 6 6 18'],
  chevron: ['m9 18 6-6-6-6'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'm21 21-4.3-4.3'],
  calendar: ['M5 4v3', 'M19 4v3', 'M4 8h16', 'M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z', 'M8 12h3', 'M8 16h3'],
  edit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z'],
  arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
  check: ['m5 12 4 4L19 6'],
  dots: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
  building: ['M3 21h18', 'M5 21V5l7-3v19', 'M19 21V9l-7-4', 'M8 8h1', 'M8 12h1', 'M8 16h1', 'M15 12h1', 'M15 16h1'],
  chart: ['M4 19V5', 'M4 19h17', 'm7 15 4-4 3 2 6-7'],
  filter: ['M4 5h16', 'M7 10h10', 'M10 15h4', 'M11 19h2'],
  logout: ['M10 17l5-5-5-5', 'M15 12H3', 'M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6'],
};

export function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {iconPaths[name].map((path, index) => <path key={index} d={path} />)}
    </svg>
  );
}

type NavigationKey = 'dashboard' | 'competitions' | null;

const navigation: Record<Role, { label: string; groups: { title: string; items: { label: string; icon: IconName; key: NavigationKey }[] }[] }> = {
  panitia: {
    label: 'Panitia',
    groups: [
      { title: 'RUANG PANITIA', items: [
        { label: 'Dashboard', icon: 'grid', key: 'dashboard' }, { label: 'Kelola Lomba', icon: 'trophy', key: 'competitions' },
        { label: 'Kelola Pendaftaran', icon: 'users', key: null }, { label: 'Kelola Iuran', icon: 'wallet', key: null },
      ] },
      { title: 'LAINNYA', items: [
        { label: 'Pesan', icon: 'mail', key: null }, { label: 'Dokumentasi', icon: 'image', key: null }, { label: 'Histori', icon: 'clock', key: null },
      ] },
    ],
  },
  admin: {
    label: 'Administrator',
    groups: [
      { title: 'PANEL ADMIN', items: [
        { label: 'Dashboard', icon: 'grid', key: 'dashboard' }, { label: 'Kelola Panitia', icon: 'shield', key: null },
        { label: 'Data Warga', icon: 'users', key: null }, { label: 'Data Lomba', icon: 'trophy', key: 'competitions' },
      ] },
      { title: 'PENGELOLAAN', items: [
        { label: 'Pembayaran', icon: 'wallet', key: null }, { label: 'Pengumuman', icon: 'megaphone', key: null }, { label: 'Pengaturan', icon: 'settings', key: null },
      ] },
    ],
  },
};

const panitiaMetrics = [
  { label: 'Total Lomba', value: '12', icon: 'trophy' as const, note: '4 lomba berlangsung' },
  { label: 'Total Pendaftar', value: '25', icon: 'users' as const, note: '+6 minggu ini' },
  { label: 'Pembayaran Lunas', value: '31', icon: 'check' as const, note: 'Dari 45 tagihan' },
  { label: 'Belum Lunas', value: '14', icon: 'wallet' as const, note: 'Perlu ditindaklanjuti' },
];

const adminMetrics = [
  { label: 'Total Warga', value: '128', icon: 'building' as const, note: '+8 warga terdaftar' },
  { label: 'Panitia Aktif', value: '12', icon: 'shield' as const, note: 'Di 4 divisi' },
  { label: 'Pendaftaran', value: '86', icon: 'users' as const, note: '+14 minggu ini' },
  { label: 'Perlu Verifikasi', value: '9', icon: 'wallet' as const, note: 'Pembayaran warga' },
];

function Sidebar({ role, userName, activeItem, onClose }: { role: Role; userName: string; activeItem: Exclude<NavigationKey, null>; onClose?: () => void }) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const config = navigation[role];
  const initials = userName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('id-ID') || '?';

  useEffect(() => {
    if (!accountMenuOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) setAccountMenuOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAccountMenuOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      router.replace('/login');
    } catch {
      setLogoutError(useAuthStore.getState().error || 'Gagal keluar. Silakan coba lagi.');
      setIsLoggingOut(false);
    }
  }

  return (
    <aside className="flex h-full w-69 shrink-0 flex-col border-r border-primary-100 bg-white">
      <div className="flex h-25 items-center gap-3 px-7">
        <Link href="/dashboard" onClick={onClose} aria-label="Kembali ke dashboard" className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="" width={54} height={54} className="size-13.5 object-contain" priority />
          <span className="text-[11px] font-bold leading-tight tracking-[0.16em] text-primary-700">RUANG<br />{role === 'admin' ? 'ADMIN' : 'PANITIA'}</span>
        </Link>
        {onClose && <button type="button" aria-label="Tutup menu" onClick={onClose} className="ml-auto rounded-lg p-2 text-neutral-500 hover:bg-neutral-50 lg:hidden"><Icon name="close" /></button>}
      </div>

      <nav aria-label={`Navigasi ${config.label}`} className="flex-1 space-y-8 overflow-y-auto px-4 py-7">
        {config.groups.map((group) => (
          <div key={group.title}>
            <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.12em] text-neutral-400">{group.title}</p>
            <ul className="space-y-1.5">
              {group.items.map((item) => {
                const active = item.key === activeItem;
                const itemContent = <>
                    <Icon name={item.icon} className={`size-5.25 shrink-0 ${active ? 'text-primary-600' : 'text-neutral-400 group-hover:text-primary-600'}`} />
                    <span>{item.label}</span>
                    {item.label === 'Pesan' && <span className="ml-auto rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-bold text-white">3</span>}
                </>;
                const itemClass = `group flex min-h-12 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[14px] font-semibold transition-colors ${active ? 'bg-primary-100/70 text-primary-700' : 'text-neutral-700'}`;
                const href = item.key === 'dashboard' ? '/dashboard' : item.key === 'competitions' ? '/dashboard/lomba' : null;
                return <li key={item.label}>
                  {href
                    ? <Link href={href} onClick={onClose} aria-current={active ? 'page' : undefined} className={itemClass}>{itemContent}</Link>
                    : <button type="button" disabled title="Menu ini belum tersedia pada slicing dashboard." className={`${itemClass} cursor-default disabled:opacity-100`}>{itemContent}</button>}
                </li>;
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div ref={accountMenuRef} className="relative border-t border-neutral-100 p-4">
        {accountMenuOpen && <div role="menu" aria-label="Menu akun" className="absolute right-4 bottom-[calc(100%+8px)] left-4 z-50 overflow-hidden rounded-2xl border border-neutral-100 bg-white p-2 shadow-[0_12px_36px_rgba(22,22,29,0.14)]">
          <div className="px-3 py-2.5"><p className="truncate text-sm font-semibold text-neutral-900">{userName}</p><p className="mt-0.5 text-xs text-neutral-500">{config.label}</p></div>
          <div className="my-1 border-t border-neutral-100" />
          <Link href="/profile" role="menuitem" onClick={() => { setAccountMenuOpen(false); onClose?.(); }} className="flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50">
            <Icon name="users" className="size-4.25 text-neutral-400" />Profil &amp; akun
          </Link>
          {logoutError && <p role="alert" className="px-3 py-2 text-xs leading-5 text-error-100">{logoutError}</p>}
          <button type="button" role="menuitem" disabled={isLoggingOut} onClick={() => void handleLogout()} className="flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold text-error-100 transition-colors hover:bg-error-10 disabled:cursor-wait disabled:opacity-60">
            <Icon name="logout" className="size-4.25" />{isLoggingOut ? 'Sedang keluar…' : 'Keluar'}
          </button>
        </div>}
        <button type="button" aria-haspopup="menu" aria-expanded={accountMenuOpen} aria-label={`${userName}, menu akun`} onClick={() => { setAccountMenuOpen((open) => !open); setLogoutError(null); }} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">{initials}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-neutral-900">{userName}</span>
            <span className="mt-0.5 block text-xs text-neutral-400">{config.label}</span>
          </span>
          <Icon name="chevron" className={`size-4 text-neutral-400 transition-transform ${accountMenuOpen ? '-rotate-90' : 'rotate-90'}`} />
        </button>
      </div>
    </aside>
  );
}

function MetricCard({ metric, index }: { metric: (typeof panitiaMetrics)[number] | (typeof adminMetrics)[number]; index: number }) {
  return (
    <article className="rounded-2xl border border-primary-100/90 bg-white p-5 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-500">{metric.label}</p>
        <span className={`flex size-9 items-center justify-center rounded-xl ${index === 3 ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100/65 text-primary-600'}`}><Icon name={metric.icon} className="size-4.5" /></span>
      </div>
      <p className="mt-3 text-[34px] font-semibold leading-none tracking-tight text-neutral-900 sm:text-[38px]">{metric.value}</p>
      <p className="mt-3 text-xs text-neutral-400">{metric.note}</p>
    </article>
  );
}

function SectionHeading({ title, action }: { title: string; action?: string }) {
  return <div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-[18px] font-semibold tracking-tight text-neutral-900 sm:text-xl">{title}</h2>{action && <button type="button" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700">{action}<Icon name="arrow" className="size-4" /></button>}</div>;
}

function StagePill({ children, active = false }: { children: string; active?: boolean }) {
  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${active ? 'bg-[#FFE0DD] text-primary-700' : 'bg-neutral-50 text-neutral-400'}`}>{children}</span>;
}

function MatchRow({ name, place, phase, left, right, edit = false }: { name: string; place: string; phase: 'Penyisihan' | 'Semifinal' | 'Final'; left: string; right: string; edit?: boolean }) {
  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-semibold text-neutral-900">{name}</h3><p className="mt-1 text-sm text-neutral-500">{place}</p></div>
        <div className="flex gap-1.5"><StagePill active={phase === 'Penyisihan'}>Penyisihan</StagePill><StagePill active={phase === 'Semifinal'}>Semifinal</StagePill><StagePill active={phase === 'Final'}>Final</StagePill></div>
      </div>
      <div className={`mt-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[13px] ${edit ? 'bg-primary-100/65' : 'bg-neutral-50'}`}>
        <span className="min-w-0 flex-1 truncate font-medium text-neutral-800">{left}</span><span className="text-xs font-bold text-primary-600">VS</span><span className="min-w-0 flex-1 truncate text-right font-medium text-neutral-800">{right}</span>
        {edit && <button type="button" aria-label={`Edit hasil ${name}`} className="ml-1 rounded-lg p-1 text-primary-500 hover:bg-white"><Icon name="edit" className="size-4" /></button>}
      </div>
    </article>
  );
}

const agendaByDay = {
  'Hari Ini': [
    { time: '08.00', title: 'Balap Karung Helm', place: 'Halaman Selatan Balai Desa' },
    { time: '08.30', title: 'Panjat Pinang', place: 'Lapangan Utama' },
    { time: '13.00', title: 'Estafet Karet Tepung', place: 'Aula Balai Desa' },
  ],
  Besok: [
    { time: '09.00', title: 'Tarik Tambang', place: 'Lapangan Timur' },
    { time: '10.30', title: 'Makan Kerupuk', place: 'Halaman Balai Desa' },
    { time: '19.00', title: 'Malam Tirakatan', place: 'Aula Balai Desa' },
  ],
  '17 Agustus': [
    { time: '07.00', title: 'Upacara Kemerdekaan', place: 'Lapangan Utama' },
    { time: '09.00', title: 'Final Berbagai Lomba', place: 'Lapangan Utama' },
    { time: '19.30', title: 'Pentas Seni Warga', place: 'Panggung Utama' },
  ],
};

function AgendaPanel() {
  const [selectedDay, setSelectedDay] = useState<keyof typeof agendaByDay>('Besok');
  return (
    <section className="rounded-2xl border border-primary-100/90 bg-white p-5 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-6">
      <SectionHeading title="Jadwal dan Agenda" action="Semua agenda" />
      <div role="tablist" aria-label="Pilih hari agenda" className="mb-5 grid grid-cols-3 rounded-xl bg-neutral-50 p-1">
        {(Object.keys(agendaByDay) as (keyof typeof agendaByDay)[]).map((day) => <button key={day} type="button" role="tab" aria-selected={selectedDay === day} onClick={() => setSelectedDay(day)} className={`min-h-10 rounded-lg px-2 text-xs font-semibold transition-colors sm:text-sm ${selectedDay === day ? 'bg-[#FBD0CC] text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}>{day}</button>)}
      </div>
      <ol className="divide-y divide-neutral-100">
        {agendaByDay[selectedDay].map((item) => <li key={`${item.time}-${item.title}`} className="grid grid-cols-[58px_1fr] gap-4 py-4 first:pt-2 last:pb-1 sm:grid-cols-[76px_1fr] sm:gap-5">
          <span className="border-r border-neutral-100 pt-0.5 text-sm font-semibold tabular-nums text-primary-600 sm:text-base">{item.time}</span>
          <div><h3 className="font-semibold text-neutral-900">{item.title}</h3><p className="mt-1 text-sm text-neutral-500">{item.place}</p></div>
        </li>)}
      </ol>
    </section>
  );
}

function PanitiaContent() {
  return <>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">{panitiaMetrics.map((metric, index) => <MetricCard key={metric.label} metric={metric} index={index} />)}</div>
    <div className="mt-6 grid items-start gap-5 2xl:grid-cols-[1fr_1.02fr]">
      <section className="rounded-2xl border border-primary-100/90 bg-white p-5 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-6">
        <SectionHeading title="Sedang Berlangsung" action="Lihat semua" />
        <div className="divide-y divide-neutral-100">
          <MatchRow name="Tarik Tambang" place="Lapangan Timur" phase="Penyisihan" left="Ketoprak Sedap Malam" right="Nasi Padang Murah" />
          <MatchRow name="Catur" place="Balai Desa" phase="Final" left="Setiawan Raharja" right="Rendra Hariyanto" edit />
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-primary-100/45 p-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600"><Icon name="calendar" className="size-4.5" /></span>
          <p className="text-sm text-neutral-700"><span className="font-semibold">2 pertandingan</span> menunggu pembaruan hasil.</p>
          <Icon name="chevron" className="ml-auto size-4 text-neutral-400" />
        </div>
      </section>
      <AgendaPanel />
    </div>
    <section className="mt-6 rounded-2xl border border-primary-100/90 bg-white p-5 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-6">
      <SectionHeading title="Akses Cepat" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { title: 'Tambah lomba', desc: 'Buat dan atur lomba baru', icon: 'trophy' as const, href: '/dashboard/lomba' },
          { title: 'Verifikasi pembayaran', desc: 'Periksa bukti iuran warga', icon: 'wallet' as const },
          { title: 'Unggah dokumentasi', desc: 'Bagikan momen kegiatan', icon: 'image' as const },
        ].map((item) => {
          const content = <><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-100/65 text-primary-600"><Icon name={item.icon} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-neutral-900">{item.title}</span><span className="mt-1 block text-xs text-neutral-500">{item.desc}</span></span><Icon name="arrow" className="size-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" /></>;
          const className = 'group flex items-center gap-3 rounded-xl border border-neutral-100 p-4 text-left transition-colors hover:border-primary-200 hover:bg-primary-100/25';
          return <div key={item.title}>
            {'href' in item && item.href
              ? <Link href={item.href} className={className}>{content}</Link>
              : <button type="button" className={`${className} w-full`}>{content}</button>}
          </div>;
        })}
      </div>
    </section>
  </>;
}

const bars = [34, 52, 43, 68, 48, 82, 59, 72, 51, 92, 66, 78];

function AdminContent() {
  return <>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">{adminMetrics.map((metric, index) => <MetricCard key={metric.label} metric={metric} index={index} />)}</div>
    <div className="mt-6 grid items-start gap-5 2xl:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-2xl border border-primary-100/90 bg-white p-5 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-[18px] font-semibold text-neutral-900 sm:text-xl">Ringkasan Kegiatan</h2><p className="mt-1 text-sm text-neutral-500">Aktivitas pendaftaran selama 12 hari terakhir</p></div><button type="button" className="inline-flex items-center gap-2 rounded-lg border border-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-600"><Icon name="calendar" className="size-4" />12–23 Agustus<Icon name="chevron" className="size-3.5" /></button></div>
        <div className="flex h-52 items-end gap-2 border-b border-neutral-100 px-1 sm:gap-3">
          {bars.map((height, index) => <div key={index} className="group flex h-full flex-1 flex-col justify-end"><div className={`w-full rounded-t-md transition-colors ${index === 9 ? 'bg-primary-500' : 'bg-primary-100 group-hover:bg-primary-200'}`} style={{ height: `${height}%` }} title={`${height} pendaftar`} /></div>)}
        </div>
        <div className="mt-2 flex justify-between px-1 text-[11px] text-neutral-400"><span>12 Agu</span><span>15 Agu</span><span>18 Agu</span><span>21 Agu</span><span>23 Agu</span></div>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-500"><span className="inline-flex items-center gap-2"><i className="size-2.5 rounded-full bg-primary-500" />Pendaftar</span><span className="inline-flex items-center gap-2"><i className="size-2.5 rounded-full bg-secondary-400" />Pembayaran terverifikasi</span><span className="ml-auto font-semibold text-success-200">+18,6% dari periode lalu</span></div>
      </section>

      <section className="rounded-2xl border border-primary-100/90 bg-white p-5 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-6">
        <SectionHeading title="Aktivitas Terbaru" action="Lihat aktivitas" />
        <ol className="space-y-5">
          {[
            { initials: 'AD', name: 'Adi Pratama', event: 'menambahkan lomba', target: 'Balap Karung Helm', time: '5 menit lalu', color: 'bg-secondary-100 text-secondary-700' },
            { initials: 'SW', name: 'Siti Wulandari', event: 'memverifikasi pembayaran', target: 'Iuran Keluarga No. 24', time: '28 menit lalu', color: 'bg-primary-100 text-primary-700' },
            { initials: 'BR', name: 'Budi Raharjo', event: 'memperbarui jadwal', target: 'Panjat Pinang', time: '1 jam lalu', color: 'bg-neutral-100 text-neutral-700' },
            { initials: 'RS', name: 'Rina Suhartini', event: 'mengirim pengumuman', target: 'Rapat panitia', time: '3 jam lalu', color: 'bg-success-10 text-success-200' },
          ].map((item) => <li key={item.name} className="flex gap-3"><span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${item.color}`}>{item.initials}</span><div className="min-w-0 flex-1"><p className="text-sm leading-5 text-neutral-700"><span className="font-semibold text-neutral-900">{item.name}</span> {item.event} <span className="font-medium text-neutral-800">{item.target}</span></p><p className="mt-1 text-xs text-neutral-400">{item.time}</p></div></li>)}
        </ol>
      </section>
    </div>
    <section className="mt-6 rounded-2xl border border-primary-100/90 bg-white p-5 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-6">
      <SectionHeading title="Perlu Perhatian" action="Lihat semua" />
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { title: 'Pembayaran menunggu', count: '9', desc: 'Perlu verifikasi bukti pembayaran', icon: 'wallet' as const },
          { title: 'Pendaftar baru', count: '6', desc: 'Belum ditinjau panitia lomba', icon: 'users' as const },
          { title: 'Jadwal belum lengkap', count: '2', desc: 'Lomba belum memiliki waktu pelaksanaan', icon: 'calendar' as const },
        ].map((item) => <button key={item.title} type="button" className="flex items-center gap-3 rounded-xl border border-neutral-100 p-4 text-left transition-colors hover:border-primary-200 hover:bg-primary-100/25">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary-100 text-secondary-700"><Icon name={item.icon} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-neutral-900">{item.title}</span><span className="mt-1 block text-xs text-neutral-500">{item.desc}</span></span><span className="text-xl font-semibold tabular-nums text-neutral-900">{item.count}</span>
        </button>)}
      </div>
    </section>
  </>;
}

interface ManagementLayoutProps {
  role: Role;
  userName: string;
  title: string;
  activeItem: Exclude<NavigationKey, null>;
  children: ReactNode;
}

export function ManagementLayout({ role, userName, title, activeItem, children }: ManagementLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const config = navigation[role];
  const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date());
  return (
    <div className="min-h-screen bg-[#FCF4F3] text-neutral-900">
      <div className="min-h-screen lg:pl-69">
        <div className="fixed inset-y-0 left-0 z-40 hidden lg:block"><Sidebar role={role} userName={userName} activeItem={activeItem} /></div>
        {mobileOpen && <div className="fixed inset-0 z-70 lg:hidden"><button type="button" aria-label="Tutup menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-neutral-900/30" /><div className="relative h-full w-[min(84vw,300px)] shadow-2xl"><Sidebar role={role} userName={userName} activeItem={activeItem} onClose={() => setMobileOpen(false)} /></div></div>}
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-primary-100/80 bg-white/95 px-4 backdrop-blur sm:px-7 lg:h-20.5 lg:px-9">
          <div className="flex items-center gap-3"><button type="button" aria-label="Buka menu" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-50 lg:hidden"><Icon name="menu" /></button><div><p className="text-sm font-semibold text-neutral-900">{title}</p><p className="mt-0.5 hidden text-xs text-neutral-400 sm:block">Ruang {config.label}</p></div></div>
          <div className="flex items-center gap-2 sm:gap-4"><span className="hidden text-sm text-neutral-500 md:block">{today}</span><Link href="/" className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-primary-200 hover:text-primary-700 sm:px-4 sm:text-sm">Lihat Website<Icon name="external" className="size-4.25 text-neutral-400" /></Link></div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-7 sm:py-9 lg:px-9 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export function ManagementDashboard({ role, userName }: { role: Role; userName: string }) {
  const isAdmin = role === 'admin';
  return <ManagementLayout role={role} userName={userName} title="Dashboard" activeItem="dashboard">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div><p className="mb-2 text-sm font-medium text-primary-600">{isAdmin ? 'Pusat kendali acara' : 'Selamat datang kembali'}</p><h1 className="text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">{isAdmin ? 'Dashboard Admin' : 'Selamat Datang, Panitia'}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">{isAdmin ? 'Pantau ringkasan kegiatan dan kelola seluruh operasional acara.' : 'Semua yang perlu Anda pantau untuk menjaga acara berjalan lancar.'}</p></div>
    </div>
    {isAdmin ? <AdminContent /> : <PanitiaContent />}
  </ManagementLayout>;
}
