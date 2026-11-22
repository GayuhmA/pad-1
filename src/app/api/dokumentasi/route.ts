import { NextRequest } from 'next/server';
import { requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import {
  backendCreateAlbum,
  backendGetAlbums,
  DokumentasiError,
} from '@/lib/server/dokumentasi';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const search = request.nextUrl.searchParams.get('search') ?? undefined;
    const idPeriode = request.nextUrl.searchParams.get('id_periode');
    const idLomba = request.nextUrl.searchParams.get('id_lomba');

    return sessionResponse(
      await backendGetAlbums(token, {
        search,
        id_periode: idPeriode ? Number(idPeriode) : undefined,
        id_lomba: idLomba ? Number(idLomba) : undefined,
      }),
    );
  } catch (error) {
    if (error instanceof DokumentasiError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Layanan dokumentasi sedang bermasalah. Silakan coba lagi.' },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new DokumentasiError(401, 'Silakan masuk untuk melanjutkan.');

    const formData = await request.formData();
    const namaAlbum = formData.get('nama_album');
    if (!namaAlbum || typeof namaAlbum !== 'string' || !namaAlbum.trim()) {
      throw new DokumentasiError(422, 'Nama album wajib diisi.');
    }

    return sessionResponse(await backendCreateAlbum(token, formData), 201);
  } catch (error) {
    if (error instanceof DokumentasiError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Gagal membuat album dokumentasi. Silakan coba lagi.' },
      500,
    );
  }
}

