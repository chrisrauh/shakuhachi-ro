# Auth Testing Guide

## Overview

This guide helps you thoroughly test authentication to ensure:
1. **Minimal auth requests** (performance)
2. **Maximum auth security** (no vulnerabilities)

## Testing Tools

### Chrome DevTools Network Tab
- Filter: `fetch/xhr`
- Look for: `/auth/v1/*` endpoints
- Count requests per user journey

### Chrome DevTools Application Tab
- Check: localStorage and cookies
- Verify: Session tokens are properly stored/cleared

### Chrome DevTools Console
- Watch for: Auth-related errors or warnings

---

## Test Scenarios

### 1. Fresh Page Load (Logged Out)

**Expected Behavior:**
- ✅ 1 auth check: `GET /auth/v1/user` (returns 200 with no user)
- ✅ Session persists as "logged out"
- ❌ NO auth tokens in localStorage (security)
- ✅ Cookies may contain session info (httpOnly, secure)

**Test Steps:**
1. Open incognito window
2. Navigate to `http://localhost:3003`
3. Open DevTools Network tab
4. Count `/auth/v1/*` requests

**Success Criteria:**
- Exactly 1 auth request
- UI shows "Log In" / "Sign Up" buttons
- No JavaScript errors in console

---

### 2. Login Flow

**Expected Behavior:**
- ✅ 1 auth request: `POST /auth/v1/token?grant_type=password`
- ✅ Auth state updates immediately
- ✅ UI updates to show user email
- ✅ Session persists in cookies (httpOnly, secure, sameSite)

**Test Steps:**
1. Start from logged-out state
2. Click "Log In"
3. Enter credentials and submit
4. Watch Network tab

**Success Criteria:**
- Exactly 1 login request (POST /auth/v1/token)
- UI immediately shows user email
- Application tab shows session cookie with:
  - `httpOnly: true` (prevents XSS)
  - `secure: true` (HTTPS only)
  - `sameSite: strict` or `lax`

**Security Checks:**
- ❌ NO passwords in Network tab (check request payload is encrypted)
- ❌ NO auth tokens in localStorage (XSS vulnerability)
- ✅ Tokens only in httpOnly cookies

---

### 3. Page Reload (Logged In)

**Expected Behavior:**
- ✅ 1 auth check: `GET /auth/v1/user` (validates session)
- ✅ Session persists across reload
- ✅ User stays logged in
- ❌ NO re-authentication required

**Test Steps:**
1. Log in
2. Hard reload (Cmd+Shift+R / Ctrl+Shift+R)
3. Count auth requests in Network tab

**Success Criteria:**
- Exactly 1 auth request (GET /auth/v1/user)
- UI immediately shows user email (from cookie session)
- No flicker of "Log In" button

**Performance:**
- Initial auth state should be available within 100-200ms
- INITIAL_SESSION event should fire once

---

### 4. Navigation Between Pages (Logged In)

**Expected Behavior:**
- ✅ 0 additional auth requests per page (uses cached state)
- ✅ Session persists across navigation
- ✅ Auth state managed by AuthStateManager singleton

**Test Steps:**
1. Log in on home page
2. Navigate to: About → Score Detail → Editor → Home
3. Count total auth requests

**Success Criteria:**
- Only 1 auth request on initial page load
- AuthStateManager caches user state in memory
- No auth requests on subsequent page navigations
- User remains logged in throughout

**Why This Works:**
- Each page navigation reloads the app
- But browser keeps cookies
- First page load validates session (1 request)
- AuthStateManager singleton persists in browser session

---

### 5. Logout Flow

**Expected Behavior:**
- ✅ 1 logout request: `POST /auth/v1/logout`
- ✅ Session cleared from cookies
- ✅ Auth state updates immediately
- ✅ UI updates to show "Log In" / "Sign Up"

**Test Steps:**
1. Log in
2. Click "Log Out"
3. Watch Network tab

**Success Criteria:**
- Exactly 1 logout request (POST /auth/v1/logout)
- UI immediately shows logged-out state
- Application tab shows session cookie cleared

**Security Checks:**
- ✅ Session invalidated on server (verify by trying to use old token)
- ✅ All auth state cleared from browser

---

### 6. Protected Pages (Editor)

**Expected Behavior:**
- ✅ Redirect to home/login if not authenticated
- ✅ Allow access if authenticated
- ❌ NO sensitive data exposed to unauthenticated users

**Test Steps:**
1. Log out
2. Try to access `/score/new/edit` directly
3. Verify redirect behavior

**Success Criteria:**
- Redirects immediately (client-side check)
- No editor data loaded before redirect
- After login, can access editor

**Security:**
- Client-side checks are convenience only
- Server/API MUST validate auth on all protected endpoints
- Never trust client-side auth checks for security

---

### 7. Token Refresh (Long Session)

**Expected Behavior:**
- ✅ JWT auto-refreshes before expiration
- ✅ User stays logged in seamlessly
- ❌ NO re-authentication required

**Test Steps:**
1. Log in
2. Leave tab open for 1 hour
3. Interact with app (e.g., create score)
4. Check Network tab for token refresh

**Success Criteria:**
- Token refresh happens automatically (POST /auth/v1/token?grant_type=refresh_token)
- User never sees "session expired" unless truly expired
- No interruption to user experience

**Supabase Default:**
- Access token: 1 hour expiration
- Refresh token: 30 days expiration
- Auto-refresh handled by Supabase SDK

---

### 8. Multiple Tabs (Same Session)

**Expected Behavior:**
- ✅ Login in one tab updates all tabs
- ✅ Logout in one tab logs out all tabs
- ✅ Minimal auth requests across tabs

**Test Steps:**
1. Open 2 tabs to app
2. Log in via Tab 1
3. Check Tab 2 updates
4. Log out via Tab 2
5. Check Tab 1 updates

**Success Criteria:**
- Tabs sync auth state via Supabase auth state change events
- Each tab listens to same auth events
- No duplicate auth requests

**How It Works:**
- Supabase broadcasts auth events across tabs (via BroadcastChannel API)
- Each tab's AuthStateManager subscribes to these events
- State syncs automatically

---

### 9. Expired Session

**Expected Behavior:**
- ✅ Detect expired session
- ✅ Gracefully handle by logging out
- ✅ Inform user session expired
- ❌ NO security vulnerabilities from expired tokens

**Test Steps:**
1. Log in
2. Manually expire session:
   - Application tab → Cookies → Delete session cookie
   - OR wait 30 days for refresh token expiration
3. Try to interact with app

**Success Criteria:**
- App detects session invalid
- Logs user out gracefully
- Shows message: "Your session has expired. Please log in again."
- No errors in console

---

### 10. Race Conditions

**Expected Behavior:**
- ✅ Multiple components subscribe to auth changes
- ✅ No duplicate API calls even with many subscribers
- ✅ INITIAL_SESSION fires subscription callbacks
- ✅ All components receive auth state updates

**Test Steps:**
1. Open page with multiple auth-dependent components:
   - Home page has: AuthWidget, ScoreLibrary, PageHeader
2. Count auth requests on page load
3. Log in and count auth-related API calls

**Success Criteria:**
- Exactly 1 auth check on page load (GET /auth/v1/user)
- Exactly 1 login request (POST /auth/v1/token)
- All components update simultaneously
- No duplicate `loadScores()` or other API calls

**How to Debug:**
- Add console.logs to subscription callbacks
- Verify each callback fires once per auth event
- Check Network tab for duplicate requests

---

## Security Best Practices Checklist

### Storage
- ✅ Auth tokens stored in httpOnly cookies (NOT localStorage)
- ✅ Cookies have `secure: true` flag (HTTPS only)
- ✅ Cookies have `sameSite: strict` or `lax`
- ❌ NO sensitive data in localStorage (XSS vulnerability)

### API Security
- ✅ All protected API endpoints validate JWT server-side
- ✅ Never trust client-side auth checks for security
- ✅ Use Supabase Row Level Security (RLS) policies
- ✅ API returns 401 for invalid/expired tokens

### Client-Side
- ✅ Auth state syncs across components via singleton
- ✅ Protected routes redirect unauthenticated users
- ✅ Sensitive UI elements hidden when not authorized
- ✅ No auth logic in localStorage (use Supabase SDK)

### Network
- ✅ All auth requests over HTTPS
- ✅ No auth tokens in URL query params
- ✅ No auth tokens in console logs
- ✅ CORS configured correctly (Supabase handles this)

---

## Performance Best Practices Checklist

### Minimize Requests
- ✅ 1 auth check per page load (not per component)
- ✅ AuthStateManager singleton caches user state
- ✅ Components read from cache (authState.getUser())
- ✅ Subscriptions fire on changes only (INITIAL_SESSION is exception)

### Optimize Auth Checks
- ✅ Use cached auth state for UI updates
- ✅ Only validate with server on:
  - Page load (INITIAL_SESSION)
  - Login/logout
  - Token refresh
- ❌ Don't validate on every component mount

### Reduce Latency
- ✅ Auth state available immediately from cookies
- ✅ No blocking auth checks in render path
- ✅ Async initialization doesn't block page render

---

## Common Issues & How to Debug

### Issue: Session doesn't persist on reload
**Symptoms:** User logs in, refreshes page, shows as logged out

**Debug:**
1. Check Application tab → Cookies
2. Verify session cookie exists and not expired
3. Check console for errors during auth initialization
4. Verify `authState.subscribe()` fires on INITIAL_SESSION

**Fix:**
- Ensure subscribe() listens for ALL events (including INITIAL_SESSION)
- Don't filter out INITIAL_SESSION from subscription callbacks

---

### Issue: Duplicate API calls on page load
**Symptoms:** Network tab shows 2+ identical requests

**Debug:**
1. Add console.logs to track when loadScores() is called
2. Check if component calls both:
   - Direct API call in constructor
   - Subscription callback that also calls API
3. Verify INITIAL_SESSION doesn't fire twice

**Fix:**
- Remove direct API calls in constructor
- Rely on subscription callback (fires on INITIAL_SESSION)
- Use guards if needed: `if (this.isLoading) return;`

---

### Issue: Components don't update on auth changes
**Symptoms:** Login succeeds but UI still shows "Log In" button

**Debug:**
1. Check if component subscribes to authState
2. Verify subscription callback updates component state
3. Check if component calls `subscribe()` too late (after INITIAL_SESSION)

**Fix:**
- Subscribe to authState in component initialization
- Handle initial state explicitly: `authState.getUser()`
- Ensure subscription callback re-renders component

---

### Issue: Auth tokens in localStorage (security risk)
**Symptoms:** Tokens visible in Application tab → Local Storage

**Debug:**
1. Check Application tab → Local Storage
2. Search for keys containing "token", "auth", "session"
3. Verify only non-sensitive data in localStorage

**Fix:**
- Use Supabase SDK (handles cookie storage automatically)
- Never manually store auth tokens in localStorage
- Tokens should only be in httpOnly cookies

---

## Testing Checklist (Summary)

### Before Merging PR

- [ ] Fresh page load (logged out): 1 auth request
- [ ] Login flow: 1 login request, session persists
- [ ] Page reload (logged in): 1 auth request, stays logged in
- [ ] Navigation between pages: 0 additional auth requests
- [ ] Logout flow: 1 logout request, session cleared
- [ ] Protected pages: Redirect when not authenticated
- [ ] Multiple tabs: Auth syncs across tabs
- [ ] No auth tokens in localStorage
- [ ] Cookies have httpOnly, secure, sameSite flags
- [ ] No duplicate API calls on any page
- [ ] No console errors related to auth
- [ ] All tests pass: `npm test`

### Security Audit

- [ ] All API endpoints validate auth server-side
- [ ] RLS policies enabled on all protected tables
- [ ] No passwords or tokens in Network tab (unencrypted)
- [ ] HTTPS enforced in production
- [ ] CORS configured correctly
- [ ] Client-side auth checks are convenience only (not security)

### Performance Audit

- [ ] Maximum 1 auth request per page load
- [ ] AuthStateManager singleton prevents duplicate calls
- [ ] Components use cached auth state (authState.getUser())
- [ ] No blocking auth checks in critical render path
- [ ] Token refresh happens automatically before expiration

---

## Running the Test Suite

### Manual Testing (with DevTools)
```bash
# Start dev server
npm run dev

# Open Chrome DevTools
# - Network tab (filter: fetch/xhr)
# - Application tab (cookies & localStorage)
# - Console tab (watch for errors)

# Run through all test scenarios above
```

### Automated Testing
```bash
# Run all tests
npm test

# Unit tests
npm run vitest

# Visual regression tests
npm run test:visual

# Type checking
npm run type-check

# Linting
npm run lint
```

### Test with Real Scenarios
```bash
# Test account credentials (from .env)
TEST_EMAIL=chris+shakuhachi+test@rauh.net
TEST_PASSWORD=computer

# Test flows:
1. Login → Create score → Edit → Save → Logout
2. Login → View score → Fork → Edit fork → Logout
3. Login → View own score → Edit button appears
4. Logout → View own score → Edit button hidden
5. Login in Tab 1 → Tab 2 auto-updates
6. Logout in Tab 2 → Tab 1 auto-logs out
```

---

## Expected Auth Request Counts

### By Page (Logged Out)
- **Home:** 1 auth check
- **About:** 1 auth check
- **Score Detail:** 1 auth check
- **Editor (redirects):** 1 auth check

### By Page (Logged In)
- **Home:** 1 auth check + score requests
- **About:** 1 auth check
- **Score Detail:** 1 auth check
- **Editor:** 1 auth check

### By User Journey (Logged In)
- **Login:** 1 auth check + 1 login request
- **Page Reload:** 1 auth check (validates session)
- **Navigation:** 1 auth check per page (new page load)
- **Logout:** 1 logout request
- **Edit Score:** 0 additional auth (uses cached state)

### Total for Full Session
```
1. Fresh load (logged out): 1 auth check
2. Login: 1 login request
3. Navigate to About: 1 auth check (new page)
4. Navigate to Score: 1 auth check (new page)
5. Navigate to Editor: 1 auth check (new page)
6. Logout: 1 logout request

Total: 6 requests (all necessary)
```

---

## Supabase Auth Best Practices

### Client Configuration
```typescript
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,        // Store session in cookies
    autoRefreshToken: true,      // Auto-refresh before expiry
    detectSessionInUrl: true,    // Handle OAuth redirects
    storageKey: 'supabase.auth', // Cookie name
  }
});
```

### RLS Policies (Server-Side Security)
```sql
-- Example: Users can only update their own scores
CREATE POLICY "Users can update own scores"
ON scores
FOR UPDATE
USING (auth.uid() = user_id);

-- Example: Anyone can read public scores
CREATE POLICY "Anyone can read scores"
ON scores
FOR SELECT
USING (true);
```

### Auth Helpers
```typescript
// Good: Use Supabase SDK methods
const { data: { user } } = await supabase.auth.getUser();
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// Bad: Manual token handling
localStorage.setItem('token', token); // ❌ XSS vulnerability
```

---

## Monitoring Auth in Production

### Metrics to Track
- **Auth request count** (should be low)
- **Failed auth attempts** (potential attacks)
- **Token refresh rate** (should be ~1/hour per active user)
- **Session duration** (average user session length)

### Alerts to Set Up
- Spike in failed auth attempts (> 10/min)
- Spike in auth requests (> 1000/min)
- Auth endpoint downtime (> 30s)
- Expired session errors (> 5% of requests)

### Logging
```typescript
// Log auth events for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, {
    user: session?.user?.email,
    timestamp: new Date().toISOString(),
  });
});
```

---

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)

---

## Next Steps

After completing this testing guide:

1. ✅ Run through all test scenarios
2. ✅ Verify auth request counts
3. ✅ Check security checklist
4. ✅ Run automated test suite
5. ✅ Document any findings in PR
6. ✅ Get code review
7. ✅ Merge to main
8. ✅ Monitor production metrics
