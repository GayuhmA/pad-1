import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendGetPesertaLomba, HistoriServiceError } from '@/lib/server/histori';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new HistoriServiceError(401, 'Silakan masuk untuk melanjutkan.');

    const { id } = await context.params;
    const idLomba = Number(id);
    if (!Number.isSafeInteger(idLomba) || idLomba <= 0) {
      throw new HistoriServiceError(400, 'ID lomba tidak valid.');
    }

    const roleParam = request.nextUrl.searchParams.get('role');
    const role = roleParam === 'admin' || roleParam === 'panitia' ? roleParam : undefined;

    return sessionResponse(await backendGetPesertaLomba(token, idLomba, role));
  } catch (error) {
    if (error instanceof HistoriServiceError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Gagal memuat peserta lomba. Silakan coba lagi.' },
      500,
    );
  }
}

