import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import {
  backendCreateManagementTagihan,
  backendGetManagementTagihan,
} from '@/lib/server/management-iuran';
import {
  handleTagihanRouteError,
  parseTagihanJsonObject,
  requireTagihanSession,
  validateCreateTagihanBody,
} from '@/lib/server/tagihan-route-helpers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = requireTagihanSession(request);
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') ?? undefined;
    const isAktifParam = searchParams.get('is_aktif');
    const is_aktif = isAktifParam === '0' ? 0 : isAktifParam === '1' ? 1 : undefined;
    const idPeriodeParam = searchParams.get('id_periode');
    const id_periode = idPeriodeParam && /^\d+$/.test(idPeriodeParam) ? Number(idPeriodeParam) : undefined;
    const pageParam = searchParams.get('page');
    const page = pageParam && /^\d+$/.test(pageParam) ? Number(pageParam) : undefined;
    const perPageParam = searchParams.get('per_page');
    const per_page = perPageParam && /^\d+$/.test(perPageParam) ? Number(perPageParam) : undefined;

    return sessionResponse(
      await backendGetManagementTagihan(token, { search, is_aktif, id_periode, page, per_page }),
    );
  } catch (error) {
    return handleTagihanRouteError(error, 'Daftar tagihan iuran gagal dimuat. Silakan coba lagi.');
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = requireTagihanSession(request, true);
    const body = await parseTagihanJsonObject(request);
    const input = validateCreateTagihanBody(body);
    return sessionResponse(await backendCreateManagementTagihan(token, input), 201);
  } catch (error) {
    return handleTagihanRouteError(error, 'Tagihan iuran gagal dibuat. Silakan coba lagi.');
  }
}

