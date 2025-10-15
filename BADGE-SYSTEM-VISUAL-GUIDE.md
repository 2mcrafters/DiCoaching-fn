# 🏆 Authors Badge System - Visual Guide

## Badge Hierarchy

```
                    ┌─────────────────┐
                    │   👑 EXPERT     │
                    │   50+ termes    │
                    │   🟥 Red Badge  │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │   💎 OR (GOLD)  │
                    │   20-50 termes  │
                    │   🟨 Yellow     │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │  ⭐ ARGENT      │
                    │   5-19 termes   │
                    │   ⬜ Gray       │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │  🛡️ BRONZE      │
                    │   0-4 termes    │
                    │   🟧 Orange     │
                    └─────────────────┘
```

---

## Badge Progression Examples

### Example 1: New Author
```
Author: Alice (new)
Terms: 0 → 🛡️ Bronze
Progress: Need 5 more for Argent
```

### Example 2: Growing Author
```
Author: Bob
Terms: 3 → 🛡️ Bronze
Progress: Need 2 more for Argent (5)
```

### Example 3: Active Author
```
Author: Charlie  
Terms: 12 → ⭐ Argent
Progress: Need 8 more for Or (20)
```

### Example 4: Regular Contributor
```
Author: Diana
Terms: 35 → 💎 Or
Progress: Need 15 more for Expert (50)
```

### Example 5: Top Expert
```
Author: Eve
Terms: 75 → 👑 Expert
Status: Maximum badge achieved! 🎉
```

---

## Badge Thresholds Visualization

```
Terms Count:
0────5─────20──────50──────100+
│    │     │       │         │
│Bronze│ Argent│  Or  │  Expert  │
│(0-4) │(5-19)│(20-50)│  (50+)   │
└──────┴──────┴───────┴──────────┘
```

---

## Color Coding

| Badge | Color | Background | Text | Icon |
|-------|-------|------------|------|------|
| Expert | 🟥 Red | `bg-red-100` | `text-red-800` | 👑 Crown |
| Or | 🟨 Yellow | `bg-yellow-100` | `text-yellow-800` | 💎 Gem |
| Argent | ⬜ Gray | `bg-gray-200` | `text-gray-800` | ⭐ Star |
| Bronze | 🟧 Orange | `bg-orange-100` | `text-orange-800` | 🛡️ Shield |

---

## Badge Display in UI

```
┌────────────────────────────────────────────────┐
│ Auteur    │ Badge        │ Termes │ Seuil     │
├────────────────────────────────────────────────┤
│ Eve       │ 👑 Expert    │   75   │ 50+ termes│
│ Diana     │ 💎 Or        │   35   │ 20-50 t.  │
│ Charlie   │ ⭐ Argent    │   12   │ 5-19 t.   │
│ Bob       │ 🛡️ Bronze    │    3   │ 0-4 t.    │
│ Alice     │ 🛡️ Bronze    │    0   │ 0-4 t.    │
└────────────────────────────────────────────────┘
```

---

## Badge Legend (as shown in UI)

```
┌─────────────────────────────────────────────────────────┐
│ 🛡️ Règles des Badges                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │👑 Expert │  │💎 Or     │  │⭐ Argent │  │🛡️ Bronze ││
│  │50+ terms │  │20-50 t.  │  │5-19 t.   │  │0-4 t.    ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Badge Calculation Flow

```
Start
  │
  ▼
Get Author's Terms Count
  │
  ▼
┌─────────────────┐
│ Count >= 50?    │──Yes──▶ 👑 Expert
└────────┬────────┘
         │No
         ▼
┌─────────────────┐
│ Count >= 20?    │──Yes──▶ 💎 Or
└────────┬────────┘
         │No
         ▼
┌─────────────────┐
│ Count >= 5?     │──Yes──▶ ⭐ Argent
└────────┬────────┘
         │No
         ▼
     🛡️ Bronze
```

---

## Terms Count Distribution Example

```
Distribution of Authors by Badge:

Expert (50+)     : ████ 4 authors
Or (20-50)       : ████████ 8 authors  
Argent (5-19)    : ████████████████ 16 authors
Bronze (0-4)     : ████████████████████████ 24 authors

Total Authors: 52
```

---

## Badge Motivation System

### Bronze → Argent
```
You have: 3 terms 🛡️
Need: 2 more terms
Reward: Upgrade to Argent ⭐
```

### Argent → Or
```
You have: 12 terms ⭐
Need: 8 more terms
Reward: Upgrade to Or 💎
```

### Or → Expert
```
You have: 35 terms 💎
Need: 15 more terms
Reward: Upgrade to Expert 👑
```

---

## Database Query Logic

```javascript
// Count terms for an author
const termsCount = allTerms.filter(term => 
  term.authorId === author.id || 
  term.author_id === author.id
).length;

// Get badge
const badge = getAuthorBadgeByTermsCount(termsCount);

// Badge includes:
{
  name: 'Expert',           // Display name
  icon: <Crown />,          // React icon
  bgColor: 'bg-red-100',    // Tailwind class
  textColor: 'text-red-800',// Tailwind class
  threshold: '50+ termes'   // Human-readable
}
```

---

## Testing Badge Calculation

```javascript
// Test cases
const testCases = [
  { terms: 0,   expected: 'Bronze' },
  { terms: 4,   expected: 'Bronze' },
  { terms: 5,   expected: 'Argent' },
  { terms: 19,  expected: 'Argent' },
  { terms: 20,  expected: 'Or' },
  { terms: 50,  expected: 'Or' },     // Edge case!
  { terms: 51,  expected: 'Expert' },
  { terms: 100, expected: 'Expert' }
];

// Run tests
testCases.forEach(test => {
  const badge = getAuthorBadgeByTermsCount(test.terms);
  console.assert(
    badge.name === test.expected,
    `Failed: ${test.terms} terms should be ${test.expected}`
  );
});
```

---

## Badge Icons Reference

```javascript
import { Shield, Star, Gem, Crown } from "lucide-react";

const badges = {
  bronze: <Shield className="h-3 w-3" />,
  argent: <Star className="h-3 w-3" />,
  or:     <Gem className="h-3 w-3" />,
  expert: <Crown className="h-3 w-3" />
};
```

---

## CSS Classes Used

```css
/* Expert - Red */
.bg-red-100 { background: rgba(254, 226, 226, 1); }
.text-red-800 { color: rgba(153, 27, 27, 1); }

/* Or - Yellow */
.bg-yellow-100 { background: rgba(254, 249, 195, 1); }
.text-yellow-800 { color: rgba(133, 77, 14, 1); }

/* Argent - Gray */
.bg-gray-200 { background: rgba(229, 231, 235, 1); }
.text-gray-800 { color: rgba(31, 41, 55, 1); }

/* Bronze - Orange */
.bg-orange-100 { background: rgba(255, 237, 213, 1); }
.text-orange-800 { color: rgba(154, 52, 18, 1); }
```

---

**Badge system is now accurate and visually appealing! 🎨**
