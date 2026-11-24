import { apiRequest } from '@/lib/api/client';
import type {
  ManagementPendaftaranResponse,
  UpdateRegistrationStatusInput,
  UpdateRegistrationStatusResponse,
} from '@/types/management-pendaftaran';

export function getManagementPendaftaran(
  options?: { role?: string; status?: string; search?: string },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams();
  if (options?.role) params.set('role', options.role);
  if (options?.status && options.status !== 'Semua') params.set('status', options.status);
  if (options?.search) params.set('search', options.search);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ManagementPendaftaranResponse>(`/api/dashboard/pendaftaran${query}`, { signal });
}

export function updateRegistrationStatus(
  id: string,
  input: UpdateRegistrationStatusInput,
  role?: string,
) {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  return apiRequest<UpdateRegistrationStatusResponse>(
    `/api/dashboard/pendaftaran/${encodeURIComponent(id)}/status${query}`,
    {
      method: 'PATCH',
      body: input,
    },
  );
}

