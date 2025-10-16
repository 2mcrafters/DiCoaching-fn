/**
 * Test terms creation permissions for authors
 * - Pending author cannot create a term (403)
 * - After admin approval, author can create a term using the same token (201)
 *
 * Run with: node backend/test-terms-permissions.js
 */

const BASE = 'http://localhost:5000/api';

async function json(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
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

async function registerAuthor() {
  const unique = Date.now() % 1e9;
  const email = `terms_perm_${unique}@example.com`;
  const phone = '06' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
  const r = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'P@ssw0rd!123',
      firstName: 'Terms',
      lastName: 'Tester',
      role: 'author',
      sex: 'homme',
      phone,
      professionalStatus: 'Coach / Formateur'
    })
  });
  const d = await json(r);
  if (!r.ok) throw new Error(`register fail ${JSON.stringify(d)}`);
  return d.data?.user || d.data;
}

async function approveAuthor(adminToken, id) {
  const r = await fetch(`${BASE}/users/${id}/approve-author`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const d = await json(r);
  if (!r.ok) throw new Error(`approve fail ${JSON.stringify(d)}`);
  return d.data;
}

async function createTerm(token) {
  const payload = {
    terme: 'TERM ' + Math.random().toString(36).slice(2, 8),
    definition: 'Auto generated definition.',
  };
  const r = await fetch(`${BASE}/terms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const d = await json(r);
  return { status: r.status, body: d };
}

(async function run() {
  try {
    const adminToken = await login(process.env.ADMIN_EMAIL || 'admin@dictionnaire.fr', process.env.ADMIN_PASSWORD || 'admin123');

    const user = await registerAuthor();
    const authorToken = await login(user.email, 'P@ssw0rd!123');

    const before = await createTerm(authorToken);
    if (before.status !== 403) {
      throw new Error(`Expected 403 for pending author, got ${before.status}: ${JSON.stringify(before.body)}`);
    }

    await approveAuthor(adminToken, user.id);

    const after = await createTerm(authorToken);
    if (after.status !== 201 && after.status !== 200) {
      throw new Error(`Expected 201/200 after approval, got ${after.status}: ${JSON.stringify(after.body)}`);
    }

    console.log('✅ Terms permission flow PASS');
    process.exit(0);
  } catch (e) {
    console.error('❌ Terms permission flow FAILED:', e.message);
    process.exit(1);
  }
})();
