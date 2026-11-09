import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendMatchOptions, ManagementDashboardError } from '@/lib/server/management-dashboard';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementDashboardError(401, 'Silakan masuk untuk melanjutkan.');
    return sessionResponse(await backendMatchOptions(token));
  } catch (error) {
    if (error instanceof ManagementDashboardError) {
      return sessionResponse({ message: error.message, ...(error.errors ? { errors: error.errors } : {}) }, error.status);
    }
    return sessionResponse({ message: 'Opsi pertandingan belum dapat dimuat.' }, 500);
  }
}
