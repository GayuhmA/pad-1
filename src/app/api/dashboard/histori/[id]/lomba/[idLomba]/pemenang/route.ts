import { NextRequest } from 'next/server';
import { requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendAddPemenang, HistoriServiceError } from '@/lib/server/histori';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; idLomba: string }> },
) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new HistoriServiceError(401, 'Silakan masuk untuk melanjutkan.');

    const { id, idLomba } = await context.params;
    const idPeriode = Number(id);
    const idLombaNum = Number(idLomba);

    if (!Number.isSafeInteger(idPeriode) || idPeriode <= 0) {
      throw new HistoriServiceError(400, 'ID periode tidak valid.');
    }
    if (!Number.isSafeInteger(idLombaNum) || idLombaNum <= 0) {
      throw new HistoriServiceError(400, 'ID lomba tidak valid.');
    }

    const body = await request.json();
    return sessionResponse(await backendAddPemenang(token, idPeriode, idLombaNum, body), 201);
  } catch (error) {
    if (error instanceof HistoriServiceError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Gagal menambahkan pemenang lomba. Silakan coba lagi.' },
      500,
    );
  }
}

