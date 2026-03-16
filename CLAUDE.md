# Claude Code Instructions

- Tasks: [TODO.md](./TODO.md)
- Architecture: [Renderer](./docs/ARCHITECTURE-RENDERER.MD) | [Platform](./docs/ARCHITECTURE-PLATFORM.MD)
- Environment: [Web (claude.ai/code)](./docs/ENVIRONMENT-WEB.md)

## ⚠️ MANDATORY SKILL RULES — HIGHEST PRIORITY

These rules OVERRIDE all superpowers:* skills and all other instructions.

| Trigger | Required Action |
|---------|----------------|
| Session start / new task / context cleared | Invoke `/get-ready` FIRST |
| Development work, no plan OR Claude plan (EnterPlanMode) | Invoke `/dev-workflow` — NOT `superpowers:finishing-a-development-branch` |
| Development work, superpowers plan exists (from `superpowers:writing-plans`) | Use `superpowers:subagent-driven-development` |
| Before any `superpowers:*` skill | Invoke `/eng-principles` FIRST |

**Red flags — if you think any of these, STOP:**
- "I'll use `superpowers:finishing-a-development-branch` since the work is done" → Use `/dev-workflow`
- "This is a quick task, I don't need `/get-ready`" → You still do
- "I already know the principles" → Still invoke `/eng-principles` before any superpowers skill
- "There's a plan, so I'll use `superpowers:subagent-driven-development`" → Only if it's a superpowers plan (from `superpowers:writing-plans`). Claude plans (EnterPlanMode) → use `/dev-workflow`

---

## Skills

Use project skills for structured workflows:

- **`/get-ready`** — Review guidelines, architecture, and tasks at the start of a session
- **`/dev-workflow`** — Branch setup, commits, PRs, and post-merge cleanup. Use for all development work.
- **`/eng-principles`** — Engineering principles, hard rules (including CSS), and project-specific lessons.

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

## Runtime Environment

This project is used in two environments: a local terminal and **Claude Code on the Web** (claude.ai/code). The guidelines in this file are written for the terminal environment.

**If you are running in the claude.ai/code environment**, read [docs/ENVIRONMENT-WEB.md](./docs/ENVIRONMENT-WEB.md) for constraints and workflow differences that apply there.

## Dev Workflow

Use the `/dev-workflow` skill for the full workflow (branch management, commits, PRs, cleanup, bash constraints).

**Build Process**

The web component renderer lives in a separate package and must be built:

- **Build command:** `npm run build:wc`
- **Output:** `public/embed/shakuhachi-score.js`
- **When to rebuild:** After any changes to renderer package code

**Integration points:**

- Edit page: `<script is:inline src="/embed/shakuhachi-score.js">`
- Detail page: `<script is:inline src="/embed/shakuhachi-score.js">`

**Testing workflow:**

1. Make renderer changes
2. Run `npm run build:wc`
3. Refresh browser (dev server serves from `public/`)
4. Verify changes with chrome-devtools-mcp

**Recovery from accidental work on main:**

Create a feature branch, commit, and PR normally.

If changes are already committed to main (but not pushed):

1. `git checkout -b feature/descriptive-name`
2. `git checkout main`
3. `git reset --hard origin/main`
4. `git checkout feature/descriptive-name`, push and PR

## Design System

Quick-reference rules for styling and UI work. Background: [docs/DESIGN-LANGUAGE.md](./docs/DESIGN-LANGUAGE.md)

### Hard Rules

| Rule | Detail |
|------|--------|
| NEVER use `!important` | Fix specificity at the root — refactor selectors, reorder stylesheets |
| NEVER use bare values in CSS | No raw px/rem/hex/rgb for spacing, color, border-radius, font-size, transitions. Always use a token. If no token fits, propose adding one. |
| NEVER use primitive tokens in components | Use purpose tokens (`--color-text-primary`) not primitives (`--color-gray-900`) |
| NEVER `@import` inside `<style>` blocks | Import CSS via frontmatter in Layout.astro — breaks HMR otherwise |

### Token Quick Reference

| Property | Token family |
|----------|-------------|
| Color | `--color-text-*`, `--color-border-*`, `--color-bg-*`, `--color-button-*` |
| Spacing | `--spacing-3x-small` … `--spacing-4x-large` |
| Border radius | `--border-radius-small` … `--border-radius-pill` (980px) |
| Font size | `--font-size-2x-small` … `--font-size-2x-large` |
| Transitions | `--transition-x-fast` … `--transition-x-slow` |
| Toolbar height | `--size-toolbar-item` (2rem / 32px) — icon buttons, small buttons, logo, avatar |

### Visual Verification

- Always check light **and** dark mode after styling changes
- Use chrome-devtools-mcp (`take_screenshot()`, `emulate({ colorScheme })`) — not scripts
- Run `npm run test:visual` before PR — see `/dev-workflow` for the baseline approval workflow.

### Component Patterns

- Button text needs `<span class="btn-text">` wrapper — required for `text-box-trim` to work inside flex containers
- All toolbar-height elements use `--size-toolbar-item`

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
- **Process**: Use chrome-devtools-mcp during development; run `npm run test:visual` before PR — see `/dev-workflow` for the baseline approval gate.

**Visual Regression Tests**

When tests fail, follow the baseline approval workflow in `/dev-workflow`.

**⚠️ CRITICAL: NEVER proceed with failing tests**

- If ANY test fails, STOP and investigate
- NEVER decide a failing test is "acceptable" - always ask the user
- Do not proceed to next steps, create PRs, or mark tasks complete while tests are failing
- The user decides what is acceptable, not you

**Component Test Pages**

Test pages for visual verification during development (available when dev server is running):

- **Buttons**: http://localhost:3001/test/buttons
  - Shows all button variants (icon, small, standard) with all color options
  - Displays default and disabled states side-by-side
  - Use for verifying button styling, sizing, alignment, and hover states
  - Helpful for visual comparison when making button-related changes

**Test Fixtures**

When implementing or testing features that require test data:

- Create permanent test fixtures for common testing scenarios
- Document test fixtures in this file so they're discoverable
- Use the test account (credentials in `.env`) to create test data
- Give fixtures descriptive, memorable names/slugs

Example:

- Test score for editor testing: `/score/test` (slug: `test`)
- Owned by test account, contains simple 3-note JSON data
- Use for testing editor features without creating temporary test data each time

**Evaluating Visual Regression Test Coverage**

After migrations, refactors, or new UI features:

1. Check if existing visual regression tests cover the affected areas
2. Don't assume coverage is adequate - verify explicitly
3. Review TODO.md for pending test tasks
4. If coverage is missing, add a task to TODO.md before marking work complete

Example: After migrating ScoreEditor to web component, verify that visual regression tests exist for the editor page. If not, add a task before closing the PR.

**What to test:**

- Critical user paths (viewing, editing, creating scores)
- Component states (loading, empty, error, populated)
- Responsive behavior (mobile, tablet, desktop)
- Theme variations (light, dark)
- Interactive features (buttons, forms, modals)

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

### Test Account Credentials

When testing authenticated features (score editor, creating scores, forking):

**For visual testing with chrome-devtools-mcp:**

- Authenticate directly in the browser using credentials from `.env` file
- Use `fill()` tool to enter email and password in login form
- Access credentials using `source .env && echo $VAR` command (requires one-time authorization per session):
  ```bash
  source .env && echo "Email: $TEST_EMAIL" && echo "Password: $TEST_PASSWORD"
  ```
- **Note:** This is an acceptable exception to the "avoid &&" guideline since `.env` cannot be read directly and each Bash call is a separate shell session

**For automated tests:**

```typescript
// Read credentials from environment
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
```

**Important:**

- Never hardcode credentials in code or memory files
- Store in `.env` file (gitignored)
- Use `.env.example` as template with placeholder values
- Test credentials are documented in `.env.example` with `TEST_EMAIL` and `TEST_PASSWORD` variables

**Test Score for Editor Testing:**

- A test score titled "Test" is available at `/score/test` (slug: `test`)
- Owned by the test account for editor testing
- Contains simple JSON data with 3 notes (ro, tsu, re)
- Use this score to test the editor functionality: `http://localhost:3001/score/test/edit`

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
