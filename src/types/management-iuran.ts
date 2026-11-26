export type PaymentStatus = 'Menunggu' | 'Lunas' | 'Belum Lunas';
export type FilterTab = 'Semua' | PaymentStatus;

export interface HouseholdPayment {
  id: number;
  id_pembayaran: number | null;
  name: string;
  phone: string;
  amount: number | null;
  date: string | null;
  status: PaymentStatus;
  proofUrl: string | null;
}

export interface ManagementIuranMetrics {
  totalCollected: number;
  waitingCount: number;
  paidCount: number;
  unpaidCount: number;
  totalHouseholds: number;
  progressPercentage: number;
}

export interface PaymentAccountSettings {
  id_pengaturan?: number;
  nama_bank: string | null;
  nomor_rekening: string | null;
  atas_nama: string | null;
  qris_image: string | null;
}

export interface ManagementIuranData {
  payments: HouseholdPayment[];
  metrics: ManagementIuranMetrics;
  settings: PaymentAccountSettings | null;
}

export interface ManagementIuranResponse {
  success: boolean;
  message: string;
  data: ManagementIuranData;
}

export interface VerifyPaymentInput {
  keputusan: 'Diterima' | 'Ditolak';
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  data: {
    id_pembayaran: number;
    status_verifikasi: 'Diterima' | 'Ditolak';
  };
}

export interface UpdatePaymentSettingsInput {
  nama_bank?: string;
  nomor_rekening?: string;
  atas_nama?: string;
  qris_image?: File | Blob | string | null;
}

export type TagihanTarget = 'Semua' | 'Tertentu';
export type TagihanActiveFilter = 'Semua' | 'Aktif' | 'Nonaktif';
export type TagihanPaymentStatusFilter = 'Semua' | 'Belum Bayar' | 'Sudah Bayar';

export interface PeriodeOption {
  id_periode: number;
  tahun: string;
  judul: string;
  status: string;
}

export interface WargaSelectOption {
  id_warga: number;
  nama: string;
  nomor_rt: string | null;
  nomor_rw: string | null;
  no_hp: string | null;
}

export interface TagihanFormOptionsResponse {
  success: boolean;
  message: string;
  data: {
    periodes: PeriodeOption[];
    wargaOptions: WargaSelectOption[];
    canSelectSpecificWarga: boolean;
  };
}

export interface TagihanPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ManagementTagihanItem {
  id_tagihan: number;
  id_periode: number;
  nama_tagihan: string;
  nominal: number;
  jatuh_tempo: string;
  keterangan: string | null;
  target: TagihanTarget;
  is_aktif: boolean;
  periode_label: string | null;
  total_warga: number | null;
  sudah_bayar: number | null;
  belum_bayar: number | null;
  created_at: string | null;
}

export interface ManagementTagihanListResponse {
  success: boolean;
  message: string;
  data: ManagementTagihanItem[];
  meta: TagihanPaginationMeta;
}

export interface TagihanStatistik {
  total_warga: number;
  sudah_bayar: number;
  belum_bayar: number;
  nominal_terkumpul: number;
}

export interface TagihanWargaPaymentItem {
  id_iuran: number;
  id_warga: number | null;
  nama_kepala_keluarga: string;
  no_hp: string | null;
  nominal: number;
  status: string;
  jatuh_tempo: string | null;
  tanggal_bayar: string | null;
}

export interface ManagementTagihanDetailResponse {
  success: boolean;
  message: string;
  data: {
    tagihan: ManagementTagihanItem;
    statistik: TagihanStatistik;
    pembayaran: TagihanWargaPaymentItem[];
  };
}

export interface ManagementTagihanPaymentsResponse {
  success: boolean;
  message: string;
  data: TagihanWargaPaymentItem[];
  meta: TagihanPaginationMeta;
}

export interface CreateTagihanInput {
  nama_tagihan: string;
  id_periode: number;
  nominal: number;
  jatuh_tempo: string;
  keterangan?: string | null;
  target: TagihanTarget;
  id_warga?: number[];
}

export interface UpdateTagihanInput {
  nama_tagihan: string;
  nominal: number;
  jatuh_tempo: string;
  keterangan?: string | null;
}

export interface TagihanMutationResponse {
  success: boolean;
  message: string;
  data: ManagementTagihanItem | null;
}


