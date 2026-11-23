import { NextRequest } from 'next/server';
import { requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendVerifyPayment, ManagementIuranError } from '@/lib/server/management-iuran';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementIuranError(401, 'Silakan masuk untuk melanjutkan.');

    const { id } = await context.params;
    const idPembayaran = Number(id);
    if (!Number.isSafeInteger(idPembayaran) || idPembayaran <= 0) {
      throw new ManagementIuranError(400, 'ID pembayaran tidak valid.');
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ManagementIuranError(400, 'Format data tidak valid.');
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ManagementIuranError(422, 'Data verifikasi wajib diisi.');
    }

    const { keputusan } = body as Record<string, unknown>;
    if (keputusan !== 'Diterima' && keputusan !== 'Ditolak') {
      throw new ManagementIuranError(422, 'Keputusan harus berupa Diterima atau Ditolak.');
    }

    return sessionResponse(await backendVerifyPayment(token, idPembayaran, { keputusan }));
  } catch (error) {
    if (error instanceof ManagementIuranError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Verifikasi pembayaran belum dapat diproses. Silakan coba lagi.' },
      500,
    );
  }
}

