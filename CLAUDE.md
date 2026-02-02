# Claude Code Instructions

- Tasks: [TODO.md](./TODO.md)
- Architecture: [docs/architecture.md](./docs/architecture.md)

## Software engineering principles

- **Simplicity (KISS)** - Prefer the simplest thing that works. Complexity is technical debt.
- **Single Responsibility** - A module/function/class should have one reason to change (one actor). Prevents coupling changes from different sources.
- **Separation of Concerns** - Don't mix UI, business logic, data access, config, etc. Boundaries make systems evolvable.
- **Abstraction with Intent** - Abstract _why_, not _how_. Bad abstractions are worse than duplication.
- **DRY (with judgment)** - Eliminate _true_ duplication, not accidental similarity. Premature DRY creates tight coupling.
- **Loose Coupling, High Cohesion** - Things that change together live together; things that change independently shouldn't know much about each other.
- **Make Change Cheap** - Optimize for iteration, not initial elegance. Make code easy to modify.
- **Explicit Over Implicit** - Readability beats cleverness. Code is read far more than it's written.
- **Fail Fast, Fail Loud** - Errors should surface immediately and clearly. Silent failure is a bug factory.
- **Test What Matters** - Tests are about confidence, not coverage. Test behavior, not implementation.

Single meta-principle: **optimize for humans, not machines**. Everything else flows from that.

## Dev Workflow

1. Create feature branch
2. Make changes and test
3. Commit locally (do NOT push yet, do NOT add "Co-Authored-By" attribution)
4. Mark completed tasks in TODO.md with [x]
5. Ask user if you should create PR
6. When creating PR: push branch to remote and use `gh pr create` (DO NOT add "🤖 Generated with Claude Code" to PR descriptions)
7. **STOP and ask user to review and merge** (DO NOT merge automatically, DO NOT use --auto flag, DO NOT use gh pr merge)
8. **WAIT for user's explicit confirmation** (user must say "merged", "merge", or similar)
9. **ONLY AFTER user confirms**: Delete feature branch (local + remote) with `git branch -d <branch> && git push origin --delete <branch>`
10. Remove completed tasks from TODO.md (tasks marked with [x])
11. Look for next task in TODO.md and ask user if you should work on it

**CRITICAL PR RULES:**

- ⛔ NEVER merge PRs automatically. ALWAYS wait for explicit user approval ("merged", "merge", etc.)
- If implementing multiple phases, create PR for EACH phase and wait for approval before continuing

**Testing**

- Unit tests (Vitest): Logic, validation, transformations
- Visual tests (Browser): Rendering, layout
- **Always test visual changes with screenshots** - Take screenshots before/after to verify rendering
- **When you find an error during development, implement a unit test that would have caught that error**
- **Run full test suite after each task**: `npm test` (includes type-check, lint, and vitest)
- **CRITICAL: Run full test suite before pushing**: `npm test` must pass before any push to remote

**Visual Testing (for UI changes)**

Verify all aspects before considering visual changes complete:

- **Symbols**: All base symbols render correctly (ロ,ツ,レ,チ,リ,ウ,ヒ); no clipping or cut-off
- **Modifiers**: Meri (メ中大) left of notes, octave (乙甲) at top, duration dots at bottom - all visible, no overlap
- **Layout**: Consistent spacing, adequate margins (top for octave, bottom for dots), no unexpected overflow
- **SVG**: `overflow: visible` set to prevent clipping of modifiers extending beyond boundaries
- **Modes**: Debug and non-debug render identically
- **Edge cases**: First/last notes in columns, multiple modifiers, rests
- **Process**: Take before/after screenshots, run `npm run test:visual`

**Visual Regression Test Workflow**

When Playwright visual regression tests fail:
- Run `npx playwright show-report` to open the diff viewer
- Ask user to review and approve changes
- Only update baselines after user approval
- This applies ONLY to Playwright visual regression tests (`npm run test:visual`)
- Unit tests can be updated directly as they don't require visual approval

**Task Tracking for Complex Work**

For non-trivial tasks (anything requiring 3+ steps or touching multiple files):
- Use TodoWrite at the start to break down the work into specific subtasks
- Each subtask should be actionable and verifiable (not vague like "fix the issue")
- Update status to in_progress BEFORE starting a subtask
- Mark completed IMMEDIATELY after finishing each subtask (don't batch completions)
- This gives visibility to progress and ensures systematic completion

Examples of when to use:
- Removing a feature (remove from types → API → UI → tests → docs)
- Adding a feature (plan → implement → test → document)
- Debugging complex issues (reproduce → identify root cause → fix → verify)

Don't use for:
- Single-file changes
- Trivial updates
- Simple bug fixes

**Screenshot Management**

- Use standard names: `current.png`, `before.png`, `after.png`
- Overwrite existing screenshots - do not create timestamped versions
- Keep only the most recent screenshot(s) needed for current work
- Location: `screenshots/` directory (gitignored)
- Clean up old screenshots when starting new visual tasks

**Dev Server Management**

- Start dev server ONCE per session, leave running throughout
- DO NOT restart repeatedly for screenshots/tests

## Key Learnings

**Data vs Presentation**

- Data describes WHAT (content, semantics)
- Renderer determines HOW (layout, column breaks, styling)
- Never put presentation logic in data formats
- Example: Score data = flat notes array; renderer decides column layout

**Before You Build**

- Ask before data format decisions
- Set up test infrastructure before major features

**File Organization**

- Co-locate related files (test HTML + JS together)
- Unit tests next to source (`*.test.ts` next to `*.ts`)
