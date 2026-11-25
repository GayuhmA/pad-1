const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
process.env.APP_ORIGIN = 'https://frontend.example';

const { NextRequest } = require('next/server');
const {
  GET: getManagementLomba,
  POST: postManagementLomba,
} = require('../src/app/api/dashboard/lomba/route.ts');
const {
  PUT: putManagementLomba,
  DELETE: deleteManagementLomba,
} = require('../src/app/api/dashboard/lomba/[id]/route.ts');
const {
  PATCH: patchArchiveLomba,
} = require('../src/app/api/dashboard/lomba/[id]/arsip/route.ts');
const {
  PATCH: patchRestoreLomba,
} = require('../src/app/api/dashboard/lomba/[id]/pulihkan/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

const sampleManageList = [
  {
    id_lomba: 1,
    nama_lomba: 'Tarik Tambang',
    jenis_pendaftaran: 'Beregu',
    status: 'Dibuka',
    status_lomba: 'Mendatang',
    kategori: 'Dewasa',
    deskripsi: 'Deskripsi tarik tambang',
    kapasitas_peserta: 4,
    batas_anggota_tim: 5,
    jumlah_pendaftar: 0,
    is_arsip: false,
    jadwal: [
      {
        id_jadwal: 1,
        tanggal: '2026-08-15',
        waktu_mulai: '09:00:00',
        waktu_selesai: '11:00:00',
        lokasi: 'Lapangan Utama',
      },
    ],
  },
  {
    id_lomba: 2,
    nama_lomba: 'Catur',
    jenis_pendaftaran: 'Individu',
    status: 'Dibuka',
    status_lomba: 'Berlangsung',
    kategori: 'Umum',
    deskripsi: 'Turnamen catur',
    kapasitas_peserta: null,
    batas_anggota_tim: null,
    jumlah_pendaftar: 8,
    is_arsip: false,
    jadwal: [
      {
        id_jadwal: 2,
        tanggal: '2026-08-16',
        waktu_mulai: '10:00:00',
        waktu_selesai: '12:00:00',
        lokasi: 'Balai Desa',
      },
    ],
  },
];

const sampleArsipList = [
  {
    id_lomba: 9,
    nama_lomba: 'Balap Karung',
    jenis_pendaftaran: 'Individu',
    status: 'Ditutup',
    status_lomba: 'Selesai',
    kategori: 'Umum',
    jumlah_pendaftar: 12,
    lokasi: 'Halaman Balai Desa',
    is_arsip: true,
    jadwal: [{ id_jadwal: 9, tanggal: '2026-08-14' }],
  },
];

function getRequest(path = '/api/dashboard/lomba', token = 'test-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

function mutateReq(path, method, body, token = 'test-token', origin = 'https://frontend.example') {
  return new NextRequest(`https://frontend.example${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(origin ? { origin } : {}),
      ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

test('management lomba returns normalized competitions with kuota, archive, and statistik', async () => {
  global.fetch = async (url) => {
    const urlStr = String(url);
    if (urlStr.endsWith('/api/lomba/manage')) {
      return Response.json({
        success: true,
        message: 'Data lomba berhasil diambil.',
        statistik: {
          total_lomba: 2,
          lomba_berlangsung: 1,
          lomba_mendatang: 1,
          lomba_selesai: 0,
        },
        data: sampleManageList,
      });
    }
    if (urlStr.endsWith('/api/lomba/manage/arsip')) {
      return Response.json({
        success: true,
        message: 'Daftar lomba arsip berhasil diambil.',
        data: sampleArsipList,
      });
    }
    if (urlStr.endsWith('/api/lomba')) {
      return Response.json({
        success: true,
        message: 'ok',
        data: [
          { id_lomba: 1, kategori: { id_kategori: 1, nama_kategori: 'Dewasa' } },
          { id_lomba: 2, kategori: { id_kategori: 2, nama_kategori: 'Umum' } },
        ],
      });
    }
    if (urlStr.includes('/api/panitia/lomba/1/kuota')) {
      return Response.json({
        success: true,
        message: 'Kuota 1',
        data: { id_lomba: 1, jumlah_tim: 2, kapasitas_tim: 4 },
      });
    }
    throw new Error(`Unexpected fetch URL: ${urlStr}`);
  };

  const response = await getManagementLomba(getRequest());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.competitions.length, 2);

  const tarikTambang = body.data.competitions[0];
  assert.equal(tarikTambang.name, 'Tarik Tambang');
  assert.equal(tarikTambang.kind, 'Regu');
  assert.equal(tarikTambang.registered, 2);
  assert.equal(tarikTambang.capacity, 4);
  assert.equal(tarikTambang.id_kategori, 1);

  const catur = body.data.competitions[1];
  assert.equal(catur.name, 'Catur');
  assert.equal(catur.kind, 'Individu');
  assert.equal(catur.registered, 8);
  assert.equal(catur.capacity, null);

  assert.equal(body.data.archived.length, 1);
  assert.equal(body.data.archived[0].name, 'Balap Karung');
  assert.equal(body.data.statistik.total_lomba, 2);
});

test('management lomba rejects unauthenticated access', async () => {
  const response = await getManagementLomba(getRequest('/api/dashboard/lomba', ''));
  assert.equal(response.status, 401);
});

test('POST, PUT, DELETE, arsip, and pulihkan endpoints validate payloads and forward mutations', async () => {
  const foreignReq = mutateReq('/api/dashboard/lomba', 'POST', {}, 'test-token', 'https://evil.example');
  assert.equal((await postManagementLomba(foreignReq)).status, 403);

  const badReq = mutateReq('/api/dashboard/lomba', 'POST', {
    id_kategori: 1,
    nama_lomba: 'Panjat Pinang',
    jenis_pendaftaran: 'Beregu',
    jadwal: [{ tanggal: '2026-08-17', waktu_mulai: '10:00', waktu_selesai: '09:00' }],
  });
  assert.equal((await postManagementLomba(badReq)).status, 422);

  let sentPayload = null;
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/lomba/manage');
    assert.equal(init.method, 'POST');
    sentPayload = JSON.parse(init.body);
    return Response.json({ success: true, message: 'Lomba berhasil ditambahkan.' }, { status: 201 });
  };
  const createRes = await postManagementLomba(
    mutateReq('/api/dashboard/lomba', 'POST', {
      id_kategori: 1,
      nama_lomba: 'Panjat Pinang',
      jenis_pendaftaran: 'Beregu',
      status: 'Dibuka',
      kapasitas_peserta: 6,
      batas_anggota_tim: 5,
      jadwal: [{ tanggal: '2026-08-17', waktu_mulai: '08:00', waktu_selesai: '11:00', lokasi: 'Lapangan' }],
    }),
  );
  assert.equal(createRes.status, 201);
  assert.equal(sentPayload.nama_lomba, 'Panjat Pinang');

  let updatedPayload = null;
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/lomba/manage/1');
    assert.equal(init.method, 'PUT');
    updatedPayload = JSON.parse(init.body);
    return Response.json({
      success: true,
      message: 'Lomba berhasil diperbarui.',
      data: { id_lomba: 1, status: 'Dibuka' },
    });
  };
  const updateRes = await putManagementLomba(
    mutateReq('/api/dashboard/lomba/1', 'PUT', {
      id_kategori: 1,
      nama_lomba: 'Tarik Tambang Edit',
      jenis_pendaftaran: 'Beregu',
      status: 'Ditutup',
      jadwal: [{ tanggal: '2026-08-15', waktu_mulai: '09:00', waktu_selesai: '11:00', lokasi: 'Lapangan' }],
    }),
    { params: Promise.resolve({ id: '1' }) },
  );
  assert.equal(updateRes.status, 200);
  assert.equal(updatedPayload.status, 'Ditutup');
  const updateBody = await updateRes.json();
  assert.equal(updateBody.data.status, 'Dibuka');

  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/lomba/manage/1');
    assert.equal(init.method, 'DELETE');
    return Response.json({ success: true, message: 'Lomba berhasil dihapus.' });
  };
  assert.equal(
    (await deleteManagementLomba(mutateReq('/api/dashboard/lomba/1', 'DELETE'), { params: Promise.resolve({ id: '1' }) })).status,
    200,
  );

  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/lomba/manage/1/arsip');
    assert.equal(init.method, 'PATCH');
    return Response.json({ success: true, message: 'Lomba berhasil diarsipkan.' });
  };
  assert.equal(
    (await patchArchiveLomba(mutateReq('/api/dashboard/lomba/1/arsip', 'PATCH'), { params: Promise.resolve({ id: '1' }) })).status,
    200,
  );

  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/lomba/manage/1/pulihkan');
    assert.equal(init.method, 'PATCH');
    return Response.json({ success: true, message: 'Lomba berhasil dipulihkan.' });
  };
  assert.equal(
    (await patchRestoreLomba(mutateReq('/api/dashboard/lomba/1/pulihkan', 'PATCH'), { params: Promise.resolve({ id: '1' }) })).status,
    200,
  );
});
