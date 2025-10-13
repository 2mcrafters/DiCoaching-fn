// Simple smoke test for Users CRUD against the running backend
// Usage:
//   BACKEND_URL=http://localhost:5000 node tools/tests/users-crud.mjs
// or via npm script: npm run test:users

import 'dotenv/config';

const BASE = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

async function request(path, { method = 'GET', headers = {}, body } = {}) {
  const url = `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const init = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);
  const res = await fetch(url, init);
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

function expect(cond, message) {
  if (!cond) throw new Error(message);
}

function headline(title) {
  console.log(`\n=== ${title} ===`);
}

async function main() {
  const createdIds = [];
  try {
    headline('GET /api/users');
    const list = await request('/api/users');
    if (!list.ok) {
      console.error('GET /api/users failed:', list.status, list.json);
      console.error('\nHint: Ensure backend is running and DB is reachable.');
      process.exit(1);
    }
    expect(Array.isArray(list.json.data), 'Expected data array in users list');
    console.log(`Users: ${list.json.data.length}`);

    headline('POST /api/users');
    const email = `testuser_${Date.now()}@example.com`;
    const createBody = {
      email,
      password: 'Test@1234',
      firstname: 'Test',
      lastname: 'User',
      role: 'auteur',
      status: 'active'
    };
    const created = await request('/api/users', { method: 'POST', body: createBody });
    expect(created.status === 201, `Create failed: ${created.status}`);
    expect(created.json?.data?.id, 'Create response missing user id');
    const userId = String(created.json.data.id);
    createdIds.push(userId);
    console.log('Created id:', userId);

    headline('GET /api/users/:id');
    const fetched = await request(`/api/users/${userId}`);
    expect(fetched.ok, `Fetch created user failed: ${fetched.status}`);
    expect(String(fetched.json?.data?.id) === userId, 'Fetched id mismatch');

    headline('NEGATIVE: GET /api/users/:id (unknown)');
    const notFound = await request(`/api/users/999999999`);
    expect(notFound.status === 404 || notFound.status === 400, `Expected 404/400, got ${notFound.status}`);

    headline('PUT /api/users/:id');
    const updated = await request(`/api/users/${userId}`, {
      method: 'PUT',
      body: { firstname: 'Updated', lastname: 'User' }
    });
    expect(updated.ok, `Update failed: ${updated.status}`);
    expect(updated.json?.data?.firstname === 'Updated', 'Firstname not updated');

    headline('NEGATIVE: PUT /api/users/:id (no fields)');
    const badUpdate = await request(`/api/users/${userId}`, { method: 'PUT', body: {} });
    expect(badUpdate.status === 400, `Expected 400, got ${badUpdate.status}`);

    headline('GET /api/users/:id/stats');
    const stats = await request(`/api/users/${userId}/stats`);
    expect(stats.ok, `Stats failed: ${stats.status}`);
    expect(typeof stats.json?.data === 'object', 'Stats response invalid');
    console.log('Stats:', stats.json.data);

    headline('DELETE /api/users/:id');
    const del = await request(`/api/users/${userId}`, { method: 'DELETE' });
    expect(del.ok, `Delete failed: ${del.status}`);
    console.log('Deleted:', userId);

    console.log('\n✅ Users CRUD smoke test passed');
  } catch (err) {
    console.error('\n❌ Users CRUD smoke test failed:', err.message);
    process.exitCode = 1;
  }
}

main();
