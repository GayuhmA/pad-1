const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
const { NextRequest } = require('next/server');
const { GET: getManagementLomba } = require('../src/app/api/dashboard/lomba/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

const sampleLombaList = [
  {
    id_lomba: 1,
    nama_lomba: 'Tarik Tambang',
    jenis_pendaftaran: 'Beregu',
    status: 'Dibuka',
    deskripsi: 'Deskripsi tarik tambang',
    kategori: { id_kategori: 1, nama_kategori: 'Dewasa' },
    kapasitas_peserta: 4,
    batas_anggota_tim: 5,
    sudah_mendaftar: false,
    jadwal: [
      {
        id_jadwal: 1,
        tanggal: '2026-08-15',
        waktu_mulai: '09:00:00',
        waktu_selesai: '11:00:00',
        lokasi: 'Lapangan Utama',
        status_jadwal: 'Mendatang',
      },
    ],
  },
  {
    id_lomba: 2,
    nama_lomba: 'Catur',
    jenis_pendaftaran: 'Individu',
    status: 'Dibuka',
    deskripsi: 'Turnamen catur',
    kategori: { id_kategori: 2, nama_kategori: 'Umum' },
    kapasitas_peserta: null,
    batas_anggota_tim: null,
    sudah_mendaftar: false,
    jadwal: [
      {
        id_jadwal: 2,
        tanggal: '2026-08-16',
        waktu_mulai: '10:00:00',
        waktu_selesai: '12:00:00',
        lokasi: 'Balai Desa',
        status_jadwal: 'Berlangsung',
      },
    ],
  },
];

const sampleHistory = [
  {
    id_periode: 1,
    tahun: '2025',
    nama_kegiatan: 'HUT RI ke-80',
    status: 'Selesai',
    jumlah_lomba: 4,
  },
];

function getRequest(path = '/api/dashboard/lomba', token = 'test-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

test('management lomba returns normalized competitions with kuota and archive', async () => {
  global.fetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/lomba')) {
      return Response.json({
        success: true,
        message: 'Daftar lomba berhasil diambil.',
        data: sampleLombaList,
      });
    }
    if (urlStr.includes('/api/panitia/lomba/1/kuota')) {
      return Response.json({
        success: true,
        message: 'Kuota 1',
        data: { id_lomba: 1, jumlah_tim: 2, kapasitas_tim: 4 },
      });
    }
    if (urlStr.includes('/api/panitia/lomba/2/kuota')) {
      return Response.json({
        success: true,
        message: 'Kuota 2',
        data: { id_lomba: 2, jumlah_peserta: 8, kapasitas_peserta: 16 },
      });
    }
    if (urlStr.includes('/api/histori')) {
      return Response.json({
        success: true,
        message: 'Daftar histori',
        data: sampleHistory,
      });
    }
    throw new Error('Unexpected URL: ' + url);
  };

  const response = await getManagementLomba(getRequest('/api/dashboard/lomba?role=panitia'));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.competitions.length, 2);

  const comp1 = body.data.competitions.find((c) => c.id === '1');
  assert.equal(comp1.name, 'Tarik Tambang');
  assert.equal(comp1.kind, 'Regu');
  assert.equal(comp1.category, 'Dewasa');
  assert.equal(comp1.registered, 2);
  assert.equal(comp1.capacity, 4);
  assert.equal(comp1.status, 'Mendatang');

  const comp2 = body.data.competitions.find((c) => c.id === '2');
  assert.equal(comp2.name, 'Catur');
  assert.equal(comp2.kind, 'Individu');
  assert.equal(comp2.category, 'Umum');
  assert.equal(comp2.registered, 8);
  assert.equal(comp2.capacity, 16);
  assert.equal(comp2.status, 'Berlangsung');

  assert.equal(body.data.archived.length, 1);
  assert.equal(body.data.archived[0].name, 'HUT RI ke-80');
});

test('management lomba rejects unauthenticated access', async () => {
  const response = await getManagementLomba(getRequest('/api/dashboard/lomba', ''));
  assert.equal(response.status, 401);
});

