import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  handleLombaRouteError,
  parseLombaId,
  parseSaveLombaBody,
  requireLombaSession,
} from '@/lib/server/lomba-route-helpers';
import { backendDeleteLomba, backendUpdateLomba } from '@/lib/server/management-lomba';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = requireLombaSession(request, true);
    const { id } = await context.params;
    const idLomba = parseLombaId(id);
    const input = await parseSaveLombaBody(request);
    return sessionResponse(await backendUpdateLomba(token, idLomba, input));
  } catch (error) {
    return handleLombaRouteError(error, 'Data lomba belum dapat diperbarui. Silakan coba lagi.');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = requireLombaSession(request, true);
    const { id } = await context.params;
    const idLomba = parseLombaId(id);
    return sessionResponse(await backendDeleteLomba(token, idLomba));
  } catch (error) {
    return handleLombaRouteError(error, 'Lomba belum dapat dihapus. Silakan coba lagi.');
  }
}

