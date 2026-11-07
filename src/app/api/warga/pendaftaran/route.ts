import { NextRequest } from 'next/server';
import {
  AuthServiceError,
  SESSION_COOKIE,
  requireSameOrigin,
  sessionResponse,
} from '@/lib/server/auth';
import { backendDaftarKeLomba, LombaServiceError } from '@/lib/server/lomba';
import {
  backendRiwayatPendaftaran,
  PendaftaranServiceError,
} from '@/lib/server/pendaftaran';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new PendaftaranServiceError(401, 'Silakan masuk untuk melanjutkan.');
    return sessionResponse(await backendRiwayatPendaftaran(token));
  } catch (error) {
    if (error instanceof PendaftaranServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Layanan pendaftaran sedang bermasalah. Silakan coba lagi.' }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new LombaServiceError(401, 'Silakan masuk untuk melanjutkan.');

    let input: unknown;
    try { input = await request.json(); } catch {
      throw new LombaServiceError(400, 'Data pendaftaran tidak valid.');
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new LombaServiceError(422, 'Lomba yang dipilih tidak valid.');
    }
    const idLomba = (input as Record<string, unknown>).id_lomba;
    if (!Number.isInteger(idLomba) || (idLomba as number) <= 0) {
      throw new LombaServiceError(422, 'Lomba yang dipilih tidak valid.');
    }
    return sessionResponse(await backendDaftarKeLomba(token, idLomba as number), 201);
  } catch (error) {
    if (error instanceof LombaServiceError || error instanceof AuthServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Layanan pendaftaran sedang bermasalah. Silakan coba lagi.' }, 500);
  }
}
