const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
const { NextRequest } = require('next/server');
const { GET: beranda } = require('../src/app/api/warga/beranda/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

const payload = {
  success: true,
  message: 'Data beranda warga berhasil diambil',
  data: {
    banner: {
      id_periode: 1,
      judul: 'Semarak HUT RI ke-81',
      tahun: '2026',
      deskripsi: 'Nusantara Bersuka, Indonesia Berjaya',
      logo: null,
    },
    tanggal_filter: '2026-08-15',
    jadwal_agenda: [{
      id_jadwal: 1,
      id_lomba: 1,
      nama_lomba: 'Tarik Tambang',
      nama_kategori: 'Dewasa',
      tanggal: '2026-08-15',
      waktu_mulai: '09:00:00',
      waktu_selesai: '11:00:00',
      lokasi: 'Lapangan Timur',
    }],
    pengumuman_terbaru: {
      id_pengumuman: 1,
      judul: 'Pengumuman Jadwal',
      isi: 'Seluruh warga diharapkan hadir.',
      tanggal_publikasi: '2026-08-14 08:00:00',
    },
    sedang_berlangsung: [{
      id_pertandingan: 1,
      id_lomba: 1,
      nama_lomba: 'Tarik Tambang',
      peserta_1: 'RT 01',
      peserta_2: 'RT 02',
      babak: 'Semifinal',
      waktu_mulai: '2026-08-15 09:00:00',
      waktu_selesai: '2026-08-15 11:00:00',
      status: 'Berlangsung',
      lokasi: 'Lapangan Utara',
    }],
  },
};

function request(tanggal, token = 'test-token') {
  const query = tanggal === undefined ? '' : `?tanggal=${encodeURIComponent(tanggal)}`;
  return new NextRequest(`https://frontend.example/api/warga/beranda${query}`, {
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

test('beranda forwards the private token and date, then returns validated data', async () => {
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/warga/beranda?tanggal=2026-08-15');
    assert.equal(init.headers.Authorization, 'Bearer test-token');
    assert.equal(init.cache, 'no-store');
    return Response.json(payload);
  };
  const response = await beranda(request('2026-08-15'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), payload);
  assert.match(response.headers.get('cache-control'), /no-store/);
});

test('beranda rejects missing sessions and invalid dates before calling backend', async () => {
  global.fetch = () => { throw new Error('Must not reach backend'); };
  assert.equal((await beranda(request(undefined, ''))).status, 401);
  assert.equal((await beranda(request(''))).status, 422);
  assert.equal((await beranda(request('2026-02-30'))).status, 422);
  assert.equal((await beranda(request('15-08-2026'))).status, 422);
});

test('beranda rejects malformed successful backend data', async () => {
  const malformed = structuredClone(payload);
  delete malformed.data.sedang_berlangsung[0].babak;
  global.fetch = async () => Response.json(malformed);
  const response = await beranda(request());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { message: 'Respons layanan beranda tidak valid. Silakan coba lagi.' });
});
