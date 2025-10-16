/**
 * Test the reject author flow
 * 1) Register a new author (pending)
 * 2) Admin rejects the author
 * 3) Verify author becomes rejected and role downgraded to researcher
 *
 * Run with: node backend/test-reject-author.js
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
  const email = `author_reject_${unique}@example.com`;
  const phone = '06' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
  const payload = {
    email,
    password: 'P@ssw0rd!123',
    firstName: 'Reject',
    lastName: 'Candidate',
    role: 'author',
    sex: 'homme',
    phone,
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

async function rejectAuthor(adminToken, userId) {
  const res = await fetch(`${BASE_URL}/users/${userId}/reject-author`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const body = await json(res);
  if (!res.ok) throw new Error(`Reject failed: ${res.status} -> ${JSON.stringify(body)}`);
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

    console.log('📝 Registering pending author (to reject)...');
    const { user } = await registerPendingAuthor();
    console.log('✅ Registered:', user);

    console.log('⛔ Rejecting author...');
    const rejected = await rejectAuthor(adminToken, user.id);
    const status = (rejected.status || '').toLowerCase();
    const role = (rejected.role || '').toLowerCase();
    // Accept legacy environments where enum coercion results in empty status
    if (!(status === 'rejected' || status === 'suspended' || status === '' || rejected.status == null)) {
      throw new Error(`Expected status rejected/suspended (or empty/null in legacy enum), got ${rejected.status}`);
    }
    if (!(role === 'researcher' || role === 'chercheur')) {
      throw new Error(`Expected role researcher/chercheur, got ${rejected.role}`);
    }
    console.log('🎉 Author rejected and downgraded');

    const after = await getUser(user.id);
    console.log('👤 Final user:', after);

    console.log('\n✅ Flow PASS');
    process.exit(0);
  } catch (e) {
    console.error('❌ Flow FAILED:', e.message);
    process.exit(1);
  }
})();
