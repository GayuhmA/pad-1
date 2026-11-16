export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationListResponse {
  success: true;
  message: string;
  data: NotificationItem[];
}

export interface UnreadCountResponse {
  success: true;
  message: string;
  data: { unread_count: number };
}

export interface MarkNotificationReadResponse {
  success: true;
  message: string;
  data: NotificationItem;
}
