const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAuthStore } = require('../src/stores/auth-store.ts');
const { ApiRequestError } = require('../src/lib/api/client.ts');
const { getResidentProfile } = require('../src/lib/profile.ts');
const user = { id: 1, username: 'warga-test', nama: 'Test Warga', role: 'Warga', phone: '081234567890', is_active: true };
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function setup(overrides = {}) {
  const api = { login: async () => ({ user }), getMe: async () => ({ user }), logout: async () => ({ message: 'ok' }), ...overrides };
  let notifications = 0;
  const store = createAuthStore(api, () => notifications++);
  return { store, api, notifications: () => notifications };
}
test('restores session once even with concurrent initialization', async () => {
  const pending = deferred(); let calls = 0;
  const { store } = setup({ getMe: () => { calls++; return pending.promise; } });
  const first = store.getState().fetchUser();
  const second = store.getState().fetchUser();
  assert.equal(calls, 1);
  assert.equal(store.getState().user, null);
  pending.resolve({ user });
  await Promise.all([first, second]);
  assert.equal(store.getState().status, 'authenticated');
  assert.deepEqual(store.getState().user, user);
});
test('network error during restore allows retry; background failure keeps account', async () => {
  const { store, api } = setup({ getMe: async () => { throw new ApiRequestError('offline', 0); } });
  await store.getState().fetchUser();
  assert.equal(store.getState().status, 'error');
  assert.equal(store.getState().user, null);
  api.getMe = async () => ({ user });
  await store.getState().fetchUser(true);
  assert.equal(store.getState().status, 'authenticated');
  api.getMe = async () => { throw new ApiRequestError('unavailable', 503); };
  await store.getState().fetchUser(true);
  assert.deepEqual(store.getState().user, user);
  assert.equal(store.getState().status, 'authenticated');
});
test('401 removes identity, while 403 remains an access error', async () => {
  const { store, api } = setup();
  await store.getState().fetchUser();
  api.getMe = async () => { throw new ApiRequestError('forbidden', 403); };
  await store.getState().fetchUser(true);
  assert.equal(store.getState().status, 'authenticated');
  api.getMe = async () => { throw new ApiRequestError('expired', 401); };
  await store.getState().fetchUser(true);
  assert.equal(store.getState().status, 'unauthenticated');
  assert.equal(store.getState().user, null);
});
test('late me response cannot resurrect identity after logout', async () => {
  const { store, api, notifications } = setup();
  await store.getState().fetchUser();
  const pending = deferred(); api.getMe = () => pending.promise;
  const old = store.getState().fetchUser(true);
  await store.getState().logout();
  pending.resolve({ user }); await old;
  assert.equal(store.getState().user, null);
  assert.equal(store.getState().status, 'unauthenticated');
  assert.equal(notifications(), 1);
});
test('logout failure preserves session for retry', async () => {
  const { store, api } = setup({ logout: async () => { throw new ApiRequestError('offline', 0); } });
  await store.getState().fetchUser();
  await assert.rejects(store.getState().logout());
  assert.equal(store.getState().status, 'authenticated');
  assert.deepEqual(store.getState().user, user);
  api.logout = async () => ({ message: 'ok' });
  await store.getState().logout();
  assert.equal(store.getState().user, null);
});
test('login fetches complete account and ignores an older session check', async () => {
  const pending = deferred();
  const { store, api, notifications } = setup({ getMe: () => pending.promise });
  const old = store.getState().fetchUser();
  const newUser = { ...user, id: 2, nama: 'Akun Baru' };
  api.getMe = async () => ({ user: newUser });
  await store.getState().login('new', 'test');
  pending.reject(new ApiRequestError('expired old session', 401)); await old;
  assert.deepEqual(store.getState().user, newUser);
  assert.equal(notifications(), 1);
});
test('cross-tab invalidation hides old profile and reads new identity', async () => {
  const { store, api } = setup(); await store.getState().fetchUser();
  const pending = deferred(); api.getMe = () => pending.promise;
  const sync = store.getState().syncSession();
  assert.equal(store.getState().user, null);
  pending.resolve({ user: { ...user, id: 2, nama: 'Akun Lain' } }); await sync;
  assert.equal(store.getState().user.id, 2);
});
test('profile uses backend identity/phone and has no demo fallback', () => {
  assert.equal(getResidentProfile(null), null);
  const profile = getResidentProfile(user);
  assert.equal(profile.username, user.username);
  assert.equal(profile.name, user.nama);
  assert.equal(profile.phone, user.phone);
  assert.equal(profile.address, '');
  assert.equal(profile.birthDate, '');
});

test('duplicate login is rejected while first submission is pending', async () => {
  const pending = deferred(); let calls = 0;
  const { store } = setup({ login: () => { calls++; return pending.promise; } });
  const first = store.getState().login('test', 'test');
  await assert.rejects(store.getState().login('test', 'test'));
  assert.equal(calls, 1);
  pending.resolve({ user }); await first;
  assert.equal(store.getState().status, 'authenticated');
});
test('failed credentials keep login retryable and do not expose an account', async () => {
  const { store, api } = setup({ login: async () => { throw new ApiRequestError('wrong credentials', 401); } });
  await assert.rejects(store.getState().login('test', 'wrong'));
  assert.equal(store.getState().status, 'unauthenticated');
  assert.equal(store.getState().user, null);
  assert.equal(store.getState().error, 'wrong credentials');
  api.login = async () => ({ user });
  await store.getState().login('test', 'right');
  assert.deepEqual(store.getState().user, user);
});
test('successful login followed by unavailable me hides profile until retry', async () => {
  const { store, api } = setup({ getMe: async () => { throw new ApiRequestError('unavailable', 503); } });
  await store.getState().login('test', 'test');
  assert.equal(store.getState().status, 'error');
  assert.equal(store.getState().user, null);
  api.getMe = async () => ({ user });
  await store.getState().fetchUser(true);
  assert.deepEqual(store.getState().user, user);
});
test('expired login cookie returns to login with an actionable error', async () => {
  const { store } = setup({ getMe: async () => { throw new ApiRequestError('expired', 401); } });
  await assert.rejects(store.getState().login('test', 'test'));
  assert.equal(store.getState().status, 'unauthenticated');
  assert.equal(store.getState().user, null);
  assert.ok(store.getState().error);
});

test('restricted browser storage/channels cannot turn a successful session change into an error', () => {
  const { publishSessionChange } = require('../src/lib/session-sync.ts');
  const original = { window: global.window, BroadcastChannel: global.BroadcastChannel, localStorage: global.localStorage };
  try {
    global.window = {};
    global.BroadcastChannel = class { constructor() { throw new Error('disabled'); } };
    global.localStorage = { setItem() { throw new Error('disabled'); } };
    assert.doesNotThrow(() => publishSessionChange());
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete global[key]; else global[key] = value;
    }
  }
});
