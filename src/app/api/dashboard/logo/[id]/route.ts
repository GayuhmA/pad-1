import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import { backendDeleteAdminLogo, backendUpdateAdminLogo } from '@/lib/server/logo';
import {
  buildValidatedLogoFormData,
  handleLogoRouteError,
  parseLogoId,
  requireLogoSession,
} from '@/lib/server/logo-route-helpers';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const token = requireLogoSession(request, true);
    const { id } = await params;
    const idLogo = parseLogoId(id);
    const formData = await buildValidatedLogoFormData(request, 'update');
    return sessionResponse(await backendUpdateAdminLogo(token, idLogo, formData));
  } catch (error) {
    return handleLogoRouteError(error, 'Logo gagal diperbarui. Silakan coba lagi.');
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const token = requireLogoSession(request, true);
    const { id } = await params;
    const idLogo = parseLogoId(id);
    return sessionResponse(await backendDeleteAdminLogo(token, idLogo));
  } catch (error) {
    return handleLogoRouteError(error, 'Logo gagal dihapus. Silakan coba lagi.');
  }
}

