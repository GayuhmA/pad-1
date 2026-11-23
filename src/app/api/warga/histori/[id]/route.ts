import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendDetailHistori, HistoriServiceError } from '@/lib/server/histori';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const { id } = await params;
    if (!/^\d+$/.test(id)) throw new HistoriServiceError(422, 'Periode histori yang dipilih tidak valid.');
    const idPeriode = Number(id);
    if (!Number.isSafeInteger(idPeriode) || idPeriode <= 0) {
      throw new HistoriServiceError(422, 'Periode histori yang dipilih tidak valid.');
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') ?? undefined;

    const data = await backendDetailHistori(token, idPeriode, search);
    return sessionResponse(data);
  } catch (error) {
    if (error instanceof HistoriServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Detail histori gagal dimuat. Silakan coba lagi.' }, 500);
  }
}

