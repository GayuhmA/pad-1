import { apiRequest } from '@/lib/api/client';
import type {
  CreateMatchInput,
  CreateMatchResponse,
  ManagementDashboardResponse,
  MatchOptionsResponse,
} from '@/types/dashboard';

export function getManagementDashboard(tanggal?: string, role?: string, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (tanggal) params.set('tanggal', tanggal);
  if (role) params.set('role', role);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ManagementDashboardResponse>(`/api/dashboard${query}`, { signal });
}

export function getMatchOptions(signal?: AbortSignal) {
  return apiRequest<MatchOptionsResponse>('/api/pertandingan/options', { signal });
}

export function createMatch(input: CreateMatchInput) {
  return apiRequest<CreateMatchResponse>('/api/pertandingan', { method: 'POST', body: input });
}
