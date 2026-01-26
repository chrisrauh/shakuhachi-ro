# Claude Code Instructions

- Tasks: [TODO.md](./TODO.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Software engineering principles

- KISS (Keep It Simple, Stupid)

## Dev Workflow

1. Create feature branch
2. Make changes and test
3. Commit
4. **Ask user** if you should create PR with `gh pr create`
5. **Ask user to review and merge** (DO NOT merge automatically)
6. Wait for user confirmation that PR is merged
7. Delete feature branch (local + remote) with `git branch -d <branch> && git push origin --delete <branch>`

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
