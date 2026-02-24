# Auth Flow Requirements

## Goals

1. **No duplicate API calls** - Data loading methods (e.g., `loadScores()`) should be called exactly once per meaningful auth state change
2. **Leverage Supabase directly** - Minimize custom wrappers/gates on top of Supabase's auth API

## Supabase Auth Events Reference

Supabase `onAuthStateChange` fires with these events:

| Event | When it fires |
|-------|---------------|
| `INITIAL_SESSION` | On subscription setup, with current session (or null) |
| `SIGNED_IN` | User signs in |
| `SIGNED_OUT` | User signs out |
| `TOKEN_REFRESHED` | Access token refreshed (background, ~hourly) |
| `USER_UPDATED` | User metadata updated |

## Expected Behavior by Scenario

### Scenario 1: Page load (logged out)
- **Trigger:** User opens Library page, no session exists
- **Expected API calls:**
  - 1x auth check
  - 1x `getAllScores()`
- **UI:** Shows public library only

### Scenario 2: Page load (logged in)
- **Trigger:** User opens Library page, session exists
- **Expected API calls:**
  - 1x auth check
  - 1x `getUserScores()`
  - 1x `getAllScores()`
- **UI:** Shows "My Scores" + Library sections

### Scenario 3: Page reload (logged in)
- **Trigger:** User refreshes page while logged in
- **Expected behavior:** Same as Scenario 2
- **Session:** Must persist (user stays logged in)

### Scenario 4: Sign in
- **Trigger:** User completes login flow
- **Expected API calls:**
  - 1x `getUserScores()`
  - 1x `getAllScores()`
- **UI:** Updates to show "My Scores" section

### Scenario 5: Sign out
- **Trigger:** User clicks logout
- **Expected API calls:**
  - 1x `getAllScores()`
- **UI:** Updates to show public library only

### Scenario 6: Token refresh (background)
- **Trigger:** Supabase refreshes token (~hourly)
- **Expected API calls:** None (user didn't change)
- **UI:** No visible change

### Scenario 7: Navigation between pages (logged in)
- **Trigger:** User navigates from Library to Score detail and back
- **Expected:** Each page loads its own data once, no extra calls

## Questions to Answer

1. **Do we need a custom AuthStateManager at all?**
   - What does it provide that direct Supabase subscription doesn't?

2. **What triggers `loadScores()` currently?**
   - Component mount?
   - Auth state change callback?
   - Both? (this would cause duplicates)

3. **What's the contract between auth and components?**
   - Option A: Component subscribes, gets ONE callback with current state, then updates on changes
   - Option B: Component calls `getUser()` on mount, subscribes for future changes only
   - Option C: Something else?

4. **How does Supabase recommend handling this?**
   - What's the idiomatic pattern?

## Constraints

- Must work with Supabase's auth API (not fight against it)
- Session must persist across page reloads
- Solution should be simple and maintainable
- Avoid special-case logic (e.g., "skip if event is X and condition Y")

## Key Insight: Separation of Concerns

**The problem is NOT in auth - it's in the Library page initialization.**

Current broken logic:
1. Library subscribes to auth
2. Auth fires with `null` user (not initialized yet)
3. Library sees `null`, but waits for "change" to load
4. Auth fires again with `null` user (confirmed logged out)
5. Library sees `null → null`, thinks "no change", skips loading
6. **Result:** Scores never load

The issue: **Library is conflating "auth state changed" with "I need to load data"**

### Correct Mental Model

These are separate concerns:

| Concern | Responsibility |
|---------|----------------|
| Auth state | Tell me WHO the user is (or null) |
| Data loading | Load appropriate data based on current user |

**Library should:**
- Load data on mount (always)
- Reload data when auth state *actually* changes (sign in/out)

**Library should NOT:**
- Wait for auth to "settle" before loading
- Skip loading because user "didn't change"
- Assume null → null means "do nothing"

### The Real Question

Does Library need to subscribe to auth at all for initial load?

- **Initial load:** Just call `getUser()` once, then load appropriate data
- **Auth changes:** Subscribe to handle sign in/out during page lifetime

This separates:
1. "What user do I have right now?" (sync question, for initial load)
2. "Did the user change?" (async events, for live updates)

## Current Implementation Issues

### Finding: Page is statically pre-rendered

```javascript
// src/pages/index.astro
export const prerender = true;  // Static HTML at build time
```

**Consequence:** No server-side auth possible. Page is built once at deploy time, auth is entirely client-side.

### Current client-side flow

1. Static HTML loads
2. Client JS initializes `ScoreLibrary`
3. `ScoreLibrary` constructor subscribes to `authState`
4. `authState` calls `getCurrentUser()` (async)
5. Meanwhile, subscription fires with `null` (not initialized)
6. `getCurrentUser()` resolves → may fire again
7. **Race conditions and duplicate calls**

## Two Approaches

### Option A: Server-side auth (recommended?)

Remove `prerender = true` from `index.astro`:
- Astro checks auth at request time
- Passes user to page as data
- `ScoreLibrary` receives user as prop, no waiting
- No race conditions

**Pros:**
- Clean, no client-side auth complexity
- Page renders with correct state immediately
- SEO benefits (content in initial HTML)

**Cons:**
- Requires server-side Supabase setup
- Page is no longer static (slightly slower first load)
- Need to handle auth cookies/headers

### Option B: Client-side, but simpler

Keep static page, but fix client-side logic:
- `ScoreLibrary` loads data on mount, always
- Uses `getUser()` result directly (not subscription)
- Subscription only for live updates after initial load

**Pros:**
- Keeps static page (faster CDN delivery)
- Less infrastructure change

**Cons:**
- Still has brief "loading" state
- More client-side logic to manage

## Decision Needed

Which approach fits the project better?

- **Option A** if: We want SSR, SEO matters, willing to add server auth
- **Option B** if: Static pages preferred, simpler deployment

## Recommendation: Static + Simple Client-Side

Based on standard practice (Wikipedia, etc.):

**"Static for anonymous, dynamic for authenticated"**

- Most users are logged out → serve fast static/cached HTML from CDN
- Logged-in users get personalization via client-side JS

### Why this works for Shakuhachi

| User type | What they see | Caching |
|-----------|---------------|---------|
| Logged out | Public library (same for everyone) | Highly cacheable |
| Logged in | "My Scores" + public library | Personalized via JS |

### Simplified client-side flow

```
1. Page loads (static HTML)
2. ScoreLibrary mounts
3. Call getUser() once (async)
4. Load data based on result:
   - user exists → getUserScores() + getAllScores()
   - no user → getAllScores()
5. Subscribe to auth changes for live updates (sign in/out)
```

**Key insight:** Don't conflate "initial load" with "auth state changes"

- Initial load: one-time, uses `getUser()` result directly
- Auth changes: subscription, only fires on actual sign in/out

### What to remove/simplify

Current complexity that may not be needed:
- `AuthStateManager` singleton with `isInitialized` flag
- Firing callbacks immediately vs waiting
- Filtering `INITIAL_SESSION` events

Simpler approach:
- `ScoreLibrary` calls `supabase.auth.getUser()` directly on mount
- `ScoreLibrary` subscribes to `onAuthStateChange` for live updates
- No intermediate state manager needed?

## Decision: Remove AuthStateManager

### Analysis (applying engineering principles)

| Principle | Analysis |
|-----------|----------|
| **KISS** | AuthStateManager adds `isInitialized`, `INITIAL_SESSION` filtering, subscriber management. This complexity exists to work around race conditions we created. |
| **YAGNI** | "Abstraction in case we switch from Supabase" is hypothetical. We're not planning to switch. |
| **Abstraction with Intent** | `auth.ts` already provides a thin wrapper. AuthStateManager is a second layer that duplicates Supabase's internal state. |

### What Supabase already provides

- **Session caching**: Supabase caches session in memory after first call
- **State change events**: `onAuthStateChange` fires on sign in/out/refresh
- **Current user**: `getUser()` returns cached user (fast after first call)

### What AuthStateManager adds (unnecessarily)

| Feature | Why it's not needed |
|---------|---------------------|
| `this.user` cache | Supabase already caches this |
| `this.session` cache | Supabase already caches this |
| `isInitialized` flag | Only needed because we created race conditions |
| `INITIAL_SESSION` filtering | Fighting Supabase instead of using it correctly |
| `listeners` array | Duplicates Supabase's subscription system |

### New architecture

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│  ScoreLibrary   │────▶│   auth.ts    │────▶│   Supabase   │
│  (component)    │     │ (thin wrapper)│     │   (client)   │
└─────────────────┘     └──────────────┘     └──────────────┘
```

- `auth.ts` stays (thin wrapper, easy to swap providers if ever needed)
- `authState.ts` removed (unnecessary state layer)
- Components call `auth.ts` functions directly

### Migration

1. Remove `authState.ts`
2. Update `ScoreLibrary` to use `auth.ts` directly:
   - `getCurrentUser()` on mount
   - `onAuthStateChange()` for live updates
3. Update other consumers (AuthWidget, index.astro, etc.)

## Key Finding: Supabase Event Ordering

When a page loads with an existing session, Supabase fires **multiple events**:

```
SIGNED_IN (session restored from storage)
INITIAL_SESSION (here's your authoritative initial state)
```

**The correct pattern:**

```typescript
let hasInitialSession = false;

onAuthStateChange((user, session, event) => {
  if (event === 'INITIAL_SESSION') {
    // This is the authoritative initial state
    hasInitialSession = true;
    currentUser = user;
    loadData();
  } else if (hasInitialSession) {
    // Only react to changes AFTER initial session
    const userChanged = currentUser?.id !== user?.id;
    if (userChanged) {
      currentUser = user;
      loadData();
    }
  }
  // Ignore: events before INITIAL_SESSION (e.g., SIGNED_IN on session restore)
  // Ignore: TOKEN_REFRESHED, USER_UPDATED (no data reload needed)
});
```

**Why this works:**
- `INITIAL_SESSION` is always the authoritative "starting state"
- Events before it (like `SIGNED_IN` on restore) are implementation details
- After `INITIAL_SESSION`, only react to actual user changes
