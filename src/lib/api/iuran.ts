import type {
  AjukanPembayaranIuranResponse,
  DaftarIuranResponse,
  DetailIuranResponse,
} from '@/types/iuran';
import { apiFormRequest, apiRequest } from './client';

export function getDaftarIuran(signal?: AbortSignal): Promise<DaftarIuranResponse> {
  return apiRequest('/api/warga/iuran', { signal });
}

export function getDetailIuran(idIuran: number, signal?: AbortSignal): Promise<DetailIuranResponse> {
  return apiRequest(`/api/warga/iuran/${idIuran}`, { signal });
}

export function ajukanPembayaranIuran(
  idIuran: number,
  input: { metode: string; nominal: number; buktiBayar: File },
  signal?: AbortSignal,
): Promise<AjukanPembayaranIuranResponse> {
  const body = new FormData();
  body.set('metode', input.metode);
  body.set('nominal', String(input.nominal));
  body.set('bukti_bayar', input.buktiBayar);
  return apiFormRequest(`/api/warga/iuran/${idIuran}/pembayaran`, body, {
    method: 'POST',
    signal,
  });
}
