import { apiRequest } from '@/lib/api/client';
import type {
  AccountStatus,
  CreateRtInput,
  CreateWargaInput,
  CreateWargaResponse,
  GenericAdminMutationResponse,
  ManagementAkunResponse,
  ManagementRtRwResponse,
  ManagementWargaResponse,
  UpdateAkunRoleInput,
  UpdateAkunStatusInput,
  UpdateRtInput,
  UpdateWargaInput,
  UpdateWargaResponse,
} from '@/types/management-admin';

export function getAdminWarga(
  options?: { search?: string; id_rt?: number; status?: string },
  signal?: AbortSignal,
): Promise<ManagementWargaResponse> {
  const params = new URLSearchParams();
  if (options?.search?.trim()) params.set('search', options.search.trim());
  if (options?.id_rt) params.set('id_rt', String(options.id_rt));
  if (options?.status && options.status !== 'Semua') params.set('status', options.status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ManagementWargaResponse>(`/api/dashboard/warga${query}`, { signal });
}

export function createAdminWarga(input: CreateWargaInput): Promise<CreateWargaResponse> {
  return apiRequest<CreateWargaResponse>('/api/dashboard/warga', {
    method: 'POST',
    body: input,
  });
}

export function updateAdminWarga(idWarga: number, input: UpdateWargaInput): Promise<UpdateWargaResponse> {
  return apiRequest<UpdateWargaResponse>(`/api/dashboard/warga/${encodeURIComponent(idWarga)}`, {
    method: 'PUT',
    body: input,
  });
}

export function deactivateAdminWarga(idWarga: number): Promise<GenericAdminMutationResponse> {
  return apiRequest<GenericAdminMutationResponse>(`/api/dashboard/warga/${encodeURIComponent(idWarga)}`, {
    method: 'DELETE',
  });
}

export function getAdminRtRw(signal?: AbortSignal): Promise<ManagementRtRwResponse> {
  return apiRequest<ManagementRtRwResponse>('/api/dashboard/rt', { signal });
}

export function createAdminRt(input: CreateRtInput): Promise<GenericAdminMutationResponse> {
  return apiRequest<GenericAdminMutationResponse>('/api/dashboard/rt', {
    method: 'POST',
    body: input,
  });
}

export function updateAdminRt(idRt: number, input: UpdateRtInput): Promise<GenericAdminMutationResponse> {
  return apiRequest<GenericAdminMutationResponse>(`/api/dashboard/rt/${encodeURIComponent(idRt)}`, {
    method: 'PUT',
    body: input,
  });
}

export function deleteAdminRt(idRt: number): Promise<GenericAdminMutationResponse> {
  return apiRequest<GenericAdminMutationResponse>(`/api/dashboard/rt/${encodeURIComponent(idRt)}`, {
    method: 'DELETE',
  });
}


export function getAdminAkun(
  options?: { search?: string; role?: string; status?: AccountStatus | 'Semua'; per_page?: number },
  signal?: AbortSignal,
): Promise<ManagementAkunResponse> {
  const params = new URLSearchParams();
  if (options?.search?.trim()) params.set('search', options.search.trim());
  if (options?.role && options.role !== 'Semua') params.set('role', options.role);
  if (options?.status && options.status !== 'Semua') params.set('status', options.status);
  if (options?.per_page) params.set('per_page', String(options.per_page));
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ManagementAkunResponse>(`/api/dashboard/akun${query}`, { signal });
}

export function updateAdminAkunRole(
  idAkun: number,
  input: UpdateAkunRoleInput,
): Promise<GenericAdminMutationResponse> {
  return apiRequest<GenericAdminMutationResponse>(`/api/dashboard/akun/${encodeURIComponent(idAkun)}/role`, {
    method: 'PATCH',
    body: input,
  });
}

export function updateAdminAkunStatus(
  idAkun: number,
  input: UpdateAkunStatusInput,
): Promise<GenericAdminMutationResponse> {
  return apiRequest<GenericAdminMutationResponse>(`/api/dashboard/akun/${encodeURIComponent(idAkun)}/status`, {
    method: 'PATCH',
    body: input,
  });
}

