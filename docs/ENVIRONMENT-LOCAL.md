# Local Terminal (macOS) — Environment Guide

Applies when running Claude Code in a terminal on the maintainer's Mac. In the cloud (claude.ai/code, or a session started from the Claude mobile or desktop app), read [ENVIRONMENT-CLOUD.md](./ENVIRONMENT-CLOUD.md) instead — nothing in this file applies there.

## Identifying this environment

The platform is `darwin`, the `gh` CLI is installed, and the system prompt names no `claude/...` branch.

## Credentials

Supabase config and the test account live in `.env` at the repo root (gitignored). `.env.example` is the template, with placeholders for all four variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `TEST_EMAIL`, `TEST_PASSWORD`.

- `npm test` passes without `.env` — vitest supplies placeholder Supabase vars.
- The dev server and any visual verification need it — without it the score library renders empty and score pages break.
- `.env` cannot be read directly. To get the test account into a browser login form, source it in the same Bash call:
  ```bash
  source .env && echo "Email: $TEST_EMAIL" && echo "Password: $TEST_PASSWORD"
  ```
  This is an accepted exception to the "no `&&`" rule: each Bash call is a separate shell. It needs one-time authorization per session.
- **Worktrees** (`/agent-workflow`): `.env` exists only in the main checkout. Link it from inside the worktree: `ln -s ../../../.env .env`. The symlink is gitignored, and the path resolves from `.claude/worktrees/<name>/` back to the repo root.

## GitHub

Use the `gh` CLI for everything — the commands in the skills are written for it.

## Visual verification: chrome-devtools-mcp

Use chrome-devtools-mcp for visual verification (not Bash scripts, not saving to files).

- `take_snapshot()` = markup structure
- `take_screenshot()` = rendered appearance

```
navigate_page({ url: "http://localhost:3001/path" })
emulate({ colorScheme: "light" })
take_screenshot()
emulate({ colorScheme: "dark" })
take_screenshot()
list_console_messages({ types: ["error", "warn"] })
```

To test logged-in pages, log in through the form with `fill()`, using the credentials above.

**Stale Chrome process (MCP connection fails repeatedly):** When the MCP-controlled Chrome process doesn't exit cleanly (e.g. after a session crash), `list_pages` returns a "browser already running" lock error. Fix:

```
pkill -f "chrome-devtools-mcp"
```

Then run `/mcp` to reconnect. This kills the stale MCP Chrome without affecting the user's regular Chrome (they use separate user data dirs).

**Call patterns** for styling, refactors, single elements, performance, viewports and debugging: [CHROME-DEVTOOLS-MCP.md](./CHROME-DEVTOOLS-MCP.md).

## Visual regression suite

`npm run test:visual` runs here, and only here — the baselines are macOS screenshots (`*-darwin.png`). Run it before every PR with UI changes; `/dev-workflow` has the baseline approval gate.

Start the dev server first. Otherwise it fails with `Process from config.webServer exited early` (see "Dev server" in `CLAUDE.md`).
