# Claude Code Instructions

- Tasks: [TODO.md](./TODO.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Software engineering principles

Adhere to these principles when writing code:

- **Simplicity (KISS - Keep It Simple, Stupid)**
  Prefer the simplest thing that works. Complexity is technical debt in disguise.

- **Single Responsibility**
  A module/function/class should have one reason to change. This is the fastest way to keep systems understandable.

- **Separation of Concerns**
  Don’t mix UI, business logic, data access, config, etc. Boundaries are what make systems evolvable.

- **Abstraction with Intent**
  Abstract _why_, not _how_. Bad abstractions are worse than duplication.

- **DRY (with judgment)**
  Eliminate _true_ duplication, not accidental similarity. Premature DRY creates tight coupling.

- **Loose Coupling, High Cohesion**
  Things that change together should live together; things that change independently shouldn’t know much about each other.

- **Make Change Cheap**
  Optimize for iteration, not initial elegance. The best design is the one that’s easy to modify.

- **Explicit Over Implicit**
  Readability beats cleverness. Code is read far more than it’s written.

- **Fail Fast, Fail Loud**
  Errors should surface immediately and clearly. Silent failure is a bug factory.

- **Test What Matters**
  Tests are about confidence, not coverage. Test behavior and contracts, not implementation details.

Single meta-principle: **optimize for humans, not machines**. Everything else flows from that.

## Dev Workflow

1. Create feature branch
2. Make changes and test
3. Commit locally (do NOT push yet)
4. Mark completed tasks in TODO.md with [x]
5. Ask user if you should create PR
6. When creating PR: push branch to remote and use `gh pr create`
7. Ask user to review and merge (DO NOT merge automatically)
8. Wait for user confirmation that PR is merged
9. Delete feature branch (local + remote) with `git branch -d <branch> && git push origin --delete <branch>`
10. Remove completed tasks from TODO.md (tasks marked with [x])
11. Look for next task in TODO.md and ask user if you should work on it

**Testing**

- Unit tests (Vitest): Logic, validation, transformations
- Visual tests (Browser): Rendering, layout
- **Always test visual changes with screenshots** - Take screenshots before/after to verify rendering
- Run tests after each task
- Run tests before pushing

**Dev Server Management**

- Start dev server ONCE when beginning work on a feature
- Leave it running while iterating and testing
- Only stop it when completely done with the PR/task
- DO NOT start and stop the server repeatedly for each screenshot or test
- If server is already running, reuse it

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
