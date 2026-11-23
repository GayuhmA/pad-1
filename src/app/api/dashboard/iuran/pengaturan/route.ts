import { NextRequest } from 'next/server';
import { requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendUpdatePaymentSettings, ManagementIuranError } from '@/lib/server/management-iuran';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementIuranError(401, 'Silakan masuk untuk melanjutkan.');

    const formData = await request.formData();
    return sessionResponse(await backendUpdatePaymentSettings(token, formData));
  } catch (error) {
    if (error instanceof ManagementIuranError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Pengaturan pembayaran gagal diperbarui. Silakan coba lagi.' },
      500,
    );
  }
}

