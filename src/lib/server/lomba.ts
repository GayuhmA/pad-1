import 'server-only';

import { Agent } from 'undici';
import type {
  DaftarLombaResponse,
  JadwalLomba,
  KategoriLomba,
  Lomba,
  PendaftaranLombaResponse,
} from '@/types/lomba';
import { isValidIsoDate } from '@/lib/lomba-date';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class LombaServiceError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function invalidResponse(): never {
  throw new LombaServiceError(502, 'Respons layanan lomba tidak valid. Silakan coba lagi.');
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalidResponse();
  return value as Record<string, unknown>;
}

function string(value: unknown): string {
  if (typeof value !== 'string') invalidResponse();
  return value;
}

function nullableString(value: unknown): string | null {
  if (value !== null && typeof value !== 'string') invalidResponse();
  return value as string | null;
}

function integer(value: unknown): number {
  if (!Number.isInteger(value)) invalidResponse();
  return value as number;
}

function nullableInteger(value: unknown): number | null {
  if (value !== null && !Number.isInteger(value)) invalidResponse();
  return value as number | null;
}

function category(value: unknown): KategoriLomba | null {
  if (value === null) return null;
  const item = record(value);
  return {
    id_kategori: integer(item.id_kategori),
    nama_kategori: string(item.nama_kategori),
  };
}

function schedule(value: unknown): JadwalLomba {
  const item = record(value);
  const tanggal = string(item.tanggal);
  if (!isValidIsoDate(tanggal)) invalidResponse();
  return {
    id_jadwal: integer(item.id_jadwal),
    tanggal,
    waktu_mulai: nullableString(item.waktu_mulai),
    waktu_selesai: nullableString(item.waktu_selesai),
    lokasi: nullableString(item.lokasi),
    status_jadwal: string(item.status_jadwal),
  };
}

function competition(value: unknown): Lomba {
  const item = record(value);
  if (item.jenis_pendaftaran !== 'Individu' && item.jenis_pendaftaran !== 'Beregu') invalidResponse();
  if (typeof item.sudah_mendaftar !== 'boolean' || !Array.isArray(item.jadwal)) invalidResponse();
  return {
    id_lomba: integer(item.id_lomba),
    nama_lomba: string(item.nama_lomba),
    jenis_pendaftaran: item.jenis_pendaftaran,
    status: string(item.status),
    deskripsi: nullableString(item.deskripsi),
    kategori: category(item.kategori),
    kapasitas_peserta: nullableInteger(item.kapasitas_peserta),
    batas_anggota_tim: nullableInteger(item.batas_anggota_tim),
    sudah_mendaftar: item.sudah_mendaftar,
    jadwal: item.jadwal.map(schedule),
  };
}

export function readDaftarLombaResponse(value: unknown): DaftarLombaResponse {
  const response = record(value);
  if (response.success !== true || !Array.isArray(response.data) || !Array.isArray(response.tanggal_tersedia)) {
    invalidResponse();
  }
  const tanggalTersedia = response.tanggal_tersedia.map(string);
  if (tanggalTersedia.some((date) => !isValidIsoDate(date))) invalidResponse();
  return {
    success: true,
    message: string(response.message),
    data: response.data.map(competition),
    tanggal_tersedia: [...new Set(tanggalTersedia)].sort(),
  };
}

function readPendaftaranResponse(value: unknown): PendaftaranLombaResponse {
  const response = record(value);
  if (response.success !== true) invalidResponse();
  return { success: true, message: string(response.message) };
}

function apiBase(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new LombaServiceError(503, 'Layanan lomba belum dikonfigurasi.');
  return base.replace(/\/$/, '');
}

async function backendRequest(
  endpoint: '/api/warga/lomba' | '/api/warga/pendaftaran',
  token: string,
  init: { method: 'GET' | 'POST'; body?: string },
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${apiBase()}${endpoint}`, {
      method: init.method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
      dispatcher: backendDispatcher,
    } as RequestInit & { dispatcher: Agent });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    console.warn('[lomba/backend] connection failed', {
      endpoint,
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new LombaServiceError(503, 'Layanan lomba belum dapat dihubungi. Silakan coba lagi.');
  }

  if (!response.ok) {
    const messages: Record<number, string> = {
      401: 'Sesi telah berakhir. Silakan masuk kembali.',
      403: 'Akun tidak memiliki akses untuk mendaftar lomba.',
      409: 'Anda sudah terdaftar pada lomba ini.',
      422: 'Pendaftaran tidak dapat diproses. Lomba mungkin sudah penuh atau tidak lagi dibuka.',
      429: 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.',
    };
    throw new LombaServiceError(messages[response.status] ? response.status : 502,
      messages[response.status] ?? 'Layanan lomba sedang bermasalah. Silakan coba lagi.');
  }

  try {
    return await response.json();
  } catch {
    invalidResponse();
  }
}

export async function backendDaftarLomba(token: string): Promise<DaftarLombaResponse> {
  return readDaftarLombaResponse(await backendRequest('/api/warga/lomba', token, { method: 'GET' }));
}

export async function backendDaftarKeLomba(token: string, idLomba: number): Promise<PendaftaranLombaResponse> {
  const body = await backendRequest('/api/warga/pendaftaran', token, {
    method: 'POST',
    body: JSON.stringify({ id_lomba: idLomba }),
  });
  return readPendaftaranResponse(body);
}
