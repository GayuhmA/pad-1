import { NextRequest } from 'next/server';
import { AuthServiceError, requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import {
  backendCreateMessage,
  backendGetMessages,
  ManagementPesanError,
} from '@/lib/server/management-pesan';
import type { MessageStatus } from '@/types/management-pesan';

export const runtime = 'nodejs';

function handleError(error: unknown, fallbackMessage: string) {
  if (error instanceof ManagementPesanError) {
    return sessionResponse(
      { message: error.message, ...(error.errors ? { errors: error.errors } : {}) },
      error.status,
    );
  }
  if (error instanceof AuthServiceError) {
    return sessionResponse({ message: error.message }, error.status);
  }
  return sessionResponse({ message: fallbackMessage }, 500);
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementPesanError(401, 'Silakan masuk untuk melanjutkan.');

    const status = request.nextUrl.searchParams.get('status') ?? undefined;
    const search = request.nextUrl.searchParams.get('search') ?? undefined;

    return sessionResponse(await backendGetMessages(token, { status, search }));
  } catch (error) {
    return handleError(error, 'Layanan pesan sedang bermasalah. Silakan coba lagi.');
  }
}

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementPesanError(401, 'Silakan masuk untuk melanjutkan.');

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ManagementPesanError(400, 'Format data tidak valid.');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ManagementPesanError(422, 'Data pesan wajib diisi.');
    }

    const payload = body as Record<string, unknown>;
    const subject = typeof payload.subject === 'string' ? payload.subject.trim() : '';
    const messageBody = typeof payload.body === 'string' ? payload.body.trim() : '';
    const status: MessageStatus = payload.status === 'sent' ? 'sent' : 'draft';

    if (status === 'sent' && (!subject || !messageBody)) {
      throw new ManagementPesanError(422, 'Subjek dan isi pesan wajib diisi sebelum mengirim.');
    }
    if (!subject && !messageBody) {
      throw new ManagementPesanError(422, 'Isi subjek atau pesan terlebih dahulu.');
    }

    const result = await backendCreateMessage(
      token,
      { subject: subject || 'Draft tanpa subjek', body: messageBody },
    );
    return sessionResponse(result, 201);
  } catch (error) {
    return handleError(error, 'Gagal menyimpan pesan. Silakan coba lagi.');
  }
}

