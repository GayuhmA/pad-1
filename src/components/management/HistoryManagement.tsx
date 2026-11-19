'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Icon, ManagementLayout } from '@/components/management/ManagementDashboard';
import { Modal } from '@/components/Modal';

interface HistoryEvent {
  id: string;
  label: string;
  dateRange: string;
  title: string;
  description: string;
}

interface WinnerEntry {
  id: string;
  competition: string;
  category: string;
  participants: string;
  location: string;
  winner: string;
}

const events: HistoryEvent[] = [
  {
    id: '2025',
    label: 'Perayaan 2025',
    dateRange: '14 – 17 Agustus 2025',
    title: 'Nusantara Bersuka, Indonesia Berjaya',
    description: 'Perayaan Hari Ulang Tahun ke-80 Kemerdekaan Republik Indonesia telah dilaksanakan selama empat hari dengan penuh semangat dan antusiasme dari seluruh warga. Berbagai rangkaian kegiatan turut memeriahkan perayaan tahun ini, mulai dari berbagai perlombaan antarwarga hingga Malam Tirakatan yang dilaksanakan sebagai bentuk rasa syukur dan penghormatan terhadap perjuangan para pahlawan. Seluruh kegiatan berlangsung dengan meriah dan penuh kebersamaan, sekaligus menjadi kesempatan bagi warga untuk saling mengenal, mempererat silaturahmi, serta membangun semangat gotong royong di lingkungan bersama.',
  },
  {
    id: '2024',
    label: 'Perayaan 2024',
    dateRange: '15 – 18 Agustus 2024',
    title: 'Semangat Merdeka, Warga Berjaya',
    description: 'Warga merayakan Hari Ulang Tahun Kemerdekaan Republik Indonesia dengan rangkaian lomba, kerja bakti, dan malam kebersamaan. Terima kasih kepada seluruh warga dan panitia yang telah berpartisipasi menjaga suasana tetap hangat, tertib, dan penuh semangat gotong royong.',
  },
];

const initialWinners: Record<string, WinnerEntry[]> = {
  '2025': [
    { id: 'w-1', competition: 'Balap Karung', category: 'Umum', participants: '12 Peserta', location: 'Halaman Balai Desa', winner: 'Tim Merah RW 04' },
    { id: 'w-2', competition: 'Estafet Kelereng', category: 'Anak-anak', participants: '10 Peserta', location: 'Aula Balai Desa', winner: 'Nadia Putri' },
    { id: 'w-3', competition: 'Bola Beracun', category: 'Umum', participants: '8 Regu', location: 'Lapangan Timur', winner: 'Regu Garuda' },
    { id: 'w-4', competition: 'Panjat Pinang', category: 'Dewasa', participants: '8 Regu', location: 'Lapangan Utama', winner: 'Regu Nusantara' },
    { id: 'w-5', competition: 'Menyanyi', category: 'Anak-anak', participants: '10 Peserta', location: 'Aula Balai Desa', winner: 'Rafi Ahmad' },
    { id: 'w-6', competition: 'Estafet Air', category: 'Umum', participants: '10 Regu', location: 'Lapangan Selatan', winner: 'Regu Kompak' },
    { id: 'w-7', competition: 'Estafet Pingpong Air', category: 'Anak-anak', participants: '15 Peserta', location: 'Halaman Balai Desa', winner: 'Dimas Pratama' },
    { id: 'w-8', competition: 'Futsal Sarung', category: 'Dewasa', participants: '10 Regu', location: 'Lapangan Utama', winner: 'Tim Garuda' },
  ],
  '2024': [
    { id: 'w24-1', competition: 'Balap Karung', category: 'Umum', participants: '10 Peserta', location: 'Lapangan Utama', winner: 'Budi Santoso' },
    { id: 'w24-2', competition: 'Makan Kerupuk', category: 'Anak-anak', participants: '12 Peserta', location: 'Halaman Balai Desa', winner: 'Alya Putri' },
    { id: 'w24-3', competition: 'Tarik Tambang', category: 'Dewasa', participants: '6 Regu', location: 'Lapangan Timur', winner: 'Regu Merdeka' },
  ],
};
const emptyWinnerEntries: WinnerEntry[] = [];

function makeId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `winner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function WinnerForm({ initial, onClose, onSave }: { initial: WinnerEntry | null; onClose: () => void; onSave: (entry: WinnerEntry) => void }) {
  const [competition, setCompetition] = useState(initial?.competition ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Umum');
  const [participants, setParticipants] = useState(initial?.participants ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [winner, setWinner] = useState(initial?.winner ?? '');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ id: initial?.id ?? makeId(), competition: competition.trim(), category, participants: participants.trim(), location: location.trim(), winner: winner.trim() });
  }

  const inputClass = 'h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600';
  return <Modal isOpen onClose={onClose} ariaLabel={initial ? 'Edit pemenang' : 'Input pemenang'}>
    <form onSubmit={submit}>
      <div className="border-b border-neutral-100 px-5 py-5 sm:px-7"><h2 className="text-xl font-semibold text-neutral-900">{initial ? 'Edit Pemenang' : 'Input Pemenang'}</h2><p className="mt-1 text-sm text-neutral-500">Lengkapi rekap pemenang untuk perayaan ini.</p></div>
      <div className="grid gap-4 px-5 py-6 sm:grid-cols-2 sm:px-7">
        <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-semibold text-neutral-700">Cabang perlombaan</span><input required maxLength={100} autoFocus value={competition} onChange={(event) => setCompetition(event.target.value)} placeholder="Nama lomba" className={inputClass} /></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold text-neutral-700">Kategori</span><select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}><option>Umum</option><option>Anak-anak</option><option>Dewasa</option></select></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold text-neutral-700">Jumlah peserta</span><input required maxLength={40} value={participants} onChange={(event) => setParticipants(event.target.value)} placeholder="Contoh: 12 Peserta" className={inputClass} /></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold text-neutral-700">Lokasi pelaksanaan</span><input required maxLength={120} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Lokasi lomba" className={inputClass} /></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold text-neutral-700">Pemenang</span><input required maxLength={120} value={winner} onChange={(event) => setWinner(event.target.value)} placeholder="Nama pemenang atau regu" className={inputClass} /></label>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-7"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Batal</button><button type="submit" className="min-h-11 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700">Simpan</button></div>
    </form>
  </Modal>;
}

function DeleteConfirmation({ entry, onClose, onConfirm }: { entry: WinnerEntry; onClose: () => void; onConfirm: () => void }) {
  return <Modal isOpen onClose={onClose} ariaLabel="Hapus rekap pemenang">
    <div className="p-6 sm:p-7"><span className="flex size-11 items-center justify-center rounded-xl bg-error-10 text-error-100"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></svg></span><h2 className="mt-4 text-lg font-semibold text-neutral-900">Hapus rekap pemenang?</h2><p className="mt-2 text-sm leading-6 text-neutral-500">Data <span className="font-semibold text-neutral-700">{entry.competition}</span> akan dihapus dari tampilan histori ini.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Batal</button><button type="button" onClick={onConfirm} className="min-h-10 rounded-xl bg-error-100 px-4 text-sm font-semibold text-white hover:bg-error-200">Hapus</button></div></div>
  </Modal>;
}

export function HistoryManagement({ role, userName }: { role: 'admin' | 'panitia'; userName: string }) {
  const [eventId, setEventId] = useState(events[0].id);
  const [winnersByEvent, setWinnersByEvent] = useState(initialWinners);
  const [descriptionByEvent, setDescriptionByEvent] = useState<Record<string, string>>(() => Object.fromEntries(events.map((event) => [event.id, event.description])));
  const [query, setQuery] = useState('');
  const [editingWinner, setEditingWinner] = useState<WinnerEntry | null>(null);
  const [isAddingWinner, setIsAddingWinner] = useState(false);
  const [deletingWinner, setDeletingWinner] = useState<WinnerEntry | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [notice, setNotice] = useState('');
  const event = events.find((item) => item.id === eventId) ?? events[0];
  const winners = winnersByEvent[eventId] ?? emptyWinnerEntries;
  const description = descriptionByEvent[eventId] ?? event.description;

  const filteredWinners = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('id-ID');
    if (!search) return winners;
    return winners.filter((item) => `${item.competition} ${item.category} ${item.participants} ${item.location} ${item.winner}`.toLocaleLowerCase('id-ID').includes(search));
  }, [query, winners]);

  function saveWinner(entry: WinnerEntry) {
    setWinnersByEvent((current) => ({ ...current, [eventId]: [entry, ...(current[eventId] ?? []).filter((item) => item.id !== entry.id)] }));
    setEditingWinner(null);
    setIsAddingWinner(false);
    setNotice(`Rekap ${entry.competition} diperbarui di pratinjau.`);
  }

  function deleteWinner() {
    if (!deletingWinner) return;
    setWinnersByEvent((current) => ({ ...current, [eventId]: (current[eventId] ?? []).filter((item) => item.id !== deletingWinner.id) }));
    setNotice(`Rekap ${deletingWinner.competition} dihapus dari pratinjau.`);
    setDeletingWinner(null);
  }

  function beginDescriptionEdit() {
    setDescriptionDraft(description);
    setIsEditingDescription(true);
  }

  function saveDescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDescriptionByEvent((current) => ({ ...current, [eventId]: descriptionDraft.trim() }));
    setIsEditingDescription(false);
    setNotice('Ringkasan perayaan diperbarui di pratinjau.');
  }

  return <ManagementLayout role={role} userName={userName} title="Histori" activeItem="history">
    <div className="space-y-7 lg:space-y-9">
      <div><p className="text-sm font-medium text-primary-600">Ruang {role === 'admin' ? 'Administrator' : 'Panitia'}</p><h1 className="mt-1 text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">Histori</h1></div>

      <section aria-label="Pilih histori perayaan" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-100 bg-white px-4 py-4 sm:px-5">
        <label htmlFor="history-event" className="sr-only">Pilih perayaan</label>
        <select id="history-event" value={eventId} onChange={(e) => { setEventId(e.target.value); setQuery(''); setNotice(''); setIsEditingDescription(false); }} className="h-10 min-w-48 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">{events.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
        <p className="text-sm font-medium text-neutral-400">{event.dateRange}</p>
      </section>

      {notice && <p role="status" className="rounded-xl border border-success-100 bg-success-10 px-4 py-3 text-sm font-medium text-success-200">{notice}</p>}

      <section aria-labelledby="history-summary-title" className="relative rounded-2xl border border-primary-100 bg-white p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4"><h2 id="history-summary-title" className="text-lg font-semibold text-neutral-900 sm:text-xl">{event.title}</h2>{!isEditingDescription && <button type="button" onClick={beginDescriptionEdit} aria-label="Edit ringkasan perayaan" title="Edit ringkasan" className="shrink-0 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-primary-100/40 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"><Icon name="edit" className="size-4.5" /></button>}</div>
        {isEditingDescription ? <form onSubmit={saveDescription} className="mt-4"><label htmlFor="history-description" className="sr-only">Ringkasan perayaan</label><textarea id="history-description" required maxLength={2000} autoFocus value={descriptionDraft} onChange={(e) => setDescriptionDraft(e.target.value)} rows={5} className="w-full resize-y rounded-xl border border-neutral-200 px-4 py-3 text-sm leading-6 text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600" /><p className="mt-1 text-right text-xs text-neutral-400">{descriptionDraft.length}/2.000</p><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setIsEditingDescription(false)} className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Batal</button><button type="submit" className="min-h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700">Simpan Ringkasan</button></div></form> : <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-500 sm:text-base">{description}</p>}
      </section>

      <section aria-labelledby="winner-heading" className="overflow-hidden rounded-2xl border border-primary-100 bg-white">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4"><h2 id="winner-heading" className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">Rekap Juara Perlombaan</h2><button type="button" onClick={() => { setIsAddingWinner(true); setNotice(''); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"><span aria-hidden="true" className="text-lg leading-none">+</span>Input Pemenang</button></div>
          <div className="mt-4 max-w-lg"><label htmlFor="winner-search" className="sr-only">Cari rekap pemenang</label><div className="relative"><Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400" /><input id="winner-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, kategori, atau lokasi lomba" className="h-11 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-11 text-sm text-neutral-800 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600" /></div></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <caption className="sr-only">Rekap pemenang perlombaan {event.label}</caption>
            <thead className="bg-neutral-50 text-xs font-semibold text-neutral-700"><tr><th scope="col" className="px-5 py-4">Cabang Perlombaan</th><th scope="col" className="px-4 py-4">Kategori</th><th scope="col" className="px-4 py-4">Partisipan</th><th scope="col" className="px-4 py-4">Lokasi Pelaksanaan</th><th scope="col" className="px-4 py-4">Pemenang</th><th scope="col" className="px-4 py-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredWinners.map((item) => <tr key={item.id} className="transition-colors hover:bg-neutral-50/70"><th scope="row" className="px-5 py-4 font-semibold text-neutral-900">{item.competition}</th><td className="px-4 py-4 text-neutral-500">{item.category}</td><td className="px-4 py-4 text-neutral-500">{item.participants}</td><td className="px-4 py-4 text-neutral-500">{item.location}</td><td className="px-4 py-4 text-neutral-600">{item.winner}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button type="button" onClick={() => { setEditingWinner(item); setNotice(''); }} aria-label={`Edit pemenang ${item.competition}`} title="Edit" className="rounded-lg p-2 text-primary-600 hover:bg-primary-100/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"><Icon name="edit" className="size-4.5" /></button><button type="button" onClick={() => setDeletingWinner(item)} aria-label={`Hapus rekap ${item.competition}`} title="Hapus" className="rounded-lg p-2 text-primary-600 hover:bg-primary-100/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4.5"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></svg></button></div></td></tr>)}
              {filteredWinners.length === 0 && <tr><td colSpan={6} className="px-5 py-14 text-center"><p className="font-semibold text-neutral-800">{query ? 'Rekap tidak ditemukan' : 'Belum ada pemenang'}</p><p className="mt-1 text-sm text-neutral-500">{query ? 'Coba kata kunci lain.' : 'Tambahkan hasil perlombaan untuk perayaan ini.'}</p></td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 px-5 py-4 text-xs font-medium text-neutral-400"><span>{filteredWinners.length} Lomba</span><span>{event.label}</span></footer>
      </section>
    </div>

    {(isAddingWinner || editingWinner) && <WinnerForm key={editingWinner?.id ?? 'new'} initial={editingWinner} onClose={() => { setIsAddingWinner(false); setEditingWinner(null); }} onSave={saveWinner} />}
    {deletingWinner && <DeleteConfirmation entry={deletingWinner} onClose={() => setDeletingWinner(null)} onConfirm={deleteWinner} />}
  </ManagementLayout>;
}
