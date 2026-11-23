import type {
  AjukanPembayaranIuranResponse,
  DaftarIuranResponse,
  DetailIuranResponse,
  PengaturanPembayaranResponse,
  TransparansiIuranParams,
  TransparansiIuranResponse,
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

export function getTransparansiIuran(
  params?: TransparansiIuranParams,
  signal?: AbortSignal,
): Promise<TransparansiIuranResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== 'Semua') {
    searchParams.set('status', params.status);
  }
  if (params?.search && params.search.trim()) {
    searchParams.set('search', params.search.trim());
  }
  if (params?.page && Number.isSafeInteger(params.page) && params.page > 0) {
    searchParams.set('page', String(params.page));
  }
  if (params?.per_page && Number.isSafeInteger(params.per_page) && params.per_page > 0) {
    searchParams.set('per_page', String(params.per_page));
  }
  if (params?.id_periode && Number.isSafeInteger(params.id_periode) && params.id_periode > 0) {
    searchParams.set('id_periode', String(params.id_periode));
  }
  const query = searchParams.toString();
  return apiRequest(`/api/warga/iuran/transparansi${query ? `?${query}` : ''}`, { signal });
}

export function getPengaturanPembayaran(signal?: AbortSignal): Promise<PengaturanPembayaranResponse> {
  return apiRequest('/api/pengaturan-pembayaran', { signal });
}
