# Auth Session Storage — Decision Record

**Decided:** 2026-09-25 · **Issue:** [#316](https://github.com/chrisrauh/shakuhachi-ro/issues/316)

## What the app does

The Supabase session lives in `localStorage` under `sb-<project-ref>-auth-token`, as a
JS-readable value. This is the `@supabase/supabase-js` default — `src/api/supabase.ts`
calls `createClient()` with no storage options. There are no auth cookies.

**Authorization is enforced by Row Level Security**, not by application code. Every
ownership check in `src/api/scores.ts` runs in the client's own browser and is
trivially bypassable; the `.eq('user_id', user.id)` filters on update and delete are
query filters, not constraints. The policies in
`database/migrations/rls_policies_scores.sql` are the actual boundary. Client-side
checks exist for UX — hiding buttons, redirecting — and nothing more.

## Why not httpOnly cookies

CLAUDE.md previously required *"No auth tokens in localStorage (tokens belong in
httpOnly cookies only)"*. That line was never implemented. It first appeared in
`docs/AUTH-TESTING-GUIDE.md` (Feb 2026) as an aspirational "expected behavior" bullet,
a month after auth shipped with the supabase-js defaults, and was later condensed into
CLAUDE.md. `docs/AUTH-REQUIREMENTS.md`, the only actual auth design record, deliberately
chose client-side auth and never mentions cookies.

The requirement was also aimed at the wrong target. httpOnly does not prevent XSS
damage — an attacker with script execution can issue authenticated requests from the
victim's browser regardless of where the token is kept. What it prevents is token
*exfiltration*: it downgrades "permanent account takeover from the attacker's machine"
to "abuse while the page is open." Real, but second-order to preventing script
execution in the first place.

Two alternatives were considered and rejected:

**`@supabase/ssr` with cookie storage** gives *zero* XSS improvement. Its
`createBrowserClient` reads the session from `document.cookie`, so the cookie must stay
JS-readable — an attacker reads it exactly as easily as `localStorage`. The real gains
(server-side route guards, no avatar flash on load) are UX and correctness, not
security, and would not justify the change on security grounds.

**Server-only auth with genuine httpOnly cookies** is the only option that stops
exfiltration, but it requires every mutation to move behind our own endpoints carrying
an ambient cookie. That creates a CSRF requirement the current bearer-token model does
not have, and it pressures toward a service-role key on the server — replacing a
declarative, fail-closed boundary (RLS) with hand-written checks in every endpoint.
That is a plausible net security *regression*, and disproportionate for a public
library of shakuhachi scores.

## Constraint for any future migration

`src/api/supabase.ts` exports a **module-level singleton**. On Netlify Functions,
module scope persists across invocations in a warm container.

This is only safe because the server never authenticates that client — Astro frontmatter
calls read-only functions (`getScoreBySlug`, `getScore`, `getAllScores`, `searchScores`)
and nothing else. **Any future server-side auth must construct a per-request client.**
Authenticating the singleton would let user A's session serve user B's request.

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
