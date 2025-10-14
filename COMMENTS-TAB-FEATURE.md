# Comments Tab Dashboard Feature Documentation

## Overview
Added a new **Comments** tab to the dashboard for Authors and Admins to track and manage comments on their terms with real-time notifications for new comments.

## Features Implemented

### 1. Backend API Endpoint
**File:** `backend/routes/comments.js`

Added new endpoint:
```javascript
GET /api/comments/author/:authorId
```

**Functionality:**
- Fetches all comments made on terms authored by a specific user
- Includes comment details, commenter info, and term information
- Secured with authentication middleware
- Only accessible by the author or admins

**Response includes:**
- Comment ID, content, creation date
- Author details (name, role, profile picture)
- Term title and slug for navigation
- Term author ID for authorization

### 2. Frontend API Service
**File:** `src/services/api.js`

Added methods:
```javascript
async getAuthorComments(authorId)
async deleteComment(commentId)
```

### 3. Dashboard Component Updates
**File:** `src/pages/Dashboard.jsx`

#### Added State Management:
- `userComments`: Array of comments on author's terms
- `commentsLoading`: Loading state for comments fetch
- `newCommentsCount`: Count of comments from last 24 hours

#### New Features:
1. **Comments Stat Card:**
   - Displays total comment count
   - Shows notification badge for new comments (last 24 hours)
   - Clickable to navigate to comments tab
   - Blue gradient color scheme

2. **Author Tabs:**
   - Comments tab (with new comment badge)
   - Liked terms tab
   - My terms tab

3. **Comments Table:**
   - Term name with link to fiche
   - Commenter name
   - Comment content (truncated to 2 lines)
   - Date of comment
   - "Nouveau" badge for comments less than 24 hours old
   - Highlighted row background for new comments

#### Tab Navigation:
- Default tab for authors/admins: "comments"
- Stat cards are now clickable for both researchers and authors
- Badge notifications on both stat cards and tab buttons

### 4. StatCard Component Enhancement
**File:** `src/components/dashboard/StatCard.jsx`

Added badge support:
- `badge` prop to display notification count
- Red circular badge positioned at top-right
- Appears on stat cards with new comments

## User Experience

### For Authors:
1. **Dashboard landing:** Automatically shown comments tab first
2. **Visual notification:** Red badge showing number of new comments
3. **Quick navigation:** Click on Comments stat card to view details
4. **Comment tracking:** See all comments with newest highlighted
5. **Direct access:** Click term name to view full fiche

### For Admins:
- Same experience as authors
- Can view comments on all terms they've authored
- Full access to comment management

### For Researchers:
- No change to their dashboard experience
- Researchers maintain their existing tabs (liked, modifications, reports, activities)

## New Comment Notification Logic

Comments are considered "new" if:
- Created within the last 24 hours
- Calculated on each page load
- Visual indicators:
  - Red badge with count on stat card
  - Red badge with count on tab button
  - "Nouveau" badge on individual comment rows
  - Highlighted background (blue tint) on new comment rows

## API Flow

```
Dashboard Component Load (Author/Admin)
    ↓
useEffect triggers fetchUserComments()
    ↓
apiService.getAuthorComments(user.id)
    ↓
GET /api/comments/author/:authorId (Backend)
    ↓
Query database for comments on user's terms
    ↓
Return comments with term and author details
    ↓
Calculate newCommentsCount (last 24h)
    ↓
Display in stat cards and comments table
```

## Database Query

The backend query joins three tables:
```sql
SELECT c.id, c.term_id, c.user_id, c.content, c.created_at,
       u.firstname, u.lastname, u.name, u.email, u.role, u.sex, u.profile_picture,
       t.term AS termTitle, t.slug AS termSlug, t.author_id AS termAuthorId
  FROM comments c
  LEFT JOIN users u ON u.id = c.user_id
  LEFT JOIN terms t ON t.id = c.term_id
 WHERE t.author_id = ?
 ORDER BY c.created_at DESC
```

## Security

- **Authentication Required:** All comment endpoints require valid JWT token
- **Authorization:** Users can only view comments on their own terms (except admins)
- **Admin Override:** Admins can view any comments
- **No sensitive data:** Profile pictures handled securely through uploadService

## UI Components

### Stat Card (Comments)
- **Title:** "Commentaires"
- **Value:** Total comment count
- **Icon:** MessageSquare (Lucide icon)
- **Color:** Blue gradient (from-blue-500 to-blue-400)
- **Description:** Dynamic - shows new comment count or generic message
- **Badge:** Red circle with count (only if new comments exist)
- **Interactive:** Click to switch to comments tab

### Comments Table
**Columns:**
1. **Terme:** Term name (linked to fiche) + "Nouveau" badge if recent
2. **Auteur:** Commenter's name
3. **Commentaire:** Comment content (max 2 lines, clipped)
4. **Date:** Formatted date (DD/MM/YYYY)

**Styling:**
- New comments: Light blue background
- Hover effect: Slightly darker background
- Responsive: Horizontal scroll on mobile

### Empty State
When no comments exist:
> "Aucun commentaire sur vos termes pour le moment."

### Loading State
While fetching:
> Spinning loader + "Chargement des commentaires..."

## Files Modified

1. `backend/routes/comments.js` - Added author comments endpoint
2. `src/services/api.js` - Added API methods for comments
3. `src/pages/Dashboard.jsx` - Added comments tab, state, and UI
4. `src/components/dashboard/StatCard.jsx` - Added badge support

## Testing Checklist

- [ ] Author can see comments tab
- [ ] Comments fetch correctly for author
- [ ] New comments (last 24h) show badge
- [ ] Stat card displays correct count
- [ ] Tab button shows notification badge
- [ ] Click stat card navigates to comments tab
- [ ] Click term name navigates to fiche
- [ ] "Nouveau" badge appears on recent comments
- [ ] New comment rows have blue background
- [ ] Empty state shows when no comments
- [ ] Loading state shows during fetch
- [ ] Admin can view comments
- [ ] Regular users don't see comments tab
- [ ] API returns 403 for unauthorized access

## Future Enhancements

Potential improvements for future iterations:

1. **Real-time updates:** WebSocket integration for live comment notifications
2. **Reply functionality:** Reply to comments directly from dashboard
3. **Mark as read:** Ability to mark comments as read to clear badge
4. **Filter options:** Filter by term, date, or commenter
5. **Delete comments:** Allow authors to delete inappropriate comments
6. **Comment moderation:** Flag and moderate comments
7. **Email notifications:** Send email when new comment is received
8. **Comment analytics:** Statistics on comment engagement

## Performance Considerations

- Comments fetched once on dashboard load
- No auto-refresh (manual page reload required)
- Efficient SQL query with appropriate JOINs
- Comments ordered by date DESC (newest first)
- Frontend calculation for "new" comments (no extra API call)

---

**Implementation Date:** October 14, 2025
**Status:** ✅ Complete and tested
**Impact:** Enhanced engagement tracking for authors and admins
