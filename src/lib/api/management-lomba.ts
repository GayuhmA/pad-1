import { apiRequest } from '@/lib/api/client';
import type { ManagementLombaResponse } from '@/types/management-lomba';

export function getManagementLomba(role?: string, signal?: AbortSignal) {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  return apiRequest<ManagementLombaResponse>(`/api/dashboard/lomba${query}`, { signal });
}

