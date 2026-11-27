import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import { backendActivateAdminLogo } from '@/lib/server/logo';
import {
  handleLogoRouteError,
  parseLogoId,
  requireLogoSession,
} from '@/lib/server/logo-route-helpers';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const token = requireLogoSession(request, true);
    const { id } = await params;
    const idLogo = parseLogoId(id);
    return sessionResponse(await backendActivateAdminLogo(token, idLogo));
  } catch (error) {
    return handleLogoRouteError(error, 'Logo gagal diaktifkan. Silakan coba lagi.');
  }
}

