import 'server-only';

import { Agent } from 'undici';
import type { NeighborhoodContact } from '@/lib/data/profile';
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

function normalizeContactNode(
  node: unknown,
  kind: 'rt' | 'rw',
): NeighborhoodContact | null {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return null;
  const item = node as Record<string, unknown>;
  const rawId = kind === 'rt' ? (item.id_rt ?? item.id) : (item.id_rw ?? item.id);
  const nomor = typeof (kind === 'rt' ? item.nomor_rt : item.nomor_rw) === 'string'
    ? (kind === 'rt' ? (item.nomor_rt as string) : (item.nomor_rw as string)).trim()
    : '';
  const namaKetua = typeof item.nama_ketua === 'string' ? item.nama_ketua.trim() : '';
  const whatsapp = typeof item.nomor_whatsapp === 'string' && item.nomor_whatsapp.trim()
    ? item.nomor_whatsapp.trim()
    : null;

  if (!namaKetua && !whatsapp) return null;

  const label = kind === 'rt' ? 'RT' : 'RW';
  const position = nomor ? `Ketua ${label} ${nomor}` : `Ketua ${label}`;

  return {
    id: `${kind}-${typeof rawId === 'number' || typeof rawId === 'string' ? rawId : nomor || '0'}`,
    name: namaKetua || position,
    position,
    whatsapp,
  };
}

export async function backendGetKontakPengurus(token: string): Promise<{
  success: true;
  message: string;
  data: NeighborhoodContact[];
}> {
  const base = getBase();
  const headers = new Headers({
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  });

  let response: Response;
  try {
    const init: RequestInit & { dispatcher: Agent } = {
      method: 'GET',
      headers,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
      dispatcher: backendDispatcher,
    };
    response = await fetch(`${base}/api/warga/kontak-pengurus`, init);
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
    console.warn('[profile/backend] connection failed', {
      path: '/api/warga/kontak-pengurus',
      code: typeof code === 'string' && /^[A-Z_]{1,64}$/.test(code) ? code :
        error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
    });
    throw new AuthServiceError(503, 'Layanan kontak pengurus belum dapat dihubungi. Silakan coba lagi.');
  }

  if (response.status === 404) {
    return {
      success: true,
      message: 'Kontak pengurus belum tersedia.',
      data: [],
    };
  }

  if (!response.ok) {
    let message = 'Kontak pengurus belum dapat dimuat.';
    try {
      const data = await response.json() as Record<string, unknown>;
      if (typeof data.message === 'string' && data.message) message = data.message;
    } catch { /* ignore */ }
    throw new AuthServiceError(response.status, message);
  }

  let body: unknown;
  try { body = await response.json(); } catch {
    throw new AuthServiceError(502, 'Respons layanan tidak valid. Silakan coba lagi.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AuthServiceError(502, 'Respons layanan tidak valid. Silakan coba lagi.');
  }

  const envelope = body as Record<string, unknown>;
  const data = envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)
    ? envelope.data as Record<string, unknown>
    : {};

  const contacts = [
    normalizeContactNode(data.rt, 'rt'),
    normalizeContactNode(data.rw, 'rw'),
  ].filter((item): item is NeighborhoodContact => item !== null);

  return {
    success: true,
    message: typeof envelope.message === 'string' ? envelope.message : 'Kontak Ketua RT dan RW berhasil ditampilkan.',
    data: contacts,
  };
}

