const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
const { NextRequest } = require('next/server');
const { GET: downloadRoute } = require('../src/app/api/download/route.ts');

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

function downloadRequest(params = {}) {
  const url = new URL('https://frontend.example/api/download');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url.toString());
}

test('download route rejects missing or invalid url parameter', async () => {
  const missingRes = await downloadRoute(downloadRequest());
  assert.equal(missingRes.status, 400);

  const invalidRes = await downloadRoute(downloadRequest({ url: 'not-a-url' }));
  assert.equal(invalidRes.status, 400);
});

test('download route rejects disallowed origins to prevent SSRF', async () => {
  const evilRes = await downloadRoute(downloadRequest({ url: 'https://evil.example/qris.png' }));
  assert.equal(evilRes.status, 403);

  const metadataRes = await downloadRoute(downloadRequest({ url: 'http://169.254.169.254/latest/meta-data' }));
  assert.equal(metadataRes.status, 403);
});

test('download route proxies allowed image with attachment Content-Disposition and sanitized filename', async () => {
  const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://res.cloudinary.com/demo/image/upload/qris-warga');
    assert.equal(init.redirect, 'manual');
    return new Response(pngBytes, {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    });
  };

  const response = await downloadRoute(
    downloadRequest({
      url: 'https://res.cloudinary.com/demo/image/upload/qris-warga',
      filename: '../../qris-iuran"bad',
    }),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(response.headers.get('content-disposition'), 'attachment; filename="qris-iuran_bad.png"');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), pngBytes);
});

test('download route proxies backend API_URL origin and rejects non-image content types', async () => {
  global.fetch = async () => new Response('<html>not image</html>', {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });

  const response = await downloadRoute(
    downloadRequest({ url: 'https://backend.example/storage/qris.png' }),
  );
  assert.equal(response.status, 502);
});

test('download route blocks redirects to disallowed origins', async () => {
  global.fetch = async () => new Response(null, {
    status: 302,
    headers: { Location: 'https://evil.example/payload.png' },
  });

  const response = await downloadRoute(
    downloadRequest({ url: 'https://backend.example/storage/qris.png' }),
  );
  assert.equal(response.status, 403);
});

