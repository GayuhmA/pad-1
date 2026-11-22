import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendManagementLomba, ManagementLombaError } from '@/lib/server/management-lomba';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementLombaError(401, 'Silakan masuk untuk melanjutkan.');
    const roleParam = request.nextUrl.searchParams.get('role');
    const role = roleParam === 'admin' || roleParam === 'panitia' ? roleParam : undefined;
    return sessionResponse(await backendManagementLomba(token, role));
  } catch (error) {
    if (error instanceof ManagementLombaError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Layanan lomba sedang bermasalah. Silakan coba lagi.' }, 500);
  }
}

