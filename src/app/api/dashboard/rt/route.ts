import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  handleAdminRouteError,
  parseJsonObject,
  requireAdminSession,
  validateCreateRtBody,
} from '@/lib/server/admin-route-helpers';
import { backendCreateRt, backendGetAdminRtRw } from '@/lib/server/management-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = requireAdminSession(request);
    return sessionResponse(await backendGetAdminRtRw(token));
  } catch (error) {
    return handleAdminRouteError(error, 'Data RT dan RW belum dapat dimuat.');
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = requireAdminSession(request, true);
    const body = await parseJsonObject(request);
    const input = validateCreateRtBody(body);
    return sessionResponse(await backendCreateRt(token, input), 201);
  } catch (error) {
    return handleAdminRouteError(error, 'Data RT belum dapat ditambahkan.');
  }
}

