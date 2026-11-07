import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlbumGallery } from '@/components/AlbumGallery';
import { getAlbumPhotos } from '@/lib/data/album-photos';
import { DAFTAR_ALBUM, getAlbumBySlug } from '@/lib/data/histori';

interface AlbumPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return DAFTAR_ALBUM.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = getAlbumBySlug(slug);

  if (!album) notFound();

  return {
    title: `Dokumentasi ${album.judul} | PAD`,
    description: album.deskripsi,
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { slug } = await params;
  const album = getAlbumBySlug(slug);

  if (!album) notFound();

  const photos = getAlbumPhotos(album.slug, album.judul);

  return (
    <main className="min-h-screen grow bg-linear-to-b from-primary-100 to-white">
      <header id="album-header" className="relative bg-white px-5 py-5 shadow-md">
        <h1 className="text-center text-h6 font-bold text-primary-600 sm:text-h5 lg:text-h3">
          Dokumentasi {album.judul}
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

        <AlbumGallery photos={photos} title={album.judul} />
      </div>
    </main>
  );
}
