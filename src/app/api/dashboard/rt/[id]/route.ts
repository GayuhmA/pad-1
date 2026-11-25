import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  handleAdminRouteError,
  parseJsonObject,
  parsePositiveIntId,
  requireAdminSession,
  validateUpdateRtBody,
} from '@/lib/server/admin-route-helpers';
import { backendDeleteRt, backendUpdateRt } from '@/lib/server/management-admin';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = requireAdminSession(request, true);
    const { id } = await context.params;
    const idRt = parsePositiveIntId(id, 'RT');
    const body = await parseJsonObject(request);
    const input = validateUpdateRtBody(body);
    return sessionResponse(await backendUpdateRt(token, idRt, input));
  } catch (error) {
    return handleAdminRouteError(error, 'Data RT belum dapat diubah.');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = requireAdminSession(request, true);
    const { id } = await context.params;
    const idRt = parsePositiveIntId(id, 'RT');
    return sessionResponse(await backendDeleteRt(token, idRt));
  } catch (error) {
    return handleAdminRouteError(error, 'Data RT belum dapat dihapus.');
  }
}

