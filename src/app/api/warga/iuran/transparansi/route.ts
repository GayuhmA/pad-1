import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendTransparansiIuran, IuranServiceError } from '@/lib/server/iuran';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status') ?? undefined;
    const search = searchParams.get('search') ?? undefined;
    const pageParam = searchParams.get('page');
    const perPageParam = searchParams.get('per_page');
    const idPeriodeParam = searchParams.get('id_periode');

    const page = pageParam && /^\d+$/.test(pageParam) ? Number(pageParam) : undefined;
    const per_page = perPageParam && /^\d+$/.test(perPageParam) ? Number(perPageParam) : undefined;
    const id_periode = idPeriodeParam && /^\d+$/.test(idPeriodeParam) ? Number(idPeriodeParam) : undefined;

    const data = await backendTransparansiIuran({
      status,
      search,
      page,
      per_page,
      id_periode,
    }, token);

    return sessionResponse(data);
  } catch (error) {
    if (error instanceof IuranServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Data transparansi iuran gagal dimuat. Silakan coba lagi.' }, 500);
  }
}

