# Claude Code Instructions

- Tasks: [TODO.md](./TODO.md)
- Architecture: [docs/architecture.md](./docs/architecture.md)

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

⚠️ **CRITICAL - READ BEFORE EVERY COMMIT** ⚠️

**NEVER COMMIT DIRECTLY TO MAIN!**
- ❌ WRONG: `git commit` on main branch → push to main
- ✅ RIGHT: Create feature branch FIRST, then commit

**Before running `git commit`, verify:**
```bash
git branch --show-current  # Must NOT be "main"
```

If you're on main, STOP and create a feature branch first!

---

**Standard workflow:**

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
- **Always test visual changes with chrome-devtools-mcp** - See "Chrome DevTools MCP" section for screenshot workflow
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
- **Process**:
  - During development: Use chrome-devtools-mcp for iterative before/after screenshots (see workflow below)
  - Before PR: Run `npm run test:visual` to verify against regression baselines

**Visual Regression Test Workflow**

**When to run:** At the end of a feature, just before creating the PR (not during iterative development)

Run `npm run test:visual` to verify changes against Playwright baselines.

When Playwright visual regression tests fail:
- Run `npx playwright show-report` to open the diff viewer
- Ask user to review and approve changes
- Only update baselines after user approval with `npm run test:visual:update`
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

**Chrome DevTools MCP - Visual Verification Workflow**

**CRITICAL: Always use chrome-devtools-mcp** for visual verification during development.
- DO NOT create temporary screenshot scripts
- DO NOT use external Bash scripts for screenshots
- USE chrome-devtools-mcp tools directly for full debugging capabilities

**When to use visual verification:**
- Styling/layout changes: Verify the visual appearance looks correct
- Refactoring: Verify nothing changed visually (before/after comparison)
- Note: `take_snapshot()` gives you markup structure, `take_screenshot()` shows actual rendered appearance

**DO NOT save screenshots to files** - use them for immediate visual verification only

### Visual Verification Pattern

**For styling/layout work:**
```
# Navigate to the page
navigate_page({ url: "http://localhost:PORT/path" })

# Check light mode appearance
emulate({ colorScheme: "light" })
take_screenshot() // Visual verification - no filePath needed

# Check dark mode appearance
emulate({ colorScheme: "dark" })
take_screenshot() // Visual verification - no filePath needed

# Verify page state
take_snapshot() // Check element structure
list_console_messages() // Check for errors
```

**For refactors (verify nothing changed):**
```
# Before changes - capture baseline for comparison
navigate_page({ url: "http://localhost:PORT/path" })
emulate({ colorScheme: "light" })
take_screenshot() // Remember what it looks like

# Make code changes
# Run tests: `npm test`

# After changes - verify nothing changed visually
navigate_page({ type: "reload" })
emulate({ colorScheme: "light" })
take_screenshot() // Compare to what you saw before

# Verify in dark mode too
emulate({ colorScheme: "dark" })
take_screenshot() // Verify dark mode unchanged

# Check for errors
take_snapshot() // Verify element structure unchanged
list_console_messages() // Check for new errors
```
- Element structure changes if significant

### Element-Specific Debugging

When debugging specific component issues:

**1. Get page structure:**
```
take_snapshot({ verbose: false })
// Returns element tree with UIDs for targeting
```

**2. Screenshot specific element:**
```
take_screenshot({ uid: "element-uid" })
// Visual verification of specific element
```

**3. Inspect element state:**
```
evaluate_script({
  function: "(el) => ({ bounds: el.getBoundingClientRect(), styles: window.getComputedStyle(el) })",
  args: [{ uid: "element-uid" }]
})
```

### Performance Profiling

When optimizing score rendering performance:

**1. Start profiling:**
```
navigate_page({ url: "http://localhost:PORT/score/akatombo" })
performance_start_trace({ reload: true, autoStop: true })
```

**2. Review insights:**
```
performance_analyze_insight({ insightSetId: "...", insightName: "LCPBreakdown" })
```

**3. Save trace data (if needed for analysis):**
```
performance_stop_trace({ filePath: "traces/score-rendering.json.gz" })
```

### Multi-Viewport Testing

When testing responsive design:

**1. Desktop (1280x720):**
```
emulate({ viewport: { width: 1280, height: 720, deviceScaleFactor: 1 } })
take_screenshot() // Verify desktop layout
```

**2. Tablet (768x1024):**
```
emulate({ viewport: { width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true } })
take_screenshot() // Verify tablet layout
```

**3. Mobile (375x667):**
```
emulate({ viewport: { width: 375, height: 667, deviceScaleFactor: 3, isMobile: true, hasTouch: true } })
take_screenshot() // Verify mobile layout
```

### Debugging Visual Issues

When investigating unexpected visual behavior:

**1. Visual + structural inspection:**
```
take_screenshot() // See the rendered page
take_snapshot({ verbose: true }) // Detailed a11y tree structure
list_console_messages({ types: ["error", "warn"] }) // Errors/warnings only
list_network_requests({ resourceTypes: ["xhr", "fetch"] }) // API calls
```

**2. Get specific request details:**
```
get_network_request({ reqid: 123 }) // Inspect failed API call
```

**3. Evaluate custom debugging code:**
```
evaluate_script({
  function: "() => { return { scoreData: window.__SCORE_DATA__, renderState: window.__RENDER_STATE__ } }"
})
```

### Guidelines

- **DO NOT save screenshots to files** - use for immediate visual verification only
- Always verify both light and dark modes during styling/layout work
- Use `take_snapshot()` to verify element structure (gives markup, not visuals)
- Use `take_screenshot()` to verify rendered appearance (shows actual visuals)
- Use `list_console_messages()` to catch JavaScript errors proactively
- Port is typically 3002 or 3003 for dev server (verify with list_pages)

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
