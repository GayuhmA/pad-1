import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  handleAdminRouteError,
  parseJsonObject,
  requireAdminSession,
  validateCreateWargaBody,
} from '@/lib/server/admin-route-helpers';
import { backendCreateWarga, backendGetAdminWarga } from '@/lib/server/management-admin';
import type { AccountStatus } from '@/types/management-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = requireAdminSession(request);
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') ?? undefined;
    const idRtParam = searchParams.get('id_rt');
    const id_rt = idRtParam && /^\d+$/.test(idRtParam) ? Number(idRtParam) : undefined;
    const statusParam = searchParams.get('status');
    const status: AccountStatus | undefined =
      statusParam === 'Aktif' || statusParam === 'Nonaktif' ? statusParam : undefined;

    return sessionResponse(await backendGetAdminWarga(token, { search, id_rt, status }));
  } catch (error) {
    return handleAdminRouteError(error, 'Data warga belum dapat dimuat. Silakan coba lagi.');
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = requireAdminSession(request, true);
    const body = await parseJsonObject(request);
    const input = validateCreateWargaBody(body);
    return sessionResponse(await backendCreateWarga(token, input), 201);
  } catch (error) {
    return handleAdminRouteError(error, 'Data warga belum dapat ditambahkan. Silakan coba lagi.');
  }
}

