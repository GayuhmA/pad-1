import 'server-only';

import { Agent } from 'undici';
import type {
  CompetitionKind,
  CompetitionStatus,
  LombaCategoryOption,
  ManagementArchivedCompetition,
  ManagementCompetition,
  ManagementLombaMutationResponse,
  ManagementLombaResponse,
  ManagementLombaStatistik,
  RegistrationOpenStatus,
  SaveManagementLombaInput,
} from '@/types/management-lomba';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

const DEFAULT_CATEGORIES: LombaCategoryOption[] = [
  { id_kategori: 1, nama_kategori: 'Dewasa' },
  { id_kategori: 2, nama_kategori: 'Umum' },
  { id_kategori: 3, nama_kategori: 'Anak-anak' },
];

export class ManagementLombaError extends Error {
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
    throw new ManagementLombaError(502, 'Respons layanan lomba tidak valid. Silakan coba lagi.');
  }
  return value as Record<string, unknown>;
}

function optionalRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new ManagementLombaError(502, 'Respons layanan lomba tidak valid. Silakan coba lagi.');
  return value;
}

function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function positiveOrZeroInteger(value: unknown): number {
  if (Number.isSafeInteger(value) && (value as number) >= 0) return value as number;
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const num = Number(value);
    if (Number.isSafeInteger(num) && num >= 0) return num;
  }
  throw new ManagementLombaError(502, 'Respons layanan lomba tidak valid. Silakan coba lagi.');
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
    const result = optionalRecord(body) ?? {};
    const message = typeof result.message === 'string' && result.message.trim()
      ? result.message
      : 'Layanan lomba sedang bermasalah. Silakan coba lagi.';
    const errors = optionalRecord(result.errors) as Record<string, string[]> | undefined;
    throw new ManagementLombaError(response.status, message, errors);
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

function extractList(dataValue: unknown): Record<string, unknown>[] {
  if (Array.isArray(dataValue)) {
    return dataValue.map(optionalRecord).filter((item): item is Record<string, unknown> => item !== null);
  }
  const obj = optionalRecord(dataValue);
  if (obj && Array.isArray(obj.data)) {
    return obj.data.map(optionalRecord).filter((item): item is Record<string, unknown> => item !== null);
  }
  return [];
}

function normalizeCompetitionStatus(raw: unknown): CompetitionStatus {
  if (raw === 'Berlangsung' || raw === 'Mendatang' || raw === 'Selesai') return raw;
  return 'Mendatang';
}

function normalizeOpenStatus(raw: unknown): RegistrationOpenStatus {
  return raw === 'Ditutup' ? 'Ditutup' : 'Dibuka';
}

function normalizeTimeShort(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  const match = raw.trim().match(/^(\d{2}:\d{2})/);
  return match ? match[1] : fallback;
}

function normalizeDateIso(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  const match = raw.trim().match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : fallback;
}

function extractCategoryInfo(
  rawItem: Record<string, unknown>,
  categoryMap: Map<string, number>,
): { id_kategori: number | null; nama_kategori: string } {
  const kategoriField = rawItem.kategori;
  if (typeof kategoriField === 'string' && kategoriField.trim()) {
    const nama = kategoriField.trim();
    const id = positiveOrZeroIntegerOrNull(rawItem.id_kategori) ?? categoryMap.get(nama.toLowerCase()) ?? null;
    return { id_kategori: id, nama_kategori: nama };
  }
  const kategoriObj = optionalRecord(kategoriField);
  if (kategoriObj && typeof kategoriObj.nama_kategori === 'string') {
    const nama = kategoriObj.nama_kategori.trim();
    const id = positiveOrZeroIntegerOrNull(kategoriObj.id_kategori) ?? categoryMap.get(nama.toLowerCase()) ?? null;
    return { id_kategori: id, nama_kategori: nama };
  }
  const fallbackId = positiveOrZeroIntegerOrNull(rawItem.id_kategori);
  return { id_kategori: fallbackId, nama_kategori: 'Umum' };
}

function positiveOrZeroIntegerOrNull(value: unknown): number | null {
  if (Number.isSafeInteger(value) && (value as number) > 0) return value as number;
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const num = Number(value);
    if (Number.isSafeInteger(num) && num > 0) return num;
  }
  return null;
}

function normalizeActiveCompetition(
  item: Record<string, unknown>,
  categoryMap: Map<string, number>,
  kuotaMap: Map<number, Record<string, unknown> | null>,
): ManagementCompetition {
  const idLomba = positiveOrZeroInteger(item.id_lomba);
  const namaLomba = text(item.nama_lomba);
  const jenis: CompetitionKind = item.jenis_pendaftaran === 'Beregu' ? 'Regu' : 'Individu';
  const { id_kategori, nama_kategori } = extractCategoryInfo(item, categoryMap);

  const schedules = Array.isArray(item.jadwal) ? item.jadwal : [];
  const firstSchedule = schedules[0] ? optionalRecord(schedules[0]) : null;

  const date = normalizeDateIso(firstSchedule?.tanggal, '2026-08-17');
  const startTime = normalizeTimeShort(firstSchedule?.waktu_mulai, '08:00');
  const endTime = normalizeTimeShort(firstSchedule?.waktu_selesai, '10:00');
  const location = optionalText(firstSchedule?.lokasi ?? item.lokasi) ?? 'Belum ditentukan';

  const status = normalizeCompetitionStatus(item.status_lomba ?? firstSchedule?.status_jadwal);
  const registrationStatus = normalizeOpenStatus(item.status);
  const description = optionalText(item.deskripsi);
  const teamMemberLimit = positiveOrZeroIntegerOrNull(item.batas_anggota_tim);

  let registered = typeof item.jumlah_pendaftar === 'number' ? item.jumlah_pendaftar : 0;
  let capacity = positiveOrZeroIntegerOrNull(item.kapasitas_peserta);

  const kuota = kuotaMap.get(idLomba);
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
    id_lomba: idLomba,
    id_kategori,
    name: namaLomba,
    kind: jenis,
    category: nama_kategori,
    registrationStatus,
    description,
    date,
    startTime,
    endTime,
    location,
    registered,
    capacity,
    teamMemberLimit,
    status,
    matches: [],
  };
}

function normalizeArchivedCompetition(item: Record<string, unknown>): ManagementArchivedCompetition | null {
  const idLomba = positiveOrZeroIntegerOrNull(item.id_lomba);
  if (!idLomba) return null;
  const namaLomba = optionalText(item.nama_lomba) ?? 'Lomba';
  const jenis: CompetitionKind = item.jenis_pendaftaran === 'Beregu' ? 'Regu' : 'Individu';
  const kategoriObj = optionalRecord(item.kategori);
  const category = optionalText(typeof item.kategori === 'string' ? item.kategori : kategoriObj?.nama_kategori) ?? 'Umum';
  const schedules = Array.isArray(item.jadwal) ? item.jadwal : [];
  const firstSchedule = schedules[0] ? optionalRecord(schedules[0]) : null;
  const location = optionalText(item.lokasi ?? firstSchedule?.lokasi) ?? 'Belum ditentukan';
  const date = firstSchedule?.tanggal ? normalizeDateIso(firstSchedule.tanggal, '') || null : null;
  const participantCount = typeof item.jumlah_pendaftar === 'number' ? item.jumlah_pendaftar : 0;
  const status = normalizeCompetitionStatus(item.status_lomba ?? firstSchedule?.status_jadwal);

  return {
    id: String(idLomba),
    id_lomba: idLomba,
    name: namaLomba,
    kind: jenis,
    category,
    participantCount,
    location,
    date,
    status,
  };
}

function buildCategories(publicLombaList: Record<string, unknown>[]): {
  categories: LombaCategoryOption[];
  categoryMap: Map<string, number>;
} {
  const byId = new Map<number, string>();
  for (const cat of DEFAULT_CATEGORIES) {
    byId.set(cat.id_kategori, cat.nama_kategori);
  }
  for (const item of publicLombaList) {
    const katObj = optionalRecord(item.kategori);
    const id = positiveOrZeroIntegerOrNull(katObj?.id_kategori);
    const nama = optionalText(katObj?.nama_kategori);
    if (id && nama) byId.set(id, nama);
  }

  const categories = [...byId.entries()]
    .map(([id_kategori, nama_kategori]) => ({ id_kategori, nama_kategori }))
    .sort((a, b) => a.id_kategori - b.id_kategori);
  const categoryMap = new Map(categories.map((cat) => [cat.nama_kategori.toLowerCase(), cat.id_kategori]));
  return { categories, categoryMap };
}

/** Fetches active and archived competitions along with category options and stats. */
export async function backendManagementLomba(
  token: string,
  role?: 'panitia' | 'admin' | string,
): Promise<ManagementLombaResponse> {
  const [manageRes, arsipRes, publicRes] = await Promise.all([
    performRequest('/api/lomba/manage', token).catch(() => null),
    performRequest('/api/lomba/manage/arsip', token).catch(() => null),
    performRequest('/api/lomba', token).catch(() => null),
  ]);

  if (!manageRes && !publicRes) {
    throw new ManagementLombaError(503, 'Layanan kelola lomba sedang bermasalah. Silakan coba lagi.');
  }

  const publicItems = publicRes ? extractList(readEnvelope(publicRes, 'daftar lomba').data) : [];
  const { categories, categoryMap } = buildCategories(publicItems);

  const manageEnv = manageRes ? readEnvelope(manageRes, 'daftar lomba manajemen') : null;
  const activeRawItems = manageEnv ? extractList(manageEnv.data) : publicItems;

  // Fetch per-competition kuota only for Beregu (to get team count) or when fallback publicRes is used
  const kuotaPromises = activeRawItems.map(async (item) => {
    const id = positiveOrZeroInteger(item.id_lomba);
    if (manageEnv && item.jenis_pendaftaran !== 'Beregu') {
      return { id, data: null };
    }
    const primaryEndpoint = role === 'admin' ? `/api/admin/lomba/${id}/kuota` : `/api/panitia/lomba/${id}/kuota`;
    const fallbackEndpoint = role === 'admin' ? `/api/panitia/lomba/${id}/kuota` : `/api/admin/lomba/${id}/kuota`;
    try {
      const resp = await performRequest(primaryEndpoint, token);
      return { id, data: optionalRecord(record(resp).data) };
    } catch {
      try {
        const fallbackResp = await performRequest(fallbackEndpoint, token);
        return { id, data: optionalRecord(record(fallbackResp).data) };
      } catch {
        return { id, data: null };
      }
    }
  });

  const kuotaResults = await Promise.all(kuotaPromises);
  const kuotaMap = new Map<number, Record<string, unknown> | null>();
  for (const res of kuotaResults) {
    kuotaMap.set(res.id, res.data);
  }

  const competitions = activeRawItems.map((item) => normalizeActiveCompetition(item, categoryMap, kuotaMap));

  const archived: ManagementArchivedCompetition[] = [];
  if (arsipRes) {
    const arsipEnv = readEnvelope(arsipRes, 'daftar arsip lomba');
    for (const rawArsip of extractList(arsipEnv.data)) {
      const normalized = normalizeArchivedCompetition(rawArsip);
      if (normalized) archived.push(normalized);
    }
  }

  const rawStats = optionalRecord(manageEnv?.statistik);
  const statistik: ManagementLombaStatistik = {
    total_lomba: typeof rawStats?.total_lomba === 'number' ? rawStats.total_lomba : competitions.length,
    lomba_berlangsung: typeof rawStats?.lomba_berlangsung === 'number'
      ? rawStats.lomba_berlangsung
      : competitions.filter((item) => item.status === 'Berlangsung').length,
    lomba_mendatang: typeof rawStats?.lomba_mendatang === 'number'
      ? rawStats.lomba_mendatang
      : competitions.filter((item) => item.status === 'Mendatang').length,
    lomba_selesai: typeof rawStats?.lomba_selesai === 'number'
      ? rawStats.lomba_selesai
      : competitions.filter((item) => item.status === 'Selesai').length,
  };

  return {
    success: true,
    message: 'Data kelola lomba berhasil diambil.',
    data: { competitions, archived, categories, statistik },
  };
}

function buildSaveMutationResponse(
  env: Record<string, unknown>,
  fallbackMessage: string,
): ManagementLombaMutationResponse {
  const dataObj = optionalRecord(env.data);
  const rawStatus = dataObj?.status;
  const returnedStatus =
    rawStatus === 'Dibuka' || rawStatus === 'Ditutup' ? rawStatus : undefined;

  return {
    success: true,
    message: optionalText(env.message) ?? fallbackMessage,
    ...(returnedStatus ? { data: { status: returnedStatus } } : {}),
  };
}

export async function backendCreateLomba(
  token: string,
  input: SaveManagementLombaInput,
): Promise<ManagementLombaMutationResponse> {
  const raw = await performRequest('/api/lomba/manage', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const env = readEnvelope(raw, 'tambah lomba');
  return buildSaveMutationResponse(env, 'Lomba berhasil ditambahkan.');
}

export async function backendUpdateLomba(
  token: string,
  idLomba: number,
  input: SaveManagementLombaInput,
): Promise<ManagementLombaMutationResponse> {
  const raw = await performRequest(`/api/lomba/manage/${idLomba}`, token, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  const env = readEnvelope(raw, 'ubah lomba');
  return buildSaveMutationResponse(env, 'Lomba berhasil diperbarui.');
}

export async function backendDeleteLomba(
  token: string,
  idLomba: number,
): Promise<ManagementLombaMutationResponse> {
  const raw = await performRequest(`/api/lomba/manage/${idLomba}`, token, {
    method: 'DELETE',
  });
  const env = readEnvelope(raw, 'hapus lomba');
  return {
    success: true,
    message: optionalText(env.message) ?? 'Lomba berhasil dihapus.',
  };
}

export async function backendArchiveLomba(
  token: string,
  idLomba: number,
): Promise<ManagementLombaMutationResponse> {
  const raw = await performRequest(`/api/lomba/manage/${idLomba}/arsip`, token, {
    method: 'PATCH',
  });
  const env = readEnvelope(raw, 'arsipkan lomba');
  return {
    success: true,
    message: optionalText(env.message) ?? 'Lomba berhasil diarsipkan.',
  };
}

export async function backendRestoreLomba(
  token: string,
  idLomba: number,
): Promise<ManagementLombaMutationResponse> {
  const raw = await performRequest(`/api/lomba/manage/${idLomba}/pulihkan`, token, {
    method: 'PATCH',
  });
  const env = readEnvelope(raw, 'pulihkan lomba');
  return {
    success: true,
    message: optionalText(env.message) ?? 'Lomba berhasil dipulihkan.',
  };
}
