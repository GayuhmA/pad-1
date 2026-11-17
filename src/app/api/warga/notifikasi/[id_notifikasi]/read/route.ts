import { NextRequest } from 'next/server';
import {
  AuthServiceError,
  requireSameOrigin,
  SESSION_COOKIE,
  sessionResponse,
} from '@/lib/server/auth';
import { backendMarkNotificationAsRead, NotificationServiceError } from '@/lib/server/notifications';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id_notifikasi: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new NotificationServiceError(401, 'Silakan masuk untuk melanjutkan.');
    const { id_notifikasi: rawId } = await params;
    if (!/^\d+$/.test(rawId)) throw new NotificationServiceError(422, 'Notifikasi yang dipilih tidak valid.');
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new NotificationServiceError(422, 'Notifikasi yang dipilih tidak valid.');
    }
    return sessionResponse(await backendMarkNotificationAsRead(token, id));
  } catch (error) {
    if (error instanceof NotificationServiceError || error instanceof AuthServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Notifikasi gagal diperbarui. Silakan coba lagi.' }, 500);
  }
}
