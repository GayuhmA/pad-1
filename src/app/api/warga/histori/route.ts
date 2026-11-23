import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendDaftarHistori, HistoriServiceError } from '@/lib/server/histori';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const { searchParams } = request.nextUrl;
    const tahun = searchParams.get('tahun') ?? undefined;
    const search = searchParams.get('search') ?? undefined;

    const data = await backendDaftarHistori(token, {
      tahun,
      search,
    });

    return sessionResponse(data);
  } catch (error) {
    if (error instanceof HistoriServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Daftar histori gagal dimuat. Silakan coba lagi.' }, 500);
  }
}

