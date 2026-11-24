import { NextRequest } from 'next/server';
import { requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import {
  backendUpdateStatusPendaftaran,
  ManagementPendaftaranError,
} from '@/lib/server/management-pendaftaran';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementPendaftaranError(401, 'Silakan masuk untuk melanjutkan.');

    const { id } = await context.params;
    const idPendaftaran = Number(id);
    if (!Number.isSafeInteger(idPendaftaran) || idPendaftaran <= 0) {
      throw new ManagementPendaftaranError(400, 'ID pendaftaran tidak valid.');
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ManagementPendaftaranError(400, 'Format data tidak valid.');
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ManagementPendaftaranError(422, 'Data status pendaftaran wajib diisi.');
    }

    const { status, catatan } = body as Record<string, unknown>;
    if (status !== 'Diterima' && status !== 'Ditolak') {
      throw new ManagementPendaftaranError(422, 'Status harus berupa Diterima atau Ditolak.');
    }

    const roleParam = request.nextUrl.searchParams.get('role');
    const role = roleParam === 'admin' || roleParam === 'panitia' ? roleParam : undefined;

    const result = await backendUpdateStatusPendaftaran(token, role, idPendaftaran, {
      status,
      catatan: typeof catatan === 'string' ? catatan.trim() : null,
    });

    return sessionResponse(result);
  } catch (error) {
    if (error instanceof ManagementPendaftaranError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Status pendaftaran belum dapat diperbarui. Silakan coba lagi.' },
      500,
    );
  }
}

