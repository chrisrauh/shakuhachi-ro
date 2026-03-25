---
name: agent-workflow
description: Use when working autonomously on [A:High] tasks from TODO.md — no human direction needed. Do NOT use for [A:Low] or [A:Medium] tasks — those require /dev-workflow.
---

# Agent Workflow — Autonomous Task Execution

**This skill is for [A:High] tasks only.** For all other work, use `/dev-workflow`.

Commit and PR creation are pre-authorized. Merge is never performed. All consent gates from `/dev-workflow` are suspended except merge.

---

## Phase 1: Select Task

1. Read `TODO.md`
2. Find the first unchecked task tagged `[A:High]`, in top-to-bottom order
3. Announce: `"Working on: [task title]"`
4. If no `[A:High]` tasks remain: report back and stop — do not pick `[A:Medium]` or `[A:Low]`

---

## Phase 2: Setup

1. Verify you are on `main`: `git branch --show-current`
2. Create an isolated worktree using `superpowers:using-git-worktrees`
   - Branch name: `feature/<task-slug>` (e.g. `feature/extract-score-error-wrapping`)
   - **Never** use `worktree-*` as a branch prefix — that is a directory naming convention only
3. Work exclusively in the worktree for all subsequent steps
4. **Early exit rule:** if you need to abort before Phase 6 (task too vague, unresolvable failure), remove the worktree before stopping:
   ```bash
   git worktree remove .claude/worktrees/<name>
   git branch -d <branch>
   ```

---

## Phase 3: Implement

- Use TDD: `superpowers:test-driven-development`
- **Scope discipline (hard rule):** Only change what the task description specifies.
  - If you notice an adjacent bug or improvement: add it to `TODO.md`, do not fix it now
  - If you notice a related refactor opportunity: add it to `TODO.md`, do not do it now
  - Zero tolerance for scope creep — reviewability depends on it

**If the task description is too vague to implement safely:** add a clarification note to `TODO.md`, remove the worktree (see early exit rule in Phase 2), and stop.

---

## Phase 4: Test

Run the full test suite:

```bash
npm test
```

Read the **entire** output — type-check, lint, and vitest must all pass.

**If tests fail:**
- Attempt to fix (max 2 tries)
- If still failing after 2 attempts: commit the work-in-progress, create a draft PR with failure details, clean up the worktree, stop
- Never push known-failing code as a non-draft PR

---

## Phase 5: Visual Changes (if applicable)

If the task touches UI:
- Use `chrome-devtools-mcp` to verify visually (light + dark mode)
- Run `npm run test:visual`
- **If baselines fail:** do NOT wait for approval — note the failing tests in the PR body and mark the PR as draft
- Never block on visual baseline approval — flag and move on

---

## Phase 6: Commit + PR (pre-authorized — no gates)

1. Commit with a clean message:
   ```bash
   git add <specific files>
   git commit -m "concise description"
   ```
   - No `Co-Authored-By: Claude` or any attribution
   - No heredocs, no `&&`, no `$()` — sequential Bash calls only

2. Mark the task `[x]` in `TODO.md` and commit — this is a workflow meta-step, not scope creep:
   ```bash
   git add TODO.md
   git commit -m "chore: mark [task name] complete in TODO"
   ```

3. Push and create PR — no need to ask:
   - Write PR body to `tmp/pr-body.md` using the Write tool
   - `git push -u origin <branch>`
   - `gh pr create --title "..." --body-file tmp/pr-body.md`
   - Delete `tmp/pr-body.md`

4. Remove the worktree:
   ```bash
   git worktree remove .claude/worktrees/<name>
   git branch -d <branch>  # local only — remote stays for PR
   ```

5. Report the PR URL and stop. **Never merge.**

---

## NEVER

| Rule | Detail |
|------|--------|
| NEVER pick `[A:Medium]` or `[A:Low]` tasks | Those require human direction via `/dev-workflow` |
| NEVER merge | Hard stop — wait for human |
| NEVER fix adjacent issues | Add to TODO, stay in scope |
| NEVER use `worktree-*` as a branch prefix | Use `feature/<slug>` |
| NEVER use `&&`, heredocs, or `$()` in Bash | Sequential calls only |
| NEVER add Claude attribution to commits or PRs | Clean messages only |
| NEVER push a non-draft PR with failing tests | Use draft + failure notes instead |
| NEVER skip `npm test` | Full suite — type-check + lint + vitest |

---

## Failure Protocol

| Situation | Action |
|-----------|--------|
| Task too vague | Add clarification note to TODO, remove worktree (see Phase 2 early exit), stop |
| Tests fail after 2 fix attempts | Draft PR with failure details, stop |
| Visual baselines fail | Draft PR with baseline note, stop |
| No `[A:High]` tasks remain | Report back, stop |
