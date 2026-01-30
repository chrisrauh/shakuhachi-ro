# TODO - Shakuhachi Score Library Platform

This file tracks active tasks for the shakuhachi score library platform. Complete tasks in order, complete one task at a time, check if the task hasn't already been implemented, finish a task before starting the next, following the dev workflow defined in `CLAUDE.md`.

**Goal:** Transform shakuhachi-ro into a collaborative platform where users can create, share, and fork shakuhachi scores.
**Plan:** See implementation plan in session transcript

## Platform MVP - Current Tasks

## score page

- [ ] score should render on the page

### Scores in Database

- [ ] Parse the "Love Story.jpg" image and generate score data (requires OCR or manual transcription)
- [ ] Add Love Story to the database (blocked by parsing task)
- [ ] the landign page should be the library page

### Phase 6: Fork/Remix Functionality

- [ ] Implement forkScore(scoreId) in src/api/scores.ts
- [ ] Copy score data to new score
- [ ] Set user_id to current user
- [ ] Set forked_from to original score ID
- [ ] Increment fork_count on parent score
- [ ] Add "(Fork)" or "(Remix)" to title
- [ ] Create ForkButton component
- [ ] Show "Fork" button on score view (disabled if user owns score)
- [ ] On click: fork score, redirect to editor with forked copy
- [ ] Show fork count
- [ ] Display fork attribution on score view
- [ ] Show fork icon in library if score is a fork
- [ ] Test: Fork score, edit fork, verify independence

### Phase 7: User Profile

- [ ] Create profile.html page (URL: /profile.html?id=<user-id>)
- [ ] Display user's scores in grid
- [ ] Show username/email
- [ ] Link to each score
- [ ] Add edit/delete buttons (if own profile)
- [ ] Implement getUserScores(userId) query
- [ ] Add "My Scores" link in navigation
- [ ] Test: View own profile, view other user's profile

### Phase 8: Navigation & UI Polish

- [ ] Create site header component (logo, navigation)
- [ ] Add navigation links: Home | Create Score | My Scores | Profile
- [ ] Add auth UI: Login/Signup or Username/Logout
- [ ] Create footer with attribution
- [ ] Add consistent styling (CSS framework or custom)
- [ ] Implement responsive design (mobile, tablet, desktop)
- [ ] Add loading spinners and error states
- [ ] Polish form validation and error messages
- [ ] Test across browsers (Chrome, Firefox, Safari)

## Renderer Enhancements (Future)

- [ ] Add score selector dropdown
- [ ] Load different score files dynamically
- [ ] Add JSDoc comments to public APIs
- [ ] Write usage guide in references/README.md
- [ ] Document score data format

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

### Advanced Features (Post-MVP)

- [ ] Visual score editor (point-and-click note entry)
- [ ] OCR tool (scan physical scores to MusicXML/JSON)
- [ ] Collections (curated score groups)
- [ ] Version history (track edits over time)
- [ ] Comments/discussions on scores
- [ ] Pull request workflow (suggest changes to others' scores)
- [ ] Private scores (unlisted or private visibility)
- [ ] Export/download scores as files
- [ ] Print optimization (CSS for clean printouts)
- [ ] Advanced search (filter by tags, difficulty, date ranges)
- [ ] Multiple score input formats (import from ABC, etc.)
- [ ] MIDI playback mapping
- [ ] Western staff intermixing
- [ ] Custom font support for traditional glyphs
- [ ] Score transposition tool
