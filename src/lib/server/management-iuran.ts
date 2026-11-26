import 'server-only';

import { Agent } from 'undici';
import { updateCachedPaymentSettings } from '@/lib/server/iuran';
import type {
  CreateTagihanInput,
  HouseholdPayment,
  ManagementIuranResponse,
  ManagementTagihanDetailResponse,
  ManagementTagihanItem,
  ManagementTagihanListResponse,
  ManagementTagihanPaymentsResponse,
  PaymentAccountSettings,
  PaymentStatus,
  PeriodeOption,
  TagihanFormOptionsResponse,
  TagihanMutationResponse,
  TagihanPaginationMeta,
  TagihanPaymentStatusFilter,
  TagihanStatistik,
  TagihanTarget,
  TagihanWargaPaymentItem,
  UpdateTagihanInput,
  VerifyPaymentInput,
  VerifyPaymentResponse,
  WargaSelectOption,
} from '@/types/management-iuran';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export class ManagementIuranError extends Error {
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
    throw new ManagementIuranError(502, 'Respons layanan iuran tidak valid. Silakan coba lagi.');
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new ManagementIuranError(502, 'Respons layanan iuran tidak valid. Silakan coba lagi.');
  return value;
}

function positiveOrZeroInteger(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new ManagementIuranError(502, 'Respons layanan iuran tidak valid. Silakan coba lagi.');
  }
  return value as number;
}

function apiBase(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new ManagementIuranError(503, 'Layanan iuran belum dikonfigurasi.');
  return base.replace(/\/$/, '');
}

async function performRequest(endpoint: string, token: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('Authorization', `Bearer ${token}`);
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
    console.warn('[management-iuran/backend] connection failed', {
      endpoint: endpoint.replace(/\/\d+/g, '/:id'),
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new ManagementIuranError(503, 'Layanan iuran belum dapat dihubungi. Silakan coba lagi.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ManagementIuranError(502, 'Respons layanan iuran tidak valid. Silakan coba lagi.');
  }

  if (!response.ok) {
    const result = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown> : {};
    const message = typeof result.message === 'string' ? result.message : 'Layanan iuran sedang bermasalah. Silakan coba lagi.';
    const errors = result.errors && typeof result.errors === 'object' && !Array.isArray(result.errors)
      ? result.errors as Record<string, string[]> : undefined;
    throw new ManagementIuranError(response.status, message, errors);
  }
  return body;
}

function readEnvelope(value: unknown, label: string): Record<string, unknown> {
  const result = record(value);
  if (result.success !== true) {
    throw new ManagementIuranError(502, `Respons ${label} tidak valid. Silakan coba lagi.`);
  }
  return result;
}

export async function backendGetManagementIuran(
  token: string,
  options?: { status?: string; search?: string; per_page?: number },
): Promise<ManagementIuranResponse> {
  const params = new URLSearchParams();
  params.set('per_page', String(options?.per_page ?? 50));
  if (options?.status && ['Menunggu', 'Lunas', 'Belum Lunas'].includes(options.status)) {
    params.set('status', options.status);
  }
  if (options?.search?.trim()) {
    params.set('search', options.search.trim());
  }

  const query = `?${params.toString()}`;

  // Fetch management iuran list, transparansi summary, and payment settings in parallel
  const [iuranRaw, transparansiRaw, settingsRaw] = await Promise.all([
    performRequest(`/api/manajemen/iuran${query}`, token),
    performRequest('/api/warga/iuran/transparansi', token).catch(() => null),
    performRequest('/api/pengaturan-pembayaran', token).catch(() => null),
  ]);

  const iuranEnv = readEnvelope(iuranRaw, 'manajemen iuran');
  const paginatedData = record(iuranEnv.data);
  const rawList = Array.isArray(paginatedData.data)
    ? paginatedData.data
    : Array.isArray(iuranEnv.data)
      ? iuranEnv.data
      : [];

  const payments: HouseholdPayment[] = rawList.map((rawItem) => {
    const item = record(rawItem);
    const idIuran = positiveOrZeroInteger(item.id_iuran);
    const idPembayaran = item.id_pembayaran != null ? positiveOrZeroInteger(item.id_pembayaran) : null;
    const name = typeof item.nama_kepala_keluarga === 'string' && item.nama_kepala_keluarga
      ? item.nama_kepala_keluarga
      : 'Kepala Keluarga';
    const phone = typeof item.no_hp === 'string' && item.no_hp ? item.no_hp : '0821 – 0000 – 0000';

    let amount: number | null = null;
    if (typeof item.nominal === 'number') {
      amount = item.nominal;
    } else if (typeof item.nominal === 'string' && item.nominal) {
      const parsed = parseFloat(item.nominal);
      amount = Number.isFinite(parsed) ? parsed : null;
    }

    let date: string | null = null;
    if (typeof item.tanggal_bayar === 'string' && item.tanggal_bayar.length >= 10) {
      date = item.tanggal_bayar.slice(0, 10);
    }

    let status: PaymentStatus = 'Belum Lunas';
    if (item.status_verifikasi === 'Menunggu' || item.status === 'Menunggu Konfirmasi' || item.status === 'Menunggu') {
      status = 'Menunggu';
    } else if (item.status === 'Lunas' || item.status_verifikasi === 'Diterima') {
      status = 'Lunas';
    } else if (item.status === 'Belum Lunas' || item.status_verifikasi === 'Ditolak') {
      status = 'Belum Lunas';
    }

    const proofUrl = idPembayaran && typeof item.bukti_bayar_url === 'string' && item.bukti_bayar_url
      ? `/api/dashboard/iuran/bukti/${idPembayaran}`
      : null;

    return {
      id: idIuran,
      id_pembayaran: idPembayaran,
      name,
      phone,
      amount,
      date,
      status,
      proofUrl,
    };
  });

  // Parse transparansi if available
  let totalCollected = 0;
  let paidCount = payments.filter((p) => p.status === 'Lunas').length;
  let unpaidCount = payments.filter((p) => p.status === 'Belum Lunas').length;
  let totalHouseholds = payments.length || 10;

  if (transparansiRaw) {
    try {
      const tData = record(record(transparansiRaw).data);
      if (typeof tData.iuran_terkumpul === 'number') totalCollected = tData.iuran_terkumpul;
      if (typeof tData.warga_lunas === 'number') paidCount = tData.warga_lunas;
      if (typeof tData.warga_belum_lunas === 'number') unpaidCount = tData.warga_belum_lunas;
      if (typeof tData.jumlah_warga === 'number') totalHouseholds = tData.jumlah_warga;
    } catch {
      // Fallback to local sum
    }
  }

  if (totalCollected === 0) {
    totalCollected = payments.reduce((sum, item) => (item.status === 'Lunas' && item.amount ? sum + item.amount : sum), 0);
  }

  const waitingCount = payments.filter((p) => p.status === 'Menunggu').length;
  const progressPercentage = Math.min(100, Math.round((paidCount / Math.max(1, totalHouseholds)) * 100));

  // Parse settings
  let settings: PaymentAccountSettings | null = null;
  if (settingsRaw) {
    try {
      const sData = record(settingsRaw).data;
      if (sData && typeof sData === 'object' && !Array.isArray(sData)) {
        const sObj = sData as Record<string, unknown>;
        let qrisUrl = typeof sObj.qris_image === 'string' ? sObj.qris_image : null;
        if (qrisUrl && qrisUrl.startsWith('/')) {
          qrisUrl = `${apiBase()}${qrisUrl}`;
        }
        settings = {
          id_pengaturan: typeof sObj.id_pengaturan === 'number' ? sObj.id_pengaturan : undefined,
          nama_bank: typeof sObj.nama_bank === 'string' ? sObj.nama_bank : null,
          nomor_rekening: typeof sObj.nomor_rekening === 'string' ? sObj.nomor_rekening : null,
          atas_nama: typeof sObj.atas_nama === 'string' ? sObj.atas_nama : null,
          qris_image: qrisUrl,
        };
        updateCachedPaymentSettings({
          id_pengaturan: settings.id_pengaturan ?? null,
          nama_bank: settings.nama_bank,
          nomor_rekening: settings.nomor_rekening,
          atas_nama: settings.atas_nama,
          qris_image: settings.qris_image,
        });
      }
    } catch {
      // Keep null if not available
    }
  }

  return {
    success: true,
    message: 'Data manajemen iuran berhasil diambil.',
    data: {
      payments,
      metrics: {
        totalCollected,
        waitingCount,
        paidCount,
        unpaidCount,
        totalHouseholds,
        progressPercentage,
      },
      settings,
    },
  };
}

export async function backendVerifyPayment(
  token: string,
  idPembayaran: number,
  input: VerifyPaymentInput,
): Promise<VerifyPaymentResponse> {
  const responseRaw = await performRequest(`/api/manajemen/pembayaran/${idPembayaran}/verifikasi`, token, {
    method: 'PATCH',
    body: JSON.stringify({ keputusan: input.keputusan }),
  });

  const envelope = readEnvelope(responseRaw, 'verifikasi pembayaran');
  return {
    success: true,
    message: text(envelope.message),
    data: {
      id_pembayaran: idPembayaran,
      status_verifikasi: input.keputusan,
    },
  };
}

export async function backendUpdatePaymentSettings(
  token: string,
  formData: FormData,
): Promise<Record<string, unknown>> {
  const base = apiBase();
  let response: Response;
  try {
    // In Laravel / PHP, multipart/form-data on PUT requests does not populate $_POST or $_FILES.
    // The standard Laravel convention for multipart updates is sending POST with _method=PUT.
    formData.set('_method', 'PUT');

    response = await fetch(`${base}/api/pengaturan-pembayaran`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
      dispatcher: backendDispatcher,
    } as RequestInit & { dispatcher: Agent });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    console.warn('[management-iuran/backend] settings update failed', {
      endpoint: '/api/pengaturan-pembayaran',
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code
        : error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new ManagementIuranError(503, 'Layanan pengaturan pembayaran belum dapat dihubungi. Silakan coba lagi.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ManagementIuranError(502, 'Respons pengaturan pembayaran tidak valid. Silakan coba lagi.');
  }

  if (!response.ok) {
    const result = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown> : {};
    const message = typeof result.message === 'string' ? result.message : 'Gagal memperbarui pengaturan pembayaran.';
    const errors = result.errors && typeof result.errors === 'object' && !Array.isArray(result.errors)
      ? result.errors as Record<string, string[]> : undefined;
    throw new ManagementIuranError(response.status, message, errors);
  }

  const envelope = readEnvelope(body, 'pengaturan pembayaran');
  const rawData = envelope.data as Record<string, unknown> | undefined;
  if (rawData) {
    let qrisUrl = typeof rawData.qris_image === 'string' ? rawData.qris_image : null;
    if (qrisUrl && qrisUrl.startsWith('/')) {
      qrisUrl = `${base}${qrisUrl}`;
      rawData.qris_image = qrisUrl;
    }
    updateCachedPaymentSettings({
      id_pengaturan: typeof rawData.id_pengaturan === 'number' ? rawData.id_pengaturan : null,
      nama_bank: typeof rawData.nama_bank === 'string' ? rawData.nama_bank : null,
      nomor_rekening: typeof rawData.nomor_rekening === 'string' ? rawData.nomor_rekening : null,
      atas_nama: typeof rawData.atas_nama === 'string' ? rawData.atas_nama : null,
      qris_image: qrisUrl,
    });
  }

  return envelope;
}

export async function backendGetPaymentProofBinary(
  token: string,
  idPembayaran: number,
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const base = apiBase();
  let apiResponse: Response;
  try {
    apiResponse = await fetch(`${base}/api/pembayaran/${idPembayaran}/bukti`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, image/*',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
      dispatcher: backendDispatcher,
    } as RequestInit & { dispatcher: Agent });
  } catch {
    throw new ManagementIuranError(503, 'Layanan bukti pembayaran belum dapat dihubungi.');
  }

  if (!apiResponse.ok) {
    let message = 'Bukti pembayaran tidak ditemukan.';
    try {
      const errBody = await apiResponse.json() as Record<string, unknown>;
      if (typeof errBody.message === 'string' && errBody.message) {
        message = errBody.message;
      }
    } catch { /* ignore */ }
    throw new ManagementIuranError(apiResponse.status, message);
  }

  const contentType = apiResponse.headers.get('content-type') ?? '';
  if (contentType.startsWith('image/')) {
    return {
      buffer: await apiResponse.arrayBuffer(),
      contentType,
    };
  }

  let payload: unknown;
  try {
    payload = await apiResponse.json();
  } catch {
    throw new ManagementIuranError(502, 'Format respons bukti pembayaran tidak valid.');
  }

  const envelope = readEnvelope(payload, 'bukti pembayaran');
  const dataObj = record(envelope.data);
  const signedUrl = optionalText(dataObj.url);
  if (!signedUrl || !/^https?:\/\//i.test(signedUrl)) {
    throw new ManagementIuranError(404, 'URL bukti pembayaran tidak tersedia.');
  }

  let fileResponse: Response;
  try {
    fileResponse = await fetch(signedUrl, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
      dispatcher: backendDispatcher,
    } as RequestInit & { dispatcher: Agent });
  } catch {
    throw new ManagementIuranError(503, 'Gagal mengunduh file bukti pembayaran.');
  }

  if (!fileResponse.ok) {
    throw new ManagementIuranError(502, 'File bukti pembayaran gagal dimuat dari penyimpanan.');
  }

  const fileType = fileResponse.headers.get('content-type') ?? 'image/jpeg';
  return {
    buffer: await fileResponse.arrayBuffer(),
    contentType: fileType.startsWith('image/') ? fileType : 'image/jpeg',
  };
}

function optionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseAmount(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function parseBooleanFlag(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
}

function parseCount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return null;
}

function parseIsoDateText(value: unknown): string {
  if (typeof value === 'string' && value.trim().length >= 10) {
    return value.trim().slice(0, 10);
  }
  return '';
}

function extractPaginatedList(
  rawData: unknown,
  fallbackPerPage = 10,
): { items: unknown[]; meta: TagihanPaginationMeta } {
  if (Array.isArray(rawData)) {
    return {
      items: rawData,
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: Math.max(1, rawData.length || fallbackPerPage),
        total: rawData.length,
      },
    };
  }

  const obj = record(rawData);
  const nested = Array.isArray(obj.data) ? obj.data : [];
  const currentPage = parseCount(obj.current_page) ?? 1;
  const lastPage = Math.max(1, parseCount(obj.last_page) ?? 1);
  const perPage = Math.max(1, parseCount(obj.per_page) ?? fallbackPerPage);
  const total = parseCount(obj.total) ?? nested.length;

  return {
    items: nested,
    meta: {
      current_page: currentPage,
      last_page: lastPage,
      per_page: perPage,
      total,
    },
  };
}

function normalizeTagihanItem(raw: unknown): ManagementTagihanItem {
  const item = record(raw);
  const idTagihan = positiveOrZeroInteger(item.id_tagihan ?? item.id ?? 0);
  const idPeriode = parseCount(item.id_periode)
    ?? (item.periode && typeof item.periode === 'object' && !Array.isArray(item.periode)
      ? parseCount((item.periode as Record<string, unknown>).id_periode) ?? 0
      : 0);

  let periodeLabel: string | null = null;
  if (item.periode && typeof item.periode === 'object' && !Array.isArray(item.periode)) {
    const p = item.periode as Record<string, unknown>;
    const judul = optionalText(p.judul ?? p.nama_kegiatan);
    const tahun = p.tahun != null ? String(p.tahun) : '';
    if (judul && tahun) periodeLabel = `${judul} (${tahun})`;
    else periodeLabel = judul || tahun || null;
  }

  const targetRaw = optionalText(item.target);
  const target: TagihanTarget = targetRaw === 'Tertentu' ? 'Tertentu' : 'Semua';

  const statsObj = item.statistik && typeof item.statistik === 'object' && !Array.isArray(item.statistik)
    ? item.statistik as Record<string, unknown>
    : null;

  const totalWarga = parseCount(
    item.total_warga ?? item.jumlah_warga ?? item.iuran_count ?? item.iurans_count ?? statsObj?.total_warga,
  );
  const sudahBayar = parseCount(
    item.sudah_bayar ?? item.sudah_bayar_count ?? item.warga_lunas ?? statsObj?.sudah_bayar,
  );
  const belumBayar = parseCount(
    item.belum_bayar ?? item.belum_bayar_count ?? item.warga_belum_lunas ?? statsObj?.belum_bayar,
  );

  return {
    id_tagihan: idTagihan,
    id_periode: idPeriode,
    nama_tagihan: optionalText(item.nama_tagihan ?? item.nama_iuran) ?? 'Tagihan Iuran',
    nominal: parseAmount(item.nominal, 0),
    jatuh_tempo: parseIsoDateText(item.jatuh_tempo),
    keterangan: optionalText(item.keterangan),
    target,
    is_aktif: parseBooleanFlag(item.is_aktif, true),
    periode_label: periodeLabel,
    total_warga: totalWarga,
    sudah_bayar: sudahBayar,
    belum_bayar: belumBayar,
    created_at: optionalText(item.created_at),
  };
}

function normalizeTagihanWargaPayment(raw: unknown): TagihanWargaPaymentItem {
  const item = record(raw);
  const wargaObj = item.warga && typeof item.warga === 'object' && !Array.isArray(item.warga)
    ? item.warga as Record<string, unknown>
    : null;
  const latestPayment = item.pembayaran_terakhir && typeof item.pembayaran_terakhir === 'object' && !Array.isArray(item.pembayaran_terakhir)
    ? item.pembayaran_terakhir as Record<string, unknown>
    : null;

  const nama = optionalText(
    item.nama_kepala_keluarga ?? item.nama_warga ?? item.nama ?? wargaObj?.nama,
  ) ?? 'Kepala Keluarga';

  return {
    id_iuran: parseCount(item.id_iuran ?? item.id) ?? 0,
    id_warga: parseCount(item.id_warga ?? wargaObj?.id_warga),
    nama_kepala_keluarga: nama,
    no_hp: optionalText(item.no_hp ?? wargaObj?.no_hp),
    nominal: parseAmount(item.nominal, 0),
    status: optionalText(item.status) ?? 'Belum Bayar',
    jatuh_tempo: optionalText(item.jatuh_tempo)?.slice(0, 10) ?? null,
    tanggal_bayar: optionalText(
      item.tanggal_bayar ?? item.waktu_pembayaran ?? latestPayment?.tanggal_bayar,
    ),
  };
}

export async function backendGetManagementTagihan(
  token: string,
  options?: {
    search?: string;
    is_aktif?: 0 | 1;
    id_periode?: number;
    page?: number;
    per_page?: number;
  },
): Promise<ManagementTagihanListResponse> {
  const params = new URLSearchParams();
  const perPage = Math.min(50, Math.max(1, options?.per_page ?? 5));
  params.set('per_page', String(perPage));
  if (options?.page && Number.isSafeInteger(options.page) && options.page > 0) {
    params.set('page', String(options.page));
  }
  if (options?.search?.trim()) {
    params.set('search', options.search.trim());
  }
  if (options?.is_aktif === 0 || options?.is_aktif === 1) {
    params.set('is_aktif', String(options.is_aktif));
  }
  if (options?.id_periode && Number.isSafeInteger(options.id_periode) && options.id_periode > 0) {
    params.set('id_periode', String(options.id_periode));
  }

  const raw = await performRequest(`/api/manajemen/tagihan?${params.toString()}`, token);
  const envelope = readEnvelope(raw, 'daftar tagihan iuran');
  const { items, meta } = extractPaginatedList(envelope.data, perPage);

  return {
    success: true,
    message: optionalText(envelope.message) ?? 'Daftar tagihan iuran berhasil diambil.',
    data: items.map(normalizeTagihanItem),
    meta,
  };
}

export async function backendCreateManagementTagihan(
  token: string,
  input: CreateTagihanInput,
): Promise<TagihanMutationResponse> {
  const payload: Record<string, unknown> = {
    nama_tagihan: input.nama_tagihan,
    id_periode: input.id_periode,
    nominal: input.nominal,
    jatuh_tempo: input.jatuh_tempo,
    keterangan: input.keterangan ?? null,
    target: input.target,
  };
  if (input.target === 'Tertentu') {
    payload.id_warga = input.id_warga ?? [];
  }

  const raw = await performRequest('/api/manajemen/tagihan', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const envelope = readEnvelope(raw, 'pembuatan tagihan iuran');
  const rawTagihan = envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)
    ? ((envelope.data as Record<string, unknown>).tagihan ?? envelope.data)
    : null;

  return {
    success: true,
    message: optionalText(envelope.message) ?? 'Tagihan iuran berhasil dibuat.',
    data: rawTagihan ? normalizeTagihanItem(rawTagihan) : null,
  };
}

export async function backendGetManagementTagihanDetail(
  token: string,
  idTagihan: number,
): Promise<ManagementTagihanDetailResponse> {
  const raw = await performRequest(`/api/manajemen/tagihan/${idTagihan}`, token);
  const envelope = readEnvelope(raw, 'detail tagihan iuran');
  const dataObj = record(envelope.data);

  const tagihanRaw = dataObj.tagihan && typeof dataObj.tagihan === 'object' && !Array.isArray(dataObj.tagihan)
    ? dataObj.tagihan
    : dataObj;
  const tagihan = normalizeTagihanItem(tagihanRaw);

  const listRaw = Array.isArray(dataObj.pembayaran)
    ? dataObj.pembayaran
    : Array.isArray(dataObj.iuran)
      ? dataObj.iuran
      : Array.isArray(dataObj.daftar_iuran)
        ? dataObj.daftar_iuran
        : [];
  const pembayaran = listRaw.map(normalizeTagihanWargaPayment);

  const statSource = dataObj.statistik && typeof dataObj.statistik === 'object' && !Array.isArray(dataObj.statistik)
    ? dataObj.statistik as Record<string, unknown>
    : dataObj;

  const sudahBayarFromList = pembayaran.filter((p) => p.status === 'Sudah Bayar' || p.status === 'Lunas').length;
  const totalWarga = parseCount(statSource.total_warga ?? statSource.jumlah_warga)
    ?? tagihan.total_warga
    ?? pembayaran.length;
  const sudahBayar = parseCount(statSource.sudah_bayar ?? statSource.warga_lunas)
    ?? tagihan.sudah_bayar
    ?? sudahBayarFromList;
  const belumBayar = parseCount(statSource.belum_bayar ?? statSource.warga_belum_lunas)
    ?? tagihan.belum_bayar
    ?? Math.max(0, totalWarga - sudahBayar);
  const nominalTerkumpul = parseAmount(
    statSource.total_nominal_terkumpul ?? statSource.nominal_terkumpul ?? statSource.total_terkumpul,
    sudahBayar * tagihan.nominal,
  );

  const statistik: TagihanStatistik = {
    total_warga: totalWarga,
    sudah_bayar: sudahBayar,
    belum_bayar: belumBayar,
    nominal_terkumpul: nominalTerkumpul,
  };

  return {
    success: true,
    message: optionalText(envelope.message) ?? 'Detail tagihan berhasil diambil.',
    data: { tagihan, statistik, pembayaran },
  };
}

export async function backendUpdateManagementTagihan(
  token: string,
  idTagihan: number,
  input: UpdateTagihanInput,
): Promise<TagihanMutationResponse> {
  const raw = await performRequest(`/api/manajemen/tagihan/${idTagihan}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      nama_tagihan: input.nama_tagihan,
      nominal: input.nominal,
      jatuh_tempo: input.jatuh_tempo,
      keterangan: input.keterangan ?? null,
    }),
  });
  const envelope = readEnvelope(raw, 'perubahan tagihan iuran');
  const rawTagihan = envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)
    ? ((envelope.data as Record<string, unknown>).tagihan ?? envelope.data)
    : null;

  return {
    success: true,
    message: optionalText(envelope.message) ?? 'Tagihan iuran berhasil diperbarui.',
    data: rawTagihan ? normalizeTagihanItem(rawTagihan) : null,
  };
}

export async function backendDeactivateManagementTagihan(
  token: string,
  idTagihan: number,
): Promise<TagihanMutationResponse> {
  const raw = await performRequest(`/api/manajemen/tagihan/${idTagihan}/nonaktifkan`, token, {
    method: 'PATCH',
  });
  const envelope = readEnvelope(raw, 'penonaktifan tagihan iuran');
  const rawTagihan = envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)
    ? ((envelope.data as Record<string, unknown>).tagihan ?? envelope.data)
    : null;

  return {
    success: true,
    message: optionalText(envelope.message) ?? 'Tagihan iuran berhasil dinonaktifkan.',
    data: rawTagihan ? normalizeTagihanItem(rawTagihan) : null,
  };
}

export async function backendGetManagementTagihanPayments(
  token: string,
  idTagihan: number,
  options?: { status?: TagihanPaymentStatusFilter; page?: number; per_page?: number },
): Promise<ManagementTagihanPaymentsResponse> {
  const params = new URLSearchParams();
  const perPage = Math.min(50, Math.max(1, options?.per_page ?? 5));
  params.set('per_page', String(perPage));
  if (options?.page && Number.isSafeInteger(options.page) && options.page > 0) {
    params.set('page', String(options.page));
  }
  if (options?.status && ['Semua', 'Belum Bayar', 'Sudah Bayar'].includes(options.status)) {
    params.set('status', options.status);
  }

  const raw = await performRequest(
    `/api/manajemen/tagihan/${idTagihan}/pembayaran?${params.toString()}`,
    token,
  );
  const envelope = readEnvelope(raw, 'status pembayaran tagihan');
  const { items, meta } = extractPaginatedList(envelope.data, perPage);

  return {
    success: true,
    message: optionalText(envelope.message) ?? 'Status pembayaran tagihan berhasil diambil.',
    data: items.map(normalizeTagihanWargaPayment),
    meta,
  };
}

export async function backendGetTagihanFormOptions(
  token: string,
): Promise<TagihanFormOptionsResponse> {
  const [historiRaw, wargaFirstRaw] = await Promise.all([
    performRequest('/api/histori', token),
    performRequest('/api/admin/warga?per_page=50&status=Aktif', token).catch((error) => {
      if (error instanceof ManagementIuranError && error.status === 403) {
        return null;
      }
      throw error;
    }),
  ]);

  const historiEnv = readEnvelope(historiRaw, 'daftar periode');
  const rawPeriodes = Array.isArray(historiEnv.data) ? historiEnv.data : [];
  const periodes: PeriodeOption[] = rawPeriodes
    .map((entry) => {
      const p = record(entry);
      const idPeriode = parseCount(p.id_periode);
      if (!idPeriode) return null;
      return {
        id_periode: idPeriode,
        tahun: p.tahun != null ? String(p.tahun) : '',
        judul: optionalText(p.judul ?? p.nama_kegiatan) ?? `Periode ${idPeriode}`,
        status: optionalText(p.status) ?? 'Aktif',
      };
    })
    .filter((item): item is PeriodeOption => item !== null);

  let canSelectSpecificWarga = false;
  const wargaOptions: WargaSelectOption[] = [];

  if (wargaFirstRaw) {
    canSelectSpecificWarga = true;
    const wargaEnv = readEnvelope(wargaFirstRaw, 'daftar warga');
    const firstPage = extractPaginatedList(wargaEnv.data, 50);
    const allRawWarga = [...firstPage.items];

    if (firstPage.meta.last_page > 1) {
      const extraPages = await Promise.all(
        Array.from({ length: Math.min(firstPage.meta.last_page - 1, 10) }, (_, idx) =>
          performRequest(`/api/admin/warga?per_page=50&status=Aktif&page=${idx + 2}`, token)
            .then((res) => extractPaginatedList(readEnvelope(res, 'daftar warga').data, 50).items)
            .catch(() => []),
        ),
      );
      for (const pageItems of extraPages) {
        allRawWarga.push(...pageItems);
      }
    }

    for (const rawItem of allRawWarga) {
      if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) continue;
      const w = rawItem as Record<string, unknown>;
      const idWarga = parseCount(w.id_warga);
      const nama = optionalText(w.nama);
      if (!idWarga || !nama) continue;
      const rtObj = w.rt && typeof w.rt === 'object' && !Array.isArray(w.rt)
        ? w.rt as Record<string, unknown>
        : null;
      const rwObj = rtObj?.rw && typeof rtObj.rw === 'object' && !Array.isArray(rtObj.rw)
        ? rtObj.rw as Record<string, unknown>
        : null;
      wargaOptions.push({
        id_warga: idWarga,
        nama,
        nomor_rt: optionalText(rtObj?.nomor_rt ?? w.nomor_rt),
        nomor_rw: optionalText(rwObj?.nomor_rw ?? w.nomor_rw),
        no_hp: optionalText(w.no_hp),
      });
    }
  }

  return {
    success: true,
    message: 'Opsi formulir tagihan berhasil dimuat.',
    data: {
      periodes,
      wargaOptions,
      canSelectSpecificWarga,
    },
  };
}

