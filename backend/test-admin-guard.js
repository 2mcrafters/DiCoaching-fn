/**
 * Verify admin-only guard on pending-authors endpoint
 * - Register a researcher (default role)
 * - Try to GET /users/pending-authors with researcher token -> expect 403
 *
 * Run with: node backend/test-admin-guard.js
 */

const BASE = 'http://localhost:5000/api';

async function json(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function registerResearcher() {
  const unique = Date.now() % 1e9;
  const email = `guard_${unique}@example.com`;
  const r = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'P@ssw0rd!123',
      firstName: 'Guard',
      lastName: 'Tester'
    })
  });
  const d = await json(r);
  if (!r.ok) throw new Error(`register fail ${JSON.stringify(d)}`);
  return d.data?.user || d.data;
}

async function login(email, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const d = await json(r);
  if (!r.ok) throw new Error(`login fail ${JSON.stringify(d)}`);
  return d.data?.token || d.token;
}

(async function run() {
  try {
    const user = await registerResearcher();
    const token = await login(user.email, 'P@ssw0rd!123');

    const res = await fetch(`${BASE}/users/pending-authors`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await json(res);

    if (res.status !== 403) {
      throw new Error(`Expected 403 for non-admin, got ${res.status}: ${JSON.stringify(body)}`);
    }

    console.log('✅ Admin guard works (researcher rejected with 403)');
    process.exit(0);
  } catch (e) {
    console.error('❌ Admin guard test FAILED:', e.message);
    process.exit(1);
  }
})();
