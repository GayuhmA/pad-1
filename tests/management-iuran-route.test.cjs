const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
process.env.APP_ORIGIN = 'https://frontend.example';

const { NextRequest } = require('next/server');
const { GET: getIuranList } = require('../src/app/api/dashboard/iuran/route.ts');
const { PATCH: verifyPaymentRoute } = require('../src/app/api/dashboard/iuran/verifikasi/[id]/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

const sampleIuranBackend = {
  current_page: 1,
  data: [
    {
      id_iuran: 1,
      id_pembayaran: 10,
      nama_kepala_keluarga: 'Budi Santoso',
      no_hp: '081234567890',
      nominal: 200000,
      tanggal_bayar: '2026-08-15',
      bukti_bayar_url: 'https://backend.example/storage/bukti1.jpg',
      status: 'Menunggu',
      status_verifikasi: 'Menunggu',
    },
    {
      id_iuran: 2,
      id_pembayaran: 11,
      nama_kepala_keluarga: 'Siti Rahma',
      no_hp: '089876543210',
      nominal: 150000,
      tanggal_bayar: '2026-08-14',
      bukti_bayar_url: 'https://backend.example/storage/bukti2.jpg',
      status: 'Lunas',
      status_verifikasi: 'Diterima',
    },
    {
      id_iuran: 3,
      id_pembayaran: null,
      nama_kepala_keluarga: 'Joko Widodo',
      no_hp: '085211223344',
      nominal: null,
      tanggal_bayar: null,
      bukti_bayar_url: null,
      status: 'Belum Lunas',
      status_verifikasi: null,
    },
  ],
  total: 3,
  per_page: 50,
};

const sampleTransparansi = {
  total_anggaran: 10000000,
  iuran_terkumpul: 350000,
  warga_lunas: 1,
  warga_belum_lunas: 2,
  jumlah_warga: 3,
};

const sampleSettings = {
  id_pengaturan: 1,
  nama_bank: 'Bank Mandiri',
  nomor_rekening: '123-00-1234567-8',
  atas_nama: 'Bendahara 17an',
  qris_image: 'https://backend.example/storage/qris.jpg',
};

function getRequest(path = '/api/dashboard/iuran', token = 'test-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

function patchRequest(id, body, token = 'test-token') {
  return new NextRequest(`https://frontend.example/api/dashboard/iuran/verifikasi/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      origin: 'https://frontend.example',
      ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

test('management iuran list returns formatted payments, metrics, and settings', async () => {
  global.fetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/manajemen/iuran')) {
      return Response.json({
        success: true,
        message: 'Daftar iuran berhasil diambil.',
        data: sampleIuranBackend,
      });
    }
    if (urlStr.includes('/api/warga/iuran/transparansi')) {
      return Response.json({
        success: true,
        message: 'Data transparansi iuran.',
        data: sampleTransparansi,
      });
    }
    if (urlStr.includes('/api/pengaturan-pembayaran')) {
      return Response.json({
        success: true,
        message: 'Data pengaturan pembayaran.',
        data: sampleSettings,
      });
    }
    throw new Error('Unexpected URL: ' + url);
  };

  const response = await getIuranList(getRequest());
  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.payments.length, 3);

  const first = payload.data.payments[0];
  assert.equal(first.name, 'Budi Santoso');
  assert.equal(first.amount, 200000);
  assert.equal(first.status, 'Menunggu');
  assert.equal(first.proofUrl, 'https://backend.example/storage/bukti1.jpg');

  assert.equal(payload.data.metrics.totalCollected, 350000);
  assert.equal(payload.data.metrics.waitingCount, 1);
  assert.equal(payload.data.metrics.paidCount, 1);
  assert.equal(payload.data.metrics.unpaidCount, 2);

  assert.equal(payload.data.settings.nama_bank, 'Bank Mandiri');
  assert.equal(payload.data.settings.nomor_rekening, '123-00-1234567-8');
});

test('management iuran list returns 401 when unauthenticated', async () => {
  const response = await getIuranList(getRequest('/api/dashboard/iuran', ''));
  assert.equal(response.status, 401);
});

test('verify payment PATCH verifies successfully with Diterima', async () => {
  let backendPayload = null;
  global.fetch = async (url, init = {}) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/manajemen/pembayaran/10/verifikasi')) {
      assert.equal(init.method, 'PATCH');
      backendPayload = JSON.parse(init.body);
      return Response.json({
        success: true,
        message: 'Pembayaran berhasil diverifikasi.',
      });
    }
    throw new Error('Unexpected URL: ' + url);
  };

  const response = await verifyPaymentRoute(
    patchRequest('10', { keputusan: 'Diterima' }),
    { params: Promise.resolve({ id: '10' }) },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(backendPayload, { keputusan: 'Diterima' });

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.status_verifikasi, 'Diterima');
});

test('verify payment PATCH rejects invalid keputusan with 422', async () => {
  const response = await verifyPaymentRoute(
    patchRequest('10', { keputusan: 'InvalidStatus' }),
    { params: Promise.resolve({ id: '10' }) },
  );

  assert.equal(response.status, 422);
  const payload = await response.json();
  assert.equal(payload.message, 'Keputusan harus berupa Diterima atau Ditolak.');
});

test('verify payment PATCH rejects non-numeric ID with 400', async () => {
  const response = await verifyPaymentRoute(
    patchRequest('abc', { keputusan: 'Diterima' }),
    { params: Promise.resolve({ id: 'abc' }) },
  );

  assert.equal(response.status, 400);
});

test('verify payment PATCH rejects missing auth with 401', async () => {
  const response = await verifyPaymentRoute(
    patchRequest('10', { keputusan: 'Diterima' }, ''),
    { params: Promise.resolve({ id: '10' }) },
  );

  assert.equal(response.status, 401);
});

