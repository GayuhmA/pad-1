import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendPengaturanPembayaran, IuranServiceError } from '@/lib/server/iuran';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const data = await backendPengaturanPembayaran(token);
    return sessionResponse(data);
  } catch (error) {
    if (error instanceof IuranServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Pengaturan pembayaran gagal dimuat. Silakan coba lagi.' }, 500);
  }
}

