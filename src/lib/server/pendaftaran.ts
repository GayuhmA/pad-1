import 'server-only';

import { Agent } from 'undici';
import { isValidIsoDate } from '@/lib/lomba-date';
import type {
  RingkasanLombaPendaftaran,
  RiwayatJadwalLomba,
  RiwayatPendaftaran,
  RiwayatPendaftaranResponse,
} from '@/types/pendaftaran';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class PendaftaranServiceError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function invalidResponse(): never {
  throw new PendaftaranServiceError(502, 'Respons layanan pendaftaran tidak valid. Silakan coba lagi.');
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalidResponse();
  return value as Record<string, unknown>;
}

function integer(value: unknown): number {
  if (!Number.isInteger(value)) invalidResponse();
  return value as number;
}

function nullableInteger(value: unknown): number | null {
  if (value !== null && !Number.isInteger(value)) invalidResponse();
  return value as number | null;
}

function nonEmptyString(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) invalidResponse();
  return value;
}

function nullableString(value: unknown): string | null {
  if (value !== null && typeof value !== 'string') invalidResponse();
  return value as string | null;
}

function isoTimestamp(value: unknown): string {
  const result = nonEmptyString(value);
  if (Number.isNaN(Date.parse(result))) invalidResponse();
  return result;
}

function isoDateFromBackend(value: unknown): string {
  const result = nonEmptyString(value).slice(0, 10);
  if (!isValidIsoDate(result)) invalidResponse();
  return result;
}

function nullableTime(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value)) invalidResponse();
  return value;
}

function schedule(value: unknown): RiwayatJadwalLomba {
  const item = record(value);
  return {
    id_jadwal: integer(item.id_jadwal),
    tanggal: isoDateFromBackend(item.tanggal),
    waktu_mulai: nullableTime(item.waktu_mulai),
    waktu_selesai: nullableTime(item.waktu_selesai),
    lokasi: nullableString(item.lokasi),
  };
}

function competition(value: unknown): RingkasanLombaPendaftaran {
  const item = record(value);
  if (item.jenis_pendaftaran !== 'Individu' && item.jenis_pendaftaran !== 'Beregu') invalidResponse();
  if (!Array.isArray(item.jadwal)) invalidResponse();

  let kategori = null;
  if (item.kategori !== null) {
    const rawCategory = record(item.kategori);
    kategori = {
      id_kategori: integer(rawCategory.id_kategori),
      nama_kategori: nonEmptyString(rawCategory.nama_kategori),
    };
  }

  return {
    id_lomba: integer(item.id_lomba),
    nama_lomba: nonEmptyString(item.nama_lomba),
    jenis_pendaftaran: item.jenis_pendaftaran,
    kategori,
    jadwal: item.jadwal.map(schedule),
  };
}

function registration(value: unknown): RiwayatPendaftaran {
  const item = record(value);
  if (!Array.isArray(item.anggota)) invalidResponse();
  return {
    id_pendaftaran: integer(item.id_pendaftaran),
    tanggal_daftar: isoTimestamp(item.tanggal_daftar),
    status: nonEmptyString(item.status),
    catatan: nullableString(item.catatan),
    id_tim: nullableInteger(item.id_tim),
    nama_tim: nullableString(item.nama_tim),
    jumlah_anggota: item.anggota.length,
    lomba: competition(item.lomba),
  };
}

export function readRiwayatPendaftaranResponse(value: unknown): RiwayatPendaftaranResponse {
  const response = record(value);
  if (response.success !== true || !Array.isArray(response.data)) invalidResponse();
  return {
    success: true,
    message: nonEmptyString(response.message),
    data: response.data.map(registration),
  };
}

export async function backendRiwayatPendaftaran(token: string): Promise<RiwayatPendaftaranResponse> {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new PendaftaranServiceError(503, 'Layanan pendaftaran belum dikonfigurasi.');

  let response: Response;
  try {
    response = await fetch(`${base.replace(/\/$/, '')}/api/warga/pendaftaran`, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
      dispatcher: backendDispatcher,
    } as RequestInit & { dispatcher: Agent });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    console.warn('[pendaftaran/backend] connection failed', {
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new PendaftaranServiceError(503, 'Layanan pendaftaran belum dapat dihubungi. Silakan coba lagi.');
  }

  if (!response.ok) {
    const messages: Record<number, string> = {
      401: 'Sesi telah berakhir. Silakan masuk kembali.',
      403: 'Akun tidak terhubung dengan data warga.',
      429: 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.',
    };
    throw new PendaftaranServiceError(messages[response.status] ? response.status : 502,
      messages[response.status] ?? 'Layanan pendaftaran sedang bermasalah. Silakan coba lagi.');
  }

  let body: unknown;
  try { body = await response.json(); } catch { invalidResponse(); }
  return readRiwayatPendaftaranResponse(body);
}
