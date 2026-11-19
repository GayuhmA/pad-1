'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Icon, ManagementLayout } from '@/components/management/ManagementDashboard';
import { Modal } from '@/components/Modal';

type MessageStatus = 'sent' | 'draft';
type MessageFilter = 'all' | MessageStatus;
interface MessageItem {
  id: string;
  subject: string;
  body: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'pad-management-messages:v1';
const seedMessages: MessageItem[] = [
  {
    id: 'sample-final-lomba',
    subject: 'Informasi Final Lomba dan Malam Tirakatan HUT RI ke-81 RW 04',
    body: 'Bapak/Ibu warga RW 04 yang kami hormati,\n\nSehubungan dengan persiapan babak Final Lomba Kemerdekaan dan Malam Tirakatan HUT RI ke-81 yang akan diselenggarakan malam nanti pukul 19:30 WIB di Balai Warga, kami mengimbau seluruh warga untuk memperhatikan hal-hal berikut:\n\n1. Babak Final Tarik Tambang & Balap Karung dimulai tepat pukul 14:00 WIB di Lapangan Utama.\n2. Parkir kendaraan roda dua dialihkan ke halaman Musholla & Pos Ronda RT 02 demi kenyamanan lalu lintas anak-anak.\n3. Kupon konsumsi dan doorprize tirakatan dapat diambil di meja panitia penerima tamu mulai pukul 19:00 WIB.\n\nMari kita semarakkan perayaan kemerdekaan dengan tertib, guyub, dan penuh semangat kebersamaan!\n\nSalam hangat,\nPanitia Peringatan Kemerdekaan RI Ke-81 RW 04',
    status: 'sent',
    createdAt: '2026-08-15T08:10:00.000Z',
    updatedAt: '2026-08-15T08:10:00.000Z',
  },
  {
    id: 'sample-penyisihan',
    subject: 'Panggilan babak penyisihan',
    body: 'Peserta lomba diharapkan hadir tepat waktu untuk mengikuti babak penyisihan sesuai jadwal dan ketentuan yang telah ditetapkan panitia.',
    status: 'sent',
    createdAt: '2026-08-15T06:20:00.000Z',
    updatedAt: '2026-08-15T06:20:00.000Z',
  },
  {
    id: 'sample-kupon',
    subject: 'Pengingat pengambilan kupon',
    body: 'Warga diimbau segera mengambil kupon konsumsi dan doorprize di meja panitia penerima tamu sebelum acara tirakatan dimulai.',
    status: 'draft',
    createdAt: '2026-08-14T09:00:00.000Z',
    updatedAt: '2026-08-14T09:00:00.000Z',
  },
];

function isMessage(value: unknown): value is MessageItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<MessageItem>;
  return typeof item.id === 'string' && typeof item.subject === 'string' && typeof item.body === 'string'
    && (item.status === 'sent' || item.status === 'draft')
    && typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt))
    && typeof item.updatedAt === 'string' && Number.isFinite(Date.parse(item.updatedAt));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(value));
}

function formatAge(value: string, now: number) {
  const difference = Math.max(0, now - Date.parse(value));
  const minutes = Math.floor(difference / 60_000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(value);
}

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `message-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function MessageComposer({
  initialMessage,
  onClose,
  onSave,
  onSend,
}: {
  initialMessage: MessageItem | null;
  onClose: () => void;
  onSave: (subject: string, body: string) => void;
  onSend: (subject: string, body: string) => void;
}) {
  const [subject, setSubject] = useState(initialMessage?.subject ?? '');
  const [body, setBody] = useState(initialMessage?.body ?? '');
  const [error, setError] = useState('');
  const valid = subject.trim().length > 0 && body.trim().length > 0;

  function submit(event: FormEvent<HTMLFormElement>, action: 'save' | 'send') {
    event.preventDefault();
    if (action === 'send' && !valid) {
      setError('Isi subjek dan pesan sebelum mengirim.');
      return;
    }
    (action === 'send' ? onSend : onSave)(subject.trim(), body.trim());
  }

  return (
    <Modal isOpen onClose={onClose} ariaLabel={initialMessage ? 'Edit draft pesan' : 'Tulis pesan'}>
      <form onSubmit={(event) => submit(event, 'send')}>
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-5 sm:px-7">
          <div><h2 className="text-xl font-semibold text-neutral-900">{initialMessage ? 'Edit Draft' : 'Tulis Pesan'}</h2><p className="mt-1 text-sm text-neutral-500">Pesan akan ditujukan kepada seluruh warga.</p></div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-50"><Icon name="close" /></button>
        </div>
        <div className="space-y-5 px-5 py-6 sm:px-7">
          <div>
            <label htmlFor="message-subject" className="mb-2 block text-sm font-semibold text-neutral-700">Subjek</label>
            <input id="message-subject" value={subject} onChange={(event) => { setSubject(event.target.value); setError(''); }} maxLength={140} placeholder="Contoh: Informasi kegiatan warga" className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600" />
            <p className="mt-1 text-right text-xs text-neutral-400">{subject.length}/140</p>
          </div>
          <div>
            <label htmlFor="message-body" className="mb-2 block text-sm font-semibold text-neutral-700">Isi pesan</label>
            <textarea id="message-body" value={body} onChange={(event) => { setBody(event.target.value); setError(''); }} maxLength={10000} rows={10} placeholder="Tulis informasi yang ingin disampaikan kepada warga…" className="w-full resize-y rounded-xl border border-neutral-200 px-4 py-3 text-sm leading-6 text-neutral-800 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600" />
            <p className="mt-1 text-right text-xs text-neutral-400">{body.length}/10.000</p>
          </div>
          {error && <p role="alert" className="text-sm font-medium text-error-100">{error}</p>}
          <p className="rounded-xl bg-neutral-50 px-4 py-3 text-xs leading-5 text-neutral-500">Mode pratinjau: pesan dan draft tersimpan di browser ini saja.</p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Batal</button>
          <button type="button" onClick={() => onSave(subject.trim(), body.trim())} className="min-h-11 rounded-xl border border-primary-100 px-4 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100/40">Simpan Draft</button>
          <button type="submit" disabled={!valid} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"><Icon name="mail" className="size-4" />Kirim Pesan</button>
        </div>
      </form>
    </Modal>
  );
}

export function MessageManagement({ role, userName }: { role: 'admin' | 'panitia'; userName: string }) {
  const [messages, setMessages] = useState<MessageItem[]>(seedMessages);
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(seedMessages[0]?.id ?? null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<MessageItem | null>(null);
  const [notice, setNotice] = useState('');
  const [storageReady, setStorageReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.every(isMessage)) {
            const sorted = [...parsed].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
            setMessages(sorted);
            setSelectedId(sorted[0]?.id ?? null);
          } else {
            setStorageWarning('Data pesan lokal tidak terbaca. Daftar contoh digunakan sementara.');
          }
        }
      } catch {
        setStorageWarning('Penyimpanan browser tidak tersedia. Perubahan hanya tersimpan selama halaman dibuka.');
      } finally {
        setStorageReady(true);
      }
    }, 0);
    return () => window.clearTimeout(hydrate);
  }, []);

  function persist(nextMessages: MessageItem[]) {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMessages));
    } catch {
      setStorageWarning('Penyimpanan browser penuh atau tidak tersedia. Perubahan hanya tersimpan selama halaman dibuka.');
    }
  }

  const visibleMessages = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('id-ID');
    return messages.filter((message) => (filter === 'all' || message.status === filter)
      && (!search || `${message.subject} ${message.body}`.toLocaleLowerCase('id-ID').includes(search)))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [filter, messages, query]);
  const selectedMessage = messages.find((message) => message.id === selectedId && (filter === 'all' || message.status === filter))
    ?? visibleMessages[0]
    ?? null;
  const sentCount = messages.filter((message) => message.status === 'sent').length;
  const draftCount = messages.filter((message) => message.status === 'draft').length;

  const closeComposer = useCallback(() => {
    setComposerOpen(false);
    setEditingDraft(null);
  }, []);

  function openComposer(message: MessageItem | null = null) {
    setEditingDraft(message);
    setComposerOpen(true);
    setNotice('');
  }

  function saveMessage(subject: string, body: string, status: MessageStatus) {
    const timestamp = new Date().toISOString();
    const id = editingDraft?.id ?? createId();
    const next: MessageItem = {
      id,
      subject: subject || 'Draft tanpa subjek',
      body,
      status,
      createdAt: editingDraft?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    const updatedMessages = [next, ...messages.filter((message) => message.id !== id)];
    persist(updatedMessages);
    setMessages(updatedMessages);
    setSelectedId(id);
    setFilter(status === 'draft' ? 'draft' : 'all');
    setNotice(status === 'draft' ? 'Draft berhasil disimpan di browser ini.' : 'Pesan ditandai terkirim pada pratinjau ini.');
    closeComposer();
  }

  function deleteDraft(message: MessageItem) {
    if (message.status !== 'draft') return;
    const updatedMessages = messages.filter((item) => item.id !== message.id);
    persist(updatedMessages);
    setMessages(updatedMessages);
    setSelectedId(null);
    setNotice('Draft dihapus dari browser ini.');
  }

  const filters: { id: MessageFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Semua', count: messages.length },
    { id: 'sent', label: 'Terkirim', count: sentCount },
    { id: 'draft', label: 'Draft', count: draftCount },
  ];

  return (
    <ManagementLayout role={role} userName={userName} title="Pesan" activeItem="messages">
      <div className="space-y-6 lg:space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm font-medium text-primary-600">Ruang {role === 'admin' ? 'Administrator' : 'Panitia'}</p><h1 className="mt-1 text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">Pesan</h1></div>
          <button type="button" onClick={() => openComposer()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"><span aria-hidden="true" className="text-xl leading-none">+</span>Tulis Pesan</button>
        </div>

        <div role="group" aria-label="Filter status pesan" className="flex flex-wrap gap-2 rounded-xl border border-primary-100 bg-white p-3 sm:p-4">
          {filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${filter === item.id ? 'border-primary-100 bg-[#FFE5E2] text-primary-700' : 'border-neutral-200 bg-white text-neutral-500 hover:border-primary-100 hover:text-primary-700'}`}>{item.label}<span className={`text-xs ${filter === item.id ? 'text-primary-600' : 'text-neutral-400'}`}>{item.count}</span></button>)}
        </div>

        {notice && <p role="status" className="rounded-xl border border-success-100 bg-success-10 px-4 py-3 text-sm font-medium text-success-200">{notice}</p>}
        {storageWarning && <p role="status" className="rounded-xl border border-secondary-200 bg-secondary-100/40 px-4 py-3 text-sm text-secondary-700">{storageWarning}</p>}

        <section aria-label="Riwayat pesan" className="grid min-h-[min(68vh,760px)] gap-5 lg:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.3fr)]">
          <div className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-primary-100 bg-white">
            <div className="border-b border-primary-100 p-4 sm:p-5">
              <label htmlFor="message-search" className="sr-only">Cari riwayat pesan</label>
              <div className="relative"><Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400" /><input id="message-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari riwayat pesan" className="h-11 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-11 text-sm text-neutral-800 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600" /></div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {visibleMessages.length ? <ul className="divide-y divide-primary-100">
                {visibleMessages.map((message) => {
                  const active = selectedMessage?.id === message.id;
                  return <li key={message.id}><button type="button" aria-pressed={active} onClick={() => setSelectedId(message.id)} className={`w-full px-5 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary-600 sm:px-6 ${active ? 'bg-neutral-50' : 'hover:bg-neutral-50/70'}`}>
                    <span className="mb-2 block text-right text-xs text-neutral-400">{formatAge(message.updatedAt, now)}</span>
                    <span className="block truncate text-[16px] font-semibold text-neutral-900">{message.subject}</span>
                    <span className="mt-2 block line-clamp-3 text-sm leading-6 text-neutral-500">{message.body || 'Belum ada isi pesan.'}</span>
                    <span className={`mt-2 block text-xs font-medium ${message.status === 'sent' ? 'text-neutral-400' : 'text-secondary-700'}`}>{message.status === 'sent' ? 'Terkirim' : 'Draft'}</span>
                  </button></li>;
                })}
              </ul> : <div className="px-6 py-16 text-center"><h2 className="font-semibold text-neutral-800">{query ? 'Pesan tidak ditemukan' : 'Belum ada pesan'}</h2><p className="mt-2 text-sm leading-6 text-neutral-500">{query ? 'Coba kata kunci lain.' : 'Pesan yang sesuai filter akan muncul di sini.'}</p></div>}
            </div>
          </div>

          <article aria-label={selectedMessage ? `Isi pesan: ${selectedMessage.subject}` : 'Detail pesan'} className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-primary-100 bg-white">
            {selectedMessage ? <>
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 text-xs text-neutral-400 sm:px-7 sm:pt-7"><time dateTime={selectedMessage.updatedAt}>{formatDate(selectedMessage.updatedAt)}</time><span>{formatAge(selectedMessage.updatedAt, now)}</span></div>
              <div className="mx-5 mt-4 border-b border-neutral-200 pb-4 text-center sm:mx-7"><h2 className="text-lg font-semibold leading-7 text-neutral-900 sm:text-xl">{selectedMessage.subject}</h2></div>
              <div className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap px-5 py-5 text-sm leading-7 text-neutral-600 sm:px-7 sm:py-6 sm:text-base">{selectedMessage.body || <span className="italic text-neutral-400">Draft ini belum memiliki isi pesan.</span>}</div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-5 py-4 sm:px-7"><span className={`text-xs font-medium ${selectedMessage.status === 'sent' ? 'text-neutral-400' : 'text-secondary-700'}`}>{selectedMessage.status === 'sent' ? 'Terkirim' : 'Draft'}</span>{selectedMessage.status === 'draft' && <div className="flex gap-2"><button type="button" onClick={() => openComposer(selectedMessage)} className="min-h-10 rounded-lg border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">Edit Draft</button><button type="button" onClick={() => deleteDraft(selectedMessage)} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-error-100 hover:bg-error-10">Hapus</button></div>}</div>
            </> : <div className="m-auto px-6 py-16 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-neutral-50 text-neutral-400"><Icon name="mail" className="size-6" /></span><h2 className="mt-4 font-semibold text-neutral-800">Pilih pesan untuk dibaca</h2><p className="mt-2 text-sm text-neutral-500">Atau tulis pesan baru untuk warga.</p><button type="button" onClick={() => openComposer()} className="mt-5 min-h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700">Tulis Pesan</button></div>}
          </article>
        </section>
      </div>

      {composerOpen && <MessageComposer initialMessage={editingDraft} onClose={closeComposer} onSave={(subject, body) => saveMessage(subject, body, 'draft')} onSend={(subject, body) => saveMessage(subject, body, 'sent')} />}
    </ManagementLayout>
  );
}
