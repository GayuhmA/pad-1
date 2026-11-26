import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  handleAdminRouteError,
  parseJsonObject,
  parsePositiveIntId,
  requireAdminSession,
  validateUpdateRwBody,
} from '@/lib/server/admin-route-helpers';
import { backendUpdateRw } from '@/lib/server/management-admin';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = requireAdminSession(request, true);
    const { id } = await context.params;
    const idRw = parsePositiveIntId(id, 'RW');
    const body = await parseJsonObject(request);
    const input = validateUpdateRwBody(body);
    return sessionResponse(await backendUpdateRw(token, idRw, input));
  } catch (error) {
    return handleAdminRouteError(error, 'Data pengurus RW belum dapat diubah.');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireAdminSession(request, true);
    const { id } = await context.params;
    parsePositiveIntId(id, 'RW');
    const response = sessionResponse(
      { message: 'Penghapusan data RW dinonaktifkan. Data RW mengikuti konfigurasi backend.' },
      405,
    );
    response.headers.set('Allow', 'GET, PUT');
    return response;
  } catch (error) {
    return handleAdminRouteError(error, 'Data RW tidak dapat dihapus.');
  }
}
