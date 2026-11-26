export type StatusIuran = 'Belum Bayar' | 'Sudah Bayar';
export type StatusVerifikasiPembayaran = 'Menunggu' | 'Diterima' | 'Ditolak';
export type StatusTransparansiIuran = 'Lunas' | 'Belum Lunas' | 'Menunggu Konfirmasi';

export interface PeriodeIuran {
  id_periode: number;
  tahun: string | null;
  nama_kegiatan: string | null;
}

export interface RingkasanPembayaranIuran {
  id_pembayaran: number;
  tanggal_bayar: string;
  nominal: number;
  metode: string | null;
  status_verifikasi: StatusVerifikasiPembayaran;
  tanggal_verifikasi: string | null;
}

export interface TagihanIuran {
  id_iuran: number;
  nama_iuran?: string;
  keterangan?: string | null;
  is_aktif?: boolean;
  nominal: number;
  jatuh_tempo: string;
  status: StatusIuran;
  periode: PeriodeIuran | null;
  pembayaran_terakhir: RingkasanPembayaranIuran | null;
}

export interface ActiveIuranOption {
  id_iuran: number;
  nama_iuran: string;
  nominal: number;
  jatuh_tempo: string;
  nama_kepala_keluarga: string;
}

export interface DaftarIuranAktifResponse {
  success: true;
  message: string;
  data: ActiveIuranOption[];
}

export interface DaftarIuranResponse {
  success: true;
  message: string;
  data: TagihanIuran[];
}

export interface DetailIuran extends TagihanIuran {
  pembayaran: RingkasanPembayaranIuran[];
}

export interface DetailIuranResponse {
  success: true;
  message: string;
  data: DetailIuran;
}

export interface AjukanPembayaranIuranResponse {
  success: true;
  message: string;
}

export interface TransparansiIuranItem {
  id_iuran: number;
  id_periode: number;
  periode: PeriodeIuran | null;
  nama_kepala_keluarga: string;
  nominal: number;
  status: StatusTransparansiIuran;
  waktu_pembayaran: string | null;
}

export interface TransparansiPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: TransparansiIuranItem[];
}

export interface TransparansiIuranResponse {
  success: true;
  message: string;
  data: TransparansiPagination;
}

export interface TransparansiIuranParams {
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
  id_periode?: number;
}

export interface PengaturanPembayaranData {
  id_pengaturan: number | null;
  nama_bank: string | null;
  nomor_rekening: string | null;
  atas_nama: string | null;
  qris_image: string | null;
}

export interface PengaturanPembayaranResponse {
  success: true;
  message: string;
  data: PengaturanPembayaranData | null;
}
