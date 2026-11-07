import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendBeranda, BerandaServiceError } from '@/lib/server/beranda';

export const runtime = 'nodejs';

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new BerandaServiceError(401, 'Silakan masuk untuk melanjutkan.');
    const tanggalParam = request.nextUrl.searchParams.get('tanggal');
    if (tanggalParam !== null && !validDate(tanggalParam)) {
      throw new BerandaServiceError(422, 'Tanggal agenda harus menggunakan format YYYY-MM-DD.');
    }
    const tanggal = tanggalParam ?? undefined;
    return sessionResponse(await backendBeranda(token, tanggal));
  } catch (error) {
    if (error instanceof BerandaServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Layanan beranda sedang bermasalah. Silakan coba lagi.' }, 500);
  }
}
