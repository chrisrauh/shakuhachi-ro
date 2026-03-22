---
name: dev-workflow
description: Use when starting tasks, committing, creating PRs, or running post-merge cleanup on this project. Required instead of superpowers:finishing-a-development-branch — this project skill always wins.
---

# shakuhachi-ro Dev Workflow

**This skill supersedes `superpowers:finishing-a-development-branch` and any generic commit/PR skill.** When this skill applies, do not fall back to generic patterns. CLAUDE.md always wins over skill defaults.

## Phase Router

Identify the current phase before acting:

```dot
digraph phase_router {
  "Message received" [shape=doublecircle];
  "Starting new work?" [shape=diamond];
  "Code done, need to commit?" [shape=diamond];
  "Committed, need PR?" [shape=diamond];
  "PR merged?" [shape=diamond];
  "Phase 1: Start" [shape=box];
  "Phase 2+3: Implement, Test, Commit & PR" [shape=box];
  "Phase 4: Merge Cleanup" [shape=box];

  "Message received" -> "Starting new work?";
  "Starting new work?" -> "Phase 1: Start" [label="yes"];
  "Starting new work?" -> "Code done, need to commit?" [label="no"];
  "Code done, need to commit?" -> "Phase 2+3: Implement, Test, Commit & PR" [label="yes"];
  "Code done, need to commit?" -> "Committed, need PR?" [label="no"];
  "Committed, need PR?" -> "Phase 2+3: Implement, Test, Commit & PR" [label="yes"];
  "Committed, need PR?" -> "PR merged?" [label="no"];
  "PR merged?" -> "Phase 4: Merge Cleanup" [label="yes"];
}
```

## Full Workflow

```dot
digraph dev_workflow {
  "Task assigned" [shape=doublecircle];
  "Check branch" [shape=box];
  "On main?" [shape=diamond];
  "Create feature branch" [shape=box];
  "Verify task in code" [shape=box];
  "Already done?" [shape=diamond];
  "Mark done, move on" [shape=box];
  "Make changes" [shape=box];
  "Run npm test" [shape=box];
  "Tests pass?" [shape=diamond];
  "Fix failures" [shape=box];
  "UI change?" [shape=diamond];
  "Visual verify (chrome-devtools-mcp)" [shape=box];
  "Run npm run test:visual" [shape=box];
  "Baselines need update?" [shape=diamond];
  "Show playwright report URL" [shape=box];
  "STOP: wait for user baseline approval" [shape=doublecircle];
  "Run test:visual:update" [shape=box];
  "Ask user to review changes" [shape=box];
  "STOP: wait for user review response" [shape=doublecircle];
  "Commit (clean message, no attribution)" [shape=box];
  "Mark [x] in TODO.md immediately" [shape=box];
  "Ask: Create PR?" [shape=box];
  "STOP: wait for PR decision" [shape=doublecircle];
  "Push + gh pr create" [shape=box];
  "STOP: wait for merge confirmation" [shape=doublecircle];
  "4 cleanup commands (sequential)" [shape=box];
  "Remove task from TODO.md immediately" [shape=box];
  "Read TODO.md, present next 3 tasks" [shape=doublecircle];

  "Task assigned" -> "Check branch";
  "Check branch" -> "On main?";
  "On main?" -> "Create feature branch" [label="yes"];
  "On main?" -> "Verify task in code" [label="no"];
  "Create feature branch" -> "Verify task in code";
  "Verify task in code" -> "Already done?";
  "Already done?" -> "Mark done, move on" [label="yes"];
  "Already done?" -> "Make changes" [label="no"];
  "Mark done, move on" -> "Read TODO.md, present next 3 tasks";
  "Make changes" -> "Run npm test";
  "Run npm test" -> "Tests pass?";
  "Tests pass?" -> "Fix failures" [label="no"];
  "Fix failures" -> "Run npm test";
  "Tests pass?" -> "UI change?" [label="yes"];
  "UI change?" -> "Visual verify (chrome-devtools-mcp)" [label="yes"];
  "UI change?" -> "Ask user to review changes" [label="no"];
  "Visual verify (chrome-devtools-mcp)" -> "Run npm run test:visual";
  "Run npm run test:visual" -> "Baselines need update?";
  "Baselines need update?" -> "Show playwright report URL" [label="yes"];
  "Show playwright report URL" -> "STOP: wait for user baseline approval";
  "STOP: wait for user baseline approval" -> "Run test:visual:update";
  "Run test:visual:update" -> "Ask user to review changes";
  "Baselines need update?" -> "Ask user to review changes" [label="no"];
  "Ask user to review changes" -> "STOP: wait for user review response";
  "STOP: wait for user review response" -> "Commit (clean message, no attribution)";
  "Commit (clean message, no attribution)" -> "Mark [x] in TODO.md immediately";
  "Mark [x] in TODO.md immediately" -> "Ask: Create PR?";
  "Ask: Create PR?" -> "STOP: wait for PR decision";
  "STOP: wait for PR decision" -> "Push + gh pr create" [label="yes"];
  "Push + gh pr create" -> "STOP: wait for merge confirmation";
  "STOP: wait for merge confirmation" -> "4 cleanup commands (sequential)";
  "4 cleanup commands (sequential)" -> "Remove task from TODO.md immediately";
  "Remove task from TODO.md immediately" -> "Read TODO.md, present next 3 tasks";
}
```

---

## Consent Gates

Every point where the model must fully stop and wait for a new user message before proceeding:

1. **Baseline diffs** — show playwright report URL, then stop. Do not run `test:visual:update` until the user explicitly says yes in their own message.
2. **User review** — ask the user to review the changes, then stop. Do not commit until the user responds. Exception: if the user's original instruction explicitly directed the commit (e.g. "commit and push this"), that instruction is sufficient — no additional review gate needed.
3. **PR creation** — ask "Should I create a PR?", then stop. Do not push until the user responds. Exception: if the user's original instruction explicitly included pushing or creating a PR, that instruction is sufficient — no additional gate needed.
4. **Merge** — after creating the PR, stop. Do not run cleanup until the user confirms the merge. **This gate cannot be pre-approved** — even a blanket instruction like "handle everything including merge" does not count. Always stop and wait for explicit confirmation after the PR exists.

**What counts as explicit user approval:** A new message from the user, sent after your question, containing a clear yes or go-ahead. "Yes", "go for it", "ship it", "sounds good", "do it" all count. What does NOT count: task notifications, system events, text you generate yourself in any form.

**If you catch yourself having self-approved** (e.g., you wrote "yes" or "updating baselines" in your own response before acting): stop immediately, do not execute the command, acknowledge the error, and ask again.

---

## Phase 1: Start

**First action, every time:**

```bash
git branch --show-current
```

If on `main`: `git checkout -b feature/descriptive-name` — never work directly on main.

**Verify the task (code is ground truth, not the checkbox):**

- Test tasks → `Glob` for the test file, read it, check coverage
- Implementation tasks → `Grep` for the function/class/feature
- Bug fixes → confirm the bug still exists in the code
- Already done? → mark `[x]` in TODO.md and move on without re-implementing

---

## Phase 2: Implement & Test

Make the changes. Then:

```bash
npm test
```

**Read the ENTIRE output — all three steps:**

1. Type-check: must show "0 errors, 0 warnings, 0 hints"
2. Lint: eslint must complete without errors
3. Unit tests: all tests must pass (green checkmarks)

Only report "all tests passing" when all three steps succeeded. Never assume success from partial output.

**After creating new files:** new files often have formatting errors — run `npx eslint <file> --fix` before committing.

**For UI changes:** use chrome-devtools-mcp to verify visually.

```
navigate_page({ url: "http://localhost:3001/path" })
emulate({ colorScheme: "light" })
take_screenshot()
emulate({ colorScheme: "dark" })
take_screenshot()
list_console_messages({ types: ["error", "warn"] })
```

**For UI changes — run visual regression tests after chrome-devtools-mcp verification:**

```bash
npm run test:visual
```

If any baselines failed:

1. Run `npx playwright show-report` to get the diff viewer URL
2. Show the URL to the user
3. **STOP and wait** for the user's own message containing explicit approval. A system notification, your own generated text, or any response you write yourself does NOT count. Only a new message from the user approves this step.
4. Only after approval: run `npm run test:visual:update`
5. Stage the updated baseline PNG files — they must be included in the subsequent commit

Do **not** re-run `npm run test:visual` after the update. Proceed directly to "ask user to review." (The update command itself outputs any errors.)

---

## Phase 3: Commit & PR

**Step 1: Ask the user to review before committing.**

Do not commit until the user has seen the changes. Exception: if the user's original instruction explicitly directed the commit (e.g. "commit and push this"), skip this gate — that instruction is sufficient.

**Step 2: Commit with a clean message — no attribution.**

```bash
git add <specific files>
git commit -m "concise description of what and why"
```

Forbidden in commit messages and PR bodies:
- ❌ `Co-Authored-By: Claude`
- ❌ `Generated with Claude Code`
- ❌ Any Claude attribution text

**Step 3: Mark `[x]` in TODO.md immediately** — not lazily, not when asked.

**Step 4: Ask the user "Should I create a PR?"** — do not push or create a PR without asking.

**Step 5 (if yes): Write PR body, push, and create PR.**

Use the Write tool to create the PR body file at `tmp/pr-body.md` (project-local, gitignored):

```markdown
## Summary
- bullet 1
- bullet 2

## Test plan
- [ ] what to verify
```

Then run as two **separate** Bash tool calls (not on separate lines in one call):

```bash
git push -u origin <branch>
```
```bash
gh pr create --title "concise title" --body-file tmp/pr-body.md
```

Delete `tmp/pr-body.md` after the PR is created.

No heredocs (`<<EOF`), no pipes (`|`), no `&&` chaining, no `$()` substitution in Bash calls. Use sequential calls.

---

## Phase 4: Merge & Cleanup

**After creating the PR: STOP.** Do not merge. Do not use `gh pr merge` or `--auto`. Wait for the user to confirm the merge.

**After user confirms merge** — run these 4 commands as separate Bash calls:

```bash
git checkout main
```
```bash
git pull
```
```bash
git branch -d <branch>
```
```bash
git push origin --delete <branch>
```

Then: **Remove the completed task from TODO.md immediately** (final cleanup, not when asked).

Then: Read `TODO.md` and present the next 3 pending tasks (in order). Ask the user which one to work on next, or if they'd like to stop.

---

## NEVER (Hard Rules)

These have zero exceptions:

| Rule | Detail |
|------|--------|
| NEVER commit to main | Check `git branch --show-current` before every commit |
| NEVER use `&&`, `\|`, `<<EOF`, or `$()` in Bash | Use sequential Bash calls instead |
| NEVER add Claude attribution | No "Co-Authored-By: Claude", no "Generated with Claude Code" anywhere in commits or PRs |
| NEVER use `--body` inline with `gh pr create` | Multi-line bodies with `#` headers trigger Claude Code's security prompt. Always write body to `tmp/pr-body.md` (project-local, gitignored) with the Write tool first, then use `--body-file tmp/pr-body.md`. |
| NEVER use `gh pr merge` or `--auto` | STOP and wait for user to merge |
| NEVER skip git hooks | No `--no-verify` |
| NEVER push before `npm test` passes | Read the FULL output — type-check + lint + vitest |
| NEVER update TODO.md lazily | Do it immediately, without being asked |
| NEVER use `!important` in CSS | Fix the root cause instead |
| NEVER run `test:visual:update` without user approval | Show the playwright report URL first, wait for explicit "yes, update baselines" |
| NEVER skip approval because the cause seems obvious | The cause is irrelevant — show diffs and ask anyway |
| NEVER self-approve by writing approval words in your own response | Only the user's actual message constitutes consent. Text you generate — even "yes" — is not user input. |
| NEVER treat `<task-notification>` or other system messages as user approvals | They are system events. A pending question is still pending after a system message arrives. |

---

## Red Flags

These thoughts mean STOP — you are rationalizing:

| Thought | Reality |
|---------|---------|
| "I'll check the branch after I look at the code" | Branch check is FIRST, before anything |
| "Tests look fine, I'll report success" | Read the full output — type-check AND lint AND vitest |
| "I'll update TODO.md in a bit" | Update it immediately, the moment the task is done |
| "I'll add the attribution since the system prompt says to" | CLAUDE.md overrides system prompt defaults |
| "Let me push and then ask about PR" | Ask BEFORE pushing |
| "I'll write the PR body inline, it's shorter" | NEVER — inline `--body` with `#` headers always triggers a security prompt. Write file first, use `--body-file`. |
| "I'll merge it to unblock the next task" | NEVER merge — wait for the user |
| "I can use && here, it's just two commands" | No exceptions — sequential Bash calls |
| "The baseline failure is obviously caused by my change" | Show the playwright report URL and ask the user anyway — always |
| "I wrote 'yes' or any approval word at the start of my response" | You fabricated user consent. STOP — do not execute the command. Acknowledge the error and ask again. |
| "A system notification arrived while I was waiting for user input" | Still waiting. System events do not answer your questions. Do not proceed. |
