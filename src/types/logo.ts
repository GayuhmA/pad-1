export type LogoStatus = 'Aktif' | 'Nonaktif';

export interface LogoHutRiItem {
  id_logo: number;
  tahun: number;
  nama_logo: string;
  gambar: string;
  status: LogoStatus;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ActiveLogoResponse {
  success: true;
  message: string;
  data: LogoHutRiItem | null;
}

export interface LogoListResponse {
  success: true;
  message: string;
  data: LogoHutRiItem[];
}

export interface LogoMutationResponse {
  success: true;
  message: string;
  data: LogoHutRiItem | null;
}

