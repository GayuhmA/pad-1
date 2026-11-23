import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendGetManagementIuran, ManagementIuranError } from '@/lib/server/management-iuran';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementIuranError(401, 'Silakan masuk untuk melanjutkan.');

    const status = request.nextUrl.searchParams.get('status') ?? undefined;
    const search = request.nextUrl.searchParams.get('search') ?? undefined;
    const perPage = request.nextUrl.searchParams.get('per_page');

    return sessionResponse(
      await backendGetManagementIuran(token, {
        status,
        search,
        per_page: perPage ? Number(perPage) : undefined,
      }),
    );
  } catch (error) {
    if (error instanceof ManagementIuranError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Layanan iuran sedang bermasalah. Silakan coba lagi.' },
      500,
    );
  }
}

