import 'server-only';

import { Agent } from 'undici';
import type {
  MarkNotificationReadResponse,
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
} from '@/types/notifications';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class NotificationServiceError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function invalidResponse(): never {
  throw new NotificationServiceError(502, 'Respons layanan notifikasi tidak valid. Silakan coba lagi.');
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalidResponse();
  return value as Record<string, unknown>;
}

function integer(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) invalidResponse();
  return value as number;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) invalidResponse();
  return value;
}

function notification(value: unknown): NotificationItem {
  const item = record(value);
  if (typeof item.status_baca !== 'boolean') invalidResponse();
  const createdAt = text(item.created_at);
  if (Number.isNaN(Date.parse(createdAt))) invalidResponse();
  integer(item.id_warga);
  text(item.tipe);
  text(item.updated_at);
  return {
    id: String(integer(item.id_notifikasi)),
    title: text(item.judul),
    message: text(item.pesan),
    createdAt,
    isRead: item.status_baca,
  };
}

function envelope(value: unknown): Record<string, unknown> {
  const response = record(value);
  if (response.success !== true) invalidResponse();
  return response;
}

export function readNotificationListResponse(value: unknown): NotificationListResponse {
  const response = envelope(value);
  if (!Array.isArray(response.data)) invalidResponse();
  return {
    success: true,
    message: text(response.message),
    data: response.data.map(notification),
  };
}

export function readUnreadCountResponse(value: unknown): UnreadCountResponse {
  const response = envelope(value);
  const data = record(response.data);
  if (!Number.isSafeInteger(data.unread_count) || (data.unread_count as number) < 0) invalidResponse();
  return {
    success: true,
    message: text(response.message),
    data: { unread_count: data.unread_count as number },
  };
}

export function readMarkNotificationResponse(value: unknown): MarkNotificationReadResponse {
  const response = envelope(value);
  return {
    success: true,
    message: text(response.message),
    data: notification(response.data),
  };
}

function apiBase(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new NotificationServiceError(503, 'Layanan notifikasi belum dikonfigurasi.');
  return base.replace(/\/$/, '');
}

function backendMessage(status: number): string {
  const messages: Record<number, string> = {
    401: 'Sesi telah berakhir. Silakan masuk kembali.',
    403: 'Akun tidak terhubung dengan data warga.',
    404: 'Notifikasi tidak ditemukan.',
    422: 'Permintaan notifikasi tidak valid.',
    429: 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.',
  };
  return messages[status] ?? 'Layanan notifikasi sedang bermasalah. Silakan coba lagi.';
}

async function backendRequest(endpoint: string, token: string, method: 'GET' | 'PATCH'): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${apiBase()}${endpoint}`, {
      method,
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
      dispatcher: backendDispatcher,
    } as RequestInit & { dispatcher: Agent });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    console.warn('[notifikasi/backend] connection failed', {
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new NotificationServiceError(503, 'Layanan notifikasi belum dapat dihubungi. Silakan coba lagi.');
  }

  if (!response.ok) throw new NotificationServiceError(response.status, backendMessage(response.status));
  try {
    return await response.json();
  } catch {
    invalidResponse();
  }
}

export async function backendNotificationList(
  token: string,
  statusBaca?: boolean,
): Promise<NotificationListResponse> {
  const query = statusBaca === undefined ? '' : `?status_baca=${statusBaca}`;
  return readNotificationListResponse(await backendRequest(`/api/warga/notifikasi${query}`, token, 'GET'));
}

export async function backendUnreadNotificationCount(token: string): Promise<UnreadCountResponse> {
  return readUnreadCountResponse(await backendRequest('/api/warga/notifikasi/unread-count', token, 'GET'));
}

export async function backendMarkNotificationAsRead(
  token: string,
  idNotification: number,
): Promise<MarkNotificationReadResponse> {
  return readMarkNotificationResponse(await backendRequest(
    `/api/warga/notifikasi/${idNotification}/read`, token, 'PATCH',
  ));
}
