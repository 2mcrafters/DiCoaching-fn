/**
 * Test the pending authors flow
 * 1) Register a new author (pending)
 * 2) Admin lists pending authors
 * 3) Admin approves the author
 * 4) Verify author becomes active
 *
 * Run with: node backend/test-pending-authors.js
 */

const BASE_URL = 'http://localhost:5000/api';

async function json(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function adminLogin() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || 'admin@dictionnaire.fr',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Admin login failed: ${res.status} ${res.statusText} -> ${body}`);
  }
  const data = await res.json();
  return data.data?.token || data.token; // depending on response shape
}

async function registerPendingAuthor() {
  const unique = Math.floor(Math.random() * 1e9);
  const email = `author${unique}@example.com`;
  const payload = {
    email,
    password: 'P@ssw0rd!123',
    firstName: 'Test',
    lastName: 'Author',
    role: 'author',
    sex: 'homme',
    phone: '0600000000',
    professionalStatus: 'Coach / Formateur'
  };
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const body = await json(res);
  if (!res.ok) {
    throw new Error(`Register failed: ${res.status} ${res.statusText} -> ${JSON.stringify(body)}`);
  }
  return { user: body.data?.user || body.data, token: body.data?.token, email };
}

async function listPendingAuthors(adminToken) {
  const res = await fetch(`${BASE_URL}/users/pending-authors`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const body = await json(res);
  if (!res.ok) throw new Error(`List pending failed: ${res.status} -> ${JSON.stringify(body)}`);
  return body.data || [];
}

async function approveAuthor(adminToken, userId) {
  const res = await fetch(`${BASE_URL}/users/${userId}/approve-author`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const body = await json(res);
  if (!res.ok) throw new Error(`Approve failed: ${res.status} -> ${JSON.stringify(body)}`);
  return body.data;
}

async function getUser(userId) {
  const res = await fetch(`${BASE_URL}/users/${userId}`);
  const body = await json(res);
  if (!res.ok) throw new Error(`Get user failed: ${res.status} -> ${JSON.stringify(body)}`);
  return body.data;
}

(async function run() {
  try {
    console.log('🔐 Logging in as admin...');
    const adminToken = await adminLogin();
    console.log('✅ Admin login OK');

    console.log('📝 Registering pending author...');
    const { user } = await registerPendingAuthor();
    console.log('✅ Registered:', user);

    console.log('🕒 Listing pending authors...');
    const pending = await listPendingAuthors(adminToken);
    const found = pending.find(u => u.id === user.id || u.email === user.email);
    if (!found) throw new Error('Newly registered author not found in pending list');
    console.log(`✅ Found pending author ${found.id}`);

    console.log('✅ Approving author...');
    const approved = await approveAuthor(adminToken, found.id);
    if ((approved.status || '').toLowerCase() !== 'active') {
      throw new Error(`Author not active after approval. Got status=${approved.status}`);
    }
    console.log('🎉 Author approved');

    const after = await getUser(found.id);
    console.log('👤 Final user:', after);

    console.log('\n✅ Flow PASS');
    process.exit(0);
  } catch (e) {
    console.error('❌ Flow FAILED:', e.message);
    process.exit(1);
  }
})();
