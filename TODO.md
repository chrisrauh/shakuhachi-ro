# TODO - Shakuhachi Score Renderer

This file tracks active tasks for completing the shakuhachi score renderer project. Complete tasks in order, complete one task at a time, check if the task hasn't already been implemented, finish a task before starting the next, following the dev workflow defined in `CLAUDE.md`.

**Goal:** Render the Akatombo score matching the reference image.
**Reference Image:** `references/scores-pictures/akatombo-kinko-score.png`
**Secondary Reference Image comparing western and kinko notation:** `references/scores-pictures/akatombo-kinko-western-score.jpg`

## Current Tasks

### Rendering & Layout

- [x] Responsive layout considerations

### UI Enhancements

- [ ] Add score selector dropdown
- [ ] Load different score files dynamically
- [ ] Error handling for missing files
- [ ] User-friendly error messages

### Documentation

- [ ] Add JSDoc comments to public APIs
- [ ] Write usage guide in references/README.md
- [ ] Document score data format
- [ ] Cross-browser testing notes

## Backlog

### Rendering & Layout

- [ ] Verify atari marks render correctly

### Additional Modifiers

- [ ] YuriModifier (vibrato)
- [ ] MuraikiModifier (breathy tone)
- [ ] SuriModifier (sliding)
- [ ] OriModifier (pitch bend)

### Performance & Optimization

- [ ] Profile rendering performance
- [ ] Optimize frequent operations
- [ ] Add caching where appropriate
- [ ] Revisit column breaking with TeX-inspired badness algorithm
  - [ ] Implement badness metric for column height variance
  - [ ] Add demerits for orphans (single notes in columns)
  - [ ] Add penalties for breaking at certain notation points
  - [ ] Implement global optimization across score (Knuth-Plass approach)
  - Prerequisites: Complete all modifiers and annotations first

### Platform Features

These are for the future score-sharing platform (post-renderer completion):

- [ ] Score editor web component
- [ ] Database integration for storing scores
- [ ] Fork/share functionality
- [ ] Comments on scores
- [ ] Audio recording uploads
- [ ] User authentication system
- [ ] Score search and discovery

## Future Ideas

- [ ] Multiple score input formats (import from ABC, etc.)
- [ ] MIDI playback mapping
- [ ] Western staff intermixing
- [ ] Custom font support for traditional glyphs
- [ ] Export to PDF/PNG
- [ ] Print stylesheet optimization
- [ ] Score transposition tool
- [ ] Automatic column breaking algorithm
