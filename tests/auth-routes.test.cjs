const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'production';
process.env.API_URL = 'https://backend.example';
const { NextRequest } = require('next/server');
const { POST: login } = require('../src/app/api/auth/login/route.ts');
const { GET: me } = require('../src/app/api/auth/me/route.ts');
const { POST: logout } = require('../src/app/api/auth/logout/route.ts');
const { SESSION_COOKIE } = require('../src/lib/server/auth.ts');
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const account = {
  id_akun: 12, username: 'test-warga', status: 'Aktif',
  role: { id_role: 3, nama_role: 'Warga' },
  warga: { id_warga: 4, nama: 'Test Warga', no_hp: '081234567890' },
};
function request(endpoint, body, token) {
  return new NextRequest(`https://frontend.example/api/auth/${endpoint}`, {
    method: endpoint === 'me' ? 'GET' : 'POST',
    headers: { Origin: 'https://frontend.example', 'Content-Type': 'application/json',
      ...(token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}
test('login reads Laravel envelope and sets a secure HttpOnly cookie without exposing token', async () => {
  global.fetch = async (url, init) => {
    assert.equal(url, 'https://backend.example/api/auth/login');
    assert.equal(init.cache, 'no-store');
    assert.deepEqual(JSON.parse(init.body), { username: 'test-warga', password: 'test-password' });
    return Response.json({ success: true, data: { token: 'test-token', akun: account } });
  };
  const response = await login(request('login', { username: ' test-warga ', password: 'test-password' }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, { user: { id: 12, username: 'test-warga', nama: 'Test Warga', role: 'Warga', phone: '081234567890', is_active: true } });
  assert.ok(!JSON.stringify(body).includes('test-token'));
  const cookie = response.headers.get('set-cookie');
  for (const attribute of ['__Host-pad_session=', 'HttpOnly', 'Secure', 'SameSite=lax', 'Path=/']) assert.ok(cookie.includes(attribute));
  assert.match(response.headers.get('cache-control'), /no-store/);
});
test('cross-origin and missing-origin mutations are rejected before reaching backend', async () => {
  global.fetch = () => { throw new Error('Must not reach backend'); };
  for (const origin of ['https://evil.example', null]) {
    const req = request('login', { username: 'test', password: 'test' });
    if (origin) req.headers.set('origin', origin); else req.headers.delete('origin');
    assert.equal((await login(req)).status, 403);
  }
  const req = request('logout', undefined, 'test-token');
  req.headers.set('origin', 'https://evil.example');
  assert.equal((await logout(req)).status, 403);
});
test('bad input and invalid successful upstream response never establish a session', async () => {
  assert.equal((await login(request('login', { username: '', password: '' }))).status, 422);
  global.fetch = async () => Response.json({ success: true, data: { token: 'test-token', akun: {} } });
  const response = await login(request('login', { username: 'test', password: 'test' }));
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('set-cookie'), null);
});
test('me validates cookie on backend and normalizes nullable phone', async () => {
  global.fetch = async (url, init) => {
    assert.equal(url, 'https://backend.example/api/auth/me');
    assert.equal(init.headers.get('Authorization'), 'Bearer test-token');
    return Response.json({ success: true, data: { ...account, warga: { ...account.warga, no_hp: null } } });
  };
  const response = await me(request('me', undefined, 'test-token'));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.phone, null);
  assert.equal(response.headers.get('set-cookie'), null);
});
test('missing/expired session and inactive account do not expose a user', async () => {
  global.fetch = () => { throw new Error('No token must not reach backend'); };
  assert.equal((await me(request('me'))).status, 401);
  global.fetch = async () => Response.json({ message: 'Unauthenticated' }, { status: 401 });
  const expired = await me(request('me', undefined, 'old-token'));
  assert.equal(expired.status, 401);
  assert.equal(expired.headers.get('set-cookie'), null, 'A stale GET must not erase a new cookie');
  global.fetch = async () => Response.json({ success: true, data: { ...account, status: 'Nonaktif' } });
  assert.equal((await me(request('me', undefined, 'inactive'))).status, 401);
});
test('backend outage preserves cookie, returns safe retryable error', async () => {
  global.fetch = async () => { throw new Error('Private upstream details'); };
  for (const handler of [me, logout]) {
    const response = await handler(request(handler === me ? 'me' : 'logout', undefined, 'test-token'));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.ok(!(await response.text()).includes('Private upstream'));
  }
});
test('logout revokes only the current token and clears cookie; expired logout also succeeds', async () => {
  for (const status of [200, 401]) {
    global.fetch = async (url, init) => {
      assert.equal(url, 'https://backend.example/api/auth/logout');
      assert.equal(init.headers.get('Authorization'), 'Bearer test-token');
      return Response.json({ success: true }, { status });
    };
    const response = await logout(request('logout', undefined, 'test-token'));
    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  }
});

test('configured public origin supports a trusted reverse proxy without accepting foreign origins', async () => {
  const previous = process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = 'https://public.example';
  try {
    global.fetch = async () => Response.json({ success: true });
    const accepted = request('logout');
    accepted.headers.set('origin', 'https://public.example');
    assert.equal((await logout(accepted)).status, 200);
    assert.equal((await logout(request('logout'))).status, 403);
  } finally {
    if (previous === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = previous;
  }
});

test('backend uses a scoped connection dispatcher without changing global network defaults', async () => {
  const net = require('node:net');
  const originalTimeout = net.getDefaultAutoSelectFamilyAttemptTimeout();
  global.fetch = async (_url, init) => {
    assert.equal(typeof init.dispatcher?.dispatch, 'function');
    assert.equal(net.getDefaultAutoSelectFamilyAttemptTimeout(), originalTimeout);
    return Response.json({ success: true, data: account });
  };
  assert.equal((await me(request('me', undefined, 'test-token'))).status, 200);
});

test('transport diagnostics record only endpoint and code, never raw errors or credentials', async () => {
  const originalWarn = console.warn;
  const logs = [];
  console.warn = (...args) => logs.push(args);
  global.fetch = async () => {
    throw new TypeError('secret-password secret-token', { cause: Object.assign(new Error('private upstream data'), { code: 'ETIMEDOUT' }) });
  };
  try {
    const response = await login(request('login', { username: 'test', password: 'secret-password' }));
    assert.equal(response.status, 503);
    assert.deepEqual(logs, [['[auth/backend] connection failed', { endpoint: 'login', code: 'ETIMEDOUT' }]]);
    assert.ok(!(await response.text()).includes('secret'));
  } finally { console.warn = originalWarn; }
});
