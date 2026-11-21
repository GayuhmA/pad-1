import { NextRequest } from 'next/server';
import { AuthServiceError, SESSION_COOKIE, authError, requireSameOrigin, sessionResponse } from '@/lib/server/auth';
import { backendUpdatePassword } from '@/lib/server/profile';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new AuthServiceError(401, 'Silakan masuk untuk melanjutkan.');

    let input: unknown;
    try { input = await request.json(); } catch {
      throw new AuthServiceError(400, 'Data tidak valid.');
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new AuthServiceError(422, 'Data tidak valid.');
    }
    const { current_password, new_password, new_password_confirmation } = input as Record<string, unknown>;
    if (typeof current_password !== 'string' || !current_password) {
      throw new AuthServiceError(422, 'Sandi saat ini wajib diisi.');
    }
    if (typeof new_password !== 'string' || !new_password) {
      throw new AuthServiceError(422, 'Sandi baru wajib diisi.');
    }
    if (new_password !== new_password_confirmation) {
      throw new AuthServiceError(422, 'Konfirmasi sandi baru tidak cocok.');
    }

    const result = await backendUpdatePassword(token, {
      current_password,
      new_password,
      new_password_confirmation,
    });
    return sessionResponse({ success: true, message: result.message ?? 'Sandi berhasil diperbarui.' });
  } catch (error) { return authError(error); }
}

