# Duplicate API Calls - Test Plan

**Status: Tests PASSING with Broken Implementation ✓**

## Summary
- Test file created: `src/api/authState.test.ts`
- 4 tests written verifying broken behavior
- All tests currently PASS (as expected with broken code)
- Tests verify:
  1. subscribe() does NOT fire immediately
  2. INITIAL_SESSION fires all subscribers
  3. Multiple subscribers each get called
  4. Internal state updates correctly

## Overview
This document specifies all tests and DevTools flows required to verify the duplicate API calls fix is working correctly.

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

