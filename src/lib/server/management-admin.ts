import 'server-only';

import { Agent } from 'undici';
import type {
  AccountStatus,
  AkunItem,
  AkunMetrics,
  CreatedAccountInfo,
  CreateRtInput,
  CreateRwInput,
  CreateWargaInput,
  CreateWargaResponse,
  GenderCode,
  GenericAdminMutationResponse,
  ManagementAkunResponse,
  ManagementRtRwResponse,
  ManagementWargaResponse,
  RoleOption,
  RtItem,
  RwItem,
  UpdateAkunRoleInput,
  UpdateAkunStatusInput,
  UpdateRtInput,
  UpdateRwInput,
  UpdateWargaInput,
  UpdateWargaResponse,
  WargaItem,
  WargaMetrics,
} from '@/types/management-admin';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class ManagementAdminError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

function apiBase(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new ManagementAdminError(503, 'Layanan manajemen admin belum dikonfigurasi.');
  return base.replace(/\/$/, '');
}

function record(value: unknown, label = 'data'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ManagementAdminError(502, `Respons ${label} tidak valid. Silakan coba lagi.`);
  }
  return value as Record<string, unknown>;
}

function optionalRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function optionalText(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function positiveId(value: unknown): number | null {
  if (Number.isSafeInteger(value) && (value as number) > 0) return value as number;
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function optionalCount(value: unknown): number | null {
  if (Number.isSafeInteger(value) && (value as number) >= 0) return value as number;
  return null;
}

function normalizeStatus(value: unknown): AccountStatus {
  if (typeof value === 'string' && value.trim().toLocaleLowerCase('id-ID') === 'nonaktif') {
    return 'Nonaktif';
  }
  return 'Aktif';
}

function normalizeGender(value: unknown): GenderCode {
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    if (normalized === 'P' || normalized.startsWith('PEREMPUAN')) return 'P';
  }
  return 'L';
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : trimmed;
}

function readEnvelope(value: unknown, label: string): Record<string, unknown> {
  const result = record(value, label);
  if (result.success !== true) {
    throw new ManagementAdminError(502, `Respons ${label} tidak valid. Silakan coba lagi.`);
  }
  return result;
}

function extractList(dataValue: unknown): Record<string, unknown>[] {
  if (Array.isArray(dataValue)) {
    return dataValue.map((item) => optionalRecord(item)).filter((item): item is Record<string, unknown> => item !== null);
  }
  const obj = optionalRecord(dataValue);
  if (!obj) return [];
  const candidates = [obj.data, obj.items, obj.warga, obj.akun, obj.rt, obj.rw];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => optionalRecord(item))
        .filter((item): item is Record<string, unknown> => item !== null);
    }
  }
  return [];
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
    console.warn('[management-admin/backend] connection failed', {
      endpoint: endpoint.replace(/\/\d+/g, '/:id'),
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new ManagementAdminError(503, 'Layanan admin belum dapat dihubungi. Silakan coba lagi.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ManagementAdminError(502, 'Respons layanan admin tidak valid. Silakan coba lagi.');
  }

  if (!response.ok) {
    const result = optionalRecord(body) ?? {};
    const defaultMessages: Record<number, string> = {
      401: 'Sesi telah berakhir. Silakan masuk kembali.',
      403: 'Hanya Admin yang memiliki akses ke halaman ini.',
      404: 'Data tidak ditemukan.',
      409: 'Data tidak dapat dihapus karena masih memiliki relasi terkait.',
      422: 'Data yang dikirim tidak valid. Periksa kembali isian Anda.',
    };
    const message = typeof result.message === 'string' && result.message.trim()
      ? result.message
      : defaultMessages[response.status] ?? 'Layanan admin sedang bermasalah. Silakan coba lagi.';
    const errors = optionalRecord(result.errors) as Record<string, string[]> | undefined;
    throw new ManagementAdminError(response.status, message, errors);
  }

  return body;
}

function normalizeRwItem(raw: Record<string, unknown>): RwItem | null {
  const id = positiveId(raw.id_rw ?? raw.id);
  if (!id) return null;
  const nomorRw = optionalText(raw.nomor_rw) ?? String(id).padStart(3, '0');
  const namaRw = optionalText(raw.nama_rw) ?? `RW ${nomorRw}`;
  const namaKetua = optionalText(raw.nama_ketua);
  const nomorWhatsapp = optionalText(raw.nomor_whatsapp);
  const jumlahRt = optionalCount(raw.jumlah_rt ?? raw.rt_count);
  return {
    id_rw: id,
    nomor_rw: nomorRw,
    nama_rw: namaRw,
    nama_ketua: namaKetua,
    nomor_whatsapp: nomorWhatsapp,
    jumlah_rt: jumlahRt,
  };
}

function normalizeRtItem(raw: Record<string, unknown>, rwMap: Map<number, RwItem>): RtItem | null {
  const id = positiveId(raw.id_rt ?? raw.id);
  if (!id) return null;
  const rwObj = optionalRecord(raw.rw);
  const idRw = positiveId(raw.id_rw ?? rwObj?.id_rw ?? rwObj?.id) ?? 0;
  const linkedRw = rwMap.get(idRw);
  const nomorRt = optionalText(raw.nomor_rt) ?? String(id).padStart(3, '0');
  const namaRt = optionalText(raw.nama_rt) ?? `RT ${nomorRt}`;
  const namaKetua = optionalText(raw.nama_ketua);
  const nomorWhatsapp = optionalText(raw.nomor_whatsapp);
  const nomorRw = optionalText(rwObj?.nomor_rw ?? raw.nomor_rw) ?? linkedRw?.nomor_rw ?? null;
  const namaRw = optionalText(rwObj?.nama_rw ?? raw.nama_rw) ?? linkedRw?.nama_rw ?? null;
  const jumlahWarga = optionalCount(raw.jumlah_warga ?? raw.warga_count);
  return {
    id_rt: id,
    id_rw: idRw,
    nomor_rt: nomorRt,
    nama_rt: namaRt,
    nama_ketua: namaKetua,
    nomor_whatsapp: nomorWhatsapp,
    nomor_rw: nomorRw,
    nama_rw: namaRw,
    jumlah_warga: jumlahWarga,
  };
}

function normalizeWargaItem(raw: Record<string, unknown>, rtMap: Map<number, RtItem>): WargaItem | null {
  const id = positiveId(raw.id_warga ?? raw.id);
  if (!id) return null;

  const rtObj = optionalRecord(raw.rt);
  const rwObj = optionalRecord(raw.rw ?? rtObj?.rw);
  const idRt = positiveId(raw.id_rt ?? rtObj?.id_rt ?? rtObj?.id);
  const linkedRt = idRt ? rtMap.get(idRt) : undefined;

  const akunObj = optionalRecord(raw.akun ?? raw.user);
  const roleObj = optionalRecord(akunObj?.role ?? raw.role);

  return {
    id_warga: id,
    id_rt: idRt,
    nik: optionalText(raw.nik) ?? '-',
    nama: optionalText(raw.nama) ?? 'Tanpa Nama',
    jenis_kelamin: normalizeGender(raw.jenis_kelamin),
    tempat_lahir: optionalText(raw.tempat_lahir),
    tanggal_lahir: normalizeDate(raw.tanggal_lahir),
    no_hp: optionalText(raw.no_hp ?? raw.telepon),
    alamat: optionalText(raw.alamat),
    status: normalizeStatus(raw.status),
    nomor_rt: optionalText(rtObj?.nomor_rt ?? raw.nomor_rt) ?? linkedRt?.nomor_rt ?? null,
    nama_rt: optionalText(rtObj?.nama_rt ?? raw.nama_rt) ?? linkedRt?.nama_rt ?? null,
    nomor_rw: optionalText(rwObj?.nomor_rw ?? raw.nomor_rw) ?? linkedRt?.nomor_rw ?? null,
    nama_rw: optionalText(rwObj?.nama_rw ?? raw.nama_rw) ?? linkedRt?.nama_rw ?? null,
    id_akun: positiveId(akunObj?.id_akun ?? raw.id_akun),
    username: optionalText(akunObj?.username ?? raw.username),
    role_name: optionalText(roleObj?.nama_role ?? akunObj?.role ?? raw.nama_role),
  };
}

function normalizeAkunItem(raw: Record<string, unknown>): AkunItem | null {
  const id = positiveId(raw.id_akun ?? raw.id);
  if (!id) return null;

  const wargaObj = optionalRecord(raw.warga);
  const roleObj = optionalRecord(raw.role);
  const rtObj = optionalRecord(wargaObj?.rt ?? raw.rt);
  const rwObj = optionalRecord(rtObj?.rw ?? wargaObj?.rw ?? raw.rw);

  const rawRoleName = optionalText(roleObj?.nama_role ?? (typeof raw.role === 'string' ? raw.role : null) ?? raw.nama_role) ?? 'Warga';
  const rawRoleId = positiveId(roleObj?.id_role ?? raw.id_role);
  const defaultRoleId = rawRoleName.toLowerCase().includes('admin') ? 1
    : rawRoleName.toLowerCase().includes('panitia') ? 2 : 3;

  const nomorRt = optionalText(rtObj?.nomor_rt);
  const nomorRw = optionalText(rwObj?.nomor_rw);
  const wilayah = nomorRt
    ? `RT ${nomorRt}${nomorRw ? ` / RW ${nomorRw}` : ''}`
    : null;

  return {
    id_akun: id,
    username: optionalText(raw.username) ?? `akun-${id}`,
    nama: optionalText(wargaObj?.nama ?? raw.nama) ?? optionalText(raw.username) ?? `Akun #${id}`,
    nik: optionalText(wargaObj?.nik ?? raw.nik),
    no_hp: optionalText(wargaObj?.no_hp ?? raw.no_hp),
    id_role: rawRoleId ?? defaultRoleId,
    nama_role: rawRoleName,
    status: normalizeStatus(raw.status),
    wilayah,
  };
}

function buildRoleOptions(akunList: AkunItem[]): RoleOption[] {
  const byName = new Map<'Admin' | 'Panitia' | 'Warga', number>([
    ['Admin', 1],
    ['Panitia', 2],
    ['Warga', 3],
  ]);
  for (const akun of akunList) {
    const lower = akun.nama_role.toLowerCase();
    if (lower.includes('admin')) byName.set('Admin', akun.id_role);
    else if (lower.includes('panitia')) byName.set('Panitia', akun.id_role);
    else if (lower.includes('warga')) byName.set('Warga', akun.id_role);
  }
  return [
    { id_role: byName.get('Warga') ?? 3, nama_role: 'Warga' },
    { id_role: byName.get('Panitia') ?? 2, nama_role: 'Panitia' },
    { id_role: byName.get('Admin') ?? 1, nama_role: 'Admin' },
  ];
}

function buildRtRwData(rwRaw: unknown, rtRaw: unknown): { rwList: RwItem[]; rtList: RtItem[]; rtMap: Map<number, RtItem> } {
  const rwEnv = readEnvelope(rwRaw, 'daftar RW');
  const rwList = extractList(rwEnv.data).map(normalizeRwItem).filter((item): item is RwItem => item !== null);
  const rwMap = new Map(rwList.map((rw) => [rw.id_rw, rw]));

  const rtEnv = readEnvelope(rtRaw, 'daftar RT');
  const rtList = extractList(rtEnv.data).map((item) => normalizeRtItem(item, rwMap)).filter((item): item is RtItem => item !== null);
  const rtMap = new Map(rtList.map((rt) => [rt.id_rt, rt]));

  return { rwList, rtList, rtMap };
}

/** Fetches citizen directory alongside RT and RW reference options for Admin management. */
export async function backendGetAdminWarga(
  token: string,
  filters?: { search?: string; id_rt?: number; status?: AccountStatus },
): Promise<ManagementWargaResponse> {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.set('search', filters.search.trim());
  if (filters?.id_rt && Number.isSafeInteger(filters.id_rt) && filters.id_rt > 0) {
    params.set('id_rt', String(filters.id_rt));
  }
  if (filters?.status === 'Aktif' || filters?.status === 'Nonaktif') {
    params.set('status', filters.status);
  }
  const query = params.toString() ? `?${params.toString()}` : '';

  const [wargaRaw, rtRaw, rwRaw] = await Promise.all([
    performRequest(`/api/admin/warga${query}`, token),
    performRequest('/api/admin/rt', token).catch(() => ({ success: true, data: [] })),
    performRequest('/api/admin/rw', token).catch(() => ({ success: true, data: [] })),
  ]);

  const { rwList, rtList, rtMap } = buildRtRwData(rwRaw, rtRaw);
  const wargaEnv = readEnvelope(wargaRaw, 'daftar warga');
  const warga = extractList(wargaEnv.data)
    .map((item) => normalizeWargaItem(item, rtMap))
    .filter((item): item is WargaItem => item !== null);

  const aktifCount = warga.filter((item) => item.status === 'Aktif').length;
  const nonaktifCount = warga.filter((item) => item.status === 'Nonaktif').length;
  const metrics: WargaMetrics = {
    totalWarga: warga.length,
    aktifCount,
    nonaktifCount,
    totalRt: rtList.length,
  };

  return {
    success: true,
    message: optionalText(wargaEnv.message) ?? 'Daftar warga berhasil ditampilkan.',
    data: { warga, rtList, rwList, metrics },
  };
}

export async function backendGetAdminRtRw(token: string): Promise<ManagementRtRwResponse> {
  const [rtRaw, rwRaw] = await Promise.all([
    performRequest('/api/admin/rt', token),
    performRequest('/api/admin/rw', token),
  ]);
  const { rwList, rtList } = buildRtRwData(rwRaw, rtRaw);
  return {
    success: true,
    message: 'Daftar RT dan RW berhasil diambil.',
    data: { rtList, rwList },
  };
}

export async function backendCreateWarga(
  token: string,
  input: CreateWargaInput,
): Promise<CreateWargaResponse> {
  const raw = await performRequest('/api/admin/warga', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const env = readEnvelope(raw, 'tambah warga');
  const dataObj = optionalRecord(env.data);

  const wargaSource = optionalRecord(dataObj?.warga) ?? (dataObj && (dataObj.id_warga || dataObj.nik) ? dataObj : null);
  const warga = wargaSource ? normalizeWargaItem(wargaSource, new Map()) : null;

  const akunSource = optionalRecord(dataObj?.akun ?? dataObj?.account) ?? dataObj;
  const username = optionalText(akunSource?.username ?? dataObj?.username);
  const passwordAwal = optionalText(
    dataObj?.password_awal ?? dataObj?.password ?? dataObj?.initial_password
    ?? akunSource?.password_awal ?? akunSource?.password,
  );
  const roleObj = optionalRecord(akunSource?.role);
  const account: CreatedAccountInfo | null = username || passwordAwal
    ? {
      id_akun: positiveId(akunSource?.id_akun ?? dataObj?.id_akun),
      username,
      password_awal: passwordAwal,
      role_name: optionalText(roleObj?.nama_role) ?? 'Warga',
    }
    : null;

  return {
    success: true,
    message: optionalText(env.message) ?? 'Data warga dan akun berhasil dibuat.',
    data: { warga, account },
  };
}

export async function backendUpdateWarga(
  token: string,
  idWarga: number,
  input: UpdateWargaInput,
): Promise<UpdateWargaResponse> {
  const raw = await performRequest(`/api/admin/warga/${idWarga}`, token, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  const env = readEnvelope(raw, 'ubah warga');
  const dataObj = optionalRecord(env.data);
  const warga = dataObj ? normalizeWargaItem(dataObj, new Map()) : null;
  return {
    success: true,
    message: optionalText(env.message) ?? 'Data warga berhasil diubah.',
    data: warga,
  };
}

export async function backendDeactivateWarga(
  token: string,
  idWarga: number,
): Promise<GenericAdminMutationResponse> {
  const raw = await performRequest(`/api/admin/warga/${idWarga}`, token, {
    method: 'DELETE',
  });
  const env = readEnvelope(raw, 'nonaktifkan warga');
  return {
    success: true,
    message: optionalText(env.message) ?? 'Warga berhasil dinonaktifkan.',
  };
}

export async function backendCreateRt(token: string, input: CreateRtInput): Promise<GenericAdminMutationResponse> {
  const raw = await performRequest('/api/admin/rt', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const env = readEnvelope(raw, 'tambah RT');
  return { success: true, message: optionalText(env.message) ?? 'RT berhasil ditambahkan.' };
}

export async function backendUpdateRt(
  token: string,
  idRt: number,
  input: UpdateRtInput,
): Promise<GenericAdminMutationResponse> {
  const raw = await performRequest(`/api/admin/rt/${idRt}`, token, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  const env = readEnvelope(raw, 'ubah RT');
  return { success: true, message: optionalText(env.message) ?? 'Data RT berhasil diubah.' };
}

export async function backendDeleteRt(token: string, idRt: number): Promise<GenericAdminMutationResponse> {
  const raw = await performRequest(`/api/admin/rt/${idRt}`, token, { method: 'DELETE' });
  const env = readEnvelope(raw, 'hapus RT');
  return { success: true, message: optionalText(env.message) ?? 'RT berhasil dihapus.' };
}

export async function backendCreateRw(token: string, input: CreateRwInput): Promise<GenericAdminMutationResponse> {
  const raw = await performRequest('/api/admin/rw', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const env = readEnvelope(raw, 'tambah RW');
  return { success: true, message: optionalText(env.message) ?? 'RW berhasil ditambahkan.' };
}

export async function backendUpdateRw(
  token: string,
  idRw: number,
  input: UpdateRwInput,
): Promise<GenericAdminMutationResponse> {
  const raw = await performRequest(`/api/admin/rw/${idRw}`, token, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  const env = readEnvelope(raw, 'ubah RW');
  return { success: true, message: optionalText(env.message) ?? 'Data RW berhasil diubah.' };
}

export async function backendDeleteRw(token: string, idRw: number): Promise<GenericAdminMutationResponse> {
  const raw = await performRequest(`/api/admin/rw/${idRw}`, token, { method: 'DELETE' });
  const env = readEnvelope(raw, 'hapus RW');
  return { success: true, message: optionalText(env.message) ?? 'RW berhasil dihapus.' };
}

export async function backendGetAdminAkun(
  token: string,
  filters?: { search?: string; role?: string; status?: AccountStatus; per_page?: number },
): Promise<ManagementAkunResponse> {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.set('search', filters.search.trim());
  if (filters?.role && ['Admin', 'Panitia', 'Warga'].includes(filters.role)) {
    params.set('role', filters.role);
  }
  if (filters?.status === 'Aktif' || filters?.status === 'Nonaktif') {
    params.set('status', filters.status);
  }
  params.set('per_page', String(filters?.per_page ?? 100));

  const query = params.toString() ? `?${params.toString()}` : '';
  const raw = await performRequest(`/api/admin/akun${query}`, token);
  const env = readEnvelope(raw, 'daftar akun');
  const akun = extractList(env.data).map(normalizeAkunItem).filter((item): item is AkunItem => item !== null);
  const roleOptions = buildRoleOptions(akun);

  const metrics: AkunMetrics = {
    totalAkun: akun.length,
    panitiaCount: akun.filter((item) => item.nama_role.toLowerCase().includes('panitia')).length,
    wargaCount: akun.filter((item) => item.nama_role.toLowerCase().includes('warga')).length,
    aktifCount: akun.filter((item) => item.status === 'Aktif').length,
  };

  return {
    success: true,
    message: optionalText(env.message) ?? 'Daftar akun berhasil diambil.',
    data: { akun, roleOptions, metrics },
  };
}

export async function backendUpdateAkunRole(
  token: string,
  idAkun: number,
  input: UpdateAkunRoleInput,
): Promise<GenericAdminMutationResponse> {
  const raw = await performRequest(`/api/admin/akun/${idAkun}/role`, token, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  const env = readEnvelope(raw, 'role akun');
  return { success: true, message: optionalText(env.message) ?? 'Role akun berhasil diperbarui.' };
}

export async function backendUpdateAkunStatus(
  token: string,
  idAkun: number,
  input: UpdateAkunStatusInput,
): Promise<GenericAdminMutationResponse> {
  const raw = await performRequest(`/api/admin/akun/${idAkun}/status`, token, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  const env = readEnvelope(raw, 'status akun');
  return { success: true, message: optionalText(env.message) ?? 'Status akun berhasil diperbarui.' };
}

