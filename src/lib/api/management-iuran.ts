import { apiRequest } from '@/lib/api/client';
import type {
  ManagementIuranResponse,
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

