# Claude Code Instructions

- KISS (Keep It Simple, Stupid)
- Tasks: [TODO.md](./TODO.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)

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

**After Merge**
- Immediately delete feature branch (local + remote)

**Testing**
- Unit tests (Vitest): Logic, validation, transformations
- Visual tests (Browser): Rendering, layout
- Run tests before pushing
