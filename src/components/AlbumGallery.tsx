'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { AlbumPhoto } from '@/lib/data/album-photos';
import { AlbumLightbox } from '@/components/AlbumLightbox';

interface AlbumGalleryProps {
  photos: AlbumPhoto[];
  title: string;
}

export function AlbumGallery({ photos, title }: AlbumGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <p className="rounded-xl bg-white px-6 py-12 text-center text-body-1 text-neutral-600">
        Belum ada foto dokumentasi untuk album ini.
      </p>
    );
  }

  return (
    <section aria-label={`Galeri foto ${title}`}>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {photos.map((photo, photoIndex) => (
          <li
            key={photo.id}
            className="group relative isolate aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100"
          >
            <button
              type="button"
              onClick={() => setSelectedIndex(photoIndex)}
              aria-label={`Lihat ${photo.alt.toLowerCase()}`}
              aria-haspopup="dialog"
              className="absolute inset-0 cursor-zoom-in rounded-xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, calc(100vw - 40px)"
                loading={photoIndex === 0 ? 'eager' : 'lazy'}
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
              />
            </button>
            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20 group-has-[:focus-visible]:bg-black/20 motion-reduce:transition-none" />
            <a
              href={photo.src}
              download={photo.filename}
              aria-label={`Unduh ${photo.alt.toLowerCase()}`}
              title={`Unduh ${photo.alt.toLowerCase()}`}
              className="absolute right-3 bottom-3 inline-flex size-11 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm transition-[opacity,background-color] hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:opacity-0 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100"
            >
              <Image src="/icons/download.svg" alt="" width={24} height={24} />
            </a>
          </li>
        ))}
      </ul>
      {selectedIndex !== null && (
        <AlbumLightbox
          photos={photos}
          initialIndex={selectedIndex}
          title={title}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </section>
  );
}
