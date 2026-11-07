import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { Agent } from 'undici';
import type { User } from '@/types/auth';

// Give IPv4 time to connect before trying IPv6 on slower dual-stack networks.
// Scope this pool to backend requests; do not change Node's global networking.
const backendDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

export const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-pad_session' : 'pad_session';
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export class AuthServiceError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export function sessionResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store', Pragma: 'no-cache' },
  });
}

export function setSessionCookie(response: NextResponse, token: string) {
  // A browser-session cookie; backend revocation/expiry remains authoritative.
  response.cookies.set(SESSION_COOKIE, token, cookieOptions);
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}

export function requireSameOrigin(request: NextRequest) {
  // Protect cookie-authenticated mutations, including login CSRF.
  const expectedOrigin = process.env.APP_ORIGIN ? new URL(process.env.APP_ORIGIN).origin : request.nextUrl.origin;
  if (request.headers.get('origin') !== expectedOrigin ||
      request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new AuthServiceError(403, 'Permintaan tidak diizinkan. Muat ulang halaman dan coba lagi.');
  }
}

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AuthServiceError(502, 'Respons layanan akun tidak valid. Silakan coba lagi.');
  }
  return value as Record<string, unknown>;
}

export function readAccount(value: unknown, activeFromLogin = false): User {
  const account = object(value);
  const role = object(account.role);
  const warga = object(account.warga);
  if (!Number.isInteger(account.id_akun) || typeof account.username !== 'string' ||
      !account.username.trim() || typeof role.nama_role !== 'string' || !role.nama_role.trim() ||
      typeof warga.nama !== 'string' || !warga.nama.trim() ||
      (warga.no_hp != null && typeof warga.no_hp !== 'string') ||
      (!activeFromLogin && typeof account.status !== 'string')) {
    throw new AuthServiceError(502, 'Respons layanan akun tidak valid. Silakan coba lagi.');
  }
  return {
    id: account.id_akun as number,
    username: account.username,
    nama: warga.nama,
    role: role.nama_role,
    phone: typeof warga.no_hp === 'string' ? warga.no_hp : null,
    is_active: activeFromLogin || account.status === 'Aktif',
  };
}

export async function backendAuth(
  endpoint: 'login' | 'me' | 'logout',
  options: { token?: string; credentials?: { username: string; password: string } } = {},
): Promise<Record<string, unknown>> {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new AuthServiceError(503, 'Layanan akun belum dikonfigurasi.');
  const headers = new Headers({ Accept: 'application/json' });
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`);
  if (options.credentials) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    const init: RequestInit & { dispatcher: Agent } = {
      method: endpoint === 'me' ? 'GET' : 'POST',
      headers,
      body: options.credentials ? JSON.stringify(options.credentials) : undefined,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
      dispatcher: backendDispatcher,
    };
    response = await fetch(`${base.replace(/\/$/, '')}/api/auth/${endpoint}`, init);
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    // Log only a transport code: never credentials, headers, tokens, or raw errors.
    console.warn('[auth/backend] connection failed', {
      endpoint,
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code :
        error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new AuthServiceError(503, 'Layanan akun belum dapat dihubungi. Silakan coba lagi.');
  }
  // Do not expose upstream HTML, stack traces, or arbitrary response fields.
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: endpoint === 'login' ? 'Username atau password salah.' : 'Sesi telah berakhir. Silakan masuk kembali.',
      403: 'Akun tidak aktif atau tidak memiliki akses.',
      422: 'Data akun tidak valid. Periksa kembali isian Anda.',
      429: 'Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.',
    };
    throw new AuthServiceError(messages[response.status] ? response.status : 502,
      messages[response.status] ?? 'Layanan akun sedang bermasalah. Silakan coba lagi.');
  }
  let body: unknown;
  try { body = await response.json(); } catch {
    throw new AuthServiceError(502, 'Respons layanan akun tidak valid. Silakan coba lagi.');
  }
  const result = object(body);
  if (result.success !== true) throw new AuthServiceError(502, 'Respons layanan akun tidak valid. Silakan coba lagi.');
  return result;
}

export function authError(error: unknown) {
  if (error instanceof AuthServiceError) return sessionResponse({ message: error.message }, error.status);
  return sessionResponse({ message: 'Layanan akun sedang bermasalah. Silakan coba lagi.' }, 500);
}
