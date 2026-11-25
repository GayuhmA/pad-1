import 'server-only';

import type { NextRequest } from 'next/server';
import { AuthServiceError, requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { ManagementAdminError } from '@/lib/server/management-admin';
import type {
  AccountStatus,
  CreateRtInput,
  CreateRwInput,
  CreateWargaInput,
  GenderCode,
  UpdateRtInput,
  UpdateRwInput,
  UpdateWargaInput,
} from '@/types/management-admin';

/** Extracts session token and enforces same-origin verification on mutations. */
export function requireAdminSession(request: NextRequest, isMutation = false): string {
  if (isMutation) requireSameOrigin(request);
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) throw new ManagementAdminError(401, 'Silakan masuk untuk melanjutkan.');
  return token;
}

/** Parses a positive integer route parameter. */
export function parsePositiveIntId(rawId: string, label: string): number {
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ManagementAdminError(400, `ID ${label} tidak valid.`);
  }
  return id;
}

/** Parses and asserts that the JSON request body is a plain object. */
export async function parseJsonObject(request: NextRequest): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ManagementAdminError(400, 'Format data tidak valid.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ManagementAdminError(422, 'Data permintaan wajib diisi.');
  }
  return body as Record<string, unknown>;
}

/** Converts known admin/auth errors into uniform JSON responses. */
export function handleAdminRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof ManagementAdminError) {
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

function optionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function validateCreateWargaBody(body: Record<string, unknown>): CreateWargaInput {
  const idRt = Number(body.id_rt);
  const nik = optionalTrimmedString(body.nik);
  const nama = optionalTrimmedString(body.nama);
  const jenisKelamin = body.jenis_kelamin as GenderCode;

  if (!Number.isSafeInteger(idRt) || idRt <= 0) {
    throw new ManagementAdminError(422, 'Wilayah RT wajib dipilih.');
  }
  if (!nik || !/^\d{8,20}$/.test(nik)) {
    throw new ManagementAdminError(422, 'NIK wajib diisi dengan 8 sampai 20 digit angka.');
  }
  if (!nama) {
    throw new ManagementAdminError(422, 'Nama lengkap warga wajib diisi.');
  }
  if (jenisKelamin !== 'L' && jenisKelamin !== 'P') {
    throw new ManagementAdminError(422, 'Jenis kelamin harus L atau P.');
  }

  const tanggalLahir = optionalTrimmedString(body.tanggal_lahir);
  if (tanggalLahir && !/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahir)) {
    throw new ManagementAdminError(422, 'Format tanggal lahir harus YYYY-MM-DD.');
  }

  const status = body.status as AccountStatus | undefined;
  if (status !== undefined && status !== 'Aktif' && status !== 'Nonaktif') {
    throw new ManagementAdminError(422, 'Status warga harus Aktif atau Nonaktif.');
  }

  return {
    id_rt: idRt,
    nik,
    nama,
    jenis_kelamin: jenisKelamin,
    ...(optionalTrimmedString(body.tempat_lahir) ? { tempat_lahir: optionalTrimmedString(body.tempat_lahir) } : {}),
    ...(tanggalLahir ? { tanggal_lahir: tanggalLahir } : {}),
    ...(optionalTrimmedString(body.no_hp) ? { no_hp: optionalTrimmedString(body.no_hp) } : {}),
    ...(optionalTrimmedString(body.alamat) ? { alamat: optionalTrimmedString(body.alamat) } : {}),
    ...(status ? { status } : {}),
  };
}

export function validateUpdateWargaBody(body: Record<string, unknown>): UpdateWargaInput {
  const payload: UpdateWargaInput = {};

  if (body.id_rt !== undefined) {
    const idRt = Number(body.id_rt);
    if (!Number.isSafeInteger(idRt) || idRt <= 0) {
      throw new ManagementAdminError(422, 'Wilayah RT tidak valid.');
    }
    payload.id_rt = idRt;
  }
  if (body.nik !== undefined) {
    const nik = optionalTrimmedString(body.nik);
    if (!nik || !/^\d{8,20}$/.test(nik)) {
      throw new ManagementAdminError(422, 'NIK harus terdiri dari 8 sampai 20 digit angka.');
    }
    payload.nik = nik;
  }
  if (body.nama !== undefined) {
    const nama = optionalTrimmedString(body.nama);
    if (!nama) throw new ManagementAdminError(422, 'Nama lengkap warga tidak boleh kosong.');
    payload.nama = nama;
  }
  if (body.jenis_kelamin !== undefined) {
    if (body.jenis_kelamin !== 'L' && body.jenis_kelamin !== 'P') {
      throw new ManagementAdminError(422, 'Jenis kelamin harus L atau P.');
    }
    payload.jenis_kelamin = body.jenis_kelamin;
  }
  if (body.tanggal_lahir !== undefined) {
    const tgl = optionalTrimmedString(body.tanggal_lahir);
    if (tgl && !/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
      throw new ManagementAdminError(422, 'Format tanggal lahir harus YYYY-MM-DD.');
    }
    if (tgl) payload.tanggal_lahir = tgl;
  }
  if (body.status !== undefined) {
    if (body.status !== 'Aktif' && body.status !== 'Nonaktif') {
      throw new ManagementAdminError(422, 'Status warga harus Aktif atau Nonaktif.');
    }
    payload.status = body.status;
  }
  if (typeof body.tempat_lahir === 'string') payload.tempat_lahir = body.tempat_lahir.trim();
  if (typeof body.no_hp === 'string') payload.no_hp = body.no_hp.trim();
  if (typeof body.alamat === 'string') payload.alamat = body.alamat.trim();

  if (Object.keys(payload).length === 0) {
    throw new ManagementAdminError(422, 'Minimal satu perubahan data warga harus diisi.');
  }
  return payload;
}

export function validateCreateRtBody(body: Record<string, unknown>): CreateRtInput {
  const idRw = Number(body.id_rw);
  const nomorRt = optionalTrimmedString(body.nomor_rt);
  if (!Number.isSafeInteger(idRw) || idRw <= 0) {
    throw new ManagementAdminError(422, 'RW induk wajib dipilih.');
  }
  if (!nomorRt) {
    throw new ManagementAdminError(422, 'Nomor RT wajib diisi.');
  }
  const namaRt = optionalTrimmedString(body.nama_rt);
  return { id_rw: idRw, nomor_rt: nomorRt, ...(namaRt ? { nama_rt: namaRt } : {}) };
}

export function validateUpdateRtBody(body: Record<string, unknown>): UpdateRtInput {
  const payload: UpdateRtInput = {};
  if (body.id_rw !== undefined) {
    const idRw = Number(body.id_rw);
    if (!Number.isSafeInteger(idRw) || idRw <= 0) throw new ManagementAdminError(422, 'RW induk tidak valid.');
    payload.id_rw = idRw;
  }
  if (body.nomor_rt !== undefined) {
    const nomorRt = optionalTrimmedString(body.nomor_rt);
    if (!nomorRt) throw new ManagementAdminError(422, 'Nomor RT tidak boleh kosong.');
    payload.nomor_rt = nomorRt;
  }
  if (typeof body.nama_rt === 'string' && body.nama_rt.trim()) {
    payload.nama_rt = body.nama_rt.trim();
  }
  if (Object.keys(payload).length === 0) {
    throw new ManagementAdminError(422, 'Minimal satu data RT harus diisi.');
  }
  return payload;
}

export function validateCreateRwBody(body: Record<string, unknown>): CreateRwInput {
  const nomorRw = optionalTrimmedString(body.nomor_rw);
  if (!nomorRw) throw new ManagementAdminError(422, 'Nomor RW wajib diisi.');
  const namaRw = optionalTrimmedString(body.nama_rw);
  return { nomor_rw: nomorRw, ...(namaRw ? { nama_rw: namaRw } : {}) };
}

export function validateUpdateRwBody(body: Record<string, unknown>): UpdateRwInput {
  const payload: UpdateRwInput = {};
  if (body.nomor_rw !== undefined) {
    const nomorRw = optionalTrimmedString(body.nomor_rw);
    if (!nomorRw) throw new ManagementAdminError(422, 'Nomor RW tidak boleh kosong.');
    payload.nomor_rw = nomorRw;
  }
  if (typeof body.nama_rw === 'string' && body.nama_rw.trim()) {
    payload.nama_rw = body.nama_rw.trim();
  }
  if (Object.keys(payload).length === 0) {
    throw new ManagementAdminError(422, 'Minimal satu data RW harus diisi.');
  }
  return payload;
}

