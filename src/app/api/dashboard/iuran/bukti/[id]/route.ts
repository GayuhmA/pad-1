import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendGetPaymentProofBinary, ManagementIuranError } from '@/lib/server/management-iuran';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementIuranError(401, 'Silakan masuk untuk melanjutkan.');

    const { id } = await context.params;
    const idPembayaran = Number(id);
    if (!Number.isSafeInteger(idPembayaran) || idPembayaran <= 0) {
      throw new ManagementIuranError(400, 'ID pembayaran tidak valid.');
    }

    const { buffer, contentType } = await backendGetPaymentProofBinary(token, idPembayaran);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof ManagementIuranError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse(
      { message: 'Bukti pembayaran gagal dimuat.' },
      500,
    );
  }
}

