export type RegistrationStatus = 'Menunggu' | 'Diterima' | 'Ditolak' | 'Dibatalkan';
export type FilterTab = 'Semua' | RegistrationStatus;

export interface RegistrationItem {
  id: string;
  peserta: string;
  jenis: 'Individu' | 'Regu';
  nama_tim: string | null;
  lomba: string;
  no_telp: string;
  tanggal_daftar: string;
  status: RegistrationStatus;
}

export interface LombaQuotaItem {
  id: string;
  nama: string;
  terdaftar: number;
  kapasitas: number;
  jenis: 'peserta' | 'regu';
}

export interface ManagementPendaftaranData {
  registrations: RegistrationItem[];
  quotas: LombaQuotaItem[];
  metrics: {
    total: number;
    menunggu: number;
    diterima: number;
    ditolak: number;
    dibatalkan: number;
  };
}

export interface ManagementPendaftaranResponse {
  success: boolean;
  message: string;
  data: ManagementPendaftaranData;
}

export interface UpdateRegistrationStatusInput {
  status: 'Diterima' | 'Ditolak';
  catatan?: string | null;
}

export interface UpdateRegistrationStatusResponse {
  success: boolean;
  message: string;
  data: {
    id_pendaftaran: number;
    status: RegistrationStatus;
  };
}

