'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { AlbumPhoto } from '@/lib/data/album-photos';

interface AlbumLightboxProps {
  photos: AlbumPhoto[];
  initialIndex: number;
  title: string;
  onClose: () => void;
}

export function AlbumLightbox({ photos, initialIndex, title, onClose }: AlbumLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [headerBottom, setHeaderBottom] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const photoRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const instructionsId = useId();
  const photo = photos[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const bodyPadding = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;

    // Keep the page heading bright, including when it wraps or is scrolled away.
    const updateHeaderBottom = () => {
      const header = document.getElementById('album-header');
      setHeaderBottom(Math.max(0, header?.getBoundingClientRect().bottom ?? 0));
    };

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${bodyPadding + scrollbarWidth}px`;
    updateHeaderBottom();
    window.addEventListener('resize', updateHeaderBottom);
    dialog.showModal();
    photoRef.current?.focus({ preventScroll: true });

    return () => {
      window.removeEventListener('resize', updateHeaderBottom);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      opener?.focus({ preventScroll: true });
    };
  }, []);

  function navigate(direction: -1 | 1) {
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= photos.length) return;

    // Avoid leaving keyboard focus on an arrow that disappears at an endpoint.
    if (nextIndex === 0 || nextIndex === photos.length - 1) {
      photoRef.current?.focus({ preventScroll: true });
    }
    setCurrentIndex(nextIndex);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={instructionsId}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-white backdrop:bg-transparent"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          navigate(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}
    >
      <h2 id={titleId} className="sr-only">Preview foto {title}</h2>
      <p id={instructionsId} className="sr-only">
        Gunakan panah kiri dan kanan untuk berpindah foto. Tekan Escape untuk menutup preview.
      </p>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 bg-black/65"
        style={{ top: headerBottom }}
        onClick={onClose}
      />

      <div className="pointer-events-none relative flex h-full items-center justify-center px-3 py-20 sm:px-6">
        <div className="grid w-full max-w-244 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 sm:gap-8 lg:gap-14">
          <div>
            {hasPrevious && (
              <button
                type="button"
                aria-label="Foto sebelumnya"
                onClick={() => navigate(-1)}
                className="pointer-events-auto flex size-11 cursor-pointer items-center justify-center rounded-full bg-primary-100 shadow-sm transition-colors hover:bg-primary-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <Image src="/icons/round-arrow-right.svg" alt="" width={40} height={40} className="rotate-180" />
              </button>
            )}
          </div>

          <figure ref={photoRef} tabIndex={-1} className="pointer-events-auto min-w-0 focus:outline-none">
            <Image
              key={photo.id}
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 1024px) 776px, (min-width: 640px) calc(100vw - 200px), calc(100vw - 128px)"
              loading="eager"
              className="max-h-[75dvh] w-full rounded-xl object-contain"
            />
            <figcaption aria-live="polite" aria-atomic="true" className="sr-only">
              Foto {currentIndex + 1} dari {photos.length}: {photo.alt}
            </figcaption>
          </figure>

          <div>
            {hasNext && (
              <button
                type="button"
                aria-label="Foto berikutnya"
                onClick={() => navigate(1)}
                className="pointer-events-auto flex size-11 cursor-pointer items-center justify-center rounded-full bg-primary-100 shadow-sm transition-colors hover:bg-primary-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <Image src="/icons/round-arrow-right.svg" alt="" width={40} height={40} />
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
