import { create } from 'zustand';
import { INITIAL_NOTIFICATIONS, type NotificationItem } from '@/lib/data/notifications';

interface NotificationState {
  notifications: NotificationItem[];
  markAsRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: INITIAL_NOTIFICATIONS,
  markAsRead: (id) => set((state) => {
    if (!state.notifications.some((item) => item.id === id && !item.isRead)) return state;
    return {
      notifications: state.notifications.map((item) => (
        item.id === id ? { ...item, isRead: true } : item
      )),
    };
  }),
}));
