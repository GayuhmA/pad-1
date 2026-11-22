import { NextRequest } from 'next/server';
import { requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendDeleteMedia, DokumentasiError } from '@/lib/server/dokumentasi';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; idMedia: string }> },
) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new DokumentasiError(401, 'Silakan masuk untuk melanjutkan.');

    const { id, idMedia } = await context.params;
    const idAlbum = Number(id);
    const idDokumentasi = Number(idMedia);

    if (!Number.isSafeInteger(idAlbum) || idAlbum <= 0) {
      throw new DokumentasiError(400, 'ID album tidak valid.');
    }
    if (!Number.isSafeInteger(idDokumentasi) || idDokumentasi <= 0) {
      throw new DokumentasiError(400, 'ID media tidak valid.');
    }

    return sessionResponse(await backendDeleteMedia(token, idAlbum, idDokumentasi));
  } catch (error) {
    if (error instanceof DokumentasiError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Gagal menghapus media dokumentasi. Silakan coba lagi.' },
      500,
    );
  }
}

