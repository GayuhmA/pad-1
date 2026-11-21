import { apiRequest } from './client';

export interface UpdateProfilRequest {
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  no_hp: string;
}

export interface UpdateUsernameRequest {
  username: string;
  current_password: string;
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface UpdateProfilResponse {
  success: boolean;
  message: string;
}

export function updateProfil(body: UpdateProfilRequest): Promise<UpdateProfilResponse> {
  return apiRequest('/api/akun/profil', { method: 'PUT', body });
}

export function updateUsername(body: UpdateUsernameRequest): Promise<UpdateProfilResponse> {
  return apiRequest('/api/akun/username', { method: 'PUT', body });
}

export function updatePassword(body: UpdatePasswordRequest): Promise<UpdateProfilResponse> {
  return apiRequest('/api/akun/ubah-password', { method: 'PUT', body });
}

