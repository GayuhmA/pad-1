import 'server-only';

import { Agent } from 'undici';
import { isValidIsoDate } from '@/lib/lomba-date';
import type {
  AjukanPembayaranIuranResponse,
  DaftarIuranResponse,
  DetailIuran,
  DetailIuranResponse,
  PeriodeIuran,
  RingkasanPembayaranIuran,
  TagihanIuran,
} from '@/types/iuran';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class IuranServiceError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function invalidResponse(): never {
  throw new IuranServiceError(502, 'Respons layanan iuran tidak valid. Silakan coba lagi.');
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

function nullableText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') invalidResponse();
  return value;
}

function amount(value: unknown): number {
  const parsed = typeof value === 'number' ? value
    : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0) invalidResponse();
  return parsed;
}

function isoDate(value: unknown): string {
  const result = text(value).slice(0, 10);
  if (!isValidIsoDate(result)) invalidResponse();
  return result;
}

function timestamp(value: unknown): string {
  const result = text(value);
  if (Number.isNaN(Date.parse(result))) invalidResponse();
  return result;
}

function nullableTimestamp(value: unknown): string | null {
  if (value == null) return null;
  return timestamp(value);
}

function period(item: Record<string, unknown>): PeriodeIuran | null {
  if (item.periode && typeof item.periode === 'object' && !Array.isArray(item.periode)) {
    const raw = record(item.periode);
    return {
      id_periode: integer(raw.id_periode),
      tahun: raw.tahun == null ? null : String(raw.tahun),
      nama_kegiatan: nullableText(raw.nama_kegiatan),
    };
  }
  if (Number.isSafeInteger(item.id_periode) && (item.id_periode as number) > 0) {
    return {
      id_periode: item.id_periode as number,
      tahun: item.tahun == null ? null : String(item.tahun),
      nama_kegiatan: nullableText(item.nama_kegiatan),
    };
  }
  return null;
}

function payment(value: unknown): RingkasanPembayaranIuran {
  const item = record(value);
  if (item.status_verifikasi !== 'Menunggu' &&
      item.status_verifikasi !== 'Diterima' &&
      item.status_verifikasi !== 'Ditolak') invalidResponse();
  return {
    id_pembayaran: integer(item.id_pembayaran),
    tanggal_bayar: timestamp(item.tanggal_bayar),
    nominal: amount(item.nominal),
    metode: nullableText(item.metode),
    status_verifikasi: item.status_verifikasi,
    tanggal_verifikasi: nullableTimestamp(item.tanggal_verifikasi),
  };
}

function paymentsFrom(item: Record<string, unknown>): RingkasanPembayaranIuran[] {
  const value = item.pembayaran ?? item.riwayat_pembayaran;
  if (value == null) return [];
  if (!Array.isArray(value)) invalidResponse();
  return value.map(payment).sort((left, right) =>
    Date.parse(right.tanggal_bayar) - Date.parse(left.tanggal_bayar));
}

function latestPayment(
  item: Record<string, unknown>,
  payments: RingkasanPembayaranIuran[],
): RingkasanPembayaranIuran | null {
  if (item.pembayaran_terakhir != null) return payment(item.pembayaran_terakhir);
  if (item.latest_pembayaran != null) return payment(item.latest_pembayaran);
  return payments[0] ?? null;
}

function bill(value: unknown): TagihanIuran {
  const item = record(value);
  if (item.status !== 'Belum Bayar' && item.status !== 'Sudah Bayar') invalidResponse();
  const payments = paymentsFrom(item);
  return {
    id_iuran: integer(item.id_iuran),
    nominal: amount(item.nominal),
    jatuh_tempo: isoDate(item.jatuh_tempo),
    status: item.status,
    periode: period(item),
    pembayaran_terakhir: latestPayment(item, payments),
  };
}

export function readDaftarIuranResponse(value: unknown): DaftarIuranResponse {
  const response = record(value);
  if (response.success !== true || !Array.isArray(response.data)) invalidResponse();
  return {
    success: true,
    message: text(response.message),
    data: response.data.map(bill),
  };
}

export function readDetailIuranResponse(value: unknown): DetailIuranResponse {
  const response = record(value);
  if (response.success !== true) invalidResponse();
  const rawData = record(response.data);
  const rawBill = rawData.iuran && typeof rawData.iuran === 'object' ? record(rawData.iuran) : rawData;
  const historySource = rawData.pembayaran ?? rawData.riwayat_pembayaran ?? rawBill.pembayaran;
  const pembayaran = historySource == null ? []
    : Array.isArray(historySource) ? historySource.map(payment).sort((left, right) =>
      Date.parse(right.tanggal_bayar) - Date.parse(left.tanggal_bayar))
    : invalidResponse();
  const normalized = bill({ ...rawBill, pembayaran });
  const data: DetailIuran = { ...normalized, pembayaran };
  return { success: true, message: text(response.message), data };
}

function readPaymentResponse(value: unknown): AjukanPembayaranIuranResponse {
  const response = record(value);
  if (response.success !== true) invalidResponse();
  return { success: true, message: text(response.message) };
}

function apiBase(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new IuranServiceError(503, 'Layanan iuran belum dikonfigurasi.');
  return base.replace(/\/$/, '');
}

async function performRequest(endpoint: string, token: string, init: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('Authorization', `Bearer ${token}`);
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
    console.warn('[iuran/backend] connection failed', {
      endpoint: endpoint.replace(/\/\d+/g, '/:id'),
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new IuranServiceError(503, 'Layanan iuran belum dapat dihubungi. Silakan coba lagi.');
  }

  if (!response.ok) {
    const messages: Record<number, string> = {
      401: 'Sesi telah berakhir. Silakan masuk kembali.',
      403: 'Akun tidak terhubung dengan data warga.',
      404: 'Tagihan iuran tidak ditemukan.',
      409: 'Pembayaran sebelumnya masih menunggu verifikasi panitia.',
      422: init.method === 'POST'
        ? 'Pembayaran tidak valid. Pastikan nominal sesuai tagihan dan bukti bayar memenuhi ketentuan.'
        : 'Filter iuran tidak valid.',
      429: 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.',
    };
    throw new IuranServiceError(messages[response.status] ? response.status : 502,
      messages[response.status] ?? 'Layanan iuran sedang bermasalah. Silakan coba lagi.');
  }

  try { return await response.json(); } catch { invalidResponse(); }
}

export async function backendDaftarIuran(token: string): Promise<DaftarIuranResponse> {
  return readDaftarIuranResponse(await performRequest('/api/warga/iuran', token, { method: 'GET' }));
}

export async function backendDetailIuran(token: string, idIuran: number): Promise<DetailIuranResponse> {
  return readDetailIuranResponse(await performRequest(`/api/warga/iuran/${idIuran}`, token, { method: 'GET' }));
}

export async function backendAjukanPembayaranIuran(
  token: string,
  idIuran: number,
  input: { metode: string; nominal: number; buktiBayar: File },
): Promise<AjukanPembayaranIuranResponse> {
  const body = new FormData();
  body.set('metode', input.metode);
  body.set('nominal', String(input.nominal));
  body.set('bukti_bayar', input.buktiBayar, input.buktiBayar.name);
  const response = await performRequest(`/api/warga/iuran/${idIuran}/pembayaran`, token, {
    method: 'POST',
    body,
  });
  return readPaymentResponse(response);
}
