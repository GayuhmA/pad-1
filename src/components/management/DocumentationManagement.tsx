'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon, ManagementLayout } from '@/components/management/ManagementDashboard';
import { Modal } from '@/components/Modal';
import {
  createAlbum,
  deleteAlbum,
  deleteMedia,
  getAlbumDetail,
  getAlbums,
  uploadMedia,
} from '@/lib/api/dokumentasi';
import type { AlbumDokumentasi, DetailAlbumDokumentasi, MediaDokumentasi } from '@/types/management-dokumentasi';

const accents = [
  'from-rose-100 via-orange-50 to-amber-100',
  'from-sky-100 via-blue-50 to-indigo-100',
  'from-orange-100 via-rose-50 to-pink-100',
  'from-emerald-100 via-lime-50 to-yellow-100',
  'from-green-100 via-teal-50 to-cyan-100',
  'from-amber-100 via-yellow-50 to-orange-100',
];

function formatDate(value: string) {
  if (!value) return '–';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

function Placeholder({
  index,
  accent,
  video = false,
  large = false,
}: {
  index: number;
  accent: string;
  video?: boolean;
  large?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center overflow-hidden bg-linear-to-br ${accent} ${
        large ? 'min-h-48 sm:min-h-64' : 'aspect-[1.45/1]'
      }`}
    >
      <span className="absolute -right-6 -bottom-10 size-36 rounded-full bg-white/35 blur-2xl" />
      <span className="absolute top-4 left-5 size-16 rounded-full bg-white/35 blur-xl" />
      <span className="relative flex flex-col items-center gap-2 rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-neutral-500 shadow-sm backdrop-blur-sm">
        {video ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={large ? 'size-9' : 'size-7'}>
            <rect x="3" y="5" width="13" height="14" rx="2" />
            <path d="m16 10 5-3v10l-5-3" />
            <path d="m8 9 4 3-4 3z" />
          </svg>
        ) : (
          <Icon name="image" className={large ? 'size-9' : 'size-7'} />
        )}
        <span className="text-xs font-semibold">{video ? 'Video kegiatan' : `Foto ${index + 1}`}</span>
      </span>
    </div>
  );
}

function AlbumPreview({
  album,
  onClose,
  onAlbumDeleted,
  onMediaUpdated,
}: {
  album: AlbumDokumentasi;
  onClose: () => void;
  onAlbumDeleted: () => void;
  onMediaUpdated: () => void;
}) {
  const [detail, setDetail] = useState<DetailAlbumDokumentasi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [jenisFile, setJenisFile] = useState<'Foto' | 'Video'>('Foto');
  const [keterangan, setKeterangan] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Delete state
  const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAlbumDetail(album.id_album);
      setDetail(res.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat detail album.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [album.id_album]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  async function handleUploadMedia(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaFile) {
      setUploadError('Pilih file foto atau video terlebih dahulu.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('jenis_file', jenisFile);
      formData.append('file', mediaFile);
      if (keterangan.trim()) {
        formData.append('keterangan', keterangan.trim());
      }

      await uploadMedia(album.id_album, formData);
      setUploadOpen(false);
      setMediaFile(null);
      setKeterangan('');
      await loadDetail();
      onMediaUpdated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengunggah media.';
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteMedia(idMedia: number) {
    if (!confirm('Apakah Anda yakin ingin menghapus media ini?')) return;
    setDeletingMediaId(idMedia);
    try {
      await deleteMedia(album.id_album, idMedia);
      await loadDetail();
      onMediaUpdated();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus media.');
    } finally {
      setDeletingMediaId(null);
    }
  }

  async function handleDeleteAlbum() {
    if (!confirm(`Hapus album "${album.nama_album}" beserta seluruh medianya? Tindakan ini tidak dapat dibatalkan.`)) return;
    setIsDeletingAlbum(true);
    try {
      await deleteAlbum(album.id_album);
      onAlbumDeleted();
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus album.');
      setIsDeletingAlbum(false);
    }
  }

  const accent = accents[album.id_album % accents.length];
  const mediaList = detail?.media ?? [];

  return (
    <Modal isOpen onClose={onClose} ariaLabel={`Album ${album.nama_album}`}>
      <div className="flex flex-col gap-4 border-b border-neutral-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="text-sm text-neutral-500">Dokumentasi · {formatDate(album.tanggal_album)}</p>
          <h2 className="mt-1 text-xl font-semibold text-neutral-900">{album.nama_album}</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {detail ? `${detail.jumlah_foto} foto · ${detail.jumlah_video} video` : `${album.jumlah_foto} foto · ${album.jumlah_video} video`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary-600 px-4 text-xs font-semibold text-white transition hover:bg-primary-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Unggah Media</span>
          </button>

          <button
            type="button"
            disabled={isDeletingAlbum}
            onClick={handleDeleteAlbum}
            title="Hapus Album"
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>{isDeletingAlbum ? 'Menghapus...' : 'Hapus'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup album"
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-50"
          >
            <Icon name="close" />
          </button>
        </div>
      </div>

      {uploadOpen && (
        <form onSubmit={handleUploadMedia} className="border-b border-neutral-100 bg-neutral-50/70 p-5 sm:p-7">
          <h3 className="text-sm font-semibold text-neutral-800">Unggah Foto atau Video Baru</h3>
          {uploadError && (
            <p className="mt-2 text-xs font-medium text-red-600">{uploadError}</p>
          )}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600">Jenis File</label>
              <select
                value={jenisFile}
                onChange={(e) => setJenisFile(e.target.value as 'Foto' | 'Video')}
                className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-800 outline-none focus:border-primary-400"
              >
                <option value="Foto">Foto</option>
                <option value="Video">Video</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600">Pilih File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={jenisFile === 'Foto' ? 'image/*' : 'video/*'}
                onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
                className="mt-1 block h-10 w-full rounded-xl border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 file:mr-2 file:rounded-lg file:border-0 file:bg-primary-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-primary-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600">Keterangan (Opsional)</label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Babak final"
                className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-800 outline-none focus:border-primary-400"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setUploadOpen(false);
                setMediaFile(null);
                setUploadError(null);
              }}
              className="min-h-9 rounded-xl border border-neutral-200 px-3.5 text-xs font-semibold text-neutral-600 hover:bg-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="min-h-9 rounded-xl bg-primary-600 px-4 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isUploading ? 'Mengunggah...' : 'Unggah'}
            </button>
          </div>
        </form>
      )}

      <div className="p-5 sm:p-7">
        {loading && (
          <div className="py-12 text-center text-sm text-neutral-400">
            Memuat media dokumentasi...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && mediaList.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-12 text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-neutral-50 text-neutral-400">
              <Icon name="image" />
            </span>
            <p className="mt-3 text-sm font-semibold text-neutral-800">Belum ada foto atau video</p>
            <p className="mt-1 text-xs text-neutral-400">Gunakan tombol &quot;Unggah Media&quot; di atas untuk menambahkan dokumentasi pertama.</p>
          </div>
        )}

        {!loading && !error && mediaList.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {mediaList.map((item, index) => (
              <div
                key={item.id_dokumentasi}
                className="group relative overflow-hidden rounded-xl border border-primary-100 bg-white shadow-2xs"
              >
                {item.jenis_file === 'Video' ? (
                  <video
                    src={item.file}
                    controls
                    className="aspect-[1.45/1] w-full rounded-t-xl bg-black object-cover"
                  />
                ) : item.file ? (
                  <img
                    src={item.file}
                    alt={item.keterangan || `Foto ${index + 1}`}
                    className="aspect-[1.45/1] w-full rounded-t-xl object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const fallback = (e.target as HTMLElement).nextElementSibling;
                      if (fallback) (fallback as HTMLElement).style.display = 'flex';
                    }}
                  />
                ) : null}

                <div style={{ display: item.file ? 'none' : 'flex' }}>
                  <Placeholder index={index} accent={accent} video={item.jenis_file === 'Video'} />
                </div>

                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <p className="truncate text-xs font-medium text-neutral-600">
                    {item.keterangan || (item.jenis_file === 'Video' ? `Video ${index + 1}` : `Foto ${index + 1}`)}
                  </p>
                  <button
                    type="button"
                    disabled={deletingMediaId === item.id_dokumentasi}
                    onClick={() => handleDeleteMedia(item.id_dokumentasi)}
                    title="Hapus media"
                    className="rounded-md p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function CreateAlbumModal({
  isOpen,
  onClose,
  onAlbumCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAlbumCreated: () => void;
}) {
  const [namaAlbum, setNamaAlbum] = useState('');
  const [tanggalAlbum, setTanggalAlbum] = useState(() => new Date().toISOString().slice(0, 10));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!namaAlbum.trim()) {
      setError('Nama album wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('nama_album', namaAlbum.trim());
      formData.append('tanggal_album', tanggalAlbum);
      formData.append('id_periode', '1');
      if (coverFile) {
        formData.append('cover', coverFile);
      }

      await createAlbum(formData);
      onAlbumCreated();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal membuat album.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Tambah album dokumentasi">
      <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-5 sm:p-7">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Tambah Album Baru</h2>
          <p className="mt-1 text-sm text-neutral-500">Buat album untuk mendokumentasikan kegiatan 17 Agustus.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-50"
        >
          <Icon name="close" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-7">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
            {error}
          </div>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-neutral-700">Nama Album <span className="text-red-500">*</span></span>
          <input
            type="text"
            required
            value={namaAlbum}
            onChange={(e) => setNamaAlbum(e.target.value)}
            placeholder="Contoh: Lomba Tarik Tambang RT 03"
            className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-800 outline-none focus:border-primary-400"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-neutral-700">Tanggal Kegiatan</span>
          <input
            type="date"
            value={tanggalAlbum}
            onChange={(e) => setTanggalAlbum(e.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-800 outline-none focus:border-primary-400"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-neutral-700">Cover Album (Opsional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="block h-11 w-full rounded-xl border border-neutral-200 px-2 py-2 text-xs text-neutral-800 file:mr-2 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-600"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-10 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Buat Album'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DocumentationManagement({ role, userName }: { role: 'admin' | 'panitia'; userName: string }) {
  const [albums, setAlbums] = useState<AlbumDokumentasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumDokumentasi | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await getAlbums();
      setAlbums(res.data || []);
      setLoadError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat album dokumentasi.';
      setLoadError(message);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const closeAlbum = useCallback(() => setSelectedAlbum(null), []);

  const visibleAlbums = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('id-ID');
    return albums.filter((album) => album.nama_album.toLocaleLowerCase('id-ID').includes(search));
  }, [albums, query]);

  const photoCount = albums.reduce((total, album) => total + (album.jumlah_foto || 0), 0);
  const videoCount = albums.reduce((total, album) => total + (album.jumlah_video || 0), 0);

  const metrics = [
    { value: albums.length, label: 'Album' },
    { value: photoCount, label: 'Foto' },
    { value: videoCount, label: 'Video' },
  ];

  return (
    <ManagementLayout role={role} userName={userName} title="Dokumentasi" activeItem="documentation">
      <div className="space-y-7 lg:space-y-9">
        <div>
          <p className="text-sm font-medium text-primary-600">Ruang {role === 'admin' ? 'Administrator' : 'Panitia'}</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[32px]">Dokumentasi</h1>
        </div>

        {loadError && (
          <div className="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-700">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => loadData(true)}
              className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700"
            >
              Coba Lagi
            </button>
          </div>
        )}

        <section aria-label="Ringkasan dokumentasi" className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="flex min-h-24 items-center gap-4 rounded-xl border border-primary-100 bg-white px-5 py-5 sm:px-6"
            >
              <span className="text-[30px] font-semibold leading-none tracking-tight text-neutral-900">{metric.value}</span>
              <span className="text-sm font-medium text-neutral-500">{metric.label}</span>
            </article>
          ))}
        </section>

        <section aria-label="Daftar album dokumentasi" className="rounded-2xl border border-primary-100 bg-white p-4 sm:p-5 lg:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <label htmlFor="album-search" className="sr-only">Cari nama album</label>
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-neutral-400" />
              <input
                id="album-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama album"
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-11 text-sm text-neutral-800 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              />
            </div>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Tambah Album</span>
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-neutral-400">
              Memuat album dokumentasi...
            </div>
          ) : visibleAlbums.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {visibleAlbums.map((album) => {
                const accent = accents[album.id_album % accents.length];
                return (
                  <article
                    key={album.id_album}
                    className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-colors hover:border-primary-100"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedAlbum(album)}
                      aria-haspopup="dialog"
                      aria-label={`Lihat album ${album.nama_album}`}
                      className="group block w-full text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600"
                    >
                      <div className="relative overflow-hidden">
                        {album.cover ? (
                          <img
                            src={album.cover}
                            alt={album.nama_album}
                            className="aspect-[1.45/1] w-full object-cover transition duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const fallback = (e.target as HTMLElement).nextElementSibling;
                              if (fallback) (fallback as HTMLElement).style.display = 'block';
                            }}
                          />
                        ) : null}
                        <div style={{ display: album.cover ? 'none' : 'block' }}>
                          <Placeholder index={0} accent={accent} />
                        </div>
                        <span className="absolute right-3 bottom-3 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-neutral-600 shadow-sm">
                          {album.jumlah_foto} foto · {album.jumlah_video} video
                        </span>
                      </div>
                      <div className="p-3.5 sm:p-4">
                        <div className="flex items-center justify-between gap-3 text-xs text-neutral-400">
                          <time dateTime={album.tanggal_album}>{formatDate(album.tanggal_album)}</time>
                        </div>
                        <h2 className="mt-2 truncate text-base font-semibold text-neutral-900">{album.nama_album}</h2>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 group-hover:text-primary-700">
                          Lihat album <Icon name="chevron" className="size-4" />
                        </span>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-14 text-center">
              <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-neutral-50 text-neutral-400">
                <Icon name="image" />
              </span>
              <h2 className="mt-3 font-semibold text-neutral-800">
                {query ? 'Album tidak ditemukan' : 'Belum ada album dokumentasi'}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                {query ? 'Coba kata kunci lain untuk mencari dokumentasi.' : 'Mulai dengan menambahkan album dokumentasi kegiatan 17-an.'}
              </p>
            </div>
          )}
        </section>
      </div>

      {selectedAlbum && (
        <AlbumPreview
          album={selectedAlbum}
          onClose={closeAlbum}
          onAlbumDeleted={() => loadData(false)}
          onMediaUpdated={() => loadData(false)}
        />
      )}

      <CreateAlbumModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onAlbumCreated={() => loadData(false)}
      />
    </ManagementLayout>
  );
}
