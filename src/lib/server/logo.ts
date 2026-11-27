import 'server-only';

import { Agent } from 'undici';
import type {
  ActiveLogoResponse,
  LogoHutRiItem,
  LogoListResponse,
  LogoMutationResponse,
  LogoStatus,
} from '@/types/logo';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class LogoServiceError extends Error {
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
  if (!base) throw new LogoServiceError(503, 'Layanan logo belum dikonfigurasi.');
  return base.replace(/\/$/, '');
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new LogoServiceError(502, 'Respons layanan logo tidak valid. Silakan coba lagi.');
  }
  return value as Record<string, unknown>;
}

function positiveInteger(value: unknown): number {
  const num = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value.trim()) : Number.NaN;
  if (!Number.isSafeInteger(num) || num <= 0) {
    throw new LogoServiceError(502, 'Respons layanan logo tidak valid. Silakan coba lagi.');
  }
  return num;
}

function nonEmptyText(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new LogoServiceError(502, 'Respons layanan logo tidak valid. Silakan coba lagi.');
  }
  return value.trim();
}

function optionalText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeImageUrl(value: unknown): string {
  const raw = nonEmptyText(value);
  if (raw.startsWith('/')) {
    return `${apiBase()}${raw}`;
  }
  return raw;
}

function normalizeStatus(value: unknown): LogoStatus {
  if (typeof value === 'string' && value.trim().toLocaleLowerCase('id-ID') === 'aktif') {
    return 'Aktif';
  }
  return 'Nonaktif';
}

export function normalizeLogoItem(value: unknown): LogoHutRiItem {
  const item = record(value);
  return {
    id_logo: positiveInteger(item.id_logo),
    tahun: positiveInteger(item.tahun),
    nama_logo: nonEmptyText(item.nama_logo),
    gambar: normalizeImageUrl(item.gambar),
    status: normalizeStatus(item.status),
    created_at: optionalText(item.created_at),
    updated_at: optionalText(item.updated_at),
  };
}

function readEnvelope(value: unknown): Record<string, unknown> {
  const envelope = record(value);
  if (envelope.success !== true) {
    throw new LogoServiceError(502, 'Respons layanan logo tidak valid. Silakan coba lagi.');
  }
  return envelope;
}

async function performRequest(
  endpoint: string,
  options: { token?: string; method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: BodyInit } = {},
): Promise<unknown> {
  const method = options.method ?? 'GET';
  let response: Response;
  try {
    const headers = new Headers({ Accept: 'application/json' });
    if (options.token) {
      headers.set('Authorization', `Bearer ${options.token}`);
    }
    response = await fetch(`${apiBase()}${endpoint}`, {
      method,
      headers,
      body: options.body,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(options.body instanceof FormData ? 30_000 : 15_000),
      dispatcher: backendDispatcher,
    } as RequestInit & { dispatcher: Agent });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    console.warn('[logo/backend] connection failed', {
      endpoint: endpoint.replace(/\/\d+/g, '/:id').split('?')[0],
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new LogoServiceError(503, 'Layanan logo belum dapat dihubungi. Silakan coba lagi.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new LogoServiceError(502, 'Respons layanan logo tidak valid. Silakan coba lagi.');
  }

  if (!response.ok) {
    const errObj = body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
    const backendMsg = typeof errObj.message === 'string' && errObj.message.trim()
      ? errObj.message.trim()
      : null;
    const errors = errObj.errors && typeof errObj.errors === 'object' && !Array.isArray(errObj.errors)
      ? (errObj.errors as Record<string, string[]>)
      : undefined;

    const fallbacks: Record<number, string> = {
      401: 'Sesi telah berakhir. Silakan masuk kembali.',
      403: 'Akses ditolak. Fitur ini hanya untuk Admin.',
      404: 'Data logo tidak ditemukan.',
      422: 'Data logo tidak valid. Periksa kembali isian Anda.',
      429: 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.',
    };
    throw new LogoServiceError(
      response.status,
      backendMsg ?? fallbacks[response.status] ?? 'Layanan logo sedang bermasalah. Silakan coba lagi.',
      errors,
    );
  }

  return body;
}

export async function backendGetActiveLogo(): Promise<ActiveLogoResponse> {
  const envelope = readEnvelope(await performRequest('/api/logo-hut-ri/aktif'));
  return {
    success: true,
    message: optionalText(envelope.message) ?? 'Logo HUT RI aktif berhasil diambil.',
    data: envelope.data == null ? null : normalizeLogoItem(envelope.data),
  };
}

export async function backendGetAdminLogos(
  token: string,
  options?: { search?: string; status?: LogoStatus },
): Promise<LogoListResponse> {
  const params = new URLSearchParams();
  if (options?.search?.trim()) params.set('search', options.search.trim());
  if (options?.status === 'Aktif' || options?.status === 'Nonaktif') {
    params.set('status', options.status);
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  const envelope = readEnvelope(await performRequest(`/api/admin/logo-hut-ri${query}`, { token }));
  const rawList = Array.isArray(envelope.data) ? envelope.data : [];
  return {
    success: true,
    message: optionalText(envelope.message) ?? 'Daftar logo HUT RI berhasil diambil.',
    data: rawList.map(normalizeLogoItem),
  };
}

export async function backendCreateAdminLogo(
  token: string,
  formData: FormData,
): Promise<LogoMutationResponse> {
  const envelope = readEnvelope(
    await performRequest('/api/admin/logo-hut-ri', {
      token,
      method: 'POST',
      body: formData,
    }),
  );
  return {
    success: true,
    message: optionalText(envelope.message) ?? 'Logo HUT RI berhasil ditambahkan.',
    data: envelope.data == null ? null : normalizeLogoItem(envelope.data),
  };
}

export async function backendUpdateAdminLogo(
  token: string,
  idLogo: number,
  formData: FormData,
): Promise<LogoMutationResponse> {
  const envelope = readEnvelope(
    await performRequest(`/api/admin/logo-hut-ri/${idLogo}`, {
      token,
      method: 'POST',
      body: formData,
    }),
  );
  return {
    success: true,
    message: optionalText(envelope.message) ?? 'Logo HUT RI berhasil diperbarui.',
    data: envelope.data == null ? null : normalizeLogoItem(envelope.data),
  };
}

export async function backendActivateAdminLogo(
  token: string,
  idLogo: number,
): Promise<LogoMutationResponse> {
  const envelope = readEnvelope(
    await performRequest(`/api/admin/logo-hut-ri/${idLogo}/aktif`, {
      token,
      method: 'PATCH',
    }),
  );
  return {
    success: true,
    message: optionalText(envelope.message) ?? 'Logo HUT RI berhasil diaktifkan.',
    data: envelope.data == null ? null : normalizeLogoItem(envelope.data),
  };
}

export async function backendDeleteAdminLogo(
  token: string,
  idLogo: number,
): Promise<LogoMutationResponse> {
  const envelope = readEnvelope(
    await performRequest(`/api/admin/logo-hut-ri/${idLogo}`, {
      token,
      method: 'DELETE',
    }),
  );
  return {
    success: true,
    message: optionalText(envelope.message) ?? 'Logo HUT RI berhasil dihapus.',
    data: null,
  };
}

