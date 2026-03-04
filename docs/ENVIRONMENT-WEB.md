# Claude Code on the Web — Environment Guidelines

Applies when running in the **claude.ai/code** environment. All `CLAUDE.md` guidelines still apply — this file only documents differences.

## Identifying this environment

The system prompt contains an injected task block:

```
**chrisrauh/shakuhachi-ro**: Develop on branch `claude/study-guidelines-YxAzk`
```

The branch always starts with `claude/` but the suffix changes every session. Use it exactly as specified — never reuse or invent a branch name.

## Constraints

- **Pushing to `main` is blocked** — returns HTTP 403. Only `claude/`-prefixed branches are writable.
- **`gh` is not installed** — skip any steps involving `gh pr create`. Push to the feature branch and stop; the user opens the PR.
- **Stop hook** runs at session end and blocks exit if there are uncommitted changes, untracked files, or unpushed commits. Fix by committing and pushing everything to the feature branch.

## Workflow differences from `CLAUDE.md`

- **Step 1–2 (branch)**: Use the branch from the injected task. Create it locally if needed: `git checkout -b <branch-from-task>`.
- **Step 8 (push + PR)**: Push (`git push -u origin <branch-from-task>`), then stop. Tell the user to open the PR.
- **Step 10 (cleanup)**: `git push origin --delete <branch>` works for `claude/`-prefixed branches.
- **Recovery from main**: Use the injected task branch name, not `feature/descriptive-name`.
