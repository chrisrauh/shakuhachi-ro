# Claude Code Instructions

- Tasks: [TODO.md](./TODO.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Software engineering principles

- KISS (Keep It Simple, Stupid)

## Dev Workflow

1. Create feature branch
2. Make changes and test
3. Commit locally (do NOT push yet)
4. **Mark completed tasks in TODO.md** with [x]
5. **Ask user** if you should create PR
6. When creating PR: push branch to remote and use `gh pr create`
7. **Ask user to review and merge** (DO NOT merge automatically)
8. Wait for user confirmation that PR is merged
9. Delete feature branch (local + remote) with `git branch -d <branch> && git push origin --delete <branch>`
10. **Remove completed tasks from TODO.md** (tasks marked with [x])
11. **Look for next task in TODO.md** and ask user if you should work on it

**Testing**

- Unit tests (Vitest): Logic, validation, transformations
- Visual tests (Browser): Rendering, layout
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
