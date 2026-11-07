import type { NotificationItem } from '@/lib/data/notifications';

export type NotificationFilter = 'all' | 'unread';

export function filterNotifications(items: NotificationItem[], query: string, filter: NotificationFilter) {
  const search = query.trim().toLocaleLowerCase('id');
  return items.filter((item) => (
    (filter === 'all' || !item.isRead)
    && `${item.title} ${item.message}`.toLocaleLowerCase('id').includes(search)
  ));
}

export function getCountdown(startsAt: string, now: number) {
  const remaining = Math.max(0, Math.ceil((Date.parse(startsAt) - now) / 1000));
  return {
    hours: Math.floor(remaining / 3600),
    minutes: Math.floor((remaining % 3600) / 60),
    seconds: remaining % 60,
    hasStarted: remaining === 0,
  };
}

const relativeTime = new Intl.RelativeTimeFormat('id', { numeric: 'always' });
const agendaTime = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function formatNotificationAge(createdAt: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - Date.parse(createdAt)) / 1000));
  if (seconds < 60) return 'Baru saja';
  if (seconds < 3600) return relativeTime.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 86400) return relativeTime.format(-Math.floor(seconds / 3600), 'hour');
  return relativeTime.format(-Math.floor(seconds / 86400), 'day');
}

export function formatAgendaTime(value: string) {
  return agendaTime.format(new Date(value)).replace('.', ':');
}
