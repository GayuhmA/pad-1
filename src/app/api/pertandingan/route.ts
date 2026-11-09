import { NextRequest } from 'next/server';
import { ManagementDashboardError, backendCreateMatch } from '@/lib/server/management-dashboard';
import { AuthServiceError, requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import type { CreateMatchInput } from '@/types/dashboard';

export const runtime = 'nodejs';

function validInput(value: unknown): value is CreateMatchInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  return Number.isInteger(input.id_lomba) && (input.id_lomba as number) > 0 &&
    (input.id_jadwal == null || (Number.isInteger(input.id_jadwal) && (input.id_jadwal as number) > 0)) &&
    typeof input.peserta_1 === 'string' && input.peserta_1.trim().length > 0 && input.peserta_1.length <= 150 &&
    typeof input.peserta_2 === 'string' && input.peserta_2.trim().length > 0 && input.peserta_2.length <= 150 &&
    input.peserta_1.trim() !== input.peserta_2.trim() &&
    (input.babak == null || (typeof input.babak === 'string' && input.babak.length <= 50)) &&
    typeof input.tanggal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.tanggal) &&
    typeof input.waktu_mulai === 'string' && /^\d{2}:\d{2}$/.test(input.waktu_mulai) &&
    (input.waktu_selesai == null || (typeof input.waktu_selesai === 'string' && /^\d{2}:\d{2}$/.test(input.waktu_selesai))) &&
    (input.status == null || ['Dijadwalkan', 'Berlangsung', 'Selesai'].includes(String(input.status)));
}

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementDashboardError(401, 'Silakan masuk untuk melanjutkan.');
    let body: unknown;
    try { body = await request.json(); } catch {
      throw new ManagementDashboardError(422, 'Data pertandingan tidak valid.');
    }
    if (!validInput(body)) throw new ManagementDashboardError(422, 'Periksa kembali data pertandingan.');
    if (body.waktu_selesai && body.waktu_selesai <= body.waktu_mulai) {
      throw new ManagementDashboardError(422, 'Waktu selesai harus setelah waktu mulai.');
    }
    return sessionResponse(await backendCreateMatch(token, body), 201);
  } catch (error) {
    if (error instanceof ManagementDashboardError || error instanceof AuthServiceError) {
      const body = error instanceof ManagementDashboardError && error.errors
        ? { message: error.message, errors: error.errors }
        : { message: error.message };
      return sessionResponse(body, error.status);
    }
    return sessionResponse({ message: 'Pertandingan gagal disimpan. Silakan coba lagi.' }, 500);
  }
}
