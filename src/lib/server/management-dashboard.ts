import 'server-only';

import { Agent } from 'undici';
import type {
  CreateMatchInput,
  CreateMatchResponse,
  ManagementDashboardResponse,
  MatchOptionsResponse,
} from '@/types/dashboard';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class ManagementDashboardError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ManagementDashboardError(502, 'Respons layanan dashboard tidak valid. Silakan coba lagi.');
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new ManagementDashboardError(502, 'Respons layanan dashboard tidak valid. Silakan coba lagi.');
  return value;
}

function nullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return text(value);
}

function positiveOrZeroInteger(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new ManagementDashboardError(502, 'Respons layanan dashboard tidak valid. Silakan coba lagi.');
  }
  return value as number;
}

function apiBase(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new ManagementDashboardError(503, 'Layanan dashboard belum dikonfigurasi.');
  return base.replace(/\/$/, '');
}

async function performRequest(endpoint: string, token: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('Authorization', `Bearer ${token}`);
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');
    response = await fetch(`${apiBase()}${endpoint}`, {
      ...init,
      headers,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(init.method === 'POST' ? 30_000 : 15_000),
      dispatcher: backendDispatcher,
    } as RequestInit & { dispatcher: Agent });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    console.warn('[management-dashboard/backend] connection failed', {
      endpoint: endpoint.replace(/\/\d+/g, '/:id'),
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new ManagementDashboardError(503, 'Layanan dashboard belum dapat dihubungi. Silakan coba lagi.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ManagementDashboardError(502, 'Respons layanan dashboard tidak valid. Silakan coba lagi.');
  }

  if (!response.ok) {
    const result = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown> : {};
    const message = typeof result.message === 'string' ? result.message : 'Layanan dashboard sedang bermasalah. Silakan coba lagi.';
    const errors = result.errors && typeof result.errors === 'object' && !Array.isArray(result.errors)
      ? result.errors as Record<string, string[]> : undefined;
    throw new ManagementDashboardError(response.status, message, errors);
  }
  return body;
}

function readEnvelope(value: unknown, label: string): Record<string, unknown> {
  const result = record(value);
  if (result.success !== true || typeof result.message !== 'string') {
    throw new ManagementDashboardError(502, `Respons ${label} tidak valid. Silakan coba lagi.`);
  }
  return result;
}

export async function backendManagementDashboard(token: string, tanggal?: string): Promise<ManagementDashboardResponse> {
  const query = tanggal ? `?tanggal=${encodeURIComponent(tanggal)}` : '';
  const response = readEnvelope(await performRequest(`/api/dashboard${query}`, token), 'layanan dashboard');
  const data = record(response.data);
  const summary = record(data.ringkasan);
  if (!Array.isArray(data.sedang_berlangsung) || !Array.isArray(data.agenda)) {
    throw new ManagementDashboardError(502, 'Respons layanan dashboard tidak valid. Silakan coba lagi.');
  }
  const ringkasan = {
    total_lomba: positiveOrZeroInteger(summary.total_lomba),
    lomba_berlangsung: positiveOrZeroInteger(summary.lomba_berlangsung),
    total_pendaftar: positiveOrZeroInteger(summary.total_pendaftar),
    pembayaran_lunas: positiveOrZeroInteger(summary.pembayaran_lunas),
    pembayaran_belum_lunas: positiveOrZeroInteger(summary.pembayaran_belum_lunas),
  };
  const sedang_berlangsung = data.sedang_berlangsung.map((value) => {
    const item = record(value);
    if (item.status !== 'Berlangsung') throw new ManagementDashboardError(502, 'Respons layanan dashboard tidak valid. Silakan coba lagi.');
    return {
      id_pertandingan: positiveOrZeroInteger(item.id_pertandingan),
      id_lomba: positiveOrZeroInteger(item.id_lomba),
      nama_lomba: text(item.nama_lomba),
      lokasi: nullableText(item.lokasi),
      babak: nullableText(item.babak),
      peserta_1: text(item.peserta_1),
      peserta_2: text(item.peserta_2),
      waktu_mulai: text(item.waktu_mulai),
      waktu_selesai: nullableText(item.waktu_selesai),
      status: 'Berlangsung' as const,
    };
  });
  const agenda = data.agenda.map((value) => {
    const item = record(value);
    return {
      id_jadwal: positiveOrZeroInteger(item.id_jadwal),
      id_lomba: positiveOrZeroInteger(item.id_lomba),
      nama_lomba: text(item.nama_lomba),
      tanggal: text(item.tanggal),
      waktu_mulai: text(item.waktu_mulai),
      waktu_selesai: text(item.waktu_selesai),
      lokasi: nullableText(item.lokasi),
    };
  });
  return { success: true, message: text(response.message), data: {
    tanggal_filter: text(data.tanggal_filter), ringkasan, sedang_berlangsung, agenda,
  } };
}

export async function backendMatchOptions(token: string): Promise<MatchOptionsResponse> {
  const response = readEnvelope(await performRequest('/api/pertandingan/options', token), 'opsi pertandingan');
  const data = record(response.data);
  if (!Array.isArray(data.lomba) || !Array.isArray(data.jadwal)) {
    throw new ManagementDashboardError(502, 'Respons opsi pertandingan tidak valid. Silakan coba lagi.');
  }
  const lomba = data.lomba.map((value) => {
    const item = record(value);
    if (item.jenis_pendaftaran !== 'Individu' && item.jenis_pendaftaran !== 'Beregu') {
      throw new ManagementDashboardError(502, 'Respons opsi pertandingan tidak valid. Silakan coba lagi.');
    }
    return {
      id_lomba: positiveOrZeroInteger(item.id_lomba),
      nama_lomba: text(item.nama_lomba),
      jenis_pendaftaran: item.jenis_pendaftaran,
    };
  });
  const jadwal = data.jadwal.map((value) => {
    const item = record(value);
    return {
      id_jadwal: positiveOrZeroInteger(item.id_jadwal),
      id_lomba: positiveOrZeroInteger(item.id_lomba),
      nama_lomba: text(item.nama_lomba),
      tanggal: text(item.tanggal),
      waktu_mulai: nullableText(item.waktu_mulai),
      waktu_selesai: nullableText(item.waktu_selesai),
      lokasi: nullableText(item.lokasi),
    };
  });
  return { success: true, message: text(response.message), data: { lomba, jadwal } };
}

export async function backendCreateMatch(token: string, input: CreateMatchInput): Promise<CreateMatchResponse> {
  const response = readEnvelope(await performRequest('/api/pertandingan', token, {
    method: 'POST',
    body: JSON.stringify(input),
  }), 'pertandingan');
  return { success: true, message: text(response.message), data: record(response.data) };
}
