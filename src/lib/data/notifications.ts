export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

// Demo clock and fixtures; replace together with API data when available.
export const NOTIFICATION_DEMO_NOW = Date.parse('2026-08-16T14:02:56+07:00');

export const NEXT_AGENDA = {
  title: 'Babak Penyisihan Tarik Tambang',
  location: 'Lapangan Utara, Jl. Sri Rejeki Utara',
  startsAt: '2026-08-16T16:00:00+07:00',
  endsAt: '2026-08-16T17:30:00+07:00',
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'penyisihan-tarik-tambang',
    title: 'Panggilan Babak Penyisihan Tarik Tambang!',
    message: 'Regu anda (Ketoprak Sedap Malam RT 07) dijadwalkan bertanding dengan RT 09 di lapangan utara pada pukul 16.00 WIB. Mohon seluruh anggota regu untuk hadir lebih awal agar dapat melakukan persiapan dan memastikan seluruh anggota telah berkumpul sebelum pertandingan dimulai. Jangan lupa membawa air minum dan mengenakan pakaian yang nyaman. Silakan menghubungi panitia di lokasi apabila membutuhkan informasi lebih lanjut.',
    createdAt: '2026-08-16T13:52:56+07:00',
    isRead: false,
  },
  {
    id: 'pengingat-iuran',
    title: 'Pengingat Pembayaran Iuran',
    message: 'Pembayaran iuran kegiatan untuk periode ini sudah dapat dilakukan melalui QRIS yang tersedia pada halaman pembayaran. Mohon warga melakukan pembayaran sesuai nominal tagihan dan memastikan transaksi berhasil. Setelah pembayaran selesai, silakan simpan bukti transaksi sebagai tanda pembayaran. Hubungi bendahara panitia apabila terdapat kendala dalam proses pembayaran.',
    createdAt: '2026-08-15T14:02:56+07:00',
    isRead: true,
  },
  {
    id: 'malam-tirakatan',
    title: 'Malam Tirakat 17 Agustus',
    message: 'Dalam rangka memperingati Hari Kemerdekaan Republik Indonesia, akan dilaksanakan kegiatan Malam Tirakatan pada tanggal 16 Agustus. Seluruh warga diharapkan dapat hadir dan mengikuti kegiatan bersama sebagai bentuk rasa syukur serta untuk mempererat kebersamaan antarwarga. Informasi mengenai waktu dan lokasi pelaksanaan akan disampaikan oleh panitia melalui pengumuman berikutnya.',
    createdAt: '2026-08-15T14:02:56+07:00',
    isRead: true,
  },
];
