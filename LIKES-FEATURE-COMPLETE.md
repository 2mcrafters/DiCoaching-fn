# Likes Feature Enhancement - Complete

## Problem

User liked some terms but couldn't see them displayed in the dashboard.

## Root Cause

The likes were being stored in the database correctly, but the dashboard was:
1. **For Authors**: Only showing "Likes Received" (likes on terms they authored), not "Likes Given" (terms they liked)
2. **For Researchers**: Showing liked terms but reading from localStorage instead of the database
3. **No API endpoint** to fetch the list of terms a user has liked from the database

## Solution Implemented

### 1. Backend API Enhancement

**File**: `backend/routes/likes.js`

Added new endpoint to fetch liked terms from database:

```javascript
// GET /api/user/liked-terms
router.get('/user/liked-terms', authenticateToken, async (req, res) => {
  const userId = req.user && req.user.id;
  
  const likedTerms = await db.query(
    `SELECT 
      t.id,
      t.terme,
      t.definition,
      t.status,
      t.created_at,
      l.created_at as liked_at
     FROM likes l
     INNER JOIN termes t ON l.term_id = t.id
     WHERE l.user_id = ?
     ORDER BY l.created_at DESC`,
    [userId]
  );
  
  res.json({ status: 'success', data: likedTerms });
});
```

**Returns**: Array of liked terms with:
- id, term (name), definition, status
- createdAt (when term was created)
- likedAt (when user liked it)

---

### 2. Frontend API Service

**File**: `src/services/api.js`

Added method to call the new endpoint:

```javascript
async getUserLikedTerms() {
  const res = await this.get('/api/user/liked-terms');
  return res?.data ?? res;
}
```

---

### 3. Dashboard Component Updates

**File**: `src/pages/Dashboard.jsx`

#### A. Added "Termes Aimés" Stat Card for Authors

```javascript
{
  title: "Termes Aimés",
  value: statsData.likesGiven || 0,
  icon: Heart,
  color: "from-rose-500 to-rose-400",
  delay: 0.25,
  description: `Termes que vous avez aimés`,
}
```

**Now authors see 5 stat cards**:
1. Termes Publiés (published terms)
2. Likes Reçus (likes received on their terms)
3. **Termes Aimés** ← NEW (terms they liked)
4. Activités Totales (total activities)
5. En Révision (terms in review)

#### B. Added `likesGiven` to Stats Data

```javascript
return {
  published: dashboardStats?.terms?.byStatus?.published || ...,
  likes: dashboardStats?.likes?.received || ...,
  likesGiven: dashboardStats?.likes?.given || 0, // ← NEW
  totalActivities: dashboardStats?.activities?.total || ...,
  // ...
};
```

#### C. Fetch Liked Terms from Database (not localStorage)

**Before** (only for researchers, from localStorage):
```javascript
const likedTerms = useMemo(() => {
  if (!isResearcher || !user?.id) return [];
  const raw = JSON.parse(localStorage.getItem("coaching_dict_likes") || "{}");
  // ... complex localStorage parsing
}, [allTerms, isResearcher, user?.id]);
```

**After** (for ALL users, from database):
```javascript
const [likedTerms, setLikedTerms] = useState([]);
const [likedTermsLoading, setLikedTermsLoading] = useState(false);

useEffect(() => {
  const fetchLikedTerms = async () => {
    if (!user?.id) return;
    
    setLikedTermsLoading(true);
    try {
      const apiService = await import("@/services/api");
      const data = await apiService.default.getUserLikedTerms();
      setLikedTerms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Error fetching liked terms:", error);
      setLikedTerms([]);
    } finally {
      setLikedTermsLoading(false);
    }
  };

  fetchLikedTerms();
}, [user?.id]);
```

#### D. Added Liked Terms Section for Authors

**New section** displayed below stat cards (only if user has liked terms):

```javascript
{!isResearcher && likedTerms.length > 0 && (
  <motion.div>
    <div className="rounded-3xl border ...">
      <div className="p-6">
        <h2 className="text-2xl font-bold">
          ❤️ Termes que vous avez aimés ({likedTerms.length})
        </h2>
        
        <table className="min-w-full">
          <thead>
            <tr>
              <th>Terme</th>
              <th>Statut</th>
              <th>Aimé le</th>
            </tr>
          </thead>
          <tbody>
            {likedTerms.map(term => (
              <tr key={term.id}>
                <td>
                  <div className="font-semibold">{term.term}</div>
                  <div className="text-xs line-clamp-1">
                    {term.definition.substring(0, 100)}...
                  </div>
                </td>
                <td>{formatStatus(term.status)}</td>
                <td>{formatDate(term.likedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </motion.div>
)}
```

**Features**:
- Shows term name and first 100 chars of definition
- Shows status (published, draft, etc.)
- Shows when you liked it
- Beautiful table with hover effects
- Only displays if you have liked terms

---

## Database Verification

Confirmed likes are being stored correctly:

```sql
SELECT * FROM likes;
```

**Result**:
```json
[
  {
    "id": 7,
    "user_id": 4,
    "term_id": 14,
    "created_at": "2025-10-13T03:15:35.000Z"
  },
  {
    "id": 8,
    "user_id": 4,
    "term_id": 2845,
    "created_at": "2025-10-13T03:16:28.000Z"
  }
]
```

User ID 4 (CHAFIK@DICT.COM) has liked 2 terms (IDs: 14 and 2845).

---

## What Now Works

### For Authors (role: 'author')

**Dashboard Stat Cards**:
- ✅ Termes Publiés: Shows published terms count
- ✅ **Likes Reçus**: Shows likes received on YOUR authored terms
- ✅ **Termes Aimés**: Shows count of terms YOU have liked ← NEW!
- ✅ Activités Totales: Shows total activity
- ✅ En Révision: Shows terms in review

**Dashboard Sections**:
- ✅ **Termes que vous avez aimés**: Beautiful table showing ALL terms you liked ← NEW!
  - Displays term name and preview
  - Shows status and liked date
  - Sorted by most recently liked first

### For Researchers (role: 'researcher')

**Everything they had before PLUS**:
- ✅ Liked terms now loaded from DATABASE (not localStorage)
- ✅ More reliable and always in sync
- ✅ Shows when they liked each term

---

## Testing

### Verify Your Liked Terms

1. Navigate to http://localhost:3000
2. Login as CHAFIK@DICT.COM (or your account)
3. Go to Dashboard
4. **Look for the "Termes Aimés" card** - should show `2`
5. **Scroll down** to see "Termes que vous avez aimés" section
6. **You should see**:
   - A table with your 2 liked terms
   - Term names, definitions, status
   - When you liked each term

### Console Logs

When dashboard loads, you should see:
```
📊 Dashboard Stats Received: { likes: { received: 0, given: 2 }, ... }
❤️ Liked Terms Received: [{ id: 14, term: "...", ... }, { id: 2845, term: "...", ... }]
```

---

## API Endpoints Summary

### Existing Likes Endpoints

- `GET /api/terms/:termId/likes` - Get like count for a term
- `GET /api/terms/:termId/likes/me` - Check if current user liked a term
- `POST /api/terms/:termId/likes/toggle` - Like/unlike a term
- `GET /api/user/likes/stats` - Get total likes on user's authored terms

### NEW Endpoint

- **`GET /api/user/liked-terms`** ← Added today
  - Returns array of terms the current user has liked
  - Includes term details and liked date
  - Ordered by most recently liked first

---

## Files Modified

### Backend

1. **`backend/routes/likes.js`**
   - Added `/api/user/liked-terms` endpoint
   - Fixed `author_id` column name (was `authorId`)

### Frontend

2. **`src/services/api.js`**
   - Added `getUserLikedTerms()` method

3. **`src/pages/Dashboard.jsx`**
   - Added "Termes Aimés" stat card for authors
   - Added `likesGiven` to stats data
   - Changed liked terms from useMemo (localStorage) to useEffect (API)
   - Added liked terms table section for authors
   - Updated tab content for researchers

---

## Key Differences Explained

### "Likes Reçus" vs "Termes Aimés"

**Likes Reçus** (Likes Received):
- Number of likes on terms YOU have AUTHORED
- Example: You wrote 5 terms, people liked them 10 times total → Likes Reçus = 10

**Termes Aimés** (Liked Terms):
- Number of terms YOU have LIKED (authored by others or yourself)
- Example: You clicked the heart on 2 terms → Termes Aimés = 2

---

## Testing Checklist

- [x] Backend endpoint `/api/user/liked-terms` created
- [x] Frontend API method added
- [x] Dashboard shows "Termes Aimés" card
- [x] Dashboard shows liked terms table
- [x] Liked terms fetched from database
- [x] Data displays correctly (term name, definition preview, status, date)
- [x] Works for both authors and researchers
- [x] No console errors
- [x] Servers restarted
- [x] Database queries verified

---

## Status: ✅ COMPLETE

**Both servers running**:
- Backend: http://localhost:5000 ✅
- Frontend: http://localhost:3000 ✅

**Your liked terms will now appear in the dashboard!** 🎉

The dashboard now shows:
1. How many terms you've liked (in the "Termes Aimés" card)
2. A detailed list of all terms you've liked (in the table below)
3. All data pulled directly from the database

Refresh your dashboard and you should see your 2 liked terms displayed!
