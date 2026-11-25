import 'server-only';

import type { NextRequest } from 'next/server';
import { AuthServiceError, requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { ManagementLombaError } from '@/lib/server/management-lomba';
import type { LombaSchedulePayload, SaveManagementLombaInput } from '@/types/management-lomba';

export function requireLombaSession(request: NextRequest, isMutation = false): string {
  if (isMutation) requireSameOrigin(request);
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) throw new ManagementLombaError(401, 'Silakan masuk untuk melanjutkan.');
  return token;
}

export function parseLombaId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ManagementLombaError(400, 'ID lomba tidak valid.');
  }
  return id;
}

export function handleLombaRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof ManagementLombaError) {
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

export async function parseSaveLombaBody(request: NextRequest): Promise<SaveManagementLombaInput> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ManagementLombaError(400, 'Format data lomba tidak valid.');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ManagementLombaError(422, 'Data lomba wajib diisi.');
  }
  const body = raw as Record<string, unknown>;

  const idKategori = Number(body.id_kategori);
  if (!Number.isSafeInteger(idKategori) || idKategori <= 0) {
    throw new ManagementLombaError(422, 'Kategori lomba wajib dipilih.');
  }

  const namaLomba = typeof body.nama_lomba === 'string' ? body.nama_lomba.trim() : '';
  if (!namaLomba) {
    throw new ManagementLombaError(422, 'Nama lomba wajib diisi.');
  }

  const jenis = body.jenis_pendaftaran;
  if (jenis !== 'Individu' && jenis !== 'Beregu') {
    throw new ManagementLombaError(422, 'Jenis pendaftaran harus Individu atau Beregu.');
  }

  const status = body.status === 'Ditutup' ? 'Ditutup' : 'Dibuka';

  if (!Array.isArray(body.jadwal) || body.jadwal.length === 0) {
    throw new ManagementLombaError(422, 'Minimal satu jadwal perlombaan wajib diisi.');
  }

  const jadwal: LombaSchedulePayload[] = body.jadwal.map((entry, idx) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new ManagementLombaError(422, `Jadwal ke-${idx + 1} tidak valid.`);
    }
    const item = entry as Record<string, unknown>;
    const tanggal = typeof item.tanggal === 'string' ? item.tanggal.trim() : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
      throw new ManagementLombaError(422, 'Tanggal jadwal harus menggunakan format YYYY-MM-DD.');
    }

    const waktuMulai = typeof item.waktu_mulai === 'string' ? item.waktu_mulai.trim().slice(0, 5) : undefined;
    const waktuSelesai = typeof item.waktu_selesai === 'string' ? item.waktu_selesai.trim().slice(0, 5) : undefined;
    if (waktuMulai && !/^\d{2}:\d{2}$/.test(waktuMulai)) {
      throw new ManagementLombaError(422, 'Format waktu mulai harus JJ:MM.');
    }
    if (waktuSelesai && !/^\d{2}:\d{2}$/.test(waktuSelesai)) {
      throw new ManagementLombaError(422, 'Format waktu selesai harus JJ:MM.');
    }
    if (waktuMulai && waktuSelesai && waktuSelesai <= waktuMulai) {
      throw new ManagementLombaError(422, 'Waktu selesai harus setelah waktu mulai.');
    }

    const lokasi = typeof item.lokasi === 'string' ? item.lokasi.trim() : undefined;
    return {
      tanggal,
      ...(waktuMulai ? { waktu_mulai: waktuMulai } : {}),
      ...(waktuSelesai ? { waktu_selesai: waktuSelesai } : {}),
      ...(lokasi ? { lokasi } : {}),
    };
  });

  let kapasitas: number | null = null;
  if (body.kapasitas_peserta !== null && body.kapasitas_peserta !== undefined && body.kapasitas_peserta !== '') {
    const parsed = Number(body.kapasitas_peserta);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      throw new ManagementLombaError(422, 'Kuota lomba minimal 1.');
    }
    kapasitas = parsed;
  }

  let batasAnggota: number | null = null;
  if (jenis === 'Beregu' && body.batas_anggota_tim !== null && body.batas_anggota_tim !== undefined && body.batas_anggota_tim !== '') {
    const parsed = Number(body.batas_anggota_tim);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      throw new ManagementLombaError(422, 'Batas anggota regu minimal 1.');
    }
    batasAnggota = parsed;
  }

  const deskripsi = typeof body.deskripsi === 'string' ? body.deskripsi.trim() : undefined;

  return {
    id_kategori: idKategori,
    nama_lomba: namaLomba,
    jenis_pendaftaran: jenis,
    status,
    ...(deskripsi ? { deskripsi } : {}),
    kapasitas_peserta: kapasitas,
    batas_anggota_tim: jenis === 'Beregu' ? batasAnggota : null,
    jadwal,
  };
}

