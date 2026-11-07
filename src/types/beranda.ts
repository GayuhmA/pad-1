export interface BerandaBanner {
  id_periode: number;
  judul: string;
  tahun: string;
  deskripsi: string;
  logo: string | null;
}

export interface BerandaAgenda {
  id_jadwal: number;
  id_lomba: number;
  nama_lomba: string;
  nama_kategori: string;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  lokasi: string;
}

export interface BerandaPengumuman {
  id_pengumuman: number;
  judul: string;
  isi: string;
  tanggal_publikasi: string;
}

export interface BerandaPertandingan {
  id_pertandingan: number;
  id_lomba: number;
  nama_lomba: string;
  peserta_1: string;
  peserta_2: string;
  babak: string;
  waktu_mulai: string;
  waktu_selesai: string;
  status: string;
  lokasi: string;
}

export interface BerandaData {
  banner: BerandaBanner | null;
  tanggal_filter: string;
  jadwal_agenda: BerandaAgenda[];
  pengumuman_terbaru: BerandaPengumuman | null;
  sedang_berlangsung: BerandaPertandingan[];
}

export interface BerandaResponse {
  success: true;
  message: string;
  data: BerandaData;
}
