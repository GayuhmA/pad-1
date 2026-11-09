import { apiRequest } from '@/lib/api/client';
import type {
  CreateMatchInput,
  CreateMatchResponse,
  ManagementDashboardResponse,
  MatchOptionsResponse,
} from '@/types/dashboard';

export function getManagementDashboard(tanggal?: string, signal?: AbortSignal) {
  const query = tanggal ? `?tanggal=${encodeURIComponent(tanggal)}` : '';
  return apiRequest<ManagementDashboardResponse>(`/api/dashboard${query}`, { signal });
}

export function getMatchOptions(signal?: AbortSignal) {
  return apiRequest<MatchOptionsResponse>('/api/pertandingan/options', { signal });
}

export function createMatch(input: CreateMatchInput) {
  return apiRequest<CreateMatchResponse>('/api/pertandingan', { method: 'POST', body: input });
}
