'use client';

import { useEffect, useId, useRef } from 'react';
import { Button } from '@/components/Button';
import type { NotificationItem } from '@/lib/data/notifications';

interface NotificationDetailsProps {
  notification: NotificationItem;
  onClose: () => void;
}

export function NotificationDetails({ notification, onClose }: NotificationDetailsProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border-0 bg-white p-6 shadow-2xl backdrop:bg-black/50 sm:p-8"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
      <h2 id={titleId} className="text-h6 font-bold text-primary-600">{notification.title}</h2>
      <p className="mt-5 whitespace-pre-line text-body-2 leading-relaxed text-neutral-600">{notification.message}</p>
      <div className="mt-6 flex justify-end">
        <Button onClick={onClose} className="font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">Kembali</Button>
      </div>
    </dialog>
  );
}
