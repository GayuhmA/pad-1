import 'server-only';

import { Agent } from 'undici';
import type {
  CompetitionKind,
  CompetitionStatus,
  ManagementArchivedCompetition,
  ManagementCompetition,
  ManagementLombaResponse,
} from '@/types/management-lomba';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class ManagementLombaError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ManagementLombaError(502, 'Respons layanan lomba tidak valid. Silakan coba lagi.');
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new ManagementLombaError(502, 'Respons layanan lomba tidak valid. Silakan coba lagi.');
  return value;
}

function nullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return text(value);
}

function positiveOrZeroInteger(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new ManagementLombaError(502, 'Respons layanan lomba tidak valid. Silakan coba lagi.');
  }
  return value as number;
}

function apiBase(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new ManagementLombaError(503, 'Layanan lomba belum dikonfigurasi.');
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
    console.warn('[management-lomba/backend] connection failed', {
      endpoint: endpoint.replace(/\/\d+/g, '/:id'),
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new ManagementLombaError(503, 'Layanan lomba belum dapat dihubungi. Silakan coba lagi.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ManagementLombaError(502, 'Respons layanan lomba tidak valid. Silakan coba lagi.');
  }

  if (!response.ok) {
    const result = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown> : {};
    const message = typeof result.message === 'string' ? result.message : 'Layanan lomba sedang bermasalah. Silakan coba lagi.';
    throw new ManagementLombaError(response.status, message);
  }
  return body;
}

function readEnvelope(value: unknown, label: string): Record<string, unknown> {
  const result = record(value);
  if (result.success !== true) {
    throw new ManagementLombaError(502, `Respons ${label} tidak valid. Silakan coba lagi.`);
  }
  return result;
}

export async function backendManagementLomba(
  token: string,
  role?: 'panitia' | 'admin' | string,
): Promise<ManagementLombaResponse> {
  const lombaResponse = readEnvelope(await performRequest('/api/lomba', token), 'daftar lomba');
  const rawList = lombaResponse.data;
  if (!Array.isArray(rawList)) {
    throw new ManagementLombaError(502, 'Respons daftar lomba tidak valid. Silakan coba lagi.');
  }

  // Fetch kuota for each competition in parallel
  const kuotaPromises = rawList.map(async (rawItem) => {
    const item = record(rawItem);
    const id = positiveOrZeroInteger(item.id_lomba);
    const primaryEndpoint = role === 'admin' ? `/api/admin/lomba/${id}/kuota` : `/api/panitia/lomba/${id}/kuota`;
    const fallbackEndpoint = role === 'admin' ? `/api/panitia/lomba/${id}/kuota` : `/api/admin/lomba/${id}/kuota`;
    try {
      const resp = await performRequest(primaryEndpoint, token);
      return { id, data: record(resp).data as Record<string, unknown> };
    } catch {
      try {
        const fallbackResp = await performRequest(fallbackEndpoint, token);
        return { id, data: record(fallbackResp).data as Record<string, unknown> };
      } catch {
        return { id, data: null };
      }
    }
  });

  // Fetch history/archive in parallel
  const historyPromise = performRequest('/api/histori', token).then((res) => {
    const data = record(res).data;
    return Array.isArray(data) ? data : [];
  }).catch(() => []);

  const [kuotaResults, historyList] = await Promise.all([
    Promise.all(kuotaPromises),
    historyPromise,
  ]);

  const kuotaMap = new Map<number, Record<string, unknown> | null>();
  for (const res of kuotaResults) {
    kuotaMap.set(res.id, res.data);
  }

  const competitions: ManagementCompetition[] = rawList.map((rawItem) => {
    const item = record(rawItem);
    const idLomba = positiveOrZeroInteger(item.id_lomba);
    const namaLomba = text(item.nama_lomba);
    const jenis = item.jenis_pendaftaran === 'Beregu' ? ('Regu' as CompetitionKind) : ('Individu' as CompetitionKind);
    const kategoriObj = item.kategori ? record(item.kategori) : null;
    const category = kategoriObj && typeof kategoriObj.nama_kategori === 'string'
      ? kategoriObj.nama_kategori
      : 'Umum';

    const schedules = Array.isArray(item.jadwal) ? item.jadwal : [];
    const firstSchedule = schedules[0] ? record(schedules[0]) : null;

    const date = firstSchedule?.tanggal && typeof firstSchedule.tanggal === 'string'
      ? firstSchedule.tanggal
      : '2026-08-17';
    const startTime = firstSchedule?.waktu_mulai && typeof firstSchedule.waktu_mulai === 'string'
      ? firstSchedule.waktu_mulai.slice(0, 5)
      : '08:00';
    const endTime = firstSchedule?.waktu_selesai && typeof firstSchedule.waktu_selesai === 'string'
      ? firstSchedule.waktu_selesai.slice(0, 5)
      : '10:00';
    const location = firstSchedule?.lokasi && typeof firstSchedule.lokasi === 'string'
      ? firstSchedule.lokasi
      : 'Belum ditentukan';

    const scheduleStatus = firstSchedule?.status_jadwal;
    const status: CompetitionStatus = scheduleStatus === 'Berlangsung'
      ? 'Berlangsung'
      : scheduleStatus === 'Selesai'
        ? 'Selesai'
        : 'Mendatang';

    const kuota = kuotaMap.get(idLomba);
    let registered = 0;
    let capacity = typeof item.kapasitas_peserta === 'number' && item.kapasitas_peserta > 0
      ? item.kapasitas_peserta
      : jenis === 'Regu' ? 8 : 12;

    if (kuota) {
      if (jenis === 'Regu') {
        if (typeof kuota.jumlah_tim === 'number') registered = kuota.jumlah_tim;
        if (typeof kuota.kapasitas_tim === 'number' && kuota.kapasitas_tim > 0) capacity = kuota.kapasitas_tim;
      } else {
        if (typeof kuota.jumlah_peserta === 'number') registered = kuota.jumlah_peserta;
        if (typeof kuota.kapasitas_peserta === 'number' && kuota.kapasitas_peserta > 0) capacity = kuota.kapasitas_peserta;
      }
    }

    return {
      id: String(idLomba),
      name: namaLomba,
      kind: jenis,
      category,
      date,
      startTime,
      endTime,
      location,
      registered,
      capacity,
      status,
      matches: [],
    };
  });

  const archived: ManagementArchivedCompetition[] = [];
  if (Array.isArray(historyList)) {
    for (const h of historyList) {
      const hObj = record(h);
      if (hObj.status === 'Selesai' || hObj.status === 'Arsip') {
        archived.push({
          id: `archive-${hObj.id_periode}`,
          name: typeof hObj.nama_kegiatan === 'string' ? hObj.nama_kegiatan : (typeof hObj.judul === 'string' ? hObj.judul : 'Kegiatan'),
          category: 'Umum',
          participantCount: typeof hObj.jumlah_lomba === 'number' ? hObj.jumlah_lomba : 0,
          location: 'Balai Warga',
        });
      }
    }
  }

  return {
    success: true,
    message: 'Data kelola lomba berhasil diambil.',
    data: {
      competitions,
      archived,
    },
  };
}

