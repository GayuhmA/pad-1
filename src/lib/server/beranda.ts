import 'server-only';

import { Agent } from 'undici';
import type {
  BerandaAgenda,
  BerandaBanner,
  BerandaData,
  BerandaPengumuman,
  BerandaPertandingan,
  BerandaResponse,
} from '@/types/beranda';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class BerandaServiceError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BerandaServiceError(502, 'Respons layanan beranda tidak valid. Silakan coba lagi.');
  }
  return value as Record<string, unknown>;
}

function integer(value: unknown): number {
  if (!Number.isInteger(value)) {
    throw new BerandaServiceError(502, 'Respons layanan beranda tidak valid. Silakan coba lagi.');
  }
  return value as number;
}

function string(value: unknown): string {
  if (typeof value !== 'string') {
    throw new BerandaServiceError(502, 'Respons layanan beranda tidak valid. Silakan coba lagi.');
  }
  return value;
}

function banner(value: unknown): BerandaBanner | null {
  if (value === null) return null;
  const item = record(value);
  if (item.logo !== null && typeof item.logo !== 'string') {
    throw new BerandaServiceError(502, 'Respons layanan beranda tidak valid. Silakan coba lagi.');
  }
  return {
    id_periode: integer(item.id_periode),
    judul: string(item.judul),
    tahun: string(item.tahun),
    deskripsi: string(item.deskripsi),
    logo: item.logo,
  };
}

function agenda(value: unknown): BerandaAgenda {
  const item = record(value);
  return {
    id_jadwal: integer(item.id_jadwal),
    id_lomba: integer(item.id_lomba),
    nama_lomba: string(item.nama_lomba),
    nama_kategori: string(item.nama_kategori),
    tanggal: string(item.tanggal),
    waktu_mulai: string(item.waktu_mulai),
    waktu_selesai: string(item.waktu_selesai),
    lokasi: string(item.lokasi),
  };
}

function pengumuman(value: unknown): BerandaPengumuman | null {
  if (value === null) return null;
  const item = record(value);
  return {
    id_pengumuman: integer(item.id_pengumuman),
    judul: string(item.judul),
    isi: string(item.isi),
    tanggal_publikasi: string(item.tanggal_publikasi),
  };
}

function pertandingan(value: unknown): BerandaPertandingan {
  const item = record(value);
  return {
    id_pertandingan: integer(item.id_pertandingan),
    id_lomba: integer(item.id_lomba),
    nama_lomba: string(item.nama_lomba),
    peserta_1: string(item.peserta_1),
    peserta_2: string(item.peserta_2),
    babak: string(item.babak),
    waktu_mulai: string(item.waktu_mulai),
    waktu_selesai: string(item.waktu_selesai),
    status: string(item.status),
    lokasi: string(item.lokasi),
  };
}

function array<T>(value: unknown, read: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) {
    throw new BerandaServiceError(502, 'Respons layanan beranda tidak valid. Silakan coba lagi.');
  }
  return value.map(read);
}

export function readBerandaResponse(value: unknown): BerandaResponse {
  const response = record(value);
  const rawData = record(response.data);
  if (response.success !== true) {
    throw new BerandaServiceError(502, 'Respons layanan beranda tidak valid. Silakan coba lagi.');
  }
  const data: BerandaData = {
    banner: banner(rawData.banner),
    tanggal_filter: string(rawData.tanggal_filter),
    jadwal_agenda: array(rawData.jadwal_agenda, agenda),
    pengumuman_terbaru: pengumuman(rawData.pengumuman_terbaru),
    sedang_berlangsung: array(rawData.sedang_berlangsung, pertandingan),
  };
  return { success: true, message: string(response.message), data };
}

export async function backendBeranda(token: string, tanggal?: string): Promise<BerandaResponse> {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new BerandaServiceError(503, 'Layanan beranda belum dikonfigurasi.');
  const url = new URL(`${base.replace(/\/$/, '')}/api/warga/beranda`);
  if (tanggal) url.searchParams.set('tanggal', tanggal);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
      dispatcher: backendDispatcher,
    } as RequestInit & { dispatcher: Agent });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    console.warn('[beranda/backend] connection failed', {
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code :
        error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new BerandaServiceError(503, 'Layanan beranda belum dapat dihubungi. Silakan coba lagi.');
  }

  if (!response.ok) {
    const messages: Record<number, string> = {
      401: 'Sesi telah berakhir. Silakan masuk kembali.',
      403: 'Akun tidak memiliki akses ke beranda warga.',
      422: 'Tanggal agenda tidak valid.',
      429: 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.',
    };
    throw new BerandaServiceError(messages[response.status] ? response.status : 502,
      messages[response.status] ?? 'Layanan beranda sedang bermasalah. Silakan coba lagi.');
  }

  let body: unknown;
  try { body = await response.json(); } catch {
    throw new BerandaServiceError(502, 'Respons layanan beranda tidak valid. Silakan coba lagi.');
  }
  return readBerandaResponse(body);
}
