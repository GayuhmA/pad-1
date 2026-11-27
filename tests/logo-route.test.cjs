const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
process.env.APP_ORIGIN = 'https://frontend.example';

const { NextRequest } = require('next/server');
const { GET: getActiveLogo } = require('../src/app/api/logo-aktif/route.ts');
const { GET: getAdminLogos, POST: createAdminLogo } = require('../src/app/api/dashboard/logo/route.ts');
const { POST: updateAdminLogo, DELETE: deleteAdminLogo } = require('../src/app/api/dashboard/logo/[id]/route.ts');
const { PATCH: activateAdminLogo } = require('../src/app/api/dashboard/logo/[id]/aktif/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

function getRequest(path, token = 'admin-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

function formPostRequest(path, formData, { token = 'admin-token', origin = 'https://frontend.example' } = {}) {
  return new NextRequest(`https://frontend.example${path}`, {
    method: 'POST',
    headers: {
      origin,
      ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
    },
    body: formData,
  });
}

function mutationRequest(path, method, { token = 'admin-token', origin = 'https://frontend.example' } = {}) {
  return new NextRequest(`https://frontend.example${path}`, {
    method,
    headers: {
      origin,
      ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
    },
  });
}

test('GET /api/logo-aktif returns active logo or null publicly without auth', async () => {
  global.fetch = async (url) => {
    assert.equal(String(url), 'https://backend.example/api/logo-hut-ri/aktif');
    return Response.json({
      success: true,
      message: 'Logo HUT RI aktif berhasil diambil.',
      data: {
        id_logo: 1,
        tahun: 2026,
        nama_logo: 'Logo HUT RI ke-81',
        gambar: '/storage/logo/logo-2026.png',
        status: 'Aktif',
      },
    });
  };

  const response = await getActiveLogo();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.id_logo, 1);
  assert.equal(body.data.gambar, 'https://backend.example/storage/logo/logo-2026.png');

  global.fetch = async () => Response.json({
    success: true,
    message: 'Belum ada logo HUT RI yang aktif.',
    data: null,
  });
  const emptyRes = await getActiveLogo();
  assert.equal(emptyRes.status, 200);
  const emptyBody = await emptyRes.json();
  assert.equal(emptyBody.data, null);
});

test('GET /api/dashboard/logo requires auth and forwards 403 for non-admin', async () => {
  const unauthRes = await getAdminLogos(getRequest('/api/dashboard/logo', ''));
  assert.equal(unauthRes.status, 401);

  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/admin/logo-hut-ri?status=Aktif');
    assert.equal(init.headers.get('Authorization'), 'Bearer panitia-token');
    return Response.json(
      { success: false, message: 'Anda tidak memiliki akses ke resource ini.' },
      { status: 403 },
    );
  };

  const forbiddenRes = await getAdminLogos(getRequest('/api/dashboard/logo?status=Aktif', 'panitia-token'));
  assert.equal(forbiddenRes.status, 403);
});

test('POST /api/dashboard/logo enforces same-origin, validates multipart, and forwards to backend', async () => {
  const form = new FormData();
  form.set('tahun', '2026');
  form.set('nama_logo', 'Logo HUT RI ke-81');
  form.set('status', 'Aktif');
  form.set('gambar', new File([new Uint8Array([1, 2, 3])], 'logo.png', { type: 'image/png' }));

  const crossOriginRes = await createAdminLogo(
    formPostRequest('/api/dashboard/logo', form, { origin: 'https://evil.example' }),
  );
  assert.equal(crossOriginRes.status, 403);

  const invalidTypeForm = new FormData();
  invalidTypeForm.set('tahun', '2026');
  invalidTypeForm.set('nama_logo', 'Logo');
  invalidTypeForm.set('gambar', new File(['hello'], 'logo.txt', { type: 'text/plain' }));
  const invalidRes = await createAdminLogo(formPostRequest('/api/dashboard/logo', invalidTypeForm));
  assert.equal(invalidRes.status, 422);

  let calledUrl = '';
  let calledMethod = '';
  global.fetch = async (url, init) => {
    calledUrl = String(url);
    calledMethod = init.method;
    assert.equal(init.headers.get('Authorization'), 'Bearer admin-token');
    assert.ok(init.body instanceof FormData);
    return Response.json(
      {
        success: true,
        message: 'Logo HUT RI berhasil ditambahkan.',
        data: {
          id_logo: 2,
          tahun: 2026,
          nama_logo: 'Logo HUT RI ke-81',
          gambar: 'https://res.cloudinary.com/demo/image/upload/logo.png',
          status: 'Aktif',
        },
      },
      { status: 201 },
    );
  };

  const successRes = await createAdminLogo(formPostRequest('/api/dashboard/logo', form));
  assert.equal(successRes.status, 201);
  assert.equal(calledUrl, 'https://backend.example/api/admin/logo-hut-ri');
  assert.equal(calledMethod, 'POST');
  const body = await successRes.json();
  assert.equal(body.data.status, 'Aktif');
});

test('POST, PATCH /aktif, and DELETE /api/dashboard/logo/[id] validate id and forward mutations', async () => {
  const invalidIdRes = await activateAdminLogo(
    mutationRequest('/api/dashboard/logo/abc/aktif', 'PATCH'),
    { params: Promise.resolve({ id: 'abc' }) },
  );
  assert.equal(invalidIdRes.status, 400);

  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), method: init.method });
    return Response.json({
      success: true,
      message: 'Berhasil diproses.',
      data: init.method === 'DELETE'
        ? null
        : {
            id_logo: 2,
            tahun: 2026,
            nama_logo: 'Logo Baru',
            gambar: 'https://res.cloudinary.com/demo/image/upload/logo2.png',
            status: 'Aktif',
          },
    });
  };

  const updateForm = new FormData();
  updateForm.set('nama_logo', 'Logo Baru');
  const updateRes = await updateAdminLogo(
    formPostRequest('/api/dashboard/logo/2', updateForm),
    { params: Promise.resolve({ id: '2' }) },
  );
  assert.equal(updateRes.status, 200);

  const activateRes = await activateAdminLogo(
    mutationRequest('/api/dashboard/logo/2/aktif', 'PATCH'),
    { params: Promise.resolve({ id: '2' }) },
  );
  assert.equal(activateRes.status, 200);

  const deleteRes = await deleteAdminLogo(
    mutationRequest('/api/dashboard/logo/2', 'DELETE'),
    { params: Promise.resolve({ id: '2' }) },
  );
  assert.equal(deleteRes.status, 200);

  assert.deepEqual(calls, [
    { url: 'https://backend.example/api/admin/logo-hut-ri/2', method: 'POST' },
    { url: 'https://backend.example/api/admin/logo-hut-ri/2/aktif', method: 'PATCH' },
    { url: 'https://backend.example/api/admin/logo-hut-ri/2', method: 'DELETE' },
  ]);
});

