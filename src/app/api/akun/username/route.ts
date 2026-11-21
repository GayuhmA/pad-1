import { NextRequest } from 'next/server';
import { AuthServiceError, SESSION_COOKIE, authError, requireSameOrigin, sessionResponse } from '@/lib/server/auth';
import { backendUpdateUsername } from '@/lib/server/profile';

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
    const { username, current_password } = input as Record<string, unknown>;
    if (typeof username !== 'string' || !username.trim() || username.length > 200) {
      throw new AuthServiceError(422, 'Username wajib diisi.');
    }
    if (typeof current_password !== 'string' || !current_password) {
      throw new AuthServiceError(422, 'Sandi saat ini wajib diisi.');
    }

    const result = await backendUpdateUsername(token, {
      username: username.trim(),
      current_password,
    });
    return sessionResponse({ success: true, message: result.message ?? 'Username berhasil diperbarui.' });
  } catch (error) { return authError(error); }
}

