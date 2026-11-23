const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
process.env.APP_ORIGIN = 'https://frontend.example';

const { NextRequest } = require('next/server');
const { PUT: updateHistoriRoute } = require('../src/app/api/dashboard/histori/[id]/route.ts');
const { POST: addPemenangRoute } = require('../src/app/api/dashboard/histori/[id]/lomba/[idLomba]/pemenang/route.ts');
const { PUT: updatePemenangRoute, DELETE: deletePemenangRoute } = require('../src/app/api/dashboard/pemenang/[id]/route.ts');
const { GET: getPesertaLombaRoute } = require('../src/app/api/dashboard/lomba/[id]/peserta/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

function jsonRequest(path, method, body, token = 'test-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    method,
    headers: {
      origin: 'https://frontend.example',
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function getRequest(path, token = 'test-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    method: 'GET',
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

test('PUT /api/dashboard/histori/[id] rejects unauthenticated request', async () => {
  const req = jsonRequest('/api/dashboard/histori/1', 'PUT', { deskripsi: 'Baru' }, null);
  const res = await updateHistoriRoute(req, { params: Promise.resolve({ id: '1' }) });
  assert.equal(res.status, 401);
});

test('PUT /api/dashboard/histori/[id] rejects invalid ID', async () => {
  const req = jsonRequest('/api/dashboard/histori/abc', 'PUT', { deskripsi: 'Baru' });
  const res = await updateHistoriRoute(req, { params: Promise.resolve({ id: 'abc' }) });
  assert.equal(res.status, 400);
});

test('PUT /api/dashboard/histori/[id] updates period description successfully', async () => {
  let capturedUrl = '';
  let capturedMethod = '';
  let capturedBody = '';

  global.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedMethod = init.method;
    capturedBody = init.body;
    return Response.json({
      success: true,
      message: 'Periode berhasil diperbarui.',
      data: {
        id_periode: 1,
        tahun: '2026',
        nama_kegiatan: 'Semarak HUT RI ke-81',
        deskripsi: 'Deskripsi berhasil diperbarui.',
        status: 'Aktif',
      },
    });
  };

  const req = jsonRequest('/api/dashboard/histori/1', 'PUT', {
    deskripsi: 'Deskripsi berhasil diperbarui.',
  });
  const res = await updateHistoriRoute(req, { params: Promise.resolve({ id: '1' }) });
  assert.equal(res.status, 200);

  const payload = await res.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.deskripsi, 'Deskripsi berhasil diperbarui.');
  assert.equal(capturedUrl, 'https://backend.example/api/histori/1');
  assert.equal(capturedMethod, 'PUT');
  assert.ok(capturedBody.includes('Deskripsi berhasil diperbarui.'));
});

test('POST /api/dashboard/histori/[id]/lomba/[idLomba]/pemenang rejects unauthenticated request', async () => {
  const req = jsonRequest('/api/dashboard/histori/1/lomba/2/pemenang', 'POST', { peringkat: 1 }, null);
  const res = await addPemenangRoute(req, {
    params: Promise.resolve({ id: '1', idLomba: '2' }),
  });
  assert.equal(res.status, 401);
});

test('POST /api/dashboard/histori/[id]/lomba/[idLomba]/pemenang adds winner successfully', async () => {
  let capturedUrl = '';
  let capturedMethod = '';

  global.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedMethod = init.method;
    return Response.json(
      {
        success: true,
        message: 'Pemenang berhasil ditambahkan.',
        data: {
          id_pemenang: 99,
          peringkat: 1,
          tipe_pemenang: 'Individu',
          nama_pemenang: 'Budi Santoso',
          id_pendaftaran: 14,
          keterangan: 'Juara 1 Catur',
        },
      },
      { status: 201 },
    );
  };

  const req = jsonRequest('/api/dashboard/histori/1/lomba/2/pemenang', 'POST', {
    tipe_pemenang: 'Individu',
    peringkat: 1,
    id_pendaftaran: 14,
    keterangan: 'Juara 1 Catur',
  });
  const res = await addPemenangRoute(req, {
    params: Promise.resolve({ id: '1', idLomba: '2' }),
  });
  assert.equal(res.status, 201);

  const payload = await res.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.id_pemenang, 99);
  assert.equal(payload.data.nama_pemenang, 'Budi Santoso');
  assert.equal(capturedUrl, 'https://backend.example/api/histori/1/lomba/2/pemenang');
  assert.equal(capturedMethod, 'POST');
});

test('PUT /api/dashboard/pemenang/[id] updates winner rank and note', async () => {
  let capturedUrl = '';
  let capturedMethod = '';

  global.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedMethod = init.method;
    return Response.json({
      success: true,
      message: 'Pemenang berhasil diperbarui.',
      data: {
        id_pemenang: 99,
        peringkat: 2,
        tipe_pemenang: 'Individu',
        nama_pemenang: 'Budi Santoso',
        keterangan: 'Juara 2 Catur',
      },
    });
  };

  const req = jsonRequest('/api/dashboard/pemenang/99', 'PUT', {
    peringkat: 2,
    keterangan: 'Juara 2 Catur',
  });
  const res = await updatePemenangRoute(req, { params: Promise.resolve({ id: '99' }) });
  assert.equal(res.status, 200);

  const payload = await res.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.peringkat, 2);
  assert.equal(capturedUrl, 'https://backend.example/api/pemenang/99');
  assert.equal(capturedMethod, 'PUT');
});

test('DELETE /api/dashboard/pemenang/[id] deletes winner', async () => {
  let capturedUrl = '';
  let capturedMethod = '';

  global.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedMethod = init.method;
    return Response.json({
      success: true,
      message: 'Pemenang berhasil dihapus.',
      data: null,
    });
  };

  const req = jsonRequest('/api/dashboard/pemenang/99', 'DELETE');
  const res = await deletePemenangRoute(req, { params: Promise.resolve({ id: '99' }) });
  assert.equal(res.status, 200);

  const payload = await res.json();
  assert.equal(payload.success, true);
  assert.equal(capturedUrl, 'https://backend.example/api/pemenang/99');
  assert.equal(capturedMethod, 'DELETE');
});

test('GET /api/dashboard/lomba/[id]/peserta returns accepted participants for winner dropdown', async () => {
  global.fetch = async (url) => {
    assert.ok(String(url).includes('/api/panitia/lomba/2/pendaftaran'));
    return Response.json({
      success: true,
      message: 'Daftar pendaftaran lomba berhasil diambil.',
      data: {
        data: [
          {
            id_pendaftaran: 14,
            status: 'Diterima',
            warga: { nama: 'Budi Santoso' },
            nama_tim: null,
          },
          {
            id_pendaftaran: 15,
            status: 'Ditolak',
            warga: { nama: 'Ahmad' },
            nama_tim: null,
          },
          {
            id_pendaftaran: 16,
            status: 'Selesai',
            warga: { nama: 'Siti Aminah' },
            nama_tim: 'Regu Melati',
          },
        ],
      },
    });
  };

  const req = getRequest('/api/dashboard/lomba/2/peserta');
  const res = await getPesertaLombaRoute(req, { params: Promise.resolve({ id: '2' }) });
  assert.equal(res.status, 200);

  const payload = await res.json();
  assert.equal(payload.success, true);
  // Ditolak should be excluded, leaving 2 participants
  assert.equal(payload.data.length, 2);
  assert.equal(payload.data[0].id_pendaftaran, 14);
  assert.equal(payload.data[0].nama, 'Budi Santoso');
  assert.equal(payload.data[1].id_pendaftaran, 16);
  assert.equal(payload.data[1].nama, 'Siti Aminah');
  assert.equal(payload.data[1].nama_tim, 'Regu Melati');
});

test('GET /api/dashboard/lomba/[id]/peserta handles direct array and admin role fallback', async () => {
  global.fetch = async (url) => {
    assert.ok(String(url).includes('/api/admin/lomba/2/pendaftaran'));
    return Response.json({
      success: true,
      message: 'Daftar pendaftaran lomba berhasil diambil.',
      data: [
        {
          id_pendaftaran: 10,
          status: 'Diterima',
          warga: { nama: 'Demo Warga 03' },
          nama_tim: null,
        },
      ],
    });
  };

  const req = getRequest('/api/dashboard/lomba/2/peserta?role=admin');
  const res = await getPesertaLombaRoute(req, { params: Promise.resolve({ id: '2' }) });
  assert.equal(res.status, 200);

  const payload = await res.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.length, 1);
  assert.equal(payload.data[0].id_pendaftaran, 10);
  assert.equal(payload.data[0].nama, 'Demo Warga 03');
});

