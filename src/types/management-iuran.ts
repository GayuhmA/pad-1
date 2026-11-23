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

