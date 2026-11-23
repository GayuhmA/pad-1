import { NextRequest } from 'next/server';
import { requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import {
  backendDeletePemenang,
  backendUpdatePemenang,
  HistoriServiceError,
} from '@/lib/server/histori';

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
    const idPemenang = Number(id);
    if (!Number.isSafeInteger(idPemenang) || idPemenang <= 0) {
      throw new HistoriServiceError(400, 'ID pemenang tidak valid.');
    }

    const body = await request.json();
    return sessionResponse(await backendUpdatePemenang(token, idPemenang, body));
  } catch (error) {
    if (error instanceof HistoriServiceError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Gagal memperbarui pemenang lomba. Silakan coba lagi.' },
      500,
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new HistoriServiceError(401, 'Silakan masuk untuk melanjutkan.');

    const { id } = await context.params;
    const idPemenang = Number(id);
    if (!Number.isSafeInteger(idPemenang) || idPemenang <= 0) {
      throw new HistoriServiceError(400, 'ID pemenang tidak valid.');
    }

    return sessionResponse(await backendDeletePemenang(token, idPemenang));
  } catch (error) {
    if (error instanceof HistoriServiceError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Gagal menghapus pemenang lomba. Silakan coba lagi.' },
      500,
    );
  }
}

