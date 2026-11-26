import { NextRequest } from 'next/server';
import { AuthServiceError, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendGetKontakPengurus } from '@/lib/server/profile';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      throw new AuthServiceError(401, 'Silakan masuk untuk melanjutkan.');
    }
    return sessionResponse(await backendGetKontakPengurus(token));
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Kontak pengurus belum dapat dimuat.' }, 500);
  }
}

