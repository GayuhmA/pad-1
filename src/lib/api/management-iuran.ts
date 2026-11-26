import { apiRequest } from '@/lib/api/client';
import type {
  CreateTagihanInput,
  ManagementIuranResponse,
  ManagementTagihanDetailResponse,
  ManagementTagihanListResponse,
  ManagementTagihanPaymentsResponse,
  TagihanFormOptionsResponse,
  TagihanMutationResponse,
  TagihanPaymentStatusFilter,
  UpdateTagihanInput,
  VerifyPaymentInput,
  VerifyPaymentResponse,
} from '@/types/management-iuran';

export function getManagementIuran(
  options?: { status?: string; search?: string; per_page?: number },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams();
  if (options?.status && options.status !== 'Semua') params.set('status', options.status);
  if (options?.search) params.set('search', options.search);
  if (options?.per_page) params.set('per_page', String(options.per_page));
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ManagementIuranResponse>(`/api/dashboard/iuran${query}`, { signal });
}

export function verifyPayment(
  idPembayaran: number,
  input: VerifyPaymentInput,
) {
  return apiRequest<VerifyPaymentResponse>(
    `/api/dashboard/iuran/verifikasi/${encodeURIComponent(idPembayaran)}`,
    {
      method: 'PATCH',
      body: input,
    },
  );
}

export async function updatePaymentSettings(formData: FormData) {
  const response = await fetch('/api/dashboard/iuran/pengaturan', {
    method: 'PUT',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Gagal menyimpan pengaturan pembayaran.');
  }
  return data;
}

export function getManagementTagihan(
  options?: {
    search?: string;
    is_aktif?: '0' | '1';
    id_periode?: number;
    page?: number;
    per_page?: number;
  },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams();
  if (options?.search?.trim()) params.set('search', options.search.trim());
  if (options?.is_aktif === '0' || options?.is_aktif === '1') params.set('is_aktif', options.is_aktif);
  if (options?.id_periode) params.set('id_periode', String(options.id_periode));
  if (options?.page) params.set('page', String(options.page));
  if (options?.per_page) params.set('per_page', String(options.per_page));
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ManagementTagihanListResponse>(`/api/dashboard/iuran/tagihan${query}`, { signal });
}

export function getTagihanFormOptions(signal?: AbortSignal) {
  return apiRequest<TagihanFormOptionsResponse>('/api/dashboard/iuran/tagihan/options', { signal });
}

export function createManagementTagihan(input: CreateTagihanInput) {
  return apiRequest<TagihanMutationResponse>('/api/dashboard/iuran/tagihan', {
    method: 'POST',
    body: input,
  });
}

export function getManagementTagihanDetail(idTagihan: number, signal?: AbortSignal) {
  return apiRequest<ManagementTagihanDetailResponse>(
    `/api/dashboard/iuran/tagihan/${encodeURIComponent(idTagihan)}`,
    { signal },
  );
}

export function updateManagementTagihan(idTagihan: number, input: UpdateTagihanInput) {
  return apiRequest<TagihanMutationResponse>(
    `/api/dashboard/iuran/tagihan/${encodeURIComponent(idTagihan)}`,
    {
      method: 'PUT',
      body: input,
    },
  );
}

export function deactivateManagementTagihan(idTagihan: number) {
  return apiRequest<TagihanMutationResponse>(
    `/api/dashboard/iuran/tagihan/${encodeURIComponent(idTagihan)}/nonaktifkan`,
    { method: 'PATCH' },
  );
}

export function getManagementTagihanPayments(
  idTagihan: number,
  options?: { status?: TagihanPaymentStatusFilter; page?: number; per_page?: number },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams();
  if (options?.status && options.status !== 'Semua') params.set('status', options.status);
  if (options?.page) params.set('page', String(options.page));
  if (options?.per_page) params.set('per_page', String(options.per_page));
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ManagementTagihanPaymentsResponse>(
    `/api/dashboard/iuran/tagihan/${encodeURIComponent(idTagihan)}/pembayaran${query}`,
    { signal },
  );
}

