const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
process.env.APP_ORIGIN = 'https://frontend.example';
const { NextRequest } = require('next/server');
const { GET: getPendaftaranList } = require('../src/app/api/dashboard/pendaftaran/route.ts');
const { PATCH: updatePendaftaranStatus } = require('../src/app/api/dashboard/pendaftaran/[id]/status/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

const samplePendaftaranBackend = {
  current_page: 1,
  data: [
    {
      id_pendaftaran: 101,
      id_warga: 3,
      id_lomba: 2,
      nama_tim: null,
      tanggal_daftar: '2026-08-15T10:00:00.000000Z',
      status: 'Menunggu',
      warga: {
        nama: 'Budi Santoso',
        no_hp: '08123456789',
      },
      lomba: {
        id_lomba: 2,
        nama_lomba: 'Catur',
        jenis_pendaftaran: 'Individu',
      },
    },
    {
      id_pendaftaran: 102,
      id_warga: 5,
      id_lomba: 1,
      nama_tim: 'Tim Garuda',
      tanggal_daftar: '2026-08-14T09:00:00.000000Z',
      status: 'Diterima',
      warga: {
        nama: 'Siti Rahma',
        no_hp: '08987654321',
      },
      lomba: {
        id_lomba: 1,
        nama_lomba: 'Tarik Tambang',
        jenis_pendaftaran: 'Beregu',
      },
    },
  ],
};

function getRequest(path = '/api/dashboard/pendaftaran', token = 'test-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

function patchRequest(id, body, token = 'test-token') {
  return new NextRequest(`https://frontend.example/api/dashboard/pendaftaran/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      origin: 'https://frontend.example',
      ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

test('management pendaftaran list forwards to panitia endpoint and normalizes items', async () => {
  global.fetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/panitia/pendaftaran')) {
      return Response.json({
        success: true,
        message: 'Daftar pendaftaran berhasil diambil.',
        data: samplePendaftaranBackend,
      });
    }
    if (urlStr.includes('/api/lomba')) {
      return Response.json({
        success: true,
        message: 'OK',
        data: [
          { id_lomba: 2, nama_lomba: 'Catur', jenis_pendaftaran: 'Individu', kapasitas_peserta: 12 },
        ],
      });
    }
    if (urlStr.includes('/api/panitia/lomba/2/kuota')) {
      return Response.json({
        success: true,
        message: 'OK',
        data: { id_lomba: 2, jumlah_peserta: 6, kapasitas_peserta: 12 },
      });
    }
    throw new Error('Unexpected URL: ' + url);
  };

  const response = await getPendaftaranList(getRequest('/api/dashboard/pendaftaran?role=panitia'));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.registrations.length, 2);

  const item1 = body.data.registrations[0];
  assert.equal(item1.id, '101');
  assert.equal(item1.peserta, 'Budi Santoso');
  assert.equal(item1.lomba, 'Catur');
  assert.equal(item1.jenis, 'Individu');
  assert.equal(item1.status, 'Menunggu');

  const item2 = body.data.registrations[1];
  assert.equal(item2.id, '102');
  assert.equal(item2.nama_tim, 'Tim Garuda');
  assert.equal(item2.jenis, 'Regu');
  assert.equal(item2.status, 'Diterima');

  assert.equal(body.data.metrics.total, 2);
  assert.equal(body.data.metrics.menunggu, 1);
  assert.equal(body.data.metrics.diterima, 1);
  assert.equal(body.data.quotas.length, 1);
  assert.equal(body.data.quotas[0].terdaftar, 6);
});

test('management pendaftaran update status accepts Diterima and forwards PATCH', async () => {
  global.fetch = async (url, init) => {
    assert.equal(
      String(url),
      'https://backend.example/api/panitia/pendaftaran/101/status',
    );
    assert.equal(init.method, 'PATCH');
    assert.equal(init.headers.get('Authorization'), 'Bearer test-token');
    return Response.json({
      success: true,
      message: 'Status pendaftaran berhasil diperbarui.',
      data: { id_pendaftaran: 101, status: 'Diterima' },
    });
  };

  const response = await updatePendaftaranStatus(
    patchRequest('101', { status: 'Diterima' }),
    { params: Promise.resolve({ id: '101' }) },
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.status, 'Diterima');
});

test('management pendaftaran update status rejects invalid status value', async () => {
  const response = await updatePendaftaranStatus(
    patchRequest('101', { status: 'Menunggu' }), // Only 'Diterima' or 'Ditolak' allowed in PATCH
    { params: Promise.resolve({ id: '101' }) },
  );
  assert.equal(response.status, 422);
});

test('management pendaftaran rejects unauthenticated list requests', async () => {
  const response = await getPendaftaranList(getRequest('/api/dashboard/pendaftaran', ''));
  assert.equal(response.status, 401);
});

