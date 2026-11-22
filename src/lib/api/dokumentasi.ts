import { apiRequest } from '@/lib/api/client';
import type {
  CreateAlbumResponse,
  DeleteResponse,
  DetailAlbumResponse,
  DokumentasiListResponse,
  UploadMediaResponse,
} from '@/types/management-dokumentasi';

export function getAlbums(
  options?: { search?: string; id_periode?: number; id_lomba?: number },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams();
  if (options?.search?.trim()) params.set('search', options.search.trim());
  if (options?.id_periode) params.set('id_periode', String(options.id_periode));
  if (options?.id_lomba) params.set('id_lomba', String(options.id_lomba));
  const query = params.toString() ? `?${params.toString()}` : '';

  return apiRequest<DokumentasiListResponse>(`/api/dokumentasi${query}`, { signal });
}

export async function createAlbum(formData: FormData) {
  const response = await fetch('/api/dokumentasi', {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Gagal membuat album dokumentasi.');
  }
  return data as CreateAlbumResponse;
}

export function getAlbumDetail(idAlbum: number, signal?: AbortSignal) {
  return apiRequest<DetailAlbumResponse>(`/api/dokumentasi/${encodeURIComponent(idAlbum)}`, { signal });
}

export function updateAlbum(idAlbum: number, body: unknown) {
  return apiRequest<DetailAlbumResponse>(`/api/dokumentasi/${encodeURIComponent(idAlbum)}`, {
    method: 'PUT',
    body,
  });
}

export function deleteAlbum(idAlbum: number) {
  return apiRequest<DeleteResponse>(`/api/dokumentasi/${encodeURIComponent(idAlbum)}`, {
    method: 'DELETE',
  });
}

export async function uploadMedia(idAlbum: number, formData: FormData) {
  const response = await fetch(`/api/dokumentasi/${encodeURIComponent(idAlbum)}/media`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Gagal mengunggah media dokumentasi.');
  }
  return data as UploadMediaResponse;
}

export function deleteMedia(idAlbum: number, idMedia: number) {
  return apiRequest<DeleteResponse>(
    `/api/dokumentasi/${encodeURIComponent(idAlbum)}/media/${encodeURIComponent(idMedia)}`,
    {
      method: 'DELETE',
    },
  );
}

