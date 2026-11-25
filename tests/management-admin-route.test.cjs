const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
process.env.APP_ORIGIN = 'https://frontend.example';

const { NextRequest } = require('next/server');
const { GET: getWarga, POST: createWarga } = require('../src/app/api/dashboard/warga/route.ts');
const { PUT: updateWarga, DELETE: deactivateWarga } = require('../src/app/api/dashboard/warga/[id]/route.ts');
const { GET: getRt, POST: createRt } = require('../src/app/api/dashboard/rt/route.ts');
const { DELETE: deleteRt } = require('../src/app/api/dashboard/rt/[id]/route.ts');
const { POST: createRw } = require('../src/app/api/dashboard/rw/route.ts');
const { DELETE: deleteRw } = require('../src/app/api/dashboard/rw/[id]/route.ts');
const { GET: getAkun } = require('../src/app/api/dashboard/akun/route.ts');
const { PATCH: updateRole } = require('../src/app/api/dashboard/akun/[id]/role/route.ts');
const { PATCH: updateStatus } = require('../src/app/api/dashboard/akun/[id]/status/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

function getReq(path, token = 'admin-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    method: 'GET',
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

function mutateReq(path, method, body, token = 'admin-token', origin = 'https://frontend.example') {
  const headers = {
    'Content-Type': 'application/json',
    ...(origin ? { origin } : {}),
    ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
  };
  return new NextRequest(`https://frontend.example${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

test('GET /api/dashboard/warga rejects unauthenticated requests and normalizes citizens with RT/RW data', async () => {
  assert.equal((await getWarga(getReq('/api/dashboard/warga', ''))).status, 401);

  global.fetch = async (url, init) => {
    const authHeader = init.headers instanceof Headers
      ? init.headers.get('Authorization')
      : init.headers.Authorization;
    assert.equal(authHeader, 'Bearer admin-token');
    const str = String(url);
    if (str.endsWith('/api/admin/rw')) {
      return Response.json({
        success: true,
        data: [{ id_rw: 1, nomor_rw: '001', nama_rw: 'RW 001' }],
      });
    }
    if (str.endsWith('/api/admin/rt')) {
      return Response.json({
        success: true,
        data: [{ id_rt: 2, id_rw: 1, nomor_rt: '002', nama_rt: 'RT 002' }],
      });
    }
    if (str.includes('/api/admin/warga')) {
      return Response.json({
        success: true,
        message: 'Daftar warga berhasil ditampilkan.',
        data: [
          {
            id_warga: 10,
            id_rt: 2,
            nik: '3276010101900001',
            nama: 'Budi Santoso',
            jenis_kelamin: 'L',
            tempat_lahir: 'Yogyakarta',
            tanggal_lahir: '1990-01-01T00:00:00.000000Z',
            no_hp: '081234567890',
            alamat: 'Jl. Melati',
            status: 'Aktif',
            akun: { id_akun: 5, username: 'budi90' },
          },
          {
            id_warga: 11,
            id_rt: 2,
            nik: '3276010101900002',
            nama: 'Siti Aminah',
            jenis_kelamin: 'P',
            status: 'Nonaktif',
          },
        ],
      });
    }
    throw new Error(`Unexpected url ${str}`);
  };

  const res = await getWarga(getReq('/api/dashboard/warga'));
  assert.equal(res.status, 200);
  const payload = await res.json();
  assert.equal(payload.data.warga.length, 2);
  assert.equal(payload.data.warga[0].nama_rt, 'RT 002');
  assert.equal(payload.data.warga[0].nomor_rw, '001');
  assert.equal(payload.data.warga[0].tanggal_lahir, '1990-01-01');
  assert.equal(payload.data.warga[0].username, 'budi90');
  assert.deepEqual(payload.data.metrics, {
    totalWarga: 2,
    aktifCount: 1,
    nonaktifCount: 1,
    totalRt: 1,
  });
});

test('POST /api/dashboard/warga enforces origin/validation and extracts created account credentials', async () => {
  const crossOrigin = mutateReq('/api/dashboard/warga', 'POST', { id_rt: 1 }, 'admin-token', 'https://evil.example');
  assert.equal((await createWarga(crossOrigin)).status, 403);

  const badNik = mutateReq('/api/dashboard/warga', 'POST', {
    id_rt: 1,
    nik: 'abc',
    nama: 'Budi',
    jenis_kelamin: 'L',
  });
  assert.equal((await createWarga(badNik)).status, 422);

  let sentBody = null;
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/admin/warga');
    assert.equal(init.method, 'POST');
    sentBody = JSON.parse(init.body);
    return Response.json(
      {
        success: true,
        message: 'Data warga dan akun berhasil dibuat.',
        data: {
          warga: {
            id_warga: 21,
            id_rt: 1,
            nik: '3276010101900001',
            nama: 'Budi Santoso',
            jenis_kelamin: 'L',
            status: 'Aktif',
          },
          akun: {
            id_akun: 30,
            username: 'budisantoso21',
            password_awal: 'budisantoso21',
            role: { id_role: 3, nama_role: 'Warga' },
          },
        },
      },
      { status: 201 },
    );
  };

  const okRes = await createWarga(
    mutateReq('/api/dashboard/warga', 'POST', {
      id_rt: 1,
      nik: '3276010101900001',
      nama: 'Budi Santoso',
      jenis_kelamin: 'L',
    }),
  );
  assert.equal(okRes.status, 201);
  assert.equal(sentBody.id_rt, 1);
  const body = await okRes.json();
  assert.equal(body.data.account.username, 'budisantoso21');
  assert.equal(body.data.account.password_awal, 'budisantoso21');
});

test('PUT and DELETE /api/dashboard/warga/[id] validate IDs and forward mutations', async () => {
  assert.equal(
    (await updateWarga(mutateReq('/api/dashboard/warga/abc', 'PUT', { nama: 'X' }), { params: Promise.resolve({ id: 'abc' }) })).status,
    400,
  );

  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/admin/warga/12');
    assert.equal(init.method, 'PUT');
    return Response.json({
      success: true,
      message: 'Data warga berhasil diubah.',
      data: { id_warga: 12, nik: '3276010101900001', nama: 'Budi Edit', jenis_kelamin: 'L', status: 'Aktif' },
    });
  };
  const putRes = await updateWarga(
    mutateReq('/api/dashboard/warga/12', 'PUT', { nama: 'Budi Edit' }),
    { params: Promise.resolve({ id: '12' }) },
  );
  assert.equal(putRes.status, 200);

  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/admin/warga/12');
    assert.equal(init.method, 'DELETE');
    return Response.json({ success: true, message: 'Warga berhasil dinonaktifkan.' });
  };
  const delRes = await deactivateWarga(
    mutateReq('/api/dashboard/warga/12', 'DELETE'),
    { params: Promise.resolve({ id: '12' }) },
  );
  assert.equal(delRes.status, 200);
});

test('RT & RW endpoints handle RT listing/creation and reject RW mutations with 405', async () => {
  global.fetch = async (url) => {
    if (String(url).endsWith('/api/admin/rw')) {
      return Response.json({ success: true, data: [{ id_rw: 1, nomor_rw: '001', nama_rw: 'RW 001' }] });
    }
    return Response.json({ success: true, data: [{ id_rt: 1, id_rw: 1, nomor_rt: '001', nama_rt: 'RT 001' }] });
  };
  const rtRes = await getRt(getReq('/api/dashboard/rt'));
  assert.equal(rtRes.status, 200);
  const rtJson = await rtRes.json();
  assert.equal(rtJson.data.rtList[0].nomor_rw, '001');

  assert.equal((await createRw(mutateReq('/api/dashboard/rw', 'POST', { nomor_rw: '002' }))).status, 405);

  global.fetch = async () => Response.json({ success: true, message: 'RT berhasil ditambahkan.' }, { status: 201 });
  assert.equal((await createRt(mutateReq('/api/dashboard/rt', 'POST', { id_rw: 1, nomor_rt: '002' }))).status, 201);

  global.fetch = async () => Response.json({ message: 'RT masih memiliki warga.' }, { status: 409 });
  assert.equal((await deleteRt(mutateReq('/api/dashboard/rt/1', 'DELETE'), { params: Promise.resolve({ id: '1' }) })).status, 409);

  assert.equal((await deleteRw(mutateReq('/api/dashboard/rw/1', 'DELETE'), { params: Promise.resolve({ id: '1' }) })).status, 405);
});

test('Account management endpoints fetch accounts, update roles, and update status', async () => {
  global.fetch = async (url) => {
    assert.match(String(url), /\/api\/admin\/akun/);
    return Response.json({
      success: true,
      message: 'Daftar akun berhasil diambil.',
      data: {
        current_page: 1,
        data: [
          {
            id_akun: 1,
            username: 'admindemo',
            status: 'Aktif',
            role: { id_role: 1, nama_role: 'Admin' },
            warga: { nama: 'Admin Utama', nik: '3276000000000001' },
          },
          {
            id_akun: 2,
            username: 'panitiademo',
            status: 'Aktif',
            role: { id_role: 2, nama_role: 'Panitia' },
            warga: { nama: 'Panitia Acara' },
          },
          {
            id_akun: 3,
            username: 'wargademo12',
            status: 'Nonaktif',
            role: { id_role: 3, nama_role: 'Warga' },
            warga: { nama: 'Demo Warga 12' },
          },
        ],
      },
    });
  };
  const akunRes = await getAkun(getReq('/api/dashboard/akun'));
  assert.equal(akunRes.status, 200);
  const akunJson = await akunRes.json();
  assert.equal(akunJson.data.akun.length, 3);
  assert.deepEqual(akunJson.data.metrics, {
    totalAkun: 3,
    panitiaCount: 1,
    wargaCount: 1,
    aktifCount: 2,
  });

  assert.equal(
    (await updateRole(mutateReq('/api/dashboard/akun/3/role', 'PATCH', { id_role: 0 }), { params: Promise.resolve({ id: '3' }) })).status,
    422,
  );
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/admin/akun/3/role');
    assert.equal(init.method, 'PATCH');
    assert.deepEqual(JSON.parse(init.body), { id_role: 2 });
    return Response.json({ success: true, message: 'Role akun berhasil diperbarui.' });
  };
  assert.equal(
    (await updateRole(mutateReq('/api/dashboard/akun/3/role', 'PATCH', { id_role: 2 }), { params: Promise.resolve({ id: '3' }) })).status,
    200,
  );

  assert.equal(
    (await updateStatus(mutateReq('/api/dashboard/akun/3/status', 'PATCH', { status: 'Invalid' }), { params: Promise.resolve({ id: '3' }) })).status,
    422,
  );
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/admin/akun/3/status');
    assert.equal(init.method, 'PATCH');
    assert.deepEqual(JSON.parse(init.body), { status: 'Aktif' });
    return Response.json({ success: true, message: 'Status akun berhasil diperbarui.' });
  };
  assert.equal(
    (await updateStatus(mutateReq('/api/dashboard/akun/3/status', 'PATCH', { status: 'Aktif' }), { params: Promise.resolve({ id: '3' }) })).status,
    200,
  );
});
