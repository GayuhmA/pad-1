import { NextRequest } from 'next/server';
import { sessionResponse } from '@/lib/server/auth';
import { backendGetManagementTagihanPayments } from '@/lib/server/management-iuran';
import {
  handleTagihanRouteError,
  parsePositiveTagihanId,
  requireTagihanSession,
} from '@/lib/server/tagihan-route-helpers';
import type { TagihanPaymentStatusFilter } from '@/types/management-iuran';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = requireTagihanSession(request);
    const { id } = await context.params;
    const idTagihan = parsePositiveTagihanId(id);
    const { searchParams } = request.nextUrl;
    const statusParam = searchParams.get('status');
    const status: TagihanPaymentStatusFilter | undefined =
      statusParam === 'Belum Bayar' || statusParam === 'Sudah Bayar' || statusParam === 'Semua'
        ? statusParam
        : undefined;
    const pageParam = searchParams.get('page');
    const page = pageParam && /^\d+$/.test(pageParam) ? Number(pageParam) : undefined;
    const perPageParam = searchParams.get('per_page');
    const per_page = perPageParam && /^\d+$/.test(perPageParam) ? Number(perPageParam) : undefined;

    return sessionResponse(
      await backendGetManagementTagihanPayments(token, idTagihan, { status, page, per_page }),
    );
  } catch (error) {
    return handleTagihanRouteError(error, 'Status pembayaran tagihan gagal dimuat. Silakan coba lagi.');
  }
}

