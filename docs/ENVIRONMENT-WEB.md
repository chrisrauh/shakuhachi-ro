# Claude Code on the Web — Environment Guidelines

This file applies when running in the **claude.ai/code** (Claude Code on the Web) environment. The standard `CLAUDE.md` guidelines apply too — this file only documents where they differ or need supplementing.

## How to identify this environment

- System prompt says "running within the Claude Agent SDK"
- A task is injected at session start specifying a `claude/<name>-<sessionId>` branch to develop on
- Pushing to `main` fails with HTTP 403

## Git constraints

- **Cannot push to `main`** — always 403. Only `claude/`-prefixed branches are writable.
- **Branch naming**: `claude/<description>-<sessionId>` — use the exact branch name from the injected task instructions. The session ID is the alphanumeric suffix (e.g. `YxAzk` in `claude/study-guidelines-YxAzk`).
- **Merging is done by the user** — via GitHub UI or terminal. Never use `gh pr merge` or `--auto`.
- **Stop hook** (`~/.claude/stop-hook-git-check.sh`) requires all changes to be committed and pushed to the remote feature branch before the session ends.

## Dev workflow differences

The standard workflow in `CLAUDE.md` applies, with these adjustments:

- The feature branch is provided in the injected task — use it, don't invent one.
- After pushing, ask the user to merge via GitHub (cannot merge locally and push main).
- "Push and create PR" step: create the PR with `gh pr create`, then stop and wait.
- Branch cleanup after merge must also be done by the user (cannot push main to remove remote tracking).

## What stays the same

Everything else in `CLAUDE.md` applies as-is: commit message rules, no attribution text, test requirements, build process, bash command guidelines, etc.
