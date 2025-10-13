# Comments and Decisions System - Complete Implementation

## Overview
Added comprehensive comments and decisions system to the dictionary application with full database integration and API endpoints.

---

## Database Tables

### 1. **Comments Table** ✅
Stores user comments on dictionary terms.

```sql
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  term_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (term_id) REFERENCES termes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_term_id (term_id),
  INDEX idx_user_id (user_id)
);
```

**Features:**
- Links comments to terms and users
- Cascading delete (removes comments when term/user is deleted)
- Indexed for fast queries
- Stores comment content as TEXT

---

### 2. **Decisions Table** ✅
Tracks review decisions for dictionary terms.

```sql
CREATE TABLE decisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  term_id INT NOT NULL,
  user_id INT NOT NULL,
  decision_type ENUM('approved', 'rejected', 'pending', 'revision_requested') NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (term_id) REFERENCES termes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_term_id (term_id),
  INDEX idx_user_id (user_id),
  INDEX idx_decision_type (decision_type),
  INDEX idx_created_at (created_at)
);
```

**Features:**
- 4 decision types: approved, rejected, pending, revision_requested
- Optional comment for decision rationale
- Tracks creation and update timestamps
- Auto-updates term status when decision is made
- Multiple indexes for efficient querying

---

## Backend API Endpoints

### Comments API (`/api/...`)

#### 1. **GET /api/terms/:termId/comments**
Get all comments for a specific term.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "1",
      "termId": "123",
      "authorId": "45",
      "authorName": "John Doe",
      "content": "Great definition!",
      "createdAt": "2025-10-13T10:00:00.000Z"
    }
  ]
}
```

#### 2. **POST /api/terms/:termId/comments**
Add a new comment to a term (authentication required).

**Request Body:**
```json
{
  "content": "This is my comment"
}
```

**Response:**
```json
{
  "status": "success",
  "data": [ /* array of all comments for this term */ ]
}
```

#### 3. **DELETE /api/comments/:commentId**
Delete a comment (owner or admin only).

**Response:**
```json
{
  "status": "success",
  "message": "Commentaire supprimé avec succès"
}
```

---

### Decisions API (`/api/...`)

#### 1. **GET /api/decisions**
Get all decisions (admin/researcher only).

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "1",
      "termId": "123",
      "termName": "Coaching",
      "userId": "45",
      "userName": "Dr. Smith",
      "decisionType": "approved",
      "comment": "Well researched",
      "createdAt": "2025-10-13T10:00:00.000Z",
      "updatedAt": "2025-10-13T10:00:00.000Z"
    }
  ]
}
```

#### 2. **GET /api/terms/:termId/decisions**
Get all decisions for a specific term.

**Response:**
```json
{
  "status": "success",
  "data": [ /* decisions for this term */ ]
}
```

#### 3. **POST /api/decisions**
Create a new decision (admin/researcher only).

**Request Body:**
```json
{
  "termId": 123,
  "decisionType": "approved",
  "comment": "Excellent definition"
}
```

**Valid Decision Types:**
- `approved` - Approves the term (sets status to 'published')
- `rejected` - Rejects the term (sets status to 'rejected')
- `pending` - Marks as pending review (sets status to 'pending')
- `revision_requested` - Requests revision (sets status to 'draft')

**Response:**
```json
{
  "status": "success",
  "message": "Décision créée avec succès",
  "data": {
    "id": "1",
    "termId": 123,
    "decisionType": "approved",
    "comment": "Excellent definition"
  }
}
```

**Important:** Creating a decision automatically updates the term's status!

#### 4. **PUT /api/decisions/:decisionId**
Update an existing decision (owner or admin only).

**Request Body:**
```json
{
  "decisionType": "revision_requested",
  "comment": "Please add more examples"
}
```

#### 5. **DELETE /api/decisions/:decisionId**
Delete a decision (admin only).

#### 6. **GET /api/decisions/stats**
Get decision statistics (admin/researcher only).

**Response:**
```json
{
  "status": "success",
  "data": {
    "total": 150,
    "approved": 100,
    "rejected": 20,
    "pending": 15,
    "revisionRequested": 15
  }
}
```

---

## Frontend API Methods

### Comments Methods (`src/services/api.js`)

```javascript
// Get comments for a term
await apiService.getComments(termId);

// Add a comment
await apiService.addComment(termId, "My comment text");

// Delete a comment
await apiService.deleteComment(commentId);
```

### Decisions Methods (`src/services/api.js`)

```javascript
// Get all decisions
await apiService.getDecisions();

// Get decisions for a specific term
await apiService.getTermDecisions(termId);

// Create a new decision
await apiService.createDecision(termId, "approved", "Great work!");

// Update a decision
await apiService.updateDecision(decisionId, {
  decisionType: "revision_requested",
  comment: "Needs more detail"
});

// Delete a decision
await apiService.deleteDecision(decisionId);

// Get decision statistics
await apiService.getDecisionStats();
```

---

## Permission System

### Comments
- **Read (GET):** Public - anyone can view comments
- **Create (POST):** Authenticated users only
- **Delete (DELETE):** Comment owner or admin

### Decisions
- **All Operations:** Admin or Researcher roles only
- **Delete:** Admin only (even researchers cannot delete)

---

## Files Created/Modified

### Database Files
- ✅ `backend/database/migrations/005_create_likes_and_comments.sql` (already existed)
- ✅ `backend/database/migrations/006_create_decisions_table.sql` (NEW)
- ✅ `backend/database/run-decisions-migration.js` (NEW)

### Backend Files
- ✅ `backend/routes/comments.js` (enhanced with DELETE endpoint)
- ✅ `backend/routes/decisions.js` (NEW - complete CRUD)
- ✅ `backend/server.js` (added decisions route registration)

### Frontend Files
- ✅ `src/services/api.js` (added all comment and decision methods)

---

## Usage Examples

### Example 1: Add a Comment
```javascript
import apiService from '@/services/api';

const handleAddComment = async (termId, commentText) => {
  try {
    const result = await apiService.addComment(termId, commentText);
    console.log('Comment added:', result);
    // result.data contains all comments for this term
  } catch (error) {
    console.error('Error adding comment:', error);
  }
};
```

### Example 2: Approve a Term
```javascript
import apiService from '@/services/api';

const handleApproveTerm = async (termId) => {
  try {
    const result = await apiService.createDecision(
      termId, 
      'approved', 
      'Well-researched and properly formatted'
    );
    console.log('Term approved:', result);
    // The term status is now 'published'
  } catch (error) {
    console.error('Error approving term:', error);
  }
};
```

### Example 3: Request Revision
```javascript
import apiService from '@/services/api';

const handleRequestRevision = async (termId) => {
  try {
    const result = await apiService.createDecision(
      termId,
      'revision_requested',
      'Please add more examples and clarify the definition'
    );
    console.log('Revision requested:', result);
    // The term status is now 'draft'
  } catch (error) {
    console.error('Error requesting revision:', error);
  }
};
```

### Example 4: View Decision Statistics
```javascript
import apiService from '@/services/api';

const loadStats = async () => {
  try {
    const stats = await apiService.getDecisionStats();
    console.log('Decision Stats:', stats.data);
    // {
    //   total: 150,
    //   approved: 100,
    //   rejected: 20,
    //   pending: 15,
    //   revisionRequested: 15
    // }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};
```

---

## React Component Examples

### Comment Section Component
```jsx
import { useState, useEffect } from 'react';
import apiService from '@/services/api';

function CommentSection({ termId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadComments();
  }, [termId]);

  const loadComments = async () => {
    try {
      const result = await apiService.getComments(termId);
      setComments(result.data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await apiService.addComment(termId, newComment);
      setComments(result.data || []);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div>
      <h3>Comments</h3>
      {comments.map(comment => (
        <div key={comment.id}>
          <strong>{comment.authorName}</strong>
          <p>{comment.content}</p>
          <small>{new Date(comment.createdAt).toLocaleString()}</small>
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <textarea 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
        />
        <button type="submit">Post Comment</button>
      </form>
    </div>
  );
}
```

### Decision Panel Component (Admin/Researcher)
```jsx
import { useState } from 'react';
import apiService from '@/services/api';

function DecisionPanel({ termId, onDecisionMade }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDecision = async (decisionType) => {
    setLoading(true);
    try {
      await apiService.createDecision(termId, decisionType, comment);
      alert(`Term ${decisionType} successfully!`);
      setComment('');
      onDecisionMade?.();
    } catch (error) {
      alert('Error making decision: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="decision-panel">
      <h3>Review Decision</h3>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add review comments (optional)..."
      />
      <div className="decision-buttons">
        <button 
          onClick={() => handleDecision('approved')}
          disabled={loading}
          className="btn-approve"
        >
          Approve
        </button>
        <button 
          onClick={() => handleDecision('revision_requested')}
          disabled={loading}
          className="btn-revision"
        >
          Request Revision
        </button>
        <button 
          onClick={() => handleDecision('rejected')}
          disabled={loading}
          className="btn-reject"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Test adding comments as authenticated user
- [ ] Test viewing comments as guest
- [ ] Test deleting own comment
- [ ] Test admin can delete any comment
- [ ] Test creating approval decision
- [ ] Test creating rejection decision
- [ ] Test creating revision request
- [ ] Test term status updates correctly with decision
- [ ] Test decision statistics endpoint
- [ ] Test permission enforcement (non-admin cannot create decisions)
- [ ] Test viewing decisions for a specific term
- [ ] Test updating a decision
- [ ] Test deleting a decision (admin only)

---

## Server Status

✅ **Backend Server:** Running on port 5000
✅ **Frontend Server:** Running on port 3000
✅ **Database:** Connected to `dictionnaire_ch`
✅ **Tables Created:** comments, decisions

---

## Next Steps for Implementation

1. **Create UI Components**
   - Comment list and form component
   - Decision panel for reviewers
   - Decision history viewer

2. **Add to Existing Pages**
   - Add comment section to Fiche.jsx (term detail page)
   - Add decision panel to admin/reviewer views
   - Add decision stats to admin dashboard

3. **Real-time Updates** (Optional)
   - Implement WebSocket for live comment updates
   - Show notifications when decisions are made

4. **Validation & Security**
   - Add rate limiting for comments
   - Implement comment moderation system
   - Add spam detection

---

## Migration Commands

If you need to recreate the tables:

```bash
# Run from backend directory
cd backend

# Create decisions table
node database/run-decisions-migration.js

# Verify tables
node database/list-tables.js
```

---

## Troubleshooting

### Issue: "Access Denied" Error
**Solution:** Ensure user is authenticated and has proper role (researcher/admin for decisions)

### Issue: Comments Not Showing
**Solution:** Check that termId is being passed correctly and term exists in database

### Issue: Decision Not Updating Term Status
**Solution:** Verify the decision type is valid and term exists in `termes` table

---

## Summary

✅ **2 Database Tables** created with proper foreign keys and indexes
✅ **10 API Endpoints** for comments and decisions
✅ **9 Frontend Methods** ready to use in React components
✅ **Complete CRUD** operations for both systems
✅ **Permission System** enforced at API level
✅ **Automatic Term Status Updates** when decisions are made
✅ **Statistics Endpoint** for admin dashboard integration

The system is now ready for frontend integration! 🎉
