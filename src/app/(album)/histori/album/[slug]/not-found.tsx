import Link from 'next/link';

export default function AlbumNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-linear-to-b from-primary-100 to-white px-5 text-center">
      <h1 className="text-h5 font-bold text-primary-600">Album tidak ditemukan</h1>
      <p className="text-body-1 text-neutral-600">Album yang Anda cari belum tersedia.</p>
      <Link
        href="/histori#album-dokumentasi"
        className="rounded-lg bg-primary-600 px-4 py-3 text-body-2 font-bold text-white hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        Kembali ke histori
      </Link>
    </main>
  );
}
