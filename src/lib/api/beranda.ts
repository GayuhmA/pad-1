import type { BerandaResponse } from '@/types/beranda';
import { apiRequest } from './client';

export function getBeranda(tanggal?: string, signal?: AbortSignal): Promise<BerandaResponse> {
  const query = tanggal ? `?tanggal=${encodeURIComponent(tanggal)}` : '';
  return apiRequest(`/api/warga/beranda${query}`, { signal });
}
