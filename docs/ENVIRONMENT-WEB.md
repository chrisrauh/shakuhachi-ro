# Claude Code on the Web — Environment Guidelines

This file applies when running in the **claude.ai/code** (Claude Code on the Web) environment. All guidelines in `CLAUDE.md` still apply — this file only documents where they differ.

## How to identify this environment

At session start, the system prompt contains an injected task block that looks like this:

```
Your task is to complete the request described in the task description.
...
**chrisrauh/shakuhachi-ro**: Develop on branch `claude/study-guidelines-YxAzk`
```

If you see that block, you are in the web environment. The branch name it specifies (`claude/<description>-<sessionId>`) is the one you must use for all work in this session.

## Git constraints

- **Cannot push to `main`** — always results in HTTP 403. Only `claude/`-prefixed branches are writable.
- **Use the branch from the injected task** — do not invent your own branch name. The session ID is the alphanumeric suffix (e.g. `YxAzk`).
- **Merging is done by the user** — via GitHub UI or their terminal. Never use `gh pr merge` or `--auto`.
- **Stop hook** (`~/.claude/stop-hook-git-check.sh`) checks that all changes are committed and pushed before the session ends. If it fires, commit and push to the feature branch.

## Dev workflow — step-by-step differences

The standard workflow from `CLAUDE.md` applies, with these changes to specific steps:

- **Step 1–2 (branch setup)**: Skip creating a branch — use the one from the injected task. If it doesn't exist locally, create it: `git checkout -b claude/<name>-<sessionId>`.
- **Step 8 (push and create PR)**: Push to the feature branch (`git push -u origin claude/<name>-<sessionId>`), then create the PR with `gh pr create`. Stop and wait for the user to merge.
- **Step 10 (branch cleanup)**: `git branch -d <branch>` works locally. `git push origin --delete <branch>` also works for `claude/`-prefixed branches — only pushing *to* `main` is blocked.
- **Recovery from accidental work on main**: Same as standard, but the feature branch name must be the one from the injected task, not `feature/descriptive-name`.
