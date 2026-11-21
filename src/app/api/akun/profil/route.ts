import { NextRequest } from 'next/server';
import { AuthServiceError, SESSION_COOKIE, authError, requireSameOrigin, sessionResponse } from '@/lib/server/auth';
import { backendUpdateProfil } from '@/lib/server/profile';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new AuthServiceError(401, 'Silakan masuk untuk melanjutkan.');

    let input: unknown;
    try { input = await request.json(); } catch {
      throw new AuthServiceError(400, 'Data profil tidak valid.');
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new AuthServiceError(422, 'Data profil tidak valid.');
    }
    const { nama, tempat_lahir, tanggal_lahir, alamat, no_hp } = input as Record<string, unknown>;
    if (typeof nama !== 'string' || !nama.trim() || nama.length > 200) {
      throw new AuthServiceError(422, 'Nama lengkap wajib diisi dan tidak boleh lebih dari 200 karakter.');
    }

    const body = {
      nama: nama.trim(),
      tempat_lahir: typeof tempat_lahir === 'string' ? tempat_lahir.trim() : '',
      tanggal_lahir: typeof tanggal_lahir === 'string' ? tanggal_lahir : '',
      alamat: typeof alamat === 'string' ? alamat.trim() : '',
      no_hp: typeof no_hp === 'string' ? no_hp.trim() : '',
    };

    const result = await backendUpdateProfil(token, body);
    return sessionResponse({ success: true, message: result.message ?? 'Profil berhasil diperbarui.' });
  } catch (error) { return authError(error); }
}

