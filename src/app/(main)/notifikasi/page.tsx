import type { Metadata } from 'next';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export const metadata: Metadata = {
  title: 'Notifikasi | PAD',
  description: 'Lihat agenda berikutnya, pengingat, dan pengumuman kegiatan warga.',
};

export default function NotificationPage() {
  return <NotificationCenter />;
}
