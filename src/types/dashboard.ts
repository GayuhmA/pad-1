export interface DashboardSummary {
  total_lomba: number;
  lomba_berlangsung: number;
  total_pendaftar: number;
  pembayaran_lunas: number;
  pembayaran_belum_lunas: number;
}

export interface DashboardMatch {
  id_pertandingan: number;
  id_lomba: number;
  nama_lomba: string;
  lokasi: string | null;
  babak: string | null;
  peserta_1: string;
  peserta_2: string;
  waktu_mulai: string;
  waktu_selesai: string | null;
  status: 'Berlangsung';
}

export interface DashboardAgenda {
  id_jadwal: number;
  id_lomba: number;
  nama_lomba: string;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  lokasi: string | null;
}

export interface ManagementDashboardData {
  tanggal_filter: string;
  ringkasan: DashboardSummary;
  sedang_berlangsung: DashboardMatch[];
  agenda: DashboardAgenda[];
}

export interface ManagementDashboardResponse {
  success: true;
  message: string;
  data: ManagementDashboardData;
}

export interface MatchOptionsData {
  lomba: Array<{
    id_lomba: number;
    nama_lomba: string;
    jenis_pendaftaran: 'Individu' | 'Beregu';
  }>;
  jadwal: Array<{
    id_jadwal: number;
    id_lomba: number;
    nama_lomba: string;
    tanggal: string;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
    lokasi: string | null;
  }>;
}

export interface MatchOptionsResponse {
  success: true;
  message: string;
  data: MatchOptionsData;
}

export interface CreateMatchInput {
  id_lomba: number;
  id_jadwal?: number | null;
  peserta_1: string;
  peserta_2: string;
  babak?: string | null;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai?: string | null;
  status?: 'Dijadwalkan' | 'Berlangsung' | 'Selesai';
}

export interface CreateMatchResponse {
  success: true;
  message: string;
  data: Record<string, unknown>;
}
