import { NextRequest } from 'next/server';
import { requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import {
  backendDeleteAlbum,
  backendGetAlbumDetail,
  backendUpdateAlbum,
  DokumentasiError,
} from '@/lib/server/dokumentasi';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const { id } = await context.params;
    const idAlbum = Number(id);
    if (!Number.isSafeInteger(idAlbum) || idAlbum <= 0) {
      throw new DokumentasiError(400, 'ID album tidak valid.');
    }

    return sessionResponse(await backendGetAlbumDetail(token, idAlbum));
  } catch (error) {
    if (error instanceof DokumentasiError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Gagal memuat detail album. Silakan coba lagi.' },
      500,
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new DokumentasiError(401, 'Silakan masuk untuk melanjutkan.');

    const { id } = await context.params;
    const idAlbum = Number(id);
    if (!Number.isSafeInteger(idAlbum) || idAlbum <= 0) {
      throw new DokumentasiError(400, 'ID album tidak valid.');
    }

    const body = await request.json();
    return sessionResponse(await backendUpdateAlbum(token, idAlbum, body));
  } catch (error) {
    if (error instanceof DokumentasiError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Gagal memperbarui album dokumentasi. Silakan coba lagi.' },
      500,
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new DokumentasiError(401, 'Silakan masuk untuk melanjutkan.');

    const { id } = await context.params;
    const idAlbum = Number(id);
    if (!Number.isSafeInteger(idAlbum) || idAlbum <= 0) {
      throw new DokumentasiError(400, 'ID album tidak valid.');
    }

    return sessionResponse(await backendDeleteAlbum(token, idAlbum));
  } catch (error) {
    if (error instanceof DokumentasiError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Gagal menghapus album dokumentasi. Silakan coba lagi.' },
      500,
    );
  }
}

