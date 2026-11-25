import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  handleLombaRouteError,
  parseSaveLombaBody,
  requireLombaSession,
} from '@/lib/server/lomba-route-helpers';
import { backendCreateLomba, backendManagementLomba } from '@/lib/server/management-lomba';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = requireLombaSession(request);
    const roleParam = request.nextUrl.searchParams.get('role');
    const role = roleParam === 'admin' || roleParam === 'panitia' ? roleParam : undefined;
    return sessionResponse(await backendManagementLomba(token, role));
  } catch (error) {
    return handleLombaRouteError(error, 'Layanan lomba sedang bermasalah. Silakan coba lagi.');
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = requireLombaSession(request, true);
    const input = await parseSaveLombaBody(request);
    return sessionResponse(await backendCreateLomba(token, input), 201);
  } catch (error) {
    return handleLombaRouteError(error, 'Lomba belum dapat ditambahkan. Silakan coba lagi.');
  }
}
