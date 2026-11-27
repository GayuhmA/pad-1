const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
};

function resolveFilename(filename: string, contentType: string): string {
  const trimmed = filename.trim() || 'gambar';
  if (/\.[a-zA-Z0-9]{2,5}$/.test(trimmed)) {
    return trimmed;
  }
  const mimeBase = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  const ext = MIME_EXTENSION_MAP[mimeBase];
  return ext ? `${trimmed}${ext}` : trimmed;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1_000);
}

/**
 * Downloads an image directly to the user's device without navigating away
 * or opening a new tab. Cross-origin URLs are fetched through `/api/download`.
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  const isDataOrBlob = url.startsWith('data:') || url.startsWith('blob:');
  const resolvedUrl = new URL(url, window.location.origin);
  const isSameOrigin = isDataOrBlob || resolvedUrl.origin === window.location.origin;

  const fetchTarget = isSameOrigin
    ? url
    : `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;

  const response = await fetch(fetchTarget, {
    credentials: isSameOrigin && !isDataOrBlob ? 'same-origin' : 'omit',
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = 'Gagal mengunduh gambar. Silakan coba lagi.';
    try {
      const data = await response.json();
      if (data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()) {
        message = data.message;
      }
    } catch {
      // Ignore non-JSON error body
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const resolvedName = resolveFilename(filename, blob.type || response.headers.get('content-type') || '');
  triggerBlobDownload(blob, resolvedName);
}

