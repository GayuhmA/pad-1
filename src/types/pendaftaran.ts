import type { JenisPendaftaran, KategoriLomba } from './lomba';

export interface RiwayatJadwalLomba {
  id_jadwal: number;
  tanggal: string;
  waktu_mulai: string | null;
  waktu_selesai: string | null;
  lokasi: string | null;
}

export interface RingkasanLombaPendaftaran {
  id_lomba: number;
  nama_lomba: string;
  jenis_pendaftaran: JenisPendaftaran;
  kategori: KategoriLomba | null;
  jadwal: RiwayatJadwalLomba[];
}

export interface RiwayatPendaftaran {
  id_pendaftaran: number;
  tanggal_daftar: string;
  status: string;
  catatan: string | null;
  id_tim: number | null;
  nama_tim: string | null;
  jumlah_anggota: number;
  lomba: RingkasanLombaPendaftaran;
}

export interface RiwayatPendaftaranResponse {
  success: true;
  message: string;
  data: RiwayatPendaftaran[];
}
