import { NextRequest } from 'next/server';
import { AuthServiceError, authError, backendAuth, object, readAccount, requireSameOrigin, sessionResponse, setSessionCookie } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    let input: unknown;
    try { input = await request.json(); } catch {
      throw new AuthServiceError(400, 'Data login tidak valid.');
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new AuthServiceError(422, 'Username dan password wajib diisi.');
    }
    const { username, password } = input as Record<string, unknown>;
    if (typeof username !== 'string' || !username.trim() || username.length > 255 ||
        typeof password !== 'string' || !password || password.length > 1024) {
      throw new AuthServiceError(422, 'Username dan password wajib diisi dengan benar.');
    }
    const result = await backendAuth('login', { credentials: { username: username.trim(), password } });
    const data = object(result.data);
    if (typeof data.token !== 'string' || !data.token || /[\r\n]/.test(data.token) || data.token.length > 3500) {
      throw new AuthServiceError(502, 'Respons layanan akun tidak valid. Silakan coba lagi.');
    }
    const user = readAccount(data.akun, true);
    const response = sessionResponse({ user });
    setSessionCookie(response, data.token);
    return response;
  } catch (error) { return authError(error); }
}
