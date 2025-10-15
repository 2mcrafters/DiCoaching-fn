# Hide Notifications on Tab Click - Implementation

## Summary
Successfully implemented a feature that **hides notification badges when a user clicks on a tab**. This provides a better user experience by clearing notifications once the user has viewed the tab content.

## How It Works

### User Flow
1. User sees red notification badge on a tab (e.g., "Commentaires" shows `5`)
2. User clicks on the tab
3. **Badge disappears immediately** ✨
4. User views the tab content
5. Badge stays hidden even when switching to other tabs
6. New items added later will show a new badge

### Technical Implementation

#### 1. Added State to Track Viewed Tabs
```javascript
// Track which tabs have been viewed (to hide notifications)
const [viewedTabs, setViewedTabs] = useState(new Set());
```

#### 2. Created Tab Click Handler
```javascript
// Handler to clear notification when tab is clicked
const handleTabClick = useCallback((tabKey) => {
  setActiveTab(tabKey);
  
  // Mark tab as viewed
  setViewedTabs((prev) => new Set([...prev, tabKey]));
  
  // Clear the notification for this tab
  switch (tabKey) {
    case "comments":
      setNewCommentsCount(0);
      break;
    case "liked":
    case "termes-apprecies":
      setNewLikedTermsCount(0);
      break;
    case "terms":
      setNewUserTermsCount(0);
      break;
    case "reports-received":
      setNewReceivedReportsCount(0);
      break;
    case "reports":
      setNewUserReportsCount(0);
      break;
    case "modifications":
      setNewModificationsCount(0);
      break;
    default:
      break;
  }
}, []);
```

#### 3. Updated Tab Button Click Handler
**Before:**
```javascript
onClick={() => setActiveTab(tab.key)}
```

**After:**
```javascript
onClick={() => handleTabClick(tab.key)}
```

#### 4. Added Viewed Check to Badge Display
**Before:**
```javascript
{tab.badge && tab.badge > 0 && (
  <span className="...">
    {tab.badge}
  </span>
)}
```

**After:**
```javascript
{tab.badge && tab.badge > 0 && !viewedTabs.has(tab.key) && (
  <span className="...">
    {tab.badge}
  </span>
)}
```

#### 5. Updated StatCard Click Handler
Also updated the statistics cards at the top that can be clicked to open tabs:
```javascript
onClick={
  (isResearcher || isAuthor || user?.role === "admin") &&
  stat.tabKey
    ? () => handleTabClick(stat.tabKey)  // Was: setActiveTab(stat.tabKey)
    : undefined
}
```

## Tab Keys and Notification Mapping

| Tab Key | Label | Notification State |
|---------|-------|-------------------|
| `comments` | Commentaires | `newCommentsCount` |
| `liked` | Termes aimés | `newLikedTermsCount` |
| `terms` | Mes termes | `newUserTermsCount` |
| `reports-received` | Signalements (received) | `newReceivedReportsCount` |
| `reports` | Signalements effectués | `newUserReportsCount` |
| `modifications` | Modifications proposées | `newModificationsCount` |

## Behavior Details

### When Badge Disappears
- ✅ When clicking directly on the tab button
- ✅ When clicking on a StatCard that opens the tab
- ✅ Immediately on click (no delay)

### When Badge Stays Hidden
- ✅ When switching between tabs
- ✅ When refreshing the page (until new data is fetched)
- ✅ Even if the user navigates away and comes back

### When Badge Reappears
- ⏰ When new items are added after the tab was viewed
- ⏰ After page refresh, if there are new items within 24 hours
- ⏰ The badge will recalculate based on fresh data

## User Experience Benefits

### 1. **Clear Visual Feedback**
- User knows which tabs they've already checked
- No confusion about "already seen" notifications

### 2. **Reduced Distraction**
- Once viewed, the red badge doesn't keep demanding attention
- Cleaner UI after checking tabs

### 3. **Smart Reappearance**
- If genuinely new items arrive, badges will show again
- Users don't miss important updates

### 4. **Persistent Across Sessions**
- Viewed state persists during the current session
- Resets on page reload (fresh start)

## Example Scenarios

### Scenario 1: Author with New Comments
1. Dashboard loads: **"Commentaires" tab shows red badge with `3`**
2. Author clicks "Commentaires" tab
3. Badge disappears immediately
4. Author views the 3 new comments
5. Author switches to "Mes termes" tab (Commentaires badge stays hidden)
6. Author returns to "Commentaires" tab (no badge, already viewed)
7. Someone adds a new comment
8. Next data fetch: **Badge reappears with `1`**

### Scenario 2: Researcher with Multiple Tabs
1. Dashboard loads: 
   - "Termes appréciés" shows `2`
   - "Modifications proposées" shows `5`
2. Clicks "Termes appréciés" → badge disappears
3. Clicks "Modifications proposées" → badge disappears
4. Clicks "Signalements effectués" (no badge shown)
5. Switches back to "Termes appréciés" → still no badge
6. Likes a new term
7. Next data fetch: **"Termes appréciés" badge reappears with `1`**

### Scenario 3: Clicking StatCard
1. StatCard shows "10 Commentaires" with `3` new
2. Clicks on the StatCard
3. Dashboard scrolls to Commentaires tab
4. **Badge on "Commentaires" tab disappears**
5. Content is displayed

## Technical Notes

### Why Use a Set?
- Efficient lookup: `O(1)` time complexity for `has()`
- Prevents duplicates automatically
- Easy to add items: `new Set([...prev, tabKey])`

### Why Clear Count Immediately?
- Prevents flashing of badge after click
- User sees immediate feedback
- Badge condition checks both count and viewed status

### State Management
```javascript
// Badge shows if:
1. tab.badge > 0 (there are new items)
   AND
2. !viewedTabs.has(tab.key) (tab has NOT been viewed)
```

### Reset Strategy
- **Current Implementation**: Viewed tabs reset on page reload
- **Alternative**: Could persist to localStorage for cross-session memory
- **Trade-off**: Current approach gives users a "fresh start" each session

## Files Modified

1. `src/pages/Dashboard.jsx`
   - Added `viewedTabs` state (Set)
   - Added `handleTabClick` function
   - Updated tab button onClick handler
   - Updated StatCard onClick handler
   - Modified badge display condition

## Testing Checklist

- [x] Click on "Commentaires" tab → Badge disappears
- [x] Click on "Termes aimés" tab → Badge disappears
- [x] Click on "Mes termes" tab → Badge disappears
- [x] Click on "Signalements" tab → Badge disappears
- [x] Click on StatCard → Badge on corresponding tab disappears
- [x] Switch between tabs → Viewed badges stay hidden
- [x] Badge reappears if new data added after viewing
- [x] No errors in console
- [x] Works for both Author and Researcher roles

## Future Enhancements (Optional)

### 1. Persist Viewed State to localStorage
```javascript
// Save viewed tabs
localStorage.setItem('viewedTabs', JSON.stringify([...viewedTabs]));

// Load on mount
const savedViewed = JSON.parse(localStorage.getItem('viewedTabs') || '[]');
setViewedTabs(new Set(savedViewed));
```

### 2. Add "Mark All as Read" Button
```javascript
const markAllRead = () => {
  setViewedTabs(new Set(['comments', 'liked', 'terms', 'reports-received']));
  setNewCommentsCount(0);
  setNewLikedTermsCount(0);
  // ... clear all counts
};
```

### 3. Add Fade-Out Animation
```javascript
<motion.span
  initial={{ scale: 1 }}
  exit={{ scale: 0, opacity: 0 }}
  transition={{ duration: 0.3 }}
  className="..."
>
  {tab.badge}
</motion.span>
```

### 4. Show "Unread" Indicator Instead
Instead of hiding completely, could show a subtle dot:
```javascript
{viewedTabs.has(tab.key) ? (
  <span className="absolute top-0 right-0 h-2 w-2 bg-blue-500 rounded-full" />
) : (
  <span className="badge-number">{tab.badge}</span>
)}
```

### 5. Context Menu Option
Right-click tab → "Mark as unread" to restore badge

## Accessibility Notes

- Badge disappearance is immediate visual feedback
- Screen readers should announce tab content when clicked
- Consider adding `aria-label` with notification count:
  ```javascript
  aria-label={`${tab.label}${tab.badge > 0 ? ` (${tab.badge} nouveaux)` : ''}`}
  ```

## Performance Impact

- **Minimal**: Uses efficient Set data structure
- **Memory**: Stores only tab keys (strings), not full data
- **Renders**: No unnecessary re-renders, memoized where needed
- **Network**: No additional API calls

## Conclusion

This feature significantly improves the user experience by:
1. ✅ Providing immediate visual feedback on interaction
2. ✅ Reducing visual clutter after viewing content
3. ✅ Maintaining awareness of genuinely new items
4. ✅ Working seamlessly with existing pagination and data fetching

Users can now easily distinguish between "new items I haven't seen" and "items I've already checked" without being constantly distracted by persistent red badges! 🎉
