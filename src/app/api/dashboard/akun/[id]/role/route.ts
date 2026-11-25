import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  handleAdminRouteError,
  parseJsonObject,
  parsePositiveIntId,
  requireAdminSession,
} from '@/lib/server/admin-route-helpers';
import { backendUpdateAkunRole, ManagementAdminError } from '@/lib/server/management-admin';

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
    const idRole = Number(body.id_role);
    if (!Number.isSafeInteger(idRole) || idRole <= 0) {
      throw new ManagementAdminError(422, 'Role akun tidak valid.');
    }

    return sessionResponse(await backendUpdateAkunRole(token, idAkun, { id_role: idRole }));
  } catch (error) {
    return handleAdminRouteError(error, 'Role akun belum dapat diperbarui. Silakan coba lagi.');
  }
}

