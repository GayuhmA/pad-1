import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendDetailIuran, IuranServiceError } from '@/lib/server/iuran';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new IuranServiceError(401, 'Silakan masuk untuk melanjutkan.');
    const { id } = await params;
    if (!/^\d+$/.test(id)) throw new IuranServiceError(422, 'Tagihan yang dipilih tidak valid.');
    const idIuran = Number(id);
    if (!Number.isSafeInteger(idIuran) || idIuran <= 0) {
      throw new IuranServiceError(422, 'Tagihan yang dipilih tidak valid.');
    }
    return sessionResponse(await backendDetailIuran(token, idIuran));
  } catch (error) {
    if (error instanceof IuranServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Detail iuran gagal dimuat. Silakan coba lagi.' }, 500);
  }
}
