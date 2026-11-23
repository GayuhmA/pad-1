export interface PeriodeHistoriItem {
  id_periode: number;
  tahun: string;
  judul: string;
  nama_kegiatan: string;
  deskripsi: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  status: string | null;
  logo: string | null;
  jumlah_lomba: number;
}

export interface PemenangLombaItem {
  id_pemenang?: number;
  tipe_pemenang?: 'Individu' | 'Beregu' | string;
  peringkat?: number;
  nama_pemenang: string;
  keterangan?: string | null;
}

export interface LombaHistoriItem {
  id_lomba: number;
  nama_lomba: string;
  kategori: 'Umum' | 'Anak-anak' | 'Dewasa' | string;
  jenis_pendaftaran: 'Individu' | 'Beregu' | string;
  jumlah_peserta: number;
  jumlah_regu: number;
  lokasi: string[];
  pemenang: PemenangLombaItem[];
}

export interface DetailHistoriPeriode extends PeriodeHistoriItem {
  lomba: LombaHistoriItem[];
}

export interface DaftarHistoriResponse {
  success: true;
  message: string;
  data: PeriodeHistoriItem[];
}

export interface DetailHistoriResponse {
  success: true;
  message: string;
  data: DetailHistoriPeriode;
}

export interface DaftarHistoriParams {
  tahun?: number | string;
  search?: string;
}

export interface UpdateHistoriPeriodeInput {
  tahun?: number;
  nama_kegiatan?: string;
  deskripsi?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  status?: string;
  logo?: string;
}

export interface CreatePemenangInput {
  tipe_pemenang: 'Individu' | 'Beregu' | string;
  peringkat: number;
  id_pendaftaran?: number | null;
  id_tim?: number | null;
  nama_pemenang?: string | null;
  keterangan?: string | null;
}

export interface UpdatePemenangInput {
  tipe_pemenang?: 'Individu' | 'Beregu' | string;
  peringkat?: number;
  id_pendaftaran?: number | null;
  id_tim?: number | null;
  nama_pemenang?: string | null;
  keterangan?: string | null;
}

export interface MutasiPemenangResponse {
  success: boolean;
  message: string;
  data: {
    id_pemenang: number;
    peringkat: number;
    tipe_pemenang: string;
    nama_pemenang: string;
    id_pendaftaran?: number | null;
    id_tim?: number | null;
    keterangan?: string | null;
  } | null;
}

export interface PesertaLombaOption {
  id_pendaftaran: number;
  nama: string;
  nama_tim?: string | null;
  status: string;
}

