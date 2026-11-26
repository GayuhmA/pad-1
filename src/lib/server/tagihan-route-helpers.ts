import 'server-only';

import type { NextRequest } from 'next/server';
import { AuthServiceError, requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { ManagementIuranError } from '@/lib/server/management-iuran';
import type { CreateTagihanInput, UpdateTagihanInput } from '@/types/management-iuran';

export function requireTagihanSession(request: NextRequest, enforceOrigin = false): string {
  if (enforceOrigin) {
    requireSameOrigin(request);
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    throw new ManagementIuranError(401, 'Silakan masuk untuk melanjutkan.');
  }
  return token;
}

export function handleTagihanRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof ManagementIuranError || error instanceof AuthServiceError) {
    const errors = error instanceof ManagementIuranError ? error.errors : undefined;
    return sessionResponse(
      { message: error.message, ...(errors ? { errors } : {}) },
      error.status,
    );
  }
  return sessionResponse({ message: fallbackMessage }, 500);
}

export async function parseTagihanJsonObject(request: NextRequest): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ManagementIuranError(400, 'Format data tidak valid.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ManagementIuranError(422, 'Payload JSON tidak valid.');
  }
  return body as Record<string, unknown>;
}

export function parsePositiveTagihanId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ManagementIuranError(400, 'ID tagihan tidak valid.');
  }
  return id;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateCommonTagihanFields(body: Record<string, unknown>) {
  const namaTagihan = typeof body.nama_tagihan === 'string' ? body.nama_tagihan.trim() : '';
  if (!namaTagihan) {
    throw new ManagementIuranError(422, 'Nama tagihan wajib diisi.');
  }

  const nominalRaw = typeof body.nominal === 'number' ? body.nominal : Number(body.nominal);
  if (!Number.isFinite(nominalRaw) || nominalRaw <= 0) {
    throw new ManagementIuranError(422, 'Nominal tagihan harus lebih besar dari 0.');
  }

  const jatuhTempo = typeof body.jatuh_tempo === 'string' ? body.jatuh_tempo.trim() : '';
  if (!isValidIsoDate(jatuhTempo)) {
    throw new ManagementIuranError(422, 'Tanggal jatuh tempo tidak valid (gunakan YYYY-MM-DD).');
  }

  const keterangan = typeof body.keterangan === 'string' && body.keterangan.trim()
    ? body.keterangan.trim()
    : null;

  return { nama_tagihan: namaTagihan, nominal: nominalRaw, jatuh_tempo: jatuhTempo, keterangan };
}

export function validateCreateTagihanBody(body: Record<string, unknown>): CreateTagihanInput {
  const common = validateCommonTagihanFields(body);
  const idPeriode = Number(body.id_periode);
  if (!Number.isSafeInteger(idPeriode) || idPeriode <= 0) {
    throw new ManagementIuranError(422, 'Periode iuran wajib dipilih.');
  }

  const target = body.target;
  if (target !== 'Semua' && target !== 'Tertentu') {
    throw new ManagementIuranError(422, 'Target tagihan harus berupa Semua atau Tertentu.');
  }

  let idWarga: number[] | undefined;
  if (target === 'Tertentu') {
    if (!Array.isArray(body.id_warga) || body.id_warga.length === 0) {
      throw new ManagementIuranError(422, 'Pilih minimal satu warga jika target adalah Warga Tertentu.');
    }
    const parsedIds = Array.from(
      new Set(
        body.id_warga
          .map((item) => Number(item))
          .filter((item) => Number.isSafeInteger(item) && item > 0),
      ),
    );
    if (parsedIds.length === 0 || parsedIds.length !== new Set(body.id_warga.map(Number)).size) {
      throw new ManagementIuranError(422, 'Daftar warga yang dipilih tidak valid.');
    }
    idWarga = parsedIds;
  }

  return {
    ...common,
    id_periode: idPeriode,
    target,
    ...(idWarga ? { id_warga: idWarga } : {}),
  };
}

export function validateUpdateTagihanBody(body: Record<string, unknown>): UpdateTagihanInput {
  return validateCommonTagihanFields(body);
}

