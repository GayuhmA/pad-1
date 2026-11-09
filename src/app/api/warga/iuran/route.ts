import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendDaftarIuran, IuranServiceError } from '@/lib/server/iuran';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new IuranServiceError(401, 'Silakan masuk untuk melanjutkan.');
    return sessionResponse(await backendDaftarIuran(token));
  } catch (error) {
    if (error instanceof IuranServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Layanan iuran sedang bermasalah. Silakan coba lagi.' }, 500);
  }
}
