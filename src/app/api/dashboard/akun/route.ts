import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import { handleAdminRouteError, requireAdminSession } from '@/lib/server/admin-route-helpers';
import { backendGetAdminAkun } from '@/lib/server/management-admin';
import type { AccountStatus } from '@/types/management-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = requireAdminSession(request);
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') ?? undefined;
    const role = searchParams.get('role') ?? undefined;
    const statusParam = searchParams.get('status');
    const status: AccountStatus | undefined =
      statusParam === 'Aktif' || statusParam === 'Nonaktif' ? statusParam : undefined;
    const perPageParam = searchParams.get('per_page');
    const per_page = perPageParam && /^\d+$/.test(perPageParam) ? Number(perPageParam) : undefined;

    return sessionResponse(await backendGetAdminAkun(token, { search, role, status, per_page }));
  } catch (error) {
    return handleAdminRouteError(error, 'Daftar akun belum dapat dimuat. Silakan coba lagi.');
  }
}

