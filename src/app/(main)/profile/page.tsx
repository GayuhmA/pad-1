import type { Metadata } from 'next';
import { ProfileContent } from '@/components/profile/ProfileContent';

export const metadata: Metadata = {
  title: 'Profil | PAD',
  description: 'Data diri warga, kontak pengurus RT dan RW, serta pengaturan akun.',
};

export default function ProfilePage() {
  return <ProfileContent />;
}
