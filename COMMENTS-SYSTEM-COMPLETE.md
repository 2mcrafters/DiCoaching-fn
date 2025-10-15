# Comments System - Complete Flow Documentation

## Current Status (October 15, 2025)

### Database Structure
**Table: `comments` (in `dictionnaire_ch` database)**
- id: INT PRIMARY KEY
- term_id: INT (links to termes.id)
- user_id: INT (comment author)
- content: TEXT
- parent_id: INT NULL (for replies, references parent comment id)
- created_at: TIMESTAMP

**Your current data for term_id=2:**
- Row 15: "test1" (parent_id=NULL, user_id=1) ← Top-level comment
- Row 16: "02" (parent_id=15, user_id=1) ← Reply to comment 15
- Row 17: "01" (parent_id=NULL, user_id=1) ← Top-level comment

---

## Backend Endpoints (Fixed & Working)

### 1. GET /api/terms/:termId/comments
**File:** `backend/routes/comments.js`

**What it does:**
- Fetches all comments for a specific term
- Returns parent comments AND replies with parentId
- Handles both `comments` and `commentaires` tables via UNION
- Gracefully handles missing tables or users join failures

**Response format:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 15,
      "termId": 2,
      "authorId": 1,
      "content": "test1",
      "parentId": null,
      "createdAt": "2025-10-15T00:02:57.000Z",
      "author": {
        "id": 1,
        "firstname": "...",
        "lastname": "...",
        "sex": null,
        "role": null,
        "profile_picture": null
      },
      "authorName": "User Name"
    },
    {
      "id": 16,
      "termId": 2,
      "authorId": 1,
      "content": "02",
      "parentId": 15,
      "createdAt": "2025-10-15T00:03:03.000Z",
      ...
    }
  ]
}
```

**Recent fixes:**
✅ Checks table existence before querying
✅ Falls back when users table/columns missing
✅ Returns empty array instead of 500 when no data
✅ Includes parentId for proper nesting

---

### 2. POST /api/terms/:termId/comments
**File:** `backend/routes/comments.js`

**What it does:**
- Creates new comment or reply
- Requires authentication (JWT)
- Inserts into `comments` table (falls back to `commentaires`)
- Returns the created comment with all metadata

**Request body:**
```json
{
  "content": "My comment text",
  "parentId": 15  // Optional: omit for top-level, include for reply
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 18,
    "termId": 2,
    "authorId": 1,
    "content": "My comment text",
    "parentId": 15,
    "createdAt": "2025-10-15T...",
    "author": {...},
    "authorName": "..."
  }
}
```

---

### 3. DELETE /api/comments/:id
**Who can delete:**
- Comment author
- Admin
- Term author

**What it does:**
- Deletes the comment
- Also deletes all replies (cascade via parent_id)
- Works across both tables

---

## Frontend Flow

### File: `src/pages/Fiche.jsx`

**On page load:**
1. Finds term by slug from Redux
2. Calls `apiService.getComments(term.id)`
3. Sets `comments` state
4. Renders `<FicheComments />` component

**When user adds comment:**
1. User types in textarea, clicks "Publier"
2. Calls `handleCommentSubmit(content)`
3. Calls `apiService.addComment(term.id, content)`
4. Backend inserts into DB and returns new comment
5. Calls `loadData()` to refresh comments list
6. Shows success toast
7. Comments list updates with new item

**When user adds reply:**
1. User clicks "Répondre" button on a comment
2. Reply editor appears inline
3. User types reply, clicks "Envoyer"
4. Calls `handleReplySubmit(parentId, content)`
5. Calls `apiService.addReply(term.id, parentId, content)`
6. Backend inserts with parent_id set
7. Calls `loadData()` to refresh
8. Reply appears nested under parent comment

---

### File: `src/components/fiche/FicheComments.jsx`

**Rendering logic:**
1. Splits comments into parents (parentId=null) and replies
2. Groups replies by parentId into a Map
3. For each parent comment:
   - Renders parent card with content, author, date
   - Shows "Répondre" button
   - If replies exist, renders them indented inside parent card
4. Each reply shows:
   - Smaller avatar, lighter background
   - Nested inside parent's border
   - Own delete button (if authorized)

**Key feature: Nesting**
```jsx
const parents = comments.filter(c => c.parentId === null);
const repliesByParent = new Map();
comments.forEach(c => {
  if (c.parentId) {
    repliesByParent.set(String(c.parentId), [..., c]);
  }
});

// Later:
const replies = repliesByParent.get(String(comment.id)) || [];
```

---

## Dashboard Integration

### File: `backend/routes/dashboard.js`

**GET /api/dashboard/stats** (Fixed)

Counts comments from BOTH tables:
```javascript
// Comments made by user
let madeEN = 0, madeFR = 0;
const [rowEN] = await db.query('SELECT COUNT(*) FROM comments WHERE user_id = ?', [userId]);
madeEN = Number(rowEN.count || 0);
const [rowFR] = await db.query('SELECT COUNT(*) FROM commentaires WHERE author_id = ?', [userId]);
madeFR = Number(rowFR.count || 0);
stats.comments.made = madeEN + madeFR;

// Comments received on user's terms
// Similar union logic for received count
```

**Response includes:**
```json
{
  "comments": {
    "made": 5,      // Comments user posted
    "received": 12  // Comments on user's terms
  },
  "terms": {
    "total": 8,
    "byStatus": {...}
  },
  "likes": {...},
  ...
}
```

---

## How to Test the Complete Flow

### 1. Start Backend
```powershell
cd backend
npm run dev
```
Wait for: `🚀 Server listening on port 5000`

### 2. Test API Directly
```powershell
# Get comments for term 2
Invoke-RestMethod 'http://localhost:5000/api/terms/2/comments'

# Should return 3 comments (15, 16, 17) with parentId fields
```

### 3. Test in Browser
1. Open fiche page for the term with id=2
2. Should see: **"Commentaires (3)"**
3. Comment "test1" should have reply "02" nested inside
4. Comment "01" should be separate

### 4. Add New Comment
1. Log in as user
2. Type in comment textarea
3. Click "Publier"
4. Should see success toast
5. Comment appears immediately in list
6. Count updates to "Commentaires (4)"

### 5. Add Reply
1. Click "Répondre" on any comment
2. Type reply text
3. Click "Envoyer"
4. Reply appears INSIDE parent comment card (indented, lighter background)
5. Count includes replies: "Commentaires (5)"

### 6. Check Dashboard
1. Go to dashboard
2. Navigate to your profile stats
3. "Commentaires" section shows:
   - Comments made: X
   - Comments received: Y
4. Numbers include both tables (comments + commentaires)

---

## Common Issues & Solutions

### Issue: Comments show 0 but DB has data
**Cause:** Backend not started or wrong DB
**Fix:** 
- Start backend with `npm run dev`
- Check console for: `db=dictionnaire_ch`
- If wrong DB, set `DB_NAME` in `backend/.env`

### Issue: 500 error when fetching comments
**Cause:** Missing table or column
**Fix:** Already handled in code - should return [] instead
- If still 500, check backend console for error
- May need to run: `ALTER TABLE comments ADD COLUMN parent_id INT NULL`

### Issue: New comment doesn't appear
**Cause:** Frontend not refreshing or backend insert failed
**Check:**
1. Browser network tab: POST succeeded? Returns 201?
2. Response includes new comment with id?
3. GET after POST returns updated list?
4. Frontend calls `loadData()` after POST?

### Issue: Reply shows as top-level comment
**Cause:** parentId not being sent or saved
**Fix:**
- Check POST body includes `"parentId": 15`
- Check DB: `SELECT * FROM comments WHERE id=16` has parent_id=15
- Frontend groups by String(parentId) - type mismatch if DB has string

### Issue: Dashboard doesn't count comments
**Cause:** Old code only checked one table
**Fix:** Already updated to sum both tables

---

## Next Steps / Enhancements

### Optional improvements:
1. **Order:** Flip to newest-first (change ORDER BY to DESC)
2. **UI:** Replace browser confirm with modal dialog
3. **Badges:** Show "X réponses" count on parent comments
4. **Notifications:** Alert term author when someone comments
5. **Markdown:** Support basic formatting in comments
6. **Pagination:** Load comments in batches for terms with many

---

## Quick Reference: File Locations

**Backend:**
- Routes: `backend/routes/comments.js`
- Dashboard: `backend/routes/dashboard.js`
- DB service: `backend/services/database.js`

**Frontend:**
- Page: `src/pages/Fiche.jsx`
- Component: `src/components/fiche/FicheComments.jsx`
- API: `src/services/api.js`

**Database:**
- DB: `dictionnaire_ch`
- Table: `comments` (primary)
- Legacy: `commentaires` (fallback)

---

Last updated: October 15, 2025
Status: ✅ All endpoints fixed, ready for testing
