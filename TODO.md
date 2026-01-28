# TODO - Shakuhachi Score Renderer

This file tracks active tasks for completing the shakuhachi score renderer project. Complete tasks in order, complete one task at a time, check if the task hasn't already been implemented, finish a task before starting the next, following the dev workflow defined in `CLAUDE.md`.

**Goal:** Render the Akatombo score matching the reference image.
**Reference Image:** `references/scores-pictures/akatombo-kinko-score.png`
**Secondary Reference Image comparing western and kinko notation:** `references/scores-pictures/akatombo-kinko-western-score.jpg`

## Current Focus: ScoreRenderer Architecture Refactoring

**Goal:** Extract rendering logic from index.html into a reusable, VexFlow-inspired ScoreRenderer module.
**Reference:** See `docs/REFACTORING_PLAN.md` for detailed architecture and principles.

### Phase 1: Foundation - Render Options Interface ✅ COMPLETE
- [x] Create `src/renderer/RenderOptions.ts` with type-safe configuration interface
- [x] Define all display, layout, typography, and modifier options
- [x] Write unit tests for default value merging
- [x] Document options in JSDoc comments

### Phase 2: Extract Modifier Configuration ✅ COMPLETE
- [x] Create `src/renderer/ModifierConfigurator.ts`
- [x] Extract modifier configuration logic from index.html (lines 158-183)
- [x] Implement static `configureModifiers()` method
- [x] Write unit tests for various option combinations
- [x] Verify octave mark and meri mark configuration works

### Phase 3: Extract Layout Calculation
- [x] Create `src/renderer/ColumnLayoutCalculator.ts`
- [x] Define `ColumnLayout` and `ColumnInfo` interfaces
- [x] Extract column layout logic from index.html (lines 192-248)
- [x] Implement `calculateLayout()` method
- [x] Implement note positioning calculation
- [x] Write unit tests for column breaking, positioning, centering
- [x] Test with various note counts and viewport sizes

### Phase 4: Create High-Level ScoreRenderer
- [ ] Create `src/renderer/ScoreRenderer.ts`
- [ ] Implement constructor with container and options
- [ ] Implement `renderFromURL()` method
- [ ] Implement `renderFromScoreData()` method
- [ ] Implement `renderNotes()` method
- [ ] Implement rendering pipeline (parse → configure → layout → render)
- [ ] Implement `refresh()`, `setOptions()`, `resize()` methods
- [ ] Extract and implement debug label rendering
- [ ] Write integration tests for rendering pipeline

### Phase 5: Add Convenience Layer
- [ ] Add `renderScoreFromURL()` factory function
- [ ] Add `renderScore()` factory function
- [ ] Write tests for factory functions

### Phase 6: Simplify index.html
- [ ] Rewrite index.html to use ScoreRenderer
- [ ] Reduce from 200+ lines to ~10 lines
- [ ] Take before/after screenshots for visual comparison
- [ ] Verify no visual regressions
- [ ] Test debug mode, octave marks toggle

### Phase 7: Update Module Exports
- [ ] Update `src/index.ts` with ScoreRenderer exports
- [ ] Export RenderOptions type
- [ ] Export ModifierConfigurator, ColumnLayoutCalculator
- [ ] Export ColumnLayout and ColumnInfo types

### Phase 8: Update Test Pages
- [ ] Update test HTML files to use ScoreRenderer
- [ ] Verify all test pages work correctly
- [ ] Ensure reusability across different contexts

### Phase 9: Documentation
- [ ] Create `docs/ARCHITECTURE.md` explaining component design
- [ ] Create `docs/API.md` with ScoreRenderer API reference
- [ ] Update `README.md` with usage examples
- [ ] Add migration guide for existing code
- [ ] Document VexFlow-inspired patterns

### Phase 10: Cleanup and Polish
- [ ] Review and remove any unused code from old implementation
- [ ] Clean up temporary test files and artifacts
- [ ] Remove or update deprecated patterns
- [ ] Remove inline comments referencing old implementation
- [ ] Verify all old rendering logic has been properly extracted
- [ ] Clean up screenshots/ directory if needed
- [ ] Remove any TODO comments added during refactoring
- [ ] Final code review for consistency and style
- [ ] Verify all tests pass
- [ ] Take final screenshots for documentation

---

## Deferred Tasks (After Refactoring)

**Rendering & Layout**

- [ ] Verify atari marks render correctly
- [ ] Notes per column distribution differs from reference
- [ ] Responsive layout considerations

## Next Phase: Polish & Documentation

**UI Enhancements**
- [ ] Add score selector dropdown
- [ ] Load different score files dynamically
- [ ] Error handling for missing files
- [ ] User-friendly error messages

**Documentation**
- [ ] Add JSDoc comments to public APIs
- [ ] Write usage guide in references/README.md
- [ ] Update README.md with project overview
- [ ] Document score data format
- [ ] Cross-browser testing notes

## Future Enhancements

**Additional Modifiers**

- [ ] YuriModifier (vibrato)
- [ ] MuraikiModifier (breathy tone)
- [ ] SuriModifier (sliding)
- [ ] OriModifier (pitch bend)

**Performance**

- [ ] Profile rendering performance
- [ ] Optimize frequent operations
- [ ] Add caching where appropriate

## Future Platform Features

These are for the future score-sharing platform (post-renderer completion):

- [ ] Score editor web component
- [ ] Database integration for storing scores
- [ ] Fork/share functionality
- [ ] Comments on scores
- [ ] Audio recording uploads
- [ ] User authentication system
- [ ] Score search and discovery

## Backlog / Ideas

- [ ] Multiple score input formats (import from ABC, etc.)
- [ ] MIDI playback mapping
- [ ] Western staff intermixing
- [ ] Custom font support for traditional glyphs
- [ ] Export to PDF/PNG
- [ ] Print stylesheet optimization
- [ ] Score transposition tool
- [ ] Automatic column breaking algorithm
