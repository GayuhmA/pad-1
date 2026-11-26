import type { NotificationItem } from '@/types/notifications';

export type NotificationFilter = 'all' | 'unread';

export function filterNotifications(items: NotificationItem[], query: string, filter: NotificationFilter) {
  const search = query.trim().toLocaleLowerCase('id');
  return items
    .filter((item) => (
      (filter === 'all' || !item.isRead)
      && `${item.title} ${item.message}`.toLocaleLowerCase('id').includes(search)
    ))
    .sort((left, right) => {
      if (left.isRead !== right.isRead) {
        return Number(left.isRead) - Number(right.isRead);
      }
      return Date.parse(right.createdAt) - Date.parse(left.createdAt);
    });
}

const relativeTime = new Intl.RelativeTimeFormat('id', { numeric: 'always' });

export function formatNotificationAge(createdAt: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - Date.parse(createdAt)) / 1000));
  if (seconds < 60) return 'Baru saja';
  if (seconds < 3600) return relativeTime.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 86400) return relativeTime.format(-Math.floor(seconds / 3600), 'hour');
  return relativeTime.format(-Math.floor(seconds / 86400), 'day');
}
