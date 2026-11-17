import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendUnreadNotificationCount, NotificationServiceError } from '@/lib/server/notifications';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new NotificationServiceError(401, 'Silakan masuk untuk melanjutkan.');
    return sessionResponse(await backendUnreadNotificationCount(token));
  } catch (error) {
    if (error instanceof NotificationServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Layanan notifikasi sedang bermasalah. Silakan coba lagi.' }, 500);
  }
}
