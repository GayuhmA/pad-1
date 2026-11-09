import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendManagementDashboard, ManagementDashboardError } from '@/lib/server/management-dashboard';

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
    if (!token) throw new ManagementDashboardError(401, 'Silakan masuk untuk melanjutkan.');
    const tanggal = request.nextUrl.searchParams.get('tanggal');
    if (tanggal !== null && !validDate(tanggal)) {
      throw new ManagementDashboardError(422, 'Tanggal agenda harus menggunakan format YYYY-MM-DD.');
    }
    return sessionResponse(await backendManagementDashboard(token, tanggal ?? undefined));
  } catch (error) {
    if (error instanceof ManagementDashboardError) {
      return sessionResponse({ message: error.message, ...(error.errors ? { errors: error.errors } : {}) }, error.status);
    }
    return sessionResponse({ message: 'Layanan dashboard sedang bermasalah. Silakan coba lagi.' }, 500);
  }
}
