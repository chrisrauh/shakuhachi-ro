# Claude Code Instructions

- Tasks: [TODO.md](./TODO.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Software engineering principles

- KISS (Keep It Simple, Stupid)

## Dev Workflow

1. Create feature branch
2. Make changes and test
3. Commit
4. Create PR with `gh pr create`
5. **Ask user to review and merge** (DO NOT merge automatically)
6. Wait for user confirmation that PR is merged
7. Delete feature branch (local + remote) with `git branch -d <branch> && git push origin --delete <branch>`

**Testing**

- Unit tests (Vitest): Logic, validation, transformations
- Visual tests (Browser): Rendering, layout
- Run tests after each task
- Run tests before pushing

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
