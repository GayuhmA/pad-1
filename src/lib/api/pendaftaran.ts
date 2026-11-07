import type {
  BatalkanPendaftaranResponse,
  RiwayatPendaftaranResponse,
} from '@/types/pendaftaran';
import { apiRequest } from './client';

export function getRiwayatPendaftaran(signal?: AbortSignal): Promise<RiwayatPendaftaranResponse> {
  return apiRequest('/api/warga/pendaftaran', { signal });
}

export function batalkanPendaftaran(
  idPendaftaran: number,
  signal?: AbortSignal,
): Promise<BatalkanPendaftaranResponse> {
  return apiRequest(`/api/warga/pendaftaran/${idPendaftaran}`, {
    method: 'DELETE',
    signal,
  });
}
