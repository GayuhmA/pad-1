import { NextRequest } from 'next/server';
import { requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import { backendUploadMedia, DokumentasiError } from '@/lib/server/dokumentasi';

export const runtime = 'nodejs';

export async function POST(
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

    const formData = await request.formData();
    const jenisFile = formData.get('jenis_file');
    const file = formData.get('file');

    if (jenisFile !== 'Foto' && jenisFile !== 'Video') {
      throw new DokumentasiError(422, 'Jenis file harus berupa Foto atau Video.');
    }
    if (!file || typeof file === 'string') {
      throw new DokumentasiError(422, 'File foto atau video wajib diunggah.');
    }

    return sessionResponse(await backendUploadMedia(token, idAlbum, formData), 201);
  } catch (error) {
    if (error instanceof DokumentasiError) {
      return sessionResponse(
        { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
        error.status,
      );
    }
    return sessionResponse(
      { message: 'Gagal mengunggah media dokumentasi. Silakan coba lagi.' },
      500,
    );
  }
}

