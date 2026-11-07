'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/Button';
import { AgendaBanner } from '@/components/notifications/AgendaBanner';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { NotificationDetails } from '@/components/notifications/NotificationDetails';
import { NEXT_AGENDA, NOTIFICATION_DEMO_NOW } from '@/lib/data/notifications';
import { filterNotifications, type NotificationFilter } from '@/lib/notifications';
import { useNotificationStore } from '@/stores/notification-store';

const FILTERS: { value: NotificationFilter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'unread', label: 'Belum Dibaca' },
];

export function NotificationCenter() {
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(NOTIFICATION_DEMO_NOW);
  const filterRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mountedAt = Date.now();
    const timer = window.setInterval(() => {
      setNow(NOTIFICATION_DEMO_NOW + Date.now() - mountedAt);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleNotifications = filterNotifications(notifications, query, filter);
  const selectedNotification = notifications.find((item) => item.id === selectedId);

  function openNotification(id: string) {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedId(id);
    markAsRead(id);
  }

  function closeNotification() {
    setSelectedId(null);
    // The original card may have left the unread results after being read.
    requestAnimationFrame(() => {
      const target = openerRef.current?.isConnected
        ? openerRef.current
        : filterRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
      target?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-primary-100 to-white">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-14 px-5 py-12 md:gap-24 md:px-15 md:py-24">
        <h1 className="sr-only">Notifikasi</h1>
        <AgendaBanner agenda={NEXT_AGENDA} now={now} />

        <section aria-label="Daftar notifikasi" className="mx-auto w-full max-w-240">
          <div className="relative mx-auto mb-10 max-w-188 sm:mb-12">
            <label htmlFor="notification-search" className="sr-only">Cari pesan</label>
            <input
              id="notification-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari Pesan"
              className="h-13 w-full rounded-xl bg-neutral-50 pr-14 pl-6 text-body-2 text-neutral-800 shadow-lg placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            />
            <Image src="/icons/search.svg" alt="" width={24} height={24} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2" />
          </div>

          <div ref={filterRef} role="group" aria-label="Filter notifikasi" className="mb-5 flex flex-wrap gap-2 sm:px-5">
            {FILTERS.map(({ value, label }) => (
              <Button
                key={value}
                variant={filter === value ? 'solid' : 'ghost'}
                size="M"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`min-w-36! font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${filter === value ? 'shadow-sm' : 'bg-white!'}`}
              >
                {label}
              </Button>
            ))}
          </div>

          <p role="status" className="sr-only">{visibleNotifications.length} notifikasi ditampilkan.</p>
          {visibleNotifications.length > 0 ? (
            <ul className="space-y-5">
              {visibleNotifications.map((notification) => (
                <li key={notification.id}>
                  <NotificationCard notification={notification} now={now} onOpen={() => openNotification(notification.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl bg-white px-6 py-14 text-center">
              <h2 className="text-h7 font-bold text-neutral-900">
                {query.trim() ? 'Pesan tidak ditemukan' : 'Semua notifikasi sudah dibaca'}
              </h2>
              <p className="mt-2 text-body-2 text-neutral-500">
                {query.trim() ? 'Coba gunakan kata kunci lain.' : 'Pilih Semua untuk melihat kembali pesan anda.'}
              </p>
            </div>
          )}
        </section>
      </div>

      {selectedNotification && <NotificationDetails notification={selectedNotification} onClose={closeNotification} />}
    </div>
  );
}
