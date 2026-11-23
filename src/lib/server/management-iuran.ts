import 'server-only';

import { Agent } from 'undici';
import { updateCachedPaymentSettings } from '@/lib/server/iuran';
import type {
  HouseholdPayment,
  ManagementIuranResponse,
  PaymentAccountSettings,
  PaymentStatus,
  VerifyPaymentInput,
  VerifyPaymentResponse,
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

    const proofUrl = typeof item.bukti_bayar_url === 'string' && item.bukti_bayar_url
      ? item.bukti_bayar_url
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

