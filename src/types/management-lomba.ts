export type CompetitionStatus = 'Berlangsung' | 'Mendatang' | 'Selesai';
export type CompetitionKind = 'Regu' | 'Individu';

export interface ManagementMatch {
  teamOne: string;
  teamTwo: string;
  time: string;
  status: CompetitionStatus;
}

export interface ManagementCompetition {
  id: string;
  name: string;
  kind: CompetitionKind;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  registered: number;
  capacity: number;
  status: CompetitionStatus;
  matches: ManagementMatch[];
}

export interface ManagementArchivedCompetition {
  id: string;
  name: string;
  category: string;
  participantCount: number;
  location: string;
}

export interface ManagementLombaData {
  competitions: ManagementCompetition[];
  archived: ManagementArchivedCompetition[];
}

export interface ManagementLombaResponse {
  success: boolean;
  message: string;
  data: ManagementLombaData;
}

