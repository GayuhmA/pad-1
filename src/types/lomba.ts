export type JenisPendaftaran = 'Individu' | 'Beregu';

export interface KategoriLomba {
  id_kategori: number;
  nama_kategori: string;
}

export interface JadwalLomba {
  id_jadwal: number;
  tanggal: string;
  waktu_mulai: string | null;
  waktu_selesai: string | null;
  lokasi: string | null;
  status_jadwal: string;
}

export interface Lomba {
  id_lomba: number;
  nama_lomba: string;
  jenis_pendaftaran: JenisPendaftaran;
  status: string;
  deskripsi: string | null;
  kategori: KategoriLomba | null;
  kapasitas_peserta: number | null;
  batas_anggota_tim: number | null;
  sudah_mendaftar: boolean;
  jadwal: JadwalLomba[];
}

export interface DaftarLombaResponse {
  success: true;
  message: string;
  data: Lomba[];
  tanggal_tersedia: string[];
}

export interface PendaftaranLombaResponse {
  success: true;
  message: string;
}
