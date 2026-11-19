'use client';

import { useCallback, useMemo, useState } from 'react';
import { Icon, ManagementLayout } from '@/components/management/ManagementDashboard';
import { Modal } from '@/components/Modal';

interface Album {
  id: string;
  title: string;
  date: string;
  photoCount: number;
  videoCount: number;
  accent: string;
}

const albums: Album[] = [
  { id: 'estafet-kelereng-1', title: 'Estafet Kelereng', date: '2025-08-15', photoCount: 5, videoCount: 2, accent: 'from-rose-100 via-orange-50 to-amber-100' },
  { id: 'balap-karung-helm', title: 'Balap Karung Helm', date: '2025-08-16', photoCount: 7, videoCount: 2, accent: 'from-sky-100 via-blue-50 to-indigo-100' },
  { id: 'estafet-kelereng-2', title: 'Estafet Kelereng', date: '2025-08-14', photoCount: 4, videoCount: 4, accent: 'from-orange-100 via-rose-50 to-pink-100' },
  { id: 'makan-kerupuk', title: 'Makan Kerupuk', date: '2026-08-15', photoCount: 8, videoCount: 2, accent: 'from-emerald-100 via-lime-50 to-yellow-100' },
  { id: 'panjat-pinang', title: 'Panjat Pinang', date: '2025-08-15', photoCount: 6, videoCount: 2, accent: 'from-green-100 via-teal-50 to-cyan-100' },
  { id: 'tarik-tambang', title: 'Tarik Tambang', date: '2025-08-17', photoCount: 7, videoCount: 2, accent: 'from-amber-100 via-yellow-50 to-orange-100' },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T00:00:00Z`));
}

function Placeholder({ album, index, video = false, large = false }: { album: Album; index: number; video?: boolean; large?: boolean }) {
  return (
    <div aria-hidden="true" className={`relative flex items-center justify-center overflow-hidden bg-linear-to-br ${album.accent} ${large ? 'min-h-48 sm:min-h-64' : 'aspect-[1.45/1]'}`}>
      <span className="absolute -right-6 -bottom-10 size-36 rounded-full bg-white/35 blur-2xl" />
      <span className="absolute top-4 left-5 size-16 rounded-full bg-white/35 blur-xl" />
      <span className="relative flex flex-col items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-neutral-500 shadow-sm backdrop-blur-sm">
        {video ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={large ? 'size-9' : 'size-7'}><rect x="3" y="5" width="13" height="14" rx="2" /><path d="m16 10 5-3v10l-5-3" /><path d="m8 9 4 3-4 3z" /></svg>
        ) : <Icon name="image" className={large ? 'size-9' : 'size-7'} />}
        <span className="text-xs font-semibold">{video ? 'Placeholder video' : `Placeholder foto ${index + 1}`}</span>
      </span>
    </div>
  );
}

function AlbumPreview({ album, onClose }: { album: Album; onClose: () => void }) {
  const items = [
    ...Array.from({ length: album.photoCount }, (_, index) => ({ id: `photo-${index}`, video: false })),
    ...Array.from({ length: album.videoCount }, (_, index) => ({ id: `video-${index}`, video: true })),
  ];

  return (
    <Modal isOpen onClose={onClose} ariaLabel={`Album ${album.title}`}>
      <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-5 sm:px-7">
        <div><p className="text-sm text-neutral-500">Dokumentasi · {formatDate(album.date)}</p><h2 className="mt-1 text-xl font-semibold text-neutral-900">{album.title}</h2><p className="mt-1 text-sm text-neutral-500">{album.photoCount} foto · {album.videoCount} video</p></div>
        <button type="button" onClick={onClose} aria-label="Tutup album" className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-50"><Icon name="close" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 sm:gap-4 sm:p-7">
        {items.map((item, index) => <div key={item.id} className="overflow-hidden rounded-xl border border-primary-100 bg-white"><Placeholder album={album} index={index} video={item.video} /><p className="px-3 py-2 text-xs font-medium text-neutral-500">{item.video ? `Video ${index - album.photoCount + 1}` : `Foto ${index + 1}`}</p></div>)}
      </div>
    </Modal>
  );
}

export function DocumentationManagement({ role, userName }: { role: 'admin' | 'panitia'; userName: string }) {
  const [query, setQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const closeAlbum = useCallback(() => setSelectedAlbum(null), []);
  const visibleAlbums = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('id-ID');
    return albums.filter((album) => album.title.toLocaleLowerCase('id-ID').includes(search));
  }, [query]);
  const photoCount = albums.reduce((total, album) => total + album.photoCount, 0);
  const videoCount = albums.reduce((total, album) => total + album.videoCount, 0);
  const metrics = [
    { value: albums.length, label: 'Album', icon: 'image' as const },
    { value: photoCount, label: 'Foto', icon: 'image' as const },
    { value: videoCount, label: 'Video', icon: 'image' as const },
  ];

  return (
    <ManagementLayout role={role} userName={userName} title="Dokumentasi" activeItem="documentation">
      <div className="space-y-7 lg:space-y-9">
        <div><p className="text-sm font-medium text-primary-600">Ruang {role === 'admin' ? 'Administrator' : 'Panitia'}</p><h1 className="mt-1 text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">Dokumentasi</h1></div>

        <section aria-label="Ringkasan dokumentasi" className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {metrics.map((metric) => <article key={metric.label} className="flex min-h-24 items-center gap-4 rounded-xl border border-primary-100 bg-white px-5 py-5 sm:px-6"><span className="text-[30px] font-semibold leading-none tracking-tight text-neutral-900">{metric.value}</span><span className="text-sm font-medium text-neutral-500">{metric.label}</span></article>)}
        </section>

        <section aria-label="Daftar album dokumentasi" className="rounded-2xl border border-primary-100 bg-white p-4 sm:p-5 lg:p-6">
          <div className="mb-5 max-w-md">
            <label htmlFor="album-search" className="sr-only">Cari nama album</label>
            <div className="relative"><Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400" /><input id="album-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama album" className="h-12 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-11 text-sm text-neutral-800 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600" /></div>
          </div>

          {visibleAlbums.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visibleAlbums.map((album) => <article key={album.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-colors hover:border-primary-100">
              <button type="button" onClick={() => setSelectedAlbum(album)} aria-haspopup="dialog" aria-label={`Lihat album ${album.title}`} className="group block w-full text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600">
                <div className="relative overflow-hidden"><Placeholder album={album} index={0} /><span className="absolute right-3 bottom-3 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-neutral-600 shadow-sm">{album.photoCount} foto · {album.videoCount} video</span></div>
                <div className="p-3.5 sm:p-4">
                  <div className="flex items-center justify-between gap-3 text-xs text-neutral-400"><time dateTime={album.date}>{formatDate(album.date)}</time></div>
                  <h2 className="mt-2 truncate text-base font-semibold text-neutral-900">{album.title}</h2>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 group-hover:text-primary-700">Lihat album <Icon name="chevron" className="size-4" /></span>
                </div>
              </button>
            </article>)}
          </div> : <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-14 text-center"><span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-neutral-50 text-neutral-400"><Icon name="image" /></span><h2 className="mt-3 font-semibold text-neutral-800">Album tidak ditemukan</h2><p className="mt-1 text-sm text-neutral-500">Coba kata kunci lain untuk mencari dokumentasi.</p></div>}
        </section>
      </div>

      {selectedAlbum && <AlbumPreview album={selectedAlbum} onClose={closeAlbum} />}
    </ManagementLayout>
  );
}
