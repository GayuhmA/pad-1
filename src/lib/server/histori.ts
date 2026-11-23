import 'server-only';

import { Agent } from 'undici';
import type {
  CreatePemenangInput,
  DaftarHistoriParams,
  DaftarHistoriResponse,
  DetailHistoriPeriode,
  DetailHistoriResponse,
  LombaHistoriItem,
  MutasiPemenangResponse,
  PemenangLombaItem,
  PeriodeHistoriItem,
  PesertaLombaOption,
  UpdateHistoriPeriodeInput,
  UpdatePemenangInput,
} from '@/types/histori';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class HistoriServiceError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

function invalidResponse(): never {
  throw new HistoriServiceError(502, 'Respons layanan histori tidak valid. Silakan coba lagi.');
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalidResponse();
  return value as Record<string, unknown>;
}

function integer(value: unknown): number {
  const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isSafeInteger(num) || num < 0) invalidResponse();
  return num;
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

function locations(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === 'string' ? v : String(v)));
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function winnerItem(value: unknown): PemenangLombaItem {
  const item = record(value);
  return {
    id_pemenang: typeof item.id_pemenang === 'number' ? item.id_pemenang : undefined,
    tipe_pemenang: typeof item.tipe_pemenang === 'string' ? item.tipe_pemenang : undefined,
    peringkat: typeof item.peringkat === 'number' ? item.peringkat : undefined,
    nama_pemenang:
      typeof item.nama_pemenang === 'string'
        ? item.nama_pemenang
        : typeof item.nama === 'string'
        ? item.nama
        : 'Pemenang',
    keterangan: nullableText(item.keterangan),
  };
}

function winners(value: unknown): PemenangLombaItem[] {
  if (value == null) return [];
  if (!Array.isArray(value)) invalidResponse();
  return value.map(winnerItem);
}

function periodItem(value: unknown): PeriodeHistoriItem {
  const item = record(value);
  return {
    id_periode: integer(item.id_periode),
    tahun: String(item.tahun ?? '2026'),
    judul:
      typeof item.judul === 'string'
        ? item.judul
        : typeof item.nama_kegiatan === 'string'
        ? item.nama_kegiatan
        : 'Semarak HUT RI',
    nama_kegiatan:
      typeof item.nama_kegiatan === 'string'
        ? item.nama_kegiatan
        : typeof item.judul === 'string'
        ? item.judul
        : 'Semarak HUT RI',
    deskripsi: nullableText(item.deskripsi),
    tanggal_mulai: nullableText(item.tanggal_mulai),
    tanggal_selesai: nullableText(item.tanggal_selesai),
    status: nullableText(item.status),
    logo: nullableText(item.logo),
    jumlah_lomba: typeof item.jumlah_lomba === 'number' ? item.jumlah_lomba : 0,
  };
}

function lombaItem(value: unknown): LombaHistoriItem {
  const item = record(value);
  return {
    id_lomba: integer(item.id_lomba),
    nama_lomba: text(item.nama_lomba),
    kategori: typeof item.kategori === 'string' ? item.kategori : 'Umum',
    jenis_pendaftaran: typeof item.jenis_pendaftaran === 'string' ? item.jenis_pendaftaran : 'Individu',
    jumlah_peserta: typeof item.jumlah_peserta === 'number' ? item.jumlah_peserta : 0,
    jumlah_regu: typeof item.jumlah_regu === 'number' ? item.jumlah_regu : 0,
    lokasi: locations(item.lokasi),
    pemenang: winners(item.pemenang),
  };
}

export function readDaftarHistoriResponse(value: unknown): DaftarHistoriResponse {
  const response = record(value);
  if (response.success !== true || !Array.isArray(response.data)) invalidResponse();
  return {
    success: true,
    message: typeof response.message === 'string' ? response.message : 'Daftar histori berhasil diambil.',
    data: response.data.map(periodItem),
  };
}

export function readDetailHistoriResponse(value: unknown): DetailHistoriResponse {
  const response = record(value);
  if (response.success !== true) invalidResponse();
  const rawData = record(response.data);
  const period = periodItem(rawData);
  const lombaList = Array.isArray(rawData.lomba) ? rawData.lomba.map(lombaItem) : [];

  return {
    success: true,
    message: typeof response.message === 'string' ? response.message : 'Detail histori berhasil diambil.',
    data: {
      ...period,
      lomba: lombaList,
    },
  };
}

function apiBase(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new HistoriServiceError(503, 'Layanan histori belum dikonfigurasi.');
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
    if (init.body !== undefined && !(init.body instanceof FormData)) {
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
    console.warn('[histori/backend] connection failed', {
      endpoint: endpoint.replace(/\/\d+/g, '/:id').split('?')[0],
      code:
        typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code)
          ? code
          : error instanceof Error && error.name === 'TimeoutError'
          ? 'TIMEOUT'
          : 'NETWORK_ERROR',
    });
    throw new HistoriServiceError(503, 'Layanan histori belum dapat dihubungi. Silakan coba lagi.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new HistoriServiceError(502, 'Respons layanan histori tidak valid. Silakan coba lagi.');
  }

  if (!response.ok) {
    const result = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown> : {};
    let message = typeof result.message === 'string' ? result.message : undefined;
    const errors = result.errors && typeof result.errors === 'object' && !Array.isArray(result.errors)
      ? result.errors as Record<string, string[]> : undefined;

    if (errors && Object.keys(errors).length > 0) {
      const firstKey = Object.keys(errors)[0];
      const val = errors[firstKey];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
        message = val[0];
      }
    }

    const messages: Record<number, string> = {
      401: 'Sesi telah berakhir. Silakan masuk kembali.',
      403: 'Tidak memiliki hak akses ke data histori.',
      404: 'Histori kegiatan tidak ditemukan.',
      422: 'Parameter filter histori tidak valid.',
      429: 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.',
    };
    throw new HistoriServiceError(
      response.status,
      message ?? messages[response.status] ?? 'Layanan histori sedang bermasalah. Silakan coba lagi.',
      errors,
    );
  }

  return body;
}

export async function backendDaftarHistori(
  token?: string,
  params?: DaftarHistoriParams,
): Promise<DaftarHistoriResponse> {
  const searchParams = new URLSearchParams();
  if (params?.tahun) {
    searchParams.set('tahun', String(params.tahun));
  }
  if (params?.search && params.search.trim()) {
    searchParams.set('search', params.search.trim());
  }
  const query = searchParams.toString();
  const endpoint = `/api/histori${query ? `?${query}` : ''}`;
  const response = await performRequest(endpoint, token, { method: 'GET' });
  return readDaftarHistoriResponse(response);
}

export async function backendDetailHistori(
  token: string | undefined,
  idPeriode: number,
  search?: string,
): Promise<DetailHistoriResponse> {
  const searchParams = new URLSearchParams();
  if (search && search.trim()) {
    searchParams.set('search', search.trim());
  }
  const query = searchParams.toString();
  const endpoint = `/api/histori/${idPeriode}${query ? `?${query}` : ''}`;
  const response = await performRequest(endpoint, token, { method: 'GET' });
  return readDetailHistoriResponse(response);
}

export async function backendUpdateHistoriPeriode(
  token: string,
  idPeriode: number,
  body: UpdateHistoriPeriodeInput,
): Promise<{ success: boolean; message: string; data: PeriodeHistoriItem }> {
  const raw = await performRequest(`/api/histori/${idPeriode}`, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  const env = record(raw);
  return {
    success: true,
    message: typeof env.message === 'string' ? env.message : 'Informasi histori berhasil diperbarui.',
    data: periodItem(env.data),
  };
}

export async function backendAddPemenang(
  token: string,
  idPeriode: number,
  idLomba: number,
  body: CreatePemenangInput,
): Promise<MutasiPemenangResponse> {
  const raw = await performRequest(`/api/histori/${idPeriode}/lomba/${idLomba}/pemenang`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const env = record(raw);
  const data = env.data ? record(env.data) : null;
  return {
    success: true,
    message: typeof env.message === 'string' ? env.message : 'Pemenang berhasil ditambahkan.',
    data: data
      ? {
          id_pemenang: Number(data.id_pemenang),
          peringkat: Number(data.peringkat ?? 1),
          tipe_pemenang: String(data.tipe_pemenang ?? 'Individu'),
          nama_pemenang: String(data.nama_pemenang ?? ''),
          id_pendaftaran: data.id_pendaftaran != null ? Number(data.id_pendaftaran) : null,
          id_tim: data.id_tim != null ? Number(data.id_tim) : null,
          keterangan: typeof data.keterangan === 'string' ? data.keterangan : null,
        }
      : null,
  };
}

export async function backendUpdatePemenang(
  token: string,
  idPemenang: number,
  body: UpdatePemenangInput,
): Promise<MutasiPemenangResponse> {
  const raw = await performRequest(`/api/pemenang/${idPemenang}`, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  const env = record(raw);
  const data = env.data ? record(env.data) : null;
  return {
    success: true,
    message: typeof env.message === 'string' ? env.message : 'Pemenang berhasil diperbarui.',
    data: data
      ? {
          id_pemenang: Number(data.id_pemenang),
          peringkat: Number(data.peringkat ?? 1),
          tipe_pemenang: String(data.tipe_pemenang ?? 'Individu'),
          nama_pemenang: String(data.nama_pemenang ?? ''),
          id_pendaftaran: data.id_pendaftaran != null ? Number(data.id_pendaftaran) : null,
          id_tim: data.id_tim != null ? Number(data.id_tim) : null,
          keterangan: typeof data.keterangan === 'string' ? data.keterangan : null,
        }
      : null,
  };
}

export async function backendDeletePemenang(
  token: string,
  idPemenang: number,
): Promise<{ success: boolean; message: string; data: null }> {
  const raw = await performRequest(`/api/pemenang/${idPemenang}`, token, {
    method: 'DELETE',
  });
  const env = record(raw);
  return {
    success: true,
    message: typeof env.message === 'string' ? env.message : 'Pemenang berhasil dihapus.',
    data: null,
  };
}

export async function backendGetPesertaLomba(
  token: string,
  idLomba: number,
  role?: string,
): Promise<{ success: boolean; message: string; data: PesertaLombaOption[] }> {
  const primaryEndpoint = role === 'admin'
    ? `/api/admin/lomba/${idLomba}/pendaftaran`
    : `/api/panitia/lomba/${idLomba}/pendaftaran`;
  const fallbackEndpoint = role === 'admin'
    ? `/api/panitia/lomba/${idLomba}/pendaftaran`
    : `/api/admin/lomba/${idLomba}/pendaftaran`;

  let raw: unknown;
  try {
    raw = await performRequest(primaryEndpoint, token, { method: 'GET' });
  } catch (err) {
    if (err instanceof HistoriServiceError && (err.status === 403 || err.status === 404)) {
      try {
        raw = await performRequest(fallbackEndpoint, token, { method: 'GET' });
      } catch {
        throw err;
      }
    } else {
      throw err;
    }
  }

  const env = record(raw);
  let list: unknown[] = [];
  if (Array.isArray(env.data)) {
    list = env.data;
  } else if (env.data && typeof env.data === 'object') {
    const dataObj = env.data as Record<string, unknown>;
    if (Array.isArray(dataObj.data)) {
      list = dataObj.data;
    }
  }

  const participants: PesertaLombaOption[] = list
    .filter((item) => {
      const rec = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      const statusStr = String(rec.status ?? '').toLowerCase();
      return statusStr === 'diterima' || statusStr === 'selesai' || statusStr === 'menunggu';
    })
    .map((item) => {
      const rec = item as Record<string, unknown>;
      const warga = rec.warga && typeof rec.warga === 'object' ? rec.warga as Record<string, unknown> : {};
      const nama =
        typeof warga.nama === 'string' && warga.nama
          ? warga.nama
          : typeof rec.nama === 'string' && rec.nama
          ? rec.nama
          : typeof rec.peserta === 'string' && rec.peserta
          ? rec.peserta
          : typeof rec.nama_kepala_keluarga === 'string' && rec.nama_kepala_keluarga
          ? rec.nama_kepala_keluarga
          : 'Peserta';
      const namaTim = typeof rec.nama_tim === 'string' ? rec.nama_tim : null;
      return {
        id_pendaftaran: Number(rec.id_pendaftaran),
        nama,
        nama_tim: namaTim,
        status: String(rec.status ?? ''),
      };
    });

  return {
    success: true,
    message: 'Daftar peserta lomba berhasil dimuat.',
    data: participants,
  };
}

