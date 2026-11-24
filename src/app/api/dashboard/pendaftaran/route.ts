import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import {
  backendGetManagementPendaftaran,
  ManagementPendaftaranError,
} from '@/lib/server/management-pendaftaran';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementPendaftaranError(401, 'Silakan masuk untuk melanjutkan.');

    const roleParam = request.nextUrl.searchParams.get('role');
    const role = roleParam === 'admin' || roleParam === 'panitia' ? roleParam : undefined;

    const statusParam = request.nextUrl.searchParams.get('status') ?? undefined;
    const searchParam = request.nextUrl.searchParams.get('search') ?? undefined;

    return sessionResponse(
      await backendGetManagementPendaftaran(token, role, {
        status: statusParam,
        search: searchParam,
      }),
    );
  } catch (error) {
    if (error instanceof ManagementPendaftaranError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Layanan pendaftaran sedang bermasalah. Silakan coba lagi.' },
      500,
    );
  }
}

