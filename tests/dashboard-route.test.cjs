const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
const { NextRequest } = require('next/server');
const { GET: getDashboard } = require('../src/app/api/dashboard/route.ts');
const { GET: getMatchOptions } = require('../src/app/api/pertandingan/options/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

const sampleDashboardData = {
  tanggal_filter: '2026-11-23',
  ringkasan: {
    total_lomba: 5,
    lomba_berlangsung: 1,
    total_pendaftar: 12,
    pembayaran_lunas: 10,
    pembayaran_belum_lunas: 2,
  },
  sedang_berlangsung: [
    {
      id_pertandingan: 1,
      id_lomba: 2,
      nama_lomba: 'Catur',
      lokasi: 'Balai Warga',
      babak: 'Semifinal',
      peserta_1: 'Budi',
      peserta_2: 'Siti',
      waktu_mulai: '10:00',
      waktu_selesai: '11:00',
      status: 'Berlangsung',
    },
  ],
  agenda: [
    {
      id_jadwal: 1,
      id_lomba: 2,
      nama_lomba: 'Catur',
      tanggal: '2026-11-23',
      waktu_mulai: '09:00:00',
      waktu_selesai: '12:00:00',
      lokasi: 'Balai Warga',
    },
  ],
};

function getRequest(path = '/api/dashboard', token = 'test-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

test('dashboard forwards to /api/panitia/dashboard for panitia role', async () => {
  global.fetch = async (url, init) => {
    assert.equal(
      String(url),
      'https://backend.example/api/panitia/dashboard?tanggal=2026-11-23',
    );
    assert.equal(init.method ?? 'GET', 'GET');
    assert.equal(init.headers.get('Authorization'), 'Bearer test-token');
    return Response.json({
      success: true,
      message: 'Data dashboard berhasil diambil.',
      data: sampleDashboardData,
    });
  };

  const response = await getDashboard(
    getRequest('/api/dashboard?tanggal=2026-11-23&role=panitia'),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.ringkasan.total_lomba, 5);
  assert.equal(body.data.sedang_berlangsung.length, 1);
  assert.equal(body.data.sedang_berlangsung[0].nama_lomba, 'Catur');
});

test('dashboard forwards to /api/admin/dashboard for admin role', async () => {
  global.fetch = async (url, init) => {
    assert.equal(
      String(url),
      'https://backend.example/api/admin/dashboard?tanggal=2026-11-23',
    );
    assert.equal(init.method ?? 'GET', 'GET');
    assert.equal(init.headers.get('Authorization'), 'Bearer test-token');
    return Response.json({
      success: true,
      message: 'Data dashboard berhasil diambil.',
      data: sampleDashboardData,
    });
  };

  const response = await getDashboard(
    getRequest('/api/dashboard?tanggal=2026-11-23&role=admin'),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.ringkasan.total_pendaftar, 12);
});

test('dashboard gracefully falls back to admin endpoint if panitia returns 403', async () => {
  let callCount = 0;
  global.fetch = async (url) => {
    callCount++;
    if (String(url).includes('/api/panitia/dashboard')) {
      return Response.json(
        { success: false, message: 'Forbidden' },
        { status: 403 },
      );
    }
    if (String(url).includes('/api/admin/dashboard')) {
      return Response.json({
        success: true,
        message: 'Data dashboard admin berhasil diambil.',
        data: sampleDashboardData,
      });
    }
    throw new Error('Unexpected URL: ' + url);
  };

  // Called with no role or role=panitia, should try panitia then fallback to admin
  const response = await getDashboard(getRequest('/api/dashboard?tanggal=2026-11-23'));
  assert.equal(response.status, 200);
  assert.equal(callCount, 2);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.ringkasan.total_lomba, 5);
});

test('dashboard rejects invalid date format and unauthenticated requests', async () => {
  const unauth = await getDashboard(getRequest('/api/dashboard', ''));
  assert.equal(unauth.status, 401);

  const invalidDate = await getDashboard(
    getRequest('/api/dashboard?tanggal=invalid-date'),
  );
  assert.equal(invalidDate.status, 422);
});

test('match options fetches lomba and jadwal in parallel and returns normalized options', async () => {
  global.fetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/lomba')) {
      return Response.json({
        success: true,
        message: 'OK',
        data: [
          { id_lomba: 1, nama_lomba: 'Tarik Tambang', jenis_pendaftaran: 'Beregu' },
          { id_lomba: 2, nama_lomba: 'Catur', jenis_pendaftaran: 'Individu' },
        ],
      });
    }
    if (urlStr.includes('/api/jadwal')) {
      return Response.json({
        success: true,
        message: 'OK',
        data: [
          {
            id_jadwal: 10,
            id_lomba: 1,
            nama_lomba: 'Tarik Tambang',
            tanggal: '2026-08-15',
            waktu_mulai: '08:00:00',
            waktu_selesai: '10:00:00',
            lokasi: 'Lapangan',
          },
        ],
      });
    }
    throw new Error('Unexpected URL: ' + url);
  };

  const response = await getMatchOptions(
    new NextRequest('https://frontend.example/api/pertandingan/options', {
      headers: { Cookie: `${SESSION_COOKIE}=test-token` },
    }),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.lomba.length, 2);
  assert.equal(body.data.jadwal.length, 1);
  assert.equal(body.data.lomba[0].nama_lomba, 'Tarik Tambang');
  assert.equal(body.data.jadwal[0].lokasi, 'Lapangan');
});
