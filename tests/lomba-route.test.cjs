const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
const { NextRequest } = require('next/server');
const { GET: getLomba } = require('../src/app/api/warga/lomba/route.ts');
const {
  GET: getRiwayatPendaftaran,
  POST: postPendaftaran,
} = require('../src/app/api/warga/pendaftaran/route.ts');
const {
  DELETE: deletePendaftaran,
} = require('../src/app/api/warga/pendaftaran/[id]/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');
const { buildAgendaDateTabs, getScheduleTimingStatus } = require('../src/lib/lomba-date.ts');

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

const payload = {
  success: true,
  message: 'Daftar lomba berhasil ditampilkan.',
  data: [{
    id_lomba: 3,
    nama_lomba: 'Futsal Sarung',
    jenis_pendaftaran: 'Beregu',
    status: 'Dibuka',
    deskripsi: 'Perlombaan dalam rangka HUT RI ke-81.',
    kategori: { id_kategori: 1, nama_kategori: 'Dewasa' },
    kapasitas_peserta: 4,
    batas_anggota_tim: 5,
    sudah_mendaftar: false,
    jadwal: [{
      id_jadwal: 3,
      tanggal: '2026-08-16',
      waktu_mulai: '09:00:00',
      waktu_selesai: '11:30:00',
      lokasi: 'Lapangan Utara',
      status_jadwal: 'Segera',
    }],
  }],
  tanggal_tersedia: ['2026-08-17', '2026-08-16', '2026-08-16'],
};

function getRequest(token = 'test-token') {
  return new NextRequest('https://frontend.example/api/warga/lomba', {
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

function postRequest(body, token = 'test-token') {
  return new NextRequest('https://frontend.example/api/warga/pendaftaran', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://frontend.example',
      'Sec-Fetch-Site': 'same-origin',
      ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

function getPendaftaranRequest(token = 'test-token') {
  return new NextRequest('https://frontend.example/api/warga/pendaftaran', {
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

function deletePendaftaranRequest(id, token = 'test-token') {
  return new NextRequest(`https://frontend.example/api/warga/pendaftaran/${id}`, {
    method: 'DELETE',
    headers: {
      Origin: 'https://frontend.example',
      'Sec-Fetch-Site': 'same-origin',
      ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
    },
  });
}

test('lomba forwards the private token and validates the backend response', async () => {
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/warga/lomba');
    assert.equal(init.method, 'GET');
    assert.equal(init.headers.Authorization, 'Bearer test-token');
    return Response.json(payload);
  };
  const response = await getLomba(getRequest());
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.data, payload.data);
  assert.deepEqual(body.tanggal_tersedia, ['2026-08-16', '2026-08-17']);
});

test('lomba rejects a missing session and malformed successful data', async () => {
  global.fetch = () => { throw new Error('Must not reach backend'); };
  assert.equal((await getLomba(getRequest(''))).status, 401);

  const malformed = structuredClone(payload);
  malformed.data[0].jenis_pendaftaran = 'Kelompok';
  global.fetch = async () => Response.json(malformed);
  const response = await getLomba(getRequest());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { message: 'Respons layanan lomba tidak valid. Silakan coba lagi.' });
});

test('registration sends only id_lomba and returns a normalized success response', async () => {
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/warga/pendaftaran');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.Authorization, 'Bearer test-token');
    assert.deepEqual(JSON.parse(init.body), { id_lomba: 3 });
    return Response.json({ success: true, message: 'Pendaftaran berhasil.', data: {}, kuota: {} }, { status: 201 });
  };
  const response = await postPendaftaran(postRequest({ id_lomba: 3 }));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { success: true, message: 'Pendaftaran berhasil.' });
});

test('registration validates origin, session, and competition id before backend access', async () => {
  global.fetch = () => { throw new Error('Must not reach backend'); };
  assert.equal((await postPendaftaran(postRequest({ id_lomba: 0 }))).status, 422);
  assert.equal((await postPendaftaran(postRequest({ id_lomba: 3 }, ''))).status, 401);

  const foreign = postRequest({ id_lomba: 3 });
  foreign.headers.set('origin', 'https://evil.example');
  foreign.headers.set('sec-fetch-site', 'cross-site');
  assert.equal((await postPendaftaran(foreign)).status, 403);
});

test('registration history forwards the session and normalizes the backend payload', async () => {
  const historyPayload = {
    success: true,
    message: 'Daftar riwayat pendaftaran lomba berhasil diambil.',
    data: [{
      id_pendaftaran: 1,
      id_warga: 3,
      id_lomba: 3,
      nama_tim: null,
      id_tim: null,
      tanggal_daftar: '2026-11-05T17:19:22.000000Z',
      status: 'Menunggu',
      catatan: null,
      lomba: {
        id_lomba: 3,
        nama_lomba: 'Futsal Sarung',
        jenis_pendaftaran: 'Beregu',
        kategori: { id_kategori: 1, nama_kategori: 'Dewasa' },
        jadwal: [{
          id_jadwal: 3,
          tanggal: '2026-08-16T00:00:00.000000Z',
          waktu_mulai: '09:00:00',
          waktu_selesai: '11:30:00',
          lokasi: 'Lapangan Utara',
        }],
      },
      anggota: [],
      tim: null,
    }],
  };

  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/warga/pendaftaran');
    assert.equal(init.method, 'GET');
    assert.equal(init.headers.Authorization, 'Bearer test-token');
    return Response.json(historyPayload);
  };

  const response = await getRiwayatPendaftaran(getPendaftaranRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    message: historyPayload.message,
    data: [{
      id_pendaftaran: 1,
      tanggal_daftar: '2026-11-05T17:19:22.000000Z',
      status: 'Menunggu',
      catatan: null,
      id_tim: null,
      nama_tim: null,
      jumlah_anggota: 0,
      lomba: {
        id_lomba: 3,
        nama_lomba: 'Futsal Sarung',
        jenis_pendaftaran: 'Beregu',
        kategori: { id_kategori: 1, nama_kategori: 'Dewasa' },
        jadwal: [{
          id_jadwal: 3,
          tanggal: '2026-08-16',
          waktu_mulai: '09:00:00',
          waktu_selesai: '11:30:00',
          lokasi: 'Lapangan Utara',
        }],
      },
    }],
  });
});

test('registration history rejects missing sessions and malformed successful data', async () => {
  global.fetch = () => { throw new Error('Must not reach backend'); };
  assert.equal((await getRiwayatPendaftaran(getPendaftaranRequest(''))).status, 401);

  global.fetch = async () => Response.json({
    success: true,
    message: 'Riwayat tersedia.',
    data: [{ id_pendaftaran: 1 }],
  });
  const response = await getRiwayatPendaftaran(getPendaftaranRequest());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    message: 'Respons layanan pendaftaran tidak valid. Silakan coba lagi.',
  });
});

test('registration cancellation forwards the id and private token to backend', async () => {
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/warga/pendaftaran/1');
    assert.equal(init.method, 'DELETE');
    assert.equal(init.headers.Authorization, 'Bearer test-token');
    assert.equal(init.body, undefined);
    return Response.json({ success: true, message: 'Pendaftaran berhasil dibatalkan.' });
  };

  const response = await deletePendaftaran(
    deletePendaftaranRequest(1),
    { params: Promise.resolve({ id: '1' }) },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    message: 'Pendaftaran berhasil dibatalkan.',
  });
});

test('registration cancellation validates origin, session, id, and backend rules', async () => {
  global.fetch = () => { throw new Error('Must not reach backend'); };

  const invalidId = await deletePendaftaran(
    deletePendaftaranRequest('abc'),
    { params: Promise.resolve({ id: 'abc' }) },
  );
  assert.equal(invalidId.status, 422);

  const missingSession = await deletePendaftaran(
    deletePendaftaranRequest(1, ''),
    { params: Promise.resolve({ id: '1' }) },
  );
  assert.equal(missingSession.status, 401);

  const foreign = deletePendaftaranRequest(1);
  foreign.headers.set('origin', 'https://evil.example');
  foreign.headers.set('sec-fetch-site', 'cross-site');
  const forbidden = await deletePendaftaran(
    foreign,
    { params: Promise.resolve({ id: '1' }) },
  );
  assert.equal(forbidden.status, 403);

  global.fetch = async () => Response.json({}, { status: 422 });
  const notCancellable = await deletePendaftaran(
    deletePendaftaranRequest(1),
    { params: Promise.resolve({ id: '1' }) },
  );
  assert.equal(notCancellable.status, 422);
  assert.deepEqual(await notCancellable.json(), {
    message: 'Pendaftaran ini sudah tidak dapat dibatalkan.',
  });
});

test('agenda date tabs never duplicate 17 August as Today or Tomorrow', () => {
  const dates = ['2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18'];
  assert.deepEqual(buildAgendaDateTabs(dates, '2026-08-15'), [
    { date: '2026-08-15', label: 'Hari Ini' },
    { date: '2026-08-16', label: 'Besok' },
    { date: '2026-08-17', label: '17 Agustus' },
  ]);
  assert.deepEqual(buildAgendaDateTabs(dates, '2026-08-16'), [
    { date: '2026-08-16', label: 'Hari Ini' },
    { date: '2026-08-17', label: '17 Agustus' },
  ]);
  assert.deepEqual(buildAgendaDateTabs(dates, '2026-08-17'), [
    { date: '2026-08-17', label: '17 Agustus' },
    { date: '2026-08-18', label: 'Besok' },
  ]);
  assert.deepEqual(buildAgendaDateTabs(['2026-08-15', '2026-08-16'], '2026-11-06'), [
    { date: '2026-11-06', label: 'Hari Ini' },
    { date: '2026-11-07', label: 'Besok' },
    { date: '2026-08-17', label: '17 Agustus' },
  ]);
});

test('schedule timing status is derived in Asia/Jakarta instead of trusting backend status', () => {
  const beforeFinish = new Date('2026-08-17T03:59:59.000Z'); // 10:59:59 WIB
  const atFinish = new Date('2026-08-17T04:00:00.000Z'); // 11:00:00 WIB
  const schedule = {
    tanggal: '2026-08-17',
    waktu_mulai: '09:00:00',
    waktu_selesai: '11:00:00',
  };

  assert.equal(getScheduleTimingStatus(schedule, beforeFinish), 'Segera');
  assert.equal(getScheduleTimingStatus(schedule, atFinish), 'Selesai');
  assert.equal(getScheduleTimingStatus({ ...schedule, tanggal: '2026-08-18' }, atFinish), 'Segera');
  assert.equal(getScheduleTimingStatus({ ...schedule, tanggal: '2026-08-16' }, atFinish), 'Selesai');
});
