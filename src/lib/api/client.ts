const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

// ─── Custom Error ───────────────────────────────────────────────

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

// ─── Token helpers (client‑side only) ───────────────────────────

const TOKEN_KEY = 'auth_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Generic fetch wrapper ──────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** If true the Authorization header is attached automatically. */
  authenticated?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  { body, authenticated = false, headers: extraHeaders, ...init }: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(extraHeaders);
  headers.set('Accept', 'application/json');

  if (body) {
    headers.set('Content-Type', 'application/json');
  }

  if (authenticated) {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!response.ok) {
        throw new ApiRequestError(
          `Request failed with status ${response.status}`,
          response.status,
          text,
        );
      }
    }
  }

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === 'object' && 'message' in data)
        ? String((data as Record<string, unknown>).message)
        : `Request failed with status ${response.status}`;
    throw new ApiRequestError(errorMessage, response.status, data);
  }

  return data as T;
}
