import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  handleAdminRouteError,
  parseJsonObject,
  parsePositiveIntId,
  requireAdminSession,
  validateUpdateWargaBody,
} from '@/lib/server/admin-route-helpers';
import { backendDeactivateWarga, backendUpdateWarga } from '@/lib/server/management-admin';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = requireAdminSession(request, true);
    const { id } = await context.params;
    const idWarga = parsePositiveIntId(id, 'warga');
    const body = await parseJsonObject(request);
    const input = validateUpdateWargaBody(body);
    return sessionResponse(await backendUpdateWarga(token, idWarga, input));
  } catch (error) {
    return handleAdminRouteError(error, 'Data warga belum dapat diubah. Silakan coba lagi.');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = requireAdminSession(request, true);
    const { id } = await context.params;
    const idWarga = parsePositiveIntId(id, 'warga');
    return sessionResponse(await backendDeactivateWarga(token, idWarga));
  } catch (error) {
    return handleAdminRouteError(error, 'Data warga belum dapat dinonaktifkan. Silakan coba lagi.');
  }
}

