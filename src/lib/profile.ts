import type { User } from '@/types/auth';
import { type ResidentProfile } from '@/lib/data/profile';

export function getResidentProfile(user: User | null): ResidentProfile | null {
  if (!user) return null;
  return {
    name: user.nama,
    username: user.username,
    role: user.role.toLowerCase() === 'warga' ? 'Warga' : user.role,
    birthPlace: '',
    birthDate: '',
    address: '',
    locality: '',
    phone: user.phone ?? '',
  };
}

const birthDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
});

export function formatBirthDetails(place: string, date: string) {
  const parsed = date ? new Date(`${date}T00:00:00Z`) : null;
  const formatted = parsed && !Number.isNaN(parsed.getTime()) ? birthDateFormatter.format(parsed) : '';
  return [place, formatted].filter(Boolean).join(', ') || 'Belum diisi';
}

export function getWhatsAppUrl(phone: string | null) {
  if (!phone) return null;
  let digits = phone.replace(/[\s()+-]/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  if (!/^\d{10,15}$/.test(digits)) return null;
  return `https://wa.me/${digits}`;
}
