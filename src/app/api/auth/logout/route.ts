import { NextRequest } from 'next/server';
import { AuthServiceError, authError, backendAuth, clearSessionCookie, requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      try { await backendAuth('logout', { token }); } catch (error) {
        // An already expired token is also a successful logout. Other failures
        // keep the cookie so revocation can be retried rather than silently lost.
        if (!(error instanceof AuthServiceError && error.status === 401)) throw error;
      }
    }
    const response = sessionResponse({ message: 'Anda telah keluar.' });
    clearSessionCookie(response);
    return response;
  } catch (error) { return authError(error); }
}
