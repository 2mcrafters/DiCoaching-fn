/**
 * End-to-end test suite for likes, comments, proposed modifications, and reports
 * Run with: node backend/test-likes-comments-mods-reports.js
 */

const BASE = 'http://localhost:5000/api';

async function j(res){const t=await res.text();try{return JSON.parse(t)}catch{return {raw:t}}}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function login(email,password){
  const r=await fetch(`${BASE}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
  const d=await j(r); if(!r.ok) throw new Error(`login fail ${r.status}: ${JSON.stringify(d)}`);
  return d.data?.token||d.token;
}

async function register(role='author'){
  const u=Date.now()%1e9; const email=`e2e_${role}_${u}@example.com`; const phone='06'+String(Math.floor(Math.random()*1e8)).padStart(8,'0');
  const body={ email, password:'P@ssw0rd!123', firstName:'E2E', lastName:role, role, sex:'homme', phone, professionalStatus:'Coach / Formateur' };
  const r=await fetch(`${BASE}/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await j(r); if(!r.ok) throw new Error(`register fail ${r.status}: ${JSON.stringify(d)}`);
  return { user:(d.data?.user||d.data), token:(d.data?.token) };
}

async function approve(adminToken, userId){
  const r=await fetch(`${BASE}/users/${userId}/approve-author`,{method:'POST',headers:{Authorization:`Bearer ${adminToken}`}});
  const d=await j(r); if(!r.ok) throw new Error(`approve fail ${r.status}: ${JSON.stringify(d)}`); return d.data;
}

async function createTerm(token){
  const payload={ terme:'E2E '+Math.random().toString(36).slice(2,8), definition:'auto', status:'published' };
  const r=await fetch(`${BASE}/terms`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const d=await j(r); if(!r.ok) throw new Error(`create term fail ${r.status}: ${JSON.stringify(d)}`);
  return d.data;
}

async function toggleLike(token, termId){
  const r=await fetch(`${BASE}/terms/${termId}/likes/toggle`,{method:'POST',headers:{Authorization:`Bearer ${token}`}});
  const d=await j(r); if(!r.ok) throw new Error(`toggle like fail ${r.status}: ${JSON.stringify(d)}`); return d.data;
}

async function getLikes(termId){
  const r=await fetch(`${BASE}/terms/${termId}/likes`);
  const d=await j(r); if(!r.ok) throw new Error(`get likes fail ${r.status}: ${JSON.stringify(d)}`); return d.data;
}

async function postComment(token, termId, content){
  const r=await fetch(`${BASE}/terms/${termId}/comments`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({content})});
  const d=await j(r); if(!r.ok) throw new Error(`post comment fail ${r.status}: ${JSON.stringify(d)}`); return d.data;
}

async function listComments(termId){
  const r=await fetch(`${BASE}/terms/${termId}/comments`);
  const d=await j(r); if(!r.ok) throw new Error(`list comments fail ${r.status}: ${JSON.stringify(d)}`); return d.data;
}

async function deleteComment(token, commentId){
  const r=await fetch(`${BASE}/comments/${commentId}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
  const d=await j(r); if(!r.ok) throw new Error(`delete comment fail ${r.status}: ${JSON.stringify(d)}`); return true;
}

async function proposeModification(token, termId){
  const payload={ term_id: termId, changes: { definition: 'changed by e2e' }, comment: 'please update' };
  const r=await fetch(`${BASE}/modifications`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const d=await j(r); if(!r.ok) throw new Error(`propose modification fail ${r.status}: ${JSON.stringify(d)}`); return d.data;
}

async function listPendingMods(token, scope='mine'){
  const r=await fetch(`${BASE}/modifications/pending-validation?scope=${scope}`,{headers:{Authorization:`Bearer ${token}`}});
  const d=await j(r); if(!r.ok) throw new Error(`list pending mods fail ${r.status}: ${JSON.stringify(d)}`); return d.data;
}

async function updateModification(token, id, status){
  const r=await fetch(`${BASE}/modifications/${id}`,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({status})});
  const d=await j(r); if(!r.ok) throw new Error(`update mod fail ${r.status}: ${JSON.stringify(d)}`); return d.data;
}

async function createReport(token, termId){
  const payload={ term_id: termId, reason: 'inappropriate', details: 'e2e' };
  const r=await fetch(`${BASE}/reports`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const d=await j(r); if(!r.ok) throw new Error(`create report fail ${r.status}: ${JSON.stringify(d)}`); return d.data;
}

async function updateReport(token, id, status){
  const r=await fetch(`${BASE}/reports/${id}`,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({status})});
  const d=await j(r); if(!r.ok) throw new Error(`update report fail ${r.status}: ${JSON.stringify(d)}`); return d.data;
}

(async function run(){
  try {
    // Setup: admin, two authors
    const adminToken = await login(process.env.ADMIN_EMAIL||'admin@dictionnaire.fr', process.env.ADMIN_PASSWORD||'admin123');
    const a1 = await register('author');
    const a2 = await register('author');
    await approve(adminToken, a1.user.id);
    await approve(adminToken, a2.user.id);
    const a1Token = await login(a1.user.email,'P@ssw0rd!123');
    const a2Token = await login(a2.user.email,'P@ssw0rd!123');

    // Author1 creates a term
    const term = await createTerm(a1Token);

    // Likes: a2 likes then unlikes
    const like1 = await toggleLike(a2Token, term.id);
    if (!like1.liked) throw new Error('expected liked=true');
    const likesA = await getLikes(term.id);
    if ((likesA.count||0) < 1) throw new Error('expected likes >= 1');
    const like2 = await toggleLike(a2Token, term.id);
    if (like2.liked) throw new Error('expected liked=false after toggle');

    // Comments: a2 comments, then a1 (author) deletes it
    const commentText = 'Nice term!';
    await postComment(a2Token, term.id, commentText);
    // Find the specific comment by content with small retry in case of read-after-write lag
    let foundCommentId = null;
    for (let i = 0; i < 5 && !foundCommentId; i++) {
      const listed = await listComments(term.id);
      if (!Array.isArray(listed)) throw new Error('comments list returned non-array');
      const found = listed.find(c => (c.content || '').includes(commentText));
      if (found) {
        foundCommentId = found.id;
        break;
      }
      await sleep(100);
    }
    if (!foundCommentId) throw new Error('newly posted comment not found in list');
    await deleteComment(a1Token, foundCommentId);

    // Proposed modifications: a2 proposes; a1 validates (approve)
    const mod = await proposeModification(a2Token, term.id);
    const pendingForA1 = await listPendingMods(a1Token, 'mine');
    const found = pendingForA1.find(m=>Number(m.id)===Number(mod.id));
    if (!found) throw new Error('pending modification not visible to term author');
    const modApproved = await updateModification(a1Token, mod.id, 'approved');

    // Reports: a2 creates report on a1's term; a1 resolves it
    const rep = await createReport(a2Token, term.id);
    const repResolved = await updateReport(a1Token, rep.id, 'resolved');

    console.log('✅ E2E likes/comments/mods/reports PASS');
    process.exit(0);
  } catch (e) {
    console.error('❌ E2E FAILED:', e.message);
    process.exit(1);
  }
})();
