# 📚 Study Quest - Homework Gamification MVP

A minimal viable product testing the hypothesis: **Does gamification increase motivation to do homework?**

## Core Loop
User adds homework → completes it → earns XP → levels up → sees progress

## Features (MVP Only)

### ✅ Task System
- Create homework tasks with optional subject
- Mark tasks as completed
- Simple list view with filtering (All / Pending / Completed)
- Delete tasks

### ✅ XP & Level System
- **10 XP** per completed task
- **100 XP** to level up (simple curve)
- Visual progress bar showing level progress
- Current level and XP display

### ✅ Instant Feedback
- "+10 XP" notification on task completion
- Progress bar animation
- "Level Up" celebration message
- XP popup animation

### ✅ Data Persistence
- All data saved to browser LocalStorage
- Tasks, XP, and level persist across sessions
- Reset button to wipe data (with confirmation)

## What's NOT in MVP
- ❌ Social features (friends, leaderboards)
- ❌ Cosmetics (avatars, themes)
- ❌ Marketplace/Shop
- ❌ Complex analytics
- ❌ Backend/server
- ❌ Variable XP formulas

## Quick Start

1. Open `index.html` in any modern web browser
2. Add a homework task (Ctrl+K to focus input)
3. Complete it to earn XP
4. Watch your level progress!

## Data Model

```javascript
User: {
  level: number,
  xp: number,
  totalXpEarned: number,
  tasks: Task[]
}

Task: {
  id: number (timestamp),
  title: string,
  subject: string (optional),
  completed: boolean,
  createdAt: string
}
```

## Testing the Hypothesis

**Metrics to track:**
- Do users return to the app?
- How many tasks do they complete?
- Do they engage with the leveling system?
- Does the "+10 XP" feedback feel rewarding?

If users consistently return and complete tasks, the core concept works. If not, consider:
- Is 10 XP not satisfying enough?
- Does the feedback system need improvement?
- Should levels come faster or slower?

## Browser Requirements
- Modern browser with LocalStorage support
- No dependencies, no build tools needed
- Works offline

## Files
- `index.html` - Structure and layout
- `style.css` - Styling (animations, responsive design)
- `app.js` - Game logic, state management, rendering

## Keyboard Shortcuts
- **Ctrl+K** - Focus task input

## Next Steps (If MVP Succeeds)
1. Daily streaks
2. Rewards shop (unlock themes)
3. Task categories with variable XP
4. Friend comparisons
5. Mobile app version
6. Backend for cloud sync

---

**Created:** MVP Testing Phase
**Stack:** Vanilla HTML/CSS/JS + LocalStorage
