import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  handleAdminRouteError,
  parseJsonObject,
  parsePositiveIntId,
  requireAdminSession,
} from '@/lib/server/admin-route-helpers';
import { backendUpdateAkunStatus, ManagementAdminError } from '@/lib/server/management-admin';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = requireAdminSession(request, true);
    const { id } = await context.params;
    const idAkun = parsePositiveIntId(id, 'akun');
    const body = await parseJsonObject(request);
    const { status } = body;
    if (status !== 'Aktif' && status !== 'Nonaktif') {
      throw new ManagementAdminError(422, 'Status akun harus berupa Aktif atau Nonaktif.');
    }

    return sessionResponse(await backendUpdateAkunStatus(token, idAkun, { status }));
  } catch (error) {
    return handleAdminRouteError(error, 'Status akun belum dapat diperbarui. Silakan coba lagi.');
  }
}

