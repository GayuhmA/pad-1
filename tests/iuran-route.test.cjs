const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
const { NextRequest } = require('next/server');
const { GET: getIuran } = require('../src/app/api/warga/iuran/route.ts');
const { GET: getDetailIuran } = require('../src/app/api/warga/iuran/[id]/route.ts');
const { POST: postPembayaran } = require('../src/app/api/warga/iuran/[id]/pembayaran/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

const billPayload = {
  id_iuran: 7,
  id_warga: 3,
  id_periode: 1,
  nominal: '50000.00',
  jatuh_tempo: '2026-08-10T00:00:00.000000Z',
  status: 'Belum Bayar',
  periode: {
    id_periode: 1,
    tahun: 2026,
    nama_kegiatan: 'Semarak HUT RI ke-81',
  },
  pembayaran: [{
    id_pembayaran: 9,
    tanggal_bayar: '2026-11-07T08:00:00.000000Z',
    nominal: '50000.00',
    metode: 'QRIS',
    status_verifikasi: 'Menunggu',
    tanggal_verifikasi: null,
  }],
};

function getRequest(path = '/api/warga/iuran', token = 'test-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

function paymentRequest(id, {
  token = 'test-token',
  origin = 'https://frontend.example',
  nominal = '50000',
  method = 'QRIS',
  file = new File([new Uint8Array([1, 2, 3])], 'bukti.png', { type: 'image/png' }),
} = {}) {
  const body = new FormData();
  body.set('metode', method);
  body.set('nominal', nominal);
  body.set('bukti_bayar', file);
  return new NextRequest(`https://frontend.example/api/warga/iuran/${id}/pembayaran`, {
    method: 'POST',
    headers: {
      Origin: origin,
      'Sec-Fetch-Site': origin === 'https://frontend.example' ? 'same-origin' : 'cross-site',
      ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
    },
    body,
  });
}

test('iuran list forwards the private token and normalizes money, dates, and latest payment', async () => {
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/warga/iuran');
    assert.equal(init.method, 'GET');
    assert.equal(init.headers.get('Authorization'), 'Bearer test-token');
    return Response.json({ success: true, message: 'Daftar tersedia.', data: [billPayload] });
  };

  const response = await getIuran(getRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    message: 'Daftar tersedia.',
    data: [{
      id_iuran: 7,
      nominal: 50000,
      jatuh_tempo: '2026-08-10',
      status: 'Belum Bayar',
      periode: {
        id_periode: 1,
        tahun: '2026',
        nama_kegiatan: 'Semarak HUT RI ke-81',
      },
      pembayaran_terakhir: {
        id_pembayaran: 9,
        tanggal_bayar: '2026-11-07T08:00:00.000000Z',
        nominal: 50000,
        metode: 'QRIS',
        status_verifikasi: 'Menunggu',
        tanggal_verifikasi: null,
      },
    }],
  });
});

test('iuran list accepts an empty backend list and rejects missing sessions or malformed data', async () => {
  global.fetch = async () => Response.json({ success: true, message: 'Daftar tersedia.', data: [] });
  assert.deepEqual((await getIuran(getRequest())).status, 200);

  global.fetch = () => { throw new Error('Must not reach backend'); };
  assert.equal((await getIuran(getRequest('/api/warga/iuran', ''))).status, 401);

  global.fetch = async () => Response.json({ success: true, message: 'Daftar tersedia.', data: [{ id_iuran: 1 }] });
  const malformed = await getIuran(getRequest());
  assert.equal(malformed.status, 502);
});

test('iuran detail forwards the id and exposes normalized payment history', async () => {
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/warga/iuran/7');
    assert.equal(init.headers.get('Authorization'), 'Bearer test-token');
    return Response.json({ success: true, message: 'Detail tersedia.', data: billPayload });
  };
  const response = await getDetailIuran(getRequest('/api/warga/iuran/7'), {
    params: Promise.resolve({ id: '7' }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.id_iuran, 7);
  assert.equal(body.data.pembayaran.length, 1);
  assert.equal(body.data.pembayaran_terakhir.status_verifikasi, 'Menunggu');
});

test('payment submission validates locally and forwards multipart without exposing the token', async () => {
  global.fetch = async (url, init) => {
    assert.equal(String(url), 'https://backend.example/api/warga/iuran/7/pembayaran');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.get('Authorization'), 'Bearer test-token');
    assert.equal(init.headers.get('Content-Type'), null);
    assert.ok(init.body instanceof FormData);
    assert.equal(init.body.get('metode'), 'QRIS');
    assert.equal(init.body.get('nominal'), '50000');
    const proof = init.body.get('bukti_bayar');
    assert.ok(proof instanceof File);
    assert.equal(proof.name, 'bukti.png');
    assert.equal(proof.type, 'image/png');
    return Response.json({
      success: true,
      message: 'Pembayaran iuran berhasil diajukan dan sedang menunggu verifikasi panitia.',
      data: {},
    }, { status: 201 });
  };

  const response = await postPembayaran(paymentRequest(7), {
    params: Promise.resolve({ id: '7' }),
  });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    success: true,
    message: 'Pembayaran iuran berhasil diajukan dan sedang menunggu verifikasi panitia.',
  });
});

test('payment submission rejects foreign origins, invalid ids, missing sessions, and invalid files', async () => {
  global.fetch = () => { throw new Error('Must not reach backend'); };

  assert.equal((await postPembayaran(paymentRequest('abc'), {
    params: Promise.resolve({ id: 'abc' }),
  })).status, 422);

  assert.equal((await postPembayaran(paymentRequest(7, { token: '' }), {
    params: Promise.resolve({ id: '7' }),
  })).status, 401);

  assert.equal((await postPembayaran(paymentRequest(7, { origin: 'https://evil.example' }), {
    params: Promise.resolve({ id: '7' }),
  })).status, 403);

  const pdf = new File([new Uint8Array([1])], 'bukti.pdf', { type: 'application/pdf' });
  const invalidFile = await postPembayaran(paymentRequest(7, { file: pdf }), {
    params: Promise.resolve({ id: '7' }),
  });
  assert.equal(invalidFile.status, 422);
  assert.deepEqual(await invalidFile.json(), {
    message: 'Bukti bayar harus berupa JPG, PNG, atau WebP berukuran maksimal 2 MB.',
  });
});

test('payment submission maps pending and backend validation conflicts to actionable messages', async () => {
  global.fetch = async () => Response.json({}, { status: 409 });
  const pending = await postPembayaran(paymentRequest(7), {
    params: Promise.resolve({ id: '7' }),
  });
  assert.equal(pending.status, 409);
  assert.deepEqual(await pending.json(), {
    message: 'Pembayaran sebelumnya masih menunggu verifikasi panitia.',
  });

  global.fetch = async () => Response.json({}, { status: 422 });
  const invalid = await postPembayaran(paymentRequest(7), {
    params: Promise.resolve({ id: '7' }),
  });
  assert.equal(invalid.status, 422);
  assert.deepEqual(await invalid.json(), {
    message: 'Pembayaran tidak valid. Pastikan nominal sesuai tagihan dan bukti bayar memenuhi ketentuan.',
  });
});
