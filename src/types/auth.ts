/** Normalized account exposed to the UI. The Sanctum token stays on the server. */
export interface User {
  id: number;
  username: string;
  nama: string;
  role: string;
  phone: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat: string | null;
  nomor_rt: string | null;
  nomor_rw: string | null;
  is_active: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SessionResponse {
  user: User;
}

export interface LogoutResponse {
  message: string;
}
