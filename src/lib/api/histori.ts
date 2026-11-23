import type {
  CreatePemenangInput,
  DaftarHistoriParams,
  DaftarHistoriResponse,
  DetailHistoriResponse,
  MutasiPemenangResponse,
  PeriodeHistoriItem,
  PesertaLombaOption,
  UpdateHistoriPeriodeInput,
  UpdatePemenangInput,
} from '@/types/histori';
import { apiRequest } from './client';

export function getDaftarHistori(
  params?: DaftarHistoriParams,
  signal?: AbortSignal,
): Promise<DaftarHistoriResponse> {
  const searchParams = new URLSearchParams();
  if (params?.tahun) {
    searchParams.set('tahun', String(params.tahun));
  }
  if (params?.search && params.search.trim()) {
    searchParams.set('search', params.search.trim());
  }
  const query = searchParams.toString();
  return apiRequest(`/api/warga/histori${query ? `?${query}` : ''}`, { signal });
}

export function getDetailHistori(
  idPeriode: number,
  search?: string,
  signal?: AbortSignal,
): Promise<DetailHistoriResponse> {
  const searchParams = new URLSearchParams();
  if (search && search.trim()) {
    searchParams.set('search', search.trim());
  }
  const query = searchParams.toString();
  return apiRequest(`/api/warga/histori/${idPeriode}${query ? `?${query}` : ''}`, { signal });
}

export function updateHistoriPeriode(
  idPeriode: number,
  body: UpdateHistoriPeriodeInput,
  signal?: AbortSignal,
): Promise<{ success: boolean; message: string; data: PeriodeHistoriItem }> {
  return apiRequest(`/api/dashboard/histori/${idPeriode}`, {
    method: 'PUT',
    body,
    signal,
  });
}

export function addPemenangLomba(
  idPeriode: number,
  idLomba: number,
  body: CreatePemenangInput,
  signal?: AbortSignal,
): Promise<MutasiPemenangResponse> {
  return apiRequest(`/api/dashboard/histori/${idPeriode}/lomba/${idLomba}/pemenang`, {
    method: 'POST',
    body,
    signal,
  });
}

export function updatePemenang(
  idPemenang: number,
  body: UpdatePemenangInput,
  signal?: AbortSignal,
): Promise<MutasiPemenangResponse> {
  return apiRequest(`/api/dashboard/pemenang/${idPemenang}`, {
    method: 'PUT',
    body,
    signal,
  });
}

export function deletePemenang(
  idPemenang: number,
  signal?: AbortSignal,
): Promise<{ success: boolean; message: string; data: null }> {
  return apiRequest(`/api/dashboard/pemenang/${idPemenang}`, {
    method: 'DELETE',
    signal,
  });
}

export function getPesertaLomba(
  idLomba: number,
  role?: string,
  signal?: AbortSignal,
): Promise<{ success: boolean; message: string; data: PesertaLombaOption[] }> {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  return apiRequest(`/api/dashboard/lomba/${idLomba}/peserta${query}`, {
    method: 'GET',
    signal,
  });
}
