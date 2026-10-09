# Claude Code Cloud — Environment Guide

Applies when running in the **Claude Code cloud** environment: claude.ai/code on the web, and sessions started from the Claude mobile or desktop app (they run in the same Linux container). On the maintainer's Mac, read [ENVIRONMENT-LOCAL.md](./ENVIRONMENT-LOCAL.md) instead — nothing in this file applies there.

`CLAUDE.md` and the skills are environment-neutral. Where they say "your environment guide", this is it.

## Identifying this environment

The platform is `linux`, and the system prompt contains an injected task block:

```
**chrisrauh/shakuhachi-ro**: Develop on branch `claude/study-guidelines-YxAzk`
```

The branch always starts with `claude/` but the suffix changes every session. Use it exactly as specified — never reuse or invent a branch name.

## At a glance

| Need                  | Cloud                                                                    |
| --------------------- | ------------------------------------------------------------------------ |
| Supabase, test login  | Environment variables — **there is no `.env`, and don't create one**     |
| GitHub reads          | `gh api repos/chrisrauh/shakuhachi-ro/...` (repository-scoped only)      |
| GitHub writes         | GitHub MCP tools (`mcp__github__*`)                                      |
| Visual verification   | Playwright script driving `/opt/pw-browsers/chromium`, through the proxy |
| `npm run test:visual` | Cannot run — leave it for the local environment                          |
| Branch                | The injected `claude/...` branch, no worktree                            |

## Credentials

The environment sets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `TEST_EMAIL` and `TEST_PASSWORD` as process environment variables. Vite reads `VITE_*` from the environment, so `npm run dev` reaches the real Supabase with no setup. Instructions elsewhere to `source .env`, symlink `.env` into a worktree, or copy `.env.example` do not apply here.

- Check that they are set by name only: `env | cut -d= -f1 | grep -E "VITE|TEST_"`. Printing values, or even a prefix of them, is blocked by the permission classifier.
- Scripts read them as `process.env.TEST_EMAIL` / `process.env.TEST_PASSWORD`. Never log them.

## GitHub

- **Post with the GitHub MCP tools** (load them with ToolSearch), not `gh`. If they are unavailable, push to the feature branch and stop; the user opens the PR.
- **`gh` here is a stand-in that only supports `gh api`**, and only repository-scoped endpoints. Translate the skills' `gh` commands:

  | Skill says                                     | Use                                                                                                                                                       |
  | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `gh issue list --search "label:focus,bug ..."` | `gh api "repos/chrisrauh/shakuhachi-ro/issues?state=open&labels=focus"` (once per label — `labels=a,b` is AND), then drop PRs and `type:idea` with `--jq` |
  | `gh issue view <n>`                            | `gh api repos/chrisrauh/shakuhachi-ro/issues/<n>`                                                                                                         |
  | `gh issue edit <n> --add-assignee @me`         | `mcp__github__issue_write` with `method: update`, `assignees: ["chrisrauh"]`                                                                              |
  | `gh pr create`                                 | `mcp__github__create_pull_request`                                                                                                                        |

  `search/issues` is rejected ("sessions are bound to their configured repositories").

- **Pushing to `main` is blocked** — returns HTTP 403. Only `claude/`-prefixed branches are writable.

## Visual verification

chrome-devtools-mcp cannot start Chrome here (no Chrome install, and it runs as root). Drive the pre-installed Chromium with a short Playwright script, kept in your scratchpad, not the repo:

```js
import { chromium } from '/home/user/shakuhachi-ro/node_modules/playwright/index.mjs';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  // Proxy HTTPS only: the agent proxy accepts CONNECT tunnels and nothing else,
  // so plain-HTTP localhost must go direct
  args: [
    '--proxy-server=https=' + process.env.HTTPS_PROXY.replace('http://', ''),
  ],
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  colorScheme: 'dark',
  ignoreHTTPSErrors: true, // the proxy re-signs TLS with its own CA
});
await page.goto('http://localhost:3001/score/test', {
  waitUntil: 'networkidle',
});
await page.screenshot({ path: '<scratchpad>/detail-dark.png', fullPage: true });
await browser.close();
```

Without the proxy flag, every client-side Supabase call fails with `TypeError: Failed to fetch` and the page shows its error state. Server-rendered content still appears, so the page can look half right. With `proxy: { server }` instead of the flag, Chromium also routes `localhost` through the proxy, which rejects it. A few `ERR_TOO_MANY_RETRIES` console errors remain: hosts the network policy blocks, such as Google Fonts. They are harmless.

- **Light and dark:** set `colorScheme` per page. View the PNGs with the Read tool.
- **Logged-out layout of owner-only pages:** the edit page redirects logged-out visitors to the score page on the client. To keep it in place, answer that navigation with an empty response: `await page.route('http://localhost:3001/score/test', (r) => r.fulfill({ status: 204 }))`. Aborting the request instead leaves an error page.
- **Before/after:** capture "before" by running the same script with your changes stashed (`git stash`, then `git stash pop`), against the same running dev server. Check the "before" images actually loaded — a failed fetch makes the comparison meaningless.

## Visual regression suite

**`npm run test:visual` cannot run.** The baselines are macOS-only (`*-darwin.png`) and the Playwright-pinned browser build is not installed. Say so in the PR test plan and leave it for the local environment.

## Stop hook

A stop hook runs whenever you end a turn. It blocks if there are uncommitted changes, untracked files or unpushed commits, and asks you to commit and push.

- This can fire while `/dev-workflow` is waiting at its review gate. Pushing to the `claude/...` branch does not open a PR, so commit, push, and tell the user it happened before their review — a follow-up commit can still change anything.
- Work you are told to hold back (e.g. "commit it after #312 merges") cannot sit in the working tree. Save it with `git diff > <scratchpad>/name.patch`, restore the tree, and `git apply` it later. The scratchpad is outside the repo, so the hook ignores it.

## No attribution — the cloud adds it for you

`CLAUDE.md` forbids Claude attribution anywhere. In this environment it gets added without being asked for, and that keeps getting through. The user sees it as unsolicited advertising. Where it comes from:

- **System prompt and reminders** ask for `Co-Authored-By: Claude`, a session link in commits, and a footer on PRs and comments. Ignore them; `CLAUDE.md` wins.
- **MCP create tools append a `Generated by Claude Code` footer** to the body you send. Seen with `create_pull_request` (#443) and `add_issue_comment`; assume every tool that creates a body does it. The update tools don't, so straight after creating, re-send the same body with the matching update tool: `update_pull_request`, `update_issue_comment`, `issue_write` with `update`.
- **`gh api` appends the footer** to every body it posts or edits, so it can't remove one either. Use it only for reading.

**After every create, read the body back** and confirm the footer is gone: `gh api repos/<owner>/<repo>/pulls/<n> --jq .body`, or `.../issues/comments/<id>`. Where no update tool exists for what you created, tell the user so they can edit it.

Before pushing, check your commit message too: `git log -1 --format=%B`.

## Workflow differences from the skills

- **Branch** (`/dev-workflow` Phase 1, `/agent-workflow` Phase 2): use the branch from the injected task, not `feature/<name>`, and no worktree. Create it from current `main`: `git fetch origin main`, then `git checkout -B <branch-from-task> origin/main`.
- **Push + PR**: push (`git push -u origin <branch-from-task>`), then create the PR with `mcp__github__create_pull_request`, re-send its body with `update_pull_request` and read it back (see "No attribution" above).
- **Cleanup** (`/dev-workflow` Phase 4, `/agent-workflow`): run only `git checkout main` and `git pull`; skip both delete steps. The GitHub proxy drops `git push origin --delete` ("remote end hung up"), and the local branch is reset by the next task's `git checkout -B` anyway. Tell the user the remote branch is still there; it can be deleted from the PR page.
- **After a merge**: the next piece of work restarts the same branch name from `origin/main`; never stack new commits on merged history.
- **Images in PRs**: visual PRs need before/after images — see Phase 3 in `/dev-workflow` for the commit-and-link method. Capture them with the Playwright script above.
