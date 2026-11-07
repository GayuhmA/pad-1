import { NextRequest } from 'next/server';
import { AuthServiceError, authError, backendAuth, readAccount, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new AuthServiceError(401, 'Silakan masuk untuk melanjutkan.');
    const result = await backendAuth('me', { token });
    const user = readAccount(result.data);
    if (!user.is_active) throw new AuthServiceError(401, 'Akun sudah tidak aktif. Silakan hubungi pengurus.');
    return sessionResponse({ user });
  } catch (error) {
    // GET never writes cookies: a late 401 must not delete a newer login's cookie.
    return authError(error);
  }
}
