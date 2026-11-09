export type StatusIuran = 'Belum Bayar' | 'Sudah Bayar';
export type StatusVerifikasiPembayaran = 'Menunggu' | 'Diterima' | 'Ditolak';

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
  nominal: number;
  jatuh_tempo: string;
  status: StatusIuran;
  periode: PeriodeIuran | null;
  pembayaran_terakhir: RingkasanPembayaranIuran | null;
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
