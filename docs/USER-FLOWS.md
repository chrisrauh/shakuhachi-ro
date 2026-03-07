# User Flows

UX analysis of shakuhachi.ro — all flows derived from the codebase.

---

## 1. Browse & Discover Scores

**Entry:** User lands on `/` (Home/Library page)

1. Page loads all scores from the database
2. If logged in: "My Scores" section appears above "Library" section
3. Scores display as cards in a responsive grid:
   - Title (with fork icon badge if forked)
   - Composer
   - Description (truncated)
   - License/rights badge (when present)
   - Fork count
   - Relative timestamp (e.g., "2 days ago")
4. User types in search bar → real-time filter on title and composer (case-insensitive)
5. If no results: "No scores found" message with "Clear Filters" button
6. User clicks a score card → navigates to `/score/{slug}`

**Variants:**
- Anonymous user sees only "Library" section
- Authenticated user sees "My Scores" + "Library" (other users' scores)
- Empty states: "You haven't created any scores yet" (My Scores) / "No scores found" (Library)

---

## 2. View a Score

**Entry:** User navigates to `/score/{slug}` (via card click, shared link, or direct URL)

1. Server fetches score by slug and renders the detail page
2. Score renders as SVG notation using the shakuhachi renderer web component
3. Metadata displayed: title, composer, description
4. If forked: "forked from {parent title}" link shown, clicking navigates to parent score
5. Fork count badge displayed if > 0
6. Relative timestamp shown (e.g., "2 days ago")
7. Attribution section shown when present:
   - Source description text
   - Rights/license badge
   - Source URL as clickable link

**Available actions (contextual):**
- **Fork** button (visible to all users, requires auth to execute)
- **Edit** button (owner only, appears in header and mobile menu)
- **Delete** button (owner only, appears in mobile menu)

**Error states:**
- Score not found → 404 page with "Back to Library" link
- Network error → error toast

---

## 3. Sign Up

**Entry:** User clicks "Sign Up" in header auth widget or mobile menu

1. Auth modal opens in "Sign Up" mode
2. User enters email and password (min 6 characters)
3. User clicks "Sign Up" button
4. Button shows "Signing up..." loading state
5. On success: modal closes, UI updates to show logged-in state (auth widget changes)
6. On error: inline error message displayed below form fields

**Alternate path:**
- User clicks "Already have an account? Log in" → modal switches to Login mode

---

## 4. Log In

**Entry:** User clicks "Log In" in header auth widget or mobile menu

1. Auth modal opens in "Login" mode
2. User enters email and password
3. User clicks "Log In" button
4. Button shows "Logging in..." loading state
5. On success: modal closes, session established, UI updates
6. On error: inline error message displayed

**Alternate path:**
- User clicks "Need an account? Sign up" → modal switches to Sign Up mode

---

## 5. Log Out

**Entry:** User clicks "Log Out" in header auth widget or mobile menu

1. Session cleared via Supabase
2. UI reverts to anonymous state (Login/Sign Up buttons reappear)
3. No automatic redirect — user stays on current page
4. Protected features become inaccessible (edit, delete, fork actions show auth prompts)

---

## 6. Create a New Score

**Entry:** User clicks "Create score" in header or mobile menu

1. Auth check — if not logged in, redirect to `/`
2. Empty score created in database with random slug
3. Redirect to `/score/{slug}/edit`
4. Editor loads with empty fields (title, composer, description, data)
5. User fills in metadata and notation data
6. Format selector: JSON (default), MusicXML, or ABC
7. Live preview renders the score as the user types
8. Save status indicator shows "Saved X ago" feedback
9. Auto-save runs in background (see Flow 14: Auto-save & Draft Recovery)
10. Unsaved changes trigger browser `beforeunload` warning if navigating away

**Mobile behavior:**
- Toggle between "Preview" and "Edit" tabs (not side-by-side)
- Default state: Editor tab active on load

---

## 7. Edit an Existing Score

**Entry:** User clicks "Edit" button on score detail page (owner only)

1. Navigate to `/score/{slug}/edit`
2. Auth + ownership check:
   - Not logged in → redirect to `/score/{slug}` (view page)
   - Not the owner → error toast "You do not have permission to edit this score" + redirect to view page
3. Editor loads with existing score data
4. User modifies metadata or notation data
5. Live preview updates in real time
6. Auto-save behavior same as creation flow (see Flow 14)
7. Format switch: if converting between formats fails, confirmation dialog offers to clear content and switch

**Validation errors:**
- Invalid JSON → parse error message displayed in editor
- Invalid MusicXML → XML parsing error shown
- Invalid ABC → format error shown

**Save errors:**
- Auto-save failure → persistent error toast "Auto-save failed: {message}"
- Manual save failure → error toast "Error saving score: {message}"

---

## 8. Fork a Score

**Entry:** User clicks "Fork" button on any score's detail page

1. Auth check — if not logged in: error toast "Please sign in to fork this score" → flow ends
2. Confirmation dialog: "Fork '{title}'? This creates your own editable copy."
3. User clicks "Confirm"
4. New score created with:
   - Same title, composer, and data as the original
   - `forked_from` linking to parent score
   - Current user as owner
5. Parent score's `fork_count` incremented
6. Redirect to the new forked score's view page (`/score/{new-slug}`)

**Post-fork:** User can edit their forked copy independently.

---

## 9. Delete a Score

**Entry:** User clicks "Delete" button on their score's detail page (mobile menu or icon button)

1. Confirmation dialog: "Delete '{title}'? This cannot be undone."
2. User clicks "Confirm"
3. Score deleted from database
4. Success toast shown
5. Redirect to home page (`/`)
6. Success banner displayed at top of page: "'{title}' was deleted." (carried via sessionStorage across navigation, dismissible)

---

## 10. Switch Theme (Light/Dark)

**Entry:** User clicks theme toggle button (sun/moon icon) in header or mobile menu

1. Theme toggles between light and dark
2. `data-theme` attribute updated on `<html>` element
3. CSS variables cascade to restyle all components
4. Preference persisted (localStorage or browser default)

---

## 11. Mobile Navigation

**Entry:** User taps hamburger/3-dot menu icon (visible below 768px)

1. Dropdown menu opens (positioned top-right, 192px min-width)
2. Menu items adapt to context:
   - **Always:** Library, Create score, About, Theme toggle
   - **On own score:** Edit score, Delete score
   - **Anonymous:** Log In, Sign Up
   - **Authenticated:** Account email display (non-interactive), Log Out
3. Tapping an item executes the action and closes the menu
4. Tapping outside the menu closes it
5. Menu items update dynamically on auth state change (login/logout)

---

## 12. Share a Score (Passive)

**Entry:** User copies the score URL from the browser address bar

1. URL format: `https://shakuhachi.ro/score/{slug}`
2. Recipient opens the link (optimized for mobile viewing)
3. Score renders without requiring authentication
4. Recipient can fork the score if they sign up/log in

**Note:** No explicit "Share" or "Copy Link" button exists — sharing is via native browser URL copying.

---

## 13. Navigate via About Page

**Entry:** User clicks "About" in header or mobile menu

1. About page loads at `/about`
2. Page shows example scores and information about the platform
3. User can navigate back to Library or click score examples

---

## 14. Auto-save & Draft Recovery

**Context:** Active during score creation (Flow 6) and editing (Flow 7)

**Auto-save layers:**
1. **Local storage** — saves every 30 seconds as a draft
2. **Database** — debounced save after 5 seconds of inactivity (max 2-minute wait)

**Save feedback:**
- Save status indicator shows "Saved X ago" in the editor
- Auto-save failure → persistent error toast (does not auto-dismiss)

**Draft recovery:**
- On editor page load, checks localStorage for an existing draft
- If draft found and newer than DB version, restores from local draft
- If draft is corrupted or unparseable, clears localStorage and shows error toast

**Navigation protection:**
- Unsaved changes trigger browser `beforeunload` confirmation dialog

---

## 15. Legacy URL Redirects

**Handled automatically — no user action required:**

| Legacy URL | Redirects To |
|---|---|
| `/editor` | `/score/new/edit` |
| `/score?slug=X` | `/score/X` |
| Any unmatched path | 404 page with "Back to Library" link |

---

## 16. Error Recovery

**Score not found:**
- Visiting `/score/{invalid-slug}` → 404 error page
- Page shows message and "Back to Library" link

**Score load failure:**
- Network or database error while loading → error toast with details
- User can retry by refreshing

**Editor validation errors:**
- Invalid data format (JSON/MusicXML/ABC) → inline error message in editor
- Live preview does not render; error message describes the issue

**Auto-save failure:**
- Persistent toast notification (does not auto-dismiss): "Auto-save failed: {message}"
- Local storage draft still available as fallback

**Score creation failure:**
- "Failed to create score" error toast
- User remains on current page

---

## Summary: Flow Access by Auth State

| Flow | Anonymous | Authenticated (non-owner) | Owner |
|------|-----------|--------------------------|-------|
| Browse scores | Yes | Yes | Yes |
| View score | Yes | Yes | Yes |
| Search scores | Yes | Yes | Yes |
| Sign up / Log in | Yes | — | — |
| Log out | — | Yes | Yes |
| Create score | No (redirect) | Yes | Yes |
| Edit score | No (redirect) | No (redirect + error) | Yes |
| Delete score | No | No | Yes |
| Fork score | No (error toast) | Yes | Yes |
| Switch theme | Yes | Yes | Yes |
| Share (copy URL) | Yes | Yes | Yes |

---

## Features Not Present

Notable UX capabilities the app does **not** currently have:

- **Account management** — No profile page, settings, or password reset/change
- **Share button** — No "Copy Link" or social share UI; sharing is via browser URL bar only
- **Social previews** — No OG tags or Twitter/Discord embed cards for shared links
- **Embed codes** — No "Embed this score" widget for external websites
- **Export / Download** — No PDF, MusicXML, or image export from scores
- **Keyboard shortcuts** — No hotkeys in the score viewer or editor
- **Offline mode** — No service worker or offline caching
- **Pagination** — Library loads all scores at once (no infinite scroll or pages)
- **Email notifications** — No notification system for forks, comments, or activity
- **Comments / Annotations** — No commenting or discussion on scores
