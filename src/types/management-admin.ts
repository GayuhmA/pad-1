export type AccountStatus = 'Aktif' | 'Nonaktif';
export type GenderCode = 'L' | 'P';
export type AdminRoleName = 'Admin' | 'Panitia' | 'Warga';

export interface RwItem {
  id_rw: number;
  nomor_rw: string;
  nama_rw: string;
  nama_ketua: string | null;
  nomor_whatsapp: string | null;
  jumlah_rt: number | null;
}

export interface RtItem {
  id_rt: number;
  id_rw: number;
  nomor_rt: string;
  nama_rt: string;
  nama_ketua: string | null;
  nomor_whatsapp: string | null;
  nomor_rw: string | null;
  nama_rw: string | null;
  jumlah_warga: number | null;
}

export interface WargaItem {
  id_warga: number;
  id_rt: number | null;
  nik: string;
  nama: string;
  jenis_kelamin: GenderCode;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  no_hp: string | null;
  alamat: string | null;
  status: AccountStatus;
  nomor_rt: string | null;
  nama_rt: string | null;
  nomor_rw: string | null;
  nama_rw: string | null;
  id_akun: number | null;
  username: string | null;
  role_name: string | null;
}

export interface CreatedAccountInfo {
  id_akun: number | null;
  username: string | null;
  password_awal: string | null;
  role_name: string | null;
}

export interface AkunItem {
  id_akun: number;
  username: string;
  nama: string;
  nik: string | null;
  no_hp: string | null;
  id_role: number;
  nama_role: string;
  status: AccountStatus;
  wilayah: string | null;
}

export interface RoleOption {
  id_role: number;
  nama_role: AdminRoleName;
}

export interface WargaMetrics {
  totalWarga: number;
  aktifCount: number;
  nonaktifCount: number;
  totalRt: number;
}

export interface AkunMetrics {
  totalAkun: number;
  panitiaCount: number;
  wargaCount: number;
  aktifCount: number;
}

export interface ManagementWargaResponse {
  success: true;
  message: string;
  data: {
    warga: WargaItem[];
    rtList: RtItem[];
    rwList: RwItem[];
    metrics: WargaMetrics;
  };
}

export interface CreateWargaInput {
  id_rt: number;
  nik: string;
  nama: string;
  jenis_kelamin: GenderCode;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  no_hp?: string;
  alamat?: string;
  status?: AccountStatus;
}

export type UpdateWargaInput = Partial<CreateWargaInput>;

export interface CreateWargaResponse {
  success: true;
  message: string;
  data: {
    warga: WargaItem | null;
    account: CreatedAccountInfo | null;
  };
}

export interface UpdateWargaResponse {
  success: true;
  message: string;
  data: WargaItem | null;
}

export interface CreateRtInput {
  id_rw: number;
  nomor_rt: string;
  nama_rt?: string | null;
  nama_ketua?: string | null;
  nomor_whatsapp?: string | null;
}

export type UpdateRtInput = Partial<CreateRtInput>;

export interface CreateRwInput {
  nomor_rw: string;
  nama_rw?: string | null;
  nama_ketua?: string | null;
  nomor_whatsapp?: string | null;
}

export interface UpdateRwInput {
  nama_ketua?: string | null;
  nomor_whatsapp?: string | null;
}

export interface ManagementRtRwResponse {
  success: true;
  message: string;
  data: {
    rtList: RtItem[];
    rwList: RwItem[];
  };
}

export interface ManagementAkunResponse {
  success: true;
  message: string;
  data: {
    akun: AkunItem[];
    roleOptions: RoleOption[];
    metrics: AkunMetrics;
  };
}

export interface UpdateAkunRoleInput {
  id_role: number;
}

export interface UpdateAkunStatusInput {
  status: AccountStatus;
}

export interface GenericAdminMutationResponse {
  success: true;
  message: string;
}

