export class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/** Call same-origin Next.js handlers. Credentials are never readable by JS. */
export async function apiRequest<T>(endpoint: string, { body, headers: extraHeaders, ...init }: RequestOptions = {}): Promise<T> {
  const headers = new Headers(extraHeaders);
  headers.set('Accept', 'application/json');
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...init,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      cache: 'no-store',
      signal: init.signal ?? AbortSignal.timeout(20_000),
    });
  } catch {
    throw new ApiRequestError('Tidak dapat terhubung. Periksa koneksi lalu coba lagi.', 0);
  }
  let data: unknown;
  try { data = await response.json(); } catch {
    throw new ApiRequestError('Respons layanan tidak valid. Silakan coba lagi.', response.ok ? 502 : response.status);
  }
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
      ? data.message : 'Permintaan gagal. Silakan coba lagi.';
    throw new ApiRequestError(message, response.status);
  }
  return data as T;
}
