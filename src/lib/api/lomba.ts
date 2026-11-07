import type { DaftarLombaResponse, PendaftaranLombaResponse } from '@/types/lomba';
import { apiRequest } from './client';

export function getDaftarLomba(signal?: AbortSignal): Promise<DaftarLombaResponse> {
  return apiRequest('/api/warga/lomba', { signal });
}

export function daftarLomba(idLomba: number, signal?: AbortSignal): Promise<PendaftaranLombaResponse> {
  return apiRequest('/api/warga/pendaftaran', {
    method: 'POST',
    body: { id_lomba: idLomba },
    signal,
  });
}
