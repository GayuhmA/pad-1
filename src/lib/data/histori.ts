export const DEFAULT_PLACEHOLDER = "/images/placeholder.svg";

export interface AlbumItem {
  id: number;
  slug: string;
  kategori: "Umum" | "Anak-anak" | "Dewasa";
  tanggal: string;
  judul: string;
  image: string;
  deskripsi?: string;
}

export const DAFTAR_ALBUM: AlbumItem[] = [
  {
    id: 1,
    slug: "estafet-pingpong-air",
    kategori: "Anak-anak",
    tanggal: "16 Agustus 2025",
    judul: "Estafet Pingpong Air",
    image: DEFAULT_PLACEHOLDER,
    deskripsi: "Keseruan lomba estafet pingpong air kategori anak-anak di halaman balai desa.",
  },
  {
    id: 2,
    slug: "estafet-karet",
    kategori: "Umum",
    tanggal: "14 Agustus 2025",
    judul: "Estafet Karet",
    image: DEFAULT_PLACEHOLDER,
    deskripsi: "Antusiasme dan fokus para peserta lomba estafet karet dengan sedotan.",
  },
  {
    id: 3,
    slug: "makan-kerupuk",
    kategori: "Anak-anak",
    tanggal: "13 Agustus 2025",
    judul: "Makan Kerupuk",
    image: DEFAULT_PLACEHOLDER,
    deskripsi: "Momen seru dan gelak tawa perlombaan makan kerupuk anak-anak.",
  },
  {
    id: 4,
    slug: "balap-karung-helm",
    kategori: "Umum",
    tanggal: "16 Agustus 2025",
    judul: "Balap Karung Helm",
    image: DEFAULT_PLACEHOLDER,
    deskripsi: "Lomba balap karung memakai helm yang mengundang tawa seluruh warga penonton.",
  },
  {
    id: 5,
    slug: "tarik-tambang",
    kategori: "Umum",
    tanggal: "17 Agustus 2025",
    judul: "Tarik Tambang",
    image: DEFAULT_PLACEHOLDER,
    deskripsi: "Adu kekuatan dan kekompakan tim regu warga dalam lomba tarik tambang.",
  },
  {
    id: 6,
    slug: "panjat-pinang",
    kategori: "Dewasa",
    tanggal: "15 Agustus 2025",
    judul: "Panjat Pinang",
    image: DEFAULT_PLACEHOLDER,
    deskripsi: "Gotong royong dan perjuangan para pemuda menaklukkan tiang panjat pinang.",
  },
];

export function getAlbumBySlug(slug: string) {
  return DAFTAR_ALBUM.find((album) => album.slug === slug);
}
