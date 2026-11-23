const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
const { NextRequest } = require('next/server');
const { GET: getHistoriList } = require('../src/app/api/warga/histori/route.ts');
const { GET: getHistoriDetail } = require('../src/app/api/warga/histori/[id]/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

const samplePeriod = {
  id_periode: 1,
  tahun: 2026,
  judul: 'Semarak HUT RI ke-81',
  nama_kegiatan: 'Semarak HUT RI ke-81',
  deskripsi: 'Nusantara Bersuka, Indonesia Berjaya',
  tanggal_mulai: '2026-08-14',
  tanggal_selesai: '2026-08-17',
  status: 'Aktif',
  logo: null,
  jumlah_lomba: 2,
};

const sampleDetail = {
  ...samplePeriod,
  lomba: [
    {
      id_lomba: 2,
      nama_lomba: 'Catur',
      kategori: 'Umum',
      jenis_pendaftaran: 'Individu',
      jumlah_peserta: 2,
      jumlah_regu: 0,
      lokasi: ['Balai Desa'],
      pemenang: [
        {
          id_pemenang: 1,
          tipe_pemenang: 'Individu',
          peringkat: 1,
          nama_pemenang: 'Hadi Setiawan',
          keterangan: 'Juara 1 Turnamen Catur',
        },
      ],
    },
    {
      id_lomba: 3,
      nama_lomba: 'Futsal Sarung',
      kategori: 'Dewasa',
      jenis_pendaftaran: 'Beregu',
      jumlah_peserta: 0,
      jumlah_regu: 4,
      lokasi: 'Lapangan Utama',
      pemenang: [],
    },
  ],
};

function getRequest(path = '/api/warga/histori', token = 'test-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

test('histori list forwards query parameters and normalizes periods', async () => {
  global.fetch = async (url, init) => {
    assert.equal(
      String(url),
      'https://backend.example/api/histori?tahun=2026&search=Semarak',
    );
    assert.equal(init.method, 'GET');
    assert.equal(init.headers.get('Authorization'), 'Bearer test-token');
    return Response.json({
      success: true,
      message: 'Daftar histori berhasil diambil.',
      data: [samplePeriod],
    });
  };

  const req = getRequest('/api/warga/histori?tahun=2026&search=Semarak', 'test-token');
  const response = await getHistoriList(req);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].id_periode, 1);
  assert.equal(body.data[0].tahun, '2026');
  assert.equal(body.data[0].judul, 'Semarak HUT RI ke-81');
});

test('histori list rejects malformed backend data', async () => {
  global.fetch = async () =>
    Response.json({ success: true, message: 'Daftar tersedia.', data: [{ id_periode: 'not-an-int' }] });

  const response = await getHistoriList(getRequest());
  assert.equal(response.status, 502);
});

test('histori detail validates id and normalizes lomba, locations, and winners', async () => {
  global.fetch = async (url, init) => {
    assert.equal(
      String(url),
      'https://backend.example/api/histori/1?search=Catur',
    );
    assert.equal(init.headers.get('Authorization'), 'Bearer test-token');
    return Response.json({
      success: true,
      message: 'Detail histori berhasil diambil.',
      data: sampleDetail,
    });
  };

  const req = getRequest('/api/warga/histori/1?search=Catur', 'test-token');
  const response = await getHistoriDetail(req, {
    params: Promise.resolve({ id: '1' }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.id_periode, 1);
  assert.equal(body.data.lomba.length, 2);
  assert.equal(body.data.lomba[0].nama_lomba, 'Catur');
  assert.deepEqual(body.data.lomba[0].lokasi, ['Balai Desa']);
  assert.equal(body.data.lomba[0].pemenang[0].nama_pemenang, 'Hadi Setiawan');
  assert.deepEqual(body.data.lomba[1].lokasi, ['Lapangan Utama']);
  assert.deepEqual(body.data.lomba[1].pemenang, []);
});

test('histori detail rejects invalid ids and handles not found errors', async () => {
  const invalidReq = getRequest('/api/warga/histori/abc');
  const invalidResponse = await getHistoriDetail(invalidReq, {
    params: Promise.resolve({ id: 'abc' }),
  });
  assert.equal(invalidResponse.status, 422);

  global.fetch = async () => Response.json({}, { status: 404 });
  const notFoundReq = getRequest('/api/warga/histori/99');
  const notFoundResponse = await getHistoriDetail(notFoundReq, {
    params: Promise.resolve({ id: '99' }),
  });
  assert.equal(notFoundResponse.status, 404);
});

test('album detail resolution fetches from backend for numerical ID and falls back to static slug', async () => {
  const { backendGetAlbumDetail } = require('../src/lib/server/dokumentasi.ts');
  const { getAlbumBySlug } = require('../src/lib/data/histori.ts');

  global.fetch = async (url) => {
    assert.ok(String(url).includes('/api/dokumentasi/5'));
    return Response.json({
      success: true,
      message: 'Detail album berhasil diambil.',
      data: {
        id_album: 5,
        nama_album: 'Lomba Tarik Tambang Live',
        tanggal_album: '2026-08-17',
        cover: '/storage/cover.jpg',
        jumlah_foto: 1,
        jumlah_video: 0,
        media: [
          {
            id_dokumentasi: 101,
            jenis_file: 'Foto',
            file: '/storage/foto1.jpg',
            keterangan: 'Juara 1 Tarik Tambang',
          },
        ],
      },
    });
  };

  const liveResult = await backendGetAlbumDetail('test-token', 5);
  assert.equal(liveResult.success, true);
  assert.equal(liveResult.data.nama_album, 'Lomba Tarik Tambang Live');
  assert.equal(liveResult.data.media.length, 1);
  assert.equal(liveResult.data.media[0].id_dokumentasi, 101);

  const fallback = getAlbumBySlug('makan-kerupuk');
  assert.ok(fallback);
  assert.equal(fallback.judul, 'Makan Kerupuk');
});


