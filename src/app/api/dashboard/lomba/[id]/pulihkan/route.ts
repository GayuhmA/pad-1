import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  handleLombaRouteError,
  parseLombaId,
  requireLombaSession,
} from '@/lib/server/lomba-route-helpers';
import { backendRestoreLomba } from '@/lib/server/management-lomba';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = requireLombaSession(request, true);
    const { id } = await context.params;
    const idLomba = parseLombaId(id);
    return sessionResponse(await backendRestoreLomba(token, idLomba));
  } catch (error) {
    return handleLombaRouteError(error, 'Lomba belum dapat dipulihkan. Silakan coba lagi.');
  }
}

