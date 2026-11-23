import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlbumGallery } from '@/components/AlbumGallery';
import { type AlbumPhoto, getAlbumPhotos } from '@/lib/data/album-photos';
import { DAFTAR_ALBUM, getAlbumBySlug } from '@/lib/data/histori';
import { SESSION_COOKIE } from '@/lib/server/auth';
import { backendGetAlbumDetail } from '@/lib/server/dokumentasi';

interface AlbumPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

export function generateStaticParams() {
  return DAFTAR_ALBUM.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const numId = Number(slug);
  if (Number.isSafeInteger(numId) && numId > 0) {
    try {
      const res = await backendGetAlbumDetail(token, numId);
      if (res?.data) {
        return {
          title: `Dokumentasi ${res.data.nama_album} | PAD`,
          description: `Album dokumentasi ${res.data.nama_album} kegiatan perayaan kemerdekaan.`,
        };
      }
    } catch {
      // Fall through to fallback
    }
  }

  const album = getAlbumBySlug(slug);
  if (album) {
    return {
      title: `Dokumentasi ${album.judul} | PAD`,
      description: album.deskripsi,
    };
  }

  return {
    title: 'Dokumentasi Album | PAD',
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  let title = '';
  let photos: AlbumPhoto[] = [];

  const numId = Number(slug);
  if (Number.isSafeInteger(numId) && numId > 0) {
    try {
      const res = await backendGetAlbumDetail(token, numId);
      if (res?.data) {
        title = res.data.nama_album;
        photos = res.data.media
          .filter((m) => m.jenis_file === 'Foto' || !m.jenis_file)
          .map((m, idx) => ({
            id: String(m.id_dokumentasi),
            src: m.file,
            alt: m.keterangan || `${res.data.nama_album} - Foto ${idx + 1}`,
            width: 800,
            height: 600,
            filename: m.file.split('/').pop() || `foto-${idx + 1}.jpg`,
          }));
      }
    } catch {
      // Fall through to fallback
    }
  }

  if (!title) {
    const album = getAlbumBySlug(slug);
    if (!album) notFound();
    title = album.judul;
    photos = getAlbumPhotos(album.slug, album.judul);
  }

  return (
    <main className="min-h-screen grow bg-linear-to-b from-primary-100 to-white">
      <header id="album-header" className="relative bg-white px-5 py-5 shadow-md">
        <h1 className="text-center text-h6 font-bold text-primary-600 sm:text-h5 lg:text-h3">
          Dokumentasi {title}
        </h1>
      </header>

      <div className="mx-auto w-full max-w-360 px-5 py-8 md:px-15 sm:py-12">
        <Link
          href="/histori#album-dokumentasi"
          className="mb-4 inline-flex min-h-11 items-center justify-center gap-1 rounded-lg bg-primary-600 py-2 px-4 text-body-1 font-bold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          <Image src="/icons/back.svg" alt="" width={20} height={20} />
          Kembali
        </Link>

        <AlbumGallery photos={photos} title={title} />
      </div>
    </main>
  );
}
