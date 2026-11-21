import 'server-only';

import { Agent } from 'undici';
import { AuthServiceError } from '@/lib/server/auth';

const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

function getBase(): string {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new AuthServiceError(503, 'Layanan akun belum dikonfigurasi.');
  return base.replace(/\/$/, '');
}

async function backendPut(path: string, token: string, body: unknown): Promise<Record<string, unknown>> {
  const base = getBase();
  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  let response: Response;
  try {
    const init: RequestInit & { dispatcher: Agent } = {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
      dispatcher: backendDispatcher,
    };
    response = await fetch(`${base}${path}`, init);
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    console.warn('[profile/backend] connection failed', {
      path,
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code :
        error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new AuthServiceError(503, 'Layanan akun belum dapat dihubungi. Silakan coba lagi.');
  }

  if (!response.ok) {
    let message = 'Permintaan gagal. Silakan coba lagi.';
    try {
      const data = await response.json() as Record<string, unknown>;
      if (typeof data.message === 'string' && data.message) message = data.message;
    } catch { /* ignore */ }
    throw new AuthServiceError(response.status, message);
  }

  let body_: unknown;
  try { body_ = await response.json(); } catch {
    throw new AuthServiceError(502, 'Respons layanan tidak valid. Silakan coba lagi.');
  }
  if (!body_ || typeof body_ !== 'object' || Array.isArray(body_)) {
    throw new AuthServiceError(502, 'Respons layanan tidak valid. Silakan coba lagi.');
  }
  return body_ as Record<string, unknown>;
}

export async function backendUpdateProfil(token: string, body: unknown) {
  return backendPut('/api/akun/profil', token, body);
}

export async function backendUpdateUsername(token: string, body: unknown) {
  return backendPut('/api/akun/username', token, body);
}

export async function backendUpdatePassword(token: string, body: unknown) {
  return backendPut('/api/akun/ubah-password', token, body);
}

