import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import { backendCreateAdminLogo, backendGetAdminLogos } from '@/lib/server/logo';
import {
  buildValidatedLogoFormData,
  handleLogoRouteError,
  requireLogoSession,
} from '@/lib/server/logo-route-helpers';
import type { LogoStatus } from '@/types/logo';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = requireLogoSession(request);
    const search = request.nextUrl.searchParams.get('search') ?? undefined;
    const statusParam = request.nextUrl.searchParams.get('status');
    const status: LogoStatus | undefined =
      statusParam === 'Aktif' || statusParam === 'Nonaktif' ? statusParam : undefined;
    return sessionResponse(await backendGetAdminLogos(token, { search, status }));
  } catch (error) {
    return handleLogoRouteError(error, 'Daftar logo gagal dimuat. Silakan coba lagi.');
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = requireLogoSession(request, true);
    const formData = await buildValidatedLogoFormData(request, 'create');
    return sessionResponse(await backendCreateAdminLogo(token, formData), 201);
  } catch (error) {
    return handleLogoRouteError(error, 'Logo gagal ditambahkan. Silakan coba lagi.');
  }
}

