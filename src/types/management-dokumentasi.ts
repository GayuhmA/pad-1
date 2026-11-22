export interface MediaDokumentasi {
  id_dokumentasi: number;
  jenis_file: 'Foto' | 'Video';
  file: string;
  keterangan: string | null;
  created_at?: string;
}

export interface PeriodeDokumentasi {
  id_periode: number;
  tahun: string | number;
  nama_kegiatan: string;
}

export interface LombaDokumentasi {
  id_lomba: number;
  nama_lomba: string;
}

export interface AlbumDokumentasi {
  id_album: number;
  nama_album: string;
  tanggal_album: string;
  cover: string | null;
  jumlah_foto: number;
  jumlah_video: number;
  periode?: PeriodeDokumentasi | null;
  lomba?: LombaDokumentasi | null;
}

export interface DetailAlbumDokumentasi extends AlbumDokumentasi {
  media: MediaDokumentasi[];
}

export interface DokumentasiListResponse {
  success: boolean;
  message: string;
  data: AlbumDokumentasi[];
}

export interface DetailAlbumResponse {
  success: boolean;
  message: string;
  data: DetailAlbumDokumentasi;
}

export interface CreateAlbumResponse {
  success: boolean;
  message: string;
  data: AlbumDokumentasi;
}

export interface UploadMediaResponse {
  success: boolean;
  message: string;
  data: MediaDokumentasi;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  data: null;
}

