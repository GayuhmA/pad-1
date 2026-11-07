export interface ResidentProfile {
  name: string;
  username: string;
  role: string;
  birthPlace: string;
  birthDate: string;
  address: string;
  locality: string;
  phone: string;
}

export interface NeighborhoodContact {
  id: string;
  name: string;
  position: string;
  whatsapp: string | null;
}

