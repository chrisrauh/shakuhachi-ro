# Claude Code Cloud — Environment Guidelines

Applies when running in the **Claude Code cloud** environment: claude.ai/code on the web, and sessions started from the Claude mobile or desktop app (they run in the same Linux container). All `CLAUDE.md` guidelines still apply — this file only documents differences.

## Identifying this environment

The platform is `linux` (the local environment is macOS), and the system prompt contains an injected task block:

```
**chrisrauh/shakuhachi-ro**: Develop on branch `claude/study-guidelines-YxAzk`
```

The branch always starts with `claude/` but the suffix changes every session. Use it exactly as specified — never reuse or invent a branch name.

## Constraints

- **Pushing to `main` is blocked** — returns HTTP 403. Only `claude/`-prefixed branches are writable.
- **`gh` is not installed** — use the GitHub MCP tools (`mcp__github__*`, load them with ToolSearch) for issues and PRs. If they are unavailable, push to the feature branch and stop; the user opens the PR.
- **Stop hook** runs at session end and blocks exit if there are uncommitted changes, untracked files, or unpushed commits. Fix by committing and pushing everything to the feature branch.
- **`npm run test:visual` cannot run.** The baselines are macOS-only (`*-darwin.png`) and the Playwright-pinned browser build is not installed. Say so in the PR test plan and leave it for the local environment.
- **chrome-devtools-mcp cannot start Chrome** (no Chrome install, and it runs as root). For visual verification, drive the pre-installed Chromium with a short Playwright script instead: `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`. Set `colorScheme` on the page to check light and dark, and render on a themed page (e.g. `/test/web-component-sizing`) so dark mode applies.

## Workflow differences from `CLAUDE.md`

- **Step 1–2 (branch)**: Use the branch from the injected task. Create it locally if needed: `git checkout -b <branch-from-task>`.
- **Step 8 (push + PR)**: Push (`git push -u origin <branch-from-task>`), then create the PR with `mcp__github__create_pull_request`.
- **Step 10 (cleanup)**: `git push origin --delete <branch>` works for `claude/`-prefixed branches.
- **Recovery from main**: Use the injected task branch name, not `feature/descriptive-name`.
- **Images in PRs**: visual PRs need before/after images — see Phase 3 in `/dev-workflow` for the commit-and-link method. Capture them with the Playwright approach above.
