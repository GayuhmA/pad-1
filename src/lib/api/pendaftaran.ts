import type { RiwayatPendaftaranResponse } from '@/types/pendaftaran';
import { apiRequest } from './client';

export function getRiwayatPendaftaran(signal?: AbortSignal): Promise<RiwayatPendaftaranResponse> {
  return apiRequest('/api/warga/pendaftaran', { signal });
}
