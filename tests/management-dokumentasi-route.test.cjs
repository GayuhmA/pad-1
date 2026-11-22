const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
process.env.APP_ORIGIN = 'https://frontend.example';

const { NextRequest } = require('next/server');
const { GET: getAlbumList, POST: createAlbumRoute } = require('../src/app/api/dokumentasi/route.ts');
const { GET: getAlbumDetailRoute, DELETE: deleteAlbumRoute } = require('../src/app/api/dokumentasi/[id]/route.ts');
const { POST: uploadMediaRoute } = require('../src/app/api/dokumentasi/[id]/media/route.ts');
const { DELETE: deleteMediaRoute } = require('../src/app/api/dokumentasi/[id]/media/[idMedia]/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

const sampleAlbums = [
  {
    id_album: 1,
    nama_album: 'Lomba Tarik Tambang',
    tanggal_album: '2026-08-17',
    cover: '/storage/dokumentasi/cover1.jpg',
    jumlah_foto: 5,
    jumlah_video: 2,
    periode: { id_periode: 1, tahun: 2026, nama_kegiatan: 'HUT RI 81' },
    lomba: null,
  },
];

const sampleDetail = {
  id_album: 1,
  nama_album: 'Lomba Tarik Tambang',
  tanggal_album: '2026-08-17',
  cover: '/storage/dokumentasi/cover1.jpg',
  jumlah_foto: 1,
  jumlah_video: 0,
  periode: { id_periode: 1, tahun: 2026, nama_kegiatan: 'HUT RI 81' },
  lomba: null,
  media: [
    {
      id_dokumentasi: 10,
      jenis_file: 'Foto',
      file: '/storage/dokumentasi/media/foto1.jpg',
      keterangan: 'Juara 1 Tarik Tambang',
    },
  ],
};

function getRequest(path = '/api/dokumentasi', token = 'test-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    headers: token ? { Cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  });
}

function postFormRequest(path, formData, token = 'test-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    method: 'POST',
    headers: {
      origin: 'https://frontend.example',
      ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
    },
    body: formData,
  });
}

function deleteRequest(path, token = 'test-token') {
  return new NextRequest(`https://frontend.example${path}`, {
    method: 'DELETE',
    headers: {
      origin: 'https://frontend.example',
      ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}),
    },
  });
}

test('getAlbums returns formatted album list with normalized cover URLs', async () => {
  global.fetch = async (url) => {
    assert.ok(String(url).includes('/api/dokumentasi'));
    return Response.json({
      success: true,
      message: 'Daftar album dokumentasi berhasil diambil.',
      data: sampleAlbums,
    });
  };

  const response = await getAlbumList(getRequest());
  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.length, 1);
  assert.equal(payload.data[0].nama_album, 'Lomba Tarik Tambang');
  assert.equal(payload.data[0].cover, 'https://backend.example/storage/dokumentasi/cover1.jpg');
});

test('createAlbum POST creates a new album successfully', async () => {
  let backendMethod = null;
  global.fetch = async (url, init = {}) => {
    assert.ok(String(url).includes('/api/dokumentasi'));
    backendMethod = init.method ?? 'GET';
    return Response.json({
      success: true,
      message: 'Album dokumentasi berhasil dibuat.',
      data: sampleAlbums[0],
    });
  };

  const formData = new FormData();
  formData.append('nama_album', 'Lomba Tarik Tambang');
  formData.append('tanggal_album', '2026-08-17');

  const response = await createAlbumRoute(postFormRequest('/api/dokumentasi', formData));
  assert.equal(response.status, 201);
  assert.equal(backendMethod, 'POST');

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.nama_album, 'Lomba Tarik Tambang');
});

test('createAlbum POST rejects missing nama_album with 422', async () => {
  const formData = new FormData();
  formData.append('tanggal_album', '2026-08-17');

  const response = await createAlbumRoute(postFormRequest('/api/dokumentasi', formData));
  assert.equal(response.status, 422);
});

test('createAlbum POST rejects unauthenticated request with 401', async () => {
  const formData = new FormData();
  formData.append('nama_album', 'Test Album');

  const response = await createAlbumRoute(postFormRequest('/api/dokumentasi', formData, ''));
  assert.equal(response.status, 401);
});

test('getAlbumDetail returns normalized detail and media files', async () => {
  global.fetch = async (url) => {
    assert.ok(String(url).includes('/api/dokumentasi/1'));
    return Response.json({
      success: true,
      message: 'Detail album dokumentasi berhasil diambil.',
      data: sampleDetail,
    });
  };

  const response = await getAlbumDetailRoute(
    getRequest('/api/dokumentasi/1'),
    { params: Promise.resolve({ id: '1' }) },
  );
  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.nama_album, 'Lomba Tarik Tambang');
  assert.equal(payload.data.media.length, 1);
  assert.equal(payload.data.media[0].file, 'https://backend.example/storage/dokumentasi/media/foto1.jpg');
});

test('deleteAlbum DELETE removes album', async () => {
  let backendMethod = null;
  global.fetch = async (url, init = {}) => {
    assert.ok(String(url).includes('/api/dokumentasi/1'));
    backendMethod = init.method ?? 'GET';
    return Response.json({
      success: true,
      message: 'Album dokumentasi berhasil dihapus.',
      data: null,
    });
  };

  const response = await deleteAlbumRoute(
    deleteRequest('/api/dokumentasi/1'),
    { params: Promise.resolve({ id: '1' }) },
  );
  assert.equal(response.status, 200);
  assert.equal(backendMethod, 'DELETE');
});

test('uploadMedia POST uploads a photo to album', async () => {
  let backendMethod = null;
  global.fetch = async (url, init = {}) => {
    assert.ok(String(url).includes('/api/dokumentasi/1/media'));
    backendMethod = init.method ?? 'GET';
    return Response.json({
      success: true,
      message: 'Media dokumentasi berhasil diunggah.',
      data: sampleDetail.media[0],
    });
  };

  const formData = new FormData();
  formData.append('jenis_file', 'Foto');
  formData.append('file', new Blob(['test-image'], { type: 'image/png' }), 'test.png');

  const response = await uploadMediaRoute(
    postFormRequest('/api/dokumentasi/1/media', formData),
    { params: Promise.resolve({ id: '1' }) },
  );
  assert.equal(response.status, 201);
  assert.equal(backendMethod, 'POST');
});

test('deleteMedia DELETE removes a media item', async () => {
  let backendMethod = null;
  global.fetch = async (url, init = {}) => {
    assert.ok(String(url).includes('/api/dokumentasi/1/media/10'));
    backendMethod = init.method ?? 'GET';
    return Response.json({
      success: true,
      message: 'Media dokumentasi berhasil dihapus.',
      data: null,
    });
  };

  const response = await deleteMediaRoute(
    deleteRequest('/api/dokumentasi/1/media/10'),
    { params: Promise.resolve({ id: '1', idMedia: '10' }) },
  );
  assert.equal(response.status, 200);
  assert.equal(backendMethod, 'DELETE');
});

