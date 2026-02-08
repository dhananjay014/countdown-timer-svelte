# Countdown Timer Svelte

A modern, feature-rich countdown timer and event tracking application built with Svelte 5, Vite, and Firebase. Create personal timers with audio alerts, plan events with live countdowns, and share events with others via shareable links.

[![Svelte 5.43.8](https://img.shields.io/badge/Svelte-5.43.8-FF3E00?style=flat&logo=svelte)](https://svelte.dev)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=flat&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vite 7.2.4](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![Firebase 12.8.0](https://img.shields.io/badge/Firebase-12.8.0-FFCA28?style=flat&logo=firebase)](https://firebase.google.com)

## Features

### Core Functionality
- **Personal Timers**: Create unlimited countdown timers with custom names and durations
- **Audio Alerts**: Web Audio API beep notifications when timers complete
- **Adjustable Volume**: Control alarm volume from 0-100%
- **Timer Controls**: Start, pause, reset, and delete timers with responsive UI

### Event Tracking
- **Event Countdowns**: Plan upcoming events with live countdown display (days, hours, minutes, seconds)
- **Persistent Storage**: All data automatically saved to localStorage
- **Past Event Tracking**: Events remain visible after they pass with celebratory messages

### Cloud & Collaboration
- **Google OAuth**: Sign in with Google account to enable cloud sync
- **Firestore Cloud Sync**: Seamlessly sync timers and events across devices
- **Event Sharing**: Generate unique shareable links for events (`/e/{8-char-id}`)
- **Linked Copies**: Allow others to add your shared events to their accounts
- **Cross-Device Sync**: Changes propagate across all signed-in devices in real-time

### User Experience
- **Dark Mode**: System preference detection with manual override
- **Offline-First**: Full functionality without internet (localStorage fallback)
- **Data Migration**: Automatic migration prompt when first signing in with existing local data
- **Responsive Design**: Mobile-optimized interface with touch-friendly controls
- **Auth Persistence**: Session persists across browser refreshes

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Countdown Timer App                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  UI Layer (Svelte Components)                          │ │
│  │  - Header, TabNav, TimerCard, EventCard               │ │
│  │  - EventForm, MigrationModal, SharedEventPage         │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ▲                                   │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  State Management (Svelte Stores)                      │ │
│  │  - timers.js (CRUD + sync)                            │ │
│  │  - events.js (sharing + linked copies)                │ │
│  │  - auth.js (Firebase auth state)                      │ │
│  │  - settings.js (theme, volume, sound)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│     ▲                                    ▲                   │
│     │                                    │                   │
│  ┌─────────────────────┐    ┌──────────────────────────┐    │
│  │  localStorage       │    │  Firebase (config, sync) │    │
│  │  (Offline cache)    │    │  - Authentication        │    │
│  │                     │    │  - Firestore CRUD        │    │
│  └─────────────────────┘    │  - Offline persistence   │    │
│                             │  - Batch migration       │    │
│                             └──────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
LOCAL MODE (Signed out):
  User Action → Store (update state) → localStorage (persist)

CLOUD MODE (Signed in):
  User Action → Store (update state) → localStorage (persist)
                              │
                              ├─→ Firestore (sync)
                              │   (real-time listener)
                              │
                    ← ← ← ← ← ←

SHARED EVENT (Public link):
  Shared URL (/e/{shareId})
     │
     ├─→ Look up shareLink collection
     │
     └─→ Fetch event details
         │
         ├─→ Display countdown
         │
         └─→ (Optional) Add to my account
```

## Project Structure

```
countdown-timer-svelte/
├── src/
│   ├── App.svelte                    # Root component, routing logic
│   ├── main.js                       # Entry point, mount target
│   ├── app.css                       # Global styles, CSS variables
│   │
│   └── lib/
│       ├── stores/
│       │   ├── auth.js               # Firebase auth, user state
│       │   ├── timers.js             # Timer CRUD + cloud sync
│       │   ├── events.js             # Event CRUD + sharing
│       │   └── settings.js           # Theme, volume, sound settings
│       │
│       ├── components/
│       │   ├── Header.svelte         # Logo, user menu, auth button
│       │   ├── TabNav.svelte         # Timers/Events tab switcher
│       │   ├── TimerCard.svelte      # Single timer with controls
│       │   ├── TimersList.svelte     # Grid of timers + add button
│       │   ├── EventCard.svelte      # Event countdown + share button
│       │   ├── EventsList.svelte     # List of events + form modal
│       │   ├── EventForm.svelte      # Add/edit event modal
│       │   ├── SharedEventPage.svelte # /e/{shareId} public page
│       │   ├── MigrationModal.svelte # Local→cloud data merge
│       │   ├── AuthButton.svelte     # Sign in/out button
│       │   ├── UserMenu.svelte       # User profile dropdown
│       │   └── Footer.svelte         # App footer
│       │
│       └── firebase/
│           ├── config.js             # Firebase init + persistence
│           └── sync.js               # Firestore CRUD + migration
│
├── package.json
├── vite.config.js
├── svelte.config.js
├── index.html
└── .env.local                        # Firebase credentials (git ignored)
```

## Technical Deep Dive

### Authentication Flow

```
User clicks "Sign in with Google"
  │
  ├─→ signInWithRedirect() (auth/google)
  │
  ├─→ Browser redirects to Google OAuth
  │   (User grants permissions)
  │
  ├─→ Redirect back to app
  │
  ├─→ handleRedirectResult()
  │   (Auth store updates with user)
  │
  ├─→ Create/update user document in Firestore
  │   (uid, email, displayName, settings)
  │
  └─→ Subscribe to Firestore collections
      (timers, events, settings in real-time)
```

**Auth State Management**:
- `authStore`: Main store with `{ user, loading, initialized, error }`
- `isAuthenticated`: Derived store, boolean user presence
- `currentUser`: Derived store, user object or null
- Persistence: browserLocalPersistence (survives refresh)

### Event Sharing System

Share IDs are 8-character random strings (alphanumeric, 52^8 combinations ≈ 53 trillion):

```
Event Owner creates event:
  event = {
    id: "123-abc...",
    name: "Birthday Party",
    targetDate: 1735689600000,
    ownerId: "user123",
    isShared: false,
    shareId: null
  }

Owner clicks "Share":
  1. Generate shareId: "aB3cD9eF"
  2. Update event: isShared=true, shareId="aB3cD9eF"
  3. Create shareLink doc in Firestore:
     {
       eventId: "123-abc...",
       ownerId: "user123",
       createdAt: serverTimestamp()
     }
  4. Share URL: https://app.com/e/aB3cD9eF

Others receive link and visit /e/aB3cD9eF:
  1. Look up shareLink[aB3cD9eF]
  2. Get eventId from shareLink
  3. Fetch event from events/{eventId}
  4. Display read-only countdown
  5. (Optional) Add linked copy to their account:
     - Creates new event in their ownership
     - Sets isLinkedCopy=true, originalEventId=original
     - Tracks original owner for UI attribution
```

Linked copies allow followers to independently track the event. If original owner deletes event, linked copies are marked `isOrphaned=true` but remain visible.

### Dark Mode Implementation

Dynamic CSS variables with system preference detection:

```javascript
// Light mode (default)
main {
  --bg-primary: #f5f5f5;
  --bg-card: #ffffff;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
}

// Dark mode
main.dark {
  --bg-primary: #1a1a2e;
  --bg-card: #16213e;
  --text-primary: #eaeaea;
  --text-secondary: #b8b8b8;
  --border-color: #2a2a4a;
}
```

Theme detection:
1. Check localStorage preference
2. Fall back to system `prefers-color-scheme` media query
3. User can override with settings toggle

### Offline-First & Sync Strategy

Every store follows this pattern:

```
Initialization:
  1. Load from localStorage
  2. Set writable store with local data

Auth subscription:
  if (user signs in):
    - Subscribe to Firestore collection
    - Real-time updates merge with local state
    - Preserve ephemeral state (running timers)
    - Sync local writes to cloud

  if (user signs out):
    - Unsubscribe from Firestore
    - Reload from localStorage
    - Fall back to offline-only mode

Persistence:
  - Every store write saves to localStorage (fallback)
  - Cloud sync is best-effort (network errors caught)
  - Running/paused timer states NOT synced (ephemeral)
```

### Timer State Machine

```
IDLE → START → RUNNING → (PAUSE → PAUSED → START)
        │         │
        │         └─→ TIME_EXPIRES → COMPLETED
        │
        ├─→ RESET → IDLE
        └─→ DELETE (removed)

Persistent Properties (synced to cloud):
  - id, name, duration, remaining

Ephemeral Properties (local only):
  - status (running/paused/completed/idle)
  - endTime (calculated from now + remaining)
  - displayTime (calculated in real-time)

Clock tick interval: 100ms (every 100ms check remaining time)
```

### Data Models

**Timer**:
```javascript
{
  id: "1733000000000-a1b2c3d4e",  // timestamp-random
  name: "Workout",
  duration: 1800,                   // seconds
  remaining: 1800,
  status: "idle" | "running" | "paused" | "completed",
  endTime: null | 1733000001800,   // Date.now() + remaining*1000

  // Cloud metadata (from Firestore)
  _cloud?: {
    hours: 0,
    minutes: 30,
    seconds: 0,
    label: "Workout",
    createdAt: 1733000000000,
    updatedAt: 1733000000000
  }
}
```

**Event**:
```javascript
{
  id: "1733000000000-a1b2c3d4e",
  name: "Conference Keynote",
  targetDate: 1735689600000,         // when countdown reaches 0
  createdAt: 1733000000000,
  updatedAt: 1733000000000,

  // Ownership
  ownerId: "firebase_uid_123",
  ownerDisplayName: "Alice",
  ownerEmail: "alice@example.com",

  // Sharing
  isShared: false,
  shareId: "aB3cD9eF" | null,
  visibility: "private" | "public",

  // Linked copy tracking
  isLinkedCopy: false,               // true if added from shared link
  originalEventId: null | "...",     // original event id
  originalOwnerId: null | "...",     // original owner uid
  isOrphaned: false                  // true if original deleted
}
```

**User (Firestore)**:
```javascript
{
  uid: "firebase_uid_123",
  email: "user@example.com",
  displayName: "Alice",
  photoURL: "https://...",
  createdAt: Timestamp,
  lastLoginAt: Timestamp,
  settings: {
    soundEnabled: true,
    volume: 70,
    themePreference: "system" | "light" | "dark",
    vibrationEnabled: true,
    keepScreenAwake: false
  }
}
```

## Setup & Development

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Firebase project with Authentication and Firestore enabled
- Google OAuth credentials configured in Firebase

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Google sign-in provider
4. Enable **Firestore Database** (start in test mode, see security rules below)
5. Copy your Firebase config (Project Settings → Web app)

### 2. Environment Setup

Create `.env.local` in project root:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important**: Never commit `.env.local` to version control. Add to `.gitignore`:

```
.env.local
.env.*.local
node_modules/
```

### 3. Install & Run

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### 4. Set Firestore Security Rules

Replace default Firestore rules with (in Firebase Console):

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;

      // User's timers (subcollection)
      match /timers/{timerId} {
        allow read, write: if request.auth.uid == userId;
      }

      // User's event references (subcollection)
      match /eventRefs/{eventRefId} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    // Events are readable by owner or if public
    match /events/{eventId} {
      allow read: if resource.data.visibility == 'public' ||
                     request.auth.uid == resource.data.ownerId;
      allow write: if request.auth.uid == resource.data.ownerId;
      allow delete: if request.auth.uid == resource.data.ownerId;
    }

    // Share links map share IDs to events
    match /shareLinks/{shareId} {
      allow read: if true;  // Anyone can look up a share link
      allow write: if request.auth != null;  // Only authenticated users create
      allow delete: if request.auth.uid == resource.data.ownerId;
    }
  }
}
```

### 5. Configure Google OAuth

In Firebase Console → Authentication → Settings:

1. Add your app domain to authorized domains
2. Copy Client ID (if building custom auth flow)
3. Test with Google test accounts first

## Build & Deployment

### Development Build

```bash
npm run dev
```

Vite dev server at `http://localhost:5173` with:
- Hot module replacement (HMR)
- Svelte component inspector (browser DevTools)
- Console source maps for debugging

### Production Build

```bash
npm run build
```

Outputs optimized bundle to `dist/`:
- Minified JavaScript
- Tree-shaken unused code
- Automatic code splitting
- Image optimization

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Authenticate
firebase login

# Deploy
firebase deploy
```

This deploys:
- Frontend bundle (dist/)
- Firestore rules
- Hosting configuration

### Alternative Deployment

Works with any static host (Vercel, Netlify, GitHub Pages):

```bash
npm run build
# Deploy dist/ folder to your host
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/App.svelte` | Root layout, route parsing, migration modal |
| `src/lib/stores/auth.js` | Firebase auth setup, user state, sign-in/out |
| `src/lib/stores/timers.js` | Timer CRUD, cloud sync, offline persistence |
| `src/lib/stores/events.js` | Event CRUD, sharing, linked copies |
| `src/lib/stores/settings.js` | Theme, volume, sound preferences |
| `src/lib/firebase/config.js` | Firebase init, persistence config |
| `src/lib/firebase/sync.js` | Firestore queries, batch migration, helpers |
| `src/lib/components/TimerCard.svelte` | Timer UI, progress circle, alarm beep |
| `src/lib/components/EventCard.svelte` | Event countdown, share modal, delete |
| `src/lib/components/SharedEventPage.svelte` | Public event page, add to account |
| `src/lib/components/MigrationModal.svelte` | Local→cloud data migration prompt |

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

**Requires**:
- ES2020 support (native async/await, Promise)
- IndexedDB (for Firestore offline persistence)
- Web Audio API (for timer alarms)

## Performance Considerations

### Real-Time Sync

- Firestore listeners use indexed queries (ownerId)
- Real-time updates via onSnapshot (minimal overhead)
- Settings synced with debounce to prevent feedback loops
- Running timer states NOT synced (reduce writes)

### Frontend

- Svelte component compilation (< 10KB gzipped core)
- Lazy store subscriptions ($: reactive statements)
- Interval tick for time display (100ms, not 1000ms for precision)
- CSS variables for theming (no theme bundle duplication)

### Offline Mode

- localStorage limits ~5-10MB (typical app uses <1MB)
- All writes persist locally first
- Cloud sync is best-effort (errors logged, don't break UX)

## Troubleshooting

### Firebase Not Configured

If you see "Firebase is not configured" errors:

1. Check `.env.local` has all required variables
2. Restart dev server (`npm run dev`)
3. Clear browser cache/localStorage
4. Verify Firebase project exists and is active

### Share Links Don't Work

Share links are public URLs like `https://yoursite.com/e/aB3cD9eF`:

1. Ensure custom domain is authorized in Firebase
2. Firestore rules allow public read of `shareLinks`
3. Event visibility is `"public"`
4. Check browser console for 404 or permission errors

### Timers Not Syncing

If timers don't appear on other devices:

1. Verify user is signed in (check header)
2. Check network (DevTools Network tab)
3. Firestore indexes may be building (check console)
4. Try signing out and back in
5. Check Firestore security rules (see above)

### Dark Mode Not Working

1. Check `app.css` for CSS variable definitions
2. Verify `main.dark` class is applied to root
3. Browser DevTools → Inspector → check computed styles
4. Try toggling theme in settings

## Contributing

This project demonstrates modern web patterns:

- **Reactive stores** for state management
- **Offline-first architecture** with cloud sync
- **Real-time Firestore** listeners and batch operations
- **Client-side routing** for shared event pages
- **Component composition** for reusable UI

Feel free to fork, extend, and deploy!

## Future Enhancements

- Recurring event templates
- Timer presets library
- Push notifications for events
- Collaborative timers (shared with teammates)
- Time zone support for international users
- Export data (JSON/CSV)
- Analytics dashboard

---

Built with Svelte 5 + Firebase. No external UI frameworks, pure component-driven design.
