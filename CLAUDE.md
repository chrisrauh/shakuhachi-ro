# Claude Code Instructions

- Tasks: [TODO.md](./TODO.md)
- Architecture: [Renderer](./docs/ARCHITECTURE-RENDERER.MD) | [Platform](./docs/ARCHITECTURE-PLATFORM.MD)

## Project Context

**This project has two parts:**

1. **Web Platform** (shakuhachi.ro)
   - Share shakuhachi scores via links
   - Primary use case: Mobile viewing of shared scores
   - Secondary use case: Practice/perform from the platform
   - Built with Astro + Supabase

2. **Renderer Library** (standalone package)
   - Framework-agnostic TypeScript/SVG renderer
   - Similar to VexFlow but for shakuhachi notation
   - Powers the web platform
   - Published for other developers to use

**How they relate:**

- The platform uses and tests the renderer in real-world scenarios
- Renderer improvements are driven by platform needs
- Both are production-quality, just serving different audiences

## Software engineering principles

- **Simplicity (KISS)** - Prefer the simplest thing that works. Complexity is technical debt.
- **YAGNI (You Aren't Gonna Need It)** - Don't build features, abstractions, or complexity for hypothetical future needs. Build what's needed now. Future requirements will change anyway.
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

⚠️ **NEVER COMMIT DIRECTLY TO MAIN!** Verify with `git branch --show-current` before every commit.

**Standard workflow:**

1. Create feature branch
2. Make changes and test
3. **Ask user to review changes before committing**
4. Commit locally (no push yet, no "Co-Authored-By")
5. Mark completed tasks in TODO.md with [x]
6. Ask user if you should create PR
7. Push and `gh pr create` (no "Generated with Claude Code" in description)
8. **STOP - wait for user to merge** (never use `gh pr merge` or `--auto`)
9. After user confirms: `git branch -d <branch> && git push origin --delete <branch>`
10. Remove completed tasks from TODO.md
11. Look for next task in TODO.md and ask user if you should work on it

For multi-phase work, create separate PR for each phase.

## Testing

- Unit tests (Vitest): Logic, validation, transformations
- Visual tests (Browser): Rendering, layout
- **Always test visual changes with chrome-devtools-mcp** - See "Chrome DevTools MCP" section
- **When you find an error during development, implement a unit test that would have caught that error**
- **Run full test suite after each task**: `npm test` (includes type-check, lint, and vitest)
- **CRITICAL: Run full test suite before pushing**: `npm test` must pass before any push to remote

**Writing Tests**

Follow "Test What Matters" - focus on behavior and confidence, not coverage or exhaustiveness:

- **Test behavior, not implementation** - Test what the function does, not how it does it
- **Keep tests focused** - 5-10 tests per module is usually sufficient; more suggests over-testing
- **Cover critical paths** - Happy path, common edge cases, known failure modes
- **Skip redundant tests** - Don't test variations of the same behavior (e.g., multiple valid inputs that take the same code path)
- **Test outcomes** - What the user/caller experiences, not internal state changes

Example: For a slug utility, test core transformations (lowercase, spaces→hyphens), special cases (empty input, non-ASCII), and unique slug generation. Don't test every possible special character individually.

**Visual Testing Checklist (for UI changes)**

- **Symbols**: All base symbols render correctly (ロ,ツ,レ,チ,リ,ウ,ヒ); no clipping
- **Modifiers**: Meri (メ中大) left of notes, octave (乙甲) at top, duration dots at bottom; all visible, no overlap
- **Layout**: Consistent spacing, adequate margins (top for octave, bottom for dots), no overflow
- **SVG**: `overflow: visible` to prevent clipping of modifiers beyond boundaries
- **Modes**: Debug and non-debug render identically
- **Edge cases**: First/last notes in columns, multiple modifiers, rests
- **Process**: Use chrome-devtools-mcp during development; run `npm run test:visual` before PR

**Visual Regression Tests**

Run `npm run test:visual` before creating PR. When tests fail:

- Run `npx playwright show-report` to open the diff viewer
- Ask user to review and approve changes
- Only update baselines after user approval with `npm run test:visual:update`
- Unit tests can be updated directly as they don't require visual approval

## Task Tracking

For non-trivial tasks (anything requiring 3+ steps or touching multiple files):

- Use TodoWrite at the start to break down the work into specific subtasks
- Each subtask should be actionable and verifiable (not vague like "fix the issue")
- Update status to in_progress BEFORE starting a subtask
- Mark completed IMMEDIATELY after finishing each subtask (don't batch completions)

**When to use:**

- Removing a feature (remove from types → API → UI → tests → docs)
- Adding a feature (plan → implement → test → document)
- Debugging complex issues (reproduce → identify root cause → fix → verify)

**Don't use for:** Single-file changes, trivial updates, simple bug fixes

## Chrome DevTools MCP

Use chrome-devtools-mcp for visual verification (not Bash scripts, not saving to files).

- `take_snapshot()` = markup structure
- `take_screenshot()` = rendered appearance

**Dev server:** Start once per session (port 3001), leave running throughout. Always verify both light and dark modes.

### Visual Verification Patterns

**For styling/layout work:**

```
navigate_page({ url: "http://localhost:PORT/path" })
emulate({ colorScheme: "light" })
take_screenshot()
emulate({ colorScheme: "dark" })
take_screenshot()
take_snapshot()
list_console_messages()
```

**For refactors (verify nothing changed):**

```
# Before changes
navigate_page({ url: "http://localhost:PORT/path" })
take_screenshot()

# After changes
navigate_page({ type: "reload" })
take_screenshot()
emulate({ colorScheme: "dark" })
take_screenshot()
list_console_messages()
```

### Element-Specific Debugging

```
take_snapshot({ verbose: false })              // Get element tree with UIDs
take_screenshot({ uid: "element-uid" })        // Screenshot specific element
evaluate_script({
  function: "(el) => ({ bounds: el.getBoundingClientRect(), styles: window.getComputedStyle(el) })",
  args: [{ uid: "element-uid" }]
})
```

### Performance Profiling

```
navigate_page({ url: "http://localhost:PORT/score/akatombo" })
performance_start_trace({ reload: true, autoStop: true })
performance_analyze_insight({ insightSetId: "...", insightName: "LCPBreakdown" })
performance_stop_trace({ filePath: "traces/score-rendering.json.gz" })  // Optional
```

### Multi-Viewport Testing

```
emulate({ viewport: { width: 1280, height: 720, deviceScaleFactor: 1 } })                              // Desktop
emulate({ viewport: { width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true } })              // Tablet
emulate({ viewport: { width: 375, height: 667, deviceScaleFactor: 3, isMobile: true, hasTouch: true } }) // Mobile
```

### Debugging Visual Issues

```
take_screenshot()
take_snapshot({ verbose: true })
list_console_messages({ types: ["error", "warn"] })
list_network_requests({ resourceTypes: ["xhr", "fetch"] })
get_network_request({ reqid: 123 })
evaluate_script({ function: "() => ({ scoreData: window.__SCORE_DATA__, renderState: window.__RENDER_STATE__ })" })
```

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
