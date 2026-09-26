# Auth Session Storage — Decision Record

**Decided:** 2026-09-25 · **Issue:** [#316](https://github.com/chrisrauh/shakuhachi-ro/issues/316)

## What the app does

The Supabase session lives in `localStorage` under `sb-<project-ref>-auth-token`, as a
JS-readable value. This is the `@supabase/supabase-js` default — `src/api/supabase.ts`
calls `createClient()` with no storage options. There are no auth cookies.

**Authorization is enforced by Row Level Security**, not by application code. Every
ownership check in `src/api/scores.ts` runs in the client's own browser and is
trivially bypassable (the lone exception is `/api/purge-score`, which guards a cache
operation rather than data — see below); the `.eq('user_id', user.id)` filters on update and delete are
query filters, not constraints. The policies in
`database/migrations/rls_policies_scores.sql` are the actual boundary. Client-side
checks exist for UX — hiding buttons, redirecting — and nothing more.

## Why not httpOnly cookies

CLAUDE.md previously required _"No auth tokens in localStorage (tokens belong in
httpOnly cookies only)"_. That line was never implemented. It first appeared in
`docs/AUTH-TESTING-GUIDE.md` (Feb 2026) as an aspirational "expected behavior" bullet,
a month after auth shipped with the supabase-js defaults, and was later condensed into
CLAUDE.md. `docs/AUTH-REQUIREMENTS.md`, the only actual auth design record, deliberately
chose client-side auth and never mentions cookies.

The requirement was also aimed at the wrong target. httpOnly does not prevent XSS
damage — an attacker with script execution can issue authenticated requests from the
victim's browser regardless of where the token is kept. What it prevents is token
_exfiltration_: it downgrades "permanent account takeover from the attacker's machine"
to "abuse while the page is open." Real, but second-order to preventing script
execution in the first place.

Two alternatives were considered and rejected:

**`@supabase/ssr` with cookie storage** gives _zero_ XSS improvement. Its
`createBrowserClient` reads the session from `document.cookie`, so the cookie must stay
JS-readable — an attacker reads it exactly as easily as `localStorage`. The real gains
(server-side route guards, no avatar flash on load) are UX and correctness, not
security, and would not justify the change on security grounds.

**Server-only auth with genuine httpOnly cookies** is the only option that stops
exfiltration, but it requires every mutation to move behind our own endpoints carrying
an ambient cookie. That creates a CSRF requirement the current bearer-token model does
not have, and it pressures toward a service-role key on the server — replacing a
declarative, fail-closed boundary (RLS) with hand-written checks in every endpoint.
That is a plausible net security _regression_, and disproportionate for a public
library of shakuhachi scores.

## Constraint on server-side auth

`src/api/supabase.ts` exports a **module-level singleton**. On Netlify Functions,
module scope persists across invocations in a warm container.

This is safe only because the server never _authenticates_ that client. Astro
frontmatter calls read-only functions (`getScoreBySlug`, `getScore`, `getAllScores`,
`searchScores`) and nothing else. **Server-side auth must never attach a session to the
singleton** — doing so would let user A's session serve user B's request. Anything that
needs to act _as_ a user must construct a per-request client.

### The one server-side check, and why it does not break this

`src/pages/api/purge-score.ts` verifies a bearer token so it can decide who may
invalidate a cached score page (#390). It calls `supabase.auth.getUser(token)` on the
singleton, which is safe because **verifying a token is not the same as adopting it**:

- `getUser(jwt)` with an explicit argument returns early into a one-off `GET /user` with
  a per-call `Authorization` header. It never calls `_saveSession`, never writes to
  storage, and never emits an auth state change — so `getSession()` still returns
  whatever it did before, which on the server is nothing.
- PostgREST requests pick their bearer token from `getSession()`, falling back to the
  anon key. Since the verification leaves no session behind, a later `supabase.from(...)`
  on that client still runs as anon.

So the endpoint learns _who is asking_ without the client ever acting as them. The
ownership check compares `user_id` explicitly rather than relying on RLS to scope the
query — RLS cannot help here, because the read it performs is public to everyone.

This endpoint guards a cache operation, not data. Purging only forces a page to be
re-rendered from the database; nothing is disclosed or written. It is **not** a
precedent for moving authorization out of RLS.

## What actually protects the session

Ranked by what matters:

1. **RLS policies** — the only real authorization boundary. See
   `database/migrations/rls_policies_scores.sql`. Policies are inert unless RLS is
   also enabled on the table; check `pg_class.relrowsecurity`, not just `pg_policies`.
2. **No XSS** — user-supplied score content must never reach the DOM unescaped. Use
   `embedJson()` (`src/utils/embed-json.ts`) for data embedded in
   `<script type="application/json">` blocks, and `escapeHtml()` for values
   interpolated into `innerHTML`. Note that `escapeHtml()` does not escape quotes, so
   it is not safe for HTML attribute values — set those as DOM properties instead.
3. Token storage location — a distant third, and the reason this document exists.
