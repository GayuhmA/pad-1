import type {
  MarkNotificationReadResponse,
  NotificationListResponse,
  UnreadCountResponse,
} from '@/types/notifications';
import { apiRequest } from './client';

export function getNotifications(signal?: AbortSignal): Promise<NotificationListResponse> {
  return apiRequest('/api/warga/notifikasi', { signal });
}

export function getUnreadNotificationCount(signal?: AbortSignal): Promise<UnreadCountResponse> {
  return apiRequest('/api/warga/notifikasi/unread-count', { signal });
}

export function markNotificationAsRead(
  id: number,
  signal?: AbortSignal,
): Promise<MarkNotificationReadResponse> {
  return apiRequest(`/api/warga/notifikasi/${id}/read`, { method: 'PATCH', signal });
}
