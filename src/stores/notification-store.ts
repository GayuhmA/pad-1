import { create } from 'zustand';
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead } from '@/lib/api/notifications';
import { ApiRequestError } from '@/lib/api/client';
import type { NotificationItem } from '@/types/notifications';

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  lastLoadedAt: number | null;
  error: string | null;
  loadNotifications: (force?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  reset: () => void;
}

const errorMessage = (error: unknown) => error instanceof ApiRequestError
  ? error.message : 'Notifikasi sedang bermasalah. Silakan coba lagi.';

const NOTIFICATION_STALE_TIME = 30_000;
let unreadCountRequest = 0;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  lastLoadedAt: null,
  error: null,

  loadNotifications: async (force = false) => {
    const { notifications, lastLoadedAt } = get();
    if (!force && notifications.length > 0 && lastLoadedAt && Date.now() - lastLoadedAt < NOTIFICATION_STALE_TIME) {
      return;
    }
    set({ isLoading: notifications.length === 0, error: null });
    try {
      const response = await getNotifications();
      set({ notifications: response.data, isLoading: false, lastLoadedAt: Date.now(), error: null });
      void get().fetchUnreadCount();
    } catch (error) {
      set({ isLoading: false, error: errorMessage(error) });
    }
  },

  fetchUnreadCount: async () => {
    const request = ++unreadCountRequest;
    try {
      const response = await getUnreadNotificationCount();
      if (request === unreadCountRequest) {
        set({ unreadCount: response.data.unread_count });
      }
    } catch {
      // Keep the last known count if only the count endpoint is unavailable.
    }
  },

  markAsRead: async (id) => {
    const notification = get().notifications.find((item) => item.id === id);
    if (!notification || notification.isRead) return;
    try {
      const response = await markNotificationAsRead(Number(id));
      set((state) => ({
        notifications: state.notifications.map((item) => item.id === id
          ? { ...item, isRead: response.data.isRead }
          : item),
        unreadCount: response.data.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        error: null,
      }));
      await get().fetchUnreadCount();
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  },

  reset: () => {
    unreadCountRequest++;
    set({ notifications: [], unreadCount: 0, isLoading: false, lastLoadedAt: null, error: null });
  },
}));
