import 'server-only';

import type { NextRequest } from 'next/server';
import { AuthServiceError, requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { LogoServiceError } from '@/lib/server/logo';

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function requireLogoSession(request: NextRequest, isMutation = false): string {
  if (isMutation) requireSameOrigin(request);
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) throw new LogoServiceError(401, 'Silakan masuk untuk melanjutkan.');
  return token;
}

export function parseLogoId(rawId: string): number {
  if (!/^\d+$/.test(rawId)) {
    throw new LogoServiceError(400, 'ID logo tidak valid.');
  }
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new LogoServiceError(400, 'ID logo tidak valid.');
  }
  return id;
}

export async function buildValidatedLogoFormData(
  request: NextRequest,
  mode: 'create' | 'update',
): Promise<FormData> {
  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    throw new LogoServiceError(400, 'Format data logo tidak valid.');
  }

  const outbound = new FormData();
  const rawTahun = incoming.get('tahun');
  const rawNama = incoming.get('nama_logo');
  const rawStatus = incoming.get('status');
  const rawGambar = incoming.get('gambar');

  if (mode === 'create' || rawTahun !== null) {
    const tahunStr = typeof rawTahun === 'string' ? rawTahun.trim() : '';
    const tahun = /^\d{4}$/.test(tahunStr) ? Number(tahunStr) : Number.NaN;
    if (!Number.isSafeInteger(tahun) || tahun < 1945 || tahun > 2100) {
      throw new LogoServiceError(422, 'Tahun logo harus berupa 4 digit angka yang valid.');
    }
    outbound.set('tahun', String(tahun));
  }

  if (mode === 'create' || rawNama !== null) {
    const nama = typeof rawNama === 'string' ? rawNama.trim() : '';
    if (!nama || nama.length > 150) {
      throw new LogoServiceError(422, 'Nama logo wajib diisi maksimal 150 karakter.');
    }
    outbound.set('nama_logo', nama);
  }

  if (rawStatus !== null) {
    const status = typeof rawStatus === 'string' ? rawStatus.trim() : '';
    if (status !== 'Aktif' && status !== 'Nonaktif') {
      throw new LogoServiceError(422, 'Status logo harus Aktif atau Nonaktif.');
    }
    outbound.set('status', status);
  }

  if (mode === 'create') {
    if (!(rawGambar instanceof File) || rawGambar.size === 0 ||
        rawGambar.size > MAX_LOGO_SIZE || !ALLOWED_LOGO_TYPES.has(rawGambar.type)) {
      throw new LogoServiceError(422, 'Gambar logo wajib berupa JPG, PNG, atau WebP maksimal 5 MB.');
    }
    outbound.set('gambar', rawGambar, rawGambar.name);
  } else if (rawGambar !== null) {
    if (rawGambar instanceof File && rawGambar.size > 0) {
      if (rawGambar.size > MAX_LOGO_SIZE || !ALLOWED_LOGO_TYPES.has(rawGambar.type)) {
        throw new LogoServiceError(422, 'Gambar logo harus berupa JPG, PNG, atau WebP maksimal 5 MB.');
      }
      outbound.set('gambar', rawGambar, rawGambar.name);
    }
  }

  if (mode === 'update' && [...outbound.keys()].length === 0) {
    throw new LogoServiceError(422, 'Minimal satu perubahan data logo wajib diisi.');
  }

  return outbound;
}

export function handleLogoRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof LogoServiceError) {
    return sessionResponse(
      { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
      error.status,
    );
  }
  if (error instanceof AuthServiceError) {
    return sessionResponse({ message: error.message }, error.status);
  }
  return sessionResponse({ message: fallbackMessage }, 500);
}

