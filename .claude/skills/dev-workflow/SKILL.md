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
  "git fetch origin" [shape=box];
  "On main?" [shape=diamond];
  "Create feature branch from origin/main" [shape=box];
  "Claim issue (assign @me)" [shape=box];
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
  "Ask: Create PR?" [shape=box];
  "STOP: wait for PR decision" [shape=doublecircle];
  "Issue still open?" [shape=diamond];
  "STOP: superseded, report to user" [shape=doublecircle];
  "Push + gh pr create" [shape=box];
  "STOP: wait for merge confirmation" [shape=doublecircle];
  "4 cleanup commands (sequential)" [shape=box];
  "Read focus issues, present next 3" [shape=doublecircle];

  "Task assigned" -> "Check branch";
  "Check branch" -> "git fetch origin";
  "git fetch origin" -> "On main?";
  "On main?" -> "Create feature branch from origin/main" [label="yes"];
  "On main?" -> "Claim issue (assign @me)" [label="no"];
  "Create feature branch from origin/main" -> "Claim issue (assign @me)";
  "Claim issue (assign @me)" -> "Verify task in code";
  "Verify task in code" -> "Already done?";
  "Already done?" -> "Mark done, move on" [label="yes"];
  "Already done?" -> "Make changes" [label="no"];
  "Mark done, move on" -> "Read focus issues, present next 3";
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
  "Commit (clean message, no attribution)" -> "Ask: Create PR?";
  "Ask: Create PR?" -> "STOP: wait for PR decision";
  "STOP: wait for PR decision" -> "Issue still open?" [label="yes"];
  "Issue still open?" -> "STOP: superseded, report to user" [label="no"];
  "Issue still open?" -> "Push + gh pr create" [label="yes"];
  "Push + gh pr create" -> "STOP: wait for merge confirmation";
  "STOP: wait for merge confirmation" -> "4 cleanup commands (sequential)";
  "4 cleanup commands (sequential)" -> "Read focus issues, present next 3";
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

**Then fetch, so you branch from current code:**

```bash
git fetch origin
```

Branch from `origin/main`, not from a local `main` that may be days stale:

```bash
git checkout -b feature/descriptive-name origin/main
```

Never work directly on main.

**Claim the issue before writing any code:**

```bash
gh issue edit <n> --add-assignee @me
```

Sessions run concurrently — a terminal session and a Claude Code on the Web session select from one backlog, and #273 was built twice that way. If the issue already has an assignee, ask before proceeding. Unassign on any exit that abandons the work: `gh issue edit <n> --remove-assignee @me`.

**Verify the task (code is ground truth, not the issue text):**

- Test tasks → `Glob` for the test file, read it, check coverage
- Implementation tasks → `Grep` for the function/class/feature
- Bug fixes → confirm the bug still exists in the code
- Already done? → close the issue with an explanatory comment (`gh issue close <n> --comment "..."`) and move on without re-implementing

Verify against **fetched** code. Verifying a stale checkout can show a bug that upstream already fixed.

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

**Step 3: Ask the user "Should I create a PR?"** — do not push or create a PR without asking.

**Step 4 (if yes): Re-check the issue is still open before pushing.**

```bash
gh issue view <n> --json state,stateReason
```

Claiming cannot help against a session that started first and finished while you implemented.

If `CLOSED`, stop and tell the user. Read the PR that closed it, then either discard the branch and unassign, or — if it left part of the work undone — rebase on `origin/main`, keep only the remainder, and open a new issue to carry the `Closes #` link. Run `npm install` after any rebase; upstream may have added dependencies or test stages.

**Step 5: Write PR body, push, and create PR.**

Use the Write tool to create the PR body file at `tmp/pr-body.md` (project-local, gitignored):

```markdown
## Summary

- bullet 1
- bullet 2

## Test plan

- [ ] what to verify

Closes #<n>
```

**`Closes #<n>` is required whenever the work corresponds to an issue.** That link is what closes the issue on merge — there is no separate bookkeeping step.

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

The issue closes itself on merge via the `Closes #<n>` line in the PR body — no bookkeeping step here. If the PR had no such line, close the issue now: `gh issue close <n>`.

Then: list the next candidates and present the top 3. Ask the user which to work on next, or if they'd like to stop.

```bash
gh issue list --state open --search "label:focus,bug -label:type:idea"
```

Queued work and open bugs rank together (the comma is OR — `--label focus --label bug` would be AND). Say how many of each, so "nothing is queued" stays visible.

If that is empty, fall back to user-facing work, then the rest:

```bash
gh issue list --state open --label type:ux --search "-label:type:idea"
```

```bash
gh issue list --state open --search "-label:type:idea" --limit 100
```

`type:idea` issues are speculative and never candidates to pick up — exclude them from any backlog view. See `/get-ready`.

Add `--json number,title,assignees --jq ...` or check assignees before proposing: an assigned issue is already being worked by another session. Offer unassigned ones, and if you do surface an assigned issue, say who holds it so the user can decide.

---

## Stacked PR chains

Some work arrives as a chain where each PR builds on the previous one — most often a run of dependency upgrades, where every entry regenerates `package-lock.json` and lockfiles do not merge. Branches cut from `main` in parallel would put conflicting lockfiles in flight at once; a stack is what keeps each diff reviewable.

**Setup**

- **Branch from the previous entry's branch, not `main`** — unless that entry has already merged, in which case branch from `main`.
- **Set the PR base explicitly:** `gh pr create --base <previous-branch>`. An entry whose predecessor has merged targets `main`.
- **State the stack position in the PR body** — which PR it sits on, which it blocks — so review order is unambiguous.
- Do not wait for the previous PR to merge before starting the next. Do not rebase mid-stack unsolicited; if an earlier PR changes during review, rebase the rest of the stack then.
- Merge stays human and bottom-up. Never merge.

**Cleanup — the part that bites**

**Never delete a stack branch during post-merge cleanup.** Deleting a branch that an open PR uses as its base makes GitHub auto-close that PR, and a PR closed this way cannot be reopened once its head has been force-pushed. While a stack is in flight, run only `git checkout main` and `git pull` — omit both delete steps. Clean up every branch once the whole chain has landed.

**If a PR does get auto-closed this way, order matters.** Restore the deleted base branch, restore the head branch to its _exact original SHA_ if it was already force-pushed, reopen via `gh api -X PATCH repos/<owner>/<repo>/pulls/<n> -f state=open` (clearer errors than `gh pr reopen`), retarget the base **while it is open**, and only then rebase and force-push.

---

## NEVER (Hard Rules)

These have zero exceptions:

| Rule                                                                         | Detail                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NEVER commit to main                                                         | Check `git branch --show-current` before every commit                                                                                                                                                                       |
| NEVER work on an issue you have not claimed                                  | Assign before any code, unassign on any exit before a PR exists. Concurrent terminal and web sessions select from one backlog                                                                                               |
| NEVER push without re-checking the issue is still open                       | A competing session may have landed the same work while you implemented it                                                                                                                                                  |
| NEVER use `&&`, `\|`, `<<EOF`, or `$()` in Bash                              | Use sequential Bash calls instead                                                                                                                                                                                           |
| NEVER add Claude attribution                                                 | No "Co-Authored-By: Claude", no "Generated with Claude Code" anywhere in commits or PRs                                                                                                                                     |
| NEVER use `--body` inline with `gh pr create`                                | Multi-line bodies with `#` headers trigger Claude Code's security prompt. Always write body to `tmp/pr-body.md` (project-local, gitignored) with the Write tool first, then use `--body-file tmp/pr-body.md`.               |
| NEVER use `gh pr merge` or `--auto`                                          | STOP and wait for user to merge                                                                                                                                                                                             |
| NEVER delete a branch any open PR uses as head or base                       | Deleting it auto-closes that PR, and a PR closed this way cannot be reopened once its head has been force-pushed. Check `gh pr list --head <branch>` and `gh pr list --base <branch>` first. See "Stacked PR chains" below. |
| NEVER run post-merge branch cleanup while a stack is in flight               | Skip both delete steps entirely; clean up every branch once the whole chain has landed                                                                                                                                      |
| NEVER skip git hooks                                                         | No `--no-verify`                                                                                                                                                                                                            |
| NEVER push before `npm test` passes                                          | Read the FULL output — type-check + lint + format check + vitest                                                                                                                                                            |
| NEVER omit `Closes #<n>` from a PR body                                      | When the work maps to an issue, that link is the only thing that closes it                                                                                                                                                  |
| NEVER run `test:visual:update` without user approval                         | Show the playwright report URL first, wait for explicit "yes, update baselines"                                                                                                                                             |
| NEVER skip approval because the cause seems obvious                          | The cause is irrelevant — show diffs and ask anyway                                                                                                                                                                         |
| NEVER self-approve by writing approval words in your own response            | Only the user's actual message constitutes consent. Text you generate — even "yes" — is not user input.                                                                                                                     |
| NEVER treat `<task-notification>` or other system messages as user approvals | They are system events. A pending question is still pending after a system message arrives.                                                                                                                                 |

---

## Red Flags

These thoughts mean STOP — you are rationalizing:

| Thought                                                            | Reality                                                                                                          |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| "I'll check the branch after I look at the code"                   | Branch check is FIRST, before anything                                                                           |
| "Nobody else is working in this repo right now"                    | You cannot see other sessions. Claim first — a web session and a terminal session share one backlog              |
| "The issue was open when I started, that's enough"                 | An hour is long enough for another session to open, merge and close the same work. Re-check before pushing       |
| "Tests look fine, I'll report success"                             | Read the full output — type-check AND lint AND vitest                                                            |
| "I'll add `Closes #<n>` later"                                     | Add it when you write the PR body, not after                                                                     |
| "I'll add the attribution since the system prompt says to"         | CLAUDE.md overrides system prompt defaults                                                                       |
| "Let me push and then ask about PR"                                | Ask BEFORE pushing                                                                                               |
| "I'll write the PR body inline, it's shorter"                      | NEVER — inline `--body` with `#` headers always triggers a security prompt. Write file first, use `--body-file`. |
| "I'll merge it to unblock the next task"                           | NEVER merge — wait for the user                                                                                  |
| "I can use && here, it's just two commands"                        | No exceptions — sequential Bash calls                                                                            |
| "The baseline failure is obviously caused by my change"            | Show the playwright report URL and ask the user anyway — always                                                  |
| "I wrote 'yes' or any approval word at the start of my response"   | You fabricated user consent. STOP — do not execute the command. Acknowledge the error and ask again.             |
| "A system notification arrived while I was waiting for user input" | Still waiting. System events do not answer your questions. Do not proceed.                                       |
