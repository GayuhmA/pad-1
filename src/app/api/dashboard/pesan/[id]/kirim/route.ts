import { NextRequest } from 'next/server';
import { AuthServiceError, requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendSendMessage, ManagementPesanError } from '@/lib/server/management-pesan';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementPesanError(401, 'Silakan masuk untuk melanjutkan.');

    const { id } = await context.params;
    const messageId = Number(id);
    if (!Number.isSafeInteger(messageId) || messageId <= 0) {
      throw new ManagementPesanError(400, 'ID pesan tidak valid.');
    }

    return sessionResponse(await backendSendMessage(token, messageId));
  } catch (error) {
    if (error instanceof ManagementPesanError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    if (error instanceof AuthServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Gagal mengirim pesan. Silakan coba lagi.' }, 500);
  }
}

