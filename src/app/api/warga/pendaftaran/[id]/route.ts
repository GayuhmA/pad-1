import { NextRequest } from 'next/server';
import {
  AuthServiceError,
  SESSION_COOKIE,
  requireSameOrigin,
  sessionResponse,
} from '@/lib/server/auth';
import {
  backendBatalkanPendaftaran,
  PendaftaranServiceError,
} from '@/lib/server/pendaftaran';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new PendaftaranServiceError(401, 'Silakan masuk untuk melanjutkan.');

    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      throw new PendaftaranServiceError(422, 'Pendaftaran yang dipilih tidak valid.');
    }
    const idPendaftaran = Number(id);
    if (!Number.isSafeInteger(idPendaftaran) || idPendaftaran <= 0) {
      throw new PendaftaranServiceError(422, 'Pendaftaran yang dipilih tidak valid.');
    }

    return sessionResponse(await backendBatalkanPendaftaran(token, idPendaftaran));
  } catch (error) {
    if (error instanceof PendaftaranServiceError || error instanceof AuthServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Pembatalan pendaftaran gagal diproses. Silakan coba lagi.' }, 500);
  }
}
