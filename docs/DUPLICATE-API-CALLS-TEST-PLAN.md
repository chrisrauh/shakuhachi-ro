# Duplicate API Calls - Test-Driven Fix

**Status: ✅ COMPLETE - All Tests Passing**

## TDD Workflow Summary

### Phase 1: Specification ✅
- Created comprehensive test plan with unit tests and DevTools flows
- Documented broken vs fixed behavior expectations
- Identified key scenarios to verify

### Phase 2: Tests Written (Broken Implementation) ✅
- Created `src/api/authState.test.ts` with 9 comprehensive tests
- Tests initially ran against broken implementation
- Tests documented the problematic behavior:
  - `subscribe()` does NOT fire immediately (broken)
  - `INITIAL_SESSION` fires all subscribers without filtering
  - Multiple subscribers each get called

### Phase 3: Implementation Fixed ✅
- Updated `src/api/authState.ts`:
  - `subscribe()` now fires immediately with current state
  - `onAuthStateChange` filters `INITIAL_SESSION` duplicates
  - Tracks user changes to prevent unnecessary notifications
- Updated `src/components/ScoreLibrary.ts` to use fixed subscribe behavior

### Phase 4: Tests Pass (Fixed Implementation) ✅
- All 9 auth state tests now PASS with fixed implementation
- Tests verify:
  - `subscribe()` fires immediately ✅
  - No duplicate calls on `INITIAL_SESSION` when user unchanged ✅
  - Multiple subscribers fire immediately without duplication ✅
  - State management works correctly ✅
  - Unsubscribe removes listeners ✅

### Test Results
```
✓ src/api/authState.test.ts (9 tests) 396ms
Test Files  13 passed (13)
Tests  228 passed (228)  [+9 new auth tests]
```

---

## Unit Tests - Implementation Details

**File:** `src/api/authState.test.ts`

### Test 1: subscribe() Fires Immediately
```
✓ subscribe() fires immediately with current auth state
  - Verifies callback fires synchronously when subscribe() is called
  - Ensures components get initial state without waiting
```

### Test 2: subscribe() Fires Immediately with User
```
✓ subscribe() fires immediately with user from initialization
  - Verifies callback includes pre-loaded user from getCurrentUser()
  - Ensures no race conditions with async initialization
```

### Test 3: INITIAL_SESSION Does Not Duplicate
```
✓ INITIAL_SESSION does not fire callback if user unchanged
  - Verifies no duplicate notification when user null→null (no change)
  - Tests the core fix: preventing INITIAL_SESSION duplicates
```

### Test 4: Other Events Still Notify
```
✓ Other events still notify (TOKEN_REFRESHED, etc)
  - Verifies SIGNED_IN events still trigger callbacks
  - Ensures non-INITIAL_SESSION events work correctly
```

### Test 5: Multiple Subscribers Fire Immediately
```
✓ all subscribers fire immediately
  - Verifies all registered listeners get initial state
  - Prevents early subscribers from missing auth state
```

### Test 6: No Duplicates with Multiple Subscribers
```
✓ no duplicate calls on INITIAL_SESSION
  - Tests that even with multiple subscribers, INITIAL_SESSION doesn't cause duplicates
  - Demonstrates fix works at scale
```

### Test 7-9: State Management & Unsubscribe
```
✓ getUser() returns current state
✓ isAuthenticated() reflects state
✓ unsubscribe removes listener
  - Verify state queries work correctly
  - Verify cleanup removes listeners from notifications
```

---

## Manual DevTools Testing Flows

### Prerequisites
- Start dev server: `npm run dev`
- Open Chrome DevTools on page
- Use Network tab to filter: `fetch/xhr`
- Use Console tab to check for errors

### Test 1: Fresh Page Load (Logged Out)
**Expected: 2 requests total**

```
Steps:
1. Open incognito window
2. Navigate to http://localhost:3003
3. Wait for page to fully load
4. Check Network tab

Expected Requests:
├── GET /auth/v1/user (200, no user)
└── GET /scores (getAllScores)

Success Criteria:
✓ Exactly 2 requests
✓ No duplicate getAllScores
✓ Page shows "Log In" / "Sign Up" buttons
✓ Console has no auth errors
```

### Test 2: Fresh Page Load (Logged In)
**Expected: 3 requests total**

```
Steps:
1. Login first (or use existing session)
2. Open DevTools → Network tab
3. Navigate to http://localhost:3003 (fresh page)
4. Wait for load

Expected Requests:
├── GET /auth/v1/user (200, with user)
├── GET /scores?user_id=... (getUserScores)
└── GET /scores (getAllScores)

Success Criteria:
✓ Exactly 3 requests
✓ No duplicate calls
✓ Page immediately shows user email
✓ "My Scores" section appears
```

### Test 3: Page Reload (Logged In)
**Expected: 3 requests, session persists**

```
Steps:
1. Login and navigate to home page
2. Open DevTools → Network tab
3. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
4. Wait for load

Expected Requests:
├── GET /auth/v1/user (validates session from cookies)
├── GET /scores?user_id=...
└── GET /scores

Success Criteria:
✓ Exactly 3 requests (same as fresh logged-in load)
✓ NO flicker from logged-out to logged-in
✓ User immediately appears in UI
✓ Session cookie used (no new login needed)
```

### Test 4: Login Flow
**Expected: Clean sequence without duplicates**

```
Steps:
1. Open DevTools → Network tab
2. On home page (logged out), click "Log In"
3. Enter test credentials:
   Email: chris+shakuhachi+test@rauh.net
   Password: computer
4. Submit and observe network

Expected Sequence:
├── POST /auth/v1/token (login request)
├── GET /scores?user_id=... (getUserScores)
└── GET /scores (getAllScores)

Success Criteria:
✓ 1 login request
✓ 2 load requests (getUserScores + getAllScores)
✓ No duplicate getAllScores calls
✓ UI immediately updates (no flickering)
✓ "My Scores" section appears after login
```

### Test 5: Navigation Between Pages (Logged In)
**Expected: 1 auth check per new page, 0 duplicate score calls**

```
Steps:
1. Login on home page
2. Open DevTools → Network tab, clear it
3. Navigate: Home → About → Score Detail → Home
4. Count requests per navigation

Expected Pattern (per page navigation):
Each navigation:
├── GET /auth/v1/user (1 per page, revalidates session)
└── [Page-specific API calls]

Success Criteria:
✓ 1 auth check per page load
✓ No duplicate getAllScores across pages
✓ No extra API calls from auth state changes
```

### Test 6: Multiple Tabs (Same Session)
**Expected: Auth syncs without duplicate calls**

```
Steps:
1. Open 2 tabs to http://localhost:3003
2. Open DevTools on both → Network tabs
3. Login in Tab 1
4. Observe Tab 2 (should auto-update)

Expected Behavior:
Tab 1:
├── GET /auth/v1/user → login
├── POST /auth/v1/token
├── GET /scores?user_id=...
└── GET /scores

Tab 2:
├── GET /auth/v1/user → detects login via session
├── GET /scores?user_id=...
└── GET /scores

Success Criteria:
✓ Both tabs update to logged-in state
✓ No duplicate requests in either tab
✓ Auth synced via cookies (not duplicate API calls)
✓ "My Scores" appears on both tabs
```

---

## Console Logging (If Debug Mode Enabled)

The implementation can be instrumented with console logs to verify call sequences:

**Healthy Log Pattern:**
```
[AuthStateManager] subscribe() called, firing immediately
[ScoreLibrary] subscription callback fired
[ScoreLibrary] loadScores() called
[ScoreLibrary] calling getAllScores()
[ScoreLibrary] getAllScores() returned: X scores
```

**Unhealthy Pattern (would indicate bugs):**
```
// Bad: Multiple loadScores() calls
[ScoreLibrary] loadScores() called
[ScoreLibrary] loadScores() called  // ❌ DUPLICATE

// Bad: Multiple getAllScores() calls
[ScoreLibrary] calling getAllScores()
[ScoreLibrary] calling getAllScores()  // ❌ DUPLICATE
```

---

## Architecture Benefits

The TDD approach revealed and fixed the core architectural issue:

**The Problem:**
- `subscribe()` did NOT fire immediately → components didn't get initial state
- `INITIAL_SESSION` fired for all subscribers → duplicate notifications
- This created a two-path problem:
  - Some components get state from `getUser()` (synchronous)
  - Some components get state from `subscribe()` callback (asynchronous)
  - Race conditions and duplicates resulted

**The Solution:**
- `subscribe()` fires immediately → single path for all components
- `INITIAL_SESSION` filtered if user unchanged → no duplicates
- Clear, simple contract:
  - Subscribe = get current state immediately + future updates
  - No race conditions, no duplicate callbacks

**The Benefit:**
- Components use one consistent pattern
- No guards needed (`if (userChanged)`)
- Session persists correctly on reload
- No duplicate API calls
- Cleaner, more maintainable code

---

## Files Modified

1. **src/api/authState.ts** (Implementation)
   - subscribe() fires immediately
   - onAuthStateChange filters INITIAL_SESSION

2. **src/api/authState.test.ts** (Tests - NEW)
   - 9 comprehensive unit tests
   - Tests document expected behavior

3. **src/components/ScoreLibrary.ts** (Usage)
   - Removed double-call guard
   - Simplified to rely on subscribe()

4. **docs/DUPLICATE-API-CALLS-TEST-PLAN.md** (Documentation - NEW)
   - Complete test specification
   - DevTools manual test flows
   - Architecture rationale

---

## Verification Checklist

- [x] Unit tests written (9 tests)
- [x] Tests PASS with fixed implementation (228 total)
- [x] No regression in other tests
- [x] Type checking passes
- [x] Linting passes
- [ ] Manual DevTools testing (next phase)
- [ ] Production deployment verification

---

## Next Steps

1. **Manual Verification** (Use DevTools Flows Above)
   - Run Test 1: Fresh page load (logged out)
   - Run Test 2: Fresh page load (logged in)
   - Run Test 3: Page reload (logged in)
   - Run Test 4: Login flow
   - Run Test 5: Navigation between pages
   - Run Test 6: Multiple tabs

2. **Performance Measurement**
   - Compare before/after LCP, TTFB metrics
   - Verify getAllScores called exactly once per load

3. **Code Review**
   - Review architecture improvements
   - Verify no security implications

4. **Merge & Deploy**
   - Merge feature branch to main
   - Deploy and monitor production

---

## References

- Test file: `src/api/authState.test.ts`
- Implementation: `src/api/authState.ts`
- Usage example: `src/components/ScoreLibrary.ts`


## Unit Tests (Vitest)

### Test File: `src/api/authState.test.ts`

#### 1. Subscribe Behavior
- **Test:** `subscribe() fires immediately with current auth state`
  - Setup: Create AuthStateManager, call subscribe()
  - Verify: Callback fires synchronously with current user (null initially)
  - Purpose: Ensures components get immediate feedback

- **Test:** `subscribe() fires on actual auth changes (not INITIAL_SESSION)`
  - Setup: Create AuthStateManager, subscribe with listener count tracking
  - Trigger: Simulate auth state change (e.g., user logs in)
  - Verify: Listener fires exactly once, not twice
  - Purpose: Prevents duplicate notifications from INITIAL_SESSION

- **Test:** `multiple subscribers each get exactly one callback`
  - Setup: Create AuthStateManager, add 3 subscribers
  - Trigger: Auth state changes
  - Verify: Each subscriber's callback fires exactly once
  - Purpose: Ensures no listener receives duplicate notifications

#### 2. INITIAL_SESSION Handling
- **Test:** `INITIAL_SESSION does not notify listeners if user hasn't changed`
  - Setup: AuthStateManager with user already loaded
  - Trigger: INITIAL_SESSION event from Supabase
  - Verify: Listeners are NOT notified
  - Purpose: Prevents duplicate callback from INITIAL_SESSION

- **Test:** `INITIAL_SESSION updates internal state even if listeners not notified`
  - Setup: AuthStateManager, trigger INITIAL_SESSION
  - Verify: getUser() reflects updated state even though listeners weren't called
  - Purpose: Ensures state is current even if notifications are filtered

#### 3. State Change Events
- **Test:** `non-INITIAL_SESSION events always notify (e.g., SIGNED_IN, TOKEN_REFRESHED)`
  - Setup: AuthStateManager with subscribers
  - Trigger: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED events
  - Verify: Listeners are notified for each event
  - Purpose: Ensures real state changes are communicated

#### 4. Race Conditions
- **Test:** `subscribe() before initialization completes uses stale state`
  - Setup: Start AuthStateManager, call subscribe() before initialize() completes
  - Verify: Callback fires immediately with current state (might be null)
  - Purpose: Ensures components don't hang waiting for auth

- **Test:** `later subscribers get current state, not missed events`
  - Setup: Create AuthStateManager, user logs in, then add new subscriber
  - Verify: New subscriber gets current (logged-in) state immediately
  - Purpose: Late subscribers don't miss state changes

### Test File: `src/components/ScoreLibrary.test.ts`

#### 5. ScoreLibrary API Call Count
- **Test:** `ScoreLibrary calls loadScores() exactly once on constructor (logged out)`
  - Setup: Create ScoreLibrary with no authenticated user
  - Verify: getAllScores() called exactly 1 time
  - Purpose: No duplicate calls on page load

- **Test:** `ScoreLibrary calls loadScores() exactly once on constructor (logged in)`
  - Setup: Mock authState with authenticated user
  - Verify: getUserScores() called 1 time, getAllScores() called 1 time
  - Purpose: Correct API calls without duplication

- **Test:** `ScoreLibrary calls loadScores() exactly once when user logs in`
  - Setup: Create ScoreLibrary, then simulate login
  - Verify: loadScores() fires exactly once from subscription
  - Purpose: Auth changes don't cause duplicate API calls

---

## Integration Tests (DevTools Manual Testing)

### Test: Fresh Page Load (Logged Out)
**URL:** `http://localhost:3003`

**Steps:**
1. Open incognito window
2. Open DevTools → Network tab
3. Filter: fetch/xhr
4. Navigate to home page
5. Wait for page to fully load

**Expected Results:**
- Exactly 1 auth request: `GET /auth/v1/user` (returns 200, no user)
- Exactly 1 scores request: `GET /scores` (getAllScores)
- Total: 2 network requests
- Console logs show: `subscribe() fired immediately` → `loadScores() called`

**Success Criteria:**
- Network count: 2 requests
- No duplicate getAllScores calls
- Page shows "Log In" / "Sign Up" buttons
- Library shows no scores

---

### Test: Fresh Page Load (Logged In)
**Setup:** Must have valid session (logged in previously)

**Steps:**
1. Open DevTools → Network tab, filter: fetch/xhr
2. Open incognito window (or clear cookies first)
3. Login with test credentials
4. Navigate to home page with fresh load

**Expected Results:**
- Exactly 1 auth request: `GET /auth/v1/user` (returns 200 with user)
- Exactly 1 user scores request: `GET /scores?user_id=...`
- Exactly 1 library request: `GET /scores`
- Total: 3 network requests
- Console logs show proper order of events

**Success Criteria:**
- Network count: 3 requests
- No duplicate getAllScores or getUserScores calls
- Page shows user email and "Log Out" button
- Library shows "My Scores" section with user's scores

---

### Test: Page Reload (Logged In)
**Setup:** Start logged in

**Steps:**
1. Login and navigate to home page
2. Open DevTools → Network tab
3. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
4. Wait for full load

**Expected Results:**
- Same as "Fresh Page Load (Logged In)" - exactly 3 requests
- NO additional requests
- Session persists from cookies
- User remains logged in throughout

**Success Criteria:**
- Network count: 3 requests (same as fresh load)
- No flicker from "logged out" to "logged in"
- Page immediately shows logged-in state

---

### Test: Login Flow
**Setup:** Start on home page (logged out)

**Steps:**
1. Open DevTools → Network tab
2. Click "Log In"
3. Enter test credentials: `chris+shakuhachi+test@rauh.net` / `computer`
4. Submit form
5. Observe network requests and UI updates

**Expected Results:**
- Step 1 (login): `POST /auth/v1/token` (1 request)
- Step 2 (load scores): `GET /scores` for user, `GET /scores` for library (2 requests)
- Total: 3 requests
- UI updates: Shows user email, "Log Out" button, "My Scores" section

**Success Criteria:**
- No duplicate requests
- Network shows clean flow: login → loadScores
- Console logs don't show multiple subscription callbacks

---

### Test: Navigation Between Pages
**Setup:** Start logged in on home page

**Steps:**
1. Open DevTools → Network tab
2. Navigate: Home → About → Home
3. Count auth-related requests

**Expected Results:**
- Home page load: 3 requests (auth, getUserScores, getAllScores)
- Navigate to About: 1 request (auth revalidation)
- Navigate back to Home: 3 requests (fresh page load)
- Total per full-page navigation: 1 auth check only (no duplicate scores calls)

**Success Criteria:**
- Each page load has exactly 1 auth check
- No duplicate API calls across navigation

---

### Test: Multiple Tabs (Same Session)
**Setup:** Have 2+ tabs open to the app

**Steps:**
1. Open 2 tabs to `http://localhost:3003`
2. Open DevTools on both → Network tabs
3. Login in Tab 1
4. Observe Tab 2 (should auto-update)

**Expected Results:**
- Tab 1 network: login (1) + loadScores (2) = 3 requests
- Tab 2 network: Should show listeners firing and UI updating
- Both tabs should immediately show logged-in state
- No duplicate requests in either tab

**Success Criteria:**
- Both tabs sync without additional API calls
- Session shared via cookies
- No "flicker" between states

---

## Console Logging Guide

### Expected Console Output (Logged Out Fresh Load)
```
[AuthStateManager] initialize() completed, user: null
[AuthStateManager] onAuthStateChange event: INITIAL_SESSION new user: null
[AuthStateManager] skipping notification (INITIAL_SESSION, no user change)
[AuthStateManager] subscribe() called, firing immediately with current state
[ScoreLibrary] subscription callback fired, user: null
[ScoreLibrary] loadScores() called
[ScoreLibrary] calling getAllScores()
[ScoreLibrary] getAllScores() returned: X scores
```

**Key lines that indicate duplicate calls:**
- Multiple `[ScoreLibrary] loadScores() called` → indicates duplicate subscription
- Multiple `[ScoreLibrary] calling getAllScores()` → indicates duplicate API call
- Multiple `[AuthStateManager] notifyListeners() called` → indicates duplicate notifications

### Expected Console Output (Logged In Fresh Load)
```
[AuthStateManager] initialize() completed, user: test@example.com
[AuthStateManager] onAuthStateChange event: INITIAL_SESSION new user: test@example.com
[AuthStateManager] skipping notification (INITIAL_SESSION, no user change)
[AuthStateManager] subscribe() called, firing immediately with current state
[ScoreLibrary] subscription callback fired, user: test@example.com
[ScoreLibrary] loadScores() called
[ScoreLibrary] calling getAllScores()
[ScoreLibrary] getAllScores() returned: X scores
```

---

## Test Failure Indicators

### Signs the Fix is NOT Working:

1. **Duplicate loadScores() calls**
   - Console shows `[ScoreLibrary] loadScores() called` twice
   - Network tab shows duplicate getAllScores requests

2. **Duplicate listener notifications**
   - Console shows `[AuthStateManager] notifyListeners() called` multiple times for single event
   - Multiple callbacks fire per subscription

3. **Race condition with session**
   - Page reload shows user as logged out briefly
   - User appears logged out even with valid session cookie
   - "My Scores" section doesn't appear on page reload

4. **Listener count grows**
   - Each subscribe adds listener but doesn't remove old ones
   - Console shows increasing listener counts on repeated navigations

---

## Test Execution Checklist

### Phase 1: Implement Tests (Expect Failures)
- [ ] Write unit tests in `src/api/authState.test.ts`
- [ ] Write integration tests in `src/components/ScoreLibrary.test.ts`
- [ ] Run `npm test` - tests should FAIL on current implementation
- [ ] Verify specific failures match "Test Failure Indicators" above

### Phase 2: Implement Fix
- [ ] Update `authState.subscribe()` to fire immediately
- [ ] Update `onAuthStateChange` to filter INITIAL_SESSION duplicates
- [ ] Update `ScoreLibrary` constructor if needed

### Phase 3: Verify Tests Pass
- [ ] Run `npm test` - all tests should PASS
- [ ] Verify console logs show expected output

### Phase 4: Manual DevTools Testing
- [ ] Test: Fresh page load (logged out)
- [ ] Test: Fresh page load (logged in)
- [ ] Test: Page reload (logged in)
- [ ] Test: Login flow
- [ ] Test: Navigation between pages
- [ ] Test: Multiple tabs

### Phase 5: Cleanup
- [ ] Remove debug console.log statements
- [ ] Final test run: `npm test`
- [ ] Commit with all tests passing

---

## Files to Modify

- `src/api/authState.ts` - Core fix
- `src/api/auth.ts` - Ensure event parameter passed through
- `src/components/ScoreLibrary.ts` - Verify subscription usage
- `src/api/authState.test.ts` - NEW: Unit tests
- `src/components/ScoreLibrary.test.ts` - NEW: Integration tests (optional)

