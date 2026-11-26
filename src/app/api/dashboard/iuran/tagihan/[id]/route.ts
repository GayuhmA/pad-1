import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  backendGetManagementTagihanDetail,
  backendUpdateManagementTagihan,
} from '@/lib/server/management-iuran';
import {
  handleTagihanRouteError,
  parsePositiveTagihanId,
  parseTagihanJsonObject,
  requireTagihanSession,
  validateUpdateTagihanBody,
} from '@/lib/server/tagihan-route-helpers';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = requireTagihanSession(request);
    const { id } = await context.params;
    const idTagihan = parsePositiveTagihanId(id);
    return sessionResponse(await backendGetManagementTagihanDetail(token, idTagihan));
  } catch (error) {
    return handleTagihanRouteError(error, 'Detail tagihan iuran gagal dimuat. Silakan coba lagi.');
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = requireTagihanSession(request, true);
    const { id } = await context.params;
    const idTagihan = parsePositiveTagihanId(id);
    const body = await parseTagihanJsonObject(request);
    const input = validateUpdateTagihanBody(body);
    return sessionResponse(await backendUpdateManagementTagihan(token, idTagihan, input));
  } catch (error) {
    return handleTagihanRouteError(error, 'Perubahan tagihan iuran gagal disimpan. Silakan coba lagi.');
  }
}

