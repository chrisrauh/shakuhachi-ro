# Claude Code Instructions

> **For technical architecture and design patterns, see [ARCHITECTURE.md](./ARCHITECTURE.md). For active tasks to execute, see [TODO.md](./TODO.md).**

## General Principles

- **KISS (Keep It Simple, Stupid)** - Apply at every level: architecture, code, data formats, tests, documentation
- **Separation of Concerns** - Keep data (what) separate from presentation (how)
- **Standards-Compatible, Not Standards-Dependent** - Follow standard patterns (e.g., MusicXML structure) without over-engineering
- **Test Early** - Set up testing infrastructure before major features
- **Verify Everything** - Run tests after every significant change

## Active Tasks

Active tasks for completing the project are tracked in **[TODO.md](./TODO.md)**. Execute tasks from TODO.md in order to complete the project.

## Feature Development Workflow

When asked to implement a feature, follow this workflow:

1. **Create a feature branch** - Create a new branch for the feature before starting work
2. **Implement the feature** - Complete the implementation and commit changes
3. **Run tests** - Verify all tests pass before creating PR
4. **Create a pull request** - Use GitHub to create PR
5. **Ask user: "ready to push?"** - User can merge directly (is admin, no approval needed)
6. **Merge and cleanup** - After merge, immediately delete feature branch (local + remote)

## Working Protocol (Per Implementation Step)

When implementing each step within a feature:

1. **Suggest** your specific implementation approach for the step
2. **Wait** for user validation/feedback (especially for data format decisions)
3. **Execute** only after approval (or discuss modifications)
4. **Validate** by running tests and/or checking in browser

## Design Principles

### Data vs Presentation
- **Data structures** describe WHAT (content, semantics)
- **Renderers** determine HOW (layout, styling, column breaks)
- **Never** put presentation logic in data formats
- **Example**: Score data has flat notes array; renderer decides column layout based on available space

### File Organization
- **Co-locate related files** - Test HTML + JS in same directory
- **Unit tests** - Co-locate with source files (`*.test.ts` next to `*.ts`)
- **Visual tests** - Keep HTML and JS together in `test/` directory
- **Clarity over convention** - If two files are related, put them together

### Phased Implementation
Follow this sequence for major features:
1. **Analysis** - Understand requirements, examine examples, document findings
2. **Design** - Design data formats, APIs, architecture (get validation!)
3. **Implementation** - Write code following the design
4. **Testing** - Unit tests + visual validation
5. **Documentation** - Update docs, README, architecture notes

### Testing Strategy
- **Set up testing first** - Before major features, ensure testing infrastructure exists
- **Two complementary approaches**:
  - **Unit tests (Vitest)** - Logic, validation, data transformations
  - **Visual tests (Browser)** - Rendering, layout, visual validation
- **Run tests frequently** - After every significant change
- **Test files close to source** - Easy to find and maintain

## Git Workflow

### Branch Hygiene
- Create feature branch for each feature
- Commit frequently with clear messages
- Push only when ready for PR
- **Immediately after merge**: Delete both local and remote feature branches
- Keep `main` clean and synced with `origin/main`

### Merge Conflicts
- When conflicts occur, preserve all work
- Analyze branches before taking action
- Ask user before potentially destructive operations
- Prefer cherry-pick over merge when reconciling divergent branches

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript and build project
- `npm test` - Run unit tests in watch mode
- `npm run test:run` - Run unit tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint checks
- `npm run screenshot` - Take screenshot for visual debugging

## Development Environment

- Using **Vite** for development server and building
- **TypeScript** for type safety
- **Vitest** for unit testing
- **Playwright** for screenshots and visual debugging
- **ESLint** for code quality
- Browser-based visual testing and validation

## Common Patterns

### When to Ask for Validation
- **Always** before implementing data format decisions
- When choosing between multiple architectural approaches
- When making breaking changes to existing APIs
- When adding new dependencies

### When NOT to Use Plan Mode
- Research tasks (exploring codebase, understanding how things work)
- Reading documentation or analyzing existing code
- Gathering information or answering questions
- **Only use plan mode** for planning implementation of code changes

### Communication Style
- Be direct and action-oriented
- "Ready to push?" not "Ready for your review and approval?"
- Focus on facts and next actions
- Don't over-explain unless asked
