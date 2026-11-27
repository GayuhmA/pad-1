import { sessionResponse } from '@/lib/server/auth';
import { backendGetActiveLogo } from '@/lib/server/logo';
import { handleLogoRouteError } from '@/lib/server/logo-route-helpers';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return sessionResponse(await backendGetActiveLogo());
  } catch (error) {
    return handleLogoRouteError(error, 'Logo aktif gagal dimuat. Silakan coba lagi.');
  }
}

