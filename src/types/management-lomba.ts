export type CompetitionStatus = 'Berlangsung' | 'Mendatang' | 'Selesai';
export type CompetitionKind = 'Regu' | 'Individu';
export type RegistrationOpenStatus = 'Dibuka' | 'Ditutup';

export interface LombaCategoryOption {
  id_kategori: number;
  nama_kategori: string;
}

export interface ManagementMatch {
  teamOne: string;
  teamTwo: string;
  time: string;
  status: CompetitionStatus;
}

export interface ManagementCompetition {
  id: string;
  id_lomba: number;
  id_kategori: number | null;
  name: string;
  kind: CompetitionKind;
  category: string;
  registrationStatus: RegistrationOpenStatus;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  registered: number;
  capacity: number | null;
  teamMemberLimit: number | null;
  status: CompetitionStatus;
  matches: ManagementMatch[];
}

export interface ManagementArchivedCompetition {
  id: string;
  id_lomba: number;
  name: string;
  kind: CompetitionKind;
  category: string;
  participantCount: number;
  location: string;
  date: string | null;
  status: CompetitionStatus;
}

export interface ManagementLombaStatistik {
  total_lomba: number;
  lomba_berlangsung: number;
  lomba_mendatang: number;
  lomba_selesai: number;
}

export interface ManagementLombaData {
  competitions: ManagementCompetition[];
  archived: ManagementArchivedCompetition[];
  categories: LombaCategoryOption[];
  statistik: ManagementLombaStatistik;
}

export interface ManagementLombaResponse {
  success: boolean;
  message: string;
  data: ManagementLombaData;
}

export interface LombaSchedulePayload {
  tanggal: string;
  waktu_mulai?: string;
  waktu_selesai?: string;
  lokasi?: string;
}

export interface SaveManagementLombaInput {
  id_kategori: number;
  nama_lomba: string;
  jenis_pendaftaran: 'Individu' | 'Beregu';
  status: RegistrationOpenStatus;
  deskripsi?: string;
  kapasitas_peserta?: number | null;
  batas_anggota_tim?: number | null;
  jadwal: LombaSchedulePayload[];
}

export interface ManagementLombaMutationResponse {
  success: true;
  message: string;
  data?: {
    status?: RegistrationOpenStatus;
  };
}
