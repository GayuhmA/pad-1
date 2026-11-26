import 'server-only';

import { Agent } from 'undici';
import type {
  DeleteMessageResponse,
  ManagementMessageItem,
  MessageListResponse,
  MessageMutationResponse,
  MessageStatus,
  SaveMessageInput,
} from '@/types/management-pesan';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class ManagementPesanError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

function apiBase(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new ManagementPesanError(503, 'Layanan pesan belum dikonfigurasi.');
  return base.replace(/\/$/, '');
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ManagementPesanError(502, 'Respons layanan pesan tidak valid. Silakan coba lagi.');
  }
  return value as Record<string, unknown>;
}

function firstString(item: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string') return value;
  }
  return undefined;
}

function normalizeId(item: Record<string, unknown>): string {
  const candidates = [
    item.id_pesan,
    item.id,
    item.id_pengumuman,
    item.id_broadcast,
    item.id_notifikasi,
  ];
  for (const raw of candidates) {
    if (typeof raw === 'number' && Number.isSafeInteger(raw) && raw > 0) return String(raw);
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
  }
  for (const [key, raw] of Object.entries(item)) {
    if (/^id(_[a-z0-9]+)?$/i.test(key)) {
      if (typeof raw === 'number' && Number.isSafeInteger(raw) && raw > 0) return String(raw);
      if (typeof raw === 'string' && raw.trim()) return raw.trim();
    }
  }
  console.warn('[management-pesan] missing id in item keys:', Object.keys(item));
  throw new ManagementPesanError(502, 'Respons layanan pesan tidak valid. Silakan coba lagi.');
}

function normalizeStatus(raw: unknown): MessageStatus {
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (['sent', 'terkirim', 'published', 'dikirim', 'dipublikasi', 'dipublikasikan'].includes(normalized)) {
      return 'sent';
    }
    if (['draft', 'draf'].includes(normalized)) return 'draft';
  }
  return 'draft';
}

function normalizeTimestamp(item: Record<string, unknown>, keys: string[], fallback?: string): string {
  const value = firstString(item, keys);
  if (value && Number.isFinite(Date.parse(value))) return value;
  return fallback ?? new Date().toISOString();
}

function normalizeMessage(value: unknown): ManagementMessageItem {
  const item = record(value);
  const id = normalizeId(item);
  const subject = firstString(item, ['subjek', 'judul', 'subject']) ?? '';
  const body = firstString(item, ['isi', 'pesan', 'body', 'konten']) ?? '';
  const status = normalizeStatus(item.status);
  const createdAt = normalizeTimestamp(item, ['created_at', 'createdAt', 'tanggal_buat']);
  const updatedAt = normalizeTimestamp(
    item,
    ['updated_at', 'updatedAt', 'tanggal_publikasi', 'sent_at', 'tanggal_kirim'],
    createdAt,
  );

  return {
    id,
    subject,
    body,
    status,
    createdAt,
    updatedAt,
  };
}

async function performRequest(endpoint: string, token: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('Authorization', `Bearer ${token}`);
    if (init.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }
    response = await fetch(`${apiBase()}${endpoint}`, {
      ...init,
      headers,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
      dispatcher: backendDispatcher,
    } as RequestInit & { dispatcher: Agent });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    console.warn('[management-pesan/backend] connection failed', {
      endpoint: endpoint.replace(/\/\d+/g, '/:id'),
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new ManagementPesanError(503, 'Layanan pesan belum dapat dihubungi. Silakan coba lagi.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ManagementPesanError(502, 'Respons layanan pesan tidak valid. Silakan coba lagi.');
  }

  if (!response.ok) {
    const result = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown> : {};
    const message = typeof result.message === 'string'
      ? result.message
      : 'Layanan pesan sedang bermasalah. Silakan coba lagi.';
    const errors = result.errors && typeof result.errors === 'object' && !Array.isArray(result.errors)
      ? result.errors as Record<string, string[]> : undefined;
    throw new ManagementPesanError(response.status, message, errors);
  }

  return body;
}

function readEnvelope(value: unknown): Record<string, unknown> {
  const result = record(value);
  if (result.success === false) {
    const message = typeof result.message === 'string'
      ? result.message
      : 'Permintaan layanan pesan gagal.';
    throw new ManagementPesanError(502, message);
  }
  return result;
}

function buildBackendPayload(input: SaveMessageInput): Record<string, unknown> {
  return {
    subjek: input.subject,
    judul: input.subject,
    isi: input.body,
    pesan: input.body,
  };
}

export async function backendGetMessages(
  token: string,
  options?: { status?: string; search?: string },
): Promise<MessageListResponse> {
  const params = new URLSearchParams();
  params.set('per_page', '50');
  if (options?.status) params.set('status', options.status);
  if (options?.search?.trim()) params.set('search', options.search.trim());
  const query = params.toString() ? `?${params.toString()}` : '';

  const raw = await performRequest(`/api/manajemen/pesan${query}`, token);
  const env = readEnvelope(raw);
  const rawData = env.data;

  let list: unknown[];
  if (Array.isArray(rawData)) {
    list = rawData;
  } else if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    const paginated = rawData as Record<string, unknown>;
    list = Array.isArray(paginated.data) ? paginated.data : [];
  } else {
    list = [];
  }

  return {
    success: true,
    message: typeof env.message === 'string' ? env.message : 'Daftar pesan berhasil dimuat.',
    data: list.map(normalizeMessage),
  };
}

function extractSingleItem(env: Record<string, unknown>): Record<string, unknown> {
  const rawData = env.data ?? env.pesan ?? env.message;
  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    const obj = rawData as Record<string, unknown>;
    if (obj.pesan && typeof obj.pesan === 'object' && !Array.isArray(obj.pesan)) {
      return obj.pesan as Record<string, unknown>;
    }
    return obj;
  }
  if ('id' in env || 'id_pesan' in env) {
    return env;
  }
  console.warn('[management-pesan] unexpected single item envelope keys:', Object.keys(env));
  throw new ManagementPesanError(502, 'Respons layanan pesan tidak valid. Silakan coba lagi.');
}

export async function backendGetMessageDetail(
  token: string,
  id: number,
): Promise<MessageMutationResponse> {
  const raw = await performRequest(`/api/manajemen/pesan/${id}`, token);
  const env = readEnvelope(raw);
  return {
    success: true,
    message: typeof env.message === 'string' ? env.message : 'Detail pesan berhasil dimuat.',
    data: normalizeMessage(extractSingleItem(env)),
  };
}

export async function backendCreateMessage(
  token: string,
  input: SaveMessageInput,
): Promise<MessageMutationResponse> {
  const raw = await performRequest('/api/manajemen/pesan', token, {
    method: 'POST',
    body: JSON.stringify(buildBackendPayload(input)),
  });
  const env = readEnvelope(raw);
  return {
    success: true,
    message: typeof env.message === 'string' ? env.message : 'Pesan berhasil dibuat.',
    data: normalizeMessage(extractSingleItem(env)),
  };
}

export async function backendUpdateMessage(
  token: string,
  id: number,
  input: SaveMessageInput,
): Promise<MessageMutationResponse> {
  const raw = await performRequest(`/api/manajemen/pesan/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(buildBackendPayload(input)),
  });
  const env = readEnvelope(raw);
  return {
    success: true,
    message: typeof env.message === 'string' ? env.message : 'Draft berhasil diperbarui.',
    data: normalizeMessage(extractSingleItem(env)),
  };
}

export async function backendDeleteMessage(
  token: string,
  id: number,
): Promise<DeleteMessageResponse> {
  const raw = await performRequest(`/api/manajemen/pesan/${id}`, token, {
    method: 'DELETE',
  });
  const env = readEnvelope(raw);
  return {
    success: true,
    message: typeof env.message === 'string' ? env.message : 'Draft berhasil dihapus.',
  };
}

export async function backendSendMessage(
  token: string,
  id: number,
): Promise<MessageMutationResponse> {
  const raw = await performRequest(`/api/manajemen/pesan/${id}/kirim`, token, {
    method: 'PATCH',
  });
  const env = readEnvelope(raw);
  const sentMessage = normalizeMessage(extractSingleItem(env));
  return {
    success: true,
    message: typeof env.message === 'string' ? env.message : 'Pesan berhasil dikirim.',
    // This endpoint only returns after sending succeeds. Some backend responses
    // omit the status (or return the pre-send record), which normalizeMessage
    // would otherwise display as a draft.
    data: { ...sentMessage, status: 'sent' },
  };
}

