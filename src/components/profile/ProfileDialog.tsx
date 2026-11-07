'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ProfileDialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  variant?: 'default' | 'form';
}

export function ProfileDialog({ title, onClose, children, variant = 'default' }: ProfileDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const overflow = document.body.style.overflow;
    const padding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const bodyPadding = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${bodyPadding + scrollbar}px`;
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = padding;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto border-0 bg-white ${variant === 'form' ? 'max-w-160 rounded-lg p-5 shadow-lg backdrop:bg-black/30 sm:p-8' : 'max-w-2xl rounded-2xl p-6 shadow-2xl backdrop:bg-black/50 sm:p-8'}`}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
      <h2 id={titleId} className={`text-h6 font-bold text-primary-600 ${variant === 'form' ? 'mb-3 text-center' : 'mb-6'}`}>{title}</h2>
      {children}
    </dialog>
  );
}
