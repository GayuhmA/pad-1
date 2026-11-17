import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendNotificationList, NotificationServiceError } from '@/lib/server/notifications';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new NotificationServiceError(401, 'Silakan masuk untuk melanjutkan.');
    const statusBacaParam = request.nextUrl.searchParams.get('status_baca');
    if (statusBacaParam !== null && statusBacaParam !== 'true' && statusBacaParam !== 'false') {
      throw new NotificationServiceError(422, 'Filter status baca tidak valid.');
    }
    const statusBaca = statusBacaParam === null ? undefined : statusBacaParam === 'true';
    return sessionResponse(await backendNotificationList(token, statusBaca));
  } catch (error) {
    if (error instanceof NotificationServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Layanan notifikasi sedang bermasalah. Silakan coba lagi.' }, 500);
  }
}
