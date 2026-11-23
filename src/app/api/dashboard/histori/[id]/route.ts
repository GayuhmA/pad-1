import { NextRequest } from 'next/server';
import { requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendUpdateHistoriPeriode, HistoriServiceError } from '@/lib/server/histori';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new HistoriServiceError(401, 'Silakan masuk untuk melanjutkan.');

    const { id } = await context.params;
    const idPeriode = Number(id);
    if (!Number.isSafeInteger(idPeriode) || idPeriode <= 0) {
      throw new HistoriServiceError(400, 'ID periode tidak valid.');
    }

    const body = await request.json();
    return sessionResponse(await backendUpdateHistoriPeriode(token, idPeriode, body));
  } catch (error) {
    if (error instanceof HistoriServiceError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Gagal memperbarui informasi histori kegiatan. Silakan coba lagi.' },
      500,
    );
  }
}

