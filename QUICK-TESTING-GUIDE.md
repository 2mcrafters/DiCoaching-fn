# Quick Testing Guide - User Notifications & Permissions

**Purpose:** Rapid verification that all users get notifications and have correct permissions  
**Time Required:** ~15 minutes  
**Date:** October 15, 2025

---

## 🎯 Quick Test Matrix

| Test | Chercheur | Author | Admin |
|------|-----------|--------|-------|
| Like a term | ✓ | ✓ | ✓ |
| See liked terms in dashboard | ✓ | ✓ | ✓ |
| Comment on term | ✓ | ✓ | ✓ |
| See comments tab | ❌ | ✓ | ✓ |
| Receive comment notification | N/A | ✓ | ✓ |
| Delete own comment | ✓ | ✓ | ✓ |
| Delete others' comments | ❌ | ✓ (on own terms) | ✓ (any) |
| Create term | ❌ | ✓ | ✓ |
| Edit own term | ❌ | ✓ | ✓ |
| Edit any term | ❌ | ❌ | ✓ |
| Propose modification | ✓ | ✓ | ✓ |
| Validate modification | ❌ | ✓ (not own) | ✓ (any) |
| Report term | ✓ | ✓ | ✓ |
| See report notification | ✓ | ✓ (received) | ✓ |

---

## 🚀 5-Minute Smoke Test

### Setup
1. Start backend: `npm run dev` in `backend/`
2. Start frontend: `npm run dev` in root
3. Have 3 browser profiles ready (or use incognito + regular + different browser)

### Test Sequence

#### Step 1: Chercheur Flow (2 min)
```
1. Register as chercheur → Auto-confirmed
2. Login → Dashboard loads
3. Navigate to any term
4. Click ❤️ (like) → Success toast
5. Click 💬 (comment) → Add "Test comment"
6. Go to dashboard
   ✓ Check: "Termes appréciés" has badge (1)
   ✓ Check: Can see liked term in tab
   ✓ Check: No "Commentaires" tab visible
7. Try to create term → Should fail (no permission)
```

#### Step 2: Author Flow (3 min)
```
1. Register as author → Status "pending"
2. Login as admin → Approve author
3. Login as author → Dashboard loads
4. Create new term "Test Coaching"
5. Publish it
6. Login as chercheur
7. Comment on "Test Coaching" term
8. Login back as author
9. Go to dashboard
   ✓ Check: "Commentaires" stat shows 1
   ✓ Check: Red badge on "Commentaires" tab
   ✓ Check: "Mes termes" shows 1 term
10. Click "Commentaires" tab
   ✓ Check: Comment visible with "Nouveau" badge
   ✓ Check: Badge disappears after click
11. Click "Voir plus" → Navigate to term
   ✓ Check: Scrolls to comment
   ✓ Check: Comment highlighted
```

#### Step 3: Admin Flow (2 min)
```
1. Login as admin
2. Navigate to any term
3. See any comment
   ✓ Check: Trash icon visible on ALL comments
4. Delete a comment → Confirmation
5. Go to dashboard
   ✓ Check: Has "Commentaires" tab (author features)
   ✓ Check: Can access Admin panel
6. Admin panel → Gestion des utilisateurs
   ✓ Check: Can change user roles
7. Try to edit any term
   ✓ Check: Edit button visible on all terms
```

---

## 📊 Dashboard Notification Tests

### Chercheur Notifications
```
Action → Expected Badge Location

Like term → "Termes appréciés" badge +1
Propose modification → "Modifications proposées" badge +1
Report term → "Signalements effectués" badge +1
```

### Author Notifications
```
Action → Expected Badge Location

Receive comment → "Commentaires" badge +1
Like term → "Termes aimés" badge +1
Create term → "Mes termes" badge +1
Receive report → "Signalements" badge +1
```

### Badge Behavior Test
```
1. Perform action (e.g., like term)
2. Go to dashboard
   ✓ Badge appears with count
3. Click tab
   ✓ Badge disappears immediately
4. Switch to another tab
   ✓ Badge stays hidden
5. Refresh page (within 24h)
   ✓ Badge reappears if item still new
6. Wait 24h (or change system time)
   ✓ Badge disappears (item aged out)
```

---

## 🔐 Permission Boundary Tests

### Chercheur Boundaries
```
SHOULD WORK:
✓ View any published term
✓ Like any term
✓ Comment on any term
✓ Report any term
✓ Propose modification on any term
✓ Edit own modification proposal (if pending)
✓ Delete own comments

SHOULD FAIL:
✗ Create new term → No "Nouveau terme" button
✗ Edit any term → No edit button visible
✗ Validate modifications → No validate option
✗ Delete others' comments → No trash icon
✗ Access admin panel → 403 error
```

### Author Boundaries
```
SHOULD WORK:
✓ All chercheur permissions
✓ Create new terms
✓ Edit own terms (author_id matches)
✓ Validate modifications on own terms (not own proposals)
✓ Delete comments on own terms
✓ See "Commentaires" tab in dashboard
✓ Get author badge based on term count

SHOULD FAIL:
✗ Edit other authors' terms → No edit button
✗ Validate own modification proposals → Logic prevents self-approval
✗ Delete comments on other authors' terms → No trash icon
✗ Access admin panel → 403 error
```

### Admin Boundaries
```
SHOULD WORK:
✓ All author permissions
✓ Edit ANY term (not just own)
✓ Delete ANY comment (even on others' terms)
✓ Validate ANY modification
✓ Access admin panel
✓ Manage users (approve, reject, change roles)
✓ Manage categories
✓ View all pending items
✓ Get author badge (treated as author for badges)

SHOULD FAIL:
❌ Nothing - admin has unlimited permissions
```

---

## 🧪 API Endpoint Tests

### Using Browser DevTools Console or Thunder Client/Postman

#### Test 1: Comment on Term (Auth Required)
```javascript
// Should work with valid token
POST /api/terms/1/comments
Headers: { Authorization: 'Bearer <token>' }
Body: { content: "Test comment" }
Expected: 200 OK

// Should fail without token
POST /api/terms/1/comments
Body: { content: "Test comment" }
Expected: 401 Unauthorized
```

#### Test 2: Get Author Comments (Owner or Admin)
```javascript
// Author viewing own comments
GET /api/comments/author/5
Headers: { Authorization: 'Bearer <author_token>' }
Expected: 200 OK + comments array

// Chercheur viewing other's comments
GET /api/comments/author/5
Headers: { Authorization: 'Bearer <chercheur_token>' }
Expected: 403 Forbidden (unless same user)

// Admin viewing anyone's comments
GET /api/comments/author/5
Headers: { Authorization: 'Bearer <admin_token>' }
Expected: 200 OK + comments array
```

#### Test 3: Delete Comment (Owner or Admin)
```javascript
// Owner deleting own comment
DELETE /api/comments/10
Headers: { Authorization: 'Bearer <owner_token>' }
Expected: 200 OK

// Admin deleting anyone's comment
DELETE /api/comments/10
Headers: { Authorization: 'Bearer <admin_token>' }
Expected: 200 OK

// Other user deleting someone else's comment
DELETE /api/comments/10
Headers: { Authorization: 'Bearer <other_token>' }
Expected: 403 Forbidden
```

#### Test 4: Toggle Like (Auth Required)
```javascript
// First toggle (like)
POST /api/terms/1/likes/toggle
Headers: { Authorization: 'Bearer <token>' }
Expected: 200 OK + { liked: true, count: 1 }

// Second toggle (unlike)
POST /api/terms/1/likes/toggle
Headers: { Authorization: 'Bearer <token>' }
Expected: 200 OK + { liked: false, count: 0 }
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Badge Shows 0 Despite Having Items
**Symptom:** Dashboard shows 0 badge but user has comments/likes  
**Cause:** Items are older than 24 hours  
**Solution:** This is expected behavior - badges only show NEW items

**Verify:**
```sql
-- Check comment dates
SELECT id, created_at, 
  TIMESTAMPDIFF(HOUR, created_at, NOW()) as hours_old
FROM comments 
WHERE term_id IN (SELECT id FROM termes WHERE author_id = 5)
ORDER BY created_at DESC;

-- If hours_old > 24, badge won't show
```

### Issue 2: Comments Tab Not Visible
**Symptom:** Chercheur doesn't see "Commentaires" tab  
**Cause:** Only authors and admins have this tab  
**Solution:** This is correct - chercheurs don't receive comments on terms

**Verify:**
```javascript
// Check role in Dashboard.jsx
console.log('User role:', user?.role);
console.log('Is Author:', isAuthor);
console.log('Has author permissions:', hasAuthorPermissions());
// Should be false for chercheur
```

### Issue 3: Badge Reappears After Clicking
**Symptom:** Badge disappears on click but reappears on refresh  
**Cause:** Item still within 24h window  
**Solution:** This is expected - badge shows until item ages out

**Verify:**
```javascript
// In Dashboard.jsx, check calculation
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
const isNew = new Date(item.createdAt) > oneDayAgo;
console.log('Item date:', item.createdAt);
console.log('24h ago:', oneDayAgo);
console.log('Is new:', isNew);
```

### Issue 4: 403 Forbidden on API Call
**Symptom:** API returns 403 error  
**Cause:** User doesn't have permission for that action  
**Solution:** Check user role matches required permission

**Debug:**
```javascript
// Backend: Add logging to authenticateToken middleware
console.log('User:', req.user);
console.log('Role:', req.user?.role);
console.log('Required role:', ['admin', 'author']);

// Frontend: Check AuthContext
import { useAuth } from '@/contexts/AuthContext';
const { user } = useAuth();
console.log('Current user:', user);
```

### Issue 5: Cannot Delete Comment
**Symptom:** Trash icon not visible or delete fails  
**Cause:** User is not comment owner or admin  
**Solution:** Verify ownership

**Check:**
```javascript
// In FicheComments.jsx
const isOwner = String(comment.authorId) === String(user?.id);
const isAdmin = user?.role === 'admin';
const canDelete = isOwner || isAdmin;
console.log('Comment author:', comment.authorId);
console.log('Current user:', user?.id);
console.log('Can delete:', canDelete);
```

---

## 📝 Test Report Template

```markdown
# Test Run Report

**Date:** [Date]  
**Tester:** [Name]  
**Environment:** Dev / Staging / Production  

## Test Results

### Chercheur Tests
- [ ] Registration successful
- [ ] Like term → Badge appears
- [ ] Comment on term → Comment saved
- [ ] Dashboard shows correct tabs
- [ ] Cannot create term (verified)
- [ ] Cannot access admin panel (verified)

### Author Tests
- [ ] Registration + approval flow
- [ ] Create term successful
- [ ] Receive comment notification
- [ ] Comments tab visible with badge
- [ ] Can edit own terms
- [ ] Cannot edit others' terms (verified)
- [ ] Author badge displays correctly

### Admin Tests
- [ ] Can edit any term
- [ ] Can delete any comment
- [ ] Admin panel accessible
- [ ] User management works
- [ ] Gets author badge
- [ ] All notifications working

### Notification Tests
- [ ] Badge appears after action
- [ ] Badge disappears on tab click
- [ ] Badge reappears on refresh (if <24h)
- [ ] "Nouveau" label shows correctly
- [ ] Highlighted background on new items

## Issues Found
[List any problems discovered]

## Notes
[Additional observations]
```

---

## 🎓 Training Script for New Users

### For Chercheurs
"Welcome! As a chercheur, you can:
1. Browse all published terms
2. Like terms you find useful → See them in your dashboard
3. Comment and discuss with authors
4. Propose modifications to improve definitions
5. Report incorrect or inappropriate content

You'll see notifications in your dashboard for:
- Terms you recently liked (last 24 hours)
- Modification proposals you submitted
- Reports you created"

### For Authors
"Welcome! As an author, you can:
1. Everything chercheurs can do, PLUS:
2. Create new terms in your area of expertise
3. Edit your published terms
4. Validate modification proposals on your terms
5. Delete inappropriate comments on your terms

You'll receive notifications for:
- New comments on your terms
- Reports against your terms
- Terms you've liked
- Terms you've created recently

Click the 'Commentaires' tab to see who's engaging with your work!"

### For Admins
"Welcome! As an admin, you have full control:
1. Everything authors can do, PLUS:
2. Edit ANY term (not just your own)
3. Delete ANY comment
4. Validate ANY modification
5. Approve/reject author applications
6. Manage users and categories

You have access to the Admin Panel where you can:
- Approve pending authors
- Review all modifications
- Handle reported content
- Manage system settings"

---

## ✅ Success Criteria

### All Tests Pass When:
✅ All roles can login and see appropriate dashboard  
✅ Notifications appear within 5 seconds of action  
✅ Badge counts match actual data  
✅ Clicking tab clears badge immediately  
✅ Permission checks prevent unauthorized actions  
✅ API returns 401/403 for invalid/insufficient auth  
✅ Comment navigation scrolls to correct position  
✅ No console errors during normal operations  
✅ All CRUD operations work for authorized users  
✅ No data leaks between users  

---

**Last Updated:** October 15, 2025  
**Version:** 1.0  
**Status:** Ready for Testing ✅
