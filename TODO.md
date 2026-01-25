# TODO - Shakuhachi Score Renderer

This file tracks active tasks for completing the shakuhachi score renderer project. Complete tasks in order, following the workflow defined in `CLAUDE.md`.

## Current Sprint

### Documentation & Polish

- [ ] Add comprehensive JSDoc comments to all public APIs
  - [ ] SVGRenderer class and methods
  - [ ] Formatter class and methods
  - [ ] VerticalSystem class and methods
  - [ ] ShakuNote class and methods
  - [ ] All Modifier classes

- [ ] Write usage guide in examples/README.md
  - [ ] Basic usage examples
  - [ ] Code samples for each modifier type
  - [ ] Common patterns and best practices

- [ ] Cross-browser testing
  - [ ] Test in Chrome
  - [ ] Test in Firefox
  - [ ] Test in Safari
  - [ ] Document any browser-specific issues

### Optional Enhancements

- [ ] Add Tozan-ryū support
  - [ ] Implement numeric symbol rendering
  - [ ] Add Tozan-specific modifiers
  - [ ] Create Tozan examples

- [ ] Additional technique modifiers
  - [ ] YuriModifier (vibrato)
  - [ ] MuraikiModifier (breathy tone)
  - [ ] SuriModifier (sliding)
  - [ ] OriModifier (pitch bend)

- [ ] Performance optimizations
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

- [ ] Input format design (DSL vs JSON vs fluent API)
- [ ] Pagination heuristics (symbols per column, page breaks)
- [ ] MIDI playback mapping (optional)
- [ ] Western staff intermixing (future consideration)
- [ ] Custom font support for traditional shakuhachi glyphs
- [ ] Export to PDF/PNG
- [ ] Print stylesheet optimization

---

**Note:** When implementing tasks, follow the workflow in `CLAUDE.md`:
1. Create feature branch
2. Implement the feature
3. Create pull request
4. Review and merge
