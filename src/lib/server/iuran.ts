import 'server-only';

import { Agent } from 'undici';
import { isValidIsoDate } from '@/lib/lomba-date';
import type {
  ActiveIuranOption,
  AjukanPembayaranIuranResponse,
  DaftarIuranAktifResponse,
  DaftarIuranResponse,
  DetailIuran,
  DetailIuranResponse,
  PengaturanPembayaranData,
  PengaturanPembayaranResponse,
  PeriodeIuran,
  RingkasanPembayaranIuran,
  TagihanIuran,
  TransparansiIuranItem,
  TransparansiIuranParams,
  TransparansiIuranResponse,
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
    ...(typeof item.nama_iuran === 'string' && item.nama_iuran.trim()
      ? { nama_iuran: item.nama_iuran.trim() }
      : {}),
    ...(item.keterangan !== undefined
      ? { keterangan: nullableText(item.keterangan) }
      : {}),
    ...(typeof item.is_aktif === 'boolean' ? { is_aktif: item.is_aktif } : {}),
    nominal: amount(item.nominal),
    jatuh_tempo: isoDate(item.jatuh_tempo),
    status: item.status,
    periode: period(item),
    pembayaran_terakhir: latestPayment(item, payments),
  };
}

function activeBillOption(value: unknown): ActiveIuranOption {
  const item = record(value);
  return {
    id_iuran: integer(item.id_iuran),
    nama_iuran: text(item.nama_iuran),
    nominal: amount(item.nominal),
    jatuh_tempo: isoDate(item.jatuh_tempo),
    nama_kepala_keluarga: typeof item.nama_kepala_keluarga === 'string'
      ? item.nama_kepala_keluarga.trim()
      : '',
  };
}

export function readDaftarIuranAktifResponse(value: unknown): DaftarIuranAktifResponse {
  const response = record(value);
  if (response.success !== true || !Array.isArray(response.data)) invalidResponse();
  return {
    success: true,
    message: text(response.message),
    data: response.data.map(activeBillOption),
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

function transparansiItem(value: unknown): TransparansiIuranItem {
  const item = record(value);
  const statusRaw = item.status;
  if (statusRaw !== 'Lunas' && statusRaw !== 'Belum Lunas' && statusRaw !== 'Menunggu Konfirmasi') {
    invalidResponse();
  }
  return {
    id_iuran: integer(item.id_iuran),
    id_periode: typeof item.id_periode === 'number' && item.id_periode > 0 ? item.id_periode : 1,
    periode: item.periode ? period(item) : null,
    nama_kepala_keluarga: text(item.nama_kepala_keluarga),
    nominal: amount(item.nominal),
    status: statusRaw,
    waktu_pembayaran: nullableTimestamp(item.waktu_pembayaran),
  };
}

export function readTransparansiIuranResponse(value: unknown): TransparansiIuranResponse {
  const response = record(value);
  if (response.success !== true) invalidResponse();
  const rawData = record(response.data);
  const list = rawData.data;
  if (!Array.isArray(list)) invalidResponse();
  const currentPage = typeof rawData.current_page === 'number' ? rawData.current_page : 1;
  const lastPage = typeof rawData.last_page === 'number' ? rawData.last_page : 1;
  const perPage = typeof rawData.per_page === 'number' ? rawData.per_page : 10;
  const total = typeof rawData.total === 'number' ? rawData.total : list.length;

  return {
    success: true,
    message: typeof response.message === 'string' ? response.message : 'Transparansi iuran berhasil diambil.',
    data: {
      current_page: currentPage,
      last_page: lastPage,
      per_page: perPage,
      total,
      data: list.map(transparansiItem),
    },
  };
}

let cachedPaymentSettings: PengaturanPembayaranData | null = null;

export function updateCachedPaymentSettings(settings: PengaturanPembayaranData | null) {
  if (settings) {
    cachedPaymentSettings = settings;
  }
}

export function readPengaturanPembayaranResponse(value: unknown): PengaturanPembayaranResponse {
  const response = record(value);
  if (response.success !== true) invalidResponse();
  const rawData = response.data == null ? null : record(response.data);
  let qrisUrl = nullableText(rawData?.qris_image);
  if (qrisUrl && qrisUrl.startsWith('/')) {
    qrisUrl = `${apiBase()}${qrisUrl}`;
  }

  const data: PengaturanPembayaranData | null = rawData
    ? {
        id_pengaturan: typeof rawData.id_pengaturan === 'number' ? rawData.id_pengaturan : null,
        nama_bank: nullableText(rawData.nama_bank),
        nomor_rekening: nullableText(rawData.nomor_rekening),
        atas_nama: nullableText(rawData.atas_nama),
        qris_image: qrisUrl,
      }
    : null;

  if (data) {
    cachedPaymentSettings = data;
  }

  return {
    success: true,
    message: typeof response.message === 'string' ? response.message : 'Pengaturan pembayaran berhasil diambil.',
    data,
  };
}

function apiBase(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new IuranServiceError(503, 'Layanan iuran belum dikonfigurasi.');
  return base.replace(/\/$/, '');
}

async function performRequest(endpoint: string, token: string | undefined, init: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
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
      endpoint: endpoint.replace(/\/\d+/g, '/:id').split('?')[0],
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new IuranServiceError(503, 'Layanan iuran belum dapat dihubungi. Silakan coba lagi.');
  }

  if (!response.ok) {
    let backendMessage: string | null = null;
    try {
      const errorBody = await response.json();
      if (errorBody && typeof errorBody === 'object' && !Array.isArray(errorBody) &&
          typeof (errorBody as Record<string, unknown>).message === 'string') {
        const rawMsg = ((errorBody as Record<string, unknown>).message as string).trim();
        if (rawMsg) backendMessage = rawMsg;
      }
    } catch { /* ignore */ }

    const messages: Record<number, string> = {
      401: 'Sesi telah berakhir. Silakan masuk kembali.',
      403: 'Akun tidak terhubung dengan data warga.',
      404: 'Tagihan iuran tidak ditemukan.',
      409: 'Pembayaran sebelumnya masih menunggu verifikasi panitia.',
      422: init.method === 'POST'
        ? 'Pembayaran tidak valid. Pastikan nominal dan bukti bayar memenuhi ketentuan.'
        : 'Filter iuran tidak valid.',
      429: 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.',
    };
    const fallback = messages[response.status] ?? 'Layanan iuran sedang bermasalah. Silakan coba lagi.';
    const finalMessage = response.status === 422 || response.status === 409
      ? (backendMessage ?? fallback)
      : fallback;
    throw new IuranServiceError(messages[response.status] ? response.status : 502, finalMessage);
  }

  try { return await response.json(); } catch { invalidResponse(); }
}

export async function backendDaftarIuran(token: string): Promise<DaftarIuranResponse> {
  return readDaftarIuranResponse(await performRequest('/api/warga/iuran', token, { method: 'GET' }));
}

export async function backendDaftarIuranAktif(token: string): Promise<DaftarIuranAktifResponse> {
  return readDaftarIuranAktifResponse(await performRequest('/api/warga/iuran/aktif', token, { method: 'GET' }));
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

export async function backendTransparansiIuran(
  params?: TransparansiIuranParams,
  token?: string,
): Promise<TransparansiIuranResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== 'Semua') {
    searchParams.set('status', params.status);
  }
  if (params?.search && params.search.trim()) {
    searchParams.set('search', params.search.trim());
  }
  if (params?.page && Number.isSafeInteger(params.page) && params.page > 0) {
    searchParams.set('page', String(params.page));
  }
  if (params?.per_page && Number.isSafeInteger(params.per_page) && params.per_page > 0) {
    searchParams.set('per_page', String(params.per_page));
  }
  if (params?.id_periode && Number.isSafeInteger(params.id_periode) && params.id_periode > 0) {
    searchParams.set('id_periode', String(params.id_periode));
  }
  const query = searchParams.toString();
  const endpoint = `/api/warga/iuran/transparansi${query ? `?${query}` : ''}`;
  const response = await performRequest(endpoint, token, { method: 'GET' });
  return readTransparansiIuranResponse(response);
}

export async function backendPengaturanPembayaran(
  token?: string,
): Promise<PengaturanPembayaranResponse> {
  if (token) {
    try {
      const response = await performRequest('/api/pengaturan-pembayaran', token, { method: 'GET' });
      return readPengaturanPembayaranResponse(response);
    } catch (error) {
      if (error instanceof IuranServiceError && (error.status === 401 || error.status === 403)) {
        if (cachedPaymentSettings) {
          return {
            success: true,
            message: 'Pengaturan pembayaran berhasil diambil.',
            data: cachedPaymentSettings,
          };
        }
        return {
          success: true,
          message: 'Pengaturan pembayaran tidak tersedia.',
          data: null,
        };
      }
      throw error;
    }
  }

  // When unauthenticated or guest, return cached payment settings if available
  return {
    success: true,
    message: cachedPaymentSettings ? 'Pengaturan pembayaran berhasil diambil.' : 'Sesi akun belum tersedia.',
    data: cachedPaymentSettings,
  };
}
