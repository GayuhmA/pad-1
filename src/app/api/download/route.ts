import { NextRequest, NextResponse } from 'next/server';
import { Agent } from 'undici';

export const runtime = 'nodejs';

const downloadDispatcher = new Agent({
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 2_000,
  connectTimeout: 10_000,
});

const ALLOWED_STATIC_ORIGINS = new Set([
  'https://res.cloudinary.com',
  'https://placecats.com',
]);

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
};

const MAX_REDIRECTS = 3;

function getAllowedOrigins(): Set<string> {
  const origins = new Set(ALLOWED_STATIC_ORIGINS);
  const apiBase = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (apiBase) {
    try {
      origins.add(new URL(apiBase).origin);
    } catch {
      // Ignore invalid env URL
    }
  }
  return origins;
}

function isAllowedImageUrl(rawUrl: string, allowedOrigins: Set<string>): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null;
  }
  if (!allowedOrigins.has(parsed.origin)) {
    return null;
  }
  return parsed;
}

function sanitizeFilename(rawName: string | null, sourceUrl: URL, contentType: string): string {
  const urlBasename = sourceUrl.pathname.split('/').pop() ?? '';
  const candidate = (rawName?.trim() || urlBasename || 'gambar').split(/[\\/]/).pop() ?? 'gambar';
  const cleaned = candidate.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  const baseName = cleaned || 'gambar';

  const mimeBase = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  const expectedExt = MIME_EXTENSION_MAP[mimeBase];
  const hasKnownExt = /\.[a-zA-Z0-9]{2,5}$/.test(baseName);

  if (!hasKnownExt && expectedExt) {
    return `${baseName}${expectedExt}`;
  }
  return baseName;
}

async function fetchAllowedImage(initialUrl: URL, allowedOrigins: Set<string>): Promise<{ response: Response; finalUrl: URL }> {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(currentUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(20_000),
      dispatcher: downloadDispatcher,
    } as RequestInit & { dispatcher: Agent });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error('INVALID_REDIRECT');
      }
      const nextUrl = new URL(location, currentUrl);
      if (!allowedOrigins.has(nextUrl.origin) || (nextUrl.protocol !== 'https:' && nextUrl.protocol !== 'http:')) {
        throw new Error('DISALLOWED_REDIRECT');
      }
      currentUrl = nextUrl;
      continue;
    }

    return { response, finalUrl: currentUrl };
  }

  throw new Error('TOO_MANY_REDIRECTS');
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return NextResponse.json({ message: 'Parameter URL gambar wajib diisi.' }, { status: 400 });
  }

  const allowedOrigins = getAllowedOrigins();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ message: 'URL gambar tidak valid.' }, { status: 400 });
  }

  if (!isAllowedImageUrl(rawUrl, allowedOrigins)) {
    return NextResponse.json({ message: 'Sumber gambar tidak diizinkan.' }, { status: 403 });
  }

  let fetchResult: { response: Response; finalUrl: URL };
  try {
    fetchResult = await fetchAllowedImage(parsedUrl, allowedOrigins);
  } catch (error) {
    if (error instanceof Error && error.message === 'DISALLOWED_REDIRECT') {
      return NextResponse.json({ message: 'Pengalihan sumber gambar tidak diizinkan.' }, { status: 403 });
    }
    return NextResponse.json({ message: 'Gagal mengunduh gambar dari server.' }, { status: 502 });
  }

  const { response, finalUrl } = fetchResult;
  if (!response.ok) {
    return NextResponse.json({ message: 'Gambar tidak ditemukan atau gagal dimuat.' }, { status: 502 });
  }

  const contentType = response.headers.get('content-type') ?? '';
  const mimeType = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!mimeType.startsWith('image/')) {
    return NextResponse.json({ message: 'File yang diminta bukan gambar yang valid.' }, { status: 502 });
  }

  const filename = sanitizeFilename(request.nextUrl.searchParams.get('filename'), finalUrl, mimeType);
  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
}

