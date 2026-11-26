import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import { backendDeactivateManagementTagihan } from '@/lib/server/management-iuran';
import {
  handleTagihanRouteError,
  parsePositiveTagihanId,
  requireTagihanSession,
} from '@/lib/server/tagihan-route-helpers';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = requireTagihanSession(request, true);
    const { id } = await context.params;
    const idTagihan = parsePositiveTagihanId(id);
    return sessionResponse(await backendDeactivateManagementTagihan(token, idTagihan));
  } catch (error) {
    return handleTagihanRouteError(error, 'Tagihan iuran gagal dinonaktifkan. Silakan coba lagi.');
  }
}

