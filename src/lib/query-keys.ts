export const queryKeys = {
  beranda: (date?: string | null) => ['beranda', date ?? 'default'] as const,
  lomba: (userId?: number | null) => ['lomba', userId ?? 'guest'] as const,
  pendaftaran: (userId?: number | null) => ['pendaftaran', userId ?? 'guest'] as const,
  wargaIuran: (userId?: number | null) => ['warga-iuran', userId ?? 'guest'] as const,
  wargaIuranAktif: (userId?: number | null) => ['warga-iuran-aktif', userId ?? 'guest'] as const,
  transparansiIuran: (params: { page: number; status: string; search: string }) =>
    ['transparansi-iuran', params] as const,
  pengaturanPembayaran: ['pengaturan-pembayaran'] as const,
  historiList: ['histori', 'list'] as const,
  historiDetail: (id: number) => ['histori', 'detail', id] as const,
  albums: (periodeId?: number | null) => ['albums', periodeId ?? 'all'] as const,
  notifikasi: (userId?: number | null) => ['notifikasi', userId ?? 'guest'] as const,
  notifikasiUnread: (userId?: number | null) => ['notifikasi-unread', userId ?? 'guest'] as const,
  kontakPengurus: (userId?: number | null) => ['kontak-pengurus', userId ?? 'guest'] as const,

  managementDashboard: (userId?: number | null) =>
    ['management', 'dashboard', userId ?? 'anon'] as const,
  managementMatchOptions: ['management', 'match-options'] as const,
  managementLomba: (userId?: number | null) =>
    ['management', 'lomba', userId ?? 'anon'] as const,
  managementLombaPeserta: (id: number) =>
    ['management', 'lomba-peserta', id] as const,
  managementPendaftaran: (params: { status?: string; search?: string; id_lomba?: number }) =>
    ['management', 'pendaftaran', params] as const,
  managementIuran: (params: { status?: string; search?: string; per_page?: number }) =>
    ['management', 'iuran', params] as const,
  managementTagihan: (params: { search?: string; is_aktif?: string; id_periode?: number; page?: number; per_page?: number }) =>
    ['management', 'tagihan', params] as const,
  managementTagihanOptions: ['management', 'tagihan-options'] as const,
  managementTagihanDetail: (id: number) =>
    ['management', 'tagihan-detail', id] as const,
  managementTagihanPembayaran: (id: number, params: { status?: string; page?: number; per_page?: number }) =>
    ['management', 'tagihan-pembayaran', id, params] as const,
  managementWarga: (params: { search?: string; id_rt?: number | ''; status?: string }) =>
    ['management', 'warga', params] as const,
  managementAkun: (params: { search?: string; role?: string; status?: string }) =>
    ['management', 'akun', params] as const,
  managementPesan: (userId?: number | null) =>
    ['management', 'pesan', userId ?? 'anon'] as const,
  managementDokumentasi: ['management', 'dokumentasi'] as const,
  managementHistoriList: ['management', 'histori', 'list'] as const,
  managementHistoriDetail: (id: number) =>
    ['management', 'histori', 'detail', id] as const,
} as const;

