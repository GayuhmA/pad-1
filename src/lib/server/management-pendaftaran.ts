import 'server-only';

import { Agent } from 'undici';
import type {
  LombaQuotaItem,
  ManagementPendaftaranResponse,
  RegistrationItem,
  RegistrationStatus,
  UpdateRegistrationStatusInput,
  UpdateRegistrationStatusResponse,
} from '@/types/management-pendaftaran';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class ManagementPendaftaranError extends Error {
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
    throw new ManagementPendaftaranError(502, 'Respons layanan pendaftaran tidak valid. Silakan coba lagi.');
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new ManagementPendaftaranError(502, 'Respons layanan pendaftaran tidak valid. Silakan coba lagi.');
  return value;
}

function positiveOrZeroInteger(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new ManagementPendaftaranError(502, 'Respons layanan pendaftaran tidak valid. Silakan coba lagi.');
  }
  return value as number;
}

function apiBase(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new ManagementPendaftaranError(503, 'Layanan pendaftaran belum dikonfigurasi.');
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
      signal: AbortSignal.timeout(15_000),
      dispatcher: backendDispatcher,
    } as RequestInit & { dispatcher: Agent });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    console.warn('[management-pendaftaran/backend] connection failed', {
      endpoint: endpoint.replace(/\/\d+/g, '/:id'),
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new ManagementPendaftaranError(503, 'Layanan pendaftaran belum dapat dihubungi. Silakan coba lagi.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ManagementPendaftaranError(502, 'Respons layanan pendaftaran tidak valid. Silakan coba lagi.');
  }

  if (!response.ok) {
    const result = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown> : {};
    const message = typeof result.message === 'string' ? result.message : 'Layanan pendaftaran sedang bermasalah. Silakan coba lagi.';
    const errors = result.errors && typeof result.errors === 'object' && !Array.isArray(result.errors)
      ? result.errors as Record<string, string[]> : undefined;
    throw new ManagementPendaftaranError(response.status, message, errors);
  }
  return body;
}

function readEnvelope(value: unknown, label: string): Record<string, unknown> {
  const result = record(value);
  if (result.success !== true) {
    throw new ManagementPendaftaranError(502, `Respons ${label} tidak valid. Silakan coba lagi.`);
  }
  return result;
}

export async function backendGetManagementPendaftaran(
  token: string,
  role?: 'panitia' | 'admin' | string,
  options?: { status?: string; search?: string },
): Promise<ManagementPendaftaranResponse> {
  const params = new URLSearchParams();
  if (options?.status && ['Menunggu', 'Diterima', 'Ditolak', 'Dibatalkan'].includes(options.status)) {
    params.set('status', options.status);
  }
  if (options?.search?.trim()) {
    params.set('search', options.search.trim());
  }
  const query = params.toString() ? `?${params.toString()}` : '';

  const primaryEndpoint = role === 'admin' ? `/api/admin/pendaftaran${query}` : `/api/panitia/pendaftaran${query}`;
  const fallbackEndpoint = role === 'admin' ? `/api/panitia/pendaftaran${query}` : `/api/admin/pendaftaran${query}`;

  let pendaftaranRaw: unknown;
  try {
    pendaftaranRaw = await performRequest(primaryEndpoint, token);
  } catch (err) {
    if (err instanceof ManagementPendaftaranError && (err.status === 403 || err.status === 404)) {
      try {
        pendaftaranRaw = await performRequest(fallbackEndpoint, token);
      } catch {
        throw err;
      }
    } else {
      throw err;
    }
  }

  const pendaftaranEnv = readEnvelope(pendaftaranRaw, 'daftar pendaftaran');
  const paginatedData = record(pendaftaranEnv.data);
  const items = Array.isArray(paginatedData.data)
    ? paginatedData.data
    : Array.isArray(pendaftaranEnv.data)
      ? pendaftaranEnv.data
      : [];

  const registrations: RegistrationItem[] = items.map((raw) => {
    const item = record(raw);
    const idPendaftaran = positiveOrZeroInteger(item.id_pendaftaran);
    const warga = item.warga ? record(item.warga) : null;
    const lomba = item.lomba ? record(item.lomba) : null;

    const peserta = warga && typeof warga.nama === 'string' ? warga.nama : 'Peserta';
    const noTelp = warga && typeof warga.no_hp === 'string' ? warga.no_hp : '-';
    const namaLomba = lomba && typeof lomba.nama_lomba === 'string' ? lomba.nama_lomba : 'Lomba';
    const jenis = lomba && lomba.jenis_pendaftaran === 'Beregu' ? ('Regu' as const) : ('Individu' as const);
    const namaTim = typeof item.nama_tim === 'string' && item.nama_tim ? item.nama_tim : null;

    let tanggalDaftar = '2026-08-15';
    if (typeof item.tanggal_daftar === 'string' && item.tanggal_daftar.length >= 10) {
      tanggalDaftar = item.tanggal_daftar.slice(0, 10);
    } else if (typeof item.created_at === 'string' && item.created_at.length >= 10) {
      tanggalDaftar = item.created_at.slice(0, 10);
    }

    let status: RegistrationStatus = 'Menunggu';
    if (item.status === 'Diterima' || item.status === 'Ditolak' || item.status === 'Dibatalkan') {
      status = item.status;
    }

    return {
      id: String(idPendaftaran),
      peserta,
      jenis,
      nama_tim: namaTim,
      lomba: namaLomba,
      no_telp: noTelp,
      tanggal_daftar: tanggalDaftar,
      status,
    };
  });

  // Fetch lomba and kuota for the quota section in parallel
  const quotas: LombaQuotaItem[] = [];
  try {
    const lombaEnv = readEnvelope(await performRequest('/api/lomba', token), 'daftar lomba');
    const lombaList = Array.isArray(lombaEnv.data) ? lombaEnv.data : [];

    const quotaPromises = lombaList.map(async (rawLomba) => {
      const l = record(rawLomba);
      const id = positiveOrZeroInteger(l.id_lomba);
      const nama = text(l.nama_lomba);
      const isRegu = l.jenis_pendaftaran === 'Beregu';
      const jenisLabel = isRegu ? ('regu' as const) : ('peserta' as const);

      const kuotaEndpoint = role === 'admin' ? `/api/admin/lomba/${id}/kuota` : `/api/panitia/lomba/${id}/kuota`;
      const fallbackKuota = role === 'admin' ? `/api/panitia/lomba/${id}/kuota` : `/api/admin/lomba/${id}/kuota`;

      let terdaftar = 0;
      let kapasitas = typeof l.kapasitas_peserta === 'number' && l.kapasitas_peserta > 0
        ? l.kapasitas_peserta
        : isRegu ? 8 : 12;

      try {
        let kData: unknown;
        try {
          kData = await performRequest(kuotaEndpoint, token);
        } catch {
          kData = await performRequest(fallbackKuota, token);
        }
        const kObj = record(record(kData).data);
        if (isRegu) {
          if (typeof kObj.jumlah_tim === 'number') terdaftar = kObj.jumlah_tim;
          if (typeof kObj.kapasitas_tim === 'number' && kObj.kapasitas_tim > 0) kapasitas = kObj.kapasitas_tim;
        } else {
          if (typeof kObj.jumlah_peserta === 'number') terdaftar = kObj.jumlah_peserta;
          if (typeof kObj.kapasitas_peserta === 'number' && kObj.kapasitas_peserta > 0) kapasitas = kObj.kapasitas_peserta;
        }
      } catch {
        // Use default count if kuota call fails
      }

      return {
        id: String(id),
        nama,
        terdaftar,
        kapasitas,
        jenis: jenisLabel,
      };
    });

    const resolvedQuotas = await Promise.all(quotaPromises);
    quotas.push(...resolvedQuotas);
  } catch {
    // If lomba call fails, quotas remains empty
  }

  const metrics = {
    total: registrations.length,
    menunggu: registrations.filter((r) => r.status === 'Menunggu').length,
    diterima: registrations.filter((r) => r.status === 'Diterima').length,
    ditolak: registrations.filter((r) => r.status === 'Ditolak').length,
    dibatalkan: registrations.filter((r) => r.status === 'Dibatalkan').length,
  };

  return {
    success: true,
    message: 'Data pendaftaran berhasil diambil.',
    data: {
      registrations,
      quotas,
      metrics,
    },
  };
}

export async function backendUpdateStatusPendaftaran(
  token: string,
  role: 'panitia' | 'admin' | string | undefined,
  idPendaftaran: number,
  input: UpdateRegistrationStatusInput,
): Promise<UpdateRegistrationStatusResponse> {
  const primaryEndpoint = role === 'admin'
    ? `/api/admin/pendaftaran/${idPendaftaran}/status`
    : `/api/panitia/pendaftaran/${idPendaftaran}/status`;
  const fallbackEndpoint = role === 'admin'
    ? `/api/panitia/pendaftaran/${idPendaftaran}/status`
    : `/api/admin/pendaftaran/${idPendaftaran}/status`;

  let responseRaw: unknown;
  try {
    responseRaw = await performRequest(primaryEndpoint, token, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  } catch (err) {
    if (err instanceof ManagementPendaftaranError && (err.status === 403 || err.status === 404)) {
      try {
        responseRaw = await performRequest(fallbackEndpoint, token, {
          method: 'PATCH',
          body: JSON.stringify(input),
        });
      } catch {
        throw err;
      }
    } else {
      throw err;
    }
  }

  const envelope = readEnvelope(responseRaw, 'status pendaftaran');
  const data = record(envelope.data);
  return {
    success: true,
    message: text(envelope.message),
    data: {
      id_pendaftaran: positiveOrZeroInteger(data.id_pendaftaran),
      status: (data.status === 'Ditolak' ? 'Ditolak' : 'Diterima') as RegistrationStatus,
    },
  };
}

