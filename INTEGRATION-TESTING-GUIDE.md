# Integration Testing Guide
## Backend-Frontend Role & Permission Alignment

**Test Date:** October 14, 2025  
**Status:** Ready for Testing

---

## Test Environment Setup

1. **Start Backend:**
   ```powershell
   cd backend
   npm start
   ```

2. **Start Frontend:**
   ```powershell
   cd ..
   npm run dev
   ```

3. **Database Status:**
   - Ensure MySQL is running
   - Users table has both 'author' and 'auteur' roles
   - Status enum includes: pending, confirmed, active, rejected, suspended

---

## Test Suite 1: Role Normalization

### Test 1.1: Author Registration
**Steps:**
1. Navigate to `/register`
2. Fill in form with role "Auteur"
3. Submit registration

**Expected:**
- ✅ Backend receives role as "auteur"
- ✅ User created with status "pending"
- ✅ Frontend normalizes role to "author" in AuthContext
- ✅ Popup shows "Candidature envoyée"
- ✅ Redirects to dashboard after popup close

**Verify:**
```javascript
// Check localStorage
JSON.parse(localStorage.getItem('user')).role // Should be "author"

// Check backend database
SELECT role, status FROM users WHERE email = 'test@example.com';
// Should return: role = 'auteur', status = 'pending'
```

### Test 1.2: Pending Author Visibility
**Steps:**
1. Login as admin
2. Navigate to `/admin`
3. Check "Auteurs en attente" section

**Expected:**
- ✅ Pending authors count shows in stats
- ✅ Pending author card appears in list
- ✅ Card shows firstname, lastname, email, documents
- ✅ "Approuver" and "Rejeter" buttons visible

**Verify:**
```javascript
// Admin dashboard should fetch:
GET /api/stats
// Response includes: pendingUsers: 1 (or more)

// PendingAuthors component filters:
users.filter(u => 
  ["author", "auteur"].includes(u.role?.toLowerCase()) && 
  u.status === "pending"
)
```

### Test 1.3: Author Approval
**Steps:**
1. As admin, click "Approuver" on pending author
2. Confirm approval

**Expected:**
- ✅ PUT request to `/api/users/:id` with `{ status: "active" }`
- ✅ If "active" fails, fallback to "confirmed"
- ✅ Toast notification: "Auteur approuvé"
- ✅ Author disappears from pending list
- ✅ Author role remains unchanged (still "auteur" in DB)

**Verify:**
```sql
SELECT role, status FROM users WHERE id = :authorId;
-- Should return: role = 'auteur', status = 'active' (or 'confirmed')
```

---

## Test Suite 2: Permission Checks

### Test 2.1: Submit Page Access
**Steps:**
1. Login as pending author (status: pending)
2. Try to access `/submit`

**Expected:**
- ✅ ProtectedRoute checks roles: ["admin", "author"]
- ✅ User has role "author" (normalized) but status "pending"
- ✅ Page loads (route guard passes)
- ✅ Submit button shows "Publier directement" or "Sauvegarder en brouillon"

**Test Publish Gating:**
```javascript
// In Submit.jsx:
const canPublishDirectly = 
  (typeof hasAuthorPermissions === "function" && hasAuthorPermissions()) ||
  user.role === "admin";

// For pending author:
hasAuthorPermissions() // Returns false (status not confirmed/active)
canPublishDirectly // false

// Click "Publier directement"
// Term status should be "published" only if canPublishDirectly = true
// Otherwise, status = "draft" or "pending"
```

### Test 2.2: Approved Author Permissions
**Steps:**
1. Admin approves the author (status → active)
2. Author logs out and logs back in
3. Navigate to `/submit`

**Expected:**
- ✅ hasAuthorPermissions() returns true
- ✅ "Publier directement" publishes term with status "published"
- ✅ Navbar shows "Contribuer" link
- ✅ Can edit own terms
- ✅ Can delete own comments
- ✅ Can see pending modifications (if any)

**Verify:**
```javascript
// Check hasAuthorPermissions logic:
user.role === "author" // true
user.status === "active" || user.status === "confirmed" // true
hasAuthorPermissions() // true
```

### Test 2.3: Modifications Page
**Steps:**
1. Login as approved author
2. Navigate to `/modifications`

**Expected:**
- ✅ Page title: "Modifications en attente"
- ✅ Shows all pending modifications (not just own)
- ✅ Can view modification details
- ✅ Can approve/reject modifications (if author or admin)

**Verify:**
```javascript
const isModeratorOrAuthor = 
  (typeof hasAuthorPermissions === "function" && hasAuthorPermissions()) ||
  user.role === "admin";
// Should be true for approved author
```

---

## Test Suite 3: Error Handling

### Test 3.1: Registration Errors
**Steps:**
1. Try to register with existing email
2. Try to register with missing required fields
3. Try to register with invalid file (>10MB)

**Expected:**
- ✅ Backend returns 409 for duplicate email
- ✅ Backend returns 400 for missing fields
- ✅ Backend returns 413 or validation error for large file
- ✅ Frontend displays error toast with message
- ✅ Inline field errors show in red under inputs
- ✅ Error dialog shows with list of issues

**Verify:**
```javascript
// authService.register catches errors:
if (!response.ok) {
  let fields = extractFieldErrors(data);
  return { success: false, error: { message, fields } };
}

// Register.jsx displays errors:
setServerErrors(err.fields);
setErrorDialogItems([...]);
setShowErrorDialog(true);
```

### Test 3.2: Session Expiration
**Steps:**
1. Login as user
2. Manually expire token (delete from localStorage or wait 24h)
3. Try to access protected route or make API call

**Expected:**
- ✅ API detects 401/403 response
- ✅ authService.logout() called
- ✅ Redirect to `/login`
- ✅ Toast: "Session expirée"

**Verify:**
```javascript
// In api.js request():
if (response.status === 401 || response.status === 403) {
  authService.logout();
  window.location.href = "/login";
  throw new Error("Session expirée");
}
```

### Test 3.3: Network Errors
**Steps:**
1. Stop backend server
2. Try to login or fetch data

**Expected:**
- ✅ Fetch throws network error
- ✅ authService catches and returns `{ success: false, error: 'Erreur réseau' }`
- ✅ Toast displays: "Erreur réseau"
- ✅ No unhandled promise rejection

**Verify:**
```javascript
catch (error) {
  console.error('Erreur lors de la connexion:', error);
  return { success: false, error: 'Erreur réseau' };
}
```

---

## Test Suite 4: Social Links & Documents

### Test 4.1: Social Links Edit
**Steps:**
1. Login as any user (chercheur or author)
2. Navigate to `/profile`
3. Scroll to "Liens Sociaux" section
4. Enter URLs for Facebook, Instagram, LinkedIn, X
5. Add custom network (e.g., "GitHub")
6. Save profile

**Expected:**
- ✅ All users see social links section
- ✅ Fixed networks show with icons
- ✅ Custom networks can be added
- ✅ URLs are normalized (http:// prefix if missing)
- ✅ Duplicates are removed
- ✅ PATCH request to `/api/users/:id/profile` with socials JSON
- ✅ Backend saves socials as JSON string
- ✅ Toast: "Profil mis à jour avec succès"

**Verify:**
```sql
SELECT socials FROM users WHERE id = :userId;
-- Should return JSON string like:
-- '[{"network":"Facebook","url":"https://facebook.com/user"},...]'
```

### Test 4.2: Documents Upload
**Steps:**
1. Login as user
2. Navigate to `/profile`
3. Click "Ajouter un document"
4. Select PDF or image file (<10MB)
5. Enter title
6. Save

**Expected:**
- ✅ File uploads to `backend/uploads/documents/`
- ✅ Record inserted into `user_documents` table
- ✅ Document appears in profile grid
- ✅ Can preview (PDF/images) or download
- ✅ Can delete document

**Verify:**
```sql
SELECT * FROM user_documents WHERE user_id = :userId;
-- Should show filename, original_filename, file_path, mime_type, etc.
```

### Test 4.3: Admin User Details
**Steps:**
1. Login as admin
2. Navigate to `/admin`
3. Go to "Utilisateurs" tab
4. Click on any user to open details dialog

**Expected:**
- ✅ Dialog shows full user info
- ✅ Social links displayed with icons
- ✅ Documents listed with preview/download
- ✅ Status badge shows (pending/active/etc.)
- ✅ Role badge shows (Auteur/Chercheur/Admin)

---

## Test Suite 5: Edge Cases

### Test 5.1: Mixed Role Data
**Scenario:** Database has mix of 'auteur' and 'author' roles

**Steps:**
1. Create user A with role 'auteur' directly in DB
2. Create user B with role 'author' via frontend
3. Admin views `/admin/users`

**Expected:**
- ✅ Both users appear in list
- ✅ Both show role badge "Auteur"
- ✅ Filter "Auteurs" includes both
- ✅ Stats count includes both

**Verify:**
```javascript
// UsersManagement role filter:
roleFilter === "author" && user.role === "author" // matches

// Backend stats query:
WHERE role IN ('auteur', 'author') // includes both
```

### Test 5.2: Status Transition
**Scenario:** Test all status transitions

**Steps:**
1. Create author with status 'pending'
2. Admin approves → status 'active'
3. Admin suspends → status 'suspended'
4. Admin reactivates → status 'active'

**Expected:**
- ✅ Each transition updates DB
- ✅ hasAuthorPermissions() respects status
- ✅ Suspended users cannot publish
- ✅ Reactivated users regain permissions

### Test 5.3: Concurrent Approval
**Scenario:** Two admins approve same author simultaneously

**Steps:**
1. Open two admin sessions
2. Both see same pending author
3. Both click "Approuver" at same time

**Expected:**
- ✅ First request succeeds
- ✅ Second request either succeeds (idempotent) or returns 404/409
- ✅ No duplicate notifications
- ✅ List refreshes correctly

---

## Test Suite 6: Browser Compatibility

### Test 6.1: Chrome/Edge
- ✅ All features work
- ✅ File uploads work
- ✅ Toasts display correctly

### Test 6.2: Firefox
- ✅ All features work
- ⚠️ Meta tag warning (non-blocking)

### Test 6.3: Safari
- ✅ All features work
- ✅ Date pickers work

---

## Automated Test Commands

```powershell
# Run frontend build test
npm run build

# Check for TypeScript errors (if applicable)
npm run type-check

# Run linter
npm run lint

# Check backend health
curl http://localhost:5000/health

# Test database connection
curl http://localhost:5000/api/test-db

# Get stats
curl -X GET http://localhost:5000/api/stats
```

---

## Test Results Template

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Author Registration | ⬜ | |
| 1.2 | Pending Author Visibility | ⬜ | |
| 1.3 | Author Approval | ⬜ | |
| 2.1 | Submit Page Access | ⬜ | |
| 2.2 | Approved Author Permissions | ⬜ | |
| 2.3 | Modifications Page | ⬜ | |
| 3.1 | Registration Errors | ⬜ | |
| 3.2 | Session Expiration | ⬜ | |
| 3.3 | Network Errors | ⬜ | |
| 4.1 | Social Links Edit | ⬜ | |
| 4.2 | Documents Upload | ⬜ | |
| 4.3 | Admin User Details | ⬜ | |
| 5.1 | Mixed Role Data | ⬜ | |
| 5.2 | Status Transition | ⬜ | |
| 5.3 | Concurrent Approval | ⬜ | |

Legend: ⬜ Not tested | ✅ Passed | ❌ Failed | ⚠️ Warning

---

## Sign-off

**Tested by:** _______________  
**Date:** _______________  
**Environment:** [ ] Development [ ] Staging [ ] Production  
**Overall Status:** [ ] Pass [ ] Fail [ ] Partial  

**Notes:**
