'use client';

import { Fragment, useCallback, useMemo, useState, type FormEvent } from 'react';
import { Icon, ManagementLayout } from '@/components/management/ManagementDashboard';
import { Modal } from '@/components/Modal';

type CompetitionStatus = 'Berlangsung' | 'Mendatang' | 'Selesai';
type CompetitionKind = 'Regu' | 'Individu';

interface Match {
  teamOne: string;
  teamTwo: string;
  time: string;
  status: CompetitionStatus;
}

interface Competition {
  id: string;
  name: string;
  kind: CompetitionKind;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  registered: number;
  capacity: number;
  status: CompetitionStatus;
  matches: Match[];
}

interface ArchivedCompetition {
  id: string;
  name: string;
  category: string;
  participantCount: number;
  location: string;
}

interface CompetitionForm {
  name: string;
  kind: CompetitionKind;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: string;
}

const initialCompetitions: Competition[] = [
  { id: 'tarik-tambang', name: 'Tarik Tambang', kind: 'Regu', category: 'Dewasa', date: '2026-08-15', startTime: '08:00', endTime: '11:00', location: 'Lapangan Timur', registered: 8, capacity: 10, status: 'Berlangsung', matches: [
    { teamOne: 'Adalah pokoknya', teamTwo: 'Apalah', time: '08.30–09.00', status: 'Berlangsung' },
    { teamOne: 'Adalah pokoknya', teamTwo: 'Apalah', time: '09.00–09.30', status: 'Mendatang' },
    { teamOne: 'Ketoprak Sedap Malam', teamTwo: 'Nasi Padang Murah', time: '09.30–10.00', status: 'Selesai' },
  ] },
  { id: 'catur', name: 'Catur', kind: 'Individu', category: 'Umum', date: '2026-08-15', startTime: '09:00', endTime: '12:00', location: 'Balai Desa', registered: 12, capacity: 12, status: 'Berlangsung', matches: [
    { teamOne: 'Setiawan Raharja', teamTwo: 'Rendra Hariyanto', time: '09.00–09.30', status: 'Berlangsung' },
    { teamOne: 'Dewi Anggraini', teamTwo: 'Rina Puspita', time: '09.30–10.00', status: 'Mendatang' },
  ] },
  { id: 'mewarnai', name: 'Mewarnai', kind: 'Individu', category: 'Anak-anak', date: '2026-08-16', startTime: '13:00', endTime: '15:00', location: 'Aula Balai Desa', registered: 10, capacity: 10, status: 'Mendatang', matches: [] },
  { id: 'balap-karung', name: 'Balap Karung Helm', kind: 'Individu', category: 'Umum', date: '2026-08-16', startTime: '08:00', endTime: '09:30', location: 'Halaman Selatan', registered: 18, capacity: 24, status: 'Mendatang', matches: [] },
  { id: 'estafet-kelereng', name: 'Estafet Kelereng', kind: 'Regu', category: 'Anak-anak', date: '2026-08-16', startTime: '09:30', endTime: '10:30', location: 'Aula Balai Desa', registered: 6, capacity: 8, status: 'Mendatang', matches: [] },
  { id: 'panjat-pinang', name: 'Panjat Pinang', kind: 'Regu', category: 'Dewasa', date: '2026-08-17', startTime: '08:30', endTime: '11:00', location: 'Lapangan Utama', registered: 7, capacity: 8, status: 'Mendatang', matches: [] },
  { id: 'makan-kerupuk', name: 'Makan Kerupuk', kind: 'Individu', category: 'Anak-anak', date: '2026-08-17', startTime: '10:00', endTime: '11:00', location: 'Lapangan Utama', registered: 16, capacity: 20, status: 'Mendatang', matches: [] },
  { id: 'estafet-sarung', name: 'Estafet Sarung', kind: 'Regu', category: 'Umum', date: '2026-08-17', startTime: '11:00', endTime: '12:00', location: 'Lapangan Utama', registered: 5, capacity: 8, status: 'Mendatang', matches: [] },
  { id: 'bakiak', name: 'Lomba Bakiak', kind: 'Regu', category: 'Dewasa', date: '2026-08-17', startTime: '13:00', endTime: '14:30', location: 'Lapangan Timur', registered: 6, capacity: 8, status: 'Mendatang', matches: [] },
  { id: 'memasukkan-paku', name: 'Memasukkan Paku', kind: 'Individu', category: 'Dewasa', date: '2026-08-17', startTime: '14:00', endTime: '15:00', location: 'Halaman Balai Desa', registered: 11, capacity: 16, status: 'Mendatang', matches: [] },
  { id: 'futsal-sarung', name: 'Futsal Sarung', kind: 'Regu', category: 'Dewasa', date: '2026-08-18', startTime: '15:00', endTime: '17:00', location: 'Lapangan Utara', registered: 4, capacity: 8, status: 'Mendatang', matches: [] },
  { id: 'estafet-karet', name: 'Estafet Karet Tepung', kind: 'Regu', category: 'Umum', date: '2026-08-18', startTime: '13:00', endTime: '14:00', location: 'Aula Balai Desa', registered: 0, capacity: 8, status: 'Selesai', matches: [] },
];

const initialArchive: ArchivedCompetition[] = [
  { id: 'archive-mewarnai', name: 'Mewarnai', category: 'Anak-anak', participantCount: 12, location: 'Aula Balai Desa' },
  { id: 'archive-estafet-kelereng', name: 'Estafet Kelereng', category: 'Anak-anak', participantCount: 10, location: 'Aula Balai Desa' },
  { id: 'archive-futsal', name: 'Futsal Sarung', category: 'Dewasa', participantCount: 10, location: 'Lapangan Utara' },
  { id: 'archive-balap-karung', name: 'Balap Karung', category: 'Umum', participantCount: 12, location: 'Halaman Balai Desa' },
];

function currentJakartaDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function emptyForm(): CompetitionForm {
  return {
    name: '', kind: 'Individu', category: 'Umum', date: currentJakartaDate(),
    startTime: '08:00', endTime: '09:00', location: '', capacity: '12',
  };
}

const PAGE_SIZE = 3;

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

function formatTime(time: string) {
  return time.replace(':', '.');
}

function StatusBadge({ status }: { status: CompetitionStatus }) {
  const classes = status === 'Berlangsung'
    ? 'bg-primary-100/75 text-primary-700'
    : status === 'Mendatang' ? 'bg-secondary-100 text-secondary-700' : 'bg-success-10 text-success-200';
  return <span className={`inline-flex whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${classes}`}>{status}</span>;
}

function Capacity({ item }: { item: Competition }) {
  const percentage = Math.min(100, Math.round((item.registered / item.capacity) * 100));
  return <div className="min-w-28">
    <p className="text-xs font-semibold text-neutral-700">{item.registered} / {item.capacity} {item.kind === 'Regu' ? 'regu' : 'peserta'}</p>
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100"><div className={`h-full rounded-full ${percentage >= 90 ? 'bg-primary-600' : 'bg-primary-400'}`} style={{ width: `${percentage}%` }} /></div>
  </div>;
}

function CompetitionFormModal({
  initialValue,
  title,
  onClose,
  onSave,
}: {
  initialValue: CompetitionForm;
  title: string;
  onClose: () => void;
  onSave: (value: CompetitionForm) => void;
}) {
  const [form, setForm] = useState(initialValue);
  return <Modal isOpen onClose={onClose} ariaLabel={title}>
    <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(form); }} className="p-5 sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">Manajemen lomba</p><h2 className="mt-1 text-xl font-semibold text-neutral-900">{title}</h2><p className="mt-1 text-sm text-neutral-500">Lengkapi informasi utama dan jadwal pelaksanaan.</p></div>
        <button type="button" aria-label="Tutup" onClick={onClose} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-50"><Icon name="close" /></button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium text-neutral-700">Nama lomba <span className="text-error-100">*</span></span><input autoFocus required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Contoh: Tarik Tambang" className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm text-neutral-900 outline-none transition focus:border-primary-400 focus:ring-3 focus:ring-primary-100" /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium text-neutral-700">Jenis peserta</span><select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as CompetitionKind })} className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none focus:border-primary-400 focus:ring-3 focus:ring-primary-100"><option>Individu</option><option>Regu</option></select></label>
        <label className="space-y-1.5"><span className="text-sm font-medium text-neutral-700">Kategori</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none focus:border-primary-400 focus:ring-3 focus:ring-primary-100"><option>Anak-anak</option><option>Umum</option><option>Dewasa</option></select></label>
        <label className="space-y-1.5"><span className="text-sm font-medium text-neutral-700">Tanggal</span><input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none focus:border-primary-400 focus:ring-3 focus:ring-primary-100" /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium text-neutral-700">Lokasi</span><input required maxLength={100} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Contoh: Lapangan Utama" className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none focus:border-primary-400 focus:ring-3 focus:ring-primary-100" /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium text-neutral-700">Mulai</span><input required type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none focus:border-primary-400 focus:ring-3 focus:ring-primary-100" /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium text-neutral-700">Selesai</span><input required type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none focus:border-primary-400 focus:ring-3 focus:ring-primary-100" /></label>
        <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium text-neutral-700">Kuota {form.kind === 'Regu' ? 'regu' : 'peserta'}</span><input required type="number" min="1" max="500" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none focus:border-primary-400 focus:ring-3 focus:ring-primary-100 sm:max-w-48" /></label>
      </div>
      <div className="mt-7 flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50">Batal</button>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white transition hover:bg-primary-700"><Icon name="check" className="size-4" />Simpan lomba</button>
      </div>
    </form>
  </Modal>;
}

export function CompetitionManagement({ role, userName }: { role: 'admin' | 'panitia'; userName: string }) {
  const [competitions, setCompetitions] = useState(initialCompetitions);
  const [archived, setArchived] = useState(initialArchive);
  const [query, setQuery] = useState('');
  const [archiveQuery, setArchiveQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua Status' | CompetitionStatus>('Semua Status');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>('tarik-tambang');
  const [dialog, setDialog] = useState<{ mode: 'create' } | { mode: 'edit'; id: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const closeDialog = useCallback(() => { setDialog(null); setFormError(null); }, []);

  const filteredCompetitions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('id-ID');
    return competitions.filter((item) => {
      const matchesQuery = !normalizedQuery || [item.name, item.category, item.location, item.kind].some((value) => value.toLocaleLowerCase('id-ID').includes(normalizedQuery));
      return matchesQuery && (statusFilter === 'Semua Status' || item.status === statusFilter);
    });
  }, [competitions, query, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredCompetitions.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filteredCompetitions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const currentEdit = dialog?.mode === 'edit' ? competitions.find((item) => item.id === dialog.id) : undefined;
  const initialForm: CompetitionForm = currentEdit ? {
    name: currentEdit.name,
    kind: currentEdit.kind,
    category: currentEdit.category,
    date: currentEdit.date,
    startTime: currentEdit.startTime,
    endTime: currentEdit.endTime,
    location: currentEdit.location,
    capacity: String(currentEdit.capacity),
  } : emptyForm();
  const filteredArchive = archived.filter((item) => [item.name, item.category, item.location].some((value) => value.toLocaleLowerCase('id-ID').includes(archiveQuery.trim().toLocaleLowerCase('id-ID'))));

  function saveCompetition(value: CompetitionForm) {
    if (value.endTime <= value.startTime) {
      setFormError('Waktu selesai harus setelah waktu mulai.');
      return;
    }
    const existing = dialog?.mode === 'edit' ? competitions.find((item) => item.id === dialog.id) : undefined;
    const saved: Competition = {
      id: existing?.id ?? `competition-${Date.now()}`,
      name: value.name.trim(),
      kind: value.kind,
      category: value.category,
      date: value.date,
      startTime: value.startTime,
      endTime: value.endTime,
      location: value.location.trim(),
      registered: existing?.registered ?? 0,
      capacity: Number(value.capacity),
      status: existing?.status ?? 'Mendatang',
      matches: existing?.matches ?? [],
    };
    setCompetitions((items) => existing ? items.map((item) => item.id === existing.id ? saved : item) : [saved, ...items]);
    setPage(1);
    closeDialog();
  }

  function archiveCompetition(item: Competition) {
    setCompetitions((items) => items.filter((candidate) => candidate.id !== item.id));
    setArchived((items) => [{ id: item.id, name: item.name, category: item.category, participantCount: item.registered, location: item.location }, ...items]);
    if (expandedId === item.id) setExpandedId(null);
  }

  function restoreCompetition(item: ArchivedCompetition) {
    const restored: Competition = {
      id: item.id, name: item.name, kind: 'Individu', category: item.category,
      date: '2026-08-17', startTime: '09:00', endTime: '10:00', location: item.location,
      registered: item.participantCount, capacity: Math.max(item.participantCount + 4, 12), status: 'Mendatang', matches: [],
    };
    setCompetitions((items) => [restored, ...items]);
    setArchived((items) => items.filter((candidate) => candidate.id !== item.id));
    setPage(1);
  }

  const metrics = [
    { label: 'Total Lomba', value: competitions.length },
    { label: 'Lomba Berlangsung', value: competitions.filter((item) => item.status === 'Berlangsung').length },
    { label: 'Lomba Mendatang', value: competitions.filter((item) => item.status === 'Mendatang').length },
    { label: 'Lomba Selesai', value: competitions.filter((item) => item.status === 'Selesai').length },
  ];

  return <ManagementLayout role={role} userName={userName} title="Kelola Lomba" activeItem="competitions">
    <section className="mb-7 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
      <div><p className="mb-1 text-sm font-medium text-primary-600">Ruang Panitia</p><h1 className="text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">Kelola Lomba</h1><p className="mt-2 text-sm text-neutral-500">Atur lomba, kuota peserta, jadwal, dan hasil pertandingan.</p></div>
      <button type="button" onClick={() => { setFormError(null); setDialog({ mode: 'create' }); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:px-5"><span className="text-xl leading-none">+</span>Tambah Lomba</button>
    </section>

    <section aria-label="Ringkasan lomba" className="mb-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_3px_16px_rgba(34,24,24,0.025)] lg:grid-cols-4">
      {metrics.map((metric, index) => <div key={metric.label} className={`flex min-h-[88px] items-center gap-3 px-4 py-4 sm:px-6 ${index > 0 ? 'border-l border-primary-100' : ''} ${index > 1 ? 'border-t border-primary-100 lg:border-t-0' : ''}`}><p className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[30px]">{metric.value}</p><p className="text-xs leading-5 text-neutral-500 sm:text-sm">{metric.label}</p></div>)}
    </section>

    <section aria-labelledby="active-competitions-title" className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-[0_3px_16px_rgba(34,24,24,0.025)]">
      <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="relative w-full sm:max-w-[420px]"><label htmlFor="competition-search" className="sr-only">Cari lomba aktif</label><Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400" /><input id="competition-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Cari nama, kategori, atau lokasi lomba" className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-primary-400 focus:ring-3 focus:ring-primary-100" /></div>
        <label className="flex items-center gap-2 text-sm text-neutral-500"><span className="sr-only">Filter status lomba</span><Icon name="filter" className="size-4" /><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPage(1); }} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 outline-none focus:border-primary-400"><option>Semua Status</option><option>Berlangsung</option><option>Mendatang</option><option>Selesai</option></select></label>
      </div>
      <h2 id="active-competitions-title" className="sr-only">Daftar lomba</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[990px] border-collapse text-left">
          <thead className="bg-neutral-50 text-xs font-semibold text-neutral-600"><tr>{['Lomba', 'Kategori', 'Jadwal', 'Lokasi', 'Kuota', 'Status', 'Aksi'].map((heading) => <th key={heading} scope="col" className="px-4 py-3.5 first:pl-5 last:pr-5">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-primary-100/80">
            {pageItems.map((item) => <Fragment key={item.id}>
              <tr key={item.id} className="group hover:bg-primary-100/15">
                <td className="px-4 py-4 pl-5"><button type="button" aria-expanded={expandedId === item.id} onClick={() => setExpandedId((current) => current === item.id ? null : item.id)} className="text-left"><span className="block text-sm font-semibold text-neutral-900 hover:text-primary-700">{item.name}</span><span className="mt-0.5 block text-xs text-neutral-400">{item.kind}</span></button></td>
                <td className="px-4 py-4 text-sm text-neutral-600">{item.category}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-neutral-600">{formatDate(item.date)} · {formatTime(item.startTime)}–{formatTime(item.endTime)}</td>
                <td className="px-4 py-4 text-sm text-neutral-600">{item.location}</td>
                <td className="px-4 py-4"><Capacity item={item} /></td>
                <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-4 pr-5"><div className="flex items-center gap-2"><button type="button" onClick={() => { setFormError(null); setDialog({ mode: 'edit', id: item.id }); }} className="rounded-lg px-2.5 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-100/60 focus-visible:outline-2 focus-visible:outline-primary-600">Edit</button><details className="group/menu relative"><summary aria-label={`Aksi lainnya untuk ${item.name}`} className="flex size-9 cursor-pointer list-none items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary-600"><Icon name="dots" /></summary><div className="absolute top-full right-0 z-20 mt-1 w-44 rounded-xl border border-neutral-100 bg-white p-1.5 shadow-lg"><button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); archiveCompetition(item); }} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50">Arsipkan lomba</button></div></details></div></td>
              </tr>
              {expandedId === item.id && item.matches.length > 0 && <tr key={`${item.id}-matches`} className="bg-white"><td colSpan={7} className="px-4 pb-4 pt-1 sm:px-5"><div className="overflow-x-auto rounded-xl border border-neutral-100"><table className="w-full min-w-[640px] text-left"><thead className="bg-neutral-50 text-xs font-semibold text-neutral-500"><tr><th scope="col" className="px-3 py-2.5">Tim 1</th><th scope="col" className="px-3 py-2.5">Tim 2</th><th scope="col" className="px-3 py-2.5">Waktu</th><th scope="col" className="px-3 py-2.5">Status</th></tr></thead><tbody className="divide-y divide-neutral-100">{item.matches.map((match, index) => <tr key={`${match.time}-${index}`} className="text-xs text-neutral-700"><td className="px-3 py-3 font-medium">{match.teamOne}</td><td className="px-3 py-3 font-medium">{match.teamTwo}</td><td className="px-3 py-3">{match.time}</td><td className="px-3 py-3"><StatusBadge status={match.status} /></td></tr>)}</tbody></table></div></td></tr>}
            </Fragment>)}
            {pageItems.length === 0 && <tr><td colSpan={7} className="px-5 py-14 text-center"><span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-neutral-50 text-neutral-400"><Icon name="search" /></span><p className="mt-3 text-sm font-semibold text-neutral-800">Lomba tidak ditemukan</p><p className="mt-1 text-sm text-neutral-500">Coba kata kunci atau filter status yang berbeda.</p></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-3.5 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p aria-live="polite">Menampilkan {filteredCompetitions.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filteredCompetitions.length)} dari {filteredCompetitions.length} lomba</p>
        <nav aria-label="Navigasi halaman lomba" className="flex items-center gap-1">
          <button type="button" disabled={currentPage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label="Halaman sebelumnya" className="flex size-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-100 disabled:cursor-not-allowed disabled:text-neutral-300"><Icon name="chevron" className="size-4 rotate-180" /></button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} type="button" aria-current={currentPage === pageNumber ? 'page' : undefined} onClick={() => setPage(pageNumber)} className={`size-8 rounded-lg text-xs font-semibold ${currentPage === pageNumber ? 'bg-primary-100 text-primary-700' : 'text-neutral-500 hover:bg-neutral-50'}`}>{pageNumber}</button>)}
          <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} aria-label="Halaman berikutnya" className="flex size-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-100 disabled:cursor-not-allowed disabled:text-neutral-300"><Icon name="chevron" className="size-4" /></button>
        </nav>
      </div>
    </section>

    <section aria-labelledby="archive-title" className="mt-9 sm:mt-11">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-sm font-medium text-primary-600">Koleksi sebelumnya</p><h2 id="archive-title" className="text-[22px] font-semibold tracking-tight text-neutral-900 sm:text-[26px]">Arsip Lomba</h2></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-neutral-500">{archived.length} contoh arsip</span></div>
      <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-[0_3px_16px_rgba(34,24,24,0.025)] sm:p-5">
        <div className="relative mb-4 max-w-[420px]"><label htmlFor="archive-search" className="sr-only">Cari lomba arsip</label><Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400" /><input id="archive-search" type="search" value={archiveQuery} onChange={(event) => setArchiveQuery(event.target.value)} placeholder="Cari nama, kategori, atau lokasi lomba" className="h-11 w-full rounded-xl border border-neutral-200 pl-11 pr-4 text-sm outline-none placeholder:text-neutral-400 focus:border-primary-400 focus:ring-3 focus:ring-primary-100" /></div>
        {filteredArchive.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{filteredArchive.map((item) => <article key={item.id} className="flex min-h-36 flex-col rounded-xl border border-neutral-200 p-4 transition hover:border-primary-200 hover:shadow-sm"><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold text-neutral-900">{item.name}</h3><p className="mt-1 text-xs text-neutral-500">{item.participantCount} peserta · {item.category}</p><p className="mt-1 text-xs text-neutral-400">{item.location}</p></div><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-400"><Icon name="clock" className="size-4" /></span></div><button type="button" onClick={() => restoreCompetition(item)} className="mt-auto self-end pt-4 text-xs font-semibold text-primary-600 hover:text-primary-700">Pulihkan lomba</button></article>)}</div> : <p className="rounded-xl bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">Tidak ada arsip yang cocok dengan pencarian.</p>}
      </div>
    </section>
    {dialog && <CompetitionFormModal key={dialog.mode === 'edit' ? dialog.id : 'create'} title={dialog.mode === 'edit' ? 'Edit Lomba' : 'Tambah Lomba'} initialValue={initialForm} onClose={closeDialog} onSave={saveCompetition} />}
    {formError && <div role="alert" className="fixed right-5 bottom-5 z-[110] max-w-sm rounded-xl border border-error-100/20 bg-white px-4 py-3 text-sm font-medium text-error-100 shadow-lg">{formError}<button type="button" onClick={() => setFormError(null)} aria-label="Tutup pesan" className="ml-3 font-bold">×</button></div>}
  </ManagementLayout>;
}
