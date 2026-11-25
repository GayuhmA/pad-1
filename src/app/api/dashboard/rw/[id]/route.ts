import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  handleAdminRouteError,
  parsePositiveIntId,
  requireAdminSession,
} from '@/lib/server/admin-route-helpers';

export const runtime = 'nodejs';

async function rejectRwMutation(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  fallbackMessage: string,
) {
  try {
    requireAdminSession(request, true);
    const { id } = await context.params;
    parsePositiveIntId(id, 'RW');
    const response = sessionResponse(
      { message: 'Perubahan data RW dinonaktifkan. Data RW mengikuti konfigurasi backend.' },
      405,
    );
    response.headers.set('Allow', 'GET');
    return response;
  } catch (error) {
    return handleAdminRouteError(error, fallbackMessage);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return rejectRwMutation(request, context, 'Data RW tidak dapat diubah.');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return rejectRwMutation(request, context, 'Data RW tidak dapat dihapus.');
}

