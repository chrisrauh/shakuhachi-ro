# Claude Code Instructions

- KISS (Keep It Simple, Stupid)
- Tasks: [TODO.md](./TODO.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Dev Workflow

1. Create feature branch
2. Make changes and commit
3. Create PR with `gh pr create`
4. **Ask user to review and merge** (DO NOT merge automatically)
5. Wait for user confirmation that PR is merged
6. Delete feature branch (local + remote) with `git branch -d <branch> && git push origin --delete <branch>`

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

**Testing**

- Unit tests (Vitest): Logic, validation, transformations
- Visual tests (Browser): Rendering, layout
- Run tests after each task
- Run tests before pushing
