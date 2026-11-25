import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  handleAdminRouteError,
  requireAdminSession,
} from '@/lib/server/admin-route-helpers';
import { backendGetAdminRtRw } from '@/lib/server/management-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = requireAdminSession(request);
    return sessionResponse(await backendGetAdminRtRw(token));
  } catch (error) {
    return handleAdminRouteError(error, 'Data RW belum dapat dimuat.');
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdminSession(request, true);
    const response = sessionResponse(
      { message: 'Penambahan data RW dinonaktifkan. Data RW mengikuti konfigurasi backend.' },
      405,
    );
    response.headers.set('Allow', 'GET');
    return response;
  } catch (error) {
    return handleAdminRouteError(error, 'Data RW tidak dapat ditambahkan.');
  }
}

