import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import { backendGetTagihanFormOptions } from '@/lib/server/management-iuran';
import { handleTagihanRouteError, requireTagihanSession } from '@/lib/server/tagihan-route-helpers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = requireTagihanSession(request);
    return sessionResponse(await backendGetTagihanFormOptions(token));
  } catch (error) {
    return handleTagihanRouteError(error, 'Opsi formulir tagihan gagal dimuat. Silakan coba lagi.');
  }
}

