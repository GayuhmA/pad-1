import { NextRequest } from 'next/server';
import { AuthServiceError, requireSameOrigin, SESSION_COOKIE, sessionResponse } from '@/lib/server/auth';
import {
  backendDeleteMessage,
  backendGetMessageDetail,
  backendUpdateMessage,
  ManagementPesanError,
} from '@/lib/server/management-pesan';

export const runtime = 'nodejs';

function parseMessageId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ManagementPesanError(400, 'ID pesan tidak valid.');
  }
  return id;
}

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementPesanError(401, 'Silakan masuk untuk melanjutkan.');
    const { id } = await context.params;
    return sessionResponse(await backendGetMessageDetail(token, parseMessageId(id)));
  } catch (error) {
    return handleError(error, 'Layanan pesan sedang bermasalah. Silakan coba lagi.');
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementPesanError(401, 'Silakan masuk untuk melanjutkan.');
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ManagementPesanError(400, 'Format data tidak valid.');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ManagementPesanError(422, 'Data draft wajib diisi.');
    }

    const payload = body as Record<string, unknown>;
    const subject = typeof payload.subject === 'string' ? payload.subject.trim() : '';
    const messageBody = typeof payload.body === 'string' ? payload.body.trim() : '';
    if (!subject && !messageBody) {
      throw new ManagementPesanError(422, 'Isi subjek atau pesan terlebih dahulu.');
    }

    return sessionResponse(
      await backendUpdateMessage(token, parseMessageId(id), {
        subject: subject || 'Draft tanpa subjek',
        body: messageBody,
      }),
    );
  } catch (error) {
    return handleError(error, 'Gagal memperbarui draft. Silakan coba lagi.');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) throw new ManagementPesanError(401, 'Silakan masuk untuk melanjutkan.');
    const { id } = await context.params;
    return sessionResponse(await backendDeleteMessage(token, parseMessageId(id)));
  } catch (error) {
    return handleError(error, 'Gagal menghapus draft. Silakan coba lagi.');
  }
}

