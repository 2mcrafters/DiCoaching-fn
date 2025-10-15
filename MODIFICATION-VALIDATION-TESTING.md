# 🧪 Modification Validation Testing Guide

## Quick Test Steps

### 1. Test Author Can Validate Other User's Proposal ✅

**Setup:**
1. Login as **Author A**
2. Create a term (e.g., "Coaching")
3. Logout

4. Login as **Chercheur B** (or another user)
5. Go to the term created by Author A
6. Click "Proposer une modification"
7. Make changes and submit
8. Logout

9. Login back as **Author A**
10. Go to Dashboard → "À valider" tab

**Expected Result:**
- ✅ Modification appears in the list
- ✅ Shows proposer name (Chercheur B)
- ✅ "Approuver" and "Rejeter" buttons are visible
- ✅ Click "Approuver" → Confirmation dialog appears
- ✅ Confirm → Modification is approved
- ✅ Success toast appears
- ✅ Modification removed from pending list

---

### 2. Test Author CANNOT Validate Own Proposal ❌

**Setup:**
1. Login as **Author A**
2. Find a term created by **Author B**
3. Click "Proposer une modification"
4. Make changes and submit
5. Try to access the validation endpoint manually (via browser dev tools or API client)

**API Test:**
```javascript
PUT /api/modifications/:id
Authorization: Bearer <author_a_token>
Body: { "status": "approved" }
```

**Expected Result:**
- ❌ Returns 403 Forbidden
- ❌ Error message: "Vous ne pouvez pas valider votre propre proposition de modification"
- ❌ Modification stays in "pending" status

**Dashboard Test:**
- ✅ Author A's own proposal does NOT appear in "À valider" tab
- ✅ Only proposals from OTHER users appear

---

### 3. Test Admin Can Validate Any Modification ✅

**Setup:**
1. Login as **Admin**
2. Go to Dashboard → "À valider" tab

**Expected Result:**
- ✅ All pending modifications appear (regardless of term author)
- ✅ Can approve/reject any modification
- ✅ No restrictions apply

---

### 4. Test Notification Badges Work ✅

**Setup:**
1. Create a new modification proposal (< 24 hours old)
2. Login as the term author
3. Open Dashboard

**Expected Result:**
- ✅ "À valider" tab shows a blue badge with count
- ✅ Modification row has "Nouveau" badge (blue)
- ✅ Click on tab → badge disappears
- ✅ Refresh page → badge stays hidden (viewed tabs tracked)

---

### 5. Test Empty State ✅

**Setup:**
1. Login as author with NO pending modifications
2. Go to Dashboard → "À valider" tab

**Expected Result:**
- ✅ Shows empty state message:
  > "Aucune modification en attente de validation pour le moment."

---

### 6. Test Pagination ✅

**Setup:**
1. Create 10+ modification proposals on author's terms
2. Login as the author
3. Go to Dashboard → "À valider" tab

**Expected Result:**
- ✅ Shows 5 modifications per page
- ✅ Pagination controls appear
- ✅ Can navigate between pages
- ✅ Current page highlighted

---

## API Endpoint Tests

### Test 1: GET /api/modifications/pending-validation

**Request:**
```http
GET /api/modifications/pending-validation
Authorization: Bearer <author_token>
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "term_id": 100,
      "term_title": "Coaching",
      "term_slug": "coaching",
      "term_author_id": 10,
      "proposer_id": 20,
      "proposer_firstname": "Jean",
      "proposer_lastname": "Dupont",
      "status": "pending",
      "created_at": "2025-10-15T10:00:00Z"
    }
  ]
}
```

**Test Cases:**
- ✅ Returns only modifications on author's terms
- ✅ Excludes author's own proposals
- ✅ Only returns "pending" status
- ✅ Returns 403 for chercheur role

---

### Test 2: PUT /api/modifications/:id (Approve)

**Request:**
```http
PUT /api/modifications/123
Authorization: Bearer <author_token>
Content-Type: application/json

{
  "status": "approved"
}
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Modification mise a jour avec succes",
  "data": {
    "id": 123,
    "status": "approved",
    "reviewer_id": 10,
    "reviewed_at": "2025-10-15T12:00:00Z"
  }
}
```

**Test Cases:**
- ✅ Author can approve modification on their term
- ❌ Author CANNOT approve their own proposal (403)
- ❌ Author CANNOT approve modification on other's term (403)
- ✅ Admin can approve any modification

---

### Test 3: PUT /api/modifications/:id (Self-Approval Prevention)

**Request:**
```http
PUT /api/modifications/456
Authorization: Bearer <author_token>
Content-Type: application/json

{
  "status": "approved"
}
```

**Scenario:** Author tries to approve their own proposal

**Expected Response (403 Forbidden):**
```json
{
  "status": "error",
  "message": "Vous ne pouvez pas valider votre propre proposition de modification"
}
```

---

## Browser Console Tests

### Test Pending Validation Fetch

Open browser console on Dashboard page:

```javascript
// Should show pending modifications
const response = await fetch('/api/modifications/pending-validation', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
const data = await response.json();
console.log('Pending validations:', data);
```

**Expected:**
- ✅ Returns modifications array
- ✅ All modifications have `term_author_id === current_user_id`
- ✅ All modifications have `proposer_id !== current_user_id`

---

### Test Validation API Call

```javascript
// Try to approve a modification
const response = await fetch('/api/modifications/123', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ status: 'approved' })
});
const result = await response.json();
console.log('Validation result:', result);
```

**Expected:**
- ✅ Returns success for valid validation
- ❌ Returns 403 for self-approval attempt

---

## UI Tests

### Visual Checks

1. **"À valider" Tab**
   - ✅ Appears between "Commentaires" and "Termes aimés"
   - ✅ Shows blue badge with count (if new modifications exist)
   - ✅ Badge disappears after clicking tab

2. **Modification Table**
   - ✅ Shows term name with link
   - ✅ Shows proposer name
   - ✅ Shows submission date
   - ✅ Shows "Nouveau" badge for recent modifications
   - ✅ "Approuver" button is green
   - ✅ "Rejeter" button is red

3. **Confirmation Dialog**
   - ✅ Appears when clicking "Approuver" or "Rejeter"
   - ✅ Shows clear action description
   - ✅ Has "Confirmer" and "Annuler" buttons

4. **Toast Notifications**
   - ✅ Shows success message after approval
   - ✅ Shows success message after rejection
   - ✅ Shows error message if API fails

5. **Empty State**
   - ✅ Shows friendly message when no modifications pending

---

## Database Verification

### Check Modification Status

```sql
-- View pending modifications with term author info
SELECT m.id, m.term_id, m.proposer_id, m.status,
       t.term, t.author_id as term_author_id,
       u.firstname as proposer_firstname, u.lastname as proposer_lastname
FROM proposed_modifications m
LEFT JOIN terms t ON m.term_id = t.id
LEFT JOIN users u ON m.proposer_id = u.id
WHERE m.status = 'pending';
```

### Check Reviewer Information

```sql
-- View approved modifications with reviewer info
SELECT m.id, m.status, m.reviewer_id, m.reviewed_at,
       r.firstname as reviewer_firstname, r.lastname as reviewer_lastname
FROM proposed_modifications m
LEFT JOIN users r ON m.reviewer_id = r.id
WHERE m.status IN ('approved', 'rejected')
ORDER BY m.reviewed_at DESC;
```

---

## Performance Tests

### Load Test Dashboard

1. Create 100+ pending modifications
2. Login as author
3. Open Dashboard → "À valider" tab

**Expected:**
- ✅ Loads within 2 seconds
- ✅ Pagination prevents performance issues
- ✅ Only 5 items rendered at once

---

## Security Tests

### Test 1: Unauthorized Access

**Attempt:** Access endpoint without authentication

```http
GET /api/modifications/pending-validation
```

**Expected:** 401 Unauthorized

---

### Test 2: Chercheur Access Attempt

**Attempt:** Chercheur tries to access validation endpoint

```http
GET /api/modifications/pending-validation
Authorization: Bearer <chercheur_token>
```

**Expected:** 403 Forbidden

---

### Test 3: Cross-Author Validation Attempt

**Attempt:** Author A tries to validate modification on Author B's term

```http
PUT /api/modifications/789
Authorization: Bearer <author_a_token>
Body: { "status": "approved" }
```

**Expected:** 403 Forbidden

---

## Regression Tests

### Ensure Existing Features Still Work

1. ✅ Chercheurs can still propose modifications
2. ✅ Admins can still validate any modification
3. ✅ Authors can still edit their own terms
4. ✅ Modification creation still works
5. ✅ Dashboard other tabs still work (Commentaires, Termes aimés, etc.)

---

## Success Criteria

All tests must pass for deployment:

- [ ] Authors can validate modifications on their terms
- [ ] Authors CANNOT validate their own proposals
- [ ] Authors CANNOT validate other authors' terms
- [ ] Admins can validate anything
- [ ] Notification badges work correctly
- [ ] Pagination works correctly
- [ ] Empty state displays correctly
- [ ] API returns correct data
- [ ] Security checks enforce business rules
- [ ] No console errors
- [ ] No TypeScript/ESLint errors
- [ ] All existing features still work

---

**Testing Status:** Ready for Testing  
**Last Updated:** October 15, 2025
