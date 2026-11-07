import { Icon } from '@/components/Icon';
import type { NotificationItem } from '@/lib/data/notifications';
import { formatNotificationAge } from '@/lib/notifications';

interface NotificationCardProps {
  notification: NotificationItem;
  now: number;
  onOpen: () => void;
}

export function NotificationCard({ notification, now, onOpen }: NotificationCardProps) {
  const { title, message, createdAt, isRead } = notification;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`${title}${isRead ? '' : ', belum dibaca'}`}
      className={`flex min-h-50 w-full cursor-pointer flex-col gap-3 rounded-xl border-l-10 bg-white px-5 py-5 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-600 sm:px-6 ${isRead ? 'border-transparent' : 'border-primary-600'}`}
    >
      <span className={`flex items-center justify-end gap-2 self-end text-body-4 ${isRead ? 'text-neutral-400' : 'text-primary-600'}`}>
        <Icon name="clock-circle" className="size-5" />
        <time dateTime={createdAt}>{formatNotificationAge(createdAt, now)}</time>
      </span>
      <span className={`text-h7 font-bold sm:text-h6 ${isRead ? 'text-neutral-900' : 'text-primary-600'}`}>{title}</span>
      <span className="line-clamp-3 text-body-3 font-medium text-neutral-500 sm:text-body-2">{message}</span>
    </button>
  );
}
