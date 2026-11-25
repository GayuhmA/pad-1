import { apiRequest } from '@/lib/api/client';
import type {
  ManagementLombaMutationResponse,
  ManagementLombaResponse,
  SaveManagementLombaInput,
} from '@/types/management-lomba';

export function getManagementLomba(role?: string, signal?: AbortSignal) {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  return apiRequest<ManagementLombaResponse>(`/api/dashboard/lomba${query}`, { signal });
}

export function createManagementLomba(input: SaveManagementLombaInput): Promise<ManagementLombaMutationResponse> {
  return apiRequest<ManagementLombaMutationResponse>('/api/dashboard/lomba', {
    method: 'POST',
    body: input,
  });
}

export function updateManagementLomba(
  idLomba: number,
  input: SaveManagementLombaInput,
): Promise<ManagementLombaMutationResponse> {
  return apiRequest<ManagementLombaMutationResponse>(`/api/dashboard/lomba/${encodeURIComponent(idLomba)}`, {
    method: 'PUT',
    body: input,
  });
}

export function deleteManagementLomba(idLomba: number): Promise<ManagementLombaMutationResponse> {
  return apiRequest<ManagementLombaMutationResponse>(`/api/dashboard/lomba/${encodeURIComponent(idLomba)}`, {
    method: 'DELETE',
  });
}

export function archiveManagementLomba(idLomba: number): Promise<ManagementLombaMutationResponse> {
  return apiRequest<ManagementLombaMutationResponse>(`/api/dashboard/lomba/${encodeURIComponent(idLomba)}/arsip`, {
    method: 'PATCH',
  });
}

export function restoreManagementLomba(idLomba: number): Promise<ManagementLombaMutationResponse> {
  return apiRequest<ManagementLombaMutationResponse>(`/api/dashboard/lomba/${encodeURIComponent(idLomba)}/pulihkan`, {
    method: 'PATCH',
  });
}
