import 'server-only';

import { Agent } from 'undici';
import type {
  AlbumDokumentasi,
  CreateAlbumResponse,
  DeleteResponse,
  DetailAlbumResponse,
  DokumentasiListResponse,
  MediaDokumentasi,
  UploadMediaResponse,
} from '@/types/management-dokumentasi';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class DokumentasiError extends Error {
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
    throw new DokumentasiError(502, 'Respons layanan dokumentasi tidak valid. Silakan coba lagi.');
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new DokumentasiError(502, 'Respons layanan dokumentasi tidak valid. Silakan coba lagi.');
  return value;
}

function apiBase(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new DokumentasiError(503, 'Layanan dokumentasi belum dikonfigurasi.');
  return base.replace(/\/$/, '');
}

function normalizeUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const base = apiBase();
  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

async function performRequest(endpoint: string, token?: string, init: RequestInit = {}): Promise<unknown> {
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
      signal: AbortSignal.timeout(30_000),
      dispatcher: backendDispatcher,
    } as RequestInit & { dispatcher: Agent });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    console.warn('[dokumentasi/backend] connection failed', {
      endpoint: endpoint.replace(/\/\d+/g, '/:id'),
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new DokumentasiError(503, 'Layanan dokumentasi belum dapat dihubungi. Silakan coba lagi.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new DokumentasiError(502, 'Respons layanan dokumentasi tidak valid. Silakan coba lagi.');
  }

  if (!response.ok) {
    const result = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown> : {};
    const message = typeof result.message === 'string' ? result.message : 'Layanan dokumentasi sedang bermasalah. Silakan coba lagi.';
    const errors = result.errors && typeof result.errors === 'object' && !Array.isArray(result.errors)
      ? result.errors as Record<string, string[]> : undefined;
    throw new DokumentasiError(response.status, message, errors);
  }
  return body;
}

function readEnvelope(value: unknown, label: string): Record<string, unknown> {
  const result = record(value);
  if (result.success !== true) {
    throw new DokumentasiError(502, `Respons ${label} tidak valid. Silakan coba lagi.`);
  }
  return result;
}

function mapAlbumItem(raw: unknown): AlbumDokumentasi {
  const item = record(raw);
  return {
    id_album: Number(item.id_album),
    nama_album: String(item.nama_album ?? ''),
    tanggal_album: String(item.tanggal_album ?? ''),
    cover: normalizeUrl(item.cover),
    jumlah_foto: typeof item.jumlah_foto === 'number' ? item.jumlah_foto : 0,
    jumlah_video: typeof item.jumlah_video === 'number' ? item.jumlah_video : 0,
    periode: item.periode && typeof item.periode === 'object' ? item.periode as AlbumDokumentasi['periode'] : null,
    lomba: item.lomba && typeof item.lomba === 'object' ? item.lomba as AlbumDokumentasi['lomba'] : null,
  };
}

function mapMediaItem(raw: unknown): MediaDokumentasi {
  const item = record(raw);
  return {
    id_dokumentasi: Number(item.id_dokumentasi),
    jenis_file: item.jenis_file === 'Video' ? 'Video' : 'Foto',
    file: normalizeUrl(item.file) ?? String(item.file ?? ''),
    keterangan: typeof item.keterangan === 'string' ? item.keterangan : null,
    created_at: typeof item.created_at === 'string' ? item.created_at : undefined,
  };
}

export async function backendGetAlbums(
  token?: string,
  options?: { search?: string; id_periode?: number; id_lomba?: number },
): Promise<DokumentasiListResponse> {
  const params = new URLSearchParams();
  if (options?.search?.trim()) params.set('search', options.search.trim());
  if (options?.id_periode) params.set('id_periode', String(options.id_periode));
  if (options?.id_lomba) params.set('id_lomba', String(options.id_lomba));
  const query = params.toString() ? `?${params.toString()}` : '';

  const raw = await performRequest(`/api/dokumentasi${query}`, token, { method: 'GET' });
  const env = readEnvelope(raw, 'daftar album dokumentasi');
  const list = Array.isArray(env.data) ? env.data : [];

  return {
    success: true,
    message: text(env.message),
    data: list.map(mapAlbumItem),
  };
}

export async function backendCreateAlbum(
  token: string,
  formData: FormData,
): Promise<CreateAlbumResponse> {
  const raw = await performRequest('/api/dokumentasi', token, {
    method: 'POST',
    body: formData,
  });
  const env = readEnvelope(raw, 'buat album dokumentasi');
  return {
    success: true,
    message: text(env.message),
    data: mapAlbumItem(env.data),
  };
}

export async function backendGetAlbumDetail(
  token: string | undefined,
  idAlbum: number,
): Promise<DetailAlbumResponse> {
  const raw = await performRequest(`/api/dokumentasi/${idAlbum}`, token, { method: 'GET' });
  const env = readEnvelope(raw, 'detail album dokumentasi');
  const data = record(env.data);
  const mediaList = Array.isArray(data.media) ? data.media : [];

  return {
    success: true,
    message: text(env.message),
    data: {
      ...mapAlbumItem(data),
      media: mediaList.map(mapMediaItem),
    },
  };
}

export async function backendUpdateAlbum(
  token: string,
  idAlbum: number,
  body: unknown,
): Promise<DetailAlbumResponse> {
  const raw = await performRequest(`/api/dokumentasi/${idAlbum}`, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  const env = readEnvelope(raw, 'perbarui album dokumentasi');
  return {
    success: true,
    message: text(env.message),
    data: {
      ...mapAlbumItem(env.data),
      media: [],
    },
  };
}

export async function backendUpdateAlbumWithCover(
  token: string,
  idAlbum: number,
  formData: FormData,
): Promise<DetailAlbumResponse> {
  formData.set('_method', 'PUT');
  const raw = await performRequest(`/api/dokumentasi/${idAlbum}`, token, {
    method: 'POST',
    body: formData,
  });
  const env = readEnvelope(raw, 'perbarui album dokumentasi');
  const data = record(env.data);
  return {
    success: true,
    message: text(env.message),
    data: {
      ...mapAlbumItem(data),
      media: Array.isArray(data.media) ? data.media.map(mapMediaItem) : [],
    },
  };
}

export async function backendDeleteAlbum(
  token: string,
  idAlbum: number,
): Promise<DeleteResponse> {
  const raw = await performRequest(`/api/dokumentasi/${idAlbum}`, token, {
    method: 'DELETE',
  });
  const env = readEnvelope(raw, 'hapus album dokumentasi');
  return {
    success: true,
    message: text(env.message),
    data: null,
  };
}

export async function backendUploadMedia(
  token: string,
  idAlbum: number,
  formData: FormData,
): Promise<UploadMediaResponse> {
  const raw = await performRequest(`/api/dokumentasi/${idAlbum}/media`, token, {
    method: 'POST',
    body: formData,
  });
  const env = readEnvelope(raw, 'unggah media dokumentasi');
  return {
    success: true,
    message: text(env.message),
    data: mapMediaItem(env.data),
  };
}

export async function backendDeleteMedia(
  token: string,
  idAlbum: number,
  idDokumentasi: number,
): Promise<DeleteResponse> {
  const raw = await performRequest(`/api/dokumentasi/${idAlbum}/media/${idDokumentasi}`, token, {
    method: 'DELETE',
  });
  const env = readEnvelope(raw, 'hapus media dokumentasi');
  return {
    success: true,
    message: text(env.message),
    data: null,
  };
}

