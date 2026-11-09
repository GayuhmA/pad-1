import { NextRequest } from 'next/server';
import {
  AuthServiceError,
  SESSION_COOKIE,
  requireSameOrigin,
  sessionResponse,
} from '@/lib/server/auth';
import { backendAjukanPembayaranIuran, IuranServiceError } from '@/lib/server/iuran';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new IuranServiceError(401, 'Silakan masuk untuk melanjutkan.');

    const { id } = await params;
    if (!/^\d+$/.test(id)) throw new IuranServiceError(422, 'Tagihan yang dipilih tidak valid.');
    const idIuran = Number(id);
    if (!Number.isSafeInteger(idIuran) || idIuran <= 0) {
      throw new IuranServiceError(422, 'Tagihan yang dipilih tidak valid.');
    }

    let body: FormData;
    try { body = await request.formData(); } catch {
      throw new IuranServiceError(400, 'Data pembayaran tidak valid.');
    }
    const metodeValue = body.get('metode');
    const nominalValue = body.get('nominal');
    const buktiValue = body.get('bukti_bayar');
    const metode = typeof metodeValue === 'string' ? metodeValue.trim() : '';
    if (!metode || metode.length > 50) {
      throw new IuranServiceError(422, 'Metode pembayaran tidak valid.');
    }
    if (typeof nominalValue !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(nominalValue)) {
      throw new IuranServiceError(422, 'Nominal pembayaran tidak valid.');
    }
    const nominal = Number(nominalValue);
    if (!Number.isFinite(nominal) || nominal <= 0) {
      throw new IuranServiceError(422, 'Nominal pembayaran tidak valid.');
    }
    if (!(buktiValue instanceof File) || buktiValue.size === 0 ||
        buktiValue.size > MAX_FILE_SIZE || !ALLOWED_TYPES.has(buktiValue.type)) {
      throw new IuranServiceError(422, 'Bukti bayar harus berupa JPG, PNG, atau WebP berukuran maksimal 2 MB.');
    }

    return sessionResponse(await backendAjukanPembayaranIuran(token, idIuran, {
      metode,
      nominal,
      buktiBayar: buktiValue,
    }), 201);
  } catch (error) {
    if (error instanceof IuranServiceError || error instanceof AuthServiceError) {
      return sessionResponse({ message: error.message }, error.status);
    }
    return sessionResponse({ message: 'Pembayaran gagal diajukan. Silakan coba lagi.' }, 500);
  }
}
