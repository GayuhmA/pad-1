import { NextRequest } from 'next/server';
import { jakartaToday } from '@/lib/lomba-date';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import {
  backendAvailableScheduleDates,
  backendBeranda,
  backendPublicBeranda,
  BerandaServiceError,
  pickDefaultScheduleDate,
} from '@/lib/server/beranda';

export const runtime = 'nodejs';

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

async function fetchBerandaWithFallback(token: string | undefined, tanggal?: string) {
  if (token) {
    try {
      return await backendBeranda(token, tanggal);
    } catch (error) {
      if (!(error instanceof BerandaServiceError) || (error.status !== 401 && error.status !== 403)) {
        throw error;
      }
    }
  }
  return backendPublicBeranda(tanggal);
}

export async function GET(request: NextRequest) {
  try {
    const tanggalParam = request.nextUrl.searchParams.get('tanggal');
    if (tanggalParam !== null && !validDate(tanggalParam)) {
      throw new BerandaServiceError(422, 'Tanggal agenda harus menggunakan format YYYY-MM-DD.');
    }
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    const availableDates = await backendAvailableScheduleDates();
    const effectiveTanggal = tanggalParam
      ?? pickDefaultScheduleDate(availableDates, jakartaToday());

    const result = await fetchBerandaWithFallback(token, effectiveTanggal);
    if (!result.data.tanggal_tersedia?.length && availableDates.length > 0) {
      result.data.tanggal_tersedia = availableDates;
    }

    return sessionResponse(result);
  } catch (error) {
    if (error instanceof BerandaServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Layanan beranda sedang bermasalah. Silakan coba lagi.' }, 500);
  }
}
