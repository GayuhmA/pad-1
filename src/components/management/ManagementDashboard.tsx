'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { createMatch, getManagementDashboard, getMatchOptions } from '@/lib/api/management-dashboard';
import { ApiRequestError } from '@/lib/api/client';
import { Modal } from '@/components/Modal';
import type { CreateMatchInput, DashboardAgenda, DashboardMatch, ManagementDashboardData, MatchOptionsData } from '@/types/dashboard';

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

function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-[18px] font-semibold tracking-tight text-neutral-900 sm:text-xl">{title}</h2>{action && <button type="button" onClick={onAction} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700">{action}<Icon name="arrow" className="size-4" /></button>}</div>;
}

function MetricCard({ label, value, icon, index }: { label: string; value: number; icon: IconName; index: number }) {
  return <article className="rounded-2xl border border-primary-100/90 bg-white p-5 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-6">
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <span className={`flex size-9 items-center justify-center rounded-xl ${index === 3 ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100/65 text-primary-600'}`}><Icon name={icon} className="size-4.5" /></span>
    </div>
    <p className="mt-3 text-[34px] font-semibold leading-none tracking-tight text-neutral-900 sm:text-[38px]">{value}</p>
  </article>;
}

function StagePill({ children, active = false }: { children: string; active?: boolean }) {
  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${active ? 'bg-[#FFE0DD] text-primary-700' : 'bg-neutral-50 text-neutral-400'}`}>{children}</span>;
}

function MatchRow({ match }: { match: DashboardMatch }) {
  const phases = ['Penyisihan', 'Semifinal', 'Final'];
  return <article className="py-4 first:pt-0 last:pb-0">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="font-semibold text-neutral-900">{match.nama_lomba}</h3><p className="mt-1 text-sm text-neutral-500">{match.lokasi || 'Lokasi belum ditentukan'} · {match.waktu_mulai}{match.waktu_selesai ? `–${match.waktu_selesai}` : ''}</p></div>
      <div className="flex gap-1.5">{phases.map((phase) => <StagePill key={phase} active={match.babak === phase}>{phase}</StagePill>)}</div>
    </div>
    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 text-[13px]">
      <span className="min-w-0 flex-1 truncate font-medium text-neutral-800">{match.peserta_1}</span><span className="text-xs font-bold text-primary-600">VS</span><span className="min-w-0 flex-1 truncate text-right font-medium text-neutral-800">{match.peserta_2}</span>
    </div>
  </article>;
}

function addIsoDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function AgendaPanel({ agenda, tanggal, onDateChange }: { agenda: DashboardAgenda[]; tanggal: string; onDateChange: (value: string) => void }) {
  const today = jakartaToday();
  const tomorrow = addIsoDays(today, 1);
  const displayedDate = tanggal || today;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const customDateRef = useRef<HTMLInputElement>(null);
  const selectedTab = displayedDate === today ? 'today' : displayedDate === tomorrow ? 'tomorrow' : 'custom';
  const formattedCustomDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(`${displayedDate}T12:00:00+07:00`));
  return (
    <section className="rounded-2xl border border-primary-100/90 bg-white p-5 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-6">
      <SectionHeading title="Jadwal dan Agenda" action="Semua agenda" onAction={() => { setShowDatePicker(true); customDateRef.current?.focus(); }} />
      {showDatePicker && <label className="mb-4 flex items-center gap-2 text-sm text-neutral-600"><Icon name="calendar" className="size-4 text-neutral-400" /><span>Pilih tanggal</span><input ref={customDateRef} type="date" value={displayedDate} onChange={(event) => { if (event.target.value) onDateChange(event.target.value); }} className="ml-auto h-9 rounded-lg border border-neutral-200 bg-white px-2 text-xs outline-none focus:border-primary-400" /></label>}
      <div role="tablist" aria-label="Pilih hari agenda" className="mb-5 grid grid-cols-3 rounded-xl bg-neutral-50 p-1">
        <button type="button" role="tab" aria-selected={selectedTab === 'today'} onClick={() => onDateChange(today)} className={`min-h-10 rounded-lg px-2 text-xs font-semibold transition-colors sm:text-sm ${selectedTab === 'today' ? 'bg-[#FBD0CC] text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}>Hari Ini</button>
        <button type="button" role="tab" aria-selected={selectedTab === 'tomorrow'} onClick={() => onDateChange(tomorrow)} className={`min-h-10 rounded-lg px-2 text-xs font-semibold transition-colors sm:text-sm ${selectedTab === 'tomorrow' ? 'bg-[#FBD0CC] text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}>Besok</button>
        <button type="button" role="tab" aria-selected={selectedTab === 'custom'} onClick={() => { setShowDatePicker(true); customDateRef.current?.focus(); }} className={`min-h-10 rounded-lg px-2 text-xs font-semibold transition-colors sm:text-sm ${selectedTab === 'custom' ? 'bg-[#FBD0CC] text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}>{selectedTab === 'custom' ? formattedCustomDate : 'Pilih Tanggal'}</button>
      </div>
      {agenda.length === 0 ? <p className="py-6 text-center text-sm text-neutral-500">Tidak ada agenda pada tanggal ini.</p> : <ol className="divide-y divide-neutral-100">
        {agenda.map((item) => <li key={item.id_jadwal} className="grid grid-cols-[58px_1fr] gap-4 py-4 first:pt-2 last:pb-1 sm:grid-cols-[76px_1fr] sm:gap-5">
          <span className="border-r border-neutral-100 pt-0.5 text-sm font-semibold tabular-nums text-primary-600 sm:text-base">{item.waktu_mulai.slice(0, 5)}</span>
          <div><h3 className="font-semibold text-neutral-900">{item.nama_lomba}</h3><p className="mt-1 text-sm text-neutral-500">{item.lokasi || 'Lokasi belum ditentukan'}</p></div>
        </li>)}
      </ol>}
    </section>
  );
}

function jakartaToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function MatchFormModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [options, setOptions] = useState<MatchOptionsData | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [idLomba, setIdLomba] = useState('');
  const [idJadwal, setIdJadwal] = useState('');
  const [peserta1, setPeserta1] = useState('');
  const [peserta2, setPeserta2] = useState('');
  const [babak, setBabak] = useState('');
  const [tanggal, setTanggal] = useState(jakartaToday);
  const [waktuMulai, setWaktuMulai] = useState('');
  const [waktuSelesai, setWaktuSelesai] = useState('');
  const [status, setStatus] = useState<CreateMatchInput['status']>('Dijadwalkan');

  useEffect(() => {
    const controller = new AbortController();
    getMatchOptions(controller.signal).then((response) => {
      setOptions(response.data);
      if (response.data.lomba[0]) setIdLomba(String(response.data.lomba[0].id_lomba));
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setFormError(error instanceof Error ? error.message : 'Opsi pertandingan gagal dimuat.');
    }).finally(() => { if (!controller.signal.aborted) setLoadingOptions(false); });
    return () => controller.abort();
  }, []);

  const availableSchedules = options?.jadwal.filter((item) => String(item.id_lomba) === idLomba) ?? [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (peserta1.trim().toLocaleLowerCase('id-ID') === peserta2.trim().toLocaleLowerCase('id-ID')) {
      setFormError('Peserta 1 dan peserta 2 harus berbeda.');
      return;
    }
    if (waktuSelesai && waktuSelesai <= waktuMulai) {
      setFormError('Waktu selesai harus setelah waktu mulai.');
      return;
    }
    setSaving(true);
    const input: CreateMatchInput = {
      id_lomba: Number(idLomba),
      ...(idJadwal ? { id_jadwal: Number(idJadwal) } : {}),
      peserta_1: peserta1.trim(),
      peserta_2: peserta2.trim(),
      ...(babak.trim() ? { babak: babak.trim() } : {}),
      tanggal,
      waktu_mulai: waktuMulai,
      ...(waktuSelesai ? { waktu_selesai: waktuSelesai } : {}),
      status: status ?? 'Dijadwalkan',
    };
    try {
      await createMatch(input);
      onCreated();
    } catch (error) {
      setFormError(error instanceof ApiRequestError ? error.message : 'Pertandingan gagal disimpan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 outline-none focus:border-primary-400 focus:ring-3 focus:ring-primary-100';
  return <Modal isOpen onClose={saving ? () => undefined : onClose} ariaLabel="Tambah pertandingan">
    <form onSubmit={(event) => void handleSubmit(event)} className="p-5 sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">Manajemen pertandingan</p><h2 className="mt-1 text-xl font-semibold text-neutral-900">Tambah Pertandingan</h2><p className="mt-1 text-sm text-neutral-500">Lengkapi peserta dan jadwal pertandingan.</p></div><button type="button" aria-label="Tutup" onClick={onClose} disabled={saving} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"><Icon name="close" /></button></div>
      {loadingOptions ? <p role="status" className="rounded-xl bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">Memuat pilihan lomba dan jadwal…</p> : <>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium text-neutral-700">Lomba <span className="text-error-100">*</span></span><select required value={idLomba} onChange={(event) => { setIdLomba(event.target.value); setIdJadwal(''); }} className={inputClass}><option value="">Pilih lomba</option>{options?.lomba.map((item) => <option key={item.id_lomba} value={item.id_lomba}>{item.nama_lomba}</option>)}</select>{options?.lomba.length === 0 && <span className="block text-xs text-neutral-500">Belum ada lomba pada periode aktif.</span>}</label>
          <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium text-neutral-700">Jadwal / lokasi</span><select value={idJadwal} onChange={(event) => { const value = event.target.value; setIdJadwal(value); const selected = availableSchedules.find((item) => String(item.id_jadwal) === value); if (selected) { setTanggal(selected.tanggal); if (selected.waktu_mulai) setWaktuMulai(selected.waktu_mulai.slice(0, 5)); if (selected.waktu_selesai) setWaktuSelesai(selected.waktu_selesai.slice(0, 5)); } }} className={inputClass}><option value="">Tanpa jadwal terkait</option>{availableSchedules.map((item) => <option key={item.id_jadwal} value={item.id_jadwal}>{item.tanggal} · {item.waktu_mulai?.slice(0, 5) ?? '--:--'} · {item.lokasi ?? item.nama_lomba}</option>)}</select></label>
          <label className="space-y-1.5"><span className="text-sm font-medium text-neutral-700">Peserta 1 <span className="text-error-100">*</span></span><input required maxLength={150} value={peserta1} onChange={(event) => setPeserta1(event.target.value)} className={inputClass} /></label>
          <label className="space-y-1.5"><span className="text-sm font-medium text-neutral-700">Peserta 2 <span className="text-error-100">*</span></span><input required maxLength={150} value={peserta2} onChange={(event) => setPeserta2(event.target.value)} className={inputClass} /></label>
          <label className="space-y-1.5"><span className="text-sm font-medium text-neutral-700">Babak</span><input maxLength={50} value={babak} onChange={(event) => setBabak(event.target.value)} placeholder="Penyisihan / Semifinal / Final" className={inputClass} /></label>
          <label className="space-y-1.5"><span className="text-sm font-medium text-neutral-700">Status</span><select value={status} onChange={(event) => setStatus(event.target.value as CreateMatchInput['status'])} className={inputClass}><option value="Dijadwalkan">Dijadwalkan</option><option value="Berlangsung">Berlangsung</option><option value="Selesai">Selesai</option></select></label>
          <label className="space-y-1.5"><span className="text-sm font-medium text-neutral-700">Tanggal <span className="text-error-100">*</span></span><input required type="date" value={tanggal} onChange={(event) => setTanggal(event.target.value)} className={inputClass} /></label>
          <div className="grid grid-cols-2 gap-3"><label className="space-y-1.5"><span className="text-sm font-medium text-neutral-700">Mulai <span className="text-error-100">*</span></span><input required type="time" value={waktuMulai} onChange={(event) => setWaktuMulai(event.target.value)} className={inputClass} /></label><label className="space-y-1.5"><span className="text-sm font-medium text-neutral-700">Selesai</span><input type="time" value={waktuSelesai} onChange={(event) => setWaktuSelesai(event.target.value)} className={inputClass} /></label></div>
        </div>
      </>}
      {formError && <p role="alert" className="mt-4 rounded-xl bg-error-10 px-4 py-3 text-sm text-error-100">{formError}</p>}
      <div className="mt-7 flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="min-h-11 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50">Batal</button><button type="submit" disabled={saving || loadingOptions || !options?.lomba.length} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"><Icon name="check" className="size-4" />{saving ? 'Menyimpan…' : 'Simpan pertandingan'}</button></div>
    </form>
  </Modal>;
}

function ManagementContent({ data, tanggal, loading, error, onRetry, onDateChange, onAddMatch }: {
  data: ManagementDashboardData | null;
  tanggal: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onDateChange: (value: string) => void;
  onAddMatch: () => void;
}) {
  if (loading && !data) return <div role="status" className="rounded-2xl border border-primary-100 bg-white px-5 py-16 text-center text-sm text-neutral-500">Memuat dashboard…</div>;
  if (error && !data) return <div className="rounded-2xl border border-error-100/30 bg-white px-5 py-12 text-center"><p role="alert" className="text-sm text-error-100">{error}</p><button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white">Coba lagi</button></div>;
  if (!data) return null;
  return <>
    {error && <p role="alert" className="mb-5 rounded-xl bg-error-10 px-4 py-3 text-sm text-error-100">Pembaruan data gagal: {error}</p>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <MetricCard label="Total Lomba" value={data.ringkasan.total_lomba} icon="trophy" index={0} />
      <MetricCard label="Total Pendaftar" value={data.ringkasan.total_pendaftar} icon="users" index={1} />
      <MetricCard label="Pembayaran Lunas" value={data.ringkasan.pembayaran_lunas} icon="check" index={2} />
      <MetricCard label="Belum Lunas" value={data.ringkasan.pembayaran_belum_lunas} icon="wallet" index={3} />
    </div>
    <div className="mt-6 grid items-start gap-5 2xl:grid-cols-[1fr_1.02fr]">
      <section className="rounded-2xl border border-primary-100/90 bg-white p-5 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-6">
        <SectionHeading title="Sedang Berlangsung" action="Tambah Pertandingan" onAction={onAddMatch} />
        {data.sedang_berlangsung.length === 0 ? <p className="py-6 text-center text-sm text-neutral-500">Tidak ada pertandingan yang sedang berlangsung.</p> : <div className="divide-y divide-neutral-100">{data.sedang_berlangsung.map((match) => <MatchRow key={match.id_pertandingan} match={match} />)}</div>}
      </section>
      <AgendaPanel agenda={data.agenda} tanggal={tanggal} onDateChange={onDateChange} />
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
  const [dashboard, setDashboard] = useState<ManagementDashboardData | null>(null);
  const [tanggal, setTanggal] = useState(jakartaToday);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    getManagementDashboard(tanggal, controller.signal).then((response) => {
      setDashboard(response.data);
      setTanggal(response.data.tanggal_filter);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Dashboard gagal dimuat.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [tanggal, refreshKey]);

  const handleDateChange = useCallback((value: string) => setTanggal(value), []);
  const refresh = useCallback(() => setRefreshKey((current) => current + 1), []);
  const handleMatchCreated = useCallback(() => {
    setShowMatchModal(false);
    refresh();
  }, [refresh]);

  return <ManagementLayout role={role} userName={userName} title="Dashboard" activeItem="dashboard">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div><p className="mb-2 text-sm font-medium text-primary-600">{isAdmin ? 'Pusat kendali acara' : 'Selamat datang kembali'}</p><h1 className="text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">{isAdmin ? 'Dashboard Admin' : 'Selamat Datang, Panitia'}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Semua yang perlu Anda pantau untuk menjaga acara berjalan lancar.</p></div>
    </div>
    <ManagementContent data={dashboard} tanggal={tanggal} loading={loading} error={loadError} onRetry={refresh} onDateChange={handleDateChange} onAddMatch={() => setShowMatchModal(true)} />
    {showMatchModal && <MatchFormModal onClose={() => setShowMatchModal(false)} onCreated={handleMatchCreated} />}
  </ManagementLayout>;
}
