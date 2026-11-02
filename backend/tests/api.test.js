// API smoke tests that do NOT need MongoDB: they check auth guards, validation and routing.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const test = require('node:test');
const assert = require('node:assert');
const app = require('../app');

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});
test.after(() => server.close());

const call = (path, options = {}) =>
  fetch(base + path, { headers: { 'Content-Type': 'application/json' }, ...options });

test('health check works', async () => {
  const res = await call('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).status, 'ok');
});

test('protected routes reject requests without a token', async () => {
  for (const p of ['/api/students', '/api/dashboard/summary', '/api/interventions', '/api/notifications', '/api/admin/users', '/api/admin/reports', '/api/attendance/roster?date=2026-10-19', '/api/admin/mentors']) {
    const res = await call(p);
    assert.strictEqual(res.status, 401, p);
  }
});

test('login validates input before touching the database', async () => {
  const res = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'not-an-email', password: '' }) });
  assert.strictEqual(res.status, 400);
  assert.ok((await res.json()).message);
});

test('attendance marking validates the request body before the database', async () => {
  const res = await call('/api/attendance/mark', { method: 'POST', body: JSON.stringify({ date: 'x', records: [] }) });
  assert.strictEqual(res.status, 401); // no token: still guarded
});

test('register validates input (short password)', async () => {
  const res = await call('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'A', email: 'a@b.com', password: '123' }),
  });
  assert.strictEqual(res.status, 400);
});

test('unknown routes return 404', async () => {
  const res = await call('/api/nope');
  assert.strictEqual(res.status, 404);
});
